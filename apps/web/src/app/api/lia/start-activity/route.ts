import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { SessionService } from '../../../../features/auth/services/session.service';

/**
 * POST /api/lia/start-activity
 * 
 * Inicia el tracking de una actividad interactiva con LIA
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
    const { conversationId, activityId, activityType, totalSteps = 1 } = await request.json();

    if (!activityType) {
      return NextResponse.json(
        { error: 'activityType es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Crear registro de actividad directamente
    const { data, error } = await supabase
      .from('lia_activity_completions')
      .insert({
        conversation_id: conversationId || null,
        user_id: user.id,
        activity_id: activityId || activityType, // Usar activityType como ID si no hay activityId
        status: 'started',
        total_steps: totalSteps,
        current_step: 1,
        completed_steps: 0,
        lia_had_to_redirect: 0,
        started_at: new Date().toISOString()
      } as any)
      .select('completion_id')
      .single();

    if (error) {
      console.error('Error starting activity:', error);
      return NextResponse.json(
        { error: 'Error al iniciar actividad' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      completionId: (data as any)?.completion_id,
      activityId: activityId || activityType,
      totalSteps,
    });
  } catch (error) {
    console.error('Error starting activity:', error);
    return NextResponse.json(
      { error: 'Error al iniciar actividad' },
      { status: 500 }
    );
  }
}
