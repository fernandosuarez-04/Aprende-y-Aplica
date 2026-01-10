import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';

/**
 * Middleware de Autorización Jerárquica
 *
 * Implementa el sistema de permisos basado en Región > Zona > Equipo
 * para controlar el acceso a recursos dentro de una organización.
 */

// ===========================================
// TIPOS
// ===========================================

/**
 * Roles disponibles con jerarquía
 */
export type HierarchyRole =
  | 'owner'
  | 'admin'
  | 'regional_manager'
  | 'zone_manager'
  | 'team_leader'
  | 'member';

/**
 * Niveles de alcance
 */
export type HierarchyScope = 'organization' | 'region' | 'zone' | 'team';

/**
 * Contexto jerárquico del usuario autenticado
 */
export interface HierarchyContext {
  organizationId: string;
  organizationName?: string;
  hierarchyEnabled: boolean;
  userRole: HierarchyRole;
  scope: HierarchyScope;
  regionId?: string;
  zoneId?: string;
  teamId?: string;
  regionName?: string;
  zoneName?: string;
  teamName?: string;
  // IDs de equipos accesibles (null = sin restricción)
  accessibleTeamIds: string[] | null;
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
export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: string;
  code?: string;
}

// ===========================================
// EXTENSIÓN DE REQUEST
// ===========================================

declare global {
  namespace Express {
    interface Request {
      hierarchyContext?: HierarchyContext;
    }
  }
}

// ===========================================
// FUNCIONES DE VERIFICACIÓN
// ===========================================

/**
 * Verifica si un usuario tiene acceso a un recurso específico
 * basándose en su contexto jerárquico
 *
 * @param userContext - Contexto jerárquico del usuario
 * @param resourceScope - Ámbito del recurso a acceder
 * @returns Resultado de la verificación
 */
export function checkHierarchicalAccess(
  userContext: HierarchyContext | undefined,
  resourceScope: ResourceScope
): AccessCheckResult {
  // Sin contexto jerárquico = acceso normal (modo plano)
  if (!userContext) {
    return { hasAccess: true };
  }

  // Verificar que es la misma organización
  if (userContext.organizationId !== resourceScope.organizationId) {
    return {
      hasAccess: false,
      reason: 'El recurso pertenece a otra organización',
      code: 'WRONG_ORGANIZATION'
    };
  }

  // Si la jerarquía NO está activada, acceso total dentro de la org
  if (!userContext.hierarchyEnabled) {
    return { hasAccess: true };
  }

  // Owner SIEMPRE tiene acceso total
  if (userContext.userRole === 'owner') {
    return { hasAccess: true };
  }

  // Verificar según el scope del usuario
  switch (userContext.scope) {
    case 'organization':
      // Admin con scope organizacional = acceso total
      return { hasAccess: true };

    case 'region':
      // Regional manager: acceso a su región y todo lo que contiene
      if (!resourceScope.regionId) {
        // Recurso sin región asignada = accesible
        return { hasAccess: true };
      }
      if (resourceScope.regionId === userContext.regionId) {
        return { hasAccess: true };
      }
      return {
        hasAccess: false,
        reason: 'El recurso está fuera de tu región asignada',
        code: 'OUTSIDE_REGION'
      };

    case 'zone':
      // Zone manager: acceso a su zona
      if (!resourceScope.zoneId) {
        return { hasAccess: true };
      }
      if (resourceScope.zoneId === userContext.zoneId) {
        return { hasAccess: true };
      }
      return {
        hasAccess: false,
        reason: 'El recurso está fuera de tu zona asignada',
        code: 'OUTSIDE_ZONE'
      };

    case 'team':
      // Team leader o member: solo su equipo
      if (!resourceScope.teamId) {
        return { hasAccess: true };
      }

      // Verificar acceso directo al equipo
      if (resourceScope.teamId === userContext.teamId) {
        return { hasAccess: true };
      }

      // Verificar en lista de equipos accesibles
      if (
        userContext.accessibleTeamIds !== null &&
        userContext.accessibleTeamIds.includes(resourceScope.teamId)
      ) {
        return { hasAccess: true };
      }

      return {
        hasAccess: false,
        reason: 'El recurso está fuera de tu equipo asignado',
        code: 'OUTSIDE_TEAM'
      };

    default:
      return {
        hasAccess: false,
        reason: 'Scope de usuario desconocido',
        code: 'UNKNOWN_SCOPE'
      };
  }
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
// MIDDLEWARES
// ===========================================

/**
 * Middleware que carga el contexto jerárquico del usuario
 * Debe ejecutarse DESPUÉS de authenticate
 *
 * El contexto se obtiene desde la base de datos usando el ID de organización
 * del header 'x-organization-id' o del path del request
 */
export const loadHierarchyContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar que el usuario está autenticado
    if (!req.user) {
      req.hierarchyContext = undefined;
      return next();
    }

    // Obtener ID de organización desde headers o path
    const organizationId =
      (req.headers['x-organization-id'] as string) ||
      req.params.organizationId ||
      req.query.organizationId as string;

    if (!organizationId) {
      // Sin organización, no hay contexto jerárquico
      req.hierarchyContext = undefined;
      return next();
    }

    // TODO: Implementar consulta real a Supabase
    // Por ahora usamos un contexto placeholder
    // En producción, esto debe consultar:
    // 1. organizations.hierarchy_enabled
    // 2. organization_users con el user_id y organization_id
    // 3. Calcular accessibleTeamIds según el scope

    // Placeholder - en producción reemplazar con consulta real
    const hierarchyContext: HierarchyContext = {
      organizationId,
      hierarchyEnabled: false, // Por defecto desactivado
      userRole: 'member',
      scope: 'organization',
      accessibleTeamIds: null
    };

    req.hierarchyContext = hierarchyContext;
    next();
  } catch (error) {
    console.error('Error loading hierarchy context:', error);
    // En caso de error, continuamos sin contexto
    req.hierarchyContext = undefined;
    next();
  }
};

/**
 * Factory de middleware que verifica acceso jerárquico a un recurso
 *
 * @param getResourceScope - Función que extrae el scope del recurso de la request
 * @returns Middleware de Express
 *
 * @example
 * // Uso en ruta
 * router.get('/recursos/:id',
 *   authenticate,
 *   loadHierarchyContext,
 *   requireHierarchicalAccess(async (req) => ({
 *     organizationId: req.params.organizationId,
 *     teamId: await getResourceTeamId(req.params.id)
 *   })),
 *   handler
 * );
 */
export const requireHierarchicalAccess = (
  getResourceScope: (req: Request) => ResourceScope | Promise<ResourceScope>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resourceScope = await getResourceScope(req);
      const { hasAccess, reason, code } = checkHierarchicalAccess(
        req.hierarchyContext,
        resourceScope
      );

      if (!hasAccess) {
        return next(
          createError(
            reason || 'No tienes acceso a este recurso',
            403,
            code || 'HIERARCHICAL_ACCESS_DENIED'
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware que requiere que el usuario tenga un rol específico o superior
 * en el contexto jerárquico
 *
 * @param allowedRoles - Roles permitidos para acceder
 */
export const requireHierarchyRole = (...allowedRoles: HierarchyRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.hierarchyContext) {
      return next(
        createError(
          'Contexto de organización requerido',
          400,
          'MISSING_ORGANIZATION_CONTEXT'
        )
      );
    }

    if (!allowedRoles.includes(req.hierarchyContext.userRole)) {
      return next(
        createError(
          'No tienes el rol necesario para esta acción',
          403,
          'INSUFFICIENT_ROLE'
        )
      );
    }

    next();
  };
};

/**
 * Middleware que requiere que la jerarquía esté activada en la organización
 */
export const requireHierarchyEnabled = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.hierarchyContext) {
    return next(
      createError(
        'Contexto de organización requerido',
        400,
        'MISSING_ORGANIZATION_CONTEXT'
      )
    );
  }

  if (!req.hierarchyContext.hierarchyEnabled) {
    return next(
      createError(
        'La jerarquía no está activada para esta organización',
        400,
        'HIERARCHY_NOT_ENABLED'
      )
    );
  }

  next();
};

// ===========================================
// HELPERS PARA QUERIES
// ===========================================

/**
 * Construye condiciones WHERE para filtrar por jerarquía
 *
 * @param context - Contexto jerárquico del usuario
 * @param columnPrefix - Prefijo de columnas (ej: 't.' para alias de tabla)
 * @returns Objeto con la condición WHERE y parámetros
 */
export function buildHierarchyWhereClause(
  context: HierarchyContext | undefined,
  columnPrefix: string = ''
): { clause: string; params: Record<string, string | string[]> } {
  const prefix = columnPrefix;

  // Sin contexto o jerarquía desactivada = sin filtro
  if (!context || !context.hierarchyEnabled) {
    return { clause: 'TRUE', params: {} };
  }

  // Owner = sin filtro
  if (context.userRole === 'owner') {
    return { clause: 'TRUE', params: {} };
  }

  // Scope organization = sin filtro adicional
  if (context.scope === 'organization') {
    return { clause: 'TRUE', params: {} };
  }

  // Construir filtro según scope
  switch (context.scope) {
    case 'region':
      if (context.regionId) {
        return {
          clause: `(${prefix}region_id = :regionId OR ${prefix}region_id IS NULL)`,
          params: { regionId: context.regionId }
        };
      }
      break;

    case 'zone':
      if (context.zoneId) {
        return {
          clause: `(${prefix}zone_id = :zoneId OR ${prefix}zone_id IS NULL)`,
          params: { zoneId: context.zoneId }
        };
      }
      break;

    case 'team':
      if (context.accessibleTeamIds && context.accessibleTeamIds.length > 0) {
        return {
          clause: `(${prefix}team_id = ANY(:teamIds) OR ${prefix}team_id IS NULL)`,
          params: { teamIds: context.accessibleTeamIds }
        };
      } else if (context.teamId) {
        return {
          clause: `(${prefix}team_id = :teamId OR ${prefix}team_id IS NULL)`,
          params: { teamId: context.teamId }
        };
      }
      // Sin equipo asignado = sin acceso a recursos con equipo
      return {
        clause: `${prefix}team_id IS NULL`,
        params: {}
      };

    default:
      break;
  }

  return { clause: 'TRUE', params: {} };
}

/**
 * Obtiene los IDs de equipos accesibles como array para usar en queries
 *
 * @param context - Contexto jerárquico
 * @returns Array de IDs o null si no hay restricción
 */
export function getAccessibleTeamIds(
  context: HierarchyContext | undefined
): string[] | null {
  if (!context || !context.hierarchyEnabled) {
    return null; // Sin restricción
  }

  if (context.userRole === 'owner' || context.scope === 'organization') {
    return null; // Sin restricción
  }

  // Si ya tenemos la lista calculada
  if (context.accessibleTeamIds !== null) {
    return context.accessibleTeamIds;
  }

  // Si tiene un equipo asignado
  if (context.teamId) {
    return [context.teamId];
  }

  // Sin acceso a equipos
  return [];
}

/**
 * Verifica si un usuario puede gestionar otro usuario
 * basándose en la jerarquía
 *
 * @param managerContext - Contexto del usuario que intenta gestionar
 * @param targetScope - Ámbito del usuario objetivo
 * @returns true si puede gestionar
 */
export function canManageUser(
  managerContext: HierarchyContext | undefined,
  targetScope: ResourceScope
): boolean {
  if (!managerContext) {
    return false;
  }

  // Owner puede gestionar a todos
  if (managerContext.userRole === 'owner') {
    return true;
  }

  // Sin jerarquía activada, depende del rol
  if (!managerContext.hierarchyEnabled) {
    return managerContext.userRole === 'admin';
  }

  // Con jerarquía, verificar acceso
  const { hasAccess } = checkHierarchicalAccess(managerContext, targetScope);
  if (!hasAccess) {
    return false;
  }

  // Solo ciertos roles pueden gestionar usuarios
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
// CONSTANTES
// ===========================================

/**
 * Jerarquía de roles (mayor valor = más permisos)
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
