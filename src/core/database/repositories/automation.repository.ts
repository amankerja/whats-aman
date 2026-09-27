import { getDatabase } from '../connection';

export interface AutomationCondition {
  field: 'text' | 'sender' | 'is_group';
  operator: 'contains' | 'equals' | 'starts_with' | 'regex';
  value: string;
}

export interface AutomationAction {
  type: 'send_text' | 'send_media' | 'reply_text' | 'add_tag' | 'set_stage' | 'apply_sequence' | 'reply_webhook';
  text?: string;
  mediaPath?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  tag?: string;
  stage?: 'lead' | 'prospect' | 'customer' | 'churned';
  sequenceId?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  timeoutMs?: number;
}

export interface AutoReplyConfig {
  autoReplyEnabled?: boolean;
  businessHoursEnabled: boolean;
  businessHoursStart: string; // e.g. "08:00"
  businessHoursEnd: string;   // e.g. "17:00"
  businessDays: number[];     // [1,2,3,4,5] (1=Senin..7=Minggu)
  offlineReplyEnabled: boolean;
  offlineReplyText: string;
  cooldownMinutes: number;    // e.g. 5
  fallbackEnabled: boolean;
  fallbackReplyText: string;
  simulateTyping: boolean;
}

export interface AutomationRuleRecord {
  id: string;
  session_id?: string;
  name: string;
  trigger_type: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  is_active: boolean;
  hit_count: number;
  created_at: number;
  updated_at: number;
}

export class AutomationRepository {
  private get db() {
    return getDatabase();
  }

  public upsert(rule: {
    id: string;
    sessionId?: string;
    name: string;
    conditions: AutomationCondition[];
    actions: AutomationAction[];
    isActive?: boolean;
  }): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO automation_rules (
        id, session_id, name, conditions, actions, is_active, hit_count, created_at, updated_at
      ) VALUES (
        @id, @session_id, @name, @conditions, @actions, @is_active, 0, @created_at, @updated_at
      )
      ON CONFLICT(id) DO UPDATE SET
        name = @name,
        session_id = @session_id,
        conditions = @conditions,
        actions = @actions,
        is_active = @is_active,
        updated_at = @updated_at
    `);

    stmt.run({
      id: rule.id,
      session_id: rule.sessionId || null,
      name: rule.name,
      conditions: JSON.stringify(rule.conditions),
      actions: JSON.stringify(rule.actions),
      is_active: rule.isActive ?? true ? 1 : 0,
      created_at: now,
      updated_at: now
    });
  }

  public findActiveRules(sessionId?: string): AutomationRuleRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM automation_rules
      WHERE is_active = 1 AND (session_id IS NULL OR session_id = '' OR session_id = ?)
      ORDER BY created_at ASC
    `);
    const rows = stmt.all(sessionId || '') as any[];
    return rows.map((r) => ({
      ...r,
      conditions: JSON.parse(r.conditions || '[]'),
      actions: JSON.parse(r.actions || '[]'),
      is_active: Boolean(r.is_active)
    }));
  }

  public incrementHit(id: string): void {
    const stmt = this.db.prepare('UPDATE automation_rules SET hit_count = hit_count + 1 WHERE id = ?');
    stmt.run(id);
  }

  public findAll(): AutomationRuleRecord[] {
    const stmt = this.db.prepare('SELECT * FROM automation_rules ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      ...r,
      conditions: JSON.parse(r.conditions || '[]'),
      actions: JSON.parse(r.actions || '[]'),
      is_active: Boolean(r.is_active)
    }));
  }

  public delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM automation_rules WHERE id = ?');
    stmt.run(id);
  }

  public getAutoReplyConfig(sessionId?: string): AutoReplyConfig {
    const key = sessionId ? `auto_reply_config:${sessionId}` : 'auto_reply_config:global';
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;

    const defaults: AutoReplyConfig = {
      autoReplyEnabled: true,
      businessHoursEnabled: false,
      businessHoursStart: '08:00',
      businessHoursEnd: '17:00',
      businessDays: [1, 2, 3, 4, 5],
      offlineReplyEnabled: true,
      offlineReplyText: 'Halo kak {{name}}! 👋\n\nTerima kasih telah menghubungi kami. Saat ini layanan kami sedang berada di luar jam operasional (08:00 - 17:00 WIB).\n\nPesan kakak sudah kami terima dan tim support kami akan membalas segera saat jam kerja dibuka ya! 🙏',
      cooldownMinutes: 5,
      fallbackEnabled: false,
      fallbackReplyText: 'Halo kak {{name}}, terima kasih pesannya! Tim kami sedang mengecek pesan kakak dan akan merespon secepatnya. Jika butuh bantuan cepat, ketik *MENU*.',
      simulateTyping: true
    };

    if (!row) return defaults;
    try {
      return { ...defaults, ...JSON.parse(row.value) };
    } catch {
      return defaults;
    }
  }

  public saveAutoReplyConfig(config: AutoReplyConfig, sessionId?: string): void {
    const key = sessionId ? `auto_reply_config:${sessionId}` : 'auto_reply_config:global';
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    stmt.run(key, JSON.stringify(config), Date.now());
  }
}

export const automationRepository = new AutomationRepository();
