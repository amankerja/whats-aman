// Extracted verbatim from App.tsx during refactor step 2.
// JSX for the 'contacts' tab. State and handlers live in AppShell (App.tsx)
// and are provided via PanelCtx.

import React, { useState } from 'react';
import { LayoutDashboard, Smartphone, MessageSquare, Users, UserPlus, Target, Layers, Send, Zap, ClipboardList, Server, FileText, Plus, RefreshCw, QrCode, KeyRound, Trash2, Play, Pause, Download, Upload, CheckCircle, CheckCircle2, AlertCircle, Clock, Activity, Search, ChevronRight, ChevronLeft, Copy, Check, Paperclip, CheckCheck, Sun, Moon, Menu, X, Eye, LogOut, Radio, FileSpreadsheet, ShieldCheck, XCircle, ToggleLeft, ToggleRight, Edit3, Bot, ChevronDown, Smile, MoreVertical, Tag, Mic, Video, Image, HardDrive, Settings, Webhook, Code2, ExternalLink, Share2, Globe, Languages } from 'lucide-react';
import { ChatAvatar, ChatInputBox, ChatMessageBubble } from '../components/chat';
import { parsePhoneFromJid, isSameChat, formatPhoneForDisplay, formatWhatsAppTimestamp, formatDateSeparator, parseRecipientLines, getAvatarBgColor } from '../utils/format';
import { PanelCtx } from './ctx';

const ContactsPanel: React.FC<{ ctx: PanelCtx }> = ({ ctx }) => {
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

  const [isExportingContacts, setIsExportingContacts] = useState(false);

  const handleExportContactsExcel = async () => {
    if (!selectedSessionId) {
      showToast(lang === 'id' ? 'Silakan pilih sesi WhatsApp terlebih dahulu' : 'Please select a WhatsApp session first', 'warn');
      return;
    }

    try {
      setIsExportingContacts(true);
      const url = `/api/v1/contacts/export?sessionId=${encodeURIComponent(selectedSessionId)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Gagal mengekspor kontak ke Excel');
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `contacts_${selectedSessionId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      showToast(lang === 'id' ? 'Berhasil mengunduh Excel kontak!' : 'Successfully downloaded contacts Excel!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal export kontak', 'error');
    } finally {
      setIsExportingContacts(false);
    }
  };

  return (
    <>
  <div className="contacts-page space-y-6">
    <header className="page-header">
      <div className="page-header__title-group">
        <h1>{t.contacts.title}</h1>
        <span className="status-badge connected">{contacts.length} Total</span>
      </div>
      <div className="page-header__actions">
        <button
          onClick={async () => {
            if (!selectedSessionId) return;
            try {
              const res = await fetch('/api/v1/contacts/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: selectedSessionId })
              });
              const data = await res.json();
              if (data.success) {
                fetchContacts(selectedSessionId);
                fetchChats(selectedSessionId);
              }
            } catch {
              // ignore
            }
          }}
          className="btn-secondary btn-sm"
          title={lang === 'id' ? 'Sinkronkan kontak dari WhatsApp' : 'Sync contacts from WhatsApp'}
        >
          <RefreshCw size={14} />
          <span>{t.contacts.syncFromWa}</span>
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className="btn-secondary btn-sm"
          title={lang === 'id' ? 'Ekstrak anggota dari grup WhatsApp' : 'Extract members from WhatsApp Groups'}
        >
          <Layers size={14} />
          <span>{lang === 'id' ? 'Ekstrak dari Grup' : 'Extract from Groups'}</span>
        </button>

        <label className="btn-secondary btn-sm cursor-pointer">
          <Upload size={14} />
          <span>{t.contacts.importExcel}</span>
          <input
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={async e => {
              const file = e.target.files?.[0];
              if (!file || !selectedSessionId) return;
              const fd = new FormData();
              fd.append('sessionId', selectedSessionId);
              fd.append('file', file);
              const res = await fetch('/api/v1/contacts/import', { method: 'POST', body: fd });
              const data = await res.json();
              if (data.success) {
                showToast(data.message || 'Import kontak berhasil', 'success');
                fetchContacts(selectedSessionId);
              } else {
                showToast(data.message || 'Import kontak gagal', 'error');
              }
            }}
          />
        </label>

        <button
          type="button"
          onClick={handleExportContactsExcel}
          disabled={isExportingContacts}
          className="btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {isExportingContacts ? (
            <RefreshCw size={14} className="animate-spin text-blue-600" />
          ) : (
            <Download size={14} />
          )}
          <span>{isExportingContacts ? (lang === 'id' ? 'Mengekspor...' : 'Exporting...') : t.contacts.exportExcel}</span>
        </button>
        {false && <a
          href={`/api/v1/contacts/export?sessionId=${selectedSessionId}`}
          download
          className="btn-secondary btn-sm"
        >
          <Download size={14} />
          <span>{t.contacts.exportExcel}</span>
        </a>}

        <button onClick={() => setIsAddContactModal(true)} className="btn-primary">
          <Plus size={16} />
          <span>{lang === 'id' ? 'Tambah Kontak' : 'Add Contact'}</span>
        </button>
      </div>
      <p className="page-header__subtitle">{t.contacts.subtitle}</p>
    </header>

    <div className="filters-bar">
      <div className="search-input">
        <Search size={16} />
        <input
          type="text"
          placeholder={t.contacts.searchContacts}
          value={contactSearchQuery}
          onChange={e => setContactSearchQuery(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Tag size={13} className="text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">{lang === 'id' ? 'Group:' : 'Group:'}</span>
          <select
            value={selectedTagFilter}
            onChange={e => setSelectedTagFilter(e.target.value)}
            className="session-selector text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-slate-800"
            style={{ width: 'auto' }}
          >
            <option value="ALL">{lang === 'id' ? 'Semua Group' : 'All Groups'} ({contacts.length})</option>
            {availableTags.map(t => (
              <option key={t.tag} value={t.tag}>
                {t.tag} ({t.count})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="text-xs text-slate-500 font-medium">{t.common.session}:</span>
          <select
            value={selectedSessionId}
            onChange={e => setSelectedSessionId(e.target.value)}
            className="session-selector text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-slate-800"
            style={{ width: 'auto' }}
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>

    <div className="keys-table-container">
      <table className="keys-table">
        <thead>
          <tr className="table-row header">
            <th>{lang === 'id' ? 'KONTAK & AVATAR' : 'CONTACT & AVATAR'}</th>
            <th>{t.contacts.colName}</th>
            <th>{lang === 'id' ? 'PUSH NAME (WA)' : 'PUSH NAME (WA)'}</th>
            <th>{t.contacts.colStage}</th>
            <th>{lang === 'id' ? 'GROUP / TAGS' : 'GROUP / TAGS'}</th>
            <th>{lang === 'id' ? 'STATUS OPT-OUT' : 'OPT-OUT STATUS'}</th>
            <th style={{ textAlign: 'right' }}>{t.contacts.colActions}</th>
          </tr>
        </thead>
        <tbody>
          {contacts.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <div className="empty-table-state">
                  <Users size={40} />
                  <h3>{t.contacts.noContacts}</h3>
                  <p>{lang === 'id' ? 'Klik "Tambah Kontak" atau "Import Excel" untuk membangun kontak sesi ini.' : 'Click "Add Contact" or "Import Excel" to build your directory.'}</p>
                </div>
              </td>
            </tr>
          ) : (
            contacts
              .filter(c => {
                if (selectedTagFilter !== 'ALL' && !c.tags.includes(selectedTagFilter)) {
                  return false;
                }
                const target = `${c.phone} ${c.name || ''} ${c.push_name || ''} ${c.tags.join(' ')}`.toLowerCase();
                return target.includes(contactSearchQuery.toLowerCase());
              })
              .map(c => (
                <tr key={c.id} className="table-row">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <ChatAvatar
                        sessionId={selectedSessionId}
                        jid={`${c.phone}@s.whatsapp.net`}
                        name={c.name || c.push_name || c.phone}
                        size={14}
                        style={{ width: '34px', height: '34px', flexShrink: 0 }}
                      />
                      <div>
                        <div className="name-cell font-mono font-semibold text-slate-900 privacy-blur privacy-blur-name" style={{ fontSize: '0.85rem' }}>
                          {formatPhoneForDisplay(c.phone) || `+${c.phone}`}
                        </div>
                        <div className="text-[11px] text-slate-400 privacy-blur privacy-blur-name">
                          {c.jid}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="name-cell font-medium privacy-blur privacy-blur-name text-slate-800">
                      {c.name || c.push_name || '—'}
                    </div>
                  </td>
                  <td>
                    <span className="privacy-blur privacy-blur-name text-xs text-slate-500">{c.push_name || '—'}</span>
                  </td>
                  <td>
                    <select
                      value={c.pipeline_stage || 'lead'}
                      onChange={e => handleUpdateContactStage(c.phone, e.target.value as any)}
                      className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 border cursor-pointer transition-all ${
                        c.pipeline_stage === 'customer'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : c.pipeline_stage === 'prospect'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : c.pipeline_stage === 'churned'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-sky-50 text-sky-800 border-sky-300'
                      }`}
                    >
                      <option value="lead">🔵 {t.crm.lead}</option>
                      <option value="prospect">🟡 {t.crm.prospect}</option>
                      <option value="customer">💰 {t.crm.customer}</option>
                      <option value="churned">❌ {t.crm.churned}</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                      {c.tags.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">{lang === 'id' ? 'Tanpa Group' : 'No Group'}</span>
                      ) : (
                        c.tags.map(t => (
                          <span
                            key={t}
                            className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 font-medium"
                          >
                            <Tag size={9} />
                            {t}
                          </span>
                        ))
                      )}
                      <button
                        onClick={() => openEditTagsModal(c)}
                        className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-100 transition-colors"
                        title={lang === 'id' ? 'Edit / Atur Group Kontak Ini' : 'Edit tags for this contact'}
                        style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '2px' }}
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleOptOut(c.phone, c.opt_out)}
                      className={`status-pill cursor-pointer ${c.opt_out ? 'error' : 'ready'}`}
                      title={lang === 'id' ? 'Klik untuk ubah status opt-out' : 'Click to toggle opt-out status'}
                    >
                      {c.opt_out ? (lang === 'id' ? 'Opt-Out (Blokir)' : 'Opted-Out') : (lang === 'id' ? 'Opt-In Aktif' : 'Opt-In Active')}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenChatWithContact(c.phone, c.name)}
                        className="btn-secondary btn-sm"
                        title={lang === 'id' ? 'Chat kontak ini' : 'Chat with this contact'}
                        style={{ padding: '0.35rem 0.65rem', gap: '4px', fontSize: '0.75rem' }}
                      >
                        <MessageSquare size={13} />
                        <span>Chat</span>
                      </button>
                      <button
                        onClick={() => handleDeleteContact(c.phone)}
                        className="btn-icon"
                        title={t.common.delete}
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </table>
    </div>
  </div>
    </>
  );
};

export default ContactsPanel;
