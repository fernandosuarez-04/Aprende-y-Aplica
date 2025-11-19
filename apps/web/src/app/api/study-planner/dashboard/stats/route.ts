/**
 * API Route: GET /api/study-planner/dashboard/stats
 * Obtiene las estadísticas completas del dashboard para el usuario autenticado
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'

export async function GET(request: NextRequest) {
  try {
    // 1. Validar autenticación
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // 2. Obtener Supabase client
    const supabase = await createClient()

    // 3. Llamar a la función SQL que retorna todas las stats
    const { data, error } = await supabase.rpc('get_dashboard_stats', {
      p_user_id: user.usuario_id,
    })

    if (error) {
      console.error('Error al obtener dashboard stats:', error)
      return NextResponse.json(
        { error: 'Error al obtener estadísticas del dashboard' },
        { status: 500 }
      )
    }

    // 4. La función SQL retorna null para objetos vacíos, normalizamos
    const normalizedData = {
      streak: data?.streak || {
        current_streak: 0,
        longest_streak: 0,
        last_session_date: null,
        total_sessions_completed: 0,
        total_study_minutes: 0,
      },
      weekly_stats: data?.weekly_stats || {
        sessions_completed: 0,
        sessions_missed: 0,
        study_minutes: 0,
        days_with_activity: 0,
      },
      monthly_stats: data?.monthly_stats || {
        sessions_completed: 0,
        sessions_missed: 0,
        study_minutes: 0,
        days_with_activity: 0,
      },
      next_sessions: data?.next_sessions || [],
      daily_progress_last_30_days: data?.daily_progress_last_30_days || [],
    }

    return NextResponse.json(normalizedData, { status: 200 })
  } catch (error) {
    console.error('Error en GET /api/study-planner/dashboard/stats:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
