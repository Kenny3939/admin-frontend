// src/components/Sidebar.tsx
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import {
  LayoutDashboard, Calendar, Users, Scissors,
  Settings, LogOut, Bell, X, ChevronRight,
  Menu, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { colors } from '../theme';

type Vista = 'dashboard' | 'agenda' | 'clientes' | 'servicios' | 'configuracion';

interface SidebarProps {
  vistaActual: Vista;
  onCambiarVista: (v: Vista) => void;
  onLogout: () => void;
  email: string;
  role: string;
  negocio: string;
  nombreNegocio?: string;
  onCollapseChange?: (collapsed: boolean) => void;
}

interface Notificacion {
  id: string;
  message: string;
  seen: boolean;
  created_at: string;
}

const NAV_ITEMS: { id: Vista; label: string; icono: React.ReactNode }[] = [
  { id: 'dashboard',     label: 'Dashboard',     icono: <LayoutDashboard size={18} /> },
  { id: 'agenda',        label: 'Agenda',        icono: <Calendar size={18} /> },
  { id: 'clientes',      label: 'Clientes',      icono: <Users size={18} /> },
  { id: 'servicios',     label: 'Servicios',     icono: <Scissors size={18} /> },
  { id: 'configuracion', label: 'Configuración', icono: <Settings size={18} /> },
];

const ROLE_LABEL: Record<string, string> = {
  admin:      'Administrador',
  assistant:  'Asistente',
  superadmin: 'Superadmin',
};

export function Sidebar({
  vistaActual, onCambiarVista, onLogout, email, role, negocio, nombreNegocio, onCollapseChange
}: SidebarProps) {
  const bp = useBreakpoint();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [collapsed, setCollapsed]     = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [notifs, setNotifs]           = useState<Notificacion[]>([]);

  const noVistas   = notifs.filter(n => !n.seen).length;
  const isCollapsed = bp === 'tablet' || (bp === 'desktop' && collapsed);
  const sidebarW   = isCollapsed ? '72px' : '240px'; // Ligeramente más ancho para respirar mejor
  const showSidebar = bp !== 'mobile' || mobileOpen;

  const cargarNotifs = useCallback(async () => {
    const { data } = await supabase
      .from('notifications').select('*').eq('business_id', negocio)
      .order('created_at', { ascending: false }).limit(20);
    setNotifs((data || []) as Notificacion[]);
  }, [negocio]);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    onCollapseChange?.(next);
  }

  useEffect(() => {
    if (!negocio) return;
    cargarNotifs();
    const canal = supabase
      .channel('sidebar-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `business_id=eq.${negocio}` },
        payload => setNotifs(prev => [payload.new as Notificacion, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [cargarNotifs, negocio]);

  async function abrirNotifs() {
    setNotifOpen(true);
    if (noVistas > 0) {
      await supabase.from('notifications').update({ seen: true }).eq('business_id', negocio).eq('seen', false);
      setNotifs(prev => prev.map(n => ({ ...n, seen: true })));
    }
  }

  function navegar(v: Vista) {
    onCambiarVista(v);
    if (bp === 'mobile') setMobileOpen(false);
  }

  const iniciales = email.slice(0, 2).toUpperCase();

  return (
    <>
      {/* ── Botón hamburguesa (solo móvil) ── */}
      {bp === 'mobile' && (
        <div
          className="fixed top-0 left-0 right-0 z-40 flex items-center px-4 h-14 backdrop-blur-md"
          style={{ backgroundColor: `${colors.sidebar}CC`, borderBottom: `1px solid ${colors.sidebarBorder}` }}
        >
          <button onClick={() => setMobileOpen(true)} className="text-zinc-400 hover:text-white transition-colors p-1 rounded-md">
            <Menu size={20} />
          </button>
          <span className="ml-3 text-white font-medium text-sm tracking-wide">{nombreNegocio || 'Panel Admin'}</span>
          {noVistas > 0 && (
            <button onClick={abrirNotifs} className="ml-auto relative p-1 text-zinc-400 hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute 0 right-0 w-2 h-2 rounded-full bg-blue-500" style={{ boxShadow: `0 0 0 2px ${colors.sidebar}` }} />
            </button>
          )}
        </div>
      )}

      {/* ── Overlay móvil ── */}
      {bp === 'mobile' && mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      {showSidebar && (
        <aside
          className={`fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 ease-in-out`}
          style={{ width: bp === 'mobile' ? '240px' : sidebarW }}
        >
          <div style={{ position: 'absolute', inset: 0, backgroundColor: colors.sidebar, borderRight: `1px solid ${colors.sidebarBorder}` }} />
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo */}
          <div className="flex items-center px-4 py-5 shrink-0 h-[72px] gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              {(nombreNegocio || 'PA').slice(0, 2).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 transition-opacity duration-300">
                <p className="text-zinc-100 font-semibold text-sm truncate tracking-wide">{nombreNegocio || 'Panel Admin'}</p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">Secretaría Virtual</p>
              </div>
            )}
            {bp === 'mobile' && (
              <button onClick={() => setMobileOpen(false)} className="text-zinc-500 hover:text-white transition-colors p-1 ml-auto">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Botón colapsar flotante (solo desktop) */}
          {bp === 'desktop' && (
            <button
              onClick={toggleCollapse}
              className="absolute -right-3.5 top-6 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-700 shadow-sm z-10"
              title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
            </button>
          )}

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map(item => {
              const activo = vistaActual === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navegar(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full group flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-start px-3 py-2.5 gap-3'
                  } ${
                    activo 
                      ? 'bg-white/10 text-white shadow-sm' 
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                  }`}
                >
                  <span className={`${activo ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'} transition-colors flex-shrink-0`}>
                    {item.icono}
                  </span>
                  
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {activo && <ChevronRight size={14} className="text-zinc-600 flex-shrink-0" />}
                    </>
                  )}

                  {/* Punto activo en modo colapsado */}
                  {isCollapsed && activo && (
                    <span className="absolute left-1 w-1 h-1 rounded-full bg-blue-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="p-3 shrink-0 border-t border-white/5">
            {/* Notificaciones */}
            <button
              onClick={abrirNotifs}
              title={isCollapsed ? 'Notificaciones' : undefined}
              className={`w-full group flex items-center rounded-xl text-sm font-medium transition-all duration-200 mb-1 ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-start px-3 py-2.5 gap-3'
              } text-zinc-400 hover:bg-white/5 hover:text-zinc-100 relative`}
            >
              <Bell size={18} className="text-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0" />
              {!isCollapsed && <span className="flex-1 text-left">Notificaciones</span>}
              {noVistas > 0 && (
                <span className={`font-bold flex items-center justify-center bg-blue-500 text-white shadow-sm ${
                  isCollapsed ? 'absolute top-1.5 right-1.5 w-2 h-2 rounded-full' : 'px-2 py-0.5 rounded-full text-[10px]'
                }`}>
                  {!isCollapsed && (noVistas > 9 ? '9+' : noVistas)}
                </span>
              )}
            </button>

            {/* Usuario */}
            {!isCollapsed ? (
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl mt-1 bg-white/[0.03] border border-white/5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/20">
                  {iniciales}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-zinc-200 truncate">{email}</p>
                  <p className="text-[11px] text-zinc-500 truncate mt-0.5">{ROLE_LABEL[role] || role}</p>
                </div>
                <button onClick={onLogout} title="Cerrar sesión"
                  className="shrink-0 p-1.5 rounded-md text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button onClick={onLogout} title="Cerrar sesión"
                className="w-full flex items-center justify-center rounded-xl p-2.5 mt-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                <LogOut size={18} />
              </button>
            )}
          </div>
          </div>
        </aside>
      )}

      {/* ── Panel de notificaciones (slide desde derecha) ── */}
      {notifOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="flex-1 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setNotifOpen(false)} />
          <div className="w-[340px] h-full flex flex-col bg-white dark:bg-[#0A0A0A] border-l border-gray-200 dark:border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 dark:border-white/5">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-zinc-100 text-sm tracking-wide">Notificaciones</h3>
                {noVistas === 0 && <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">Todo al día</p>}
              </div>
              <button onClick={() => setNotifOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <Bell className="w-8 h-8 text-gray-300 dark:text-zinc-800 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-zinc-400">Sin notificaciones</p>
                </div>
              ) : notifs.map(n => (
                <div key={n.id} className={`px-6 py-4 border-b border-gray-50 dark:border-white/5 transition-colors ${!n.seen ? 'bg-blue-50/50 dark:bg-blue-500/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                  <div className="flex gap-3">
                    {!n.seen && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
                    <div>
                      <p className={`text-sm leading-relaxed ${!n.seen ? 'text-gray-900 dark:text-zinc-200 font-medium' : 'text-gray-600 dark:text-zinc-400'}`}>
                        {n.message}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1.5 font-medium">
                        {new Date(n.created_at).toLocaleString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}