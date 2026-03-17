// src/components/ClientsView.tsx
import { useEffect, useState } from 'react';
import { Phone, Calendar, X, Clock, ChevronRight, Tag, FileText, Save, DollarSign } from 'lucide-react';
import { supabase } from '../supabase';
import { colors, typography, radius, shadow, spacing, clientLabel, appointmentBadge } from '../theme';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Cliente {
  id: string;
  name: string;
  phone_number: string;
  created_at: string;
  label: string;
  internal_notes: string | null;
}

interface Cita {
  id: string;
  start_datetime: string;
  status: string;
  notes: string | null;
  services: { name: string; price: number } | { name: string; price: number }[];
}

const LABELS = ['nuevo', 'frecuente', 'vip', 'pendiente'];

// ─── Badge etiqueta ───────────────────────────────────────────────────────────
function LabelBadge({ label }: { label: string }) {
  const cfg = clientLabel(label || 'nuevo');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: radius.full, fontSize: typography.xs, fontWeight: typography.semibold, backgroundColor: cfg.bg, color: cfg.text, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: cfg.dot }} />
      {cfg.text_label}
    </span>
  );
}

// ─── Badge estado cita ────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = appointmentBadge(status);
  const labels: Record<string, string> = { scheduled: 'Programada', completed: 'Completada', 'no-show': 'No asistió', cancelled: 'Cancelada' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: radius.full, fontSize: '11px', fontWeight: typography.semibold, backgroundColor: cfg.bg, color: cfg.text }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: cfg.dot }} />
      {labels[status] || status}
    </span>
  );
}

// ─── Input style ──────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: radius.lg,
  border: `1px solid ${colors.border}`, backgroundColor: colors.bgSubtle,
  color: colors.textPrimary, fontSize: typography.sm,
  fontFamily: typography.fontFamily, outline: 'none', boxSizing: 'border-box',
};

// ─── Vista principal ──────────────────────────────────────────────────────────
export function ClientsView({ negocio }: { negocio: string }) {
  const [clientes, setClientes]             = useState<Cliente[]>([]);
  const [cargando, setCargando]             = useState(true);
  const [seleccionado, setSeleccionado]     = useState<Cliente | null>(null);
  const [historial, setHistorial]           = useState<Cita[]>([]);
  const [cargandoH, setCargandoH]           = useState(false);
  const [editLabel, setEditLabel]           = useState(false);
  const [editNotas, setEditNotas]           = useState(false);
  const [labelTemp, setLabelTemp]           = useState('');
  const [notasTemp, setNotasTemp]           = useState('');
  const [guardando, setGuardando]           = useState(false);
  const [filtro, setFiltro]                 = useState('todos');
  const [busqueda, setBusqueda]             = useState('');

  useEffect(() => {
    if (!negocio) return;
    supabase.from('clients').select('*').eq('business_id', negocio).order('created_at', { ascending: false })
      .then(({ data }) => { setClientes(data || []); setCargando(false); });
  }, [negocio]);

  async function abrirCliente(c: Cliente) {
    setSeleccionado(c);
    setLabelTemp(c.label || 'nuevo');
    setNotasTemp(c.internal_notes || '');
    setEditLabel(false); setEditNotas(false);
    setCargandoH(true);
    const { data } = await supabase.from('appointments').select('id, start_datetime, status, notes, services(name, price)').eq('client_id', c.id).order('start_datetime', { ascending: false });
    setHistorial((data || []) as Cita[]);
    setCargandoH(false);
  }

  async function guardarPerfil() {
    if (!seleccionado) return;
    setGuardando(true);
    const { error } = await supabase.from('clients').update({ label: labelTemp, internal_notes: notasTemp }).eq('id', seleccionado.id);
    if (!error) {
      const actualizado = { ...seleccionado, label: labelTemp, internal_notes: notasTemp };
      setSeleccionado(actualizado);
      setClientes(prev => prev.map(c => c.id === actualizado.id ? actualizado : c));
      setEditLabel(false); setEditNotas(false);
    }
    setGuardando(false);
  }

  const clientesFiltrados = clientes
    .filter(c => filtro === 'todos' || (c.label || 'nuevo') === filtro)
    .filter(c => !busqueda || (c.name || '').toLowerCase().includes(busqueda.toLowerCase()) || c.phone_number.includes(busqueda));

  if (cargando) return (
    <div>
      <h1 style={{ margin: '0 0 24px', fontSize: typography.xxl, fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: '-0.02em' }}>Clientes</h1>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ height: 56, borderRadius: radius.lg, backgroundColor: colors.bgMuted, marginBottom: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl }}>
        <h1 style={{ margin: 0, fontSize: typography.xxl, fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: '-0.02em' }}>
          Clientes
          <span style={{ fontSize: typography.sm, fontWeight: typography.regular, color: colors.textMuted, marginLeft: 10 }}>
            {clientesFiltrados.length}
          </span>
        </h1>
      </div>

      <div style={{ display: 'flex', gap: spacing.lg }}>

        {/* ── Lista ── */}
        <div style={{ flex: seleccionado ? '0 0 50%' : '1', transition: 'flex 0.2s', minWidth: 0 }}>

          {/* Búsqueda + filtros */}
          <div style={{ marginBottom: spacing.lg, display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
            <input
              type="text" placeholder="Buscar por nombre o teléfono..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: 180 }}
            />
            <div style={{ display: 'inline-flex', gap: 2, backgroundColor: colors.bgSubtle, padding: 3, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
              {['todos', ...LABELS].map(l => {
                const active = filtro === l;
                const cfg = l === 'todos' ? null : clientLabel(l);
                return (
                  <button key={l} onClick={() => setFiltro(l)}
                    style={{ padding: '5px 10px', borderRadius: radius.sm, border: 'none', cursor: 'pointer', fontSize: typography.xs, fontWeight: typography.semibold, fontFamily: typography.fontFamily, backgroundColor: active ? colors.bgCard : 'transparent', color: active ? (cfg ? cfg.text : colors.textPrimary) : colors.textMuted, boxShadow: active ? shadow.sm : 'none', transition: 'all 0.15s' }}>
                    {l === 'todos' ? 'Todos' : clientLabel(l).text_label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tabla */}
          {clientesFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', border: `2px dashed ${colors.border}`, borderRadius: radius.xl, color: colors.textMuted, fontSize: typography.sm }}>
              {filtro === 'todos' && !busqueda ? 'No hay clientes registrados.' : 'Sin resultados para esta búsqueda.'}
            </div>
          ) : (
            <div style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.xl, boxShadow: shadow.sm, overflow: 'hidden' }}>
              {clientesFiltrados.map((c, i) => {
                const activo = seleccionado?.id === c.id;
                return (
                  <div key={c.id} onClick={() => abrirCliente(c)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer', borderBottom: i < clientesFiltrados.length - 1 ? `1px solid ${colors.border}` : 'none', backgroundColor: activo ? colors.accentLight : 'transparent', borderLeft: activo ? `3px solid ${colors.accent}` : '3px solid transparent', transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (!activo) (e.currentTarget as HTMLElement).style.backgroundColor = colors.bgSubtle; }}
                    onMouseLeave={e => { if (!activo) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>

                    {/* Avatar */}
                    <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: activo ? colors.accent : colors.bgSubtle, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: typography.xs, fontWeight: typography.bold, color: activo ? 'white' : colors.textMuted }}>
                      {(c.name || '?').slice(0, 2).toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name || <span style={{ color: colors.textMuted, fontStyle: 'italic' }}>Sin nombre</span>}
                      </p>
                      <p style={{ margin: 0, fontSize: typography.xs, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={10} /> {c.phone_number}
                      </p>
                    </div>

                    <LabelBadge label={c.label || 'nuevo'} />
                    <ChevronRight size={14} style={{ color: activo ? colors.accent : colors.textDisabled, flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Panel lateral ── */}
        {seleccionado && (
          <div style={{ flex: '0 0 calc(50% - 16px)', backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.xl, boxShadow: shadow.md, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh', animation: 'fadeIn 0.15s ease' }}>

            {/* Header del panel */}
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: colors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.sm, fontWeight: typography.bold, color: 'white', flexShrink: 0 }}>
                  {(seleccionado.name || '?').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: typography.md, fontWeight: typography.bold, color: colors.textPrimary }}>
                    {seleccionado.name || 'Sin nombre'}
                  </p>
                  <p style={{ margin: 0, fontSize: typography.xs, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={10} /> {seleccionado.phone_number}
                  </p>
                </div>
              </div>
              <button onClick={() => setSeleccionado(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: 4, borderRadius: radius.md, display: 'flex' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = colors.danger}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = colors.textMuted}>
                <X size={16} />
              </button>
            </div>

            {/* Etiqueta + notas */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>

              {/* Etiqueta */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <p style={{ margin: 0, fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Tag size={11} /> Etiqueta
                  </p>
                  {!editLabel && (
                    <button onClick={() => setEditLabel(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: typography.xs, color: colors.accentText, fontWeight: typography.semibold, fontFamily: typography.fontFamily, padding: 0 }}>
                      Cambiar
                    </button>
                  )}
                </div>
                {editLabel ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {LABELS.map(l => {
                      const cfg = clientLabel(l);
                      const sel = labelTemp === l;
                      return (
                        <button key={l} onClick={() => setLabelTemp(l)}
                          style={{ padding: '4px 10px', borderRadius: radius.full, border: `1px solid ${sel ? cfg.dot : colors.border}`, cursor: 'pointer', fontSize: typography.xs, fontWeight: typography.semibold, fontFamily: typography.fontFamily, backgroundColor: sel ? cfg.bg : 'transparent', color: sel ? cfg.text : colors.textMuted, transition: 'all 0.15s' }}>
                          {cfg.text_label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <LabelBadge label={labelTemp} />
                )}
              </div>

              {/* Notas internas */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <p style={{ margin: 0, fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FileText size={11} /> Notas internas
                  </p>
                  {!editNotas && (
                    <button onClick={() => setEditNotas(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: typography.xs, color: colors.accentText, fontWeight: typography.semibold, fontFamily: typography.fontFamily, padding: 0 }}>
                      {notasTemp ? 'Editar' : 'Agregar'}
                    </button>
                  )}
                </div>
                {editNotas ? (
                  <textarea rows={2} value={notasTemp} onChange={e => setNotasTemp(e.target.value)} placeholder="Notas privadas sobre este cliente..." style={{ ...inputStyle, resize: 'none' }} />
                ) : notasTemp ? (
                  <p style={{ margin: 0, fontSize: typography.sm, color: colors.textSecondary, backgroundColor: colors.warningLight, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: '8px 10px', whiteSpace: 'pre-line' }}>
                    {notasTemp}
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: typography.xs, color: colors.textDisabled, fontStyle: 'italic' }}>Sin notas.</p>
                )}
              </div>

              {(editLabel || editNotas) && (
                <button onClick={guardarPerfil} disabled={guardando}
                  style={{ marginTop: 12, width: '100%', padding: '8px', borderRadius: radius.lg, border: 'none', backgroundColor: colors.accent, color: 'white', cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Save size={13} /> {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              )}
            </div>

            {/* Stats */}
            {!cargandoH && historial.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
                {[
                  { label: 'Completadas', val: historial.filter(c => c.status === 'completed').length, color: colors.success },
                  { label: 'No asistió',  val: historial.filter(c => c.status === 'no-show').length,  color: colors.warning },
                  { label: 'Total cobrado', val: `Q${historial.filter(c => c.status === 'completed').reduce((t, c) => { const s = Array.isArray(c.services) ? c.services[0] : c.services; return t + (Number(s?.price) || 0); }, 0).toFixed(0)}`, color: colors.success },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 2px', fontSize: typography.lg, fontWeight: typography.bold, color: s.color }}>{s.val}</p>
                    <p style={{ margin: 0, fontSize: typography.xs, color: colors.textMuted }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Historial */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px' }}>
              {cargandoH ? (
                [...Array(3)].map((_, i) => <div key={i} style={{ height: 72, borderRadius: radius.lg, backgroundColor: colors.bgMuted, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />)
              ) : historial.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: colors.textMuted, fontSize: typography.sm }}>Sin citas registradas.</div>
              ) : historial.map(cita => {
                const srv = Array.isArray(cita.services) ? cita.services[0] : cita.services;
                const fecha = new Date(cita.start_datetime).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
                const hora  = new Date(cita.start_datetime).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={cita.id} style={{ backgroundColor: colors.bgSubtle, border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: '12px 14px', marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: '0 0 3px', fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textPrimary }}>{srv?.name}</p>
                        <p style={{ margin: 0, fontSize: typography.xs, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={10} /> {fecha}
                          <Clock size={10} /> {hora}
                          {srv?.price > 0 && <><DollarSign size={10} /> Q{srv.price}</>}
                        </p>
                      </div>
                      <StatusBadge status={cita.status} />
                    </div>
                    {cita.notes && (
                      <p style={{ margin: '8px 0 0', fontSize: typography.xs, color: colors.textSecondary, backgroundColor: colors.warningLight, borderRadius: radius.sm, padding: '6px 8px', whiteSpace: 'pre-line' }}>
                        {cita.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}