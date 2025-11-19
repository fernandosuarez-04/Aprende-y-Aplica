import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'

export async function POST(request: NextRequest) {
  try {
    // Get current user using SessionService (matches the project's auth system)
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const supabase = await createClient()

    const body = await request.json()
    const { plan_name, selected_courses, session_type, schedule } = body

    // Validate request
    if (!selected_courses || selected_courses.length === 0) {
      return NextResponse.json(
        { message: 'Debes seleccionar al menos un curso' },
        { status: 400 }
      )
    }

    if (!session_type) {
      return NextResponse.json(
        { message: 'Debes seleccionar un tipo de sesión' },
        { status: 400 }
      )
    }

    if (!schedule || !schedule.days) {
      return NextResponse.json(
        { message: 'Debes configurar tu horario' },
        { status: 400 }
      )
    }

    // Get lessons for each course (through modules)
    const allLessons: Array<{
      course_id: string
      course_title: string
      lesson_id: string
      lesson_title: string
    }> = []

    for (const course of selected_courses) {
      // Get modules for this course
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('module_id')
        .eq('course_id', course.course_id || course.id)

      if (modulesError) {
        console.error('Error fetching modules:', modulesError)
        continue
      }

      if (!modules || modules.length === 0) {
        continue
      }

      // Get lessons for all modules
      const moduleIds = modules.map((m: any) => m.module_id)
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('lesson_id, lesson_title')
        .in('module_id', moduleIds)
        .order('lesson_order_index', { ascending: true })

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError)
        continue
      }

      if (lessons) {
        allLessons.push(
          ...lessons.map((lesson: any) => ({
            course_id: course.course_id || course.id,
            course_title: course.course_title || course.title,
            lesson_id: lesson.lesson_id,
            lesson_title: lesson.lesson_title,
          }))
        )
      }
    }

    if (allLessons.length === 0) {
      return NextResponse.json(
        { message: 'No se encontraron lecciones para los cursos seleccionados' },
        { status: 400 }
      )
    }

    // Create study plan
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .insert({
        user_id: user.id,
        name: plan_name || `Plan Manual - ${new Date().toLocaleDateString('es-ES')}`,
        is_active: true,
        generation_mode: 'manual',
        preferred_session_type: session_type,
        start_date: schedule.start_date,
        end_date: schedule.end_date || null,
      })
      .select('id')
      .single()

    if (planError || !plan) {
      console.error('Error creating plan:', planError)
      return NextResponse.json(
        { message: 'Error al crear el plan', error: planError?.message },
        { status: 500 }
      )
    }

    const planId = plan.id

    // Distribute sessions across schedule
    const enabledDays = schedule.days.filter((d: any) => d.enabled)
    const sessionDuration = schedule.session_duration_minutes

    let currentDate = new Date(schedule.start_date)
    const endDate = schedule.end_date ? new Date(schedule.end_date) : null

    const sessionsToInsert: Array<{
      plan_id: string
      lesson_id: string
      scheduled_date: string
      duration_minutes: number
      session_type: string
      status: string
      is_ai_generated: boolean
    }> = []

    let lessonIndex = 0
    let daysProcessed = 0
    const maxDays = 365 // Safety limit

    // Distribute lessons across days
    while (lessonIndex < allLessons.length && daysProcessed < maxDays) {
      if (endDate && currentDate > endDate) break

      const dayOfWeek = currentDate.getDay()
      const dayName = getDayName(dayOfWeek)

      // Find schedule for this day
      const daySchedule = enabledDays.find((d: any) => d.day === dayName)

      if (daySchedule) {
        // Create sessions for this day
        const maxSessions = daySchedule.max_sessions || 1

        for (let i = 0; i < maxSessions && lessonIndex < allLessons.length; i++) {
          const lesson = allLessons[lessonIndex]

          sessionsToInsert.push({
            plan_id: planId,
            lesson_id: lesson.lesson_id,
            scheduled_date: currentDate.toISOString(),
            duration_minutes: sessionDuration,
            session_type: session_type,
            status: 'pending',
            is_ai_generated: false,
          })

          lessonIndex++
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
      daysProcessed++
    }

    // Insert sessions
    const { error: sessionsError } = await supabase
      .from('study_sessions')
      .insert(sessionsToInsert)

    if (sessionsError) {
      console.error('Error creating sessions:', sessionsError)
      return NextResponse.json(
        { message: 'Error al crear las sesiones', error: sessionsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      plan_id: planId,
      sessions_created: sessionsToInsert.length,
      message: `Plan creado exitosamente con ${sessionsToInsert.length} sesiones`,
    })
  } catch (error) {
    console.error('Error creating manual plan:', error)
    return NextResponse.json(
      { message: 'Error al crear el plan', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function getDayName(dayOfWeek: number): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[dayOfWeek]
}
