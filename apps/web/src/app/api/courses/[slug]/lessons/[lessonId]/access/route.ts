import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * POST /api/courses/[slug]/lessons/[lessonId]/access
 * Actualiza last_accessed_at cuando el usuario accede a una lección
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params;
    const supabase = await createClient();

    // Verificar autenticación
    const currentUser = await SessionService.getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener el curso por slug
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

    // Obtener o crear enrollment del usuario
    let { data: enrollment, error: enrollmentError } = await supabase
      .from('user_course_enrollments')
      .select('enrollment_id')
      .eq('user_id', currentUser.id)
      .eq('course_id', courseId)
      .single();

    // Si no existe enrollment, crearlo
    if (enrollmentError || !enrollment) {
      const now = new Date().toISOString();
      const { data: newEnrollment, error: createError } = await supabase
        .from('user_course_enrollments')
        .insert({
          user_id: currentUser.id,
          course_id: courseId,
          enrollment_status: 'active',
          overall_progress_percentage: 0,
          enrolled_at: now,
          started_at: now,
          last_accessed_at: now,
        })
        .select('enrollment_id')
        .single();

      if (createError || !newEnrollment) {
        return NextResponse.json(
          { error: 'Error al crear inscripción' },
          { status: 500 }
        );
      }

      enrollment = newEnrollment;
    }

    const enrollmentId = enrollment.enrollment_id;

    // ✅ NUEVA VALIDACIÓN: Verificar que la lección no esté bloqueada
    // Obtener módulos del curso
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('module_id, module_order_index')
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('module_order_index', { ascending: true });

    if (modulesError || !modules || modules.length === 0) {
      return NextResponse.json(
        { error: 'El curso no tiene módulos' },
        { status: 404 }
      );
    }

    // Obtener todas las lecciones ordenadas
    const lessonsPromises = modules.map(async (module) => {
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('lesson_id, lesson_order_index, module_id, title')
        .eq('module_id', module.module_id)
        .eq('is_published', true)
        .order('lesson_order_index', { ascending: true });

      return (lessons || []).map((lesson: any) => ({
        ...lesson,
        module_order_index: module.module_order_index,
      }));
    });

    const lessonsArrays = await Promise.all(lessonsPromises);
    const allLessons = lessonsArrays.flat();

    // Ordenar lecciones con validación de nulos
    allLessons.sort((a, b) => {
      const aModuleIndex = a.module_order_index ?? 999999;
      const bModuleIndex = b.module_order_index ?? 999999;
      const aLessonIndex = a.lesson_order_index ?? 999999;
      const bLessonIndex = b.lesson_order_index ?? 999999;

      if (aModuleIndex !== bModuleIndex) {
        return aModuleIndex - bModuleIndex;
      }
      return aLessonIndex - bLessonIndex;
    });

    // Encontrar la lección actual
    const currentLessonIndex = allLessons.findIndex(
      (l: any) => l.lesson_id === lessonId
    );

    if (currentLessonIndex === -1) {
      return NextResponse.json(
        { error: 'Lección no encontrada' },
        { status: 404 }
      );
    }

    // ✅ VALIDAR: Si no es la primera lección, verificar que todas las anteriores estén completadas
    if (currentLessonIndex > 0) {
      const previousLessons = allLessons.slice(0, currentLessonIndex);
      const previousLessonIds = previousLessons.map(l => l.lesson_id);

      // Obtener progreso de todas las lecciones anteriores
      const { data: previousProgress, error: progressError } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, is_completed')
        .eq('enrollment_id', enrollmentId)
        .in('lesson_id', previousLessonIds);

      if (progressError) {
        console.error('Error verificando progreso:', progressError);
        // En caso de error, bloquear acceso por seguridad
        return NextResponse.json(
          { 
            error: 'Error verificando acceso a la lección',
            code: 'ACCESS_CHECK_FAILED'
          },
          { status: 500 }
        );
      }

      // Crear mapa de progreso
      const progressMap = new Map(
        (previousProgress || []).map((p: any) => [p.lesson_id, p.is_completed])
      );

      // Verificar que todas las lecciones anteriores estén completadas
      for (const lesson of previousLessons) {
        const isCompleted = progressMap.get(lesson.lesson_id) || false;
        if (!isCompleted) {
          return NextResponse.json(
            {
              error: `Debes completar la lección "${lesson.title}" antes de acceder a esta`,
              code: 'LESSON_LOCKED',
              previousLessonId: lesson.lesson_id,
              previousLessonTitle: lesson.title
            },
            { status: 403 }
          );
        }
      }
    }

    // Si pasa la validación, continuar con el tracking normal
    const now = new Date().toISOString();

    // Verificar si existe progreso de la lección
    const { data: existingProgress } = await supabase
      .from('user_lesson_progress')
      .select('progress_id, lesson_status')
      .eq('enrollment_id', enrollmentId)
      .eq('lesson_id', lessonId)
      .single();

    if (existingProgress) {
      // Actualizar last_accessed_at y lesson_status si es necesario
      const updateData: any = {
        last_accessed_at: now,
        updated_at: now,
      };

      // Si la lección no ha sido iniciada, marcarla como in_progress
      if (existingProgress.lesson_status === 'not_started') {
        updateData.lesson_status = 'in_progress';
        updateData.started_at = now;
      }

      const { error: updateError } = await supabase
        .from('user_lesson_progress')
        .update(updateData)
        .eq('progress_id', existingProgress.progress_id);

      if (updateError) {
        // No retornar error, es solo tracking
        return NextResponse.json({ success: true });
      }
    } else {
      // Crear nuevo progreso si no existe
      const { error: insertError } = await supabase
        .from('user_lesson_progress')
        .insert({
          user_id: currentUser.id,
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          lesson_status: 'in_progress',
          video_progress_percentage: 0,
          current_time_seconds: 0,
          is_completed: false,
          started_at: now,
          last_accessed_at: now,
        });

      if (insertError) {
        // No retornar error, es solo tracking
        return NextResponse.json({ success: true });
      }
    }

    // Actualizar last_accessed_at del enrollment
    await supabase
      .from('user_course_enrollments')
      .update({ last_accessed_at: now })
      .eq('enrollment_id', enrollmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    // No retornar error, es solo tracking
    return NextResponse.json({ success: true });
  }
}

