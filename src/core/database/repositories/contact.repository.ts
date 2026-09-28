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
  pipeline_stage?: 'lead' | 'prospect' | 'customer' | 'churned' | 'none';
  notes: string;
  is_business: boolean;
  is_blocked: boolean;
  opt_out: boolean;
  created_at: number;
  updated_at: number;
}

export class ContactRepository {
  private stmtCache = new Map<string, any>();

  private get db() {
    return getDatabase();
  }

  private getStatement(key: string, sql: string) {
    let stmt = this.stmtCache.get(key);
    if (!stmt) {
      stmt = this.db.prepare(sql);
      this.stmtCache.set(key, stmt);
    }
    return stmt;
  }

  public upsert(contact: {
    sessionId: string;
    jid?: string;
    name?: string;
    pushName?: string;
    phone: string;
    tags?: string[];
    customFields?: Record<string, any>;
    pipelineStage?: 'lead' | 'prospect' | 'customer' | 'churned';
    notes?: string;
    optOut?: boolean;
  }): void {
    const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 5) return;

    const canonicalJid = `${cleanPhone}@s.whatsapp.net`;
    const id = `${contact.sessionId}:${canonicalJid}`;
    const now = Date.now();
    const finalName = (contact.name && contact.name.trim() !== '-' ? contact.name.trim() : '') || contact.pushName?.trim() || null;

    const stmt = this.getStatement('upsert_contact', `
      INSERT INTO contacts (
        id, session_id, jid, name, push_name, phone, tags, custom_fields, pipeline_stage, notes, opt_out, created_at, updated_at
      ) VALUES (
        @id, @session_id, @jid, @name, @push_name, @phone, @tags, @custom_fields, @pipeline_stage, @notes, @opt_out, @created_at, @updated_at
      )
      ON CONFLICT(session_id, phone) DO UPDATE SET
        id = @id,
        jid = @jid,
        name = CASE 
          WHEN @name IS NOT NULL AND TRIM(@name) != '' AND TRIM(@name) != '-' THEN @name 
          WHEN name IS NOT NULL AND TRIM(name) != '' AND TRIM(name) != '-' THEN name 
          ELSE COALESCE(@push_name, push_name)
        END,
        push_name = COALESCE(@push_name, push_name),
        tags = CASE WHEN @tags != '[]' THEN @tags ELSE tags END,
        custom_fields = CASE WHEN @custom_fields != '{}' THEN @custom_fields ELSE custom_fields END,
        pipeline_stage = COALESCE(@pipeline_stage, pipeline_stage),
        notes = CASE WHEN @notes != '' THEN @notes ELSE notes END,
        opt_out = COALESCE(@opt_out, opt_out),
        updated_at = @updated_at
    `);

    stmt.run({
      id,
      session_id: contact.sessionId,
      jid: canonicalJid,
      name: finalName,
      push_name: contact.pushName || null,
      phone: cleanPhone,
      tags: JSON.stringify(contact.tags || []),
      custom_fields: JSON.stringify(contact.customFields || {}),
      pipeline_stage: contact.pipelineStage || 'none',
      notes: contact.notes || '',
      opt_out: contact.optOut ? 1 : 0,
      created_at: now,
      updated_at: now
    });
  }

  public findAll(sessionId: string, limit = 100, offset = 0): ContactRecord[] {
    const stmt = this.getStatement('find_all_contacts', `
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
      pipeline_stage: r.pipeline_stage || 'none',
      notes: r.notes || '',
      is_business: Boolean(r.is_business),
      is_blocked: Boolean(r.is_blocked),
      opt_out: Boolean(r.opt_out)
    }));
  }

  public count(sessionId: string): number {
    const stmt = this.getStatement('count_contacts', 'SELECT COUNT(*) as count FROM contacts WHERE session_id = ?');
    const res = stmt.get(sessionId) as { count: number };
    return res ? res.count : 0;
  }

  public findByJid(sessionId: string, jid: string): ContactRecord | undefined {
    const stmt = this.getStatement('find_by_jid_contact', 'SELECT * FROM contacts WHERE session_id = ? AND jid = ?');
    const row = stmt.get(sessionId, jid) as any;
    if (!row) return undefined;
    return {
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      custom_fields: JSON.parse(row.custom_fields || '{}'),
      pipeline_stage: row.pipeline_stage || 'none',
      notes: row.notes || '',
      is_business: Boolean(row.is_business),
      is_blocked: Boolean(row.is_blocked),
      opt_out: Boolean(row.opt_out)
    };
  }

  public findByPhone(sessionId: string, phone: string): ContactRecord | undefined {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const stmt = this.getStatement('find_by_phone_contact', 'SELECT * FROM contacts WHERE session_id = ? AND phone = ?');
    const row = stmt.get(sessionId, cleanPhone) as any;
    if (!row) return undefined;
    return {
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      custom_fields: JSON.parse(row.custom_fields || '{}'),
      pipeline_stage: row.pipeline_stage || 'none',
      notes: row.notes || '',
      is_business: Boolean(row.is_business),
      is_blocked: Boolean(row.is_blocked),
      opt_out: Boolean(row.opt_out)
    };
  }

  public findByTag(sessionId: string, tag: string): ContactRecord[] {
    const contacts = this.findAll(sessionId, 10000, 0);
    if (!tag || tag === 'ALL') {
      return contacts.filter(c => !c.opt_out);
    }
    return contacts.filter(c => c.tags.includes(tag) && !c.opt_out);
  }

  public findByStage(sessionId: string, stage: string): ContactRecord[] {
    const contacts = this.findAll(sessionId, 10000, 0);
    if (!stage || stage === 'ALL') {
      return contacts;
    }
    return contacts.filter(c => c.pipeline_stage === stage);
  }

  public getAllTags(sessionId: string): Array<{ tag: string; count: number }> {
    const contacts = this.findAll(sessionId, 10000, 0);
    const tagCount: Record<string, number> = {};
    for (const c of contacts) {
      for (const t of c.tags) {
        if (t && t.trim()) {
          tagCount[t.trim()] = (tagCount[t.trim()] || 0) + 1;
        }
      }
    }
    return Object.entries(tagCount).map(([tag, count]) => ({ tag, count }));
  }

  public updateTags(sessionId: string, phone: string, tags: string[]): void {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const stmt = this.db.prepare('UPDATE contacts SET tags = ?, updated_at = ? WHERE session_id = ? AND phone = ?');
    stmt.run(JSON.stringify(tags), Date.now(), sessionId, cleanPhone);
  }

  public updateStage(sessionId: string, phone: string, stage: 'lead' | 'prospect' | 'customer' | 'churned'): void {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const stmt = this.db.prepare('UPDATE contacts SET pipeline_stage = ?, updated_at = ? WHERE session_id = ? AND phone = ?');
    stmt.run(stage, Date.now(), sessionId, cleanPhone);
  }

  public updateNotes(sessionId: string, phone: string, notes: string): void {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const stmt = this.db.prepare('UPDATE contacts SET notes = ?, updated_at = ? WHERE session_id = ? AND phone = ?');
    stmt.run(notes, Date.now(), sessionId, cleanPhone);
  }

  public delete(sessionId: string, phone: string): void {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const stmt = this.db.prepare('DELETE FROM contacts WHERE session_id = ? AND phone = ?');
    stmt.run(sessionId, cleanPhone);
  }

  public batchDelete(sessionId: string, phones: string[]): number {
    const cleanPhones = phones.map(p => p.replace(/[^0-9]/g, '')).filter(Boolean);
    if (cleanPhones.length === 0) return 0;
    const stmt = this.db.prepare('DELETE FROM contacts WHERE session_id = ? AND phone = ?');
    const deleteTx = this.db.transaction((items: string[]) => {
      let count = 0;
      for (const phone of items) {
        const res = stmt.run(sessionId, phone);
        count += res.changes;
      }
      return count;
    });
    return deleteTx(cleanPhones);
  }

  public batchUpdateStage(sessionId: string, phones: string[], stage: 'lead' | 'prospect' | 'customer' | 'churned'): number {
    const cleanPhones = phones.map(p => p.replace(/[^0-9]/g, '')).filter(Boolean);
    if (cleanPhones.length === 0) return 0;
    const now = Date.now();
    const stmt = this.db.prepare('UPDATE contacts SET pipeline_stage = ?, updated_at = ? WHERE session_id = ? AND phone = ?');
    const updateTx = this.db.transaction((items: string[]) => {
      let count = 0;
      for (const phone of items) {
        const res = stmt.run(stage, now, sessionId, phone);
        count += res.changes;
      }
      return count;
    });
    return updateTx(cleanPhones);
  }

  public batchToggleOptOut(sessionId: string, phones: string[], optOut: boolean): number {
    const cleanPhones = phones.map(p => p.replace(/[^0-9]/g, '')).filter(Boolean);
    if (cleanPhones.length === 0) return 0;
    const now = Date.now();
    const stmt = this.db.prepare('UPDATE contacts SET opt_out = ?, updated_at = ? WHERE session_id = ? AND phone = ?');
    const updateTx = this.db.transaction((items: string[]) => {
      let count = 0;
      for (const phone of items) {
        const res = stmt.run(optOut ? 1 : 0, now, sessionId, phone);
        count += res.changes;
      }
      return count;
    });
    return updateTx(cleanPhones);
  }

  public batchUpdateTags(sessionId: string, phones: string[], tags: string[], mode: 'add' | 'remove' | 'replace'): number {
    const cleanPhones = phones.map(p => p.replace(/[^0-9]/g, '')).filter(Boolean);
    if (cleanPhones.length === 0) return 0;
    const now = Date.now();
    const findStmt = this.db.prepare('SELECT phone, tags FROM contacts WHERE session_id = ? AND phone = ?');
    const updateStmt = this.db.prepare('UPDATE contacts SET tags = ?, updated_at = ? WHERE session_id = ? AND phone = ?');

    const tx = this.db.transaction((items: string[]) => {
      let count = 0;
      for (const phone of items) {
        const row = findStmt.get(sessionId, phone) as { phone: string; tags: string } | undefined;
        if (!row) continue;
        let existingTags: string[] = [];
        try {
          existingTags = JSON.parse(row.tags || '[]');
        } catch {
          existingTags = [];
        }
        let finalTags: string[] = [];
        if (mode === 'replace') {
          finalTags = Array.from(new Set(tags.map(t => t.trim()).filter(Boolean)));
        } else if (mode === 'add') {
          finalTags = Array.from(new Set([...existingTags, ...tags.map(t => t.trim()).filter(Boolean)]));
        } else if (mode === 'remove') {
          const toRemove = new Set(tags.map(t => t.trim()));
          finalTags = existingTags.filter(t => !toRemove.has(t));
        }
        const res = updateStmt.run(JSON.stringify(finalTags), now, sessionId, phone);
        count += res.changes;
      }
      return count;
    });
    return tx(cleanPhones);
  }
}

export const contactRepository = new ContactRepository();
