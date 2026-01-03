'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Plus,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Sparkles,
  Trophy,
  Zap,
  ArrowUpRight,
  BarChart3
} from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, WorkTeamObjective } from '../services/teams.service'
import { TeamObjectiveModal } from './TeamObjectiveModal'
import { useThemeStore } from '@/core/stores/themeStore'

interface TeamObjectivesTabProps {
  teamId: string
}

export function TeamObjectivesTab({ teamId }: TeamObjectivesTabProps) {
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const panelStyles = styles?.panel

  const cardBg = isDark ? (panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)') : '#FFFFFF'
  const cardBorder = isDark ? (panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)') : 'rgba(0, 0, 0, 0.1)'
  const textColor = isDark ? (panelStyles?.text_color || '#f8fafc') : '#0F172A'
  const statBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'
  const secondaryColor = panelStyles?.secondary_button_color || '#8b5cf6'
  const accentColor = panelStyles?.accent_color || '#00D4B3'

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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'achieved':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          label: 'Logrado',
          icon: CheckCircle2,
          glow: '0 0 20px rgba(16, 185, 129, 0.3)'
        }
      case 'failed':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          label: 'Fallido',
          icon: XCircle,
          glow: '0 0 20px rgba(239, 68, 68, 0.3)'
        }
      case 'in_progress':
        return {
          bg: `${primaryColor}20`,
          color: primaryColor,
          label: 'En Progreso',
          icon: Zap,
          glow: `0 0 20px ${primaryColor}40`
        }
      default:
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          label: 'Pendiente',
          icon: Clock,
          glow: '0 0 20px rgba(245, 158, 11, 0.3)'
        }
    }
  }

  // Estadísticas rápidas
  const stats = {
    total: objectives.length,
    achieved: objectives.filter(o => o.status === 'achieved').length,
    inProgress: objectives.filter(o => o.status === 'in_progress').length,
    avgProgress: objectives.length > 0
      ? objectives.reduce((acc, o) => acc + (o.progress_percentage || 0), 0) / objectives.length
      : 0
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}30)`,
              border: `1px solid ${primaryColor}40`
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Target className="w-8 h-8" style={{ color: primaryColor }} />
          </motion.div>
          <p className="text-sm font-medium" style={{ color: textColor }}>Cargando objetivos...</p>
        </motion.div>
      </div>
    )
  }

  // Preparar datos para gráfico
  const chartData = objectives.map(obj => ({
    name: obj.title.length > 12 ? obj.title.substring(0, 12) + '...' : obj.title,
    objetivo: obj.target_value,
    actual: obj.current_value,
    progreso: obj.progress_percentage || 0
  }))

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="p-3 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${accentColor}20, ${secondaryColor}20)`,
              border: `1px solid ${accentColor}30`
            }}
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <Target className="w-6 h-6" style={{ color: accentColor }} />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: textColor }}>
              Objetivos del Equipo
            </h2>
            <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
              {objectives.length === 0 ? 'Sin objetivos definidos' : `${objectives.length} objetivo${objectives.length > 1 ? 's' : ''} activo${objectives.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <motion.button
          onClick={() => {
            setEditingObjective(null)
            setIsModalOpen(true)
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)`,
            boxShadow: `0 8px 25px ${accentColor}40`,
            color: '#FFFFFF'
          }}
        >
          <Plus className="w-4 h-4" />
          <span style={{ color: '#FFFFFF' }}>Crear Objetivo</span>
        </motion.button>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
        >
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Estadísticas Rápidas - Solo si hay objetivos */}
      {objectives.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {[
            { label: 'Total', value: stats.total, icon: Target, color: accentColor },
            { label: 'Completados', value: stats.achieved, icon: Trophy, color: '#10b981' },
            { label: 'En Progreso', value: stats.inProgress, icon: Zap, color: '#f59e0b' },
            { label: 'Progreso Prom.', value: `${stats.avgProgress.toFixed(0)}%`, icon: TrendingUp, color: '#8b5cf6' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="p-4 rounded-xl border backdrop-blur-sm"
              className="p-4 rounded-xl border backdrop-blur-sm"
              style={{
                backgroundColor: statBg,
                borderColor: cardBorder
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold" style={{ color: textColor }}>{stat.value}</p>
                  <p className="text-xs opacity-50" style={{ color: textColor }}>{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Gráfico de Dona - Distribución de Estados */}
      {objectives.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl border backdrop-blur-xl"
          style={{
            backgroundColor: statBg,
            borderColor: cardBorder
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <BarChart3 className="w-4 h-4" style={{ color: accentColor }} />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: textColor }}>
                Resumen de Objetivos
              </h3>
              <p className="text-xs" style={{ color: textColor, opacity: 0.5 }}>
                Distribución por estado y progreso promedio
              </p>
            </div>
          </div>

          {/* Contenido: Dona + Leyenda + Stats */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
            {/* Gráfico de Dona SVG */}
            <div className="relative">
              <svg width="180" height="180" viewBox="0 0 180 180">
                {/* Fondo del círculo */}
                <circle
                  cx="90"
                  cy="90"
                  r="70"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="20"
                />

                {/* Segmentos de la dona */}
                {(() => {
                  const achieved = stats.achieved
                  const inProgress = stats.inProgress
                  const pending = stats.total - achieved - inProgress
                  const total = stats.total || 1

                  const circumference = 2 * Math.PI * 70
                  let currentOffset = 0

                  const segments = [
                    { value: achieved, color: '#10b981', label: 'Completados' },
                    { value: inProgress, color: '#f59e0b', label: 'En Progreso' },
                    { value: pending, color: '#3b82f6', label: 'Pendientes' }
                  ].filter(s => s.value > 0)

                  return segments.map((segment, i) => {
                    const percentage = segment.value / total
                    const dashLength = percentage * circumference
                    const dashOffset = -currentOffset * circumference / total
                    currentOffset += segment.value

                    return (
                      <motion.circle
                        key={segment.label}
                        cx="90"
                        cy="90"
                        r="70"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="20"
                        strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                        strokeDashoffset={dashOffset + circumference * 0.25}
                        strokeLinecap="round"
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${dashLength} ${circumference - dashLength}` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.2, ease: "easeOut" }}
                        style={{ filter: `drop-shadow(0 0 8px ${segment.color}40)` }}
                      />
                    )
                  })
                })()}
              </svg>

              {/* Centro del donut - Progreso Promedio */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-3xl font-bold"
                  style={{ color: textColor }}
                >
                  {stats.avgProgress.toFixed(0)}%
                </motion.span>
                <span className="text-xs" style={{ color: textColor, opacity: 0.5 }}>
                  Promedio
                </span>
              </div>
            </div>

            {/* Leyenda + Estadísticas */}
            <div className="flex flex-col gap-4">
              {[
                { label: 'Completados', value: stats.achieved, color: '#10b981', icon: CheckCircle2 },
                { label: 'En Progreso', value: stats.inProgress, color: '#f59e0b', icon: Clock },
                { label: 'Pendientes', value: stats.total - stats.achieved - stats.inProgress, color: '#3b82f6', icon: Target }
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: textColor }}>
                      {item.value}
                    </p>
                    <p className="text-xs" style={{ color: textColor, opacity: 0.5 }}>
                      {item.label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Estado Vacío Premium */}
      {objectives.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden p-10 rounded-2xl border text-center"
          style={{
            backgroundColor: 'rgba(255,255,255,0.02)', // Dejar transparente o sutil
            borderColor: cardBorder
          }}
        >
          {/* Background decoration */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${primaryColor}, transparent 70%)`
            }}
          />

          <motion.div
            className="relative z-10"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`,
                border: `1px solid ${primaryColor}20`
              }}
              animate={{
                boxShadow: [
                  `0 0 0 0 ${primaryColor}20`,
                  `0 0 0 20px ${primaryColor}00`
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Target className="w-10 h-10" style={{ color: primaryColor }} />
            </motion.div>

            <h3 className="text-xl font-bold mb-2" style={{ color: textColor }}>
              No hay objetivos definidos
            </h3>
            <p className="text-sm opacity-60 mb-6 max-w-md mx-auto" style={{ color: textColor }}>
              Crea objetivos medibles para hacer seguimiento del progreso de tu equipo y alcanzar metas ambiciosas.
            </p>

            <motion.button
              onClick={() => {
                setEditingObjective(null)
                setIsModalOpen(true)
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                boxShadow: `0 8px 25px ${primaryColor}40`
              }}
            >
              <Sparkles className="w-4 h-4" />
              Crear Primer Objetivo
            </motion.button>
          </motion.div>
        </motion.div>
      ) : (
        /* Lista de Objetivos */
        <div className="space-y-4">
          <AnimatePresence>
            {objectives.map((objective, index) => {
              const statusConfig = getStatusConfig(objective.status)
              const StatusIcon = statusConfig.icon

              return (
                <motion.div
                  key={objective.objective_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="group p-5 rounded-2xl border backdrop-blur-sm transition-all"
                  style={{
                    backgroundColor: statBg,
                    borderColor: cardBorder,
                  }}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Circular Progress */}
                      <div className="relative">
                        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="4"
                          />
                          <motion.circle
                            cx="28"
                            cy="28"
                            r="24"
                            fill="none"
                            stroke={statusConfig.color}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 24}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                            animate={{
                              strokeDashoffset: 2 * Math.PI * 24 * (1 - (objective.progress_percentage || 0) / 100)
                            }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold" style={{ color: statusConfig.color }}>
                            {(objective.progress_percentage || 0).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-base" style={{ color: textColor }}>
                            {objective.title}
                          </h3>
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1"
                            style={{
                              backgroundColor: statusConfig.bg,
                              color: statusConfig.color
                            }}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                        {objective.description && (
                          <p className="text-sm opacity-60 mb-2" style={{ color: textColor }}>
                            {objective.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs" style={{ color: textColor }}>
                          <span className="flex items-center gap-1 opacity-60">
                            <TrendingUp className="w-3 h-3" />
                            {objective.metric_type}
                          </span>
                          {objective.deadline && (
                            <span className="flex items-center gap-1 opacity-60">
                              <Calendar className="w-3 h-3" />
                              {new Date(objective.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" style={{ color: '#10b981' }} />
                            <span style={{ color: '#10b981' }}>{objective.current_value}</span>
                            <span className="opacity-40">/ {objective.target_value}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setEditingObjective(objective)
                          setIsModalOpen(true)
                        }}
                        className="p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <Edit className="w-4 h-4" style={{ color: primaryColor }} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={async () => {
                          if (confirm('¿Eliminar este objetivo?')) {
                            try {
                              await TeamsService.deleteTeamObjective(teamId, objective.objective_id)
                              fetchObjectives()
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Error al eliminar')
                            }
                          }
                        }}
                        className="p-2 rounded-lg transition-colors"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Linear Progress Bar */}
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${objective.progress_percentage || 0}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${statusConfig.color}, ${statusConfig.color}80)`,
                      }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
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
