/**
 * Study Planner Types (Backend)
 * Core types for study planner system
 */

// =====================================================
// Session Types
// =====================================================

export type SessionType = 'short' | 'medium' | 'long'
export type GenerationMode = 'manual' | 'ai_generated'

export interface SessionTypeDuration {
  session_type: SessionType
  min_duration_minutes: number
  max_duration_minutes: number
}

export const SESSION_TYPE_DURATIONS: Record<SessionType, SessionTypeDuration> = {
  short: {
    session_type: 'short',
    min_duration_minutes: 20,
    max_duration_minutes: 35,
  },
  medium: {
    session_type: 'medium',
    min_duration_minutes: 45,
    max_duration_minutes: 60,
  },
  long: {
    session_type: 'long',
    min_duration_minutes: 75,
    max_duration_minutes: 120,
  },
}

// =====================================================
// Course Complexity
// =====================================================

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'
export type CourseCategory =
  | 'technical'
  | 'data-science'
  | 'conceptual'
  | 'leadership'
  | 'practical'
  | 'creativity'
  | 'theoretical'

export interface CourseComplexity {
  level: CourseLevel
  category: CourseCategory
  complexity_multiplier: number
}

export const LEVEL_MULTIPLIERS: Record<CourseLevel, number> = {
  beginner: 0.9,
  intermediate: 1.0,
  advanced: 1.2,
}

export const CATEGORY_MULTIPLIERS: Record<CourseCategory, number> = {
  technical: 0.15,
  'data-science': 0.15,
  conceptual: 0.1,
  leadership: 0.1,
  practical: 0.12,
  creativity: 0.12,
  theoretical: 0.2,
}

/**
 * Create course complexity object
 */
export function createCourseComplexity(
  level: CourseLevel,
  category: CourseCategory
): CourseComplexity {
  const levelMultiplier = LEVEL_MULTIPLIERS[level] || 1.0
  const categoryBonus = CATEGORY_MULTIPLIERS[category] || 0.1
  const complexityMultiplier = levelMultiplier * (1.0 + categoryBonus)

  return {
    level,
    category,
    complexity_multiplier: Math.round(complexityMultiplier * 1000) / 1000,
  }
}
