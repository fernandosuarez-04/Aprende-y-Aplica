'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface TimePickerProps {
  value: string; // Formato: "HH:MM" (24 horas)
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

// Generar opciones de horas (1-12 para formato 12 horas)
const HOURS = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 1;
  return {
    value: hour.toString().padStart(2, '0'),
    label: hour.toString(),
  };
});

// Generar opciones de minutos (00-59, cada 5 minutos)
const MINUTES = Array.from({ length: 12 }, (_, i) => {
  const minute = i * 5;
  return {
    value: minute.toString().padStart(2, '0'),
    label: minute.toString().padStart(2, '0'),
  };
});

const AMPM_OPTIONS = [
  { value: 'AM', label: 'a. m.' },
  { value: 'PM', label: 'p. m.' },
];

export function TimePicker({ value, onChange, className, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convertir valor de 24h a 12h para mostrar
  const parseTime = (time24: string) => {
    if (!time24 || !time24.includes(':')) {
      return { hour: '09', minute: '00', ampm: 'AM' };
    }

    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';

    return {
      hour: hour12.toString().padStart(2, '0'),
      minute: minutes || '00',
      ampm,
    };
  };

  // Convertir valor de 12h a 24h
  const formatTime24 = (hour: string, minute: string, ampm: string) => {
    let hour24 = parseInt(hour, 10);
    if (ampm === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (ampm === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    return `${hour24.toString().padStart(2, '0')}:${minute}`;
  };

  const { hour, minute, ampm } = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(hour);
  const [selectedMinute, setSelectedMinute] = useState(minute);
  const [selectedAmPm, setSelectedAmPm] = useState(ampm);

  // Sincronizar estados cuando cambia el valor externo
  useEffect(() => {
    const parsed = parseTime(value);
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
    setSelectedAmPm(parsed.ampm);
  }, [value]);

  const handleHourChange = (newHour: string) => {
    setSelectedHour(newHour);
    onChange(formatTime24(newHour, selectedMinute, selectedAmPm));
  };

  const handleMinuteChange = (newMinute: string) => {
    setSelectedMinute(newMinute);
    onChange(formatTime24(selectedHour, newMinute, selectedAmPm));
  };

  const handleAmPmChange = (newAmPm: string) => {
    setSelectedAmPm(newAmPm);
    onChange(formatTime24(selectedHour, selectedMinute, newAmPm));
  };

  const displayValue = `${parseInt(selectedHour, 10)}:${selectedMinute} ${selectedAmPm === 'AM' ? 'a. m.' : 'p. m.'}`;

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger principal */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'relative w-full pl-10 pr-10 py-2',
          'bg-slate-900/50 dark:bg-slate-800/50',
          'border border-slate-600 dark:border-slate-600',
          'rounded-lg text-white text-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
          'transition-all duration-200',
          'hover:border-slate-500 dark:hover:border-slate-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center justify-between',
          isOpen && 'ring-2 ring-blue-500/50 border-blue-500'
        )}
      >
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <span className="flex-1 text-left">{displayValue}</span>
        <ChevronDown
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform duration-200 pointer-events-none',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown con tres columnas */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60]"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'absolute top-full left-0 mt-2 z-[70]',
                'bg-slate-800 dark:bg-slate-900',
                'rounded-xl shadow-2xl border border-slate-700 dark:border-slate-600',
                'backdrop-blur-xl overflow-hidden',
                'min-w-[280px]'
              )}
              style={{ 
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div className="flex divide-x divide-slate-700 dark:divide-slate-600">
                {/* Columna de Horas */}
                <div className="flex-1 py-2">
                  <div className="text-xs text-gray-400 dark:text-gray-500 text-center mb-2 px-2">
                    Hora
                  </div>
                  <div className="max-h-[240px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {HOURS.map((hourOption) => {
                      const isSelected = selectedHour === hourOption.value;
                      return (
                        <button
                          key={hourOption.value}
                          type="button"
                          onClick={() => handleHourChange(hourOption.value)}
                          className={cn(
                            'w-full px-4 py-2.5 text-sm font-medium transition-all duration-150',
                            'hover:bg-slate-700/50 focus:bg-slate-700/50 focus:outline-none',
                            'relative',
                            isSelected
                              ? 'bg-blue-500/30 text-blue-300 border-l-2 border-blue-500 font-semibold'
                              : 'text-white'
                          )}
                        >
                          {hourOption.label}
                          {isSelected && (
                            <motion.div
                              layoutId="selectedHour"
                              className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"
                              initial={false}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Columna de Minutos */}
                <div className="flex-1 py-2">
                  <div className="text-xs text-gray-400 dark:text-gray-500 text-center mb-2 px-2">
                    Minuto
                  </div>
                  <div className="max-h-[240px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {MINUTES.map((minuteOption) => {
                      const isSelected = selectedMinute === minuteOption.value;
                      return (
                        <button
                          key={minuteOption.value}
                          type="button"
                          onClick={() => handleMinuteChange(minuteOption.value)}
                          className={cn(
                            'w-full px-4 py-2.5 text-sm font-medium transition-all duration-150',
                            'hover:bg-slate-700/50 focus:bg-slate-700/50 focus:outline-none',
                            'relative',
                            isSelected
                              ? 'bg-blue-500/30 text-blue-300 border-l-2 border-blue-500 font-semibold'
                              : 'text-white'
                          )}
                        >
                          {minuteOption.label}
                          {isSelected && (
                            <motion.div
                              layoutId="selectedMinute"
                              className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"
                              initial={false}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Columna de AM/PM */}
                <div className="flex-1 py-2">
                  <div className="text-xs text-gray-400 dark:text-gray-500 text-center mb-2 px-2">
                    Período
                  </div>
                  <div className="max-h-[240px] overflow-y-auto">
                    {AMPM_OPTIONS.map((ampmOption) => {
                      const isSelected = selectedAmPm === ampmOption.value;
                      return (
                        <button
                          key={ampmOption.value}
                          type="button"
                          onClick={() => handleAmPmChange(ampmOption.value)}
                          className={cn(
                            'w-full px-4 py-2.5 text-sm font-medium transition-all duration-150',
                            'hover:bg-slate-700/50 focus:bg-slate-700/50 focus:outline-none',
                            'relative',
                            isSelected
                              ? 'bg-blue-500/30 text-blue-300 border-l-2 border-blue-500 font-semibold'
                              : 'text-white'
                          )}
                        >
                          {ampmOption.label}
                          {isSelected && (
                            <motion.div
                              layoutId="selectedAmPm"
                              className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"
                              initial={false}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
