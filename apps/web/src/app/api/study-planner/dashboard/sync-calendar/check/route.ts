/**
 * API Endpoint: Check Calendar Changes
 * 
 * POST /api/study-planner/dashboard/sync-calendar/check
 * 
 * Verifica cambios en el calendario del usuario desde la última sincronización
 * para detectar conflictos con las sesiones de estudio programadas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../../features/auth/services/session.service';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../../lib/supabase/types';
import { CalendarIntegrationService } from '../../../../../../features/study-planner/services/calendar-integration.service';
import { logger } from '../../../../../../lib/utils/logger';

/**
 * Crea un cliente de Supabase con Service Role Key para bypass de RLS
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada.');
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

interface CalendarChange {
  type: 'new_event' | 'modified_event' | 'deleted_event' | 'conflict';
  eventId?: string;
  eventTitle: string;
  eventTime: string;
  eventEndTime?: string;
  affectedSessions?: Array<{
    sessionId: string;
    sessionTitle: string;
    sessionTime: string;
  }>;
  suggestedAction?: string;
}

interface CheckCalendarResponse {
  success: boolean;
  data?: {
    changes: CalendarChange[];
    lastCheck: string;
    calendarProvider?: string;
    hasConflicts: boolean;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CheckCalendarResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Obtener integración de calendario del usuario
    const { data: calendarIntegration, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (integrationError || !calendarIntegration) {
      // No hay calendario conectado
      return NextResponse.json({
        success: true,
        data: {
          changes: [],
          lastCheck: new Date().toISOString(),
          hasConflicts: false,
        },
      });
    }

    // Obtener el plan activo del usuario
    const { data: activePlan } = await supabase
      .from('study_plans')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!activePlan) {
      return NextResponse.json({
        success: true,
        data: {
          changes: [],
          lastCheck: new Date().toISOString(),
          calendarProvider: calendarIntegration.provider,
          hasConflicts: false,
        },
      });
    }

    // Obtener sesiones de estudio próximas (próximos 14 días)
    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Tipo para las sesiones de estudio
    interface StudySessionRow {
      id: string;
      title: string;
      start_time: string;
      end_time: string;
      status: string;
    }

    const { data: studySessionsData } = await supabase
      .from('study_sessions')
      .select('id, title, start_time, end_time, status')
      .eq('plan_id', activePlan.id)
      .eq('status', 'planned')
      .gte('start_time', now.toISOString())
      .lte('start_time', twoWeeksLater.toISOString())
      .order('start_time', { ascending: true });

    const studySessions: StudySessionRow[] = (studySessionsData || []) as StudySessionRow[];

    if (studySessions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          changes: [],
          lastCheck: new Date().toISOString(),
          calendarProvider: calendarIntegration.provider,
          hasConflicts: false,
        },
      });
    }

    // Obtener eventos del calendario
    let calendarEvents: Array<{
      id: string;
      title: string;
      start: Date;
      end: Date;
      status: string;
    }> = [];

    try {
      // Usar el servicio de integración de calendario
      // getCalendarEvents retorna CalendarEvent[] directamente
      const events = await CalendarIntegrationService.getCalendarEvents(
        user.id,
        now,
        twoWeeksLater
      );

      if (events && events.length > 0) {
        calendarEvents = events.map((event: { id: string; title: string; startTime: string; endTime: string; status?: string }) => ({
          id: event.id,
          title: event.title || 'Sin título',
          start: new Date(event.startTime),
          end: new Date(event.endTime),
          status: event.status || 'confirmed',
        }));
      }
    } catch (error) {
      logger.warn('Error obteniendo eventos del calendario:', error);
      // Continuar sin eventos del calendario
    }

    // Detectar conflictos y cambios
    const changes: CalendarChange[] = [];
    const lastSyncTime = calendarIntegration.updated_at 
      ? new Date(calendarIntegration.updated_at) 
      : new Date(0);

    for (const calendarEvent of calendarEvents) {
      // Verificar si el evento es nuevo (después de la última sincronización)
      // Nota: Esto es una aproximación, idealmente compararíamos con un snapshot previo
      const isNewEvent = !calendarIntegration.updated_at;

      // Detectar conflictos con sesiones de estudio
      const conflictingSessions = studySessions.filter((session: StudySessionRow) => {
        const sessionStart = new Date(session.start_time);
        const sessionEnd = new Date(session.end_time);
        
        // Verificar solapamiento
        return (
          (calendarEvent.start < sessionEnd && calendarEvent.end > sessionStart) ||
          (sessionStart < calendarEvent.end && sessionEnd > calendarEvent.start)
        );
      });

      if (conflictingSessions.length > 0) {
        changes.push({
          type: 'conflict',
          eventId: calendarEvent.id,
          eventTitle: calendarEvent.title,
          eventTime: formatDateTime(calendarEvent.start),
          eventEndTime: formatDateTime(calendarEvent.end),
          affectedSessions: conflictingSessions.map((s: StudySessionRow) => ({
            sessionId: s.id,
            sessionTitle: s.title,
            sessionTime: formatDateTime(new Date(s.start_time)),
          })),
          suggestedAction: `Mover la sesión "${conflictingSessions[0].title}" a otro horario`,
        });
      } else if (isNewEvent) {
        // Evento nuevo que no genera conflicto (informativo)
        changes.push({
          type: 'new_event',
          eventId: calendarEvent.id,
          eventTitle: calendarEvent.title,
          eventTime: formatDateTime(calendarEvent.start),
          eventEndTime: formatDateTime(calendarEvent.end),
        });
      }
    }

    // Actualizar última fecha de sincronización
    await supabase
      .from('calendar_integrations')
      .update({ 
        last_sync_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('user_id', user.id);

    // Solo devolver conflictos (no eventos informativos nuevos para no saturar)
    const conflicts = changes.filter(c => c.type === 'conflict');

    return NextResponse.json({
      success: true,
      data: {
        changes: conflicts,
        lastCheck: now.toISOString(),
        calendarProvider: calendarIntegration.provider,
        hasConflicts: conflicts.length > 0,
      },
    });

  } catch (error) {
    logger.error('Error verificando cambios de calendario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

// Helper para formatear fecha y hora
function formatDateTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString('es-ES', options);
}
