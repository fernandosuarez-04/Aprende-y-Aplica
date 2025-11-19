'use client'

import {
  PreferencesConfiguration,
  ReviewStrategy,
  ContentOrdering,
  REVIEW_STRATEGY_LABELS,
  CONTENT_ORDERING_LABELS,
} from '../types/ai-wizard.types'
import { SessionType } from '@/lib/supabase/study-planner-types'
import { SessionTypeSelector } from './SessionTypeSelector'
import {
  BrainIcon,
  BoltIcon,
  ScaleIcon,
  BookStackIcon,
  ShuffleIcon,
  TrendingUpIcon,
  SparklesIcon,
  TomatoIcon,
  BellIcon,
  CalendarIcon,
} from './icons/ProfessionalIcons'

interface PreferencesConfigProps {
  value: PreferencesConfiguration
  onChange: (preferences: PreferencesConfiguration) => void
  className?: string
}

export function PreferencesConfig({
  value,
  onChange,
  className = '',
}: PreferencesConfigProps) {
  const reviewStrategies: ReviewStrategy[] = ['spaced_repetition', 'massed_practice', 'mixed']
  const contentOrderings: ContentOrdering[] = [
    'sequential',
    'interleaved',
    'difficulty_based',
    'ai_optimized',
  ]

  const getStrategyDescription = (strategy: ReviewStrategy): string => {
    const descriptions: Record<ReviewStrategy, string> = {
      spaced_repetition:
        'Repite contenidos en intervalos científicamente optimizados (1, 3, 7, 14, 30 días). Maximiza retención a largo plazo.',
      massed_practice:
        'Completa todo el contenido de forma continua sin repeticiones. Ideal para avanzar rápido.',
      mixed:
        'Combina ambas estrategias: avance continuo con algunas repeticiones clave. Balance óptimo.',
    }
    return descriptions[strategy]
  }

  const getOrderingDescription = (ordering: ContentOrdering): string => {
    const descriptions: Record<ContentOrdering, string> = {
      sequential:
        'Sigue el orden original de los cursos, módulo por módulo. Más lineal y estructurado.',
      interleaved:
        'Alterna entre cursos para mejorar transferencia de conocimientos. Método científicamente probado.',
      difficulty_based:
        'Progresa de contenido fácil a difícil gradualmente. Construye confianza paso a paso.',
      ai_optimized:
        'La IA combina múltiples estrategias para crear el orden óptimo según tus objetivos.',
    }
    return descriptions[ordering]
  }

  const getStrategyIcon = (strategy: ReviewStrategy) => {
    const icons: Record<ReviewStrategy, React.ReactNode> = {
      spaced_repetition: <BrainIcon className="text-current" size={28} />,
      massed_practice: <BoltIcon className="text-current" size={28} />,
      mixed: <ScaleIcon className="text-current" size={28} />,
    }
    return icons[strategy]
  }

  const getOrderingIcon = (ordering: ContentOrdering) => {
    const icons: Record<ContentOrdering, React.ReactNode> = {
      sequential: <BookStackIcon className="text-current" size={28} />,
      interleaved: <ShuffleIcon className="text-current" size={28} />,
      difficulty_based: <TrendingUpIcon className="text-current" size={28} />,
      ai_optimized: <SparklesIcon className="text-current" size={28} />,
    }
    return icons[ordering]
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Preferencias de Aprendizaje
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Personaliza cómo la IA organizará tu contenido y sesiones
        </p>
      </div>

      {/* Session Type Preference */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Duración preferida de sesiones *
        </label>
        <SessionTypeSelector
          value={value.session_type_preference}
          onChange={(type: SessionType) =>
            onChange({ ...value, session_type_preference: type })
          }
          showDescription={true}
        />
      </div>

      {/* Review Strategy */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Estrategia de repaso *
        </label>
        <div className="space-y-3">
          {reviewStrategies.map((strategy) => {
            const isSelected = value.review_strategy === strategy

            return (
              <button
                key={strategy}
                type="button"
                onClick={() => onChange({ ...value, review_strategy: strategy })}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 text-blue-600 dark:text-blue-400">{getStrategyIcon(strategy)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4
                        className={`font-semibold ${
                          isSelected
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {REVIEW_STRATEGY_LABELS[strategy]}
                      </h4>
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getStrategyDescription(strategy)}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Ordering */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Orden del contenido *
        </label>
        <div className="space-y-3">
          {contentOrderings.map((ordering) => {
            const isSelected = value.content_ordering === ordering

            return (
              <button
                key={ordering}
                type="button"
                onClick={() => onChange({ ...value, content_ordering: ordering })}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 text-blue-600 dark:text-blue-400">{getOrderingIcon(ordering)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4
                        className={`font-semibold ${
                          isSelected
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {CONTENT_ORDERING_LABELS[ordering]}
                      </h4>
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getOrderingDescription(ordering)}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Pomodoro Settings */}
      <div className="mb-8">
        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={value.enable_pomodoro}
            onChange={(e) => onChange({ ...value, enable_pomodoro: e.target.checked })}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <div className="flex items-center gap-2">
            <TomatoIcon className="text-red-500 dark:text-red-400" size={20} />
            <span className="font-semibold text-gray-900 dark:text-white">
              Habilitar Técnica Pomodoro
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Divide sesiones en ciclos de trabajo + descanso para máxima concentración
            </p>
          </div>
        </label>

        {value.enable_pomodoro && (
          <div className="ml-8 space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración de trabajo (minutos)
              </label>
              <input
                type="number"
                min="15"
                max="60"
                step="5"
                value={value.pomodoro_work_minutes || 25}
                onChange={(e) =>
                  onChange({
                    ...value,
                    pomodoro_work_minutes: parseInt(e.target.value) || 25,
                  })
                }
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Recomendado: 25 minutos (método Pomodoro clásico)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración de descanso (minutos)
              </label>
              <input
                type="number"
                min="3"
                max="15"
                step="1"
                value={value.pomodoro_break_minutes || 5}
                onChange={(e) =>
                  onChange({
                    ...value,
                    pomodoro_break_minutes: parseInt(e.target.value) || 5,
                  })
                }
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Recomendado: 5 minutos entre ciclos
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reminders */}
      <div className="mb-8">
        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={value.enable_reminders}
            onChange={(e) => onChange({ ...value, enable_reminders: e.target.checked })}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <div className="flex items-center gap-2">
            <BellIcon className="text-yellow-500 dark:text-yellow-400" size={20} />
            <span className="font-semibold text-gray-900 dark:text-white">
              Habilitar recordatorios
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Recibe notificaciones antes de tus sesiones programadas
            </p>
          </div>
        </label>

        {value.enable_reminders && (
          <div className="ml-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tiempo de anticipación (minutos)
            </label>
            <select
              value={value.reminder_minutes_before || 15}
              onChange={(e) =>
                onChange({
                  ...value,
                  reminder_minutes_before: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
            >
              <option value="5">5 minutos antes</option>
              <option value="15">15 minutos antes</option>
              <option value="30">30 minutos antes</option>
              <option value="60">1 hora antes</option>
            </select>
          </div>
        )}
      </div>

      {/* Rescheduling */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value.allow_session_rescheduling}
            onChange={(e) =>
              onChange({ ...value, allow_session_rescheduling: e.target.checked })
            }
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-purple-500 dark:text-purple-400" size={20} />
            <span className="font-semibold text-gray-900 dark:text-white">
              Permitir reprogramación de sesiones
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Podrás mover sesiones manualmente si surge algún imprevisto
            </p>
          </div>
        </label>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-purple-800 dark:text-purple-200 font-medium mb-1">
              Recomendación de IA
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              {value.review_strategy === 'spaced_repetition' && value.content_ordering === 'interleaved'
                ? 'Excelente combinación: Repetición espaciada + Intercalado maximizan la retención.'
                : value.content_ordering === 'ai_optimized'
                  ? 'Haz seleccionado que la IA decida el orden óptimo. Aplicaremos las mejores estrategias científicas.'
                  : 'Considera usar "AI Optimizada" para que apliquemos automáticamente las técnicas más efectivas.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
