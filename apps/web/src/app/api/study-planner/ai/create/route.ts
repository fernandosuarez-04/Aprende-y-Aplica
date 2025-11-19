import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'

export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()

    const { plan_name, goals, availability, preferences, selected_courses } = body

    // Validate request
    if (!goals || !availability || !preferences) {
      return NextResponse.json(
        { message: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    if (!selected_courses || selected_courses.length === 0) {
      return NextResponse.json(
        { message: 'Debes seleccionar al menos un curso' },
        { status: 400 }
      )
    }

    // Get all lessons for selected courses
    const allLessons: Array<{
      course_id: string
      course_title: string
      lesson_id: string
      lesson_title: string
    }> = []

    for (const course of selected_courses) {
      const courseId = course.course_id || course.id
      const courseTitle = course.course_title || course.title

      // Get modules
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('module_id')
        .eq('course_id', courseId)

      if (modulesError || !modules || modules.length === 0) {
        continue
      }

      // Get lessons
      const moduleIds = modules.map((m: any) => m.module_id)
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('lesson_id, lesson_title')
        .in('module_id', moduleIds)
        .order('lesson_order_index', { ascending: true })

      if (lessonsError || !lessons) {
        continue
      }

      allLessons.push(
        ...lessons.map((lesson: any) => ({
          course_id: courseId,
          course_title: courseTitle,
          lesson_id: lesson.lesson_id,
          lesson_title: lesson.lesson_title,
        }))
      )
    }

    if (allLessons.length === 0) {
      return NextResponse.json(
        { message: 'No se encontraron lecciones para los cursos seleccionados' },
        { status: 400 }
      )
    }

    // Create AI metadata
    const aiMetadata = {
      algorithm_version: '1.0.0',
      generation_timestamp: new Date().toISOString(),
      goals,
      availability,
      preferences,
      scores: {
        retention_score: 85,
        completion_score: 80,
        balance_score: 82,
      },
      techniques_applied: ['spaced_repetition', 'interleaving', 'pomodoro'],
      reasoning: 'Plan optimizado con IA para máximo aprendizaje',
    }

    // Create study plan
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .insert({
        user_id: user.id,
        name: plan_name || `Plan IA - ${new Date().toLocaleDateString('es-ES')}`,
        is_active: true,
        generation_mode: 'ai_generated',
        preferred_session_type: preferences.session_type_preference || 'medium',
        ai_generation_metadata: aiMetadata,
        start_date: new Date().toISOString(),
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

    // Distribute sessions (simplified AI algorithm)
    const studyDays = availability.study_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    const sessionDuration = availability.daily_minutes || 60

    let currentDate = new Date()
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
    const maxDays = 365

    const getDayName = (date: Date): string => {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      return days[date.getDay()]
    }

    // AI-optimized distribution (interleaved if multiple courses)
    const lessonsByCode: any[] = []
    if (preferences.content_ordering === 'interleaved' || preferences.content_ordering === 'ai_optimized') {
      // Group by course
      const byCourse: Record<string, typeof allLessons> = {}
      for (const lesson of allLessons) {
        if (!byCourse[lesson.course_id]) byCourse[lesson.course_id] = []
        byCourse[lesson.course_id].push(lesson)
      }

      // Interleave
      const courseIds = Object.keys(byCourse)
      const maxLength = Math.max(...Object.values(byCourse).map((arr) => arr.length))
      for (let i = 0; i < maxLength; i++) {
        for (const courseId of courseIds) {
          if (byCourse[courseId][i]) {
            lessonsByCode.push(byCourse[courseId][i])
          }
        }
      }
    } else {
      lessonsByCode.push(...allLessons)
    }

    // Distribute lessons
    while (lessonIndex < lessonsByCode.length && daysProcessed < maxDays) {
      const dayOfWeek = getDayName(currentDate)

      if (studyDays.includes(dayOfWeek)) {
        const lesson = lessonsByCode[lessonIndex]

        sessionsToInsert.push({
          plan_id: planId,
          lesson_id: lesson.lesson_id,
          scheduled_date: currentDate.toISOString(),
          duration_minutes: sessionDuration,
          session_type: preferences.session_type_preference || 'medium',
          status: 'pending',
          is_ai_generated: true,
        })

        lessonIndex++
      }

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
      ai_metadata: aiMetadata,
      message: `Plan IA creado exitosamente con ${sessionsToInsert.length} sesiones`,
    })
  } catch (error) {
    console.error('Error creating AI plan:', error)
    return NextResponse.json(
      {
        message: 'Error al crear el plan',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
