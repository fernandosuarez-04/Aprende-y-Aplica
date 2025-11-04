import { NotificationService, CreateNotificationParams } from './notification.service'
import { getNotificationPriority } from '../utils/notification-categories'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * Servicio para crear notificaciones automáticas
 */
export class AutoNotificationsService {
  /**
   * Crea una notificación del sistema para cambio de contraseña
   */
  static async notifyPasswordChanged(userId: string, metadata?: Record<string, any>): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        notificationType: 'system_password_changed',
        title: 'Contraseña actualizada',
        message: 'Tu contraseña ha sido actualizada exitosamente. Si no fuiste tú, contacta al soporte inmediatamente.',
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('system_password_changed')
      })
      logger.info('✅ Notificación de cambio de contraseña creada', { userId })
    } catch (error) {
      logger.error('❌ Error creando notificación de cambio de contraseña:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Mapeo de nombres de columnas a nombres amigables en español
   */
  private static readonly FIELD_DISPLAY_NAMES: Record<string, string> = {
    username: 'Nombre de usuario',
    email: 'Correo electrónico',
    first_name: 'Nombre',
    last_name: 'Apellido',
    display_name: 'Nombre de visualización',
    phone: 'Teléfono',
    bio: 'Biografía',
    location: 'Ubicación',
    cargo_rol: 'Cargo',
    type_rol: 'Cargo de la empresa',
    profile_picture_url: 'Foto de perfil',
    curriculum_url: 'Currículum',
    linkedin_url: 'LinkedIn',
    github_url: 'GitHub',
    website_url: 'Sitio web',
    country_code: 'País',
    points: 'Puntos'
  }

  /**
   * Obtiene el nombre amigable de un campo
   */
  private static getFieldDisplayName(fieldName: string): string {
    return this.FIELD_DISPLAY_NAMES[fieldName] || fieldName
  }

  /**
   * Crea una notificación del sistema para cambio de perfil
   */
  static async notifyProfileUpdated(userId: string, changes: string[], metadata?: Record<string, any>): Promise<void> {
    try {
      // Filtrar campos que no deben mostrarse (campos del sistema)
      const excludedFields = ['id', 'updated_at', 'created_at', 'last_login_at']
      const displayableChanges = changes.filter(field => !excludedFields.includes(field))
      
      if (displayableChanges.length === 0) {
        // No crear notificación si no hay cambios visibles
        return
      }
      
      // Convertir nombres de columnas a nombres amigables
      const friendlyNames = displayableChanges.map(field => this.getFieldDisplayName(field))
      
      let changesText: string
      if (friendlyNames.length === 1) {
        changesText = `Se actualizó: ${friendlyNames[0]}`
      } else if (friendlyNames.length === 2) {
        changesText = `Se actualizaron: ${friendlyNames[0]} y ${friendlyNames[1]}`
      } else {
        const lastField = friendlyNames.pop()
        changesText = `Se actualizaron: ${friendlyNames.join(', ')} y ${lastField}`
      }
      
      await NotificationService.createNotification({
        userId,
        notificationType: 'system_profile_updated',
        title: 'Perfil actualizado',
        message: changesText,
        metadata: {
          ...metadata,
          changes: displayableChanges,
          friendly_changes: friendlyNames,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('system_profile_updated')
      })
      logger.info('✅ Notificación de actualización de perfil creada', { userId, changes: displayableChanges })
    } catch (error) {
      logger.error('❌ Error creando notificación de actualización de perfil:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea una notificación del sistema para inicio de sesión exitoso
   */
  static async notifyLoginSuccess(userId: string, ip?: string, userAgent?: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const location = ip || 'Ubicación desconocida'
      
      await NotificationService.createNotification({
        userId,
        notificationType: 'system_login_success',
        title: 'Inicio de sesión exitoso',
        message: `Se inició sesión en tu cuenta desde ${location}. Si no fuiste tú, cambia tu contraseña inmediatamente.`,
        metadata: {
          ...metadata,
          ip,
          userAgent,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('system_login_success')
      })
      logger.info('✅ Notificación de inicio de sesión creada', { userId, ip })
    } catch (error) {
      logger.error('❌ Error creando notificación de inicio de sesión:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea una notificación del sistema para intento de inicio de sesión fallido
   */
  static async notifyLoginFailed(userId: string, ip?: string, userAgent?: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const location = ip || 'Ubicación desconocida'
      
      await NotificationService.createNotification({
        userId,
        notificationType: 'system_login_failed',
        title: 'Intento de inicio de sesión fallido',
        message: `Se detectó un intento de inicio de sesión fallido desde ${location}. Si fuiste tú, verifica tus credenciales.`,
        metadata: {
          ...metadata,
          ip,
          userAgent,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('system_login_failed')
      })
      logger.info('✅ Notificación de inicio de sesión fallido creada', { userId, ip })
    } catch (error) {
      logger.error('❌ Error creando notificación de inicio de sesión fallido:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea una notificación del sistema para verificación de email
   */
  static async notifyEmailVerified(userId: string, metadata?: Record<string, any>): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        notificationType: 'system_email_verified',
        title: 'Email verificado',
        message: 'Tu dirección de correo electrónico ha sido verificada exitosamente.',
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('system_email_verified')
      })
      logger.info('✅ Notificación de verificación de email creada', { userId })
    } catch (error) {
      logger.error('❌ Error creando notificación de verificación de email:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea una notificación del sistema para alerta de seguridad
   */
  static async notifySecurityAlert(userId: string, message: string, metadata?: Record<string, any>): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        notificationType: 'system_security_alert',
        title: 'Alerta de seguridad',
        message,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('system_security_alert')
      })
      logger.info('✅ Notificación de alerta de seguridad creada', { userId })
    } catch (error) {
      logger.error('❌ Error creando notificación de alerta de seguridad:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea notificaciones para miembros de una comunidad cuando se crea un post
   */
  static async notifyCommunityPostCreated(
    postId: string,
    communityId: string,
    authorId: string,
    postTitle: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Obtener todos los miembros de la comunidad excepto el autor
      const { data: members, error } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', communityId)
        .eq('is_active', true)
        .neq('user_id', authorId)

      if (error) {
        logger.error('Error obteniendo miembros de comunidad:', error)
        return
      }

      if (!members || members.length === 0) {
        logger.info('No hay miembros para notificar sobre el post', { postId, communityId })
        return
      }

      // Obtener información del autor
      const { data: author } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', authorId)
        .single()

      const authorName = author?.display_name || author?.first_name || author?.username || 'Un usuario'

      // Crear notificaciones para cada miembro
      const notifications = members.map(member => ({
        userId: member.user_id,
        notificationType: 'community_post_created',
        title: 'Nuevo post en la comunidad',
        message: `${authorName} publicó "${postTitle}" en la comunidad`,
        metadata: {
          ...metadata,
          post_id: postId,
          community_id: communityId,
          author_id: authorId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('community_post_created')
      }))

      // Crear notificaciones en batch
      for (const notification of notifications) {
        await NotificationService.createNotification(notification)
      }

      logger.info('✅ Notificaciones de post de comunidad creadas', {
        postId,
        communityId,
        count: notifications.length
      })
    } catch (error) {
      logger.error('❌ Error creando notificaciones de post de comunidad:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea notificaciones para usuarios cuando se publica un curso
   */
  static async notifyCoursePublished(
    courseId: string,
    courseTitle: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Obtener todos los usuarios activos
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('is_banned', false)
        .limit(1000) // Limitar para no sobrecargar

      if (error) {
        logger.error('Error obteniendo usuarios para notificar curso:', error)
        return
      }

      if (!users || users.length === 0) {
        logger.info('No hay usuarios para notificar sobre el curso', { courseId })
        return
      }

      // Crear notificaciones para cada usuario
      const notifications = users.map(user => ({
        userId: user.id,
        notificationType: 'course_published',
        title: 'Nuevo curso disponible',
        message: `Se ha publicado el curso "${courseTitle}". ¡No te lo pierdas!`,
        metadata: {
          ...metadata,
          course_id: courseId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('course_published')
      }))

      // Crear notificaciones en batch (limitado a 100 por vez)
      const batchSize = 100
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize)
        for (const notification of batch) {
          await NotificationService.createNotification(notification)
        }
      }

      logger.info('✅ Notificaciones de curso publicado creadas', {
        courseId,
        count: notifications.length
      })
    } catch (error) {
      logger.error('❌ Error creando notificaciones de curso publicado:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea una notificación para un usuario cuando se inscribe en un curso
   */
  static async notifyCourseEnrolled(
    userId: string,
    courseId: string,
    courseTitle: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        notificationType: 'course_enrolled',
        title: 'Te has inscrito en un curso',
        message: `Te has inscrito exitosamente en "${courseTitle}". ¡Comienza a aprender ahora!`,
        metadata: {
          ...metadata,
          course_id: courseId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('course_enrolled')
      })
      logger.info('✅ Notificación de inscripción en curso creada', { userId, courseId })
    } catch (error) {
      logger.error('❌ Error creando notificación de inscripción en curso:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea notificaciones para usuarios cuando se publica una noticia
   */
  static async notifyNewsPublished(
    newsId: string,
    newsTitle: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Obtener todos los usuarios activos
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('is_banned', false)
        .limit(1000) // Limitar para no sobrecargar

      if (error) {
        logger.error('Error obteniendo usuarios para notificar noticia:', error)
        return
      }

      if (!users || users.length === 0) {
        logger.info('No hay usuarios para notificar sobre la noticia', { newsId })
        return
      }

      // Crear notificaciones para cada usuario
      const notifications = users.map(user => ({
        userId: user.id,
        notificationType: 'news_published',
        title: 'Nueva noticia publicada',
        message: `Lee la nueva noticia: "${newsTitle}"`,
        metadata: {
          ...metadata,
          news_id: newsId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('news_published')
      }))

      // Crear notificaciones en batch (limitado a 100 por vez)
      const batchSize = 100
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize)
        for (const notification of batch) {
          await NotificationService.createNotification(notification)
        }
      }

      logger.info('✅ Notificaciones de noticia publicada creadas', {
        newsId,
        count: notifications.length
      })
    } catch (error) {
      logger.error('❌ Error creando notificaciones de noticia publicada:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea notificaciones para usuarios cuando se crea un reel
   */
  static async notifyReelCreated(
    reelId: string,
    reelTitle: string,
    authorId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Obtener usuarios con intereses relacionados (simplificado: todos los usuarios activos)
      // En producción, aquí se podría filtrar por intereses, categorías, etc.
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('is_banned', false)
        .neq('id', authorId) // Excluir al autor
        .limit(500) // Limitar para no sobrecargar

      if (error) {
        logger.error('Error obteniendo usuarios para notificar reel:', error)
        return
      }

      if (!users || users.length === 0) {
        logger.info('No hay usuarios para notificar sobre el reel', { reelId })
        return
      }

      // Obtener información del autor
      const { data: author } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', authorId)
        .single()

      const authorName = author?.display_name || author?.first_name || author?.username || 'Un usuario'

      // Crear notificaciones para cada usuario
      const notifications = users.map(user => ({
        userId: user.id,
        notificationType: 'reel_created',
        title: 'Nuevo reel disponible',
        message: `${authorName} publicó un nuevo reel: "${reelTitle}"`,
        metadata: {
          ...metadata,
          reel_id: reelId,
          author_id: authorId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('reel_created')
      }))

      // Crear notificaciones en batch (limitado a 100 por vez)
      const batchSize = 100
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize)
        for (const notification of batch) {
          await NotificationService.createNotification(notification)
        }
      }

      logger.info('✅ Notificaciones de reel creado creadas', {
        reelId,
        count: notifications.length
      })
    } catch (error) {
      logger.error('❌ Error creando notificaciones de reel creado:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea notificaciones para usuarios cuando se crea un prompt
   */
  static async notifyPromptCreated(
    promptId: string,
    promptTitle: string,
    authorId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Obtener usuarios interesados en prompts de IA (simplificado: usuarios activos)
      // En producción, aquí se podría filtrar por intereses en IA
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('is_banned', false)
        .neq('id', authorId) // Excluir al autor
        .limit(500) // Limitar para no sobrecargar

      if (error) {
        logger.error('Error obteniendo usuarios para notificar prompt:', error)
        return
      }

      if (!users || users.length === 0) {
        logger.info('No hay usuarios para notificar sobre el prompt', { promptId })
        return
      }

      // Obtener información del autor
      const { data: author } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', authorId)
        .single()

      const authorName = author?.display_name || author?.first_name || author?.username || 'Un usuario'

      // Crear notificaciones para cada usuario
      const notifications = users.map(user => ({
        userId: user.id,
        notificationType: 'prompt_created',
        title: 'Nuevo prompt de IA disponible',
        message: `${authorName} creó un nuevo prompt: "${promptTitle}"`,
        metadata: {
          ...metadata,
          prompt_id: promptId,
          author_id: authorId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('prompt_created')
      }))

      // Crear notificaciones en batch (limitado a 100 por vez)
      const batchSize = 100
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize)
        for (const notification of batch) {
          await NotificationService.createNotification(notification)
        }
      }

      logger.info('✅ Notificaciones de prompt creado creadas', {
        promptId,
        count: notifications.length
      })
    } catch (error) {
      logger.error('❌ Error creando notificaciones de prompt creado:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }
}

