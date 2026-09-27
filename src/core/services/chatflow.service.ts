import { eventBus } from '../events/event-bus';
import { NormalizedMessage } from '../events/event.types';
import { chatFlowRepository, ChatFlowRecord, ChatFlowStep, ChatFlowSessionRecord } from '../database/repositories/chatflow.repository';
import { contactRepository } from '../database/repositories/contact.repository';
import { sessionManager } from '../engine/session.manager';
import { renderMessageTemplate } from '../utils/message-parser.util';
import { logger } from '../../utils/logger';

export class ChatFlowService {
  private isInitialized = false;

  public initialize(): void {
    if (this.isInitialized) return;

    logger.info('Initializing Interactive Chatflow Engine (Fitur #12)...');
    this.seedDefaultFlows();
    this.isInitialized = true;
  }

  public seedDefaultFlows(): void {
    const existing = chatFlowRepository.findAllFlows();
    if (existing.length === 0) {
      logger.info('Seeding default onboarding/registration chatflow...');
      chatFlowRepository.createFlow({
        id: 'flow_registrasi_demo',
        name: 'Form Pendaftaran Layanan',
        description: 'Alur interaktif pendaftaran calon pelanggan bertahap',
        triggerKeyword: 'daftar',
        triggerType: 'contains',
        steps: [
          {
            id: 'step_1_name',
            promptText: '👋 Halo! Selamat datang di formulir pendaftaran layanan kami.\n\nBoleh kami tahu *siapa nama lengkap Anda*?',
            variableName: 'nama',
            validationType: 'any'
          },
          {
            id: 'step_2_email',
            promptText: 'Senang berkenalan dengan Anda, *{nama}*! ✨\n\nSelanjutnya, mohon ketikkan *alamat email aktif* Anda:',
            variableName: 'email',
            validationType: 'email',
            errorMessage: '⚠️ Format email tidak valid. Mohon ketikkan format email yang benar (contoh: nama@domain.com):'
          },
          {
            id: 'step_3_layanan',
            promptText: 'Pilihan layanan apa yang Anda butuhkan saat ini?\n\n1️⃣ WhatsApp Ultra Tool Pro\n2️⃣ Integrasi API & Webhook\n3️⃣ Setup Private VPS\n\n_Ketik angka 1, 2, atau 3:_',
            variableName: 'layanan',
            validationType: 'options',
            options: ['1', '2', '3', 'whatsapp', 'integrasi', 'vps'],
            errorMessage: '⚠️ Pilihan tidak sesuai. Mohon ketik angka pilihan 1, 2, atau 3:'
          },
          {
            id: 'step_4_konfirmasi',
            promptText: '📋 *RINGKASAN DATA PENDAFTARAN*\n\n• Nama: {nama}\n• Email: {email}\n• Pilihan: {layanan}\n\nApakah data di atas sudah benar? Ketik *YA* untuk konfirmasi atau *BATAL* untuk mengulang:',
            variableName: 'konfirmasi',
            validationType: 'options',
            options: ['ya', 'y', 'benar', 'ok', 'yes'],
            errorMessage: 'Mohon ketik *YA* untuk mengonfirmasi atau ketik *BATAL* untuk membatalkan:'
          }
        ],
        isActive: true
      });
    }
  }

  public async handleIncomingMessage(sessionId: string, message: NormalizedMessage): Promise<boolean> {
    if (message.fromMe) return false;

    // Do not run chatflows in WhatsApp Groups
    const isGroup = message.chatJid.endsWith('@g.us');
    if (isGroup) return false;

    const cleanPhone = (message.senderJid || message.chatJid).replace(/[^0-9]/g, '');
    const text = (message.text || message.caption || '').trim();
    if (!text || !cleanPhone) return false;

    const lowerText = text.toLowerCase();

    // 1. Cancellation check
    if (['batal', 'cancel', 'exit', 'stop'].includes(lowerText)) {
      const activeSession = chatFlowRepository.getActiveSession(sessionId, cleanPhone);
      if (activeSession) {
        activeSession.status = 'CANCELLED';
        activeSession.updatedAt = Date.now();
        chatFlowRepository.saveSession(activeSession);
        logger.info({ sessionId, cleanPhone, flowId: activeSession.flowId }, 'Chatflow cancelled by customer');

        await this.sendChatFlowPrompt(
          sessionId,
          message.chatJid,
          '❌ *Alur percakapan telah dibatalkan.* Ketik kata kunci lain jika Anda ingin memulai kembali.'
        );
        return true;
      }
    }

    // 2. Active Session Progress
    const activeSession = chatFlowRepository.getActiveSession(sessionId, cleanPhone);
    if (activeSession) {
      const flow = chatFlowRepository.findFlowById(activeSession.flowId);
      if (!flow || !flow.isActive) {
        activeSession.status = 'CANCELLED';
        chatFlowRepository.saveSession(activeSession);
        return false;
      }

      const currentStep = flow.steps[activeSession.currentStepIndex];
      if (!currentStep) {
        activeSession.status = 'COMPLETED';
        chatFlowRepository.saveSession(activeSession);
        return false;
      }

      // Validate answer
      const isValid = this.validateAnswer(text, currentStep);
      if (!isValid) {
        const errorPrompt = currentStep.errorMessage || '⚠️ Format jawaban belum sesuai. Silakan coba masukkan kembali:';
        await this.sendChatFlowPrompt(sessionId, message.chatJid, errorPrompt);
        return true;
      }

      // Save answer
      activeSession.collectedData[currentStep.variableName] = text;
      const nextIndex = activeSession.currentStepIndex + 1;

      if (nextIndex < flow.steps.length) {
        // Advance to next step
        activeSession.currentStepIndex = nextIndex;
        activeSession.updatedAt = Date.now();
        activeSession.expiresAt = Date.now() + 30 * 60 * 1000; // renew 30 min
        chatFlowRepository.saveSession(activeSession);

        const nextStep = flow.steps[nextIndex];
        const promptWithData = renderMessageTemplate(nextStep.promptText, {
          name: message.pushName || 'Sahabat',
          ...activeSession.collectedData
        });

        await this.sendChatFlowPrompt(sessionId, message.chatJid, promptWithData);
        return true;
      } else {
        // Flow Complete!
        activeSession.status = 'COMPLETED';
        activeSession.updatedAt = Date.now();
        chatFlowRepository.saveSession(activeSession);

        // Update contact data in CRM
        const collectedName = activeSession.collectedData.nama || activeSession.collectedData.name;
        if (collectedName) {
          contactRepository.upsert({
            sessionId,
            jid: message.chatJid,
            phone: cleanPhone,
            name: collectedName,
            pushName: message.pushName
          });
        }

        const existingContact = contactRepository.findByPhone(sessionId, cleanPhone);
        const tags = existingContact?.tags || [];
        const flowTag = `Flow: ${flow.name}`;
        if (!tags.includes(flowTag)) {
          tags.push(flowTag);
          contactRepository.updateTags(sessionId, cleanPhone, tags);
        }

        const finalMsg = renderMessageTemplate(
          '🎉 *Terima kasih {name}! Pendaftaran berhasil disimpan.*\n\nData Anda telah kami teruskan ke tim customer service untuk verifikasi lebih lanjut.',
          {
            name: collectedName || message.pushName || 'Sahabat',
            ...activeSession.collectedData
          }
        );

        await this.sendChatFlowPrompt(sessionId, message.chatJid, finalMsg);

        eventBus.emit('automation.triggered', {
          ruleId: flow.id,
          ruleName: `ChatFlow: ${flow.name}`,
          sessionId,
          messageId: message.id
        });

        logger.info({ sessionId, cleanPhone, flowId: flow.id }, 'Chatflow successfully completed');
        return true;
      }
    }

    // 3. New ChatFlow Trigger Match
    const activeFlows = chatFlowRepository.findActiveFlows(sessionId);
    for (const flow of activeFlows) {
      if (flow.steps.length === 0) continue;

      const kw = flow.triggerKeyword.toLowerCase();
      let matched = false;

      if (flow.triggerType === 'equals') {
        matched = lowerText === kw;
      } else if (flow.triggerType === 'starts_with') {
        matched = lowerText.startsWith(kw);
      } else {
        matched = lowerText.includes(kw);
      }

      if (matched) {
        logger.info({ sessionId, cleanPhone, flowId: flow.id, flowName: flow.name }, 'Triggered new interactive chatflow session');

        const newSession: ChatFlowSessionRecord = {
          id: `cfs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          sessionId,
          flowId: flow.id,
          contactPhone: cleanPhone,
          currentStepIndex: 0,
          collectedData: {},
          status: 'ACTIVE',
          expiresAt: Date.now() + 30 * 60 * 1000,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        chatFlowRepository.saveSession(newSession);

        const firstStep = flow.steps[0];
        const prompt = renderMessageTemplate(firstStep.promptText, {
          name: message.pushName || 'Sahabat'
        });

        await this.sendChatFlowPrompt(sessionId, message.chatJid, prompt);
        return true;
      }
    }

    return false;
  }

  private validateAnswer(answer: string, step: ChatFlowStep): boolean {
    const trimmed = answer.trim();
    if (!trimmed) return false;

    switch (step.validationType) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      case 'phone':
        return /^[0-9+]{8,18}$/.test(trimmed.replace(/\s+/g, ''));
      case 'number':
        return !isNaN(Number(trimmed.replace(/,/g, '.')));
      case 'options':
        if (!step.options || step.options.length === 0) return true;
        return step.options.some((opt) => trimmed.toLowerCase().includes(opt.toLowerCase()));
      case 'any':
      default:
        return true;
    }
  }

  private async sendChatFlowPrompt(sessionId: string, chatJid: string, text: string): Promise<void> {
    try {
      const session = sessionManager.getSession(sessionId);
      if (session && session.getStatus() === 'CONNECTED') {
        if (session.sendPresence) {
          await session.sendPresence(chatJid, 'composing');
          await new Promise((r) => setTimeout(r, 800));
        }
        await session.sendText(chatJid, text);
      } else {
        logger.warn({ sessionId, chatJid }, 'Cannot send chatflow prompt: session not connected');
      }
    } catch (err: any) {
      logger.error({ sessionId, chatJid, err: err?.message }, 'Failed sending chatflow prompt');
    }
  }
}

export const chatFlowService = new ChatFlowService();
