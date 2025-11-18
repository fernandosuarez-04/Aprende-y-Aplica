/**
 * Manual Wizard Types
 * Types for manual plan configuration wizard
 */

import { SessionType } from '@/lib/supabase/study-planner-types'

// =====================================================
// Wizard Steps
// =====================================================

export type WizardStep =
  | 'mode-selection'      // Select manual vs AI
  | 'course-selection'    // Select courses
  | 'session-type'        // Choose session type
  | 'schedule'            // Configure days and times
  | 'preview'             // Review and confirm

// =====================================================
// Course Selection
// =====================================================

export interface CourseForSelection {
  id: string
  title: string
  level: string
  category: string
  total_lessons: number
  completed_lessons: number
  estimated_total_time_minutes: number
  thumbnail_url?: string
  complexity_multiplier?: number
}

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

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night'

export interface DaySchedule {
  day: DayOfWeek
  enabled: boolean
  time_slots: TimeSlot[]
  max_sessions: number // Max sessions for this day
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
  overflow_minutes?: number // How many minutes over if doesn't fit
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
  start_time: string // HH:MM format
  end_time: string // HH:MM format
}

export interface PlanPreview {
  plan_name: string
  total_sessions: number
  total_study_hours: number
  estimated_completion_date: Date
  sessions_by_week: Map<number, PreviewSession[]> // week number -> sessions
  sessions_by_course: Map<string, PreviewSession[]> // course_id -> sessions
}

// =====================================================
// Wizard State
// =====================================================

export interface ManualWizardState {
  current_step: WizardStep

  // Step 1: Mode Selection (handled in parent)
  mode: 'manual' | 'ai'

  // Step 2: Course Selection
  selected_courses: SelectedCourse[]

  // Step 3: Session Type
  session_type: SessionType

  // Step 4: Schedule
  schedule: ScheduleConfiguration

  // Step 5: Preview
  preview?: PlanPreview

  // Validation
  validation: ValidationResult

  // UI state
  is_loading: boolean
  errors: string[]
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

// =====================================================
// Helper Functions
// =====================================================

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Mañana (6:00 - 12:00)',
  afternoon: 'Tarde (12:00 - 18:00)',
  evening: 'Noche (18:00 - 22:00)',
  night: 'Madrugada (22:00 - 6:00)',
}

export const TIME_SLOT_RANGES: Record<TimeSlot, { start: string; end: string }> = {
  morning: { start: '06:00', end: '12:00' },
  afternoon: { start: '12:00', end: '18:00' },
  evening: { start: '18:00', end: '22:00' },
  night: { start: '22:00', end: '06:00' },
}

export function formatDayOfWeek(day: DayOfWeek): string {
  return DAY_LABELS[day]
}

export function formatTimeSlot(slot: TimeSlot): string {
  return TIME_SLOT_LABELS[slot]
}

export function getDefaultSchedule(): ScheduleConfiguration {
  return {
    days: [
      { day: 'monday', enabled: true, time_slots: ['evening'], max_sessions: 1 },
      { day: 'tuesday', enabled: true, time_slots: ['evening'], max_sessions: 1 },
      { day: 'wednesday', enabled: true, time_slots: ['evening'], max_sessions: 1 },
      { day: 'thursday', enabled: false, time_slots: [], max_sessions: 0 },
      { day: 'friday', enabled: true, time_slots: ['evening'], max_sessions: 1 },
      { day: 'saturday', enabled: false, time_slots: [], max_sessions: 0 },
      { day: 'sunday', enabled: false, time_slots: [], max_sessions: 0 },
    ],
    session_duration_minutes: 60,
    break_duration_minutes: 10,
    start_date: new Date(),
    end_date: undefined,
  }
}

export function getDefaultWizardState(): ManualWizardState {
  return {
    current_step: 'mode-selection',
    mode: 'manual',
    selected_courses: [],
    session_type: 'medium',
    schedule: getDefaultSchedule(),
    validation: {
      is_valid: false,
      errors: [],
      warnings: [],
    },
    is_loading: false,
    errors: [],
  }
}
