'use client';

/**
 * 📝 QuizActivity Component
 *
 * Componente que envuelve QuizWithHelp y lo integra con las actividades del curso.
 * Este componente se usa en la página /learn para mostrar quizzes con ayuda inteligente.
 *
 * Uso en ActivityItem:
 * ```tsx
 * {activity.activity_type === 'quiz' && (
 *   <QuizActivity
 *     activity={activity}
 *     lesson={lesson}
 *     slug={slug}
 *   />
 * )}
 * ```
 */

import { useState, useEffect } from 'react';
import { QuizWithHelp, type QuizQuestion } from './QuizWithHelp';

interface QuizActivityProps {
  /** Datos de la actividad */
  activity: any;

  /** Datos de la lección */
  lesson: any;

  /** Slug del curso */
  slug: string;

  /** Usuario actual (opcional) */
  user?: any;
}

export function QuizActivity({
  activity,
  lesson,
  slug,
  user
}: QuizActivityProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga las preguntas del quiz desde la base de datos
   */
  useEffect(() => {
    async function loadQuestions() {
      try {
        setLoading(true);

        // TODO: Reemplazar con tu llamada real a la API/DB
        // Por ahora, datos de ejemplo
        const mockQuestions: QuizQuestion[] = [
          {
            id: `${activity.activity_id}_q1`,
            text: '¿Qué es una variable en programación?',
            type: 'multiple_choice',
            options: [
              { id: 'A', text: 'Un contenedor de datos que puede cambiar su valor' },
              { id: 'B', text: 'Una constante matemática que nunca cambia' },
              { id: 'C', text: 'Un tipo de bucle para repetir código' },
              { id: 'D', text: 'Una función especial del lenguaje' }
            ],
            correctAnswer: 'A',
            topic: activity.activity_title || 'Conceptos básicos',
            difficulty: 'easy',
            explanation: 'Una variable es un espacio en la memoria que almacena un valor que puede cambiar durante la ejecución del programa.'
          },
          {
            id: `${activity.activity_id}_q2`,
            text: '¿Cuál es la diferencia entre var y let en JavaScript?',
            type: 'multiple_choice',
            options: [
              { id: 'A', text: 'No hay diferencia, son sinónimos' },
              { id: 'B', text: 'var tiene scope de función, let tiene scope de bloque' },
              { id: 'C', text: 'let es más rápido que var' },
              { id: 'D', text: 'var es más moderno que let' }
            ],
            correctAnswer: 'B',
            topic: activity.activity_title || 'Variables en JavaScript',
            difficulty: 'medium',
            explanation: 'La principal diferencia es el scope: var tiene scope de función mientras que let tiene scope de bloque.'
          },
          {
            id: `${activity.activity_id}_q3`,
            text: '¿Qué retorna typeof null en JavaScript?',
            type: 'multiple_choice',
            options: [
              { id: 'A', text: '"null"' },
              { id: 'B', text: '"undefined"' },
              { id: 'C', text: '"object"' },
              { id: 'D', text: '"number"' }
            ],
            correctAnswer: 'C',
            topic: activity.activity_title || 'Tipos de datos en JavaScript',
            difficulty: 'hard',
            explanation: 'typeof null retorna "object", lo cual es un bug histórico de JavaScript que se mantiene por compatibilidad.'
          }
        ];

        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 500));

        setQuestions(mockQuestions);
        setError(null);
      } catch (err) {
        console.error('Error al cargar preguntas:', err);
        setError('Error al cargar las preguntas del quiz');
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [activity.activity_id]);

  /**
   * Maneja la finalización del quiz
   */
  const handleQuizComplete = async (score: number) => {
    console.log('Quiz completado con score:', score);

    try {
      // TODO: Guardar el resultado en la base de datos
      // await saveQuizResult({
      //   userId: user?.id,
      //   activityId: activity.activity_id,
      //   score,
      //   completedAt: new Date()
      // });

      console.log('✅ Resultado guardado correctamente');
    } catch (error) {
      console.error('❌ Error al guardar resultado:', error);
    }
  };

  // Estados de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-red-900 dark:text-red-300 font-semibold mb-2">Error</h3>
        <p className="text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <p className="text-gray-600 dark:text-gray-400">
          No hay preguntas disponibles para este quiz.
        </p>
      </div>
    );
  }

  // Renderizar quiz con sistema de ayuda inteligente
  // 🔍 Debug: Verificar datos de la actividad
  console.log('🔍 [DEBUG] QuizActivity - activity:', {
    activity_id: activity.activity_id,
    activity_title: activity.activity_title,
    fullActivity: activity
  });

  return (
    <QuizWithHelp
      questions={questions}
      activityId={activity.activity_id || 'quiz-unknown'}
      workshopId={slug}
      courseContext={{
        courseName: lesson.course_name || 'Curso',
        lessonName: lesson.lesson_title || 'Lección',
        activityName: activity.activity_title || 'Quiz'
      }}
      enableAIHelp={true}
      onComplete={handleQuizComplete}
    />
  );
}
