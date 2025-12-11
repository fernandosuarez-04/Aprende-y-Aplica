/**
 * API Endpoint: Sync Study Sessions to Calendar
 * 
 * POST /api/study-planner/calendar/sync-sessions
 * 
 * Sincroniza las sesiones de estudio con el calendario del usuario
 * (Google Calendar o Microsoft Calendar)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SessionService } from '../../../../../features/auth/services/session.service';

// Crear cliente admin para bypass de RLS
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de Supabase no configuradas');
  }

  return createServiceClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

interface SyncSessionsRequest {
  sessionIds: string[];
}

interface SyncSessionsResponse {
  success: boolean;
  data?: {
    syncedCount: number;
    failedCount: number;
    errors?: string[];
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SyncSessionsResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const body: SyncSessionsRequest = await request.json();
    
    if (!body.sessionIds || !Array.isArray(body.sessionIds) || body.sessionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'sessionIds es requerido y debe ser un array no vacío' },
        { status: 400 }
      );
    }
    
    const supabase = createAdminClient();
    
    // Obtener las sesiones de estudio
    const { data: sessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('*')
      .in('id', body.sessionIds)
      .eq('user_id', user.id);
    
    if (sessionsError || !sessions || sessions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron sesiones para sincronizar' },
        { status: 404 }
      );
    }
    
    // Obtener integración de calendario del usuario
    const { data: integrations, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (integrationError || !integrations || integrations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay calendario conectado' },
        { status: 404 }
      );
    }
    
    const integration = integrations[0];
    
    // Verificar si el token ha expirado y refrescarlo si es necesario
    const tokenExpiry = new Date(integration.expires_at);
    let accessToken = integration.access_token;
    
    if (tokenExpiry <= new Date()) {
      const refreshResult = await refreshAccessToken(integration);
      if (!refreshResult.success) {
        return NextResponse.json(
          { success: false, error: 'Token expirado y no se pudo refrescar' },
          { status: 401 }
        );
      }
      accessToken = refreshResult.accessToken;
    }
    
    // Sincronizar sesiones según el proveedor
    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    
    for (const session of sessions) {
      try {
        let eventId: string | null = null;
        
        if (integration.provider === 'google') {
          eventId = await createGoogleCalendarEvent(accessToken, session);
        } else if (integration.provider === 'microsoft') {
          eventId = await createMicrosoftCalendarEvent(accessToken, session);
        }
        
        if (eventId) {
          // Actualizar la sesión con el ID del evento del calendario
          await supabase
            .from('study_sessions')
            .update({
              external_event_id: eventId,
              calendar_provider: integration.provider,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.id);
          
          syncedCount++;
        } else {
          failedCount++;
          errors.push(`No se pudo crear evento para sesión: ${session.title}`);
        }
      } catch (error: any) {
        failedCount++;
        errors.push(`Error sincronizando sesión ${session.title}: ${error.message}`);
        console.error(`Error sincronizando sesión ${session.id}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        syncedCount,
        failedCount,
        errors: errors.length > 0 ? errors : undefined
      }
    });
    
  } catch (error: any) {
    console.error('Error sincronizando sesiones con calendario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

/**
 * Refresca el access token usando el refresh token
 */
async function refreshAccessToken(integration: any): Promise<{ success: boolean; accessToken?: string }> {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID || 
                           process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID ||
                           process.env.GOOGLE_CLIENT_ID ||
                           process.env.GOOGLE_OAUTH_CLIENT_ID || '';
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
                               process.env.GOOGLE_CLIENT_SECRET ||
                               process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
  const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CALENDAR_CLIENT_ID ||
                              process.env.NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID ||
                              process.env.MICROSOFT_CLIENT_ID ||
                              process.env.MICROSOFT_OAUTH_CLIENT_ID || '';
  const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET ||
                                  process.env.MICROSOFT_CLIENT_SECRET ||
                                  process.env.MICROSOFT_OAUTH_CLIENT_SECRET || '';

  try {
    if (integration.provider === 'google') {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        console.error('Error refrescando token de Google:', await response.text());
        return { success: false };
      }

      const tokens = await response.json();
      
      // Actualizar en base de datos
      const supabase = createAdminClient();
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', integration.id);

      return { success: true, accessToken: tokens.access_token };
      
    } else if (integration.provider === 'microsoft') {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: MICROSOFT_CLIENT_SECRET,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        console.error('Error refrescando token de Microsoft:', await response.text());
        return { success: false };
      }

      const tokens = await response.json();
      
      // Actualizar en base de datos
      const supabase = createAdminClient();
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || integration.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', integration.id);

      return { success: true, accessToken: tokens.access_token };
    }

    return { success: false };
  } catch (error) {
    console.error('Error en refreshAccessToken:', error);
    return { success: false };
  }
}

/**
 * Crea un evento en Google Calendar
 */
async function createGoogleCalendarEvent(accessToken: string, session: any): Promise<string | null> {
  try {
    // Formatear descripción con todas las lecciones
    let description = '';
    
    if (session.description) {
      // Si la descripción ya tiene las lecciones listadas (formato: "1. Lección X\n2. Lección Y")
      const lines = session.description.split('\n').filter(line => line.trim().length > 0);
      
      if (lines.length > 1) {
        // Hay múltiples lecciones, formatear con HTML para mejor visualización
        const formattedLessons = lines.map(line => {
          // Remover el número inicial si existe (ej: "1. " o "1.")
          const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
          return `• ${cleanLine}`;
        }).join('<br>');
        
        description = `<strong>📚 Lecciones a estudiar:</strong><br><br>${formattedLessons}`;
      } else if (lines.length === 1) {
        // Solo una lección
        const cleanLine = lines[0].replace(/^\d+\.\s*/, '').trim();
        description = `<strong>📚 Lección:</strong><br><br>• ${cleanLine}`;
      } else {
        description = session.description;
      }
    } else {
      description = `Sesión de estudio${session.course_id ? ` - Curso: ${session.course_id}` : ''}`;
    }
    
    const event = {
      summary: session.title,
      description: description,
      start: {
        dateTime: new Date(session.start_time).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(session.end_time).toISOString(),
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 15 }, // 15 minutos antes
        ],
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creando evento en Google Calendar:', errorText);
      return null;
    }

    const createdEvent = await response.json();
    return createdEvent.id;
  } catch (error) {
    console.error('Error en createGoogleCalendarEvent:', error);
    return null;
  }
}

/**
 * Crea un evento en Microsoft Calendar
 */
async function createMicrosoftCalendarEvent(accessToken: string, session: any): Promise<string | null> {
  try {
    const event = {
      subject: session.title,
      body: {
        contentType: 'HTML',
        content: session.description || `Sesión de estudio${session.course_id ? ` - Curso: ${session.course_id}` : ''}`,
      },
      start: {
        dateTime: new Date(session.start_time).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(session.end_time).toISOString(),
        timeZone: 'UTC',
      },
      reminderMinutesBeforeStart: 15,
      isReminderOn: true,
    };

    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/calendar/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creando evento en Microsoft Calendar:', errorText);
      return null;
    }

    const createdEvent = await response.json();
    return createdEvent.id;
  } catch (error) {
    console.error('Error en createMicrosoftCalendarEvent:', error);
    return null;
  }
}

