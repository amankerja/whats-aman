import { getDatabase } from './connection';
import { logger } from '../../utils/logger';

export function initializeDatabaseSchema(): void {
  const db = getDatabase();

  logger.info('Initializing SQLite database schema...');

  db.exec(`
    -- Sessions Table
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone_number TEXT,
      status TEXT NOT NULL DEFAULT 'DISCONNECTED',
      qr_code TEXT,
      pairing_code TEXT,
      last_connected_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Contacts Table
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      jid TEXT NOT NULL,
      name TEXT,
      push_name TEXT,
      phone TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      custom_fields TEXT DEFAULT '{}',
      is_business INTEGER DEFAULT 0,
      is_blocked INTEGER DEFAULT 0,
      opt_out INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(session_id, jid)
    );
    CREATE INDEX IF NOT EXISTS idx_contacts_session ON contacts(session_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);

    -- Groups Table
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      jid TEXT NOT NULL,
      name TEXT NOT NULL,
      topic TEXT,
      owner_jid TEXT,
      member_count INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL,
      UNIQUE(session_id, jid)
    );
    CREATE INDEX IF NOT EXISTS idx_groups_session ON groups(session_id);

    -- Group Members Table
    CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      jid TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      UNIQUE(group_id, jid),
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    );

    -- Messages Table
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      chat_jid TEXT NOT NULL,
      sender_jid TEXT NOT NULL,
      from_me INTEGER NOT NULL DEFAULT 0,
      content_text TEXT,
      media_type TEXT,
      media_url TEXT,
      caption TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      timestamp INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(session_id, message_id)
    );
    CREATE INDEX IF NOT EXISTS idx_messages_session_chat ON messages(session_id, chat_jid);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

    -- Campaigns Table
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      name TEXT NOT NULL,
      template_text TEXT NOT NULL,
      media_path TEXT,
      media_type TEXT,
      schedule_at INTEGER,
      rate_limit_per_minute INTEGER DEFAULT 20,
      random_delay_min INTEGER DEFAULT 5,
      random_delay_max INTEGER DEFAULT 15,
      batch_pause_after INTEGER DEFAULT 50,
      batch_pause_seconds INTEGER DEFAULT 60,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      total_recipients INTEGER DEFAULT 0,
      sent_count INTEGER DEFAULT 0,
      delivered_count INTEGER DEFAULT 0,
      read_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

    -- Campaign Recipients Table
    CREATE TABLE IF NOT EXISTS campaign_recipients (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      phone TEXT NOT NULL,
      name TEXT,
      variables TEXT DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'QUEUED',
      error_message TEXT,
      sent_at INTEGER,
      delivered_at INTEGER,
      read_at INTEGER,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_camp_recip_status ON campaign_recipients(campaign_id, status);

    -- Automation Rules Table
    CREATE TABLE IF NOT EXISTS automation_rules (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      name TEXT NOT NULL,
      trigger_type TEXT NOT NULL DEFAULT 'message.received',
      conditions TEXT NOT NULL,
      actions TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      hit_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Webhooks Table
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target_url TEXT NOT NULL,
      events TEXT NOT NULL DEFAULT '["message.received"]',
      secret_key TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    -- Audit Logs Table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at DESC);

    -- Settings Table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  logger.info('Database schema initialized successfully.');
}
