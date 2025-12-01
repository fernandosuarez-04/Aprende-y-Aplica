/**
 * 🎯 Contextual Difficulty Detector
 *
 * Sistema avanzado de detección de dificultad que analiza el contexto específico
 * de cada error del usuario para ofrecer ayuda hiperpersonalizada.
 *
 * Detecta:
 * - ❌ Errores repetidos en la misma pregunta
 * - ⏭️ Preguntas saltadas/dejadas en blanco
 * - 🔄 Patrones de abandono (intenta varias veces y deja la pregunta)
 * - 🎯 Contexto específico del error (qué opción eligió vs. la correcta)
 * - 📊 Análisis de patrones de error por tipo de contenido
 */

export interface QuestionAttempt {
  questionId: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'ordering';
  attemptNumber: number;
  selectedAnswer: string | number | null;
  correctAnswer: string | number;
  isCorrect: boolean;
  timestamp: number;
  timeSpent: number; // ms desde que vio la pregunta
  topic?: string; // Tema/categoría de la pregunta
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface QuestionSkipEvent {
  questionId: string;
  questionText: string;
  questionType: string;
  skipReason: 'blank' | 'incomplete' | 'abandoned';
  attemptsBefore: number; // Cuántos intentos hizo antes de saltarla
  timestamp: number;
  timeSpent: number;
  topic?: string;
}

export interface ErrorPattern {
  questionId: string;
  questionText: string;
  errorType: 'repeated_mistake' | 'conceptual_error' | 'skip_after_attempts' | 'immediate_skip' | 'wrong_category';
  severity: 'low' | 'medium' | 'high' | 'critical';
  attempts: QuestionAttempt[];
  skips: QuestionSkipEvent[];
  detectedAt: number;
  // Análisis contextual
  context: {
    totalAttempts: number;
    uniqueWrongAnswers: number; // Cuántas respuestas diferentes intentó
    patternDescription: string;
    suggestedHelp: string;
    relatedConcepts: string[];
    commonMistake?: string; // Si es un error común detectado
  };
}

export interface ContextualDifficultyAnalysis {
  overallScore: number; // 0-1
  errorPatterns: ErrorPattern[];
  shouldIntervene: boolean;
  interventionPriority: 'immediate' | 'soon' | 'monitor';
  interventionMessage: string;
  suggestedActions: SuggestedAction[];
  detectedAt: number;
  // Estadísticas generales
  stats: {
    totalQuestions: number;
    attemptedQuestions: number;
    skippedQuestions: number;
    questionsWithMultipleAttempts: number;
    averageAttemptsPerQuestion: number;
    topicsDifficulty: Record<string, number>; // topic -> difficulty score
  };
}

export interface SuggestedAction {
  type: 'show_hint' | 'review_concept' | 'show_example' | 'simplify_question' | 'contact_instructor';
  priority: 'high' | 'medium' | 'low';
  message: string;
  data?: any; // Datos adicionales para la acción
}

export interface ContextualDetectionConfig {
  // Umbrales para detección
  maxAttemptsBeforeIntervention: number; // default: 3
  skipThreshold: number; // Cuántas preguntas saltadas antes de intervenir (default: 2)
  repeatedMistakeThreshold: number; // Mismo error N veces (default: 2)
  timeThresholdMs: number; // Tiempo mínimo por pregunta antes de considerar "salto rápido" (default: 5000)

  // Configuración de análisis
  enableConceptualAnalysis: boolean; // Analizar errores por concepto (default: true)
  enablePatternDetection: boolean; // Detectar patrones de error (default: true)
  minimumQuestionsForAnalysis: number; // Mínimo de preguntas para análisis (default: 3)
}

const DEFAULT_CONFIG: ContextualDetectionConfig = {
  maxAttemptsBeforeIntervention: 3,
  skipThreshold: 2,
  repeatedMistakeThreshold: 2,
  timeThresholdMs: 5000, // 5 segundos
  enableConceptualAnalysis: true,
  enablePatternDetection: true,
  minimumQuestionsForAnalysis: 3
};

export class ContextualDifficultyDetector {
  private config: ContextualDetectionConfig;
  private attempts: Map<string, QuestionAttempt[]>; // questionId -> attempts
  private skips: Map<string, QuestionSkipEvent[]>; // questionId -> skips
  private questionStartTimes: Map<string, number>; // questionId -> timestamp
  private lastInterventionTime: number = 0;
  private sessionStartTime: number = Date.now();

  constructor(config: Partial<ContextualDetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.attempts = new Map();
    this.skips = new Map();
    this.questionStartTimes = new Map();
  }

  /**
   * Registra cuando el usuario comienza una pregunta
   */
  public startQuestion(questionId: string): void {
    if (!this.questionStartTimes.has(questionId)) {
      this.questionStartTimes.set(questionId, Date.now());
      console.log('🏁 [CONTEXTUAL] Pregunta iniciada:', questionId);
    }
  }

  /**
   * Registra un intento de respuesta del usuario
   */
  public recordAttempt(attempt: Omit<QuestionAttempt, 'attemptNumber' | 'timestamp' | 'timeSpent'>): void {
    const questionId = attempt.questionId;
    const existingAttempts = this.attempts.get(questionId) || [];
    const attemptNumber = existingAttempts.length + 1;
    const startTime = this.questionStartTimes.get(questionId) || Date.now();
    const timeSpent = Date.now() - startTime;

    const fullAttempt: QuestionAttempt = {
      ...attempt,
      attemptNumber,
      timestamp: Date.now(),
      timeSpent
    };

    existingAttempts.push(fullAttempt);
    this.attempts.set(questionId, existingAttempts);

    console.log('📝 [CONTEXTUAL] Intento registrado:', {
      questionId,
      attemptNumber,
      isCorrect: fullAttempt.isCorrect,
      timeSpent: `${(timeSpent / 1000).toFixed(1)}s`
    });

    // Si es correcto, resetear el timer de inicio
    if (fullAttempt.isCorrect) {
      this.questionStartTimes.delete(questionId);
    }
  }

  /**
   * Registra cuando el usuario salta una pregunta
   */
  public recordSkip(skip: Omit<QuestionSkipEvent, 'timestamp' | 'timeSpent' | 'attemptsBefore'>): void {
    const questionId = skip.questionId;
    const existingSkips = this.skips.get(questionId) || [];
    const existingAttempts = this.attempts.get(questionId) || [];
    const startTime = this.questionStartTimes.get(questionId) || Date.now();
    const timeSpent = Date.now() - startTime;

    const fullSkip: QuestionSkipEvent = {
      ...skip,
      attemptsBefore: existingAttempts.length,
      timestamp: Date.now(),
      timeSpent
    };

    existingSkips.push(fullSkip);
    this.skips.set(questionId, existingSkips);

    console.log('⏭️ [CONTEXTUAL] Pregunta saltada:', {
      questionId,
      skipReason: fullSkip.skipReason,
      attemptsBefore: fullSkip.attemptsBefore,
      timeSpent: `${(timeSpent / 1000).toFixed(1)}s`
    });

    // Resetear el timer de inicio
    this.questionStartTimes.delete(questionId);
  }

  /**
   * Analiza todos los intentos y skips para detectar patrones de dificultad
   */
  public analyze(): ContextualDifficultyAnalysis {
    const now = Date.now();
    const errorPatterns: ErrorPattern[] = [];

    // Analizar cada pregunta
    const allQuestionIds = new Set([
      ...Array.from(this.attempts.keys()),
      ...Array.from(this.skips.keys())
    ]);

    console.log('🔍 [CONTEXTUAL] Analizando preguntas:', allQuestionIds.size);

    allQuestionIds.forEach(questionId => {
      const attempts = this.attempts.get(questionId) || [];
      const skips = this.skips.get(questionId) || [];

      // Detectar errores repetidos
      const incorrectAttempts = attempts.filter(a => !a.isCorrect);
      if (incorrectAttempts.length >= this.config.repeatedMistakeThreshold) {
        const pattern = this.analyzeRepeatedMistakes(questionId, attempts, skips);
        if (pattern) errorPatterns.push(pattern);
      }

      // Detectar skip después de intentos
      if (skips.length > 0 && attempts.length > 0) {
        const pattern = this.analyzeSkipAfterAttempts(questionId, attempts, skips);
        if (pattern) errorPatterns.push(pattern);
      }

      // Detectar skip inmediato (sin intentos o con poco tiempo)
      if (skips.length > 0 && attempts.length === 0) {
        const pattern = this.analyzeImmediateSkip(questionId, skips);
        if (pattern) errorPatterns.push(pattern);
      }
    });

    // Calcular estadísticas
    const stats = this.calculateStats(allQuestionIds);

    // Calcular score general
    const overallScore = this.calculateOverallScore(errorPatterns, stats);

    // Determinar si se debe intervenir
    const { shouldIntervene, priority } = this.shouldIntervene(errorPatterns, stats);

    // Generar mensaje de intervención y acciones sugeridas
    const interventionMessage = shouldIntervene
      ? this.generateInterventionMessage(errorPatterns, stats)
      : '';

    const suggestedActions = shouldIntervene
      ? this.generateSuggestedActions(errorPatterns, stats)
      : [];

    const analysis: ContextualDifficultyAnalysis = {
      overallScore,
      errorPatterns,
      shouldIntervene,
      interventionPriority: priority,
      interventionMessage,
      suggestedActions,
      detectedAt: now,
      stats
    };

    console.log('📊 [CONTEXTUAL] Análisis completo:', {
      score: overallScore.toFixed(2),
      patterns: errorPatterns.length,
      shouldIntervene,
      priority,
      stats
    });

    return analysis;
  }

  /**
   * Analiza errores repetidos en la misma pregunta
   */
  private analyzeRepeatedMistakes(
    questionId: string,
    attempts: QuestionAttempt[],
    skips: QuestionSkipEvent[]
  ): ErrorPattern | null {
    const incorrectAttempts = attempts.filter(a => !a.isCorrect);
    if (incorrectAttempts.length < this.config.repeatedMistakeThreshold) return null;

    const firstAttempt = attempts[0];
    const uniqueWrongAnswers = new Set(incorrectAttempts.map(a => String(a.selectedAnswer))).size;

    // Analizar si está eligiendo siempre la misma respuesta incorrecta
    const sameWrongAnswer = uniqueWrongAnswers === 1 && incorrectAttempts.length > 1;

    let severity: ErrorPattern['severity'] = 'medium';
    let patternDescription = '';
    let suggestedHelp = '';

    if (sameWrongAnswer) {
      severity = 'high';
      patternDescription = `Eligió la misma respuesta incorrecta ${incorrectAttempts.length} veces`;
      suggestedHelp = 'Parece que hay una confusión conceptual. Necesita revisar el concepto base.';
    } else if (incorrectAttempts.length >= 4) {
      severity = 'critical';
      patternDescription = `Intentó ${incorrectAttempts.length} veces con ${uniqueWrongAnswers} respuestas diferentes`;
      suggestedHelp = 'Usuario completamente perdido. Necesita explicación paso a paso.';
    } else {
      patternDescription = `${incorrectAttempts.length} intentos incorrectos`;
      suggestedHelp = 'Necesita una pista o ejemplo para entender el concepto.';
    }

    return {
      questionId,
      questionText: firstAttempt.questionText,
      errorType: 'repeated_mistake',
      severity,
      attempts,
      skips,
      detectedAt: Date.now(),
      context: {
        totalAttempts: attempts.length,
        uniqueWrongAnswers,
        patternDescription,
        suggestedHelp,
        relatedConcepts: firstAttempt.topic ? [firstAttempt.topic] : [],
        commonMistake: sameWrongAnswer ? `Respuesta ${incorrectAttempts[0].selectedAnswer}` : undefined
      }
    };
  }

  /**
   * Analiza cuando el usuario salta una pregunta después de varios intentos
   */
  private analyzeSkipAfterAttempts(
    questionId: string,
    attempts: QuestionAttempt[],
    skips: QuestionSkipEvent[]
  ): ErrorPattern | null {
    const lastSkip = skips[skips.length - 1];
    const incorrectAttempts = attempts.filter(a => !a.isCorrect);

    if (incorrectAttempts.length === 0) return null;

    const severity: ErrorPattern['severity'] = incorrectAttempts.length >= 3 ? 'critical' : 'high';
    const patternDescription = `Intentó ${incorrectAttempts.length} veces y abandonó la pregunta`;
    const suggestedHelp = 'Usuario frustrado. Necesita intervención inmediata con explicación clara.';

    return {
      questionId,
      questionText: attempts[0].questionText,
      errorType: 'skip_after_attempts',
      severity,
      attempts,
      skips,
      detectedAt: Date.now(),
      context: {
        totalAttempts: attempts.length,
        uniqueWrongAnswers: new Set(incorrectAttempts.map(a => String(a.selectedAnswer))).size,
        patternDescription,
        suggestedHelp,
        relatedConcepts: attempts[0].topic ? [attempts[0].topic] : []
      }
    };
  }

  /**
   * Analiza cuando el usuario salta una pregunta inmediatamente
   */
  private analyzeImmediateSkip(
    questionId: string,
    skips: QuestionSkipEvent[]
  ): ErrorPattern | null {
    const lastSkip = skips[skips.length - 1];

    // Solo considerar skip inmediato si el tiempo fue muy corto
    if (lastSkip.timeSpent > this.config.timeThresholdMs) return null;

    const severity: ErrorPattern['severity'] = 'medium';
    const patternDescription = `Saltó la pregunta en ${(lastSkip.timeSpent / 1000).toFixed(1)}s`;
    const suggestedHelp = 'Pregunta intimidante o no entendida. Necesita simplificación o contexto.';

    return {
      questionId,
      questionText: lastSkip.questionText,
      errorType: 'immediate_skip',
      severity,
      attempts: [],
      skips,
      detectedAt: Date.now(),
      context: {
        totalAttempts: 0,
        uniqueWrongAnswers: 0,
        patternDescription,
        suggestedHelp,
        relatedConcepts: lastSkip.topic ? [lastSkip.topic] : []
      }
    };
  }

  /**
   * Calcula estadísticas generales de la sesión
   */
  private calculateStats(questionIds: Set<string>): ContextualDifficultyAnalysis['stats'] {
    const totalQuestions = questionIds.size;
    const attemptedQuestions = this.attempts.size;
    const skippedQuestions = this.skips.size;

    let totalAttempts = 0;
    let questionsWithMultipleAttempts = 0;
    const topicsDifficulty: Record<string, number> = {};

    this.attempts.forEach((attempts, questionId) => {
      totalAttempts += attempts.length;
      if (attempts.length > 1) {
        questionsWithMultipleAttempts++;
      }

      // Analizar dificultad por tema
      const topic = attempts[0].topic;
      if (topic) {
        const incorrectAttempts = attempts.filter(a => !a.isCorrect).length;
        const difficultyScore = incorrectAttempts / attempts.length;
        topicsDifficulty[topic] = (topicsDifficulty[topic] || 0) + difficultyScore;
      }
    });

    const averageAttemptsPerQuestion = attemptedQuestions > 0 ? totalAttempts / attemptedQuestions : 0;

    return {
      totalQuestions,
      attemptedQuestions,
      skippedQuestions,
      questionsWithMultipleAttempts,
      averageAttemptsPerQuestion,
      topicsDifficulty
    };
  }

  /**
   * Calcula el score general de dificultad
   */
  private calculateOverallScore(
    patterns: ErrorPattern[],
    stats: ContextualDifficultyAnalysis['stats']
  ): number {
    if (patterns.length === 0) return 0;

    const severityWeights = {
      low: 0.25,
      medium: 0.5,
      high: 0.75,
      critical: 1.0
    };

    // Score basado en patrones detectados
    const patternScore = patterns.reduce((sum, pattern) => {
      return sum + severityWeights[pattern.severity];
    }, 0) / patterns.length;

    // Score basado en estadísticas
    const skipRatio = stats.totalQuestions > 0 ? stats.skippedQuestions / stats.totalQuestions : 0;
    const multipleAttemptsRatio = stats.attemptedQuestions > 0
      ? stats.questionsWithMultipleAttempts / stats.attemptedQuestions
      : 0;

    const statsScore = (skipRatio * 0.4) + (multipleAttemptsRatio * 0.6);

    // Combinar scores
    const finalScore = (patternScore * 0.7) + (statsScore * 0.3);

    return Math.min(finalScore, 1);
  }

  /**
   * Determina si se debe intervenir
   */
  private shouldIntervene(
    patterns: ErrorPattern[],
    stats: ContextualDifficultyAnalysis['stats']
  ): { shouldIntervene: boolean; priority: ContextualDifficultyAnalysis['interventionPriority'] } {
    // No intervenir si no hay suficientes datos
    if (stats.totalQuestions < this.config.minimumQuestionsForAnalysis) {
      return { shouldIntervene: false, priority: 'monitor' };
    }

    // Intervención inmediata si hay patrones críticos
    const hasCriticalPattern = patterns.some(p => p.severity === 'critical');
    if (hasCriticalPattern) {
      return { shouldIntervene: true, priority: 'immediate' };
    }

    // Intervención pronto si hay múltiples patrones de alta severidad
    const highSeverityPatterns = patterns.filter(p => p.severity === 'high').length;
    if (highSeverityPatterns >= 2) {
      return { shouldIntervene: true, priority: 'soon' };
    }

    // Intervención si hay muchas preguntas saltadas
    if (stats.skippedQuestions >= this.config.skipThreshold) {
      return { shouldIntervene: true, priority: 'soon' };
    }

    // Intervención si el promedio de intentos es alto
    if (stats.averageAttemptsPerQuestion >= this.config.maxAttemptsBeforeIntervention) {
      return { shouldIntervene: true, priority: 'monitor' };
    }

    return { shouldIntervene: false, priority: 'monitor' };
  }

  /**
   * Genera mensaje de intervención personalizado
   */
  private generateInterventionMessage(
    patterns: ErrorPattern[],
    stats: ContextualDifficultyAnalysis['stats']
  ): string {
    // Priorizar patrón más severo
    const sortedPatterns = [...patterns].sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    const primaryPattern = sortedPatterns[0];

    const messages: Record<ErrorPattern['errorType'], (p: ErrorPattern) => string> = {
      repeated_mistake: (p) =>
        `Veo que has intentado esta pregunta ${p.context.totalAttempts} veces. ${p.context.suggestedHelp} ¿Te gustaría que revisemos juntos el concepto de "${p.context.relatedConcepts[0]}"?`,

      skip_after_attempts: (p) =>
        `Noté que intentaste resolver esta pregunta varias veces y luego la saltaste. Entiendo que puede ser frustrante. ¿Te ayudo a entenderla paso a paso?`,

      immediate_skip: (p) =>
        `Parece que esta pregunta es un poco intimidante. No te preocupes, ¿quieres que la simplifique y te dé algunas pistas?`,

      conceptual_error: (p) =>
        `He detectado un patrón en tus respuestas que sugiere una confusión sobre ${p.context.relatedConcepts.join(', ')}. ¿Te gustaría revisar este concepto?`,

      wrong_category: (p) =>
        `Veo que estás teniendo dificultades con preguntas relacionadas a ${p.context.relatedConcepts[0]}. ¿Revisamos este tema juntos?`
    };

    return messages[primaryPattern.errorType](primaryPattern);
  }

  /**
   * Genera acciones sugeridas basadas en los patrones
   */
  private generateSuggestedActions(
    patterns: ErrorPattern[],
    stats: ContextualDifficultyAnalysis['stats']
  ): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    // Priorizar patrón más severo
    const sortedPatterns = [...patterns].sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    sortedPatterns.forEach(pattern => {
      switch (pattern.errorType) {
        case 'repeated_mistake':
          if (pattern.context.commonMistake) {
            actions.push({
              type: 'show_hint',
              priority: 'high',
              message: `Mostrar por qué la respuesta ${pattern.context.commonMistake} es incorrecta`,
              data: { questionId: pattern.questionId, wrongAnswer: pattern.context.commonMistake }
            });
          }
          actions.push({
            type: 'review_concept',
            priority: 'high',
            message: `Revisar concepto: ${pattern.context.relatedConcepts[0]}`,
            data: { concept: pattern.context.relatedConcepts[0] }
          });
          break;

        case 'skip_after_attempts':
          actions.push({
            type: 'show_example',
            priority: 'high',
            message: 'Mostrar un ejemplo similar resuelto paso a paso',
            data: { questionId: pattern.questionId }
          });
          actions.push({
            type: 'simplify_question',
            priority: 'medium',
            message: 'Simplificar la pregunta o dividirla en partes',
            data: { questionId: pattern.questionId }
          });
          break;

        case 'immediate_skip':
          actions.push({
            type: 'show_hint',
            priority: 'medium',
            message: 'Dar una pista inicial para abordar la pregunta',
            data: { questionId: pattern.questionId }
          });
          break;
      }
    });

    // Si hay muchos errores, sugerir contactar instructor
    if (patterns.length >= 3 || stats.skippedQuestions >= 5) {
      actions.push({
        type: 'contact_instructor',
        priority: 'medium',
        message: 'Considerar contactar al instructor para ayuda personalizada',
        data: { patterns: patterns.length, skipped: stats.skippedQuestions }
      });
    }

    return actions;
  }

  /**
   * Resetea el detector (útil para nuevas sesiones o actividades)
   */
  public reset(): void {
    this.attempts.clear();
    this.skips.clear();
    this.questionStartTimes.clear();
    this.lastInterventionTime = 0;
    this.sessionStartTime = Date.now();
    console.log('🔄 [CONTEXTUAL] Detector reseteado');
  }

  /**
   * Obtiene el historial de intentos de una pregunta específica
   */
  public getQuestionHistory(questionId: string): {
    attempts: QuestionAttempt[];
    skips: QuestionSkipEvent[];
  } {
    return {
      attempts: this.attempts.get(questionId) || [],
      skips: this.skips.get(questionId) || []
    };
  }
}

export const contextualDifficultyDetector = new ContextualDifficultyDetector();
