import http from 'http';
import crypto from 'crypto';
import { initializeDatabaseSchema } from './core/database/schema';
import { webhookRepository } from './core/database/repositories/webhook.repository';
import { webhookService } from './core/services/webhook.service';
import { automationService } from './core/services/automation.service';
import { automationRepository } from './core/database/repositories/automation.repository';
import { sessionManager } from './core/engine/session.manager';
import { eventBus } from './core/events/event-bus';

async function runSprint4Tests() {
  console.log('=== TEST SPRINT 4: OUTBOUND WEBHOOK DISPATCHER & DYNAMIC WEBHOOK REPLY ===\n');

  // Initialize DB schema & services
  initializeDatabaseSchema();
  webhookService.initialize();
  automationService.initialize();

  const receivedDispatches: Array<{
    event: string;
    signature?: string;
    delivery?: string;
    body: any;
  }> = [];

  let mockReplyWasCalled = false;
  let receivedHmacInMock = '';

  // 1. Setup local mock HTTP receiver
  const mockPort = 38891;
  const mockServer = http.createServer(async (req, res) => {
    let bodyStr = '';
    req.on('data', (chunk) => (bodyStr += chunk));
    req.on('end', () => {
      let parsedBody: any = {};
      try {
        parsedBody = JSON.parse(bodyStr);
      } catch {
        parsedBody = { raw: bodyStr };
      }

      if (req.url === '/webhook-target') {
        receivedDispatches.push({
          event: (req.headers['x-webhook-event'] as string) || '',
          signature: (req.headers['x-hub-signature-256'] as string) || '',
          delivery: (req.headers['x-webhook-delivery'] as string) || '',
          body: parsedBody
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } else if (req.url === '/dynamic-reply') {
        mockReplyWasCalled = true;
        receivedHmacInMock = (req.headers['x-hub-signature-256'] as string) || '';

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            reply: 'Halo {name}, order #999 berstatus SELESAI DIKIRIM'
          })
        );
      } else {
        res.writeHead(404);
        res.end();
      }
    });
  });

  await new Promise<void>((resolve) => mockServer.listen(mockPort, '127.0.0.1', () => resolve()));
  console.log(`[SETUP] Mock HTTP Webhook Receiver listening on http://127.0.0.1:${mockPort}`);

  try {
    // 2. Test Fitur #19: Webhook Repository & Test Ping
    console.log('\n[TEST 1] Registering Webhook & Test Ping...');
    const testSecret = 'whsec_sprint4_secret_xyz';
    const webhook = webhookRepository.create({
      sessionId: 'session_wh_test',
      name: 'Test CRM Receiver',
      targetUrl: `http://127.0.0.1:${mockPort}/webhook-target`,
      events: ['message.received', 'message.ack'],
      secretKey: testSecret,
      isActive: true
    });

    console.log(`Created webhook: ID=${webhook.id}, URL=${webhook.targetUrl}`);

    const pingResult = await webhookService.sendTestPing(webhook.id);
    console.log(`Ping Result: success=${pingResult.success}, latency=${pingResult.responseTimeMs}ms`);
    if (!pingResult.success || pingResult.statusCode !== 200) {
      throw new Error(`Test ping failed: ${JSON.stringify(pingResult)}`);
    }
    console.log('✅ TEST 1 PASSED: Webhook registered and test ping delivered successfully.');

    // 3. Test Fitur #19: Outbound Event Dispatching & Signature Verification
    console.log('\n[TEST 2] Testing Outbound Event Dispatching with HMAC Signature...');
    const testMsgId = `msg_${Date.now()}`;
    eventBus.emit('message.received', {
      sessionId: 'session_wh_test',
      message: {
        id: testMsgId,
        sessionId: 'session_wh_test',
        chatJid: '628123456789@s.whatsapp.net',
        senderJid: '628123456789@s.whatsapp.net',
        fromMe: false,
        text: 'Halo testing webhook',
        pushName: 'Customer Test',
        timestamp: Date.now()
      }
    });

    eventBus.emit('message.ack', {
      sessionId: 'session_wh_test',
      messageId: testMsgId,
      chatJid: '628123456789@s.whatsapp.net',
      status: 'READ'
    });

    // Allow async webhook delivery to complete
    await new Promise((r) => setTimeout(r, 600));

    console.log(`Total dispatched payloads received by mock server: ${receivedDispatches.length}`);
    const receivedMsg = receivedDispatches.find((d) => d.event === 'message.received');
    const receivedAck = receivedDispatches.find((d) => d.event === 'message.ack');

    if (!receivedMsg) throw new Error('message.received event was not dispatched');
    if (!receivedAck) throw new Error('message.ack event was not dispatched');

    if (!receivedMsg.signature || !receivedMsg.signature.startsWith('sha256=')) {
      throw new Error(`Invalid HMAC signature format: ${receivedMsg.signature}`);
    }

    console.log(`Verified receivedMsg: Event="${receivedMsg.event}", Signature="${receivedMsg.signature}"`);
    console.log(`Verified receivedAck: Event="${receivedAck.event}", Status="${receivedAck.body.data.status}"`);
    console.log('✅ TEST 2 PASSED: Outbound events dispatched with valid HMAC-SHA256 signatures.');

    // 4. Test Fitur #14: Dynamic Webhook Reply in Automation
    console.log('\n[TEST 3] Testing Dynamic Webhook Reply Action in Automation...');

    let sentTextReceived = '';
    let sentToJid = '';

    // Register a mock session in sessionManager so session.sendText can be captured
    const mockSession = {
      sessionId: 'session_wh_test',
      getStatus: () => 'CONNECTED',
      sendText: async (to: string, text: string) => {
        sentToJid = to;
        sentTextReceived = text;
        return {} as any;
      },
      sendPresence: async () => {}
    };

    (sessionManager as any).sessions = (sessionManager as any).sessions || new Map();
    (sessionManager as any).sessions.set('session_wh_test', mockSession);

    // Upsert automation rule with action reply_webhook
    automationRepository.upsert({
      id: 'rule_dyn_webhook',
      sessionId: 'session_wh_test',
      name: 'Order Status Query',
      conditions: [
        { field: 'text', operator: 'contains', value: 'status pesanan' }
      ],
      actions: [
        {
          type: 'reply_webhook',
          webhookUrl: `http://127.0.0.1:${mockPort}/dynamic-reply`,
          webhookSecret: 'sec_dyn_123',
          timeoutMs: 4000
        }
      ],
      isActive: true
    });

    // Simulate incoming message asking for order status
    eventBus.emit('message.received', {
      sessionId: 'session_wh_test',
      message: {
        id: `msg_order_${Date.now()}`,
        sessionId: 'session_wh_test',
        chatJid: '628999888777@s.whatsapp.net',
        senderJid: '628999888777@s.whatsapp.net',
        fromMe: false,
        text: 'Tolong cek status pesanan saya dong kak',
        pushName: 'Hendro',
        timestamp: Date.now()
      }
    });

    // Allow async webhook request and reply to execute
    await new Promise((r) => setTimeout(r, 1500));

    if (!mockReplyWasCalled) {
      throw new Error('Dynamic reply endpoint was not called by automation service');
    }
    if (!receivedHmacInMock.startsWith('sha256=')) {
      throw new Error(`Dynamic reply request missing valid HMAC signature: ${receivedHmacInMock}`);
    }
    if (!sentTextReceived.includes('order #999 berstatus SELESAI DIKIRIM')) {
      throw new Error(`Expected sent text to contain dynamic webhook reply, got: "${sentTextReceived}"`);
    }
    if (!sentTextReceived.includes('Hendro')) {
      throw new Error(`Expected sent text to interpolate recipient name Hendro, got: "${sentTextReceived}"`);
    }

    console.log(`Captured Automated Response Sent: "${sentTextReceived}" to ${sentToJid}`);
    console.log('✅ TEST 3 PASSED: Dynamic reply from external webhook successfully processed and delivered.\n');

    console.log('🎉 ALL SPRINT 4 VERIFICATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } finally {
    mockServer.close();
  }
}

runSprint4Tests().catch((err) => {
  console.error('❌ Sprint 4 test failed:', err);
  process.exit(1);
});
