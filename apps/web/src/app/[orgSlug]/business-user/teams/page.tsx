'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import {
  Users,
  UserCircle,
  Crown,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useOrganizationStyles } from '@/features/business-panel/hooks/useOrganizationStyles'
import { useLiaPanel } from '@/core/contexts/LiaPanelContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { LIA_PANEL_WIDTH } from '@/core/components/LiaSidePanel'

interface TeamSummary {
  id: string
  slug: string
  name: string
  description: string | null
  image_url: string | null
  status: string
  created_at: string
  member_count: number
  my_role: 'member' | 'leader' | 'co-leader'
  joined_at: string
  leader: {
    id: string
    name: string
    profile_picture_url: string | null
  } | null
}

export default function MyTeamsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { effectiveStyles } = useOrganizationStyles()
  const { isOpen: isPanelOpen } = useLiaPanel()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<TeamSummary[]>([])

  // Colores personalizados con detección de modo
  const { resolvedTheme } = useThemeStore()
  const isSystemLightMode = resolvedTheme === 'light'
  
  const orgColors = useMemo(() => {
    const userDashboardStyles = effectiveStyles?.userDashboard
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
    }
  }, [effectiveStyles, isSystemLightMode])

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/business-user/my-team', {
        credentials: 'include'
      })
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar equipos')
      }

      setTeams(data.teams || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

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

  // Loading state
  if (loading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: orgColors.sidebarBg }}
      >
        <div className="flex flex-col items-center gap-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${orgColors.primary}15, ${orgColors.accent}15)`,
              border: `2px solid ${orgColors.accent}50`
            }}
          >
            <Users className="w-8 h-8" style={{ color: orgColors.accent }} />
          </div>
          <p className="text-lg" style={{ color: orgColors.text }}>Cargando tus equipos...</p>
        </div>
      </main>
    )
  }

  // Error state
  if (error) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: orgColors.sidebarBg }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 max-w-md text-center p-8 rounded-2xl border border-red-500/20 backdrop-blur-xl"
          style={{ backgroundColor: orgColors.cardBg }}
        >
          <div className="p-4 rounded-full bg-red-500/10">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <div>
            <p className="text-red-400 text-xl font-semibold">Error al cargar equipos</p>
            <p className="text-sm mt-2" style={{ color: orgColors.textSecondary }}>{error}</p>
          </div>
          <motion.button
            onClick={fetchTeams}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium"
            style={{
              background: `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.accent})`,
              color: '#FFFFFF'
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </motion.button>
        </motion.div>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen transition-all duration-300"
      style={{
        background: orgColors.sidebarBg,
        paddingRight: isPanelOpen ? `${LIA_PANEL_WIDTH}px` : '0'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
        {/* Back button */}
        <motion.button
          onClick={() => router.push(`/${params.orgSlug}/business-user/dashboard`)}
          className="flex items-center gap-2 transition-colors mb-8"
          style={{ color: orgColors.textSecondary }}
          whileHover={{ x: -4, color: orgColors.text }}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Volver al dashboard</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div
              className="p-3 rounded-xl border"
              style={{
                background: `linear-gradient(135deg, ${orgColors.accent}25, ${orgColors.accent}08)`,
                borderColor: `${orgColors.accent}30`
              }}
            >
              <Users className="w-7 h-7" style={{ color: orgColors.accent }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: orgColors.text }}>Mis Equipos</h1>
              <p className="text-sm mt-1" style={{ color: orgColors.textSecondary }}>
                {teams.length === 0 
                  ? 'No perteneces a ningún equipo aún'
                  : `Perteneces a ${teams.length} equipo${teams.length > 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* No teams state */}
        {teams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl backdrop-blur-xl p-12 text-center"
            style={{ 
              backgroundColor: orgColors.cardBg,
              border: `1px solid ${orgColors.border}`
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${orgColors.primary}15, transparent 60%)`
              }}
            />

            <div className="relative z-10">
              <div
                className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border"
                style={{
                  background: `linear-gradient(135deg, ${orgColors.primary}25, ${orgColors.primary}08)`,
                  borderColor: `${orgColors.primary}30`
                }}
              >
                <Users className="w-10 h-10" style={{ color: orgColors.primary }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: orgColors.text }}>No perteneces a ningún equipo</h3>
              <p className="max-w-md mx-auto" style={{ color: orgColors.textSecondary }}>
                Tu administrador puede asignarte a un equipo de trabajo. Los equipos te permiten colaborar con otros compañeros y compartir objetivos de aprendizaje.
              </p>
            </div>
          </motion.div>
        ) : (
          /* Teams Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team, index) => {
              const roleBadge = getRoleBadge(team.my_role)
              const RoleIcon = roleBadge.icon

              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/${params.orgSlug}/business-user/teams/${team.slug}`)}
                  className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl"
                  style={{
                    backgroundColor: orgColors.cardBg,
                    border: `1px solid ${orgColors.border}`
                  }}
                  whileHover={{ y: -4, borderColor: `${orgColors.accent}50` }}
                >
                  {/* Team Image or Gradient */}
                  <div
                    className="h-32 relative overflow-hidden"
                    style={{
                      background: team.image_url ? undefined : `linear-gradient(135deg, ${orgColors.primary}80, ${orgColors.accent}60)`
                    }}
                  >
                    {team.image_url && (
                      <Image
                        src={team.image_url}
                        alt={team.name}
                        fill
                        className="object-cover"
                      />
                    )}
                    
                    {/* Role Badge */}
                    <div
                      className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{
                        background: `linear-gradient(135deg, ${orgColors.accent}90, ${orgColors.primary}90)`,
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      <RoleIcon className="w-3 h-3" />
                      <span>{roleBadge.label}</span>
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>

                  {/* Team Info */}
                  <div className="p-5">
                    <h3 
                      className="text-lg font-bold mb-1 transition-colors"
                      style={{ color: orgColors.text }}
                    >
                      {team.name}
                    </h3>
                    
                    {team.description && (
                      <p className="text-sm line-clamp-2 mb-4" style={{ color: orgColors.textSecondary }}>
                        {team.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm" style={{ color: orgColors.textSecondary }}>
                        <Users className="w-4 h-4" />
                        <span>{team.member_count} miembros</span>
                      </div>

                      <div
                        className="flex items-center gap-1 text-sm font-medium group-hover:translate-x-1 transition-transform"
                        style={{ color: orgColors.accent }}
                      >
                        <span>Ver equipo</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Leader info */}
                    {team.leader && (
                      <div className="mt-4 pt-4 border-t" style={{ borderColor: orgColors.border }}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden"
                            style={{
                              background: team.leader.profile_picture_url ? undefined : `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.accent})`
                            }}
                          >
                            {team.leader.profile_picture_url ? (
                              <Image
                                src={team.leader.profile_picture_url}
                                alt={team.leader.name}
                                width={24}
                                height={24}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Crown className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="text-xs" style={{ color: orgColors.textMuted }}>
                            Liderado por <span style={{ color: orgColors.textSecondary }}>{team.leader.name}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
