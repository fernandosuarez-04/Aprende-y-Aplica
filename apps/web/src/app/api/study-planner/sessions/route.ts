import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { StudyPlannerService } from '../../../../features/study-planner/services/studyPlannerService';
import { CalendarSyncService } from '../../../../features/study-planner/services/calendarSyncService';
import type { StudySessionInsert } from '@repo/shared/types';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const sessions = await StudyPlannerService.getStudySessions(user.id, {
      planId,
      status,
      startDate,
      endDate,
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    logger.error('Error getting study sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'GET_SESSIONS_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body: StudySessionInsert = await request.json();
    let session = await StudyPlannerService.createStudySession({
      ...body,
      user_id: user.id,
    });

    // Sincronizar con todos los calendarios externos activos
    try {
      const integrations = await StudyPlannerService.getCalendarIntegrations(user.id);
      const activeIntegrations = integrations.filter(integration => integration.access_token);
      
      if (activeIntegrations.length > 0) {
        // Usar la primera integración para guardar el external_event_id principal
        const primaryIntegration = activeIntegrations[0];
        let primaryEventId: string | null = null;
        
        // Sincronizar con todas las integraciones
        for (const integration of activeIntegrations) {
          try {
            const eventId = await CalendarSyncService.createEvent(session, integration);
            if (eventId) {
              // Guardar el ID de la primera integración como principal
              if (integration.provider === primaryIntegration.provider) {
                primaryEventId = eventId;
              }
              console.log(`[SESSIONS POST] Synced session ${session.id} to ${integration.provider} calendar`);
            }
          } catch (syncError) {
            console.error(`[SESSIONS POST] Error syncing session to ${integration.provider}:`, syncError);
            // Continuar con las demás integraciones aunque falle una
          }
        }
        
        // Guardar el external_event_id de la primera integración
        if (primaryEventId) {
          session = await StudyPlannerService.updateStudySession(session.id, user.id, {
            external_event_id: primaryEventId,
            calendar_provider: primaryIntegration.provider,
          });
        }
      }
    } catch (syncError) {
      // Log el error pero no fallar la creación de la sesión
      logger.error('Error syncing session to calendar:', syncError);
    }

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error) {
    logger.error('Error creating study session:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'CREATE_SESSION_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

