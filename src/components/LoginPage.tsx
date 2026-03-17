// src/components/LoginPage.tsx
import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { login } from '../services/auth.service';
import { colors, typography, radius, shadow } from '../theme';

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [verPass, setVerPass]   = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(email, password);
      onLogin();
    } catch {
      setError('Correo o contraseña incorrectos.');
    } finally {
      setCargando(false);
    }
  }

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '10px 12px 10px 38px',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSubtle,
    color: colors.textPrimary,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-page)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: typography.fontFamily,
    }}>
      <div style={{ width: '100%', maxWidth: 380, animation: 'fadeIn 0.25s ease' }}>

        {/* Logo / marca */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 44, height: 44,
            backgroundColor: colors.accent,
            borderRadius: radius.xl,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: `0 4px 14px rgba(37,99,235,0.3)`,
          }}>
            <Lock size={20} color="white" />
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: typography.xl, fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: '-0.02em' }}>
            Bienvenido
          </h1>
          <p style={{ margin: 0, fontSize: typography.sm, color: colors.textMuted }}>
            Ingresa a tu panel administrativo
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.xxl,
          padding: '28px',
          boxShadow: shadow.lg,
        }}>

          {/* Error */}
          {error && (
            <div style={{
              backgroundColor: colors.dangerLight,
              border: `1px solid #FECACA`,
              borderRadius: radius.lg,
              padding: '10px 14px',
              marginBottom: '20px',
              fontSize: typography.sm,
              color: colors.danger,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Correo electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
                <input
                  type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@tunegocio.com"
                  style={inputBase}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = colors.accent}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = colors.border}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
                <input
                  type={verPass ? 'text' : 'password'} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputBase, paddingRight: 40 }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = colors.accent}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = colors.border}
                />
                <button type="button" onClick={() => setVerPass(!verPass)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, display: 'flex', padding: 2 }}>
                  {verPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={cargando}
              style={{
                width: '100%', padding: '11px',
                borderRadius: radius.lg, border: 'none',
                backgroundColor: cargando ? colors.accentHover : colors.accent,
                color: 'white', cursor: cargando ? 'not-allowed' : 'pointer',
                fontSize: typography.sm, fontWeight: typography.bold,
                fontFamily: typography.fontFamily,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: `0 2px 8px rgba(37,99,235,0.25)`,
                transition: 'opacity 0.15s',
                opacity: cargando ? 0.8 : 1,
              }}>
              {cargando ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  Ingresando...
                </>
              ) : 'Ingresar'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: typography.xs, color: colors.textMuted }}>
          Secretaría Virtual · Panel Admin
        </p>
      </div>
    </div>
  );
}