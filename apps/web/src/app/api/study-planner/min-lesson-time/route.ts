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
      .select('module_id, course_id, module_title')
      .in('course_id', courseIds);

    if (modulesError || !modules || modules.length === 0) {
      return NextResponse.json({
        minTimeMinutes: 15,
        maxTimeMinutes: 90,
        shortestLesson: null,
        longestLesson: null,
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
        maxTimeMinutes: 90,
        shortestLesson: null,
        longestLesson: null,
      });
    }

    const lessonIds = lessons.map(l => l.lesson_id);

    // Obtener tiempos estimados de las lecciones (usando lesson_time_estimates)
    const { data: timeEstimates, error: timeError } = await supabase
      .from('lesson_time_estimates')
      .select('lesson_id, video_minutes, activities_time_minutes, reading_time_minutes, exercise_time_minutes, quiz_time_minutes, interactions_time_minutes, total_time_minutes')
      .in('lesson_id', lessonIds);

    // Crear un mapa de lesson_id -> información de tiempo
    const timeMap = new Map<string, {
      video: number;
      activities: number;
      materials: number;
      interactions: number;
      total: number;
    }>();
    
    if (timeEstimates && timeEstimates.length > 0) {
      timeEstimates.forEach(te => {
        const videoTime = te.video_minutes || 0;
        const activitiesTime = (te.activities_time_minutes || 0) + (te.exercise_time_minutes || 0) + (te.quiz_time_minutes || 0);
        const materialsTime = te.reading_time_minutes || 0; // Materiales se cuentan como reading_time
        const interactionsTime = te.interactions_time_minutes || 0;
        
        // Si hay total_time_minutes, usarlo, sino calcular
        let total = te.total_time_minutes || 0;
        if (!total || total === 0) {
          total = videoTime + activitiesTime + materialsTime + interactionsTime;
        }
        
        timeMap.set(te.lesson_id, {
          video: videoTime,
          activities: activitiesTime,
          materials: materialsTime,
          interactions: interactionsTime,
          total: Number(total),
        });
      });
    }

    // Obtener todas las actividades y materiales de una vez para optimizar
    const lessonsWithoutEstimate = lessons.filter(l => !timeMap.has(l.lesson_id));
    const lessonIdsWithoutEstimate = lessonsWithoutEstimate.map(l => l.lesson_id);
    
    // Obtener actividades y materiales en paralelo solo para lecciones sin estimación
    const [activitiesData, materialsData] = await Promise.all([
      lessonIdsWithoutEstimate.length > 0
        ? supabase
            .from('lesson_activities')
            .select('lesson_id, estimated_time_minutes')
            .in('lesson_id', lessonIdsWithoutEstimate)
            .not('estimated_time_minutes', 'is', null)
        : Promise.resolve({ data: [], error: null }),
      lessonIdsWithoutEstimate.length > 0
        ? supabase
            .from('lesson_materials')
            .select('lesson_id, estimated_time_minutes')
            .in('lesson_id', lessonIdsWithoutEstimate)
            .not('estimated_time_minutes', 'is', null)
        : Promise.resolve({ data: [], error: null }),
    ]);

    // Crear mapas de actividades y materiales por lesson_id
    const activitiesMap = new Map<string, number>();
    if (activitiesData.data) {
      activitiesData.data.forEach((a: any) => {
        const current = activitiesMap.get(a.lesson_id) || 0;
        activitiesMap.set(a.lesson_id, current + (Number(a.estimated_time_minutes) || 0));
      });
    }

    const materialsMap = new Map<string, number>();
    if (materialsData.data) {
      materialsData.data.forEach((m: any) => {
        const current = materialsMap.get(m.lesson_id) || 0;
        materialsMap.set(m.lesson_id, current + (Number(m.estimated_time_minutes) || 0));
      });
    }

    // Calcular tiempos para todas las lecciones
    const lessonsWithTime = lessons.map(lesson => {
      let totalMinutes = 15; // Valor por defecto
      let videoTime = 0;
      let activitiesTime = 0;
      let materialsTime = 0;
      let interactionsTime = 3; // 3 minutos por defecto para interacciones
      
      if (timeMap.has(lesson.lesson_id)) {
        // Usar estimación de la tabla
        const times = timeMap.get(lesson.lesson_id)!;
        videoTime = times.video;
        activitiesTime = times.activities;
        materialsTime = times.materials;
        interactionsTime = times.interactions || 3;
        totalMinutes = times.total;
      } else {
        // Calcular manualmente desde duration_seconds
        if (lesson.duration_seconds) {
          videoTime = lesson.duration_seconds / 60;
        }
        
        // Obtener tiempo de actividades del mapa
        activitiesTime = activitiesMap.get(lesson.lesson_id) || 0;
        
        // Obtener tiempo de materiales del mapa
        materialsTime = materialsMap.get(lesson.lesson_id) || 0;
        
        // Calcular total
        totalMinutes = videoTime + activitiesTime + materialsTime + interactionsTime;
        if (totalMinutes < 15) totalMinutes = 15; // Mínimo 15 minutos
      }
      
      return {
        lesson_id: lesson.lesson_id,
        lesson_title: lesson.lesson_title,
        total_minutes: totalMinutes,
        video_minutes: videoTime,
        activities_minutes: activitiesTime,
        materials_minutes: materialsTime,
        interactions_minutes: interactionsTime,
        module_id: lesson.module_id,
      };
    });

    if (lessonsWithTime.length === 0) {
      return NextResponse.json({
        minTimeMinutes: 15,
        maxTimeMinutes: 90,
        shortestLesson: null,
        longestLesson: null,
      });
    }

    // Encontrar la lección más corta
    const shortestLesson = lessonsWithTime.reduce((min, lesson) => 
      lesson.total_minutes < min.total_minutes ? lesson : min
    );

    // Encontrar la lección más larga
    const longestLesson = lessonsWithTime.reduce((max, lesson) => 
      lesson.total_minutes > max.total_minutes ? lesson : max
    );

    // Redondear hacia arriba y asegurar mínimo de 15 minutos
    const minTimeMinutes = Math.max(15, Math.ceil(shortestLesson.total_minutes));
    
    // Tiempo máximo: usar la lección más larga
    const maxTimeMinutes = Math.ceil(longestLesson.total_minutes);

    // Función helper para obtener información del curso y módulo de una lección
    const getLessonInfo = async (lessonModuleId: string) => {
      const lessonModule = modules.find(m => m.module_id === lessonModuleId);
      let courseTitle = 'Curso desconocido';
      let moduleTitle = 'Módulo desconocido';
      
      if (lessonModule) {
        // Obtener título del módulo
        moduleTitle = lessonModule.module_title || 'Módulo desconocido';
        
        // Obtener título del curso
        const { data: course } = await supabase
          .from('courses')
          .select('title')
          .eq('id', lessonModule.course_id)
          .single();
        
        if (course) {
          courseTitle = course.title;
        }
      }
      
      return { courseTitle, moduleTitle };
    };

    // Obtener información del curso y módulo para ambas lecciones
    const [shortestInfo, longestInfo] = await Promise.all([
      getLessonInfo(shortestLesson.module_id),
      getLessonInfo(longestLesson.module_id),
    ]);

    return NextResponse.json({
      minTimeMinutes,
      maxTimeMinutes,
      shortestLesson: {
        lesson_id: shortestLesson.lesson_id,
        lesson_title: shortestLesson.lesson_title,
        total_minutes: Math.ceil(shortestLesson.total_minutes),
        course_title: shortestInfo.courseTitle,
        module_title: shortestInfo.moduleTitle,
      },
      longestLesson: {
        lesson_id: longestLesson.lesson_id,
        lesson_title: longestLesson.lesson_title,
        total_minutes: Math.ceil(longestLesson.total_minutes),
        course_title: longestInfo.courseTitle,
        module_title: longestInfo.moduleTitle,
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



