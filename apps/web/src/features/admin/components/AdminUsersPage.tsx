'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { 
  UsersIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { AdminUser } from '../services/adminUsers.service'

const EditUserModal = dynamic(() => import('./EditUserModal').then(mod => ({ default: mod.EditUserModal })), {
  ssr: false
})
const DeleteUserModal = dynamic(() => import('./DeleteUserModal').then(mod => ({ default: mod.DeleteUserModal })), {
  ssr: false
})
const AddUserModal = dynamic(() => import('./AddUserModal').then(mod => ({ default: mod.AddUserModal })), {
  ssr: false
})

export function AdminUsersPage() {
  const { users, stats, isLoading, error, refetch } = useAdminUsers()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const filteredUsers = users.filter(user => {
    const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.cargo_rol === filterRole
    
    return matchesSearch && matchesRole
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrador':
        return 'bg-red-900/20 text-red-400'
      case 'Instructor':
        return 'bg-blue-900/20 text-blue-400'
      case 'Usuario':
        return 'bg-green-900/20 text-green-400'
      default:
        return 'bg-gray-900/20 text-gray-400'
    }
  }

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteUser = (user: AdminUser) => {
    setDeletingUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleSaveUser = async (userData: Partial<AdminUser>) => {
    if (!editingUser) return

    const response = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      throw new Error('Error al actualizar usuario')
    }

    // Refrescar la lista de usuarios
    refetch()
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return

    const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Error al eliminar usuario')
    }

    // Refrescar la lista de usuarios
    refetch()
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingUser(null)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeletingUser(null)
  }

  const handleAddUser = () => {
    setIsAddModalOpen(true)
  }

  const handleSaveNewUser = async (userData: any) => {
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        throw new Error('Error al crear usuario')
      }

      // Refrescar la lista de usuarios
      refetch()
      setIsAddModalOpen(false)
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="h-10 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ShieldExclamationIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error al cargar usuarios
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
              <div className="mt-4">
                <button
                  onClick={refetch}
                  className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Gestión de Usuarios
              </h1>
              <p className="text-gray-400">
                Administra todos los usuarios de la plataforma
              </p>
            </div>
            <button 
              onClick={handleAddUser}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Agregar Usuario</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-blue-900/20">
                <UsersIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Usuarios</p>
                <p className="text-2xl font-semibold text-white">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-green-900/20">
                <ShieldCheckIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Verificados</p>
                <p className="text-2xl font-semibold text-white">
                  {stats?.verifiedUsers || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-purple-900/20">
                <ShieldExclamationIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Instructores</p>
                <p className="text-2xl font-semibold text-white">
                  {stats?.instructors || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-red-900/20">
                <ShieldCheckIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Administradores</p>
                <p className="text-2xl font-semibold text-white">
                  {stats?.administrators || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-white"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-white"
              >
                <option value="all">Todos los roles</option>
                <option value="Usuario">Usuario</option>
                <option value="Instructor">Instructor</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Último acceso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredUsers.map((user) => {
                  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
                  return (
                    <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.profile_picture_url ? (
                              <img 
                                src={user.profile_picture_url} 
                                alt={displayName}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <UserCircleIcon className="h-10 w-10 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {displayName}
                            </div>
                            <div className="text-sm text-gray-400">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.cargo_rol)}`}>
                          {user.cargo_rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.email_verified 
                            ? 'bg-green-900/20 text-green-400'
                            : 'bg-yellow-900/20 text-yellow-400'
                        }`}>
                          {user.email_verified ? 'Verificado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Editar usuario"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Eliminar usuario"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSaveUser}
      />

      <DeleteUserModal
        user={deletingUser}
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSave={handleSaveNewUser}
      />
    </div>
  )
}
