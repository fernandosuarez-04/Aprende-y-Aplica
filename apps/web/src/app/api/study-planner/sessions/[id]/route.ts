import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { StudyPlannerService } from '../../../../../features/study-planner/services/studyPlannerService';
import { CalendarSyncService } from '../../../../../features/study-planner/services/calendarSyncService';
import type { StudySessionUpdate } from '@repo/shared/types';
import { logger } from '@/lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const session = await StudyPlannerService.getStudySessionById(
      id,
      user.id
    );

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    logger.error('Error getting study session:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'GET_SESSION_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: StudySessionUpdate = await request.json();
    let session = await StudyPlannerService.updateStudySession(
      id,
      user.id,
      body
    );

    // Sincronizar con calendarios externos si hay integraciones
    try {
      const integrations = await StudyPlannerService.getCalendarIntegrations(user.id);
      const activeIntegration = integrations.find(integration => integration.access_token);
      if (activeIntegration) {
        // Si la sesión ya tiene un evento externo de este proveedor, actualizarlo
        if (session.external_event_id && session.calendar_provider === activeIntegration.provider) {
          await CalendarSyncService.updateEvent(session, activeIntegration);
        } 
        // Si no tiene evento externo, crear uno nuevo
        else if (!session.external_event_id) {
          const eventId = await CalendarSyncService.createEvent(session, activeIntegration);
          if (eventId) {
            // Actualizar la sesión con el ID del evento externo (sin duration_minutes)
            const updateData: StudySessionUpdate = {
              external_event_id: eventId,
              calendar_provider: activeIntegration.provider,
            };
            session = await StudyPlannerService.updateStudySession(session.id, user.id, updateData);
          }
        }
      }
    } catch (syncError) {
      // Log el error pero no fallar la actualización de la sesión
      logger.error('Error syncing session to calendar:', syncError);
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    logger.error('Error updating study session:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'UPDATE_SESSION_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await StudyPlannerService.deleteStudySession(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting study session:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'DELETE_SESSION_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

