/**
 * Tipos TypeScript para el sistema de planificador de estudio
 * Mapean las tablas existentes en Supabase: study_plans, study_preferences, study_sessions, calendar_integrations
 */

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Lunes, 7 = Domingo

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'skipped';

export type CalendarProvider = 'google' | 'microsoft' | 'apple' | null;

export interface TimeBlock {
  start: string; // Formato HH:mm (ej: "08:00")
  end: string; // Formato HH:mm (ej: "10:00")
  label?: string; // Opcional: "Mañana", "Tarde", etc.
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // Cada cuántos días/semanas/meses
  daysOfWeek?: DayOfWeek[]; // Para frecuencia 'weekly'
  endDate?: string; // Fecha ISO de fin de recurrencia
  count?: number; // Número máximo de ocurrencias
}

export interface SessionMetrics {
  focus_score?: number; // 0-100
  completion_rate?: number; // 0-100
  distractions?: number;
  notes?: string;
  tags?: string[];
}

/**
 * Tabla: study_plans
 */
export interface StudyPlan {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  goal_hours_per_week: number;
  start_date: string | null; // ISO date
  end_date: string | null; // ISO date
  timezone: string;
  preferred_days: DayOfWeek[];
  preferred_time_blocks: TimeBlock[];
  created_at: string;
  updated_at: string;
}

export interface StudyPlanInsert {
  id?: string;
  user_id: string;
  name: string;
  description?: string | null;
  goal_hours_per_week?: number;
  start_date?: string | null;
  end_date?: string | null;
  timezone?: string;
  preferred_days?: DayOfWeek[];
  preferred_time_blocks?: TimeBlock[];
}

export interface StudyPlanUpdate {
  name?: string;
  description?: string | null;
  goal_hours_per_week?: number;
  start_date?: string | null;
  end_date?: string | null;
  timezone?: string;
  preferred_days?: DayOfWeek[];
  preferred_time_blocks?: TimeBlock[];
  updated_at?: string;
}

/**
 * Tabla: study_preferences
 */
export interface StudyPreferences {
  id: string;
  user_id: string;
  timezone: string;
  preferred_time_of_day: TimeOfDay;
  preferred_days: DayOfWeek[];
  daily_target_minutes: number;
  weekly_target_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface StudyPreferencesInsert {
  id?: string;
  user_id: string;
  timezone?: string;
  preferred_time_of_day?: TimeOfDay;
  preferred_days?: DayOfWeek[];
  daily_target_minutes?: number;
  weekly_target_minutes?: number;
}

export interface StudyPreferencesUpdate {
  timezone?: string;
  preferred_time_of_day?: TimeOfDay;
  preferred_days?: DayOfWeek[];
  daily_target_minutes?: number;
  weekly_target_minutes?: number;
  updated_at?: string;
}

/**
 * Tabla: study_sessions
 */
export interface StudySession {
  id: string;
  plan_id: string | null;
  user_id: string;
  title: string;
  description: string | null;
  course_id: string | null;
  focus_area: string | null;
  start_time: string; // ISO timestamp
  end_time: string; // ISO timestamp
  duration_minutes: number;
  status: SessionStatus;
  actual_duration_minutes: number | null;
  recurrence: RecurrenceRule | null;
  metrics: SessionMetrics;
  calendar_provider: CalendarProvider;
  external_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySessionInsert {
  id?: string;
  plan_id?: string | null;
  user_id: string;
  title: string;
  description?: string | null;
  course_id?: string | null;
  focus_area?: string | null;
  start_time: string;
  end_time: string;
  duration_minutes?: number;
  status?: SessionStatus;
  actual_duration_minutes?: number | null;
  recurrence?: RecurrenceRule | null;
  metrics?: SessionMetrics;
  calendar_provider?: CalendarProvider;
  external_event_id?: string | null;
}

export interface StudySessionUpdate {
  plan_id?: string | null;
  title?: string;
  description?: string | null;
  course_id?: string | null;
  focus_area?: string | null;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  status?: SessionStatus;
  actual_duration_minutes?: number | null;
  recurrence?: RecurrenceRule | null;
  metrics?: SessionMetrics;
  calendar_provider?: CalendarProvider;
  external_event_id?: string | null;
  updated_at?: string;
}

/**
 * Tabla: calendar_integrations
 */
export interface CalendarIntegration {
  id: string;
  user_id: string;
  provider: 'google' | 'microsoft' | 'apple';
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null; // ISO timestamp
  scope: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CalendarIntegrationInsert {
  id?: string;
  user_id: string;
  provider: 'google' | 'microsoft' | 'apple';
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: string | null;
  scope?: string | null;
  metadata?: Record<string, any>;
}

export interface CalendarIntegrationUpdate {
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: string | null;
  scope?: string | null;
  metadata?: Record<string, any>;
  updated_at?: string;
}

/**
 * Tipos para métricas y estadísticas
 */
export interface LearningMetrics {
  totalSessions: number;
  completedSessions: number;
  plannedHours: number;
  actualHours: number;
  currentStreak: number; // Días consecutivos
  longestStreak: number;
  weeklyProgress: {
    week: string;
    planned: number;
    completed: number;
  }[];
  monthlyProgress: {
    month: string;
    planned: number;
    completed: number;
  }[];
}

export interface StudyHabitStats {
  averageDailyMinutes: number;
  averageWeeklyMinutes: number;
  completionRate: number; // Porcentaje
  mostActiveDay: DayOfWeek;
  mostActiveTime: TimeOfDay;
  consistencyScore: number; // 0-100
}

