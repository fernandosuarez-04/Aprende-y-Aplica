'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function useUserRole() {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isInstructor, setIsInstructor] = useState(false)
  const [isUser, setIsUser] = useState(false)

  useEffect(() => {
    console.log('🔄 useUserRole: Verificando rol del usuario...')
    console.log('👤 Usuario:', user)
    console.log('⏳ Loading:', loading)
    
    if (user && !loading) {
      const role = user.cargo_rol?.toLowerCase()
      console.log('🎭 Rol detectado:', role)
      
      setIsAdmin(role === 'administrador')
      setIsInstructor(role === 'instructor')
      setIsUser(role === 'usuario')
      
      console.log('✅ Estados actualizados:', {
        isAdmin: role === 'administrador',
        isInstructor: role === 'instructor',
        isUser: role === 'usuario'
      })
    } else {
      console.log('❌ No hay usuario o está cargando')
      setIsAdmin(false)
      setIsInstructor(false)
      setIsUser(false)
    }
  }, [user, loading])

  return {
    user,
    isLoading: loading,
    isAdmin,
    isInstructor,
    isUser,
    role: user?.cargo_rol || null
  }
}
