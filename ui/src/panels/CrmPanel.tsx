// Extracted verbatim from App.tsx during refactor step 2.
// JSX for the 'crm' tab. State and handlers live in AppShell (App.tsx)
// and are provided via PanelCtx.

import React from 'react';
import { LayoutDashboard, Smartphone, MessageSquare, Users, UserPlus, Target, Layers, Send, Zap, ClipboardList, Server, FileText, Plus, RefreshCw, QrCode, KeyRound, Trash2, Play, Pause, Download, Upload, CheckCircle, CheckCircle2, AlertCircle, Clock, Activity, Search, ChevronRight, ChevronLeft, Copy, Check, Paperclip, CheckCheck, Sun, Moon, Menu, X, Eye, LogOut, Radio, FileSpreadsheet, ShieldCheck, XCircle, ToggleLeft, ToggleRight, Edit3, Bot, ChevronDown, Smile, MoreVertical, Tag, Mic, Video, Image, HardDrive, Settings, Webhook, Code2, ExternalLink, Share2, Globe, Languages, TrendingUp, Coins, LayoutGrid, List, ArrowLeft, ArrowRight, GripVertical, CheckSquare, Square, MinusSquare } from 'lucide-react';
import { ChatAvatar, ChatInputBox, ChatMessageBubble } from '../components/chat';
import { parsePhoneFromJid, isSameChat, formatPhoneForDisplay, formatWhatsAppTimestamp, formatDateSeparator, parseRecipientLines, getAvatarBgColor, getCleanContactName } from '../utils/format';
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
    handleUpdateDealValue,
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

  const [crmViewMode, setCrmViewMode] = React.useState<'kanban' | 'table'>('kanban');
  const [draggedPhone, setDraggedPhone] = React.useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = React.useState<string | null>(null);
  const dragEnterCountRef = React.useRef<Record<string, number>>({});
  const [isEditDealModal, setIsEditDealModal] = React.useState(false);
  const [selectedContactForDeal, setSelectedContactForDeal] = React.useState<any>(null);
  const [dealValueInput, setDealValueInput] = React.useState<string>('0');

  const totalPipelineValue = React.useMemo(() => {
    return contacts
      .filter(c => c.pipeline_stage === 'lead' || c.pipeline_stage === 'prospect')
      .reduce((acc, c) => acc + (c.deal_value || 0), 0);
  }, [contacts]);

  const totalWonValue = React.useMemo(() => {
    return contacts
      .filter(c => c.pipeline_stage === 'customer')
      .reduce((acc, c) => acc + (c.deal_value || 0), 0);
  }, [contacts]);

  const formatRupiah = (val?: number) => {
    return 'Rp ' + (val || 0).toLocaleString('id-ID');
  };

  const handleOpenEditDeal = (contact: any) => {
    setSelectedContactForDeal(contact);
    setDealValueInput(String(contact.deal_value || 0));
    setIsEditDealModal(true);
  };

  const handleSaveDeal = async () => {
    if (!selectedContactForDeal) return;
    const num = parseInt(dealValueInput.replace(/[^0-9]/g, ''), 10) || 0;
    await handleUpdateDealValue(selectedContactForDeal.phone, num);
    setIsEditDealModal(false);
  };

  const crmFilteredContacts = React.useMemo(() => {
    return contacts.filter(c => {
      const stage = c.pipeline_stage || 'none';
      if (crmStageFilter !== 'ALL') {
        if (crmStageFilter === 'unassigned' && stage !== 'none') return false;
        if (crmStageFilter !== 'unassigned' && stage !== crmStageFilter) return false;
      }
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
    });
  }, [contacts, crmStageFilter, selectedTagFilter, crmSearchQuery]);

  // Multiple Selection & Batch Actions State
  const [selectedCrmPhones, setSelectedCrmPhones] = React.useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = React.useState(false);
  const [isBatchTagModalOpen, setIsBatchTagModalOpen] = React.useState(false);
  const [batchTagInput, setBatchTagInput] = React.useState('');
  const [batchTagMode, setBatchTagMode] = React.useState<'add' | 'replace'>('add');

  // Dynamic Custom Tags Management
  const DEFAULT_TAG_LIST = ['🔥 Hot Lead', '🟡 Warm Lead', '🔵 New Lead', '💰 Customer', '🔄 Follow Up', '❌ Lost', '⭐ VIP'];
  const [crmTagList, setCrmTagList] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('whatsaman_crm_custom_tags');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_TAG_LIST;
  });

  const [isManageTagsModal, setIsManageTagsModal] = React.useState(false);
  const [newTagInput, setNewTagInput] = React.useState('');
  const [editingTagOriginal, setEditingTagOriginal] = React.useState<string | null>(null);
  const [editingTagInput, setEditingTagInput] = React.useState('');

  const saveCrmTagList = (list: string[]) => {
    setCrmTagList(list);
    try {
      localStorage.setItem('whatsaman_crm_custom_tags', JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (crmTagList.includes(trimmed)) {
      showToast('Tag sudah ada dalam daftar', 'warn');
      return;
    }
    const updated = [...crmTagList, trimmed];
    saveCrmTagList(updated);
    setNewTagInput('');
    showToast(`Tag "${trimmed}" berhasil ditambahkan`, 'success');
  };

  const handleEditTag = (oldTag: string, updatedTag: string) => {
    const trimmed = updatedTag.trim();
    if (!trimmed || trimmed === oldTag) {
      setEditingTagOriginal(null);
      return;
    }
    const updated = crmTagList.map(t => t === oldTag ? trimmed : t);
    saveCrmTagList(updated);
    if (selectedTagFilter === oldTag) {
      setSelectedTagFilter(trimmed);
    }
    setEditingTagOriginal(null);
    showToast(`Tag diubah menjadi "${trimmed}"`, 'success');
  };

  const handleDeleteTag = (tagToDelete: string) => {
    const updated = crmTagList.filter(t => t !== tagToDelete);
    saveCrmTagList(updated);
    if (selectedTagFilter === tagToDelete) {
      setSelectedTagFilter('ALL');
    }
    showToast(`Tag "${tagToDelete}" dihapus`, 'info');
  };

  // Pagination & Display Limits for Peak Performance (No Lag with Thousands of Contacts)
  const [tableCurrentPage, setTableCurrentPage] = React.useState<number>(1);
  const [tablePageSize, setTablePageSize] = React.useState<number>(25);
  const [stageLimits, setStageLimits] = React.useState<Record<string, number>>({
    none: 40,
    lead: 40,
    prospect: 40,
    customer: 40,
    churned: 40
  });

  const handleLoadMoreStage = (stageId: string) => {
    setStageLimits(prev => ({
      ...prev,
      [stageId]: (prev[stageId] || 40) + 40
    }));
  };

  // Reset page when filter changes
  React.useEffect(() => {
    setTableCurrentPage(1);
  }, [crmStageFilter, selectedTagFilter, crmSearchQuery]);

  // Toggle selection for a single contact
  const handleToggleSelectRow = (phone: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCrmPhones(prev => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  };

  // Toggle selection for all contacts in a specific Kanban stage column
  const handleSelectStageContacts = (stageId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const stageContacts = crmFilteredContacts.filter(c => (c.pipeline_stage || 'none') === stageId);
    const stagePhones = stageContacts.map(c => c.phone);
    if (stagePhones.length === 0) return;
    const allSelected = stagePhones.every(p => selectedCrmPhones.has(p));

    setSelectedCrmPhones(prev => {
      const next = new Set(prev);
      if (allSelected) {
        stagePhones.forEach(p => next.delete(p));
      } else {
        stagePhones.forEach(p => next.add(p));
      }
      return next;
    });
  };

  const allFilteredSelected = crmFilteredContacts.length > 0 && crmFilteredContacts.every(c => selectedCrmPhones.has(c.phone));
  const someFilteredSelected = crmFilteredContacts.some(c => selectedCrmPhones.has(c.phone)) && !allFilteredSelected;

  // Toggle select all filtered contacts across board/table
  const handleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedCrmPhones(new Set());
    } else {
      setSelectedCrmPhones(new Set(crmFilteredContacts.map(c => c.phone)));
    }
  };

  const handleClearSelection = () => {
    setSelectedCrmPhones(new Set());
  };

  // Batch Update Stage (Kanban / Table)
  const handleBatchUpdateStage = async (stage: 'lead' | 'prospect' | 'customer' | 'churned') => {
    if (selectedCrmPhones.size === 0 || !selectedSessionId) return;
    try {
      setIsBatchProcessing(true);
      const phones = Array.from(selectedCrmPhones);
      const res = await fetch('/api/v1/contacts/batch-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, phones, stage })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'id'
            ? `Berhasil memindahkan ${data.count || phones.length} prospek ke stage ${stage.toUpperCase()}`
            : `Updated ${data.count || phones.length} leads to stage ${stage.toUpperCase()}`,
          'success'
        );
        await fetchContacts(selectedSessionId);
      } else {
        showToast(data.message || 'Gagal mengubah stage', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal batch update stage', 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Batch Save Tags (Kanban / Table)
  const handleSaveBatchTags = async () => {
    if (selectedCrmPhones.size === 0 || !selectedSessionId) return;
    const tags = batchTagInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      setIsBatchProcessing(true);
      const phones = Array.from(selectedCrmPhones);
      const res = await fetch('/api/v1/contacts/batch-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          phones,
          tags,
          mode: batchTagMode
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'id'
            ? `Berhasil memperbarui tags untuk ${phones.length} kontak!`
            : `Successfully updated tags for ${phones.length} contacts!`,
          'success'
        );
        setIsBatchTagModalOpen(false);
        setBatchTagInput('');
        await Promise.all([fetchContacts(selectedSessionId), fetchTags(selectedSessionId)]);
      } else {
        showToast(data.message || 'Gagal memperbarui tags', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal batch update tags', 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Batch Delete (Kanban / Table)
  const handleBatchDelete = async () => {
    if (selectedCrmPhones.size === 0 || !selectedSessionId) return;
    const count = selectedCrmPhones.size;
    const ok = await appConfirm(
      lang === 'id'
        ? `Apakah Anda yakin ingin menghapus ${count} kontak CRM terpilih secara permanen?`
        : `Are you sure you want to permanently delete ${count} selected CRM contacts?`,
      {
        confirmLabel: lang === 'id' ? `Hapus ${count} Kontak` : `Delete ${count} Contacts`,
        cancelLabel: lang === 'id' ? 'Batal' : 'Cancel',
        danger: true
      }
    );
    if (!ok) return;

    try {
      setIsBatchProcessing(true);
      const phones = Array.from(selectedCrmPhones);
      const res = await fetch('/api/v1/contacts/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, phones })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'id'
            ? `Berhasil menghapus ${data.count || phones.length} kontak dari CRM`
            : `Deleted ${data.count || phones.length} contacts`,
          'success'
        );
        setSelectedCrmPhones(new Set());
        await fetchContacts(selectedSessionId);
      } else {
        showToast(data.message || 'Gagal menghapus kontak', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal batch delete kontak', 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Batch Broadcast: Preload selected leads into Broadcast composer
  const handleBatchBroadcast = () => {
    if (selectedCrmPhones.size === 0) return;
    const phones = Array.from(selectedCrmPhones);
    const lines = phones
      .map(p => {
        const contact = contacts.find(c => c.phone === p);
        const name = contact?.name || contact?.push_name || '';
        return name ? `${p}, ${name}` : p;
      })
      .join('\n');
    setCampRecipientsRaw(lines);
    setCampAudienceMode('custom');
    setIsNewCampaignModal(true);
    showToast(
      lang === 'id'
        ? `${phones.length} prospek disiapkan untuk siaran broadcast massal!`
        : `${phones.length} leads loaded for mass broadcast!`,
      'success'
    );
  };

  // Floating / Sticky Bulk Action Bar for both Kanban and Table views
  const renderBulkActionBar = () => {
    if (selectedCrmPhones.size === 0) return null;
    return (
      <div className="bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md sticky top-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full">
            <Check size={13} className="stroke-[3]" />
            {selectedCrmPhones.size} {lang === 'id' ? 'Prospek Terpilih' : 'Leads Selected'}
          </span>

          {selectedCrmPhones.size < crmFilteredContacts.length ? (
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              {lang === 'id'
                ? `Pilih seluruh ${crmFilteredContacts.length} prospek hasil filter`
                : `Select all ${crmFilteredContacts.length} filtered leads`}
            </button>
          ) : (
            <span className="text-xs text-slate-500">
              {lang === 'id' ? 'Seluruh prospek terpilih' : 'All leads selected'}
            </span>
          )}
        </div>

        {/* Batch Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Change Stage */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-slate-500 font-medium">{lang === 'id' ? 'Pindah Stage:' : 'Stage:'}</span>
            <select
              disabled={isBatchProcessing}
              onChange={e => {
                if (e.target.value) {
                  handleBatchUpdateStage(e.target.value as any);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="" disabled>{lang === 'id' ? 'Pilih Stage...' : 'Select Stage...'}</option>
              <option value="lead">🔵 Lead</option>
              <option value="prospect">🟡 Prospect</option>
              <option value="customer">💰 Customer</option>
              <option value="churned">❌ Churned</option>
            </select>
          </div>

          {/* Manage Tags */}
          <button
            type="button"
            onClick={() => {
              setBatchTagInput('');
              setIsBatchTagModalOpen(true);
            }}
            disabled={isBatchProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Tag size={13} className="text-emerald-600" />
            <span>{lang === 'id' ? 'Atur Tag' : 'Manage Tags'}</span>
          </button>

          {/* Send Mass Broadcast */}
          <button
            type="button"
            onClick={handleBatchBroadcast}
            disabled={isBatchProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
            title={lang === 'id' ? 'Kirim pesan siaran massal ke semua prospek terpilih' : 'Send broadcast to selected'}
          >
            <Send size={13} />
            <span>{lang === 'id' ? 'Broadcast' : 'Broadcast'}</span>
          </button>

          {/* Batch Delete */}
          <button
            type="button"
            onClick={handleBatchDelete}
            disabled={isBatchProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors"
            title={lang === 'id' ? 'Hapus semua prospek terpilih' : 'Delete selected'}
          >
            <Trash2 size={13} />
            <span>{lang === 'id' ? 'Hapus' : 'Delete'}</span>
          </button>

          {/* Clear Selection */}
          <button
            type="button"
            onClick={handleClearSelection}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={lang === 'id' ? 'Batalkan pilihan' : 'Clear selection'}
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  };

  interface KanbanStageConfig {
    id: 'lead' | 'prospect' | 'customer' | 'churned';
    title: string;
    icon: any;
    bgHeader: string;
    badgeClass: string;
    columnBg: string;
    emptyText: string;
  }

  const kanbanStages: KanbanStageConfig[] = [
    {
      id: 'none',
      title: lang === 'id' ? 'Belum Diatur' : 'Unassigned',
      icon: Users,
      bgHeader: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800/80 dark:text-slate-200 dark:border-slate-700',
      badgeClass: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
      columnBg: 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/60',
      emptyText: lang === 'id' ? 'Semua kontak sudah masuk pipeline' : 'All contacts assigned',
    },
    {
      id: 'lead',
      title: t.crm.lead,
      icon: UserPlus,
      bgHeader: 'bg-[#e0f2fe] text-[#0369a1] border-sky-300 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800',
      badgeClass: 'bg-sky-200/90 text-[#0369a1] dark:bg-sky-900/80 dark:text-sky-200',
      columnBg: 'bg-sky-50/30 dark:bg-slate-900/40 border-sky-200/60 dark:border-sky-900/40',
      emptyText: lang === 'id' ? 'Belum ada lead baru' : 'No new leads',
    },
    {
      id: 'prospect',
      title: t.crm.prospect,
      icon: Target,
      bgHeader: 'bg-[#fef9c3] text-[#854d0e] border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
      badgeClass: 'bg-amber-200/90 text-[#854d0e] dark:bg-amber-900/80 dark:text-amber-200',
      columnBg: 'bg-amber-50/30 dark:bg-slate-900/40 border-amber-200/60 dark:border-amber-900/40',
      emptyText: lang === 'id' ? 'Belum ada prospek aktif' : 'No active prospects',
    },
    {
      id: 'customer',
      title: t.crm.customer,
      icon: CheckCircle2,
      bgHeader: 'bg-[#dcfce7] text-[#15803d] border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
      badgeClass: 'bg-emerald-200/90 text-[#15803d] dark:bg-emerald-900/80 dark:text-emerald-200',
      columnBg: 'bg-emerald-50/30 dark:bg-slate-900/40 border-emerald-200/60 dark:border-emerald-900/40',
      emptyText: lang === 'id' ? 'Belum ada closing' : 'No won deals yet',
    },
    {
      id: 'churned',
      title: t.crm.churned,
      icon: XCircle,
      bgHeader: 'bg-[#fee2e2] text-[#b91c1c] border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
      badgeClass: 'bg-rose-200/90 text-[#b91c1c] dark:bg-rose-900/80 dark:text-rose-200',
      columnBg: 'bg-rose-50/30 dark:bg-slate-900/40 border-rose-200/60 dark:border-rose-900/40',
      emptyText: lang === 'id' ? 'Tidak ada kontak lost' : 'No lost contacts',
    },
  ];

  const renderKanbanBoard = () => (
    <div className="space-y-4">
      {/* Kanban Top Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {lang === 'id' ? 'Papan Kanban Pipeline Penjualan' : 'Sales Pipeline Kanban Board'}
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
                {crmFilteredContacts.length} / {contacts.length}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {lang === 'id' ? 'Tarik & lepas (drag-and-drop) kartu prospek antar kolom untuk memperbarui stage penjualan' : 'Drag and drop lead cards between columns to update stage'}
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
              type="button"
              onClick={() => setIsAddContactModal(true)}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 flex-shrink-0"
              title={lang === 'id' ? 'Tambah Kontak / Prospek Baru' : 'Add New Contact / Lead'}
            >
              <Plus size={14} />
              <span>{lang === 'id' ? 'Tambah Kontak' : 'Add Contact'}</span>
            </button>
          </div>
        </div>

        {/* Quick Tag Filter Bar */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-1.5 mr-1">
            <span className="text-[11px] font-semibold text-slate-400">Quick Tag Filter:</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsManageTagsModal(true);
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-all cursor-pointer border border-slate-200 dark:border-slate-600 shadow-2xs"
              title="Kelola & Tambah Kategori Tag Kustom"
            >
              <Settings size={13} />
            </button>
          </div>
          {['ALL', ...crmTagList].map(t => (
            <button
              key={t}
              type="button"
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
              type="button"
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
      </div>

      {/* 5 Stage Columns Grid (Unassigned + 4 Funnel Stages) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 items-start">
        {kanbanStages.map((stage) => {
          const stageContacts = crmFilteredContacts.filter(c => (c.pipeline_stage || 'none') === stage.id);
          const stagePhones = stageContacts.map(c => c.phone);
          const isStageAllSelected = stagePhones.length > 0 && stagePhones.every(p => selectedCrmPhones.has(p));
          const isStageSomeSelected = stagePhones.some(p => selectedCrmPhones.has(p)) && !isStageAllSelected;
          const stageSelectedCount = stagePhones.filter(p => selectedCrmPhones.has(p)).length;
          const stageTotalValue = stageContacts.reduce((sum, c) => sum + (c.deal_value || 0), 0);
          const isDragTarget = dragOverStage === stage.id;
          const StageIcon = stage.icon;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverStage !== stage.id) setDragOverStage(stage.id);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                dragEnterCountRef.current[stage.id] = (dragEnterCountRef.current[stage.id] || 0) + 1;
                setDragOverStage(stage.id);
              }}
              onDragLeave={() => {
                dragEnterCountRef.current[stage.id] = Math.max(0, (dragEnterCountRef.current[stage.id] || 0) - 1);
                if (dragEnterCountRef.current[stage.id] === 0) {
                  if (dragOverStage === stage.id) setDragOverStage(null);
                }
              }}
              onDrop={async (e) => {
                e.preventDefault();
                dragEnterCountRef.current[stage.id] = 0;
                setDragOverStage(null);
                const phone = e.dataTransfer.getData('text/plain') || draggedPhone;
                if (!phone) return;

                const isMulti = selectedCrmPhones.has(phone) && selectedCrmPhones.size > 1;
                if (isMulti) {
                  await handleBatchUpdateStage(stage.id);
                } else {
                  await handleUpdateContactStage(phone, stage.id);
                }
                setDraggedPhone(null);
              }}
              className={`flex flex-col rounded-xl border transition-all duration-150 min-h-[500px] ${
                isDragTarget
                  ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/40 dark:bg-blue-950/40'
                  : stage.columnBg
              }`}
            >
              {/* Column Header with Multi-Select Toggle */}
              <div className={`p-3 rounded-t-xl border-b flex items-center justify-between ${stage.bgHeader}`}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleSelectStageContacts(stage.id, e)}
                    className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors inline-flex items-center justify-center cursor-pointer"
                    title={
                      isStageAllSelected
                        ? (lang === 'id' ? 'Batalkan pilih stage ini' : 'Deselect this stage')
                        : (lang === 'id' ? 'Pilih semua kartu di stage ini' : 'Select all cards in this stage')
                    }
                  >
                    {isStageAllSelected ? (
                      <CheckSquare size={15} className="stroke-[2.5]" />
                    ) : isStageSomeSelected ? (
                      <MinusSquare size={15} className="stroke-[2.5]" />
                    ) : (
                      <Square size={15} className="opacity-60" />
                    )}
                  </button>
                  <StageIcon size={16} className="stroke-[2.2]" />
                  <span className="font-bold text-xs">{stage.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {stageSelectedCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white leading-tight">
                      {stageSelectedCount} {lang === 'id' ? 'dipilih' : 'sel'}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${stage.badgeClass}`}>
                    {stageContacts.length}
                  </span>
                </div>
              </div>

              {/* Stage Value Metric */}
              <div className="px-3 py-1.5 bg-white/80 dark:bg-slate-800/80 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">{lang === 'id' ? 'Nilai Tahap:' : 'Stage Value:'}</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {formatRupiah(stageTotalValue)}
                </span>
              </div>

              {/* Cards Scroll Area */}
              <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[680px]">
                {stageContacts.length === 0 ? (
                  <div className={`p-8 text-center rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center min-h-[160px] ${
                    isDragTarget
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 ring-2 ring-blue-400'
                      : 'border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500'
                  }`}>
                    <StageIcon size={28} className="mb-2 opacity-50" />
                    <p className="text-xs font-bold">
                      {isDragTarget ? (lang === 'id' ? 'Lepaskan kartu di sini!' : 'Drop card here!') : (lang === 'id' ? 'Kolom Kosong' : 'Empty Column')}
                    </p>
                    <p className="text-[11px] opacity-75 mt-0.5">
                      {lang === 'id' ? 'Tarik kartu dari kolom lain ke sini' : 'Drag card from another column here'}
                    </p>
                  </div>
                ) : (
                  <>
                    {isDragTarget && (
                      <div className="p-2.5 text-center text-xs font-bold text-blue-600 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 border-2 border-dashed border-blue-400 rounded-xl animate-pulse">
                        {lang === 'id' ? `Lepaskan untuk pindah ke ${stage.title}` : `Drop here to move to ${stage.title}`}
                      </div>
                    )}
                    {stageContacts.slice(0, stageLimits[stage.id] || 40).map((c) => {
                      const cleanName = getCleanContactName(c.name, c.push_name);
                      const displayName = cleanName || formatPhoneForDisplay(c.phone) || `+${c.phone}`;
                      const isDraggingThis = draggedPhone === c.phone;
                      const isCardSelected = selectedCrmPhones.has(c.phone);

                      return (
                        <div
                          key={c.phone}
                          draggable
                          onDragStart={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
                              e.preventDefault();
                              return;
                            }
                            e.dataTransfer.setData('text/plain', c.phone);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedPhone(c.phone);
                          }}
                          onDragEnd={() => {
                            setDraggedPhone(null);
                            setDragOverStage(null);
                            dragEnterCountRef.current = {};
                          }}
                          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 120px' }}
                          className={`p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-2xs hover:shadow-xs transition-all space-y-2 cursor-grab active:cursor-grabbing ${
                            isCardSelected
                              ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20'
                              : 'border-slate-200 dark:border-slate-700'
                          } ${isDraggingThis ? 'opacity-40 scale-95 border-dashed border-blue-400' : ''}`}
                        >
                      {/* Card Header: Checkbox + Grip + Name + Phone */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => handleToggleSelectRow(c.phone, e)}
                            className="text-slate-400 hover:text-emerald-600 shrink-0 transition-colors p-0.5 rounded cursor-pointer"
                            title={isCardSelected ? (lang === 'id' ? 'Batalkan pilihan' : 'Deselect card') : (lang === 'id' ? 'Pilih kartu prospek' : 'Select lead card')}
                          >
                            {isCardSelected ? (
                              <CheckSquare size={15} className="text-emerald-600 fill-emerald-50 dark:fill-emerald-950" />
                            ) : (
                              <Square size={15} className="text-slate-300 dark:text-slate-600 hover:text-slate-500" />
                            )}
                          </button>
                          <GripVertical size={13} className="text-slate-400 hover:text-slate-600 shrink-0 cursor-grab" />
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate privacy-blur" title={displayName}>
                            {displayName}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">
                          {formatPhoneForDisplay(c.phone) || `+${c.phone}`}
                        </span>
                      </div>

                      {/* Deal Value Pill */}
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
                          <Coins size={12} className="text-amber-500 shrink-0" />
                          <span>{formatRupiah(c.deal_value || 0)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditDeal(c);
                          }}
                          className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                          title={lang === 'id' ? 'Ubah Nilai Deal' : 'Edit Deal Value'}
                        >
                          <Edit3 size={10} />
                          <span>{lang === 'id' ? 'Edit' : 'Edit'}</span>
                        </button>
                      </div>

                      {/* Tags */}
                      {c.tags && c.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {c.tags.slice(0, 3).map((tg: string) => (
                            <span
                              key={tg}
                              className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            >
                              {tg}
                            </span>
                          ))}
                          {c.tags.length > 3 && (
                            <span className="text-[9px] text-slate-400 font-semibold">
                              +{c.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Notes Preview */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedContactForNotes(c);
                          setContactNotesText(c.notes || '');
                          setIsNotesModal(true);
                        }}
                        className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50/70 dark:bg-slate-900/40 p-1.5 rounded border border-slate-100 dark:border-slate-700/50 cursor-pointer flex items-center gap-1 italic truncate"
                        title={lang === 'id' ? 'Klik untuk mengedit catatan' : 'Click to edit notes'}
                      >
                        <FileText size={11} className="shrink-0 text-slate-400" />
                        <span className="truncate">{c.notes || (lang === 'id' ? 'Tambah catatan...' : 'Add notes...')}</span>
                      </div>

                      {/* Card Footer: Quick Move Arrows & Quick Actions */}
                      <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60">
                        {/* Quick Stage Shift Buttons */}
                        <div className="flex items-center gap-1">
                          {stage.id === 'none' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateContactStage(c.phone, 'lead')}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-0.5"
                              title="Masukkan ke Lead Pipeline"
                            >
                              <span>+ Ke Lead</span>
                              <ChevronRight size={10} />
                            </button>
                          )}

                          {stage.id === 'lead' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateContactStage(c.phone, 'none')}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-0.5"
                                title="Keluarkan dari Pipeline (Belum Diatur)"
                              >
                                <ChevronLeft size={10} />
                                <span>Reset</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateContactStage(c.phone, 'prospect')}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-0.5"
                                title="Pindahkan ke Prospek"
                              >
                                <span>Prospek</span>
                                <ChevronRight size={10} />
                              </button>
                            </>
                          )}

                          {stage.id === 'prospect' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateContactStage(c.phone, 'lead')}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-0.5"
                                title="Kembalikan ke Lead"
                              >
                                <ChevronLeft size={10} />
                                <span>Lead</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateContactStage(c.phone, 'customer')}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5"
                                title="Closing / Pelanggan (Won)"
                              >
                                <span>Won</span>
                                <ChevronRight size={10} />
                              </button>
                            </>
                          )}

                          {stage.id === 'customer' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateContactStage(c.phone, 'prospect')}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-0.5"
                                title="Kembalikan ke Prospek"
                              >
                                <ChevronLeft size={10} />
                                <span>Prospek</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateContactStage(c.phone, 'churned')}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-0.5"
                                title="Tandai Churned / Lost"
                              >
                                <span>Lost</span>
                                <ChevronRight size={10} />
                              </button>
                            </>
                          )}

                          {stage.id === 'churned' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateContactStage(c.phone, 'lead')}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-0.5"
                              title="Buka Kembali sebagai Lead"
                            >
                              <ChevronLeft size={10} />
                              <span>Re-open</span>
                            </button>
                          )}
                        </div>

                        {/* Action Icon Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setNewTaskPhone(c.phone);
                              setNewTaskName(displayName);
                              setIsNewTaskModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                            title={lang === 'id' ? 'Jadwalkan Follow-up' : 'Schedule Follow-up'}
                          >
                            <Clock size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveChatJid(`${c.phone}@s.whatsapp.net`);
                              setActiveTab('chats');
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                            title={lang === 'id' ? 'Buka Percakapan Chat' : 'Open Chat'}
                          >
                            <MessageSquare size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setApplySeqContact(c);
                              setIsApplySeqModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                            title="Terapkan Sequence"
                          >
                            <Zap size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteContact(c.phone)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                            title="Hapus Kontak"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Performance Booster: Load More per Stage Column */}
                {stageContacts.length > (stageLimits[stage.id] || 40) && (
                  <button
                    type="button"
                    onClick={() => handleLoadMoreStage(stage.id)}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-slate-200 dark:border-slate-600"
                  >
                    Muat Lebih Banyak ({stageContacts.length - (stageLimits[stage.id] || 40)} tersisa)
                  </button>
                )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

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
        {/* View Mode Toggle: Kanban vs Table */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setCrmViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
              crmViewMode === 'kanban'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <LayoutGrid size={13} />
            <span>{lang === 'id' ? 'Papan Kanban' : 'Kanban Board'}</span>
          </button>
          <button
            type="button"
            onClick={() => setCrmViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
              crmViewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <List size={13} />
            <span>{lang === 'id' ? 'Tabel Prospek' : 'Table View'}</span>
          </button>
        </div>

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

    {/* 4-Tier Funnel Summary KPI Cards with Financial Deal Values */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Total Prospek Pipeline */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'id' ? 'Prospek di Pipeline' : 'Active Pipeline Leads'}</span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <Users size={18} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {contacts.filter(c => c.pipeline_stage && c.pipeline_stage !== 'none').length.toLocaleString()}
          </span>
          <span className="inline-flex items-center text-sky-600 dark:text-sky-400 text-xs font-bold gap-0.5">
            <Coins size={13} />
            {formatRupiah(totalPipelineValue)}
          </span>
        </div>
        <div className="mt-2 text-slate-400 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{lang === 'id' ? 'Potensi Nilai Pipeline Aktif' : 'Active Pipeline Potential'}</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Dari {contacts.length.toLocaleString()} kontak
          </span>
        </div>
      </div>

      {/* Card 2: Leads Baru */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'id' ? 'Leads Baru (Inbound)' : 'New Leads'}</span>
          <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <UserPlus size={18} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {contacts.filter(c => c.pipeline_stage === 'lead').length.toLocaleString()}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-[10px] font-mono font-bold">
            {formatRupiah(contacts.filter(c => c.pipeline_stage === 'lead').reduce((s, c) => s + (c.deal_value || 0), 0))}
          </span>
        </div>
        <div className="mt-2 text-slate-400 text-xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
          <span>{lang === 'id' ? 'Menunggu kualifikasi & respon' : 'Awaiting qualification'}</span>
        </div>
      </div>

      {/* Card 3: Hot Leads */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'id' ? 'Hot Leads 🔥' : 'Hot Leads 🔥'}</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Target size={18} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {contacts.filter(c => c.pipeline_stage === 'prospect').length.toLocaleString()}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-mono font-bold">
            {formatRupiah(contacts.filter(c => c.pipeline_stage === 'prospect').reduce((s, c) => s + (c.deal_value || 0), 0))}
          </span>
        </div>
        <div className="mt-2 text-slate-400 text-xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>{lang === 'id' ? 'Siap penawaran / invoice' : 'Ready for quote/invoice'}</span>
        </div>
      </div>

      {/* Card 4: Closing / Pelanggan */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'id' ? 'Closing (Won)' : 'Won (Customers)'}</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            {formatRupiah(totalWonValue)}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
            {contacts.filter(c => c.pipeline_stage === 'customer').length} Closing
          </span>
        </div>
        <div className="mt-2 text-slate-400 text-xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>{lang === 'id' ? 'Total omset penjualan closing' : 'Total sales revenue won'}</span>
        </div>
      </div>
    </div>

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
            id: 'unassigned',
            label: lang === 'id' ? 'Belum Dikategorikan' : 'Unassigned',
            count: contacts.filter(c => !c.pipeline_stage || c.pipeline_stage === 'none').length,
            icon: Users,
            activeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 shadow-sm',
            activeBadge: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200',
            iconClass: (isActive: boolean) => isActive ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500',
            hoverClass: 'hover:bg-slate-50 hover:border-slate-300 dark:hover:bg-slate-700/50'
          },
          {
            id: 'lead',
            label: t.crm.lead,
            count: contacts.filter(c => c.pipeline_stage === 'lead').length,
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

    {/* Bulk Actions Floating Bar (Visible in both Kanban & Table Views) */}
    {renderBulkActionBar()}

    {/* Kanban Board View */}
    {crmViewMode === 'kanban' && renderKanbanBoard()}

    {/* Responsive Layout for Table and Follow-up Tasks */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Contacts CRM Pipeline Table (7 cols) - rendered only in table mode */}
      {crmViewMode === 'table' && (
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
          <div className="flex items-center gap-1.5 mr-1">
            <span className="text-[11px] font-semibold text-slate-400">Quick Tag Filter:</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsManageTagsModal(true);
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-all cursor-pointer border border-slate-200 dark:border-slate-600 shadow-2xs"
              title="Kelola & Tambah Kategori Tag Kustom"
            >
              <Settings size={13} />
            </button>
          </div>
          {['ALL', ...crmTagList].map(t => (
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
                <th className="py-2.5 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="inline-flex items-center justify-center text-emerald-600 hover:opacity-80 cursor-pointer"
                    title={allFilteredSelected ? (lang === 'id' ? 'Batalkan pilihan' : 'Deselect all') : (lang === 'id' ? 'Pilih semua' : 'Select all')}
                  >
                    {allFilteredSelected ? (
                      <CheckSquare size={16} />
                    ) : someFilteredSelected ? (
                      <MinusSquare size={16} />
                    ) : (
                      <Square size={16} className="text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-2.5 px-3">{lang === 'id' ? 'KONTAK' : 'CONTACT'}</th>
                <th className="py-2.5 px-3">{lang === 'id' ? 'PIPELINE STAGE' : 'PIPELINE STAGE'}</th>
                <th className="py-2.5 px-3">{lang === 'id' ? 'NILAI DEAL' : 'DEAL VALUE'}</th>
                <th className="py-2.5 px-3">TAGS</th>
                <th className="py-2.5 px-3">{lang === 'id' ? 'CATATAN' : 'NOTES'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'id' ? 'AKSI' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {crmFilteredContacts
                .slice((tableCurrentPage - 1) * tablePageSize, tableCurrentPage * tablePageSize)
                .map(c => {
                  const stage = c.pipeline_stage || 'none';
                  const cleanName = getCleanContactName(c.name, c.push_name);
                  const displayName = cleanName || formatPhoneForDisplay(c.phone) || `+${c.phone}`;
                  const isRowSelected = selectedCrmPhones.has(c.phone);

                  return (
                    <tr key={c.id || c.phone} className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors ${isRowSelected ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''}`}>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelectRow(c.phone, e)}
                          className="inline-flex items-center justify-center text-emerald-600 cursor-pointer"
                          title={isRowSelected ? (lang === 'id' ? 'Batalkan pilihan' : 'Deselect') : (lang === 'id' ? 'Pilih prospek' : 'Select lead')}
                        >
                          {isRowSelected ? (
                            <CheckSquare size={16} />
                          ) : (
                            <Square size={16} className="text-slate-300 dark:text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                      </td>
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
                        <button
                          type="button"
                          onClick={() => handleOpenEditDeal(c)}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-mono font-bold hover:bg-amber-100 transition-colors group"
                          title={lang === 'id' ? 'Klik untuk mengubah nilai deal' : 'Click to edit deal value'}
                        >
                          <Coins size={11} className="text-amber-600" />
                          <span>{c.deal_value ? formatRupiah(c.deal_value) : 'Set Rp'}</span>
                          <Edit3 size={10} className="text-amber-500 opacity-60 group-hover:opacity-100" />
                        </button>
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
              {crmFilteredContacts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
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

        {/* Pagination Bar for Contacts Table */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="text-slate-500">
            Menampilkan {crmFilteredContacts.length === 0 ? 0 : (tableCurrentPage - 1) * tablePageSize + 1} - {Math.min(tableCurrentPage * tablePageSize, crmFilteredContacts.length)} dari {crmFilteredContacts.length} prospek
          </div>
          <div className="flex items-center gap-2">
            <select
              value={tablePageSize}
              onChange={e => {
                setTablePageSize(Number(e.target.value));
                setTableCurrentPage(1);
              }}
              className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs"
            >
              <option value={25}>25 / halaman</option>
              <option value={50}>50 / halaman</option>
              <option value={100}>100 / halaman</option>
            </select>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTableCurrentPage(p => Math.max(1, p - 1))}
                disabled={tableCurrentPage <= 1}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                title="Halaman sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-mono font-semibold">
                {tableCurrentPage} / {Math.max(1, Math.ceil(crmFilteredContacts.length / tablePageSize))}
              </span>
              <button
                type="button"
                onClick={() => setTableCurrentPage(p => Math.min(Math.ceil(crmFilteredContacts.length / tablePageSize), p + 1))}
                disabled={tableCurrentPage >= Math.ceil(crmFilteredContacts.length / tablePageSize)}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                title="Halaman berikutnya"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Right Column / Full Width: Follow-up Tasks & Sequencer Engine */}
      <div className={`${crmViewMode === 'kanban' ? 'lg:col-span-12' : 'lg:col-span-5'} space-y-4`}>
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

  {/* Modal Atur Nilai Deal (Rp) */}
  {isEditDealModal && selectedContactForDeal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Coins size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {lang === 'id' ? 'Atur Nilai Deal (Rp)' : 'Set Deal Value (Rp)'}
              </h3>
              <p className="text-xs text-slate-400">
                {selectedContactForDeal.name || selectedContactForDeal.push_name || selectedContactForDeal.phone}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditDealModal(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            {lang === 'id' ? 'Nominal Transaksi / Deal Prospek:' : 'Deal / Opportunity Amount:'}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rp</span>
            <input
              type="text"
              value={dealValueInput}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                const formatted = raw ? parseInt(raw, 10).toLocaleString('id-ID') : '';
                setDealValueInput(formatted);
              }}
              placeholder="0"
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Quick Amount Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Preset:</span>
            {[500000, 1000000, 2500000, 5000000, 10000000, 25000000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDealValueInput(preset.toLocaleString('id-ID'))}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-mono font-semibold transition-colors"
              >
                {(preset / 1000000) >= 1 ? `${preset / 1000000} Jt` : `${preset / 1000} Rb`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setIsEditDealModal(false)}
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleSaveDeal}
            className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>{lang === 'id' ? 'Simpan Nilai Deal' : 'Save Deal Value'}</span>
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Batch Tag Modal for CRM Leads */}
  {isBatchTagModalOpen && (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {lang === 'id'
                ? `Atur Group / Tag (${selectedCrmPhones.size} Prospek Terpilih)`
                : `Manage Tags (${selectedCrmPhones.size} Selected Leads)`}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsBatchTagModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Mode Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              {lang === 'id' ? 'Metode Penerapan Tag:' : 'Tagging Mode:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBatchTagMode('add')}
                className={`p-2 rounded-xl text-left border text-xs transition-all ${
                  batchTagMode === 'add'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-bold mb-0.5">{lang === 'id' ? '➕ Tambahkan Tag' : '➕ Add Tags'}</div>
                <div className="text-[10px] text-slate-400">
                  {lang === 'id' ? 'Pertahankan tag yang sudah ada' : 'Keep existing tags'}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setBatchTagMode('replace')}
                className={`p-2 rounded-xl text-left border text-xs transition-all ${
                  batchTagMode === 'replace'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="font-bold mb-0.5">{lang === 'id' ? '🔄 Ganti Semua Tag' : '🔄 Replace Tags'}</div>
                <div className="text-[10px] text-slate-400">
                  {lang === 'id' ? 'Hapus tag lama, pasang tag baru' : 'Overwrite old tags'}
                </div>
              </button>
            </div>
          </div>

          {/* Tag text input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              {lang === 'id' ? 'Nama Tag / Group (Pisahkan koma):' : 'Tags (Comma separated):'}
            </label>
            <input
              type="text"
              placeholder={lang === 'id' ? 'Contoh: VIP, Hot Lead, Promo 2026' : 'e.g. VIP, Hot Lead'}
              value={batchTagInput}
              onChange={e => setBatchTagInput(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Quick Tag suggestions */}
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
              {lang === 'id' ? 'Pilih Cepat dari Tag Tersedia:' : 'Quick Select:'}
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {availableTags.map(t => {
                const currentList = batchTagInput.split(',').map(s => s.trim()).filter(Boolean);
                const isIncluded = currentList.includes(t.tag);
                return (
                  <button
                    key={t.tag}
                    type="button"
                    onClick={() => {
                      if (isIncluded) {
                        setBatchTagInput(currentList.filter(x => x !== t.tag).join(', '));
                      } else {
                        setBatchTagInput([...currentList, t.tag].join(', '));
                      }
                    }}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium transition-colors ${
                      isIncluded
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isIncluded ? '✓ ' : '+ '}
                    {t.tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsBatchTagModalOpen(false)}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              {lang === 'id' ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSaveBatchTags}
              disabled={isBatchProcessing || !batchTagInput.trim()}
              className="btn-primary py-1.5 px-4 text-xs disabled:opacity-50"
            >
              {isBatchProcessing ? (lang === 'id' ? 'Menyimpan...' : 'Saving...') : (lang === 'id' ? 'Simpan Tag' : 'Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* Modal: Kelola Kategori & Tag Kustom */}
  {isManageTagsModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              {lang === 'id' ? 'Kelola Kategori Tag & Filter' : 'Manage Tag Categories & Filters'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsManageTagsModal(false);
              setEditingTagOriginal(null);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Form Tambah Tag */}
          <form onSubmit={handleAddTag} className="flex gap-2">
            <input
              type="text"
              placeholder={lang === 'id' ? 'Nama tag baru (misal: 💎 VIP Member)...' : 'New tag name...'}
              value={newTagInput}
              onChange={e => setNewTagInput(e.target.value)}
              className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!newTagInput.trim()}
              className="btn-primary text-xs px-3 py-2 flex items-center gap-1 disabled:opacity-50"
            >
              <Plus size={14} />
              <span>{lang === 'id' ? 'Tambah' : 'Add'}</span>
            </button>
          </form>

          {/* List Tag Aktif */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {crmTagList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Belum ada tag kustom</p>
            ) : (
              crmTagList.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 text-xs"
                >
                  {editingTagOriginal === tag ? (
                    <div className="flex items-center gap-1.5 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingTagInput}
                        onChange={e => setEditingTagInput(e.target.value)}
                        className="flex-1 text-xs px-2 py-1 border border-emerald-400 rounded bg-white dark:bg-slate-800 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleEditTag(tag, editingTagInput)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Simpan"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTagOriginal(null)}
                        className="p-1 text-slate-400 hover:bg-slate-200 rounded"
                        title="Batal"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{tag}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTagOriginal(tag);
                            setEditingTagInput(tag);
                          }}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
                          title="Ubah nama"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTag(tag)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Hapus tag"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={() => {
              saveCrmTagList(DEFAULT_TAG_LIST);
              showToast('Tag dikembalikan ke default', 'info');
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline text-[11px]"
          >
            Reset ke Default
          </button>
          <button
            type="button"
            onClick={() => {
              setIsManageTagsModal(false);
              setEditingTagOriginal(null);
            }}
            className="btn-secondary py-1 px-3 text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )}
    </>
  );
};

export default CrmPanel;
