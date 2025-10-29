import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CourseService } from '@/features/courses/services/course.service'

/**
 * GET /api/courses/[slug]/modules
 * Obtiene todos los módulos y lecciones de un curso por slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    // Obtener usuario autenticado (opcional, para progreso)
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    // Obtener el curso por slug para obtener el courseId
    const course = await CourseService.getCourseBySlug(slug, userId || undefined)
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Obtener módulos del curso
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select(`
        module_id,
        module_title,
        module_order_index
      `)
      .eq('course_id', course.id)
      .eq('is_published', true)
      .order('module_order_index', { ascending: true })

    if (modulesError) {
      console.error('Error fetching modules:', modulesError)
      return NextResponse.json(
        { error: 'Error al obtener módulos' },
        { status: 500 }
      )
    }

    // Obtener todas las lecciones de los módulos
    const moduleIds = modules?.map(m => m.module_id) || []
    
    if (moduleIds.length === 0) {
      return NextResponse.json([])
    }

    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select(`
        lesson_id,
        lesson_title,
        lesson_order_index,
        duration_seconds,
        module_id
      `)
      .in('module_id', moduleIds)
      .eq('is_published', true)
      .order('lesson_order_index', { ascending: true })

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError)
      return NextResponse.json(
        { error: 'Error al obtener lecciones' },
        { status: 500 }
      )
    }

    // Obtener progreso del usuario si está autenticado
    let progressData: Record<string, { is_completed: boolean; progress_percentage: number }> = {}
    
    if (userId && lessons && lessons.length > 0) {
      const lessonIds = lessons.map(l => l.lesson_id)
      
      const { data: progress } = await supabase
        .from('student_lesson_progress')
        .select('lesson_id, is_completed, progress_percentage')
        .eq('student_id', userId)
        .in('lesson_id', lessonIds)

      if (progress) {
        progress.forEach(p => {
          progressData[p.lesson_id] = {
            is_completed: p.is_completed || false,
            progress_percentage: p.progress_percentage || 0
          }
        })
      }
    }

    // Agrupar lecciones por módulo
    const modulesWithLessons = modules?.map(module => {
      const moduleLessons = lessons
        ?.filter(lesson => lesson.module_id === module.module_id)
        .map(lesson => ({
          lesson_id: lesson.lesson_id,
          lesson_title: lesson.lesson_title,
          lesson_order_index: lesson.lesson_order_index,
          duration_seconds: lesson.duration_seconds,
          is_completed: progressData[lesson.lesson_id]?.is_completed || false,
          progress_percentage: progressData[lesson.lesson_id]?.progress_percentage || 0
        })) || []

      return {
        module_id: module.module_id,
        module_title: module.module_title,
        module_order_index: module.module_order_index,
        lessons: moduleLessons
      }
    }) || []

    return NextResponse.json(modulesWithLessons)
  } catch (error) {
    console.error('Error in modules GET API:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

