'use client'

import { useMemo } from 'react'
import { formatStudyTime } from '../types/streak.types'
import type { NextSession } from '../types/streak.types'

interface NextSessionCardProps {
  session: NextSession
  onStartSession?: (sessionId: string) => void
  onReschedule?: (sessionId: string) => void
  className?: string
}

export function NextSessionCard({
  session,
  onStartSession,
  onReschedule,
  className = '',
}: NextSessionCardProps) {
  const sessionDate = useMemo(() => {
    const date = new Date(session.scheduled_date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const isSameDay = (d1: Date, d2: Date) =>
      d1.toDateString() === d2.toDateString()

    if (isSameDay(date, today)) return 'Hoy'
    if (isSameDay(date, tomorrow)) return 'Mañana'

    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }, [session.scheduled_date])

  const timeRange = useMemo(() => {
    return `${session.scheduled_start_time.slice(0, 5)} - ${session.scheduled_end_time.slice(0, 5)}`
  }, [session.scheduled_start_time, session.scheduled_end_time])

  const sessionTypeInfo = useMemo(() => {
    const types = {
      learning: {
        icon: '📚',
        label: 'Aprendizaje',
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      },
      review: {
        icon: '🔄',
        label: 'Repaso',
        color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      },
      practice: {
        icon: '✍️',
        label: 'Práctica',
        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      },
    }
    return (
      types[session.session_type as keyof typeof types] || types.learning
    )
  }, [session.session_type])

  const isToday = useMemo(() => sessionDate === 'Hoy', [sessionDate])
  const isSoon = useMemo(() => {
    if (!isToday) return false
    const now = new Date()
    const sessionTime = new Date()
    const [hours, minutes] = session.scheduled_start_time.split(':').map(Number)
    sessionTime.setHours(hours, minutes, 0)
    const diffMinutes = (sessionTime.getTime() - now.getTime()) / (1000 * 60)
    return diffMinutes <= 30 && diffMinutes >= 0
  }, [isToday, session.scheduled_start_time])

  return (
    <div
      className={`rounded-xl border-2 ${
        isSoon
          ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/10'
          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
      } p-4 transition-all hover:shadow-md ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-1 rounded-md text-xs font-medium ${sessionTypeInfo.color}`}
            >
              {sessionTypeInfo.icon} {sessionTypeInfo.label}
            </span>
            {isSoon && (
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 animate-pulse">
                ⏰ Pronto
              </span>
            )}
          </div>
          <h4 className="font-semibold text-neutral-900 dark:text-white line-clamp-1">
            {session.lesson_title}
          </h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-1">
            {session.course_name}
          </p>
        </div>
      </div>

      {/* Time and Duration */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 dark:text-neutral-400">📅</span>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {sessionDate}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 dark:text-neutral-400">🕐</span>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {timeRange}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 dark:text-neutral-400">⏱️</span>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {formatStudyTime(session.duration_minutes)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onStartSession && (
          <button
            onClick={() => onStartSession(session.session_id)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              isSoon
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {isSoon ? '▶️ Comenzar ahora' : '▶️ Iniciar sesión'}
          </button>
        )}
        {onReschedule && (
          <button
            onClick={() => onReschedule(session.session_id)}
            className="px-4 py-2 rounded-lg font-medium text-sm bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 transition-colors"
            title="Reprogramar sesión"
          >
            📅
          </button>
        )}
      </div>
    </div>
  )
}

// Componente para listar múltiples sesiones próximas
interface NextSessionsListProps {
  sessions: NextSession[]
  onStartSession?: (sessionId: string) => void
  onReschedule?: (sessionId: string) => void
  className?: string
}

export function NextSessionsList({
  sessions,
  onStartSession,
  onReschedule,
  className = '',
}: NextSessionsListProps) {
  if (sessions.length === 0) {
    return (
      <div
        className={`rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-8 text-center ${className}`}
      >
        <div className="text-6xl mb-3">📅</div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          No hay sesiones próximas
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Crea un plan de estudio para comenzar a aprender
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          🎯 Próximas Sesiones
        </h3>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {sessions.length} {sessions.length === 1 ? 'sesión' : 'sesiones'}
        </span>
      </div>

      {sessions.map((session) => (
        <NextSessionCard
          key={session.session_id}
          session={session}
          onStartSession={onStartSession}
          onReschedule={onReschedule}
        />
      ))}
    </div>
  )
}
