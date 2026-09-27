import { integrationRepository, IntegrationProvider, IntegrationConfigRecord } from '../database/repositories/integration.repository';
import { sessionManager } from '../engine/session.manager';
import { renderMessageTemplate } from '../utils/message-parser.util';
import { eventBus } from '../events/event-bus';
import { logger } from '../../utils/logger';

export class IntegrationService {
  private isInitialized = false;

  public initialize(): void {
    if (this.isInitialized) return;

    logger.info('Initializing Third-Party Webhook Integration Service (Sprint 7)...');
    this.seedDefaultConfigs();
    this.isInitialized = true;
  }

  public seedDefaultConfigs(): void {
    const existing = integrationRepository.findAllConfigs();
    if (existing.length === 0) {
      logger.info('Seeding default third-party integration templates for all 6 providers...');
      const defaultConfigs: Array<{
        provider: IntegrationProvider;
        name: string;
        templateText: string;
      }> = [
        {
          provider: 'google_form',
          name: 'Google Forms Auto-Notification',
          templateText:
            'Halo *{name}*, terima kasih telah mengisi formulir *{form_name}*! ✨\n\nData respon Anda telah berhasil kami terima. Tim kami akan segera meninjau dan menghubungi Anda kembali.'
        },
        {
          provider: 'cf7',
          name: 'Contact Form 7 (WordPress) Auto-Reply',
          templateText:
            'Halo *{name}*, terima kasih telah menghubungi kami via website! 📩\n\nPesan Anda: "_{message}_" telah berhasil diterima oleh customer service kami.'
        },
        {
          provider: 'woocommerce',
          name: 'WooCommerce Order Notification',
          templateText:
            'Halo *{name}*, terima kasih atas pesanan Anda! 🛍️\n\n• *Nomor Pesanan*: #{order_id}\n• *Total Pembayaran*: {currency} {total}\n• *Status*: {status}\n• *Detail Item*: {items_summary}\n\nPesanan Anda sedang kami siapkan ya!'
        },
        {
          provider: 'elementor',
          name: 'Elementor Pro Form Integration',
          templateText:
            'Halo *{name}*, formulir *{form_name}* yang Anda kirimkan telah kami terima dengan sukses. Terima kasih telah menghubungi kami!'
        },
        {
          provider: 'caldera',
          name: 'Caldera Forms Notification',
          templateText:
            'Halo *{name}*, data formulir Caldera Anda berhasil kami terima dan sedang diproses. Terima kasih!'
        },
        {
          provider: 'formidable',
          name: 'Formidable Forms Notification',
          templateText:
            'Halo *{name}*, konfirmasi pengisian formulir Formidable Anda telah berhasil tercatat di sistem kami.'
        }
      ];

      for (const conf of defaultConfigs) {
        integrationRepository.upsertConfig({
          id: `default_${conf.provider}`,
          provider: conf.provider,
          name: conf.name,
          templateText: conf.templateText,
          isActive: true
        });
      }
    }
  }

  public async processIncomingWebhook(
    provider: string,
    sessionId: string,
    rawBody: any,
    secretToken?: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    targetPhone: string;
    sentMessage: string;
    adminMessageId?: string;
  }> {
    const config = integrationRepository.findConfigByProvider(provider, sessionId);

    // Validate secret token if configured in database
    if (config?.secretToken) {
      if (!secretToken || secretToken !== config.secretToken) {
        throw new Error('Unauthorized: Invalid or missing integration secret token');
      }
    }

    // Parse payload according to provider
    const parsed = this.parseProviderPayload(provider, rawBody);
    if (!parsed.phone) {
      throw new Error(`Could not find a valid target phone number in ${provider} payload`);
    }

    const templateText =
      config?.templateText ||
      `Halo {name}, data formulir Anda dari ${provider} telah berhasil kami terima.`;

    const messageToSend = renderMessageTemplate(templateText, {
      name: parsed.name || 'Sahabat',
      phone: parsed.phone,
      ...parsed.variables
    });

    // Send WhatsApp Message via Session Manager
    let sentMsgId: string | undefined;
    try {
      const session = sessionManager.findSession(sessionId);
      if (session && session.getStatus() === 'CONNECTED') {
        const sent = await session.sendText(parsed.phone, messageToSend);
        sentMsgId = sent?.id;
      } else {
        logger.warn({ sessionId, provider, phone: parsed.phone }, 'Session not connected or not found. Webhook logged to database.');
      }

      // If admin copy is enabled
      let adminMsgId: string | undefined;
      if (config?.adminPhone) {
        const adminTemplate =
          config.adminTemplateText ||
          `🚨 *NOTIFIKASI FORMULIR BARU (${provider.toUpperCase()})*\n\nDari: {name} ({phone})\nData:\n{all_data}`;

        const adminMessage = renderMessageTemplate(adminTemplate, {
          name: parsed.name || 'Pelanggan',
          phone: parsed.phone,
          all_data: Object.entries(parsed.variables)
            .map(([k, v]) => `• ${k}: ${v}`)
            .join('\n'),
          ...parsed.variables
        });

        try {
          if (session && session.getStatus() === 'CONNECTED') {
            const adminSent = await session.sendText(config.adminPhone, adminMessage);
            adminMsgId = adminSent?.id;
          }
        } catch (adminErr: any) {
          logger.warn({ adminPhone: config.adminPhone, err: adminErr?.message }, 'Failed sending admin notification copy');
        }
      }

      // Record successful ingestion log
      integrationRepository.logIngestion({
        provider,
        sessionId,
        targetPhone: parsed.phone,
        status: 'SUCCESS',
        payload: rawBody
      });

      eventBus.emit('automation.triggered', {
        ruleId: config?.id || `int_${provider}`,
        ruleName: `Integration: ${config?.name || provider}`,
        sessionId,
        messageId: sentMsgId || `log_${Date.now()}`
      });

      return {
        success: true,
        messageId: sentMsgId,
        targetPhone: parsed.phone,
        sentMessage: messageToSend,
        adminMessageId: adminMsgId
      };
    } catch (err: any) {
      // Record failure log
      integrationRepository.logIngestion({
        provider,
        sessionId,
        targetPhone: parsed.phone,
        status: 'FAILED',
        payload: rawBody,
        errorMessage: err?.message
      });
      throw err;
    }
  }

  public parseProviderPayload(
    provider: string,
    body: any
  ): { phone: string; name?: string; variables: Record<string, string> } {
    const variables: Record<string, string> = {};
    let rawPhone = '';
    let name = '';

    const p = provider.toLowerCase();

    if (p === 'woocommerce') {
      // WooCommerce order webhook format
      const billing = body.billing || {};
      rawPhone = billing.phone || body.phone || '';
      const firstName = billing.first_name || '';
      const lastName = billing.last_name || '';
      name = `${firstName} ${lastName}`.trim() || body.customer_name || '';

      variables.order_id = String(body.id || body.order_id || '');
      variables.total = String(body.total || body.order_total || '0');
      variables.currency = String(body.currency || 'Rp');
      variables.status = String(body.status || 'processing');
      variables.form_name = 'WooCommerce Store';

      // Line items summary
      if (Array.isArray(body.line_items) && body.line_items.length > 0) {
        variables.items_summary = body.line_items
          .map((item: any) => `${item.name || item.product_name} (x${item.quantity || 1})`)
          .join(', ');
      } else {
        variables.items_summary = 'Pesanan Produk';
      }
    } else if (p === 'google_form') {
      // Google Apps Script or form webhook
      variables.form_name = body.form_name || body.formTitle || body.formName || 'Google Form';

      // Check Google Apps Script namedValues e.g. { 'Nama': ['Budi'], 'No HP': ['08123'] }
      if (body.namedValues && typeof body.namedValues === 'object') {
        for (const [key, val] of Object.entries(body.namedValues)) {
          const strVal = Array.isArray(val) ? val.join(', ') : String(val);
          variables[key.toLowerCase().replace(/[^a-z0-9_]/g, '_')] = strVal;

          const lowerK = key.toLowerCase();
          if (lowerK.includes('wa') || lowerK.includes('hp') || lowerK.includes('telp') || lowerK.includes('phone') || lowerK.includes('nomor')) {
            rawPhone = strVal;
          }
          if (lowerK.includes('nama') || lowerK.includes('name')) {
            name = strVal;
          }
        }
      }
    } else if (p === 'cf7' || p === 'contact_form_7') {
      // WordPress Contact Form 7
      variables.form_name = body.form_name || 'Contact Form 7';
      rawPhone = body['your-tel'] || body['your-phone'] || body.telp || body.phone || body['your-mobile'] || '';
      name = body['your-name'] || body.nama || body.name || '';
      variables.message = body['your-message'] || body.pesan || body.message || '';
      variables.email = body['your-email'] || body.email || '';
    } else if (p === 'elementor') {
      // Elementor Pro Forms
      variables.form_name = body.form_name || body.form?.name || 'Elementor Form';
      if (body.fields && typeof body.fields === 'object') {
        for (const [key, val] of Object.entries(body.fields)) {
          const valStr = typeof val === 'object' && val !== null ? (val as any).value : String(val);
          variables[key] = String(valStr);

          const lowerK = key.toLowerCase();
          if (lowerK.includes('phone') || lowerK.includes('tel') || lowerK.includes('wa') || lowerK.includes('nomor')) {
            rawPhone = valStr;
          }
          if (lowerK.includes('name') || lowerK.includes('nama')) {
            name = valStr;
          }
        }
      }
    } else if (p === 'caldera') {
      // Caldera Forms
      variables.form_name = body.form_name || 'Caldera Form';
      if (body.data && typeof body.data === 'object') {
        for (const [k, v] of Object.entries(body.data)) {
          const val = typeof v === 'object' && v !== null ? (v as any).value : String(v);
          const slug = typeof v === 'object' && v !== null && (v as any).slug ? String((v as any).slug) : k;
          variables[k] = String(val);
          variables[slug] = String(val);

          const lower = slug.toLowerCase();
          if (lower.includes('phone') || lower.includes('hp') || lower.includes('tel') || lower.includes('wa') || lower.includes('nomor')) {
            rawPhone = String(val);
          }
          if (lower.includes('name') || lower.includes('nama')) {
            name = String(val);
          }
        }
      }
    } else if (p === 'formidable') {
      // Formidable Forms
      variables.form_name = body.form_name || 'Formidable Form';
      if (body.item_meta && typeof body.item_meta === 'object') {
        for (const [k, v] of Object.entries(body.item_meta)) {
          const valStr = String(v);
          variables[k] = valStr;
          const lowerK = k.toLowerCase();
          if (lowerK.includes('phone') || lowerK.includes('hp') || lowerK.includes('tel') || lowerK.includes('wa') || lowerK.includes('nomor')) {
            rawPhone = valStr;
          }
          if (lowerK.includes('name') || lowerK.includes('nama')) {
            name = valStr;
          }
        }
      }
    }

    // Generic flatten / fallback
    if (typeof body === 'object' && body !== null) {
      for (const [k, v] of Object.entries(body)) {
        if (typeof v === 'string' || typeof v === 'number') {
          variables[k] = String(v);
        }
      }

      if (!rawPhone) {
        rawPhone =
          body.phone ||
          body.no_hp ||
          body.nomor ||
          body.telp ||
          body.mobile ||
          body.whatsapp ||
          body.phoneNumber ||
          body.telephone ||
          '';
      }

      if (!name) {
        name = body.name || body.nama || body.fullName || body.full_name || '';
      }
    }

    // Scan all extracted variables for phone/name if not found yet
    if (!rawPhone || !name) {
      for (const [k, v] of Object.entries(variables)) {
        const lowerK = k.toLowerCase();
        if (!rawPhone && (lowerK.includes('phone') || lowerK.includes('hp') || lowerK.includes('tel') || lowerK.includes('wa') || lowerK.includes('nomor') || lowerK.includes('mobile'))) {
          rawPhone = v;
        }
        if (!name && (lowerK.includes('name') || lowerK.includes('nama'))) {
          name = v;
        }
      }
    }

    // Normalize phone number (standard Indonesia 62 or international)
    let cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }

    if (name) variables.name = name;
    if (cleanPhone) variables.phone = cleanPhone;

    return {
      phone: cleanPhone,
      name: name || undefined,
      variables
    };
  }
}

export const integrationService = new IntegrationService();
