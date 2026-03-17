// src/components/SettingsView.tsx
import { useEffect, useState } from 'react';
import { Clock, Calendar, Trash2, Plus, Save, Bell, X, MessageSquare } from 'lucide-react';
import { supabase } from '../supabase';
import { colors, typography, radius, shadow, spacing } from '../theme';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface BusinessSettings {
  appointment_duration_minutes: number;
  buffer_minutes: number;
  auto_confirm: boolean;
  reminder_24h: boolean;
  reminder_2h: boolean;
  off_hours_message: string;
}

interface Business {
  name: string;
  open_time: string;
  close_time: string;
  capacity: number;
  timezone: string;
}

interface BlockedDate {
  id: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  is_full_day: boolean;
  reason: string | null;
}

// ─── Estilos base ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: radius.lg,
  border: `1px solid ${colors.border}`, backgroundColor: colors.bgSubtle,
  color: colors.textPrimary, fontSize: typography.sm,
  fontFamily: typography.fontFamily, outline: 'none', boxSizing: 'border-box',
};

// ─── Sección card ─────────────────────────────────────────────────────────────
function Section({ titulo, icono, children }: { titulo: string; icono: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.xl, boxShadow: shadow.sm, overflow: 'hidden', marginBottom: spacing.lg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderBottom: `1px solid ${colors.border}` }}>
        <span style={{ color: colors.accent }}>{icono}</span>
        <p style={{ margin: 0, fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textPrimary }}>{titulo}</p>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

// ─── Campo de formulario ──────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
      {hint && <p style={{ margin: '4px 0 0', fontSize: typography.xs, color: colors.textMuted }}>{hint}</p>}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${colors.border}` }}>
      <div>
        <p style={{ margin: '0 0 2px', fontSize: typography.sm, fontWeight: typography.medium, color: colors.textPrimary }}>{label}</p>
        <p style={{ margin: 0, fontSize: typography.xs, color: colors.textMuted }}>{desc}</p>
      </div>
      <button onClick={onChange} style={{ width: 40, height: 22, borderRadius: radius.full, border: 'none', cursor: 'pointer', backgroundColor: value ? colors.accent : colors.bgMuted, position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%', backgroundColor: 'white', boxShadow: shadow.sm, transition: 'left 0.2s', left: value ? '20px' : '2px' }} />
      </button>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export function SettingsView({ negocio }: { negocio: string }) {
  const [tab, setTab] = useState<'general' | 'dias_libres'>('general');

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <h1 style={{ margin: '0 0 24px', fontSize: typography.xxl, fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: '-0.02em' }}>
        Configuración
      </h1>

      {/* Tabs */}
      <div style={{ display: 'inline-flex', gap: 2, backgroundColor: colors.bgSubtle, padding: 3, borderRadius: radius.lg, border: `1px solid ${colors.border}`, marginBottom: spacing.xl }}>
        {[{ id: 'general', label: 'General' }, { id: 'dias_libres', label: 'Días libres' }].map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ padding: '6px 16px', borderRadius: radius.md, border: 'none', cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily, backgroundColor: active ? colors.bgCard : 'transparent', color: active ? colors.textPrimary : colors.textMuted, boxShadow: active ? shadow.sm : 'none', transition: 'all 0.15s' }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'general'     && <TabGeneral negocio={negocio} />}
      {tab === 'dias_libres' && <TabDiasLibres negocio={negocio} />}
    </div>
  );
}

// ─── Tab General ──────────────────────────────────────────────────────────────
function TabGeneral({ negocio }: { negocio: string }) {
  const [business, setBusiness]   = useState<Business | null>(null);
  const [settings, setSettings]   = useState<BusinessSettings | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado]   = useState(false);

  useEffect(() => {
    async function cargar() {
      const [r1, r2] = await Promise.all([
        supabase.from('businesses').select('name, open_time, close_time, capacity, timezone').eq('id', negocio).single(),
        supabase.from('business_settings').select('appointment_duration_minutes, buffer_minutes, auto_confirm, reminder_24h, reminder_2h, off_hours_message').eq('business_id', negocio).single(),
      ]);
      if (r1.data) setBusiness(r1.data);
      if (r2.data) setSettings(r2.data);
    }
    cargar();
  }, [negocio]);

  async function guardar() {
    if (!business || !settings) return;
    setGuardando(true);
    const [r1, r2] = await Promise.all([
      supabase.from('businesses').update({ open_time: business.open_time, close_time: business.close_time, capacity: business.capacity }).eq('id', negocio),
      supabase.from('business_settings').update({ appointment_duration_minutes: settings.appointment_duration_minutes, buffer_minutes: settings.buffer_minutes, auto_confirm: settings.auto_confirm, reminder_24h: settings.reminder_24h, reminder_2h: settings.reminder_2h, off_hours_message: settings.off_hours_message }).eq('business_id', negocio),
    ]);
    setGuardando(false);
    if (r1.error || r2.error) {
      alert('Error: ' + (r1.error?.message || r2.error?.message));
    } else {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    }
  }

  if (!business || !settings) return (
    <div>
      {[...Array(3)].map((_, i) => <div key={i} style={{ height: 120, borderRadius: radius.xl, backgroundColor: colors.bgMuted, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
    </div>
  );

  return (
    <div style={{ maxWidth: 640 }}>

      {/* Horario */}
      <Section titulo="Horario de atención" icono={<Clock size={14} />}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
          <Field label="Apertura">
            <input type="time" value={business.open_time?.slice(0, 5) || ''} onChange={e => setBusiness({ ...business, open_time: e.target.value })} style={inputStyle} />
          </Field>
          <Field label="Cierre">
            <input type="time" value={business.close_time?.slice(0, 5) || ''} onChange={e => setBusiness({ ...business, close_time: e.target.value })} style={inputStyle} />
          </Field>
        </div>
      </Section>

      {/* Citas */}
      <Section titulo="Configuración de citas" icono={<Calendar size={14} />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.lg }}>
          <Field label="Duración por defecto" hint="minutos">
            <input type="number" min={5} step={5} value={settings.appointment_duration_minutes} onChange={e => setSettings({ ...settings, appointment_duration_minutes: parseInt(e.target.value) })} style={inputStyle} />
          </Field>
          <Field label="Buffer entre citas" hint="minutos de descanso">
            <input type="number" min={0} step={5} value={settings.buffer_minutes} onChange={e => setSettings({ ...settings, buffer_minutes: parseInt(e.target.value) })} style={inputStyle} />
          </Field>
          <Field label="Capacidad simultánea" hint="empleados activos">
            <input type="number" min={1} value={business.capacity} onChange={e => setBusiness({ ...business, capacity: parseInt(e.target.value) })} style={inputStyle} />
          </Field>
        </div>
        <div style={{ marginTop: spacing.lg, borderTop: `1px solid ${colors.border}`, paddingTop: spacing.lg }}>
          <Toggle
            label="Confirmación automática"
            desc="Las citas se confirman inmediatamente sin revisión manual"
            value={settings.auto_confirm}
            onChange={() => setSettings({ ...settings, auto_confirm: !settings.auto_confirm })}
          />
        </div>
      </Section>

      {/* Recordatorios */}
      <Section titulo="Recordatorios por WhatsApp" icono={<Bell size={14} />}>
        <Toggle label="24 horas antes" desc="Aviso el día anterior a la cita" value={settings.reminder_24h} onChange={() => setSettings({ ...settings, reminder_24h: !settings.reminder_24h })} />
        <div style={{ borderBottom: 'none' }}>
          <Toggle label="2 horas antes" desc="Aviso el mismo día de la cita" value={settings.reminder_2h} onChange={() => setSettings({ ...settings, reminder_2h: !settings.reminder_2h })} />
        </div>
      </Section>

      {/* Mensaje fuera de horario */}
      <Section titulo="Mensaje fuera de horario" icono={<MessageSquare size={14} />}>
        <Field label="Mensaje automático" hint="Se envía cuando un cliente escribe fuera del horario de atención. El bot sigue funcionando normalmente.">
          <textarea rows={3} value={settings.off_hours_message || ''} onChange={e => setSettings({ ...settings, off_hours_message: e.target.value })} placeholder="🌙 ¡Hola! En este momento estamos fuera de horario. Puedes agendar tu cita igualmente." style={{ ...inputStyle, resize: 'none' }} />
        </Field>
      </Section>

      {/* Botón guardar */}
      <button onClick={guardar} disabled={guardando}
        style={{ width: '100%', padding: '11px', borderRadius: radius.lg, border: 'none', backgroundColor: guardado ? colors.success : colors.accent, color: 'white', cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background-color 0.2s' }}>
        <Save size={14} />
        {guardado ? '✓ Guardado correctamente' : guardando ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}

// ─── Tab Días Libres ──────────────────────────────────────────────────────────
function TabDiasLibres({ negocio }: { negocio: string }) {
  const [bloqueados, setBloqueados]   = useState<BlockedDate[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [tipo, setTipo]               = useState<'full' | 'hours' | 'range'>('full');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [startTime, setStartTime]     = useState('');
  const [endTime, setEndTime]         = useState('');
  const [reason, setReason]           = useState('');
  const [guardando, setGuardando]     = useState(false);

  useEffect(() => { cargar(); }, [negocio]);

  async function cargar() {
    const { data } = await supabase.from('blocked_dates').select('*').eq('business_id', negocio).order('start_date');
    setBloqueados(data || []);
    setCargando(false);
  }

  async function guardar() {
    if (!startDate) return;
    setGuardando(true);
    const payload: any = {
      business_id: negocio,
      start_date: startDate,
      end_date: tipo === 'range' ? endDate : startDate,
      is_full_day: tipo !== 'hours',
      reason: reason || null,
      start_time: tipo === 'hours' ? startTime : null,
      end_time: tipo === 'hours' ? endTime : null,
    };
    const { error } = await supabase.from('blocked_dates').insert([payload]);
    if (error) alert('Error: ' + error.message);
    else { setModalOpen(false); setStartDate(''); setEndDate(''); setStartTime(''); setEndTime(''); setReason(''); setTipo('full'); cargar(); }
    setGuardando(false);
  }

  async function eliminar(id: string) {
    await supabase.from('blocked_dates').delete().eq('id', id);
    setBloqueados(prev => prev.filter(b => b.id !== id));
  }

  const hoy     = new Date().toISOString().split('T')[0];
  const proximos = bloqueados.filter(b => b.end_date >= hoy);
  const pasados  = bloqueados.filter(b => b.end_date < hoy);

  const formatBloqueo = (b: BlockedDate) => {
    const d1 = new Date(b.start_date + 'T12:00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' });
    if (b.start_date !== b.end_date) {
      const d2 = new Date(b.end_date + 'T12:00:00').toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${d1} — ${d2}`;
    }
    if (!b.is_full_day && b.start_time && b.end_time) return `${d1} · ${b.start_time.slice(0,5)} - ${b.end_time.slice(0,5)}`;
    return d1;
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textPrimary }}>Días y horarios bloqueados</p>
          <p style={{ margin: 0, fontSize: typography.xs, color: colors.textMuted }}>Los clientes no podrán agendar en estas fechas u horarios.</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: radius.lg, border: 'none', backgroundColor: colors.accent, color: 'white', cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily, boxShadow: shadow.sm }}>
          <Plus size={13} /> Agregar
        </button>
      </div>

      {cargando ? (
        [...Array(3)].map((_, i) => <div key={i} style={{ height: 56, borderRadius: radius.lg, backgroundColor: colors.bgMuted, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />)
      ) : (
        <>
          {proximos.length === 0 && pasados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', border: `2px dashed ${colors.border}`, borderRadius: radius.xl, color: colors.textMuted, fontSize: typography.sm }}>
              No hay fechas bloqueadas.
            </div>
          ) : (
            <>
              {proximos.length > 0 && (
                <div style={{ marginBottom: spacing.xl }}>
                  <p style={{ margin: '0 0 10px', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Próximos</p>
                  <div style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.xl, boxShadow: shadow.sm, overflow: 'hidden' }}>
                    {proximos.map((b, i) => (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < proximos.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                        <div>
                          <p style={{ margin: '0 0 2px', fontSize: typography.sm, fontWeight: typography.medium, color: colors.textPrimary }}>{formatBloqueo(b)}</p>
                          <p style={{ margin: 0, fontSize: typography.xs, color: colors.textMuted }}>
                            {b.is_full_day ? 'Día completo' : 'Rango de horas'}{b.reason ? ` · ${b.reason}` : ''}
                          </p>
                        </div>
                        <button onClick={() => eliminar(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: 6, borderRadius: radius.md, display: 'flex' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = colors.danger}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = colors.textMuted}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pasados.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 10px', fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pasados</p>
                  <div style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: radius.xl, boxShadow: shadow.sm, overflow: 'hidden', opacity: 0.6 }}>
                    {pasados.map((b, i) => (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < pasados.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                        <div>
                          <p style={{ margin: '0 0 2px', fontSize: typography.sm, color: colors.textSecondary }}>{formatBloqueo(b)}</p>
                          <p style={{ margin: 0, fontSize: typography.xs, color: colors.textMuted }}>{b.reason || (b.is_full_day ? 'Día completo' : 'Rango de horas')}</p>
                        </div>
                        <button onClick={() => eliminar(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: 6, borderRadius: radius.md, display: 'flex' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: colors.bgCard, borderRadius: radius.xxl, boxShadow: shadow.lg, width: '100%', maxWidth: 400, overflow: 'hidden', animation: 'fadeIn 0.15s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: `1px solid ${colors.border}` }}>
              <p style={{ margin: 0, fontSize: typography.md, fontWeight: typography.bold, color: colors.textPrimary }}>Agregar bloqueo</p>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: 4, display: 'flex', borderRadius: radius.md }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              {/* Tipo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: spacing.lg }}>
                {[{ id: 'full', label: 'Día completo' }, { id: 'hours', label: 'Rango horas' }, { id: 'range', label: 'Varios días' }].map(t => (
                  <button key={t.id} onClick={() => setTipo(t.id as any)}
                    style={{ padding: '7px', borderRadius: radius.md, border: `1px solid ${tipo === t.id ? colors.accent : colors.border}`, cursor: 'pointer', fontSize: typography.xs, fontWeight: typography.semibold, fontFamily: typography.fontFamily, backgroundColor: tipo === t.id ? colors.accentLight : 'transparent', color: tipo === t.id ? colors.accentText : colors.textMuted, transition: 'all 0.15s' }}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: tipo === 'range' ? '1fr 1fr' : '1fr', gap: spacing.md, marginBottom: spacing.md }}>
                <Field label={tipo === 'range' ? 'Fecha inicio' : 'Fecha'}>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
                </Field>
                {tipo === 'range' && (
                  <Field label="Fecha fin">
                    <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
                  </Field>
                )}
              </div>

              {tipo === 'hours' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
                  <Field label="Hora inicio">
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Hora fin">
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle} />
                  </Field>
                </div>
              )}

              <div style={{ marginBottom: spacing.lg }}>
                <Field label="Motivo (opcional)">
                  <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej: Día festivo, vacaciones..." style={inputStyle} />
                </Field>
              </div>

              <div style={{ display: 'flex', gap: spacing.sm }}>
                <button onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '9px', borderRadius: radius.lg, border: `1px solid ${colors.border}`, backgroundColor: colors.bgSubtle, color: colors.textSecondary, cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily }}>Cancelar</button>
                <button onClick={guardar} disabled={guardando || !startDate || (tipo === 'range' && !endDate) || (tipo === 'hours' && (!startTime || !endTime))}
                  style={{ flex: 1, padding: '9px', borderRadius: radius.lg, border: 'none', backgroundColor: colors.accent, color: 'white', cursor: 'pointer', fontSize: typography.sm, fontWeight: typography.semibold, fontFamily: typography.fontFamily, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Save size={13} /> {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}