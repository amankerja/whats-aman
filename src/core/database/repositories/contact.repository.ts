import { getDatabase } from '../connection';

export interface ContactRecord {
  id: string;
  session_id: string;
  jid: string;
  name?: string;
  push_name?: string;
  phone: string;
  tags: string[];
  custom_fields: Record<string, any>;
  is_business: boolean;
  is_blocked: boolean;
  opt_out: boolean;
  created_at: number;
  updated_at: number;
}

export class ContactRepository {
  private get db() {
    return getDatabase();
  }

  public upsert(contact: {
    sessionId: string;
    jid: string;
    name?: string;
    pushName?: string;
    phone: string;
    tags?: string[];
    customFields?: Record<string, any>;
    optOut?: boolean;
  }): void {
    const id = `${contact.sessionId}:${contact.jid}`;
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO contacts (
        id, session_id, jid, name, push_name, phone, tags, custom_fields, opt_out, created_at, updated_at
      ) VALUES (
        @id, @session_id, @jid, @name, @push_name, @phone, @tags, @custom_fields, @opt_out, @created_at, @updated_at
      )
      ON CONFLICT(session_id, jid) DO UPDATE SET
        name = COALESCE(@name, name),
        push_name = COALESCE(@push_name, push_name),
        phone = COALESCE(@phone, phone),
        tags = COALESCE(@tags, tags),
        custom_fields = COALESCE(@custom_fields, custom_fields),
        opt_out = COALESCE(@opt_out, opt_out),
        updated_at = @updated_at
    `);

    stmt.run({
      id,
      session_id: contact.sessionId,
      jid: contact.jid,
      name: contact.name || null,
      push_name: contact.pushName || null,
      phone: contact.phone,
      tags: JSON.stringify(contact.tags || []),
      custom_fields: JSON.stringify(contact.customFields || {}),
      opt_out: contact.optOut ? 1 : 0,
      created_at: now,
      updated_at: now
    });
  }

  public findAll(sessionId: string, limit = 100, offset = 0): ContactRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM contacts
      WHERE session_id = ?
      ORDER BY name ASC, phone ASC
      LIMIT ? OFFSET ?
    `);
    const rows = stmt.all(sessionId, limit, offset) as any[];
    return rows.map((r) => ({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
      custom_fields: JSON.parse(r.custom_fields || '{}'),
      is_business: Boolean(r.is_business),
      is_blocked: Boolean(r.is_blocked),
      opt_out: Boolean(r.opt_out)
    }));
  }

  public count(sessionId: string): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM contacts WHERE session_id = ?');
    const res = stmt.get(sessionId) as { count: number };
    return res ? res.count : 0;
  }

  public findByPhone(sessionId: string, phone: string): ContactRecord | undefined {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const stmt = this.db.prepare('SELECT * FROM contacts WHERE session_id = ? AND phone = ?');
    const row = stmt.get(sessionId, cleanPhone) as any;
    if (!row) return undefined;
    return {
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      custom_fields: JSON.parse(row.custom_fields || '{}'),
      is_business: Boolean(row.is_business),
      is_blocked: Boolean(row.is_blocked),
      opt_out: Boolean(row.opt_out)
    };
  }

  public delete(sessionId: string, phone: string): void {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const stmt = this.db.prepare('DELETE FROM contacts WHERE session_id = ? AND phone = ?');
    stmt.run(sessionId, cleanPhone);
  }
}

export const contactRepository = new ContactRepository();
