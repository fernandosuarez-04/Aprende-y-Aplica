'use client'

import { AIPlanPreview as AIPlanPreviewType, AIOptimizationInsight } from '../types/ai-wizard.types'
import { PlanPreview } from './PlanPreview'

interface AIPlanPreviewProps {
  preview: AIPlanPreviewType
  onEdit: () => void
  onConfirm: () => void
  isLoading?: boolean
  className?: string
}

export function AIPlanPreview({
  preview,
  onEdit,
  onConfirm,
  isLoading = false,
  className = '',
}: AIPlanPreviewProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-orange-600 dark:text-orange-400'
  }

  const getScoreRingColor = (score: number): string => {
    if (score >= 80) return '#10b981' // green-500
    if (score >= 60) return '#f59e0b' // yellow-500
    return '#f97316' // orange-500
  }

  const CircularProgress = ({ score, label }: { score: number; label: string }) => {
    const radius = 40
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (score / 100) * circumference

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              stroke={getScoreRingColor(score)}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">/ 100</span>
          </div>
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2 text-center">
          {label}
        </span>
      </div>
    )
  }

  const InsightCard = ({ insight }: { insight: AIOptimizationInsight }) => {
    const bgColors = {
      info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      tip: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    }

    const textColors = {
      info: 'text-blue-800 dark:text-blue-200',
      tip: 'text-green-800 dark:text-green-200',
      warning: 'text-yellow-800 dark:text-yellow-200',
    }

    return (
      <div className={`p-3 rounded-lg border ${bgColors[insight.type]}`}>
        <div className="flex items-start gap-2">
          {insight.icon && <span className="text-lg flex-shrink-0">{insight.icon}</span>}
          <p className={`text-sm ${textColors[insight.type]} flex-1`}>{insight.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* AI Metadata Section */}
      <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200 dark:border-purple-700 rounded-2xl">
        {/* Header with AI Badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
              Plan Generado con IA
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Algoritmo v{preview.ai_metadata.algorithm_version} •{' '}
              {new Date(preview.ai_metadata.generation_timestamp).toLocaleString('es-ES')}
            </p>
          </div>
        </div>

        {/* Optimization Scores */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-4">
            Puntuaciones de Optimización
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CircularProgress
              score={preview.ai_metadata.scores.retention_score}
              label="Retención"
            />
            <CircularProgress
              score={preview.ai_metadata.scores.completion_score}
              label="Completación"
            />
            <CircularProgress
              score={preview.ai_metadata.scores.balance_score}
              label="Balance"
            />
          </div>
        </div>

        {/* Techniques Applied */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3">
            Técnicas Científicas Aplicadas
          </h4>
          <div className="flex flex-wrap gap-2">
            {preview.ai_metadata.techniques_applied.map((technique) => (
              <span
                key={technique}
                className="px-3 py-1.5 bg-white/80 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 rounded-full text-sm font-medium border border-purple-300 dark:border-purple-600"
              >
                {technique === 'spaced_repetition' && '📚 Repetición Espaciada'}
                {technique === 'interleaving' && '🔀 Intercalado'}
                {technique === 'pomodoro' && '🍅 Pomodoro'}
                {technique === 'load_balancing' && '⚖️ Balance de Carga'}
                {technique === 'complexity_adaptation' && '📈 Adaptación de Complejidad'}
                {!['spaced_repetition', 'interleaving', 'pomodoro', 'load_balancing', 'complexity_adaptation'].includes(technique) && technique}
              </span>
            ))}
          </div>
        </div>

        {/* AI Reasoning */}
        {preview.ai_metadata.reasoning && (
          <div className="p-4 bg-white/60 dark:bg-purple-900/30 rounded-xl border border-purple-300 dark:border-purple-600">
            <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Explicación de la IA
            </h4>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              {preview.ai_metadata.reasoning}
            </p>
          </div>
        )}
      </div>

      {/* Optimization Insights */}
      {preview.insights && preview.insights.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recomendaciones Personalizadas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {preview.insights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Plan Preview (reusing existing component) */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Vista Previa del Plan
        </h4>
        <PlanPreview
          preview={{
            plan_name: preview.plan_name,
            total_sessions: preview.total_sessions,
            total_study_hours: preview.total_study_hours,
            estimated_completion_date: preview.estimated_completion_date,
            sessions_by_week: preview.sessions_by_week,
            sessions_by_course: preview.sessions_by_course,
          }}
          onEdit={onEdit}
          onConfirm={onConfirm}
          isLoading={isLoading}
          hideActions={true} // We'll show our own actions
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onEdit}
          disabled={isLoading}
          className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Editar Plan
        </button>

        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-8 py-3 text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Creando Plan...
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
                <path d="M5 13l4 4L19 7" />
              </svg>
              Confirmar y Crear Plan
            </>
          )}
        </button>
      </div>

      {/* Final Note */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-purple-800 dark:text-purple-200 font-medium mb-1">
              Listo para comenzar
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Tu plan ha sido optimizado usando algoritmos de aprendizaje científico. Podrás ajustar
              las sesiones individuales después de crear el plan si lo necesitas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
