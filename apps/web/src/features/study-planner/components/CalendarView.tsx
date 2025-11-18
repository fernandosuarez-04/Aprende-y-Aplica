'use client'

import { useMemo, useState } from 'react'
import {
  calculateHeatmapLevel,
  formatStudyTime,
  convertToHeatmapData,
  type DailyProgressData,
} from '../types/streak.types'

interface CalendarViewProps {
  dailyProgress: DailyProgressData[]
  onDateClick?: (date: string) => void
  selectedDate?: string
  className?: string
}

export function CalendarView({
  dailyProgress,
  onDateClick,
  selectedDate,
  className = '',
}: CalendarViewProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const heatmapData = useMemo(
    () => convertToHeatmapData(dailyProgress),
    [dailyProgress]
  )

  // Generar los últimos 12 meses de datos
  const months = useMemo(() => {
    const result: {
      name: string
      year: number
      weeks: Array<Array<{
        date: string
        dayOfWeek: number
        value: number
        level: 0 | 1 | 2 | 3 | 4
        sessions: number
      } | null>>
    }[] = []

    const today = new Date()
    const startDate = new Date(today)
    startDate.setMonth(today.getMonth() - 11)
    startDate.setDate(1)

    // Iterar por cada mes
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const currentMonth = new Date(startDate)
      currentMonth.setMonth(startDate.getMonth() + monthOffset)

      const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'short' })
      const year = currentMonth.getFullYear()

      // Obtener primer y último día del mes
      const firstDay = new Date(year, currentMonth.getMonth(), 1)
      const lastDay = new Date(year, currentMonth.getMonth() + 1, 0)

      // Construir semanas del mes
      const weeks: Array<Array<any>> = []
      let currentWeek: Array<any> = []

      // Llenar días vacíos al inicio
      const firstDayOfWeek = firstDay.getDay()
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null)
      }

      // Llenar días del mes
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, currentMonth.getMonth(), day)
        const dateStr = date.toISOString().split('T')[0]

        const dayData = heatmapData.find((d) => d.date === dateStr)
        const progressData = dailyProgress.find((d) => d.date === dateStr)

        currentWeek.push({
          date: dateStr,
          dayOfWeek: date.getDay(),
          value: dayData?.value || 0,
          level: dayData?.level || 0,
          sessions: progressData?.sessions_completed || 0,
        })

        // Si completamos una semana, empezar nueva
        if (currentWeek.length === 7) {
          weeks.push([...currentWeek])
          currentWeek = []
        }
      }

      // Si queda una semana incompleta, agregarla
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push(null)
        }
        weeks.push(currentWeek)
      }

      result.push({
        name: monthName,
        year,
        weeks,
      })
    }

    return result
  }, [heatmapData, dailyProgress])

  const getLevelColor = (level: 0 | 1 | 2 | 3 | 4) => {
    const colors = {
      0: 'bg-neutral-100 dark:bg-neutral-800',
      1: 'bg-blue-200 dark:bg-blue-900/40',
      2: 'bg-blue-400 dark:bg-blue-700/60',
      3: 'bg-blue-500 dark:bg-blue-600/80',
      4: 'bg-blue-600 dark:bg-blue-500',
    }
    return colors[level]
  }

  const getDateInfo = (date: string) => {
    const progress = dailyProgress.find((d) => d.date === date)
    return (
      progress || {
        date,
        sessions_completed: 0,
        study_minutes: 0,
        had_activity: false,
        streak_count: 0,
      }
    )
  }

  return (
    <div
      className={`rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 ${className}`}
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          📅 Calendario de Actividad
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Últimos 12 meses de actividad de estudio
        </p>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-grid gap-4" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
          {months.map((month, idx) => (
            <div key={`${month.name}-${month.year}`} className="min-w-[80px]">
              {/* Month label */}
              <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2 text-center">
                {month.name}
              </div>

              {/* Weeks grid */}
              <div className="space-y-1">
                {month.weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex gap-1">
                    {week.map((day, dayIdx) => {
                      if (!day) {
                        return (
                          <div
                            key={dayIdx}
                            className="w-3 h-3"
                          />
                        )
                      }

                      const isSelected = selectedDate === day.date
                      const isHovered = hoveredDate === day.date
                      const isToday = day.date === new Date().toISOString().split('T')[0]

                      return (
                        <button
                          key={day.date}
                          onClick={() => onDateClick?.(day.date)}
                          onMouseEnter={() => setHoveredDate(day.date)}
                          onMouseLeave={() => setHoveredDate(null)}
                          className={`w-3 h-3 rounded-sm ${getLevelColor(
                            day.level
                          )} transition-all ${
                            isSelected
                              ? 'ring-2 ring-primary-500 dark:ring-primary-400'
                              : ''
                          } ${
                            isToday
                              ? 'ring-1 ring-neutral-400 dark:ring-neutral-500'
                              : ''
                          } ${
                            isHovered ? 'scale-125 z-10' : ''
                          } cursor-pointer`}
                          title={`${day.date}: ${day.sessions} sesiones, ${formatStudyTime(
                            day.value
                          )}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Menos</span>
          <div className="flex gap-1">
            {([0, 1, 2, 3, 4] as const).map((level) => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm ${getLevelColor(level)}`}
              />
            ))}
          </div>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Más</span>
        </div>

        {/* Tooltip para el día seleccionado/hovereado */}
        {(hoveredDate || selectedDate) && (
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            {(() => {
              const date = hoveredDate || selectedDate!
              const info = getDateInfo(date)
              return (
                <span>
                  {new Date(date).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                  })}
                  : <strong>{info.sessions_completed} sesiones</strong> •{' '}
                  <strong>{formatStudyTime(info.study_minutes)}</strong>
                </span>
              )
            })()}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">
            {dailyProgress.filter((d) => d.had_activity).length}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Días activos
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">
            {formatStudyTime(
              dailyProgress.reduce((sum, d) => sum + d.study_minutes, 0)
            )}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Tiempo total
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">
            {dailyProgress.reduce((sum, d) => sum + d.sessions_completed, 0)}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Sesiones
          </div>
        </div>
      </div>
    </div>
  )
}
