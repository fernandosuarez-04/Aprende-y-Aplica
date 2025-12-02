import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * POST /api/study-planner/calendar-integrations/disconnect
 * Desconecta una integración de calendario
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { integration_id } = body;

    if (!integration_id) {
      return NextResponse.json(
        { error: 'integration_id es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar que la integración pertenece al usuario
    const { data: integration, error: checkError } = await supabase
      .from('calendar_integrations')
      .select('id, user_id')
      .eq('id', integration_id)
      .eq('user_id', currentUser.id)
      .single();

    if (checkError || !integration) {
      return NextResponse.json(
        { error: 'Integración no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar la integración
    const { error: deleteError } = await supabase
      .from('calendar_integrations')
      .delete()
      .eq('id', integration_id)
      .eq('user_id', currentUser.id);

    if (deleteError) {
      console.error('Error deleting integration:', deleteError);
      return NextResponse.json(
        { error: 'Error al desconectar el calendario' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in disconnect API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

