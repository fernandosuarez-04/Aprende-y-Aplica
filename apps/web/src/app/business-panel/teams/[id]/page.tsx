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
  TrendingUp,
  Edit,
  Trash2,
  Mail,
  Briefcase,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { TeamsService, WorkTeam, WorkTeamMember } from '@/features/business-panel/services/teams.service'
import { Button } from '@aprende-y-aplica/ui'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { TeamCoursesTab } from '@/features/business-panel/components/TeamCoursesTab'
import { TeamObjectivesTab } from '@/features/business-panel/components/TeamObjectivesTab'
import { TeamChatTab } from '@/features/business-panel/components/TeamChatTab'
import { TeamFeedbackTab } from '@/features/business-panel/components/TeamFeedbackTab'
import { TeamAnalyticsTab } from '@/features/business-panel/components/TeamAnalyticsTab'
import { BusinessTeamModal } from '@/features/business-panel/components/BusinessTeamModal'

type TabType = 'resumen' | 'cursos' | 'objetivos' | 'conversacion' | 'retroalimentacion' | 'analytics'

export default function BusinessTeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel

  const [team, setTeam] = useState<WorkTeam | null>(null)
  const [teamMembers, setTeamMembers] = useState<WorkTeamMember[]>([])
  const [teamCourses, setTeamCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('resumen')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Aplicar colores personalizados
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'

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

  const handleDeleteTeam = async () => {
    if (!team) return
    
    const confirmed = confirm(
      `¿Estás seguro de que deseas eliminar el equipo "${team.name}"?\n\nEsta acción no se puede deshacer y eliminará todos los datos asociados al equipo.`
    )
    
    if (!confirmed) return

    try {
      setIsDeleting(true)
      await TeamsService.deleteTeam(teamId)
      router.push('/business-panel/teams')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el equipo')
      setIsDeleting(false)
    }
  }

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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-heading font-semibold">Información General</h2>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    className="font-body"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDeleteTeam}
                    disabled={isDeleting}
                    className="font-body"
                    style={{ 
                      backgroundColor: 'rgba(220, 38, 38, 0.2)',
                      borderColor: 'rgba(220, 38, 38, 0.3)',
                      color: '#ef4444'
                    }}
                  >
                    {isDeleting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-body opacity-70 mb-2">Nombre del Equipo</p>
                  <p className="text-lg font-heading font-semibold">{team.name}</p>
                </div>
                <div>
                  <p className="text-sm font-body opacity-70 mb-2">Estado</p>
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
                {team.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-body opacity-70 mb-2">Descripción</p>
                    <p className="font-body">{team.description}</p>
                  </div>
                )}
                {team.team_leader && (
                  <div>
                    <p className="text-sm font-body opacity-70 mb-2">Líder del Equipo</p>
                    <div className="flex items-center gap-3">
                      {team.team_leader.profile_picture_url ? (
                        <img 
                          src={team.team_leader.profile_picture_url} 
                          alt="" 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${primaryColor}30` }}
                        >
                          <User className="w-5 h-5" style={{ color: primaryColor }} />
                        </div>
                      )}
                      <div>
                        <p className="font-body font-medium">{team.team_leader.name}</p>
                        {team.team_leader.email && (
                          <p className="text-xs font-body opacity-70 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {team.team_leader.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-body opacity-70 mb-2">Fecha de Creación</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 opacity-50" />
                    <p className="font-body">
                      {new Date(team.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {team.updated_at && team.updated_at !== team.created_at && (
                  <div>
                    <p className="text-sm font-body opacity-70 mb-2">Última Actualización</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 opacity-50" />
                      <p className="font-body">
                        {new Date(team.updated_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
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
                    <p className="text-sm font-body opacity-70 mb-1">Cursos Asignados</p>
                    <p className="text-2xl font-bold font-heading">{teamCourses.length}</p>
                  </div>
                  <BookOpen className="w-8 h-8 opacity-50" style={{ color: primaryColor }} />
                </div>
              </div>
            </div>

            {/* Lista de Miembros */}
            {teamMembers.length > 0 && (
              <div 
                className="p-6 rounded-2xl border backdrop-blur-sm"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <h3 className="text-lg font-heading font-semibold mb-4">Miembros del Equipo ({teamMembers.length})</h3>
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-xl border"
                      style={{ 
                        backgroundColor: `${cardBg}CC`,
                        borderColor: cardBorder
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {member.user?.profile_picture_url ? (
                          <img 
                            src={member.user.profile_picture_url} 
                            alt="" 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${primaryColor}30` }}
                          >
                            <User className="w-5 h-5" style={{ color: primaryColor }} />
                          </div>
                        )}
                        <div>
                          <p className="font-body font-medium">{member.user?.name || member.user?.email || 'Usuario'}</p>
                          {member.user?.email && (
                            <p className="text-xs font-body opacity-70 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {member.user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span 
                          className={`px-2 py-1 rounded-lg text-xs font-body ${
                            member.role === 'leader' ? 'bg-blue-500/20 text-blue-400' :
                            member.role === 'co-leader' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {member.role === 'leader' ? 'Líder' :
                           member.role === 'co-leader' ? 'Co-Líder' : 'Miembro'}
                        </span>
                        <span 
                          className={`px-2 py-1 rounded-lg text-xs font-body ${
                            member.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {member.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cursos Asignados */}
            {teamCourses.length > 0 && (
              <div 
                className="p-6 rounded-2xl border backdrop-blur-sm"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                <h3 className="text-lg font-heading font-semibold mb-4">Cursos Asignados ({teamCourses.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamCourses.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-4 rounded-xl border"
                      style={{ 
                        backgroundColor: `${cardBg}CC`,
                        borderColor: cardBorder
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <BookOpen className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-medium mb-1 truncate">
                            {assignment.course?.title || 'Curso desconocido'}
                          </p>
                          <div className="flex items-center gap-3 text-xs font-body opacity-70">
                            {assignment.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Vence: {new Date(assignment.due_date).toLocaleDateString('es-ES')}</span>
                              </div>
                            )}
                            <span 
                              className={`px-2 py-0.5 rounded ${
                                assignment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                assignment.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {assignment.status === 'completed' ? 'Completado' :
                               assignment.status === 'in_progress' ? 'En Progreso' : 'Asignado'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
          <TeamChatTab teamId={teamId} />
        )}

        {activeTab === 'retroalimentacion' && (
          <TeamFeedbackTab teamId={teamId} teamMembers={teamMembers} />
        )}

        {activeTab === 'analytics' && (
          <TeamAnalyticsTab teamId={teamId} />
        )}
      </div>

      {/* Modal de Editar Equipo */}
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

