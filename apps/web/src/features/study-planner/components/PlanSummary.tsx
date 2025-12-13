'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  BookOpen,
  Target,
  CheckCircle,
  AlertTriangle,
  Edit,
  Save,
  ChevronRight,
  User,
  Building2,
  Coffee,
} from 'lucide-react';
import type {
  StudyPlanConfig,
  StudySession,
  CourseInfo,
} from '../types/user-context.types';

interface PlanSummaryProps {
  config: StudyPlanConfig;
  sessions: StudySession[];
  courses: CourseInfo[];
  onEdit?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  warnings?: string[];
  errors?: string[];
}

export function PlanSummary({
  config,
  sessions,
  courses,
  onEdit,
  onConfirm,
  onCancel,
  isLoading = false,
  warnings = [],
  errors = [],
}: PlanSummaryProps) {
  // Calcular estadísticas
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
  const totalSessions = sessions.length;
  const estimatedWeeks = config.goalHoursPerWeek > 0 
    ? Math.ceil(totalMinutes / (config.goalHoursPerWeek * 60)) 
    : 0;

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const preferredDaysFormatted = config.preferredDays
    .map(d => dayNames[d])
    .join(', ');

  const timeOfDayLabels: Record<string, string> = {
    morning: 'Mañana (6:00 - 12:00)',
    afternoon: 'Tarde (12:00 - 18:00)',
    evening: 'Noche (18:00 - 21:00)',
    night: 'Nocturno (21:00 - 6:00)',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-4"
        >
          <CheckCircle className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Resumen de tu Plan
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Revisa los detalles antes de confirmar
        </p>
      </div>

      {/* Errores */}
      {errors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
                Problemas a resolver
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Advertencias */}
      {warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Recomendaciones
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                {warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Información del plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tipo de usuario */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              {config.userType === 'b2b' ? (
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Tipo de Plan
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {config.userType === 'b2b' ? 'Empresarial (B2B)' : 'Personal (B2C)'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Meta semanal */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Meta Semanal
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {config.goalHoursPerWeek} horas por semana
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Cursos incluidos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            Cursos Incluidos ({courses.length})
          </h3>
        </div>
        <div className="space-y-2">
          {courses.slice(0, 5).map((course, i) => (
            <div
              key={course.id}
              className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700/50 last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {i + 1}.
                </span>
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  {course.title}
                </span>
              </div>
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-gray-600 dark:text-gray-300">
                {course.level}
              </span>
            </div>
          ))}
          {courses.length > 5 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
              +{courses.length - 5} cursos más
            </p>
          )}
        </div>
      </motion.div>

      {/* Configuración de tiempos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            Configuración de Sesiones
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {config.minSessionMinutes}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Min. sesión
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {config.maxSessionMinutes}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Max. sesión
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {config.breakDurationMinutes}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Descanso
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalSessions}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sesiones
            </p>
          </div>
        </div>
      </motion.div>

      {/* Días y horarios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            Días y Horarios
          </h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Días preferidos:
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {preferredDaysFormatted}
            </span>
          </div>
          {config.preferredTimeBlocks.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Horarios:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {config.preferredTimeBlocks.map((block, i) => (
                  <span key={i}>
                    {block.startHour}:{String(block.startMinute).padStart(2, '0')} - 
                    {block.endHour}:{String(block.endMinute).padStart(2, '0')}
                    {i < config.preferredTimeBlocks.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Estimaciones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30"
      >
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Estimaciones
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {totalHours}h
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tiempo total
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {totalSessions}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sesiones
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {estimatedWeeks}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Semanas
            </p>
          </div>
        </div>
      </motion.div>

      {/* Botones de acción */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 pt-4"
      >
        {onEdit && (
          <motion.button
            onClick={onEdit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Edit className="w-5 h-5" />
            Modificar Plan
          </motion.button>
        )}
        
        {onConfirm && (
          <motion.button
            onClick={onConfirm}
            disabled={isLoading || errors.length > 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Confirmar y Guardar
              </>
            )}
          </motion.button>
        )}
      </motion.div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2 transition-colors"
        >
          Cancelar y volver
        </button>
      )}
    </div>
  );
}

export default PlanSummary;
