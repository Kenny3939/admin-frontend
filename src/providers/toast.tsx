import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, opts?: { type?: ToastType; title?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function genId() {
  return Math.random().toString(36).slice(2);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback<ToastContextValue['toast']>((message, opts) => {
    const t: Toast = { id: genId(), type: opts?.type ?? 'info', title: opts?.title, message };
    setToasts(prev => [...prev, t]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== t.id));
    }, 4500);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          width: 'min(420px, calc(100vw - 32px))',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => {
          const cfg = {
            success: { bg: 'var(--success-light)', border: 'var(--success)', text: 'var(--success)' },
            error: { bg: 'var(--danger-light)', border: 'var(--danger)', text: 'var(--danger)' },
            warning: { bg: 'var(--warning-light)', border: 'var(--warning)', text: 'var(--warning)' },
            info: { bg: 'var(--accent-light)', border: 'var(--accent)', text: 'var(--accent-text)' },
          }[t.type];
          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                backgroundColor: 'var(--bg-card)',
                border: `1px solid var(--border)`,
                borderLeft: `4px solid ${cfg.border}`,
                borderRadius: 14,
                boxShadow: 'var(--shadow-lg)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                backdropFilter: 'blur(8px)',
              }}
            >
              {t.title && (
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t.title}
                </div>
              )}
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                {t.message}
              </div>
              <div style={{ height: 2, borderRadius: 999, backgroundColor: cfg.bg }} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

