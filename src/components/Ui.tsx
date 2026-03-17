// src/components/ui.tsx
// ─── Componentes base del sistema de diseño ───────────────────────────────────
// Importa de aquí en lugar de crear estilos inline en cada vista.

import { useState, createContext, useContext, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { colors, radius, shadow, typography } from '../theme';

// ══════════════════════════════════════════════════════════════════════════════
// CARD
// ══════════════════════════════════════════════════════════════════════════════
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = '', padding = 'lg', onClick, hoverable }: CardProps) {
  const pad = { none: '0', sm: '12px', md: '16px', lg: '20px' }[padding];
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        boxShadow: shadow.sm,
        padding: pad,
        cursor: onClick ? 'pointer' : 'default',
        transition: hoverable ? 'box-shadow 0.15s, border-color 0.15s' : undefined,
      }}
      onMouseEnter={hoverable && onClick ? e => {
        (e.currentTarget as HTMLElement).style.boxShadow = shadow.md;
        (e.currentTarget as HTMLElement).style.borderColor = colors.borderStrong;
      } : undefined}
      onMouseLeave={hoverable && onClick ? e => {
        (e.currentTarget as HTMLElement).style.boxShadow = shadow.sm;
        (e.currentTarget as HTMLElement).style.borderColor = colors.border;
      } : undefined}
    >
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BUTTON
// ══════════════════════════════════════════════════════════════════════════════
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
}

export function Button({
  children, onClick, variant = 'primary', size = 'md',
  disabled, loading, icon, fullWidth, type = 'button',
}: ButtonProps) {
  const styles: Record<ButtonVariant, React.CSSProperties> = {
    primary:   { backgroundColor: colors.accent,     color: '#fff',              border: 'none' },
    secondary: { backgroundColor: colors.bgSubtle,   color: colors.textPrimary,  border: `1px solid ${colors.border}` },
    ghost:     { backgroundColor: 'transparent',      color: colors.textSecondary, border: 'none' },
    danger:    { backgroundColor: colors.dangerLight, color: colors.danger,       border: `1px solid #FECACA` },
  };

  const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary:   { backgroundColor: colors.accentHover },
    secondary: { backgroundColor: colors.bgMuted },
    ghost:     { backgroundColor: colors.bgSubtle, color: colors.textPrimary },
    danger:    { backgroundColor: '#FEE2E2' },
  };

  const sizes: Record<ButtonSize, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: typography.sm, borderRadius: radius.md },
    md: { padding: '8px 16px', fontSize: typography.base, borderRadius: radius.lg },
    lg: { padding: '11px 20px', fontSize: typography.md, borderRadius: radius.lg },
  };

  const [hovered, setHovered] = useState(false);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...styles[variant],
        ...(hovered && !disabled && !loading ? hoverStyles[variant] : {}),
        ...sizes[size],
        fontFamily: typography.fontFamily,
        fontWeight: typography.semibold,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: fullWidth ? '100%' : undefined,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
        outline: 'none',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {loading ? (
        <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
      ) : icon}
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BADGE
// ══════════════════════════════════════════════════════════════════════════════
interface BadgeProps {
  children: React.ReactNode;
  bg: string;
  text: string;
  dot?: string;
}

export function Badge({ children, bg, text, dot }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      backgroundColor: bg, color: text,
      padding: '3px 8px', borderRadius: radius.full,
      fontSize: typography.xs, fontWeight: typography.semibold,
      whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: dot, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// EMPTY STATE
// ══════════════════════════════════════════════════════════════════════════════
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', textAlign: 'center',
      border: `2px dashed ${colors.border}`, borderRadius: radius.xl,
      backgroundColor: colors.bgSubtle,
    }}>
      {icon && (
        <div style={{ color: colors.textDisabled, marginBottom: '12px', fontSize: '32px' }}>
          {icon}
        </div>
      )}
      <p style={{ fontWeight: typography.semibold, color: colors.textPrimary, fontSize: typography.base, margin: 0 }}>
        {title}
      </p>
      {description && (
        <p style={{ color: colors.textMuted, fontSize: typography.sm, marginTop: '4px', maxWidth: '280px' }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE HEADER
// ══════════════════════════════════════════════════════════════════════════════
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon, action }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icon && (
          <div style={{
            width: 36, height: 36, borderRadius: radius.lg,
            backgroundColor: colors.accentLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: colors.accent, flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: typography.xl, fontWeight: typography.bold, color: colors.textPrimary, lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ margin: '2px 0 0', fontSize: typography.sm, color: colors.textMuted }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TABS
// ══════════════════════════════════════════════════════════════════════════════
interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div style={{
      display: 'inline-flex', gap: '2px',
      backgroundColor: colors.bgSubtle,
      padding: '3px', borderRadius: radius.lg,
      border: `1px solid ${colors.border}`,
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '6px 14px',
            borderRadius: radius.md,
            fontSize: typography.sm,
            fontWeight: typography.semibold,
            fontFamily: typography.fontFamily,
            border: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            backgroundColor: active === tab.id ? colors.bgCard : 'transparent',
            color: active === tab.id ? colors.textPrimary : colors.textMuted,
            boxShadow: active === tab.id ? shadow.sm : 'none',
            transition: 'all 0.15s',
          }}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span style={{
              backgroundColor: active === tab.id ? colors.accentLight : colors.bgMuted,
              color: active === tab.id ? colors.accent : colors.textMuted,
              fontSize: '11px', fontWeight: typography.bold,
              padding: '1px 6px', borderRadius: radius.full,
            }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOAST SYSTEM
// ══════════════════════════════════════════════════════════════════════════════
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={15} />,
  error:   <XCircle size={15} />,
  warning: <AlertTriangle size={15} />,
  info:    <Info size={15} />,
};

const TOAST_COLORS: Record<ToastType, { bg: string; text: string; border: string; icon: string }> = {
  success: { bg: colors.successLight, text: colors.success,  border: '#BBF7D0', icon: colors.success },
  error:   { bg: colors.dangerLight,  text: colors.danger,   border: '#FECACA', icon: colors.danger },
  warning: { bg: colors.warningLight, text: colors.warning,  border: '#FDE68A', icon: colors.warning },
  info:    { bg: colors.infoLight,    text: colors.info,     border: '#BAE6FD', icon: colors.info },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  function dismiss(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        zIndex: 9999, maxWidth: '360px',
      }}>
        {toasts.map(t => {
          const c = TOAST_COLORS[t.type];
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              backgroundColor: c.bg, border: `1px solid ${c.border}`,
              borderRadius: radius.lg, padding: '12px 14px',
              boxShadow: shadow.lg, color: c.text,
              fontSize: typography.sm, fontWeight: typography.medium,
              fontFamily: typography.fontFamily,
              animation: 'slideInRight 0.2s ease',
            }}>
              <span style={{ color: c.icon, flexShrink: 0, marginTop: '1px' }}>{TOAST_ICONS[t.type]}</span>
              <span style={{ flex: 1 }}>{t.message}</span>
              <button onClick={() => dismiss(t.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: c.text, opacity: 0.6, padding: '0', flexShrink: 0,
                lineHeight: 1,
              }}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SKELETON (loading placeholder)
// ══════════════════════════════════════════════════════════════════════════════
export function Skeleton({ width = '100%', height = '16px', borderRadius = radius.md }: {
  width?: string; height?: string; borderRadius?: string;
}) {
  return (
    <div style={{
      width, height, borderRadius,
      backgroundColor: colors.bgMuted,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}
