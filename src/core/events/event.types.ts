export interface NormalizedMessage {
  id: string;
  sessionId: string;
  chatJid: string;
  senderJid: string;
  fromMe: boolean;
  pushName?: string;
  text?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact';
  mediaUrl?: string;
  mediaFileName?: string;
  caption?: string;
  quotedMessageId?: string;
  timestamp: number;
  resolvedPhone?: string;
  /** True when the message came from history sync (old message). Automation must NOT auto-reply to these. */
  isHistorical?: boolean;
}

export type ConnectionStatus = 'DISCONNECTED' | 'QR_READY' | 'PAIRING_READY' | 'CONNECTING' | 'CONNECTED';

export interface AppEvents {
  // Session events
  'session.status': { sessionId: string; status: ConnectionStatus; details?: string };
  'session.qr': { sessionId: string; qr: string };
  'session.pairing_code': { sessionId: string; code: string };
  'session.connected': { sessionId: string; phone?: string; pushName?: string };
  'session.disconnected': { sessionId: string; reason?: string };
  'session.history_synced': { sessionId: string; chatsCount?: number; msgsCount?: number };

  // Message events
  'message.received': { sessionId: string; message: NormalizedMessage };
  'message.sent': { sessionId: string; message: NormalizedMessage };
  'message.updated': { sessionId: string; message: NormalizedMessage };
  'message.ack': { sessionId: string; messageId: string; chatJid: string; status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' };

  // Contact & Group events
  'contacts.upsert': { sessionId: string; contacts: Array<{ jid: string; name?: string; phone?: string }> };
  'groups.upsert': { sessionId: string; groups: Array<{ jid: string; name: string; memberCount: number }> };

  // Campaign events
  'campaign.updated': { campaignId: string; status: string; sent: number; total: number; failed: number; message?: string };

  // Anti-blocking risk events
  'session.risk_alert': { sessionId: string; riskScore: number; reason: string };

  // Automation events
  'automation.triggered': { ruleId: string; ruleName: string; sessionId: string; messageId: string };
}
