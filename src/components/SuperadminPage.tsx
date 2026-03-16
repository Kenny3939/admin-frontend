// src/components/SuperadminPage.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { logout } from '../services/auth.service';
import {
  Building2, Users, Wifi, WifiOff, Plus, X, Save,
  LogOut, ShieldCheck, RefreshCw
} from 'lucide-react';

interface Negocio {
  id: string;
  name: string;
  whatsapp_number: string;
  status: string;
  plan: string;
  created_at: string;
  // usuarios enlazados
  users?: { email: string; role: string }[];
}

interface SuperadminPageProps {
  onLogout: () => void;
}

export function SuperadminPage({ onLogout }: SuperadminPageProps) {
  const [negocios, setNegocios]         = useState<Negocio[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando]       = useState(false);

  // Form nuevo negocio
  const [nombre, setNombre]       = useState('');
  const [whatsapp, setWhatsapp]   = useState('');
  const [plan, setPlan]           = useState('basic');
  const [emailAdmin, setEmailAdmin]     = useState('');
  const [passAdmin, setPassAdmin]       = useState('');
  const [openTime, setOpenTime]   = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [capacity, setCapacity]   = useState(1);

  async function cargarNegocios() {
    setCargando(true);
    const { data } = await supabase
      .from('businesses')
      .select('*, users(email, role)')
      .order('created_at', { ascending: false });
    setNegocios(data || []);
    setCargando(false);
  }

  useEffect(() => { cargarNegocios(); }, []);

  async function crearNegocio(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);

    try {
      // 1. Crear negocio
      const { data: negocio, error: errNeg } = await supabase
        .from('businesses')
        .insert([{
          name: nombre,
          whatsapp_number: whatsapp,
          plan,
          status: 'active',
          open_time: openTime,
          close_time: closeTime,
          capacity,
        }])
        .select()
        .single();

      if (errNeg) throw errNeg;

      // 2. Crear usuario en Supabase Auth
      const { data: authData, error: errAuth } = await supabase.auth.admin.createUser({
        email: emailAdmin,
        password: passAdmin,
        email_confirm: true,
      });

      if (errAuth) throw errAuth;

      // 3. Crear perfil en tabla users
      const { error: errUser } = await supabase
        .from('users')
        .insert([{
          auth_id: authData.user.id,
          business_id: negocio.id,
          email: emailAdmin,
          role: 'admin',
        }]);

      if (errUser) throw errUser;

      alert(`✅ Negocio "${nombre}" creado. Credenciales enviadas a ${emailAdmin}`);
      setMostrarModal(false);
      setNombre(''); setWhatsapp(''); setEmailAdmin(''); setPassAdmin('');
      cargarNegocios();

    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setGuardando(false);
    }
  }

  async function toggleEstado(negocioId: string, estadoActual: string) {
    const nuevoEstado = estadoActual === 'active' ? 'inactive' : 'active';
    await supabase.from('businesses').update({ status: nuevoEstado }).eq('id', negocioId);
    cargarNegocios();
  }

  async function handleLogout() {
    await logout();
    onLogout();
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Centro de Mando</h1>
            <p className="text-xs text-gray-500">Superadmin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={cargarNegocios}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Recargar"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Building2 size={20} className="text-indigo-600" />
              <span className="text-sm text-gray-500 font-medium">Total Negocios</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{negocios.length}</span>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Wifi size={20} className="text-emerald-600" />
              <span className="text-sm text-gray-500 font-medium">Activos</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">
              {negocios.filter(n => n.status === 'active').length}
            </span>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users size={20} className="text-blue-600" />
              <span className="text-sm text-gray-500 font-medium">Con Admin</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">
              {negocios.filter(n => n.users && n.users.length > 0).length}
            </span>
          </div>
        </div>

        {/* Directorio de negocios */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building2 size={20} className="text-indigo-600" /> Directorio de Estéticas
            </h2>
            <button
              onClick={() => setMostrarModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} /> Nueva Estética
            </button>
          </div>

          {cargando ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {negocios.map(negocio => (
                <div key={negocio.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-indigo-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${negocio.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <div>
                      <h3 className="font-bold text-gray-900">{negocio.name}</h3>
                      <div className="flex items-center gap-4 mt-0.5">
                        <span className="text-xs text-gray-500">📱 {negocio.whatsapp_number}</span>
                        {negocio.users?.[0] && (
                          <span className="text-xs text-gray-500">👤 {negocio.users[0].email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      negocio.plan === 'pro'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {negocio.plan}
                    </span>
                    <button
                      onClick={() => toggleEstado(negocio.id, negocio.status)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        negocio.status === 'active'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {negocio.status === 'active'
                        ? <><WifiOff size={12} /> Desactivar</>
                        : <><Wifi size={12} /> Activar</>
                      }
                    </button>
                  </div>
                </div>
              ))}

              {negocios.length === 0 && (
                <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  No hay negocios registrados todavía.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal nueva estética */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50 sticky top-0">
              <h3 className="font-bold text-lg text-gray-900">Registrar Nueva Estética</h3>
              <button onClick={() => setMostrarModal(false)} className="text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={crearNegocio} className="p-6 space-y-4">
              <p className="text-xs text-gray-500 bg-indigo-50 p-3 rounded-lg">
                Esto crea el negocio en la base de datos <strong>y</strong> las credenciales de acceso al panel.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Negocio</label>
                  <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej. Bella Glow Studio" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Número WhatsApp</label>
                  <input type="text" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="502XXXXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Plan</label>
                  <select value={plan} onChange={e => setPlan(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hora Apertura</label>
                  <input type="time" required value={openTime} onChange={e => setOpenTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hora Cierre</label>
                  <input type="time" required value={closeTime} onChange={e => setCloseTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Capacidad (empleados)</label>
                  <input type="number" min={1} required value={capacity} onChange={e => setCapacity(parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <hr className="border-gray-100" />
              <p className="text-sm font-semibold text-gray-700">Acceso al Panel Admin</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email del Admin</label>
                  <input type="email" required value={emailAdmin} onChange={e => setEmailAdmin(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="dueno@negocio.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña inicial</label>
                  <input type="text" required value={passAdmin} onChange={e => setPassAdmin(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Mín. 6 caracteres" />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setMostrarModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold rounded-xl text-white text-sm transition-colors ${guardando ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  <Save size={16} /> {guardando ? 'Creando...' : 'Crear Estética'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}