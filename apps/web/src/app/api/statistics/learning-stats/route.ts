import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Obtener el usuario actual
    const { SessionService } = await import('../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener estadísticas de respuestas del usuario
    const { data: respuestas, error: respuestasError } = await supabase
      .from('respuestas')
      .select(`
        id,
        valor,
        respondido_en,
        preguntas!inner (
          id,
          codigo,
          section,
          bloque,
          area_id,
          tipo,
          peso,
          scoring,
          respuesta_correcta
        )
      `)
      .eq('user_id', user.id);

    if (respuestasError) {
      logger.error('Error fetching user responses:', respuestasError);
      // Si no hay tabla de respuestas, retornar estadísticas de ejemplo
      return NextResponse.json({
        total_preguntas: 0,
        preguntas_correctas: 0,
        accuracy_rate: 0,
        tiempo_promedio: 0,
        secciones_completadas: 0,
        nivel_actual: 'Principiante',
        indice_aipi: 25,
        progreso_general: 0
      });
    }

    // Calcular estadísticas
    const total_preguntas = respuestas?.length || 0;
    
    // Calcular preguntas correctas (si hay respuesta_correcta)
    let preguntas_correctas = 0;
    if (respuestas) {
      preguntas_correctas = respuestas.filter(respuesta => {
        const pregunta = respuesta.preguntas;
        if (pregunta?.respuesta_correcta && respuesta.valor) {
          try {
            const valorRespuesta = typeof respuesta.valor === 'string' 
              ? JSON.parse(respuesta.valor) 
              : respuesta.valor;
            return valorRespuesta === pregunta.respuesta_correcta;
          } catch {
            return false;
          }
        }
        return false;
      }).length;
    }

    const accuracy_rate = total_preguntas > 0 ? Math.round((preguntas_correctas / total_preguntas) * 100) : 0;

    // Calcular tiempo promedio (simulado)
    const tiempo_promedio = total_preguntas > 0 ? Math.round(total_preguntas * 2.5) : 0;

    // Calcular secciones completadas
    const seccionesUnicas = new Set(respuestas?.map(r => r.preguntas?.section).filter(Boolean) || []);
    const secciones_completadas = seccionesUnicas.size;

    // Determinar nivel actual basado en accuracy y total de preguntas
    let nivel_actual = 'Principiante';
    if (total_preguntas >= 50 && accuracy_rate >= 80) {
      nivel_actual = 'Experto';
    } else if (total_preguntas >= 30 && accuracy_rate >= 70) {
      nivel_actual = 'Avanzado';
    } else if (total_preguntas >= 15 && accuracy_rate >= 60) {
      nivel_actual = 'Intermedio';
    }

    // Calcular índice AIPI (simulado basado en actividad)
    let indice_aipi = 25; // Base
    if (total_preguntas > 0) {
      indice_aipi += Math.min(total_preguntas * 2, 50); // Hasta 50 puntos por preguntas
    }
    if (accuracy_rate > 0) {
      indice_aipi += Math.min(accuracy_rate * 0.25, 25); // Hasta 25 puntos por precisión
    }
    indice_aipi = Math.min(indice_aipi, 100);

    // Calcular progreso general
    const progreso_general = Math.min(
      Math.round((total_preguntas / 100) * 100), // Basado en 100 preguntas como meta
      100
    );

    // Si no hay datos reales, retornar estadísticas de ejemplo
    if (total_preguntas === 0) {
      return NextResponse.json({
        total_preguntas: 0,
        preguntas_correctas: 0,
        accuracy_rate: 0,
        tiempo_promedio: 0,
        secciones_completadas: 0,
        nivel_actual: 'Principiante',
        indice_aipi: 25,
        progreso_general: 0
      });
    }

    return NextResponse.json({
      total_preguntas,
      preguntas_correctas,
      accuracy_rate,
      tiempo_promedio,
      secciones_completadas,
      nivel_actual,
      indice_aipi,
      progreso_general
    });

  } catch (error) {
    logger.error('Error fetching learning stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
