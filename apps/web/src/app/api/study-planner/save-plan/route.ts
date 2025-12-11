/**
 * API Endpoint: Save Study Plan
 * 
 * POST /api/study-planner/save-plan
 * 
 * Guarda un plan de estudio generado en la base de datos
 * junto con todas sus sesiones.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SessionService } from '../../../../features/auth/services/session.service';
import type { 
  StudyPlanConfig,
  StudySession,
} from '../../../../features/study-planner/types/user-context.types';

// Función helper para crear cliente con service role key (bypass RLS)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada');
  }

  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

interface SavePlanRequest {
  config: StudyPlanConfig;
  sessions: StudySession[];
}

interface SavePlanResponse {
  success: boolean;
  data?: {
    planId: string;
    sessionsCreated: number;
    sessionIds?: string[]; // IDs de las sesiones creadas para sincronización con calendario
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SavePlanResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const body: SavePlanRequest = await request.json();
    
    // Validar datos requeridos
    if (!body.config || !body.sessions) {
      return NextResponse.json(
        { success: false, error: 'Configuración y sesiones son requeridas' },
        { status: 400 }
      );
    }
    
    // Validar campos requeridos del config
    if (!body.config.name || !body.config.timezone || !body.config.preferredDays || body.config.preferredDays.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Faltan campos requeridos: name, timezone o preferredDays' 
        },
        { status: 400 }
      );
    }
    
    // Validar que haya al menos una sesión
    if (!body.sessions || body.sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe haber al menos una sesión' },
        { status: 400 }
      );
    }
    
    // Usar cliente admin para bypass de RLS
    const supabase = createAdminClient();
    
    // Convertir fechas ISO a formato date (YYYY-MM-DD)
    const formatDateOnly = (isoDate: string | undefined): string | null => {
      if (!isoDate) return null;
      const date = new Date(isoDate);
      return date.toISOString().split('T')[0];
    };
    
    // Iniciar transacción creando el plan
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .insert({
        user_id: user.id,
        name: body.config.name,
        description: body.config.description,
        goal_hours_per_week: body.config.goalHoursPerWeek,
        start_date: formatDateOnly(body.config.startDate),
        end_date: formatDateOnly(body.config.endDate),
        timezone: body.config.timezone,
        preferred_days: body.config.preferredDays,
        preferred_time_blocks: body.config.preferredTimeBlocks,
        generation_mode: body.config.generationMode,
        preferred_session_type: body.config.preferredSessionType,
        learning_route_id: body.config.learningRouteId,
        ai_generation_metadata: {
          userType: body.config.userType,
          courseIds: body.config.courseIds,
          minSessionMinutes: body.config.minSessionMinutes,
          maxSessionMinutes: body.config.maxSessionMinutes,
          breakDurationMinutes: body.config.breakDurationMinutes,
          calendarAnalyzed: body.config.calendarAnalyzed,
          calendarProvider: body.config.calendarProvider,
          liaAvailabilityAnalysis: body.config.liaAvailabilityAnalysis,
          liaTimeAnalysis: body.config.liaTimeAnalysis,
          generatedAt: new Date().toISOString(),
        },
      })
      .select('id')
      .single();
    
    if (planError) {
      console.error('Error creando plan:', planError);
      console.error('Datos del plan:', {
        user_id: user.id,
        name: body.config.name,
        goal_hours_per_week: body.config.goalHoursPerWeek,
        preferred_days: body.config.preferredDays,
        preferred_time_blocks: body.config.preferredTimeBlocks,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al crear el plan de estudio: ${planError.message || JSON.stringify(planError)}` 
        },
        { status: 500 }
      );
    }
    
    // Crear sesiones (validar y limpiar datos)
    const sessionsToInsert = body.sessions.map((session, index) => {
      // Validar campos requeridos
      if (!session.title || !session.startTime || !session.endTime) {
        throw new Error(`Sesión ${index + 1} tiene campos requeridos faltantes: title, startTime o endTime`);
      }
      
      // NOTA: duration_minutes tiene un DEFAULT calculado en la BD que usa end_time - start_time
      // No debemos incluir duration_minutes en el INSERT para que PostgreSQL lo calcule automáticamente
      return {
        plan_id: plan.id,
        user_id: user.id,
        title: session.title.substring(0, 500), // Limitar longitud
        description: session.description ? session.description.substring(0, 2000) : null,
        course_id: session.courseId || null,
        lesson_id: session.lessonId || null,
        start_time: session.startTime,
        end_time: session.endTime,
        // duration_minutes se calcula automáticamente por el DEFAULT de la tabla
        status: 'planned',
        is_ai_generated: session.isAiGenerated !== undefined ? session.isAiGenerated : true,
        session_type: session.sessionType || 'medium',
      };
    });
    
    const { data: createdSessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .insert(sessionsToInsert)
      .select('id');
    
    if (sessionsError) {
      console.error('Error creando sesiones:', sessionsError);
      console.error('Primeras 3 sesiones:', sessionsToInsert.slice(0, 3));
      // Intentar eliminar el plan si falla la creación de sesiones
      await supabase.from('study_plans').delete().eq('id', plan.id);
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al crear las sesiones del plan: ${sessionsError.message || JSON.stringify(sessionsError)}` 
        },
        { status: 500 }
      );
    }
    
    // Actualizar preferencias del usuario (solo campos que existen en la tabla)
    await supabase
      .from('study_preferences')
      .upsert({
        user_id: user.id,
        timezone: body.config.timezone,
        preferred_time_of_day: getTimeOfDay(body.config.preferredTimeBlocks),
        preferred_days: body.config.preferredDays,
        daily_target_minutes: Math.round((body.config.goalHoursPerWeek * 60) / (body.config.preferredDays.length || 5)),
        weekly_target_minutes: body.config.goalHoursPerWeek * 60,
        preferred_session_type: body.config.preferredSessionType,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });
    
    return NextResponse.json({
      success: true,
      data: {
        planId: plan.id,
        sessionsCreated: createdSessions?.length || 0,
        sessionIds: createdSessions?.map(s => s.id) || [],
      },
    });
    
  } catch (error) {
    console.error('Error guardando plan de estudio:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

/**
 * Determina el momento del día preferido basándose en los bloques de tiempo
 */
function getTimeOfDay(timeBlocks: Array<{ startHour: number; startMinute?: number; endHour: number; endMinute?: number }>): string {
  if (!timeBlocks || timeBlocks.length === 0) return 'morning';
  
  let morningCount = 0;
  let afternoonCount = 0;
  let eveningCount = 0;
  let nightCount = 0;
  
  for (const block of timeBlocks) {
    // Calcular hora promedio considerando minutos si están disponibles
    const startTotalMinutes = block.startHour * 60 + (block.startMinute || 0);
    const endTotalMinutes = block.endHour * 60 + (block.endMinute || 0);
    const avgHour = (startTotalMinutes + endTotalMinutes) / 2 / 60;
    
    if (avgHour >= 5 && avgHour < 12) {
      morningCount++;
    } else if (avgHour >= 12 && avgHour < 17) {
      afternoonCount++;
    } else if (avgHour >= 17 && avgHour < 21) {
      eveningCount++;
    } else {
      nightCount++;
    }
  }
  
  const max = Math.max(morningCount, afternoonCount, eveningCount, nightCount);
  
  if (max === morningCount) return 'morning';
  if (max === afternoonCount) return 'afternoon';
  if (max === eveningCount) return 'evening';
  return 'night';
}
