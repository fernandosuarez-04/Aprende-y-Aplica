'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { 
  UserGroupIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { useAdminCommunities } from '../hooks/useAdminCommunities'
import { AdminCommunity } from '../services/adminCommunities.service'
import { useRouter } from 'next/navigation'

// Lazy loading de modales de Communities
const EditCommunityModal = dynamic(() => import('./EditCommunityModal').then(mod => ({ default: mod.EditCommunityModal })), {
  ssr: false
})

const DeleteCommunityModal = dynamic(() => import('./DeleteCommunityModal').then(mod => ({ default: mod.DeleteCommunityModal })), {
  ssr: false
})

const AddCommunityModal = dynamic(() => import('./AddCommunityModal').then(mod => ({ default: mod.AddCommunityModal })), {
  ssr: false
})

export function AdminCommunitiesPage() {
  const router = useRouter()
  const { communities, stats, isLoading, error, refetch } = useAdminCommunities()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Estados para modales
  const [editingCommunity, setEditingCommunity] = useState<AdminCommunity | null>(null)
  const [deletingCommunity, setDeletingCommunity] = useState<AdminCommunity | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)


  // Funciones para manejar las acciones de las comunidades
  const handleEditCommunity = (community: AdminCommunity) => {
    setEditingCommunity(community)
    setIsEditModalOpen(true)
  }

  const handleDeleteCommunity = (community: AdminCommunity) => {
    setDeletingCommunity(community)
    setIsDeleteModalOpen(true)
  }

  const handleViewCommunity = (community: AdminCommunity) => {
    router.push(`/admin/communities/${community.slug}`)
  }

  const handleToggleVisibility = async (community: AdminCommunity) => {
    try {
      const response = await fetch(`/api/admin/communities/${community.id}/toggle-visibility`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        refetch() // Recargar los datos
      }
    } catch (error) {
      // console.error('Error toggling community visibility:', error)
    }
  }

  const handleSaveCommunity = async (communityData: any) => {
    try {
      const response = await fetch(`/api/admin/communities/${editingCommunity?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(communityData)
      })
      
      if (response.ok) {
        refetch() // Recargar los datos
      } else {
        throw new Error('Error al actualizar comunidad')
      }
    } catch (error) {
      // console.error('Error saving community:', error)
      throw error
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingCommunity) return
    
    try {
      const response = await fetch(`/api/admin/communities/${deletingCommunity.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        refetch() // Recargar los datos
      } else {
        throw new Error('Error al eliminar comunidad')
      }
    } catch (error) {
      // console.error('Error deleting community:', error)
      throw error
    }
  }

  const handleAddCommunity = () => {
    setIsAddModalOpen(true)
  }

  const handleSaveNewCommunity = async (communityData: any) => {
    try {
      // console.log('🔄 Enviando datos de comunidad:', communityData)
      
      const response = await fetch('/api/admin/communities/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(communityData)
      })
      
      // console.log('📡 Respuesta del servidor:', response.status, response.statusText)
      
      const data = await response.json()
      // console.log('📋 Datos de respuesta:', data)
      
      if (response.ok && data.success) {
        // console.log('✅ Comunidad creada exitosamente')
        refetch() // Recargar los datos
      } else {
        // console.error('❌ Error en la respuesta:', data)
        throw new Error(data.message || data.error || 'Error al crear la comunidad')
      }
    } catch (error) {
      // console.error('💥 Error creating community:', error)
      throw error
    }
  }

  // Funciones para cerrar modales
  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingCommunity(null)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeletingCommunity(null)
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
  }

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (community.creator_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    // Para categorías, usaremos la visibilidad o access_type como categoría
    const communityCategory = community.visibility === 'private' ? 'Privada' : 
                             community.access_type === 'moderated' ? 'Moderada' : 'Pública'
    const matchesCategory = filterCategory === 'all' || communityCategory === filterCategory
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && community.is_active) ||
                         (filterStatus === 'inactive' && !community.is_active)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Pública':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'Privada':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'Moderada':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error al cargar las comunidades
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={refetch}
                  className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Gestión de Comunidades
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Administra todas las comunidades de la plataforma
              </p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleAddCommunity}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Crear Comunidad</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Comunidades</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats?.totalCommunities || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <UsersIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Miembros</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats?.totalMembers || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Posts</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats?.totalPosts || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <ShieldCheckIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Comunidades Activas</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats?.activeCommunities || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar comunidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Todas las categorías</option>
                <option value="Pública">Pública</option>
                <option value="Privada">Privada</option>
                <option value="Moderada">Moderada</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <div key={community.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-300">
              {/* Community Image */}
              {community.image_url && (
                <div className="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                  <img
                    src={community.image_url}
                    alt={community.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(community.visibility === 'private' ? 'Privada' : community.access_type === 'moderated' ? 'Moderada' : 'Pública')}`}>
                    {community.visibility === 'private' ? 'Privada' : community.access_type === 'moderated' ? 'Moderada' : 'Pública'}
                  </span>
                  <div className="flex space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      community.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {community.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                    {community.access_type === 'moderated' && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                        Moderada
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {community.name}
                </h3>

                {community.course && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                      <DocumentTextIcon className="h-3 w-3 mr-1" />
                      {community.course.title}
                    </span>
                  </div>
                )}

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {community.description}
                </p>
              </div>

              {/* Stats */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <UsersIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Miembros</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {community.member_count}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Posts</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {community.posts_count || 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Creada: {community.created_at ? new Date(community.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {community.updated_at ? new Date(community.updated_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    por {community.creator_name || 'Creador desconocido'}
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleViewCommunity(community)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Ver detalles de la comunidad"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleToggleVisibility(community)}
                      className="p-2 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                      title={community.is_active ? 'Ocultar comunidad' : 'Mostrar comunidad'}
                    >
                      {community.is_active ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleEditCommunity(community)}
                      className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      title="Editar comunidad"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCommunity(community)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Eliminar comunidad"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modales */}
      <EditCommunityModal
        community={editingCommunity}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSaveCommunity}
      />

      <DeleteCommunityModal
        community={deletingCommunity}
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      <AddCommunityModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSave={handleSaveNewCommunity}
      />
    </div>
  )
}

