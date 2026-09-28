// Extracted verbatim from App.tsx during refactor step 2.
// JSX for the 'chats' tab. State and handlers live in AppShell (App.tsx)
// and are provided via PanelCtx.

import React, { useState } from 'react';
import { LayoutDashboard, Smartphone, MessageSquare, Users, UserPlus, Target, Layers, Send, Zap, ClipboardList, Server, FileText, Plus, RefreshCw, QrCode, KeyRound, Trash2, Play, Pause, Download, Upload, CheckCircle, CheckCircle2, AlertCircle, Clock, Activity, Search, ChevronRight, ChevronLeft, Copy, Check, Paperclip, CheckCheck, Sun, Moon, Menu, X, Eye, LogOut, Radio, FileSpreadsheet, ShieldCheck, XCircle, ToggleLeft, ToggleRight, Edit3, Bot, ChevronDown, Smile, MoreVertical, Tag, Mic, Video, Image, HardDrive, Settings, Webhook, Code2, ExternalLink, Share2, Globe, Languages, RotateCcw } from 'lucide-react';
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

  const [showCrmDrawer, setShowCrmDrawer] = useState<boolean>(true);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);
  const [customNotes, setCustomNotes] = useState<string[]>([
    'Tertarik paket promo kargo grosir. Jadwalkan pengiriman kupon tambahan via automasi n8n.'
  ]);
  const [contactTags, setContactTags] = useState<string[]>([
    'VIP Grosir', 'Promo 9.9', 'Jawa Timur', 'High Engagement'
  ]);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [isAddingTag, setIsAddingTag] = useState<boolean>(false);

  // Dynamic Quick Replies with LocalStorage persistence
  interface QuickReplyItem {
    id: string;
    label: string;
    text: string;
  }

  const DEFAULT_QUICK_REPLIES: QuickReplyItem[] = [
    { id: 'qr-1', label: '⚡ Kirim Link Katalog', text: 'Halo kak! Berikut tautan katalog produk dan promo terbaru kami: https://whatsaman.com/katalog' },
    { id: 'qr-2', label: '📦 Cek Ongkir Kargo', text: 'Untuk pengecekan tarif ongkir kargo hemat, mohon cantumkan kecamatan dan kota tujuan pengiriman ya kak.' },
    { id: 'qr-3', label: '💳 Rekening Pembayaran', text: 'Pembayaran resmi dapat ditransfer via BCA: 82223089790 a/n Aman Kerja Studio. Konfirmasi bukti transfer di sini ya kak.' },
    { id: 'qr-4', label: '🙏 Terima Kasih', text: 'Terima kasih banyak kak telah menghubungi kami. Senang dapat membantu Anda! 👍' }
  ];

  const [quickReplies, setQuickReplies] = useState<QuickReplyItem[]>(() => {
    try {
      const saved = localStorage.getItem('whatsaman_quick_replies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load quick replies from storage', e);
    }
    return DEFAULT_QUICK_REPLIES;
  });

  const [isManageQuickRepliesModal, setIsManageQuickRepliesModal] = useState<boolean>(false);
  const [editingQrId, setEditingQrId] = useState<string | null>(null);
  const [qrLabelInput, setQrLabelInput] = useState<string>('');
  const [qrTextInput, setQrTextInput] = useState<string>('');

  const saveQuickReplies = (items: QuickReplyItem[]) => {
    setQuickReplies(items);
    try {
      localStorage.setItem('whatsaman_quick_replies', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save quick replies to storage', e);
    }
  };

  const handleAddOrUpdateQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLabel = qrLabelInput.trim();
    const trimmedText = qrTextInput.trim();

    if (!trimmedLabel || !trimmedText) {
      showToast('Label tombol dan teks balasan wajib diisi', 'error');
      return;
    }

    if (editingQrId) {
      const updated = quickReplies.map(qr =>
        qr.id === editingQrId ? { ...qr, label: trimmedLabel, text: trimmedText } : qr
      );
      saveQuickReplies(updated);
      showToast('Balasan cepat berhasil diperbarui', 'success');
      setEditingQrId(null);
    } else {
      const newItem: QuickReplyItem = {
        id: `qr-${Date.now()}`,
        label: trimmedLabel,
        text: trimmedText
      };
      saveQuickReplies([...quickReplies, newItem]);
      showToast('Tombol balasan cepat baru berhasil ditambahkan', 'success');
    }
    setQrLabelInput('');
    setQrTextInput('');
  };

  const handleEditQuickReply = (item: QuickReplyItem) => {
    setEditingQrId(item.id);
    setQrLabelInput(item.label);
    setQrTextInput(item.text);
  };

  const handleDeleteQuickReply = (id: string) => {
    const updated = quickReplies.filter(qr => qr.id !== id);
    saveQuickReplies(updated);
    showToast('Tombol balasan cepat dihapus', 'info');
    if (editingQrId === id) {
      setEditingQrId(null);
      setQrLabelInput('');
      setQrTextInput('');
    }
  };

  const handleResetQuickReplies = () => {
    saveQuickReplies(DEFAULT_QUICK_REPLIES);
    setEditingQrId(null);
    setQrLabelInput('');
    setQrTextInput('');
    showToast('Balasan cepat dikembalikan ke pengaturan awal', 'info');
  };

  const personalChatsCount = chats.filter(c => !c.chat_jid.includes('@g.us') && !c.chat_jid.includes('@newsletter')).length;
  const groupChatsCount = chats.filter(c => c.chat_jid.includes('@g.us')).length;
  const channelChatsCount = chats.filter(c => c.chat_jid.includes('@newsletter')).length;

  const activeChat = activeChatJid ? chats.find(c => isSameChat(c.chat_jid, activeChatJid)) : null;
  const isGroup = Boolean(activeChatJid && activeChatJid.includes('@g.us'));
  const isNewsletter = Boolean(activeChatJid && activeChatJid.includes('@newsletter'));
  const targetJid = activeChat?.resolved_phone || activeChatJid || '';
  const activeContact = targetJid ? findContact(targetJid) : null;
  const activeGroup = activeChatJid ? groupsMap.get(activeChatJid) : null;
  const phoneDisplay = targetJid ? formatPhoneForDisplay(targetJid) : '';
  const activeTitle = isGroup
    ? (activeGroup?.name || activeChat?.name || phoneDisplay || 'Grup')
    : isNewsletter
    ? (activeChat?.name || 'Saluran WhatsApp')
    : (activeContact?.name || activeChat?.name || phoneDisplay || 'Kontak');
  const activeSubtitle = isGroup
    ? `${activeGroup?.memberCount || 'Beberapa'} anggota • WhatsApp Group`
    : isNewsletter
    ? 'Saluran Pembaruan WhatsApp'
    : (phoneDisplay || 'Kontak Pribadi');
  const currentSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <div className="space-y-4">
      {/* Top Action & Context Banner */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.chats.title}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wider">
              {chats.length} {t.chats.activeChats}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.chats.subtitle}
          </p>
        </div>

        {/* Quick Utilities Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Auto Reply Toggle Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-xs">
            <Bot size={15} className={botConfig.autoReplyEnabled !== false ? 'text-emerald-600' : 'text-slate-400'} />
            <span className="font-semibold text-slate-700">Auto Reply:</span>
            <button
              type="button"
              onClick={() => handleToggleAutoReplyGlobal(botConfig.autoReplyEnabled === false)}
              className="text-slate-400 hover:text-emerald-600 transition-colors"
              title={t.chats.toggleAutoReply}
            >
              {botConfig.autoReplyEnabled !== false ? (
                <ToggleRight size={22} className="text-emerald-500" />
              ) : (
                <ToggleLeft size={22} className="text-slate-400" />
              )}
            </button>
            <span className={`text-[11px] font-bold ${botConfig.autoReplyEnabled !== false ? 'text-emerald-700' : 'text-slate-400'}`}>
              {botConfig.autoReplyEnabled !== false ? 'AKTIF' : 'OFF'}
            </span>
            <button
              type="button"
              onClick={() => setIsChatAutoReplyModal(true)}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Pengaturan Auto Reply"
            >
              <Settings size={13} />
            </button>
          </div>

          {/* Privacy Blur Toggle Pill */}
          <button
            type="button"
            onClick={() => setIsPrivacyMenuOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-sm transition-colors ${
              privacyMode
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Pengaturan Privasi Blur (Alt + P)"
          >
            <Eye size={14} className={privacyMode ? 'text-blue-600' : 'text-slate-400'} />
            <span>Privasi: <strong>{privacyMode ? 'ON' : 'OFF'}</strong></span>
          </button>

          {/* Refresh Messages Button */}
          <button
            type="button"
            onClick={handleManualRefreshChats}
            disabled={isRefreshingChats}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-sm transition-all ${
              refreshSuccess
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title={t.chats.refreshChat}
          >
            <RefreshCw size={14} className={isRefreshingChats ? 'animate-spin text-emerald-600' : 'text-slate-500'} />
            <span>{isRefreshingChats ? t.common.refreshing : refreshSuccess ? t.common.synced : t.chats.refreshChat}</span>
          </button>

          {/* Broadcast Quick Action Button */}
          <button
            type="button"
            onClick={() => {
              setChatBroadcastSessionId(selectedSessionId);
              setIsChatBroadcastModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 text-xs font-semibold transition-all shadow-sm"
          >
            <Send size={14} className="text-slate-600" />
            <span>Broadcast</span>
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={() => setIsNewChatModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Plus size={15} />
            <span>{t.chats.newChat}</span>
          </button>
        </div>
      </section>

      {/* 3-Column Responsive Chat Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start w-full h-[calc(100vh-140px)] min-h-[580px]">
        {/* COLUMN 1: Conversation List & Filter Hub (4 of 12) */}
        <div className="lg:col-span-4 xl:col-span-4 w-full flex flex-col bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden h-full">
          {/* Header Box: Session Selector & Search */}
          <div className="p-3 border-b border-slate-100 space-y-2.5">
            {/* Session Dropdown Selector */}
            <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200/70 rounded-lg">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">SESI TERHUBUNG</span>
                  <select
                    id="chat-session-select"
                    value={selectedSessionId}
                    onChange={e => setSelectedSessionId(e.target.value)}
                    className="bg-transparent border-0 text-xs font-bold text-slate-800 truncate focus:outline-none p-0 cursor-pointer"
                  >
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.status === 'CONNECTED' ? 'Online' : s.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Search Input with Shortcut Hint */}
            <div className="relative w-full flex items-center">
              <Search size={15} className="absolute left-3 text-slate-400" />
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
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition-colors"
              />
              <span className="absolute right-2.5 px-1.5 py-0.5 rounded bg-slate-200 text-[10px] text-slate-500 font-bold">/</span>
            </div>

            {/* 4 Category Metric Pills */}
            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setChatsSidebarTab('chats');
                  setChatFilter('all');
                }}
                className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-center transition-all ${
                  chatsSidebarTab === 'chats' && chatFilter === 'all'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <span className="text-[10px] text-slate-400 font-semibold">Semua</span>
                <span className="text-xs font-bold text-slate-900">{personalChatsCount}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setChatsSidebarTab('chats');
                  setChatFilter('personal');
                }}
                className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-center transition-all ${
                  chatsSidebarTab === 'chats' && chatFilter === 'personal'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <span className="text-[10px] text-slate-400 font-semibold">Pribadi</span>
                <span className="text-xs font-bold text-slate-900">{personalChatsCount}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setChatsSidebarTab('groups');
                  setChatFilter('groups');
                }}
                className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-center transition-all ${
                  chatsSidebarTab === 'groups'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <span className="text-[10px] text-slate-400 font-semibold">Grup</span>
                <span className="text-xs font-bold text-slate-900">{groups.length || groupChatsCount}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setChatsSidebarTab('channels');
                  setChatFilter('channels');
                }}
                className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-center transition-all ${
                  chatsSidebarTab === 'channels'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <span className="text-[10px] text-slate-400 font-semibold">Saluran</span>
                <span className="text-xs font-bold text-slate-900">{channelChatsCount}</span>
              </button>
            </div>

            {/* Secondary Horizontal Filter Badges */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 pt-0.5">
              <button
                type="button"
                onClick={() => setChatFilter('all')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  chatFilter === 'all'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({personalChatsCount})
              </button>
              <button
                type="button"
                onClick={() => setChatFilter('unread')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  chatFilter === 'unread'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Belum Dibaca ({unreadChatsCount})
              </button>
              <button
                type="button"
                onClick={() => setChatsSidebarTab('contacts')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  chatsSidebarTab === 'contacts'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Buku Kontak ({contacts.length})
              </button>
            </div>
          </div>

          {/* Contact / Conversation Threads Scroll Area */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-100" id="chatThreadList">
            {chatsSidebarTab === 'chats' && (
              filteredChats.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <MessageSquare size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs">{t.chats.noChats}</p>
                </div>
              ) : (
                filteredChats.map(c => {
                  const isActive = activeChatJid === c.chat_jid;
                  const phoneFormatted = c.resolved_phone ? formatPhoneForDisplay(c.resolved_phone) : null;
                  const isGrp = c.chat_jid.endsWith('@g.us');
                  const isCh = c.chat_jid.endsWith('@newsletter');
                  const grp = isGrp ? groupsMap.get(c.chat_jid) : null;
                  const contact = (c.resolved_phone ? contactsMap.get(c.resolved_phone) : null) || contactsMap.get(c.chat_jid);
                  
                  const displayName = isGrp
                    ? grp?.name || c.name || 'Grup WhatsApp'
                    : isCh
                    ? c.name || 'Saluran WhatsApp'
                    : contact?.name ||
                      (c.name && !c.name.includes('@') && !/^\\d+$/.test(c.name) ? c.name : null) ||
                      contact?.push_name ||
                      c.push_name ||
                      phoneFormatted ||
                      c.chat_jid;

                  return (
                    <div
                      key={c.chat_jid}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setActiveChatJid(c.chat_jid);
                        if (selectedSessionId) {
                          fetchChatMessages(selectedSessionId, c.chat_jid);
                        }
                      }}
                      className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all relative ${
                        isActive
                          ? 'bg-emerald-50/70 border border-emerald-200/80 shadow-xs'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-emerald-500 rounded-r-full"></div>
                      )}
                      <div className="relative shrink-0 ml-0.5">
                        <ChatAvatar
                          sessionId={selectedSessionId}
                          jid={c.chat_jid}
                          name={displayName}
                          isGroup={isGrp}
                          isNewsletter={isCh}
                          size={18}
                          style={{ width: '42px', height: '42px', fontSize: '0.85rem' }}
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-xs text-slate-900 truncate privacy-blur privacy-blur-name">
                              {displayName}
                            </span>
                            {isGrp && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold shrink-0">
                                Grup
                              </span>
                            )}
                            {isCh && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-50 text-amber-700 font-semibold shrink-0">
                                Saluran
                              </span>
                            )}
                          </div>
                          {Boolean(c.timestamp && c.timestamp > 0 && c.last_message !== 'Mulai percakapan') && (
                            <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                              {formatWhatsAppTimestamp(c.timestamp)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5 privacy-blur privacy-blur-recent">
                          {c.last_message || <span className="text-slate-300 italic">Belum ada percakapan</span>}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            {c.last_from_me === 1 && (
                              <CheckCheck size={12} className="text-emerald-600" />
                            )}
                            <span className="truncate">{phoneFormatted || c.chat_jid.split('@')[0]}</span>
                          </div>
                          {(c.unread_count || 0) > 0 && (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                              {c.unread_count! > 99 ? '99+' : c.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {chatsSidebarTab === 'contacts' && (
              filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Users size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs">{t.contacts.noContacts}</p>
                </div>
              ) : (
                filteredContacts.map(c => {
                  const jid = c.phone ? `${c.phone}@s.whatsapp.net` : '';
                  const isActive = activeChatJid === jid;
                  return (
                    <div
                      key={c.id || c.phone}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (jid) {
                          setActiveChatJid(jid);
                          if (selectedSessionId) {
                            fetchChatMessages(selectedSessionId, jid);
                          }
                        }
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                        isActive ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <ChatAvatar sessionId={selectedSessionId} jid={jid} name={c.name} size={18} />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{c.name}</h4>
                        <p className="text-[11px] text-slate-500 font-mono">{formatPhoneForDisplay(c.phone)}</p>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {chatsSidebarTab === 'groups' && (
              filteredGroups.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Users size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs">Tidak ada grup ditemukan</p>
                </div>
              ) : (
                filteredGroups.map(g => {
                  const isActive = activeChatJid === g.jid;
                  return (
                    <div
                      key={g.jid}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setActiveChatJid(g.jid);
                        if (selectedSessionId) {
                          fetchChatMessages(selectedSessionId, g.jid);
                        }
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                        isActive ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <ChatAvatar sessionId={selectedSessionId} jid={g.jid} name={g.name} isGroup={true} size={18} />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{g.name}</h4>
                        <p className="text-[11px] text-slate-500">{g.memberCount ? `${g.memberCount} anggota` : 'Grup WhatsApp'}</p>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {chatsSidebarTab === 'channels' && (
              filteredChannels.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Radio size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs">Tidak ada saluran ditemukan</p>
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
                      onClick={() => {
                        setActiveChatJid(c.chat_jid);
                        if (selectedSessionId) {
                          fetchChatMessages(selectedSessionId, c.chat_jid);
                        }
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                        isActive ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <ChatAvatar sessionId={selectedSessionId} jid={c.chat_jid} name={displayName} isNewsletter={true} size={18} />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{displayName}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{c.last_message || 'Saluran WhatsApp'}</p>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* COLUMN 2: Interactive Live Chat Canvas (5 of 12) */}
        <div className={`lg:col-span-8 ${showCrmDrawer ? 'xl:col-span-5' : 'xl:col-span-8'} w-full flex flex-col bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden h-full relative transition-all`}>
          {activeChatJid ? (
            <div className="flex flex-col h-full">
              {/* Chat Canvas Header */}
              <div className="p-3 bg-white border-b border-slate-200/80 flex items-center justify-between gap-2 shadow-xs z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <ChatAvatar
                      sessionId={selectedSessionId}
                      jid={activeChat?.resolved_phone ? `${activeChat.resolved_phone}@s.whatsapp.net` : activeChatJid}
                      name={activeTitle}
                      isGroup={isGroup}
                      isNewsletter={isNewsletter}
                      size={20}
                      style={{ width: '42px', height: '42px', minWidth: '42px', minHeight: '42px', borderRadius: '50%', fontSize: '0.95rem' }}
                    />
                    {!isNewsletter && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-slate-900 truncate privacy-blur privacy-blur-name leading-tight">
                        {activeTitle}
                      </h2>
                      {isNewsletter ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-50 border border-amber-200 text-amber-700 font-semibold inline-flex items-center gap-1 shrink-0">
                          <Radio size={10} className="text-amber-600" />
                          <span>Saluran</span>
                        </span>
                      ) : isGroup ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 border border-slate-200 text-slate-600 font-semibold inline-flex items-center gap-1 shrink-0">
                          <Users size={10} className="text-slate-500" />
                          <span>Grup</span>
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate mt-0.5">
                      {isNewsletter ? (
                        <>
                          <span className="text-amber-700 font-medium">Siaran Satu Arah</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 truncate">Saluran Pembaruan WhatsApp</span>
                        </>
                      ) : isGroup ? (
                        <>
                          <span className="text-slate-600 font-medium">{activeGroup?.memberCount || 'Beberapa'} Anggota</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 truncate">WhatsApp Group</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                          <span className="text-emerald-700 font-bold">Online</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-mono truncate">{phoneDisplay || activeSubtitle}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleRefreshActiveThread}
                    disabled={isRefreshingThread}
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title={t.chats.refreshThread}
                  >
                    <RefreshCw size={15} className={isRefreshingThread ? 'animate-spin' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCrmDrawer(!showCrmDrawer)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      showCrmDrawer
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                    title="Toggle CRM Inspector"
                  >
                    <UserPlus size={15} />
                  </button>
                </div>
              </div>

              {/* Live Messages Scroll Stream */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 bg-slate-50/60" id="chatMessageViewport">
                {chatMessages.length === 0 ? (
                  <div className="m-auto text-center text-slate-400 space-y-2">
                    <MessageSquare size={36} className="mx-auto text-slate-300" />
                    <h3 className="font-semibold text-slate-700">{t.chats.noMessages}</h3>
                    <p className="text-xs text-slate-400">{t.chats.startConversation}</p>
                  </div>
                ) : (
                  chatMessages.map((m, idx) => {
                    const isMe = m.from_me === 1;
                    const prevMsg = idx > 0 ? chatMessages[idx - 1] : null;
                    const showDateSeparator = !prevMsg || 
                      new Date(m.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();
                    const dateSeparatorText = showDateSeparator ? formatDateSeparator(m.timestamp) : undefined;
                    
                    let senderDisplayName = '';
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

              {/* Fast Canned Reply Pills & Composer */}
              <div className="p-3 bg-white border-t border-slate-200/80 flex flex-col gap-2">
                {/* Canned Response Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balasan Cepat:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQrId(null);
                        setQrLabelInput('');
                        setQrTextInput('');
                        setIsManageQuickRepliesModal(true);
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                      title="Atur & Kelola Tombol Balasan Cepat"
                    >
                      <Settings size={13} />
                    </button>
                  </div>
                  {quickReplies.map((qr) => (
                    <button
                      key={qr.id}
                      type="button"
                      onClick={() => setChatReplyText(qr.text)}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-[11px] font-medium whitespace-nowrap transition-colors border border-slate-200/60"
                      title={qr.text}
                    >
                      {qr.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQrId(null);
                      setQrLabelInput('');
                      setQrTextInput('');
                      setIsManageQuickRepliesModal(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 text-[11px] font-medium transition-colors shrink-0"
                    title="Tambah Tombol Balasan Cepat"
                  >
                    <Plus size={12} />
                    <span>Tambah</span>
                  </button>
                </div>

                {/* Chat Input Field Box */}
                <ChatInputBox
                  value={chatReplyText}
                  onChange={setChatReplyText}
                  onSend={(msg) => {
                    handleSendChatMessage(msg);
                    setChatReplyText('');
                  }}
                  onAttach={() => setIsSendMediaModal(true)}
                  placeholder={t.chats.typeMessage}
                  sendTitle={t.chats.send}
                  attachTitle={t.chats.attachFile}
                />
              </div>
            </div>
          ) : (
            <div className="m-auto text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <MessageSquare size={32} />
              </div>
              <h2 className="text-base font-bold text-slate-800">
                {lang === 'id' ? 'Pilih Percakapan' : 'Select a conversation'}
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {lang === 'id'
                  ? 'Pilih kontak atau obrolan dari panel kiri untuk mulai membaca dan membalas pesan.'
                  : 'Choose a chat from the sidebar or click "New Chat" to start messaging.'}
              </p>
              <button
                type="button"
                onClick={() => setIsNewChatModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus size={15} />
                <span>{t.chats.newChat}</span>
              </button>
            </div>
          )}
        </div>

        {/* COLUMN 3: CRM Inspector & Quick Actions (3 of 12) */}
        {showCrmDrawer && (
          <div className="hidden xl:flex xl:col-span-3 w-full flex-col gap-3 h-full overflow-y-auto pr-0.5">
            {activeChatJid ? (
              <>
                {/* Customer Profile & Lead Card */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PROFIL KONTAK &amp; LEAD</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      CRM SYNC
                    </span>
                  </div>

                  <div className="flex flex-col items-center text-center pb-1">
                    <ChatAvatar
                      sessionId={selectedSessionId}
                      jid={activeChat?.resolved_phone ? `${activeChat.resolved_phone}@s.whatsapp.net` : activeChatJid}
                      name={activeTitle}
                      isGroup={isGroup}
                      isNewsletter={isNewsletter}
                      size={24}
                      style={{ width: '56px', height: '56px', fontSize: '1.25rem', marginBottom: '8px' }}
                    />
                    <h3 className="font-bold text-sm text-slate-900 truncate max-w-full" title={activeTitle}>
                      {activeTitle}
                    </h3>
                    <span className="text-xs text-slate-500 font-mono mt-0.5">
                      {phoneDisplay || activeChatJid}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-2">
                      Pipeline: Warm Lead
                    </span>
                  </div>

                  {/* Quick Info Rows */}
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">No. WhatsApp</span>
                      <span className="font-mono font-bold text-slate-800 text-[11px] truncate max-w-[130px]">
                        {phoneDisplay || activeChatJid.split('@')[0]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Sesi Aktif</span>
                      <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[130px]">
                        {currentSession?.name || selectedSessionId || 'Default'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Penanggung Jawab</span>
                      <span className="font-semibold text-slate-800 text-[11px]">Admin Operasional</span>
                    </div>
                  </div>
                </div>

                {/* Segment Tags Card */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-sm flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TAG &amp; LABEL SEGMEN</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingTag(!isAddingTag)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                      title="Tambah Tag"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {contactTags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[10px] flex items-center gap-1 border border-emerald-200/60"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => setContactTags(contactTags.filter((_: unknown, i: number) => i !== idx))}
                          className="hover:text-red-600 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>

                  {isAddingTag && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="text"
                        placeholder="Tag baru..."
                        value={newTagInput}
                        onChange={e => setNewTagInput(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newTagInput.trim()) {
                            setContactTags([...contactTags, newTagInput.trim()]);
                            setNewTagInput('');
                            setIsAddingTag(false);
                            showToast('Tag berhasil ditambahkan', 'success');
                          }
                        }}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                      >
                        Simpan
                      </button>
                    </div>
                  )}
                </div>

                {/* Internal Agent Notes Card */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CATATAN KHUSUS AGEN</span>
                    <Edit3 size={13} className="text-slate-400" />
                  </div>

                  <div className="space-y-1.5">
                    {customNotes.map((note: string, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-700 leading-relaxed">
                        <p>{note}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">Tercatat oleh Admin</span>
                      </div>
                    ))}
                  </div>

                  {isAddingNote ? (
                    <div className="space-y-1.5 mt-1">
                      <textarea
                        rows={2}
                        placeholder="Tulis catatan prospek..."
                        value={newNoteText}
                        onChange={e => setNewNoteText(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsAddingNote(false)}
                          className="px-2.5 py-1 text-slate-500 text-xs"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (newNoteText.trim()) {
                              setCustomNotes([...customNotes, newNoteText.trim()]);
                              setNewNoteText('');
                              setIsAddingNote(false);
                              showToast('Catatan agen disimpan', 'success');
                            }
                          }}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(true)}
                      className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-200/70"
                    >
                      + Tambah Catatan Baru
                    </button>
                  )}
                </div>

                {/* Quick Pipeline Integration Actions */}
                <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-sm flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AKSI INTEGRASI CEPAT</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-medium">
                      Fitur Dalam Pengembangan
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Aksi integrasi cepat ini sedang dalam tahap pengembangan dan akan segera aktif:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => showToast('Fitur Buat Invoice sedang dalam tahap pengembangan', 'info')}
                      className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-50 hover:bg-amber-50/60 text-slate-700 hover:text-amber-800 transition-colors gap-1 text-center border border-slate-200/60 relative group"
                      title="Fitur Buat Invoice dalam pengembangan"
                    >
                      <FileSpreadsheet size={18} className="text-emerald-600 opacity-85" />
                      <span className="text-[11px] font-medium">Buat Invoice</span>
                      <span className="text-[9px] text-amber-600 font-normal">Dalam Pengembangan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Fitur Kirim Webhook sedang dalam tahap pengembangan', 'info')}
                      className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-50 hover:bg-amber-50/60 text-slate-700 hover:text-amber-800 transition-colors gap-1 text-center border border-slate-200/60 relative group"
                      title="Fitur Kirim Webhook dalam pengembangan"
                    >
                      <Webhook size={18} className="text-sky-600 opacity-85" />
                      <span className="text-[11px] font-medium">Kirim Webhook</span>
                      <span className="text-[9px] text-amber-600 font-normal">Dalam Pengembangan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Fitur Simpan Kontak sedang dalam tahap pengembangan', 'info')}
                      className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-50 hover:bg-amber-50/60 text-slate-700 hover:text-amber-800 transition-colors gap-1 text-center border border-slate-200/60 relative group"
                      title="Fitur Simpan Kontak dalam pengembangan"
                    >
                      <UserPlus size={18} className="text-slate-600 opacity-85" />
                      <span className="text-[11px] font-medium">Simpan Kontak</span>
                      <span className="text-[9px] text-amber-600 font-normal">Dalam Pengembangan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Fitur Atur Pengingat sedang dalam tahap pengembangan', 'info')}
                      className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-50 hover:bg-amber-50/60 text-slate-700 hover:text-amber-800 transition-colors gap-1 text-center border border-slate-200/60 relative group"
                      title="Fitur Atur Pengingat dalam pengembangan"
                    >
                      <Clock size={18} className="text-slate-600 opacity-85" />
                      <span className="text-[11px] font-medium">Atur Pengingat</span>
                      <span className="text-[9px] text-amber-600 font-normal">Dalam Pengembangan</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm text-center text-slate-400 space-y-2">
                <Target size={28} className="mx-auto text-slate-300" />
                <h4 className="font-semibold text-slate-700 text-xs">CRM &amp; Lead Inspector</h4>
                <p className="text-[11px] text-slate-400">Pilih salah satu obrolan untuk melihat rincian prospek, catatan internal, dan tindakan cepat CRM.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Kelola Balasan Cepat (Quick Replies Manager) */}
      {isManageQuickRepliesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center font-bold">
                  <Zap size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Kelola Tombol Balasan Cepat</h3>
                  <p className="text-[11px] text-slate-500">Tambah, ubah, atau hapus pintasan pesan balasan instan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManageQuickRepliesModal(false);
                  setEditingQrId(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Form Input / Edit */}
              <form onSubmit={handleAddOrUpdateQuickReply} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    {editingQrId ? (
                      <>
                        <Edit3 size={13} className="text-amber-600" />
                        <span>Edit Balasan Cepat</span>
                      </>
                    ) : (
                      <>
                        <Plus size={13} className="text-emerald-600" />
                        <span>Tambah Tombol Baru</span>
                      </>
                    )}
                  </span>
                  {editingQrId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQrId(null);
                        setQrLabelInput('');
                        setQrTextInput('');
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-700 underline font-medium"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Label Tombol <span className="text-slate-400 font-normal">(Teks singkat / emoji di tombol)</span>
                  </label>
                  <input
                    type="text"
                    value={qrLabelInput}
                    onChange={(e) => setQrLabelInput(e.target.value)}
                    placeholder="Contoh: ⚡ Kirim Katalog atau 📦 Cek Resi"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Isi Pesan Balasan <span className="text-slate-400 font-normal">(Teks otomatis masuk ke obrolan)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={qrTextInput}
                    onChange={(e) => setQrTextInput(e.target.value)}
                    placeholder="Contoh: Halo kak! Terima kasih telah menghubungi kami. Katalog kami bisa diakses di https://..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white resize-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm ${
                      editingQrId
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {editingQrId ? <Check size={14} /> : <Plus size={14} />}
                    <span>{editingQrId ? 'Simpan Perubahan' : 'Tambahkan Tombol'}</span>
                  </button>
                </div>
              </form>

              {/* Active Buttons List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Daftar Tombol Balasan Cepat ({quickReplies.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleResetQuickReplies}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 font-medium hover:underline"
                    title="Kembalikan ke 4 tombol bawaan"
                  >
                    <RotateCcw size={11} />
                    <span>Reset Bawaan</span>
                  </button>
                </div>

                {quickReplies.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    Belum ada tombol balasan cepat. Silakan tambahkan tombol baru di atas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quickReplies.map((qr) => (
                      <div
                        key={qr.id}
                        className={`p-2.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          editingQrId === qr.id
                            ? 'bg-amber-50/50 border-amber-300'
                            : 'bg-white border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-semibold border border-slate-200">
                              {qr.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {qr.text}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleEditQuickReply(qr)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                            title="Edit tombol ini"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuickReply(qr.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus tombol ini"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                Perubahan tersimpan otomatis di perangkat Anda.
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsManageQuickRepliesModal(false);
                  setEditingQrId(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default ChatsPanel;
