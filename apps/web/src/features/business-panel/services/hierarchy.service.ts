/**
 * Servicio de Jerarquía Organizacional
 *
 * Cliente API para gestionar la estructura jerárquica de una organización
 * (Regiones, Zonas, Equipos)
 */

import type {
  Region,
  Zone,
  Team,
  HierarchyStats,
  HierarchyAnalytics,
  HierarchyConfig,
  CreateRegionRequest,
  UpdateRegionRequest,
  CreateZoneRequest,
  UpdateZoneRequest,
  CreateTeamRequest,
  UpdateTeamRequest,
  AssignUserToTeamRequest,
  AssignZoneManagerRequest,
  AssignRegionalManagerRequest,
  HierarchyTree,
  SeedHierarchyResponse,
  ListRegionsOptions,
  ListZonesOptions,
  ListTeamsOptions,
  UserWithHierarchy,
  HierarchyCourse
} from '../types/hierarchy.types';

const API_BASE = '/api/business/hierarchy';

/**
 * Respuesta genérica de la API
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Helper para hacer requests
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `Error ${response.status}`
      };
    }

    return {
      success: true,
      data: data.data ?? data,
      message: data.message
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión'
    };
  }
}

/**
 * Servicio para gestionar la jerarquía organizacional
 */
export class HierarchyService {
  // =============================================
  // CONFIGURACIÓN Y CONTROL
  // =============================================

  /**
   * Obtiene la configuración de jerarquía de la organización
   */
  static async getConfig(): Promise<HierarchyConfig | null> {
    const result = await fetchApi<{ config: HierarchyConfig }>('/config');
    return result.success ? result.data?.config ?? null : null;
  }

  /**
   * Actualiza la configuración de jerarquía
   */
  static async updateConfig(
    config: Partial<HierarchyConfig>
  ): Promise<ApiResponse<HierarchyConfig>> {
    return fetchApi<HierarchyConfig>('/config', {
      method: 'PUT',
      body: JSON.stringify(config)
    });
  }

  /**
   * Activa la jerarquía para la organización
   */
  static async enableHierarchy(): Promise<ApiResponse<{ enabled: boolean }>> {
    return fetchApi<{ enabled: boolean }>('/enable', {
      method: 'POST'
    });
  }

  /**
   * Desactiva la jerarquía (vuelve a modo plano)
   */
  static async disableHierarchy(): Promise<ApiResponse<{ enabled: boolean }>> {
    return fetchApi<{ enabled: boolean }>('/disable', {
      method: 'POST'
    });
  }

  /**
   * Crea la estructura default (1 región, 1 zona, 1 equipo)
   */
  static async seedDefaultStructure(): Promise<ApiResponse<SeedHierarchyResponse>> {
    return fetchApi<SeedHierarchyResponse>('/seed', {
      method: 'POST'
    });
  }

  /**
   * Obtiene estadísticas de la jerarquía
   */
  static async getStats(): Promise<HierarchyStats | null> {
    const result = await fetchApi<{ stats: HierarchyStats }>('/stats');
    return result.success ? result.data?.stats ?? null : null;
  }

  /**
   * Obtiene analíticas visuales detalladas de una entidad
   */
  static async getVisualAnalytics(entityType: 'region' | 'zone' | 'team', entityId: string): Promise<HierarchyAnalytics | null> {
    const result = await fetchApi<{ analytics: HierarchyAnalytics }>(`/analytics?type=${entityType}&id=${entityId}`);
    return result.success ? result.data?.analytics ?? null : null;
  }

  /**
   * Obtiene los cursos asociados a una entidad
   */
  static async getEntityCourses(entityType: 'region' | 'zone' | 'team', entityId: string): Promise<HierarchyCourse[]> {
    const result = await fetchApi<{ courses: HierarchyCourse[] }>(`/courses?type=${entityType}&id=${entityId}`);
    return result.success ? result.data?.courses ?? [] : [];
  }

  /**
   * Obtiene las asignaciones de cursos de una entidad
   */
  static async getEntityAssignments(entityType: 'region' | 'zone' | 'team', entityId: string) {
    const { HierarchyAssignmentsService } = await import('./hierarchy-assignments.service');
    return HierarchyAssignmentsService.getEntityAssignments(entityType, entityId);
  }

  /**
   * Asigna cursos a todos los usuarios de una entidad de jerarquía
   */
  static async assignCoursesToEntity(
    entityType: 'region' | 'zone' | 'team',
    entityId: string,
    courseIds: string[],
    options?: {
      start_date?: string
      due_date?: string
      approach?: 'fast' | 'balanced' | 'long' | 'custom'
      message?: string
    }
  ): Promise<ApiResponse<{
    entity_type: string
    entity_id: string
    entity_name: string
    total_users: number
    results: Array<{
      course_id: string
      course_title?: string
      success: boolean
      assigned_count?: number
      already_assigned_count?: number
      error?: string
      message?: string
    }>
  }>> {
    return fetchApi(`/courses/assign`, {
      method: 'POST',
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        course_ids: courseIds,
        ...options
      })
    })
  }

  // =============================================
  // REGIONES
  // =============================================

  /**
   * Lista todas las regiones de la organización
   */
  static async getRegions(options?: ListRegionsOptions): Promise<Region[]> {
    const params = new URLSearchParams();
    if (options?.includeInactive) params.set('includeInactive', 'true');
    if (options?.withCounts) params.set('withCounts', 'true');

    const queryString = params.toString();
    const endpoint = `/regions${queryString ? `?${queryString}` : ''}`;

    const result = await fetchApi<{ regions: Region[] }>(endpoint);
    return result.success ? result.data?.regions ?? [] : [];
  }

  /**
   * Obtiene una región por ID
   */
  static async getRegion(regionId: string): Promise<Region | null> {
    const result = await fetchApi<{ region: Region }>(`/regions/${regionId}`);
    return result.success ? result.data?.region ?? null : null;
  }

  /**
   * Crea una nueva región
   */
  static async createRegion(data: CreateRegionRequest): Promise<ApiResponse<Region>> {
    return fetchApi<Region>('/regions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Actualiza una región existente
   */
  static async updateRegion(
    regionId: string,
    data: UpdateRegionRequest
  ): Promise<ApiResponse<Region>> {
    return fetchApi<Region>(`/regions/${regionId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Elimina una región (y sus zonas/equipos en cascada)
   */
  static async deleteRegion(regionId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/regions/${regionId}`, {
      method: 'DELETE'
    });
  }

  // =============================================
  // ZONAS
  // =============================================

  /**
   * Lista todas las zonas (opcionalmente filtradas por región)
   */
  static async getZones(options?: ListZonesOptions): Promise<Zone[]> {
    const params = new URLSearchParams();
    if (options?.regionId) params.set('regionId', options.regionId);
    if (options?.includeInactive) params.set('includeInactive', 'true');
    if (options?.withCounts) params.set('withCounts', 'true');

    const queryString = params.toString();
    const endpoint = `/zones${queryString ? `?${queryString}` : ''}`;

    const result = await fetchApi<{ zones: Zone[] }>(endpoint);
    return result.success ? result.data?.zones ?? [] : [];
  }

  /**
   * Obtiene una zona por ID
   */
  static async getZone(zoneId: string): Promise<Zone | null> {
    const result = await fetchApi<{ zone: Zone }>(`/zones/${zoneId}`);
    return result.success ? result.data?.zone ?? null : null;
  }

  /**
   * Crea una nueva zona
   */
  static async createZone(data: CreateZoneRequest): Promise<ApiResponse<Zone>> {
    return fetchApi<Zone>('/zones', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Actualiza una zona existente
   */
  static async updateZone(
    zoneId: string,
    data: UpdateZoneRequest
  ): Promise<ApiResponse<Zone>> {
    return fetchApi<Zone>(`/zones/${zoneId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Elimina una zona (y sus equipos en cascada)
   */
  static async deleteZone(zoneId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/zones/${zoneId}`, {
      method: 'DELETE'
    });
  }

  // =============================================
  // EQUIPOS
  // =============================================

  /**
   * Lista todos los equipos (opcionalmente filtrados)
   */
  static async getTeams(options?: ListTeamsOptions): Promise<Team[]> {
    const params = new URLSearchParams();
    if (options?.zoneId) params.set('zoneId', options.zoneId);
    if (options?.regionId) params.set('regionId', options.regionId);
    if (options?.includeInactive) params.set('includeInactive', 'true');
    if (options?.withCounts) params.set('withCounts', 'true');

    const queryString = params.toString();
    const endpoint = `/teams${queryString ? `?${queryString}` : ''}`;

    const result = await fetchApi<{ teams: Team[] }>(endpoint);
    return result.success ? result.data?.teams ?? [] : [];
  }

  /**
   * Obtiene un equipo por ID
   */
  static async getTeam(teamId: string): Promise<Team | null> {
    const result = await fetchApi<{ team: Team }>(`/teams/${teamId}`);
    return result.success ? result.data?.team ?? null : null;
  }

  /**
   * Crea un nuevo equipo
   */
  static async createTeam(data: CreateTeamRequest): Promise<ApiResponse<Team>> {
    return fetchApi<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Actualiza un equipo existente
   */
  static async updateTeam(
    teamId: string,
    data: UpdateTeamRequest
  ): Promise<ApiResponse<Team>> {
    return fetchApi<Team>(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Elimina un equipo
   */
  static async deleteTeam(teamId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/teams/${teamId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Obtiene los miembros de un equipo
   */
  static async getTeamMembers(teamId: string): Promise<UserWithHierarchy[]> {
    const result = await fetchApi<{ members: UserWithHierarchy[] }>(
      `/teams/${teamId}/members`
    );
    return result.success ? result.data?.members ?? [] : [];
  }

  // =============================================
  // ASIGNACIÓN DE USUARIOS
  // =============================================

  /**
   * Asigna un usuario a un equipo
   */
  static async assignUserToTeam(
    data: AssignUserToTeamRequest
  ): Promise<ApiResponse<UserWithHierarchy>> {
    return fetchApi<UserWithHierarchy>('/users/assign', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Remueve un usuario de su equipo actual
   */
  static async removeUserFromTeam(userId: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/users/${userId}/unassign`, {
      method: 'POST'
    });
  }

  /**
   * Asigna un usuario como gerente de zona
   */
  static async assignZoneManager(
    data: AssignZoneManagerRequest
  ): Promise<ApiResponse<UserWithHierarchy>> {
    return fetchApi<UserWithHierarchy>('/users/assign-zone-manager', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Asigna un usuario como gerente regional
   */
  static async assignRegionalManager(
    data: AssignRegionalManagerRequest
  ): Promise<ApiResponse<UserWithHierarchy>> {
    return fetchApi<UserWithHierarchy>('/users/assign-regional-manager', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Obtiene usuarios sin equipo asignado
   */
  static async getUnassignedUsers(): Promise<UserWithHierarchy[]> {
    const result = await fetchApi<{ users: UserWithHierarchy[] }>(
      '/users/unassigned'
    );
    return result.success ? result.data?.users ?? [] : [];
  }

  /**
   * Obtiene todos los usuarios con su información de jerarquía
   */
  static async getUsersWithHierarchy(): Promise<UserWithHierarchy[]> {
    const result = await fetchApi<{ users: UserWithHierarchy[] }>('/users');
    return result.success ? result.data?.users ?? [] : [];
  }

  /**
   * Obtiene usuarios disponibles para asignar como gerentes/líderes
   * Filtra por roles que pueden ser gerentes (admin, regional_manager, zone_manager, team_leader)
   */
  static async getAvailableManagers(role?: 'regional_manager' | 'zone_manager' | 'team_leader'): Promise<UserWithHierarchy[]> {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    
    const queryString = params.toString();
    const endpoint = `/users/available-managers${queryString ? `?${queryString}` : ''}`;
    
    const result = await fetchApi<{ users: UserWithHierarchy[] }>(endpoint);
    return result.success ? result.data?.users ?? [] : [];
  }

  // =============================================
  // JERARQUÍA COMPLETA
  // =============================================

  /**
   * Obtiene la jerarquía completa en estructura de árbol
   */
  static async getFullHierarchy(): Promise<HierarchyTree> {
    const result = await fetchApi<HierarchyTree>('/full');
    return result.success && result.data
      ? result.data
      : { regions: [] };
  }

  /**
   * Obtiene un resumen de la jerarquía para selectores
   */
  static async getHierarchySummary(): Promise<{
    regions: Array<{ id: string; name: string; code?: string }>;
    zones: Array<{ id: string; name: string; region_id: string; code?: string }>;
    teams: Array<{ id: string; name: string; zone_id: string; code?: string }>;
  }> {
    const result = await fetchApi<{
      regions: Array<{ id: string; name: string; code?: string }>;
      zones: Array<{ id: string; name: string; region_id: string; code?: string }>;
      teams: Array<{ id: string; name: string; zone_id: string; code?: string }>;
    }>('/summary');

    return result.success && result.data
      ? result.data
      : { regions: [], zones: [], teams: [] };
  }

  // =============================================
  // VALIDACIONES
  // =============================================

  /**
   * Verifica si se puede activar la jerarquía
   * (requiere al menos 1 equipo y todos los usuarios asignados)
   */
  static async canEnableHierarchy(): Promise<{
    canEnable: boolean;
    issues: string[];
  }> {
    const result = await fetchApi<{ canEnable: boolean; issues: string[] }>(
      '/can-enable'
    );
    return result.success && result.data
      ? result.data
      : { canEnable: false, issues: ['Error al verificar'] };
  }

  /**
   * Verifica si un nombre de región ya existe
   */
  static async isRegionNameAvailable(name: string): Promise<boolean> {
    const result = await fetchApi<{ available: boolean }>(
      `/regions/check-name?name=${encodeURIComponent(name)}`
    );
    return result.success ? result.data?.available ?? false : false;
  }

  /**
   * Verifica si un nombre de zona ya existe en una región
   */
  static async isZoneNameAvailable(name: string, regionId: string): Promise<boolean> {
    const result = await fetchApi<{ available: boolean }>(
      `/zones/check-name?name=${encodeURIComponent(name)}&regionId=${regionId}`
    );
    return result.success ? result.data?.available ?? false : false;
  }

  /**
   * Verifica si un nombre de equipo ya existe en una zona
   */
  static async isTeamNameAvailable(name: string, zoneId: string): Promise<boolean> {
    const result = await fetchApi<{ available: boolean }>(
      `/teams/check-name?name=${encodeURIComponent(name)}&zoneId=${zoneId}`
    );
    return result.success ? result.data?.available ?? false : false;
  }
}

// Export por defecto
export default HierarchyService;
