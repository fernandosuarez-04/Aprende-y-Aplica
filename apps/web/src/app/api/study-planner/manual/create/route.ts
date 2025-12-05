import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SessionService } from '@/features/auth/services/session.service';
import type { Database } from '@/lib/supabase/types';

/**
 * POST /api/study-planner/manual/create
 * Crea un plan de estudio manual
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
    const {
      name,
      description,
      learning_route_id,
      course_ids,
      preferred_days,
      preferred_time_blocks,
      min_study_minutes,
      min_rest_minutes,
      max_study_session_minutes,
      goal_hours_per_week,
      break_intervals,
    } = body;

    console.log('📥 Creando plan manual:', {
      userId: currentUser.id,
      name,
      courseIds: course_ids?.length || 0,
      preferred_days: preferred_days,
      preferred_days_type: typeof preferred_days,
      preferred_days_isArray: Array.isArray(preferred_days),
      preferred_time_blocks: preferred_time_blocks,
    });

    // Validaciones
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre del plan es requerido' },
        { status: 400 }
      );
    }

    if (!preferred_days || !Array.isArray(preferred_days) || preferred_days.length === 0) {
      return NextResponse.json(
        { error: 'Debes seleccionar al menos un día de la semana' },
        { status: 400 }
      );
    }

    // Asegurar que preferred_days sea un array de números válidos (0-6, formato JavaScript Date)
    // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    // PostgreSQL espera smallint[], así que convertimos explícitamente
    const validDays = preferred_days
      .map((day: any) => {
        const parsed = parseInt(day, 10);
        return isNaN(parsed) ? null : parsed;
      })
      .filter((day: number | null): day is number => day !== null && day >= 0 && day <= 6);
    
    if (validDays.length === 0) {
      console.error('❌ Validación de días falló:', {
        original: preferred_days,
        validDays,
      });
      return NextResponse.json(
        { error: 'Los días seleccionados no son válidos. Deben ser números entre 0 (Domingo) y 6 (Sábado)' },
        { status: 400 }
      );
    }

    // Crear cliente con Service Role Key para bypass RLS
    // Esto es necesario porque el proyecto usa autenticación personalizada, no Supabase Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables de entorno faltantes:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
      });
      return NextResponse.json(
        { 
          error: 'Configuración del servidor incompleta',
          details: 'Faltan variables de entorno de Supabase',
        },
        { status: 500 }
      );
    }

    // Cliente con Service Role Key para insertar (bypass RLS)
    const supabaseAdmin = createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Cliente normal para verificaciones (con RLS)
    const supabase = await createClient();

    // Calcular intervalos de descanso si no vienen en el body
    let calculatedBreakIntervals = break_intervals;
    if (!calculatedBreakIntervals && min_study_minutes && max_study_session_minutes && min_rest_minutes) {
      calculatedBreakIntervals = calculateBreakIntervals(
        min_study_minutes,
        max_study_session_minutes,
        min_rest_minutes
      );
      console.log('✅ Intervalos de descanso calculados:', calculatedBreakIntervals);
    }

    // Preparar datos del plan
    // Convertir preferred_days a formato PostgreSQL smallint[] explícitamente
    const planData: any = {
      user_id: currentUser.id,
      name: name.trim(),
      description: description?.trim() || null,
      goal_hours_per_week: goal_hours_per_week ? parseFloat(String(goal_hours_per_week)) : 5,
      preferred_days: validDays, // Array de números (0-6), Supabase lo convierte a smallint[]
      preferred_time_blocks: Array.isArray(preferred_time_blocks) ? preferred_time_blocks : [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      generation_mode: 'manual',
    };

    // Incluir learning_route_id solo si está presente
    if (learning_route_id) {
      planData.learning_route_id = learning_route_id;
    }

    // Incluir tiempos y intervalos de descanso
    if (min_study_minutes) {
      planData.min_study_minutes = parseInt(String(min_study_minutes), 10);
    }
    if (min_rest_minutes) {
      planData.min_rest_minutes = parseInt(String(min_rest_minutes), 10);
    }
    if (max_study_session_minutes) {
      planData.max_study_session_minutes = parseInt(String(max_study_session_minutes), 10);
    }
    if (calculatedBreakIntervals && Array.isArray(calculatedBreakIntervals)) {
      planData.break_intervals = calculatedBreakIntervals;
    }

    console.log('📋 Datos del plan a insertar:', {
      user_id: planData.user_id,
      name: planData.name,
      goal_hours_per_week: planData.goal_hours_per_week,
      preferred_days: planData.preferred_days,
      preferred_days_type: typeof planData.preferred_days,
      preferred_days_isArray: Array.isArray(planData.preferred_days),
      preferred_days_length: Array.isArray(planData.preferred_days) ? planData.preferred_days.length : 0,
      preferred_time_blocks: planData.preferred_time_blocks,
      preferred_time_blocks_length: Array.isArray(planData.preferred_time_blocks) ? planData.preferred_time_blocks.length : 0,
      timezone: planData.timezone,
      generation_mode: planData.generation_mode,
      learning_route_id: planData.learning_route_id || null,
    });

    // Crear el plan usando Service Role Key para bypass RLS
    // Ya validamos que el usuario está autenticado arriba
    const { data: plan, error: planError } = await supabaseAdmin
      .from('study_plans')
      .insert(planData)
      .select()
      .single();

    console.log('📊 Resultado de la inserción:', {
      hasPlan: !!plan,
      planId: plan?.id,
      hasError: !!planError,
      errorMessage: planError?.message,
      errorCode: planError?.code,
      errorDetails: planError?.details,
      errorHint: planError?.hint,
    });

    if (planError) {
      console.error('❌ Error creando plan:', {
        message: planError.message,
        details: planError.details,
        hint: planError.hint,
        code: planError.code,
        fullError: planError,
        planData: {
          user_id: planData.user_id,
          name: planData.name,
          preferred_days: planData.preferred_days,
          preferred_days_type: typeof planData.preferred_days,
        },
      });
      
      // Mensaje de error más descriptivo según el código de error
      let errorMessage = 'Error al crear el plan';
      if (planError.code === '23505') {
        errorMessage = 'Ya existe un plan con estos datos';
      } else if (planError.code === '23503') {
        errorMessage = 'Error de referencia: Verifica que la ruta de aprendizaje existe';
      } else if (planError.code === '23502') {
        errorMessage = 'Faltan campos requeridos en el plan';
      } else if (planError.message?.includes('array')) {
        errorMessage = 'Error en el formato de los días seleccionados';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: planError.message,
          hint: planError.hint,
          code: planError.code,
        },
        { status: 500 }
      );
    }

    if (!plan) {
      console.error('❌ Plan creado pero no se retornó data');
      return NextResponse.json(
        { error: 'Error al crear el plan: no se recibió respuesta' },
        { status: 500 }
      );
    }

    console.log('✅ Plan creado:', plan.id);

    // Verificación post-inserción: confirmar que el plan realmente existe en la BD
    // Usar cliente admin para la verificación también
    const { data: verifyPlan, error: verifyError } = await supabaseAdmin
      .from('study_plans')
      .select('id, name, user_id, created_at')
      .eq('id', plan.id)
      .eq('user_id', currentUser.id)
      .single();

    if (verifyError || !verifyPlan) {
      console.error('❌ Error verificando plan después de creación:', {
        verifyError,
        planId: plan.id,
      });
      return NextResponse.json(
        { 
          error: 'El plan se creó pero no se pudo verificar en la base de datos',
          details: verifyError?.message || 'Error de verificación',
        },
        { status: 500 }
      );
    }

    console.log('✅ Plan verificado en BD:', verifyPlan.id);

    // Crear sesiones de estudio basadas en los cursos y horarios
    let sessionsCreated = 0;
    
    console.log('🔍 Verificando condiciones para crear sesiones:', {
      hasCourseIds: !!(course_ids && course_ids.length > 0),
      courseIdsCount: course_ids?.length || 0,
      courseIds: course_ids,
      hasTimeBlocks: !!(preferred_time_blocks && preferred_time_blocks.length > 0),
      timeBlocksCount: preferred_time_blocks?.length || 0,
      timeBlocks: preferred_time_blocks,
    });
    
    if (course_ids && course_ids.length > 0 && preferred_time_blocks && preferred_time_blocks.length > 0) {
      console.log('📚 Creando sesiones para cursos:', course_ids.length);
      
      // Obtener enrollments del usuario para cada curso (necesario para consultar progreso)
      const enrollmentsMap = new Map<string, string>(); // courseId -> enrollment_id
      for (const courseId of course_ids) {
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
        totalCourses: course_ids.length,
        enrollmentsFound: enrollmentsMap.size,
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
        }
      }

      // Obtener todas las lecciones de los cursos seleccionados ORGANIZADAS POR CURSO Y MÓDULO
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
      
      let totalLessonsInAllCourses = 0; // Contador de todas las lecciones antes de filtrar
      
      for (const courseId of course_ids) {
        // Obtener módulos del curso (usar cliente admin para bypass RLS)
        const { data: modules } = await supabaseAdmin
          .from('course_modules')
          .select('module_id, module_order_index')
          .eq('course_id', courseId)
          .eq('is_published', true)
          .order('module_order_index', { ascending: true });

        if (modules && modules.length > 0) {
          const courseModules: Array<{
            moduleId: string;
            moduleOrder: number;
            lessons: any[];
          }> = [];

          for (const module of modules) {
            // Obtener lecciones de cada módulo (usar cliente admin para bypass RLS)
            const { data: lessons } = await supabaseAdmin
              .from('course_lessons')
              .select('lesson_id, lesson_title, duration_seconds, lesson_order_index, module_id')
              .eq('module_id', module.module_id)
              .eq('is_published', true)
              .order('lesson_order_index', { ascending: true });

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
        totalEnCursos: totalLessonsInAllCourses,
        excluidas: excludedLessonIds.size,
        pendientes: allLessons.length,
        diferencia: totalLessonsInAllCourses - allLessons.length,
        esperadoExcluidas: excludedLessonIds.size,
        verificacion: totalLessonsInAllCourses === allLessons.length + excludedLessonIds.size ? '✅ Correcto' : '⚠️ Revisar',
      });
      console.log(`📚 Cursos procesados: ${coursesWithLessons.length}`);
      coursesWithLessons.forEach((course, idx) => {
        const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
        console.log(`  Curso ${idx + 1} (${course.courseId}): ${course.modules.length} módulos, ${totalLessons} lecciones pendientes`);
      });

      if (allLessons.length > 0) {
        // Generar sesiones basadas en los horarios configurados
        const sessions: any[] = [];
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        
        // NO limitar por semanas, generar hasta completar TODAS las lecciones
        
        // Usar la fecha actual como fecha de inicio
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        
        console.log('📅 Fecha de inicio para sesiones:', {
          startDate_used: startDate.toISOString(),
        });
        
        // Los días ya vienen en formato JavaScript Date (0-6)
        // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
        const dayNumbers = validDays;

        let lessonIndex = 0;
        
        // Mapear los bloques de tiempo por día
        // preferred_time_blocks viene como: [{ start: "09:00", end: "10:00", label: "Lunes" }, ...]
        // O también puede venir con un campo 'day' numérico (0-6)
        const timeBlocksByDay = new Map<number, any[]>();
        
        // Mapear días de la semana: "Lunes" = 1, "Martes" = 2, etc. (formato frontend)
        // Luego convertimos a formato JavaScript Date (0-6)
        const dayNameToNumber: Record<string, number> = {
          'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3,
          'Jueves': 4, 'Viernes': 5, 'Sábado': 6
        };

        for (const timeBlock of preferred_time_blocks) {
          let dayNumber: number | undefined;
          
          // Intentar obtener el día de diferentes formas
          if (typeof timeBlock.day === 'number') {
            // Si viene como número directo (0-6)
            dayNumber = timeBlock.day;
          } else if (timeBlock.label) {
            // Si viene como nombre de día
            dayNumber = dayNameToNumber[timeBlock.label];
          }
          
          console.log('🔍 Procesando bloque de tiempo:', {
            timeBlock,
            dayFromBlock: timeBlock.day,
            labelFromBlock: timeBlock.label,
            dayNumber,
            dayNumberDefined: dayNumber !== undefined,
          });
          
          if (dayNumber !== undefined && dayNumber >= 0 && dayNumber <= 6) {
            if (!timeBlocksByDay.has(dayNumber)) {
              timeBlocksByDay.set(dayNumber, []);
            }
            timeBlocksByDay.get(dayNumber)!.push({
              start: timeBlock.start,
              end: timeBlock.end,
            });
          } else {
            console.warn('⚠️ No se pudo mapear el día del bloque:', {
              timeBlock,
              dayNumber,
            });
          }
        }

        console.log('📅 Bloques de tiempo por día:', Array.from(timeBlocksByDay.entries()));
        console.log('📅 Días válidos seleccionados:', validDays);
        console.log('📅 Generando sesiones para TODAS las lecciones:', {
          totalLessons: allLessons.length,
          startDate: startDate.toISOString(),
        });

        // Generar sesiones hasta completar TODAS las lecciones
        // Iterar día por día hasta que se asignen todas las lecciones
        let currentDate = new Date(startDate);
        const maxDays = 365 * 2; // Límite de seguridad: máximo 2 años
        let daysProcessed = 0;

        while (lessonIndex < allLessons.length && daysProcessed < maxDays) {
          const dayOfWeek = currentDate.getDay(); // 0 = domingo, 6 = sábado
          
          // Solo procesar días válidos
          if (dayNumbers.includes(dayOfWeek)) {
            // Obtener bloques de tiempo para este día
            const dayTimeBlocks = timeBlocksByDay.get(dayOfWeek) || [];
            
            // Para cada bloque de tiempo de este día
            for (const timeBlock of dayTimeBlocks) {
              if (lessonIndex >= allLessons.length) break;

              const lesson = allLessons[lessonIndex];
              const lessonDurationMinutes = Math.ceil((lesson.duration_seconds || 0) / 60);
              
              // Usar la duración de la lección o el mínimo configurado, lo que sea mayor
              const sessionDurationMinutes = Math.max(
                lessonDurationMinutes || min_study_minutes || 30,
                min_study_minutes || 30
              );

              // Limitar a la duración máxima si está configurada
              const finalDuration = max_study_session_minutes 
                ? Math.min(sessionDurationMinutes, max_study_session_minutes)
                : sessionDurationMinutes;

              // Parsear el bloque de tiempo
              let startHour = 9;
              let startMinute = 0;
              
              if (timeBlock.start) {
                const timeMatch = timeBlock.start.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                  startHour = parseInt(timeMatch[1], 10);
                  startMinute = parseInt(timeMatch[2], 10);
                }
              }

              // Crear fecha/hora de inicio
              const startTime = new Date(currentDate);
              startTime.setHours(startHour, startMinute, 0, 0);
              
              // Crear fecha/hora de fin
              const endTime = new Date(startTime);
              endTime.setMinutes(endTime.getMinutes() + finalDuration);

              // Crear sesión
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
                session_type: finalDuration <= 30 ? 'short' : finalDuration <= 60 ? 'medium' : 'long',
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
        } else {
          console.log(`✅ Todas las lecciones fueron asignadas correctamente`);
        }

        console.log(`📅 Sesiones a crear: ${sessions.length}`);
        
        if (sessions.length > 0) {
          // Mostrar ejemplo de sesión para debugging
          console.log('📝 Ejemplo de sesión:', {
            plan_id: sessions[0].plan_id,
            user_id: sessions[0].user_id,
            title: sessions[0].title,
            start_time: sessions[0].start_time,
            end_time: sessions[0].end_time,
            status: sessions[0].status,
          });
        }

        // Insertar sesiones en lotes de 50 para evitar problemas de tamaño
        // Usar cliente admin para bypass RLS
        const batchSize = 50;
        for (let i = 0; i < sessions.length; i += batchSize) {
          const batch = sessions.slice(i, i + batchSize);
          const { data: insertedSessions, error: sessionsError } = await supabaseAdmin
            .from('study_sessions')
            .insert(batch)
            .select('id, title, start_time, end_time');

          if (sessionsError) {
            console.error('❌ Error creando sesiones:', {
              batchIndex: i,
              batchSize: batch.length,
              error: sessionsError.message,
              errorCode: sessionsError.code,
              errorDetails: sessionsError.details,
              errorHint: sessionsError.hint,
              firstSession: batch[0] ? {
                plan_id: batch[0].plan_id,
                user_id: batch[0].user_id,
                title: batch[0].title,
                start_time: batch[0].start_time,
                end_time: batch[0].end_time,
              } : null,
            });
            // Continuar aunque haya errores en algunos lotes
          } else {
            sessionsCreated += batch.length;
            console.log(`✅ Lote de sesiones creado: ${batch.length} sesiones`, {
              insertedIds: insertedSessions?.slice(0, 3).map((s: any) => s.id),
              firstSessionTime: insertedSessions?.[0]?.start_time,
            });
          }
        }

        console.log(`✅ Total de sesiones creadas: ${sessionsCreated} de ${sessions.length}`);
      } else {
        console.log('⚠️ No se crearon sesiones porque:', {
          hasCourseIds: !!(course_ids && course_ids.length > 0),
          courseIdsCount: course_ids?.length || 0,
          hasTimeBlocks: !!(preferred_time_blocks && preferred_time_blocks.length > 0),
          timeBlocksCount: preferred_time_blocks?.length || 0,
        });
      }
    } else {
      console.log('⚠️ No se crearon sesiones: no hay cursos o bloques de tiempo configurados');
    }

    // Verificación final: asegurar que el plan existe antes de retornar éxito
    // Usar cliente admin para la verificación
    const { data: finalVerify } = await supabaseAdmin
      .from('study_plans')
      .select('id')
      .eq('id', plan.id)
      .single();

    if (!finalVerify) {
      console.error('❌ Plan no encontrado en verificación final');
      return NextResponse.json(
        { 
          error: 'Error crítico: El plan no se pudo encontrar después de la creación',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: {
        id: plan.id,
        name: plan.name,
        created_at: plan.created_at,
      },
      sessions_created: sessionsCreated,
      verified: true,
    });
  } catch (error: any) {
    console.error('💥 Error in manual create API:', {
      message: error?.message,
      stack: error?.stack,
      error: error,
    });
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error?.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * Calcula intervalos de descanso usando lógica Pomodoro flexible
 * (Misma función que en calculate-break-intervals/route.ts)
 */
function calculateBreakIntervals(
  minStudy: number,
  maxStudy: number,
  minRest: number
): Array<{
  interval_minutes: number;
  break_duration_minutes: number;
  break_type: 'short' | 'long';
}> {
  const intervals: Array<{
    interval_minutes: number;
    break_duration_minutes: number;
    break_type: 'short' | 'long';
  }> = [];

  // Descanso corto: cada 25-30 minutos (usar minStudy como base, mínimo 25)
  const shortBreakInterval = Math.max(25, Math.min(30, minStudy));
  const shortBreakDuration = Math.max(5, minRest);

  // Descanso largo: después de 90 minutos o 2/3 del máximo (lo que sea menor)
  const longBreakThreshold = Math.min(90, Math.floor(maxStudy * 0.67));
  const longBreakDuration = Math.max(15, Math.min(30, minRest * 2));

  // Calcular cuántos intervalos cortos caben en la sesión máxima
  // Sin incluir el último intervalo si va a haber un descanso largo
  const hasLongBreak = maxStudy >= longBreakThreshold;
  const effectiveMaxStudy = hasLongBreak ? longBreakThreshold : maxStudy;
  const shortBreaksCount = Math.floor(effectiveMaxStudy / shortBreakInterval);

  // Agregar descansos cortos
  for (let i = 1; i <= shortBreaksCount; i++) {
    const intervalMinutes = shortBreakInterval * i;
    
    // No agregar si este intervalo coincide con el descanso largo
    if (hasLongBreak && intervalMinutes >= longBreakThreshold) {
      break;
    }

    intervals.push({
      interval_minutes: intervalMinutes,
      break_duration_minutes: shortBreakDuration,
      break_type: 'short',
    });
  }

  // Agregar descanso largo si la sesión es suficientemente larga
  if (hasLongBreak) {
    intervals.push({
      interval_minutes: longBreakThreshold,
      break_duration_minutes: longBreakDuration,
      break_type: 'long',
    });
  }

  // Ordenar por interval_minutes
  intervals.sort((a, b) => a.interval_minutes - b.interval_minutes);

  return intervals;
}

