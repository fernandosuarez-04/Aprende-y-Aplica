'use client'

import { useState, useEffect } from 'react'

interface AdminUser {
  id: string
  first_name: string
  last_name: string
  email: string
  profile_picture_url?: string
  cargo_rol: string
  created_at: string
  updated_at: string
}

export function useAdminUser() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      console.log('🔄 useAdminUser: Iniciando fetchUserData')
      
      try {
        setIsLoading(true)
        setError(null)
        console.log('🌐 Haciendo fetch a /api/auth/me')

        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        console.log('📡 Respuesta recibida:', response.status, response.ok)
        
        if (!response.ok) {
          throw new Error('Error al obtener datos del usuario')
        }

        const data = await response.json()
        console.log('📋 Datos recibidos:', data)
        
        if (data.success && data.user) {
          console.log('✅ Usuario encontrado:', data.user)
          setUser(data.user)
        } else {
          console.log('❌ Usuario no encontrado en respuesta')
          throw new Error(data.error || 'Error al obtener datos del usuario')
        }
      } catch (err) {
        console.error('💥 Error fetching admin user:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  return {
    user,
    isLoading,
    error,
    refetch: () => {
      setUser(null)
      setIsLoading(true)
      setError(null)
      // El useEffect se ejecutará automáticamente
    }
  }
}
