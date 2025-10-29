import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'
import { NoteService } from '../../../../../../features/courses/services/note.service'

/**
 * GET /api/courses/[courseId]/notes/stats
 * Obtiene estadísticas de notas para un curso
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params
    const supabase = await createClient()

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const stats = await NoteService.getNotesStats(user.id, courseId)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in notes stats GET API:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

