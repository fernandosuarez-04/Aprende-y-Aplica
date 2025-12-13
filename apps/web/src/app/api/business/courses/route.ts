import { NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    // Obtener todos los cursos activos
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        category,
        level,
        instructor_id,
        duration_total_minutes,
        thumbnail_url,
        slug,
        is_active,
        price,
        average_rating,
        student_count,
        review_count,
        learning_objectives,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (coursesError) {
      logger.error('Error fetching courses:', coursesError)
      return NextResponse.json({ 
        success: false,
        error: 'Error al obtener cursos',
        courses: []
      }, { status: 500 })
    }

    // Obtener información de instructores
    const instructorIds = [...new Set(courses?.map(c => c.instructor_id).filter(Boolean) || [])]
    const instructorMap = new Map()

    if (instructorIds.length > 0) {
      const { data: instructors, error: instructorsError } = await supabase
        .from('users')
        .select('id, first_name, last_name, display_name, username, email')
        .in('id', instructorIds)

      if (!instructorsError && instructors) {
        instructors.forEach(instructor => {
          const name = instructor.display_name || 
            `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || 
            instructor.username || 
            'Instructor'
          instructorMap.set(instructor.id, {
            id: instructor.id,
            name,
            email: instructor.email || ''
          })
        })
      }
    }

    // Transformar datos
    const coursesWithInstructors = courses?.map(course => {
      const instructor = instructorMap.get(course.instructor_id) || {
        id: course.instructor_id,
        name: 'Instructor',
        email: ''
      }

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        instructor: instructor,
        duration: course.duration_total_minutes,
        thumbnail_url: course.thumbnail_url,
        slug: course.slug,
        price: course.price,
        rating: course.average_rating || 0,
        student_count: course.student_count || 0,
        review_count: course.review_count || 0,
        learning_objectives: course.learning_objectives,
        created_at: course.created_at,
        updated_at: course.updated_at
      }
    }) || []

    return NextResponse.json({
      success: true,
      courses: coursesWithInstructors
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/courses:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener cursos',
      courses: []
    }, { status: 500 })
  }
}
