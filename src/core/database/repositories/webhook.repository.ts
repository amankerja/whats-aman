import { getDatabase } from '../connection';

export interface WebhookRecord {
  id: string;
  sessionId?: string;
  name: string;
  targetUrl: string;
  events: string[];
  secretKey?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export class WebhookRepository {
  private get db() {
    return getDatabase();
  }

  private mapRow(row: any): WebhookRecord {
    let parsedEvents: string[] = ['message.received'];
    try {
      parsedEvents = JSON.parse(row.events);
    } catch {
      parsedEvents = ['message.received'];
    }

    return {
      id: row.id,
      sessionId: row.session_id || undefined,
      name: row.name,
      targetUrl: row.target_url,
      events: parsedEvents,
      secretKey: row.secret_key || undefined,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at
    };
  }

  public create(data: {
    id?: string;
    sessionId?: string;
    name: string;
    targetUrl: string;
    events?: string[];
    secretKey?: string;
    isActive?: boolean;
  }): WebhookRecord {
    const id = data.id || `wh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const eventsJson = JSON.stringify(data.events && data.events.length > 0 ? data.events : ['message.received']);
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;

    const stmt = this.db.prepare(`
      INSERT INTO webhooks (id, session_id, name, target_url, events, secret_key, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.sessionId || null,
      data.name,
      data.targetUrl,
      eventsJson,
      data.secretKey || null,
      isActive,
      now,
      now
    );

    return this.findById(id)!;
  }

  public findById(id: string): WebhookRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM webhooks WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapRow(row) : undefined;
  }

  public findAll(sessionId?: string): WebhookRecord[] {
    if (sessionId) {
      const stmt = this.db.prepare(`
        SELECT * FROM webhooks 
        WHERE session_id = ? OR session_id IS NULL OR session_id = ''
        ORDER BY created_at DESC
      `);
      const rows = stmt.all(sessionId);
      return rows.map((r) => this.mapRow(r));
    }

    const stmt = this.db.prepare('SELECT * FROM webhooks ORDER BY created_at DESC');
    const rows = stmt.all();
    return rows.map((r) => this.mapRow(r));
  }

  public findActiveByEvent(event: string, sessionId?: string): WebhookRecord[] {
    let stmt;
    let rows: any[];

    if (sessionId) {
      stmt = this.db.prepare(`
        SELECT * FROM webhooks 
        WHERE is_active = 1 AND (session_id = ? OR session_id IS NULL OR session_id = '')
      `);
      rows = stmt.all(sessionId);
    } else {
      stmt = this.db.prepare('SELECT * FROM webhooks WHERE is_active = 1');
      rows = stmt.all();
    }

    const webhooks = rows.map((r) => this.mapRow(r));
    return webhooks.filter((wh) => wh.events.includes('*') || wh.events.includes(event));
  }

  public update(
    id: string,
    data: Partial<{
      sessionId?: string;
      name: string;
      targetUrl: string;
      events: string[];
      secretKey: string;
      isActive: boolean;
    }>
  ): WebhookRecord | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;

    const now = Date.now();
    const newSessionId = data.sessionId !== undefined ? (data.sessionId || null) : (existing.sessionId || null);
    const newName = data.name !== undefined ? data.name : existing.name;
    const newUrl = data.targetUrl !== undefined ? data.targetUrl : existing.targetUrl;
    const newEvents = data.events !== undefined ? JSON.stringify(data.events) : JSON.stringify(existing.events);
    const newSecret = data.secretKey !== undefined ? (data.secretKey || null) : (existing.secretKey || null);
    const newActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : (existing.isActive ? 1 : 0);

    const stmt = this.db.prepare(`
      UPDATE webhooks 
      SET session_id = ?, name = ?, target_url = ?, events = ?, secret_key = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(newSessionId, newName, newUrl, newEvents, newSecret, newActive, now, id);
    return this.findById(id);
  }

  public delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM webhooks WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }
}

export const webhookRepository = new WebhookRepository();
