import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import { NotificationService, NotificationFilters } from '@/features/notifications/services/notification.service'
import { logger } from '@/lib/logger'

/**
 * GET /api/notifications
 * Obtiene las notificaciones del usuario autenticado
 * 
 * Query params:
 * - status: 'unread' | 'read' | 'archived'
 * - type: Tipo de notificación
 * - priority: 'critical' | 'high' | 'medium' | 'low'
 * - limit: Número de resultados (default: 50)
 * - offset: Offset para paginación (default: 0)
 * - orderBy: 'created_at' | 'priority' | 'status' (default: 'created_at')
 * - orderDirection: 'asc' | 'desc' (default: 'desc')
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

    // Obtener query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'unread' | 'read' | 'archived' | null
    const notificationType = searchParams.get('type') || undefined
    const priority = searchParams.get('priority') as 'critical' | 'high' | 'medium' | 'low' | null
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const orderBy = (searchParams.get('orderBy') || 'created_at') as 'created_at' | 'priority' | 'status'
    const orderDirection = (searchParams.get('orderDirection') || 'desc') as 'asc' | 'desc'

    // Construir filtros
    const filters: NotificationFilters = {
      status: status || undefined,
      notificationType,
      priority: priority || undefined,
      limit,
      offset,
      orderBy,
      orderDirection
    }

    // Obtener notificaciones
    const { notifications, total } = await NotificationService.getUserNotifications(
      user.id,
      filters
    )

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    logger.error('Error en GET /api/notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener notificaciones'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications
 * Crea una nueva notificación (solo para uso interno del sistema)
 * 
 * Body:
 * - userId: ID del usuario destinatario
 * - notificationType: Tipo de notificación
 * - title: Título de la notificación
 * - message: Mensaje de la notificación
 * - metadata: Datos adicionales (opcional)
 * - priority: Prioridad (opcional, default: 'medium')
 * - organizationId: ID de organización (opcional)
 * - groupId: ID de grupo (opcional)
 */
export async function POST(request: NextRequest) {
  try {
    // Obtener usuario autenticado (para verificar permisos)
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Solo administradores pueden crear notificaciones manualmente
    // O se puede usar para crear notificaciones del sistema
    const body = await request.json()
    const {
      userId,
      notificationType,
      title,
      message,
      metadata,
      priority,
      organizationId,
      groupId
    } = body

    // Validaciones básicas
    if (!userId || !notificationType || !title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos: userId, notificationType, title, message'
        },
        { status: 400 }
      )
    }

    // Crear notificación
    const notification = await NotificationService.createNotification({
      userId,
      notificationType,
      title,
      message,
      metadata,
      priority,
      organizationId,
      groupId
    })

    return NextResponse.json({
      success: true,
      data: notification
    }, { status: 201 })
  } catch (error) {
    logger.error('Error en POST /api/notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear notificación'
      },
      { status: 500 }
    )
  }
}

