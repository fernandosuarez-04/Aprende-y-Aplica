/**
 * API Route: POST /api/study-planner/sessions/[id]/reschedule
 * Reprograma una sesión de estudio
 */

import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { StudyPlannerService } from '@/features/study-planner/services/studyPlannerService'
import { CalendarSyncService } from '@/features/study-planner/services/calendarSyncService'

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

    // 4. Verificar que la sesión existe y pertenece al usuario usando el servicio
    const session = await StudyPlannerService.getStudySessionById(params.id, user.usuario_id)

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada o no autorizada' },
        { status: 404 }
      )
    }

    // 5. Validar que la sesión no esté completada
    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'No se puede reprogramar una sesión completada' },
        { status: 400 }
      )
    }

    // 6. Construir las nuevas fechas/horas como timestamps ISO
    // Combinar fecha (YYYY-MM-DD) con hora (HH:MM) y convertir a ISO timestamp
    const startDateTime = new Date(`${body.new_date}T${body.new_start_time}:00`)
    const endDateTime = new Date(`${body.new_date}T${body.new_end_time}:00`)

    // Validar que las fechas sean válidas
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return NextResponse.json(
        { error: 'Fechas u horas inválidas' },
        { status: 400 }
      )
    }

    // Validar que end_time sea después de start_time
    if (endDateTime <= startDateTime) {
      return NextResponse.json(
        { error: 'La hora de fin debe ser posterior a la hora de inicio' },
        { status: 400 }
      )
    }

    // 7. Guardar la fecha/hora original para la respuesta
    const originalStartTime = new Date(session.start_time)
    const originalDate = originalStartTime.toISOString().split('T')[0]
    const originalTime = originalStartTime.toTimeString().slice(0, 5)

    // 8. Actualizar la sesión usando el servicio
    const updatedSession = await StudyPlannerService.updateStudySession(
      params.id,
      user.usuario_id,
      {
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        // Mantener el status actual si no está completada, o cambiarlo a 'planned' si estaba 'cancelled' o 'skipped'
        status: session.status === 'cancelled' || session.status === 'skipped' ? 'planned' : session.status,
      }
    )

    if (!updatedSession) {
      console.error('Error al reprogramar sesión')
      return NextResponse.json(
        { error: 'Error al reprogramar la sesión' },
        { status: 500 }
      )
    }

    // 9. Sincronizar con calendarios externos (actualizar fecha/hora del evento)
    try {
      const integrations = await StudyPlannerService.getCalendarIntegrations(user.usuario_id)
      const activeIntegrations = integrations.filter(integration => integration.access_token)
      
      if (activeIntegrations.length > 0 && updatedSession.external_event_id && updatedSession.calendar_provider) {
        const matchingIntegration = activeIntegrations.find(
          int => int.provider === updatedSession.calendar_provider
        )
        
        if (matchingIntegration) {
          // Actualizar el evento en el calendario externo con las nuevas fechas
          await CalendarSyncService.updateEvent(updatedSession, matchingIntegration)
          console.log(`[RESCHEDULE] Updated calendar event for session ${params.id} in ${matchingIntegration.provider}`)
        }
      }
    } catch (syncError) {
      console.error('[RESCHEDULE] Error syncing to calendar (non-blocking):', syncError)
      // No fallar la request si la sincronización falla
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Sesión reprogramada exitosamente',
        original_date: originalDate,
        original_time: originalTime,
        new_date: body.new_date,
        new_time: body.new_start_time,
        session: {
          id: updatedSession.id,
          start_time: updatedSession.start_time,
          end_time: updatedSession.end_time,
          status: updatedSession.status,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en POST /api/study-planner/sessions/[id]/reschedule:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
