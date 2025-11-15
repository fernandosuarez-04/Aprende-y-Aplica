/**
 * Servicio para gestionar el planificador de estudio
 * Usa Supabase solo para acceso a datos (NO autenticación)
 */

import { createClient } from '@supabase/supabase-js';
import type {
  StudyPlan,
  StudyPlanInsert,
  StudyPlanUpdate,
  StudyPreferences,
  StudyPreferencesInsert,
  StudyPreferencesUpdate,
  StudySession,
  StudySessionInsert,
  StudySessionUpdate,
  CalendarIntegration,
  CalendarIntegrationInsert,
  CalendarIntegrationUpdate,
  LearningMetrics,
  StudyHabitStats,
} from '@repo/shared/types';

// Cliente de Supabase usando service role key para acceso directo a datos
// NOTA: Este servicio solo debe usarse en el servidor (API routes, Server Components)
const getSupabaseUrl = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
};

const getSupabaseServiceKey = () => {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
};

// Cliente con service role para operaciones del servidor
const getSupabaseClient = () => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseServiceKey = getSupabaseServiceKey();

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Variables de entorno faltantes: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export class StudyPlannerService {
  /**
   * ========== STUDY PLANS ==========
   */

  static async getStudyPlans(userId: string): Promise<StudyPlan[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as StudyPlan[];
  }

  static async getStudyPlanById(planId: string, userId: string): Promise<StudyPlan | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw error;
    }
    return data as StudyPlan;
  }

  static async createStudyPlan(plan: StudyPlanInsert): Promise<StudyPlan> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('study_plans')
      .insert({
        ...plan,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as StudyPlan;
  }

  static async updateStudyPlan(
    planId: string,
    userId: string,
    updates: StudyPlanUpdate
  ): Promise<StudyPlan> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('study_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as StudyPlan;
  }

  static async deleteStudyPlan(planId: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('study_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * ========== STUDY PREFERENCES ==========
   */

  static async getStudyPreferences(userId: string): Promise<StudyPreferences | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('study_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw error;
    }
    return data as StudyPreferences;
  }

  static async createOrUpdateStudyPreferences(
    preferences: StudyPreferencesInsert | StudyPreferencesUpdate
  ): Promise<StudyPreferences> {
    const supabase = getSupabaseClient();
    const userId = 'user_id' in preferences ? preferences.user_id : undefined;

    if (!userId) {
      throw new Error('user_id es requerido para crear preferencias');
    }

    // Intentar obtener preferencias existentes
    const existing = await this.getStudyPreferences(userId);

    // Preparar datos para insert/update (excluir user_id del objeto de actualización)
    const { user_id, ...updateData } = preferences as any;
    
    // Filtrar campos undefined para evitar errores en Supabase
    // También asegurar que los arrays estén en el formato correcto
    const cleanData: any = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        // Si es un array, asegurar que esté en formato JSON válido
        if (Array.isArray(value)) {
          cleanData[key] = value;
        } else {
          cleanData[key] = value;
        }
      }
    }
    
    // Log para debugging
    console.log('Creating/updating preferences with data:', {
      userId,
      cleanData,
      hasExisting: !!existing
    });

    if (existing) {
      // Actualizar
      const { data, error } = await supabase
        .from('study_preferences')
        .update({
          ...cleanData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating study preferences:', error);
        const errorMessage = error.message || 'Error desconocido al actualizar preferencias';
        throw new Error(`Error al actualizar preferencias: ${errorMessage}`);
      }
      return data as StudyPreferences;
    } else {
      // Crear - asegurar que user_id esté incluido
      const { data, error } = await supabase
        .from('study_preferences')
        .insert({
          ...cleanData,
          user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating study preferences:', error);
        const errorMessage = error.message || 'Error desconocido al crear preferencias';
        throw new Error(`Error al crear preferencias: ${errorMessage}`);
      }
      return data as StudyPreferences;
    }
  }

  /**
   * ========== STUDY SESSIONS ==========
   */

  static async getStudySessions(
    userId: string,
    filters?: {
      planId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<StudySession[]> {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (filters?.planId) {
      query = query.eq('plan_id', filters.planId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('start_time', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as StudySession[];
  }

  static async getStudySessionById(
    sessionId: string,
    userId: string
  ): Promise<StudySession | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as StudySession;
  }

  static async createStudySession(session: StudySessionInsert): Promise<StudySession> {
    const supabase = getSupabaseClient();
    
    // Excluir duration_minutes porque es una columna generada en la BD
    const { duration_minutes, ...sessionData } = session as any;
    
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        ...sessionData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating study session:', error);
      throw error;
    }
    return data as StudySession;
  }

  static async updateStudySession(
    sessionId: string,
    userId: string,
    updates: StudySessionUpdate
  ): Promise<StudySession> {
    const supabase = getSupabaseClient();
    
    // Filtrar campos undefined y preparar datos para Supabase
    // Excluir duration_minutes ya que es una columna generada (se calcula automáticamente)
    const cleanData: any = {};
    for (const [key, value] of Object.entries(updates)) {
      // Excluir duration_minutes porque es una columna generada en la BD
      if (key === 'duration_minutes') {
        continue;
      }
      
      if (value !== undefined) {
        // Convertir fechas a ISO string si son strings de fecha
        if ((key === 'start_time' || key === 'end_time') && typeof value === 'string') {
          cleanData[key] = value; // Ya debería estar en formato ISO
        }
        // Si es null, incluir explícitamente
        else if (value === null) {
          cleanData[key] = null;
        }
        // Si es un objeto (recurrence, metrics), incluir tal cual
        else if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
          cleanData[key] = value;
        }
        // Si es un array, incluir tal cual
        else if (Array.isArray(value)) {
          cleanData[key] = value;
        }
        // Para otros valores primitivos
        else {
          cleanData[key] = value;
        }
      }
    }
    
    // Log para debugging
    console.log('Updating study session with data:', {
      sessionId,
      userId,
      cleanData,
      originalUpdates: updates
    });
    
    const { data, error } = await supabase
      .from('study_sessions')
      .update({
        ...cleanData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating study session:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      const errorMessage = error.message || 'Error desconocido al actualizar sesión';
      throw new Error(`Error al actualizar sesión: ${errorMessage}`);
    }
    return data as StudySession;
  }

  static async deleteStudySession(sessionId: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('study_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Elimina todas las sesiones generadas automáticamente (futuras)
   */
  static async deleteAutoGeneratedSessions(userId: string): Promise<number> {
    const supabase = getSupabaseClient();
    
    // Obtener todas las sesiones futuras generadas automáticamente
    const now = new Date().toISOString();
    const { data: sessions, error: fetchError } = await supabase
      .from('study_sessions')
      .select('id, external_event_id, calendar_provider')
      .eq('user_id', userId)
      .eq('status', 'planned')
      .gte('start_time', now)
      .like('description', '%programada automáticamente%');

    if (fetchError) {
      console.error('Error fetching auto-generated sessions:', fetchError);
      throw fetchError;
    }

    if (!sessions || sessions.length === 0) {
      return 0;
    }

    // Eliminar las sesiones
    const sessionIds = sessions.map(s => s.id);
    const { error: deleteError } = await supabase
      .from('study_sessions')
      .delete()
      .eq('user_id', userId)
      .in('id', sessionIds);

    if (deleteError) {
      console.error('Error deleting auto-generated sessions:', deleteError);
      throw deleteError;
    }

    return sessions.length;
  }

  /**
   * ========== CALENDAR INTEGRATIONS ==========
   */

  static async getCalendarIntegrations(userId: string): Promise<CalendarIntegration[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CalendarIntegration[];
  }

  static async getCalendarIntegrationByProvider(
    userId: string,
    provider: 'google' | 'microsoft' | 'apple'
  ): Promise<CalendarIntegration | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as CalendarIntegration;
  }

  static async createOrUpdateCalendarIntegration(
    integration: CalendarIntegrationInsert
  ): Promise<CalendarIntegration> {
    const supabase = getSupabaseClient();

    // Verificar si ya existe
    const existing = await this.getCalendarIntegrationByProvider(
      integration.user_id,
      integration.provider
    );

    if (existing) {
      // Actualizar
      const { data, error } = await supabase
        .from('calendar_integrations')
        .update({
          ...integration,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as CalendarIntegration;
    } else {
      // Crear
      const { data, error } = await supabase
        .from('calendar_integrations')
        .insert({
          ...integration,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as CalendarIntegration;
    }
  }

  static async deleteCalendarIntegration(
    integrationId: string,
    userId: string
  ): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('calendar_integrations')
      .delete()
      .eq('id', integrationId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * ========== METRICS ==========
   */

  static async getLearningMetrics(userId: string): Promise<LearningMetrics> {
    const supabase = getSupabaseClient();

    // Obtener todas las sesiones del usuario
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const allSessions = sessions as StudySession[];
    const completedSessions = allSessions.filter((s) => s.status === 'completed');

    // Calcular métricas básicas
    const totalSessions = allSessions.length;
    const plannedHours =
      allSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / 60;
    const actualHours =
      completedSessions.reduce(
        (sum, s) => sum + (s.actual_duration_minutes || s.duration_minutes || 0),
        0
      ) / 60;

    // Calcular racha actual
    const currentStreak = this.calculateCurrentStreak(completedSessions);

    // Calcular racha más larga
    const longestStreak = this.calculateLongestStreak(completedSessions);

    // Calcular progreso semanal (últimas 8 semanas)
    const weeklyProgress = this.calculateWeeklyProgress(completedSessions, 8);

    // Calcular progreso mensual (últimos 6 meses)
    const monthlyProgress = this.calculateMonthlyProgress(completedSessions, 6);

    return {
      totalSessions,
      completedSessions: completedSessions.length,
      plannedHours: Math.round(plannedHours * 100) / 100,
      actualHours: Math.round(actualHours * 100) / 100,
      currentStreak,
      longestStreak,
      weeklyProgress,
      monthlyProgress,
    };
  }

  static async getStudyHabitStats(userId: string): Promise<StudyHabitStats> {
    const supabase = getSupabaseClient();

    // Obtener sesiones completadas
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (error) throw error;

    const completedSessions = sessions as StudySession[];

    if (completedSessions.length === 0) {
      return {
        averageDailyMinutes: 0,
        averageWeeklyMinutes: 0,
        completionRate: 0,
        mostActiveDay: 1,
        mostActiveTime: 'morning',
        consistencyScore: 0,
      };
    }

    // Calcular promedios
    const totalMinutes = completedSessions.reduce(
      (sum, s) => sum + (s.actual_duration_minutes || s.duration_minutes || 0),
      0
    );
    const daysWithSessions = new Set(
      completedSessions.map((s) => new Date(s.start_time).toDateString())
    ).size;
    const averageDailyMinutes = daysWithSessions > 0 ? totalMinutes / daysWithSessions : 0;
    const averageWeeklyMinutes = (totalMinutes / daysWithSessions) * 7;

    // Obtener todas las sesiones (completadas y no completadas) para calcular tasa de completitud
    const { data: allSessions } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId);

    const totalSessions = (allSessions || []).length;
    const completionRate =
      totalSessions > 0 ? (completedSessions.length / totalSessions) * 100 : 0;

    // Día más activo
    const dayCounts: Record<number, number> = {};
    completedSessions.forEach((s) => {
      const day = new Date(s.start_time).getDay(); // 0 = Domingo, 1 = Lunes, etc.
      const normalizedDay = day === 0 ? 7 : day; // Convertir a 1-7 (Lunes-Domingo)
      dayCounts[normalizedDay] = (dayCounts[normalizedDay] || 0) + 1;
    });
    const mostActiveDay = (Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      '1') as any;

    // Hora más activa
    const timeCounts: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    completedSessions.forEach((s) => {
      const hour = new Date(s.start_time).getHours();
      if (hour >= 6 && hour < 12) timeCounts.morning++;
      else if (hour >= 12 && hour < 18) timeCounts.afternoon++;
      else if (hour >= 18 && hour < 22) timeCounts.evening++;
      else timeCounts.night++;
    });
    const mostActiveTime = (Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      'morning') as any;

    // Calcular score de consistencia (0-100)
    const consistencyScore = this.calculateConsistencyScore(completedSessions);

    return {
      averageDailyMinutes: Math.round(averageDailyMinutes),
      averageWeeklyMinutes: Math.round(averageWeeklyMinutes),
      completionRate: Math.round(completionRate * 100) / 100,
      mostActiveDay: parseInt(mostActiveDay),
      mostActiveTime,
      consistencyScore,
    };
  }

  /**
   * ========== HELPER METHODS ==========
   */

  private static calculateCurrentStreak(sessions: StudySession[]): number {
    if (sessions.length === 0) return 0;

    // Ordenar por fecha descendente
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of sorted) {
      const sessionDate = new Date(session.start_time);
      sessionDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  }

  private static calculateLongestStreak(sessions: StudySession[]): number {
    if (sessions.length === 0) return 0;

    // Agrupar por día
    const days = new Set(
      sessions.map((s) => {
        const d = new Date(s.start_time);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      })
    );

    const sortedDays = Array.from(days)
      .map((d) => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    let longestStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const date of sortedDays) {
      if (lastDate === null) {
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor(
          (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
      lastDate = date;
    }

    return Math.max(longestStreak, currentStreak);
  }

  private static calculateWeeklyProgress(
    sessions: StudySession[],
    weeks: number
  ): { week: string; planned: number; completed: number }[] {
    const result: { week: string; planned: number; completed: number }[] = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7 - now.getDay() + 1); // Lunes de esa semana
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekSessions = sessions.filter((s) => {
        const sessionDate = new Date(s.start_time);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });

      const planned = weekSessions.reduce(
        (sum, s) => sum + (s.duration_minutes || 0),
        0
      );
      const completed = weekSessions.reduce(
        (sum, s) => sum + (s.actual_duration_minutes || s.duration_minutes || 0),
        0
      );

      result.push({
        week: weekStart.toISOString().split('T')[0],
        planned: Math.round((planned / 60) * 100) / 100,
        completed: Math.round((completed / 60) * 100) / 100,
      });
    }

    return result;
  }

  private static calculateMonthlyProgress(
    sessions: StudySession[],
    months: number
  ): { month: string; planned: number; completed: number }[] {
    const result: { month: string; planned: number; completed: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const monthSessions = sessions.filter((s) => {
        const sessionDate = new Date(s.start_time);
        return sessionDate >= monthStart && sessionDate <= monthEnd;
      });

      const planned = monthSessions.reduce(
        (sum, s) => sum + (s.duration_minutes || 0),
        0
      );
      const completed = monthSessions.reduce(
        (sum, s) => sum + (s.actual_duration_minutes || s.duration_minutes || 0),
        0
      );

      result.push({
        month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        planned: Math.round((planned / 60) * 100) / 100,
        completed: Math.round((completed / 60) * 100) / 100,
      });
    }

    return result;
  }

  private static calculateConsistencyScore(sessions: StudySession[]): number {
    if (sessions.length === 0) return 0;

    // Calcular variabilidad en días de estudio
    const days = new Set(
      sessions.map((s) => {
        const d = new Date(s.start_time);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
      })
    ).size;

    // Calcular variabilidad en duración
    const durations = sessions.map(
      (s) => s.actual_duration_minutes || s.duration_minutes || 0
    );
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance =
      durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    const cv = avgDuration > 0 ? stdDev / avgDuration : 1; // Coeficiente de variación

    // Score basado en:
    // - Número de días únicos (más días = mejor, hasta cierto punto)
    // - Consistencia en duración (menor variabilidad = mejor)
    const daysScore = Math.min(days / 30, 1) * 50; // Máximo 50 puntos por días
    const consistencyScore = Math.max(0, 50 - cv * 25); // Máximo 50 puntos por consistencia

    return Math.round(daysScore + consistencyScore);
  }
}

