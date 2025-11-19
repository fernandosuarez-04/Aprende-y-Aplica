/**
 * Study Planner Backend Types
 * Types specific to backend services
 */

// =====================================================
// Session Types
// =====================================================

export type SessionType = 'short' | 'medium' | 'long'

export type GenerationMode = 'manual' | 'ai_generated'

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

export type CourseCategory =
  | 'technical'
  | 'data-science'
  | 'conceptual'
  | 'leadership'
  | 'practical'
  | 'creativity'
  | 'theoretical'

// =====================================================
// User Profile Types
// =====================================================

/**
 * Professional roles (from user_perfil.rol_id)
 */
export type ProfessionalRole =
  // C-Level
  | 'ceo'
  | 'cmo'
  | 'cto'
  | 'cfo'
  // Directors
  | 'hr_director'
  | 'sales_director'
  | 'operations_director'
  | 'finance_director'
  | 'purchasing_director'
  | 'government_director'
  // Middle Management
  | 'marketing_manager'
  | 'it_manager'
  | 'sales_manager'
  // Team Members
  | 'marketing_team'
  | 'sales_team'
  | 'operations_team'
  | 'finance_team'
  | 'hr_team'
  | 'accounting_team'
  // Specialized
  | 'it_analyst'
  | 'academia_research'
  | 'education'
  | 'design'
  | 'freelancer'
  | 'consultant'
  | 'other'

/**
 * Company size categories (from user_perfil.tamano_id)
 */
export type CompanySize = 'small' | 'medium' | 'large' | 'very_large'

/**
 * Company size ranges
 */
export interface CompanySizeRange {
  category: CompanySize
  min_employees: number
  max_employees: number | null // null = unlimited
  label: string
}

export const COMPANY_SIZE_RANGES: CompanySizeRange[] = [
  {
    category: 'small',
    min_employees: 1,
    max_employees: 50,
    label: 'Pequeña (1-50)',
  },
  {
    category: 'medium',
    min_employees: 51,
    max_employees: 250,
    label: 'Mediana (51-250)',
  },
  {
    category: 'large',
    min_employees: 251,
    max_employees: 1000,
    label: 'Grande (251-1000)',
  },
  {
    category: 'very_large',
    min_employees: 1001,
    max_employees: null,
    label: 'Muy Grande (1000+)',
  },
]

// =====================================================
// Availability Types
// =====================================================

/**
 * Time of day preferences
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

/**
 * Availability parameters for a user
 */
export interface UserAvailability {
  role: ProfessionalRole
  company_size: CompanySize

  // Minutes per day
  daily_minutes_min: number
  daily_minutes_max: number

  // Days per week
  days_per_week_min: number
  days_per_week_max: number

  // Session duration (minutes)
  session_duration_min: number
  session_duration_max: number

  // Preferred times
  preferred_times: TimeOfDay[]

  // Max lessons per day
  max_lessons_per_day: number

  // Pomodoro length (minutes)
  pomodoro_length: number
}

/**
 * Availability matrix entry
 */
export interface AvailabilityMatrixEntry {
  role_category: string // e.g., 'c_level', 'director', 'manager', 'team', 'specialized'
  company_size: CompanySize
  availability: Omit<UserAvailability, 'role' | 'company_size'>
}

// =====================================================
// Complexity Types
// =====================================================

/**
 * Course complexity calculation
 */
export interface CourseComplexity {
  level: CourseLevel
  category: CourseCategory
  complexity_multiplier: number
}

/**
 * Level multipliers
 */
export const LEVEL_MULTIPLIERS: Record<CourseLevel, number> = {
  beginner: 0.9,
  intermediate: 1.0,
  advanced: 1.2,
}

/**
 * Category additional multipliers (as percentage)
 */
export const CATEGORY_MULTIPLIERS: Record<CourseCategory, number> = {
  technical: 0.15,
  'data-science': 0.15,
  conceptual: 0.10,
  leadership: 0.10,
  practical: 0.12,
  creativity: 0.12,
  theoretical: 0.20,
}

// =====================================================
// Session Duration Types
// =====================================================

/**
 * Session type duration range
 */
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
// User Profile
// =====================================================

/**
 * Complete user profile for study planner
 */
export interface UserStudyProfile {
  user_id: string
  role: ProfessionalRole
  company_size: CompanySize
  area?: string
  level?: string
  sector?: string
  relation_type?: string
}

// =====================================================
// Request/Response Types
// =====================================================

/**
 * Request to calculate user availability
 */
export interface CalculateAvailabilityRequest {
  user_id: string
  preferred_session_type?: SessionType
}

/**
 * Response with calculated availability
 */
export interface CalculateAvailabilityResponse {
  user_profile: UserStudyProfile
  availability: UserAvailability
  session_type_suggestion: SessionType
}

/**
 * Request to calculate course complexity
 */
export interface CalculateCourseComplexityRequest {
  course_id: string
  level: CourseLevel
  category: CourseCategory
}

/**
 * Response with course complexity
 */
export interface CalculateCourseComplexityResponse {
  course_id: string
  complexity: CourseComplexity
  adjusted_session_durations: Record<SessionType, number>
}
