# WhatsAman — Technical Architecture Specification

> **WhatsApp Dashboard by Aman Kerja Studio**  
> *Satu platform terintegrasi dengan Single WhatsApp Engine, SQLite mandiri, REST API terstandarisasi, dan dashboard modern untuk Windows Portable.*

---

## 1. Filosofi & Prinsip Desain

1. **Single Engine, Zero Redundancy**: Tidak menjalankan WAHA, OpenWA, dan Baileys sebagai 3 server terpisah. Sebaliknya, mengambil filosofi arsitektur terbaik dari masing-masing:
   - **Baileys**: Lapisan terbawah sebagai *Transport & WhatsApp Socket Protocol Engine*.
   - **WAHA**: Konsep *Session Management, REST API terstandarisasi, OpenAPI/Swagger Docs, dan Webhook Dispatcher*.
   - **OpenWA**: Konsep *Application Tools (Campaign Engine, Contact & Group Tools, Auto-Responder Rules, Web Dashboard)*.
2. **Decoupled Engine via Interface (`IWhatsAppEngine`)**:
   - Lapisan bisnis **tidak boleh bergantung langsung** pada implementasi Baileys secara mentah.
   - Seluruh interaksi dibungkus dalam abstraksi `IWhatsAppEngine` dan `EventAdapter`.
   - Jika protokol WhatsApp berubah di masa depan, kita hanya perlu memperbarui *Engine Adapter*, tanpa menyentuh database, REST API, atau Campaign Engine.
3. **True Portable & Zero External Dependency**:
   - Tidak memerlukan instalasi Node.js manual, Docker, MySQL, Redis, atau Chrome/Puppeteer oleh pengguna akhir.
   - Database menggunakan **SQLite** file tunggal (`data/database.sqlite`).
   - Sesi tersimpan rapi dan terisolasi per akun di `data/sessions/<session-id>/auth/`.
   - Dapat dijalankan dari Flashdisk / Harddisk eksternal (Mode Portabel) maupun via Installer (Mode Terinstal).

---

## 2. Diagram Alur Sistem

```
┌────────────────────────────────────────────────────────┐
│                   DESKTOP / WEB UI                     │
│           (React + Vite + Tailwind / Flat UI)          │
│    Dashboard • Sessions • Contacts • Campaigns • Logs  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / WebSocket (Localhost:3000)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   APPLICATION CORE                     │
│               (Node.js + TypeScript)                   │
│                                                        │
│  ┌───────────────────┐        ┌─────────────────────┐  │
│  │    REST API v1    │        │  Webhook Dispatcher │  │
│  │  (OpenAPI/Swagger)│        │   (Retry & Events)  │  │
│  └─────────┬─────────┘        └──────────▲──────────┘  │
│            ▼                             │             │
│  ┌───────────────────────────────────────┴──────────┐  │
│  │                   SERVICE LAYER                  │  │
│  │  SessionService    • MessageService              │  │
│  │  ContactService    • CampaignEngine (Queue/Rate) │  │
│  │  AutomationEngine  • BackupService               │  │
│  └─────────┬─────────────────────────────▲──────────┘  │
│            ▼                             │             │
│  ┌───────────────────┐        ┌──────────┴──────────┐  │
│  │  IWhatsAppEngine  │        │   Internal Event    │  │
│  │     (Adapter)     │        │        Bus          │  │
│  └─────────┬─────────┘        └──────────▲──────────┘  │
└────────────┼─────────────────────────────┼─────────────┘
             │ Socket                      │ Events
             ▼                             │
┌───────────────────────────┐              │
│       BAILEYS ENGINE      │──────────────┘
│ Multi-Device • QR • Pair  │ (Connection, Upsert,
│ Messages • Media • Groups │  Receipts, Presence)
└────────────┬──────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
┌───────────┐ ┌───────────┐
│  SQLite   │ │   File    │
│  Storage  │ │  Storage  │
│  (Data &  │ │ (Media,   │
│  Audits)  │ │ Sessions) │
└───────────┘ └───────────┘
```

---

## 3. Struktur Direktori Proyek

```
WhatsAppLocalHub/
├── bin/                        # Portable launcher & Windows scripts
│   ├── WhatsAppLocalHub.bat    # 1-Click launcher
│   └── launcher.exe            # Lightweight native wrapper (opsional)
├── config/                     # Konfigurasi aplikasi & runtime paths
│   └── default.json
├── data/                       # Direktori data lokal (Portable Storage)
│   ├── database.sqlite         # SQLite database utama
│   ├── sessions/               # Isolasi sesi autentikasi Baileys
│   │   ├── marketing/
│   │   │   ├── auth/           # Kredensial multi-device Baileys
│   │   │   └── metadata.json   # Status & info akun
│   │   └── cs/
│   ├── media/                  # File gambar/dokumen masuk & keluar
│   ├── backups/                # Arsip backup (.wahub)
│   └── exports/                # Hasil ekspor Excel/CSV kontak & grup
├── logs/                       # File logging sistem (Winston/Pino)
├── src/
│   ├── core/
│   │   ├── engine/             # Abstraksi Engine & Adapter Baileys
│   │   │   ├── engine.interface.ts
│   │   │   ├── baileys.adapter.ts
│   │   │   └── session.manager.ts
│   │   ├── events/             # Internal Event Bus
│   │   │   ├── event-bus.ts
│   │   │   └── event.types.ts
│   │   ├── database/           # SQLite Database & Repositories
│   │   │   ├── connection.ts
│   │   │   ├── schema.ts
│   │   │   └── repositories/
│   │   │       ├── contact.repository.ts
│   │   │       ├── crm.repository.ts
│   │   │       ├── automation.repository.ts
│   │   │       └── ...
│   │   └── services/           # Service & Business Logic Layer
│   │       ├── session.service.ts
│   │       ├── message.service.ts
│   │       ├── contact.service.ts
│   │       ├── crm.service.ts          # AMAN CHAT Follow-up & Sales Funnel Engine
│   │       ├── group.service.ts
│   │       ├── campaign.service.ts     # Broadcast Engine (Spintax, Rate Control, 1x Retry)
│   │       ├── automation.service.ts   # Smart Bot, Auto-reply, Jam Kerja & Cooldown
│   │       └── backup.service.ts
│   ├── api/                    # REST API Layer (Gaya WAHA & AMAN CHAT)
│   │   ├── server.ts
│   │   ├── middlewares/
│   │   ├── routes/
│   │   │   ├── session.routes.ts
│   │   │   ├── message.routes.ts
│   │   │   ├── contact.routes.ts
│   │   │   ├── crm.routes.ts           # CRM Tasks, Sequences, Funnel Analytics
│   │   │   ├── group.routes.ts
│   │   │   ├── campaign.routes.ts
│   │   │   ├── automation.routes.ts    # Rules & Bot Business Hours Config
│   │   │   └── system.routes.ts
│   │   └── swagger.ts          # OpenAPI documentation
│   └── index.ts                # Application Entry Point
├── ui/                         # Frontend Dashboard (React + Vite + Tailwind)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 4. Skema Database SQLite (Tabel Utama)

1. **`sessions`**: `id`, `name`, `phone_number`, `status` (*DISCONNECTED, QR_READY, CONNECTING, CONNECTED*), `qr_code`, `pairing_code`, `created_at`, `updated_at`.
2. **`contacts`**: `id`, `session_id`, `jid`, `name`, `push_name`, `phone`, `tags` (JSON), `custom_fields` (JSON), `is_business`, `is_blocked`, `opt_out` (BOOLEAN).
3. **`groups`**: `id`, `session_id`, `jid`, `name`, `topic`, `owner_jid`, `member_count`.
4. **`group_members`**: `id`, `group_id`, `jid`, `phone`, `role` (*member/admin/superadmin*).
5. **`messages`**: `id`, `session_id`, `message_id`, `chat_jid`, `sender_jid`, `from_me`, `content_text`, `media_type`, `media_url`, `status` (*PENDING, SENT, DELIVERED, READ, FAILED*), `timestamp`.
6. **`campaigns`**: `id`, `session_id`, `name`, `template_text`, `media_path`, `schedule_at`, `rate_limit_per_minute`, `random_delay_min`, `random_delay_max`, `status` (*DRAFT, SCHEDULED, RUNNING, PAUSED, COMPLETED, CANCELLED*), `total_recipients`, `sent_count`, `failed_count`.
7. **`campaign_recipients`**: `id`, `campaign_id`, `phone`, `name`, `variables` (JSON), `status` (*QUEUED, SENDING, SENT, FAILED*), `error_message`, `sent_at`.
8. **`automation_rules`**: `id`, `session_id`, `name`, `trigger_type` (*message.received*), `conditions` (JSON), `actions` (JSON), `is_active`, `hit_count`.
9. **`webhooks`**: `id`, `name`, `target_url`, `events` (JSON), `secret_key`, `is_active`.
10. **`audit_logs`**: `id`, `event_type`, `payload` (JSON), `created_at`.
11. **`settings`**: `key`, `value` (JSON).

---

## 5. Roadmap 10 Milestone Eksekusi

* **M0 — Architecture & Foundation**: Project boilerplate, TypeScript monorepo/modular layout, Winston logger, Config loader, Base Error Handlers.
* **M1 — Baileys Core**: `IWhatsAppEngine`, Session Manager, QR & Pairing code handler, Auto-reconnect, Multi-device session isolation (`data/sessions/<id>/auth`).
* **M2 — Message Core**: Send/Receive text & media, Baileys Event Adapter, Internal Event Bus, Contact & Group synchronization.
* **M3 — SQLite Storage & Migrations**: Better-SQLite3 engine, schema migrations, repositories, transaction safety, and backup engine (`.wahub`).
* **M4 — REST API & OpenAPI**: Express REST API v1, Swagger UI (`/docs`), API Key middleware, validation, error mapping.
* **M5 — Dashboard UI**: Modern Vite + React + Tailwind dashboard: Session manager with live QR/Pairing code, Chat monitor, Contact table, Groups view.
* **M6 — Automation Engine**: Condition-Action rule evaluator (keyword matches, regex, working hours, auto-reply text/media).
* **M7 — Campaign Engine**: Audience manager, Excel/CSV importer, template variable parser (`{{name}}`), random interval rate limiter, compliance opt-out handling, live campaign monitor.
* **M8 — Webhook & Integration**: Webhook dispatcher with exponential backoff retry, event filtering, n8n/external system compatibility.
* **M9 — Portable Windows Packaging**: Single-click launcher (`WhatsAppLocalHub.bat` / `.exe`), local runtime bundling, portable data isolation.
* **M10 — Hardening & Verification**: Recovery from abrupt shutdown, session corruption self-healing, unit & integration tests, audit log check.
