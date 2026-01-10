'use client';

import { useState, useCallback, useEffect } from 'react';
import { HierarchyService } from '../services/hierarchy.service';
import type {
  Region,
  Zone,
  Team,
  HierarchyStats,
  HierarchyConfig,
  HierarchyTree,
  CreateRegionRequest,
  CreateZoneRequest,
  CreateTeamRequest,
  UpdateRegionRequest,
  UpdateZoneRequest,
  UpdateTeamRequest,
  AssignUserToTeamRequest,
  UserWithHierarchy
} from '../types/hierarchy.types';

/**
 * Estado del hook de jerarquía
 */
interface HierarchyState {
  // Datos
  config: HierarchyConfig | null;
  stats: HierarchyStats | null;
  regions: Region[];
  zones: Zone[];
  teams: Team[];
  unassignedUsers: UserWithHierarchy[];
  hierarchyTree: HierarchyTree | null;

  // Estado de carga
  isLoading: boolean;
  isLoadingConfig: boolean;
  isLoadingStats: boolean;
  isLoadingRegions: boolean;
  isLoadingZones: boolean;
  isLoadingTeams: boolean;
  isLoadingUsers: boolean;

  // Errores
  error: string | null;
}

/**
 * Hook para gestionar la jerarquía organizacional
 */
export function useHierarchy() {
  const [state, setState] = useState<HierarchyState>({
    config: null,
    stats: null,
    regions: [],
    zones: [],
    teams: [],
    unassignedUsers: [],
    hierarchyTree: null,
    isLoading: false,
    isLoadingConfig: false,
    isLoadingStats: false,
    isLoadingRegions: false,
    isLoadingZones: false,
    isLoadingTeams: false,
    isLoadingUsers: false,
    error: null
  });

  // =============================================
  // HELPERS
  // =============================================

  const setLoading = useCallback((key: keyof HierarchyState, value: boolean) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => setError(null), [setError]);

  // =============================================
  // CONFIGURACIÓN
  // =============================================

  const loadConfig = useCallback(async () => {
    setLoading('isLoadingConfig', true);
    clearError();
    try {
      const config = await HierarchyService.getConfig();
      setState(prev => ({ ...prev, config, isLoadingConfig: false }));
      return config;
    } catch (err) {
      setError('Error al cargar configuración');
      setLoading('isLoadingConfig', false);
      return null;
    }
  }, [setLoading, setError, clearError]);

  const updateConfig = useCallback(async (config: Partial<HierarchyConfig>) => {
    setLoading('isLoadingConfig', true);
    clearError();
    try {
      const result = await HierarchyService.updateConfig(config);
      if (result.success && result.data) {
        setState(prev => ({ ...prev, config: result.data!, isLoadingConfig: false }));
        return true;
      }
      setError(result.error || 'Error al actualizar');
      setLoading('isLoadingConfig', false);
      return false;
    } catch (err) {
      setError('Error al actualizar configuración');
      setLoading('isLoadingConfig', false);
      return false;
    }
  }, [setLoading, setError, clearError]);

  const enableHierarchy = useCallback(async () => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.enableHierarchy();
      if (result.success) {
        await loadConfig();
        await loadStats();
        return { success: true };
      }
      setError(result.error || 'Error al activar jerarquía');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al activar jerarquía';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadConfig]);

  const disableHierarchy = useCallback(async () => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.disableHierarchy();
      if (result.success) {
        await loadConfig();
        await loadStats();
        return { success: true };
      }
      setError(result.error || 'Error al desactivar jerarquía');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al desactivar jerarquía';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadConfig]);

  const seedDefaultStructure = useCallback(async () => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.seedDefaultStructure();
      if (result.success) {
        await Promise.all([loadStats(), loadRegions(), loadZones(), loadTeams()]);
        return { success: true, data: result.data };
      }
      setError(result.error || 'Error al crear estructura');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al crear estructura';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError]);

  // =============================================
  // ESTADÍSTICAS
  // =============================================

  const loadStats = useCallback(async () => {
    setLoading('isLoadingStats', true);
    try {
      const stats = await HierarchyService.getStats();
      setState(prev => ({ ...prev, stats, isLoadingStats: false }));
      return stats;
    } catch (err) {
      setLoading('isLoadingStats', false);
      return null;
    }
  }, [setLoading]);

  // =============================================
  // REGIONES
  // =============================================

  const loadRegions = useCallback(async (options?: { includeInactive?: boolean; withCounts?: boolean }) => {
    setLoading('isLoadingRegions', true);
    try {
      const regions = await HierarchyService.getRegions(options);
      setState(prev => ({ ...prev, regions, isLoadingRegions: false }));
      return regions;
    } catch (err) {
      setLoading('isLoadingRegions', false);
      return [];
    }
  }, [setLoading]);

  const createRegion = useCallback(async (data: CreateRegionRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.createRegion(data);
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          regions: [...prev.regions, result.data!],
          isLoading: false
        }));
        await loadStats();
        return { success: true, data: result.data };
      }
      setError(result.error || 'Error al crear región');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al crear región';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadStats]);

  const updateRegion = useCallback(async (regionId: string, data: UpdateRegionRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.updateRegion(regionId, data);
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          regions: prev.regions.map(r => r.id === regionId ? result.data! : r),
          isLoading: false
        }));
        return { success: true, data: result.data };
      }
      setError(result.error || 'Error al actualizar región');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al actualizar región';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError]);

  const deleteRegion = useCallback(async (regionId: string) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.deleteRegion(regionId);
      if (result.success) {
        setState(prev => ({
          ...prev,
          regions: prev.regions.filter(r => r.id !== regionId),
          isLoading: false
        }));
        await loadStats();
        return { success: true };
      }
      setError(result.error || 'Error al eliminar región');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al eliminar región';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadStats]);

  // =============================================
  // ZONAS
  // =============================================

  const loadZones = useCallback(async (regionId?: string) => {
    setLoading('isLoadingZones', true);
    try {
      const zones = await HierarchyService.getZones({ regionId, withCounts: true });
      setState(prev => ({ ...prev, zones, isLoadingZones: false }));
      return zones;
    } catch (err) {
      setLoading('isLoadingZones', false);
      return [];
    }
  }, [setLoading]);

  const createZone = useCallback(async (data: CreateZoneRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.createZone(data);
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          zones: [...prev.zones, result.data!],
          isLoading: false
        }));
        await loadStats();
        return { success: true, data: result.data };
      }
      setError(result.error || 'Error al crear zona');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al crear zona';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadStats]);

  const updateZone = useCallback(async (zoneId: string, data: UpdateZoneRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.updateZone(zoneId, data);
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          zones: prev.zones.map(z => z.id === zoneId ? result.data! : z),
          isLoading: false
        }));
        return { success: true, data: result.data };
      }
      setError(result.error || 'Error al actualizar zona');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al actualizar zona';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError]);

  const deleteZone = useCallback(async (zoneId: string) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.deleteZone(zoneId);
      if (result.success) {
        setState(prev => ({
          ...prev,
          zones: prev.zones.filter(z => z.id !== zoneId),
          isLoading: false
        }));
        await loadStats();
        return { success: true };
      }
      setError(result.error || 'Error al eliminar zona');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al eliminar zona';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadStats]);

  // =============================================
  // EQUIPOS
  // =============================================

  const loadTeams = useCallback(async (zoneId?: string) => {
    setLoading('isLoadingTeams', true);
    try {
      const teams = await HierarchyService.getTeams({ zoneId, withCounts: true });
      setState(prev => ({ ...prev, teams, isLoadingTeams: false }));
      return teams;
    } catch (err) {
      setLoading('isLoadingTeams', false);
      return [];
    }
  }, [setLoading]);

  const createTeam = useCallback(async (data: CreateTeamRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.createTeam(data);
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          teams: [...prev.teams, result.data!],
          isLoading: false
        }));
        await loadStats();
        return { success: true, data: result.data };
      }
      setError(result.error || 'Error al crear equipo');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al crear equipo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadStats]);

  const updateTeam = useCallback(async (teamId: string, data: UpdateTeamRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.updateTeam(teamId, data);
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          teams: prev.teams.map(t => t.id === teamId ? result.data! : t),
          isLoading: false
        }));
        return { success: true, data: result.data };
      }
      setError(result.error || 'Error al actualizar equipo');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al actualizar equipo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError]);

  const deleteTeam = useCallback(async (teamId: string) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.deleteTeam(teamId);
      if (result.success) {
        setState(prev => ({
          ...prev,
          teams: prev.teams.filter(t => t.id !== teamId),
          isLoading: false
        }));
        await loadStats();
        return { success: true };
      }
      setError(result.error || 'Error al eliminar equipo');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al eliminar equipo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadStats]);

  // =============================================
  // USUARIOS
  // =============================================

  const loadUnassignedUsers = useCallback(async () => {
    setLoading('isLoadingUsers', true);
    try {
      const users = await HierarchyService.getUnassignedUsers();
      setState(prev => ({ ...prev, unassignedUsers: users, isLoadingUsers: false }));
      return users;
    } catch (err) {
      setLoading('isLoadingUsers', false);
      return [];
    }
  }, [setLoading]);

  const assignUserToTeam = useCallback(async (data: AssignUserToTeamRequest) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.assignUserToTeam(data);
      if (result.success) {
        // Refrescar lista de no asignados y estadísticas
        await Promise.all([loadUnassignedUsers(), loadStats(), loadTeams()]);
        return { success: true };
      }
      setError(result.error || 'Error al asignar usuario');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al asignar usuario';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadUnassignedUsers, loadStats, loadTeams]);

  const removeUserFromTeam = useCallback(async (userId: string) => {
    setLoading('isLoading', true);
    clearError();
    try {
      const result = await HierarchyService.removeUserFromTeam(userId);
      if (result.success) {
        await Promise.all([loadUnassignedUsers(), loadStats(), loadTeams()]);
        return { success: true };
      }
      setError(result.error || 'Error al desasignar usuario');
      return { success: false, error: result.error };
    } catch (err) {
      const errorMsg = 'Error al desasignar usuario';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading('isLoading', false);
    }
  }, [setLoading, setError, clearError, loadUnassignedUsers, loadStats, loadTeams]);

  // =============================================
  // JERARQUÍA COMPLETA
  // =============================================

  const loadFullHierarchy = useCallback(async () => {
    setLoading('isLoading', true);
    try {
      const tree = await HierarchyService.getFullHierarchy();
      setState(prev => ({ ...prev, hierarchyTree: tree, isLoading: false }));
      return tree;
    } catch (err) {
      setLoading('isLoading', false);
      return null;
    }
  }, [setLoading]);

  // =============================================
  // CARGA INICIAL
  // =============================================

  const loadAll = useCallback(async () => {
    setLoading('isLoading', true);
    try {
      await Promise.all([
        loadConfig(),
        loadStats(),
        loadRegions({ withCounts: true }),
        loadZones(),
        loadTeams(),
        loadUnassignedUsers(),
        loadFullHierarchy()
      ]);
    } finally {
      setLoading('isLoading', false);
    }
  }, [loadConfig, loadStats, loadRegions, loadZones, loadTeams, loadUnassignedUsers, loadFullHierarchy, setLoading]);

  // =============================================
  // COMPUTED VALUES
  // =============================================

  const isHierarchyEnabled = state.config?.hierarchy_enabled ?? false;
  const hasStructure = (state.stats?.teams_count ?? 0) > 0;
  const hasUnassignedUsers = (state.stats?.users_unassigned ?? 0) > 0;
  const canEnableHierarchy = hasStructure && !hasUnassignedUsers;

  // =============================================
  // RETURN
  // =============================================

  return {
    // Estado
    ...state,

    // Computed
    isHierarchyEnabled,
    hasStructure,
    hasUnassignedUsers,
    canEnableHierarchy,

    // Acciones de configuración
    loadConfig,
    updateConfig,
    enableHierarchy,
    disableHierarchy,
    seedDefaultStructure,

    // Acciones de datos
    loadStats,
    loadRegions,
    loadZones,
    loadTeams,
    loadUnassignedUsers,
    loadFullHierarchy,
    loadAll,

    // CRUD Regiones
    createRegion,
    updateRegion,
    deleteRegion,

    // CRUD Zonas
    createZone,
    updateZone,
    deleteZone,

    // CRUD Equipos
    createTeam,
    updateTeam,
    deleteTeam,

    // Usuarios
    assignUserToTeam,
    removeUserFromTeam,

    // Utilidades
    clearError
  };
}

export default useHierarchy;
