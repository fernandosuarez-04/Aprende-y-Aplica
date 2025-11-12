import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    logger.log('🔄 Iniciando GET /api/admin/user-stats/questions')
    const supabase = await createClient()
    
    // Obtener preguntas sin relaciones complejas primero
    const { data: questions, error } = await supabase
      .from('preguntas')
      .select(`
        id,
        codigo,
        section,
        bloque,
        area_id,
        exclusivo_rol_id,
        texto,
        tipo,
        opciones,
        locale,
        peso,
        escala,
        scoring,
        created_at,
        respuesta_correcta
      `)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('❌ Error fetching questions:', error)
      return NextResponse.json({ error: 'Failed to fetch questions', details: error.message }, { status: 500 })
    }

    logger.log('✅ Questions obtenidos:', questions?.length)
    return NextResponse.json(questions || [])
  } catch (error) {
    logger.error('❌ Error in GET /api/admin/user-stats/questions:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    logger.log('🔄 Iniciando DELETE /api/admin/user-stats/questions (eliminar todas)')
    const supabase = await createClient()

    // Primero, obtener todas las preguntas para saber qué respuestas eliminar
    const { data: questions, error: fetchError } = await supabase
      .from('preguntas')
      .select('id')

    if (fetchError) {
      logger.error('❌ Error obteniendo preguntas:', fetchError)
      return NextResponse.json(
        { 
          error: 'Error al obtener preguntas', 
          details: fetchError.message 
        },
        { status: 500 }
      )
    }

    // Si hay preguntas, eliminar primero todas las respuestas relacionadas
    if (questions && questions.length > 0) {
      const questionIds = questions.map(q => q.id)
      
      const { error: deleteAnswersError } = await supabase
        .from('respuestas')
        .delete()
        .in('pregunta_id', questionIds)

      if (deleteAnswersError) {
        logger.error('❌ Error eliminando respuestas:', deleteAnswersError)
        return NextResponse.json(
          { 
            error: 'Error al eliminar respuestas relacionadas', 
            details: deleteAnswersError.message 
          },
          { status: 500 }
        )
      }
    }

    // Luego, eliminar todas las preguntas
    const { error: deleteQuestionsError } = await supabase
      .from('preguntas')
      .delete()
      .not('id', 'is', null) // Eliminar todas las preguntas

    if (deleteQuestionsError) {
      logger.error('❌ Error eliminando preguntas:', deleteQuestionsError)
      return NextResponse.json(
        { 
          error: 'Error al eliminar preguntas', 
          details: deleteQuestionsError.message 
        },
        { status: 500 }
      )
    }

    logger.log('✅ Todas las preguntas y respuestas eliminadas exitosamente')
    return NextResponse.json({ 
      success: true, 
      message: 'Todas las preguntas y respuestas relacionadas han sido eliminadas exitosamente' 
    })
  } catch (error) {
    logger.error('❌ Error in DELETE /api/admin/user-stats/questions:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}