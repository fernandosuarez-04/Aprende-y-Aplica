import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/courses/[id]/modules
 * Obtiene todos los módulos y lecciones de un curso
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Obtener el curso para verificar que existe
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', id)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Obtener módulos del curso
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select(`
        module_id,
        module_title,
        module_order_index,
        module_duration_minutes,
        is_published
      `)
      .eq('course_id', id)
      .eq('is_published', true)
      .order('module_order_index', { ascending: true });

    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
      return NextResponse.json(
        { error: 'Error al obtener módulos' },
        { status: 500 }
      );
    }

    // Obtener lecciones para cada módulo
    const modulesWithLessons = await Promise.all(
      (modules || []).map(async (module) => {
        const { data: lessons, error: lessonsError } = await supabase
          .from('course_lessons')
          .select(`
            lesson_id,
            lesson_title,
            lesson_order_index,
            duration_seconds,
            is_published
          `)
          .eq('module_id', module.module_id)
          .eq('is_published', true)
          .order('lesson_order_index', { ascending: true });

        if (lessonsError) {
          console.error('Error fetching lessons:', lessonsError);
          return { ...module, lessons: [] };
        }

        // Obtener progreso del usuario si está autenticado
        const currentUser = await SessionService.getCurrentUser();
        let lessonsWithProgress = lessons || [];

        if (currentUser && lessonsWithProgress.length > 0) {
          // Obtener enrollment del usuario para este curso
          const { data: enrollment } = await supabase
            .from('user_course_enrollments')
            .select('enrollment_id')
            .eq('user_id', currentUser.id)
            .eq('course_id', id)
            .single();

          if (enrollment) {
            // Obtener progreso de cada lección
            const { data: progressData } = await supabase
              .from('user_lesson_progress')
              .select('lesson_id, is_completed, lesson_status, video_progress_percentage')
              .eq('enrollment_id', enrollment.enrollment_id)
              .in('lesson_id', lessonsWithProgress.map(l => l.lesson_id));

            // Mapear progreso a las lecciones
            const progressMap = new Map(
              (progressData || []).map(p => [p.lesson_id, p])
            );

            lessonsWithProgress = lessonsWithProgress.map(lesson => {
              const progress = progressMap.get(lesson.lesson_id);
              return {
                lesson_id: lesson.lesson_id,
                lesson_title: lesson.lesson_title,
                lesson_order_index: lesson.lesson_order_index,
                duration_seconds: lesson.duration_seconds,
                is_completed: progress?.is_completed || false,
                progress_percentage: progress?.video_progress_percentage || 0,
              };
            });
          }
        }

        return {
          module_id: module.module_id,
          module_title: module.module_title,
          module_order_index: module.module_order_index,
          lessons: lessonsWithProgress,
        };
      })
    );

    return NextResponse.json(modulesWithLessons);
  } catch (error) {
    console.error('Error in modules API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

