'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Trash2, X } from 'lucide-react';
import { TimePicker } from './TimePicker';

interface TimeSlot {
  day: number;
  startTime: string;
  endTime: string;
}

interface TimeSlotConfigProps {
  selectedDays: number[];
  timeSlots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
}

const DAYS = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
];

export function TimeSlotConfig({ selectedDays, timeSlots, onChange }: TimeSlotConfigProps) {
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  const addTimeSlot = (day: number) => {
    const newSlot: TimeSlot = {
      day,
      startTime: '09:00',
      endTime: '10:00',
    };
    onChange([...timeSlots, newSlot]);
    setEditingSlot(newSlot);
  };

  const updateTimeSlot = (index: number, updates: Partial<TimeSlot>) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeTimeSlot = (index: number) => {
    onChange(timeSlots.filter((_, i) => i !== index));
  };

  const getDaySlots = (day: number) => {
    return timeSlots.filter(slot => slot.day === day);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Clock className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Configura los horarios</h2>
          <p className="text-gray-400 text-sm mt-1">
            Define las horas específicas de estudio para cada día seleccionado
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {selectedDays.map((dayId) => {
          const day = DAYS.find(d => d.id === dayId);
          const daySlots = getDaySlots(dayId);

          return (
            <motion.div
              key={dayId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{day?.label}</h3>
                <button
                  onClick={() => addTimeSlot(dayId)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Agregar horario
                </button>
              </div>

              <AnimatePresence>
                {daySlots.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8 text-gray-400"
                  >
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay horarios configurados para este día</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {daySlots.map((slot, slotIndex) => {
                      const globalIndex = timeSlots.findIndex(
                        s => s.day === slot.day && s.startTime === slot.startTime && s.endTime === slot.endTime
                      );

                      return (
                        <motion.div
                          key={`${dayId}-${slotIndex}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-600/30"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-400 whitespace-nowrap">Desde:</label>
                              <TimePicker
                                value={slot.startTime}
                                onChange={(value) => updateTimeSlot(globalIndex, { startTime: value })}
                              />
                            </div>
                            <span className="text-gray-500">→</span>
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-400 whitespace-nowrap">Hasta:</label>
                              <TimePicker
                                value={slot.endTime}
                                onChange={(value) => updateTimeSlot(globalIndex, { endTime: value })}
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeTimeSlot(globalIndex)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {timeSlots.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
        >
          <p className="text-yellow-400 text-sm">
            ⚠️ Debes configurar al menos un horario para continuar
          </p>
        </motion.div>
      )}
    </div>
  );
}


