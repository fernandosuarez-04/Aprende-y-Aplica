'use client'

import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine, PieChart, Pie } from 'recharts'
import { TrendingUp, Users, Clock, Award, Activity } from 'lucide-react'

interface ChartData {
  name: string
  value: number
  [key: string]: string | number
}

interface AdvancedChartsProps {
  enrollmentData: Array<{ date: string; enrollments: number; completions: number }>
  progressDistribution: Array<{ range: string; count: number }>
  engagementData: Array<{ user_id: string; progress: number; days_active: number; notes_created: number }>
  timeSeriesData: Array<{ date: string; value: number; label: string }>
}

const COLORS = {
  primary: '#8b5cf6',
  secondary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
}

export function EnrollmentTrendChart({ data, darkMode = true }: { data: Array<{ date: string; enrollments: number; completions: number }>, darkMode?: boolean }) {
  const borderClass = darkMode ? 'border-purple-800/30 bg-gray-900/60' : 'border-gray-200 bg-white dark:bg-gray-900'
  const textClass = darkMode ? 'text-white' : 'text-gray-900 dark:text-white'
  const iconClass = darkMode ? 'text-purple-400' : 'text-blue-600 dark:text-blue-400'
  const axisColor = darkMode ? '#a78bfa' : '#6b7280'
  const tickColor = darkMode ? '#c4b5fd' : '#9ca3af'
  const tooltipBg = darkMode ? '#1f2937' : '#ffffff'
  const tooltipBorder = darkMode ? '#6b21a8' : '#e5e7eb'
  const tooltipText = darkMode ? '#e9d5ff' : '#111827'
  const gridColor = darkMode ? '#4b5563' : '#e5e7eb'

  return (
    <div className={`rounded-xl border p-6 ${borderClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-5 h-5 ${iconClass}`} />
          <h3 className={`text-lg font-semibold ${textClass}`}>Tendencia de Inscripciones</h3>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="date" 
            stroke={axisColor}
            tick={{ fill: tickColor }}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke={axisColor}
            tick={{ fill: tickColor }}
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '8px',
              color: tooltipText
            }}
          />
          <Legend 
            wrapperStyle={{ color: tickColor }}
          />
          <Line 
            type="monotone" 
            dataKey="enrollments" 
            name="Inscripciones"
            stroke={COLORS.primary}
            strokeWidth={2}
            dot={{ fill: COLORS.primary, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="completions" 
            name="Completados"
            stroke={COLORS.success}
            strokeWidth={2}
            dot={{ fill: COLORS.success, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ProgressDistributionChart({ data, darkMode = true }: { data: Array<{ range: string; count: number }>, darkMode?: boolean }) {
  const borderClass = darkMode ? 'border-purple-800/30 bg-gray-900/60' : 'border-gray-200 bg-white dark:bg-gray-900'
  const textClass = darkMode ? 'text-white' : 'text-gray-900 dark:text-white'
  const iconClass = darkMode ? 'text-purple-400' : 'text-blue-600 dark:text-blue-400'
  const axisColor = darkMode ? '#a78bfa' : '#6b7280'
  const tickColor = darkMode ? '#c4b5fd' : '#9ca3af'
  const tooltipBg = darkMode ? '#1f2937' : '#ffffff'
  const tooltipBorder = darkMode ? '#6b21a8' : '#e5e7eb'
  const tooltipText = darkMode ? '#e9d5ff' : '#111827'
  const gridColor = darkMode ? '#4b5563' : '#e5e7eb'

  return (
    <div className={`rounded-xl border p-6 ${borderClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className={`w-5 h-5 ${iconClass}`} />
          <h3 className={`text-lg font-semibold ${textClass}`}>Distribución de Progreso</h3>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="range" 
            stroke={axisColor}
            tick={{ fill: tickColor }}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke={axisColor}
            tick={{ fill: tickColor }}
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '8px',
              color: tooltipText
            }}
          />
          <Bar dataKey="count" name="Usuarios" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={
                  index < data.length / 3 ? COLORS.success :
                  index < (2 * data.length) / 3 ? COLORS.warning :
                  COLORS.danger
                } 
              />
            ))}
          </Bar>
          <ReferenceLine 
            y={data.reduce((sum, d) => sum + d.count, 0) / data.length} 
            stroke={COLORS.info}
            strokeDasharray="5 5"
            label={{ value: 'Promedio', position: 'insideTopRight', fill: COLORS.info }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function EngagementScatterChart({ data, darkMode = true }: { data: Array<{ progress: number; days_active: number; notes_created: number; user_id: string }>, darkMode?: boolean }) {
  const borderClass = darkMode ? 'border-purple-800/30 bg-gray-900/60' : 'border-gray-200 bg-white dark:bg-gray-900'
  const textClass = darkMode ? 'text-white' : 'text-gray-900 dark:text-white'
  const iconClass = darkMode ? 'text-purple-400' : 'text-blue-600 dark:text-blue-400'
  const axisColor = darkMode ? '#a78bfa' : '#6b7280'
  const tickColor = darkMode ? '#c4b5fd' : '#9ca3af'
  const tooltipBg = darkMode ? '#1f2937' : '#ffffff'
  const tooltipBorder = darkMode ? '#6b21a8' : '#e5e7eb'
  const tooltipText = darkMode ? '#e9d5ff' : '#111827'
  const gridColor = darkMode ? '#4b5563' : '#e5e7eb'

  return (
    <div className={`rounded-xl border p-6 ${borderClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className={`w-5 h-5 ${iconClass}`} />
          <h3 className={`text-lg font-semibold ${textClass}`}>Correlación: Progreso vs Días Activos</h3>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            type="number"
            dataKey="progress" 
            name="Progreso (%)"
            stroke={axisColor}
            tick={{ fill: tickColor }}
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
          />
          <YAxis 
            type="number"
            dataKey="days_active" 
            name="Días Activos"
            stroke={axisColor}
            tick={{ fill: tickColor }}
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ 
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '8px',
              color: tooltipText
            }}
          />
          <Scatter 
            name="Usuarios" 
            data={data} 
            fill={COLORS.primary}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TimeSeriesChart({ data, title, dataKey }: { data: Array<{ date: string; value: number }>, title: string, dataKey: string }) {
  return (
    <div className="rounded-xl border border-purple-800/30 bg-gray-900/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="date" 
            stroke={axisColor}
            tick={{ fill: tickColor }}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke={axisColor}
            tick={{ fill: tickColor }}
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '8px',
              color: tooltipText
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            name={title}
            stroke={COLORS.secondary}
            strokeWidth={3}
            dot={{ fill: COLORS.secondary, r: 5 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CompletionRateChart({ data, darkMode = true }: { data: Array<{ period: string; enrollment_rate: number; completion_rate: number; retention_rate: number }>, darkMode?: boolean }) {
  const borderClass = darkMode ? 'border-purple-800/30 bg-gray-900/60' : 'border-gray-200 bg-white dark:bg-gray-900'
  const textClass = darkMode ? 'text-white' : 'text-gray-900 dark:text-white'
  const iconClass = darkMode ? 'text-purple-400' : 'text-blue-600 dark:text-blue-400'
  const axisColor = darkMode ? '#a78bfa' : '#6b7280'
  const tickColor = darkMode ? '#c4b5fd' : '#9ca3af'
  const tooltipBg = darkMode ? '#1f2937' : '#ffffff'
  const tooltipBorder = darkMode ? '#6b21a8' : '#e5e7eb'
  const tooltipText = darkMode ? '#e9d5ff' : '#111827'
  const gridColor = darkMode ? '#4b5563' : '#e5e7eb'

  return (
    <div className={`rounded-xl border p-6 ${borderClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className={`w-5 h-5 ${iconClass}`} />
          <h3 className={`text-lg font-semibold ${textClass}`}>Tasas de RRHH: Inscripción, Finalización y Retención</h3>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            dataKey="period" 
            stroke={axisColor}
            tick={{ fill: tickColor }}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke={axisColor}
            tick={{ fill: tickColor }}
            domain={[0, 100]}
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '8px',
              color: tooltipText
            }}
            formatter={(value: number) => `${value.toFixed(1)}%`}
          />
          <Legend 
            wrapperStyle={{ color: tickColor }}
          />
          <Line 
            type="monotone" 
            dataKey="enrollment_rate" 
            name="Tasa de Inscripción"
            stroke={COLORS.primary}
            strokeWidth={2}
            dot={{ fill: COLORS.primary, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="completion_rate" 
            name="Tasa de Finalización"
            stroke={COLORS.success}
            strokeWidth={2}
            dot={{ fill: COLORS.success, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="retention_rate" 
            name="Tasa de Retención"
            stroke={COLORS.info}
            strokeWidth={2}
            dot={{ fill: COLORS.info, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DonutPieChart({ 
  data, title, darkMode = true 
}: { data: Array<{ name: string; count: number }>, title: string, darkMode?: boolean }) {
  const borderClass = darkMode ? 'border-purple-800/30 bg-gray-900/60' : 'border-gray-200 bg-white dark:bg-gray-900'
  const textClass = darkMode ? 'text-white' : 'text-gray-900 dark:text-white'
  const tickColor = darkMode ? '#c4b5fd' : '#9ca3af'
  const tooltipBg = darkMode ? '#1f2937' : '#ffffff'
  const tooltipBorder = darkMode ? '#6b21a8' : '#e5e7eb'
  const tooltipText = darkMode ? '#e9d5ff' : '#111827'

  const COLORS_SEQ = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.info, COLORS.danger]

  const total = data.reduce((s, d) => s + (d.count || 0), 0)

  return (
    <div className={`rounded-xl border p-6 ${borderClass}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${textClass}`}>{title}</h3>
        <div className={`text-sm ${darkMode ? 'text-purple-300' : 'text-gray-500'}`}>{total} usuarios</div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Tooltip 
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, color: tooltipText, borderRadius: 8 }}
            formatter={(value: number, name: string) => [`${value}`, name]}
          />
          <Legend wrapperStyle={{ color: tickColor }} />
          <Pie data={data} dataKey="count" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS_SEQ[index % COLORS_SEQ.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

