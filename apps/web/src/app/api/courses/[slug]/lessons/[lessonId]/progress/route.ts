import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { NotificationService } from '@/features/notifications/services/notification.service';
import { calculateCourseProgress } from '@/lib/utils/lesson-progress';

/**
 * POST /api/courses/[slug]/lessons/[lessonId]/progress
 * Marca una lección como completada
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
        console.error('Error creando enrollment:', createError);
        return NextResponse.json(
          { error: 'Error al crear inscripción' },
          { status: 500 }
        );
      }

      enrollment = newEnrollment;
    }

    const enrollmentId = enrollment.enrollment_id;

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

    // Obtener todas las lecciones de los módulos en paralelo
    const lessonsPromises = modules.map(async (module) => {
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('lesson_id, lesson_order_index, module_id')
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

    // Ordenar lecciones: primero por module_order_index, luego por lesson_order_index
    allLessons.sort((a, b) => {
      if (a.module_order_index !== b.module_order_index) {
        return a.module_order_index - b.module_order_index;
      }
      return a.lesson_order_index - b.lesson_order_index;
    });

    // Verificar que hay lecciones
    if (allLessons.length === 0) {
      return NextResponse.json(
        { error: 'El curso no tiene lecciones' },
        { status: 404 }
      );
    }

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

    // Si no es la primera lección, verificar que la anterior esté completada
    // Optimización: Si la lección actual es la primera, no necesitamos verificar
    if (currentLessonIndex > 0) {
      const previousLesson = allLessons[currentLessonIndex - 1];
      
      // Optimización: Obtener progreso de la lección anterior en una sola consulta
      const { data: previousProgress } = await supabase
        .from('user_lesson_progress')
        .select('is_completed, lesson_status')
        .eq('enrollment_id', enrollmentId)
        .eq('lesson_id', previousLesson.lesson_id)
        .single();

      if (!previousProgress || !previousProgress.is_completed) {
        return NextResponse.json(
          { 
            error: 'Debes completar la lección anterior antes de completar esta',
            code: 'PREVIOUS_LESSON_NOT_COMPLETED'
          },
          { status: 400 }
        );
      }
    }

    // Verificar si hay quizzes obligatorios y si están completados/aprobados
    // 1. Quizzes en lesson_materials
    const { data: materialQuizzes } = await supabase
      .from('lesson_materials')
      .select('material_id')
      .eq('lesson_id', lessonId)
      .eq('material_type', 'quiz');

    // 2. Quizzes en lesson_activities (solo los obligatorios)
    const { data: activityQuizzes } = await supabase
      .from('lesson_activities')
      .select('activity_id')
      .eq('lesson_id', lessonId)
      .eq('activity_type', 'quiz')
      .eq('is_required', true);

    const totalRequiredQuizzes = (materialQuizzes?.length || 0) + (activityQuizzes?.length || 0);

    // Si hay quizzes obligatorios, verificar que estén completados y aprobados
    if (totalRequiredQuizzes > 0) {
      const materialIds = (materialQuizzes || []).map((q: any) => q.material_id);
      const activityIds = (activityQuizzes || []).map((q: any) => q.activity_id);

      // Obtener submissions del usuario para esta lección
      let submissionsQuery = supabase
        .from('user_quiz_submissions')
        .select('material_id, activity_id, is_passed')
        .eq('user_id', currentUser.id)
        .eq('lesson_id', lessonId)
        .eq('enrollment_id', enrollmentId);

      // Filtrar por material_id o activity_id
      if (materialIds.length > 0 && activityIds.length > 0) {
        submissionsQuery = submissionsQuery.or(
          `material_id.in.(${materialIds.join(',')}),activity_id.in.(${activityIds.join(',')})`
        );
      } else if (materialIds.length > 0) {
        submissionsQuery = submissionsQuery.in('material_id', materialIds);
      } else if (activityIds.length > 0) {
        submissionsQuery = submissionsQuery.in('activity_id', activityIds);
      }

      const { data: submissions, error: submissionsError } = await submissionsQuery;

      if (submissionsError) {
        console.error('Error verificando submissions:', submissionsError);
      }

      const submissionsList = submissions || [];
      const passedSubmissions = submissionsList.filter((s: any) => s.is_passed);

      // Verificar que todos los quizzes obligatorios estén aprobados
      if (passedSubmissions.length < totalRequiredQuizzes) {
        return NextResponse.json(
          {
            error: 'Hace falta realizar actividad',
            code: 'REQUIRED_QUIZ_NOT_PASSED',
            details: {
              totalRequired: totalRequiredQuizzes,
              passed: passedSubmissions.length,
              message: `Debes completar y aprobar todos los quizzes obligatorios (${passedSubmissions.length}/${totalRequiredQuizzes} completados)`,
            },
          },
          { status: 400 }
        );
      }
    }

    // Obtener progreso actual de la lección
    const { data: existingProgress } = await supabase
      .from('user_lesson_progress')
      .select('progress_id, is_completed, video_progress_percentage')
      .eq('enrollment_id', enrollmentId)
      .eq('lesson_id', lessonId)
      .single();

    const now = new Date().toISOString();

    // NOTA: No se valida el progreso del video porque el sistema de checkpoints no está funcionando
    // Solo se validan los quizzes obligatorios si existen (ya validado arriba)

    // Actualizar o crear progreso de la lección
    if (existingProgress) {
      // Actualizar progreso existente
      const { error: updateError } = await supabase
        .from('user_lesson_progress')
        .update({
          is_completed: true,
          lesson_status: 'completed',
          completed_at: now,
          video_progress_percentage: 100,
          last_accessed_at: now,
          updated_at: now,
        })
        .eq('progress_id', existingProgress.progress_id);

      if (updateError) {
        console.error('Error actualizando progreso:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar progreso' },
          { status: 500 }
        );
      }
    } else {
      // Crear nuevo progreso
      const { error: insertError } = await supabase
        .from('user_lesson_progress')
        .insert({
          user_id: currentUser.id,
          lesson_id: lessonId,
          enrollment_id: enrollmentId,
          is_completed: true,
          lesson_status: 'completed',
          video_progress_percentage: 100,
          completed_at: now,
          started_at: now,
          last_accessed_at: now,
        });

      if (insertError) {
        console.error('Error creando progreso:', insertError);
        return NextResponse.json(
          { error: 'Error al guardar progreso' },
          { status: 500 }
        );
      }
    }

    // Calcular y actualizar progreso general del curso
    // Usar progreso combinado (50% video + 50% quiz si quiz_passed = true) SOLO si hay quizzes
    
    // Primero, obtener qué lecciones tienen quizzes obligatorios
    // Optimización: obtener todos los quizzes de todas las lecciones en consultas paralelas
    const lessonIds = allLessons.map((l: any) => l.lesson_id);
    
    const [materialQuizzesResult, activityQuizzesResult] = await Promise.all([
      supabase
        .from('lesson_materials')
        .select('lesson_id')
        .in('lesson_id', lessonIds)
        .eq('material_type', 'quiz'),
      supabase
        .from('lesson_activities')
        .select('lesson_id')
        .in('lesson_id', lessonIds)
        .eq('activity_type', 'quiz')
        .eq('is_required', true)
    ]);

    const lessonsWithQuizzesSet = new Set<string>();
    
    // Agregar lecciones con quizzes de materiales
    (materialQuizzesResult.data || []).forEach((q: any) => {
      lessonsWithQuizzesSet.add(q.lesson_id);
    });
    
    // Agregar lecciones con quizzes de actividades
    (activityQuizzesResult.data || []).forEach((q: any) => {
      lessonsWithQuizzesSet.add(q.lesson_id);
    });

    // Obtener progreso de todas las lecciones
    const { data: allProgress } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, is_completed, video_progress_percentage, quiz_passed')
      .eq('enrollment_id', enrollmentId);

    // Obtener progreso de todas las lecciones del curso (no solo las que tienen progreso guardado)
    const progressMap = new Map(
      (allProgress || []).map((p: any) => [p.lesson_id, p])
    );

    // Crear array con el progreso de cada lección (usar valores por defecto si no existe)
    const lessonsProgress = allLessons.map((lesson: any) => {
      const progress = progressMap.get(lesson.lesson_id);
      return {
        lesson_id: lesson.lesson_id,
        video_progress_percentage: progress?.video_progress_percentage || 0,
        quiz_passed: progress?.quiz_passed || false,
      };
    });

    // Calcular progreso general usando la función helper (solo aplica fórmula de quiz si hay quizzes)
    const overallProgress = calculateCourseProgress(lessonsProgress, lessonsWithQuizzesSet);

    // Obtener información del curso antes de actualizar el enrollment
    const { data: courseInfo } = await supabase
      .from('courses')
      .select('id, title, slug')
      .eq('id', courseId)
      .single();

    // Obtener el progreso anterior para detectar cambios significativos
    const { data: previousEnrollment } = await supabase
      .from('user_course_enrollments')
      .select('overall_progress_percentage, enrollment_status')
      .eq('enrollment_id', enrollmentId)
      .single();

    const previousProgress = previousEnrollment?.overall_progress_percentage || 0;
    const wasCompleted = previousEnrollment?.enrollment_status === 'completed';

    // Actualizar enrollment con el progreso general
    const { error: updateEnrollmentError } = await supabase
      .from('user_course_enrollments')
      .update({
        overall_progress_percentage: overallProgress,
        last_accessed_at: now,
        updated_at: now,
        // Si todas las lecciones están completadas, marcar como completado
        enrollment_status: overallProgress === 100 ? 'completed' : 'active',
        completed_at: overallProgress === 100 ? now : null,
      })
      .eq('enrollment_id', enrollmentId);

    if (updateEnrollmentError) {
      console.error('Error actualizando enrollment:', updateEnrollmentError);
      // No retornar error aquí, el progreso de la lección ya se guardó
    }

    // Crear notificación cuando se completa el curso
    if (overallProgress === 100 && !wasCompleted && courseInfo) {
      try {
        await NotificationService.createNotification({
          userId: currentUser.id,
          notificationType: 'course_completed',
          title: '¡Curso completado!',
          message: `¡Felicidades! Has completado el curso "${courseInfo.title}".`,
          priority: 'high',
          metadata: {
            courseId: courseInfo.id,
            courseSlug: courseInfo.slug,
            courseTitle: courseInfo.title,
            actionUrl: `/courses/${courseInfo.slug}`,
            progress: overallProgress,
          },
        });
        console.log(`✅ Notificación creada para curso completado: ${courseInfo.title}`);
      } catch (notifError) {
        console.error('Error creando notificación de curso completado (no crítico):', notifError);
        // No fallar si la notificación falla
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lección marcada como completada',
      progress: {
        lesson_id: lessonId,
        is_completed: true,
        overall_progress: overallProgress,
      },
    });
  } catch (error) {
    console.error('Error en POST /api/courses/[slug]/lessons/[lessonId]/progress:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

