'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Search,
  Filter,
  Shield,
  ShieldCheck,
  Edit,
  Trash,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Download,
  BarChart3
} from 'lucide-react'
import { useBusinessUsers } from '@/features/business-panel/hooks/useBusinessUsers'
import { BusinessUser } from '@/features/business-panel/services/businessUsers.service'
import { Button } from '@aprende-y-aplica/ui'
import Image from 'next/image'

const AddUserModal = dynamic(() => import('@/features/business-panel/components/BusinessAddUserModal').then(mod => ({ default: mod.BusinessAddUserModal })), {
  ssr: false
})
const EditUserModal = dynamic(() => import('@/features/business-panel/components/BusinessEditUserModal').then(mod => ({ default: mod.BusinessEditUserModal })), {
  ssr: false
})
const DeleteUserModal = dynamic(() => import('@/features/business-panel/components/BusinessDeleteUserModal').then(mod => ({ default: mod.BusinessDeleteUserModal })), {
  ssr: false
})
const ImportUsersModal = dynamic(() => import('@/features/business-panel/components/BusinessImportUsersModal').then(mod => ({ default: mod.BusinessImportUsersModal })), {
  ssr: false
})
const UserStatsModal = dynamic(
  () => import('@/features/business-panel/components/BusinessUserStatsModal').then((mod) => ({ 
    default: mod.BusinessUserStatsModal 
  })),
  { 
    ssr: false 
  }
)

export default function BusinessPanelUsersPage() {
  const { users, stats, isLoading, error, refetch, createUser, updateUser, deleteUser, resendInvitation, suspendUser, activateUser } = useBusinessUsers()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editingUser, setEditingUser] = useState<BusinessUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<BusinessUser | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [statsUser, setStatsUser] = useState<BusinessUser | null>(null)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)

  const filteredUsers = users.filter(user => {
    const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    const matchesSearch = displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.org_role === filterRole
    const matchesStatus = filterStatus === 'all' || user.org_status === filterStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/20 text-purple-400'
      case 'admin':
        return 'bg-blue-500/20 text-blue-400'
      case 'member':
        return 'bg-green-500/20 text-green-400'
      default:
        return 'bg-carbon-600 text-carbon-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400'
      case 'invited':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'suspended':
        return 'bg-red-500/20 text-red-400'
      case 'removed':
        return 'bg-carbon-600 text-carbon-300'
      default:
        return 'bg-carbon-600 text-carbon-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return CheckCircle
      case 'invited':
        return Mail
      case 'suspended':
        return XCircle
      case 'removed':
        return AlertCircle
      default:
        return AlertCircle
    }
  }

  const handleEditUser = (user: BusinessUser) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteUser = (user: BusinessUser) => {
    setDeletingUser(user)
    setIsDeleteModalOpen(true)
  }

  const handleSaveNewUser = async (userData: {
    username: string
    email: string
    password: string
    first_name?: string
    last_name?: string
    display_name?: string
    org_role?: 'owner' | 'admin' | 'member'
  }) => {
    await createUser(userData)
    refetch()
  }

  const handleSaveUser = async (userId: string, userData: {
    first_name?: string
    last_name?: string
    display_name?: string
    org_role?: 'owner' | 'admin' | 'member'
    org_status?: 'active' | 'invited' | 'suspended' | 'removed'
  }) => {
    await updateUser(userId, userData)
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return
    await deleteUser(deletingUser.id)
  }

  const handleResendInvitation = async (userId: string) => {
    await resendInvitation(userId)
  }

  const handleSuspendUser = async (userId: string) => {
    await suspendUser(userId)
  }

  const handleActivateUser = async (userId: string) => {
    await activateUser(userId)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingUser(null)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeletingUser(null)
  }

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="w-full"
      >
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-carbon-700/50 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-carbon-700/50 rounded-xl"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-carbon-700/50 rounded-xl"></div>
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-3">Gestión de Usuarios</h1>
            <p className="text-carbon-300">Administra y gestiona los miembros de tu organización</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/business/users/template', {
                    credentials: 'include'
                  })
                  if (!response.ok) throw new Error('Error al descargar')
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'plantilla-importacion-usuarios.csv'
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  window.URL.revokeObjectURL(url)
                } catch (err) {
                  console.error('Error descargando plantilla:', err)
                }
              }}
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Plantilla
            </Button>
            <Button 
              onClick={() => setIsImportModalOpen(true)} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Importar
            </Button>
            <Button 
              onClick={() => setIsAddModalOpen(true)} 
              variant="gradient" 
              className="flex items-center gap-2"
            >
            <Plus className="w-5 h-5" />
            Agregar Usuario
          </Button>
          </div>
        </div>
      </div>

      {/* Banner informativo si hay error */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-400">Información</h4>
                <p className="text-xs text-carbon-300 mt-1">
                  No se pudieron cargar los usuarios. Puedes comenzar agregando el primer usuario.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-carbon-400">Total Usuarios</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-carbon-400">Activos</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-carbon-400">Invitados</p>
              <p className="text-2xl font-bold text-white">{stats.invited}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-carbon-400">Administradores</p>
              <p className="text-2xl font-bold text-white">{stats.admins}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl p-6 border border-carbon-600 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-carbon-600/50 border border-carbon-500 rounded-xl text-white placeholder-carbon-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-carbon-600/50 border border-carbon-500 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
            >
              <option value="all">Todos los roles</option>
              <option value="owner">Propietario</option>
              <option value="admin">Administrador</option>
              <option value="member">Miembro</option>
            </select>
          </div>

          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-carbon-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-carbon-600/50 border border-carbon-500 rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="invited">Invitado</option>
              <option value="suspended">Suspendido</option>
              <option value="removed">Removido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gradient-to-br from-carbon-700 to-carbon-800 rounded-xl border border-carbon-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-carbon-900/50 border-b border-carbon-600">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Usuario</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Rol</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-carbon-300">Último Login</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-carbon-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-600">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-carbon-500 mx-auto mb-3" />
                    <p className="text-carbon-400 text-lg mb-2">
                      {users.length === 0 ? 'Aún no hay usuarios en tu organización' : 'No se encontraron usuarios'}
                    </p>
                    <p className="text-carbon-500 text-sm mb-4">
                      {users.length === 0 
                        ? 'Comienza agregando tu primer usuario para gestionar tu equipo'
                        : 'Intenta con otros filtros de búsqueda'}
                    </p>
                    {users.length === 0 && (
                      <Button 
                        onClick={() => setIsAddModalOpen(true)} 
                        variant="gradient"
                        className="mt-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Primer Usuario
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const StatusIcon = getStatusIcon(user.org_status || 'active')
                  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username

                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-carbon-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.profile_picture_url ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/30">
                              <Image
                                src={user.profile_picture_url}
                                alt={displayName}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                          </div>
                          )}
                          <div>
                            <p className="text-white font-medium">{displayName}</p>
                            <p className="text-carbon-400 text-sm">{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-carbon-300">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.org_role || 'member')}`}>
                          {user.org_role === 'owner' ? 'Propietario' : user.org_role === 'admin' ? 'Administrador' : 'Miembro'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 w-fit ${getStatusColor(user.org_status || 'active')}`}>
                          <StatusIcon className="w-4 h-4" />
                          {user.org_status === 'active' ? 'Activo' : 
                           user.org_status === 'invited' ? 'Invitado' : 
                           user.org_status === 'suspended' ? 'Suspendido' : 'Removido'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-carbon-400 text-sm">
                          {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : 'Nunca'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {user.org_status === 'invited' && (
                            <button
                              onClick={() => handleResendInvitation(user.id)}
                              className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                              title="Reenviar invitación"
                            >
                              <Mail className="w-4 h-4 text-primary" />
                            </button>
                          )}
                          {user.org_status === 'active' && (
                            <button
                              onClick={() => handleSuspendUser(user.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Suspender usuario"
                            >
                              <XCircle className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                          {user.org_status === 'suspended' && (
                            <button
                              onClick={() => handleActivateUser(user.id)}
                              className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
                              title="Activar usuario"
                            >
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setStatsUser(user)
                              setIsStatsModalOpen(true)
                            }}
                            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="Ver estadísticas"
                          >
                            <BarChart3 className="w-4 h-4 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                            title="Editar usuario"
                          >
                            <Edit className="w-4 h-4 text-primary" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewUser}
      />

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

      <ImportUsersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          refetch()
          setIsImportModalOpen(false)
        }}
      />

      {statsUser && (
        <UserStatsModal
          user={statsUser}
          isOpen={isStatsModalOpen}
          onClose={() => {
            setIsStatsModalOpen(false)
            setStatsUser(null)
          }}
        />
      )}
    </motion.div>
  )
}

