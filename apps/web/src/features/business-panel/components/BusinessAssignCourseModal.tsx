'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Search, Calendar, CheckCircle, XCircle, UserCheck, AlertCircle, MessageSquare } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useBusinessUsers, BusinessUser } from '../hooks/useBusinessUsers'
import Image from 'next/image'

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
  const { users, isLoading: loadingUsers, refetch: refetchUsers } = useBusinessUsers()
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [dueDate, setDueDate] = useState<string>('')
  const [customMessage, setCustomMessage] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [alreadyAssignedIds, setAlreadyAssignedIds] = useState<Set<string>>(new Set())

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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative rounded-2xl shadow-2xl border w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col z-10"
          style={{
            backgroundColor: '#1e293b',
            borderColor: '#334155'
          }}
        >
          {/* Header */}
          <div className="relative border-b p-6" style={{
            backgroundColor: '#0f172a',
            borderColor: '#334155'
          }}>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-success flex items-center justify-center shadow-lg">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Asignar Curso
                  </h2>
                  <p className="text-sm text-gray-300 mt-0.5">
                    {courseTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isAssigning}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  style={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155'
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
                    <label className="text-sm font-semibold text-white cursor-pointer">
                      Seleccionar todos ({selectedCount}/{availableCount} disponibles)
                    </label>
                  </div>
                  <span className="text-xs text-gray-400">
                    {alreadyAssignedIds.size} usuario(s) ya tienen este curso asignado
                  </span>
                </div>
              )}

              {/* Users List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
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
                        className={`p-4 rounded-xl border transition-all ${
                          isAlreadyAssigned
                            ? 'opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'border-primary bg-primary/10 cursor-pointer'
                            : 'border-carbon-600 hover:border-carbon-500 cursor-pointer'
                        }`}
                        style={{
                          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#0f172a'
                        }}
                        onClick={() => !isAlreadyAssigned && toggleUser(user.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                            isAlreadyAssigned
                              ? 'bg-carbon-600'
                              : isSelected
                              ? 'bg-primary border-primary'
                              : 'border-2 border-carbon-600'
                          }`}>
                            {isSelected && !isAlreadyAssigned && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                            {isAlreadyAssigned && (
                              <XCircle className="w-4 h-4 text-carbon-400" />
                            )}
                          </div>
                          
                          {user.profile_picture_url ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                              <Image
                                src={user.profile_picture_url}
                                alt={displayName}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {displayName[0].toUpperCase()}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-semibold">{displayName}</h4>
                              {isAlreadyAssigned && (
                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                                  Ya asignado
                                </span>
                              )}
                            </div>
                            <p className="text-carbon-400 text-sm">{user.email}</p>
                            {user.org_role && (
                              <p className="text-carbon-500 text-xs mt-1">
                                {user.org_role === 'admin' ? 'Administrador' : 
                                 user.org_role === 'owner' ? 'Propietario' : 'Miembro'}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>

              {/* Custom Message */}
              <div className="pt-4 border-t" style={{ borderColor: '#334155' }}>
                <label className="block text-sm font-semibold text-white mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Mensaje personalizado (opcional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Escribe un mensaje personalizado para los usuarios asignados..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                  style={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155'
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">
                    Este mensaje se enviará junto con la notificación de asignación
                  </p>
                  <p className="text-xs text-gray-500">
                    {customMessage.length}/500
                  </p>
                </div>
              </div>

              {/* Due Date */}
              <div className="pt-4 border-t" style={{ borderColor: '#334155' }}>
                <label className="block text-sm font-semibold text-white mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fecha límite (opcional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border rounded-xl text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  style={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155'
                  }}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Establece una fecha límite para completar el curso (opcional)
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-6" style={{
              backgroundColor: '#1e293b',
              borderColor: '#334155'
            }}>
              <div className="flex items-center justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isAssigning}
                  className="min-w-[120px]"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="gradient"
                  onClick={handleAssign}
                  disabled={isAssigning || selectedCount === 0}
                  className="min-w-[160px]"
                >
                  {isAssigning ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Asignando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Asignar a {selectedCount} usuario{selectedCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

