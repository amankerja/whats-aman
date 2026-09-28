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
    CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_session_phone ON contacts(session_id, phone);
    CREATE INDEX IF NOT EXISTS idx_contacts_stage ON contacts(session_id, pipeline_stage);
    CREATE INDEX IF NOT EXISTS idx_contacts_optout ON contacts(session_id, opt_out);

    -- Groups Table
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      jid TEXT NOT NULL,
      name TEXT NOT NULL,
      topic TEXT,
      owner_jid TEXT,
      member_count INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      auto_reply_enabled INTEGER DEFAULT 0,
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
      push_name TEXT,
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
    CREATE INDEX IF NOT EXISTS idx_messages_analytics ON messages(session_id, from_me, timestamp);
    CREATE INDEX IF NOT EXISTS idx_messages_chat_ts ON messages(session_id, chat_jid, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_unread_fast ON messages(session_id, from_me, status, chat_jid);

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
      is_recurring INTEGER DEFAULT 0,
      cron_expression TEXT,
      next_run_at INTEGER,
      max_runs INTEGER DEFAULT 0,
      runs_count INTEGER DEFAULT 0,
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
      session_id TEXT,
      name TEXT NOT NULL,
      target_url TEXT NOT NULL,
      events TEXT NOT NULL DEFAULT '["message.received"]',
      secret_key TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT 0
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

    -- Follow-up Tasks Table (AMAN CHAT CRM & Sequencer)
    CREATE TABLE IF NOT EXISTS follow_up_tasks (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      contact_name TEXT,
      title TEXT NOT NULL,
      message_template TEXT NOT NULL,
      due_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      sequence_id TEXT,
      step_number INTEGER DEFAULT 1,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_fu_session_status ON follow_up_tasks(session_id, status);
    CREATE INDEX IF NOT EXISTS idx_fu_contact ON follow_up_tasks(session_id, contact_phone);
    CREATE INDEX IF NOT EXISTS idx_fu_due ON follow_up_tasks(due_at ASC);

    -- Sequences Table (Multi-Step Drip & Auto-Funnel)
    CREATE TABLE IF NOT EXISTS sequences (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      steps TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_seq_session ON sequences(session_id);

    -- Message Templates Table
    CREATE TABLE IF NOT EXISTS message_templates (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_templates_session ON message_templates(session_id);

    -- Chat Flows Table (Multi-Step Conversational Questionnaires / Forms)
    CREATE TABLE IF NOT EXISTS chat_flows (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      trigger_keyword TEXT NOT NULL,
      trigger_type TEXT DEFAULT 'contains',
      steps TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_chatflows_session ON chat_flows(session_id);

    -- Chat Flow Sessions Table (Tracks contact state through multi-step flows)
    CREATE TABLE IF NOT EXISTS chat_flow_sessions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      flow_id TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      current_step_index INTEGER NOT NULL DEFAULT 0,
      collected_data TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cfs_contact_status ON chat_flow_sessions(session_id, contact_phone, status);

    -- Third-Party Integration Configs Table (Google Form, CF7, WooCommerce, Elementor, Caldera, Formidable)
    CREATE TABLE IF NOT EXISTS integration_configs (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      provider TEXT NOT NULL,
      name TEXT NOT NULL,
      secret_token TEXT,
      template_text TEXT NOT NULL,
      admin_phone TEXT,
      admin_template_text TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integration_configs(provider, session_id);

    -- Third-Party Integration Ingestion Logs Table
    CREATE TABLE IF NOT EXISTS integration_logs (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      session_id TEXT NOT NULL,
      target_phone TEXT NOT NULL,
      status TEXT NOT NULL,
      payload TEXT NOT NULL,
      error_message TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_intlogs_provider ON integration_logs(provider, created_at DESC);

    -- Anti-Blocking & Risk Mitigation Table
    CREATE TABLE IF NOT EXISTS session_anti_blocking_stats (
      session_id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      warmup_day_count INTEGER DEFAULT 1,
      daily_sent_count INTEGER DEFAULT 0,
      daily_failed_count INTEGER DEFAULT 0,
      last_sent_date TEXT NOT NULL,
      risk_score INTEGER DEFAULT 0,
      proxy_url TEXT,
      consecutive_failures INTEGER DEFAULT 0,
      is_circuit_broken INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    -- Anti-Blocking Risk Events Log Table
    CREATE TABLE IF NOT EXISTS risk_events (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      details TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_risk_events_session ON risk_events(session_id, created_at DESC);
  `);

  try {
    db.exec('ALTER TABLE messages ADD COLUMN push_name TEXT;');
  } catch {
    // Column already exists
  }

  try {
    db.exec("ALTER TABLE contacts ADD COLUMN pipeline_stage TEXT DEFAULT 'lead';");
  } catch {
    // Column already exists
  }

  try {
    db.exec("ALTER TABLE contacts ADD COLUMN notes TEXT DEFAULT '';");
  } catch {
    // Column already exists
  }

  try {
    db.exec('ALTER TABLE webhooks ADD COLUMN session_id TEXT;');
  } catch {
    // Column already exists
  }

  try {
    db.exec('ALTER TABLE webhooks ADD COLUMN updated_at INTEGER DEFAULT 0;');
  } catch {
    // Column already exists
  }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_webhooks_session ON webhooks(session_id);');
  } catch {
    // Index already exists
  }

  try {
    db.exec('ALTER TABLE campaigns ADD COLUMN is_recurring INTEGER DEFAULT 0;');
  } catch {
    // Column already exists
  }

  try {
    db.exec('ALTER TABLE campaigns ADD COLUMN cron_expression TEXT;');
  } catch {
    // Column already exists
  }

  try {
    db.exec('ALTER TABLE campaigns ADD COLUMN next_run_at INTEGER;');
  } catch {
    // Column already exists
  }

  try {
    db.exec('ALTER TABLE campaigns ADD COLUMN max_runs INTEGER DEFAULT 0;');
  } catch {
    // Column already exists
  }

  try {
    db.exec('ALTER TABLE campaigns ADD COLUMN runs_count INTEGER DEFAULT 0;');
  } catch {
    // Column already exists
  }

  try {
    db.exec('ALTER TABLE groups ADD COLUMN is_admin INTEGER DEFAULT 0;');
  } catch {
    // Column already exists
  }

  try {
    db.exec('ALTER TABLE groups ADD COLUMN auto_reply_enabled INTEGER DEFAULT 0;');
  } catch {
    // Column already exists
  }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_messages_chat_ts ON messages(session_id, chat_jid, timestamp DESC);');
  } catch {
    // Index already exists
  }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_messages_unread_fast ON messages(session_id, from_me, status, chat_jid);');
  } catch {
    // Index already exists
  }

  logger.info('Database schema initialized successfully with CRM, Sequencer, Webhooks & Recurring extensions.');
}
