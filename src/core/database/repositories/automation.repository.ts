import { getDatabase } from '../connection';

export interface AutomationCondition {
  field: 'text' | 'sender' | 'is_group';
  operator: 'contains' | 'equals' | 'starts_with' | 'regex';
  value: string;
}

export interface AutomationAction {
  type: 'send_text' | 'send_media';
  text?: string;
  mediaPath?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
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
      WHERE is_active = 1 AND (session_id IS NULL OR session_id = ?)
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
}

export const automationRepository = new AutomationRepository();
