import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * GET /api/study-planner/pending-lessons
 * 
 * Obtiene las lecciones PENDIENTES (no completadas) de los cursos asignados
 * directamente de la base de datos para evitar alucinaciones de la IA.
 * 
 * Similar al patrón Bridge de IRIS: consulta directa a BD = datos verídicos.
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
    const courseIdParam = searchParams.get('courseId');
    const supabase = await createClient();

    // 1. Obtener enrollments del usuario (cursos a los que está inscrito)
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('user_course_enrollments')
      .select(`
        enrollment_id,
        course_id,
        course_id,
        courses (
          id,
          title,
          description
        )
      `)
      .eq('user_id', currentUser.id)
      .eq('enrollment_status', 'active');

    if (enrollmentsError) {
      console.error('❌ Error obteniendo enrollments:', enrollmentsError);
      return NextResponse.json(
        { error: 'Error obteniendo cursos inscritos', details: enrollmentsError.message },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        totalPendingLessons: 0,
        courses: []
      });
    }

    // Filtrar por courseId si se especificó
    const coursesToProcess = courseIdParam 
      ? enrollments.filter(e => e.course_id === courseIdParam)
      : enrollments;

    // 2. Para cada curso, obtener módulos, lecciones y progreso
    const coursesWithLessons = await Promise.all(
      coursesToProcess.map(async (enrollment) => {
        const courseId = enrollment.course_id;
        const courseInfo = enrollment.courses as any;

        // 2a. Obtener módulos del curso
        const { data: modules, error: modulesError } = await supabase
          .from('course_modules')
          .select(`
            module_id,
            module_title,
            module_order_index,
            is_published
          `)
          .eq('course_id', courseId)
          .eq('is_published', true)
          .order('module_order_index', { ascending: true });

        if (modulesError || !modules || modules.length === 0) {
          return null;
        }

        const moduleIds = modules.map(m => m.module_id);

        // 2b. Obtener TODAS las lecciones de los módulos
        const { data: lessons, error: lessonsError } = await supabase
          .from('course_lessons')
          .select(`
            lesson_id,
            lesson_title,
            lesson_description,
            lesson_order_index,
            duration_seconds,
            total_duration_minutes,
            module_id,
            is_published
          `)
          .in('module_id', moduleIds)
          .eq('is_published', true)
          .order('lesson_order_index', { ascending: true });

        if (lessonsError || !lessons) {
          console.error(`❌ Error obteniendo lecciones del curso ${courseId}:`, lessonsError);
          return null;
        }

        // 2c. Obtener lecciones COMPLETADAS del usuario
        const lessonIds = lessons.map(l => l.lesson_id);
        const { data: completedProgress, error: progressError } = await supabase
          .from('user_lesson_progress')
          .select('lesson_id, lesson_status, is_completed')
          .eq('user_id', currentUser.id)
          .eq('is_completed', true) // Usar el flag explícito de completado
          .in('lesson_id', lessonIds);

        if (progressError) {
          console.error(`⚠️ Error consultando progreso para curso ${courseId}:`, progressError);
        }

        const completedLessonIds = new Set(
          (completedProgress || []).map(p => p.lesson_id)
        );
        
        console.log(`📊 [Progreso] Curso ${courseId}: ${completedLessonIds.size} lecciones completadas encontradas en user_lesson_progress`);

        // 2d. Filtrar solo lecciones PENDIENTES (no completadas)
        const pendingLessons = lessons.filter(
          lesson => !completedLessonIds.has(lesson.lesson_id)
        );

        // 2e. Construir estructura con información del módulo
        const pendingLessonsWithModules = pendingLessons.map(lesson => {
          const module = modules.find(m => m.module_id === lesson.module_id);
          
          // Calcular duración en minutos
          let durationMinutes = 15; // fallback
          if (lesson.total_duration_minutes && lesson.total_duration_minutes > 0) {
            durationMinutes = lesson.total_duration_minutes;
          } else if (lesson.duration_seconds && lesson.duration_seconds > 0) {
            durationMinutes = Math.ceil(lesson.duration_seconds / 60);
          }

          return {
            lessonId: lesson.lesson_id,
            lessonTitle: lesson.lesson_title, // ⚠️ NOMBRE EXACTO DE LA BD
            lessonOrderIndex: lesson.lesson_order_index,
            durationMinutes,
            durationSeconds: lesson.duration_seconds || 0,
            moduleId: lesson.module_id,
            moduleTitle: module?.module_title || 'Módulo',
            moduleOrderIndex: module?.module_order_index || 0,
          };
        });

        // Ordenar por módulo y luego por lección
        pendingLessonsWithModules.sort((a, b) => {
          if (a.moduleOrderIndex !== b.moduleOrderIndex) {
            return a.moduleOrderIndex - b.moduleOrderIndex;
          }
          return a.lessonOrderIndex - b.lessonOrderIndex;
        });

        return {
          courseId,
          courseTitle: courseInfo?.title || 'Curso',
          dueDate: null,
          totalLessons: lessons.length,
          completedLessons: completedLessonIds.size,
          pendingLessons: pendingLessonsWithModules,
          pendingCount: pendingLessonsWithModules.length,
        };
      })
    );

    // Filtrar cursos nulos
    const validCourses = coursesWithLessons.filter(c => c !== null);

    // Calcular total de lecciones pendientes
    const totalPendingLessons = validCourses.reduce(
      (sum, course) => sum + (course?.pendingCount || 0), 
      0
    );

    // Combinar todas las lecciones pendientes en una lista plana
    const allPendingLessons = validCourses.flatMap(course => 
      (course?.pendingLessons || []).map(lesson => ({
        ...lesson,
        courseId: course?.courseId,
        courseTitle: course?.courseTitle,
      }))
    );

    console.log(`✅ [pending-lessons] Usuario ${currentUser.id}: ${totalPendingLessons} lecciones pendientes de ${validCourses.length} cursos`);
    
    // Log de ejemplo de las primeras lecciones (para debug)
    if (allPendingLessons.length > 0) {
      console.log('📋 Primeras 5 lecciones pendientes:');
      allPendingLessons.slice(0, 5).forEach((l, i) => {
        console.log(`   ${i + 1}. "${l.lessonTitle}" (${l.durationMinutes} min)`);
      });
    }

    return NextResponse.json({
      success: true,
      userId: currentUser.id,
      totalPendingLessons,
      courses: validCourses,
      allPendingLessons, // Lista plana para uso directo
    });

  } catch (error) {
    console.error('❌ Error en pending-lessons:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
