import fs from 'fs';
import path from 'path';
import { IWhatsAppEngine, SessionMetadata } from './engine.interface';
import { BaileysAdapter } from './baileys.adapter';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { NotFoundError, ConflictError } from '../../utils/errors';

export class SessionManager {
  private sessions: Map<string, IWhatsAppEngine> = new Map();

  public async initialize(): Promise<void> {
    logger.info('Initializing Session Manager...');
    const sessionsDir = config.storage.sessionsDir;

    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
      return;
    }

    const dirs = fs.readdirSync(sessionsDir, { withFileTypes: true });

    for (const entry of dirs) {
      if (entry.isDirectory()) {
        const sessionId = entry.name;
        try {
          const adapter = new BaileysAdapter(sessionId);
          this.sessions.set(sessionId, adapter);
          logger.info({ sessionId }, 'Discovered existing session');

          // Auto-reconnect if session was previously active with valid auth credentials
          const authDir = path.join(sessionsDir, sessionId, 'auth');
          const hasCreds = fs.existsSync(path.join(authDir, 'creds.json'));
          if (hasCreds) {
            logger.info({ sessionId }, 'Auto-connecting saved session...');
            adapter.connect().catch((err) => {
              logger.warn({ sessionId, err: err.message }, 'Failed auto-connect on boot');
            });
          }
        } catch (err) {
          logger.error({ sessionId, err }, 'Failed to initialize session directory');
        }
      }
    }

    logger.info(`Loaded ${this.sessions.size} session(s) from storage`);
  }

  public async createSession(sessionId: string, name?: string): Promise<IWhatsAppEngine> {
    const cleanId = sessionId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanId) {
      throw new Error('Invalid session ID. Use alphanumeric, hyphens or underscores.');
    }

    if (this.sessions.has(cleanId)) {
      throw new ConflictError(`Session '${cleanId}' already exists`);
    }

    const adapter = new BaileysAdapter(cleanId, name);
    this.sessions.set(cleanId, adapter);
    logger.info({ sessionId: cleanId, name }, 'Session created successfully');
    return adapter;
  }

  public getSession(sessionId: string): IWhatsAppEngine {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundError(`Session '${sessionId}' not found`);
    }
    return session;
  }

  public getAllSessions(): SessionMetadata[] {
    return Array.from(this.sessions.values()).map((s) => s.getMetadata());
  }

  public async startSession(
    sessionId: string,
    options?: { usePairingCode?: boolean; phoneNumber?: string }
  ): Promise<void> {
    const session = this.getSession(sessionId);
    await session.connect(options);
  }

  public async stopSession(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    await session.disconnect();
  }

  public async deleteSession(sessionId: string): Promise<void> {
    const session = this.getSession(sessionId);
    await session.logout();
    this.sessions.delete(sessionId);

    // Delete session files
    const sessionDir = path.join(config.storage.sessionsDir, sessionId);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
    logger.info({ sessionId }, 'Session deleted completely');
  }
}

export const sessionManager = new SessionManager();
