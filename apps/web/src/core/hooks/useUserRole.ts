'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'

// ✅ Constantes para roles - evita typos y facilita mantenimiento
const ROLES = {
  ADMIN: 'administrador',
  INSTRUCTOR: 'instructor',
  USER: 'usuario'
} as const

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
      // ✅ Normalizar con toLowerCase() y trim() para evitar bugs con espacios
      const role = user.cargo_rol?.toLowerCase().trim()
      console.log('🎭 Rol detectado:', role)
      
      setIsAdmin(role === ROLES.ADMIN)
      setIsInstructor(role === ROLES.INSTRUCTOR)
      setIsUser(role === ROLES.USER)
      
      console.log('✅ Estados actualizados:', {
        isAdmin: role === ROLES.ADMIN,
        isInstructor: role === ROLES.INSTRUCTOR,
        isUser: role === ROLES.USER
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
