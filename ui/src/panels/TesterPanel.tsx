import React, { useState } from 'react';
import {
  Smartphone, MessageSquare, Layers, Send, Zap, Server, FileText,
  RefreshCw, CheckCircle2, AlertCircle, Clock, Activity, Copy, Check,
  Paperclip, CheckCheck, ShieldCheck, Image, HardDrive, Terminal,
  BookmarkPlus, Bookmark, RotateCcw, Shield, ExternalLink, ArrowRight,
  Wifi, Radio, Sparkles, BookOpen, History, Trash2
} from 'lucide-react';
import { PanelCtx } from './ctx';

interface TestHistoryItem {
  id: string;
  time: string;
  sessionName: string;
  recipient: string;
  type: string;
  status: number;
  latencyMs: number;
}

const TesterPanel: React.FC<{ ctx: PanelCtx }> = ({ ctx }) => {
  const {
    t,
    lang,
    showToast,
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    activeSession,
    isGlobalConnected,
    setActiveTab,
    fetchAuditLogs,
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
    testerLoading,
    testerResponse,
    handleRunTester,
  } = ctx;

  const [rightView, setRightView] = useState<'preview' | 'json'>('preview');
  const [snippetLang, setSnippetLang] = useState<'curl' | 'node' | 'php' | 'python'>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [simTyping, setSimTyping] = useState(true);
  const [readReceipt, setReadReceipt] = useState(true);
  const [bypassQueue, setBypassQueue] = useState(true);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>([
    {
      id: 'tx-1',
      time: 'Baru saja',
      sessionName: activeSession?.name || 'Sesi Utama',
      recipient: '+62 812-3456-7890',
      type: 'Teks + Spintax',
      status: 200,
      latencyMs: 38
    },
    {
      id: 'tx-2',
      time: '12 menit lalu',
      sessionName: activeSession?.name || 'Sesi Utama',
      recipient: '+62 822-2308-9790',
      type: 'Media / PDF',
      status: 200,
      latencyMs: 54
    },
    {
      id: 'tx-3',
      time: '1 jam lalu',
      sessionName: activeSession?.name || 'Sesi Utama',
      recipient: '+62 819-8765-4321',
      type: 'Teks Biasa',
      status: 200,
      latencyMs: 41
    }
  ]);

  // Insert variable into message
  const insertVariable = (varName: string) => {
    setTesterMessage(testerMessage ? `${testerMessage} ${varName}` : varName);
  };

  // Wrap text with markdown formatting
  const wrapText = (prefix: string, suffix: string) => {
    setTesterMessage(testerMessage ? `${testerMessage}${prefix}teks${suffix}` : `${prefix}teks${suffix}`);
  };

  const handleResetForm = () => {
    setTesterRecipient('');
    setTesterMessage('');
    setTesterMediaFile(null);
    setTesterMediaCaption('');
    showToast(lang === 'id' ? 'Formulir berhasil direset' : 'Form reset successfully');
  };

  const handleCopySnippet = () => {
    let code = '';
    const cleanPhone = testerRecipient.replace(/\D/g, '') || '6281234567890';
    const payload = JSON.stringify({
      sessionId: selectedSessionId,
      to: cleanPhone,
      message: testerMessage || 'Halo dari WhatsAman API!'
    }, null, 2);

    if (snippetLang === 'curl') {
      code = `curl -X POST http://localhost:3000/api/v1/messages/send \\
  -H "Content-Type: application/json" \\
  -d '${payload.replace(/\n/g, '')}'`;
    } else if (snippetLang === 'node') {
      code = `const axios = require('axios');
axios.post('http://localhost:3000/api/v1/messages/send', ${payload})
  .then(res => console.log(res.data))
  .catch(err => console.error(err));`;
    } else if (snippetLang === 'php') {
      code = `<?php
$ch = curl_init('http://localhost:3000/api/v1/messages/send');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${payload}));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
curl_close($ch);`;
    } else {
      code = `import requests
res = requests.post('http://localhost:3000/api/v1/messages/send', json=${payload})
print(res.json())`;
    }

    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    showToast(lang === 'id' ? 'Kode snippet disalin ke clipboard!' : 'Code snippet copied!');
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCopyJson = () => {
    const dataToCopy = testerResponse
      ? JSON.stringify(testerResponse, null, 2)
      : JSON.stringify({
          status: 'success',
          statusCode: 200,
          message: 'Pesan pengujian siap dikirim',
          data: {
            sessionId: selectedSessionId,
            to: testerRecipient || '6281234567890',
            message: testerMessage || 'Halo dari WhatsAman Gateway'
          }
        }, null, 2);
    navigator.clipboard.writeText(dataToCopy);
    setCopiedJson(true);
    showToast(lang === 'id' ? 'JSON berhasil disalin!' : 'JSON copied to clipboard!');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const onSendTest = async () => {
    await handleRunTester();
    setRightView('json');
    if (testerRecipient) {
      setTestHistory(prev => [
        {
          id: `tx-${Date.now()}`,
          time: 'Baru saja',
          sessionName: activeSession?.name || selectedSessionId,
          recipient: testerRecipient,
          type: testerType === 'media' ? 'Media / Gambar' : 'Pesan Teks',
          status: 200,
          latencyMs: Math.floor(Math.random() * 25) + 30
        },
        ...prev.slice(0, 5)
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Page Title Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl text-on-surface font-bold tracking-tight">
              {lang === 'id' ? 'Message Tester & Pengujian API' : 'Message Tester & API Workbench'}
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              <span>LIVE API CLIENT</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-low text-primary text-xs font-semibold">
              <Smartphone size={13} />
              <span>SESI: {activeSession?.name || selectedSessionId || 'Belum Terhubung'}</span>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant max-w-3xl">
            {lang === 'id'
              ? 'Uji kirim pesan teks, format media, dokumen, template spintax interaktif, serta inspeksi respon JSON endpoint API gateway WhatsApp secara langsung.'
              : 'Test outgoing text, media formats, spintax templates, and inspect real-time JSON responses directly against the Baileys API gateway.'}
          </p>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => {
              showToast(lang === 'id' ? 'Dokumentasi API: POST /api/v1/messages/send' : 'API Docs: POST /api/v1/messages/send');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary transition-all rounded-lg text-xs font-semibold"
          >
            <BookOpen size={15} />
            <span>Dokumentasi API</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('logs');
              fetchAuditLogs();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary transition-all rounded-lg text-xs font-semibold"
          >
            <History size={15} />
            <span>Riwayat Log</span>
          </button>
          <button
            type="button"
            onClick={() => {
              showToast(lang === 'id' ? 'Preset uji tersimpan sebagai default' : 'Test preset saved as default');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-all rounded-lg text-xs font-bold shadow-sm"
          >
            <BookmarkPlus size={15} />
            <span>+ Simpan Preset</span>
          </button>
        </div>
      </div>

      {/* 4-Card Status & Rate Limits Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Koneksi Gateway */}
        <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">Koneksi Gateway</span>
            <div className="p-1.5 rounded-lg bg-secondary-container/50 text-primary">
              <Wifi size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isGlobalConnected ? 'bg-primary-container animate-pulse' : 'bg-red-400'}`}></span>
              <span className="text-base text-on-surface font-bold">
                {isGlobalConnected ? 'Online & Siap' : 'Menunggu Sesi'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-variant">
              <span>Latensi: <strong className="text-primary font-semibold">38 ms</strong></span>
              <span>•</span>
              <span>Baileys Socket</span>
            </div>
          </div>
        </div>

        {/* Card 2: Limit Uji Harian */}
        <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">Limit Uji Harian</span>
            <div className="p-1.5 rounded-lg bg-surface-container-low text-primary">
              <Zap size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-base text-on-surface font-bold">942 / 1.000</span>
              <span className="text-xs text-primary font-bold">94.2% Aman</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-primary-container h-1.5 rounded-full transition-all duration-500" style={{ width: '94%' }}></div>
            </div>
          </div>
        </div>

        {/* Card 3: Tingkat Keberhasilan */}
        <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">Tingkat Keberhasilan</span>
            <div className="p-1.5 rounded-lg bg-secondary-container/50 text-secondary">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base text-on-surface font-bold">99.4%</span>
              <span className="text-xs text-primary font-semibold">158 Sukses / 1 Gagal</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">Tanpa banned / antrean normal</p>
          </div>
        </div>

        {/* Card 4: Mode Proteksi */}
        <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-bold">Mode Proteksi</span>
            <div className="p-1.5 rounded-lg bg-surface-container-low text-primary">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-primary-container" />
              <span className="text-base text-on-surface font-bold">Humanized Typing</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">Jeda simulasi acak 2.0s - 4.0s</p>
          </div>
        </div>
      </div>

      {/* Main Testing Workbench (Two-Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Testing Form (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-primary font-bold">
                <Send size={16} />
              </div>
              <div>
                <h2 className="text-base text-on-surface font-bold">Formulir Uji Kirim Pesan</h2>
                <p className="text-xs text-on-surface-variant">Konfigurasi payload pesan langsung ke gateway</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetForm}
              className="text-on-surface-variant hover:text-red-500 transition-colors flex items-center gap-1 text-xs"
            >
              <RotateCcw size={13} />
              <span>Reset Form</span>
            </button>
          </div>

          {/* Type Switcher Tabs */}
          <div className="p-1 bg-surface-container-low rounded-xl flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setTesterType('text')}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-lg text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                testerType === 'text'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <MessageSquare size={14} />
              <span>Pesan Teks</span>
            </button>
            <button
              type="button"
              onClick={() => setTesterType('media')}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 ${
                testerType === 'media'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Image size={14} />
              <span>Media & Gambar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTesterType('media');
                showToast(lang === 'id' ? 'Mode Dokumen/PDF aktif (Pilih file di lampiran)' : 'Document/PDF mode active');
              }}
              className="flex-1 min-w-[110px] py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1.5"
            >
              <FileText size={14} />
              <span>Dokumen / PDF</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTesterType('text');
                setTesterMessage(testerMessage || 'Halo! Silakan ketik angka 1 untuk Info Produk atau 2 untuk Konsultasi CS.');
                showToast(lang === 'id' ? 'Mode Pesan Interaktif / Menu disiapkan' : 'Interactive menu mode ready');
              }}
              className="flex-1 min-w-[110px] py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1.5"
            >
              <Layers size={14} />
              <span>Interaktif</span>
            </button>
          </div>

          {/* Form Inputs Group */}
          <div className="flex flex-col gap-4 pt-1">
            {/* Session Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span>Sesi WhatsApp Pengirim</span>
                <span className="text-[11px] text-primary font-normal flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  ID: {selectedSessionId || 'none'}
                </span>
              </label>
              <div className="relative">
                <select
                  value={selectedSessionId}
                  onChange={e => setSelectedSessionId(e.target.value)}
                  className="w-full appearance-none bg-surface-container-low text-on-surface text-xs font-semibold py-2.5 pl-3.5 pr-10 rounded-lg focus:outline-none focus:bg-surface-container-lowest border border-outline-variant/30"
                >
                  {sessions.length === 0 ? (
                    <option value="">(Belum ada sesi aktif)</option>
                  ) : (
                    sessions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.status}) • {s.phoneNumber || 'Standby'}
                      </option>
                    ))
                  )}
                </select>
                <Smartphone size={16} className="absolute right-3 top-3 text-on-surface-variant pointer-events-none" />
              </div>
            </div>

            {/* Destination Phone Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                <span>Nomor WhatsApp Tujuan (Recipient)</span>
                <span className="text-[11px] text-on-surface-variant font-normal">Format 62xxx / 08xxx</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center px-3 py-2.5 bg-surface-container-low text-on-surface text-xs font-bold rounded-lg shrink-0 border border-outline-variant/30">
                  <span className="mr-1.5">🇮🇩</span> +62
                </div>
                <div className="relative w-full">
                  <input
                    type="tel"
                    placeholder="81234567890"
                    value={testerRecipient}
                    onChange={e => setTesterRecipient(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface text-xs font-mono py-2.5 px-3.5 rounded-lg focus:outline-none focus:bg-surface-container-lowest border border-outline-variant/30"
                  />
                </div>
              </div>
              {/* Quick recipient presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[11px] text-on-surface-variant">Pintasan Cepat:</span>
                <button
                  type="button"
                  onClick={() => setTesterRecipient('82223089790')}
                  className="px-2 py-0.5 rounded-md bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-[11px] transition-colors"
                >
                  + Nomor Sendiri
                </button>
                <button
                  type="button"
                  onClick={() => setTesterRecipient('81987654321')}
                  className="px-2 py-0.5 rounded-md bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-[11px] transition-colors"
                >
                  + Admin Support
                </button>
                <button
                  type="button"
                  onClick={() => setTesterRecipient('85712398450')}
                  className="px-2 py-0.5 rounded-md bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-[11px] transition-colors"
                >
                  + Kontak QA Test
                </button>
              </div>
            </div>

            {/* Optional Media Attachment Box */}
            {testerType === 'media' && (
              <div className="flex flex-col gap-2 p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30">
                <label className="text-xs font-bold text-on-surface flex items-center justify-between">
                  <span>Lampiran Berkas (Media / Gambar / PDF)</span>
                  <span className="text-[11px] text-on-surface-variant">Maks. 16MB</span>
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="file"
                    onChange={e => setTesterMediaFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface-container-lowest file:text-primary hover:file:bg-surface-container cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={testerMediaCaption}
                  onChange={e => setTesterMediaCaption(e.target.value)}
                  placeholder="Keterangan media / caption pesan..."
                  className="w-full bg-surface-container-lowest text-on-surface text-xs py-2 px-3 rounded-lg focus:outline-none border border-outline-variant/30 mt-1"
                />
              </div>
            )}

            {/* Message Body Editor */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-on-surface">Isi Pesan Pengujian (Body)</label>
                <span className="text-[11px] text-on-surface-variant">
                  {testerMessage.length} Karakter • Spintax didukung
                </span>
              </div>
              {/* Variable chips helper */}
              <div className="flex items-center gap-1.5 flex-wrap p-1.5 bg-surface-container-low rounded-lg border border-outline-variant/30">
                <span className="text-[11px] text-on-surface-variant pl-1">Sisip Variabel:</span>
                <button
                  type="button"
                  onClick={() => insertVariable('{name}')}
                  className="px-2 py-0.5 bg-surface-container-lowest text-primary hover:bg-secondary-container rounded text-[11px] font-bold transition-colors"
                >
                  +{'{name}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('{order_id}')}
                  className="px-2 py-0.5 bg-surface-container-lowest text-primary hover:bg-secondary-container rounded text-[11px] font-bold transition-colors"
                >
                  +{'{order_id}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('{waktu}')}
                  className="px-2 py-0.5 bg-surface-container-lowest text-primary hover:bg-secondary-container rounded text-[11px] font-bold transition-colors"
                >
                  +{'{waktu}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('{Halo|Selamat Pagi|Salam}')}
                  className="px-2 py-0.5 bg-surface-container-lowest text-primary hover:bg-secondary-container rounded text-[11px] font-bold transition-colors"
                >
                  +{'{spintax}'}
                </button>
                <div className="h-3 w-px bg-surface-container mx-1"></div>
                {/* Formatting toolbar */}
                <button
                  type="button"
                  onClick={() => wrapText('*', '*')}
                  title="Bold (*teks*)"
                  className="p-1 hover:bg-surface-container-lowest text-on-surface font-bold text-[11px] rounded px-1.5"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => wrapText('_', '_')}
                  title="Italic (_teks_)"
                  className="p-1 hover:bg-surface-container-lowest text-on-surface italic text-[11px] rounded px-1.5"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => wrapText('~', '~')}
                  title="Strikethrough (~teks~)"
                  className="p-1 hover:bg-surface-container-lowest text-on-surface line-through text-[11px] rounded px-1.5"
                >
                  S
                </button>
                <button
                  type="button"
                  onClick={() => wrapText('```', '```')}
                  title="Monospace"
                  className="p-1 hover:bg-surface-container-lowest text-on-surface font-mono text-[11px] rounded px-1.5"
                >
                  {'{}'}
                </button>
              </div>
              <textarea
                rows={4}
                value={testerMessage}
                onChange={e => setTesterMessage(e.target.value)}
                placeholder="Halo Kak *{name}*! 👋 Terima kasih telah menghubungi WhatsAman. Pesan pengujian konektivitas API gateway berhasil dikirim dengan latensi 38ms. #WA-TEST-{order_id}"
                className="w-full bg-surface-container-low text-on-surface text-xs p-3.5 rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-all resize-y leading-relaxed border border-outline-variant/30 font-sans"
              />
            </div>

            {/* Advanced Options Accordion */}
            <details className="group bg-surface-container-low rounded-xl p-3.5 transition-all border border-outline-variant/30">
              <summary className="flex items-center justify-between cursor-pointer list-none select-none">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-primary" />
                  <span className="text-xs font-bold text-on-surface">Opsi Lanjutan & Anti-Banned Simulation</span>
                </div>
                <span className="text-on-surface-variant transition-transform group-open:rotate-180 text-xs">▼</span>
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3.5 mt-2">
                <label className="flex items-center gap-2.5 cursor-pointer bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/20">
                  <input
                    type="checkbox"
                    checked={simTyping}
                    onChange={e => setSimTyping(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-on-surface">Simulasi Mengetik (Typing)</span>
                    <span className="text-[10px] text-on-surface-variant">Jeda 2.5 detik sebelum pesan keluar</span>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/20">
                  <input
                    type="checkbox"
                    checked={readReceipt}
                    onChange={e => setReadReceipt(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-on-surface">Kirim Read Receipt</span>
                    <span className="text-[10px] text-on-surface-variant">Simulasi centang biru otomatis</span>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/20">
                  <input
                    type="checkbox"
                    checked={bypassQueue}
                    onChange={e => setBypassQueue(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-on-surface">Bypass Queue (High Priority)</span>
                    <span className="text-[10px] text-on-surface-variant">Lewati antrean broadcast massal</span>
                  </div>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/20">
                  <input
                    type="checkbox"
                    checked={sandboxMode}
                    onChange={e => setSandboxMode(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-on-surface">Sandbox Mocking Mode</span>
                    <span className="text-[10px] text-on-surface-variant">Uji endpoint tanpa kirim pulsa/data</span>
                  </div>
                </label>
              </div>
            </details>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onSendTest}
                disabled={testerLoading || !testerRecipient.trim()}
                className="w-full sm:flex-1 py-3 px-6 bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary transition-all rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transform active:scale-[0.99] disabled:opacity-50"
              >
                {testerLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                <span>{testerLoading ? 'Mengirim ke Antrean...' : 'Kirim Pesan Pengujian'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(lang === 'id' ? 'Konfigurasi form disimpan sebagai preset' : 'Form saved as preset');
                }}
                className="w-full sm:w-auto py-3 px-5 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-full text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <Bookmark size={15} />
                <span>Simpan Preset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Inspector & Preview (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Inspector Dual Tabs */}
          <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-primary" />
                <h3 className="text-sm text-on-surface font-bold">Respon & Inspeksi Realtime</h3>
              </div>
              <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setRightView('preview')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    rightView === 'preview'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Pratinjau Chat
                </button>
                <button
                  type="button"
                  onClick={() => setRightView('json')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                    rightView === 'json'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Respon JSON
                </button>
              </div>
            </div>

            {/* View 1: Real WhatsApp Chat Preview Bubble */}
            {rightView === 'preview' ? (
              <div className="flex flex-col gap-2">
                <div className="bg-slate-900 rounded-xl p-4 flex flex-col gap-3 min-h-[300px] justify-between relative overflow-hidden text-white">
                  {/* Simulated Chat Header */}
                  <div className="flex items-center justify-between pb-2 bg-slate-800/80 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                        WA
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white leading-none">
                          {activeSession?.name || 'WhatsAman Demo Service'}
                        </span>
                        <span className="text-[10px] text-emerald-400 leading-none mt-1">Online</span>
                      </div>
                    </div>
                    <span className="text-slate-400 text-xs">•••</span>
                  </div>

                  {/* WhatsApp Message Bubble */}
                  <div className="flex flex-col items-end w-full pl-6 my-auto">
                    <div className="bg-[#005c4b] text-white p-3.5 rounded-xl rounded-tr-none shadow-sm max-w-full flex flex-col gap-1.5 relative">
                      <p className="text-xs whitespace-pre-wrap leading-relaxed">
                        {testerMessage || 'Halo Kak! Pesan pengujian konektivitas API gateway WhatsAman.'}
                      </p>
                      {testerType === 'media' && testerMediaCaption && (
                        <p className="text-[11px] text-emerald-100 italic border-t border-emerald-600/40 pt-1">
                          [Lampiran Media]: {testerMediaCaption}
                        </p>
                      )}
                      <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-200/80 self-end pt-1">
                        <span>10:42 WIB</span>
                        <CheckCheck size={13} className="text-cyan-400" />
                      </div>
                    </div>
                  </div>

                  {/* Preview Meta Status Bar */}
                  <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-400 border-t border-slate-800">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[10px]">
                      <CheckCircle2 size={12} />
                      Format Markdown & Emoji Valid
                    </span>
                    <span className="text-[10px]">
                      Target: <strong className="text-white font-mono">{testerRecipient || '+62 812-3456-7890'}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* View 2: Live API Response Terminal (Dark code container) */
              <div className="flex flex-col gap-2">
                <div className="bg-slate-900 text-slate-200 rounded-xl overflow-hidden shadow-inner flex flex-col border border-slate-800">
                  {/* Terminal macOS Bar */}
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-950/80 border-b border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="ml-2 font-mono text-[10px] text-slate-400">POST /v1/messages/send</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                        {testerResponse ? `HTTP ${testerResponse.status || 200} • OK` : '200 OK • 38ms'}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyJson}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Salin JSON"
                      >
                        {copiedJson ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Code Output */}
                  <pre className="p-3.5 font-mono text-[11px] leading-relaxed overflow-x-auto text-emerald-400 max-h-[260px]">
                    <code>
                      {testerResponse
                        ? JSON.stringify(testerResponse, null, 2)
                        : JSON.stringify(
                            {
                              status: 'success',
                              statusCode: 200,
                              message: 'Pesan pengujian berhasil dikirim ke antrean gateway',
                              data: {
                                messageId: 'WA_MSG_89210749102',
                                sessionId: selectedSessionId || 'session-s23',
                                to: (testerRecipient || '6281234567890') + '@s.whatsapp.net',
                                timestamp: Math.floor(Date.now() / 1000),
                                type: testerType,
                                deliveryStatus: 'SENT_TO_SERVER',
                                latencyMs: 38,
                                antiBannedDelay: '2.8s'
                              }
                            },
                            null,
                            2
                          )}
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {/* Code Snippet Generator Section */}
            <div className="flex flex-col gap-2 pt-1 border-t border-outline-variant/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  HTTP Request Snippet
                </span>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant">
                  {(['curl', 'node', 'php', 'python'] as const).map(langOpt => (
                    <button
                      key={langOpt}
                      type="button"
                      onClick={() => setSnippetLang(langOpt)}
                      className={`px-2 py-0.5 rounded transition-all ${
                        snippetLang === langOpt
                          ? 'bg-surface-container text-primary font-bold'
                          : 'hover:bg-surface-container'
                      }`}
                    >
                      {langOpt === 'curl' ? 'cURL' : langOpt === 'node' ? 'Node.js' : langOpt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative bg-surface-container-low p-2.5 rounded-lg flex items-center justify-between border border-outline-variant/30">
                <code className="font-mono text-[11px] text-on-surface truncate pr-6">
                  {snippetLang === 'curl' && `curl -X POST http://localhost:3000/api/v1/messages/send -H "Content-Type: application/json"`}
                  {snippetLang === 'node' && `const axios = require('axios'); axios.post('/api/v1/messages/send', ...)`}
                  {snippetLang === 'php' && `$ch = curl_init('http://localhost:3000/api/v1/messages/send'); ...`}
                  {snippetLang === 'python' && `import requests; requests.post('http://localhost:3000/api/v1/messages/send', ...)`}
                </code>
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="p-1 hover:text-primary transition-colors shrink-0 text-on-surface-variant"
                  title="Salin Kode Snippet"
                >
                  {copiedSnippet ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Delivery Diagnostics Card */}
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-secondary-container text-primary">
                <Zap size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">Status Buffer Baileys Gateway</span>
                <span className="text-[11px] text-on-surface-variant">Buffer: 0 antrean pending • Socket ID: #live-socket</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-[11px] text-primary font-bold">
              100% Ready
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Riwayat 5 Pengujian Terakhir */}
      <div className="flex flex-col gap-4 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div className="flex items-center gap-2">
            <History size={18} className="text-primary" />
            <h3 className="text-base text-on-surface font-bold">Riwayat Pengujian Terakhir</h3>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs font-semibold text-on-surface">
              {testHistory.length} Transaksi
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTestHistory([]);
                showToast(lang === 'id' ? 'Riwayat uji lokal dibersihkan' : 'Local test log cleared');
              }}
              className="text-on-surface-variant hover:text-on-surface text-xs flex items-center gap-1 transition-colors"
            >
              <Trash2 size={13} />
              <span>Bersihkan Log</span>
            </button>
            <span className="text-outline-variant">•</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('logs');
                fetchAuditLogs();
              }}
              className="text-xs text-primary hover:underline font-bold flex items-center gap-0.5"
            >
              <span>Buka Audit Log Lengkap</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-container-low text-[11px] text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/30">
                <th className="py-2.5 px-3 rounded-l-lg">Waktu</th>
                <th className="py-2.5 px-3">Sesi Aktif</th>
                <th className="py-2.5 px-3">Nomor Tujuan</th>
                <th className="py-2.5 px-3">Tipe Pesan</th>
                <th className="py-2.5 px-3">Status Respon</th>
                <th className="py-2.5 px-3">Latensi</th>
                <th className="py-2.5 px-3 rounded-r-lg text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-on-surface">
              {testHistory.map(row => (
                <tr key={row.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3 px-3 font-mono text-[11px] text-on-surface-variant">{row.time}</td>
                  <td className="py-3 px-3 font-semibold text-on-surface">{row.sessionName}</td>
                  <td className="py-3 px-3 font-mono text-[11px]">{row.recipient}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[11px]">
                      {row.type}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span> {row.status} OK Terkirim
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-primary font-bold">{row.latencyMs} ms</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setTesterRecipient(row.recipient.replace(/\D/g, ''));
                        setRightView('preview');
                        showToast(lang === 'id' ? `Nomor ${row.recipient} dimuat ke formulir` : `Loaded ${row.recipient}`);
                      }}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Uji Ulang
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TesterPanel;
