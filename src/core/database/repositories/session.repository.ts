import { getDatabase } from '../connection';
import { ConnectionStatus } from '../../events/event.types';

export interface SessionRecord {
  id: string;
  name: string;
  phone_number?: string;
  status: ConnectionStatus;
  qr_code?: string;
  pairing_code?: string;
  last_connected_at?: number;
  created_at: number;
  updated_at: number;
}

export class SessionRepository {
  private get db() {
    return getDatabase();
  }

  public upsert(session: Partial<SessionRecord> & { id: string }): void {
    const existing = this.findById(session.id);
    const now = Date.now();

    if (existing) {
      const stmt = this.db.prepare(`
        UPDATE sessions SET
          name = COALESCE(@name, name),
          phone_number = COALESCE(@phone_number, phone_number),
          status = COALESCE(@status, status),
          qr_code = @qr_code,
          pairing_code = @pairing_code,
          last_connected_at = COALESCE(@last_connected_at, last_connected_at),
          updated_at = @updated_at
        WHERE id = @id
      `);
      stmt.run({
        id: session.id,
        name: session.name || null,
        phone_number: session.phone_number || null,
        status: session.status || null,
        qr_code: session.qr_code || null,
        pairing_code: session.pairing_code || null,
        last_connected_at: session.last_connected_at || null,
        updated_at: now
      });
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO sessions (id, name, phone_number, status, qr_code, pairing_code, last_connected_at, created_at, updated_at)
        VALUES (@id, @name, @phone_number, @status, @qr_code, @pairing_code, @last_connected_at, @created_at, @updated_at)
      `);
      stmt.run({
        id: session.id,
        name: session.name || session.id,
        phone_number: session.phone_number || null,
        status: session.status || 'DISCONNECTED',
        qr_code: session.qr_code || null,
        pairing_code: session.pairing_code || null,
        last_connected_at: session.last_connected_at || null,
        created_at: session.created_at || now,
        updated_at: now
      });
    }
  }

  public findById(id: string): SessionRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    return stmt.get(id) as SessionRecord | undefined;
  }

  public findAll(): SessionRecord[] {
    const stmt = this.db.prepare('SELECT * FROM sessions ORDER BY created_at DESC');
    return stmt.all() as SessionRecord[];
  }

  public delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    stmt.run(id);
  }
}

export const sessionRepository = new SessionRepository();
