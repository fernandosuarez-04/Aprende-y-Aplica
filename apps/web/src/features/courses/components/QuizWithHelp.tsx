'use client';

/**
 * 📝 QuizWithHelp Component
 *
 * Componente de quiz inteligente que integra el sistema completo de ayuda contextual con IA.
 *
 * Características:
 * - Detección automática de errores
 * - Análisis con IA de errores específicos
 * - Ayuda hiperpersonalizada automática
 * - Tracking de intentos y patrones
 * - UI intuitiva y accesible
 *
 * Uso:
 * ```tsx
 * <QuizWithHelp
 *   questions={questions}
 *   activityId="activity-123"
 *   workshopId="workshop-456"
 *   courseContext={{
 *     courseName: "Curso de IA",
 *     lessonName: "Introducción",
 *     activityName: "Quiz 1"
 *   }}
 * />
 * ```
 */

import { useState } from 'react';
import { useContextualHelp } from '@/hooks/useContextualHelp';
import { ContextualHelpDialog } from './ContextualHelpDialog';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import type { QuizErrorContext } from '@/lib/ai/contextual-help-ai';

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false';
  options: Array<{
    id: string | number;
    text: string;
  }>;
  correctAnswer: string | number;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

export interface QuizWithHelpProps {
  /** Lista de preguntas del quiz */
  questions: QuizQuestion[];

  /** ID de la actividad */
  activityId: string;

  /** ID del taller/curso */
  workshopId?: string;

  /** Contexto del curso */
  courseContext?: {
    courseName: string;
    lessonName: string;
    activityName: string;
  };

  /** Callback cuando se completa el quiz */
  onComplete?: (score: number) => void;

  /** Habilitar ayuda con IA (default: true) */
  enableAIHelp?: boolean;

  /** 🆕 Callback cuando se detectan respuestas incorrectas (para envío automático a LIA) */
  onIncorrectAnswersDetected?: (incorrectAnswers: QuizErrorContext[]) => void | Promise<void>;
}

export function QuizWithHelp({
  questions,
  activityId,
  workshopId,
  courseContext,
  onComplete,
  enableAIHelp = true,
  onIncorrectAnswersDetected
}: QuizWithHelpProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | number>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);

  // 🎯 Sistema de ayuda contextual
  const contextualHelp = useContextualHelp({
    activityId,
    workshopId,
    enabled: true,
    courseContext,
    enableAIHelp,
    analysisInterval: 15000, // Analizar cada 15 segundos
    detectionConfig: {
      maxAttemptsBeforeIntervention: 1, // 🔥 Ayuda inmediata en el primer error
      skipThreshold: 2,
      repeatedMistakeThreshold: 1, // Detectar errores repetidos más rápido
      timeThresholdMs: 5000
    },
    onHelpNeeded: (analysis) => {
      console.log('🆘 Ayuda necesaria detectada:', analysis);
    },
    onHelpAccepted: (analysis) => {
      console.log('✅ Usuario aceptó ayuda:', analysis);
    },
    // 🆕 Pasar el callback para envío automático a LIA
    onIncorrectAnswersDetected
  });

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Iniciar pregunta cuando cambia
  useState(() => {
    if (currentQuestion) {
      contextualHelp.startQuestion(currentQuestion.id);
    }
  });

  /**
   * Maneja la selección de una respuesta
   */
  const handleAnswerSelect = async (answerId: string | number) => {
    if (!currentQuestion) return;

    const isCorrect = answerId === currentQuestion.correctAnswer;

    // Actualizar respuesta del usuario
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerId
    }));

    // Marcar como respondida
    setAnsweredQuestions(prev => new Set([...prev, currentQuestion.id]));

    // 🔥 REGISTRAR RESPUESTA EN EL SISTEMA DE AYUDA CONTEXTUAL
    await contextualHelp.recordAnswer({
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      questionType: currentQuestion.type,
      selectedAnswer: answerId,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      topic: currentQuestion.topic,
      difficulty: currentQuestion.difficulty,
      options: currentQuestion.options
    });

    console.log(isCorrect ? '✅ Respuesta correcta!' : '❌ Respuesta incorrecta');
  };

  /**
   * Navega a la siguiente pregunta
   */
  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Calcular score y mostrar resultados
      const correctAnswers = questions.filter(q =>
        userAnswers[q.id] === q.correctAnswer
      ).length;
      const score = (correctAnswers / questions.length) * 100;

      setShowResults(true);

      if (onComplete) {
        onComplete(score);
      }
    } else {
      // Siguiente pregunta
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      // Iniciar nueva pregunta en el sistema de ayuda
      if (questions[nextIndex]) {
        contextualHelp.startQuestion(questions[nextIndex].id);
      }
    }
  };

  /**
   * Salta la pregunta actual
   */
  const handleSkipQuestion = () => {
    if (!currentQuestion) return;

    // Registrar skip en el sistema de ayuda
    contextualHelp.recordSkip({
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      questionType: currentQuestion.type,
      skipReason: 'abandoned',
      topic: currentQuestion.topic
    });

    handleNextQuestion();
  };

  /**
   * Resetea el quiz completo
   */
  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setAnsweredQuestions(new Set());
    setShowResults(false);
    contextualHelp.reset();
  };

  /**
   * Permite reintentar la pregunta actual después de recibir ayuda
   */
  const handleRetryCurrentQuestion = () => {
    if (!currentQuestion) return;

    // Eliminar la respuesta actual
    const newAnswers = { ...userAnswers };
    delete newAnswers[currentQuestion.id];
    setUserAnswers(newAnswers);

    // Remover de preguntas respondidas
    const newAnsweredQuestions = new Set(answeredQuestions);
    newAnsweredQuestions.delete(currentQuestion.id);
    setAnsweredQuestions(newAnsweredQuestions);

    // Cerrar el dialog de ayuda
    contextualHelp.dismissHelp();

    console.log('🔄 Reintentando pregunta:', currentQuestion.id);
  };

  // Calcular progreso
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (showResults) {
    const correctAnswers = questions.filter(q =>
      userAnswers[q.id] === q.correctAnswer
    ).length;
    const score = (correctAnswers / questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Quiz Completado 🎉
          </h2>

          <div className="mb-6">
            <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(score)}%
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {correctAnswers} de {questions.length} correctas
            </p>
          </div>

          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Reintentar Quiz
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">No hay preguntas disponibles</p>
        </div>
      </div>
    );
  }

  const isAnswered = answeredQuestions.has(currentQuestion.id);
  const userAnswer = userAnswers[currentQuestion.id];
  const isCorrect = userAnswer === currentQuestion.correctAnswer;

  return (
    <>
      <div className="max-w-2xl mx-auto p-6">
        {/* Barra de progreso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Pregunta {currentQuestionIndex + 1} de {questions.length}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pregunta */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
          {/* Topic badge */}
          {currentQuestion.topic && (
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-medium rounded-full">
                {currentQuestion.topic}
              </span>
            </div>
          )}

          {/* Texto de la pregunta */}
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {currentQuestion.text}
          </h3>

          {/* Opciones */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = userAnswer === option.id;
              const isCorrectOption = option.id === currentQuestion.correctAnswer;

              let optionClasses = 'w-full p-4 text-left border-2 rounded-lg transition-all ';

              if (!isAnswered) {
                // No respondida aún
                optionClasses += 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20';
              } else if (isSelected) {
                if (isCorrect) {
                  // Seleccionada y correcta
                  optionClasses += 'border-green-500 bg-green-50 dark:bg-green-900/20';
                } else {
                  // Seleccionada pero incorrecta
                  optionClasses += 'border-red-500 bg-red-50 dark:bg-red-900/20';
                }
              } else if (isCorrectOption && isAnswered) {
                // Mostrar respuesta correcta si falló
                optionClasses += 'border-green-300 bg-green-50 dark:bg-green-900/10';
              } else {
                optionClasses += 'border-gray-200 dark:border-gray-700 opacity-50';
              }

              return (
                <button
                  key={option.id}
                  onClick={() => !isAnswered && handleAnswerSelect(option.id)}
                  disabled={isAnswered}
                  className={optionClasses}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-white">{option.text}</span>

                    {isAnswered && isSelected && (
                      <div>
                        {isCorrect ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircleIcon className="h-6 w-6 text-red-600" />
                        )}
                      </div>
                    )}

                    {isAnswered && !isSelected && isCorrectOption && (
                      <CheckCircleIcon className="h-6 w-6 text-green-600 opacity-50" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explicación (si está disponible y respondió) */}
          {isAnswered && currentQuestion.explanation && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                💡 Explicación
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Botones de navegación */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkipQuestion}
            disabled={!isAnswered}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isAnswered
                ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            {isAnswered ? 'Saltar' : 'Responde primero'}
          </button>

          <button
            onClick={handleNextQuestion}
            disabled={!isAnswered}
            className={`px-6 py-2 font-medium rounded-lg transition-colors ${
              isAnswered
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLastQuestion ? 'Ver Resultados' : 'Siguiente'}
          </button>
        </div>
      </div>

      {/* 🆘 Diálogo de Ayuda Contextual */}
      <ContextualHelpDialog
        isOpen={contextualHelp.shouldShowHelp}
        onClose={contextualHelp.dismissHelp}
        onAccept={contextualHelp.acceptHelp}
        helpData={contextualHelp.helpData}
        onRetry={handleRetryCurrentQuestion} // 🆕 Permite reintentar la pregunta
        onActionClick={(actionType, data) => {
          console.log('Acción clickeada:', actionType, data);
        }}
      />
    </>
  );
}
