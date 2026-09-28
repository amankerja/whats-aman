import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Smartphone,
  MessageSquare,
  Users,
  Layers,
  Send,
  Zap,
  ClipboardList,
  Server,
  FileText,
  Plus,
  RefreshCw,
  QrCode,
  KeyRound,
  Trash2,
  Play,
  Pause,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  Search,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Paperclip,
  CheckCheck,
  Sun,
  Moon,
  Menu,
  X,
  Eye,
  LogOut,
  Radio,
  FileSpreadsheet,
  ShieldCheck,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Edit3,
  Bot,
  ChevronDown,
  Smile,
  MoreVertical,
  Tag,
  Mic,
  Video,
  Image,
  HardDrive,
  Settings,
  Webhook,
  Code2,
  ExternalLink,
  Share2,
  Globe,
  Languages
} from 'lucide-react';
import { translations, Language } from './i18n';

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

interface SessionMeta {
  id: string;
  name: string;
  phoneNumber?: string;
  status: 'DISCONNECTED' | 'QR_READY' | 'PAIRING_READY' | 'CONNECTING' | 'CONNECTED';
  qrCode?: string;
  pairingCode?: string;
  lastConnectedAt?: number;
  createdAt?: number;
}

interface Campaign {
  id: string;
  session_id: string;
  name: string;
  template_text: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: number;
}

interface Contact {
  id: string;
  phone: string;
  name?: string;
  push_name?: string;
  tags: string[];
  pipeline_stage?: 'lead' | 'prospect' | 'customer' | 'churned';
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

interface Group {
  jid: string;
  name: string;
  topic?: string;
  memberCount: number;
}

interface AutoRule {
  id: string;
  name: string;
  conditions: Array<{ field: string; operator: string; value: string }>;
  actions: Array<{ type: string; text?: string; tag?: string; stage?: string }>;
  is_active: boolean;
  hit_count: number;
}

interface AuditLog {
  id: string;
  event_type: string;
  payload: any;
  created_at: number;
}

interface ChatItem {
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

interface ChatMessage {
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

interface SystemStatus {
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

// WhatsAman Phone Formatting Utilities
function parsePhoneFromJid(jid: string): string | null {
  if (!jid) return null;
  const [local, domain] = jid.split('@');
  if (domain && !domain.startsWith('c.us') && domain !== 's.whatsapp.net') return null;
  const user = local.split(':')[0];
  if (!/^\d+$/.test(user)) return null;
  return user;
}

function isSameChat(
  chatJidA?: string | null,
  chatJidB?: string | null,
  phoneA?: string | null,
  phoneB?: string | null
): boolean {
  if (!chatJidA || !chatJidB) return false;
  if (chatJidA === chatJidB) return true;

  // Normalize device extensions (e.g. 628123:0@s.whatsapp.net -> 628123@s.whatsapp.net)
  const cleanA = chatJidA.includes(':') && chatJidA.includes('@') ? chatJidA.replace(/:[0-9]+@/, '@') : chatJidA;
  const cleanB = chatJidB.includes(':') && chatJidB.includes('@') ? chatJidB.replace(/:[0-9]+@/, '@') : chatJidB;
  if (cleanA === cleanB) return true;

  // Groups and Channels must match strictly
  if (cleanA.endsWith('@g.us') || cleanB.endsWith('@g.us') || cleanA.endsWith('@newsletter') || cleanB.endsWith('@newsletter')) {
    return cleanA === cleanB;
  }

  // Extract phone numbers from JID if available
  const digitsA = phoneA || parsePhoneFromJid(cleanA);
  const digitsB = phoneB || parsePhoneFromJid(cleanB);

  if (digitsA && digitsB) {
    return digitsA === digitsB;
  }

  if (digitsA && (cleanB.startsWith(digitsA) || cleanB.includes(digitsA))) return true;
  if (digitsB && (cleanA.startsWith(digitsB) || cleanA.includes(digitsB))) return true;

  return false;
}

const TWO_DIGIT_COUNTRY_CODE = /^(?:2[07]|3[0-469]|4[013-9]|5[1-8]|6[0-6]|8[1246]|9[0-58])/;

function formatPhoneForDisplay(phoneOrJid: string): string {
  if (!phoneOrJid) return '';
  if (phoneOrJid.includes('@g.us')) return 'Grup WhatsApp';
  if (phoneOrJid.includes('@newsletter')) return 'Saluran WhatsApp';
  if (phoneOrJid.includes('broadcast')) return 'Status';
  if (phoneOrJid.includes('@lid')) return 'WhatsApp User (LID)';

  const digits = /^\d+$/.test(phoneOrJid) ? phoneOrJid : parsePhoneFromJid(phoneOrJid);
  if (!digits) {
    return phoneOrJid;
  }
  // Reject tokens longer than 15 digits (e.g. raw anonymous LID tokens)
  if (digits.length > 15) {
    return 'WhatsApp Contact';
  }
  if (digits.length <= 4) return `+${digits}`;

  let ccLen = 3;
  if (digits.length <= 6 || digits[0] === '1' || digits[0] === '7') ccLen = 1;
  else if (TWO_DIGIT_COUNTRY_CODE.test(digits)) ccLen = 2;

  const cc = digits.slice(0, ccLen);
  const rest = digits.slice(ccLen);
  if (rest.length <= 4) return `+${cc} ${rest}`;
  const last4 = rest.slice(-4);
  const prefix = rest.slice(0, -4);
  const prefixGroups = prefix.match(/.{1,3}/g) ?? [prefix];
  return `+${cc} ${[...prefixGroups, last4].join(' ')}`;
}

function formatWhatsAppTimestamp(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Kemarin';
  }

  const diffDays = Math.round((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
  if (diffDays < 7) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[date.getDay()];
  }

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function formatDateSeparator(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return 'HARI INI';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'KEMARIN';

  const diffDays = Math.round((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
  if (diffDays < 7) {
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    return days[date.getDay()];
  }

  const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getChatDisplayName(
  chatJid: string,
  rawName?: string,
  pushName?: string,
  contactsList: Contact[] = [],
  groupsList: Group[] = []
): string {
  if (!chatJid) return '';
  if (chatJid.endsWith('@g.us')) {
    const g = groupsList.find(item => item.jid === chatJid);
    return g?.name || rawName || 'Grup WhatsApp';
  }
  if (chatJid.endsWith('@newsletter')) {
    return rawName || 'Saluran WhatsApp';
  }

  const cleanPhone = chatJid.split('@')[0];
  const matched = contactsList.find(c => c.phone === cleanPhone || chatJid.includes(c.phone));
  if (matched?.name) return matched.name;
  if (rawName && !rawName.includes('@') && !/^\d+$/.test(rawName)) return rawName;
  if (pushName && !pushName.includes('@') && !/^\d+$/.test(pushName)) return pushName;

  return formatPhoneForDisplay(cleanPhone) || `+${cleanPhone}`;
}

function getChatSubtitle(
  chatJid: string,
  rawName?: string,
  pushName?: string,
  contactsList: Contact[] = [],
  groupsList: Group[] = []
): string {
  if (!chatJid) return '';
  if (chatJid.endsWith('@g.us')) {
    const g = groupsList.find(item => item.jid === chatJid);
    return g?.memberCount ? `${g.memberCount} peserta` : 'Grup WhatsApp';
  }
  if (chatJid.endsWith('@newsletter')) {
    return 'Saluran Publik';
  }
  const cleanPhone = chatJid.split('@')[0];
  const matched = contactsList.find(c => c.phone === cleanPhone || chatJid.includes(c.phone));
  if (matched?.name) {
    return formatPhoneForDisplay(cleanPhone) || `+${cleanPhone}`;
  }
  if (rawName || pushName) {
    return formatPhoneForDisplay(cleanPhone) || `+${cleanPhone}`;
  }
  return 'online';
}

function getAvatarBgColor(str: string): string {
  if (!str) return '#00a884';
  const colors = [
    '#00a884', '#0284c7', '#7c3aed', '#db2777', '#ea580c', '#059669', '#d97706', '#4f46e5', '#0891b2', '#0d9488'
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface ChatAvatarProps {
  sessionId?: string;
  jid?: string;
  name?: string;
  isGroup?: boolean;
  isNewsletter?: boolean;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

const loadedAvatarUrls = new Set<string>();
const failedAvatarUrls = new Set<string>();

const ChatAvatar: React.FC<ChatAvatarProps> = React.memo(({
  sessionId,
  jid,
  name,
  isGroup,
  isNewsletter,
  className = 'chat-avatar',
  size = 18,
  style
}) => {
  const avatarUrl = sessionId && jid ? `/api/v1/sessions/${sessionId}/avatar?jid=${encodeURIComponent(jid)}` : null;

  const [hasError, setHasError] = useState(() => avatarUrl ? failedAvatarUrls.has(avatarUrl) : false);
  const [isLoaded, setIsLoaded] = useState(() => avatarUrl ? loadedAvatarUrls.has(avatarUrl) : false);

  useEffect(() => {
    if (!avatarUrl) {
      setHasError(false);
      setIsLoaded(false);
      return;
    }
    if (loadedAvatarUrls.has(avatarUrl)) {
      setIsLoaded(true);
      setHasError(false);
    } else if (failedAvatarUrls.has(avatarUrl)) {
      setIsLoaded(false);
      setHasError(true);
    } else {
      setIsLoaded(false);
      setHasError(false);
    }
  }, [avatarUrl]);

  const displayName = name || jid || '';
  const bgColor = isGroup ? '#e2e8f0' : isNewsletter ? '#fef3c7' : getAvatarBgColor(displayName);
  const textColor = isGroup ? '#475569' : isNewsletter ? '#b45309' : '#ffffff';

  return (
    <div
      className={className}
      style={{
        backgroundColor: (!isLoaded || hasError) ? bgColor : 'transparent',
        color: textColor,
        fontWeight: 700,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      {avatarUrl && !hasError && (
        <img
          src={avatarUrl}
          alt={displayName}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onLoad={() => {
            loadedAvatarUrls.add(avatarUrl);
            failedAvatarUrls.delete(avatarUrl);
            setIsLoaded(true);
            setHasError(false);
          }}
          onError={() => {
            failedAvatarUrls.add(avatarUrl);
            loadedAvatarUrls.delete(avatarUrl);
            setHasError(true);
            setIsLoaded(false);
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            display: isLoaded ? 'block' : 'none'
          }}
        />
      )}
      {(!isLoaded || hasError) && (
        isGroup ? (
          <Users size={size} />
        ) : isNewsletter ? (
          <Radio size={size} />
        ) : displayName && !displayName.startsWith('+') && displayName !== jid ? (
          displayName.slice(0, 2).toUpperCase()
        ) : (
          <Smartphone size={size} />
        )
      )}
    </div>
  );
});

interface ChatInputBoxProps {
  onSend: (text: string) => void;
  onAttach: () => void;
  disabled?: boolean;
  placeholder?: string;
  sendTitle?: string;
  attachTitle?: string;
}

const ChatInputBox: React.FC<ChatInputBoxProps> = React.memo(({
  onSend,
  onAttach,
  disabled = false,
  placeholder,
  sendTitle,
  attachTitle,
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <div className="room-input-footer">
      <form className="input-form" onSubmit={handleSubmit}>
        <button
          type="button"
          className="btn-input-accessory"
          title="Emoji"
          onClick={() => setText(prev => prev + ' 😊')}
        >
          <Smile size={20} />
        </button>
        <button
          type="button"
          className="btn-input-accessory"
          title={attachTitle || 'Lampirkan File'}
          onClick={onAttach}
        >
          <Paperclip size={20} />
        </button>
        <input
          type="text"
          placeholder={placeholder || 'Ketik pesan...'}
          value={text}
          onChange={e => setText(e.target.value)}
          className="message-text-input"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="btn-send-message"
          title={sendTitle || 'Kirim'}
        >
          <Send size={18} style={{ marginLeft: '2px' }} />
        </button>
      </form>
    </div>
  );
});

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  showDateSeparator: boolean;
  dateSeparatorText?: string;
  senderDisplayName?: string;
  isGroupChat: boolean;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = React.memo(({
  message: m,
  isMe,
  showDateSeparator,
  dateSeparatorText,
  senderDisplayName,
  isGroupChat
}) => {
  return (
    <React.Fragment key={m.id}>
      {showDateSeparator && dateSeparatorText && (
        <div className="chat-date-separator">
          <span>{dateSeparatorText}</span>
        </div>
      )}
      <div className={`message-bubble-wrapper ${isMe ? 'outgoing' : 'incoming'}`}>
        <div className={`message-bubble ${isMe ? 'outgoing' : 'incoming'}`}>
          {!isMe && isGroupChat && senderDisplayName && (
            <div className="message-sender">
              {senderDisplayName}
            </div>
          )}
          {m.media_url && m.media_type === 'audio' && (
            <div className="chat-audio-media">
              <audio controls preload="metadata" className="chat-audio-player" src={m.media_url}>
                Browser tidak mendukung pemutar audio.
              </audio>
            </div>
          )}
          {m.media_url && m.media_type === 'video' && (
            <div className="chat-video-media">
              <video controls preload="metadata" className="chat-video-player" src={m.media_url}>
                Browser tidak mendukung pemutar video.
              </video>
            </div>
          )}
          {m.media_url && m.media_type === 'document' && (
            <div className="chat-document-media">
              <a href={m.media_url} target="_blank" rel="noreferrer" download className="chat-doc-card">
                <FileText size={26} className="chat-doc-icon" />
                <div className="chat-doc-info">
                  <span className="chat-doc-name">{m.caption || 'Dokumen File'}</span>
                  <span className="chat-doc-action">Klik untuk Mengunduh</span>
                </div>
              </a>
            </div>
          )}
          {m.media_url && (m.media_type === 'image' || m.media_type === 'sticker' || !m.media_type) && (
            <div style={{ marginBottom: '0.375rem', borderRadius: '8px', overflow: 'hidden' }}>
              <img
                src={m.media_url}
                alt="Media message"
                className={m.media_type === 'sticker' ? 'chat-sticker-media' : 'chat-image-media'}
                onClick={() => window.open(m.media_url, '_blank')}
              />
            </div>
          )}
          {!m.media_url && m.media_type && (
            <div className="chat-media-badge">
              {m.media_type === 'audio' ? <Mic size={14} /> : m.media_type === 'video' ? <Video size={14} /> : m.media_type === 'document' ? <FileText size={14} /> : <Image size={14} />}
              <span>{m.media_type === 'audio' ? 'Voice Note' : m.media_type === 'video' ? 'Video' : m.media_type === 'document' ? 'Dokumen' : 'Foto'}</span>
            </div>
          )}
          <div className="message-text">{m.content_text || m.caption}</div>
          <div className="message-meta">
            <span className="message-time">
              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isMe && (
              <CheckCheck
                size={14}
                className={`message-status-icon ${m.status === 'READ' ? 'read' : ''}`}
              />
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
});

export default function App() {
  // Theme state: light or dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('whatsaman_theme') as 'light' | 'dark') || 'light';
  });

  // Sidebar collapse & mobile state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('whatsaman_collapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'sessions' | 'chats' | 'crm' | 'contacts' | 'groups' | 'campaigns' | 'tester' | 'automation' | 'integrations' | 'infrastructure' | 'logs'
  >('dashboard');

  // AMAN CHAT Pro: Privacy & Security Mode (Alt + P)
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('whatsaman_privacy') === 'true';
  });

  // Multilingual Support (i18n: Indonesian / English)
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('whatsaman_lang') as Language) || 'id';
  });
  const t = translations[lang];

  const toggleLanguage = () => {
    const nextLang: Language = lang === 'id' ? 'en' : 'id';
    setLang(nextLang);
    localStorage.setItem('whatsaman_lang', nextLang);
    addLog(nextLang === 'id' ? 'Bahasa antarmuka diubah ke Bahasa Indonesia' : 'Interface language switched to English', 'info');
  };

  // AMAN CHAT Pro: CRM Pipeline, Follow-up Sequencer & Sales Funnel
  const [crmStageFilter, setCrmStageFilter] = useState<'ALL' | 'lead' | 'prospect' | 'customer' | 'churned'>('ALL');
  const [crmSearchQuery, setCrmSearchQuery] = useState('');
  const [crmTasks, setCrmTasks] = useState<FollowUpTask[]>([]);
  const [crmTaskFilter, setCrmTaskFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [crmSequences, setCrmSequences] = useState<Sequence[]>([]);
  const [crmAnalytics, setCrmAnalytics] = useState<SalesAnalytics | null>(null);
  const [crmTimeRange, setCrmTimeRange] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('7d');
  const [crmAutoDispatch, setCrmAutoDispatch] = useState<boolean>(false);
  const [isNewTaskModal, setIsNewTaskModal] = useState(false);
  const [newTaskPhone, setNewTaskPhone] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('Follow-up Penawaran Produk');
  const [newTaskTemplate, setNewTaskTemplate] = useState('{Halo|Hai} kak {{name}}! 👋\n\nMenyambung obrolan kemarin, apakah ada yang bisa kami bantu terkait info paket kami? 🙏');
  const [newTaskDueHours, setNewTaskDueHours] = useState(24);
  const [isApplySeqModal, setIsApplySeqModal] = useState(false);
  const [applySeqContact, setApplySeqContact] = useState<Contact | null>(null);
  const [selectedSeqId, setSelectedSeqId] = useState('');
  const [isNotesModal, setIsNotesModal] = useState(false);
  const [selectedContactForNotes, setSelectedContactForNotes] = useState<Contact | null>(null);
  const [contactNotesText, setContactNotesText] = useState('');

  // AMAN CHAT Pro: Auto-Reply Bot Configuration
  const [botConfig, setBotConfig] = useState<AutoReplyConfig>({
    autoReplyEnabled: true,
    businessHoursEnabled: false,
    businessHoursStart: '08:00',
    businessHoursEnd: '17:00',
    businessDays: [1, 2, 3, 4, 5],
    offlineReplyEnabled: true,
    offlineReplyText: 'Halo kak {{name}}! 👋\n\nTerima kasih telah menghubungi kami. Saat ini layanan kami sedang berada di luar jam operasional (08:00 - 17:00 WIB).\n\nPesan kakak sudah kami terima dan tim support kami akan membalas segera saat jam kerja dibuka ya! 🙏',
    cooldownMinutes: 5,
    fallbackEnabled: false,
    fallbackReplyText: 'Halo kak {{name}}, terima kasih pesannya! Tim kami sedang mengecek pesan kakak dan akan merespon secepatnya. Jika butuh bantuan cepat, ketik *MENU*.',
    simulateTyping: true
  });
  const [ruleAddTagEnabled, setRuleAddTagEnabled] = useState(false);
  const [ruleActionTag, setRuleActionTag] = useState('🔥 Hot Lead');
  const [ruleSetStageEnabled, setRuleSetStageEnabled] = useState(false);
  const [ruleActionStage, setRuleActionStage] = useState<'lead' | 'prospect' | 'customer' | 'churned'>('prospect');
  const [editRuleAddTagEnabled, setEditRuleAddTagEnabled] = useState(false);
  const [editRuleActionTag, setEditRuleActionTag] = useState('🔥 Hot Lead');
  const [editRuleSetStageEnabled, setEditRuleSetStageEnabled] = useState(false);
  const [editRuleActionStage, setEditRuleActionStage] = useState<'lead' | 'prospect' | 'customer' | 'churned'>('prospect');

  // Core data states
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rules, setRules] = useState<AutoRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [liveLogs, setLiveLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'success' | 'warn' }>>([]);
  const [copiedPairingCode, setCopiedPairingCode] = useState(false);

  // Session search & filters
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState('ALL');

  // Live Chat & Inbox State
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeChatJid, setActiveChatJid] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatsSidebarTab, setChatsSidebarTab] = useState<'chats' | 'contacts' | 'groups' | 'channels'>('chats');
  const [chatFilter, setChatFilter] = useState<'all' | 'personal' | 'groups' | 'channels' | 'unread'>('all');
  const [chatReplyText, setChatReplyText] = useState('');
  const [isNewChatModal, setIsNewChatModal] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [isRefreshingChats, setIsRefreshingChats] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [isRefreshingThread, setIsRefreshingThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // O(1) Fast Lookups & Memoized Filtering
  const contactsMap = useMemo(() => {
    const map = new Map<string, Contact>();
    for (const c of contacts) {
      if (c.phone) map.set(c.phone, c);
      if (c.jid) map.set(c.jid, c);
    }
    return map;
  }, [contacts]);

  const groupsMap = useMemo(() => {
    const map = new Map<string, Group>();
    for (const g of groups) {
      if (g.jid) map.set(g.jid, g);
    }
    return map;
  }, [groups]);

  const findContact = useCallback((phoneOrJid?: string | null): Contact | null => {
    if (!phoneOrJid) return null;
    const direct = contactsMap.get(phoneOrJid);
    if (direct) return direct;
    const cleanPhone = phoneOrJid.split('@')[0].replace(/[^0-9]/g, '');
    if (cleanPhone) return contactsMap.get(cleanPhone) || null;
    return null;
  }, [contactsMap]);

  const unreadChatsCount = useMemo(() => {
    return chats.filter(c => (c.unread_count || 0) > 0 && !c.chat_jid.includes('broadcast')).length;
  }, [chats]);

  const filteredChats = useMemo(() => {
    const query = chatSearchQuery.trim().toLowerCase();
    return chats.filter(c => {
      if (c.chat_jid.includes('broadcast')) return false;
      const isGroup = c.chat_jid.endsWith('@g.us');
      const isNewsletter = c.chat_jid.endsWith('@newsletter');
      const isPersonal = !isGroup && !isNewsletter;
      const isUnread = (c.unread_count || 0) > 0;

      if (chatFilter === 'personal' && !isPersonal) return false;
      if (chatFilter === 'groups' && !isGroup) return false;
      if (chatFilter === 'channels' && !isNewsletter) return false;
      if (chatFilter === 'unread' && !isUnread) return false;

      if (!query) return true;

      const groupMatch = isGroup ? groupsMap.get(c.chat_jid) : null;
      const nameToSearch = groupMatch?.name || c.name || c.push_name || '';
      return `${c.chat_jid} ${nameToSearch} ${c.last_message || ''}`.toLowerCase().includes(query);
    });
  }, [chats, chatFilter, chatSearchQuery, groupsMap]);

  const filteredContacts = useMemo(() => {
    const query = chatSearchQuery.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter(c =>
      `${c.phone} ${c.name || ''} ${c.push_name || ''} ${c.tags.join(' ')}`.toLowerCase().includes(query)
    );
  }, [contacts, chatSearchQuery]);

  const filteredGroups = useMemo(() => {
    const query = chatSearchQuery.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter(g =>
      `${g.jid} ${g.name || ''}`.toLowerCase().includes(query)
    );
  }, [groups, chatSearchQuery]);

  const filteredChannels = useMemo(() => {
    const query = chatSearchQuery.trim().toLowerCase();
    return chats.filter(c => {
      if (!c.chat_jid.endsWith('@newsletter')) return false;
      if (!query) return true;
      return `${c.chat_jid} ${c.name || ''} ${c.push_name || ''} ${c.last_message || ''}`.toLowerCase().includes(query);
    });
  }, [chats, chatSearchQuery]);

  // Chat Page Broadcast State
  const [isChatBroadcastModal, setIsChatBroadcastModal] = useState(false);
  const [chatBroadcastSessionId, setChatBroadcastSessionId] = useState('');
  const [chatBroadcastMode, setChatBroadcastMode] = useState<'manual' | 'select' | 'tag'>('manual');
  const [chatBroadcastManualNumbers, setChatBroadcastManualNumbers] = useState('');
  const [chatBroadcastSelectedPhones, setChatBroadcastSelectedPhones] = useState<string[]>([]);
  const [chatBroadcastTag, setChatBroadcastTag] = useState('ALL');
  const [chatBroadcastMessage, setChatBroadcastMessage] = useState('Halo {kak|bapak|ibu} {{name}},\n\nAda penawaran spesial hari ini untuk Anda!');
  const [chatBroadcastDelayMin, setChatBroadcastDelayMin] = useState(5);
  const [chatBroadcastDelayMax, setChatBroadcastDelayMax] = useState(15);
  const [chatBroadcastSending, setChatBroadcastSending] = useState(false);

  // Chat Page Auto Reply State
  const [isChatAutoReplyModal, setIsChatAutoReplyModal] = useState(false);

  // Message Tester State
  const [testerType, setTesterType] = useState<'text' | 'media'>('text');
  const [testerRecipient, setTesterRecipient] = useState('');
  const [testerMessage, setTesterMessage] = useState('Halo, ini pesan pengujian dari WhatsAman!');
  const [testerMediaFile, setTesterMediaFile] = useState<File | null>(null);
  const [testerMediaCaption, setTesterMediaCaption] = useState('Lampiran file WhatsAman');
  const [testerLoading, setTesterLoading] = useState(false);
  const [testerResponse, setTesterResponse] = useState<any | null>(null);

  // Webhooks & 3rd-Party Integrations State
  const [integrationConfigs, setIntegrationConfigs] = useState<IntegrationConfig[]>([]);
  const [outgoingWebhooks, setOutgoingWebhooks] = useState<OutgoingWebhook[]>([]);
  const [integrationLogs, setIntegrationLogs] = useState<IntegrationLog[]>([]);
  const [selectedIntegrationTab, setSelectedIntegrationTab] = useState<'google_form' | 'woocommerce' | 'cf7' | 'elementor' | 'caldera' | 'formidable' | 'outgoing' | 'logs'>('google_form');
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [copiedScriptCode, setCopiedScriptCode] = useState(false);
  const [isTestIntegrationModal, setIsTestIntegrationModal] = useState(false);
  const [testIntegrationPhone, setTestIntegrationPhone] = useState('');
  const [testIntegrationName, setTestIntegrationName] = useState('Budi Santoso');
  const [testIntegrationFormName, setTestIntegrationFormName] = useState('Formulir Pendaftaran');
  const [testIntegrationLoading, setTestIntegrationLoading] = useState(false);
  const [testIntegrationResult, setTestIntegrationResult] = useState<any>(null);
  const [editIntegrationConfig, setEditIntegrationConfig] = useState<IntegrationConfig | null>(null);
  const [isEditIntegrationModal, setIsEditIntegrationModal] = useState(false);
  const [isAddOutgoingWebhookModal, setIsAddOutgoingWebhookModal] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookSecret, setNewWebhookSecret] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>(['message.received', 'message.ack']);

  // Modals state
  const [isAddSessionModal, setIsAddSessionModal] = useState(false);
  const [newSessionId, setNewSessionId] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [loginMethod, setLoginMethod] = useState<'qr' | 'pairing'>('qr');
  const [pairingPhone, setPairingPhone] = useState('');

  // Disconnected Session Connect Option State
  const [connectOptionModal, setConnectOptionModal] = useState<{ open: boolean; sessionId: string; method: 'qr' | 'pairing'; phone: string }>({
    open: false,
    sessionId: '',
    method: 'qr',
    phone: ''
  });

  // QR Modal View
  const [activeQrModal, setActiveQrModal] = useState<{ open: boolean; session: SessionMeta | null }>({
    open: false,
    session: null
  });

  // Contacts Tab State
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [isAddContactModal, setIsAddContactModal] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactTags, setNewContactTags] = useState('Pelanggan');

  // Contact Groups / Tags State
  const [availableTags, setAvailableTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('ALL');
  const [isEditContactTagsModal, setIsEditContactTagsModal] = useState(false);
  const [editingContactPhone, setEditingContactPhone] = useState('');
  const [editingContactName, setEditingContactName] = useState('');
  const [editingContactTags, setEditingContactTags] = useState('');

  // New Campaign Form
  const [isNewCampaignModal, setIsNewCampaignModal] = useState(false);
  const [campName, setCampName] = useState('');
  const [campAudienceMode, setCampAudienceMode] = useState<'group' | 'manual'>('group');
  const [campSelectedTag, setCampSelectedTag] = useState<string>('ALL');
  const [campTemplate, setCampTemplate] = useState('Halo {{name}}, perkenalkan penawaran spesial kami...');
  const [campRecipientsRaw, setCampRecipientsRaw] = useState('');
  const [campRandomDelayMin, setCampRandomDelayMin] = useState(5);
  const [campRandomDelayMax, setCampRandomDelayMax] = useState(15);

  // Campaign Recipients View State
  const [isViewRecipientsModal, setIsViewRecipientsModal] = useState(false);
  const [viewRecipientsList, setViewRecipientsList] = useState<any[]>([]);
  const [viewCampaignTitle, setViewCampaignTitle] = useState('');

  // New Rule Form & Edit
  const [isNewRuleModal, setIsNewRuleModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleTriggerText, setRuleTriggerText] = useState('');
  const [ruleOperator, setRuleOperator] = useState<'contains' | 'equals' | 'starts_with' | 'regex'>('contains');
  const [ruleReplyText, setRuleReplyText] = useState('{Halo|Hai} {{name}}, terima kasih telah menghubungi kami!');

  const [isEditRuleModal, setIsEditRuleModal] = useState(false);
  const [editRuleId, setEditRuleId] = useState('');
  const [editRuleName, setEditRuleName] = useState('');
  const [editRuleTriggerText, setEditRuleTriggerText] = useState('');
  const [editRuleOperator, setEditRuleOperator] = useState<'contains' | 'equals' | 'starts_with' | 'regex'>('contains');
  const [editRuleReplyText, setEditRuleReplyText] = useState('');

  // Automation Rule Tester Simulator
  const [simTestInput, setSimTestInput] = useState('');
  const [simMatchedRule, setSimMatchedRule] = useState<AutoRule | null>(null);
  const [simEvaluatedReply, setSimEvaluatedReply] = useState<string>('');

  // Media Chat State
  const [isSendMediaModal, setIsSendMediaModal] = useState(false);
  const [chatMediaFile, setChatMediaFile] = useState<File | null>(null);
  const [chatMediaCaption, setChatMediaCaption] = useState('');

  // Audit filter
  const [logFilter, setLogFilter] = useState('ALL');

  const wsRef = useRef<WebSocket | null>(null);
  const selectedSessionIdRef = useRef<string>(selectedSessionId);
  const activeChatJidRef = useRef<string | null>(activeChatJid);
  const chatsRef = useRef<ChatItem[]>(chats);
  selectedSessionIdRef.current = selectedSessionId;
  activeChatJidRef.current = activeChatJid;
  chatsRef.current = chats;

  // Set Theme attribute on HTML tag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('whatsaman_theme', theme);
  }, [theme]);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeChatJid]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('whatsaman_collapsed', String(next));
      return next;
    });
  };

  const addLog = (text: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLiveLogs(prev => [{ id: Math.random().toString(), time, text, type }, ...prev.slice(0, 49)]);
  };

  // Helper for live spintax preview
  const previewTemplate = (template: string, sampleName = 'Budi Santoso'): string => {
    let res = template.replace(/\{([^{}]+)\}/g, (_, choices) => {
      const parts = choices.split('|');
      return parts[0].trim();
    });
    res = res.replace(/\{\{name\}\}/gi, sampleName);
    res = res.replace(/\{\{phone\}\}/gi, '08123456789');
    res = res.replace(/\{\{tagihan\}\}/gi, '150.000');
    return res;
  };

  // Fetch Core Data
  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/v1/sessions');
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
        if (!selectedSessionId && data.data.length > 0) {
          setSelectedSessionId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/v1/campaigns');
      const data = await res.json();
      if (data.success) setCampaigns(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTags = async (sessionId: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/v1/contacts/tags?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAvailableTags(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tags', err);
    }
  };

  const fetchContacts = async (sessionId: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/v1/contacts?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.success) {
        setContacts(data.data);
        fetchTags(sessionId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async (sessionId: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/v1/groups?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.success) setGroups(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChats = async (sessionId: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/v1/messages/chats?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.success) {
        setChats(data.data);
        if (!activeChatJid && data.data.length > 0) {
          setActiveChatJid(data.data[0].chat_jid);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChatMessages = async (sessionId: string, chatJid: string) => {
    if (!sessionId || !chatJid) return;
    try {
      const res = await fetch(`/api/v1/messages/history?sessionId=${sessionId}&chatJid=${encodeURIComponent(chatJid)}&limit=100`);
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.data);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualRefreshChats = async () => {
    if (isRefreshingChats) return;
    setIsRefreshingChats(true);
    setRefreshSuccess(false);
    try {
      const promises: Promise<any>[] = [];
      if (selectedSessionId) {
        promises.push(fetchChats(selectedSessionId));
        promises.push(fetchGroups(selectedSessionId));
        promises.push(fetchContacts(selectedSessionId));
        if (activeChatJid) {
          promises.push(fetchChatMessages(selectedSessionId, activeChatJid));
        }
      }
      promises.push(fetchSessions());
      await Promise.all(promises);
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2500);
    } catch (err) {
      console.error('Error refreshing chats:', err);
    } finally {
      setTimeout(() => {
        setIsRefreshingChats(false);
      }, 450);
    }
  };

  const handleRefreshActiveThread = async () => {
    if (!selectedSessionId || !activeChatJid || isRefreshingThread) return;
    setIsRefreshingThread(true);
    try {
      await fetchChatMessages(selectedSessionId, activeChatJid);
      await fetchChats(selectedSessionId);
    } catch (err) {
      console.error('Error refreshing thread:', err);
    } finally {
      setTimeout(() => {
        setIsRefreshingThread(false);
      }, 450);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/v1/automation');
      const data = await res.json();
      if (data.success) setRules(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const res = await fetch('/api/v1/system/status');
      const data = await res.json();
      if (data.success) setSystemStatus(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/v1/system/backups');
      const data = await res.json();
      if (data.success) setBackups(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/v1/system/audit');
      const data = await res.json();
      if (data.success) setAuditLogs(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIntegrationConfigs = async () => {
    try {
      const res = await fetch(`/api/v1/integrations/configs${selectedSessionId ? `?sessionId=${selectedSessionId}` : ''}`);
      const data = await res.json();
      if (data.success) setIntegrationConfigs(data.data);
    } catch (err) {
      console.error('Failed to fetch integration configs:', err);
    }
  };

  const fetchOutgoingWebhooks = async () => {
    try {
      const res = await fetch(`/api/v1/webhooks${selectedSessionId ? `?sessionId=${selectedSessionId}` : ''}`);
      const data = await res.json();
      if (data.success) setOutgoingWebhooks(data.data);
    } catch (err) {
      console.error('Failed to fetch webhooks:', err);
    }
  };

  const fetchIntegrationLogs = async () => {
    try {
      const res = await fetch(`/api/v1/integrations/logs?limit=50${selectedSessionId ? `&sessionId=${selectedSessionId}` : ''}`);
      const data = await res.json();
      if (data.success) setIntegrationLogs(data.data);
    } catch (err) {
      console.error('Failed to fetch integration logs:', err);
    }
  };

  const handleSaveIntegrationConfig = async (conf: Partial<IntegrationConfig>) => {
    try {
      const res = await fetch('/api/v1/integrations/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conf)
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Konfigurasi integrasi ${conf.name} berhasil disimpan`, 'success');
        fetchIntegrationConfigs();
        setIsEditIntegrationModal(false);
      } else {
        alert(data.message || 'Gagal menyimpan konfigurasi');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTestIncomingWebhook = async () => {
    if (!testIntegrationPhone.trim()) {
      alert('Masukkan nomor WhatsApp tujuan uji coba!');
      return;
    }
    setTestIntegrationLoading(true);
    setTestIntegrationResult(null);
    try {
      const sId = selectedSessionId || sessions[0]?.id || 'default';
      const provider = selectedIntegrationTab === 'logs' || selectedIntegrationTab === 'outgoing' ? 'google_form' : selectedIntegrationTab;
      const res = await fetch(`/api/v1/integrations/webhook/${provider}/${sId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testIntegrationName,
          phone: testIntegrationPhone,
          form_name: testIntegrationFormName,
          order_id: '1001',
          currency: 'Rp',
          total: '250.000',
          status: 'Processing',
          items_summary: '1x Kopi Arabika, 2x Roti Bakar',
          message: 'Halo, saya ingin bertanya info katalog terbaru'
        })
      });
      const data = await res.json();
      setTestIntegrationResult(data);
      if (data.success) {
        addLog(`Test webhook ${provider} berhasil dikirim ke ${testIntegrationPhone}`, 'success');
        fetchIntegrationLogs();
      }
    } catch (err: any) {
      setTestIntegrationResult({ success: false, message: err.message });
    } finally {
      setTestIntegrationLoading(false);
    }
  };

  const handleCreateOutgoingWebhook = async () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) {
      alert('Nama dan URL Webhook wajib diisi!');
      return;
    }
    try {
      const res = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newWebhookName,
          targetUrl: newWebhookUrl,
          secretKey: newWebhookSecret || undefined,
          events: newWebhookEvents,
          sessionId: selectedSessionId || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Outgoing Webhook ${newWebhookName} berhasil ditambahkan`, 'success');
        setIsAddOutgoingWebhookModal(false);
        setNewWebhookName('');
        setNewWebhookUrl('');
        setNewWebhookSecret('');
        fetchOutgoingWebhooks();
      } else {
        alert(data.message || 'Gagal menambahkan webhook');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteOutgoingWebhook = async (id: string) => {
    if (!confirm('Hapus webhook subscription ini?')) return;
    try {
      const res = await fetch(`/api/v1/webhooks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addLog('Webhook subscription dihapus', 'info');
        fetchOutgoingWebhooks();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTestOutgoingWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/webhooks/${id}/test`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Test Ping terkirim! Status Code: ${data.data?.status || 200}`);
        fetchOutgoingWebhooks();
      } else {
        alert(`Gagal kirim test ping: ${data.message}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Setup WebSocket connection for real-time synchronization
  useEffect(() => {
    fetchSessions();
    fetchCampaigns();
    fetchRules();
    fetchSystemStatus();
    fetchBackups();
    fetchAuditLogs();

    let isMounted = true;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      if (!isMounted) return;
      const isDev = window.location.port === '5173';
      const wsPort = isDev ? '3000' : (window.location.port || (window.location.protocol === 'https:' ? '443' : '80'));
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:${wsPort}/ws`;

      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          addLog('WebSocket terhubung ke WhatsAman Core Engine', 'success');
          // Reconnection recovery: automatically catch up on missed chats and messages
          const curSession = selectedSessionIdRef.current;
          const curChat = activeChatJidRef.current;
          if (curSession) {
            fetchSessions();
            fetchChats(curSession);
            if (curChat) {
              fetchChatMessages(curSession, curChat);
            }
          }
        };

        ws.onmessage = evt => {
          try {
            const msg = JSON.parse(evt.data);

            if (msg.event?.startsWith('session.')) {
              fetchSessions();
              addLog(`Event Sesi: ${msg.event} (${msg.payload?.sessionId || ''})`, 'info');

              if (msg.event === 'session.qr') {
                setActiveQrModal(prev => {
                  if (prev.open && prev.session && prev.session.id === msg.payload?.sessionId) {
                    return {
                      ...prev,
                      session: {
                        ...prev.session,
                        qrCode: msg.payload?.qr,
                        status: 'QR_READY'
                      }
                    };
                  }
                  return prev;
                });
              } else if (msg.event === 'session.pairing_code') {
                setActiveQrModal(prev => {
                  if (prev.open && prev.session && prev.session.id === msg.payload?.sessionId) {
                    return {
                      ...prev,
                      session: {
                        ...prev.session,
                        pairingCode: msg.payload?.code,
                        status: 'PAIRING_READY'
                      }
                    };
                  }
                  return prev;
                });
              } else if (msg.event === 'session.connected') {
                setActiveQrModal({ open: false, session: null });
                setConnectOptionModal(prev => ({ ...prev, open: false }));
                addLog(`Sesi ${msg.payload?.sessionId} berhasil terhubung! (${msg.payload?.phone || ''})`, 'success');
                const curSession = selectedSessionIdRef.current;
                if (!curSession || curSession === msg.payload?.sessionId) {
                  setSelectedSessionId(msg.payload?.sessionId);
                  fetchContacts(msg.payload?.sessionId);
                  fetchGroups(msg.payload?.sessionId);
                  fetchChats(msg.payload?.sessionId);
                }
              } else if (msg.event === 'session.history_synced') {
                addLog(`Sinkronisasi riwayat pesan WhatsApp selesai (${msg.payload?.msgsCount || 0} pesan)`, 'success');
                const curSession = selectedSessionIdRef.current;
                const curChat = activeChatJidRef.current;
                if (curSession && curSession === msg.payload?.sessionId) {
                  fetchContacts(curSession);
                  fetchGroups(curSession);
                  fetchChats(curSession);
                  if (curChat) {
                    fetchChatMessages(curSession, curChat);
                  }
                }
              }
            }

            // Real-time Delta Push for incoming and outgoing messages
            if (msg.event === 'message.received' || msg.event === 'message.sent') {
              const newMsg = msg.payload?.message;
              const curSession = selectedSessionIdRef.current;
              const curChat = activeChatJidRef.current;

              if (newMsg && curSession && curSession === newMsg.sessionId) {
                if (msg.event === 'message.received') {
                  addLog(`Pesan Masuk: "${newMsg.text || (newMsg.mediaType ? `[${newMsg.mediaType}]` : 'Pesan')}"`, 'info');
                }

                // Check if message belongs to currently opened chat (robust LID / phone resolution)
                const activeChatItem = chatsRef.current.find(c => c.chat_jid === curChat);
                const curPhone = activeChatItem?.resolved_phone || parsePhoneFromJid(curChat || '');
                const msgPhone = newMsg.resolvedPhone || parsePhoneFromJid(newMsg.chatJid);
                const isCurrentActive = Boolean(
                  curChat &&
                  (isSameChat(curChat, newMsg.chatJid, curPhone, msgPhone) ||
                   Boolean(newMsg.to && isSameChat(curChat, newMsg.to, curPhone, msgPhone)))
                );

                if (isCurrentActive) {
                  // DELTA: append directly without heavy HTTP round-trip
                  setChatMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id || m.message_id === newMsg.id)) {
                      return prev;
                    }
                    const incomingMsg: ChatMessage = {
                      id: newMsg.id,
                      session_id: newMsg.sessionId,
                      message_id: newMsg.id,
                      chat_jid: newMsg.chatJid,
                      sender_jid: newMsg.senderJid,
                      from_me: newMsg.fromMe ? 1 : 0,
                      content_text: newMsg.text,
                      media_type: newMsg.mediaType,
                      media_url: newMsg.mediaUrl,
                      caption: newMsg.caption,
                      status: newMsg.fromMe ? 'SENT' : 'DELIVERED',
                      timestamp: newMsg.timestamp
                    };
                    return [...prev, incomingMsg];
                  });

                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }

                // DELTA: update sidebar chat preview in-place and bubble to top
                setChats(prevChats => {
                  const targetIndex = prevChats.findIndex(c => {
                    const cPhone = c.resolved_phone || parsePhoneFromJid(c.chat_jid);
                    return isSameChat(c.chat_jid, newMsg.chatJid, cPhone, msgPhone) ||
                           Boolean(newMsg.to && isSameChat(c.chat_jid, newMsg.to, cPhone, msgPhone));
                  });

                  const snippetText = newMsg.text || (newMsg.mediaType ? `[${newMsg.mediaType.toUpperCase()}]` : 'Pesan');

                  if (targetIndex !== -1) {
                    const target = prevChats[targetIndex];
                    const updatedChat: ChatItem = {
                      ...target,
                      last_message: snippetText,
                      last_from_me: newMsg.fromMe ? 1 : 0,
                      last_status: newMsg.fromMe ? 'SENT' : 'DELIVERED',
                      timestamp: newMsg.timestamp,
                      unread_count: isCurrentActive ? 0 : ((target.unread_count || 0) + (newMsg.fromMe ? 0 : 1))
                    };
                    const remaining = prevChats.filter((_, idx) => idx !== targetIndex);
                    return [updatedChat, ...remaining];
                  } else {
                    // Chat not in sidebar yet: fetch to load full metadata
                    fetchChats(curSession);
                    return prevChats;
                  }
                });
              }
            }

            // Real-time Delta Push for Status Receipts (SENT, DELIVERED, READ)
            if (msg.event === 'message.ack') {
              const { messageId, status } = msg.payload || {};
              if (messageId && status) {
                setChatMessages(prev =>
                  prev.map(m => (m.message_id === messageId || m.id === messageId ? { ...m, status } : m))
                );
              }
            }

            // Real-time Delta Push for Media Updates (when media finishes background download)
            if (msg.event === 'message.updated') {
              const updatedMsg = msg.payload?.message;
              if (updatedMsg?.id) {
                setChatMessages(prev =>
                  prev.map(m =>
                    (m.message_id === updatedMsg.id || m.id === updatedMsg.id)
                      ? {
                          ...m,
                          media_url: updatedMsg.mediaUrl || m.media_url,
                          content_text: updatedMsg.text || m.content_text
                        }
                      : m
                  )
                );
              }
            }

            if (msg.event === 'campaign.updated') {
              fetchCampaigns();
            }
          } catch (err) {
            console.error(err);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          reconnectTimeout = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (e) {
        if (isMounted) {
          reconnectTimeout = setTimeout(connectWs, 3000);
        }
      }
    };

    connectWs();

    const interval = setInterval(() => {
      fetchSystemStatus();
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (ws) {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => {
            try { ws?.close(); } catch { /* ignore */ }
          };
        } else if (ws.readyState === WebSocket.OPEN) {
          try { ws.close(); } catch { /* ignore */ }
        }
      }
      clearInterval(interval);
    };
  }, []);

  // AMAN CHAT Pro: Keyboard shortcut Alt + P for Instant Privacy Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setPrivacyMode(prev => {
          const next = !prev;
          localStorage.setItem('whatsaman_privacy', String(next));
          addLog(`Mode Privasi (Privacy Blur) ${next ? 'Aktif' : 'Nonaktif'}`, next ? 'info' : 'warn');
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchCRMTasks = async (sessionId: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/v1/crm/tasks?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCrmTasks(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch CRM tasks', err);
    }
  };

  const fetchCRMSequences = async (sessionId: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/v1/crm/sequences?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCrmSequences(data.data);
        if (data.data.length > 0 && !selectedSeqId) {
          setSelectedSeqId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch CRM sequences', err);
    }
  };

  const fetchSalesAnalytics = async (sessionId: string, range = crmTimeRange) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/v1/crm/analytics?sessionId=${sessionId}&range=${range}`);
      const data = await res.json();
      if (data.success && data.data) {
        setCrmAnalytics(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch CRM analytics', err);
    }
  };

  const fetchCrmAutoDispatch = async () => {
    try {
      const res = await fetch('/api/v1/crm/auto-dispatch');
      const data = await res.json();
      if (data.success) {
        setCrmAutoDispatch(Boolean(data.enabled));
      }
    } catch (err) {
      console.error('Failed to fetch CRM auto-dispatch status', err);
    }
  };

  const handleToggleCrmAutoDispatch = async () => {
    try {
      const next = !crmAutoDispatch;
      const res = await fetch('/api/v1/crm/auto-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next })
      });
      const data = await res.json();
      if (data.success) {
        setCrmAutoDispatch(data.enabled);
        addLog(`Otomatis Kirim Follow-up (Auto-Dispatch) ${data.enabled ? 'Diaktifkan' : 'Dinonaktifkan'}`, data.enabled ? 'success' : 'warn');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const fetchBotConfig = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/v1/automation/config?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setBotConfig(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch bot config', err);
    }
  };

  const handleSaveBotConfig = async () => {
    try {
      const res = await fetch('/api/v1/automation/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, config: botConfig })
      });
      const data = await res.json();
      if (data.success) {
        addLog('Pengaturan Auto-Reply Bot berhasil disimpan', 'success');
        alert('Pengaturan jam operasional & auto-reply bot berhasil disimpan!');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendChatBroadcast = async () => {
    const sId = chatBroadcastSessionId || selectedSessionId;
    if (!sId) {
      alert('Silakan pilih sesi WhatsApp terlebih dahulu!');
      return;
    }
    if (!chatBroadcastMessage.trim()) {
      alert('Pesan broadcast tidak boleh kosong!');
      return;
    }

    let recipients: Array<{ phone: string; name?: string; customVars: any }> = [];

    if (chatBroadcastMode === 'manual') {
      if (!chatBroadcastManualNumbers.trim()) {
        alert('Masukkan minimal 1 nomor tujuan!');
        return;
      }
      recipients = chatBroadcastManualNumbers
        .split('\n')
        .flatMap(line => line.split(','))
        .map(n => n.trim().replace(/[^0-9]/g, ''))
        .filter(n => n.length >= 7)
        .map(phone => ({ phone, name: formatPhoneForDisplay(phone), customVars: {} }));
    } else if (chatBroadcastMode === 'select') {
      if (chatBroadcastSelectedPhones.length === 0) {
        alert('Pilih minimal 1 kontak / chat penerima!');
        return;
      }
      recipients = chatBroadcastSelectedPhones.map(phone => {
        const contact = contacts.find(c => c.phone === phone);
        return {
          phone,
          name: contact?.name || contact?.push_name || formatPhoneForDisplay(phone),
          customVars: {}
        };
      });
    } else if (chatBroadcastMode === 'tag') {
      try {
        const res = await fetch(`/api/v1/contacts/by-tag?sessionId=${sId}&tag=${encodeURIComponent(chatBroadcastTag)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          recipients = data.data
            .filter((c: any) => !c.opt_out)
            .map((c: any) => ({
              phone: c.phone,
              name: c.name || c.push_name || formatPhoneForDisplay(c.phone),
              customVars: {}
            }));
        }
      } catch (err: any) {
        alert('Gagal mengambil kontak tag: ' + err.message);
        return;
      }
    }

    if (recipients.length === 0) {
      alert('Tidak ada penerima nomor telepon yang valid!');
      return;
    }

    try {
      setChatBroadcastSending(true);
      const campRes = await fetch('/api/v1/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sId,
          name: `Broadcast Chat (${new Date().toLocaleTimeString('id-ID')})`,
          templateText: chatBroadcastMessage,
          recipients,
          settings: {
            randomDelayMinSeconds: chatBroadcastDelayMin,
            randomDelayMaxSeconds: chatBroadcastDelayMax
          }
        })
      });

      const campData = await campRes.json();
      if (campData.success && campData.data?.id) {
        await fetch(`/api/v1/campaigns/${campData.data.id}/start`, { method: 'POST' });
        addLog(`Broadcast ke ${recipients.length} nomor berhasil dimulai!`, 'success');
        alert(`🚀 Broadcast berhasil dikirimkan ke antrian (${recipients.length} penerima)! Cek menu Campaigns untuk status detail.`);
        setIsChatBroadcastModal(false);
        fetchCampaigns();
      } else {
        alert(campData.message || 'Gagal membuat pesan broadcast');
      }
    } catch (err: any) {
      alert(`Gagal mengirim broadcast: ${err.message}`);
    } finally {
      setChatBroadcastSending(false);
    }
  };

  const handleToggleAutoReplyGlobal = async (enabled: boolean) => {
    const updatedConfig = { ...botConfig, autoReplyEnabled: enabled };
    setBotConfig(updatedConfig);
    try {
      const res = await fetch('/api/v1/automation/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, config: updatedConfig })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Auto-Reply ${enabled ? 'Diaktifkan' : 'Dinonaktifkan'}`, enabled ? 'success' : 'warn');
      }
    } catch (err: any) {
      console.error('Failed toggling auto-reply', err);
    }
  };

  const handleExecuteFollowUp = async (taskId: string) => {
    try {
      addLog(`Mengirim follow-up task ${taskId}...`, 'info');
      const res = await fetch(`/api/v1/crm/tasks/${taskId}/execute`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addLog(`Follow-up task berhasil terkirim!`, 'success');
        fetchCRMTasks(selectedSessionId);
        fetchSalesAnalytics(selectedSessionId, crmTimeRange);
      } else {
        alert(data.message || 'Gagal mengeksekusi follow-up task');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCancelFollowUp = async (taskId: string) => {
    try {
      await fetch(`/api/v1/crm/tasks/${taskId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Dibatalkan manual oleh pengguna' })
      });
      fetchCRMTasks(selectedSessionId);
      addLog('Follow-up task dibatalkan', 'warn');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteFollowUp = async (taskId: string) => {
    if (!confirm('Hapus task follow-up ini?')) return;
    try {
      await fetch(`/api/v1/crm/tasks/${taskId}`, { method: 'DELETE' });
      fetchCRMTasks(selectedSessionId);
      addLog('Follow-up task dihapus', 'info');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateFollowUpTask = async () => {
    if (!newTaskPhone.trim() || !newTaskTitle.trim() || !newTaskTemplate.trim()) return;
    try {
      const dueAt = Date.now() + (newTaskDueHours * 3600 * 1000);
      const res = await fetch('/api/v1/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          contactPhone: newTaskPhone,
          contactName: newTaskName,
          title: newTaskTitle,
          messageTemplate: newTaskTemplate,
          dueAt
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsNewTaskModal(false);
        setNewTaskPhone('');
        setNewTaskName('');
        fetchCRMTasks(selectedSessionId);
        addLog(`Follow-up task baru dijadwalkan untuk ${newTaskPhone}`, 'success');
      } else {
        alert(data.message || 'Gagal membuat task');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApplySequence = async () => {
    if (!applySeqContact || !selectedSeqId) return;
    try {
      const res = await fetch('/api/v1/crm/sequences/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          phone: applySeqContact.phone,
          sequenceId: selectedSeqId,
          contactName: applySeqContact.name || applySeqContact.push_name
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsApplySeqModal(false);
        fetchCRMTasks(selectedSessionId);
        addLog(`Sequence berhasil diterapkan ke ${applySeqContact.phone}. Auto-stop aktif saat dibalas.`, 'success');
      } else {
        alert(data.message || 'Gagal menerapkan sequence');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateContactStage = async (phone: string, stage: 'lead' | 'prospect' | 'customer' | 'churned') => {
    try {
      await fetch(`/api/v1/contacts/${phone}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, stage })
      });
      fetchContacts(selectedSessionId);
      fetchSalesAnalytics(selectedSessionId, crmTimeRange);
      addLog(`Status pipeline kontak ${phone} diubah menjadi ${stage.toUpperCase()}`, 'info');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveContactNotes = async () => {
    if (!selectedContactForNotes) return;
    try {
      await fetch(`/api/v1/contacts/${selectedContactForNotes.phone}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, notes: contactNotesText })
      });
      setIsNotesModal(false);
      fetchContacts(selectedSessionId);
      addLog(`Catatan kontak ${selectedContactForNotes.phone} disimpan`, 'success');
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    if (selectedSessionId) {
      fetchContacts(selectedSessionId);
      fetchGroups(selectedSessionId);
      fetchChats(selectedSessionId);
      fetchTags(selectedSessionId);
      fetchCRMTasks(selectedSessionId);
      fetchCRMSequences(selectedSessionId);
      fetchSalesAnalytics(selectedSessionId, crmTimeRange);
      fetchBotConfig(selectedSessionId);
      fetchCrmAutoDispatch();
      fetchIntegrationConfigs();
      fetchOutgoingWebhooks();
      fetchIntegrationLogs();
    }
  }, [selectedSessionId, crmTimeRange]);

  useEffect(() => {
    if (selectedSessionId && activeChatJid) {
      fetchChatMessages(selectedSessionId, activeChatJid);
    }
  }, [selectedSessionId, activeChatJid]);

  // Session Handlers
  const handleCreateSession = async () => {
    if (!newSessionId.trim()) return;
    try {
      const res = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newSessionId, name: newSessionName || newSessionId })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Sesi ${newSessionId} dibuat`, 'success');
        setIsAddSessionModal(false);
        setActiveQrModal({
          open: true,
          session: {
            id: newSessionId,
            name: newSessionName || newSessionId,
            status: 'CONNECTING',
            createdAt: Date.now()
          }
        });
        // Connect immediately
        await fetch(`/api/v1/sessions/${newSessionId}/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usePairingCode: loginMethod === 'pairing',
            phoneNumber: pairingPhone
          })
        });
        setNewSessionId('');
        setNewSessionName('');
        setPairingPhone('');
        fetchSessions();
      }
    } catch (err: any) {
      alert(`Gagal membuat sesi: ${err.message}`);
    }
  };

  const handleDisconnectSession = async (id: string) => {
    await fetch(`/api/v1/sessions/${id}/disconnect`, { method: 'POST' });
    fetchSessions();
    addLog(`Sesi ${id} diputus`, 'warn');
  };

  const handleLogoutSession = async (id: string) => {
    if (!confirm(`Logout akun WhatsApp dari sesi "${id}"? Anda harus scan QR / pairing ulang untuk terhubung kembali.`)) return;
    await fetch(`/api/v1/sessions/${id}/logout`, { method: 'POST' });
    fetchSessions();
    addLog(`Sesi ${id} berhasil logout dari WhatsApp`, 'warn');
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm(`Hapus sesi ${id} dan seluruh file autentikasinya?`)) return;
    await fetch(`/api/v1/sessions/${id}`, { method: 'DELETE' });
    fetchSessions();
    addLog(`Sesi ${id} dihapus permanen`, 'warn');
  };

  const handleConnectSessionDirect = async (id: string) => {
    const s = sessions.find(item => item.id === id);
    setActiveQrModal({
      open: true,
      session: s || {
        id,
        name: id,
        status: 'CONNECTING',
        createdAt: Date.now()
      }
    });
    await fetch(`/api/v1/sessions/${id}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usePairingCode: false })
    });
    fetchSessions();
    addLog(`Menghubungkan sesi ${id}...`, 'info');
  };

  // Direct Chat Send
  const handleSendChatMessage = useCallback(async (textOverride?: string) => {
    const textToSend = (typeof textOverride === 'string' ? textOverride : chatReplyText).trim();
    if (!selectedSessionId || !activeChatJid || !textToSend) return;
    setChatReplyText('');
    try {
      const res = await fetch('/api/v1/messages/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          to: activeChatJid,
          text: textToSend
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchChatMessages(selectedSessionId, activeChatJid);
        fetchChats(selectedSessionId);
      } else {
        alert(data.message || 'Gagal mengirim pesan');
      }
    } catch (err: any) {
      alert(err.message);
    }
  }, [selectedSessionId, activeChatJid, chatReplyText]);

  const handleStartNewChat = () => {
    if (!newChatPhone.trim()) return;
    const clean = newChatPhone.replace(/[^0-9]/g, '');
    const jid = `${clean}@s.whatsapp.net`;
    setActiveChatJid(jid);
    setIsNewChatModal(false);
    setNewChatPhone('');
    if (selectedSessionId) {
      fetchChatMessages(selectedSessionId, jid);
    }
  };

  const handleOpenChatWithContact = (phone: string, name?: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const jid = `${clean}@s.whatsapp.net`;
    setActiveChatJid(jid);
    setActiveTab('chats');
    if (selectedSessionId) {
      fetchChatMessages(selectedSessionId, jid);
    }
  };

  const handleSendChatMedia = async () => {
    if (!selectedSessionId || !activeChatJid || !chatMediaFile) return;
    try {
      const fd = new FormData();
      fd.append('sessionId', selectedSessionId);
      fd.append('to', activeChatJid);
      fd.append('file', chatMediaFile);
      if (chatMediaCaption) {
        fd.append('caption', chatMediaCaption);
      }
      addLog(`Mengirim file media ke ${activeChatJid}...`, 'info');
      const res = await fetch('/api/v1/messages/media', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.success) {
        setIsSendMediaModal(false);
        setChatMediaFile(null);
        setChatMediaCaption('');
        fetchChatMessages(selectedSessionId, activeChatJid);
        fetchChats(selectedSessionId);
        addLog('Media berhasil dikirim', 'success');
      } else {
        alert(data.message || 'Gagal mengirim media');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Message Tester Handler
  const handleRunTester = async () => {
    if (!selectedSessionId) {
      alert('Pilih sesi aktif terlebih dahulu');
      return;
    }
    if (!testerRecipient.trim()) {
      alert('Masukkan nomor WhatsApp tujuan');
      return;
    }
    setTesterLoading(true);
    setTesterResponse(null);
    try {
      const cleanPhone = testerRecipient.replace(/[^0-9]/g, '');
      const toJid = `${cleanPhone}@s.whatsapp.net`;

      if (testerType === 'text') {
        const res = await fetch('/api/v1/messages/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: selectedSessionId,
            to: toJid,
            text: testerMessage
          })
        });
        const data = await res.json();
        setTesterResponse({ status: res.status, data, timestamp: new Date().toISOString() });
        if (data.success) {
          addLog(`Pesan tester terkirim ke +${cleanPhone}`, 'success');
        } else {
          addLog(`Tester gagal: ${data.message || 'Unknown error'}`, 'warn');
        }
      } else {
        if (!testerMediaFile) {
          alert('Pilih file media terlebih dahulu');
          setTesterLoading(false);
          return;
        }
        const fd = new FormData();
        fd.append('sessionId', selectedSessionId);
        fd.append('to', toJid);
        fd.append('file', testerMediaFile);
        if (testerMediaCaption) fd.append('caption', testerMediaCaption);
        const res = await fetch('/api/v1/messages/media', {
          method: 'POST',
          body: fd
        });
        const data = await res.json();
        setTesterResponse({ status: res.status, data, timestamp: new Date().toISOString() });
        if (data.success) {
          addLog(`Media tester terkirim ke +${cleanPhone}`, 'success');
        } else {
          addLog(`Tester media gagal: ${data.message || 'Unknown error'}`, 'warn');
        }
      }
    } catch (err: any) {
      setTesterResponse({ status: 500, error: err.message, timestamp: new Date().toISOString() });
    } finally {
      setTesterLoading(false);
    }
  };

  // Contacts Handlers
  const handleAddContact = async () => {
    if (!selectedSessionId || !newContactPhone.trim()) return;
    try {
      const res = await fetch('/api/v1/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          phone: newContactPhone,
          name: newContactName,
          tags: newContactTags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAddContactModal(false);
        setNewContactPhone('');
        setNewContactName('');
        fetchContacts(selectedSessionId);
        addLog(`Kontak +${newContactPhone} ditambahkan`, 'success');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleOptOut = async (phone: string, currentStatus: boolean) => {
    if (!selectedSessionId) return;
    try {
      const res = await fetch(`/api/v1/contacts/${phone}/opt-out?sessionId=${selectedSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optOut: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchContacts(selectedSessionId);
        addLog(`Status opt-out +${phone} diubah menjadi ${!currentStatus ? 'Opt-Out' : 'Aktif'}`, 'info');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteContact = async (phone: string) => {
    if (!selectedSessionId) return;
    if (!confirm(`Hapus kontak +${phone} dari database?`)) return;
    try {
      const res = await fetch(`/api/v1/contacts/${phone}?sessionId=${selectedSessionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchContacts(selectedSessionId);
        addLog(`Kontak +${phone} dihapus`, 'info');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleImportGroupToContacts = async (jid: string) => {
    if (!selectedSessionId) return;
    if (!confirm(`Import seluruh anggota grup ke database kontak audiens?`)) return;
    try {
      const res = await fetch('/api/v1/groups/import-to-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, jid })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchContacts(selectedSessionId);
        addLog(data.message, 'success');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openEditTagsModal = (contact: Contact) => {
    setEditingContactPhone(contact.phone);
    setEditingContactName(contact.name || contact.push_name || formatPhoneForDisplay(contact.phone) || contact.phone);
    setEditingContactTags(contact.tags.join(', '));
    setIsEditContactTagsModal(true);
  };

  const handleSaveContactTags = async () => {
    if (!selectedSessionId || !editingContactPhone) return;
    const parsedTags = editingContactTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/v1/contacts/${editingContactPhone}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          tags: parsedTags
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsEditContactTagsModal(false);
        fetchContacts(selectedSessionId);
        fetchTags(selectedSessionId);
        addLog(`Group kontak +${editingContactPhone} disimpan: [${parsedTags.join(', ')}]`, 'success');
      } else {
        alert(data.message || 'Gagal memperbarui group kontak');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFillRecipientsFromGroup = async () => {
    if (!selectedSessionId) return;
    try {
      const res = await fetch(`/api/v1/contacts/by-tag?sessionId=${selectedSessionId}&tag=${encodeURIComponent(campSelectedTag)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const activeContacts = data.data.filter((c: any) => !c.opt_out);
        const lines = activeContacts.map((c: any) => `${c.phone},${c.name || c.push_name || ''}`);
        setCampRecipientsRaw(lines.join('\n'));
        setCampAudienceMode('manual');
        addLog(`Berhasil memuat ${activeContacts.length} kontak dari group "${campSelectedTag}" ke editor teks`, 'info');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Campaigns Handlers
  const handleCreateCampaign = async () => {
    if (!selectedSessionId || !campName.trim()) return;

    let recipients: Array<{ phone: string; name?: string; customVars: any }> = [];

    if (campAudienceMode === 'group') {
      try {
        const res = await fetch(`/api/v1/contacts/by-tag?sessionId=${selectedSessionId}&tag=${encodeURIComponent(campSelectedTag)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          recipients = data.data
            .filter((c: any) => !c.opt_out)
            .map((c: any) => ({
              phone: c.phone,
              name: c.name || c.push_name || '',
              customVars: {}
            }));
        }
      } catch (err: any) {
        alert('Gagal mengambil kontak audiens grup: ' + err.message);
        return;
      }
    } else {
      if (!campRecipientsRaw.trim()) {
        alert('Daftar nomor penerima tidak boleh kosong!');
        return;
      }
      const lines = campRecipientsRaw.split('\n');
      recipients = lines
        .map(line => {
          const parts = line.split(',');
          const phone = parts[0]?.trim();
          const name = parts[1]?.trim();
          if (!phone) return null;
          return { phone, name, customVars: {} };
        })
        .filter(Boolean) as any[];
    }

    if (recipients.length === 0) {
      alert(campAudienceMode === 'group'
        ? `Tidak ditemukan kontak aktif (non opt-out) dalam group "${campSelectedTag === 'ALL' ? 'Semua Kontak' : campSelectedTag}". Silakan tambahkan kontak ke group ini terlebih dahulu.`
        : 'Daftar nomor penerima tidak boleh kosong!');
      return;
    }

    try {
      const res = await fetch('/api/v1/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          name: campName,
          templateText: campTemplate,
          recipients,
          settings: {
            randomDelayMinSeconds: campRandomDelayMin,
            randomDelayMaxSeconds: campRandomDelayMax
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsNewCampaignModal(false);
        setCampName('');
        setCampRecipientsRaw('');
        fetchCampaigns();
        addLog(`Broadcast "${campName}" berhasil dibuat dengan ${recipients.length} penerima`, 'success');
      } else {
        alert(data.message || 'Gagal membuat broadcast');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartCampaign = async (id: string) => {
    await fetch(`/api/v1/campaigns/${id}/start`, { method: 'POST' });
    fetchCampaigns();
    addLog(`Broadcast ${id} dijalankan`, 'success');
  };

  const handlePauseCampaign = async (id: string) => {
    await fetch(`/api/v1/campaigns/${id}/pause`, { method: 'POST' });
    fetchCampaigns();
    addLog(`Broadcast ${id} dijeda`, 'warn');
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Hapus campaign broadcast ini beserta antreannya?')) return;
    await fetch(`/api/v1/campaigns/${id}`, { method: 'DELETE' });
    fetchCampaigns();
    addLog(`Broadcast ${id} dihapus`, 'info');
  };

  const handleViewRecipients = async (id: string, title: string) => {
    setViewCampaignTitle(title);
    setIsViewRecipientsModal(true);
    try {
      const res = await fetch(`/api/v1/campaigns/${id}/recipients`);
      const data = await res.json();
      if (data.success) {
        setViewRecipientsList(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Automation Handlers
  const handleToggleRule = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/v1/automation/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      });
      const data = await res.json();
      if (data.success) {
        fetchRules();
        addLog(`Rule "${id}" ${!currentActive ? 'diaktifkan' : 'dinonaktifkan'}`, 'info');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateRule = async () => {
    if (!ruleName.trim() || !ruleTriggerText.trim()) return;
    try {
      const actions: any[] = [];
      if (ruleReplyText.trim()) {
        actions.push({ type: 'reply_text', text: ruleReplyText });
      }
      if (ruleAddTagEnabled && ruleActionTag) {
        actions.push({ type: 'add_tag', tag: ruleActionTag });
      }
      if (ruleSetStageEnabled && ruleActionStage) {
        actions.push({ type: 'set_stage', stage: ruleActionStage });
      }
      if (actions.length === 0) {
        actions.push({ type: 'reply_text', text: ruleReplyText });
      }

      const res = await fetch('/api/v1/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ruleName,
          conditions: [{ field: 'text', operator: ruleOperator, value: ruleTriggerText }],
          actions
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsNewRuleModal(false);
        setRuleName('');
        setRuleTriggerText('');
        setRuleAddTagEnabled(false);
        setRuleSetStageEnabled(false);
        fetchRules();
        addLog(`Rule "${ruleName}" berhasil disimpan`, 'success');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveEditRule = async () => {
    if (!editRuleId || !editRuleName.trim() || !editRuleTriggerText.trim()) return;
    try {
      const actions: any[] = [];
      if (editRuleReplyText.trim()) {
        actions.push({ type: 'reply_text', text: editRuleReplyText });
      }
      if (editRuleAddTagEnabled && editRuleActionTag) {
        actions.push({ type: 'add_tag', tag: editRuleActionTag });
      }
      if (editRuleSetStageEnabled && editRuleActionStage) {
        actions.push({ type: 'set_stage', stage: editRuleActionStage });
      }
      if (actions.length === 0) {
        actions.push({ type: 'reply_text', text: editRuleReplyText });
      }

      const res = await fetch(`/api/v1/automation/${editRuleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editRuleName,
          conditions: [{ field: 'text', operator: editRuleOperator, value: editRuleTriggerText }],
          actions
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsEditRuleModal(false);
        fetchRules();
        addLog(`Rule "${editRuleName}" diperbarui`, 'success');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Hapus aturan auto-responder ini?')) return;
    await fetch(`/api/v1/automation/${id}`, { method: 'DELETE' });
    fetchRules();
    addLog(`Rule dihapus`, 'info');
  };

  // Rule Tester Evaluation
  useEffect(() => {
    if (!simTestInput.trim()) {
      setSimMatchedRule(null);
      setSimEvaluatedReply('');
      return;
    }
    const inputLower = simTestInput.trim().toLowerCase();
    const match = rules.find(r => {
      if (!r.is_active) return false;
      return r.conditions.some(c => {
        const val = c.value.toLowerCase();
        if (c.operator === 'equals') return inputLower === val;
        if (c.operator === 'starts_with') return inputLower.startsWith(val);
        if (c.operator === 'regex') {
          try {
            return new RegExp(c.value, 'i').test(simTestInput);
          } catch {
            return false;
          }
        }
        return inputLower.includes(val);
      });
    });

    setSimMatchedRule(match || null);
    if (match) {
      const action = match.actions.find(a => a.type === 'reply_text' || a.type === 'send_text');
      setSimEvaluatedReply(action?.text ? previewTemplate(action.text, 'Klien Uji Coba') : '');
    } else {
      setSimEvaluatedReply('');
    }
  }, [simTestInput, rules]);

  // System Backup Handler
  const handleCreateBackup = async () => {
    try {
      addLog('Membuat cadangan data portable...', 'info');
      const res = await fetch('/api/v1/system/backups/create', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchBackups();
        addLog(`Cadangan berhasil dibuat: ${data.data.fileName}`, 'success');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const activeSession = sessions.find(s => s.id === selectedSessionId) || sessions[0] || null;
  const isGlobalConnected = sessions.some(s => s.status === 'CONNECTED');

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'sessions', label: t.nav.sessions, icon: Smartphone },
    { id: 'chats', label: t.nav.chats, icon: MessageSquare },
    { id: 'crm', label: t.nav.crm, icon: Zap },
    { id: 'contacts', label: t.nav.contacts, icon: Users },
    { id: 'groups', label: t.nav.groups, icon: Layers },
    { id: 'campaigns', label: t.nav.campaigns, icon: Radio },
    { id: 'tester', label: t.nav.tester, icon: Send },
    { id: 'automation', label: t.nav.automation, icon: ClipboardList },
    { id: 'integrations', label: t.nav.integrations, icon: Webhook },
    { id: 'infrastructure', label: t.nav.infrastructure, icon: Server },
    { id: 'logs', label: t.nav.logs, icon: FileText }
  ];

  return (
    <div className={`layout ${privacyMode ? 'privacy-active' : ''}`}>
      {/* Mobile Top Header */}
      {isMobile && (
        <header className="mobile-header">
          <button className="btn-icon" onClick={() => setIsMobileOpen(!isMobileOpen)} aria-label="Toggle Navigation">
            {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <img src="/whatsaman_logo.webp" alt="WhatsAman Logo" className="w-6 h-6 object-contain" onError={e => { e.currentTarget.src = '/whatsaman.svg'; }} />
            <span className="font-extrabold text-base tracking-tight text-slate-900">WhatsAman</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="btn-icon"
              onClick={toggleLanguage}
              title={lang === 'id' ? 'Switch to English' : 'Ubah ke Bahasa Indonesia'}
            >
              <Globe size={18} />
            </button>
            <button
              className={`btn-icon ${privacyMode ? 'text-rose-500' : ''}`}
              onClick={() => {
                setPrivacyMode(prev => {
                  const next = !prev;
                  localStorage.setItem('whatsaman_privacy', String(next));
                  return next;
                });
              }}
              title="Toggle Privacy Blur (Alt + P)"
            >
              <Eye size={18} />
            </button>
            <button className="btn-icon" onClick={toggleTheme} aria-label="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)} />}

      {/* WhatsAman Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile ? (isMobileOpen ? 'open' : '') : ''}`}>
        <div className="sidebar-header">
          <img
            src="/whatsaman_logo.webp"
            alt="WhatsAman"
            className="sidebar-logo"
            onError={e => {
              e.currentTarget.src = '/whatsaman.svg';
            }}
          />
          {!isCollapsed && (
            <div className="sidebar-brand">
              <span className="brand-name">
                WhatsAman
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              </span>
              <span className="brand-version">v{systemStatus?.version || '1.0.0'}</span>
              <span className="brand-badge">Gateway Ready</span>
            </div>
          )}
        </div>

        {/* Floating Circular Collapse Toggle */}
        {!isMobile && (
          <button
            className="collapse-toggle"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Perluas Menu' : 'Ciutkan Menu'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}

        {/* Sidebar Nav Items */}
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  if (isMobile) setIsMobileOpen(false);
                }}
                className={`nav-item ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={19} className="flex-shrink-0" />
                {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Theme & System Status */}
        <div className="sidebar-footer">
          {/* Quick Active Session Select */}
          {!isCollapsed && sessions.length > 0 && (
            <div className="mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Active Session</label>
              <select
                value={selectedSessionId}
                onChange={e => setSelectedSessionId(e.target.value)}
                className="w-full text-xs font-semibold py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* AMAN CHAT Pro: Privacy Blur Toggle Button */}
          <button
            className={`theme-toggle-btn ${privacyMode ? 'text-rose-600 font-bold border-rose-300' : ''}`}
            onClick={() => {
              setPrivacyMode(prev => {
                const next = !prev;
                localStorage.setItem('whatsaman_privacy', String(next));
                addLog(`Mode Privasi ${next ? 'Aktif' : 'Nonaktif'} (Alt + P)`, next ? 'info' : 'warn');
                return next;
              });
            }}
            title="Sembunyikan/Blur Kontak & Chat di Tempat Umum (Shortcut: Alt + P)"
          >
            <Eye size={17} className={privacyMode ? 'text-rose-500' : ''} />
            {!isCollapsed && (
              <span className="text-xs font-medium">
                {privacyMode ? 'Privasi: ON (Alt+P)' : 'Mode Privasi (Alt+P)'}
              </span>
            )}
          </button>

          {/* Language Switcher Button */}
          <button
            className="theme-toggle-btn"
            onClick={toggleLanguage}
            title={lang === 'id' ? 'Ganti Bahasa ke English (Switch to English)' : 'Switch Language to Bahasa Indonesia'}
          >
            <Globe size={17} className="text-blue-600" />
            {!isCollapsed && (
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                {lang === 'id' ? '🇮🇩 ID (Indonesia)' : '🇬🇧 EN (English)'}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Ganti Mode Tampilan (Terang / Gelap)">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            {!isCollapsed && <span className="text-xs font-medium">{theme === 'dark' ? t.common.lightTheme : t.common.darkTheme}</span>}
          </button>

          {/* Core Status Pill */}
          {!isCollapsed && (
            <div className="flex items-center justify-between pt-1 px-1 text-[11px] text-slate-400 font-medium">
              <span>Core Service</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${isGlobalConnected ? 'text-emerald-600' : 'text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isGlobalConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {isGlobalConnected ? 'Online' : 'Standby'}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Main View Area */}
      <main className={`main-content ${isCollapsed ? 'expanded' : ''} p-6 sm:p-8`}>
        {/* ==================== 1. DASHBOARD OVERVIEW ==================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <header className="page-header">
              <div className="page-header__title-group">
                <h1>{t.dashboard.title}</h1>
                <span className={`status-badge ${isGlobalConnected ? 'connected' : 'disconnected'}`}>
                  {isGlobalConnected ? t.common.connected : t.common.disconnected}
                </span>
              </div>
              <div className="page-header__actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    await fetchSessions();
                    await fetchSystemStatus();
                    if (selectedSessionId) await fetchChats(selectedSessionId);
                  }}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Refresh Dashboard"
                >
                  <RefreshCw size={15} />
                  <span>{t.common.refresh}</span>
                </button>
                <button onClick={() => setIsAddSessionModal(true)} className="btn-primary">
                  <Plus size={16} />
                  <span>{t.dashboard.newSession}</span>
                </button>
              </div>
              <p className="page-header__subtitle">{t.dashboard.subtitle}</p>
            </header>

            {/* WhatsAman 4-Card Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <MessageSquare className="stat-watermark" />
                <div className="stat-header">
                  <span className="stat-label">{t.dashboard.activeSessions}</span>
                  <Smartphone size={20} className="stat-icon" />
                </div>
                <div className="stat-value">{sessions.filter(s => s.status === 'CONNECTED').length}</div>
                <div className="stat-detail">
                  {sessions.filter(s => s.status === 'CONNECTED').length} {t.dashboard.runningOf} {sessions.length} registered
                </div>
              </div>

              <div className="stat-card">
                <Send className="stat-watermark" />
                <div className="stat-header">
                  <span className="stat-label">{t.dashboard.broadcastSent}</span>
                  <Send size={20} className="stat-icon" />
                </div>
                <div className="stat-value">{campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0)}</div>
                <div className="stat-detail">{campaigns.length} {t.campaigns.totalCampaigns.toLowerCase()}</div>
              </div>

              <div className="stat-card">
                <Users className="stat-watermark" />
                <div className="stat-header">
                  <span className="stat-label">{t.dashboard.totalContacts}</span>
                  <Users size={20} className="stat-icon" />
                </div>
                <div className="stat-value">{contacts.length}</div>
                <div className="stat-detail">{contacts.filter(c => !c.opt_out).length} active opted-in</div>
              </div>

              <div className="stat-card">
                <Activity className="stat-watermark" />
                <div className="stat-header">
                  <span className="stat-label">{t.dashboard.systemHealth}</span>
                  <Server size={20} className="stat-icon" />
                </div>
                <div className="stat-value">{systemStatus ? `${systemStatus.memory.heapUsedMb} MB` : '—'}</div>
                <div className="stat-detail">Portable Mode: {systemStatus?.isPortable ? 'Enabled' : 'Standard'}</div>
              </div>
            </div>

            {/* AMAN CHAT Pro: Sales CRM & Conversion Funnel Analytics */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t.crm.title}</h2>
                    <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Pro Analytics
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.crm.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Time Range Selector */}
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900 text-xs">
                    {(['today', '7d', '30d', '90d', 'all'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setCrmTimeRange(r);
                          fetchSalesAnalytics(selectedSessionId, r);
                        }}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                          crmTimeRange === r
                            ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {r === 'today' ? t.crm.timeRangeToday : r === '7d' ? t.crm.timeRange7d : r === '30d' ? t.crm.timeRange30d : r === '90d' ? '90 Days' : t.crm.timeRangeAll}
                      </button>
                    ))}
                  </div>

                  {/* Export CSV Button */}
                  <a
                    href={`/api/v1/crm/export-csv?sessionId=${selectedSessionId}`}
                    download
                    className="btn-secondary btn-sm flex items-center gap-1.5"
                    title="Export CSV"
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </a>
                </div>
              </div>

              {/* 8-Card Sales Funnel Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="crm-stat-card">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.crm.totalLeads}</div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{crmAnalytics?.totalLeads ?? contacts.length}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{t.contacts.totalContacts}</div>
                </div>

                <div className="crm-stat-card">
                  <div className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">New Leads</div>
                  <div className="text-2xl font-extrabold text-sky-700 dark:text-sky-400 mt-1">{crmAnalytics?.newLeads ?? 0}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Pipeline Leads</div>
                </div>

                <div className="crm-stat-card">
                  <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Hot Leads 🔥</div>
                  <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">{crmAnalytics?.hotLeads ?? 0}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">High Priority</div>
                </div>

                <div className="crm-stat-card">
                  <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">{t.crm.customer} (💰)</div>
                  <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">{crmAnalytics?.convertedCustomers ?? 0}</div>
                  <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">Converted</div>
                </div>

                <div className="crm-stat-card">
                  <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">{t.crm.conversionRate}</div>
                  <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">{crmAnalytics?.conversionRate ?? 0}%</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Customer / Leads</div>
                </div>

                <div className="crm-stat-card">
                  <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">{t.crm.pendingTasks}</div>
                  <div className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 mt-1">{crmAnalytics?.followUpDue ?? 0}</div>
                  <div className="text-[11px] text-rose-500 mt-0.5 font-semibold">Due Follow-ups</div>
                </div>

                <div className="crm-stat-card">
                  <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Follow-up Done</div>
                  <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-1">{crmAnalytics?.followUpCompleted ?? 0}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Tasks Completed</div>
                </div>

                <div className="crm-stat-card">
                  <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Reply Rate</div>
                  <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-400 mt-1">{crmAnalytics?.replyRate ?? 0}%</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Inbound / Outbound</div>
                </div>
              </div>
            </div>

            {/* Sessions Overview Table */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{t.sessions.title}</h2>
                  <p className="text-xs text-slate-500">{t.sessions.subtitle}</p>
                </div>
                <button onClick={() => setActiveTab('sessions')} className="btn-secondary btn-sm">
                  <span>{t.common.actions}</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="keys-table-container">
                <table className="keys-table">
                  <thead>
                    <tr className="table-row header">
                      <th>SESSION ID</th>
                      <th>{t.sessions.phoneLabel.toUpperCase()}</th>
                      <th>{t.common.status.toUpperCase()}</th>
                      <th>{t.sessions.lastConnected.toUpperCase()}</th>
                      <th style={{ textAlign: 'right' }}>{t.common.actions.toUpperCase()}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <div className="p-8 text-center text-slate-400 text-sm">
                            {t.sessions.noSessions}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sessions.map(s => (
                        <tr key={s.id} className="table-row">
                          <td>
                            <span className="mono font-semibold text-slate-900 text-xs px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                              {s.id}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2.5">
                              {s.status === 'CONNECTED' ? (
                                <ChatAvatar
                                  sessionId={s.id}
                                  jid={s.phoneNumber ? `${s.phoneNumber}@s.whatsapp.net` : undefined}
                                  name={s.name}
                                  className="chat-avatar"
                                  size={14}
                                  style={{ width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }}
                                />
                              ) : (
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
                                  <Smartphone size={16} />
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-slate-800 text-xs truncate">{s.name}</span>
                                <span className="text-[11px] text-slate-400 mono">+{s.phoneNumber || 'Unpaired'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-pill ${s.status.toLowerCase()}`}>
                              {s.status === 'CONNECTED' ? t.common.online : s.status.toLowerCase().replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <span className="text-xs text-slate-500 font-medium">
                              {s.lastConnectedAt ? new Date(s.lastConnectedAt).toLocaleTimeString() : '—'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedSessionId(s.id);
                                  setActiveTab('sessions');
                                }}
                                className="btn-secondary btn-sm"
                              >
                                {t.chats.tabChats}
                              </button>
                              {s.status === 'CONNECTED' ? (
                                <button onClick={() => handleDisconnectSession(s.id)} className="btn-danger btn-sm">
                                  {t.sessions.disconnectSession}
                                </button>
                              ) : (
                                <button onClick={() => handleConnectSessionDirect(s.id)} className="btn-primary btn-sm">
                                  {t.sessions.connectSession}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Quick Actions & Recent Live Log Activity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Zap size={16} className="text-emerald-600" />
                  <span>{t.dashboard.testMessaging}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {t.tester.subtitle}
                </p>
                <button onClick={() => setActiveTab('tester')} className="btn-secondary w-full text-xs">
                  <span>{t.tester.title}</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-600" />
                  <span>{t.chats.title}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {t.chats.subtitle}
                </p>
                <button onClick={() => setActiveTab('chats')} className="btn-secondary w-full text-xs">
                  <span>{t.chats.title}</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Bot size={16} className="text-indigo-600" />
                  <span>{t.automation.title}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {t.automation.subtitle}
                </p>
                <button onClick={() => setActiveTab('automation')} className="btn-secondary w-full text-xs">
                  <span>{t.automation.title}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. SESSIONS PAGE ==================== */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <header className="page-header">
              <div className="page-header__title-group">
                <h1>{t.sessions.title}</h1>
                <span className="status-badge connected">{sessions.length} {t.common.active}</span>
              </div>
              <div className="page-header__actions">
                <button onClick={() => setIsAddSessionModal(true)} className="btn-primary">
                  <Plus size={16} />
                  <span>{t.sessions.newSession}</span>
                </button>
              </div>
              <p className="page-header__subtitle">{t.sessions.subtitle}</p>
            </header>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.common.search}
                  value={sessionSearchQuery}
                  onChange={e => setSessionSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-medium">{t.common.status}:</span>
                <select
                  value={sessionStatusFilter}
                  onChange={e => setSessionStatusFilter(e.target.value)}
                  className="text-xs font-semibold py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="ALL">{t.common.all}</option>
                  <option value="CONNECTED">{t.common.connected}</option>
                  <option value="QR_READY">{t.common.qrReady}</option>
                  <option value="DISCONNECTED">{t.common.disconnected}</option>
                </select>
              </div>
            </div>

            {/* Sessions Cards Grid */}
            <div className="sessions-grid">
              {sessions.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
                  <Smartphone size={40} className="mx-auto text-slate-300" />
                  <h3 className="font-semibold text-slate-700">{t.sessions.noSessions}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {t.sessions.subtitle}
                  </p>
                  <button onClick={() => setIsAddSessionModal(true)} className="btn-primary mt-2">
                    <Plus size={16} />
                    <span>{t.sessions.newSession}</span>
                  </button>
                </div>
              ) : (
                sessions
                  .filter(s => {
                    const matchText = `${s.id} ${s.name} ${s.phoneNumber || ''}`.toLowerCase().includes(sessionSearchQuery.toLowerCase());
                    const matchStatus = sessionStatusFilter === 'ALL' || s.status === sessionStatusFilter;
                    return matchText && matchStatus;
                  })
                  .map(s => (
                    <div key={s.id} className="session-card">
                      <div className="card-header">
                        <div className="flex items-center gap-3 min-w-0">
                          {s.status === 'CONNECTED' ? (
                            <ChatAvatar
                              sessionId={s.id}
                              jid={s.phoneNumber ? `${s.phoneNumber}@s.whatsapp.net` : undefined}
                              name={s.name}
                              className="chat-avatar"
                              size={16}
                              style={{ width: '38px', height: '38px', fontSize: '0.85rem', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
                              <Smartphone size={18} />
                            </div>
                          )}
                          <h3 title={s.name}>{s.name}</h3>
                        </div>
                        <span className={`status-pill ${s.status.toLowerCase()}`}>
                          {s.status === 'CONNECTED' ? t.common.online : s.status.toLowerCase().replace('_', ' ')}
                        </span>
                      </div>

                      {/* QR Preview box if waiting for QR */}
                      {s.status === 'QR_READY' && s.qrCode && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center mb-4">
                          <img src={s.qrCode} alt="Scan QR" className="w-44 h-44 mx-auto rounded-lg shadow-sm border border-slate-200" />
                          <p className="text-xs font-semibold text-slate-700 mt-2">{t.sessions.scanQrTitle}</p>
                          <p className="text-[11px] text-slate-400">{t.sessions.scanQrDesc}</p>
                        </div>
                      )}

                      {/* Pairing Code Display box if waiting for Pairing */}
                      {s.status === 'PAIRING_READY' && s.pairingCode && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">{t.sessions.pairingCodeTitle}</span>
                          <div className="text-2xl font-black mono text-emerald-900 tracking-widest my-2 select-all">
                            {s.pairingCode}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(s.pairingCode || '');
                              setCopiedPairingCode(true);
                              setTimeout(() => setCopiedPairingCode(false), 2000);
                            }}
                            className="btn-sm bg-white text-emerald-800 border-emerald-300 mx-auto"
                          >
                            {copiedPairingCode ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copiedPairingCode ? t.common.copied : t.common.copy}</span>
                          </button>
                        </div>
                      )}

                      <div className="session-info">
                        <div className="info-row">
                          <span className="info-label">ENGINE</span>
                          <span className="info-value">Baileys (MultiDevice)</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">{t.sessions.phoneLabel.toUpperCase()}</span>
                          <span className="info-value mono">{s.phoneNumber ? formatPhoneForDisplay(s.phoneNumber) : 'Unpaired'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">SESSION ID</span>
                          <span className="info-value mono text-xs">{s.id}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">{t.sessions.lastConnected.toUpperCase()}</span>
                          <span className="info-value">
                            {s.lastConnectedAt ? new Date(s.lastConnectedAt).toLocaleTimeString() : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button
                          onClick={() => setActiveQrModal({ open: true, session: s })}
                          className="btn-action"
                          title="QR / Pairing"
                        >
                          <QrCode size={14} />
                          <span>QR / Pair</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedSessionId(s.id);
                            setActiveTab('chats');
                          }}
                          className="btn-action"
                          title={t.chats.title}
                        >
                          <MessageSquare size={14} />
                          <span>{t.chats.tabChats}</span>
                        </button>

                        {s.status === 'CONNECTED' ? (
                          <>
                            <button
                              onClick={() => handleDisconnectSession(s.id)}
                              className="btn-action danger"
                              title={t.sessions.disconnectSession}
                            >
                              <Pause size={14} />
                              <span>{t.sessions.disconnectSession}</span>
                            </button>
                            <button
                              onClick={() => handleLogoutSession(s.id)}
                              className="btn-action danger"
                              title={t.sessions.logoutSession}
                            >
                              <LogOut size={14} />
                              <span>{t.sessions.logoutSession}</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              setConnectOptionModal({
                                open: true,
                                sessionId: s.id,
                                method: 'qr',
                                phone: s.phoneNumber || ''
                              })
                            }
                            className="btn-action"
                            title={t.sessions.connectSession}
                          >
                            <Play size={14} />
                            <span>{t.sessions.connectSession}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="btn-action danger ml-auto"
                          title={t.sessions.deleteSession}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* ==================== 3. CHATS (WHATSAMAN INBOX) ==================== */}
        {activeTab === 'chats' && (
          <div className="chats-page">
            <header className="page-header">
              <div className="page-header__title-group">
                <h1>{t.chats.title}</h1>
                <span className="status-badge connected">{chats.length} {t.chats.activeChats}</span>
              </div>
              <div className="page-header__actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Auto Reply Quick Status & Config Pill */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: botConfig.autoReplyEnabled !== false ? '#ecfdf5' : '#f8fafc',
                  border: `1px solid ${botConfig.autoReplyEnabled !== false ? '#a7f3d0' : '#e2e8f0'}`,
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  <Bot size={15} style={{ color: botConfig.autoReplyEnabled !== false ? '#059669' : '#94a3b8' }} />
                  <span style={{ color: botConfig.autoReplyEnabled !== false ? '#065f46' : '#64748b' }}>
                    {t.chats.autoReply}: <strong>{botConfig.autoReplyEnabled !== false ? t.chats.autoReplyOn : t.chats.autoReplyOff}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleAutoReplyGlobal(botConfig.autoReplyEnabled === false)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                    title={t.chats.toggleAutoReply}
                  >
                    {botConfig.autoReplyEnabled !== false ? (
                      <ToggleRight size={22} style={{ color: '#10b981' }} />
                    ) : (
                      <ToggleLeft size={22} style={{ color: '#94a3b8' }} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChatAutoReplyModal(true)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#475569', padding: '2px', display: 'flex', alignItems: 'center' }}
                    title="Auto Reply Settings"
                  >
                    <Settings size={14} />
                  </button>
                </div>

                {/* Manual Refresh Button */}
                <button
                  type="button"
                  onClick={handleManualRefreshChats}
                  disabled={isRefreshingChats}
                  className="btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: refreshSuccess ? '#ecfdf5' : '#ffffff',
                    color: refreshSuccess ? '#059669' : '#334155',
                    borderColor: refreshSuccess ? '#a7f3d0' : '#cbd5e1',
                    fontWeight: 600,
                    cursor: isRefreshingChats ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title={t.chats.refreshChat}
                >
                  <RefreshCw size={15} className={isRefreshingChats ? 'animate-spin' : ''} />
                  <span>{isRefreshingChats ? t.common.refreshing : refreshSuccess ? t.common.synced : t.chats.refreshChat}</span>
                </button>

                {/* Broadcast Button */}
                <button
                  type="button"
                  onClick={() => {
                    setChatBroadcastSessionId(selectedSessionId);
                    setIsChatBroadcastModal(true);
                  }}
                  className="btn-secondary"
                  style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={15} />
                  <span>{t.chats.sendBroadcast}</span>
                </button>

                <button onClick={() => setIsNewChatModal(true)} className="btn-primary">
                  <Plus size={16} />
                  <span>{t.chats.newChat}</span>
                </button>
              </div>
              <p className="page-header__subtitle">{t.chats.subtitle}</p>
            </header>

            <div className="chats-layout">
              {/* Left Column: WhatsAman Sidebar (320px) */}
              <aside className="chats-sidebar">
                <div className="sidebar-header-box">
                  {/* Session Selector */}
                  <div className="session-select-group">
                    <label className="form-label" htmlFor="chat-session-select">
                      {t.common.session}
                    </label>
                    <select
                      id="chat-session-select"
                      value={selectedSessionId}
                      onChange={e => setSelectedSessionId(e.target.value)}
                      className="session-selector"
                    >
                      {sessions.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Segmented control: Chats | Contacts | Groups | Channels */}
                  <div className="chats-tabs" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={chatsSidebarTab === 'chats'}
                      className={`chats-tab ${chatsSidebarTab === 'chats' ? 'active' : ''}`}
                      onClick={() => setChatsSidebarTab('chats')}
                    >
                      {t.chats.tabChats} ({chats.filter(c => !c.chat_jid.endsWith('@newsletter')).length})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={chatsSidebarTab === 'contacts'}
                      className={`chats-tab ${chatsSidebarTab === 'contacts' ? 'active' : ''}`}
                      onClick={() => setChatsSidebarTab('contacts')}
                    >
                      {t.chats.tabContacts} ({contacts.length})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={chatsSidebarTab === 'groups'}
                      className={`chats-tab ${chatsSidebarTab === 'groups' ? 'active' : ''}`}
                      onClick={() => setChatsSidebarTab('groups')}
                    >
                      {t.chats.tabGroups} ({groups.length})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={chatsSidebarTab === 'channels'}
                      className={`chats-tab ${chatsSidebarTab === 'channels' ? 'active' : ''}`}
                      onClick={() => setChatsSidebarTab('channels')}
                    >
                      {t.chats.tabChannels} ({chats.filter(c => c.chat_jid.endsWith('@newsletter')).length})
                    </button>
                  </div>

                  {/* Search Input & Quick Refresh */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="chat-search-input" style={{ flex: 1 }}>
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder={
                          chatsSidebarTab === 'chats'
                            ? t.chats.searchChats
                            : chatsSidebarTab === 'contacts'
                            ? t.chats.searchContacts
                            : chatsSidebarTab === 'groups'
                            ? t.chats.searchGroups
                            : t.chats.searchChannels
                        }
                        value={chatSearchQuery}
                        onChange={e => setChatSearchQuery(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleManualRefreshChats}
                      disabled={isRefreshingChats}
                      style={{
                        padding: '0.45rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border, #e2e8f0)',
                        backgroundColor: '#ffffff',
                        cursor: isRefreshingChats ? 'not-allowed' : 'pointer',
                        color: isRefreshingChats ? '#2563eb' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                      title={t.chats.refreshChat}
                    >
                      <RefreshCw size={15} className={isRefreshingChats ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {chatsSidebarTab === 'chats' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderBottom: '1px solid var(--border-color, #e2e8f0)', overflowX: 'auto', fontSize: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setChatFilter('all')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: chatFilter === 'all' ? '#10b981' : '#f1f5f9',
                          color: chatFilter === 'all' ? '#ffffff' : '#64748b',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {t.chats.filterAll} ({chats.filter(c => !c.chat_jid.includes('broadcast')).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setChatFilter('personal')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: chatFilter === 'personal' ? '#10b981' : '#f1f5f9',
                          color: chatFilter === 'personal' ? '#ffffff' : '#64748b',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {t.chats.filterPersonal} ({chats.filter(c => !c.chat_jid.endsWith('@g.us') && !c.chat_jid.endsWith('@newsletter') && !c.chat_jid.includes('broadcast')).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setChatFilter('groups')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: chatFilter === 'groups' ? '#10b981' : '#f1f5f9',
                          color: chatFilter === 'groups' ? '#ffffff' : '#64748b',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {t.chats.filterGroups} ({chats.filter(c => c.chat_jid.endsWith('@g.us')).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setChatFilter('channels')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: chatFilter === 'channels' ? '#10b981' : '#f1f5f9',
                          color: chatFilter === 'channels' ? '#ffffff' : '#64748b',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {t.chats.filterChannels} ({chats.filter(c => c.chat_jid.endsWith('@newsletter')).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setChatFilter('unread')}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: chatFilter === 'unread' ? '#10b981' : '#f1f5f9',
                          color: chatFilter === 'unread' ? '#ffffff' : '#64748b',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {t.chats.filterUnread} ({unreadChatsCount})
                      </button>
                    </div>
                  )}
                </div>

                {/* List Container */}
                <div className="chats-list">
                  {chatsSidebarTab === 'chats' && (
                    <>
                      {filteredChats.length === 0 ? (
                        <div className="empty-table-state" style={{ padding: '3rem 1.5rem' }}>
                          <MessageSquare size={36} />
                          <h3>No conversations yet</h3>
                          <p>Click "New Chat" or switch to "Contacts" to start messaging.</p>
                        </div>
                      ) : (
                        filteredChats.map(c => {
                          const isActive = activeChatJid === c.chat_jid;
                          const isGroup = c.chat_jid.endsWith('@g.us');
                          const isNewsletter = c.chat_jid.endsWith('@newsletter');
                          const groupMatch = isGroup ? groupsMap.get(c.chat_jid) : null;
                          const currentSession = sessions.find(s => s.id === selectedSessionId);
                          const isSelf = Boolean(
                            (c.resolved_phone && currentSession?.phoneNumber && c.resolved_phone === currentSession.phoneNumber) ||
                            (currentSession?.phoneNumber && c.chat_jid.startsWith(currentSession.phoneNumber))
                          );
                          const phoneDisplay = c.resolved_phone ? formatPhoneForDisplay(c.resolved_phone) : formatPhoneForDisplay(c.chat_jid);
                          const matchedContact = (c.resolved_phone ? contactsMap.get(c.resolved_phone) : null) || contactsMap.get(c.chat_jid);
                          const displayName = isSelf 
                            ? 'Anda (Catatan Anda)'
                            : (
                                groupMatch?.name || 
                                matchedContact?.name || 
                                (c.name && !c.name.includes('@') && !/^\d+$/.test(c.name) ? c.name : null) || 
                                matchedContact?.push_name || 
                                c.push_name || 
                                phoneDisplay || 
                                c.chat_jid
                              );
                          return (
                            <div
                              key={c.chat_jid}
                              role="button"
                              tabIndex={0}
                              className={`chat-item-card ${isActive ? 'active' : ''}`}
                              onClick={() => {
                                setActiveChatJid(c.chat_jid);
                                if (selectedSessionId) {
                                  fetchChatMessages(selectedSessionId, c.chat_jid);
                                }
                              }}
                            >
                              <ChatAvatar
                                sessionId={selectedSessionId}
                                jid={c.resolved_phone ? `${c.resolved_phone}@s.whatsapp.net` : c.chat_jid}
                                name={displayName}
                                isGroup={isGroup}
                                isNewsletter={isNewsletter}
                                size={18}
                              />
                              <div className="chat-item-info">
                                <div className="chat-item-top">
                                  <span className="chat-item-name privacy-blur" title={displayName}>
                                    {displayName}
                                  </span>
                                  {isGroup && <span className="chat-kind-badge">Group</span>}
                                  {isNewsletter && <span className="chat-kind-badge">Channel</span>}
                                  {c.timestamp ? (
                                    <span className="chat-item-time">
                                      {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="chat-item-bottom">
                                  <span className="chat-item-snippet privacy-blur" title={c.last_message || ''}>
                                    {c.last_message || <span className="no-message">No messages yet</span>}
                                  </span>
                                  {(c.unread_count || 0) > 0 && (
                                    <span className="chat-unread-badge">
                                      {c.unread_count! > 99 ? '99+' : c.unread_count}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}

                  {chatsSidebarTab === 'contacts' && (
                    <>
                      {filteredContacts.length === 0 ? (
                        <div className="empty-table-state" style={{ padding: '3rem 1.5rem' }}>
                          <Users size={36} />
                          <h3>No contacts saved</h3>
                          <p>Add contacts in the Contacts menu or import via Excel.</p>
                        </div>
                      ) : (
                        filteredContacts.map(c => {
                          const contactJid = `${c.phone}@s.whatsapp.net`;
                          const isActive = activeChatJid === contactJid;
                          const displayName = c.name || c.push_name || formatPhoneForDisplay(c.phone) || `+${c.phone}`;
                          return (
                            <div
                              key={c.id}
                              role="button"
                              tabIndex={0}
                              className={`chat-item-card ${isActive ? 'active' : ''}`}
                              onClick={() => {
                                setActiveChatJid(contactJid);
                                if (selectedSessionId) {
                                  fetchChatMessages(selectedSessionId, contactJid);
                                }
                              }}
                            >
                              <ChatAvatar
                                sessionId={selectedSessionId}
                                jid={c.phone ? `${c.phone}@s.whatsapp.net` : (c.jid || undefined)}
                                name={displayName}
                                size={18}
                              />
                              <div className="chat-item-info">
                                <div className="chat-item-top">
                                  <span className="chat-item-name privacy-blur" title={displayName}>
                                    {displayName}
                                  </span>
                                  {c.tags.length > 0 && (
                                    <span className="chat-kind-badge">{c.tags[0]}</span>
                                  )}
                                </div>
                                <div className="chat-item-bottom">
                                  <span className="chat-item-snippet privacy-blur">
                                    {formatPhoneForDisplay(c.phone) || `+${c.phone}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}

                  {chatsSidebarTab === 'groups' && (
                    <>
                      {filteredGroups.length === 0 ? (
                        <div className="empty-table-state" style={{ padding: '3rem 1.5rem' }}>
                          <Users size={36} />
                          <h3>No groups found</h3>
                          <p>WhatsApp groups for this session will appear here.</p>
                        </div>
                      ) : (
                        filteredGroups.map(g => {
                          const isActive = activeChatJid === g.jid;
                          return (
                            <div
                              key={g.jid}
                              role="button"
                              tabIndex={0}
                              className={`chat-item-card ${isActive ? 'active' : ''}`}
                              onClick={() => {
                                setActiveChatJid(g.jid);
                                if (selectedSessionId) {
                                  fetchChatMessages(selectedSessionId, g.jid);
                                }
                              }}
                            >
                              <ChatAvatar
                                sessionId={selectedSessionId}
                                jid={g.jid}
                                name={g.name}
                                isGroup={true}
                                size={18}
                              />
                              <div className="chat-item-info">
                                <div className="chat-item-top">
                                  <span className="chat-item-name" title={g.name}>
                                    {g.name}
                                  </span>
                                  <span className="chat-kind-badge">Group</span>
                                </div>
                                <div className="chat-item-bottom">
                                  <span className="chat-item-snippet">
                                    {g.memberCount ? `${g.memberCount} members` : 'WhatsApp Group'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}

                  {chatsSidebarTab === 'channels' && (
                    <>
                      {filteredChannels.length === 0 ? (
                        <div className="empty-table-state" style={{ padding: '3rem 1.5rem' }}>
                          <Radio size={36} />
                          <h3>Tidak ada Saluran</h3>
                          <p>Saluran / Channel WhatsApp yang Anda ikuti akan muncul di sini.</p>
                        </div>
                      ) : (
                        filteredChannels.map(c => {
                            const isActive = activeChatJid === c.chat_jid;
                            const displayName = c.name || c.push_name || 'Saluran WhatsApp';
                            return (
                              <div
                                key={c.chat_jid}
                                role="button"
                                tabIndex={0}
                                className={`chat-item-card ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                  setActiveChatJid(c.chat_jid);
                                  if (selectedSessionId) {
                                    fetchChatMessages(selectedSessionId, c.chat_jid);
                                  }
                                }}
                              >
                                <ChatAvatar
                                  sessionId={selectedSessionId}
                                  jid={c.chat_jid}
                                  name={displayName}
                                  isNewsletter={true}
                                  size={18}
                                />
                                <div className="chat-item-info">
                                  <div className="chat-item-top">
                                    <span className="chat-item-name privacy-blur" title={displayName}>
                                      {displayName}
                                    </span>
                                    <span className="chat-kind-badge bg-amber-50 text-amber-700 border border-amber-200">Channel</span>
                                    {c.timestamp ? (
                                      <span className="chat-item-time">
                                        {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="chat-item-bottom">
                                    <span className="chat-item-snippet privacy-blur" title={c.last_message || ''}>
                                      {c.last_message || <span className="no-message">Belum ada postingan</span>}
                                    </span>
                                    {(c.unread_count || 0) > 0 && (
                                      <span className="chat-unread-badge">
                                        {c.unread_count! > 99 ? '99+' : c.unread_count}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </>
                  )}
                </div>
              </aside>

              {/* Right Column: WhatsAman Chat Room */}
              <main className="chats-room">
                {activeChatJid ? (
                  <div className="room-container">
                    {/* Room Header */}
                    <div className="room-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
                        {(() => {
                          const activeChat = chats.find(c => c.chat_jid === activeChatJid);
                          const currentSession = sessions.find(s => s.id === selectedSessionId);
                          const isSelf = Boolean(
                            (activeChat?.resolved_phone && currentSession?.phoneNumber && activeChat.resolved_phone === currentSession.phoneNumber) ||
                            (currentSession?.phoneNumber && activeChatJid.startsWith(currentSession.phoneNumber))
                          );
                          const phoneDisplay = activeChat?.resolved_phone 
                            ? formatPhoneForDisplay(activeChat.resolved_phone) 
                            : formatPhoneForDisplay(activeChatJid);
                          const isGroup = activeChatJid.endsWith('@g.us');
                          const isNewsletter = activeChatJid.endsWith('@newsletter');
                          const groupMatch = isGroup ? groupsMap.get(activeChatJid) : null;
                          const matchedContact = (activeChat?.resolved_phone ? contactsMap.get(activeChat.resolved_phone) : null) || contactsMap.get(activeChatJid);
                          
                          const headerTitle = isGroup
                            ? groupMatch?.name || 'Grup WhatsApp'
                            : isNewsletter
                            ? 'Saluran WhatsApp'
                            : isSelf
                            ? 'Anda (Catatan Anda)'
                            : matchedContact?.name ||
                              (activeChat?.name && !activeChat.name.includes('@') && !/^\d+$/.test(activeChat.name) ? activeChat.name : null) ||
                              matchedContact?.push_name ||
                              activeChat?.push_name ||
                              phoneDisplay ||
                              activeChatJid;
                              
                          let headerSubtitle = '';
                          if (isGroup) {
                            headerSubtitle = groupMatch?.memberCount ? `${groupMatch.memberCount} peserta` : 'Grup WhatsApp';
                          } else if (isNewsletter) {
                            headerSubtitle = 'Saluran WhatsApp';
                          } else if (isSelf) {
                            headerSubtitle = currentSession?.phoneNumber ? formatPhoneForDisplay(currentSession.phoneNumber) : 'Pesan ke nomor sendiri';
                          } else if (phoneDisplay && headerTitle !== phoneDisplay) {
                            headerSubtitle = `${phoneDisplay} • online`;
                          } else {
                            headerSubtitle = 'online';
                          }

                          return (
                            <>
                              <ChatAvatar
                                sessionId={selectedSessionId}
                                jid={activeChat?.resolved_phone ? `${activeChat.resolved_phone}@s.whatsapp.net` : activeChatJid}
                                name={headerTitle}
                                isGroup={isGroup}
                                isNewsletter={isNewsletter}
                                className="room-avatar"
                                size={20}
                              />
                              <div className="room-contact-info">
                                <h3 className="privacy-blur">{headerTitle}</h3>
                                <span className="room-contact-phone privacy-blur">{headerSubtitle}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <button
                          type="button"
                          onClick={handleRefreshActiveThread}
                          disabled={isRefreshingThread}
                          className="btn-secondary"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            borderRadius: '8px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#475569',
                            cursor: isRefreshingThread ? 'not-allowed' : 'pointer'
                          }}
                          title={t.chats.refreshThread}
                        >
                          <RefreshCw size={13} className={isRefreshingThread ? 'animate-spin' : ''} />
                          <span>{isRefreshingThread ? t.common.refreshing : t.chats.refreshThread}</span>
                        </button>
                        <span className="status-pill ready flex items-center gap-1.5" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                          <CheckCircle size={12} />
                          <span>{t.common.connected}</span>
                        </span>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="room-messages">
                      {chatMessages.length === 0 ? (
                        <div className="empty-table-state" style={{ margin: 'auto' }}>
                          <MessageSquare size={36} />
                          <h3>{t.chats.noMessages}</h3>
                          <p>{t.chats.startConversation}</p>
                        </div>
                      ) : (
                        chatMessages.map((m, idx) => {
                          const isMe = m.from_me === 1;
                          const prevMsg = idx > 0 ? chatMessages[idx - 1] : null;
                          const showDateSeparator = !prevMsg || 
                            new Date(m.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();
                          const dateSeparatorText = showDateSeparator ? formatDateSeparator(m.timestamp) : undefined;
                          
                          let senderDisplayName = '';
                          const isGroup = activeChatJid.endsWith('@g.us');
                          if (!isMe && isGroup) {
                            const senderPhone = m.sender_jid?.split('@')[0];
                            const contactMatch = findContact(m.sender_jid) || findContact(senderPhone);
                            senderDisplayName = contactMatch?.name || contactMatch?.push_name || formatPhoneForDisplay(senderPhone || '') || senderPhone || 'Member';
                          }

                          return (
                            <ChatMessageBubble
                              key={m.id}
                              message={m}
                              isMe={isMe}
                              showDateSeparator={showDateSeparator}
                              dateSeparatorText={dateSeparatorText}
                              senderDisplayName={senderDisplayName}
                              isGroupChat={isGroup}
                            />
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Footer */}
                    <ChatInputBox
                      onSend={handleSendChatMessage}
                      onAttach={() => setIsSendMediaModal(true)}
                      placeholder={t.chats.typeMessage}
                      sendTitle={t.chats.send}
                      attachTitle={t.chats.attachFile}
                    />
                  </div>
                ) : (
                  <div className="chats-room-placeholder">
                    <div className="placeholder-icon">
                      <MessageSquare size={54} />
                    </div>
                    <h2>{lang === 'id' ? 'Pilih Percakapan' : 'Select a conversation'}</h2>
                    <p>{lang === 'id' ? 'Pilih obrolan dari bilah samping, pilih kontak, atau klik "Chat Baru" untuk mulai berkirim pesan.' : 'Choose a chat from the sidebar, select a contact, or click "New Chat" to start messaging.'}</p>
                  </div>
                )}
              </main>
            </div>
          </div>
        )}

        {/* ==================== AMAN CHAT PRO: CRM & PIPELINE SEQUENCER ==================== */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            <header className="page-header">
              <div className="page-header__title-group">
                <div className="flex items-center gap-2.5">
                  <h1>{t.crm.title}</h1>
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    WhatsAman Pro Engine
                  </span>
                </div>
                <span className="status-badge connected">{contacts.length} {t.crm.totalLeads}</span>
              </div>
              <div className="page-header__actions flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setNewTaskPhone('');
                    setNewTaskName('');
                    setIsNewTaskModal(true);
                  }}
                  className="btn-primary"
                >
                  <Plus size={16} />
                  <span>{t.crm.newTask}</span>
                </button>
                <a
                  href={`/api/v1/crm/export-csv?sessionId=${selectedSessionId}`}
                  download
                  className="btn-secondary"
                  title={lang === 'id' ? 'Unduh data CRM dan tugas follow-up ke CSV' : 'Export CRM data & follow-up tasks to CSV'}
                >
                  <Download size={15} />
                  <span>{lang === 'id' ? 'Ekspor CSV' : 'Export CSV'}</span>
                </a>
                <button
                  onClick={() => {
                    fetchContacts(selectedSessionId);
                    fetchCRMTasks(selectedSessionId);
                    fetchSalesAnalytics(selectedSessionId, crmTimeRange);
                  }}
                  className="btn-secondary"
                  title={t.common.refresh}
                >
                  <RefreshCw size={15} />
                </button>
              </div>
              <p className="page-header__subtitle">
                {t.crm.subtitle}
              </p>
            </header>

            {/* Pipeline Stage Funnel Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: lang === 'id' ? 'Semua Prospek' : 'All Leads', count: contacts.length, color: 'border-slate-300 text-slate-700 dark:text-slate-200' },
                { id: 'lead', label: `🔵 ${t.crm.lead}`, count: contacts.filter(c => !c.pipeline_stage || c.pipeline_stage === 'lead').length, color: 'border-sky-300 text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300' },
                { id: 'prospect', label: `🟡 ${t.crm.prospect}`, count: contacts.filter(c => c.pipeline_stage === 'prospect').length, color: 'border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300' },
                { id: 'customer', label: `💰 ${t.crm.customer}`, count: contacts.filter(c => c.pipeline_stage === 'customer').length, color: 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300' },
                { id: 'churned', label: `❌ ${t.crm.churned}`, count: contacts.filter(c => c.pipeline_stage === 'churned').length, color: 'border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setCrmStageFilter(s.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-2 flex-shrink-0 ${
                    crmStageFilter === s.id
                      ? 'ring-2 ring-emerald-500 shadow-sm font-extrabold ' + s.color
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{s.label}</span>
                  <span className="bg-slate-200/70 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                    {s.count}
                  </span>
                </button>
              ))}
            </div>

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Contacts CRM Pipeline Table (7 cols) */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {lang === 'id' ? 'Pipeline Kontak Pelanggan' : 'Customer Pipeline Contacts'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === 'id' ? 'Klik status stage atau tag untuk memperbarui klasifikasi prospek' : 'Click stage status or tags to update customer classification'}
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={lang === 'id' ? 'Cari nama atau nomor HP...' : 'Search name or phone...'}
                      value={crmSearchQuery}
                      onChange={e => setCrmSearchQuery(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Preset Tag Badges Bar */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Tag Filter:</span>
                  {['ALL', '🔥 Hot Lead', '🟡 Warm Lead', '🔵 New Lead', '💰 Customer', '🔄 Follow Up', '❌ Lost', '⭐ VIP'].map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTagFilter(t)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                        selectedTagFilter === t
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 font-bold'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Contacts List Table */}
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-500 uppercase sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">{lang === 'id' ? 'KONTAK' : 'CONTACT'}</th>
                        <th className="py-2.5 px-3">{lang === 'id' ? 'PIPELINE STAGE' : 'PIPELINE STAGE'}</th>
                        <th className="py-2.5 px-3">TAGS</th>
                        <th className="py-2.5 px-3">{lang === 'id' ? 'CATATAN' : 'NOTES'}</th>
                        <th className="py-2.5 px-3 text-right">{lang === 'id' ? 'AKSI' : 'ACTIONS'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {contacts
                        .filter(c => {
                          const stage = c.pipeline_stage || 'lead';
                          if (crmStageFilter !== 'ALL' && stage !== crmStageFilter) return false;
                          if (selectedTagFilter !== 'ALL' && !c.tags.includes(selectedTagFilter)) return false;
                          if (crmSearchQuery) {
                            const q = crmSearchQuery.toLowerCase();
                            const matchPhone = c.phone.includes(q);
                            const matchName = (c.name || c.push_name || '').toLowerCase().includes(q);
                            if (!matchPhone && !matchName) return false;
                          }
                          return true;
                        })
                        .map(c => {
                          const stage = c.pipeline_stage || 'lead';
                          const displayName = c.name || c.push_name || formatPhoneForDisplay(c.phone) || `+${c.phone}`;
                          return (
                            <tr key={c.id || c.phone} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                                    {(c.name || c.push_name || 'U').slice(0, 1).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate privacy-blur" title={displayName}>
                                      {displayName}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-mono privacy-blur">
                                      +{c.phone}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-2.5 px-3">
                                <select
                                  value={stage}
                                  onChange={e => handleUpdateContactStage(c.phone, e.target.value as any)}
                                  className={`text-[11px] font-bold rounded-lg px-2 py-1 border transition-all cursor-pointer ${
                                    stage === 'customer'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300'
                                      : stage === 'prospect'
                                      ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300'
                                      : stage === 'churned'
                                      ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300'
                                      : 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300'
                                  }`}
                                >
                                  <option value="lead">🔵 {t.crm.lead}</option>
                                  <option value="prospect">🟡 {t.crm.prospect}</option>
                                  <option value="customer">💰 {t.crm.customer}</option>
                                  <option value="churned">❌ {t.crm.churned}</option>
                                </select>
                              </td>

                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1 flex-wrap max-w-xs">
                                  {c.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-200">
                                      {tag}
                                    </span>
                                  ))}
                                  {c.tags.length > 2 && (
                                    <span className="text-[10px] text-slate-400">+{c.tags.length - 2}</span>
                                  )}
                                  <button
                                    onClick={() => {
                                      setEditingContactPhone(c.phone);
                                      setEditingContactName(displayName);
                                      setEditingContactTags(c.tags.join(', '));
                                      setIsEditContactTagsModal(true);
                                    }}
                                    className="text-[10px] text-emerald-600 hover:underline"
                                    title={lang === 'id' ? 'Edit Tag' : 'Edit Tags'}
                                  >
                                    <Tag size={12} />
                                  </button>
                                </div>
                              </td>

                              <td className="py-2.5 px-3">
                                <button
                                  onClick={() => {
                                    setSelectedContactForNotes(c);
                                    setContactNotesText(c.notes || '');
                                    setIsNotesModal(true);
                                  }}
                                  className="text-left group flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                                  title={lang === 'id' ? 'Lihat / Edit Catatan Pelanggan' : 'View / Edit Notes'}
                                >
                                  <Edit3 size={12} className="text-slate-400 group-hover:text-slate-700" />
                                  <span className="text-[11px] truncate max-w-[120px] italic">
                                    {c.notes || (lang === 'id' ? 'Tambah catatan...' : 'Add notes...')}
                                  </span>
                                </button>
                              </td>

                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Apply Sequence Button */}
                                  <button
                                    onClick={() => {
                                      setApplySeqContact(c);
                                      setIsApplySeqModal(true);
                                    }}
                                    className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1"
                                    title={t.crm.applySequence}
                                  >
                                    <Zap size={11} className="text-amber-500" />
                                    <span>Sequence</span>
                                  </button>

                                  {/* Quick Manual Task Button */}
                                  <button
                                    onClick={() => {
                                      setNewTaskPhone(c.phone);
                                      setNewTaskName(displayName);
                                      setIsNewTaskModal(true);
                                    }}
                                    className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1"
                                    title={lang === 'id' ? 'Jadwalkan Follow-up untuk kontak ini' : 'Schedule follow-up for this contact'}
                                  >
                                    <Clock size={11} />
                                    <span>Follow-up</span>
                                  </button>

                                  {/* Chat Button */}
                                  <button
                                    onClick={() => {
                                      setActiveChatJid(`${c.phone}@s.whatsapp.net`);
                                      setActiveTab('chats');
                                    }}
                                    className="btn-icon p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                    title={lang === 'id' ? 'Buka Chat Langsung' : 'Open Chat Directly'}
                                  >
                                    <MessageSquare size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {contacts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            {lang === 'id' ? 'Belum ada kontak di database sesi ini. Buka WhatsApp Web atau sinkronkan kontak terlebih dahulu.' : 'No contacts in database for this session. Sync contacts or link WhatsApp first.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Follow-up Tasks & Sequencer Engine (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Auto-Stop Sequencer Info Banner */}
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-xs text-emerald-900 dark:text-emerald-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck size={16} />
                    <span>{lang === 'id' ? 'Smart Sequencer & Auto-Stop Aktif' : 'Smart Sequencer & Auto-Stop Active'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300">
                    {lang === 'id'
                      ? 'Saat pelanggan merespon atau membalas pesan, rantai sequence yang belum terkirim otomatis dihentikan (Auto-Stop) agar tidak spam.'
                      : 'When a customer replies or messages back, any remaining scheduled follow-up steps are automatically cancelled (Auto-Stop) to prevent spam.'}
                  </p>
                </div>

                {/* Follow-up Tasks List Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        <Clock size={16} className="text-amber-500" />
                        <span>{lang === 'id' ? 'Tugas Follow-up' : 'Follow-up Tasks'}</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        {crmTasks.filter(t => t.status === 'PENDING').length} {lang === 'id' ? 'tugas pending' : 'pending tasks'}
                        {crmTasks.filter(t => t.status === 'PENDING' && t.due_at <= Date.now()).length > 0 && (
                          <span className="text-rose-600 font-bold ml-1.5 animate-pulse">
                            ({crmTasks.filter(t => t.status === 'PENDING' && t.due_at <= Date.now()).length} {lang === 'id' ? 'Jatuh Tempo' : 'Overdue'})
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Auto-Dispatch Switch */}
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Auto-Dispatch:
                        </span>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={crmAutoDispatch}
                            onChange={handleToggleCrmAutoDispatch}
                          />
                          <span className="toggle-slider" />
                        </label>
                        <span className={`text-[10px] font-extrabold ${crmAutoDispatch ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {crmAutoDispatch ? 'ON' : 'OFF'}
                        </span>
                      </div>

                      {/* Task Filter */}
                      <select
                        value={crmTaskFilter}
                        onChange={e => setCrmTaskFilter(e.target.value as any)}
                        className="text-xs font-semibold py-1 px-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900"
                      >
                        <option value="ALL">{t.crm.taskFilterAll} ({crmTasks.length})</option>
                        <option value="PENDING">{t.crm.taskFilterPending} ({crmTasks.filter(t => t.status === 'PENDING').length})</option>
                        <option value="COMPLETED">{t.crm.taskFilterCompleted} ({crmTasks.filter(t => t.status === 'COMPLETED').length})</option>
                        <option value="CANCELLED">{t.crm.taskFilterCancelled} ({crmTasks.filter(t => t.status === 'CANCELLED').length})</option>
                      </select>
                    </div>
                  </div>

                  {/* Tasks Cards List */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {crmTasks
                      .filter(task => crmTaskFilter === 'ALL' || task.status === crmTaskFilter)
                      .map(task => {
                        const isOverdue = task.status === 'PENDING' && task.due_at <= Date.now();
                        const isToday = task.status === 'PENDING' && new Date(task.due_at).toDateString() === new Date().toDateString();
                        return (
                          <div
                            key={task.id}
                            className={`p-3.5 rounded-lg border transition-all space-y-2 ${
                              task.status === 'COMPLETED'
                                ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700/60 opacity-80'
                                : task.status === 'CANCELLED'
                                ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 opacity-70'
                                : isOverdue
                                ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate" title={task.title}>
                                {task.title}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                  task.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : task.status === 'CANCELLED'
                                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                    : isOverdue
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                                    : isToday
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                }`}
                              >
                                {task.status === 'COMPLETED'
                                  ? (lang === 'id' ? '✓ SELESAI' : '✓ COMPLETED')
                                  : task.status === 'CANCELLED'
                                  ? (lang === 'id' ? 'AUTO-STOP / BATAL' : 'AUTO-STOPPED')
                                  : isOverdue
                                  ? (lang === 'id' ? '🔴 TERLEWAT' : '🔴 OVERDUE')
                                  : isToday
                                  ? (lang === 'id' ? '🟡 HARI INI' : '🟡 TODAY')
                                  : (lang === 'id' ? '🟢 MENDATANG' : '🟢 UPCOMING')}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center justify-between">
                              <span className="privacy-blur font-medium text-slate-700 dark:text-slate-300">
                                👤 {task.contact_name || formatPhoneForDisplay(task.contact_phone) || `+${task.contact_phone}`}
                              </span>
                              <span className="font-mono text-[10px]">
                                ⏰ {new Date(task.due_at).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US')} {new Date(task.due_at).toLocaleTimeString(lang === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Message Template Preview */}
                            <p className="text-[11px] bg-slate-50 dark:bg-slate-900/60 p-2 rounded border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 italic line-clamp-2">
                              "{previewTemplate(task.message_template, task.contact_name || (lang === 'id' ? 'Sahabat' : 'Friend'))}"
                            </p>

                            {task.notes && (
                              <div className="text-[10px] text-slate-400 italic">
                                Info: {task.notes}
                              </div>
                            )}

                            {/* Task Action Buttons */}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-slate-400 font-mono">
                                Step {task.step_number || 1}
                              </span>

                              <div className="flex items-center gap-1.5">
                                {task.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => handleExecuteFollowUp(task.id)}
                                      className="btn-primary py-1 px-2.5 text-xs flex items-center gap-1 shadow-sm"
                                      title={lang === 'id' ? 'Kirim pesan follow-up ini sekarang ke WhatsApp pelanggan' : 'Dispatch this follow-up message to customer now'}
                                    >
                                      <Send size={12} />
                                      <span>{t.crm.executeTask}</span>
                                    </button>
                                    <button
                                      onClick={() => handleCancelFollowUp(task.id)}
                                      className="btn-secondary py-1 px-2 text-[10px]"
                                      title={t.crm.cancelTask}
                                    >
                                      {t.common.cancel}
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleDeleteFollowUp(task.id)}
                                  className="text-slate-400 hover:text-rose-500 p-1"
                                  title={t.common.delete}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {crmTasks.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        {lang === 'id'
                          ? <>Belum ada tugas follow-up. Klik <b>"Jadwalkan Follow-up"</b> atau terapkan sequence ke salah satu kontak.</>
                          : <>No follow-up tasks yet. Click <b>"New Follow-Up Task"</b> or apply a sequence to a contact.</>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 4. MESSAGE TESTER ==================== */}
        {activeTab === 'tester' && (
          <div className="space-y-6">
            <header className="page-header">
              <div className="page-header__title-group">
                <h1>{t.tester.title}</h1>
                <span className="status-badge connected">Live API Client</span>
              </div>
              <p className="page-header__subtitle">
                {t.tester.subtitle}
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Send Form */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">
                  {lang === 'id' ? 'Formulir Uji Kirim Pesan' : 'Message Request Builder'}
                </h3>

                {/* Session Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">{t.common.session}</label>
                  <select
                    value={selectedSessionId}
                    onChange={e => setSelectedSessionId(e.target.value)}
                    className="w-full text-xs font-semibold py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800"
                  >
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message Type Tabs */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    {lang === 'id' ? 'Tipe Pesan' : 'Message Type'}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTesterType('text')}
                      className={`btn-sm flex-1 ${testerType === 'text' ? 'bg-emerald-500 text-slate-900 font-bold border-emerald-500' : 'btn-secondary'}`}
                    >
                      {t.tester.typeText}
                    </button>
                    <button
                      onClick={() => setTesterType('media')}
                      className={`btn-sm flex-1 ${testerType === 'media' ? 'bg-emerald-500 text-slate-900 font-bold border-emerald-500' : 'btn-secondary'}`}
                    >
                      {t.tester.typeMedia}
                    </button>
                  </div>
                </div>

                {/* Recipient Phone */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    {t.tester.recipientPhone}
                  </label>
                  <input
                    type="text"
                    placeholder={t.tester.recipientPlaceholder}
                    value={testerRecipient}
                    onChange={e => setTesterRecipient(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Text Message or Media Input */}
                {testerType === 'text' ? (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">{t.tester.messageText}</label>
                    <textarea
                      rows={4}
                      value={testerMessage}
                      onChange={e => setTesterMessage(e.target.value)}
                      placeholder={lang === 'id' ? 'Ketik isi pesan uji coba...' : 'Type test message content...'}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">{t.tester.mediaFile}</label>
                      <input
                        type="file"
                        onChange={e => setTesterMediaFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">{t.tester.mediaCaption}</label>
                      <input
                        type="text"
                        value={testerMediaCaption}
                        onChange={e => setTesterMediaCaption(e.target.value)}
                        placeholder={lang === 'id' ? 'Keterangan media / caption...' : 'Image / document caption...'}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleRunTester}
                  disabled={testerLoading || !testerRecipient.trim()}
                  className="btn-primary w-full"
                >
                  <Send size={16} />
                  <span>{testerLoading ? t.tester.sending : t.tester.sendTest}</span>
                </button>
              </div>

              {/* Right Column: Live API Response Viewer */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{t.tester.responseLog}</h3>
                  {testerResponse && (
                    <span className={`status-pill ${testerResponse.status === 200 ? 'ready' : 'failed'}`}>
                      HTTP {testerResponse.status}
                    </span>
                  )}
                </div>

                {testerResponse ? (
                  <div className="space-y-3">
                    <div className="text-[11px] text-slate-400 mono">Timestamp: {testerResponse.timestamp}</div>
                    <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96">
                      {JSON.stringify(testerResponse, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400 text-xs space-y-2">
                    <Activity size={32} className="mx-auto text-slate-300" />
                    <p>{t.tester.noResponse}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 5. CONTACTS (WHATSAMAN TABLE) ==================== */}
        {activeTab === 'contacts' && (
          <div className="contacts-page space-y-6">
            <header className="page-header">
              <div className="page-header__title-group">
                <h1>{t.contacts.title}</h1>
                <span className="status-badge connected">{contacts.length} Total</span>
              </div>
              <div className="page-header__actions">
                <button
                  onClick={async () => {
                    if (!selectedSessionId) return;
                    try {
                      const res = await fetch('/api/v1/contacts/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId: selectedSessionId })
                      });
                      const data = await res.json();
                      if (data.success) {
                        fetchContacts(selectedSessionId);
                        fetchChats(selectedSessionId);
                      }
                    } catch {
                      // ignore
                    }
                  }}
                  className="btn-secondary btn-sm"
                  title={lang === 'id' ? 'Sinkronkan kontak dari WhatsApp' : 'Sync contacts from WhatsApp'}
                >
                  <RefreshCw size={14} />
                  <span>{t.contacts.syncFromWa}</span>
                </button>

                <button
                  onClick={() => setActiveTab('groups')}
                  className="btn-secondary btn-sm"
                  title={lang === 'id' ? 'Ekstrak anggota dari grup WhatsApp' : 'Extract members from WhatsApp Groups'}
                >
                  <Layers size={14} />
                  <span>{lang === 'id' ? 'Ekstrak dari Grup' : 'Extract from Groups'}</span>
                </button>

                <label className="btn-secondary btn-sm cursor-pointer">
                  <Upload size={14} />
                  <span>{t.contacts.importExcel}</span>
                  <input
                    type="file"
                    accept=".xlsx,.csv"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file || !selectedSessionId) return;
                      const fd = new FormData();
                      fd.append('sessionId', selectedSessionId);
                      fd.append('file', file);
                      const res = await fetch('/api/v1/contacts/import', { method: 'POST', body: fd });
                      const data = await res.json();
                      if (data.success) {
                        alert(data.message);
                        fetchContacts(selectedSessionId);
                      }
                    }}
                  />
                </label>

                <a
                  href={`/api/v1/contacts/export?sessionId=${selectedSessionId}`}
                  download
                  className="btn-secondary btn-sm"
                >
                  <Download size={14} />
                  <span>{t.contacts.exportExcel}</span>
                </a>

                <button onClick={() => setIsAddContactModal(true)} className="btn-primary">
                  <Plus size={16} />
                  <span>{lang === 'id' ? 'Tambah Kontak' : 'Add Contact'}</span>
                </button>
              </div>
              <p className="page-header__subtitle">{t.contacts.subtitle}</p>
            </header>

            <div className="filters-bar">
              <div className="search-input">
                <Search size={16} />
                <input
                  type="text"
                  placeholder={t.contacts.searchContacts}
                  value={contactSearchQuery}
                  onChange={e => setContactSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Tag size={13} className="text-slate-400" />
                  <span className="text-xs text-slate-500 font-medium">{lang === 'id' ? 'Group:' : 'Group:'}</span>
                  <select
                    value={selectedTagFilter}
                    onChange={e => setSelectedTagFilter(e.target.value)}
                    className="session-selector text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-slate-800"
                    style={{ width: 'auto' }}
                  >
                    <option value="ALL">{lang === 'id' ? 'Semua Group' : 'All Groups'} ({contacts.length})</option>
                    {availableTags.map(t => (
                      <option key={t.tag} value={t.tag}>
                        {t.tag} ({t.count})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="text-xs text-slate-500 font-medium">{t.common.session}:</span>
                  <select
                    value={selectedSessionId}
                    onChange={e => setSelectedSessionId(e.target.value)}
                    className="session-selector text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-slate-800"
                    style={{ width: 'auto' }}
                  >
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="keys-table-container">
              <table className="keys-table">
                <thead>
                  <tr className="table-row header">
                    <th>{lang === 'id' ? 'KONTAK & AVATAR' : 'CONTACT & AVATAR'}</th>
                    <th>{t.contacts.colName}</th>
                    <th>{lang === 'id' ? 'PUSH NAME (WA)' : 'PUSH NAME (WA)'}</th>
                    <th>{t.contacts.colStage}</th>
                    <th>{lang === 'id' ? 'GROUP / TAGS' : 'GROUP / TAGS'}</th>
                    <th>{lang === 'id' ? 'STATUS OPT-OUT' : 'OPT-OUT STATUS'}</th>
                    <th style={{ textAlign: 'right' }}>{t.contacts.colActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-table-state">
                          <Users size={40} />
                          <h3>{t.contacts.noContacts}</h3>
                          <p>{lang === 'id' ? 'Klik "Tambah Kontak" atau "Import Excel" untuk membangun kontak sesi ini.' : 'Click "Add Contact" or "Import Excel" to build your directory.'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    contacts
                      .filter(c => {
                        if (selectedTagFilter !== 'ALL' && !c.tags.includes(selectedTagFilter)) {
                          return false;
                        }
                        const target = `${c.phone} ${c.name || ''} ${c.push_name || ''} ${c.tags.join(' ')}`.toLowerCase();
                        return target.includes(contactSearchQuery.toLowerCase());
                      })
                      .map(c => (
                        <tr key={c.id} className="table-row">
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <ChatAvatar
                                sessionId={selectedSessionId}
                                jid={`${c.phone}@s.whatsapp.net`}
                                name={c.name || c.push_name || c.phone}
                                size={14}
                                style={{ width: '34px', height: '34px', flexShrink: 0 }}
                              />
                              <div>
                                <div className="name-cell font-mono font-semibold text-slate-900 privacy-blur" style={{ fontSize: '0.85rem' }}>
                                  {formatPhoneForDisplay(c.phone) || `+${c.phone}`}
                                </div>
                                <div className="text-[11px] text-slate-400 privacy-blur">
                                  {c.jid}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="name-cell font-medium privacy-blur text-slate-800">
                              {c.name || c.push_name || '—'}
                            </div>
                          </td>
                          <td>
                            <span className="privacy-blur text-xs text-slate-500">{c.push_name || '—'}</span>
                          </td>
                          <td>
                            <select
                              value={c.pipeline_stage || 'lead'}
                              onChange={e => handleUpdateContactStage(c.phone, e.target.value as any)}
                              className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 border cursor-pointer transition-all ${
                                c.pipeline_stage === 'customer'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : c.pipeline_stage === 'prospect'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : c.pipeline_stage === 'churned'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : 'bg-sky-50 text-sky-800 border-sky-300'
                              }`}
                            >
                              <option value="lead">🔵 {t.crm.lead}</option>
                              <option value="prospect">🟡 {t.crm.prospect}</option>
                              <option value="customer">💰 {t.crm.customer}</option>
                              <option value="churned">❌ {t.crm.churned}</option>
                            </select>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                              {c.tags.length === 0 ? (
                                <span className="text-[11px] text-slate-400 italic">{lang === 'id' ? 'Tanpa Group' : 'No Group'}</span>
                              ) : (
                                c.tags.map(t => (
                                  <span
                                    key={t}
                                    className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 font-medium"
                                  >
                                    <Tag size={9} />
                                    {t}
                                  </span>
                                ))
                              )}
                              <button
                                onClick={() => openEditTagsModal(c)}
                                className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-100 transition-colors"
                                title={lang === 'id' ? 'Edit / Atur Group Kontak Ini' : 'Edit tags for this contact'}
                                style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '2px' }}
                              >
                                <Edit3 size={12} />
                              </button>
                            </div>
                          </td>
                          <td>
                            <button
                              onClick={() => handleToggleOptOut(c.phone, c.opt_out)}
                              className={`status-pill cursor-pointer ${c.opt_out ? 'error' : 'ready'}`}
                              title={lang === 'id' ? 'Klik untuk ubah status opt-out' : 'Click to toggle opt-out status'}
                            >
                              {c.opt_out ? (lang === 'id' ? 'Opt-Out (Blokir)' : 'Opted-Out') : (lang === 'id' ? 'Opt-In Aktif' : 'Opt-In Active')}
                            </button>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenChatWithContact(c.phone, c.name)}
                                className="btn-secondary btn-sm"
                                title={lang === 'id' ? 'Chat kontak ini' : 'Chat with this contact'}
                                style={{ padding: '0.35rem 0.65rem', gap: '4px', fontSize: '0.75rem' }}
                              >
                                <MessageSquare size={13} />
                                <span>Chat</span>
                              </button>
                              <button
                                onClick={() => handleDeleteContact(c.phone)}
                                className="btn-icon"
                                title={t.common.delete}
                                style={{ color: 'var(--text-muted)' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== 6. GROUPS ==================== */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            <header className="page-header">
              <div className="page-header__title-group">
                <h1>{t.groups.title}</h1>
                <span className="status-badge connected">{groups.length} {t.groups.totalGroups}</span>
              </div>
              <div className="page-header__actions">
                <button onClick={() => fetchGroups(selectedSessionId)} className="btn-secondary">
                  <RefreshCw size={15} />
                  <span>{t.common.refresh}</span>
                </button>
              </div>
              <p className="page-header__subtitle">{t.groups.subtitle}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
                  <Layers size={36} className="mx-auto text-slate-300" />
                  <p>{t.groups.noGroups}</p>
                </div>
              ) : (
                groups.map(g => (
                  <div key={g.jid} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm truncate">{g.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {t.groups.participants}: <span className="font-bold text-slate-800">{g.memberCount}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mono truncate mt-0.5">{g.jid}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleImportGroupToContacts(g.jid)}
                        className="btn-primary w-full text-xs"
                        style={{ padding: '0.5rem' }}
                      >
                        <Users size={14} />
                        <span>{t.groups.importMembers}</span>
                      </button>

                      <a
                        href={`/api/v1/groups/${g.jid}/export?sessionId=${selectedSessionId}`}
                        download
                        className="btn-secondary w-full text-xs"
                        style={{ padding: '0.5rem' }}
                      >
                        <Download size={14} />
                        <span>{t.groups.exportExcel}</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== 7. CAMPAIGNS (BROADCAST) ==================== */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <header className="page-header">
              <div className="page-header__title-group">
                <h1>{t.campaigns.title}</h1>
                <span className="status-badge connected">{campaigns.length} Total</span>
              </div>
              <div className="page-header__actions">
                <button onClick={() => setIsNewCampaignModal(true)} className="btn-primary">
                  <Plus size={16} />
                  <span>{t.campaigns.newBroadcast}</span>
                </button>
              </div>
              <p className="page-header__subtitle">
                {t.campaigns.subtitle}
              </p>
            </header>

            <div className="grid grid-cols-1 gap-4">
              {campaigns.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
                  <Radio size={36} className="mx-auto text-slate-300" />
                  <p>{t.campaigns.noCampaigns}</p>
                </div>
              ) : (
                campaigns.map(c => (
                  <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                        <span className="text-xs text-slate-400 mono">ID: {c.id}</span>
                      </div>
                      <span className={`status-pill ${c.status.toLowerCase()}`}>{c.status}</span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
                        <span>
                          {t.campaigns.progress}: {c.sent_count} / {c.total_recipients} {t.campaigns.sent}
                        </span>
                        <span>{t.campaigns.failed}: {c.failed_count}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${c.total_recipients > 0 ? (c.sent_count / c.total_recipients) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-400 truncate max-w-md italic">"{c.template_text}"</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewRecipients(c.id, c.name)}
                          className="btn-secondary btn-sm"
                          title={lang === 'id' ? 'Lihat Log Penerima' : 'View Recipient Log'}
                        >
                          <Eye size={14} />
                          <span>{lang === 'id' ? 'Penerima' : 'Recipients'}</span>
                        </button>

                        {c.status === 'RUNNING' ? (
                          <button onClick={() => handlePauseCampaign(c.id)} className="btn-sm" style={{ color: 'var(--warning-text)' }}>
                            <Pause size={14} />
                            <span>{t.campaigns.pauseCampaign}</span>
                          </button>
                        ) : (
                          <button onClick={() => handleStartCampaign(c.id)} className="btn-primary btn-sm">
                            <Play size={14} />
                            <span>{t.campaigns.startCampaign}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteCampaign(c.id)}
                          className="btn-sm danger"
                          title={t.common.delete}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== 8. TEMPLATES & RULES (AUTOMATION) ==================== */}
        {activeTab === 'automation' && (
          <div className="space-y-6">
            <header className="page-header">
              <div className="page-header__title-group">
                <h1>{t.automation.title}</h1>
                <span className="status-badge connected">{rules.length} {lang === 'id' ? 'Aturan' : 'Rules'}</span>
              </div>
              <div className="page-header__actions">
                <button onClick={() => setIsNewRuleModal(true)} className="btn-primary">
                  <Plus size={16} />
                  <span>{t.automation.newRule}</span>
                </button>
              </div>
              <p className="page-header__subtitle">
                {t.automation.subtitle}
              </p>
            </header>

            {/* AMAN CHAT Pro: Smart Bot & Business Hours Config Panel */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {t.automation.workingHours}
                      </h3>
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        WhatsAman Pro Engine
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.automation.workingHoursDesc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSaveBotConfig}
                  className="btn-primary flex items-center gap-2 flex-shrink-0 text-xs py-2 px-4 shadow-sm"
                >
                  <Check size={14} />
                  <span>{lang === 'id' ? 'Simpan Pengaturan Bot' : 'Save Bot Settings'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Jam Operasional Layanan & Offline Reply */}
                <div className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {lang === 'id' ? 'Jam Operasional Bisnis (Business Hours)' : 'Business Operating Hours'}
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {lang === 'id' ? 'Batasi operasional bot pada hari & jam tertentu' : 'Restrict automated bot responses to specific days & hours'}
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={botConfig.businessHoursEnabled}
                        onChange={e => setBotConfig(prev => ({ ...prev, businessHoursEnabled: e.target.checked }))}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  {botConfig.businessHoursEnabled && (
                    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                            {lang === 'id' ? 'Jam Buka (WIB)' : 'Opening Time'}
                          </label>
                          <input
                            type="time"
                            value={botConfig.businessHoursStart}
                            onChange={e => setBotConfig(prev => ({ ...prev, businessHoursStart: e.target.value }))}
                            className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                            {lang === 'id' ? 'Jam Tutup (WIB)' : 'Closing Time'}
                          </label>
                          <input
                            type="time"
                            value={botConfig.businessHoursEnd}
                            onChange={e => setBotConfig(prev => ({ ...prev, businessHoursEnd: e.target.value }))}
                            className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                          {lang === 'id' ? 'Hari Kerja Aktif:' : 'Active Working Days:'}
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[
                            { day: 1, label: lang === 'id' ? 'Senin' : 'Mon' },
                            { day: 2, label: lang === 'id' ? 'Selasa' : 'Tue' },
                            { day: 3, label: lang === 'id' ? 'Rabu' : 'Wed' },
                            { day: 4, label: lang === 'id' ? 'Kamis' : 'Thu' },
                            { day: 5, label: lang === 'id' ? 'Jumat' : 'Fri' },
                            { day: 6, label: lang === 'id' ? 'Sabtu' : 'Sat' },
                            { day: 0, label: lang === 'id' ? 'Minggu' : 'Sun' }
                          ].map(d => {
                            const isChecked = botConfig.businessDays.includes(d.day);
                            return (
                              <button
                                key={d.day}
                                type="button"
                                onClick={() => {
                                  setBotConfig(prev => {
                                    const nextDays = isChecked
                                      ? prev.businessDays.filter(x => x !== d.day)
                                      : [...prev.businessDays, d.day];
                                    return { ...prev, businessDays: nextDays };
                                  });
                                }}
                                className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-all ${
                                  isChecked
                                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {d.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Offline Auto-Reply */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {lang === 'id' ? 'Balasan Otomatis Luar Jam Kerja (Offline Reply)' : 'After-Hours / Away Auto-Reply'}
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {lang === 'id' ? 'Kirim pesan ramah otomatis saat pelanggan chat di luar jam operasional' : 'Send friendly automated notice when customers chat outside business hours'}
                        </p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={botConfig.offlineReplyEnabled}
                          onChange={e => setBotConfig(prev => ({ ...prev, offlineReplyEnabled: e.target.checked }))}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {botConfig.offlineReplyEnabled && (
                      <div className="space-y-1 pt-1">
                        <textarea
                          rows={3}
                          value={botConfig.offlineReplyText}
                          onChange={e => setBotConfig(prev => ({ ...prev, offlineReplyText: e.target.value }))}
                          placeholder={lang === 'id' ? 'Pesan di luar jam kerja...' : 'Away message outside operating hours...'}
                          className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                        <p className="text-[10px] text-slate-400">
                          {t.automation.supportsSpintax}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Anti-Spam Cooldown, Typing Simulation & Fallback */}
                <div className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 space-y-4">
                  {/* Human Typing Simulation */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {lang === 'id' ? 'Simulasi Mengetik (Human Composing Presence)' : 'Human Typing Simulation'}
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {lang === 'id' ? "Kirim status 'sedang mengetik...' 1.2 detik sebelum membalas agar alami & aman dari banned" : "Send 'typing...' status 1.2s before replying to emulate human response"}
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={botConfig.simulateTyping}
                        onChange={e => setBotConfig(prev => ({ ...prev, simulateTyping: e.target.checked }))}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  {/* Cooldown */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-1">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {lang === 'id' ? 'Jeda Anti-Spam / Cooldown per Kontak' : 'Anti-Spam Cooldown per Contact'}
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      {lang === 'id' ? 'Mencegah bot mengirim pesan otomatis berulang kali ke kontak yang sama (isi 0 untuk membalas setiap pesan):' : 'Prevent repeated automated replies to the same contact within (set 0 to reply every message):'}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={botConfig.cooldownMinutes}
                        onChange={e => {
                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                          setBotConfig(prev => ({ ...prev, cooldownMinutes: isNaN(val) ? 0 : val }));
                        }}
                        className="w-24 text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-center font-bold"
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{lang === 'id' ? 'Menit jeda (0 = Tanpa Jeda)' : 'Minutes (0 = No Cooldown)'}</span>
                    </div>
                  </div>

                  {/* Fallback Default Reply */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {lang === 'id' ? 'Balasan Standar (Fallback Default Reply)' : 'Default Fallback Auto-Reply'}
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {lang === 'id' ? 'Kirim balasan jika chat pelanggan tidak cocok dengan satupun kata kunci aturan bot' : 'Send reply when no defined keywords match incoming message'}
                        </p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={botConfig.fallbackEnabled}
                          onChange={e => setBotConfig(prev => ({ ...prev, fallbackEnabled: e.target.checked }))}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>

                    {botConfig.fallbackEnabled && (
                      <div className="space-y-1 pt-1">
                        <textarea
                          rows={3}
                          value={botConfig.fallbackReplyText}
                          onChange={e => setBotConfig(prev => ({ ...prev, fallbackReplyText: e.target.value }))}
                          placeholder={lang === 'id' ? 'Balasan standar jika tidak ada kata kunci cocok...' : 'Default message when no keyword matches...'}
                          className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                        <p className="text-[10px] text-slate-400">
                          {t.automation.supportsSpintax}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Spintax & Bot Simulator Widget */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Bot size={16} className="text-emerald-600" />
                  <span>{t.automation.botSimulator}</span>
                </h3>
                <span className="text-[11px] text-slate-400">{t.automation.botSimulatorDesc}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    {lang === 'id' ? 'Teks Pesan Masuk (Simulasi)' : 'Simulated Customer Message'}
                  </label>
                  <input
                    type="text"
                    placeholder={t.automation.testInputPlaceholder}
                    value={simTestInput}
                    onChange={e => setSimTestInput(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{t.automation.matchedRule}</span>
                    <span className={`status-pill ${simMatchedRule ? 'ready' : 'disconnected'}`}>
                      {simMatchedRule ? simMatchedRule.name : t.automation.noMatch}
                    </span>
                  </div>
                  {simEvaluatedReply && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-slate-800">
                      <span className="font-semibold text-[11px] text-slate-500 block mb-0.5">{t.automation.replyPreview}</span>
                      <p className="italic text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-100">
                        "{simEvaluatedReply}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rules Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">{t.automation.configuredRules}</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="table-header" style={{ display: 'table-header-group' }}>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-2.5 px-4">{t.automation.ruleName}</th>
                      <th className="py-2.5 px-4">{t.automation.triggerCondition}</th>
                      <th className="py-2.5 px-4">{t.automation.replyAction}</th>
                      <th className="py-2.5 px-4">{t.automation.hitCount}</th>
                      <th className="py-2.5 px-4">{t.automation.status}</th>
                      <th className="py-2.5 px-4 text-right">{t.automation.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rules.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          {t.automation.noRules}
                        </td>
                      </tr>
                    ) : (
                      rules.map(r => {
                        const cond = r.conditions[0];
                        const textAction = r.actions.find((a: any) => a.type === 'reply_text' || a.type === 'send_text');
                        const tagActions = r.actions.filter((a: any) => a.type === 'add_tag');
                        const stageActions = r.actions.filter((a: any) => a.type === 'set_stage');
                        return (
                          <tr key={r.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-4 font-bold text-slate-900">{r.name}</td>
                            <td className="py-2.5 px-4">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px]">
                                {cond?.operator} "{cond?.value}"
                              </span>
                            </td>
                            <td className="py-2.5 px-4 max-w-xs">
                              <div className="space-y-1">
                                {textAction?.text && (
                                  <div className="truncate text-slate-800 font-medium">"{textAction.text}"</div>
                                )}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {tagActions.map((a: any, idx: number) => (
                                    <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                      {a.tag}
                                    </span>
                                  ))}
                                  {stageActions.map((a: any, idx: number) => (
                                    <span key={idx} className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                                      Stage: {a.stage}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 mono font-semibold text-slate-800">{r.hit_count}x</td>
                            <td className="py-2.5 px-4">
                              {/* WhatsAman Toggle Switch */}
                              <label className="toggle-switch">
                                <input
                                  type="checkbox"
                                  checked={r.is_active}
                                  onChange={() => handleToggleRule(r.id, r.is_active)}
                                />
                                <span className="toggle-slider" />
                              </label>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    const tAction = r.actions.find((a: any) => a.type === 'reply_text' || a.type === 'send_text');
                                    const tgAction = r.actions.find((a: any) => a.type === 'add_tag');
                                    const stgAction = r.actions.find((a: any) => a.type === 'set_stage');
                                    setEditRuleId(r.id);
                                    setEditRuleName(r.name);
                                    setEditRuleTriggerText(cond?.value || '');
                                    setEditRuleOperator((cond?.operator as any) || 'contains');
                                    setEditRuleReplyText(tAction?.text || '');
                                    setEditRuleAddTagEnabled(Boolean(tgAction));
                                    setEditRuleActionTag(tgAction?.tag || '🔥 Hot Lead');
                                    setEditRuleSetStageEnabled(Boolean(stgAction));
                                    setEditRuleActionStage((stgAction?.stage as any) || 'prospect');
                                    setIsEditRuleModal(true);
                                  }}
                                  className="text-slate-400 hover:text-slate-700 p-1"
                                  title={lang === 'id' ? 'Edit Aturan' : 'Edit Rule'}
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  onClick={() => handleDeleteRule(r.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                  title={t.common.delete}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 8.5. WEBHOOKS & 3RD-PARTY INTEGRATIONS ==================== */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <header className="page-header">
              <div className="page-header__title-group">
                <div className="flex items-center gap-2">
                  <Webhook className="text-blue-600" size={24} />
                  <h1>{t.integrations.title}</h1>
                </div>
                <span className="status-badge connected">{lang === 'id' ? 'API Ingestion Siap' : 'API Ingestion Ready'}</span>
              </div>
              <div className="page-header__actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    fetchIntegrationConfigs();
                    fetchOutgoingWebhooks();
                    fetchIntegrationLogs();
                  }}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  title={t.common.refresh}
                >
                  <RefreshCw size={15} />
                  <span>{t.common.refresh}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsTestIntegrationModal(true)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#93c5fd', color: '#1d4ed8' }}
                >
                  <Send size={15} />
                  <span>{t.integrations.testTrigger}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddOutgoingWebhookModal(true)}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={15} />
                  <span>{t.integrations.addOutgoing}</span>
                </button>
              </div>
              <p className="page-header__subtitle">
                {t.integrations.subtitle}
              </p>
            </header>

            {/* Integration Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <Code2 className="stat-watermark" />
                <div className="stat-header">
                  <span className="stat-label">Google Apps Script</span>
                  <Code2 size={18} className="stat-icon text-blue-600" />
                </div>
                <div className="stat-value text-lg text-emerald-600 font-bold">{lang === 'id' ? 'Siap Digunakan' : 'Ready to Ingest'}</div>
                <div className="stat-detail">{lang === 'id' ? 'Trigger Google Forms & Sheets' : 'Trigger Google Forms & Sheets'}</div>
              </div>

              <div className="stat-card">
                <Webhook className="stat-watermark" />
                <div className="stat-header">
                  <span className="stat-label">{lang === 'id' ? 'Integrasi Masuk' : 'Provider Ingestions'}</span>
                  <Webhook size={18} className="stat-icon text-indigo-600" />
                </div>
                <div className="stat-value">{integrationConfigs.filter(c => c.isActive).length} {t.common.active}</div>
                <div className="stat-detail">{lang === 'id' ? `Dari ${integrationConfigs.length || 6} template` : `From ${integrationConfigs.length || 6} templates`}</div>
              </div>

              <div className="stat-card">
                <Share2 className="stat-watermark" />
                <div className="stat-header">
                  <span className="stat-label">Outgoing Webhooks</span>
                  <Share2 size={18} className="stat-icon text-amber-600" />
                </div>
                <div className="stat-value">{outgoingWebhooks.filter(w => w.isActive).length} {lang === 'id' ? 'Aktif' : 'Active'}</div>
                <div className="stat-detail">{lang === 'id' ? 'Event push ke server Anda' : 'Real-time event push'}</div>
              </div>

              <div className="stat-card">
                <Activity className="stat-watermark" />
                <div className="stat-header">
                  <span className="stat-label">{lang === 'id' ? 'Riwayat Ingestion' : 'Ingestion History'}</span>
                  <Activity size={18} className="stat-icon text-slate-600" />
                </div>
                <div className="stat-value">{integrationLogs.length} {lang === 'id' ? 'Log' : 'Logs'}</div>
                <div className="stat-detail">{lang === 'id' ? 'Tercatat di sistem database' : 'Recorded in database'}</div>
              </div>
            </div>

            {/* Provider Selector Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedIntegrationTab('google_form')}
                  className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
                    selectedIntegrationTab === 'google_form'
                      ? 'border-blue-600 text-blue-600 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{t.integrations.tabGoogleForm}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIntegrationTab('woocommerce')}
                  className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
                    selectedIntegrationTab === 'woocommerce'
                      ? 'border-blue-600 text-blue-600 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{t.integrations.tabWooCommerce}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIntegrationTab('cf7')}
                  className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
                    selectedIntegrationTab === 'cf7'
                      ? 'border-blue-600 text-blue-600 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{t.integrations.tabCf7}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIntegrationTab('elementor')}
                  className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
                    selectedIntegrationTab === 'elementor'
                      ? 'border-blue-600 text-blue-600 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{t.integrations.tabElementor}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIntegrationTab('outgoing')}
                  className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
                    selectedIntegrationTab === 'outgoing'
                      ? 'border-blue-600 text-blue-600 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Share2 size={14} />
                  <span>{t.integrations.tabOutgoing}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIntegrationTab('logs')}
                  className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
                    selectedIntegrationTab === 'logs'
                      ? 'border-blue-600 text-blue-600 bg-white font-bold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText size={14} />
                  <span>{t.integrations.tabLogs}</span>
                </button>
              </div>

              {/* TAB 1: GOOGLE FORMS & APPS SCRIPT */}
              {selectedIntegrationTab === 'google_form' && (
                <div className="p-6 space-y-6">
                  {/* Webhook Endpoint Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded font-mono">POST</span>
                        <h3 className="font-bold text-slate-900 text-sm">{t.integrations.webhookUrlTitle}</h3>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{t.sessions.title}: <strong>{selectedSessionId || 'default'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`http://localhost:3000/api/v1/integrations/webhook/google_form/${selectedSessionId || 'default'}`}
                        className="font-mono text-xs text-slate-800 bg-white border border-slate-300 rounded-lg p-2.5 flex-1 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = `http://localhost:3000/api/v1/integrations/webhook/google_form/${selectedSessionId || 'default'}`;
                          navigator.clipboard.writeText(url);
                          setCopiedWebhookUrl(true);
                          setTimeout(() => setCopiedWebhookUrl(false), 2000);
                        }}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1rem' }}
                      >
                        {copiedWebhookUrl ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copiedWebhookUrl ? t.integrations.copiedUrl : t.integrations.copyUrl}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      💡 <strong>{lang === 'id' ? 'Petunjuk URL:' : 'URL Hint:'}</strong> {t.integrations.urlHint}
                    </p>
                  </div>

                  {/* Template & Form Configuration */}
                  {(() => {
                    const gfConfig = integrationConfigs.find(c => c.provider === 'google_form') || {
                      id: 'default_google_form',
                      provider: 'google_form' as const,
                      name: 'Google Forms Auto-Notification',
                      templateText: 'Halo *{name}*, terima kasih telah mengisi formulir *{form_name}*! ✨\n\nData respon Anda telah berhasil kami terima. Tim kami akan segera meninjau dan menghubungi Anda kembali.',
                      adminPhone: '',
                      adminTemplateText: '🔔 *Notifikasi Respon Formulir Baru*\n\n• Form: {form_name}\n• Pengirim: {name} ({phone})\n\nRespon baru berhasil tercatat di sistem.',
                      isActive: true,
                      createdAt: Date.now(),
                      updatedAt: Date.now()
                    };

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Template Editor Card */}
                        <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 text-sm">{t.integrations.templateConfigTitle}</h4>
                            <span className="status-pill ready">{lang === 'id' ? 'Penerima: Pengisi Form' : 'Recipient: Form Submitter'}</span>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-700 block">{t.integrations.templateTextLabel}</label>
                            <textarea
                              rows={5}
                              className="w-full text-xs border border-slate-300 rounded-lg p-3 font-sans leading-relaxed focus:border-blue-500 outline-none"
                              defaultValue={gfConfig.templateText}
                              id="gf-template-textarea"
                            />
                            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                              <span>{t.integrations.supportedVars}</span>
                              <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{'{name}'}</code>
                              <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{'{form_name}'}</code>
                              <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{'{phone}'}</code>
                              <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{'{data.Pertanyaan}'}</code>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <label className="text-xs font-semibold text-slate-700 block">{t.integrations.adminPhoneLabel}</label>
                            <input
                              type="text"
                              placeholder={lang === 'id' ? 'Contoh: 08123456789 (Kosongkan jika tidak perlu salinan)' : 'e.g. 628123456789 (Optional admin copy)'}
                              defaultValue={gfConfig.adminPhone || ''}
                              id="gf-admin-phone-input"
                              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const templateText = (document.getElementById('gf-template-textarea') as HTMLTextAreaElement)?.value || gfConfig.templateText;
                              const adminPhone = (document.getElementById('gf-admin-phone-input') as HTMLInputElement)?.value;
                              handleSaveIntegrationConfig({
                                id: gfConfig.id,
                                sessionId: selectedSessionId || undefined,
                                provider: 'google_form',
                                name: gfConfig.name,
                                templateText,
                                adminPhone: adminPhone || undefined,
                                isActive: true
                              });
                            }}
                            className="btn-primary w-full text-xs"
                            style={{ padding: '0.65rem' }}
                          >
                            <Check size={15} />
                            <span>{t.integrations.saveConfig}</span>
                          </button>
                        </div>

                        {/* Apps Script Guide & Code Card */}
                        <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <Code2 size={17} className="text-emerald-600" />
                              <span>{t.integrations.appsScriptCodeTitle}</span>
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                const code = `/**
 * WhatsAman — Google Apps Script WhatsApp Auto-Notification
 * Pasang di Google Sheet (Ekstensi > Apps Script)
 */
function onFormSubmit(e) {
  var webhookUrl = "http://localhost:3000/api/v1/integrations/webhook/google_form/${selectedSessionId || 'default'}";
  
  // Baca respon formulir dari Google Sheet
  var itemResponses = e.response ? e.response.getItemResponses() : [];
  var namedValues = e.namedValues || {};
  var nama = "";
  var noWhatsapp = "";
  
  if (itemResponses.length > 0) {
    for (var i = 0; i < itemResponses.length; i++) {
      var title = itemResponses[i].getItem().getTitle().toLowerCase();
      var resp = itemResponses[i].getResponse();
      if (title.indexOf("nama") !== -1 && !nama) nama = resp;
      if ((title.indexOf("wa") !== -1 || title.indexOf("whatsapp") !== -1 || title.indexOf("hp") !== -1 || title.indexOf("telepon") !== -1) && !noWhatsapp) noWhatsapp = resp;
    }
    if (!nama) nama = itemResponses[0].getResponse();
    if (!noWhatsapp && itemResponses.length > 1) noWhatsapp = itemResponses[1].getResponse();
  } else {
    // Jika trigger dipasang di Google Sheets Spreadsheet
    nama = (namedValues["Nama"] && namedValues["Nama"][0]) || (namedValues["Name"] && namedValues["Name"][0]) || (e.values && e.values[1]) || "Pelanggan";
    noWhatsapp = (namedValues["No WhatsApp"] && namedValues["No WhatsApp"][0]) || (namedValues["WhatsApp"] && namedValues["WhatsApp"][0]) || (namedValues["No HP"] && namedValues["No HP"][0]) || (e.values && e.values[2]) || "";
  }

  var payload = {
    form_name: e.source ? e.source.getTitle() : "Formulir Pendaftaran",
    name: nama,
    phone: noWhatsapp,
    data: namedValues
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var res = UrlFetchApp.fetch(webhookUrl, options);
    Logger.log("WhatsAman Response: " + res.getContentText());
  } catch (err) {
    Logger.log("Error sending webhook: " + err.toString());
  }
}`;
                                navigator.clipboard.writeText(code);
                                setCopiedScriptCode(true);
                                setTimeout(() => setCopiedScriptCode(false), 2000);
                              }}
                              className="btn-secondary text-xs"
                              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.35rem 0.75rem' }}
                            >
                              {copiedScriptCode ? <Check size={14} /> : <Copy size={14} />}
                              <span>{copiedScriptCode ? t.integrations.copiedScriptCode : t.integrations.copyScriptCode}</span>
                            </button>
                          </div>

                          <div className="bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-[11px] overflow-x-auto max-h-64 leading-relaxed">
                            <pre>{`function onFormSubmit(e) {
  var webhookUrl = "http://localhost:3000/api/v1/integrations/webhook/google_form/${selectedSessionId || 'default'}";
  
  var nama = (e.namedValues && e.namedValues["Nama"] && e.namedValues["Nama"][0]) || e.values[1];
  var phone = (e.namedValues && e.namedValues["No WhatsApp"] && e.namedValues["No WhatsApp"][0]) || e.values[2];

  var payload = {
    form_name: "Formulir Pendaftaran",
    name: nama,
    phone: phone,
    data: e.namedValues
  };

  UrlFetchApp.fetch(webhookUrl, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });
}`}</pre>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1.5">
                            <span className="font-bold block">{t.integrations.appsScriptGuideTitle}:</span>
                            <ol className="list-decimal pl-4 space-y-1 text-slate-700">
                              <li>{t.integrations.step1}</li>
                              <li>{t.integrations.step2}</li>
                              <li>{t.integrations.step3}</li>
                              <li>{t.integrations.step4}</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 2: WOOCOMMERCE */}
              {selectedIntegrationTab === 'woocommerce' && (
                <div className="p-6 space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-600 text-white text-[11px] font-bold px-2 py-0.5 rounded font-mono">POST</span>
                        <h3 className="font-bold text-slate-900 text-sm">{lang === 'id' ? 'URL Webhook WooCommerce Order' : 'WooCommerce Order Webhook URL'}</h3>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{t.sessions.title}: <strong>{selectedSessionId || 'default'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`http://localhost:3000/api/v1/integrations/webhook/woocommerce/${selectedSessionId || 'default'}`}
                        className="font-mono text-xs text-slate-800 bg-white border border-slate-300 rounded-lg p-2.5 flex-1 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = `http://localhost:3000/api/v1/integrations/webhook/woocommerce/${selectedSessionId || 'default'}`;
                          navigator.clipboard.writeText(url);
                          setCopiedWebhookUrl(true);
                          setTimeout(() => setCopiedWebhookUrl(false), 2000);
                        }}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1rem' }}
                      >
                        {copiedWebhookUrl ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copiedWebhookUrl ? t.integrations.copiedUrl : t.integrations.copyUrl}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-500">
                      {lang === 'id'
                        ? 'Cara Pasang di WordPress: WooCommerce > Settings > Advanced > Webhooks > Add Webhook ➔ Topic: Order created / Order updated ➔ Delivery URL: masukkan URL di atas.'
                        : 'Setup in WordPress: WooCommerce > Settings > Advanced > Webhooks > Add Webhook ➔ Topic: Order created / Order updated ➔ Delivery URL: paste the URL above.'}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: CONTACT FORM 7 */}
              {selectedIntegrationTab === 'cf7' && (
                <div className="p-6 space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded font-mono">POST</span>
                        <h3 className="font-bold text-slate-900 text-sm">{lang === 'id' ? 'URL Webhook Contact Form 7 (WordPress)' : 'Contact Form 7 Webhook URL (WordPress)'}</h3>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{t.sessions.title}: <strong>{selectedSessionId || 'default'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`http://localhost:3000/api/v1/integrations/webhook/cf7/${selectedSessionId || 'default'}`}
                        className="font-mono text-xs text-slate-800 bg-white border border-slate-300 rounded-lg p-2.5 flex-1 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = `http://localhost:3000/api/v1/integrations/webhook/cf7/${selectedSessionId || 'default'}`;
                          navigator.clipboard.writeText(url);
                          setCopiedWebhookUrl(true);
                          setTimeout(() => setCopiedWebhookUrl(false), 2000);
                        }}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1rem' }}
                      >
                        {copiedWebhookUrl ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copiedWebhookUrl ? t.integrations.copiedUrl : t.integrations.copyUrl}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ELEMENTOR */}
              {selectedIntegrationTab === 'elementor' && (
                <div className="p-6 space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded font-mono">POST</span>
                        <h3 className="font-bold text-slate-900 text-sm">{lang === 'id' ? 'URL Webhook Elementor Pro Form' : 'Elementor Pro Form Webhook URL'}</h3>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{t.sessions.title}: <strong>{selectedSessionId || 'default'}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`http://localhost:3000/api/v1/integrations/webhook/elementor/${selectedSessionId || 'default'}`}
                        className="font-mono text-xs text-slate-800 bg-white border border-slate-300 rounded-lg p-2.5 flex-1 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = `http://localhost:3000/api/v1/integrations/webhook/elementor/${selectedSessionId || 'default'}`;
                          navigator.clipboard.writeText(url);
                          setCopiedWebhookUrl(true);
                          setTimeout(() => setCopiedWebhookUrl(false), 2000);
                        }}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1rem' }}
                      >
                        {copiedWebhookUrl ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copiedWebhookUrl ? t.integrations.copiedUrl : t.integrations.copyUrl}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      {lang === 'id'
                        ? 'Cara Pasang di Elementor: Buka widget Form ➔ Actions After Submit ➔ Pilih Webhook ➔ Masukkan Webhook URL di atas.'
                        : 'Setup in Elementor: Open Form widget ➔ Actions After Submit ➔ Choose Webhook ➔ Paste the Webhook URL above.'}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 5: OUTGOING WEBHOOKS */}
              {selectedIntegrationTab === 'outgoing' && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{t.integrations.outgoingTableTitle}</h4>
                      <p className="text-xs text-slate-500">{t.integrations.outgoingSubtitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddOutgoingWebhookModal(true)}
                      className="btn-primary text-xs"
                      style={{ padding: '0.5rem 0.85rem' }}
                    >
                      <Plus size={14} />
                      <span>{t.integrations.addOutgoing}</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="py-2.5 px-4">{t.integrations.colName}</th>
                          <th className="py-2.5 px-4">{t.integrations.colTargetUrl}</th>
                          <th className="py-2.5 px-4">{t.integrations.colEvents}</th>
                          <th className="py-2.5 px-4">{t.integrations.colStatus}</th>
                          <th className="py-2.5 px-4 text-right">{t.integrations.colActions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {outgoingWebhooks.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              {t.integrations.noOutgoing}
                            </td>
                          </tr>
                        ) : (
                          outgoingWebhooks.map(w => (
                            <tr key={w.id} className="hover:bg-slate-50 transition">
                              <td className="py-2.5 px-4 font-bold text-slate-900">{w.name}</td>
                              <td className="py-2.5 px-4 font-mono text-[11px] text-blue-700 max-w-xs truncate">{w.targetUrl}</td>
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {(w.events || ['all']).map((ev, i) => (
                                    <span key={i} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                      {ev}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-2.5 px-4">
                                <span className={`status-pill ${w.isActive ? 'ready' : 'disconnected'}`}>
                                  {w.isActive ? t.common.active : t.common.inactive}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleTestOutgoingWebhook(w.id)}
                                    className="btn-secondary btn-sm"
                                    title={t.integrations.testPing}
                                  >
                                    <Send size={12} />
                                    <span>{t.integrations.testPing}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOutgoingWebhook(w.id)}
                                    className="btn-icon text-rose-500 hover:bg-rose-50"
                                    title={t.common.delete}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: LOGS */}
              {selectedIntegrationTab === 'logs' && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{t.integrations.logsTitle}</h4>
                    <span className="text-xs text-slate-500">{lang === 'id' ? '50 catatan terakhir' : 'Last 50 records'}</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="py-2.5 px-4">{t.integrations.colTime}</th>
                          <th className="py-2.5 px-4">{t.integrations.colProvider}</th>
                          <th className="py-2.5 px-4">{t.integrations.colTargetWa}</th>
                          <th className="py-2.5 px-4">{t.integrations.colStatus}</th>
                          <th className="py-2.5 px-4">{t.integrations.colPayload}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {integrationLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">
                              {t.integrations.noLogs}
                            </td>
                          </tr>
                        ) : (
                          integrationLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 transition">
                              <td className="py-2.5 px-4 mono text-[11px] text-slate-500 whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')}
                              </td>
                              <td className="py-2.5 px-4">
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                                  {log.provider}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                                {formatPhoneForDisplay(log.targetPhone) || log.targetPhone}
                              </td>
                              <td className="py-2.5 px-4">
                                <span className={`status-pill ${log.status === 'SUCCESS' ? 'ready' : 'disconnected'}`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 max-w-xs truncate font-mono text-[11px] text-slate-700">
                                {log.errorMessage ? (
                                  <span className="text-rose-600 font-sans">{log.errorMessage}</span>
                                ) : (
                                  JSON.stringify(log.payload)
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Test Trigger Modal */}
            {isTestIntegrationModal && (
              <div className="modal-backdrop">
                <div className="modal-card max-w-md w-full p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Send size={18} className="text-blue-600" />
                      <span>{t.integrations.testModalTitle}</span>
                    </h3>
                    <button type="button" onClick={() => setIsTestIntegrationModal(false)} className="btn-icon">
                      <X size={18} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500">
                    {t.integrations.testModalDesc}
                  </p>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">{t.integrations.testSenderName}:</label>
                      <input
                        type="text"
                        value={testIntegrationName}
                        onChange={e => setTestIntegrationName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">{t.integrations.testTargetPhone}:</label>
                      <input
                        type="text"
                        placeholder="Contoh: 08123456789 atau 628123456789"
                        value={testIntegrationPhone}
                        onChange={e => setTestIntegrationPhone(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">{t.integrations.testFormName}:</label>
                      <input
                        type="text"
                        value={testIntegrationFormName}
                        onChange={e => setTestIntegrationFormName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 outline-none"
                      />
                    </div>

                    {testIntegrationResult && (
                      <div className={`p-3 rounded-lg text-xs ${testIntegrationResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                        <div className="font-bold">{testIntegrationResult.success ? '✅ Webhook Berhasil Diproses!' : '❌ Gagal Memproses Webhook'}</div>
                        <div className="text-[11px] mt-1">{testIntegrationResult.message}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button type="button" onClick={() => setIsTestIntegrationModal(false)} className="btn-secondary text-xs">
                      {t.common.close}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestIncomingWebhook}
                      disabled={testIntegrationLoading}
                      className="btn-primary text-xs"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {testIntegrationLoading && <RefreshCw size={13} className="animate-spin" />}
                      <span>{testIntegrationLoading ? `${t.integrations.testSendButton}...` : t.integrations.testSendButton}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Outgoing Webhook Modal */}
            {isAddOutgoingWebhookModal && (
              <div className="modal-backdrop">
                <div className="modal-card max-w-md w-full p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Share2 size={18} className="text-blue-600" />
                      <span>{t.integrations.addOutgoing}</span>
                    </h3>
                    <button type="button" onClick={() => setIsAddOutgoingWebhookModal(false)} className="btn-icon">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">{t.integrations.colName}:</label>
                      <input
                        type="text"
                        placeholder="Contoh: CRM Server Notifier"
                        value={newWebhookName}
                        onChange={e => setNewWebhookName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">{t.integrations.colTargetUrl} (HTTPS):</label>
                      <input
                        type="text"
                        placeholder="https://api.yourdomain.com/whatsapp-event"
                        value={newWebhookUrl}
                        onChange={e => setNewWebhookUrl(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 outline-none font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Secret Key / Token ({lang === 'id' ? 'Opsional' : 'Optional'}):</label>
                      <input
                        type="password"
                        placeholder="Untuk verifikasi signature X-Hub-Signature"
                        value={newWebhookSecret}
                        onChange={e => setNewWebhookSecret(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 outline-none font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button type="button" onClick={() => setIsAddOutgoingWebhookModal(false)} className="btn-secondary text-xs">
                      {t.common.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateOutgoingWebhook}
                      className="btn-primary text-xs"
                    >
                      {t.integrations.addOutgoing}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 9. INFRASTRUCTURE & SYSTEM ==================== */}
        {activeTab === 'infrastructure' && (
          <div className="space-y-6">
            <header className="page-header">
              <div className="page-header__title-group">
                <h1>{t.infrastructure.title}</h1>
                <span className="status-badge connected">{lang === 'id' ? 'Telemetri Aktif' : 'Telemetry Active'}</span>
              </div>
              <div className="page-header__actions">
                <button onClick={handleCreateBackup} className="btn-primary">
                  <Download size={15} />
                  <span>{t.infrastructure.createBackup}</span>
                </button>
              </div>
              <p className="page-header__subtitle">
                {t.infrastructure.subtitle}
              </p>
            </header>

            {/* Metrics cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <Server className="stat-watermark" />
                <div className="stat-header">
                  <span className="stat-label">{t.infrastructure.ramHeapUsed}</span>
                  <Server size={18} className="stat-icon" />
                </div>
                <div className="stat-value">{systemStatus ? `${systemStatus.memory.heapUsedMb} MB` : '—'}</div>
                <div className="stat-detail">RSS: {systemStatus ? `${systemStatus.memory.rssMb} MB` : '—'}</div>
              </div>

              <div className="stat-card">
                <ShieldCheck className="stat-watermark" />
                <div className="stat-header">
                  <span className="stat-label">{t.infrastructure.portableStorage}</span>
                  <ShieldCheck size={18} className="stat-icon" />
                </div>
                <div className="stat-value text-xl font-bold truncate">
                  {systemStatus?.isPortable ? (lang === 'id' ? 'Mode Portable' : 'Portable Mode') : 'Standard'}
                </div>
                <div className="stat-detail truncate mono">{systemStatus?.storageDir}</div>
              </div>

              <div className="stat-card">
                <Activity className="stat-watermark" />
                <div className="stat-header">
                  <span className="stat-label">{t.infrastructure.uptime}</span>
                  <Clock size={18} className="stat-icon" />
                </div>
                <div className="stat-value">
                  {systemStatus ? `${Math.floor(systemStatus.uptimeSeconds / 60)} ${lang === 'id' ? 'menit' : 'min'}` : '—'}
                </div>
                <div className="stat-detail">Seconds: {systemStatus?.uptimeSeconds || 0}s</div>
              </div>

              <div className="stat-card">
                <Layers className="stat-watermark" />
                <div className="stat-header">
                  <span className="stat-label">{t.infrastructure.totalBackups}</span>
                  <HardDrive size={18} className="stat-icon" />
                </div>
                <div className="stat-value">{backups.length}</div>
                <div className="stat-detail">{lang === 'id' ? 'Arsip cadangan lokal' : 'Local snapshot archives'}</div>
              </div>
            </div>

            {/* Backups List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">{t.infrastructure.backupsListTitle}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="table-header" style={{ display: 'table-header-group' }}>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-2.5 px-4">{t.infrastructure.colFileName}</th>
                      <th className="py-2.5 px-4">{t.infrastructure.colSize}</th>
                      <th className="py-2.5 px-4">{t.infrastructure.colCreatedAt}</th>
                      <th className="py-2.5 px-4 text-right">{t.infrastructure.colAction}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {backups.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          {t.infrastructure.noBackups}
                        </td>
                      </tr>
                    ) : (
                      backups.map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{b.fileName}</td>
                          <td className="py-2.5 px-4 mono">{b.sizeKb} KB</td>
                          <td className="py-2.5 px-4">{new Date(b.createdAt).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')}</td>
                          <td className="py-2.5 px-4 text-right">
                            <a href={b.downloadUrl} download className="btn-secondary btn-sm">
                              <Download size={13} />
                              <span>{t.infrastructure.downloadBackup}</span>
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 10. AUDIT LOGS ==================== */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <header className="page-header">
              <div className="page-header__title-group">
                <h1>{t.logs.title}</h1>
                <span className="status-badge connected">{auditLogs.length} Events</span>
              </div>
              <div className="page-header__actions">
                <button onClick={fetchAuditLogs} className="btn-secondary">
                  <RefreshCw size={15} />
                  <span>{lang === 'id' ? 'Segarkan Log' : 'Refresh Trace'}</span>
                </button>
              </div>
              <p className="page-header__subtitle">{t.logs.subtitle}</p>
            </header>

            {/* Filter buttons */}
            <div className="flex gap-2">
              {['ALL', 'session.', 'message.', 'campaign.', 'contact.'].map(f => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`btn-sm ${logFilter === f ? 'bg-emerald-500 text-slate-900 font-bold border-emerald-500' : 'btn-secondary'}`}
                >
                  {f === 'ALL' ? (lang === 'id' ? 'Semua Event' : 'All Events') : `${f}*`}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="table-header" style={{ display: 'table-header-group' }}>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-2.5 px-4">{t.logs.colTime}</th>
                      <th className="py-2.5 px-4">{t.logs.colType}</th>
                      <th className="py-2.5 px-4">{t.logs.colMessage}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-400">
                          {t.logs.noLogs}
                        </td>
                      </tr>
                    ) : (
                      auditLogs
                        .filter(l => logFilter === 'ALL' || l.event_type.startsWith(logFilter))
                        .map(l => (
                          <tr key={l.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                              {new Date(l.created_at).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="status-pill ready font-mono text-[10px]">{l.event_type}</span>
                            </td>
                            <td className="py-2.5 px-4 font-mono text-xs text-slate-800 truncate max-w-xl">
                              {JSON.stringify(l.payload)}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================== MODALS ==================== */}

      {/* 1. Modal: New Session */}
      {isAddSessionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{t.sessions.modalNewTitle}</h2>
              <button onClick={() => setIsAddSessionModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{t.sessions.modalSessionId}</label>
                <input
                  type="text"
                  placeholder={lang === 'id' ? 'contoh: support-1 atau sales-wa' : 'e.g. support-1 or sales-wa'}
                  value={newSessionId}
                  onChange={e => setNewSessionId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{t.sessions.modalSessionName}</label>
                <input
                  type="text"
                  placeholder={lang === 'id' ? 'contoh: Layanan Pelanggan Pusat' : 'e.g. Customer Support Hotline'}
                  value={newSessionName}
                  onChange={e => setNewSessionName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{t.sessions.loginMethod}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLoginMethod('qr')}
                    className={`btn-sm flex-1 ${loginMethod === 'qr' ? 'bg-emerald-500 text-slate-900 font-bold border-emerald-500' : 'btn-secondary'}`}
                  >
                    {t.sessions.qrMethod}
                  </button>
                  <button
                    onClick={() => setLoginMethod('pairing')}
                    className={`btn-sm flex-1 ${loginMethod === 'pairing' ? 'bg-emerald-500 text-slate-900 font-bold border-emerald-500' : 'btn-secondary'}`}
                  >
                    {t.sessions.pairingMethod}
                  </button>
                </div>
              </div>

              {loginMethod === 'pairing' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {t.sessions.phoneNumberInput}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 628123456789"
                    value={pairingPhone}
                    onChange={e => setPairingPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">{lang === 'id' ? 'Kode verifikasi 8 digit akan ditampilkan untuk dipasangkan.' : 'An 8-digit verification code will be displayed for pairing.'}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsAddSessionModal(false)} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button onClick={handleCreateSession} disabled={!newSessionId.trim()} className="btn-primary">
                {t.sessions.startConnecting}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: QR / Pairing Code Inspector */}
      {activeQrModal.open && activeQrModal.session && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Pairing: {activeQrModal.session.name}</h2>
              <button onClick={() => setActiveQrModal({ open: false, session: null })} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body text-center space-y-4">
              {activeQrModal.session.status === 'CONNECTED' ? (
                <div className="py-8 space-y-2">
                  <CheckCircle size={48} className="mx-auto text-emerald-500" />
                  <h3 className="font-bold text-slate-800 text-base">{lang === 'id' ? 'Sesi Sudah Terhubung' : 'Session Already Connected'}</h3>
                  <p className="text-xs text-slate-500">
                    Phone: +{activeQrModal.session.phoneNumber || 'Linked'}
                  </p>
                </div>
              ) : activeQrModal.session.status === 'QR_READY' && activeQrModal.session.qrCode ? (
                <div className="space-y-3">
                  <img
                    src={activeQrModal.session.qrCode}
                    alt="Scan QR"
                    className="w-56 h-56 mx-auto rounded-xl shadow-sm border border-slate-200"
                  />
                  <p className="text-xs font-semibold text-slate-700">{t.sessions.scanQrTitle}</p>
                  <p className="text-[11px] text-slate-400">{t.sessions.scanQrDesc}</p>
                </div>
              ) : activeQrModal.session.pairingCode ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    {t.sessions.pairingCodeTitle}
                  </span>
                  <div className="text-3xl font-black mono text-emerald-900 tracking-widest my-2 select-all">
                    {activeQrModal.session.pairingCode}
                  </div>
                  <p className="text-xs text-emerald-700">{t.sessions.pairingCodeDesc}</p>
                </div>
              ) : (
                <div className="py-8 space-y-3 text-slate-400">
                  <RefreshCw size={36} className="mx-auto animate-spin text-slate-300" />
                  <p className="text-xs">{lang === 'id' ? 'Menyiapkan soket koneksi... harap tunggu.' : 'Preparing connection socket... please wait.'}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setActiveQrModal({ open: false, session: null })} className="btn-secondary">
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Re-Connect Options */}
      {connectOptionModal.open && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{lang === 'id' ? 'Hubungkan Sesi' : 'Connect Session'}: {connectOptionModal.sessionId}</h2>
              <button onClick={() => setConnectOptionModal(prev => ({ ...prev, open: false }))} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{t.sessions.loginMethod}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConnectOptionModal(prev => ({ ...prev, method: 'qr' }))}
                    className={`btn-sm flex-1 ${connectOptionModal.method === 'qr' ? 'bg-emerald-500 text-slate-900 font-bold border-emerald-500' : 'btn-secondary'}`}
                  >
                    {t.sessions.qrMethod}
                  </button>
                  <button
                    onClick={() => setConnectOptionModal(prev => ({ ...prev, method: 'pairing' }))}
                    className={`btn-sm flex-1 ${connectOptionModal.method === 'pairing' ? 'bg-emerald-500 text-slate-900 font-bold border-emerald-500' : 'btn-secondary'}`}
                  >
                    {t.sessions.pairingMethod}
                  </button>
                </div>
              </div>

              {connectOptionModal.method === 'pairing' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">{t.sessions.phoneNumberInput}</label>
                  <input
                    type="text"
                    placeholder="e.g. 628123456789"
                    value={connectOptionModal.phone}
                    onChange={e => setConnectOptionModal(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setConnectOptionModal(prev => ({ ...prev, open: false }))} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button
                onClick={async () => {
                  const sId = connectOptionModal.sessionId;
                  const usePairing = connectOptionModal.method === 'pairing';
                  setConnectOptionModal(prev => ({ ...prev, open: false }));
                  const foundSession = sessions.find(s => s.id === sId);
                  setActiveQrModal({
                    open: true,
                    session: foundSession || {
                      id: sId,
                      name: sId,
                      status: 'CONNECTING',
                      createdAt: Date.now()
                    }
                  });
                  await fetch(`/api/v1/sessions/${sId}/connect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      usePairingCode: usePairing,
                      phoneNumber: connectOptionModal.phone
                    })
                  });
                  fetchSessions();
                  addLog(`Menghubungkan sesi ${sId}...`, 'info');
                }}
                className="btn-primary"
              >
                {t.sessions.startConnecting}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Add Contact */}
      {isAddContactModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{lang === 'id' ? 'Tambah Kontak Baru' : 'Add New Contact'}</h2>
              <button onClick={() => setIsAddContactModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{t.contacts.colPhone}</label>
                <input
                  type="text"
                  placeholder="e.g. 628123456789"
                  value={newContactPhone}
                  onChange={e => setNewContactPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{t.contacts.colName}</label>
                <input
                  type="text"
                  placeholder={lang === 'id' ? 'contoh: Budi Santoso' : 'e.g. Budi Santoso'}
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{lang === 'id' ? 'Tags / Group Kontak (Dipisahkan koma)' : 'Tags / Groups (Comma separated)'}</label>
                <input
                  type="text"
                  placeholder={lang === 'id' ? 'Contoh: Produk A, VIP, Reseller' : 'e.g. Product A, VIP, Reseller'}
                  value={newContactTags}
                  onChange={e => setNewContactTags(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-500 font-medium mr-1">{lang === 'id' ? 'Saran:' : 'Suggestions:'}</span>
                  {['Produk A', 'Produk B', 'VIP', 'Reseller', 'Pelanggan']
                    .concat(availableTags.map(t => t.tag).filter(t => !['Produk A', 'Produk B', 'VIP', 'Reseller', 'Pelanggan'].includes(t)))
                    .slice(0, 6)
                    .map(suggestedTag => {
                      const cur = newContactTags.split(',').map(s => s.trim()).filter(Boolean);
                      const isAdded = cur.includes(suggestedTag);
                      return (
                        <button
                          key={suggestedTag}
                          type="button"
                          onClick={() => {
                            if (!isAdded) {
                              setNewContactTags(cur.length > 0 ? `${newContactTags}, ${suggestedTag}` : suggestedTag);
                            }
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                            isAdded
                              ? 'bg-blue-100 text-blue-800 border-blue-300 font-semibold'
                              : 'bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border-slate-200'
                          }`}
                        >
                          {isAdded ? '✓ ' : '+ '}
                          {suggestedTag}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsAddContactModal(false)} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button onClick={handleAddContact} disabled={!newContactPhone.trim()} className="btn-primary">
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4b. Modal: Edit Contact Groups / Tags */}
      {isEditContactTagsModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{lang === 'id' ? 'Atur Group Kontak' : 'Manage Contact Groups / Tags'}</h2>
              <button onClick={() => setIsEditContactTagsModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{lang === 'id' ? 'Kontak Target' : 'Target Contact'}</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <div className="font-semibold text-slate-800">{editingContactName}</div>
                  <div className="font-mono text-slate-500 mt-0.5">+{editingContactPhone}</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {lang === 'id' ? 'Group / Kategori Kontak (Dipisahkan koma)' : 'Contact Groups / Tags (Comma separated)'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'id' ? 'Contoh: Produk A, Produk B, VIP' : 'e.g. Product A, VIP, Reseller'}
                  value={editingContactTags}
                  onChange={e => setEditingContactTags(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {lang === 'id' ? 'Kontak dapat dimasukkan ke satu atau beberapa grup sekaligus.' : 'Contacts can be assigned to one or multiple groups simultaneously.'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">{lang === 'id' ? 'Klik Cepat Group:' : 'Quick Tag Select:'}</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Produk A', 'Produk B', 'Produk C', 'VIP', 'Reseller', 'Member', 'Lead']
                    .concat(availableTags.map(t => t.tag).filter(t => !['Produk A', 'Produk B', 'Produk C', 'VIP', 'Reseller', 'Member', 'Lead'].includes(t)))
                    .map(suggestedTag => {
                      const currentTagsList = editingContactTags.split(',').map(s => s.trim()).filter(Boolean);
                      const isSelected = currentTagsList.includes(suggestedTag);
                      return (
                        <button
                          key={suggestedTag}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setEditingContactTags(currentTagsList.filter(t => t !== suggestedTag).join(', '));
                            } else {
                              setEditingContactTags([...currentTagsList, suggestedTag].join(', '));
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {suggestedTag}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsEditContactTagsModal(false)} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button onClick={handleSaveContactTags} className="btn-primary">
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4.5 Modal: Quick Broadcast via Chats */}
      {isChatBroadcastModal && (
        <div className="modal-overlay">
          <div className="modal max-w-xl">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-sky-600" />
                <h2 className="font-bold text-slate-800">{lang === 'id' ? 'Kirim Broadcast Pesan WhatsApp' : 'Dispatch WhatsApp Broadcast'}</h2>
              </div>
              <button onClick={() => setIsChatBroadcastModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4 max-h-[75vh] overflow-y-auto p-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{t.common.selectSession}</label>
                <select
                  value={chatBroadcastSessionId}
                  onChange={e => setChatBroadcastSessionId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                >
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phoneNumber || 'Unpaired'}) - Status: {s.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{lang === 'id' ? 'Target / Penerima Broadcast' : 'Audience / Target Recipients'}</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setChatBroadcastMode('manual')}
                    className={`py-1.5 px-3 text-xs font-medium rounded-lg border text-center transition ${chatBroadcastMode === 'manual' ? 'bg-sky-50 border-sky-500 text-sky-700 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {lang === 'id' ? 'Input Manual / Paste' : 'Manual Input / Paste'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatBroadcastMode('select')}
                    className={`py-1.5 px-3 text-xs font-medium rounded-lg border text-center transition ${chatBroadcastMode === 'select' ? 'bg-sky-50 border-sky-500 text-sky-700 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {lang === 'id' ? `Pilih Dari Chat (${chats.length})` : `Select From Chats (${chats.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatBroadcastMode('tag')}
                    className={`py-1.5 px-3 text-xs font-medium rounded-lg border text-center transition ${chatBroadcastMode === 'tag' ? 'bg-sky-50 border-sky-500 text-sky-700 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {lang === 'id' ? 'Berdasarkan Tag / Group' : 'By Tag / Contact Group'}
                  </button>
                </div>

                {chatBroadcastMode === 'manual' && (
                  <div>
                    <textarea
                      rows={4}
                      placeholder={lang === 'id' ? `Masukkan nomor telepon (dipisah koma atau baris baru):\n628123456789\n08987654321, Pak Budi\n628567890123` : `Enter phone numbers (separated by comma or newline):\n628123456789\n08987654321, John Doe\n628567890123`}
                      value={chatBroadcastManualNumbers}
                      onChange={e => setChatBroadcastManualNumbers(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">{lang === 'id' ? 'Format: 628xxx atau 08xxx. Anda dapat memasukkan nama setelah koma.' : 'Format: 628xxx or 08xxx. You can append recipient name after comma.'}</p>
                  </div>
                )}

                {chatBroadcastMode === 'select' && (
                  <div className="border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1 bg-slate-50">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                      <span className="text-xs text-slate-500 font-medium">{lang === 'id' ? `Terpilih: ${chatBroadcastSelectedPhones.length} nomor` : `Selected: ${chatBroadcastSelectedPhones.length} numbers`}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setChatBroadcastSelectedPhones(chats.map(c => c.chat_jid.replace(/[^0-9]/g, '')).filter(Boolean))}
                          className="text-[11px] text-sky-600 hover:underline font-medium"
                        >
                          {lang === 'id' ? 'Pilih Semua' : 'Select All'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setChatBroadcastSelectedPhones([])}
                          className="text-[11px] text-slate-500 hover:underline"
                        >
                          {lang === 'id' ? 'Batal Semua' : 'Clear All'}
                        </button>
                      </div>
                    </div>
                    {chats.map(chat => {
                      const phone = chat.chat_jid.replace(/[^0-9]/g, '');
                      const isChecked = chatBroadcastSelectedPhones.includes(phone);
                      return (
                        <label key={chat.chat_jid} className="flex items-center gap-2 p-1.5 hover:bg-white rounded cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setChatBroadcastSelectedPhones([...chatBroadcastSelectedPhones, phone]);
                              } else {
                                setChatBroadcastSelectedPhones(chatBroadcastSelectedPhones.filter(p => p !== phone));
                              }
                            }}
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          />
                          <span className="font-semibold text-slate-800">{chat.name || formatPhoneForDisplay(phone)}</span>
                          <span className="text-slate-400 mono text-[11px] ml-auto">{formatPhoneForDisplay(phone)}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {chatBroadcastMode === 'tag' && (
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">{lang === 'id' ? 'Pilih Tag / Group Kontak' : 'Select Tag / Contact Group'}</label>
                    <select
                      value={chatBroadcastTag}
                      onChange={e => setChatBroadcastTag(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                    >
                      <option value="ALL">{lang === 'id' ? 'Semua Kontak (Aktif)' : 'All Contacts (Active)'}</option>
                      {availableTags.map(t => (
                        <option key={t.tag} value={t.tag}>{t.tag} ({t.count})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{lang === 'id' ? 'Isi Pesan Broadcast' : 'Broadcast Message Content'}</label>
                <textarea
                  rows={4}
                  placeholder={lang === 'id' ? 'Ketik pesan broadcast... Gunakan {{name}} untuk nama & {Halo|Hi} untuk acak spintax.' : 'Type broadcast message... Use {{name}} for name & {Hello|Hi} for spintax.'}
                  value={chatBroadcastMessage}
                  onChange={e => setChatBroadcastMessage(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>{lang === 'id' ? 'Mendukung variabel {{name}} dan Spintax {opsi1|opsi2}' : 'Supports variables {{name}} and Spintax {option1|option2}'}</span>
                  <span>{chatBroadcastMessage.length} {lang === 'id' ? 'Karakter' : 'Characters'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">{lang === 'id' ? 'Delay Minimal (detik)' : 'Min Delay (seconds)'}</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={chatBroadcastDelayMin}
                    onChange={e => setChatBroadcastDelayMin(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">{lang === 'id' ? 'Delay Maksimal (detik)' : 'Max Delay (seconds)'}</label>
                  <input
                    type="number"
                    min={2}
                    max={120}
                    value={chatBroadcastDelayMax}
                    onChange={e => setChatBroadcastDelayMax(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setIsChatBroadcastModal(false)} className="btn-secondary" disabled={chatBroadcastSending}>
                {t.common.cancel}
              </button>
              <button onClick={handleSendChatBroadcast} disabled={chatBroadcastSending} className="btn-primary bg-sky-600 hover:bg-sky-700">
                {chatBroadcastSending ? (lang === 'id' ? 'Memproses...' : 'Processing...') : (lang === 'id' ? '🚀 Mulai Kirim Broadcast' : '🚀 Launch Broadcast')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4.6 Modal: Quick Auto Reply Settings via Chats */}
      {isChatAutoReplyModal && (
        <div className="modal-overlay">
          <div className="modal max-w-xl">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-emerald-600" />
                <h2 className="font-bold text-slate-800">{lang === 'id' ? 'Pengaturan Quick Auto Reply' : 'Quick Auto Reply Settings'}</h2>
              </div>
              <button onClick={() => setIsChatAutoReplyModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4 max-h-[75vh] overflow-y-auto p-4">
              {/* Main Toggle Switch Banner */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between transition ${botConfig.autoReplyEnabled !== false ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Zap size={14} className={botConfig.autoReplyEnabled !== false ? 'text-emerald-600' : 'text-slate-400'} />
                    {lang === 'id' ? 'Status Balas Otomatis Sesi' : 'Session Auto-Reply Status'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {botConfig.autoReplyEnabled !== false ? (lang === 'id' ? 'Bot aktif menjawab pesan masuk secara otomatis' : 'Bot actively replies to incoming messages') : (lang === 'id' ? 'Auto-reply mati. Semua pesan masuk harus dibalas manual.' : 'Auto-reply disabled. Reply manually.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleAutoReplyGlobal(botConfig.autoReplyEnabled === false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 text-white transition ${botConfig.autoReplyEnabled !== false ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-500 hover:bg-slate-600'}`}
                >
                  {botConfig.autoReplyEnabled !== false ? <Check size={14} /> : <X size={14} />}
                  <span>{botConfig.autoReplyEnabled !== false ? (lang === 'id' ? 'AKTIF' : 'ACTIVE') : 'OFF'}</span>
                </button>
              </div>

              {/* Rules List Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700">{lang === 'id' ? `Aturan Keyword / Kata Kunci (${rules.length})` : `Keyword Rules (${rules.length})`}</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChatAutoReplyModal(false);
                      setActiveTab('automation');
                    }}
                    className="text-[11px] text-sky-600 hover:underline font-semibold"
                  >
                    {lang === 'id' ? 'Kelola Semua Aturan →' : 'Manage All Rules →'}
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                  {rules.length === 0 ? (
                    <p className="text-[11px] text-slate-400 text-center py-3">{lang === 'id' ? 'Belum ada aturan kata kunci. Klik tombol kelola untuk membuat aturan baru.' : 'No keyword rules created yet. Click manage to create rules.'}</p>
                  ) : (
                    rules.map(rule => (
                      <div key={rule.id} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-xs">
                        <div>
                          <span className="font-semibold text-slate-800">{rule.name}</span>
                          <div className="text-[10px] text-slate-500">{t.automation.hitCount}: {rule.hit_count}x</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleRule(rule.id, rule.is_active)}
                          className={`px-2 py-1 rounded text-[11px] font-bold ${rule.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {rule.is_active ? t.common.active : t.common.inactive}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Offline & Business Hours Config */}
              <div className="space-y-3 border-t border-slate-200 pt-3">
                <h4 className="text-xs font-bold text-slate-700">{t.automation.workingHours}</h4>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={botConfig.businessHoursEnabled}
                    onChange={e => setBotConfig({ ...botConfig, businessHoursEnabled: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{lang === 'id' ? 'Aktifkan Batasan Jam Operasional (08:00 - 17:00)' : 'Enable Business Hours Constraint (08:00 - 17:00)'}</span>
                </label>

                {botConfig.businessHoursEnabled && (
                  <div className="grid grid-cols-2 gap-2 pl-5">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">{lang === 'id' ? 'Jam Buka' : 'Start Time'}</label>
                      <input
                        type="time"
                        value={botConfig.businessHoursStart}
                        onChange={e => setBotConfig({ ...botConfig, businessHoursStart: e.target.value })}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">{lang === 'id' ? 'Jam Tutup' : 'End Time'}</label>
                      <input
                        type="time"
                        value={botConfig.businessHoursEnd}
                        onChange={e => setBotConfig({ ...botConfig, businessHoursEnd: e.target.value })}
                        className="w-full border border-slate-200 rounded p-1.5 text-xs"
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={botConfig.offlineReplyEnabled}
                    onChange={e => setBotConfig({ ...botConfig, offlineReplyEnabled: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{lang === 'id' ? 'Kirim Pesan Otomatis Saat Luar Jam Operasional' : 'Send Automatic Offline Reply Outside Business Hours'}</span>
                </label>

                {botConfig.offlineReplyEnabled && (
                  <div>
                    <textarea
                      rows={3}
                      value={botConfig.offlineReplyText}
                      onChange={e => setBotConfig({ ...botConfig, offlineReplyText: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                      placeholder={lang === 'id' ? 'Pesan balasan di luar jam kerja...' : 'Away auto-reply message...'}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setIsChatAutoReplyModal(false)} className="btn-secondary">
                {t.common.close}
              </button>
              <button
                onClick={() => {
                  handleSaveBotConfig();
                  setIsChatAutoReplyModal(false);
                }}
                className="btn-primary bg-emerald-600 hover:bg-emerald-700"
              >
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Start New Chat */}
      {isNewChatModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{t.chats.newChatModalTitle}</h2>
              <button onClick={() => setIsNewChatModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{t.tester.recipientPhone}</label>
                <input
                  type="text"
                  placeholder={t.chats.newChatPhonePlaceholder}
                  value={newChatPhone}
                  onChange={e => setNewChatPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">{lang === 'id' ? 'Riwayat obrolan akan langsung terbuka di panel chat.' : 'Chat thread will open directly in the inbox panel.'}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsNewChatModal(false)} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button onClick={handleStartNewChat} disabled={!newChatPhone.trim()} className="btn-primary">
                {t.chats.newChatStartButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Send Media in Chat */}
      {isSendMediaModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{t.tester.mediaFile || 'Kirim Berkas Media'}</h2>
              <button onClick={() => setIsSendMediaModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{t.tester.mediaFile}</label>
                <input
                  type="file"
                  onChange={e => setChatMediaFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">{t.tester.mediaCaption}</label>
                <input
                  type="text"
                  placeholder={lang === 'id' ? 'Tambahkan keterangan teks...' : 'Add a caption...'}
                  value={chatMediaCaption}
                  onChange={e => setChatMediaCaption(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsSendMediaModal(false)} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button onClick={handleSendChatMedia} disabled={!chatMediaFile} className="btn-primary">
                {t.chats.send}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: New Campaign */}
      {isNewCampaignModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>{lang === 'id' ? 'Buat Broadcast Baru' : 'New Broadcast Campaign'}</h2>
              <button onClick={() => setIsNewCampaignModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {lang === 'id' ? 'Judul Broadcast' : 'Campaign Title'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'id' ? 'misal: Promo Produk A - Weekend Special' : 'e.g. Product Promo A - Weekend Special'}
                  value={campName}
                  onChange={e => setCampName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs"
                />
              </div>

              {/* Audience Source Selector: Group vs Manual */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  {lang === 'id' ? 'Target Penerima Pesan (Sumber Kontak)' : 'Audience Source (Target Recipients)'}
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setCampAudienceMode('group')}
                    className={`text-xs py-2 px-3 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      campAudienceMode === 'group'
                        ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Tag size={14} />
                    <span>{lang === 'id' ? 'Pilih dari Group Kontak' : 'Select from Contact Group'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampAudienceMode('manual')}
                    className={`text-xs py-2 px-3 rounded-md font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      campAudienceMode === 'manual'
                        ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText size={14} />
                    <span>{lang === 'id' ? 'Input Nomor Manual / Tempel' : 'Manual Phone Input / Paste'}</span>
                  </button>
                </div>
              </div>

              {campAudienceMode === 'group' ? (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-blue-950 block mb-1">
                      {lang === 'id' ? 'Pilih Group Kontak Sasaran:' : 'Select Target Contact Group:'}
                    </label>
                    <select
                      value={campSelectedTag}
                      onChange={e => setCampSelectedTag(e.target.value)}
                      className="w-full border border-blue-300 rounded-lg p-2.5 text-xs bg-white text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="ALL">
                        {lang === 'id'
                          ? `Semua Kontak (${contacts.filter(c => !c.opt_out).length} Kontak Aktif)`
                          : `All Contacts (${contacts.filter(c => !c.opt_out).length} Active Contacts)`}
                      </option>
                      {availableTags.map(t => (
                        <option key={t.tag} value={t.tag}>
                          {lang === 'id' ? `Group: ${t.tag} (${t.count} Kontak)` : `Group: ${t.tag} (${t.count} Contacts)`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1.5 font-medium text-blue-900">
                      <CheckCircle size={14} className="text-blue-600" />
                      <span>
                        {lang === 'id' ? 'Target Penerima: ' : 'Target Recipients: '}
                        <strong className="text-blue-700 font-bold">
                          {campSelectedTag === 'ALL'
                            ? contacts.filter(c => !c.opt_out).length
                            : contacts.filter(c => c.tags.includes(campSelectedTag) && !c.opt_out).length}
                        </strong>{' '}
                        {lang === 'id'
                          ? 'kontak (Nomor Opt-Out otomatis difilter)'
                          : 'contacts (Opt-out numbers automatically filtered)'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={handleFillRecipientsFromGroup}
                      className="text-xs text-blue-700 hover:underline font-semibold"
                      title={lang === 'id' ? 'Salin nomor dari group ini ke editor teks manual' : 'Copy numbers from this group to manual editor'}
                    >
                      {lang === 'id' ? 'Salin ke Teks Manual →' : 'Copy to Manual Text →'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      {lang === 'id'
                        ? 'Daftar Penerima (Format: Nomor,Nama per baris)'
                        : 'Recipients List (Format: Phone,Name per line)'}
                    </label>
                    {availableTags.length > 0 && (
                      <button
                        type="button"
                        onClick={handleFillRecipientsFromGroup}
                        className="text-[11px] text-blue-600 hover:underline font-medium"
                      >
                        {lang === 'id'
                          ? `+ Salin dari group "${campSelectedTag === 'ALL' ? 'Semua Kontak' : campSelectedTag}"`
                          : `+ Copy from group "${campSelectedTag === 'ALL' ? 'All Contacts' : campSelectedTag}"`}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={5}
                    value={campRecipientsRaw}
                    onChange={e => setCampRecipientsRaw(e.target.value)}
                    placeholder="628123456789,Budi Santoso&#10;628987654321,Siti Aminah"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {lang === 'id'
                      ? 'Dapat menempelkan langsung ribuan nomor dari file Notepad / Excel.'
                      : 'You can paste thousands of phone numbers directly from Notepad / Excel.'}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {lang === 'id' ? 'Template Pesan (Spintax & Variabel)' : 'Message Template (Spintax & Variables)'}
                </label>
                <textarea
                  rows={4}
                  value={campTemplate}
                  onChange={e => setCampTemplate(e.target.value)}
                  placeholder={lang === 'id' ? 'misal: {Halo|Hai} {{name}}, penawaran spesial untuk nomor {{phone}}...' : 'e.g. {Hello|Hi} {{name}}, special offer for phone {{phone}}...'}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {lang === 'id'
                    ? <>Mendukung spintax <code>{`{Halo|Hai}`}</code> dan variabel <code>{`{{name}}`}</code>, <code>{`{{phone}}`}</code></>
                    : <>Supports spintax <code>{`{Hello|Hi}`}</code> and variables <code>{`{{name}}`}</code>, <code>{`{{phone}}`}</code></>}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {lang === 'id' ? 'Jeda Acak Minimum (detik)' : 'Random Delay Min (seconds)'}
                  </label>
                  <input
                    type="number"
                    value={campRandomDelayMin}
                    onChange={e => setCampRandomDelayMin(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {lang === 'id' ? 'Jeda Acak Maksimum (detik)' : 'Random Delay Max (seconds)'}
                  </label>
                  <input
                    type="number"
                    value={campRandomDelayMax}
                    onChange={e => setCampRandomDelayMax(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsNewCampaignModal(false)} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={
                  !campName.trim() ||
                  (campAudienceMode === 'manual' && !campRecipientsRaw.trim()) ||
                  (campAudienceMode === 'group' &&
                    (campSelectedTag === 'ALL'
                      ? contacts.filter(c => !c.opt_out).length === 0
                      : contacts.filter(c => c.tags.includes(campSelectedTag) && !c.opt_out).length === 0))
                }
                className="btn-primary"
              >
                {lang === 'id' ? 'Jadwalkan Broadcast' : 'Schedule Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: Campaign Recipients Inspector */}
      {isViewRecipientsModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>{lang === 'id' ? 'Daftar Penerima:' : 'Recipients:'} {viewCampaignTitle}</h2>
              <button onClick={() => setIsViewRecipientsModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-3">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="table-header" style={{ display: 'table-header-group' }}>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-2 px-3">{lang === 'id' ? 'NOMOR HP' : 'PHONE'}</th>
                      <th className="py-2 px-3">{lang === 'id' ? 'NAMA' : 'NAME'}</th>
                      <th className="py-2 px-3">{lang === 'id' ? 'STATUS' : 'STATUS'}</th>
                      <th className="py-2 px-3">{lang === 'id' ? 'WAKTU' : 'TIMESTAMP'}</th>
                      <th className="py-2 px-3">{lang === 'id' ? 'CATATAN / ERROR' : 'NOTE / ERROR'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewRecipientsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          {lang === 'id' ? 'Belum ada rincian penerima yang tercatat.' : 'No recipient details recorded.'}
                        </td>
                      </tr>
                    ) : (
                      viewRecipientsList.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-medium text-slate-900">+{r.phone}</td>
                          <td className="py-2 px-3">{r.name || '—'}</td>
                          <td className="py-2 px-3">
                            <span className={`status-pill ${r.status.toLowerCase()}`}>{r.status}</span>
                          </td>
                          <td className="py-2 px-3 mono text-[11px] text-slate-400">
                            {r.sent_at ? new Date(r.sent_at).toLocaleTimeString() : '—'}
                          </td>
                          <td className="py-2 px-3 text-slate-400 truncate max-w-xs">{r.error_message || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsViewRecipientsModal(false)} className="btn-secondary">
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal: New Automation Rule */}
      {isNewRuleModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{lang === 'id' ? 'Tambah Aturan Auto-Reply Baru' : 'New Auto-Responder Rule'}</h2>
              <button onClick={() => setIsNewRuleModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {lang === 'id' ? 'Nama Aturan' : 'Rule Name'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'id' ? 'misal: Bot Tanya Harga' : 'e.g. Price Inquiry Bot'}
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {lang === 'id' ? 'Tipe Pencocokan' : 'Match Type'}
                  </label>
                  <select
                    value={ruleOperator}
                    onChange={e => setRuleOperator(e.target.value as any)}
                    className="w-full text-xs font-semibold py-2 px-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="contains">{lang === 'id' ? 'Mengandung (Contains)' : 'Contains'}</option>
                    <option value="equals">{lang === 'id' ? 'Sama Persis (Exact Equals)' : 'Exact Equals'}</option>
                    <option value="starts_with">{lang === 'id' ? 'Diawali Dengan (Starts With)' : 'Starts With'}</option>
                    <option value="regex">Regex</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {lang === 'id' ? 'Kata Kunci Pemicu' : 'Keyword Trigger'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'id' ? 'misal: harga atau katalog' : 'e.g. price or catalog'}
                    value={ruleTriggerText}
                    onChange={e => setRuleTriggerText(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'id' ? 'Template Pesan Balasan' : 'Reply Template'}
                </label>
                <textarea
                  rows={4}
                  value={ruleReplyText}
                  onChange={e => setRuleReplyText(e.target.value)}
                  placeholder={lang === 'id' ? 'misal: {Halo|Hai} {{name}}, terima kasih telah menghubungi kami!' : 'e.g. {Hello|Hi} {{name}}, thank you for reaching out!'}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-900"
                />
              </div>

              {/* AMAN CHAT Pro: Multi-Actions (Auto-tagging & Pipeline Stage) */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {lang === 'id' ? 'Aksi Tambahan Otomatis (WhatsAman Pro):' : 'Automated Multi-Actions (WhatsAman Pro):'}
                </span>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="newRuleAddTagCheck"
                      checked={ruleAddTagEnabled}
                      onChange={e => setRuleAddTagEnabled(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <label htmlFor="newRuleAddTagCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                      {lang === 'id' ? 'Pasang Tag Kontak Otomatis (Auto-Tagging)' : 'Auto-Assign Contact Tag (Auto-Tagging)'}
                    </label>
                  </div>

                  {ruleAddTagEnabled && (
                    <div className="pl-6">
                      <select
                        value={ruleActionTag}
                        onChange={e => setRuleActionTag(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-medium"
                      >
                        <option value="🔥 Hot Lead">🔥 Hot Lead</option>
                        <option value="💰 Sudah Membeli">{lang === 'id' ? '💰 Sudah Membeli' : '💰 Purchased'}</option>
                        <option value="🟡 Warm Lead">🟡 Warm Lead</option>
                        <option value="❄️ Cold Lead">❄️ Cold Lead</option>
                        <option value="📦 Repeat Order">📦 Repeat Order</option>
                        <option value="⭐ VIP Customer">⭐ VIP Customer</option>
                        <option value="⏳ Menunggu Pembayaran">{lang === 'id' ? '⏳ Menunggu Pembayaran' : '⏳ Awaiting Payment'}</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="newRuleSetStageCheck"
                      checked={ruleSetStageEnabled}
                      onChange={e => setRuleSetStageEnabled(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <label htmlFor="newRuleSetStageCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                      {lang === 'id' ? 'Pindahkan Pipeline Stage (Sales Funnel)' : 'Move CRM Pipeline Stage (Sales Funnel)'}
                    </label>
                  </div>

                  {ruleSetStageEnabled && (
                    <div className="pl-6">
                      <select
                        value={ruleActionStage}
                        onChange={e => setRuleActionStage(e.target.value as any)}
                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-medium"
                      >
                        <option value="lead">{lang === 'id' ? '🔵 Lead (Lead Baru)' : '🔵 Lead (New Lead)'}</option>
                        <option value="prospect">{lang === 'id' ? '🟡 Prospect (Tertarik / Follow Up)' : '🟡 Prospect (Interested / Follow Up)'}</option>
                        <option value="customer">{lang === 'id' ? '💰 Customer (Closing / Selesai)' : '💰 Customer (Closed / Won)'}</option>
                        <option value="churned">{lang === 'id' ? '❌ Churned (Batal / Tidak Tertarik)' : '❌ Churned (Lost / Uninterested)'}</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsNewRuleModal(false)} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button onClick={handleCreateRule} disabled={!ruleName.trim() || !ruleTriggerText.trim()} className="btn-primary">
                {lang === 'id' ? 'Simpan Aturan' : 'Save Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Modal: Edit Automation Rule */}
      {isEditRuleModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{lang === 'id' ? 'Edit Aturan Auto-Reply' : 'Edit Automation Rule'}</h2>
              <button onClick={() => setIsEditRuleModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'id' ? 'Nama Aturan' : 'Rule Name'}
                </label>
                <input
                  type="text"
                  value={editRuleName}
                  onChange={e => setEditRuleName(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'id' ? 'Tipe Pencocokan' : 'Match Type'}
                  </label>
                  <select
                    value={editRuleOperator}
                    onChange={e => setEditRuleOperator(e.target.value as any)}
                    className="w-full text-xs font-semibold py-2 px-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                  >
                    <option value="contains">{lang === 'id' ? 'Mengandung (Contains)' : 'Contains'}</option>
                    <option value="equals">{lang === 'id' ? 'Sama Persis (Exact Equals)' : 'Exact Equals'}</option>
                    <option value="starts_with">{lang === 'id' ? 'Diawali Dengan (Starts With)' : 'Starts With'}</option>
                    <option value="regex">Regex</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'id' ? 'Kata Kunci Pemicu' : 'Keyword Trigger'}
                  </label>
                  <input
                    type="text"
                    value={editRuleTriggerText}
                    onChange={e => setEditRuleTriggerText(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'id' ? 'Template Pesan Balasan' : 'Reply Template'}
                </label>
                <textarea
                  rows={4}
                  value={editRuleReplyText}
                  onChange={e => setEditRuleReplyText(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500 bg-white dark:bg-slate-900"
                />
              </div>

              {/* AMAN CHAT Pro: Multi-Actions (Auto-tagging & Pipeline Stage) */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {lang === 'id' ? 'Aksi Tambahan Otomatis (WhatsAman Pro):' : 'Automated Multi-Actions (WhatsAman Pro):'}
                </span>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editRuleAddTagCheck"
                      checked={editRuleAddTagEnabled}
                      onChange={e => setEditRuleAddTagEnabled(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <label htmlFor="editRuleAddTagCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                      {lang === 'id' ? 'Pasang Tag Kontak Otomatis (Auto-Tagging)' : 'Auto-Assign Contact Tag (Auto-Tagging)'}
                    </label>
                  </div>

                  {editRuleAddTagEnabled && (
                    <div className="pl-6">
                      <select
                        value={editRuleActionTag}
                        onChange={e => setEditRuleActionTag(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-medium"
                      >
                        <option value="🔥 Hot Lead">🔥 Hot Lead</option>
                        <option value="💰 Sudah Membeli">{lang === 'id' ? '💰 Sudah Membeli' : '💰 Purchased'}</option>
                        <option value="🟡 Warm Lead">🟡 Warm Lead</option>
                        <option value="❄️ Cold Lead">❄️ Cold Lead</option>
                        <option value="📦 Repeat Order">📦 Repeat Order</option>
                        <option value="⭐ VIP Customer">⭐ VIP Customer</option>
                        <option value="⏳ Menunggu Pembayaran">{lang === 'id' ? '⏳ Menunggu Pembayaran' : '⏳ Awaiting Payment'}</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editRuleSetStageCheck"
                      checked={editRuleSetStageEnabled}
                      onChange={e => setEditRuleSetStageEnabled(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <label htmlFor="editRuleSetStageCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                      {lang === 'id' ? 'Pindahkan Pipeline Stage (Sales Funnel)' : 'Move CRM Pipeline Stage (Sales Funnel)'}
                    </label>
                  </div>

                  {editRuleSetStageEnabled && (
                    <div className="pl-6">
                      <select
                        value={editRuleActionStage}
                        onChange={e => setEditRuleActionStage(e.target.value as any)}
                        className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-medium"
                      >
                        <option value="lead">{lang === 'id' ? '🔵 Lead (Lead Baru)' : '🔵 Lead (New Lead)'}</option>
                        <option value="prospect">{lang === 'id' ? '🟡 Prospect (Tertarik / Follow Up)' : '🟡 Prospect (Interested / Follow Up)'}</option>
                        <option value="customer">{lang === 'id' ? '💰 Customer (Closing / Selesai)' : '💰 Customer (Closed / Won)'}</option>
                        <option value="churned">{lang === 'id' ? '❌ Churned (Batal / Tidak Tertarik)' : '❌ Churned (Lost / Uninterested)'}</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsEditRuleModal(false)} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button onClick={handleSaveEditRule} className="btn-primary">
                {lang === 'id' ? 'Perbarui Aturan' : 'Update Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Modal: Schedule Follow-up Task */}
      {isNewTaskModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-emerald-600" />
                <h2>{lang === 'id' ? 'Jadwalkan Follow-up Task Baru' : 'Schedule New Follow-up Task'}</h2>
              </div>
              <button onClick={() => setIsNewTaskModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-xs text-emerald-800 dark:text-emerald-300">
                {lang === 'id'
                  ? <>💡 <b>Auto-Stop Sequencer:</b> Jika pelanggan membalas pesan WhatsApp sebelum tugas dikirim, sistem akan otomatis membatalkan follow-up ini agar pelanggan tidak terganggu.</>
                  : <>💡 <b>Auto-Stop Sequencer:</b> If the customer replies via WhatsApp before this task is sent, the system will automatically cancel this follow-up so the customer is not spammed.</>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'id' ? 'Nomor WhatsApp *' : 'WhatsApp Phone Number *'}
                  </label>
                  <input
                    type="text"
                    placeholder="628123456789"
                    value={newTaskPhone}
                    onChange={e => setNewTaskPhone(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs font-mono bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'id' ? 'Nama Pelanggan' : 'Customer Name'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Budi Santoso"
                    value={newTaskName}
                    onChange={e => setNewTaskName(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'id' ? 'Judul / Topik Follow-up *' : 'Follow-up Subject / Title *'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'id' ? 'misal: Follow-up Penawaran Spesial' : 'e.g. Special Offer Follow-up'}
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'id' ? 'Jadwal Pengiriman (Waktu Jatuh Tempo)' : 'Scheduled Dispatch (Due Time)'}
                </label>
                <select
                  value={newTaskDueHours}
                  onChange={e => setNewTaskDueHours(Number(e.target.value))}
                  className="w-full text-xs font-semibold py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                >
                  <option value={1}>{lang === 'id' ? '1 Jam dari sekarang (Follow-up Cepat)' : '1 Hour from now (Quick Follow-up)'}</option>
                  <option value={6}>{lang === 'id' ? '6 Jam dari sekarang' : '6 Hours from now'}</option>
                  <option value={12}>{lang === 'id' ? '12 Jam dari sekarang' : '12 Hours from now'}</option>
                  <option value={24}>{lang === 'id' ? '24 Jam (Besok di jam yang sama)' : '24 Hours (Tomorrow same time)'}</option>
                  <option value={48}>{lang === 'id' ? '2 Hari (48 Jam)' : '2 Days (48 Hours)'}</option>
                  <option value={72}>{lang === 'id' ? '3 Hari (72 Jam)' : '3 Days (72 Hours)'}</option>
                  <option value={168}>{lang === 'id' ? '7 Hari (1 Minggu)' : '7 Days (1 Week)'}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'id' ? 'Template Pesan WhatsApp *' : 'WhatsApp Message Template *'}
                </label>
                <textarea
                  rows={4}
                  value={newTaskTemplate}
                  onChange={e => setNewTaskTemplate(e.target.value)}
                  placeholder="{Halo|Hai} kak {{name}}..."
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {lang === 'id'
                    ? <>Mendukung Spintax <code>{`{Halo|Hai}`}</code> dan variabel <code>{`{{name}}`}</code>, <code>{`{{phone}}`}</code></>
                    : <>Supports Spintax <code>{`{Hello|Hi}`}</code> and variables <code>{`{{name}}`}</code>, <code>{`{{phone}}`}</code></>}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsNewTaskModal(false)} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button
                onClick={handleCreateFollowUpTask}
                disabled={!newTaskPhone.trim() || !newTaskTitle.trim() || !newTaskTemplate.trim()}
                className="btn-primary"
              >
                {lang === 'id' ? 'Jadwalkan Follow-up' : 'Schedule Follow-up'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. Modal: Apply Drip Sequence */}
      {isApplySeqModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                <h2>{lang === 'id' ? 'Terapkan Drip Sequence Otomatis' : 'Apply Automated Drip Sequence'}</h2>
              </div>
              <button onClick={() => setIsApplySeqModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {lang === 'id' ? 'Kontak Sasaran:' : 'Target Contact:'}
                </div>
                <div className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
                  {applySeqContact?.name || (lang === 'id' ? 'Pelanggan' : 'Customer')} (+{applySeqContact?.phone})
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-300">
                {lang === 'id'
                  ? <>🛡️ <b>WhatsAman Sequencer Protection:</b> Setiap step follow-up dijadwalkan bertahap. Jika pelanggan membalas chat kapan saja, sistem akan <b>menghentikan seluruh sisa step</b> secara otomatis.</>
                  : <>🛡️ <b>WhatsAman Sequencer Protection:</b> Each follow-up step is scheduled incrementally. If the customer replies at any time, the system will <b>automatically abort all remaining steps</b>.</>}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'id' ? 'Pilih Alur Sequence' : 'Select Sequence Flow'}
                </label>
                <select
                  value={selectedSeqId}
                  onChange={e => setSelectedSeqId(e.target.value)}
                  className="w-full text-xs font-semibold py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                >
                  <option value="">{lang === 'id' ? '-- Pilih Sequence --' : '-- Select Sequence --'}</option>
                  {crmSequences.map(seq => (
                    <option key={seq.id} value={seq.id}>
                      {seq.name} ({seq.steps.length} {lang === 'id' ? 'Step Follow-up' : 'Follow-up Steps'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSeqId && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                    {lang === 'id' ? 'Tahapan Follow-up yang Akan Dibuat:' : 'Follow-up Steps to be Scheduled:'}
                  </span>
                  {crmSequences.find(s => s.id === selectedSeqId)?.steps.map(st => (
                    <div key={st.stepNumber} className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>Step {st.stepNumber}: {st.title}</span>
                        <span className="text-[11px] text-emerald-600 font-mono">+{st.delayHours} {lang === 'id' ? 'Jam' : 'Hours'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic truncate">
                        "{st.template}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsApplySeqModal(false)} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button
                onClick={handleApplySequence}
                disabled={!selectedSeqId}
                className="btn-primary"
              >
                {lang === 'id' ? 'Mulai Sequence' : 'Start Sequence'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. Modal: Contact CRM Notes */}
      {isNotesModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" />
                <h2>{lang === 'id' ? 'Catatan Kontak CRM' : 'Contact CRM Notes'}</h2>
              </div>
              <button onClick={() => setIsNotesModal(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs">
                <span className="text-slate-500 block text-[11px]">{lang === 'id' ? 'Kontak:' : 'Contact:'}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedContactForNotes?.name || (lang === 'id' ? 'Pelanggan' : 'Customer')} (+{selectedContactForNotes?.phone})
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'id' ? 'Catatan Transaksi & Kebutuhan Pelanggan:' : 'Customer Notes & Requirements:'}
                </label>
                <textarea
                  rows={6}
                  value={contactNotesText}
                  onChange={e => setContactNotesText(e.target.value)}
                  placeholder={lang === 'id' ? 'misal: Tertarik paket pro 3 bulan, minta dihubungi lagi hari Senin setelah jam makan siang...' : 'e.g. Interested in 3-month pro plan, requested follow-up on Monday after lunch...'}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setIsNotesModal(false)} className="btn-secondary">
                {t.common.cancel}
              </button>
              <button onClick={handleSaveContactNotes} className="btn-primary">
                {lang === 'id' ? 'Simpan Catatan' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
