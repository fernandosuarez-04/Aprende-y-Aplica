'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  AIWizardState,
  AIWizardStep,
  getDefaultAIWizardState,
} from '../types/ai-wizard.types'
import { CourseForSelection } from '../types/manual-wizard.types'
import { GoalsConfiguration } from './GoalsConfiguration'
import { AIAvailabilityConfig } from './AIAvailabilityConfig'
import { PreferencesConfig } from './PreferencesConfig'
import { AICourseSelector } from './AICourseSelector'
import { AIPlanPreview } from './AIPlanPreview'

interface AIWizardProps {
  available_courses: CourseForSelection[]
  onComplete: (planId: string) => void
  onCancel: () => void
  className?: string
}

export function AIWizard({
  available_courses,
  onComplete,
  onCancel,
  className = '',
}: AIWizardProps) {
  const [state, setState] = useState<AIWizardState>(getDefaultAIWizardState())

  // =====================================================
  // Navigation
  // =====================================================

  const goToStep = useCallback((step: AIWizardStep) => {
    setState((prev) => ({ ...prev, current_step: step }))
  }, [])

  const goNext = useCallback(() => {
    const steps: AIWizardStep[] = ['goals', 'availability', 'preferences', 'courses', 'preview']
    const currentIndex = steps.indexOf(state.current_step)
    if (currentIndex < steps.length - 1) {
      goToStep(steps[currentIndex + 1])
    }
  }, [state.current_step, goToStep])

  const goBack = useCallback(() => {
    const steps: AIWizardStep[] = ['goals', 'availability', 'preferences', 'courses', 'preview']
    const currentIndex = steps.indexOf(state.current_step)
    if (currentIndex > 0) {
      goToStep(steps[currentIndex - 1])
    }
  }, [state.current_step, goToStep])

  // =====================================================
  // Validation
  // =====================================================

  const isStepValid = useCallback((): boolean => {
    switch (state.current_step) {
      case 'goals':
        return !!(state.goals.primary_goal && state.goals.learning_pace && state.goals.priority_focus)

      case 'availability':
        return state.availability.final.study_days.length > 0 && state.availability.final.daily_minutes >= 15

      case 'preferences':
        return !!(state.preferences.session_type_preference && state.preferences.review_strategy && state.preferences.content_ordering)

      case 'courses':
        return state.selected_courses.length > 0

      case 'preview':
        return true

      default:
        return false
    }
  }, [state])

  // =====================================================
  // Preview Generation
  // =====================================================

  const generatePreview = useCallback(async () => {
    setState((prev) => ({ ...prev, is_generating: true, errors: [] }))

    try {
      const response = await fetch('/api/study-planner/ai/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: state.goals,
          availability: state.availability.final,
          preferences: state.preferences,
          selected_courses: state.selected_courses,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al generar preview')
      }

      const data = await response.json()

      // Convert dates from strings
      const preview = {
        ...data.preview,
        estimated_completion_date: new Date(data.preview.estimated_completion_date),
        sessions_by_week: new Map(
          Object.entries(data.preview.sessions_by_week).map(([week, sessions]: [string, any]) => [
            parseInt(week),
            sessions.map((s: any) => ({
              ...s,
              date: new Date(s.date),
            })),
          ])
        ),
        sessions_by_course: new Map(
          Object.entries(data.preview.sessions_by_course).map(([courseId, sessions]: [string, any]) => [
            courseId,
            sessions.map((s: any) => ({
              ...s,
              date: new Date(s.date),
            })),
          ])
        ),
      }

      setState((prev) => ({
        ...prev,
        preview,
        is_generating: false,
      }))
    } catch (error) {
      console.error('Error generating preview:', error)
      setState((prev) => ({
        ...prev,
        is_generating: false,
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
      }))
    }
  }, [state.goals, state.availability, state.preferences, state.selected_courses])

  // Auto-generate preview when entering preview step
  useEffect(() => {
    if (state.current_step === 'preview' && !state.preview && !state.is_generating) {
      generatePreview()
    }
  }, [state.current_step, state.preview, state.is_generating, generatePreview])

  // =====================================================
  // Plan Creation
  // =====================================================

  const handleConfirmPlan = useCallback(async () => {
    setState((prev) => ({ ...prev, is_loading: true, errors: [] }))

    try {
      const response = await fetch('/api/study-planner/ai/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_name: state.preview?.plan_name || `Plan IA - ${new Date().toLocaleDateString('es-ES')}`,
          goals: state.goals,
          availability: state.availability.final,
          preferences: state.preferences,
          selected_courses: state.selected_courses,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al crear plan')
      }

      const data = await response.json()

      // Success!
      onComplete(data.plan_id)
    } catch (error) {
      console.error('Error creating plan:', error)
      setState((prev) => ({
        ...prev,
        is_loading: false,
        errors: [error instanceof Error ? error.message : 'Error al crear el plan'],
      }))
    }
  }, [state.goals, state.availability, state.preferences, state.selected_courses, state.preview, onComplete])

  // =====================================================
  // Step Rendering
  // =====================================================

  const renderStep = () => {
    switch (state.current_step) {
      case 'goals':
        return (
          <GoalsConfiguration
            value={state.goals}
            onChange={(goals) => setState((prev) => ({ ...prev, goals }))}
          />
        )

      case 'availability':
        return (
          <AIAvailabilityConfig
            value={state.availability}
            onChange={(availability) => setState((prev) => ({ ...prev, availability }))}
          />
        )

      case 'preferences':
        return (
          <PreferencesConfig
            value={state.preferences}
            onChange={(preferences) => setState((prev) => ({ ...prev, preferences }))}
          />
        )

      case 'courses':
        return (
          <AICourseSelector
            available_courses={available_courses}
            selected_courses={state.selected_courses}
            onChange={(selected_courses) => setState((prev) => ({ ...prev, selected_courses }))}
          />
        )

      case 'preview':
        if (state.is_generating) {
          return (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-900 dark:text-white font-medium text-lg mb-2">
                Generando tu plan con IA...
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Aplicando técnicas científicas de aprendizaje
              </p>
            </div>
          )
        }

        if (state.errors.length > 0) {
          return (
            <div className="text-center py-12">
              <div className="mb-4 text-red-600 dark:text-red-400">
                {state.errors.map((error, idx) => (
                  <p key={idx}>{error}</p>
                ))}
              </div>
              <button
                onClick={generatePreview}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200"
              >
                Reintentar
              </button>
            </div>
          )
        }

        if (!state.preview) {
          return null
        }

        return (
          <AIPlanPreview
            preview={state.preview}
            onEdit={() => goToStep('courses')}
            onConfirm={handleConfirmPlan}
            isLoading={state.is_loading}
          />
        )

      default:
        return null
    }
  }

  // =====================================================
  // Progress Indicator
  // =====================================================

  const steps: Array<{ key: AIWizardStep; label: string; number: number }> = [
    { key: 'goals', label: 'Objetivos', number: 1 },
    { key: 'availability', label: 'Disponibilidad', number: 2 },
    { key: 'preferences', label: 'Preferencias', number: 3 },
    { key: 'courses', label: 'Cursos', number: 4 },
    { key: 'preview', label: 'Vista Previa', number: 5 },
  ]

  const currentStepIndex = steps.findIndex((s) => s.key === state.current_step)

  return (
    <div className={className}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const isActive = step.key === state.current_step
            const isCompleted = idx < currentStepIndex
            const isClickable = idx <= currentStepIndex

            return (
              <div key={step.key} className="flex items-center flex-1">
                <button
                  onClick={() => isClickable && goToStep(step.key)}
                  disabled={!isClickable}
                  className={`flex items-center gap-3 ${
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                        : isCompleted
                          ? 'bg-gradient-to-br from-green-600 to-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium hidden md:inline ${
                      isActive
                        ? 'text-purple-600 dark:text-purple-400'
                        : isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Connector line */}
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-full transition-all duration-300 ${
                        idx < currentStepIndex
                          ? 'bg-gradient-to-r from-green-600 to-green-500'
                          : 'bg-transparent'
                      }`}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">{renderStep()}</div>

      {/* Navigation Buttons */}
      {state.current_step !== 'preview' && (
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={currentStepIndex === 0 ? onCancel : goBack}
            disabled={state.is_loading}
            className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStepIndex === 0 ? 'Cancelar' : 'Atrás'}
          </button>

          <button
            onClick={goNext}
            disabled={!isStepValid() || state.is_loading}
            className="px-8 py-3 text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Error Messages */}
      {state.errors.length > 0 && state.current_step !== 'preview' && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          {state.errors.map((error, idx) => (
            <p key={idx} className="text-sm text-red-800 dark:text-red-200">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
