// Chat UI components extracted from App.tsx (refactor stage 1)

import React, { useState, useEffect } from 'react';
import { Users, Radio, Smartphone, Paperclip, Smile, Send, CheckCheck, Mic, Video, FileText, Image, Clock, AlertCircle } from 'lucide-react';
import type { ChatMessage } from '../types';
import { getAvatarBgColor } from '../utils/format';

interface ChatAvatarProps {
  sessionId?: string;
  jid?: string;
  name?: string;
  isGroup?: boolean;
  isNewsletter?: boolean;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

const loadedAvatarUrls = new Set<string>();
const failedAvatarUrls = new Map<string, number>();

function isAvatarFailed(url: string): boolean {
  const failedAt = failedAvatarUrls.get(url);
  if (!failedAt) return false;
  if (Date.now() - failedAt > 30000) {
    failedAvatarUrls.delete(url);
    return false;
  }
  return true;
}

export const ChatAvatar: React.FC<ChatAvatarProps> = React.memo(({
  sessionId,
  jid,
  name,
  isGroup,
  isNewsletter,
  className = 'chat-avatar',
  size = 18,
  style
}) => {
  const isValidAvatarJid = Boolean(
    jid &&
    jid !== '0' &&
    !jid.startsWith('0@') &&
    jid !== 'status@broadcast' &&
    !jid.includes('@broadcast')
  );
  const avatarUrl = sessionId && isValidAvatarJid ? `/api/v1/sessions/${sessionId}/avatar?jid=${encodeURIComponent(jid)}` : null;

  const [hasError, setHasError] = useState(() => avatarUrl ? isAvatarFailed(avatarUrl) : false);
  const [isLoaded, setIsLoaded] = useState(() => avatarUrl ? loadedAvatarUrls.has(avatarUrl) : false);

  useEffect(() => {
    if (!avatarUrl) {
      setHasError(false);
      setIsLoaded(false);
      return;
    }
    if (loadedAvatarUrls.has(avatarUrl)) {
      setIsLoaded(true);
      setHasError(false);
    } else if (isAvatarFailed(avatarUrl)) {
      setIsLoaded(false);
      setHasError(true);
    } else {
      setHasError(false);
    }
  }, [avatarUrl]);

  const displayName = name || jid || '';
  const bgColor = isGroup ? '#e2e8f0' : isNewsletter ? '#fef3c7' : getAvatarBgColor(displayName);
  const textColor = isGroup ? '#475569' : isNewsletter ? '#b45309' : '#ffffff';

  return (
    <div
      className={`chat-avatar rounded-full ${className || ''} privacy-blur-pic`}
      style={{
        backgroundColor: isLoaded && !hasError ? 'transparent' : bgColor,
        color: textColor,
        fontWeight: 700,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        contain: 'paint layout',
        ...style
      }}
    >
      {avatarUrl && !hasError && (
        <img
          src={avatarUrl}
          alt={displayName}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth <= 1 && img.naturalHeight <= 1) {
              failedAvatarUrls.set(avatarUrl, Date.now());
              loadedAvatarUrls.delete(avatarUrl);
              setHasError(true);
              setIsLoaded(false);
            } else {
              loadedAvatarUrls.add(avatarUrl);
              failedAvatarUrls.delete(avatarUrl);
              setIsLoaded(true);
              setHasError(false);
            }
          }}
          onError={() => {
            failedAvatarUrls.set(avatarUrl, Date.now());
            loadedAvatarUrls.delete(avatarUrl);
            setHasError(true);
            setIsLoaded(false);
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            opacity: isLoaded && !hasError ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
            zIndex: 1
          }}
        />
      )}
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          opacity: isLoaded && !hasError ? 0 : 1,
          transition: 'opacity 0.2s ease-in-out'
        }}
      >
        {isGroup ? (
          <Users size={size} />
        ) : isNewsletter ? (
          <Radio size={size} />
        ) : displayName && !displayName.startsWith('+') && displayName !== jid ? (
          displayName.slice(0, 2).toUpperCase()
        ) : (
          <Smartphone size={size} />
        )}
      </span>
    </div>
  );
});

interface ChatInputBoxProps {
  onSend: (text: string) => void;
  onAttach: () => void;
  disabled?: boolean;
  placeholder?: string;
  sendTitle?: string;
  attachTitle?: string;
  value?: string;
  onChange?: (val: string) => void;
}

export const ChatInputBox: React.FC<ChatInputBoxProps> = React.memo(({
  onSend,
  onAttach,
  disabled = false,
  placeholder,
  sendTitle,
  attachTitle,
  value,
  onChange,
}) => {
  // Ultra-responsive local draft state: keystrokes reflect immediately with 0ms latency
  const [text, setText] = useState(value || '');

  // Synchronize when external value changes (e.g. quick reply selected or cleared)
  useEffect(() => {
    if (value !== undefined) {
      setText(value);
    }
  }, [value]);

  const handleTextChange = (val: string) => {
    setText(val);
    if (onChange) {
      onChange(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = text.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setText('');
      if (onChange) onChange('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (onChange) onChange('');
  };

  return (
    <div className="room-input-footer">
      <form className="input-form" onSubmit={handleSubmit}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn-input-accessory"
            title="Emoji"
            onClick={() => handleTextChange(text + ' 😊')}
          >
            <Smile size={20} />
          </button>
          <button
            type="button"
            className="btn-input-accessory"
            title={attachTitle || 'Lampirkan File'}
            onClick={onAttach}
          >
            <Paperclip size={20} />
          </button>
        </div>
        <textarea
          rows={1}
          placeholder={placeholder || 'Ketik pesan balasan... (Tekan Enter untuk kirim, Shift+Enter untuk baris baru)'}
          value={text}
          onChange={e => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="message-text-input"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="btn-send-message"
          title={sendTitle || 'Kirim'}
        >
          <Send size={18} style={{ marginLeft: '2px' }} />
        </button>
      </form>
    </div>
  );
});

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  showDateSeparator: boolean;
  dateSeparatorText?: string;
  senderDisplayName?: string;
  isGroupChat: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = React.memo(({
  message: m,
  isMe,
  showDateSeparator,
  dateSeparatorText,
  senderDisplayName,
  isGroupChat
}) => {
  return (
    <React.Fragment key={m.id}>
      {showDateSeparator && dateSeparatorText && (
        <div className="chat-date-separator">
          <span>{dateSeparatorText}</span>
        </div>
      )}
      <div className={`message-bubble-wrapper ${isMe ? 'outgoing' : 'incoming'}`}>
        <div className={`message-bubble ${isMe ? 'outgoing' : 'incoming'} privacy-blur-message`}>
          {!isMe && isGroupChat && senderDisplayName && (
            <div className="message-sender privacy-blur-name">
              {senderDisplayName}
            </div>
          )}
          {m.media_url && m.media_type === 'audio' && (
            <div className="chat-audio-media privacy-blur-message">
              <audio controls preload="metadata" className="chat-audio-player" src={m.media_url}>
                Browser tidak mendukung pemutar audio.
              </audio>
            </div>
          )}
          {m.media_url && m.media_type === 'video' && (
            <div className="chat-video-media privacy-blur-message">
              <video controls preload="metadata" className="chat-video-player" src={m.media_url}>
                Browser tidak mendukung pemutar video.
              </video>
            </div>
          )}
          {m.media_url && m.media_type === 'document' && (
            <div className="chat-document-media privacy-blur-message">
              <a href={m.media_url} target="_blank" rel="noreferrer" download className="chat-doc-card">
                <FileText size={26} className="chat-doc-icon" />
                <div className="chat-doc-info">
                  <span className="chat-doc-name">{m.caption || 'Dokumen File'}</span>
                  <span className="chat-doc-action">Klik untuk Mengunduh</span>
                </div>
              </a>
            </div>
          )}
          {m.media_url && (m.media_type === 'image' || m.media_type === 'sticker' || !m.media_type) && (
            <div style={{ marginBottom: '0.375rem', borderRadius: '8px', overflow: 'hidden' }}>
              <img
                src={m.media_url}
                alt="Media message"
                className={`${m.media_type === 'sticker' ? 'chat-sticker-media' : 'chat-image-media'} privacy-blur-message`}
                onClick={() => window.open(m.media_url, '_blank')}
              />
            </div>
          )}
          {!m.media_url && m.media_type && (
            <div className="chat-media-badge privacy-blur-message">
              {m.media_type === 'audio' ? <Mic size={14} /> : m.media_type === 'video' ? <Video size={14} /> : m.media_type === 'document' ? <FileText size={14} /> : <Image size={14} />}
              <span>{m.media_type === 'audio' ? 'Voice Note' : m.media_type === 'video' ? 'Video' : m.media_type === 'document' ? 'Dokumen' : 'Foto'}</span>
            </div>
          )}
          <div className="message-text privacy-blur-message">{m.content_text || m.caption}</div>
          <div className="message-meta">
            <span className="message-time">
              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isMe && (
              m.status === 'PENDING' ? (
                <Clock size={12} className="message-status-icon text-slate-400" />
              ) : m.status === 'FAILED' ? (
                <AlertCircle size={12} className="message-status-icon text-rose-500" />
              ) : (
                <CheckCheck
                  size={14}
                  className={`message-status-icon ${m.status === 'READ' ? 'read' : ''}`}
                />
              )
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
});
