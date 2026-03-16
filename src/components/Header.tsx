// src/components/Header.tsx
import { useState, useEffect } from 'react';
import { Building2, LayoutDashboard, Calendar, Users, Scissors, Settings, LogOut, Bell, X } from 'lucide-react';
import { logout } from '../services/auth.service';
import { supabase } from '../supabase';

type Vista = 'dashboard' | 'agenda' | 'clientes' | 'servicios' | 'configuracion';

interface HeaderProps {
  vistaActual: Vista;
  onCambiarVista: (v: Vista) => void;
  onLogout: () => void;
  email: string;
  role: string;
  negocio: string;
}

interface Notificacion {
  id: string;
  message: string;
  seen: boolean;
  created_at: string;
}

const NAV_ITEMS: { id: Vista; label: string; icono: React.ReactNode }[] = [
  { id: 'dashboard',     label: 'Dashboard',     icono: <LayoutDashboard size={16} /> },
  { id: 'agenda',        label: 'Agenda',         icono: <Calendar size={16} /> },
  { id: 'clientes',      label: 'Clientes',       icono: <Users size={16} /> },
  { id: 'servicios',     label: 'Servicios',      icono: <Scissors size={16} /> },
  { id: 'configuracion', label: 'Configuración',  icono: <Settings size={16} /> },
];

export function Header({ vistaActual, onCambiarVista, onLogout, email, role, negocio }: HeaderProps) {
  const [notifs, setNotifs]       = useState<Notificacion[]>([]);
  const [abierto, setAbierto]     = useState(false);

  const noVistas = notifs.filter(n => !n.seen).length;

  useEffect(() => {
    if (!negocio) return;
    cargarNotifs();

    // Suscripción en tiempo real
    const canal = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `business_id=eq.${negocio}`,
      }, payload => {
        setNotifs(prev => [payload.new as Notificacion, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [negocio]);

  async function cargarNotifs() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('business_id', negocio)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifs(data || []);
  }

  async function marcarTodasVistas() {
    await supabase
      .from('notifications')
      .update({ seen: true })
      .eq('business_id', negocio)
      .eq('seen', false);
    setNotifs(prev => prev.map(n => ({ ...n, seen: true })));
  }

  async function handleLogout() {
    await logout();
    onLogout();
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4">
        {/* Barra superior */}
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Building2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Panel Admin</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Campana de notificaciones */}
            <div className="relative">
              <button
                onClick={() => { setAbierto(!abierto); if (!abierto && noVistas > 0) marcarTodasVistas(); }}
                className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <Bell size={18} />
                {noVistas > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {noVistas > 9 ? '9+' : noVistas}
                  </span>
                )}
              </button>

              {/* Dropdown notificaciones */}
              {abierto && (
                <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <span className="font-bold text-gray-800 text-sm">Notificaciones</span>
                    <button onClick={() => setAbierto(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifs.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">Sin notificaciones</div>
                    ) : (
                      notifs.map(n => (
                        <div key={n.id} className={`px-4 py-3 text-sm ${n.seen ? 'bg-white' : 'bg-indigo-50'}`}>
                          <p className="text-gray-700 leading-snug">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(n.created_at).toLocaleString('es-GT', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-700">{email}</p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
            >
              <LogOut size={15} /> Salir
            </button>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex gap-1 pb-0">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => onCambiarVista(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                vistaActual === item.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
              }`}
            >
              {item.icono}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}