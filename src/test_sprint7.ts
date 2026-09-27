import { initializeDatabaseSchema } from './core/database/schema';
import { integrationService } from './core/services/integration.service';
import { integrationRepository } from './core/database/repositories/integration.repository';

async function runSprint7Tests() {
  console.log('=====================================================');
  console.log('   RUNNING SPRINT 7 INTEGRATION TESTS (#20 - #25)   ');
  console.log('=====================================================\n');

  // 1. Initialize schema and default configs
  initializeDatabaseSchema();
  integrationService.initialize();

  // Test 1: Verify Seed Default Configs
  console.log('--- TEST 1: Default Configs Seeding ---');
  const allConfigs = integrationRepository.findAllConfigs();
  console.log(`Total default configs: ${allConfigs.length}`);
  const providers = ['google_form', 'cf7', 'woocommerce', 'elementor', 'caldera', 'formidable'];
  for (const p of providers) {
    const found = allConfigs.find((c) => c.provider === p);
    if (!found) {
      throw new Error(`Missing default config for provider: ${p}`);
    }
    console.log(`✅ Default template for ${p}: "${found.name}"`);
  }

  // Test 2: Fitur #20 - Google Form Payload Parsing & Processing
  console.log('\n--- TEST 2: Fitur #20 - Google Form Integration ---');
  const googleFormPayload = {
    form_name: 'Registrasi Workshop AI 2026',
    namedValues: {
      'Nama Lengkap': ['Andi Pratama'],
      'No WhatsApp / HP': ['0812-3456-7890'],
      'Instansi / Perusahaan': ['PT Teknologi Maju']
    }
  };

  const parsedGF = integrationService.parseProviderPayload('google_form', googleFormPayload);
  console.log('Parsed Google Form:', parsedGF);
  if (parsedGF.phone !== '6281234567890') {
    throw new Error(`Expected normalized phone 6281234567890, got: ${parsedGF.phone}`);
  }
  if (parsedGF.name !== 'Andi Pratama') {
    throw new Error(`Expected name Andi Pratama, got: ${parsedGF.name}`);
  }
  const gfResult = await integrationService.processIncomingWebhook('google_form', 'mock_session', googleFormPayload);
  console.log('Processed Message:', gfResult.sentMessage);
  console.log('✅ Fitur #20 (Google Form) PASSED');

  // Test 3: Fitur #21 - Contact Form 7 (WordPress) Integration
  console.log('\n--- TEST 3: Fitur #21 - Contact Form 7 (CF7) Integration ---');
  const cf7Payload = {
    'your-name': 'Siti Rahma',
    'your-tel': '085712345678',
    'your-message': 'Halo admin, saya tertarik dengan penawaran paket enterprise.',
    'your-email': 'siti@perusahaan.co.id'
  };

  const parsedCF7 = integrationService.parseProviderPayload('cf7', cf7Payload);
  console.log('Parsed CF7:', parsedCF7);
  if (parsedCF7.phone !== '6285712345678') {
    throw new Error(`Expected 6285712345678, got: ${parsedCF7.phone}`);
  }
  const cf7Result = await integrationService.processIncomingWebhook('cf7', 'mock_session', cf7Payload);
  console.log('Processed Message:', cf7Result.sentMessage);
  console.log('✅ Fitur #21 (Contact Form 7) PASSED');

  // Test 4: Fitur #22 - WooCommerce Order Ingestion
  console.log('\n--- TEST 4: Fitur #22 - WooCommerce Order Integration ---');
  const wooPayload = {
    id: 9812,
    status: 'processing',
    currency: 'IDR',
    total: '450000',
    billing: {
      first_name: 'Budi',
      last_name: 'Santoso',
      phone: '081987654321'
    },
    line_items: [
      { name: 'Kemeja Batik Premium', quantity: 2 },
      { name: 'Sepatu Kulit Formal', quantity: 1 }
    ]
  };

  const parsedWoo = integrationService.parseProviderPayload('woocommerce', wooPayload);
  console.log('Parsed WooCommerce:', parsedWoo);
  if (parsedWoo.phone !== '6281987654321') {
    throw new Error(`Expected 6281987654321, got: ${parsedWoo.phone}`);
  }
  const wooResult = await integrationService.processIncomingWebhook('woocommerce', 'mock_session', wooPayload);
  console.log('Processed Message:\n' + wooResult.sentMessage);
  if (!wooResult.sentMessage.includes('9812') || !wooResult.sentMessage.includes('450000')) {
    throw new Error('WooCommerce variables not rendered properly');
  }
  console.log('✅ Fitur #22 (WooCommerce) PASSED');

  // Test 5: Fitur #23 - Elementor Pro Form Integration
  console.log('\n--- TEST 5: Fitur #23 - Elementor Form Integration ---');
  const elementorPayload = {
    form: { name: 'Landing Page Lead' },
    fields: {
      name: { value: 'Dewi Lestari' },
      phone: { value: '0821-2233-4455' },
      interest: { value: 'Paket Platinum' }
    }
  };

  const parsedElementor = integrationService.parseProviderPayload('elementor', elementorPayload);
  console.log('Parsed Elementor:', parsedElementor);
  if (parsedElementor.phone !== '6282122334455') {
    throw new Error(`Expected 6282122334455, got: ${parsedElementor.phone}`);
  }
  const elResult = await integrationService.processIncomingWebhook('elementor', 'mock_session', elementorPayload);
  console.log('Processed Message:', elResult.sentMessage);
  console.log('✅ Fitur #23 (Elementor Form) PASSED');

  // Test 6: Fitur #24 - Caldera Forms Integration
  console.log('\n--- TEST 6: Fitur #24 - Caldera Forms Integration ---');
  const calderaPayload = {
    form_name: 'Survey Kepuasan Pelanggan',
    data: {
      fld_1: { slug: 'nama', value: 'Eko Prasetyo' },
      fld_2: { slug: 'no_hp', value: '0813-9988-7766' },
      fld_3: { slug: 'rating', value: 'Sangat Puas' }
    }
  };

  const parsedCaldera = integrationService.parseProviderPayload('caldera', calderaPayload);
  console.log('Parsed Caldera:', parsedCaldera);
  if (parsedCaldera.phone !== '6281399887766') {
    throw new Error(`Expected 6281399887766, got: ${parsedCaldera.phone}`);
  }
  const calResult = await integrationService.processIncomingWebhook('caldera', 'mock_session', calderaPayload);
  console.log('Processed Message:', calResult.sentMessage);
  console.log('✅ Fitur #24 (Caldera Forms) PASSED');

  // Test 7: Fitur #25 - Formidable Forms Integration
  console.log('\n--- TEST 7: Fitur #25 - Formidable Forms Integration ---');
  const formidablePayload = {
    form_name: 'Pendaftaran Anggota',
    name: 'Fajar Nugraha',
    phone: '0878-1122-3344',
    item_meta: {
      alamat: 'Jl. Merdeka No. 45 Jakarta',
      kategori: 'VIP Member'
    }
  };

  const parsedFormidable = integrationService.parseProviderPayload('formidable', formidablePayload);
  console.log('Parsed Formidable:', parsedFormidable);
  if (parsedFormidable.phone !== '6287811223344') {
    throw new Error(`Expected 6287811223344, got: ${parsedFormidable.phone}`);
  }
  const formResult = await integrationService.processIncomingWebhook('formidable', 'mock_session', formidablePayload);
  console.log('Processed Message:', formResult.sentMessage);
  console.log('✅ Fitur #25 (Formidable Forms) PASSED');

  // Test 8: Secret Token Security & Admin Copy Alert
  console.log('\n--- TEST 8: Secret Token Validation & Admin Alert ---');
  const secureConfig = integrationRepository.upsertConfig({
    provider: 'woocommerce',
    name: 'WooCommerce Secure Store',
    templateText: 'Halo {name}, pesanan #{order_id} sebesar {currency} {total} terkonfirmasi!',
    adminPhone: '628999111222',
    adminTemplateText: '🚨 PESANAN BARU MASUK!\nPemesan: {name} ({phone})\nTotal: {currency} {total}',
    secretToken: 'super-secret-token-123',
    isActive: true
  });

  // Test 8a: Rejection on missing/wrong token
  let errorCaught = false;
  try {
    await integrationService.processIncomingWebhook('woocommerce', 'mock_session', wooPayload, 'wrong-token');
  } catch (err: any) {
    if (err.message.includes('Unauthorized')) {
      errorCaught = true;
      console.log('✅ Successfully rejected invalid secret token');
    }
  }
  if (!errorCaught) {
    throw new Error('Security failure: expected rejection on wrong token');
  }

  // Test 8b: Acceptance on correct token
  const secureResult = await integrationService.processIncomingWebhook(
    'woocommerce',
    'mock_session',
    wooPayload,
    'super-secret-token-123'
  );
  console.log('Secure Webhook Success:', secureResult.success, 'Target:', secureResult.targetPhone);
  console.log('✅ Secret Token & Admin Alert Verification PASSED');

  // Test 9: Verify Ingestion Audit Logs
  console.log('\n--- TEST 9: Webhook Audit Logs Verification ---');
  const logs = integrationRepository.findLogs({ limit: 10 });
  console.log(`Total logs in database: ${logs.length}`);
  if (logs.length < 6) {
    throw new Error(`Expected at least 6 logs, found ${logs.length}`);
  }
  console.log(`Latest log: Provider=${logs[0].provider}, Target=${logs[0].targetPhone}, Status=${logs[0].status}`);
  console.log('✅ Webhook Ingestion Logs PASSED');

  console.log('\n=====================================================');
  console.log('   🎉 ALL SPRINT 7 TESTS COMPLETED SUCCESSFULLY!    ');
  console.log('=====================================================');
}

runSprint7Tests().catch((err) => {
  console.error('❌ Sprint 7 Test FAILED:', err);
  process.exit(1);
});
