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

    // Sincronizar con todos los calendarios externos activos
    try {
      const integrations = await StudyPlannerService.getCalendarIntegrations(user.id);
      const activeIntegrations = integrations.filter(integration => integration.access_token);
      
      if (activeIntegrations.length > 0) {
        // Usar la primera integración para guardar el external_event_id principal si no existe
        const primaryIntegration = activeIntegrations[0];
        let primaryEventId: string | null = session.external_event_id || null;
        let primaryProvider: string | null = session.calendar_provider || null;
        
        // Sincronizar con todas las integraciones activas
        for (const integration of activeIntegrations) {
          try {
            let eventSynced = false;
            
            // Si la sesión tiene un evento guardado de este proveedor, intentar actualizarlo
            if (session.external_event_id && session.calendar_provider === integration.provider) {
              const updated = await CalendarSyncService.updateEvent(session, integration);
              if (updated) {
                eventSynced = true;
                console.log(`[SESSIONS PUT] Updated session ${session.id} in ${integration.provider} calendar`);
              }
            }
            
            // Si no se pudo actualizar (o no tiene evento en este proveedor), crear uno nuevo
            // Esto asegura que todos los calendarios activos tengan el evento
            if (!eventSynced) {
              const eventId = await CalendarSyncService.createEvent(session, integration);
              if (eventId) {
                eventSynced = true;
                // Guardar el ID de la primera integración como principal si no hay uno guardado
                if (!primaryEventId && integration.provider === primaryIntegration.provider) {
                  primaryEventId = eventId;
                  primaryProvider = integration.provider;
                }
                console.log(`[SESSIONS PUT] Created/updated session ${session.id} in ${integration.provider} calendar`);
              }
            }
          } catch (syncError) {
            console.error(`[SESSIONS PUT] Error syncing session to ${integration.provider}:`, syncError);
            // Continuar con las demás integraciones aunque falle una
          }
        }
        
        // Actualizar el external_event_id principal si se creó uno nuevo
        if (primaryEventId && primaryEventId !== session.external_event_id) {
          const updateData: StudySessionUpdate = {
            external_event_id: primaryEventId,
            calendar_provider: primaryProvider as any,
          };
          session = await StudyPlannerService.updateStudySession(session.id, user.id, updateData);
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
    
    // Obtener la sesión antes de eliminarla para poder eliminar de calendarios externos
    const session = await StudyPlannerService.getStudySessionById(id, user.id);
    
    // Eliminar de todos los calendarios externos activos
    if (session) {
      try {
        const integrations = await StudyPlannerService.getCalendarIntegrations(user.id);
        const activeIntegrations = integrations.filter(integration => integration.access_token);
        
        for (const integration of activeIntegrations) {
          try {
            // Intentar eliminar en todas las integraciones (puede que el evento esté en cualquiera)
            await CalendarSyncService.deleteEvent(session, integration);
            console.log(`[SESSIONS DELETE] Deleted session ${id} from ${integration.provider} calendar`);
          } catch (deleteError) {
            // Ignorar errores si el evento no existe en ese calendario
            console.log(`[SESSIONS DELETE] Could not delete session from ${integration.provider} (may not exist there)`);
          }
        }
      } catch (syncError) {
        console.error('[SESSIONS DELETE] Error deleting session from calendars:', syncError);
        // Continuar con la eliminación de la BD aunque falle la sincronización
      }
    }
    
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

