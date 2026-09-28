// Extracted verbatim from App.tsx during refactor step 2.
// JSX for the 'automation' tab. State and handlers live in AppShell (App.tsx)
// and are provided via PanelCtx.

import React from 'react';
import { LayoutDashboard, Smartphone, MessageSquare, Users, UserPlus, Target, Layers, Send, Zap, ClipboardList, Server, FileText, Plus, RefreshCw, QrCode, KeyRound, Trash2, Play, Pause, Download, Upload, CheckCircle, CheckCircle2, AlertCircle, Clock, Activity, Search, ChevronRight, ChevronLeft, Copy, Check, Paperclip, CheckCheck, Sun, Moon, Menu, X, Eye, LogOut, Radio, FileSpreadsheet, ShieldCheck, XCircle, ToggleLeft, ToggleRight, Edit3, Bot, ChevronDown, Smile, MoreVertical, Tag, Mic, Video, Image, HardDrive, Settings, Webhook, Code2, ExternalLink, Share2, Globe, Languages } from 'lucide-react';
import { ChatAvatar, ChatInputBox, ChatMessageBubble } from '../components/chat';
import { parsePhoneFromJid, isSameChat, formatPhoneForDisplay, formatWhatsAppTimestamp, formatDateSeparator, parseRecipientLines, getAvatarBgColor } from '../utils/format';
import { PanelCtx } from './ctx';

const AutomationPanel: React.FC<{ ctx: PanelCtx }> = ({ ctx }) => {
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
        <h1>{t.automation.title}</h1>
        <span className="status-badge connected">{rules.length} {lang === 'id' ? 'Aturan' : 'Rules'}</span>
      </div>
      <div className="page-header__actions">
        <button onClick={() => setIsNewRuleModal(true)} className="btn-primary">
          <Plus size={16} />
          <span>{t.automation.newRule}</span>
        </button>
      </div>
      <p className="page-header__subtitle">
        {t.automation.subtitle}
      </p>
    </header>

    {/* AMAN CHAT Pro: Smart Bot & Business Hours Config Panel */}
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {t.automation.workingHours}
              </h3>
              <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                WhatsAman Pro Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.automation.workingHoursDesc}
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveBotConfig}
          className="btn-primary flex items-center gap-2 flex-shrink-0 text-xs py-2 px-4 shadow-sm"
        >
          <Check size={14} />
          <span>{lang === 'id' ? 'Simpan Pengaturan Bot' : 'Save Bot Settings'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Jam Operasional Layanan & Offline Reply */}
        <div className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {lang === 'id' ? 'Jam Operasional Bisnis (Business Hours)' : 'Business Operating Hours'}
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'id' ? 'Batasi operasional bot pada hari & jam tertentu' : 'Restrict automated bot responses to specific days & hours'}
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={botConfig.businessHoursEnabled}
                onChange={e => setBotConfig(prev => ({ ...prev, businessHoursEnabled: e.target.checked }))}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {botConfig.businessHoursEnabled && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    {lang === 'id' ? 'Jam Buka (WIB)' : 'Opening Time'}
                  </label>
                  <input
                    type="time"
                    value={botConfig.businessHoursStart}
                    onChange={e => setBotConfig(prev => ({ ...prev, businessHoursStart: e.target.value }))}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    {lang === 'id' ? 'Jam Tutup (WIB)' : 'Closing Time'}
                  </label>
                  <input
                    type="time"
                    value={botConfig.businessHoursEnd}
                    onChange={e => setBotConfig(prev => ({ ...prev, businessHoursEnd: e.target.value }))}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                  {lang === 'id' ? 'Hari Kerja Aktif:' : 'Active Working Days:'}
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { day: 1, label: lang === 'id' ? 'Senin' : 'Mon' },
                    { day: 2, label: lang === 'id' ? 'Selasa' : 'Tue' },
                    { day: 3, label: lang === 'id' ? 'Rabu' : 'Wed' },
                    { day: 4, label: lang === 'id' ? 'Kamis' : 'Thu' },
                    { day: 5, label: lang === 'id' ? 'Jumat' : 'Fri' },
                    { day: 6, label: lang === 'id' ? 'Sabtu' : 'Sat' },
                    { day: 0, label: lang === 'id' ? 'Minggu' : 'Sun' }
                  ].map(d => {
                    const isChecked = botConfig.businessDays.includes(d.day);
                    return (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => {
                          setBotConfig(prev => {
                            const nextDays = isChecked
                              ? prev.businessDays.filter(x => x !== d.day)
                              : [...prev.businessDays, d.day];
                            return { ...prev, businessDays: nextDays };
                          });
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-all ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Offline Auto-Reply */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {lang === 'id' ? 'Balasan Otomatis Luar Jam Kerja (Offline Reply)' : 'After-Hours / Away Auto-Reply'}
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lang === 'id' ? 'Kirim pesan ramah otomatis saat pelanggan chat di luar jam operasional' : 'Send friendly automated notice when customers chat outside business hours'}
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={botConfig.offlineReplyEnabled}
                  onChange={e => setBotConfig(prev => ({ ...prev, offlineReplyEnabled: e.target.checked }))}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {botConfig.offlineReplyEnabled && (
              <div className="space-y-1 pt-1">
                <textarea
                  rows={3}
                  value={botConfig.offlineReplyText}
                  onChange={e => setBotConfig(prev => ({ ...prev, offlineReplyText: e.target.value }))}
                  placeholder={lang === 'id' ? 'Pesan di luar jam kerja...' : 'Away message outside operating hours...'}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400">
                  {t.automation.supportsSpintax}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Anti-Spam Cooldown, Typing Simulation & Fallback */}
        <div className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 space-y-4">
          {/* Human Typing Simulation */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {lang === 'id' ? 'Simulasi Mengetik (Human Composing Presence)' : 'Human Typing Simulation'}
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'id' ? "Kirim status 'sedang mengetik...' 1.2 detik sebelum membalas agar alami & aman dari banned" : "Send 'typing...' status 1.2s before replying to emulate human response"}
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={botConfig.simulateTyping}
                onChange={e => setBotConfig(prev => ({ ...prev, simulateTyping: e.target.checked }))}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {/* Cooldown */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-1">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              {lang === 'id' ? 'Jeda Anti-Spam / Cooldown per Kontak' : 'Anti-Spam Cooldown per Contact'}
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              {lang === 'id' ? 'Mencegah bot mengirim pesan otomatis berulang kali ke kontak yang sama (isi 0 untuk membalas setiap pesan):' : 'Prevent repeated automated replies to the same contact within (set 0 to reply every message):'}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={120}
                value={botConfig.cooldownMinutes}
                onChange={e => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  setBotConfig(prev => ({ ...prev, cooldownMinutes: isNaN(val) ? 0 : val }));
                }}
                className="w-24 text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-center font-bold"
              />
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{lang === 'id' ? 'Menit jeda (0 = Tanpa Jeda)' : 'Minutes (0 = No Cooldown)'}</span>
            </div>
          </div>

          {/* Fallback Default Reply */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {lang === 'id' ? 'Balasan Standar (Fallback Default Reply)' : 'Default Fallback Auto-Reply'}
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lang === 'id' ? 'Kirim balasan jika chat pelanggan tidak cocok dengan satupun kata kunci aturan bot' : 'Send reply when no defined keywords match incoming message'}
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={botConfig.fallbackEnabled}
                  onChange={e => setBotConfig(prev => ({ ...prev, fallbackEnabled: e.target.checked }))}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {botConfig.fallbackEnabled && (
              <div className="space-y-1 pt-1">
                <textarea
                  rows={3}
                  value={botConfig.fallbackReplyText}
                  onChange={e => setBotConfig(prev => ({ ...prev, fallbackReplyText: e.target.value }))}
                  placeholder={lang === 'id' ? 'Balasan standar jika tidak ada kata kunci cocok...' : 'Default message when no keyword matches...'}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs bg-white dark:bg-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400">
                  {t.automation.supportsSpintax}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Live Spintax & Bot Simulator Widget */}
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Bot size={16} className="text-emerald-600" />
          <span>{t.automation.botSimulator}</span>
        </h3>
        <span className="text-[11px] text-slate-400">{t.automation.botSimulatorDesc}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">
            {lang === 'id' ? 'Teks Pesan Masuk (Simulasi)' : 'Simulated Customer Message'}
          </label>
          <input
            type="text"
            placeholder={t.automation.testInputPlaceholder}
            value={simTestInput}
            onChange={e => setSimTestInput(e.target.value)}
            className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">{t.automation.matchedRule}</span>
            <span className={`status-pill ${simMatchedRule ? 'ready' : 'disconnected'}`}>
              {simMatchedRule ? simMatchedRule.name : t.automation.noMatch}
            </span>
          </div>
          {simEvaluatedReply && (
            <div className="mt-2 pt-2 border-t border-slate-200 text-slate-800">
              <span className="font-semibold text-[11px] text-slate-500 block mb-0.5">{t.automation.replyPreview}</span>
              <p className="italic text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-100">
                "{simEvaluatedReply}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Rules Table */}
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      <h3 className="font-bold text-slate-900 text-sm">{t.automation.configuredRules}</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="table-header" style={{ display: 'table-header-group' }}>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <th className="py-2.5 px-4">{t.automation.ruleName}</th>
              <th className="py-2.5 px-4">{t.automation.triggerCondition}</th>
              <th className="py-2.5 px-4">{t.automation.replyAction}</th>
              <th className="py-2.5 px-4">{t.automation.hitCount}</th>
              <th className="py-2.5 px-4">{t.automation.status}</th>
              <th className="py-2.5 px-4 text-right">{t.automation.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  {t.automation.noRules}
                </td>
              </tr>
            ) : (
              rules.map(r => {
                const cond = r.conditions[0];
                const textAction = r.actions.find((a: any) => a.type === 'reply_text' || a.type === 'send_text');
                const tagActions = r.actions.filter((a: any) => a.type === 'add_tag');
                const stageActions = r.actions.filter((a: any) => a.type === 'set_stage');
                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{r.name}</td>
                    <td className="py-2.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[11px]">
                        {cond?.operator} "{cond?.value}"
                      </span>
                    </td>
                    <td className="py-2.5 px-4 max-w-xs">
                      <div className="space-y-1">
                        {textAction?.text && (
                          <div className="truncate text-slate-800 font-medium">"{textAction.text}"</div>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {tagActions.map((a: any, idx: number) => (
                            <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-1.5 py-0.5 rounded font-medium">
                              {a.tag}
                            </span>
                          ))}
                          {stageActions.map((a: any, idx: number) => (
                            <span key={idx} className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                              Stage: {a.stage}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 mono font-semibold text-slate-800">{r.hit_count}x</td>
                    <td className="py-2.5 px-4">
                      {/* WhatsAman Toggle Switch */}
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={r.is_active}
                          onChange={() => handleToggleRule(r.id, r.is_active)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            const tAction = r.actions.find((a: any) => a.type === 'reply_text' || a.type === 'send_text');
                            const tgAction = r.actions.find((a: any) => a.type === 'add_tag');
                            const stgAction = r.actions.find((a: any) => a.type === 'set_stage');
                            setEditRuleId(r.id);
                            setEditRuleName(r.name);
                            setEditRuleTriggerText(cond?.value || '');
                            setEditRuleOperator((cond?.operator as any) || 'contains');
                            setEditRuleReplyText(tAction?.text || '');
                            setEditRuleAddTagEnabled(Boolean(tgAction));
                            setEditRuleActionTag(tgAction?.tag || '🔥 Hot Lead');
                            setEditRuleSetStageEnabled(Boolean(stgAction));
                            setEditRuleActionStage((stgAction?.stage as any) || 'prospect');
                            setIsEditRuleModal(true);
                          }}
                          className="text-slate-400 hover:text-slate-700 p-1"
                          title={lang === 'id' ? 'Edit Aturan' : 'Edit Rule'}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(r.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title={t.common.delete}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
    </>
  );
};

export default AutomationPanel;
