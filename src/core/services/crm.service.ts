import { crmRepository, FollowUpTaskRecord, SequenceRecord, SequenceStep } from '../database/repositories/crm.repository';
import { contactRepository } from '../database/repositories/contact.repository';
import { sessionManager } from '../engine/session.manager';
import { getDatabase } from '../database/connection';
import { logger } from '../../utils/logger';
import { renderMessageTemplate } from '../utils/message-parser.util';

export class CRMService {
  public createTask(data: {
    sessionId: string;
    contactPhone: string;
    contactName?: string;
    title: string;
    messageTemplate: string;
    dueAt: number;
    sequenceId?: string;
    stepNumber?: number;
    notes?: string;
  }): FollowUpTaskRecord {
    const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    crmRepository.createTask({
      id,
      sessionId: data.sessionId,
      contactPhone: data.contactPhone,
      contactName: data.contactName,
      title: data.title,
      messageTemplate: data.messageTemplate,
      dueAt: data.dueAt,
      sequenceId: data.sequenceId,
      stepNumber: data.stepNumber || 1,
      notes: data.notes
    });

    const task = crmRepository.findTaskById(id);
    return task!;
  }

  public getTasks(sessionId: string, filter?: { status?: string; phone?: string; limit?: number; offset?: number }) {
    return crmRepository.findTasks(sessionId, filter);
  }

  public async executeTask(taskId: string): Promise<{ success: boolean; message: string }> {
    const task = crmRepository.findTaskById(taskId);
    if (!task) throw new Error('Follow-up task tidak ditemukan');
    if (task.status === 'COMPLETED') throw new Error('Task ini sudah pernah dieksekusi sebelumnya');

    const session = sessionManager.getSession(task.session_id);
    if (!session) throw new Error('Sesi WhatsApp tidak aktif atau tidak ditemukan');

    // Human typing simulation (composing)
    try {
      if (session.sendPresence) {
        await session.sendPresence(task.contact_phone, 'composing');
        await new Promise((r) => setTimeout(r, 1200));
      }
    } catch {
      // presence error can be safely ignored
    }

    // Interpolate variables & Spintax
    const contact = contactRepository.findByPhone(task.session_id, task.contact_phone);
    const resolvedName = task.contact_name || contact?.name || contact?.push_name || 'Sahabat';
    const messageText = this.interpolate(task.message_template, {
      name: resolvedName,
      phone: task.contact_phone,
      title: task.title
    });

    // Send WhatsApp text
    await session.sendText(task.contact_phone, messageText);

    // Update status to COMPLETED
    crmRepository.updateTaskStatus(taskId, 'COMPLETED', `Terkirim pada ${new Date().toLocaleString('id-ID')}`);

    // If task was part of a sequence, check and schedule the next step
    if (task.sequence_id) {
      this.scheduleNextSequenceStep(task);
    }

    logger.info({ taskId, phone: task.contact_phone }, 'Follow-up task executed successfully');
    return { success: true, message: `Pesan follow-up berhasil dikirim ke ${task.contact_phone}` };
  }

  public cancelTask(taskId: string, reason?: string): void {
    crmRepository.updateTaskStatus(taskId, 'CANCELLED', reason || 'Dibatalkan manual oleh pengguna');
  }

  public deleteTask(taskId: string): void {
    crmRepository.deleteTask(taskId);
  }

  // Auto-Stop Sequencer: Called when a customer replies with an incoming message
  public autoStopSequenceForContact(sessionId: string, phone: string): number {
    const count = crmRepository.cancelPendingTasksForPhone(
      sessionId,
      phone,
      'Auto-stopped: Pelanggan telah membalas pesan'
    );
    if (count > 0) {
      logger.info({ sessionId, phone, count }, 'Auto-stopped pending sequence follow-up tasks due to customer reply');
    }
    return count;
  }

  // Sequences
  public createSequence(data: {
    sessionId: string;
    id?: string;
    name: string;
    description?: string;
    steps: SequenceStep[];
  }): SequenceRecord {
    const id = data.id || `seq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    crmRepository.createSequence({
      id,
      sessionId: data.sessionId,
      name: data.name,
      description: data.description,
      steps: data.steps
    });
    return crmRepository.findSequenceById(id)!;
  }

  public getSequences(sessionId: string): SequenceRecord[] {
    const list = crmRepository.findSequences(sessionId);
    if (list.length === 0) {
      this.seedDefaultSequences(sessionId);
      return crmRepository.findSequences(sessionId);
    }
    return list;
  }

  public deleteSequence(id: string): void {
    crmRepository.deleteSequence(id);
  }

  public applySequenceToContact(sessionId: string, phone: string, sequenceId: string, contactName?: string): FollowUpTaskRecord {
    const seq = crmRepository.findSequenceById(sequenceId);
    if (!seq || seq.steps.length === 0) throw new Error('Sequence tidak valid atau belum memiliki langkah/step');

    const firstStep = seq.steps.sort((a, b) => a.stepNumber - b.stepNumber)[0];
    const delayMs = (firstStep.delayDays * 24 * 3600 * 1000) + ((firstStep.delayHours || 0) * 3600 * 1000);
    const dueAt = Date.now() + Math.max(delayMs, 10000); // minimum 10 seconds

    if (!this.isAutoDispatchEnabled) {
      this.setAutoDispatch(true);
    }

    return this.createTask({
      sessionId,
      contactPhone: phone,
      contactName,
      title: `${seq.name} - Step ${firstStep.stepNumber}: ${firstStep.title}`,
      messageTemplate: firstStep.template,
      dueAt,
      sequenceId: seq.id,
      stepNumber: firstStep.stepNumber
    });
  }

  private scheduleNextSequenceStep(currentTask: FollowUpTaskRecord): void {
    if (!currentTask.sequence_id) return;
    const seq = crmRepository.findSequenceById(currentTask.sequence_id);
    if (!seq) return;

    const nextStep = seq.steps.find((s) => s.stepNumber === currentTask.step_number + 1);
    if (!nextStep) {
      logger.info({ sequenceId: seq.id, phone: currentTask.contact_phone }, 'Sequence completed all steps');
      return;
    }

    const delayMs = (nextStep.delayDays * 24 * 3600 * 1000) + ((nextStep.delayHours || 0) * 3600 * 1000);
    const dueAt = Date.now() + delayMs;

    this.createTask({
      sessionId: currentTask.session_id,
      contactPhone: currentTask.contact_phone,
      contactName: currentTask.contact_name,
      title: `${seq.name} - Step ${nextStep.stepNumber}: ${nextStep.title}`,
      messageTemplate: nextStep.template,
      dueAt,
      sequenceId: seq.id,
      stepNumber: nextStep.stepNumber
    });

    logger.info(
      { sequenceId: seq.id, step: nextStep.stepNumber, phone: currentTask.contact_phone, dueAt },
      'Scheduled next step in sequence'
    );
  }

  // Sales CRM Analytics & Funnel
  public getSalesAnalytics(sessionId: string, timeRange: 'today' | '7d' | '30d' | '90d' | 'all' = '7d') {
    const db = getDatabase();
    const now = Date.now();
    let startTime = 0;

    if (timeRange === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      startTime = todayStart.getTime();
    } else if (timeRange === '7d') {
      startTime = now - (7 * 24 * 3600 * 1000);
    } else if (timeRange === '30d') {
      startTime = now - (30 * 24 * 3600 * 1000);
    } else if (timeRange === '90d') {
      startTime = now - (90 * 24 * 3600 * 1000);
    }

    // 1. Leads
    const totalLeadsRow = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE session_id = ?').get(sessionId) as any;
    const totalLeads = totalLeadsRow?.count || 0;

    const newLeadsRow = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE session_id = ? AND created_at >= ?').get(sessionId, startTime) as any;
    const newLeads = newLeadsRow?.count || 0;

    const hotLeadsRow = db.prepare("SELECT COUNT(*) as count FROM contacts WHERE session_id = ? AND tags LIKE '%Hot Lead%'").get(sessionId) as any;
    const hotLeads = hotLeadsRow?.count || 0;

    // 2. Converted Customers
    const customerRow = db.prepare("SELECT COUNT(*) as count FROM contacts WHERE session_id = ? AND (pipeline_stage = 'customer' OR tags LIKE '%Sudah Membeli%')").get(sessionId) as any;
    const convertedCustomers = customerRow?.count || 0;

    // 3. Follow-up tasks
    const fuDueRow = db.prepare("SELECT COUNT(*) as count FROM follow_up_tasks WHERE session_id = ? AND status = 'PENDING' AND due_at <= ?").get(sessionId, now) as any;
    const followUpDue = fuDueRow?.count || 0;

    const fuCompletedRow = db.prepare("SELECT COUNT(*) as count FROM follow_up_tasks WHERE session_id = ? AND status = 'COMPLETED' AND updated_at >= ?").get(sessionId, startTime) as any;
    const followUpCompleted = fuCompletedRow?.count || 0;

    // 4. Conversion Rate & Reply Rate
    const conversionRate = totalLeads > 0 ? Number(((convertedCustomers / totalLeads) * 100).toFixed(1)) : 0;

    const sentMsgs = db.prepare('SELECT COUNT(*) as count FROM messages WHERE session_id = ? AND from_me = 1 AND timestamp >= ?').get(sessionId, startTime) as any;
    const recvMsgs = db.prepare("SELECT COUNT(*) as count FROM messages WHERE session_id = ? AND from_me = 0 AND chat_jid NOT LIKE '%@g.us' AND timestamp >= ?").get(sessionId, startTime) as any;
    const totalSent = sentMsgs?.count || 0;
    const totalRecv = recvMsgs?.count || 0;
    const replyRate = totalSent > 0 ? Number(((totalRecv / totalSent) * 100).toFixed(1)) : 0;

    // 5. Stage Breakdown
    const stages = ['lead', 'prospect', 'customer', 'churned'];
    const stageCounts: Record<string, number> = { lead: 0, prospect: 0, customer: 0, churned: 0 };
    for (const stage of stages) {
      const r = db.prepare('SELECT COUNT(*) as count FROM contacts WHERE session_id = ? AND pipeline_stage = ?').get(sessionId, stage) as any;
      stageCounts[stage] = r?.count || 0;
    }

    return {
      timeRange,
      totalLeads,
      newLeads,
      hotLeads,
      convertedCustomers,
      conversionRate,
      followUpDue,
      followUpCompleted,
      totalSent,
      totalRecv,
      replyRate,
      stageCounts
    };
  }

  // Export report to CSV
  public exportReportCSV(sessionId: string): string {
    const stats = this.getSalesAnalytics(sessionId, 'all');
    const { data: tasks } = this.getTasks(sessionId, { limit: 1000 });
    const contacts = contactRepository.findAll(sessionId, 5000, 0);

    let csv = '=== LAPORAN SALES CRM & AUTOMATION (AMAN CHAT PRO) ===\n\n';
    csv += 'METRIK SALES FUNNEL,NILAI\n';
    csv += `Total Leads,${stats.totalLeads}\n`;
    csv += `Hot Leads,${stats.hotLeads}\n`;
    csv += `Converted Customers,${stats.convertedCustomers}\n`;
    csv += `Conversion Rate,${stats.conversionRate}%\n`;
    csv += `Follow-up Due,${stats.followUpDue}\n`;
    csv += `Follow-up Selesai,${stats.followUpCompleted}\n`;
    csv += `Reply Rate,${stats.replyRate}%\n\n`;

    csv += '=== DAFTAR TUGAS FOLLOW-UP ===\n';
    csv += 'ID,No HP,Nama,Judul,Status,Jatuh Tempo,Catatan\n';
    for (const t of tasks) {
      const dueStr = new Date(t.due_at).toISOString();
      csv += `"${t.id}","${t.contact_phone}","${t.contact_name || ''}","${t.title}","${t.status}","${dueStr}","${t.notes || ''}"\n`;
    }

    csv += '\n=== DAFTAR KONTAK CRM ===\n';
    csv += 'No HP,Nama,Pipeline Stage,Tags,Catatan\n';
    for (const c of contacts) {
      csv += `"${c.phone}","${c.name || c.push_name || ''}","${c.pipeline_stage.toUpperCase()}","${c.tags.join('; ')}","${c.notes}"\n`;
    }

    return csv;
  }

  private schedulerInterval: NodeJS.Timeout | null = null;
  private isAutoDispatchEnabled: boolean = false;
  private isDispatching: boolean = false;

  constructor() {
    this.initSettings();
    this.startBackgroundScheduler();
  }

  private initSettings(): void {
    const db = getDatabase();
    try {
      const row = db.prepare("SELECT value FROM settings WHERE key = 'crm_auto_dispatch_enabled'").get() as any;
      if (row) {
        this.isAutoDispatchEnabled = row.value === 'true' || row.value === '1';
      } else {
        this.setAutoDispatch(true);
      }
    } catch {
      this.isAutoDispatchEnabled = true;
    }
  }

  public isAutoDispatchActive(): boolean {
    return this.isAutoDispatchEnabled;
  }

  public setAutoDispatch(enabled: boolean): void {
    this.isAutoDispatchEnabled = enabled;
    const db = getDatabase();
    const now = Date.now();
    db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('crm_auto_dispatch_enabled', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(String(enabled), now);
    logger.info({ enabled }, 'CRM follow-up auto-dispatch setting updated');
  }

  public startBackgroundScheduler(): void {
    if (this.schedulerInterval) return;
    this.schedulerInterval = setInterval(() => {
      this.checkAndDispatchDueTasks();
    }, 60000); // Check every 60 seconds
  }

  public async checkAndDispatchDueTasks(): Promise<void> {
    if (!this.isAutoDispatchEnabled || this.isDispatching) return;
    this.isDispatching = true;

    try {
      const db = getDatabase();
      const now = Date.now();
      const dueTasks = db.prepare(`
        SELECT id, session_id FROM follow_up_tasks
        WHERE status = 'PENDING' AND due_at <= ?
        ORDER BY due_at ASC
        LIMIT 5
      `).all(now) as Array<{ id: string; session_id: string }>;

      for (const t of dueTasks) {
        let session;
        try {
          session = sessionManager.getSession(t.session_id);
        } catch {
          continue;
        }

        if (session && session.getStatus() === 'CONNECTED') {
          try {
            logger.info({ taskId: t.id }, 'Background scheduler auto-dispatching due follow-up task');
            await this.executeTask(t.id);
            await new Promise((r) => setTimeout(r, 10000));
          } catch (err: any) {
            logger.warn({ taskId: t.id, err: err?.message }, 'Failed auto-dispatching follow-up task');
          }
        }
      }
    } catch (err: any) {
      logger.error({ err: err?.message }, 'Error in CRM background scheduler');
    } finally {
      this.isDispatching = false;
    }
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    return renderMessageTemplate(template, vars);
  }

  private seedDefaultSequences(sessionId: string): void {
    const defaultSeq = {
      id: `seq_lead_nurture_${sessionId.substring(0, 8)}`,
      sessionId,
      name: 'Nurturing & Closing Follow-up Sequence',
      description: 'Otomasi 3 langkah follow-up prospek baru dengan proteksi Auto-Stop saat pelanggan membalas.',
      steps: [
        {
          stepNumber: 1,
          delayDays: 1,
          title: 'Follow-up 1: Sapaan & Tanya Kebutuhan',
          template: '{Halo|Hai} kak {{name}}! 👋\n\nKemarin sempat tanya-tanya informasi produk kami ya? Apakah ada yang masih ingin ditanyakan atau butuh info promo spesial hari ini? 😊'
        },
        {
          stepNumber: 2,
          delayDays: 3,
          title: 'Follow-up 2: Testimoni & Penawaran Terbatas',
          template: '{Selamat pagi|Halo} kak {{name}}, sekadar info kalau promo potongan harga spesial kami akan berakhir segera lho.\n\nBanyak customer kami yang puas setelah mencoba. Jika ada pertanyaan, kami siap bantu ya kak! 🙏'
        },
        {
          stepNumber: 3,
          delayDays: 7,
          title: 'Follow-up 3: Final Call / Check-in',
          template: 'Halo kak {{name}}, semoga harinya menyenangkan! 🙏\n\nKami izin konfirmasi, apakah penawaran kemarin masih relevan untuk kakak? Jika belum butuh saat ini tidak apa-apa, simpan kontak kami ya jika suatu saat dibutuhkan. Terima kasih! ✨'
        }
      ]
    };
    crmRepository.createSequence(defaultSeq);
  }
}

export const crmService = new CRMService();
