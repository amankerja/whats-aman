// Toast notification system — in-app replacement for alert()/confirm()
// Prevents WebView quirks (blocking native dialogs in Tauri) and matches app styling.

import React from 'react';

export type ToastType = 'info' | 'success' | 'warn' | 'error';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  leaving?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextValue>({ showToast: () => {} });

export function useToast(): ToastContextValue {
  return React.useContext(ToastContext);
}

let nextToastId = 1;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const timersRef = React.useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = React.useCallback((id: number) => {
    // Mark as leaving so we can animate out before unmount
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, leaving: true } : t)));
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timersRef.current.delete(id);
    }, 250);
    const existing = timersRef.current.get(id);
    if (existing) clearTimeout(existing);
    timersRef.current.set(id, timer);
  }, []);

  const showToast = React.useCallback((message: string, type: ToastType = 'info') => {
    const id = nextToastId++;
    setToasts(prev => {
      // Cap visible toasts so a burst of errors cannot flood the screen
      const next = [...prev, { id, type, message }];
      return next.length > 5 ? next.slice(next.length - 5) : next;
    });
    const timer = setTimeout(() => removeToast(id), 4500);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(t => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const icons: Record<ToastType, React.ReactNode> = {
    info: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    success: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="8.5 12.5 11 15 15.5 9.5" />
      </svg>
    ),
    warn: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    error: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    )
  };

  const accentColors: Record<ToastType, string> = {
    info: '#0ea5e9',
    success: '#10b981',
    warn: '#f59e0b',
    error: '#ef4444'
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-viewport" role="status" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast-item toast-${t.type}${t.leaving ? ' toast-leaving' : ''}`}
            style={{ borderLeftColor: accentColors[t.type] }}
            onClick={() => removeToast(t.id)}
          >
            <span className="toast-icon" style={{ color: accentColors[t.type] }}>{icons[t.type]}</span>
            <span className="toast-message">{t.message}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Tutup notifikasi"
              onClick={(e) => { e.stopPropagation(); removeToast(t.id); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Confirm dialog promise-based replacement for window.confirm()
// ---------------------------------------------------------------------------
interface ConfirmState {
  open: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  resolve?: (value: boolean) => void;
}

let resolveConfirm: ((value: boolean) => void) | null = null;

export const ConfirmDialogHost: React.FC = () => {
  const [state, setState] = React.useState<ConfirmState>({
    open: false,
    message: '',
    confirmLabel: 'Ya',
    cancelLabel: 'Batal',
    danger: false
  });

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ConfirmState>).detail;
      resolveConfirm = detail.resolve ?? null;
      setState({ ...detail });
    };
    window.addEventListener('app-confirm', handler as EventListener);
    return () => window.removeEventListener('app-confirm', handler as EventListener);
  }, []);

  const close = (result: boolean) => {
    resolveConfirm?.(result);
    resolveConfirm = null;
    setState(prev => ({ ...prev, open: false }));
  };

  if (!state.open) return null;

  return (
    <div className="modal-overlay" onClick={() => close(false)}>
      <div className="modal" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Konfirmasi</h2>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', lineHeight: 1.55, color: 'var(--text-secondary, #475569)', whiteSpace: 'pre-line' }}>
            {state.message}
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={() => close(false)}>
            {state.cancelLabel}
          </button>
          <button
            type="button"
            className={state.danger ? 'btn-danger' : 'btn-primary'}
            onClick={() => close(true)}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export function appConfirm(
  message: string,
  options?: { confirmLabel?: string; cancelLabel?: string; danger?: boolean }
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const event = new CustomEvent<ConfirmState>('app-confirm', {
      detail: {
        open: true,
        message,
        confirmLabel: options?.confirmLabel ?? 'Ya, Lanjutkan',
        cancelLabel: options?.cancelLabel ?? 'Batal',
        danger: options?.danger ?? false,
        resolve
      }
    });
    window.dispatchEvent(event);
  });
}
