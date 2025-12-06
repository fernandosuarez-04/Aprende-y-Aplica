import { NextRequest, NextResponse } from 'next/server'
import { translateCourseOnCreate } from '@/core/services/courseTranslation.service'
import { createClient } from '@/lib/supabase/server'

/**
 * Endpoint de prueba para verificar que el sistema de traducción funciona
 * GET /api/test-translation?courseId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: 'Se requiere courseId como parámetro' },
        { status: 400 }
      )
    }

    console.log('[TEST-TRANSLATION] ========== INICIANDO PRUEBA DE TRADUCCIÓN ==========')
    console.log('[TEST-TRANSLATION] Course ID:', courseId)

    // Obtener datos del curso
    const supabase = await createClient()
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, description, learning_objectives')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Curso no encontrado', details: courseError },
        { status: 404 }
      )
    }

    console.log('[TEST-TRANSLATION] Curso encontrado:', {
      id: course.id,
      title: course.title,
      hasDescription: !!course.description
    })

    // Verificar variables de entorno
    console.log('[TEST-TRANSLATION] Verificando variables de entorno:')
    console.log('[TEST-TRANSLATION] - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 7)}...` : 'NO CONFIGURADA')
    console.log('[TEST-TRANSLATION] - OPENAI_MODEL:', process.env.OPENAI_MODEL || 'gpt-4o-mini (default)')

    // Verificar permisos del cliente de Supabase
    console.log('[TEST-TRANSLATION] Verificando permisos del cliente de Supabase...')
    const { data: testInsert, error: testError } = await supabase
      .from('content_translations')
      .insert({
        entity_type: 'course',
        entity_id: course.id,
        language_code: 'en',
        translations: { test: 'test' }
      })
      .select()

    console.log('[TEST-TRANSLATION] Test de inserción directa:', {
      success: !testError,
      error: testError ? {
        message: testError.message,
        code: testError.code,
        details: testError.details,
        hint: testError.hint
      } : null
    })

    // Si el test falla, limpiar el registro de prueba
    if (!testError && testInsert) {
      await supabase
        .from('content_translations')
        .delete()
        .eq('entity_type', 'course')
        .eq('entity_id', course.id)
        .eq('language_code', 'en')
    }

    // Intentar traducir
    const result = await translateCourseOnCreate(
      course.id,
      {
        title: course.title,
        description: course.description,
        learning_objectives: course.learning_objectives
      },
      null, // userId opcional
      supabase
    )

    console.log('[TEST-TRANSLATION] ========== RESULTADO DE PRUEBA ==========')
    console.log('[TEST-TRANSLATION] Resultado:', JSON.stringify(result, null, 2))

    // Verificar si se guardaron traducciones
    const { data: translations, error: translationsError } = await supabase
      .from('content_translations')
      .select('*')
      .eq('entity_type', 'course')
      .eq('entity_id', courseId)

    console.log('[TEST-TRANSLATION] Traducciones en BD:', {
      count: translations?.length || 0,
      translations: translations,
      error: translationsError
    })

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title
      },
      translationResult: result,
      translationsInDB: translations || [],
      environment: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIModel: process.env.OPENAI_MODEL || 'gpt-4o-mini'
      }
    })
  } catch (error) {
    console.error('[TEST-TRANSLATION] ❌ Error en prueba:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

