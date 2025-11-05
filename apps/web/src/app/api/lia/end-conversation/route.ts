import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { LiaLogger } from '../../../../lib/analytics/lia-logger';

/**
 * POST /api/lia/end-conversation
 * 
 * Cierra una conversación con LIA y calcula métricas finales
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
    const { conversationId, completed = true } = await request.json();

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId es requerido' },
        { status: 400 }
      );
    }

    // Crear logger y cerrar conversación
    const logger = new LiaLogger(user.id);
    logger.setConversationId(conversationId);
    await logger.endConversation(completed);

    return NextResponse.json({
      success: true,
      conversationId,
      completed,
    });
  } catch (error) {
    console.error('Error ending conversation:', error);
    return NextResponse.json(
      { error: 'Error al cerrar conversación' },
      { status: 500 }
    );
  }
}
