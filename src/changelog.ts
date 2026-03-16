// src/changelog.ts

export interface VersionEntry {
  version: string;
  fecha: string;
  tipo: 'major' | 'minor' | 'patch';
  titulo: string;
  cambios: {
    tipo: 'fix' | 'feature' | 'mejora';
    descripcion: string;
  }[];
}

export const CHANGELOG: VersionEntry[] = [
  {
    version: '1.0.1',
    fecha: '2026-03-16',
    tipo: 'patch',
    titulo: 'Correcciones de lógica',
    cambios: [
      { tipo: 'fix', descripcion: 'Corrección de año en fechas cuando el mes ya pasó (ej: escribir "15/03" en diciembre ahora apunta al año siguiente)' },
      { tipo: 'fix', descripcion: 'Intervalo entre slots ahora respeta el buffer configurado en Ajustes en lugar de usar 30 min fijos' },
      { tipo: 'fix', descripcion: 'Zona horaria Guatemala aplicada consistentemente en todo el cálculo de disponibilidad' },
      { tipo: 'fix', descripcion: 'Modal de nueva cita en el panel ahora advierte si ya existe una cita en el mismo horario' },
    ],
  },
  {
    version: '1.0.0',
    fecha: '2026-03-10',
    tipo: 'minor',
    titulo: 'Lanzamiento Fase 1',
    cambios: [
      { tipo: 'feature', descripcion: 'Bot de WhatsApp con agendamiento automático guiado por botones' },
      { tipo: 'feature', descripcion: 'Disponibilidad dinámica con validación en tiempo real' },
      { tipo: 'feature', descripcion: 'Reprogramar y cancelar citas desde WhatsApp' },
      { tipo: 'feature', descripcion: 'Confirmación automática y recordatorios 24h/2h antes' },
      { tipo: 'feature', descripcion: 'Panel admin con vista diaria, semanal y mensual de citas' },
      { tipo: 'feature', descripcion: 'Bloqueo de días y horarios no laborables' },
      { tipo: 'feature', descripcion: 'CRM básico con historial, etiquetas y notas internas de clientes' },
      { tipo: 'feature', descripcion: 'Dashboard de rendimiento con ingresos proyectados y tasa de asistencia' },
      { tipo: 'feature', descripcion: 'Capacidad de empleados y buffers entre citas' },
      { tipo: 'feature', descripcion: 'Mensajes fuera de horario configurables desde el panel' },
      { tipo: 'feature', descripcion: 'Aviso de cancelación en tiempo real (campana + dashboard)' },
      { tipo: 'feature', descripcion: 'Login seguro con roles (superadmin, admin, asistente)' },
    ],
  },
];

export const VERSION_ACTUAL = CHANGELOG[0].version;