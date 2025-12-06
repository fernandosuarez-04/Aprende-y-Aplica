/**
 * API Endpoint: Save Study Plan
 * 
 * POST /api/study-planner/save-plan
 * 
 * Guarda un plan de estudio generado en la base de datos
 * junto con todas sus sesiones.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import type { 
  StudyPlanConfig,
  StudySession,
} from '../../../../features/study-planner/types/user-context.types';

interface SavePlanRequest {
  config: StudyPlanConfig;
  sessions: StudySession[];
}

interface SavePlanResponse {
  success: boolean;
  data?: {
    planId: string;
    sessionsCreated: number;
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
    
    const supabase = await createClient();
    
    // Iniciar transacción creando el plan
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .insert({
        user_id: user.id,
        name: body.config.name,
        description: body.config.description,
        goal_hours_per_week: body.config.goalHoursPerWeek,
        start_date: body.config.startDate,
        end_date: body.config.endDate,
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
      return NextResponse.json(
        { success: false, error: 'Error al crear el plan de estudio' },
        { status: 500 }
      );
    }
    
    // Crear sesiones
    const sessionsToInsert = body.sessions.map(session => ({
      plan_id: plan.id,
      user_id: user.id,
      title: session.title,
      description: session.description,
      course_id: session.courseId,
      lesson_id: session.lessonId,
      start_time: session.startTime,
      end_time: session.endTime,
      duration_minutes: session.durationMinutes,
      status: 'planned',
      is_ai_generated: session.isAiGenerated,
      session_type: session.sessionType,
    }));
    
    const { data: createdSessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .insert(sessionsToInsert)
      .select('id');
    
    if (sessionsError) {
      console.error('Error creando sesiones:', sessionsError);
      // Intentar eliminar el plan si falla la creación de sesiones
      await supabase.from('study_plans').delete().eq('id', plan.id);
      return NextResponse.json(
        { success: false, error: 'Error al crear las sesiones del plan' },
        { status: 500 }
      );
    }
    
    // Actualizar preferencias del usuario
    await supabase
      .from('study_preferences')
      .upsert({
        user_id: user.id,
        timezone: body.config.timezone,
        preferred_time_of_day: getTimeOfDay(body.config.preferredTimeBlocks),
        preferred_days: body.config.preferredDays,
        daily_target_minutes: Math.round((body.config.goalHoursPerWeek * 60) / body.config.preferredDays.length),
        weekly_target_minutes: body.config.goalHoursPerWeek * 60,
        preferred_session_type: body.config.preferredSessionType,
        min_session_minutes: body.config.minSessionMinutes,
        max_session_minutes: body.config.maxSessionMinutes,
        break_duration_minutes: body.config.breakDurationMinutes,
        calendar_connected: body.config.calendarAnalyzed,
        calendar_provider: body.config.calendarProvider,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });
    
    return NextResponse.json({
      success: true,
      data: {
        planId: plan.id,
        sessionsCreated: createdSessions?.length || 0,
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
function getTimeOfDay(timeBlocks: Array<{ startHour: number; endHour: number }>): string {
  if (!timeBlocks || timeBlocks.length === 0) return 'morning';
  
  let morningCount = 0;
  let afternoonCount = 0;
  let eveningCount = 0;
  let nightCount = 0;
  
  for (const block of timeBlocks) {
    const avgHour = (block.startHour + block.endHour) / 2;
    
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
