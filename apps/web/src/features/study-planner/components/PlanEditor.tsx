'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Save, Loader2, Calendar, Clock, BookOpen, 
  Coffee, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';

interface PlanEditorProps {
  plan: {
    id: string;
    name: string;
    description?: string;
    courses: Array<{
      courseId: string;
      title: string;
      isSelected: boolean;
    }>;
    selectedDays: string[];
    minSessionMinutes: number;
    maxSessionMinutes: number;
    preferredSessionType: 'short' | 'medium' | 'long';
    breakDurationMinutes: number;
  };
  availableCourses: Array<{
    courseId: string;
    title: string;
  }>;
  onSave: (updates: Partial<PlanEditorProps['plan']>) => Promise<void>;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  { id: 'lunes', label: 'Lunes' },
  { id: 'martes', label: 'Martes' },
  { id: 'miércoles', label: 'Miércoles' },
  { id: 'jueves', label: 'Jueves' },
  { id: 'viernes', label: 'Viernes' },
  { id: 'sábado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' }
];

const SESSION_TYPES = [
  { type: 'short' as const, label: 'Corta', range: '20-35 min', min: 20, max: 35 },
  { type: 'medium' as const, label: 'Media', range: '45-60 min', min: 45, max: 60 },
  { type: 'long' as const, label: 'Larga', range: '75-120 min', min: 75, max: 120 }
];

export function PlanEditor({ plan, availableCourses, onSave, onCancel }: PlanEditorProps) {
  const [editedPlan, setEditedPlan] = useState(plan);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('courses');

  const toggleDay = (dayId: string) => {
    setEditedPlan(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayId)
        ? prev.selectedDays.filter(d => d !== dayId)
        : [...prev.selectedDays, dayId]
    }));
  };

  const toggleCourse = (courseId: string) => {
    setEditedPlan(prev => ({
      ...prev,
      courses: prev.courses.map(c => 
        c.courseId === courseId ? { ...c, isSelected: !c.isSelected } : c
      )
    }));
  };

  const changeSessionType = (type: 'short' | 'medium' | 'long') => {
    const sessionConfig = SESSION_TYPES.find(s => s.type === type)!;
    setEditedPlan(prev => ({
      ...prev,
      preferredSessionType: type,
      minSessionMinutes: sessionConfig.min,
      maxSessionMinutes: sessionConfig.max
    }));
  };

  const handleSave = async () => {
    // Validaciones
    if (editedPlan.selectedDays.length === 0) {
      setError('Debes seleccionar al menos un día de estudio.');
      return;
    }

    if (!editedPlan.courses.some(c => c.isSelected)) {
      setError('Debes seleccionar al menos un curso.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(editedPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const renderSection = (
    id: string, 
    title: string, 
    icon: React.ReactNode, 
    content: React.ReactNode
  ) => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        </div>
        {expandedSection === id ? (
          <ChevronUp size={20} className="text-gray-500" />
        ) : (
          <ChevronDown size={20} className="text-gray-500" />
        )}
      </button>
      
      {expandedSection === id && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="p-4 bg-white dark:bg-gray-800"
        >
          {content}
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Plan</h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
          {/* Nombre del plan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del plan
            </label>
            <input
              type="text"
              value={editedPlan.name}
              onChange={e => setEditedPlan(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Mi plan de estudios"
            />
          </div>

          {/* Sección de cursos */}
          {renderSection(
            'courses',
            'Cursos',
            <BookOpen size={18} className="text-purple-500" />,
            <div className="space-y-2">
              {editedPlan.courses.map(course => (
                <label
                  key={course.courseId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={course.isSelected}
                    onChange={() => toggleCourse(course.courseId)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-gray-900 dark:text-white">{course.title}</span>
                </label>
              ))}
            </div>
          )}

          {/* Sección de días */}
          {renderSection(
            'days',
            'Días de estudio',
            <Calendar size={18} className="text-blue-500" />,
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    editedPlan.selectedDays.includes(day.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}

          {/* Sección de sesiones */}
          {renderSection(
            'sessions',
            'Duración de sesiones',
            <Clock size={18} className="text-green-500" />,
            <div className="grid grid-cols-3 gap-3">
              {SESSION_TYPES.map(session => (
                <button
                  key={session.type}
                  onClick={() => changeSessionType(session.type)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    editedPlan.preferredSessionType === session.type
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                  }`}
                >
                  <p className="font-semibold text-gray-900 dark:text-white">{session.label}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{session.range}</p>
                </button>
              ))}
            </div>
          )}

          {/* Sección de descansos */}
          {renderSection(
            'breaks',
            'Descansos',
            <Coffee size={18} className="text-cyan-500" />,
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración del descanso (minutos)
              </label>
              <input
                type="number"
                min={5}
                max={30}
                value={editedPlan.breakDurationMinutes}
                onChange={e => setEditedPlan(prev => ({ 
                  ...prev, 
                  breakDurationMinutes: parseInt(e.target.value) || 10 
                }))}
                className="w-32 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Los descansos se programarán automáticamente según la duración de cada sesión.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}


