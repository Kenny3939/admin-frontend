// src/services/appointments.service.ts
// Capa de datos centralizada para todo lo relacionado a citas.
// Los componentes importan de aquí — nunca llaman a supabase directamente.

import { supabase } from '../supabase';

export type AppointmentStatus = 'scheduled' | 'completed' | 'no-show' | 'cancelled';

// ─── Actualizar estado de una cita ───────────────────────────────────────────
export async function actualizarEstadoCita(citaId: string, status: AppointmentStatus) {
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', citaId);

  if (error) throw error;
}

// ─── Stats del día para el Dashboard ─────────────────────────────────────────
export async function obtenerStatsDia(negocioId: string) {
  const hoy = new Date();
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0).toISOString();
  const finDia    = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).toISOString();

  // Traemos todas las citas del día (todos los estados) con el precio del servicio
  const { data, error } = await supabase
    .from('appointments')
    .select('status, services(price)')
    .eq('business_id', negocioId)
    .gte('start_datetime', inicioDia)
    .lte('start_datetime', finDia)
    .in('status', ['scheduled', 'completed', 'no-show']);

  if (error) throw error;

  const citas = data || [];

  const sumarPrecio = (lista: any[]) =>
    lista.reduce((total, cita) => {
      const srv = Array.isArray(cita.services) ? cita.services[0] : cita.services;
      return total + (Number(srv?.price) || 0);
    }, 0);

  const programadas = citas.filter(c => c.status === 'scheduled');
  const completadas = citas.filter(c => c.status === 'completed');
  const noShow      = citas.filter(c => c.status === 'no-show');
  const total       = programadas.length + completadas.length + noShow.length;

  return {
    citasProgramadas:   programadas.length,
    citasCompletadas:   completadas.length,
    citasNoShow:        noShow.length,
    ingresoProyectado:  sumarPrecio(programadas),   // lo que PODRÍA entrar
    ingresoReal:        sumarPrecio(completadas),    // lo que YA entró
    tasaAsistencia:     total > 0 ? Math.round(((completadas.length) / (completadas.length + noShow.length || 1)) * 100) : null,
  };
}

// ─── Total de clientes registrados ───────────────────────────────────────────
export async function obtenerTotalClientes(negocioId: string): Promise<number> {
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', negocioId);

  if (error) throw error;
  return count || 0;
}