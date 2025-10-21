import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '../../../features/courses/services/course.service'

export async function GET(request: NextRequest) {
  try {
    const categories = await CourseService.getCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error in categories API:', error)
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
