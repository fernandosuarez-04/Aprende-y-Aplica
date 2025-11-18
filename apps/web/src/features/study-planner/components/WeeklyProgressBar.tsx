'use client'

import { useMemo } from 'react'
import { formatStudyTime } from '../types/streak.types'

interface WeeklyProgressBarProps {
  weeklyData: {
    date: string // YYYY-MM-DD
    had_activity: boolean
    sessions_completed: number
    study_minutes: number
  }[]
  className?: string
}

export function WeeklyProgressBar({ weeklyData, className = '' }: WeeklyProgressBarProps) {
  const weekDays = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const today = new Date()
    const currentDayOfWeek = today.getDay() // 0 = Domingo

    // Obtener último domingo (inicio de semana)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDayOfWeek)

    // Generar los 7 días de la semana
    const weekData = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      // Buscar data para este día
      const dayData = weeklyData.find((d) => d.date === dateStr)

      const isToday =
        date.toDateString() === today.toDateString()

      weekData.push({
        dayName: days[i],
        date: dateStr,
        day: date.getDate(),
        isToday,
        hadActivity: dayData?.had_activity || false,
        sessionsCompleted: dayData?.sessions_completed || 0,
        studyMinutes: dayData?.study_minutes || 0,
      })
    }

    return weekData
  }, [weeklyData])

  const weekStats = useMemo(() => {
    const totalSessions = weekDays.reduce((sum, day) => sum + day.sessionsCompleted, 0)
    const totalMinutes = weekDays.reduce((sum, day) => sum + day.studyMinutes, 0)
    const activeDays = weekDays.filter((day) => day.hadActivity).length

    return {
      totalSessions,
      totalMinutes,
      activeDays,
    }
  }, [weekDays])

  const maxMinutes = Math.max(...weekDays.map((d) => d.studyMinutes), 1)

  const getActivityLevel = (minutes: number): 0 | 1 | 2 | 3 | 4 => {
    if (minutes === 0) return 0
    const percentage = (minutes / maxMinutes) * 100
    if (percentage < 25) return 1
    if (percentage < 50) return 2
    if (percentage < 75) return 3
    return 4
  }

  const getActivityColor = (level: 0 | 1 | 2 | 3 | 4) => {
    const colors = {
      0: 'bg-neutral-100 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600',
      1: 'bg-blue-200 dark:bg-blue-900/40 border-blue-300 dark:border-blue-800',
      2: 'bg-blue-400 dark:bg-blue-700/60 border-blue-500 dark:border-blue-600',
      3: 'bg-blue-500 dark:bg-blue-600/80 border-blue-600 dark:border-blue-500',
      4: 'bg-blue-600 dark:bg-blue-500 border-blue-700 dark:border-blue-400',
    }
    return colors[level]
  }

  return (
    <div
      className={`rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          📊 Esta Semana
        </h3>
        <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {weekStats.activeDays}/7 días activos
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="mb-6">
        <div className="flex items-end justify-between gap-2 h-40">
          {weekDays.map((day) => {
            const activityLevel = getActivityLevel(day.studyMinutes)
            const height = day.studyMinutes === 0 ? 8 : (day.studyMinutes / maxMinutes) * 100

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-2"
              >
                {/* Bar */}
                <div className="w-full flex flex-col justify-end items-center h-full relative group">
                  <div
                    className={`w-full rounded-t-lg border-2 transition-all duration-300 ${getActivityColor(
                      activityLevel
                    )} ${day.isToday ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-neutral-800' : ''}`}
                    style={{ height: `${height}%`, minHeight: '8px' }}
                  />

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-neutral-900 dark:bg-neutral-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                      <div className="font-semibold">{day.dayName} {day.day}</div>
                      <div>{day.sessionsCompleted} sesiones</div>
                      <div>{formatStudyTime(day.studyMinutes)}</div>
                    </div>
                    <div className="w-2 h-2 bg-neutral-900 dark:bg-neutral-700 transform rotate-45 mx-auto -mt-1" />
                  </div>
                </div>

                {/* Day label */}
                <div className="text-center">
                  <div
                    className={`text-xs font-medium ${
                      day.isToday
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {day.dayName}
                  </div>
                  <div
                    className={`text-xs ${
                      day.isToday
                        ? 'text-primary-500 dark:text-primary-500 font-bold'
                        : 'text-neutral-400 dark:text-neutral-500'
                    }`}
                  >
                    {day.day}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">
            {weekStats.totalSessions}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Sesiones completadas
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">
            {formatStudyTime(weekStats.totalMinutes)}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Tiempo total
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">
            {Math.round(weekStats.totalMinutes / 7)}m
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Promedio diario
          </div>
        </div>
      </div>

      {/* Weekly Goal Progress (if applicable) */}
      {weekStats.activeDays >= 5 && (
        <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-800 dark:text-green-200 text-center">
            ✨ ¡Excelente semana! Has estudiado {weekStats.activeDays} de 7 días
          </p>
        </div>
      )}
    </div>
  )
}
