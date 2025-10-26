import { NextResponse } from 'next/server'
import { AdminCoursesService } from '@/features/admin/services/adminCourses.service'

export async function GET() {
  try {
    const courses = await AdminCoursesService.getAllCourses()
    
    return NextResponse.json({
      success: true,
      courses
    })
  } catch (error) {
    console.error('Error in GET /api/admin/courses:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener los cursos' 
      },
      { status: 500 }
    )
  }
}
