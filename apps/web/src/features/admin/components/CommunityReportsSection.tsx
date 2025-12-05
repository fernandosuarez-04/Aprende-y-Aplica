'use client'

import React, { useState, useEffect } from 'react'
import { Flag, Eye, CheckCircle, XCircle, Clock, Filter, Loader2, Edit2, Save, X } from 'lucide-react'
import { PostReportsService, PostReport, ReportStatus, ResolutionAction } from '@/features/communities/services/postReports.service'

interface CommunityReportsSectionProps {
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

export function CommunityReportsSection({ communitySlug }: CommunityReportsSectionProps) {
  const [reports, setReports] = useState<PostReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'all'>('all')
  const [selectedReport, setSelectedReport] = useState<PostReport | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState<string>('')
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
      const result = await PostReportsService.getAdminReports(communitySlug, {
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        limit: pagination.limit,
        offset: pagination.offset,
      })

      if (result.success) {
        setReports(result.reports)
        setPagination(result.pagination)
      } else {
        setError('Error al cargar reportes')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [selectedStatus, communitySlug])

  const handleEditNotes = (report: PostReport) => {
    setEditingNotes(report.id)
    setNotesValue(report.resolution_notes || '')
    setPendingAction(null)
  }

  const handleCancelEditNotes = () => {
    setEditingNotes(null)
    setNotesValue('')
    setPendingAction(null)
  }

  const handleSaveNotes = async (reportId: string, currentStatus: ReportStatus, currentAction?: ResolutionAction | null) => {
    setIsResolving(true)
    try {
      const result = await PostReportsService.resolveReport(communitySlug, reportId, {
        status: currentStatus,
        resolution_action: currentAction || undefined,
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

  const handleResolveReport = async (
    reportId: string,
    status: 'reviewed' | 'resolved' | 'ignored',
    resolutionAction?: ResolutionAction,
    resolutionNotes?: string
  ) => {
    setIsResolving(true)
    try {
      const result = await PostReportsService.resolveReport(communitySlug, reportId, {
        status,
        resolution_action: resolutionAction,
        resolution_notes: resolutionNotes || null,
      })

      if (result.success && result.report) {
        // Actualizar el reporte en la lista
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? result.report! : r))
        )
        setSelectedReport(null)
        // Recargar reportes para actualizar contadores
        await fetchReports()
      } else {
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

  if (isLoading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Reportes de Posts
        </h3>
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

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="text-center py-12">
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
              className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
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
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        <strong>Post reportado:</strong>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                        "{getPostPreview(report.post.content || '')}"
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
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
                        Detalles:
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
                      {report.status !== 'pending' && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span className="block">
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
                          {report.resolution_action === 'delete_post' && (
                            <span className="block text-orange-600 dark:text-orange-400 mt-1">
                              ⚠️ No se puede cambiar: el post ya fue eliminado
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => handleActionWithNotes(report.id, 'resolved', 'delete_post')}
                        disabled={isResolving || report.resolution_action === 'delete_post'}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" />
                        {report.resolution_action === 'delete_post' ? 'Post Eliminado' : 'Eliminar Post'}
                      </button>
                      {/* Botón para ocultar/mostrar post */}
                      {/* Determinar si el post está oculto: priorizar is_hidden, luego resolution_action */}
                      {report.post ? (
                        (() => {
                          // Determinar el estado real del post
                          // Si resolution_action es unhide_post, el post está visible
                          // Si resolution_action es hide_post, el post está oculto
                          // Si is_hidden es true, el post está oculto
                          const isPostHidden = report.resolution_action === 'unhide_post' 
                            ? false 
                            : (report.post.is_hidden === true || report.resolution_action === 'hide_post')
                          
                          return isPostHidden ? (
                            <button
                              onClick={() => handleActionWithNotes(report.id, 'resolved', 'unhide_post')}
                              disabled={isResolving || report.resolution_action === 'delete_post'}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Mostrar Post
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActionWithNotes(report.id, 'resolved', 'hide_post')}
                              disabled={isResolving || report.resolution_action === 'delete_post'}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Ocultar Post
                            </button>
                          )
                        })()
                      ) : null}
                      <button
                        onClick={() => handleActionWithNotes(report.id, 'ignored', 'ignore_report')}
                        disabled={isResolving || report.resolution_action === 'ignore_report' || report.resolution_action === 'delete_post'}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        {report.resolution_action === 'ignore_report' ? 'Ignorado' : 'Ignorar'}
                      </button>
                      <button
                        onClick={() => handleActionWithNotes(report.id, 'resolved', 'false_report')}
                        disabled={isResolving || report.resolution_action === 'false_report' || report.resolution_action === 'warn_reporter' || report.resolution_action === 'delete_post'}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <Flag className="w-3 h-3" />
                        {report.resolution_action === 'false_report' ? 'Marcado como Falso' : 'Marcar como Falso'}
                      </button>
                      <button
                        onClick={() => handleActionWithNotes(report.id, 'resolved', 'warn_reporter')}
                        disabled={isResolving || report.resolution_action === 'warn_reporter' || report.resolution_action === 'false_report' || report.resolution_action === 'delete_post'}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <Flag className="w-3 h-3" />
                        {report.resolution_action === 'warn_reporter' ? 'Falso - Usuario Advertido' : 'Falso y Advertir Usuario'}
                      </button>
                    </>
                  )}
                  {report.status === 'reviewed' && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
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
        <div className="text-center pt-4">
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
  )
}


