// Extracted verbatim from App.tsx during refactor step 2.
// JSX for the 'campaigns' tab. State and handlers live in AppShell (App.tsx)
// and are provided via PanelCtx.

import React, { useState } from 'react';
import { LayoutDashboard, Smartphone, MessageSquare, Users, UserPlus, Target, Layers, Send, Zap, ClipboardList, Server, FileText, Plus, RefreshCw, QrCode, KeyRound, Trash2, Play, Pause, Download, Upload, CheckCircle, CheckCircle2, AlertCircle, Clock, Activity, Search, ChevronRight, ChevronLeft, Copy, Check, Paperclip, CheckCheck, Sun, Moon, Menu, X, Eye, LogOut, Radio, FileSpreadsheet, ShieldCheck, XCircle, ToggleLeft, ToggleRight, Edit3, Bot, ChevronDown, Smile, MoreVertical, Tag, Mic, Video, Image, HardDrive, Settings, Webhook, Code2, ExternalLink, Share2, Globe, Languages, HelpCircle, BookOpen, Sparkles, CheckSquare, Square, MinusSquare } from 'lucide-react';
import { ChatAvatar, ChatInputBox, ChatMessageBubble } from '../components/chat';
import { parsePhoneFromJid, isSameChat, formatPhoneForDisplay, formatWhatsAppTimestamp, formatDateSeparator, parseRecipientLines, getAvatarBgColor } from '../utils/format';
import { PanelCtx } from './ctx';

const CampaignsPanel: React.FC<{ ctx: PanelCtx }> = ({ ctx }) => {
  const {
    t,
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
    setEditingContactPhone,
    setEditingContactName,
    setIsAddSessionModal,
    setChatBroadcastSessionId,
    fetchIntegrationConfigs,
    fetchOutgoingWebhooks,
    setEditRuleId,
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
    setLogFilter
  } = ctx;

  const [campFilter, setCampFilter] = useState<'ALL' | 'RUNNING' | 'SCHEDULED' | 'COMPLETED' | 'PAUSED'>('ALL');
  const [campSearch, setCampSearch] = useState<string>('');
  const [showVarGuide, setShowVarGuide] = useState<boolean>(false);
  const [testSimText, setTestSimText] = useState<string>(
    '{Halo|Hai} kak {{name}}, tagihan {{invoice}} sebesar {{total}} siap dikirim ke {{kota}}.'
  );
  const [testSimVars, setTestSimVars] = useState<Record<string, string>>({
    name: 'Andi Pratama',
    phone: '6281234567890',
    invoice: 'INV-9921',
    total: 'Rp 275.000',
    kota: 'Bandung'
  });
  const [newVarKey, setNewVarKey] = useState<string>('');
  const [newVarVal, setNewVarVal] = useState<string>('');

  const totalSentMessages = campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalRecipients = campaigns.reduce((acc, c) => acc + (c.total_recipients || 0), 0);
  const runningCampaignsCount = campaigns.filter(c => c.status === 'RUNNING').length;
  const pausedCampaignsCount = campaigns.filter(c => c.status === 'PAUSED').length;
  const completedCampaignsCount = campaigns.filter(c => c.status === 'COMPLETED').length;

  const filteredCampaigns = campaigns.filter(c => {
    const matchesFilter = campFilter === 'ALL' || c.status === campFilter;
    const matchesSearch = `${c.name} ${c.id} ${c.template_text || ''}`.toLowerCase().includes(campSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Multiple Selection & Batch Actions for Broadcast Campaigns
  const [selectedCampIds, setSelectedCampIds] = useState<Set<string>>(new Set());

  const handleToggleSelectCampaign = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCampIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allCampsSelected = filteredCampaigns.length > 0 && selectedCampIds.size === filteredCampaigns.length;
  const someCampsSelected = selectedCampIds.size > 0 && !allCampsSelected;

  const handleSelectAllCampaigns = () => {
    if (allCampsSelected) {
      setSelectedCampIds(new Set());
    } else {
      setSelectedCampIds(new Set(filteredCampaigns.map(c => c.id)));
    }
  };

  const handleBatchPauseCampaigns = async () => {
    if (selectedCampIds.size === 0) return;
    const ids = Array.from(selectedCampIds);
    for (const id of ids) {
      await handlePauseCampaign(id);
    }
    showToast(lang === 'id' ? `Menjeda ${ids.length} kampanye siaran` : `Paused ${ids.length} campaigns`, 'info');
  };

  const handleBatchStartCampaigns = async () => {
    if (selectedCampIds.size === 0) return;
    const ids = Array.from(selectedCampIds);
    for (const id of ids) {
      await handleStartCampaign(id);
    }
    showToast(lang === 'id' ? `Memulai ${ids.length} kampanye siaran` : `Started ${ids.length} campaigns`, 'success');
  };

  const handleBatchDeleteCampaigns = async () => {
    if (selectedCampIds.size === 0) return;
    const count = selectedCampIds.size;
    const ok = await appConfirm(
      lang === 'id'
        ? `Apakah Anda yakin ingin menghapus ${count} kampanye broadcast terpilih?`
        : `Are you sure you want to delete ${count} selected broadcast campaigns?`,
      {
        confirmLabel: lang === 'id' ? `Hapus ${count} Kampanye` : `Delete ${count} Campaigns`,
        cancelLabel: lang === 'id' ? 'Batal' : 'Cancel',
        danger: true
      }
    );
    if (!ok) return;

    for (const id of Array.from(selectedCampIds)) {
      await handleDeleteCampaign(id);
    }
    setSelectedCampIds(new Set());
    showToast(lang === 'id' ? `Berhasil menghapus ${count} kampanye` : `Deleted ${count} campaigns`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Page Header Subsystem */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.campaigns.title}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {runningCampaignsCount} Aktif / {campaigns.length} Total
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <ShieldCheck size={14} className="text-emerald-600" />
              Engine Anti-Banned Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            {t.campaigns.subtitle}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
          <button
            type="button"
            onClick={() => setShowVarGuide(!showVarGuide)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all border ${
              showVarGuide
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <BookOpen size={15} className="text-emerald-600" />
            <span>Panduan & Variabel Kustom</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Clock size={15} className="text-slate-500" />
            <span>Riwayat Log</span>
          </button>
          <button
            type="button"
            onClick={() => setIsNewCampaignModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>{t.campaigns.newBroadcast}</span>
          </button>
        </div>
      </section>

      {/* Interactive Custom Variables Guide & Sandbox */}
      {showVarGuide && (
        <section className="bg-white rounded-xl border border-emerald-200/90 shadow-sm p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <Sparkles size={18} />
                </span>
                <h2 className="font-bold text-sm text-slate-900">Tutorial & Sandbox Interaktif: Multi-Variabel Kustom</h2>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Panduan Lengkap
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Kirim broadcast massal di mana tiap nomor menerima nilai unik (No Invoice, Nominal, Resi, Tanggal Jatuh Tempo, Kota).
              </p>
            </div>
            <button
              onClick={() => setShowVarGuide(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
            {/* Column 1: Step by Step Guide */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <BookOpen size={14} className="text-emerald-600" />
                1. Cara Menuliskan Variabel
              </h3>
              <div className="space-y-2 text-slate-600 leading-relaxed text-[11px]">
                <div>
                  <strong className="text-slate-800">A. Variabel Bawaan:</strong>
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                    <li><code>{`{{name}}`}</code> / <code>{`{{nama}}`}</code> : Nama kontak</li>
                    <li><code>{`{{phone}}`}</code> / <code>{`{{nomor}}`}</code> : No WhatsApp</li>
                    <li><code>{`{{date}}`}</code> &amp; <code>{`{{time}}`}</code> : Tanggal &amp; jam kirim</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-slate-800">B. Variabel Kustom Bebas:</strong>
                  <p className="mt-0.5">Tulis dengan <code>{`{{nama_kolom}}`}</code>, contoh: <code>{`{{invoice}}`}</code>, <code>{`{{total}}`}</code>, <code>{`{{resi}}`}</code>.</p>
                </div>
                <div>
                  <strong className="text-slate-800">C. Dua Format Input:</strong>
                  <div className="bg-white p-2 rounded border border-slate-200 font-mono text-[10px] mt-1 space-y-1">
                    <p className="text-emerald-700 font-bold"># Metode Baris Judul (Header):</p>
                    <p>phone,name,invoice,total,resi</p>
                    <p>6281234567,Budi,INV-01,150.000,JNE123</p>
                    <p className="text-emerald-700 font-bold mt-1"># Metode Key=Value:</p>
                    <p>6281234567,Budi,invoice=INV-01,total=150.000</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Interactive Variable Builder */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/70 flex flex-col justify-between">
              <div className="space-y-2.5">
                <h3 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Settings size={14} className="text-emerald-600" />
                    2. Variabel Aktif di Sandbox
                  </span>
                  <span className="text-[10px] font-normal text-slate-500">Klik chip untuk sisip</span>
                </h3>

                {/* Available Variables Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(testSimVars).map(([k, v]) => (
                    <div
                      key={k}
                      className="group flex items-center gap-1 bg-white border border-emerald-200 px-2 py-1 rounded-md text-[11px] shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => setTestSimText(prev => prev + ` {{${k}}}`)}
                        className="font-mono text-emerald-800 font-semibold hover:underline"
                        title={`Sisipkan {{${k}}}`}
                      >
                        {`{{${k}}}`}
                      </button>
                      <span className="text-slate-400">=</span>
                      <span className="text-slate-600 max-w-[80px] truncate" title={v}>{v}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...testSimVars };
                          delete updated[k];
                          setTestSimVars(updated);
                        }}
                        className="text-slate-300 hover:text-rose-500 transition-colors ml-0.5"
                        title="Hapus variabel ini"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Custom Variable Form */}
                <div className="pt-2 border-t border-slate-200/80">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Tambah Variabel Baru ke Uji Coba:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Nama (misal: resi)"
                      value={newVarKey}
                      onChange={e => setNewVarKey(e.target.value)}
                      className="w-1/2 p-1.5 text-[11px] bg-white border border-slate-200 rounded focus:border-emerald-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Nilai (misal: JNE-099)"
                      value={newVarVal}
                      onChange={e => setNewVarVal(e.target.value)}
                      className="w-1/2 p-1.5 text-[11px] bg-white border border-slate-200 rounded focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={!newVarKey.trim() || !newVarVal.trim()}
                      onClick={() => {
                        const cleanKey = newVarKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
                        if (cleanKey) {
                          setTestSimVars({ ...testSimVars, [cleanKey]: newVarVal.trim() });
                          setNewVarKey('');
                          setNewVarVal('');
                        }
                      }}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCampaignModal(true);
                  }}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Buka Form Broadcast &amp; Pakai Variabel Ini</span>
                </button>
              </div>
            </div>

            {/* Column 3: Real-Time Interactive Simulator */}
            <div className="space-y-3 bg-slate-900 text-slate-100 p-4 rounded-xl flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Sparkles size={13} />
                    3. Simulator Teks Real-Time
                  </span>
                  <span className="text-[10px] text-slate-400">Ketik template &amp; lihat hasil</span>
                </div>

                <textarea
                  rows={3}
                  value={testSimText}
                  onChange={e => setTestSimText(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                />

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Hasil Pratinjau Pesan yang Diterima WhatsApp:
                  </span>
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-100 font-sans text-xs leading-relaxed whitespace-pre-wrap">
                    {(() => {
                      let res = testSimText;
                      // Replace spintax first option for preview
                      res = res.replace(/\{([^{}|]+)\|([^{}]+)\}/g, '$1');
                      // Replace variables
                      for (const [k, v] of Object.entries(testSimVars)) {
                        const regex = new RegExp(`\\{\\{${k}\\}\\}|\\{${k}\\}`, 'gi');
                        res = res.replace(regex, v);
                      }
                      return res;
                    })()}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                <span>Spintax acak + Variabel kustom</span>
                <span className="text-emerald-400 font-mono">100% Cocok</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4-Column KPI Metrics Band */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Total Pesan Terkirim</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Send size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalSentMessages.toLocaleString()}</span>
              <span className="inline-flex items-center text-emerald-700 font-bold text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">
                +18.4%
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-slate-500 text-[11px]">
              <span>Tingkat Keberhasilan</span>
              <span className="font-bold text-slate-800">99.2%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '99.2%' }}></div>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Kampanye Berjalan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Radio size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{runningCampaignsCount} Kampanye</span>
              <span className="inline-flex items-center text-emerald-700 text-[11px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-slate-500 text-[11px]">
              <span className="truncate">{runningCampaignsCount > 0 ? 'Sedang Mendistribusikan' : 'Siap Menjalankan'}</span>
              <span className="font-bold text-emerald-700">{campaigns.length} Total</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${campaigns.length > 0 ? (runningCampaignsCount / campaigns.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-sky-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Tingkat Terbaca (Read Rate)</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <CheckCheck size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">84.6%</span>
              <span className="inline-flex items-center text-emerald-700 font-bold text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">
                +5.2%
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-slate-500 text-[11px]">
              <span>Rata-rata Industri: 72%</span>
              <span className="text-sky-700 font-bold">+12.6% Unggul</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-sky-500 h-full rounded-full" style={{ width: '84.6%' }}></div>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Proteksi Anti-Banned</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">Aman</span>
              <span className="inline-flex items-center text-emerald-700 text-[11px] font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                Skor Risiko 0/100
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-slate-500 text-[11px]">
              <span>Jeda Acak Humanis</span>
              <span className="font-bold text-slate-800">20 - 40 dtk</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Segmented Tabs & Filters Toolbar */}
      <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setCampFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              campFilter === 'ALL'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Semua Kampanye ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setCampFilter('RUNNING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              campFilter === 'RUNNING'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sedang Berjalan ({runningCampaignsCount})
          </button>
          <button
            type="button"
            onClick={() => setCampFilter('PAUSED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              campFilter === 'PAUSED'
                ? 'bg-amber-50 text-amber-700 border border-amber-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Jeda ({pausedCampaignsCount})
          </button>
          <button
            type="button"
            onClick={() => setCampFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              campFilter === 'COMPLETED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Selesai ({completedCampaignsCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kampanye atau ID..."
            value={campSearch}
            onChange={e => setCampSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
          />
        </div>
      </section>

      {/* Campaigns Bulk Action Bar */}
      {selectedCampIds.size > 0 && (
        <div className="bg-white border-2 border-emerald-500 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
              <Check size={13} className="stroke-[3]" />
              {selectedCampIds.size} {lang === 'id' ? 'Kampanye Terpilih' : 'Campaigns Selected'}
            </span>
            <button
              type="button"
              onClick={handleSelectAllCampaigns}
              className="text-xs text-emerald-600 hover:underline font-semibold cursor-pointer"
            >
              {allCampsSelected
                ? (lang === 'id' ? 'Batalkan pilihan' : 'Deselect all')
                : (lang === 'id' ? `Pilih seluruh ${filteredCampaigns.length} kampanye` : `Select all ${filteredCampaigns.length} campaigns`)}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Batch Start */}
            <button
              type="button"
              onClick={handleBatchStartCampaigns}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Play size={13} />
              <span>{lang === 'id' ? 'Mulai Terpilih' : 'Start Selected'}</span>
            </button>

            {/* Batch Pause */}
            <button
              type="button"
              onClick={handleBatchPauseCampaigns}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <Pause size={13} />
              <span>{lang === 'id' ? 'Jeda Terpilih' : 'Pause Selected'}</span>
            </button>

            {/* Batch Delete */}
            <button
              type="button"
              onClick={handleBatchDeleteCampaigns}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <Trash2 size={13} />
              <span>{lang === 'id' ? 'Hapus' : 'Delete'}</span>
            </button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={() => setSelectedCampIds(new Set())}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title={lang === 'id' ? 'Batalkan pilihan' : 'Clear selection'}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Campaign Cards List */}
      <section className="flex flex-col gap-4">
        {filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-sm">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Radio size={28} />
            </div>
            <h3 className="font-semibold text-slate-800">{t.campaigns.noCampaigns}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Belum ada siaran broadcast massal. Buat kampanye baru dengan perlindungan anti-blokir untuk mulai menjangkau ribuan kontak.
            </p>
            <button
              onClick={() => setIsNewCampaignModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm mt-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>{t.campaigns.newBroadcast}</span>
            </button>
          </div>
        ) : (
          filteredCampaigns.map(c => {
            const isRunning = c.status === 'RUNNING';
            const isPaused = c.status === 'PAUSED';
            const isCompleted = c.status === 'COMPLETED';
            const percent = c.total_recipients > 0 ? Math.round((c.sent_count / c.total_recipients) * 100) : 0;
            const isSelected = selectedCampIds.has(c.id);

            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all flex flex-col gap-4 relative overflow-hidden ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/90'
                }`}
              >
                {/* Top Accent Ribbon */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isRunning
                      ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 animate-pulse'
                      : isPaused
                      ? 'bg-amber-400'
                      : 'bg-emerald-600'
                  }`}
                ></div>

                {/* Card Header */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleSelectCampaign(c.id, e)}
                      className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors mt-0.5 cursor-pointer shrink-0"
                      title={isSelected ? (lang === 'id' ? 'Batalkan pilihan' : 'Deselect') : (lang === 'id' ? 'Pilih kampanye' : 'Select campaign')}
                    >
                      {isSelected ? (
                        <CheckSquare size={18} className="text-emerald-600 fill-emerald-50" />
                      ) : (
                        <Square size={18} className="text-slate-300 hover:text-slate-500" />
                      )}
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                      <Radio size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="font-bold text-sm text-slate-900 truncate">{c.name}</h2>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isRunning
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isPaused
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
                          {isRunning ? 'RUNNING / MENGIRIM' : c.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-xs flex-wrap mt-1">
                        <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 text-[11px]">
                          ID: {c.id}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <Smartphone size={13} className="text-emerald-600" />
                          {activeSession?.name || 'Sesi Utama'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Users size={13} />
                          {c.total_recipients} Penerima
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                    <button
                      onClick={() => handleViewRecipients(c.id, c.name)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
                      title={lang === 'id' ? 'Lihat Log Penerima' : 'View Recipient Log'}
                    >
                      <Eye size={14} className="text-slate-500" />
                      <span>Penerima ({c.total_recipients})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('logs')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
                      title="Lihat Telemetri Live Log"
                    >
                      <Activity size={14} className="text-sky-600" />
                      <span>Live Log</span>
                    </button>

                    {isRunning ? (
                      <button
                        onClick={() => handlePauseCampaign(c.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 transition-colors"
                      >
                        <Pause size={14} />
                        <span>{t.campaigns.pauseCampaign}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartCampaign(c.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                      >
                        <Play size={14} />
                        <span>{t.campaigns.startCampaign}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteCampaign(c.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title={t.common.delete}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Live Dispatch Progress Bar */}
                <div className="bg-slate-50/80 border border-slate-200/70 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                    <div className="flex items-center gap-2">
                      <span>Progres Pengiriman:</span>
                      <strong className="text-slate-900">{c.sent_count} dari {c.total_recipients} Pesan</strong>
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-[11px] font-bold">
                        {percent}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>Gagal: <strong className="text-slate-800">{c.failed_count}</strong></span>
                      <span>•</span>
                      <span className="text-emerald-700 font-medium">Jeda Smart Jitter: 20-40 dtk</span>
                    </div>
                  </div>

                  {(c as any).last_message && (
                    <p
                      className={`text-[11px] px-2.5 py-1 rounded-md border ${
                        isPaused
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {isPaused ? '⏸ ' : 'ℹ️ '}{(c as any).last_message}
                    </p>
                  )}

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Template Message Preview */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-slate-500 truncate max-w-xl italic">
                    "{c.template_text}"
                  </p>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};

export default CampaignsPanel;
