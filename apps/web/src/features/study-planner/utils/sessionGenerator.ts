/**
 * Utilidad para generar sesiones de estudio recurrentes basadas en preferencias
 */

import type {
  StudyPreferences,
  StudyPlan,
  StudySessionInsert,
  DayOfWeek,
  TimeBlock,
  RecurrenceRule,
} from '@repo/shared/types';

/**
 * Genera sesiones de estudio basadas en preferencias del usuario
 */
export function generateSessionsFromPreferences(
  preferences: StudyPreferences,
  startDate: Date = new Date(),
  weeks: number = 4
): StudySessionInsert[] {
  console.log('[SESSION GENERATOR] Starting generation with preferences:', {
    preferred_days: preferences.preferred_days,
    preferred_time_of_day: preferences.preferred_time_of_day,
    daily_target_minutes: preferences.daily_target_minutes,
    startDate: startDate.toISOString(),
    weeks,
  });

  const sessions: StudySessionInsert[] = [];
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + weeks * 7);

  // Convertir preferred_time_of_day a bloques de tiempo
  const timeBlocks = convertTimeOfDayToBlocks(preferences.preferred_time_of_day);
  console.log('[SESSION GENERATOR] Time blocks:', timeBlocks);
  
  // Usar daily_target_minutes de las preferencias o calcular desde los bloques
  const targetMinutes = preferences.daily_target_minutes || 
    (timeBlocks.length > 0 ? calculateDuration(timeBlocks[0].start, timeBlocks[0].end) : 60);
  console.log('[SESSION GENERATOR] Target minutes:', targetMinutes);

  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    const dayOfWeek = getDayOfWeek(currentDate); // 1-7 (Lunes-Domingo)

    // Verificar si este día está en los días preferidos
    if (preferences.preferred_days.includes(dayOfWeek)) {
      // Crear una sesión para cada bloque de tiempo
      for (const block of timeBlocks) {
        const sessionStart = new Date(currentDate);
        const [hours, minutes] = block.start.split(':').map(Number);
        sessionStart.setHours(hours, minutes, 0, 0);

        const sessionEnd = new Date(sessionStart);
        // Usar la duración del bloque o el target diario
        const duration = calculateDuration(block.start, block.end) || targetMinutes;
        sessionEnd.setMinutes(sessionEnd.getMinutes() + duration);

        // No incluir duration_minutes porque es una columna generada en Supabase
        // Se calcula automáticamente desde start_time y end_time
        const session: StudySessionInsert = {
          user_id: preferences.user_id,
          title: 'Sesión de Estudio',
          description: `Sesión programada automáticamente`,
          start_time: sessionStart.toISOString(),
          end_time: sessionEnd.toISOString(),
          // duration_minutes se calcula automáticamente por la BD
          status: 'planned',
          recurrence: {
            frequency: 'weekly',
            interval: 1,
            daysOfWeek: preferences.preferred_days,
          },
        };
        
        sessions.push(session);
        console.log('[SESSION GENERATOR] Generated session:', {
          date: currentDate.toISOString().split('T')[0],
          dayOfWeek,
          start: sessionStart.toISOString(),
          end: sessionEnd.toISOString(),
          duration,
        });
      }
    }

    // Avanzar al siguiente día
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`[SESSION GENERATOR] Total sessions generated: ${sessions.length}`);
  return sessions;
}

/**
 * Genera sesiones de estudio basadas en un plan de estudio
 */
export function generateSessionsFromPlan(
  plan: StudyPlan,
  startDate?: Date,
  endDate?: Date
): StudySessionInsert[] {
  const sessions: StudySessionInsert[] = [];
  const planStart = startDate || (plan.start_date ? new Date(plan.start_date) : new Date());
  const planEnd = endDate || (plan.end_date ? new Date(plan.end_date) : new Date());

  // Calcular horas por sesión basado en goal_hours_per_week y días preferidos
  const daysPerWeek = plan.preferred_days.length;
  const hoursPerDay = plan.goal_hours_per_week / daysPerWeek;
  const minutesPerSession = Math.round(hoursPerDay * 60);

  let currentDate = new Date(planStart);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= planEnd) {
    const dayOfWeek = getDayOfWeek(currentDate);

    if (plan.preferred_days.includes(dayOfWeek)) {
      // Usar los bloques de tiempo del plan o generar uno por defecto
      const timeBlocks =
        plan.preferred_time_blocks.length > 0
          ? plan.preferred_time_blocks
          : [{ start: '09:00', end: '11:00' }];

      for (const block of timeBlocks) {
        const sessionStart = new Date(currentDate);
        const [hours, minutes] = block.start.split(':').map(Number);
        sessionStart.setHours(hours, minutes, 0, 0);

        const sessionEnd = new Date(sessionStart);
        const duration = calculateDuration(block.start, block.end) || minutesPerSession;
        sessionEnd.setMinutes(sessionEnd.getMinutes() + duration);

        sessions.push({
          user_id: plan.user_id,
          plan_id: plan.id,
          title: plan.name || 'Sesión de Estudio',
          description: plan.description || undefined,
          start_time: sessionStart.toISOString(),
          end_time: sessionEnd.toISOString(),
          duration_minutes: duration,
          status: 'planned',
          recurrence: {
            frequency: 'weekly',
            interval: 1,
            daysOfWeek: plan.preferred_days,
            endDate: plan.end_date || undefined,
          },
        });
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return sessions;
}

/**
 * Convierte un TimeOfDay a bloques de tiempo específicos
 */
function convertTimeOfDayToBlocks(
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
): TimeBlock[] {
  switch (timeOfDay) {
    case 'morning':
      return [{ start: '08:00', end: '10:00', label: 'Mañana' }];
    case 'afternoon':
      return [{ start: '14:00', end: '16:00', label: 'Tarde' }];
    case 'evening':
      return [{ start: '18:00', end: '20:00', label: 'Noche' }];
    case 'night':
      return [{ start: '20:00', end: '22:00', label: 'Noche' }];
    default:
      return [{ start: '09:00', end: '11:00', label: 'Mañana' }];
  }
}

/**
 * Calcula la duración en minutos entre dos horas
 */
function calculateDuration(start: string, end: string): number {
  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);

  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;

  return endTotal - startTotal;
}

/**
 * Obtiene el día de la semana como número (1 = Lunes, 7 = Domingo)
 */
function getDayOfWeek(date: Date): DayOfWeek {
  const day = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  return (day === 0 ? 7 : day) as DayOfWeek;
}

/**
 * Genera bloques de tiempo personalizados basados en horas específicas
 */
export function generateCustomTimeBlocks(
  startHour: number,
  endHour: number,
  durationMinutes: number = 60
): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  let currentHour = startHour;

  while (currentHour + durationMinutes / 60 <= endHour) {
    const start = `${String(currentHour).padStart(2, '0')}:00`;
    const endHourValue = currentHour + durationMinutes / 60;
    const end = `${String(Math.floor(endHourValue)).padStart(2, '0')}:${String(
      (endHourValue % 1) * 60
    ).padStart(2, '0')}`;

    blocks.push({ start, end });
    currentHour = endHourValue;
  }

  return blocks;
}

