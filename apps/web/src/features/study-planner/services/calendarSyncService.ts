/**
 * Servicio para sincronizar sesiones de estudio con calendarios externos
 */

import type { StudySession, CalendarIntegration } from '@repo/shared/types';
import { StudyPlannerService } from './studyPlannerService';

export class CalendarSyncService {
  /**
   * Crea un evento en el calendario externo
   */
  static async createEvent(
    session: StudySession,
    integration: CalendarIntegration
  ): Promise<string | null> {
    try {
      if (!integration.access_token) {
        throw new Error('Token de acceso no disponible');
      }

      if (integration.provider === 'google') {
        return await this.createGoogleEvent(session, integration.access_token);
      } else if (integration.provider === 'microsoft') {
        return await this.createMicrosoftEvent(session, integration.access_token);
      }

      return null;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  /**
   * Actualiza un evento en el calendario externo
   */
  static async updateEvent(
    session: StudySession,
    integration: CalendarIntegration
  ): Promise<boolean> {
    try {
      if (!integration.access_token || !session.external_event_id) {
        return false;
      }

      if (integration.provider === 'google') {
        return await this.updateGoogleEvent(session, integration.access_token);
      } else if (integration.provider === 'microsoft') {
        return await this.updateMicrosoftEvent(session, integration.access_token);
      }

      return false;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return false;
    }
  }

  /**
   * Elimina un evento del calendario externo
   */
  static async deleteEvent(
    session: StudySession,
    integration: CalendarIntegration
  ): Promise<boolean> {
    try {
      if (!session.external_event_id) {
        console.log('[CALENDAR SYNC] No external_event_id for session, skipping deletion');
        return false;
      }

      // Verificar si el token está expirado y refrescarlo si es necesario
      let accessToken = integration.access_token;
      let currentIntegration = integration;

      if (!accessToken) {
        console.error('[CALENDAR SYNC] No access token available');
        return false;
      }

      if (integration.expires_at && new Date(integration.expires_at) < new Date()) {
        console.log(`[CALENDAR SYNC] Token expired for ${integration.provider}, refreshing...`);
        try {
          await this.refreshToken(integration);
          // Obtener la integración actualizada
          const integrations = await StudyPlannerService.getCalendarIntegrations(integration.user_id);
          const updatedIntegration = integrations.find(int => int.id === integration.id);
          if (updatedIntegration && updatedIntegration.access_token) {
            currentIntegration = updatedIntegration;
            accessToken = updatedIntegration.access_token;
            console.log(`[CALENDAR SYNC] Token refreshed successfully for ${integration.provider}`);
          } else {
            console.error('[CALENDAR SYNC] Could not get updated integration after refresh');
            return false;
          }
        } catch (refreshError) {
          console.error('[CALENDAR SYNC] Error refreshing token:', refreshError);
          return false;
        }
      }

      if (currentIntegration.provider === 'google') {
        const result = await this.deleteGoogleEvent(session, accessToken);
        if (result) {
          console.log(`[CALENDAR SYNC] Successfully deleted event ${session.external_event_id} from Google Calendar`);
        } else {
          console.error(`[CALENDAR SYNC] Failed to delete event ${session.external_event_id} from Google Calendar`);
        }
        return result;
      } else if (currentIntegration.provider === 'microsoft') {
        const result = await this.deleteMicrosoftEvent(session, accessToken);
        if (result) {
          console.log(`[CALENDAR SYNC] Successfully deleted event ${session.external_event_id} from Microsoft Calendar`);
        } else {
          console.error(`[CALENDAR SYNC] Failed to delete event ${session.external_event_id} from Microsoft Calendar`);
        }
        return result;
      }

      console.warn(`[CALENDAR SYNC] Unknown provider: ${currentIntegration.provider}`);
      return false;
    } catch (error) {
      console.error('[CALENDAR SYNC] Error deleting calendar event:', error);
      return false;
    }
  }

  /**
   * Sincroniza todas las sesiones con los calendarios conectados
   */
  static async syncAllSessions(userId: string): Promise<void> {
    try {
      const integrations = await StudyPlannerService.getCalendarIntegrations(userId);
      const sessions = await StudyPlannerService.getStudySessions(userId);

      for (const integration of integrations) {
        // Verificar si el token está expirado y refrescarlo si es necesario
        if (integration.expires_at && new Date(integration.expires_at) < new Date()) {
          await this.refreshToken(integration);
        }

        for (const session of sessions) {
          if (session.calendar_provider === integration.provider) {
            if (session.external_event_id) {
              // Actualizar evento existente
              await this.updateEvent(session, integration);
            } else {
              // Crear nuevo evento
              const eventId = await this.createEvent(session, integration);
              if (eventId) {
                await StudyPlannerService.updateStudySession(session.id, userId, {
                  external_event_id: eventId,
                  calendar_provider: integration.provider,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error syncing all sessions:', error);
    }
  }

  /**
   * Crea un evento en Google Calendar
   */
  private static async createGoogleEvent(
    session: StudySession,
    accessToken: string
  ): Promise<string | null> {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: session.title,
        description: session.description || '',
        start: {
          dateTime: session.start_time,
          timeZone: 'UTC',
        },
        end: {
          dateTime: session.end_time,
          timeZone: 'UTC',
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Error creating Google Calendar event');
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Actualiza un evento en Google Calendar
   */
  private static async updateGoogleEvent(
    session: StudySession,
    accessToken: string
  ): Promise<boolean> {
    if (!session.external_event_id) return false;

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${session.external_event_id}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: session.title,
          description: session.description || '',
          start: {
            dateTime: session.start_time,
            timeZone: 'UTC',
          },
          end: {
            dateTime: session.end_time,
            timeZone: 'UTC',
          },
        }),
      }
    );

    return response.ok;
  }

  /**
   * Elimina un evento de Google Calendar
   */
  private static async deleteGoogleEvent(
    session: StudySession,
    accessToken: string
  ): Promise<boolean> {
    if (!session.external_event_id) return false;

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${session.external_event_id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok;
  }

  /**
   * Crea un evento en Microsoft Calendar
   */
  private static async createMicrosoftEvent(
    session: StudySession,
    accessToken: string
  ): Promise<string | null> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: session.title,
        body: {
          contentType: 'Text',
          content: session.description || '',
        },
        start: {
          dateTime: session.start_time,
          timeZone: 'UTC',
        },
        end: {
          dateTime: session.end_time,
          timeZone: 'UTC',
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Error creating Microsoft Calendar event');
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Actualiza un evento en Microsoft Calendar
   */
  private static async updateMicrosoftEvent(
    session: StudySession,
    accessToken: string
  ): Promise<boolean> {
    if (!session.external_event_id) return false;

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events/${session.external_event_id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: session.title,
          body: {
            contentType: 'Text',
            content: session.description || '',
          },
          start: {
            dateTime: session.start_time,
            timeZone: 'UTC',
          },
          end: {
            dateTime: session.end_time,
            timeZone: 'UTC',
          },
        }),
      }
    );

    return response.ok;
  }

  /**
   * Elimina un evento de Microsoft Calendar
   */
  private static async deleteMicrosoftEvent(
    session: StudySession,
    accessToken: string
  ): Promise<boolean> {
    if (!session.external_event_id) return false;

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events/${session.external_event_id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok;
  }

  /**
   * Refresca el token de acceso
   */
  static async refreshToken(integration: CalendarIntegration): Promise<void> {
    if (!integration.refresh_token) {
      throw new Error('Refresh token no disponible');
    }

    let newAccessToken = '';
    let newExpiresAt: Date | null = null;

    if (integration.provider === 'google') {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Google OAuth no configurado');
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: integration.refresh_token,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Error refreshing Google token');
      }

      const data = await response.json();
      newAccessToken = data.access_token;
      newExpiresAt = new Date(Date.now() + (data.expires_in * 1000));
    } else if (integration.provider === 'microsoft') {
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Microsoft OAuth no configurado');
      }

      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: integration.refresh_token,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          scope: 'Calendars.ReadWrite offline_access',
        }),
      });

      if (!response.ok) {
        throw new Error('Error refreshing Microsoft token');
      }

      const data = await response.json();
      newAccessToken = data.access_token;
      newExpiresAt = new Date(Date.now() + (data.expires_in * 1000));
    }

    // Actualizar integración con nuevo token
    await StudyPlannerService.createOrUpdateCalendarIntegration({
      user_id: integration.user_id,
      provider: integration.provider,
      access_token: newAccessToken,
      refresh_token: integration.refresh_token,
      expires_at: newExpiresAt?.toISOString() || null,
      scope: integration.scope || null,
    });
  }
}

