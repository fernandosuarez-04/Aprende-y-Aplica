/**
 * API Endpoint: Generate Study Plan using LIA
 * 
 * POST /api/study-planner/generate-plan
 * 
 * Usa LIA para generar un plan de estudio completo con sesiones
 * basándose en la configuración del usuario, cursos y disponibilidad.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { UserContextService } from '../../../../features/study-planner/services/user-context.service';
import { CourseAnalysisService } from '../../../../features/study-planner/services/course-analysis.service';
import type { 
  StudyPlanConfig,
  StudySession,
  LessonDuration,
  TimeBlock,
} from '../../../../features/study-planner/types/user-context.types';

interface GeneratePlanRequest {
  name: string;
  description?: string;
  courseIds: string[];
  learningRouteId?: string;
  goalHoursPerWeek: number;
  startDate?: string;
  endDate?: string;
  timezone: string;
  preferredDays: number[];
  preferredTimeBlocks: TimeBlock[];
  minSessionMinutes: number;
  maxSessionMinutes: number;
  breakDurationMinutes: number;
  preferredSessionType: 'short' | 'medium' | 'long';
}

interface GeneratePlanResponse {
  success: boolean;
  data?: {
    config: StudyPlanConfig;
    sessions: StudySession[];
    summary: {
      totalSessions: number;
      totalMinutes: number;
      estimatedWeeks: number;
      coursesIncluded: number;
    };
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<GeneratePlanResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const body: GeneratePlanRequest = await request.json();
    
    // Validar datos requeridos
    if (!body.name || !body.courseIds || body.courseIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nombre y cursos son requeridos' },
        { status: 400 }
      );
    }
    
    // Obtener contexto del usuario
    const userContext = await UserContextService.getFullUserContext(user.id);
    
    // Obtener información de lecciones para cada curso
    const allLessons: Array<{
      courseId: string;
      courseTitle: string;
      lessons: LessonDuration[];
    }> = [];
    
    for (const courseId of body.courseIds) {
      const courseInfo = await CourseAnalysisService.getCourseInfo(courseId);
      const lessons = await CourseAnalysisService.getCourseLessons(courseId);
      const pendingLessons = await CourseAnalysisService.getPendingLessons(user.id, courseId);
      
      const lessonDurations: LessonDuration[] = [];
      for (const lesson of pendingLessons) {
        const duration = await CourseAnalysisService.calculateLessonDuration(lesson.lessonId);
        if (duration) {
          lessonDurations.push(duration);
        }
      }
      
      if (courseInfo && lessonDurations.length > 0) {
        allLessons.push({
          courseId,
          courseTitle: courseInfo.title,
          lessons: lessonDurations,
        });
      }
    }
    
    // Generar sesiones
    const sessions = generateSessions(
      user.id,
      allLessons,
      body,
      userContext.userType
    );
    
    // Calcular resumen
    let totalMinutes = 0;
    for (const session of sessions) {
      totalMinutes += session.durationMinutes;
    }
    
    const weeklyMinutes = body.goalHoursPerWeek * 60;
    const estimatedWeeks = weeklyMinutes > 0 ? Math.ceil(totalMinutes / weeklyMinutes) : 0;
    
    // Construir configuración del plan
    const config: StudyPlanConfig = {
      name: body.name,
      description: body.description,
      userType: userContext.userType,
      courseIds: body.courseIds,
      learningRouteId: body.learningRouteId,
      goalHoursPerWeek: body.goalHoursPerWeek,
      startDate: body.startDate,
      endDate: body.endDate,
      timezone: body.timezone,
      preferredDays: body.preferredDays,
      preferredTimeBlocks: body.preferredTimeBlocks,
      minSessionMinutes: body.minSessionMinutes,
      maxSessionMinutes: body.maxSessionMinutes,
      breakDurationMinutes: body.breakDurationMinutes,
      preferredSessionType: body.preferredSessionType,
      generationMode: 'ai_generated',
      calendarAnalyzed: !!userContext.calendarIntegration?.isConnected,
      calendarProvider: userContext.calendarIntegration?.provider,
    };
    
    return NextResponse.json({
      success: true,
      data: {
        config,
        sessions,
        summary: {
          totalSessions: sessions.length,
          totalMinutes,
          estimatedWeeks,
          coursesIncluded: body.courseIds.length,
        },
      },
    });
    
  } catch (error) {
    console.error('Error generando plan de estudio:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

/**
 * Genera las sesiones de estudio basándose en la configuración
 */
function generateSessions(
  userId: string,
  courseLessons: Array<{
    courseId: string;
    courseTitle: string;
    lessons: LessonDuration[];
  }>,
  config: GeneratePlanRequest,
  userType: 'b2b' | 'b2c'
): StudySession[] {
  const sessions: StudySession[] = [];
  const startDate = config.startDate ? new Date(config.startDate) : new Date();
  
  // Crear cola de lecciones
  const lessonQueue: Array<{
    courseId: string;
    courseTitle: string;
    lesson: LessonDuration;
  }> = [];
  
  for (const course of courseLessons) {
    for (const lesson of course.lessons) {
      lessonQueue.push({
        courseId: course.courseId,
        courseTitle: course.courseTitle,
        lesson,
      });
    }
  }
  
  // Generar sesiones iterando por días y bloques de tiempo
  let currentDate = new Date(startDate);
  let sessionIndex = 0;
  let lessonIndex = 0;
  
  // Máximo de sesiones a generar (prevenir bucles infinitos)
  const maxSessions = 365; // Un año de sesiones máximo
  
  while (lessonIndex < lessonQueue.length && sessionIndex < maxSessions) {
    const dayOfWeek = currentDate.getDay();
    
    // Verificar si es un día preferido
    if (config.preferredDays.includes(dayOfWeek)) {
      // Iterar por cada bloque de tiempo del día
      for (const block of config.preferredTimeBlocks) {
        if (lessonIndex >= lessonQueue.length) break;
        
        const blockDuration = (block.endHour * 60 + block.endMinute) - 
                             (block.startHour * 60 + block.startMinute);
        
        // Verificar si el bloque es suficientemente largo
        if (blockDuration >= config.minSessionMinutes) {
          // Calcular cuántas lecciones caben en este bloque
          let sessionDuration = 0;
          const sessionLessons: typeof lessonQueue = [];
          
          while (lessonIndex < lessonQueue.length) {
            const lesson = lessonQueue[lessonIndex];
            const lessonTime = lesson.lesson.totalMinutes;
            
            // Verificar si cabe otra lección en la sesión
            if (sessionDuration + lessonTime <= config.maxSessionMinutes &&
                sessionDuration + lessonTime <= blockDuration) {
              sessionLessons.push(lesson);
              sessionDuration += lessonTime;
              lessonIndex++;
              
              // Si ya alcanzamos el mínimo y estamos cerca del máximo, terminar
              if (sessionDuration >= config.minSessionMinutes &&
                  sessionDuration + (lessonQueue[lessonIndex]?.lesson.totalMinutes || 0) > config.maxSessionMinutes) {
                break;
              }
            } else {
              // No cabe más, crear sesión con lo que tenemos
              break;
            }
          }
          
          // Crear sesión si hay lecciones
          if (sessionLessons.length > 0) {
            const sessionStart = new Date(currentDate);
            sessionStart.setHours(block.startHour, block.startMinute, 0, 0);
            
            const sessionEnd = new Date(sessionStart);
            sessionEnd.setMinutes(sessionEnd.getMinutes() + sessionDuration + config.breakDurationMinutes);
            
            // Agrupar por curso
            const courseGroups = new Map<string, string[]>();
            for (const sl of sessionLessons) {
              if (!courseGroups.has(sl.courseId)) {
                courseGroups.set(sl.courseId, []);
              }
              courseGroups.get(sl.courseId)!.push(sl.lesson.lessonTitle);
            }
            
            // Crear título descriptivo
            let title = '';
            if (courseGroups.size === 1) {
              const [courseId, lessonTitles] = Array.from(courseGroups.entries())[0];
              const course = sessionLessons.find(s => s.courseId === courseId);
              title = `${course?.courseTitle}: ${lessonTitles.length} lección(es)`;
            } else {
              title = `Sesión de estudio: ${sessionLessons.length} lecciones`;
            }
            
            const session: StudySession = {
              id: `temp-${sessionIndex}`,
              planId: '', // Se asignará al guardar
              userId,
              title,
              description: sessionLessons.map(s => s.lesson.lessonTitle).join(', '),
              courseId: sessionLessons[0].courseId,
              lessonId: sessionLessons[0].lesson.lessonId,
              startTime: sessionStart.toISOString(),
              endTime: sessionEnd.toISOString(),
              durationMinutes: sessionDuration,
              breakDurationMinutes: config.breakDurationMinutes,
              status: 'planned',
              isAiGenerated: true,
              liaSuggested: true,
              sessionType: config.preferredSessionType,
              calendarConflictChecked: false,
            };
            
            sessions.push(session);
            sessionIndex++;
          }
        }
      }
    }
    
    // Avanzar al siguiente día
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Verificar límite de fecha si se especificó
    if (config.endDate) {
      const endDate = new Date(config.endDate);
      if (currentDate > endDate) {
        break;
      }
    }
  }
  
  return sessions;
}
