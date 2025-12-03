import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/study-planner/calendar-integrations
 * Obtiene todas las integraciones de calendario del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const { data: integrations, error: integrationsError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (integrationsError) {
      console.error('Error fetching integrations:', integrationsError);
      return NextResponse.json(
        { error: 'Error al obtener integraciones' },
        { status: 500 }
      );
    }

    return NextResponse.json({ integrations: integrations || [] });
  } catch (error) {
    console.error('Error in calendar integrations API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


