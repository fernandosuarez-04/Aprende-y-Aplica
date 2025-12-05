'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Flag, Eye, CheckCircle, XCircle, Clock, Filter, Loader2, Shield, Edit2, Save, X } from 'lucide-react'
import { PostReportsService, PostReport, ReportStatus, ResolutionAction } from '../../services/postReports.service'
import { PostDetailsModal } from './PostDetailsModal'

interface ModerationReportsPageProps {
  communitySlug: string
}

const STATUS_OPTIONS: Array<{ value: ReportStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'reviewed', label: 'Revisados' },
  { value: 'resolved', label: 'Resueltos' },
  { value: 'ignored', label: 'Ignorados' },
]

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Contenido inapropiado',
  harassment: 'Acoso o bullying',
  misinformation: 'Desinformación',
  violence: 'Violencia',
  other: 'Otro',
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  resolved: 'Resuelto',
  ignored: 'Ignorado',
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-800',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-800',
  ignored: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-800',
}

export function ModerationReportsPage({ communitySlug }: ModerationReportsPageProps) {
  const router = useRouter()
  const [reports, setReports] = useState<PostReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'all'>('all')
  const [isResolving, setIsResolving] = useState(false)
  const [selectedPost, setSelectedPost] = useState<PostReport['post'] | null>(null)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [editingNotes, setEditingNotes] = useState<string | null>(null) // ID del reporte cuyas notas se están editando
  const [notesValue, setNotesValue] = useState<string>('')
  const [selectedVerdict, setSelectedVerdict] = useState<ResolutionAction | null | undefined>(undefined) // Veredicto seleccionado al editar notas
  const [pendingAction, setPendingAction] = useState<{
    reportId: string
    status: 'reviewed' | 'resolved' | 'ignored'
    action?: ResolutionAction
  } | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  })

  const fetchReports = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔍 Fetching reports for community:', communitySlug, {
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        limit: pagination.limit,
        offset: pagination.offset,
      })

      const result = await PostReportsService.getReports(communitySlug, {
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        limit: pagination.limit,
        offset: pagination.offset,
      })

      console.log('📊 Reports result:', {
        success: result.success,
        reportsCount: result.reports?.length || 0,
        pagination: result.pagination
      })

      if (result.success) {
        setReports(result.reports || [])
        setPagination(result.pagination || {
          total: 0,
          limit: pagination.limit,
          offset: pagination.offset,
          hasMore: false,
        })
      } else {
        console.error('❌ Reports fetch failed:', result)
        setError('Error al cargar reportes')
      }
    } catch (err) {
      console.error('❌ Error fetching reports:', err)
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [selectedStatus, communitySlug])

  const handleResolveReport = async (
    reportId: string,
    status: 'reviewed' | 'resolved' | 'ignored',
    resolutionAction?: ResolutionAction,
    resolutionNotes?: string
  ) => {
    setIsResolving(true)
    try {
      console.log('🔧 Resolving report:', {
        reportId,
        status,
        resolutionAction,
        resolutionNotes
      })

      const result = await PostReportsService.resolveReport(communitySlug, reportId, {
        status,
        resolution_action: resolutionAction,
        resolution_notes: resolutionNotes || null, // Permitir enviar null para limpiar notas
      })

      console.log('📊 Resolve result:', result)

      if (result.success && result.report) {
        // Actualizar el reporte en la lista inmediatamente
        setReports((prev) =>
          prev.map((r) => {
            if (r.id === reportId) {
              // Actualizar el reporte con la respuesta del servidor
              const updatedReport = result.report!
              // Si el reporte incluye el post actualizado, asegurarse de que se refleje
              if (updatedReport.post) {
                return { ...updatedReport, post: { ...updatedReport.post } }
              }
              return updatedReport
            }
            return r
          })
        )
        // Recargar para actualizar contadores y filtros (esto asegura que tenemos el estado más reciente)
        await fetchReports()
        console.log('✅ Report resolved and list updated')
      } else {
        console.error('❌ Resolve failed:', result.error)
        const errorMessage = result.error || 'Error al resolver el reporte'
        alert(errorMessage)
      }
    } catch (err) {
      console.error('❌ Error resolving report:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión. Por favor intenta nuevamente.'
      alert(errorMessage)
    } finally {
      setIsResolving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPostPreview = (content: string) => {
    if (!content) return 'Sin contenido'
    return content.length > 100 ? content.substring(0, 100) + '...' : content
  }

  const handlePostClick = (post: PostReport['post']) => {
    if (post) {
      setSelectedPost(post)
      setIsPostModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsPostModalOpen(false)
    setSelectedPost(null)
  }

  const handleEditNotes = (report: PostReport) => {
    setEditingNotes(report.id)
    setNotesValue(report.resolution_notes || '')
    setSelectedVerdict(report.resolution_action || null)
    setPendingAction(null)
  }

  const handleCancelEditNotes = () => {
    setEditingNotes(null)
    setNotesValue('')
    setSelectedVerdict(undefined)
    setPendingAction(null)
  }

  const handleSaveNotes = async (reportId: string, currentStatus: ReportStatus, currentAction?: ResolutionAction | null) => {
    setIsResolving(true)
    try {
      // Usar el veredicto seleccionado si está disponible, de lo contrario usar el actual
      // Si selectedVerdict es undefined, no cambiar el veredicto (no enviarlo)
      // Si selectedVerdict es null, limpiar el veredicto (enviar null)
      // Si selectedVerdict tiene un valor, usar ese valor
      const actionToUse = selectedVerdict !== undefined ? selectedVerdict : undefined
      const result = await PostReportsService.resolveReport(communitySlug, reportId, {
        status: currentStatus,
        resolution_action: actionToUse, // Puede ser ResolutionAction, null, o undefined
        resolution_notes: notesValue.trim() || null,
      })

      if (result.success && result.report) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? result.report! : r))
        )
        await fetchReports()
        handleCancelEditNotes()
      } else {
        const errorMessage = result.error || 'Error al actualizar las notas'
        alert(errorMessage)
      }
    } catch (err) {
      console.error('❌ Error updating notes:', err)
      alert('Error al actualizar las notas')
    } finally {
      setIsResolving(false)
    }
  }

  const handleActionWithNotes = (reportId: string, status: 'reviewed' | 'resolved' | 'ignored', action?: ResolutionAction) => {
    const report = reports.find(r => r.id === reportId)
    if (report) {
      setPendingAction({ reportId, status, action })
      setEditingNotes(reportId)
      setNotesValue(report.resolution_notes || '')
    }
  }

  const handleConfirmActionWithNotes = async () => {
    if (!pendingAction) return
    
    setIsResolving(true)
    try {
      const result = await PostReportsService.resolveReport(communitySlug, pendingAction.reportId, {
        status: pendingAction.status,
        resolution_action: pendingAction.action,
        resolution_notes: notesValue.trim() || null,
      })

      if (result.success && result.report) {
        setReports((prev) =>
          prev.map((r) => (r.id === pendingAction.reportId ? result.report! : r))
        )
        await fetchReports()
        handleCancelEditNotes()
      } else {
        const errorMessage = result.error || 'Error al resolver el reporte'
        alert(errorMessage)
      }
    } catch (err) {
      console.error('❌ Error resolving report:', err)
      alert('Error al resolver el reporte')
    } finally {
      setIsResolving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/communities/${communitySlug}`)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Panel de Moderación
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Gestiona los reportes de tu comunidad
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reportes de Posts
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ReportStatus | 'all')}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading && reports.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <Flag className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {selectedStatus === 'all'
                ? 'No hay reportes en esta comunidad'
                : `No hay reportes ${STATUS_LABELS[selectedStatus as ReportStatus].toLowerCase()}`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS[report.status]}`}
                      >
                        {STATUS_LABELS[report.status]}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {REASON_LABELS[report.reason_category] || report.reason_category}
                      </span>
                    </div>

                    {report.post && (
                      <div 
                        className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handlePostClick(report.post)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Post reportado:
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                              "{getPostPreview(report.post.content || '')}"
                            </p>
                            {report.post.author && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                Por: {report.post.author.first_name && report.post.author.last_name
                                  ? `${report.post.author.first_name} ${report.post.author.last_name}`
                                  : report.post.author.username || report.post.author.email || 'Usuario desconocido'}
                              </p>
                            )}
                          </div>
                          <Eye className="w-5 h-5 text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                          Click para ver detalles completos
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div>
                        <span className="font-medium">Reportado por:</span>
                        <p className="text-gray-900 dark:text-white">
                          {report.reported_by?.first_name && report.reported_by?.last_name
                            ? `${report.reported_by.first_name} ${report.reported_by.last_name}`
                            : report.reported_by?.username || report.reported_by?.email || 'Usuario desconocido'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span>
                        <p className="text-gray-900 dark:text-white">
                          {formatDate(report.created_at)}
                        </p>
                      </div>
                      {report.reviewed_by && (
                        <div>
                          <span className="font-medium">Revisado por:</span>
                          <p className="text-gray-900 dark:text-white">
                            {report.reviewed_by.first_name && report.reviewed_by.last_name
                              ? `${report.reviewed_by.first_name} ${report.reviewed_by.last_name}`
                              : report.reviewed_by.username || report.reviewed_by.email || 'Usuario desconocido'}
                          </p>
                        </div>
                      )}
                      {report.reviewed_at && (
                        <div>
                          <span className="font-medium">Fecha de revisión:</span>
                          <p className="text-gray-900 dark:text-white">
                            {formatDate(report.reviewed_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    {report.reason_details && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Detalles del reporte:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {report.reason_details}
                        </p>
                      </div>
                    )}

                    {/* Notas de resolución - Editable */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Notas de resolución:
                        </p>
                        {editingNotes !== report.id && (
                          <button
                            onClick={() => handleEditNotes(report)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            Editar
                          </button>
                        )}
                      </div>
                      {editingNotes === report.id ? (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Veredicto:
                            </label>
                            <select
                              value={selectedVerdict ?? ''}
                              onChange={(e) => setSelectedVerdict(e.target.value === '' ? null : (e.target.value as ResolutionAction))}
                              disabled={isResolving || report.resolution_action === 'delete_post'}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">Sin acción</option>
                              {report.post && report.resolution_action !== 'delete_post' && (
                                <>
                                  <option value="hide_post">Ocultar Post</option>
                                  <option value="unhide_post">Mostrar Post</option>
                                </>
                              )}
                              <option value="ignore_report">Ignorar Reporte</option>
                              <option value="false_report">Marcar como Falso</option>
                              <option value="warn_reporter">Falso y Advertir Usuario</option>
                            </select>
                            {report.resolution_action === 'delete_post' && (
                              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                ⚠️ No se puede cambiar: el post ya fue eliminado
                              </p>
                            )}
                          </div>
                          <textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            placeholder="Agrega notas sobre la resolución de este reporte..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[80px]"
                            rows={3}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (pendingAction) {
                                  handleConfirmActionWithNotes()
                                } else {
                                  handleSaveNotes(report.id, report.status, report.resolution_action || undefined)
                                }
                              }}
                              disabled={isResolving}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              {pendingAction ? 'Confirmar Acción' : 'Guardar'}
                            </button>
                            <button
                              onClick={handleCancelEditNotes}
                              disabled={isResolving}
                              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {report.resolution_notes || <span className="italic text-gray-400 dark:text-gray-500">Sin notas</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {(report.status === 'pending' || report.status === 'resolved' || report.status === 'ignored') && (
                      <>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {report.status !== 'pending' && (
                            <span className="block mb-1">
                              Veredicto actual: {
                                report.resolution_action === 'delete_post' && 'Post eliminado'
                              }
                              {report.resolution_action === 'hide_post' && 'Post oculto'}
                              {report.resolution_action === 'unhide_post' && 'Post mostrado'}
                              {report.resolution_action === 'ignore_report' && 'Reporte ignorado'}
                              {report.resolution_action === 'warn_user' && 'Usuario advertido'}
                              {report.resolution_action === 'false_report' && 'Reporte falso'}
                              {report.resolution_action === 'warn_reporter' && 'Reporte falso - Usuario advertido'}
                              {!report.resolution_action && 'Sin acción'}
                            </span>
                          )}
                          {report.resolution_action === 'delete_post' && (
                            <span className="block text-orange-600 dark:text-orange-400 mt-1">
                              ⚠️ No se puede cambiar: el post ya fue eliminado
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleActionWithNotes(report.id, 'resolved', 'delete_post')}
                          disabled={isResolving || report.resolution_action === 'delete_post'}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          {report.resolution_action === 'delete_post' ? 'Post Eliminado' : 'Eliminar Post'}
                        </button>
                        {/* Botón para ocultar/mostrar post */}
                        {/* Determinar si el post está oculto: usar is_hidden como fuente de verdad */}
                        {report.post ? (
                          (() => {
                            // Usar is_hidden como fuente de verdad del estado real del post
                            // resolution_action solo indica qué acción se tomó, pero el estado real está en is_hidden
                            const isPostHidden = report.post.is_hidden === true
                            
                            return isPostHidden ? (
                              <button
                                onClick={() => handleActionWithNotes(report.id, 'resolved', 'unhide_post')}
                                disabled={isResolving || report.resolution_action === 'delete_post'}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                Mostrar Post
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActionWithNotes(report.id, 'resolved', 'hide_post')}
                                disabled={isResolving || report.resolution_action === 'delete_post'}
                                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                Ocultar Post
                              </button>
                            )
                          })()
                        ) : null}
                        <button
                          onClick={() => handleActionWithNotes(report.id, 'ignored', 'ignore_report')}
                          disabled={isResolving || report.resolution_action === 'ignore_report' || report.resolution_action === 'delete_post'}
                          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4" />
                          {report.resolution_action === 'ignore_report' ? 'Ignorado' : 'Ignorar'}
                        </button>
                        <button
                          onClick={() => handleActionWithNotes(report.id, 'resolved', 'false_report')}
                          disabled={isResolving || report.resolution_action === 'false_report' || report.resolution_action === 'warn_reporter' || report.resolution_action === 'delete_post'}
                          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Flag className="w-4 h-4" />
                          {report.resolution_action === 'false_report' ? 'Marcado como Falso' : 'Marcar como Falso'}
                        </button>
                        <button
                          onClick={() => handleActionWithNotes(report.id, 'resolved', 'warn_reporter')}
                          disabled={isResolving || report.resolution_action === 'warn_reporter' || report.resolution_action === 'false_report' || report.resolution_action === 'delete_post'}
                          className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Flag className="w-4 h-4" />
                          {report.resolution_action === 'warn_reporter' ? 'Falso - Usuario Advertido' : 'Falso y Advertir Usuario'}
                        </button>
                      </>
                    )}
                    {report.status === 'reviewed' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 text-right">
                        {report.resolution_action === 'delete_post' && 'Post eliminado'}
                        {report.resolution_action === 'hide_post' && 'Post oculto'}
                        {report.resolution_action === 'unhide_post' && 'Post mostrado'}
                        {report.resolution_action === 'ignore_report' && 'Reporte ignorado'}
                        {report.resolution_action === 'warn_user' && 'Usuario advertido'}
                        {report.resolution_action === 'false_report' && 'Reporte falso'}
                        {report.resolution_action === 'warn_reporter' && 'Reporte falso - Usuario advertido'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.hasMore && (
          <div className="text-center pt-6">
            <button
              onClick={() => {
                setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }))
                fetchReports()
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
            >
              Cargar más
            </button>
          </div>
        )}
      </div>

      {/* Post Details Modal */}
      <PostDetailsModal
        isOpen={isPostModalOpen}
        onClose={handleCloseModal}
        post={selectedPost}
      />
    </div>
  )
}


