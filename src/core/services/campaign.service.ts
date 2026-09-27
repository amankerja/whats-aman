import { campaignRepository, CampaignRecord } from '../database/repositories/campaign.repository';
import { contactRepository } from '../database/repositories/contact.repository';
import { sessionManager } from '../engine/session.manager';
import { eventBus } from '../events/event-bus';
import { logger } from '../../utils/logger';

export class CampaignService {
  private activeLoops: Map<string, boolean> = new Map();

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
    recipients: Array<{ phone: string; name?: string; variables?: Record<string, string> }>;
  }): string {
    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    campaignRepository.createCampaign({
      id: campaignId,
      sessionId: data.sessionId,
      name: data.name,
      templateText: data.templateText,
      mediaPath: data.mediaPath,
      mediaType: data.mediaType,
      scheduleAt: data.scheduleAt,
      rateLimitPerMin: data.rateLimitPerMin,
      randomDelayMin: data.randomDelayMin,
      randomDelayMax: data.randomDelayMax
    });

    if (data.recipients.length > 0) {
      campaignRepository.addRecipients(campaignId, data.recipients);
    }

    logger.info({ campaignId, recipientsCount: data.recipients.length }, 'Campaign created');
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
      campaignRepository.updateCampaignStatus(campaignId, 'PAUSED');
    });
  }

  public pauseCampaign(campaignId: string): void {
    this.activeLoops.set(campaignId, false);
    campaignRepository.updateCampaignStatus(campaignId, 'PAUSED');
    logger.info({ campaignId }, 'Campaign paused');
  }

  private async runCampaignLoop(camp: CampaignRecord): Promise<void> {
    let sentInBatch = 0;

    while (this.activeLoops.get(camp.id)) {
      const items = campaignRepository.getNextQueuedRecipients(camp.id, 10);
      if (items.length === 0) {
        logger.info({ campaignId: camp.id }, 'All recipients processed. Campaign completed.');
        campaignRepository.updateCampaignStatus(camp.id, 'COMPLETED');
        this.activeLoops.delete(camp.id);
        break;
      }

      for (const item of items) {
        if (!this.activeLoops.get(camp.id)) break;

        // Check compliance: Opt-out suppression
        const contact = contactRepository.findByPhone(camp.session_id, item.phone);
        if (contact?.opt_out) {
          logger.info({ campaignId: camp.id, phone: item.phone }, 'Skipped recipient due to Opt-Out');
          campaignRepository.updateRecipientStatus(item.id, 'FAILED', 'Recipient opted out');
          continue;
        }

        try {
          const session = sessionManager.getSession(camp.session_id);
          const messageText = this.interpolate(camp.template_text, item.name || '', item.variables);

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
        } catch (err: any) {
          logger.error({ campaignId: camp.id, phone: item.phone, err: err.message }, 'Failed to send campaign message');
          campaignRepository.updateRecipientStatus(item.id, 'FAILED', err.message);
        }

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

  private interpolate(template: string, name: string, variables: Record<string, string>): string {
    // 1. Spintax: {Halo|Hai|Selamat Pagi}
    let res = template.replace(/\{([^{}]+)\}/g, (_, choices) => {
      const parts = choices.split('|');
      return parts[Math.floor(Math.random() * parts.length)].trim();
    });

    // 2. Name variable
    res = res.replace(/\{\{name\}\}/gi, name || 'Sahabat');

    // 3. Custom variables
    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
      res = res.replace(regex, val || '');
    }

    return res;
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
