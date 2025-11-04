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
    
    console.log(`📦 Módulos encontrados para curso ${courseId}:`, {
      total: allModules?.length || 0,
      publicados: publishedModules.length,
      mostrando: modules.length
    });

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
        // Obtener todas las lecciones primero
        const { data: allLessons, error: allLessonsError } = await supabase
          .from('course_lessons')
          .select(`
            lesson_id,
            lesson_title,
            lesson_description,
            lesson_order_index,
            duration_seconds,
            video_provider_id,
            video_provider,
            is_published
          `)
          .eq('module_id', module.module_id)
          .order('lesson_order_index', { ascending: true });

        // Si hay lecciones publicadas, mostrar solo esas, sino mostrar todas
        const publishedLessons = (allLessons || []).filter(l => l.is_published === true);
        const lessons = publishedLessons.length > 0 ? publishedLessons : (allLessons || []);
        const lessonsError = allLessonsError;

        if (lessonsError) {
          console.error('Error fetching lessons:', lessonsError);
          return { ...module, lessons: [] };
        }

        // Reconstruir URLs completas de Supabase para videos directos
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const lessonsWithFullUrls = (lessons || []).map((lesson: any) => {
          if (lesson.video_provider === 'direct' && lesson.video_provider_id && !lesson.video_provider_id.startsWith('http')) {
            let videoUrl = lesson.video_provider_id;
            if (supabaseUrl) {
              // Si el path no incluye el bucket, asumir que está en 'course-videos/videos'
              if (!videoUrl.includes('/')) {
                videoUrl = `${supabaseUrl}/storage/v1/object/public/course-videos/videos/${videoUrl}`;
              } else if (!videoUrl.startsWith('course-videos/')) {
                // Si empieza con 'course-videos/' pero no tiene http, agregar la base
                videoUrl = `${supabaseUrl}/storage/v1/object/public/${videoUrl}`;
              } else {
                // Ya tiene el bucket, solo agregar la base
                videoUrl = `${supabaseUrl}/storage/v1/object/public/${videoUrl}`;
              }
            }
            return {
              ...lesson,
              video_provider_id: videoUrl
            };
          }
          return lesson;
        });

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

              lessonsWithProgress = lessonsWithFullUrls.map((lesson: {
                lesson_id: string;
                lesson_title: string;
                lesson_description?: string;
                lesson_order_index: number;
                duration_seconds: number;
                video_provider_id?: string;
                video_provider?: 'youtube' | 'vimeo' | 'direct' | 'custom';
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
                  is_completed: progress?.is_completed || false,
                  progress_percentage: progress?.video_progress_percentage || 0,
                };
              });
            } else {
              // Usuario autenticado pero sin enrollment
              lessonsWithProgress = lessonsWithFullUrls.map((lesson: {
                lesson_id: string;
                lesson_title: string;
                lesson_description?: string;
                lesson_order_index: number;
                duration_seconds: number;
                video_provider_id?: string;
                video_provider?: 'youtube' | 'vimeo' | 'direct' | 'custom';
              }) => ({
                lesson_id: lesson.lesson_id,
                lesson_title: lesson.lesson_title,
                lesson_description: lesson.lesson_description,
                lesson_order_index: lesson.lesson_order_index,
                duration_seconds: lesson.duration_seconds,
                video_provider_id: lesson.video_provider_id,
                video_provider: lesson.video_provider,
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
            }) => ({
              lesson_id: lesson.lesson_id,
              lesson_title: lesson.lesson_title,
              lesson_description: lesson.lesson_description,
              lesson_order_index: lesson.lesson_order_index,
              duration_seconds: lesson.duration_seconds,
              video_provider_id: lesson.video_provider_id,
              video_provider: lesson.video_provider,
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
