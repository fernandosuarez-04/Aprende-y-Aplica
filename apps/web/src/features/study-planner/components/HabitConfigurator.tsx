'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ClockIcon,
  CalendarDaysIcon,
  SunIcon,
  MoonIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import type {
  StudyPreferencesInsert,
  StudyPreferencesUpdate,
  DayOfWeek,
  TimeOfDay,
  TimeBlock,
} from '@repo/shared/types';
import { Button } from '@aprende-y-aplica/ui';

interface HabitConfiguratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: StudyPreferencesInsert | StudyPreferencesUpdate) => Promise<void>;
  initialPreferences?: {
    preferred_time_of_day?: TimeOfDay;
    preferred_days?: DayOfWeek[];
    daily_target_minutes?: number;
    weekly_target_minutes?: number;
    preferred_time_blocks?: TimeBlock[];
  };
}

const DAYS_OF_WEEK = [
  { value: 1 as DayOfWeek, label: 'Lunes', short: 'L' },
  { value: 2 as DayOfWeek, label: 'Martes', short: 'M' },
  { value: 3 as DayOfWeek, label: 'Miércoles', short: 'X' },
  { value: 4 as DayOfWeek, label: 'Jueves', short: 'J' },
  { value: 5 as DayOfWeek, label: 'Viernes', short: 'V' },
  { value: 6 as DayOfWeek, label: 'Sábado', short: 'S' },
  { value: 7 as DayOfWeek, label: 'Domingo', short: 'D' },
];

const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string; icon: any; hours: string }[] = [
  { value: 'morning', label: 'Mañana', icon: SunIcon, hours: '06:00 - 12:00' },
  { value: 'afternoon', label: 'Tarde', icon: SunIcon, hours: '12:00 - 18:00' },
  { value: 'evening', label: 'Noche', icon: MoonIcon, hours: '18:00 - 22:00' },
  { value: 'night', label: 'Madrugada', icon: MoonIcon, hours: '22:00 - 06:00' },
];

export function HabitConfigurator({
  isOpen,
  onClose,
  onSave,
  initialPreferences,
}: HabitConfiguratorProps) {
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState<TimeOfDay>('morning');
  const [preferredDays, setPreferredDays] = useState<DayOfWeek[]>([1, 2, 3, 4, 5]);
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState(60);
  const [weeklyTargetMinutes, setWeeklyTargetMinutes] = useState(300);
  const [useCustomTimeBlocks, setUseCustomTimeBlocks] = useState(false);
  const [customTimeBlocks, setCustomTimeBlocks] = useState<TimeBlock[]>([
    { start: '09:00', end: '11:00' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialPreferences) {
      setPreferredTimeOfDay(initialPreferences.preferred_time_of_day || 'morning');
      setPreferredDays(initialPreferences.preferred_days || [1, 2, 3, 4, 5]);
      setDailyTargetMinutes(initialPreferences.daily_target_minutes || 60);
      setWeeklyTargetMinutes(initialPreferences.weekly_target_minutes || 300);
      if (initialPreferences.preferred_time_blocks && initialPreferences.preferred_time_blocks.length > 0) {
        setUseCustomTimeBlocks(true);
        setCustomTimeBlocks(initialPreferences.preferred_time_blocks);
      } else {
        setUseCustomTimeBlocks(false);
        setCustomTimeBlocks([{ start: '09:00', end: '11:00' }]);
      }
      setError(null);
    }
  }, [isOpen, initialPreferences]);

  const toggleDay = (day: DayOfWeek) => {
    setPreferredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const addTimeBlock = () => {
    setCustomTimeBlocks([...customTimeBlocks, { start: '09:00', end: '11:00' }]);
  };

  const removeTimeBlock = (index: number) => {
    setCustomTimeBlocks(customTimeBlocks.filter((_, i) => i !== index));
  };

  const updateTimeBlock = (index: number, field: 'start' | 'end', value: string) => {
    setCustomTimeBlocks(
      customTimeBlocks.map((block, i) => (i === index ? { ...block, [field]: value } : block))
    );
  };

  const handleSave = async () => {
    if (preferredDays.length === 0) {
      setError('Selecciona al menos un día de la semana');
      return;
    }

    if (useCustomTimeBlocks && customTimeBlocks.length === 0) {
      setError('Agrega al menos un bloque de tiempo personalizado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const preferences: StudyPreferencesInsert | StudyPreferencesUpdate = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        preferred_time_of_day: preferredTimeOfDay,
        preferred_days: preferredDays,
        daily_target_minutes: dailyTargetMinutes,
        weekly_target_minutes: weeklyTargetMinutes,
        // preferred_time_blocks no existe en StudyPreferences, solo en StudyPlan
      };

      await onSave(preferences);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar preferencias');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Configurar Hábitos de Estudio
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Personaliza tu rutina de aprendizaje
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Tiempo del día preferido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <SunIcon className="w-4 h-4 inline mr-2" />
                Horario preferido
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TIME_OF_DAY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setPreferredTimeOfDay(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        preferredTimeOfDay === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {option.hours}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Días de la semana */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <CalendarDaysIcon className="w-4 h-4 inline mr-2" />
                Días de la semana
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      preferredDays.includes(day.value)
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {preferredDays.length} día{preferredDays.length !== 1 ? 's' : ''} seleccionado
                {preferredDays.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Objetivos de tiempo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <ClockIcon className="w-4 h-4 inline mr-2" />
                  Objetivo diario (minutos)
                </label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={dailyTargetMinutes}
                  onChange={(e) => setDailyTargetMinutes(parseInt(e.target.value) || 60)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {Math.round(dailyTargetMinutes / 60 * 10) / 10} horas por día
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <ClockIcon className="w-4 h-4 inline mr-2" />
                  Objetivo semanal (minutos)
                </label>
                <input
                  type="number"
                  min="60"
                  max="3360"
                  step="30"
                  value={weeklyTargetMinutes}
                  onChange={(e) => setWeeklyTargetMinutes(parseInt(e.target.value) || 300)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {Math.round(weeklyTargetMinutes / 60 * 10) / 10} horas por semana
                </p>
              </div>
            </div>

            {/* Bloques de tiempo personalizados */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Horarios específicos (opcional)
                </label>
                <button
                  onClick={() => setUseCustomTimeBlocks(!useCustomTimeBlocks)}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  {useCustomTimeBlocks ? 'Usar horario predeterminado' : 'Personalizar horarios'}
                </button>
              </div>

              {useCustomTimeBlocks && (
                <div className="space-y-3">
                  {customTimeBlocks.map((block, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <input
                        type="time"
                        value={block.start}
                        onChange={(e) => updateTimeBlock(index, 'start', e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                      <input
                        type="time"
                        value={block.end}
                        onChange={(e) => updateTimeBlock(index, 'end', e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                      />
                      {customTimeBlocks.length > 1 && (
                        <button
                          onClick={() => removeTimeBlock(index)}
                          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addTimeBlock}
                    className="w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Agregar bloque de tiempo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Preferencias'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

