import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';
import type { CourseLessonContext } from '@/core/types/lia.types';

// Contextos específicos para diferentes secciones
const getContextPrompt = (
  context: string, 
  userName?: string,
  courseContext?: CourseLessonContext
) => {
  const nameGreeting = userName ? `Te estás dirigiendo a ${userName}.` : '';
  
  // Si hay contexto de curso/lección, crear prompt especializado
  if (courseContext && context === 'course') {
    const transcriptInfo = courseContext.transcriptContent 
      ? `\n\nTRANSCRIPCIÓN DEL VIDEO ACTUAL:\n${courseContext.transcriptContent.substring(0, 2000)}${courseContext.transcriptContent.length > 2000 ? '...' : ''}`
      : '';
    
    const summaryInfo = courseContext.summaryContent
      ? `\n\nRESUMEN DE LA LECCIÓN:\n${courseContext.summaryContent}`
      : '';
    
    const lessonInfo = courseContext.lessonTitle 
      ? `\n\nINFORMACIÓN DE LA LECCIÓN ACTUAL:\n- Título: ${courseContext.lessonTitle}${courseContext.lessonDescription ? `\n- Descripción: ${courseContext.lessonDescription}` : ''}`
      : '';
    
    const moduleInfo = courseContext.moduleTitle
      ? `\n\nMÓDULO ACTUAL: ${courseContext.moduleTitle}`
      : '';
    
    const courseInfo = courseContext.courseTitle
      ? `\n\nCURSO: ${courseContext.courseTitle}${courseContext.courseDescription ? `\n${courseContext.courseDescription}` : ''}`
      : '';
    
    return `Eres LIA (Learning Intelligence Assistant), un asistente de inteligencia artificial especializado en educación que funciona como tutor personalizado.

${nameGreeting}

RESTRICCIONES CRÍTICAS DE CONTEXTO:
- PRIORIDAD #1: Responde ÚNICAMENTE basándote en la TRANSCRIPCIÓN DEL VIDEO ACTUAL proporcionada en el contexto
- Si la pregunta NO puede responderse con la transcripción del video, indica claramente que esa información no está en el video actual
- NUNCA inventes información que no esté explícitamente en la transcripción
- Usa el resumen de la lección como referencia adicional, pero prioriza la transcripción
- Si necesitas información de otras lecciones o módulos, sugiere revisarlos pero no inventes su contenido

Personalidad:
- Amigable pero profesional
- Educativo y motivador
- Práctico con ejemplos concretos
- Adaptativo al nivel del usuario

Formato de respuestas:
- Usa emojis estratégicamente
- Estructura con viñetas y numeración usando guiones (-) o números (1, 2, 3)
- NO uses formato markdown (NO uses ** para negritas, NO uses __ para cursivas, NO uses # para títulos)
- NO uses asteriscos, guiones bajos, o símbolos especiales para formato
- Escribe en texto plano, pero organizado con saltos de línea
- Usa MAYÚSCULAS o repetición de palabras para enfatizar (ejemplo: "MUY importante" o "importante - muy importante")
- Mantén un tono positivo y motivador
- Cita específicamente el contenido de la transcripción cuando sea relevante

CONTEXTO DEL CURSO Y LECCIÓN ACTUAL:${courseInfo}${moduleInfo}${lessonInfo}${summaryInfo}${transcriptInfo}

IMPORTANTE: Cuando respondas, siempre indica si la información proviene del video actual o si necesitarías revisar otra lección.`;
  }
  
  const contexts: Record<string, string> = {
    workshops: `Eres Lia, un asistente especializado en talleres y cursos de inteligencia artificial y tecnología educativa. 
    ${nameGreeting}
    Proporciona información útil sobre talleres disponibles, contenido educativo, metodologías de enseñanza y recursos de aprendizaje.`,
    
    communities: `Eres Lia, un asistente especializado en comunidades y networking. 
    ${nameGreeting}
    Proporciona información sobre comunidades disponibles, cómo unirse a ellas, sus beneficios, reglas y mejores prácticas para la participación activa.`,
    
    news: `Eres Lia, un asistente especializado en noticias y actualidades sobre inteligencia artificial, tecnología y educación. 
    ${nameGreeting}
    Proporciona información sobre las últimas noticias, tendencias, actualizaciones y eventos relevantes.`,
    
    general: `Eres Lia, un asistente virtual especializado en inteligencia artificial, adopción tecnológica y mejores prácticas empresariales.
    ${nameGreeting}
    Proporciona información útil sobre estrategias de adopción de IA, capacitación, automatización, mejores prácticas empresariales y recursos educativos.`
  };
  
  return contexts[context] || contexts.general;
};

export async function POST(request: NextRequest) {
  try {
    // ✅ CORRECCIÓN 6: Rate limiting específico para OpenAI
    // 10 requests por minuto por usuario
    const rateLimitResult = checkRateLimit(request, {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minuto
      message: 'Demasiadas solicitudes al chatbot. Por favor, espera un momento.'
    }, 'openai');

    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    const supabase = await createClient();
    
    // Verificar autenticación (hacer opcional para pruebas)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Por ahora permitimos el acceso sin autenticación para pruebas
    // Descomentar las siguientes líneas si quieres requerir autenticación:
    /*
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    */

    const { 
      message, 
      context = 'general', 
      conversationHistory = [], 
      userName,
      courseContext 
    }: {
      message: string;
      context?: string;
      conversationHistory?: Array<{ role: string; content: string }>;
      userName?: string;
      courseContext?: CourseLessonContext;
    } = await request.json();

    // ✅ Validaciones básicas
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      );
    }

    // ✅ Límite de longitud del mensaje (2000 caracteres)
    const MAX_MESSAGE_LENGTH = 2000;
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `El mensaje es muy largo. Máximo ${MAX_MESSAGE_LENGTH} caracteres.` },
        { status: 400 }
      );
    }

    // ✅ Límite de historial de conversación (últimos 20 mensajes)
    const MAX_HISTORY_LENGTH = 20;
    let limitedHistory = conversationHistory;
    if (Array.isArray(conversationHistory) && conversationHistory.length > MAX_HISTORY_LENGTH) {
      limitedHistory = conversationHistory.slice(-MAX_HISTORY_LENGTH);
    }

    // Obtener información del usuario desde la base de datos
    let userInfo = null;
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('display_name, username, first_name, last_name, profile_picture_url')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        userInfo = userData;
      }
    }

    const displayName = userInfo?.display_name || userInfo?.username || userInfo?.first_name || userName || 'usuario';
    
    // Obtener el prompt de contexto específico con el nombre del usuario y contexto de curso
    const contextPrompt = getContextPrompt(context, displayName, courseContext);

    // Intentar usar OpenAI si está disponible
    const openaiApiKey = process.env.OPENAI_API_KEY;
    let response: string;
    const hasCourseContext = context === 'course' && courseContext !== undefined;

    if (openaiApiKey) {
      try {
        response = await callOpenAI(message, contextPrompt, conversationHistory, hasCourseContext);
      } catch (error) {
        logger.error('Error con OpenAI, usando fallback:', error);
        response = generateAIResponse(message, context, limitedHistory, contextPrompt);
      }
    } else {
      // Usar respuestas predeterminadas si no hay API key
      response = generateAIResponse(message, context, limitedHistory, contextPrompt);
    }

    // Guardar la conversación en la base de datos (opcional)
    // Solo guardar si el usuario está autenticado
    if (user) {
      try {
        const { error: dbError } = await supabase
          .from('ai_chat_history')
          .insert({
            user_id: user.id,
            context: context,
            user_message: message,
            assistant_response: response,
            // Guardar contexto de curso si existe
            lesson_id: courseContext?.lessonTitle ? courseContext.lessonTitle.substring(0, 100) : null,
            created_at: new Date().toISOString()
          });

        if (dbError) {
          logger.error('Error guardando historial de chat:', dbError);
        }
      } catch (dbError) {
        logger.error('Error guardando historial:', dbError);
      }
    }

    return NextResponse.json({ response });
  } catch (error) {
    logger.error('Error en API de chat:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función para llamar a OpenAI
async function callOpenAI(
  message: string,
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  hasCourseContext: boolean = false
): Promise<string> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Construir el historial de mensajes
  const messages = [
    {
      role: 'system' as const,
      content: `${systemPrompt}\n\nEres Lia, un asistente virtual amigable y profesional. Responde siempre en español de manera natural y conversacional. Cuando te dirijas al usuario, usa su nombre de forma natural y amigable.\n\nIMPORTANTE: NO uses formato markdown en tus respuestas. NO uses ** para negritas, __ para cursivas, # para títulos, ni ningún otro símbolo de formato. Escribe en texto plano simple y claro.`
    },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })),
    {
      role: 'user' as const,
      content: message
    }
  ];

  // Optimizar para respuestas más rápidas
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
      messages: messages,
      temperature: parseFloat(process.env.CHATBOT_TEMPERATURE || (hasCourseContext ? '0.5' : '0.6')), // Más determinístico para contexto educativo
      max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS || (hasCourseContext ? '1000' : '500')), // Más tokens para respuestas educativas
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  
  // ✅ CORRECCIÓN 6: Registrar uso de OpenAI
  if (userId && data.usage) {
    const model = data.model || process.env.CHATBOT_MODEL || 'gpt-4o-mini';
    const promptTokens = data.usage.prompt_tokens || 0;
    const completionTokens = data.usage.completion_tokens || 0;
    const totalTokens = data.usage.total_tokens || 0;
    const estimatedCost = calculateCost(promptTokens, completionTokens, model);

    logOpenAIUsage({
      userId,
      timestamp: new Date(),
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost
    });

    logger.info('OpenAI usage logged', {
      userId,
      model,
      totalTokens,
      estimatedCost: `$${estimatedCost.toFixed(4)}`
    });
  }
  
  return data.choices[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.';
}

// Función para generar respuestas (simular IA)
function generateAIResponse(
  message: string,
  context: string,
  history: Array<{ role: string; content: string }>,
  contextPrompt: string
): string {
  const lowerMessage = message.toLowerCase();

  // Respuestas específicas por contexto
  if (context === 'workshops') {
    if (lowerMessage.includes('taller') || lowerMessage.includes('curso')) {
      return 'Actualmente tenemos varios talleres disponibles sobre inteligencia artificial, automatización y tecnología educativa. ¿Te gustaría que te ayude a encontrar uno específico?';
    }
    if (lowerMessage.includes('inscribir') || lowerMessage.includes('matricular')) {
      return 'Para inscribirte en un taller, puedes navegar al directorio de talleres y hacer clic en el que te interese. Allí encontrarás información detallada y podrás inscribirte.';
    }
  }

  if (context === 'communities') {
    if (lowerMessage.includes('comunidad') || lowerMessage.includes('unir')) {
      return 'Tenemos varias comunidades disponibles donde puedes conectarte con otros profesionales. Algunas son de acceso libre, mientras que otras requieren solicitud. ¿Cuál te interesa?';
    }
    if (lowerMessage.includes('normas') || lowerMessage.includes('reglas')) {
      return 'Nuestras comunidades se rigen por principios de respeto, colaboración y contribución positiva. Buscamos crear un ambiente donde todos puedan aprender y compartir conocimientos de manera constructiva.';
    }
  }

  if (context === 'news') {
    if (lowerMessage.includes('noticia') || lowerMessage.includes('actualidad')) {
      return 'Mantente actualizado con nuestras últimas noticias sobre IA, tecnología educativa y tendencias del sector. Puedes explorar nuestras secciones de noticias destacadas y reels para ver contenido actualizado.';
    }
  }

  // Respuestas generales
  if (lowerMessage.includes('hola') || lowerMessage.includes('hi')) {
    return '¡Hola! 👋 Estoy aquí para ayudarte. ¿En qué puedo asistirte hoy?';
  }

  if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
    return `Puedo ayudarte con información sobre:
    
    📚 Talleres y cursos disponibles
    👥 Comunidades y networking
    📰 Últimas noticias y tendencias
    🤖 Herramientas de IA
    💡 Mejores prácticas

¿Qué te interesa más?`;
  }

  if (lowerMessage.includes('gracias') || lowerMessage.includes('thanks')) {
    return '¡De nada! 😊 Estoy aquí cuando necesites ayuda. ¿Hay algo más en lo que pueda asistirte?';
  }

  // Respuesta por defecto
  const defaultResponses = [
    'Entiendo tu pregunta. Déjame ayudarte con eso.',
    'Esa es una excelente pregunta. Permíteme brindarte información útil.',
    'Claro, puedo ayudarte con eso. Aquí tienes información relevante:'
  ];

  const randomResponse = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];

  return `${randomResponse}

${contextPrompt}

Si necesitas información más específica, puedes buscar en las diferentes secciones de nuestra plataforma o preguntarme sobre algo en particular.`;
}

