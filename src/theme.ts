// src/theme.ts
// ─── Design Tokens ────────────────────────────────────────────────────────────
// Fuente única de verdad para colores, tipografía y espaciado.
// Úsalos siempre en lugar de valores hardcoded.

export const colors = {
  // Fondos
  bgPage:       '#F7F7F6',   // fondo principal del contenido
  bgCard:       '#FFFFFF',   // tarjetas y paneles
  bgSubtle:     '#F4F4F3',   // fondos secundarios dentro de cards
  bgMuted:      '#EFEFEE',   // hover states, separadores suaves

  // Sidebar
  sidebar:      '#0C0C0C',
  sidebarBorder:'#1F1F1F',
  sidebarHover: '#141414',
  sidebarActive:'#1A1A1A',

  // Texto
  textPrimary:  '#111111',
  textSecondary:'#666666',
  textMuted:    '#999999',
  textDisabled: '#CCCCCC',
  textInverse:  '#FFFFFF',

  // Bordes
  border:       '#E5E5E4',
  borderStrong: '#D0D0CE',

  // Acento principal (azul)
  accent:       '#2563EB',
  accentHover:  '#1D4ED8',
  accentLight:  '#EFF6FF',
  accentText:   '#1D4ED8',

  // Estados semánticos
  success:      '#16A34A',
  successLight: '#F0FDF4',
  warning:      '#D97706',
  warningLight: '#FFFBEB',
  danger:       '#DC2626',
  dangerLight:  '#FEF2F2',
  info:         '#0284C7',
  infoLight:    '#F0F9FF',

  // Badges de estado de citas
  scheduled:    { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  completed:    { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E' },
  noshow:       { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  cancelled:    { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },

  // Etiquetas de clientes
  labelNuevo:     { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
  labelFrecuente: { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E' },
  labelVip:       { bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B' },
  labelPendiente: { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
} as const;

export const typography = {
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  
  // Tamaños
  xs:   '11px',
  sm:   '13px',
  base: '14px',
  md:   '15px',
  lg:   '18px',
  xl:   '22px',
  xxl:  '28px',

  // Pesos
  regular:   400,
  medium:    500,
  semibold:  600,
  bold:      700,
} as const;

export const spacing = {
  xs:  '4px',
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '24px',
  xxl: '32px',
} as const;

export const radius = {
  sm:   '6px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  full: '9999px',
} as const;

export const shadow = {
  sm:  '0 1px 2px 0 rgba(0,0,0,0.05)',
  md:  '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.04)',
  lg:  '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.04)',
  xl:  '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const appointmentBadge = (status: string) => {
  switch (status) {
    case 'scheduled': return colors.scheduled;
    case 'completed': return colors.completed;
    case 'no-show':   return colors.noshow;
    case 'cancelled': return colors.cancelled;
    default:          return colors.scheduled;
  }
};

export const clientLabel = (label: string) => {
  switch (label) {
    case 'nuevo':     return { ...colors.labelNuevo,     text_label: 'Nuevo' };
    case 'frecuente': return { ...colors.labelFrecuente, text_label: 'Frecuente' };
    case 'vip':       return { ...colors.labelVip,       text_label: 'VIP' };
    case 'pendiente': return { ...colors.labelPendiente, text_label: 'Pendiente' };
    default:          return { ...colors.labelNuevo,     text_label: 'Nuevo' };
  }
};