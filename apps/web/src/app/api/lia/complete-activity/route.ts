import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { LiaLogger } from '../../../../lib/analytics/lia-logger';

/**
 * POST /api/lia/complete-activity
 * 
 * Marca una actividad como completada y guarda el output generado
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
    const { completionId, generatedOutput } = await request.json();

    if (!completionId) {
      return NextResponse.json(
        { error: 'completionId es requerido' },
        { status: 400 }
      );
    }

    // Crear logger y completar actividad
    const logger = new LiaLogger(user.id);
    await logger.completeActivity(completionId, generatedOutput);

    return NextResponse.json({
      success: true,
      completionId,
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
