'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  UsersRound,
  User,
  Search,
  Check,
  Crown,
  Upload,
  Camera,
  Plus,
  Minus,
  ChevronRight
} from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, CreateWorkTeamRequest, UpdateWorkTeamRequest } from '../services/teams.service'
import { useBusinessUsers } from '../hooks/useBusinessUsers'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/core/stores/themeStore'

interface BusinessTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  teamId?: string
}

export function BusinessTeamModal({ isOpen, onClose, onSuccess, teamId }: BusinessTeamModalProps) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { users } = useBusinessUsers()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Theme Colors
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const primaryColor = panelStyles?.primary_button_color || '#0A2540'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const cardBackground = isDark ? (panelStyles?.card_background || '#1E2329') : '#FFFFFF'
  const textColor = isDark ? (panelStyles?.text_color || '#FFFFFF') : '#0F172A'
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const mutedText = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_leader_id: '',
    course_id: '',
    member_ids: [] as string[],
    image_url: ''
  })
  const [originalMemberIds, setOriginalMemberIds] = useState<string[]>([]) // Para trackear miembros originales en edición
  const [memberIdToRecordId, setMemberIdToRecordId] = useState<Map<string, string>>(new Map()) // Map user_id -> record id
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Load team data for edit mode
  useEffect(() => {
    const loadTeamData = async () => {
      if (!teamId || !isOpen) return
      try {
        setIsLoadingTeam(true)
        const teamData = await TeamsService.getTeam(teamId)
        const members = await TeamsService.getTeamMembers(teamId)
        const memberUserIds = members.map(m => m.user_id)

        // Guardar los miembros originales para poder comparar después
        setOriginalMemberIds(memberUserIds)

        // Crear mapa de user_id -> record id (id del registro en work_team_members)
        const idMap = new Map<string, string>()
        members.forEach(m => idMap.set(m.user_id, m.id))
        setMemberIdToRecordId(idMap)

        setFormData({
          name: teamData.name,
          description: teamData.description || '',
          team_leader_id: teamData.team_leader_id || '',
          course_id: teamData.course_id || '',
          member_ids: memberUserIds,
          image_url: teamData.image_url || ''
        })
        if (teamData.image_url) setImagePreview(teamData.image_url)
      } catch (err) {
        setError(t('teams.modal.errors.loadFailed'))
      } finally {
        setIsLoadingTeam(false)
      }
    }
    loadTeamData()
  }, [teamId, isOpen])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', description: '', team_leader_id: '', course_id: '', member_ids: [], image_url: '' })
      setOriginalMemberIds([])
      setMemberIdToRecordId(new Map())
      setSearchTerm('')
      setError(null)
      setImagePreview(null)
    }
  }, [isOpen])

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      user.display_name?.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.first_name?.toLowerCase().includes(search) ||
      user.last_name?.toLowerCase().includes(search)
    )
  })

  const selectedUsers = users.filter(u => formData.member_ids.includes(u.id))

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleToggleMember = (userId: string) => {
    setFormData(prev => {
      const isRemoving = prev.member_ids.includes(userId)
      const newMemberIds = isRemoving
        ? prev.member_ids.filter(id => id !== userId)
        : [...prev.member_ids, userId]
      const newLeaderId = isRemoving && prev.team_leader_id === userId ? '' : prev.team_leader_id
      return { ...prev, member_ids: newMemberIds, team_leader_id: newLeaderId }
    })
  }

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('type', 'team')
      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload })
      const data = await res.json()
      if (data.url) {
        setImagePreview(data.url)
        handleChange('image_url', data.url)
      }
    } catch (err) {
      console.error('Error uploading image:', err)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      if (teamId) {
        // 1. Actualizar información del equipo
        await TeamsService.updateTeam(teamId, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          team_leader_id: formData.team_leader_id || undefined,
          image_url: formData.image_url || undefined
        })

        // 2. Sincronizar miembros
        const currentMemberIds = formData.member_ids
        const membersToAdd = currentMemberIds.filter(id => !originalMemberIds.includes(id))
        const membersToRemove = originalMemberIds.filter(id => !currentMemberIds.includes(id))

        // Agregar nuevos miembros
        if (membersToAdd.length > 0) {
          await TeamsService.addTeamMembers(teamId, { user_ids: membersToAdd })
        }

        // Eliminar miembros removidos
        for (const userId of membersToRemove) {
          const recordId = memberIdToRecordId.get(userId)
          if (recordId) {
            await TeamsService.removeTeamMember(teamId, recordId)
          }
        }
      } else {
        await TeamsService.createTeam({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          team_leader_id: formData.team_leader_id || undefined,
          member_ids: formData.member_ids.length > 0 ? formData.member_ids : undefined,
          image_url: formData.image_url || undefined
        })
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : t(teamId ? 'teams.modal.errors.updateFailed' : 'teams.modal.errors.createFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const getUserName = (user: any) => user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email

  if (!isOpen) return null

    return (
    <AnimatePresence>
      {/* Container - transparent backdrop */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 99999 }}
      >
        {/* Backdrop - transparent, just for closing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border"
            style={{ backgroundColor: cardBackground, borderColor }}
          >
            {/* Two Column Layout - Scrollable container */}
            <div className="flex flex-col lg:flex-row max-h-[85vh] overflow-y-auto lg:overflow-hidden">

              {/* Left Side - Preview Card */}
              <div
                className="lg:w-80 w-full p-4 lg:p-8 flex flex-col border-b lg:border-b-0 lg:border-r shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)`,
                  borderColor
                }}
              >
                <div className="flex-1 flex flex-col items-center justify-center py-2 lg:py-0">
                  {/* Team Avatar */}
                  <motion.div
                    className="relative mb-6 group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className="w-28 h-28 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-white/20 group-hover:border-white/40 transition-colors"
                      style={{
                        backgroundColor: imagePreview ? 'transparent' : `${primaryColor}15`,
                        boxShadow: `0 8px 30px ${primaryColor}40`
                      }}
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                      ) : isUploadingImage ? (
                        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
                      ) : (
                        <Camera className="w-10 h-10 text-white/30 group-hover:text-white/50 transition-colors" />
                      )}
                    </div>
                    <motion.div
                      className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg"
                      style={{ backgroundColor: primaryColor }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Upload className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                    </motion.div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    />
                  </motion.div>

                  {/* Team Name Preview */}
                  <h3 className="text-xl font-bold text-center mb-2 min-h-[28px]" style={{ color: textColor }}>
                    {formData.name || t('teams.modal.fields.name')}
                  </h3>
                  <p className="text-sm text-center mb-8 min-h-[40px] line-clamp-2" style={{ color: mutedText }}>
                    {formData.description || t('teams.modal.placeholders.description')}
                  </p>

                  {/* Selected Members Preview */}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
                        {t('teams.modal.fields.members')}
                      </span>
                      <span className="text-xs font-bold text-white/70">
                        {formData.member_ids.length}
                      </span>
                    </div>

                    {selectedUsers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.slice(0, 6).map((user) => (
                          <motion.div
                            key={user.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="relative"
                          >
                            {user.profile_picture_url ? (
                              <img
                                src={user.profile_picture_url}
                                alt=""
                                className="w-10 h-10 rounded-xl object-cover border border-white/10"
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
                              >
                                {getUserName(user).charAt(0).toUpperCase()}
                              </div>
                            )}
                            {formData.team_leader_id === user.id && (
                              <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-amber-500">
                                <Crown className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                        {selectedUsers.length > 6 && (
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-medium text-white/50">
                            +{selectedUsers.length - 6}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-white/30 text-sm">
                        <UsersRound className="w-4 h-4" />
                        {t('teams.modal.labels.noMembers', 'Sin miembros')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Leader Section */}
                {formData.team_leader_id && (
                  <div className="pt-6 border-t border-white/5">
                    <span className="text-xs font-medium text-white/50 uppercase tracking-wider block mb-3">
                      {t('teams.modal.fields.leader')}
                    </span>
                    {(() => {
                      const leader = users.find(u => u.id === formData.team_leader_id)
                      if (!leader) return null
                      return (
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {leader.profile_picture_url ? (
                              <img src={leader.profile_picture_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                                style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}
                              >
                                {getUserName(leader).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <Crown className="absolute -top-1 -right-1 w-4 h-4 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{getUserName(leader)}</p>
                            <p className="text-xs text-white/40">{leader.email}</p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>

              {/* Right Side - Form */}
              <div className="flex-1 flex flex-col min-w-0 max-h-[85vh] lg:max-h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 lg:p-6 border-b shrink-0" style={{ borderColor }}>
                  <div>
                    <h2 className="text-lg lg:text-xl font-bold" style={{ color: textColor }}>
                      {teamId ? t('teams.modal.titleEdit') : t('teams.modal.titleCreate')}
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: mutedText }}>
                      {teamId ? t('teams.modal.subtitleEdit', 'Actualiza la información del equipo') : t('teams.modal.subtitle')}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <X className="w-5 h-5" style={{ color: mutedText }} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5 lg:space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                    {/* Error */}
                    {error && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                        {t('teams.modal.fields.name')} <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                        className="w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors"
                        style={{
                          backgroundColor: inputBg,
                          borderColor,
                          color: textColor
                        }}
                        placeholder={t('teams.modal.placeholders.name')}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>
                        {t('teams.modal.fields.description')}
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors resize-none"
                        style={{
                          backgroundColor: inputBg,
                          borderColor,
                          color: textColor
                        }}
                        placeholder={t('teams.modal.placeholders.description')}
                      />
                    </div>

                    {/* Members */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-white/70">
                          {t('teams.modal.labels.addMembers')}
                        </label>
                        {formData.member_ids.length > 0 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
                            {formData.member_ids.length} {t('teams.modal.labels.selected')}
                          </span>
                        )}
                      </div>

                      {/* Search */}
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors"
                          style={{
                            backgroundColor: inputBg,
                            borderColor,
                            color: textColor
                          }}
                          placeholder={t('teams.modal.placeholders.searchMembers')}
                        />
                      </div>

                      {/* User List */}
                      <div className="max-h-40 lg:max-h-48 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                        {filteredUsers.length === 0 ? (
                          <div className="p-6 text-center text-white/30 text-sm">
                            {t('teams.modal.labels.noUsers', 'No hay usuarios disponibles')}
                          </div>
                        ) : (
                          filteredUsers.map((user) => {
                            const isSelected = formData.member_ids.includes(user.id)
                            const isLeader = formData.team_leader_id === user.id

                            return (
                              <div
                                key={user.id}
                                className={`flex items-center gap-3 p-3 transition-colors ${isSelected ? 'bg-white/5' : 'hover:bg-white/[0.02]'
                                  }`}
                              >
                                {/* Add/Remove Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleMember(user.id)}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all`}
                                  style={{
                                    backgroundColor: isSelected ? primaryColor : inputBg,
                                    color: isSelected ? '#FFFFFF' : mutedText
                                  }}
                                >
                                  {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </button>

                                {/* Avatar */}
                                {user.profile_picture_url ? (
                                  <img src={user.profile_picture_url} alt="" className="w-9 h-9 rounded-lg object-cover" />
                                ) : (
                                  <div
                                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold"
                                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                                  >
                                    {getUserName(user).charAt(0).toUpperCase()}
                                  </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate" style={{ color: textColor }}>{getUserName(user)}</p>
                                  <p className="text-sm truncate" style={{ color: mutedText }}>{user.email}</p>
                                </div>

                                {/* Leader Toggle */}
                                {isSelected && (
                                  <button
                                    type="button"
                                    onClick={() => handleChange('team_leader_id', isLeader ? '' : user.id)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${isLeader
                                      ? 'bg-amber-500/20 text-amber-400'
                                      : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                                      }`}
                                  >
                                    <Crown className="w-3 h-3" />
                                    {isLeader ? t('teams.modal.labels.leader', 'Líder') : t('teams.modal.labels.setLeader', 'Líder')}
                                  </button>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 lg:p-6 border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      {t('teams.buttons.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !formData.name.trim()}
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      style={{
                        backgroundColor: primaryColor,
                        color: '#FFFFFF',
                        boxShadow: `0 4px 20px ${primaryColor}40`
                      }}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t('teams.buttons.saving')}
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                            {teamId ? t('teams.buttons.save') : t('teams.buttons.create')}
                          </span>
                          <ChevronRight className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
