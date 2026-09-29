import { ConnectionStatus, NormalizedMessage } from '../events/event.types';

export interface SendTextOptions {
  quotedMessageId?: string;
  mentions?: string[];
}

export interface SendMediaOptions {
  type: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  caption?: string;
  fileName?: string;
  mimeType?: string;
  quotedMessageId?: string;
}

export interface SendLocationOptions {
  name?: string;
  address?: string;
}

export interface SendContactOptions {
  quotedMessageId?: string;
}

export interface SendPollOptions {
  quotedMessageId?: string;
  selectableCount?: number;
}

export interface ContactInfo {
  jid: string;
  name?: string;
  pushName?: string;
  phone?: string;
}

export interface GroupInfo {
  jid: string;
  name: string;
  topic?: string;
  ownerJid?: string;
  memberCount: number;
  participants: Array<{
    jid: string;
    phone: string;
    name?: string;
    role: 'admin' | 'superadmin' | 'member';
  }>;
}

export interface SessionMetadata {
  id: string;
  name: string;
  phoneNumber?: string;
  status: ConnectionStatus;
  qrCode?: string;
  pairingCode?: string;
  lastConnectedAt?: number;
  createdAt: number;
}

export interface IWhatsAppEngine {
  readonly sessionId: string;
  getStatus(): ConnectionStatus;
  getMetadata(): SessionMetadata;
  
  // Connection lifecycle
  connect(options?: { usePairingCode?: boolean; phoneNumber?: string }): Promise<void>;
  disconnect(): Promise<void>;
  logout(): Promise<void>;

  // Messaging
  sendText(to: string, text: string, options?: SendTextOptions): Promise<NormalizedMessage>;
  sendMedia(to: string, mediaPathOrBuffer: string | Buffer, options: SendMediaOptions): Promise<NormalizedMessage>;
  sendLocation?(to: string, latitude: number, longitude: number, options?: SendLocationOptions): Promise<NormalizedMessage>;
  sendContact?(
    to: string,
    contact: { name: string; phone: string; organization?: string },
    options?: SendContactOptions
  ): Promise<NormalizedMessage>;
  sendPoll?(
    to: string,
    poll: { name: string; values: string[]; selectableCount?: number },
    options?: SendPollOptions
  ): Promise<NormalizedMessage>;
  sendPresence?(to: string, type?: 'composing' | 'recording' | 'paused' | 'available' | 'unavailable'): Promise<void>;

  // Contacts & Groups
  getContacts(): Promise<ContactInfo[]>;
  getGroups(): Promise<GroupInfo[]>;
  getGroupMetadata(groupJid: string): Promise<GroupInfo>;
  resolveLidToPhone?(lid: string): string | undefined;
  getProfilePictureUrl?(jid?: string, forceRefresh?: boolean): Promise<string | null>;
  subscribePresence?(jid: string): Promise<void>;
  sendPresenceUpdate?(presence: 'available' | 'unavailable'): Promise<void>;
}
