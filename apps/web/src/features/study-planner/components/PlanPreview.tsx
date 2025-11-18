'use client'

import { PlanPreview as PlanPreviewType, PreviewSession, DAY_LABELS } from '../types/manual-wizard.types'
import { formatTimeEstimate } from '@/lib/supabase/study-planner-types'

interface PlanPreviewProps {
  preview: PlanPreviewType
  onEdit?: () => void
  onConfirm?: () => void
  isLoading?: boolean
  className?: string
}

export function PlanPreview({
  preview,
  onEdit,
  onConfirm,
  isLoading = false,
  className = '',
}: PlanPreviewProps) {
  // Group sessions by week
  const sessionsByWeek = Array.from(preview.sessions_by_week.entries())
    .sort(([a], [b]) => a - b)
    .slice(0, 4) // Show first 4 weeks

  // Calculate stats
  const sessionsPerWeek = preview.total_sessions / sessionsByWeek.length
  const hoursPerWeek = preview.total_study_hours / sessionsByWeek.length

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Vista Previa de tu Plan
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Revisa cómo se distribuirán tus sesiones de estudio
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Total Sesiones</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {preview.total_sessions}
          </div>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="text-xs text-green-700 dark:text-green-300 mb-1">Horas Totales</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {Math.round(preview.total_study_hours)}h
          </div>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="text-xs text-purple-700 dark:text-purple-300 mb-1">Por Semana</div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {Math.round(sessionsPerWeek)}
          </div>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="text-xs text-orange-700 dark:text-orange-300 mb-1">Finalización</div>
          <div className="text-sm font-bold text-orange-900 dark:text-orange-100">
            {preview.estimated_completion_date.toLocaleDateString('es-ES', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          Distribución por Semana
        </h4>
        <div className="space-y-4">
          {sessionsByWeek.map(([weekNum, sessions]) => {
            const weekStart = sessions[0]?.date
            const weekEnd = sessions[sessions.length - 1]?.date

            // Group sessions by day
            const sessionsByDay = sessions.reduce((acc, session) => {
              const day = session.day
              if (!acc[day]) acc[day] = []
              acc[day].push(session)
              return acc
            }, {} as Record<string, PreviewSession[]>)

            return (
              <div
                key={weekNum}
                className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white">
                      Semana {weekNum}
                    </h5>
                    {weekStart && weekEnd && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {weekStart.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}{' '}
                        - {weekEnd.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {sessions.length} sesiones
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeEstimate(
                        sessions.reduce((sum, s) => sum + s.duration_minutes, 0)
                      )}
                    </p>
                  </div>
                </div>

                {/* Sessions by day */}
                <div className="space-y-2">
                  {Object.entries(sessionsByDay).map(([day, daySessions]) => (
                    <div key={day} className="flex items-start gap-3">
                      <div className="w-20 text-xs font-medium text-gray-600 dark:text-gray-400 pt-2">
                        {DAY_LABELS[day as keyof typeof DAY_LABELS]}
                      </div>
                      <div className="flex-1 space-y-2">
                        {daySessions.map((session, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                  {session.lesson_title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {session.course_title}
                                </p>
                              </div>
                              <div className="text-right whitespace-nowrap">
                                <p className="text-xs font-medium text-gray-900 dark:text-white">
                                  {session.start_time}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {session.duration_minutes} min
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {sessionsByWeek.length > 4 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
            Mostrando las primeras 4 semanas de {sessionsByWeek.length} semanas totales
          </p>
        )}
      </div>

      {/* Course Distribution */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          Distribución por Curso
        </h4>
        <div className="space-y-3">
          {Array.from(preview.sessions_by_course.entries()).map(([courseId, sessions]) => {
            const percentage = (sessions.length / preview.total_sessions) * 100

            return (
              <div key={courseId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {sessions[0]?.course_title}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {sessions.length} sesiones ({Math.round(percentage)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {onEdit && (
          <button
            onClick={onEdit}
            disabled={isLoading}
            className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Editar Plan
          </button>
        )}
        {onConfirm && (
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Creando Plan...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Confirmar y Crear</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
