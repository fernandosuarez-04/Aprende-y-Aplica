'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UsersRound, User, BookOpen, FileText } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, CreateWorkTeamRequest, UpdateWorkTeamRequest } from '../services/teams.service'
import { useBusinessUsers } from '../hooks/useBusinessUsers'
import { PremiumSelect } from './PremiumSelect'
import { TeamImageUpload } from './TeamImageUpload'

interface BusinessTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  teamId?: string // Si se proporciona, es modo edición
}

export function BusinessTeamModal({ isOpen, onClose, onSuccess, teamId }: BusinessTeamModalProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { users } = useBusinessUsers()
  
  // Aplicar colores personalizados
  const modalBg = panelStyles?.card_background || 'rgba(15, 23, 42, 0.95)'
  const modalBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const sectionBg = `${modalBg}CC`
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_leader_id: '',
    course_id: '',
    member_ids: [] as string[],
    image_url: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Cargar datos del equipo si está en modo edición
  useEffect(() => {
    const loadTeamData = async () => {
      if (!teamId || !isOpen) return

      try {
        setIsLoadingTeam(true)
        const teamData = await TeamsService.getTeam(teamId)
        const members = await TeamsService.getTeamMembers(teamId)
        
        setFormData({
          name: teamData.name,
          description: teamData.description || '',
          team_leader_id: teamData.team_leader_id || '',
          course_id: teamData.course_id || '',
          member_ids: members.map(m => m.user_id),
          image_url: teamData.image_url || ''
        })
      } catch (err) {
        console.error('Error loading team data:', err)
        setError('Error al cargar datos del equipo')
      } finally {
        setIsLoadingTeam(false)
      }
    }

    loadTeamData()
  }, [teamId, isOpen])

  // Resetear formulario cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        team_leader_id: '',
        course_id: '',
        member_ids: [],
        image_url: ''
      })
      setSearchTerm('')
      setError(null)
    }
  }, [isOpen])

  // Filtrar usuarios para selección
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

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleToggleMember = (userId: string) => {
    setFormData(prev => {
      const isRemoving = prev.member_ids.includes(userId)
      const newMemberIds = isRemoving
        ? prev.member_ids.filter(id => id !== userId)
        : [...prev.member_ids, userId]
      
      // Si se está removiendo el líder, limpiar el campo del líder
      const newLeaderId = isRemoving && prev.team_leader_id === userId
        ? ''
        : prev.team_leader_id
      
      return {
        ...prev,
        member_ids: newMemberIds,
        team_leader_id: newLeaderId
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (teamId) {
        const updateRequest: UpdateWorkTeamRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          team_leader_id: formData.team_leader_id || undefined,
          course_id: formData.course_id || undefined,
          image_url: formData.image_url || undefined
        }
        await TeamsService.updateTeam(teamId, updateRequest)
      } else {
        const createRequest: CreateWorkTeamRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          team_leader_id: formData.team_leader_id || undefined,
          course_id: formData.course_id || undefined,
          member_ids: formData.member_ids.length > 0 ? formData.member_ids : undefined,
          image_url: formData.image_url || undefined
        }
        await TeamsService.createTeam(createRequest)
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        team_leader_id: '',
        course_id: '',
        member_ids: [],
        image_url: ''
      })
      setSearchTerm('')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar equipo')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative rounded-3xl shadow-2xl border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10 backdrop-blur-xl"
          style={{ 
            backgroundColor: modalBg,
            borderColor: modalBorder
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative border-b p-5 backdrop-blur-sm" style={{ 
            backgroundColor: modalBg,
            borderColor: modalBorder
          }}>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div 
                  initial={{ scale: 0.9, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <UsersRound className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="font-heading text-xl font-bold tracking-tight" style={{ color: textColor }}>
                    {teamId ? 'Editar Equipo' : 'Crear Equipo'}
                  </h2>
                  <p className="font-body text-xs mt-1" style={{ color: textColor, opacity: 0.7 }}>
                    {teamId ? 'Modifica la información del equipo' : 'Crea un nuevo equipo de trabajo'}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                disabled={isLoading}
                className="p-2 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <X className="w-5 h-5" style={{ color: textColor, opacity: 0.7 }} />
              </motion.button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            {isLoadingTeam ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: primaryColor }}></div>
                  <p className="text-sm font-body opacity-70" style={{ color: textColor }}>Cargando datos del equipo...</p>
                </div>
              </div>
            ) : (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl text-red-400 flex items-center gap-3 border backdrop-blur-sm"
                  style={{ 
                    backgroundColor: 'rgba(127, 29, 29, 0.2)',
                    borderColor: 'rgba(220, 38, 38, 0.3)'
                  }}
                >
                  <X className="w-4 h-4" />
                  <span className="text-sm font-body">{error}</span>
                </motion.div>
              )}

              {/* Nombre */}
              <div>
                <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                  Nombre del Equipo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="w-full px-4 py-3 border rounded-xl font-body focus:outline-none focus:ring-1 transition-all"
                  style={{ 
                    borderColor: modalBorder,
                    backgroundColor: sectionBg,
                    color: textColor
                  }}
                  placeholder="Equipo de Desarrollo"
                />
              </div>

              {/* Imagen o Icono */}
              <TeamImageUpload
                value={formData.image_url}
                onChange={(url) => handleChange('image_url', url)}
                disabled={isLoading || isLoadingTeam}
                primaryColor={primaryColor}
                modalBg={modalBg}
                modalBorder={modalBorder}
                textColor={textColor}
                sectionBg={sectionBg}
              />

              {/* Descripción */}
              <div>
                <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border rounded-xl font-body focus:outline-none focus:ring-1 transition-all resize-none"
                  style={{ 
                    borderColor: modalBorder,
                    backgroundColor: sectionBg,
                    color: textColor
                  }}
                  placeholder="Descripción del equipo..."
                />
              </div>

              {/* Líder del Equipo */}
              <div>
                <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                  Líder del Equipo
                </label>
                {formData.member_ids.length === 0 ? (
                  <div 
                    className="w-full px-4 py-3 border rounded-xl font-body opacity-50 cursor-not-allowed"
                    style={{ 
                      borderColor: modalBorder,
                      backgroundColor: sectionBg,
                      color: textColor
                    }}
                  >
                    Selecciona primero los miembros del equipo
                  </div>
                ) : (
                  <PremiumSelect
                    value={formData.team_leader_id}
                    onValueChange={(value) => handleChange('team_leader_id', value)}
                    placeholder="Seleccionar líder..."
                    options={users
                      .filter(user => formData.member_ids.includes(user.id))
                      .map(user => ({
                        value: user.id,
                        label: user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
                      }))}
                  />
                )}
              </div>

              {/* Miembros */}
              <div>
                <label className="block font-body text-sm font-semibold mb-2" style={{ color: textColor }}>
                  Miembros del Equipo
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar usuarios..."
                  className="w-full px-4 py-2 mb-3 border rounded-xl font-body focus:outline-none focus:ring-1 transition-all"
                  style={{ 
                    borderColor: modalBorder,
                    backgroundColor: sectionBg,
                    color: textColor
                  }}
                />
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-xl p-3" style={{ borderColor: modalBorder, backgroundColor: sectionBg }}>
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm font-body opacity-70 text-center py-4">No hay usuarios disponibles</p>
                  ) : (
                    filteredUsers.map(user => (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: formData.member_ids.includes(user.id) ? `${primaryColor}20` : 'transparent' }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.member_ids.includes(user.id)}
                          onChange={() => handleToggleMember(user.id)}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: primaryColor }}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          {user.profile_picture_url ? (
                            <img src={user.profile_picture_url} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}30` }}>
                              <User className="w-4 h-4" style={{ color: primaryColor }} />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-body font-medium">{user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}</p>
                            <p className="text-xs font-body opacity-70">{user.email}</p>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Footer */}
            <div className="border-t p-4 backdrop-blur-sm flex justify-end gap-3" style={{ 
              backgroundColor: modalBg,
              borderColor: modalBorder
            }}>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                className="font-body"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={isLoading || isLoadingTeam}
                className="font-body"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
                  boxShadow: `0 4px 14px 0 ${primaryColor}40`
                }}
              >
                {isLoading ? 'Guardando...' : teamId ? 'Actualizar' : 'Crear Equipo'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

