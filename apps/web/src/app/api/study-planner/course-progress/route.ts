import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

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
    const userId = searchParams.get('userId') || currentUser.id;

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener lecciones completadas del usuario para este curso
    // Si hay enrollmentId, filtrar por enrollment_id (más preciso)
    // Si no hay enrollmentId, filtrar por user_id y obtener las lecciones del curso
    let query = supabase
      .from('user_lesson_progress')
      .select('lesson_id, is_completed, enrollment_id')
      .eq('user_id', userId)
      .eq('is_completed', true);

    if (enrollmentId) {
      query = query.eq('enrollment_id', enrollmentId);
    } else {
      // Si no hay enrollmentId, obtener el enrollment del curso y filtrar por él
      const { data: enrollment } = await supabase
        .from('user_course_enrollments')
        .select('enrollment_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();
      
      if (enrollment?.enrollment_id) {
        query = query.eq('enrollment_id', enrollment.enrollment_id);
      }
    }

    const { data: completedLessons, error: progressError } = await query;

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

