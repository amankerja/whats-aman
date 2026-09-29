// Extracted verbatim from App.tsx during refactor step 2.
// JSX for the 'sessions' tab. State and handlers live in AppShell (App.tsx)
// and are provided via PanelCtx.

import React, { useState } from 'react';
import { LayoutDashboard, Smartphone, MessageSquare, Users, UserPlus, Target, Layers, Send, Zap, ClipboardList, Server, FileText, Plus, RefreshCw, QrCode, KeyRound, Trash2, Play, Pause, Download, Upload, CheckCircle, CheckCircle2, AlertCircle, Clock, Activity, Search, ChevronRight, ChevronLeft, Copy, Check, Paperclip, CheckCheck, Sun, Moon, Menu, X, Eye, LogOut, Radio, FileSpreadsheet, ShieldCheck, XCircle, ToggleLeft, ToggleRight, Edit3, Bot, ChevronDown, Smile, MoreVertical, Tag, Mic, Video, Image, HardDrive, Settings, Webhook, Code2, ExternalLink, Share2, Globe, Languages, LayoutGrid, Table as TableIcon, BatteryCharging, Network, Flame } from 'lucide-react';
import { ChatAvatar, ChatInputBox, ChatMessageBubble } from '../components/chat';
import { parsePhoneFromJid, isSameChat, formatPhoneForDisplay, formatWhatsAppTimestamp, formatDateSeparator, parseRecipientLines, getAvatarBgColor } from '../utils/format';
import { PanelCtx } from './ctx';

const SessionsPanel: React.FC<{ ctx: PanelCtx }> = ({ ctx }) => {
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

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const connectedCount = sessions.filter(s => s.status === 'CONNECTED').length;
  const disconnectedCount = sessions.filter(s => s.status === 'DISCONNECTED').length;
  const qrReadyCount = sessions.filter(s => s.status === 'QR_READY' || s.status === 'PAIRING_READY').length;

  const filteredSessionsList = sessions.filter(s => {
    const matchText = `${s.id} ${s.name} ${s.phoneNumber || ''}`.toLowerCase().includes(sessionSearchQuery.toLowerCase());
    const matchStatus = sessionStatusFilter === 'ALL'
      ? true
      : sessionStatusFilter === 'QR_READY'
      ? s.status === 'QR_READY' || s.status === 'PAIRING_READY'
      : s.status === sessionStatusFilter;
    return matchText && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Heading & Global Actions */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.sessions.title}</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-bold uppercase tracking-wider">
              Aman Gateway MultiDevice v6.5
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white text-emerald-700 text-xs font-semibold shadow-sm border border-slate-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {connectedCount} dari {sessions.length} Sesi Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            {t.sessions.subtitle}
          </p>
        </div>

        {/* Quick Operations */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchSessions()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm text-xs font-semibold"
            title="Segarkan Semua Sesi"
            type="button"
          >
            <RefreshCw size={15} className="text-slate-500" />
            <span>Segarkan Status</span>
          </button>
          <button
            onClick={() => setIsAddSessionModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm text-xs font-bold"
            type="button"
          >
            <Plus size={16} />
            <span>{t.sessions.newSession}</span>
          </button>
        </div>
      </section>

      {/* 4-Column KPI Dashboard Metric Band */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Sessions */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Sesi Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Smartphone size={18} />
            </div>
          </div>
          <div className="my-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{connectedCount}</span>
              <span className="text-xs text-slate-500">/ {sessions.length} Kuota Perangkat</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${sessions.length > 0 ? (connectedCount / sessions.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Socket Stabil
            </span>
            <span className="text-slate-400">Multi-Device Isolated</span>
          </div>
        </div>

        {/* KPI 2: Messages Gateway */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-sky-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Terkirim Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Send size={18} />
            </div>
          </div>
          <div className="my-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">4.820</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                +15.2%
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-1.5">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Rasio Berhasil: <strong className="text-slate-800">99.82%</strong></span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
            <span>Antrean Keluar: <strong className="text-slate-800">0</strong></span>
            <span className="text-slate-400">Anti-Flood OK</span>
          </div>
        </div>

        {/* KPI 3: Anti-Ban Protection */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Proteksi Anti-Blokir</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="my-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600">0 / 100</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Risiko Minimal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Smart Jitter Delay (3-8 dtk) Aktif</p>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Warm-Up Mode
            </span>
            <span className="text-slate-400">{sessions.length} Sesi Terlindungi</span>
          </div>
        </div>

        {/* KPI 4: Gateway Engine Uptime */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Uptime Mesin Gateway</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Activity size={18} />
            </div>
          </div>
          <div className="my-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">99.98%</span>
              <span className="text-xs text-slate-500">30 Hari</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Aman Gateway WebSocket multi-session running</p>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-emerald-700 font-semibold">Latency: &lt; 28ms</span>
            <span className="text-slate-400">Engine Ready</span>
          </div>
        </div>
      </section>

      {/* Filter & View Controls Toolbar */}
      <section className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSessionStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sessionStatusFilter === 'ALL'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            type="button"
          >
            Semua Sesi ({sessions.length})
          </button>
          <button
            onClick={() => setSessionStatusFilter('CONNECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sessionStatusFilter === 'CONNECTED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            type="button"
          >
            Online ({connectedCount})
          </button>
          <button
            onClick={() => setSessionStatusFilter('DISCONNECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sessionStatusFilter === 'DISCONNECTED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            type="button"
          >
            Terputus ({disconnectedCount})
          </button>
          <button
            onClick={() => setSessionStatusFilter('QR_READY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sessionStatusFilter === 'QR_READY'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            type="button"
          >
            Butuh QR / Pairing ({qrReadyCount})
          </button>
        </div>

        {/* Search and View Switcher */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, nomor, ID..."
              value={sessionSearchQuery}
              onChange={e => setSessionSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Mode Grid"
              type="button"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Mode Tabel"
              type="button"
            >
              <TableIcon size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Sessions Content */}
      {filteredSessionsList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-sm">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Smartphone size={28} />
          </div>
          <h3 className="font-semibold text-slate-800">{t.sessions.noSessions}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {t.sessions.subtitle}
          </p>
          <button
            onClick={() => setIsAddSessionModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm text-xs font-bold mt-2"
          >
            <Plus size={16} />
            <span>{t.sessions.newSession}</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSessionsList.map(s => {
            const isConnected = s.status === 'CONNECTED';
            return (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header */}
                  <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {isConnected ? (
                        <ChatAvatar
                          sessionId={s.id}
                          jid={s.phoneNumber ? `${s.phoneNumber}@s.whatsapp.net` : undefined}
                          name={s.name}
                          className="chat-avatar"
                          size={16}
                          style={{ width: '40px', height: '40px', fontSize: '0.85rem', flexShrink: 0 }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {s.name ? s.name.substring(0, 2).toUpperCase() : 'WA'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm truncate" title={s.name}>
                            {s.name}
                          </h3>
                          {selectedSessionId === s.id && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              AKTIF
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                          ID: {s.id}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : s.status === 'QR_READY' || s.status === 'PAIRING_READY'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isConnected && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                      {isConnected ? 'ONLINE' : s.status.toLowerCase().replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* QR Preview box if waiting for QR */}
                  {s.status === 'QR_READY' && s.qrCode && (
                    <div className="m-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <img src={s.qrCode} alt="Scan QR" className="w-40 h-40 mx-auto rounded-lg shadow-sm border border-slate-200" />
                      <p className="text-xs font-semibold text-slate-700 mt-2">{t.sessions.scanQrTitle}</p>
                      <p className="text-[11px] text-slate-400">{t.sessions.scanQrDesc}</p>
                    </div>
                  )}

                  {/* Pairing Code Display box if waiting for Pairing */}
                  {s.status === 'PAIRING_READY' && s.pairingCode && (
                    <div className="m-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">{t.sessions.pairingCodeTitle}</span>
                      <div className="text-2xl font-black font-mono text-emerald-900 tracking-widest my-2 select-all">
                        {s.pairingCode}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(s.pairingCode || '');
                          setCopiedPairingCode(true);
                          setTimeout(() => setCopiedPairingCode(false), 2000);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white text-emerald-800 border border-emerald-300 rounded-md text-xs font-semibold mx-auto hover:bg-emerald-100/50 transition-colors"
                      >
                        {copiedPairingCode ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedPairingCode ? t.common.copied : t.common.copy}</span>
                      </button>
                    </div>
                  )}

                  {/* Technical Specs Matrix */}
                  <div className="px-4 py-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Engine Gateway</span>
                      <span className="text-slate-800 font-semibold">Aman Gateway (MultiDevice v6.5)</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Nomor WhatsApp</span>
                      <span className="text-slate-900 font-bold font-mono">
                        {s.phoneNumber ? formatPhoneForDisplay(s.phoneNumber) : 'Belum Terhubung'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Sinkron Terakhir</span>
                      <span className="text-slate-700 font-medium">
                        {s.lastConnectedAt ? new Date(s.lastConnectedAt).toLocaleTimeString() : '—'}
                      </span>
                    </div>

                    {/* Anti-Ban & Health Indicator */}
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5 mt-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-semibold flex items-center gap-1">
                          <ShieldCheck size={14} className="text-emerald-600" />
                          KESEHATAN SESI
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          RISIKO 0/100 (AMAN)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Smart Jitter: Aktif</span>
                        <span>Warm-Up: Siap</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Area */}
                <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedSessionId(s.id);
                        setActiveTab('chats');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-xs font-semibold shadow-sm"
                      title={t.chats.title}
                      type="button"
                    >
                      <MessageSquare size={14} className="text-emerald-600" />
                      <span>{t.chats.tabChats}</span>
                    </button>

                    <button
                      onClick={() => setActiveQrModal({ open: true, session: s })}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-xs font-medium"
                      title="QR / Pairing"
                      type="button"
                    >
                      <QrCode size={14} />
                      <span>Pair</span>
                    </button>

                    {isConnected ? (
                      <button
                        onClick={() => handleDisconnectSession(s.id)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors text-xs font-medium"
                        title={t.sessions.disconnectSession}
                        type="button"
                      >
                        <Pause size={14} />
                        <span>Putuskan</span>
                      </button>
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
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-xs font-semibold shadow-sm"
                        title={t.sessions.connectSession}
                        type="button"
                      >
                        <Play size={14} />
                        <span>Sambung</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isConnected && (
                      <button
                        onClick={() => handleLogoutSession(s.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title={t.sessions.logoutSession}
                        type="button"
                      >
                        <LogOut size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSession(s.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title={t.sessions.deleteSession}
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Sesi &amp; Nama</th>
                  <th className="py-3 px-4">Device ID</th>
                  <th className="py-3 px-4">Nomor WhatsApp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Engine</th>
                  <th className="py-3 px-4">Sinkron Terakhir</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessionsList.map(s => {
                  const isConnected = s.status === 'CONNECTED';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          {isConnected ? (
                            <ChatAvatar
                              sessionId={s.id}
                              jid={s.phoneNumber ? `${s.phoneNumber}@s.whatsapp.net` : undefined}
                              name={s.name}
                              className="chat-avatar"
                              size={14}
                              style={{ width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                              {s.name ? s.name.substring(0, 2).toUpperCase() : 'WA'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{s.name}</div>
                            {selectedSessionId === s.id && (
                              <span className="text-[10px] text-emerald-600 font-bold">AKTIF DIGUNAKAN</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{s.id}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {s.phoneNumber ? formatPhoneForDisplay(s.phoneNumber) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isConnected
                              ? 'bg-emerald-50 text-emerald-700'
                              : s.status === 'QR_READY'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                          {isConnected ? 'ONLINE' : s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">Aman Gateway v6.5</td>
                      <td className="py-3 px-4 text-slate-500">
                        {s.lastConnectedAt ? new Date(s.lastConnectedAt).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedSessionId(s.id);
                              setActiveTab('chats');
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors"
                            title="Buka Obrolan"
                          >
                            <MessageSquare size={15} />
                          </button>
                          <button
                            onClick={() => setActiveQrModal({ open: true, session: s })}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                            title="QR / Pairing"
                          >
                            <QrCode size={15} />
                          </button>
                          {isConnected ? (
                            <button
                              onClick={() => handleDisconnectSession(s.id)}
                              className="p-1.5 rounded-md hover:bg-amber-50 text-slate-500 hover:text-amber-700 transition-colors"
                              title="Putuskan"
                            >
                              <Pause size={15} />
                            </button>
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
                              className="p-1.5 rounded-md hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 transition-colors"
                              title="Hubungkan"
                            >
                              <Play size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSession(s.id)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionsPanel;
