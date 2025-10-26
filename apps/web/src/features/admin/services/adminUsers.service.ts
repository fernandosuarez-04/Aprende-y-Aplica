import { createClient } from '../../../lib/supabase/server'
import { AuditLogService } from './auditLog.service'

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

export class AdminUsersService {
  static async getUsers(): Promise<AdminUser[]> {
    const supabase = await createClient()

    try {
      console.log('🔄 AdminUsersService.getUsers: Iniciando...')
      
      const { data, error } = await supabase
        .from('users')
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
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching users:', error)
        throw error
      }

      console.log('✅ Usuarios obtenidos:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('💥 Error in AdminUsersService.getUsers:', error)
      throw error
    }
  }

  static async getUserStats(): Promise<UserStats> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('users')
        .select('cargo_rol, email_verified')

      if (error) {
        console.error('Error fetching user stats:', error)
        throw error
      }

      const users = data || []
      
      const stats: UserStats = {
        totalUsers: users.length,
        verifiedUsers: users.filter(u => u.email_verified).length,
        instructors: users.filter(u => u.cargo_rol === 'Instructor').length,
        administrators: users.filter(u => u.cargo_rol === 'Administrador').length
      }

      return stats
    } catch (error) {
      console.error('Error in AdminUsersService.getUserStats:', error)
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
        console.error('Error updating user:', error)
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
      console.error('Error in AdminUsersService.updateUser:', error)
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
        console.error('Error updating user role:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in AdminUsersService.updateUserRole:', error)
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
        console.error('Error creating user:', error)
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
      console.error('Error in AdminUsersService.createUser:', error)
      throw error
    }
  }

  static async deleteUser(userId: string, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<void> {
    const supabase = await createClient()

    try {
      // Obtener datos del usuario antes de eliminarlo para el log de auditoría
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      // Primero eliminar sesiones del usuario
      await supabase
        .from('user_session')
        .delete()
        .eq('user_id', userId)

      // Luego eliminar favoritos del usuario
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)

      // Finalmente eliminar el usuario
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('Error deleting user:', error)
        throw error
      }

      // Registrar en el log de auditoría
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
    } catch (error) {
      console.error('Error in AdminUsersService.deleteUser:', error)
      throw error
    }
  }
}
