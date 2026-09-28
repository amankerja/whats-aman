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
  SendLocationOptions,
  SendContactOptions,
  SendPollOptions,
  ContactInfo,
  GroupInfo
} from './engine.interface';
import { ConnectionStatus, NormalizedMessage } from '../events/event.types';
import { eventBus } from '../events/event-bus';
import { contactRepository } from '../database/repositories/contact.repository';
import { sessionRepository } from '../database/repositories/session.repository';
import { messageRepository } from '../database/repositories/message.repository';
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
  private profilePicCache: Map<string, { url: string | null; timestamp: number }> = new Map();

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
    if (this.socket) {
      try {
        this.socket.end(undefined);
      } catch (err) {
        // ignore
      }
      this.socket = null;
    }
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

      // Handle WhatsApp Phonebook Contact Sync
      this.socket.ev.on('contacts.upsert', (newContacts) => {
        for (const c of newContacts) {
          if (!c.id) continue;
          if (c.id.endsWith('@s.whatsapp.net') || c.id.endsWith('@c.us')) {
            const phone = c.id.split('@')[0];
            const name = c.name || c.notify || c.verifiedName;
            if (/^\d{7,16}$/.test(phone)) {
              contactRepository.upsert({
                sessionId: this.sessionId,
                jid: c.id,
                phone,
                name: name || undefined,
                pushName: c.notify || undefined
              });
            }
          }
        }
      });

      this.socket.ev.on('contacts.update', (updatedContacts) => {
        for (const c of updatedContacts) {
          if (!c.id) continue;
          if (c.id.endsWith('@s.whatsapp.net') || c.id.endsWith('@c.us')) {
            const phone = c.id.split('@')[0];
            const name = c.name || c.notify || c.verifiedName;
            if (/^\d{7,16}$/.test(phone)) {
              contactRepository.upsert({
                sessionId: this.sessionId,
                jid: c.id,
                phone,
                name: name || undefined,
                pushName: c.notify || undefined
              });
            }
          }
        }
      });

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

      // Sync contacts received from WhatsApp
      this.socket.ev.on('contacts.upsert', (contacts) => {
        for (const contact of contacts) {
          if (!contact.id) continue;
          let phone: string | undefined = undefined;
          if (contact.id.endsWith('@s.whatsapp.net') || contact.id.endsWith('@c.us')) {
            phone = contact.id.split('@')[0];
          } else if (contact.id.endsWith('@lid')) {
            phone = this.resolveLidToPhone(contact.id);
          }
          if (phone && /^\d{7,16}$/.test(phone)) {
            contactRepository.upsert({
              sessionId: this.sessionId,
              jid: `${phone}@s.whatsapp.net`,
              name: contact.name || contact.notify || undefined,
              pushName: contact.notify || undefined,
              phone
            });
          }
        }
      });

      // Handle Incoming Messages & Sync History
      this.socket.ev.on('messaging-history.set', async (history) => {
        logger.info({ sessionId: this.sessionId, chatsCount: history.chats?.length, msgsCount: history.messages?.length }, 'Syncing messaging history from WhatsApp');
        if (history.messages) {
          for (const msg of history.messages) {
            try {
              if (!msg.message) continue;
              const normalized = await this.normalizeMessage(msg);
              if (normalized) {
                eventBus.emit('message.received', { sessionId: this.sessionId, message: normalized });
              }
            } catch (err) {
              logger.warn({ sessionId: this.sessionId, msgId: msg.key?.id, err }, 'Failed to normalize history message');
            }
          }
        }
        if (history.contacts) {
          for (const c of history.contacts) {
            try {
              if (!c.id) continue;
              const phone = c.id.split('@')[0];
              if (/^\d{7,16}$/.test(phone)) {
                contactRepository.upsert({
                  sessionId: this.sessionId,
                  jid: c.id,
                  name: c.name || undefined,
                  pushName: c.notify || undefined,
                  phone
                });
              }
            } catch (err) {
              logger.warn({ sessionId: this.sessionId, contactId: c.id, err }, 'Failed to upsert history contact');
            }
          }
        }
        eventBus.emit('session.history_synced', {
          sessionId: this.sessionId,
          chatsCount: history.chats?.length,
          msgsCount: history.messages?.length
        });
      });

      // Handle Incoming Messages (process both 'notify' live messages and 'append' sync/offline/multi-device messages)
      this.socket.ev.on('messages.upsert', async (m) => {
        for (const msg of m.messages) {
          if (!msg.message) continue;

          try {
            const normalized = this.normalizeMessage(msg);
            if (normalized) {
              eventBus.emit('message.received', { sessionId: this.sessionId, message: normalized });
            }
          } catch (err) {
            logger.warn({ sessionId: this.sessionId, msgId: msg.key?.id, err }, 'Failed to normalize upsert message');
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
    let sent: any;
    try {
      sent = await this.socket.sendMessage(
        jid,
        {
          text,
          mentions: options?.mentions
        }
      );
    } catch (err: any) {
      logger.error({ sessionId: this.sessionId, jid, err: err?.message || String(err) }, 'Failed to send text message via WhatsApp socket');
      throw new EngineError(err?.message || 'Failed to send text message');
    }

    if (!sent) {
      throw new EngineError('Failed to send text message');
    }

    const normalized = await this.normalizeMessage(sent);
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
      if (mediaPathOrBuffer.startsWith('http://') || mediaPathOrBuffer.startsWith('https://')) {
        const res = await fetch(mediaPathOrBuffer);
        if (!res.ok) {
          throw new EngineError(`Failed to fetch media from URL: ${res.statusText}`);
        }
        buffer = Buffer.from(await res.arrayBuffer());
      } else {
        if (!fs.existsSync(mediaPathOrBuffer)) {
          throw new NotFoundError(`Media file not found at: ${mediaPathOrBuffer}`);
        }
        buffer = fs.readFileSync(mediaPathOrBuffer);
      }
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

    let sent: any;
    try {
      sent = await this.socket.sendMessage(jid, payload);
    } catch (err: any) {
      logger.error({ sessionId: this.sessionId, jid, err: err?.message || String(err) }, 'Failed to send media via socket');
      throw new EngineError(err?.message || 'Failed to send media message');
    }

    if (!sent) {
      throw new EngineError('Failed to send media message');
    }

    const sentId = sent.key.id || `${Date.now()}`;
    let ext = 'bin';
    if (options.type === 'image') ext = 'jpg';
    else if (options.type === 'video') ext = 'mp4';
    else if (options.type === 'audio') ext = 'ogg';
    else if (options.type === 'sticker') ext = 'webp';
    else if (options.fileName?.includes('.')) ext = options.fileName.split('.').pop() || 'bin';

    const mediaFileName = `${sentId}.${ext}`;
    const filePath = path.join(config.storage.mediaDir, mediaFileName);
    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, buffer);
      }
    } catch {
      // ignore
    }

    const normalized = await this.normalizeMessage(sent);
    normalized.mediaUrl = `/media/${mediaFileName}`;
    eventBus.emit('message.sent', { sessionId: this.sessionId, message: normalized });
    return normalized;
  }

  public async sendLocation(
    to: string,
    latitude: number,
    longitude: number,
    options?: { name?: string; address?: string }
  ): Promise<NormalizedMessage> {
    if (!this.socket || this.status !== 'CONNECTED') {
      throw new EngineError(`Session ${this.sessionId} is not connected`);
    }

    const jid = this.formatJid(to);
    const sent = await this.socket.sendMessage(jid, {
      location: {
        degreesLatitude: latitude,
        degreesLongitude: longitude,
        name: options?.name,
        address: options?.address
      }
    });

    if (!sent) {
      throw new EngineError('Failed to send location message');
    }

    const normalized = await this.normalizeMessage(sent);
    normalized.mediaType = 'location';
    eventBus.emit('message.sent', { sessionId: this.sessionId, message: normalized });
    return normalized;
  }

  public async sendContact(
    to: string,
    contact: { name: string; phone: string; organization?: string },
    options?: SendContactOptions
  ): Promise<NormalizedMessage> {
    if (!this.socket || this.status !== 'CONNECTED') {
      throw new EngineError(`Session ${this.sessionId} is not connected`);
    }

    const jid = this.formatJid(to);
    const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
    const orgLine = contact.organization ? `ORG:${contact.organization};\n` : '';
    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      `FN:${contact.name}\n` +
      orgLine +
      `TEL;type=CELL;type=VOICE;waid=${cleanPhone}:${contact.phone}\n` +
      'END:VCARD';

    let sent: any;
    try {
      sent = await this.socket.sendMessage(jid, {
        contacts: {
          displayName: contact.name,
          contacts: [{ vcard }]
        }
      });
    } catch (err: any) {
      logger.error({ sessionId: this.sessionId, jid, err: err?.message || String(err) }, 'Failed to send contact vCard');
      throw new EngineError(err?.message || 'Failed to send contact vCard');
    }

    if (!sent) {
      throw new EngineError('Failed to send contact vCard');
    }

    const normalized = await this.normalizeMessage(sent);
    normalized.mediaType = 'contact';
    eventBus.emit('message.sent', { sessionId: this.sessionId, message: normalized });
    return normalized;
  }

  public async sendPoll(
    to: string,
    poll: { name: string; values: string[]; selectableCount?: number },
    options?: SendPollOptions
  ): Promise<NormalizedMessage> {
    if (!this.socket || this.status !== 'CONNECTED') {
      throw new EngineError(`Session ${this.sessionId} is not connected`);
    }

    if (!poll.name || !poll.values || poll.values.length < 2) {
      throw new EngineError('Poll must have a question (name) and at least 2 options (values)');
    }

    const jid = this.formatJid(to);
    let sent: any;
    try {
      sent = await this.socket.sendMessage(jid, {
        poll: {
          name: poll.name,
          values: poll.values,
          selectableCount: poll.selectableCount || 1
        }
      });
    } catch (err: any) {
      logger.error({ sessionId: this.sessionId, jid, err: err?.message || String(err) }, 'Failed to send poll');
      throw new EngineError(err?.message || 'Failed to send poll message');
    }

    if (!sent) {
      throw new EngineError('Failed to send poll message');
    }

    const normalized = await this.normalizeMessage(sent);
    eventBus.emit('message.sent', { sessionId: this.sessionId, message: normalized });
    return normalized;
  }

  public async sendPresence(to: string, type: 'composing' | 'recording' | 'paused' | 'available' | 'unavailable' = 'composing'): Promise<void> {
    if (!this.socket || this.status !== 'CONNECTED') return;
    try {
      const jid = this.formatJid(to);
      await this.socket.sendPresenceUpdate(type as any, jid);
    } catch (err: any) {
      logger.debug({ sessionId: this.sessionId, to, type, err: err?.message }, 'Presence update skipped/failed');
    }
  }

  public async getContacts(): Promise<ContactInfo[]> {
    // In Baileys, contacts arrive via store or events
    // Return known contacts
    return [];
  }

  public async getGroups(): Promise<GroupInfo[]> {
    if (!this.socket || this.status !== 'CONNECTED') {
      return [];
    }

    try {
      const groups = await this.socket.groupFetchAllParticipating();
      if (!groups || typeof groups !== 'object') {
        return [];
      }
      return Object.values(groups).map((g) => ({
        jid: g.id,
        name: g.subject || g.id,
        topic: g.desc,
        ownerJid: g.owner,
        memberCount: Array.isArray(g.participants) ? g.participants.length : 0,
        participants: Array.isArray(g.participants) ? g.participants.map((p) => ({
          jid: p.id,
          phone: p.id.split('@')[0],
          role: (p.admin as any) || 'member'
        })) : []
      }));
    } catch (err: any) {
      logger.warn({ sessionId: this.sessionId, err: err?.message || String(err) }, 'Failed to fetch groups from WhatsApp socket (will retry when connection stabilizes)');
      return [];
    }
  }

  public async getGroupMetadata(groupJid: string): Promise<GroupInfo> {
    if (!this.socket || this.status !== 'CONNECTED') {
      throw new EngineError(`Session ${this.sessionId} is not connected`);
    }

    try {
      const g = await this.socket.groupMetadata(groupJid);
      if (!g) {
        throw new EngineError(`Group metadata not found for ${groupJid}`);
      }
      return {
        jid: g.id,
        name: g.subject || g.id,
        topic: g.desc,
        ownerJid: g.owner,
        memberCount: Array.isArray(g.participants) ? g.participants.length : 0,
        participants: Array.isArray(g.participants) ? g.participants.map((p) => ({
          jid: p.id,
          phone: p.id.split('@')[0],
          role: (p.admin as any) || 'member'
        })) : []
      };
    } catch (err: any) {
      throw new EngineError(`Failed to fetch group metadata: ${err?.message || String(err)}`);
    }
  }

  public resolveLidToPhone(lid: string): string | undefined {
    if (!lid) return undefined;
    const cleanLid = lid.replace('@lid', '').trim();
    const filePath = path.join(this.authPath, `lid-mapping-${cleanLid}_reverse.json`);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const phone = JSON.parse(raw);
        if (typeof phone === 'string' && phone.length > 5) return phone;
      } catch {
        // ignore
      }
    }
    return undefined;
  }

  private updateStatus(newStatus: ConnectionStatus): void {
    this.status = newStatus;
    this.saveMetadata();
    sessionRepository.upsert({
      id: this.sessionId,
      name: this.sessionName,
      status: newStatus,
      phone_number: this.phoneNumber,
      qr_code: this.qrCode,
      pairing_code: this.pairingCode,
      last_connected_at: this.lastConnectedAt
    });
    eventBus.emit('session.status', { sessionId: this.sessionId, status: newStatus });
  }

  private formatJid(target: string): string {
    if (target.includes('@')) return target;
    const clean = target.replace(/[^0-9]/g, '');
    return `${clean}@s.whatsapp.net`;
  }

  private normalizeMessage(msg: WAMessage): NormalizedMessage {
    let content: any = msg.message;

    // Unwrap ephemeral, view-once, and wrapped messages
    while (
      content?.ephemeralMessage?.message ||
      content?.viewOnceMessage?.message ||
      content?.viewOnceMessageV2?.message ||
      content?.viewOnceMessageV2Extension?.message ||
      content?.documentWithCaptionMessage?.message ||
      content?.editedMessage?.message?.protocolMessage?.editedMessage
    ) {
      content =
        content.ephemeralMessage?.message ||
        content.viewOnceMessage?.message ||
        content.viewOnceMessageV2?.message ||
        content.viewOnceMessageV2Extension?.message ||
        content.documentWithCaptionMessage?.message ||
        content.editedMessage?.message?.protocolMessage?.editedMessage;
    }

    let text: string | undefined;
    let mediaType: NormalizedMessage['mediaType'];
    let caption: string | undefined;
    let mediaUrl: string | undefined;
    let ext = 'bin';

    if (content?.conversation) {
      text = content.conversation;
    } else if (content?.extendedTextMessage?.text) {
      text = content.extendedTextMessage.text;
    } else if (content?.imageMessage) {
      mediaType = 'image';
      caption = content.imageMessage.caption || undefined;
      ext = 'jpg';
    } else if (content?.videoMessage) {
      mediaType = 'video';
      caption = content.videoMessage.caption || undefined;
      ext = 'mp4';
    } else if (content?.audioMessage) {
      mediaType = 'audio';
      caption = content.audioMessage.ptt ? 'Pesan suara' : undefined;
      ext = content.audioMessage.ptt ? 'ogg' : 'mp3';
    } else if (content?.documentMessage) {
      mediaType = 'document';
      caption = content.documentMessage.caption || content.documentMessage.fileName || undefined;
      const fileName = content.documentMessage.fileName || '';
      ext = fileName.includes('.') ? fileName.split('.').pop() || 'pdf' : 'pdf';
    } else if (content?.stickerMessage) {
      mediaType = 'sticker';
      ext = 'webp';
    } else if (content?.interactiveResponseMessage?.body?.text) {
      text = content.interactiveResponseMessage.body.text;
    } else if (content?.buttonsResponseMessage?.selectedDisplayText) {
      text = content.buttonsResponseMessage.selectedDisplayText;
    } else if (content?.templateButtonReplyMessage?.selectedDisplayText) {
      text = content.templateButtonReplyMessage.selectedDisplayText;
    } else if (content?.listResponseMessage?.title || content?.listResponseMessage?.singleSelectReply?.selectedRowId) {
      text = content.listResponseMessage.title || content.listResponseMessage.singleSelectReply?.selectedRowId;
    } else if (content?.locationMessage) {
      mediaType = 'location';
      const locName = [content.locationMessage.name, content.locationMessage.address].filter(Boolean).join(', ');
      text = locName ? `📍 Lokasi: ${locName}` : `📍 Lokasi (${content.locationMessage.degreesLatitude}, ${content.locationMessage.degreesLongitude})`;
    } else if (content?.contactMessage?.displayName) {
      text = `👤 Kontak: ${content.contactMessage.displayName}`;
    } else if (content?.pollCreationMessage || content?.pollCreationMessageV3) {
      text = `📊 Polling: ${content.pollCreationMessage?.name || content.pollCreationMessageV3?.name || ''}`;
    } else if (content?.reactionMessage) {
      text = content.reactionMessage.text ? `Bereaksi: ${content.reactionMessage.text}` : undefined;
    } else if (content?.protocolMessage?.type === 0) {
      text = '🚫 Pesan ini telah dihapus';
    }

    const msgId = msg.key.id || `${Date.now()}`;

    // Fast check for pre-existing media or queue background download non-blocking
    if (mediaType) {
      const mediaFileName = `${msgId}.${ext}`;
      const filePath = path.join(config.storage.mediaDir, mediaFileName);
      if (fs.existsSync(filePath)) {
        mediaUrl = `/media/${mediaFileName}`;
      } else if (this.socket) {
        // Queue asynchronous background media download (non-blocking!)
        this.queueMediaDownload(msg, msgId, ext);
      }
    }

    const timestamp = typeof msg.messageTimestamp === 'number'
      ? msg.messageTimestamp * 1000
      : Date.now();

    // Fast LID resolution for normalized message
    const rawChatJid = msg.key.remoteJid || '';
    let resolvedPhone: string | undefined;
    if (rawChatJid.endsWith('@s.whatsapp.net') || rawChatJid.endsWith('@c.us')) {
      resolvedPhone = rawChatJid.split('@')[0].split(':')[0];
    } else if (rawChatJid.endsWith('@lid')) {
      resolvedPhone = this.resolveLidToPhone(rawChatJid);
      if (!resolvedPhone) {
        const cleanLid = rawChatJid.replace('@lid', '').trim();
        const contact = contactRepository.findByJid(this.sessionId, rawChatJid) || contactRepository.findByPhone(this.sessionId, cleanLid);
        if (contact?.phone) {
          resolvedPhone = contact.phone;
        }
      }
    }

    return {
      id: msgId,
      sessionId: this.sessionId,
      chatJid: rawChatJid,
      senderJid: msg.key.participant || rawChatJid,
      fromMe: Boolean(msg.key.fromMe),
      pushName: msg.pushName || undefined,
      text,
      mediaType,
      mediaUrl,
      caption,
      timestamp,
      resolvedPhone
    };
  }

  private queueMediaDownload(msg: WAMessage, msgId: string, ext: string): void {
    const mediaFileName = `${msgId}.${ext}`;
    const filePath = path.join(config.storage.mediaDir, mediaFileName);

    setImmediate(async () => {
      try {
        if (!this.socket || fs.existsSync(filePath)) return;

        const buffer = await downloadMediaMessage(
          msg,
          'buffer',
          {},
          {
            logger: pino({ level: 'silent' }),
            reuploadRequest: this.socket.updateMediaMessage
          }
        );

        if (buffer && buffer.length > 0) {
          await fs.promises.writeFile(filePath, buffer);
          const mediaUrl = `/media/${mediaFileName}`;
          messageRepository.updateMediaUrl(this.sessionId, msgId, mediaUrl);

          const updatedMsg = this.normalizeMessage(msg);
          updatedMsg.mediaUrl = mediaUrl;
          eventBus.emit('message.updated', { sessionId: this.sessionId, message: updatedMsg });
          logger.debug({ sessionId: this.sessionId, msgId, mediaUrl }, 'Background media download finished');
        }
      } catch (err: any) {
        logger.warn({ sessionId: this.sessionId, msgId, err: err?.message || 'Download failed' }, 'Async media download failed');
      }
    });
  }

  public async getProfilePictureUrl(targetJid?: string, forceRefresh = false): Promise<string | null> {
    if (!this.socket) {
      return null;
    }

    try {
      let jid = targetJid?.trim();
      if (!jid) {
        jid = this.socket.user?.id;
      }
      if (!jid) return null;

      // Clean device ID if present (e.g. 628123:4@s.whatsapp.net -> 628123@s.whatsapp.net)
      if (jid.includes(':') && jid.includes('@')) {
        jid = jid.replace(/:[0-9]+@/, '@');
      }

      // Handle pure phone numbers
      if (/^\+?\d+$/.test(jid)) {
        jid = `${jid.replace('+', '')}@s.whatsapp.net`;
      }

      // Check cache first
      if (!forceRefresh) {
        const cached = this.profilePicCache.get(jid);
        if (cached) {
          // If we found a valid URL, cache for 15 minutes
          if (cached.url && Date.now() - cached.timestamp < 15 * 60 * 1000) {
            return cached.url;
          }
          // If previous attempt returned null, throttle for only 15 seconds before retrying
          if (!cached.url && Date.now() - cached.timestamp < 15 * 1000) {
            return null;
          }
        }
      }

      let url: string | undefined = undefined;

      // 1. If Newsletter / Channel, fetch metadata from Baileys newsletterMetadata
      if (jid.endsWith('@newsletter')) {
        try {
          const meta: any = await (this.socket as any).newsletterMetadata?.('jid', jid);
          const directPath = meta?.thread_metadata?.picture?.direct_path || meta?.thread_metadata?.preview?.direct_path;
          if (directPath) {
            url = directPath.startsWith('http') ? directPath : `https://pps.whatsapp.net${directPath}`;
          }
        } catch {
          // ignore and fall back to standard lookup
        }
      }

      // 2. If LID, attempt resolution to phone number first
      if (!url && jid.endsWith('@lid')) {
        let resolvedPhone = this.resolveLidToPhone(jid);
        if (!resolvedPhone) {
          const cleanLid = jid.replace('@lid', '').trim();
          const contact = contactRepository.findByJid(this.sessionId, jid) || contactRepository.findByPhone(this.sessionId, cleanLid);
          if (contact?.phone) {
            resolvedPhone = contact.phone;
          }
        }

        if (resolvedPhone) {
          const phoneJid = `${resolvedPhone}@s.whatsapp.net`;
          try {
            url = await this.socket.profilePictureUrl(phoneJid, 'image');
          } catch {
            try {
              url = await this.socket.profilePictureUrl(phoneJid, 'preview');
            } catch {
              // ignore
            }
          }
        }
      }

      // 3. Query direct JID (handles groups @g.us, contacts @s.whatsapp.net, or direct LIDs)
      if (!url) {
        try {
          url = await this.socket.profilePictureUrl(jid, 'image');
        } catch {
          try {
            url = await this.socket.profilePictureUrl(jid, 'preview');
          } catch {
            // no picture or blocked
          }
        }
      }

      const finalUrl = url || null;
      this.profilePicCache.set(jid, { url: finalUrl, timestamp: Date.now() });
      return finalUrl;
    } catch {
      return null;
    }
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
