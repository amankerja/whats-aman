import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChatAvatar, ChatInputBox, ChatMessageBubble } from './components/chat';
import { ToastProvider, ConfirmDialogHost, useToast, appConfirm } from './components/toast';
import {
  parsePhoneFromJid,
  isSameChat,
  formatPhoneForDisplay,
  formatWhatsAppTimestamp,
  formatDateSeparator,
  parseRecipientLines
} from './utils/format';
import type {
  IntegrationConfig,
  OutgoingWebhook,
  IntegrationLog,
  SessionMeta,
  Campaign,
  Contact,
  FollowUpTask,
  Sequence,
  SalesAnalytics,
  AutoReplyConfig,
  Group,
  AutoRule,
  AuditLog,
  ChatItem,
  ChatMessage,
  SystemStatus,
  PrivacySettings
} from './types';
import {
  LayoutDashboard,
  Smartphone,
  MessageSquare,
  Users,
  UserPlus,
  Target,
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
  CheckCircle2,
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
import { PrivacyPopover } from './components/PrivacyPopover';

// Lazy-loaded per-tab panels — each page only ships when first visited
const DashboardPanel = React.lazy(() => import('./panels/DashboardPanel'));
const SessionsPanel = React.lazy(() => import('./panels/SessionsPanel'));
const ChatsPanel = React.lazy(() => import('./panels/ChatsPanel'));
const CrmPanel = React.lazy(() => import('./panels/CrmPanel'));
const ContactsPanel = React.lazy(() => import('./panels/ContactsPanel'));
const GroupsPanel = React.lazy(() => import('./panels/GroupsPanel'));
const CampaignsPanel = React.lazy(() => import('./panels/CampaignsPanel'));
const TesterPanel = React.lazy(() => import('./panels/TesterPanel'));
const AutomationPanel = React.lazy(() => import('./panels/AutomationPanel'));
const IntegrationsPanel = React.lazy(() => import('./panels/IntegrationsPanel'));
const InfrastructurePanel = React.lazy(() => import('./panels/InfrastructurePanel'));
const LogsPanel = React.lazy(() => import('./panels/LogsPanel'));
import type { PanelCtx } from './panels/ctx';

function AppShell() {
  const { showToast } = useToast();

  // Theme state: light or dark (supports URL param ?theme=dark / ?theme=light)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const urlTheme = new URLSearchParams(window.location.search).get('theme');
    if (urlTheme === 'light' || urlTheme === 'dark') return urlTheme;
    return (localStorage.getItem('whatsaman_theme') as 'light' | 'dark') || 'light';
  });

  // Sidebar collapse & mobile state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('whatsaman_collapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Active navigation tab (supports URL param ?tab=...)
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'sessions' | 'chats' | 'crm' | 'contacts' | 'groups' | 'campaigns' | 'tester' | 'automation' | 'integrations' | 'infrastructure' | 'logs'
  >(() => {
    const urlTab = new URLSearchParams(window.location.search).get('tab') as any;
    const validTabs = ['dashboard', 'sessions', 'chats', 'crm', 'contacts', 'groups', 'campaigns', 'tester', 'automation', 'integrations', 'infrastructure', 'logs'];
    if (validTabs.includes(urlTab)) return urlTab;
    return 'dashboard';
  });

  // AMAN CHAT Pro: Privacy & Security Mode (Alt + P)
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('whatsaman_privacy') === 'true';
  });

  // Granular privacy-blur settings, persisted and edited via the privacy popover
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() => {
    try {
      const raw = localStorage.getItem('whatsaman_privacy_settings');
      if (raw) return { blurPics: true, blurRecentChats: true, blurChatNames: true, blurChatMessages: true, ...JSON.parse(raw) };
    } catch { /* ignore malformed localStorage */ }
    return { blurPics: true, blurRecentChats: true, blurChatNames: true, blurChatMessages: true };
  });
  const [isPrivacyMenuOpen, setIsPrivacyMenuOpen] = useState(false);

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
  const [testerType, setTesterType] = useState<'text' | 'media' | 'poll' | 'location' | 'contact'>('text');
  const [testerRecipient, setTesterRecipient] = useState('');
  const [testerMessage, setTesterMessage] = useState('Halo, ini pesan pengujian dari WhatsAman!');
  const [testerMediaFile, setTesterMediaFile] = useState<File | null>(null);
  const [testerMediaCaption, setTesterMediaCaption] = useState('Lampiran file WhatsAman');
  // Poll / Location / Contact tester state
  const [testerPollName, setTesterPollName] = useState('Layanan apa yang Anda butuhkan?');
  const [testerPollValues, setTesterPollValues] = useState('Konsultasi\nPemesanan\nKeluhan');
  const [testerPollMulti, setTesterPollMulti] = useState(1);
  const [testerLatitude, setTesterLatitude] = useState('-6.2088');
  const [testerLongitude, setTesterLongitude] = useState('106.8456');
  const [testerLocName, setTesterLocName] = useState('Kantor Pusat');
  const [testerLocAddress, setTesterLocAddress] = useState('Jl. Jend. Sudirman No. 1, Jakarta');
  const [testerContactName, setTesterContactName] = useState('Budi Santoso');
  const [testerContactPhone, setTesterContactPhone] = useState('628123456789');
  const [testerContactOrg, setTesterContactOrg] = useState('Aman Kerja Studio');
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
  // Message templates (previously backend-only feature, now surfaced in UI)
  interface MessageTemplate { id: string; name: string; category: string; content: string; }
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
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

  // Anti-Blocking Guard health (per session)
  const [abHealth, setAbHealth] = useState<Record<string, { stats: any; events: any[] }>>({});
  const [abResetting, setAbResetting] = useState<string | null>(null);

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

  const fetchMessageTemplates = async () => {
    try {
      const res = await fetch('/api/v1/templates');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMessageTemplates(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch message templates', err);
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

  const fetchAntiBlockingHealth = async (sessionId: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/v1/system/anti-blocking/stats?sessionId=${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      if (data.success) {
        setAbHealth(prev => ({ ...prev, [sessionId]: data.data }));
      }
    } catch (err) {
      console.error('Failed to fetch anti-blocking stats', err);
    }
  };

  const handleResetCircuitBreaker = async (sessionId: string) => {
    setAbResetting(sessionId);
    try {
      const res = await fetch('/api/v1/system/anti-blocking/reset-circuit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Circuit breaker sesi ${sessionId} direset`, 'success');
        showToast(`Circuit breaker sesi ${sessionId} berhasil direset`, 'success');
        fetchAntiBlockingHealth(sessionId);
      } else {
        showToast(data.message || 'Gagal reset circuit breaker', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAbResetting(null);
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
        showToast(data.message || 'Gagal menyimpan konfigurasi', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTestIncomingWebhook = async () => {
    if (!testIntegrationPhone.trim()) {
      showToast('Masukkan nomor WhatsApp tujuan uji coba!', 'warn');
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
      showToast('Nama dan URL Webhook wajib diisi!', 'warn');
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
        showToast(data.message || 'Gagal menambahkan webhook', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteOutgoingWebhook = async (id: string) => {
    if (!(await appConfirm('Hapus webhook subscription ini?', { danger: true, confirmLabel: 'Ya, Hapus' }))) return;
    try {
      const res = await fetch(`/api/v1/webhooks/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addLog('Webhook subscription dihapus', 'info');
        fetchOutgoingWebhooks();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTestOutgoingWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/webhooks/${id}/test`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Test Ping terkirim! Status Code: ${data.data?.status || 200}`, 'success');
        fetchOutgoingWebhooks();
      } else {
        showToast(`Gagal kirim test ping: ${data.message}`, 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
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
    fetchMessageTemplates();

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
      showToast(err.message, 'error');
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
        showToast('Pengaturan jam operasional & auto-reply bot berhasil disimpan!', 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSendChatBroadcast = async () => {
    const sId = chatBroadcastSessionId || selectedSessionId;
    if (!sId) {
      showToast('Silakan pilih sesi WhatsApp terlebih dahulu!', 'warn');
      return;
    }
    if (!chatBroadcastMessage.trim()) {
      showToast('Pesan broadcast tidak boleh kosong!', 'warn');
      return;
    }

    let recipients: Array<{ phone: string; name?: string; customVars: any }> = [];

    if (chatBroadcastMode === 'manual') {
      if (!chatBroadcastManualNumbers.trim()) {
        showToast('Masukkan minimal 1 nomor tujuan!', 'warn');
        return;
      }
      // Bug fix: previously every line was flattened to phone-only via flatMap(','),
      // silently dropping the recipient names typed after the comma.
      recipients = parseRecipientLines(chatBroadcastManualNumbers).map(r => ({
        ...r,
        name: r.name || formatPhoneForDisplay(r.phone)
      }));
    } else if (chatBroadcastMode === 'select') {
      if (chatBroadcastSelectedPhones.length === 0) {
        showToast('Pilih minimal 1 kontak / chat penerima!', 'warn');
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
        showToast('Gagal mengambil kontak tag: ' + err.message, 'error');
        return;
      }
    }

    if (recipients.length === 0) {
      showToast('Tidak ada penerima nomor telepon yang valid!', 'warn');
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
        showToast(`Broadcast berhasil dikirim ke antrian (${recipients.length} penerima). Cek menu Campaigns untuk status.`, 'success');
        setIsChatBroadcastModal(false);
        fetchCampaigns();
      } else {
        showToast(campData.message || 'Gagal membuat pesan broadcast', 'error');
      }
    } catch (err: any) {
      showToast(`Gagal mengirim broadcast: ${err.message}`, 'error');
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
        showToast('Follow-up task berhasil terkirim!', 'success');
        fetchCRMTasks(selectedSessionId);
        fetchSalesAnalytics(selectedSessionId, crmTimeRange);
      } else {
        showToast(data.message || 'Gagal mengeksekusi follow-up task', 'error');
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
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
      showToast(err.message, 'error');
    }
  };

  const handleDeleteFollowUp = async (taskId: string) => {
    if (!(await appConfirm('Hapus task follow-up ini?', { danger: true, confirmLabel: 'Ya, Hapus' }))) return;
    try {
      await fetch(`/api/v1/crm/tasks/${taskId}`, { method: 'DELETE' });
      fetchCRMTasks(selectedSessionId);
      addLog('Follow-up task dihapus', 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
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
        showToast(data.message || 'Gagal membuat task', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
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
        showToast(data.message || 'Gagal menerapkan sequence', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateContactStage = async (phone: string, stage: 'lead' | 'prospect' | 'customer' | 'churned') => {
    try {
      setContacts(prev => prev.map(c => c.phone === phone ? { ...c, pipeline_stage: stage } : c));
      await fetch(`/api/v1/contacts/${phone}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, stage })
      });
      fetchContacts(selectedSessionId);
      fetchSalesAnalytics(selectedSessionId, crmTimeRange);
      addLog(`Status pipeline kontak ${phone} diubah menjadi ${stage.toUpperCase()}`, 'info');
    } catch (err: any) {
      showToast(err.message, 'error');
      fetchContacts(selectedSessionId);
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
      showToast(err.message, 'error');
    }
  };

  // Perf fix: previously ONE effect fired 12 fetches and re-ran ALL of them whenever
  // crmTimeRange changed. Split: session-scoped data vs analytics-only.
  useEffect(() => {
    if (selectedSessionId) {
      fetchContacts(selectedSessionId);
      fetchGroups(selectedSessionId);
      fetchChats(selectedSessionId);
      fetchTags(selectedSessionId);
      fetchCRMTasks(selectedSessionId);
      fetchCRMSequences(selectedSessionId);
      fetchBotConfig(selectedSessionId);
      fetchCrmAutoDispatch();
      fetchAntiBlockingHealth(selectedSessionId);
    }
  }, [selectedSessionId]);

  // Refresh anti-blocking health whenever session list/status changes (cheap call)
  useEffect(() => {
    sessions.forEach(s => fetchAntiBlockingHealth(s.id));
  }, [sessions.map(s => `${s.id}:${s.status}`).join(',')]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSalesAnalytics(selectedSessionId, crmTimeRange);
    }
  }, [selectedSessionId, crmTimeRange]);

  // Integration data is session-scoped but only needed on its own tab; fetch lazily
  useEffect(() => {
    if (selectedSessionId && activeTab === 'integrations') {
      fetchIntegrationConfigs();
      fetchOutgoingWebhooks();
      fetchIntegrationLogs();
    }
  }, [selectedSessionId, activeTab]);

  useEffect(() => {
    if (selectedSessionId && activeChatJid) {
      fetchChatMessages(selectedSessionId, activeChatJid);
      // Bug fix: opening a chat now clears its unread badge on the server too
      // (previously the badge persisted forever in the DB)
      fetch(`/api/v1/messages/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, chatJid: activeChatJid })
      })
        .then(() => {
          setChats(prev => prev.map(c => (c.chat_jid === activeChatJid ? { ...c, unread_count: 0 } : c)));
        })
        .catch(() => { /* non-critical */ });
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
      showToast(`Gagal membuat sesi: ${err.message}`, 'error');
    }
  };

  const handleDisconnectSession = async (id: string) => {
    await fetch(`/api/v1/sessions/${id}/disconnect`, { method: 'POST' });
    fetchSessions();
    addLog(`Sesi ${id} diputus`, 'warn');
  };

  const handleLogoutSession = async (id: string) => {
    if (!(await appConfirm(`Logout akun WhatsApp dari sesi "${id}"? Anda harus scan QR / pairing ulang untuk terhubung kembali.`, { danger: true, confirmLabel: 'Ya, Logout' }))) return;
    await fetch(`/api/v1/sessions/${id}/logout`, { method: 'POST' });
    fetchSessions();
    addLog(`Sesi ${id} berhasil logout dari WhatsApp`, 'warn');
  };

  const handleDeleteSession = async (id: string) => {
    if (!(await appConfirm(`Hapus sesi ${id} dan seluruh file autentikasinya?`, { danger: true, confirmLabel: 'Ya, Hapus' }))) return;
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
        showToast(data.message || 'Gagal mengirim pesan', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
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
        showToast(data.message || 'Gagal mengirim media', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Message Tester Handler
  const handleRunTester = async () => {
    if (!selectedSessionId) {
      showToast('Pilih sesi aktif terlebih dahulu', 'warn');
      return;
    }
    if (!testerRecipient.trim()) {
      showToast('Masukkan nomor WhatsApp tujuan', 'warn');
      return;
    }
    setTesterLoading(true);
    setTesterResponse(null);
    try {
      const cleanPhone = testerRecipient.replace(/[^0-9]/g, '');
      const toJid = `${cleanPhone}@s.whatsapp.net`;
      const recordResponse = async (res: Response) => {
        const data = await res.json();
        setTesterResponse({ status: res.status, data, timestamp: new Date().toISOString() });
        return data;
      };

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
        const data = await recordResponse(res);
        if (data.success) {
          addLog(`Pesan tester terkirim ke +${cleanPhone}`, 'success');
        } else {
          addLog(`Tester gagal: ${data.message || 'Unknown error'}`, 'warn');
        }
      } else if (testerType === 'poll') {
        // NEW: interactive poll tester (backend endpoint already existed, UI was missing)
        const values = testerPollValues.split('\n').map(v => v.trim()).filter(Boolean);
        const res = await fetch('/api/v1/messages/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: selectedSessionId,
            to: toJid,
            poll: {
              name: testerPollName,
              values,
              selectableCount: testerPollMulti
            }
          })
        });
        const data = await recordResponse(res);
        if (data.success) {
          addLog(`Poll tester terkirim ke +${cleanPhone}`, 'success');
        } else {
          addLog(`Tester poll gagal: ${data.message || 'Unknown error'}`, 'warn');
        }
      } else if (testerType === 'location') {
        // NEW: location tester
        const res = await fetch('/api/v1/messages/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: selectedSessionId,
            to: toJid,
            latitude: Number(testerLatitude),
            longitude: Number(testerLongitude),
            name: testerLocName || undefined,
            address: testerLocAddress || undefined
          })
        });
        const data = await recordResponse(res);
        if (data.success) {
          addLog(`Lokasi tester terkirim ke +${cleanPhone}`, 'success');
        } else {
          addLog(`Tester lokasi gagal: ${data.message || 'Unknown error'}`, 'warn');
        }
      } else if (testerType === 'contact') {
        // NEW: vCard contact tester
        const res = await fetch('/api/v1/messages/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: selectedSessionId,
            to: toJid,
            contact: {
              name: testerContactName,
              phone: testerContactPhone,
              organization: testerContactOrg || undefined
            }
          })
        });
        const data = await recordResponse(res);
        if (data.success) {
          addLog(`Kontak tester terkirim ke +${cleanPhone}`, 'success');
        } else {
          addLog(`Tester kontak gagal: ${data.message || 'Unknown error'}`, 'warn');
        }
      } else {
        if (!testerMediaFile) {
          showToast('Pilih file media terlebih dahulu', 'warn');
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
        const data = await recordResponse(res);
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
        showToast(`Kontak +${newContactPhone} ditambahkan`, 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
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
      showToast(err.message, 'error');
    }
  };

  const handleDeleteContact = async (phone: string) => {
    if (!selectedSessionId) return;
    if (!(await appConfirm(lang === 'id' ? `Hapus kontak +${phone} dari database?` : `Delete contact +${phone} from database?`, { danger: true, confirmLabel: 'Ya, Hapus' }))) return;
    try {
      setContacts(prev => prev.filter(c => c.phone !== phone));
      const res = await fetch(`/api/v1/contacts/${phone}?sessionId=${selectedSessionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchContacts(selectedSessionId);
        addLog(`Kontak +${phone} dihapus`, 'info');
      } else {
        fetchContacts(selectedSessionId);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
      fetchContacts(selectedSessionId);
    }
  };

  const handleImportGroupToContacts = async (jid: string) => {
    if (!selectedSessionId) return;
    if (!(await appConfirm('Import seluruh anggota grup ke database kontak audiens?', { confirmLabel: 'Ya, Import' }))) return;
    try {
      const res = await fetch('/api/v1/groups/import-to-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, jid })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchContacts(selectedSessionId);
        addLog(data.message, 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
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
        showToast(data.message || 'Gagal memperbarui group kontak', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
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
      showToast(err.message, 'error');
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
        showToast('Gagal mengambil kontak audiens grup: ' + err.message, 'error');
        return;
      }
    } else {
      if (!campRecipientsRaw.trim()) {
        showToast('Daftar nomor penerima tidak boleh kosong!', 'warn');
        return;
      }
      recipients = parseRecipientLines(campRecipientsRaw);
    }

    if (recipients.length === 0) {
      showToast(campAudienceMode === 'group'
        ? `Tidak ditemukan kontak aktif (non opt-out) dalam group "${campSelectedTag === 'ALL' ? 'Semua Kontak' : campSelectedTag}". Silakan tambahkan kontak ke group ini terlebih dahulu.`
        : 'Daftar nomor penerima tidak boleh kosong!', 'warn');
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
        showToast(`Broadcast "${campName}" dibuat dengan ${recipients.length} penerima`, 'success');
      } else {
        showToast(data.message || 'Gagal membuat broadcast', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
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
    if (!(await appConfirm('Hapus campaign broadcast ini beserta antreannya?', { danger: true, confirmLabel: 'Ya, Hapus' }))) return;
    await fetch(`/api/v1/campaigns/${id}`, { method: 'DELETE' });
    fetchCampaigns();
    addLog(`Broadcast ${id} dihapus`, 'info');
    showToast('Broadcast dihapus', 'info');
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
      showToast(err.message, 'error');
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
        showToast(`Rule "${ruleName}" berhasil disimpan`, 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
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
        showToast(`Rule "${editRuleName}" diperbarui`, 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!(await appConfirm('Hapus aturan auto-responder ini?', { danger: true, confirmLabel: 'Ya, Hapus' }))) return;
    await fetch(`/api/v1/automation/${id}`, { method: 'DELETE' });
    fetchRules();
    addLog(`Rule dihapus`, 'info');
    showToast('Rule dihapus', 'info');
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
        showToast(`Cadangan berhasil dibuat: ${data.data.fileName}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const activeSession = sessions.find(s => s.id === selectedSessionId) || sessions[0] || null;
  const isGlobalConnected = sessions.some(s => s.status === 'CONNECTED');

  // Everything the lazy panels need, provided as one typed object
  const panelCtx: PanelCtx = {
    t,
    privacyMode,
    setPrivacyMode,
    privacySettings,
    setPrivacySettings,
    isPrivacyMenuOpen,
    setIsPrivacyMenuOpen,
    lang,
    showToast,
    appConfirm,
    previewTemplate,
    addLog,
    messagesEndRef,
    liveLogs,
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    campaigns,
    contacts,
    setContacts,
    groups,
    rules,
    activeSession,
    isGlobalConnected,
    setActiveTab,
    fetchSessions,
    fetchSystemStatus,
    fetchCampaigns,
    fetchContacts,
    fetchGroups,
    fetchChats,
    fetchChatMessages,
    fetchTags,
    fetchCRMTasks,
    fetchCRMSequences,
    fetchSalesAnalytics,
    fetchAuditLogs,
    fetchBackups,
    fetchIntegrationLogs,
    chats,
    setChats,
    activeChatJid,
    setActiveChatJid,
    chatMessages,
    setChatMessages,
    chatSearchQuery,
    setChatSearchQuery,
    chatsSidebarTab,
    setChatsSidebarTab,
    chatFilter,
    setChatFilter,
    chatReplyText,
    setChatReplyText,
    isNewChatModal,
    setIsNewChatModal,
    newChatPhone,
    setNewChatPhone,
    isRefreshingChats,
    refreshSuccess,
    isRefreshingThread,
    setIsRefreshingThread,
    isSendMediaModal,
    setIsSendMediaModal,
    chatMediaFile,
    setChatMediaFile,
    chatMediaCaption,
    setChatMediaCaption,
    unreadChatsCount,
    contactsMap,
    groupsMap,
    filteredChats,
    filteredContacts,
    filteredGroups,
    filteredChannels,
    findContact,
    handleManualRefreshChats,
    handleRefreshActiveThread,
    handleSendChatMessage,
    handleSendChatMedia,
    handleStartNewChat,
    botConfig,
    setBotConfig,
    handleToggleAutoReplyGlobal,
    setIsChatAutoReplyModal,
    setIsChatBroadcastModal,
    sessionSearchQuery,
    setSessionSearchQuery,
    sessionStatusFilter,
    setSessionStatusFilter,
    copiedPairingCode,
    setCopiedPairingCode,
    abHealth,
    abResetting,
    handleResetCircuitBreaker,
    handleDisconnectSession,
    handleLogoutSession,
    handleDeleteSession,
    handleConnectSessionDirect,
    activeQrModal,
    setActiveQrModal,
    connectOptionModal,
    setConnectOptionModal,
    crmStageFilter,
    setCrmStageFilter,
    crmSearchQuery,
    setCrmSearchQuery,
    crmTasks,
    crmTaskFilter,
    setCrmTaskFilter,
    crmSequences,
    crmAnalytics,
    crmTimeRange,
    setCrmTimeRange,
    crmAutoDispatch,
    handleToggleCrmAutoDispatch,
    isNewTaskModal,
    setIsNewTaskModal,
    newTaskPhone,
    setNewTaskPhone,
    newTaskName,
    setNewTaskName,
    newTaskTitle,
    setNewTaskTitle,
    newTaskTemplate,
    setNewTaskTemplate,
    newTaskDueHours,
    setNewTaskDueHours,
    handleCreateFollowUpTask,
    handleExecuteFollowUp,
    handleCancelFollowUp,
    handleDeleteFollowUp,
    isApplySeqModal,
    setIsApplySeqModal,
    applySeqContact,
    setApplySeqContact,
    selectedSeqId,
    setSelectedSeqId,
    handleApplySequence,
    isNotesModal,
    setIsNotesModal,
    selectedContactForNotes,
    setSelectedContactForNotes,
    contactNotesText,
    setContactNotesText,
    handleSaveContactNotes,
    contactSearchQuery,
    setContactSearchQuery,
    availableTags,
    selectedTagFilter,
    setSelectedTagFilter,
    isAddContactModal,
    setIsAddContactModal,
    newContactPhone,
    setNewContactPhone,
    newContactName,
    setNewContactName,
    newContactTags,
    setNewContactTags,
    handleAddContact,
    isEditContactTagsModal,
    setIsEditContactTagsModal,
    editingContactPhone,
    editingContactName,
    editingContactTags,
    setEditingContactTags,
    openEditTagsModal,
    handleSaveContactTags,
    handleToggleOptOut,
    handleDeleteContact,
    handleImportGroupToContacts,
    handleUpdateContactStage,
    handleOpenChatWithContact,
    isNewCampaignModal,
    setIsNewCampaignModal,
    campName,
    setCampName,
    campAudienceMode,
    setCampAudienceMode,
    campSelectedTag,
    setCampSelectedTag,
    campTemplate,
    setCampTemplate,
    campRecipientsRaw,
    setCampRecipientsRaw,
    campRandomDelayMin,
    setCampRandomDelayMin,
    campRandomDelayMax,
    setCampRandomDelayMax,
    messageTemplates,
    handleCreateCampaign,
    handleStartCampaign,
    handlePauseCampaign,
    handleDeleteCampaign,
    isViewRecipientsModal,
    setIsViewRecipientsModal,
    viewRecipientsList,
    viewCampaignTitle,
    handleViewRecipients,
    handleFillRecipientsFromGroup,
    isNewRuleModal,
    setIsNewRuleModal,
    ruleName,
    setRuleName,
    ruleTriggerText,
    setRuleTriggerText,
    ruleOperator,
    setRuleOperator,
    ruleReplyText,
    setRuleReplyText,
    ruleAddTagEnabled,
    setRuleAddTagEnabled,
    ruleActionTag,
    setRuleActionTag,
    ruleSetStageEnabled,
    setRuleSetStageEnabled,
    ruleActionStage,
    setRuleActionStage,
    isEditRuleModal,
    setIsEditRuleModal,
    editRuleId,
    editRuleName,
    setEditRuleName,
    editRuleTriggerText,
    setEditRuleTriggerText,
    editRuleOperator,
    setEditRuleOperator,
    editRuleReplyText,
    setEditRuleReplyText,
    editRuleAddTagEnabled,
    setEditRuleAddTagEnabled,
    editRuleActionTag,
    setEditRuleActionTag,
    editRuleSetStageEnabled,
    setEditRuleSetStageEnabled,
    editRuleActionStage,
    setEditRuleActionStage,
    simTestInput,
    setSimTestInput,
    simMatchedRule,
    simEvaluatedReply,
    handleToggleRule,
    handleCreateRule,
    handleSaveEditRule,
    handleDeleteRule,
    handleSaveBotConfig,
    testerType,
    setTesterType,
    testerRecipient,
    setTesterRecipient,
    testerMessage,
    setTesterMessage,
    testerMediaFile,
    setTesterMediaFile,
    testerMediaCaption,
    setTesterMediaCaption,
    testerPollName,
    setTesterPollName,
    testerPollValues,
    setTesterPollValues,
    testerPollMulti,
    setTesterPollMulti,
    testerLatitude,
    setTesterLatitude,
    testerLongitude,
    setTesterLongitude,
    testerLocName,
    setTesterLocName,
    testerLocAddress,
    setTesterLocAddress,
    testerContactName,
    setTesterContactName,
    testerContactPhone,
    setTesterContactPhone,
    testerContactOrg,
    setTesterContactOrg,
    testerLoading,
    testerResponse,
    handleRunTester,
    integrationConfigs,
    outgoingWebhooks,
    integrationLogs,
    selectedIntegrationTab,
    setSelectedIntegrationTab,
    copiedWebhookUrl,
    setCopiedWebhookUrl,
    copiedScriptCode,
    setCopiedScriptCode,
    isTestIntegrationModal,
    setIsTestIntegrationModal,
    testIntegrationPhone,
    setTestIntegrationPhone,
    testIntegrationName,
    setTestIntegrationName,
    testIntegrationFormName,
    setTestIntegrationFormName,
    testIntegrationResult,
    testIntegrationLoading,
    handleTestIncomingWebhook,
    handleSaveIntegrationConfig,
    handleTestOutgoingWebhook,
    handleCreateOutgoingWebhook,
    handleDeleteOutgoingWebhook,
    isAddOutgoingWebhookModal,
    setIsAddOutgoingWebhookModal,
    newWebhookName,
    setNewWebhookName,
    newWebhookUrl,
    setNewWebhookUrl,
    newWebhookSecret,
    setNewWebhookSecret,
    newWebhookEvents,
    editIntegrationConfig,
    setEditIntegrationConfig,
    isEditIntegrationModal,
    setIsEditIntegrationModal,
    systemStatus,
    backups,
    handleCreateBackup,
    auditLogs,
    logFilter,
    setLogFilter,
    setIsAddSessionModal,
    setChatBroadcastSessionId,
    setEditingContactPhone,
    setEditingContactName,
    setEditRuleId,
    fetchIntegrationConfigs,
    fetchOutgoingWebhooks
  };

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
            <button className="btn-icon" onClick={toggleTheme} data-action="toggle-theme" aria-label="Toggle Theme">
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
                data-tab={item.id}
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
          <button className="theme-toggle-btn" data-action="toggle-theme" onClick={toggleTheme} title="Ganti Mode Tampilan (Terang / Gelap)">
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

        {/* Per-tab panels — lazy-loaded so each page only ships when visited */}
        <PrivacyPopover
          isOpen={isPrivacyMenuOpen}
          onClose={() => setIsPrivacyMenuOpen(false)}
          privacyMode={privacyMode}
          setPrivacyMode={setPrivacyMode}
          privacySettings={privacySettings}
          setPrivacySettings={setPrivacySettings}
        />

        <React.Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat halaman...</div>}>
          {activeTab === 'dashboard' && <DashboardPanel ctx={panelCtx} />}
          {activeTab === 'sessions' && <SessionsPanel ctx={panelCtx} />}
          {activeTab === 'chats' && <ChatsPanel ctx={panelCtx} />}
          {activeTab === 'crm' && <CrmPanel ctx={panelCtx} />}
          {activeTab === 'contacts' && <ContactsPanel ctx={panelCtx} />}
          {activeTab === 'groups' && <GroupsPanel ctx={panelCtx} />}
          {activeTab === 'campaigns' && <CampaignsPanel ctx={panelCtx} />}
          {activeTab === 'tester' && <TesterPanel ctx={panelCtx} />}
          {activeTab === 'automation' && <AutomationPanel ctx={panelCtx} />}
          {activeTab === 'integrations' && <IntegrationsPanel ctx={panelCtx} />}
          {activeTab === 'infrastructure' && <InfrastructurePanel ctx={panelCtx} />}
          {activeTab === 'logs' && <LogsPanel ctx={panelCtx} />}
        </React.Suspense>

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
                {messageTemplates.length > 0 && (
                  <select
                    value=""
                    onChange={e => {
                      const tpl = messageTemplates.find(t => t.id === e.target.value);
                      if (tpl) setChatBroadcastMessage(tpl.content);
                    }}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 mb-2 bg-slate-50"
                  >
                    <option value="">{lang === 'id' ? '📂 Gunakan Template Tersimpan...' : '📂 Use Saved Template...'}</option>
                    {messageTemplates.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>{tpl.name} ({tpl.category})</option>
                    ))}
                  </select>
                )}
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
                {messageTemplates.length > 0 && (
                  <select
                    value=""
                    onChange={e => {
                      const tpl = messageTemplates.find(t => t.id === e.target.value);
                      if (tpl) setCampTemplate(tpl.content);
                    }}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 mb-2 bg-slate-50"
                  >
                    <option value="">{lang === 'id' ? '📂 Gunakan Template Tersimpan...' : '📂 Use Saved Template...'}</option>
                    {messageTemplates.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>{tpl.name} ({tpl.category})</option>
                    ))}
                  </select>
                )}
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

// Toast + confirm-dialog hosts wrap the whole app so any handler can raise
// in-app notifications instead of blocking native alert()/confirm() dialogs.
export default function App() {
  return (
    <ToastProvider>
      <AppShell />
      <ConfirmDialogHost />
    </ToastProvider>
  );
}
