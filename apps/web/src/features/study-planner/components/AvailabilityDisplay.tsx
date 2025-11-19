'use client'

import { formatTimeEstimate } from '@/lib/supabase/study-planner-types'

interface UserAvailability {
  role: string
  company_size: string
  daily_minutes_min: number
  daily_minutes_max: number
  days_per_week_min: number
  days_per_week_max: number
  session_duration_min: number
  session_duration_max: number
  preferred_times: string[]
  max_lessons_per_day: number
  pomodoro_length: number
}

interface AvailabilityDisplayProps {
  availability: UserAvailability
  className?: string
  compact?: boolean
}

export function AvailabilityDisplay({
  availability,
  className = '',
  compact = false,
}: AvailabilityDisplayProps) {
  const formatTimeOfDay = (time: string): string => {
    const translations: Record<string, string> = {
      morning: '🌅 Mañana',
      afternoon: '☀️ Tarde',
      evening: '🌆 Noche',
      night: '🌙 Madrugada',
    }
    return translations[time] || time
  }

  const formatRole = (role: string): string => {
    // Format role name for display
    return role
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatCompanySize = (size: string): string => {
    const translations: Record<string, string> = {
      small: 'Pequeña (1-50)',
      medium: 'Mediana (51-250)',
      large: 'Grande (251-1000)',
      very_large: 'Muy Grande (1000+)',
    }
    return translations[size] || size
  }

  if (compact) {
    return (
      <div className={`p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg ${className}`}>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Tiempo diario:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {availability.daily_minutes_min}-{availability.daily_minutes_max} min
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Días/semana:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {availability.days_per_week_min}-{availability.days_per_week_max}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-blue-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-blue-200 dark:border-gray-700">
        <div className="w-12 h-12 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            Tu Disponibilidad Estimada
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatRole(availability.role)} · {formatCompanySize(availability.company_size)}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Time */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⏰</span>
            <h4 className="font-semibold text-gray-900 dark:text-white">Tiempo Diario</h4>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {availability.daily_minutes_min}-{availability.daily_minutes_max}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
              min/día
            </span>
          </p>
        </div>

        {/* Days per Week */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📅</span>
            <h4 className="font-semibold text-gray-900 dark:text-white">Días por Semana</h4>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {availability.days_per_week_min}-{availability.days_per_week_max}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
              días
            </span>
          </p>
        </div>

        {/* Session Duration */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⏱️</span>
            <h4 className="font-semibold text-gray-900 dark:text-white">Duración de Sesión</h4>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {availability.session_duration_min}-{availability.session_duration_max}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
              min
            </span>
          </p>
        </div>

        {/* Max Lessons */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📚</span>
            <h4 className="font-semibold text-gray-900 dark:text-white">Lecciones por Día</h4>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Hasta {availability.max_lessons_per_day}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
              lección{availability.max_lessons_per_day > 1 ? 'es' : ''}
            </span>
          </p>
        </div>
      </div>

      {/* Preferred Times */}
      <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
          Horarios Recomendados
        </h4>
        <div className="flex flex-wrap gap-2">
          {availability.preferred_times.map((time) => (
            <span
              key={time}
              className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
            >
              {formatTimeOfDay(time)}
            </span>
          ))}
        </div>
      </div>

      {/* Pomodoro Info */}
      <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🍅</span>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              Técnica Pomodoro Sugerida
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sesiones de <span className="font-bold">{availability.pomodoro_length} minutos</span>{' '}
              con descansos de 5 minutos. Esta técnica maximiza tu concentración y retención.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
