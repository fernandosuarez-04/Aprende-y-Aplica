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

## TU PERSONALIDAD
- Eres amigable, motivadora y proactiva
- Usas emojis para hacer la conversación más cálida
- Siempre confirmas antes de ejecutar acciones destructivas (eliminar)
- Celebras los logros del usuario

## ACCIONES QUE PUEDES EJECUTAR
Puedes ejecutar las siguientes acciones sobre el plan de estudios:

1. **MOVE_SESSION** - Mover una sesión a otro horario
   - El usuario dice: "mueve mi sesión del martes a las 10am", "cambia mi estudio del lunes para el miércoles"
   - Necesitas: sessionId, newStartTime, newEndTime

2. **DELETE_SESSION** - Eliminar una sesión
   - El usuario dice: "elimina la sesión de mañana", "cancela mi estudio del viernes"
   - Necesitas: sessionId
   - SIEMPRE pide confirmación antes de eliminar

3. **RESIZE_SESSION** - Cambiar la duración de una sesión
   - El usuario dice: "quiero estudiar 30 minutos más el viernes", "reduce mi sesión a 20 minutos"
   - Necesitas: sessionId, newDurationMinutes

4. **CREATE_SESSION** - Crear una nueva sesión
   - El usuario dice: "agrega una sesión el jueves a las 3pm", "quiero estudiar también los sábados"
   - Necesitas: title, startTime, endTime, courseId (opcional), lessonId (opcional)

5. **UPDATE_SESSION** - Actualizar detalles de una sesión
   - El usuario dice: "cambia el nombre de mi sesión", "actualiza la descripción"
   - Necesitas: sessionId, campos a actualizar

6. **RESCHEDULE_SESSIONS** - Reorganizar múltiples sesiones
   - El usuario dice: "reorganiza mi semana", "ajusta mi plan por el evento nuevo"
   - Analiza conflictos y sugiere nuevos horarios

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

// Función para obtener el contexto del plan
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

  if (!plan) {
    return 'El usuario no tiene un plan de estudios activo.';
  }

  // Obtener sesiones del plan (próximos 14 días)
  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

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
    .gte('start_time', now.toISOString())
    .lte('start_time', twoWeeksLater.toISOString())
    .order('start_time', { ascending: true });

  // Formatear contexto
  let context = `## PLAN ACTIVO
- **Nombre:** ${plan.name}
- **Descripción:** ${plan.description || 'Sin descripción'}
- **Zona horaria:** ${plan.timezone}
- **Días preferidos:** ${formatPreferredDays(plan.preferred_days)}

## SESIONES PRÓXIMAS (14 días)
`;

  if (sessions && sessions.length > 0) {
  for (const session of sessions) {
    const sessionIdx = sessions.indexOf(session);
    const startDate = new Date(session.start_time);
    const endDate = new Date(session.end_time);
    context += `
${sessionIdx + 1}. **${session.title}**
   - ID: ${session.id}
   - Fecha: ${formatDate(startDate)}
   - Hora: ${formatTime(startDate)} - ${formatTime(endDate)}
   - Duración: ${session.duration_minutes} minutos
   - Estado: ${translateStatus(session.status)}
`;
    }
  } else {
    context += 'No hay sesiones programadas en los próximos 14 días.';
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

// Función para ejecutar acciones
async function executeAction(
  userId: string, 
  planId: string, 
  action: ActionResult
): Promise<ActionResult> {
  const supabase = createAdminClient();

  switch (action.type) {
    case 'move_session': {
      const { sessionId, newStartTime, newEndTime } = action.data;
      
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
      return { ...action, status: 'success', message: '✅ Sesión movida correctamente' };
    }

    case 'delete_session': {
      const { sessionId } = action.data;
      
      const { error } = await supabase
        .from('study_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        return { ...action, status: 'error', message: `Error al eliminar la sesión: ${error.message}` };
      }
      return { ...action, status: 'success', message: '✅ Sesión eliminada correctamente' };
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
      return { ...action, status: 'success', message: `✅ Duración ajustada a ${newDurationMinutes} minutos` };
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

    // Construir prompt del sistema
    const systemPrompt = SYSTEM_PROMPT
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
