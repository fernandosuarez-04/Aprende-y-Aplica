import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'
import { NoteService } from '../../../../../../features/courses/services/note.service'

/**
 * GET /api/courses/[courseId]/lessons/[lessonId]/notes
 * Obtiene todas las notas de un usuario para una lección específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const supabase = await createClient()

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const notes = await NoteService.getNotesByLesson(user.id, lessonId)

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error in notes GET API:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/courses/[courseId]/lessons/[lessonId]/notes
 * Crea una nueva nota
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const supabase = await createClient()

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { note_title, note_content, note_tags, source_type } = body

    // Validaciones más estrictas
    if (!note_title || typeof note_title !== 'string' || note_title.trim().length === 0) {
      return NextResponse.json(
        { error: 'El título de la nota es requerido y no puede estar vacío' },
        { status: 400 }
      )
    }

    if (!note_content || typeof note_content !== 'string' || note_content.trim().length === 0) {
      return NextResponse.json(
        { error: 'El contenido de la nota es requerido y no puede estar vacío' },
        { status: 400 }
      )
    }

    // Validar que note_tags sea un array si se proporciona
    if (note_tags !== undefined && (!Array.isArray(note_tags) || note_tags.some(tag => typeof tag !== 'string'))) {
      return NextResponse.json(
        { error: 'Las etiquetas deben ser un array de strings' },
        { status: 400 }
      )
    }

    const note = await NoteService.createNote(user.id, lessonId, {
      note_title: note_title.trim(),
      note_content: note_content.trim(),
      note_tags: note_tags && Array.isArray(note_tags) ? note_tags.filter(tag => tag.trim().length > 0) : [],
      source_type: source_type || 'manual'
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error in notes POST API:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

