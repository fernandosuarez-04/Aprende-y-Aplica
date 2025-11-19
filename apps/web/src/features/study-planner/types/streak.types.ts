// ============================================================================
// Tipos TypeScript para Sistema de Streaks y Dashboard
// ============================================================================

// ============================================================================
// Database Types
// ============================================================================

export interface UserStreak {
  user_id: string
  current_streak: number
  longest_streak: number
  last_session_date: string | null // Date string
  total_sessions_completed: number
  total_study_minutes: number
  total_sessions_missed: number
  total_sessions_rescheduled: number
  weekly_sessions_completed: number
  weekly_study_minutes: number
  week_start_date: string | null // Date string
  monthly_sessions_completed: number
  monthly_study_minutes: number
  month_start_date: string | null // Date string
  created_at: string
  updated_at: string
}

export interface DailyProgress {
  id: string
  user_id: string
  progress_date: string // Date string (YYYY-MM-DD)
  sessions_completed: number
  sessions_missed: number
  study_minutes: number
  had_activity: boolean
  streak_count: number
  created_at: string
  updated_at: string
}

export type SessionCompletionStatus = 'pending' | 'completed' | 'missed' | 'skipped' | 'rescheduled'

export interface SessionCompletion {
  session_id: string
  completed_at: string // ISO timestamp
  actual_duration_minutes: number
  notes?: string
  self_evaluation?: number // 1-5
  completion_status: 'completed'
}

// ============================================================================
// API Response Types
// ============================================================================

export interface StreakStats {
  current_streak: number
  longest_streak: number
  last_session_date: string | null
  total_sessions_completed: number
  total_study_minutes: number
}

export interface WeeklyStats {
  sessions_completed: number
  sessions_missed: number
  study_minutes: number
  days_with_activity: number
}

export interface MonthlyStats {
  sessions_completed: number
  sessions_missed: number
  study_minutes: number
  days_with_activity: number
}

export interface NextSession {
  session_id: string
  scheduled_date: string
  scheduled_start_time: string
  scheduled_end_time: string
  duration_minutes: number
  session_type: 'learning' | 'review' | 'practice'
  course_name: string
  lesson_title: string
}

export interface DailyProgressData {
  date: string // YYYY-MM-DD
  sessions_completed: number
  study_minutes: number
  had_activity: boolean
  streak_count: number
}

export interface DashboardStats {
  streak: StreakStats
  weekly_stats: WeeklyStats
  monthly_stats: MonthlyStats
  next_sessions: NextSession[]
  daily_progress_last_30_days: DailyProgressData[]
}

// ============================================================================
// Plan Progress Types
// ============================================================================

export interface StudyPlanProgress {
  plan_id: string
  user_id: string
  plan_name: string
  plan_created_at: string
  total_sessions: number
  sessions_completed: number
  sessions_pending: number
  sessions_missed: number
  sessions_rescheduled: number
  completion_percentage: number
  total_planned_minutes: number
  total_studied_minutes: number
  first_session_date: string | null
  last_session_date: string | null
  last_completed_date: string | null
  avg_self_evaluation: number | null
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
  lastSessionDate: string | null
  className?: string
}

export interface DailyProgressCardProps {
  todayStats: {
    sessions_completed: number
    sessions_pending: number
    study_minutes: number
    target_minutes?: number
  }
  className?: string
}

export interface WeeklyProgressBarProps {
  weeklyData: {
    date: string // YYYY-MM-DD
    had_activity: boolean
    sessions_completed: number
    study_minutes: number
  }[]
  className?: string
}

export interface NextSessionCardProps {
  session: NextSession
  onStartSession?: (sessionId: string) => void
  onReschedule?: (sessionId: string) => void
  className?: string
}

export interface CalendarViewProps {
  dailyProgress: DailyProgressData[]
  onDateClick?: (date: string) => void
  selectedDate?: string
  className?: string
}

// ============================================================================
// Heatmap Types
// ============================================================================

export interface HeatmapData {
  date: string // YYYY-MM-DD
  value: number // Study minutes or session count
  level: 0 | 1 | 2 | 3 | 4 // Intensity level for color coding
}

export interface HeatmapProps {
  data: HeatmapData[]
  startDate?: string
  endDate?: string
  showMonthLabels?: boolean
  showWeekdayLabels?: boolean
  className?: string
}

// ============================================================================
// Session Complete Form Types
// ============================================================================

export interface CompleteSessionFormData {
  actual_duration_minutes: number
  notes?: string
  self_evaluation?: number // 1-5
}

// ============================================================================
// Helper Functions Types
// ============================================================================

/**
 * Calcula el nivel de intensidad para el heatmap basado en minutos de estudio
 */
export function calculateHeatmapLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes === 0) return 0
  if (minutes < 30) return 1
  if (minutes < 60) return 2
  if (minutes < 120) return 3
  return 4
}

/**
 * Formatea minutos a formato legible (ej: "1h 30m")
 */
export function formatStudyTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}m`
}

/**
 * Obtiene el mensaje de motivación basado en el streak actual
 */
export function getStreakMotivationMessage(streak: number): string {
  if (streak === 0) {
    return '¡Comienza tu racha hoy!'
  }
  if (streak === 1) {
    return '¡Buen comienzo! Continúa mañana.'
  }
  if (streak < 7) {
    return `¡${streak} días seguidos! Sigue así.`
  }
  if (streak < 14) {
    return `¡${streak} días! Estás construyendo un gran hábito.`
  }
  if (streak < 30) {
    return `¡${streak} días consecutivos! Increíble dedicación.`
  }
  return `¡${streak} días! Eres una inspiración.`
}

/**
 * Calcula el porcentaje de completitud del día
 */
export function calculateDailyCompletionPercentage(
  completed: number,
  pending: number
): number {
  const total = completed + pending
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

/**
 * Obtiene los últimos N días de datos para el heatmap
 */
export function getLast365Days(): string[] {
  const days: string[] = []
  const today = new Date()

  for (let i = 364; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    days.push(date.toISOString().split('T')[0])
  }

  return days
}

/**
 * Agrupa datos diarios por semana
 */
export function groupByWeek(dailyData: DailyProgressData[]): DailyProgressData[][] {
  const weeks: DailyProgressData[][] = []
  let currentWeek: DailyProgressData[] = []

  dailyData.forEach((day, index) => {
    currentWeek.push(day)

    // Cada 7 días o al final del array, crear nueva semana
    if ((index + 1) % 7 === 0 || index === dailyData.length - 1) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })

  return weeks
}

/**
 * Calcula stats de la semana actual
 */
export function getCurrentWeekStats(dailyData: DailyProgressData[]): WeeklyStats {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay()) // Domingo

  const weekData = dailyData.filter((day) => {
    const dayDate = new Date(day.date)
    return dayDate >= weekStart && dayDate <= today
  })

  return {
    sessions_completed: weekData.reduce((sum, day) => sum + day.sessions_completed, 0),
    sessions_missed: 0, // Se puede calcular desde la API
    study_minutes: weekData.reduce((sum, day) => sum + day.study_minutes, 0),
    days_with_activity: weekData.filter((day) => day.had_activity).length,
  }
}

/**
 * Convierte DailyProgressData a HeatmapData
 */
export function convertToHeatmapData(dailyData: DailyProgressData[]): HeatmapData[] {
  return dailyData.map((day) => ({
    date: day.date,
    value: day.study_minutes,
    level: calculateHeatmapLevel(day.study_minutes),
  }))
}

/**
 * Verifica si el streak está en riesgo (última sesión fue hace 2+ días)
 */
export function isStreakAtRisk(lastSessionDate: string | null): boolean {
  if (!lastSessionDate) return false

  const lastSession = new Date(lastSessionDate)
  const today = new Date()
  const diffDays = Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24))

  return diffDays >= 1
}

/**
 * Obtiene color para el streak badge
 */
export function getStreakColor(streak: number): string {
  if (streak === 0) return 'bg-neutral-200 dark:bg-neutral-700'
  if (streak < 7) return 'bg-blue-500'
  if (streak < 14) return 'bg-green-500'
  if (streak < 30) return 'bg-orange-500'
  return 'bg-purple-500'
}

/**
 * Obtiene icono de evaluación (estrellas)
 */
export function getEvaluationStars(rating: number): string {
  return '⭐'.repeat(Math.min(Math.max(Math.round(rating), 0), 5))
}
