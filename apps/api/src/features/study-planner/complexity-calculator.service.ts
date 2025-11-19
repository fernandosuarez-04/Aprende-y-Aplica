/**
 * Complexity Calculator Service
 * Calculates course complexity and adjusts session durations accordingly
 *
 * Based on PRD: Course Complexity Calculation System
 */

import {
  CourseLevel,
  CourseCategory,
  CourseComplexity,
  SessionType,
  LEVEL_MULTIPLIERS,
  CATEGORY_MULTIPLIERS,
  SESSION_TYPE_DURATIONS,
} from './types'

export class ComplexityCalculatorService {
  /**
   * Calculate course complexity multiplier
   *
   * Formula:
   * Complexity = Level Multiplier × (1 + Category Multiplier)
   *
   * Level Multipliers:
   * - Beginner: 0.9
   * - Intermediate: 1.0
   * - Advanced: 1.2
   *
   * Category Multipliers (additional):
   * - Technical/Data Science: +15%
   * - Conceptual/Leadership: +10%
   * - Practical/Creativity: +12%
   * - Theoretical: +20%
   */
  static calculateComplexity(
    level: CourseLevel,
    category: CourseCategory
  ): CourseComplexity {
    const levelMultiplier = LEVEL_MULTIPLIERS[level] || 1.0
    const categoryBonus = CATEGORY_MULTIPLIERS[category] || 0.1

    const complexityMultiplier = levelMultiplier * (1.0 + categoryBonus)

    // Round to 3 decimals
    const roundedMultiplier = Math.round(complexityMultiplier * 1000) / 1000

    return {
      level,
      category,
      complexity_multiplier: roundedMultiplier,
    }
  }

  /**
   * Adjust base session duration by complexity
   *
   * More complex courses may need longer sessions or
   * fewer lessons per session.
   */
  static adjustSessionDuration(
    baseDurationMinutes: number,
    complexity: CourseComplexity
  ): number {
    const adjusted = baseDurationMinutes * complexity.complexity_multiplier
    return Math.round(adjusted)
  }

  /**
   * Get adjusted duration for all session types
   */
  static getAdjustedDurationsForAllSessionTypes(
    complexity: CourseComplexity
  ): Record<SessionType, { min: number; max: number }> {
    const result: Record<string, { min: number; max: number }> = {}

    for (const [sessionType, durations] of Object.entries(SESSION_TYPE_DURATIONS)) {
      const adjustedMin = this.adjustSessionDuration(
        durations.min_duration_minutes,
        complexity
      )
      const adjustedMax = this.adjustSessionDuration(
        durations.max_duration_minutes,
        complexity
      )

      result[sessionType] = {
        min: adjustedMin,
        max: adjustedMax,
      }
    }

    return result as Record<SessionType, { min: number; max: number }>
  }

  /**
   * Suggest session type based on lesson time and complexity
   *
   * Takes into account that complex lessons may need longer sessions
   * even if base lesson time is short
   */
  static suggestSessionTypeForLesson(
    lessonTimeMinutes: number,
    complexity: CourseComplexity
  ): SessionType {
    const adjustedTime = this.adjustSessionDuration(lessonTimeMinutes, complexity)

    // Short: <= 35 min
    if (adjustedTime <= SESSION_TYPE_DURATIONS.short.max_duration_minutes) {
      return 'short'
    }

    // Long: >= 75 min
    if (adjustedTime >= SESSION_TYPE_DURATIONS.long.min_duration_minutes) {
      return 'long'
    }

    // Medium: default
    return 'medium'
  }

  /**
   * Check if a lesson fits in a session type considering complexity
   */
  static lessonFitsInSessionType(
    lessonTimeMinutes: number,
    sessionType: SessionType,
    complexity: CourseComplexity
  ): boolean {
    const adjustedLessonTime = this.adjustSessionDuration(lessonTimeMinutes, complexity)
    const sessionDuration = SESSION_TYPE_DURATIONS[sessionType]

    return adjustedLessonTime <= sessionDuration.max_duration_minutes
  }

  /**
   * Get compatible session types for a lesson considering complexity
   */
  static getCompatibleSessionTypes(
    lessonTimeMinutes: number,
    complexity: CourseComplexity
  ): SessionType[] {
    const compatible: SessionType[] = []

    const adjustedTime = this.adjustSessionDuration(lessonTimeMinutes, complexity)

    if (adjustedTime <= SESSION_TYPE_DURATIONS.short.max_duration_minutes) {
      compatible.push('short')
    }
    if (adjustedTime <= SESSION_TYPE_DURATIONS.medium.max_duration_minutes) {
      compatible.push('medium')
    }
    if (adjustedTime <= SESSION_TYPE_DURATIONS.long.max_duration_minutes) {
      compatible.push('long')
    }

    return compatible
  }

  /**
   * Calculate recommended break time based on session duration and complexity
   *
   * More complex content may need longer breaks for better retention
   */
  static calculateRecommendedBreak(
    sessionDurationMinutes: number,
    complexity: CourseComplexity
  ): number {
    // Base break: 10% of session time
    let breakMinutes = Math.round(sessionDurationMinutes * 0.1)

    // Add complexity factor
    if (complexity.complexity_multiplier > 1.15) {
      // Very complex: add 25% more break time
      breakMinutes = Math.round(breakMinutes * 1.25)
    } else if (complexity.complexity_multiplier > 1.05) {
      // Moderately complex: add 10% more break time
      breakMinutes = Math.round(breakMinutes * 1.1)
    }

    // Minimum 3 minutes, maximum 15 minutes
    return Math.min(Math.max(breakMinutes, 3), 15)
  }

  /**
   * Get complexity description for UI
   */
  static getComplexityDescription(complexity: CourseComplexity): string {
    const multiplier = complexity.complexity_multiplier

    if (multiplier >= 1.3) {
      return 'Muy Alto'
    } else if (multiplier >= 1.15) {
      return 'Alto'
    } else if (multiplier >= 1.05) {
      return 'Medio-Alto'
    } else if (multiplier >= 0.95) {
      return 'Medio'
    } else {
      return 'Bajo'
    }
  }

  /**
   * Get complexity color for UI
   */
  static getComplexityColor(complexity: CourseComplexity): string {
    const multiplier = complexity.complexity_multiplier

    if (multiplier >= 1.3) {
      return 'red' // Very high
    } else if (multiplier >= 1.15) {
      return 'orange' // High
    } else if (multiplier >= 1.05) {
      return 'yellow' // Medium-high
    } else if (multiplier >= 0.95) {
      return 'blue' // Medium
    } else {
      return 'green' // Low
    }
  }

  /**
   * Calculate total study time needed for a course
   * considering all lessons and complexity
   */
  static calculateCourseStudyTime(
    totalLessonTimeMinutes: number,
    complexity: CourseComplexity,
    includeBreaks: boolean = true
  ): number {
    let totalTime = this.adjustSessionDuration(totalLessonTimeMinutes, complexity)

    if (includeBreaks) {
      // Estimate breaks (assume sessions of ~60 min)
      const estimatedSessions = Math.ceil(totalTime / 60)
      const breakTime = estimatedSessions * this.calculateRecommendedBreak(60, complexity)
      totalTime += breakTime
    }

    return Math.round(totalTime)
  }

  /**
   * Batch calculate complexity for multiple courses
   */
  static batchCalculateComplexity(
    courses: Array<{
      course_id: string
      level: CourseLevel
      category: CourseCategory
    }>
  ): Map<string, CourseComplexity> {
    const result = new Map<string, CourseComplexity>()

    for (const course of courses) {
      const complexity = this.calculateComplexity(course.level, course.category)
      result.set(course.id, complexity)
    }

    return result
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Parse course level from string
 */
export function parseCourseLevel(levelString: string): CourseLevel {
  const normalized = levelString.toLowerCase().trim()

  if (normalized.includes('beginner') || normalized.includes('principiante')) {
    return 'beginner'
  } else if (normalized.includes('advanced') || normalized.includes('avanzado')) {
    return 'advanced'
  } else {
    return 'intermediate'
  }
}

/**
 * Parse course category from string or tags
 */
export function parseCourseCategory(
  categoryString: string,
  tags: string[] = []
): CourseCategory {
  const normalized = categoryString.toLowerCase().trim()
  const allTags = [normalized, ...tags.map((t) => t.toLowerCase())]

  // Check for technical
  if (
    allTags.some((t) =>
      ['programming', 'tech', 'software', 'development', 'coding'].includes(t)
    )
  ) {
    return 'technical'
  }

  // Check for data science
  if (
    allTags.some((t) => ['data', 'analytics', 'machine learning', 'ai', 'ml'].includes(t))
  ) {
    return 'data-science'
  }

  // Check for leadership
  if (
    allTags.some((t) => ['leadership', 'management', 'liderazgo', 'gestión'].includes(t))
  ) {
    return 'leadership'
  }

  // Check for practical
  if (allTags.some((t) => ['design', 'creativity', 'art', 'creative'].includes(t))) {
    return 'practical'
  }

  // Check for theoretical
  if (
    allTags.some((t) => ['research', 'academic', 'theory', 'science'].includes(t))
  ) {
    return 'theoretical'
  }

  // Default to conceptual
  return 'conceptual'
}
