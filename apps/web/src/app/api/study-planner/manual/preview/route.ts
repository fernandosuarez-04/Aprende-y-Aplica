import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { PreviewSession, DayOfWeek, TimeSlot, TIME_SLOT_RANGES } from '@/features/study-planner/types/manual-wizard.types'

export async function POST(request: NextRequest) {
  try {
    // Get current user using SessionService (matches the project's auth system)
    const user = await SessionService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const supabase = await createClient()

    const body = await request.json()
    const { selected_courses, session_type, schedule } = body

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
      lesson_time_minutes: number
    }> = []

    for (const course of selected_courses) {
      const courseId = course.course_id || course.id
      const courseTitle = course.course_title || course.title

      // Get modules for this course
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('module_id')
        .eq('course_id', courseId)

      if (modulesError || !modules || modules.length === 0) {
        continue
      }

      // Get lessons for all modules
      const moduleIds = modules.map((m: any) => m.module_id)
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('lesson_id, lesson_title')
        .in('module_id', moduleIds)
        .order('lesson_order_index', { ascending: true })

      if (lessonsError || !lessons) {
        continue
      }

      // Get lesson time estimates
      const lessonIds = lessons.map((l: any) => l.lesson_id)
      const { data: lessonTimes } = await supabase
        .from('lesson_time_estimates')
        .select('lesson_id, total_time_minutes')
        .in('lesson_id', lessonIds)

      // Build lessons array with time estimates
      for (const lesson of lessons) {
        const timeEstimate = lessonTimes?.find((lt: any) => lt.lesson_id === lesson.lesson_id)
        const lessonTime = timeEstimate?.total_time_minutes || schedule.session_duration_minutes || 60

        allLessons.push({
          course_id: courseId,
          course_title: courseTitle,
          lesson_id: lesson.lesson_id,
          lesson_title: lesson.lesson_title,
          lesson_time_minutes: lessonTime,
        })
      }
    }

    if (allLessons.length === 0) {
      return NextResponse.json(
        { message: 'No se encontraron lecciones para los cursos seleccionados' },
        { status: 400 }
      )
    }

    // Generate sessions distribution
    const enabledDays = schedule.days.filter((d: any) => d.enabled)
    const sessionDuration = schedule.session_duration_minutes || 60
    const startDate = new Date(schedule.start_date)
    const endDate = schedule.end_date ? new Date(schedule.end_date) : null

    const sessions: PreviewSession[] = []
    let currentDate = new Date(startDate)
    let lessonIndex = 0
    let daysProcessed = 0
    const maxDays = 365 // Safety limit

    // Helper function to get day name from date
    const getDayName = (date: Date): DayOfWeek => {
      const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      return days[date.getDay()]
    }

    // Helper function to get week number from date (relative to start date)
    const getWeekNumber = (date: Date): number => {
      const diffTime = date.getTime() - startDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      return Math.floor(diffDays / 7) + 1
    }

    // Distribute lessons across schedule
    while (lessonIndex < allLessons.length && daysProcessed < maxDays) {
      if (endDate && currentDate > endDate) break

      const dayOfWeek = getDayName(currentDate)
      const daySchedule = enabledDays.find((d: any) => d.day === dayOfWeek)

      if (daySchedule && daySchedule.time_slots && daySchedule.time_slots.length > 0) {
        const maxSessions = daySchedule.max_sessions || 1
        const timeSlots = daySchedule.time_slots as TimeSlot[]

        for (let i = 0; i < maxSessions && lessonIndex < allLessons.length; i++) {
          const lesson = allLessons[lessonIndex]
          const timeSlot = timeSlots[i % timeSlots.length]
          const timeRange = TIME_SLOT_RANGES[timeSlot]

          // Use the first time slot's start time, or distribute across slots
          const startTime = timeRange.start
          const [startHour, startMin] = startTime.split(':').map(Number)
          const sessionDate = new Date(currentDate)
          sessionDate.setHours(startHour, startMin, 0, 0)

          const endTimeMinutes = startMin + sessionDuration
          const endHour = startHour + Math.floor(endTimeMinutes / 60)
          const endMin = endTimeMinutes % 60
          const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`

          sessions.push({
            day: dayOfWeek,
            date: sessionDate,
            time_slot: timeSlot,
            course_id: lesson.course_id,
            course_title: lesson.course_title,
            lesson_id: lesson.lesson_id,
            lesson_title: lesson.lesson_title,
            duration_minutes: sessionDuration,
            start_time: startTime,
            end_time: endTime,
          })

          lessonIndex++
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
      daysProcessed++
    }

    // Group sessions by week
    const sessionsByWeek = new Map<number, PreviewSession[]>()
    for (const session of sessions) {
      const weekNum = getWeekNumber(session.date)
      if (!sessionsByWeek.has(weekNum)) {
        sessionsByWeek.set(weekNum, [])
      }
      sessionsByWeek.get(weekNum)!.push(session)
    }

    // Group sessions by course
    const sessionsByCourse = new Map<string, PreviewSession[]>()
    for (const session of sessions) {
      if (!sessionsByCourse.has(session.course_id)) {
        sessionsByCourse.set(session.course_id, [])
      }
      sessionsByCourse.get(session.course_id)!.push(session)
    }

    // Calculate completion date (last session date)
    const lastSession = sessions[sessions.length - 1]
    const estimatedCompletionDate = lastSession ? new Date(lastSession.date) : new Date(startDate)

    // Calculate totals
    const totalSessions = sessions.length
    const totalStudyHours = (totalSessions * sessionDuration) / 60

    // Convert Maps to objects for JSON serialization
    const sessionsByWeekObj: Record<number, PreviewSession[]> = {}
    for (const [week, weekSessions] of sessionsByWeek.entries()) {
      sessionsByWeekObj[week] = weekSessions.map(s => ({
        ...s,
        date: s.date.toISOString(),
      })) as any
    }

    const sessionsByCourseObj: Record<string, PreviewSession[]> = {}
    for (const [courseId, courseSessions] of sessionsByCourse.entries()) {
      sessionsByCourseObj[courseId] = courseSessions.map(s => ({
        ...s,
        date: s.date.toISOString(),
      })) as any
    }

    const preview = {
      plan_name: `Plan Manual - ${new Date().toLocaleDateString('es-ES')}`,
      total_sessions: totalSessions,
      total_study_hours: totalStudyHours,
      estimated_completion_date: estimatedCompletionDate.toISOString(),
      sessions_by_week: sessionsByWeekObj,
      sessions_by_course: sessionsByCourseObj,
    }

    return NextResponse.json({ success: true, preview })
  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { message: 'Error al generar preview', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
