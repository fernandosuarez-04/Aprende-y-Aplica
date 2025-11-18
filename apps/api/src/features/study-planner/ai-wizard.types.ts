/**
 * AI Wizard Types (Backend)
 * Shared types for AI-powered plan generation
 */

import { SessionType, CourseComplexity } from './study-planner-types'

// =====================================================
// Core Types
// =====================================================

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night'

export type LearningGoal =
  | 'career_advancement'
  | 'skill_acquisition'
  | 'certification'
  | 'personal_growth'
  | 'project_completion'
  | 'exploration'

export type LearningPace = 'relaxed' | 'moderate' | 'intensive'
export type PriorityFocus = 'completion' | 'retention' | 'balanced'
export type ReviewStrategy = 'spaced_repetition' | 'massed_practice' | 'mixed'
export type ContentOrdering = 'sequential' | 'interleaved' | 'difficulty_based' | 'ai_optimized'

// =====================================================
// Goals Configuration
// =====================================================

export interface GoalsConfiguration {
  primary_goal: LearningGoal
  target_completion_date?: Date
  learning_pace: LearningPace
  priority_focus: PriorityFocus
  daily_study_goal_minutes?: number
}

// =====================================================
// Availability Configuration
// =====================================================

export interface AIAvailabilityFinal {
  daily_minutes: number
  study_days: DayOfWeek[]
  time_slots: Record<DayOfWeek, TimeSlot[]>
}

// =====================================================
// Preferences Configuration
// =====================================================

export interface PreferencesConfiguration {
  session_type_preference: SessionType
  review_strategy: ReviewStrategy
  content_ordering: ContentOrdering
  enable_pomodoro: boolean
  pomodoro_work_minutes?: number
  pomodoro_break_minutes?: number
  allow_session_rescheduling: boolean
  enable_reminders: boolean
  reminder_minutes_before?: number
}

// =====================================================
// Course Selection
// =====================================================

export interface AICourseSelection {
  course_id: string
  course_title: string
  priority: 'high' | 'medium' | 'low'
  include_all_lessons: boolean
  specific_lessons?: string[]
}

// =====================================================
// AI Generation Metadata
// =====================================================

export interface AIGenerationMetadata {
  algorithm_version: string
  generation_timestamp: string
  goals: GoalsConfiguration
  availability: AIAvailabilityFinal
  preferences: PreferencesConfiguration
  scores: {
    retention_score: number
    completion_score: number
    balance_score: number
  }
  techniques_applied: string[]
  reasoning?: string
}

// =====================================================
// Preview Session
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

// =====================================================
// AI Plan Preview
// =====================================================

export interface AIPlanPreview {
  plan_name: string
  total_sessions: number
  total_study_hours: number
  estimated_completion_date: Date
  sessions_by_week: Map<number, PreviewSession[]>
  sessions_by_course: Map<string, PreviewSession[]>
  ai_metadata: AIGenerationMetadata
  insights: AIOptimizationInsight[]
}

export interface AIOptimizationInsight {
  type: 'info' | 'tip' | 'warning'
  category: 'retention' | 'completion' | 'balance' | 'scheduling'
  message: string
  icon?: string
}

// =====================================================
// API Request/Response
// =====================================================

export interface GenerateAIPlanRequest {
  goals: GoalsConfiguration
  availability: AIAvailabilityFinal
  preferences: PreferencesConfiguration
  selected_courses: AICourseSelection[]
}

export interface GenerateAIPlanResponse {
  success: boolean
  plan_id: string
  sessions_created: number
  ai_metadata: AIGenerationMetadata
  message: string
  errors?: string[]
}

export interface GenerateAIPreviewRequest {
  goals: GoalsConfiguration
  availability: AIAvailabilityFinal
  preferences: PreferencesConfiguration
  selected_courses: AICourseSelection[]
}

export interface GenerateAIPreviewResponse {
  success: boolean
  preview: AIPlanPreview
  errors?: string[]
}
