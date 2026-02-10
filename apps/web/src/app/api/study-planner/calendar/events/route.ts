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

  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();

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

      return NextResponse.json({
        events: [],
        message: 'No hay calendario conectado'
      });
    }

    const integration = integrations[0];

    // ✅ CORRECCIÓN: Verificar si el token ha expirado con manejo seguro de null
    let accessToken = integration.access_token;
    let tokenExpiry: Date | null = null;

    if (integration.expires_at) {
      try {
        tokenExpiry = new Date(integration.expires_at);
      } catch (e) {
        console.warn('⚠️ [Calendar Events API] Error parseando expires_at:', e);
        tokenExpiry = null;
      }
    }

    // Si no hay fecha de expiración o el token está expirado, intentar refrescar
    const needsRefresh = !tokenExpiry || !integration.expires_at || tokenExpiry <= new Date();

    if (needsRefresh) {

      // Verificar que haya refresh_token disponible
      if (!integration.refresh_token) {
        console.error('❌ [Calendar Events API] No hay refresh_token disponible');
        return NextResponse.json({
          error: 'Token expirado y no hay refresh token disponible. Por favor, reconecta tu calendario.',
          events: [],
          requiresReconnection: true
        }, { status: 401 });
      }

      // Refrescar token
      const refreshResult = await refreshAccessToken(integration);
      if (!refreshResult.success || !refreshResult.accessToken) {
        console.error('❌ [Calendar Events API] No se pudo refrescar el token:', refreshResult);
        return NextResponse.json({
          error: 'Token expirado y no se pudo refrescar. Por favor, reconecta tu calendario.',
          events: [],
          requiresReconnection: true
        }, { status: 401 });
      }
      accessToken = refreshResult.accessToken;

    } else {
    }

    // ✅ SINCRONIZAR: Verificar si eventos de sesiones fueron eliminados manualmente en Google Calendar
    await syncDeletedStudySessions(supabase, user.id, startDate, endDate, accessToken, integration);

    // Obtener eventos según el proveedor
    let events: any[] = [];


    if (integration.provider === 'google') {
      events = await getGoogleCalendarEvents(accessToken, startDate, endDate);
    } else if (integration.provider === 'microsoft') {
      events = await getMicrosoftCalendarEvents(accessToken, startDate, endDate);
    }

    if (events.length > 0) {
    }

    // ✅ FILTRAR EVENTOS HUÉRFANOS: Eliminar eventos del calendario externo que corresponden a sesiones eliminadas
    // Obtener todos los external_event_id de las sesiones activas del usuario
    const { data: activeSessions } = await supabase
      .from('study_sessions')
      .select('external_event_id, calendar_provider')
      .eq('user_id', user.id)
      .not('external_event_id', 'is', null)
      .eq('calendar_provider', integration.provider);

    const activeEventIds = new Set(
      (activeSessions || [])
        .filter(s => s.external_event_id && s.calendar_provider === integration.provider)
        .map(s => {
          // Limpiar el ID del evento (puede venir con formato de recurrencia)
          const eventId = s.external_event_id;
          return typeof eventId === 'string' ? eventId.split('_')[0] : eventId;
        })
    );

    console.log(`🔍 [API Events] Sesiones activas con eventos externos: ${activeEventIds.size}`);

    // Filtrar eventos que corresponden a sesiones eliminadas
    const filteredEvents = events.filter(event => {
      // Limpiar el ID del evento (puede venir con formato de recurrencia)
      const cleanEventId = event.id?.split('_')[0] || event.id;

      // Si el evento está en la lista de sesiones activas, incluirlo (es parte de un plan activo)
      if (activeEventIds.has(cleanEventId)) {
        return true;
      }

      // Si el evento NO está en la lista de sesiones activas, podría ser:
      // 1. Un evento legítimo del usuario (no parte de un plan)
      // 2. Un evento huérfano de un plan eliminado
      // Para distinguir, verificamos si hay algún evento en user_calendar_events con este ID
      // Si no hay, probablemente es un evento huérfano del plan
      // Por ahora, incluimos todos los eventos que no están en la lista de sesiones activas
      // La limpieza adicional se hará en el endpoint de eventos personalizados
      return true;
    });

    // Filtrar eventos que definitivamente son huérfanos: eventos que están en user_calendar_events
    // pero que NO están en sesiones activas (fueron parte de un plan eliminado)
    const { data: orphanedEvents } = await supabase
      .from('user_calendar_events')
      .select(integration.provider === 'google' ? 'google_event_id' : 'microsoft_event_id')
      .eq('user_id', user.id)
      .not(integration.provider === 'google' ? 'google_event_id' : 'microsoft_event_id', 'is', null);

    const orphanedEventIds = new Set(
      (orphanedEvents || [])
        .map((e: any) => {
          const eventId = integration.provider === 'google' ? e.google_event_id : e.microsoft_event_id;
          return typeof eventId === 'string' ? eventId.split('_')[0] : eventId;
        })
        .filter(id => id && !activeEventIds.has(id)) // Solo eventos que NO están en sesiones activas
    );

    console.log(`🗑️ [API Events] Eventos huérfanos detectados: ${orphanedEventIds.size}`);

    // Filtrar eventos que están en la lista de huérfanos
    const finalEvents = filteredEvents.filter(event => {
      const cleanEventId = event.id?.split('_')[0] || event.id;
      return !orphanedEventIds.has(cleanEventId);
    });

    console.log(`✅ [API Events] Eventos después de filtrar huérfanos: ${finalEvents.length} (${events.length - finalEvents.length} eliminados)`);

    return NextResponse.json({
      events: finalEvents,
      provider: integration.provider,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalEvents: finalEvents.length
    });

  } catch (error: any) {
    console.error('Error obteniendo eventos del calendario:', error);

    // ✅ Detectar error de scopes insuficientes y retornar respuesta apropiada
    if (error.message?.includes('SCOPE_INSUFFICIENT')) {
      return NextResponse.json({
        error: error.message.replace('SCOPE_INSUFFICIENT: ', ''),
        events: [],
        requiresReconnection: true,
        reason: 'SCOPE_INSUFFICIENT'
      }, { status: 401 });
    }

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
    // ✅ CORRECCIÓN: Validar que las credenciales estén disponibles
    if (integration.provider === 'google') {
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        console.error('❌ [Refresh Token] Faltan credenciales de Google Calendar');
        console.error('   GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? '✅' : '❌');
        console.error('   GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? '✅' : '❌');
        return { success: false };
      }

      if (!integration.refresh_token) {
        console.error('❌ [Refresh Token] No hay refresh_token en la integración');
        return { success: false };
      }

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
        const errorText = await response.text();
        console.error('❌ [Refresh Token] Error refrescando token de Google:', response.status, errorText);
        return { success: false };
      }

      const tokens = await response.json();

      if (!tokens.access_token) {
        console.error('❌ [Refresh Token] No se recibió access_token en la respuesta');
        return { success: false };
      }

      // ✅ CORRECCIÓN: Guardar nuevo refresh_token si viene en la respuesta
      // Preservar el existente si no viene uno nuevo (Google no siempre devuelve uno nuevo)
      const refreshTokenToSave = tokens.refresh_token || integration.refresh_token;

      // Actualizar en base de datos
      const supabase = createAdminClient();
      const { error: updateError } = await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: refreshTokenToSave,
          expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      if (updateError) {
        console.error('❌ [Refresh Token] Error actualizando token en BD:', updateError);
        // Aún así retornar el token si se obtuvo correctamente
      } else {

      }

      return { success: true, accessToken: tokens.access_token };

    } else if (integration.provider === 'microsoft') {
      if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
        console.error('❌ [Refresh Token] Faltan credenciales de Microsoft Calendar');
        return { success: false };
      }

      if (!integration.refresh_token) {
        console.error('❌ [Refresh Token] No hay refresh_token en la integración');
        return { success: false };
      }

      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID,
          client_secret: MICROSOFT_CLIENT_SECRET,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
          scope: 'offline_access Calendars.Read User.Read',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Refresh Token] Error refrescando token de Microsoft:', response.status, errorText);
        return { success: false };
      }

      const tokens = await response.json();

      if (!tokens.access_token) {
        console.error('❌ [Refresh Token] No se recibió access_token en la respuesta');
        return { success: false };
      }

      // Actualizar en base de datos
      const supabase = createAdminClient();
      const { error: updateError } = await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || integration.refresh_token,
          expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      if (updateError) {
        console.error('❌ [Refresh Token] Error actualizando token en BD:', updateError);
      } else {

      }

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

    // Primero, obtener la lista de calendarios del usuario
    const calendarsResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!calendarsResponse.ok) {
      const errorText = await calendarsResponse.text();
      console.error('❌ [Google] Error obteniendo lista de calendarios:', calendarsResponse.status, errorText);

      // ✅ Detectar error de scopes insuficientes (403)
      if (calendarsResponse.status === 403) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT' ||
            errorData.error?.message?.includes('insufficient authentication scopes')) {
            console.error('❌ [Google] El token no tiene los permisos necesarios. El usuario debe reconectar el calendario.');
            // Retornar array vacío con marca de error de scopes
            throw new Error('SCOPE_INSUFFICIENT: Los permisos del calendario han cambiado. Por favor, desconecta y vuelve a conectar tu calendario de Google.');
          }
        } catch (parseError) {
          // Si no podemos parsear, verificar el texto
          if (errorText.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') || errorText.includes('Insufficient Permission')) {
            throw new Error('SCOPE_INSUFFICIENT: Los permisos del calendario han cambiado. Por favor, desconecta y vuelve a conectar tu calendario de Google.');
          }
        }
      }

      // Fallback: intentar solo con primary
      console.log('📅 [Google] Intentando solo con calendario primario');
      return await getEventsFromCalendar(accessToken, 'primary', startDate, endDate);
    }

    const calendarsData = await calendarsResponse.json();
    const calendars = calendarsData.items || [];

    calendars.forEach((c: any) => {
    });

    // SOLO obtener eventos del calendario PROPIO del usuario
    // El calendario principal tiene primary=true y es el único que realmente pertenece al usuario
    // Los calendarios de otros usuarios que administra tienen accessRole='owner' pero NO son primary
    const allEvents: any[] = [];

    for (const calendar of calendars) {
      // CRITERIO ESTRICTO: Solo el calendario principal (primary=true)
      // Esto excluye calendarios de otros usuarios que el usuario administra
      if (calendar.primary === true) {

        const events = await getEventsFromCalendar(accessToken, calendar.id, startDate, endDate);

        allEvents.push(...events);
      } else {
      }
    }

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

    return events.map((event: any) => {
      const isAllDay = !event.start?.dateTime;

      // Para eventos de todo el día, Google Calendar devuelve solo fecha (ej: "2026-02-09")
      // new Date("2026-02-09") se interpreta como UTC midnight, lo que en zonas horarias
      // del hemisferio occidental causa que el evento se asigne al día anterior.
      // Solución: Agregar T00:00:00 para que se interprete como hora local.
      let start = event.start?.dateTime || event.start?.date;
      let end = event.end?.dateTime || event.end?.date;

      if (isAllDay) {
        if (event.start?.date) {
          start = `${event.start.date}T00:00:00`;
        }
        if (event.end?.date) {
          // Google Calendar: end date de all-day es exclusive (día siguiente)
          // Ajustar al final del día anterior (23:59:59) para que represente correctamente el rango
          const endDateObj = new Date(event.end.date + 'T00:00:00');
          endDateObj.setDate(endDateObj.getDate() - 1);
          const y = endDateObj.getFullYear();
          const m = String(endDateObj.getMonth() + 1).padStart(2, '0');
          const d = String(endDateObj.getDate()).padStart(2, '0');
          end = `${y}-${m}-${d}T23:59:59`;
        }
      }

      return {
        id: event.id,
        title: event.summary || 'Sin título',
        description: event.description || '',
        start,
        end,
        location: event.location || '',
        status: event.status,
        isAllDay,
        calendarId: calendarId,
      };
    });
  } catch (error) {
    console.error(`Error obteniendo eventos del calendario ${calendarId}:`, error);
    return [];
  }
}

/**
 * Sincroniza sesiones de estudio: limpia external_event_id de sesiones cuyos eventos fueron eliminados manualmente en Google Calendar
 */
async function syncDeletedStudySessions(
  supabase: any,
  userId: string,
  startDate: Date,
  endDate: Date,
  accessToken: string,
  integration: any
): Promise<void> {
  try {
    // Obtener todas las sesiones con external_event_id en el rango de fechas
    const { data: sessionsWithEvents } = await supabase
      .from('study_sessions')
      .select('id, external_event_id, calendar_provider')
      .eq('user_id', userId)
      .not('external_event_id', 'is', null)
      .eq('calendar_provider', integration.provider)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString());

    if (!sessionsWithEvents || sessionsWithEvents.length === 0) {
      return; // No hay sesiones con eventos externos
    }

    // Obtener eventos actuales del calendario externo
    let externalEvents: any[] = [];

    if (integration.provider === 'google') {
      externalEvents = await getGoogleCalendarEvents(accessToken, startDate, endDate);
    } else if (integration.provider === 'microsoft') {
      externalEvents = await getMicrosoftCalendarEvents(accessToken, startDate, endDate);
    }

    // Crear un Set con los IDs de eventos externos que existen (limpiando formato de recurrencia)
    const externalEventIds = new Set(
      externalEvents.map((e: any) => {
        const eventId = e.id;
        return typeof eventId === 'string' ? eventId.split('_')[0] : eventId;
      })
    );

    // Encontrar sesiones cuyos eventos fueron eliminados en el calendario externo
    const sessionsToClean: string[] = [];

    for (const session of sessionsWithEvents) {
      if (!session.external_event_id) continue;

      // Limpiar el ID del evento (puede venir con formato de recurrencia)
      const cleanEventId = typeof session.external_event_id === 'string'
        ? session.external_event_id.split('_')[0]
        : String(session.external_event_id).split('_')[0];

      // Si el evento no está en la lista de eventos externos, fue eliminado
      if (!externalEventIds.has(cleanEventId)) {
        sessionsToClean.push(session.id);
      }
    }

    // Limpiar external_event_id y calendar_provider de sesiones cuyos eventos fueron eliminados
    if (sessionsToClean.length > 0) {
      console.log(`🔄 [Sync Study Sessions] Limpiando ${sessionsToClean.length} sesiones con eventos eliminados en ${integration.provider} Calendar`);

      const { error: updateError } = await supabase
        .from('study_sessions')
        .update({
          external_event_id: null,
          calendar_provider: null,
          updated_at: new Date().toISOString()
        })
        .in('id', sessionsToClean)
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ [Sync Study Sessions] Error limpiando sesiones:', updateError);
      } else {
        console.log(`✅ [Sync Study Sessions] ${sessionsToClean.length} sesiones limpiadas exitosamente`);
      }
    }
  } catch (error) {
    console.error('❌ [Sync Study Sessions] Error en syncDeletedStudySessions:', error);
    // No lanzar error para que la carga de eventos continúe
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

    return events.map((event: any) => {
      let start = event.start?.dateTime;
      let end = event.end?.dateTime;

      // Microsoft Graph: para eventos de todo el día, dateTime viene como
      // "2026-02-09T00:00:00.0000000" sin zona horaria explícita.
      // Asegurar que cubra el día completo.
      if (event.isAllDay && start && end) {
        // Normalizar: start = día T00:00:00, end = día anterior T23:59:59
        // Microsoft end date es exclusive (día siguiente T00:00:00)
        const startStr = start.split('T')[0];
        start = `${startStr}T00:00:00`;
        const endDateObj = new Date(end.split('T')[0] + 'T00:00:00');
        endDateObj.setDate(endDateObj.getDate() - 1);
        const y = endDateObj.getFullYear();
        const m = String(endDateObj.getMonth() + 1).padStart(2, '0');
        const d = String(endDateObj.getDate()).padStart(2, '0');
        end = `${y}-${m}-${d}T23:59:59`;
      }

      return {
        id: event.id,
        title: event.subject || 'Sin título',
        description: event.bodyPreview || '',
        start,
        end,
        location: event.location?.displayName || '',
        status: event.showAs,
        isAllDay: event.isAllDay,
      };
    });
  } catch (error) {
    console.error('Error en getMicrosoftCalendarEvents:', error);
    return [];
  }
}

