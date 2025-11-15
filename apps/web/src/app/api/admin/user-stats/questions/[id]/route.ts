import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const supabase = await createClient()

    logger.log(`🔄 Iniciando DELETE /api/admin/user-stats/questions/${id}`)

    // Primero, eliminar todas las respuestas relacionadas con esta pregunta
    const { error: deleteAnswersError } = await supabase
      .from('respuestas')
      .delete()
      .eq('pregunta_id', id)

    if (deleteAnswersError) {
      logger.error('❌ Error eliminando respuestas relacionadas:', deleteAnswersError)
      return NextResponse.json(
        { 
          error: 'Error al eliminar respuestas relacionadas', 
          details: deleteAnswersError.message 
        },
        { status: 500 }
      )
    }

    // Luego, eliminar la pregunta
    const { error: deleteQuestionError } = await supabase
      .from('preguntas')
      .delete()
      .eq('id', id)

    if (deleteQuestionError) {
      logger.error('❌ Error eliminando pregunta:', deleteQuestionError)
      return NextResponse.json(
        { 
          error: 'Error al eliminar pregunta', 
          details: deleteQuestionError.message 
        },
        { status: 500 }
      )
    }

    logger.log(`✅ Pregunta ${id} eliminada exitosamente`)
    return NextResponse.json({ success: true, message: 'Pregunta eliminada exitosamente' })
  } catch (error) {
    logger.error('❌ Error in DELETE /api/admin/user-stats/questions/[id]:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

