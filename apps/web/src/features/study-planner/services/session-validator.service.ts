/**
 * Session Validator Service
 * Valida los tiempos de sesión y restricciones para el planificador
 */

import { LessonTimeService, CoursesTimeAnalysis } from './lesson-time.service';
import { B2BAssignment } from './user-context.service';

// Tipos para validación
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface SessionTimeValidation extends ValidationResult {
  minSessionMinutes: number;
  maxSessionMinutes: number;
  recommendedMinutes: number;
}

export interface B2BDeadlineValidation extends ValidationResult {
  canMeetDeadline: boolean;
  requiredWeeklyMinutes: number;
  proposedWeeklyMinutes: number;
  daysRemaining: number;
  deadlineDate: Date | null;
}

export interface ScheduleValidation extends ValidationResult {
  totalWeeklyMinutes: number;
  sessionsPerWeek: number;
  canFitMinSession: boolean;
}

export interface BreakSchedule {
  sessionDurationMinutes: number;
  breakAfterMinutes: number;
  breakDurationMinutes: number;
}

export class SessionValidatorService {
  /**
   * Valida los tiempos de sesión propuestos contra los requisitos de los cursos
   */
  static async validateSessionTimes(
    minMinutes: number,
    maxMinutes: number,
    courseIds: string[]
  ): Promise<SessionTimeValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Analizar tiempos de cursos
    const analysis = await LessonTimeService.analyzeCoursesTime(courseIds);
    const requiredMinSession = analysis.recommendedMinSessionMinutes;

    // Validar tiempo mínimo
    if (minMinutes < requiredMinSession) {
      errors.push(
        `El tiempo mínimo de ${minMinutes} minutos no es suficiente. ` +
        `La lección más larga dura ${analysis.globalMaxLessonMinutes} minutos. ` +
        `El tiempo mínimo debe ser de al menos ${requiredMinSession} minutos.`
      );
    }

    // Validar que max >= min
    if (maxMinutes < minMinutes) {
      errors.push('El tiempo máximo debe ser mayor o igual al tiempo mínimo.');
    }

    // Validar rangos razonables
    if (minMinutes < 15) {
      warnings.push('Sesiones menores a 15 minutos pueden no ser efectivas para el aprendizaje.');
    }

    if (maxMinutes > 180) {
      warnings.push('Sesiones mayores a 3 horas pueden causar fatiga. Considera dividirlas.');
      suggestions.push('Te recomendamos sesiones de máximo 90-120 minutos con descansos.');
    }

    // Sugerencias basadas en análisis
    if (analysis.globalAverageLessonMinutes > 0) {
      const recommendedSession = Math.max(
        analysis.globalAverageLessonMinutes + 10,
        analysis.globalMaxLessonMinutes
      );
      suggestions.push(
        `Basado en tus cursos, te recomendamos sesiones de ${recommendedSession}-${recommendedSession + 15} minutos.`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      minSessionMinutes: requiredMinSession,
      maxSessionMinutes: Math.max(maxMinutes, requiredMinSession),
      recommendedMinutes: analysis.globalAverageLessonMinutes + 10
    };
  }

  /**
   * Valida si el plan propuesto permite cumplir con plazos B2B
   */
  static async validateB2BDeadlines(
    assignments: B2BAssignment[],
    weeklyStudyMinutes: number,
    courseIds: string[]
  ): Promise<B2BDeadlineValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Filtrar asignaciones con plazos que correspondan a los cursos seleccionados
    const relevantAssignments = assignments.filter(
      a => a.due_date && courseIds.includes(a.course_id) && a.status !== 'completed'
    );

    if (relevantAssignments.length === 0) {
      return {
        isValid: true,
        canMeetDeadline: true,
        requiredWeeklyMinutes: 0,
        proposedWeeklyMinutes: weeklyStudyMinutes,
        daysRemaining: Infinity,
        deadlineDate: null,
        errors,
        warnings,
        suggestions
      };
    }

    // Encontrar la fecha límite más cercana
    const sortedAssignments = relevantAssignments.sort((a, b) => {
      const dateA = new Date(a.due_date!);
      const dateB = new Date(b.due_date!);
      return dateA.getTime() - dateB.getTime();
    });

    const nearestDeadline = new Date(sortedAssignments[0].due_date!);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nearestDeadline.setHours(0, 0, 0, 0);

    const daysRemaining = Math.ceil((nearestDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const weeksRemaining = Math.max(daysRemaining / 7, 0.5);

    // Calcular tiempo total requerido
    const analysis = await LessonTimeService.analyzeCoursesTime(courseIds);
    
    // Considerar progreso actual
    let remainingMinutes = 0;
    for (const assignment of relevantAssignments) {
      const courseAnalysis = analysis.courses.find(c => c.courseId === assignment.course_id);
      if (courseAnalysis) {
        const progressDecimal = assignment.completion_percentage / 100;
        const remainingForCourse = courseAnalysis.totalMinutes * (1 - progressDecimal);
        remainingMinutes += remainingForCourse;
      }
    }

    // Calcular tiempo semanal requerido
    const requiredWeeklyMinutes = Math.ceil(remainingMinutes / weeksRemaining);

    // Validar si es posible cumplir
    const canMeetDeadline = weeklyStudyMinutes >= requiredWeeklyMinutes;

    if (!canMeetDeadline) {
      errors.push(
        `Para cumplir con la fecha límite del ${nearestDeadline.toLocaleDateString('es-ES')}, ` +
        `necesitas estudiar al menos ${requiredWeeklyMinutes} minutos por semana. ` +
        `Tu configuración actual es de ${weeklyStudyMinutes} minutos semanales.`
      );
      
      suggestions.push(
        `Aumenta tu tiempo de estudio semanal a ${requiredWeeklyMinutes} minutos, ` +
        `o considera extender tu plazo si es posible.`
      );
    }

    if (daysRemaining <= 7 && !canMeetDeadline) {
      warnings.push(
        `¡Atención! La fecha límite está a menos de una semana. ` +
        `Es posible que necesites intensificar tu ritmo de estudio.`
      );
    }

    if (daysRemaining <= 0) {
      errors.push('La fecha límite ya ha pasado.');
    }

    return {
      isValid: errors.length === 0,
      canMeetDeadline,
      requiredWeeklyMinutes,
      proposedWeeklyMinutes: weeklyStudyMinutes,
      daysRemaining,
      deadlineDate: nearestDeadline,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Valida la configuración de días y horarios
   */
  static validateSchedule(
    selectedDays: string[],
    timeBlocksPerDay: number,
    sessionMinutes: number,
    breakMinutes: number
  ): ScheduleValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const sessionsPerWeek = selectedDays.length * timeBlocksPerDay;
    const totalWeeklyMinutes = sessionsPerWeek * sessionMinutes;
    const minSessionWithBreak = sessionMinutes + breakMinutes;

    // Validar que haya días seleccionados
    if (selectedDays.length === 0) {
      errors.push('Debes seleccionar al menos un día para estudiar.');
    }

    // Validar tiempo disponible por bloque
    const canFitMinSession = sessionMinutes >= 20; // Mínimo 20 minutos para una sesión útil

    if (!canFitMinSession) {
      errors.push('Cada bloque debe tener al menos 20 minutos para una sesión de estudio efectiva.');
    }

    // Warnings y sugerencias
    if (selectedDays.length < 3) {
      warnings.push('Estudiar menos de 3 días por semana puede dificultar la retención.');
      suggestions.push('Te recomendamos estudiar al menos 3-4 días por semana para mejores resultados.');
    }

    if (selectedDays.length === 7) {
      warnings.push('Estudiar todos los días puede causar fatiga. Considera tomar al menos un día de descanso.');
    }

    if (totalWeeklyMinutes < 60) {
      warnings.push('Menos de 1 hora semanal puede no ser suficiente para un progreso significativo.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      totalWeeklyMinutes,
      sessionsPerWeek,
      canFitMinSession
    };
  }

  /**
   * Calcula los tiempos de descanso recomendados según la duración de la sesión
   */
  static calculateBreakSchedule(sessionMinutes: number): BreakSchedule[] {
    const schedules: BreakSchedule[] = [];

    if (sessionMinutes <= 35) {
      // Sesiones cortas: 5 min de descanso al final
      schedules.push({
        sessionDurationMinutes: sessionMinutes,
        breakAfterMinutes: sessionMinutes,
        breakDurationMinutes: 5
      });
    } else if (sessionMinutes <= 60) {
      // Sesiones medias: 10 min de descanso a mitad
      schedules.push({
        sessionDurationMinutes: sessionMinutes,
        breakAfterMinutes: Math.floor(sessionMinutes / 2),
        breakDurationMinutes: 10
      });
    } else if (sessionMinutes <= 90) {
      // Sesiones largas: 15 min cada 30 min
      const breakInterval = 30;
      let currentTime = breakInterval;
      while (currentTime < sessionMinutes) {
        schedules.push({
          sessionDurationMinutes: sessionMinutes,
          breakAfterMinutes: currentTime,
          breakDurationMinutes: 15
        });
        currentTime += breakInterval + 15; // 30 min estudio + 15 min descanso
      }
    } else {
      // Sesiones muy largas: 20 min cada 45 min
      const breakInterval = 45;
      let currentTime = breakInterval;
      while (currentTime < sessionMinutes) {
        schedules.push({
          sessionDurationMinutes: sessionMinutes,
          breakAfterMinutes: currentTime,
          breakDurationMinutes: 20
        });
        currentTime += breakInterval + 20;
      }
    }

    return schedules;
  }

  /**
   * Obtiene la duración total incluyendo descansos
   */
  static getTotalSessionWithBreaks(sessionMinutes: number): number {
    const breaks = this.calculateBreakSchedule(sessionMinutes);
    const totalBreakMinutes = breaks.reduce((sum, b) => sum + b.breakDurationMinutes, 0);
    return sessionMinutes + totalBreakMinutes;
  }

  /**
   * Valida un horario específico (hora de inicio y fin)
   */
  static validateTimeSlot(
    startHour: number,
    endHour: number,
    minSessionMinutes: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const availableMinutes = (endHour - startHour) * 60;

    if (startHour >= endHour) {
      errors.push('La hora de inicio debe ser anterior a la hora de fin.');
    }

    if (availableMinutes < minSessionMinutes) {
      errors.push(
        `El bloque de tiempo (${availableMinutes} min) no es suficiente para una sesión mínima de ${minSessionMinutes} min.`
      );
    }

    // Advertencias sobre horarios
    if (startHour >= 22 || startHour < 5) {
      warnings.push('Estudiar muy tarde o muy temprano puede afectar la calidad del sueño y la retención.');
    }

    if (endHour - startHour > 3) {
      warnings.push('Bloques de más de 3 horas pueden ser agotadores. Considera dividirlos.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }
}

