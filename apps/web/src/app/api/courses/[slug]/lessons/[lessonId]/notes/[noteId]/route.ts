import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NoteService } from '@/features/courses/services/note.service'
import { CourseService } from '@/features/courses/services/course.service'

/**
 * PUT /api/courses/[slug]/lessons/[lessonId]/notes/[noteId]
 * Actualiza una nota existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string; noteId: string }> }
) {
  try {
    const { slug, noteId } = await params
    const supabase = await createClient()

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el curso existe (opcional, para validación)
    const course = await CourseService.getCourseBySlug(slug, user.id)
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { note_title, note_content, note_tags } = body

    const note = await NoteService.updateNote(user.id, noteId, {
      note_title,
      note_content,
      note_tags
    })

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error in notes PUT API:', error)
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
 * DELETE /api/courses/[slug]/lessons/[lessonId]/notes/[noteId]
 * Elimina una nota
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string; noteId: string }> }
) {
  try {
    const { slug, noteId } = await params
    const supabase = await createClient()

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el curso existe (opcional, para validación)
    const course = await CourseService.getCourseBySlug(slug, user.id)
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    await NoteService.deleteNote(user.id, noteId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in notes DELETE API:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

