'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
  TrendingUp
} from 'lucide-react'
import { TeamsService, WorkTeam, WorkTeamMember } from '@/features/business-panel/services/teams.service'
import { Button } from '@aprende-y-aplica/ui'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { TeamCoursesTab } from '@/features/business-panel/components/TeamCoursesTab'
import { TeamObjectivesTab } from '@/features/business-panel/components/TeamObjectivesTab'
import { TeamChatTab } from '@/features/business-panel/components/TeamChatTab'
import { TeamFeedbackTab } from '@/features/business-panel/components/TeamFeedbackTab'
import { TeamAnalyticsTab } from '@/features/business-panel/components/TeamAnalyticsTab'

type TabType = 'resumen' | 'cursos' | 'objetivos' | 'conversacion' | 'retroalimentacion' | 'analytics'

export default function BusinessTeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel

  const [team, setTeam] = useState<WorkTeam | null>(null)
  const [teamMembers, setTeamMembers] = useState<WorkTeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('resumen')

  // Aplicar colores personalizados
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [teamData, members] = await Promise.all([
          TeamsService.getTeam(teamId),
          TeamsService.getTeamMembers(teamId)
        ])
        setTeam(teamData)
        setTeamMembers(members)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el equipo')
        console.error('Error fetching team:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (teamId) {
      fetchTeam()
    }
  }, [teamId])

  const tabs = [
    { id: 'resumen' as TabType, label: 'Resumen', icon: UsersRound },
    { id: 'cursos' as TabType, label: 'Cursos', icon: BookOpen },
    { id: 'objetivos' as TabType, label: 'Objetivos', icon: Target },
    { id: 'conversacion' as TabType, label: 'Conversación', icon: MessageSquare },
    { id: 'retroalimentacion' as TabType, label: 'Retroalimentación', icon: Heart },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ color: textColor }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
          <p className="font-body">Cargando equipo...</p>
        </div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="p-6" style={{ color: textColor }}>
        <Button
          variant="secondary"
          onClick={() => router.push('/business-panel/teams')}
          className="mb-4 font-body"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Equipos
        </Button>
        <div 
          className="p-4 rounded-xl border"
          style={{ 
            backgroundColor: cardBg,
            borderColor: cardBorder
          }}
        >
          <p className="font-body text-red-400">Error: {error || 'Equipo no encontrado'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6" style={{ color: textColor }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="secondary"
          onClick={() => router.push('/business-panel/teams')}
          className="font-body"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-semibold font-heading mb-2">{team.name}</h1>
          {team.description && (
            <p className="text-sm font-body opacity-70">{team.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ borderColor: cardBorder }}>
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 font-body text-sm font-medium transition-all
                  border-b-2 relative
                  ${isActive ? '' : 'opacity-70 hover:opacity-100'}
                `}
                style={{
                  borderBottomColor: isActive ? primaryColor : 'transparent',
                  color: isActive ? textColor : `${textColor}CC`
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: primaryColor }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'resumen' && (
          <div className="space-y-6">
            {/* Información General */}
            <div 
              className="p-6 rounded-2xl border backdrop-blur-sm"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <h2 className="text-xl font-heading font-semibold mb-4">Información General</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-body opacity-70 mb-1">Estado</p>
                  <span 
                    className={`px-3 py-1 rounded-lg text-sm font-body inline-block ${
                      team.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      team.status === 'inactive' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {team.status === 'active' ? 'Activo' :
                     team.status === 'inactive' ? 'Inactivo' : 'Archivado'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-body opacity-70 mb-1">Miembros</p>
                  <p className="text-lg font-heading font-semibold">{team.member_count || 0} miembros</p>
                </div>
                {team.team_leader && (
                  <div>
                    <p className="text-sm font-body opacity-70 mb-1">Líder del Equipo</p>
                    <div className="flex items-center gap-2">
                      {team.team_leader.profile_picture_url ? (
                        <img 
                          src={team.team_leader.profile_picture_url} 
                          alt="" 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${primaryColor}30` }}
                        >
                          <User className="w-4 h-4" style={{ color: primaryColor }} />
                        </div>
                      )}
                      <p className="font-body">{team.team_leader.name}</p>
                    </div>
                  </div>
                )}
                {team.course && (
                  <div>
                    <p className="text-sm font-body opacity-70 mb-1">Curso Asociado</p>
                    <p className="font-body">{team.course.title}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div 
                className="p-4 rounded-2xl border backdrop-blur-sm"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-body opacity-70 mb-1">Miembros Activos</p>
                    <p className="text-2xl font-bold font-heading">{team.active_member_count || 0}</p>
                  </div>
                  <UsersRound className="w-8 h-8 opacity-50" style={{ color: primaryColor }} />
                </div>
              </div>
              <div 
                className="p-4 rounded-2xl border backdrop-blur-sm"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-body opacity-70 mb-1">Total Miembros</p>
                    <p className="text-2xl font-bold font-heading">{team.member_count || 0}</p>
                  </div>
                  <User className="w-8 h-8 opacity-50" style={{ color: primaryColor }} />
                </div>
              </div>
              <div 
                className="p-4 rounded-2xl border backdrop-blur-sm"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-body opacity-70 mb-1">Creado</p>
                    <p className="text-sm font-body">
                      {new Date(team.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 opacity-50" style={{ color: primaryColor }} />
                </div>
              </div>
            </div>
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
          <TeamChatTab teamId={teamId} />
        )}

        {activeTab === 'retroalimentacion' && (
          <TeamFeedbackTab teamId={teamId} teamMembers={teamMembers} />
        )}

        {activeTab === 'analytics' && (
          <TeamAnalyticsTab teamId={teamId} />
        )}
      </div>
    </div>
  )
}

