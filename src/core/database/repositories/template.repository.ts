import { getDatabase } from '../connection';

export interface MessageTemplateRecord {
  id: string;
  session_id?: string | null;
  name: string;
  category: string;
  content: string;
  created_at: number;
  updated_at: number;
}

export class TemplateRepository {
  private get db() {
    return getDatabase();
  }

  public create(data: {
    id: string;
    sessionId?: string | null;
    name: string;
    category?: string;
    content: string;
  }): MessageTemplateRecord {
    const now = Date.now();
    const record: MessageTemplateRecord = {
      id: data.id,
      session_id: data.sessionId || null,
      name: data.name,
      category: data.category || 'general',
      content: data.content,
      created_at: now,
      updated_at: now
    };

    const stmt = this.db.prepare(`
      INSERT INTO message_templates (
        id, session_id, name, category, content, created_at, updated_at
      ) VALUES (
        @id, @session_id, @name, @category, @content, @created_at, @updated_at
      )
    `);

    stmt.run({
      id: record.id,
      session_id: record.session_id,
      name: record.name,
      category: record.category,
      content: record.content,
      created_at: record.created_at,
      updated_at: record.updated_at
    });

    return record;
  }

  public findAll(sessionId?: string): MessageTemplateRecord[] {
    if (sessionId) {
      const stmt = this.db.prepare(`
        SELECT * FROM message_templates
        WHERE session_id = ? OR session_id IS NULL
        ORDER BY updated_at DESC
      `);
      return stmt.all(sessionId) as MessageTemplateRecord[];
    }
    const stmt = this.db.prepare(`
      SELECT * FROM message_templates
      ORDER BY updated_at DESC
    `);
    return stmt.all() as MessageTemplateRecord[];
  }

  public findById(id: string): MessageTemplateRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM message_templates WHERE id = ?');
    return stmt.get(id) as MessageTemplateRecord | undefined;
  }

  public update(id: string, data: { name?: string; category?: string; content?: string; sessionId?: string | null }): void {
    const existing = this.findById(id);
    if (!existing) throw new Error('Template not found');

    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE message_templates SET
        name = @name,
        category = @category,
        content = @content,
        session_id = @session_id,
        updated_at = @updated_at
      WHERE id = @id
    `);

    stmt.run({
      id,
      name: data.name ?? existing.name,
      category: data.category ?? existing.category,
      content: data.content ?? existing.content,
      session_id: data.sessionId !== undefined ? data.sessionId : existing.session_id,
      updated_at: now
    });
  }

  public delete(id: string): void {
    this.db.prepare('DELETE FROM message_templates WHERE id = ?').run(id);
  }
}

export const templateRepository = new TemplateRepository();
