/**
 * Study Strategy Service
 *
 * Servicio para gestionar estrategias de estudio inteligentes.
 * Implementa técnicas como Pomodoro, límites de burnout y espaciado de repetición.
 *
 * Modos disponibles:
 * - 'pomodoro': 25 min estudio + 5 min descanso (cada 4 ciclos = 15 min descanso largo)
 * - 'balanced': Descansos proporcionales a la duración de sesión
 * - 'intensive': Mínimos descansos para cumplir fechas límite urgentes
 */

export type StudyMode = 'pomodoro' | 'balanced' | 'intensive';

export interface BreakConfig {
  shortBreakMinutes: number;
  longBreakMinutes: number;
  pomodorosBeforeLongBreak: number;
  maxStudyBlockMinutes: number;
}

export interface BreakInterval {
  afterMinutes: number;
  durationMinutes: number;
  type: 'short' | 'long' | 'micro';
  label?: string;
}

export interface SessionBreakdown {
  studyMinutes: number;
  breakMinutes: number;
  totalMinutes: number;
  breaks: BreakInterval[];
  pomodoroCount?: number;
}

export interface DailyStudyValidation {
  isValid: boolean;
  totalStudyMinutes: number;
  consecutiveBlocks: number;
  warnings: string[];
  suggestions: string[];
}

// Configuración por defecto para cada modo
const DEFAULT_CONFIGS: Record<StudyMode, BreakConfig> = {
  pomodoro: {
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    pomodorosBeforeLongBreak: 4,
    maxStudyBlockMinutes: 25,
  },
  balanced: {
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    pomodorosBeforeLongBreak: 4,
    maxStudyBlockMinutes: 45, // Bloques más largos
  },
  intensive: {
    shortBreakMinutes: 3,
    longBreakMinutes: 10,
    pomodorosBeforeLongBreak: 6,
    maxStudyBlockMinutes: 60, // Máxima duración por bloque
  },
};

export class StudyStrategyService {
  /**
   * Obtiene la configuración de descansos para un modo de estudio
   */
  static getConfig(mode: StudyMode, customConfig?: Partial<BreakConfig>): BreakConfig {
    const defaultConfig = DEFAULT_CONFIGS[mode];
    return {
      ...defaultConfig,
      ...customConfig,
    };
  }

  /**
   * Calcula los descansos para una sesión usando técnica Pomodoro
   *
   * La técnica Pomodoro consiste en:
   * - 25 minutos de trabajo concentrado
   * - 5 minutos de descanso corto
   * - Después de 4 pomodoros, 15 minutos de descanso largo
   */
  static calculatePomodoroBreaks(sessionMinutes: number, config?: Partial<BreakConfig>): SessionBreakdown {
    const cfg = this.getConfig('pomodoro', config);
    const breaks: BreakInterval[] = [];

    let minutesElapsed = 0;
    let pomodoroCount = 0;
    let totalBreakMinutes = 0;

    // Calcular cuántos pomodoros caben en la sesión
    while (minutesElapsed < sessionMinutes) {
      minutesElapsed += cfg.maxStudyBlockMinutes;
      pomodoroCount++;

      // Si aún hay tiempo para más estudio, agregar descanso
      if (minutesElapsed < sessionMinutes) {
        const isLongBreak = pomodoroCount % cfg.pomodorosBeforeLongBreak === 0;
        const breakDuration = isLongBreak ? cfg.longBreakMinutes : cfg.shortBreakMinutes;

        breaks.push({
          afterMinutes: minutesElapsed,
          durationMinutes: breakDuration,
          type: isLongBreak ? 'long' : 'short',
          label: isLongBreak
            ? `Descanso largo (${cfg.longBreakMinutes} min) - ¡Estira, camina, hidratate!`
            : `Descanso corto (${cfg.shortBreakMinutes} min) - Respira profundo`,
        });

        totalBreakMinutes += breakDuration;
        minutesElapsed += breakDuration;
      }
    }

    return {
      studyMinutes: sessionMinutes,
      breakMinutes: totalBreakMinutes,
      totalMinutes: sessionMinutes + totalBreakMinutes,
      breaks,
      pomodoroCount,
    };
  }

  /**
   * Calcula descansos proporcionales (modo balanced)
   *
   * Reglas:
   * - Sesiones <= 30 min: Sin descanso integrado
   * - Sesiones 31-60 min: 5 min de descanso a la mitad
   * - Sesiones 61-90 min: 10 min de descanso cada 30 min
   * - Sesiones > 90 min: 15 min de descanso cada 45 min
   */
  static calculateBalancedBreaks(sessionMinutes: number, config?: Partial<BreakConfig>): SessionBreakdown {
    const cfg = this.getConfig('balanced', config);
    const breaks: BreakInterval[] = [];
    let totalBreakMinutes = 0;

    if (sessionMinutes <= 30) {
      // Sesiones cortas: solo un micro-descanso al final si es > 20 min
      if (sessionMinutes > 20) {
        breaks.push({
          afterMinutes: sessionMinutes,
          durationMinutes: 3,
          type: 'micro',
          label: 'Micro-descanso (3 min)',
        });
        totalBreakMinutes = 3;
      }
    } else if (sessionMinutes <= 60) {
      // Sesiones medianas: descanso a la mitad
      const midpoint = Math.floor(sessionMinutes / 2);
      breaks.push({
        afterMinutes: midpoint,
        durationMinutes: cfg.shortBreakMinutes,
        type: 'short',
        label: `Descanso (${cfg.shortBreakMinutes} min) - Estira y descansa la vista`,
      });
      totalBreakMinutes = cfg.shortBreakMinutes;
    } else if (sessionMinutes <= 90) {
      // Sesiones largas: descanso cada 30 min
      const breakInterval = 30;
      let elapsed = breakInterval;

      while (elapsed < sessionMinutes) {
        breaks.push({
          afterMinutes: elapsed,
          durationMinutes: 10,
          type: 'short',
          label: 'Descanso (10 min) - Camina un poco',
        });
        totalBreakMinutes += 10;
        elapsed += breakInterval + 10;
      }
    } else {
      // Sesiones muy largas: descanso largo cada 45 min
      const breakInterval = 45;
      let elapsed = breakInterval;
      let breakCount = 0;

      while (elapsed < sessionMinutes) {
        breakCount++;
        const isLong = breakCount % 2 === 0;
        const duration = isLong ? cfg.longBreakMinutes : 10;

        breaks.push({
          afterMinutes: elapsed,
          durationMinutes: duration,
          type: isLong ? 'long' : 'short',
          label: isLong
            ? `Descanso largo (${cfg.longBreakMinutes} min) - ¡Toma un snack!`
            : 'Descanso (10 min) - Hidratate',
        });
        totalBreakMinutes += duration;
        elapsed += breakInterval + duration;
      }
    }

    return {
      studyMinutes: sessionMinutes,
      breakMinutes: totalBreakMinutes,
      totalMinutes: sessionMinutes + totalBreakMinutes,
      breaks,
    };
  }

  /**
   * Calcula descansos mínimos (modo intensive)
   *
   * Solo incluye descansos obligatorios para prevenir fatiga extrema:
   * - Micro-descanso de 3 min cada hora
   * - Descanso de 10 min cada 2 horas
   */
  static calculateIntensiveBreaks(sessionMinutes: number, config?: Partial<BreakConfig>): SessionBreakdown {
    const cfg = this.getConfig('intensive', config);
    const breaks: BreakInterval[] = [];
    let totalBreakMinutes = 0;

    if (sessionMinutes <= 60) {
      // Sin descansos para sesiones de hasta 1 hora
      return {
        studyMinutes: sessionMinutes,
        breakMinutes: 0,
        totalMinutes: sessionMinutes,
        breaks: [],
      };
    }

    // Descanso cada 60 minutos
    let elapsed = 60;
    let breakCount = 0;

    while (elapsed < sessionMinutes) {
      breakCount++;
      // Cada 2 descansos (cada 2 horas), hacer uno más largo
      const isLong = breakCount % 2 === 0;
      const duration = isLong ? cfg.longBreakMinutes : cfg.shortBreakMinutes;

      breaks.push({
        afterMinutes: elapsed,
        durationMinutes: duration,
        type: isLong ? 'long' : 'micro',
        label: isLong ? 'Descanso obligatorio (10 min)' : 'Micro-descanso (3 min)',
      });

      totalBreakMinutes += duration;
      elapsed += 60 + duration;
    }

    return {
      studyMinutes: sessionMinutes,
      breakMinutes: totalBreakMinutes,
      totalMinutes: sessionMinutes + totalBreakMinutes,
      breaks,
    };
  }

  /**
   * Calcula los descansos según el modo de estudio seleccionado
   */
  static calculateBreaks(
    sessionMinutes: number,
    mode: StudyMode,
    config?: Partial<BreakConfig>
  ): SessionBreakdown {
    switch (mode) {
      case 'pomodoro':
        return this.calculatePomodoroBreaks(sessionMinutes, config);
      case 'balanced':
        return this.calculateBalancedBreaks(sessionMinutes, config);
      case 'intensive':
        return this.calculateIntensiveBreaks(sessionMinutes, config);
      default:
        return this.calculateBalancedBreaks(sessionMinutes, config);
    }
  }

  /**
   * Valida que las sesiones de un día no excedan el límite de horas consecutivas
   *
   * @param sessions - Array de sesiones ordenadas por hora de inicio
   * @param maxConsecutiveHours - Máximo de horas consecutivas sin descanso largo
   * @returns Validación con warnings y sugerencias
   */
  static validateDailyStudyLoad(
    sessions: Array<{ startTime: Date; endTime: Date; durationMinutes: number }>,
    maxConsecutiveHours: number = 2
  ): DailyStudyValidation {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const maxConsecutiveMinutes = maxConsecutiveHours * 60;

    if (sessions.length === 0) {
      return {
        isValid: true,
        totalStudyMinutes: 0,
        consecutiveBlocks: 0,
        warnings: [],
        suggestions: [],
      };
    }

    // Ordenar sesiones por hora de inicio
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    let totalStudyMinutes = 0;
    let currentBlockMinutes = 0;
    let consecutiveBlocks = 0;
    let lastEndTime: Date | null = null;

    for (const session of sortedSessions) {
      const sessionStart = new Date(session.startTime);
      totalStudyMinutes += session.durationMinutes;

      // Verificar si hay suficiente descanso entre sesiones
      if (lastEndTime) {
        const gapMinutes = (sessionStart.getTime() - lastEndTime.getTime()) / (1000 * 60);

        if (gapMinutes < 30) {
          // Menos de 30 min de descanso = sesiones consecutivas
          currentBlockMinutes += session.durationMinutes;
        } else {
          // Hay un descanso largo, reiniciar contador
          if (currentBlockMinutes > maxConsecutiveMinutes) {
            consecutiveBlocks++;
          }
          currentBlockMinutes = session.durationMinutes;
        }
      } else {
        currentBlockMinutes = session.durationMinutes;
      }

      lastEndTime = new Date(session.endTime);
    }

    // Verificar el último bloque
    if (currentBlockMinutes > maxConsecutiveMinutes) {
      consecutiveBlocks++;
    }

    // Generar warnings
    if (totalStudyMinutes > 6 * 60) {
      warnings.push(`Más de 6 horas de estudio en un día (${Math.round(totalStudyMinutes / 60)}h). Considera distribuir mejor.`);
    }

    if (consecutiveBlocks > 0) {
      warnings.push(
        `${consecutiveBlocks} bloque(s) de estudio exceden ${maxConsecutiveHours} horas consecutivas sin descanso largo.`
      );
      suggestions.push('Agrega descansos de al menos 30 minutos entre sesiones largas.');
    }

    if (totalStudyMinutes > 4 * 60 && sessions.length < 2) {
      suggestions.push('Considera dividir sesiones largas en bloques más pequeños para mejor retención.');
    }

    return {
      isValid: warnings.length === 0,
      totalStudyMinutes,
      consecutiveBlocks,
      warnings,
      suggestions,
    };
  }

  /**
   * Sugiere el modo de estudio óptimo basado en el contexto
   *
   * @param totalMinutesToStudy - Total de minutos a estudiar
   * @param daysAvailable - Días disponibles hasta la fecha límite
   * @param hasDeadline - Si hay una fecha límite estricta (B2B)
   * @returns Modo sugerido con justificación
   */
  static suggestStudyMode(
    totalMinutesToStudy: number,
    daysAvailable: number,
    hasDeadline: boolean = false
  ): { mode: StudyMode; reason: string } {
    const hoursToStudy = totalMinutesToStudy / 60;
    const hoursPerDay = hoursToStudy / daysAvailable;

    // Si tiene fecha límite y poco tiempo, modo intensivo
    if (hasDeadline && hoursPerDay > 3) {
      return {
        mode: 'intensive',
        reason: `Con ${hoursPerDay.toFixed(1)} horas/día necesarias y fecha límite, el modo intensivo maximiza el contenido.`,
      };
    }

    // Si tiene tiempo suficiente, Pomodoro para mejor retención
    if (hoursPerDay <= 2) {
      return {
        mode: 'pomodoro',
        reason: 'La técnica Pomodoro optimiza concentración y retención con sesiones de 25 minutos.',
      };
    }

    // Caso intermedio, modo balanced
    return {
      mode: 'balanced',
      reason: 'El modo balanced ofrece un equilibrio entre productividad y descansos adecuados.',
    };
  }

  /**
   * Formatea los descansos para mostrar al usuario
   */
  static formatBreaksForDisplay(breakdown: SessionBreakdown): string[] {
    if (breakdown.breaks.length === 0) {
      return ['Sin descansos programados para esta sesión'];
    }

    return breakdown.breaks.map((brk, index) => {
      const prefix = brk.type === 'long' ? '🌟' : brk.type === 'short' ? '☕' : '⏸️';
      return `${prefix} A los ${brk.afterMinutes} min: ${brk.label || `Descanso de ${brk.durationMinutes} min`}`;
    });
  }

  /**
   * Calcula el tiempo total incluyendo descansos
   */
  static calculateTotalTimeWithBreaks(
    sessionMinutes: number,
    mode: StudyMode,
    config?: Partial<BreakConfig>
  ): number {
    const breakdown = this.calculateBreaks(sessionMinutes, mode, config);
    return breakdown.totalMinutes;
  }
}
