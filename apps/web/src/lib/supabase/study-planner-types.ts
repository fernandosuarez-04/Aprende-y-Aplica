/**
 * TypeScript types for Study Planner feature
 * Generated for Phase 0: Lesson Time Estimates System
 *
 * These types extend the existing Supabase database schema
 * to support the AI Study Planner functionality.
 */

// =====================================================
// Lesson Time Estimates
// =====================================================

export interface LessonTimeEstimate {
  id: string
  lesson_id: string

  // Time components (in minutes)
  video_duration_seconds: number
  video_minutes: number // Generated column
  activities_time_minutes: number
  reading_time_minutes: number
  quiz_time_minutes: number
  exercise_time_minutes: number
  link_time_minutes: number
  interactions_time_minutes: number // Default 3

  // Total time (generated column)
  total_time_minutes: number

  // Metadata
  calculated_at: string
  updated_at: string
}

export interface LessonTimeEstimateInsert {
  id?: string
  lesson_id: string
  video_duration_seconds?: number
  activities_time_minutes?: number
  reading_time_minutes?: number
  quiz_time_minutes?: number
  exercise_time_minutes?: number
  link_time_minutes?: number
  interactions_time_minutes?: number
  calculated_at?: string
  updated_at?: string
}

export interface LessonTimeEstimateUpdate {
  lesson_id?: string
  video_duration_seconds?: number
  activities_time_minutes?: number
  reading_time_minutes?: number
  quiz_time_minutes?: number
  exercise_time_minutes?: number
  link_time_minutes?: number
  interactions_time_minutes?: number
  updated_at?: string
}

// =====================================================
// Extended Types for Existing Tables
// =====================================================

/**
 * Extended lesson_activities table with estimated_time_minutes
 */
export interface LessonActivity {
  activity_id: string
  lesson_id: string
  activity_title: string
  activity_type: string
  activity_description?: string
  order_index: number
  estimated_time_minutes?: number | null // NEW FIELD - PHASE 0
  created_at: string
  updated_at: string
}

export interface LessonActivityInsert {
  activity_id?: string
  lesson_id: string
  activity_title: string
  activity_type: string
  activity_description?: string
  order_index?: number
  estimated_time_minutes?: number | null // Must be >= 1 if provided
  created_at?: string
  updated_at?: string
}

export interface LessonActivityUpdate {
  activity_title?: string
  activity_type?: string
  activity_description?: string
  order_index?: number
  estimated_time_minutes?: number | null // Must be >= 1 if provided
  updated_at?: string
}

/**
 * Extended lesson_materials table with estimated_time_minutes
 */
export interface LessonMaterial {
  material_id: string
  lesson_id: string
  title: string
  type: 'reading' | 'quiz' | 'exercise' | 'link' | 'file'
  content?: string
  url?: string
  file_url?: string
  order_index: number
  estimated_time_minutes?: number | null // NEW FIELD - PHASE 0
  created_at: string
  updated_at: string
}

export interface LessonMaterialInsert {
  material_id?: string
  lesson_id: string
  title: string
  type: 'reading' | 'quiz' | 'exercise' | 'link' | 'file'
  content?: string
  url?: string
  file_url?: string
  order_index?: number
  estimated_time_minutes?: number | null // Must be >= 1 if provided
  created_at?: string
  updated_at?: string
}

export interface LessonMaterialUpdate {
  title?: string
  type?: 'reading' | 'quiz' | 'exercise' | 'link' | 'file'
  content?: string
  url?: string
  file_url?: string
  order_index?: number
  estimated_time_minutes?: number | null // Must be >= 1 if provided
  updated_at?: string
}

// =====================================================
// View Types
// =====================================================

/**
 * View: v_incomplete_lesson_times
 * Shows lessons with incomplete time estimates
 */
export interface IncompleteLessonTime {
  course_id: string
  course_title: string
  lesson_id: string
  lesson_title: string
  order_index: number
  activities_missing_time: number
  materials_missing_time: number
  total_incomplete_items: number
  current_total_time: number | null
}

// =====================================================
// Helper Types
// =====================================================

/**
 * Complete lesson with all time components
 */
export interface LessonWithTimeEstimate {
  lesson_id: string
  lesson_title: string
  order_index: number
  duration_seconds: number | null
  time_estimate: LessonTimeEstimate | null
  activities: LessonActivity[]
  materials: LessonMaterial[]
}

/**
 * Time validation result
 */
export interface TimeValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  totalTimeMinutes: number | null
  missingActivityTimes: string[] // Activity IDs
  missingMaterialTimes: string[] // Material IDs
}

/**
 * Lesson completeness status
 */
export interface LessonCompletenessStatus {
  lesson_id: string
  is_complete: boolean
  has_video_time: boolean
  activities_count: number
  activities_with_time: number
  materials_count: number
  materials_with_time: number
  total_time_minutes: number | null
}

// =====================================================
// API Request/Response Types
// =====================================================

/**
 * Request to update activity time estimate
 */
export interface UpdateActivityTimeRequest {
  activity_id: string
  estimated_time_minutes: number // Must be >= 1
}

/**
 * Request to update material time estimate
 */
export interface UpdateMaterialTimeRequest {
  material_id: string
  estimated_time_minutes: number // Must be >= 1
}

/**
 * Response with lesson time completeness
 */
export interface LessonTimeCompletenessResponse {
  lesson_id: string
  is_complete: boolean
  can_publish: boolean
  total_time_minutes: number | null
  incomplete_items: {
    activities: Array<{
      activity_id: string
      activity_title: string
    }>
    materials: Array<{
      material_id: string
      title: string
      type: string
    }>
  }
}

// =====================================================
// Constants
// =====================================================

/**
 * Minimum time in minutes for any activity or material
 */
export const MIN_ESTIMATED_TIME_MINUTES = 1

/**
 * Default interaction time in minutes (system-calculated)
 */
export const DEFAULT_INTERACTIONS_TIME_MINUTES = 3

/**
 * Material types that require time estimates
 */
export const MATERIAL_TYPES_REQUIRING_TIME = [
  'reading',
  'quiz',
  'exercise',
  'link',
] as const

/**
 * Activity types that require time estimates
 */
export const ACTIVITY_TYPES_REQUIRING_TIME = [
  'quiz',
  'exercise',
  'assignment',
  'discussion',
  'practice',
] as const

// =====================================================
// Type Guards
// =====================================================

/**
 * Check if a lesson activity has a valid time estimate
 */
export function hasValidActivityTime(activity: LessonActivity): boolean {
  return (
    activity.estimated_time_minutes !== null &&
    activity.estimated_time_minutes !== undefined &&
    activity.estimated_time_minutes >= MIN_ESTIMATED_TIME_MINUTES
  )
}

/**
 * Check if a lesson material has a valid time estimate
 */
export function hasValidMaterialTime(material: LessonMaterial): boolean {
  return (
    material.estimated_time_minutes !== null &&
    material.estimated_time_minutes !== undefined &&
    material.estimated_time_minutes >= MIN_ESTIMATED_TIME_MINUTES
  )
}

/**
 * Check if a lesson is ready for study planner (all times complete)
 */
export function isLessonReadyForPlanner(
  lesson: LessonWithTimeEstimate
): boolean {
  const allActivitiesHaveTime = lesson.activities.every(hasValidActivityTime)
  const allMaterialsHaveTime = lesson.materials.every(hasValidMaterialTime)
  const hasTimeEstimate = lesson.time_estimate !== null

  return allActivitiesHaveTime && allMaterialsHaveTime && hasTimeEstimate
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Calculate total time for a lesson manually
 */
export function calculateLessonTime(lesson: LessonWithTimeEstimate): number {
  const videoMinutes = (lesson.duration_seconds || 0) / 60

  const activitiesTime = lesson.activities.reduce(
    (sum, activity) => sum + (activity.estimated_time_minutes || 0),
    0
  )

  const materialsTime = lesson.materials.reduce(
    (sum, material) => sum + (material.estimated_time_minutes || 0),
    0
  )

  const interactionsTime = DEFAULT_INTERACTIONS_TIME_MINUTES

  return Math.round((videoMinutes + activitiesTime + materialsTime + interactionsTime) * 100) / 100
}

/**
 * Validate time estimate value
 */
export function validateTimeEstimate(minutes: number): {
  isValid: boolean
  error?: string
} {
  if (!Number.isInteger(minutes)) {
    return {
      isValid: false,
      error: 'Time estimate must be a whole number',
    }
  }

  if (minutes < MIN_ESTIMATED_TIME_MINUTES) {
    return {
      isValid: false,
      error: `Time estimate must be at least ${MIN_ESTIMATED_TIME_MINUTES} minute`,
    }
  }

  if (minutes > 480) { // 8 hours max
    return {
      isValid: false,
      error: 'Time estimate cannot exceed 480 minutes (8 hours)',
    }
  }

  return { isValid: true }
}

/**
 * Format time in minutes to human-readable string
 */
export function formatTimeEstimate(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}min`
}

// =====================================================
// PHASE 1: Session Types, Plans, and Complexity
// =====================================================

/**
 * Session type options
 */
export type SessionType = 'short' | 'medium' | 'long'

/**
 * Generation mode for study plans
 */
export type GenerationMode = 'manual' | 'ai_generated'

/**
 * Course level options
 */
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

/**
 * Course category options
 */
export type CourseCategory =
  | 'technical'
  | 'data-science'
  | 'conceptual'
  | 'leadership'
  | 'practical'
  | 'creativity'
  | 'theoretical'

/**
 * Session type duration range
 */
export interface SessionTypeDuration {
  session_type: SessionType
  min_duration_minutes: number
  max_duration_minutes: number
}

/**
 * Session type durations (constants)
 */
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

/**
 * Course complexity metadata
 */
export interface CourseComplexity {
  level: CourseLevel
  category: CourseCategory
  complexity_multiplier: number // Calculated value
}

/**
 * AI generation metadata stored in study_plans
 */
export interface AIGenerationMetadata {
  role?: string // Professional role at generation time
  company_size?: string // Company size category
  courses_complexity?: Record<string, CourseComplexity> // courseId -> complexity
  algorithm_version?: string // Version of AI algorithm used
  generation_timestamp?: string // ISO timestamp
  user_preferences?: {
    preferred_session_type?: SessionType
    daily_minutes?: number
    days_per_week?: number
  }
}

/**
 * Extended study_preferences with session type
 */
export interface StudyPreferences {
  preference_id: string
  user_id: string
  preferred_session_type: SessionType // NEW - Phase 1
  daily_study_minutes?: number
  preferred_days?: string[] // ['monday', 'wednesday', 'friday']
  preferred_times?: string[] // ['morning', 'evening']
  break_duration_minutes?: number
  created_at: string
  updated_at: string
}

export interface StudyPreferencesInsert {
  preference_id?: string
  user_id: string
  preferred_session_type?: SessionType
  daily_study_minutes?: number
  preferred_days?: string[]
  preferred_times?: string[]
  break_duration_minutes?: number
  created_at?: string
  updated_at?: string
}

export interface StudyPreferencesUpdate {
  preferred_session_type?: SessionType
  daily_study_minutes?: number
  preferred_days?: string[]
  preferred_times?: string[]
  break_duration_minutes?: number
  updated_at?: string
}

/**
 * Extended study_plans with generation mode and metadata
 */
export interface StudyPlan {
  plan_id: string
  user_id: string
  plan_name: string
  generation_mode: GenerationMode // NEW - Phase 1
  ai_generation_metadata: AIGenerationMetadata // NEW - Phase 1
  preferred_session_type: SessionType // NEW - Phase 1
  start_date: string
  end_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StudyPlanInsert {
  plan_id?: string
  user_id: string
  plan_name: string
  generation_mode?: GenerationMode
  ai_generation_metadata?: AIGenerationMetadata
  preferred_session_type?: SessionType
  start_date: string
  end_date?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface StudyPlanUpdate {
  plan_name?: string
  generation_mode?: GenerationMode
  ai_generation_metadata?: AIGenerationMetadata
  preferred_session_type?: SessionType
  end_date?: string
  is_active?: boolean
  updated_at?: string
}

/**
 * Extended study_sessions with lesson tracking and complexity
 */
export interface StudySession {
  session_id: string
  plan_id: string
  user_id: string
  course_id?: string
  lesson_id?: string // NEW - Phase 1
  start_time: string
  end_time: string
  duration_minutes: number
  is_ai_generated: boolean // NEW - Phase 1
  streak_day?: number // NEW - Phase 1
  lesson_min_time_minutes?: number // NEW - Phase 1
  session_type: SessionType // NEW - Phase 1
  course_complexity: CourseComplexity // NEW - Phase 1 (JSONB)
  completed: boolean
  completion_time?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface StudySessionInsert {
  session_id?: string
  plan_id: string
  user_id: string
  course_id?: string
  lesson_id?: string
  start_time: string
  end_time: string
  duration_minutes: number
  is_ai_generated?: boolean
  streak_day?: number
  lesson_min_time_minutes?: number
  session_type?: SessionType
  course_complexity?: CourseComplexity
  completed?: boolean
  completion_time?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface StudySessionUpdate {
  start_time?: string
  end_time?: string
  duration_minutes?: number
  lesson_id?: string
  lesson_min_time_minutes?: number
  session_type?: SessionType
  course_complexity?: CourseComplexity
  completed?: boolean
  completion_time?: string
  notes?: string
  updated_at?: string
}

// =====================================================
// View Types - Phase 1
// =====================================================

/**
 * AI-generated plan with statistics
 */
export interface AIGeneratedPlanView {
  plan_id: string
  user_id: string
  plan_name: string
  created_at: string
  preferred_session_type: SessionType
  ai_generation_metadata: AIGenerationMetadata
  total_sessions: number
  completed_sessions: number
  completion_percentage: number
}

/**
 * Session type distribution analytics
 */
export interface SessionTypeDistribution {
  session_type: SessionType
  session_count: number
  unique_users: number
  completion_rate: number
  avg_duration_minutes: number
}

/**
 * Lesson compatibility with session types
 */
export interface LessonSessionTypeCompatibility {
  lesson_id: string
  lesson_title: string
  course_title: string
  total_time_minutes: number
  compatible_session_types: SessionType[]
}

// =====================================================
// Helper Functions - Phase 1
// =====================================================

/**
 * Get duration range for a session type
 */
export function getSessionTypeDuration(sessionType: SessionType): SessionTypeDuration {
  return SESSION_TYPE_DURATIONS[sessionType]
}

/**
 * Check if a lesson time fits in a session type
 */
export function lessonFitsInSessionType(
  lessonTimeMinutes: number,
  sessionType: SessionType
): boolean {
  const duration = getSessionTypeDuration(sessionType)
  return lessonTimeMinutes <= duration.max_duration_minutes
}

/**
 * Get compatible session types for a lesson
 */
export function getCompatibleSessionTypes(lessonTimeMinutes: number): SessionType[] {
  const compatible: SessionType[] = []

  if (lessonTimeMinutes <= SESSION_TYPE_DURATIONS.short.max_duration_minutes) {
    compatible.push('short', 'medium', 'long')
  } else if (lessonTimeMinutes <= SESSION_TYPE_DURATIONS.medium.max_duration_minutes) {
    compatible.push('medium', 'long')
  } else if (lessonTimeMinutes <= SESSION_TYPE_DURATIONS.long.max_duration_minutes) {
    compatible.push('long')
  }
  // If lesson is too long (> 120 min), return empty array

  return compatible
}

/**
 * Calculate course complexity multiplier
 * Matches the Supabase function logic
 */
export function calculateCourseComplexity(
  level: CourseLevel,
  category: CourseCategory
): number {
  // Level multiplier
  const levelMultiplier: Record<CourseLevel, number> = {
    beginner: 0.9,
    intermediate: 1.0,
    advanced: 1.2,
  }

  // Category additional multiplier (as decimal)
  const categoryAddition: Record<CourseCategory, number> = {
    technical: 0.15,
    'data-science': 0.15,
    conceptual: 0.10,
    leadership: 0.10,
    practical: 0.12,
    creativity: 0.12,
    theoretical: 0.20,
  }

  const baseLevelMultiplier = levelMultiplier[level] || 1.0
  const categoryBonus = categoryAddition[category] || 0.10

  const finalMultiplier = baseLevelMultiplier * (1.0 + categoryBonus)

  return Math.round(finalMultiplier * 1000) / 1000 // Round to 3 decimals
}

/**
 * Create course complexity object
 */
export function createCourseComplexity(
  level: CourseLevel,
  category: CourseCategory
): CourseComplexity {
  return {
    level,
    category,
    complexity_multiplier: calculateCourseComplexity(level, category),
  }
}

/**
 * Adjust session duration based on complexity
 */
export function adjustSessionDurationForComplexity(
  baseDurationMinutes: number,
  complexity: CourseComplexity
): number {
  const adjusted = baseDurationMinutes * complexity.complexity_multiplier
  return Math.round(adjusted)
}

/**
 * Format session type to display text
 */
export function formatSessionType(sessionType: SessionType): string {
  const durations = getSessionTypeDuration(sessionType)

  const labels: Record<SessionType, string> = {
    short: 'Corta',
    medium: 'Media',
    long: 'Larga',
  }

  return `${labels[sessionType]} (${durations.min_duration_minutes}-${durations.max_duration_minutes} min)`
}

/**
 * Get session type icon/emoji
 */
export function getSessionTypeIcon(sessionType: SessionType): string {
  const icons: Record<SessionType, string> = {
    short: '⚡',
    medium: '📖',
    long: '🎯',
  }

  return icons[sessionType]
}

/**
 * Validate session duration for type
 */
export function validateSessionDuration(
  durationMinutes: number,
  sessionType: SessionType
): { isValid: boolean; error?: string } {
  const range = getSessionTypeDuration(sessionType)

  if (durationMinutes < range.min_duration_minutes) {
    return {
      isValid: false,
      error: `La duración mínima para sesiones ${formatSessionType(sessionType)} es ${range.min_duration_minutes} minutos`,
    }
  }

  if (durationMinutes > range.max_duration_minutes) {
    return {
      isValid: false,
      error: `La duración máxima para sesiones ${formatSessionType(sessionType)} es ${range.max_duration_minutes} minutos`,
    }
  }

  return { isValid: true }
}
