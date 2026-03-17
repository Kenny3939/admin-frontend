// src/App.tsx
import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { getProfileByAuthId, logout } from './services/auth.service';
import { LoginPage } from './components/LoginPage';
import { SuperadminPage } from './components/SuperadminPage';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { AgendaView } from './components/AgendaView';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { ServicesView } from './components/ServicesView';
import { SettingsView } from './components/SettingsView';
import { useBreakpoint } from './hooks/useBreakpoint';

type Vista = 'dashboard' | 'agenda' | 'clientes' | 'servicios' | 'configuracion';

interface Perfil {
  id: string;
  role: string;
  business_id: string;
  email: string;
}

type Cita = import('./components/AgendaView').Cita;

export default function App() {
  const [perfil, setPerfil]               = useState<Perfil | null>(null);
  const [cargando, setCargando]           = useState(true);
  const [vistaActual, setVista]           = useState<Vista>('dashboard');
  const [citas, setCitas]                 = useState<Cita[]>([]);
  const [nombreNegocio, setNombreNegocio] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const bp = useBreakpoint();

  const marginLeft = bp === 'mobile' ? '0px' : (bp === 'tablet' || sidebarCollapsed) ? '64px' : '224px';
  const paddingTop = bp === 'mobile' ? '56px' : '52px';

  const cargarCitas = useCallback(async (businessId: string) => {
    const { data } = await supabase
      .from('appointments')
      .select('*, clients(name), services(id, name, price)')
      .eq('business_id', businessId)
      .order('start_datetime', { ascending: true });
    setCitas((data || []) as Cita[]);
  }, []);

  const cargarNombreNegocio = useCallback(async (businessId: string) => {
    const { data } = await supabase.from('businesses').select('name').eq('id', businessId).single();
    if (data) setNombreNegocio(data.name);
  }, []);

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
  }, [cargarCitas, cargarNombreNegocio]);

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 28, height: 28, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Cargando...</p>
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', fontFamily: "'DM Sans', sans-serif" }}>
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
      <Topbar vistaActual={vistaActual} marginLeft={marginLeft} />
      <main style={{ marginLeft, paddingTop, transition: 'margin-left 0.2s', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
          {renderVista()}
        </div>
      </main>
    </div>
  );
}