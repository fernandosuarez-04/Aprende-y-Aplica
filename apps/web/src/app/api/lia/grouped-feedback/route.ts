import { NextRequest, NextResponse } from 'next/server';
import type { QuizErrorContext } from '@/lib/ai/contextual-help-ai';
import { SessionService } from '@/features/auth/services/session.service';
import OpenAI from 'openai';

/**
 * POST /api/lia/grouped-feedback
 * 
 * Genera un mensaje agrupado de retroalimentación para múltiples respuestas incorrectas
 * usando OpenAI. Esta ruta debe ser llamada desde el cliente.
 */
export async function POST(request: NextRequest) {
  let incorrectAnswers: any[] = [];
  let style = 'friendly';
  let language = 'es';
  
  try {
    // Verificar autenticación (opcional, pero recomendado)
    const user = await SessionService.getCurrentUser();
    
    const body = await request.json();
    incorrectAnswers = body.incorrectAnswers || [];
    style = body.style || 'friendly';
    language = body.language || 'es';

    // Validar que incorrectAnswers es un array
    if (!Array.isArray(incorrectAnswers)) {
      return NextResponse.json(
        { error: 'incorrectAnswers debe ser un array' },
        { status: 400 }
      );
    }

    // Si no hay respuestas incorrectas, retornar mensaje vacío
    if (incorrectAnswers.length === 0) {
      return NextResponse.json({ message: '' });
    }

    // Validar que cada elemento tiene la estructura correcta
    const validAnswers = incorrectAnswers.filter((answer: any) => {
      return answer && 
             typeof answer.questionId === 'string' &&
             typeof answer.questionText === 'string' &&
             answer.selectedAnswer !== undefined &&
             answer.correctAnswer !== undefined;
    });

    if (validAnswers.length === 0) {
      return NextResponse.json(
        { error: 'No hay respuestas incorrectas válidas' },
        { status: 400 }
      );
    }

    // Obtener API key directamente del entorno (como se hace en /api/ai-chat)
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      console.warn('⚠️ [API] No hay OPENAI_API_KEY configurada, usando fallback');
      const fallbackMessage = generateFallbackGroupedMessage(validAnswers as QuizErrorContext[]);
      return NextResponse.json({
        message: fallbackMessage,
        incorrectAnswersCount: validAnswers.length
      });
    }

    console.log('🤖 [API] Generando mensaje agrupado de retroalimentación para', validAnswers.length, 'respuesta(s) incorrecta(s)');
    console.log('🔍 [API] Detalles de respuestas incorrectas:', {
      count: validAnswers.length,
      questionIds: validAnswers.map(a => a.questionId),
      hasApiKey: !!openaiApiKey,
      apiKeyPrefix: openaiApiKey ? openaiApiKey.substring(0, 10) + '...' : 'none'
    });

    // Construir contexto agrupado
    const groupedContext = buildGroupedContextDescription(validAnswers as QuizErrorContext[]);
    console.log('📝 [API] Contexto agrupado construido, longitud:', groupedContext.length);

    // Construir prompt del sistema
    const systemPrompt = buildSystemPromptForGroupedFeedback(style, language);

    // Construir prompt del usuario
    const userPrompt = buildUserPromptForGroupedFeedback(validAnswers as QuizErrorContext[], groupedContext);

    console.log('🚀 [API] Llamando a OpenAI...');

    // Llamar a OpenAI directamente (como se hace en /api/ai-chat)
    const openai = new OpenAI({
      apiKey: openaiApiKey
    });

    const response = await openai.chat.completions.create({
      model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No se recibió respuesta de OpenAI');
    }

    const feedbackMessage = content.trim();

    console.log('✅ [API] Mensaje agrupado generado exitosamente', {
      messageLength: feedbackMessage.length,
      messagePreview: feedbackMessage.substring(0, 150) + '...'
    });

    return NextResponse.json({
      message: feedbackMessage,
      incorrectAnswersCount: validAnswers.length
    });

  } catch (error) {
    console.error('❌ [API] Error al generar mensaje agrupado:', error);
    
    // Retornar mensaje de fallback en caso de error
    const fallbackMessage = generateFallbackGroupedMessage(
      Array.isArray(incorrectAnswers) ? incorrectAnswers as QuizErrorContext[] : []
    );
    
    return NextResponse.json({
      message: fallbackMessage,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * Construye la descripción agrupada de múltiples respuestas incorrectas
 */
function buildGroupedContextDescription(incorrectAnswers: QuizErrorContext[]): string {
  const parts: string[] = [];

  // Agrupar por tema si es posible
  const byTopic = new Map<string, QuizErrorContext[]>();
  incorrectAnswers.forEach(error => {
    const topic = error.topic || 'General';
    if (!byTopic.has(topic)) {
      byTopic.set(topic, []);
    }
    byTopic.get(topic)!.push(error);
  });

  // Construir descripción
  parts.push(`Total de respuestas incorrectas: ${incorrectAnswers.length}\n`);

  if (byTopic.size > 1) {
    parts.push('Los errores están relacionados con los siguientes temas:\n');
    byTopic.forEach((errors, topic) => {
      parts.push(`- ${topic}: ${errors.length} pregunta${errors.length > 1 ? 's' : ''}`);
    });
    parts.push('');
  }

  // Detalles de cada pregunta incorrecta
  incorrectAnswers.forEach((error, index) => {
    parts.push(`\nPregunta ${index + 1}:`);
    parts.push(`"${error.questionText}"`);
    parts.push(`Respuesta elegida: ${getAnswerText(error.selectedAnswer, error.options)}`);
    
    if (error.topic) {
      parts.push(`Tema: ${error.topic}`);
    }
    
    if (error.attemptNumber > 1) {
      parts.push(`(Intento ${error.attemptNumber})`);
    }
  });

  // Contexto del curso (si está disponible)
  const firstError = incorrectAnswers[0];
  if (firstError.courseContext) {
    parts.push(`\n\nContexto del curso:`);
    parts.push(`Curso: ${firstError.courseContext.courseName}`);
    parts.push(`Lección: ${firstError.courseContext.lessonName}`);
    parts.push(`Actividad: ${firstError.courseContext.activityName}`);
  }

  return parts.join('\n');
}

/**
 * Obtiene el texto de una respuesta basado en su ID y las opciones disponibles
 */
function getAnswerText(answer: string | number, options?: Array<{ id: string | number; text: string }>): string {
  if (options) {
    const option = options.find(opt => opt.id === answer);
    if (option) {
      return option.text;
    }
  }
  return String(answer);
}

/**
 * Construye el prompt del sistema para retroalimentación agrupada
 */
function buildSystemPromptForGroupedFeedback(
  style: string,
  language: string
): string {
  const styleDescriptions = {
    friendly: 'amigable, empático y motivador. Usa un tono cálido y cercano',
    formal: 'profesional y estructurado. Usa un tono académico',
    casual: 'relajado y conversacional. Usa un tono informal y accesible'
  };

  return `Eres LIA, un asistente educativo empático y motivador. Tu objetivo es ayudar a estudiantes a reflexionar sobre sus errores en un cuestionario.

**Estilo de comunicación**: ${styleDescriptions[style as keyof typeof styleDescriptions] || styleDescriptions.friendly}
**Idioma**: ${language === 'es' ? 'Español' : language === 'en' ? 'English' : 'Português'}

**Reglas CRÍTICAS**:
1. NUNCA reveles las respuestas correctas directamente
2. Haz que el estudiante REFLEXIONE sobre por qué sus respuestas podrían estar incorrectas
3. Identifica PATRONES COMUNES en los errores (si hay varios)
4. Sugiere CONCEPTOS CLAVE que debe revisar
5. Sé EMPÁTICO y MOTIVADOR (el estudiante está aprendiendo)
6. El mensaje debe ser CONVERSACIONAL, como si estuvieras hablando directamente con el estudiante
7. Si hay múltiples errores, agrupa la retroalimentación de manera coherente
8. NO uses formato de lista numerada, escribe como un mensaje natural de chat

**Formato**: Responde SOLO con el mensaje de retroalimentación, sin JSON ni estructura adicional.`;
}

/**
 * Construye el prompt del usuario para retroalimentación agrupada
 */
function buildUserPromptForGroupedFeedback(
  incorrectAnswers: QuizErrorContext[],
  groupedContext: string
): string {
  const parts: string[] = [];

  parts.push(`El estudiante ha respondido incorrectamente ${incorrectAnswers.length} pregunta${incorrectAnswers.length > 1 ? 's' : ''} en el cuestionario. 

Aquí están los detalles:

${groupedContext}

Genera un mensaje de retroalimentación que:
- Haga reflexionar al estudiante sobre sus errores
- Identifique patrones comunes (si los hay)
- Sugiera conceptos clave a revisar
- Sea empático y motivador
- NO revele las respuestas correctas
- Sea natural y conversacional, como un mensaje de chat

Si hay múltiples errores, agrupa la retroalimentación de manera coherente en un solo mensaje fluido.`);

  return parts.join('\n');
}

/**
 * Genera un mensaje de respaldo cuando falla la IA
 */
function generateFallbackGroupedMessage(incorrectAnswers: QuizErrorContext[]): string {
  const count = incorrectAnswers.length;
  
  if (count === 1) {
    const error = incorrectAnswers[0];
    return `Veo que hay una respuesta que necesita revisión. La pregunta "${error.questionText}" tiene una respuesta que no es correcta. Te sugiero reflexionar sobre el concepto relacionado con "${error.topic || 'esta pregunta'}" y revisar el material del curso. Recuerda que los errores son parte del aprendizaje. 💪`;
  }

  // Múltiples errores
  const topics = [...new Set(incorrectAnswers.map(e => e.topic).filter(Boolean))];
  const topicsText = topics.length > 0 
    ? `los temas: ${topics.join(', ')}`
    : 'varios conceptos';

  return `He notado que hay ${count} respuestas que necesitan revisión. Esto sugiere que podría haber algunas áreas donde necesitas reforzar tu comprensión, especialmente relacionadas con ${topicsText}. 

Te recomiendo:
- Revisar el material del curso sobre estos temas
- Reflexionar sobre qué podría estar causando la confusión
- No te desanimes, los errores son oportunidades de aprendizaje

¿Te gustaría que profundicemos en algún concepto específico? 🤔`;
}

