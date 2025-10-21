'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { createClient } from '../../../lib/supabase/client'
import type { Database } from '../../../lib/supabase/types'

type UserProfile = Database['public']['Tables']['users']['Row']

interface UseUserProfileReturn {
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useUserProfile(): UseUserProfileReturn {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) {
      setUserProfile(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError) {
        console.error('Error fetching user profile:', fetchError)
        throw new Error(`Error al obtener perfil: ${fetchError.message}`)
      }

      setUserProfile(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching user profile:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const refetch = useCallback(async () => {
    await fetchUserProfile()
  }, [fetchUserProfile])

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  return {
    userProfile,
    loading,
    error,
    refetch,
  }
}
