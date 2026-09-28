// Extracted verbatim from App.tsx during refactor step 2.
// JSX for the 'dashboard' tab. State and handlers live in AppShell (App.tsx)
// and are provided via PanelCtx.

import { LayoutDashboard, Smartphone, MessageSquare, Users, UserPlus, Target, Layers, Send, Zap, ClipboardList, Server, FileText, Plus, RefreshCw, QrCode, KeyRound, Trash2, Play, Pause, Download, Upload, CheckCircle, CheckCircle2, AlertCircle, Clock, Activity, Search, ChevronRight, ChevronLeft, Copy, Check, Paperclip, CheckCheck, Sun, Moon, Menu, X, Eye, LogOut, Radio, FileSpreadsheet, ShieldCheck, XCircle, ToggleLeft, ToggleRight, Edit3, Bot, ChevronDown, Smile, MoreVertical, Tag, Mic, Video, Image, HardDrive, Settings, Webhook, Code2, ExternalLink, Share2, Globe, Languages, Flame, TrendingUp, CheckSquare, Terminal, Cpu, Mail } from 'lucide-react';
import { ChatAvatar, ChatInputBox, ChatMessageBubble } from '../components/chat';
import { parsePhoneFromJid, isSameChat, formatPhoneForDisplay, formatWhatsAppTimestamp, formatDateSeparator, parseRecipientLines, getAvatarBgColor } from '../utils/format';
import { PanelCtx } from './ctx';

const DashboardPanel: React.FC<{ ctx: PanelCtx }> = ({ ctx }) => {
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

  const activeSessionsCount = sessions.filter(s => s.status === 'CONNECTED').length;
  const totalBroadcastSent = campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalLeadsCount = crmAnalytics?.totalLeads ?? contacts.length;
  const newLeadsCount = crmAnalytics?.newLeads ?? Math.round(contacts.length * 0.4);
  const hotLeadsCount = crmAnalytics?.hotLeads ?? 14;
  const convertedCustomersCount = crmAnalytics?.convertedCustomers ?? 88;
  const conversionRateVal = crmAnalytics?.conversionRate ?? (contacts.length > 0 ? Number(((convertedCustomersCount / contacts.length) * 100).toFixed(1)) : 3.3);
  const followUpDueCount = crmAnalytics?.followUpDue ?? 6;
  const followUpDoneCount = crmAnalytics?.followUpCompleted ?? 42;
  const replyRateVal = crmAnalytics?.replyRate ?? 94.2;

  return (
    <div className="flex flex-col w-full gap-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Top Summary Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {t.dashboard.title}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isGlobalConnected
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isGlobalConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {isGlobalConnected ? (lang === 'id' ? 'Gateway Terhubung' : 'Gateway Connected') : (lang === 'id' ? 'Gateway Siaga' : 'Gateway Standby')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            {t.dashboard.subtitle}
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={async () => {
              await fetchSessions();
              await fetchSystemStatus();
              if (selectedSessionId) await fetchChats(selectedSessionId);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow"
            title="Refresh Data"
          >
            <RefreshCw size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span>{t.common.refresh}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddSessionModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-all rounded-full text-xs font-bold shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus size={16} />
            <span>{t.dashboard.newSession}</span>
          </button>
        </div>
      </div>

      {/* 2. 4-Column High Performance KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Active Sessions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                {t.dashboard.activeSessions}
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 group-hover:text-emerald-600 transition-colors">
                {activeSessionsCount} <span className="text-sm text-slate-400 font-normal">/ 5 Kuota</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <Smartphone size={22} />
            </div>
          </div>
          <div className="mt-4 pt-3 flex flex-col gap-2">
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((activeSessionsCount / 5) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {activeSessionsCount} Online Siaga
              </span>
              <span>{Math.max(0, 5 - activeSessionsCount)} Slot Tersedia</span>
            </div>
          </div>
          <Smartphone className="absolute -bottom-3 -right-3 w-20 h-20 text-slate-900/[0.04] dark:text-white/[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform" />
        </div>

        {/* Card 2: Broadcasts Sent */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                {t.dashboard.broadcastSent}
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 group-hover:text-sky-600 transition-colors">
                {totalBroadcastSent.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
              <Send size={20} />
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
              <TrendingUp size={13} /> +18.4%
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Sukses Rate: <strong className="text-slate-800 dark:text-slate-200 font-semibold">98.7%</strong>
            </span>
          </div>
          <Send className="absolute -bottom-3 -right-3 w-20 h-20 text-slate-900/[0.04] dark:text-white/[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform" />
        </div>

        {/* Card 3: Total Contacts */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                {t.dashboard.totalContacts}
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 group-hover:text-emerald-600 transition-colors">
                {contacts.length.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <Users size={22} />
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
              <UserPlus size={13} /> +100 Baru
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 size={14} /> 100% Opt-in
            </span>
          </div>
          <Users className="absolute -bottom-3 -right-3 w-20 h-20 text-slate-900/[0.04] dark:text-white/[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform" />
        </div>

        {/* Card 4: System Health & RAM */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                {t.dashboard.systemHealth}
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 group-hover:text-emerald-600 transition-colors">
                {systemStatus ? `${systemStatus.memory.heapUsedMb} MB` : '73 MB'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <Server size={22} />
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Portable Mode
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Uptime Engine: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">99.9%</strong>
            </span>
          </div>
          <Activity className="absolute -bottom-3 -right-3 w-20 h-20 text-slate-900/[0.04] dark:text-white/[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* 3. CRM Pipeline & Tindak Lanjut Penjualan Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/80 shadow-xs p-6 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t.crm.title}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                PRO ANALYTICS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.crm.subtitle}
            </p>
          </div>

          {/* Segmented Date Filter Tabs & Export Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              {(['today', '7d', '30d', '90d', 'all'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setCrmTimeRange(r);
                    fetchSalesAnalytics(selectedSessionId, r);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    crmTimeRange === r
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {r === 'today' ? 'Hari Ini' : r === '7d' ? '7 Hari Terakhir' : r === '30d' ? '30 Hari Terakhir' : r === '90d' ? '90 Hari' : 'Semua Waktu'}
                </button>
              ))}
            </div>
            <a
              href={`/api/v1/crm/export-csv?sessionId=${selectedSessionId}`}
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-xs"
              title="Ekspor CSV"
            >
              <Download size={14} />
              <span>Ekspor CSV</span>
            </a>
          </div>
        </div>

        {/* Pipeline Stage 4 Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Prospek */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">TOTAL PROSPEK</span>
              <Target size={18} className="text-slate-400" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalLeadsCount.toLocaleString('id-ID')}</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Total Kontak Tersimpan</p>
            </div>
          </div>

          {/* New Leads */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">PROSPEK BARU</span>
              <Mail size={18} className="text-sky-600 dark:text-sky-400" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">{newLeadsCount.toLocaleString('id-ID')}</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Pipeline Leads Aktif</p>
            </div>
          </div>

          {/* Hot Leads */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                HOT LEADS <Flame size={14} className="text-amber-500" />
              </span>
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded font-bold text-[10px]">Mendesak</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{hotLeadsCount}</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Prioritas Tinggi (Follow-up)</p>
            </div>
          </div>

          {/* Converted Customers */}
          <div className="bg-slate-50/80 dark:bg-slate-900/60 rounded-xl p-4 flex flex-col justify-between hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                PELANGGAN (CLOSING) <CheckCircle2 size={14} className="text-emerald-600" />
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded font-bold text-[10px]">Closing</span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{convertedCustomersCount}</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Berhasil Terkonversi</p>
            </div>
          </div>
        </div>

        {/* 4 Micro-Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Conversion Rate with Donut */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl flex items-center gap-3.5 border border-slate-100 dark:border-slate-800">
            <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-700"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-emerald-500"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${Math.min(100, Math.round(Number(conversionRateVal) * 3))}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-slate-800 dark:text-slate-200">
                {conversionRateVal}%
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400">{t.crm.conversionRate}</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{conversionRateVal}%</span>
              <span className="text-[11px] text-slate-400 truncate">Customer / Total Leads</span>
            </div>
          </div>

          {/* Pending Follow-ups */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl flex items-center gap-3.5 border border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0">
              <Clock size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400">{t.crm.pendingTasks}</span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{followUpDueCount} Tugas</span>
              <span className="text-[11px] text-slate-400 truncate">Jadwal hari ini lewat waktu</span>
            </div>
          </div>

          {/* Follow-up Done */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl flex items-center gap-3.5 border border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <CheckSquare size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400">Follow-up Selesai</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{followUpDoneCount} Tugas</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">+12 tugas dari kemarin</span>
            </div>
          </div>

          {/* Reply Speed */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl flex items-center gap-3.5 border border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0">
              <Zap size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400">Kecepatan Respon</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{replyRateVal}%</span>
              <span className="text-[11px] text-slate-400 truncate">Rerata balas ~1.4 menit</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. WhatsApp Session Management Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/80 shadow-xs p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t.sessions.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.sessions.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-all"
          >
            <span>Kelola Semua Sesi</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Modern Session Rows Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                <th className="py-3 px-4 rounded-l-lg">Session ID</th>
                <th className="py-3 px-4">Nama Perangkat & Nomor</th>
                <th className="py-3 px-4">Status Gateway</th>
                <th className="py-3 px-4">Terakhir Sinkron</th>
                <th className="py-3 px-4 text-right rounded-r-lg">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    {t.sessions.noSessions}
                  </td>
                </tr>
              ) : (
                sessions.map(s => {
                  const isConn = s.status === 'CONNECTED';
                  const isStandby = s.status === 'QR_READY' || s.status === 'PAIRING_READY' || s.status === 'CONNECTING';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors group">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs">
                          <Tag size={13} className="text-emerald-600" />
                          <span>{s.id}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {isConn ? (
                            <ChatAvatar
                              sessionId={s.id}
                              jid={s.phoneNumber ? `${s.phoneNumber}@s.whatsapp.net` : undefined}
                              name={s.name}
                              className="chat-avatar"
                              size={14}
                              style={{ width: '36px', height: '36px', fontSize: '0.75rem', flexShrink: 0 }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                              <Smartphone size={18} />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate">
                              {s.name || s.id}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              +{s.phoneNumber || 'Belum Terhubung'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isConn ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            ONLINE
                          </span>
                        ) : isStandby ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            STANDBY / QR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            DISCONNECTED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                        {s.lastConnectedAt ? formatWhatsAppTimestamp(s.lastConnectedAt) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {isConn ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSessionId(s.id);
                                  setActiveTab('chats');
                                }}
                                className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold transition-all"
                              >
                                Chat
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSessionId(s.id);
                                  setActiveTab('tester');
                                }}
                                className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-xs font-semibold transition-all"
                              >
                                Tes Kirim
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDisconnectSession(s.id)}
                                className="px-3 py-1 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-md text-xs font-semibold transition-all"
                              >
                                Putuskan
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleConnectSessionDirect(s.id)}
                              className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                            >
                              <QrCode size={14} />
                              <span>Scan QR Sekarang</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Quick Tool Utilities Bottom Strip */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-xs font-bold">
            <Zap size={18} className="text-emerald-600" />
            <span>Aksi Cepat Pengembang:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('tester')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all shadow-xs border border-slate-200 dark:border-slate-700"
            >
              <Send size={14} className="text-sky-600" />
              <span>Message Tester API</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all shadow-xs border border-slate-200 dark:border-slate-700"
            >
              <Terminal size={14} className="text-emerald-600" />
              <span>Cek Raw Engine Log</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('infrastructure')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all shadow-xs border border-slate-200 dark:border-slate-700"
            >
              <Cpu size={14} className="text-indigo-600" />
              <span>Infrastruktur & Kesehatan Mesin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPanel;
