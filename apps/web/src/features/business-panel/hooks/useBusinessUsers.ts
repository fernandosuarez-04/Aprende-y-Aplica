import { useState, useEffect } from 'react'
import { BusinessUsersService, BusinessUser, BusinessUserStats } from '../services/businessUsers.service'

export function useBusinessUsers() {
  const [users, setUsers] = useState<BusinessUser[]>([])
  const [stats, setStats] = useState<BusinessUserStats>({
    total: 0,
    active: 0,
    invited: 0,
    suspended: 0,
    admins: 0,
    members: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [usersData, statsData] = await Promise.all([
        BusinessUsersService.getOrganizationUsers(),
        BusinessUsersService.getOrganizationStats()
      ])
      
      setUsers(usersData)
      setStats(statsData)
      
      // Si no hay datos, mostrar mensaje informativo pero no error
      if (usersData.length === 0) {
        // console.info('No users found in organization')
      }
    } catch (err) {
      // Solo setear error en casos críticos, no bloquear UI
      // console.error('Error loading users:', err)
      setUsers([])
      setStats({
        total: 0,
        active: 0,
        invited: 0,
        suspended: 0,
        admins: 0,
        members: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const createUser = async (userData: {
    username: string
    email: string
    password?: string
    first_name?: string
    last_name?: string
    display_name?: string
    org_role?: 'owner' | 'admin' | 'member'
    send_invitation?: boolean
  }) => {
    try {
      const newUser = await BusinessUsersService.createUser(userData)
      setUsers(prev => [...prev, newUser])
      fetchUsers() // Refrescar stats
      return newUser
    } catch (err) {
      throw err
    }
  }

  const updateUser = async (userId: string, userData: {
    first_name?: string
    last_name?: string
    display_name?: string
    org_role?: 'owner' | 'admin' | 'member'
    org_status?: 'active' | 'invited' | 'suspended' | 'removed'
  }) => {
    try {
      const updatedUser = await BusinessUsersService.updateUser(userId, userData)
      setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user))
      fetchUsers() // Refrescar stats
      return updatedUser
    } catch (err) {
      throw err
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      await BusinessUsersService.deleteUser(userId)
      setUsers(prev => prev.filter(user => user.id !== userId))
      fetchUsers() // Refrescar stats
    } catch (err) {
      throw err
    }
  }

  const resendInvitation = async (userId: string) => {
    try {
      await BusinessUsersService.resendInvitation(userId)
    } catch (err) {
      throw err
    }
  }

  const suspendUser = async (userId: string) => {
    try {
      await BusinessUsersService.suspendUser(userId)
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, org_status: 'suspended' as const }
          : user
      ))
      fetchUsers() // Refrescar stats
    } catch (err) {
      throw err
    }
  }

  const activateUser = async (userId: string) => {
    try {
      await BusinessUsersService.activateUser(userId)
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, org_status: 'active' as const }
          : user
      ))
      fetchUsers() // Refrescar stats
    } catch (err) {
      throw err
    }
  }

  return {
    users,
    stats,
    isLoading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resendInvitation,
    suspendUser,
    activateUser
  }
}

