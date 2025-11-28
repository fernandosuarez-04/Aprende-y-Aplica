/**
 * 📖 EJEMPLO DE INTEGRACIÓN EN /learn page.tsx
 *
 * Este archivo muestra cómo integrar el sistema de ayuda contextual
 * en la página de /learn existente.
 *
 * NOTA: Este es un EJEMPLO simplificado. Adapta según tu implementación.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
// ... tus otros imports existentes ...

// ✨ NUEVOS IMPORTS
import { useContextualHelp } from '@/hooks/useContextualHelp';
import { ContextualHelpDialog } from '@/features/courses/components/ContextualHelpDialog';

export default function LearnPage({ params }: { params: { slug: string } }) {
  // ============================================
  // 🔹 TUS ESTADOS EXISTENTES (ejemplo)
  // ============================================
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLiaExpanded, setIsLiaExpanded] = useState(false);

  // ============================================
  // ✨ NUEVO: Sistema de Ayuda Contextual
  // ============================================
  const contextualHelp = useContextualHelp({
    activityId: currentActivity?.activity_id || '',
    workshopId: params.slug,
    enabled: !!currentActivity && currentActivity.activity_type === 'quiz', // Solo en quizzes
    analysisInterval: 15000, // Analizar cada 15 segundos

    // Configuración personalizada (opcional)
    detectionConfig: {
      maxAttemptsBeforeIntervention: 3,    // Intervenir después de 3 intentos fallidos
      skipThreshold: 2,                     // Intervenir después de 2 preguntas saltadas
      repeatedMistakeThreshold: 2,          // Detectar mismo error 2 veces
      timeThresholdMs: 5000,                // 5 segundos = skip rápido
    },

    // Callback cuando se detecta necesidad de ayuda
    onHelpNeeded: (analysis) => {
      console.log('🆘 [HELP] Ayuda detectada:', {
        score: analysis.overallScore,
        priority: analysis.interventionPriority,
        patterns: analysis.errorPatterns.length,
        stats: analysis.stats
      });

      // Opcional: Analytics
      // trackEvent('contextual_help_shown', {
      //   activityId: currentActivity?.activity_id,
      //   score: analysis.overallScore,
      //   priority: analysis.interventionPriority
      // });
    },

    // Callback cuando usuario acepta ayuda
    onHelpAccepted: (analysis) => {
      console.log('✅ [HELP] Usuario aceptó ayuda');

      // Abrir LIA con contexto específico
      if (analysis.errorPatterns.length > 0) {
        const pattern = analysis.errorPatterns[0];

        // Generar mensaje contextual para LIA
        const liaMessage = `
Hola, necesito ayuda con esta pregunta:

"${pattern.questionText}"

He intentado ${pattern.context.totalAttempts} veces y no logro entenderla.

${pattern.context.suggestedHelp}

¿Puedes explicármelo de manera más clara?
        `.trim();

        // Abrir LIA
        setIsLiaExpanded(true);

        // Enviar mensaje a LIA (adapta según tu implementación)
        // sendMessageToLIA(liaMessage);

        console.log('💬 Mensaje para LIA:', liaMessage);
      }

      // Opcional: Analytics
      // trackEvent('contextual_help_accepted', {
      //   activityId: currentActivity?.activity_id,
      //   pattern: analysis.errorPatterns[0]?.errorType
      // });
    },

    // Callback cuando usuario rechaza ayuda
    onHelpDismissed: (analysis) => {
      console.log('❌ [HELP] Usuario rechazó ayuda');

      // Opcional: Analytics
      // trackEvent('contextual_help_dismissed', {
      //   activityId: currentActivity?.activity_id
      // });
    }
  });

  // ============================================
  // 🔹 EFECTO: Iniciar pregunta actual
  // ============================================
  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion?.id) {
      console.log('🏁 [HELP] Iniciando pregunta:', currentQuestion.id);
      contextualHelp.startQuestion(currentQuestion.id);
    }
  }, [currentQuestionIndex, questions, contextualHelp.startQuestion]);

  // ============================================
  // 🔹 EFECTO: Reset al cambiar actividad
  // ============================================
  useEffect(() => {
    if (currentActivity?.activity_id) {
      console.log('🔄 [HELP] Nueva actividad, reseteando sistema');
      contextualHelp.reset();
      setSelectedAnswers({});
      setShowResults(false);
      setCurrentQuestionIndex(0);
    }
  }, [currentActivity?.activity_id, contextualHelp.reset]);

  // ============================================
  // ✨ MODIFICADO: handleAnswerSelect
  // ============================================
  const handleAnswerSelect = useCallback((questionId: string, answer: string | number) => {
    // 1. Tu lógica existente
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // 2. NUEVO: Registrar intento en el sistema de ayuda
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const isCorrect = question.correct_answer === answer;

      console.log('📝 [HELP] Registrando respuesta:', {
        questionId,
        isCorrect,
        attempt: Object.keys(selectedAnswers).filter(id => id === questionId).length + 1
      });

      contextualHelp.recordAnswer({
        questionId,
        questionText: question.question_text || question.text || '',
        questionType: question.question_type || 'multiple_choice',
        selectedAnswer: answer,
        correctAnswer: question.correct_answer,
        isCorrect,
        topic: question.topic || question.category,
        difficulty: question.difficulty || 'medium'
      });

      // Si es correcto, avanzar automáticamente (opcional)
      if (isCorrect && !showResults) {
        setTimeout(() => {
          goToNextQuestion();
        }, 1000);
      }
    }
  }, [questions, selectedAnswers, showResults, contextualHelp.recordAnswer]);

  // ============================================
  // ✨ NUEVO: handleSkipQuestion
  // ============================================
  const handleSkipQuestion = useCallback(() => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const questionId = currentQuestion.id;
    const hadAttempts = selectedAnswers[questionId] !== undefined;

    console.log('⏭️ [HELP] Saltando pregunta:', {
      questionId,
      hadAttempts,
      skipReason: hadAttempts ? 'abandoned' : 'blank'
    });

    // Registrar skip
    contextualHelp.recordSkip({
      questionId,
      questionText: currentQuestion.question_text || currentQuestion.text || '',
      questionType: currentQuestion.question_type || 'multiple_choice',
      skipReason: hadAttempts ? 'abandoned' : 'blank',
      topic: currentQuestion.topic || currentQuestion.category
    });

    // Ir a siguiente pregunta
    goToNextQuestion();
  }, [questions, currentQuestionIndex, selectedAnswers, contextualHelp.recordSkip]);

  // ============================================
  // 🔹 HELPER: Ir a siguiente pregunta
  // ============================================
  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Fin del quiz
      setShowResults(true);
    }
  }, [currentQuestionIndex, questions.length]);

  // ============================================
  // ✨ NUEVO: Manejar acciones del diálogo de ayuda
  // ============================================
  const handleHelpAction = useCallback((actionType: string, data?: any) => {
    console.log('🎯 [HELP] Acción ejecutada:', actionType, data);

    switch (actionType) {
      case 'show_hint':
        // TODO: Implementar mostrar pista
        // Podrías tener pistas almacenadas en la DB por pregunta
        alert('💡 Pista: Revisa el material de la sección anterior');
        break;

      case 'review_concept':
        // TODO: Abrir material relacionado
        // Podrías tener links a secciones del curso
        console.log('📚 Abrir concepto:', data?.concept);
        // setCurrentLessonId(conceptLessonId);
        break;

      case 'show_example':
        // TODO: Mostrar ejemplo similar
        alert('📝 Aquí va un ejemplo similar resuelto paso a paso');
        break;

      case 'simplify_question':
        // TODO: Mostrar versión simplificada
        alert('🔍 Te muestro la pregunta de manera más sencilla');
        break;

      case 'contact_instructor':
        // TODO: Abrir chat con instructor
        alert('👨‍🏫 Contactando al instructor...');
        break;

      default:
        console.log('Acción no reconocida:', actionType);
    }
  }, []);

  // ============================================
  // 🔹 TU RENDER EXISTENTE
  // ============================================
  return (
    <div className="learn-page">
      {/* Tu UI existente */}

      {/* Ejemplo de área de preguntas */}
      {currentActivity?.activity_type === 'quiz' && questions.length > 0 && (
        <div className="quiz-container">
          <h2>Pregunta {currentQuestionIndex + 1} de {questions.length}</h2>

          {/* Pregunta actual */}
          <div className="question">
            <p>{questions[currentQuestionIndex]?.question_text}</p>

            {/* Opciones */}
            <div className="options">
              {questions[currentQuestionIndex]?.options?.map((option: any, index: number) => {
                const questionId = questions[currentQuestionIndex].id;
                const isSelected = selectedAnswers[questionId] === index;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(questionId, index)}
                    className={`option ${isSelected ? 'selected' : ''}`}
                    disabled={showResults}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {/* ✨ NUEVO: Botón para saltar pregunta */}
            {!showResults && (
              <button
                onClick={handleSkipQuestion}
                className="skip-button text-gray-500 hover:text-gray-700 mt-4"
              >
                ⏭️ Saltar pregunta
              </button>
            )}
          </div>

          {/* Navegación */}
          <div className="quiz-navigation">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              ← Anterior
            </button>
            <button
              onClick={goToNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* ✨ NUEVO: Diálogo de Ayuda Contextual */}
      <ContextualHelpDialog
        isOpen={contextualHelp.shouldShowHelp}
        onClose={contextualHelp.dismissHelp}
        onAccept={contextualHelp.acceptHelp}
        helpData={contextualHelp.helpData}
        onActionClick={handleHelpAction}
      />

      {/* DEBUG: Mostrar estado actual (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg text-xs max-w-xs">
          <h4 className="font-bold mb-2">🔧 Debug - Ayuda Contextual</h4>
          <p>Activo: {contextualHelp.isActive ? '✅' : '❌'}</p>
          <p>Mostrar ayuda: {contextualHelp.shouldShowHelp ? '✅' : '❌'}</p>
          {contextualHelp.currentAnalysis && (
            <>
              <p>Score: {(contextualHelp.currentAnalysis.overallScore * 100).toFixed(0)}%</p>
              <p>Patrones: {contextualHelp.currentAnalysis.errorPatterns.length}</p>
              <p>Preguntas: {contextualHelp.currentAnalysis.stats.totalQuestions}</p>
              <p>Saltadas: {contextualHelp.currentAnalysis.stats.skippedQuestions}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 📝 NOTAS DE IMPLEMENTACIÓN
// ============================================

/*
1. ADAPTACIONES NECESARIAS:
   - Ajusta los nombres de propiedades según tu estructura de datos
   - Reemplaza 'question.correct_answer' con tu campo real
   - Adapta 'sendMessageToLIA()' según tu implementación

2. DATOS REQUERIDOS POR PREGUNTA:
   - id (string)
   - question_text o text (string)
   - question_type (string: 'multiple_choice', 'true_false', etc.)
   - correct_answer (string | number)
   - topic o category (string, opcional pero recomendado)
   - difficulty (string: 'easy' | 'medium' | 'hard', opcional)

3. MEJORAS OPCIONALES:
   - Agregar analytics para trackear uso
   - Implementar acciones reales (show_hint, review_concept, etc.)
   - Conectar con tu sistema de mensajería/LIA
   - Guardar historial de ayuda en DB
   - Notificar instructor en casos críticos

4. TESTING:
   - Prueba con diferentes patrones:
     * Responder 3 veces incorrectamente la misma pregunta
     * Saltar 2 preguntas sin intentar
     * Intentar varias veces y luego saltar
   - Verifica logs en consola ([HELP], [CONTEXTUAL])
   - Revisa el debug panel en desarrollo

5. PERFORMANCE:
   - El análisis se ejecuta cada 15 segundos (configurable)
   - Cooldown de 3 minutos entre intervenciones
   - No afecta el rendimiento de la UI principal
*/
