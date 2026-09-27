import { initializeDatabaseSchema } from './core/database/schema';
import { campaignRepository } from './core/database/repositories/campaign.repository';
import { campaignService } from './core/services/campaign.service';
import { messageService } from './core/services/message.service';
import { messageRepository } from './core/database/repositories/message.repository';
import { sessionManager } from './core/engine/session.manager';

async function runSprint5Tests() {
  console.log('=== TEST SPRINT 5: RECURRING SCHEDULE & ADVANCED MESSAGE TYPES (vCARD & POLL) ===\n');

  // Initialize DB schema & services
  initializeDatabaseSchema();
  messageService.initialize();

  // ==========================================
  // 1. Test Fitur #18: Recurring Broadcast
  // ==========================================
  console.log('[TEST 1] Testing Recurring Campaign Scheduling & Next Run Calculation...');

  const now = Date.now();
  const nextDaily = campaignService.calculateNextCronRun('0 9 * * *', new Date(now));
  const nextHourly = campaignService.calculateNextCronRun('hourly', new Date(now));
  const nextWeekly = campaignService.calculateNextCronRun('weekly', new Date(now));

  console.log(`Now: ${new Date(now).toISOString()}`);
  console.log(`Next Daily (09:00): ${new Date(nextDaily).toISOString()}`);
  console.log(`Next Hourly: ${new Date(nextHourly).toISOString()}`);
  console.log(`Next Weekly: ${new Date(nextWeekly).toISOString()}`);

  if (nextDaily <= now || nextHourly <= now || nextWeekly <= now) {
    throw new Error('Calculated next cron times must be in the future');
  }

  // Create Recurring Campaign in repository
  const testRecCampId = `camp_rec_${Date.now()}`;
  campaignRepository.createCampaign({
    id: testRecCampId,
    sessionId: 'session_sprint5',
    name: 'Pengingat Pembayaran Bulanan',
    templateText: 'Halo {name}, mohon lakukan pembayaran iuran bulanan Anda.',
    isRecurring: true,
    cronExpression: '0 9 1 * *',
    maxRuns: 3
  });

  campaignRepository.addRecipients(testRecCampId, [
    { phone: '62811111111', name: 'Pelanggan A' },
    { phone: '62822222222', name: 'Pelanggan B' }
  ]);

  const savedCamp = campaignRepository.findCampaignById(testRecCampId);
  if (!savedCamp) throw new Error('Failed to find created recurring campaign');

  if (Number(savedCamp.is_recurring) !== 1) {
    throw new Error(`Expected is_recurring = 1, got ${savedCamp.is_recurring}`);
  }
  if (savedCamp.cron_expression !== '0 9 1 * *') {
    throw new Error(`Expected cron_expression = '0 9 1 * *', got ${savedCamp.cron_expression}`);
  }

  // Simulate completion of first run and rescheduling
  console.log('Simulating run cycle completion and auto-reschedule...');
  // Mark recipients as SENT
  const recipients = campaignRepository.getCampaignRecipients(testRecCampId, 10);
  for (const r of recipients) {
    campaignRepository.updateRecipientStatus(r.id, 'SENT');
  }

  const nextCycleTime = campaignService.calculateNextCronRun('0 9 1 * *');
  campaignRepository.resetRecipientsForRecurring(testRecCampId, nextCycleTime);

  const rescheduledCamp = campaignRepository.findCampaignById(testRecCampId);
  const resetRecipients = campaignRepository.getNextQueuedRecipients(testRecCampId, 10);

  if (rescheduledCamp?.status !== 'SCHEDULED') {
    throw new Error(`Expected status 'SCHEDULED', got ${rescheduledCamp?.status}`);
  }
  if (rescheduledCamp?.runs_count !== 1) {
    throw new Error(`Expected runs_count = 1, got ${rescheduledCamp?.runs_count}`);
  }
  if (resetRecipients.length !== 2) {
    throw new Error(`Expected all 2 recipients reset to QUEUED, got ${resetRecipients.length}`);
  }

  console.log(`Campaign rescheduled successfully: status=${rescheduledCamp.status}, runs=${rescheduledCamp.runs_count}, next=${new Date(rescheduledCamp.schedule_at!).toISOString()}`);
  console.log('✅ TEST 1 PASSED: Recurring broadcast successfully created, calculated, and rescheduled.\n');

  // ==========================================
  // 2. Test Fitur #17: Send Contact vCard
  // ==========================================
  console.log('[TEST 2] Testing Send Contact vCard (Fitur #17)...');

  let mockContactCaptured: any = null;
  let mockPollCaptured: any = null;

  const mockSession = {
    sessionId: 'session_sprint5',
    getStatus: () => 'CONNECTED',
    getMetadata: () => ({ id: 'session_sprint5', name: 'Sprint 5 Session', status: 'CONNECTED', createdAt: Date.now() }),
    sendContact: async (to: string, contact: any) => {
      mockContactCaptured = { to, contact };
      return {
        id: `msg_contact_${Date.now()}`,
        sessionId: 'session_sprint5',
        chatJid: `${to}@s.whatsapp.net`,
        senderJid: 'session_sprint5@s.whatsapp.net',
        fromMe: true,
        mediaType: 'contact',
        timestamp: Date.now()
      };
    },
    sendPoll: async (to: string, poll: any) => {
      mockPollCaptured = { to, poll };
      return {
        id: `msg_poll_${Date.now()}`,
        sessionId: 'session_sprint5',
        chatJid: `${to}@s.whatsapp.net`,
        senderJid: 'session_sprint5@s.whatsapp.net',
        fromMe: true,
        text: `[POLL] ${poll.name}`,
        timestamp: Date.now()
      };
    }
  };

  (sessionManager as any).sessions = (sessionManager as any).sessions || new Map();
  (sessionManager as any).sessions.set('session_sprint5', mockSession);

  const contactSent = await messageService.sendContact({
    sessionId: 'session_sprint5',
    to: '628123456789',
    contact: {
      name: 'Dr. Tirta Mandira Hudhi',
      phone: '+6281122334455',
      organization: 'Shoes and Care'
    }
  });

  if (!mockContactCaptured) {
    throw new Error('sendContact was not called on engine adapter');
  }
  if (mockContactCaptured.contact.name !== 'Dr. Tirta Mandira Hudhi') {
    throw new Error(`Contact name mismatch: ${mockContactCaptured.contact.name}`);
  }

  // Verify saved in SQLite database
  const savedContactMsg = messageRepository.findByMessageId('session_sprint5', contactSent.id);
  if (!savedContactMsg || savedContactMsg.media_type !== 'contact') {
    throw new Error(`Contact message not persisted properly: ${JSON.stringify(savedContactMsg)}`);
  }

  console.log(`Contact vCard sent and recorded: ID=${contactSent.id}, Contact="${mockContactCaptured.contact.name}" (${mockContactCaptured.contact.phone})`);
  console.log('✅ TEST 2 PASSED: Contact vCard successfully dispatched and recorded.\n');

  // ==========================================
  // 3. Test Fitur #17: Send Poll Message
  // ==========================================
  console.log('[TEST 3] Testing Send Interactive Poll (Fitur #17)...');

  const pollSent = await messageService.sendPoll({
    sessionId: 'session_sprint5',
    to: '628123456789',
    poll: {
      name: 'Kapan jadwal pengiriman pesanan yang Anda inginkan?',
      values: ['Pagi (09:00 - 12:00)', 'Siang (13:00 - 16:00)', 'Sore (17:00 - 20:00)'],
      selectableCount: 1
    }
  });

  if (!mockPollCaptured) {
    throw new Error('sendPoll was not called on engine adapter');
  }
  if (mockPollCaptured.poll.values.length !== 3) {
    throw new Error(`Poll options count mismatch: ${mockPollCaptured.poll.values.length}`);
  }

  const savedPollMsg = messageRepository.findByMessageId('session_sprint5', pollSent.id);
  if (!savedPollMsg) {
    throw new Error(`Poll message not persisted in SQLite: ID=${pollSent.id}`);
  }

  console.log(`Poll message sent and recorded: ID=${pollSent.id}, Question="${mockPollCaptured.poll.name}", Options=${JSON.stringify(mockPollCaptured.poll.values)}`);
  console.log('✅ TEST 3 PASSED: Interactive WhatsApp Poll successfully dispatched and recorded.\n');

  console.log('🎉 ALL SPRINT 5 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runSprint5Tests().catch((err) => {
  console.error('❌ Sprint 5 test failed:', err);
  process.exit(1);
});
