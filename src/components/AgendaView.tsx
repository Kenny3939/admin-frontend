// src/components/AgendaView.tsx
import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Plus, CheckCircle, UserX, RefreshCw, X, Save, Bell, FileText, Scissors, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../supabase';
import { actualizarEstadoCita } from '../services/appointments.service';

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

const BADGE: Record<string, { label: string; clase: string }> = {
  scheduled: { label: 'Programada',  clase: 'bg-indigo-100 text-indigo-700' },
  completed: { label: 'Completada',  clase: 'bg-emerald-100 text-emerald-700' },
  'no-show': { label: 'No asistió',  clase: 'bg-orange-100 text-orange-600' },
  cancelled: { label: 'Cancelada',   clase: 'bg-red-100 text-red-600' },
};

const DIAS_ES  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function startOfWeek(d: Date) {
  const r = new Date(d);
  r.setDate(d.getDate() - d.getDay());
  r.setHours(0,0,0,0);
  return r;
}

// ─── Tarjeta mini (para semanal/mensual) ──────────────────────────────────────
function TarjetaMini({ cita, onFinalizar, onNoShow, onSeguimiento }: {
  cita: Cita;
  onFinalizar: (id: string) => void;
  onNoShow: (id: string) => void;
  onSeguimiento: (d: SeguimientoForm) => void;
}) {
  const hora  = new Date(cita.start_datetime).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  const badge = BADGE[cita.status] ?? BADGE['scheduled'];
  const [expandido, setExpandido] = useState(false);

  return (
    <div className={`text-xs rounded-lg p-1.5 cursor-pointer border transition-all ${
      cita.status === 'scheduled' ? 'bg-indigo-50 border-indigo-200' :
      cita.status === 'completed' ? 'bg-emerald-50 border-emerald-200' :
      cita.status === 'no-show'   ? 'bg-orange-50 border-orange-200' :
                                    'bg-gray-50 border-gray-200'
    }`} onClick={() => setExpandido(!expandido)}>
      <div className="font-semibold text-gray-800 truncate">{hora} · {cita.clients?.name || 'Sin nombre'}</div>
      <div className="text-gray-500 truncate">{cita.services?.name}</div>

      {expandido && (
        <div className="mt-2 space-y-1.5 border-t border-gray-200 pt-1.5">
          <span className={`inline-block px-1.5 py-0.5 rounded-full font-semibold ${badge.clase}`}>
            {badge.label}
          </span>
          {cita.status === 'scheduled' && (
            <div className="flex gap-1 flex-wrap">
              <button onClick={e => { e.stopPropagation(); onFinalizar(cita.id); }}
                className="flex items-center gap-0.5 px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-semibold hover:bg-emerald-200">
                <CheckCircle size={11} /> Finalizar
              </button>
              <button onClick={e => { e.stopPropagation(); onNoShow(cita.id); }}
                className="flex items-center gap-0.5 px-2 py-1 bg-orange-100 text-orange-600 rounded font-semibold hover:bg-orange-200">
                <UserX size={11} /> No asistió
              </button>
              <button onClick={e => { e.stopPropagation(); onSeguimiento({
                citaId: cita.id,
                clienteNombre: cita.clients?.name || '',
                servicioActualId: (cita.services as any)?.id || '',
                servicioActualNombre: cita.services?.name || '',
              }); }}
                className="flex items-center gap-0.5 px-2 py-1 bg-indigo-100 text-indigo-600 rounded font-semibold hover:bg-indigo-200">
                <RefreshCw size={11} /> Seguimiento
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tarjeta completa (vista diaria) ─────────────────────────────────────────
function TarjetaCita({ cita, onFinalizar, onNoShow, onSeguimiento }: {
  cita: Cita;
  onFinalizar: (id: string) => void;
  onNoShow: (id: string) => void;
  onSeguimiento: (d: SeguimientoForm) => void;
}) {
  const fecha = new Date(cita.start_datetime).toLocaleDateString('es-GT', { weekday: 'short', day: '2-digit', month: 'short' });
  const hora  = new Date(cita.start_datetime).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  const badge = BADGE[cita.status] ?? BADGE['scheduled'];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={13} className="text-indigo-400" />
            <span className="capitalize">{fecha}</span>
            <span className="text-gray-300">·</span>
            <Clock size={13} className="text-indigo-400" />
            <span>{hora}</span>
          </div>
          <p className="font-bold text-gray-900 flex items-center gap-2">
            <User size={15} className="text-gray-400" />
            {cita.clients?.name || 'Sin nombre'}
          </p>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <Scissors size={13} className="text-gray-400" />
            {cita.services?.name}
            {cita.services?.price && (
              <span className="text-emerald-600 font-semibold">· Q{cita.services.price}</span>
            )}
          </p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${badge.clase}`}>
          {badge.label}
        </span>
      </div>

      {cita.status === 'scheduled' && (
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button onClick={() => onFinalizar(cita.id)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
            <CheckCircle size={13} /> Finalizar
          </button>
          <button onClick={() => onNoShow(cita.id)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors">
            <UserX size={13} /> No asistió
          </button>
          <button onClick={() => onSeguimiento({
            citaId: cita.id,
            clienteNombre: cita.clients?.name || 'Sin nombre',
            servicioActualId: (cita.services as any)?.id || '',
            servicioActualNombre: cita.services?.name || '',
          })}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
            <RefreshCw size={13} /> Seguimiento
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Modal de Seguimiento ─────────────────────────────────────────────────────
function ModalSeguimiento({ datos, negocio, onClose, onGuardado }: {
  datos: SeguimientoForm;
  negocio: string;
  onClose: () => void;
  onGuardado: (c: Cita) => void;
}) {
  const [servicios, setServicios]       = useState<Servicio[]>([]);
  const [servicioId, setServicioId]     = useState(datos.servicioActualId);
  const [fecha, setFecha]               = useState('');
  const [hora, setHora]                 = useState('');
  const [notas, setNotas]               = useState('');
  const [recordatorio, setRecordatorio] = useState('');
  const [guardando, setGuardando]       = useState(false);

  useEffect(() => {
    supabase.from('services').select('id, name, duration_minutes')
      .eq('business_id', negocio).eq('is_active', true).order('name')
      .then(({ data }) => setServicios(data || []));
  }, [negocio]);

  async function guardar() {
    if (!fecha || !hora || !servicioId) { alert('Completa fecha, hora y servicio'); return; }
    setGuardando(true);
    try {
      const srv      = servicios.find(s => s.id === servicioId);
      const duracion = srv?.duration_minutes || 30;
      const inicio   = new Date(`${fecha}T${hora}:00`);
      const fin      = new Date(inicio.getTime() + duracion * 60000);

      const { data: citaOrig } = await supabase.from('appointments').select('client_id').eq('id', datos.citaId).single();

      const notasCompletas = [notas, recordatorio ? `⚠️ Recordatorio: ${recordatorio}` : ''].filter(Boolean).join('\n\n');

      const { data, error } = await supabase.from('appointments')
        .insert([{
          business_id: negocio, client_id: citaOrig?.client_id, service_id: servicioId,
          start_datetime: inicio.toISOString(), end_datetime: fin.toISOString(),
          status: 'scheduled', notes: notasCompletas || null, follow_up_of: datos.citaId,
        }])
        .select('*, clients(name), services(name, price)').single();

      if (error) throw error;
      onGuardado(data as Cita);
      onClose();
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setGuardando(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-indigo-50">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <RefreshCw size={18} className="text-indigo-600" /> Agendar Seguimiento
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">Para: <strong>{datos.clienteNombre}</strong></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
              <Scissors size={14} className="text-indigo-500" /> Servicio
            </label>
            <select value={servicioId} onChange={e => setServicioId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">— Selecciona un servicio —</option>
              {servicios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.duration_minutes} min){s.id === datos.servicioActualId ? ' ★ mismo servicio' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                <Calendar size={14} className="text-indigo-500" /> Fecha
              </label>
              <input type="date" value={fecha} min={new Date().toISOString().split('T')[0]}
                onChange={e => setFecha(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                <Clock size={14} className="text-indigo-500" /> Hora
              </label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
              <FileText size={14} className="text-indigo-500" /> Notas del profesional
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea rows={3} placeholder="Ej: Revisar brackets superiores..." value={notas}
              onChange={e => setNotas(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
              <Bell size={14} className="text-indigo-500" /> Recordatorio especial
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input type="text" placeholder="Ej: Venir en ayunas..." value={recordatorio}
              onChange={e => setRecordatorio(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm">
              Cancelar
            </button>
            <button onClick={guardar} disabled={guardando || !fecha || !hora || !servicioId}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold rounded-xl text-white text-sm transition-colors ${
                guardando || !fecha || !hora || !servicioId ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}>
              <Save size={15} /> {guardando ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Vista Semanal ────────────────────────────────────────────────────────────
function VistaSemanal({ citas, semanaBase, onFinalizar, onNoShow, onSeguimiento }: {
  citas: Cita[];
  semanaBase: Date;
  onFinalizar: (id: string) => void;
  onNoShow: (id: string) => void;
  onSeguimiento: (d: SeguimientoForm) => void;
}) {
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(semanaBase);
    d.setDate(semanaBase.getDate() + i);
    return d;
  });

  const hoy = new Date();

  return (
    <div className="grid grid-cols-7 gap-1 min-h-64">
      {dias.map((dia, i) => {
        const citasDia = citas.filter(c => isSameDay(new Date(c.start_datetime), dia));
        const esHoy = isSameDay(dia, hoy);
        return (
          <div key={i} className={`border rounded-xl p-2 min-h-32 ${esHoy ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-200 bg-white'}`}>
            <div className={`text-center mb-2 ${esHoy ? 'text-indigo-600 font-bold' : 'text-gray-500'}`}>
              <div className="text-xs font-semibold">{DIAS_ES[dia.getDay()]}</div>
              <div className={`text-lg font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full ${esHoy ? 'bg-indigo-600 text-white' : ''}`}>
                {dia.getDate()}
              </div>
            </div>
            <div className="space-y-1">
              {citasDia.length === 0 ? (
                <div className="text-xs text-center text-gray-300 py-2">—</div>
              ) : (
                citasDia.map(c => (
                  <TarjetaMini key={c.id} cita={c} onFinalizar={onFinalizar} onNoShow={onNoShow} onSeguimiento={onSeguimiento} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Vista Mensual ────────────────────────────────────────────────────────────
function VistaMensual({ citas, mesBase, onFinalizar, onNoShow, onSeguimiento }: {
  citas: Cita[];
  mesBase: Date;
  onFinalizar: (id: string) => void;
  onNoShow: (id: string) => void;
  onSeguimiento: (d: SeguimientoForm) => void;
}) {
  const hoy        = new Date();
  const año        = mesBase.getFullYear();
  const mes        = mesBase.getMonth();
  const primerDia  = new Date(año, mes, 1);
  const ultimoDia  = new Date(año, mes + 1, 0);
  const offsetInicio = primerDia.getDay(); // 0=Dom

  const celdas: (Date | null)[] = [
    ...Array(offsetInicio).fill(null),
    ...Array.from({ length: ultimoDia.getDate() }, (_, i) => new Date(año, mes, i + 1)),
  ];
  // Rellenar hasta múltiplo de 7
  while (celdas.length % 7 !== 0) celdas.push(null);

  return (
    <div>
      {/* Cabecera días */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_ES.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>
      {/* Celdas */}
      <div className="grid grid-cols-7 gap-1">
        {celdas.map((dia, i) => {
          if (!dia) return <div key={i} className="min-h-20" />;
          const citasDia = citas.filter(c => isSameDay(new Date(c.start_datetime), dia));
          const esHoy    = isSameDay(dia, hoy);
          return (
            <div key={i} className={`border rounded-xl p-1.5 min-h-20 ${esHoy ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-100 bg-white hover:border-gray-300'}`}>
              <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${esHoy ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>
                {dia.getDate()}
              </div>
              <div className="space-y-0.5">
                {citasDia.slice(0, 2).map(c => (
                  <TarjetaMini key={c.id} cita={c} onFinalizar={onFinalizar} onNoShow={onNoShow} onSeguimiento={onSeguimiento} />
                ))}
                {citasDia.length > 2 && (
                  <div className="text-xs text-indigo-500 font-semibold text-center">+{citasDia.length - 2} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Modal Nueva Cita ─────────────────────────────────────────────────────────
function ModalNuevaCita({ negocio, onClose, onGuardado }: {
  negocio: string;
  onClose: () => void;
  onGuardado: (c: Cita) => void;
}) {
  const [servicios, setServicios]   = useState<Servicio[]>([]);
  const [clientes, setClientes]     = useState<any[]>([]);
  const [servicioId, setServicioId] = useState('');
  const [clienteId, setClienteId]   = useState('');
  const [fecha, setFecha]           = useState('');
  const [hora, setHora]             = useState('');
  const [notas, setNotas]           = useState('');
  const [guardando, setGuardando]   = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('services').select('id, name, duration_minutes').eq('business_id', negocio).eq('is_active', true).order('name'),
      supabase.from('clients').select('id, name, phone_number').eq('business_id', negocio).order('name'),
    ]).then(([{ data: s }, { data: c }]) => {
      setServicios(s || []);
      setClientes(c || []);
    });
  }, [negocio]);

  async function guardar() {
    if (!servicioId || !clienteId || !fecha || !hora) { alert('Completa todos los campos'); return; }
    setGuardando(true);
    try {
      const srv      = servicios.find(s => s.id === servicioId);
      const duracion = srv?.duration_minutes || 30;
      const inicio   = new Date(`${fecha}T${hora}:00`);
      const fin      = new Date(inicio.getTime() + duracion * 60000);

      const { data, error } = await supabase.from('appointments')
        .insert([{
          business_id: negocio, client_id: clienteId, service_id: servicioId,
          start_datetime: inicio.toISOString(), end_datetime: fin.toISOString(),
          status: 'scheduled', notes: notas || null,
        }])
        .select('*, clients(name), services(name, price)').single();

      if (error) throw error;
      onGuardado(data as Cita);
    } catch (e: any) { alert('Error: ' + e.message); }
    finally { setGuardando(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-indigo-50">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" /> Nueva Cita Manual
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
              <User size={14} className="text-indigo-500" /> Cliente
            </label>
            <select value={clienteId} onChange={e => setClienteId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">— Selecciona un cliente —</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.name || 'Sin nombre'} · {c.phone_number}</option>
              ))}
            </select>
          </div>

          {/* Servicio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
              <Scissors size={14} className="text-indigo-500" /> Servicio
            </label>
            <select value={servicioId} onChange={e => setServicioId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">— Selecciona un servicio —</option>
              {servicios.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>
              ))}
            </select>
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                <Calendar size={14} className="text-indigo-500" /> Fecha
              </label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                <Clock size={14} className="text-indigo-500" /> Hora
              </label>
              <input type="time" value={hora} onChange={e => setHora(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
              <FileText size={14} className="text-indigo-500" /> Notas
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea rows={2} placeholder="Indicaciones especiales..." value={notas}
              onChange={e => setNotas(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm">
              Cancelar
            </button>
            <button onClick={guardar} disabled={guardando || !servicioId || !clienteId || !fecha || !hora}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold rounded-xl text-white text-sm transition-colors ${
                guardando || !servicioId || !clienteId || !fecha || !hora ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}>
              <Save size={15} /> {guardando ? 'Guardando...' : 'Agendar Cita'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export function AgendaView({ citas: citasIniciales, negocio }: { citas: any[]; negocio: string }) {
  const [citas, setCitas]             = useState<Cita[]>(citasIniciales);
  const [tabPrincipal, setTabP]       = useState<TabPrincipal>('programadas');
  const [tabVista, setTabV]           = useState<TabVista>('diaria');
  const [modalSeguimiento, setModal]  = useState<SeguimientoForm | null>(null);
  const [fechaNav, setFechaNav]       = useState(new Date());
  const [modalNuevaCita, setModalNC]  = useState(false);

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

  function handleSeguimientoGuardado(nuevaCita: Cita) {
    setCitas(prev => [...prev, nuevaCita]);
    setTabP('programadas');
  }

  // Navegación semanal/mensual
  function navegar(dir: -1 | 1) {
    const d = new Date(fechaNav);
    if (tabVista === 'semanal') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setFechaNav(d);
  }

  function tituloNavegacion() {
    if (tabVista === 'semanal') {
      const inicio = startOfWeek(fechaNav);
      const fin    = new Date(inicio); fin.setDate(inicio.getDate() + 6);
      return `${inicio.getDate()} ${MESES_ES[inicio.getMonth()]} – ${fin.getDate()} ${MESES_ES[fin.getMonth()]} ${fin.getFullYear()}`;
    }
    return `${MESES_ES[fechaNav.getMonth()]} ${fechaNav.getFullYear()}`;
  }

  // Renderizar contenido según vista
  function renderContenido(listaCitas: Cita[]) {
    if (tabVista === 'diaria') {
      if (listaCitas.length === 0) return (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          No hay citas en esta vista.
        </div>
      );
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listaCitas.map(c => (
            <TarjetaCita key={c.id} cita={c} onFinalizar={handleFinalizar} onNoShow={handleNoShow} onSeguimiento={setModal} />
          ))}
        </div>
      );
    }

    if (tabVista === 'semanal') {
      return (
        <VistaSemanal
          citas={listaCitas}
          semanaBase={startOfWeek(fechaNav)}
          onFinalizar={handleFinalizar}
          onNoShow={handleNoShow}
          onSeguimiento={setModal}
        />
      );
    }

    return (
      <VistaMensual
        citas={listaCitas}
        mesBase={fechaNav}
        onFinalizar={handleFinalizar}
        onNoShow={handleNoShow}
        onSeguimiento={setModal}
      />
    );
  }

  return (
    <div>
      {/* ── Fila superior: tabs principales + selector de vista ── */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        {/* Tabs programadas / historial */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(['programadas', 'historial'] as TabPrincipal[]).map(t => (
            <button key={t} onClick={() => setTabP(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
                tabPrincipal === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t === 'programadas' ? 'Programadas' : 'Historial'}
              {t === 'programadas' && programadas.length > 0 && (
                <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {programadas.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Selector de vista */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['diaria', 'semanal', 'mensual'] as TabVista[]).map(v => (
              <button key={v} onClick={() => setTabV(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                  tabVista === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setModalNC(true)}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Nueva Cita
          </button>
        </div>
      </div>

      {/* ── Navegación semanal/mensual ── */}
      {(tabVista === 'semanal' || tabVista === 'mensual') && (
        <div className="flex items-center justify-between mb-4 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <button onClick={() => navegar(-1)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold text-gray-800 text-sm">{tituloNavegacion()}</span>
          <button onClick={() => navegar(1)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── Contenido ── */}
      {tabPrincipal === 'programadas' && renderContenido(programadas)}
      {tabPrincipal === 'historial'   && renderContenido(historial)}

      {/* Modal de seguimiento */}
      {modalSeguimiento && (
        <ModalSeguimiento
          datos={modalSeguimiento}
          negocio={negocio}
          onClose={() => setModal(null)}
          onGuardado={handleSeguimientoGuardado}
        />
      )}

      {/* Modal nueva cita */}
      {modalNuevaCita && (
        <ModalNuevaCita
          negocio={negocio}
          onClose={() => setModalNC(false)}
          onGuardado={(c) => { setCitas(prev => [...prev, c]); setModalNC(false); setTabP('programadas'); }}
        />
      )}
    </div>
  );
}