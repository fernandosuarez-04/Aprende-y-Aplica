'use client'

import { CourseComplexity } from '@/lib/supabase/study-planner-types'

interface ComplexityBadgeProps {
  complexity: CourseComplexity
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ComplexityBadge({
  complexity,
  showDetails = false,
  size = 'md',
  className = '',
}: ComplexityBadgeProps) {
  const getComplexityLevel = (): string => {
    const multiplier = complexity.complexity_multiplier

    if (multiplier >= 1.3) return 'Muy Alto'
    if (multiplier >= 1.15) return 'Alto'
    if (multiplier >= 1.05) return 'Medio-Alto'
    if (multiplier >= 0.95) return 'Medio'
    return 'Bajo'
  }

  const getComplexityColor = (): {
    bg: string
    text: string
    border: string
    icon: string
  } => {
    const multiplier = complexity.complexity_multiplier

    if (multiplier >= 1.3) {
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-300 dark:border-red-700',
        icon: '🔥',
      }
    }
    if (multiplier >= 1.15) {
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-300 dark:border-orange-700',
        icon: '⚠️',
      }
    }
    if (multiplier >= 1.05) {
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-300 dark:border-yellow-700',
        icon: '⚡',
      }
    }
    if (multiplier >= 0.95) {
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-300 dark:border-blue-700',
        icon: '📘',
      }
    }
    return {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-300 dark:border-green-700',
      icon: '✓',
    }
  }

  const formatLevel = (level: string): string => {
    const translations: Record<string, string> = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
    }
    return translations[level] || level
  }

  const formatCategory = (category: string): string => {
    const translations: Record<string, string> = {
      technical: 'Técnico',
      'data-science': 'Ciencia de Datos',
      conceptual: 'Conceptual',
      leadership: 'Liderazgo',
      practical: 'Práctico',
      creativity: 'Creatividad',
      theoretical: 'Teórico',
    }
    return translations[category] || category
  }

  const colors = getComplexityColor()
  const level = getComplexityLevel()

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  if (!showDetails) {
    // Simple badge
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} ${colors.bg} ${colors.text} ${colors.border} border rounded-full font-medium ${className}`}
      >
        <span>{colors.icon}</span>
        <span>{level}</span>
      </span>
    )
  }

  // Detailed card
  return (
    <div
      className={`p-4 ${colors.bg} ${colors.border} border rounded-lg ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{colors.icon}</span>
          <div>
            <h4 className={`font-bold ${colors.text}`}>Complejidad: {level}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Multiplicador: {complexity.complexity_multiplier.toFixed(2)}x
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Nivel:</span>
          <span className={`font-medium ${colors.text}`}>
            {formatLevel(complexity.level)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Categoría:</span>
          <span className={`font-medium ${colors.text}`}>
            {formatCategory(complexity.category)}
          </span>
        </div>
      </div>

      {/* Impact message */}
      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {complexity.complexity_multiplier > 1.1
            ? 'Este curso puede requerir sesiones más largas o más tiempo total de estudio.'
            : complexity.complexity_multiplier < 0.95
              ? 'Este curso es relativamente accesible. Perfecto para aprendizaje rápido.'
              : 'Este curso tiene una complejidad estándar. Tiempo de estudio balanceado.'}
        </p>
      </div>
    </div>
  )
}
