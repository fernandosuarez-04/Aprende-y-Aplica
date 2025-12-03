import { createClient } from '@/lib/supabase/server';
import { StudySession } from '@aprende-y-aplica/shared';

export class CalendarSyncService {
  /**
   * Sincroniza todas las sesiones con un calendario específico
   */
  async syncAllSessions(
    userId: string,
    provider: 'google' | 'microsoft',
    sessions: StudySession[]
  ): Promise<void> {
    const supabase = await createClient();

    // Obtener integración
    const { data: integration, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (integrationError || !integration) {
      throw new Error(`No se encontró integración para ${provider}`);
    }

    // Verificar y refrescar token si es necesario
    await this.ensureValidToken(integration);

    // Sincronizar cada sesión
    for (const session of sessions) {
      try {
        if (session.external_event_id) {
          // Actualizar evento existente
          await this.updateEvent(provider, integration, session);
        } else {
          // Crear nuevo evento
          await this.createEvent(provider, integration, session);
        }
      } catch (error) {
        console.error(`Error syncing session ${session.id}:`, error);
        // Continuar con otras sesiones
      }
    }
  }

  /**
   * Crea un evento en el calendario externo
   */
  async createEvent(
    provider: 'google' | 'microsoft',
    integration: any,
    session: StudySession
  ): Promise<void> {
    if (provider === 'google') {
      await this.createGoogleEvent(integration, session);
    } else if (provider === 'microsoft') {
      await this.createMicrosoftEvent(integration, session);
    }
  }

  /**
   * Actualiza un evento en el calendario externo
   */
  async updateEvent(
    provider: 'google' | 'microsoft',
    integration: any,
    session: StudySession
  ): Promise<void> {
    if (provider === 'google') {
      await this.updateGoogleEvent(integration, session);
    } else if (provider === 'microsoft') {
      await this.updateMicrosoftEvent(integration, session);
    }
  }

  /**
   * Crea un evento en Google Calendar
   */
  private async createGoogleEvent(integration: any, session: StudySession): Promise<void> {
    const event = {
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
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error creating Google event: ${error}`);
    }

    const createdEvent = await response.json();

    // Actualizar sesión con external_event_id
    const supabase = await createClient();
    await supabase
      .from('study_sessions')
      .update({
        external_event_id: createdEvent.id,
        calendar_provider: 'google',
      })
      .eq('id', session.id);
  }

  /**
   * Actualiza un evento en Google Calendar
   */
  private async updateGoogleEvent(integration: any, session: StudySession): Promise<void> {
    if (!session.external_event_id) {
      throw new Error('No external_event_id found');
    }

    const event = {
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
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${session.external_event_id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error updating Google event: ${error}`);
    }
  }

  /**
   * Crea un evento en Microsoft Calendar
   */
  private async createMicrosoftEvent(integration: any, session: StudySession): Promise<void> {
    const event = {
      subject: session.title,
      body: {
        contentType: 'HTML',
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
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error creating Microsoft event: ${error}`);
    }

    const createdEvent = await response.json();

    // Actualizar sesión con external_event_id
    const supabase = await createClient();
    await supabase
      .from('study_sessions')
      .update({
        external_event_id: createdEvent.id,
        calendar_provider: 'microsoft',
      })
      .eq('id', session.id);
  }

  /**
   * Actualiza un evento en Microsoft Calendar
   */
  private async updateMicrosoftEvent(integration: any, session: StudySession): Promise<void> {
    if (!session.external_event_id) {
      throw new Error('No external_event_id found');
    }

    const event = {
      subject: session.title,
      body: {
        contentType: 'HTML',
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
    };

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendar/events/${session.external_event_id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error updating Microsoft event: ${error}`);
    }
  }

  /**
   * Verifica y refresca el token si es necesario
   */
  private async ensureValidToken(integration: any): Promise<void> {
    if (!integration.expires_at) {
      return;
    }

    const expiresAt = new Date(integration.expires_at);
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutos antes de expirar

    if (expiresAt.getTime() - now.getTime() > bufferTime) {
      return; // Token aún válido
    }

    // Refrescar token
    await this.refreshToken(integration);
  }

  /**
   * Refresca el access token usando el refresh token
   */
  private async refreshToken(integration: any): Promise<void> {
    if (!integration.refresh_token) {
      throw new Error('No refresh token available');
    }

    let tokenEndpoint: string;
    let body: URLSearchParams;

    if (integration.provider === 'google') {
      tokenEndpoint = 'https://oauth2.googleapis.com/token';
      body = new URLSearchParams({
        client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      });
    } else if (integration.provider === 'microsoft') {
      tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      body = new URLSearchParams({
        client_id: process.env.MICROSOFT_CALENDAR_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CALENDAR_CLIENT_SECRET!,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
        scope: 'Calendars.ReadWrite offline_access',
      });
    } else {
      throw new Error(`Unsupported provider: ${integration.provider}`);
    }

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error refreshing token: ${error}`);
    }

    const tokenData = await response.json();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    // Actualizar integración en la base de datos
    const supabase = await createClient();
    await supabase
      .from('calendar_integrations')
      .update({
        access_token: tokenData.access_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    // Actualizar objeto de integración para uso inmediato
    integration.access_token = tokenData.access_token;
    integration.expires_at = expiresAt.toISOString();
  }
}


