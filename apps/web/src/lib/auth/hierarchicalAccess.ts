/**
 * Funciones de Acceso Jerárquico para Next.js
 *
 * Proporciona funciones para verificar y filtrar acceso basado en
 * la jerarquía organizacional (Región > Zona > Equipo)
 */

import { createClient } from '@/lib/supabase/server';

// ===========================================
// TIPOS
// ===========================================

export type HierarchyRole =
  | 'owner'
  | 'admin'
  | 'regional_manager'
  | 'zone_manager'
  | 'team_leader'
  | 'member';

export type HierarchyScope = 'organization' | 'region' | 'zone' | 'team';

/**
 * Contexto jerárquico completo de un usuario
 */
export interface HierarchyContext {
  organizationId: string;
  organizationName?: string;
  hierarchyEnabled: boolean;
  userRole: HierarchyRole;
  scope: HierarchyScope;
  // Asignaciones
  regionId: string | null;
  zoneId: string | null;
  teamId: string | null;
  // Nombres para UI
  regionName?: string;
  zoneName?: string;
  teamName?: string;
  // IDs de equipos accesibles
  accessibleTeamIds: string[];
  // Flag: acceso sin restricción
  hasUnlimitedAccess: boolean;
}

/**
 * Ámbito de un recurso
 */
export interface ResourceScope {
  organizationId: string;
  regionId?: string | null;
  zoneId?: string | null;
  teamId?: string | null;
}

/**
 * Resultado de verificación de acceso
 */
export interface AccessResult {
  allowed: boolean;
  reason?: string;
  code?: string;
}

// ===========================================
// OBTENCIÓN DE CONTEXTO
// ===========================================

/**
 * Obtiene el contexto jerárquico completo de un usuario en una organización
 *
 * @param userId - ID del usuario
 * @param organizationId - ID de la organización
 * @returns Contexto jerárquico o null si no se encuentra
 */
export async function getHierarchyContext(
  userId: string,
  organizationId: string
): Promise<HierarchyContext | null> {
  const supabase = await createClient();

  try {
    // 1. Obtener membresía del usuario con info de organización
    const { data: orgUser, error: orgUserError } = await supabase
      .from('organization_users')
      .select(`
        id,
        role,
        team_id,
        zone_id,
        region_id,
        hierarchy_scope,
        status
      `)
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    if (orgUserError || !orgUser) {
      console.warn('Usuario no encontrado en organización:', {
        userId,
        organizationId,
        error: orgUserError?.message
      });
      return null;
    }

    // 2. Obtener configuración de la organización
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, hierarchy_enabled, hierarchy_config')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      console.warn('Organización no encontrada:', organizationId);
      return null;
    }

    const hierarchyEnabled = org.hierarchy_enabled ?? false;
    const userRole = orgUser.role as HierarchyRole;

    // 3. Si la jerarquía no está activada, retornar contexto simple
    if (!hierarchyEnabled) {
      return {
        organizationId,
        organizationName: org.name,
        hierarchyEnabled: false,
        userRole,
        scope: 'organization',
        regionId: null,
        zoneId: null,
        teamId: null,
        accessibleTeamIds: [],
        hasUnlimitedAccess: true
      };
    }

    // 4. Obtener nombres de jerarquía si existen
    let regionName: string | undefined;
    let zoneName: string | undefined;
    let teamName: string | undefined;
    let effectiveZoneId: string | null = orgUser.zone_id;
    let effectiveRegionId: string | null = orgUser.region_id;

    // Si tiene equipo, obtener datos del equipo y derivar zona/región
    if (orgUser.team_id) {
      const { data: team } = await supabase
        .from('organization_teams')
        .select('name, zone_id')
        .eq('id', orgUser.team_id)
        .single();

      if (team) {
        teamName = team.name;
        effectiveZoneId = effectiveZoneId || team.zone_id;
      }
    }

    // Obtener datos de zona
    if (effectiveZoneId) {
      const { data: zone } = await supabase
        .from('organization_zones')
        .select('name, region_id')
        .eq('id', effectiveZoneId)
        .single();

      if (zone) {
        zoneName = zone.name;
        effectiveRegionId = effectiveRegionId || zone.region_id;
      }
    }

    // Obtener datos de región
    if (effectiveRegionId) {
      const { data: region } = await supabase
        .from('organization_regions')
        .select('name')
        .eq('id', effectiveRegionId)
        .single();

      if (region) {
        regionName = region.name;
      }
    }

    // 5. Calcular scope efectivo
    const scope = (orgUser.hierarchy_scope as HierarchyScope) ||
      determineDefaultScope(userRole);

    // 6. Calcular equipos accesibles
    const { accessibleTeamIds, hasUnlimitedAccess } = await calculateAccessibleTeams(
      supabase,
      userRole,
      scope,
      effectiveRegionId,
      effectiveZoneId,
      orgUser.team_id
    );

    return {
      organizationId,
      organizationName: org.name,
      hierarchyEnabled: true,
      userRole,
      scope,
      regionId: effectiveRegionId,
      zoneId: effectiveZoneId,
      teamId: orgUser.team_id,
      regionName,
      zoneName,
      teamName,
      accessibleTeamIds,
      hasUnlimitedAccess
    };

  } catch (error) {
    console.error('Error obteniendo contexto jerárquico:', error);
    return null;
  }
}

/**
 * Calcula los IDs de equipos accesibles para un usuario
 */
async function calculateAccessibleTeams(
  supabase: Awaited<ReturnType<typeof createClient>>,
  role: HierarchyRole,
  scope: HierarchyScope,
  regionId: string | null,
  zoneId: string | null,
  teamId: string | null
): Promise<{ accessibleTeamIds: string[]; hasUnlimitedAccess: boolean }> {
  // Owner o scope organization = acceso ilimitado
  if (role === 'owner' || scope === 'organization') {
    return { accessibleTeamIds: [], hasUnlimitedAccess: true };
  }

  // Admin sin asignación específica = acceso ilimitado
  if (role === 'admin' && !regionId && !zoneId && !teamId) {
    return { accessibleTeamIds: [], hasUnlimitedAccess: true };
  }

  // Scope región: todos los equipos de la región
  if (scope === 'region' && regionId) {
    const { data: zones } = await supabase
      .from('organization_zones')
      .select('id')
      .eq('region_id', regionId)
      .eq('is_active', true);

    if (zones && zones.length > 0) {
      const zoneIds = zones.map(z => z.id);
      const { data: teams } = await supabase
        .from('organization_teams')
        .select('id')
        .in('zone_id', zoneIds)
        .eq('is_active', true);

      return {
        accessibleTeamIds: teams?.map(t => t.id) || [],
        hasUnlimitedAccess: false
      };
    }
    return { accessibleTeamIds: [], hasUnlimitedAccess: false };
  }

  // Scope zona: todos los equipos de la zona
  if (scope === 'zone' && zoneId) {
    const { data: teams } = await supabase
      .from('organization_teams')
      .select('id')
      .eq('zone_id', zoneId)
      .eq('is_active', true);

    return {
      accessibleTeamIds: teams?.map(t => t.id) || [],
      hasUnlimitedAccess: false
    };
  }

  // Scope equipo: solo su equipo
  if (teamId) {
    return {
      accessibleTeamIds: [teamId],
      hasUnlimitedAccess: false
    };
  }

  // Sin asignación
  return { accessibleTeamIds: [], hasUnlimitedAccess: false };
}

/**
 * Determina el scope por defecto basado en el rol
 */
export function determineDefaultScope(role: HierarchyRole): HierarchyScope {
  switch (role) {
    case 'owner':
    case 'admin':
      return 'organization';
    case 'regional_manager':
      return 'region';
    case 'zone_manager':
      return 'zone';
    case 'team_leader':
    case 'member':
    default:
      return 'team';
  }
}

// ===========================================
// VERIFICACIÓN DE ACCESO
// ===========================================

/**
 * Verifica si un usuario tiene acceso a un recurso específico
 *
 * @param context - Contexto jerárquico del usuario
 * @param resource - Ámbito del recurso
 * @returns Resultado de la verificación
 */
export function checkAccess(
  context: HierarchyContext | null,
  resource: ResourceScope
): AccessResult {
  // Sin contexto = sin verificación (permitir)
  if (!context) {
    return { allowed: true };
  }

  // Verificar organización
  if (context.organizationId !== resource.organizationId) {
    return {
      allowed: false,
      reason: 'El recurso pertenece a otra organización',
      code: 'WRONG_ORGANIZATION'
    };
  }

  // Jerarquía desactivada = acceso total
  if (!context.hierarchyEnabled) {
    return { allowed: true };
  }

  // Acceso ilimitado (owner, admin org, etc.)
  if (context.hasUnlimitedAccess) {
    return { allowed: true };
  }

  // Verificar según scope
  switch (context.scope) {
    case 'organization':
      return { allowed: true };

    case 'region':
      if (!resource.regionId) return { allowed: true };
      if (resource.regionId === context.regionId) return { allowed: true };
      return {
        allowed: false,
        reason: 'Recurso fuera de tu región',
        code: 'OUTSIDE_REGION'
      };

    case 'zone':
      if (!resource.zoneId) return { allowed: true };
      if (resource.zoneId === context.zoneId) return { allowed: true };
      return {
        allowed: false,
        reason: 'Recurso fuera de tu zona',
        code: 'OUTSIDE_ZONE'
      };

    case 'team':
      if (!resource.teamId) return { allowed: true };
      if (resource.teamId === context.teamId) return { allowed: true };
      if (context.accessibleTeamIds.includes(resource.teamId)) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Recurso fuera de tu equipo',
        code: 'OUTSIDE_TEAM'
      };

    default:
      return { allowed: true };
  }
}

/**
 * Verifica si el usuario puede gestionar a otro usuario
 */
export function canManageUser(
  managerContext: HierarchyContext | null,
  targetUserScope: ResourceScope
): boolean {
  if (!managerContext) return false;

  // Owner siempre puede
  if (managerContext.userRole === 'owner') return true;

  // Sin jerarquía, solo admin
  if (!managerContext.hierarchyEnabled) {
    return managerContext.userRole === 'admin';
  }

  // Verificar acceso al ámbito del usuario objetivo
  const { allowed } = checkAccess(managerContext, targetUserScope);
  if (!allowed) return false;

  // Solo ciertos roles pueden gestionar
  const managementRoles: HierarchyRole[] = [
    'owner',
    'admin',
    'regional_manager',
    'zone_manager',
    'team_leader'
  ];

  return managementRoles.includes(managerContext.userRole);
}

// ===========================================
// FILTROS PARA SUPABASE
// ===========================================

type SupabaseQuery = ReturnType<ReturnType<typeof createClient>['from']>;

/**
 * Aplica filtros jerárquicos a una query de Supabase
 *
 * @param query - Query de Supabase
 * @param context - Contexto jerárquico
 * @param options - Opciones de configuración
 * @returns Query con filtros aplicados
 */
export function applyHierarchyFilters<T extends SupabaseQuery>(
  query: T,
  context: HierarchyContext | null,
  options: {
    teamIdColumn?: string;
    zoneIdColumn?: string;
    regionIdColumn?: string;
    allowNullTeam?: boolean;
  } = {}
): T {
  const {
    teamIdColumn = 'team_id',
    zoneIdColumn = 'zone_id',
    regionIdColumn = 'region_id',
    allowNullTeam = true
  } = options;

  // Sin contexto o jerarquía desactivada = sin filtros
  if (!context || !context.hierarchyEnabled) {
    return query;
  }

  // Acceso ilimitado = sin filtros
  if (context.hasUnlimitedAccess) {
    return query;
  }

  // Aplicar filtros según scope
  switch (context.scope) {
    case 'organization':
      return query;

    case 'region':
      if (context.regionId) {
        if (allowNullTeam) {
          return query.or(
            `${regionIdColumn}.eq.${context.regionId},${regionIdColumn}.is.null`
          ) as T;
        }
        return query.eq(regionIdColumn, context.regionId) as T;
      }
      break;

    case 'zone':
      if (context.zoneId) {
        if (allowNullTeam) {
          return query.or(
            `${zoneIdColumn}.eq.${context.zoneId},${zoneIdColumn}.is.null`
          ) as T;
        }
        return query.eq(zoneIdColumn, context.zoneId) as T;
      }
      break;

    case 'team':
      if (context.accessibleTeamIds.length > 0) {
        if (allowNullTeam) {
          return query.or(
            `${teamIdColumn}.in.(${context.accessibleTeamIds.join(',')}),${teamIdColumn}.is.null`
          ) as T;
        }
        return query.in(teamIdColumn, context.accessibleTeamIds) as T;
      } else if (context.teamId) {
        if (allowNullTeam) {
          return query.or(
            `${teamIdColumn}.eq.${context.teamId},${teamIdColumn}.is.null`
          ) as T;
        }
        return query.eq(teamIdColumn, context.teamId) as T;
      }
      break;
  }

  return query;
}

/**
 * Obtiene los IDs de equipos accesibles para usar en queries manuales
 *
 * @param context - Contexto jerárquico
 * @returns Array de IDs o null si no hay restricción
 */
export function getAccessibleTeamIds(
  context: HierarchyContext | null
): string[] | null {
  if (!context || !context.hierarchyEnabled || context.hasUnlimitedAccess) {
    return null; // Sin restricción
  }

  if (context.accessibleTeamIds.length > 0) {
    return context.accessibleTeamIds;
  }

  if (context.teamId) {
    return [context.teamId];
  }

  return []; // Sin acceso
}

// ===========================================
// HELPERS DE ROL
// ===========================================

/**
 * Jerarquía de roles (mayor = más permisos)
 */
export const ROLE_HIERARCHY: Record<HierarchyRole, number> = {
  owner: 100,
  admin: 80,
  regional_manager: 60,
  zone_manager: 40,
  team_leader: 20,
  member: 10
};

/**
 * Verifica si un rol es igual o superior a otro
 */
export function isRoleEqualOrHigher(
  userRole: HierarchyRole,
  requiredRole: HierarchyRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Verifica si un rol puede asignar usuarios
 */
export function canAssignUsers(context: HierarchyContext | null): boolean {
  if (!context) return false;

  const assignmentRoles: HierarchyRole[] = [
    'owner',
    'admin',
    'regional_manager',
    'zone_manager',
    'team_leader'
  ];

  return assignmentRoles.includes(context.userRole);
}

/**
 * Verifica si un rol puede crear/editar estructura jerárquica
 */
export function canManageHierarchy(context: HierarchyContext | null): boolean {
  if (!context) return false;
  return context.userRole === 'owner';
}

/**
 * Verifica si un rol puede activar/desactivar la jerarquía
 */
export function canToggleHierarchy(context: HierarchyContext | null): boolean {
  if (!context) return false;
  return context.userRole === 'owner';
}

// ===========================================
// LABELS Y UI
// ===========================================

export const ROLE_LABELS: Record<HierarchyRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  regional_manager: 'Gerente Regional',
  zone_manager: 'Gerente de Zona',
  team_leader: 'Líder de Equipo',
  member: 'Miembro'
};

export const SCOPE_LABELS: Record<HierarchyScope, string> = {
  organization: 'Toda la organización',
  region: 'Región asignada',
  zone: 'Zona asignada',
  team: 'Equipo asignado'
};

export const ROLE_DESCRIPTIONS: Record<HierarchyRole, string> = {
  owner: 'Control total sobre la organización sin restricciones',
  admin: 'Administrador con acceso según asignación',
  regional_manager: 'Gestiona todos los equipos de una región',
  zone_manager: 'Gestiona todos los equipos de una zona',
  team_leader: 'Lidera y gestiona un equipo específico',
  member: 'Miembro con acceso a su equipo'
};
