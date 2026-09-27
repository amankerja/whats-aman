# WhatsAman (WhatsApp Dashboard by Aman Kerja Studio)

> **Platform Terpadu Otomatisasi & Manajemen WhatsApp Multi-Akun**  
> Perpaduan fitur terbaik dari **Baileys (Core Engine)**, **WAHA (REST API & Webhooks)**, dan **OpenWA (Tools & Automation)** yang dikemas menjadi satu aplikasi lokal mandiri, sangat ringan, dan **100% portabel di Windows**.

---

## 🚀 Keunggulan Utama

1. **Satu Mesin Tunggal (Single Core Engine)**:
   * Menggunakan `@whiskeysockets/baileys` murni berbasis WebSocket.
   * **Tanpa Headless Chromium / Puppeteer** — hemat RAM (hanya **~40–70 MB** per sesi, bukan 800 MB+).
   * Mendukung login **Scan QR Code** maupun **8-Digit Pairing Code** (ketik nomor HP tanpa perlu kamera).
2. **REST API & Swagger Docs (Inspirasi WAHA)**:
   * Endpoint REST API terstandarisasi (`/api/v1/sessions`, `/api/v1/messages/text`, `/api/v1/campaigns`, dll).
   * Dokumentasi interaktif Swagger UI langsung di `http://127.0.0.1:3000/docs`.
   * Real-time WebSocket streaming untuk integrasi live UI.
3. **Smart Automation & Tools (Inspirasi OpenWA)**:
   * **Campaign Broadcast Engine**: Pengiriman massal teratur dengan *random delay*, *batch pause*, variasi kata *spintax* (`{Halo|Hai}`), dan variabel nama (`{{name}}`).
   * **Group Grabber**: Ambil seluruh kontak anggota grup WhatsApp hanya dengan 1 klik ke format Excel (.xlsx).
   * **Auto-Responder**: Balas otomatis cerdas berbasis kata kunci (contains, equals, starts_with, regex).
   * **Opt-Out Compliance**: Proteksi otomatis agar nomor yang meminta unsubscribe tidak terkirim pesan lagi.
4. **Sistem Portabel Windows (Zero Setup)**:
   * Database mandiri **SQLite** (`data/database.sqlite`). Tidak butuh install MySQL, Redis, atau Docker.
   * Cukup klik ganda **`WhatsAppLocalHub.bat`**, aplikasi langsung berjalan dan otomatis membuka Dashboard di browser!
   * Folder aplikasi bisa dipindahkan ke Drive D, C, atau USB Flashdisk tanpa kehilangan data.

---

## 📁 Struktur Folder Aplikasi

```
WhatsAppLocalHub/
├── WhatsAppLocalHub.bat    <-- KLIK INI UNTUK MENJALANKAN DI WINDOWS
├── ARCHITECTURE.md         <-- Dokumen Arsitektur Lengkap
├── package.json
├── tsconfig.json
├── config/
│   └── default.json        <-- Pengaturan port dan timeout
├── data/                   <-- Direktori Data Portabel (Ikut pindah jika dicopy)
│   ├── database.sqlite     <-- Database SQLite (Sesi, Kontak, Pesan, Campaign)
│   ├── sessions/           <-- Kredensial Multi-Device WhatsApp per Akun
│   │   └── marketing/auth/
│   ├── media/              <-- Penyimpanan media gambar/dokumen
│   └── backups/            <-- File cadangan database
├── dist/                   <-- Hasil kompilasi backend
├── ui/
│   ├── dist/               <-- Hasil kompilasi Dashboard React + Tailwind
│   └── src/
└── src/                    <-- Source code TypeScript
    ├── core/
    │   ├── engine/         <-- Abstraksi Baileys & Session Manager
    │   ├── database/       <-- SQLite Repositories & Migrasi
    │   ├── events/         <-- Internal Event Bus
    │   └── services/       <-- Message, Campaign, Contact, Group, Auto-Reply
    └── api/                <-- Express REST API, Swagger UI, WebSocket
```

---

## 🖥️ Cara Menjalankan

### Cara 1 — Mode Portabel (Satu Klik):
1. Buka folder aplikasi.
2. Klik ganda file:
   ```cmd
   WhatsAppLocalHub.bat
   ```
3. Jendela konsol akan menyiapkan database dan server, lalu otomatis membuka browser Anda ke:
   ```
   http://127.0.0.1:3000
   ```

### Cara 2 — Mode Developer (Command Line):
```bash
# Menjalankan backend dev mode
npm run dev

# Membangun ulang seluruh kode
npm run build
npm run ui:build

# Menjalankan production server
npm start
```

---

## 📡 REST API & Swagger UI

Ketika server aktif, buka URL berikut di browser untuk mencoba REST API secara interaktif:
* **Interactive Swagger UI**: [http://127.0.0.1:3000/docs](http://127.0.0.1:3000/docs)
* **Status Telemetri**: `GET /api/v1/system/status`
* **Daftar Sesi**: `GET /api/v1/sessions`
* **Kirim Pesan**: `POST /api/v1/messages/text`
* **Export Kontak**: `GET /api/v1/contacts/export?sessionId=...`
* **Group Grabber**: `GET /api/v1/groups/:jid/export?sessionId=...`

---

## 🛡️ Catatan Keamanan & Kompatibilitas Protokol

Aplikasi ini menggunakan `@whiskeysockets/baileys` yang berinteraksi langsung melalui protokol WhatsApp Web.
Seluruh logika bisnis (Campaign, Auto-reply, REST API) telah diisolasi dari Baileys melalui antarmuka `IWhatsAppEngine`. Jika di masa mendatang terdapat pembaruan protokol dari pihak WhatsApp, Anda cukup memperbarui dependensi Baileys tanpa perlu mengubah skema database atau REST API.
