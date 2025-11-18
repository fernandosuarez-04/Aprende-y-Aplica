'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  ManualWizardState,
  WizardStep,
  SelectedCourse,
  ScheduleConfiguration,
  PlanPreview,
  getDefaultWizardState,
  CourseForSelection,
} from '../types/manual-wizard.types'
import { SessionType } from '@/lib/supabase/study-planner-types'
import { CourseSelector } from './CourseSelector'
import { ScheduleConfiguration as ScheduleConfigComponent } from './ScheduleConfiguration'
import { PlanPreview as PlanPreviewComponent } from './PlanPreview'
import { ValidationMessages } from './ValidationMessages'
import { SessionTypeSelector } from './SessionTypeSelector'

interface ManualPlanWizardProps {
  available_courses: CourseForSelection[]
  onComplete: (planId: string) => void
  onCancel: () => void
  className?: string
}

export function ManualPlanWizard({
  available_courses,
  onComplete,
  onCancel,
  className = '',
}: ManualPlanWizardProps) {
  const [state, setState] = useState<ManualWizardState>(getDefaultWizardState())

  // =====================================================
  // Navigation
  // =====================================================

  const goToStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, current_step: step }))
  }, [])

  const goNext = useCallback(() => {
    const steps: WizardStep[] = [
      'course-selection',
      'session-type',
      'schedule',
      'preview',
    ]
    const currentIndex = steps.indexOf(state.current_step)
    if (currentIndex < steps.length - 1) {
      goToStep(steps[currentIndex + 1])
    }
  }, [state.current_step, goToStep])

  const goBack = useCallback(() => {
    const steps: WizardStep[] = [
      'course-selection',
      'session-type',
      'schedule',
      'preview',
    ]
    const currentIndex = steps.indexOf(state.current_step)
    if (currentIndex > 0) {
      goToStep(steps[currentIndex - 1])
    }
  }, [state.current_step, goToStep])

  // =====================================================
  // Validation
  // =====================================================

  const validateCurrentStep = useCallback((): boolean => {
    const errors: typeof state.validation.errors = []
    const warnings: typeof state.validation.warnings = []

    switch (state.current_step) {
      case 'course-selection':
        if (state.selected_courses.length === 0) {
          errors.push({
            field: 'selected_courses',
            message: 'Debes seleccionar al menos un curso',
            severity: 'error',
          })
        }
        if (state.selected_courses.length > 5) {
          warnings.push({
            field: 'selected_courses',
            message:
              'Seleccionar más de 5 cursos puede hacer el plan difícil de seguir',
            severity: 'warning',
          })
        }
        break

      case 'session-type':
        // Session type is always valid (has default)
        break

      case 'schedule':
        const enabledDays = state.schedule.days.filter((d) => d.enabled)
        if (enabledDays.length === 0) {
          errors.push({
            field: 'days',
            message: 'Debes seleccionar al menos un día de estudio',
            severity: 'error',
          })
        }
        if (enabledDays.length < 3) {
          warnings.push({
            field: 'days',
            message: 'Se recomienda estudiar al menos 3 días por semana para mejores resultados',
            severity: 'warning',
          })
        }
        if (state.schedule.session_duration_minutes < 15) {
          errors.push({
            field: 'session_duration_minutes',
            message: 'Las sesiones deben durar al menos 15 minutos',
            severity: 'error',
          })
        }
        break

      case 'preview':
        // Preview validation happens on backend
        break
    }

    const is_valid = errors.length === 0

    setState((prev) => ({
      ...prev,
      validation: { is_valid, errors, warnings },
    }))

    return is_valid
  }, [state.current_step, state.selected_courses, state.schedule])

  // Run validation when step or data changes
  useEffect(() => {
    validateCurrentStep()
  }, [validateCurrentStep])

  // =====================================================
  // Data Handlers
  // =====================================================

  const handleCoursesChange = useCallback((courses: SelectedCourse[]) => {
    setState((prev) => ({
      ...prev,
      selected_courses: courses,
    }))
  }, [])

  const handleSessionTypeChange = useCallback((sessionType: SessionType) => {
    setState((prev) => ({
      ...prev,
      session_type: sessionType,
    }))
  }, [])

  const handleScheduleChange = useCallback((schedule: ScheduleConfiguration) => {
    setState((prev) => ({
      ...prev,
      schedule,
    }))
  }, [])

  // =====================================================
  // Preview Generation
  // =====================================================

  const generatePreview = useCallback(async () => {
    setState((prev) => ({ ...prev, is_loading: true, errors: [] }))

    try {
      const response = await fetch('/api/study-planner/manual/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_courses: state.selected_courses,
          session_type: state.session_type,
          schedule: state.schedule,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al generar preview')
      }

      const data = await response.json()

      // Convert date strings to Date objects
      const preview: PlanPreview = {
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
        is_loading: false,
      }))
    } catch (error) {
      console.error('Error generating preview:', error)
      setState((prev) => ({
        ...prev,
        is_loading: false,
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
      }))
    }
  }, [state.selected_courses, state.session_type, state.schedule])

  // Generate preview when entering preview step
  useEffect(() => {
    if (state.current_step === 'preview' && !state.preview && !state.is_loading) {
      generatePreview()
    }
  }, [state.current_step, state.preview, state.is_loading, generatePreview])

  // =====================================================
  // Plan Creation
  // =====================================================

  const handleConfirmPlan = useCallback(async () => {
    setState((prev) => ({ ...prev, is_loading: true, errors: [] }))

    try {
      const response = await fetch('/api/study-planner/manual/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_name: `Plan Manual - ${new Date().toLocaleDateString('es-ES')}`,
          selected_courses: state.selected_courses,
          session_type: state.session_type,
          schedule: state.schedule,
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
  }, [state.selected_courses, state.session_type, state.schedule, onComplete])

  // =====================================================
  // Step Rendering
  // =====================================================

  const renderStep = () => {
    switch (state.current_step) {
      case 'course-selection':
        return (
          <CourseSelector
            available_courses={available_courses}
            selected_courses={state.selected_courses}
            onChange={handleCoursesChange}
          />
        )

      case 'session-type':
        return (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Tipo de Sesión
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Elige la duración de tus sesiones de estudio
              </p>
            </div>
            <SessionTypeSelector
              value={state.session_type}
              onChange={handleSessionTypeChange}
              showDescription={true}
            />
          </div>
        )

      case 'schedule':
        return (
          <ScheduleConfigComponent
            schedule={state.schedule}
            onChange={handleScheduleChange}
          />
        )

      case 'preview':
        if (state.is_loading) {
          return (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Generando vista previa de tu plan...
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
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200"
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
          <PlanPreviewComponent
            preview={state.preview}
            onEdit={() => goToStep('schedule')}
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

  const steps: Array<{ key: WizardStep; label: string; number: number }> = [
    { key: 'course-selection', label: 'Cursos', number: 1 },
    { key: 'session-type', label: 'Sesión', number: 2 },
    { key: 'schedule', label: 'Horario', number: 3 },
    { key: 'preview', label: 'Vista Previa', number: 4 },
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
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                        : isCompleted
                          ? 'bg-green-600 text-white'
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
                        ? 'text-blue-600 dark:text-blue-400'
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
                        idx < currentStepIndex ? 'bg-green-600' : 'bg-transparent'
                      }`}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Validation Messages */}
      <ValidationMessages validation={state.validation} className="mb-6" />

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
            disabled={!state.validation.is_valid || state.is_loading}
            className="px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  )
}
