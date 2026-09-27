import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  MessageSquare,
  Users,
  FolderGit2,
  Send,
  Zap,
  HardDrive,
  BookOpen,
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
  Layers,
  Search,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  Info,
  Sliders,
  ChevronRight,
  Copy,
  Check,
  Sparkles,
  Paperclip,
  CheckCheck,
  User,
  MessageCircle,
  Bot,
  ToggleLeft,
  ToggleRight,
  Edit3,
  X,
  Eye
} from 'lucide-react';

interface SessionMeta {
  id: string;
  name: string;
  phoneNumber?: string;
  status: 'DISCONNECTED' | 'QR_READY' | 'PAIRING_READY' | 'CONNECTING' | 'CONNECTED';
  qrCode?: string;
  pairingCode?: string;
  lastConnectedAt?: number;
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
  opt_out: boolean;
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
  actions: Array<{ type: string; text?: string }>;
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
  timestamp: number;
  name?: string;
  push_name?: string;
  unread_count?: number;
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'messages' | 'contacts' | 'groups' | 'campaigns' | 'automation' | 'system'>('overview');
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
  const [isTrayNoticeDismissed, setIsTrayNoticeDismissed] = useState(false);
  const [copiedPairingCode, setCopiedPairingCode] = useState(false);

  // Live Chat & Inbox State
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeChatJid, setActiveChatJid] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatReplyText, setChatReplyText] = useState('');
  const [isNewChatModal, setIsNewChatModal] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Modals state
  const [isAddSessionModal, setIsAddSessionModal] = useState(false);
  const [newSessionId, setNewSessionId] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [loginMethod, setLoginMethod] = useState<'qr' | 'pairing'>('qr');
  const [pairingPhone, setPairingPhone] = useState('');

  // New Campaign Form
  const [isNewCampaignModal, setIsNewCampaignModal] = useState(false);
  const [campName, setCampName] = useState('');
  const [campTemplate, setCampTemplate] = useState('Halo {{name}}, perkenalkan penawaran spesial kami...');
  const [campRecipientsRaw, setCampRecipientsRaw] = useState('');
  const [campRandomDelayMin, setCampRandomDelayMin] = useState(5);
  const [campRandomDelayMax, setCampRandomDelayMax] = useState(15);

  // New Rule Form
  const [isNewRuleModal, setIsNewRuleModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleTriggerText, setRuleTriggerText] = useState('');
  const [ruleOperator, setRuleOperator] = useState<'contains' | 'equals' | 'starts_with' | 'regex'>('contains');
  const [ruleReplyText, setRuleReplyText] = useState('{Halo|Hai} {{name}}, terima kasih telah menghubungi kami!');

  // Automation Rule Tester
  const [simTestInput, setSimTestInput] = useState('');
  const [simMatchedRule, setSimMatchedRule] = useState<AutoRule | null>(null);
  const [simEvaluatedReply, setSimEvaluatedReply] = useState<string>('');

  // Contacts Tab State
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [isAddContactModal, setIsAddContactModal] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactTags, setNewContactTags] = useState('Pelanggan');

  // Campaign Recipients View State
  const [isViewRecipientsModal, setIsViewRecipientsModal] = useState(false);
  const [viewRecipientsList, setViewRecipientsList] = useState<any[]>([]);
  const [viewCampaignTitle, setViewCampaignTitle] = useState('');

  // Edit Rule State
  const [isEditRuleModal, setIsEditRuleModal] = useState(false);
  const [editRuleId, setEditRuleId] = useState('');
  const [editRuleName, setEditRuleName] = useState('');
  const [editRuleTriggerText, setEditRuleTriggerText] = useState('');
  const [editRuleOperator, setEditRuleOperator] = useState<'contains' | 'equals' | 'starts_with' | 'regex'>('contains');
  const [editRuleReplyText, setEditRuleReplyText] = useState('');

  // Media Chat State
  const [isSendMediaModal, setIsSendMediaModal] = useState(false);
  const [chatMediaFile, setChatMediaFile] = useState<File | null>(null);
  const [chatMediaCaption, setChatMediaCaption] = useState('');

  // Disconnected Session Connect Option State
  const [connectOptionModal, setConnectOptionModal] = useState<{ open: boolean; sessionId: string; method: 'qr' | 'pairing'; phone: string }>({
    open: false,
    sessionId: '',
    method: 'qr',
    phone: ''
  });

  const wsRef = useRef<WebSocket | null>(null);
  const selectedSessionIdRef = useRef<string>(selectedSessionId);
  const activeChatJidRef = useRef<string | null>(activeChatJid);
  selectedSessionIdRef.current = selectedSessionId;
  activeChatJidRef.current = activeChatJid;

  const addLog = (text: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLiveLogs((prev) => [{ id: Math.random().toString(), time, text, type }, ...prev.slice(0, 49)]);
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

  const fetchContacts = async (sessionId: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/v1/contacts?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.success) setContacts(data.data);
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

  // Helper for live spintax & variable preview
  const previewTemplate = (template: string, sampleName = 'Budi Santoso'): string => {
    let res = template.replace(/\{([^{}]+)\}/g, (_, choices) => {
      const parts = choices.split('|');
      return parts[0].trim(); // Display first variant for preview
    });
    res = res.replace(/\{\{name\}\}/gi, sampleName);
    res = res.replace(/\{\{phone\}\}/gi, '08123456789');
    res = res.replace(/\{\{tagihan\}\}/gi, '150.000');
    return res;
  };

  // Setup WebSocket for Real-Time synchronization
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
          addLog('WebSocket terhubung ke WhatsApp Local Hub Core', 'success');
        };

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);
            if (msg.event?.startsWith('session.')) {
              fetchSessions();
              addLog(`Event Sesi: ${msg.event} (${msg.payload?.sessionId || ''})`, 'info');
            }
            if (msg.event === 'message.received') {
              addLog(`Pesan Masuk dari ${msg.payload?.message?.senderJid}: "${msg.payload?.message?.text || '[Media]'}"`, 'info');
              const curSession = selectedSessionIdRef.current;
              const curChat = activeChatJidRef.current;
              if (curSession) {
                fetchChats(curSession);
                if (curChat && (msg.payload?.message?.chatJid === curChat || msg.payload?.message?.to === curChat)) {
                  fetchChatMessages(curSession, curChat);
                }
              }
            }
            if (msg.event === 'message.ack' || msg.event === 'message.sent') {
              const curSession = selectedSessionIdRef.current;
              const curChat = activeChatJidRef.current;
              if (curSession && curChat) {
                fetchChatMessages(curSession, curChat);
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
      ws?.close();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchContacts(selectedSessionId);
      fetchChats(selectedSessionId);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (selectedSessionId && activeChatJid) {
      fetchChatMessages(selectedSessionId, activeChatJid);
    }
  }, [selectedSessionId, activeChatJid]);

  // Session Actions
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

  const handleDisconnect = async (id: string) => {
    await fetch(`/api/v1/sessions/${id}/disconnect`, { method: 'POST' });
    fetchSessions();
    addLog(`Sesi ${id} diputus`, 'warn');
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm(`Hapus sesi ${id} dan seluruh file autentikasinya?`)) return;
    await fetch(`/api/v1/sessions/${id}`, { method: 'DELETE' });
    fetchSessions();
    addLog(`Sesi ${id} dihapus permanen`, 'warn');
  };

  const handleConnectSession = async (id: string) => {
    await fetch(`/api/v1/sessions/${id}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usePairingCode: false })
    });
    fetchSessions();
    addLog(`Menghubungkan sesi ${id}...`, 'info');
  };

  // Direct Chat Send
  const handleSendChatMessage = async () => {
    if (!selectedSessionId || !activeChatJid || !chatReplyText.trim()) return;
    const textToSend = chatReplyText;
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
  };

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

  // Send Media Message in Chat
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

  // Contact Handlers
  const handleAddContact = async () => {
    if (!selectedSessionId || !newContactPhone.trim()) return;
    try {
      const tagsArray = newContactTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch('/api/v1/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          phone: newContactPhone,
          name: newContactName,
          tags: tagsArray
        })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Kontak +${newContactPhone} berhasil disimpan`, 'success');
        setIsAddContactModal(false);
        setNewContactPhone('');
        setNewContactName('');
        fetchContacts(selectedSessionId);
      } else {
        alert(data.message || 'Gagal menyimpan kontak');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleOptOut = async (phone: string, currentVal: boolean) => {
    if (!selectedSessionId) return;
    try {
      await fetch('/api/v1/contacts/opt-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          phone,
          optOut: !currentVal
        })
      });
      fetchContacts(selectedSessionId);
      addLog(`Status Opt-Out kontak ${phone} diubah`, 'info');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteContact = async (phone: string) => {
    if (!selectedSessionId) return;
    if (!confirm(`Hapus kontak +${phone} dari database?`)) return;
    try {
      const res = await fetch(`/api/v1/contacts/${phone}?sessionId=${selectedSessionId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchContacts(selectedSessionId);
        addLog(`Kontak +${phone} dihapus`, 'warn');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Group Grabber: Save all members into Contacts
  const handleImportGroupToContacts = async (groupJid: string) => {
    if (!selectedSessionId) return;
    try {
      addLog('Menyimpan anggota grup ke kontak...', 'info');
      const res = await fetch(`/api/v1/groups/${groupJid}/import-to-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId })
      });
      const data = await res.json();
      if (data.success) {
        addLog(data.message, 'success');
        alert(data.message);
        fetchContacts(selectedSessionId);
      } else {
        alert(data.message || 'Gagal menyimpan anggota grup ke kontak');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Campaign: View recipients & Delete
  const handleViewRecipients = async (campaignId: string, name: string) => {
    try {
      const res = await fetch(`/api/v1/campaigns/${campaignId}/recipients?limit=200`);
      const data = await res.json();
      if (data.success) {
        setViewRecipientsList(data.data);
        setViewCampaignTitle(name);
        setIsViewRecipientsModal(true);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Hapus campaign broadcast ini? Riwayat log pengiriman penerima juga akan dihapus.')) return;
    try {
      const res = await fetch(`/api/v1/campaigns/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchCampaigns();
        addLog(`Campaign ${id} dihapus`, 'warn');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Auto-Responder: Toggle active & Edit
  const handleToggleRuleActive = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/automation/${id}/toggle`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        fetchRules();
        addLog(data.message, 'info');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenEditRule = (r: AutoRule) => {
    setEditRuleId(r.id);
    setEditRuleName(r.name);
    setEditRuleTriggerText(r.conditions[0]?.value || '');
    setEditRuleOperator((r.conditions[0]?.operator as any) || 'contains');
    setEditRuleReplyText(r.actions[0]?.text || '');
    setIsEditRuleModal(true);
  };

  const handleSaveEditedRule = async () => {
    if (!editRuleId || !editRuleName || !editRuleTriggerText || !editRuleReplyText) return;
    try {
      const res = await fetch('/api/v1/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editRuleId,
          name: editRuleName,
          conditions: [{ field: 'text', operator: editRuleOperator, value: editRuleTriggerText }],
          actions: [{ type: 'send_text', text: editRuleReplyText }],
          isActive: true
        })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Rule "${editRuleName}" berhasil diperbarui`, 'success');
        setIsEditRuleModal(false);
        fetchRules();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Create Campaign
  const handleCreateCampaign = async () => {
    if (!selectedSessionId || !campName || !campTemplate) return;
    const lines = campRecipientsRaw.split('\n').filter((l) => l.trim().length > 0);
    const recipients = lines.map((l) => {
      const parts = l.split(',');
      return {
        phone: parts[0]?.trim() || '',
        name: parts[1]?.trim() || ''
      };
    }).filter((r) => r.phone.length > 5);

    try {
      const res = await fetch('/api/v1/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          name: campName,
          templateText: campTemplate,
          randomDelayMin: campRandomDelayMin,
          randomDelayMax: campRandomDelayMax,
          recipients
        })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Campaign "${campName}" dibuat dengan ${recipients.length} kontak`, 'success');
        setIsNewCampaignModal(false);
        setCampName('');
        setCampRecipientsRaw('');
        fetchCampaigns();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartCampaign = async (id: string) => {
    await fetch(`/api/v1/campaigns/${id}/start`, { method: 'POST' });
    fetchCampaigns();
    addLog(`Campaign ${id} dimulai`, 'info');
  };

  const handlePauseCampaign = async (id: string) => {
    await fetch(`/api/v1/campaigns/${id}/pause`, { method: 'POST' });
    fetchCampaigns();
    addLog(`Campaign ${id} dijeda`, 'warn');
  };

  // Create Rule
  const handleCreateRule = async () => {
    if (!ruleName || !ruleTriggerText || !ruleReplyText) return;
    try {
      const res = await fetch('/api/v1/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ruleName,
          conditions: [{ field: 'text', operator: ruleOperator, value: ruleTriggerText }],
          actions: [{ type: 'send_text', text: ruleReplyText }],
          isActive: true
        })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Rule Auto-reply "${ruleName}" dibuat`, 'success');
        setIsNewRuleModal(false);
        setRuleName('');
        setRuleTriggerText('');
        fetchRules();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Simulator test
  const handleTestSimulator = (input: string) => {
    setSimTestInput(input);
    if (!input.trim()) {
      setSimMatchedRule(null);
      setSimEvaluatedReply('');
      return;
    }
    const lowerInput = input.toLowerCase();
    const matched = rules.find((r) => {
      const cond = r.conditions[0];
      if (!cond) return false;
      const lowerVal = cond.value.toLowerCase();
      if (cond.operator === 'equals') return lowerInput === lowerVal;
      if (cond.operator === 'starts_with') return lowerInput.startsWith(lowerVal);
      if (cond.operator === 'contains') return lowerInput.includes(lowerVal);
      if (cond.operator === 'regex') {
        try {
          return new RegExp(cond.value, 'i').test(input);
        } catch {
          return false;
        }
      }
      return false;
    });

    if (matched) {
      setSimMatchedRule(matched);
      const actionText = matched.actions[0]?.text || '';
      setSimEvaluatedReply(previewTemplate(actionText, 'Pelanggan'));
    } else {
      setSimMatchedRule(null);
      setSimEvaluatedReply('');
    }
  };

  // Backup in .wahub format
  const handleCreateBackup = async () => {
    try {
      const res = await fetch('/api/v1/system/backup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addLog(`Backup berhasil dibuat: ${data.data.backupFileName}`, 'success');
        fetchBackups();
        fetchAuditLogs();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const connectedCount = sessions.filter((s) => s.status === 'CONNECTED').length;

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 flex-shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              W
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white leading-tight">WhatsApp Local Hub</h1>
              <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                Tauri Desktop Edition
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'sessions' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Smartphone className="w-4 h-4" />
              <span>WhatsApp Sesi</span>
            </div>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full font-mono text-emerald-400">
              {connectedCount}/{sessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'messages' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Live Chat & Percakapan</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'contacts' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manajemen Kontak</span>
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'groups' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Group Grabber</span>
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'campaigns' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Send className="w-4 h-4" />
              <span>Campaign Broadcast</span>
            </div>
            {campaigns.length > 0 && (
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full font-mono text-slate-300">
                {campaigns.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('automation')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'automation' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Auto-Responder & Bot</span>
          </button>

          <div className="pt-4 pb-1 border-t border-slate-800 my-2">
            <span className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Developer & Tools</span>
          </div>

          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Swagger API Docs</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>

          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'system' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Storage & Backup (.wahub)</span>
          </button>
        </nav>

        {/* Selected Session in Sidebar */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800">
          <label className="text-[11px] text-slate-400 block mb-1 font-medium">Sesi Terpilih di Dashboard:</label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full bg-slate-800 text-white text-xs rounded-lg border border-slate-700 py-1.5 px-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            {sessions.length === 0 ? (
              <option value="">Belum ada akun</option>
            ) : (
              sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))
            )}
          </select>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-sm font-bold text-slate-900 capitalize tracking-tight">
              {activeTab === 'overview' && 'Dashboard Telemetri & Aktivitas Real-Time'}
              {activeTab === 'sessions' && 'Manajemen Akun WhatsApp (Multi-Session)'}
              {activeTab === 'messages' && 'Live Chat & Inbox Percakapan WhatsApp'}
              {activeTab === 'contacts' && 'Daftar Kontak & Manajemen Audiens'}
              {activeTab === 'groups' && 'WhatsApp Group Grabber (Ekstraksi Anggota)'}
              {activeTab === 'campaigns' && 'Campaign Broadcast & Smart Blaster'}
              {activeTab === 'automation' && 'Aturan Balas Otomatis (Auto-Responder & Simulator)'}
              {activeTab === 'system' && 'Kesehatan Mesin, Audit Log & Cadangan .wahub'}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Core Port: 3000</span>
            </div>

            <button
              onClick={() => {
                fetchSessions();
                fetchCampaigns();
                fetchSystemStatus();
                fetchAuditLogs();
                if (selectedSessionId) {
                  fetchChats(selectedSessionId);
                }
                addLog('Data disegarkan', 'info');
              }}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Segarkan Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAddSessionModal(true)}
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Akun WA</span>
            </button>
          </div>
        </header>

        {/* System Tray Informative Banner */}
        {!isTrayNoticeDismissed && (
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                <strong>Mode Desktop Aktif:</strong> Saat Anda menutup jendela ini (tombol X), aplikasi akan tetap berjalan di <strong>System Tray (dekat jam)</strong> agar pesan masuk, bot auto-reply, dan campaign tidak terputus.
              </span>
            </div>
            <button
              onClick={() => setIsTrayNoticeDismissed(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] ml-4"
            >
              Mengerti
            </button>
          </div>
        )}

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Akun Terhubung</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {connectedCount} <span className="text-sm font-normal text-slate-400">/ {sessions.length}</span>
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Total Kontak</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{contacts.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Total Broadcast</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{campaigns.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">RAM Pemakaian</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {systemStatus?.memory.rssMb || 0} <span className="text-xs font-normal text-slate-400">MB</span>
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Sessions Grid Preview */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 text-sm">Status Akun WhatsApp Terpasang</h3>
                  <button
                    onClick={() => setActiveTab('sessions')}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Kelola Sesi Lengkap &rarr;
                  </button>
                </div>

                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Belum ada akun terdaftar. Klik tombol <b>"Tambah Akun WA"</b> untuk menghubungkan WhatsApp Anda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sessions.map((s) => (
                      <div key={s.id} className="border border-slate-200 rounded-xl p-3.5 hover:border-slate-300 transition">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">{s.name}</span>
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                              s.status === 'CONNECTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.status === 'QR_READY'
                                ? 'bg-amber-100 text-amber-800'
                                : s.status === 'PAIRING_READY'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {s.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                          {s.phoneNumber ? `+${s.phoneNumber}` : 'Menunggu koneksi...'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Real-time Activity Logs */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Aktivitas Real-Time Engine (Live Event Stream)</span>
                </h3>
                <div className="bg-slate-900 rounded-xl p-3 text-xs font-mono text-slate-200 h-48 overflow-y-auto space-y-1">
                  {liveLogs.length === 0 ? (
                    <p className="text-slate-500 italic">Menunggu aktivitas pesan atau sesi...</p>
                  ) : (
                    liveLogs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-2">
                        <span className="text-slate-500">[{log.time}]</span>
                        <span
                          className={
                            log.type === 'success'
                              ? 'text-emerald-400'
                              : log.type === 'warn'
                              ? 'text-amber-400'
                              : 'text-slate-300'
                          }
                        >
                          {log.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sessions.map((s) => (
                  <div key={s.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                        <span className="text-xs text-slate-400 font-mono">ID: {s.id}</span>
                      </div>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                          s.status === 'CONNECTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'QR_READY'
                            ? 'bg-amber-100 text-amber-800'
                            : s.status === 'PAIRING_READY'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col items-center justify-center text-center min-h-[220px]">
                      {s.status === 'CONNECTED' && (
                        <div className="space-y-2">
                          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8" />
                          </div>
                          <p className="font-bold text-base text-slate-900">+{s.phoneNumber}</p>
                          <p className="text-xs text-slate-400">Siap menerima dan mengirim pesan otomatis</p>
                        </div>
                      )}

                      {s.status === 'QR_READY' && s.qrCode && (
                        <div className="space-y-2">
                          <img src={s.qrCode} alt="WhatsApp QR" className="w-48 h-48 mx-auto border rounded-xl shadow-sm" />
                          <p className="text-xs text-slate-500">Scan QR Code ini menggunakan menu Perangkat Tertaut di WhatsApp HP</p>
                        </div>
                      )}

                      {s.status === 'PAIRING_READY' && s.pairingCode && (
                        <div className="space-y-3 w-full">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                            <KeyRound className="w-6 h-6" />
                          </div>
                          <p className="text-xs text-slate-500">Masukkan 8-digit kode ini di WhatsApp HP Anda:</p>
                          <div className="flex items-center justify-center space-x-1.5 font-mono text-xl font-bold text-blue-700 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-200">
                            {s.pairingCode.split('').map((char, i) => (
                              <span key={i} className="inline-block bg-white px-2 py-1 rounded border border-blue-100 shadow-2xs">
                                {char}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(s.pairingCode || '');
                              setCopiedPairingCode(true);
                              setTimeout(() => setCopiedPairingCode(false), 2000);
                            }}
                            className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            {copiedPairingCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedPairingCode ? 'Kode Tersalin!' : 'Salin 8 Digit Kode'}</span>
                          </button>
                        </div>
                      )}

                      {(s.status === 'DISCONNECTED' || s.status === 'CONNECTING') && (
                        <div className="space-y-3">
                          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                            <Smartphone className="w-6 h-6" />
                          </div>
                          <p className="text-xs text-slate-400">
                            {s.status === 'CONNECTING' ? 'Menghubungkan ke server WhatsApp...' : 'Sesi ini sedang tidak aktif'}
                          </p>
                          {s.status === 'DISCONNECTED' && (
                            <button
                              onClick={() => handleConnectSession(s.id)}
                              className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
                            >
                              Hubungkan Sekarang
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      {s.status === 'CONNECTED' ? (
                        <button
                          onClick={() => handleDisconnect(s.id)}
                          className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
                        >
                          Putuskan Koneksi
                        </button>
                      ) : (
                        <div></div>
                      )}
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Sesi</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE CHAT & CONVERSATIONS (SPLIT PANE) */}
          {activeTab === 'messages' && (
            <div className="h-[calc(100vh-130px)] bg-white rounded-xl border border-slate-200 shadow-sm flex overflow-hidden">
              {/* Left Pane: Chat List */}
              <div className="w-80 border-r border-slate-200 flex flex-col flex-shrink-0 bg-slate-50/50">
                <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari percakapan..."
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setIsNewChatModal(true)}
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                    title="Mulai Chat Baru"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {chats.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Belum ada percakapan. Klik tombol <strong>+</strong> untuk memulai chat baru.
                    </div>
                  ) : (
                    chats
                      .filter((c) => {
                        const target = `${c.chat_jid} ${c.name || ''} ${c.last_message || ''}`.toLowerCase();
                        return target.includes(chatSearchQuery.toLowerCase());
                      })
                      .map((c) => {
                        const isSelected = activeChatJid === c.chat_jid;
                        const cleanPhone = c.chat_jid.replace(/[^0-9]/g, '');
                        return (
                          <div
                            key={c.chat_jid}
                            onClick={() => setActiveChatJid(c.chat_jid)}
                            className={`p-3 cursor-pointer transition flex items-center space-x-3 ${
                              isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-100/70'
                            }`}
                          >
                            <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                              {(c.name || c.push_name || cleanPhone).substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-xs text-slate-900 truncate">
                                  {c.name || c.push_name || `+${cleanPhone}`}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {c.last_message || '[Media / Pesan]'}
                              </p>
                            </div>
                            {c.unread_count && c.unread_count > 0 ? (
                              <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                                {c.unread_count}
                              </span>
                            ) : null}
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Right Pane: Conversation Thread */}
              <div className="flex-1 flex flex-col bg-[#efeae2]/20">
                {activeChatJid ? (
                  <>
                    {/* Chat Header */}
                    <div className="h-14 border-b border-slate-200 px-4 bg-white flex items-center justify-between shadow-2xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {activeChatJid.replace(/[^0-9]/g, '').substring(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-bold text-xs text-slate-900">
                            {chats.find((c) => c.chat_jid === activeChatJid)?.name || `+${activeChatJid.replace(/[^0-9]/g, '')}`}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-mono">{activeChatJid}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono">
                        Sesi: {selectedSessionId}
                      </span>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                          <MessageCircle className="w-10 h-10 text-slate-300 mb-2" />
                          <p>Belum ada pesan dalam percakapan ini.</p>
                          <p className="text-[11px] mt-1">Ketik pesan di bawah untuk memulai obrolan.</p>
                        </div>
                      ) : (
                        chatMessages.map((m) => {
                          const isMe = Boolean(m.from_me);
                          return (
                            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-md rounded-xl p-3 shadow-2xs text-xs space-y-1 ${
                                  isMe
                                    ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none'
                                    : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'
                                }`}
                              >
                                {m.media_url && (
                                  <div className="mb-1 rounded overflow-hidden">
                                    <img src={m.media_url} alt="Media" className="max-h-48 rounded object-cover" />
                                  </div>
                                )}
                                <p className="leading-relaxed whitespace-pre-wrap">{m.content_text || m.caption}</p>
                                <div className="flex items-center justify-end space-x-1 text-[10px] text-slate-400 mt-0.5">
                                  <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  {isMe && (
                                    <span>
                                      {m.status === 'READ' ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />
                                      ) : m.status === 'DELIVERED' ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-slate-400 inline" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5 text-slate-400 inline" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Box */}
                    <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
                      <button
                        onClick={() => setIsSendMediaModal(true)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                        title="Kirim Gambar / Dokumen"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        placeholder="Ketik pesan WhatsApp (tekan Enter untuk mengirim)..."
                        value={chatReplyText}
                        onChange={(e) => setChatReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendChatMessage();
                          }
                        }}
                        className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={handleSendChatMessage}
                        disabled={!chatReplyText.trim()}
                        className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <MessageSquare className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-700">Pilih Percakapan</h3>
                    <p className="text-xs max-w-sm mt-1 text-slate-400">
                      Pilih salah satu kontak di panel kiri untuk membuka riwayat obrolan atau klik tombol + untuk memulai chat ke nomor baru.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Daftar Kontak & Audiens</h3>
                  <p className="text-xs text-slate-400">Total: {contacts.length} kontak tersimpan</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari kontak, nomor, tag..."
                      value={contactSearchQuery}
                      onChange={(e) => setContactSearchQuery(e.target.value)}
                      className="pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none w-48 sm:w-60"
                    />
                  </div>

                  <button
                    onClick={() => setIsAddContactModal(true)}
                    className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Kontak</span>
                  </button>

                  <label className="cursor-pointer inline-flex items-center space-x-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-medium shadow-sm transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Excel</span>
                    <input
                      type="file"
                      accept=".xlsx,.csv"
                      className="hidden"
                      onChange={async (e) => {
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
                    className="inline-flex items-center space-x-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-medium shadow-sm transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </a>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Nomor Telepon</th>
                      <th className="py-2.5 px-3">Nama</th>
                      <th className="py-2.5 px-3">Push Name</th>
                      <th className="py-2.5 px-3">Tags</th>
                      <th className="py-2.5 px-3">Status Opt-Out</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contacts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Belum ada kontak tersimpan. Klik <b>"Tambah Kontak"</b> atau <b>"Import Excel"</b> untuk memulai.
                        </td>
                      </tr>
                    ) : (
                      contacts
                        .filter((c) => {
                          const target = `${c.phone} ${c.name || ''} ${c.push_name || ''} ${c.tags.join(' ')}`.toLowerCase();
                          return target.includes(contactSearchQuery.toLowerCase());
                        })
                        .map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-900">+{c.phone}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">{c.name || '-'}</td>
                            <td className="py-2.5 px-3 text-slate-500">{c.push_name || '-'}</td>
                            <td className="py-2.5 px-3">
                              {c.tags.map((t) => (
                                <span key={t} className="bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] mr-1 inline-block my-0.5">
                                  {t}
                                </span>
                              ))}
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => handleToggleOptOut(c.phone, c.opt_out)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                                  c.opt_out
                                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                }`}
                                title="Klik untuk ubah status Opt-Out"
                              >
                                {c.opt_out ? '🚫 Opted-Out (Dibatasi)' : '✔ Aktif (Bisa Kirim)'}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleDeleteContact(c.phone)}
                                className="text-slate-400 hover:text-rose-600 transition p-1"
                                title="Hapus Kontak"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: GROUP GRABBER */}
          {activeTab === 'groups' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">WhatsApp Group Grabber</h3>
                  <p className="text-xs text-slate-400">Ekstrak seluruh nomor anggota grup WhatsApp yang diikuti ke database atau file Excel</p>
                </div>

                <button
                  onClick={() => fetchGroups(selectedSessionId)}
                  className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ambil Daftar Grup</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {groups.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-400 text-sm">
                    Klik <b>"Ambil Daftar Grup"</b> untuk mendeteksi grup-grup pada sesi WhatsApp ini.
                  </div>
                ) : (
                  groups.map((g) => (
                    <div key={g.jid} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 transition shadow-2xs">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm truncate">{g.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">Anggota: <span className="font-semibold text-slate-800">{g.memberCount} orang</span></p>
                        <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{g.jid}</p>
                      </div>

                      <div className="mt-4 space-y-2">
                        <button
                          onClick={() => handleImportGroupToContacts(g.jid)}
                          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition border border-blue-200"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Simpan Anggota ke Kontak</span>
                        </button>
                        <a
                          href={`/api/v1/groups/${g.jid}/export?sessionId=${selectedSessionId}`}
                          download
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Excel (.xlsx)</span>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CAMPAIGNS */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Smart Campaign Broadcast</h3>
                  <p className="text-xs text-slate-500">Kirim pesan massal dengan random delay, spintax, dan proteksi anti-banned</p>
                </div>

                <button
                  onClick={() => setIsNewCampaignModal(true)}
                  className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Broadcast Baru</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {campaigns.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                    Belum ada campaign. Buat broadcast baru untuk memulai pengiriman massal teratur.
                  </div>
                ) : (
                  campaigns.map((c) => (
                    <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                          <span className="text-xs text-slate-400 font-mono">ID: {c.id}</span>
                        </div>
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                            c.status === 'RUNNING'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : c.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Progress: {c.sent_count} / {c.total_recipients} Terkirim</span>
                          <span>Gagal: {c.failed_count}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${c.total_recipients > 0 ? (c.sent_count / c.total_recipients) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-400 font-mono truncate max-w-md">Template: "{c.template_text}"</p>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewRecipients(c.id, c.name)}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition"
                            title="Lihat Log Penerima"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Penerima</span>
                          </button>
                          {c.status === 'RUNNING' ? (
                            <button
                              onClick={() => handlePauseCampaign(c.id)}
                              className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-lg hover:bg-amber-200 transition"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              <span>Jeda</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartCampaign(c.id)}
                              className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Jalankan</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCampaign(c.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-medium rounded-lg transition"
                            title="Hapus Broadcast"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 7: AUTOMATION */}
          {activeTab === 'automation' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Auto-Responder & Bot Rules</h3>
                  <p className="text-xs text-slate-500">Evaluasi kata kunci dan balas otomatis pesan masuk pelanggan</p>
                </div>

                <button
                  onClick={() => setIsNewRuleModal(true)}
                  className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Rule Baru</span>
                </button>
              </div>

              {/* Interactive Rule Simulator */}
              <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center space-x-2 text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-xs">Simulator Uji Coba Kata Kunci Bot (Interactive Tester)</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Ketik contoh pesan pelanggan di sini, misal: 'info harga paket'..."
                    value={simTestInput}
                    onChange={(e) => handleTestSimulator(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                {simTestInput && (
                  <div className="bg-slate-50 rounded-lg p-2.5 text-xs space-y-1">
                    {simMatchedRule ? (
                      <>
                        <p className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Cocok dengan Aturan: "{simMatchedRule.name}"</span>
                        </p>
                        <p className="text-slate-600">
                          <span className="font-medium text-slate-800">Balasan yang akan dikirim:</span> "{simEvaluatedReply}"
                        </p>
                      </>
                    ) : (
                      <p className="text-slate-400 italic">Tidak ada aturan yang cocok dengan kata kunci ini.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rules.length === 0 ? (
                  <div className="col-span-full bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                    Belum ada aturan auto-reply. Klik <b>"Tambah Rule Baru"</b> untuk mengatur kata kunci otomatis.
                  </div>
                ) : (
                  rules.map((r) => (
                    <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900 text-sm">{r.name}</h4>
                          <button
                            onClick={() => handleToggleRuleActive(r.id)}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition cursor-pointer ${
                              r.is_active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            title="Klik untuk ubah status aktif/nonaktif"
                          >
                            {r.is_active ? '● Aktif' : '○ Nonaktif'}
                          </button>
                        </div>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono">
                          Hit: {r.hit_count}x
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg text-xs space-y-1">
                        <p className="text-slate-600">
                          <span className="font-semibold text-slate-800">Trigger:</span> Pesan{' '}
                          <span className="font-mono text-blue-600">[{r.conditions[0]?.operator || 'contains'}]</span> "
                          {r.conditions[0]?.value}"
                        </p>
                        <p className="text-slate-600">
                          <span className="font-semibold text-slate-800">Balasan:</span> "{r.actions[0]?.text}"
                        </p>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenEditRule(r)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Hapus aturan "${r.name}"?`)) return;
                            await fetch(`/api/v1/automation/${r.id}`, { method: 'DELETE' });
                            fetchRules();
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 8: SYSTEM */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Status Kesehatan Mesin (Telemetry)</span>
                  </h3>

                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Mode Aplikasi</span>
                      <span className="font-semibold text-blue-600 font-mono">
                        {systemStatus?.isPortable ? 'Portable Mode (Zero-Config)' : 'Installed Mode'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Direktori Data</span>
                      <span className="font-mono text-slate-700 truncate max-w-xs">{systemStatus?.storageDir}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">RAM Terpakai (RSS)</span>
                      <span className="font-semibold text-slate-900 font-mono">{systemStatus?.memory.rssMb} MB</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Sisa RAM Laptop</span>
                      <span className="font-semibold text-slate-900 font-mono">{systemStatus?.memory.freeSystemMemMb} MB</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Uptime Server</span>
                      <span className="font-mono text-slate-700">{systemStatus?.uptimeSeconds} detik</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-blue-600" />
                      <span>Cadangan Database (.wahub)</span>
                    </h3>
                    <button
                      onClick={handleCreateBackup}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
                    >
                      Buat Backup .wahub
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {backups.length === 0 ? (
                      <p className="text-slate-400 italic py-4 text-center">Belum ada file backup.</p>
                    ) : (
                      backups.map((b) => (
                        <div key={b.fileName} className="flex items-center justify-between p-2 border border-slate-100 rounded-lg bg-slate-50">
                          <div>
                            <p className="font-mono font-medium text-slate-900">{b.fileName}</p>
                            <p className="text-[10px] text-slate-400">Ukuran: {(b.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <span className="text-blue-600 font-semibold text-[11px]">Valid .wahub</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Audit Logs Table (PRD Section 24 & 34) */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Rekam Jejak Keamanan & Audit Log Sistem (PRD Section 34)</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                      <tr>
                        <th className="py-2 px-3">Waktu</th>
                        <th className="py-2 px-3">Tipe Event</th>
                        <th className="py-2 px-3">Detail Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-slate-400">
                            Belum ada rekam audit tercatat.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.slice(0, 15).map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{log.event_type}</td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                              {JSON.stringify(log.payload)}
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
        </div>
      </main>

      {/* MODAL: CHAT BARU */}
      {isNewChatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Mulai Chat Baru</h3>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nomor WhatsApp Tujuan (dengan kode negara):</label>
              <input
                type="text"
                placeholder="Contoh: 628123456789"
                value={newChatPhone}
                onChange={(e) => setNewChatPhone(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setIsNewChatModal(false)}
                className="flex-1 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                disabled={!newChatPhone.trim()}
                onClick={handleStartNewChat}
                className="flex-1 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition"
              >
                Buka Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH SESI */}
      {isAddSessionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Tambah Akun WhatsApp Baru</h3>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Session ID (Unik, tanpa spasi):</label>
              <input
                type="text"
                placeholder="Contoh: marketing, cs1, sales"
                value={newSessionId}
                onChange={(e) => setNewSessionId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nama Tampilan (Opsional):</label>
              <input
                type="text"
                placeholder="Contoh: WhatsApp Marketing Pusat"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-2">Metode Login:</label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`border rounded-lg p-3 cursor-pointer text-center text-xs font-medium transition ${
                    loginMethod === 'qr'
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="loginMethod"
                    value="qr"
                    checked={loginMethod === 'qr'}
                    onChange={() => setLoginMethod('qr')}
                    className="hidden"
                  />
                  <QrCode className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  Scan QR Code
                </label>

                <label
                  className={`border rounded-lg p-3 cursor-pointer text-center text-xs font-medium transition ${
                    loginMethod === 'pairing'
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="loginMethod"
                    value="pairing"
                    checked={loginMethod === 'pairing'}
                    onChange={() => setLoginMethod('pairing')}
                    className="hidden"
                  />
                  <KeyRound className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
                  Pairing Code (8 Digit)
                </label>
              </div>
            </div>

            {loginMethod === 'pairing' && (
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nomor WhatsApp HP:</label>
                <input
                  type="text"
                  placeholder="Contoh: 628123456789"
                  value={pairingPhone}
                  onChange={(e) => setPairingPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setIsAddSessionModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                disabled={!newSessionId || (loginMethod === 'pairing' && !pairingPhone)}
                onClick={handleCreateSession}
                className="flex-1 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition shadow-sm"
              >
                Mulai & Tampilkan QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUAT CAMPAIGN */}
      {isNewCampaignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-base">Buat Campaign Broadcast Baru</h3>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nama Campaign:</label>
              <input
                type="text"
                placeholder="Contoh: Promo Spesial Weekend"
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Template Pesan (Mendukung Spintax & Variabel):</label>
              <textarea
                rows={3}
                value={campTemplate}
                onChange={(e) => setCampTemplate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Gunakan <code>&#123;Halo|Hai&#125;</code> untuk spintax acak dan <code>&#123;&#123;name&#125;&#125;</code> untuk nama penerima.</p>
              
              {/* Live Preview Box */}
              <div className="mt-2 bg-blue-50/70 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-900">
                <span className="font-semibold block text-[11px] text-blue-700 mb-0.5">Pratinjau Variasi Pesan:</span>
                <p className="italic font-mono text-[11px]">{previewTemplate(campTemplate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Jeda Acak Minimal (detik):</label>
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={campRandomDelayMin}
                  onChange={(e) => setCampRandomDelayMin(parseInt(e.target.value, 10))}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Jeda Acak Maksimal (detik):</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={campRandomDelayMax}
                  onChange={(e) => setCampRandomDelayMax(parseInt(e.target.value, 10))}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-600 block">Daftar Penerima (Nomor,Nama per baris):</label>
                {contacts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const formatted = contacts
                        .filter((c) => !c.opt_out)
                        .map((c) => `${c.phone},${c.name || ''}`)
                        .join('\n');
                      setCampRecipientsRaw(formatted);
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    + Masukkan Seluruh Kontak Aktif ({contacts.filter((c) => !c.opt_out).length})
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                placeholder="628123456789,Budi&#10;628987654321,Siti"
                value={campRecipientsRaw}
                onChange={(e) => setCampRecipientsRaw(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setIsNewCampaignModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                disabled={!campName || !campTemplate}
                onClick={handleCreateCampaign}
                className="flex-1 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition shadow-sm"
              >
                Simpan & Siapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUAT RULE AUTO-REPLY */}
      {isNewRuleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Tambah Aturan Balas Otomatis</h3>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nama Aturan:</label>
              <input
                type="text"
                placeholder="Contoh: Auto Reply Pricelist"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-xs font-medium text-slate-600 block mb-1">Tipe Match:</label>
                <select
                  value={ruleOperator}
                  onChange={(e) => setRuleOperator(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="contains">Mengandung</option>
                  <option value="equals">Persis Sama</option>
                  <option value="starts_with">Diawali</option>
                  <option value="regex">Regex</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600 block mb-1">Kata Kunci Trigger:</label>
                <input
                  type="text"
                  placeholder="Contoh: harga, info, brosur"
                  value={ruleTriggerText}
                  onChange={(e) => setRuleTriggerText(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Teks Balasan Otomatis:</label>
              <textarea
                rows={3}
                value={ruleReplyText}
                onChange={(e) => setRuleReplyText(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Dapat menggunakan <code>&#123;Halo|Hai&#125;</code> dan <code>&#123;&#123;name&#125;&#125;</code>.</p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setIsNewRuleModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                disabled={!ruleName || !ruleTriggerText || !ruleReplyText}
                onClick={handleCreateRule}
                className="flex-1 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition shadow-sm"
              >
                Simpan Aturan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT RULE AUTO-REPLY */}
      {isEditRuleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Edit Aturan Balas Otomatis</h3>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nama Aturan:</label>
              <input
                type="text"
                value={editRuleName}
                onChange={(e) => setEditRuleName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-xs font-medium text-slate-600 block mb-1">Tipe Match:</label>
                <select
                  value={editRuleOperator}
                  onChange={(e) => setEditRuleOperator(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="contains">Mengandung</option>
                  <option value="equals">Persis Sama</option>
                  <option value="starts_with">Diawali</option>
                  <option value="regex">Regex</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600 block mb-1">Kata Kunci Trigger:</label>
                <input
                  type="text"
                  value={editRuleTriggerText}
                  onChange={(e) => setEditRuleTriggerText(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Teks Balasan Otomatis:</label>
              <textarea
                rows={3}
                value={editRuleReplyText}
                onChange={(e) => setEditRuleReplyText(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setIsEditRuleModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                disabled={!editRuleName || !editRuleTriggerText || !editRuleReplyText}
                onClick={handleSaveEditedRule}
                className="flex-1 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition shadow-sm"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH KONTAK BARU */}
      {isAddContactModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Tambah Kontak Baru</h3>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nomor WhatsApp (dengan kode negara):</label>
              <input
                type="text"
                placeholder="Contoh: 628123456789"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nama Kontak:</label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Tags (pisahkan koma):</label>
              <input
                type="text"
                placeholder="Contoh: VIP, Member, Promo"
                value={newContactTags}
                onChange={(e) => setNewContactTags(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setIsAddContactModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                disabled={!newContactPhone.trim()}
                onClick={handleAddContact}
                className="flex-1 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition shadow-sm"
              >
                Simpan Kontak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LIHAT PENERIMA CAMPAIGN */}
      {isViewRecipientsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Detail Log Penerima Broadcast</h3>
                <p className="text-xs text-slate-500">Campaign: <strong>{viewCampaignTitle}</strong> ({viewRecipientsList.length} penerima)</p>
              </div>
              <button
                onClick={() => setIsViewRecipientsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Nomor Telepon</th>
                    <th className="py-2 px-3">Nama</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Keterangan / Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewRecipientsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Tidak ada penerima terdaftar.
                      </td>
                    </tr>
                  ) : (
                    viewRecipientsList.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-medium text-slate-900">+{r.phone}</td>
                        <td className="py-2 px-3">{r.name || '-'}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              r.status === 'SENT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'FAILED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-xs">
                          {r.error_message || (r.sent_at ? `Terkirim pada ${new Date(r.sent_at).toLocaleTimeString()}` : '-')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsViewRecipientsModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KIRIM MEDIA CHAT */}
      {isSendMediaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Kirim Media ke Obrolan</h3>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Pilih File (Gambar / PDF / Dokumen):</label>
              <input
                type="file"
                onChange={(e) => setChatMediaFile(e.target.files?.[0] || null)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Caption (Opsional):</label>
              <input
                type="text"
                placeholder="Tulis keterangan file..."
                value={chatMediaCaption}
                onChange={(e) => setChatMediaCaption(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => {
                  setIsSendMediaModal(false);
                  setChatMediaFile(null);
                  setChatMediaCaption('');
                }}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                disabled={!chatMediaFile}
                onClick={handleSendChatMedia}
                className="flex-1 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition shadow-sm"
              >
                Kirim Media
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
