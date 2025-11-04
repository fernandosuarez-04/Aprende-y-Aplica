import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { NotificationService } from '@/features/notifications/services/notification.service'
import { logger } from '@/lib/logger'

/**
 * POST /api/notifications/[id]/read
 * Marca una notificación como leída
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Obtener usuario autenticado
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id: notificationId } = await params

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID de notificación requerido'
        },
        { status: 400 }
      )
    }

    // Marcar como leída
    const notification = await NotificationService.markAsRead(
      notificationId,
      user.id
    )

    return NextResponse.json({
      success: true,
      data: notification
    })
  } catch (error) {
    logger.error('Error en POST /api/notifications/[id]/read:', error)
    
    // Si la notificación no existe o no pertenece al usuario
    if (error instanceof Error && error.message.includes('no encontrada')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al marcar notificación como leída'
      },
      { status: 500 }
    )
  }
}

