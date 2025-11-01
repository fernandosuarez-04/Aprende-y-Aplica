export interface BusinessUser {
  id: string
  username: string
  email: string
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  cargo_rol: string
  type_rol: string
  organization_id?: string | null
  is_organization_admin?: boolean
  email_verified: boolean
  profile_picture_url?: string | null
  points: number
  last_login_at?: string | null
  created_at: string
  updated_at: string
  org_role?: 'owner' | 'admin' | 'member'
  org_status?: 'active' | 'invited' | 'suspended' | 'removed'
  joined_at?: string
}

export interface BusinessUserStats {
  total: number
  active: number
  invited: number
  suspended: number
  admins: number
  members: number
}

export interface CreateBusinessUserRequest {
  username: string
  email: string
  password?: string
  first_name?: string
  last_name?: string
  display_name?: string
  org_role?: 'owner' | 'admin' | 'member'
  send_invitation?: boolean
}

export interface UpdateBusinessUserRequest {
  first_name?: string
  last_name?: string
  display_name?: string
  org_role?: 'owner' | 'admin' | 'member'
  org_status?: 'active' | 'invited' | 'suspended' | 'removed'
}

export class BusinessUsersService {
  private static readonly API_BASE = '/api/business/users'

  static async getOrganizationUsers(): Promise<BusinessUser[]> {
    try {
      const response = await fetch(this.API_BASE)
      const data = await response.json()
      
      if (!response.ok) {
        console.warn('API error:', data.error)
        return [] // Retornar array vacío en lugar de lanzar
      }

      return data.users || []
    } catch (error) {
      console.error('Error fetching users:', error)
      return [] // Retornar array vacío en caso de error de red
    }
  }

  static async getOrganizationStats(): Promise<BusinessUserStats> {
    try {
      const response = await fetch(`${this.API_BASE}/stats`)
      const data = await response.json()
      
      if (!response.ok) {
        console.warn('API error:', data.error)
        return {
          total: 0,
          active: 0,
          invited: 0,
          suspended: 0,
          admins: 0,
          members: 0
        }
      }

      return data.stats || {
        total: 0,
        active: 0,
        invited: 0,
        suspended: 0,
        admins: 0,
        members: 0
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      return {
        total: 0,
        active: 0,
        invited: 0,
        suspended: 0,
        admins: 0,
        members: 0
      }
    }
  }

  static async createUser(userData: CreateBusinessUserRequest): Promise<BusinessUser> {
    const response = await fetch(this.API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al crear usuario')
    }

    return data.user
  }

  static async updateUser(userId: string, userData: UpdateBusinessUserRequest): Promise<BusinessUser> {
    const response = await fetch(`${this.API_BASE}/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Error al actualizar usuario')
    }

    return data.user
  }

  static async deleteUser(userId: string): Promise<void> {
    const response = await fetch(`${this.API_BASE}/${userId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al eliminar usuario' }))
      throw new Error(error.message || 'Error al eliminar usuario')
    }
  }

  static async resendInvitation(userId: string): Promise<void> {
    const response = await fetch(`${this.API_BASE}/${userId}/resend-invitation`, {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al reenviar invitación' }))
      throw new Error(error.message || 'Error al reenviar invitación')
    }
  }

  static async suspendUser(userId: string): Promise<void> {
    const response = await fetch(`${this.API_BASE}/${userId}/suspend`, {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al suspender usuario' }))
      throw new Error(error.message || 'Error al suspender usuario')
    }
  }

  static async activateUser(userId: string): Promise<void> {
    const response = await fetch(`${this.API_BASE}/${userId}/activate`, {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al activar usuario' }))
      throw new Error(error.message || 'Error al activar usuario')
    }
  }
}

