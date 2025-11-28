/**
 * 🎯 useContextualHelp Hook
 *
 * Hook avanzado que combina detección de patrones de navegación (rrweb)
 * con análisis contextual de errores específicos en actividades.
 *
 * Ofrece ayuda hiperpersonalizada basada en:
 * - Qué pregunta está causando problemas
 * - Qué tipo de error está cometiendo
 * - Cuántas veces ha intentado
 * - Si está saltando preguntas
 *
 * Uso:
 * ```tsx
 * const {
 *   recordAnswer,
 *   recordSkip,
 *   startQuestion,
 *   shouldShowHelp,
 *   helpData,
 *   acceptHelp,
 *   dismissHelp
 * } = useContextualHelp({
 *   activityId: 'activity-123',
 *   onHelpNeeded: (data) => console.log('Ayuda necesaria:', data)
 * });
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ContextualDifficultyDetector,
  type QuestionAttempt,
  type QuestionSkipEvent,
  type ContextualDifficultyAnalysis,
  type ContextualDetectionConfig
} from '../lib/rrweb/contextual-difficulty-detector';
import { useDifficultyDetection } from './useDifficultyDetection';
import {
  generatePersonalizedHelp,
  generateQuickHelpMessage,
  type QuizErrorContext,
  type PersonalizedHelpResponse
} from '../lib/ai/contextual-help-ai';

export interface UseContextualHelpOptions {
  /** ID de la actividad actual */
  activityId: string;

  /** ID del taller/curso (opcional) */
  workshopId?: string;

  /** Si está habilitada la detección (default: true) */
  enabled?: boolean;

  /** Intervalo de análisis en ms (default: 15000 = 15s) */
  analysisInterval?: number;

  /** Configuración del detector contextual */
  detectionConfig?: Partial<ContextualDetectionConfig>;

  /** Callback cuando se detecta que se necesita ayuda */
  onHelpNeeded?: (analysis: ContextualDifficultyAnalysis) => void;

  /** Callback cuando usuario acepta ayuda */
  onHelpAccepted?: (analysis: ContextualDifficultyAnalysis) => void;

  /** Callback cuando usuario rechaza ayuda */
  onHelpDismissed?: (analysis: ContextualDifficultyAnalysis) => void;

  /** Combinar con detección de patrones de navegación (default: true) */
  enableNavigationPatterns?: boolean;

  /** 🆕 Contexto del curso para ayuda más personalizada */
  courseContext?: {
    courseName: string;
    lessonName: string;
    activityName: string;
  };

  /** 🆕 Habilitar ayuda con IA (default: true) */
  enableAIHelp?: boolean;
}

export interface HelpData {
  /** Análisis contextual de errores */
  contextualAnalysis: ContextualDifficultyAnalysis | null;

  /** Tipo de ayuda recomendada */
  helpType: 'hint' | 'example' | 'concept_review' | 'simplification' | 'instructor_contact' | null;

  /** Pregunta específica que necesita ayuda */
  targetQuestionId: string | null;

  /** Mensaje personalizado de ayuda */
  message: string;

  /** Recursos recomendados */
  recommendedActions: Array<{
    type: string;
    label: string;
    action: () => void;
  }>;

  /** 🆕 Respuesta hiperpersonalizada de IA */
  aiHelp?: PersonalizedHelpResponse;

  /** 🆕 Contexto completo del error */
  errorContext?: QuizErrorContext;
}

export interface UseContextualHelpReturn {
  /** Registrar cuando usuario comienza una pregunta */
  startQuestion: (questionId: string) => void;

  /** Registrar un intento de respuesta */
  recordAnswer: (params: {
    questionId: string;
    questionText: string;
    questionType: QuestionAttempt['questionType'];
    selectedAnswer: string | number;
    correctAnswer: string | number;
    isCorrect: boolean;
    topic?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }) => void;

  /** Registrar cuando usuario salta una pregunta */
  recordSkip: (params: {
    questionId: string;
    questionText: string;
    questionType: string;
    skipReason: 'blank' | 'incomplete' | 'abandoned';
    topic?: string;
  }) => void;

  /** Si se debe mostrar ayuda */
  shouldShowHelp: boolean;

  /** Datos de la ayuda recomendada */
  helpData: HelpData | null;

  /** Aceptar la ayuda ofrecida */
  acceptHelp: () => void;

  /** Rechazar la ayuda ofrecida */
  dismissHelp: () => void;

  /** Resetear el sistema */
  reset: () => void;

  /** Si el sistema está activo */
  isActive: boolean;

  /** Análisis actual */
  currentAnalysis: ContextualDifficultyAnalysis | null;
}

export function useContextualHelp(
  options: UseContextualHelpOptions
): UseContextualHelpReturn {
  const {
    activityId,
    workshopId,
    enabled = true,
    analysisInterval = 15000, // 15 segundos
    detectionConfig,
    onHelpNeeded,
    onHelpAccepted,
    onHelpDismissed,
    enableNavigationPatterns = true,
    courseContext,
    enableAIHelp = true
  } = options;

  const [shouldShowHelp, setShouldShowHelp] = useState(false);
  const [helpData, setHelpData] = useState<HelpData | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<ContextualDifficultyAnalysis | null>(null);
  const [isActive, setIsActive] = useState(false);

  const detectorRef = useRef<ContextualDifficultyDetector | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastInterventionTimeRef = useRef<number>(0);
  const lastErrorContextRef = useRef<QuizErrorContext | null>(null); // 🆕 Almacenar último error

  // Integrar con detección de patrones de navegación (rrweb)
  const navigationDetection = useDifficultyDetection({
    workshopId,
    activityId,
    enabled: enabled && enableNavigationPatterns,
    checkInterval: 30000, // 30 segundos
    onDifficultyDetected: (analysis) => {
      console.log('🌐 [NAVIGATION] Patrón de navegación detectado:', analysis);
      // La ayuda será manejada por el análisis contextual
    }
  });

  // Inicializar detector contextual
  useEffect(() => {
    if (enabled) {
      detectorRef.current = new ContextualDifficultyDetector(detectionConfig);
      setIsActive(true);
      console.log('🎯 [CONTEXTUAL] Sistema de ayuda contextual inicializado', {
        activityId,
        workshopId,
        analysisInterval,
        enableNavigationPatterns
      });
    } else {
      setIsActive(false);
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [enabled, activityId, workshopId, analysisInterval, enableNavigationPatterns, detectionConfig]);

  // Función para analizar y determinar si se necesita ayuda
  const analyzeAndDetect = useCallback(() => {
    if (!enabled || !detectorRef.current) return;

    try {
      const analysis = detectorRef.current.analyze();
      setCurrentAnalysis(analysis);

      console.log('📊 [CONTEXTUAL] Análisis completado:', {
        score: analysis.overallScore.toFixed(2),
        patterns: analysis.errorPatterns.length,
        shouldIntervene: analysis.shouldIntervene,
        priority: analysis.interventionPriority
      });

      // Cooldown de 3 minutos entre intervenciones
      const timeSinceLastIntervention = Date.now() - lastInterventionTimeRef.current;
      const minTimeBetweenInterventions = 3 * 60 * 1000; // 3 minutos

      if (analysis.shouldIntervene && timeSinceLastIntervention > minTimeBetweenInterventions) {
        const helpDataToShow = generateHelpData(analysis, lastErrorContextRef.current);
        setHelpData(helpDataToShow);
        setShouldShowHelp(true);
        lastInterventionTimeRef.current = Date.now();

        console.log('🆘 [CONTEXTUAL] Ayuda necesaria!', {
          priority: analysis.interventionPriority,
          message: analysis.interventionMessage,
          actions: analysis.suggestedActions.length,
          hasAIHelp: !!helpDataToShow.aiHelp
        });

        if (onHelpNeeded) {
          onHelpNeeded(analysis);
        }
      } else if (analysis.shouldIntervene) {
        console.log('⏳ [CONTEXTUAL] Ayuda detectada pero esperando cooldown', {
          timeSinceLastIntervention: `${Math.floor(timeSinceLastIntervention / 1000)}s`,
          cooldownRemaining: `${Math.floor((minTimeBetweenInterventions - timeSinceLastIntervention) / 1000)}s`
        });
      }
    } catch (error) {
      console.error('❌ [CONTEXTUAL] Error al analizar:', error);
    }
  }, [enabled, onHelpNeeded]);

  // Análisis periódico
  useEffect(() => {
    if (!enabled) return;

    // Análisis inicial después de 10 segundos
    const initialTimeout = setTimeout(() => {
      analyzeAndDetect();
    }, 10000);

    // Análisis periódico
    analysisIntervalRef.current = setInterval(() => {
      analyzeAndDetect();
    }, analysisInterval);

    return () => {
      clearTimeout(initialTimeout);
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [enabled, analysisInterval, analyzeAndDetect]);

  // Función para comenzar una pregunta
  const startQuestion = useCallback((questionId: string) => {
    if (!detectorRef.current) return;
    detectorRef.current.startQuestion(questionId);
  }, []);

  // Función para registrar una respuesta
  const recordAnswer = useCallback(async (params: {
    questionId: string;
    questionText: string;
    questionType: QuestionAttempt['questionType'];
    selectedAnswer: string | number;
    correctAnswer: string | number;
    isCorrect: boolean;
    topic?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    options?: Array<{ id: string | number; text: string }>; // 🆕 Opciones del quiz
  }) => {
    if (!detectorRef.current) return;

    detectorRef.current.recordAttempt({
      questionId: params.questionId,
      questionText: params.questionText,
      questionType: params.questionType,
      selectedAnswer: params.selectedAnswer,
      correctAnswer: params.correctAnswer,
      isCorrect: params.isCorrect,
      topic: params.topic,
      difficulty: params.difficulty
    });

    // Si es incorrecto, generar ayuda con IA y analizar inmediatamente
    if (!params.isCorrect) {
      console.log('❌ [CONTEXTUAL] Respuesta incorrecta detectada');

      // 🆕 Obtener historial de la pregunta
      const history = detectorRef.current.getQuestionHistory(params.questionId);
      const attemptNumber = history.attempts.length;

      // 🆕 Construir contexto del error
      const errorContext: QuizErrorContext = {
        questionId: params.questionId,
        questionText: params.questionText,
        questionType: params.questionType,
        selectedAnswer: params.selectedAnswer,
        correctAnswer: params.correctAnswer,
        options: params.options,
        topic: params.topic,
        difficulty: params.difficulty,
        attemptNumber,
        previousAttempts: history.attempts.slice(0, -1).map(a => ({
          selectedAnswer: a.selectedAnswer,
          timestamp: a.timestamp
        })),
        courseContext
      };

      lastErrorContextRef.current = errorContext;

      // 🆕 Generar ayuda con IA si está habilitada
      if (enableAIHelp) {
        console.log('🤖 [CONTEXTUAL] Generando ayuda personalizada con IA...');
        try {
          const aiHelp = await generatePersonalizedHelp(errorContext, {
            detailLevel: attemptNumber > 2 ? 'comprehensive' : 'detailed',
            includeExample: true,
            includeStepByStep: attemptNumber > 1
          });

          console.log('✅ [CONTEXTUAL] Ayuda IA generada:', aiHelp);

          // Actualizar helpData con la ayuda de IA
          setHelpData(prev => ({
            ...prev!,
            aiHelp,
            errorContext,
            message: generateQuickHelpMessage(errorContext)
          }));

        } catch (error) {
          console.error('❌ [CONTEXTUAL] Error al generar ayuda con IA:', error);
        }
      }

      // Analizar inmediatamente
      setTimeout(() => analyzeAndDetect(), 1000);
    }
  }, [analyzeAndDetect, courseContext, enableAIHelp]);

  // Función para registrar un skip
  const recordSkip = useCallback((params: {
    questionId: string;
    questionText: string;
    questionType: string;
    skipReason: 'blank' | 'incomplete' | 'abandoned';
    topic?: string;
  }) => {
    if (!detectorRef.current) return;

    detectorRef.current.recordSkip({
      questionId: params.questionId,
      questionText: params.questionText,
      questionType: params.questionType,
      skipReason: params.skipReason,
      topic: params.topic
    });

    // Analizar inmediatamente después de un skip
    console.log('⏭️ [CONTEXTUAL] Pregunta saltada, analizando...');
    setTimeout(() => analyzeAndDetect(), 1000);
  }, [analyzeAndDetect]);

  // Función para aceptar ayuda
  const acceptHelp = useCallback(() => {
    console.log('✅ [CONTEXTUAL] Usuario aceptó ayuda');
    setShouldShowHelp(false);

    if (currentAnalysis && onHelpAccepted) {
      onHelpAccepted(currentAnalysis);
    }

    // No resetear helpData para que el componente pueda usarla
  }, [currentAnalysis, onHelpAccepted]);

  // Función para rechazar ayuda
  const dismissHelp = useCallback(() => {
    console.log('❌ [CONTEXTUAL] Usuario rechazó ayuda');
    setShouldShowHelp(false);
    setHelpData(null);

    if (currentAnalysis && onHelpDismissed) {
      onHelpDismissed(currentAnalysis);
    }
  }, [currentAnalysis, onHelpDismissed]);

  // Función para resetear
  const reset = useCallback(() => {
    console.log('🔄 [CONTEXTUAL] Reseteando sistema de ayuda contextual');
    if (detectorRef.current) {
      detectorRef.current.reset();
    }
    setShouldShowHelp(false);
    setHelpData(null);
    setCurrentAnalysis(null);
    lastInterventionTimeRef.current = 0;

    // También resetear la detección de navegación
    if (navigationDetection.reset) {
      navigationDetection.reset();
    }
  }, [navigationDetection]);

  return {
    startQuestion,
    recordAnswer,
    recordSkip,
    shouldShowHelp,
    helpData,
    acceptHelp,
    dismissHelp,
    reset,
    isActive,
    currentAnalysis
  };
}

/**
 * Genera datos de ayuda personalizados basados en el análisis
 */
function generateHelpData(
  analysis: ContextualDifficultyAnalysis,
  errorContext: QuizErrorContext | null
): HelpData {
  // Encontrar el patrón más severo
  const sortedPatterns = [...analysis.errorPatterns].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  const primaryPattern = sortedPatterns[0];
  const primaryAction = analysis.suggestedActions[0];

  if (!primaryPattern || !primaryAction) {
    return {
      contextualAnalysis: analysis,
      helpType: null,
      targetQuestionId: null,
      message: 'Parece que estás teniendo algunas dificultades. ¿Te gustaría ayuda?',
      recommendedActions: [],
      errorContext: errorContext || undefined
    };
  }

  // Mapear tipo de acción a tipo de ayuda
  const helpTypeMap: Record<typeof primaryAction.type, HelpData['helpType']> = {
    show_hint: 'hint',
    review_concept: 'concept_review',
    show_example: 'example',
    simplify_question: 'simplification',
    contact_instructor: 'instructor_contact'
  };

  const helpType = helpTypeMap[primaryAction.type];

  return {
    contextualAnalysis: analysis,
    helpType,
    targetQuestionId: primaryPattern.questionId,
    message: analysis.interventionMessage,
    recommendedActions: analysis.suggestedActions.map(action => ({
      type: action.type,
      label: getActionLabel(action.type),
      action: () => console.log('Acción ejecutada:', action)
    })),
    errorContext: errorContext || undefined
    // aiHelp se agregará dinámicamente cuando esté disponible
  };
}

/**
 * Obtiene etiqueta legible para cada tipo de acción
 */
function getActionLabel(actionType: string): string {
  const labels: Record<string, string> = {
    show_hint: '💡 Ver pista',
    review_concept: '📚 Revisar concepto',
    show_example: '📝 Ver ejemplo',
    simplify_question: '🔍 Simplificar pregunta',
    contact_instructor: '👨‍🏫 Contactar instructor'
  };

  return labels[actionType] || actionType;
}
