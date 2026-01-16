/**
 * Hook para obtener analíticas de jerarquía con actualización en tiempo real
 * 
 * Usa SWR para polling automático cada 30 segundos, manteniendo las métricas
 * actualizadas sin necesidad de recargar la página manualmente.
 */

import useSWR from 'swr'
import { HierarchyService } from '../services/hierarchy.service'
import { HierarchyAnalytics } from '../types/hierarchy.types'

type EntityType = 'region' | 'zone' | 'team'

interface UseHierarchyAnalyticsOptions {
  /**
   * Intervalo de polling en milisegundos (default: 30000 = 30 segundos)
   */
  refreshInterval?: number
  /**
   * Si está deshabilitado, no hará polling (default: false)
   */
  disabled?: boolean
}

/**
 * Hook para obtener analíticas de una entidad jerárquica con actualización automática
 * 
 * @param entityType - Tipo de entidad ('region' | 'zone' | 'team')
 * @param entityId - ID de la entidad
 * @param options - Opciones de configuración del hook
 * @returns Objeto con analytics, loading, error y función de revalidación manual
 * 
 * @example
 * ```tsx
 * const { analytics, isLoading, error, mutate } = useHierarchyAnalytics('team', teamId)
 * 
 * // Revalidar manualmente si es necesario
 * mutate()
 * ```
 */
export function useHierarchyAnalytics(
  entityType: EntityType,
  entityId: string | null | undefined,
  options: UseHierarchyAnalyticsOptions = {}
) {
  const {
    refreshInterval = 30000, // 30 segundos por defecto
    disabled = false
  } = options

  const key = entityId && !disabled
    ? `hierarchy-analytics-${entityType}-${entityId}`
    : null

  const { data, error, isLoading, mutate } = useSWR<HierarchyAnalytics | null>(
    key,
    async () => {
      if (!entityId) return null
      return await HierarchyService.getVisualAnalytics(entityType, entityId)
    },
    {
      refreshInterval: disabled ? 0 : refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Evitar requests duplicados en 5 segundos
      revalidateIfStale: true,
      onError: (error) => {
        console.error(`Error obteniendo analíticas de ${entityType}:`, error)
      }
    }
  )

  return {
    analytics: data ?? null,
    isLoading,
    error,
    mutate, // Función para revalidar manualmente
    isError: !!error
  }
}

