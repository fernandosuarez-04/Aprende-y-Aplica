import { NotificationService, CreateNotificationParams } from './notification.service'
import { getNotificationPriority } from '../utils/notification-categories'
import { logger } from '@/lib/logger'

// Import dinámico de createClient para evitar problemas en build
// Solo se importa cuando se necesita usar (server-side)
// Usamos una técnica de importación que webpack no puede analizar estáticamente
async function getServerClient() {
  // Verificar que estamos en el servidor
  if (typeof window !== 'undefined') {
    throw new Error('getServerClient can only be used on the server')
  }
  
  // Usar import dinámico con una ruta construida en tiempo de ejecución
  // Esto evita que webpack analice el módulo durante el build
  const serverModulePath = ['@', 'lib', 'supabase', 'server'].join('/')
  const module = await import(serverModulePath)
  return await module.createClient()
}

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
      logger.info('🔔 notifyLoginSuccess llamado', { userId, ip })
      const location = ip || 'Ubicación desconocida'
      
      // Verificar si es usuario OAuth (no debe recibir notificación, ya es obligatorio)
      const { QuestionnaireValidationService } = await import('../../auth/services/questionnaire-validation.service')
      const isOAuthUser = await QuestionnaireValidationService.isGoogleOAuthUser(userId)
      
      // Solo crear notificación para usuarios NORMALES (no OAuth) que necesiten cuestionario
      if (!isOAuthUser) {
        logger.info('🔍 Verificando si usuario normal necesita cuestionario', { userId })
        const normalUserNeedsQuestionnaire = await QuestionnaireValidationService.normalUserNeedsQuestionnaire(userId)
        logger.info('📋 Resultado de normalUserNeedsQuestionnaire', { userId, normalUserNeedsQuestionnaire })
        
        // Si es usuario normal y necesita cuestionario, crear notificación
        if (normalUserNeedsQuestionnaire) {
          logger.info('✅ Usuario normal requiere cuestionario, creando notificación', { userId })
          try {
            logger.info('📝 Llamando a NotificationService.createNotification', { 
              userId, 
              notificationType: 'questionnaire_required',
              priority: 'critical'
            })
            const notification = await NotificationService.createNotification({
              userId,
              notificationType: 'questionnaire_required',
              title: 'Cuestionario pendiente',
              message: 'Para acceder a todas las funcionalidades, necesitas completar el cuestionario de perfil profesional. Haz clic aquí para comenzar.',
              metadata: {
                ...metadata,
                ip,
                userAgent,
                timestamp: new Date().toISOString(),
                actionUrl: '/statistics'
              },
              priority: 'critical'
            })
            logger.info('✅ Notificación de cuestionario requerido creada exitosamente', { 
              userId, 
              notificationId: notification?.notification_id || 'N/A'
            })
          } catch (notificationError) {
            // Si hay error de duplicado, no es crítico - solo loguear
            if (notificationError instanceof Error && notificationError.message.includes('duplicada')) {
              logger.info('⏭️ Notificación de cuestionario duplicada evitada', { userId })
            } else {
              logger.error('❌ Error creando notificación de cuestionario:', {
                userId,
                error: notificationError instanceof Error ? notificationError.message : String(notificationError),
                stack: notificationError instanceof Error ? notificationError.stack : undefined
              })
            }
          }
          return // No crear notificación de login si necesita cuestionario
        } else {
          logger.info('ℹ️ Usuario normal no necesita cuestionario o ya lo completó', { userId })
        }
      } else {
        logger.info('ℹ️ Usuario OAuth - no se crea notificación (ya es obligatorio)', { userId })
      }
      
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
      const supabase = await getServerClient()
      
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
      const supabase = await getServerClient()
      
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
      const supabase = await getServerClient()
      
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
      const supabase = await getServerClient()
      
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
      const supabase = await getServerClient()
      
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

  /**
   * Crea una notificación cuando se comenta un post de comunidad
   * Notifica al autor del post (no al que comenta)
   */
  static async notifyCommunityPostComment(
    postId: string,
    commentId: string,
    postAuthorId: string,
    commentAuthorId: string,
    commentPreview: string,
    communityId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // No notificar si el autor del comentario es el mismo que el autor del post
      if (postAuthorId === commentAuthorId) {
        return
      }

      const supabase = await getServerClient()

      // Obtener información del autor del comentario
      const { data: commentAuthor } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', commentAuthorId)
        .single()

      const commentAuthorName = commentAuthor?.display_name || commentAuthor?.first_name || commentAuthor?.username || 'Un usuario'

      // Obtener información del post
      const { data: post } = await supabase
        .from('community_posts')
        .select('title')
        .eq('id', postId)
        .single()

      const postTitle = post?.title || 'tu post'

      // Truncar preview del comentario si es muy largo
      const truncatedPreview = commentPreview.length > 100 
        ? commentPreview.substring(0, 100) + '...'
        : commentPreview

      await NotificationService.createNotification({
        userId: postAuthorId,
        notificationType: 'community_post_comment',
        title: 'Nuevo comentario en tu post',
        message: `${commentAuthorName} comentó en "${postTitle}": "${truncatedPreview}"`,
        metadata: {
          ...metadata,
          post_id: postId,
          comment_id: commentId,
          community_id: communityId,
          comment_author_id: commentAuthorId,
          comment_preview: truncatedPreview,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('community_post_comment')
      })

      logger.info('✅ Notificación de comentario en post creada', {
        postId,
        commentId,
        postAuthorId,
        commentAuthorId
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de comentario en post:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea una notificación cuando se reacciona a un post de comunidad
   * Notifica al autor del post
   */
  static async notifyCommunityPostReaction(
    postId: string,
    postAuthorId: string,
    reactionAuthorId: string,
    reactionType: string,
    communityId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // No notificar si el autor de la reacción es el mismo que el autor del post
      if (postAuthorId === reactionAuthorId) {
        return
      }

      const supabase = await getServerClient()

      // Obtener información del autor de la reacción
      const { data: reactionAuthor } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', reactionAuthorId)
        .single()

      const reactionAuthorName = reactionAuthor?.display_name || reactionAuthor?.first_name || reactionAuthor?.username || 'Un usuario'

      // Mapeo de tipos de reacción a texto amigable
      const reactionText: Record<string, string> = {
        'like': 'le gustó',
        'love': 'le encantó',
        'laugh': 'se rió de',
        'wow': 'se sorprendió con',
        'sad': 'se entristeció con',
        'angry': 'se enojó con'
      }

      const reactionVerb = reactionText[reactionType] || 'reaccionó a'

      // Obtener información del post
      const { data: post } = await supabase
        .from('community_posts')
        .select('title')
        .eq('id', postId)
        .single()

      const postTitle = post?.title || 'tu post'

      await NotificationService.createNotification({
        userId: postAuthorId,
        notificationType: 'community_post_reaction',
        title: 'Nueva reacción en tu post',
        message: `${reactionAuthorName} ${reactionVerb} "${postTitle}"`,
        metadata: {
          ...metadata,
          post_id: postId,
          community_id: communityId,
          reaction_author_id: reactionAuthorId,
          reaction_type: reactionType,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('community_post_reaction')
      })

      logger.info('✅ Notificación de reacción en post creada', {
        postId,
        postAuthorId,
        reactionAuthorId,
        reactionType
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de reacción en post:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea una notificación cuando se da like a un reel
   * Notifica al autor del reel (no al que da like)
   */
  static async notifyReelLiked(
    reelId: string,
    reelAuthorId: string,
    likeAuthorId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // No notificar si el autor del like es el mismo que el autor del reel
      if (reelAuthorId === likeAuthorId) {
        return
      }

      const supabase = await getServerClient()

      // Obtener información del autor del like
      const { data: likeAuthor } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', likeAuthorId)
        .single()

      const likeAuthorName = likeAuthor?.display_name || likeAuthor?.first_name || likeAuthor?.username || 'Un usuario'

      // Obtener información del reel
      const { data: reel } = await supabase
        .from('reels')
        .select('title')
        .eq('id', reelId)
        .single()

      const reelTitle = reel?.title || 'tu reel'

      await NotificationService.createNotification({
        userId: reelAuthorId,
        notificationType: 'reel_liked',
        title: 'Nuevo like en tu reel',
        message: `${likeAuthorName} le dio like a "${reelTitle}"`,
        metadata: {
          ...metadata,
          reel_id: reelId,
          like_author_id: likeAuthorId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('reel_liked')
      })

      logger.info('✅ Notificación de like en reel creada', {
        reelId,
        reelAuthorId,
        likeAuthorId
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de like en reel:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea una notificación cuando se comenta un reel
   * Notifica al autor del reel
   */
  static async notifyReelComment(
    reelId: string,
    commentId: string,
    reelAuthorId: string,
    commentAuthorId: string,
    commentPreview: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // No notificar si el autor del comentario es el mismo que el autor del reel
      if (reelAuthorId === commentAuthorId) {
        return
      }

      const supabase = await getServerClient()

      // Obtener información del autor del comentario
      const { data: commentAuthor } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', commentAuthorId)
        .single()

      const commentAuthorName = commentAuthor?.display_name || commentAuthor?.first_name || commentAuthor?.username || 'Un usuario'

      // Obtener información del reel
      const { data: reel } = await supabase
        .from('reels')
        .select('title')
        .eq('id', reelId)
        .single()

      const reelTitle = reel?.title || 'tu reel'

      // Truncar preview del comentario si es muy largo
      const truncatedPreview = commentPreview.length > 100 
        ? commentPreview.substring(0, 100) + '...'
        : commentPreview

      await NotificationService.createNotification({
        userId: reelAuthorId,
        notificationType: 'reel_comment',
        title: 'Nuevo comentario en tu reel',
        message: `${commentAuthorName} comentó en "${reelTitle}": "${truncatedPreview}"`,
        metadata: {
          ...metadata,
          reel_id: reelId,
          comment_id: commentId,
          comment_author_id: commentAuthorId,
          comment_preview: truncatedPreview,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('reel_comment')
      })

      logger.info('✅ Notificación de comentario en reel creada', {
        reelId,
        commentId,
        reelAuthorId,
        commentAuthorId
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de comentario en reel:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea una notificación cuando se completa una lección de un curso
   */
  static async notifyCourseLessonCompleted(
    userId: string,
    courseId: string,
    courseTitle: string,
    lessonId: string,
    lessonTitle: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId,
        notificationType: 'course_lesson_completed',
        title: 'Lección completada',
        message: `Has completado la lección "${lessonTitle}" del curso "${courseTitle}". ¡Sigue así!`,
        metadata: {
          ...metadata,
          course_id: courseId,
          lesson_id: lessonId,
          course_title: courseTitle,
          lesson_title: lessonTitle,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('course_lesson_completed')
      })

      logger.info('✅ Notificación de lección completada creada', {
        userId,
        courseId,
        lessonId
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de lección completada:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea una notificación cuando se completa un curso completo
   */
  static async notifyCourseCompleted(
    userId: string,
    courseId: string,
    courseTitle: string,
    hasCertificate: boolean = false,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const message = hasCertificate
        ? `¡Felicidades! Has completado el curso "${courseTitle}". Tu certificado está disponible.`
        : `¡Felicidades! Has completado el curso "${courseTitle}". ¡Excelente trabajo!`

      await NotificationService.createNotification({
        userId,
        notificationType: 'course_completed',
        title: 'Curso completado',
        message,
        metadata: {
          ...metadata,
          course_id: courseId,
          course_title: courseTitle,
          has_certificate: hasCertificate,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('course_completed')
      })

      logger.info('✅ Notificación de curso completado creada', {
        userId,
        courseId,
        hasCertificate
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de curso completado:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea una notificación cuando se responde una pregunta del curso
   * Notifica al autor de la pregunta
   */
  static async notifyCourseQuestionAnswered(
    questionId: string,
    questionAuthorId: string,
    answerAuthorId: string,
    courseId: string,
    courseTitle: string,
    answerPreview: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // No notificar si el autor de la respuesta es el mismo que el autor de la pregunta
      if (questionAuthorId === answerAuthorId) {
        return
      }

      const supabase = await getServerClient()

      // Obtener información del autor de la respuesta
      const { data: answerAuthor } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', answerAuthorId)
        .single()

      const answerAuthorName = answerAuthor?.display_name || answerAuthor?.first_name || answerAuthor?.username || 'Un usuario'

      // Truncar preview de la respuesta si es muy largo
      const truncatedPreview = answerPreview.length > 100 
        ? answerPreview.substring(0, 100) + '...'
        : answerPreview

      await NotificationService.createNotification({
        userId: questionAuthorId,
        notificationType: 'course_question_answered',
        title: 'Nueva respuesta a tu pregunta',
        message: `${answerAuthorName} respondió a tu pregunta en "${courseTitle}": "${truncatedPreview}"`,
        metadata: {
          ...metadata,
          question_id: questionId,
          course_id: courseId,
          course_title: courseTitle,
          answer_author_id: answerAuthorId,
          answer_preview: truncatedPreview,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('course_question_answered')
      })

      logger.info('✅ Notificación de pregunta respondida creada', {
        questionId,
        questionAuthorId,
        answerAuthorId
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de pregunta respondida:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea una notificación cuando se marca un prompt como favorito
   * Notifica al autor del prompt
   */
  static async notifyPromptFavorited(
    promptId: string,
    promptAuthorId: string,
    favoritedByUserId: string,
    promptTitle: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // No notificar si el usuario que marca como favorito es el mismo que el autor
      if (promptAuthorId === favoritedByUserId) {
        return
      }

      const supabase = await getServerClient()

      // Obtener información del usuario que marcó como favorito
      const { data: favoritedBy } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', favoritedByUserId)
        .single()

      const favoritedByName = favoritedBy?.display_name || favoritedBy?.first_name || favoritedBy?.username || 'Un usuario'

      await NotificationService.createNotification({
        userId: promptAuthorId,
        notificationType: 'prompt_favorited',
        title: 'Tu prompt fue marcado como favorito',
        message: `${favoritedByName} marcó como favorito tu prompt "${promptTitle}"`,
        metadata: {
          ...metadata,
          prompt_id: promptId,
          prompt_title: promptTitle,
          favorited_by_user_id: favoritedByUserId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('prompt_favorited')
      })

      logger.info('✅ Notificación de prompt favorited creada', {
        promptId,
        promptAuthorId,
        favoritedByUserId
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de prompt favorited:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea una notificación cuando una noticia es destacada
   * Notifica al autor de la noticia
   */
  static async notifyNewsFeatured(
    newsId: string,
    newsAuthorId: string,
    newsTitle: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await NotificationService.createNotification({
        userId: newsAuthorId,
        notificationType: 'news_featured',
        title: 'Tu noticia fue destacada',
        message: `Tu noticia "${newsTitle}" ha sido destacada. ¡Felicidades!`,
        metadata: {
          ...metadata,
          news_id: newsId,
          news_title: newsTitle,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('news_featured')
      })

      logger.info('✅ Notificación de noticia destacada creada', {
        newsId,
        newsAuthorId
      })
    } catch (error) {
      logger.error('❌ Error creando notificación de noticia destacada:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Crea notificaciones cuando un nuevo miembro se une a una comunidad
   * Notifica a los administradores y moderadores de la comunidad
   */
  static async notifyCommunityMemberJoined(
    communityId: string,
    newMemberId: string,
    communityName: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const supabase = await getServerClient()

      // Obtener información del nuevo miembro
      const { data: newMember } = await supabase
        .from('users')
        .select('username, display_name, first_name')
        .eq('id', newMemberId)
        .single()

      const newMemberName = newMember?.display_name || newMember?.first_name || newMember?.username || 'Un nuevo usuario'

      // Obtener administradores y moderadores de la comunidad
      const { data: adminsAndMods, error } = await supabase
        .from('community_members')
        .select('user_id, role')
        .eq('community_id', communityId)
        .eq('is_active', true)
        .in('role', ['admin', 'moderator'])

      if (error) {
        logger.error('Error obteniendo administradores/moderadores:', error)
        return
      }

      if (!adminsAndMods || adminsAndMods.length === 0) {
        logger.info('No hay administradores/moderadores para notificar sobre nuevo miembro', {
          communityId,
          newMemberId
        })
        return
      }

      // Crear notificaciones para cada administrador/moderador
      const notifications = adminsAndMods.map(member => ({
        userId: member.user_id,
        notificationType: 'community_member_joined',
        title: 'Nuevo miembro en la comunidad',
        message: `${newMemberName} se unió a la comunidad "${communityName}"`,
        metadata: {
          ...metadata,
          community_id: communityId,
          community_name: communityName,
          new_member_id: newMemberId,
          timestamp: new Date().toISOString()
        },
        priority: getNotificationPriority('community_member_joined')
      }))

      // Crear notificaciones en batch
      for (const notification of notifications) {
        await NotificationService.createNotification(notification)
      }

      logger.info('✅ Notificaciones de nuevo miembro en comunidad creadas', {
        communityId,
        newMemberId,
        count: notifications.length
      })
    } catch (error) {
      logger.error('❌ Error creando notificaciones de nuevo miembro en comunidad:', error)
      // No lanzar error para no afectar el flujo principal
    }
  }
}

