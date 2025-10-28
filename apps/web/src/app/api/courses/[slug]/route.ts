import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '../../../../features/courses/services/course.service'
import { formatApiError, logError } from '@/core/utils/api-errors'

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
    logError('GET /api/courses/[slug]', error)
    return NextResponse.json(
      formatApiError(error, 'Error al obtener detalles del curso'),
      { status: 500 }
    )
  }
}
