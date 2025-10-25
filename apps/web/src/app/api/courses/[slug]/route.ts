import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '../../../../features/courses/services/course.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const course = await CourseService.getCourseBySlug(slug, userId || undefined)

    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error in course detail API:', error)
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
