import { getDatabase } from '../connection';

export type IntegrationProvider =
  | 'google_form'
  | 'cf7'
  | 'woocommerce'
  | 'elementor'
  | 'caldera'
  | 'formidable'
  | 'custom';

export interface IntegrationConfigRecord {
  id: string;
  sessionId?: string;
  provider: IntegrationProvider;
  name: string;
  secretToken?: string;
  templateText: string;
  adminPhone?: string;
  adminTemplateText?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface IntegrationLogRecord {
  id: string;
  provider: string;
  sessionId: string;
  targetPhone: string;
  status: 'SUCCESS' | 'FAILED';
  payload: any;
  errorMessage?: string;
  createdAt: number;
}

export class IntegrationRepository {
  private get db() {
    return getDatabase();
  }

  private mapConfigRow(row: any): IntegrationConfigRecord {
    return {
      id: row.id,
      sessionId: row.session_id || undefined,
      provider: row.provider as IntegrationProvider,
      name: row.name,
      secretToken: row.secret_token || undefined,
      templateText: row.template_text,
      adminPhone: row.admin_phone || undefined,
      adminTemplateText: row.admin_template_text || undefined,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapLogRow(row: any): IntegrationLogRecord {
    let payload = {};
    try {
      payload = JSON.parse(row.payload || '{}');
    } catch {
      payload = { raw: row.payload };
    }

    return {
      id: row.id,
      provider: row.provider,
      sessionId: row.session_id,
      targetPhone: row.target_phone,
      status: row.status as 'SUCCESS' | 'FAILED',
      payload,
      errorMessage: row.error_message || undefined,
      createdAt: row.created_at
    };
  }

  public upsertConfig(data: {
    id?: string;
    sessionId?: string;
    provider: IntegrationProvider;
    name: string;
    secretToken?: string;
    templateText: string;
    adminPhone?: string;
    adminTemplateText?: string;
    isActive?: boolean;
  }): IntegrationConfigRecord {
    const id = data.id || `int_${data.provider}_${Date.now()}`;
    const now = Date.now();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1;

    const stmt = this.db.prepare(`
      INSERT INTO integration_configs (
        id, session_id, provider, name, secret_token, template_text, admin_phone, admin_template_text, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        session_id = excluded.session_id,
        provider = excluded.provider,
        name = excluded.name,
        secret_token = excluded.secret_token,
        template_text = excluded.template_text,
        admin_phone = excluded.admin_phone,
        admin_template_text = excluded.admin_template_text,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      id,
      data.sessionId || null,
      data.provider,
      data.name,
      data.secretToken || null,
      data.templateText,
      data.adminPhone || null,
      data.adminTemplateText || null,
      isActive,
      now,
      now
    );

    return this.findConfigById(id)!;
  }

  public findConfigById(id: string): IntegrationConfigRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM integration_configs WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapConfigRow(row) : undefined;
  }

  public findConfigByProvider(provider: string, sessionId?: string): IntegrationConfigRecord | undefined {
    if (sessionId) {
      const stmt = this.db.prepare(`
        SELECT * FROM integration_configs
        WHERE provider = ? AND (session_id = ? OR session_id IS NULL OR session_id = '') AND is_active = 1
        ORDER BY CASE WHEN session_id = ? THEN 0 ELSE 1 END, updated_at DESC
        LIMIT 1
      `);
      const row = stmt.get(provider, sessionId, sessionId);
      if (row) return this.mapConfigRow(row);
    }

    const stmt = this.db.prepare(`
      SELECT * FROM integration_configs
      WHERE provider = ? AND is_active = 1
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    const row = stmt.get(provider);
    return row ? this.mapConfigRow(row) : undefined;
  }

  public findAllConfigs(sessionId?: string): IntegrationConfigRecord[] {
    if (sessionId) {
      const stmt = this.db.prepare(`
        SELECT * FROM integration_configs
        WHERE session_id = ? OR session_id IS NULL OR session_id = ''
        ORDER BY updated_at DESC
      `);
      return stmt.all(sessionId).map((r) => this.mapConfigRow(r));
    }

    const stmt = this.db.prepare('SELECT * FROM integration_configs ORDER BY updated_at DESC');
    return stmt.all().map((r) => this.mapConfigRow(r));
  }

  public deleteConfig(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM integration_configs WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }

  public logIngestion(data: {
    provider: string;
    sessionId: string;
    targetPhone: string;
    status: 'SUCCESS' | 'FAILED';
    payload: any;
    errorMessage?: string;
  }): IntegrationLogRecord {
    const id = `ilog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    const payloadStr = typeof data.payload === 'string' ? data.payload : JSON.stringify(data.payload || {});

    const stmt = this.db.prepare(`
      INSERT INTO integration_logs (id, provider, session_id, target_phone, status, payload, error_message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.provider,
      data.sessionId,
      data.targetPhone,
      data.status,
      payloadStr,
      data.errorMessage || null,
      now
    );

    return {
      id,
      provider: data.provider,
      sessionId: data.sessionId,
      targetPhone: data.targetPhone,
      status: data.status,
      payload: data.payload,
      errorMessage: data.errorMessage,
      createdAt: now
    };
  }

  public findLogs(filter?: { sessionId?: string; provider?: string; limit?: number }): IntegrationLogRecord[] {
    const limit = filter?.limit || 50;
    const params: any[] = [];
    let where = 'WHERE 1=1';

    if (filter?.sessionId) {
      where += ' AND session_id = ?';
      params.push(filter.sessionId);
    }
    if (filter?.provider) {
      where += ' AND provider = ?';
      params.push(filter.provider);
    }

    params.push(limit);
    const stmt = this.db.prepare(`SELECT * FROM integration_logs ${where} ORDER BY created_at DESC LIMIT ?`);
    return stmt.all(...params).map((r) => this.mapLogRow(r));
  }
}

export const integrationRepository = new IntegrationRepository();
