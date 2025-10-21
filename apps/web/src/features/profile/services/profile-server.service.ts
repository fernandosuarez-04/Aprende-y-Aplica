import { createClient } from '../../../lib/supabase/server'

export interface UserProfile {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  display_name: string
  phone: string
  bio: string
  location: string
  cargo_rol: string
  type_rol: string
  profile_picture_url: string
  curriculum_url: string
  linkedin_url: string
  github_url: string
  website_url: string
  country_code: string
  points: number
  created_at: string
  last_login_at: string
  email_verified: boolean
}

export interface UpdateProfileRequest {
  username?: string
  email?: string
  first_name?: string
  last_name?: string
  display_name?: string
  phone?: string
  bio?: string
  location?: string
  cargo_rol?: string
  type_rol?: string
  profile_picture_url?: string
  curriculum_url?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  country_code?: string
}

export class ProfileServerService {
  static async getProfile(userId: string): Promise<UserProfile> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        throw new Error(`Error al obtener perfil: ${error.message}`)
      }

      if (!data) {
        throw new Error('Perfil no encontrado')
      }

      return {
        id: data.id,
        username: data.username || '',
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        display_name: data.display_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        location: data.location || '',
        cargo_rol: data.cargo_rol || '',
        type_rol: data.type_rol || '',
        profile_picture_url: data.profile_picture_url || '',
        curriculum_url: data.curriculum_url || '',
        linkedin_url: data.linkedin_url || '',
        github_url: data.github_url || '',
        website_url: data.website_url || '',
        country_code: data.country_code || '',
        points: data.points || 0,
        created_at: data.created_at,
        last_login_at: data.last_login_at || data.created_at,
        email_verified: data.email_verified || false
      }
    } catch (error) {
      console.error('Error in ProfileServerService.getProfile:', error)
      throw error
    }
  }

  static async updateProfile(userId: string, updates: UpdateProfileRequest): Promise<UserProfile> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        throw new Error(`Error al actualizar perfil: ${error.message}`)
      }

      if (!data) {
        throw new Error('Error al actualizar perfil')
      }

      return {
        id: data.id,
        username: data.username || '',
        email: data.email || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        display_name: data.display_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        location: data.location || '',
        cargo_rol: data.cargo_rol || '',
        type_rol: data.type_rol || '',
        profile_picture_url: data.profile_picture_url || '',
        curriculum_url: data.curriculum_url || '',
        linkedin_url: data.linkedin_url || '',
        github_url: data.github_url || '',
        website_url: data.website_url || '',
        country_code: data.country_code || '',
        points: data.points || 0,
        created_at: data.created_at,
        last_login_at: data.last_login_at || data.created_at,
        email_verified: data.email_verified || false
      }
    } catch (error) {
      console.error('Error in ProfileServerService.updateProfile:', error)
      throw error
    }
  }
}
