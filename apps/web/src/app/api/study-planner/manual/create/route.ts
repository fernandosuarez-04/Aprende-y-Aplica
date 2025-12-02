import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

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

    // Asegurar que preferred_days sea un array de números
    const validDays = preferred_days
      .map((day: any) => parseInt(day, 10))
      .filter((day: number) => !isNaN(day) && day >= 1 && day <= 7);
    
    if (validDays.length === 0) {
      return NextResponse.json(
        { error: 'Los días seleccionados no son válidos' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Preparar datos del plan
    const planData = {
      user_id: currentUser.id,
      name: name.trim(),
      description: description?.trim() || null,
      goal_hours_per_week: goal_hours_per_week ? parseFloat(String(goal_hours_per_week)) : 5,
      preferred_days: validDays, // Usar los días validados
      preferred_time_blocks: Array.isArray(preferred_time_blocks) ? preferred_time_blocks : [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      generation_mode: 'manual',
    };

    console.log('📋 Datos del plan a insertar:', {
      user_id: planData.user_id,
      name: planData.name,
      goal_hours_per_week: planData.goal_hours_per_week,
      preferred_days: planData.preferred_days,
      preferred_days_type: typeof planData.preferred_days,
      preferred_days_isArray: Array.isArray(planData.preferred_days),
      preferred_time_blocks: planData.preferred_time_blocks,
      timezone: planData.timezone,
    });

    // Crear el plan
    const { data: plan, error: planError } = await supabase
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
      });
      return NextResponse.json(
        { 
          error: 'Error al crear el plan', 
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

    // Crear sesiones de estudio basadas en los cursos y horarios
    let sessionsCreated = 0;
    
    if (course_ids && course_ids.length > 0 && preferred_time_blocks && preferred_time_blocks.length > 0) {
      console.log('📚 Creando sesiones para cursos:', course_ids.length);
      
      // Obtener todas las lecciones de los cursos seleccionados
      const allLessons: any[] = [];
      
      for (const courseId of course_ids) {
        // Obtener módulos del curso
        const { data: modules } = await supabase
          .from('course_modules')
          .select('module_id')
          .eq('course_id', courseId)
          .eq('is_published', true)
          .order('module_order_index', { ascending: true });

        if (modules && modules.length > 0) {
          // Obtener lecciones de los módulos
          const { data: lessons } = await supabase
            .from('course_lessons')
            .select('lesson_id, lesson_title, duration_seconds, lesson_order_index, module_id')
            .in('module_id', modules.map(m => m.module_id))
            .eq('is_published', true)
            .order('lesson_order_index', { ascending: true });

          if (lessons && lessons.length > 0) {
            allLessons.push(...lessons.map(lesson => ({
              ...lesson,
              course_id: courseId,
            })));
          }
        }
      }

      console.log(`📖 Lecciones encontradas: ${allLessons.length}`);

      if (allLessons.length > 0) {
        // Generar sesiones basadas en los horarios configurados
        const sessions: any[] = [];
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        
        // Calcular cuántas semanas generar (por defecto 4 semanas)
        const weeksToGenerate = 4;
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        
        // Convertir preferred_days de formato 1-7 (Lunes-Domingo) a formato 0-6 (Domingo-Sábado)
        // Frontend usa: 1=Lunes, 2=Martes, ..., 6=Sábado, 7=Domingo
        // JavaScript Date usa: 0=Domingo, 1=Lunes, ..., 6=Sábado
        const dayNumbers = validDays.map((day: number) => {
          return day === 7 ? 0 : day; // 7 (Domingo) -> 0, resto igual
        });

        let lessonIndex = 0;
        
        // Mapear los bloques de tiempo por día
        // preferred_time_blocks viene como: [{ start: "09:00", end: "10:00", label: "Lunes" }, ...]
        const timeBlocksByDay = new Map<number, any[]>();
        
        // Mapear días de la semana: "Lunes" = 1, "Martes" = 2, etc. (formato frontend)
        // Luego convertimos a formato JavaScript Date (0-6)
        const dayNameToNumber: Record<string, number> = {
          'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3,
          'Jueves': 4, 'Viernes': 5, 'Sábado': 6
        };

        for (const timeBlock of preferred_time_blocks) {
          const dayName = timeBlock.label || '';
          const dayNumber = dayNameToNumber[dayName];
          
          if (dayNumber !== undefined) {
            if (!timeBlocksByDay.has(dayNumber)) {
              timeBlocksByDay.set(dayNumber, []);
            }
            timeBlocksByDay.get(dayNumber)!.push(timeBlock);
          }
        }

        console.log('📅 Bloques de tiempo por día:', Array.from(timeBlocksByDay.entries()));

        // Generar sesiones para las próximas semanas
        for (let week = 0; week < weeksToGenerate && lessonIndex < allLessons.length; week++) {
          for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + (week * 7) + dayOffset);
            const dayOfWeek = currentDate.getDay(); // 0 = domingo, 6 = sábado
            
            // Verificar si este día está en los días preferidos
            if (!dayNumbers.includes(dayOfWeek)) {
              continue;
            }

            // Obtener bloques de tiempo para este día
            const dayTimeBlocks = timeBlocksByDay.get(dayOfWeek) || [];
            
            if (dayTimeBlocks.length === 0) {
              continue;
            }

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
                duration_minutes: finalDuration,
                status: 'planned',
                session_type: finalDuration <= 30 ? 'short' : finalDuration <= 60 ? 'medium' : 'long',
                lesson_min_time_minutes: lessonDurationMinutes,
              });

              lessonIndex++;
            }
          }
        }

        console.log(`📅 Sesiones a crear: ${sessions.length}`);

        // Insertar sesiones en lotes de 50 para evitar problemas de tamaño
        const batchSize = 50;
        for (let i = 0; i < sessions.length; i += batchSize) {
          const batch = sessions.slice(i, i + batchSize);
          const { error: sessionsError } = await supabase
            .from('study_sessions')
            .insert(batch);

          if (sessionsError) {
            console.error('❌ Error creando sesiones:', sessionsError);
            // Continuar aunque haya errores en algunos lotes
          } else {
            sessionsCreated += batch.length;
            console.log(`✅ Lote de sesiones creado: ${batch.length} sesiones`);
          }
        }

        console.log(`✅ Total de sesiones creadas: ${sessionsCreated}`);
      }
    }

    return NextResponse.json({
      success: true,
      plan: {
        id: plan.id,
        name: plan.name,
        created_at: plan.created_at,
      },
      sessions_created: sessionsCreated,
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

