'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import {
  Users,
  UserCircle,
  BookOpen,
  Calendar,
  Crown,
  Star,
  ChevronLeft,
  Clock,
  ArrowRight,
  GraduationCap,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Heart,
  Target,
  TrendingUp,
  BarChart3,
  Lock,
  CheckCircle,
  XCircle,
  Award
} from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOrganizationStyles } from '@/features/business-panel/hooks/useOrganizationStyles'
import { useLiaPanel } from '@/core/contexts/LiaPanelContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { LIA_PANEL_WIDTH } from '@/core/components/LiaSidePanel'
import { TeamChatTab } from '@/features/business-panel/components/TeamChatTab'
import { TeamFeedbackTab } from '@/features/business-panel/components/TeamFeedbackTab'
import { TeamObjectivesTab } from '@/features/business-panel/components/TeamObjectivesTab'
import { OrganizationStylesProvider } from '@/features/business-panel/contexts/OrganizationStylesContext'

interface TeamMember {
  id: string
  user_id: string
  role: 'member' | 'leader' | 'co-leader'
  joined_at: string
  name: string
  email: string
  profile_picture_url: string | null
  isCurrentUser: boolean
}

interface TeamCourse {
  id: string
  course_id: string
  title: string
  slug: string
  thumbnail_url: string | null
  status: string
  assigned_at: string
  due_date: string | null
}

interface TeamData {
  id: string
  slug: string
  name: string
  description: string | null
  image_url: string | null
  status: string
  created_at: string
  leader: {
    id: string
    name: string
    profile_picture_url: string | null
  } | null
  member_count: number
}

interface MembershipData {
  id: string
  role: 'member' | 'leader' | 'co-leader'
  joined_at: string
}

type TabType = 'overview' | 'chat' | 'feedback' | 'objectives' | 'stats'

export default function TeamDetailPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  
  const { user } = useAuth()
  const { effectiveStyles } = useOrganizationStyles()
  const { isOpen: isPanelOpen } = useLiaPanel()
  
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [team, setTeam] = useState<TeamData | null>(null)
  const [membership, setMembership] = useState<MembershipData | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [courses, setCourses] = useState<TeamCourse[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determinar si el usuario es líder
  const isLeader = useMemo(() => {
    return membership?.role === 'leader' || membership?.role === 'co-leader'
  }, [membership])

  // Tabs disponibles según el rol
  const availableTabs = useMemo(() => {
    const baseTabs = [
      { id: 'overview' as const, label: 'Resumen', icon: Users, available: true },
      { id: 'chat' as const, label: 'Chat', icon: MessageSquare, available: true },
      { id: 'feedback' as const, label: 'Feedback', icon: Heart, available: true },
    ]

    if (isLeader) {
      baseTabs.push(
        { id: 'objectives' as const, label: 'Objetivos', icon: Target, available: true },
        { id: 'stats' as const, label: 'Estadísticas', icon: BarChart3, available: true }
      )
    }

    return baseTabs
  }, [isLeader])

  const { resolvedTheme } = useThemeStore()
  const isSystemLightMode = resolvedTheme === 'light'

  const orgColors = useMemo(() => {
    const userDashboardStyles = effectiveStyles?.userDashboard
    // Detectar modo claro basado en el fondo de las tarjetas
    const cardBg = userDashboardStyles?.card_background || (isSystemLightMode ? '#FFFFFF' : '#1E2329')
    const isLightMode = cardBg.toLowerCase() === '#ffffff' || 
                        cardBg.toLowerCase() === '#f8fafc' ||
                        cardBg.toLowerCase().includes('255, 255, 255') ||
                        isSystemLightMode
    
    // Obtener valores base
    let sidebarBg = userDashboardStyles?.sidebar_background || (isLightMode ? '#FFFFFF' : '#0F1419')
    let textColor = userDashboardStyles?.text_color || (isLightMode ? '#1E293B' : '#FFFFFF')
    let borderColor = userDashboardStyles?.border_color || (isLightMode ? '#E2E8F0' : '#334155')

    // LÓGICA DE DETECCIÓN Y CORRECCIÓN DE INCONSISTENCIAS
    // Si las tarjetas son blancas (modo claro)...
    if (isLightMode) {
        // FORZAR fondo claro y texto oscuro para garantizar legibilidad
        // Ignoramos el sidebar_background de la BD si estamos en modo claro para evitar fondos oscuros heredados
        sidebarBg = '#FFFFFF' 
        
        if (textColor.toLowerCase() === '#ffffff' || textColor.toLowerCase() === '#fff') {
            textColor = '#1E293B'
        }
    }

    return {
      primary: userDashboardStyles?.primary_button_color || '#0A2540',
      accent: userDashboardStyles?.accent_color || '#00D4B3',
      cardBg: isLightMode ? '#FFFFFF' : cardBg,
      sidebarBg,
      text: textColor,
      border: borderColor,
      isLightMode,
      textSecondary: isLightMode ? '#64748B' : '#9CA3AF',
      textMuted: isLightMode ? '#94A3B8' : '#6B7280',
      heroBg: isLightMode 
        ? 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 50%, #F8FAFC 100%)'
        : 'linear-gradient(135deg, #0a1628 0%, #0f1e30 50%, #0d1a2a 100%)',
    }
  }, [effectiveStyles, isSystemLightMode])

  const fetchTeamData = useCallback(async () => {
    if (!slug) return
    
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/business-user/teams/${slug}`, {
        credentials: 'include'
      })
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar datos del equipo')
      }

      setTeam(data.team)
      setMembership(data.membership)
      setMembers(data.members || [])
      setCourses(data.courses || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchTeamData()
  }, [fetchTeamData])

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'leader':
        return { label: 'Líder', icon: Crown, color: 'from-yellow-500 to-amber-500' }
      case 'co-leader':
        return { label: 'Co-líder', icon: Star, color: 'from-purple-500 to-pink-500' }
      default:
        return { label: 'Miembro', icon: UserCircle, color: 'from-blue-500 to-cyan-500' }
    }
  }

  const formatDate = (dateStr: string) => {
    if (!mounted) return ''
    return new Date(dateStr).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Prepare team members format for components
  const teamMembersForComponents = useMemo(() => {
    return members.map(m => ({
      user_id: m.user_id,
      user: {
        name: m.name,
        email: m.email
      }
    }))
  }, [members])

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0F1419]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse bg-[#00D4B3]/10 border-2 border-[#00D4B3]/50">
            <Users className="w-8 h-8 text-[#00D4B3]" />
          </div>
          <p className="text-lg text-gray-900 dark:text-white">Cargando información del equipo...</p>
        </div>
      </main>
    )
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-[#0F1419]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 max-w-md text-center p-8 rounded-2xl border border-red-500/20 backdrop-blur-xl bg-gray-50 dark:bg-[#1E2329]"
        >
          <div className="p-4 rounded-full bg-red-500/10">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <div>
            <p className="text-red-400 text-xl font-semibold">Error al cargar equipo</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">{error}</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              onClick={() => router.push('/business-user/teams')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-xl font-medium border border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white"
            >
              Volver a equipos
            </motion.button>
            <motion.button
              onClick={fetchTeamData}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-[#0A2540] to-[#00D4B3] text-white"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </motion.button>
          </div>
        </motion.div>
      </main>
    )
  }

  if (!team) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-white dark:bg-[#0F1419]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 max-w-md text-center p-8 rounded-2xl border border-gray-200 dark:border-white/10 backdrop-blur-xl bg-gray-50 dark:bg-[#0F172A]/80"
        >
          <div className="p-4 rounded-full bg-[#0A2540]/10 dark:bg-[#0A2540]/20">
            <Users className="w-12 h-12 text-[#0A2540] dark:text-[#00D4B3]" />
          </div>
          <div>
            <p className="text-gray-900 dark:text-white text-xl font-semibold">Equipo no encontrado</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              El equipo que buscas no existe o no tienes acceso a él.
            </p>
          </div>
          <motion.button
            onClick={() => router.push('/business-user/teams')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-[#0A2540] to-[#00D4B3] text-white"
          >
            Ver mis equipos
          </motion.button>
        </motion.div>
      </main>
    )
  }

  return (
    <OrganizationStylesProvider>
      <main
        className="min-h-screen transition-all duration-300 bg-white dark:bg-[#0F1419]"
        style={{ paddingRight: isPanelOpen ? `${LIA_PANEL_WIDTH}px` : '0' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
          {/* Back button */}
          <motion.button
            onClick={() => router.push('/business-user/teams')}
            className="flex items-center gap-2 transition-colors mb-8 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            whileHover={{ x: -4 }}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Volver a mis equipos</span>
          </motion.button>

          {/* Team Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl p-8 mb-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0a1628] dark:via-[#0f1e30] dark:to-[#0d1a2a]"
          >
            <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] bg-[#00D4B3]/20" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0A2540] to-[#00D4B3] shadow-lg"
              >
                {team.image_url ? (
                  <Image
                    src={team.image_url}
                    alt={team.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-12 h-12 text-white" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{team.name}</h1>
                  {membership && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${
                        isLeader 
                          ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-500 dark:text-amber-300 border-amber-500/30'
                          : 'bg-[#00D4B3]/10 text-[#00D4B3] border-[#00D4B3]/30'
                      }`}
                    >
                      {isLeader && <Crown className="w-3 h-3" />}
                      {getRoleBadge(membership.role).label}
                    </span>
                  )}
                </div>
                {team.description && (
                  <p className="mb-4 max-w-2xl text-gray-500 dark:text-gray-400">{team.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{team.member_count} miembros</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{courses.length} cursos asignados</span>
                  </div>
                  {membership && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Miembro desde {formatDate(membership.joined_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Role permissions indicator for leaders */}
              {isLeader && (
                <div className="hidden md:flex flex-col gap-1 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-xs font-medium text-amber-500 dark:text-amber-400 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Permisos de líder
                  </span>
                  <span className="text-[10px] text-amber-500/70 dark:text-amber-400/70">
                    Gestiona feedback y objetivos
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            {availableTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap border ${
                    isActive 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </motion.button>
              )
            })}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Members Section */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl border bg-[#00D4B3]/15 border-[#00D4B3]/30">
                      <Users className="w-5 h-5 text-[#00D4B3]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Miembros del Equipo</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{members.length} compañeros</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Sort members: leaders first, then co-leaders, then members */}
                    {[...members]
                      .sort((a, b) => {
                        const roleOrder = { leader: 0, 'co-leader': 1, member: 2 }
                        return (roleOrder[a.role] || 2) - (roleOrder[b.role] || 2)
                      })
                      .map((member, index) => {
                        const roleBadge = getRoleBadge(member.role)
                        const RoleIcon = roleBadge.icon
                        const isMemberLeader = member.role === 'leader'
                        const isCoLeader = member.role === 'co-leader'
                        const hasLeadership = isMemberLeader || isCoLeader

                      return (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`relative p-4 rounded-2xl border transition-all duration-300 ${
                            isMemberLeader 
                              ? 'sm:col-span-2 bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/10' 
                              : isCoLeader
                                ? 'bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/20'
                                : member.isCurrentUser 
                                  ? 'bg-primary/5 dark:bg-primary/10 border-primary/30' 
                                  : 'bg-white dark:bg-[#1E2329] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-white/20'
                          }`}
                        >
                          {/* Leader Crown Badge */}
                          {isMemberLeader && (
                            <div
                              className="absolute -top-2 -left-2 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg"
                              style={{
                                background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
                                color: '#1F2937'
                              }}
                            >
                              <Crown className="w-3.5 h-3.5" />
                              LÍDER DEL EQUIPO
                            </div>
                          )}

                          {/* Co-Leader Badge */}
                          {isCoLeader && (
                            <div
                              className="absolute -top-2 -left-2 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                              style={{
                                background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                                color: 'white'
                              }}
                            >
                              <Star className="w-3 h-3" />
                              Co-líder
                            </div>
                          )}

                          {/* "You" Badge */}
                          {member.isCurrentUser && (
                            <span
                              className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                hasLeadership 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-primary/20 text-primary'
                              }`}
                            >
                              Tú
                            </span>
                          )}

                          <div className={`flex items-center gap-4 ${isMemberLeader ? 'pt-3' : ''}`}>
                            {/* Avatar - Larger for leader */}
                            <div
                              className={`${isMemberLeader ? 'w-16 h-16' : 'w-12 h-12'} rounded-xl flex items-center justify-center overflow-hidden relative`}
                              style={{
                                background: member.profile_picture_url 
                                  ? undefined 
                                  : isMemberLeader
                                    ? 'linear-gradient(135deg, #FCD34D, #F59E0B)'
                                    : `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.accent})`,
                                boxShadow: isMemberLeader ? '0 4px 15px rgba(251, 191, 36, 0.3)' : undefined
                              }}
                            >
                              {member.profile_picture_url ? (
                                <Image
                                  src={member.profile_picture_url}
                                  alt={member.name}
                                  width={isMemberLeader ? 64 : 48}
                                  height={isMemberLeader ? 64 : 48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className={`text-white font-bold ${isMemberLeader ? 'text-xl' : ''}`}>
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                              
                              {/* Crown overlay for leader */}
                              {isMemberLeader && !member.profile_picture_url && (
                                <Crown className="absolute bottom-0 right-0 w-5 h-5 text-white bg-amber-600 rounded-full p-0.5" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p 
                                className={`font-medium truncate ${isMemberLeader ? 'text-lg' : ''}`}
                                style={{ color: orgColors.text }}
                              >
                                {member.name}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <RoleIcon 
                                  className={`${isMemberLeader ? 'w-4 h-4' : 'w-3 h-3'}`} 
                                  style={{ 
                                    color: isMemberLeader ? '#FCD34D' : isCoLeader ? '#A855F7' : orgColors.accent 
                                  }} 
                                />
                                <span 
                                  className={`${isMemberLeader ? 'text-sm font-medium' : 'text-xs'}`} 
                                  style={{ 
                                    color: isMemberLeader ? '#FCD34D' : isCoLeader ? '#A855F7' : orgColors.textSecondary 
                                  }}
                                >
                                  {roleBadge.label}
                                </span>
                              </div>
                              
                              {/* Extra info for leader */}
                              {isMemberLeader && (
                                <p className="text-xs text-amber-400/60 mt-1">
                                  Responsable del equipo y objetivos
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Courses Section */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="p-2 rounded-xl border"
                      style={{
                        background: `linear-gradient(135deg, ${orgColors.primary}25, ${orgColors.primary}08)`,
                        borderColor: `${orgColors.primary}30`
                      }}
                    >
                      <GraduationCap className="w-5 h-5" style={{ color: orgColors.primary }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: orgColors.text }}>Cursos del Equipo</h2>
                      <p className="text-sm" style={{ color: orgColors.textSecondary }}>{courses.length} asignados</p>
                    </div>
                  </div>

                  {courses.length === 0 ? (
                    <div
                      className="p-6 rounded-2xl border text-center"
                      style={{
                        backgroundColor: orgColors.cardBg,
                        borderColor: orgColors.border
                      }}
                    >
                      <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: orgColors.textMuted }} />
                      <p className="text-sm" style={{ color: orgColors.textSecondary }}>No hay cursos asignados al equipo</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {courses.map((course, index) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => course.slug && router.push(`/courses/${course.slug}/learn`)}
                          className="group p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-md"
                          style={{
                            backgroundColor: orgColors.cardBg,
                            borderColor: orgColors.border
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                              style={{
                                background: course.thumbnail_url ? undefined : `linear-gradient(135deg, ${orgColors.primary}50, ${orgColors.accent}50)`
                              }}
                            >
                              {course.thumbnail_url ? (
                                <Image
                                  src={course.thumbnail_url}
                                  alt={course.title}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <BookOpen className="w-5 h-5 text-white" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p 
                                className="font-medium text-sm truncate transition-colors"
                                style={{ color: orgColors.text }}
                              >
                                {course.title}
                              </p>
                              {course.due_date && (
                                <div className="flex items-center gap-1 mt-1">
                                    <Clock className="w-3 h-3" style={{ color: orgColors.textMuted }} />
                                    <span className="text-xs" style={{ color: orgColors.textMuted }}>
                                    Fecha límite: {formatDate(course.due_date)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'chat' && team && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TeamChatTab
                  teamId={team.id}
                  teamName={team.name}
                  teamImageUrl={team.image_url}
                />
              </motion.div>
            )}

            {activeTab === 'feedback' && team && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Permission notice for members */}
                {!isLeader && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl border flex items-center gap-3"
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderColor: 'rgba(59, 130, 246, 0.2)'
                    }}
                  >
                    <Lock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-blue-400 font-medium text-sm">Modo solo lectura</p>
                      <p className="text-blue-400/70 text-xs">
                        Solo puedes ver los feedbacks que has recibido. Los líderes del equipo pueden dar feedback.
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {isLeader ? (
                  <TeamFeedbackTab
                    teamId={team.id}
                    teamMembers={teamMembersForComponents}
                  />
                ) : (
                  // Read-only feedback view for members
                  <MemberFeedbackView teamId={team.id} userId={user?.id || ''} orgColors={orgColors} />
                )}
              </motion.div>
            )}

            {activeTab === 'objectives' && team && isLeader && (
              <motion.div
                key="objectives"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TeamObjectivesTab teamId={team.id} />
              </motion.div>
            )}

            {activeTab === 'stats' && team && isLeader && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <TeamStatsView 
                  teamId={team.id} 
                  members={members} 
                  courses={courses}
                  orgColors={orgColors} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </OrganizationStylesProvider>
  )
}

// Component for members to view only their received feedback
function MemberFeedbackView({ teamId, userId, orgColors }: { 
  teamId: string
  userId: string
  orgColors: any
}) {
  const [feedback, setFeedback] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMyFeedback = async () => {
      try {
        const { TeamsService } = await import('@/features/business-panel/services/teams.service')
        const allFeedback = await TeamsService.getTeamFeedback(teamId)
        // Only show feedback received by this user
        const myFeedback = allFeedback.filter((fb: any) => fb.to_user_id === userId)
        setFeedback(myFeedback)
      } catch (error) {
        console.error('Error fetching feedback:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (userId) {
      fetchMyFeedback()
    }
  }, [teamId, userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${orgColors.accent}40`, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (feedback.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="w-16 h-16 mx-auto mb-4" style={{ color: `${orgColors.primary}40` }} />
        <h3 className="text-xl font-bold text-white mb-2">No tienes feedback aún</h3>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Cuando tus líderes te den feedback, aparecerá aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: orgColors.text }}>
        <Heart className="w-5 h-5" style={{ color: orgColors.accent }} />
        Tu Feedback Recibido
        <span className="text-sm font-normal" style={{ color: orgColors.textSecondary }}>({feedback.length})</span>
      </h2>
      
      {feedback.map((fb, index) => (
        <motion.div
          key={fb.feedback_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: orgColors.cardBg, borderColor: orgColors.border }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${orgColors.primary}30, ${orgColors.accent}20)` }}
            >
              <Award className="w-6 h-6" style={{ color: orgColors.accent }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium" style={{ color: orgColors.text }}>
                  {fb.is_anonymous ? 'Anónimo' : fb.from_user?.name || 'Líder'}
                </span>
                {fb.rating && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm" style={{ color: orgColors.textSecondary }}>{fb.content}</p>
              <p className="text-xs mt-2" style={{ color: orgColors.textMuted }}>
                {new Date(fb.created_at).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Stats view for leaders
function TeamStatsView({ teamId, members, courses, orgColors }: {
  teamId: string
  members: TeamMember[]
  courses: TeamCourse[]
  orgColors: any
}) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading stats
    const timer = setTimeout(() => {
      setStats({
        totalMembers: members.length,
        leaders: members.filter(m => m.role === 'leader' || m.role === 'co-leader').length,
        coursesAssigned: courses.length,
        avgCompletion: 67 // This would come from API
      })
      setLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [members, courses])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${orgColors.accent}40`, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Miembros', value: stats.totalMembers, icon: Users, color: orgColors.accent },
    { label: 'Líderes', value: stats.leaders, icon: Crown, color: '#FCD34D' },
    { label: 'Cursos Asignados', value: stats.coursesAssigned, icon: BookOpen, color: orgColors.primary },
    { label: 'Progreso Promedio', value: `${stats.avgCompletion}%`, icon: TrendingUp, color: '#10B981' },
  ]

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: orgColors.text }}>
        <BarChart3 className="w-5 h-5" style={{ color: orgColors.accent }} />
        Estadísticas del Equipo
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
              <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-5 rounded-2xl border"
              style={{ backgroundColor: orgColors.cardBg, borderColor: orgColors.border }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="p-2 rounded-xl"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: orgColors.text }}>{stat.value}</p>
              <p className="text-sm" style={{ color: orgColors.textSecondary }}>{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Member Progress Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: orgColors.cardBg, borderColor: orgColors.border }}
      >
        <div className="p-5 border-b" style={{ borderColor: orgColors.border }}>
          <h3 className="text-lg font-bold" style={{ color: orgColors.text }}>Progreso de Miembros</h3>
        </div>
        <div className="divide-y" style={{ borderColor: orgColors.border }}>
          {members.map((member, index) => {
            const progress = Math.floor(Math.random() * 40) + 60 // Simulated - would come from API
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 flex items-center gap-4"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{
                    background: member.profile_picture_url ? undefined : `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.accent})`
                  }}
                >
                  {member.profile_picture_url ? (
                    <Image
                      src={member.profile_picture_url}
                      alt={member.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: orgColors.text }}>{member.name}</p>
                  <p className="text-xs" style={{ color: orgColors.textSecondary }}>{member.role === 'leader' ? 'Líder' : member.role === 'co-leader' ? 'Co-líder' : 'Miembro'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${orgColors.accent}, ${orgColors.primary})`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right" style={{ color: orgColors.text }}>{progress}%</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
