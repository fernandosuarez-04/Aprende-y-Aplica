'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, Plus, Calendar, TrendingUp, CheckCircle2, XCircle, Clock, Edit, Trash2 } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, WorkTeamObjective } from '../services/teams.service'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TeamObjectiveModal } from './TeamObjectiveModal'

interface TeamObjectivesTabProps {
  teamId: string
}

export function TeamObjectivesTab({ teamId }: TeamObjectivesTabProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'

  const [objectives, setObjectives] = useState<WorkTeamObjective[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingObjective, setEditingObjective] = useState<WorkTeamObjective | null>(null)

  useEffect(() => {
    fetchObjectives()
  }, [teamId])

  const fetchObjectives = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const fetchedObjectives = await TeamsService.getTeamObjectives(teamId)
      setObjectives(fetchedObjectives)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar objetivos')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'bg-green-500/20 text-green-400'
      case 'failed':
        return 'bg-red-500/20 text-red-400'
      case 'in_progress':
        // Usar el color primario personalizado de la organización
        return ''
      default:
        return 'bg-yellow-500/20 text-yellow-400'
    }
  }
  
  const getStatusStyle = (status: string): React.CSSProperties => {
    if (status === 'in_progress') {
      return {
        backgroundColor: `${primaryColor}20`,
        color: primaryColor
      }
    }
    return {}
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'Logrado'
      case 'failed':
        return 'Fallido'
      case 'in_progress':
        return 'En Progreso'
      default:
        return 'Pendiente'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" style={{ color: textColor }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: primaryColor }}></div>
          <p className="text-sm font-body">Cargando objetivos...</p>
        </div>
      </div>
    )
  }

  // Preparar datos para gráfico de progreso
  const chartData = objectives.map(obj => ({
    name: obj.title.length > 15 ? obj.title.substring(0, 15) + '...' : obj.title,
    objetivo: obj.target_value,
    actual: obj.current_value,
    progreso: obj.progress_percentage || 0
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-semibold mb-1" style={{ color: textColor }}>
            Objetivos del Equipo
          </h2>
          <p className="text-sm font-body opacity-70">
            {objectives.length} objetivo(s) definido(s)
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingObjective(null)
            setIsModalOpen(true)
          }}
          variant="gradient"
          size="lg"
          className="font-body"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
            boxShadow: `0 4px 14px 0 ${primaryColor}40`
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Crear Objetivo
        </Button>
      </div>

      {error && (
        <div 
          className="p-4 rounded-xl border text-red-400"
          style={{ backgroundColor: cardBg, borderColor: 'rgba(220, 38, 38, 0.3)' }}
        >
          <p className="font-body text-sm">{error}</p>
        </div>
      )}

      {/* Gráfico de Progreso */}
      {objectives.length > 0 && (
        <div 
          className="p-6 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Progreso de Objetivos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} />
              <XAxis 
                dataKey="name" 
                stroke={textColor}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={textColor}
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: cardBg, 
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '8px',
                  color: textColor
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="objetivo" 
                stroke={primaryColor} 
                strokeWidth={2}
                name="Objetivo"
                dot={{ fill: primaryColor }}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Actual"
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lista de Objetivos */}
      {objectives.length === 0 ? (
        <div 
          className="p-12 rounded-2xl border text-center backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <Target className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-heading mb-2">No hay objetivos definidos</p>
          <p className="text-sm font-body opacity-70 mb-4">
            Crea objetivos para medir el progreso del equipo
          </p>
          <Button
            onClick={() => {
              setEditingObjective(null)
              setIsModalOpen(true)
            }}
            variant="gradient"
            className="font-body"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${panelStyles?.secondary_button_color || '#8b5cf6'} 100%)`,
              boxShadow: `0 4px 14px 0 ${primaryColor}40`
            }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Crear Primer Objetivo
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {objectives.map((objective, index) => (
            <motion.div
              key={objective.objective_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 rounded-2xl border backdrop-blur-sm"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-5 h-5" style={{ color: primaryColor }} />
                    <h3 className="font-heading font-semibold text-lg">{objective.title}</h3>
                    <span 
                      className={`px-2 py-1 rounded-lg text-xs font-body ${objective.status === 'in_progress' ? '' : getStatusColor(objective.status)}`}
                      style={getStatusStyle(objective.status)}
                    >
                      {getStatusLabel(objective.status)}
                    </span>
                  </div>
                  {objective.description && (
                    <p className="text-sm font-body opacity-70 mb-3">{objective.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingObjective(objective)
                      setIsModalOpen(true)
                    }}
                    className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Edit className="w-4 h-4" style={{ color: primaryColor }} />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('¿Estás seguro de que deseas eliminar este objetivo?')) {
                        try {
                          await TeamsService.deleteTeamObjective(teamId, objective.objective_id)
                          fetchObjectives()
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Error al eliminar objetivo')
                        }
                      }
                    }}
                    className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'rgba(220, 38, 38, 0.2)' }}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-body opacity-70">Progreso</span>
                  <span className="text-sm font-body font-semibold">
                    {objective.progress_percentage?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${cardBorder}40` }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${objective.progress_percentage || 0}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs font-body opacity-70">
                  <span>Actual: {objective.current_value}</span>
                  <span>Objetivo: {objective.target_value}</span>
                </div>
              </div>

              {/* Información adicional */}
              <div className="flex items-center gap-4 text-sm font-body">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 opacity-50" />
                  <span>{objective.metric_type}</span>
                </div>
                {objective.deadline && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 opacity-50" />
                    <span>Vence: {new Date(objective.deadline).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de Crear/Editar Objetivo */}
      <TeamObjectiveModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingObjective(null)
        }}
        teamId={teamId}
        objective={editingObjective}
        onComplete={() => {
          fetchObjectives()
        }}
      />
    </div>
  )
}


