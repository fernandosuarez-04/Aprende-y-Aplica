'use client';

import { ScormAttempt } from '@/lib/scorm/types';

interface SCORMProgressProps {
  attempt: ScormAttempt;
  className?: string;
}

export function SCORMProgress({ attempt, className = '' }: SCORMProgressProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'passed':
        return 'Aprobado';
      case 'failed':
        return 'Reprobado';
      case 'incomplete':
        return 'En progreso';
      case 'not attempted':
        return 'No iniciado';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const scorePercentage = attempt.score_raw != null && attempt.score_max != null
    ? Math.round((attempt.score_raw / attempt.score_max) * 100)
    : null;

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-neutral-500">
          Intento #{attempt.attempt_number}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attempt.lesson_status)}`}>
          {getStatusLabel(attempt.lesson_status)}
        </span>
      </div>

      {scorePercentage !== null && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-neutral-600">Puntuación</span>
            <span className="text-sm font-medium text-neutral-900">
              {attempt.score_raw} / {attempt.score_max} ({scorePercentage}%)
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                scorePercentage >= 70 ? 'bg-green-500' :
                scorePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-neutral-500">Iniciado</span>
          <p className="text-neutral-900">{formatDate(attempt.started_at)}</p>
        </div>
        <div>
          <span className="text-neutral-500">Último acceso</span>
          <p className="text-neutral-900">{formatDate(attempt.last_accessed_at)}</p>
        </div>
        {attempt.completed_at && (
          <div className="col-span-2">
            <span className="text-neutral-500">Completado</span>
            <p className="text-neutral-900">{formatDate(attempt.completed_at)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
