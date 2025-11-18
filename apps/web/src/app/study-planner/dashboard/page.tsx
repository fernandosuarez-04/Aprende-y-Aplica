'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  StreakDisplay,
  DailyProgressCard,
  WeeklyProgressBar,
  NextSessionsList,
  CalendarView,
  CalendarSyncSettings,
} from '@/features/study-planner/components'
import type { DashboardStats } from '@/features/study-planner/types/streak.types'

export default function StudyPlannerDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showCalendarSync, setShowCalendarSync] = useState(false)

  // Cargar datos del dashboard
  useEffect(() => {
    async function loadDashboardStats() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/study-planner/dashboard/stats')

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Error al cargar estadísticas del dashboard')
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Error loading dashboard stats:', err)
        setError(
          err instanceof Error ? err.message : 'Error al cargar el dashboard'
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardStats()
  }, [router])

  // Handlers para acciones de sesiones
  const handleStartSession = async (sessionId: string) => {
    router.push(`/study-planner/session/${sessionId}`)
  }

  const handleRescheduleSession = async (sessionId: string) => {
    // TODO: Implementar modal de reprogramación
    console.log('Reschedule session:', sessionId)
  }

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    // TODO: Mostrar detalles del día en un modal o panel
    console.log('Date clicked:', date)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">
              Cargando tu dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Error al cargar el dashboard
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {error || 'No se pudieron cargar las estadísticas'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Calcular stats de hoy desde daily_progress
  const today = new Date().toISOString().split('T')[0]
  const todayData = stats.daily_progress_last_30_days.find((d) => d.date === today)
  const todayStats = {
    sessions_completed: todayData?.sessions_completed || 0,
    sessions_pending:
      (stats.next_sessions.filter((s) => s.scheduled_date === today).length || 0) -
      (todayData?.sessions_completed || 0),
    study_minutes: todayData?.study_minutes || 0,
    target_minutes: undefined, // Se puede calcular desde las preferencias del usuario
  }

  // Calcular datos de la semana para WeeklyProgressBar
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Último domingo
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    const dayProgress = stats.daily_progress_last_30_days.find((d) => d.date === dateStr)

    return {
      date: dateStr,
      had_activity: dayProgress?.had_activity || false,
      sessions_completed: dayProgress?.sessions_completed || 0,
      study_minutes: dayProgress?.study_minutes || 0,
    }
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Dashboard de Estudio
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Visualiza tu progreso y mantén tu racha activa
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Streak & Daily Progress */}
        <div className="space-y-6">
          <StreakDisplay
            currentStreak={stats.streak.current_streak}
            longestStreak={stats.streak.longest_streak}
            lastSessionDate={stats.streak.last_session_date}
          />

          <DailyProgressCard todayStats={todayStats} />
        </div>

        {/* Middle Column - Weekly Progress & Next Sessions */}
        <div className="space-y-6">
          <WeeklyProgressBar weeklyData={weekData} />

          <div className="lg:col-span-1">
            <NextSessionsList
              sessions={stats.next_sessions.slice(0, 3)}
              onStartSession={handleStartSession}
              onReschedule={handleRescheduleSession}
            />
          </div>
        </div>

        {/* Right Column - Stats Cards */}
        <div className="space-y-6">
          {/* Monthly Stats Card */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              📈 Stats del Mes
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Sesiones completadas
                </span>
                <span className="text-xl font-bold text-neutral-900 dark:text-white">
                  {stats.monthly_stats.sessions_completed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Días activos
                </span>
                <span className="text-xl font-bold text-neutral-900 dark:text-white">
                  {stats.monthly_stats.days_with_activity}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Tiempo total
                </span>
                <span className="text-xl font-bold text-neutral-900 dark:text-white">
                  {Math.floor(stats.monthly_stats.study_minutes / 60)}h{' '}
                  {stats.monthly_stats.study_minutes % 60}m
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              ⚡ Acciones Rápidas
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/study-planner/create')}
                className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors text-left"
              >
                ➕ Crear nuevo plan
              </button>
              <button
                onClick={() => router.push('/study-planner/plans')}
                className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white font-medium rounded-lg transition-colors text-left"
              >
                📋 Ver mis planes
              </button>
              <button
                onClick={() => router.push('/courses')}
                className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white font-medium rounded-lg transition-colors text-left"
              >
                📚 Explorar cursos
              </button>
              <button
                onClick={() => setShowCalendarSync(true)}
                className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white font-medium rounded-lg transition-colors text-left"
              >
                📅 Sincronizar calendarios
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Calendar Heatmap */}
      <div className="mt-6">
        <CalendarView
          dailyProgress={stats.daily_progress_last_30_days}
          onDateClick={handleDateClick}
          selectedDate={selectedDate || undefined}
        />
      </div>

      {/* Additional Sessions List (if more than 3) */}
      {stats.next_sessions.length > 3 && (
        <div className="mt-6">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                📅 Más Sesiones Próximas
              </h3>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {stats.next_sessions.length - 3} más
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.next_sessions.slice(3).map((session) => (
                <div
                  key={session.session_id}
                  className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer"
                  onClick={() => handleStartSession(session.session_id)}
                >
                  <div className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-1">
                    {session.lesson_title}
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    {session.scheduled_date} • {session.scheduled_start_time.slice(0, 5)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Sync Settings Modal */}
      <CalendarSyncSettings
        isOpen={showCalendarSync}
        onClose={() => setShowCalendarSync(false)}
      />
    </div>
  )
}
