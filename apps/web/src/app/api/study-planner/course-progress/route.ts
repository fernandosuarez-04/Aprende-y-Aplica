import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/core/lib/supabase/server';
import { SessionService } from '@/core/services/session.service';

/**
 * GET /api/study-planner/course-progress
 * Obtiene el número de lecciones completadas de un curso para el usuario actual
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');
    const courseId = searchParams.get('courseId');

    if (!enrollmentId || !courseId) {
      return NextResponse.json(
        { error: 'enrollmentId y courseId son requeridos' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener lecciones completadas del usuario para este curso
    const { data: completedLessons, error: progressError } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, is_completed')
      .eq('enrollment_id', enrollmentId)
      .eq('is_completed', true);

    if (progressError) {
      console.error('Error obteniendo progreso de lecciones:', progressError);
      return NextResponse.json(
        { error: 'Error obteniendo progreso', completedLessonsCount: 0 },
        { status: 500 }
      );
    }

    const completedLessonsCount = completedLessons?.length || 0;

    return NextResponse.json({
      success: true,
      enrollmentId,
      courseId,
      completedLessonsCount,
      completedLessonIds: completedLessons?.map(l => l.lesson_id) || []
    });
  } catch (error) {
    console.error('Error en course-progress:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', completedLessonsCount: 0 },
      { status: 500 }
    );
  }
}

