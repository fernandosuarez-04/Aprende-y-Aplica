/**
 * 🤖 Contextual Help AI Service
 *
 * Servicio de IA que analiza errores específicos del usuario en quizzes
 * y genera ayuda hiperpersonalizada usando OpenAI GPT-4o-mini.
 *
 * Características:
 * - Análisis profundo del error específico
 * - Explicación del por qué está mal la respuesta elegida
 * - Pistas específicas para llegar a la respuesta correcta
 * - Ejemplos contextuales
 * - Recursos adicionales recomendados
 */

import type { ErrorPattern } from '../rrweb/contextual-difficulty-detector';
import { getOpenAIClient } from '../openai/client';

export interface QuizErrorContext {
  /** ID de la pregunta */
  questionId: string;

  /** Texto de la pregunta */
  questionText: string;

  /** Tipo de pregunta */
  questionType: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'ordering';

  /** Respuesta seleccionada por el usuario */
  selectedAnswer: string | number;

  /** Respuesta correcta */
  correctAnswer: string | number;

  /** Opciones disponibles (para multiple choice) */
  options?: Array<{ id: string | number; text: string }>;

  /** Tema/concepto de la pregunta */
  topic?: string;

  /** Dificultad de la pregunta */
  difficulty?: 'easy' | 'medium' | 'hard';

  /** Número de intentos previos */
  attemptNumber: number;

  /** Errores previos del usuario en esta pregunta */
  previousAttempts?: Array<{
    selectedAnswer: string | number;
    timestamp: number;
  }>;

  /** Contexto del curso/lección */
  courseContext?: {
    courseName: string;
    lessonName: string;
    activityName: string;
  };
}

export interface PersonalizedHelpResponse {
  /** Explicación del error */
  errorExplanation: string;

  /** Por qué la respuesta elegida es incorrecta */
  whyWrong: string;

  /** Pista específica para llegar a la respuesta correcta */
  hint: string;

  /** Ejemplo contextual */
  example?: string;

  /** Concepto clave que debe revisar */
  keyConceptToReview: string;

  /** Recursos recomendados */
  recommendedResources?: string[];

  /** Paso a paso para resolver correctamente */
  stepByStep?: string[];

  /** Confianza de la respuesta (0-1) */
  confidence: number;
}

export interface HelpGenerationOptions {
  /** Nivel de detalle (concise, detailed, comprehensive) */
  detailLevel?: 'concise' | 'detailed' | 'comprehensive';

  /** Estilo de explicación */
  style?: 'friendly' | 'formal' | 'casual';

  /** Idioma de la respuesta */
  language?: 'es' | 'en' | 'pt';

  /** Incluir ejemplo */
  includeExample?: boolean;

  /** Incluir paso a paso */
  includeStepByStep?: boolean;
}

/**
 * Genera ayuda hiperpersonalizada usando IA
 */
export async function generatePersonalizedHelp(
  errorContext: QuizErrorContext,
  options: HelpGenerationOptions = {}
): Promise<PersonalizedHelpResponse> {
  const {
    detailLevel = 'detailed',
    style = 'friendly',
    language = 'es',
    includeExample = true,
    includeStepByStep = true
  } = options;

  try {
    const openai = getOpenAIClient();

    // Construir contexto completo
    const contextDescription = buildContextDescription(errorContext);

    // Construir prompt especializado
    const systemPrompt = buildSystemPrompt(style, language, detailLevel);
    const userPrompt = buildUserPrompt(errorContext, contextDescription, includeExample, includeStepByStep);

    console.log('🤖 [AI HELP] Generando ayuda personalizada...', {
      questionId: errorContext.questionId,
      attemptNumber: errorContext.attemptNumber,
      detailLevel,
      style,
      language
    });

    // Llamar a OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No se recibió respuesta de OpenAI');
    }

    const aiResponse = JSON.parse(content);

    console.log('✅ [AI HELP] Ayuda generada exitosamente');

    return {
      errorExplanation: aiResponse.errorExplanation || '',
      whyWrong: aiResponse.whyWrong || '',
      hint: aiResponse.hint || '',
      example: aiResponse.example,
      keyConceptToReview: aiResponse.keyConceptToReview || errorContext.topic || 'Concepto general',
      recommendedResources: aiResponse.recommendedResources || [],
      stepByStep: aiResponse.stepByStep || [],
      confidence: aiResponse.confidence || 0.8
    };

  } catch (error) {
    console.error('❌ [AI HELP] Error al generar ayuda:', error);

    // Fallback: respuesta genérica
    return generateFallbackHelp(errorContext);
  }
}

/**
 * Genera ayuda personalizada basada en un patrón de error detectado
 */
export async function generateHelpFromPattern(
  pattern: ErrorPattern,
  errorContext: QuizErrorContext,
  options: HelpGenerationOptions = {}
): Promise<PersonalizedHelpResponse> {
  // Agregar información del patrón al contexto
  const enhancedOptions = {
    ...options,
    detailLevel: pattern.severity === 'critical' ? 'comprehensive' as const :
                 pattern.severity === 'high' ? 'detailed' as const :
                 'concise' as const
  };

  return generatePersonalizedHelp(errorContext, enhancedOptions);
}

/**
 * Construye la descripción completa del contexto del error
 */
function buildContextDescription(errorContext: QuizErrorContext): string {
  const parts: string[] = [];

  // Información básica
  parts.push(`Pregunta: "${errorContext.questionText}"`);
  parts.push(`Tipo: ${errorContext.questionType}`);

  // Respuestas
  parts.push(`Respuesta elegida: ${errorContext.selectedAnswer}`);
  parts.push(`Respuesta correcta: ${errorContext.correctAnswer}`);

  // Opciones (si están disponibles)
  if (errorContext.options && errorContext.options.length > 0) {
    parts.push(`\nOpciones disponibles:`);
    errorContext.options.forEach(opt => {
      const isSelected = opt.id === errorContext.selectedAnswer;
      const isCorrect = opt.id === errorContext.correctAnswer;
      const marker = isSelected ? '❌ (seleccionada)' : isCorrect ? '✅ (correcta)' : '◻️';
      parts.push(`  ${marker} ${opt.text}`);
    });
  }

  // Contexto adicional
  if (errorContext.topic) {
    parts.push(`\nTema: ${errorContext.topic}`);
  }

  if (errorContext.difficulty) {
    parts.push(`Dificultad: ${errorContext.difficulty}`);
  }

  // Intentos previos
  if (errorContext.attemptNumber > 1) {
    parts.push(`\nEste es el intento número ${errorContext.attemptNumber}`);

    if (errorContext.previousAttempts && errorContext.previousAttempts.length > 0) {
      parts.push(`Intentos previos:`);
      errorContext.previousAttempts.forEach((attempt, idx) => {
        parts.push(`  Intento ${idx + 1}: ${attempt.selectedAnswer}`);
      });
    }
  }

  // Contexto del curso
  if (errorContext.courseContext) {
    parts.push(`\nContexto:`);
    parts.push(`  Curso: ${errorContext.courseContext.courseName}`);
    parts.push(`  Lección: ${errorContext.courseContext.lessonName}`);
    parts.push(`  Actividad: ${errorContext.courseContext.activityName}`);
  }

  return parts.join('\n');
}

/**
 * Construye el prompt del sistema según el estilo y nivel de detalle
 */
function buildSystemPrompt(
  style: HelpGenerationOptions['style'],
  language: HelpGenerationOptions['language'],
  detailLevel: HelpGenerationOptions['detailLevel']
): string {
  const styleDescriptions = {
    friendly: 'amigable, empático y motivador. Usa un tono cálido y cercano',
    formal: 'profesional y estructurado. Usa un tono académico',
    casual: 'relajado y conversacional. Usa un tono informal y accesible'
  };

  const detailDescriptions = {
    concise: 'breve y directa al punto (máximo 200 palabras)',
    detailed: 'detallada con ejemplos (300-500 palabras)',
    comprehensive: 'muy completa con ejemplos múltiples y paso a paso (500-800 palabras)'
  };

  return `Eres un asistente educativo experto especializado en ayudar a estudiantes a entender sus errores en cuestionarios.

Tu objetivo es analizar el error específico del estudiante y proporcionar ayuda hiperpersonalizada.

**Estilo de comunicación**: ${styleDescriptions[style || 'friendly']}
**Nivel de detalle**: ${detailDescriptions[detailLevel || 'detailed']}
**Idioma**: ${language === 'es' ? 'Español' : language === 'en' ? 'English' : 'Português'}

**Reglas importantes**:
1. NUNCA dar directamente la respuesta correcta
2. Explicar POR QUÉ la respuesta elegida está mal
3. Dar PISTAS específicas que guíen al estudiante a descubrir la respuesta correcta
4. Identificar el CONCEPTO CLAVE que debe revisar
5. Ser EMPÁTICO y MOTIVADOR (el estudiante está luchando)
6. Usar EJEMPLOS CONCRETOS cuando sea posible
7. Proporcionar PASOS CLAROS para resolver correctamente

**Formato de respuesta** (JSON):
{
  "errorExplanation": "Explicación clara del error cometido",
  "whyWrong": "Por qué la respuesta elegida es incorrecta (sin dar la correcta)",
  "hint": "Pista específica para descubrir la respuesta correcta",
  "example": "Ejemplo contextual que ayude a entender (opcional)",
  "keyConceptToReview": "Concepto clave que debe revisar",
  "recommendedResources": ["Recurso 1", "Recurso 2"],
  "stepByStep": ["Paso 1", "Paso 2", "Paso 3"],
  "confidence": 0.9
}`;
}

/**
 * Construye el prompt del usuario con el contexto del error
 */
function buildUserPrompt(
  errorContext: QuizErrorContext,
  contextDescription: string,
  includeExample: boolean,
  includeStepByStep: boolean
): string {
  const parts: string[] = [];

  parts.push(`El estudiante está teniendo dificultades con la siguiente pregunta:\n`);
  parts.push(contextDescription);
  parts.push(`\n---\n`);

  // Análisis del patrón de error
  if (errorContext.attemptNumber > 2) {
    parts.push(`⚠️ NOTA: El estudiante ha intentado ${errorContext.attemptNumber} veces. Necesita ayuda urgente y clara.`);
  } else if (errorContext.attemptNumber === 2) {
    parts.push(`⚠️ NOTA: Este es el segundo intento del estudiante. Necesita una pista más específica.`);
  }

  parts.push(`\nAnaliza este error y genera ayuda personalizada que:`);
  parts.push(`1. Explique claramente POR QUÉ su respuesta "${errorContext.selectedAnswer}" es incorrecta`);
  parts.push(`2. Identifique qué concepto o razonamiento le falta`);
  parts.push(`3. Proporcione una PISTA que lo guíe a la respuesta correcta (sin darla directamente)`);

  if (includeExample) {
    parts.push(`4. Incluya un EJEMPLO similar que ilustre el concepto`);
  }

  if (includeStepByStep) {
    parts.push(`5. Proporcione PASOS CLAROS de cómo abordar este tipo de preguntas`);
  }

  parts.push(`\nRecuerda: Sé empático, motivador y NUNCA des la respuesta directamente. El objetivo es que el estudiante APRENDA, no solo que acierte.`);

  return parts.join('\n');
}

/**
 * Genera ayuda de respaldo cuando falla la IA
 */
function generateFallbackHelp(errorContext: QuizErrorContext): PersonalizedHelpResponse {
  let whyWrong = `La respuesta "${errorContext.selectedAnswer}" no es correcta para esta pregunta.`;
  let hint = `Revisa cuidadosamente la pregunta y considera todas las opciones disponibles.`;
  let keyConceptToReview = errorContext.topic || 'Concepto relacionado';

  // Personalizar según el número de intentos
  if (errorContext.attemptNumber > 2) {
    hint = `Has intentado varias veces. Te recomiendo revisar el material del tema "${keyConceptToReview}" antes de continuar.`;
  }

  return {
    errorExplanation: `Parece que hay una confusión sobre este concepto. Intento ${errorContext.attemptNumber}.`,
    whyWrong,
    hint,
    keyConceptToReview,
    confidence: 0.5,
    recommendedResources: [
      `Material sobre ${keyConceptToReview}`,
      'Ejemplos prácticos',
      'Consultar con el instructor'
    ],
    stepByStep: [
      'Lee cuidadosamente la pregunta',
      'Identifica las palabras clave',
      'Elimina las opciones claramente incorrectas',
      'Analiza las opciones restantes',
      'Elige la mejor respuesta basándote en los conceptos del curso'
    ]
  };
}

/**
 * Genera un mensaje corto de ayuda para mostrar inmediatamente
 */
export function generateQuickHelpMessage(errorContext: QuizErrorContext): string {
  const messages = [
    `Veo que elegiste "${errorContext.selectedAnswer}". Veamos por qué esta no es la mejor opción... 🤔`,
    `Interesante elección. Analicemos juntos por qué "${errorContext.selectedAnswer}" no es correcta. 💡`,
    `No te preocupes, entiendo por qué elegiste "${errorContext.selectedAnswer}". Vamos a revisar este concepto. 📚`,
  ];

  // Mensajes específicos según número de intentos
  if (errorContext.attemptNumber > 2) {
    return `Has intentado ${errorContext.attemptNumber} veces. Te voy a ayudar a entender esto paso a paso. 🎯`;
  }

  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Genera un mensaje agrupado de retroalimentación para múltiples respuestas incorrectas
 * Este mensaje se envía automáticamente a LIA para hacer reflexionar al usuario
 */
export async function generateGroupedFeedbackMessage(
  incorrectAnswers: QuizErrorContext[],
  options: HelpGenerationOptions = {}
): Promise<string> {
  if (incorrectAnswers.length === 0) {
    return '';
  }

  const {
    style = 'friendly',
    language = 'es'
  } = options;

  try {
    const openai = getOpenAIClient();

    // Construir descripción de todas las respuestas incorrectas
    const groupedContext = buildGroupedContextDescription(incorrectAnswers);

    // Construir prompt del sistema
    const systemPrompt = `Eres LIA, un asistente educativo empático y motivador. Tu objetivo es ayudar a estudiantes a reflexionar sobre sus errores en un cuestionario.

**Estilo de comunicación**: ${style === 'friendly' ? 'amigable, empático y motivador. Usa un tono cálido y cercano' : style === 'formal' ? 'profesional y estructurado' : 'relajado y conversacional'}
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

    // Construir prompt del usuario
    const userPrompt = `El estudiante ha respondido incorrectamente ${incorrectAnswers.length} pregunta${incorrectAnswers.length > 1 ? 's' : ''} en el cuestionario. 

Aquí están los detalles:

${groupedContext}

Genera un mensaje de retroalimentación que:
- Haga reflexionar al estudiante sobre sus errores
- Identifique patrones comunes (si los hay)
- Sugiera conceptos clave a revisar
- Sea empático y motivador
- NO revele las respuestas correctas
- Sea natural y conversacional, como un mensaje de chat

Si hay múltiples errores, agrupa la retroalimentación de manera coherente en un solo mensaje fluido.`;

    console.log('🤖 [AI HELP] Generando mensaje agrupado de retroalimentación...', {
      incorrectAnswersCount: incorrectAnswers.length,
      style,
      language
    });

    // Llamar a OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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

    console.log('✅ [AI HELP] Mensaje agrupado generado exitosamente');

    return content.trim();

  } catch (error) {
    console.error('❌ [AI HELP] Error al generar mensaje agrupado:', error);

    // Fallback: mensaje genérico
    return generateFallbackGroupedMessage(incorrectAnswers);
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
