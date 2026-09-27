import { sessionManager } from '../engine/session.manager';
import { messageRepository } from '../database/repositories/message.repository';
import { contactRepository } from '../database/repositories/contact.repository';
import { eventBus } from '../events/event-bus';
import { NormalizedMessage } from '../events/event.types';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface SendTextMessageDto {
  sessionId: string;
  to: string;
  text: string;
  quotedMessageId?: string;
  mentions?: string[];
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

export class MessageService {
  private isInitialized = false;

  public initialize(): void {
    if (this.isInitialized) return;

    // Automatically persist all incoming messages to SQLite
    eventBus.on('message.received', ({ sessionId, message }) => {
      messageRepository.save(message, 'DELIVERED');

      // Auto-save/update contact in SQLite
      if (!message.fromMe && message.senderJid) {
        const cleanPhone = message.senderJid.replace(/[^0-9]/g, '');
        contactRepository.upsert({
          sessionId,
          jid: message.chatJid,
          phone: cleanPhone,
          pushName: message.pushName
        });
      }
    });

    // Automatically update message status on receipts (SENT, DELIVERED, READ)
    eventBus.on('message.ack', ({ sessionId, messageId, status }) => {
      messageRepository.updateStatus(sessionId, messageId, status);
    });

    this.isInitialized = true;
    logger.info('Message Service event persistence listener initialized');
  }
  public async sendText(dto: SendTextMessageDto): Promise<NormalizedMessage> {
    if (!dto.to || !dto.text?.trim()) {
      throw new ValidationError('Recipient (to) and text message are required');
    }

    const session = sessionManager.getSession(dto.sessionId);
    const sent = await session.sendText(dto.to, dto.text, {
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

  public getChatHistory(sessionId: string, chatJid: string, limit = 50, offset = 0) {
    return messageRepository.findByChat(sessionId, chatJid, limit, offset);
  }

  public getRecentChats(sessionId: string, limit = 50) {
    return messageRepository.findRecentChats(sessionId, limit);
  }
}

export const messageService = new MessageService();
