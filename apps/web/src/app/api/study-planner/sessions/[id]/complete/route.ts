/**
 * API Route: POST /api/study-planner/sessions/[id]/complete
 * Completa una sesión de estudio y actualiza el streak
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/core/services/session.service'

interface CompleteSessionBody {
  actual_duration_minutes: number
  notes?: string
  self_evaluation?: number // 1-5
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Validar autenticación
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // 2. Parse body
    const body: CompleteSessionBody = await request.json()

    // 3. Validar datos
    if (!body.actual_duration_minutes || body.actual_duration_minutes <= 0) {
      return NextResponse.json(
        { error: 'La duración debe ser mayor a 0' },
        { status: 400 }
      )
    }

    if (
      body.self_evaluation !== undefined &&
      (body.self_evaluation < 1 || body.self_evaluation > 5)
    ) {
      return NextResponse.json(
        { error: 'La evaluación debe estar entre 1 y 5' },
        { status: 400 }
      )
    }

    // 4. Obtener Supabase client
    const supabase = await createClient()

    // 5. Verificar que la sesión existe y pertenece al usuario
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .select('session_id, user_id, duration_minutes, completion_status')
      .eq('session_id', params.id)
      .eq('user_id', user.usuario_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada o no autorizada' },
        { status: 404 }
      )
    }

    if (session.completion_status === 'completed') {
      return NextResponse.json(
        { error: 'Esta sesión ya está completada' },
        { status: 400 }
      )
    }

    // 6. Completar la sesión
    // El trigger update_user_streak() se ejecutará automáticamente
    const { error: updateError } = await supabase
      .from('study_sessions')
      .update({
        completion_status: 'completed',
        completed_at: new Date().toISOString(),
        actual_duration_minutes: body.actual_duration_minutes,
        notes: body.notes || null,
        self_evaluation: body.self_evaluation || null,
      })
      .eq('session_id', params.id)

    if (updateError) {
      console.error('Error al completar sesión:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar la sesión' },
        { status: 500 }
      )
    }

    // 7. Obtener el streak actualizado
    const { data: streak, error: streakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.usuario_id)
      .single()

    if (streakError) {
      console.warn('Streak no encontrado (será creado por el trigger):', streakError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Sesión completada exitosamente',
        streak: streak || null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en POST /api/study-planner/sessions/[id]/complete:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
