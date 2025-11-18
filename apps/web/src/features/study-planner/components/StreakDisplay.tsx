'use client'

import { useMemo } from 'react'
import {
  getStreakMotivationMessage,
  isStreakAtRisk,
  getStreakColor,
} from '../types/streak.types'

interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
  lastSessionDate: string | null
  className?: string
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  lastSessionDate,
  className = '',
}: StreakDisplayProps) {
  const motivationMessage = useMemo(
    () => getStreakMotivationMessage(currentStreak),
    [currentStreak]
  )

  const atRisk = useMemo(
    () => isStreakAtRisk(lastSessionDate),
    [lastSessionDate]
  )

  const streakColor = useMemo(() => getStreakColor(currentStreak), [currentStreak])

  const lastSessionText = useMemo(() => {
    if (!lastSessionDate) return 'Nunca'

    const lastDate = new Date(lastSessionDate)
    const today = new Date()
    const diffDays = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    return `Hace ${diffDays} días`
  }, [lastSessionDate])

  return (
    <div
      className={`rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          🔥 Tu Racha de Estudio
        </h3>
        {atRisk && currentStreak > 0 && (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
            ⚠️ En riesgo
          </span>
        )}
      </div>

      {/* Main Streak Display */}
      <div className="flex items-center gap-6 mb-6">
        {/* Current Streak Circle */}
        <div className="relative">
          <div
            className={`w-28 h-28 rounded-full ${streakColor} flex flex-col items-center justify-center text-white shadow-lg`}
          >
            <div className="text-4xl font-bold">{currentStreak}</div>
            <div className="text-xs font-medium opacity-90">
              {currentStreak === 1 ? 'día' : 'días'}
            </div>
          </div>
          {currentStreak > 0 && (
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-lg">
              🔥
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex-1">
          <div className="mb-3">
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
              Racha más larga
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {longestStreak} {longestStreak === 1 ? 'día' : 'días'}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
              Última sesión
            </div>
            <div className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
              {lastSessionText}
            </div>
          </div>
        </div>
      </div>

      {/* Motivation Message */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 text-center">
          {motivationMessage}
        </p>
      </div>

      {/* Streak Milestones Progress */}
      {currentStreak > 0 && (
        <div className="mt-6">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
            Próximo hito
          </div>
          <StreakMilestones currentStreak={currentStreak} />
        </div>
      )}
    </div>
  )
}

// Subcomponente para mostrar los hitos de racha
function StreakMilestones({ currentStreak }: { currentStreak: number }) {
  const milestones = [
    { days: 3, label: '3 días', icon: '🌱' },
    { days: 7, label: '1 semana', icon: '🌿' },
    { days: 14, label: '2 semanas', icon: '🌳' },
    { days: 30, label: '1 mes', icon: '🏆' },
    { days: 60, label: '2 meses', icon: '💎' },
    { days: 100, label: '100 días', icon: '⭐' },
  ]

  const nextMilestone = milestones.find((m) => m.days > currentStreak) || milestones[milestones.length - 1]
  const progress = Math.min((currentStreak / nextMilestone.days) * 100, 100)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {nextMilestone.icon} {nextMilestone.label}
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {currentStreak}/{nextMilestone.days}
        </span>
      </div>
      <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* All Milestones */}
      <div className="mt-4 flex gap-2 flex-wrap">
        {milestones.map((milestone) => {
          const achieved = currentStreak >= milestone.days
          return (
            <div
              key={milestone.days}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                achieved
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500'
              }`}
            >
              <span>{milestone.icon}</span>
              <span>{milestone.label}</span>
              {achieved && <span className="ml-1">✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
