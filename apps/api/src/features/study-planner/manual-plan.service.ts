/**
 * Manual Plan Service
 * Handles creation and validation of manually configured study plans
 */

import {
  CreateManualPlanRequest,
  CreateManualPlanResponse,
  ValidateManualPlanRequest,
  ValidateManualPlanResponse,
  PlanPreview,
  PreviewSession,
  ValidationError,
  SelectedCourse,
  ScheduleConfiguration,
  DaySchedule,
  TimeSlot,
  TIME_SLOT_RANGES,
} from './manual-wizard.types'
import { SessionType, SESSION_TYPE_DURATIONS } from './study-planner-types'
import { SupabaseClient } from '@supabase/supabase-js'

export class ManualPlanService {
  /**
   * Validate manual plan configuration
   */
  static async validateManualPlan(
    request: ValidateManualPlanRequest,
    supabase: SupabaseClient
  ): Promise<ValidateManualPlanResponse> {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    const lessonValidations: any[] = []

    // 1. Validate courses
    if (!request.selected_courses || request.selected_courses.length === 0) {
      errors.push({
        field: 'selected_courses',
        message: 'Debes seleccionar al menos un curso',
        severity: 'error',
      })
    }

    if (request.selected_courses.length > 5) {
      warnings.push({
        field: 'selected_courses',
        message: 'Más de 5 cursos puede hacer el plan difícil de seguir',
        severity: 'warning',
      })
    }

    // 2. Validate schedule
    const enabledDays = request.schedule.days.filter((d) => d.enabled)
    if (enabledDays.length === 0) {
      errors.push({
        field: 'days',
        message: 'Debes seleccionar al menos un día de estudio',
        severity: 'error',
      })
    }

    if (enabledDays.length < 3) {
      warnings.push({
        field: 'days',
        message: 'Se recomienda estudiar al menos 3 días por semana',
        severity: 'warning',
      })
    }

    // 3. Validate session duration
    const sessionDuration = request.schedule.session_duration_minutes
    const sessionType = request.session_type
    const sessionTypeRange = SESSION_TYPE_DURATIONS[sessionType]

    if (sessionDuration < 15) {
      errors.push({
        field: 'session_duration_minutes',
        message: 'Las sesiones deben durar al menos 15 minutos',
        severity: 'error',
      })
    }

    if (sessionDuration < sessionTypeRange.min_duration_minutes) {
      warnings.push({
        field: 'session_duration_minutes',
        message: `Tu duración (${sessionDuration} min) es menor que lo recomendado para sesiones ${sessionType} (${sessionTypeRange.min_duration_minutes}-${sessionTypeRange.max_duration_minutes} min)`,
        severity: 'warning',
      })
    }

    if (sessionDuration > sessionTypeRange.max_duration_minutes) {
      warnings.push({
        field: 'session_duration_minutes',
        message: `Tu duración (${sessionDuration} min) es mayor que lo recomendado para sesiones ${sessionType} (${sessionTypeRange.min_duration_minutes}-${sessionTypeRange.max_duration_minutes} min)`,
        severity: 'warning',
      })
    }

    // 4. Validate lesson fit (check if lessons fit in session duration)
    for (const course of request.selected_courses) {
      // Fetch lessons for this course
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('lesson_id, title')
        .eq('curso_id', course.course_id)
        .order('order_index', { ascending: true })

      if (lessonsError || !lessons) continue

      // Get time estimates
      const { data: timeEstimates, error: timesError } = await supabase
        .from('lesson_time_estimates')
        .select('lesson_id, total_time_minutes')
        .in(
          'lesson_id',
          lessons.map((l) => l.lesson_id)
        )

      if (timesError || !timeEstimates) continue

      // Check each lesson
      for (const lesson of lessons) {
        const timeEst = timeEstimates.find((t) => t.lesson_id === lesson.lesson_id)
        const lessonTime = timeEst?.total_time_minutes || 45 // Default 45 min

        const fits = lessonTime <= sessionDuration
        const overflowMinutes = fits ? 0 : lessonTime - sessionDuration

        lessonValidations.push({
          lesson_id: lesson.lesson_id,
          lesson_title: lesson.title,
          required_time_minutes: lessonTime,
          session_duration_minutes: sessionDuration,
          fits,
          overflow_minutes: overflowMinutes,
        })

        if (!fits) {
          warnings.push({
            field: 'lesson_fit',
            message: `La lección "${lesson.title}" requiere ${lessonTime} min, pero tus sesiones son de ${sessionDuration} min`,
            severity: 'warning',
          })
        }
      }
    }

    // 5. Suggest optimal session duration if needed
    let suggestedSessionDuration: number | undefined
    const maxLessonTime = Math.max(
      ...lessonValidations.map((lv) => lv.required_time_minutes),
      0
    )
    if (maxLessonTime > sessionDuration) {
      // Suggest next session type that fits
      if (maxLessonTime <= SESSION_TYPE_DURATIONS.short.max_duration_minutes) {
        suggestedSessionDuration = SESSION_TYPE_DURATIONS.short.max_duration_minutes
      } else if (maxLessonTime <= SESSION_TYPE_DURATIONS.medium.max_duration_minutes) {
        suggestedSessionDuration = SESSION_TYPE_DURATIONS.medium.max_duration_minutes
      } else {
        suggestedSessionDuration = SESSION_TYPE_DURATIONS.long.max_duration_minutes
      }
    }

    const isValid = errors.length === 0

    return {
      is_valid: isValid,
      validation_result: {
        is_valid: isValid,
        errors,
        warnings,
      },
      lesson_validations: lessonValidations,
      suggested_session_duration: suggestedSessionDuration,
    }
  }

  /**
   * Generate preview of manual plan
   */
  static async generatePreview(
    request: CreateManualPlanRequest,
    supabase: SupabaseClient,
    userId: string
  ): Promise<PlanPreview> {
    const sessions: PreviewSession[] = []
    const sessionsByWeek = new Map<number, PreviewSession[]>()
    const sessionsByCourse = new Map<string, PreviewSession[]>()

    let totalSessions = 0
    let totalStudyHours = 0

    // Get lessons for each course
    const courseLessons = await Promise.all(
      request.selected_courses.map(async (course) => {
        const { data: lessons, error } = await supabase
          .from('course_lessons')
          .select('lesson_id, title, order_index')
          .eq('curso_id', course.course_id)
          .order('order_index', { ascending: true })

        if (error || !lessons) return { course, lessons: [] }

        // Get time estimates
        const { data: timeEstimates } = await supabase
          .from('lesson_time_estimates')
          .select('lesson_id, total_time_minutes')
          .in(
            'lesson_id',
            lessons.map((l) => l.lesson_id)
          )

        const lessonsWithTime = lessons.map((lesson) => {
          const timeEst = timeEstimates?.find((t) => t.lesson_id === lesson.lesson_id)
          return {
            ...lesson,
            estimated_time_minutes: timeEst?.total_time_minutes || 45,
          }
        })

        return { course, lessons: lessonsWithTime }
      })
    )

    // Distribute sessions across schedule
    const { schedule, session_type } = request
    const enabledDays = schedule.days.filter((d) => d.enabled)
    const sessionDuration = schedule.session_duration_minutes

    let currentDate = new Date(schedule.start_date)
    const endDate = schedule.end_date ? new Date(schedule.end_date) : null

    // Flatten all lessons from all courses
    const allLessons = courseLessons.flatMap(({ course, lessons }) =>
      lessons.map((lesson) => ({
        course_id: course.course_id,
        course_title: course.course_title,
        lesson_id: lesson.lesson_id,
        lesson_title: lesson.title,
        estimated_time_minutes: lesson.estimated_time_minutes,
      }))
    )

    let lessonIndex = 0
    let weekNumber = 1
    const maxWeeks = 52 // Safety limit

    // Distribute lessons
    while (lessonIndex < allLessons.length && weekNumber <= maxWeeks) {
      // Check end date
      if (endDate && currentDate > endDate) break

      const dayOfWeek = currentDate.getDay()
      const dayName = this.getDayName(dayOfWeek)

      // Find schedule for this day
      const daySchedule = enabledDays.find((d) => d.day === dayName)

      if (daySchedule) {
        // Create sessions for this day
        const maxSessions = daySchedule.max_sessions
        const timeSlots = daySchedule.time_slots

        for (let i = 0; i < maxSessions && lessonIndex < allLessons.length; i++) {
          const lesson = allLessons[lessonIndex]
          const timeSlot = timeSlots[i % timeSlots.length] // Cycle through time slots

          const startTime = this.getStartTimeForSlot(timeSlot)

          const session: PreviewSession = {
            day: dayName,
            date: new Date(currentDate),
            time_slot: timeSlot,
            course_id: lesson.course_id,
            course_title: lesson.course_title,
            lesson_id: lesson.lesson_id,
            lesson_title: lesson.lesson_title,
            duration_minutes: sessionDuration,
            start_time: startTime,
            end_time: this.addMinutesToTime(startTime, sessionDuration),
          }

          sessions.push(session)
          lessonIndex++
          totalSessions++
          totalStudyHours += sessionDuration / 60

          // Add to week map
          if (!sessionsByWeek.has(weekNumber)) {
            sessionsByWeek.set(weekNumber, [])
          }
          sessionsByWeek.get(weekNumber)!.push(session)

          // Add to course map
          if (!sessionsByCourse.has(lesson.course_id)) {
            sessionsByCourse.set(lesson.course_id, [])
          }
          sessionsByCourse.get(lesson.course_id)!.push(session)
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)

      // Check if new week started (Monday)
      if (dayOfWeek === 0) {
        weekNumber++
      }
    }

    const estimatedCompletionDate =
      sessions.length > 0 ? sessions[sessions.length - 1].date : new Date()

    return {
      plan_name: request.plan_name || `Plan Manual - ${new Date().toLocaleDateString()}`,
      total_sessions: totalSessions,
      total_study_hours: totalStudyHours,
      estimated_completion_date: estimatedCompletionDate,
      sessions_by_week: sessionsByWeek,
      sessions_by_course: sessionsByCourse,
    }
  }

  /**
   * Create manual plan
   */
  static async createManualPlan(
    request: CreateManualPlanRequest,
    supabase: SupabaseClient,
    userId: string
  ): Promise<CreateManualPlanResponse> {
    try {
      // 1. Validate first
      const validation = await this.validateManualPlan(
        {
          selected_courses: request.selected_courses,
          session_type: request.session_type,
          schedule: request.schedule,
        },
        supabase
      )

      if (!validation.is_valid) {
        return {
          success: false,
          plan_id: '',
          sessions_created: 0,
          message: 'La configuración del plan tiene errores',
          errors: validation.validation_result.errors.map((e) => e.message),
        }
      }

      // 2. Generate preview to get sessions
      const preview = await this.generatePreview(request, supabase, userId)

      // 3. Create plan in database
      const { data: plan, error: planError } = await supabase
        .from('study_plans')
        .insert({
          user_id: userId,
          name: request.plan_name || `Plan Manual - ${new Date().toLocaleDateString()}`,
          is_active: true,
          generation_mode: 'manual',
          preferred_session_type: request.session_type,
          start_date: request.schedule.start_date.toISOString(),
          end_date: request.schedule.end_date?.toISOString(),
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (planError || !plan) {
        throw new Error('Error al crear plan: ' + planError?.message)
      }

      const planId = plan.id

      // 4. Create sessions
      const sessionsToInsert = Array.from(preview.sessions_by_week.values())
        .flat()
        .map((session) => ({
          plan_id: planId,
          lesson_id: session.lesson_id,
          scheduled_date: session.date.toISOString(),
          duration_minutes: session.duration_minutes,
          session_type: request.session_type,
          status: 'pending',
          is_ai_generated: false,
        }))

      const { error: sessionsError } = await supabase
        .from('study_sessions')
        .insert(sessionsToInsert)

      if (sessionsError) {
        throw new Error('Error al crear sesiones: ' + sessionsError.message)
      }

      return {
        success: true,
        plan_id: planId,
        sessions_created: sessionsToInsert.length,
        message: `Plan creado exitosamente con ${sessionsToInsert.length} sesiones`,
      }
    } catch (error) {
      console.error('Error creating manual plan:', error)
      return {
        success: false,
        plan_id: '',
        sessions_created: 0,
        message: 'Error al crear el plan',
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
      }
    }
  }

  // =====================================================
  // Helper Functions
  // =====================================================

  private static getDayName(dayOfWeek: number): any {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[dayOfWeek]
  }

  private static getStartTimeForSlot(slot: TimeSlot): string {
    return TIME_SLOT_RANGES[slot].start
  }

  private static addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60) % 24
    const newMins = totalMinutes % 60
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
  }
}
