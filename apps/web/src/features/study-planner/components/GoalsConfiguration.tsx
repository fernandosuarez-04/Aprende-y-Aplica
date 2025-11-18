'use client'

import { useState } from 'react'
import {
  GoalsConfiguration as GoalsConfigType,
  LearningGoal,
  LearningPace,
  PriorityFocus,
  LEARNING_GOAL_LABELS,
  LEARNING_GOAL_DESCRIPTIONS,
  LEARNING_PACE_LABELS,
  LEARNING_PACE_DESCRIPTIONS,
  PRIORITY_FOCUS_LABELS,
  PRIORITY_FOCUS_DESCRIPTIONS,
} from '../types/ai-wizard.types'
import {
  RocketIcon,
  TargetIcon,
  CertificateIcon,
  SproutIcon,
  CheckCircleIcon,
  CompassIcon,
  TurtleIcon,
  WalkIcon,
  RunIcon,
  BoltIcon,
  BrainIcon,
  ScaleIcon,
} from './icons/ProfessionalIcons'

interface GoalsConfigurationProps {
  value: GoalsConfigType
  onChange: (goals: GoalsConfigType) => void
  className?: string
}

export function GoalsConfiguration({
  value,
  onChange,
  className = '',
}: GoalsConfigurationProps) {
  const learningGoals: LearningGoal[] = [
    'career_advancement',
    'skill_acquisition',
    'certification',
    'personal_growth',
    'project_completion',
    'exploration',
  ]

  const learningPaces: LearningPace[] = ['relaxed', 'moderate', 'intensive']
  const priorityFocuses: PriorityFocus[] = ['completion', 'retention', 'balanced']

  const getGoalIcon = (goal: LearningGoal) => {
    const icons: Record<LearningGoal, React.ReactNode> = {
      career_advancement: <RocketIcon className="text-current" size={28} />,
      skill_acquisition: <TargetIcon className="text-current" size={28} />,
      certification: <CertificateIcon className="text-current" size={28} />,
      personal_growth: <SproutIcon className="text-current" size={28} />,
      project_completion: <CheckCircleIcon className="text-current" size={28} />,
      exploration: <CompassIcon className="text-current" size={28} />,
    }
    return icons[goal]
  }

  const getPaceIcon = (pace: LearningPace) => {
    const icons: Record<LearningPace, React.ReactNode> = {
      relaxed: <TurtleIcon className="text-current" size={32} />,
      moderate: <WalkIcon className="text-current" size={32} />,
      intensive: <RunIcon className="text-current" size={32} />,
    }
    return icons[pace]
  }

  const getFocusIcon = (focus: PriorityFocus) => {
    const icons: Record<PriorityFocus, React.ReactNode> = {
      completion: <BoltIcon className="text-current" size={32} />,
      retention: <BrainIcon className="text-current" size={32} />,
      balanced: <ScaleIcon className="text-current" size={32} />,
    }
    return icons[focus]
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Define tus Objetivos de Aprendizaje
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          La IA creará un plan personalizado basado en tus metas y preferencias
        </p>
      </div>

      {/* Primary Goal */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          ¿Cuál es tu objetivo principal? *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {learningGoals.map((goal) => {
            const isSelected = value.primary_goal === goal

            return (
              <button
                key={goal}
                type="button"
                onClick={() => onChange({ ...value, primary_goal: goal })}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 text-blue-600 dark:text-blue-400">{getGoalIcon(goal)}</span>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-semibold mb-1 ${
                        isSelected
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {LEARNING_GOAL_LABELS[goal]}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {LEARNING_GOAL_DESCRIPTIONS[goal]}
                    </p>
                  </div>
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
              </button>
            )
          })}
        </div>
      </div>

      {/* Target Completion Date (Optional) */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          ¿Tienes una fecha objetivo? (Opcional)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={
              value.target_completion_date
                ? value.target_completion_date.toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value) : undefined
              onChange({ ...value, target_completion_date: date })
            }}
            min={new Date().toISOString().split('T')[0]}
            className="flex-1 px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
          />
          {value.target_completion_date && (
            <button
              type="button"
              onClick={() => onChange({ ...value, target_completion_date: undefined })}
              className="px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          La IA optimizará tu plan para cumplir esta fecha si es posible
        </p>
      </div>

      {/* Learning Pace */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          ¿A qué ritmo quieres aprender? *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {learningPaces.map((pace) => {
            const isSelected = value.learning_pace === pace

            return (
              <button
                key={pace}
                type="button"
                onClick={() => onChange({ ...value, learning_pace: pace })}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <span className="mb-2 flex justify-center text-blue-600 dark:text-blue-400">{getPaceIcon(pace)}</span>
                  <h4
                    className={`font-semibold mb-1 ${
                      isSelected
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {LEARNING_PACE_LABELS[pace]}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {LEARNING_PACE_DESCRIPTIONS[pace]}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Priority Focus */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          ¿Qué es más importante para ti? *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {priorityFocuses.map((focus) => {
            const isSelected = value.priority_focus === focus

            return (
              <button
                key={focus}
                type="button"
                onClick={() => onChange({ ...value, priority_focus: focus })}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <span className="mb-2 flex justify-center text-blue-600 dark:text-blue-400">{getFocusIcon(focus)}</span>
                  <h4
                    className={`font-semibold mb-1 ${
                      isSelected
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {PRIORITY_FOCUS_LABELS[focus]}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {PRIORITY_FOCUS_DESCRIPTIONS[focus]}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Daily Study Goal (Optional) */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Meta de estudio diario (Opcional)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min="15"
            max="480"
            step="15"
            value={value.daily_study_goal_minutes || ''}
            onChange={(e) => {
              const minutes = e.target.value ? parseInt(e.target.value) : undefined
              onChange({ ...value, daily_study_goal_minutes: minutes })
            }}
            placeholder="Minutos por día"
            className="flex-1 px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
          />
          {value.daily_study_goal_minutes && (
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {Math.floor(value.daily_study_goal_minutes / 60)}h{' '}
              {value.daily_study_goal_minutes % 60}m
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Si no especificas, la IA calculará el tiempo óptimo según tu disponibilidad
        </p>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
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
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
              Sobre el plan con IA
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              La IA utilizará técnicas científicas como repetición espaciada e intercalado de
              contenidos para optimizar tu aprendizaje según tus objetivos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
