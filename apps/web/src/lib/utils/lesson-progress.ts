/**
 * Utilidades para calcular el progreso de lecciones
 */

/**
 * Calcula el progreso combinado de una lección
 * Solo aplica la fórmula 50% video + 50% quiz si hay quizzes en la lección
 * Si no hay quizzes, solo cuenta el video
 * 
 * @param videoProgress - Progreso del video (0-100)
 * @param quizPassed - Si el quiz fue aprobado (≥80%)
 * @param hasQuizzes - Si la lección tiene quizzes obligatorios
 * @returns Progreso combinado (0-100)
 */
export function calculateCombinedLessonProgress(
  videoProgress: number,
  quizPassed: boolean,
  hasQuizzes: boolean = false
): number {
  // Si no hay quizzes, solo cuenta el video
  if (!hasQuizzes) {
    return videoProgress;
  }

  // Si hay quizzes, aplicar la fórmula 50% video + 50% quiz
  if (quizPassed) {
    // 50% video + 50% quiz = (video * 0.5) + 50
    return Math.min(100, (videoProgress * 0.5) + 50);
  } else {
    // Si hay quizzes pero no se aprobó, solo cuenta el video
    return videoProgress;
  }
}

/**
 * Calcula el progreso general del curso basado en el progreso combinado de cada lección
 * Solo aplica la fórmula de quiz si la lección tiene quizzes
 * 
 * @param lessonsProgress - Array con el progreso de cada lección
 * @param lessonsWithQuizzes - Set o Map con los IDs de lecciones que tienen quizzes
 * @returns Progreso general del curso (0-100)
 */
export function calculateCourseProgress(
  lessonsProgress: Array<{
    lesson_id: string;
    video_progress_percentage: number;
    quiz_passed: boolean;
  }>,
  lessonsWithQuizzes?: Set<string> | Map<string, boolean>
): number {
  if (lessonsProgress.length === 0) {
    return 0;
  }

  const totalProgress = lessonsProgress.reduce((sum, lesson) => {
    // Verificar si la lección tiene quizzes
    const hasQuizzes = lessonsWithQuizzes 
      ? (lessonsWithQuizzes instanceof Set 
          ? lessonsWithQuizzes.has(lesson.lesson_id)
          : lessonsWithQuizzes.has(lesson.lesson_id))
      : false;

    const combinedProgress = calculateCombinedLessonProgress(
      lesson.video_progress_percentage || 0,
      lesson.quiz_passed || false,
      hasQuizzes
    );
    return sum + combinedProgress;
  }, 0);

  return Math.round((totalProgress / lessonsProgress.length) * 100) / 100;
}

