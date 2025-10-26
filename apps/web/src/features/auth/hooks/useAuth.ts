'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  username: string
  first_name?: string
  last_name?: string
  display_name?: string
  cargo_rol?: string
  type_rol?: string
  profile_picture_url?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        console.log('🔄 useAuth: Obteniendo sesión inicial...')
        
        // Hacer una llamada al servidor para obtener el usuario actual
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include', // Importante para incluir cookies
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        console.log('📡 Respuesta de /api/auth/me:', response.status, response.ok)
        
        if (response.ok) {
          const data = await response.json()
          console.log('📋 Datos recibidos:', data)
          
          if (data.success && data.user) {
            console.log('✅ Usuario encontrado:', data.user)
            setUser(data.user)
          } else {
            console.log('❌ Usuario no encontrado en respuesta')
            setUser(null)
          }
        } else {
          console.log('❌ Respuesta no OK:', response.status)
          setUser(null)
        }
      } catch (error) {
        console.error('💥 Error getting session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()
  }, [])

  const logout = async () => {
    try {
      console.log('🚪 useAuth: Iniciando logout...')
      setLoading(true)
      
      // Llamar a la API de logout
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('📡 Respuesta de logout:', response.status)
      
      // Limpiar estado local
      setUser(null)
      
      // Redirigir a login
      router.push('/auth')
    } catch (error) {
      console.error('💥 Error during logout:', error)
      // Fallback: limpiar estado local y redirigir
      setUser(null)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      console.log('🔄 useAuth: Refrescando usuario...')
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
          return data.user
        }
      }
      
      setUser(null)
      return null
    } catch (error) {
      console.error('💥 Error refreshing user:', error)
      setUser(null)
      return null
    }
  }

  return {
    user,
    loading,
    isLoading: loading, // Alias para compatibilidad
    logout,
    refreshUser,
    isAuthenticated: !!user,
  }
}