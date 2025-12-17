import { createClient } from '../../../lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '../../../lib/supabase/types'
import { AuditLogService } from './auditLog.service'

// Función helper para crear cliente con service role key (bypass RLS)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada')
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface AdminUser {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  cargo_rol: string
  type_rol: string | null
  email_verified: boolean
  email_verified_at: string | null
  phone: string | null
  bio: string | null
  location: string | null
  profile_picture_url: string | null
  curriculum_url: string | null
  linkedin_url: string | null
  github_url: string | null
  website_url: string | null
  role_zoom: string | null
  points: number | null
  country_code: string | null
  created_at: string
  updated_at: string
  last_login_at: string | null
}

export interface UserStats {
  totalUsers: number
  verifiedUsers: number
  instructors: number
  administrators: number
}

export interface GetUsersOptions {
  page?: number
  limit?: number
  search?: string
}

export interface GetUsersResult {
  users: AdminUser[]
  total: number
  page: number
  totalPages: number
}

export class AdminUsersService {
  static async getUsers(options: GetUsersOptions = {}): Promise<GetUsersResult> {
    const supabase = await createClient()
    const { page = 1, limit = 50, search } = options

    try {
      // 🚀 OPTIMIZACIÓN: Calcular offset para paginación
      const from = (page - 1) * limit
      const to = from + limit - 1

      // 🚀 OPTIMIZACIÓN: Solo seleccionar campos necesarios (reducido de 24 a 12 campos esenciales)
      let query = supabase
        .from('users')
        .select(`
          id,
          username,
          email,
          first_name,
          last_name,
          display_name,
          cargo_rol,
          email_verified,
          profile_picture_url,
          points,
          created_at,
          updated_at,
          last_login_at
        `, { count: 'exact' })

      // 🚀 Aplicar búsqueda si se proporciona
      if (search && search.trim()) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,username.ilike.%${search}%`)
      }

      // 🚀 Aplicar paginación y ordenamiento
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) {
        // console.error('❌ Error fetching users:', error)
        throw error
      }

      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      return {
        users: data || [],
        total,
        page,
        totalPages
      }
    } catch (error) {
      // console.error('💥 Error in AdminUsersService.getUsers:', error)
      throw error
    }
  }

  static async getUserStats(): Promise<UserStats> {
    const supabase = await createClient()

    try {
      // 🚀 OPTIMIZACIÓN: Usar queries agregadas en paralelo en lugar de filtrado en cliente
      // ANTES: 1 query grande + filtrado en cliente
      // DESPUÉS: 4 queries agregadas en paralelo (mucho más eficiente)

      const [totalResult, verifiedResult, instructorsResult, adminsResult] = await Promise.all([
        // Total de usuarios
        supabase.from('users').select('id', { count: 'exact', head: true }),

        // Usuarios verificados
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('email_verified', true),

        // Instructores
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('cargo_rol', 'Instructor'),

        // Administradores
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('cargo_rol', 'Administrador')
      ])

      // Verificar errores
      if (totalResult.error) throw totalResult.error
      if (verifiedResult.error) throw verifiedResult.error
      if (instructorsResult.error) throw instructorsResult.error
      if (adminsResult.error) throw adminsResult.error

      const stats: UserStats = {
        totalUsers: totalResult.count || 0,
        verifiedUsers: verifiedResult.count || 0,
        instructors: instructorsResult.count || 0,
        administrators: adminsResult.count || 0
      }

      return stats
    } catch (error) {
      // console.error('Error in AdminUsersService.getUserStats:', error)
      throw error
    }
  }

  static async updateUser(userId: string, userData: Partial<AdminUser>, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminUser> {
    const supabase = await createClient()

    try {
      // Obtener datos anteriores para el log de auditoría
      const { data: oldData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      const { data, error } = await supabase
        .from('users')
        .update({
          username: userData.username,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          display_name: userData.display_name,
          cargo_rol: userData.cargo_rol,
          type_rol: userData.type_rol,
          email_verified: userData.email_verified,
          email_verified_at: userData.email_verified ? new Date().toISOString() : userData.email_verified_at,
          phone: userData.phone,
          bio: userData.bio,
          location: userData.location,
          profile_picture_url: userData.profile_picture_url,
          curriculum_url: userData.curriculum_url,
          linkedin_url: userData.linkedin_url,
          github_url: userData.github_url,
          website_url: userData.website_url,
          role_zoom: userData.role_zoom,
          points: userData.points,
          country_code: userData.country_code,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select(`
          id,
          username,
          email,
          first_name,
          last_name,
          display_name,
          cargo_rol,
          type_rol,
          email_verified,
          email_verified_at,
          phone,
          bio,
          location,
          profile_picture_url,
          curriculum_url,
          linkedin_url,
          github_url,
          website_url,
          role_zoom,
          points,
          country_code,
          created_at,
          updated_at,
          last_login_at
        `)
        .single()

      if (error) {
        // console.error('Error updating user:', error)
        throw error
      }

      // Registrar en el log de auditoría
      await AuditLogService.logAction({
        user_id: userId,
        admin_user_id: adminUserId,
        action: 'UPDATE',
        table_name: 'users',
        record_id: userId,
        old_values: oldData,
        new_values: userData,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return data
    } catch (error) {
      // console.error('Error in AdminUsersService.updateUser:', error)
      throw error
    }
  }

  static async updateUserRole(userId: string, newRole: string): Promise<void> {
    const supabase = await createClient()

    try {
      const { error } = await supabase
        .from('users')
        .update({ cargo_rol: newRole })
        .eq('id', userId)

      if (error) {
        // console.error('Error updating user role:', error)
        throw error
      }
    } catch (error) {
      // console.error('Error in AdminUsersService.updateUserRole:', error)
      throw error
    }
  }

  static async createUser(userData: any, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminUser> {
    const supabase = await createClient()

    try {
      // Crear el usuario
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: userData.username,
          email: userData.email,
          password_hash: userData.password, // En producción, esto debería estar hasheado
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          display_name: userData.display_name || null,
          cargo_rol: userData.cargo_rol,
          type_rol: userData.type_rol || null,
          phone: userData.phone || null,
          bio: userData.bio || null,
          location: userData.location || null,
          profile_picture_url: userData.profile_picture_url || null,
          curriculum_url: userData.curriculum_url || null,
          linkedin_url: userData.linkedin_url || null,
          github_url: userData.github_url || null,
          website_url: userData.website_url || null,
          role_zoom: userData.role_zoom || null,
          points: userData.points || 0,
          country_code: userData.country_code || null,
          email_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          id,
          username,
          email,
          first_name,
          last_name,
          display_name,
          cargo_rol,
          type_rol,
          email_verified,
          email_verified_at,
          phone,
          bio,
          location,
          profile_picture_url,
          curriculum_url,
          linkedin_url,
          github_url,
          website_url,
          role_zoom,
          points,
          country_code,
          created_at,
          updated_at,
          last_login_at
        `)
        .single()

      if (error) {
        // console.error('Error creating user:', error)
        throw error
      }

      // Registrar en el log de auditoría
      await AuditLogService.logAction({
        user_id: data.id,
        admin_user_id: adminUserId,
        action: 'CREATE',
        table_name: 'users',
        record_id: data.id,
        old_values: null,
        new_values: userData,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return data
    } catch (error) {
      // console.error('Error in AdminUsersService.createUser:', error)
      throw error
    }
  }

  static async deleteUser(userId: string, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<void> {
    const supabase = await createClient()
    const adminSupabase = createAdminClient() // Cliente con service role key para bypass RLS

    try {
      // Obtener datos del usuario antes de eliminarlo para el log de auditoría
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      // Registrar en el log de auditoría ANTES de eliminar el usuario
      // Esto evita problemas con las políticas RLS que requieren que el user_id exista
      try {
        await AuditLogService.logAction({
          user_id: userId,
          admin_user_id: adminUserId,
          action: 'DELETE',
          table_name: 'users',
          record_id: userId,
          old_values: userData,
          new_values: null,
          ip_address: requestInfo?.ip,
          user_agent: requestInfo?.userAgent
        })
      } catch (auditError) {
        // No fallar la eliminación si el log de auditoría falla
        // console.error('Error en auditoría:', auditError)
      }

      // Eliminar todas las referencias del usuario antes de eliminar el usuario
      // Usar cliente admin para bypass RLS en todas las eliminaciones
      // Orden importante: primero las tablas dependientes, luego el usuario

      // 1. Obtener IDs de posts del usuario para eliminar comentarios y reacciones relacionados
      const { data: userPosts } = await adminSupabase
        .from('community_posts')
        .select('id')
        .eq('user_id', userId)

      const postIds = userPosts?.map(post => post.id) || []

      // 2. Eliminar comentarios en posts del usuario
      if (postIds.length > 0) {
        const { error: deleteCommentsError } = await adminSupabase
          .from('community_comments')
          .delete()
          .in('post_id', postIds)

        if (deleteCommentsError) {
          }
      }

      // 3. Eliminar reacciones en posts del usuario
      if (postIds.length > 0) {
        const { error: deleteReactionsError } = await adminSupabase
          .from('community_reactions')
          .delete()
          .in('post_id', postIds)

        if (deleteReactionsError) {
          }
      }

      // 3.5. Eliminar TODAS las reacciones creadas por el usuario (no solo en sus posts)
      const { error: deleteUserReactionsError } = await adminSupabase
        .from('community_reactions')
        .delete()
        .eq('user_id', userId)

      if (deleteUserReactionsError) {
        }

      // 4. Eliminar posts de comunidades del usuario
      const { error: deletePostsError } = await adminSupabase
        .from('community_posts')
        .delete()
        .eq('user_id', userId)

      if (deletePostsError) {
        }

      // 5. Eliminar miembros de comunidades del usuario
      const { error: deleteMembersError } = await adminSupabase
        .from('community_members')
        .delete()
        .eq('user_id', userId)

      if (deleteMembersError) {
        }

      // 5.5. Eliminar solicitudes de acceso a comunidades donde el usuario es el solicitante
      const { error: deleteAccessRequestsError } = await adminSupabase
        .from('community_access_requests')
        .delete()
        .eq('requester_id', userId)

      if (deleteAccessRequestsError) {
        }

      // 5.6. Eliminar solicitudes de acceso a comunidades donde el usuario es el revisor (opcional pero recomendado)
      const { error: deleteReviewedRequestsError } = await adminSupabase
        .from('community_access_requests')
        .delete()
        .eq('reviewed_by', userId)

      if (deleteReviewedRequestsError) {
        }

      // 6. Eliminar usuarios de organizaciones
      const { error: deleteOrgUsersError } = await adminSupabase
        .from('organization_users')
        .delete()
        .eq('user_id', userId)

      if (deleteOrgUsersError) {
        }

      // 6.5. Eliminar inscripciones a cursos del usuario
      const { error: deleteEnrollmentsError } = await adminSupabase
        .from('user_course_enrollments')
        .delete()
        .eq('user_id', userId)

      if (deleteEnrollmentsError) {
        }

      // 7. Eliminar sesiones del usuario
      const { error: deleteSessionsError } = await adminSupabase
        .from('user_session')
        .delete()
        .eq('user_id', userId)

      if (deleteSessionsError) {
        }

      // 8. Eliminar favoritos del usuario
      const { error: deleteFavoritesError } = await adminSupabase
        .from('app_favorites')
        .delete()
        .eq('user_id', userId)

      if (deleteFavoritesError) {
        }

      // 8.5. Manejar referencias del usuario como instructor
      // Obtener todas las lecciones del instructor
      const { data: userLessons } = await adminSupabase
        .from('course_lessons')
        .select('lesson_id')
        .eq('instructor_id', userId)

      const lessonIds = userLessons?.map(lesson => lesson.lesson_id) || []

      // Eliminar actividades de las lecciones antes de eliminar las lecciones
      if (lessonIds.length > 0) {
        const { error: deleteActivitiesError } = await adminSupabase
          .from('lesson_activities')
          .delete()
          .in('lesson_id', lessonIds)

        if (deleteActivitiesError) {
          }

        // Eliminar materiales de las lecciones antes de eliminar las lecciones
        const { error: deleteMaterialsError } = await adminSupabase
          .from('lesson_materials')
          .delete()
          .in('lesson_id', lessonIds)

        if (deleteMaterialsError) {
          }

        // Eliminar progreso de lecciones antes de eliminar las lecciones
        const { error: deleteProgressError } = await adminSupabase
          .from('user_lesson_progress')
          .delete()
          .in('lesson_id', lessonIds)

        if (deleteProgressError) {
          }
      }

      // Eliminar las lecciones del instructor
      const { error: deleteLessonsError } = await adminSupabase
        .from('course_lessons')
        .delete()
        .eq('instructor_id', userId)

      if (deleteLessonsError) {
        }

      // Cambiar instructor_id a NULL en courses (o eliminar si no permite NULL)
      const { error: updateCoursesError } = await adminSupabase
        .from('courses')
        .update({ instructor_id: null })
        .eq('instructor_id', userId)

      if (updateCoursesError) {
        // Si falla porque instructor_id no puede ser NULL, intentar eliminar los cursos
        const { error: deleteCoursesError } = await adminSupabase
          .from('courses')
          .delete()
          .eq('instructor_id', userId)
        
        if (deleteCoursesError) {
          }
      }

      // Cambiar created_by a NULL en news
      const { error: updateNewsError } = await adminSupabase
        .from('news')
        .update({ created_by: null })
        .eq('created_by', userId)

      if (updateNewsError) {
        // Si falla porque created_by no puede ser NULL, intentar eliminar las noticias
        const { error: deleteNewsError } = await adminSupabase
          .from('news')
          .delete()
          .eq('created_by', userId)
        
        if (deleteNewsError) {
          }
      }

      // 9. Finalmente eliminar el usuario
      const { error } = await adminSupabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        // console.error('Error deleting user:', error)
        throw error
      }
    } catch (error) {
      // console.error('Error in AdminUsersService.deleteUser:', error)
      throw error
    }
  }
}

