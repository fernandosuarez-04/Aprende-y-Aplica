'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, BookOpen, Coffee, CheckCircle2 } from 'lucide-react';

interface BreakInterval {
  interval_minutes: number;
  break_duration_minutes: number;
  break_type: 'short' | 'long';
}

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

interface PlanConfig {
  learningRouteId: string | null;
  learningRouteName: string;
  selectedCourses: Array<{
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    slug: string;
    category: string;
    duration_total_minutes: number;
    level: string;
  }>;
  selectedDays: number[];
  timeSlots: Array<{
    day: number;
    startTime: string;
    endTime: string;
  }>;
  minStudyMinutes: number;
  minRestMinutes: number;
  maxStudySessionMinutes: number;
  minLessonTimeMinutes: number;
  shortestLesson?: ShortestLesson | null;
  longestLesson?: LongestLesson | null;
  breakIntervals?: BreakInterval[];
}

interface PlanSummaryProps {
  config: PlanConfig;
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

export function PlanSummary({ config }: PlanSummaryProps) {
  const getDaySlots = (day: number) => {
    return config.timeSlots.filter(slot => slot.day === day);
  };

  const calculateTotalHours = () => {
    let totalMinutes = 0;
    config.timeSlots.forEach(slot => {
      const [startHour, startMin] = slot.startTime.split(':').map(Number);
      const [endHour, endMin] = slot.endTime.split(':').map(Number);
      const start = startHour * 60 + startMin;
      const end = endHour * 60 + endMin;
      totalMinutes += end - start;
    });
    return (totalMinutes / 60).toFixed(1);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-green-500/20">
          <CheckCircle2 className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Resumen del plan</h2>
          <p className="text-gray-400 text-sm mt-1">
            Revisa tu configuración antes de crear el plan
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Ruta de aprendizaje */}
        {config.learningRouteName && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Ruta de Aprendizaje</h3>
            </div>
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">{config.learningRouteName}</h4>
              <p className="text-gray-400 text-sm">{config.selectedCourses.length} curso{config.selectedCourses.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {config.selectedCourses.map((course) => (
                <div key={course.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{course.title}</p>
                    <p className="text-gray-400 text-xs">{course.duration_total_minutes} min • {course.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Días seleccionados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50"
        >
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Días seleccionados</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.selectedDays.map((dayId) => {
              const day = DAYS.find(d => d.id === dayId);
              return (
                <span
                  key={dayId}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg font-medium"
                >
                  {day?.label}
                </span>
              );
            })}
          </div>
        </motion.div>

        {/* Horarios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50"
        >
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Horarios configurados</h3>
          </div>
          <div className="space-y-3">
            {config.selectedDays.map((dayId) => {
              const day = DAYS.find(d => d.id === dayId);
              const daySlots = getDaySlots(dayId);
              
              if (daySlots.length === 0) return null;

              return (
                <div key={dayId} className="bg-slate-800/50 rounded-xl p-4">
                  <div className="font-semibold text-white mb-2">{day?.label}</div>
                  <div className="space-y-2">
                    {daySlots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-300">
                        <span className="text-cyan-400">•</span>
                        <span>{slot.startTime} - {slot.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-600/50">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total semanal:</span>
              <span className="text-xl font-bold text-white">{calculateTotalHours()} horas</span>
            </div>
          </div>
        </motion.div>

        {/* Configuración de tiempos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50"
        >
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Configuración de tiempos</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <div className="text-gray-400 text-sm">Tiempo mínimo de estudio</div>
              </div>
              <div className="text-2xl font-bold text-white mb-3">{config.minStudyMinutes} min</div>
              {config.shortestLesson && (
                <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-slate-700/50">
                  <div className="text-gray-300 mb-1">
                    <span className="font-semibold">{config.shortestLesson.module_title}:</span> {config.shortestLesson.lesson_title}
                  </div>
                  <div className="text-blue-400 font-medium">
                    Tiempo completo: {config.shortestLesson.total_minutes} min
                  </div>
                </div>
              )}
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <div className="text-gray-400 text-sm">Tiempo máximo de sesión</div>
              </div>
              <div className="text-2xl font-bold text-white mb-3">{config.maxStudySessionMinutes} min</div>
              {config.longestLesson && (
                <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-slate-700/50">
                  <div className="text-gray-300 mb-1">
                    <span className="font-semibold">{config.longestLesson.module_title}:</span> {config.longestLesson.lesson_title}
                  </div>
                  <div className="text-purple-400 font-medium">
                    Tiempo completo: {config.longestLesson.total_minutes} min
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Intervalos de descanso */}
        {config.breakIntervals && config.breakIntervals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-700/30 rounded-2xl p-6 border border-slate-600/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <Coffee className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Intervalos de descanso</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Calculados automáticamente según mejores prácticas de aprendizaje (Pomodoro flexible)
            </p>
            <div className="space-y-3">
              {config.breakIntervals.map((interval, index) => (
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
            </div>
            <div className="mt-4 pt-4 border-t border-slate-600/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Total de descansos:</span>
                <span className="text-white font-semibold">{config.breakIntervals.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-400">Tiempo total de descanso:</span>
                <span className="text-white font-semibold">
                  {config.breakIntervals.reduce((sum, i) => sum + i.break_duration_minutes, 0)} min
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

