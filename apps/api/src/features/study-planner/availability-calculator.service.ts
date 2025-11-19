/**
 * Availability Calculator Service
 * Calculates user availability based on professional role and company size
 *
 * Based on PRD: Granular Role-Based Availability System
 */

import {
  ProfessionalRole,
  CompanySize,
  UserAvailability,
  AvailabilityMatrixEntry,
  SessionType,
  TimeOfDay,
  UserStudyProfile,
} from './types'

// =====================================================
// AVAILABILITY MATRIX
// =====================================================

/**
 * Base availability matrix by role category and company size
 *
 * This matrix defines availability ranges based on professional level
 * and company size. The larger the company, the less time available.
 * The higher the position, different time constraints apply.
 */
const AVAILABILITY_MATRIX: AvailabilityMatrixEntry[] = [
  // =====================================================
  // C-LEVEL EXECUTIVES
  // =====================================================
  {
    role_category: 'c_level',
    company_size: 'small',
    availability: {
      daily_minutes_min: 45,
      daily_minutes_max: 90,
      days_per_week_min: 3,
      days_per_week_max: 5,
      session_duration_min: 30,
      session_duration_max: 60,
      preferred_times: ['morning', 'evening'],
      max_lessons_per_day: 2,
      pomodoro_length: 25,
    },
  },
  {
    role_category: 'c_level',
    company_size: 'medium',
    availability: {
      daily_minutes_min: 30,
      daily_minutes_max: 60,
      days_per_week_min: 2,
      days_per_week_max: 4,
      session_duration_min: 20,
      session_duration_max: 45,
      preferred_times: ['morning', 'evening'],
      max_lessons_per_day: 1,
      pomodoro_length: 20,
    },
  },
  {
    role_category: 'c_level',
    company_size: 'large',
    availability: {
      daily_minutes_min: 20,
      daily_minutes_max: 45,
      days_per_week_min: 2,
      days_per_week_max: 3,
      session_duration_min: 20,
      session_duration_max: 35,
      preferred_times: ['morning', 'night'],
      max_lessons_per_day: 1,
      pomodoro_length: 20,
    },
  },
  {
    role_category: 'c_level',
    company_size: 'very_large',
    availability: {
      daily_minutes_min: 15,
      daily_minutes_max: 30,
      days_per_week_min: 2,
      days_per_week_max: 3,
      session_duration_min: 15,
      session_duration_max: 30,
      preferred_times: ['morning', 'night'],
      max_lessons_per_day: 1,
      pomodoro_length: 15,
    },
  },

  // =====================================================
  // DIRECTORS
  // =====================================================
  {
    role_category: 'director',
    company_size: 'small',
    availability: {
      daily_minutes_min: 60,
      daily_minutes_max: 90,
      days_per_week_min: 3,
      days_per_week_max: 5,
      session_duration_min: 45,
      session_duration_max: 75,
      preferred_times: ['morning', 'afternoon', 'evening'],
      max_lessons_per_day: 2,
      pomodoro_length: 30,
    },
  },
  {
    role_category: 'director',
    company_size: 'medium',
    availability: {
      daily_minutes_min: 45,
      daily_minutes_max: 75,
      days_per_week_min: 3,
      days_per_week_max: 5,
      session_duration_min: 30,
      session_duration_max: 60,
      preferred_times: ['morning', 'evening'],
      max_lessons_per_day: 2,
      pomodoro_length: 25,
    },
  },
  {
    role_category: 'director',
    company_size: 'large',
    availability: {
      daily_minutes_min: 30,
      daily_minutes_max: 60,
      days_per_week_min: 2,
      days_per_week_max: 4,
      session_duration_min: 30,
      session_duration_max: 45,
      preferred_times: ['morning', 'evening'],
      max_lessons_per_day: 1,
      pomodoro_length: 25,
    },
  },
  {
    role_category: 'director',
    company_size: 'very_large',
    availability: {
      daily_minutes_min: 20,
      daily_minutes_max: 45,
      days_per_week_min: 2,
      days_per_week_max: 3,
      session_duration_min: 20,
      session_duration_max: 35,
      preferred_times: ['morning', 'night'],
      max_lessons_per_day: 1,
      pomodoro_length: 20,
    },
  },

  // =====================================================
  // MIDDLE MANAGEMENT (Managers)
  // =====================================================
  {
    role_category: 'manager',
    company_size: 'small',
    availability: {
      daily_minutes_min: 60,
      daily_minutes_max: 120,
      days_per_week_min: 4,
      days_per_week_max: 6,
      session_duration_min: 45,
      session_duration_max: 90,
      preferred_times: ['afternoon', 'evening'],
      max_lessons_per_day: 2,
      pomodoro_length: 30,
    },
  },
  {
    role_category: 'manager',
    company_size: 'medium',
    availability: {
      daily_minutes_min: 45,
      daily_minutes_max: 90,
      days_per_week_min: 3,
      days_per_week_max: 5,
      session_duration_min: 45,
      session_duration_max: 75,
      preferred_times: ['afternoon', 'evening'],
      max_lessons_per_day: 2,
      pomodoro_length: 30,
    },
  },
  {
    role_category: 'manager',
    company_size: 'large',
    availability: {
      daily_minutes_min: 30,
      daily_minutes_max: 60,
      days_per_week_min: 3,
      days_per_week_max: 5,
      session_duration_min: 30,
      session_duration_max: 60,
      preferred_times: ['evening'],
      max_lessons_per_day: 1,
      pomodoro_length: 25,
    },
  },
  {
    role_category: 'manager',
    company_size: 'very_large',
    availability: {
      daily_minutes_min: 30,
      daily_minutes_max: 60,
      days_per_week_min: 3,
      days_per_week_max: 4,
      session_duration_min: 30,
      session_duration_max: 45,
      preferred_times: ['evening', 'night'],
      max_lessons_per_day: 1,
      pomodoro_length: 25,
    },
  },

  // =====================================================
  // TEAM MEMBERS
  // =====================================================
  {
    role_category: 'team',
    company_size: 'small',
    availability: {
      daily_minutes_min: 60,
      daily_minutes_max: 120,
      days_per_week_min: 4,
      days_per_week_max: 7,
      session_duration_min: 45,
      session_duration_max: 120,
      preferred_times: ['afternoon', 'evening', 'night'],
      max_lessons_per_day: 3,
      pomodoro_length: 35,
    },
  },
  {
    role_category: 'team',
    company_size: 'medium',
    availability: {
      daily_minutes_min: 60,
      daily_minutes_max: 90,
      days_per_week_min: 4,
      days_per_week_max: 6,
      session_duration_min: 45,
      session_duration_max: 90,
      preferred_times: ['afternoon', 'evening'],
      max_lessons_per_day: 2,
      pomodoro_length: 30,
    },
  },
  {
    role_category: 'team',
    company_size: 'large',
    availability: {
      daily_minutes_min: 45,
      daily_minutes_max: 75,
      days_per_week_min: 3,
      days_per_week_max: 5,
      session_duration_min: 45,
      session_duration_max: 75,
      preferred_times: ['evening'],
      max_lessons_per_day: 2,
      pomodoro_length: 30,
    },
  },
  {
    role_category: 'team',
    company_size: 'very_large',
    availability: {
      daily_minutes_min: 45,
      daily_minutes_max: 60,
      days_per_week_min: 3,
      days_per_week_max: 5,
      session_duration_min: 30,
      session_duration_max: 60,
      preferred_times: ['evening', 'night'],
      max_lessons_per_day: 2,
      pomodoro_length: 25,
    },
  },

  // =====================================================
  // SPECIALIZED (IT Analyst, Academia, Freelancer, etc.)
  // =====================================================
  {
    role_category: 'specialized',
    company_size: 'small',
    availability: {
      daily_minutes_min: 75,
      daily_minutes_max: 120,
      days_per_week_min: 4,
      days_per_week_max: 7,
      session_duration_min: 60,
      session_duration_max: 120,
      preferred_times: ['afternoon', 'evening', 'night'],
      max_lessons_per_day: 3,
      pomodoro_length: 40,
    },
  },
  {
    role_category: 'specialized',
    company_size: 'medium',
    availability: {
      daily_minutes_min: 60,
      daily_minutes_max: 120,
      days_per_week_min: 4,
      days_per_week_max: 6,
      session_duration_min: 45,
      session_duration_max: 120,
      preferred_times: ['afternoon', 'evening', 'night'],
      max_lessons_per_day: 3,
      pomodoro_length: 35,
    },
  },
  {
    role_category: 'specialized',
    company_size: 'large',
    availability: {
      daily_minutes_min: 60,
      daily_minutes_max: 90,
      days_per_week_min: 4,
      days_per_week_max: 6,
      session_duration_min: 45,
      session_duration_max: 90,
      preferred_times: ['evening', 'night'],
      max_lessons_per_day: 2,
      pomodoro_length: 30,
    },
  },
  {
    role_category: 'specialized',
    company_size: 'very_large',
    availability: {
      daily_minutes_min: 45,
      daily_minutes_max: 90,
      days_per_week_min: 3,
      days_per_week_max: 5,
      session_duration_min: 45,
      session_duration_max: 75,
      preferred_times: ['evening', 'night'],
      max_lessons_per_day: 2,
      pomodoro_length: 30,
    },
  },
]

// =====================================================
// ROLE CATEGORIZATION
// =====================================================

/**
 * Map specific roles to role categories
 */
const ROLE_TO_CATEGORY: Record<ProfessionalRole, string> = {
  // C-Level
  ceo: 'c_level',
  cmo: 'c_level',
  cto: 'c_level',
  cfo: 'c_level',

  // Directors
  hr_director: 'director',
  sales_director: 'director',
  operations_director: 'director',
  finance_director: 'director',
  purchasing_director: 'director',
  government_director: 'director',

  // Managers
  marketing_manager: 'manager',
  it_manager: 'manager',
  sales_manager: 'manager',

  // Team Members
  marketing_team: 'team',
  sales_team: 'team',
  operations_team: 'team',
  finance_team: 'team',
  hr_team: 'team',
  accounting_team: 'team',

  // Specialized
  it_analyst: 'specialized',
  academia_research: 'specialized',
  education: 'specialized',
  design: 'specialized',
  freelancer: 'specialized',
  consultant: 'specialized',
  other: 'specialized',
}

// =====================================================
// SERVICE CLASS
// =====================================================

export class AvailabilityCalculatorService {
  /**
   * Calculate user availability based on profile
   */
  static calculateUserAvailability(profile: UserStudyProfile): UserAvailability {
    const roleCategory = ROLE_TO_CATEGORY[profile.role] || 'specialized'

    // Find matching entry in matrix
    const matrixEntry = AVAILABILITY_MATRIX.find(
      (entry) =>
        entry.role_category === roleCategory &&
        entry.company_size === profile.company_size
    )

    if (!matrixEntry) {
      // Fallback to default (medium team member)
      return this.getDefaultAvailability(profile.role, profile.company_size)
    }

    // Return availability with role and company size
    return {
      role: profile.role,
      company_size: profile.company_size,
      ...matrixEntry.availability,
    }
  }

  /**
   * Get default availability if no match found
   */
  private static getDefaultAvailability(
    role: ProfessionalRole,
    companySize: CompanySize
  ): UserAvailability {
    return {
      role,
      company_size: companySize,
      daily_minutes_min: 45,
      daily_minutes_max: 60,
      days_per_week_min: 3,
      days_per_week_max: 5,
      session_duration_min: 30,
      session_duration_max: 60,
      preferred_times: ['evening'],
      max_lessons_per_day: 2,
      pomodoro_length: 25,
    }
  }

  /**
   * Suggest session type based on availability
   */
  static suggestSessionType(availability: UserAvailability): SessionType {
    const avgSessionDuration =
      (availability.session_duration_min + availability.session_duration_max) / 2

    // Short: 20-35 min
    if (avgSessionDuration <= 35) {
      return 'short'
    }

    // Long: 75-120 min
    if (avgSessionDuration >= 75) {
      return 'long'
    }

    // Medium: 45-60 min (default)
    return 'medium'
  }

  /**
   * Adjust availability based on user preferences
   * Allows overriding suggested session type
   */
  static adjustAvailabilityForSessionType(
    availability: UserAvailability,
    preferredSessionType: SessionType
  ): UserAvailability {
    // Clone availability
    const adjusted = { ...availability }

    // Adjust session durations based on preferred type
    switch (preferredSessionType) {
      case 'short':
        adjusted.session_duration_min = Math.max(20, availability.session_duration_min)
        adjusted.session_duration_max = Math.min(35, availability.session_duration_max)
        adjusted.pomodoro_length = 20
        break

      case 'medium':
        adjusted.session_duration_min = Math.max(45, availability.session_duration_min)
        adjusted.session_duration_max = Math.min(60, availability.session_duration_max)
        adjusted.pomodoro_length = 25
        break

      case 'long':
        adjusted.session_duration_min = Math.max(75, availability.session_duration_min)
        adjusted.session_duration_max = Math.min(120, availability.session_duration_max)
        adjusted.pomodoro_length = 35
        break
    }

    return adjusted
  }

  /**
   * Get role category for a specific role
   */
  static getRoleCategory(role: ProfessionalRole): string {
    return ROLE_TO_CATEGORY[role] || 'specialized'
  }

  /**
   * Check if availability allows for a specific session type
   */
  static canAccommodateSessionType(
    availability: UserAvailability,
    sessionType: SessionType
  ): boolean {
    const sessionDurations = {
      short: { min: 20, max: 35 },
      medium: { min: 45, max: 60 },
      long: { min: 75, max: 120 },
    }

    const requiredDuration = sessionDurations[sessionType]

    // Check if user's availability range overlaps with session type range
    return (
      availability.session_duration_max >= requiredDuration.min &&
      availability.session_duration_min <= requiredDuration.max
    )
  }
}
