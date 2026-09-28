// Extracted verbatim from App.tsx during refactor step 2.
// JSX for the 'chats' tab. State and handlers live in AppShell (App.tsx)
// and are provided via PanelCtx.

import React from 'react';
import { LayoutDashboard, Smartphone, MessageSquare, Users, UserPlus, Target, Layers, Send, Zap, ClipboardList, Server, FileText, Plus, RefreshCw, QrCode, KeyRound, Trash2, Play, Pause, Download, Upload, CheckCircle, CheckCircle2, AlertCircle, Clock, Activity, Search, ChevronRight, ChevronLeft, Copy, Check, Paperclip, CheckCheck, Sun, Moon, Menu, X, Eye, LogOut, Radio, FileSpreadsheet, ShieldCheck, XCircle, ToggleLeft, ToggleRight, Edit3, Bot, ChevronDown, Smile, MoreVertical, Tag, Mic, Video, Image, HardDrive, Settings, Webhook, Code2, ExternalLink, Share2, Globe, Languages } from 'lucide-react';
import { ChatAvatar, ChatInputBox, ChatMessageBubble } from '../components/chat';
import { parsePhoneFromJid, isSameChat, formatPhoneForDisplay, formatWhatsAppTimestamp, formatDateSeparator, parseRecipientLines, getAvatarBgColor } from '../utils/format';
import { PanelCtx } from './ctx';

const ChatsPanel: React.FC<{ ctx: PanelCtx }> = ({ ctx }) => {
  const {
    t,
    lang,
    privacyMode,
    privacySettings,
    isPrivacyMenuOpen,
    setIsPrivacyMenuOpen,
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

        {/* Privacy Blur Quick Pill */}
        <button
          type="button"
          onClick={() => setIsPrivacyMenuOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: privacyMode ? '#eff6ff' : '#f8fafc',
            border: `1px solid ${privacyMode ? '#bfdbfe' : '#e2e8f0'}`,
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: privacyMode ? '#1d4ed8' : '#64748b',
            cursor: 'pointer'
          }}
          title="Pengaturan Privacy Blur (Alt + P)"
        >
          <Eye size={14} style={{ color: privacyMode ? '#2563eb' : '#94a3b8' }} />
          <span>Privacy: <strong>{privacyMode ? 'ON' : 'OFF'}</strong></span>
        </button>

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
                          <span className="chat-item-name privacy-blur privacy-blur-name" title={displayName}>
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
                          <span className="chat-item-snippet privacy-blur privacy-blur-recent" title={c.last_message || ''}>
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
                          <span className="chat-item-name privacy-blur privacy-blur-name" title={displayName}>
                            {displayName}
                          </span>
                          {c.tags.length > 0 && (
                            <span className="chat-kind-badge">{c.tags[0]}</span>
                          )}
                        </div>
                        <div className="chat-item-bottom">
                          <span className="chat-item-snippet privacy-blur privacy-blur-name">
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
                          <span className="chat-item-name privacy-blur privacy-blur-name" title={g.name}>
                            {g.name}
                          </span>
                          <span className="chat-kind-badge">Group</span>
                        </div>
                        <div className="chat-item-bottom">
                          <span className="chat-item-snippet privacy-blur privacy-blur-recent">
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
                            <span className="chat-item-name privacy-blur privacy-blur-name" title={displayName}>
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
                            <span className="chat-item-snippet privacy-blur privacy-blur-recent" title={c.last_message || ''}>
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
    </>
  );
};

export default ChatsPanel;
