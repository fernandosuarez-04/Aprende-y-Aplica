/**
 * AI Distribution Algorithm
 * Implements scientific learning principles for optimal session distribution
 */

import { PreviewSession, DayOfWeek, TimeSlot } from './ai-wizard.types'
import { SessionType, CourseComplexity } from './study-planner-types'

// =====================================================
// Types
// =====================================================

interface LessonWithMetadata {
  lesson_id: string
  lesson_title: string
  course_id: string
  course_title: string
  estimated_time_minutes: number
  complexity: CourseComplexity
  module_index: number
  lesson_index: number
}

interface DistributionConfig {
  // Goals
  learning_pace: 'relaxed' | 'moderate' | 'intensive'
  priority_focus: 'completion' | 'retention' | 'balanced'
  target_completion_date?: Date

  // Availability
  daily_minutes: number
  study_days: DayOfWeek[]
  time_slots: Record<DayOfWeek, TimeSlot[]>

  // Preferences
  session_type: SessionType
  review_strategy: 'spaced_repetition' | 'massed_practice' | 'mixed'
  content_ordering: 'sequential' | 'interleaved' | 'difficulty_based' | 'ai_optimized'
  enable_pomodoro: boolean
}

interface SpacedRepetitionSchedule {
  lesson_id: string
  review_dates: Date[]  // Dates for reviewing this lesson
}

// =====================================================
// Main Distribution Algorithm
// =====================================================

export class AIDistributionAlgorithm {
  /**
   * Generate optimized session distribution using AI principles
   */
  static distributeSessionsWithAI(
    lessons: LessonWithMetadata[],
    config: DistributionConfig,
    startDate: Date
  ): PreviewSession[] {
    const sessions: PreviewSession[] = []

    // Step 1: Prepare lessons based on content ordering preference
    const orderedLessons = this.orderLessons(lessons, config.content_ordering)

    // Step 2: Calculate optimal sessions per week based on learning pace
    const sessionsPerWeek = this.calculateSessionsPerWeek(config.learning_pace, config.study_days.length)

    // Step 3: Distribute initial learning sessions
    const initialSessions = this.distributeInitialSessions(
      orderedLessons,
      config,
      startDate,
      sessionsPerWeek
    )
    sessions.push(...initialSessions)

    // Step 4: Add review sessions if using spaced repetition
    if (
      config.review_strategy === 'spaced_repetition' ||
      config.review_strategy === 'mixed'
    ) {
      const reviewSessions = this.addSpacedRepetitionReviews(
        orderedLessons,
        initialSessions,
        config,
        startDate
      )
      sessions.push(...reviewSessions)
    }

    // Step 5: Sort all sessions by date
    sessions.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Step 6: Optimize session distribution (apply interleaving, load balancing)
    const optimizedSessions = this.optimizeDistribution(sessions, config)

    return optimizedSessions
  }

  // =====================================================
  // Step 1: Order Lessons
  // =====================================================

  private static orderLessons(
    lessons: LessonWithMetadata[],
    ordering: DistributionConfig['content_ordering']
  ): LessonWithMetadata[] {
    switch (ordering) {
      case 'sequential':
        // Keep original course order
        return [...lessons].sort((a, b) => {
          if (a.course_id !== b.course_id) {
            return a.course_id.localeCompare(b.course_id)
          }
          if (a.module_index !== b.module_index) {
            return a.module_index - b.module_index
          }
          return a.lesson_index - b.lesson_index
        })

      case 'interleaved':
        // Alternate between courses
        return this.interleaveLessons(lessons)

      case 'difficulty_based':
        // Start with easier, progress to harder
        return [...lessons].sort((a, b) => {
          const diffA = a.complexity.complexity_multiplier
          const diffB = b.complexity.complexity_multiplier
          return diffA - diffB
        })

      case 'ai_optimized':
        // AI decides: Start medium difficulty, interleave courses, progress gradually
        return this.aiOptimizedOrdering(lessons)

      default:
        return lessons
    }
  }

  private static interleaveLessons(lessons: LessonWithMetadata[]): LessonWithMetadata[] {
    // Group by course
    const byCourse = lessons.reduce((acc, lesson) => {
      if (!acc[lesson.course_id]) acc[lesson.course_id] = []
      acc[lesson.course_id].push(lesson)
      return acc
    }, {} as Record<string, LessonWithMetadata[]>)

    // Interleave: Pick one from each course in round-robin fashion
    const courseIds = Object.keys(byCourse)
    const result: LessonWithMetadata[] = []
    let maxLength = Math.max(...Object.values(byCourse).map((arr) => arr.length))

    for (let i = 0; i < maxLength; i++) {
      for (const courseId of courseIds) {
        if (byCourse[courseId][i]) {
          result.push(byCourse[courseId][i])
        }
      }
    }

    return result
  }

  private static aiOptimizedOrdering(lessons: LessonWithMetadata[]): LessonWithMetadata[] {
    // AI-optimized: Interleave + difficulty progression
    const interleaved = this.interleaveLessons(lessons)

    // Group into chunks (e.g., groups of 5)
    const chunkSize = 5
    const chunks: LessonWithMetadata[][] = []
    for (let i = 0; i < interleaved.length; i += chunkSize) {
      chunks.push(interleaved.slice(i, i + chunkSize))
    }

    // Within each chunk, sort by difficulty (easier first)
    const optimized = chunks.flatMap((chunk) =>
      chunk.sort((a, b) => a.complexity.complexity_multiplier - b.complexity.complexity_multiplier)
    )

    return optimized
  }

  // =====================================================
  // Step 2: Calculate Sessions Per Week
  // =====================================================

  private static calculateSessionsPerWeek(
    pace: 'relaxed' | 'moderate' | 'intensive',
    availableDays: number
  ): number {
    switch (pace) {
      case 'relaxed':
        return Math.min(3, availableDays)
      case 'moderate':
        return Math.min(4, availableDays)
      case 'intensive':
        return Math.min(6, availableDays)
      default:
        return Math.min(4, availableDays)
    }
  }

  // =====================================================
  // Step 3: Distribute Initial Sessions
  // =====================================================

  private static distributeInitialSessions(
    lessons: LessonWithMetadata[],
    config: DistributionConfig,
    startDate: Date,
    sessionsPerWeek: number
  ): PreviewSession[] {
    const sessions: PreviewSession[] = []
    let currentDate = new Date(startDate)
    let lessonIndex = 0
    let weekSessionCount = 0
    let daysProcessed = 0
    const maxDays = 365 // Safety limit

    while (lessonIndex < lessons.length && daysProcessed < maxDays) {
      const dayOfWeek = this.getDayName(currentDate)

      // Check if this day is in study days
      if (config.study_days.includes(dayOfWeek)) {
        // Check if we haven't exceeded sessions this week
        if (weekSessionCount < sessionsPerWeek) {
          const lesson = lessons[lessonIndex]
          const timeSlots = config.time_slots[dayOfWeek] || []

          if (timeSlots.length > 0) {
            const timeSlot = timeSlots[0] // Use first available time slot
            const sessionDuration = this.calculateSessionDuration(
              lesson.estimated_time_minutes,
              config.session_type,
              config.enable_pomodoro
            )

            const session = this.createSession(
              lesson,
              currentDate,
              dayOfWeek,
              timeSlot,
              sessionDuration
            )

            sessions.push(session)
            lessonIndex++
            weekSessionCount++
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
      daysProcessed++

      // Reset week counter on Sunday
      if (currentDate.getDay() === 0) {
        weekSessionCount = 0
      }
    }

    return sessions
  }

  // =====================================================
  // Step 4: Spaced Repetition
  // =====================================================

  private static addSpacedRepetitionReviews(
    lessons: LessonWithMetadata[],
    initialSessions: PreviewSession[],
    config: DistributionConfig,
    startDate: Date
  ): PreviewSession[] {
    const reviewSessions: PreviewSession[] = []

    // Spaced repetition intervals (Ebbinghaus forgetting curve)
    // Review after: 1 day, 3 days, 7 days, 14 days, 30 days
    const reviewIntervals = [1, 3, 7, 14, 30]

    for (const initialSession of initialSessions) {
      const lesson = lessons.find((l) => l.lesson_id === initialSession.lesson_id)
      if (!lesson) continue

      // Schedule reviews based on priority focus
      let intervalsToUse: number[] = []
      if (config.priority_focus === 'retention') {
        intervalsToUse = reviewIntervals // All reviews
      } else if (config.priority_focus === 'balanced') {
        intervalsToUse = [1, 7, 30] // Key reviews
      } else {
        intervalsToUse = [7] // Minimal review
      }

      for (const interval of intervalsToUse) {
        const reviewDate = new Date(initialSession.date)
        reviewDate.setDate(reviewDate.getDate() + interval)

        // Find next available study day
        const nextAvailableDate = this.findNextAvailableDay(
          reviewDate,
          config.study_days,
          initialSessions
        )

        if (nextAvailableDate) {
          const dayOfWeek = this.getDayName(nextAvailableDate)
          const timeSlots = config.time_slots[dayOfWeek] || []

          if (timeSlots.length > 0) {
            // Review sessions are typically shorter (50% of initial)
            const reviewDuration = Math.round(initialSession.duration_minutes * 0.5)

            const reviewSession = this.createSession(
              lesson,
              nextAvailableDate,
              dayOfWeek,
              timeSlots[0],
              reviewDuration,
              true // is_review
            )

            reviewSessions.push(reviewSession)
          }
        }
      }
    }

    return reviewSessions
  }

  // =====================================================
  // Step 5: Optimize Distribution
  // =====================================================

  private static optimizeDistribution(
    sessions: PreviewSession[],
    config: DistributionConfig
  ): PreviewSession[] {
    // Load balancing: Avoid too many sessions on same day
    // Group by date
    const sessionsByDate = sessions.reduce((acc, session) => {
      const dateKey = session.date.toISOString().split('T')[0]
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(session)
      return acc
    }, {} as Record<string, PreviewSession[]>)

    // Check for overloaded days (>2 sessions)
    const optimized: PreviewSession[] = []
    for (const [dateKey, dateSessions] of Object.entries(sessionsByDate)) {
      if (dateSessions.length <= 2) {
        optimized.push(...dateSessions)
      } else {
        // Keep first 2, reschedule rest
        optimized.push(...dateSessions.slice(0, 2))
        // TODO: Reschedule remaining sessions
      }
    }

    return optimized.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  private static calculateSessionDuration(
    lessonTime: number,
    sessionType: SessionType,
    enablePomodoro: boolean
  ): number {
    // Base duration from session type
    let baseDuration: number
    switch (sessionType) {
      case 'short':
        baseDuration = 30
        break
      case 'medium':
        baseDuration = 60
        break
      case 'long':
        baseDuration = 90
        break
      default:
        baseDuration = 60
    }

    // Adjust if Pomodoro enabled (round to nearest Pomodoro cycle: 25+5 = 30 min)
    if (enablePomodoro) {
      const pomodoroC ycle = 30
      return Math.ceil(baseDuration / pomodoroC ycle) * pomodoroC ycle
    }

    return baseDuration
  }

  private static createSession(
    lesson: LessonWithMetadata,
    date: Date,
    day: DayOfWeek,
    timeSlot: TimeSlot,
    duration: number,
    isReview: boolean = false
  ): PreviewSession {
    const startTime = this.getStartTimeForSlot(timeSlot)

    return {
      day,
      date: new Date(date),
      time_slot: timeSlot,
      course_id: lesson.course_id,
      course_title: lesson.course_title,
      lesson_id: lesson.lesson_id,
      lesson_title: isReview ? `📝 Review: ${lesson.lesson_title}` : lesson.lesson_title,
      duration_minutes: duration,
      start_time: startTime,
      end_time: this.addMinutesToTime(startTime, duration),
    }
  }

  private static getDayName(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ]
    return days[date.getDay()]
  }

  private static getStartTimeForSlot(slot: TimeSlot): string {
    const ranges: Record<TimeSlot, string> = {
      morning: '06:00',
      afternoon: '12:00',
      evening: '18:00',
      night: '22:00',
    }
    return ranges[slot]
  }

  private static addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60) % 24
    const newMins = totalMinutes % 60
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
  }

  private static findNextAvailableDay(
    targetDate: Date,
    studyDays: DayOfWeek[],
    existingSessions: PreviewSession[]
  ): Date | null {
    let currentDate = new Date(targetDate)
    let attempts = 0
    const maxAttempts = 14 // Look ahead 2 weeks

    while (attempts < maxAttempts) {
      const dayName = this.getDayName(currentDate)

      if (studyDays.includes(dayName)) {
        // Check if this day doesn't already have too many sessions
        const dateKey = currentDate.toISOString().split('T')[0]
        const sessionsOnDay = existingSessions.filter(
          (s) => s.date.toISOString().split('T')[0] === dateKey
        )

        if (sessionsOnDay.length < 2) {
          return new Date(currentDate)
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
      attempts++
    }

    return null
  }
}
