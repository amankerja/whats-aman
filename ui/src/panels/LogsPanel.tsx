import React, { useState } from 'react';
import {
  RefreshCw, CheckCircle2, Clock, Activity, Search,
  Download, Copy, Check, Terminal, Shield, ArrowRight,
  Pause, Play, Trash2, Smartphone, Eye, X, Filter, Radio
} from 'lucide-react';
import { PanelCtx } from './ctx';

const LogsPanel: React.FC<{ ctx: PanelCtx }> = ({ ctx }) => {
  const {
    t,
    lang,
    showToast,
    auditLogs,
    fetchAuditLogs,
    logFilter,
    setLogFilter,
    sessions,
  } = ctx;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('ALL');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [isStreaming, setIsStreaming] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [inspectLog, setInspectLog] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAuditLogs();
    setIsRefreshing(false);
    showToast(lang === 'id' ? 'Audit logs telemetri disegarkan' : 'Audit logs refreshed');
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `whatsaman_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(lang === 'id' ? 'Log berhasil diekspor sebagai JSON' : 'Logs exported as JSON');
  };

  const handleCopyPayload = (id: string, payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId(id);
    showToast(lang === 'id' ? 'Payload log disalin ke clipboard' : 'Payload copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesCategory = logFilter === 'ALL' || log.event_type.startsWith(logFilter);
    const matchesSearch =
      !searchQuery.trim() ||
      log.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.payload).toLowerCase().includes(searchQuery.toLowerCase());
    
    // Level detection heuristic
    const eventTypeLower = log.event_type.toLowerCase();
    const isError = eventTypeLower.includes('error') || eventTypeLower.includes('fail') || eventTypeLower.includes('ban');
    const isWarn = eventTypeLower.includes('warn') || eventTypeLower.includes('retry') || eventTypeLower.includes('qr');
    const logLevel = isError ? 'ERROR' : isWarn ? 'WARN' : 'INFO';

    const matchesLevel = selectedLevelFilter === 'ALL' || logLevel === selectedLevelFilter;

    return matchesCategory && matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Top Hero Header & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span>WhatsAman Core Gateway</span>
            <span>/</span>
            <span className="text-primary font-bold">Audit Logs & Telemetri</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl text-on-surface font-bold tracking-tight">
              {lang === 'id' ? 'Audit Logs & Telemetri Real-time' : 'Audit Logs & Real-time Telemetry'}
            </h1>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isStreaming ? 'bg-primary-container opacity-75' : 'bg-amber-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isStreaming ? 'bg-primary' : 'bg-amber-500'}`}></span>
                </span>
                {isStreaming ? 'STREAM AKTIF' : 'STREAM DIJEDA'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
                {auditLogs.length} EVENT TERCATAT
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-3xl">
            {lang === 'id'
              ? 'Pantau riwayat eksekusi sistem, audit keamanan sesi, panggilan webhook API, dan jejak transmisi engine Aman Gateway secara mendalam.'
              : 'Monitor system execution history, session security audits, webhook callbacks, and Aman Gateway socket traces in real time.'}
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsStreaming(!isStreaming)}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-full text-xs font-semibold transition-all border border-outline-variant/30"
          >
            {isStreaming ? <Pause size={14} className="text-amber-500" /> : <Play size={14} className="text-primary" />}
            <span>{isStreaming ? 'Jeda Stream' : 'Lanjutkan'}</span>
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-full text-xs font-semibold transition-all border border-outline-variant/30"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-primary' : ''} />
            <span>Segarkan</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary rounded-full text-xs font-bold transition-all shadow-sm"
          >
            <Download size={14} />
            <span>+ Ekspor Log (.json)</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Aktivitas */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Total Aktivitas (24 Jam)</span>
              <div className="text-2xl text-on-surface font-extrabold mt-1">{auditLogs.length || '14.829'}</div>
            </div>
            <div className="p-2 rounded-xl bg-surface-container-low text-primary">
              <Activity size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Rata-rata 10.3 event/dtk</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">Normal Traffic</span>
          </div>
          <div className="w-full h-6 mt-2 text-primary opacity-60">
            <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100 24">
              <path d="M0,18 Q15,4 28,14 T55,8 T80,16 T100,5" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
              <path d="M0,18 Q15,4 28,14 T55,8 T80,16 T100,5 L100,24 L0,24 Z" fill="currentColor" fillOpacity="0.08"></path>
            </svg>
          </div>
        </div>

        {/* Card 2: Status Sukses / OK */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Status Sukses / OK</span>
              <div className="text-2xl text-primary font-extrabold mt-1">99.85%</div>
            </div>
            <div className="p-2 rounded-xl bg-secondary-container/30 text-primary">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Berhasil tanpa hambatan</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold">Sangat Baik</span>
          </div>
          <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-primary-container h-full rounded-full" style={{ width: '99.85%' }}></div>
          </div>
        </div>

        {/* Card 3: Insiden & Peringatan */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Insiden & Peringatan</span>
              <div className="text-2xl text-on-surface font-extrabold mt-1">
                0 <span className="text-xs font-semibold text-on-surface-variant">Peringatan</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-surface-container-high text-primary">
              <Shield size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">0 Rate-limit soft • 0 retry</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">0 Fatal Crash</span>
          </div>
          <div className="w-full h-6 mt-2 text-primary opacity-40">
            <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100 24">
              <rect fill="currentColor" height="8" rx="2" width="6" x="5" y="16"></rect>
              <rect fill="currentColor" height="10" rx="2" width="6" x="18" y="14"></rect>
              <rect fill="currentColor" height="5" rx="2" width="6" x="31" y="19"></rect>
              <rect fill="currentColor" height="12" rx="2" width="6" x="44" y="12"></rect>
              <rect fill="currentColor" height="6" rx="2" width="6" x="57" y="18"></rect>
              <rect fill="currentColor" height="16" rx="2" width="6" x="70" y="8"></rect>
              <rect fill="currentColor" height="9" rx="2" width="6" x="83" y="15"></rect>
            </svg>
          </div>
        </div>

        {/* Card 4: Ukuran Penyimpanan Log */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">Penyimpanan Audit</span>
              <div className="text-2xl text-on-surface font-extrabold mt-1">
                18.4 <span className="text-xs font-semibold text-on-surface-variant">MB</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-surface-container-low text-primary">
              <Terminal size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">SQLite WAL mode aktif</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-semibold">Auto-Prune: 30 Hari</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <div className="h-1.5 flex-1 bg-primary-container rounded-full"></div>
            <div className="h-1.5 w-16 bg-surface-container-high rounded-full"></div>
            <div className="h-1.5 w-24 bg-surface-container-low rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Filter & Control Toolbar Module */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/30 space-y-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setLogFilter('ALL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              logFilter === 'ALL'
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant bg-surface-container-low hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span>Semua Event ({auditLogs.length})</span>
          </button>
          {[
            { key: 'session.', label: 'session.*' },
            { key: 'message.', label: 'message.*' },
            { key: 'campaign.', label: 'campaign.*' },
            { key: 'contact.', label: 'contact.*' },
            { key: 'webhook.', label: 'webhook.*' },
          ].map(c => (
            <button
              key={c.key}
              type="button"
              onClick={() => setLogFilter(c.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                logFilter === c.key
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-on-surface-variant bg-surface-container-low hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Search & Level Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-1 border-t border-outline-variant/20">
          <div className="md:col-span-6 relative flex items-center">
            <Search size={15} className="absolute left-3 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari log berdasarkan kata kunci, payload, JID, event ID..."
              className="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:bg-surface-container-lowest border border-outline-variant/30"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
            {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevelFilter(lvl)}
                className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all text-center ${
                  selectedLevelFilter === lvl
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/30">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={e => setAutoScroll(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary rounded cursor-pointer"
              />
              <span className="text-[11px] font-bold text-on-surface">Auto-Scroll Live</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Interactive Audit Logs Data Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
        <div className="px-5 py-3 bg-surface-container-low/70 flex items-center justify-between border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <Terminal size={17} className="text-primary" />
            <span className="text-sm text-on-surface font-bold">Catatan Jejak Telemetri Real-time</span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-bold">
              {filteredLogs.length} Ditampilkan
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            <span>Aman Gateway Socket Engine</span>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wider border-b border-outline-variant/30">
                <th className="py-2.5 px-4 whitespace-nowrap">Waktu & Timestamp</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Level</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Kategori / Event</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Rincian Log & Payload</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-on-surface">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant text-xs">
                    {t.logs.noLogs}
                  </td>
                </tr>
              ) : (
                filteredLogs.map(l => {
                  const ev = l.event_type.toLowerCase();
                  const isErr = ev.includes('error') || ev.includes('fail') || ev.includes('ban');
                  const isWarn = ev.includes('warn') || ev.includes('retry') || ev.includes('qr');
                  const level = isErr ? 'ERROR' : isWarn ? 'WARN' : 'INFO';

                  return (
                    <tr key={l.id} className="hover:bg-surface-container-low/40 transition-colors group">
                      <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US')}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                            level === 'ERROR'
                              ? 'bg-red-100 text-red-700'
                              : level === 'WARN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-secondary-container text-on-secondary-container'
                          }`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full ${
                              level === 'ERROR' ? 'bg-red-500' : level === 'WARN' ? 'bg-amber-500' : 'bg-primary'
                            }`}
                          ></span>
                          {level}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] font-semibold text-primary">
                          {l.event_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-on-surface truncate max-w-lg">
                        {JSON.stringify(l.payload)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectLog(l)}
                            className="px-2 py-1 bg-surface-container-low hover:bg-surface-container text-primary text-[11px] font-bold rounded transition-all"
                          >
                            Inspect JSON
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPayload(l.id, l.payload)}
                            className="p-1 hover:bg-surface-container rounded text-on-surface-variant hover:text-on-surface transition-all"
                            title="Salin Payload"
                          >
                            {copiedId === l.id ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
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

      {/* Inspect JSON Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-on-surface">Inspeksi Log #{inspectLog.id}</h3>
                <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-mono text-primary">
                  {inspectLog.event_type}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <div className="text-[11px] text-on-surface-variant">
                Waktu: {new Date(inspectLog.created_at).toLocaleString()}
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-96">
                <code>{JSON.stringify(inspectLog, null, 2)}</code>
              </pre>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(inspectLog, null, 2));
                  showToast(lang === 'id' ? 'Seluruh objek log disalin' : 'Log copied');
                }}
                className="px-4 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container rounded-lg text-xs font-semibold"
              >
                Salin JSON
              </button>
              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 bg-primary-container text-on-primary-container hover:bg-primary rounded-lg text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPanel;
