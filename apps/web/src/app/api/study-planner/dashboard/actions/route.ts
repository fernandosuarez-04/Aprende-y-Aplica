/**
 * API Endpoint: Study Plan Actions
 * 
 * POST /api/study-planner/dashboard/actions
 * 
 * Ejecuta acciones directas sobre el plan de estudios.
 * Este endpoint se usa cuando LIA ha confirmado una acción y necesita ejecutarla.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../lib/supabase/types';
import { logger } from '../../../../../lib/utils/logger';

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

type ActionType = 
  | 'move_session'
  | 'delete_session'
  | 'resize_session'
  | 'create_session'
  | 'update_session'
  | 'complete_session'
  | 'reschedule_sessions';

interface ActionRequest {
  action: ActionType;
  planId: string;
  data: any;
}

interface ActionResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// Tipo para las sesiones de estudio
interface SessionRow {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ActionResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body: ActionRequest = await request.json();
    const { action, planId, data } = body;

    if (!action || !planId) {
      return NextResponse.json(
        { success: false, error: 'Acción y planId son requeridos' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verificar que el plan pertenece al usuario
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, error: 'Plan no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // Ejecutar acción según el tipo
    switch (action) {
      case 'move_session': {
        const { sessionId, newStartTime, newEndTime } = data;
        
        if (!sessionId || !newStartTime || !newEndTime) {
          return NextResponse.json(
            { success: false, error: 'sessionId, newStartTime y newEndTime son requeridos' },
            { status: 400 }
          );
        }

        // Validar que el nuevo horario no tenga conflictos
        const { data: existingSessions } = await supabase
          .from('study_sessions')
          .select('id, title, start_time, end_time')
          .eq('plan_id', planId)
          .neq('id', sessionId)
          .eq('status', 'planned');

        const newStart = new Date(newStartTime);
        const newEnd = new Date(newEndTime);

        const conflicts = existingSessions?.filter((s: SessionRow) => {
          const start = new Date(s.start_time);
          const end = new Date(s.end_time);
          return (newStart < end && newEnd > start);
        });

        if (conflicts && conflicts.length > 0) {
          return NextResponse.json({
            success: false,
            error: `Conflicto con sesión existente: "${conflicts[0].title}"`,
          });
        }

        const { error } = await supabase
          .from('study_sessions')
          .update({
            start_time: newStartTime,
            end_time: newEndTime,
            was_rescheduled: true,
            rescheduled_from: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
          .eq('user_id', user.id);

        if (error) {
          logger.error('Error moviendo sesión:', error);
          return NextResponse.json(
            { success: false, error: `Error al mover la sesión: ${error.message}` },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: '✅ Sesión movida correctamente',
        });
      }

      case 'delete_session': {
        const { sessionId } = data;
        
        if (!sessionId) {
          return NextResponse.json(
            { success: false, error: 'sessionId es requerido' },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from('study_sessions')
          .delete()
          .eq('id', sessionId)
          .eq('user_id', user.id);

        if (error) {
          logger.error('Error eliminando sesión:', error);
          return NextResponse.json(
            { success: false, error: `Error al eliminar la sesión: ${error.message}` },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: '✅ Sesión eliminada correctamente',
        });
      }

      case 'resize_session': {
        const { sessionId, newDurationMinutes } = data;
        
        if (!sessionId || !newDurationMinutes) {
          return NextResponse.json(
            { success: false, error: 'sessionId y newDurationMinutes son requeridos' },
            { status: 400 }
          );
        }

        if (newDurationMinutes < 5 || newDurationMinutes > 180) {
          return NextResponse.json(
            { success: false, error: 'La duración debe estar entre 5 y 180 minutos' },
            { status: 400 }
          );
        }

        // Obtener sesión actual
        const { data: session } = await supabase
          .from('study_sessions')
          .select('start_time')
          .eq('id', sessionId)
          .eq('user_id', user.id)
          .single();

        if (!session) {
          return NextResponse.json(
            { success: false, error: 'Sesión no encontrada' },
            { status: 404 }
          );
        }

        // Calcular nuevo end_time
        const startTime = new Date(session.start_time);
        const newEndTime = new Date(startTime.getTime() + newDurationMinutes * 60 * 1000);

        const { error } = await supabase
          .from('study_sessions')
          .update({
            end_time: newEndTime.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
          .eq('user_id', user.id);

        if (error) {
          logger.error('Error ajustando duración:', error);
          return NextResponse.json(
            { success: false, error: `Error al ajustar duración: ${error.message}` },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `✅ Duración ajustada a ${newDurationMinutes} minutos`,
        });
      }

      case 'create_session': {
        const { title, startTime, endTime, courseId, lessonId, description } = data;
        
        if (!title || !startTime || !endTime) {
          return NextResponse.json(
            { success: false, error: 'title, startTime y endTime son requeridos' },
            { status: 400 }
          );
        }

        // Validar que el nuevo horario no tenga conflictos
        const { data: existingSessions } = await supabase
          .from('study_sessions')
          .select('id, title, start_time, end_time')
          .eq('plan_id', planId)
          .eq('status', 'planned');

        const newStart = new Date(startTime);
        const newEnd = new Date(endTime);

        const conflicts = existingSessions?.filter((s: SessionRow) => {
          const start = new Date(s.start_time);
          const end = new Date(s.end_time);
          return (newStart < end && newEnd > start);
        });

        if (conflicts && conflicts.length > 0) {
          return NextResponse.json({
            success: false,
            error: `Conflicto con sesión existente: "${conflicts[0].title}"`,
          });
        }

        const { data: newSession, error } = await supabase
          .from('study_sessions')
          .insert({
            plan_id: planId,
            user_id: user.id,
            title,
            description,
            start_time: startTime,
            end_time: endTime,
            course_id: courseId,
            lesson_id: lessonId,
            status: 'planned',
            is_ai_generated: false,
          })
          .select('id')
          .single();

        if (error) {
          logger.error('Error creando sesión:', error);
          return NextResponse.json(
            { success: false, error: `Error al crear sesión: ${error.message}` },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: '✅ Nueva sesión creada correctamente',
          data: { sessionId: newSession.id },
        });
      }

      case 'update_session': {
        const { sessionId, ...updates } = data;
        
        if (!sessionId) {
          return NextResponse.json(
            { success: false, error: 'sessionId es requerido' },
            { status: 400 }
          );
        }

        // Filtrar solo campos permitidos
        const allowedFields = ['title', 'description', 'notes'];
        const filteredUpdates: Record<string, any> = {};
        
        for (const key of allowedFields) {
          if (updates[key] !== undefined) {
            filteredUpdates[key] = updates[key];
          }
        }

        if (Object.keys(filteredUpdates).length === 0) {
          return NextResponse.json(
            { success: false, error: 'No hay campos válidos para actualizar' },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from('study_sessions')
          .update({
            ...filteredUpdates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
          .eq('user_id', user.id);

        if (error) {
          logger.error('Error actualizando sesión:', error);
          return NextResponse.json(
            { success: false, error: `Error al actualizar sesión: ${error.message}` },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: '✅ Sesión actualizada correctamente',
        });
      }

      case 'complete_session': {
        const { sessionId, selfEvaluation, notes } = data;
        
        if (!sessionId) {
          return NextResponse.json(
            { success: false, error: 'sessionId es requerido' },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from('study_sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            self_evaluation: selfEvaluation,
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
          .eq('user_id', user.id);

        if (error) {
          logger.error('Error completando sesión:', error);
          return NextResponse.json(
            { success: false, error: `Error al completar sesión: ${error.message}` },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: '🎉 ¡Sesión completada! Buen trabajo',
        });
      }

      case 'reschedule_sessions': {
        const { sessionIds, newSchedule } = data;

        if (!sessionIds || !Array.isArray(sessionIds) || !newSchedule) {
          return NextResponse.json(
            { success: false, error: 'sessionIds y newSchedule son requeridos' },
            { status: 400 }
          );
        }

        // OPTIMIZADO: Actualizar múltiples sesiones en PARALELO en lugar de secuencial
        // Antes: N queries secuenciales (lento)
        // Ahora: N queries en paralelo con Promise.allSettled (rápido)
        const now = new Date().toISOString();

        const updatePromises = newSchedule.map((item: { sessionId: string; newStartTime: string; newEndTime: string }) => {
          const { sessionId, newStartTime, newEndTime } = item;
          return supabase
            .from('study_sessions')
            .update({
              start_time: newStartTime,
              end_time: newEndTime,
              was_rescheduled: true,
              rescheduled_from: now,
              updated_at: now,
            })
            .eq('id', sessionId)
            .eq('user_id', user.id);
        });

        const results = await Promise.allSettled(updatePromises);

        let successCount = 0;
        let errorCount = 0;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && !result.value.error) {
            successCount++;
          } else {
            errorCount++;
            if (result.status === 'rejected') {
              logger.error('Error reprogramando sesión:', result.reason);
            } else if (result.value.error) {
              logger.error('Error reprogramando sesión:', result.value.error);
            }
          }
        });

        return NextResponse.json({
          success: errorCount === 0,
          message: `✅ ${successCount} sesiones reprogramadas${errorCount > 0 ? `, ${errorCount} fallaron` : ''}`,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Acción no reconocida: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Error ejecutando acción:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
