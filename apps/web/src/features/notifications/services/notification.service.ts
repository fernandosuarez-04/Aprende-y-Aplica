import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { SessionService } from '@/features/auth/services/session.service'

/**
 * Interfaz para crear una notificación
 */
export interface CreateNotificationParams {
  userId: string
  notificationType: string
  title: string
  message: string
  metadata?: Record<string, any>
  priority?: 'critical' | 'high' | 'medium' | 'low'
  organizationId?: string
  groupId?: string
}

/**
 * Interfaz de notificación devuelta por el servicio
 */
export interface Notification {
  notification_id: string
  user_id: string
  notification_type: string
  title: string
  message: string
  metadata: Record<string, any>
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'unread' | 'read' | 'archived'
  channels_sent: string[]
  channels_pending: string[]
  read_at: string | null
  expires_at: string | null
  organization_id: string | null
  group_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Interfaz para filtros de búsqueda de notificaciones
 */
export interface NotificationFilters {
  status?: 'unread' | 'read' | 'archived'
  notificationType?: string
  priority?: 'critical' | 'high' | 'medium' | 'low'
  limit?: number
  offset?: number
  orderBy?: 'created_at' | 'priority' | 'status'
  orderDirection?: 'asc' | 'desc'
}

/**
 * Servicio para gestionar notificaciones
 */
export class NotificationService {
  /**
   * Crea una nueva notificación
   */
  static async createNotification(
    params: CreateNotificationParams
  ): Promise<Notification> {
    try {
      const supabase = await createClient()
      
      const {
        userId,
        notificationType,
        title,
        message,
        metadata = {},
        priority = 'medium',
        organizationId,
        groupId
      } = params

      // Validaciones básicas
      if (!userId || !notificationType || !title || !message) {
        throw new Error('Faltan campos requeridos para crear la notificación')
      }

      // Crear la notificación en la base de datos
      // expires_at se calcula automáticamente por el trigger según el rol del usuario
      const { data: notification, error } = await supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          notification_type: notificationType,
          title: title.trim(),
          message: message.trim(),
          metadata: metadata,
          priority: priority,
          status: 'unread',
          channels_sent: [],
          channels_pending: [],
          organization_id: organizationId || null,
          group_id: groupId || null
        })
        .select()
        .single()

      if (error) {
        logger.error('Error creando notificación:', error)
        throw new Error(`Error al crear notificación: ${error.message}`)
      }

      logger.info('✅ Notificación creada exitosamente', {
        notificationId: notification.notification_id,
        userId,
        type: notificationType
      })

      return notification as Notification
    } catch (error) {
      logger.error('❌ Error en createNotification:', error)
      throw error
    }
  }

  /**
   * Obtiene las notificaciones de un usuario con filtros opcionales
   */
  static async getUserNotifications(
    userId: string,
    filters?: NotificationFilters
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const supabase = await createClient()

      const {
        status,
        notificationType,
        priority,
        limit = 50,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = filters || {}

      // Construir query base
      let query = supabase
        .from('user_notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      // Aplicar filtros
      if (status) {
        query = query.eq('status', status)
      }

      if (notificationType) {
        query = query.eq('notification_type', notificationType)
      }

      if (priority) {
        query = query.eq('priority', priority)
      }

      // Filtrar notificaciones expiradas (solo las que no han expirado)
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())

      // Ordenamiento
      if (orderBy === 'priority') {
        // Ordenamiento por prioridad requiere lógica especial
        // Por ahora ordenamos por created_at y luego aplicamos lógica en memoria
        query = query.order('created_at', { ascending: orderDirection === 'asc' })
      } else {
        query = query.order(orderBy, { ascending: orderDirection === 'asc' })
      }

      // Paginación
      query = query.range(offset, offset + limit - 1)

      const { data: notifications, error, count } = await query

      if (error) {
        logger.error('Error obteniendo notificaciones:', error)
        throw new Error(`Error al obtener notificaciones: ${error.message}`)
      }

      // Ordenar por prioridad si es necesario (en memoria)
      let sortedNotifications = notifications || []
      if (orderBy === 'priority') {
        const priorityOrder: Record<string, number> = {
          critical: 1,
          high: 2,
          medium: 3,
          low: 4
        }
        sortedNotifications = sortedNotifications.sort((a, b) => {
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
          if (priorityDiff !== 0) return priorityDiff
          // Si misma prioridad, ordenar por fecha
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        if (orderDirection === 'asc') {
          sortedNotifications = sortedNotifications.reverse()
        }
      }

      return {
        notifications: sortedNotifications as Notification[],
        total: count || 0
      }
    } catch (error) {
      logger.error('❌ Error en getUserNotifications:', error)
      throw error
    }
  }

  /**
   * Obtiene el conteo de notificaciones no leídas de un usuario
   */
  static async getUnreadCount(userId: string): Promise<{
    total: number
    critical: number
    high: number
  }> {
    try {
      const supabase = await createClient()

      // Obtener conteo usando la vista optimizada
      const { data, error } = await supabase
        .from('user_unread_notifications_count')
        .select('unread_count, critical_count, high_count')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, es válido (significa 0)
        logger.error('Error obteniendo conteo de no leídas:', error)
        throw new Error(`Error al obtener conteo: ${error.message}`)
      }

      return {
        total: data?.unread_count || 0,
        critical: data?.critical_count || 0,
        high: data?.high_count || 0
      }
    } catch (error) {
      logger.error('❌ Error en getUnreadCount:', error)
      throw error
    }
  }

  /**
   * Marca una notificación como leída
   */
  static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<Notification> {
    try {
      const supabase = await createClient()

      // Verificar que la notificación pertenece al usuario
      const { data: existing, error: checkError } = await supabase
        .from('user_notifications')
        .select('notification_id, status')
        .eq('notification_id', notificationId)
        .eq('user_id', userId)
        .single()

      if (checkError || !existing) {
        throw new Error('Notificación no encontrada o no pertenece al usuario')
      }

      // Si ya está leída, retornar sin cambios
      if (existing.status === 'read') {
        const { data: notification } = await supabase
          .from('user_notifications')
          .select('*')
          .eq('notification_id', notificationId)
          .single()
        return notification as Notification
      }

      // Marcar como leída
      const { data: notification, error } = await supabase
        .from('user_notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('notification_id', notificationId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        logger.error('Error marcando notificación como leída:', error)
        throw new Error(`Error al marcar como leída: ${error.message}`)
      }

      logger.info('✅ Notificación marcada como leída', {
        notificationId,
        userId
      })

      return notification as Notification
    } catch (error) {
      logger.error('❌ Error en markAsRead:', error)
      throw error
    }
  }

  /**
   * Marca múltiples notificaciones como leídas
   */
  static async markMultipleAsRead(
    notificationIds: string[],
    userId: string
  ): Promise<{ updated: number }> {
    try {
      const supabase = await createClient()

      if (!notificationIds || notificationIds.length === 0) {
        return { updated: 0 }
      }

      // Actualizar todas las notificaciones que pertenecen al usuario
      const { data, error } = await supabase
        .from('user_notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .in('notification_id', notificationIds)
        .eq('user_id', userId)
        .eq('status', 'unread')
        .select('notification_id')

      if (error) {
        logger.error('Error marcando notificaciones como leídas:', error)
        throw new Error(`Error al marcar como leídas: ${error.message}`)
      }

      const updated = data?.length || 0

      logger.info('✅ Notificaciones marcadas como leídas', {
        count: updated,
        userId
      })

      return { updated }
    } catch (error) {
      logger.error('❌ Error en markMultipleAsRead:', error)
      throw error
    }
  }

  /**
   * Archiva una notificación
   */
  static async archiveNotification(
    notificationId: string,
    userId: string
  ): Promise<Notification> {
    try {
      const supabase = await createClient()

      // Verificar que la notificación pertenece al usuario
      const { data: existing, error: checkError } = await supabase
        .from('user_notifications')
        .select('notification_id')
        .eq('notification_id', notificationId)
        .eq('user_id', userId)
        .single()

      if (checkError || !existing) {
        throw new Error('Notificación no encontrada o no pertenece al usuario')
      }

      // Archivar
      const { data: notification, error } = await supabase
        .from('user_notifications')
        .update({
          status: 'archived'
        })
        .eq('notification_id', notificationId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        logger.error('Error archivando notificación:', error)
        throw new Error(`Error al archivar: ${error.message}`)
      }

      logger.info('✅ Notificación archivada', {
        notificationId,
        userId
      })

      return notification as Notification
    } catch (error) {
      logger.error('❌ Error en archiveNotification:', error)
      throw error
    }
  }

  /**
   * Elimina una notificación
   */
  static async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    try {
      const supabase = await createClient()

      // Verificar que la notificación pertenece al usuario
      const { data: existing, error: checkError } = await supabase
        .from('user_notifications')
        .select('notification_id')
        .eq('notification_id', notificationId)
        .eq('user_id', userId)
        .single()

      if (checkError || !existing) {
        throw new Error('Notificación no encontrada o no pertenece al usuario')
      }

      // Eliminar
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('notification_id', notificationId)
        .eq('user_id', userId)

      if (error) {
        logger.error('Error eliminando notificación:', error)
        throw new Error(`Error al eliminar: ${error.message}`)
      }

      logger.info('✅ Notificación eliminada', {
        notificationId,
        userId
      })
    } catch (error) {
      logger.error('❌ Error en deleteNotification:', error)
      throw error
    }
  }

  /**
   * Marca todas las notificaciones no leídas del usuario como leídas
   */
  static async markAllAsRead(userId: string): Promise<{ updated: number }> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('user_notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'unread')
        .select('notification_id')

      if (error) {
        logger.error('Error marcando todas como leídas:', error)
        throw new Error(`Error al marcar todas como leídas: ${error.message}`)
      }

      const updated = data?.length || 0

      logger.info('✅ Todas las notificaciones marcadas como leídas', {
        count: updated,
        userId
      })

      return { updated }
    } catch (error) {
      logger.error('❌ Error en markAllAsRead:', error)
      throw error
    }
  }
}


