import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/courses/[slug]/modules
 * Obtiene todos los módulos y lecciones de un curso por slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // Obtener el curso por slug para obtener su ID
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    const courseId = course.id;

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
      .eq('course_id', courseId)
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
      (modules || []).map(async (module: {
        module_id: string;
        module_title: string;
        module_order_index: number;
        module_duration_minutes?: number;
        is_published: boolean;
      }) => {
        const { data: lessons, error: lessonsError } = await supabase
          .from('course_lessons')
          .select(`
            lesson_id,
            lesson_title,
            lesson_description,
            lesson_order_index,
            duration_seconds,
            video_provider_id,
            video_provider,
            transcript_content,
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
        let lessonsWithProgress: Array<{
          lesson_id: string;
          lesson_title: string;
          lesson_order_index: number;
          duration_seconds: number;
          is_completed: boolean;
          progress_percentage: number;
        }> = [];

        if (lessons && lessons.length > 0) {
          if (currentUser) {
            // Obtener enrollment del usuario para este curso
            const { data: enrollment } = await supabase
              .from('user_course_enrollments')
              .select('enrollment_id')
              .eq('user_id', currentUser.id)
              .eq('course_id', courseId)
              .single();

            if (enrollment) {
              // Obtener progreso de cada lección
              const { data: progressData } = await supabase
                .from('user_lesson_progress')
                .select('lesson_id, is_completed, lesson_status, video_progress_percentage')
                .eq('enrollment_id', enrollment.enrollment_id)
                .in('lesson_id', lessons.map((l: { lesson_id: string }) => l.lesson_id));

              // Mapear progreso a las lecciones
              const progressMap = new Map(
                (progressData || []).map((p: { lesson_id: string; is_completed?: boolean; video_progress_percentage?: number }) => [p.lesson_id, p])
              );

              lessonsWithProgress = lessons.map((lesson: {
                lesson_id: string;
                lesson_title: string;
                lesson_description?: string;
                lesson_order_index: number;
                duration_seconds: number;
                video_provider_id?: string;
                video_provider?: 'youtube' | 'vimeo' | 'direct' | 'custom';
                transcript_content?: string;
              }) => {
                const progress = progressMap.get(lesson.lesson_id) as { is_completed?: boolean; video_progress_percentage?: number } | undefined;
                return {
                  lesson_id: lesson.lesson_id,
                  lesson_title: lesson.lesson_title,
                  lesson_description: lesson.lesson_description,
                  lesson_order_index: lesson.lesson_order_index,
                  duration_seconds: lesson.duration_seconds,
                  video_provider_id: lesson.video_provider_id,
                  video_provider: lesson.video_provider,
                  transcript_content: lesson.transcript_content,
                  is_completed: progress?.is_completed || false,
                  progress_percentage: progress?.video_progress_percentage || 0,
                };
              });
            } else {
              // Usuario autenticado pero sin enrollment
              lessonsWithProgress = lessons.map((lesson: {
                lesson_id: string;
                lesson_title: string;
                lesson_description?: string;
                lesson_order_index: number;
                duration_seconds: number;
                video_provider_id?: string;
                video_provider?: 'youtube' | 'vimeo' | 'direct' | 'custom';
                transcript_content?: string;
              }) => ({
                lesson_id: lesson.lesson_id,
                lesson_title: lesson.lesson_title,
                lesson_description: lesson.lesson_description,
                lesson_order_index: lesson.lesson_order_index,
                duration_seconds: lesson.duration_seconds,
                video_provider_id: lesson.video_provider_id,
                video_provider: lesson.video_provider,
                transcript_content: lesson.transcript_content,
                is_completed: false,
                progress_percentage: 0,
              }));
            }
          } else {
            // Si no hay usuario autenticado, establecer valores por defecto
            lessonsWithProgress = lessons.map((lesson: {
              lesson_id: string;
              lesson_title: string;
              lesson_description?: string;
              lesson_order_index: number;
              duration_seconds: number;
              video_provider_id?: string;
              video_provider?: 'youtube' | 'vimeo' | 'direct' | 'custom';
              transcript_content?: string;
            }) => ({
              lesson_id: lesson.lesson_id,
              lesson_title: lesson.lesson_title,
              lesson_description: lesson.lesson_description,
              lesson_order_index: lesson.lesson_order_index,
              duration_seconds: lesson.duration_seconds,
              video_provider_id: lesson.video_provider_id,
              video_provider: lesson.video_provider,
              transcript_content: lesson.transcript_content,
              is_completed: false,
              progress_percentage: 0,
            }));
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
