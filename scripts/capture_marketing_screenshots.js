const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'MARKETING_KIT', 'screenshots');
const BASE_URL = 'http://localhost:5173';

const TABS = [
  { id: 'dashboard', name: '01_dashboard_utama.png', title: 'Dashboard Utama & Telemetri' },
  { id: 'sessions', name: '02_sesi_multidevice.png', title: 'Multi-Device Sesi Manager & QR/Pairing' },
  { id: 'chats', name: '03_obrolan_inbox_live.png', title: 'Live Chat & Inbox Terpadu' },
  { id: 'crm', name: '04_crm_sales_pipeline.png', title: 'CRM & Sales Pipeline Kanban' },
  { id: 'campaigns', name: '05_broadcast_massal.png', title: 'Broadcast Massal Anti-Banned' },
  { id: 'contacts', name: '06_manajemen_kontak.png', title: 'Manajemen Kontak & Excel Sync' },
  { id: 'groups', name: '07_group_grabber.png', title: 'Group Grabber Ekspor Anggota' },
  { id: 'automation', name: '08_smart_chatbot_autoreply.png', title: 'Smart Chatbot & Auto-Reply' },
  { id: 'integrations', name: '09_integrasi_webhook_apps_script.png', title: 'Webhooks & Integrasi Form' },
  { id: 'tester', name: '10_message_tester.png', title: 'Message & Media Tester' },
  { id: 'infrastructure', name: '11_infrastruktur_backup.png', title: 'Infrastruktur & Backup Mandiri' },
  { id: 'logs', name: '12_audit_logs.png', title: 'Audit Logs & Telemetri Real-Time' }
];

async function run() {
  console.log('Memulai proses screenshot marketing super cepat...');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1600,1000'
    ],
    defaultViewport: {
      width: 1600,
      height: 1000,
      deviceScaleFactor: 1.5 // 1080p high resolution
    }
  });

  const page = await browser.newPage();
  console.log('Membuka aplikasi di http://localhost:5173...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('nav.sidebar-nav', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));

  // Loop through tabs in Light Mode
  for (const tab of TABS) {
    console.log(`Mengambil [${tab.title}] -> ${tab.name}...`);
    try {
      const btn = await page.$(`button[data-tab="${tab.id}"]`);
      if (btn) {
        await btn.click();
        await new Promise(r => setTimeout(r, 600));
      }
      const outPath = path.join(OUTPUT_DIR, tab.name);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`  ✓ Berhasil: ${tab.name}`);
    } catch (err) {
      console.error(`  ✗ Gagal pada ${tab.name}:`, err.message);
    }
  }

  // Toggle Dark Mode
  console.log('Beralih ke Dark Mode...');
  try {
    const themeBtn = await page.$('button[data-action="toggle-theme"]');
    if (themeBtn) {
      await themeBtn.click();
      await new Promise(r => setTimeout(r, 600));

      // Capture Dark Mode Dashboard
      const dashBtn = await page.$('button[data-tab="dashboard"]');
      if (dashBtn) {
        await dashBtn.click();
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(OUTPUT_DIR, '13_dark_mode_dashboard.png'), fullPage: false });
        console.log('  ✓ Berhasil: 13_dark_mode_dashboard.png');
      }

      // Capture Dark Mode Live Chat
      const chatBtn = await page.$('button[data-tab="chats"]');
      if (chatBtn) {
        await chatBtn.click();
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(OUTPUT_DIR, '14_dark_mode_live_chat.png'), fullPage: false });
        console.log('  ✓ Berhasil: 14_dark_mode_live_chat.png');
      }

      // Toggle back to light mode
      await themeBtn.click();
    }
  } catch (err) {
    console.error('  ✗ Gagal toggle dark mode:', err.message);
  }

  await browser.close();
  console.log('🎉 Selesai! Seluruh screenshot resolusi tinggi telah tersimpan rapi di folder MARKETING_KIT/screenshots/');
}

run().catch(console.error);
