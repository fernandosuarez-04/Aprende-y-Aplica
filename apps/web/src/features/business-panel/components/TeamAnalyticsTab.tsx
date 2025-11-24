'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Users, MessageSquare, Target, Award } from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { TeamsService, WorkTeamStatistics } from '../services/teams.service'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

interface TeamAnalyticsTabProps {
  teamId: string
}

export function TeamAnalyticsTab({ teamId }: TeamAnalyticsTabProps) {
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  
  const cardBg = panelStyles?.card_background || 'rgba(30, 41, 59, 0.8)'
  const cardBorder = panelStyles?.border_color || 'rgba(51, 65, 85, 0.3)'
  const textColor = panelStyles?.text_color || '#f8fafc'
  const primaryColor = panelStyles?.primary_button_color || '#3b82f6'

  const [statistics, setStatistics] = useState<WorkTeamStatistics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatistics()
  }, [teamId])

  const fetchStatistics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const stats = await TeamsService.getTeamStatistics(teamId)
      setStatistics(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estadísticas')
    } finally {
      setIsLoading(false)
    }
  }

  // Preparar datos para gráficos
  const currentStats = statistics[0] || {
    total_members: 0,
    active_members: 0,
    average_completion_percentage: 0,
    average_score: 0,
    total_interactions: 0,
    total_messages: 0,
    total_feedback_given: 0
  }

  // Datos para gráfico de progreso temporal (simulado - en producción vendría de la API)
  const progressData = [
    { fecha: 'Sem 1', progreso: 20 },
    { fecha: 'Sem 2', progreso: 35 },
    { fecha: 'Sem 3', progreso: 50 },
    { fecha: 'Sem 4', progreso: 65 },
    { fecha: 'Sem 5', progreso: 80 }
  ]

  // Datos para gráfico de actividad
  const activityData = [
    { fecha: 'Lun', mensajes: 12, feedback: 5 },
    { fecha: 'Mar', mensajes: 19, feedback: 8 },
    { fecha: 'Mié', mensajes: 15, feedback: 6 },
    { fecha: 'Jue', mensajes: 22, feedback: 10 },
    { fecha: 'Vie', mensajes: 18, feedback: 7 },
    { fecha: 'Sáb', mensajes: 8, feedback: 3 },
    { fecha: 'Dom', mensajes: 5, feedback: 2 }
  ]

  // Datos para gráfico circular de completitud
  const completionPercentage = currentStats.average_completion_percentage || 0
  const completionData = [
    { name: 'Completado', value: completionPercentage, color: primaryColor },
    { name: 'Pendiente', value: Math.max(0, 100 - completionPercentage), color: cardBorder }
  ].filter(item => item.value > 0) // Solo mostrar segmentos con valor > 0

  const COLORS = completionData.map(item => item.color)

  const chartTooltipStyle = {
    backgroundColor: cardBg,
    border: `1px solid ${cardBorder}`,
    borderRadius: '8px',
    color: textColor
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" style={{ color: textColor }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: primaryColor }}></div>
          <p className="text-sm font-body">Cargando analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body opacity-70 mb-1">Progreso Promedio</p>
              <p className="text-2xl font-bold font-heading">
                {currentStats.average_completion_percentage.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 opacity-50" style={{ color: primaryColor }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body opacity-70 mb-1">Calificación Promedio</p>
              <p className="text-2xl font-bold font-heading">
                {currentStats.average_score.toFixed(1)}/10
              </p>
            </div>
            <Award className="w-8 h-8 opacity-50" style={{ color: primaryColor }} />
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
              <p className="text-sm font-body opacity-70 mb-1">Mensajes</p>
              <p className="text-2xl font-bold font-heading">{currentStats.total_messages}</p>
            </div>
            <MessageSquare className="w-8 h-8 opacity-50" style={{ color: primaryColor }} />
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
              <p className="text-sm font-body opacity-70 mb-1">Feedback</p>
              <p className="text-2xl font-bold font-heading">{currentStats.total_feedback_given}</p>
            </div>
            <Target className="w-8 h-8 opacity-50" style={{ color: primaryColor }} />
          </div>
        </motion.div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progreso Temporal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border backdrop-blur-sm"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Progreso Temporal
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} />
              <XAxis 
                dataKey="fecha" 
                stroke={textColor}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={textColor}
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line 
                type="monotone" 
                dataKey="progreso" 
                stroke={primaryColor} 
                strokeWidth={3}
                dot={{ fill: primaryColor, r: 5 }}
                name="Progreso %"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Completitud */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl border backdrop-blur-sm relative"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Completitud del Equipo
          </h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={completionData.length > 0 ? completionData : [{ name: 'Sin datos', value: 100, color: cardBorder }]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={90}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {(completionData.length > 0 ? completionData : [{ color: cardBorder }]).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || COLORS[index % COLORS.length]}
                      stroke={cardBg}
                      strokeWidth={3}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Valor']}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Centro del donut con porcentaje */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '50%', transform: 'translateY(-50%)' }}>
              <div className="text-center">
                <p className="text-4xl font-bold font-heading mb-1" style={{ color: primaryColor }}>
                  {completionPercentage.toFixed(0)}%
                </p>
                <p className="text-xs font-body opacity-70" style={{ color: textColor }}>
                  Completado
                </p>
              </div>
            </div>
          </div>
          {/* Leyenda personalizada */}
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            {completionData.length > 0 ? (
              <>
                {completionPercentage > 0 && (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="text-sm font-body font-medium" style={{ color: textColor }}>
                      Completado: {completionPercentage.toFixed(1)}%
                    </span>
                  </div>
                )}
                {completionPercentage < 100 && (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded shadow-sm"
                      style={{ backgroundColor: cardBorder }}
                    />
                    <span className="text-sm font-body opacity-70" style={{ color: textColor }}>
                      Pendiente: {(100 - completionPercentage).toFixed(1)}%
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded shadow-sm"
                  style={{ backgroundColor: cardBorder }}
                />
                <span className="text-sm font-body opacity-70" style={{ color: textColor }}>
                  Sin datos disponibles
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Actividad del Equipo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl border backdrop-blur-sm lg:col-span-2"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Actividad Semanal
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} />
              <XAxis 
                dataKey="fecha" 
                stroke={textColor}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={textColor}
                style={{ fontSize: '12px' }}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="mensajes" 
                stackId="1"
                stroke={primaryColor} 
                fill={primaryColor}
                fillOpacity={0.6}
                name="Mensajes"
              />
              <Area 
                type="monotone" 
                dataKey="feedback" 
                stackId="1"
                stroke="#10b981" 
                fill="#10b981"
                fillOpacity={0.6}
                name="Feedback"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Comparación de Miembros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl border backdrop-blur-sm lg:col-span-2"
          style={{ backgroundColor: cardBg, borderColor: cardBorder }}
        >
          <h3 className="text-lg font-heading font-semibold mb-4" style={{ color: textColor }}>
            Comparación de Miembros
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { nombre: 'Miembro 1', progreso: 85, calificacion: 8.5 },
              { nombre: 'Miembro 2', progreso: 72, calificacion: 7.2 },
              { nombre: 'Miembro 3', progreso: 90, calificacion: 9.0 },
              { nombre: 'Miembro 4', progreso: 65, calificacion: 6.5 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke={cardBorder} />
              <XAxis 
                dataKey="nombre" 
                stroke={textColor}
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke={textColor}
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
              />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Bar 
                dataKey="progreso" 
                fill={primaryColor}
                name="Progreso %"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="calificacion" 
                fill="#10b981"
                name="Calificación (x10)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}

