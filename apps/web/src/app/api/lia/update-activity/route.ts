import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { LiaLogger } from '../../../../lib/analytics/lia-logger';

/**
 * POST /api/lia/update-activity
 * 
 * Actualiza el progreso de una actividad interactiva
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
    const { completionId, ...progress } = await request.json();

    if (!completionId) {
      return NextResponse.json(
        { error: 'completionId es requerido' },
        { status: 400 }
      );
    }

    // Crear logger y actualizar progreso
    const logger = new LiaLogger(user.id);
    await logger.updateActivityProgress(completionId, progress);

    return NextResponse.json({
      success: true,
      completionId,
      progress,
    });
  } catch (error) {
    // console.error('Error updating activity progress:', error);
    return NextResponse.json(
      { error: 'Error al actualizar progreso de actividad' },
      { status: 500 }
    );
  }
}
