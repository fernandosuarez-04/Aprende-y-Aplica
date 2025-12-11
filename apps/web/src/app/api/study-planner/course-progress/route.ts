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

    console.log(`📊 [course-progress] Consultando progreso:`);
    console.log(`   userId: ${userId}`);
    console.log(`   courseId: ${courseId}`);
    console.log(`   enrollmentId: ${enrollmentId || 'no proporcionado'}`);

    // Obtener enrollment si no se proporcionó
    let finalEnrollmentId = enrollmentId;
    if (!finalEnrollmentId) {
      const { data: enrollment } = await supabase
        .from('user_course_enrollments')
        .select('enrollment_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      finalEnrollmentId = enrollment?.enrollment_id || null;
      console.log(`   enrollment_id encontrado: ${finalEnrollmentId || 'no encontrado'}`);
    }

    // Obtener todas las lecciones del curso para poder filtrar correctamente
    const { data: courseModules, error: modulesError } = await supabase
      .from('course_modules')
      .select('module_id')
      .eq('course_id', courseId)
      .eq('is_published', true);

    console.log(`   📦 Módulos obtenidos: ${courseModules?.length || 0}`);
    if (modulesError) {
      console.error(`   ❌ Error obteniendo módulos:`, modulesError);
    }

    if (!courseModules || courseModules.length === 0) {
      console.log(`   ⚠️ No se encontraron módulos para el curso ${courseId}`);
      return NextResponse.json({
        success: true,
        enrollmentId: finalEnrollmentId,
        courseId,
        completedLessonsCount: 0,
        completedLessonIds: []
      });
    }

    const moduleIds = courseModules.map(m => m.module_id);
    console.log(`   📦 IDs de módulos:`, moduleIds.slice(0, 3));

    // Obtener todas las lecciones del curso
    const { data: courseLessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('lesson_id')
      .in('module_id', moduleIds)
      .eq('is_published', true);

    console.log(`   📚 Lecciones obtenidas: ${courseLessons?.length || 0}`);
    if (lessonsError) {
      console.error(`   ❌ Error obteniendo lecciones:`, lessonsError);
    }

    if (!courseLessons || courseLessons.length === 0) {
      console.log(`   ⚠️ No se encontraron lecciones para el curso ${courseId}`);
      return NextResponse.json({
        success: true,
        enrollmentId: finalEnrollmentId,
        courseId,
        completedLessonsCount: 0,
        completedLessonIds: []
      });
    }

    const lessonIds = courseLessons.map(l => l.lesson_id);
    console.log(`   Total lecciones del curso: ${lessonIds.length}`);
    console.log(`   Primeras 5 lesson_ids:`, lessonIds.slice(0, 5));

    // Obtener lecciones completadas del usuario para este curso
    // Primero intentar con enrollment_id si está disponible
    let completedLessons: any[] = [];

    if (finalEnrollmentId) {
      console.log(`   🔍 Consultando progreso con:`);
      console.log(`      - user_id: ${userId}`);
      console.log(`      - enrollment_id: ${finalEnrollmentId}`);
      console.log(`      - is_completed: true`);
      console.log(`      - lesson_id IN (${lessonIds.length} lecciones)`);

      const { data, error: progressError } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, is_completed, enrollment_id')
        .eq('user_id', userId)
        .eq('enrollment_id', finalEnrollmentId)
        .eq('is_completed', true)
        .in('lesson_id', lessonIds);

      console.log(`   📥 Resultado de la consulta:`, data?.length || 0, 'lecciones');
      if (progressError) {
        console.error(`   ❌ Error en la consulta:`, progressError);
      }
      if (data && data.length > 0) {
        console.log(`   Primeras 3 lecciones completadas:`, data.slice(0, 3));
      }

      if (!progressError && data) {
        completedLessons = data;
        console.log(`   ✅ Lecciones completadas (con enrollment_id): ${completedLessons.length}`);
      } else {
        console.warn(`   ⚠️ Error obteniendo progreso con enrollment_id:`, progressError);
      }
    }

    // Si no hay enrollment_id o no se encontraron lecciones, intentar sin enrollment_id
    // pero filtrando por las lecciones del curso
    if (completedLessons.length === 0) {
      console.log(`   🔍 Intentando consulta sin enrollment_id (fallback)...`);

      const { data, error: progressError } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, is_completed, enrollment_id')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .in('lesson_id', lessonIds);

      console.log(`   📥 Resultado del fallback:`, data?.length || 0, 'lecciones');
      if (progressError) {
        console.error(`   ❌ Error en consulta fallback:`, progressError);
      }
      if (data && data.length > 0) {
        console.log(`   Primeras 3 lecciones (fallback):`, data.slice(0, 3));
      }

      if (!progressError && data) {
        completedLessons = data;
        console.log(`   ✅ Lecciones completadas (sin enrollment_id, filtradas por curso): ${completedLessons.length}`);
      } else {
        console.error('   ❌ Error obteniendo progreso de lecciones:', progressError);
        return NextResponse.json(
          { error: 'Error obteniendo progreso', completedLessonsCount: 0 },
          { status: 500 }
        );
      }
    }

    const completedLessonsCount = completedLessons?.length || 0;
    const completedLessonIds = (completedLessons || []).map(l => l.lesson_id);

    console.log(`   ✅ Lecciones completadas encontradas: ${completedLessonsCount}`);
    if (completedLessonsCount > 0) {
      console.log(`   IDs:`, completedLessonIds.slice(0, 5));
    }

    return NextResponse.json({
      success: true,
      enrollmentId: finalEnrollmentId,
      courseId,
      completedLessonsCount,
      completedLessonIds
    });
  } catch (error) {
    console.error('Error en course-progress:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', completedLessonsCount: 0 },
      { status: 500 }
    );
  }
}

