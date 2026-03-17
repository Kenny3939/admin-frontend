import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  isSystem: boolean;
  setSystem: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

type StoredTheme = Theme | 'system';

function readStoredTheme(): StoredTheme {
  const saved = localStorage.getItem('sv-theme') as StoredTheme | null;
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  return 'system';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useState<StoredTheme>(() => readStoredTheme());
  const theme: Theme = stored === 'system' ? getSystemTheme() : stored;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sv-theme', stored);
  }, [stored]);

  useEffect(() => {
    if (stored !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      document.documentElement.setAttribute('data-theme', getSystemTheme());
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [stored]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme: (t) => setStored(t),
    toggleTheme: () => setStored(prev => {
      const base: Theme = prev === 'system' ? getSystemTheme() : prev;
      return base === 'light' ? 'dark' : 'light';
    }),
    isSystem: stored === 'system',
    setSystem: () => setStored('system'),
  }), [stored, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

