import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Target,
  XCircle,
  Search,
  Filter,
  Tag,
  RefreshCw,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit3,
  MessageSquare,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  CheckSquare,
  Square,
  MinusSquare,
  Smartphone,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from 'lucide-react';
import { ChatAvatar } from '../components/chat';
import { formatPhoneForDisplay, isLidNumber, getCleanContactName, isPhoneLike } from '../utils/format';
import { PanelCtx } from './ctx';
import type { Contact } from '../types';

type SortColumn = 'phone' | 'name' | 'stage' | 'status' | 'created';
type SortDirection = 'asc' | 'desc';

const ContactsPanel: React.FC<{ ctx: PanelCtx }> = ({ ctx }) => {
  const {
    t,
    lang,
    showToast,
    appConfirm,
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    contacts,
    fetchContacts,
    fetchChats,
    fetchTags,
    availableTags,
    selectedTagFilter,
    setSelectedTagFilter,
    contactSearchQuery,
    setContactSearchQuery,
    setActiveTab,
    setIsAddContactModal,
    openEditTagsModal,
    handleToggleOptOut,
    handleDeleteContact,
    handleUpdateContactStage,
    handleOpenChatWithContact,
    setSelectedContactForNotes,
    setContactNotesText,
    setIsNotesModal
  } = ctx;

  // Local state for interactive features
  const [isExportingContacts, setIsExportingContacts] = useState(false);
  const [isSyncingContacts, setIsSyncingContacts] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

  // Advanced Filters
  const [stageFilter, setStageFilter] = useState<'ALL' | 'lead' | 'prospect' | 'customer' | 'churned'>('ALL');
  const [optOutFilter, setOptOutFilter] = useState<'ALL' | 'active' | 'opt_out'>('ALL');
  const [namedFilter, setNamedFilter] = useState<'named' | 'all'>('named');
  const [isCleaningUnnamed, setIsCleaningUnnamed] = useState(false);

  // Multi-Selection State
  const [selectedPhones, setSelectedPhones] = useState<Set<string>>(new Set());

  // Sorting & Pagination
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Batch Tagging Modal State
  const [isBatchTagModalOpen, setIsBatchTagModalOpen] = useState(false);
  const [batchTagMode, setBatchTagMode] = useState<'add' | 'replace'>('add');
  const [batchTagInput, setBatchTagInput] = useState('');
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Ultra-responsive debounced search: typing is 0ms instant
  const [searchDraft, setSearchDraft] = useState(contactSearchQuery);
  useEffect(() => {
    setSearchDraft(contactSearchQuery);
  }, [contactSearchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchDraft !== contactSearchQuery) {
        setContactSearchQuery(searchDraft);
      }
    }, 150);
    return () => clearTimeout(handler);
  }, [searchDraft, contactSearchQuery, setContactSearchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [contactSearchQuery, selectedTagFilter, stageFilter, optOutFilter, namedFilter, pageSize, selectedSessionId]);

  // Clean selection if session changes
  useEffect(() => {
    setSelectedPhones(new Set());
  }, [selectedSessionId]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const total = contacts.length;
    const optInActive = contacts.filter(c => !c.opt_out).length;
    const crmLeads = contacts.filter(c => c.pipeline_stage === 'customer' || c.pipeline_stage === 'prospect').length;
    const optOut = contacts.filter(c => c.opt_out).length;

    const optInPercent = total > 0 ? Math.round((optInActive / total) * 100) : 0;
    const crmPercent = total > 0 ? Math.round((crmLeads / total) * 100) : 0;
    const optOutPercent = total > 0 ? Math.round((optOut / total) * 100) : 0;

    return {
      total,
      optInActive,
      optInPercent,
      crmLeads,
      crmPercent,
      optOut,
      optOutPercent
    };
  }, [contacts]);

  // Filtered & Sorted Contacts
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // Filter by Tag
    if (selectedTagFilter !== 'ALL') {
      result = result.filter(c => c.tags && c.tags.includes(selectedTagFilter));
    }

    // Filter by Stage
    if (stageFilter !== 'ALL') {
      result = result.filter(c => (c.pipeline_stage || 'lead') === stageFilter);
    }

    // Filter by Opt-Out
    if (optOutFilter === 'active') {
      result = result.filter(c => !c.opt_out);
    } else if (optOutFilter === 'opt_out') {
      result = result.filter(c => Boolean(c.opt_out));
    }

    // Filter by Named Status (default: hide nameless bot/strangers)
    if (namedFilter === 'named' && !contactSearchQuery.trim()) {
      result = result.filter(c => {
        const name = (c.name || '').trim();
        const push = (c.push_name || '').trim();
        const hasName = Boolean(name && name !== '-' && name !== '—');
        const hasPush = Boolean(push && push !== '-' && push !== '—');
        const hasMetadata = (c.tags && c.tags.length > 0) || Boolean(c.notes) || (c.deal_value !== undefined && c.deal_value !== null);
        return hasName || hasPush || hasMetadata;
      });
    }

    // Filter by Search Query
    if (contactSearchQuery.trim()) {
      const q = contactSearchQuery.toLowerCase().trim();
      result = result.filter(c => {
        const phone = (c.phone || '').toLowerCase();
        const name = (c.name || '').toLowerCase();
        const pushName = (c.push_name || '').toLowerCase();
        const tags = (c.tags || []).join(' ').toLowerCase();
        const notes = (c.notes || '').toLowerCase();
        return phone.includes(q) || name.includes(q) || pushName.includes(q) || tags.includes(q) || notes.includes(q);
      });
    }

    // Sort
    result.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortColumn === 'phone') {
        valA = a.phone || '';
        valB = b.phone || '';
      } else if (sortColumn === 'name') {
        const nameA = a.name || a.push_name || '';
        const nameB = b.name || b.push_name || '';
        if (!nameA && nameB) return 1;
        if (nameA && !nameB) return -1;
        valA = nameA.toLowerCase();
        valB = nameB.toLowerCase();
      } else if (sortColumn === 'stage') {
        valA = a.pipeline_stage || 'lead';
        valB = b.pipeline_stage || 'lead';
      } else if (sortColumn === 'status') {
        valA = a.opt_out ? 1 : 0;
        valB = b.opt_out ? 1 : 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [contacts, selectedTagFilter, stageFilter, optOutFilter, contactSearchQuery, sortColumn, sortDirection]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedContacts = filteredContacts.slice(startIndex, startIndex + pageSize);

  // Selection Logic
  const allCurrentPageSelected = paginatedContacts.length > 0 && paginatedContacts.every(c => selectedPhones.has(c.phone));
  const someCurrentPageSelected = paginatedContacts.some(c => selectedPhones.has(c.phone)) && !allCurrentPageSelected;

  const handleToggleSelectAllCurrentPage = () => {
    const next = new Set(selectedPhones);
    if (allCurrentPageSelected) {
      paginatedContacts.forEach(c => next.delete(c.phone));
    } else {
      paginatedContacts.forEach(c => next.add(c.phone));
    }
    setSelectedPhones(next);
  };

  const handleSelectAllFiltered = () => {
    const next = new Set<string>();
    filteredContacts.forEach(c => next.add(c.phone));
    setSelectedPhones(next);
    showToast(
      lang === 'id'
        ? `Memilih seluruh ${filteredContacts.length} kontak hasil filter`
        : `Selected all ${filteredContacts.length} filtered contacts`,
      'info'
    );
  };

  const handleClearSelection = () => {
    setSelectedPhones(new Set());
  };

  const handleToggleSelectRow = (phone: string) => {
    const next = new Set(selectedPhones);
    if (next.has(phone)) {
      next.delete(phone);
    } else {
      next.add(phone);
    }
    setSelectedPhones(next);
  };

  // Sorting click handler
  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // Sync contacts from WA
  const handleSyncContacts = async () => {
    if (!selectedSessionId) {
      showToast(lang === 'id' ? 'Silakan pilih sesi WhatsApp terlebih dahulu' : 'Please select a WhatsApp session first', 'warn');
      return;
    }
    try {
      setIsSyncingContacts(true);
      const res = await fetch('/api/v1/contacts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'id'
            ? `Berhasil sinkronisasi ${data.count || 0} kontak dari WhatsApp`
            : `Successfully synchronized ${data.count || 0} contacts from WhatsApp`,
          'success'
        );
        await Promise.all([fetchContacts(selectedSessionId), fetchChats(selectedSessionId), fetchTags(selectedSessionId)]);
      } else {
        showToast(data.message || 'Gagal sinkronisasi kontak', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat sinkronisasi kontak', 'error');
    } finally {
      setIsSyncingContacts(false);
    }
  };

  // Export to Excel
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
      showToast(lang === 'id' ? 'Berhasil mengunduh Excel direktori kontak!' : 'Successfully downloaded contacts Excel!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal export kontak', 'error');
    } finally {
      setIsExportingContacts(false);
    }
  };

  // Clean bot / unnamed contacts
  const handleCleanUnnamed = async () => {
    if (!selectedSessionId) {
      showToast(lang === 'id' ? 'Silakan pilih sesi WhatsApp terlebih dahulu' : 'Please select a WhatsApp session first', 'warn');
      return;
    }

    const ok = await appConfirm(
      lang === 'id'
        ? 'Apakah Anda yakin ingin menghapus semua nomor bot, OTP, dan kontak tanpa nama dari database?'
        : 'Are you sure you want to remove all bot numbers, OTP, and unnamed contacts from database?',
      {
        danger: true,
        confirmLabel: lang === 'id' ? 'Ya, Bersihkan' : 'Yes, Clean'
      }
    );
    if (!ok) return;

    try {
      setIsCleaningUnnamed(true);
      const res = await fetch('/api/v1/contacts/clean-unnamed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'id'
            ? `Berhasil membersihkan ${data.count || 0} kontak tanpa nama/bot!`
            : `Successfully cleaned ${data.count || 0} unnamed/bot contacts!`,
          'success'
        );
        await Promise.all([fetchContacts(selectedSessionId), fetchTags(selectedSessionId)]);
      } else {
        showToast(data.message || 'Gagal membersihkan kontak', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal membersihkan kontak', 'error');
    } finally {
      setIsCleaningUnnamed(false);
    }
  };

  // Download Excel Template
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const res = await fetch('/api/v1/contacts/template');
      if (!res.ok) throw new Error('Gagal mengunduh template Excel');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'template_import_kontak.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
      showToast(lang === 'id' ? 'Berhasil mengunduh template Excel kontak' : 'Successfully downloaded contact Excel template', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunduh template', 'error');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Import Contacts
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSessionId) return;

    try {
      setIsImporting(true);
      const fd = new FormData();
      fd.append('sessionId', selectedSessionId);
      fd.append('file', file);

      const res = await fetch('/api/v1/contacts/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'id'
            ? `Berhasil mengimpor ${data.count || 0} kontak ke direktori!`
            : `Successfully imported ${data.count || 0} contacts!`,
          'success'
        );
        await Promise.all([fetchContacts(selectedSessionId), fetchTags(selectedSessionId)]);
      } else {
        showToast(data.message || 'Import kontak gagal', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat mengunggah file', 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Batch Stage Update
  const handleBatchUpdateStage = async (stage: 'lead' | 'prospect' | 'customer' | 'churned') => {
    if (selectedPhones.size === 0 || !selectedSessionId) return;
    try {
      setIsBatchProcessing(true);
      const phones = Array.from(selectedPhones);
      const res = await fetch('/api/v1/contacts/batch-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, phones, stage })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'id'
            ? `Berhasil memperbarui ${data.count || phones.length} kontak ke stage ${stage.toUpperCase()}`
            : `Updated ${data.count || phones.length} contacts to ${stage.toUpperCase()}`,
          'success'
        );
        fetchContacts(selectedSessionId);
      } else {
        showToast(data.message || 'Gagal update stage', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal update batch stage', 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Batch Opt-Out Toggle
  const handleBatchToggleOptOut = async (optOut: boolean) => {
    if (selectedPhones.size === 0 || !selectedSessionId) return;
    try {
      setIsBatchProcessing(true);
      const phones = Array.from(selectedPhones);
      const res = await fetch('/api/v1/contacts/batch-opt-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, phones, optOut })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'id'
            ? `Status ${phones.length} kontak diubah menjadi ${optOut ? 'Opt-Out' : 'Opt-In Aktif'}`
            : `Updated ${phones.length} contacts to ${optOut ? 'Opt-Out' : 'Opt-In Active'}`,
          'success'
        );
        fetchContacts(selectedSessionId);
      } else {
        showToast(data.message || 'Gagal update opt-out', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal batch update opt-out', 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    if (selectedPhones.size === 0 || !selectedSessionId) return;
    const count = selectedPhones.size;
    const ok = await appConfirm(
      lang === 'id'
        ? `Apakah Anda yakin ingin menghapus ${count} kontak yang dipilih secara permanen?`
        : `Are you sure you want to permanently delete ${count} selected contacts?`,
      {
        confirmLabel: lang === 'id' ? `Hapus ${count} Kontak` : `Delete ${count} Contacts`,
        cancelLabel: lang === 'id' ? 'Batal' : 'Cancel',
        danger: true
      }
    );

    if (!ok) return;

    try {
      setIsBatchProcessing(true);
      const phones = Array.from(selectedPhones);
      const res = await fetch('/api/v1/contacts/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId, phones })
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'id'
            ? `Berhasil menghapus ${data.count || phones.length} kontak`
            : `Deleted ${data.count || phones.length} contacts`,
          'success'
        );
        setSelectedPhones(new Set());
        await Promise.all([fetchContacts(selectedSessionId), fetchTags(selectedSessionId)]);
      } else {
        showToast(data.message || 'Gagal menghapus kontak', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal batch delete kontak', 'error');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Batch Save Tags
  const handleSaveBatchTags = async () => {
    if (selectedPhones.size === 0 || !selectedSessionId) return;
    const tags = batchTagInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      setIsBatchProcessing(true);
      const phones = Array.from(selectedPhones);
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
            ? `Berhasil memperbarui group untuk ${phones.length} kontak!`
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

  const handleResetFilters = () => {
    setContactSearchQuery('');
    setSelectedTagFilter('ALL');
    setStageFilter('ALL');
    setOptOutFilter('ALL');
    setNamedFilter('named');
  };

  const hasActiveFilters =
    Boolean(contactSearchQuery.trim()) ||
    selectedTagFilter !== 'ALL' ||
    stageFilter !== 'ALL' ||
    optOutFilter !== 'ALL' ||
    namedFilter !== 'named';

  return (
    <>
      <div className="contacts-page space-y-5 bg-[#f8fafc] text-[#0f172a] min-h-screen">
        {/* ========================================================= */}
        {/* 1. INDUSTRIAL KPI SUMMARY CARDS (OFALabs Minimalist Style) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Total Kontak Card */}
          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-4 flex flex-col justify-between transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                {lang === 'id' ? 'Total Direktori' : 'Total Directory'}
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-[#f1f5f9] flex items-center justify-center text-[#059669]">
                <Users size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-[#0f172a]">
                {metrics.total.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-[#64748b]">
                <span>{lang === 'id' ? 'Kontak terdata' : 'Saved contacts'}</span>
                <span className="bg-[#f1f5f9] text-[#475569] font-medium px-2 py-0.5 rounded-[9999px]">
                  100%
                </span>
              </div>
            </div>
          </div>

          {/* Siap Broadcast (Opt-In Aktif) Card */}
          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-4 flex flex-col justify-between transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                {lang === 'id' ? 'Siap Blast (Opt-In)' : 'Blast Ready (Opt-In)'}
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-[#dcfce7] flex items-center justify-center text-[#15803d]">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-[#0f172a]">
                {metrics.optInActive.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-[#64748b]">
                <span>{lang === 'id' ? 'Aktif menerima pesan' : 'Active receivers'}</span>
                <span className="bg-[#dcfce7] text-[#15803d] font-semibold px-2 py-0.5 rounded-[9999px]">
                  {metrics.optInPercent}% Aktif
                </span>
              </div>
            </div>
          </div>

          {/* Prospek & Pelanggan (CRM) Card */}
          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-4 flex flex-col justify-between transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                {lang === 'id' ? 'Pipeline CRM' : 'CRM Pipeline'}
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-[#d1fae5] flex items-center justify-center text-[#065f46]">
                <Target size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-[#0f172a]">
                {metrics.crmLeads.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-[#64748b]">
                <span>{lang === 'id' ? 'Customer & Prospek' : 'Customer & Prospects'}</span>
                <span className="bg-[#d1fae5] text-[#065f46] font-semibold px-2 py-0.5 rounded-[9999px]">
                  {metrics.crmPercent}% Lead
                </span>
              </div>
            </div>
          </div>

          {/* Opt-Out / Blokir Card */}
          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-4 flex flex-col justify-between transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                {lang === 'id' ? 'Dikecualikan (Opt-Out)' : 'Excluded (Opt-Out)'}
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-[#fee2e2] flex items-center justify-center text-[#b91c1c]">
                <XCircle size={16} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-[#0f172a]">
                {metrics.optOut.toLocaleString()}
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-[#64748b]">
                <span>{lang === 'id' ? 'Dilewati saat blast' : 'Skipped in blast'}</span>
                <span className="bg-[#fee2e2] text-[#b91c1c] font-semibold px-2 py-0.5 rounded-[9999px]">
                  {metrics.optOutPercent}% Blokir
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. PAGE HEADER & MAIN ACTION TOOLBAR                     */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#e2e8f0] rounded-[14px] p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-[#0f172a] tracking-tight">
                  {lang === 'id' ? 'Manajemen Direktori Kontak' : 'Contact Directory Management'}
                </h1>
                <span className="bg-[#f1f5f9] text-[#475569] text-xs font-semibold px-2.5 py-0.5 rounded-[9999px] border border-[#e2e8f0]">
                  {filteredContacts.length} {lang === 'id' ? 'Kontak' : 'Contacts'}
                </span>
              </div>
              <p className="text-xs text-[#64748b] mt-1">
                {lang === 'id'
                  ? 'Kelola basis data kontak, klasifikasi segmentasi grup/tag, status opt-out, dan alur CRM per sesi WhatsApp.'
                  : 'Manage contact records, group segmentation tags, opt-out status, and CRM stages per WhatsApp session.'}
              </p>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* WhatsApp Session Selector */}
              <div className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-2.5 py-1.5">
                <Smartphone size={14} className="text-[#64748b]" />
                <select
                  value={selectedSessionId}
                  onChange={e => setSelectedSessionId(e.target.value)}
                  className="bg-transparent text-xs font-medium text-[#0f172a] focus:outline-none cursor-pointer"
                  title={lang === 'id' ? 'Pilih Sesi WhatsApp' : 'Select WhatsApp Session'}
                >
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sync from WhatsApp */}
              <button
                type="button"
                onClick={handleSyncContacts}
                disabled={isSyncingContacts}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-[#0f172a] border border-[#e2e8f0] rounded-[8px] hover:bg-[#f8fafc] transition-colors disabled:opacity-60"
                title={lang === 'id' ? 'Sinkronisasi kontak dari pesan & grup sesi ini' : 'Sync contacts from WA messages and groups'}
              >
                <RefreshCw size={13} className={isSyncingContacts ? 'animate-spin text-[#059669]' : 'text-[#64748b]'} />
                <span>{isSyncingContacts ? (lang === 'id' ? 'Menyinkron...' : 'Syncing...') : (lang === 'id' ? 'Sinkron WA' : 'Sync WA')}</span>
              </button>

              {/* Extract from Groups */}
              <button
                type="button"
                onClick={() => setActiveTab('groups')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-[#0f172a] border border-[#e2e8f0] rounded-[8px] hover:bg-[#f8fafc] transition-colors"
                title={lang === 'id' ? 'Buka tab Grup untuk mengekstrak anggota' : 'Open Groups tab to extract members'}
              >
                <Layers size={13} className="text-[#64748b]" />
                <span>{lang === 'id' ? 'Ekstrak Grup' : 'Extract Group'}</span>
              </button>

              {/* Download Template Excel */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={isDownloadingTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-[#0f172a] border border-[#e2e8f0] rounded-[8px] hover:bg-[#f8fafc] transition-colors"
                title={lang === 'id' ? 'Unduh format template Excel untuk import data kontak' : 'Download sample Excel template for importing contacts'}
              >
                <FileSpreadsheet size={13} className="text-[#065f46]" />
                <span>{lang === 'id' ? 'Unduh Template' : 'Template'}</span>
              </button>

              {/* Import Excel */}
              <label
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-[#0f172a] border border-[#e2e8f0] rounded-[8px] hover:bg-[#f8fafc] transition-colors cursor-pointer ${
                  isImporting ? 'opacity-60 pointer-events-none' : ''
                }`}
                title={lang === 'id' ? 'Import kontak dari file Excel (.xlsx) atau CSV' : 'Import contacts from Excel/CSV file'}
              >
                <Upload size={13} className={isImporting ? 'animate-bounce text-[#059669]' : 'text-[#64748b]'} />
                <span>{isImporting ? (lang === 'id' ? 'Mengimpor...' : 'Importing...') : (lang === 'id' ? 'Import Excel' : 'Import')}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isImporting}
                />
              </label>

              {/* Export Excel */}
              <button
                type="button"
                onClick={handleExportContactsExcel}
                disabled={isExportingContacts}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-[#0f172a] border border-[#e2e8f0] rounded-[8px] hover:bg-[#f8fafc] transition-colors disabled:opacity-60"
                title={lang === 'id' ? 'Export direktori kontak ke file Excel' : 'Export contact directory to Excel'}
              >
                {isExportingContacts ? (
                  <RefreshCw size={13} className="animate-spin text-[#059669]" />
                ) : (
                  <Download size={13} className="text-[#64748b]" />
                )}
                <span>{isExportingContacts ? (lang === 'id' ? 'Mengekspor...' : 'Exporting...') : (lang === 'id' ? 'Ekspor Excel' : 'Export')}</span>
              </button>

              {/* Clean Bot / Unnamed Contacts */}
              <button
                type="button"
                onClick={handleCleanUnnamed}
                disabled={isCleaningUnnamed}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-[#b91c1c] border border-[#fecaca] rounded-[8px] hover:bg-[#fef2f2] transition-colors disabled:opacity-60"
                title={lang === 'id' ? 'Hapus semua kontak bot/tanpa nama dari database CRM' : 'Purge all bot/unnamed contacts from CRM'}
              >
                <Trash2 size={13} className={isCleaningUnnamed ? 'animate-spin text-[#b91c1c]' : 'text-[#b91c1c]'} />
                <span>{isCleaningUnnamed ? (lang === 'id' ? 'Membersihkan...' : 'Cleaning...') : (lang === 'id' ? 'Bersihkan Bot' : 'Clean Bots')}</span>
              </button>

              {/* Add Single Contact Modal */}
              <button
                type="button"
                onClick={() => setIsAddContactModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#059669] text-white rounded-[8px] hover:bg-[#047857] transition-colors shadow-none"
              >
                <Plus size={14} />
                <span>{lang === 'id' ? 'Tambah Kontak' : 'Add Contact'}</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. MULTI-FILTER & SEARCH BAR                             */}
          {/* ========================================================= */}
          <div className="mt-4 pt-3.5 border-t border-[#f1f5f9] flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                placeholder={lang === 'id' ? 'Cari nama, nomor HP, group, catatan...' : 'Search name, phone, tags, notes...'}
                value={searchDraft}
                onChange={e => setSearchDraft(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-[8px] text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#059669]"
              />
              {searchDraft && (
                <button
                  type="button"
                  onClick={() => { setSearchDraft(''); setContactSearchQuery(''); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a]"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter by Group/Tags */}
              <div className="flex items-center gap-1 bg-white border border-[#e2e8f0] rounded-[8px] px-2.5 py-1 text-xs">
                <Tag size={12} className="text-[#64748b]" />
                <select
                  value={selectedTagFilter}
                  onChange={e => setSelectedTagFilter(e.target.value)}
                  className="bg-transparent text-xs text-[#0f172a] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{lang === 'id' ? 'Semua Group' : 'All Groups'} ({contacts.length})</option>
                  {availableTags.map(t => (
                    <option key={t.tag} value={t.tag}>
                      {t.tag} ({t.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Pipeline Stage */}
              <div className="flex items-center gap-1 bg-white border border-[#e2e8f0] rounded-[8px] px-2.5 py-1 text-xs">
                <Filter size={12} className="text-[#64748b]" />
                <select
                  value={stageFilter}
                  onChange={e => setStageFilter(e.target.value as any)}
                  className="bg-transparent text-xs text-[#0f172a] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{lang === 'id' ? 'Semua Stage' : 'All Stages'}</option>
                  <option value="lead">🔵 {t.crm.lead}</option>
                  <option value="prospect">🟡 {t.crm.prospect}</option>
                  <option value="customer">💰 {t.crm.customer}</option>
                  <option value="churned">❌ {t.crm.churned}</option>
                </select>
              </div>

              {/* Filter by Opt-Out Status */}
              <div className="flex items-center gap-1 bg-white border border-[#e2e8f0] rounded-[8px] px-2.5 py-1 text-xs">
                <select
                  value={optOutFilter}
                  onChange={e => setOptOutFilter(e.target.value as any)}
                  className="bg-transparent text-xs text-[#0f172a] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{lang === 'id' ? 'Semua Status Opt-Out' : 'All Status'}</option>
                  <option value="active">{lang === 'id' ? 'Hanya Opt-In Aktif' : 'Opt-In Active Only'}</option>
                  <option value="opt_out">{lang === 'id' ? 'Hanya Opt-Out (Blokir)' : 'Opt-Out Only'}</option>
                </select>
              </div>

              {/* Filter by Named Only */}
              <div className="flex items-center gap-1 bg-white border border-[#e2e8f0] rounded-[8px] px-2.5 py-1 text-xs">
                <select
                  value={namedFilter}
                  onChange={e => setNamedFilter(e.target.value as any)}
                  className="bg-transparent text-xs text-[#0f172a] focus:outline-none cursor-pointer"
                >
                  <option value="named">{lang === 'id' ? 'Hanya Kontak Bernama' : 'Named Contacts Only'}</option>
                  <option value="all">{lang === 'id' ? 'Semua Kontak (Termasuk Tanpa Nama)' : 'All Contacts'}</option>
                </select>
              </div>

              {/* Page Size Selector */}
              <div className="flex items-center gap-1 bg-white border border-[#e2e8f0] rounded-[8px] px-2.5 py-1 text-xs">
                <span className="text-[#64748b]">{lang === 'id' ? 'Baris:' : 'Rows:'}</span>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold text-[#0f172a] focus:outline-none cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </div>

              {/* Reset Filter Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#b91c1c] bg-[#fee2e2] rounded-[8px] hover:bg-[#fecaca] transition-colors font-medium"
                  title={lang === 'id' ? 'Reset semua filter pencarian' : 'Reset all search filters'}
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. BULK ACTION FLOATING/STICKY BAR                       */}
        {/* ========================================================= */}
        {selectedPhones.size > 0 && (
          <div className="bg-white border-2 border-[#059669] rounded-[10px] p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] bg-[#d1fae5] px-2.5 py-1 rounded-[9999px]">
                <Check size={13} className="stroke-[3]" />
                {selectedPhones.size} {lang === 'id' ? 'Kontak Terpilih' : 'Contacts Selected'}
              </span>

              {selectedPhones.size < filteredContacts.length ? (
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-xs text-[#059669] hover:underline font-semibold"
                >
                  {lang === 'id'
                    ? `Pilih seluruh ${filteredContacts.length} kontak hasil filter`
                    : `Select all ${filteredContacts.length} filtered contacts`}
                </button>
              ) : (
                <span className="text-xs text-[#64748b]">
                  {lang === 'id' ? 'Seluruh kontak terpilih' : 'All contacts selected'}
                </span>
              )}
            </div>

            {/* Batch Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Batch Change Stage */}
              <div className="flex items-center gap-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-2 py-1 text-xs">
                <span className="text-[#64748b] font-medium">{lang === 'id' ? 'Ubah Stage:' : 'Stage:'}</span>
                <select
                  disabled={isBatchProcessing}
                  onChange={e => {
                    if (e.target.value) {
                      handleBatchUpdateStage(e.target.value as any);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="bg-transparent text-xs font-semibold text-[#0f172a] focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>{lang === 'id' ? 'Pilih Stage...' : 'Select Stage...'}</option>
                  <option value="lead">🔵 Lead</option>
                  <option value="prospect">🟡 Prospect</option>
                  <option value="customer">💰 Customer</option>
                  <option value="churned">❌ Churned</option>
                </select>
              </div>

              {/* Batch Manage Groups */}
              <button
                type="button"
                onClick={() => {
                  setBatchTagInput('');
                  setIsBatchTagModalOpen(true);
                }}
                disabled={isBatchProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] rounded-[8px] hover:bg-[#f1f5f9] transition-colors"
              >
                <Tag size={13} className="text-[#059669]" />
                <span>{lang === 'id' ? 'Atur Group' : 'Manage Groups'}</span>
              </button>

              {/* Batch Set Opt-In */}
              <button
                type="button"
                onClick={() => handleBatchToggleOptOut(false)}
                disabled={isBatchProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0] rounded-[8px] hover:bg-[#bbf7d0] transition-colors"
                title={lang === 'id' ? 'Setujui penerimaan pesan untuk semua kontak yang dipilih' : 'Set opt-in active'}
              >
                <CheckCircle2 size={13} />
                <span>{lang === 'id' ? 'Set Opt-In' : 'Set Opt-In'}</span>
              </button>

              {/* Batch Set Opt-Out */}
              <button
                type="button"
                onClick={() => handleBatchToggleOptOut(true)}
                disabled={isBatchProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca] rounded-[8px] hover:bg-[#fecaca] transition-colors"
                title={lang === 'id' ? 'Kecualikan dari broadcast untuk semua kontak yang dipilih' : 'Set opt-out blocked'}
              >
                <XCircle size={13} />
                <span>{lang === 'id' ? 'Set Opt-Out' : 'Set Opt-Out'}</span>
              </button>

              {/* Batch Delete */}
              <button
                type="button"
                onClick={handleBatchDelete}
                disabled={isBatchProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5] rounded-[8px] hover:bg-[#b91c1c] hover:text-white transition-colors"
                title={lang === 'id' ? 'Hapus semua kontak terpilih secara permanen' : 'Delete all selected contacts'}
              >
                <Trash2 size={13} />
                <span>{lang === 'id' ? 'Hapus' : 'Delete'}</span>
              </button>

              {/* Cancel Selection */}
              <button
                type="button"
                onClick={handleClearSelection}
                className="p-1.5 text-[#64748b] hover:text-[#0f172a] rounded-[8px] hover:bg-[#f1f5f9] transition-colors"
                title={lang === 'id' ? 'Batalkan pilihan' : 'Clear selection'}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. DATA-DENSE TABLE VIEW (Industrial / Fleet UI)         */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#e2e8f0] rounded-[14px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-semibold select-none">
                  {/* Master Checkbox */}
                  <th className="py-3 px-3.5 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAllCurrentPage}
                      className="inline-flex items-center justify-center text-[#059669] hover:opacity-80"
                      title={allCurrentPageSelected ? 'Batalkan pilih halaman ini' : 'Pilih semua di halaman ini'}
                    >
                      {allCurrentPageSelected ? (
                        <CheckSquare size={16} />
                      ) : someCurrentPageSelected ? (
                        <MinusSquare size={16} />
                      ) : (
                        <Square size={16} className="text-[#94a3b8]" />
                      )}
                    </button>
                  </th>

                  {/* Phone & Avatar Column (Sortable) */}
                  <th
                    onClick={() => handleSort('phone')}
                    className="py-3 px-3 cursor-pointer hover:text-[#0f172a] transition-colors"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{lang === 'id' ? 'KONTAK & NOMOR WA' : 'CONTACT & PHONE'}</span>
                      {sortColumn === 'phone' ? (
                        sortDirection === 'asc' ? <ArrowUp size={13} className="text-[#059669]" /> : <ArrowDown size={13} className="text-[#059669]" />
                      ) : (
                        <ArrowUpDown size={12} className="text-[#cbd5e1]" />
                      )}
                    </div>
                  </th>

                  {/* Name Column (Sortable) */}
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3 px-3 cursor-pointer hover:text-[#0f172a] transition-colors"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{t.contacts.colName}</span>
                      {sortColumn === 'name' ? (
                        sortDirection === 'asc' ? <ArrowUp size={13} className="text-[#059669]" /> : <ArrowDown size={13} className="text-[#059669]" />
                      ) : (
                        <ArrowUpDown size={12} className="text-[#cbd5e1]" />
                      )}
                    </div>
                  </th>

                  {/* Push Name Column */}
                  <th className="py-3 px-3 text-[#64748b]">
                    {lang === 'id' ? 'PUSH NAME (WA)' : 'PUSH NAME (WA)'}
                  </th>

                  {/* Stage Column (Sortable) */}
                  <th
                    onClick={() => handleSort('stage')}
                    className="py-3 px-3 cursor-pointer hover:text-[#0f172a] transition-colors"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{t.contacts.colStage}</span>
                      {sortColumn === 'stage' ? (
                        sortDirection === 'asc' ? <ArrowUp size={13} className="text-[#059669]" /> : <ArrowDown size={13} className="text-[#059669]" />
                      ) : (
                        <ArrowUpDown size={12} className="text-[#cbd5e1]" />
                      )}
                    </div>
                  </th>

                  {/* Tags / Group Column */}
                  <th className="py-3 px-3 text-[#64748b]">
                    {lang === 'id' ? 'GROUP / TAGS' : 'GROUPS / TAGS'}
                  </th>

                  {/* Opt-Out Status Column (Sortable) */}
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-3 cursor-pointer hover:text-[#0f172a] transition-colors"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{lang === 'id' ? 'STATUS OPT-OUT' : 'OPT-OUT STATUS'}</span>
                      {sortColumn === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp size={13} className="text-[#059669]" /> : <ArrowDown size={13} className="text-[#059669]" />
                      ) : (
                        <ArrowUpDown size={12} className="text-[#cbd5e1]" />
                      )}
                    </div>
                  </th>

                  {/* CRM Notes Preview */}
                  <th className="py-3 px-3 text-[#64748b]">
                    {lang === 'id' ? 'CATATAN CRM' : 'CRM NOTES'}
                  </th>

                  {/* Actions Column */}
                  <th className="py-3 px-3 text-right text-[#64748b]">
                    {t.contacts.colActions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {paginatedContacts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#64748b]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8]">
                          <Users size={24} />
                        </div>
                        <h3 className="font-semibold text-sm text-[#0f172a]">
                          {contactSearchQuery || selectedTagFilter !== 'ALL' || stageFilter !== 'ALL' || optOutFilter !== 'ALL'
                            ? (lang === 'id' ? 'Tidak ada kontak yang cocok dengan filter' : 'No contacts match the filters')
                            : t.contacts.noContacts}
                        </h3>
                        <p className="text-xs text-[#94a3b8] max-w-sm">
                          {contactSearchQuery || selectedTagFilter !== 'ALL' || stageFilter !== 'ALL' || optOutFilter !== 'ALL'
                            ? (lang === 'id' ? 'Coba ubah kata kunci pencarian atau reset filter aktif.' : 'Try changing your search terms or resetting filters.')
                            : (lang === 'id' ? 'Klik "+ Tambah Kontak" atau "Import Excel" untuk membangun direktori kontak sesi ini.' : 'Click "Add Contact" or "Import Excel" to build your directory.')}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedContacts.map(c => {
                    const isSelected = selectedPhones.has(c.phone);
                    const stage = c.pipeline_stage || 'lead';

                    return (
                      <tr
                        key={c.id || c.phone}
                        className={`hover:bg-[#f8fafc] transition-colors ${
                          isSelected ? 'bg-[#ecfdf5]/60' : ''
                        }`}
                      >
                        {/* Row Checkbox */}
                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectRow(c.phone)}
                            className="inline-flex items-center justify-center text-[#059669]"
                          >
                            {isSelected ? (
                              <CheckSquare size={16} />
                            ) : (
                              <Square size={16} className="text-[#cbd5e1] hover:text-[#94a3b8]" />
                            )}
                          </button>
                        </td>

                        {/* Contact & Phone */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <ChatAvatar
                              sessionId={selectedSessionId}
                              jid={`${c.phone}@s.whatsapp.net`}
                              name={getCleanContactName(c.name, c.push_name) || c.phone}
                              size={14}
                              className="chat-avatar privacy-blur privacy-blur-pic flex-shrink-0 rounded-full"
                              style={{ width: '32px', height: '32px' }}
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-semibold text-[#0f172a] text-[13px] privacy-blur privacy-blur-name">
                                  {c.phone && isLidNumber(c.phone) ? (
                                    <span className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                                      🔒 Nomor Privat
                                    </span>
                                  ) : (
                                    formatPhoneForDisplay(c.phone) || `+${c.phone}`
                                  )}
                                </span>
                                {c.phone && !isLidNumber(c.phone) && (
                                  <a
                                    href={`https://wa.me/${c.phone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#94a3b8] hover:text-[#059669] transition-colors"
                                    title={lang === 'id' ? 'Buka di WhatsApp Web / App' : 'Open in WhatsApp'}
                                  >
                                    <ExternalLink size={11} />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Name */}
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-[#0f172a] privacy-blur privacy-blur-name">
                            {getCleanContactName(c.name, c.push_name) || '—'}
                          </div>
                        </td>

                        {/* Push Name */}
                        <td className="py-2.5 px-3">
                          <span className="text-[#64748b] text-[11px] privacy-blur privacy-blur-name">
                            {(!isPhoneLike(c.push_name) ? c.push_name : '') || '—'}
                          </span>
                        </td>

                        {/* Pipeline Stage Dropdown */}
                        <td className="py-2.5 px-3">
                          <select
                            value={stage}
                            onChange={e => handleUpdateContactStage(c.phone, e.target.value as any)}
                            className={`text-[11px] font-bold rounded-[8px] px-2 py-1 border cursor-pointer transition-all focus:outline-none ${
                              stage === 'customer'
                                ? 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]'
                                : stage === 'prospect'
                                ? 'bg-[#fef9c3] text-[#854d0e] border-[#fef08a]'
                                : stage === 'churned'
                                ? 'bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]'
                                : 'bg-[#d1fae5] text-[#065f46] border-[#bae6fd]'
                            }`}
                          >
                            <option value="lead">🔵 {t.crm.lead}</option>
                            <option value="prospect">🟡 {t.crm.prospect}</option>
                            <option value="customer">💰 {t.crm.customer}</option>
                            <option value="churned">❌ {t.crm.churned}</option>
                          </select>
                        </td>

                        {/* Groups / Tags */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap items-center gap-1 max-w-[220px]">
                            {(!c.tags || c.tags.length === 0) ? (
                              <span className="text-[11px] text-[#94a3b8] italic">
                                {lang === 'id' ? 'Tanpa Group' : 'No Group'}
                              </span>
                            ) : (
                              c.tags.map(tagItem => (
                                <span
                                  key={tagItem}
                                  className="inline-flex items-center gap-1 bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0] px-2 py-0.5 rounded-[9999px] text-[10px] font-medium"
                                >
                                  <Tag size={9} className="text-[#64748b]" />
                                  {tagItem}
                                </span>
                              ))
                            )}
                            <button
                              type="button"
                              onClick={() => openEditTagsModal(c)}
                              className="text-[#94a3b8] hover:text-[#059669] p-0.5 rounded hover:bg-[#f1f5f9] transition-colors ml-0.5"
                              title={lang === 'id' ? 'Atur Group / Tag Kontak Ini' : 'Edit Tags'}
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        </td>

                        {/* Opt-Out Status Pill */}
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleOptOut(c.phone, c.opt_out)}
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-[9999px] border transition-colors cursor-pointer ${
                              c.opt_out
                                ? 'bg-[#fee2e2] text-[#b91c1c] border-[#fecaca] hover:bg-[#fecaca]'
                                : 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] hover:bg-[#bbf7d0]'
                            }`}
                            title={lang === 'id' ? 'Klik untuk mengubah status opt-out' : 'Click to toggle opt-out'}
                          >
                            {c.opt_out ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
                            <span>
                              {c.opt_out
                                ? (lang === 'id' ? 'Opt-Out (Blokir)' : 'Opted-Out')
                                : (lang === 'id' ? 'Opt-In Aktif' : 'Opt-In Active')}
                            </span>
                          </button>
                        </td>

                        {/* CRM Notes Preview */}
                        <td className="py-2.5 px-3 max-w-[160px]">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedContactForNotes(c);
                              setContactNotesText(c.notes || '');
                              setIsNotesModal(true);
                            }}
                            className="text-left group flex items-center gap-1.5 text-[#64748b] hover:text-[#0f172a] transition-colors w-full"
                            title={lang === 'id' ? 'Lihat / Edit Catatan Pelanggan' : 'View / Edit Notes'}
                          >
                            <FileText size={12} className="text-[#94a3b8] group-hover:text-[#059669] flex-shrink-0" />
                            <span className="text-[11px] truncate italic">
                              {c.notes || (lang === 'id' ? '+ Tambah Catatan' : '+ Add Note')}
                            </span>
                          </button>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Chat Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenChatWithContact(c.phone, c.name)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] rounded-[8px] hover:bg-[#059669] hover:text-white hover:border-[#059669] transition-all"
                              title={lang === 'id' ? 'Mulai chat WhatsApp langsung' : 'Chat with contact'}
                            >
                              <MessageSquare size={12} />
                              <span>Chat</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteContact(c.phone)}
                              className="p-1.5 text-[#94a3b8] hover:text-[#b91c1c] rounded-[8px] hover:bg-[#fee2e2] transition-colors"
                              title={lang === 'id' ? 'Hapus kontak dari direktori' : 'Delete contact'}
                            >
                              <Trash2 size={14} />
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

          {/* ========================================================= */}
          {/* 6. CLIENT-SIDE PAGINATION CONTROLS                       */}
          {/* ========================================================= */}
          <div className="p-3.5 bg-[#f8fafc] border-t border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748b]">
            <div>
              {lang === 'id' ? 'Menampilkan' : 'Showing'}{' '}
              <span className="font-semibold text-[#0f172a]">
                {filteredContacts.length > 0 ? startIndex + 1 : 0}
              </span>
              {' - '}
              <span className="font-semibold text-[#0f172a]">
                {Math.min(startIndex + pageSize, filteredContacts.length)}
              </span>
              {' '}{lang === 'id' ? 'dari' : 'of'}{' '}
              <span className="font-semibold text-[#0f172a]">{filteredContacts.length}</span>
              {' '}{lang === 'id' ? 'kontak' : 'contacts'}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Previous Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={validCurrentPage <= 1}
                className="inline-flex items-center justify-center p-1.5 rounded-[8px] border border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title={lang === 'id' ? 'Halaman Sebelumnya' : 'Previous Page'}
              >
                <ChevronLeft size={14} />
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - validCurrentPage) <= 1
                    );
                  })
                  .map((page, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const hasGap = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {hasGap && <span className="px-1 text-[#94a3b8]">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded-[8px] text-xs font-semibold flex items-center justify-center transition-colors ${
                            validCurrentPage === page
                              ? 'bg-[#059669] text-white'
                              : 'bg-white text-[#0f172a] border border-[#e2e8f0] hover:bg-[#f1f5f9]'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Next Page */}
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={validCurrentPage >= totalPages}
                className="inline-flex items-center justify-center p-1.5 rounded-[8px] border border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title={lang === 'id' ? 'Halaman Berikutnya' : 'Next Page'}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. MODAL: BATCH GROUP / TAGS ASSIGNMENT                  */}
      {/* ========================================================= */}
      {isBatchTagModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[14px] max-w-md w-full p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-[#059669]" />
                <h2 className="text-sm font-bold text-[#0f172a]">
                  {lang === 'id' ? 'Atur Group Kontak Terpilih' : 'Manage Selected Contact Groups'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchTagModalOpen(false)}
                className="text-[#94a3b8] hover:text-[#0f172a] p-1 rounded hover:bg-[#f1f5f9]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-[#ecfdf5] border border-[#bfdbfe] rounded-[8px] p-2.5 text-xs text-[#1e40af]">
              {lang === 'id'
                ? `Menerapkan group untuk ${selectedPhones.size} kontak yang dipilih.`
                : `Applying group changes to ${selectedPhones.size} selected contacts.`}
            </div>

            {/* Mode selection */}
            <div>
              <label className="text-xs font-semibold text-[#0f172a] block mb-1.5">
                {lang === 'id' ? 'Metode Pengaturan Group' : 'Tag Update Mode'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBatchTagMode('add')}
                  className={`p-2.5 rounded-[8px] text-xs font-semibold border text-left transition-all ${
                    batchTagMode === 'add'
                      ? 'bg-[#ecfdf5] border-[#059669] text-[#059669]'
                      : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'
                  }`}
                >
                  <div className="font-bold">{lang === 'id' ? 'Tambah Group' : 'Add Tags'}</div>
                  <div className="text-[10px] text-[#64748b] mt-0.5">
                    {lang === 'id' ? 'Menyimpan tag lama dan menambah tag baru' : 'Keep old tags and append new ones'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBatchTagMode('replace')}
                  className={`p-2.5 rounded-[8px] text-xs font-semibold border text-left transition-all ${
                    batchTagMode === 'replace'
                      ? 'bg-[#ecfdf5] border-[#059669] text-[#059669]'
                      : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'
                  }`}
                >
                  <div className="font-bold">{lang === 'id' ? 'Ganti Seluruh' : 'Replace All'}</div>
                  <div className="text-[10px] text-[#64748b] mt-0.5">
                    {lang === 'id' ? 'Menghapus tag lama dengan tag ini' : 'Overwrite previous tags completely'}
                  </div>
                </button>
              </div>
            </div>

            {/* Tag input */}
            <div>
              <label className="text-xs font-semibold text-[#0f172a] block mb-1">
                {lang === 'id' ? 'Nama Group / Tags (Pisahkan koma)' : 'Tags (Comma separated)'}
              </label>
              <input
                type="text"
                placeholder={lang === 'id' ? 'Contoh: VIP, Pelanggan Tetap, Reseller' : 'e.g. VIP, Loyal Customer'}
                value={batchTagInput}
                onChange={e => setBatchTagInput(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#e2e8f0] rounded-[8px] text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#059669]"
              />
            </div>

            {/* Quick Tag suggestions */}
            <div>
              <span className="text-[11px] font-semibold text-[#64748b] block mb-1.5">
                {lang === 'id' ? 'Pilih Cepat dari Group Sesi Ini:' : 'Quick Select:'}
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
                      className={`text-[11px] px-2.5 py-0.5 rounded-[9999px] border font-medium transition-colors ${
                        isIncluded
                          ? 'bg-[#059669] text-white border-[#059669]'
                          : 'bg-white text-[#475569] border-[#e2e8f0] hover:bg-[#f8fafc]'
                      }`}
                    >
                      {isIncluded ? '✓ ' : '+ '}
                      {t.tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f1f5f9]">
              <button
                type="button"
                onClick={() => setIsBatchTagModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#64748b] bg-white border border-[#e2e8f0] rounded-[8px] hover:bg-[#f8fafc] transition-colors"
              >
                {lang === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveBatchTags}
                disabled={isBatchProcessing || !batchTagInput.trim()}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#059669] rounded-[8px] hover:bg-[#047857] transition-colors disabled:opacity-50"
              >
                {isBatchProcessing ? (lang === 'id' ? 'Menyimpan...' : 'Saving...') : (lang === 'id' ? 'Simpan Group' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactsPanel;
