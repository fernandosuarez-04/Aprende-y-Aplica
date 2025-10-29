import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '../../../features/courses/services/course.service'
import { formatApiError, logError } from '@/core/utils/api-errors'

export async function GET(request: NextRequest) {
  try {
    const categories = await CourseService.getCategories()
    return NextResponse.json(categories)
  } catch (error) {
    logError('GET /api/categories', error)
    return NextResponse.json(
      formatApiError(error, 'Error al obtener categorías'),
      { status: 500 }
    )
  }
}
