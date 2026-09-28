// Extracted verbatim from App.tsx during refactor step 2.
// JSX for the 'dashboard' tab. State and handlers live in AppShell (App.tsx)
// and are provided via PanelCtx.

import React from 'react';
import { LayoutDashboard, Smartphone, MessageSquare, Users, UserPlus, Target, Layers, Send, Zap, ClipboardList, Server, FileText, Plus, RefreshCw, QrCode, KeyRound, Trash2, Play, Pause, Download, Upload, CheckCircle, CheckCircle2, AlertCircle, Clock, Activity, Search, ChevronRight, ChevronLeft, Copy, Check, Paperclip, CheckCheck, Sun, Moon, Menu, X, Eye, LogOut, Radio, FileSpreadsheet, ShieldCheck, XCircle, ToggleLeft, ToggleRight, Edit3, Bot, ChevronDown, Smile, MoreVertical, Tag, Mic, Video, Image, HardDrive, Settings, Webhook, Code2, ExternalLink, Share2, Globe, Languages } from 'lucide-react';
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

  return (
    <>
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
    </>
  );
};

export default DashboardPanel;
