/**
 * Manual Wizard Types (Backend)
 * Shared types for manual plan configuration
 */

// =====================================================
// Core Types
// =====================================================

export type SessionType = 'short' | 'medium' | 'long'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night'

export const SESSION_TYPE_DURATIONS: Record<SessionType, { min_duration_minutes: number; max_duration_minutes: number }> = {
  short: { min_duration_minutes: 20, max_duration_minutes: 35 },
  medium: { min_duration_minutes: 45, max_duration_minutes: 60 },
  long: { min_duration_minutes: 75, max_duration_minutes: 120 },
}

export const TIME_SLOT_RANGES: Record<TimeSlot, { start: string; end: string }> = {
  morning: { start: '06:00', end: '12:00' },
  afternoon: { start: '12:00', end: '18:00' },
  evening: { start: '18:00', end: '22:00' },
  night: { start: '22:00', end: '06:00' },
}

// =====================================================
// Course Selection
// =====================================================

export interface SelectedCourse {
  course_id: string
  course_title: string
  lessons_to_include: string[] // lesson IDs
  total_time_minutes: number
  complexity_multiplier: number
}

// =====================================================
// Schedule Configuration
// =====================================================

export interface DaySchedule {
  day: DayOfWeek
  enabled: boolean
  time_slots: TimeSlot[]
  max_sessions: number
}

export interface ScheduleConfiguration {
  days: DaySchedule[]
  session_duration_minutes: number
  break_duration_minutes: number
  start_date: Date
  end_date?: Date
}

// =====================================================
// Validation
// =====================================================

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  is_valid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

export interface LessonTimeValidation {
  lesson_id: string
  lesson_title: string
  required_time_minutes: number
  session_duration_minutes: number
  fits: boolean
  overflow_minutes?: number
}

// =====================================================
// Plan Preview
// =====================================================

export interface PreviewSession {
  day: DayOfWeek
  date: Date
  time_slot: TimeSlot
  course_id: string
  course_title: string
  lesson_id: string
  lesson_title: string
  duration_minutes: number
  start_time: string
  end_time: string
}

export interface PlanPreview {
  plan_name: string
  total_sessions: number
  total_study_hours: number
  estimated_completion_date: Date
  sessions_by_week: Map<number, PreviewSession[]>
  sessions_by_course: Map<string, PreviewSession[]>
}

// =====================================================
// API Request/Response
// =====================================================

export interface CreateManualPlanRequest {
  plan_name: string
  selected_courses: SelectedCourse[]
  session_type: SessionType
  schedule: ScheduleConfiguration
  user_preferences?: {
    preferred_session_type?: SessionType
    daily_study_minutes?: number
  }
}

export interface CreateManualPlanResponse {
  success: boolean
  plan_id: string
  sessions_created: number
  message: string
  errors?: string[]
}

export interface ValidateManualPlanRequest {
  selected_courses: SelectedCourse[]
  session_type: SessionType
  schedule: ScheduleConfiguration
}

export interface ValidateManualPlanResponse {
  is_valid: boolean
  validation_result: ValidationResult
  lesson_validations: LessonTimeValidation[]
  suggested_session_duration?: number
}
