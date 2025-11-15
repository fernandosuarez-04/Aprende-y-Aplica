'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  TrashIcon,
  PencilIcon,
  ClockIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { StudySession, StudySessionUpdate, SessionStatus } from '@repo/shared/types';
import { Button } from '@aprende-y-aplica/ui';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: StudySession | null;
  onUpdate: (sessionId: string, updates: StudySessionUpdate) => Promise<void>;
  onDelete: (sessionId: string) => Promise<void>;
}

const STATUS_OPTIONS: { value: SessionStatus; label: string; color: string }[] = [
  { value: 'planned', label: 'Planificado', color: 'bg-indigo-500' },
  { value: 'in_progress', label: 'En progreso', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completado', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500' },
  { value: 'skipped', label: 'Omitido', color: 'bg-gray-500' },
];

export function SessionModal({
  isOpen,
  onClose,
  session,
  onUpdate,
  onDelete,
}: SessionModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<SessionStatus>('planned');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (session) {
      const start = new Date(session.start_time);
      const end = new Date(session.end_time);
      
      setTitle(session.title);
      setDescription(session.description || '');
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0, 5));
      setStatus(session.status);
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [session, isOpen]);

  const handleSave = async () => {
    if (!session) return;

    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      setError('Las fechas y horas son requeridas');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (endDateTime <= startDateTime) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onUpdate(session.id, {
        title: title.trim(),
        description: description.trim() || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status,
        duration_minutes: Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!session) return;

    setIsLoading(true);
    setError(null);

    try {
      await onDelete(session.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen || !session) return null;

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
                {showDeleteConfirm ? 'Eliminar Sesión' : 'Editar Sesión'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {showDeleteConfirm
                  ? 'Esta acción no se puede deshacer'
                  : 'Modifica los detalles de tu sesión de estudio'}
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

            {showDeleteConfirm ? (
              <div className="space-y-4">
                <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                      <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        ¿Estás seguro de que deseas eliminar esta sesión?
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        La sesión <strong>"{session.title}"</strong> programada para{' '}
                        <strong>{formatDate(session.start_time)}</strong> será eliminada
                        permanentemente.
                      </p>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Eliminando...' : 'Sí, eliminar'}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={isLoading}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Ej: Repaso de álgebra"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    placeholder="Notas adicionales sobre esta sesión..."
                  />
                </div>

                {/* Fechas y horas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <CalendarDaysIcon className="w-4 h-4 inline mr-2" />
                      Fecha de inicio *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <ClockIcon className="w-4 h-4 inline mr-2" />
                      Hora de inicio *
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <CalendarDaysIcon className="w-4 h-4 inline mr-2" />
                      Fecha de fin *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <ClockIcon className="w-4 h-4 inline mr-2" />
                      Hora de fin *
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Estado
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setStatus(option.value)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          status === option.value
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full ${option.color} flex items-center justify-center`}
                          >
                            {status === option.value ? (
                              <CheckCircleIcon className="w-5 h-5 text-white" />
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-white/50" />
                            )}
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              status === option.value
                                ? 'text-primary'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {option.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Información adicional */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Duración:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {startDate && startTime && endDate && endTime
                          ? `${Math.round(
                              (new Date(`${endDate}T${endTime}`).getTime() -
                                new Date(`${startDate}T${startTime}`).getTime()) /
                                (1000 * 60)
                            )} minutos`
                          : 'No calculada'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Creada:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formatDate(session.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!showDeleteConfirm && (
            <div className="sticky bottom-0 flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                Eliminar
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

