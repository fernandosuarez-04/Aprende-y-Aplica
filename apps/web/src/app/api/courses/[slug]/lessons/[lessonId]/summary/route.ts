import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers';

/**
 * GET /api/courses/[slug]/lessons/[lessonId]/summary
 * Obtiene el resumen de una lección
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params;
    const supabase = await createClient();

    // Optimización: Obtener curso primero, luego validar lección y módulo en una consulta
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Optimización: Verificar lección y módulo en una sola consulta con JOIN
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select(`
        lesson_id,
        module_id,
        course_modules!inner (
          module_id,
          course_id
        )
      `)
      .eq('lesson_id', lessonId)
      .eq('course_modules.course_id', course.id)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Lección no encontrada o no pertenece al curso' },
        { status: 404 }
      );
    }

    // Obtener resumen de la lección
    const { data: lessonData, error: summaryError } = await supabase
      .from('course_lessons')
      .select('summary_content')
      .eq('lesson_id', lessonId)
      .single();

    if (summaryError) {
      console.error('Error fetching summary:', summaryError);
      return NextResponse.json(
        { error: 'Error al obtener resumen' },
        { status: 500 }
      );
    }

    // ⚡ OPTIMIZACIÓN: Agregar cache headers (datos estáticos - 1 hora)
    return withCacheHeaders(
      NextResponse.json({
        summary_content: lessonData?.summary_content || null
      }),
      cacheHeaders.static
    );
  } catch (error) {
    console.error('Error in summary API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

