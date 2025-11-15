import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { StudyPlannerService } from '../../../../features/study-planner/services/studyPlannerService';
import { CalendarSyncService } from '../../../../features/study-planner/services/calendarSyncService';
import { generateSessionsFromPreferences } from '../../../../features/study-planner/utils/sessionGenerator';
import type {
  StudyPreferencesInsert,
  StudyPreferencesUpdate,
} from '@repo/shared/types';
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

    const preferences = await StudyPlannerService.getStudyPreferences(user.id);

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    logger.error('Error getting study preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'GET_PREFERENCES_ERROR',
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

    const body: StudyPreferencesInsert | StudyPreferencesUpdate =
      await request.json();
    const preferences = await StudyPlannerService.createOrUpdateStudyPreferences(
      {
        ...body,
        user_id: user.id,
      } as StudyPreferencesInsert
    );

    // Generar sesiones automáticamente basadas en las preferencias
    if (preferences) {
      console.log(`[PREFERENCES POST] Preferences saved successfully, starting session generation...`);
      try {
        console.log(`[PREFERENCES POST] Starting session generation for new preferences for user ${user.id}:`, {
          preferred_days: preferences.preferred_days,
          preferred_time_of_day: preferences.preferred_time_of_day,
          daily_target_minutes: preferences.daily_target_minutes,
          weekly_target_minutes: preferences.weekly_target_minutes,
          timezone: preferences.timezone,
        });
        
        // Generar sesiones para las próximas 4 semanas
        const sessions = generateSessionsFromPreferences(preferences, new Date(), 4);
        console.log(`[PREFERENCES POST] Generated ${sessions.length} new sessions from preferences`);
        
        // Crear las sesiones en la base de datos
        const integrations = await StudyPlannerService.getCalendarIntegrations(user.id);
        const activeIntegration = integrations.find(integration => integration.access_token);
        
        let createdCount = 0;
        let syncedCount = 0;
        for (const session of sessions) {
          try {
            const createdSession = await StudyPlannerService.createStudySession(session);
            createdCount++;
            
            // Sincronizar con calendario externo si hay integración activa
            if (activeIntegration) {
              try {
                const eventId = await CalendarSyncService.createEvent(createdSession, activeIntegration);
                if (eventId) {
                  await StudyPlannerService.updateStudySession(createdSession.id, user.id, {
                    external_event_id: eventId,
                    calendar_provider: activeIntegration.provider,
                  });
                  syncedCount++;
                }
              } catch (syncError) {
                console.error('[PREFERENCES POST] Error syncing generated session to calendar:', syncError);
                // Continuar con las demás sesiones aunque falle una sincronización
              }
            }
          } catch (createError) {
            console.error('[PREFERENCES POST] Error creating session:', createError);
          }
        }
        
        console.log(`[PREFERENCES POST] Successfully created ${createdCount} sessions and synced ${syncedCount} to calendar for user ${user.id}`);
      } catch (genError) {
        console.error('[PREFERENCES POST] Error generating sessions from preferences:', genError);
        console.error('[PREFERENCES POST] Error details:', genError instanceof Error ? genError.stack : genError);
        // No fallar la guardada de preferencias si falla la generación de sesiones
      }
    }

    return NextResponse.json({ success: true, data: preferences }, { status: 201 });
  } catch (error) {
    logger.error('Error creating/updating study preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'UPDATE_PREFERENCES_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body: StudyPreferencesUpdate = await request.json();
    const preferences = await StudyPlannerService.createOrUpdateStudyPreferences(
      {
        ...body,
        user_id: user.id,
      } as StudyPreferencesInsert
    );

    // Si se actualizaron las preferencias, regenerar sesiones futuras
    if (preferences) {
      console.log(`[PREFERENCES PUT] Preferences saved successfully, starting session generation...`);
      try {
        console.log(`[PREFERENCES PUT] Starting session generation for user ${user.id} with preferences:`, {
          preferred_days: preferences.preferred_days,
          preferred_time_of_day: preferences.preferred_time_of_day,
          daily_target_minutes: preferences.daily_target_minutes,
        });
        
        // Obtener sesiones futuras existentes para eliminarlas
        const existingSessions = await StudyPlannerService.getStudySessions(user.id, {
          startDate: new Date().toISOString(),
        });
        
        console.log(`[PREFERENCES PUT] Found ${existingSessions.length} existing future sessions`);
        
        // Eliminar sesiones futuras planificadas que fueron generadas automáticamente
        const integrations = await StudyPlannerService.getCalendarIntegrations(user.id);
        const activeIntegration = integrations.find(integration => integration.access_token);
        
        let deletedCount = 0;
        for (const session of existingSessions) {
          if (session.status === 'planned' && session.description?.includes('programada automáticamente')) {
            // Eliminar del calendario externo si existe
            if (session.external_event_id && activeIntegration) {
              try {
                await CalendarSyncService.deleteEvent(session, activeIntegration);
              } catch (deleteError) {
                logger.error('Error deleting session from calendar:', deleteError);
              }
            }
            // Eliminar de la base de datos
            await StudyPlannerService.deleteStudySession(session.id, user.id);
            deletedCount++;
          }
        }
        
        console.log(`[PREFERENCES PUT] Deleted ${deletedCount} automatically generated sessions`);
        
        // Generar nuevas sesiones basadas en las preferencias actualizadas
        const sessions = generateSessionsFromPreferences(preferences, new Date(), 4);
        console.log(`[PREFERENCES PUT] Generated ${sessions.length} new sessions from preferences`);
        
        let createdCount = 0;
        let syncedCount = 0;
        for (const session of sessions) {
          try {
            const createdSession = await StudyPlannerService.createStudySession(session);
            createdCount++;
            
            // Sincronizar con calendario externo si hay integración activa
            if (activeIntegration) {
              try {
                const eventId = await CalendarSyncService.createEvent(createdSession, activeIntegration);
                if (eventId) {
                  await StudyPlannerService.updateStudySession(createdSession.id, user.id, {
                    external_event_id: eventId,
                    calendar_provider: activeIntegration.provider,
                  });
                  syncedCount++;
                }
              } catch (syncError) {
                console.error('[PREFERENCES PUT] Error syncing generated session to calendar:', syncError);
              }
            }
          } catch (createError) {
            console.error('[PREFERENCES PUT] Error creating session:', createError);
          }
        }
        
        console.log(`[PREFERENCES PUT] Successfully created ${createdCount} sessions and synced ${syncedCount} to calendar for user ${user.id}`);
      } catch (genError) {
        console.error('[PREFERENCES PUT] Error regenerating sessions from preferences:', genError);
        console.error('[PREFERENCES PUT] Error details:', genError instanceof Error ? genError.stack : genError);
        // No fallar la actualización de preferencias si falla la generación de sesiones
      }
    }

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    logger.error('Error updating study preferences:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'UPDATE_PREFERENCES_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

