// src/components/Uhih.tsx
import { useState, createContext, useContext, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

// ─── Utilidad para combinar clases limpiamente ────────────────────────────────
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// ══════════════════════════════════════════════════════════════════════════════
// CARD (Tarjetas estilo Mercury)
// ══════════════════════════════════════════════════════════════════════════════
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export function Card({ children, className, padding = 'lg', hoverable, ...props }: CardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8', // Aumentamos el padding base para más "aire" premium
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-[#0A0A0A] rounded-2xl ring-1 ring-gray-200 dark:ring-gray-800 shadow-sm",
        paddingClasses[padding],
        hoverable && "transition-all duration-300 hover:shadow-md hover:ring-gray-300 dark:hover:ring-gray-700 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BUTTON (Con micro-interacciones)
// ══════════════════════════════════════════════════════════════════════════════
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children, variant = 'primary', size = 'md', loading, icon, fullWidth, className, disabled, ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap active:scale-[0.98]";
  
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-sm", // Estilo Linear (blanco/negro puro)
    secondary: "bg-white text-gray-900 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 dark:bg-[#121212] dark:text-gray-100 dark:ring-gray-800 dark:hover:bg-[#1A1A1A]",
    ghost: "hover:bg-gray-100 dark:hover:bg-[#1A1A1A] text-gray-700 dark:text-gray-300",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 ring-1 ring-inset ring-red-200 dark:ring-red-900/50",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs rounded-md gap-1.5",
    md: "h-10 px-4 py-2 text-sm rounded-lg gap-2",
    lg: "h-12 px-6 text-base rounded-xl gap-2",
  };

  return (
    <button className={cn(baseStyles, variants[variant], sizes[size], fullWidth && "w-full", className)} disabled={disabled || loading} {...props}>
      {loading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BADGE
// ══════════════════════════════════════════════════════════════════════════════
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  dot?: boolean;
}

export function Badge({ children, variant = 'default', dot, className, ...props }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 ring-gray-200 dark:ring-gray-700",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-500/20",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 ring-amber-200 dark:ring-amber-500/20",
    danger: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 ring-red-200 dark:ring-red-500/20",
    info: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ring-blue-200 dark:ring-blue-500/20",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 ring-purple-200 dark:ring-purple-500/20",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ring-1 ring-inset gap-1.5", variants[variant], className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
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
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0A0A0A]/50">
      {icon && <div className="text-gray-400 dark:text-gray-600 mb-4">{icon}</div>}
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOAST SYSTEM (Efecto Glassmorphism)
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
  success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  info: <Info className="w-4 h-4 text-blue-500" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md animate-in slide-in-from-right-8 fade-in duration-300">
            <span className="shrink-0 mt-0.5">{TOAST_ICONS[t.type]}</span>
            <p className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{t.message}</p>
            <button onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SKELETON
// ══════════════════════════════════════════════════════════════════════════════
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-800", className)} {...props} />;
}