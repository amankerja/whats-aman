import { getDatabase } from '../connection';

export interface ChatFlowStep {
  id: string;
  promptText: string;
  variableName: string;
  validationType?: 'any' | 'email' | 'phone' | 'number' | 'options';
  options?: string[];
  errorMessage?: string;
}

export interface ChatFlowRecord {
  id: string;
  sessionId?: string;
  name: string;
  description?: string;
  triggerKeyword: string;
  triggerType: 'contains' | 'equals' | 'starts_with';
  steps: ChatFlowStep[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ChatFlowSessionRecord {
  id: string;
  sessionId: string;
  flowId: string;
  contactPhone: string;
  currentStepIndex: number;
  collectedData: Record<string, string>;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
}

export class ChatFlowRepository {
  private get db() {
    return getDatabase();
  }

  private mapFlowRow(row: any): ChatFlowRecord {
    let steps: ChatFlowStep[] = [];
    try {
      steps = JSON.parse(row.steps || '[]');
    } catch {
      steps = [];
    }

    return {
      id: row.id,
      sessionId: row.session_id || undefined,
      name: row.name,
      description: row.description || undefined,
      triggerKeyword: row.trigger_keyword,
      triggerType: row.trigger_type || 'contains',
      steps,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapSessionRow(row: any): ChatFlowSessionRecord {
    let collectedData: Record<string, string> = {};
    try {
      collectedData = JSON.parse(row.collected_data || '{}');
    } catch {
      collectedData = {};
    }

    return {
      id: row.id,
      sessionId: row.session_id,
      flowId: row.flow_id,
      contactPhone: row.contact_phone,
      currentStepIndex: row.current_step_index,
      collectedData,
      status: row.status,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Flows CRUD
  public createFlow(data: {
    id?: string;
    sessionId?: string;
    name: string;
    description?: string;
    triggerKeyword: string;
    triggerType?: 'contains' | 'equals' | 'starts_with';
    steps: ChatFlowStep[];
    isActive?: boolean;
  }): ChatFlowRecord {
    const id = data.id || `flow_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    const triggerType = data.triggerType || 'contains';
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;

    const stmt = this.db.prepare(`
      INSERT INTO chat_flows (id, session_id, name, description, trigger_keyword, trigger_type, steps, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.sessionId || null,
      data.name,
      data.description || null,
      data.triggerKeyword.trim().toLowerCase(),
      triggerType,
      JSON.stringify(data.steps),
      isActive,
      now,
      now
    );

    return this.findFlowById(id)!;
  }

  public findFlowById(id: string): ChatFlowRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM chat_flows WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapFlowRow(row) : undefined;
  }

  public findAllFlows(sessionId?: string): ChatFlowRecord[] {
    if (sessionId) {
      const stmt = this.db.prepare(`
        SELECT * FROM chat_flows
        WHERE session_id = ? OR session_id IS NULL OR session_id = ''
        ORDER BY created_at DESC
      `);
      return stmt.all(sessionId).map((r) => this.mapFlowRow(r));
    }

    const stmt = this.db.prepare('SELECT * FROM chat_flows ORDER BY created_at DESC');
    return stmt.all().map((r) => this.mapFlowRow(r));
  }

  public findActiveFlows(sessionId?: string): ChatFlowRecord[] {
    if (sessionId) {
      const stmt = this.db.prepare(`
        SELECT * FROM chat_flows
        WHERE is_active = 1 AND (session_id = ? OR session_id IS NULL OR session_id = '')
        ORDER BY created_at DESC
      `);
      return stmt.all(sessionId).map((r) => this.mapFlowRow(r));
    }

    const stmt = this.db.prepare('SELECT * FROM chat_flows WHERE is_active = 1 ORDER BY created_at DESC');
    return stmt.all().map((r) => this.mapFlowRow(r));
  }

  public updateFlow(
    id: string,
    data: Partial<{
      name: string;
      description?: string;
      triggerKeyword: string;
      triggerType: 'contains' | 'equals' | 'starts_with';
      steps: ChatFlowStep[];
      isActive: boolean;
      sessionId?: string;
    }>
  ): ChatFlowRecord | undefined {
    const existing = this.findFlowById(id);
    if (!existing) return undefined;

    const now = Date.now();
    const name = data.name !== undefined ? data.name : existing.name;
    const description = data.description !== undefined ? data.description : existing.description;
    const triggerKeyword = data.triggerKeyword !== undefined ? data.triggerKeyword.trim().toLowerCase() : existing.triggerKeyword;
    const triggerType = data.triggerType !== undefined ? data.triggerType : existing.triggerType;
    const steps = data.steps !== undefined ? JSON.stringify(data.steps) : JSON.stringify(existing.steps);
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : (existing.isActive ? 1 : 0);
    const sessionId = data.sessionId !== undefined ? (data.sessionId || null) : (existing.sessionId || null);

    const stmt = this.db.prepare(`
      UPDATE chat_flows
      SET session_id = ?, name = ?, description = ?, trigger_keyword = ?, trigger_type = ?, steps = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(sessionId, name, description, triggerKeyword, triggerType, steps, isActive, now, id);
    return this.findFlowById(id);
  }

  public deleteFlow(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM chat_flows WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }

  // Sessions Management
  public getActiveSession(sessionId: string, contactPhone: string): ChatFlowSessionRecord | undefined {
    const now = Date.now();
    const cleanPhone = contactPhone.replace(/[^0-9]/g, '');

    const stmt = this.db.prepare(`
      SELECT * FROM chat_flow_sessions
      WHERE session_id = ? AND contact_phone = ? AND status = 'ACTIVE' AND expires_at > ?
      ORDER BY updated_at DESC
      LIMIT 1
    `);

    const row = stmt.get(sessionId, cleanPhone, now);
    return row ? this.mapSessionRow(row) : undefined;
  }

  public saveSession(session: ChatFlowSessionRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO chat_flow_sessions (
        id, session_id, flow_id, contact_phone, current_step_index, collected_data, status, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        flow_id = excluded.flow_id,
        current_step_index = excluded.current_step_index,
        collected_data = excluded.collected_data,
        status = excluded.status,
        expires_at = excluded.expires_at,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      session.id,
      session.sessionId,
      session.flowId,
      session.contactPhone,
      session.currentStepIndex,
      JSON.stringify(session.collectedData || {}),
      session.status,
      session.expiresAt,
      session.createdAt,
      session.updatedAt
    );
  }

  public findSessionsByFlow(flowId: string, limit = 50): ChatFlowSessionRecord[] {
    const stmt = this.db.prepare(`
      SELECT * FROM chat_flow_sessions
      WHERE flow_id = ?
      ORDER BY updated_at DESC
      LIMIT ?
    `);
    return stmt.all(flowId, limit).map((r) => this.mapSessionRow(r));
  }
}

export const chatFlowRepository = new ChatFlowRepository();
