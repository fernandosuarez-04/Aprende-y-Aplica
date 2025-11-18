'use client'

import { useState } from 'react'
import {
  ScheduleConfiguration as ScheduleConfig,
  DayOfWeek,
  TimeSlot,
  DAY_LABELS,
  TIME_SLOT_LABELS,
} from '../types/manual-wizard.types'

interface ScheduleConfigurationProps {
  schedule: ScheduleConfig
  onChange: (schedule: ScheduleConfig) => void
  className?: string
}

export function ScheduleConfiguration({
  schedule,
  onChange,
  className = '',
}: ScheduleConfigurationProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleToggleDay = (day: DayOfWeek) => {
    const newDays = schedule.days.map((d) =>
      d.day === day ? { ...d, enabled: !d.enabled, time_slots: !d.enabled ? ['evening'] : [] } : d
    )
    onChange({ ...schedule, days: newDays })
  }

  const handleToggleTimeSlot = (day: DayOfWeek, slot: TimeSlot) => {
    const newDays = schedule.days.map((d) => {
      if (d.day === day) {
        const hasSlot = d.time_slots.includes(slot)
        const newSlots = hasSlot
          ? d.time_slots.filter((s) => s !== slot)
          : [...d.time_slots, slot]
        return { ...d, time_slots: newSlots }
      }
      return d
    })
    onChange({ ...schedule, days: newDays })
  }

  const handleMaxSessionsChange = (day: DayOfWeek, value: number) => {
    const newDays = schedule.days.map((d) =>
      d.day === day ? { ...d, max_sessions: Math.max(0, Math.min(5, value)) } : d
    )
    onChange({ ...schedule, days: newDays })
  }

  const enabledDaysCount = schedule.days.filter((d) => d.enabled).length

  const timeSlots: TimeSlot[] = ['morning', 'afternoon', 'evening', 'night']

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Configura tu Horario
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selecciona los días y horarios en los que estudiarás
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Días por semana</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {enabledDaysCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Duración sesión</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {schedule.session_duration_minutes} min
            </p>
          </div>
        </div>
      </div>

      {/* Days Selection */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Días de Estudio</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {schedule.days.map((dayConfig) => (
            <button
              key={dayConfig.day}
              onClick={() => handleToggleDay(dayConfig.day)}
              className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                dayConfig.enabled
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400'
              }`}
            >
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {DAY_LABELS[dayConfig.day].substring(0, 3)}
              </div>
              {dayConfig.enabled && (
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {dayConfig.time_slots.length} horario{dayConfig.time_slots.length !== 1 && 's'}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots for Enabled Days */}
      {schedule.days.some((d) => d.enabled) && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Horarios Preferidos
          </h4>
          <div className="space-y-3">
            {schedule.days
              .filter((d) => d.enabled)
              .map((dayConfig) => (
                <div
                  key={dayConfig.day}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {DAY_LABELS[dayConfig.day]}
                    </span>
                    {showAdvanced && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Máx sesiones:
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          value={dayConfig.max_sessions}
                          onChange={(e) =>
                            handleMaxSessionsChange(dayConfig.day, parseInt(e.target.value) || 0)
                          }
                          className="w-16 px-2 py-1 text-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => handleToggleTimeSlot(dayConfig.day, slot)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          dayConfig.time_slots.includes(slot)
                            ? 'bg-blue-600 dark:bg-blue-500 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400'
                        }`}
                      >
                        {TIME_SLOT_LABELS[slot].split('(')[0].trim()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Session Duration */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Duración de Sesión</h4>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="15"
            max="120"
            step="5"
            value={schedule.session_duration_minutes}
            onChange={(e) =>
              onChange({ ...schedule, session_duration_minutes: parseInt(e.target.value) })
            }
            className="flex-1"
          />
          <div className="w-24 text-right">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {schedule.session_duration_minutes}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">min</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>15 min</span>
          <span>60 min</span>
          <span>120 min</span>
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium mb-4"
      >
        {showAdvanced ? '▼' : '▶'} Opciones avanzadas
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
          {/* Break Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duración de Descansos
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={schedule.break_duration_minutes}
                onChange={(e) =>
                  onChange({ ...schedule, break_duration_minutes: parseInt(e.target.value) })
                }
                className="flex-1"
              />
              <div className="w-20 text-right">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {schedule.break_duration_minutes}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">min</span>
              </div>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={schedule.start_date.toISOString().split('T')[0]}
              onChange={(e) =>
                onChange({ ...schedule, start_date: new Date(e.target.value) })
              }
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          {/* End Date (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Fin (Opcional)
            </label>
            <input
              type="date"
              value={schedule.end_date?.toISOString().split('T')[0] || ''}
              onChange={(e) =>
                onChange({
                  ...schedule,
                  end_date: e.target.value ? new Date(e.target.value) : undefined,
                })
              }
              min={schedule.start_date.toISOString().split('T')[0]}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Info Message */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm text-yellow-900 dark:text-yellow-100 font-medium mb-1">
              Validación Importante
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Asegúrate de que la duración de sesión sea suficiente para completar las lecciones
              seleccionadas. El sistema validará esto en el siguiente paso.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
