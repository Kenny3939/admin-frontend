// src/components/ServicesView.tsx
import { Scissors, Clock, DollarSign, Plus, Power, X, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// ✅ Solo recibe negocio — carga sus propios servicios internamente
export function ServicesView({ negocio }: { negocio: string }) {
  const [listaServicios, setListaServicios] = useState<any[]>([]);
  const [cargando, setCargando]             = useState(true);
  const [mostrarModal, setMostrarModal]     = useState(false);

  const [nombre, setNombre]   = useState('');
  const [duracion, setDuracion] = useState(30);
  const [precio, setPrecio]   = useState(0);
  const [guardando, setGuardando] = useState(false);

  async function cargarServicios() {
    if (!negocio) return;
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', negocio)
      .order('name', { ascending: true });
    setListaServicios(data || []);
    setCargando(false);
  }

  useEffect(() => { cargarServicios(); }, [negocio]);

  async function toggleActivo(id: string, estadoActual: boolean) {
    const nuevoEstado = !estadoActual;
    setListaServicios(prev => prev.map(s => s.id === id ? { ...s, is_active: nuevoEstado } : s));
    const { error } = await supabase.from('services').update({ is_active: nuevoEstado }).eq('id', id);
    if (error) {
      alert('Error al actualizar: ' + error.message);
      cargarServicios();
    }
  }

  async function agregarServicio(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);

    const { data, error } = await supabase
      .from('services')
      .insert([{ business_id: negocio, name: nombre, duration_minutes: duracion, price: precio, is_active: true }])
      .select();

    if (error) {
      alert('Error al crear el servicio: ' + error.message);
    } else if (data) {
      setListaServicios(prev => [...prev, data[0]]);
      setMostrarModal(false);
      setNombre(''); setDuracion(30); setPrecio(0);
    }
    setGuardando(false);
  }

  if (cargando) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse h-40 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Scissors size={24} className="text-indigo-600" /> Catálogo de Servicios
        </h2>
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Nuevo Servicio
        </button>
      </div>

      {listaServicios.length === 0 ? (
        <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
          No hay servicios configurados aún. ¡Agrega el primero!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listaServicios.map((servicio) => (
            <div
              key={servicio.id}
              className={`bg-white border p-5 rounded-xl shadow-sm transition-all ${
                servicio.is_active === false
                  ? 'border-red-200 opacity-60'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className={`text-lg font-bold capitalize ${servicio.is_active === false ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                  {servicio.name}
                </h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  servicio.is_active === false
                    ? 'bg-red-100 text-red-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {servicio.is_active === false ? 'Inactivo' : 'Activo'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-2"><Clock size={16} /> Duración</span>
                  <span className="font-medium text-gray-900">{servicio.duration_minutes} min</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-2"><DollarSign size={16} /> Precio</span>
                  <span className="font-bold text-emerald-600">Q{servicio.price || '0.00'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => toggleActivo(servicio.id, servicio.is_active !== false)}
                  className={`w-full flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
                    servicio.is_active === false
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  <Power size={14} />
                  {servicio.is_active === false ? 'Activar Servicio' : 'Desactivar Servicio'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nuevo servicio */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Crear Nuevo Servicio</h3>
              <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={agregarServicio} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Servicio</label>
                <input type="text" required placeholder="Ej: Corte de Cabello" value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Duración (min)</label>
                  <input type="number" required min="5" step="5" value={duracion}
                    onChange={e => setDuracion(parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Precio (Q)</label>
                  <input type="number" required min="0" step="0.01" value={precio}
                    onChange={e => setPrecio(parseFloat(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setMostrarModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-semibold rounded-xl text-white transition-colors ${guardando ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  <Save size={18} /> {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
