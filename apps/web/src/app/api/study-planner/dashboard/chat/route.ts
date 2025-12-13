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
  // Acciones proactivas de optimización
  | 'rebalance_plan'        // Redistribuir sesiones cuando el plan está atrasado
  | 'create_micro_session'  // Crear sesión corta de 15-30 min para ventanas libres
  | 'reduce_session_load'   // Reducir carga de días sobrecargados
  | 'recover_missed_session' // Reprogramar una sesión perdida
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
const SYSTEM_PROMPT = `Eres LIA, la asistente de inteligencia artificial del Planificador de Estudios. Tu rol es ayudar al usuario a gestionar su plan de estudios de forma conversacional y MUY PROACTIVA.

## FECHA Y HORA ACTUAL
{{CURRENT_DATE_TIME}}

## TU PERSONALIDAD Y COMPORTAMIENTO PROACTIVO
- Eres amigable, motivadora y MUY PROACTIVA
- Usas emojis para hacer la conversación más cálida
- Siempre confirmas antes de ejecutar acciones destructivas (eliminar)
- Celebras los logros del usuario
- **SIEMPRE** te basas en el CONTEXTO ACTUAL para responder, NUNCA en información de mensajes anteriores
- Si detectas que algo cambió (sesiones eliminadas, plan vacío), pregunta proactivamente por qué
- Ofreces alternativas y sugerencias sin que te las pidan
- **ANTICIPAS PROBLEMAS** antes de que el usuario los mencione

## ⚠️ REGLA CRÍTICA: FUENTE DE VERDAD
**EL CONTEXTO ACTUAL ({{PLAN_CONTEXT}}) ES LA ÚNICA FUENTE DE VERDAD.**
- Si el CONTEXTO ACTUAL dice "No hay sesiones programadas", entonces NO HAY SESIONES. Punto.
- NUNCA uses información del historial de conversación para listar sesiones.
- Si el usuario pregunta por sus lecciones/sesiones, SOLO reporta lo que está en el CONTEXTO ACTUAL.
- Si el CONTEXTO ACTUAL está vacío pero el historial menciona sesiones, significa que FUERON ELIMINADAS.

## 🧠 INTELIGENCIA PROACTIVA - COMPORTAMIENTO PRIORITARIO
**SIEMPRE que entres a una conversación, revisa la sección "🧠 ANÁLISIS PROACTIVO DE TU PLAN" y actúa:**

### 1. CONFLICTOS DE HORARIO (PRIORIDAD MÁXIMA)
Si hay conflictos detectados, INMEDIATAMENTE:
- Informa al usuario sobre el conflicto específico
- Ofrece 2-3 alternativas de horario
- Pregunta cuál prefiere
- Ejemplo: "⚠️ ¡Hola! Acabo de notar que tu sesión de 'Introducción a Python' de las 3pm CONFLICTA con tu 'Reunión con equipo'. Te sugiero moverla a: 
  1. 10:00 - 11:00
  2. 18:00 - 19:00
  3. 20:00 - 21:00
  ¿Cuál te viene mejor?"

### 2. REBALANCEO DEL PLAN
Si el progreso semanal está "Atrasado":
- Calcula cuánto falta para cumplir el objetivo
- Sugiere redistribuir sesiones
- Ofrece agregar micro-sesiones
- Ejemplo: "📊 Veo que esta semana planeaste 5 horas de estudio pero solo has completado 2h. Quedan 3 días hábiles. ¿Quieres que agregue 2 sesiones extras de 30 minutos cada una?"

### 3. OPTIMIZACIÓN POR ENERGÍA/TIEMPO
Cuando el usuario tenga sesiones largas en horarios difíciles:
- Sugiere mover temas pesados a horarios de alta energía (mañana)
- Sugiere sesiones cortas para horarios después del trabajo
- Ejemplo: "💡 Tienes 'Cálculo Avanzado' programado para las 9pm. Los temas complejos funcionan mejor por la mañana. ¿Quieres que lo mueva a las 7am y ponga algo más ligero en la noche?"

### 4. RECORDATORIOS Y MICRO-SESIONES
Si detectas huecos libres cortos (15-45 min):
- Sugiere micro-sesiones de repaso
- Ofrece tareas rápidas (flashcards, lectura)
- Ejemplo: "✨ Veo que tienes 30 minutos libres entre tu reunión de las 12:00 y tu almuerzo. ¿Quieres que agregue una micro-sesión de repaso rápido?"

### 5. RECUPERACIÓN AUTOMÁTICA
Si hay sesiones con status "missed":
- Identifica cuáles fueron perdidas
- Sugiere horarios de recuperación
- Ejemplo: "📌 Veo que perdiste la sesión de 'React Hooks' del martes. ¿Quieres que la programe para mañana a las 6pm o prefieres otro horario?"

### 6. ALERTAS DE SOBRECARGA/BURNOUT
Si hay días sobrecargados o riesgo de burnout:
- Alerta al usuario inmediatamente
- Sugiere reducir carga o tomar descanso
- Ejemplo: "🔴 ¡Alerta! Llevas 4 días seguidos con más de 10 horas de actividad. Tu bienestar es importante. ¿Qué tal si movemos las sesiones del viernes para darte un respiro?"

### 7. CONSISTENCIA Y HÁBITOS
Si hay muchos días sin estudiar:
- Motiva de forma empática (no regañes)
- Sugiere retomar con algo pequeño
- Ejemplo: "👋 ¡Hey! Han pasado 5 días desde tu última sesión de estudio. No pasa nada, ¡todos tenemos semanas complicadas! ¿Qué tal si empezamos suave con solo 15 minutitos hoy?"

### 8. PREPARACIÓN PREVIA
Si hay una sesión próxima (hoy o mañana):
- Menciona qué tema verán
- Sugiere preparar material
- Ejemplo: "📚 Mañana tienes 'Estructuras de Datos' a las 10am. ¿Ya tienes listo el material? Te sugiero revisar los ejercicios del capítulo 3."

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

### ACCIONES PROACTIVAS DE OPTIMIZACIÓN
Estas acciones te permiten optimizar el plan del usuario de forma inteligente:

11. **CREATE_MICRO_SESSION** - Crear micro-sesión de 15-30 minutos
    - Usar cuando detectes ventanas libres cortas en el calendario
    - Necesitas: title, startTime, endTime (máximo 30 min), type ('repaso', 'lectura', 'flashcards')
    - Ejemplo: "Tienes 25 min libres, ¿agrego una micro-sesión de repaso?"

12. **RECOVER_MISSED_SESSION** - Reprogramar sesión perdida
    - Usar cuando hay sesiones con status 'missed'
    - Necesitas: sessionId, newStartTime, newEndTime
    - Ofrece 2-3 horarios alternativos antes de ejecutar

13. **REBALANCE_PLAN** - Redistribuir sesiones de la semana
    - Usar cuando el progreso semanal está atrasado
    - Necesitas: sessionsToMove (array de {sessionId, newStartTime, newEndTime})
    - Siempre pide confirmación antes de mover múltiples sesiones

14. **REDUCE_SESSION_LOAD** - Reducir carga de días sobrecargados
    - Usar cuando un día tiene más de 8 horas de actividad
    - Necesitas: date, sessionsToReduce (array de {sessionId, action: 'move' | 'resize' | 'delete'})
    - Sugiere mover a otros días o reducir duración

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
5. **USA SOLO EL CONTEXTO ACTUAL** para identificar sesiones, NUNCA el historial
6. Si no hay plan activo o está vacío, sé proactiva y ofrece ayuda
7. Si el usuario dice que algo "es falso", verifica el CONTEXTO ACTUAL y disculparte si te equivocaste
8. **SIEMPRE REVISA EL ANÁLISIS PROACTIVO** y menciona los problemas detectados
9. Si el mensaje comienza con [INICIO_PROACTIVO], significa que el usuario acaba de abrir el dashboard. En este caso:
   - Da la bienvenida brevemente
   - INMEDIATAMENTE menciona cualquier conflicto, alerta o problema detectado en el análisis proactivo
   - Si todo está bien, menciona qué sesión tiene próximamente
   - NO repitas toda la lista de capacidades, sé conciso y útil

## CONTEXTO ACTUAL (FUENTE DE VERDAD - SIEMPRE USAR ESTO)
{{PLAN_CONTEXT}}

## HISTORIAL DE CONVERSACIÓN (SOLO PARA CONTEXTO DE LA CHARLA, NO PARA DATOS)
{{CONVERSATION_HISTORY}}
`;

// ============================================================================
// Función de sincronización bidireccional con calendario
// ============================================================================

interface SyncResult {
  deletedFromDb: string[];
  orphanedSessions: string[];
  message: string;
}

/**
 * Sincroniza las sesiones de la BD con el calendario de Google.
 * Compara las sesiones de estudio en la BD contra los eventos del calendario:
 * 1. Si una sesión tiene external_event_id y el evento no existe → eliminar de BD
 * 2. Si una sesión NO tiene external_event_id, buscar por título/hora en el calendario
 *    - Si no se encuentra en el calendario → eliminar de BD (fue eliminada externamente)
 */
async function syncSessionsWithCalendar(
  userId: string, 
  planId: string,
  accessToken: string,
  calendarEvents: CalendarEvent[] // Eventos del calendario ya obtenidos
): Promise<SyncResult> {
  const supabase = createAdminClient();
  const result: SyncResult = {
    deletedFromDb: [],
    orphanedSessions: [],
    message: ''
  };
  
  logger.info('🔄 Iniciando sincronización bidireccional con calendario...');
  
  // Obtener TODAS las sesiones de estudio del plan (próximas 2 semanas)
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  
  const { data: allSessions, error } = await supabase
    .from('study_sessions')
    .select('id, title, external_event_id, start_time, end_time')
    .eq('plan_id', planId)
    .gte('start_time', todayStart.toISOString())
    .lte('start_time', twoWeeksLater.toISOString());
  
  if (error || !allSessions || allSessions.length === 0) {
    logger.info('ℹ️ No hay sesiones de estudio para sincronizar');
    return result;
  }
  
  logger.info(`📋 Verificando ${allSessions.length} sesiones contra ${calendarEvents.length} eventos del calendario...`);
  
  // Crear un mapa de eventos del calendario para búsqueda rápida
  const calendarEventIds = new Set(calendarEvents.map(e => e.id));
  
  // Función para normalizar texto para comparación
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^\w\s]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  // Función para verificar si un evento del calendario coincide con una sesión
  const findMatchingCalendarEvent = (session: typeof allSessions[0]): CalendarEvent | undefined => {
    // 1. Primero buscar por external_event_id (match exacto)
    if (session.external_event_id && calendarEventIds.has(session.external_event_id)) {
      logger.info(`✅ Match por external_event_id: "${session.title}"`);
      return calendarEvents.find(e => e.id === session.external_event_id);
    }
    
    // 2. Si no tiene external_event_id, buscar por coincidencia de título y tiempo
    const sessionStart = new Date(session.start_time).getTime();
    const sessionEnd = new Date(session.end_time).getTime();
    const normalizedSessionTitle = normalizeText(session.title);
    
    // Extraer palabras clave del título de la sesión (primeras palabras significativas)
    const sessionKeywords = normalizedSessionTitle.split(' ').filter(w => w.length > 3).slice(0, 3);
    
    return calendarEvents.find(event => {
      const normalizedEventTitle = normalizeText(event.title);
      
      // Verificar coincidencia de título (más flexible)
      // Opción 1: El título de la sesión contiene parte del evento o viceversa
      const directMatch = normalizedEventTitle.includes(normalizedSessionTitle.substring(0, 15)) ||
                         normalizedSessionTitle.includes(normalizedEventTitle.substring(0, 15));
      
      // Opción 2: Comparten palabras clave
      const keywordMatch = sessionKeywords.length > 0 && 
                          sessionKeywords.some(kw => normalizedEventTitle.includes(kw));
      
      // Opción 3: Ambos son sesiones de estudio/lección
      const bothStudySessions = event.isStudySession && 
                               (session.title.toLowerCase().includes('lección') || 
                                session.title.toLowerCase().includes('leccion'));
      
      const titleMatch = directMatch || keywordMatch || bothStudySessions;
      
      // Verificar coincidencia de tiempo (más flexible: dentro de 15 minutos)
      const eventStart = new Date(event.start).getTime();
      const eventEnd = new Date(event.end).getTime();
      const timeMatch = Math.abs(sessionStart - eventStart) < 15 * 60 * 1000 && 
                       Math.abs(sessionEnd - eventEnd) < 15 * 60 * 1000;
      
      // Alternativa: mismo día y hora de inicio similar (dentro de 30 min)
      const sameDayMatch = new Date(session.start_time).toDateString() === new Date(event.start).toDateString() &&
                          Math.abs(sessionStart - eventStart) < 30 * 60 * 1000;
      
      if ((titleMatch && timeMatch) || (titleMatch && sameDayMatch)) {
        logger.info(`✅ Match encontrado para "${session.title}" con evento "${event.title}"`);
        return true;
      }
      
      return false;
    });
  };
  
  // IMPORTANTE: Solo eliminar sesiones que tienen external_event_id y ese evento ya no existe
  // Las sesiones sin external_event_id las dejamos intactas (pueden no haberse sincronizado aún)
  for (const session of allSessions) {
    // Si tiene external_event_id, verificar que el evento exista
    if (session.external_event_id) {
      if (!calendarEventIds.has(session.external_event_id)) {
        // El evento fue eliminado del calendario - eliminar de la BD
        logger.warn(`⚠️ Evento "${session.title}" (ID: ${session.external_event_id}) no existe en calendario - eliminando de BD`);
        
        const { error: deleteError } = await supabase
          .from('study_sessions')
          .delete()
          .eq('id', session.id);
        
        if (!deleteError) {
          result.deletedFromDb.push(session.title);
          logger.info(`✅ Sesión "${session.title}" eliminada de la BD`);
        } else {
          logger.error(`❌ Error eliminando sesión: ${deleteError.message}`);
        }
      } else {
        logger.info(`✅ Sesión "${session.title}" verificada (external_event_id existe)`);
      }
    } else {
      // No tiene external_event_id - intentar encontrar un match y vincularlo
      const matchingEvent = findMatchingCalendarEvent(session);
      
      if (matchingEvent) {
        // Vincular el external_event_id
        await supabase
          .from('study_sessions')
          .update({ external_event_id: matchingEvent.id })
          .eq('id', session.id);
        logger.info(`📝 Vinculado external_event_id "${matchingEvent.id}" a sesión "${session.title}"`);
      } else {
        // No encontramos match, pero NO eliminamos - puede que el calendario no esté sincronizado
        logger.info(`⚠️ Sesión "${session.title}" sin match en calendario - se mantiene (sin external_event_id)`);
      }
    }
  }
  
  if (result.deletedFromDb.length > 0) {
    result.message = `Se detectó que eliminaste ${result.deletedFromDb.length} sesión(es) de tu calendario: ${result.deletedFromDb.join(', ')}. Las he eliminado también del sistema.`;
    logger.info(`🔄 Sincronización completada: ${result.deletedFromDb.length} sesiones eliminadas`);
  } else {
    logger.info('🔄 Sincronización completada: todas las sesiones están sincronizadas');
  }
  
  return result;
}

// ============================================================================
// Análisis Proactivo del Calendario y Plan de Estudios
// ============================================================================

interface ProactiveAnalysis {
  conflicts: Array<{
    sessionTitle: string;
    sessionId: string;
    sessionDate: string; // Fecha de la sesión (ej: "miércoles 17 de diciembre de 2025")
    sessionTime: string; // Solo hora (ej: "19:20 - 20:40")
    conflictingEvent: string;
    conflictTime: string;
    suggestedAlternatives: string[];
  }>;
  overloadedDays: Array<{
    date: string;
    totalHours: number;
    events: string[];
    suggestion: string;
  }>;
  missedSessions: Array<{
    sessionTitle: string;
    sessionId: string;
    originalTime: string;
    suggestedRecoverySlots: string[];
  }>;
  freeSlots: Array<{
    date: string;
    startTime: string;
    endTime: string;
    duration: number;
    suggestion: string;
  }>;
  weeklyProgress: {
    plannedMinutes: number;
    completedMinutes: number;
    remainingMinutes: number;
    onTrack: boolean;
    suggestion: string;
  };
  consistencyAlert: {
    daysWithoutStudy: number;
    lastStudyDate: string | null;
    suggestion: string;
  } | null;
  burnoutRisk: {
    level: 'low' | 'medium' | 'high';
    consecutiveHeavyDays: number;
    suggestion: string;
  } | null;
  patterns: {
    frequentRescheduleTime: string | null;
    preferredStudyTime: string | null;
    suggestion: string | null;
  };
}

/**
 * Realiza un análisis proactivo del calendario y plan de estudios
 */
async function analyzeProactively(
  userId: string,
  planId: string,
  sessions: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    status: string;
    duration_minutes: number | null;
  }>,
  calendarEvents: CalendarEvent[],
  timezone: string
): Promise<ProactiveAnalysis> {
  const analysis: ProactiveAnalysis = {
    conflicts: [],
    overloadedDays: [],
    missedSessions: [],
    freeSlots: [],
    weeklyProgress: {
      plannedMinutes: 0,
      completedMinutes: 0,
      remainingMinutes: 0,
      onTrack: true,
      suggestion: ''
    },
    consistencyAlert: null,
    burnoutRisk: null,
    patterns: {
      frequentRescheduleTime: null,
      preferredStudyTime: null,
      suggestion: null
    }
  };

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  logger.info(`🔍 Iniciando análisis proactivo para ${sessions.length} sesiones y ${calendarEvents.length} eventos`);

  // 1. DETECTAR CONFLICTOS: Sesiones que se empalman con eventos externos
  for (const session of sessions) {
    const sessionStart = new Date(session.start_time).getTime();
    const sessionEnd = new Date(session.end_time).getTime();
    
    // Solo analizar sesiones futuras
    if (sessionStart < now.getTime()) continue;

    for (const event of calendarEvents) {
      // Ignorar si es la misma sesión de estudio
      if (event.isStudySession) continue;
      
      const eventStart = new Date(event.start).getTime();
      const eventEnd = new Date(event.end).getTime();
      
      // Verificar si hay solapamiento
      const hasOverlap = (sessionStart < eventEnd) && (sessionEnd > eventStart);
      
      if (hasOverlap) {
        // Encontrar horarios alternativos (buscar huecos en el mismo día)
        const sessionDate = new Date(session.start_time);
        sessionDate.setHours(0, 0, 0, 0);
        
        const alternatives = findAlternativeSlots(
          sessionDate,
          session.duration_minutes || 60,
          calendarEvents,
          sessions
        );
        
        analysis.conflicts.push({
          sessionTitle: session.title,
          sessionId: session.id,
          sessionDate: formatDate(new Date(session.start_time)), // Fecha completa con día de la semana
          sessionTime: `${formatTime(new Date(session.start_time))} - ${formatTime(new Date(session.end_time))}`,
          conflictingEvent: event.title,
          conflictTime: `${formatTime(new Date(event.start))} - ${formatTime(new Date(event.end))}`,
          suggestedAlternatives: alternatives.slice(0, 3)
        });
        break; // Solo reportar el primer conflicto por sesión
      }
    }
  }

  // 2. DETECTAR DÍAS SOBRECARGADOS
  const dayLoadMap = new Map<string, { totalMinutes: number; events: string[] }>();
  
  // Contar eventos externos
  for (const event of calendarEvents) {
    if (event.isAllDay) continue;
    
    const eventDate = new Date(event.start);
    eventDate.setHours(0, 0, 0, 0);
    const dateKey = eventDate.toISOString().split('T')[0];
    
    const duration = (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60);
    
    const existing = dayLoadMap.get(dateKey) || { totalMinutes: 0, events: [] };
    existing.totalMinutes += duration;
    existing.events.push(event.title);
    dayLoadMap.set(dateKey, existing);
  }
  
  // Contar sesiones de estudio
  for (const session of sessions) {
    const sessionDate = new Date(session.start_time);
    sessionDate.setHours(0, 0, 0, 0);
    const dateKey = sessionDate.toISOString().split('T')[0];
    
    const duration = session.duration_minutes || 60;
    
    const existing = dayLoadMap.get(dateKey) || { totalMinutes: 0, events: [] };
    existing.totalMinutes += duration;
    existing.events.push(`📚 ${session.title}`);
    dayLoadMap.set(dateKey, existing);
  }
  
  // Identificar días con más de 8 horas de actividad
  let consecutiveHeavyDays = 0;
  for (const [dateKey, load] of dayLoadMap) {
    const hours = load.totalMinutes / 60;
    if (hours > 8) {
      analysis.overloadedDays.push({
        date: dateKey,
        totalHours: Math.round(hours * 10) / 10,
        events: load.events,
        suggestion: hours > 10 
          ? 'Día muy saturado. Considera mover alguna sesión de estudio o reducir su duración.'
          : 'Día cargado. Asegúrate de tener descansos entre actividades.'
      });
      consecutiveHeavyDays++;
    } else {
      consecutiveHeavyDays = 0;
    }
  }
  
  // Alerta de burnout
  if (consecutiveHeavyDays >= 3) {
    analysis.burnoutRisk = {
      level: consecutiveHeavyDays >= 5 ? 'high' : 'medium',
      consecutiveHeavyDays,
      suggestion: `Llevas ${consecutiveHeavyDays} días muy cargados seguidos. Considera tomarte un descanso o reducir la carga.`
    };
  }

  // 3. DETECTAR SESIONES PERDIDAS
  for (const session of sessions) {
    if (session.status === 'missed') {
      const sessionDate = new Date(session.start_time);
      const recoverySlots = findAlternativeSlots(
        new Date(),
        session.duration_minutes || 60,
        calendarEvents,
        sessions
      );
      
      analysis.missedSessions.push({
        sessionTitle: session.title,
        sessionId: session.id,
        originalTime: formatDateTime(sessionDate),
        suggestedRecoverySlots: recoverySlots.slice(0, 3)
      });
    }
  }

  // 4. DETECTAR HUECOS LIBRES (para sugerir micro-sesiones)
  const next7Days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(todayStart);
    date.setDate(date.getDate() + i);
    next7Days.push(date);
  }
  
  for (const day of next7Days) {
    const dayStart = new Date(day);
    dayStart.setHours(8, 0, 0, 0); // Empezar a las 8am
    
    const dayEnd = new Date(day);
    dayEnd.setHours(22, 0, 0, 0); // Terminar a las 10pm
    
    const dateKey = day.toISOString().split('T')[0];
    
    // Obtener eventos de ese día ordenados
    const dayEvents = [...calendarEvents, ...sessions.map(s => ({
      start: s.start_time,
      end: s.end_time,
      title: s.title
    }))]
      .filter(e => new Date(e.start).toISOString().split('T')[0] === dateKey)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    // Buscar huecos de al menos 15 minutos
    let lastEnd = dayStart.getTime();
    for (const event of dayEvents) {
      const eventStart = new Date(event.start).getTime();
      const gap = (eventStart - lastEnd) / (1000 * 60); // minutos
      
      if (gap >= 15 && gap <= 45) { // Huecos pequeños ideales para micro-sesiones
        analysis.freeSlots.push({
          date: dateKey,
          startTime: formatTime(new Date(lastEnd)),
          endTime: formatTime(new Date(eventStart)),
          duration: Math.round(gap),
          suggestion: gap < 20 
            ? 'Ideal para repasar flashcards o hacer una lectura rápida.'
            : 'Puedes hacer una micro-sesión de estudio enfocado.'
        });
      }
      
      lastEnd = Math.max(lastEnd, new Date(event.end).getTime());
    }
  }

  // 5. CALCULAR PROGRESO SEMANAL
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Inicio de semana (domingo)
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  for (const session of sessions) {
    const sessionDate = new Date(session.start_time);
    if (sessionDate >= weekStart && sessionDate < weekEnd) {
      analysis.weeklyProgress.plannedMinutes += session.duration_minutes || 60;
      if (session.status === 'completed') {
        analysis.weeklyProgress.completedMinutes += session.duration_minutes || 60;
      } else if (sessionDate < now) {
        // Sesión pasada no completada
        analysis.weeklyProgress.remainingMinutes += session.duration_minutes || 60;
      }
    }
  }
  
  const completionRate = analysis.weeklyProgress.plannedMinutes > 0 
    ? analysis.weeklyProgress.completedMinutes / analysis.weeklyProgress.plannedMinutes 
    : 0;
  
  analysis.weeklyProgress.onTrack = completionRate >= 0.7;
  
  if (!analysis.weeklyProgress.onTrack && analysis.weeklyProgress.remainingMinutes > 0) {
    analysis.weeklyProgress.suggestion = `Vas atrasado esta semana. Te faltan ${Math.round(analysis.weeklyProgress.remainingMinutes / 60)} horas de estudio. ¿Quieres que redistribuya las sesiones restantes?`;
  }

  // 6. ALERTA DE CONSISTENCIA (días sin estudiar)
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );
  
  const lastCompletedSession = sortedSessions.find(s => s.status === 'completed');
  if (lastCompletedSession) {
    const lastStudyDate = new Date(lastCompletedSession.start_time);
    const daysSinceStudy = Math.floor((now.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceStudy >= 3) {
      analysis.consistencyAlert = {
        daysWithoutStudy: daysSinceStudy,
        lastStudyDate: formatDate(lastStudyDate),
        suggestion: daysSinceStudy >= 7 
          ? `Llevas ${daysSinceStudy} días sin estudiar. ¿Te gustaría retomar con una sesión corta de 15-20 minutos?`
          : `Han pasado ${daysSinceStudy} días desde tu última sesión. ¡Es buen momento para retomar!`
      };
    }
  }

  logger.info(`🔍 Análisis completado: ${analysis.conflicts.length} conflictos, ${analysis.overloadedDays.length} días sobrecargados, ${analysis.missedSessions.length} sesiones perdidas`);

  return analysis;
}

/**
 * Encuentra horarios alternativos para una sesión
 */
function findAlternativeSlots(
  date: Date,
  durationMinutes: number,
  calendarEvents: CalendarEvent[],
  sessions: Array<{ start_time: string; end_time: string }>
): string[] {
  const alternatives: string[] = [];
  const dateKey = date.toISOString().split('T')[0];
  
  // Horarios preferidos para estudiar
  const preferredSlots = [
    { start: 7, end: 8 },   // Mañana temprano
    { start: 8, end: 9 },
    { start: 9, end: 10 },
    { start: 12, end: 13 }, // Mediodía
    { start: 18, end: 19 }, // Tarde
    { start: 19, end: 20 },
    { start: 20, end: 21 }, // Noche
    { start: 21, end: 22 },
  ];
  
  // Obtener todos los eventos del día
  const dayEvents = [
    ...calendarEvents.filter(e => new Date(e.start).toISOString().split('T')[0] === dateKey),
    ...sessions.filter(s => new Date(s.start_time).toISOString().split('T')[0] === dateKey)
      .map(s => ({ start: s.start_time, end: s.end_time }))
  ];
  
  for (const slot of preferredSlots) {
    const slotStart = new Date(date);
    slotStart.setHours(slot.start, 0, 0, 0);
    
    const slotEnd = new Date(date);
    slotEnd.setHours(slot.start + Math.ceil(durationMinutes / 60), 0, 0, 0);
    
    // Verificar si el slot está libre
    const isFree = !dayEvents.some(event => {
      const eventStart = new Date(event.start).getTime();
      const eventEnd = new Date(event.end).getTime();
      return (slotStart.getTime() < eventEnd) && (slotEnd.getTime() > eventStart);
    });
    
    if (isFree) {
      alternatives.push(`${formatTime(slotStart)} - ${formatTime(slotEnd)}`);
    }
    
    if (alternatives.length >= 3) break;
  }
  
  // Si no hay alternativas en el mismo día, buscar en los siguientes días
  if (alternatives.length === 0) {
    for (let i = 1; i <= 3; i++) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + i);
      const nextDateKey = nextDay.toISOString().split('T')[0];
      
      for (const slot of preferredSlots.slice(0, 3)) {
        const slotStart = new Date(nextDay);
        slotStart.setHours(slot.start, 0, 0, 0);
        
        alternatives.push(`${formatDate(slotStart)} a las ${formatTime(slotStart)}`);
        if (alternatives.length >= 3) break;
      }
      if (alternatives.length >= 3) break;
    }
  }
  
  return alternatives;
}

function formatDateTime(date: Date): string {
  return `${formatDate(date)} a las ${formatTime(date)}`;
}

// ============================================================================
// Función para obtener el contexto del plan y eventos del calendario
// ============================================================================

async function getPlanContext(userId: string, planId?: string): Promise<{ context: string; syncResult?: SyncResult }> {
  const supabase = createAdminClient();
  
  logger.info(`🔍 getPlanContext - userId: ${userId}, planId: ${planId || 'no especificado'}`);

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

  const { data: plan, error: planError } = await planQuery.single();
  
  logger.info(`📋 Plan obtenido: ${plan?.id || 'ninguno'}, error: ${planError?.message || 'ninguno'}`);
  
  const timezone = plan?.timezone || 'America/Bogota';

  // Obtener fechas para consultas
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);
  
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Obtener eventos del calendario
  let calendarEventsToday: CalendarEvent[] = [];
  let calendarEventsWeek: CalendarEvent[] = [];
  let calendarEventsTwoWeeks: CalendarEvent[] = [];
  let syncResult: SyncResult | undefined;
  
  const { accessToken, provider } = await getCalendarAccessToken(userId);
  
  logger.info(`🔑 Calendar token: ${accessToken ? 'SÍ' : 'NO'}, provider: ${provider}`);
  
  if (accessToken && provider === 'google') {
    // PRIMERO: Obtener eventos del calendario para las próximas 2 semanas
    logger.info(`📅 Consultando eventos de hoy: ${todayStart.toISOString()} - ${todayEnd.toISOString()}`);
    calendarEventsToday = await listGoogleCalendarEvents(accessToken, todayStart, todayEnd, timezone);
    logger.info(`📅 Eventos de hoy encontrados: ${calendarEventsToday.length}`);
    
    // Eventos de la semana (7 días)
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    calendarEventsWeek = await listGoogleCalendarEvents(accessToken, todayStart, weekEnd, timezone);
    logger.info(`📅 Eventos de la semana encontrados: ${calendarEventsWeek.length}`);
    
    // Eventos de 2 semanas (para sincronización)
    calendarEventsTwoWeeks = await listGoogleCalendarEvents(accessToken, todayStart, twoWeeksLater, timezone);
    logger.info(`📅 Eventos de 2 semanas encontrados: ${calendarEventsTwoWeeks.length}`);
    
    // AHORA: Sincronizar sesiones con el calendario (detectar eliminaciones)
    if (plan) {
      syncResult = await syncSessionsWithCalendar(userId, plan.id, accessToken, calendarEventsTwoWeeks);
    }
  } else {
    logger.warn(`⚠️ No se pudo obtener acceso al calendario`);
  }

  let context = '';
  
  // Si se detectaron eliminaciones, agregar alerta al contexto
  if (syncResult && syncResult.deletedFromDb.length > 0) {
    context += `## ⚠️ CAMBIOS DETECTADOS EN EL CALENDARIO
Se detectó que el usuario eliminó ${syncResult.deletedFromDb.length} sesión(es) directamente del calendario de Google:
${syncResult.deletedFromDb.map(s => `- "${s}"`).join('\n')}

**IMPORTANTE:** Estas sesiones han sido eliminadas automáticamente del sistema.
Debes mencionar esto al usuario de forma proactiva y preguntarle:
1. ¿Por qué decidió eliminar esas sesiones?
2. ¿Quiere reprogramarlas para otro horario?
3. ¿Necesita ajustar su plan de estudios?

`;
  }

  // Sección de calendario
  context += `## 📅 EVENTOS DEL CALENDARIO EXTERNO - HOY (Google Calendar)
`;
  
  if (calendarEventsToday.length > 0) {
    for (const event of calendarEventsToday) {
      const typeLabel = event.isStudySession ? '📚' : '📌';
      const timeStr = event.isAllDay ? 'Todo el día' : `${formatTime(new Date(event.start))} - ${formatTime(new Date(event.end))}`;
      context += `- ${typeLabel} **${event.title}** (${timeStr}) [ID: ${event.id}]
`;
    }
  } else {
    context += '⚠️ No hay eventos programados para hoy en Google Calendar.\n';
  }

  if (!plan) {
    context += '\n⚠️ El usuario NO tiene un plan de estudios activo.';
    return { context, syncResult: undefined };
  }

  // Obtener sesiones del plan - CONSULTA DIRECTA A LA BD (sin caché)
  logger.info(`📋 Consultando sesiones del plan ${plan.id} desde ${todayStart.toISOString()} hasta ${twoWeeksLater.toISOString()}`);
  
  const { data: sessions, error: sessionsError } = await supabase
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

  logger.info(`📋 Sesiones encontradas: ${sessions?.length || 0}, error: ${sessionsError?.message || 'ninguno'}`);
  
  if (sessions && sessions.length > 0) {
    logger.info(`📋 IDs de sesiones: ${sessions.map(s => s.id).join(', ')}`);
  }

  // Formatear contexto del plan
  context += `
## 📚 PLAN DE ESTUDIOS ACTIVO
- **Nombre:** ${plan.name}
- **Descripción:** ${plan.description || 'Sin descripción'}
- **Zona horaria:** ${plan.timezone}
- **Días preferidos:** ${formatPreferredDays(plan.preferred_days)}

## SESIONES DE ESTUDIO PRÓXIMAS (consulta en tiempo real a la BD)
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
    
    context += `
**TOTAL: ${sessions.length} sesiones de estudio programadas.**
`;
  } else {
    context += `
⚠️ **IMPORTANTE: NO HAY SESIONES DE ESTUDIO PROGRAMADAS.**
El usuario NO tiene ninguna sesión de estudio en los próximos 14 días.
Si el usuario pregunta por sus lecciones o sesiones, debes informarle que no tiene ninguna.
Sé proactiva y pregunta si quiere crear un nuevo plan o si eliminó las sesiones intencionalmente.
`;
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

  // =========================================================================
  // ANÁLISIS PROACTIVO - Inteligencia para detectar conflictos y oportunidades
  // =========================================================================
  if (sessions && sessions.length > 0 && calendarEventsTwoWeeks.length > 0) {
    const proactiveAnalysis = await analyzeProactively(
      userId,
      plan.id,
      sessions,
      calendarEventsTwoWeeks,
      timezone
    );

    // Agregar sección de análisis proactivo al contexto
    context += `

## 🧠 ANÁLISIS PROACTIVO DE TU PLAN
`;

    // 1. CONFLICTOS DETECTADOS
    if (proactiveAnalysis.conflicts.length > 0) {
      context += `
### ⚠️ CONFLICTOS DETECTADOS
Se han detectado **${proactiveAnalysis.conflicts.length} conflicto(s)** entre sesiones de estudio y otros eventos:
`;
      for (const conflict of proactiveAnalysis.conflicts) {
        context += `
- **${conflict.sessionTitle}** programada para el **${conflict.sessionDate}** de ${conflict.sessionTime}, CONFLICTA con "${conflict.conflictingEvent}" (${conflict.conflictTime})
  - Alternativas sugeridas: ${conflict.suggestedAlternatives.join(' | ') || 'No hay alternativas disponibles'}
`;
      }
      context += `
**ACCIÓN REQUERIDA:** Debes informar al usuario sobre estos conflictos CON LA FECHA CORRECTA y ofrecer reprogramar las sesiones.
`;
    }

    // 2. DÍAS SOBRECARGADOS
    if (proactiveAnalysis.overloadedDays.length > 0) {
      context += `
### 📊 DÍAS SOBRECARGADOS
`;
      for (const day of proactiveAnalysis.overloadedDays.slice(0, 3)) {
        context += `- **${day.date}**: ${day.totalHours}h de actividad - ${day.suggestion}
`;
      }
    }

    // 3. RIESGO DE BURNOUT
    if (proactiveAnalysis.burnoutRisk) {
      context += `
### 🔴 ALERTA DE SOBRECARGA
- Nivel: **${proactiveAnalysis.burnoutRisk.level.toUpperCase()}**
- ${proactiveAnalysis.burnoutRisk.suggestion}
**IMPORTANTE:** Sugiere al usuario tomar un descanso o reducir la carga de estudio.
`;
    }

    // 4. SESIONES PERDIDAS
    if (proactiveAnalysis.missedSessions.length > 0) {
      context += `
### 📌 SESIONES PERDIDAS QUE REQUIEREN RECUPERACIÓN
`;
      for (const missed of proactiveAnalysis.missedSessions) {
        context += `- **${missed.sessionTitle}** (original: ${missed.originalTime})
  - Horarios sugeridos para recuperar: ${missed.suggestedRecoverySlots.join(' | ') || 'Buscar horario libre'}
`;
      }
      context += `
**ACCIÓN:** Pregunta al usuario si quiere reprogramar estas sesiones perdidas.
`;
    }

    // 5. PROGRESO SEMANAL
    context += `
### 📈 PROGRESO SEMANAL
- Planificado: ${Math.round(proactiveAnalysis.weeklyProgress.plannedMinutes / 60)}h
- Completado: ${Math.round(proactiveAnalysis.weeklyProgress.completedMinutes / 60)}h
- Estado: ${proactiveAnalysis.weeklyProgress.onTrack ? '✅ En camino' : '⚠️ Atrasado'}
`;
    if (proactiveAnalysis.weeklyProgress.suggestion) {
      context += `- ${proactiveAnalysis.weeklyProgress.suggestion}
`;
    }

    // 6. ALERTA DE CONSISTENCIA
    if (proactiveAnalysis.consistencyAlert) {
      context += `
### ⏰ ALERTA DE CONSISTENCIA
- Días sin estudiar: **${proactiveAnalysis.consistencyAlert.daysWithoutStudy}**
- Última sesión: ${proactiveAnalysis.consistencyAlert.lastStudyDate}
- ${proactiveAnalysis.consistencyAlert.suggestion}
`;
    }

    // 7. HUECOS LIBRES PARA MICRO-SESIONES
    if (proactiveAnalysis.freeSlots.length > 0) {
      context += `
### 💡 VENTANAS LIBRES PARA MICRO-SESIONES
`;
      for (const slot of proactiveAnalysis.freeSlots.slice(0, 5)) {
        context += `- **${slot.date}** ${slot.startTime} - ${slot.endTime} (${slot.duration} min) - ${slot.suggestion}
`;
      }
    }

    context += `
---
**INSTRUCCIONES PARA LIA:** 
1. Si hay conflictos, PRIMERO menciónalos y ofrece soluciones con las alternativas sugeridas
2. Si hay días sobrecargados o riesgo de burnout, sugiere reducir la carga
3. Si hay sesiones perdidas, ofrece reprogramarlas
4. Si el progreso semanal está atrasado, ofrece rebalancear el plan
5. Si hay huecos libres, sugiere micro-sesiones de repaso
6. Siempre sé proactiva y empática con el usuario
`;
  }

  return { context, syncResult };
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

  logger.info(`🔑 getCalendarAccessToken - integración encontrada: ${!!integration}, access_token: ${integration?.access_token ? 'SÍ' : 'NO'}`);

  if (!integration || !integration.access_token) {
    logger.warn('⚠️ No hay integración de calendario o no hay access_token');
    return { accessToken: null, provider: null };
  }

  // Verificar si el token ha expirado
  const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
  const now = new Date();
  
  logger.info(`🔑 Token expira: ${expiresAt?.toISOString() || 'desconocido'}, ahora: ${now.toISOString()}`);
  
  if (expiresAt && expiresAt < now && integration.refresh_token) {
    logger.info('🔄 Token expirado, refrescando...');
    // Refrescar token
    const refreshed = await refreshAccessToken(integration);
    if (refreshed.success && refreshed.accessToken) {
      logger.info('✅ Token refrescado exitosamente');
      return { accessToken: refreshed.accessToken, provider: integration.provider };
    }
    logger.error('❌ Error refrescando token');
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
    
    logger.info(`📅 Respuesta de Google Calendar: ${data.items?.length || 0} items`);
    
    for (const item of data.items || []) {
      // Determinar si es un evento de todo el día
      const isAllDay = !!item.start?.date && !item.start?.dateTime;
      
      // Determinar si es una sesión de estudio (creada por nuestra app)
      const isStudySession = item.description?.includes('📚') || 
                            item.summary?.toLowerCase().includes('lección') ||
                            item.summary?.toLowerCase().includes('sesión de estudio');
      
      logger.info(`   - Evento: "${item.summary}" (${isStudySession ? 'sesión de estudio' : 'evento externo'})`);
      
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
    
    logger.info(`✅ Se obtuvieron ${events.length} eventos del calendario (${events.filter(e => e.isStudySession).length} sesiones, ${events.filter(e => !e.isStudySession).length} externos)`);
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

    // =========================================================================
    // ACCIONES PROACTIVAS DE OPTIMIZACIÓN
    // =========================================================================

    case 'create_micro_session': {
      const { title, startTime, endTime, type } = action.data;
      
      // Calcular duración para verificar que es una micro-sesión (máx 30 min)
      const start = new Date(startTime);
      const end = new Date(endTime);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      
      if (durationMinutes > 45) {
        return { 
          ...action, 
          status: 'error', 
          message: '❌ Las micro-sesiones deben ser de máximo 45 minutos.' 
        };
      }
      
      const sessionTitle = title || `📝 ${type || 'Micro-sesión de repaso'}`;
      
      // Crear la sesión en la BD
      const { data: session, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          plan_id: planId,
          title: sessionTitle,
          description: `Micro-sesión de ${type || 'repaso rápido'} (${durationMinutes} min)`,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: durationMinutes,
          status: 'planned',
        })
        .select()
        .single();
      
      if (error) {
        logger.error('Error creando micro-sesión:', error);
        return { ...action, status: 'error', message: '❌ Error al crear la micro-sesión.' };
      }
      
      // Crear evento en el calendario
      const { accessToken, provider } = await getCalendarAccessToken(userId);
      if (accessToken && provider === 'google') {
        const eventId = await createGoogleCalendarEvent(
          accessToken,
          { 
            title: sessionTitle, 
            start_time: startTime, 
            end_time: endTime, 
            description: session.description || '' 
          },
          'America/Bogota'
        );
        
        // Guardar el external_event_id
        if (eventId) {
          await supabase
            .from('study_sessions')
            .update({ external_event_id: eventId })
            .eq('id', session.id);
        }
      }
      
      return {
        ...action,
        status: 'success',
        message: `✅ Micro-sesión de ${durationMinutes} minutos creada: "${sessionTitle}"`,
        data: { sessionId: session.id }
      };
    }

    case 'recover_missed_session': {
      const { sessionId, newStartTime, newEndTime } = action.data;
      
      // Obtener la sesión original
      const { data: originalSession, error: getError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (getError || !originalSession) {
        return { ...action, status: 'error', message: '❌ Sesión no encontrada.' };
      }
      
      // Calcular nueva duración
      const start = new Date(newStartTime);
      const end = new Date(newEndTime);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      
      // Actualizar la sesión (cambiar fecha y estado)
      const { error: updateError } = await supabase
        .from('study_sessions')
        .update({
          start_time: newStartTime,
          end_time: newEndTime,
          duration_minutes: durationMinutes,
          status: 'planned', // Cambiar de 'missed' a 'planned'
        })
        .eq('id', sessionId);
      
      if (updateError) {
        logger.error('Error recuperando sesión:', updateError);
        return { ...action, status: 'error', message: '❌ Error al reprogramar la sesión.' };
      }
      
      // Sincronizar con calendario
      if (originalSession.external_event_id) {
        // Actualizar evento existente
        await syncSessionWithCalendar(userId, sessionId, 'update', { 
          start_time: newStartTime, 
          end_time: newEndTime 
        });
      } else {
        // Crear nuevo evento en el calendario
        const { accessToken, provider } = await getCalendarAccessToken(userId);
        if (accessToken && provider === 'google') {
          const eventId = await createGoogleCalendarEvent(
            accessToken,
            {
              title: originalSession.title,
              start_time: newStartTime,
              end_time: newEndTime,
              description: originalSession.description || ''
            },
            'America/Bogota'
          );
          
          if (eventId) {
            await supabase
              .from('study_sessions')
              .update({ external_event_id: eventId })
              .eq('id', sessionId);
          }
        }
      }
      
      return {
        ...action,
        status: 'success',
        message: `✅ Sesión "${originalSession.title}" reprogramada exitosamente.`,
        data: { sessionId }
      };
    }

    case 'rebalance_plan': {
      const { sessionsToMove } = action.data;
      
      if (!sessionsToMove || !Array.isArray(sessionsToMove) || sessionsToMove.length === 0) {
        return { ...action, status: 'error', message: '❌ No se especificaron sesiones para rebalancear.' };
      }
      
      const results: Array<{ sessionId: string; success: boolean }> = [];
      
      for (const sessionMove of sessionsToMove) {
        const { sessionId: moveSessionId, newStartTime, newEndTime } = sessionMove;
        
        const start = new Date(newStartTime);
        const end = new Date(newEndTime);
        const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        
        const { error } = await supabase
          .from('study_sessions')
          .update({
            start_time: newStartTime,
            end_time: newEndTime,
            duration_minutes: durationMinutes,
          })
          .eq('id', moveSessionId);
        
        if (!error) {
          results.push({ sessionId: moveSessionId, success: true });
          
          // Sincronizar con calendario
          await syncSessionWithCalendar(userId, moveSessionId, 'update', {
            start_time: newStartTime,
            end_time: newEndTime
          });
        } else {
          results.push({ sessionId: moveSessionId, success: false });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      return {
        ...action,
        status: successCount === sessionsToMove.length ? 'success' : 'error',
        message: `✅ Plan rebalanceado: ${successCount}/${sessionsToMove.length} sesiones movidas.`,
        data: { results }
      };
    }

    case 'reduce_session_load': {
      const { date, sessionsToReduce } = action.data;
      
      if (!sessionsToReduce || !Array.isArray(sessionsToReduce) || sessionsToReduce.length === 0) {
        return { ...action, status: 'error', message: '❌ No se especificaron sesiones para reducir.' };
      }
      
      const reduceResults: Array<{ sessionId: string; action: string; success: boolean }> = [];
      const { accessToken, provider } = await getCalendarAccessToken(userId);
      
      for (const sessionAction of sessionsToReduce) {
        const { sessionId: reduceSessionId, reduceAction, newData } = sessionAction;
        
        if (reduceAction === 'delete') {
          // Obtener la sesión para eliminar del calendario
          const { data: session } = await supabase
            .from('study_sessions')
            .select('external_event_id')
            .eq('id', reduceSessionId)
            .single();
          
          const { error } = await supabase
            .from('study_sessions')
            .delete()
            .eq('id', reduceSessionId);
          
          if (!error) {
            reduceResults.push({ sessionId: reduceSessionId, action: 'deleted', success: true });
            
            // Eliminar del calendario
            if (accessToken && provider === 'google' && session?.external_event_id) {
              await deleteGoogleCalendarEvent(accessToken, session.external_event_id);
            }
          } else {
            reduceResults.push({ sessionId: reduceSessionId, action: 'deleted', success: false });
          }
        } else if (reduceAction === 'resize' && newData?.durationMinutes) {
          const { data: session } = await supabase
            .from('study_sessions')
            .select('*')
            .eq('id', reduceSessionId)
            .single();
          
          if (session) {
            const startTime = new Date(session.start_time);
            const newEndTime = new Date(startTime.getTime() + newData.durationMinutes * 60 * 1000);
            
            const { error } = await supabase
              .from('study_sessions')
              .update({
                end_time: newEndTime.toISOString(),
                duration_minutes: newData.durationMinutes,
              })
              .eq('id', reduceSessionId);
            
            if (!error) {
              reduceResults.push({ sessionId: reduceSessionId, action: 'resized', success: true });
              
              await syncSessionWithCalendar(userId, reduceSessionId, 'update', {
                start_time: session.start_time,
                end_time: newEndTime.toISOString()
              });
            } else {
              reduceResults.push({ sessionId: reduceSessionId, action: 'resized', success: false });
            }
          }
        } else if (reduceAction === 'move' && newData?.startTime && newData?.endTime) {
          const start = new Date(newData.startTime);
          const end = new Date(newData.endTime);
          const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
          
          const { error } = await supabase
            .from('study_sessions')
            .update({
              start_time: newData.startTime,
              end_time: newData.endTime,
              duration_minutes: durationMinutes,
            })
            .eq('id', reduceSessionId);
          
          if (!error) {
            reduceResults.push({ sessionId: reduceSessionId, action: 'moved', success: true });
            
            await syncSessionWithCalendar(userId, reduceSessionId, 'update', {
              start_time: newData.startTime,
              end_time: newData.endTime
            });
          } else {
            reduceResults.push({ sessionId: reduceSessionId, action: 'moved', success: false });
          }
        }
      }
      
      const reduceSuccessCount = reduceResults.filter(r => r.success).length;
      
      return {
        ...action,
        status: reduceSuccessCount > 0 ? 'success' : 'error',
        message: `✅ Carga del ${date} reducida: ${reduceSuccessCount}/${sessionsToReduce.length} cambios aplicados.`,
        data: { results: reduceResults }
      };
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

    // Obtener contexto del plan (incluye sincronización con calendario)
    const { context: planContext, syncResult } = await getPlanContext(user.id, activePlanId);

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
