// src/App.tsx
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { getProfileByAuthId, logout } from './services/auth.service';
import { LoginPage } from './components/LoginPage';
import { SuperadminPage } from './components/SuperadminPage';
import { Header } from './components/Header';
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

export default function App() {
  const [perfil, setPerfil]     = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [vistaActual, setVista] = useState<Vista>('dashboard');
  const [citas, setCitas]       = useState<any[]>([]);

  useEffect(() => {
    // ─── Carga inicial desde caché local (sin red, instantáneo) ───────────────
    async function inicializar() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const p = await getProfileByAuthId(session.user.id);
          setPerfil(p);
          if (p && p.role !== 'superadmin') await cargarCitas(p.business_id);
        } catch {
          setPerfil(null);
        }
      }
      setCargando(false);
    }
    inicializar();

    // ─── Escuchar cambios futuros (login / logout) ────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          try {
            const p = await getProfileByAuthId(session.user.id);
            setPerfil(p);
            if (p && p.role !== 'superadmin') await cargarCitas(p.business_id);
          } catch {
            // No hacer logout — puede ser error temporal de red o RLS
            // La sesión sigue válida en localStorage
            setPerfil(null);
          }
        } else {
          setPerfil(null);
          setCitas([]);
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

  // ─── Pantalla de carga ──────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  // ─── Sin sesión → Login ──────────────────────────────────────────────────────
  if (!perfil) {
    return <LoginPage onLogin={() => {}} />;
  }

  // ─── Superadmin → centro de mando ────────────────────────────────────────────
  if (perfil.role === 'superadmin') {
    return <SuperadminPage onLogout={() => logout()} />;
  }

  // ─── Admin / Assistant → panel del negocio ───────────────────────────────────
  function renderVista() {
    switch (vistaActual) {
      case 'dashboard':
        return <DashboardView negocio={perfil!.business_id} />;
      case 'agenda':
        return <AgendaView citas={citas} negocio={perfil!.business_id} />;
      case 'clientes':
        return <ClientsView negocio={perfil!.business_id} />;
      case 'servicios':
        return <ServicesView negocio={perfil!.business_id} />;
      case 'configuracion':
        return <SettingsView negocio={perfil!.business_id} />;
      default:
        return <DashboardView negocio={perfil!.business_id} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        vistaActual={vistaActual}
        onCambiarVista={(v) => setVista(v as Vista)}
        onLogout={() => logout()}
        email={perfil.email}
        role={perfil.role}
        negocio={perfil.business_id}
      />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {renderVista()}
      </main>
    </div>
  );
}