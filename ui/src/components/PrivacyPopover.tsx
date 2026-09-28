import React, { useEffect, useRef } from 'react';
import { Eye, EyeOff, X, Shield, Check, Sparkles } from 'lucide-react';
import type { PrivacySettings } from '../types';

interface PrivacyPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  privacyMode: boolean;
  setPrivacyMode: React.Dispatch<React.SetStateAction<boolean>>;
  privacySettings: PrivacySettings;
  setPrivacySettings: React.Dispatch<React.SetStateAction<PrivacySettings>>;
}

export const PrivacyPopover: React.FC<PrivacyPopoverProps> = ({
  isOpen,
  onClose,
  privacyMode,
  setPrivacyMode,
  privacySettings,
  setPrivacySettings
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleSetting = (key: keyof PrivacySettings) => {
    setPrivacySettings(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('whatsaman_privacy_settings', JSON.stringify(next));

      // If turning an option ON and privacyMode is currently OFF, turn privacyMode ON
      if (!prev[key] && !privacyMode) {
        setPrivacyMode(true);
        localStorage.setItem('whatsaman_privacy', 'true');
      }
      return next;
    });
  };

  const toggleMaster = () => {
    setPrivacyMode(prev => {
      const next = !prev;
      localStorage.setItem('whatsaman_privacy', String(next));
      return next;
    });
  };

  const handleSelectAll = (enable: boolean) => {
    const nextSettings: PrivacySettings = {
      blurPics: enable,
      blurRecentChats: enable,
      blurChatNames: enable,
      blurChatMessages: enable
    };
    setPrivacySettings(nextSettings);
    localStorage.setItem('whatsaman_privacy_settings', JSON.stringify(nextSettings));
    if (enable && !privacyMode) {
      setPrivacyMode(true);
      localStorage.setItem('whatsaman_privacy', 'true');
    }
  };

  const options: Array<{
    key: keyof PrivacySettings;
    title: string;
    description: string;
  }> = [
    {
      key: 'blurPics',
      title: 'Blur Contact Pics',
      description: 'Samarkan foto profil, avatar kontak & ikon grup'
    },
    {
      key: 'blurRecentChats',
      title: 'Blur Recent Chats',
      description: 'Samarkan cuplikan pesan terakhir di daftar obrolan'
    },
    {
      key: 'blurChatNames',
      title: 'Blur Chat Names',
      description: 'Samarkan nama kontak, nomor telepon, dan judul grup'
    },
    {
      key: 'blurChatMessages',
      title: 'Blur Chat Messages',
      description: 'Samarkan isi gelembung pesan, media, dan lampiran'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[2px] animate-fadeIn">
      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[14px] border border-slate-200 dark:border-slate-800 shadow-2xl p-5 text-slate-800 dark:text-slate-100 animate-scaleUp transition-all"
        style={{
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shield size={18} />
            </div>
            <div>
              <h2 id="privacy-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Privacy
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Mode Privasi & Sembunyikan Data
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Tutup (Esc)"
          >
            <X size={17} />
          </button>
        </div>

        {/* Master Switch Bar */}
        <div className="my-3.5 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                privacyMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                {privacyMode ? 'Privasi Aktif' : 'Privasi Nonaktif'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Shortcut: Alt + P</span>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={privacyMode}
            onClick={toggleMaster}
            className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
              privacyMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
            title="Toggle Master Privasi (Alt + P)"
          >
            <span
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out transform ${
                privacyMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 4 Privacy Toggles matching the screenshot */}
        <div className="flex flex-col gap-2.5 py-1">
          {options.map(opt => {
            const isChecked = privacySettings[opt.key];
            const isVisuallyActive = privacyMode && isChecked;

            return (
              <div
                key={opt.key}
                role="button"
                tabIndex={0}
                onClick={() => toggleSetting(opt.key)}
                onKeyDown={e => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggleSetting(opt.key);
                  }
                }}
                className={`flex items-center gap-3.5 p-2 rounded-xl transition-all select-none cursor-pointer border ${
                  isVisuallyActive
                    ? 'border-blue-100 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/20'
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Switch toggle on left, matching user screenshot */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isChecked}
                  onClick={e => {
                    e.stopPropagation();
                    toggleSetting(opt.key);
                  }}
                  className={`flex-shrink-0 w-10 h-5 rounded-full transition-colors flex items-center p-0.5 focus:outline-none ${
                    isChecked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out transform ${
                      isChecked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Text Label on right */}
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <span
                    className={`text-sm font-semibold tracking-tight ${
                      isChecked
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.title}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {opt.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick select all / none */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-[11px]"
            >
              Aktifkan Semua
            </button>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 text-[11px]"
            >
              Matikan Semua
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold rounded-lg text-[11px] hover:bg-slate-800 transition-colors"
          >
            Selesai
          </button>
        </div>

        {/* Hover Hint Info */}
        <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5 leading-snug">
          <span className="text-amber-500 font-bold">💡</span>
          <span>
            Arahkan kursor tetikus (<strong>hover</strong>) pada elemen yang diblur untuk mengintip tampilan aslinya secara instan.
          </span>
        </div>
      </div>
    </div>
  );
};
