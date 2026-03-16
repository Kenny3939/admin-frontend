// src/components/Sidebar.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import {
  LayoutDashboard, Calendar, Users, Scissors,
  Settings, LogOut, Bell, X, ChevronRight, Building2
} from 'lucide-react';

type Vista = 'dashboard' | 'agenda' | 'clientes' | 'servicios' | 'configuracion';

interface SidebarProps {
  vistaActual: Vista;
  onCambiarVista: (v: Vista) => void;
  onLogout: () => void;
  email: string;
  role: string;
  negocio: string;
  nombreNegocio?: string;
}

interface Notificacion {
  id: string;
  message: string;
  seen: boolean;
  created_at: string;
}

const NAV_ITEMS: { id: Vista; label: string; icono: React.ReactNode }[] = [
  { id: 'dashboard',     label: 'Dashboard',      icono: <LayoutDashboard size={16} /> },
  { id: 'agenda',        label: 'Agenda',          icono: <Calendar size={16} /> },
  { id: 'clientes',      label: 'Clientes',        icono: <Users size={16} /> },
  { id: 'servicios',     label: 'Servicios',       icono: <Scissors size={16} /> },
  { id: 'configuracion', label: 'Configuración',   icono: <Settings size={16} /> },
];

const ROLE_LABEL: Record<string, string> = {
  admin:     'Administrador',
  assistant: 'Asistente',
  superadmin: 'Superadmin',
};

export function Sidebar({ vistaActual, onCambiarVista, onLogout, email, role, negocio, nombreNegocio }: SidebarProps) {
  const [notifs, setNotifs]   = useState<Notificacion[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const noVistas = notifs.filter(n => !n.seen).length;

  useEffect(() => {
    if (!negocio) return;
    cargarNotifs();

    const canal = supabase
      .channel('sidebar-notifications')
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

  async function abrirPanel() {
    setPanelOpen(true);
    if (noVistas > 0) {
      await supabase.from('notifications').update({ seen: true }).eq('business_id', negocio).eq('seen', false);
      setNotifs(prev => prev.map(n => ({ ...n, seen: true })));
    }
  }

  const iniciales = email.slice(0, 2).toUpperCase();

  return (
    <>
      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col z-30"
        style={{ backgroundColor: '#0C0C0C', borderRight: '1px solid #1F1F1F' }}>

        {/* Logo */}
        <div className="px-5 py-6" style={{ borderBottom: '1px solid #1F1F1F' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#2563EB' }}>
              <Building2 size={14} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none tracking-tight">
                {nombreNegocio || 'Panel Admin'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#555' }}>Secretaría Virtual</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const activo = vistaActual === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onCambiarVista(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
                style={{
                  backgroundColor: activo ? '#1A1A1A' : 'transparent',
                  color: activo ? '#FFFFFF' : '#777',
                }}
                onMouseEnter={e => { if (!activo) (e.currentTarget as HTMLElement).style.backgroundColor = '#141414'; (e.currentTarget as HTMLElement).style.color = '#CCC'; }}
                onMouseLeave={e => { if (!activo) { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#777'; } }}
              >
                <span style={{ color: activo ? '#2563EB' : 'inherit' }}>{item.icono}</span>
                {item.label}
                {activo && <ChevronRight size={13} className="ml-auto" style={{ color: '#444' }} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-1" style={{ borderTop: '1px solid #1F1F1F', paddingTop: '12px' }}>

          {/* Notificaciones */}
          <button
            onClick={abrirPanel}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={{ color: '#777' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#141414'; (e.currentTarget as HTMLElement).style.color = '#CCC'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#777'; }}
          >
            <Bell size={16} />
            Notificaciones
            {noVistas > 0 && (
              <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#EF4444', color: 'white', minWidth: '18px', textAlign: 'center' }}>
                {noVistas > 9 ? '9+' : noVistas}
              </span>
            )}
          </button>

          {/* Usuario */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ backgroundColor: '#141414' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ backgroundColor: '#1E3A8A', color: '#93C5FD' }}>
              {iniciales}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: '#CCC' }}>{email}</p>
              <p className="text-xs" style={{ color: '#555' }}>{ROLE_LABEL[role] || role}</p>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="shrink-0 transition-colors"
              style={{ color: '#555' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#EF4444'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#555'}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Panel de notificaciones ── */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div className="flex-1" onClick={() => setPanelOpen(false)} />
          {/* Panel */}
          <div className="w-80 h-full flex flex-col shadow-2xl"
            style={{ backgroundColor: '#FFFFFF', borderLeft: '1px solid #E5E5E5' }}>
            <div className="flex justify-between items-center px-5 py-4"
              style={{ borderBottom: '1px solid #F0F0F0' }}>
              <h3 className="font-semibold text-gray-900 text-sm">Notificaciones</h3>
              <button onClick={() => setPanelOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {notifs.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Sin notificaciones
                </div>
              ) : notifs.map(n => (
                <div key={n.id} className={`px-5 py-4 ${!n.seen ? 'bg-blue-50/50' : ''}`}>
                  {!n.seen && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mb-2" />}
                  <p className="text-sm text-gray-700 leading-snug">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {new Date(n.created_at).toLocaleString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}