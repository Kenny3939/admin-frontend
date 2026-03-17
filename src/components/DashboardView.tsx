// src/components/DashboardView.tsx
import { useEffect, useState } from 'react';
import { DollarSign, CalendarCheck, UserX, Percent, Users, Bell, ArrowUpRight } from 'lucide-react';
import { supabase } from '../supabase';
import { obtenerStatsDia, obtenerTotalClientes } from '../services/appointments.service';
import { colors, typography, radius, shadow, spacing } from '../theme';

interface Stats {
  citasProgramadas:  number;
  citasCompletadas:  number;
  citasNoShow:       number;
  ingresoProyectado: number;
  ingresoReal:       number;
  tasaAsistencia:    number | null;
  totalClientes:     number;
}

interface NotificationLite {
  id: string;
  message: string;
  seen: boolean;
  created_at: string;
}

// ─── Stat Card estilo Mercury ─────────────────────────────────────────────────
function StatCard({ titulo, valor, sub, icono, highlight = false }: {
  titulo: string;
  valor: string | number;
  sub: string;
  icono: React.ReactNode;
  highlight?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: colors.bgCard,
        border: `1px solid ${hovered ? colors.borderStrong : colors.border}`,
        borderRadius: radius.xl,
        padding: '20px 22px',
        boxShadow: hovered ? shadow.md : shadow.sm,
        transition: 'all 0.15s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent line top */}
      {highlight && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          backgroundColor: colors.accent,
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {titulo}
        </p>
        <span style={{ color: highlight ? colors.accent : colors.textMuted }}>
          {icono}
        </span>
      </div>

      <p style={{ margin: '0 0 6px', fontSize: typography.xxxl, fontWeight: typography.bold, color: colors.textPrimary, lineHeight: 1, letterSpacing: '-0.02em' }}>
        {valor}
      </p>

      <p style={{ margin: 0, fontSize: typography.xs, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '3px' }}>
        <ArrowUpRight size={11} />
        {sub}
      </p>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ h = '96px' }: { h?: string }) {
  return (
    <div style={{
      height: h, borderRadius: radius.xl,
      backgroundColor: colors.bgMuted,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export function DashboardView({ negocio }: { negocio: string }) {
  const [stats, setCancelaciones]         = useState<Stats | null>(null);
  const [cancelaciones, setCancel]        = useState<NotificationLite[]>([]);
  const [cargando, setCargando]           = useState(true);

  useEffect(() => {
    if (!negocio) return;
    async function fetch() {
      try {
        const [dia, totalClientes, { data: nots }] = await Promise.all([
          obtenerStatsDia(negocio),
          obtenerTotalClientes(negocio),
          supabase.from('notifications').select('*')
            .eq('business_id', negocio).eq('type', 'cancellation')
            .order('created_at', { ascending: false }).limit(5),
        ]);
        setCancelaciones({ ...dia, totalClientes });
        setCancel((nots || []) as NotificationLite[]);
      } finally {
        setCargando(false);
      }
    }
    fetch();
  }, [negocio]);

  const hoy = new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' });

  if (cargando) return (
    <div>
      <div style={{ marginBottom: spacing.xl }}>
        <Skel h="28px" />
        <div style={{ marginTop: 8 }}><Skel h="16px" /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.lg }}>
        {[...Array(6)].map((_, i) => <Skel key={i} h="110px" />)}
      </div>
    </div>
  );

  if (!stats) return null;

  const tasa = stats.tasaAsistencia !== null ? `${stats.tasaAsistencia}%` : '—';

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: spacing.xxl }}>
        <h1 style={{ margin: '0 0 4px', fontSize: typography.xxl, fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: '-0.02em' }}>
          Buen día 👋
        </h1>
        <p style={{ margin: 0, fontSize: typography.sm, color: colors.textMuted, textTransform: 'capitalize' }}>
          {hoy}
        </p>
      </div>

      {/* ── Ingresos (fila destacada) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: spacing.lg, marginBottom: spacing.lg }}>
        <StatCard
          highlight
          titulo="Ingresos proyectados"
          valor={`Q${stats.ingresoProyectado.toFixed(2)}`}
          sub={`${stats.citasProgramadas} cita${stats.citasProgramadas !== 1 ? 's' : ''} pendientes`}
          icono={<DollarSign size={15} />}
        />
        <StatCard
          titulo="Ingresos reales"
          valor={`Q${stats.ingresoReal.toFixed(2)}`}
          sub={`${stats.citasCompletadas} cita${stats.citasCompletadas !== 1 ? 's' : ''} completadas`}
          icono={<DollarSign size={15} />}
        />
      </div>

      {/* ── Métricas secundarias ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: spacing.lg, marginBottom: spacing.xxl }}>
        <StatCard
          titulo="Citas hoy"
          valor={stats.citasProgramadas}
          sub="Programadas"
          icono={<CalendarCheck size={15} />}
        />
        <StatCard
          titulo="No asistieron"
          valor={stats.citasNoShow}
          sub="Sin presentarse"
          icono={<UserX size={15} />}
        />
        <StatCard
          titulo="Asistencia"
          valor={tasa}
          sub={stats.tasaAsistencia !== null ? 'De citas cerradas' : 'Sin datos aún'}
          icono={<Percent size={15} />}
        />
        <StatCard
          titulo="Clientes"
          valor={stats.totalClientes}
          sub="En base de datos"
          icono={<Users size={15} />}
        />
      </div>

      {/* ── Cancelaciones recientes ── */}
      <div style={{
        backgroundColor: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        boxShadow: shadow.sm,
        overflow: 'hidden',
      }}>
        {/* Header sección */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 22px',
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={14} style={{ color: colors.danger }} />
            <p style={{ margin: 0, fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textPrimary }}>
              Cancelaciones recientes
            </p>
          </div>
          {cancelaciones.length > 0 && (
            <span style={{
              fontSize: typography.xs, fontWeight: typography.bold,
              padding: '2px 8px', borderRadius: radius.full,
              backgroundColor: colors.dangerLight, color: colors.danger,
            }}>
              {cancelaciones.length}
            </span>
          )}
        </div>

        {/* Lista */}
        {cancelaciones.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: colors.textMuted, fontSize: typography.sm }}>
            Sin cancelaciones recientes ✓
          </div>
        ) : (
          cancelaciones.map((n, i) => (
            <div key={n.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 22px',
              borderBottom: i < cancelaciones.length - 1 ? `1px solid ${colors.border}` : 'none',
              backgroundColor: !n.seen ? colors.dangerLight : 'transparent',
              transition: 'background-color 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                {!n.seen && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: colors.danger, flexShrink: 0 }} />}
                <p style={{ margin: 0, fontSize: typography.sm, color: colors.textSecondary }}>{n.message}</p>
              </div>
              <span style={{ fontSize: typography.xs, color: colors.textMuted, whiteSpace: 'nowrap', marginLeft: '16px' }}>
                {new Date(n.created_at).toLocaleString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}