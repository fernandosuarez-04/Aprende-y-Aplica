import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { LiaLogger } from '../../../../lib/analytics/lia-logger';

/**
 * POST /api/lia/start-activity
 * 
 * Inicia el tracking de una actividad interactiva con LIA
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos del body
    const { conversationId, activityId, totalSteps } = await request.json();

    if (!conversationId || !activityId || !totalSteps) {
      return NextResponse.json(
        { error: 'conversationId, activityId y totalSteps son requeridos' },
        { status: 400 }
      );
    }

    // Crear logger y registrar inicio de actividad
    const logger = new LiaLogger(user.id);
    logger.setConversationId(conversationId);
    
    const completionId = await logger.startActivity(activityId, totalSteps);

    return NextResponse.json({
      success: true,
      completionId,
      activityId,
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
