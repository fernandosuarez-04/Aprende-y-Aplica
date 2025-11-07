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

    // Obtener módulos del curso (incluir todos, no solo publicados, para el panel de admin/instructor)
    // Si no hay módulos publicados, mostrar todos para que el instructor pueda ver su contenido
    const { data: allModules, error: allModulesError } = await supabase
      .from('course_modules')
      .select(`
        module_id,
        module_title,
        module_order_index,
        module_duration_minutes,
        is_published
      `)
      .eq('course_id', courseId)
      .order('module_order_index', { ascending: true });

    // Filtrar solo los publicados si hay alguno publicado, sino mostrar todos
    const publishedModules = (allModules || []).filter(m => m.is_published === true);
    const modules = publishedModules.length > 0 ? publishedModules : (allModules || []);

    const modulesError = allModulesError;

    if (modulesError) {
      return NextResponse.json(
        { error: 'Error al obtener módulos' },
        { status: 500 }
      );
    }

    // ⚡ OPTIMIZACIÓN: Obtener user y enrollment UNA SOLA VEZ antes del loop
    const currentUser = await SessionService.getCurrentUser();
    let userEnrollment = null;

    if (currentUser) {
      const { data: enrollment } = await supabase
        .from('user_course_enrollments')
        .select('enrollment_id')
        .eq('user_id', currentUser.id)
        .eq('course_id', courseId)
        .single();

      userEnrollment = enrollment;
    }

    // ⚡ OPTIMIZACIÓN: Obtener TODAS las lecciones en una sola query con JOIN
    const { data: allLessonsData } = await supabase
      .from('course_lessons')
      .select(`
        lesson_id,
        lesson_title,
        lesson_description,
        lesson_order_index,
        duration_seconds,
        video_provider_id,
        video_provider,
        is_published,
        module_id
      `)
      .in('module_id', modules.map(m => m.module_id))
      .order('lesson_order_index', { ascending: true });

    // ⚡ OPTIMIZACIÓN: Obtener TODO el progreso en una sola query
    let progressMap = new Map();
    if (userEnrollment && allLessonsData && allLessonsData.length > 0) {
      const { data: progressData } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, is_completed, lesson_status, video_progress_percentage')
        .eq('enrollment_id', userEnrollment.enrollment_id)
        .in('lesson_id', allLessonsData.map(l => l.lesson_id));

      progressMap = new Map(
        (progressData || []).map(p => [p.lesson_id, p])
      );
    }

    // Agrupar lecciones por módulo
    const lessonsByModule = new Map<string, any[]>();
    (allLessonsData || []).forEach((lesson: any) => {
      if (!lessonsByModule.has(lesson.module_id)) {
        lessonsByModule.set(lesson.module_id, []);
      }
      lessonsByModule.get(lesson.module_id)!.push(lesson);
    });

    // Construir módulos con sus lecciones (sin queries adicionales)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    const modulesWithLessons = modules.map((module: {
      module_id: string;
      module_title: string;
      module_order_index: number;
      module_duration_minutes?: number;
      is_published: boolean;
    }) => {
      // Obtener lecciones de este módulo desde el Map
      const moduleLessons = lessonsByModule.get(module.module_id) || [];

      // Filtrar publicadas si existen, sino mostrar todas
      const publishedLessons = moduleLessons.filter(l => l.is_published === true);
      const lessons = publishedLessons.length > 0 ? publishedLessons : moduleLessons;

      // Procesar URLs de videos y agregar progreso
      const lessonsWithProgress = lessons.map((lesson: any) => {
        // Reconstruir URLs completas de Supabase para videos directos
        let videoUrl = lesson.video_provider_id;
        if (lesson.video_provider === 'direct' && videoUrl && !videoUrl.startsWith('http')) {
          if (supabaseUrl) {
            if (!videoUrl.includes('/')) {
              videoUrl = `${supabaseUrl}/storage/v1/object/public/course-videos/videos/${videoUrl}`;
            } else if (!videoUrl.startsWith('course-videos/')) {
              videoUrl = `${supabaseUrl}/storage/v1/object/public/${videoUrl}`;
            } else {
              videoUrl = `${supabaseUrl}/storage/v1/object/public/${videoUrl}`;
            }
          }
        }

        // Obtener progreso desde el Map
        const progress = progressMap.get(lesson.lesson_id) as { is_completed?: boolean; video_progress_percentage?: number } | undefined;

        return {
          lesson_id: lesson.lesson_id,
          lesson_title: lesson.lesson_title,
          lesson_description: lesson.lesson_description,
          lesson_order_index: lesson.lesson_order_index,
          duration_seconds: lesson.duration_seconds,
          video_provider_id: videoUrl,
          video_provider: lesson.video_provider,
          is_completed: progress?.is_completed || false,
          progress_percentage: progress?.video_progress_percentage || 0,
        };
      });

      return {
        module_id: module.module_id,
        module_title: module.module_title,
        module_order_index: module.module_order_index,
        lessons: lessonsWithProgress,
      };
    });

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
