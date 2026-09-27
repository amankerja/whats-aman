import { getDatabase } from '../database/connection';
import { logger } from '../../utils/logger';

export class AuditService {
  public static log(actor: string, action: string, resource: string, metadata: Record<string, any> = {}): void {
    try {
      const db = getDatabase();
      const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const stmt = db.prepare(`
        INSERT INTO audit_logs (id, event_type, payload, created_at)
        VALUES (?, ?, ?, ?)
      `);
      const payload = JSON.stringify({ actor, action, resource, metadata });
      stmt.run(id, `${resource}.${action}`, payload, Date.now());
      logger.info({ action, resource }, `[AuditLog] ${action} on ${resource}`);
    } catch (err) {
      logger.warn({ err }, 'Failed to write audit log');
    }
  }

  public static getRecent(limit = 100): Array<{ id: string; event_type: string; payload: any; created_at: number }> {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?');
    const rows = stmt.all(limit) as any[];
    return rows.map((r) => ({
      ...r,
      payload: JSON.parse(r.payload || '{}')
    }));
  }
}
