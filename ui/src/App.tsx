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
  ExternalLink
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
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [liveLogs, setLiveLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'success' | 'warn' }>>([]);

  // Modals state
  const [isAddSessionModal, setIsAddSessionModal] = useState(false);
  const [newSessionId, setNewSessionId] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [loginMethod, setLoginMethod] = useState<'qr' | 'pairing'>('qr');
  const [pairingPhone, setPairingPhone] = useState('');

  // Direct Message Form
  const [msgTo, setMsgTo] = useState('');
  const [msgText, setMsgText] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // New Campaign Form
  const [isNewCampaignModal, setIsNewCampaignModal] = useState(false);
  const [campName, setCampName] = useState('');
  const [campTemplate, setCampTemplate] = useState('Halo {{name}}, perkenalkan kami dari tim support...');
  const [campRecipientsRaw, setCampRecipientsRaw] = useState('');

  // New Rule Form
  const [isNewRuleModal, setIsNewRuleModal] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleTriggerText, setRuleTriggerText] = useState('');
  const [ruleReplyText, setRuleReplyText] = useState('{Halo|Hai} {{name}}, terima kasih telah menghubungi kami!');

  const wsRef = useRef<WebSocket | null>(null);

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

  // Setup WebSocket for Real-Time synchronization
  useEffect(() => {
    fetchSessions();
    fetchCampaigns();
    fetchRules();
    fetchSystemStatus();
    fetchBackups();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      addLog('WebSocket terhubung ke Local Core Server', 'success');
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.event === 'session.status' || msg.event === 'session.qr' || msg.event === 'session.pairing_code' || msg.event === 'session.connected' || msg.event === 'session.disconnected') {
          fetchSessions();
          addLog(`Event Sesi: ${msg.event} (${msg.payload?.sessionId || ''})`, 'info');
        }
        if (msg.event === 'message.received') {
          addLog(`Pesan masuk dari ${msg.payload?.message?.senderJid}: "${msg.payload?.message?.text || '[Media]'}"`, 'info');
        }
        if (msg.event === 'campaign.updated') {
          fetchCampaigns();
        }
      } catch (err) {
        console.error(err);
      }
    };

    ws.onclose = () => {
      addLog('WebSocket terputus, mencoba reconnect...', 'warn');
    };

    const interval = setInterval(() => {
      fetchSystemStatus();
    }, 5000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchContacts(selectedSessionId);
    }
  }, [selectedSessionId]);

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

  // Direct Message Send
  const handleSendMessage = async () => {
    if (!selectedSessionId || !msgTo || !msgText) return;
    setIsSendingMsg(true);
    try {
      const res = await fetch('/api/v1/messages/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          to: msgTo,
          text: msgText
        })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Pesan berhasil dikirim ke ${msgTo}`, 'success');
        setMsgText('');
      } else {
        alert(data.message || 'Gagal mengirim pesan');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSendingMsg(false);
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
          conditions: [{ field: 'text', operator: 'contains', value: ruleTriggerText }],
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

  // Backup
  const handleCreateBackup = async () => {
    try {
      const res = await fetch('/api/v1/system/backup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addLog(`Backup berhasil dibuat: ${data.data.backupFileName}`, 'success');
        fetchBackups();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const connectedCount = sessions.filter((s) => s.status === 'CONNECTED').length;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 flex-shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              W
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white leading-tight">WhatsApp Local Hub</h1>
              <p className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                Portable Edition
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'sessions' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-300'
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
              activeTab === 'messages' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Direct Message / Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'contacts' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manajemen Kontak</span>
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'groups' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Group Grabber</span>
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'campaigns' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-300'
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
              activeTab === 'automation' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Auto-Responder & Bot</span>
          </button>

          <div className="pt-4 pb-1 border-t border-slate-800 my-2">
            <span className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sistem & Dev</span>
          </div>

          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Swagger API Docs</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>

          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'system' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Storage & Backup</span>
          </button>
        </nav>

        {/* Selected Session Pill in Sidebar */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800">
          <label className="text-xs text-slate-400 block mb-1 font-medium">Sesi Aktif di Dashboard:</label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full bg-slate-800 text-white text-xs rounded border border-slate-700 py-1.5 px-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-100">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-semibold text-slate-800 capitalize">
              {activeTab === 'overview' && 'Dashboard Telemetri & Aktivitas'}
              {activeTab === 'sessions' && 'Manajemen Akun WhatsApp (Multi-Session)'}
              {activeTab === 'messages' && 'Kirim Pesan & Direct Chat'}
              {activeTab === 'contacts' && 'Daftar Kontak & Audiens'}
              {activeTab === 'groups' && 'Group Grabber & Member Extractor'}
              {activeTab === 'campaigns' && 'Campaign Broadcast & Blaster'}
              {activeTab === 'automation' && 'Aturan Balas Otomatis (Auto-Responder)'}
              {activeTab === 'system' && 'Kesehatan Sistem, RAM & Backup'}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                fetchSessions();
                fetchCampaigns();
                fetchSystemStatus();
                addLog('Data disegarkan', 'info');
              }}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
              title="Segarkan Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAddSessionModal(true)}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Akun WA</span>
            </button>
          </div>
        </header>

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
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                      {connectedCount} <span className="text-sm font-normal text-slate-400">/ {sessions.length}</span>
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Total Kontak</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{contacts.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Campaign Broadcast</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{campaigns.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">RAM Pemakaian</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                      {systemStatus?.memory.rssMb || 0} <span className="text-xs font-normal text-slate-400">MB</span>
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Sessions Grid Preview */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800 text-sm">Status Akun WhatsApp Terpasang</h3>
                  <button
                    onClick={() => setActiveTab('sessions')}
                    className="text-xs text-emerald-600 hover:underline font-medium"
                  >
                    Kelola Semua Sesi &rarr;
                  </button>
                </div>

                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Belum ada akun terdaftar. Klik tombol <b>"Tambah Akun WA"</b> untuk menghubungkan.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sessions.map((s) => (
                      <div key={s.id} className="border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-slate-800">{s.name}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
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
                          {s.phoneNumber ? `+${s.phoneNumber}` : 'Belum terautentikasi'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Real-time Activity Logs */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Aktivitas Real-Time Engine (Live Event Stream)</span>
                </h3>
                <div className="bg-slate-900 rounded-lg p-3 text-xs font-mono text-slate-200 h-48 overflow-y-auto space-y-1">
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
                        <h4 className="font-bold text-slate-800 text-sm">{s.name}</h4>
                        <span className="text-xs text-slate-400 font-mono">ID: {s.id}</span>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
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
                          <p className="font-bold text-base text-slate-800">+{s.phoneNumber}</p>
                          <p className="text-xs text-slate-400">Siap menerima dan mengirim pesan</p>
                        </div>
                      )}

                      {s.status === 'QR_READY' && s.qrCode && (
                        <div className="space-y-2">
                          <img src={s.qrCode} alt="WhatsApp QR" className="w-48 h-48 mx-auto border rounded-lg shadow-sm" />
                          <p className="text-xs text-slate-500">Scan QR Code ini menggunakan WhatsApp di HP</p>
                        </div>
                      )}

                      {s.status === 'PAIRING_READY' && s.pairingCode && (
                        <div className="space-y-3">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                            <KeyRound className="w-6 h-6" />
                          </div>
                          <p className="text-xs text-slate-500">Masukkan 8-digit kode ini di WhatsApp HP:</p>
                          <p className="text-2xl font-mono font-bold tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded border border-blue-200">
                            {s.pairingCode}
                          </p>
                        </div>
                      )}

                      {(s.status === 'DISCONNECTED' || s.status === 'CONNECTING') && (
                        <div className="space-y-3">
                          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                            <Smartphone className="w-6 h-6" />
                          </div>
                          <p className="text-xs text-slate-400">
                            {s.status === 'CONNECTING' ? 'Menghubungkan ke WhatsApp Server...' : 'Sesi ini sedang tidak aktif'}
                          </p>
                          {s.status === 'DISCONNECTED' && (
                            <button
                              onClick={() => handleConnectSession(s.id)}
                              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 transition"
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
                          className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Putuskan Koneksi
                        </button>
                      ) : (
                        <div></div>
                      )}
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
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

          {/* TAB 3: DIRECT MESSAGES */}
          {activeTab === 'messages' && (
            <div className="max-w-2xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-semibold text-slate-800 text-base">Kirim Pesan Cepat (Direct Test)</h3>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Gunakan Akun Pengirim:</label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nomor Tujuan (dengan kode negara):</label>
                <input
                  type="text"
                  placeholder="Contoh: 628123456789"
                  value={msgTo}
                  onChange={(e) => setMsgTo(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Isi Pesan:</label>
                <textarea
                  rows={4}
                  placeholder="Ketik pesan Anda di sini..."
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                disabled={isSendingMsg || !msgTo || !msgText}
                onClick={handleSendMessage}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingMsg ? 'Mengirim...' : 'Kirim Pesan Sekarang'}</span>
              </button>
            </div>
          )}

          {/* TAB 4: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Daftar Kontak Tersimpan</h3>
                  <p className="text-xs text-slate-400">Total: {contacts.length} kontak pada sesi ini</p>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer inline-flex items-center space-x-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-medium shadow-sm transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Excel / CSV</span>
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
                    className="inline-flex items-center space-x-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-medium shadow-sm transition"
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
                      <th className="py-2.5 px-3">Opt-Out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contacts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Belum ada kontak tersimpan. Import file Excel atau tunggu kontak masuk.
                        </td>
                      </tr>
                    ) : (
                      contacts.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-800">+{c.phone}</td>
                          <td className="py-2.5 px-3">{c.name || '-'}</td>
                          <td className="py-2.5 px-3">{c.push_name || '-'}</td>
                          <td className="py-2.5 px-3">
                            {c.tags.map((t) => (
                              <span key={t} className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] mr-1">
                                {t}
                              </span>
                            ))}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                c.opt_out ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {c.opt_out ? 'Opted Out' : 'Active'}
                            </span>
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
                  <h3 className="font-semibold text-slate-800 text-sm">WhatsApp Group Grabber</h3>
                  <p className="text-xs text-slate-400">Ekstrak seluruh nomor anggota grup WhatsApp yang diikuti ke file Excel</p>
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
                  <div className="col-span-full py-8 text-center text-slate-400 text-sm">
                    Klik <b>"Ambil Daftar Grup"</b> untuk mendeteksi grup-grup pada akun ini.
                  </div>
                ) : (
                  groups.map((g) => (
                    <div key={g.jid} className="border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm truncate">{g.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">Anggota: <span className="font-semibold text-slate-700">{g.memberCount} orang</span></p>
                        <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{g.jid}</p>
                      </div>

                      <a
                        href={`/api/v1/groups/${g.jid}/export?sessionId=${selectedSessionId}`}
                        download
                        className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-1.5 rounded flex items-center justify-center space-x-1.5 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Anggota (.xlsx)</span>
                      </a>
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
                  <h3 className="font-semibold text-slate-800 text-base">Smart Campaign Broadcast</h3>
                  <p className="text-xs text-slate-500">Kirim pesan massal dengan random delay, spintax, dan proteksi anti-banned</p>
                </div>

                <button
                  onClick={() => setIsNewCampaignModal(true)}
                  className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
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
                          <h4 className="font-bold text-slate-800 text-sm">{c.name}</h4>
                          <span className="text-xs text-slate-400 font-mono">ID: {c.id}</span>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
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
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${c.total_recipients > 0 ? (c.sent_count / c.total_recipients) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-400 font-mono truncate max-w-md">Template: "{c.template_text}"</p>
                        <div className="flex space-x-2">
                          {c.status === 'RUNNING' ? (
                            <button
                              onClick={() => handlePauseCampaign(c.id)}
                              className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded hover:bg-amber-200"
                            >
                              <Pause className="w-3.5 h-3.5" />
                              <span>Jeda</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartCampaign(c.id)}
                              className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Jalankan</span>
                            </button>
                          )}
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
                  <h3 className="font-semibold text-slate-800 text-base">Auto-Responder & Chatbot Rules</h3>
                  <p className="text-xs text-slate-500">Evaluasi kata kunci dan balas otomatis pesan masuk pelanggan</p>
                </div>

                <button
                  onClick={() => setIsNewRuleModal(true)}
                  className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Rule Baru</span>
                </button>
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
                        <h4 className="font-bold text-slate-800 text-sm">{r.name}</h4>
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono">
                          Hit: {r.hit_count}x
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded text-xs space-y-1">
                        <p className="text-slate-600">
                          <span className="font-semibold text-slate-800">Trigger:</span> Pesan mengandung "
                          {r.conditions[0]?.value}"
                        </p>
                        <p className="text-slate-600">
                          <span className="font-semibold text-slate-800">Balasan:</span> "{r.actions[0]?.text}"
                        </p>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={async () => {
                            await fetch(`/api/v1/automation/${r.id}`, { method: 'DELETE' });
                            fetchRules();
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                        >
                          Hapus Rule
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
                  <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Status Kesehatan Mesin (Telemetry)</span>
                  </h3>

                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Mode Aplikasi</span>
                      <span className="font-semibold text-emerald-600 font-mono">
                        {systemStatus?.isPortable ? 'Portable Mode (Zero-Config)' : 'Installed Mode'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Direktori Data</span>
                      <span className="font-mono text-slate-700 truncate max-w-xs">{systemStatus?.storageDir}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">RAM Terpakai (RSS)</span>
                      <span className="font-semibold text-slate-800 font-mono">{systemStatus?.memory.rssMb} MB</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Sisa RAM Laptop</span>
                      <span className="font-semibold text-slate-800 font-mono">{systemStatus?.memory.freeSystemMemMb} MB</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Uptime Server</span>
                      <span className="font-mono text-slate-700">{systemStatus?.uptimeSeconds} detik</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-blue-600" />
                      <span>Cadangan Database (Point-in-Time Backup)</span>
                    </h3>
                    <button
                      onClick={handleCreateBackup}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
                    >
                      Buat Backup Sekarang
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {backups.length === 0 ? (
                      <p className="text-slate-400 italic py-4 text-center">Belum ada file backup.</p>
                    ) : (
                      backups.map((b) => (
                        <div key={b.fileName} className="flex items-center justify-between p-2 border border-slate-100 rounded bg-slate-50">
                          <div>
                            <p className="font-mono font-medium text-slate-800">{b.fileName}</p>
                            <p className="text-[10px] text-slate-400">Ukuran: {(b.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <span className="text-emerald-600 font-semibold text-[11px]">Valid</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: TAMBAH SESI */}
      {isAddSessionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Tambah Akun WhatsApp Baru</h3>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Session ID (Unik, tanpa spasi):</label>
              <input
                type="text"
                placeholder="Contoh: marketing, cs1, sales"
                value={newSessionId}
                onChange={(e) => setNewSessionId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nama Tampilan (Opsional):</label>
              <input
                type="text"
                placeholder="Contoh: WhatsApp Marketing Pusat"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-2">Metode Login:</label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`border rounded-lg p-3 cursor-pointer text-center text-xs font-medium transition ${
                    loginMethod === 'qr'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
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
                  <QrCode className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  Scan QR Code
                </label>

                <label
                  className={`border rounded-lg p-3 cursor-pointer text-center text-xs font-medium transition ${
                    loginMethod === 'pairing'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
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
                  <KeyRound className="w-5 h-5 mx-auto mb-1 text-blue-600" />
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
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
                className="flex-1 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition shadow-sm"
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
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Buat Campaign Broadcast Baru</h3>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nama Campaign:</label>
              <input
                type="text"
                placeholder="Contoh: Promo Spesial Weekend"
                value={campName}
                onChange={(e) => setCampName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Template Pesan (Mendukung Spintax & Variabel):</label>
              <textarea
                rows={3}
                value={campTemplate}
                onChange={(e) => setCampTemplate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Gunakan <code>&#123;Halo|Hai&#125;</code> untuk spintax acak dan <code>&#123;&#123;name&#125;&#125;</code> untuk nama penerima.</p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Daftar Penerima (Nomor,Nama per baris):</label>
              <textarea
                rows={4}
                placeholder="628123456789,Budi&#10;628987654321,Siti"
                value={campRecipientsRaw}
                onChange={(e) => setCampRecipientsRaw(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
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
                className="flex-1 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition shadow-sm"
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
            <h3 className="font-bold text-slate-800 text-base">Tambah Aturan Balas Otomatis</h3>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Nama Aturan:</label>
              <input
                type="text"
                placeholder="Contoh: Auto Reply Pricelist"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Kata Kunci Trigger (Mengandung):</label>
              <input
                type="text"
                placeholder="Contoh: harga, pricelist, info"
                value={ruleTriggerText}
                onChange={(e) => setRuleTriggerText(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Teks Balasan Otomatis:</label>
              <textarea
                rows={3}
                value={ruleReplyText}
                onChange={(e) => setRuleReplyText(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
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
                className="flex-1 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 transition shadow-sm"
              >
                Simpan Aturan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
