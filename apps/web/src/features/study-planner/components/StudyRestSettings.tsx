'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, Coffee, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ShortestLesson {
  lesson_id: string;
  lesson_title: string;
  total_minutes: number;
  course_title: string;
  module_title: string;
}

interface LongestLesson {
  lesson_id: string;
  lesson_title: string;
  total_minutes: number;
  course_title: string;
  module_title: string;
}

interface BreakInterval {
  interval_minutes: number;
  break_duration_minutes: number;
  break_type: 'short' | 'long';
}

interface StudyRestSettingsProps {
  minStudyMinutes: number;
  minRestMinutes: number;
  maxStudySessionMinutes: number;
  minLessonTimeMinutes: number;
  shortestLesson?: ShortestLesson | null;
  longestLesson?: LongestLesson | null;
  breakIntervals?: BreakInterval[];
  onChange: (settings: {
    minStudyMinutes: number;
    minRestMinutes: number;
    maxStudySessionMinutes: number;
  }) => void;
  onBreakIntervalsChange?: (intervals: BreakInterval[]) => void;
}

export function StudyRestSettings({
  minStudyMinutes,
  minRestMinutes,
  maxStudySessionMinutes,
  minLessonTimeMinutes,
  shortestLesson,
  longestLesson,
  breakIntervals: initialBreakIntervals,
  onChange,
  onBreakIntervalsChange,
}: StudyRestSettingsProps) {
  const [breakIntervals, setBreakIntervals] = useState<BreakInterval[]>(initialBreakIntervals || []);
  const [loadingIntervals, setLoadingIntervals] = useState(false);
  
  // Refs para evitar loops infinitos
  const onBreakIntervalsChangeRef = useRef(onBreakIntervalsChange);
  const lastCalculatedParamsRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInternalUpdateRef = useRef<boolean>(false);

  // Función para comparar arrays de intervalos (definida antes de usarla)
  const intervalsEqual = useCallback((a: BreakInterval[], b: BreakInterval[]): boolean => {
    if (a.length !== b.length) return false;
    return a.every((interval, index) => 
      interval.interval_minutes === b[index].interval_minutes &&
      interval.break_duration_minutes === b[index].break_duration_minutes &&
      interval.break_type === b[index].break_type
    );
  }, []);

  // Sincronizar la ref cuando cambie la función
  useEffect(() => {
    onBreakIntervalsChangeRef.current = onBreakIntervalsChange;
  }, [onBreakIntervalsChange]);


  // Sincronizar breakIntervals cuando cambien desde fuera (solo si realmente cambiaron)
  // Ignorar cambios si son internos (calculados por este componente)
  useEffect(() => {
    // Si el cambio es interno, ignorar sincronización externa
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    if (initialBreakIntervals) {
      setBreakIntervals(prevIntervals => {
        // Solo actualizar si realmente cambiaron usando la función de comparación
        if (!intervalsEqual(prevIntervals, initialBreakIntervals)) {
          return initialBreakIntervals;
        }
        return prevIntervals;
      });
    }
  }, [initialBreakIntervals, intervalsEqual]);

  // Calcular intervalos de descanso cuando cambien los tiempos (con debounce)
  useEffect(() => {
    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Crear parámetros de cálculo para comparación
    const currentParams = JSON.stringify({
      minStudyMinutes,
      maxStudySessionMinutes,
      minRestMinutes,
      minLessonTimeMinutes,
    });

    // Si los parámetros no cambiaron, no recalcular
    if (currentParams === lastCalculatedParamsRef.current) {
      return;
    }

    // Debounce: esperar 300ms antes de calcular
    debounceTimerRef.current = setTimeout(async () => {
      // Verificar nuevamente que los parámetros sigan siendo los mismos
      const paramsAtExecution = JSON.stringify({
        minStudyMinutes,
        maxStudySessionMinutes,
        minRestMinutes,
        minLessonTimeMinutes,
      });

      if (paramsAtExecution !== lastCalculatedParamsRef.current) {
        lastCalculatedParamsRef.current = paramsAtExecution;

        if (minStudyMinutes >= minLessonTimeMinutes && maxStudySessionMinutes >= minStudyMinutes) {
          setLoadingIntervals(true);
          try {
            const response = await fetch('/api/study-planner/calculate-break-intervals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                minStudyMinutes,
                maxStudySessionMinutes,
                minRestMinutes: 5, // Valor por defecto, calculado automáticamente
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const newIntervals = data.intervals || [];
              
              // Verificar si realmente cambiaron antes de actualizar
              let intervalsChanged = false;
              setBreakIntervals(prevIntervals => {
                if (!intervalsEqual(prevIntervals, newIntervals)) {
                  intervalsChanged = true;
                  // Marcar como actualización interna para evitar loop
                  isInternalUpdateRef.current = true;
                  return newIntervals;
                }
                return prevIntervals;
              });
              
              // Notificar después de actualizar el estado (solo si realmente cambió)
              if (intervalsChanged) {
                // Ejecutar después del render para evitar setState durante render
                Promise.resolve().then(() => {
                  if (onBreakIntervalsChangeRef.current) {
                    onBreakIntervalsChangeRef.current(newIntervals);
                  }
                });
              }
            }
          } catch (error) {
            console.error('Error calculando intervalos:', error);
          } finally {
            setLoadingIntervals(false);
          }
        } else {
          // Solo limpiar si realmente hay intervalos
          let shouldClear = false;
          setBreakIntervals(prevIntervals => {
            if (prevIntervals.length > 0) {
              shouldClear = true;
              // Marcar como actualización interna para evitar loop
              isInternalUpdateRef.current = true;
              return [];
            }
            return prevIntervals;
          });
          
          // Notificar después de actualizar el estado (solo si realmente cambió)
          if (shouldClear) {
            // Ejecutar después del render para evitar setState durante render
            Promise.resolve().then(() => {
              if (onBreakIntervalsChangeRef.current) {
                onBreakIntervalsChangeRef.current([]);
              }
            });
          }
        }
      }
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [minStudyMinutes, maxStudySessionMinutes, minRestMinutes, minLessonTimeMinutes, intervalsEqual]);

  const handleMinStudyChange = (value: number) => {
    // Asegurar que el valor nunca sea menor que minLessonTimeMinutes
    const adjustedValue = Math.max(value, minLessonTimeMinutes);
    // Asegurar que el tiempo mínimo no sea mayor que el máximo
    const finalValue = Math.min(adjustedValue, maxStudySessionMinutes);
    onChange({
      minStudyMinutes: finalValue,
      minRestMinutes,
      maxStudySessionMinutes,
    });
  };

  const handleMaxStudyChange = (value: number) => {
    // Asegurar que el tiempo máximo no sea menor que el mínimo
    const adjustedValue = Math.max(value, minStudyMinutes);
    onChange({
      minStudyMinutes,
      minRestMinutes,
      maxStudySessionMinutes: adjustedValue,
    });
  };
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <BookOpen className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Configuración de tiempos</h2>
          <p className="text-gray-400 text-sm mt-1">
            Define los tiempos mínimos y máximos de estudio basados en mejores prácticas científicas
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tiempo mínimo de estudio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Tiempo mínimo de estudio</h3>
              <p className="text-gray-400 text-sm">
                Duración mínima de cada sesión de estudio (en minutos). 
                <span className="block mt-1 text-blue-400">
                  💡 Basado en la técnica Pomodoro: 25-30 min es óptimo para mantener la concentración.
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={minLessonTimeMinutes}
              max={Math.min(120, maxStudySessionMinutes)}
              step="5"
              value={Math.max(Math.min(minStudyMinutes, maxStudySessionMinutes), minLessonTimeMinutes)}
              onChange={(e) => handleMinStudyChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="w-20 text-center">
              <span className="text-2xl font-bold text-white">{minStudyMinutes}</span>
              <span className="text-gray-400 text-sm ml-1">min</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>
              {minLessonTimeMinutes} min
              {shortestLesson && (
                <span className="block text-gray-400 mt-1 max-w-xs">
                  <span className="font-semibold">{shortestLesson.module_title}:</span> {shortestLesson.lesson_title} ({shortestLesson.total_minutes} min)
                </span>
              )}
            </span>
            <span>{Math.min(120, maxStudySessionMinutes)} min (máximo permitido)</span>
          </div>
          {minStudyMinutes < minLessonTimeMinutes && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-4 bg-red-500/20 border-2 border-red-500/50 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-bold mb-2">
                    ⚠️ VALIDACIÓN: Tiempo insuficiente
                  </p>
                  <p className="text-red-300 text-xs leading-relaxed">
                    El tiempo mínimo de estudio ({minStudyMinutes} min) debe ser al menos {minLessonTimeMinutes} min para completar la lección más corta.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          {minStudyMinutes > maxStudySessionMinutes && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-4 bg-red-500/20 border-2 border-red-500/50 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400 text-sm font-bold mb-2">
                    ⚠️ VALIDACIÓN: Tiempo mínimo mayor que máximo
                  </p>
                  <p className="text-red-300 text-xs leading-relaxed">
                    El tiempo mínimo de estudio ({minStudyMinutes} min) no puede ser mayor que el tiempo máximo de sesión ({maxStudySessionMinutes} min).
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Tiempo máximo de sesión */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-purple-500/20">
              <BookOpen className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Tiempo máximo de sesión</h3>
              <p className="text-gray-400 text-sm">
                Duración máxima recomendada para una sesión continua (en minutos)
                <span className="block mt-1 text-purple-400">
                  💡 Según estudios científicos: 90 min es el máximo óptimo antes de un descanso largo obligatorio. 
                  Después de este tiempo, la concentración y retención disminuyen significativamente.
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={Math.max(30, minStudyMinutes)}
              max="240"
              step="15"
              value={maxStudySessionMinutes}
              onChange={(e) => handleMaxStudyChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="w-20 text-center">
              <span className="text-2xl font-bold text-white">{maxStudySessionMinutes}</span>
              <span className="text-gray-400 text-sm ml-1">min</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>30 min</span>
            <span className="text-right max-w-xs">
              240 min (4 horas)
              {longestLesson && (
                <span className="block text-gray-400 mt-1">
                  <span className="font-semibold">{longestLesson.module_title}:</span> {longestLesson.lesson_title} ({longestLesson.total_minutes} min)
                </span>
              )}
            </span>
          </div>
        </motion.div>

        {/* Intervalos de descanso calculados */}
        {breakIntervals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-cyan-500/20">
                <Coffee className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Intervalos de descanso</h3>
                <p className="text-gray-400 text-sm">
                  Calculados automáticamente según mejores prácticas de aprendizaje (Pomodoro flexible)
                </p>
              </div>
            </div>
            {loadingIntervals ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                <p className="text-gray-400 text-sm mt-2">Calculando intervalos...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {breakIntervals.map((interval, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 ${
                      interval.break_type === 'long'
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-green-500/10 border-green-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            interval.break_type === 'long' ? 'bg-purple-400' : 'bg-green-400'
                          }`}
                        />
                        <div>
                          <p className="text-white font-semibold">
                            {interval.break_type === 'long' ? 'Descanso largo' : 'Descanso corto'}
                          </p>
                          <p className="text-gray-400 text-xs">
                            Después de {interval.interval_minutes} minutos de estudio
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-lg">{interval.break_duration_minutes} min</p>
                        <p className="text-gray-400 text-xs">duración</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-slate-600/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total de descansos:</span>
                    <span className="text-white font-semibold">{breakIntervals.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-400">Tiempo total de descanso:</span>
                    <span className="text-white font-semibold">
                      {breakIntervals.reduce((sum, i) => sum + i.break_duration_minutes, 0)} min
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

