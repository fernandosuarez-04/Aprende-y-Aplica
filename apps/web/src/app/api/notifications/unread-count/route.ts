import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { NotificationService } from '@/features/notifications/services/notification.service'
import { logger } from '@/lib/logger'

/**
 * GET /api/notifications/unread-count
 * Obtiene el conteo de notificaciones no leídas del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener usuario autenticado
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener conteo de no leídas
    const counts = await NotificationService.getUnreadCount(user.id)

    return NextResponse.json({
      success: true,
      data: counts
    })
  } catch (error) {
    logger.error('Error en GET /api/notifications/unread-count:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener conteo de notificaciones'
      },
      { status: 500 }
    )
  }
}

