// src/components/AgendaView.tsx
import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Plus, CheckCircle, UserX, RefreshCw, X, Save, Scissors, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../supabase';
import { actualizarEstadoCita } from '../services/appointments.service';
import { colors, typography, radius, shadow, spacing, appointmentBadge } from '../theme';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Cita {
  id: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  clients: { name: string };
  services: { id?: string; name: string; price: number };
}

interface Servicio {
  id: string;
  name: string;
  duration_minutes: number;
}

interface SeguimientoForm {
  citaId: string;
  clienteNombre: string;
  servicioActualId: string;
  servicioActualNombre: string;
}

type TabPrincipal = 'programadas' | 'historial';
type TabVista    = 'diaria' | 'semanal' | 'mensual';

const DIAS_ES  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Programada',
  completed: 'Completada',
  'no-show': 'No asistió',
  cancelled: 'Cancelada',
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfWeek(d: Date) {
  const r = new Date(d); r.setDate(d.getDate() - d.getDay()); r.setHours(0,0,0,0); return r;
}

// ─── Badge de estado ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = appointmentBadge(status);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: radius.full, fontSize: typography.xs, fontWeight: typography.semibold, backgroundColor: cfg.bg, color: cfg.text }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: cfg.dot }} />
      {STATUS_LABEL[status] || status}
    </span>
  );
}

// ─── Botón de acción pequeño ──────────────────────────────────────────────────
function ActionBtn({ icon, label, onClick, variant = 'default' }: { icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; variant?: 'default' | 'success' | 'danger' | 'accent' }) {
  const [hov, setHov] = useState(false);
  const styles = {
    default:  { bg: colors.bgSubtle,      text: colors.textSecondary,  hbg: colors.bgMuted },
    success:  { bg: colors.successLight,  text: colors.success,        hbg: '#DCFCE7' },
    danger:   { bg: colors.dangerLight,   text: colors.danger,         hbg: '#FEE2E2' },
    accent:   { bg: colors.accentLight,   text: colors.accentText,     hbg: '#DBEAFE' },
  }[variant];

  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: radius.md, border: 'none', cursor: 'pointer', fontSize: typography.xs, fontWeight: typography.semibold, fontFamily: typography.fontFamily, backgroundColor: hov ? styles.hbg : styles.bg, color: styles.text, transition: 'all 0.15s' }}>
      {icon} {label}
    </button>
  );
}

// ─── Tarjeta mini (vistas semanal/mensual) ────────────────────────────────────
function TarjetaMini({ cita, onFinalizar, onNoShow, onSeguimiento }: { cita: Cita; onFinalizar: (id: string) => void; onNoShow: (id: string) => void; onSeguimiento: (d: SeguimientoForm) => void }) {
  const [exp, setExp] = useState(false);
  const cfg = appointmentBadge(cita.status);
  const hora = new Date(cita.start_datetime).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });

  return (
    <div onClick={() => setExp(!exp)} style={{ borderRadius: radius.md, padding: '6px 8px', cursor: 'pointer', border: `1px solid ${cfg.bg}`, backgroundColor: cfg.bg, transition: 'all 0.15s', marginBottom: 2 }}>
      <p style={{ margin: 0, fontSize: '11px', fontWeight: typography.semibold, color: cfg.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {hora} · {cita.clients?.name || '—'}
      </p>
      <p style={{ margin: 0, fontSize: '10px', color: cfg.text, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {cita.services?.name}
      </p>
      {exp && cita.status === 'scheduled' && (
        <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
          <ActionBtn icon={<CheckCircle size={10} />} label="Listo" onClick={e => { e.stopPropagation(); onFinalizar(cita.id); }} variant="success" />
          <ActionBtn icon={<UserX size={10} />} label="N/A" onClick={e => { e.stopPropagation(); onNoShow(cita.id); }} variant="danger" />
          <ActionBtn icon={<RefreshCw size={10} />} label="Seguim." onClick={e => { e.stopPropagation(); onSeguimiento({ citaId: cita.id, clienteNombre: cita.clients?.name || '', servicioActualId: (cita.services as any)?.id || '', servicioActualNombre: cita.services?.name || '' }); }} variant="accent" />
        </div>
      )}
    </div>
  );
}

// ─── Tarjeta diaria ───────────────────────────────────────────────────────────
function TarjetaCita({ cita, onFinalizar, onNoShow, onSeguimiento }: { cita: Cita; onFinalizar: (id: string) => void; onNoShow: (id: string) => void; onSeguimiento: (d: SeguimientoForm) => void }) {
  const [hov, setHov] = useState(false);
  const fecha = new Date(cita.start_datetime).toLocaleDateString('es-GT', { weekday: 'short', day: '2-digit', month: 'short' });
  const hora  = new Date(cita.start_datetime).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ backgroundColor: colors.bgCard, border: `1px solid ${hov ? colors.borderStrong : colors.border}`, borderRadius: radius.xl, padding: '18px 20px', boxShadow: hov ? shadow.md : shadow.sm, transition: 'all 0.15s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Calendar size={12} style={{ color: colors.textMuted }} />
            <span style={{ fontSize: typography.xs, color: colors.textMuted, textTransform: 'capitalize' }}>{fecha}</span>
            <span style={{ color: colors.border }}>·</span>
            <Clock size={12} style={{ color: colors.textMuted }} />
            <span style={{ fontSize: typography.xs, color: colors.textMuted }}>{hora}</span>
          </div>
          <p style={{ margin: '0 0 3px', fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={13} style={{ color: colors.textMuted }} />
            {cita.clients?.name || 'Sin nombre'}
          </p>
          <p style={{ margin: 0, fontSize: typography.sm, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Scissors size={12} style={{ color: colors.textMuted }} />
            {cita.services?.name}
            {cita.services?.price > 0 && (
              <span style={{ color: colors.success, fontWeight: typography.semibold }}>· Q{cita.services.price}</span>
            )}
          </p>
        </div>
        <StatusBadge status={cita.status} />
      </div>

      {cita.status === 'scheduled' && (
        <div style={{ display: 'flex', gap: 6, paddingTop: 12, borderTop: `1px solid ${colors.border}` }}>
          <ActionBtn icon={<CheckCircle size={12} />} label="Finalizar" onClick={() => onFinalizar(cita.id)} variant="success" />
          <ActionBtn icon={<UserX size={12} />} label="No asistió" onClick={() => onNoShow(cita.id)} variant="danger" />
          <ActionBtn icon={<RefreshCw size={12} />} label="Seguimiento" onClick={() => onSeguimiento({ citaId: cita.id, clienteNombre: cita.clients?.name || '', servicioActualId: (cita.services as any)?.id || '', servicioActualNombre: cita.services?.name || '' })} variant="accent" />
        </div>
      )}
    </div>
  );
}

// ─── Modal base ───────────────────────────────────────────────────────────────
function Modal({ titulo, subtitulo, onClose, children }: { titulo: string; subtitulo?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div style={{ backgroundColor: colors.bgCard, borderRadius: radius.xxl, boxShadow: shadow.lg, width: '100%', maxWidth: 440, overflow: 'hidden', animation: 'fadeIn 0.15s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <div>
            <p style={{ margin: 0, fontSize: typography.md, fontWeight: typography.bold, color: colors.textPrimary }}>{titulo}</p>
            {subtitulo && <p style={{ margin: '2px 0 0', fontSize: typography.xs, color: colors.textMuted }}>{subtitulo}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: 4, borderRadius: radius.md, display: 'flex' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = colors.danger}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = colors.textMuted}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Campo de formulario ──────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: spacing.md }}>
      <label style={{ display: 'block', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: radius.lg,
  border: `1px solid ${colors.border}`, backgroundColor: colors.bgSubtle,
  color: colors.textPrimary, fontSize: typography.sm,
  fontFamily: typography.fontFamily, outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

// ─── Modal Seguimiento ────────────────────────────────────────────────────────
function ModalSeguimiento({ datos, negocio, onClose, onGuardado }: { datos: SeguimientoForm; negocio: string; onClose: () => void; onGuardado: (c: Cita) => void }) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [servicioId, setServicioId] = useState(datos.servicioActualId);
  const [fecha, setFecha] = useState('');
  const [hora, setHora]   = useState('');
  const [notas, setNotas] = useState('');
  const [recordatorio, setRecordatorio] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    supabase.from('services').select('id, name, duration_minutes').eq('business_id', negocio).eq('is_active', true).order('name')
      .then(({ data }) => setServicios(data || []));
  }, [negocio]);

  async function guardar() {
    if (!fecha || !hora || !servicioId) return;
    setGuardando(true);
    try {
      const srv = servicios.find(s => s.id === servicioId);
      const ini = new Date(`${fecha}T${hora}:00`);
      const fin = new Date(ini.getTime() + (srv?.duration_minutes || 30) * 60000);
      const { data: citaOrig } = await supabase.from('appointments').select('client_id').eq('id', datos.citaId).single();
      const notasFinal = [notas, recordatorio ? `⚠️ ${recordatorio}` : ''].filter(Boolean).join('\n\n');
      const { data, error } = await supabase.from('appointments')
        .insert([{ business_id: negocio, client_id: citaOrig?.client_id, service_id: servicioId, start_datetime: ini.toISOString(), end_datetime: fin.toISOString(), status: 'scheduled', notes: notasFinal || null, follow_up_of: datos.citaId }])
        .select('*, clients(name), services(name, price)').single();
      if (error) throw error;
      onGuardado(data as Cita);
      onClose();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setGuardando(false); }
  }

  return (
    <Modal titulo="Agendar seguimiento" subtitulo={`Para: ${datos.clienteNombre}`} onClose={onClose}>
      <Field label="Servicio">
        <select value={servicioId} onChange={e => setServicioId(e.target.value)} style={selectStyle}>
          <option value="">— Selecciona —</option>
          {servicios.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min){s.id === datos.servicioActualId ? ' ★' : ''}</option>)}
        </select>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
        <Field label="Fecha"><input type="date" value={fecha} min={new Date().toISOString().split('T')[0]} onChange={e => setFecha(e.target.value)} style={inputStyle} /></Field>
        <Field label="Hora"><input type="time" value={hora} onChange={e => setHora(e.target.value)} style={inputStyle} /></Field>
      </div>
      <Field label="Notas del profesional">
        <textarea rows={2} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Indicaciones especiales..." style={{ ...inputStyle, resize: 'none' }} />
      </Field>
      <Field label="Recordatorio especial">
        <input type="text" value={recordatorio} onChange={e => setRecordatorio(e.target.value)} placeholder="Ej: Venir en ayunas..." style={inputStyle} />
      </Field>
      <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
        <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: radius.lg, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSubtle, color: colors.textSecondary, cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily }}>Cancelar</button>
        <button onClick={guardar} disabled={guardando || !fecha || !hora || !servicioId}
          style={{ flex: 1, padding: '9px', borderRadius: radius.lg, border: 'none', backgroundColor: (!fecha || !hora || !servicioId) ? colors.bgMuted : colors.accent, color: (!fecha || !hora || !servicioId) ? colors.textMuted : 'white', cursor: (!fecha || !hora || !servicioId) ? 'not-allowed' : 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Save size={13} /> {guardando ? 'Guardando...' : 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Modal Nueva Cita ─────────────────────────────────────────────────────────
function ModalNuevaCita({ negocio, onClose, onGuardado }: { negocio: string; onClose: () => void; onGuardado: (c: Cita) => void }) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [clientes, setClientes]   = useState<any[]>([]);
  const [servicioId, setServicioId] = useState('');
  const [clienteId, setClienteId]   = useState('');
  const [fecha, setFecha]           = useState('');
  const [hora, setHora]             = useState('');
  const [notas, setNotas]           = useState('');
  const [guardando, setGuardando]   = useState(false);
  const [advertencia, setAdvertencia] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('services').select('id, name, duration_minutes').eq('business_id', negocio).eq('is_active', true).order('name'),
      supabase.from('clients').select('id, name, phone_number').eq('business_id', negocio).order('name'),
    ]).then(([{ data: s }, { data: c }]) => { setServicios(s || []); setClientes(c || []); });
  }, [negocio]);

  async function guardar() {
    if (!servicioId || !clienteId || !fecha || !hora) return;
    setGuardando(true); setAdvertencia(null);
    try {
      const srv = servicios.find(s => s.id === servicioId);
      const ini = new Date(`${fecha}T${hora}:00`);
      const fin = new Date(ini.getTime() + (srv?.duration_minutes || 30) * 60000);
      const { data: solapadas } = await supabase.from('appointments').select('id, clients(name), services(name), start_datetime').eq('business_id', negocio).eq('status', 'scheduled').lt('start_datetime', fin.toISOString()).gt('end_datetime', ini.toISOString());
      if (solapadas && solapadas.length > 0) {
        const c = solapadas[0] as any;
        const h = new Date(c.start_datetime).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
        setAdvertencia(`Ya hay una cita de ${c.clients?.name || 'otro cliente'} (${c.services?.name}) a las ${h}. ¿Agendar de todas formas?`);
        setGuardando(false); return;
      }
      await confirmar(ini, fin);
    } catch (e: any) { alert('Error: ' + e.message); setGuardando(false); }
  }

  async function confirmar(ini?: Date, fin?: Date) {
    setGuardando(true); setAdvertencia(null);
    try {
      const srv = servicios.find(s => s.id === servicioId);
      const i = ini ?? new Date(`${fecha}T${hora}:00`);
      const f = fin ?? new Date(i.getTime() + (srv?.duration_minutes || 30) * 60000);
      const { data, error } = await supabase.from('appointments')
        .insert([{ business_id: negocio, client_id: clienteId, service_id: servicioId, start_datetime: i.toISOString(), end_datetime: f.toISOString(), status: 'scheduled', notes: notas || null }])
        .select('*, clients(name), services(name, price)').single();
      if (error) throw error;
      onGuardado(data as Cita);
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setGuardando(false); }
  }

  const valid = servicioId && clienteId && fecha && hora;

  return (
    <Modal titulo="Nueva cita" subtitulo="Agendamiento manual" onClose={onClose}>
      <Field label="Cliente">
        <select value={clienteId} onChange={e => setClienteId(e.target.value)} style={selectStyle}>
          <option value="">— Selecciona un cliente —</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.name || 'Sin nombre'} · {c.phone_number}</option>)}
        </select>
      </Field>
      <Field label="Servicio">
        <select value={servicioId} onChange={e => setServicioId(e.target.value)} style={selectStyle}>
          <option value="">— Selecciona un servicio —</option>
          {servicios.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}
        </select>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
        <Field label="Fecha"><input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={inputStyle} /></Field>
        <Field label="Hora"><input type="time" value={hora} onChange={e => setHora(e.target.value)} style={inputStyle} /></Field>
      </div>
      <Field label="Notas">
        <textarea rows={2} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Indicaciones especiales..." style={{ ...inputStyle, resize: 'none' }} />
      </Field>

      {advertencia && (
        <div style={{ backgroundColor: colors.warningLight, border: `1px solid ${colors.warning}`, borderRadius: radius.lg, padding: '12px 14px', marginBottom: spacing.md, fontSize: typography.sm, color: colors.warning }}>
          <p style={{ margin: '0 0 10px' }}>⚠️ {advertencia}</p>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <button onClick={() => setAdvertencia(null)} style={{ flex: 1, padding: '6px', borderRadius: radius.md, border: `1px solid ${colors.border}`, backgroundColor: colors.bgCard, cursor: 'pointer', fontSize: typography.xs, fontWeight: typography.semibold, fontFamily: typography.fontFamily, color: colors.textSecondary }}>Cancelar</button>
            <button onClick={() => confirmar()} style={{ flex: 1, padding: '6px', borderRadius: radius.md, border: 'none', backgroundColor: colors.warning, color: 'white', cursor: 'pointer', fontSize: typography.xs, fontWeight: typography.semibold, fontFamily: typography.fontFamily }}>Agendar de todas formas</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: spacing.sm }}>
        <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: radius.lg, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSubtle, color: colors.textSecondary, cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily }}>Cancelar</button>
        <button onClick={guardar} disabled={!valid || guardando}
          style={{ flex: 1, padding: '9px', borderRadius: radius.lg, border: 'none', backgroundColor: !valid ? colors.bgMuted : colors.accent, color: !valid ? colors.textMuted : 'white', cursor: !valid ? 'not-allowed' : 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Plus size={13} /> {guardando ? 'Guardando...' : 'Agendar'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Vista Semanal ────────────────────────────────────────────────────────────
function VistaSemanal({ citas, semanaBase, onFinalizar, onNoShow, onSeguimiento }: { citas: Cita[]; semanaBase: Date; onFinalizar: (id: string) => void; onNoShow: (id: string) => void; onSeguimiento: (d: SeguimientoForm) => void }) {
  const hoy = new Date();
  const dias = Array.from({ length: 7 }, (_, i) => { const d = new Date(semanaBase); d.setDate(semanaBase.getDate() + i); return d; });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
      {dias.map((dia, i) => {
        const citasDia = citas.filter(c => isSameDay(new Date(c.start_datetime), dia));
        const esHoy = isSameDay(dia, hoy);
        return (
          <div key={i} style={{ border: `1px solid ${esHoy ? colors.accent : colors.border}`, borderRadius: radius.lg, padding: '8px 6px', minHeight: 120, backgroundColor: esHoy ? colors.accentLight : colors.bgCard }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <p style={{ margin: 0, fontSize: '10px', fontWeight: typography.semibold, color: esHoy ? colors.accent : colors.textMuted, textTransform: 'uppercase' }}>{DIAS_ES[dia.getDay()]}</p>
              <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: esHoy ? colors.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px auto 0', fontSize: typography.sm, fontWeight: typography.bold, color: esHoy ? 'white' : colors.textPrimary }}>
                {dia.getDate()}
              </div>
            </div>
            {citasDia.length === 0
              ? <p style={{ textAlign: 'center', fontSize: '10px', color: colors.textDisabled, margin: 0 }}>—</p>
              : citasDia.map(c => <TarjetaMini key={c.id} cita={c} onFinalizar={onFinalizar} onNoShow={onNoShow} onSeguimiento={onSeguimiento} />)
            }
          </div>
        );
      })}
    </div>
  );
}

// ─── Vista Mensual ────────────────────────────────────────────────────────────
function VistaMensual({ citas, mesBase, onFinalizar, onNoShow, onSeguimiento }: { citas: Cita[]; mesBase: Date; onFinalizar: (id: string) => void; onNoShow: (id: string) => void; onSeguimiento: (d: SeguimientoForm) => void }) {
  const hoy = new Date();
  const año = mesBase.getFullYear(), mes = mesBase.getMonth();
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  const celdas: (Date | null)[] = [...Array(primerDia.getDay()).fill(null), ...Array.from({ length: ultimoDia.getDate() }, (_, i) => new Date(año, mes, i + 1))];
  while (celdas.length % 7 !== 0) celdas.push(null);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {DIAS_ES.map(d => <p key={d} style={{ margin: 0, textAlign: 'center', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textMuted, padding: '4px 0', textTransform: 'uppercase' }}>{d}</p>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {celdas.map((dia, i) => {
          if (!dia) return <div key={i} style={{ minHeight: 80 }} />;
          const citasDia = citas.filter(c => isSameDay(new Date(c.start_datetime), dia));
          const esHoy = isSameDay(dia, hoy);
          return (
            <div key={i} style={{ border: `1px solid ${esHoy ? colors.accent : colors.border}`, borderRadius: radius.lg, padding: '6px', minHeight: 80, backgroundColor: esHoy ? colors.accentLight : colors.bgCard }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: esHoy ? colors.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, fontSize: typography.xs, fontWeight: typography.bold, color: esHoy ? 'white' : colors.textSecondary }}>
                {dia.getDate()}
              </div>
              {citasDia.slice(0, 2).map(c => <TarjetaMini key={c.id} cita={c} onFinalizar={onFinalizar} onNoShow={onNoShow} onSeguimiento={onSeguimiento} />)}
              {citasDia.length > 2 && <p style={{ margin: 0, fontSize: '10px', color: colors.accentText, fontWeight: typography.semibold, textAlign: 'center' }}>+{citasDia.length - 2}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export function AgendaView({ citas: citasIniciales, negocio }: { citas: any[]; negocio: string }) {
  const [citas, setCitas]           = useState<Cita[]>(citasIniciales);
  const [tabP, setTabP]             = useState<TabPrincipal>('programadas');
  const [tabV, setTabV]             = useState<TabVista>('diaria');
  const [modalSeg, setModalSeg]     = useState<SeguimientoForm | null>(null);
  const [modalNueva, setModalNueva] = useState(false);
  const [fechaNav, setFechaNav]     = useState(new Date());

  useEffect(() => { setCitas(citasIniciales); }, [citasIniciales]);

  const programadas = citas.filter(c => c.status === 'scheduled');
  const historial   = citas.filter(c => ['completed', 'no-show', 'cancelled'].includes(c.status));

  async function handleFinalizar(id: string) {
    await actualizarEstadoCita(id, 'completed');
    setCitas(prev => prev.map(c => c.id === id ? { ...c, status: 'completed' } : c));
  }
  async function handleNoShow(id: string) {
    await actualizarEstadoCita(id, 'no-show');
    setCitas(prev => prev.map(c => c.id === id ? { ...c, status: 'no-show' } : c));
  }

  function navegar(dir: -1 | 1) {
    const d = new Date(fechaNav);
    if (tabV === 'semanal') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setFechaNav(d);
  }

  function tituloNav() {
    if (tabV === 'semanal') {
      const ini = startOfWeek(fechaNav);
      const fin = new Date(ini); fin.setDate(ini.getDate() + 6);
      return `${ini.getDate()} ${MESES_ES[ini.getMonth()]} – ${fin.getDate()} ${MESES_ES[fin.getMonth()]} ${fin.getFullYear()}`;
    }
    return `${MESES_ES[fechaNav.getMonth()]} ${fechaNav.getFullYear()}`;
  }

  function renderContenido(lista: Cita[]) {
    if (tabV === 'diaria') {
      if (lista.length === 0) return (
        <div style={{ textAlign: 'center', padding: '48px', border: `2px dashed ${colors.border}`, borderRadius: radius.xl, color: colors.textMuted, fontSize: typography.sm }}>
          No hay citas en esta vista.
        </div>
      );
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: spacing.lg }}>
          {lista.map(c => <TarjetaCita key={c.id} cita={c} onFinalizar={handleFinalizar} onNoShow={handleNoShow} onSeguimiento={setModalSeg} />)}
        </div>
      );
    }
    if (tabV === 'semanal') return <VistaSemanal citas={lista} semanaBase={startOfWeek(fechaNav)} onFinalizar={handleFinalizar} onNoShow={handleNoShow} onSeguimiento={setModalSeg} />;
    return <VistaMensual citas={lista} mesBase={fechaNav} onFinalizar={handleFinalizar} onNoShow={handleNoShow} onSeguimiento={setModalSeg} />;
  }

  // ── Tab button helper ──
  function TabBtn({ id, label, count }: { id: string; label: string; count?: number }) {
    const active = tabP === id || tabV === id;
    const [hov, setHov] = useState(false);
    return (
      <button onClick={() => { if (id === 'programadas' || id === 'historial') setTabP(id as TabPrincipal); else setTabV(id as TabVista); }}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ padding: '6px 14px', borderRadius: radius.md, border: 'none', cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily, display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: active ? colors.bgCard : (hov ? colors.bgHover : 'transparent'), color: active ? colors.textPrimary : colors.textMuted, boxShadow: active ? shadow.sm : 'none', transition: 'all 0.15s' }}>
        {label}
        {count !== undefined && count > 0 && (
          <span style={{ fontSize: '11px', fontWeight: typography.bold, padding: '1px 6px', borderRadius: radius.full, backgroundColor: active ? colors.accentLight : colors.bgMuted, color: active ? colors.accentText : colors.textMuted }}>
            {count}
          </span>
        )}
      </button>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
        <h1 style={{ margin: 0, fontSize: typography.xxl, fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: '-0.02em' }}>
          Agenda
        </h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Tabs vista */}
          <div style={{ display: 'inline-flex', gap: 2, backgroundColor: colors.bgSubtle, padding: 3, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
            {(['diaria', 'semanal', 'mensual'] as TabVista[]).map(v => (
              <TabBtn key={v} id={v} label={v.charAt(0).toUpperCase() + v.slice(1)} />
            ))}
          </div>
          {/* Botón nueva cita */}
          <button onClick={() => setModalNueva(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: radius.lg, border: 'none', backgroundColor: colors.accent, color: 'white', cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily, boxShadow: shadow.sm }}>
            <Plus size={14} /> Nueva cita
          </button>
        </div>
      </div>

      {/* ── Tabs programadas/historial ── */}
      <div style={{ display: 'inline-flex', gap: 2, backgroundColor: colors.bgSubtle, padding: 3, borderRadius: radius.lg, border: `1px solid ${colors.border}`, marginBottom: spacing.lg }}>
        <TabBtn id="programadas" label="Programadas" count={programadas.length} />
        <TabBtn id="historial"   label="Historial" />
      </div>

      {/* ── Navegación semanal/mensual ── */}
      {(tabV === 'semanal' || tabV === 'mensual') && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: '10px 16px', marginBottom: spacing.lg, boxShadow: shadow.sm }}>
          <button onClick={() => navegar(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: 4, borderRadius: radius.md, display: 'flex' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = colors.textPrimary}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = colors.textMuted}>
            <ChevronLeft size={16} />
          </button>
          <p style={{ margin: 0, fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textPrimary }}>{tituloNav()}</p>
          <button onClick={() => navegar(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: 4, borderRadius: radius.md, display: 'flex' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = colors.textPrimary}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = colors.textMuted}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── Contenido ── */}
      {tabP === 'programadas' && renderContenido(programadas)}
      {tabP === 'historial'   && renderContenido(historial)}

      {/* Modales */}
      {modalSeg && <ModalSeguimiento datos={modalSeg} negocio={negocio} onClose={() => setModalSeg(null)} onGuardado={c => { setCitas(prev => [...prev, c]); setTabP('programadas'); setModalSeg(null); }} />}
      {modalNueva && <ModalNuevaCita negocio={negocio} onClose={() => setModalNueva(false)} onGuardado={c => { setCitas(prev => [...prev, c]); setTabP('programadas'); setModalNueva(false); }} />}
    </div>
  );
}