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

/**
 * GET /api/study-planner/calendar/events
 * Obtiene los eventos del calendario del usuario
 */
export async function GET(request: NextRequest) {
  console.log('🚀 [Calendar Events API] Iniciando request...');
  
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    console.log('👤 [Calendar Events API] Usuario:', user?.id);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener parámetros de fecha
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const startDate = startDateParam ? new Date(startDateParam) : new Date();
    const endDate = endDateParam ? new Date(endDateParam) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Obtener integración de calendario del usuario (usando admin client para bypass RLS)
    // Ordenar por updated_at para obtener la más reciente (puede haber múltiples)
    const supabase = createAdminClient();
    const { data: integrations, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (integrationError || !integrations || integrations.length === 0) {
      console.log('❌ [Calendar Events API] No hay integración:', integrationError?.message);
      return NextResponse.json({ 
        events: [],
        message: 'No hay calendario conectado'
      });
    }
    
    const integration = integrations[0];

    console.log('✅ [Calendar Events API] Integración encontrada:', {
      provider: integration.provider,
      hasToken: !!integration.access_token,
      expiresAt: integration.expires_at
    });

    // Verificar si el token ha expirado
    const tokenExpiry = new Date(integration.expires_at);
    let accessToken = integration.access_token;

    if (tokenExpiry <= new Date()) {
      console.log('⏰ [Calendar Events API] Token expirado, refrescando...');
      // Refrescar token
      const refreshResult = await refreshAccessToken(integration);
      if (!refreshResult.success) {
        console.log('❌ [Calendar Events API] No se pudo refrescar el token');
        return NextResponse.json({ 
          error: 'Token expirado y no se pudo refrescar',
          events: [] 
        }, { status: 401 });
      }
      accessToken = refreshResult.accessToken;
      console.log('✅ [Calendar Events API] Token refrescado exitosamente');
    } else {
      console.log('✅ [Calendar Events API] Token válido hasta:', tokenExpiry.toISOString());
    }

    // Obtener eventos según el proveedor
    let events: any[] = [];
    
    console.log(`📅 [API Events] Obteniendo eventos para provider: ${integration.provider}`);
    console.log(`📅 [API Events] Rango de fechas: ${startDate.toISOString()} - ${endDate.toISOString()}`);
    
    if (integration.provider === 'google') {
      events = await getGoogleCalendarEvents(accessToken, startDate, endDate);
    } else if (integration.provider === 'microsoft') {
      events = await getMicrosoftCalendarEvents(accessToken, startDate, endDate);
    }

    console.log(`📅 [API Events] Total eventos obtenidos: ${events.length}`);
    if (events.length > 0) {
      console.log(`📅 [API Events] Primeros 3 eventos:`, events.slice(0, 3).map(e => ({ title: e.title, start: e.start })));
    }

    return NextResponse.json({ 
      events,
      provider: integration.provider,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalEvents: events.length
    });

  } catch (error: any) {
    console.error('Error obteniendo eventos del calendario:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor',
      events: []
    }, { status: 500 });
  }
}

/**
 * Refresca el access token usando el refresh token
 */
async function refreshAccessToken(integration: any): Promise<{ success: boolean; accessToken?: string }> {
  // Buscar en múltiples nombres de variables para compatibilidad
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
 * Obtiene eventos de Google Calendar desde TODOS los calendarios del usuario
 */
async function getGoogleCalendarEvents(accessToken: string, startDate: Date, endDate: Date): Promise<any[]> {
  try {
    console.log('📅 [Google] Iniciando obtención de calendarios...');
    
    // Primero, obtener la lista de calendarios del usuario
    const calendarsResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log(`📅 [Google] Respuesta de calendarList: ${calendarsResponse.status}`);

    if (!calendarsResponse.ok) {
      const errorText = await calendarsResponse.text();
      console.error('❌ [Google] Error obteniendo lista de calendarios:', calendarsResponse.status, errorText);
      // Fallback: intentar solo con primary
      console.log('📅 [Google] Fallback: intentando solo con calendario primary...');
      return await getEventsFromCalendar(accessToken, 'primary', startDate, endDate);
    }

    const calendarsData = await calendarsResponse.json();
    const calendars = calendarsData.items || [];
    
    console.log(`📅 [Google] Calendarios encontrados: ${calendars.length}`);
    calendars.forEach((c: any) => {
      console.log(`   - ${c.summary} (id: ${c.id.substring(0, 30)}..., accessRole: ${c.accessRole}, primary: ${c.primary})`);
    });

    // SOLO obtener eventos del calendario PROPIO del usuario
    // El calendario principal tiene primary=true y es el único que realmente pertenece al usuario
    // Los calendarios de otros usuarios que administra tienen accessRole='owner' pero NO son primary
    const allEvents: any[] = [];
    
    for (const calendar of calendars) {
      // CRITERIO ESTRICTO: Solo el calendario principal (primary=true)
      // Esto excluye calendarios de otros usuarios que el usuario administra
      if (calendar.primary === true) {
        console.log(`📅 [Google] Obteniendo eventos de calendario PRINCIPAL: "${calendar.summary}"`);
        const events = await getEventsFromCalendar(accessToken, calendar.id, startDate, endDate);
        console.log(`   → ${events.length} eventos encontrados`);
        allEvents.push(...events);
      } else {
        console.log(`⏭️ [Google] Saltando calendario "${calendar.summary}" (no es el principal, accessRole: ${calendar.accessRole})`);
      }
    }

    console.log(`📅 [Google] TOTAL de eventos obtenidos: ${allEvents.length}`);
    
    // Ordenar por fecha de inicio
    allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    return allEvents;
  } catch (error) {
    console.error('❌ [Google] Error en getGoogleCalendarEvents:', error);
    return [];
  }
}

/**
 * Obtiene eventos de un calendario específico de Google
 */
async function getEventsFromCalendar(accessToken: string, calendarId: string, startDate: Date, endDate: Date): Promise<any[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
      `timeMin=${startDate.toISOString()}&` +
      `timeMax=${endDate.toISOString()}&` +
      `singleEvents=true&` +
      `orderBy=startTime&` +
      `maxResults=250`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error obteniendo eventos del calendario ${calendarId}:`, errorText);
      return [];
    }

    const data = await response.json();
    const events = data.items || [];

    return events.map((event: any) => ({
      id: event.id,
      title: event.summary || 'Sin título',
      description: event.description || '',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || '',
      status: event.status,
      isAllDay: !event.start?.dateTime,
      calendarId: calendarId,
    }));
  } catch (error) {
    console.error(`Error obteniendo eventos del calendario ${calendarId}:`, error);
    return [];
  }
}

/**
 * Obtiene eventos de Microsoft Calendar
 */
async function getMicrosoftCalendarEvents(accessToken: string, startDate: Date, endDate: Date): Promise<any[]> {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarview?` +
      `startDateTime=${startDate.toISOString()}&` +
      `endDateTime=${endDate.toISOString()}&` +
      `$orderby=start/dateTime&` +
      `$top=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Error obteniendo eventos de Microsoft:', await response.text());
      return [];
    }

    const data = await response.json();
    const events = data.value || [];

    return events.map((event: any) => ({
      id: event.id,
      title: event.subject || 'Sin título',
      description: event.bodyPreview || '',
      start: event.start?.dateTime,
      end: event.end?.dateTime,
      location: event.location?.displayName || '',
      status: event.showAs,
      isAllDay: event.isAllDay,
    }));
  } catch (error) {
    console.error('Error en getMicrosoftCalendarEvents:', error);
    return [];
  }
}

