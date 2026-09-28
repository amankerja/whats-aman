import crypto from 'crypto';
import { eventBus } from '../events/event-bus';
import { NormalizedMessage } from '../events/event.types';
import { automationRepository, AutomationRuleRecord, AutoReplyConfig, AutomationAction } from '../database/repositories/automation.repository';
import { contactRepository } from '../database/repositories/contact.repository';
import { crmService } from './crm.service';
import { chatFlowService } from './chatflow.service';
import { groupService } from './group.service';
import { sessionManager } from '../engine/session.manager';
import { logger } from '../../utils/logger';
import { renderMessageTemplate } from '../utils/message-parser.util';

export class AutomationService {
  private isInitialized = false;
  // Cooldown map: key = `${sessionId}:${phone}`, value = timestamp last replied
  private contactCooldowns: Map<string, number> = new Map();
  // Duplicate message suppression map: key = `${sessionId}:${chatJid}`, value = last replied normalized text
  private lastRepliedTextByChat: Map<string, string> = new Map();

  public initialize(): void {
    if (this.isInitialized) return;

    logger.info('Initializing Automation Engine listener (AMAN CHAT Pro Edition)...');
    this.seedDefaultRules();
    eventBus.on('message.received', async ({ sessionId, message }) => {
      await this.handleIncomingMessage(sessionId, message);
    });

    this.isInitialized = true;
  }

  public seedDefaultRules(): void {
    const existing = automationRepository.findAll();
    if (existing.length === 0) {
      logger.info('Seeding default automation rules with auto-tagging & stages...');
      const defaultRules = [
        {
          id: 'rule-greeting',
          name: 'Greeting & Sambutan Hangat',
          conditions: [{ field: 'text' as const, operator: 'contains' as const, value: 'halo' }],
          actions: [
            {
              type: 'reply_text' as const,
              text: '{Halo|Hai|Selamat datang} {{name}}! 👋\n\nTerima kasih telah menghubungi kami. Ada yang bisa kami bantu hari ini?\n\nKetik *MENU* untuk melihat daftar layanan dan bantuan yang tersedia.'
            },
            {
              type: 'add_tag' as const,
              tag: '🔵 New Lead'
            }
          ],
          isActive: true
        },
        {
          id: 'rule-menu',
          name: 'Menu Layanan & Informasi',
          conditions: [{ field: 'text' as const, operator: 'equals' as const, value: 'menu' }],
          actions: [{
            type: 'reply_text' as const,
            text: '📋 *MENU LAYANAN WHATSAPP*\n\nHalo {{name}}, silakan balas dengan kata kunci berikut:\n1️⃣ *HARGA* - Info paket harga & promo spesial\n2️⃣ *JAM KERJA* - Jadwal operasional layanan\n3️⃣ *CS* - Bicara langsung dengan tim support kami'
          }],
          isActive: true
        },
        {
          id: 'rule-harga',
          name: 'Informasi Harga & Hot Lead Auto-Funnel',
          conditions: [{ field: 'text' as const, operator: 'contains' as const, value: 'harga' }],
          actions: [
            {
              type: 'reply_text' as const,
              text: '🏷️ *DAFTAR HARGA & PENAWARAN SPESIAL*\n\nHalo {{name}}, berikut paket penawaran kami:\n• Paket Starter: Rp 99.000 / bln\n• Paket Pro: Rp 199.000 / bln\n• Paket Bisnis: Rp 399.000 / bln\n\n🎁 {Dapatkan promo diskon spesial minggu ini!|Penawaran terbatas untuk Anda!}\nBalas pesan ini atau hubungi *CS* untuk pemesanan.'
            },
            {
              type: 'add_tag' as const,
              tag: '🔥 Hot Lead'
            },
            {
              type: 'set_stage' as const,
              stage: 'prospect' as const
            }
          ],
          isActive: true
        },
        {
          id: 'rule-bayar',
          name: 'Konfirmasi Bayar / Transfer (Customer Stage)',
          conditions: [{ field: 'text' as const, operator: 'contains' as const, value: 'transfer' }],
          actions: [
            {
              type: 'reply_text' as const,
              text: 'Alhamdulillah, terima kasih banyak kak {{name}} atas konfirmasinya! 🙏\nPembayaran kakak sedang kami verifikasi dan pesanan akan segera kami proses secepatnya.'
            },
            {
              type: 'add_tag' as const,
              tag: '💰 Sudah Membeli'
            },
            {
              type: 'set_stage' as const,
              stage: 'customer' as const
            }
          ],
          isActive: true
        },
        {
          id: 'rule-jam-kerja',
          name: 'Jam Operasional Layanan',
          conditions: [{ field: 'text' as const, operator: 'contains' as const, value: 'jam kerja' }],
          actions: [{
            type: 'reply_text' as const,
            text: '⏰ *JAM OPERASIONAL KAMI*\n\n• Senin - Jumat : 08.30 - 17.00 WIB\n• Sabtu : 09.00 - 15.00 WIB\n• Minggu / Hari Libur : Tutup\n\n{Pesan Anda sudah kami simpan|Terima kasih telah menghubungi kami}. Tim kami akan segera merespons di jam kerja operasional ya!'
          }],
          isActive: true
        }
      ];

      for (const rule of defaultRules) {
        automationRepository.upsert(rule);
      }
      logger.info('Default automation rules seeded successfully.');
    }
  }

  private async handleIncomingMessage(sessionId: string, message: NormalizedMessage): Promise<void> {
    // Avoid replying to self to prevent infinite loops
    if (message.fromMe) return;

    // CRITICAL BUG FIX: never auto-reply to old messages restored from history sync.
    // Previously the bot responded to days-old chats right after connecting, which risks bans.
    if (message.isHistorical) {
      logger.debug({ sessionId, msgId: message.id }, 'Skipping automation for historical (history-sync) message');
      return;
    }

    const isGroup = message.chatJid.endsWith('@g.us');
    const senderPhone = (message.senderJid || message.chatJid).replace(/[^0-9]/g, '');

    // Feature Guard: Group Auto-Reply permission check
    if (isGroup) {
      const isAllowed = groupService.isGroupAutoReplyAllowed(sessionId, message.chatJid);
      if (!isAllowed) {
        logger.debug(
          { sessionId, chatJid: message.chatJid },
          'Auto-reply suppressed in group: bot is not admin in this group and group auto-reply is not enabled'
        );
        return;
      }
    }

    // 1. AMAN CHAT Feature: Auto-Stop Sequencer when customer replies
    if (!isGroup && senderPhone) {
      try {
        crmService.autoStopSequenceForContact(sessionId, senderPhone);
      } catch (err: any) {
        logger.debug({ err: err?.message }, 'Auto-stop sequence check failed');
      }
    }

    const text = (message.text || message.caption || '').trim();
    if (!text) return;

    // Feature Guard 1: Duplicate Incoming Message Suppression in Same Chat
    const duplicateChatKey = `${sessionId}:${message.chatJid}`;
    const normalizedIncomingText = text.toLowerCase();
    const lastAnsweredText = this.lastRepliedTextByChat.get(duplicateChatKey);

    if (lastAnsweredText && lastAnsweredText === normalizedIncomingText) {
      logger.info(
        { sessionId, chatJid: message.chatJid, text },
        'Auto-reply suppressed: Duplicate incoming message text previously answered in this chat'
      );
      return;
    }

    // Sprint 6 Feature #12: Interactive Chatflow Interceptor (Priority over standard auto-reply)
    try {
      const handledByChatFlow = await chatFlowService.handleIncomingMessage(sessionId, message);
      if (handledByChatFlow) {
        return;
      }
    } catch (cfErr: any) {
      logger.error({ sessionId, err: cfErr?.message }, 'Error in chatflow interceptor');
    }

    const config = automationRepository.getAutoReplyConfig(sessionId);
    if (config.autoReplyEnabled === false) {
      logger.debug({ sessionId }, 'Auto-reply is globally disabled for this session');
      return;
    }
    const cooldownKey = `${sessionId}:${senderPhone}`;
    const lastReply = this.contactCooldowns.get(cooldownKey) || 0;
    const now = Date.now();
    const cooldownMins = typeof config.cooldownMinutes === 'number' ? config.cooldownMinutes : 5;
    const cooldownMs = cooldownMins * 60 * 1000;

    // Prune stale contact cooldowns if cache grows large
    if (this.contactCooldowns.size > 2000) {
      const oneDayAgo = now - 24 * 3600 * 1000;
      for (const [key, timestamp] of this.contactCooldowns.entries()) {
        if (timestamp < oneDayAgo) {
          this.contactCooldowns.delete(key);
        }
      }
    }

    // Prune duplicate-suppression cache (bug fix: unbounded growth / memory leak)
    if (this.lastRepliedTextByChat.size > 2000) {
      const keysToDelete = Array.from(this.lastRepliedTextByChat.keys()).slice(0, this.lastRepliedTextByChat.size - 1000);
      for (const key of keysToDelete) {
        this.lastRepliedTextByChat.delete(key);
      }
    }

    // 1. Keyword Rules Matching (Check active rules first; sort 'equals' operator rules first to prevent wrong triggers)
    const rules = automationRepository.findActiveRules(sessionId);
    rules.sort((a, b) => {
      const aEquals = a.conditions.some((c) => c.operator === 'equals');
      const bEquals = b.conditions.some((c) => c.operator === 'equals');
      if (aEquals && !bEquals) return -1;
      if (!aEquals && bEquals) return 1;
      return 0;
    });

    let matched = false;

    for (const rule of rules) {
      if (this.evaluateRule(rule, message, text)) {
        matched = true;
        logger.info({ ruleId: rule.id, ruleName: rule.name, sessionId, from: message.senderJid }, 'Automation rule triggered');
        automationRepository.incrementHit(rule.id);
        eventBus.emit('automation.triggered', {
          ruleId: rule.id,
          ruleName: rule.name,
          sessionId,
          messageId: message.id
        });

        // Check if reply actions need cooldown
        const hasReplyAction = rule.actions.some((a) => a.type === 'reply_text' || a.type === 'send_text' || a.type === 'reply_webhook');
        if (!hasReplyAction || isGroup || (now - lastReply >= cooldownMs)) {
          await this.executeActions(sessionId, message, rule, config.simulateTyping);
          if (hasReplyAction) {
            this.lastRepliedTextByChat.set(duplicateChatKey, normalizedIncomingText);
            if (!isGroup) {
              this.contactCooldowns.set(cooldownKey, now);
            }
          }
        } else {
          logger.info({ ruleId: rule.id, senderPhone }, 'Rule matched but reply suppressed due to contact cooldown');
          // Still execute non-reply actions (like tagging or stage update)
          await this.executeNonReplyActions(sessionId, senderPhone, rule);
        }
        break; // Match first active rule
      }
    }

    // 2. If no keyword rule matched, check Business Hours & Offline Reply
    if (!matched && !isGroup && config.businessHoursEnabled) {
      const isWithinHours = this.checkBusinessHours(config);
      if (!isWithinHours && config.offlineReplyEnabled && config.offlineReplyText) {
        if (now - lastReply >= cooldownMs) {
          logger.info({ sessionId, senderPhone }, 'Sending offline auto-reply outside business hours');
          const sent = await this.sendAutomatedResponse(sessionId, message, config.offlineReplyText, config.simulateTyping);
          if (sent) {
            this.lastRepliedTextByChat.set(duplicateChatKey, normalizedIncomingText);
            this.contactCooldowns.set(cooldownKey, now);
          }
        }
        return;
      }
    }

    // 3. Fallback Reply if no keyword matched and within hours
    if (!matched && !isGroup && config.fallbackEnabled && config.fallbackReplyText) {
      if (now - lastReply >= cooldownMs) {
        logger.info({ sessionId, senderPhone }, 'No keyword matched. Sending fallback auto-reply');
        const sent = await this.sendAutomatedResponse(sessionId, message, config.fallbackReplyText, config.simulateTyping);
        if (sent) {
          this.lastRepliedTextByChat.set(duplicateChatKey, normalizedIncomingText);
          this.contactCooldowns.set(cooldownKey, now);
        }
      }
    }
  }

  private checkBusinessHours(config: AutoReplyConfig): boolean {
    if (!config.businessHoursEnabled) return true;
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sun, 1=Mon..6=Sat
    if (config.businessDays && config.businessDays.length > 0) {
      // Support both 0 and 7 for Sunday
      const matchesDay = config.businessDays.includes(currentDay) || (currentDay === 0 && config.businessDays.includes(7));
      if (!matchesDay) return false;
    }

    const currentTotalMin = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = (config.businessHoursStart || '08:00').split(':').map(Number);
    const [endH, endM] = (config.businessHoursEnd || '17:00').split(':').map(Number);
    const startTotalMin = (startH || 0) * 60 + (startM || 0);
    const endTotalMin = (endH || 0) * 60 + (endM || 0);

    return currentTotalMin >= startTotalMin && currentTotalMin <= endTotalMin;
  }

  private evaluateRule(rule: AutomationRuleRecord, msg: NormalizedMessage, text: string): boolean {
    const isGroup = msg.chatJid.endsWith('@g.us');
    const hasGroupCondition = rule.conditions.some((c) => c.field === 'is_group');

    // Group Safety Guard: Bot rules only apply to 1-on-1 personal chats unless 'is_group' condition is explicitly set to true
    if (isGroup && !hasGroupCondition) {
      return false;
    }

    for (const cond of rule.conditions) {
      if (cond.field === 'is_group') {
        const expected = cond.value === 'true';
        if (isGroup !== expected) return false;
      } else if (cond.field === 'sender') {
        const cleanSender = msg.senderJid.replace(/[^0-9]/g, '');
        if (!cleanSender.includes(cond.value)) return false;
      } else if (cond.field === 'text') {
        const lowerText = text.toLowerCase();
        const lowerVal = cond.value.toLowerCase();

        switch (cond.operator) {
          case 'equals':
            if (lowerText !== lowerVal) return false;
            break;
          case 'starts_with':
            if (!lowerText.startsWith(lowerVal)) return false;
            break;
          case 'contains':
            if (!lowerText.includes(lowerVal)) return false;
            break;
          case 'regex':
            try {
              const regex = new RegExp(cond.value, 'i');
              if (!regex.test(text)) return false;
            } catch {
              return false;
            }
            break;
          default:
            return false;
        }
      }
    }
    return true;
  }

  private async executeActions(
    sessionId: string,
    msg: NormalizedMessage,
    rule: AutomationRuleRecord,
    simulateTyping = true
  ): Promise<void> {
    let session: any = null;
    try {
      session = sessionManager.getSession(sessionId);
    } catch (err: any) {
      logger.debug({ sessionId, ruleId: rule.id, err: err.message }, 'WhatsApp session not available for sending outgoing messages');
    }

    const isSessionConnected = session && session.getStatus() === 'CONNECTED';
    const cleanPhone = (msg.senderJid || msg.chatJid).replace(/[^0-9]/g, '');

    for (const action of rule.actions) {
      try {
        if ((action.type === 'send_text' || action.type === 'reply_text') && action.text) {
          if (!isSessionConnected) {
            logger.warn({ sessionId, ruleId: rule.id }, 'Skipping outgoing reply: session not connected');
            continue;
          }
          if (simulateTyping && session.sendPresence) {
            try {
              await session.sendPresence(msg.chatJid, 'composing');
              await new Promise((r) => setTimeout(r, 1200));
            } catch {
              // ignore presence update errors
            }
          }
          const processedText = this.interpolate(action.text, msg, sessionId);
          await session.sendText(msg.chatJid, processedText);
        } else if (action.type === 'send_media' && action.mediaPath) {
          if (!isSessionConnected) {
            logger.warn({ sessionId, ruleId: rule.id }, 'Skipping outgoing media: session not connected');
            continue;
          }
          const caption = action.text ? this.interpolate(action.text, msg, sessionId) : undefined;
          await session.sendMedia(msg.chatJid, action.mediaPath, {
            type: action.mediaType || 'document',
            caption
          });
        } else if (action.type === 'add_tag' && action.tag && cleanPhone) {
          // AMAN CHAT Feature: Auto-tagging
          const existing = contactRepository.findByPhone(sessionId, cleanPhone);
          const currentTags = existing?.tags || [];
          if (!currentTags.includes(action.tag)) {
            currentTags.push(action.tag);
            contactRepository.updateTags(sessionId, cleanPhone, currentTags);
            logger.info({ sessionId, cleanPhone, tag: action.tag }, 'Auto-tag added to contact');
          }
        } else if (action.type === 'set_stage' && action.stage && cleanPhone) {
          // AMAN CHAT Feature: Auto-funnel pipeline stage
          contactRepository.updateStage(sessionId, cleanPhone, action.stage);
          logger.info({ sessionId, cleanPhone, stage: action.stage }, 'Contact pipeline stage updated');
        } else if (action.type === 'apply_sequence' && action.sequenceId && cleanPhone) {
          // Sprint 3 Feature #5: Auto-trigger Follow-Up Sequence
          try {
            const resolvedName = this.resolveContactName(sessionId, msg);
            crmService.applySequenceToContact(sessionId, cleanPhone, action.sequenceId, resolvedName);
            logger.info({ sessionId, cleanPhone, sequenceId: action.sequenceId }, 'Auto-triggered sequence for contact');
          } catch (seqErr: any) {
            logger.error({ sessionId, cleanPhone, sequenceId: action.sequenceId, err: seqErr.message }, 'Failed auto-triggering sequence');
          }
        } else if (action.type === 'reply_webhook' && action.webhookUrl) {
          // Sprint 4 Feature #14: Dynamic Webhook Reply
          try {
            await this.executeWebhookReply(sessionId, msg, action, simulateTyping, isSessionConnected, session);
          } catch (whErr: any) {
            logger.error({ ruleId: rule.id, webhookUrl: action.webhookUrl, err: whErr.message }, 'Failed executing webhook reply action');
          }
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        if (errMsg.includes('rate-overlimit')) {
          logger.warn({ ruleId: rule.id, chatJid: msg.chatJid }, 'Auto-reply rate-limited by WhatsApp socket. Temporary pause applied.');
        } else if (errMsg.includes('forbidden')) {
          logger.warn({ ruleId: rule.id, chatJid: msg.chatJid }, 'Auto-reply forbidden by WhatsApp (no permission to speak in group or muted).');
        } else {
          logger.error({ ruleId: rule.id, err: errMsg }, 'Failed executing automation action');
        }
      }
    }
  }

  private async executeNonReplyActions(sessionId: string, phone: string, rule: AutomationRuleRecord): Promise<void> {
    for (const action of rule.actions) {
      if (action.type === 'add_tag' && action.tag) {
        const existing = contactRepository.findByPhone(sessionId, phone);
        const currentTags = existing?.tags || [];
        if (!currentTags.includes(action.tag)) {
          currentTags.push(action.tag);
          contactRepository.updateTags(sessionId, phone, currentTags);
        }
      } else if (action.type === 'set_stage' && action.stage) {
        contactRepository.updateStage(sessionId, phone, action.stage);
      } else if (action.type === 'apply_sequence' && action.sequenceId) {
        try {
          crmService.applySequenceToContact(sessionId, phone, action.sequenceId);
        } catch (seqErr: any) {
          logger.error({ sessionId, phone, sequenceId: action.sequenceId, err: seqErr.message }, 'Failed auto-triggering sequence in non-reply action');
        }
      }
    }
  }

  private async sendAutomatedResponse(
    sessionId: string,
    msg: NormalizedMessage,
    template: string,
    simulateTyping = true
  ): Promise<boolean> {
    try {
      const session = sessionManager.getSession(sessionId);
      if (session.getStatus() !== 'CONNECTED') return false;

      if (simulateTyping && session.sendPresence) {
        try {
          await session.sendPresence(msg.chatJid, 'composing');
          await new Promise((r) => setTimeout(r, 1200));
        } catch {
          // ignore presence error
        }
      }

      const text = this.interpolate(template, msg, sessionId);
      await session.sendText(msg.chatJid, text);
      return true;
    } catch (err: any) {
      logger.error({ sessionId, err: err.message }, 'Failed sending automated response');
      return false;
    }
  }

  private async executeWebhookReply(
    sessionId: string,
    msg: NormalizedMessage,
    action: AutomationAction,
    simulateTyping: boolean,
    isSessionConnected: boolean,
    session: any
  ): Promise<void> {
    if (!action.webhookUrl) return;

    const cleanPhone = (msg.senderJid || msg.chatJid).replace(/[^0-9]/g, '');
    const resolvedName = this.resolveContactName(sessionId, msg);

    const webhookPayload = {
      sessionId,
      sender: cleanPhone,
      chatJid: msg.chatJid,
      messageId: msg.id,
      text: msg.text || msg.caption || '',
      pushName: resolvedName,
      timestamp: msg.timestamp || Date.now()
    };

    const bodyStr = JSON.stringify(webhookPayload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'WhatsApp-Local-Hub-AutoReply/1.0',
      'X-Webhook-Event': 'automation.reply_request'
    };

    if (action.webhookSecret) {
      const hmac = crypto.createHmac('sha256', action.webhookSecret).update(bodyStr).digest('hex');
      headers['X-Hub-Signature-256'] = `sha256=${hmac}`;
    }

    const controller = new AbortController();
    const timeoutMs = action.timeoutMs || 8000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let replyData: any = null;
    try {
      const res = await fetch(action.webhookUrl, {
        method: 'POST',
        headers,
        body: bodyStr,
        signal: controller.signal
      });

      if (!res.ok) {
        logger.warn({ status: res.status, url: action.webhookUrl }, 'Webhook reply endpoint returned non-2xx status');
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        replyData = await res.json();
      } else {
        const textResp = await res.text();
        if (textResp && textResp.trim()) {
          replyData = { reply: textResp.trim() };
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }

    if (!replyData) return;

    const replyText = replyData.reply || replyData.text || replyData.message;
    const mediaUrl = replyData.mediaUrl || replyData.media_url;
    const mediaType = replyData.mediaType || replyData.media_type || 'image';

    if (!isSessionConnected || !session) {
      logger.warn({ sessionId }, 'Cannot send webhook reply: Session not connected');
      return;
    }

    if (simulateTyping && session.sendPresence) {
      try {
        await session.sendPresence(msg.chatJid, 'composing');
        await new Promise((r) => setTimeout(r, 1000));
      } catch {
        // ignore presence update errors
      }
    }

    if (mediaUrl) {
      await session.sendMedia(msg.chatJid, mediaUrl, {
        type: mediaType,
        caption: replyText ? this.interpolate(replyText, msg, sessionId) : undefined
      });
    } else if (replyText) {
      const processedText = this.interpolate(replyText, msg, sessionId);
      await session.sendText(msg.chatJid, processedText);
    }
  }

  private resolveContactName(sessionId: string | undefined, msg: NormalizedMessage): string {
    const cleanPhone = (msg.senderJid || msg.chatJid).replace(/[^0-9]/g, '');
    if (sessionId && cleanPhone) {
      const savedContact = contactRepository.findByPhone(sessionId, cleanPhone);
      if (savedContact?.name) return savedContact.name;
      if (savedContact?.push_name) return savedContact.push_name;
    }
    return msg.pushName || 'Sahabat';
  }

  private interpolate(template: string, msg: NormalizedMessage, sessionId?: string): string {
    const cleanPhone = (msg.senderJid || msg.chatJid).replace(/[^0-9]/g, '');
    const resolvedName = this.resolveContactName(sessionId, msg);

    return renderMessageTemplate(template, {
      name: resolvedName,
      nama: resolvedName,
      sender: cleanPhone,
      phone: cleanPhone,
      nomor: cleanPhone
    });
  }
}

export const automationService = new AutomationService();
