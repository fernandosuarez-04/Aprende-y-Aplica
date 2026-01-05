import 'server-only'

import { createClient as createClientServer } from '../../../lib/supabase/server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import { BusinessUsersService, BusinessUser, BusinessUserStats, CreateBusinessUserRequest, UpdateBusinessUserRequest } from './businessUsers.service'
import bcrypt from 'bcryptjs'

// Crear un cliente con service_role que bypasea RLS
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('🔧 [createServiceClient] URL exists:', !!supabaseUrl)
  console.log('🔧 [createServiceClient] Service key exists:', !!supabaseServiceKey)
  console.log('🔧 [createServiceClient] Service key length:', supabaseServiceKey?.length || 0)

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    throw new Error('Configuración de Supabase incompleta')
  }

  return createBrowserClient(supabaseUrl, supabaseServiceKey)
}

export class BusinessUsersServerService {
  /**
   * Obtener todos los usuarios de la organización del usuario autenticado
   * 🚀 OPTIMIZADO: Una sola query con JOIN en lugar de 2 queries secuenciales
   */
  static async getOrganizationUsers(organizationId: string): Promise<BusinessUser[]> {
    // Usar service client para bypasear RLS
    const supabase = createServiceClient()

    try {
      console.log('🔍 [BusinessUsersServerService] Getting users for org:', organizationId)

      // 🚀 OPTIMIZACIÓN: Una sola query con JOIN
      // Antes: 2 queries secuenciales (~600ms)
      // Después: 1 query con JOIN (~200ms)
      const { data: orgUsersData, error: orgUsersError } = await supabase
        .from('organization_users')
        .select(`
          id,
          organization_id,
          user_id,
          role,
          status,
          joined_at,
          users:users!organization_users_user_id_fkey (
            id,
            username,
            email,
            first_name,
            last_name,
            display_name,
            cargo_rol,
            type_rol,
            email_verified,
            profile_picture_url,
            bio,
            location,
            phone,
            last_login_at,
            created_at,
            updated_at
          )
        `)
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false })

      if (orgUsersError) {
        console.error('❌ Error fetching organization_users with join:', orgUsersError)
        throw orgUsersError
      }

      console.log('🔍 [BusinessUsersServerService] organization_users found:', orgUsersData?.length || 0)

      if (!orgUsersData || orgUsersData.length === 0) {
        return []
      }

      // Transformar los datos al formato esperado
      const users: BusinessUser[] = orgUsersData
        .filter(ou => ou.users)
        .map(ou => {
          const userData = ou.users as any
          return {
            ...userData,
            org_role: ou.role as 'owner' | 'admin' | 'member',
            org_status: ou.status as 'active' | 'invited' | 'suspended' | 'removed',
            joined_at: ou.joined_at
          }
        })

      console.log('🔍 [BusinessUsersServerService] Final users count:', users.length)
      return users
    } catch (error) {
      console.error('💥 Error in BusinessUsersServerService.getOrganizationUsers:', error)
      throw error
    }
  }


  // 
  /**
   * Obtener estadísticas de usuarios de la organización
   */
  static async getOrganizationStats(organizationId: string): Promise<BusinessUserStats> {
    const supabase = createServiceClient()

    // 
    try {
      const { data, error } = await supabase
        .from('organization_users')
        .select('role, status')
        .eq('organization_id', organizationId)

      // 
      if (error) {
        // console.error('Error fetching organization stats:', error)
        throw error
      }

      // 
      const stats: BusinessUserStats = {
        total: data?.length || 0,
        active: data?.filter((u: any) => u.status === 'active').length || 0,
        invited: data?.filter((u: any) => u.status === 'invited').length || 0,
        suspended: data?.filter((u: any) => u.status === 'suspended').length || 0,
        admins: data?.filter((u: any) => u.role === 'admin' || u.role === 'owner').length || 0,
        members: data?.filter((u: any) => u.role === 'member').length || 0
      }

      // 
      return stats
    } catch (error) {
      // console.error('Error in BusinessUsersService.getOrganizationStats:', error)
      throw error
    }
  }

  // 
  /**
   * Crear un nuevo usuario en la organización
   */
  static async createOrganizationUser(
    organizationId: string,
    userData: CreateBusinessUserRequest,
    createdBy: string
  ): Promise<BusinessUser> {
    const supabase = createServiceClient()

    // 
    try {
      // Paso 1: Validar que la contraseña esté presente
      if (!userData.password || !userData.password.trim()) {
        throw new Error('La contraseña es obligatoria')
      }

      // 
      if (userData.password.trim().length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }

      // 
      // Paso 2: Hash de contraseña (obligatoria)
      const passwordHash = await bcrypt.hash(userData.password.trim(), 10)

      // 
      // Paso 3: Validar que type_rol esté presente
      if (!userData.type_rol || !userData.type_rol.trim()) {
        throw new Error('El tipo de rol es obligatorio')
      }

      // Paso 4: Crear el usuario
      // NOTA: organization_id no existe en la tabla users, la relación se maneja en organization_users
      const userInsertData: any = {
        username: userData.username,
        email: userData.email,
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        display_name: userData.display_name || null,
        cargo_rol: 'Business User',
        type_rol: userData.type_rol.trim(),
        password_hash: passwordHash
      }

      // 
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert(userInsertData)
        .select()
        .single()

      // 
      if (userError) {
        // console.error('Error creating user:', userError)
        throw userError
      }

      // 
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

      // 
      if (orgUserError) {
        // console.error('Error adding user to organization:', orgUserError)
        // Rollback: eliminar usuario si falla agregarlo a la organización
        await supabase.from('users').delete().eq('id', newUser.id)
        throw orgUserError
      }

      // 
      // Paso 4: Si es invitación, enviar email (placeholder)
      if (userData.send_invitation && !userData.password) {
        // TODO: Implementar servicio de email
      }

      // 
      // Paso 5: Retornar el usuario con info de organización
      const { data: orgUserData } = await supabase
        .from('organization_users')
        .select('role, status, joined_at')
        .eq('organization_id', organizationId)
        .eq('user_id', newUser.id)
        .single()

      // 
      const businessUser: BusinessUser = {
        ...newUser,
        org_role: orgUserData?.role || 'member',
        org_status: orgUserData?.status || 'invited',
        joined_at: orgUserData?.joined_at
      }

      // 
      return businessUser
    } catch (error) {
      console.error('❌ [createOrganizationUser] Error completo:', error)
      if (error && typeof error === 'object') {
        console.error('❌ [createOrganizationUser] Error details:', JSON.stringify(error, null, 2))
      }
      throw error
    }
  }

  // 
  /**
   * Actualizar un usuario de la organización
   */
  static async updateOrganizationUser(
    organizationId: string,
    userId: string,
    userData: UpdateBusinessUserRequest
  ): Promise<BusinessUser> {
    const supabase = createServiceClient()

    // 
    try {
      // Verificar que el usuario pertenece a la organización
      const { data: orgUser, error: orgUserError } = await supabase
        .from('organization_users')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      // 
      if (orgUserError || !orgUser) {
        throw new Error('Usuario no pertenece a tu organización')
      }

      // 
      // Actualizar datos del usuario
      const userUpdateData: any = {}
      if (userData.first_name !== undefined) userUpdateData.first_name = userData.first_name
      if (userData.last_name !== undefined) userUpdateData.last_name = userData.last_name
      if (userData.display_name !== undefined) userUpdateData.display_name = userData.display_name
      if (userData.email !== undefined) userUpdateData.email = userData.email
      if (userData.cargo_rol !== undefined) userUpdateData.cargo_rol = userData.cargo_rol
      if (userData.type_rol !== undefined) userUpdateData.type_rol = userData.type_rol
      if (userData.profile_picture_url !== undefined) userUpdateData.profile_picture_url = userData.profile_picture_url
      if (userData.bio !== undefined) userUpdateData.bio = userData.bio
      if (userData.location !== undefined) userUpdateData.location = userData.location
      if (userData.phone !== undefined) userUpdateData.phone = userData.phone

      // 
      if (Object.keys(userUpdateData).length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update(userUpdateData)
          .eq('id', userId)

        // 
        if (updateError) {
          throw updateError
        }
      }

      // 
      // Actualizar datos en organization_users
      const orgUpdateData: any = {}
      if (userData.org_role !== undefined) orgUpdateData.role = userData.org_role
      if (userData.org_status !== undefined) orgUpdateData.status = userData.org_status

      // 
      if (Object.keys(orgUpdateData).length > 0) {
        const { error: orgUpdateError } = await supabase
          .from('organization_users')
          .update(orgUpdateData)
          .eq('organization_id', organizationId)
          .eq('user_id', userId)

        // 
        if (orgUpdateError) {
          throw orgUpdateError
        }
      }

      // 
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
            bio,
            location,
            phone,
            points,
            last_login_at,
            created_at,
            updated_at
          )
        `)
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      // 
      if (!orgUserData || !orgUserData.users) {
        throw new Error('Usuario no encontrado después de actualizar')
      }

      // 
      return {
        ...orgUserData.users,
        org_role: orgUserData?.role || 'member',
        org_status: orgUserData?.status || 'active',
        joined_at: orgUserData?.joined_at
      }
    } catch (error) {
      // console.error('Error in BusinessUsersService.updateOrganizationUser:', error)
      throw error
    }
  }

  // 
  /**
   * Eliminar un usuario de la organización
   */
  static async deleteOrganizationUser(organizationId: string, userId: string): Promise<void> {
    const supabase = createServiceClient()

    // 
    try {
      // Verificar que el usuario pertenece a la organización
      const { data: orgUser, error: orgUserError } = await supabase
        .from('organization_users')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single()

      // 
      if (orgUserError || !orgUser) {
        throw new Error('Usuario no pertenece a tu organización')
      }

      // 
      // Eliminar de organization_users (no eliminar el usuario real)
      const { error: deleteError } = await supabase
        .from('organization_users')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', userId)

      // 
      if (deleteError) {
        throw deleteError
      }

      // 
      // Actualizar el usuario para resetear el rol (organization_id no existe en users)
      await supabase
        .from('users')
        .update({ cargo_rol: 'Usuario', type_rol: 'Usuario' })
        .eq('id', userId)
    } catch (error) {
      // console.error('Error in BusinessUsersService.deleteOrganizationUser:', error)
      throw error
    }
  }

  // 
  /**
   * Reenviar invitación a un usuario
   */
  static async resendInvitation(organizationId: string, userId: string): Promise<void> {
    // TODO: Implementar servicio de email
    const supabase = createServiceClient()

    // 
    // Actualizar invited_at
    await supabase
      .from('organization_users')
      .update({ invited_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
  }

  // 
  /**
   * Suspender un usuario
   */
  static async suspendUser(organizationId: string, userId: string): Promise<void> {
    const supabase = createServiceClient()

    // 
    const { error } = await supabase
      .from('organization_users')
      .update({ status: 'suspended' })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)

    // 
    if (error) {
      throw error
    }
  }

  // 
  /**
   * Activar un usuario
   */
  static async activateUser(organizationId: string, userId: string): Promise<void> {
    const supabase = createServiceClient()

    // 
    const { error } = await supabase
      .from('organization_users')
      .update({ status: 'active' })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)

    // 
    if (error) {
      throw error
    }
  }
}

//
// 
