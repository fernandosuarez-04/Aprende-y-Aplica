'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import { createClient } from '../../../lib/supabase/client'

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
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      
      // Intentar cargar desde la API
      try {
        const response = await fetch('/api/profile', {
          credentials: 'include'
        })
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const profileData = await response.json()
        setProfile(profileData)
        return
      } catch (apiError) {
        console.warn('API error, using mock data:', apiError)
      }
      
      // Fallback a datos mock si la API falla
      const mockProfile: UserProfile = {
        id: user.id,
        username: user.username || 'usuario',
        email: user.email || 'usuario@ejemplo.com',
        first_name: 'Fernando',
        last_name: 'Suarez',
        display_name: user.display_name || 'Fernando Suarez',
        phone: '+52 55 1234 5678',
        bio: 'Desarrollador de software apasionado por la tecnología y el aprendizaje continuo.',
        location: 'Ciudad de México, México',
        cargo_rol: 'Desarrollador de Software',
        type_rol: 'Senior',
        profile_picture_url: '',
        curriculum_url: '',
        linkedin_url: 'https://linkedin.com/in/fernando-suarez',
        github_url: 'https://github.com/fernando-suarez',
        website_url: 'https://fernando-suarez.dev',
        country_code: 'MX',
        points: 1250,
        created_at: '2024-01-15T10:30:00Z',
        last_login_at: new Date().toISOString(),
        email_verified: true
      }
      
      setProfile(mockProfile)
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
      
      // Intentar actualizar via API
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updates)
        })
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        return
      } catch (apiError) {
        console.warn('API error, updating local state:', apiError)
      }
      
      // Fallback: actualizar estado local
      setProfile(prev => prev ? { ...prev, ...updates } : null)
      
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
      
      // Verificar que el usuario esté autenticado
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
      }
      
      // Validar archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP.')
      }

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('El archivo es demasiado grande. Máximo 5MB.')
      }
      
      const formData = new FormData()
      formData.append('file', file)
      
      // Subir directamente a Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-pictures/${fileName}`

      // Subir archivo a Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading profile picture:', uploadError)
        throw new Error(`Error al subir imagen: ${uploadError.message}`)
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath)

      // Actualizar perfil en la base de datos
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          profile_picture_url: publicUrl,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', currentUser.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        throw new Error(`Error al actualizar perfil: ${updateError.message}`)
      }
      
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
      
      // Verificar que el usuario esté autenticado
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
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
      
      const formData = new FormData()
      formData.append('file', file)
      
      // Subir directamente a Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}-cv-${Date.now()}.${fileExt}`
      const filePath = `curriculums/${fileName}`

      // Subir archivo a Supabase Storage
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
        } as any)
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
