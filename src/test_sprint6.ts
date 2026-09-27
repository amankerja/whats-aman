import { initializeDatabaseSchema } from './core/database/schema';
import { chatFlowRepository } from './core/database/repositories/chatflow.repository';
import { chatFlowService } from './core/services/chatflow.service';
import { contactRepository } from './core/database/repositories/contact.repository';
import { sessionManager } from './core/engine/session.manager';
import { NormalizedMessage } from './core/events/event.types';

async function runSprint6Tests() {
  console.log('=== TEST SPRINT 6: INTERACTIVE CHATFLOW & MULTI-STEP CONVERSATION ===\n');

  // Initialize DB schema & services
  initializeDatabaseSchema();
  chatFlowService.initialize();

  // 1. Verify default seeded flow
  console.log('[TEST 1] Checking seeded default registration chatflow...');
  const defaultFlow = chatFlowRepository.findFlowById('flow_registrasi_demo');
  if (!defaultFlow) {
    throw new Error('Expected default flow_registrasi_demo to be seeded');
  }
  console.log(`Found default flow: "${defaultFlow.name}", Trigger="${defaultFlow.triggerKeyword}", Total Steps=${defaultFlow.steps.length}`);
  console.log('✅ TEST 1 PASSED: Default chatflow verified.\n');

  // 2. Setup mock WhatsApp session to record sent messages
  const sentMessages: string[] = [];
  const mockSession = {
    sessionId: 'session_chatflow_test',
    getStatus: () => 'CONNECTED',
    getMetadata: () => ({ id: 'session_chatflow_test', name: 'Chatflow Test Session', status: 'CONNECTED', createdAt: Date.now() }),
    sendText: async (_to: string, text: string) => {
      sentMessages.push(text);
      return { id: `msg_${Date.now()}`, text } as any;
    },
    sendPresence: async () => {}
  };

  (sessionManager as any).sessions = (sessionManager as any).sessions || new Map();
  (sessionManager as any).sessions.set('session_chatflow_test', mockSession);

  // 3. Create Custom Customer Survey Chatflow
  console.log('[TEST 2] Creating Custom Multi-Step Survey Chatflow...');
  const testFlow = chatFlowRepository.createFlow({
    id: `flow_survey_${Date.now()}`,
    sessionId: 'session_chatflow_test',
    name: 'Survei Kepuasan Pelanggan',
    description: 'Kuesioner evaluasi layanan purna jual',
    triggerKeyword: 'isi survei',
    triggerType: 'contains',
    steps: [
      {
        id: 's_nama',
        promptText: 'Hai! Terima kasih ingin berpartisipasi.\nBoleh tahu siapa *nama* Anda?',
        variableName: 'nama',
        validationType: 'any'
      },
      {
        id: 's_rating',
        promptText: 'Halo *{nama}*! Berapa nilai kepuasan Anda terhadap layanan kami (1-5)?',
        variableName: 'rating',
        validationType: 'number',
        errorMessage: '⚠️ Mohon berikan angka kepuasan dari 1 sampai 5:'
      },
      {
        id: 's_saran',
        promptText: 'Terima kasih atas nilainya! Ada saran/masukan untuk perbaikan kami?',
        variableName: 'saran',
        validationType: 'any'
      }
    ],
    isActive: true
  });

  console.log(`Created Flow: ID=${testFlow.id}, Name="${testFlow.name}"`);

  // Helper to simulate incoming customer message
  const testPhone = '628777888999';
  const sendMsg = async (text: string): Promise<boolean> => {
    const msg: NormalizedMessage = {
      id: `in_msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      sessionId: 'session_chatflow_test',
      chatJid: `${testPhone}@s.whatsapp.net`,
      senderJid: `${testPhone}@s.whatsapp.net`,
      fromMe: false,
      text,
      pushName: 'Pelanggan Misterius',
      timestamp: Date.now()
    };
    return chatFlowService.handleIncomingMessage('session_chatflow_test', msg);
  };

  // 4. Test Multi-Turn Conversation Execution
  console.log('\n[TEST 3] Simulating Multi-Turn Conversational Interaction...');

  // Turn 1: Triggering the flow
  console.log('Turn 1: Customer triggers "Halo kak mau isi survei dong"');
  const turn1Handled = await sendMsg('Halo kak mau isi survei dong');
  if (!turn1Handled) throw new Error('Turn 1 was not handled by chatflow');
  console.log(`Bot reply 1: "${sentMessages[sentMessages.length - 1]}"`);

  let session = chatFlowRepository.getActiveSession('session_chatflow_test', testPhone);
  if (!session || session.currentStepIndex !== 0) {
    throw new Error('Expected active session at step 0');
  }

  // Turn 2: Customer answers step 0 (nama)
  console.log('\nTurn 2: Customer answers "Fahri Hidayat"');
  const turn2Handled = await sendMsg('Fahri Hidayat');
  if (!turn2Handled) throw new Error('Turn 2 was not handled');
  console.log(`Bot reply 2: "${sentMessages[sentMessages.length - 1]}"`);

  session = chatFlowRepository.getActiveSession('session_chatflow_test', testPhone);
  if (session?.collectedData.nama !== 'Fahri Hidayat' || session?.currentStepIndex !== 1) {
    throw new Error(`Step 1 data error: ${JSON.stringify(session?.collectedData)}`);
  }
  if (!sentMessages[sentMessages.length - 1].includes('Fahri Hidayat')) {
    throw new Error('Interpolation of {nama} in prompt failed');
  }

  // Turn 3: Customer enters invalid answer for step 1 (expects number, sends string)
  console.log('\nTurn 3: Customer enters invalid input "puas banget" (expected number)');
  await sendMsg('puas banget');
  console.log(`Bot reply 3 (Validation Error): "${sentMessages[sentMessages.length - 1]}"`);

  session = chatFlowRepository.getActiveSession('session_chatflow_test', testPhone);
  if (session?.currentStepIndex !== 1) {
    throw new Error('Step index should remain 1 on validation failure');
  }

  // Turn 4: Customer answers valid rating number "5"
  console.log('\nTurn 4: Customer answers valid number "5"');
  await sendMsg('5');
  console.log(`Bot reply 4: "${sentMessages[sentMessages.length - 1]}"`);

  session = chatFlowRepository.getActiveSession('session_chatflow_test', testPhone);
  if (session?.collectedData.rating !== '5' || session?.currentStepIndex !== 2) {
    throw new Error(`Step 2 data error: ${JSON.stringify(session?.collectedData)}`);
  }

  // Turn 5: Customer answers step 2 (saran) - completes the flow!
  console.log('\nTurn 5: Customer answers "Tolong tambah opsi pengiriman instan"');
  await sendMsg('Tolong tambah opsi pengiriman instan');
  console.log(`Bot reply 5 (Completion): "${sentMessages[sentMessages.length - 1]}"`);

  // Verify session is marked COMPLETED
  const completedSessions = chatFlowRepository.findSessionsByFlow(testFlow.id);
  const userSession = completedSessions.find((s) => s.contactPhone === testPhone);

  if (!userSession || userSession.status !== 'COMPLETED') {
    throw new Error(`Expected session status COMPLETED, got: ${userSession?.status}`);
  }
  console.log('Collected Data in DB:', JSON.stringify(userSession.collectedData, null, 2));

  // Verify contact was updated in CRM
  const contact = contactRepository.findByPhone('session_chatflow_test', testPhone);
  console.log(`Updated Contact in CRM: Name="${contact?.name}", Tags=${JSON.stringify(contact?.tags)}`);
  if (contact?.name !== 'Fahri Hidayat') {
    throw new Error(`Expected contact name 'Fahri Hidayat', got: ${contact?.name}`);
  }

  console.log('✅ TEST 3 PASSED: Full multi-turn conversational questionnaire executed and data persisted to CRM.\n');

  // 5. Test Cancellation Flow
  console.log('[TEST 4] Testing User Cancellation Flow ("BATAL")...');
  const testPhone2 = '628999111222';
  const sendMsg2 = async (text: string) => {
    return chatFlowService.handleIncomingMessage('session_chatflow_test', {
      id: `msg_c_${Date.now()}`,
      sessionId: 'session_chatflow_test',
      chatJid: `${testPhone2}@s.whatsapp.net`,
      senderJid: `${testPhone2}@s.whatsapp.net`,
      fromMe: false,
      text,
      timestamp: Date.now()
    });
  };

  // Start flow
  await sendMsg2('mau isi survei');
  let activeSess2 = chatFlowRepository.getActiveSession('session_chatflow_test', testPhone2);
  if (!activeSess2) throw new Error('Expected active session for phone 2');

  // Cancel flow
  await sendMsg2('batal');
  console.log(`Bot reply on cancel: "${sentMessages[sentMessages.length - 1]}"`);

  activeSess2 = chatFlowRepository.getActiveSession('session_chatflow_test', testPhone2);
  if (activeSess2) {
    throw new Error('Session should not be active after cancellation');
  }

  console.log('✅ TEST 4 PASSED: User cancellation successfully terminates conversational session.\n');

  console.log('🎉 ALL SPRINT 6 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runSprint6Tests().catch((err) => {
  console.error('❌ Sprint 6 test failed:', err);
  process.exit(1);
});
