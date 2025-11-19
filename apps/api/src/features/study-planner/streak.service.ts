/**
 * ============================================================================
 * Streak Service - Servicio de Gestión de Rachas y Dashboard
 * ============================================================================
 * Maneja la lógica de negocio para:
 * - Completar sesiones de estudio
 * - Calcular y actualizar rachas
 * - Obtener estadísticas del dashboard
 * - Gestionar progreso diario
 */

import { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// Types
// ============================================================================

export interface SessionCompletion {
  session_id: string
  completed_at: string // ISO timestamp
  actual_duration_minutes: number
  notes?: string
  self_evaluation?: number // 1-5
}

export interface DashboardStats {
  streak: {
    current_streak: number
    longest_streak: number
    last_session_date: string | null
    total_sessions_completed: number
    total_study_minutes: number
  }
  weekly_stats: {
    sessions_completed: number
    sessions_missed: number
    study_minutes: number
    days_with_activity: number
  }
  monthly_stats: {
    sessions_completed: number
    sessions_missed: number
    study_minutes: number
    days_with_activity: number
  }
  next_sessions: Array<{
    session_id: string
    scheduled_date: string
    scheduled_start_time: string
    scheduled_end_time: string
    duration_minutes: number
    session_type: string
    course_name: string
    lesson_title: string
  }>
  daily_progress_last_30_days: Array<{
    date: string
    sessions_completed: number
    study_minutes: number
    had_activity: boolean
    streak_count: number
  }>
}

export interface UserStreak {
  user_id: string
  current_streak: number
  longest_streak: number
  last_session_date: string | null
  total_sessions_completed: number
  total_study_minutes: number
  total_sessions_missed: number
  total_sessions_rescheduled: number
}

// ============================================================================
// Streak Service Class
// ============================================================================

export class StreakService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Completa una sesión de estudio y actualiza el streak automáticamente
   */
  async completeSession(
    userId: string,
    completion: SessionCompletion
  ): Promise<{ success: boolean; streak?: UserStreak; error?: string }> {
    try {
      // 1. Validar que la sesión existe y pertenece al usuario
      const { data: session, error: sessionError } = await this.supabase
        .from('study_sessions')
        .select('session_id, user_id, duration_minutes, completion_status')
        .eq('session_id', completion.session_id)
        .eq('user_id', userId)
        .single()

      if (sessionError || !session) {
        return {
          success: false,
          error: 'Sesión no encontrada o no autorizada',
        }
      }

      if (session.completion_status === 'completed') {
        return {
          success: false,
          error: 'Esta sesión ya está completada',
        }
      }

      // 2. Validar self_evaluation si se proporciona
      if (
        completion.self_evaluation !== undefined &&
        (completion.self_evaluation < 1 || completion.self_evaluation > 5)
      ) {
        return {
          success: false,
          error: 'La evaluación debe estar entre 1 y 5',
        }
      }

      // 3. Actualizar la sesión a completada
      // El trigger update_user_streak() se ejecutará automáticamente
      const { error: updateError } = await this.supabase
        .from('study_sessions')
        .update({
          completion_status: 'completed',
          completed_at: completion.completed_at,
          actual_duration_minutes: completion.actual_duration_minutes,
          notes: completion.notes || null,
          self_evaluation: completion.self_evaluation || null,
        })
        .eq('session_id', completion.session_id)

      if (updateError) {
        console.error('Error al completar sesión:', updateError)
        return {
          success: false,
          error: 'Error al actualizar la sesión',
        }
      }

      // 4. Obtener el streak actualizado
      const { data: streak, error: streakError } = await this.supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (streakError) {
        // Si no existe user_streak aún, el trigger lo creará en la próxima actualización
        console.warn('Streak no encontrado (será creado por el trigger):', streakError)
      }

      return {
        success: true,
        streak: streak || undefined,
      }
    } catch (error) {
      console.error('Error en completeSession:', error)
      return {
        success: false,
        error: 'Error interno al completar la sesión',
      }
    }
  }

  /**
   * Marca una sesión como perdida (missed)
   */
  async markSessionAsMissed(
    userId: string,
    sessionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('study_sessions')
        .update({
          completion_status: 'missed',
        })
        .eq('session_id', sessionId)
        .eq('user_id', userId)

      if (error) {
        return { success: false, error: 'Error al marcar sesión como perdida' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error en markSessionAsMissed:', error)
      return { success: false, error: 'Error interno' }
    }
  }

  /**
   * Reprograma una sesión
   */
  async rescheduleSession(
    userId: string,
    sessionId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Obtener datos actuales
      const { data: currentSession } = await this.supabase
        .from('study_sessions')
        .select('scheduled_date, scheduled_start_time')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single()

      if (!currentSession) {
        return { success: false, error: 'Sesión no encontrada' }
      }

      // Actualizar con nuevos datos
      const { error } = await this.supabase
        .from('study_sessions')
        .update({
          completion_status: 'rescheduled',
          was_rescheduled: true,
          rescheduled_from: `${currentSession.scheduled_date} ${currentSession.scheduled_start_time}`,
          scheduled_date: newDate,
          scheduled_start_time: newStartTime,
          scheduled_end_time: newEndTime,
        })
        .eq('session_id', sessionId)
        .eq('user_id', userId)

      if (error) {
        return { success: false, error: 'Error al reprogramar sesión' }
      }

      // Después de reprogramar, cambiar status a pending
      await this.supabase
        .from('study_sessions')
        .update({ completion_status: 'pending' })
        .eq('session_id', sessionId)

      return { success: true }
    } catch (error) {
      console.error('Error en rescheduleSession:', error)
      return { success: false, error: 'Error interno' }
    }
  }

  /**
   * Obtiene las estadísticas completas del dashboard
   */
  async getDashboardStats(userId: string): Promise<DashboardStats | null> {
    try {
      // Llamar a la función SQL que retorna todo en un JSON
      const { data, error } = await this.supabase.rpc('get_dashboard_stats', {
        p_user_id: userId,
      })

      if (error) {
        console.error('Error al obtener dashboard stats:', error)
        return null
      }

      // La función SQL ya retorna el formato correcto
      return data as DashboardStats
    } catch (error) {
      console.error('Error en getDashboardStats:', error)
      return null
    }
  }

  /**
   * Obtiene el streak del usuario
   */
  async getUserStreak(userId: string): Promise<UserStreak | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        // Si no existe, retornar streak vacío
        if (error.code === 'PGRST116') {
          return {
            user_id: userId,
            current_streak: 0,
            longest_streak: 0,
            last_session_date: null,
            total_sessions_completed: 0,
            total_study_minutes: 0,
            total_sessions_missed: 0,
            total_sessions_rescheduled: 0,
          }
        }
        console.error('Error al obtener user streak:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error en getUserStreak:', error)
      return null
    }
  }

  /**
   * Obtiene el progreso diario de los últimos N días
   */
  async getDailyProgress(
    userId: string,
    days: number = 30
  ): Promise<
    Array<{
      date: string
      sessions_completed: number
      sessions_missed: number
      study_minutes: number
      had_activity: boolean
      streak_count: number
    }>
  > {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateStr = startDate.toISOString().split('T')[0]

      const { data, error } = await this.supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', userId)
        .gte('progress_date', startDateStr)
        .order('progress_date', { ascending: false })

      if (error) {
        console.error('Error al obtener daily progress:', error)
        return []
      }

      return (
        data?.map((d) => ({
          date: d.progress_date,
          sessions_completed: d.sessions_completed,
          sessions_missed: d.sessions_missed,
          study_minutes: d.study_minutes,
          had_activity: d.had_activity,
          streak_count: d.streak_count,
        })) || []
      )
    } catch (error) {
      console.error('Error en getDailyProgress:', error)
      return []
    }
  }

  /**
   * Obtiene las próximas sesiones del usuario
   */
  async getUpcomingSessions(
    userId: string,
    limit: number = 5
  ): Promise<
    Array<{
      session_id: string
      scheduled_date: string
      scheduled_start_time: string
      scheduled_end_time: string
      duration_minutes: number
      session_type: string
      course_name: string
      lesson_title: string
    }>
  > {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await this.supabase
        .from('study_sessions')
        .select(
          `
          session_id,
          scheduled_date,
          scheduled_start_time,
          scheduled_end_time,
          duration_minutes,
          session_type,
          lecciones!inner(
            titulo,
            cursos!inner(nombre)
          )
        `
        )
        .eq('user_id', userId)
        .eq('completion_status', 'pending')
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_start_time', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error al obtener upcoming sessions:', error)
        return []
      }

      return (
        data?.map((s: any) => ({
          session_id: s.session_id,
          scheduled_date: s.scheduled_date,
          scheduled_start_time: s.scheduled_start_time,
          scheduled_end_time: s.scheduled_end_time,
          duration_minutes: s.duration_minutes,
          session_type: s.session_type,
          course_name: s.lecciones?.cursos?.nombre || 'Sin nombre',
          lesson_title: s.lecciones?.titulo || 'Sin título',
        })) || []
      )
    } catch (error) {
      console.error('Error en getUpcomingSessions:', error)
      return []
    }
  }

  /**
   * Obtiene el progreso de todos los planes del usuario
   */
  async getStudyPlansProgress(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('study_plan_progress')
        .select('*')
        .eq('user_id', userId)
        .order('plan_created_at', { ascending: false })

      if (error) {
        console.error('Error al obtener study plans progress:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error en getStudyPlansProgress:', error)
      return []
    }
  }
}
