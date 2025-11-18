/**
 * API Route: POST /api/study-planner/sessions/[id]/complete
 * Completa una sesión de estudio y actualiza el streak
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/core/services/session.service'
import { StudyPlannerService } from '@/features/study-planner/services/studyPlannerService'
import { CalendarSyncService } from '@/features/study-planner/services/calendarSyncService'
import type { StudySessionUpdate } from '@repo/shared/types'

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

    // 4. Verificar que la sesión existe y pertenece al usuario usando el servicio
    const session = await StudyPlannerService.getStudySessionById(params.id, user.usuario_id)

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada o no autorizada' },
        { status: 404 }
      )
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Esta sesión ya está completada' },
        { status: 400 }
      )
    }

    // 6. Completar la sesión usando el servicio
    // El trigger update_user_streak() se ejecutará automáticamente
    // Nota: notes y self_evaluation se guardan en metrics según el esquema
    const updateData: StudySessionUpdate = {
      status: 'completed' as const,
      actual_duration_minutes: body.actual_duration_minutes,
    }

    // Si hay notes o self_evaluation, guardarlos en metrics
    // metrics es JSONB, así que podemos agregar campos adicionales
    if (body.notes || body.self_evaluation !== undefined) {
      const currentMetrics = session.metrics || {}
      updateData.metrics = {
        ...currentMetrics,
        ...(body.notes && { notes: body.notes }),
        ...(body.self_evaluation !== undefined && { self_evaluation: body.self_evaluation }),
      } as typeof session.metrics
    }

    const updatedSession = await StudyPlannerService.updateStudySession(
      params.id,
      user.usuario_id,
      updateData
    )

    if (!updatedSession) {
      console.error('Error al completar sesión')
      return NextResponse.json(
        { error: 'Error al actualizar la sesión' },
        { status: 500 }
      )
    }

    // 7. Sincronizar con calendarios externos (actualizar evento como completado)
    try {
      const integrations = await StudyPlannerService.getCalendarIntegrations(user.usuario_id)
      const activeIntegrations = integrations.filter(integration => integration.access_token)
      
      if (activeIntegrations.length > 0 && updatedSession.external_event_id && updatedSession.calendar_provider) {
        const matchingIntegration = activeIntegrations.find(
          int => int.provider === updatedSession.calendar_provider
        )
        
        if (matchingIntegration) {
          // Actualizar el evento en el calendario externo
          await CalendarSyncService.updateEvent(updatedSession, matchingIntegration)
          console.log(`[COMPLETE] Updated calendar event for session ${params.id} in ${matchingIntegration.provider}`)
        }
      }
    } catch (syncError) {
      console.error('[COMPLETE] Error syncing to calendar (non-blocking):', syncError)
      // No fallar la request si la sincronización falla
    }

    // 8. Obtener el streak actualizado
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
