'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'

// ✅ Constantes para roles - evita typos y facilita mantenimiento
const ROLES = {
  ADMIN: 'administrador',
  INSTRUCTOR: 'instructor',
  BUSINESS: 'business',
  BUSINESS_USER: 'business user',
  USER: 'usuario'
} as const

export function useUserRole() {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isInstructor, setIsInstructor] = useState(false)
  const [isBusiness, setIsBusiness] = useState(false)
  const [isBusinessUser, setIsBusinessUser] = useState(false)
  const [isUser, setIsUser] = useState(false)

  useEffect(() => {
    if (user && !loading) {
      // ✅ Normalizar con toLowerCase() y trim() para evitar bugs con espacios
      const role = user.cargo_rol?.toLowerCase().trim()

      setIsAdmin(role === ROLES.ADMIN)
      setIsInstructor(role === ROLES.INSTRUCTOR)
      setIsBusiness(role === ROLES.BUSINESS)
      setIsBusinessUser(role === ROLES.BUSINESS_USER)
      setIsUser(role === ROLES.USER)
    } else {
      setIsAdmin(false)
      setIsInstructor(false)
      setIsBusiness(false)
      setIsBusinessUser(false)
      setIsUser(false)
    }
  }, [user, loading])

  return {
    user,
    isLoading: loading,
    isAdmin,
    isInstructor,
    isBusiness,
    isBusinessUser,
    isUser,
    role: user?.cargo_rol || null
  }
}
