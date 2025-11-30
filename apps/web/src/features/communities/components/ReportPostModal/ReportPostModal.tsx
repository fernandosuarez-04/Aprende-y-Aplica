'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Flag, X, Loader2, AlertCircle } from 'lucide-react'
import { PostReportsService, ReportReasonCategory } from '../../services/postReports.service'

interface ReportPostModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  communitySlug: string
  onSuccess?: () => void
}

const REPORT_REASONS: Array<{
  value: ReportReasonCategory
  label: string
  description: string
}> = [
  {
    value: 'spam',
    label: 'Spam',
    description: 'Contenido promocional no deseado o repetitivo',
  },
  {
    value: 'inappropriate',
    label: 'Contenido inapropiado',
    description: 'Contenido que viola las normas de la comunidad',
  },
  {
    value: 'harassment',
    label: 'Acoso o bullying',
    description: 'Contenido que acosa, intimida o amenaza a otros',
  },
  {
    value: 'misinformation',
    label: 'Desinformación',
    description: 'Información falsa o engañosa',
  },
  {
    value: 'violence',
    label: 'Violencia',
    description: 'Contenido que promueve o muestra violencia',
  },
  {
    value: 'other',
    label: 'Otro',
    description: 'Otra razón no mencionada arriba',
  },
]

export function ReportPostModal({
  isOpen,
  onClose,
  postId,
  communitySlug,
  onSuccess,
}: ReportPostModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReasonCategory | null>(null)
  const [reasonDetails, setReasonDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Resetear estado cuando se abre el modal
      setSelectedReason(null)
      setReasonDetails('')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedReason) {
      setError('Por favor selecciona una razón para el reporte')
      return
    }

    if (selectedReason === 'other' && !reasonDetails.trim()) {
      setError('Por favor proporciona más detalles sobre el reporte')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await PostReportsService.createReport(communitySlug, postId, {
        reason_category: selectedReason,
        reason_details: selectedReason === 'other' ? reasonDetails.trim() : reasonDetails.trim() || undefined,
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
          if (onSuccess) {
            onSuccess()
          }
        }, 1500)
      } else {
        setError(result.error || 'Error al enviar el reporte')
      }
    } catch (err) {
      setError('Error de conexión. Por favor intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting && !success) {
      onClose()
    }
  }

  if (!mounted || typeof window === 'undefined') return null

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100000]"
            style={{ pointerEvents: isSubmitting || success ? 'none' : 'auto' }}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[100001] p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 w-full max-w-lg pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Reportar post
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  disabled={isSubmitting || success}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {success ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Reporte enviado
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Gracias por tu reporte. Lo revisaremos pronto.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Por favor selecciona la razón por la que estás reportando este post:
                      </p>

                      <div className="space-y-2">
                        {REPORT_REASONS.map((reason) => (
                          <label
                            key={reason.value}
                            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedReason === reason.value
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                            }`}
                          >
                            <input
                              type="radio"
                              name="reason"
                              value={reason.value}
                              checked={selectedReason === reason.value}
                              onChange={() => setSelectedReason(reason.value)}
                              className="mt-1 w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                              disabled={isSubmitting}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {reason.label}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {reason.description}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {(selectedReason === 'other' || selectedReason) && (
                      <div>
                        <label
                          htmlFor="details"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          {selectedReason === 'other'
                            ? 'Detalles adicionales (requerido)'
                            : 'Detalles adicionales (opcional)'}
                        </label>
                        <textarea
                          id="details"
                          rows={4}
                          value={reasonDetails}
                          onChange={(e) => setReasonDetails(e.target.value)}
                          placeholder="Proporciona más información sobre el reporte..."
                          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                          disabled={isSubmitting}
                        />
                      </div>
                    )}

                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    )}
                  </form>
                )}
              </div>

              {/* Footer */}
              {!success && (
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !selectedReason || (selectedReason === 'other' && !reasonDetails.trim())}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Enviar reporte
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}


