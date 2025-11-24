'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BookOpenIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  UserGroupIcon,
  StarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { useInstructorWorkshops } from '../hooks/useInstructorWorkshops'
import { InstructorWorkshop } from '../services/instructorWorkshops.service'
import { AddWorkshopModal } from './AddWorkshopModal'
import { EditWorkshopModal } from './EditWorkshopModal'

export function InstructorWorkshopsPage() {
  const router = useRouter()
  const { workshops, isLoading, error, refetch } = useInstructorWorkshops()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterApproval, setFilterApproval] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingWorkshop, setEditingWorkshop] = useState<InstructorWorkshop | null>(null)

  const handleEdit = (workshop: InstructorWorkshop) => {
    router.push(`/instructor/workshops/${workshop.id}`)
  }

  const handleCloseModals = () => {
    setIsAddModalOpen(false)
    setEditingWorkshop(null)
  }

  const handleSave = async () => {
    await refetch()
    handleCloseModals()
  }

  const filteredWorkshops = workshops.filter(workshop => {
    const matchesSearch = workshop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workshop.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || workshop.category === filterCategory
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && workshop.is_active) ||
                         (filterStatus === 'inactive' && !workshop.is_active)
    const matchesApproval = filterApproval === 'all' || 
                            (filterApproval === 'pending' && (!workshop.approval_status || workshop.approval_status === 'pending')) ||
                            (filterApproval === 'approved' && workshop.approval_status === 'approved') ||
                            (filterApproval === 'rejected' && workshop.approval_status === 'rejected')
    
    return matchesSearch && matchesCategory && matchesStatus && matchesApproval
  })

  const getLevelColor = (level: string) => {
    const levelLower = level.toLowerCase()
    if (levelLower.includes('beginner') || levelLower.includes('principiante')) {
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    }
    if (levelLower.includes('intermediate') || levelLower.includes('intermedio')) {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }
    if (levelLower.includes('advanced') || levelLower.includes('avanzado')) {
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    }
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const getApprovalStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Aprobado',
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          icon: CheckCircleIcon
        }
      case 'rejected':
        return {
          label: 'Rechazado',
          color: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: XCircleIcon
        }
      case 'pending':
      default:
        return {
          label: 'Pendiente',
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          icon: ClockIcon
        }
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ia':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'tecnologia':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'negocios':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/30'
      default:
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 w-full min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/30 to-purple-950/30">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
          <div className="h-10 bg-gray-800 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 w-full min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/30 to-purple-950/30">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-400">
                Error al cargar los talleres
              </h3>
              <div className="mt-2 text-sm text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={refetch}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
    <div className="p-6 md:p-8 w-full min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/30 to-purple-950/30 relative z-10">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Mis Talleres
            </h1>
            <p className="text-indigo-300/70">
              Gestiona los talleres que has creado
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5" />
            Crear Nuevo Taller
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-gray-900/95 to-gray-950/95 backdrop-blur-xl rounded-2xl border border-gray-800/50 p-4 md:p-6 shadow-xl">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar talleres..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                {Array.from(new Set(workshops.map(w => w.category))).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            {/* Approval Status Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterApproval}
                onChange={(e) => setFilterApproval(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todas las aprobaciones</option>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobados</option>
                <option value="rejected">Rechazados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-950/95 backdrop-blur-xl rounded-xl border border-gray-800/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Talleres</p>
                <p className="text-2xl font-bold text-white">{workshops.length}</p>
              </div>
              <AcademicCapIcon className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-950/95 backdrop-blur-xl rounded-xl border border-gray-800/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {workshops.filter(w => !w.approval_status || w.approval_status === 'pending').length}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-950/95 backdrop-blur-xl rounded-xl border border-gray-800/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Aprobados</p>
                <p className="text-2xl font-bold text-green-400">
                  {workshops.filter(w => w.approval_status === 'approved').length}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-950/95 backdrop-blur-xl rounded-xl border border-gray-800/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Estudiantes</p>
                <p className="text-2xl font-bold text-white">
                  {workshops.reduce((sum, w) => sum + (w.student_count || 0), 0)}
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Workshops Grid */}
        {filteredWorkshops.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-900/95 to-gray-950/95 backdrop-blur-xl rounded-2xl border border-gray-800/50 p-12 text-center">
            <AcademicCapIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {workshops.length === 0 ? 'No tienes talleres aún' : 'No se encontraron talleres'}
            </h3>
            <p className="text-gray-400">
              {workshops.length === 0 
                ? 'Comienza creando tu primer taller' 
                : 'Intenta ajustar los filtros de búsqueda'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkshops.map((workshop) => (
              <div 
                key={workshop.id} 
                className="bg-gradient-to-br from-gray-900/95 to-gray-950/95 backdrop-blur-xl rounded-2xl border border-gray-800/50 overflow-hidden hover:border-purple-500/50 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Thumbnail */}
                <div className="h-48 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 relative flex-shrink-0">
                  {workshop.thumbnail_url ? (
                    <img 
                      src={workshop.thumbnail_url} 
                      alt={workshop.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <AcademicCapIcon className="h-16 w-16 text-purple-400/50" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {/* Estado de aprobación */}
                    {(() => {
                      const approvalBadge = getApprovalStatusBadge(workshop.approval_status)
                      const Icon = approvalBadge.icon
                      return (
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${approvalBadge.color}`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {approvalBadge.label}
                        </span>
                      )
                    })()}
                    {/* Estado activo/inactivo */}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                      workshop.is_active
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}>
                      {workshop.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getCategoryColor(workshop.category)}`}>
                      {workshop.category}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getLevelColor(workshop.level)}`}>
                      {workshop.level}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 min-h-[3.5rem]">
                    {workshop.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2 flex-1 min-h-[2.5rem]">
                    {workshop.description || 'Sin descripción'}
                  </p>

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-400">
                      <ClockIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{Math.round((workshop.duration_total_minutes / 60) * 10) / 10} horas</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <UserGroupIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{workshop.student_count || 0} estudiantes</span>
                    </div>
                    {workshop.average_rating && workshop.average_rating > 0 && (
                      <div className="flex items-center text-sm text-gray-400">
                        <StarIcon className="h-4 w-4 mr-2 text-yellow-400 flex-shrink-0" />
                        <span>{workshop.average_rating.toFixed(1)} ({workshop.review_count || 0} reseñas)</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-gray-800 space-y-3 mt-auto">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Creado: {new Date(workshop.created_at).toLocaleDateString('es-ES')}
                      </p>
                      <button
                        onClick={() => handleEdit(workshop)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 hover:text-purple-300 rounded-lg transition-all duration-200 text-xs font-medium hover:scale-105 flex-shrink-0"
                        title="Editar taller"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                        Editar
                      </button>
                    </div>
                    {workshop.approval_status === 'rejected' && workshop.rejection_reason && (
                      <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-xs text-red-400 font-medium">Razón de rechazo:</p>
                        <p className="text-xs text-red-300 mt-1">{workshop.rejection_reason}</p>
                      </div>
                    )}
                    {workshop.approval_status === 'approved' && workshop.approved_at && (
                      <p className="text-xs text-green-400">
                        Aprobado: {new Date(workshop.approved_at).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddWorkshopModal
          isOpen={isAddModalOpen}
          onClose={handleCloseModals}
          onSave={handleSave}
        />
      )}
      {/* La edición avanzada ahora se hace en la ruta /instructor/workshops/[id] */}
    </div>
  )
}

