import { getDatabase } from '../connection';

export interface CampaignRecord {
  id: string;
  session_id: string;
  name: string;
  template_text: string;
  media_path?: string;
  media_type?: string;
  schedule_at?: number;
  rate_limit_per_minute: number;
  random_delay_min: number;
  random_delay_max: number;
  batch_pause_after: number;
  batch_pause_seconds: number;
  status: 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  is_recurring?: number;
  cron_expression?: string;
  next_run_at?: number;
  max_runs?: number;
  runs_count?: number;
  last_message?: string;
  created_at: number;
  updated_at: number;
}

export interface CampaignRecipientRecord {
  id: string;
  campaign_id: string;
  phone: string;
  name?: string;
  variables: Record<string, string>;
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED';
  error_message?: string;
  sent_at?: number;
  delivered_at?: number;
  read_at?: number;
}

export class CampaignRepository {
  private get db() {
    return getDatabase();
  }

  public createCampaign(data: {
    id: string;
    sessionId: string;
    name: string;
    templateText: string;
    mediaPath?: string;
    mediaType?: string;
    scheduleAt?: number;
    rateLimitPerMin?: number;
    randomDelayMin?: number;
    randomDelayMax?: number;
    status?: CampaignRecord['status'];
    isRecurring?: boolean;
    cronExpression?: string;
    nextRunAt?: number;
    maxRuns?: number;
  }): void {
    const now = Date.now();
    const initialStatus = data.status || (data.scheduleAt ? 'SCHEDULED' : 'DRAFT');
    const stmt = this.db.prepare(`
      INSERT INTO campaigns (
        id, session_id, name, template_text, media_path, media_type,
        schedule_at, rate_limit_per_minute, random_delay_min, random_delay_max,
        status, total_recipients, sent_count, delivered_count, read_count, failed_count,
        is_recurring, cron_expression, next_run_at, max_runs, runs_count,
        created_at, updated_at
      ) VALUES (
        @id, @session_id, @name, @template_text, @media_path, @media_type,
        @schedule_at, @rate_limit_per_minute, @random_delay_min, @random_delay_max,
        @status, 0, 0, 0, 0, 0,
        @is_recurring, @cron_expression, @next_run_at, @max_runs, 0,
        @created_at, @updated_at
      )
    `);

    stmt.run({
      id: data.id,
      session_id: data.sessionId,
      name: data.name,
      template_text: data.templateText,
      media_path: data.mediaPath || null,
      media_type: data.mediaType || null,
      schedule_at: data.scheduleAt || null,
      rate_limit_per_minute: data.rateLimitPerMin || 20,
      random_delay_min: data.randomDelayMin || 5,
      random_delay_max: data.randomDelayMax || 15,
      status: initialStatus,
      is_recurring: data.isRecurring ? 1 : 0,
      cron_expression: data.cronExpression || null,
      next_run_at: data.nextRunAt || null,
      max_runs: data.maxRuns || 0,
      created_at: now,
      updated_at: now
    });
  }

  public findDueScheduledCampaigns(now: number): CampaignRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM campaigns
      WHERE status = 'SCHEDULED'
        AND schedule_at IS NOT NULL
        AND schedule_at <= ?
      ORDER BY schedule_at ASC
    `);
    return stmt.all(now) as CampaignRecord[];
  }

  public addRecipients(campaignId: string, recipients: Array<{ phone: string; name?: string; variables?: Record<string, string> }>): void {
    const insert = this.db.prepare(`
      INSERT INTO campaign_recipients (id, campaign_id, phone, name, variables, status)
      VALUES (?, ?, ?, ?, ?, 'QUEUED')
    `);

    const updateCount = this.db.prepare(`
      UPDATE campaigns SET
        total_recipients = total_recipients + ?,
        updated_at = ?
      WHERE id = ?
    `);

    const transaction = this.db.transaction((items) => {
      let added = 0;
      for (const item of items) {
        const id = `${campaignId}:${item.phone}:${Date.now()}:${Math.random().toString(36).substring(2, 6)}`;
        insert.run(id, campaignId, item.phone, item.name || null, JSON.stringify(item.variables || {}));
        added++;
      }
      updateCount.run(added, Date.now(), campaignId);
    });

    transaction(recipients);
  }

  public findCampaignById(id: string): CampaignRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM campaigns WHERE id = ?');
    return stmt.get(id) as CampaignRecord | undefined;
  }

  public findAllCampaigns(sessionId?: string): CampaignRecord[] {
    if (sessionId) {
      const stmt = this.db.prepare('SELECT * FROM campaigns WHERE session_id = ? ORDER BY created_at DESC');
      return stmt.all(sessionId) as CampaignRecord[];
    }
    const stmt = this.db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC');
    return stmt.all() as CampaignRecord[];
  }

  public findByStatus(status: CampaignRecord['status']): CampaignRecord[] {
    const stmt = this.db.prepare('SELECT * FROM campaigns WHERE status = ? ORDER BY created_at ASC');
    return stmt.all(status) as CampaignRecord[];
  }

  public updateCampaignStatus(id: string, status: CampaignRecord['status'], message?: string): void {
    const stmt = this.db.prepare(
      message !== undefined
        ? 'UPDATE campaigns SET status = ?, last_message = ?, updated_at = ? WHERE id = ?'
        : 'UPDATE campaigns SET status = ?, updated_at = ? WHERE id = ?'
    );
    if (message !== undefined) {
      stmt.run(status, message, Date.now(), id);
    } else {
      stmt.run(status, Date.now(), id);
    }
  }

  public setLastMessage(id: string, message: string): void {
    const stmt = this.db.prepare('UPDATE campaigns SET last_message = ?, updated_at = ? WHERE id = ?');
    stmt.run(message, Date.now(), id);
  }

  public resetRecipientsForRecurring(campaignId: string, nextScheduleAt: number, nextRunAt?: number): void {
    const now = Date.now();
    const resetRecipientsStmt = this.db.prepare(`
      UPDATE campaign_recipients 
      SET status = 'QUEUED', error_message = NULL, sent_at = NULL, delivered_at = NULL, read_at = NULL
      WHERE campaign_id = ?
    `);
    const updateCampaignStmt = this.db.prepare(`
      UPDATE campaigns 
      SET status = 'SCHEDULED',
          schedule_at = ?,
          next_run_at = ?,
          runs_count = runs_count + 1,
          sent_count = 0,
          failed_count = 0,
          delivered_count = 0,
          read_count = 0,
          updated_at = ?
      WHERE id = ?
    `);

    const tx = this.db.transaction(() => {
      resetRecipientsStmt.run(campaignId);
      updateCampaignStmt.run(nextScheduleAt, nextRunAt || null, now, campaignId);
    });
    tx();
  }

  public getNextQueuedRecipients(campaignId: string, limit = 10): CampaignRecipientRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM campaign_recipients
      WHERE campaign_id = ? AND status = 'QUEUED'
      LIMIT ?
    `);
    const rows = stmt.all(campaignId, limit) as any[];
    return rows.map((r) => ({
      ...r,
      variables: JSON.parse(r.variables || '{}')
    }));
  }

  public updateRecipientStatus(
    id: string,
    status: CampaignRecipientRecord['status'],
    errorMessage?: string
  ): void {
    const stmt = this.db.prepare(`
      UPDATE campaign_recipients SET
        status = @status,
        error_message = @error_message,
        sent_at = CASE WHEN @status = 'SENT' THEN @now ELSE sent_at END
      WHERE id = @id
    `);

    stmt.run({
      id,
      status,
      error_message: errorMessage || null,
      now: Date.now()
    });

    // Update campaign metrics
    if (status === 'SENT') {
      this.db.prepare('UPDATE campaigns SET sent_count = sent_count + 1 WHERE id = (SELECT campaign_id FROM campaign_recipients WHERE id = ?)').run(id);
    } else if (status === 'FAILED') {
      this.db.prepare('UPDATE campaigns SET failed_count = failed_count + 1 WHERE id = (SELECT campaign_id FROM campaign_recipients WHERE id = ?)').run(id);
    }
  }

  public getCampaignRecipients(campaignId: string, limit = 100): CampaignRecipientRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM campaign_recipients
      WHERE campaign_id = ?
      ORDER BY rowid ASC
      LIMIT ?
    `);
    const rows = stmt.all(campaignId, limit) as any[];
    return rows.map((r) => ({
      ...r,
      variables: JSON.parse(r.variables || '{}')
    }));
  }

  public deleteCampaign(id: string): void {
    this.db.prepare('DELETE FROM campaign_recipients WHERE campaign_id = ?').run(id);
    this.db.prepare('DELETE FROM campaigns WHERE id = ?').run(id);
  }
}

export const campaignRepository = new CampaignRepository();
