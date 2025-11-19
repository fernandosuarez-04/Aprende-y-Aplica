'use client'

import { useState } from 'react'
import {
  AIAvailabilityConfig as AIAvailabilityConfigType,
  DayOfWeek,
  TimeSlot,
} from '../types/ai-wizard.types'
import { DAY_LABELS, TIME_SLOT_LABELS } from '../types/manual-wizard.types'

interface AIAvailabilityConfigProps {
  value: AIAvailabilityConfigType
  onChange: (availability: AIAvailabilityConfigType) => void
  className?: string
}

export function AIAvailabilityConfig({
  value,
  onChange,
  className = '',
}: AIAvailabilityConfigProps) {
  const [useManualOverride, setUseManualOverride] = useState(
    value.manual_override !== undefined
  )

  const days: DayOfWeek[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]

  const timeSlots: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night']

  const handleToggleManualOverride = (enabled: boolean) => {
    setUseManualOverride(enabled)

    if (enabled) {
      // Initialize manual override with current final values
      onChange({
        ...value,
        manual_override: {
          daily_minutes: value.final.daily_minutes,
          study_days: [...value.final.study_days],
          time_slots_per_day: { ...value.final.time_slots },
        },
      })
    } else {
      // Remove manual override, revert to auto-calculated
      const newValue = { ...value }
      delete newValue.manual_override
      newValue.final = {
        daily_minutes: value.auto_calculated.suggested_daily_minutes_max,
        study_days: days.filter((d, idx) =>
          value.auto_calculated.suggested_days_per_week.includes(idx + 1)
        ),
        time_slots: days.reduce(
          (acc, day) => {
            acc[day] = value.auto_calculated.preferred_time_slots
            return acc
          },
          {} as Record<DayOfWeek, TimeSlot[]>
        ),
      }
      onChange(newValue)
    }
  }

  const handleDailyMinutesChange = (minutes: number) => {
    if (useManualOverride && value.manual_override) {
      onChange({
        ...value,
        manual_override: {
          ...value.manual_override,
          daily_minutes: minutes,
        },
        final: {
          ...value.final,
          daily_minutes: minutes,
        },
      })
    }
  }

  const handleToggleDay = (day: DayOfWeek) => {
    if (useManualOverride && value.manual_override) {
      const newDays = value.manual_override.study_days.includes(day)
        ? value.manual_override.study_days.filter((d) => d !== day)
        : [...value.manual_override.study_days, day]

      const newTimeSlots = { ...value.manual_override.time_slots_per_day }
      if (!newDays.includes(day)) {
        newTimeSlots[day] = []
      } else if (!newTimeSlots[day] || newTimeSlots[day].length === 0) {
        newTimeSlots[day] = ['evening']
      }

      onChange({
        ...value,
        manual_override: {
          ...value.manual_override,
          study_days: newDays,
          time_slots_per_day: newTimeSlots,
        },
        final: {
          ...value.final,
          study_days: newDays,
          time_slots: newTimeSlots,
        },
      })
    }
  }

  const handleToggleTimeSlot = (day: DayOfWeek, slot: TimeSlot) => {
    if (useManualOverride && value.manual_override) {
      const currentSlots = value.manual_override.time_slots_per_day[day] || []
      const newSlots = currentSlots.includes(slot)
        ? currentSlots.filter((s) => s !== slot)
        : [...currentSlots, slot]

      const newTimeSlots = {
        ...value.manual_override.time_slots_per_day,
        [day]: newSlots,
      }

      onChange({
        ...value,
        manual_override: {
          ...value.manual_override,
          time_slots_per_day: newTimeSlots,
        },
        final: {
          ...value.final,
          time_slots: newTimeSlots,
        },
      })
    }
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Configura tu Disponibilidad
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Basado en tu perfil, hemos calculado tu disponibilidad óptima
        </p>
      </div>

      {/* Auto-Calculated Availability Display */}
      <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-white"
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
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Disponibilidad Sugerida (IA)
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Basada en tu rol:{' '}
              <span className="font-medium">{value.auto_calculated.role}</span> en una empresa{' '}
              <span className="font-medium">{value.auto_calculated.company_size}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Tiempo diario recomendado
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {value.auto_calculated.suggested_daily_minutes_min}-
              {value.auto_calculated.suggested_daily_minutes_max} min
            </div>
          </div>

          <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Días por semana</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {value.auto_calculated.suggested_days_per_week.length} días
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Horarios preferidos
          </div>
          <div className="flex flex-wrap gap-2">
            {value.auto_calculated.preferred_time_slots.map((slot) => (
              <span
                key={slot}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full font-medium"
              >
                {TIME_SLOT_LABELS[slot]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Override Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={useManualOverride}
            onChange={(e) => handleToggleManualOverride(e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <div>
            <span className="font-medium text-gray-900 dark:text-white">
              Personalizar manualmente
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ajusta tu disponibilidad si la sugerencia no se adapta a tu situación
            </p>
          </div>
        </label>
      </div>

      {/* Manual Override Configuration */}
      {useManualOverride && value.manual_override && (
        <div className="space-y-6">
          {/* Daily Minutes Slider */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Tiempo de estudio diario
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                value={value.manual_override.daily_minutes}
                onChange={(e) => handleDailyMinutesChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-lg font-bold text-gray-900 dark:text-white w-24 text-right">
                {value.manual_override.daily_minutes} min
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>15 min</span>
              <span>180 min (3h)</span>
            </div>
          </div>

          {/* Days Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Días disponibles para estudiar
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {days.map((day) => {
                const isSelected = value.manual_override!.study_days.includes(day)

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                  >
                    <div className="text-center">
                      <div
                        className={`text-sm font-semibold mb-1 ${
                          isSelected
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {DAY_LABELS[day]}
                      </div>
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-blue-600 dark:text-blue-400 mx-auto"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
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

          {/* Time Slots per Day */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Horarios por día
            </label>
            <div className="space-y-3">
              {value.manual_override.study_days.map((day) => (
                <div
                  key={day}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-3">
                    {DAY_LABELS[day]}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map((slot) => {
                      const isSelected =
                        value.manual_override!.time_slots_per_day[day]?.includes(slot) || false

                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleToggleTimeSlot(day, slot)}
                          className={`px-4 py-2 rounded-lg border transition-all duration-200 text-sm font-medium ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500 text-white'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500'
                          }`}
                        >
                          {TIME_SLOT_LABELS[slot]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              Configuración final
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              {value.final.daily_minutes} minutos × {value.final.study_days.length} días ={' '}
              <span className="font-semibold">
                {(value.final.daily_minutes * value.final.study_days.length) / 60} horas por
                semana
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
