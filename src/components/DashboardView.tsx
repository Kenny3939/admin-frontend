// src/components/DashboardView.tsx
import { useEffect, useState } from 'react';
import { DollarSign, Users, CalendarCheck, TrendingUp, CheckCircle, UserX, Percent, Bell } from 'lucide-react';
import { obtenerStatsDia, obtenerTotalClientes } from '../services/appointments.service';
import { supabase } from '../supabase';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Stats {
  citasProgramadas:  number;
  citasCompletadas:  number;
  citasNoShow:       number;
  ingresoProyectado: number;
  ingresoReal:       number;
  tasaAsistencia:    number | null;
  totalClientes:     number;
}

// ─── Tarjeta reutilizable ─────────────────────────────────────────────────────
function StatCard({
  titulo, valor, subtitulo, icono, gradiente, borde
}: {
  titulo: string;
  valor: string | number;
  subtitulo: string;
  icono: React.ReactNode;
  gradiente?: string;
  borde?: string;
}) {
  if (gradiente) {
    return (
      <div className={`${gradiente} p-6 rounded-2xl shadow-lg text-white`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">{titulo}</p>
            <h3 className="text-4xl font-bold">{valor}</h3>
          </div>
          <div className="bg-white/20 p-3 rounded-xl">{icono}</div>
        </div>
        <p className="text-white/70 text-xs mt-4 flex items-center gap-1">
          <TrendingUp size={12} /> {subtitulo}
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border ${borde ?? 'border-gray-200'} p-6 rounded-2xl shadow-sm hover:border-opacity-80 transition-colors`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{titulo}</p>
          <h3 className="text-4xl font-bold text-gray-900">{valor}</h3>
        </div>
        <div className="bg-gray-50 p-3 rounded-xl">{icono}</div>
      </div>
      <p className="text-gray-400 text-xs mt-4">{subtitulo}</p>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function DashboardView({ negocio }: { negocio: string }) {
  const [stats, setStats]           = useState<Stats | null>(null);
  const [cargando, setCargando]     = useState(true);
  const [cancelaciones, setCancelaciones] = useState<any[]>([]);

  useEffect(() => {
    if (!negocio) return;
    setCargando(true);

    async function fetchStats() {
      try {
        const [dia, totalClientes, { data: nots }] = await Promise.all([
          obtenerStatsDia(negocio),
          obtenerTotalClientes(negocio),
          supabase.from('notifications').select('*').eq('business_id', negocio)
            .eq('type', 'cancellation').order('created_at', { ascending: false }).limit(5),
        ]);
        setStats({ ...dia, totalClientes });
        setCancelaciones(nots || []);
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      } finally {
        setCargando(false);
      }
    }

    fetchStats();
  }, [negocio]);

  if (cargando) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Resumen de Hoy</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse h-36 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const tasaTexto = stats.tasaAsistencia !== null
    ? `${stats.tasaAsistencia}%`
    : '—';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Resumen de Hoy</h2>

      {/* ── Fila 1: Ingresos ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <StatCard
          titulo="Ingresos Proyectados"
          valor={`Q${stats.ingresoProyectado.toFixed(2)}`}
          subtitulo={`${stats.citasProgramadas} cita${stats.citasProgramadas !== 1 ? 's' : ''} por atender hoy`}
          gradiente="bg-gradient-to-br from-indigo-500 to-indigo-700"
          icono={<DollarSign size={24} className="text-white" />}
        />

        <StatCard
          titulo="Ingresos Reales (Cobrados)"
          valor={`Q${stats.ingresoReal.toFixed(2)}`}
          subtitulo={`${stats.citasCompletadas} cita${stats.citasCompletadas !== 1 ? 's' : ''} finalizadas hoy`}
          gradiente="bg-gradient-to-br from-emerald-500 to-emerald-700"
          icono={<CheckCircle size={24} className="text-white" />}
        />
      </div>

      {/* ── Fila 2: Asistencia y clientes ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <StatCard
          titulo="Citas Programadas"
          valor={stats.citasProgramadas}
          subtitulo="Pendientes de atender hoy"
          borde="border-indigo-200"
          icono={<CalendarCheck size={24} className="text-indigo-600" />}
        />

        <StatCard
          titulo="No Asistieron"
          valor={stats.citasNoShow}
          subtitulo="Clientes que no se presentaron"
          borde="border-orange-200"
          icono={<UserX size={24} className="text-orange-500" />}
        />

        <StatCard
          titulo="Tasa de Asistencia"
          valor={tasaTexto}
          subtitulo={
            stats.tasaAsistencia !== null
              ? 'De las citas cerradas (completadas + no-show)'
              : 'Sin datos cerrados aún hoy'
          }
          borde="border-purple-200"
          icono={<Percent size={24} className="text-purple-600" />}
        />
      </div>

      {/* ── Fila 3: CRM ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          titulo="Total en Base de Datos"
          valor={stats.totalClientes}
          subtitulo="Clientes registrados históricamente"
          borde="border-blue-200"
          icono={<Users size={24} className="text-blue-600" />}
        />
      </div>

      {/* ── Cancelaciones recientes ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-red-50">
          <Bell size={16} className="text-red-500" />
          <h3 className="font-bold text-gray-800 text-sm">Cancelaciones Recientes por WhatsApp</h3>
        </div>
        {cancelaciones.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No hay cancelaciones recientes. ✅
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {cancelaciones.map(n => (
              <div key={n.id} className={`flex justify-between items-start px-5 py-3.5 ${n.seen ? '' : 'bg-red-50/40'}`}>
                <p className="text-sm text-gray-700">{n.message}</p>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                  {new Date(n.created_at).toLocaleString('es-GT', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}