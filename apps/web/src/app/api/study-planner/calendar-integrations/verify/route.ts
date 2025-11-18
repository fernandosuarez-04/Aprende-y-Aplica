import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { StudyPlannerService } from '../../../../../features/study-planner/services/studyPlannerService';
import { CalendarSyncService } from '../../../../../features/study-planner/services/calendarSyncService';
import { logger } from '@/lib/utils/logger';
import type { CalendarIntegration } from '@repo/shared/types';

/**
 * Verifica y refresca tokens de calendario automáticamente
 * Endpoint: POST /api/study-planner/calendar-integrations/verify
 */
export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const integrations = await StudyPlannerService.getCalendarIntegrations(user.id);
    const verifiedIntegrations: CalendarIntegration[] = [];
    const errors: Array<{ provider: string; error: string }> = [];

    for (const integration of integrations) {
      try {
        // Verificar si el token está expirado o a punto de expirar (en los próximos 5 minutos)
        const now = new Date();
        const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
        const shouldRefresh = expiresAt && expiresAt.getTime() < now.getTime() + 5 * 60 * 1000;

        if (shouldRefresh && integration.refresh_token) {
          logger.info(`[CALENDAR VERIFY] Token expirado o a punto de expirar para ${integration.provider}, refrescando...`);
          
          try {
            // Refrescar el token
            await CalendarSyncService.refreshToken(integration);
            
            // Obtener la integración actualizada
            const updatedIntegration = await StudyPlannerService.getCalendarIntegrationByProvider(
              user.id,
              integration.provider
            );
            
            if (updatedIntegration) {
              // Verificar que el token funciona haciendo una prueba de acceso
              const isValid = await testToken(updatedIntegration);
              
              if (isValid) {
                verifiedIntegrations.push(updatedIntegration);
                logger.info(`[CALENDAR VERIFY] Token refrescado y verificado exitosamente para ${integration.provider}`);
              } else {
                errors.push({
                  provider: integration.provider,
                  error: 'Token refrescado pero no válido para acceso',
                });
                logger.warn(`[CALENDAR VERIFY] Token refrescado pero no válido para ${integration.provider}`);
              }
            } else {
              errors.push({
                provider: integration.provider,
                error: 'No se pudo obtener la integración actualizada',
              });
            }
          } catch (refreshError) {
            logger.error(`[CALENDAR VERIFY] Error refrescando token para ${integration.provider}:`, refreshError);
            errors.push({
              provider: integration.provider,
              error: refreshError instanceof Error ? refreshError.message : 'Error desconocido al refrescar token',
            });
          }
        } else if (!integration.access_token) {
          errors.push({
            provider: integration.provider,
            error: 'No hay token de acceso disponible',
          });
        } else {
          // Token no expirado, verificar que funciona
          const isValid = await testToken(integration);
          
          if (isValid) {
            verifiedIntegrations.push(integration);
            logger.info(`[CALENDAR VERIFY] Token válido para ${integration.provider}`);
          } else {
            // Token no válido, intentar refrescar si hay refresh_token
            if (integration.refresh_token) {
              try {
                await CalendarSyncService.refreshToken(integration);
                const updatedIntegration = await StudyPlannerService.getCalendarIntegrationByProvider(
                  user.id,
                  integration.provider
                );
                if (updatedIntegration) {
                  const isValidAfterRefresh = await testToken(updatedIntegration);
                  if (isValidAfterRefresh) {
                    verifiedIntegrations.push(updatedIntegration);
                    logger.info(`[CALENDAR VERIFY] Token refrescado después de fallar prueba para ${integration.provider}`);
                  } else {
                    errors.push({
                      provider: integration.provider,
                      error: 'Token no válido después de refrescar',
                    });
                  }
                }
              } catch (refreshError) {
                errors.push({
                  provider: integration.provider,
                  error: refreshError instanceof Error ? refreshError.message : 'Error al refrescar token',
                });
              }
            } else {
              errors.push({
                provider: integration.provider,
                error: 'Token no válido y no hay refresh_token disponible',
              });
            }
          }
        }
      } catch (error) {
        logger.error(`[CALENDAR VERIFY] Error verificando integración ${integration.provider}:`, error);
        errors.push({
          provider: integration.provider,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        integrations: verifiedIntegrations,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    logger.error('[CALENDAR VERIFY] Error verificando integraciones:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Error desconocido',
          code: 'VERIFY_INTEGRATIONS_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Prueba si un token de acceso funciona haciendo una petición de prueba
 */
async function testToken(integration: CalendarIntegration): Promise<boolean> {
  if (!integration.access_token) {
    return false;
  }

  try {
    if (integration.provider === 'google') {
      // Hacer una petición simple a Google Calendar API
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${integration.access_token}`,
        },
      });

      // Si la respuesta es 200 o 401 (no autorizado), el token es válido pero puede tener permisos insuficientes
      // Solo retornamos false si es 401 (no autorizado) sin otros errores
      return response.ok || response.status === 403; // 403 = permisos insuficientes pero token válido
    } else if (integration.provider === 'microsoft') {
      // Hacer una petición simple a Microsoft Graph API
      const response = await fetch('https://graph.microsoft.com/v1.0/me/calendars?$top=1', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${integration.access_token}`,
        },
      });

      // Similar a Google, si la respuesta es 200 o 403, el token es válido
      return response.ok || response.status === 403;
    }

    // Para otros proveedores, asumir válido si hay access_token
    return true;
  } catch (error) {
    logger.error(`[CALENDAR VERIFY] Error testeando token para ${integration.provider}:`, error);
    return false;
  }
}

