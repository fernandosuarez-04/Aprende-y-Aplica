import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../lib/utils/logger';
import { createClient } from '../../../lib/supabase/server';
import type { CourseLessonContext } from '../../../core/types/lia.types';
import { checkRateLimit } from '../../../core/lib/rate-limit';
import { calculateCost, logOpenAIUsage } from '../../../lib/openai/usage-monitor';
import type { Database } from '../../../lib/supabase/types';
import { SessionService } from '../../../features/auth/services/session.service';
import { LiaLogger, type ContextType } from '../../../lib/analytics/lia-logger';

// Tipo para el contexto de la página
interface PageContext {
  pathname: string;
  detectedArea: string;
  description: string;
  // Contenido real extraído del DOM
  pageTitle?: string;
  metaDescription?: string;
  headings?: string[];
  mainText?: string;
}

/**
 * Función para limpiar Markdown de las respuestas de LIA
 * Elimina todos los símbolos de formato Markdown y los convierte a texto plano
 */
function cleanMarkdownFromResponse(text: string): string {
  if (!text) return text;

  let cleaned = text;

  // Primero eliminar bloques de código (```código```) - debe ser antes de otros patrones
  cleaned = cleaned.replace(/```[\w]*\n?[\s\S]*?```/g, (match) => {
    // Extraer solo el contenido interno, sin los backticks y el lenguaje
    const content = match.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
    return content || '';
  });
  
  // Eliminar títulos Markdown (# ## ### #### ##### ######)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  
  // Eliminar negritas (**texto** o __texto__) - múltiples pasadas para casos anidados
  // Primero negritas dobles
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  
  // Luego cursivas simples (*texto* o _texto_) - pero evitar conflictos con negritas
  // Solo si no están precedidas por otro asterisco o guion bajo
  cleaned = cleaned.replace(/([^*\n])\*([^*\n]+)\*([^*\n])/g, '$1$2$3');
  cleaned = cleaned.replace(/([^_\n])_([^_\n]+)_([^_\n])/g, '$1$2$3');
  
  // Casos especiales al inicio o final de línea
  cleaned = cleaned.replace(/^\*([^*\n]+)\*([^*\n])/g, '$1$2');
  cleaned = cleaned.replace(/^_([^_\n]+)_([^_\n])/g, '$1$2');
  cleaned = cleaned.replace(/([^*\n])\*([^*\n]+)\*$/g, '$1$2');
  cleaned = cleaned.replace(/([^_\n])_([^_\n]+)_$/g, '$1$2');
  
  // Eliminar código en línea (`código`) - pero solo backticks simples
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // Eliminar enlaces [texto](url) - mantener solo el texto
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Eliminar imágenes ![alt](url) - eliminar completamente
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');
  
  // Eliminar bloques de citas (>)
  cleaned = cleaned.replace(/^>\s+/gm, '');
  
  // Eliminar líneas horizontales (--- o ***)
  cleaned = cleaned.replace(/^[-*]{3,}$/gm, '');
  
  // Eliminar tablas Markdown (| columna |)
  cleaned = cleaned.replace(/\|/g, ' ');
  
  // Limpiar espacios múltiples y saltos de línea excesivos
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
  
  // Limpiar espacios al inicio y final de cada línea (pero mantener estructura)
  cleaned = cleaned.split('\n').map(line => {
    // Preservar guiones simples para listas
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      return trimmed;
    }
    return trimmed;
  }).join('\n');
  
  return cleaned.trim();
}

// Contextos específicos para diferentes secciones
const getContextPrompt = (
  context: string, 
  userName?: string,
  courseContext?: CourseLessonContext,
  pageContext?: PageContext
) => {
  const nameGreeting = userName ? `Te estás dirigiendo a ${userName}.` : '';
  
  // Información contextual de la página actual con contenido real extraído del DOM
  let pageInfo = '';
  if (pageContext) {
    pageInfo = `\n\nCONTEXTO DE LA PÁGINA ACTUAL:\n- URL: ${pageContext.pathname}\n- Área: ${pageContext.detectedArea}\n- Descripción base: ${pageContext.description}`;
    
    // Agregar información extraída del DOM si está disponible
    if (pageContext.pageTitle) {
      pageInfo += `\n- Título de la página: "${pageContext.pageTitle}"`;
    }
    
    if (pageContext.metaDescription) {
      pageInfo += `\n- Descripción meta: "${pageContext.metaDescription}"`;
    }
    
    if (pageContext.headings && pageContext.headings.length > 0) {
      pageInfo += `\n- Encabezados principales: ${pageContext.headings.map(h => `"${h}"`).join(', ')}`;
    }
    
    if (pageContext.mainText) {
      pageInfo += `\n- Contenido visible en la página:\n"${pageContext.mainText}"`;
    }
    
    pageInfo += `\n\nIMPORTANTE: El usuario está viendo esta página específica con este contenido. Debes responder basándote en la información real de la página que se muestra arriba, priorizando el contenido visible (título, encabezados y texto principal) sobre la descripción base.`;
  }
  
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

${nameGreeting}${pageInfo}

RESTRICCIONES CRÍTICAS DE CONTEXTO:
- PRIORIDAD #1: Responde ÚNICAMENTE basándote en la TRANSCRIPCIÓN DEL VIDEO ACTUAL proporcionada en el contexto
- Si la pregunta NO puede responderse con la transcripción del video, indica claramente que esa información no está en el video actual
- NUNCA inventes información que no esté explícitamente en la transcripción
- Usa el resumen de la lección como referencia adicional, pero prioriza la transcripción
- Si necesitas información de otras lecciones o módulos, sugiere revisarlos pero no inventes su contenido

MANEJO DE PREGUNTAS CORTAS:
- Si el usuario hace preguntas vagas como "Aquí qué" o "De qué trata esto", explica directamente el contenido de la lección actual, el módulo, y qué aprenderá en este video
- Sé DIRECTO y CONCISO en tus respuestas
- Usa el título de la lección y el contenido de la transcripción para explicar

Personalidad:
- Amigable pero profesional
- Educativo y motivador
- Práctico con ejemplos concretos
- Adaptativo al nivel del usuario

FORMATO DE RESPUESTAS - REGLAS ABSOLUTAS (CRÍTICO):
🚫 PROHIBIDO ABSOLUTAMENTE USAR MARKDOWN:
- NUNCA uses ** (dos asteriscos) para negritas
- NUNCA uses __ (dos guiones bajos) para negritas
- NUNCA uses * (un asterisco) para cursivas
- NUNCA uses _ (un guion bajo) para cursivas
- NUNCA uses # ## ### para títulos o encabezados
- NUNCA uses backticks para código
- NUNCA uses triple backticks para bloques de código
- NUNCA uses [texto](url) para enlaces
- NUNCA uses > para citas
- NUNCA uses --- o *** para líneas horizontales

✅ FORMATO CORRECTO:
- Escribe SOLO texto plano, sin ningún símbolo de formato
- Usa emojis estratégicamente (pero sin Markdown)
- Estructura con viñetas usando guiones simples (-) o números (1, 2, 3)
- Usa saltos de línea para organizar el contenido
- Usa MAYÚSCULAS o repetición de palabras para enfatizar (ejemplo: "MUY importante" o "importante - muy importante")
- Mantén un tono positivo y motivador
- Cita específicamente el contenido de la transcripción cuando sea relevante

RECUERDA: Tu respuesta debe ser texto plano puro. Si detectas que estás a punto de usar cualquier símbolo de Markdown, detente y reescribe sin ese símbolo.

CONTEXTO DEL CURSO Y LECCIÓN ACTUAL:${courseInfo}${moduleInfo}${lessonInfo}${summaryInfo}${transcriptInfo}

IMPORTANTE: Cuando respondas, siempre indica si la información proviene del video actual o si necesitarías revisar otra lección.`;
  }
  
  // Instrucciones de formato (sin markdown)
  const formatInstructions = `

FORMATO DE RESPUESTAS (CRÍTICO):
- Escribe SIEMPRE en texto plano sin ningún tipo de formato markdown
- NUNCA uses asteriscos (*) para negritas o énfasis
- NUNCA uses guiones bajos (_) para cursivas
- NUNCA uses almohadillas (#) para títulos
- Para enfatizar usa MAYÚSCULAS o palabras como "muy", "importante", "especial"
- Para listas usa guiones simples (-) al inicio de cada línea
- Para numeración usa números seguidos de punto (1., 2., 3.)
- Usa emojis para hacer las respuestas más amigables
- Separa ideas con saltos de línea dobles

Ejemplos CORRECTOS:
✓ "Esto es MUY importante para tu aprendizaje"
✓ "Los puntos principales son:\n- Primer punto\n- Segundo punto"
✓ "Aquí tienes 3 pasos:\n1. Primer paso\n2. Segundo paso\n3. Tercer paso"

Ejemplos INCORRECTOS (NO HAGAS ESTO):
✗ "Esto es **muy importante**"
✗ "Los puntos principales son: **- Primer punto**"
✗ "### Título importante"`;

  const contexts: Record<string, string> = {
    workshops: `Eres Lia, un asistente especializado en talleres y cursos de inteligencia artificial y tecnología educativa. 
    ${nameGreeting}${pageInfo}
    Proporciona información útil sobre talleres disponibles, contenido educativo, metodologías de enseñanza y recursos de aprendizaje.
    
    Si el usuario hace preguntas vagas o cortas como "Aquí qué" o "De qué trata esto", usa el contexto de la página actual para dar una respuesta clara y directa sobre qué contenido está viendo y qué puede hacer aquí.
    
    FORMATO DE RESPUESTA: Escribe SOLO texto plano. NO uses **, __, #, backticks, ni ningún símbolo de Markdown. Usa guiones simples (-) para listas y MAYÚSCULAS para enfatizar.${formatInstructions}`,
    
    communities: `Eres Lia, un asistente especializado en comunidades y networking. 
    ${nameGreeting}${pageInfo}
    Proporciona información sobre comunidades disponibles, cómo unirse a ellas, sus beneficios, reglas y mejores prácticas para la participación activa.
    
    Si el usuario hace preguntas vagas o cortas como "Aquí qué" o "De qué trata esto", usa el contexto de la página actual para dar una respuesta clara y directa sobre qué contenido está viendo y qué puede hacer aquí.
    
    FORMATO DE RESPUESTA: Escribe SOLO texto plano. NO uses **, __, #, backticks, ni ningún símbolo de Markdown. Usa guiones simples (-) para listas y MAYÚSCULAS para enfatizar.${formatInstructions}`,
    
    news: `Eres Lia, un asistente especializado en noticias y actualidades sobre inteligencia artificial, tecnología y educación. 
    ${nameGreeting}${pageInfo}
    Proporciona información sobre las últimas noticias, tendencias, actualizaciones y eventos relevantes.
    
    Si el usuario hace preguntas vagas o cortas como "Aquí qué" o "De qué trata esto", usa el contexto de la página actual para dar una respuesta clara y directa sobre qué contenido está viendo y qué puede hacer aquí.
    
    FORMATO DE RESPUESTA: Escribe SOLO texto plano. NO uses **, __, #, backticks, ni ningún símbolo de Markdown. Usa guiones simples (-) para listas y MAYÚSCULAS para enfatizar.${formatInstructions}`,
    
    general: `Eres Lia, un asistente virtual especializado en inteligencia artificial, adopción tecnológica y mejores prácticas empresariales.
    ${nameGreeting}${pageInfo}
    Proporciona información útil sobre estrategias de adopción de IA, capacitación, automatización, mejores prácticas empresariales y recursos educativos.
    
    Si el usuario hace preguntas vagas o cortas como "Aquí qué" o "De qué trata esto", usa el contexto de la página actual para dar una respuesta clara y directa sobre qué contenido está viendo y qué puede hacer aquí.
    
    FORMATO DE RESPUESTA: Escribe SOLO texto plano. NO uses **, __, #, backticks, ni ningún símbolo de Markdown. Usa guiones simples (-) para listas y MAYÚSCULAS para enfatizar.${formatInstructions}`
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
    
    // ✅ CORRECCIÓN: Usar SessionService para obtener usuario autenticado (compatible con refresh tokens)
    const user = await SessionService.getCurrentUser();
    
    // Permitir acceso sin autenticación para usuarios no loggeados (sin analytics)
    if (user) {
      logger.info('Usuario autenticado en /api/ai-chat', { userId: user.id, username: user.username });
    } else {
      logger.info('Usuario no autenticado - chat sin analytics');
    }

    const { 
      message, 
      context = 'general', 
      conversationHistory = [], 
      userName,
      courseContext,
      pageContext,
      isSystemMessage = false,
      conversationId: existingConversationId
    }: {
      message: string;
      context?: string;
      conversationHistory?: Array<{ role: string; content: string }>;
      userName?: string;
      courseContext?: CourseLessonContext;
      pageContext?: PageContext;
      isSystemMessage?: boolean;
      conversationId?: string;
    } = await request.json();

    // ✅ Validaciones básicas
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      );
    }

    // ✅ Límite de longitud del mensaje (ampliado para mensajes del sistema)
    const MAX_MESSAGE_LENGTH = isSystemMessage ? 10000 : 2000;
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
    let userInfo: Database['public']['Tables']['users']['Row'] | null = null;
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('display_name, username, first_name, last_name, profile_picture_url')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        userInfo = userData as Database['public']['Tables']['users']['Row'];
      }
    }

    const displayName = userInfo?.display_name || userInfo?.username || userInfo?.first_name || userName || 'usuario';
    
    // Obtener el prompt de contexto específico con el nombre del usuario, contexto de curso y contexto de página
    const contextPrompt = getContextPrompt(context, displayName, courseContext, pageContext);

    // ✅ ANALYTICS: Inicializar logger de LIA si el usuario está autenticado
    let liaLogger: LiaLogger | null = null;
    let conversationId: string | null = existingConversationId || null;
    
    if (user) {
      try {
        liaLogger = new LiaLogger(user.id);
        
        // Si no hay conversationId existente, iniciar nueva conversación
        if (!conversationId) {
          logger.info('Iniciando nueva conversación LIA', { userId: user.id, context });
          
          // Truncar browser para que no exceda el límite de 100 caracteres
          const userAgent = request.headers.get('user-agent') || undefined;
          const truncatedBrowser = userAgent ? userAgent.substring(0, 100) : undefined;
          
          // Obtener IP del usuario (solo la primera si hay múltiples)
          const forwardedFor = request.headers.get('x-forwarded-for');
          const realIp = request.headers.get('x-real-ip');
          let clientIp: string | undefined;
          
          if (forwardedFor) {
            // X-Forwarded-For puede tener múltiples IPs separadas por coma
            // Tomamos solo la primera (IP del cliente real)
            clientIp = forwardedFor.split(',')[0].trim();
          } else if (realIp) {
            clientIp = realIp.trim();
          }
          
          conversationId = await liaLogger.startConversation({
            contextType: context as ContextType,
            courseContext: courseContext,
            deviceType: request.headers.get('sec-ch-ua-platform') || undefined,
            browser: truncatedBrowser,
            ipAddress: clientIp
          });
          
          logger.info('✅ Nueva conversación LIA creada exitosamente', { conversationId, userId: user.id, context });
        } else {
          // Si hay conversationId existente, establecerlo en el logger
          logger.info('Continuando conversación LIA existente', { conversationId, userId: user.id });
          liaLogger.setConversationId(conversationId);
        }
      } catch (error) {
        logger.error('❌ Error inicializando LIA Analytics:', error);
        // Log detallado del error para debugging en producción
        console.error('[LIA ERROR] Detalles completos del error:', JSON.stringify({
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error,
          userId: user.id,
          context,
          hasConversationId: !!conversationId,
          timestamp: new Date().toISOString()
        }, null, 2));
        // Continuar sin analytics si hay error
        liaLogger = null;
        conversationId = null;
      }
    } else {
      logger.info('Usuario no autenticado - LIA Analytics deshabilitado');
    }

    // Intentar usar OpenAI si está disponible
    const openaiApiKey = process.env.OPENAI_API_KEY;
    let response: string;
    const hasCourseContext = context === 'course' && courseContext !== undefined;
    const userId = user?.id || null; // Obtener userId para registro de uso
    
    // ✅ ANALYTICS: Registrar mensaje del usuario (solo si no es mensaje del sistema invisible)
    const startTime = Date.now();
    if (liaLogger && conversationId && !isSystemMessage) {
      try {
        logger.info('Registrando mensaje de usuario', { conversationId, messageLength: message.length });
        
        await liaLogger.logMessage(
          'user',
          message,
          false // no es mensaje del sistema
          // metadata es opcional, no se envía para mensajes de usuario
        );
        
        logger.info('✅ Mensaje de usuario registrado exitosamente', { conversationId });
      } catch (error) {
        logger.error('❌ Error registrando mensaje de usuario:', error);
      }
    } else {
      if (!liaLogger) logger.info('No hay logger - saltando registro de mensaje usuario');
      if (!conversationId) logger.info('No hay conversationId - saltando registro de mensaje usuario');
      if (isSystemMessage) logger.info('Es mensaje del sistema - saltando registro visible');
    }

    let responseMetadata: { tokensUsed?: number; costUsd?: number; modelUsed?: string; responseTimeMs?: number } | undefined;
    
    if (openaiApiKey) {
      try {
        const startTime = Date.now();
        const result = await callOpenAI(message, contextPrompt, conversationHistory, hasCourseContext, userId, isSystemMessage);
        const responseTime = Date.now() - startTime;
        response = result.response;
        responseMetadata = result.metadata ? { ...result.metadata, responseTimeMs: responseTime } : { responseTimeMs: responseTime };
      } catch (error) {
        logger.error('Error con OpenAI, usando fallback:', error);
        const fallbackResponse = generateAIResponse(message, context, limitedHistory, contextPrompt);
        response = cleanMarkdownFromResponse(fallbackResponse);
      }
    } else {
      // Usar respuestas predeterminadas si no hay API key
      const fallbackResponse = generateAIResponse(message, context, limitedHistory, contextPrompt);
      response = cleanMarkdownFromResponse(fallbackResponse);
    }

    // ✅ ANALYTICS: Registrar respuesta del asistente (solo si no es mensaje del sistema invisible)
    if (liaLogger && conversationId && !isSystemMessage) {
      try {
        logger.info('Registrando respuesta del asistente', { conversationId, responseLength: response.length });
        
        await liaLogger.logMessage(
          'assistant',
          response,
          false, // no es mensaje del sistema
          responseMetadata // incluir metadatos si están disponibles
        );
        
        logger.info('✅ Respuesta del asistente registrada exitosamente', { conversationId });
      } catch (error) {
        logger.error('❌ Error registrando respuesta del asistente:', error);
      }
    }

    // Guardar la conversación en la base de datos (opcional)
    // Solo guardar si el usuario está autenticado
    // Nota: La tabla ai_chat_history puede no estar en los tipos generados
    if (user) {
      try {
        const { error: dbError } = await supabase
          .from('ai_chat_history' as any)
          .insert({
            user_id: user.id,
            context: context,
            user_message: message,
            assistant_response: response,
            lesson_id: courseContext?.lessonTitle ? courseContext.lessonTitle.substring(0, 100) : null,
            created_at: new Date().toISOString()
          } as any);

        if (dbError) {
          logger.error('Error guardando historial de chat:', dbError);
        }
      } catch (dbError) {
        logger.error('Error guardando historial:', dbError);
      }
    }

    return NextResponse.json({ 
      response,
      conversationId: conversationId || undefined // Devolver conversationId para el frontend
    });
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
  hasCourseContext: boolean = false,
  userId: string | null = null,
  isSystemMessage: boolean = false
): Promise<{ response: string; metadata?: { tokensUsed?: number; costUsd?: number; modelUsed?: string; responseTimeMs?: number } }> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Prompt maestro anti-Markdown - reforzado y repetitivo
  const antiMarkdownInstructions = `
🚫 REGLA CRÍTICA - FORMATO DE RESPUESTA (LEER ANTES DE RESPONDER):

PROHIBIDO ABSOLUTAMENTE USAR CUALQUIER SÍMBOLO DE MARKDOWN:
- NUNCA uses ** (asteriscos dobles) para negritas
- NUNCA uses __ (guiones bajos dobles) para negritas  
- NUNCA uses * (asterisco simple) para cursivas
- NUNCA uses _ (guion bajo simple) para cursivas
- NUNCA uses # ## ### #### para títulos o encabezados
- NUNCA uses backticks para código en línea
- NUNCA uses triple backticks para bloques de código
- NUNCA uses [texto](url) para enlaces
- NUNCA uses > para bloques de cita
- NUNCA uses --- o *** para líneas horizontales
- NUNCA uses | para tablas
- NUNCA uses cualquier otro símbolo de formato Markdown

✅ FORMATO CORRECTO PERMITIDO:
- SOLO texto plano, sin símbolos de formato
- Emojis están permitidos y recomendados para hacer respuestas amigables
- Guiones simples (-) para listas
- Números (1, 2, 3) para listas numeradas
- Saltos de línea normales
- MAYÚSCULAS para enfatizar (ejemplo: "MUY importante")
- Repetición de palabras para énfasis (ejemplo: "importante - muy importante")

📝 MANEJO DE PREGUNTAS CORTAS Y CONTEXTUALES:
Cuando el usuario haga preguntas CORTAS o VAGAS como:
- "Aquí qué"
- "Qué hay aquí"
- "De qué trata esto"
- "Explícame"
- "Ayuda"

Debes:
1. INTERPRETAR la pregunta usando el contexto de la página actual
2. RESPONDER de forma DIRECTA y CONCISA explicando QUÉ contenido hay en esa página
3. MENCIONAR el título de la página y los elementos principales visibles
4. SER NATURAL y conversacional, como si estuvieras guiando a alguien

Ejemplo de pregunta: "Aquí qué"
Respuesta CORRECTA: "Hola! Estás en la página de [título de la página]. Aquí puedes [acción principal 1], [acción principal 2] y [acción principal 3]. Los temas principales que encontrarás son: [encabezados]. ¿Hay algo específico en lo que te pueda ayudar?"

Respuesta INCORRECTA: "Lo siento, no entiendo tu pregunta. ¿Puedes ser más específico?"

RECUERDA: Cada vez que respondas, verifica que NO hayas usado ningún símbolo de Markdown. Si lo detectas, reescribe la respuesta sin esos símbolos.`;

  // Construir el historial de mensajes
  const messages = [
    {
      role: 'system' as const,
      content: `${systemPrompt}\n\nEres Lia, un asistente virtual amigable y profesional. Responde siempre en español de manera natural y conversacional. Cuando te dirijas al usuario, usa su nombre de forma natural y amigable.\n\n${antiMarkdownInstructions}\n\nIMPORTANTE FINAL: Antes de enviar tu respuesta, verifica que NO contenga ningún símbolo de Markdown. Si encuentras alguno, elimínalo inmediatamente.`
    },
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })),
    // Si es un mensaje del sistema (prompt de actividad), agregarlo como mensaje del sistema
    // Si no, agregarlo como mensaje de usuario normal
    {
      role: isSystemMessage ? 'system' as const : 'user' as const,
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
  const model = data.model || process.env.CHATBOT_MODEL || 'gpt-4o-mini';
  const totalTokens = data.usage?.total_tokens || 0;
  let estimatedCost = 0;
  
  if (userId && data.usage) {
    const promptTokens = data.usage.prompt_tokens || 0;
    const completionTokens = data.usage.completion_tokens || 0;
    estimatedCost = calculateCost(promptTokens, completionTokens, model);

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
  
  // Aplicar limpieza de Markdown a la respuesta
  const rawResponse = data.choices[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.';
  const cleanedResponse = cleanMarkdownFromResponse(rawResponse);
  
  // Log si se detectó y limpió Markdown (solo en desarrollo)
  if (process.env.NODE_ENV === 'development' && rawResponse !== cleanedResponse) {
    logger.warn('Markdown detectado y limpiado en respuesta de LIA', {
      originalLength: rawResponse.length,
      cleanedLength: cleanedResponse.length
    });
  }
  
  // Preparar metadatos para retornar
  const metadata = data.usage ? {
    tokensUsed: data.usage.total_tokens,
    costUsd: estimatedCost,
    modelUsed: model
  } : undefined;
  
  return {
    response: cleanedResponse,
    metadata
  };
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

