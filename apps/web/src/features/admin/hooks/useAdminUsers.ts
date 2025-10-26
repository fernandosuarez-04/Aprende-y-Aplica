'use client'

import { useState, useEffect } from 'react'
import { AdminUser, UserStats } from '../services/adminUsers.service'

interface UseAdminUsersReturn {
  users: AdminUser[]
  stats: UserStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useAdminUsers(): UseAdminUsersReturn {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/users')
      
      if (!response.ok) {
        throw new Error('Error al obtener usuarios')
      }

      const data = await response.json()
      setUsers(data.users)
      setStats(data.stats)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    stats,
    isLoading,
    error,
    refetch: fetchUsers
  }
}
