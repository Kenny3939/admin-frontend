// src/components/Topbar.tsx
import { useState, useEffect, createContext, useContext } from 'react';
import { Sun, Moon } from 'lucide-react';
import { colors, typography, shadow } from '../theme';

// ─── Theme Context ─────────────────────────────────────────────────────────────
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // 1. Revisar preferencia guardada
    const saved = localStorage.getItem('sv-theme') as Theme | null;
    if (saved) return saved;
    // 2. Respetar preferencia del SO
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sv-theme', theme);
  }, [theme]);

  // Escuchar cambios del SO
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function handleChange(e: MediaQueryListEvent) {
      // Solo cambiar si el usuario no tiene preferencia guardada
      if (!localStorage.getItem('sv-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    }
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  function toggleTheme() {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Vista label por ruta ─────────────────────────────────────────────────────
const VISTA_LABELS: Record<string, string> = {
  dashboard:     'Dashboard',
  agenda:        'Agenda',
  clientes:      'Clientes',
  servicios:     'Servicios',
  configuracion: 'Configuración',
};

// ─── Topbar ───────────────────────────────────────────────────────────────────
interface TopbarProps {
  vistaActual: string;
  marginLeft: string;
}

export function Topbar({ vistaActual, marginLeft }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: marginLeft,
      right: 0,
      height: '52px',
      backgroundColor: colors.topbarBg,
      borderBottom: `1px solid ${colors.topbarBorder}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 20,
      boxShadow: shadow.sm,
      transition: 'left 0.2s',
    }}>
      {/* Vista actual */}
      <p style={{
        margin: 0,
        fontSize: typography.sm,
        fontWeight: typography.semibold,
        color: colors.textSecondary,
        letterSpacing: '0.01em',
      }}>
        {VISTA_LABELS[vistaActual] || vistaActual}
      </p>

      {/* Toggle modo oscuro/claro */}
      <button
        onClick={toggleTheme}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
          backgroundColor: hovered ? colors.bgSubtle : colors.bgCard,
          color: colors.textSecondary,
          cursor: 'pointer',
          fontSize: typography.xs,
          fontWeight: typography.medium,
          fontFamily: typography.fontFamily,
          transition: 'all 0.15s',
        }}
      >
        {theme === 'light'
          ? <><Moon size={13} /> Oscuro</>
          : <><Sun size={13} /> Claro</>
        }
      </button>
    </div>
  );
}