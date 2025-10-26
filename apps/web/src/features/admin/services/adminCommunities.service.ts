import { createClient } from '../../../lib/supabase/server'
import { AuditLogService } from './auditLog.service'

export interface AdminCommunity {
  id: string
  name: string
  description: string
  slug: string
  image_url?: string
  member_count: number
  is_active: boolean
  visibility: string
  access_type: string
  course_id?: string
  course?: {
    id: string
    title: string
    slug: string
  }
  created_at: string
  updated_at: string
  creator_name?: string
  posts_count?: number
  comments_count?: number
  videos_count?: number
  access_requests_count?: number
}

export interface CommunityStats {
  totalCommunities: number
  activeCommunities: number
  totalMembers: number
  totalPosts: number
  totalComments: number
  totalVideos: number
  totalAccessRequests: number
}

export class AdminCommunitiesService {
  static async getAllCommunities(): Promise<AdminCommunity[]> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('communities')
        .select(`
          id,
          name,
          description,
          slug,
          image_url,
          member_count,
          is_active,
          visibility,
          access_type,
          course_id,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching communities:', error)
        throw error
      }

      // Obtener información adicional para cada comunidad
      const communitiesWithDetails = await Promise.all(
        (data || []).map(async (community) => {
          // Obtener información del creador (primer miembro con rol de admin/creator)
          const { data: creator } = await supabase
            .from('community_members')
            .select(`
              user_id,
              role,
              users!inner(display_name, first_name, last_name)
            `)
            .eq('community_id', community.id)
            .eq('role', 'admin')
            .limit(1)
            .single()

          // Obtener información del curso si está vinculado
          let courseInfo = null
          if (community.course_id) {
            const { data: course } = await supabase
              .from('courses')
              .select('id, title, slug')
              .eq('id', community.course_id)
              .single()
            
            if (course) {
              courseInfo = course
            }
          }

          // Obtener conteo de posts
          const { count: postsCount, error: postsError } = await supabase
            .from('community_posts')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', community.id)

          if (postsError) {
            console.warn(`Error counting posts for community ${community.id}:`, postsError)
          }

          // Obtener conteo de comentarios
          const { count: commentsCount, error: commentsError } = await supabase
            .from('community_comments')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', community.id)

          if (commentsError) {
            console.warn(`Error counting comments for community ${community.id}:`, commentsError)
          }

          // Obtener conteo de videos
          const { count: videosCount, error: videosError } = await supabase
            .from('community_videos')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', community.id)

          if (videosError) {
            console.warn(`Error counting videos for community ${community.id}:`, videosError)
          }

          // Obtener conteo de solicitudes de acceso
          const { count: accessRequestsCount, error: requestsError } = await supabase
            .from('community_access_requests')
            .select('*', { count: 'exact', head: true })
            .eq('community_id', community.id)

          if (requestsError) {
            console.warn(`Error counting access requests for community ${community.id}:`, requestsError)
          }

          return {
            ...community,
            course: courseInfo,
            creator_name: creator?.users?.display_name || 
                         `${creator?.users?.first_name || ''} ${creator?.users?.last_name || ''}`.trim() ||
                         'Creador no encontrado',
            posts_count: postsCount || 0,
            comments_count: commentsCount || 0,
            videos_count: videosCount || 0,
            access_requests_count: accessRequestsCount || 0
          }
        })
      )

      return communitiesWithDetails
    } catch (error) {
      console.error('Error in AdminCommunitiesService.getAllCommunities:', error)
      throw error
    }
  }

  static async getCommunityStats(): Promise<CommunityStats> {
    const supabase = await createClient()

    try {
      // Obtener estadísticas básicas
      const { count: totalCommunities } = await supabase
        .from('communities')
        .select('*', { count: 'exact', head: true })

      const { count: activeCommunities } = await supabase
        .from('communities')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Obtener total de miembros (suma de member_count)
      const { data: communitiesData } = await supabase
        .from('communities')
        .select('member_count')

      const totalMembers = communitiesData ? communitiesData.reduce((sum, community) => sum + (community.member_count || 0), 0) : 0

      // Obtener total de posts
      const { count: totalPosts, error: postsError } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })

      if (postsError) {
        console.warn('Error counting posts:', postsError)
      }

      // Obtener total de comentarios
      const { count: totalComments, error: commentsError } = await supabase
        .from('community_comments')
        .select('*', { count: 'exact', head: true })

      if (commentsError) {
        console.warn('Error counting comments:', commentsError)
      }

      // Obtener total de videos
      const { count: totalVideos, error: videosError } = await supabase
        .from('community_videos')
        .select('*', { count: 'exact', head: true })

      if (videosError) {
        console.warn('Error counting videos:', videosError)
      }

      // Obtener total de solicitudes de acceso
      const { count: totalAccessRequests, error: requestsError } = await supabase
        .from('community_access_requests')
        .select('*', { count: 'exact', head: true })

      if (requestsError) {
        console.warn('Error counting access requests:', requestsError)
      }

      return {
        totalCommunities: totalCommunities || 0,
        activeCommunities: activeCommunities || 0,
        totalMembers,
        totalPosts: totalPosts || 0,
        totalComments: totalComments || 0,
        totalVideos: totalVideos || 0,
        totalAccessRequests: totalAccessRequests || 0
      }
    } catch (error) {
      console.error('Error in AdminCommunitiesService.getCommunityStats:', error)
      throw error
    }
  }

  static async createCommunity(communityData: Partial<AdminCommunity>, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminCommunity> {
    const supabase = await createClient()

    try {
      console.log('🔄 AdminCommunitiesService.createCommunity: Iniciando...')
      console.log('📋 Datos a insertar:', {
        name: communityData.name,
        description: communityData.description,
        slug: communityData.slug || communityData.name?.toLowerCase().replace(/\s+/g, '-'),
        image_url: communityData.image_url,
        member_count: 0,
        is_active: communityData.is_active || true,
        visibility: communityData.visibility || 'public',
        access_type: communityData.access_type || 'open',
        course_id: communityData.course_id || null
      })

      const { data, error } = await supabase
        .from('communities')
        .insert({
          name: communityData.name,
          description: communityData.description,
          slug: communityData.slug || communityData.name?.toLowerCase().replace(/\s+/g, '-'),
          image_url: communityData.image_url,
          member_count: 0,
          is_active: communityData.is_active || true,
          visibility: communityData.visibility || 'public',
          access_type: communityData.access_type || 'open',
          course_id: communityData.course_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          id,
          name,
          description,
          slug,
          image_url,
          member_count,
          is_active,
          visibility,
          access_type,
          course_id,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        console.error('❌ Error creating community:', error)
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('✅ Comunidad creada exitosamente:', data)

      // Registrar en el log de auditoría (comentado temporalmente para debug)
      try {
        await AuditLogService.logAction({
          user_id: adminUserId,
          admin_user_id: adminUserId,
          action: 'CREATE',
          table_name: 'communities',
          record_id: data.id,
          old_values: null,
          new_values: communityData,
          ip_address: requestInfo?.ip,
          user_agent: requestInfo?.userAgent
        })
        console.log('✅ Log de auditoría registrado')
      } catch (auditError) {
        console.warn('⚠️ Error en log de auditoría (no crítico):', auditError)
        // No lanzar error por problemas de auditoría
      }

      return data
    } catch (error) {
      console.error('💥 Error in AdminCommunitiesService.createCommunity:', error)
      throw error
    }
  }

  static async updateCommunity(communityId: string, communityData: Partial<AdminCommunity>, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminCommunity> {
    const supabase = await createClient()

    try {
      // Obtener datos anteriores para el log de auditoría
      const { data: oldData } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single()

      const { data, error } = await supabase
        .from('communities')
        .update({
          name: communityData.name,
          description: communityData.description,
          slug: communityData.slug,
          image_url: communityData.image_url,
          is_active: communityData.is_active,
          visibility: communityData.visibility,
          access_type: communityData.access_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityId)
        .select(`
          id,
          name,
          description,
          slug,
          image_url,
          member_count,
          is_active,
          visibility,
          access_type,
          course_id,
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        console.error('Error updating community:', error)
        throw error
      }

      // Registrar en el log de auditoría
      await AuditLogService.logAction({
        user_id: adminUserId,
        admin_user_id: adminUserId,
        action: 'UPDATE',
        table_name: 'communities',
        record_id: communityId,
        old_values: oldData,
        new_values: communityData,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return data
    } catch (error) {
      console.error('Error in AdminCommunitiesService.updateCommunity:', error)
      throw error
    }
  }

  static async toggleCommunityVisibility(
    communityId: string,
    adminUserId: string,
    requestInfo?: { ip?: string, userAgent?: string }
  ): Promise<AdminCommunity> {
    const supabase = await createClient()

    try {
      // Obtener datos actuales de la comunidad
      const { data: currentCommunity, error: fetchError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single()

      if (fetchError || !currentCommunity) {
        throw new Error('Comunidad no encontrada')
      }

      // Toggle del estado is_active
      const newActiveState = !currentCommunity.is_active

      const { data: updatedCommunity, error: updateError } = await supabase
        .from('communities')
        .update({ 
          is_active: newActiveState,
          updated_at: new Date().toISOString()
        })
        .eq('id', communityId)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Error al actualizar visibilidad: ${updateError.message}`)
      }

      // Log de auditoría
      await AuditLogService.logAction({
        user_id: null, // No hay usuario específico afectado
        admin_user_id: adminUserId,
        action: 'UPDATE',
        table_name: 'communities',
        record_id: communityId,
        old_values: { is_active: currentCommunity.is_active },
        new_values: { is_active: newActiveState },
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return updatedCommunity as AdminCommunity
    } catch (error) {
      console.error('Error toggling community visibility:', error)
      throw error
    }
  }

  static async getCommunityBySlug(slug: string): Promise<AdminCommunity | null> {
    const supabase = await createClient()

    try {
      const { data: community, error } = await supabase
        .from('communities')
        .select(`
          id,
          name,
          description,
          slug,
          image_url,
          member_count,
          is_active,
          visibility,
          access_type,
          course_id,
          created_at,
          updated_at
        `)
        .eq('slug', slug)
        .single()

      if (error || !community) {
        return null
      }

      // Obtener información del creador
      const { data: creatorMember } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', community.id)
        .eq('role', 'admin')
        .limit(1)
        .single()

      let creator = null
      if (creatorMember?.user_id) {
        const { data: creatorUser } = await supabase
          .from('users')
          .select('display_name, first_name, last_name')
          .eq('id', creatorMember.user_id)
          .single()
        
        creator = creatorUser ? { users: creatorUser } : null
      }

      // Obtener conteos
      const { count: postsCount } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id)

      const { count: commentsCount } = await supabase
        .from('community_comments')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id)

      const { count: videosCount } = await supabase
        .from('community_videos')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id)

      const { count: accessRequestsCount } = await supabase
        .from('community_access_requests')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id)

      return {
        ...community,
        creator_name: creator?.users?.display_name || 
                     `${creator?.users?.first_name || ''} ${creator?.users?.last_name || ''}`.trim() ||
                     'Creador no encontrado',
        posts_count: postsCount || 0,
        comments_count: commentsCount || 0,
        videos_count: videosCount || 0,
        access_requests_count: accessRequestsCount || 0
      }
    } catch (error) {
      console.error('Error in AdminCommunitiesService.getCommunityBySlug:', error)
      return null
    }
  }


  static async getCommunityMembers(communityId: string, page: number = 1, limit: number = 10): Promise<any[]> {
    const supabase = await createClient()

    try {
      // Primero obtener los miembros
      const { data: members, error } = await supabase
        .from('community_members')
        .select(`
          id,
          role,
          joined_at,
          is_active,
          updated_at,
          user_id
        `)
        .eq('community_id', communityId)
        .order('joined_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) {
        console.error('Error fetching community members:', error)
        return []
      }

      if (!members || members.length === 0) {
        console.log('No members found for community:', communityId)
        return []
      }

      // Obtener información de usuarios para cada miembro
      const userIds = [...new Set(members.map(member => member.user_id))]

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, display_name, first_name, last_name, email, profile_picture_url, cargo_rol')
        .in('id', userIds)


      if (usersError) {
        console.error('Error fetching users for members:', usersError)
        return members.map(member => ({ 
          ...member, 
          users: {
            id: member.user_id,
            display_name: 'Usuario no encontrado',
            first_name: 'Usuario',
            last_name: 'No encontrado',
            email: 'email@noencontrado.com',
            profile_picture_url: null,
            cargo_rol: 'Usuario'
          }
        }))
      }

      // Combinar miembros con información de usuarios
      const membersWithUsers = members.map(member => {
        const user = users?.find(u => u.id === member.user_id)
        const result = {
          ...member,
          name: user?.display_name || `${user?.first_name} ${user?.last_name}` || 'Usuario no encontrado',
          users: user || {
            id: member.user_id,
            display_name: 'Usuario no encontrado',
            first_name: 'Usuario',
            last_name: 'No encontrado',
            email: 'email@noencontrado.com',
            profile_picture_url: null,
            cargo_rol: 'Usuario'
          }
        }
        return result
      })

      return membersWithUsers
    } catch (error) {
      console.error('Error in AdminCommunitiesService.getCommunityMembers:', error)
      return []
    }
  }

  static async getCommunityAccessRequests(communityId: string, page: number = 1, limit: number = 10): Promise<any[]> {
    const supabase = await createClient()

    try {
      // Primero obtener las solicitudes
      const { data: requests, error } = await supabase
        .from('community_access_requests')
        .select(`
          id,
          status,
          note,
          created_at,
          reviewed_at,
          requester_id,
          reviewed_by
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) {
        console.error('Error fetching access requests:', error)
        return []
      }

      if (!requests || requests.length === 0) {
        return []
      }

      // Obtener información de usuarios (solicitantes y revisores)
      const requesterIds = [...new Set(requests.map(req => req.requester_id))]
      const reviewerIds = [...new Set(requests.map(req => req.reviewed_by).filter(Boolean))]
      const allUserIds = [...new Set([...requesterIds, ...reviewerIds])]

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, display_name, first_name, last_name, email, profile_picture_url')
        .in('id', allUserIds)

      if (usersError) {
        console.error('Error fetching users for requests:', usersError)
        return requests.map(request => ({ ...request, requester: null, reviewer: null }))
      }

      // Combinar solicitudes con información de usuarios
      const requestsWithUsers = requests.map(request => {
        const requester = users?.find(u => u.id === request.requester_id)
        const reviewer = users?.find(u => u.id === request.reviewed_by)
        return {
          ...request,
          requester: requester || null,
          reviewer: reviewer || null
        }
      })

      return requestsWithUsers
    } catch (error) {
      console.error('Error in AdminCommunitiesService.getCommunityAccessRequests:', error)
      return []
    }
  }

  static async getCommunityVideos(communityId: string, page: number = 1, limit: number = 10): Promise<any[]> {
    const supabase = await createClient()

    try {
      const { data: videos, error } = await supabase
        .from('community_videos')
        .select(`
          id,
          video_type,
          title,
          description,
          video_url,
          video_provider,
          thumbnail_url,
          duration,
          order_index,
          is_active,
          metadata,
          created_at,
          updated_at
        `)
        .eq('community_id', communityId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) {
        console.error('Error fetching community videos:', error)
        return []
      }

      return videos || []
    } catch (error) {
      console.error('Error in AdminCommunitiesService.getCommunityVideos:', error)
      return []
    }
  }

  static async deleteCommunity(communityId: string, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<void> {
    const supabase = await createClient()

    try {
      // Obtener datos de la comunidad antes de eliminarla para el log de auditoría
      const { data: communityData } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single()

      // Eliminar en cascada (las relaciones se manejan automáticamente si hay CASCADE)
      // Primero eliminar reacciones
      await supabase
        .from('community_reactions')
        .delete()
        .eq('post_id', communityId)

      // Eliminar comentarios
      await supabase
        .from('community_comments')
        .delete()
        .eq('community_id', communityId)

      // Eliminar posts
      await supabase
        .from('community_posts')
        .delete()
        .eq('community_id', communityId)

      // Eliminar videos
      await supabase
        .from('community_videos')
        .delete()
        .eq('community_id', communityId)

      // Eliminar solicitudes de acceso
      await supabase
        .from('community_access_requests')
        .delete()
        .eq('community_id', communityId)

      // Eliminar miembros
      await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)

      // Finalmente eliminar la comunidad
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId)

      if (error) {
        console.error('Error deleting community:', error)
        throw error
      }

      // Registrar en el log de auditoría
      await AuditLogService.logAction({
        user_id: adminUserId,
        admin_user_id: adminUserId,
        action: 'DELETE',
        table_name: 'communities',
        record_id: communityId,
        old_values: communityData,
        new_values: null,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })
    } catch (error) {
      console.error('Error in AdminCommunitiesService.deleteCommunity:', error)
      throw error
    }
  }

  static async getCommunityMembers(communityId: string): Promise<Array<{ id: string, name: string, role: string, joined_at: string }>> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          id,
          role,
          joined_at,
          users!inner(display_name, first_name, last_name)
        `)
        .eq('community_id', communityId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false })

      if (error) {
        console.error('Error fetching community members:', error)
        throw error
      }

      return (data || []).map(member => ({
        id: member.id,
        name: member.users?.display_name || 
              `${member.users?.first_name || ''} ${member.users?.last_name || ''}`.trim() ||
              'Usuario sin nombre',
        role: member.role,
        joined_at: member.joined_at
      }))
    } catch (error) {
      console.error('Error in AdminCommunitiesService.getCommunityMembers:', error)
      throw error
    }
  }

  static async getCommunityPosts(communityId: string): Promise<any[]> {
    const supabase = await createClient()

    try {
      // Primero obtener los posts básicos
      const { data: posts, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          id,
          content,
          attachment_url,
          attachment_type,
          likes_count,
          comments_count,
          is_pinned,
          is_hidden,
          is_edited,
          edited_at,
          created_at,
          updated_at,
          user_id
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (postsError) {
        console.error('Error fetching community posts:', postsError)
        throw postsError
      }

      if (!posts || posts.length === 0) {
        return []
      }

      // Obtener información de usuarios para los posts
      const userIds = [...new Set(posts.map(post => post.user_id).filter(Boolean))]
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, display_name, first_name, last_name, profile_picture_url')
        .in('id', userIds)

      if (usersError) {
        console.error('Error fetching users for posts:', usersError)
      }

      // Crear un mapa de usuarios para acceso rápido
      const usersMap = new Map()
      if (users) {
        users.forEach(user => {
          usersMap.set(user.id, user)
        })
      }

      // Para cada post, obtener comentarios y reacciones
      const postsWithDetails = await Promise.all(
        posts.map(async (post) => {
          // Obtener comentarios del post
          const { data: comments, error: commentsError } = await supabase
            .from('community_comments')
            .select(`
              id,
              content,
              created_at,
              author_id,
              users!inner(display_name, first_name, last_name, profile_picture_url)
            `)
            .eq('post_id', post.id)
            .order('created_at', { ascending: true })
            .limit(10)

          // Obtener reacciones del post
          const { data: reactions, error: reactionsError } = await supabase
            .from('community_reactions')
            .select(`
              id,
              reaction_type,
              emoji,
              users!inner(display_name, first_name, last_name)
            `)
            .eq('post_id', post.id)

          // Agrupar reacciones por tipo
          const reactionsGrouped = new Map()
          if (reactions) {
            reactions.forEach(reaction => {
              const key = reaction.reaction_type || 'like'
              if (!reactionsGrouped.has(key)) {
                reactionsGrouped.set(key, {
                  type: key,
                  emoji: reaction.emoji || '👍',
                  count: 0,
                  users: []
                })
              }
              const group = reactionsGrouped.get(key)
              group.count++
              group.users.push(reaction.users)
            })
          }

          return {
            ...post,
            users: usersMap.get(post.user_id) || null,
            comments: comments || [],
            reactions: Array.from(reactionsGrouped.values()),
            attachments: post.attachment_url ? [{ url: post.attachment_url, type: post.attachment_type, name: 'Archivo adjunto' }] : [],
            links: [],
            views_count: 0, // Por defecto 0 hasta que agreguemos la columna
            post_type: 'text' // Por defecto texto
          }
        })
      )

      return postsWithDetails
    } catch (error) {
      console.error('Error in AdminCommunitiesService.getCommunityPosts:', error)
      throw error
    }
  }
}
