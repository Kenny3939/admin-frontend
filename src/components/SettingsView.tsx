// src/components/SettingsView.tsx
import { useEffect, useState } from 'react';
import { Settings, Clock, Calendar, Trash2, Plus, Save, Bell, X } from 'lucide-react';
import { supabase } from '../supabase';

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

// ─── Componente principal ─────────────────────────────────────────────────────
export function SettingsView({ negocio }: { negocio: string }) {
  const [tab, setTab] = useState<'general' | 'dias_libres'>('general');

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <Settings size={22} className="text-indigo-600" /> Configuración
      </h2>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('general')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'general' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setTab('dias_libres')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'dias_libres' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Días Libres
        </button>
      </div>

      {tab === 'general'    && <TabGeneral negocio={negocio} />}
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

      const r1 = await supabase
        .from('businesses')
        .select('name, open_time, close_time, capacity, timezone')
        .eq('id', negocio)
        .single();

      const r2 = await supabase
        .from('business_settings')
        .select('appointment_duration_minutes, buffer_minutes, auto_confirm, reminder_24h, reminder_2h, off_hours_message')
        .eq('business_id', negocio)
        .single();

      if (r1.data) setBusiness(r1.data);
      if (r2.data) setSettings(r2.data);
    }
    cargar();
  }, [negocio]);

  async function guardar() {
    if (!business || !settings) return;
    setGuardando(true);

    const [r1, r2] = await Promise.all([
      supabase.from('businesses').update({
        open_time: business.open_time,
        close_time: business.close_time,
        capacity: business.capacity,
      }).eq('id', negocio),
      supabase.from('business_settings').update({
        appointment_duration_minutes: settings.appointment_duration_minutes,
        buffer_minutes: settings.buffer_minutes,
        auto_confirm: settings.auto_confirm,
        reminder_24h: settings.reminder_24h,
        reminder_2h: settings.reminder_2h,
        off_hours_message: settings.off_hours_message,
      }).eq('business_id', negocio),
    ]);

    setGuardando(false);
    if (r1.error || r2.error) {
      alert('Error al guardar: ' + (r1.error?.message || r2.error?.message));
    } else {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    }
  }

  if (!business || !settings) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Horario */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-indigo-500" /> Horario de Atención
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Apertura</label>
            <input
              type="time"
              value={business.open_time?.slice(0, 5) || ''}
              onChange={e => setBusiness({ ...business, open_time: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Cierre</label>
            <input
              type="time"
              value={business.close_time?.slice(0, 5) || ''}
              onChange={e => setBusiness({ ...business, close_time: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Citas */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={16} className="text-indigo-500" /> Configuración de Citas
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Duración por defecto (min)</label>
            <input
              type="number"
              min="5" step="5"
              value={settings.appointment_duration_minutes}
              onChange={e => setSettings({ ...settings, appointment_duration_minutes: parseInt(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Buffer entre citas (min)</label>
            <input
              type="number"
              min="0" step="5"
              value={settings.buffer_minutes}
              onChange={e => setSettings({ ...settings, buffer_minutes: parseInt(e.target.value) })}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">Capacidad simultánea</label>
          <input
            type="number"
            min="1"
            value={business.capacity}
            onChange={e => setBusiness({ ...business, capacity: parseInt(e.target.value) })}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">Cuántos clientes pueden tener cita al mismo tiempo.</p>
        </div>

        {/* Auto confirmar */}
        <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-semibold text-gray-700">Confirmación automática</p>
            <p className="text-xs text-gray-400">El bot confirma citas sin revisión manual</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, auto_confirm: !settings.auto_confirm })}
            className={`w-11 h-6 rounded-full transition-colors relative ${settings.auto_confirm ? 'bg-indigo-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.auto_confirm ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Recordatorios */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Bell size={16} className="text-indigo-500" /> Recordatorios por WhatsApp
        </h3>
        <div className="space-y-3">
          {[
            { key: 'reminder_24h', label: '24 horas antes', desc: 'Envía recordatorio el día anterior' },
            { key: 'reminder_2h',  label: '2 horas antes',  desc: 'Envía recordatorio el mismo día' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof BusinessSettings] })}
                className={`w-11 h-6 rounded-full transition-colors relative ${settings[item.key as keyof BusinessSettings] ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings[item.key as keyof BusinessSettings] ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Mensaje fuera de horario */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
          🌙 Mensaje fuera de horario
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Se envía automáticamente cuando un cliente escribe fuera del horario de atención. El bot sigue funcionando y el cliente puede agendar igual.
        </p>
        <textarea
          rows={3}
          value={settings.off_hours_message || ''}
          onChange={e => setSettings({ ...settings, off_hours_message: e.target.value })}
          placeholder="🌙 ¡Hola! En este momento estamos fuera de horario. Puedes agendar tu cita igualmente y te confirmaremos cuando abramos. 😊"
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
        />
      </div>

      {/* Botón guardar */}
      <button
        onClick={guardar}
        disabled={guardando}
        className={`w-full flex items-center justify-center gap-2 py-3 font-bold rounded-xl text-white transition-colors ${
          guardado ? 'bg-emerald-500' : guardando ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        <Save size={16} />
        {guardado ? '✓ Guardado' : guardando ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </div>
  );
}

// ─── Tab Días Libres ──────────────────────────────────────────────────────────
function TabDiasLibres({ negocio }: { negocio: string }) {
  const [bloqueados, setBloqueados]   = useState<BlockedDate[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);

  // Form
  const [tipoBloqueo, setTipo]   = useState<'full' | 'hours' | 'range'>('full');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime]     = useState('');
  const [razon, setRazon]         = useState('');
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setCargando(true);
    const { data } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('business_id', negocio)
      .order('start_date', { ascending: true });
    setBloqueados(data || []);
    setCargando(false);
  }

  useEffect(() => { cargar(); }, [negocio]);

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar este bloqueo?')) return;
    await supabase.from('blocked_dates').delete().eq('id', id);
    setBloqueados(prev => prev.filter(b => b.id !== id));
  }

  async function guardar() {
    if (!startDate) { alert('Selecciona una fecha de inicio'); return; }
    if (tipoBloqueo === 'range' && !endDate) { alert('Selecciona fecha de fin'); return; }
    if (tipoBloqueo === 'hours' && (!startTime || !endTime)) { alert('Selecciona rango de horas'); return; }
    setGuardando(true);

    const payload = {
      business_id: negocio,
      start_date:  startDate,
      end_date:    tipoBloqueo === 'range' ? endDate : startDate,
      is_full_day: tipoBloqueo !== 'hours',
      start_time:  tipoBloqueo === 'hours' ? startTime : null,
      end_time:    tipoBloqueo === 'hours' ? endTime   : null,
      reason:      razon || null,
    };

    const { data, error } = await supabase.from('blocked_dates').insert([payload]).select().single();
    if (error) {
      alert('Error: ' + error.message);
    } else {
      setBloqueados(prev => [...prev, data].sort((a, b) => a.start_date.localeCompare(b.start_date)));
      resetForm();
    }
    setGuardando(false);
  }

  function resetForm() {
    setMostrarForm(false);
    setTipo('full');
    setStartDate(''); setEndDate('');
    setStartTime(''); setEndTime('');
    setRazon('');
  }

  function formatearFecha(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function describir(b: BlockedDate) {
    if (!b.is_full_day) return `${b.start_time?.slice(0,5)} – ${b.end_time?.slice(0,5)}`;
    if (b.start_date !== b.end_date) return `${formatearFecha(b.start_date)} al ${formatearFecha(b.end_date)}`;
    return 'Día completo';
  }

  const hoy = new Date().toISOString().split('T')[0];
  const proximos  = bloqueados.filter(b => b.end_date >= hoy);
  const pasados   = bloqueados.filter(b => b.end_date < hoy);

  return (
    <div className="max-w-2xl space-y-5">

      {/* Botón agregar */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Bloquea días o rangos de horas para que el bot no ofrezca esos horarios.
        </p>
        <button
          onClick={() => setMostrarForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
        >
          <Plus size={16} /> Nuevo bloqueo
        </button>
      </div>

      {/* Lista próximos bloqueos */}
      {cargando ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-xl" />)}
        </div>
      ) : proximos.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl text-sm">
          No hay días bloqueados próximos.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Próximos</p>
          {proximos.map(b => (
            <div key={b.id} className="bg-white border border-red-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
                  <Calendar size={14} className="text-red-400" />
                  {b.start_date === b.end_date
                    ? formatearFecha(b.start_date)
                    : `${formatearFecha(b.start_date)} → ${formatearFecha(b.end_date)}`
                  }
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    b.is_full_day ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {describir(b)}
                  </span>
                  {b.reason && <span className="text-xs text-gray-500 italic">{b.reason}</span>}
                </div>
              </div>
              <button
                onClick={() => eliminar(b.id)}
                className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pasados colapsados */}
      {pasados.length > 0 && (
        <details className="group">
          <summary className="text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-600">
            Pasados ({pasados.length}) ▸
          </summary>
          <div className="mt-3 space-y-2">
            {pasados.map(b => (
              <div key={b.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex justify-between items-center opacity-60">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-gray-600">
                    {b.start_date === b.end_date
                      ? formatearFecha(b.start_date)
                      : `${formatearFecha(b.start_date)} → ${formatearFecha(b.end_date)}`}
                  </p>
                  <p className="text-xs text-gray-400">{describir(b)} {b.reason && `· ${b.reason}`}</p>
                </div>
                <button onClick={() => eliminar(b.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Modal nuevo bloqueo */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-red-50">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Calendar size={18} className="text-red-500" /> Nuevo Día Bloqueado
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* Tipo de bloqueo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de bloqueo</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'full',  label: 'Día completo' },
                    { id: 'hours', label: 'Rango de horas' },
                    { id: 'range', label: 'Varios días' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTipo(t.id as any)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                        tipoBloqueo === t.id
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fechas */}
              <div className={`grid gap-3 ${tipoBloqueo === 'range' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {tipoBloqueo === 'range' ? 'Fecha inicio' : 'Fecha'}
                  </label>
                  <input type="date" value={startDate} min={hoy}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </div>
                {tipoBloqueo === 'range' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha fin</label>
                    <input type="date" value={endDate} min={startDate || hoy}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                  </div>
                )}
              </div>

              {/* Horas (solo si es rango de horas) */}
              {tipoBloqueo === 'hours' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Desde</label>
                    <input type="time" value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hasta</label>
                    <input type="time" value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                  </div>
                </div>
              )}

              {/* Razón */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Motivo <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input type="text" placeholder="Ej: Feriado nacional, Vacaciones..."
                  value={razon} onChange={e => setRazon(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button onClick={resetForm}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm">
                  Cancelar
                </button>
                <button onClick={guardar} disabled={guardando}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold rounded-xl text-white text-sm transition-colors ${
                    guardando ? 'bg-red-300' : 'bg-red-500 hover:bg-red-600'
                  }`}>
                  <Save size={15} />
                  {guardando ? 'Guardando...' : 'Bloquear Fecha'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}