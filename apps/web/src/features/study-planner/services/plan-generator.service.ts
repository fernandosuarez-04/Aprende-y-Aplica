/**
 * Plan Generator Service
 * Genera planes de estudio completos con todas las configuraciones
 */

import { UserStudyContext, B2BAssignment } from './user-context.service';
import { AvailabilityEstimate } from './availability-calculator.service';
import { LearningRoute, LearningRouteItem } from './learning-route.service';
import { SessionValidatorService, BreakSchedule } from './session-validator.service';
import { LessonTimeService } from './lesson-time.service';
import { StudyStrategyService, StudyMode, SessionBreakdown, BreakInterval } from './study-strategy.service';

// Tipos para el plan de estudio
export interface StudyPlanConfig {
  userId: string;
  userType: 'b2b' | 'b2c';
  organizationId?: string | null;
  name: string;
  description?: string;

  // Cursos seleccionados
  selectedCourseIds: string[];
  learningRoute: LearningRoute;

  // Configuración de tiempos
  minSessionMinutes: number;
  maxSessionMinutes: number;
  preferredSessionType: 'short' | 'medium' | 'long';

  // Configuración de días y horarios
  selectedDays: string[];
  timeBlocks: TimeBlock[];

  // Descansos
  breakSchedule: BreakSchedule[];

  // Fechas
  startDate: Date;
  targetEndDate?: Date;

  // B2B
  assignments?: B2BAssignment[];

  // Estrategias de estudio (Pomodoro, límites de burnout)
  studyMode?: StudyMode;
  maxConsecutiveHours?: number;
  enableSpacedRepetition?: boolean;
}

export interface TimeBlock {
  day: string;
  startHour: number;
  endHour: number;
  startMinute?: number;
  endMinute?: number;
}

export interface GeneratedPlan {
  config: StudyPlanConfig;
  sessions: PlannedSession[];
  summary: PlanSummary;
  warnings: string[];
  b2bValidation?: B2BValidationResult;
}

export interface PlannedSession {
  id: string;
  date: Date;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  breaks: SessionBreak[];
  status: 'planned';
  // Campos de estrategia de estudio
  pomodoroCount?: number;
  hasIntegratedBreaks?: boolean;
  integratedBreakMinutes?: number;
  studyMode?: StudyMode;
}

export interface SessionBreak {
  afterMinutes: number;
  durationMinutes: number;
}

export interface PlanSummary {
  totalSessions: number;
  totalStudyMinutes: number;
  totalBreakMinutes: number;
  sessionsPerWeek: number;
  estimatedWeeksToComplete: number;
  estimatedEndDate: Date;
  coursesIncluded: number;
  lessonsPerCourse: Record<string, number>;
}

export interface B2BValidationResult {
  canMeetAllDeadlines: boolean;
  deadlineStatus: Array<{
    courseId: string;
    courseTitle: string;
    deadline: Date;
    canMeet: boolean;
    estimatedCompletion: Date;
    daysMargin: number;
  }>;
}

export class PlanGeneratorService {
  /**
   * Genera un plan de estudio completo
   */
  static async generatePlan(config: StudyPlanConfig): Promise<GeneratedPlan> {
    const warnings: string[] = [];

    // Validar configuración básica
    this.validateConfig(config, warnings);

    // Generar sesiones
    const sessions = await this.generateSessions(config);

    // Calcular resumen
    const summary = this.calculateSummary(config, sessions);

    // Validar plazos B2B si aplica
    let b2bValidation: B2BValidationResult | undefined;
    if (config.userType === 'b2b' && config.assignments && config.assignments.length > 0) {
      b2bValidation = this.validateB2BDeadlines(config, summary);

      if (!b2bValidation.canMeetAllDeadlines) {
        warnings.push('⚠️ Algunos plazos corporativos podrían no cumplirse con la configuración actual.');
      }
    }

    return {
      config,
      sessions,
      summary,
      warnings,
      b2bValidation
    };
  }

  /**
   * Valida la configuración del plan
   */
  private static validateConfig(config: StudyPlanConfig, warnings: string[]): void {
    if (config.selectedCourseIds.length === 0) {
      warnings.push('No se han seleccionado cursos para el plan.');
    }

    if (config.selectedDays.length === 0) {
      warnings.push('No se han seleccionado días para estudiar.');
    }

    if (config.timeBlocks.length === 0) {
      warnings.push('No se han configurado bloques de tiempo.');
    }

    if (config.minSessionMinutes > config.maxSessionMinutes) {
      warnings.push('El tiempo mínimo es mayor al máximo. Se ajustará automáticamente.');
    }
  }

  /**
   * Genera las sesiones de estudio
   */
  private static async generateSessions(config: StudyPlanConfig): Promise<PlannedSession[]> {
    const sessions: PlannedSession[] = [];

    // Obtener tiempo total necesario
    const timeAnalysis = await LessonTimeService.analyzeCoursesTime(config.selectedCourseIds);

    // Ordenar cursos según la ruta de aprendizaje
    const orderedCourses = config.learningRoute.items.sort((a, b) => a.order - b.order);

    // Calcular sesiones necesarias
    let currentDate = new Date(config.startDate);
    let sessionCount = 0;
    let courseIndex = 0;
    let lessonIndex = 0;

    // Modo de estudio (por defecto balanced para compatibilidad)
    const studyMode: StudyMode = config.studyMode || 'balanced';
    const maxConsecutiveHours = config.maxConsecutiveHours || 2;

    // Tracking para prevención de burnout
    let dailyStudyMinutes = 0;
    let lastSessionDate: string | null = null;

    // Máximo de sesiones para evitar loops infinitos (1 año de sesiones)
    const maxSessions = 365 * config.selectedDays.length;

    while (courseIndex < orderedCourses.length && sessionCount < maxSessions) {
      const currentCourse = orderedCourses[courseIndex];
      const courseTime = timeAnalysis.courses.find(c => c.courseId === currentCourse.courseId);

      if (!courseTime || lessonIndex >= courseTime.lessons.length) {
        // Pasar al siguiente curso
        courseIndex++;
        lessonIndex = 0;
        continue;
      }

      // Verificar si el día actual es un día de estudio
      const dayName = this.getDayName(currentDate.getDay());
      const currentDateStr = currentDate.toDateString();

      // Resetear contador diario si cambiamos de día
      if (lastSessionDate !== currentDateStr) {
        dailyStudyMinutes = 0;
        lastSessionDate = currentDateStr;
      }

      if (config.selectedDays.includes(dayName)) {
        // Encontrar el bloque de tiempo para este día
        const timeBlock = config.timeBlocks.find(tb => tb.day === dayName);

        if (timeBlock) {
          const currentLesson = courseTime.lessons[lessonIndex];

          // Usar duración base de la lección (sin multiplicadores)
          const lessonSessionTime = Math.ceil(currentLesson.totalMinutes);
          const sessionDuration = Math.min(
            Math.max(lessonSessionTime, config.minSessionMinutes),
            config.maxSessionMinutes
          );

          // Verificar límite de horas consecutivas (prevención burnout)
          const maxDailyMinutes = maxConsecutiveHours * 60;
          if (dailyStudyMinutes + sessionDuration > maxDailyMinutes) {
            // Ya alcanzamos el límite para hoy, pasar al siguiente día
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          // Calcular descansos usando StudyStrategyService según el modo
          const breakdownResult = StudyStrategyService.calculateBreaks(sessionDuration, studyMode);

          const breaks: SessionBreak[] = breakdownResult.breaks.map(b => ({
            afterMinutes: b.afterMinutes,
            durationMinutes: b.durationMinutes
          }));

          // Calcular hora fin incluyendo descansos integrados
          const totalSessionTime = breakdownResult.totalMinutes;

          // Crear sesión con información de estrategia
          const session: PlannedSession = {
            id: `session-${sessionCount + 1}`,
            date: new Date(currentDate),
            dayOfWeek: dayName,
            startTime: this.formatTime(timeBlock.startHour, timeBlock.startMinute || 0),
            endTime: this.calculateEndTime(
              timeBlock.startHour,
              timeBlock.startMinute || 0,
              totalSessionTime
            ),
            durationMinutes: sessionDuration,
            courseId: currentCourse.courseId,
            courseTitle: currentCourse.title,
            lessonId: currentLesson.lessonId,
            lessonTitle: currentLesson.lessonTitle,
            breaks,
            status: 'planned',
            // Información de estrategia Pomodoro
            studyMode,
            pomodoroCount: breakdownResult.pomodoroCount || 0,
            hasIntegratedBreaks: breaks.length > 0,
            integratedBreakMinutes: breakdownResult.breakMinutes
          };

          sessions.push(session);
          sessionCount++;
          lessonIndex++;
          dailyStudyMinutes += sessionDuration;
        }
      }

      // Avanzar al siguiente día
      currentDate.setDate(currentDate.getDate() + 1);

      // Verificar si hemos superado la fecha objetivo
      if (config.targetEndDate && currentDate > config.targetEndDate) {
        break;
      }
    }

    return sessions;
  }

  /**
   * Calcula el resumen del plan
   */
  private static calculateSummary(config: StudyPlanConfig, sessions: PlannedSession[]): PlanSummary {
    const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalBreakMinutes = sessions.reduce((sum, s) =>
      sum + s.breaks.reduce((bSum, b) => bSum + b.durationMinutes, 0), 0
    );

    // Calcular sesiones por semana
    const weeksSpanned = sessions.length > 0
      ? Math.ceil((sessions[sessions.length - 1].date.getTime() - sessions[0].date.getTime()) / (7 * 24 * 60 * 60 * 1000)) || 1
      : 1;
    const sessionsPerWeek = Math.round(sessions.length / weeksSpanned);

    // Calcular lecciones por curso
    const lessonsPerCourse: Record<string, number> = {};
    sessions.forEach(session => {
      lessonsPerCourse[session.courseId] = (lessonsPerCourse[session.courseId] || 0) + 1;
    });

    // Fecha estimada de finalización
    const estimatedEndDate = sessions.length > 0
      ? sessions[sessions.length - 1].date
      : new Date(config.startDate);

    return {
      totalSessions: sessions.length,
      totalStudyMinutes,
      totalBreakMinutes,
      sessionsPerWeek,
      estimatedWeeksToComplete: weeksSpanned,
      estimatedEndDate,
      coursesIncluded: config.selectedCourseIds.length,
      lessonsPerCourse
    };
  }

  /**
   * Valida los plazos B2B
   */
  private static validateB2BDeadlines(
    config: StudyPlanConfig,
    summary: PlanSummary
  ): B2BValidationResult {
    const deadlineStatus: B2BValidationResult['deadlineStatus'] = [];
    let canMeetAllDeadlines = true;

    if (!config.assignments) {
      return { canMeetAllDeadlines: true, deadlineStatus: [] };
    }

    for (const assignment of config.assignments) {
      if (!assignment.due_date || !config.selectedCourseIds.includes(assignment.course_id)) {
        continue;
      }

      const deadline = new Date(assignment.due_date);
      const estimatedCompletion = summary.estimatedEndDate;
      const daysMargin = Math.ceil((deadline.getTime() - estimatedCompletion.getTime()) / (24 * 60 * 60 * 1000));
      const canMeet = estimatedCompletion <= deadline;

      if (!canMeet) {
        canMeetAllDeadlines = false;
      }

      deadlineStatus.push({
        courseId: assignment.course_id,
        courseTitle: assignment.course_title,
        deadline,
        canMeet,
        estimatedCompletion,
        daysMargin
      });
    }

    return { canMeetAllDeadlines, deadlineStatus };
  }

  /**
   * Obtiene el nombre del día
   */
  private static getDayName(dayIndex: number): string {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return days[dayIndex];
  }

  /**
   * Formatea hora
   */
  private static formatTime(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  /**
   * Calcula hora de fin
   */
  private static calculateEndTime(startHour: number, startMinute: number, durationMinutes: number): string {
    const totalMinutes = startHour * 60 + startMinute + durationMinutes;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    return this.formatTime(endHour, endMinute);
  }

  /**
   * Crea la configuración del plan desde los datos del usuario
   */
  static createPlanConfig(
    userContext: UserStudyContext,
    availability: AvailabilityEstimate,
    learningRoute: LearningRoute,
    preferences: {
      name?: string;
      selectedDays: string[];
      timeBlocks: TimeBlock[];
      minSessionMinutes: number;
      maxSessionMinutes: number;
      preferredSessionType: 'short' | 'medium' | 'long';
      startDate?: Date;
      targetEndDate?: Date;
      // Estrategias de estudio
      studyMode?: StudyMode;
      maxConsecutiveHours?: number;
      enableSpacedRepetition?: boolean;
    }
  ): StudyPlanConfig {
    const breakSchedule = SessionValidatorService.calculateBreakSchedule(preferences.maxSessionMinutes);

    // Si no se especifica modo, sugerir automáticamente basado en contexto
    let studyMode = preferences.studyMode;
    if (!studyMode) {
      // Convertir horas semanales a minutos mensuales aproximados
      const totalMinutes = (availability.weeklyHoursMax * 60) * 4; // Aproximado mensual
      const hasDeadline = userContext.userType === 'b2b' && userContext.assignments?.some((a: B2BAssignment) => a.due_date);
      const daysAvailable = preferences.targetEndDate
        ? Math.ceil((preferences.targetEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 30;

      const suggestion = StudyStrategyService.suggestStudyMode(totalMinutes, daysAvailable, hasDeadline || false);
      studyMode = suggestion.mode;
    }

    return {
      userId: userContext.userId,
      userType: userContext.userType,
      organizationId: userContext.organizationId,
      name: preferences.name || `Plan de Estudio - ${new Date().toLocaleDateString('es-ES')}`,
      selectedCourseIds: learningRoute.items.map(item => item.courseId),
      learningRoute,
      minSessionMinutes: preferences.minSessionMinutes,
      maxSessionMinutes: preferences.maxSessionMinutes,
      preferredSessionType: preferences.preferredSessionType,
      selectedDays: preferences.selectedDays,
      timeBlocks: preferences.timeBlocks,
      breakSchedule,
      startDate: preferences.startDate || new Date(),
      targetEndDate: preferences.targetEndDate,
      assignments: userContext.assignments,
      // Estrategias de estudio
      studyMode,
      maxConsecutiveHours: preferences.maxConsecutiveHours || 2,
      enableSpacedRepetition: preferences.enableSpacedRepetition || false
    };
  }
}

