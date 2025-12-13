import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { SessionService } from '../../../../features/auth/services/session.service';

/**
 * POST /api/lia/complete-activity
 * 
 * Marca una actividad como completada y guarda el output generado
 * Puede recibir completionId (para actualizar) o crear una nueva actividad completada directamente
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ Usar SessionService para autenticación
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos del body
    const { 
      completionId, 
      conversationId,
      activityType,
      generatedOutput,
      timeSpentSeconds 
    } = await request.json();

    const supabase = await createClient();

    // Si hay completionId, actualizar el registro existente
    if (completionId) {
      // Obtener la actividad para calcular tiempo
      const { data: activity } = await supabase
        .from('lia_activity_completions')
        .select('started_at, total_steps')
        .eq('completion_id', completionId)
        .single();

      let timeToComplete = timeSpentSeconds;
      if (!timeToComplete && activity?.started_at) {
        timeToComplete = Math.floor(
          (new Date().getTime() - new Date(activity.started_at).getTime()) / 1000
        );
      }

      const { error } = await supabase
        .from('lia_activity_completions')
        .update({
          status: 'completed',
          completed_steps: activity?.total_steps || 1,
          completed_at: new Date().toISOString(),
          time_to_complete_seconds: timeToComplete || 0,
          generated_output: generatedOutput || null,
          updated_at: new Date().toISOString()
        } as any)
        .eq('completion_id', completionId);

      if (error) {
        console.error('Error completing activity:', error);
        return NextResponse.json(
          { error: 'Error al completar actividad' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        completionId,
        completed: true,
      });
    }

    // Si no hay completionId, crear una nueva actividad completada directamente
    if (!activityType) {
      return NextResponse.json(
        { error: 'activityType o completionId es requerido' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('lia_activity_completions')
      .insert({
        conversation_id: conversationId || null,
        user_id: user.id,
        activity_id: activityType,
        status: 'completed',
        total_steps: 1,
        completed_steps: 1,
        current_step: 1,
        time_to_complete_seconds: timeSpentSeconds || 0,
        lia_had_to_redirect: 0,
        generated_output: generatedOutput || null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .select('completion_id')
      .single();

    if (error) {
      console.error('Error creating completed activity:', error);
      return NextResponse.json(
        { error: 'Error al registrar actividad completada' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      completionId: (data as any)?.completion_id,
      completed: true,
    });
  } catch (error) {
    console.error('Error completing activity:', error);
    return NextResponse.json(
      { error: 'Error al completar actividad' },
      { status: 500 }
    );
  }
}
