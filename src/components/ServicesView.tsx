// src/components/ServicesView.tsx
import { useState, useEffect } from 'react';
import { Scissors, Clock, Plus, X, Save, Power } from 'lucide-react';
import { supabase } from '../supabase';
import { colors, typography, radius, shadow, spacing } from '../theme';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: radius.lg,
  border: `1px solid ${colors.border}`, backgroundColor: colors.bgSubtle,
  color: colors.textPrimary, fontSize: typography.sm,
  fontFamily: typography.fontFamily, outline: 'none', boxSizing: 'border-box',
};

export function ServicesView({ negocio }: { negocio: string }) {
  const [servicios, setServicios]       = useState<any[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [modalOpen, setModalOpen]       = useState(false);
  const [nombre, setNombre]             = useState('');
  const [duracion, setDuracion]         = useState(30);
  const [precio, setPrecio]             = useState(0);
  const [guardando, setGuardando]       = useState(false);

  useEffect(() => { cargar(); }, [negocio]);

  async function cargar() {
    if (!negocio) return;
    const { data } = await supabase.from('services').select('*').eq('business_id', negocio).order('name');
    setServicios(data || []);
    setCargando(false);
  }

  async function toggleActivo(id: string, actual: boolean) {
    setServicios(prev => prev.map(s => s.id === id ? { ...s, is_active: !actual } : s));
    const { error } = await supabase.from('services').update({ is_active: !actual }).eq('id', id);
    if (error) { alert('Error: ' + error.message); cargar(); }
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const { data, error } = await supabase.from('services')
      .insert([{ business_id: negocio, name: nombre, duration_minutes: duracion, price: precio, is_active: true }])
      .select();
    if (error) {
      alert('Error: ' + error.message);
    } else {
      setServicios(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
      setNombre(''); setDuracion(30); setPrecio(0);
      setModalOpen(false);
    }
    setGuardando(false);
  }

  const activos   = servicios.filter(s => s.is_active);
  const inactivos = servicios.filter(s => !s.is_active);

  if (cargando) return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: typography.xxl, fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: '-0.02em' }}>Servicios</h1>
      {[...Array(4)].map((_, i) => <div key={i} style={{ height: 68, borderRadius: radius.lg, backgroundColor: colors.bgMuted, marginBottom: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxl }}>
        <div>
          <h1 style={{ margin: '0 0 2px', fontSize: typography.xxl, fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: '-0.02em' }}>
            Servicios
          </h1>
          <p style={{ margin: 0, fontSize: typography.sm, color: colors.textMuted }}>
            {activos.length} activo{activos.length !== 1 ? 's' : ''} · {inactivos.length} inactivo{inactivos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setModalOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: radius.lg, border: 'none', backgroundColor: colors.accent, color: 'white', cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily, boxShadow: shadow.sm }}>
          <Plus size={14} /> Nuevo servicio
        </button>
      </div>

      {servicios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 32px', border: `2px dashed ${colors.border}`, borderRadius: radius.xl, color: colors.textMuted }}>
          <Scissors size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ margin: '0 0 4px', fontWeight: typography.semibold, color: colors.textPrimary }}>Sin servicios aún</p>
          <p style={{ margin: 0, fontSize: typography.sm }}>Agrega tu primer servicio para que los clientes puedan agendar.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xxl }}>

          {/* Activos */}
          {activos.length > 0 && (
            <div>
              <p style={{ margin: '0 0 10px', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Activos
              </p>
              <div style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.xl, boxShadow: shadow.sm, overflow: 'hidden' }}>
                {activos.map((s, i) => (
                  <ServiceRow key={s.id} servicio={s} onToggle={toggleActivo} last={i === activos.length - 1} />
                ))}
              </div>
            </div>
          )}

          {/* Inactivos */}
          {inactivos.length > 0 && (
            <div>
              <p style={{ margin: '0 0 10px', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Inactivos
              </p>
              <div style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.xl, boxShadow: shadow.sm, overflow: 'hidden', opacity: 0.7 }}>
                {inactivos.map((s, i) => (
                  <ServiceRow key={s.id} servicio={s} onToggle={toggleActivo} last={i === inactivos.length - 1} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal nuevo servicio ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: colors.bgCard, borderRadius: radius.xxl, boxShadow: shadow.lg, width: '100%', maxWidth: 400, overflow: 'hidden', animation: 'fadeIn 0.15s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: `1px solid ${colors.border}` }}>
              <p style={{ margin: 0, fontSize: typography.md, fontWeight: typography.bold, color: colors.textPrimary }}>Nuevo servicio</p>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: 4, display: 'flex', borderRadius: radius.md }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = colors.danger}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = colors.textMuted}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={agregar} style={{ padding: '20px' }}>
              <div style={{ marginBottom: spacing.md }}>
                <label style={{ display: 'block', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</label>
                <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Manicure clásica" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.lg }}>
                <div>
                  <label style={{ display: 'block', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Duración (min)
                  </label>
                  <input type="number" required min={5} value={duracion} onChange={e => setDuracion(parseInt(e.target.value))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Precio (Q)
                  </label>
                  <input type="number" required min={0} step="0.01" value={precio} onChange={e => setPrecio(parseFloat(e.target.value))} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: spacing.sm }}>
                <button type="button" onClick={() => setModalOpen(false)}
                  style={{ flex: 1, padding: '9px', borderRadius: radius.lg, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSubtle, color: colors.textSecondary, cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily }}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  style={{ flex: 1, padding: '9px', borderRadius: radius.lg, border: 'none', backgroundColor: colors.accent, color: 'white', cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Save size={13} /> {guardando ? 'Guardando...' : 'Crear servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Fila de servicio ─────────────────────────────────────────────────────────
function ServiceRow({ servicio, onToggle, last }: { servicio: any; onToggle: (id: string, actual: boolean) => void; last: boolean }) {
  const [hov, setHov] = useState(false);

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: last ? 'none' : `1px solid ${colors.border}`, backgroundColor: hov ? colors.bgSubtle : 'transparent', transition: 'background-color 0.15s' }}>

      {/* Ícono */}
      <div style={{ width: 36, height: 36, borderRadius: radius.lg, backgroundColor: servicio.is_active ? colors.accentLight : colors.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Scissors size={15} style={{ color: servicio.is_active ? colors.accentText : colors.textDisabled }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 3px', fontSize: typography.sm, fontWeight: typography.semibold, color: servicio.is_active ? colors.textPrimary : colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {servicio.name}
        </p>
        <p style={{ margin: 0, fontSize: typography.xs, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} /> {servicio.duration_minutes} min</span>
          <span style={{ color: colors.success, fontWeight: typography.semibold }}>Q{Number(servicio.price).toFixed(2)}</span>
        </p>
      </div>

      {/* Toggle */}
      <button onClick={() => onToggle(servicio.id, servicio.is_active)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: radius.md, border: `1px solid ${servicio.is_active ? colors.border : colors.border}`, cursor: 'pointer', fontSize: typography.xs, fontWeight: typography.semibold, fontFamily: typography.fontFamily, backgroundColor: servicio.is_active ? colors.dangerLight : colors.successLight, color: servicio.is_active ? colors.danger : colors.success, transition: 'all 0.15s' }}>
        <Power size={11} />
        {servicio.is_active ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  );
}