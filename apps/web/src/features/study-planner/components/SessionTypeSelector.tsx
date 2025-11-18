'use client'

import { useState } from 'react'
import {
  SessionType,
  SESSION_TYPE_DURATIONS,
  formatSessionType,
} from '@/lib/supabase/study-planner-types'
import {
  BoltIcon,
  BookOpenIcon,
  TargetIcon,
  LightbulbIcon,
} from './icons/ProfessionalIcons'

interface SessionTypeSelectorProps {
  value: SessionType
  onChange: (sessionType: SessionType) => void
  disabled?: boolean
  showDescription?: boolean
  className?: string
}

export function SessionTypeSelector({
  value,
  onChange,
  disabled = false,
  showDescription = true,
  className = '',
}: SessionTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<SessionType>(value)

  const handleChange = (type: SessionType) => {
    setSelectedType(type)
    onChange(type)
  }

  const sessionTypes: SessionType[] = ['short', 'medium', 'long']

  const getDescription = (type: SessionType): string => {
    const descriptions: Record<SessionType, string> = {
      short: 'Ideal para ejecutivos con poco tiempo. Sesiones rápidas y enfocadas.',
      medium: 'Equilibrio perfecto entre profundidad y tiempo. Recomendado para la mayoría.',
      long: 'Para estudio profundo y contenido complejo. Máxima inmersión.',
    }
    return descriptions[type]
  }

  const getBenefits = (type: SessionType): string[] => {
    const benefits: Record<SessionType, string[]> = {
      short: [
        'Fácil de integrar en agenda ocupada',
        'Ideal para repasos rápidos',
        'Menor fatiga mental',
      ],
      medium: [
        'Tiempo suficiente para aprender',
        'Buena retención de información',
        'Balance ideal trabajo-estudio',
      ],
      long: [
        'Inmersión profunda en temas',
        'Ideal para proyectos prácticos',
        'Máximo aprovechamiento',
      ],
    }
    return benefits[type]
  }

  const getSessionIcon = (type: SessionType) => {
    const icons: Record<SessionType, React.ReactNode> = {
      short: <BoltIcon className="text-current" size={32} />,
      medium: <BookOpenIcon className="text-current" size={32} />,
      long: <TargetIcon className="text-current" size={32} />,
    }
    return icons[type]
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Tipo de Sesión de Estudio
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sessionTypes.map((type) => {
          const duration = SESSION_TYPE_DURATIONS[type]
          const isSelected = selectedType === type
          const benefits = getBenefits(type)

          return (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => handleChange(type)}
              className={`
                relative p-5 rounded-xl border-2 text-left transition-all duration-200
                ${
                  isSelected
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Icon and Title */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-blue-600 dark:text-blue-400">
                  {getSessionIcon(type)}
                </span>
                <div>
                  <h3
                    className={`font-bold text-lg ${
                      isSelected
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {formatSessionType(type).split('(')[0].trim()}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {duration.min_duration_minutes}-{duration.max_duration_minutes} minutos
                  </p>
                </div>
              </div>

              {/* Description */}
              {showDescription && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {getDescription(type)}
                </p>
              )}

              {/* Benefits */}
              <ul className="space-y-1.5">
                {benefits.map((benefit, index) => (
                  <li
                    key={index}
                    className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5"
                  >
                    <span
                      className={`inline-block mt-0.5 ${
                        isSelected
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      ✓
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Info message */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 dark:text-blue-400 mt-0.5">
            <LightbulbIcon size={20} />
          </span>
          <div className="flex-1">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
              Recomendación basada en tu perfil
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              El planificador IA ajustará automáticamente la duración según la complejidad del
              curso y tu disponibilidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
