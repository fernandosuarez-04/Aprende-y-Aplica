'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface DaySelectorProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}

const DAYS = [
  { id: 1, label: 'Lunes', short: 'L' },
  { id: 2, label: 'Martes', short: 'M' },
  { id: 3, label: 'Miércoles', short: 'X' },
  { id: 4, label: 'Jueves', short: 'J' },
  { id: 5, label: 'Viernes', short: 'V' },
  { id: 6, label: 'Sábado', short: 'S' },
  { id: 0, label: 'Domingo', short: 'D' },
];

export function DaySelector({ selectedDays, onChange }: DaySelectorProps) {
  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      onChange(selectedDays.filter(d => d !== dayId));
    } else {
      onChange([...selectedDays, dayId].sort());
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Calendar className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Selecciona los días</h2>
          <p className="text-gray-400 text-sm mt-1">
            Elige los días de la semana en los que quieres estudiar
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {DAYS.map((day, index) => {
          const isSelected = selectedDays.includes(day.id);

          return (
            <motion.button
              key={day.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleDay(day.id)}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 border-blue-400 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-slate-700/50 border-slate-600 text-gray-300 hover:border-slate-500'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSelected && (
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <motion.div
                    className="w-3 h-3 bg-white rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </motion.div>
              )}

              <div className="text-center">
                <div className={`text-2xl font-bold mb-2 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                  {day.short}
                </div>
                <div className={`text-sm ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                  {day.label}
                </div>
              </div>

              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-blue-300"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {selectedDays.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
        >
          <p className="text-yellow-400 text-sm">
            ⚠️ Debes seleccionar al menos un día para continuar
          </p>
        </motion.div>
      )}
    </div>
  );
}



