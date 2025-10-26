'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { createClient } from '../../../lib/supabase/client'
import type { Database } from '../../../lib/supabase/types'
import { createBrowserClient } from '@supabase/ssr'

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

interface UseProfileReturn {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  saving: boolean
  updateProfile: (updates: UpdateProfileRequest) => Promise<void>
  uploadProfilePicture: (file: File) => Promise<string>
  uploadCurriculum: (file: File) => Promise<string>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Consultar directamente la base de datos
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single() as { data: Database['public']['Tables']['users']['Row'] | null, error: any }

      if (fetchError || !data) {
        console.error('Error fetching user profile:', fetchError)
        throw new Error(`Error al obtener perfil: ${fetchError?.message || 'No data found'}`)
      }

      // Convertir los datos de la base de datos al formato esperado
      const profileData: UserProfile = {
        id: data.id,
        username: data.username || 'usuario',
        email: data.email || 'usuario@ejemplo.com',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        display_name: data.display_name || data.first_name || 'Usuario',
        phone: data.phone || data.phone_number || '',
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
        last_login_at: data.last_login_at || '',
        email_verified: data.email_verified || false
      }
      
      setProfile(profileData)
      console.log('🔍 Profile data loaded:', profileData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const updateProfile = useCallback(async (updates: UpdateProfileRequest) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado')
    }

    try {
      setSaving(true)
      setError(null)

      // Actualizar directamente en la base de datos usando el cliente correcto
      const supabase = createClient()

      const { data, error: updateError } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select('*')
        .single()

      if (updateError || !data) {
        console.error('Error updating profile:', updateError)
        throw new Error(`Error al actualizar perfil: ${updateError?.message || 'No data found'}`)
      }

      // Convertir los datos actualizados al formato esperado
      const updatedProfileData: UserProfile = {
        id: (data as any).id,
        username: (data as any).username || 'usuario',
        email: (data as any).email || 'usuario@ejemplo.com',
        first_name: (data as any).first_name || '',
        last_name: (data as any).last_name || '',
        display_name: (data as any).display_name || (data as any).first_name || 'Usuario',
        phone: (data as any).phone || (data as any).phone_number || '',
        bio: (data as any).bio || '',
        location: (data as any).location || '',
        cargo_rol: (data as any).cargo_rol || '',
        type_rol: (data as any).type_rol || '',
        profile_picture_url: (data as any).profile_picture_url || '',
        curriculum_url: (data as any).curriculum_url || '',
        linkedin_url: (data as any).linkedin_url || '',
        github_url: (data as any).github_url || '',
        website_url: (data as any).website_url || '',
        country_code: (data as any).country_code || '',
        points: (data as any).points || 0,
        created_at: (data as any).created_at,
        last_login_at: (data as any).last_login_at || '',
        email_verified: (data as any).email_verified || false
      }
      
      setProfile(updatedProfileData)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error updating profile:', err)
      throw err
    } finally {
      setSaving(false)
    }
  }, [user?.id])

  const uploadProfilePicture = useCallback(async (file: File) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado')
    }

    try {
      setSaving(true)
      setError(null)
      
      // Usar el usuario del hook useAuth (ya verificado)
      const currentUser = user
      
      if (!currentUser) {
        throw new Error('Usuario no autenticado')
      }
      
      console.log('🔍 Usuario autenticado:', currentUser.id)
      
      // Validar archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP.')
      }

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('El archivo es demasiado grande. Máximo 5MB.')
      }
      
      console.log('📁 Archivo válido:', file.name, file.type, file.size)

      // Subir directamente a Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-pictures/${fileName}`

      console.log('📤 Subiendo archivo:', filePath)

      // Usar el cliente de Supabase existente con la sesión autenticada
      const supabase = createClient()

      console.log('✅ Usuario autenticado:', currentUser.id)

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        console.error('❌ Error uploading profile picture:', uploadError)
        throw new Error(`Error al subir imagen: ${uploadError.message}`)
      }

      console.log('✅ Upload exitoso directo a Supabase')

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      console.log('🔗 URL pública:', publicUrl)

      // Actualizar perfil en la base de datos
      const { error: updateError } = await supabase
        .from('users')
        .update({
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)

      if (updateError) {
        console.error('❌ Error updating profile:', updateError)
        throw new Error(`Error al actualizar perfil: ${updateError.message}`)
      }
      
      console.log('✅ Perfil actualizado en base de datos')
      
      // Actualizar perfil local con nueva URL
      setProfile(prev => prev ? { ...prev, profile_picture_url: publicUrl } : null)
      
      return publicUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error uploading profile picture:', err)
      throw err
    } finally {
      setSaving(false)
    }
  }, [user?.id])

  const uploadCurriculum = useCallback(async (file: File) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado')
    }

    try {
      setSaving(true)
      setError(null)
      
      // Usar el usuario del hook useAuth (ya verificado)
      const currentUser = user
      
      if (!currentUser) {
        throw new Error('Usuario no autenticado')
      }
      
      // Validar archivo
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no válido. Solo se permiten PDF y documentos de Word.')
      }

      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('El archivo es demasiado grande. Máximo 10MB.')
      }
      
      // Subir directamente a Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}-cv-${Date.now()}.${fileExt}`
      const filePath = `curriculums/${fileName}`

      // Usar el cliente de Supabase existente con la sesión autenticada
      const supabase = createClient()

      const { data, error: uploadError } = await supabase.storage
        .from('curriculums')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading curriculum:', uploadError)
        throw new Error(`Error al subir curriculum: ${uploadError.message}`)
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('curriculums')
        .getPublicUrl(filePath)

      // Actualizar perfil en la base de datos
      const { error: updateError } = await supabase
        .from('users')
        .update({
          curriculum_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        throw new Error(`Error al actualizar perfil: ${updateError.message}`)
      }
      
      // Actualizar perfil local con nueva URL
      setProfile(prev => prev ? { ...prev, curriculum_url: publicUrl } : null)
      
      return publicUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error uploading curriculum:', err)
      throw err
    } finally {
      setSaving(false)
    }
  }, [user?.id])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user?.id) {
      throw new Error('Usuario no autenticado')
    }

    try {
      setSaving(true)
      setError(null)
      
      // TODO: Implementar API para cambio de contraseña
      console.log('Change password not implemented yet')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error changing password:', err)
      throw err
    } finally {
      setSaving(false)
    }
  }, [user?.id])

  const refetch = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    loading,
    error,
    saving,
    updateProfile,
    uploadProfilePicture,
    uploadCurriculum,
    changePassword,
    refetch
  }
}
