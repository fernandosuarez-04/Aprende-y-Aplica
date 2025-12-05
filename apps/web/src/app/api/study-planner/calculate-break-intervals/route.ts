import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * POST /api/study-planner/calculate-break-intervals
 * Calcula intervalos de descanso automáticamente basado en mejores prácticas (Pomodoro flexible)
 * 
 * Input: { minStudyMinutes, maxStudySessionMinutes, minRestMinutes }
 * Output: Array de intervalos con tipo, duración y momento de aplicación
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
    const { minStudyMinutes, maxStudySessionMinutes, minRestMinutes } = body;

    // Validaciones
    if (typeof minStudyMinutes !== 'number' || minStudyMinutes < 15) {
      return NextResponse.json(
        { error: 'minStudyMinutes debe ser un número mayor o igual a 15' },
        { status: 400 }
      );
    }

    if (typeof maxStudySessionMinutes !== 'number' || maxStudySessionMinutes < minStudyMinutes) {
      return NextResponse.json(
        { error: 'maxStudySessionMinutes debe ser mayor o igual a minStudyMinutes' },
        { status: 400 }
      );
    }

    if (typeof minRestMinutes !== 'number' || minRestMinutes < 5) {
      return NextResponse.json(
        { error: 'minRestMinutes debe ser un número mayor o igual a 5' },
        { status: 400 }
      );
    }

    // Calcular intervalos usando lógica Pomodoro flexible
    const intervals = calculateBreakIntervals(
      minStudyMinutes,
      maxStudySessionMinutes,
      minRestMinutes
    );

    return NextResponse.json({
      intervals,
      summary: {
        totalBreaks: intervals.length,
        shortBreaks: intervals.filter(i => i.break_type === 'short').length,
        longBreaks: intervals.filter(i => i.break_type === 'long').length,
        totalBreakTime: intervals.reduce((sum, i) => sum + i.break_duration_minutes, 0),
      },
    });
  } catch (error) {
    console.error('Error calculating break intervals:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Calcula intervalos de descanso usando lógica Pomodoro simplificada
 * 
 * Reglas simplificadas:
 * - Para sesiones < 60 min: 1 descanso corto (5 min) a la mitad
 * - Para sesiones 60-90 min: 1 descanso corto (5 min) + 1 descanso largo (10 min) al final
 * - Para sesiones > 90 min: 1 descanso corto (5 min) a la mitad + 1 descanso largo (15 min) al final
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

  // Duración fija para descansos
  const shortBreakDuration = 5; // 5 minutos fijos
  const longBreakDuration = maxStudy >= 90 ? 15 : 10; // 15 min para sesiones largas, 10 min para medianas

  if (maxStudy < 45) {
    // Sesiones muy cortas (< 45 min): No necesitan descanso
    // El estudiante puede completar la sesión sin interrupciones
    return [];
  } else if (maxStudy < 60) {
    // Sesiones cortas (45-60 min): Solo un descanso corto a la mitad
    const breakPoint = Math.floor(maxStudy / 2);
    intervals.push({
      interval_minutes: breakPoint,
      break_duration_minutes: shortBreakDuration,
      break_type: 'short',
    });
  } else if (maxStudy <= 90) {
    // Sesiones medianas (60-90 min): 1 descanso corto a la mitad + 1 largo al final
    const shortBreakPoint = Math.floor(maxStudy / 2);
    intervals.push({
      interval_minutes: shortBreakPoint,
      break_duration_minutes: shortBreakDuration,
      break_type: 'short',
    });
    
    intervals.push({
      interval_minutes: maxStudy,
      break_duration_minutes: longBreakDuration,
      break_type: 'long',
    });
  } else {
    // Sesiones largas (> 90 min): 1 descanso corto a la mitad + 1 largo al final
    const shortBreakPoint = Math.floor(maxStudy / 2);
    intervals.push({
      interval_minutes: shortBreakPoint,
      break_duration_minutes: shortBreakDuration,
      break_type: 'short',
    });
    
    intervals.push({
      interval_minutes: maxStudy,
      break_duration_minutes: longBreakDuration,
      break_type: 'long',
    });
  }

  // Ordenar por interval_minutes
  intervals.sort((a, b) => a.interval_minutes - b.interval_minutes);

  return intervals;
}



