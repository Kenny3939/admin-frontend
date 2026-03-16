// src/components/ClientsView.tsx
import { useEffect, useState } from 'react';
import { User, Phone, Calendar, X, Clock, DollarSign, ChevronRight, Tag, FileText, Save } from 'lucide-react';
import { supabase } from '../supabase';

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
  services: { name: string; price: number };
}

// ─── Configuración de etiquetas ───────────────────────────────────────────────
const ETIQUETAS: Record<string, { label: string; clase: string; dot: string }> = {
  nuevo:     { label: 'Nuevo',     clase: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  frecuente: { label: 'Frecuente', clase: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  vip:       { label: 'VIP',       clase: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  pendiente: { label: 'Pendiente', clase: 'bg-red-100 text-red-600',      dot: 'bg-red-500' },
};

const BADGE_CITA: Record<string, { label: string; clase: string }> = {
  scheduled: { label: 'Programada',  clase: 'bg-indigo-100 text-indigo-700' },
  completed: { label: 'Completada',  clase: 'bg-emerald-100 text-emerald-700' },
  'no-show': { label: 'No asistió',  clase: 'bg-orange-100 text-orange-600' },
  cancelled: { label: 'Cancelada',   clase: 'bg-red-100 text-red-600' },
};

// ─── Badge de etiqueta ────────────────────────────────────────────────────────
function EtiquetaBadge({ label }: { label: string }) {
  const cfg = ETIQUETAS[label] ?? ETIQUETAS['nuevo'];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.clase}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function ClientsView({ negocio }: { negocio: string }) {
  const [clientes, setClientes]           = useState<Cliente[]>([]);
  const [cargando, setCargando]           = useState(true);
  const [clienteSeleccionado, setCliente] = useState<Cliente | null>(null);
  const [historial, setHistorial]         = useState<Cita[]>([]);
  const [cargandoH, setCargandoH]         = useState(false);

  // Estado edición
  const [editandoLabel, setEditandoLabel]   = useState(false);
  const [editandoNotas, setEditandoNotas]   = useState(false);
  const [labelTemp, setLabelTemp]           = useState('');
  const [notasTemp, setNotasTemp]           = useState('');
  const [guardandoPerfil, setGuardandoP]    = useState(false);

  // Filtro por etiqueta
  const [filtroLabel, setFiltroLabel] = useState<string>('todos');

  useEffect(() => {
    if (!negocio) return;
    supabase
      .from('clients')
      .select('*')
      .eq('business_id', negocio)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setClientes(data || []);
        setCargando(false);
      });
  }, [negocio]);

  async function abrirHistorial(cliente: Cliente) {
    setCliente(cliente);
    setLabelTemp(cliente.label || 'nuevo');
    setNotasTemp(cliente.internal_notes || '');
    setEditandoLabel(false);
    setEditandoNotas(false);
    setCargandoH(true);
    const { data } = await supabase
      .from('appointments')
      .select('id, start_datetime, status, notes, services(name, price)')
      .eq('client_id', cliente.id)
      .order('start_datetime', { ascending: false });
    setHistorial((data as any[]) || []);
    setCargandoH(false);
  }

  function cerrarPanel() {
    setCliente(null);
    setHistorial([]);
    setEditandoLabel(false);
    setEditandoNotas(false);
  }

  async function guardarPerfil() {
    if (!clienteSeleccionado) return;
    setGuardandoP(true);
    const { error } = await supabase
      .from('clients')
      .update({ label: labelTemp, internal_notes: notasTemp })
      .eq('id', clienteSeleccionado.id);

    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      const actualizado = { ...clienteSeleccionado, label: labelTemp, internal_notes: notasTemp };
      setCliente(actualizado);
      setClientes(prev => prev.map(c => c.id === actualizado.id ? actualizado : c));
      setEditandoLabel(false);
      setEditandoNotas(false);
    }
    setGuardandoP(false);
  }

  const clientesFiltrados = filtroLabel === 'todos'
    ? clientes
    : clientes.filter(c => (c.label || 'nuevo') === filtroLabel);

  if (cargando) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="flex gap-5">

      {/* ── Tabla de clientes ── */}
      <div className={`transition-all duration-300 ${clienteSeleccionado ? 'w-1/2' : 'w-full'}`}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <User size={22} className="text-indigo-600" /> Directorio de Clientes
            <span className="text-sm font-normal text-gray-400">({clientesFiltrados.length})</span>
          </h2>

          {/* Filtro por etiqueta */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setFiltroLabel('todos')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${filtroLabel === 'todos' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              Todos
            </button>
            {Object.entries(ETIQUETAS).map(([key, cfg]) => (
              <button key={key} onClick={() => setFiltroLabel(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${filtroLabel === key ? `bg-white shadow-sm ${cfg.clase}` : 'text-gray-400 hover:text-gray-600'}`}>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            {filtroLabel === 'todos' ? 'Aún no hay clientes registrados.' : `No hay clientes con etiqueta "${ETIQUETAS[filtroLabel]?.label}".`}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500 bg-gray-50">
                  <th className="px-5 py-3 font-semibold">Nombre</th>
                  <th className="px-5 py-3 font-semibold hidden sm:table-cell">WhatsApp</th>
                  <th className="px-5 py-3 font-semibold">Etiqueta</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} onClick={() => abrirHistorial(cliente)}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      clienteSeleccionado?.id === cliente.id
                        ? 'bg-indigo-50 border-l-4 border-l-indigo-500'
                        : 'hover:bg-gray-50'
                    }`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 font-medium text-gray-900">
                        <div className="bg-indigo-100 p-1.5 rounded-full text-indigo-600 shrink-0">
                          <User size={14} />
                        </div>
                        {cliente.name || <span className="text-gray-400 italic text-sm">Sin nombre</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-sm hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-gray-400" /> {cliente.phone_number}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <EtiquetaBadge label={cliente.label || 'nuevo'} />
                    </td>
                    <td className="px-5 py-4">
                      <ChevronRight size={16} className={clienteSeleccionado?.id === cliente.id ? 'text-indigo-500' : 'text-gray-300'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Panel lateral ── */}
      {clienteSeleccionado && (
        <div className="w-1/2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col max-h-[85vh]">

          {/* Header */}
          <div className="flex justify-between items-start p-5 border-b border-gray-100 bg-gray-50 shrink-0">
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900 text-lg">
                {clienteSeleccionado.name || 'Sin nombre'}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone size={13} /> {clienteSeleccionado.phone_number}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <EtiquetaBadge label={clienteSeleccionado.label || 'nuevo'} />
                <span className="text-xs text-gray-400">
                  desde {new Date(clienteSeleccionado.created_at).toLocaleDateString('es-GT')}
                </span>
              </div>
            </div>
            <button onClick={cerrarPanel} className="text-gray-400 hover:text-red-500 transition-colors p-1">
              <X size={18} />
            </button>
          </div>

          {/* Edición de etiqueta y notas */}
          <div className="p-4 border-b border-gray-100 shrink-0 space-y-3">

            {/* Etiqueta */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                  <Tag size={12} className="text-indigo-500" /> Etiqueta
                </label>
                {!editandoLabel && (
                  <button onClick={() => setEditandoLabel(true)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold">
                    Cambiar
                  </button>
                )}
              </div>
              {editandoLabel ? (
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(ETIQUETAS).map(([key, cfg]) => (
                    <button key={key} onClick={() => setLabelTemp(key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        labelTemp === key ? `${cfg.clase} border-current` : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              ) : (
                <EtiquetaBadge label={labelTemp} />
              )}
            </div>

            {/* Notas internas */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                  <FileText size={12} className="text-indigo-500" /> Notas internas
                </label>
                {!editandoNotas && (
                  <button onClick={() => setEditandoNotas(true)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold">
                    {notasTemp ? 'Editar' : 'Agregar'}
                  </button>
                )}
              </div>
              {editandoNotas ? (
                <textarea rows={2} value={notasTemp}
                  onChange={e => setNotasTemp(e.target.value)}
                  placeholder="Notas privadas sobre este cliente..."
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
              ) : notasTemp ? (
                <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-lg p-2.5 whitespace-pre-line">
                  {notasTemp}
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic">Sin notas.</p>
              )}
            </div>

            {/* Botón guardar (solo si hay cambios pendientes) */}
            {(editandoLabel || editandoNotas) && (
              <button onClick={guardarPerfil} disabled={guardandoPerfil}
                className={`w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-xl text-white transition-colors ${
                  guardandoPerfil ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}>
                <Save size={14} /> {guardandoPerfil ? 'Guardando...' : 'Guardar cambios'}
              </button>
            )}
          </div>

          {/* Stats */}
          {!cargandoH && historial.length > 0 && (
            <div className="grid grid-cols-3 gap-3 p-4 border-b border-gray-100 shrink-0">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {historial.filter(c => c.status === 'completed').length}
                </p>
                <p className="text-xs text-gray-500">Completadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">
                  {historial.filter(c => c.status === 'no-show').length}
                </p>
                <p className="text-xs text-gray-500">No asistió</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  Q{historial
                    .filter(c => c.status === 'completed')
                    .reduce((t, c) => {
                      const srv = Array.isArray(c.services) ? c.services[0] : c.services;
                      return t + (Number(srv?.price) || 0);
                    }, 0).toFixed(0)}
                </p>
                <p className="text-xs text-gray-500">Total cobrado</p>
              </div>
            </div>
          )}

          {/* Historial de citas */}
          <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {cargandoH ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-lg" />)}
              </div>
            ) : historial.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                Este cliente no tiene citas registradas.
              </div>
            ) : (
              historial.map((cita) => {
                const srv   = Array.isArray(cita.services) ? cita.services[0] : cita.services;
                const badge = BADGE_CITA[cita.status] ?? BADGE_CITA['scheduled'];
                const fecha = new Date(cita.start_datetime).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
                const hora  = new Date(cita.start_datetime).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={cita.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={13} className="text-indigo-400" /> {fecha}
                          <span className="text-gray-300">·</span>
                          <Clock size={13} className="text-indigo-400" /> {hora}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{srv?.name}</p>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge.clase}`}>
                            {badge.label}
                          </span>
                          {srv?.price && (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                              <DollarSign size={11} /> Q{srv.price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {cita.notes && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-xs text-amber-800 whitespace-pre-line">
                        {cita.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}