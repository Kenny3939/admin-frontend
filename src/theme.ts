// src/theme.ts
// ─── Design tokens via CSS variables ─────────────────────────────────────────
// Todos los valores referencian las variables definidas en index.css.
// Al cambiar data-theme en <html>, todos los colores cambian automáticamente.

export const colors = {
  bgPage:        'var(--bg-page)',
  bgCard:        'var(--bg-card)',
  bgSubtle:      'var(--bg-subtle)',
  bgMuted:       'var(--bg-muted)',
  bgHover:       'var(--bg-hover)',

  textPrimary:   'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted:     'var(--text-muted)',
  textDisabled:  'var(--text-disabled)',
  textInverse:   'var(--text-inverse)',

  border:        'var(--border)',
  borderStrong:  'var(--border-strong)',

  accent:        'var(--accent)',
  accentHover:   'var(--accent-hover)',
  accentLight:   'var(--accent-light)',
  accentText:    'var(--accent-text)',

  success:       'var(--success)',
  successLight:  'var(--success-light)',
  warning:       'var(--warning)',
  warningLight:  'var(--warning-light)',
  danger:        'var(--danger)',
  dangerLight:   'var(--danger-light)',
  info:          'var(--info)',
  infoLight:     'var(--info-light)',

  sidebar:       'var(--sidebar-bg)',
  sidebarBorder: 'var(--sidebar-border)',
  sidebarHover:  'var(--sidebar-hover)',
  sidebarActive: 'var(--sidebar-active)',
  sidebarText:   'var(--sidebar-text)',
  sidebarTextActive: 'var(--sidebar-text-active)',

  topbarBg:      'var(--topbar-bg)',
  topbarBorder:  'var(--topbar-border)',
} as const;

export const shadow = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
} as const;

export const typography = {
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  xs:   '11px',
  sm:   '13px',
  base: '14px',
  md:   '15px',
  lg:   '18px',
  xl:   '22px',
  xxl:  '28px',
  xxxl: '36px',
  regular:  400,
  medium:   500,
  semibold: 600,
  bold:     700,
} as const;

export const radius = {
  sm:   '6px',
  md:   '8px',
  lg:   '10px',
  xl:   '14px',
  xxl:  '18px',
  full: '9999px',
} as const;

export const spacing = {
  xs:  '4px',
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '24px',
  xxl: '32px',
  xxxl:'48px',
} as const;

// ─── Helpers semánticos ───────────────────────────────────────────────────────
export const appointmentBadge = (status: string) => {
  switch (status) {
    case 'scheduled': return { bg: 'var(--accent-light)',   text: 'var(--accent-text)', dot: 'var(--accent)' };
    case 'completed': return { bg: 'var(--success-light)',  text: 'var(--success)',     dot: 'var(--success)' };
    case 'no-show':   return { bg: 'var(--warning-light)',  text: 'var(--warning)',     dot: 'var(--warning)' };
    case 'cancelled': return { bg: 'var(--danger-light)',   text: 'var(--danger)',      dot: 'var(--danger)' };
    default:          return { bg: 'var(--accent-light)',   text: 'var(--accent-text)', dot: 'var(--accent)' };
  }
};

export const clientLabel = (label: string) => {
  switch (label) {
    case 'nuevo':     return { bg: 'var(--accent-light)',   text: 'var(--accent-text)', dot: 'var(--accent)',   text_label: 'Nuevo' };
    case 'frecuente': return { bg: 'var(--success-light)',  text: 'var(--success)',     dot: 'var(--success)',  text_label: 'Frecuente' };
    case 'vip':       return { bg: 'var(--warning-light)',  text: 'var(--warning)',     dot: 'var(--warning)',  text_label: 'VIP' };
    case 'pendiente': return { bg: 'var(--danger-light)',   text: 'var(--danger)',      dot: 'var(--danger)',   text_label: 'Pendiente' };
    default:          return { bg: 'var(--accent-light)',   text: 'var(--accent-text)', dot: 'var(--accent)',   text_label: 'Nuevo' };
  }
};