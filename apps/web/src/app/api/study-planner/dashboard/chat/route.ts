/**
 * API Endpoint: Study Planner Dashboard Chat
 * 
 * POST /api/study-planner/dashboard/chat
 * 
 * Procesa mensajes del usuario y ejecuta acciones sobre el plan de estudios.
 * LIA puede:
 * - Mover sesiones de estudio
 * - Eliminar bloques de estudio
 * - Ampliar o reducir sesiones
 * - Crear nuevas sesiones
 * - Sugerir ajustes basados en cambios del calendario
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from '../../../../../lib/supabase/types';
import { logger } from '../../../../../lib/utils/logger';

/**
 * Crea un cliente de Supabase con Service Role Key para bypass de RLS
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada.');
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tipos de acciones disponibles
type ActionType = 
  | 'move_session'
  | 'delete_session'
  | 'resize_session'
  | 'create_session'
  | 'update_session'
  | 'reschedule_sessions'
  | 'get_plan_summary'
  // Acciones de calendario externo
  | 'list_calendar_events'
  | 'create_calendar_event'
  | 'move_calendar_event'
  | 'delete_calendar_event'
  | 'none';

interface ActionResult {
  type: ActionType;
  data?: any;
  status: 'success' | 'error' | 'pending' | 'confirmation_needed';
  message?: string;
}

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  activePlanId?: string;
}

interface ChatResponse {
  success: boolean;
  response: string;
  action?: ActionResult;
  error?: string;
}

// Sistema de prompts para LIA en el dashboard
const SYSTEM_PROMPT = `Eres LIA, la asistente de inteligencia artificial del Planificador de Estudios. Tu rol es ayudar al usuario a gestionar su plan de estudios de forma conversacional.

## FECHA Y HORA ACTUAL
{{CURRENT_DATE_TIME}}

## TU PERSONALIDAD
- Eres amigable, motivadora y proactiva
- Usas emojis para hacer la conversación más cálida
- Siempre confirmas antes de ejecutar acciones destructivas (eliminar)
- Celebras los logros del usuario

## ACCIONES QUE PUEDES EJECUTAR

### SESIONES DE ESTUDIO (Prioridad Alta)
Estas acciones gestionan las sesiones del plan de estudios:

1. **MOVE_SESSION** - Mover una sesión de estudio a otro horario
   - El usuario dice: "mueve mi sesión del martes a las 10am", "cambia mi estudio del lunes para el miércoles"
   - Necesitas: sessionId, newStartTime, newEndTime

2. **DELETE_SESSION** - Eliminar una sesión de estudio
   - El usuario dice: "elimina la sesión de mañana", "cancela mi estudio del viernes"
   - Necesitas: sessionId
   - SIEMPRE pide confirmación antes de eliminar

3. **RESIZE_SESSION** - Cambiar la duración de una sesión de estudio
   - El usuario dice: "quiero estudiar 30 minutos más el viernes", "reduce mi sesión a 20 minutos"
   - Necesitas: sessionId, newDurationMinutes

4. **CREATE_SESSION** - Crear una nueva sesión de estudio
   - El usuario dice: "agrega una sesión el jueves a las 3pm", "quiero estudiar también los sábados"
   - Necesitas: title, startTime, endTime, courseId (opcional), lessonId (opcional)

5. **UPDATE_SESSION** - Actualizar detalles de una sesión de estudio
   - El usuario dice: "cambia el nombre de mi sesión", "actualiza la descripción"
   - Necesitas: sessionId, campos a actualizar

6. **RESCHEDULE_SESSIONS** - Reorganizar múltiples sesiones
   - El usuario dice: "reorganiza mi semana", "ajusta mi plan por el evento nuevo"
   - Analiza conflictos y sugiere nuevos horarios

### EVENTOS DEL CALENDARIO EXTERNO (Google Calendar)
Estas acciones gestionan eventos directamente en el calendario del usuario:

7. **LIST_CALENDAR_EVENTS** - Consultar eventos del calendario
   - El usuario dice: "¿qué eventos tengo hoy?", "¿qué tengo mañana?", "muéstrame mi agenda"
   - Necesitas: startDate, endDate (opcionales, por defecto hoy)
   - Devuelve todos los eventos, no solo sesiones de estudio

8. **CREATE_CALENDAR_EVENT** - Crear un evento en el calendario
   - El usuario dice: "agenda una cita con el doctor mañana a las 3pm", "pon una reunión el viernes"
   - Necesitas: title, startTime, endTime, description (opcional)
   - NO son sesiones de estudio, son eventos generales

9. **MOVE_CALENDAR_EVENT** - Mover un evento del calendario
   - El usuario dice: "mueve mi cita del doctor al jueves", "cambia la reunión para las 5pm"
   - Necesitas: eventId, newStartTime, newEndTime

10. **DELETE_CALENDAR_EVENT** - Eliminar un evento del calendario
    - El usuario dice: "elimina la reunión de mañana", "cancela mi cita"
    - Necesitas: eventId
    - SIEMPRE pide confirmación antes de eliminar

## FORMATO DE RESPUESTA
Cuando detectes una intención de acción, responde en formato JSON dentro de tags especiales:

Para ejecutar una acción:
<action>
{
  "type": "TIPO_DE_ACCION",
  "data": { ... datos necesarios ... },
  "confirmationNeeded": true/false,
  "confirmationMessage": "mensaje de confirmación si es necesario"
}
</action>

Después del tag de acción, incluye tu mensaje para el usuario.

## REGLAS IMPORTANTES
1. NUNCA ejecutes acciones sin estar seguro de los datos
2. Si no tienes suficiente información, PREGUNTA al usuario
3. Para acciones destructivas (DELETE), SIEMPRE pide confirmación
4. Si el usuario menciona un horario ambiguo, pide aclaración
5. Usa el contexto del plan actual para identificar sesiones
6. Si no hay plan activo, guía al usuario a crear uno

## CONTEXTO ACTUAL
{{PLAN_CONTEXT}}

## HISTORIAL DE CONVERSACIÓN
{{CONVERSATION_HISTORY}}
`;

// Función para obtener el contexto del plan y eventos del calendario
async function getPlanContext(userId: string, planId?: string): Promise<string> {
  const supabase = createAdminClient();

  // Obtener plan más reciente (la tabla no tiene columna status)
  let planQuery = supabase
    .from('study_plans')
    .select(`
      id,
      name,
      description,
      start_date,
      end_date,
      timezone,
      preferred_days
    `)
    .eq('user_id', userId);

  if (planId) {
    planQuery = planQuery.eq('id', planId);
  }

  const { data: plan } = await planQuery.single();
  
  const timezone = plan?.timezone || 'America/Bogota';

  // Obtener fechas para consultas
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);
  
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Obtener eventos del calendario (HOY)
  let calendarEventsToday: CalendarEvent[] = [];
  let calendarEventsWeek: CalendarEvent[] = [];
  
  const { accessToken, provider } = await getCalendarAccessToken(userId);
  
  if (accessToken && provider === 'google') {
    // Eventos de hoy
    calendarEventsToday = await listGoogleCalendarEvents(accessToken, todayStart, todayEnd, timezone);
    // Eventos de la semana (7 días)
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    calendarEventsWeek = await listGoogleCalendarEvents(accessToken, todayStart, weekEnd, timezone);
  }

  let context = '';

  // Sección de calendario
  context += `## 📅 EVENTOS DEL CALENDARIO (HOY)
`;
  
  if (calendarEventsToday.length > 0) {
    for (const event of calendarEventsToday) {
      const typeLabel = event.isStudySession ? '📚' : '📌';
      const timeStr = event.isAllDay ? 'Todo el día' : `${formatTime(new Date(event.start))} - ${formatTime(new Date(event.end))}`;
      context += `- ${typeLabel} **${event.title}** (${timeStr}) [ID: ${event.id}]
`;
    }
  } else {
    context += 'No hay eventos programados para hoy.\n';
  }

  if (!plan) {
    context += '\nEl usuario no tiene un plan de estudios activo.';
    return context;
  }

  // Obtener sesiones del plan
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select(`
      id,
      title,
      description,
      start_time,
      end_time,
      duration_minutes,
      status,
      course_id,
      lesson_id
    `)
    .eq('plan_id', plan.id)
    .gte('start_time', todayStart.toISOString())
    .lte('start_time', twoWeeksLater.toISOString())
    .order('start_time', { ascending: true });

  // Formatear contexto del plan
  context += `
## 📚 PLAN DE ESTUDIOS ACTIVO
- **Nombre:** ${plan.name}
- **Descripción:** ${plan.description || 'Sin descripción'}
- **Zona horaria:** ${plan.timezone}
- **Días preferidos:** ${formatPreferredDays(plan.preferred_days)}

## SESIONES DE ESTUDIO PRÓXIMAS (hasta 14 días)
`;

  if (sessions && sessions.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    for (const session of sessions) {
      const sessionIdx = sessions.indexOf(session);
      const startDate = new Date(session.start_time);
      const endDate = new Date(session.end_time);
      
      const sessionDay = new Date(startDate);
      sessionDay.setHours(0, 0, 0, 0);
      
      let dayLabel = '';
      if (sessionDay.getTime() === today.getTime()) {
        dayLabel = ' 📍 **[HOY]**';
      } else if (sessionDay.getTime() === tomorrow.getTime()) {
        dayLabel = ' 📅 **[MAÑANA]**';
      }
      
      context += `
${sessionIdx + 1}. **${session.title}**${dayLabel}
   - ID: ${session.id}
   - Fecha: ${formatDate(startDate)}
   - Hora: ${formatTime(startDate)} - ${formatTime(endDate)}
   - Duración: ${session.duration_minutes || 'N/A'} minutos
   - Estado: ${translateStatus(session.status)}
`;
    }
  } else {
    context += 'No hay sesiones de estudio programadas en los próximos 14 días.';
  }

  // Agregar otros eventos de la semana (no sesiones de estudio)
  const otherEvents = calendarEventsWeek.filter(e => !e.isStudySession);
  if (otherEvents.length > 0) {
    context += `

## 📌 OTROS EVENTOS DE LA SEMANA (no son sesiones de estudio)
`;
    for (const event of otherEvents.slice(0, 10)) { // Limitar a 10 eventos
      const eventDate = new Date(event.start);
      const timeStr = event.isAllDay ? 'Todo el día' : `${formatTime(eventDate)}`;
      context += `- **${event.title}** - ${formatDate(eventDate)} ${timeStr} [ID: ${event.id}]
`;
    }
  }

  return context;
}

// Funciones helper de formateo
function formatPreferredDays(days: number[]): string {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days.map(d => dayNames[d]).join(', ');
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('es-ES', options);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'planned': 'Planificada',
    'in_progress': 'En progreso',
    'completed': 'Completada',
    'missed': 'Perdida',
    'rescheduled': 'Reprogramada',
  };
  return statusMap[status] || status;
}

// Función para extraer acción del mensaje de LIA
function extractAction(response: string): { action: ActionResult | null; cleanResponse: string } {
  const actionMatch = response.match(/<action>([\s\S]*?)<\/action>/);
  
  if (!actionMatch) {
    return { action: null, cleanResponse: response };
  }

  try {
    const actionData = JSON.parse(actionMatch[1]);
    const cleanResponse = response.replace(/<action>[\s\S]*?<\/action>/g, '').trim();
    
    return {
      action: {
        type: actionData.type?.toLowerCase() as ActionType,
        data: actionData.data,
        status: actionData.confirmationNeeded ? 'confirmation_needed' : 'pending',
        message: actionData.confirmationMessage,
      },
      cleanResponse,
    };
  } catch (error) {
    logger.error('Error parsing action:', error);
    return { action: null, cleanResponse: response };
  }
}

// ============================================================================
// Funciones de sincronización con calendario externo
// ============================================================================

/**
 * Obtiene el access token válido del usuario para el calendario
 */
async function getCalendarAccessToken(userId: string): Promise<{ accessToken: string | null; provider: string | null }> {
  const supabase = createAdminClient();
  
  const { data: integration } = await supabase
    .from('calendar_integrations')
    .select('id, provider, access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single();

  if (!integration || !integration.access_token) {
    return { accessToken: null, provider: null };
  }

  // Verificar si el token ha expirado
  const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
  const now = new Date();
  
  if (expiresAt && expiresAt < now && integration.refresh_token) {
    // Refrescar token
    const refreshed = await refreshAccessToken(integration);
    if (refreshed.success && refreshed.accessToken) {
      return { accessToken: refreshed.accessToken, provider: integration.provider };
    }
  }

  return { accessToken: integration.access_token, provider: integration.provider };
}

/**
 * Refresca el access token
 */
async function refreshAccessToken(integration: any): Promise<{ success: boolean; accessToken?: string }> {
  try {
    if (integration.provider === 'google') {
      const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID || 
                               process.env.GOOGLE_CLIENT_ID || '';
      const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
                                   process.env.GOOGLE_CLIENT_SECRET || '';

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
        logger.error('Error refrescando token de Google:', await response.text());
        return { success: false };
      }

      const tokens = await response.json();
      
      const supabase = createAdminClient();
      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', integration.id);

      return { success: true, accessToken: tokens.access_token };
    }
    
    // Agregar soporte para Microsoft si es necesario
    return { success: false };
  } catch (error) {
    logger.error('Error refrescando token:', error);
    return { success: false };
  }
}

/**
 * Actualiza un evento en Google Calendar
 */
async function updateGoogleCalendarEvent(
  accessToken: string, 
  eventId: string, 
  session: { title: string; start_time: string; end_time: string; description?: string },
  timezone: string
): Promise<boolean> {
  try {
    const event = {
      summary: session.title,
      description: session.description || '',
      start: {
        dateTime: new Date(session.start_time).toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: new Date(session.end_time).toISOString(),
        timeZone: timezone,
      },
    };

    logger.info(`📅 Actualizando evento en Google Calendar: ${eventId}`);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('❌ Error actualizando evento en Google Calendar:', errorText);
      return false;
    }

    logger.info('✅ Evento actualizado en Google Calendar');
    return true;
  } catch (error) {
    logger.error('Error en updateGoogleCalendarEvent:', error);
    return false;
  }
}

/**
 * Elimina un evento de Google Calendar
 */
async function deleteGoogleCalendarEvent(accessToken: string, eventId: string): Promise<boolean> {
  try {
    logger.info(`🗑️ Eliminando evento de Google Calendar: ${eventId}`);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      logger.error('❌ Error eliminando evento de Google Calendar:', errorText);
      return false;
    }

    logger.info('✅ Evento eliminado de Google Calendar');
    return true;
  } catch (error) {
    logger.error('Error en deleteGoogleCalendarEvent:', error);
    return false;
  }
}

/**
 * Crea un nuevo evento en Google Calendar
 */
async function createGoogleCalendarEvent(
  accessToken: string,
  session: { title: string; start_time: string; end_time: string; description?: string },
  timezone: string
): Promise<string | null> {
  try {
    const event = {
      summary: session.title,
      description: session.description || '',
      start: {
        dateTime: new Date(session.start_time).toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: new Date(session.end_time).toISOString(),
        timeZone: timezone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
        ],
      },
    };

    logger.info(`📅 Creando nuevo evento en Google Calendar: ${session.title}`);
    logger.info(`   Inicio: ${event.start.dateTime} (${timezone})`);
    logger.info(`   Fin: ${event.end.dateTime} (${timezone})`);

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
      logger.error('❌ Error creando evento en Google Calendar:', errorText);
      return null;
    }

    const createdEvent = await response.json();
    logger.info(`✅ Evento creado en Google Calendar con ID: ${createdEvent.id}`);
    return createdEvent.id;
  } catch (error) {
    logger.error('Error en createGoogleCalendarEvent:', error);
    return null;
  }
}

/**
 * Listar eventos del Google Calendar
 */
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  isAllDay: boolean;
  isStudySession: boolean;
}

async function listGoogleCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date,
  timezone: string
): Promise<CalendarEvent[]> {
  try {
    const timeMin = startDate.toISOString();
    const timeMax = endDate.toISOString();
    
    logger.info(`📅 Obteniendo eventos de Google Calendar: ${timeMin} - ${timeMax}`);
    
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('timeMax', timeMax);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('timeZone', timezone);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('❌ Error obteniendo eventos de Google Calendar:', errorText);
      return [];
    }

    const data = await response.json();
    const events: CalendarEvent[] = [];
    
    for (const item of data.items || []) {
      // Determinar si es un evento de todo el día
      const isAllDay = !!item.start?.date && !item.start?.dateTime;
      
      // Determinar si es una sesión de estudio (creada por nuestra app)
      const isStudySession = item.description?.includes('📚') || 
                            item.summary?.toLowerCase().includes('lección') ||
                            item.summary?.toLowerCase().includes('sesión de estudio');
      
      events.push({
        id: item.id,
        title: item.summary || 'Sin título',
        description: item.description || '',
        start: item.start?.dateTime || item.start?.date || '',
        end: item.end?.dateTime || item.end?.date || '',
        isAllDay,
        isStudySession,
      });
    }
    
    logger.info(`✅ Se obtuvieron ${events.length} eventos del calendario`);
    return events;
  } catch (error) {
    logger.error('Error en listGoogleCalendarEvents:', error);
    return [];
  }
}

/**
 * Mover un evento en Google Calendar
 */
async function moveGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  newStart: string,
  newEnd: string,
  timezone: string
): Promise<boolean> {
  try {
    logger.info(`📅 Moviendo evento en Google Calendar: ${eventId}`);
    
    // Primero obtener el evento actual para preservar otros campos
    const getResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!getResponse.ok) {
      logger.error('❌ Error obteniendo evento para mover:', await getResponse.text());
      return false;
    }

    const existingEvent = await getResponse.json();
    
    // Actualizar solo las fechas
    const updatedEvent = {
      ...existingEvent,
      start: {
        dateTime: new Date(newStart).toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: new Date(newEnd).toISOString(),
        timeZone: timezone,
      },
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvent),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('❌ Error moviendo evento en Google Calendar:', errorText);
      return false;
    }

    logger.info('✅ Evento movido en Google Calendar');
    return true;
  } catch (error) {
    logger.error('Error en moveGoogleCalendarEvent:', error);
    return false;
  }
}

/**
 * Sincroniza cambios de sesión con el calendario externo
 * Si la sesión no tiene external_event_id, crea un nuevo evento
 */
async function syncSessionWithCalendar(
  userId: string,
  sessionId: string,
  action: 'update' | 'delete',
  newData?: { start_time: string; end_time: string }
): Promise<{ success: boolean; message?: string }> {
  const supabase = createAdminClient();
  
  logger.info(`🔄 syncSessionWithCalendar iniciado - sessionId: ${sessionId}, action: ${action}`);
  
  // Obtener la sesión con su external_event_id
  const { data: session, error: sessionError } = await supabase
    .from('study_sessions')
    .select('id, title, description, start_time, end_time, external_event_id, plan_id')
    .eq('id', sessionId)
    .single();

  logger.info(`📋 Sesión obtenida: ${JSON.stringify({ 
    found: !!session, 
    title: session?.title,
    external_event_id: session?.external_event_id,
    error: sessionError?.message 
  })}`);

  if (!session) {
    logger.error('❌ Sesión no encontrada:', sessionError);
    return { success: false, message: 'Sesión no encontrada' };
  }

  // Obtener zona horaria del plan
  let timezone = 'America/Bogota';
  if (session.plan_id) {
    const { data: plan } = await supabase
      .from('study_plans')
      .select('timezone')
      .eq('id', session.plan_id)
      .single();
    timezone = plan?.timezone || 'America/Bogota';
  }

  // Obtener token de acceso
  const { accessToken, provider } = await getCalendarAccessToken(userId);
  
  logger.info(`🔑 Token obtenido: ${accessToken ? 'SÍ' : 'NO'}, provider: ${provider}`);

  if (!accessToken) {
    logger.warn('⚠️ No hay integración de calendario para este usuario');
    return { success: true, message: 'Sin calendario conectado' };
  }

  if (provider !== 'google') {
    logger.warn(`⚠️ Proveedor ${provider} no soportado aún`);
    return { success: false, message: 'Proveedor de calendario no soportado' };
  }

  // Si la sesión tiene external_event_id, actualizar o eliminar
  if (session.external_event_id) {
    logger.info(`📅 Sesión tiene external_event_id: ${session.external_event_id}`);
    
    if (action === 'delete') {
      const success = await deleteGoogleCalendarEvent(accessToken, session.external_event_id);
      return { success, message: success ? 'Evento eliminado del calendario' : 'Error eliminando del calendario' };
    } else if (action === 'update' && newData) {
      const success = await updateGoogleCalendarEvent(
        accessToken,
        session.external_event_id,
        {
          title: session.title,
          description: session.description || '',
          start_time: newData.start_time,
          end_time: newData.end_time,
        },
        timezone
      );
      return { success, message: success ? 'Calendario actualizado' : 'Error actualizando calendario' };
    }
  } else {
    // La sesión NO tiene external_event_id - crear nuevo evento si es una actualización
    logger.warn('⚠️ Sesión sin external_event_id - intentando crear evento en calendario');
    
    if (action === 'update' && newData) {
      // Crear nuevo evento con los nuevos datos
      const eventId = await createGoogleCalendarEvent(
        accessToken,
        {
          title: session.title,
          description: session.description || '',
          start_time: newData.start_time,
          end_time: newData.end_time,
        },
        timezone
      );
      
      if (eventId) {
        // Guardar el external_event_id en la sesión
        const { error: updateError } = await supabase
          .from('study_sessions')
          .update({
            external_event_id: eventId,
            calendar_provider: 'google',
          })
          .eq('id', sessionId);
        
        if (updateError) {
          logger.error('❌ Error guardando external_event_id:', updateError);
        } else {
          logger.info(`✅ external_event_id guardado en sesión: ${eventId}`);
        }
        
        return { success: true, message: 'Evento creado en calendario' };
      } else {
        return { success: false, message: 'Error creando evento en calendario' };
      }
    } else if (action === 'delete') {
      // No hay evento que eliminar
      logger.info('ℹ️ No hay evento externo que eliminar');
      return { success: true, message: 'Sin evento externo que eliminar' };
    }
  }

  return { success: false, message: 'Acción no procesada' };
}

// ============================================================================
// Función para ejecutar acciones
// ============================================================================

async function executeAction(
  userId: string, 
  planId: string, 
  action: ActionResult
): Promise<ActionResult> {
  const supabase = createAdminClient();

  switch (action.type) {
    case 'move_session': {
      const { sessionId, newStartTime, newEndTime } = action.data;
      
      logger.info(`📅 Moviendo sesión ${sessionId} a ${newStartTime} - ${newEndTime}`);
      
      // Primero sincronizar con el calendario externo (antes de actualizar BD)
      const calendarSync = await syncSessionWithCalendar(userId, sessionId, 'update', {
        start_time: newStartTime,
        end_time: newEndTime,
      });
      
      logger.info(`📅 Resultado sincronización calendario: ${JSON.stringify(calendarSync)}`);
      
      const { error } = await supabase
        .from('study_sessions')
        .update({
          start_time: newStartTime,
          end_time: newEndTime,
          was_rescheduled: true,
          rescheduled_from: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        return { ...action, status: 'error', message: `Error al mover la sesión: ${error.message}` };
      }
      
      const calendarMsg = calendarSync.success ? ' y actualizada en tu calendario' : '';
      return { ...action, status: 'success', message: `✅ Sesión movida correctamente${calendarMsg}` };
    }

    case 'delete_session': {
      const { sessionId } = action.data;
      
      // Primero sincronizar con el calendario externo (antes de eliminar de BD)
      const calendarSync = await syncSessionWithCalendar(userId, sessionId, 'delete');
      
      const { error } = await supabase
        .from('study_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        return { ...action, status: 'error', message: `Error al eliminar la sesión: ${error.message}` };
      }
      
      const calendarMsg = calendarSync.success ? ' y eliminada de tu calendario' : '';
      return { ...action, status: 'success', message: `✅ Sesión eliminada correctamente${calendarMsg}` };
    }

    case 'resize_session': {
      const { sessionId, newDurationMinutes } = action.data;
      
      // Obtener sesión actual
      const { data: session } = await supabase
        .from('study_sessions')
        .select('start_time')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (!session) {
        return { ...action, status: 'error', message: 'Sesión no encontrada' };
      }

      // Calcular nuevo end_time
      const startTime = new Date(session.start_time);
      const newEndTime = new Date(startTime.getTime() + newDurationMinutes * 60 * 1000);
      
      // Sincronizar con calendario
      const calendarSync = await syncSessionWithCalendar(userId, sessionId, 'update', {
        start_time: session.start_time,
        end_time: newEndTime.toISOString(),
      });

      const { error } = await supabase
        .from('study_sessions')
        .update({
          end_time: newEndTime.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        return { ...action, status: 'error', message: `Error al ajustar duración: ${error.message}` };
      }
      
      const calendarMsg = calendarSync.success ? ' y actualizada en tu calendario' : '';
      return { ...action, status: 'success', message: `✅ Duración ajustada a ${newDurationMinutes} minutos${calendarMsg}` };
    }

    case 'create_session': {
      const { title, startTime, endTime, courseId, lessonId, description } = action.data;
      
      const { error } = await supabase
        .from('study_sessions')
        .insert({
          plan_id: planId,
          user_id: userId,
          title,
          description,
          start_time: startTime,
          end_time: endTime,
          course_id: courseId,
          lesson_id: lessonId,
          status: 'planned',
          is_ai_generated: false,
        });

      if (error) {
        return { ...action, status: 'error', message: `Error al crear sesión: ${error.message}` };
      }
      return { ...action, status: 'success', message: '✅ Nueva sesión creada correctamente' };
    }

    case 'update_session': {
      const { sessionId, ...updates } = action.data;
      
      const { error } = await supabase
        .from('study_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        return { ...action, status: 'error', message: `Error al actualizar sesión: ${error.message}` };
      }
      return { ...action, status: 'success', message: '✅ Sesión actualizada correctamente' };
    }

    // =========================================================================
    // ACCIONES DE CALENDARIO EXTERNO
    // =========================================================================
    
    case 'list_calendar_events': {
      const { startDate, endDate } = action.data || {};
      
      const { accessToken, provider } = await getCalendarAccessToken(userId);
      
      if (!accessToken || provider !== 'google') {
        return { 
          ...action, 
          status: 'error', 
          message: '❌ No tienes un calendario conectado. Ve a configuración para conectar tu Google Calendar.' 
        };
      }
      
      // Por defecto, mostrar eventos de hoy
      const start = startDate ? new Date(startDate) : new Date();
      start.setHours(0, 0, 0, 0);
      
      const end = endDate ? new Date(endDate) : new Date(start);
      end.setHours(23, 59, 59, 999);
      
      const events = await listGoogleCalendarEvents(accessToken, start, end, 'America/Bogota');
      
      if (events.length === 0) {
        return { 
          ...action, 
          status: 'success', 
          message: '📅 No tienes eventos programados para ese período.',
          data: { events: [] }
        };
      }
      
      // Formatear eventos para mostrar
      let eventsList = '📅 **Tus eventos:**\n\n';
      for (const event of events) {
        const typeIcon = event.isStudySession ? '📚' : '📌';
        const timeStr = event.isAllDay 
          ? 'Todo el día' 
          : `${formatTime(new Date(event.start))} - ${formatTime(new Date(event.end))}`;
        eventsList += `${typeIcon} **${event.title}** (${timeStr})\n`;
      }
      
      return { 
        ...action, 
        status: 'success', 
        message: eventsList,
        data: { events }
      };
    }

    case 'create_calendar_event': {
      const { title, startTime, endTime, description } = action.data;
      
      const { accessToken, provider } = await getCalendarAccessToken(userId);
      
      if (!accessToken || provider !== 'google') {
        return { 
          ...action, 
          status: 'error', 
          message: '❌ No tienes un calendario conectado.' 
        };
      }
      
      const eventId = await createGoogleCalendarEvent(
        accessToken,
        { title, start_time: startTime, end_time: endTime, description },
        'America/Bogota'
      );
      
      if (!eventId) {
        return { ...action, status: 'error', message: '❌ Error al crear el evento en el calendario.' };
      }
      
      return { 
        ...action, 
        status: 'success', 
        message: `✅ Evento "${title}" creado en tu calendario.`,
        data: { eventId }
      };
    }

    case 'move_calendar_event': {
      const { eventId, newStartTime, newEndTime } = action.data;
      
      const { accessToken, provider } = await getCalendarAccessToken(userId);
      
      if (!accessToken || provider !== 'google') {
        return { ...action, status: 'error', message: '❌ No tienes un calendario conectado.' };
      }
      
      const success = await moveGoogleCalendarEvent(
        accessToken,
        eventId,
        newStartTime,
        newEndTime,
        'America/Bogota'
      );
      
      if (!success) {
        return { ...action, status: 'error', message: '❌ Error al mover el evento.' };
      }
      
      return { ...action, status: 'success', message: '✅ Evento movido correctamente en tu calendario.' };
    }

    case 'delete_calendar_event': {
      const { eventId } = action.data;
      
      const { accessToken, provider } = await getCalendarAccessToken(userId);
      
      if (!accessToken || provider !== 'google') {
        return { ...action, status: 'error', message: '❌ No tienes un calendario conectado.' };
      }
      
      const success = await deleteGoogleCalendarEvent(accessToken, eventId);
      
      if (!success) {
        return { ...action, status: 'error', message: '❌ Error al eliminar el evento.' };
      }
      
      return { ...action, status: 'success', message: '✅ Evento eliminado de tu calendario.' };
    }

    default:
      return { ...action, status: 'error', message: 'Acción no reconocida' };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, response: '', error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body: ChatRequest = await request.json();
    const { message, conversationHistory, activePlanId } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, response: '', error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    // Obtener contexto del plan
    const planContext = await getPlanContext(user.id, activePlanId);

    // Preparar historial de conversación
    const historyText = conversationHistory
      ?.slice(-8)
      .map(m => `${m.role === 'user' ? 'Usuario' : 'LIA'}: ${m.content}`)
      .join('\n') || '';

    // Obtener fecha y hora actual formateada
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota', // Zona horaria de Colombia
    };
    const currentDateTime = now.toLocaleDateString('es-CO', options);

    // Construir prompt del sistema
    const systemPrompt = SYSTEM_PROMPT
      .replace('{{CURRENT_DATE_TIME}}', `Hoy es ${currentDateTime} (hora de Colombia).`)
      .replace('{{PLAN_CONTEXT}}', planContext)
      .replace('{{CONVERSATION_HISTORY}}', historyText);

    // Llamar a OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const liaResponse = completion.choices[0]?.message?.content || 'Lo siento, no pude procesar tu solicitud.';

    // Extraer acción si existe
    const { action, cleanResponse } = extractAction(liaResponse);

    // Si hay una acción y no necesita confirmación, ejecutarla
    let executedAction: ActionResult | undefined;
    if (action && action.status === 'pending' && activePlanId) {
      executedAction = await executeAction(user.id, activePlanId, action);
    } else if (action) {
      executedAction = action;
    }

    return NextResponse.json({
      success: true,
      response: cleanResponse,
      action: executedAction,
    });

  } catch (error) {
    logger.error('Error en chat del dashboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        response: '', 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
