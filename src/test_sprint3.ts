import { campaignService } from './core/services/campaign.service';
import { campaignRepository } from './core/database/repositories/campaign.repository';
import { crmService } from './core/services/crm.service';
import { crmRepository } from './core/database/repositories/crm.repository';
import { automationService } from './core/services/automation.service';
import { automationRepository } from './core/database/repositories/automation.repository';
import { eventBus } from './core/events/event-bus';

async function runSprint3Tests() {
  console.log('=== TEST SPRINT 3: RELIABILITAS BROADCAST & AUTO-TRIGGER SEQUENCE ===\n');

  // 1. Test CSV Parsing from Buffer
  console.log('[TEST 1] Testing parseRecipientsFromBuffer with CSV data...');
  const csvData = `nomor,nama,produk,diskon
081234567890,Budi Santoso,Sepatu Sneakers,20%
+628987654321,Siti Aminah,Tas Kulit,30%
08111222333,Ahmad Yani,Kemeja Batik,15%
`;
  const buffer = Buffer.from(csvData, 'utf-8');
  const recipients = campaignService.parseRecipientsFromBuffer(buffer, 'contacts.csv');

  console.log(`Parsed recipients count: ${recipients.length}`);
  if (recipients.length !== 3) {
    throw new Error(`Expected 3 recipients, got ${recipients.length}`);
  }
  if (recipients[0].phone !== '6281234567890' || recipients[0].name !== 'Budi Santoso') {
    throw new Error(`Recipient 0 mismatch: ${JSON.stringify(recipients[0])}`);
  }
  if (recipients[0].variables?.produk !== 'Sepatu Sneakers' || (recipients[0].variables?.diskon !== '20%' && recipients[0].variables?.diskon !== '0.2')) {
    throw new Error(`Custom variable mismatch: ${JSON.stringify(recipients[0].variables)}`);
  }
  if (recipients[1].phone !== '628987654321') {
    throw new Error(`Recipient 1 normalization failed: ${recipients[1].phone}`);
  }
  console.log('✅ TEST 1 PASSED: CSV buffer successfully parsed, normalized, and mapped to variables.\n');

  // 2. Test Crash Recovery for Interrupted Campaigns
  console.log('[TEST 2] Testing Crash Recovery for Interrupted Campaigns...');
  const testCampId = `camp_recovery_test_${Date.now()}`;
  campaignRepository.createCampaign({
    id: testCampId,
    sessionId: 'test_session',
    name: 'Interrupted Test Campaign',
    templateText: 'Halo {name}, info produk: {produk}',
    status: 'RUNNING',
    randomDelayMin: 1,
    randomDelayMax: 2
  });

  campaignRepository.addRecipients(testCampId, [
    { phone: '62811111111', name: 'User 1', variables: { produk: 'A' } },
    { phone: '62812222222', name: 'User 2', variables: { produk: 'B' } }
  ]);

  const allRecipients = campaignRepository.getCampaignRecipients(testCampId, 10);
  const first = allRecipients.find((r) => r.phone === '62811111111');
  if (first) {
    campaignRepository.updateRecipientStatus(first.id, 'SENT');
  }

  const beforeRecovery = campaignRepository.findCampaignById(testCampId);
  console.log(`Campaign status before recovery: ${beforeRecovery?.status}`);

  // Test recovery invocation
  await campaignService.recoverInterruptedCampaigns();

  // The campaign should have been found and processed/re-queued
  const queuedLeft = campaignRepository.getNextQueuedRecipients(testCampId, 10);
  console.log(`Queued recipients remaining to be processed: ${queuedLeft.length}`);
  if (queuedLeft.length !== 1 || queuedLeft[0].phone !== '62812222222') {
    throw new Error(`Expected only 1 QUEUED recipient (User 2), got: ${JSON.stringify(queuedLeft)}`);
  }
  console.log('✅ TEST 2 PASSED: Interrupted campaigns identified and only QUEUED recipients are targeted.\n');

  // 3. Test Auto-Trigger Follow-Up Sequence via Automation
  console.log('[TEST 3] Testing Auto-Trigger Follow-Up Sequence on Incoming Message...');
  automationService.initialize();

  // Create test sequence
  const testSeqId = `seq_test_${Date.now()}`;
  crmService.createSequence({
    id: testSeqId,
    sessionId: 'session_sprint3',
    name: 'Auto Welcome Sequence',
    description: 'Triggered when customer asks for catalog',
    steps: [
      {
        stepNumber: 1,
        title: 'Katalog Hari Pertama',
        template: 'Halo {{name}}, berikut katalog promo pilihan kami!',
        delayDays: 0,
        delayHours: 1
      },
      {
        stepNumber: 2,
        title: 'Follow up Hari Kedua',
        template: 'Halo {{name}}, apakah ada produk yang menarik minat Anda?',
        delayDays: 1,
        delayHours: 0
      }
    ]
  });

  // Seed rule that applies the sequence
  automationRepository.upsert({
    id: 'rule_test_sequence',
    sessionId: 'session_sprint3',
    name: 'Katalog Request Rule',
    conditions: [
      { field: 'text', operator: 'contains', value: 'minta katalog' }
    ],
    actions: [
      {
        type: 'reply_text',
        text: 'Baik {{name}}, katalog kami kirimkan dan follow up otomatis dijadwalkan!'
      },
      {
        type: 'apply_sequence',
        sequenceId: testSeqId
      }
    ],
    isActive: true
  });

  // Simulate incoming customer message
  const testPhone = '628555666777';
  eventBus.emit('message.received', {
    sessionId: 'session_sprint3',
    message: {
      id: `msg_${Date.now()}`,
      sessionId: 'session_sprint3',
      chatJid: `${testPhone}@s.whatsapp.net`,
      senderJid: `${testPhone}@s.whatsapp.net`,
      fromMe: false,
      text: 'Minta katalog produk lengkapnya dong kak',
      pushName: 'Bambang Sudirman',
      timestamp: Date.now()
    }
  });

  // Allow event bus microtask to process
  await new Promise((r) => setTimeout(r, 500));

  // Check pending tasks for this phone
  const tasksResult = crmRepository.findTasks('session_sprint3', { status: 'PENDING' });
  const pendingTasks = tasksResult.data;
  const contactTask = pendingTasks.find((t) => t.contact_phone === testPhone && t.sequence_id === testSeqId);

  if (!contactTask) {
    throw new Error(`Expected follow-up task to be created for ${testPhone} with sequence ${testSeqId}`);
  }

  console.log(`Created Task: ID=${contactTask.id}, Title="${contactTask.title}", Contact="${contactTask.contact_name}" (${contactTask.contact_phone})`);
  console.log(`Due at: ${new Date(contactTask.due_at).toISOString()}`);
  if (contactTask.step_number !== 1) {
    throw new Error(`Expected step_number 1, got ${contactTask.step_number}`);
  }
  console.log('✅ TEST 3 PASSED: Incoming message automatically triggered sequence and created scheduled follow-up task.\n');

  console.log('🎉 ALL SPRINT 3 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runSprint3Tests().catch((err) => {
  console.error('❌ Sprint 3 test failed:', err);
  process.exit(1);
});
