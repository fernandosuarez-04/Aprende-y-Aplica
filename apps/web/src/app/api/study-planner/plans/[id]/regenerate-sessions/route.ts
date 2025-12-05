import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SessionService } from '@/features/auth/services/session.service';
import type { Database } from '@/lib/supabase/types';

/**
 * POST /api/study-planner/plans/[id]/regenerate-sessions
 * Regenera las sesiones de estudio para un plan existente
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await SessionService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id: planId } = await params;

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

    // Obtener el plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('study_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', currentUser.id)
      .single();

    if (planError || !plan) {
      console.error('❌ Error obteniendo plan:', planError);
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    console.log('📋 Plan encontrado:', {
      id: plan.id,
      name: plan.name,
      preferred_days: plan.preferred_days,
      preferred_time_blocks: plan.preferred_time_blocks,
    });

    // Parsear preferred_days (pueden venir como strings desde la BD)
    const preferredDays = Array.isArray(plan.preferred_days)
      ? plan.preferred_days.map((day: any) => {
          const parsed = parseInt(String(day), 10);
          return isNaN(parsed) ? null : parsed;
        }).filter((day: number | null): day is number => day !== null && day >= 0 && day <= 6)
      : [];

    if (preferredDays.length === 0) {
      return NextResponse.json(
        { error: 'El plan no tiene días válidos configurados' },
        { status: 400 }
      );
    }

    // Parsear preferred_time_blocks
    let preferredTimeBlocks: any[] = [];
    try {
      if (typeof plan.preferred_time_blocks === 'string') {
        preferredTimeBlocks = JSON.parse(plan.preferred_time_blocks);
      } else if (Array.isArray(plan.preferred_time_blocks)) {
        preferredTimeBlocks = plan.preferred_time_blocks;
      }
    } catch (e) {
      console.error('❌ Error parseando preferred_time_blocks:', e);
      return NextResponse.json(
        { error: 'Error al parsear los bloques de tiempo del plan' },
        { status: 400 }
      );
    }

    if (preferredTimeBlocks.length === 0) {
      return NextResponse.json(
        { error: 'El plan no tiene bloques de tiempo configurados' },
        { status: 400 }
      );
    }

    // Obtener los cursos del plan desde múltiples fuentes
    let courseIds: string[] = [];
    
    // 1. Intentar obtener desde learning_route_id si existe
    if (plan.learning_route_id) {
      const { data: routeCourses } = await supabaseAdmin
        .from('learning_route_courses')
        .select('course_id')
        .eq('route_id', plan.learning_route_id); // La tabla usa 'route_id', no 'learning_route_id'

      if (routeCourses && routeCourses.length > 0) {
        courseIds = routeCourses.map((rc: any) => rc.course_id);
        console.log('📚 Cursos obtenidos desde learning_route:', {
          routeId: plan.learning_route_id,
          coursesFound: courseIds.length,
          courseIds: courseIds.slice(0, 5), // Mostrar primeros 5 para debugging
        });
      } else {
        console.warn('⚠️ No se encontraron cursos en learning_route_courses para route_id:', plan.learning_route_id);
      }
    }

    // 2. Si no hay cursos desde learning_route, buscar en sesiones existentes del plan
    if (courseIds.length === 0) {
      const { data: existingSessions } = await supabaseAdmin
        .from('study_sessions')
        .select('course_id')
        .eq('plan_id', planId)
        .not('course_id', 'is', null);

      if (existingSessions && existingSessions.length > 0) {
        // Obtener course_ids únicos
        const uniqueCourseIds = [...new Set(existingSessions.map((s: any) => s.course_id).filter(Boolean))];
        courseIds = uniqueCourseIds;
        console.log('📚 Cursos obtenidos desde sesiones existentes:', courseIds.length);
      }
    }

    // 3. Si aún no hay cursos, intentar obtener desde course_purchases del usuario
    if (courseIds.length === 0) {
      const { data: userPurchases } = await supabaseAdmin
        .from('course_purchases')
        .select('course_id')
        .eq('user_id', currentUser.id)
        .eq('access_status', 'active')
        .limit(10); // Limitar a los primeros 10 cursos comprados

      if (userPurchases && userPurchases.length > 0) {
        courseIds = [...new Set(userPurchases.map((p: any) => p.course_id).filter(Boolean))];
        console.log('📚 Cursos obtenidos desde compras del usuario:', courseIds.length);
      }
    }

    // 4. Si aún no hay cursos, verificar si se enviaron en el body de la petición
    if (courseIds.length === 0) {
      try {
        const body = await request.json();
        if (body.course_ids && Array.isArray(body.course_ids) && body.course_ids.length > 0) {
          courseIds = body.course_ids;
          console.log('📚 Cursos obtenidos desde body de la petición:', courseIds.length);
        }
      } catch (e) {
        // No hay body o no es JSON válido, continuar
      }
    }

    if (courseIds.length === 0) {
      console.error('❌ No se pudieron encontrar cursos para el plan:', {
        planId,
        hasLearningRoute: !!plan.learning_route_id,
        learningRouteId: plan.learning_route_id,
      });
      return NextResponse.json(
        { 
          error: 'El plan no tiene cursos asociados. Por favor, asegúrate de que el plan tenga una ruta de aprendizaje asociada o cursos comprados.',
          details: 'No se encontraron cursos desde learning_route_id, sesiones existentes, compras del usuario, ni en el body de la petición.'
        },
        { status: 400 }
      );
    }

    console.log('📚 Cursos encontrados:', courseIds.length);

    // Obtener enrollments del usuario para cada curso (necesario para consultar progreso)
    const enrollmentsMap = new Map<string, string>(); // courseId -> enrollment_id
    for (const courseId of courseIds) {
      const { data: enrollment } = await supabaseAdmin
        .from('user_course_enrollments')
        .select('enrollment_id')
        .eq('user_id', currentUser.id)
        .eq('course_id', courseId)
        .single();

      if (enrollment) {
        enrollmentsMap.set(courseId, enrollment.enrollment_id);
      }
    }

    console.log('📚 Enrollments encontrados:', {
      totalCourses: courseIds.length,
      enrollmentsFound: enrollmentsMap.size,
      enrollmentIds: Array.from(enrollmentsMap.values()),
    });

    // Obtener progreso del usuario para todas las lecciones de los cursos
    // Excluir lecciones que ya están completadas, en progreso o iniciadas
    const enrollmentIds = Array.from(enrollmentsMap.values());
    let excludedLessonIds = new Set<string>();
    
    if (enrollmentIds.length > 0) {
      // Obtener todas las lecciones que tienen algún progreso (completadas, en progreso, iniciadas)
      const { data: progressData } = await supabaseAdmin
        .from('user_lesson_progress')
        .select('lesson_id, is_completed, lesson_status, started_at')
        .in('enrollment_id', enrollmentIds)
        .or('is_completed.eq.true,lesson_status.eq.completed,lesson_status.eq.in_progress,started_at.not.is.null');

      if (progressData && progressData.length > 0) {
        excludedLessonIds = new Set(progressData.map((p: any) => p.lesson_id));
        
        // Contar por tipo de estado para debugging
        const completed = progressData.filter((p: any) => p.is_completed || p.lesson_status === 'completed').length;
        const inProgress = progressData.filter((p: any) => p.lesson_status === 'in_progress' && !p.is_completed).length;
        const started = progressData.filter((p: any) => p.started_at && !p.is_completed && p.lesson_status !== 'in_progress').length;
        
        console.log(`✅ Lecciones excluidas del plan: ${excludedLessonIds.size} total`, {
          completadas: completed,
          en_progreso: inProgress,
          iniciadas: started,
        });
        console.log('📋 Lecciones excluidas:', Array.from(excludedLessonIds).slice(0, 10));
      }
    }

    // Obtener todas las lecciones de los cursos ORGANIZADAS POR CURSO Y MÓDULO
    // Estructura: [{ courseId, modules: [{ moduleId, lessons: [...] }] }]
    const coursesWithLessons: Array<{
      courseId: string;
      modules: Array<{
        moduleId: string;
        moduleOrder: number;
        lessons: Array<{
          lesson_id: string;
          lesson_title: string;
          duration_seconds: number;
          lesson_order_index: number;
          module_id: string;
          course_id: string;
        }>;
      }>;
    }> = [];
    
    let totalLessonsInAllCourses = 0; // Contador de todas las lecciones en módulos publicados
    let totalLessonsInAllCoursesIncludingUnpublished = 0; // Contador de TODAS las lecciones (incluyendo módulos no publicados)
    
    // Primero, contar TODAS las lecciones del curso directamente desde course_lessons
    for (const courseId of courseIds) {
      // Obtener TODOS los módulos del curso (publicados y no publicados)
      const { data: allModules } = await supabaseAdmin
        .from('course_modules')
        .select('module_id, module_order_index, is_published')
        .eq('course_id', courseId)
        .order('module_order_index', { ascending: true });
      
      // Contar todas las lecciones del curso (sin filtrar por módulo publicado)
      const allModuleIds = allModules?.map((m: any) => m.module_id) || [];
      let totalLessonsInDB = 0;
      if (allModuleIds.length > 0) {
        const { count } = await supabaseAdmin
          .from('course_lessons')
          .select('*', { count: 'exact', head: true })
          .in('module_id', allModuleIds);
        totalLessonsInDB = count || 0;
      }
      
      console.log(`🔍 Curso ${courseId} - Verificación directa desde BD:`, {
        totalLeccionesEnBD: totalLessonsInDB,
        totalModulos: allModules?.length || 0,
      });
      
      // Obtener solo módulos publicados para procesar
      const { data: modules } = await supabaseAdmin
        .from('course_modules')
        .select('module_id, module_order_index')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('module_order_index', { ascending: true });

      // Contar lecciones en módulos no publicados
      const unpublishedModuleIds = allModules?.filter((m: any) => !m.is_published).map((m: any) => m.module_id) || [];
      let lessonsInUnpublishedModules = 0;
      if (unpublishedModuleIds.length > 0) {
        const { count } = await supabaseAdmin
          .from('course_lessons')
          .select('*', { count: 'exact', head: true })
          .in('module_id', unpublishedModuleIds);
        lessonsInUnpublishedModules = count || 0;
      }

      console.log(`📦 Curso ${courseId}:`, {
        totalModulos: allModules?.length || 0,
        modulosPublicados: modules?.length || 0,
        modulosNoPublicados: (allModules?.length || 0) - (modules?.length || 0),
        totalLeccionesEnBD: totalLessonsInDB,
        leccionesEnModulosNoPublicados: lessonsInUnpublishedModules,
        leccionesEnModulosPublicados: totalLessonsInDB - lessonsInUnpublishedModules,
      });
      
      totalLessonsInAllCoursesIncludingUnpublished += totalLessonsInDB;

      if (modules && modules.length > 0) {
        const courseModules: Array<{
          moduleId: string;
          moduleOrder: number;
          lessons: any[];
        }> = [];

        for (const module of modules) {
          // Obtener TODAS las lecciones (publicadas y no publicadas) para contar correctamente
          const { data: allModuleLessons } = await supabaseAdmin
            .from('course_lessons')
            .select('lesson_id, is_published, lesson_title')
            .eq('module_id', module.module_id);
          
          // Obtener solo lecciones publicadas para procesar
          const { data: lessons } = await supabaseAdmin
            .from('course_lessons')
            .select('lesson_id, lesson_title, duration_seconds, lesson_order_index, module_id')
            .eq('module_id', module.module_id)
            .eq('is_published', true)
            .order('lesson_order_index', { ascending: true });

          const leccionesNoPublicadas = allModuleLessons?.filter((l: any) => !l.is_published) || [];
          
          console.log(`  📚 Módulo ${module.module_id} (orden ${module.module_order_index}):`, {
            totalLecciones: allModuleLessons?.length || 0,
            leccionesPublicadas: lessons?.length || 0,
            leccionesNoPublicadas: leccionesNoPublicadas.length,
            leccionesNoPublicadasDetalle: leccionesNoPublicadas.map((l: any) => ({ id: l.lesson_id, title: l.lesson_title })),
          });

          if (lessons && lessons.length > 0) {
            // Contar todas las lecciones antes de filtrar
            totalLessonsInAllCourses += lessons.length;
            
            // Filtrar lecciones que ya están completadas, en progreso o iniciadas
            const pendingLessons = lessons.filter(lesson => !excludedLessonIds.has(lesson.lesson_id));
            
            console.log(`📝 Módulo ${module.module_id}: ${lessons.length} lecciones totales, ${pendingLessons.length} pendientes (${lessons.length - pendingLessons.length} excluidas)`);
            
            if (pendingLessons.length > 0) {
              courseModules.push({
                moduleId: module.module_id,
                moduleOrder: module.module_order_index || 0,
                lessons: pendingLessons.map(lesson => ({
                  ...lesson,
                  course_id: courseId,
                })),
              });
            }
          }
        }

        if (courseModules.length > 0) {
          coursesWithLessons.push({
            courseId,
            modules: courseModules,
          });
        }
      }
    }

    // Crear array plano de lecciones en orden secuencial: curso 1 completo, luego curso 2 completo, etc.
    const allLessons: any[] = [];
    for (const course of coursesWithLessons) {
      for (const module of course.modules) {
        for (const lesson of module.lessons) {
          allLessons.push(lesson);
        }
      }
    }

    console.log(`📖 Resumen de lecciones:`, {
      totalEnBD: totalLessonsInAllCoursesIncludingUnpublished,
      totalEnModulosPublicados: totalLessonsInAllCourses,
      excluidas: excludedLessonIds.size,
      pendientes: allLessons.length,
      diferencia: totalLessonsInAllCourses - allLessons.length,
      esperadoExcluidas: excludedLessonIds.size,
      verificacion: totalLessonsInAllCourses === allLessons.length + excludedLessonIds.size ? '✅ Correcto' : '⚠️ Revisar',
      diferenciaConBD: totalLessonsInAllCoursesIncludingUnpublished - totalLessonsInAllCourses,
      leccionesEnModulosNoPublicados: totalLessonsInAllCoursesIncludingUnpublished - totalLessonsInAllCourses,
      nota: totalLessonsInAllCoursesIncludingUnpublished !== totalLessonsInAllCourses 
        ? `⚠️ Hay ${totalLessonsInAllCoursesIncludingUnpublished - totalLessonsInAllCourses} lecciones en módulos no publicados que no se están contando` 
        : '',
    });
    console.log(`📚 Cursos procesados: ${coursesWithLessons.length}`);
    coursesWithLessons.forEach((course, idx) => {
      const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
      console.log(`  Curso ${idx + 1} (${course.courseId}): ${course.modules.length} módulos, ${totalLessons} lecciones pendientes`);
    });

    if (allLessons.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron lecciones para los cursos del plan' },
        { status: 400 }
      );
    }

    // Eliminar sesiones existentes del plan
    const { error: deleteError } = await supabaseAdmin
      .from('study_sessions')
      .delete()
      .eq('plan_id', planId);

    if (deleteError) {
      console.error('⚠️ Error eliminando sesiones existentes:', deleteError);
      // Continuar de todas formas
    }

    // Generar nuevas sesiones
    const sessions: any[] = [];
    const timezone = plan.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    
    // NO limitar por semanas, generar hasta completar TODAS las lecciones
    let startDate: Date;
    
    if (plan.start_date) {
      startDate = new Date(plan.start_date);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    }
    
    console.log('📅 Generando sesiones para TODAS las lecciones:', {
      totalLessons: allLessons.length,
      startDate: startDate.toISOString(),
    });

    // Mapear bloques de tiempo por día
    const timeBlocksByDay = new Map<number, any[]>();
    const dayNameToNumber: Record<string, number> = {
      'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3,
      'Jueves': 4, 'Viernes': 5, 'Sábado': 6
    };

    for (const timeBlock of preferredTimeBlocks) {
      let dayNumber: number | undefined;
      
      if (typeof timeBlock.day === 'number') {
        dayNumber = timeBlock.day;
      } else if (timeBlock.label) {
        dayNumber = dayNameToNumber[timeBlock.label];
      }
      
      if (dayNumber !== undefined && dayNumber >= 0 && dayNumber <= 6) {
        if (!timeBlocksByDay.has(dayNumber)) {
          timeBlocksByDay.set(dayNumber, []);
        }
        timeBlocksByDay.get(dayNumber)!.push({
          start: timeBlock.start,
          end: timeBlock.end,
        });
      }
    }

    console.log('📅 Bloques de tiempo por día:', Array.from(timeBlocksByDay.entries()));
    console.log('📅 Días válidos:', preferredDays);

    let lessonIndex = 0;
    const minStudyMinutes = 30; // Valor por defecto
    
    // Generar sesiones hasta completar TODAS las lecciones
    // Iterar día por día hasta que se asignen todas las lecciones
    let currentDate = new Date(startDate);
    const maxDays = 365 * 2; // Límite de seguridad: máximo 2 años
    let daysProcessed = 0;

    while (lessonIndex < allLessons.length && daysProcessed < maxDays) {
      const dayOfWeek = currentDate.getDay();
      
      // Solo procesar días válidos
      if (preferredDays.includes(dayOfWeek)) {
        const dayTimeBlocks = timeBlocksByDay.get(dayOfWeek) || [];
        
        // Para cada bloque de tiempo de este día
        for (const timeBlock of dayTimeBlocks) {
          if (lessonIndex >= allLessons.length) break;

          const lesson = allLessons[lessonIndex];
          const lessonDurationMinutes = Math.ceil((lesson.duration_seconds || 0) / 60);
          const sessionDurationMinutes = Math.max(lessonDurationMinutes || minStudyMinutes, minStudyMinutes);

          let startHour = 9;
          let startMinute = 0;
          
          if (timeBlock.start) {
            const timeMatch = timeBlock.start.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
              startHour = parseInt(timeMatch[1], 10);
              startMinute = parseInt(timeMatch[2], 10);
            }
          }

          const startTime = new Date(currentDate);
          startTime.setHours(startHour, startMinute, 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + sessionDurationMinutes);

          sessions.push({
            plan_id: plan.id,
            user_id: currentUser.id,
            title: lesson.lesson_title || `Sesión de estudio - ${lesson.course_id}`,
            description: `Lección: ${lesson.lesson_title}`,
            course_id: lesson.course_id,
            lesson_id: lesson.lesson_id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            // duration_minutes es una columna generada, no se debe insertar manualmente
            status: 'planned',
            session_type: sessionDurationMinutes <= 30 ? 'short' : sessionDurationMinutes <= 60 ? 'medium' : 'long',
            lesson_min_time_minutes: lessonDurationMinutes,
          });

          lessonIndex++;
        }
      }
      
      // Avanzar al siguiente día
      currentDate.setDate(currentDate.getDate() + 1);
      daysProcessed++;
    }

    if (lessonIndex < allLessons.length) {
      console.warn(`⚠️ No se pudieron asignar todas las lecciones. Asignadas: ${lessonIndex} de ${allLessons.length}`);
    }

    console.log(`📅 Sesiones a crear: ${sessions.length}`);

    // Insertar sesiones en lotes
    const batchSize = 50;
    let sessionsCreated = 0;
    
    for (let i = 0; i < sessions.length; i += batchSize) {
      const batch = sessions.slice(i, i + batchSize);
      const { data: insertedSessions, error: sessionsError } = await supabaseAdmin
        .from('study_sessions')
        .insert(batch)
        .select('id, title, start_time, end_time');

      if (sessionsError) {
        console.error('❌ Error creando sesiones:', sessionsError);
        return NextResponse.json(
          { error: 'Error al crear sesiones', details: sessionsError.message },
          { status: 500 }
        );
      }

      sessionsCreated += batch.length;
    }

    console.log(`✅ Total de sesiones creadas: ${sessionsCreated}`);

    return NextResponse.json({
      success: true,
      sessionsCreated,
      message: `Se crearon ${sessionsCreated} sesiones para el plan`,
    });
  } catch (error: any) {
    console.error('Error regenerating sessions:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

