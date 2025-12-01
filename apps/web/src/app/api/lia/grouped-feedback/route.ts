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

    // 🆕 Log del prompt completo para debugging
    console.log('📋 [API] Prompt completo que se enviará a OpenAI:', {
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      groupedContextLength: groupedContext.length,
      systemPromptPreview: systemPrompt.substring(0, 200) + '...',
      userPromptPreview: userPrompt.substring(0, 300) + '...',
      groupedContextPreview: groupedContext.substring(0, 500) + '...'
    });

    // 🆕 Log completo del contexto agrupado para verificar que incluye todas las preguntas
    console.log('📝 [API] Contexto agrupado COMPLETO (todas las preguntas):', {
      totalQuestions: validAnswers.length,
      fullContext: groupedContext
    });

    console.log('🚀 [API] Llamando a OpenAI...');

    // Llamar a OpenAI directamente (como se hace en /api/ai-chat)
    const openai = new OpenAI({
      apiKey: openaiApiKey
    });

    // 🆕 Ajustar max_tokens según la cantidad de respuestas incorrectas
    // Más respuestas incorrectas = más tokens necesarios
    const baseTokens = 800;
    const tokensPerQuestion = 200;
    const calculatedMaxTokens = baseTokens + (validAnswers.length * tokensPerQuestion);
    const maxTokens = Math.min(calculatedMaxTokens, 2000); // Máximo 2000 tokens

    console.log('📊 [API] Configuración de tokens:', {
      incorrectAnswersCount: validAnswers.length,
      calculatedMaxTokens,
      finalMaxTokens: maxTokens
    });

    const response = await openai.chat.completions.create({
      model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: maxTokens
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
    parts.push(`\n--- PREGUNTA ${index + 1} DE ${incorrectAnswers.length} ---`);
    parts.push(`Pregunta: "${error.questionText}"`);
    parts.push(`Respuesta elegida por el estudiante: ${getAnswerText(error.selectedAnswer, error.options)}`);
    parts.push(`Respuesta correcta: ${getAnswerText(error.correctAnswer, error.options)} (CONTEXTO INTERNO - NO revelar al estudiante, úsalo solo para entender qué está mal)`);
    
    if (error.options && error.options.length > 0) {
      parts.push(`Todas las opciones disponibles en esta pregunta:`);
      error.options.forEach((opt, optIdx) => {
        const isSelected = opt.id === error.selectedAnswer;
        const isCorrect = opt.id === error.correctAnswer;
        const letter = String.fromCharCode(65 + optIdx);
        parts.push(`  ${letter}. ${opt.text}${isSelected ? ' ← (ELEGIDA POR EL ESTUDIANTE - INCORRECTA)' : ''}${isCorrect ? ' ✓ (CORRECTA - no revelar)' : ''}`);
      });
    }
    
    // 🆕 Análisis del error para ayudar a LIA a dar retroalimentación específica
    parts.push(`Análisis del error:`);
    parts.push(`- El estudiante eligió: "${getAnswerText(error.selectedAnswer, error.options)}"`);
    parts.push(`- La respuesta correcta es: "${getAnswerText(error.correctAnswer, error.options)}"`);
    parts.push(`- ¿Por qué podría estar confundido? Analiza la diferencia entre lo que eligió y lo correcto para dar pistas específicas.`);
    
    if (error.topic) {
      parts.push(`Tema/Concepto relacionado: ${error.topic}`);
    }
    
    if (error.difficulty) {
      parts.push(`Dificultad: ${error.difficulty}`);
    }
    
    if (error.attemptNumber > 1) {
      parts.push(`(Este es el intento número ${error.attemptNumber} en esta pregunta)`);
    }
    parts.push(''); // Línea en blanco entre preguntas para mejor legibilidad
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
2. **SÉ ESPECÍFICO Y ÚTIL**: Explica claramente por qué la respuesta elegida es incorrecta, dando pistas concretas y específicas. NO uses frases vagas como "quizás podrías reflexionar" o "tal vez podrías revisar"
3. **EXPLICA EL ERROR**: Identifica específicamente qué parte de la respuesta elegida está mal y por qué, sin revelar la respuesta correcta
4. **DA CONTEXTO CONCRETO**: Menciona conceptos clave específicos que debe revisar, con ejemplos o analogías cuando sea útil
5. Identifica PATRONES COMUNES en los errores (si hay varios)
6. Sé EMPÁTICO y MOTIVADOR (el estudiante está aprendiendo)
7. El mensaje debe ser CONVERSACIONAL, como si estuvieras hablando directamente con el estudiante
8. **CRÍTICO - MÚLTIPLES PREGUNTAS**: Si hay múltiples errores, DEBES mencionar y abordar TODAS y CADA UNA de las preguntas incorrectas. NO puedes omitir ninguna. Si el estudiante tiene 3 preguntas incorrectas, debes dar retroalimentación para las 3, no solo para 1 o 2.
9. NO uses formato de lista numerada, escribe como un mensaje natural de chat
10. **VERIFICACIÓN OBLIGATORIA**: Antes de terminar tu respuesta, verifica mentalmente que mencionaste TODAS las preguntas incorrectas. Si falta alguna, inclúyela.
11. **ESTRUCTURA PARA MÚLTIPLES PREGUNTAS**: Cuando hay múltiples preguntas, estructura tu respuesta así: (1) Saludo, (2) Retroalimentación para pregunta 1, (3) Retroalimentación para pregunta 2, (4) Retroalimentación para pregunta 3 (si hay), (5) Patrones comunes (si los hay), (6) Mensaje motivador final

**Ejemplos de retroalimentación**:

❌ MAL (vago y poco útil):
"Quizás podrías reflexionar un poco más sobre qué significa realmente cada uno de estos términos. Tal vez podrías revisar más sobre cómo se llevan a cabo estos procesos."

✅ BIEN (específico y útil):
"Veo que elegiste que el Entrenamiento es rápido. Sin embargo, el Entrenamiento generalmente es un proceso más lento porque requiere procesar grandes cantidades de datos históricos para que el modelo aprenda patrones y ajuste sus parámetros. La Inferencia, por otro lado, es más rápida porque el modelo ya está entrenado y solo necesita aplicar lo aprendido a nuevos datos. Te sugiero revisar el concepto de 'procesamiento de datos históricos para aprendizaje' vs 'aplicación de conocimiento ya aprendido a datos nuevos'."

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

  if (incorrectAnswers.length === 1) {
    parts.push(`El estudiante ha respondido incorrectamente 1 pregunta en el cuestionario. 

Aquí están los detalles:

${groupedContext}

Genera un mensaje de retroalimentación que:
- Explique ESPECÍFICAMENTE por qué la respuesta elegida es incorrecta (sin revelar la correcta)
- Identifique qué parte de la respuesta está mal y por qué
- Mencione conceptos clave específicos que debe revisar (no solo "revisa estos conceptos")
- Proporcione pistas concretas que lo guíen hacia la comprensión correcta
- Use ejemplos o analogías cuando sea útil para clarificar
- Sea empático y motivador
- NO revele la respuesta correcta
- Sea natural y conversacional, como un mensaje de chat
- **NO sea vago**: Evita frases genéricas como "quizás podrías reflexionar" o "tal vez podrías revisar". Sé directo, específico y útil`);
  } else {
    parts.push(`El estudiante ha respondido incorrectamente ${incorrectAnswers.length} preguntas en el cuestionario. 

**⚠️ CRÍTICO Y OBLIGATORIO**: DEBES mencionar y proporcionar retroalimentación ESPECÍFICA para TODAS y CADA UNA de las ${incorrectAnswers.length} preguntas incorrectas. NO puedes omitir ninguna pregunta. El mensaje DEBE cubrir las ${incorrectAnswers.length} preguntas, no solo una o dos.

**ESTRUCTURA REQUERIDA DEL MENSAJE**:
1. Saludo empático inicial
2. Para la PREGUNTA 1: Retroalimentación específica completa
3. Para la PREGUNTA 2: Retroalimentación específica completa
${incorrectAnswers.length > 2 ? `4. Para la PREGUNTA 3: Retroalimentación específica completa\n${incorrectAnswers.length > 3 ? '5. (Y así sucesivamente para todas las preguntas)\n' : ''}` : ''}
${incorrectAnswers.length > 1 ? `${incorrectAnswers.length + 1}. Identificación de patrones comunes (si los hay)\n${incorrectAnswers.length + 2}. Mensaje motivador final` : ''}

Aquí están los detalles de TODAS las ${incorrectAnswers.length} preguntas incorrectas:

${groupedContext}

**INSTRUCCIONES ESPECÍFICAS**:
- Menciona EXPLÍCITAMENTE cada pregunta (puedes referirte a ellas como "la primera pregunta", "la segunda pregunta", etc., o por su contenido)
- Para CADA pregunta, explica ESPECÍFICAMENTE por qué la respuesta elegida es incorrecta
- Para CADA pregunta, identifica qué parte de la respuesta está mal y por qué
- Para CADA pregunta, menciona conceptos clave específicos que debe revisar
- Para CADA pregunta, proporciona pistas concretas que lo guíen hacia la comprensión correcta
- Si hay patrones comunes entre los errores, identifícalos después de cubrir todas las preguntas
- Use ejemplos o analogías cuando sea útil para clarificar
- Sea empático y motivador
- NO revele las respuestas correctas
- Sea natural y conversacional, como un mensaje de chat fluido
- **NO sea vago**: Evita frases genéricas. Sé directo, específico y útil para cada pregunta

**VERIFICACIÓN OBLIGATORIA ANTES DE RESPONDER**: 
Debes verificar que tu respuesta mencione explícitamente:
${incorrectAnswers.map((error, idx) => {
  const questionPreview = error.questionText.substring(0, 60);
  return `- PREGUNTA ${idx + 1}: "${questionPreview}..." - DEBE estar mencionada con retroalimentación específica`;
}).join('\n')}

**CONTEO DE PREGUNTAS**: Tu respuesta debe mencionar exactamente ${incorrectAnswers.length} pregunta${incorrectAnswers.length > 1 ? 's' : ''}. Si tu respuesta solo menciona menos de ${incorrectAnswers.length} pregunta${incorrectAnswers.length > 1 ? 's' : ''}, está INCOMPLETA y debes reescribirla.

**CRÍTICO**: El mensaje DEBE cubrir las ${incorrectAnswers.length} preguntas incorrectas, no solo una o dos. Si solo mencionas una o dos preguntas, el mensaje está incompleto y no cumple con el objetivo.`);
  }

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

