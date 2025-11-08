import { createClient } from '../../../lib/supabase/server'
import { BusinessUsersService, BusinessUser, BusinessUserStats, CreateBusinessUserRequest, UpdateBusinessUserRequest } from './businessUsers.service'
import bcrypt from 'bcryptjs'

export class BusinessUsersServerService {
  /**
   * Obtener todos los usuarios de la organización del usuario autenticado
   */
  static async getOrganizationUsers(organizationId: string): Promise<BusinessUser[]> {
    const supabase = await createClient()

    try {
      // Primero obtener usuarios de la tabla organization_users con joins
      // IMPORTANTE: Validar que organization_id coincida para seguridad
      // Usar la relación específica organization_users_user_id_fkey para evitar ambigüedad
      const { data: orgUsersData, error: orgUsersError } = await supabase
        .from('organization_users')
        .select(`
          role,
          status,
          joined_at,
          user_id,
          users!organization_users_user_id_fkey (
            id,
            username,
            email,
            first_name,
            last_name,
            display_name,
            cargo_rol,
            type_rol,
            organization_id,
            email_verified,
            profile_picture_url,
            points,
            last_login_at,
            created_at,
            updated_at
          )
        `)
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false })

      if (orgUsersError) {
        console.error('❌ Error fetching organization users:', orgUsersError)
        throw orgUsersError
      }

      : 'No hay datos')

      // Transformar datos para incluir org_role y org_status
      // IMPORTANTE: Validar que el user_id coincide con el user.id para seguridad adicional
      // Usando la relación específica organization_users_user_id_fkey, Supabase retorna los datos como 'users'
      const users: BusinessUser[] = (orgUsersData || [])
        .filter((ou: any) => {
          // Acceder a los datos del usuario usando la relación específica
          const userData = ou.users
          
          // Validación de seguridad: verificar que el user existe y que user_id coincide
          if (!userData || !ou.user_id) {
            return false
          }
          
          // Validar que user_id coincide con el id del usuario
          if (userData.id !== ou.user_id) {
            return false
          }
          
          // Validación adicional: verificar que user.organization_id coincide (doble verificación)
          if (userData.organization_id && userData.organization_id !== organizationId) {
            console.error('🚨 ERROR DE SEGURIDAD: Usuario de otra organización detectado!', {
              user_org: userData.organization_id,
              expected_org: organizationId,
              user_id: userData.id
            })
            return false
          }
          return true
        })
        .map((ou: any) => {
          // Acceder a los datos del usuario usando la relación específica
          const userData = ou.users
          
          return {
            ...userData,
        org_role: ou.role as 'owner' | 'admin' | 'member',
        org_status: ou.status as 'active' | 'invited' | 'suspended' | 'removed',
        joined_at: ou.joined_at
          }
        })

      if (users.length > 0) {
        }
      return users
    } catch (error) {
      console.error('💥 Error in BusinessUsersService.getOrganizationUsers:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas de usuarios de la organización
   */
  static async getOrganizationStats(organizationId: string): Promise<BusinessUserStats> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('organization_users')
        .select('role, status')
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Error fetching organization stats:', error)
        throw error
      }

      const stats: BusinessUserStats = {
        total: data?.length || 0,
        active: data?.filter((u: any) => u.status === 'active').length || 0,
        invited: data?.filter((u: any) => u.status === 'invited').length || 0,
        suspended: data?.filter((u: any) => u.status === 'suspended').length || 0,
        admins: data?.filter((u: any) => u.role === 'admin' || u.role === 'owner').length || 0,
        members: data?.filter((u: any) => u.role === 'member').length || 0
      }

      return stats
    } catch (error) {
      console.error('Error in BusinessUsersService.getOrganizationStats:', error)
      throw error
    }
  }

  /**
   * Crear un nuevo usuario en la organización
   */
  static async createOrganizationUser(
    organizationId: string,
    userData: CreateBusinessUserRequest,
    createdBy: string
  ): Promise<BusinessUser> {
    const supabase = await createClient()

    try {
      // Paso 1: Validar que la contraseña esté presente
      if (!userData.password || !userData.password.trim()) {
        throw new Error('La contraseña es obligatoria')
      }

      if (userData.password.trim().length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }

      // Paso 2: Hash de contraseña (obligatoria)
      const passwordHash = await bcrypt.hash(userData.password.trim(), 10)

      // Paso 3: Crear el usuario
      const userInsertData: any = {
        username: userData.username,
        email: userData.email,
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        display_name: userData.display_name || null,
        cargo_rol: 'Business User',
        type_rol: 'Business User',
        organization_id: organizationId,
        password_hash: passwordHash
      }

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert(userInsertData)
        .select()
        .single()

      if (userError) {
        console.error('Error creating user:', userError)
        throw userError
      }

      // Paso 4: Agregar a organization_users (siempre activo porque siempre hay contraseña)
      const { error: orgUserError } = await supabase
        .from('organization_users')
        .insert({
          organization_id: organizationId,
          user_id: newUser.id,
          role: userData.org_role || 'member',
          status: 'active',
          invited_by: createdBy,
          invited_at: new Date().toISOString(),
          joined_at: new Date().toISOString()
        })

      if (orgUserError) {
        console.error('Error adding user to organization:', orgUserError)
        // Rollback: eliminar usuario si falla agregarlo a la organización
        await supabase.from('users').delete().eq('id', newUser.id)
        throw orgUserError
      }

      // Paso 4: Si es invitación, enviar email (placeholder)
      if (userData.send_invitation && !userData.password) {
        // TODO: Implementar servicio de email
      }

      // Paso 5: Retornar el usuario con info de organización
      const { data: orgUserData } = await supabase
        .from('organization_users')
        .select('role, status, joined_at')
        .eq('organization_id', organizationId)
        .eq('user_id', newUser.id)
        .single()

      const businessUser: BusinessUser = {
        ...newUser,
        org_role: orgUserData?.role || 'member',
        org_status: orgUserData?.status || 'invited',
        joined_at: orgUserData?.joined_at
      }

      return businessUser
    } catch (error) {
      console.error('Error in BusinessUsersService.createOrganizationUser:', error)
      throw error
    }
  }

  /**
   * Actualizar un usuario de la organización
   */
  static async updateOrganizationUser(
    organizationId: string,
    userId: string,
    userData: UpdateBusinessUserRequest
  ): Promise<BusinessUser> {
    const supabase = await createClient()

    try {
      // Verificar que el usuario pertenece a la organización
      const { data: orgUser, error: orgUserError } = await supabase
        .from('organization_users')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      if (orgUserError || !orgUser) {
        throw new Error('Usuario no pertenece a tu organización')
      }

      // Actualizar datos del usuario
      const userUpdateData: any = {}
      if (userData.first_name !== undefined) userUpdateData.first_name = userData.first_name
      if (userData.last_name !== undefined) userUpdateData.last_name = userData.last_name
      if (userData.display_name !== undefined) userUpdateData.display_name = userData.display_name

      if (Object.keys(userUpdateData).length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update(userUpdateData)
          .eq('id', userId)

        if (updateError) {
          throw updateError
        }
      }

      // Actualizar datos en organization_users
      const orgUpdateData: any = {}
      if (userData.org_role !== undefined) orgUpdateData.role = userData.org_role
      if (userData.org_status !== undefined) orgUpdateData.status = userData.org_status

      if (Object.keys(orgUpdateData).length > 0) {
        const { error: orgUpdateError } = await supabase
          .from('organization_users')
          .update(orgUpdateData)
          .eq('organization_id', organizationId)
          .eq('user_id', userId)

        if (orgUpdateError) {
          throw orgUpdateError
        }
      }

      // Retornar usuario actualizado
      const { data: orgUserData } = await supabase
        .from('organization_users')
        .select(`
          role,
          status,
          joined_at,
          users!organization_users_user_id_fkey (
            id,
            username,
            email,
            first_name,
            last_name,
            display_name,
            cargo_rol,
            type_rol,
            organization_id,
            email_verified,
            profile_picture_url,
            points,
            last_login_at,
            created_at,
            updated_at
          )
        `)
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      if (!orgUserData || !orgUserData.users) {
        throw new Error('Usuario no encontrado después de actualizar')
      }

      return {
        ...orgUserData.users,
        org_role: orgUserData?.role || 'member',
        org_status: orgUserData?.status || 'active',
        joined_at: orgUserData?.joined_at
      }
    } catch (error) {
      console.error('Error in BusinessUsersService.updateOrganizationUser:', error)
      throw error
    }
  }

  /**
   * Eliminar un usuario de la organización
   */
  static async deleteOrganizationUser(organizationId: string, userId: string): Promise<void> {
    const supabase = await createClient()

    try {
      // Verificar que el usuario pertenece a la organización
      const { data: orgUser, error: orgUserError } = await supabase
        .from('organization_users')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      if (orgUserError || !orgUser) {
        throw new Error('Usuario no pertenece a tu organización')
      }

      // Eliminar de organization_users (no eliminar el usuario real)
      const { error: deleteError } = await supabase
        .from('organization_users')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', userId)

      if (deleteError) {
        throw deleteError
      }

      // Actualizar el usuario para quitar referencia a la organización
      await supabase
        .from('users')
        .update({ organization_id: null, cargo_rol: 'Usuario', type_rol: 'Usuario' })
        .eq('id', userId)
    } catch (error) {
      console.error('Error in BusinessUsersService.deleteOrganizationUser:', error)
      throw error
    }
  }

  /**
   * Reenviar invitación a un usuario
   */
  static async resendInvitation(organizationId: string, userId: string): Promise<void> {
    // TODO: Implementar servicio de email
    const supabase = await createClient()
    
    // Actualizar invited_at
    await supabase
      .from('organization_users')
      .update({ invited_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
  }

  /**
   * Suspender un usuario
   */
  static async suspendUser(organizationId: string, userId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('organization_users')
      .update({ status: 'suspended' })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }
  }

  /**
   * Activar un usuario
   */
  static async activateUser(organizationId: string, userId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('organization_users')
      .update({ status: 'active' })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }
  }
}

