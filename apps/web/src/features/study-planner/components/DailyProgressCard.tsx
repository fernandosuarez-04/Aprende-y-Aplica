'use client'

import { useMemo } from 'react'
import {
  formatStudyTime,
  calculateDailyCompletionPercentage,
} from '../types/streak.types'

interface DailyProgressCardProps {
  todayStats: {
    sessions_completed: number
    sessions_pending: number
    study_minutes: number
    target_minutes?: number
  }
  className?: string
}

export function DailyProgressCard({ todayStats, className = '' }: DailyProgressCardProps) {
  const completionPercentage = useMemo(
    () =>
      calculateDailyCompletionPercentage(
        todayStats.sessions_completed,
        todayStats.sessions_pending
      ),
    [todayStats.sessions_completed, todayStats.sessions_pending]
  )

  const studyTimeFormatted = useMemo(
    () => formatStudyTime(todayStats.study_minutes),
    [todayStats.study_minutes]
  )

  const targetMinutesFormatted = useMemo(
    () =>
      todayStats.target_minutes ? formatStudyTime(todayStats.target_minutes) : null,
    [todayStats.target_minutes]
  )

  const timeProgress = useMemo(() => {
    if (!todayStats.target_minutes) return 100
    return Math.min(
      Math.round((todayStats.study_minutes / todayStats.target_minutes) * 100),
      100
    )
  }, [todayStats.study_minutes, todayStats.target_minutes])

  const totalSessions =
    todayStats.sessions_completed + todayStats.sessions_pending

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return 'bg-neutral-300 dark:bg-neutral-600'
    if (percentage < 50) return 'bg-red-500'
    if (percentage < 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getProgressMessage = () => {
    if (totalSessions === 0) {
      return 'No tienes sesiones programadas para hoy'
    }
    if (completionPercentage === 100) {
      return '¡Excelente! Completaste todas tus sesiones de hoy'
    }
    if (completionPercentage >= 50) {
      return `¡Vas bien! Te faltan ${todayStats.sessions_pending} sesiones`
    }
    return `Aún tienes ${todayStats.sessions_pending} sesiones pendientes`
  }

  return (
    <div
      className={`rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          📅 Progreso de Hoy
        </h3>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
          })}
        </div>
      </div>

      {/* Sessions Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Sesiones completadas
          </span>
          <span className="text-sm font-bold text-neutral-900 dark:text-white">
            {todayStats.sessions_completed}/{totalSessions}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor(
              completionPercentage
            )} transition-all duration-500 rounded-full`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Progress message */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {getProgressMessage()}
        </p>
      </div>

      {/* Study Time */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Tiempo de estudio
          </span>
          <span className="text-sm font-bold text-neutral-900 dark:text-white">
            {studyTimeFormatted}
            {targetMinutesFormatted && (
              <span className="text-neutral-400 dark:text-neutral-500 font-normal">
                {' '}
                / {targetMinutesFormatted}
              </span>
            )}
          </span>
        </div>

        {todayStats.target_minutes && (
          <>
            {/* Time progress bar */}
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(
                  timeProgress
                )} transition-all duration-500 rounded-full`}
                style={{ width: `${timeProgress}%` }}
              />
            </div>

            {/* Time remaining */}
            {timeProgress < 100 && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                Faltan{' '}
                {formatStudyTime(todayStats.target_minutes - todayStats.study_minutes)}{' '}
                para alcanzar tu meta
              </p>
            )}
            {timeProgress === 100 && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                ✓ ¡Meta de estudio alcanzada!
              </p>
            )}
          </>
        )}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon="✅"
          value={todayStats.sessions_completed}
          label="Completadas"
          color="green"
        />
        <StatCard
          icon="⏳"
          value={todayStats.sessions_pending}
          label="Pendientes"
          color="yellow"
        />
        <StatCard
          icon="⏱️"
          value={studyTimeFormatted}
          label="Estudiado"
          color="blue"
        />
      </div>
    </div>
  )
}

// Subcomponente para las mini stats
interface StatCardProps {
  icon: string
  value: string | number
  label: string
  color: 'green' | 'yellow' | 'blue'
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow:
      'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  }

  return (
    <div
      className={`p-3 rounded-lg border ${colorClasses[color]} flex flex-col items-center`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-lg font-bold text-neutral-900 dark:text-white">
        {value}
      </div>
      <div className="text-xs text-neutral-600 dark:text-neutral-400">{label}</div>
    </div>
  )
}
