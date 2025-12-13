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
import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
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
    type_rol: string
    org_role?: 'owner' | 'admin' | 'member'
  }) => {
    await createUser(userData)
    refetch()
  }

  const handleSaveUser = async (userId: string, userData: {
    first_name?: string
    last_name?: string
    display_name?: string
    email?: string
    cargo_rol?: string
    type_rol?: string
    org_role?: 'owner' | 'admin' | 'member'
    org_status?: 'active' | 'invited' | 'suspended' | 'removed'
    profile_picture_url?: string
    bio?: string
    location?: string
    phone?: string
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
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-white mb-2 tracking-tight">Gestión de Usuarios</h1>
            <p className="font-body text-carbon-400 text-sm leading-relaxed">Administra y gestiona los miembros de tu organización</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
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
                    // console.error('Error descargando plantilla:', err)
                  }
                }}
                variant="outline" 
                className="flex items-center gap-2 font-heading text-sm transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                Plantilla
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
              <Button 
                onClick={() => setIsImportModalOpen(true)} 
                variant="outline" 
                className="flex items-center gap-2 font-heading text-sm transition-all duration-200"
              >
                <Upload className="w-4 h-4" />
                Importar
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
              <Button 
                onClick={() => setIsAddModalOpen(true)} 
                variant="gradient" 
                className="flex items-center gap-2 font-heading text-sm transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                Agregar Usuario
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Banner informativo si hay error */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="p-4 bg-yellow-900/10 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <h4                 className="font-heading text-sm font-semibold text-yellow-400">Información</h4>
                <p className="font-body text-xs text-carbon-300 mt-1">
                  No se pudieron cargar los usuarios. Puedes comenzar agregando el primer usuario.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
          whileHover={{ y: -1, transition: { duration: 0.2 } }}
          className="relative bg-carbon-900/20 rounded-xl p-5 border border-carbon-700/10 hover:border-carbon-600/20 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-body text-xs text-carbon-500 mb-2 uppercase tracking-wider">Total Usuarios</p>
              <p className="font-heading text-2xl font-bold text-white leading-none">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 100 }}
          whileHover={{ y: -1, transition: { duration: 0.2 } }}
          className="relative bg-carbon-900/20 rounded-xl p-5 border border-carbon-700/10 hover:border-carbon-600/20 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-body text-xs text-carbon-500 mb-2 uppercase tracking-wider">Activos</p>
              <p className="font-heading text-2xl font-bold text-white leading-none">{stats.active}</p>
            </div>
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          whileHover={{ y: -1, transition: { duration: 0.2 } }}
          className="relative bg-carbon-900/20 rounded-xl p-5 border border-carbon-700/10 hover:border-carbon-600/20 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-body text-xs text-carbon-500 mb-2 uppercase tracking-wider">Invitados</p>
              <p className="font-heading text-2xl font-bold text-white leading-none">{stats.invited}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 100 }}
          whileHover={{ y: -1, transition: { duration: 0.2 } }}
          className="relative bg-carbon-900/20 rounded-xl p-5 border border-carbon-700/10 hover:border-carbon-600/20 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-body text-xs text-carbon-500 mb-2 uppercase tracking-wider">Administradores</p>
              <p className="font-heading text-2xl font-bold text-white leading-none">{stats.admins}</p>
            </div>
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="bg-carbon-900/10 rounded-lg p-4 border border-carbon-700/5 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <motion.div 
            className="relative"
            whileFocus={{ scale: 1.005 }}
            transition={{ duration: 0.2 }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-carbon-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-carbon-900/30 border border-carbon-700/10 rounded-lg font-body text-white text-sm placeholder-carbon-500 focus:outline-none focus:border-primary/40 focus:bg-carbon-900/40 transition-all duration-200"
            />
          </motion.div>

          <PremiumSelect
            value={filterRole}
            onChange={setFilterRole}
            options={[
              { value: 'all', label: 'Todos los roles' },
              { value: 'owner', label: 'Propietario' },
              { value: 'admin', label: 'Administrador' },
              { value: 'member', label: 'Miembro' }
            ]}
            placeholder="Todos los roles"
            icon={<Filter className="w-4 h-4" />}
          />

          <PremiumSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'active', label: 'Activo' },
              { value: 'invited', label: 'Invitado' },
              { value: 'suspended', label: 'Suspendido' },
              { value: 'removed', label: 'Removido' }
            ]}
            placeholder="Todos los estados"
            icon={<ShieldCheck className="w-4 h-4" />}
          />
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="bg-carbon-900/20 rounded-xl border border-carbon-700/10 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-carbon-700/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-heading font-semibold text-carbon-400 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-heading font-semibold text-carbon-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-heading font-semibold text-carbon-400 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-left text-xs font-heading font-semibold text-carbon-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-heading font-semibold text-carbon-400 uppercase tracking-wider">Último Login</th>
                <th className="px-6 py-4 text-right text-xs font-heading font-semibold text-carbon-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-carbon-700/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Users className="w-14 h-14 text-carbon-500 mx-auto mb-4" />
                    <p className="font-body text-carbon-300 text-lg mb-2 font-medium">
                      {users.length === 0 ? 'Aún no hay usuarios en tu organización' : 'No se encontraron usuarios'}
                    </p>
                    <p className="font-body text-carbon-500 text-sm mb-6">
                        {users.length === 0 
                          ? 'Comienza agregando tu primer usuario para gestionar tu equipo'
                          : 'Intenta con otros filtros de búsqueda'}
                      </p>
                      {users.length === 0 && (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button 
                            onClick={() => setIsAddModalOpen(true)} 
                            variant="gradient"
                            className="font-heading text-sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Primer Usuario
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const StatusIcon = getStatusIcon(user.org_status || 'active')
                  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username

                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.3 }}
                      whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.2)' }}
                      className="transition-all duration-200"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {user.profile_picture_url ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                              <Image
                                src={user.profile_picture_url}
                                alt={displayName}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-white font-heading font-bold text-sm flex-shrink-0">
                              {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-body text-white font-medium text-sm">{displayName}</p>
                            <p className="font-body text-carbon-500 text-xs mt-0.5">{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-body text-carbon-300 text-sm">{user.email}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-heading font-semibold ${getRoleColor(user.org_role || 'member')}`}>
                          {user.org_role === 'owner' ? 'Propietario' : user.org_role === 'admin' ? 'Administrador' : 'Miembro'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-heading font-semibold flex items-center gap-1.5 w-fit ${getStatusColor(user.org_status || 'active')}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {user.org_status === 'active' ? 'Activo' : 
                           user.org_status === 'invited' ? 'Invitado' : 
                           user.org_status === 'suspended' ? 'Suspendido' : 'Removido'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-body text-carbon-400 text-sm">
                          {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : 'Nunca'}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.org_status === 'invited' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleResendInvitation(user.id)}
                              className="p-2 hover:bg-primary/10 rounded-lg transition-all duration-200"
                              title="Reenviar invitación"
                            >
                              <Mail className="w-4 h-4 text-primary" />
                            </motion.button>
                          )}
                          {user.org_status === 'active' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSuspendUser(user.id)}
                              className="p-2 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                              title="Suspender usuario"
                            >
                              <XCircle className="w-4 h-4 text-red-400" />
                            </motion.button>
                          )}
                          {user.org_status === 'suspended' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleActivateUser(user.id)}
                              className="p-2 hover:bg-green-500/10 rounded-lg transition-all duration-200"
                              title="Activar usuario"
                            >
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setStatsUser(user)
                              setIsStatsModalOpen(true)
                            }}
                            className="p-2 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                            title="Ver estadísticas"
                          >
                            <BarChart3 className="w-4 h-4 text-blue-400" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditUser(user)}
                            className="p-2 hover:bg-primary/10 rounded-lg transition-all duration-200"
                            title="Editar usuario"
                          >
                            <Edit className="w-4 h-4 text-primary" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                            title="Eliminar usuario"
                          >
                            <Trash className="w-4 h-4 text-red-400" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

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

