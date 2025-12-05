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
 * Calcula intervalos de descanso usando lógica Pomodoro flexible
 * 
 * Reglas:
 * - Descanso corto cada 25-30 minutos (basado en minStudyMinutes)
 * - Descanso largo después de 90 minutos o 2/3 del máximo
 * - Proporción 5:1 (estudio:descanso) como base
 * - Adaptar según maxStudySessionMinutes configurado
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



