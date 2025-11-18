/**
 * API Route: POST /api/study-planner/sessions/[id]/reschedule
 * Reprograma una sesión de estudio
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/core/services/session.service'

interface RescheduleSessionBody {
  new_date: string // YYYY-MM-DD
  new_start_time: string // HH:MM
  new_end_time: string // HH:MM
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
    const body: RescheduleSessionBody = await request.json()

    // 3. Validar datos
    if (!body.new_date || !body.new_start_time || !body.new_end_time) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos (new_date, new_start_time, new_end_time)' },
        { status: 400 }
      )
    }

    // 4. Obtener Supabase client
    const supabase = await createClient()

    // 5. Verificar que la sesión existe y pertenece al usuario
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .select('scheduled_date, scheduled_start_time, completion_status')
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
        { error: 'No se puede reprogramar una sesión completada' },
        { status: 400 }
      )
    }

    // 6. Guardar la fecha original
    const originalDateTime = `${session.scheduled_date} ${session.scheduled_start_time}`

    // 7. Marcar como reprogramada y actualizar fechas
    const { error: updateError } = await supabase
      .from('study_sessions')
      .update({
        completion_status: 'rescheduled',
        was_rescheduled: true,
        rescheduled_from: originalDateTime,
        scheduled_date: body.new_date,
        scheduled_start_time: body.new_start_time,
        scheduled_end_time: body.new_end_time,
      })
      .eq('session_id', params.id)

    if (updateError) {
      console.error('Error al reprogramar sesión:', updateError)
      return NextResponse.json(
        { error: 'Error al reprogramar la sesión' },
        { status: 500 }
      )
    }

    // 8. Volver a estado pending para que se pueda completar
    await supabase
      .from('study_sessions')
      .update({ completion_status: 'pending' })
      .eq('session_id', params.id)

    return NextResponse.json(
      {
        success: true,
        message: 'Sesión reprogramada exitosamente',
        original_date: session.scheduled_date,
        original_time: session.scheduled_start_time,
        new_date: body.new_date,
        new_time: body.new_start_time,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en POST /api/study-planner/sessions/[id]/reschedule:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
