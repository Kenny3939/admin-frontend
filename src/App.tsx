// src/App.tsx
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { getProfileByAuthId, logout } from './services/auth.service';
import { LoginPage } from './components/LoginPage';
import { SuperadminPage } from './components/SuperadminPage';
import { Sidebar } from './components/Sidebar';
import { AgendaView } from './components/AgendaView';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { ServicesView } from './components/ServicesView';
import { SettingsView } from './components/SettingsView';

type Vista = 'dashboard' | 'agenda' | 'clientes' | 'servicios' | 'configuracion';

interface Perfil {
  id: string;
  role: string;
  business_id: string;
  email: string;
}

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

export default function App() {
  const [perfil, setPerfil]               = useState<Perfil | null>(null);
  const [cargando, setCargando]           = useState(true);
  const [vistaActual, setVista]           = useState<Vista>('dashboard');
  const [citas, setCitas]                 = useState<any[]>([]);
  const [nombreNegocio, setNombreNegocio] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const bp = useBreakpoint();

  // Margen izquierdo dinámico según estado de sidebar
  const marginLeft = bp === 'mobile' ? '0px' : (bp === 'tablet' || sidebarCollapsed) ? '64px' : '224px';
  const paddingTop = bp === 'mobile' ? '56px' : '0px'; // espacio para topbar móvil

  useEffect(() => {
    async function inicializar() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const p = await getProfileByAuthId(session.user.id);
          setPerfil(p);
          if (p && p.role !== 'superadmin') {
            await cargarCitas(p.business_id);
            await cargarNombreNegocio(p.business_id);
          }
        } catch {
          setPerfil(null);
        }
      }
      setCargando(false);
    }
    inicializar();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          try {
            const p = await getProfileByAuthId(session.user.id);
            setPerfil(p);
            if (p && p.role !== 'superadmin') {
              await cargarCitas(p.business_id);
              await cargarNombreNegocio(p.business_id);
            }
          } catch {
            setPerfil(null);
          }
        } else {
          setPerfil(null);
          setCitas([]);
          setNombreNegocio('');
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  async function cargarCitas(businessId: string) {
    const { data } = await supabase
      .from('appointments')
      .select('*, clients(name), services(name, price)')
      .eq('business_id', businessId)
      .order('start_datetime', { ascending: true });
    setCitas(data || []);
  }

  async function cargarNombreNegocio(businessId: string) {
    const { data } = await supabase.from('businesses').select('name').eq('id', businessId).single();
    if (data) setNombreNegocio(data.name);
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0C0C0C' }}>
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm" style={{ color: '#555' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!perfil) return <LoginPage onLogin={() => {}} />;
  if (perfil.role === 'superadmin') return <SuperadminPage onLogout={() => logout()} />;

  function renderVista() {
    switch (vistaActual) {
      case 'dashboard':     return <DashboardView negocio={perfil!.business_id} />;
      case 'agenda':        return <AgendaView citas={citas} negocio={perfil!.business_id} />;
      case 'clientes':      return <ClientsView negocio={perfil!.business_id} />;
      case 'servicios':     return <ServicesView negocio={perfil!.business_id} />;
      case 'configuracion': return <SettingsView negocio={perfil!.business_id} />;
      default:              return <DashboardView negocio={perfil!.business_id} />;
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7F6', fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar
        vistaActual={vistaActual}
        onCambiarVista={(v) => setVista(v as Vista)}
        onLogout={() => logout()}
        email={perfil.email}
        role={perfil.role}
        negocio={perfil.business_id}
        nombreNegocio={nombreNegocio}
        onCollapseChange={setSidebarCollapsed}
      />
      <main
        className="min-h-screen transition-all duration-200"
        style={{ marginLeft, paddingTop }}
      >
        <div className="max-w-5xl mx-auto px-6 py-8">
          {renderVista()}
        </div>
      </main>
    </div>
  );
}