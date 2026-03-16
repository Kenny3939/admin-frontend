// src/components/Sidebar.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import {
  LayoutDashboard, Calendar, Users, Scissors,
  Settings, LogOut, Bell, X, ChevronRight,
  Building2, Menu, PanelLeftClose, PanelLeft
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
  onCollapseChange?: (collapsed: boolean) => void;
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

const ROLE_LABEL: Record<string, string> = {
  admin:      'Administrador',
  assistant:  'Asistente',
  superadmin: 'Superadmin',
};

// ─── Hook para detectar breakpoint ───────────────────────────────────────────
function useBreakpoint() {
  const [bp, setBp] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  useEffect(() => {
    function check() {
      if (window.innerWidth < 768) setBp('mobile');
      else if (window.innerWidth < 1024) setBp('tablet');
      else setBp('desktop');
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return bp;
}

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
  const sidebarW   = isCollapsed ? '64px' : '224px';
  const showSidebar = bp !== 'mobile' || mobileOpen;

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
  }, [negocio]);

  async function cargarNotifs() {
    const { data } = await supabase
      .from('notifications').select('*').eq('business_id', negocio)
      .order('created_at', { ascending: false }).limit(20);
    setNotifs(data || []);
  }

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
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center px-4 h-14"
          style={{ backgroundColor: '#0C0C0C', borderBottom: '1px solid #1F1F1F' }}>
          <button onClick={() => setMobileOpen(true)} style={{ color: '#777' }}
            className="hover:text-white transition-colors p-1">
            <Menu size={20} />
          </button>
          <span className="ml-3 text-white font-semibold text-sm">{nombreNegocio || 'Panel Admin'}</span>
          {noVistas > 0 && (
            <button onClick={abrirNotifs} className="ml-auto relative p-1" style={{ color: '#777' }}>
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
                style={{ backgroundColor: '#EF4444', color: 'white', fontSize: '10px' }}>
                {noVistas > 9 ? '9+' : noVistas}
              </span>
            </button>
          )}
        </div>
      )}

      {/* ── Overlay móvil ── */}
      {bp === 'mobile' && mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      {showSidebar && (
        <aside
          className="fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-200"
          style={{
            width: bp === 'mobile' ? '224px' : sidebarW,
            backgroundColor: '#0C0C0C',
            borderRight: '1px solid #1F1F1F',
          }}
        >
          {/* Logo + colapsar */}
          <div className="flex items-center px-4 py-5 shrink-0"
            style={{ borderBottom: '1px solid #1F1F1F', height: '64px' }}>
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#2563EB' }}>
                <Building2 size={13} className="text-white" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate leading-none">{nombreNegocio || 'Panel Admin'}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: '#555' }}>Secretaría Virtual</p>
                </div>
              )}
            </div>
            {/* Botón colapsar (solo desktop) */}
            {bp === 'desktop' && (
              <button onClick={toggleCollapse}
                className="shrink-0 transition-colors p-1 rounded"
                style={{ color: '#444' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#777'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#444'}>
                {collapsed ? <PanelLeft size={15} /> : <PanelLeftClose size={15} />}
              </button>
            )}
            {/* Botón cerrar (solo móvil) */}
            {bp === 'mobile' && (
              <button onClick={() => setMobileOpen(false)} style={{ color: '#555' }}
                className="hover:text-white transition-colors p-1">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(item => {
              const activo = vistaActual === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navegar(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className="w-full flex items-center rounded-lg text-sm font-medium transition-all duration-150"
                  style={{
                    padding: isCollapsed ? '10px 0' : '10px 12px',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: isCollapsed ? '0' : '10px',
                    backgroundColor: activo ? '#1A1A1A' : 'transparent',
                    color: activo ? '#FFFFFF' : '#666',
                  }}
                  onMouseEnter={e => { if (!activo) { (e.currentTarget as HTMLElement).style.backgroundColor = '#141414'; (e.currentTarget as HTMLElement).style.color = '#CCC'; } }}
                  onMouseLeave={e => { if (!activo) { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#666'; } }}
                >
                  <span style={{ color: activo ? '#3B82F6' : 'inherit', flexShrink: 0 }}>{item.icono}</span>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {activo && <ChevronRight size={13} style={{ color: '#333', flexShrink: 0 }} />}
                    </>
                  )}
                  {/* Punto activo en modo colapsado */}
                  {isCollapsed && activo && (
                    <span className="absolute right-2 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="px-2 pb-3 shrink-0" style={{ borderTop: '1px solid #1F1F1F', paddingTop: '10px' }}>

            {/* Notificaciones */}
            <button
              onClick={abrirNotifs}
              title={isCollapsed ? 'Notificaciones' : undefined}
              className="w-full flex items-center rounded-lg text-sm font-medium transition-all duration-150 relative"
              style={{
                padding: isCollapsed ? '10px 0' : '10px 12px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isCollapsed ? '0' : '10px',
                color: '#666',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#141414'; (e.currentTarget as HTMLElement).style.color = '#CCC'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#666'; }}
            >
              <Bell size={16} style={{ flexShrink: 0 }} />
              {!isCollapsed && <span className="flex-1 text-left">Notificaciones</span>}
              {noVistas > 0 && (
                <span className={`font-bold rounded-full flex items-center justify-center ${isCollapsed ? 'absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px]' : 'px-1.5 py-0.5 text-xs'}`}
                  style={{ backgroundColor: '#EF4444', color: 'white', minWidth: isCollapsed ? '16px' : 'auto' }}>
                  {noVistas > 9 ? '9+' : noVistas}
                </span>
              )}
            </button>

            {/* Usuario */}
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg mt-0.5"
                style={{ backgroundColor: '#141414' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ backgroundColor: '#1E3A8A', color: '#93C5FD' }}>
                  {iniciales}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: '#CCC' }}>{email}</p>
                  <p className="text-xs truncate" style={{ color: '#444' }}>{ROLE_LABEL[role] || role}</p>
                </div>
                <button onClick={onLogout} title="Cerrar sesión"
                  className="shrink-0 transition-colors p-1"
                  style={{ color: '#444' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#EF4444'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#444'}>
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button onClick={onLogout} title="Cerrar sesión"
                className="w-full flex items-center justify-center rounded-lg py-2.5 transition-all duration-150 mt-0.5"
                style={{ color: '#444' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#141414'; (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#444'; }}>
                <LogOut size={15} />
              </button>
            )}
          </div>
        </aside>
      )}

      {/* ── Panel de notificaciones (slide desde derecha) ── */}
      {notifOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1" onClick={() => setNotifOpen(false)} />
          <div className="w-80 h-full flex flex-col shadow-2xl animate-slide-in"
            style={{ backgroundColor: '#FFFFFF', borderLeft: '1px solid #E5E5E5' }}>
            <div className="flex justify-between items-center px-5 py-4"
              style={{ borderBottom: '1px solid #F0F0F0' }}>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Notificaciones</h3>
                {noVistas === 0 && <p className="text-xs text-gray-400 mt-0.5">Todo al día</p>}
              </div>
              <button onClick={() => setNotifOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {notifs.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm">Sin notificaciones</div>
              ) : notifs.map(n => (
                <div key={n.id} className={`px-5 py-4 ${!n.seen ? 'bg-blue-50/40' : ''}`}>
                  {!n.seen && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mb-2" />}
                  <p className="text-sm text-gray-700 leading-relaxed">{n.message}</p>
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