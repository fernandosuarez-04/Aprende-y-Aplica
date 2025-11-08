import { NextRequest, NextResponse } from 'next/server'
import { AdminLessonsService, CreateLessonData } from '@/features/admin/services/adminLessons.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { moduleId } = await params

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID es requerido' },
        { status: 400 }
      )
    }

    const lessons = await AdminLessonsService.getModuleLessons(moduleId)

    return NextResponse.json({
      success: true,
      lessons
    })
  } catch (error) {
    // console.error('Error in GET /api/admin/courses/[id]/modules/[moduleId]/lessons:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener lecciones' 
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string }> }
) {
  try {
    const { moduleId } = await params
    const body = await request.json() as CreateLessonData

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Module ID es requerido' },
        { status: 400 }
      )
    }

    if (!body.lesson_title || !body.video_provider_id || !body.instructor_id) {
      return NextResponse.json(
        { error: 'lesson_title, video_provider_id e instructor_id son requeridos' },
        { status: 400 }
      )
    }

    // Validar que duration_seconds sea mayor a 0
    if (!body.duration_seconds || body.duration_seconds <= 0) {
      return NextResponse.json(
        { 
          error: 'La duración debe ser mayor a 0 segundos',
          details: 'El campo duration_seconds debe tener un valor positivo'
        },
        { status: 400 }
      )
    }

    const lesson = await AdminLessonsService.createLesson(moduleId, body)

    return NextResponse.json({
      success: true,
      lesson
    })
  } catch (error) {
    // console.error('Error in POST /api/admin/courses/[id]/modules/[moduleId]/lessons:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear lección' 
      },
      { status: 500 }
    )
  }
}

