// src/components/DashboardView.tsx
import { useEffect, useState } from 'react';
import { DollarSign, CalendarCheck, UserX, Percent, Users, TrendingUp, Bell } from 'lucide-react';
import { supabase } from '../supabase';
import { obtenerStatsDia, obtenerTotalClientes } from '../services/appointments.service';
import { colors, typography, radius, shadow, spacing } from '../theme';
import { Card, PageHeader, Skeleton } from './Uhih';

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

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ titulo, valor, subtitulo, icono, acento = false }: {
  titulo: string;
  valor: string | number;
  subtitulo: string;
  icono: React.ReactNode;
  acento?: boolean;
}) {
  return (
    <div style={{
      backgroundColor: acento ? colors.accent : colors.bgCard,
      border: `1px solid ${acento ? 'transparent' : colors.border}`,
      borderRadius: radius.xl,
      boxShadow: acento ? '0 4px 14px rgba(37,99,235,0.25)' : shadow.sm,
      padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <p style={{
          fontSize: typography.sm, fontWeight: typography.medium,
          color: acento ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
          margin: 0,
        }}>
          {titulo}
        </p>
        <div style={{
          width: 32, height: 32, borderRadius: radius.md,
          backgroundColor: acento ? 'rgba(255,255,255,0.15)' : colors.bgSubtle,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: acento ? 'white' : colors.textSecondary,
          flexShrink: 0,
        }}>
          {icono}
        </div>
      </div>
      <p style={{
        fontSize: '26px', fontWeight: typography.bold, margin: '0 0 4px',
        color: acento ? 'white' : colors.textPrimary, lineHeight: 1,
      }}>
        {valor}
      </p>
      <p style={{
        fontSize: typography.xs, margin: 0,
        color: acento ? 'rgba(255,255,255,0.6)' : colors.textMuted,
        display: 'flex', alignItems: 'center', gap: '4px',
      }}>
        <TrendingUp size={11} style={{ flexShrink: 0 }} />
        {subtitulo}
      </p>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export function DashboardView({ negocio }: { negocio: string }) {
  const [stats, setStats]               = useState<Stats | null>(null);
  const [cancelaciones, setCancelaciones] = useState<any[]>([]);
  const [cargando, setCargando]         = useState(true);

  useEffect(() => {
    if (!negocio) return;
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
      } catch (e) {
        console.error('Error cargando stats:', e);
      } finally {
        setCargando(false);
      }
    }
    fetchStats();
  }, [negocio]);

  if (cargando) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Resumen de hoy" icon={<LayoutDashboardIcon />} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.lg, marginBottom: spacing.lg }}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} height="100px" borderRadius={radius.xl} />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const tasaTexto = stats.tasaAsistencia !== null ? `${stats.tasaAsistencia}%` : '—';

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Resumen de hoy · ${new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        icon={<CalendarCheck size={18} />}
      />

      {/* ── Fila 1: Ingresos (destacados) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: spacing.lg, marginBottom: spacing.lg }}>
        <StatCard
          acento
          titulo="Ingresos Proyectados"
          valor={`Q${stats.ingresoProyectado.toFixed(2)}`}
          subtitulo={`${stats.citasProgramadas} cita${stats.citasProgramadas !== 1 ? 's' : ''} por atender`}
          icono={<DollarSign size={16} />}
        />
        <StatCard
          titulo="Ingresos Reales"
          valor={`Q${stats.ingresoReal.toFixed(2)}`}
          subtitulo={`${stats.citasCompletadas} cita${stats.citasCompletadas !== 1 ? 's' : ''} finalizadas`}
          icono={<DollarSign size={16} />}
        />
      </div>

      {/* ── Fila 2: Métricas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: spacing.lg, marginBottom: spacing.lg }}>
        <StatCard
          titulo="Citas Programadas"
          valor={stats.citasProgramadas}
          subtitulo="Pendientes hoy"
          icono={<CalendarCheck size={16} />}
        />
        <StatCard
          titulo="No Asistieron"
          valor={stats.citasNoShow}
          subtitulo="Sin presentarse"
          icono={<UserX size={16} />}
        />
        <StatCard
          titulo="Tasa de Asistencia"
          valor={tasaTexto}
          subtitulo={stats.tasaAsistencia !== null ? 'De citas cerradas' : 'Sin datos aún'}
          icono={<Percent size={16} />}
        />
        <StatCard
          titulo="Total Clientes"
          valor={stats.totalClientes}
          subtitulo="En base de datos"
          icono={<Users size={16} />}
        />
      </div>

      {/* ── Cancelaciones recientes ── */}
      <Card padding="none">
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '14px 20px',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <Bell size={15} style={{ color: colors.danger }} />
          <p style={{ margin: 0, fontWeight: typography.semibold, fontSize: typography.sm, color: colors.textPrimary }}>
            Cancelaciones recientes vía WhatsApp
          </p>
        </div>

        {cancelaciones.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: colors.textMuted, fontSize: typography.sm }}>
            ✅ Sin cancelaciones recientes
          </div>
        ) : (
          <div>
            {cancelaciones.map((n, i) => (
              <div key={n.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '14px 20px',
                borderBottom: i < cancelaciones.length - 1 ? `1px solid ${colors.border}` : 'none',
                backgroundColor: !n.seen ? '#FEF2F2' : 'transparent',
              }}>
                <p style={{ margin: 0, fontSize: typography.sm, color: colors.textSecondary, flex: 1 }}>
                  {n.message}
                </p>
                <span style={{ fontSize: typography.xs, color: colors.textMuted, whiteSpace: 'nowrap', marginLeft: '16px' }}>
                  {new Date(n.created_at).toLocaleString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Pequeño helper para el ícono del header
function LayoutDashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}