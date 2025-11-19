/**
 * AI Wizard Types
 * Types for AI-powered plan generation wizard
 */

import { SessionType } from '@/lib/supabase/study-planner-types'
import { DayOfWeek, TimeSlot, PreviewSession } from './manual-wizard.types'

// =====================================================
// Wizard Steps
// =====================================================

export type AIWizardStep =
  | 'goals'           // Define learning goals
  | 'availability'    // Set availability (auto-calculated + manual override)
  | 'preferences'     // Learning preferences
  | 'courses'         // Course selection (optional - can select all)
  | 'preview'         // Review AI-generated plan

// =====================================================
// Learning Goals
// =====================================================

export type LearningGoal =
  | 'career_advancement'      // Avance profesional
  | 'skill_acquisition'       // Adquisición de habilidades
  | 'certification'           // Preparación para certificación
  | 'personal_growth'         // Crecimiento personal
  | 'project_completion'      // Completar proyecto específico
  | 'exploration'             // Exploración y aprendizaje general

export type LearningPace =
  | 'relaxed'     // Relajado (prioriza sostenibilidad)
  | 'moderate'    // Moderado (balanceado)
  | 'intensive'   // Intensivo (máximo progreso)

export type PriorityFocus =
  | 'completion'  // Completar cursos lo antes posible
  | 'retention'   // Maximizar retención (spaced repetition)
  | 'balanced'    // Balance entre ambos

export interface GoalsConfiguration {
  primary_goal: LearningGoal
  target_completion_date?: Date  // Optional deadline
  learning_pace: LearningPace
  priority_focus: PriorityFocus
  daily_study_goal_minutes?: number  // Optional override
}

// =====================================================
// Availability Configuration
// =====================================================

export interface AIAvailabilityConfig {
  // Auto-calculated from user profile
  auto_calculated: {
    role: string
    company_size: string
    suggested_daily_minutes_min: number
    suggested_daily_minutes_max: number
    suggested_days_per_week: number[]
    preferred_time_slots: TimeSlot[]
  }

  // User overrides (optional)
  manual_override?: {
    daily_minutes: number
    study_days: DayOfWeek[]
    time_slots_per_day: Record<DayOfWeek, TimeSlot[]>
  }

  // Final computed availability
  final: {
    daily_minutes: number
    study_days: DayOfWeek[]
    time_slots: Record<DayOfWeek, TimeSlot[]>
  }
}

// =====================================================
// Learning Preferences
// =====================================================

export type ReviewStrategy =
  | 'spaced_repetition'    // Repetición espaciada (óptima retención)
  | 'massed_practice'      // Práctica masiva (velocidad)
  | 'mixed'                // Combinación

export type ContentOrdering =
  | 'sequential'           // Secuencial (orden del curso)
  | 'interleaved'          // Intercalado (alterna entre cursos)
  | 'difficulty_based'     // Basado en dificultad
  | 'ai_optimized'         // IA decide óptimo

export interface PreferencesConfiguration {
  session_type_preference: SessionType
  review_strategy: ReviewStrategy
  content_ordering: ContentOrdering

  // Break preferences
  enable_pomodoro: boolean
  pomodoro_work_minutes?: number
  pomodoro_break_minutes?: number

  // Flexibility
  allow_session_rescheduling: boolean

  // Notifications
  enable_reminders: boolean
  reminder_minutes_before?: number
}

// =====================================================
// Course Selection
// =====================================================

export interface AICourseSelection {
  course_id: string
  course_title: string
  priority: 'high' | 'medium' | 'low'  // User-defined priority
  include_all_lessons: boolean
  specific_lessons?: string[]  // If not all lessons
}

// =====================================================
// AI Generation Metadata
// =====================================================

export interface AIGenerationMetadata {
  algorithm_version: string
  generation_timestamp: string

  goals: GoalsConfiguration
  availability: AIAvailabilityConfig
  preferences: PreferencesConfiguration

  // Optimization scores
  scores: {
    retention_score: number      // 0-100 (how well optimized for retention)
    completion_score: number      // 0-100 (how well optimized for completion)
    balance_score: number          // 0-100 (overall balance)
  }

  // Applied techniques
  techniques_applied: string[]  // e.g., ['spaced_repetition', 'interleaving', 'pomodoro']

  // Reasoning (optional, for transparency)
  reasoning?: string
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

  // AI-specific metrics
  ai_metadata: AIGenerationMetadata

  // Optimization insights
  insights: AIOptimizationInsight[]
}

export interface AIOptimizationInsight {
  type: 'info' | 'tip' | 'warning'
  category: 'retention' | 'completion' | 'balance' | 'scheduling'
  message: string
  icon?: string
}

// =====================================================
// Wizard State
// =====================================================

export interface AIWizardState {
  current_step: AIWizardStep

  // Step 1: Goals
  goals: GoalsConfiguration

  // Step 2: Availability
  availability: AIAvailabilityConfig

  // Step 3: Preferences
  preferences: PreferencesConfiguration

  // Step 4: Courses
  selected_courses: AICourseSelection[]

  // Step 5: Preview
  preview?: AIPlanPreview

  // UI state
  is_loading: boolean
  is_generating: boolean
  errors: string[]
}

// =====================================================
// API Request/Response
// =====================================================

export interface GenerateAIPlanRequest {
  goals: GoalsConfiguration
  availability: AIAvailabilityConfig['final']
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
  availability: AIAvailabilityConfig['final']
  preferences: PreferencesConfiguration
  selected_courses: AICourseSelection[]
}

export interface GenerateAIPreviewResponse {
  success: boolean
  preview: AIPlanPreview
  errors?: string[]
}

// =====================================================
// Helper Functions & Constants
// =====================================================

export const LEARNING_GOAL_LABELS: Record<LearningGoal, string> = {
  career_advancement: 'Avance Profesional',
  skill_acquisition: 'Adquisición de Habilidades',
  certification: 'Preparación para Certificación',
  personal_growth: 'Crecimiento Personal',
  project_completion: 'Completar Proyecto',
  exploration: 'Exploración General',
}

export const LEARNING_GOAL_DESCRIPTIONS: Record<LearningGoal, string> = {
  career_advancement: 'Avanzar en tu carrera profesional con nuevas habilidades',
  skill_acquisition: 'Dominar habilidades específicas rápidamente',
  certification: 'Prepararte para exámenes y certificaciones',
  personal_growth: 'Aprender por desarrollo personal',
  project_completion: 'Completar un proyecto o meta específica',
  exploration: 'Explorar nuevos temas y áreas de interés',
}

export const LEARNING_PACE_LABELS: Record<LearningPace, string> = {
  relaxed: 'Relajado',
  moderate: 'Moderado',
  intensive: 'Intensivo',
}

export const LEARNING_PACE_DESCRIPTIONS: Record<LearningPace, string> = {
  relaxed: '2-3 sesiones/semana · Sostenible a largo plazo',
  moderate: '3-5 sesiones/semana · Balance ideal',
  intensive: '5-7 sesiones/semana · Progreso máximo',
}

export const PRIORITY_FOCUS_LABELS: Record<PriorityFocus, string> = {
  completion: 'Velocidad de Completación',
  retention: 'Retención a Largo Plazo',
  balanced: 'Balanceado',
}

export const PRIORITY_FOCUS_DESCRIPTIONS: Record<PriorityFocus, string> = {
  completion: 'Completar cursos lo más rápido posible',
  retention: 'Maximizar retención con repetición espaciada',
  balanced: 'Balance entre velocidad y retención',
}

export const REVIEW_STRATEGY_LABELS: Record<ReviewStrategy, string> = {
  spaced_repetition: 'Repetición Espaciada',
  massed_practice: 'Práctica Masiva',
  mixed: 'Mixta',
}

export const CONTENT_ORDERING_LABELS: Record<ContentOrdering, string> = {
  sequential: 'Secuencial',
  interleaved: 'Intercalado',
  difficulty_based: 'Por Dificultad',
  ai_optimized: 'IA Optimizada',
}

/**
 * Get default AI wizard state
 */
export function getDefaultAIWizardState(): AIWizardState {
  return {
    current_step: 'goals',
    goals: {
      primary_goal: 'skill_acquisition',
      learning_pace: 'moderate',
      priority_focus: 'balanced',
    },
    availability: {
      auto_calculated: {
        role: '',
        company_size: '',
        suggested_daily_minutes_min: 45,
        suggested_daily_minutes_max: 60,
        suggested_days_per_week: [1, 2, 3, 4, 5], // Mon-Fri
        preferred_time_slots: ['evening'],
      },
      final: {
        daily_minutes: 60,
        study_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        time_slots: {
          monday: ['evening'],
          tuesday: ['evening'],
          wednesday: ['evening'],
          thursday: ['evening'],
          friday: ['evening'],
          saturday: [],
          sunday: [],
        },
      },
    },
    preferences: {
      session_type_preference: 'medium',
      review_strategy: 'spaced_repetition',
      content_ordering: 'ai_optimized',
      enable_pomodoro: true,
      pomodoro_work_minutes: 25,
      pomodoro_break_minutes: 5,
      allow_session_rescheduling: true,
      enable_reminders: true,
      reminder_minutes_before: 15,
    },
    selected_courses: [],
    is_loading: false,
    is_generating: false,
    errors: [],
  }
}
