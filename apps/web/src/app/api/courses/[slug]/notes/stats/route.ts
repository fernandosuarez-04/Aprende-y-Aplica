import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NoteService } from '@/features/courses/services/note.service'
import { CourseService } from '@/features/courses/services/course.service'

/**
 * GET /api/courses/[slug]/notes/stats
 * Obtiene estadísticas de notas para un curso
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener el curso por slug para obtener el courseId
    const course = await CourseService.getCourseBySlug(slug, user.id)
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    const stats = await NoteService.getNotesStats(user.id, course.id)

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

