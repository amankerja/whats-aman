import path from 'path';
import fs from 'fs';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  proto,
  WAMessage,
  downloadMediaMessage
} from '@whiskeysockets/baileys';

import {
  IWhatsAppEngine,
  SessionMetadata,
  SendTextOptions,
  SendMediaOptions,
  ContactInfo,
  GroupInfo
} from './engine.interface';
import { ConnectionStatus, NormalizedMessage } from '../events/event.types';
import { eventBus } from '../events/event-bus';
import { logger } from '../../utils/logger';
import { config } from '../../config';
import { EngineError, NotFoundError } from '../../utils/errors';

export class BaileysAdapter implements IWhatsAppEngine {
  public readonly sessionId: string;
  private sessionName: string;
  private socket: WASocket | null = null;
  private status: ConnectionStatus = 'DISCONNECTED';
  private qrCode?: string;
  private pairingCode?: string;
  private phoneNumber?: string;
  private lastConnectedAt?: number;
  private createdAt: number;
  private reconnectAttempts = 0;
  private isExplicitDisconnect = false;

  private authPath: string;
  private metaPath: string;

  constructor(sessionId: string, sessionName?: string) {
    this.sessionId = sessionId;
    this.sessionName = sessionName || sessionId;
    this.createdAt = Date.now();

    const sessionDir = path.join(config.storage.sessionsDir, this.sessionId);
    this.authPath = path.join(sessionDir, 'auth');
    this.metaPath = path.join(sessionDir, 'metadata.json');

    if (!fs.existsSync(this.authPath)) {
      fs.mkdirSync(this.authPath, { recursive: true });
    }

    this.loadMetadata();
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getMetadata(): SessionMetadata {
    return {
      id: this.sessionId,
      name: this.sessionName,
      phoneNumber: this.phoneNumber,
      status: this.status,
      qrCode: this.qrCode,
      pairingCode: this.pairingCode,
      lastConnectedAt: this.lastConnectedAt,
      createdAt: this.createdAt
    };
  }

  private loadMetadata(): void {
    try {
      if (fs.existsSync(this.metaPath)) {
        const raw = fs.readFileSync(this.metaPath, 'utf-8');
        const data = JSON.parse(raw);
        this.sessionName = data.name || this.sessionName;
        this.phoneNumber = data.phoneNumber || this.phoneNumber;
        this.lastConnectedAt = data.lastConnectedAt || this.lastConnectedAt;
        this.createdAt = data.createdAt || this.createdAt;
      }
    } catch (err) {
      logger.warn({ sessionId: this.sessionId, err }, 'Failed to read session metadata');
    }
  }

  private saveMetadata(): void {
    try {
      const data = this.getMetadata();
      fs.writeFileSync(this.metaPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      logger.warn({ sessionId: this.sessionId, err }, 'Failed to save session metadata');
    }
  }

  public async connect(options?: { usePairingCode?: boolean; phoneNumber?: string }): Promise<void> {
    this.isExplicitDisconnect = false;
    this.updateStatus('CONNECTING');

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

      // Create silent logger for Baileys internal logs
      const baileysLogger = pino({ level: 'silent' });

      this.socket = makeWASocket({
        auth: state,
        logger: baileysLogger,
        printQRInTerminal: false,
        browser: config.whatsapp.browser,
        syncFullHistory: config.whatsapp.syncFullHistory,
        generateHighQualityLinkPreview: true
      });

      // Save credentials whenever updated
      this.socket.ev.on('creds.update', saveCreds);

      // Handle Pairing Code if requested
      if (options?.usePairingCode && options.phoneNumber && !this.socket.authState.creds.registered) {
        const cleanPhone = options.phoneNumber.replace(/[^0-9]/g, '');
        this.phoneNumber = cleanPhone;
        // Wait slightly before requesting pairing code per Baileys guideline
        setTimeout(async () => {
          try {
            if (this.socket && !this.socket.authState.creds.registered) {
              const code = await this.socket.requestPairingCode(cleanPhone);
              this.pairingCode = code;
              this.updateStatus('PAIRING_READY');
              eventBus.emit('session.pairing_code', { sessionId: this.sessionId, code });
              logger.info({ sessionId: this.sessionId, code }, 'Pairing code generated');
            }
          } catch (err) {
            logger.error({ sessionId: this.sessionId, err }, 'Failed to request pairing code');
          }
        }, 3000);
      }

      // Handle Connection Update
      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !options?.usePairingCode) {
          try {
            const qrDataUrl = await QRCode.toDataURL(qr);
            this.qrCode = qrDataUrl;
            this.updateStatus('QR_READY');
            eventBus.emit('session.qr', { sessionId: this.sessionId, qr: qrDataUrl });
            logger.info({ sessionId: this.sessionId }, 'QR Code generated for session');
          } catch (qrErr) {
            logger.error({ sessionId: this.sessionId, qrErr }, 'Failed to generate QR data URL');
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut && !this.isExplicitDisconnect;

          logger.warn(
            { sessionId: this.sessionId, statusCode, shouldReconnect },
            `Connection closed: ${(lastDisconnect?.error as Error)?.message || 'Unknown'}`
          );

          this.qrCode = undefined;
          this.pairingCode = undefined;

          if (statusCode === DisconnectReason.loggedOut) {
            this.updateStatus('DISCONNECTED');
            eventBus.emit('session.disconnected', { sessionId: this.sessionId, reason: 'LOGGED_OUT' });
            // Clean auth state if logged out
            this.cleanupAuthFiles();
          } else if (shouldReconnect) {
            if (this.reconnectAttempts < config.whatsapp.reconnectMaxRetries) {
              this.reconnectAttempts++;
              const delay = Math.min(3000 * this.reconnectAttempts, 15000);
              logger.info({ sessionId: this.sessionId, attempt: this.reconnectAttempts, delay }, 'Reconnecting...');
              setTimeout(() => this.connect(options), delay);
            } else {
              this.updateStatus('DISCONNECTED');
              eventBus.emit('session.disconnected', { sessionId: this.sessionId, reason: 'MAX_RETRIES_EXCEEDED' });
            }
          } else {
            this.updateStatus('DISCONNECTED');
            eventBus.emit('session.disconnected', { sessionId: this.sessionId, reason: 'DISCONNECTED' });
          }
        } else if (connection === 'open') {
          this.reconnectAttempts = 0;
          this.qrCode = undefined;
          this.pairingCode = undefined;
          this.lastConnectedAt = Date.now();

          const userJid = this.socket?.user?.id || '';
          this.phoneNumber = userJid.split(':')[0] || userJid.split('@')[0];

          this.updateStatus('CONNECTED');
          this.saveMetadata();

          eventBus.emit('session.connected', {
            sessionId: this.sessionId,
            phone: this.phoneNumber,
            pushName: this.socket?.user?.name
          });

          logger.info({ sessionId: this.sessionId, phone: this.phoneNumber }, 'WhatsApp connected successfully');
        }
      });

      // Handle Incoming Messages
      this.socket.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
          if (!msg.message) continue;

          const normalized = this.normalizeMessage(msg);
          if (normalized) {
            eventBus.emit('message.received', { sessionId: this.sessionId, message: normalized });
          }
        }
      });

      // Handle Message Acknowledgement / Status updates (Sent, Delivered, Read)
      this.socket.ev.on('messages.update', (updates) => {
        for (const update of updates) {
          const statusMap: Record<number, 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'> = {
            2: 'SENT',
            3: 'DELIVERED',
            4: 'READ',
            5: 'READ',
            0: 'FAILED',
            1: 'FAILED'
          };

          const rawStatus = update.update.status;
          if (typeof rawStatus === 'number' && statusMap[rawStatus]) {
            eventBus.emit('message.ack', {
              sessionId: this.sessionId,
              messageId: update.key.id || '',
              chatJid: update.key.remoteJid || '',
              status: statusMap[rawStatus]
            });
          }
        }
      });
    } catch (err: any) {
      this.updateStatus('DISCONNECTED');
      logger.error({ sessionId: this.sessionId, err }, 'Fatal error during connection');
      throw new EngineError(`Failed to connect session ${this.sessionId}: ${err.message}`);
    }
  }

  public async disconnect(): Promise<void> {
    this.isExplicitDisconnect = true;
    if (this.socket) {
      try {
        this.socket.end(undefined);
      } catch (err) {
        logger.warn({ sessionId: this.sessionId, err }, 'Error ending socket');
      }
      this.socket = null;
    }
    this.updateStatus('DISCONNECTED');
    this.qrCode = undefined;
    this.pairingCode = undefined;
    eventBus.emit('session.disconnected', { sessionId: this.sessionId, reason: 'MANUAL_DISCONNECT' });
  }

  public async logout(): Promise<void> {
    this.isExplicitDisconnect = true;
    if (this.socket) {
      try {
        await this.socket.logout();
      } catch (err) {
        logger.warn({ sessionId: this.sessionId, err }, 'Error during logout');
      }
      this.socket = null;
    }
    this.updateStatus('DISCONNECTED');
    this.cleanupAuthFiles();
    this.saveMetadata();
    eventBus.emit('session.disconnected', { sessionId: this.sessionId, reason: 'LOGGED_OUT' });
  }

  public async sendText(to: string, text: string, options?: SendTextOptions): Promise<NormalizedMessage> {
    if (!this.socket || this.status !== 'CONNECTED') {
      throw new EngineError(`Session ${this.sessionId} is not connected`);
    }

    const jid = this.formatJid(to);
    const sent = await this.socket.sendMessage(
      jid,
      {
        text,
        mentions: options?.mentions
      },
      {
        quoted: options?.quotedMessageId ? ({ key: { id: options.quotedMessageId } } as any) : undefined
      }
    );

    if (!sent) {
      throw new EngineError('Failed to send text message');
    }

    const normalized = this.normalizeMessage(sent);
    eventBus.emit('message.sent', { sessionId: this.sessionId, message: normalized });
    return normalized;
  }

  public async sendMedia(
    to: string,
    mediaPathOrBuffer: string | Buffer,
    options: SendMediaOptions
  ): Promise<NormalizedMessage> {
    if (!this.socket || this.status !== 'CONNECTED') {
      throw new EngineError(`Session ${this.sessionId} is not connected`);
    }

    const jid = this.formatJid(to);
    let payload: any = {};

    let buffer: Buffer;
    if (typeof mediaPathOrBuffer === 'string') {
      if (!fs.existsSync(mediaPathOrBuffer)) {
        throw new NotFoundError(`Media file not found at: ${mediaPathOrBuffer}`);
      }
      buffer = fs.readFileSync(mediaPathOrBuffer);
    } else {
      buffer = mediaPathOrBuffer;
    }

    switch (options.type) {
      case 'image':
        payload = { image: buffer, caption: options.caption };
        break;
      case 'video':
        payload = { video: buffer, caption: options.caption };
        break;
      case 'audio':
        payload = { audio: buffer, mimetype: options.mimeType || 'audio/mp4' };
        break;
      case 'document':
        payload = {
          document: buffer,
          mimetype: options.mimeType || 'application/octet-stream',
          fileName: options.fileName || 'file',
          caption: options.caption
        };
        break;
      case 'sticker':
        payload = { sticker: buffer };
        break;
      default:
        payload = { document: buffer, mimetype: 'application/octet-stream' };
    }

    const sent = await this.socket.sendMessage(jid, payload, {
      quoted: options.quotedMessageId ? ({ key: { id: options.quotedMessageId } } as any) : undefined
    });

    if (!sent) {
      throw new EngineError('Failed to send media message');
    }

    const normalized = this.normalizeMessage(sent);
    eventBus.emit('message.sent', { sessionId: this.sessionId, message: normalized });
    return normalized;
  }

  public async getContacts(): Promise<ContactInfo[]> {
    // In Baileys, contacts arrive via store or events
    // Return known contacts
    return [];
  }

  public async getGroups(): Promise<GroupInfo[]> {
    if (!this.socket || this.status !== 'CONNECTED') {
      throw new EngineError(`Session ${this.sessionId} is not connected`);
    }

    try {
      const groups = await this.socket.groupFetchAllParticipating();
      return Object.values(groups).map((g) => ({
        jid: g.id,
        name: g.subject,
        topic: g.desc,
        ownerJid: g.owner,
        memberCount: g.participants.length,
        participants: g.participants.map((p) => ({
          jid: p.id,
          phone: p.id.split('@')[0],
          role: (p.admin as any) || 'member'
        }))
      }));
    } catch (err: any) {
      throw new EngineError(`Failed to fetch groups: ${err.message}`);
    }
  }

  public async getGroupMetadata(groupJid: string): Promise<GroupInfo> {
    if (!this.socket || this.status !== 'CONNECTED') {
      throw new EngineError(`Session ${this.sessionId} is not connected`);
    }

    try {
      const g = await this.socket.groupMetadata(groupJid);
      return {
        jid: g.id,
        name: g.subject,
        topic: g.desc,
        ownerJid: g.owner,
        memberCount: g.participants.length,
        participants: g.participants.map((p) => ({
          jid: p.id,
          phone: p.id.split('@')[0],
          role: (p.admin as any) || 'member'
        }))
      };
    } catch (err: any) {
      throw new EngineError(`Failed to fetch group metadata: ${err.message}`);
    }
  }

  private updateStatus(newStatus: ConnectionStatus): void {
    this.status = newStatus;
    this.saveMetadata();
    eventBus.emit('session.status', { sessionId: this.sessionId, status: newStatus });
  }

  private formatJid(target: string): string {
    if (target.includes('@')) return target;
    const clean = target.replace(/[^0-9]/g, '');
    return `${clean}@s.whatsapp.net`;
  }

  private normalizeMessage(msg: WAMessage): NormalizedMessage {
    const content = msg.message;
    let text: string | undefined;
    let mediaType: NormalizedMessage['mediaType'];
    let caption: string | undefined;

    if (content?.conversation) {
      text = content.conversation;
    } else if (content?.extendedTextMessage?.text) {
      text = content.extendedTextMessage.text;
    } else if (content?.imageMessage) {
      mediaType = 'image';
      caption = content.imageMessage.caption || undefined;
    } else if (content?.videoMessage) {
      mediaType = 'video';
      caption = content.videoMessage.caption || undefined;
    } else if (content?.audioMessage) {
      mediaType = 'audio';
    } else if (content?.documentMessage) {
      mediaType = 'document';
      caption = content.documentMessage.caption || undefined;
    }

    const timestamp = typeof msg.messageTimestamp === 'number'
      ? msg.messageTimestamp * 1000
      : Date.now();

    return {
      id: msg.key.id || `${Date.now()}`,
      sessionId: this.sessionId,
      chatJid: msg.key.remoteJid || '',
      senderJid: msg.key.participant || msg.key.remoteJid || '',
      fromMe: Boolean(msg.key.fromMe),
      pushName: msg.pushName || undefined,
      text,
      mediaType,
      caption,
      timestamp
    };
  }

  private cleanupAuthFiles(): void {
    try {
      if (fs.existsSync(this.authPath)) {
        fs.rmSync(this.authPath, { recursive: true, force: true });
        fs.mkdirSync(this.authPath, { recursive: true });
      }
    } catch (err) {
      logger.warn({ sessionId: this.sessionId, err }, 'Failed to cleanup auth files');
    }
  }
}
