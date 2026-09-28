import { campaignRepository, CampaignRecord } from '../database/repositories/campaign.repository';
import { contactRepository } from '../database/repositories/contact.repository';
import { sessionManager } from '../engine/session.manager';
import { eventBus } from '../events/event-bus';
import { logger } from '../../utils/logger';
import { antiBlockingGuardService } from './antiblocking.service';
import { renderMessageTemplate } from '../utils/message-parser.util';
import * as xlsx from 'xlsx';
import { CronExpressionParser } from 'cron-parser';

export class CampaignService {
  private activeLoops: Map<string, boolean> = new Map();
  private scheduledWatcherInterval: NodeJS.Timeout | null = null;

  public createCampaign(data: {
    sessionId: string;
    name: string;
    templateText: string;
    mediaPath?: string;
    mediaType?: string;
    scheduleAt?: number;
    rateLimitPerMin?: number;
    randomDelayMin?: number;
    randomDelayMax?: number;
    isRecurring?: boolean;
    cronExpression?: string;
    maxRuns?: number;
    recipients: Array<{ phone: string; name?: string; variables?: Record<string, string> }>;
  }): string {
    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let scheduleAt = data.scheduleAt;
    let nextRunAt: number | undefined;

    if (data.isRecurring && data.cronExpression) {
      if (!scheduleAt) {
        scheduleAt = this.calculateNextCronRun(data.cronExpression);
      }
      nextRunAt = this.calculateNextCronRun(data.cronExpression, new Date((scheduleAt || Date.now()) + 1000));
    }

    campaignRepository.createCampaign({
      id: campaignId,
      sessionId: data.sessionId,
      name: data.name,
      templateText: data.templateText,
      mediaPath: data.mediaPath,
      mediaType: data.mediaType,
      scheduleAt,
      rateLimitPerMin: data.rateLimitPerMin,
      randomDelayMin: data.randomDelayMin,
      randomDelayMax: data.randomDelayMax,
      isRecurring: data.isRecurring,
      cronExpression: data.cronExpression,
      nextRunAt,
      maxRuns: data.maxRuns
    });

    if (data.recipients.length > 0) {
      campaignRepository.addRecipients(campaignId, data.recipients);
    }

    logger.info({ campaignId, recipientsCount: data.recipients.length, isRecurring: data.isRecurring }, 'Campaign created');
    return campaignId;
  }

  public async startCampaign(campaignId: string): Promise<void> {
    const camp = campaignRepository.findCampaignById(campaignId);
    if (!camp) throw new Error('Campaign not found');

    if (this.activeLoops.get(campaignId)) {
      logger.warn({ campaignId }, 'Campaign is already running');
      return;
    }

    campaignRepository.updateCampaignStatus(campaignId, 'RUNNING');
    this.activeLoops.set(campaignId, true);
    logger.info({ campaignId }, 'Starting campaign runner...');

    // Run in background
    this.runCampaignLoop(camp).catch((err) => {
      logger.error({ campaignId, err: err.message }, 'Campaign execution loop error');
      this.activeLoops.set(campaignId, false);
      campaignRepository.updateCampaignStatus(campaignId, 'PAUSED', `Error eksekusi campaign: ${err.message}`);
    });
  }

  public pauseCampaign(campaignId: string, reason?: string): void {
    this.activeLoops.set(campaignId, false);
    campaignRepository.updateCampaignStatus(campaignId, 'PAUSED', reason);
    if (reason) {
      const current = campaignRepository.findCampaignById(campaignId);
      eventBus.emit('campaign.updated', {
        campaignId,
        status: 'PAUSED',
        sent: current?.sent_count || 0,
        total: current?.total_recipients || 0,
        failed: current?.failed_count || 0,
        message: reason
      });
    }
    logger.info({ campaignId, reason }, 'Campaign paused');
  }

  public deleteCampaign(campaignId: string): void {
    this.activeLoops.set(campaignId, false);
    campaignRepository.deleteCampaign(campaignId);
    logger.info({ campaignId }, 'Campaign deleted');
  }

  public getRecipients(campaignId: string, limit = 100) {
    return campaignRepository.getCampaignRecipients(campaignId, limit);
  }

  public checkAndStartScheduledCampaigns(): void {
    const now = Date.now();
    const dueCampaigns = campaignRepository.findDueScheduledCampaigns(now);

    for (const campaign of dueCampaigns) {
      logger.info({ campaignId: campaign.id, scheduleAt: campaign.schedule_at }, '[Scheduler] Auto-starting scheduled campaign');
      try {
        this.startCampaign(campaign.id);
      } catch (err: any) {
        logger.error({ campaignId: campaign.id, err: err?.message }, '[Scheduler] Failed to auto-start scheduled campaign');
      }
    }
  }

  public startScheduledCampaignWatcher(intervalMs = 30000): void {
    if (this.scheduledWatcherInterval) return;
    this.checkAndStartScheduledCampaigns();
    this.scheduledWatcherInterval = setInterval(() => {
      this.checkAndStartScheduledCampaigns();
    }, intervalMs);
    logger.info({ intervalMs }, '[Scheduler] Scheduled campaign watcher started');
  }

  public parseRecipientsFromBuffer(buffer: Buffer, filename: string): Array<{ phone: string; name?: string; variables?: Record<string, string> }> {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<any>(sheet);

    const recipients: Array<{ phone: string; name?: string; variables?: Record<string, string> }> = [];

    for (const row of rows) {
      const rawPhone = row.phone || row.no_hp || row.nomor || row.telp || row.mobile || row.Phone || row.WhatsApp;
      if (!rawPhone) continue;

      let phone = String(rawPhone).replace(/[^0-9]/g, '');
      if (phone.length < 7) continue;

      if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1);
      } else if (phone.startsWith('8')) {
        phone = '62' + phone;
      }

      const name = row.name || row.nama || row.Nama || row.Name || '';
      const variables: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) {
        if (v !== undefined && v !== null) {
          variables[k] = String(v);
        }
      }

      recipients.push({
        phone,
        name: name || undefined,
        variables
      });
    }

    logger.info({ filename, count: recipients.length }, 'Parsed recipients from file buffer');
    return recipients;
  }

  public recoverInterruptedCampaigns(): void {
    const runningCampaigns = campaignRepository.findByStatus('RUNNING');
    if (runningCampaigns.length === 0) return;

    logger.info({ count: runningCampaigns.length }, '[Recovery] Checking interrupted campaigns on startup...');
    for (const campaign of runningCampaigns) {
      logger.info({ campaignId: campaign.id }, '[Recovery] Resuming interrupted campaign...');
      this.startCampaign(campaign.id).catch((err: any) => {
        logger.error({ campaignId: campaign.id, err: err?.message }, '[Recovery] Failed to resume campaign');
      });
    }
  }

  public calculateNextCronRun(cronExpression: string, fromDate = new Date()): number {
    try {
      const expr = cronExpression.trim();
      let cron = expr;
      if (expr === 'daily') cron = '0 9 * * *';
      else if (expr === 'weekly') cron = '0 9 * * 1';
      else if (expr === 'monthly') cron = '0 9 1 * *';
      else if (expr === 'hourly') cron = '0 * * * *';

      const interval = CronExpressionParser.parse(cron, { currentDate: fromDate });
      return interval.next().getTime();
    } catch (err: any) {
      logger.warn({ cronExpression, err: err?.message }, 'Failed to parse cron expression, defaulting to 24h interval');
      return fromDate.getTime() + 24 * 3600 * 1000;
    }
  }

  private async runCampaignLoop(camp: CampaignRecord): Promise<void> {
    let sentInBatch = 0;
    let lastSendAt = 0;

    while (this.activeLoops.get(camp.id)) {
      const items = campaignRepository.getNextQueuedRecipients(camp.id, 10);
      if (items.length === 0) {
        const currentCamp = campaignRepository.findCampaignById(camp.id);
        const isRecurring = Boolean(currentCamp?.is_recurring);
        const cronExpr = currentCamp?.cron_expression;
        const currentRuns = currentCamp?.runs_count || 0;
        const maxRuns = currentCamp?.max_runs || 0;

        if (isRecurring && cronExpr && (maxRuns === 0 || currentRuns + 1 < maxRuns)) {
          const nextSchedule = this.calculateNextCronRun(cronExpr);
          const followingRun = this.calculateNextCronRun(cronExpr, new Date(nextSchedule + 1000));
          logger.info(
            { campaignId: camp.id, nextSchedule: new Date(nextSchedule).toISOString(), runs: currentRuns + 1 },
            '[Scheduler] Recurring campaign run finished. Rescheduling for next cycle...'
          );
          campaignRepository.resetRecipientsForRecurring(camp.id, nextSchedule, followingRun);
          this.activeLoops.delete(camp.id);
          eventBus.emit('campaign.updated', {
            campaignId: camp.id,
            status: 'SCHEDULED',
            sent: 0,
            total: currentCamp?.total_recipients || 0,
            failed: 0,
            message: `Recurring campaign rescheduled for ${new Date(nextSchedule).toLocaleString('id-ID')}`
          });
        } else {
          logger.info({ campaignId: camp.id }, 'All recipients processed. Campaign completed.');
          campaignRepository.updateCampaignStatus(camp.id, 'COMPLETED', 'Semua penerima telah diproses.');
          this.activeLoops.delete(camp.id);
          eventBus.emit('campaign.updated', {
            campaignId: camp.id,
            status: 'COMPLETED',
            sent: currentCamp?.sent_count || 0,
            total: currentCamp?.total_recipients || 0,
            failed: currentCamp?.failed_count || 0
          });
        }
        break;
      }

      for (const item of items) {
        if (!this.activeLoops.get(camp.id)) break;

        // Rate limit enforcement (messages per minute) - bug fix: was stored but never enforced
        const rateLimitPerMin = camp.rate_limit_per_minute || 0;
        if (rateLimitPerMin > 0 && lastSendAt > 0) {
          const minIntervalMs = 60000 / rateLimitPerMin;
          const elapsed = Date.now() - lastSendAt;
          if (elapsed < minIntervalMs) {
            const waitMs = minIntervalMs - elapsed;
            logger.debug({ campaignId: camp.id, waitMs }, '[RateLimit] Throttling to respect rate_limit_per_minute');
            await this.delay(waitMs);
          }
        }

        // Anti-Blocking & Risk Mitigation Check (Warm-up, Daily Rate Limit, Circuit Breaker, Operating Hours)
        const antiCheck = antiBlockingGuardService.canDispatchMessage(camp.session_id);
        if (!antiCheck.allowed) {
          logger.warn({ campaignId: camp.id, reason: antiCheck.reason }, '[Anti-Blocking] Pausing campaign execution');
          this.pauseCampaign(camp.id, `Kampanye dijeda oleh Anti-Blocking Guard: ${antiCheck.reason}`);
          break;
        }

        // Check compliance: Opt-out suppression
        const contact = contactRepository.findByPhone(camp.session_id, item.phone);
        if (contact?.opt_out) {
          logger.info({ campaignId: camp.id, phone: item.phone }, 'Skipped recipient due to Opt-Out');
          campaignRepository.updateRecipientStatus(item.id, 'FAILED', 'Recipient opted out');
          continue;
        }

        let session;
        try {
          session = sessionManager.getSession(camp.session_id);
        } catch {
          session = null;
        }

        if (!session || session.getStatus() !== 'CONNECTED') {
          logger.warn({ campaignId: camp.id }, 'Session is disconnected. Automatically pausing campaign to protect remaining recipients.');
          this.pauseCampaign(
            camp.id,
            'Kampanye otomatis dijeda karena koneksi WhatsApp terputus. Sambungkan kembali sesi lalu klik Lanjutkan.'
          );
          break;
        }

        let sendSuccess = false;
        let lastErrorMsg = '';

        // Auto-retry mechanism (1x retry on timeout/failure)
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            // Human typing simulation
            if (session.sendPresence) {
              try {
                await session.sendPresence(item.phone, 'composing');
                const typingDelay = this.getRandomInt(1200, 2200);
                await this.delay(typingDelay);
              } catch {
                // ignore presence error
              }
            }

            const messageText = this.interpolate(camp.template_text, item.name || '', item.phone, item.variables);

            if (camp.media_path && camp.media_type) {
              await session.sendMedia(item.phone, camp.media_path, {
                type: camp.media_type as any,
                caption: messageText
              });
            } else {
              await session.sendText(item.phone, messageText);
            }

            campaignRepository.updateRecipientStatus(item.id, 'SENT');
            sentInBatch++;
            sendSuccess = true;
            break;
          } catch (err: any) {
            lastErrorMsg = err?.message || 'Error pengiriman';
            logger.warn({ campaignId: camp.id, phone: item.phone, attempt, err: lastErrorMsg }, 'Campaign send attempt failed');
            if (attempt === 1) {
              await this.delay(2000); // Wait 2s before retry
            }
          }
        }

        if (!sendSuccess) {
          logger.error({ campaignId: camp.id, phone: item.phone, err: lastErrorMsg }, 'Failed to send campaign message after retry');
          campaignRepository.updateRecipientStatus(item.id, 'FAILED', lastErrorMsg);
        }

        lastSendAt = Date.now();

        // Record Anti-Blocking metrics & risk calculation
        antiBlockingGuardService.recordSendResult(camp.session_id, sendSuccess, lastErrorMsg);

        // Notify UI of campaign progress
        const current = campaignRepository.findCampaignById(camp.id);
        if (current) {
          eventBus.emit('campaign.updated', {
            campaignId: camp.id,
            status: current.status,
            sent: current.sent_count,
            total: current.total_recipients,
            failed: current.failed_count
          });
        }

        // Batch pause safeguard
        if (sentInBatch >= camp.batch_pause_after) {
          logger.info({ campaignId: camp.id, pauseSec: camp.batch_pause_seconds }, 'Taking batch pause...');
          await this.delay(camp.batch_pause_seconds * 1000);
          sentInBatch = 0;
        } else {
          // Random delay safeguard
          const delaySec = this.getRandomInt(camp.random_delay_min, camp.random_delay_max);
          await this.delay(delaySec * 1000);
        }
      }
    }
  }

  private interpolate(template: string, name: string, phone: string, variables: Record<string, string> = {}): string {
    return renderMessageTemplate(template, {
      name: name || 'Sahabat',
      phone: phone || '',
      ...variables
    });
  }

  private getRandomInt(min: number, max: number): number {
    const minCeil = Math.ceil(min);
    const maxFloor = Math.floor(max);
    return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const campaignService = new CampaignService();
