'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  UsersRound, 
  Search,
  Filter,
  Plus,
  User,
  BookOpen,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { useTeams } from '@/features/business-panel/hooks/useTeams'
import { Button } from '@aprende-y-aplica/ui'
import { useRouter } from 'next/navigation'
import { useOrganizationStylesContext } from '@/features/business-panel/contexts/OrganizationStylesContext'
import { BusinessTeamModal } from '@/features/business-panel/components/BusinessTeamModal'
import { WorkTeam } from '@/features/business-panel/services/teams.service'

// Componente para el icono del equipo con manejo de errores
function TeamIcon({ 
  imageUrl, 
  teamName, 
  primaryColor, 
  cardBorder 
}: { 
  imageUrl?: string | null
  teamName: string
  primaryColor: string
  cardBorder: string
}) {
  const [imageError, setImageError] = useState(false)
  
  // Si hay una URL válida y no hay error, mostrar la imagen
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '' && !imageError) {
    return (
      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border" style={{ borderColor: cardBorder }}>
        <img
          src={imageUrl}
          alt={teamName}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Error cargando imagen del equipo:', teamName, imageUrl, e)
            setImageError(true)
          }}
          onLoad={() => {
            console.log('Imagen cargada exitosamente para:', teamName)
          }}
        />
      </div>
    )
  }
  
  return (
    <div 
      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: `${primaryColor}20` }}
    >
      <UsersRound className="w-6 h-6" style={{ color: primaryColor }} />
    </div>
  )
}

export default function BusinessPanelTeamsPage() {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { teams, isLoading, error, refetch } = useTeams()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const router = useRouter()

  // Aplicar colores personalizados
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'

  // Filtrar equipos
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = searchTerm === '' || 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.team_leader?.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filterStatus === 'all' || team.status === filterStatus

      return matchesSearch && matchesStatus
    })
  }, [teams, searchTerm, filterStatus])

  // Estadísticas
  const stats = useMemo(() => {
    const totalTeams = teams.length
    const activeTeams = teams.filter(t => t.status === 'active').length
    const totalMembers = teams.reduce((sum, t) => sum + (t.member_count || 0), 0)
    const activeMembers = teams.reduce((sum, t) => sum + (t.active_member_count || 0), 0)

    return {
      totalTeams,
      activeTeams,
      totalMembers,
      activeMembers
    }
  }, [teams])

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    refetch()
  }

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen"
        style={{ color: textColor }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
          <p className="font-body">Cargando equipos...</p>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <div className="p-6" style={{ color: textColor }}>
        <div 
          className="p-4 rounded-xl border"
          style={{ 
            backgroundColor: cardBg,
            borderColor: cardBorder
          }}
        >
          <p className="font-body text-red-400">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6" style={{ color: textColor }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold font-heading mb-2">Equipos de Trabajo</h1>
          <p className="text-sm font-body opacity-70">Gestiona y organiza equipos de trabajo para asignar cursos y objetivos</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          variant="gradient"
          size="lg"
          className="font-body"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
            boxShadow: `0 4px 14px 0 ${primaryColor}40`
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Crear Equipo
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body opacity-70 mb-1">Total Equipos</p>
              <p className="text-2xl font-bold font-heading">{stats.totalTeams}</p>
            </div>
            <UsersRound className="w-8 h-8 opacity-50" style={{ color: primaryColor }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body opacity-70 mb-1">Equipos Activos</p>
              <p className="text-2xl font-bold font-heading">{stats.activeTeams}</p>
            </div>
            <TrendingUp className="w-8 h-8 opacity-50" style={{ color: primaryColor }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body opacity-70 mb-1">Total Miembros</p>
              <p className="text-2xl font-bold font-heading">{stats.totalMembers}</p>
            </div>
            <User className="w-8 h-8 opacity-50" style={{ color: primaryColor }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body opacity-70 mb-1">Miembros Activos</p>
              <p className="text-2xl font-bold font-heading">{stats.activeMembers}</p>
            </div>
            <Calendar className="w-8 h-8 opacity-50" style={{ color: primaryColor }} />
          </div>
        </motion.div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 opacity-50" />
          <input
            type="text"
            placeholder="Buscar equipos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border backdrop-blur-sm font-body"
            style={{ 
              backgroundColor: cardBg,
              borderColor: cardBorder,
              color: textColor
            }}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-xl border backdrop-blur-sm font-body"
            style={{ 
              backgroundColor: cardBg,
              borderColor: cardBorder,
              color: textColor
            }}
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="archived">Archivados</option>
          </select>
        </div>
      </div>

      {/* Lista de Equipos */}
      {filteredTeams.length === 0 ? (
        <div 
          className="p-12 rounded-2xl border text-center backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <UsersRound className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-heading mb-2">No hay equipos</p>
          <p className="text-sm font-body opacity-70 mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'No se encontraron equipos con los filtros aplicados'
              : 'Crea tu primer equipo para comenzar'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="gradient"
              className="font-body"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
                boxShadow: `0 4px 14px 0 ${primaryColor}40`
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Crear Equipo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team, index) => {
            // Debug temporal - verificar datos del equipo
            if (index === 0) {
              console.log('Primer equipo - Datos completos:', team)
              console.log('image_url:', team.image_url)
              console.log('metadata:', team.metadata)
            }
            
            return (
            <motion.div
              key={team.team_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => router.push(`/business-panel/teams/${team.team_id}`)}
              className="p-5 rounded-2xl border cursor-pointer hover:scale-[1.02] transition-all backdrop-blur-sm"
              style={{ 
                backgroundColor: cardBg,
                borderColor: cardBorder
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <TeamIcon 
                    imageUrl={(team as any).image_url || (team.metadata as any)?.image_url || null} 
                    teamName={team.name}
                    primaryColor={primaryColor}
                    cardBorder={cardBorder}
                  />
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-1">{team.name}</h3>
                    {team.team_leader && (
                      <p className="text-xs font-body opacity-70 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {team.team_leader.name}
                      </p>
                    )}
                  </div>
                </div>
                <span 
                  className={`px-2 py-1 rounded-lg text-xs font-body ${
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
                <p className="text-sm font-body opacity-70 mb-4 line-clamp-2">
                  {team.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm font-body">
                <div className="flex items-center gap-1">
                  <UsersRound className="w-4 h-4 opacity-50" />
                  <span>{team.member_count || 0} miembros</span>
                </div>
                {team.course && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4 opacity-50" />
                    <span className="truncate max-w-[100px]">{team.course.title}</span>
                  </div>
                )}
              </div>
            </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal de Crear Equipo */}
      <BusinessTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}



