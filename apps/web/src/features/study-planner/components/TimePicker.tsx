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
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastValueRef = useRef<string>(value);
  const isUpdatingRef = useRef<boolean>(false);
  const isEditingRef = useRef<boolean>(false);

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

  // Formatear para mostrar (12h con AM/PM)
  const formatDisplay = (time24: string) => {
    const parsed = parseTime(time24);
    return `${parseInt(parsed.hour, 10)}:${parsed.minute} ${parsed.ampm === 'AM' ? 'a. m.' : 'p. m.'}`;
  };

  const { hour, minute, ampm } = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(hour);
  const [selectedMinute, setSelectedMinute] = useState(minute);
  const [selectedAmPm, setSelectedAmPm] = useState(ampm);

  // Validar y parsear input del usuario (acepta formatos: "9:00 am", "09:00 AM", "9:00", "9 am", etc.)
  const parseInput = (input: string, currentAmPm: string = selectedAmPm): string | null => {
    if (!input.trim()) return null;
    
    // Remover espacios y convertir a minúsculas para procesar
    const clean = input.trim().toLowerCase();
    
    // Buscar patrón de hora:minuto con período opcional
    // Acepta: "9:00", "9:00am", "9:00 am", "9:00 a.m.", "9 am", etc.
    const timeMatch = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?)?$/);
    if (!timeMatch) return null;
    
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    let period = (timeMatch[3] || '').replace(/\./g, '').replace(/\s+/g, '');
    
    // Validar rango de hora (1-12 para formato 12h)
    if (hour < 1 || hour > 12) return null;
    
    // Validar rango de minutos
    if (minute < 0 || minute > 59) return null;
    
    // Determinar si es AM o PM
    let ampm = 'AM';
    if (period) {
      if (period.startsWith('p')) {
        ampm = 'PM';
      } else if (period.startsWith('a')) {
        ampm = 'AM';
      }
    } else {
      // Si no especifica período, usar el período actual
      ampm = currentAmPm;
    }
    
    return formatTime24(hour.toString().padStart(2, '0'), minute.toString().padStart(2, '0'), ampm);
  };

  // Inicializar inputValue cuando el componente se monta
  useEffect(() => {
    setInputValue(formatDisplay(value));
    lastValueRef.current = value;
  }, []);

  // Sincronizar estados cuando cambia el valor externo (solo si no estamos editando y realmente cambió)
  useEffect(() => {
    // Si estamos actualizando desde dentro, no sincronizar
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false;
      return;
    }

    // Si estamos editando, no sincronizar (usar ref para evitar re-renders)
    if (isEditingRef.current) {
      return;
    }

    // Si el valor realmente cambió desde fuera y no estamos editando
    if (value !== lastValueRef.current) {
      const parsed = parseTime(value);
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
      setSelectedAmPm(parsed.ampm);
      setInputValue(formatDisplay(value));
      lastValueRef.current = value;
    }
  }, [value]);

  const handleHourChange = (newHour: string) => {
    setSelectedHour(newHour);
    const newValue = formatTime24(newHour, selectedMinute, selectedAmPm);
    isUpdatingRef.current = true;
    onChange(newValue);
    lastValueRef.current = newValue;
  };

  const handleMinuteChange = (newMinute: string) => {
    setSelectedMinute(newMinute);
    const newValue = formatTime24(selectedHour, newMinute, selectedAmPm);
    isUpdatingRef.current = true;
    onChange(newValue);
    lastValueRef.current = newValue;
  };

  const handleAmPmChange = (newAmPm: string) => {
    setSelectedAmPm(newAmPm);
    const newValue = formatTime24(selectedHour, selectedMinute, newAmPm);
    isUpdatingRef.current = true;
    onChange(newValue);
    lastValueRef.current = newValue;
  };

  const handleInputFocus = () => {
    setIsEditing(true);
    isEditingRef.current = true;
    // Cuando el usuario enfoca, usar el valor actual formateado
    const currentDisplay = formatDisplay(value);
    setInputValue(currentDisplay);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // No actualizar el estado padre mientras el usuario está escribiendo
  };

  const handleInputBlur = () => {
    // Esperar un momento para que el blur termine antes de procesar
    setTimeout(() => {
      setIsEditing(false);
      isEditingRef.current = false;
      const parsed = parseInput(inputValue, selectedAmPm);
      if (parsed && parsed !== lastValueRef.current) {
        isUpdatingRef.current = true;
        onChange(parsed);
        lastValueRef.current = parsed;
        // Actualizar el display inmediatamente
        setInputValue(formatDisplay(parsed));
      } else if (!parsed) {
        // Si no es válido, restaurar el valor anterior
        setInputValue(formatDisplay(value));
      }
    }, 150);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false);
      isEditingRef.current = false;
      const parsed = parseInput(inputValue, selectedAmPm);
      if (parsed && parsed !== lastValueRef.current) {
        isUpdatingRef.current = true;
        onChange(parsed);
        lastValueRef.current = parsed;
        setInputValue(formatDisplay(parsed));
        inputRef.current?.blur();
      } else if (!parsed) {
        // Si no es válido, restaurar el valor anterior
        setInputValue(formatDisplay(value));
        inputRef.current?.blur();
      } else {
        // Si es el mismo valor, solo cerrar
        inputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setInputValue(formatDisplay(value));
      setIsEditing(false);
      isEditingRef.current = false;
      inputRef.current?.blur();
    }
  };

  const displayValue = isEditing ? inputValue : formatDisplay(value);

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
      {/* Input editable con botón de dropdown */}
      <div className={cn(
        'relative w-full flex items-center',
        'bg-slate-900/50 dark:bg-slate-800/50',
        'border border-slate-600 dark:border-slate-600',
        'rounded-lg',
        'transition-all duration-200',
        'hover:border-slate-500 dark:hover:border-slate-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isOpen && 'ring-2 ring-blue-500/50 border-blue-500',
        isEditing && 'ring-2 ring-blue-500/50 border-blue-500'
      )}>
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          disabled={disabled}
          placeholder="9:00 a. m."
          className={cn(
            'w-full pl-10 pr-10 py-2',
            'bg-transparent text-white text-sm',
            'focus:outline-none',
            'placeholder:text-gray-500',
            'disabled:cursor-not-allowed'
          )}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (!disabled) {
              setIsOpen(!isOpen);
              setIsEditing(false);
              inputRef.current?.blur();
            }
          }}
          disabled={disabled}
          className={cn(
            'absolute right-0 top-0 bottom-0 px-3',
            'flex items-center justify-center',
            'text-gray-400 hover:text-gray-300',
            'transition-colors duration-200',
            'disabled:cursor-not-allowed'
          )}
        >
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

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
                'min-w-[300px]'
              )}
              style={{ 
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div className="p-2">
                <div className="flex divide-x divide-slate-700 dark:divide-slate-600 rounded-lg overflow-hidden">
                  {/* Columna de Horas */}
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-400 text-center py-2 px-2 bg-slate-700/50">
                      Hora
                    </div>
                    <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500">
                      {HOURS.map((hourOption) => {
                        const isSelected = selectedHour === hourOption.value;
                        return (
                          <button
                            key={hourOption.value}
                            type="button"
                            onClick={() => {
                              handleHourChange(hourOption.value);
                            }}
                            className={cn(
                              'w-full px-4 py-2.5 text-sm font-medium transition-all duration-150',
                              'hover:bg-blue-500/20 focus:bg-blue-500/20 focus:outline-none',
                              'relative',
                              isSelected
                                ? 'bg-blue-500/30 text-blue-300 font-bold'
                                : 'text-white hover:text-blue-300'
                            )}
                          >
                            <span className={cn(
                              'inline-block px-2 py-1 rounded',
                              isSelected && 'bg-blue-500/20'
                            )}>
                              {hourOption.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Columna de Minutos */}
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-400 text-center py-2 px-2 bg-slate-700/50">
                      Minuto
                    </div>
                    <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500">
                      {MINUTES.map((minuteOption) => {
                        const isSelected = selectedMinute === minuteOption.value;
                        return (
                          <button
                            key={minuteOption.value}
                            type="button"
                            onClick={() => handleMinuteChange(minuteOption.value)}
                            className={cn(
                              'w-full px-4 py-2.5 text-sm font-medium transition-all duration-150',
                              'hover:bg-blue-500/20 focus:bg-blue-500/20 focus:outline-none',
                              'relative',
                              isSelected
                                ? 'bg-blue-500/30 text-blue-300 font-bold'
                                : 'text-white hover:text-blue-300'
                            )}
                          >
                            <span className={cn(
                              'inline-block px-2 py-1 rounded',
                              isSelected && 'bg-blue-500/20'
                            )}>
                              {minuteOption.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Columna de AM/PM */}
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-400 text-center py-2 px-2 bg-slate-700/50">
                      Período
                    </div>
                    <div className="max-h-[200px]">
                      {AMPM_OPTIONS.map((ampmOption) => {
                        const isSelected = selectedAmPm === ampmOption.value;
                        return (
                          <button
                            key={ampmOption.value}
                            type="button"
                            onClick={() => handleAmPmChange(ampmOption.value)}
                            className={cn(
                              'w-full px-4 py-3 text-sm font-medium transition-all duration-150',
                              'hover:bg-blue-500/20 focus:bg-blue-500/20 focus:outline-none',
                              'relative',
                              isSelected
                                ? 'bg-blue-500/30 text-blue-300 font-bold'
                                : 'text-white hover:text-blue-300'
                            )}
                          >
                            <span className={cn(
                              'inline-block px-3 py-1 rounded',
                              isSelected && 'bg-blue-500/20'
                            )}>
                              {ampmOption.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
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
