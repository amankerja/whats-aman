// Extracted verbatim from App.tsx during refactor step 2.
// JSX for the 'crm' tab. State and handlers live in AppShell (App.tsx)
// and are provided via PanelCtx.

import React from 'react';
import { LayoutDashboard, Smartphone, MessageSquare, Users, UserPlus, Target, Layers, Send, Zap, ClipboardList, Server, FileText, Plus, RefreshCw, QrCode, KeyRound, Trash2, Play, Pause, Download, Upload, CheckCircle, CheckCircle2, AlertCircle, Clock, Activity, Search, ChevronRight, ChevronLeft, Copy, Check, Paperclip, CheckCheck, Sun, Moon, Menu, X, Eye, LogOut, Radio, FileSpreadsheet, ShieldCheck, XCircle, ToggleLeft, ToggleRight, Edit3, Bot, ChevronDown, Smile, MoreVertical, Tag, Mic, Video, Image, HardDrive, Settings, Webhook, Code2, ExternalLink, Share2, Globe, Languages } from 'lucide-react';
import { ChatAvatar, ChatInputBox, ChatMessageBubble } from '../components/chat';
import { parsePhoneFromJid, isSameChat, formatPhoneForDisplay, formatWhatsAppTimestamp, formatDateSeparator, parseRecipientLines, getAvatarBgColor } from '../utils/format';
import { PanelCtx } from './ctx';

const CrmPanel: React.FC<{ ctx: PanelCtx }> = ({ ctx }) => {
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

  return (
    <>
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
    <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 scrollbar-none">
      {[
        {
          id: 'ALL',
          label: lang === 'id' ? 'Semua Prospek' : 'All Leads',
          count: contacts.length,
          icon: Users,
          activeClass: 'bg-slate-900 text-white border-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100',
          activeBadge: 'bg-slate-800 text-slate-100 dark:bg-slate-200 dark:text-slate-900',
          iconClass: (isActive: boolean) => isActive ? 'text-white dark:text-slate-900' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-400',
          hoverClass: 'hover:bg-slate-50 hover:border-slate-300 dark:hover:bg-slate-700/50'
        },
        {
          id: 'lead',
          label: t.crm.lead,
          count: contacts.filter(c => !c.pipeline_stage || c.pipeline_stage === 'lead').length,
          icon: UserPlus,
          activeClass: 'bg-[#e0f2fe] text-[#0369a1] border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 shadow-sm',
          activeBadge: 'bg-sky-200/90 text-[#0369a1] dark:bg-sky-900/80 dark:text-sky-200',
          iconClass: (isActive: boolean) => isActive ? 'text-[#0369a1] dark:text-sky-300' : 'text-sky-500 dark:text-sky-400',
          hoverClass: 'hover:bg-sky-50/50 hover:border-sky-300 dark:hover:bg-slate-700/50'
        },
        {
          id: 'prospect',
          label: t.crm.prospect,
          count: contacts.filter(c => c.pipeline_stage === 'prospect').length,
          icon: Target,
          activeClass: 'bg-[#fef9c3] text-[#854d0e] border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 shadow-sm',
          activeBadge: 'bg-amber-200/90 text-[#854d0e] dark:bg-amber-900/80 dark:text-amber-200',
          iconClass: (isActive: boolean) => isActive ? 'text-[#854d0e] dark:text-amber-300' : 'text-amber-500 dark:text-amber-400',
          hoverClass: 'hover:bg-amber-50/50 hover:border-amber-300 dark:hover:bg-slate-700/50'
        },
        {
          id: 'customer',
          label: t.crm.customer,
          count: contacts.filter(c => c.pipeline_stage === 'customer').length,
          icon: CheckCircle2,
          activeClass: 'bg-[#dcfce7] text-[#15803d] border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 shadow-sm',
          activeBadge: 'bg-emerald-200/90 text-[#15803d] dark:bg-emerald-900/80 dark:text-emerald-200',
          iconClass: (isActive: boolean) => isActive ? 'text-[#15803d] dark:text-emerald-300' : 'text-emerald-500 dark:text-emerald-400',
          hoverClass: 'hover:bg-emerald-50/50 hover:border-emerald-300 dark:hover:bg-slate-700/50'
        },
        {
          id: 'churned',
          label: t.crm.churned,
          count: contacts.filter(c => c.pipeline_stage === 'churned').length,
          icon: XCircle,
          activeClass: 'bg-[#fee2e2] text-[#b91c1c] border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 shadow-sm',
          activeBadge: 'bg-rose-200/90 text-[#b91c1c] dark:bg-rose-900/80 dark:text-rose-200',
          iconClass: (isActive: boolean) => isActive ? 'text-[#b91c1c] dark:text-rose-300' : 'text-rose-500 dark:text-rose-400',
          hoverClass: 'hover:bg-rose-50/50 hover:border-rose-300 dark:hover:bg-slate-700/50'
        }
      ].map(s => {
        const isActive = crmStageFilter === s.id;
        const IconComponent = s.icon;
        return (
          <button
            key={s.id}
            onClick={() => setCrmStageFilter(s.id as any)}
            className={`group px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 flex items-center gap-2 flex-shrink-0 cursor-pointer select-none ${
              isActive
                ? `${s.activeClass} font-bold`
                : `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 ${s.hoverClass}`
            }`}
          >
            <IconComponent size={14} className={`stroke-[2.2] transition-colors ${s.iconClass(isActive)}`} />
            <span>{s.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold min-w-[20px] text-center leading-none transition-colors ${
                isActive
                  ? s.activeBadge
                  : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 font-semibold'
              }`}
            >
              {s.count}
            </span>
          </button>
        );
      })}
    </div>

    {/* 2-Column Responsive Layout */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Contacts CRM Pipeline Table (7 cols) */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {lang === 'id' ? 'Pipeline Kontak Pelanggan' : 'Customer Pipeline Contacts'}
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
                {contacts.filter(c => {
                  const stage = c.pipeline_stage || 'lead';
                  if (crmStageFilter !== 'ALL' && stage !== crmStageFilter) return false;
                  if (selectedTagFilter !== 'ALL' && !c.tags.includes(selectedTagFilter)) return false;
                  if (crmSearchQuery.trim()) {
                    const q = crmSearchQuery.trim().toLowerCase();
                    const matchPhone = c.phone.toLowerCase().includes(q);
                    const matchName = (c.name || c.push_name || '').toLowerCase().includes(q);
                    const matchNotes = (c.notes || '').toLowerCase().includes(q);
                    const matchTags = c.tags.some(t => t.toLowerCase().includes(q));
                    if (!matchPhone && !matchName && !matchNotes && !matchTags) return false;
                  }
                  return true;
                }).length} / {contacts.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {lang === 'id' ? 'Klik status stage atau tag untuk memperbarui klasifikasi prospek' : 'Click stage status or tags to update customer classification'}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'id' ? 'Cari nama, HP, tag, catatan...' : 'Search name, phone, tag, notes...'}
                value={crmSearchQuery}
                onChange={e => setCrmSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => setIsAddContactModal(true)}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 flex-shrink-0"
              title={lang === 'id' ? 'Tambah Kontak / Prospek Baru' : 'Add New Contact / Lead'}
            >
              <Plus size={14} />
              <span>{lang === 'id' ? 'Tambah Kontak' : 'Add Contact'}</span>
            </button>
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
          {(selectedTagFilter !== 'ALL' || crmStageFilter !== 'ALL' || crmSearchQuery) && (
            <button
              onClick={() => {
                setCrmStageFilter('ALL');
                setSelectedTagFilter('ALL');
                setCrmSearchQuery('');
              }}
              className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline ml-1 cursor-pointer"
            >
              {lang === 'id' ? 'Reset Semua Filter' : 'Reset All'}
            </button>
          )}
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
                  if (crmSearchQuery.trim()) {
                    const q = crmSearchQuery.trim().toLowerCase();
                    const matchPhone = c.phone.toLowerCase().includes(q);
                    const matchName = (c.name || c.push_name || '').toLowerCase().includes(q);
                    const matchNotes = (c.notes || '').toLowerCase().includes(q);
                    const matchTags = c.tags.some(t => t.toLowerCase().includes(q));
                    if (!matchPhone && !matchName && !matchNotes && !matchTags) return false;
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
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px] flex-shrink-0 privacy-blur-pic">
                            {(c.name || c.push_name || 'U').slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate privacy-blur privacy-blur-name" title={displayName}>
                              {displayName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono privacy-blur privacy-blur-name">
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

                          {/* Delete Contact Button */}
                          <button
                            onClick={() => handleDeleteContact(c.phone)}
                            className="btn-icon p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            title={lang === 'id' ? 'Hapus kontak dari database' : 'Delete contact from database'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {contacts.filter(c => {
                const stage = c.pipeline_stage || 'lead';
                if (crmStageFilter !== 'ALL' && stage !== crmStageFilter) return false;
                if (selectedTagFilter !== 'ALL' && !c.tags.includes(selectedTagFilter)) return false;
                if (crmSearchQuery.trim()) {
                  const q = crmSearchQuery.trim().toLowerCase();
                  const matchPhone = c.phone.toLowerCase().includes(q);
                  const matchName = (c.name || c.push_name || '').toLowerCase().includes(q);
                  const matchNotes = (c.notes || '').toLowerCase().includes(q);
                  const matchTags = c.tags.some(t => t.toLowerCase().includes(q));
                  if (!matchPhone && !matchName && !matchNotes && !matchTags) return false;
                }
                return true;
              }).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    {contacts.length === 0 ? (
                      <div className="flex flex-col items-center gap-2">
                        <Users size={32} className="text-slate-300 dark:text-slate-600" />
                        <p className="text-xs font-medium">
                          {lang === 'id' ? 'Belum ada kontak di database sesi ini.' : 'No contacts in database for this session.'}
                        </p>
                        <button
                          onClick={() => setIsAddContactModal(true)}
                          className="btn-primary text-xs py-1 px-3 mt-1 flex items-center gap-1"
                        >
                          <Plus size={13} />
                          <span>{lang === 'id' ? 'Tambah Kontak Pertama' : 'Add First Contact'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Search size={28} className="text-slate-300 dark:text-slate-600" />
                        <p className="text-xs font-medium">
                          {lang === 'id'
                            ? 'Tidak ada kontak yang cocok dengan filter aktif.'
                            : 'No contacts match the active filter criteria.'}
                        </p>
                        <button
                          onClick={() => {
                            setCrmStageFilter('ALL');
                            setSelectedTagFilter('ALL');
                            setCrmSearchQuery('');
                          }}
                          className="btn-secondary text-xs py-1 px-3 mt-1 flex items-center gap-1"
                        >
                          <RefreshCw size={12} />
                          <span>{lang === 'id' ? 'Reset Semua Filter' : 'Reset All Filters'}</span>
                        </button>
                      </div>
                    )}
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
    </>
  );
};

export default CrmPanel;
