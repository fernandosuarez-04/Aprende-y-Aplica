import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { CalendarSyncService } from '@/features/study-planner/services/calendarSyncService';

/**
 * POST /api/study-planner/calendar-integrations/sync
 * Sincroniza todas las sesiones con los calendarios conectados
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

    const supabase = await createClient();

    // Obtener integraciones activas
    const { data: integrations, error: integrationsError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', currentUser.id);

    if (integrationsError) {
      console.error('Error fetching integrations:', integrationsError);
      return NextResponse.json(
        { error: 'Error al obtener integraciones' },
        { status: 500 }
      );
    }

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay calendarios conectados',
        synced: 0,
      });
    }

    // Obtener sesiones futuras
    const now = new Date().toISOString();
    const { data: sessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', currentUser.id)
      .gte('start_time', now)
      .in('status', ['planned', 'in_progress']);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Error al obtener sesiones' },
        { status: 500 }
      );
    }

    // Sincronizar con cada integración
    const syncService = new CalendarSyncService();
    let syncedCount = 0;

    for (const integration of integrations) {
      try {
        await syncService.syncAllSessions(
          currentUser.id,
          integration.provider as 'google' | 'microsoft',
          sessions || []
        );
        syncedCount += sessions?.length || 0;
      } catch (syncError) {
        console.error(`Error syncing with ${integration.provider}:`, syncError);
        // Continuar con otras integraciones
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      integrations: integrations.length,
    });
  } catch (error) {
    console.error('Error in sync API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}




