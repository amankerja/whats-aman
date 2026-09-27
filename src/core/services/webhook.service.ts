import crypto from 'crypto';
import { eventBus } from '../events/event-bus';
import { webhookRepository, WebhookRecord } from '../database/repositories/webhook.repository';
import { logger } from '../../utils/logger';

export class WebhookService {
  private isInitialized = false;

  public initialize(): void {
    if (this.isInitialized) return;

    logger.info('Initializing Outbound Webhook Dispatcher...');

    // Subscribe to core system events
    eventBus.on('message.received', ({ sessionId, message }) => {
      this.dispatch('message.received', message, sessionId);
    });

    eventBus.on('message.sent', ({ sessionId, message }) => {
      this.dispatch('message.sent', message, sessionId);
    });

    eventBus.on('message.ack', ({ sessionId, messageId, chatJid, status }) => {
      this.dispatch('message.ack', { messageId, chatJid, status }, sessionId);
    });

    eventBus.on('session.status', ({ sessionId, status, details }) => {
      this.dispatch('session.status', { status, details }, sessionId);
    });

    eventBus.on('session.connected', ({ sessionId, phone, pushName }) => {
      this.dispatch('session.connected', { phone, pushName }, sessionId);
    });

    eventBus.on('session.disconnected', ({ sessionId, reason }) => {
      this.dispatch('session.disconnected', { reason }, sessionId);
    });

    eventBus.on('campaign.updated', (campaignData) => {
      this.dispatch('campaign.updated', campaignData);
    });

    this.isInitialized = true;
  }

  public async dispatch(event: string, data: any, sessionId?: string): Promise<void> {
    try {
      const activeWebhooks = webhookRepository.findActiveByEvent(event, sessionId);
      if (activeWebhooks.length === 0) return;

      const payload = {
        event,
        sessionId: sessionId || null,
        timestamp: Date.now(),
        data
      };

      const payloadString = JSON.stringify(payload);

      // Dispatch asynchronously to all matching webhooks
      await Promise.allSettled(
        activeWebhooks.map((wh) => this.sendToWebhook(wh, event, payloadString))
      );
    } catch (err: any) {
      logger.error({ event, sessionId, err: err?.message }, 'Failed during webhook dispatch');
    }
  }

  public async sendTestPing(id: string): Promise<{
    success: boolean;
    statusCode?: number;
    responseTimeMs: number;
    error?: string;
  }> {
    const webhook = webhookRepository.findById(id);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const testPayload = JSON.stringify({
      event: 'ping',
      sessionId: webhook.sessionId || 'test',
      timestamp: Date.now(),
      data: {
        message: 'Webhook connection test from WhatsAman',
        url: webhook.targetUrl
      }
    });

    const start = Date.now();
    try {
      const res = await this.sendToWebhook(webhook, 'ping', testPayload);
      const responseTimeMs = Date.now() - start;
      return {
        success: res.ok,
        statusCode: res.status,
        responseTimeMs,
        error: res.ok ? undefined : `HTTP ${res.status}`
      };
    } catch (err: any) {
      return {
        success: false,
        responseTimeMs: Date.now() - start,
        error: err?.message || 'Network request failed'
      };
    }
  }

  private async sendToWebhook(
    webhook: WebhookRecord,
    event: string,
    body: string,
    timeoutMs = 8000
  ): Promise<Response> {
    const deliveryId = `del_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'WhatsApp-Local-Hub-Webhook/1.0',
      'X-Webhook-Event': event,
      'X-Webhook-Delivery': deliveryId,
      'X-Webhook-Timestamp': String(Date.now())
    };

    if (webhook.secretKey) {
      const hmac = crypto.createHmac('sha256', webhook.secretKey).update(body).digest('hex');
      headers['X-Hub-Signature-256'] = `sha256=${hmac}`;
      headers['X-Webhook-Signature'] = hmac;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(webhook.targetUrl, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal
      });

      if (!response.ok) {
        logger.warn(
          { webhookId: webhook.id, url: webhook.targetUrl, status: response.status },
          'Webhook endpoint responded with non-2xx status'
        );
      } else {
        logger.debug(
          { webhookId: webhook.id, event, status: response.status },
          'Webhook successfully delivered'
        );
      }

      return response;
    } catch (err: any) {
      logger.error(
        { webhookId: webhook.id, url: webhook.targetUrl, err: err?.message },
        'Failed to deliver webhook'
      );
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const webhookService = new WebhookService();
