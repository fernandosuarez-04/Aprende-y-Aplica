'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHierarchy } from '../../hooks/useHierarchy';
import { ROLE_LABELS, SCOPE_LABELS } from '../../types/hierarchy.types';

/**
 * Panel de configuración de jerarquía organizacional
 */
export function HierarchySettings() {
  const { t } = useTranslation('common');
  const {
    config,
    stats,
    isLoading,
    isLoadingConfig,
    isLoadingStats,
    error,
    isHierarchyEnabled,
    hasStructure,
    hasUnassignedUsers,
    canEnableHierarchy,
    loadConfig,
    loadStats,
    enableHierarchy,
    disableHierarchy,
    seedDefaultStructure,
    clearError
  } = useHierarchy();

  const [showConfirmEnable, setShowConfirmEnable] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
    loadStats();
  }, [loadConfig, loadStats]);

  const handleCreateStructure = async () => {
    setActionError(null);
    const result = await seedDefaultStructure();
    if (!result.success) {
      setActionError(result.error || 'Error al crear estructura');
    }
  };

  const handleEnableHierarchy = async () => {
    setActionError(null);
    const result = await enableHierarchy();
    if (result.success) {
      setShowConfirmEnable(false);
    } else {
      setActionError(result.error || 'Error al activar');
    }
  };

  const handleDisableHierarchy = async () => {
    setActionError(null);
    const result = await disableHierarchy();
    if (result.success) {
      setShowConfirmDisable(false);
    } else {
      setActionError(result.error || 'Error al desactivar');
    }
  };

  if (isLoadingConfig || isLoadingStats) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
          <div className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Estructura Jerárquica
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Organiza tu equipo en Regiones, Zonas y Equipos para segmentar el acceso a datos
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isHierarchyEnabled
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
          }`}>
            {isHierarchyEnabled ? 'Activa' : 'Inactiva'}
          </div>
        </div>

        {/* Errores */}
        {(error || actionError) && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error || actionError}
            </p>
            <button
              onClick={() => { clearError(); setActionError(null); }}
              className="text-xs text-red-500 hover:text-red-700 mt-1"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard label="Regiones" value={stats.regions_count} />
            <StatCard label="Zonas" value={stats.zones_count} />
            <StatCard label="Equipos" value={stats.teams_count} />
            <StatCard label="Asignados" value={stats.users_assigned} variant="success" />
            <StatCard label="Sin asignar" value={stats.users_unassigned} variant={stats.users_unassigned > 0 ? 'warning' : 'default'} />
          </div>
        )}

        {/* Acciones */}
        <div className="space-y-4">
          {/* Si no hay estructura, mostrar botón para crearla */}
          {!hasStructure && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Comenzar con estructura básica
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Crea automáticamente una región, zona y equipo inicial para comenzar a organizar tu equipo.
              </p>
              <button
                onClick={handleCreateStructure}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creando...' : 'Crear estructura inicial'}
              </button>
            </div>
          )}

          {/* Botones de activar/desactivar */}
          {hasStructure && (
            <div className="flex flex-wrap gap-3">
              {!isHierarchyEnabled ? (
                <button
                  onClick={() => setShowConfirmEnable(true)}
                  disabled={!canEnableHierarchy || isLoading}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #10B981, #00D4B3)',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  Activar jerarquía
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmDisable(true)}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  Desactivar jerarquía
                </button>
              )}
            </div>
          )}

          {/* Mensaje si hay usuarios sin asignar */}
          {hasStructure && hasUnassignedUsers && !isHierarchyEnabled && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Hay {stats?.users_unassigned} usuario(s) sin equipo asignado. Asígnelos antes de activar la jerarquía.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Información de roles */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Roles y Permisos
        </h3>
        <div className="space-y-3">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <div key={role} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
              <span className="font-medium text-neutral-900 dark:text-white">{label}</span>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {getRoleDescription(role)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de confirmación para activar */}
      {showConfirmEnable && (
        <ConfirmModal
          title="Activar jerarquía"
          message="Al activar la jerarquía, los usuarios solo podrán ver datos dentro de su ámbito asignado (equipo, zona o región). ¿Desea continuar?"
          confirmLabel="Activar"
          confirmVariant="success"
          onConfirm={handleEnableHierarchy}
          onCancel={() => setShowConfirmEnable(false)}
          isLoading={isLoading}
        />
      )}

      {/* Modal de confirmación para desactivar */}
      {showConfirmDisable && (
        <ConfirmModal
          title="Desactivar jerarquía"
          message="Al desactivar la jerarquía, todos los usuarios podrán ver todos los datos de la organización. La estructura se mantiene pero no se aplican restricciones. ¿Desea continuar?"
          confirmLabel="Desactivar"
          confirmVariant="neutral"
          onConfirm={handleDisableHierarchy}
          onCancel={() => setShowConfirmDisable(false)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

// Componente auxiliar para estadísticas
function StatCard({
  label,
  value,
  variant = 'default'
}: {
  label: string;
  value: number;
  variant?: 'default' | 'success' | 'warning';
}) {
  const variantClasses = {
    default: 'bg-neutral-50 dark:bg-neutral-700/50',
    success: 'bg-green-50 dark:bg-green-900/20',
    warning: 'bg-amber-50 dark:bg-amber-900/20'
  };

  const valueClasses = {
    default: 'text-neutral-900 dark:text-white',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400'
  };

  return (
    <div className={`rounded-lg p-3 ${variantClasses[variant]}`}>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-2xl font-bold ${valueClasses[variant]}`}>
        {value}
      </p>
    </div>
  );
}

// Modal de confirmación
function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmVariant = 'default',
  onConfirm,
  onCancel,
  isLoading
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'default' | 'success' | 'danger' | 'neutral';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const buttonClasses = {
    default: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700',
    danger: 'bg-red-600 hover:bg-red-700',
    neutral: 'bg-neutral-600 hover:bg-neutral-700'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${buttonClasses[confirmVariant]}`}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper para descripciones de roles
function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    owner: 'Control total sin restricciones',
    admin: 'Administrador con acceso según asignación',
    regional_manager: 'Acceso a toda su región',
    zone_manager: 'Acceso a toda su zona',
    team_leader: 'Acceso a su equipo',
    member: 'Acceso a su equipo'
  };
  return descriptions[role] || '';
}

export default HierarchySettings;
