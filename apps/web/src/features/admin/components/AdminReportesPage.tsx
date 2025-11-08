'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  PhotoIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { useAdminReportes } from '../hooks/useAdminReportes'
import { AdminReporte } from '../services/adminReportes.service'

// Lazy loading de modales
const ViewReporteModal = dynamic(() => import('./ViewReporteModal').then(mod => ({ default: mod.ViewReporteModal })), {
  ssr: false
})

const EditReporteModal = dynamic(() => import('./EditReporteModal').then(mod => ({ default: mod.EditReporteModal })), {
  ssr: false
})

export function AdminReportesPage() {
  const { 
    reportes, 
    stats, 
    isLoading, 
    error, 
    refetch, 
    updateReporte,
    applyFilters
  } = useAdminReportes()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('all')
  const [selectedCategoria, setSelectedCategoria] = useState('all')
  const [selectedPrioridad, setSelectedPrioridad] = useState('all')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  // Estados para modales
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedReporte, setSelectedReporte] = useState<AdminReporte | null>(null)

  // Aplicar filtros
  const handleApplyFilters = () => {
    applyFilters({
      estado: selectedEstado !== 'all' ? selectedEstado : undefined,
      categoria: selectedCategoria !== 'all' ? selectedCategoria : undefined,
      prioridad: selectedPrioridad !== 'all' ? selectedPrioridad : undefined,
      search: searchTerm || undefined
    })
  }

  // Resetear filtros
  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedEstado('all')
    setSelectedCategoria('all')
    setSelectedPrioridad('all')
    applyFilters({})
  }

  const handleViewReporte = (reporte: AdminReporte) => {
    setSelectedReporte(reporte)
    setIsViewModalOpen(true)
  }

  const handleEditReporte = (reporte: AdminReporte) => {
    setSelectedReporte(reporte)
    setIsEditModalOpen(true)
  }

  const handleUpdateReporte = async (
    reporteId: string,
    updates: {
      estado?: AdminReporte['estado']
      admin_asignado?: string
      notas_admin?: string
      prioridad?: AdminReporte['prioridad']
    }
  ) => {
    try {
      setIsProcessing(reporteId)
      await updateReporte(reporteId, updates)
      setIsEditModalOpen(false)
      setSelectedReporte(null)
    } catch (error) {
      console.error('Error updating reporte:', error)
      throw error
    } finally {
      setIsProcessing(null)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'en_revision':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'en_progreso':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'resuelto':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'rechazado':
      case 'duplicado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'critica':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700'
      case 'alta':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700'
      case 'media':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700'
      case 'baja':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      'bug': 'Bug',
      'sugerencia': 'Sugerencia',
      'contenido': 'Contenido',
      'performance': 'Performance',
      'ui-ux': 'UI/UX',
      'otro': 'Otro'
    }
    return labels[categoria] || categoria
  }

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      'pendiente': 'Pendiente',
      'en_revision': 'En Revisión',
      'en_progreso': 'En Progreso',
      'resuelto': 'Resuelto',
      'rechazado': 'Rechazado',
      'duplicado': 'Duplicado'
    }
    return labels[estado] || estado
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error al cargar reportes: {error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Reportes</h1>
              <p className="text-gray-600 dark:text-gray-400">Administra los reportes de problemas de los usuarios</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-600/20 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-600/20 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendientes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-600/20 rounded-lg">
                <PencilIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En Progreso</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.en_progreso}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-600/20 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resueltos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resueltos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por título o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro Estado */}
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En Revisión</option>
              <option value="en_progreso">En Progreso</option>
              <option value="resuelto">Resuelto</option>
              <option value="rechazado">Rechazado</option>
              <option value="duplicado">Duplicado</option>
            </select>

            {/* Filtro Categoría */}
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              <option value="bug">Bug</option>
              <option value="sugerencia">Sugerencia</option>
              <option value="contenido">Contenido</option>
              <option value="performance">Performance</option>
              <option value="ui-ux">UI/UX</option>
              <option value="otro">Otro</option>
            </select>

            {/* Filtro Prioridad */}
            <select
              value={selectedPrioridad}
              onChange={(e) => setSelectedPrioridad(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las prioridades</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <FunnelIcon className="h-5 w-5" />
                Filtrar
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Reportes */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {reportes.length === 0 ? (
            <div className="p-12 text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No se encontraron reportes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {reportes.map((reporte) => (
                <div
                  key={reporte.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {reporte.titulo}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPrioridadColor(reporte.prioridad)}`}>
                          {reporte.prioridad.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEstadoColor(reporte.estado)}`}>
                          {getEstadoLabel(reporte.estado)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {reporte.descripcion}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Categoría:</span>
                          {getCategoriaLabel(reporte.categoria)}
                        </span>
                        {reporte.usuario && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="h-4 w-4" />
                            {reporte.usuario.display_name || reporte.usuario.username}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {new Date(reporte.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {reporte.screenshot_url && (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <PhotoIcon className="h-4 w-4" />
                            Con imagen
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewReporte(reporte)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditReporte(reporte)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {isViewModalOpen && selectedReporte && (
        <ViewReporteModal
          reporte={selectedReporte}
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false)
            setSelectedReporte(null)
          }}
          onEdit={() => {
            setIsViewModalOpen(false)
            setIsEditModalOpen(true)
          }}
        />
      )}

      {isEditModalOpen && selectedReporte && (
        <EditReporteModal
          reporte={selectedReporte}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedReporte(null)
          }}
          onSave={handleUpdateReporte}
          isProcessing={isProcessing === selectedReporte.id}
        />
      )}
    </div>
  )
}

