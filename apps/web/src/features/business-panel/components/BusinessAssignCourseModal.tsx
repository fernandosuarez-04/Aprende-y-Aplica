'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Users,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  UserCheck,
  AlertCircle,
  MessageSquare,
  BookOpen,
  Sparkles,
  Check,
  Clock,
  Send,
  User,
  UsersRound
} from 'lucide-react'
import { useBusinessUsers } from '../hooks/useBusinessUsers'
import { useTeams } from '../hooks/useTeams'
import Image from 'next/image'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { PremiumDatePicker } from './PremiumDatePicker'

interface BusinessAssignCourseModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  courseTitle: string
  onAssignComplete: () => void
}

type AssignMode = 'users' | 'teams'

interface AssignedUserInfo {
  user_id: string
  source: 'direct' | 'team'
  team_name?: string
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
  const { teams, isLoading: loadingTeams, refetch: refetchTeams } = useTeams()

  const [assignMode, setAssignMode] = useState<AssignMode>('users')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set())
  const [dueDate, setDueDate] = useState<string>('')
  const [customMessage, setCustomMessage] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [alreadyAssignedUserIds, setAlreadyAssignedUserIds] = useState<Set<string>>(new Set())
  const [assignedUsersInfo, setAssignedUsersInfo] = useState<Map<string, AssignedUserInfo>>(new Map())
  const [alreadyAssignedTeamIds, setAlreadyAssignedTeamIds] = useState<Set<string>>(new Set())

  // Theme colors
  const primaryColor = panelStyles?.primary_button_color || '#8B5CF6'
  const accentColor = panelStyles?.accent_color || '#10B981'
  const cardBackground = panelStyles?.card_background || '#1E2329'
  const textColor = panelStyles?.text_color || '#FFFFFF'

  // Refresh data when modal opens
  useEffect(() => {
    if (isOpen) {
      refetchUsers()
      refetchTeams()
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load already assigned users
  useEffect(() => {
    if (isOpen && courseId) {
      const fetchAssignedUsers = async () => {
        try {
          console.log('🔍 Fetching assigned users for course:', courseId)
          const response = await fetch(`/api/business/courses/${courseId}/assigned-users`, {
            credentials: 'include'
          })
          if (response.ok) {
            const data = await response.json()
            console.log('📊 Assigned users response:', data)
            if (data.success && data.user_ids) {
              console.log('✅ Setting alreadyAssignedUserIds:', data.user_ids)
              setAlreadyAssignedUserIds(new Set(data.user_ids))
              // Guardar info detallada sobre origen de asignación
              if (data.assigned_users) {
                const infoMap = new Map<string, AssignedUserInfo>()
                data.assigned_users.forEach((u: AssignedUserInfo) => {
                  infoMap.set(u.user_id, u)
                })
                setAssignedUsersInfo(infoMap)
                console.log('✅ Setting assignedUsersInfo:', data.assigned_users)
              }
            }
          } else {
            console.error('❌ Response not OK:', response.status, await response.text())
          }
        } catch (err) {
          console.error('Error fetching assigned users:', err)
        }
      }
      fetchAssignedUsers()
    }
  }, [isOpen, courseId])

  // Load already assigned teams
  useEffect(() => {
    if (isOpen && courseId) {
      const fetchAssignedTeams = async () => {
        try {
          const response = await fetch(`/api/business/courses/${courseId}/assigned-teams`, {
            credentials: 'include'
          })
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.team_ids) {
              setAlreadyAssignedTeamIds(new Set(data.team_ids))
            }
          }
        } catch (err) {
          console.error('Error fetching assigned teams:', err)
        }
      }
      fetchAssignedTeams()
    }
  }, [isOpen, courseId])

  // Filter users
  const availableUsers = users.filter(user => {
    const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    const matchesSearch = searchTerm === '' ||
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch && (user.org_status === 'active' || !user.org_status)
  })

  // Filter teams
  const availableTeams = teams.filter(team => {
    const matchesSearch = searchTerm === '' ||
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch && team.status === 'active'
  })

  const toggleUser = (userId: string) => {
    if (alreadyAssignedUserIds.has(userId)) return
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

  const toggleTeam = (teamId: string) => {
    if (alreadyAssignedTeamIds.has(teamId)) return
    setSelectedTeamIds(prev => {
      const next = new Set(prev)
      if (next.has(teamId)) {
        next.delete(teamId)
      } else {
        next.add(teamId)
      }
      return next
    })
  }

  const handleSelectAllUsers = () => {
    const availableUserIds = availableUsers
      .filter(u => !alreadyAssignedUserIds.has(u.id))
      .map(u => u.id)

    if (availableUserIds.length === 0) return

    const allSelected = availableUserIds.every(id => selectedUserIds.has(id))

    if (allSelected) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(availableUserIds))
    }
  }

  const handleSelectAllTeams = () => {
    const availableTeamIds = availableTeams
      .filter(t => !alreadyAssignedTeamIds.has(t.team_id))
      .map(t => t.team_id)

    if (availableTeamIds.length === 0) return

    const allSelected = availableTeamIds.every(id => selectedTeamIds.has(id))

    if (allSelected) {
      setSelectedTeamIds(new Set())
    } else {
      setSelectedTeamIds(new Set(availableTeamIds))
    }
  }

  const handleAssign = async () => {
    if (assignMode === 'users' && selectedUserIds.size === 0) {
      setError('Debes seleccionar al menos un usuario')
      return
    }
    if (assignMode === 'teams' && selectedTeamIds.size === 0) {
      setError('Debes seleccionar al menos un equipo')
      return
    }

    setIsAssigning(true)
    setError(null)

    try {
      if (assignMode === 'users') {
        // Assign to individual users
        const response = await fetch(`/api/business/courses/${courseId}/assign`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
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
      } else {
        // Assign to teams
        const teamIds = Array.from(selectedTeamIds)
        let successCount = 0
        let errorMessage = ''

        for (const teamId of teamIds) {
          const response = await fetch(`/api/business/teams/${teamId}/assign-course`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              course_id: courseId,
              due_date: dueDate || null,
              message: customMessage.trim() || null
            })
          })

          const data = await response.json()
          if (response.ok) {
            successCount++
          } else {
            errorMessage = data.error || 'Error al asignar a equipo'
          }
        }

        if (successCount === 0) {
          throw new Error(errorMessage || 'Error al asignar el curso a los equipos')
        }
      }

      setSelectedUserIds(new Set())
      setSelectedTeamIds(new Set())
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

  const handleClose = () => {
    setSelectedUserIds(new Set())
    setSelectedTeamIds(new Set())
    setDueDate('')
    setCustomMessage('')
    setError(null)
    setSearchTerm('')
    setAssignMode('users')
    onClose()
  }

  if (!isOpen) return null

  const availableUserCount = availableUsers.filter(u => !alreadyAssignedUserIds.has(u.id)).length
  const selectedUserCount = Array.from(selectedUserIds).filter(id => !alreadyAssignedUserIds.has(id)).length
  const availableTeamCount = availableTeams.filter(t => !alreadyAssignedTeamIds.has(t.team_id)).length
  const selectedTeamCount = Array.from(selectedTeamIds).filter(id => !alreadyAssignedTeamIds.has(id)).length
  const selectedUsers = users.filter(u => selectedUserIds.has(u.id))
  const selectedTeams = teams.filter(t => selectedTeamIds.has(t.team_id))

  const currentSelectedCount = assignMode === 'users' ? selectedUserCount : selectedTeamCount
  const currentAvailableCount = assignMode === 'users' ? availableUserCount : availableTeamCount

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 backdrop-blur-md"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        />

        {/* Modal - Split Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative rounded-2xl shadow-2xl overflow-hidden border border-white/10 w-full max-w-4xl max-h-[85vh] z-10"
          style={{ backgroundColor: cardBackground }}
        >
          <div className="flex flex-row h-full max-h-[85vh]">

            {/* Left Panel - Preview (Solo en desktop) */}
            <div
              className="w-80 flex-shrink-0 flex-col p-8 border-r border-white/5 hidden xl:flex"
              style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)` }}
            >
              {/* Course Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative mb-6"
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                    boxShadow: `0 8px 30px ${primaryColor}40`
                  }}
                >
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: accentColor }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </motion.div>
              </motion.div>

              {/* Course Title */}
              <div className="text-center mb-6">
                <h3 className="font-bold text-lg mb-2" style={{ color: textColor }}>
                  Asignar Curso
                </h3>
                <p className="text-sm line-clamp-2" style={{ color: `${textColor}70` }}>
                  {courseTitle}
                </p>
              </div>

              {/* Mode Indicator */}
              <div
                className="p-3 rounded-xl border border-white/10 mb-6 text-center"
                style={{ backgroundColor: `${cardBackground}80` }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  {assignMode === 'users' ? (
                    <User className="w-4 h-4" style={{ color: primaryColor }} />
                  ) : (
                    <UsersRound className="w-4 h-4" style={{ color: primaryColor }} />
                  )}
                  <span className="text-sm font-medium" style={{ color: textColor }}>
                    {assignMode === 'users' ? 'Usuarios Individuales' : 'Equipos de Trabajo'}
                  </span>
                </div>
              </div>

              {/* Selection Stats */}
              <div className="space-y-4 mb-6">
                <div
                  className="p-4 rounded-xl border border-white/10"
                  style={{ backgroundColor: `${cardBackground}80` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: `${textColor}70` }}>Seleccionados</span>
                    <span className="text-2xl font-bold" style={{ color: primaryColor }}>{currentSelectedCount}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${primaryColor}20` }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: currentAvailableCount > 0 ? `${(currentSelectedCount / currentAvailableCount) * 100}%` : '0%' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: `${textColor}50` }}>
                    de {currentAvailableCount} disponibles
                  </p>
                </div>
              </div>

              {/* Selected Preview */}
              {currentSelectedCount > 0 && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-medium mb-3" style={{ color: `${textColor}60` }}>
                    {assignMode === 'users' ? 'USUARIOS SELECCIONADOS' : 'EQUIPOS SELECCIONADOS'}
                  </p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    {assignMode === 'users' ? (
                      selectedUsers.slice(0, 8).map((user, index) => {
                        const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
                        return (
                          <motion.div
                            key={user.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white/20"
                            style={{ backgroundColor: primaryColor }}
                            title={displayName}
                          >
                            {displayName[0].toUpperCase()}
                          </motion.div>
                        )
                      })
                    ) : (
                      selectedTeams.slice(0, 6).map((team, index) => (
                        <motion.div
                          key={team.team_id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white border border-white/20"
                          style={{ backgroundColor: `${primaryColor}80` }}
                        >
                          {team.name}
                        </motion.div>
                      ))
                    )}
                    {currentSelectedCount > (assignMode === 'users' ? 8 : 6) && (
                      <div
                        className="px-2 py-1 rounded-lg text-xs font-bold border"
                        style={{ backgroundColor: `${primaryColor}30`, color: primaryColor, borderColor: primaryColor }}
                      >
                        +{currentSelectedCount - (assignMode === 'users' ? 8 : 6)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="mt-auto pt-6 space-y-3">
                {dueDate && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: `${textColor}70` }}>
                    <Clock className="w-4 h-4" style={{ color: accentColor }} />
                    <span>Fecha límite: {new Date(dueDate).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
                {customMessage && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: `${textColor}70` }}>
                    <MessageSquare className="w-4 h-4" style={{ color: accentColor }} />
                    <span>Mensaje incluido</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center xl:hidden"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold" style={{ color: textColor }}>
                      Seleccionar Destinatarios
                    </h2>
                    <p className="text-xs sm:text-sm xl:hidden line-clamp-1" style={{ color: `${textColor}60` }}>
                      {courseTitle}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  disabled={isAssigning}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
                >
                  <X className="w-5 h-5" style={{ color: `${textColor}60` }} />
                </motion.button>
              </div>

              {/* Mode Tabs */}
              <div className="p-3 sm:p-4 border-b border-white/10">
                <div className="flex gap-1 sm:gap-2 p-1 rounded-xl" style={{ backgroundColor: `${cardBackground}80` }}>
                  <button
                    onClick={() => { setAssignMode('users'); setSearchTerm('') }}
                    className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all`}
                    style={{
                      backgroundColor: assignMode === 'users' ? primaryColor : 'transparent',
                      color: assignMode === 'users' ? '#FFFFFF' : `${textColor}70`
                    }}
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden xs:inline">Usuarios</span> ({availableUserCount})
                  </button>
                  <button
                    onClick={() => { setAssignMode('teams'); setSearchTerm('') }}
                    className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all`}
                    style={{
                      backgroundColor: assignMode === 'teams' ? primaryColor : 'transparent',
                      color: assignMode === 'teams' ? '#FFFFFF' : `${textColor}70`
                    }}
                  >
                    <UsersRound className="w-4 h-4" />
                    <span className="hidden xs:inline">Equipos</span> ({availableTeamCount})
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 rounded-xl flex items-center gap-3 border"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-red-400 text-sm">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: `${textColor}40` }} />
                  <input
                    type="text"
                    placeholder={assignMode === 'users' ? 'Buscar por nombre o email...' : 'Buscar equipos...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/20 transition-colors"
                    style={{ backgroundColor: `${cardBackground}80`, color: textColor }}
                  />
                </div>

                {/* Users Mode */}
                {assignMode === 'users' && (
                  <>
                    {/* Select All Users */}
                    {availableUserCount > 0 && (
                      <motion.button
                        onClick={handleSelectAllUsers}
                        className="flex items-center gap-3 w-full p-4 rounded-xl border transition-all hover:bg-white/5"
                        style={{ borderColor: selectedUserCount === availableUserCount ? primaryColor : 'rgba(255,255,255,0.1)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors"
                          style={{
                            backgroundColor: selectedUserCount === availableUserCount ? primaryColor : 'transparent',
                            borderColor: selectedUserCount === availableUserCount ? primaryColor : 'rgba(255,255,255,0.3)'
                          }}
                        >
                          {selectedUserCount === availableUserCount && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="font-medium" style={{ color: textColor }}>
                          Seleccionar todos ({availableUserCount} disponibles)
                        </span>
                      </motion.button>
                    )}

                    {/* Users List */}
                    <div className="space-y-2">
                      {loadingUsers ? (
                        <div className="text-center py-12">
                          <div className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-4"
                            style={{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor }} />
                          <p style={{ color: `${textColor}50` }}>Cargando usuarios...</p>
                        </div>
                      ) : availableUsers.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="w-16 h-16 mx-auto mb-4" style={{ color: `${textColor}20` }} />
                          <p style={{ color: `${textColor}50` }}>No hay usuarios disponibles</p>
                        </div>
                      ) : (
                        availableUsers.map((user, index) => {
                          const isAlreadyAssigned = alreadyAssignedUserIds.has(user.id)
                          const isSelected = selectedUserIds.has(user.id)
                          const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
                          const assignmentInfo = assignedUsersInfo.get(user.id)

                          return (
                            <motion.button
                              key={user.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 }}
                              onClick={() => !isAlreadyAssigned && toggleUser(user.id)}
                              disabled={isAlreadyAssigned}
                              className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all text-left ${isAlreadyAssigned ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'
                                }`}
                              style={{
                                backgroundColor: isSelected ? `${primaryColor}15` : 'transparent',
                                borderColor: isSelected ? primaryColor : 'rgba(255,255,255,0.1)'
                              }}
                            >
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center border-2 flex-shrink-0 transition-colors"
                                style={{
                                  backgroundColor: isSelected ? primaryColor : isAlreadyAssigned ? 'rgba(255,255,255,0.1)' : 'transparent',
                                  borderColor: isSelected ? primaryColor : isAlreadyAssigned ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)'
                                }}
                              >
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                                {isAlreadyAssigned && <XCircle className="w-4 h-4" style={{ color: `${textColor}40` }} />}
                              </div>

                              {user.profile_picture_url ? (
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                                  <Image src={user.profile_picture_url} alt={displayName} fill className="object-cover" />
                                </div>
                              ) : (
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                                >
                                  {displayName[0].toUpperCase()}
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium truncate" style={{ color: textColor }}>{displayName}</span>
                                  {isAlreadyAssigned && (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${assignmentInfo?.source === 'team'
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : 'bg-yellow-500/20 text-yellow-400'
                                        }`}
                                      title={assignmentInfo?.source === 'team' && assignmentInfo?.team_name
                                        ? `Asignado vía equipo: ${assignmentInfo.team_name}`
                                        : 'Asignación directa'}
                                    >
                                      {assignmentInfo?.source === 'team'
                                        ? `Vía ${assignmentInfo?.team_name || 'equipo'}`
                                        : 'Ya asignado'}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm truncate" style={{ color: `${textColor}50` }}>{user.email}</p>
                              </div>
                            </motion.button>
                          )
                        })
                      )}
                    </div>
                  </>
                )}

                {/* Teams Mode */}
                {assignMode === 'teams' && (
                  <>
                    {/* Select All Teams */}
                    {availableTeamCount > 0 && (
                      <motion.button
                        onClick={handleSelectAllTeams}
                        className="flex items-center gap-3 w-full p-4 rounded-xl border transition-all hover:bg-white/5"
                        style={{ borderColor: selectedTeamCount === availableTeamCount ? primaryColor : 'rgba(255,255,255,0.1)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors"
                          style={{
                            backgroundColor: selectedTeamCount === availableTeamCount ? primaryColor : 'transparent',
                            borderColor: selectedTeamCount === availableTeamCount ? primaryColor : 'rgba(255,255,255,0.3)'
                          }}
                        >
                          {selectedTeamCount === availableTeamCount && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="font-medium" style={{ color: textColor }}>
                          Seleccionar todos ({availableTeamCount} disponibles)
                        </span>
                      </motion.button>
                    )}

                    {/* Teams List */}
                    <div className="space-y-2">
                      {loadingTeams ? (
                        <div className="text-center py-12">
                          <div className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-4"
                            style={{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor }} />
                          <p style={{ color: `${textColor}50` }}>Cargando equipos...</p>
                        </div>
                      ) : availableTeams.length === 0 ? (
                        <div className="text-center py-12">
                          <UsersRound className="w-16 h-16 mx-auto mb-4" style={{ color: `${textColor}20` }} />
                          <p style={{ color: `${textColor}50` }}>No hay equipos disponibles</p>
                          <p className="text-xs mt-2" style={{ color: `${textColor}30` }}>
                            Crea equipos desde la sección de Equipos
                          </p>
                        </div>
                      ) : (
                        availableTeams.map((team, index) => {
                          const isAlreadyAssigned = alreadyAssignedTeamIds.has(team.team_id)
                          const isSelected = selectedTeamIds.has(team.team_id)

                          return (
                            <motion.button
                              key={team.team_id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 }}
                              onClick={() => !isAlreadyAssigned && toggleTeam(team.team_id)}
                              disabled={isAlreadyAssigned}
                              className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all text-left ${isAlreadyAssigned ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'
                                }`}
                              style={{
                                backgroundColor: isSelected ? `${primaryColor}15` : 'transparent',
                                borderColor: isSelected ? primaryColor : 'rgba(255,255,255,0.1)'
                              }}
                            >
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center border-2 flex-shrink-0 transition-colors"
                                style={{
                                  backgroundColor: isSelected ? primaryColor : isAlreadyAssigned ? 'rgba(255,255,255,0.1)' : 'transparent',
                                  borderColor: isSelected ? primaryColor : isAlreadyAssigned ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)'
                                }}
                              >
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                                {isAlreadyAssigned && <XCircle className="w-4 h-4" style={{ color: `${textColor}40` }} />}
                              </div>

                              {team.image_url ? (
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                                  <Image src={team.image_url} alt={team.name} fill className="object-cover" />
                                </div>
                              ) : (
                                <div
                                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                                >
                                  <UsersRound className="w-6 h-6 text-white" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate" style={{ color: textColor }}>{team.name}</span>
                                  {isAlreadyAssigned && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 flex-shrink-0">
                                      Ya asignado
                                    </span>
                                  )}
                                </div>
                                {team.description && (
                                  <p className="text-sm truncate" style={{ color: `${textColor}50` }}>{team.description}</p>
                                )}
                                <p className="text-xs mt-1" style={{ color: `${textColor}40` }}>
                                  {team.member_count || 0} miembro{(team.member_count || 0) !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </motion.button>
                          )
                        })
                      )}
                    </div>
                  </>
                )}

                {/* Options Section */}
                <div className="pt-5 border-t border-white/10 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Due Date */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: `${textColor}80` }}>
                        <span>Fecha límite (opcional)</span>
                      </label>
                      <PremiumDatePicker
                        value={dueDate}
                        onChange={setDueDate}
                        placeholder="Seleccionar fecha"
                        minDate={new Date()}
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: `${textColor}80` }}>
                        <MessageSquare className="w-4 h-4" />
                        Mensaje (opcional)
                      </label>
                      <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        rows={2}
                        maxLength={200}
                        className="w-full px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-white/20 transition-colors resize-none"
                        style={{ backgroundColor: `${cardBackground}80`, color: textColor }}
                      />
                      <p className="text-xs text-right mt-1" style={{ color: `${textColor}40` }}>
                        {customMessage.length}/200
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="text-sm xl:hidden text-center sm:text-left" style={{ color: `${textColor}60` }}>
                  {currentSelectedCount} seleccionado{currentSelectedCount !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    disabled={isAssigning}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-colors hover:bg-white/5 disabled:opacity-50 text-sm sm:text-base"
                    style={{ color: textColor }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAssign}
                    disabled={isAssigning || currentSelectedCount === 0}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                      boxShadow: currentSelectedCount > 0 ? `0 8px 25px ${primaryColor}40` : 'none'
                    }}
                  >
                    {isAssigning ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="hidden sm:inline">Asignando...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Asignar ({currentSelectedCount})</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
