import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SessionService } from '@/features/auth/services/session.service';
import type { Database } from '@/lib/supabase/types';

/**
 * GET /api/study-planner/sessions/[sessionId]/details
 * Obtiene información detallada de una sesión: curso, módulo y actividades
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

    // Crear cliente con Service Role Key para bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables de entorno faltantes');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Obtener la sesión
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('study_sessions')
      .select('course_id, lesson_id')
      .eq('id', sessionId)
      .eq('user_id', currentUser.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }

    const result: any = {
      course: null,
      module: null,
      activities: [],
      canAccess: false,
      accessReason: '',
      currentLessonId: null,
    };

    // Obtener enrollment del usuario para el curso
    let enrollmentId: string | null = null;
    if (session.course_id) {
      const { data: enrollment } = await supabaseAdmin
        .from('user_course_enrollments')
        .select('enrollment_id')
        .eq('user_id', currentUser.id)
        .eq('course_id', session.course_id)
        .single();

      if (enrollment) {
        enrollmentId = enrollment.enrollment_id;
      }
    }

    // Obtener información del curso
    if (session.course_id) {
      const { data: course } = await supabaseAdmin
        .from('courses')
        .select('id, title, slug')
        .eq('id', session.course_id)
        .single();

      if (course) {
        result.course = {
          id: course.id,
          name: course.title,
          slug: course.slug,
        };
      }
    }

    // Obtener información del módulo y lección
    let lessonOrderIndex: number | null = null;
    let moduleOrderIndex: number | null = null;
    
    if (session.lesson_id) {
      const { data: lesson } = await supabaseAdmin
        .from('course_lessons')
        .select('lesson_id, lesson_title, module_id, lesson_order_index')
        .eq('lesson_id', session.lesson_id)
        .single();

      if (lesson && lesson.module_id) {
        lessonOrderIndex = lesson.lesson_order_index;
        
        // Obtener información del módulo
        const { data: module } = await supabaseAdmin
          .from('course_modules')
          .select('module_id, module_title, module_order_index')
          .eq('module_id', lesson.module_id)
          .single();

        if (module) {
          moduleOrderIndex = module.module_order_index;
          result.module = {
            id: module.module_id,
            name: module.module_title,
          };
        }

        // Obtener actividades de la lección
        const { data: activities } = await supabaseAdmin
          .from('lesson_activities')
          .select('activity_id, activity_title, activity_type')
          .eq('lesson_id', session.lesson_id)
          .order('activity_order_index', { ascending: true });

        if (activities && activities.length > 0) {
          result.activities = activities.map((activity: any) => ({
            id: activity.activity_id,
            title: activity.activity_title,
            type: activity.activity_type,
          }));
        }
      }
    }

    // Validar si el usuario puede acceder a esta lección
    if (enrollmentId && session.lesson_id && session.course_id) {
      // Obtener todas las lecciones del curso ordenadas
      const { data: modules } = await supabaseAdmin
        .from('course_modules')
        .select('module_id, module_order_index')
        .eq('course_id', session.course_id)
        .eq('is_published', true)
        .order('module_order_index', { ascending: true });

      if (modules && modules.length > 0) {
        const allLessons: any[] = [];
        
        for (const module of modules) {
          const { data: lessons } = await supabaseAdmin
            .from('course_lessons')
            .select('lesson_id, lesson_order_index, module_id')
            .eq('module_id', module.module_id)
            .eq('is_published', true)
            .order('lesson_order_index', { ascending: true });

          if (lessons && lessons.length > 0) {
            allLessons.push(...lessons.map(l => ({
              ...l,
              module_order_index: module.module_order_index,
            })));
          }
        }

        // Ordenar lecciones: primero por módulo, luego por orden de lección
        allLessons.sort((a, b) => {
          if (a.module_order_index !== b.module_order_index) {
            return a.module_order_index - b.module_order_index;
          }
          return a.lesson_order_index - b.lesson_order_index;
        });

        // Encontrar el índice de la lección actual
        const currentLessonIndex = allLessons.findIndex(
          (l: any) => l.lesson_id === session.lesson_id
        );

        if (currentLessonIndex !== -1) {
          // Verificar si la lección actual ya está completada
          const { data: currentProgress } = await supabaseAdmin
            .from('user_lesson_progress')
            .select('is_completed, lesson_status')
            .eq('enrollment_id', enrollmentId)
            .eq('lesson_id', session.lesson_id)
            .single();

          if (currentProgress && currentProgress.is_completed) {
            result.canAccess = false;
            result.accessReason = 'Esta lección ya está completada. Debes continuar con las siguientes lecciones.';
            
            // Encontrar la siguiente lección pendiente
            for (let i = currentLessonIndex + 1; i < allLessons.length; i++) {
              const nextLesson = allLessons[i];
              const { data: nextProgress } = await supabaseAdmin
                .from('user_lesson_progress')
                .select('is_completed')
                .eq('enrollment_id', enrollmentId)
                .eq('lesson_id', nextLesson.lesson_id)
                .single();

              if (!nextProgress || !nextProgress.is_completed) {
                result.currentLessonId = nextLesson.lesson_id;
                break;
              }
            }
          } else {
            // Verificar si todas las lecciones anteriores están completadas
            let allPreviousCompleted = true;
            for (let i = 0; i < currentLessonIndex; i++) {
              const prevLesson = allLessons[i];
              const { data: prevProgress } = await supabaseAdmin
                .from('user_lesson_progress')
                .select('is_completed')
                .eq('enrollment_id', enrollmentId)
                .eq('lesson_id', prevLesson.lesson_id)
                .single();

              if (!prevProgress || !prevProgress.is_completed) {
                allPreviousCompleted = false;
                break;
              }
            }

            if (allPreviousCompleted) {
              result.canAccess = true;
              result.accessReason = 'Puedes acceder a esta lección';
              result.currentLessonId = session.lesson_id;
            } else {
              result.canAccess = false;
              result.accessReason = 'Debes completar las lecciones anteriores antes de acceder a esta.';
              
              // Encontrar la primera lección pendiente
              for (let i = 0; i < allLessons.length; i++) {
                const lesson = allLessons[i];
                const { data: progress } = await supabaseAdmin
                  .from('user_lesson_progress')
                  .select('is_completed')
                  .eq('enrollment_id', enrollmentId)
                  .eq('lesson_id', lesson.lesson_id)
                  .single();

                if (!progress || !progress.is_completed) {
                  result.currentLessonId = lesson.lesson_id;
                  break;
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching session details:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

