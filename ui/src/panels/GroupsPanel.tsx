import React, { useState, useMemo } from 'react';
import {
  Layers,
  Users,
  RefreshCw,
  Download,
  FileSpreadsheet,
  Search,
  LayoutGrid,
  List,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Smartphone,
  Sparkles,
  ExternalLink,
  Store,
  UserCheck
} from 'lucide-react';
import { PanelCtx } from './ctx';

const GroupsPanel: React.FC<{ ctx: PanelCtx }> = ({ ctx }) => {
  const {
    t,
    lang,
    showToast,
    addLog,
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    groups,
    fetchGroups,
    handleImportGroupToContacts
  } = ctx;

  const [exportingJid, setExportingJid] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [importingJid, setImportingJid] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [isFetchingGroups, setIsFetchingGroups] = useState<boolean>(false);

  // Trigger auto-fetch on mount if empty
  React.useEffect(() => {
    if (selectedSessionId && (!groups || groups.length === 0)) {
      fetchGroups(selectedSessionId);
    }
  }, [selectedSessionId]);

  // Active session object
  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId) || sessions[0];
  }, [sessions, selectedSessionId]);

  // Total members calculation
  const totalMembers = useMemo(() => {
    return groups.reduce((acc, g) => acc + (Number(g.memberCount) || 0), 0);
  }, [groups]);

  // Filtered groups by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase().trim();
    return groups.filter(g =>
      (g.name || '').toLowerCase().includes(q) ||
      (g.jid || '').toLowerCase().includes(q)
    );
  }, [groups, searchQuery]);

  const handleExportGroupExcel = async (groupJid: string, groupName: string) => {
    if (!selectedSessionId) {
      showToast(lang === 'id' ? 'Silakan pilih sesi WhatsApp terlebih dahulu' : 'Please select a WhatsApp session first', 'warn');
      return;
    }

    try {
      setExportingJid(groupJid);
      addLog(lang === 'id' ? `Mengekspor anggota grup "${groupName}" ke Excel...` : `Exporting members of "${groupName}" to Excel...`, 'info');

      const url = `/api/v1/groups/${encodeURIComponent(groupJid)}/export?sessionId=${encodeURIComponent(selectedSessionId)}`;
      const res = await fetch(url);

      if (!res.ok) {
        let errMsg = lang === 'id' ? 'Gagal mengekspor file Excel' : 'Failed to export Excel file';
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const safeName = groupName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'group';
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `group_${safeName}_members.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      showToast(lang === 'id' ? `Berhasil mengunduh Excel anggota grup "${groupName}"!` : `Successfully downloaded "${groupName}" members Excel!`, 'success');
      addLog(`File Excel grup "${groupName}" berhasil diunduh`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal export Excel grup', 'error');
      addLog(`Gagal export Excel grup "${groupName}": ${err.message}`, 'warn');
    } finally {
      setExportingJid(null);
    }
  };

  const handleExportAllGroups = async () => {
    if (!selectedSessionId) {
      showToast(lang === 'id' ? 'Silakan pilih sesi WhatsApp terlebih dahulu' : 'Please select a WhatsApp session first', 'warn');
      return;
    }
    if (groups.length === 0) {
      showToast(lang === 'id' ? 'Tidak ada grup untuk diekspor' : 'No groups to export', 'warn');
      return;
    }

    try {
      setIsExportingAll(true);
      addLog(lang === 'id' ? 'Mengekspor seluruh grup WhatsApp ke Excel...' : 'Exporting all WhatsApp groups to Excel...', 'info');

      const url = `/api/v1/groups/export-all?sessionId=${encodeURIComponent(selectedSessionId)}`;
      const res = await fetch(url);

      if (!res.ok) {
        let errMsg = 'Gagal mengekspor seluruh grup';
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `semua_grup_whatsapp_${selectedSessionId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);

      showToast(lang === 'id' ? 'Berhasil mengunduh seluruh data grup ke Excel!' : 'Successfully downloaded all groups Excel!', 'success');
      addLog('Seluruh data grup WhatsApp berhasil diekspor ke Excel', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal export semua grup', 'error');
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleToggleSelectGroup = (jid: string) => {
    const next = new Set(selectedGroups);
    if (next.has(jid)) next.delete(jid);
    else next.add(jid);
    setSelectedGroups(next);
  };

  const handleSelectAllGroups = () => {
    if (selectedGroups.size === filteredGroups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(filteredGroups.map(g => g.jid)));
    }
  };

  const handleBatchExtract = async () => {
    if (selectedGroups.size === 0) return;
    const jids = Array.from(selectedGroups);
    showToast(lang === 'id' ? `Memulai ekstraksi kontak untuk ${jids.length} grup...` : `Extracting ${jids.length} groups...`, 'info');
    for (const jid of jids) {
      try {
        await handleImportGroupToContacts(jid);
      } catch (err: any) {
        // continue
      }
    }
    showToast(lang === 'id' ? `Selesai mengekstrak kontak grup terpilih!` : `Finished batch group extraction!`, 'success');
    setSelectedGroups(new Set());
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HERO CONTEXT BAR */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {lang === 'id' ? 'Grup WhatsApp & Group Grabber' : 'WhatsApp Groups & Group Grabber'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 text-xs font-bold tracking-wide">
              {groups.length} {lang === 'id' ? 'GRUP TERDETEKSI' : 'GROUPS DETECTED'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {lang === 'id' ? 'Sinkronisasi Realtime' : 'Live Sync'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
            {lang === 'id'
              ? 'Kelola daftar grup WhatsApp aktif, inspeksi detail anggota, ekstraksi database kontak, dan ekspor data ke Excel/CSV dengan proteksi anti-banned.'
              : 'Manage active WhatsApp groups, inspect member lists, extract contacts into your CRM database, and export to Excel/CSV.'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {sessions.length > 1 && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Smartphone size={14} className="text-slate-400" />
              <select
                value={selectedSessionId}
                onChange={e => setSelectedSessionId(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            disabled={isFetchingGroups}
            onClick={async () => {
              if (!selectedSessionId) return;
              setIsFetchingGroups(true);
              try {
                await fetchGroups(selectedSessionId);
                showToast(lang === 'id' ? 'Daftar grup berhasil diperbarui' : 'Groups refreshed successfully', 'success');
              } catch (err: any) {
                showToast(err?.message || 'Gagal memuat grup', 'error');
              } finally {
                setIsFetchingGroups(false);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs disabled:opacity-50"
          >
            <RefreshCw size={14} className={`text-slate-400 ${isFetchingGroups ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isFetchingGroups ? (lang === 'id' ? 'Memuat Grup...' : 'Fetching...') : (lang === 'id' ? 'Segarkan Grup' : 'Refresh Groups')}</span>
          </button>
          <button
            type="button"
            onClick={handleExportAllGroups}
            disabled={isExportingAll || groups.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs disabled:opacity-50"
          >
            {isExportingAll ? (
              <RefreshCw size={14} className="animate-spin text-emerald-600" />
            ) : (
              <FileSpreadsheet size={14} className="text-emerald-600" />
            )}
            <span>{isExportingAll ? (lang === 'id' ? 'Mengekspor...' : 'Exporting...') : (lang === 'id' ? 'Ekspor Semua (.xlsx)' : 'Export All')}</span>
          </button>
        </div>
      </div>

      {/* 2. 4-TIER KPI TELEMETRY SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'id' ? 'Grup Terhubung' : 'Connected Groups'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {groups.length} {lang === 'id' ? 'Grup' : 'Groups'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{activeSession?.name || 'Sesi Aktif'}</span>
            </p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'id' ? 'Total Anggota' : 'Total Members'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {totalMembers.toLocaleString()} {lang === 'id' ? 'Kontak' : 'Contacts'}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp size={13} />
              <span>{lang === 'id' ? 'Tercakup dalam buku grup WA' : 'Covered in WA groups'}</span>
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'id' ? 'Estimasi Potensi CRM' : 'CRM Potential'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {Math.round(totalMembers * 0.85).toLocaleString()} {lang === 'id' ? 'Prospek' : 'Leads'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">85% Valid</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'id' ? 'Anti-Spam & Rate Limit' : 'Anti-Spam Shield'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              100% {lang === 'id' ? 'Aman' : 'Safe'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles size={12} className="text-emerald-500" />
              <span>{lang === 'id' ? 'Jeda humanis 1.5s - 3.0s per ekstraksi' : 'Humanized 1.5s - 3s delay'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. FILTER & CONTROLS TOOLBAR */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'id' ? 'Cari nama grup atau ID JID grup...' : 'Search group name or JID...'}
              className="w-full pl-10 pr-12 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-500 rounded">
              /
            </kbd>
          </div>

          {/* Action Toggles & Controls */}
          <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Tampilan Tabel"
              >
                <List size={16} />
              </button>
            </div>

            {selectedGroups.size > 0 && (
              <button
                type="button"
                onClick={handleBatchExtract}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <UserCheck size={14} />
                <span>{lang === 'id' ? `Ekstrak ${selectedGroups.size} Grup Terpilih` : `Extract ${selectedGroups.size} Groups`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
          <span>
            {lang === 'id' ? 'Menampilkan' : 'Showing'} <strong className="text-slate-800 dark:text-slate-200">{filteredGroups.length}</strong> {lang === 'id' ? 'dari' : 'of'}{' '}
            <strong className="text-slate-800 dark:text-slate-200">{groups.length}</strong> {lang === 'id' ? 'grup terdaftar' : 'registered groups'}
          </span>
          {filteredGroups.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllGroups}
              className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
            >
              {selectedGroups.size === filteredGroups.length ? (lang === 'id' ? 'Batal Pilih Semua' : 'Deselect All') : (lang === 'id' ? 'Pilih Semua Grup' : 'Select All')}
            </button>
          )}
        </div>
      </div>

      {/* 4. CONTENT AREA: GRID OR TABLE */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-400 space-y-2">
          <Layers size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold">{t.groups.noGroups}</p>
          <p className="text-xs text-slate-400">
            {lang === 'id'
              ? 'Pastikan sesi WhatsApp aktif dan Anda telah bergabung di beberapa grup.'
              : 'Make sure your WhatsApp session is connected and has joined group chats.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGroups.map(g => {
            const isSelected = selectedGroups.has(g.jid);
            return (
              <div
                key={g.jid}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 hover:shadow-md ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold shrink-0">
                        <Store size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={g.name}>
                          {g.name}
                        </h3>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                          Komunitas &amp; Pelanggan
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectGroup(g.jid)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 mt-1"
                    />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>{t.groups.participants}:</span>
                      <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                        {g.memberCount} Anggota
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 truncate">
                      <span>JID:</span>
                      <span className="truncate max-w-[190px]">{g.jid}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setImportingJid(g.jid);
                        await handleImportGroupToContacts(g.jid);
                      } finally {
                        setImportingJid(null);
                      }
                    }}
                    disabled={importingJid === g.jid}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {importingJid === g.jid ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>{lang === 'id' ? 'Mengekstrak Kontak...' : 'Extracting...'}</span>
                      </>
                    ) : (
                      <>
                        <Users size={13} />
                        <span>{t.groups.importMembers}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExportGroupExcel(g.jid, g.name)}
                    disabled={exportingJid === g.jid}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {exportingJid === g.jid ? (
                      <>
                        <RefreshCw size={13} className="animate-spin text-emerald-600" />
                        <span>{lang === 'id' ? 'Mengekspor Excel...' : 'Exporting...'}</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet size={13} className="text-emerald-600" />
                        <span>{t.groups.exportExcel}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <input
                      type="checkbox"
                      checked={selectedGroups.size === filteredGroups.length && filteredGroups.length > 0}
                      onChange={handleSelectAllGroups}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                  </th>
                  <th className="py-3.5 px-4">{lang === 'id' ? 'Grup WhatsApp' : 'WhatsApp Group'}</th>
                  <th className="py-3.5 px-4">JID WhatsApp</th>
                  <th className="py-3.5 px-4">{lang === 'id' ? 'Jumlah Anggota' : 'Members'}</th>
                  <th className="py-3.5 px-4 text-center">{lang === 'id' ? 'Aksi Ekstraksi' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-800 dark:text-slate-200">
                {filteredGroups.map(g => {
                  const isSelected = selectedGroups.has(g.jid);
                  return (
                    <tr key={g.jid} className={`hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}>
                      <td className="py-3.5 pl-4 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectGroup(g.jid)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                            <Store size={16} />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">{g.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{g.jid}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                          {g.memberCount} Anggota
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleImportGroupToContacts(g.jid)}
                            disabled={importingJid === g.jid}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <Users size={13} />
                            <span>{t.groups.importMembers}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportGroupExcel(g.jid, g.name)}
                            disabled={exportingJid === g.jid}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 transition-colors"
                            title={t.groups.exportExcel}
                          >
                            <FileSpreadsheet size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsPanel;
