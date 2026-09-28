// Extracted verbatim from App.tsx during refactor step 2.
// JSX for the 'sessions' tab. State and handlers live in AppShell (App.tsx)
// and are provided via PanelCtx.

import React from 'react';
import { LayoutDashboard, Smartphone, MessageSquare, Users, UserPlus, Target, Layers, Send, Zap, ClipboardList, Server, FileText, Plus, RefreshCw, QrCode, KeyRound, Trash2, Play, Pause, Download, Upload, CheckCircle, CheckCircle2, AlertCircle, Clock, Activity, Search, ChevronRight, ChevronLeft, Copy, Check, Paperclip, CheckCheck, Sun, Moon, Menu, X, Eye, LogOut, Radio, FileSpreadsheet, ShieldCheck, XCircle, ToggleLeft, ToggleRight, Edit3, Bot, ChevronDown, Smile, MoreVertical, Tag, Mic, Video, Image, HardDrive, Settings, Webhook, Code2, ExternalLink, Share2, Globe, Languages } from 'lucide-react';
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

  return (
    <>
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
    </>
  );
};

export default SessionsPanel;
