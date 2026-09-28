// Extracted verbatim from App.tsx during refactor step 2.
// JSX for the 'integrations' tab. State and handlers live in AppShell (App.tsx)
// and are provided via PanelCtx.

import React from 'react';
import { LayoutDashboard, Smartphone, MessageSquare, Users, UserPlus, Target, Layers, Send, Zap, ClipboardList, Server, FileText, Plus, RefreshCw, QrCode, KeyRound, Trash2, Play, Pause, Download, Upload, CheckCircle, CheckCircle2, AlertCircle, Clock, Activity, Search, ChevronRight, ChevronLeft, Copy, Check, Paperclip, CheckCheck, Sun, Moon, Menu, X, Eye, LogOut, Radio, FileSpreadsheet, ShieldCheck, XCircle, ToggleLeft, ToggleRight, Edit3, Bot, ChevronDown, Smile, MoreVertical, Tag, Mic, Video, Image, HardDrive, Settings, Webhook, Code2, ExternalLink, Share2, Globe, Languages } from 'lucide-react';
import { ChatAvatar, ChatInputBox, ChatMessageBubble } from '../components/chat';
import { parsePhoneFromJid, isSameChat, formatPhoneForDisplay, formatWhatsAppTimestamp, formatDateSeparator, parseRecipientLines, getAvatarBgColor } from '../utils/format';
import { PanelCtx } from './ctx';

const IntegrationsPanel: React.FC<{ ctx: PanelCtx }> = ({ ctx }) => {
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
        <div className="flex items-center gap-2">
          <Webhook className="text-blue-600" size={24} />
          <h1>{t.integrations.title}</h1>
        </div>
        <span className="status-badge connected">{lang === 'id' ? 'API Ingestion Siap' : 'API Ingestion Ready'}</span>
      </div>
      <div className="page-header__actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => {
            fetchIntegrationConfigs();
            fetchOutgoingWebhooks();
            fetchIntegrationLogs();
          }}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          title={t.common.refresh}
        >
          <RefreshCw size={15} />
          <span>{t.common.refresh}</span>
        </button>
        <button
          type="button"
          onClick={() => setIsTestIntegrationModal(true)}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#93c5fd', color: '#1d4ed8' }}
        >
          <Send size={15} />
          <span>{t.integrations.testTrigger}</span>
        </button>
        <button
          type="button"
          onClick={() => setIsAddOutgoingWebhookModal(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} />
          <span>{t.integrations.addOutgoing}</span>
        </button>
      </div>
      <p className="page-header__subtitle">
        {t.integrations.subtitle}
      </p>
    </header>

    {/* Integration Stats Cards */}
    <div className="stats-grid">
      <div className="stat-card">
        <Code2 className="stat-watermark" />
        <div className="stat-header">
          <span className="stat-label">Google Apps Script</span>
          <Code2 size={18} className="stat-icon text-blue-600" />
        </div>
        <div className="stat-value text-lg text-emerald-600 font-bold">{lang === 'id' ? 'Siap Digunakan' : 'Ready to Ingest'}</div>
        <div className="stat-detail">{lang === 'id' ? 'Trigger Google Forms & Sheets' : 'Trigger Google Forms & Sheets'}</div>
      </div>

      <div className="stat-card">
        <Webhook className="stat-watermark" />
        <div className="stat-header">
          <span className="stat-label">{lang === 'id' ? 'Integrasi Masuk' : 'Provider Ingestions'}</span>
          <Webhook size={18} className="stat-icon text-indigo-600" />
        </div>
        <div className="stat-value">{integrationConfigs.filter(c => c.isActive).length} {t.common.active}</div>
        <div className="stat-detail">{lang === 'id' ? `Dari ${integrationConfigs.length || 6} template` : `From ${integrationConfigs.length || 6} templates`}</div>
      </div>

      <div className="stat-card">
        <Share2 className="stat-watermark" />
        <div className="stat-header">
          <span className="stat-label">Outgoing Webhooks</span>
          <Share2 size={18} className="stat-icon text-amber-600" />
        </div>
        <div className="stat-value">{outgoingWebhooks.filter(w => w.isActive).length} {lang === 'id' ? 'Aktif' : 'Active'}</div>
        <div className="stat-detail">{lang === 'id' ? 'Event push ke server Anda' : 'Real-time event push'}</div>
      </div>

      <div className="stat-card">
        <Activity className="stat-watermark" />
        <div className="stat-header">
          <span className="stat-label">{lang === 'id' ? 'Riwayat Ingestion' : 'Ingestion History'}</span>
          <Activity size={18} className="stat-icon text-slate-600" />
        </div>
        <div className="stat-value">{integrationLogs.length} {lang === 'id' ? 'Log' : 'Logs'}</div>
        <div className="stat-detail">{lang === 'id' ? 'Tercatat di sistem database' : 'Recorded in database'}</div>
      </div>
    </div>

    {/* Provider Selector Tabs */}
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setSelectedIntegrationTab('google_form')}
          className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
            selectedIntegrationTab === 'google_form'
              ? 'border-blue-600 text-blue-600 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{t.integrations.tabGoogleForm}</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedIntegrationTab('woocommerce')}
          className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
            selectedIntegrationTab === 'woocommerce'
              ? 'border-blue-600 text-blue-600 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>{t.integrations.tabWooCommerce}</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedIntegrationTab('cf7')}
          className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
            selectedIntegrationTab === 'cf7'
              ? 'border-blue-600 text-blue-600 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>{t.integrations.tabCf7}</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedIntegrationTab('elementor')}
          className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
            selectedIntegrationTab === 'elementor'
              ? 'border-blue-600 text-blue-600 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>{t.integrations.tabElementor}</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedIntegrationTab('outgoing')}
          className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
            selectedIntegrationTab === 'outgoing'
              ? 'border-blue-600 text-blue-600 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Share2 size={14} />
          <span>{t.integrations.tabOutgoing}</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedIntegrationTab('logs')}
          className={`py-3 px-5 border-b-2 flex items-center gap-2 transition ${
            selectedIntegrationTab === 'logs'
              ? 'border-blue-600 text-blue-600 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText size={14} />
          <span>{t.integrations.tabLogs}</span>
        </button>
      </div>

      {/* TAB 1: GOOGLE FORMS & APPS SCRIPT */}
      {selectedIntegrationTab === 'google_form' && (
        <div className="p-6 space-y-6">
          {/* Webhook Endpoint Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded font-mono">POST</span>
                <h3 className="font-bold text-slate-900 text-sm">{t.integrations.webhookUrlTitle}</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">{t.sessions.title}: <strong>{selectedSessionId || 'default'}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`http://localhost:3000/api/v1/integrations/webhook/google_form/${selectedSessionId || 'default'}`}
                className="font-mono text-xs text-slate-800 bg-white border border-slate-300 rounded-lg p-2.5 flex-1 select-all"
              />
              <button
                type="button"
                onClick={() => {
                  const url = `http://localhost:3000/api/v1/integrations/webhook/google_form/${selectedSessionId || 'default'}`;
                  navigator.clipboard.writeText(url);
                  setCopiedWebhookUrl(true);
                  setTimeout(() => setCopiedWebhookUrl(false), 2000);
                }}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1rem' }}
              >
                {copiedWebhookUrl ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedWebhookUrl ? t.integrations.copiedUrl : t.integrations.copyUrl}</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              💡 <strong>{lang === 'id' ? 'Petunjuk URL:' : 'URL Hint:'}</strong> {t.integrations.urlHint}
            </p>
          </div>

          {/* Template & Form Configuration */}
          {(() => {
            const gfConfig = integrationConfigs.find(c => c.provider === 'google_form') || {
              id: 'default_google_form',
              provider: 'google_form' as const,
              name: 'Google Forms Auto-Notification',
              templateText: 'Halo *{name}*, terima kasih telah mengisi formulir *{form_name}*! ✨\n\nData respon Anda telah berhasil kami terima. Tim kami akan segera meninjau dan menghubungi Anda kembali.',
              adminPhone: '',
              adminTemplateText: '🔔 *Notifikasi Respon Formulir Baru*\n\n• Form: {form_name}\n• Pengirim: {name} ({phone})\n\nRespon baru berhasil tercatat di sistem.',
              isActive: true,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template Editor Card */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{t.integrations.templateConfigTitle}</h4>
                    <span className="status-pill ready">{lang === 'id' ? 'Penerima: Pengisi Form' : 'Recipient: Form Submitter'}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">{t.integrations.templateTextLabel}</label>
                    <textarea
                      rows={5}
                      className="w-full text-xs border border-slate-300 rounded-lg p-3 font-sans leading-relaxed focus:border-blue-500 outline-none"
                      defaultValue={gfConfig.templateText}
                      id="gf-template-textarea"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                      <span>{t.integrations.supportedVars}</span>
                      <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{'{name}'}</code>
                      <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{'{form_name}'}</code>
                      <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{'{phone}'}</code>
                      <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{'{data.Pertanyaan}'}</code>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">{t.integrations.adminPhoneLabel}</label>
                    <input
                      type="text"
                      placeholder={lang === 'id' ? 'Contoh: 08123456789 (Kosongkan jika tidak perlu salinan)' : 'e.g. 628123456789 (Optional admin copy)'}
                      defaultValue={gfConfig.adminPhone || ''}
                      id="gf-admin-phone-input"
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const templateText = (document.getElementById('gf-template-textarea') as HTMLTextAreaElement)?.value || gfConfig.templateText;
                      const adminPhone = (document.getElementById('gf-admin-phone-input') as HTMLInputElement)?.value;
                      handleSaveIntegrationConfig({
                        id: gfConfig.id,
                        sessionId: selectedSessionId || undefined,
                        provider: 'google_form',
                        name: gfConfig.name,
                        templateText,
                        adminPhone: adminPhone || undefined,
                        isActive: true
                      });
                    }}
                    className="btn-primary w-full text-xs"
                    style={{ padding: '0.65rem' }}
                  >
                    <Check size={15} />
                    <span>{t.integrations.saveConfig}</span>
                  </button>
                </div>

                {/* Apps Script Guide & Code Card */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Code2 size={17} className="text-emerald-600" />
                      <span>{t.integrations.appsScriptCodeTitle}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const code = `/**
 * WhatsAman — Google Apps Script WhatsApp Auto-Notification
 * Pasang di Google Sheet (Ekstensi > Apps Script)
 */
function onFormSubmit(e) {
  var webhookUrl = "http://localhost:3000/api/v1/integrations/webhook/google_form/${selectedSessionId || 'default'}";
  
  // Baca respon formulir dari Google Sheet
  var itemResponses = e.response ? e.response.getItemResponses() : [];
  var namedValues = e.namedValues || {};
  var nama = "";
  var noWhatsapp = "";
  
  if (itemResponses.length > 0) {
    for (var i = 0; i < itemResponses.length; i++) {
      var title = itemResponses[i].getItem().getTitle().toLowerCase();
      var resp = itemResponses[i].getResponse();
      if (title.indexOf("nama") !== -1 && !nama) nama = resp;
      if ((title.indexOf("wa") !== -1 || title.indexOf("whatsapp") !== -1 || title.indexOf("hp") !== -1 || title.indexOf("telepon") !== -1) && !noWhatsapp) noWhatsapp = resp;
    }
    if (!nama) nama = itemResponses[0].getResponse();
    if (!noWhatsapp && itemResponses.length > 1) noWhatsapp = itemResponses[1].getResponse();
  } else {
    // Jika trigger dipasang di Google Sheets Spreadsheet
    nama = (namedValues["Nama"] && namedValues["Nama"][0]) || (namedValues["Name"] && namedValues["Name"][0]) || (e.values && e.values[1]) || "Pelanggan";
    noWhatsapp = (namedValues["No WhatsApp"] && namedValues["No WhatsApp"][0]) || (namedValues["WhatsApp"] && namedValues["WhatsApp"][0]) || (namedValues["No HP"] && namedValues["No HP"][0]) || (e.values && e.values[2]) || "";
  }

  var payload = {
    form_name: e.source ? e.source.getTitle() : "Formulir Pendaftaran",
    name: nama,
    phone: noWhatsapp,
    data: namedValues
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var res = UrlFetchApp.fetch(webhookUrl, options);
    Logger.log("WhatsAman Response: " + res.getContentText());
  } catch (err) {
    Logger.log("Error sending webhook: " + err.toString());
  }
}`;
                        navigator.clipboard.writeText(code);
                        setCopiedScriptCode(true);
                        setTimeout(() => setCopiedScriptCode(false), 2000);
                      }}
                      className="btn-secondary text-xs"
                      style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0.35rem 0.75rem' }}
                    >
                      {copiedScriptCode ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedScriptCode ? t.integrations.copiedScriptCode : t.integrations.copyScriptCode}</span>
                    </button>
                  </div>

                  <div className="bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-[11px] overflow-x-auto max-h-64 leading-relaxed">
                    <pre>{`function onFormSubmit(e) {
  var webhookUrl = "http://localhost:3000/api/v1/integrations/webhook/google_form/${selectedSessionId || 'default'}";
  
  var nama = (e.namedValues && e.namedValues["Nama"] && e.namedValues["Nama"][0]) || e.values[1];
  var phone = (e.namedValues && e.namedValues["No WhatsApp"] && e.namedValues["No WhatsApp"][0]) || e.values[2];

  var payload = {
    form_name: "Formulir Pendaftaran",
    name: nama,
    phone: phone,
    data: e.namedValues
  };

  UrlFetchApp.fetch(webhookUrl, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });
}`}</pre>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1.5">
                    <span className="font-bold block">{t.integrations.appsScriptGuideTitle}:</span>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-700">
                      <li>{t.integrations.step1}</li>
                      <li>{t.integrations.step2}</li>
                      <li>{t.integrations.step3}</li>
                      <li>{t.integrations.step4}</li>
                    </ol>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 2: WOOCOMMERCE */}
      {selectedIntegrationTab === 'woocommerce' && (
        <div className="p-6 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-purple-600 text-white text-[11px] font-bold px-2 py-0.5 rounded font-mono">POST</span>
                <h3 className="font-bold text-slate-900 text-sm">{lang === 'id' ? 'URL Webhook WooCommerce Order' : 'WooCommerce Order Webhook URL'}</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">{t.sessions.title}: <strong>{selectedSessionId || 'default'}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`http://localhost:3000/api/v1/integrations/webhook/woocommerce/${selectedSessionId || 'default'}`}
                className="font-mono text-xs text-slate-800 bg-white border border-slate-300 rounded-lg p-2.5 flex-1 select-all"
              />
              <button
                type="button"
                onClick={() => {
                  const url = `http://localhost:3000/api/v1/integrations/webhook/woocommerce/${selectedSessionId || 'default'}`;
                  navigator.clipboard.writeText(url);
                  setCopiedWebhookUrl(true);
                  setTimeout(() => setCopiedWebhookUrl(false), 2000);
                }}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1rem' }}
              >
                {copiedWebhookUrl ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedWebhookUrl ? t.integrations.copiedUrl : t.integrations.copyUrl}</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {lang === 'id'
                ? 'Cara Pasang di WordPress: WooCommerce > Settings > Advanced > Webhooks > Add Webhook ➔ Topic: Order created / Order updated ➔ Delivery URL: masukkan URL di atas.'
                : 'Setup in WordPress: WooCommerce > Settings > Advanced > Webhooks > Add Webhook ➔ Topic: Order created / Order updated ➔ Delivery URL: paste the URL above.'}
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: CONTACT FORM 7 */}
      {selectedIntegrationTab === 'cf7' && (
        <div className="p-6 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded font-mono">POST</span>
                <h3 className="font-bold text-slate-900 text-sm">{lang === 'id' ? 'URL Webhook Contact Form 7 (WordPress)' : 'Contact Form 7 Webhook URL (WordPress)'}</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">{t.sessions.title}: <strong>{selectedSessionId || 'default'}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`http://localhost:3000/api/v1/integrations/webhook/cf7/${selectedSessionId || 'default'}`}
                className="font-mono text-xs text-slate-800 bg-white border border-slate-300 rounded-lg p-2.5 flex-1 select-all"
              />
              <button
                type="button"
                onClick={() => {
                  const url = `http://localhost:3000/api/v1/integrations/webhook/cf7/${selectedSessionId || 'default'}`;
                  navigator.clipboard.writeText(url);
                  setCopiedWebhookUrl(true);
                  setTimeout(() => setCopiedWebhookUrl(false), 2000);
                }}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1rem' }}
              >
                {copiedWebhookUrl ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedWebhookUrl ? t.integrations.copiedUrl : t.integrations.copyUrl}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ELEMENTOR */}
      {selectedIntegrationTab === 'elementor' && (
        <div className="p-6 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded font-mono">POST</span>
                <h3 className="font-bold text-slate-900 text-sm">{lang === 'id' ? 'URL Webhook Elementor Pro Form' : 'Elementor Pro Form Webhook URL'}</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">{t.sessions.title}: <strong>{selectedSessionId || 'default'}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`http://localhost:3000/api/v1/integrations/webhook/elementor/${selectedSessionId || 'default'}`}
                className="font-mono text-xs text-slate-800 bg-white border border-slate-300 rounded-lg p-2.5 flex-1 select-all"
              />
              <button
                type="button"
                onClick={() => {
                  const url = `http://localhost:3000/api/v1/integrations/webhook/elementor/${selectedSessionId || 'default'}`;
                  navigator.clipboard.writeText(url);
                  setCopiedWebhookUrl(true);
                  setTimeout(() => setCopiedWebhookUrl(false), 2000);
                }}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1rem' }}
              >
                {copiedWebhookUrl ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedWebhookUrl ? t.integrations.copiedUrl : t.integrations.copyUrl}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {lang === 'id'
                ? 'Cara Pasang di Elementor: Buka widget Form ➔ Actions After Submit ➔ Pilih Webhook ➔ Masukkan Webhook URL di atas.'
                : 'Setup in Elementor: Open Form widget ➔ Actions After Submit ➔ Choose Webhook ➔ Paste the Webhook URL above.'}
            </p>
          </div>
        </div>
      )}

      {/* TAB 5: OUTGOING WEBHOOKS */}
      {selectedIntegrationTab === 'outgoing' && (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{t.integrations.outgoingTableTitle}</h4>
              <p className="text-xs text-slate-500">{t.integrations.outgoingSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddOutgoingWebhookModal(true)}
              className="btn-primary text-xs"
              style={{ padding: '0.5rem 0.85rem' }}
            >
              <Plus size={14} />
              <span>{t.integrations.addOutgoing}</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-4">{t.integrations.colName}</th>
                  <th className="py-2.5 px-4">{t.integrations.colTargetUrl}</th>
                  <th className="py-2.5 px-4">{t.integrations.colEvents}</th>
                  <th className="py-2.5 px-4">{t.integrations.colStatus}</th>
                  <th className="py-2.5 px-4 text-right">{t.integrations.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outgoingWebhooks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      {t.integrations.noOutgoing}
                    </td>
                  </tr>
                ) : (
                  outgoingWebhooks.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{w.name}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-blue-700 max-w-xs truncate">{w.targetUrl}</td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {(w.events || ['all']).map((ev, i) => (
                            <span key={i} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                              {ev}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`status-pill ${w.isActive ? 'ready' : 'disconnected'}`}>
                          {w.isActive ? t.common.active : t.common.inactive}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTestOutgoingWebhook(w.id)}
                            className="btn-secondary btn-sm"
                            title={t.integrations.testPing}
                          >
                            <Send size={12} />
                            <span>{t.integrations.testPing}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOutgoingWebhook(w.id)}
                            className="btn-icon text-rose-500 hover:bg-rose-50"
                            title={t.common.delete}
                          >
                            <Trash2 size={14} />
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
      )}

      {/* TAB 6: LOGS */}
      {selectedIntegrationTab === 'logs' && (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm">{t.integrations.logsTitle}</h4>
            <span className="text-xs text-slate-500">{lang === 'id' ? '50 catatan terakhir' : 'Last 50 records'}</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-4">{t.integrations.colTime}</th>
                  <th className="py-2.5 px-4">{t.integrations.colProvider}</th>
                  <th className="py-2.5 px-4">{t.integrations.colTargetWa}</th>
                  <th className="py-2.5 px-4">{t.integrations.colStatus}</th>
                  <th className="py-2.5 px-4">{t.integrations.colPayload}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {integrationLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      {t.integrations.noLogs}
                    </td>
                  </tr>
                ) : (
                  integrationLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                          {log.provider}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                        {formatPhoneForDisplay(log.targetPhone) || log.targetPhone}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`status-pill ${log.status === 'SUCCESS' ? 'ready' : 'disconnected'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 max-w-xs truncate font-mono text-[11px] text-slate-700">
                        {log.errorMessage ? (
                          <span className="text-rose-600 font-sans">{log.errorMessage}</span>
                        ) : (
                          JSON.stringify(log.payload)
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

    {/* Test Trigger Modal */}
    {isTestIntegrationModal && (
      <div className="modal-backdrop">
        <div className="modal-card max-w-md w-full p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Send size={18} className="text-blue-600" />
              <span>{t.integrations.testModalTitle}</span>
            </h3>
            <button type="button" onClick={() => setIsTestIntegrationModal(false)} className="btn-icon">
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-slate-500">
            {t.integrations.testModalDesc}
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">{t.integrations.testSenderName}:</label>
              <input
                type="text"
                value={testIntegrationName}
                onChange={e => setTestIntegrationName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">{t.integrations.testTargetPhone}:</label>
              <input
                type="text"
                placeholder="Contoh: 08123456789 atau 628123456789"
                value={testIntegrationPhone}
                onChange={e => setTestIntegrationPhone(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">{t.integrations.testFormName}:</label>
              <input
                type="text"
                value={testIntegrationFormName}
                onChange={e => setTestIntegrationFormName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 outline-none"
              />
            </div>

            {testIntegrationResult && (
              <div className={`p-3 rounded-lg text-xs ${testIntegrationResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                <div className="font-bold">{testIntegrationResult.success ? '✅ Webhook Berhasil Diproses!' : '❌ Gagal Memproses Webhook'}</div>
                <div className="text-[11px] mt-1">{testIntegrationResult.message}</div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsTestIntegrationModal(false)} className="btn-secondary text-xs">
              {t.common.close}
            </button>
            <button
              type="button"
              onClick={handleTestIncomingWebhook}
              disabled={testIntegrationLoading}
              className="btn-primary text-xs"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {testIntegrationLoading && <RefreshCw size={13} className="animate-spin" />}
              <span>{testIntegrationLoading ? `${t.integrations.testSendButton}...` : t.integrations.testSendButton}</span>
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Add Outgoing Webhook Modal */}
    {isAddOutgoingWebhookModal && (
      <div className="modal-backdrop">
        <div className="modal-card max-w-md w-full p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Share2 size={18} className="text-blue-600" />
              <span>{t.integrations.addOutgoing}</span>
            </h3>
            <button type="button" onClick={() => setIsAddOutgoingWebhookModal(false)} className="btn-icon">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">{t.integrations.colName}:</label>
              <input
                type="text"
                placeholder="Contoh: CRM Server Notifier"
                value={newWebhookName}
                onChange={e => setNewWebhookName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">{t.integrations.colTargetUrl} (HTTPS):</label>
              <input
                type="text"
                placeholder="https://api.yourdomain.com/whatsapp-event"
                value={newWebhookUrl}
                onChange={e => setNewWebhookUrl(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 outline-none font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Secret Key / Token ({lang === 'id' ? 'Opsional' : 'Optional'}):</label>
              <input
                type="password"
                placeholder="Untuk verifikasi signature X-Hub-Signature"
                value={newWebhookSecret}
                onChange={e => setNewWebhookSecret(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 outline-none font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsAddOutgoingWebhookModal(false)} className="btn-secondary text-xs">
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleCreateOutgoingWebhook}
              className="btn-primary text-xs"
            >
              {t.integrations.addOutgoing}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
    </>
  );
};

export default IntegrationsPanel;
