/**
 * API Route: GET /api/study-planner/streak
 * Obtiene el streak (racha) del usuario autenticado
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

    // 3. Obtener streak del usuario
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.usuario_id)
      .single()

    if (error) {
      // Si no existe registro, retornar streak vacío
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          {
            user_id: user.usuario_id,
            current_streak: 0,
            longest_streak: 0,
            last_session_date: null,
            total_sessions_completed: 0,
            total_study_minutes: 0,
            total_sessions_missed: 0,
            total_sessions_rescheduled: 0,
          },
          { status: 200 }
        )
      }

      console.error('Error al obtener streak:', error)
      return NextResponse.json({ error: 'Error al obtener racha' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error en GET /api/study-planner/streak:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
