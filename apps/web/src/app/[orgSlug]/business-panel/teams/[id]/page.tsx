'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UsersRound,
  BookOpen,
  Target,
  MessageSquare,
  Heart,
  BarChart3,
  ArrowLeft,
  User,
  Calendar,
  Edit,
  Trash2,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  Shield,
  Star,
  ChevronRight,
  MoreVertical,
  Crown,
  UserCheck
} from 'lucide-react'
import { TeamsService, WorkTeam, WorkTeamMember } from '@/features/business-panel/services/teams.service'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { useLiaPanel } from '@/core/contexts/LiaPanelContext'
import { TeamCoursesTab } from '@/features/business-panel/components/TeamCoursesTab'
import { TeamObjectivesTab } from '@/features/business-panel/components/TeamObjectivesTab'
import { TeamChatTab } from '@/features/business-panel/components/TeamChatTab'
import { TeamFeedbackTab } from '@/features/business-panel/components/TeamFeedbackTab'
import { TeamAnalyticsTab } from '@/features/business-panel/components/TeamAnalyticsTab'
import { BusinessTeamModal } from '@/features/business-panel/components/BusinessTeamModal'
import Image from 'next/image'

type TabType = 'resumen' | 'cursos' | 'objetivos' | 'conversacion' | 'retroalimentacion' | 'analytics'

export default function BusinessTeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string
  const { styles } = useOrganizationStylesContext()
  const { setPageContext } = useLiaPanel()
  const panelStyles = styles?.panel

  const [team, setTeam] = useState<WorkTeam | null>(null)
  const [teamMembers, setTeamMembers] = useState<WorkTeamMember[]>([])
  const [teamCourses, setTeamCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('resumen')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)



  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  // Colores personalizados de la organización
  const primaryColor = panelStyles?.primary_button_color || '#0A2540'
  const accentColor = panelStyles?.accent_color || '#00D4B3'
  const cardBackground = isDark ? (panelStyles?.card_background || '#1E2329') : '#FFFFFF'
  const textColor = isDark ? (panelStyles?.text_color || '#FFFFFF') : '#0F172A'
  const borderColor = isDark ? (panelStyles?.border_color || 'rgba(255,255,255,0.1)') : 'rgba(0,0,0,0.1)'

  const fetchTeamData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [teamData, members, courses] = await Promise.all([
        TeamsService.getTeam(teamId),
        TeamsService.getTeamMembers(teamId),
        TeamsService.getTeamCourses(teamId).catch(() => [])
      ])
      setTeam(teamData)
      setTeamMembers(members)
      setTeamCourses(courses)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el equipo')
      console.error('Error fetching team:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (teamId) {
      fetchTeamData()
    }
  }, [teamId])

  // Actualizar contexto de LIA con la información del equipo visualizado
  useEffect(() => {
    if (team && typeof setPageContext === 'function') {
      setPageContext({
        pageType: 'business_team_detail',
        entityId: team.id,
        teamName: team.name,
        memberCount: teamMembers.length,
        activeMemberCount: team.active_member_count,
        coursesCount: teamCourses.length,
        currentTab: activeTab,
        description: team.description,
        leaderName: team.team_leader?.name,
        status: team.status
      })
    }

    return () => {
      if (typeof setPageContext === 'function') {
        setPageContext(null)
      }
    }
  }, [team, teamMembers.length, teamCourses.length, activeTab, setPageContext])

  const handleDeleteTeam = async () => {
    if (!team) return

    try {
      setIsDeleting(true)
      await TeamsService.deleteTeam(teamId)
      router.push(`/${params.orgSlug}/business-panel/teams`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el equipo')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const tabs = [
    { id: 'resumen' as TabType, label: 'Resumen', icon: UsersRound },
    { id: 'cursos' as TabType, label: 'Cursos', icon: BookOpen },
    { id: 'objetivos' as TabType, label: 'Objetivos', icon: Target },
    { id: 'conversacion' as TabType, label: 'Chat', icon: MessageSquare },
    { id: 'retroalimentacion' as TabType, label: 'Feedback', icon: Heart },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 }
  ]

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute inset-2 rounded-full animate-pulse"
              style={{ backgroundColor: `${primaryColor}30` }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center"
            >
              <UsersRound className="w-8 h-8" style={{ color: isDark ? '#FFFFFF' : primaryColor, opacity: isDark ? 0.8 : 1 }} />
            </div>
          </div>
          <p className="text-lg font-medium" style={{ color: `${textColor}80` }}>
            Cargando equipo...
          </p>
        </motion.div>
      </div>
    )
  }

  // Error State
  if (error || !team) {
    return (
      <div className="p-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push(`/${params.orgSlug}/business-panel/teams`)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl mb-6 transition-colors"
          style={{
            backgroundColor: `${cardBackground}80`,
            color: textColor
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Equipos
        </motion.button>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-2xl border text-center"
          style={{
            backgroundColor: cardBackground,
            borderColor: 'rgba(239, 68, 68, 0.3)'
          }}
        >
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-xl font-bold mb-2" style={{ color: textColor }}>
            Error al cargar el equipo
          </h3>
          <p style={{ color: `${textColor}60` }}>
            {error || 'Equipo no encontrado'}
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6" style={{ color: textColor }}>
      {/* Header Premium */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${accentColor}10 50%, ${cardBackground} 100%)`,
          backgroundColor: cardBackground,
          borderColor: borderColor
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <div
            className="absolute top-0 right-0 w-full h-full rounded-full blur-3xl"
            style={{ backgroundColor: primaryColor }}
          />
        </div>
        <div className="absolute bottom-0 left-0 w-48 h-48 opacity-5">
          <div
            className="absolute bottom-0 left-0 w-full h-full rounded-full blur-3xl"
            style={{ backgroundColor: accentColor }}
          />
        </div>

        <div className="relative p-6 sm:p-8">
          {/* Back Button & Actions Row */}
          <div className="flex items-start justify-between mb-6">
            <motion.button
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/${params.orgSlug}/business-panel/teams`)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all border"
              style={{
                backgroundColor: `${cardBackground}60`,
                borderColor: `${textColor}10`,
                color: `${textColor}80`
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver a Equipos</span>
              <span className="sm:hidden">Volver</span>
            </motion.button>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: primaryColor,
                  color: '#FFFFFF',
                  boxShadow: `0 4px 20px ${primaryColor}40`
                }}
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#EF4444'
                }}
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Eliminar</span>
              </motion.button>
            </div>
          </div>

          {/* Team Info */}
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Team Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              {team.image_url ? (
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2" style={{ borderColor: primaryColor }}>
                  <Image src={team.image_url} alt={team.name} fill className="object-cover" />
                </div>
              ) : (
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                    boxShadow: `0 8px 30px ${primaryColor}40`
                  }}
                >
                  <UsersRound className="w-12 h-12 text-white" />
                </div>
              )}
              {/* Status Badge */}
              <div
                className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 text-white"
                style={{
                  backgroundColor: team.status === 'active' ? '#10B981' : '#F59E0B'
                }}
              >
                {team.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {team.status === 'active' ? 'Activo' : 'Inactivo'}
              </div>
            </motion.div>

            {/* Team Details */}
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: textColor }}>
                  {team.name}
                </h1>
                {team.description && (
                  <p className="text-sm sm:text-base leading-relaxed" style={{ color: `${textColor}70` }}>
                    {team.description}
                  </p>
                )}
              </div>

              {/* Quick Stats Pills */}
              <div className="flex flex-wrap gap-2 mt-4">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  <UserCheck className="w-4 h-4" style={{ color: isDark ? accentColor : accentColor }} />
                  <span className="font-medium">{team.active_member_count || 0} activos</span>
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  <BookOpen className="w-4 h-4" style={{ color: isDark ? accentColor : accentColor }} />
                  <span className="font-medium">{teamCourses.length} cursos</span>
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{ backgroundColor: `${textColor}10`, color: `${textColor}70` }}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">
                    Creado {new Date(team.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Team Leader */}
              {team.team_leader && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t" style={{ borderColor: `${textColor}10` }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{
                      background: team.team_leader.profile_picture_url
                        ? 'transparent'
                        : `linear-gradient(135deg, ${primaryColor}40, ${accentColor}40)`
                    }}
                  >
                    {team.team_leader.profile_picture_url ? (
                      <Image
                        src={team.team_leader.profile_picture_url}
                        alt=""
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <Crown className="w-5 h-5" style={{ color: primaryColor }} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider font-medium" style={{ color: `${textColor}50` }}>
                      Líder del Equipo
                    </p>
                    <p className="font-semibold" style={{ color: textColor }}>
                      {team.team_leader.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Premium Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-x-auto scrollbar-hide"
      >
        <div
          className="inline-flex p-1.5 rounded-xl min-w-full sm:min-w-0"
          style={{ backgroundColor: `${cardBackground}80` }}
        >
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 sm:flex-none justify-center"
                style={{
                  color: isActive ? '#FFFFFF' : `${textColor}60`
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: isActive ? primaryColor : 'transparent',
                      // boxShadow: isActive ? `0 4px 15px ${primaryColor}40` : 'none'
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: isActive ? (isDark ? '#FFFFFF' : '#FFFFFF') : (isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)') }} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'resumen' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Miembros Activos',
                    value: team.active_member_count || 0,
                    icon: UserCheck,
                    color: primaryColor,
                    gradient: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}05)`
                  },
                  {
                    label: 'Total Miembros',
                    value: team.member_count || 0,
                    icon: UsersRound,
                    color: primaryColor,
                    gradient: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}05)`
                  },
                  {
                    label: 'Cursos Asignados',
                    value: teamCourses.length,
                    icon: BookOpen,
                    color: primaryColor,
                    gradient: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}05)`
                  },
                  {
                    label: 'Completados',
                    value: teamCourses.filter(c => c.status === 'completed').length,
                    icon: CheckCircle,
                    color: primaryColor,
                    gradient: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}05)`
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="p-5 rounded-2xl border relative overflow-hidden"
                    style={{
                      background: stat.gradient,
                      backgroundColor: cardBackground,
                      borderColor: `${stat.color}30`
                    }}
                  >
                    <div className="relative z-10">
                      <stat.icon
                        className="w-8 h-8 mb-3"
                        style={{ 
                          color: isDark ? '#FFFFFF' : stat.color,
                          opacity: isDark ? 0.9 : 0.8
                        }}
                      />
                      <p className="text-3xl font-bold mb-1" style={{ color: textColor }}>
                        {stat.value}
                      </p>
                      <p className="text-xs font-medium" style={{ color: `${textColor}60` }}>
                        {stat.label}
                      </p>
                    </div>
                    <div
                      className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-10"
                      style={{ backgroundColor: stat.color }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Team Members - Premium Grid */}
              {teamMembers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                          boxShadow: `0 8px 25px ${primaryColor}40`
                        }}
                      >
                        <UsersRound className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: textColor }}>
                          Miembros del Equipo
                        </h3>
                        <p className="text-sm" style={{ color: `${textColor}60` }}>
                          {teamMembers.length} miembro{teamMembers.length !== 1 ? 's' : ''} en total
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Members Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamMembers.map((member, index) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 20, rotateX: -10 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ delay: 0.3 + index * 0.08 }}
                        whileHover={{
                          y: -8,
                          scale: 1.02,
                          boxShadow: `0 20px 40px ${primaryColor}20`
                        }}
                        className="group relative rounded-2xl border overflow-hidden cursor-pointer"
                        style={{
                          backgroundColor: cardBackground,
                          borderColor
                        }}
                      >
                        {/* Gradient Overlay */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}10)`
                          }}
                        />

                        {/* Decorative Corner */}
                        <div
                          className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"
                          style={{
                            background: member.role === 'leader'
                              ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                              : `linear-gradient(135deg, ${textColor}20, ${textColor}10)`
                          }}
                        />

                        <div className="relative p-5">
                          {/* Avatar & Status */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="relative">
                              {member.user?.profile_picture_url ? (
                                <div
                                  className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition-transform group-hover:scale-105"
                                  style={{ borderColor: `${primaryColor}40` }}
                                >
                                  <Image
                                    src={member.user.profile_picture_url}
                                    alt=""
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div
                                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white transition-transform group-hover:scale-105"
                                  style={{
                                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                                    boxShadow: `0 8px 20px ${primaryColor}30`
                                  }}
                                >
                                  {(member.user?.name || member.user?.email || 'U')[0].toUpperCase()}
                                </div>
                              )}

                              {/* Online Status Dot */}
                              <div
                                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                                style={{
                                  borderColor: cardBackground,
                                  backgroundColor: member.status === 'active' ? primaryColor : '#6B7280'
                                }}
                              >
                                {member.status === 'active' && (
                                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                )}
                              </div>
                            </div>

                            {/* Role Badge */}
                            <div className="flex-1">
                              {member.role === 'leader' && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2"
                                  style={{
                                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                                    color: 'white',
                                    boxShadow: `0 4px 12px ${primaryColor}40`
                                  }}
                                >
                                  <Crown className="w-3 h-3" />
                                  Líder
                                </motion.div>
                              )}
                              {member.role === 'co-leader' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 bg-purple-500/20 text-purple-400">
                                  <Star className="w-3 h-3" />
                                  Co-Líder
                                </span>
                              )}
                              {member.role === 'member' && (
                                <span
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-2"
                                  style={{ backgroundColor: `${textColor}10`, color: `${textColor}60` }}
                                >
                                  <User className="w-3 h-3" />
                                  Miembro
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="space-y-2">
                            <h4 className="font-bold text-lg truncate" style={{ color: textColor }}>
                              {member.user?.name || 'Usuario'}
                            </h4>
                            {member.user?.email && (
                              <p
                                className="text-sm flex items-center gap-2 truncate"
                                style={{ color: `${textColor}50` }}
                              >
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{member.user.email}</span>
                              </p>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: `${textColor}10` }}>
                            <span
                              className="text-sm font-medium flex items-center gap-1.5"
                              style={{ color: member.status === 'active' ? primaryColor : '#6B7280' }}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: member.status === 'active' ? primaryColor : '#6B7280' }}
                              />
                              {member.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                            <motion.div
                              whileHover={{ x: 3 }}
                              className="text-sm font-medium flex items-center gap-1"
                              style={{ color: primaryColor }}
                            >
                              Ver perfil
                              <ChevronRight className="w-4 h-4" />
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Assigned Courses - Premium Grid */}
              {teamCourses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ rotate: -10, scale: 1.1 }}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{
                          backgroundColor: primaryColor,
                          boxShadow: `0 8px 25px ${primaryColor}40`
                        }}
                      >
                        <BookOpen className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: textColor }}>
                          Cursos Asignados
                        </h3>
                        <p className="text-sm" style={{ color: `${textColor}60` }}>
                          {teamCourses.length} curso{teamCourses.length !== 1 ? 's' : ''} en total
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05, x: 3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('cursos')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                      style={{
                        backgroundColor: primaryColor,
                        color: 'white',
                        boxShadow: `0 4px 15px ${primaryColor}40`
                      }}
                    >
                      Ver todos
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Courses Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {teamCourses.slice(0, 4).map((assignment, index) => {
                      const statusConfig = {
                        completed: {
                          label: 'Completado',
                          color: primaryColor,
                          bgColor: `${primaryColor}20`,
                          icon: CheckCircle,
                          progress: 100
                        },
                        in_progress: {
                          label: 'En Progreso',
                          color: primaryColor,
                          bgColor: `${primaryColor}20`,
                          icon: Clock,
                          progress: 45
                        },
                        assigned: {
                          label: 'Asignado',
                          color: '#F59E0B',
                          bgColor: 'rgba(245, 158, 11, 0.15)',
                          icon: Target,
                          progress: 0
                        }
                      }
                      const status = statusConfig[assignment.status as keyof typeof statusConfig] || statusConfig.assigned

                      return (
                        <motion.div
                          key={assignment.id}
                          initial={{ opacity: 0, y: 20, rotateY: -5 }}
                          animate={{ opacity: 1, y: 0, rotateY: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          whileHover={{
                            y: -5,
                            scale: 1.01,
                            boxShadow: `0 20px 40px ${primaryColor}15`
                          }}
                          className="group relative rounded-2xl border overflow-hidden cursor-pointer"
                          style={{
                            backgroundColor: cardBackground,
                            borderColor
                          }}
                        >
                          {/* Gradient Overlay */}
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{
                              background: `linear-gradient(135deg, ${status.color}08, transparent)`
                            }}
                          />

                          {/* Decorative Element */}
                          <div
                            className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                            style={{ backgroundColor: status.color }}
                          />

                          <div className="relative p-5">
                            <div className="flex gap-4">
                              {/* Course Thumbnail */}
                              <div className="relative flex-shrink-0">
                                {assignment.course?.thumbnail_url ? (
                                  <div
                                    className="relative w-20 h-20 rounded-xl overflow-hidden border transition-transform group-hover:scale-105"
                                    style={{ borderColor: `${status.color}40` }}
                                  >
                                    <Image
                                      src={assignment.course.thumbnail_url}
                                      alt={assignment.course.title || 'Curso'}
                                      fill
                                      className="object-cover"
                                    />
                                    <div
                                      className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className="w-20 h-20 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                                    style={{
                                      background: `linear-gradient(135deg, ${primaryColor}30, ${accentColor}20)`,
                                      border: `1px solid ${primaryColor}30`
                                    }}
                                  >
                                    <BookOpen className="w-8 h-8" style={{ color: isDark ? '#FFFFFF' : primaryColor, opacity: isDark ? 0.9 : 1 }} />
                                  </div>
                                )}

                                {/* Status Icon Badge */}
                                <div
                                  className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center border-2"
                                  style={{
                                    backgroundColor: status.bgColor,
                                    borderColor: cardBackground
                                  }}
                                >
                                  <status.icon className="w-3.5 h-3.5" style={{ color: status.color }} />
                                </div>
                              </div>

                              {/* Course Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-lg mb-1.5 truncate group-hover:text-clip" style={{ color: textColor }}>
                                  {assignment.course?.title || 'Curso sin título'}
                                </h4>

                                <div className="flex items-center gap-3 mb-3">
                                  {/* Status Badge */}
                                  <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                                    style={{ backgroundColor: status.bgColor, color: status.color }}
                                  >
                                    <status.icon className="w-3 h-3" />
                                    {status.label}
                                  </span>

                                  {/* Due Date */}
                                  {assignment.due_date && (
                                    <span
                                      className="text-xs flex items-center gap-1"
                                      style={{ color: `${textColor}50` }}
                                    >
                                      <Calendar className="w-3 h-3" />
                                      Vence: {new Date(assignment.due_date).toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'short'
                                      })}
                                    </span>
                                  )}
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span style={{ color: `${textColor}60` }}>Progreso del equipo</span>
                                    <span className="font-semibold" style={{ color: status.color }}>
                                      {status.progress}%
                                    </span>
                                  </div>
                                  <div
                                    className="h-2 rounded-full overflow-hidden"
                                    style={{ backgroundColor: `${textColor}10` }}
                                  >
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${status.progress}%` }}
                                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                                      className="h-full rounded-full"
                                      style={{
                                        background: `linear-gradient(90deg, ${status.color}, ${status.color}CC)`,
                                        boxShadow: status.progress > 0 ? `0 0 10px ${status.color}60` : 'none'
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: `${textColor}08` }}>
                              <span className="text-xs" style={{ color: `${textColor}50` }}>
                                {assignment.course?.category && (
                                  <span
                                    className="px-2 py-0.5 rounded mr-2"
                                    style={{ backgroundColor: `${textColor}10` }}
                                  >
                                    {assignment.course.category}
                                  </span>
                                )}
                                Asignado al equipo
                              </span>
                              <motion.div
                                whileHover={{ x: 3 }}
                                className="text-sm font-medium flex items-center gap-1"
                                style={{ color: primaryColor }}
                              >
                                Ver detalles
                                <ChevronRight className="w-4 h-4" />
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* Empty State for Courses */}
              {teamCourses.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-2xl border p-12 text-center"
                  style={{ backgroundColor: cardBackground, borderColor }}
                >
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <BookOpen className="w-10 h-10" style={{ color: isDark ? '#FFFFFF' : primaryColor, opacity: isDark ? 0.8 : 1 }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: textColor }}>
                    Sin cursos asignados
                  </h3>
                  <p className="mb-6" style={{ color: `${textColor}60` }}>
                    Este equipo aún no tiene cursos asignados
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab('cursos')}
                    className="px-6 py-3 rounded-xl font-medium text-white"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                      boxShadow: `0 4px 20px ${primaryColor}40`
                    }}
                  >
                    Asignar primer curso
                  </motion.button>
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'cursos' && team && (
            <TeamCoursesTab
              teamId={teamId}
              teamName={team.name}
              teamMembers={teamMembers}
            />
          )}

          {activeTab === 'objetivos' && (
            <TeamObjectivesTab teamId={teamId} />
          )}

          {activeTab === 'conversacion' && (
            <TeamChatTab
              teamId={teamId}
              teamName={team.name}
              teamImageUrl={team.image_url}
            />
          )}

          {activeTab === 'retroalimentacion' && (
            <TeamFeedbackTab teamId={teamId} teamMembers={teamMembers} />
          )}

          {activeTab === 'analytics' && (
            <TeamAnalyticsTab teamId={teamId} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 backdrop-blur-md"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md rounded-2xl border p-6 text-center"
              style={{ backgroundColor: cardBackground, borderColor }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
              >
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: textColor }}>
                ¿Eliminar equipo?
              </h3>
              <p className="mb-6" style={{ color: `${textColor}60` }}>
                Esta acción eliminará el equipo "{team.name}" y todos sus datos asociados. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-medium transition-colors"
                  style={{
                    backgroundColor: `${textColor}10`,
                    color: textColor
                  }}
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteTeam}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 rounded-xl font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Eliminando...
                    </span>
                  ) : (
                    'Eliminar'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Team Modal */}
      <BusinessTeamModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          fetchTeamData()
          setIsEditModalOpen(false)
        }}
        teamId={teamId}
      />
    </div>
  )
}

