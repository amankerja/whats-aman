// Shared UI types extracted from App.tsx (refactor stage 1)

export interface IntegrationConfig {
  id: string;
  sessionId?: string;
  provider: 'google_form' | 'cf7' | 'woocommerce' | 'elementor' | 'caldera' | 'formidable' | 'custom';
  name: string;
  secretToken?: string;
  templateText: string;
  adminPhone?: string;
  adminTemplateText?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface OutgoingWebhook {
  id: string;
  name: string;
  targetUrl: string;
  events?: string[];
  sessionId?: string;
  secretKey?: string;
  isActive: boolean;
  failureCount: number;
  lastDeliveredAt?: number;
  createdAt: number;
}

export interface IntegrationLog {
  id: string;
  provider: string;
  sessionId: string;
  targetPhone: string;
  status: 'SUCCESS' | 'FAILED';
  payload: any;
  errorMessage?: string;
  createdAt: number;
}

export interface SessionMeta {
  id: string;
  name: string;
  phoneNumber?: string;
  status: 'DISCONNECTED' | 'QR_READY' | 'PAIRING_READY' | 'CONNECTING' | 'CONNECTED';
  qrCode?: string;
  pairingCode?: string;
  lastConnectedAt?: number;
  createdAt?: number;
}

export interface Campaign {
  id: string;
  session_id: string;
  name: string;
  template_text: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  last_message?: string;
  created_at: number;
}

export interface Contact {
  id: string;
  phone: string;
  name?: string;
  push_name?: string;
  tags: string[];
  pipeline_stage?: 'lead' | 'prospect' | 'customer' | 'churned' | 'none';
  notes?: string;
  opt_out: boolean;
  jid?: string;
}

export interface FollowUpTask {
  id: string;
  session_id: string;
  contact_phone: string;
  contact_name?: string;
  title: string;
  message_template: string;
  due_at: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  sequence_id?: string;
  step_number: number;
  notes?: string;
  created_at: number;
}

export interface Sequence {
  id: string;
  session_id: string;
  name: string;
  description?: string;
  steps: Array<{ stepNumber: number; delayDays: number; delayHours?: number; title: string; template: string }>;
}

export interface SalesAnalytics {
  timeRange: string;
  totalLeads: number;
  newLeads: number;
  hotLeads: number;
  convertedCustomers: number;
  conversionRate: number;
  followUpDue: number;
  followUpCompleted: number;
  totalSent: number;
  totalRecv: number;
  replyRate: number;
  inboundChats: number;
  repliedChats: number;
  stageCounts: { lead: number; prospect: number; customer: number; churned: number };
}

export interface AutoReplyConfig {
  autoReplyEnabled: boolean;
  businessHoursEnabled: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  businessDays: number[];
  offlineReplyEnabled: boolean;
  offlineReplyText: string;
  cooldownMinutes: number;
  fallbackEnabled: boolean;
  fallbackReplyText: string;
  simulateTyping: boolean;
}

export interface Group {
  jid: string;
  name: string;
  topic?: string;
  memberCount: number;
}

export interface AutoRule {
  id: string;
  name: string;
  conditions: Array<{ field: string; operator: string; value: string }>;
  actions: Array<{ type: string; text?: string; tag?: string; stage?: string }>;
  is_active: boolean;
  hit_count: number;
}

export interface AuditLog {
  id: string;
  event_type: string;
  payload: any;
  created_at: number;
}

export interface ChatItem {
  chat_jid: string;
  last_message: string;
  last_from_me?: number;
  last_status?: string;
  timestamp: number;
  name?: string;
  push_name?: string;
  unread_count?: number;
  resolved_phone?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  message_id: string;
  chat_jid: string;
  sender_jid: string;
  from_me: number;
  content_text?: string;
  media_type?: string;
  media_url?: string;
  caption?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  timestamp: number;
}

export interface SystemStatus {
  appName: string;
  version: string;
  uptimeSeconds: number;
  isPortable: boolean;
  storageDir: string;
  memory: {
    rssMb: number;
    heapUsedMb: number;
    totalSystemMemMb: number;
    freeSystemMemMb: number;
  };
  sessions: {
    total: number;
    connected: number;
  };
}

export interface PrivacySettings {
  blurPics: boolean;
  blurRecentChats: boolean;
  blurChatNames: boolean;
  blurChatMessages: boolean;
}
