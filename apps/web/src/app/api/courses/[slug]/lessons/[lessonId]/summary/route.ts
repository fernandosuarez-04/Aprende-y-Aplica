import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers';

/**
 * Obtiene el nombre de la tabla de lecciones según el idioma
 */
function getLessonsTableName(language: string): string {
  switch (language) {
    case 'en':
      return 'course_lessons_en'
    case 'pt':
      return 'course_lessons_pt'
    case 'es':
    default:
      return 'course_lessons'
  }
}

/**
 * GET /api/courses/[slug]/lessons/[lessonId]/summary
 * Obtiene el resumen de una lección desde la tabla específica del idioma
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'es';
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

    // IMPORTANTE: Usar la tabla de lecciones según el idioma
    // course_lessons (español), course_lessons_en (inglés), course_lessons_pt (portugués)
    const lessonsTableName = getLessonsTableName(language);

    // Optimización: Verificar lección y módulo en una sola consulta con JOIN
    const { data: lesson, error: lessonError } = await supabase
      .from(lessonsTableName)
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

    // Obtener resumen de la lección desde la tabla del idioma específico
    const { data: lessonData, error: summaryError } = await supabase
      .from(lessonsTableName)
      .select('summary_content')
      .eq('lesson_id', lessonId)
      .single();

    if (summaryError) {
      console.error('[summary/route] Error obteniendo resumen:', summaryError);
      return NextResponse.json(
        { error: 'Error al obtener resumen' },
        { status: 500 }
      );
    }

    const summaryContent = lessonData?.summary_content || null;

    console.log(`[summary/route] ✅ Resumen obtenido de ${lessonsTableName} para ${lessonId}`);

    // ⚡ OPTIMIZACIÓN: Agregar cache headers (datos estáticos - 1 hora)
    return withCacheHeaders(
      NextResponse.json({
        summary_content: summaryContent
      }),
      cacheHeaders.static
    );
  } catch (error) {
    console.error('[summary/route] Error inesperado:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

