import { eventBus } from '../events/event-bus';
import { NormalizedMessage } from '../events/event.types';
import { automationRepository, AutomationRuleRecord } from '../database/repositories/automation.repository';
import { sessionManager } from '../engine/session.manager';
import { logger } from '../../utils/logger';

export class AutomationService {
  private isInitialized = false;

  public initialize(): void {
    if (this.isInitialized) return;

    logger.info('Initializing Automation Engine listener...');
    eventBus.on('message.received', async ({ sessionId, message }) => {
      await this.handleIncomingMessage(sessionId, message);
    });

    this.isInitialized = true;
  }

  private async handleIncomingMessage(sessionId: string, message: NormalizedMessage): Promise<void> {
    // Avoid replying to self to prevent infinite loops
    if (message.fromMe) return;

    const text = (message.text || message.caption || '').trim();
    if (!text) return;

    const rules = automationRepository.findActiveRules(sessionId);

    for (const rule of rules) {
      if (this.evaluateRule(rule, message, text)) {
        logger.info({ ruleId: rule.id, ruleName: rule.name, sessionId, from: message.senderJid }, 'Automation rule triggered');
        automationRepository.incrementHit(rule.id);
        eventBus.emit('automation.triggered', {
          ruleId: rule.id,
          ruleName: rule.name,
          sessionId,
          messageId: message.id
        });

        await this.executeActions(sessionId, message, rule);
        break; // Match first active rule
      }
    }
  }

  private evaluateRule(rule: AutomationRuleRecord, msg: NormalizedMessage, text: string): boolean {
    const isGroup = msg.chatJid.endsWith('@g.us');

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

  private async executeActions(sessionId: string, msg: NormalizedMessage, rule: AutomationRuleRecord): Promise<void> {
    const session = sessionManager.getSession(sessionId);

    for (const action of rule.actions) {
      try {
        if (action.type === 'send_text' && action.text) {
          const processedText = this.interpolate(action.text, msg);
          await session.sendText(msg.chatJid, processedText, {
            quotedMessageId: msg.id
          });
        } else if (action.type === 'send_media' && action.mediaPath) {
          const caption = action.text ? this.interpolate(action.text, msg) : undefined;
          await session.sendMedia(msg.chatJid, action.mediaPath, {
            type: action.mediaType || 'document',
            caption,
            quotedMessageId: msg.id
          });
        }
      } catch (err: any) {
        logger.error({ ruleId: rule.id, err: err.message }, 'Failed executing automation action');
      }
    }
  }

  private interpolate(template: string, msg: NormalizedMessage): string {
    // 1. Spintax: {Halo|Hai|Selamat Siang}
    let res = template.replace(/\{([^{}]+)\}/g, (_, choices) => {
      const parts = choices.split('|');
      return parts[Math.floor(Math.random() * parts.length)].trim();
    });

    // 2. Variables
    res = res.replace(/\{\{name\}\}/gi, msg.pushName || 'Sahabat');
    res = res.replace(/\{\{sender\}\}/gi, msg.senderJid.split('@')[0]);

    return res;
  }
}

export const automationService = new AutomationService();
