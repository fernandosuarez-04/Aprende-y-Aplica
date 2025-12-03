import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * POST /api/study-planner/min-lesson-time
 * Obtiene el tiempo mínimo de lección de los cursos seleccionados
 * Retorna información detallada sobre la lección más corta
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseIds } = body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'courseIds es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener todas las lecciones de los cursos seleccionados con información completa
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('module_id, course_id')
      .in('course_id', courseIds);

    if (modulesError || !modules || modules.length === 0) {
      return NextResponse.json({
        minTimeMinutes: 15,
        shortestLesson: null,
      });
    }

    const moduleIds = modules.map(m => m.module_id);

    // Obtener lecciones de esos módulos con información completa
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('lesson_id, lesson_title, duration_seconds, module_id')
      .in('module_id', moduleIds)
      .eq('is_published', true);

    if (lessonsError || !lessons || lessons.length === 0) {
      return NextResponse.json({
        minTimeMinutes: 15,
        shortestLesson: null,
      });
    }

    const lessonIds = lessons.map(l => l.lesson_id);

    // Obtener tiempos estimados de las lecciones (usando lesson_time_estimates)
    const { data: timeEstimates, error: timeError } = await supabase
      .from('lesson_time_estimates')
      .select('lesson_id, total_time_minutes')
      .in('lesson_id', lessonIds)
      .not('total_time_minutes', 'is', null)
      .gt('total_time_minutes', 0);

    // Crear un mapa de lesson_id -> tiempo total
    const timeMap = new Map<string, number>();
    
    if (timeEstimates && timeEstimates.length > 0) {
      timeEstimates.forEach(te => {
        timeMap.set(te.lesson_id, Number(te.total_time_minutes));
      });
    }

    // Para lecciones sin estimación, calcular manualmente
    const lessonsWithTime = lessons.map(lesson => {
      let totalMinutes = 15; // Valor por defecto
      
      if (timeMap.has(lesson.lesson_id)) {
        // Usar estimación de la tabla
        totalMinutes = timeMap.get(lesson.lesson_id)!;
      } else if (lesson.duration_seconds) {
        // Calcular desde duration_seconds + 3 min de interacciones
        totalMinutes = (lesson.duration_seconds / 60) + 3;
      }
      
      return {
        lesson_id: lesson.lesson_id,
        lesson_title: lesson.lesson_title,
        total_minutes: totalMinutes,
        module_id: lesson.module_id,
      };
    });

    if (lessonsWithTime.length === 0) {
      return NextResponse.json({
        minTimeMinutes: 15,
        shortestLesson: null,
      });
    }

    // Encontrar la lección más corta
    const shortestLesson = lessonsWithTime.reduce((min, lesson) => 
      lesson.total_minutes < min.total_minutes ? lesson : min
    );

    // Redondear hacia arriba y asegurar mínimo de 15 minutos
    const minTimeMinutes = Math.max(15, Math.ceil(shortestLesson.total_minutes));

    // Obtener información del curso para la lección más corta
    const lessonModule = modules.find(m => m.module_id === shortestLesson.module_id);
    let courseTitle = 'Curso desconocido';
    
    if (lessonModule) {
      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', lessonModule.course_id)
        .single();
      
      if (course) {
        courseTitle = course.title;
      }
    }

    return NextResponse.json({
      minTimeMinutes,
      shortestLesson: {
        lesson_id: shortestLesson.lesson_id,
        lesson_title: shortestLesson.lesson_title,
        total_minutes: Math.ceil(shortestLesson.total_minutes),
        course_title: courseTitle,
      },
    });
  } catch (error) {
    console.error('Error in min lesson time API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



