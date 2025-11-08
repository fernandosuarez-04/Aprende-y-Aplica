import { NextRequest, NextResponse } from 'next/server'
import { NoteService } from '@/features/courses/services/note.service'
import { CourseService } from '@/features/courses/services/course.service'
import { SessionService } from '@/features/auth/services/session.service'

/**
 * GET /api/courses/[slug]/lessons/[lessonId]/notes
 * Obtiene todas las notas de un usuario para una lección específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params

    // Obtener usuario autenticado usando el sistema de sesiones personalizado
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el curso existe (opcional, para validación)
    const course = await CourseService.getCourseBySlug(slug, currentUser.id)
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    const notes = await NoteService.getNotesByLesson(currentUser.id, lessonId)

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
 * POST /api/courses/[slug]/lessons/[lessonId]/notes
 * Crea una nueva nota
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params
    // Obtener usuario autenticado usando el sistema de sesiones personalizado
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar que el curso existe (opcional, para validación)
    const course = await CourseService.getCourseBySlug(slug, currentUser.id)
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { note_title, note_content, note_tags, source_type } = body
    + '...', note_tags, source_type })

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

    ,
        note_content: note_content.trim(),
        note_tags: note_tags && Array.isArray(note_tags) ? note_tags.filter(tag => tag.trim().length > 0) : [],
        source_type: source_type || 'manual'
      }
    })

    const note = await NoteService.createNote(currentUser.id, lessonId, {
      note_title: note_title.trim(),
      note_content: note_content.trim(),
      note_tags: note_tags && Array.isArray(note_tags) ? note_tags.filter(tag => tag.trim().length > 0) : [],
      source_type: source_type || 'manual'
    })
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('=== ERROR EN API DE NOTAS ===')
    console.error('Error completo:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error message:', error instanceof Error ? error.message : 'No message')
    console.error('Error name:', error instanceof Error ? error.name : 'No name')
    console.error('=== FIN ERROR ===')
    
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
        details: error instanceof Error ? error.stack : 'Sin detalles adicionales'
      },
      { status: 500 }
    )
  }
}

