import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withCacheHeaders, cacheHeaders } from '@/lib/utils/cache-headers';
import { ContentTranslationService } from '@/core/services/contentTranslation.service';
import { SupportedLanguage } from '@/core/i18n/i18n';

/**
 * GET /api/courses/[slug]/lessons/[lessonId]/transcript
 * Obtiene la transcripción de una lección (con traducción si está disponible)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params;
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get('language') || 'es') as SupportedLanguage;
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

    // IMPORTANTE: Siempre leer de course_lessons (tabla principal)
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

    // Obtener transcripción de la lección desde course_lessons
    const { data: lessonData, error: transcriptError } = await supabase
      .from('course_lessons')
      .select('transcript_content')
      .eq('lesson_id', lessonId)
      .single();

    if (transcriptError) {
      console.error('[transcript/route] Error obteniendo transcripción:', transcriptError);
      return NextResponse.json(
        { error: 'Error al obtener transcripción' },
        { status: 500 }
      );
    }

    let transcriptContent = lessonData?.transcript_content || null;

    // Aplicar traducción si no es español y hay contenido
    if (language !== 'es' && transcriptContent) {
      try {
        const translations = await ContentTranslationService.loadTranslations(
          'lesson',
          lessonId,
          language,
          supabase // Pasar el cliente del servidor
        );
        
        if (translations.transcript_content) {
          transcriptContent = translations.transcript_content as string;
          console.log(`[transcript/route] ✅ Traducción aplicada para ${lessonId}:${language}`);
        } else {
          console.log(`[transcript/route] ⚠️ No hay traducción disponible para ${lessonId}:${language}, usando original`);
        }
      } catch (translationError) {
        console.error(`[transcript/route] Error aplicando traducción:`, translationError);
        // Continuar con el contenido original si falla la traducción
      }
    }

    // ⚡ OPTIMIZACIÓN: Agregar cache headers (datos estáticos - 1 hora)
    return withCacheHeaders(
      NextResponse.json({
        transcript_content: transcriptContent
      }),
      cacheHeaders.static
    );
  } catch (error) {
    console.error('[transcript/route] Error inesperado:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

