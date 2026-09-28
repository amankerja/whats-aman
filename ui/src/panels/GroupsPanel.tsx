import React, { useState } from 'react';
import {
  Layers,
  Users,
  RefreshCw,
  Download,
  FileSpreadsheet
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

  return (
    <div className="space-y-6">
      <header className="page-header">
        <div className="page-header__title-group">
          <h1>{t.groups.title}</h1>
          <span className="status-badge connected">{groups.length} {t.groups.totalGroups}</span>
        </div>
        <div className="page-header__actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {sessions.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="text-xs text-slate-500 font-medium">{t.common.session}:</span>
              <select
                value={selectedSessionId}
                onChange={e => setSelectedSessionId(e.target.value)}
                className="text-xs py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-slate-800"
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
            onClick={handleExportAllGroups}
            disabled={isExportingAll || groups.length === 0}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title={lang === 'id' ? 'Ekspor seluruh data grup dan anggota dalam satu file Excel' : 'Export all groups and members to single Excel'}
          >
            {isExportingAll ? (
              <>
                <RefreshCw size={14} className="animate-spin text-blue-600" />
                <span>{lang === 'id' ? 'Mengekspor Semua...' : 'Exporting...'}</span>
              </>
            ) : (
              <>
                <FileSpreadsheet size={14} className="text-emerald-600" />
                <span>{lang === 'id' ? 'Ekspor Semua Grup' : 'Export All Groups'}</span>
              </>
            )}
          </button>
          <button onClick={() => fetchGroups(selectedSessionId)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={15} />
            <span>{t.common.refresh}</span>
          </button>
        </div>
        <p className="page-header__subtitle">{t.groups.subtitle}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <Layers size={36} className="mx-auto text-slate-300" />
            <p>{t.groups.noGroups}</p>
          </div>
        ) : (
          groups.map(g => (
            <div key={g.jid} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm truncate">{g.name}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {t.groups.participants}: <span className="font-bold text-slate-800">{g.memberCount}</span>
                </p>
                <p className="text-[11px] text-slate-400 mono truncate mt-0.5">{g.jid}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
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
                  className="btn-primary w-full text-xs"
                  style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {importingJid === g.jid ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>{lang === 'id' ? 'Mengimpor...' : 'Importing...'}</span>
                    </>
                  ) : (
                    <>
                      <Users size={14} />
                      <span>{t.groups.importMembers}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleExportGroupExcel(g.jid, g.name)}
                  disabled={exportingJid === g.jid}
                  className="btn-secondary w-full text-xs"
                  style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  title={lang === 'id' ? `Unduh Excel anggota grup ${g.name}` : `Download Excel for ${g.name}`}
                >
                  {exportingJid === g.jid ? (
                    <>
                      <RefreshCw size={14} className="animate-spin text-blue-600" />
                      <span>{lang === 'id' ? 'Mengekspor Excel...' : 'Exporting...'}</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet size={14} className="text-emerald-600" />
                      <span>{t.groups.exportExcel}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupsPanel;
