import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '../../../features/courses/services/course.service'
import { formatApiError, logError } from '@/core/utils/api-errors'
import { cacheHeaders } from '../../../lib/utils/cache-headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const userId = searchParams.get('userId')

    let courses

    if (category && category !== 'all') {
      courses = await CourseService.getCoursesByCategory(category)
    } else {
      courses = await CourseService.getActiveCourses(userId || undefined)
    }

    return NextResponse.json(courses, {
      // NO usar cache para cursos ya que el status puede cambiar según el usuario
      headers: cacheHeaders.private
    })
  } catch (error) {
    logError('GET /api/courses', error)
    return NextResponse.json(
      formatApiError(error, 'Error al obtener cursos'),
      { status: 500 }
    )
  }
}
