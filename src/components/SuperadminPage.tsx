// src/components/SuperadminPage.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { logout } from '../services/auth.service';
import { CHANGELOG, VERSION_ACTUAL } from '../changelog';
import { Building2, Users, Wifi, WifiOff, Plus, X, Save, LogOut, ShieldCheck, RefreshCw, GitBranch, Wrench, Sparkles, Bug, Sun, Moon } from 'lucide-react';
import { colors, typography, radius, shadow, spacing } from '../theme';
import { useTheme } from './Topbar';

interface Negocio {
  id: string;
  name: string;
  whatsapp_number: string;
  status: string;
  plan: string;
  created_at: string;
  users?: { email: string; role: string }[];
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: radius.lg,
  border: `1px solid ${colors.border}`, backgroundColor: colors.bgSubtle,
  color: colors.textPrimary, fontSize: typography.sm,
  fontFamily: typography.fontFamily, outline: 'none', boxSizing: 'border-box',
};

export function SuperadminPage({ onLogout }: { onLogout: () => void }) {
  const [negocios, setNegocios]         = useState<Negocio[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [tab, setTab]                   = useState<'negocios' | 'changelog'>('negocios');
  const [modalOpen, setModalOpen]       = useState(false);
  const [guardando, setGuardando]       = useState(false);
  const { theme, toggleTheme }          = useTheme();

  const [nombre, setNombre]       = useState('');
  const [whatsapp, setWhatsapp]   = useState('');
  const [plan, setPlan]           = useState('basic');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [passAdmin, setPassAdmin]   = useState('');
  const [openTime, setOpenTime]   = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [capacity, setCapacity]   = useState(1);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    const { data } = await supabase.from('businesses').select('*, users(email, role)').order('created_at', { ascending: false });
    setNegocios(data || []);
    setCargando(false);
  }

  async function crearNegocio(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      const { data: negocio, error: errNeg } = await supabase.from('businesses')
        .insert([{ name: nombre, whatsapp_number: whatsapp, plan, status: 'active', open_time: openTime, close_time: closeTime, capacity }])
        .select().single();
      if (errNeg) throw errNeg;

      const { data: authData, error: errAuth } = await supabase.auth.admin.createUser({ email: emailAdmin, password: passAdmin, email_confirm: true });
      if (errAuth) throw errAuth;

      const { error: errUser } = await supabase.from('users').insert([{ auth_id: authData.user.id, business_id: negocio.id, email: emailAdmin, role: 'admin' }]);
      if (errUser) throw errUser;

      setModalOpen(false);
      setNombre(''); setWhatsapp(''); setEmailAdmin(''); setPassAdmin('');
      cargar();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function toggleEstado(id: string, actual: string) {
    const nuevo = actual === 'active' ? 'inactive' : 'active';
    await supabase.from('businesses').update({ status: nuevo }).eq('id', id);
    cargar();
  }

  async function handleLogout() { await logout(); onLogout(); }

  const activos = negocios.filter(n => n.status === 'active').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', fontFamily: typography.fontFamily }}>

      {/* ── Header ── */}
      <header style={{ backgroundColor: colors.sidebar, borderBottom: `1px solid ${colors.sidebarBorder}`, padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, backgroundColor: colors.accent, borderRadius: radius.lg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={16} color="white" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: typography.sm, fontWeight: typography.bold, color: 'white' }}>Centro de Mando</p>
            <p style={{ margin: 0, fontSize: typography.xs, color: '#555' }}>Superadmin · <span style={{ color: colors.accent }}>v{VERSION_ACTUAL}</span></p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Toggle tema */}
          <button onClick={toggleTheme}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: radius.md, border: `1px solid #2A2A2A`, backgroundColor: '#1A1A1A', color: '#777', cursor: 'pointer', fontSize: typography.xs, fontWeight: typography.medium, fontFamily: typography.fontFamily }}>
            {theme === 'light' ? <><Moon size={12} /> Oscuro</> : <><Sun size={12} /> Claro</>}
          </button>

          <button onClick={cargar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 6, borderRadius: radius.md, display: 'flex' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#999'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#555'}>
            <RefreshCw size={16} />
          </button>

          <button onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: radius.md, border: 'none', backgroundColor: '#1A1A1A', color: '#EF4444', cursor: 'pointer', fontSize: typography.xs, fontWeight: typography.semibold, fontFamily: typography.fontFamily }}>
            <LogOut size={13} /> Salir
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.lg, marginBottom: spacing.xxl }}>
          {[
            { label: 'Total negocios', valor: negocios.length, icono: <Building2 size={18} />, color: colors.accent },
            { label: 'Activos',        valor: activos,          icono: <Wifi size={18} />,      color: colors.success },
            { label: 'Con admin',      valor: negocios.filter(n => n.users && n.users.length > 0).length, icono: <Users size={18} />, color: colors.info },
          ].map((s, i) => (
            <div key={i} style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.xl, padding: '20px', boxShadow: shadow.sm }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                <span style={{ color: s.color }}>{s.icono}</span>
              </div>
              <p style={{ margin: 0, fontSize: typography.xxxl, fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: '-0.02em' }}>{s.valor}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <div style={{ display: 'inline-flex', gap: 2, backgroundColor: colors.bgSubtle, padding: 3, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            {[{ id: 'negocios', label: 'Negocios' }, { id: 'changelog', label: 'Versiones', icon: <GitBranch size={12} /> }].map(t => {
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id as any)}
                  style={{ padding: '6px 14px', borderRadius: radius.md, border: 'none', cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily, display: 'inline-flex', alignItems: 'center', gap: 5, backgroundColor: active ? colors.bgCard : 'transparent', color: active ? colors.textPrimary : colors.textMuted, boxShadow: active ? shadow.sm : 'none', transition: 'all 0.15s' }}>
                  {t.icon}{t.label}
                </button>
              );
            })}
          </div>

          {tab === 'negocios' && (
            <button onClick={() => setModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: radius.lg, border: 'none', backgroundColor: colors.accent, color: 'white', cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily, boxShadow: shadow.sm }}>
              <Plus size={14} /> Nuevo negocio
            </button>
          )}
        </div>

        {/* ── Tab Negocios ── */}
        {tab === 'negocios' && (
          cargando ? (
            [...Array(3)].map((_, i) => <div key={i} style={{ height: 72, borderRadius: radius.xl, backgroundColor: colors.bgMuted, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />)
          ) : negocios.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', border: `2px dashed ${colors.border}`, borderRadius: radius.xl, color: colors.textMuted }}>
              No hay negocios registrados.
            </div>
          ) : (
            <div style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.xl, boxShadow: shadow.sm, overflow: 'hidden' }}>
              {negocios.map((n, i) => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: i < negocios.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: n.status === 'active' ? colors.success : colors.textDisabled, flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textPrimary }}>{n.name}</p>
                      <p style={{ margin: 0, fontSize: typography.xs, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>📱 {n.whatsapp_number}</span>
                        {n.users?.[0] && <span>👤 {n.users[0].email}</span>}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ padding: '2px 8px', borderRadius: radius.full, fontSize: typography.xs, fontWeight: typography.bold, backgroundColor: n.plan === 'pro' ? '#F3E8FF' : colors.bgSubtle, color: n.plan === 'pro' ? '#7C3AED' : colors.textMuted }}>
                      {n.plan}
                    </span>
                    <button onClick={() => toggleEstado(n.id, n.status)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: radius.md, border: 'none', cursor: 'pointer', fontSize: typography.xs, fontWeight: typography.semibold, fontFamily: typography.fontFamily, backgroundColor: n.status === 'active' ? colors.dangerLight : colors.successLight, color: n.status === 'active' ? colors.danger : colors.success, transition: 'all 0.15s' }}>
                      {n.status === 'active' ? <><WifiOff size={11} /> Desactivar</> : <><Wifi size={11} /> Activar</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Tab Changelog ── */}
        {tab === 'changelog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
            {CHANGELOG.map((entry, i) => (
              <div key={entry.version} style={{ backgroundColor: colors.bgCard, border: `1px solid ${i === 0 ? colors.accent : colors.border}`, borderRadius: radius.xl, boxShadow: shadow.sm, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, backgroundColor: i === 0 ? colors.accentLight : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: typography.lg, fontWeight: typography.bold, color: i === 0 ? colors.accent : colors.textPrimary, letterSpacing: '-0.02em' }}>v{entry.version}</span>
                    {i === 0 && <span style={{ padding: '2px 8px', borderRadius: radius.full, fontSize: typography.xs, fontWeight: typography.bold, backgroundColor: colors.accent, color: 'white' }}>Actual</span>}
                    <span style={{ padding: '2px 8px', borderRadius: radius.full, fontSize: typography.xs, fontWeight: typography.semibold, backgroundColor: entry.tipo === 'major' ? '#F3E8FF' : entry.tipo === 'minor' ? colors.successLight : colors.bgSubtle, color: entry.tipo === 'major' ? '#7C3AED' : entry.tipo === 'minor' ? colors.success : colors.textMuted }}>
                      {entry.tipo === 'major' ? 'Mayor' : entry.tipo === 'minor' ? 'Feature' : 'Fix'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 1px', fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textPrimary }}>{entry.titulo}</p>
                    <p style={{ margin: 0, fontSize: typography.xs, color: colors.textMuted }}>
                      {new Date(entry.fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {entry.cambios.map((c, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: typography.sm }}>
                      <span style={{ flexShrink: 0, marginTop: 1, color: c.tipo === 'feature' ? colors.success : c.tipo === 'fix' ? colors.warning : colors.info }}>
                        {c.tipo === 'feature' ? <Sparkles size={13} /> : c.tipo === 'fix' ? <Bug size={13} /> : <Wrench size={13} />}
                      </span>
                      <span style={{ color: colors.textSecondary }}>{c.descripcion}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal nuevo negocio ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: colors.bgCard, borderRadius: radius.xxl, boxShadow: shadow.lg, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto', animation: 'fadeIn 0.15s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: `1px solid ${colors.border}`, position: 'sticky', top: 0, backgroundColor: colors.bgCard }}>
              <p style={{ margin: 0, fontSize: typography.md, fontWeight: typography.bold, color: colors.textPrimary }}>Registrar nuevo negocio</p>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: 4, display: 'flex', borderRadius: radius.md }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={crearNegocio} style={{ padding: '22px' }}>
              <p style={{ margin: '0 0 20px', fontSize: typography.xs, color: colors.textMuted, backgroundColor: colors.accentLight, padding: '10px 12px', borderRadius: radius.md }}>
                Esto crea el negocio y las credenciales de acceso al panel admin.
              </p>

              {[
                { label: 'Nombre del negocio', val: nombre, set: setNombre, placeholder: 'Bella Glow Studio', type: 'text', colSpan: 2 },
                { label: 'Número WhatsApp', val: whatsapp, set: setWhatsapp, placeholder: '502XXXXXXXX', type: 'text', colSpan: 1 },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 14, gridColumn: f.colSpan === 2 ? 'span 2' : 'span 1' }}>
                  <label style={{ display: 'block', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                  <input type={f.type} required value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan</label>
                  <select value={plan} onChange={e => setPlan(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Apertura</label>
                  <input type="time" required value={openTime} onChange={e => setOpenTime(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cierre</label>
                  <input type="time" required value={closeTime} onChange={e => setCloseTime(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capacidad (empleados)</label>
                <input type="number" min={1} required value={capacity} onChange={e => setCapacity(parseInt(e.target.value))} style={inputStyle} />
              </div>

              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 16, marginBottom: 16 }}>
                <p style={{ margin: '0 0 12px', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acceso al panel admin</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                    <input type="email" required value={emailAdmin} onChange={e => setEmailAdmin(e.target.value)} placeholder="dueno@negocio.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contraseña</label>
                    <input type="text" required value={passAdmin} onChange={e => setPassAdmin(e.target.value)} placeholder="Mín. 6 caracteres" style={inputStyle} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setModalOpen(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: radius.lg, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSubtle, color: colors.textSecondary, cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily }}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  style={{ flex: 1, padding: '10px', borderRadius: radius.lg, border: 'none', backgroundColor: colors.accent, color: 'white', cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Save size={13} /> {guardando ? 'Creando...' : 'Crear negocio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}