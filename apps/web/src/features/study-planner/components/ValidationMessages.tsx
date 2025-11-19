'use client'

import { ValidationResult, ValidationError } from '../types/manual-wizard.types'

interface ValidationMessagesProps {
  validation: ValidationResult
  className?: string
}

export function ValidationMessages({
  validation,
  className = '',
}: ValidationMessagesProps) {
  const { errors, warnings } = validation

  if (errors.length === 0 && warnings.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                {errors.length === 1
                  ? 'Hay un error que debes corregir:'
                  : `Hay ${errors.length} errores que debes corregir:`}
              </h4>
              <ul className="space-y-2">
                {errors.map((error, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2"
                  >
                    <span className="flex-shrink-0 mt-1">•</span>
                    <div className="flex-1">
                      <span className="font-medium">{getFieldLabel(error.field)}:</span>{' '}
                      {error.message}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                {warnings.length === 1
                  ? 'Advertencia:'
                  : `${warnings.length} advertencias:`}
              </h4>
              <ul className="space-y-2">
                {warnings.map((warning, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-yellow-700 dark:text-yellow-400 flex items-start gap-2"
                  >
                    <span className="flex-shrink-0 mt-1">•</span>
                    <div className="flex-1">
                      <span className="font-medium">{getFieldLabel(warning.field)}:</span>{' '}
                      {warning.message}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Get human-readable label for validation field
 */
function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    // Course selection
    courses: 'Cursos',
    selected_courses: 'Cursos seleccionados',
    course_selection: 'Selección de cursos',

    // Session type
    session_type: 'Tipo de sesión',
    session_duration: 'Duración de sesión',

    // Schedule
    schedule: 'Horario',
    days: 'Días',
    time_slots: 'Horarios',
    start_date: 'Fecha de inicio',
    end_date: 'Fecha de fin',
    session_duration_minutes: 'Duración de sesión',
    break_duration_minutes: 'Duración de descanso',

    // Lessons
    lessons: 'Lecciones',
    lesson_time: 'Tiempo de lección',
    lesson_fit: 'Ajuste de lección',

    // General
    general: 'General',
    plan_name: 'Nombre del plan',
    availability: 'Disponibilidad',
  }

  return labels[field] || field
}

/**
 * Validation helper component for inline field validation
 */
interface FieldValidationProps {
  field: string
  validation: ValidationResult
  className?: string
}

export function FieldValidation({
  field,
  validation,
  className = '',
}: FieldValidationProps) {
  const fieldErrors = validation.errors.filter((e) => e.field === field)
  const fieldWarnings = validation.warnings.filter((w) => w.field === field)

  if (fieldErrors.length === 0 && fieldWarnings.length === 0) {
    return null
  }

  return (
    <div className={`mt-2 space-y-1 ${className}`}>
      {fieldErrors.map((error, idx) => (
        <div
          key={`error-${idx}`}
          className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
        >
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error.message}</span>
        </div>
      ))}

      {fieldWarnings.map((warning, idx) => (
        <div
          key={`warning-${idx}`}
          className="flex items-start gap-2 text-sm text-yellow-600 dark:text-yellow-400"
        >
          <svg
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{warning.message}</span>
        </div>
      ))}
    </div>
  )
}
