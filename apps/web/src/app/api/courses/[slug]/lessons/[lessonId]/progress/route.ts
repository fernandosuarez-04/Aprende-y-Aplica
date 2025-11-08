import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { CertificateService } from '@/core/services/certificate.service';
import { logger } from '@/lib/utils/logger';

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

    // Obtener el curso por slug con información del instructor
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, instructor_id')
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
        // console.error('Error creando enrollment:', createError);
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

    // Obtener progreso actual de la lección
    const { data: existingProgress } = await supabase
      .from('user_lesson_progress')
      .select('progress_id, is_completed')
      .eq('enrollment_id', enrollmentId)
      .eq('lesson_id', lessonId)
      .single();

    const now = new Date().toISOString();

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
        // console.error('Error actualizando progreso:', updateError);
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
        // console.error('Error creando progreso:', insertError);
        return NextResponse.json(
          { error: 'Error al guardar progreso' },
          { status: 500 }
        );
      }
    }

    // Calcular y actualizar progreso general del curso
    const { data: allProgress } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, is_completed')
      .eq('enrollment_id', enrollmentId);

    const totalLessons = allLessons.length;
    const completedLessons = allProgress?.filter((p: any) => p.is_completed).length || 0;
    const overallProgress = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100 * 100) / 100 // Redondear a 2 decimales
      : 0;

    // Obtener información del curso antes de actualizar el enrollment
    const { data: courseInfo } = await supabase
      .from('courses')
      .select('id, title, slug')
      .eq('id', courseId)
      .single();

    // Obtener información de la lección para la notificación
    const { data: lessonInfo } = await supabase
      .from('course_lessons')
      .select('title')
      .eq('lesson_id', lessonId)
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
      // console.error('Error actualizando enrollment:', updateEnrollmentError);
      // No retornar error aquí, el progreso de la lección ya se guardó
    }

    // Crear notificación de lección completada (en background)
    (async () => {
      try {
        if (courseInfo && lessonInfo) {
          const { AutoNotificationsService } = await import('@/features/notifications/services/auto-notifications.service');
          await AutoNotificationsService.notifyCourseLessonCompleted(
            currentUser.id,
            courseId,
            courseInfo.title,
            lessonId,
            lessonInfo.title
          );
        }
      } catch (notificationError) {
        // Error silenciado para no afectar el flujo principal
      }
    })().catch(() => {}); // Fire and forget

    // Si el curso está completado al 100%, generar certificado automáticamente
    if (overallProgress === 100) {
      try {
        // Obtener información completa del curso e instructor (si no la tenemos ya)
        const { data: courseInfoFull } = await supabase
          .from('courses')
          .select('id, title, instructor_id')
          .eq('id', courseId)
          .single();

        // Obtener información del instructor
        let instructorName = 'Instructor'
        if (courseInfoFull?.instructor_id) {
          const { data: instructor } = await supabase
            .from('users')
            .select('first_name, last_name, username')
            .eq('id', courseInfoFull.instructor_id)
            .single();

          if (instructor) {
            const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
            instructorName = fullName || instructor.username || 'Instructor'
          }
        }

        // Obtener información del usuario
        const { data: userInfo } = await supabase
          .from('users')
          .select('first_name, last_name, username, display_name')
          .eq('id', currentUser.id)
          .single();

        const userName = userInfo?.display_name || 
          `${userInfo?.first_name || ''} ${userInfo?.last_name || ''}`.trim() || 
          userInfo?.username || 
          'Usuario'

        // Generar certificado
        const certificateUrl = await CertificateService.generateCertificate({
          userId: currentUser.id,
          courseId: courseId,
          enrollmentId: enrollmentId,
          courseTitle: courseInfoFull?.title || courseInfo?.title || 'Curso',
          instructorName: instructorName,
          userName: userName
        })

        if (certificateUrl) {
          // Crear registro del certificado en la BD
          await CertificateService.createCertificateRecord(
            currentUser.id,
            courseId,
            enrollmentId,
            certificateUrl
          )
          logger.log('✅ Certificado generado automáticamente para curso completado')
        } else {
          logger.warn('⚠️ No se pudo generar el certificado automáticamente')
        }

        // Crear notificación de curso completado (en background)
        (async () => {
          try {
            const courseTitle = courseInfoFull?.title || courseInfo?.title
            if (courseTitle) {
              const { AutoNotificationsService } = await import('@/features/notifications/services/auto-notifications.service');
              await AutoNotificationsService.notifyCourseCompleted(
                currentUser.id,
                courseId,
                courseTitle,
                !!certificateUrl // hasCertificate
              );
            }
          } catch (notificationError) {
            // Error silenciado para no afectar el flujo principal
          }
        })().catch(() => {}); // Fire and forget
      } catch (certError) {
        logger.error('Error generando certificado automáticamente:', certError)
        // No fallar la respuesta si el certificado no se genera
        // El usuario puede generar el certificado manualmente después
        
        // Crear notificación de curso completado incluso si falla el certificado
        (async () => {
          try {
            const courseTitle = courseInfo?.title
            if (courseTitle) {
              const { AutoNotificationsService } = await import('@/features/notifications/services/auto-notifications.service');
              await AutoNotificationsService.notifyCourseCompleted(
                currentUser.id,
                courseId,
                courseTitle,
                false // hasCertificate = false porque falló
              );
            }
          } catch (notificationError) {
            // Error silenciado para no afectar el flujo principal
          }
        })().catch(() => {}); // Fire and forget
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
    // console.error('Error en POST /api/courses/[slug]/lessons/[lessonId]/progress:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

