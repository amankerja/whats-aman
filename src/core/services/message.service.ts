import { sessionManager } from '../engine/session.manager';
import { messageRepository } from '../database/repositories/message.repository';
import { contactRepository } from '../database/repositories/contact.repository';
import { getDatabase } from '../database/connection';
import { eventBus } from '../events/event-bus';
import { NormalizedMessage } from '../events/event.types';
import { ValidationError, NotFoundError, EngineError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { renderMessageTemplate } from '../utils/message-parser.util';

export interface SendTextMessageDto {
  sessionId: string;
  to: string;
  text: string;
  quotedMessageId?: string;
  mentions?: string[];
  interpolateVariables?: boolean;
}

export interface SendMediaMessageDto {
  sessionId: string;
  to: string;
  mediaPathOrBuffer: string | Buffer;
  type: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  caption?: string;
  fileName?: string;
  mimeType?: string;
  quotedMessageId?: string;
}

export interface SendLocationMessageDto {
  sessionId: string;
  to: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface SendContactMessageDto {
  sessionId: string;
  to: string;
  contact: {
    name: string;
    phone: string;
    organization?: string;
  };
  quotedMessageId?: string;
}

export interface SendPollMessageDto {
  sessionId: string;
  to: string;
  poll: {
    name: string;
    values: string[];
    selectableCount?: number;
  };
  quotedMessageId?: string;
}

export class MessageService {
  private isInitialized = false;

  public initialize(): void {
    if (this.isInitialized) return;

    // Automatically persist all incoming messages to SQLite
    eventBus.on('message.received', ({ sessionId, message }) => {
      try {
        messageRepository.save(message, 'DELIVERED');

        // Auto-save/update contact in SQLite for 1-on-1 personal contacts (standard or LID)
        if (!message.fromMe && message.chatJid) {
          const session = sessionManager.findSession(sessionId);
          let phone: string | undefined = message.resolvedPhone;

          if (!phone) {
            if (message.chatJid.endsWith('@s.whatsapp.net') || message.chatJid.endsWith('@c.us')) {
              phone = message.chatJid.split('@')[0];
            } else if (message.chatJid.endsWith('@lid') && session) {
              phone = session.resolveLidToPhone?.(message.chatJid);
            }
          }

          if (phone && /^\d{7,16}$/.test(phone)) {
            contactRepository.upsert({
              sessionId,
              jid: message.chatJid,
              phone,
              pushName: message.pushName
            });
          }
        }
      } catch (err) {
        logger.error({ sessionId, msgId: message.id, err }, 'Failed to persist incoming message');
      }
    });

    // Automatically update message media URL when background download completes
    eventBus.on('message.updated', ({ sessionId, message }) => {
      try {
        if (message.mediaUrl) {
          messageRepository.updateMediaUrl(sessionId, message.id, message.mediaUrl);
        }
      } catch (err) {
        logger.error({ sessionId, msgId: message.id, err }, 'Failed to update message media url');
      }
    });

    // Automatically update message status on receipts (SENT, DELIVERED, READ)
    eventBus.on('message.ack', ({ sessionId, messageId, status }) => {
      try {
        messageRepository.updateStatus(sessionId, messageId, status);
      } catch (err) {
        logger.error({ sessionId, messageId, status, err }, 'Failed to update message status ack');
      }
    });

    this.isInitialized = true;
    logger.info('Message Service event persistence listener initialized');
  }
  public async sendText(dto: SendTextMessageDto): Promise<NormalizedMessage> {
    if (!dto.to || !dto.text?.trim()) {
      throw new ValidationError('Recipient (to) and text message are required');
    }

    let finalText = dto.text;
    if (dto.interpolateVariables) {
      const cleanPhone = dto.to.replace(/[^0-9]/g, '');
      const contact = contactRepository.findByPhone(dto.sessionId, cleanPhone);
      finalText = renderMessageTemplate(dto.text, {
        name: contact?.name || contact?.push_name || 'Sahabat',
        nama: contact?.name || contact?.push_name || 'Sahabat',
        phone: cleanPhone,
        nomor: cleanPhone,
        ...(contact?.custom_fields || {})
      });
    }

    const session = sessionManager.getSession(dto.sessionId);
    const sent = await session.sendText(dto.to, finalText, {
      quotedMessageId: dto.quotedMessageId,
      mentions: dto.mentions
    });

    // Save to local database
    messageRepository.save(sent, 'SENT');
    logger.info({ sessionId: dto.sessionId, to: dto.to, msgId: sent.id }, 'Text message sent and recorded');
    return sent;
  }

  public async sendMedia(dto: SendMediaMessageDto): Promise<NormalizedMessage> {
    if (!dto.to || !dto.mediaPathOrBuffer) {
      throw new ValidationError('Recipient (to) and media are required');
    }

    const session = sessionManager.getSession(dto.sessionId);
    const sent = await session.sendMedia(dto.to, dto.mediaPathOrBuffer, {
      type: dto.type,
      caption: dto.caption,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      quotedMessageId: dto.quotedMessageId
    });

    // Save to local database
    messageRepository.save(sent, 'SENT');
    logger.info({ sessionId: dto.sessionId, to: dto.to, msgId: sent.id, type: dto.type }, 'Media message sent and recorded');
    return sent;
  }

  public async sendLocation(dto: SendLocationMessageDto): Promise<NormalizedMessage> {
    if (!dto.to || dto.latitude === undefined || dto.longitude === undefined) {
      throw new ValidationError('Recipient (to), latitude, and longitude are required');
    }

    const session = sessionManager.getSession(dto.sessionId);
    if (!session.sendLocation) {
      throw new EngineError('Session engine does not support sendLocation');
    }

    const sent = await session.sendLocation(dto.to, dto.latitude, dto.longitude, {
      name: dto.name,
      address: dto.address
    });

    // Save to local database
    messageRepository.save(sent, 'SENT');
    logger.info(
      { sessionId: dto.sessionId, to: dto.to, msgId: sent.id, lat: dto.latitude, lng: dto.longitude },
      'Location message sent and recorded'
    );
    return sent;
  }

  public async sendContact(dto: SendContactMessageDto): Promise<NormalizedMessage> {
    if (!dto.to || !dto.contact || !dto.contact.name || !dto.contact.phone) {
      throw new ValidationError('Recipient (to), contact.name, and contact.phone are required');
    }

    const session = sessionManager.getSession(dto.sessionId);
    if (!session.sendContact) {
      throw new EngineError('Session engine does not support sendContact');
    }

    const sent = await session.sendContact(dto.to, dto.contact, {
      quotedMessageId: dto.quotedMessageId
    });

    messageRepository.save(sent, 'SENT');
    logger.info(
      { sessionId: dto.sessionId, to: dto.to, msgId: sent.id, contact: dto.contact.name },
      'Contact vCard sent and recorded'
    );
    return sent;
  }

  public async sendPoll(dto: SendPollMessageDto): Promise<NormalizedMessage> {
    if (!dto.to || !dto.poll || !dto.poll.name || !dto.poll.values || dto.poll.values.length < 2) {
      throw new ValidationError('Recipient (to), poll.name, and at least 2 poll.values are required');
    }

    const session = sessionManager.getSession(dto.sessionId);
    if (!session.sendPoll) {
      throw new EngineError('Session engine does not support sendPoll');
    }

    const sent = await session.sendPoll(dto.to, dto.poll, {
      quotedMessageId: dto.quotedMessageId,
      selectableCount: dto.poll.selectableCount
    });

    messageRepository.save(sent, 'SENT');
    logger.info(
      { sessionId: dto.sessionId, to: dto.to, msgId: sent.id, pollName: dto.poll.name },
      'Poll message sent and recorded'
    );
    return sent;
  }

  public getChatHistory(sessionId: string, chatJid: string, limit = 50, offset = 0) {
    const session = sessionManager.getSession(sessionId);
    const jidSet = new Set<string>([chatJid]);

    // If chatJid is LID, resolve phone JID
    if (chatJid.endsWith('@lid') && session) {
      const phone = session.resolveLidToPhone?.(chatJid);
      if (phone) {
        jidSet.add(`${phone}@s.whatsapp.net`);
      }
    } else if (chatJid.endsWith('@s.whatsapp.net')) {
      const phone = chatJid.split('@')[0];
      const meta = session?.getMetadata();
      if (meta?.phoneNumber && meta.phoneNumber === phone) {
        try {
          const db = getDatabase();
          const selfLids = db.prepare(`SELECT DISTINCT chat_jid FROM messages WHERE session_id = ? AND chat_jid LIKE '%@lid'`).all(sessionId) as any[];
          for (const row of selfLids) {
            if (session?.resolveLidToPhone?.(row.chat_jid) === phone) {
              jidSet.add(row.chat_jid);
            }
          }
        } catch {
          // ignore
        }
      }
    }

    return messageRepository.findByChat(sessionId, Array.from(jidSet), limit, offset);
  }

  public getRecentChats(sessionId: string, limit = 100) {
    const fetchLimit = Math.min(Math.max(limit * 2, 100), 500);
    const chats = messageRepository.findRecentChats(sessionId, fetchLimit);
    const session = sessionManager.findSession(sessionId);
    const sessionPhone = session?.getMetadata()?.phoneNumber;

    // Single batch-load of all contacts for this session (Eliminates N+1 synchronous queries!)
    let allContacts: any[] = [];
    const contactByPhoneMap = new Map<string, any>();
    try {
      allContacts = contactRepository.findAll(sessionId, 5000, 0);
      for (const contact of allContacts) {
        if (contact.phone) {
          contactByPhoneMap.set(contact.phone, contact);
        }
      }
    } catch {
      // ignore
    }

    const canonicalMap = new Map<string, any>();

    for (const c of chats) {
      let resolvedPhone: string | undefined = undefined;
      if (c.chat_jid.endsWith('@s.whatsapp.net') || c.chat_jid.endsWith('@c.us')) {
        resolvedPhone = c.chat_jid.split('@')[0];
      } else if (c.chat_jid.endsWith('@lid') && session) {
        resolvedPhone = session.resolveLidToPhone?.(c.chat_jid);
      }

      let finalName = c.name;
      let finalPushName = c.push_name;

      if (resolvedPhone && contactByPhoneMap.has(resolvedPhone)) {
        const contactByPhone = contactByPhoneMap.get(resolvedPhone);
        if (contactByPhone) {
          if (contactByPhone.name) {
            finalName = contactByPhone.name;
          }
          if (contactByPhone.push_name && !finalPushName) {
            finalPushName = contactByPhone.push_name;
          }
        }
      }

      const isSelf = Boolean(resolvedPhone && sessionPhone && resolvedPhone === sessionPhone);
      const dedupeKey = isSelf
        ? `self:${sessionPhone}`
        : (c.chat_jid.endsWith('@g.us') || c.chat_jid.endsWith('@newsletter'))
        ? c.chat_jid
        : resolvedPhone
        ? `phone:${resolvedPhone}`
        : c.chat_jid;

      const item = {
        ...c,
        name: finalName,
        push_name: finalPushName,
        resolved_phone: resolvedPhone
      };

      if (!canonicalMap.has(dedupeKey)) {
        canonicalMap.set(dedupeKey, item);
      } else {
        const existing = canonicalMap.get(dedupeKey);
        const newer = item.timestamp > existing.timestamp ? item : existing;
        const older = item.timestamp > existing.timestamp ? existing : item;

        const preferredJid = (newer.chat_jid.endsWith('@s.whatsapp.net') || !older.chat_jid.endsWith('@s.whatsapp.net'))
          ? newer.chat_jid
          : older.chat_jid;

        canonicalMap.set(dedupeKey, {
          ...newer,
          chat_jid: preferredJid,
          unread_count: (existing.unread_count || 0) + (item.unread_count || 0),
          name: newer.name || older.name,
          push_name: newer.push_name || older.push_name,
          resolved_phone: newer.resolved_phone || older.resolved_phone
        });
      }
    }

    // Merge contacts from already batch-loaded contacts if not present in messages yet (no second query!)
    for (const c of allContacts) {
      if (!c.phone) continue;
      const isSelf = Boolean(sessionPhone && c.phone === sessionPhone);
      const dedupeKey = isSelf ? `self:${sessionPhone}` : `phone:${c.phone}`;

      if (!canonicalMap.has(dedupeKey)) {
        canonicalMap.set(dedupeKey, {
          chat_jid: c.jid || `${c.phone}@s.whatsapp.net`,
          last_message: 'Mulai percakapan',
          last_from_me: 0,
          last_status: 'READ',
          timestamp: c.updated_at || c.created_at || 0,
          name: c.name || c.push_name || undefined,
          push_name: c.push_name || undefined,
          unread_count: 0,
          resolved_phone: c.phone
        });
      }
    }

    return Array.from(canonicalMap.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

export const messageService = new MessageService();
