import { getDatabase } from '../connection';

export interface FollowUpTaskRecord {
  id: string;
  session_id: string;
  contact_phone: string;
  contact_name?: string;
  title: string;
  message_template: string;
  due_at: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  sequence_id?: string;
  step_number: number;
  notes?: string;
  created_at: number;
  updated_at: number;
}

export interface SequenceStep {
  stepNumber: number;
  delayDays: number;
  delayHours?: number;
  title: string;
  template: string;
}

export interface SequenceRecord {
  id: string;
  session_id: string;
  name: string;
  description?: string;
  steps: SequenceStep[];
  created_at: number;
  updated_at: number;
}

export class CRMRepository {
  private get db() {
    return getDatabase();
  }

  // Follow-up tasks
  public createTask(task: {
    id: string;
    sessionId: string;
    contactPhone: string;
    contactName?: string;
    title: string;
    messageTemplate: string;
    dueAt: number;
    status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    sequenceId?: string;
    stepNumber?: number;
    notes?: string;
  }): void {
    const now = Date.now();
    const cleanPhone = task.contactPhone.replace(/[^0-9]/g, '');

    const stmt = this.db.prepare(`
      INSERT INTO follow_up_tasks (
        id, session_id, contact_phone, contact_name, title, message_template,
        due_at, status, sequence_id, step_number, notes, created_at, updated_at
      ) VALUES (
        @id, @session_id, @contact_phone, @contact_name, @title, @message_template,
        @due_at, @status, @sequence_id, @step_number, @notes, @created_at, @updated_at
      )
    `);

    stmt.run({
      id: task.id,
      session_id: task.sessionId,
      contact_phone: cleanPhone,
      contact_name: task.contactName || null,
      title: task.title,
      message_template: task.messageTemplate,
      due_at: task.dueAt,
      status: task.status || 'PENDING',
      sequence_id: task.sequenceId || null,
      step_number: task.stepNumber || 1,
      notes: task.notes || null,
      created_at: now,
      updated_at: now
    });
  }

  public findTaskById(id: string): FollowUpTaskRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM follow_up_tasks WHERE id = ?');
    const row = stmt.get(id) as FollowUpTaskRecord | undefined;
    return row;
  }

  public findTasks(
    sessionId: string,
    filter?: { status?: string; phone?: string; limit?: number; offset?: number }
  ): { data: FollowUpTaskRecord[]; total: number } {
    const limit = filter?.limit || 100;
    const offset = filter?.offset || 0;
    let whereClause = 'WHERE session_id = ?';
    const params: any[] = [sessionId];

    if (filter?.status && filter.status !== 'ALL') {
      whereClause += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter?.phone) {
      const cleanPhone = filter.phone.replace(/[^0-9]/g, '');
      whereClause += ' AND contact_phone LIKE ?';
      params.push(`%${cleanPhone}%`);
    }

    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM follow_up_tasks ${whereClause}`);
    const countRes = countStmt.get(...params) as { count: number };
    const total = countRes ? countRes.count : 0;

    const dataStmt = this.db.prepare(`
      SELECT * FROM follow_up_tasks
      ${whereClause}
      ORDER BY 
        CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END,
        due_at ASC,
        created_at DESC
      LIMIT ? OFFSET ?
    `);
    const rows = dataStmt.all(...params, limit, offset) as FollowUpTaskRecord[];

    return { data: rows, total };
  }

  public updateTaskStatus(id: string, status: 'PENDING' | 'COMPLETED' | 'CANCELLED', notes?: string): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE follow_up_tasks
      SET status = ?, notes = COALESCE(?, notes), updated_at = ?
      WHERE id = ?
    `);
    stmt.run(status, notes || null, now, id);
  }

  public cancelPendingTasksForPhone(sessionId: string, phone: string, reason: string): number {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE follow_up_tasks
      SET status = 'CANCELLED', notes = ?, updated_at = ?
      WHERE session_id = ? AND contact_phone = ? AND status = 'PENDING' AND sequence_id IS NOT NULL
    `);
    const result = stmt.run(reason, now, sessionId, cleanPhone);
    return result.changes;
  }

  public deleteTask(id: string): void {
    const stmt = this.db.prepare('DELETE FROM follow_up_tasks WHERE id = ?');
    stmt.run(id);
  }

  // Sequences
  public createSequence(seq: {
    id: string;
    sessionId: string;
    name: string;
    description?: string;
    steps: SequenceStep[];
  }): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO sequences (id, session_id, name, description, steps, created_at, updated_at)
      VALUES (@id, @session_id, @name, @description, @steps, @created_at, @updated_at)
      ON CONFLICT(id) DO UPDATE SET
        name = @name,
        description = @description,
        steps = @steps,
        updated_at = @updated_at
    `);
    stmt.run({
      id: seq.id,
      session_id: seq.sessionId,
      name: seq.name,
      description: seq.description || null,
      steps: JSON.stringify(seq.steps),
      created_at: now,
      updated_at: now
    });
  }

  public findSequences(sessionId: string): SequenceRecord[] {
    const stmt = this.db.prepare('SELECT * FROM sequences WHERE session_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(sessionId) as any[];
    return rows.map((r) => ({
      ...r,
      steps: JSON.parse(r.steps || '[]')
    }));
  }

  public findSequenceById(id: string): SequenceRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM sequences WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;
    return {
      ...row,
      steps: JSON.parse(row.steps || '[]')
    };
  }

  public deleteSequence(id: string): void {
    const stmt = this.db.prepare('DELETE FROM sequences WHERE id = ?');
    stmt.run(id);
  }
}

export const crmRepository = new CRMRepository();
