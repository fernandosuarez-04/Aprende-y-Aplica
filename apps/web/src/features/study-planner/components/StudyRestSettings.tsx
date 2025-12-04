'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Coffee, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ShortestLesson {
  lesson_id: string;
  lesson_title: string;
  total_minutes: number;
  course_title: string;
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
  breakIntervals: initialBreakIntervals,
  onChange,
  onBreakIntervalsChange,
}: StudyRestSettingsProps) {
  const [breakIntervals, setBreakIntervals] = useState<BreakInterval[]>(initialBreakIntervals || []);
  const [loadingIntervals, setLoadingIntervals] = useState(false);

  // Calcular intervalos de descanso cuando cambien los tiempos
  useEffect(() => {
    const calculateIntervals = async () => {
      if (minStudyMinutes >= minLessonTimeMinutes && maxStudySessionMinutes >= minStudyMinutes) {
        setLoadingIntervals(true);
        try {
          const response = await fetch('/api/study-planner/calculate-break-intervals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              minStudyMinutes,
              maxStudySessionMinutes,
              minRestMinutes,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setBreakIntervals(data.intervals || []);
            if (onBreakIntervalsChange) {
              onBreakIntervalsChange(data.intervals || []);
            }
          }
        } catch (error) {
          console.error('Error calculando intervalos:', error);
        } finally {
          setLoadingIntervals(false);
        }
      } else {
        setBreakIntervals([]);
        if (onBreakIntervalsChange) {
          onBreakIntervalsChange([]);
        }
      }
    };

    calculateIntervals();
  }, [minStudyMinutes, maxStudySessionMinutes, minRestMinutes, minLessonTimeMinutes, onBreakIntervalsChange]);

  // Ajustar automáticamente el tiempo mínimo si es menor que la duración mínima de lección
  useEffect(() => {
    if (minStudyMinutes < minLessonTimeMinutes) {
      onChange({
        minStudyMinutes: minLessonTimeMinutes,
        minRestMinutes,
        maxStudySessionMinutes,
      });
    }
  }, [minLessonTimeMinutes]); // Solo cuando cambie minLessonTimeMinutes

  const handleMinStudyChange = (value: number) => {
    // Asegurar que el valor nunca sea menor que minLessonTimeMinutes
    const adjustedValue = Math.max(value, minLessonTimeMinutes);
    onChange({
      minStudyMinutes: adjustedValue,
      minRestMinutes,
      maxStudySessionMinutes,
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
            Define los tiempos mínimos de estudio y descanso basados en mejores prácticas científicas
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
                  <span className="font-semibold text-yellow-400">IMPORTANTE:</span> Debe ser al menos {minLessonTimeMinutes} min para completar una lección completa.
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={minLessonTimeMinutes}
              max="120"
              step="5"
              value={Math.max(minStudyMinutes, minLessonTimeMinutes)}
              onChange={(e) => handleMinStudyChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="w-20 text-center">
              <span className="text-2xl font-bold text-white">{minStudyMinutes}</span>
              <span className="text-gray-400 text-sm ml-1">min</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{minLessonTimeMinutes} min (mínimo - lección más corta)</span>
            <span>120 min</span>
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
                    ⚠️ VALIDACIÓN CRÍTICA: Tiempo insuficiente
                  </p>
                  <p className="text-red-300 text-xs leading-relaxed mb-2">
                    El tiempo mínimo de estudio ({minStudyMinutes} min) es menor que la duración de la lección más corta ({minLessonTimeMinutes} min).
                  </p>
                  {shortestLesson && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-2">
                      <p className="text-red-200 text-xs font-semibold mb-1">Lección más corta detectada:</p>
                      <p className="text-red-100 text-xs">
                        <strong>{shortestLesson.lesson_title}</strong>
                      </p>
                      <p className="text-red-200 text-xs">
                        Curso: {shortestLesson.course_title} • Duración: {shortestLesson.total_minutes} minutos
                      </p>
                    </div>
                  )}
                  <p className="text-red-200 text-xs font-medium">
                    📚 <strong>Razón:</strong> Cada sesión de estudio debe permitirte completar al menos una lección completa de tus cursos seleccionados. 
                    Ajusta el tiempo mínimo a {minLessonTimeMinutes} minutos o más para continuar.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          {minStudyMinutes >= minLessonTimeMinutes && minStudyMinutes >= 25 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
            >
              <p className="text-green-400 text-sm font-medium">
                ✅ Configuración válida: El tiempo mínimo permite completar al menos una lección por sesión
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Tiempo mínimo de descanso */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-green-500/20">
              <Coffee className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Tiempo mínimo de descanso</h3>
              <p className="text-gray-400 text-sm">
                Duración mínima de descanso entre sesiones (en minutos)
                <span className="block mt-1 text-green-400">
                  💡 Basado en la técnica Pomodoro: 5 min entre sesiones cortas, 15-30 min después de 4 sesiones (descanso largo). 
                  Los descansos mejoran la retención y previenen la fatiga mental.
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={minRestMinutes}
              onChange={(e) => onChange({ minStudyMinutes, minRestMinutes: parseInt(e.target.value), maxStudySessionMinutes })}
              className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
            <div className="w-20 text-center">
              <span className="text-2xl font-bold text-white">{minRestMinutes}</span>
              <span className="text-gray-400 text-sm ml-1">min</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>5 min (mínimo recomendado)</span>
            <span>60 min</span>
          </div>
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
              min="30"
              max="240"
              step="15"
              value={maxStudySessionMinutes}
              onChange={(e) => onChange({ minStudyMinutes, minRestMinutes, maxStudySessionMinutes: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="w-20 text-center">
              <span className="text-2xl font-bold text-white">{maxStudySessionMinutes}</span>
              <span className="text-gray-400 text-sm ml-1">min</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>30 min</span>
            <span>240 min (4 horas)</span>
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

