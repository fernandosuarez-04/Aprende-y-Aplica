import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '../../../features/courses/services/course.service'

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

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Error in courses API:', error)
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
