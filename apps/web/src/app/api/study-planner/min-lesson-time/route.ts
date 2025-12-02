import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * POST /api/study-planner/min-lesson-time
 * Obtiene el tiempo mínimo de lección de los cursos seleccionados
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
    const { courseIds } = body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'courseIds es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener todas las lecciones de los cursos seleccionados
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('module_id')
      .in('course_id', courseIds);

    if (modulesError || !modules || modules.length === 0) {
      return NextResponse.json({
        minTimeMinutes: 15, // Valor por defecto
      });
    }

    const moduleIds = modules.map(m => m.module_id);

    // Obtener lecciones de esos módulos
    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('lesson_id')
      .in('module_id', moduleIds);

    if (lessonsError || !lessons || lessons.length === 0) {
      return NextResponse.json({
        minTimeMinutes: 15, // Valor por defecto
      });
    }

    const lessonIds = lessons.map(l => l.lesson_id);

    // Obtener tiempos estimados de las lecciones
    const { data: timeEstimates, error: timeError } = await supabase
      .from('lesson_time_estimates')
      .select('total_time_minutes')
      .in('lesson_id', lessonIds)
      .not('total_time_minutes', 'is', null)
      .gt('total_time_minutes', 0);

    if (timeError || !timeEstimates || timeEstimates.length === 0) {
      return NextResponse.json({
        minTimeMinutes: 15, // Valor por defecto
      });
    }

    // Encontrar el tiempo mínimo
    const minTime = Math.min(
      ...timeEstimates.map(te => Number(te.total_time_minutes))
    );

    // Redondear hacia arriba y asegurar mínimo de 15 minutos
    const minTimeMinutes = Math.max(15, Math.ceil(minTime));

    return NextResponse.json({
      minTimeMinutes,
    });
  } catch (error) {
    console.error('Error in min lesson time API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


