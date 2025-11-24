'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Search, Calendar, CheckCircle, XCircle, UserCheck, AlertCircle, MessageSquare } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useBusinessUsers, BusinessUser } from '../hooks/useBusinessUsers'
import Image from 'next/image'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'

interface BusinessAssignCourseModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  courseTitle: string
  onAssignComplete: () => void
}

export function BusinessAssignCourseModal({ 
  isOpen, 
  onClose, 
  courseId, 
  courseTitle,
  onAssignComplete 
}: BusinessAssignCourseModalProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { users, isLoading: loadingUsers, refetch: refetchUsers } = useBusinessUsers()
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [dueDate, setDueDate] = useState<string>('')
  const [customMessage, setCustomMessage] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [alreadyAssignedIds, setAlreadyAssignedIds] = useState<Set<string>>(new Set())

  // Aplicar colores personalizados
  const modalBg = panelStyles?.card_background || 'rgba(15, 23, 42, 0.95)'
  const modalBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const sectionBg = `${modalBg}CC`

  // Refrescar usuarios cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      // console.log('🔄 Refrescando usuarios en modal de asignación...')
      refetchUsers()
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar usuarios que ya tienen el curso asignado
  useEffect(() => {
    if (isOpen && courseId) {
      const fetchAssignedUsers = async () => {
        try {
          const response = await fetch(`/api/business/courses/${courseId}/assigned-users`, {
            credentials: 'include'
          })
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.user_ids) {
              setAlreadyAssignedIds(new Set(data.user_ids))
            }
          }
        } catch (err) {
          // console.error('Error fetching assigned users:', err)
        }
      }
      fetchAssignedUsers()
    }
  }, [isOpen, courseId])

  // Filtrar usuarios por búsqueda y excluir ya asignados
  const availableUsers = users.filter(user => {
    const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    const matchesSearch = searchTerm === '' || 
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    // Incluir todos los usuarios activos, no solo los que coinciden con la búsqueda si no hay término de búsqueda
    return matchesSearch && (user.org_status === 'active' || !user.org_status)
  })

  const toggleUser = (userId: string) => {
    if (alreadyAssignedIds.has(userId)) {
      return // No permitir seleccionar usuarios que ya tienen el curso
    }
    setSelectedUserIds(prev => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    const availableUserIds = availableUsers
      .filter(u => !alreadyAssignedIds.has(u.id))
      .map(u => u.id)
    
    if (availableUserIds.length === 0) return

    const allSelected = availableUserIds.every(id => selectedUserIds.has(id))
    
    if (allSelected) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(availableUserIds))
    }
  }

  const handleAssign = async () => {
    if (selectedUserIds.size === 0) {
      setError('Debes seleccionar al menos un usuario')
      return
    }

    setIsAssigning(true)
    setError(null)

    try {
      const response = await fetch(`/api/business/courses/${courseId}/assign`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_ids: Array.from(selectedUserIds),
          due_date: dueDate || null,
          message: customMessage.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al asignar el curso')
      }

      // Éxito
      setSelectedUserIds(new Set())
      setDueDate('')
      setCustomMessage('')
      onAssignComplete()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar el curso')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleReset = () => {
    setSelectedUserIds(new Set())
    setDueDate('')
    setCustomMessage('')
    setError(null)
    setSearchTerm('')
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  if (!isOpen) return null

  const availableCount = availableUsers.filter(u => !alreadyAssignedIds.has(u.id)).length
  const selectedCount = Array.from(selectedUserIds).filter(id => !alreadyAssignedIds.has(id)).length

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop con blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-carbon-900/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative rounded-3xl shadow-2xl border w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col z-10 backdrop-blur-xl"
          style={{
            backgroundColor: modalBg,
            borderColor: modalBorder
          }}
        >
          {/* Header */}
          <div className="relative border-b p-5 backdrop-blur-sm" style={{
            backgroundColor: modalBg,
            borderColor: modalBorder
          }}>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: primaryColor }}>
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-semibold" style={{ color: textColor }}>
                    Asignar Curso
                  </h2>
                  <p className="font-body text-xs mt-0.5" style={{ color: textColor, opacity: 0.7 }}>
                    {courseTitle.length > 40 ? `${courseTitle.substring(0, 40)}...` : courseTitle}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                disabled={isAssigning}
                className="p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${modalBg}80`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <X className="w-5 h-5 transition-colors" style={{ color: textColor, opacity: 0.7 }} />
              </motion.button>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl text-red-400 flex items-center gap-3 border"
                    style={{
                      backgroundColor: '#7f1d1d',
                      borderColor: '#dc2626'
                    }}
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200" style={{ color: textColor, opacity: 0.5 }} />
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border rounded-xl font-body placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                  style={{
                    backgroundColor: sectionBg,
                    borderColor: modalBorder,
                    color: textColor
                  }}
                />
              </div>

              {/* Select All */}
              {availableCount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={availableCount > 0 && selectedCount === availableCount}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary cursor-pointer"
                      style={{
                        backgroundColor: '#0f172a',
                        borderColor: '#475569'
                      }}
                    />
                    <label className="font-body text-sm font-heading font-semibold cursor-pointer" style={{ color: textColor }}>
                      Seleccionar todos ({selectedCount}/{availableCount} disponibles)
                    </label>
                  </div>
                  <span className="font-body text-xs" style={{ color: textColor, opacity: 0.6 }}>
                    {alreadyAssignedIds.size} usuario(s) ya tienen este curso asignado
                  </span>
                </div>
              )}

              {/* Users List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingUsers ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Cargando usuarios...</p>
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-carbon-500 mx-auto mb-4" />
                    <p className="text-carbon-400">No hay usuarios disponibles</p>
                  </div>
                ) : (
                  availableUsers.map((user) => {
                    const isAlreadyAssigned = alreadyAssignedIds.has(user.id)
                    const isSelected = selectedUserIds.has(user.id)
                    const displayName = user.display_name || 
                      `${user.first_name || ''} ${user.last_name || ''}`.trim() || 
                      user.username

                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-xl border transition-all ${
                          isAlreadyAssigned
                            ? 'opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'cursor-pointer'
                            : 'cursor-pointer'
                        }`}
                        style={{
                          backgroundColor: isSelected ? `${primaryColor}20` : sectionBg,
                          borderColor: isSelected ? primaryColor : modalBorder
                        }}
                        onClick={() => !isAlreadyAssigned && toggleUser(user.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                            isAlreadyAssigned
                              ? 'bg-carbon-600'
                              : isSelected
                              ? 'bg-primary border-primary'
                              : 'border-2 border-carbon-600'
                          }`}>
                            {isSelected && !isAlreadyAssigned && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                            {isAlreadyAssigned && (
                              <XCircle className="w-3 h-3 text-carbon-400" />
                            )}
                          </div>
                          
                          {user.profile_picture_url ? (
                            <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                              <Image
                                src={user.profile_picture_url}
                                alt={displayName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                              {displayName[0].toUpperCase()}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-body font-heading font-semibold text-sm" style={{ color: textColor }}>{displayName}</h4>
                              {isAlreadyAssigned && (
                                <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-body">
                                  Ya asignado
                                </span>
                              )}
                            </div>
                            <p className="font-body text-xs" style={{ color: textColor, opacity: 0.7 }}>{user.email}</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>

              {/* Custom Message & Due Date - Compact Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: modalBorder }}>
                {/* Due Date */}
                <div>
                  <label className="block font-body text-xs font-heading font-semibold mb-2" style={{ color: textColor }}>
                    <Calendar className="w-3.5 h-3.5 inline mr-1.5" style={{ color: textColor, opacity: 0.7 }} />
                    Fecha límite
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 border rounded-xl font-body text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                    style={{
                      backgroundColor: sectionBg,
                      borderColor: modalBorder,
                      color: textColor
                    }}
                  />
                </div>

                {/* Custom Message */}
                <div>
                  <label className="block font-body text-xs font-heading font-semibold mb-2" style={{ color: textColor }}>
                    <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" style={{ color: textColor, opacity: 0.7 }} />
                    Mensaje (opcional)
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Mensaje personalizado..."
                    rows={2}
                    maxLength={200}
                    className="w-full px-3 py-2.5 border rounded-xl font-body text-sm placeholder-carbon-500 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 resize-none"
                    style={{
                      backgroundColor: sectionBg,
                      borderColor: modalBorder,
                      color: textColor
                    }}
                  />
                  <p className="font-body text-xs mt-1 text-right" style={{ color: textColor, opacity: 0.5 }}>
                    {customMessage.length}/200
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 backdrop-blur-sm" style={{
              backgroundColor: modalBg,
              borderColor: modalBorder
            }}>
              <div className="flex items-center justify-end gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isAssigning}
                    className="min-w-[100px] font-heading text-sm transition-all duration-200"
                  >
                    Cancelar
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="gradient"
                    onClick={handleAssign}
                    disabled={isAssigning || selectedCount === 0}
                    className="min-w-[140px] font-heading text-sm transition-all duration-200"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${panelStyles?.secondary_button_color || '#2563eb'})`,
                      boxShadow: `0 10px 25px -5px ${primaryColor}40`
                    }}
                  >
                    {isAssigning ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Asignando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        Asignar ({selectedCount})
                      </span>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

