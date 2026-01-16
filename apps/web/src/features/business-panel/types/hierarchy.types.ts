/**
 * Tipos para el Sistema de Permisos Jerárquicos
 * Región > Zona > Equipo
 */

// ===========================================
// TIPOS BASE
// ===========================================

/**
 * Roles disponibles dentro de una organización con jerarquía
 */
export type HierarchyRole =
  | 'owner'            // Propietario - control total sin restricciones
  | 'admin'            // Administrador genérico - ámbito según asignación
  | 'regional_manager' // Gerente Regional - acceso a toda una región
  | 'zone_manager'     // Gerente de Zona - acceso a toda una zona
  | 'team_leader'      // Líder de Equipo - acceso solo a su equipo
  | 'member';          // Miembro básico - acceso solo a su equipo

/**
 * Niveles de alcance jerárquico
 */
export type HierarchyScope =
  | 'organization' // Acceso a toda la organización
  | 'region'       // Acceso solo a una región
  | 'zone'         // Acceso solo a una zona
  | 'team';        // Acceso solo a un equipo

// ===========================================
// TIPOS DE UBICACIÓN Y CONTACTO
// ===========================================

/**
 * Información de ubicación geográfica
 */
export interface LocationInfo {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Información de contacto
 */
export interface ContactInfo {
  phone?: string | null;
  email?: string | null;
}

/**
 * Información básica de un usuario (gerente/líder)
 */
export interface ManagerInfo {
  id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  profile_picture_url?: string | null;
}

// ===========================================
// ENTIDADES DE JERARQUÍA
// ===========================================

/**
 * Región - Nivel más alto de la jerarquía
 */
export interface Region extends LocationInfo, ContactInfo {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  code?: string | null;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Gerente Regional
  manager_id?: string | null;
  manager?: ManagerInfo | null;
  // Campos calculados (opcionales, vienen de queries con agregaciones)
  zones_count?: number;
  teams_count?: number;
  users_count?: number;
}

/**
 * Zona - Nivel intermedio, pertenece a una Región
 */
export interface Zone extends LocationInfo, ContactInfo {
  id: string;
  organization_id: string;
  region_id: string;
  name: string;
  description?: string | null;
  code?: string | null;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Gerente de Zona
  manager_id?: string | null;
  manager?: ManagerInfo | null;
  // Relaciones
  region?: Region;
  // Campos calculados
  teams_count?: number;
  users_count?: number;
}

/**
 * Equipo - Nivel más bajo, pertenece a una Zona
 */
export interface Team extends LocationInfo, ContactInfo {
  id: string;
  organization_id: string;
  zone_id: string;
  name: string;
  description?: string | null;
  code?: string | null;
  max_members?: number | null;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Líder de Equipo
  leader_id?: string | null;
  leader?: ManagerInfo | null;
  // Objetivos/Metas
  target_goal?: string | null;
  monthly_target?: number | null;
  // Relaciones
  zone?: Zone;
  // Campos calculados
  members_count?: number;
  capacity_percentage?: number | null;
}

/**
 * Jerarquía completa anidada
 */
export interface HierarchyTree {
  regions: (Region & {
    zones: (Zone & {
      teams: Team[];
    })[];
  })[];
}

// ===========================================
// DETALLES COMPLETOS (desde funciones SQL)
// ===========================================

/**
 * Detalles completos de una región
 */
export interface RegionDetails {
  region: Region;
  manager: ManagerInfo | null;
  stats: {
    zones_count: number;
    teams_count: number;
    users_count: number;
  };
}

/**
 * Detalles completos de una zona
 */
export interface ZoneDetails {
  zone: Zone;
  region: {
    id: string;
    name: string;
    code?: string | null;
  };
  manager: ManagerInfo | null;
  stats: {
    teams_count: number;
    users_count: number;
  };
}

/**
 * Detalles completos de un equipo
 */
export interface TeamDetails {
  team: Team;
  zone: {
    id: string;
    name: string;
    code?: string | null;
  };
  region: {
    id: string;
    name: string;
    code?: string | null;
  };
  leader: ManagerInfo | null;
  stats: {
    members_count: number;
    capacity_percentage: number | null;
  };
}

// ===========================================
// CONTEXTO DEL USUARIO
// ===========================================

/**
 * Contexto jerárquico completo de un usuario
 * Se usa para determinar qué datos puede ver/modificar
 */
export interface HierarchyContext {
  organizationId: string;
  organizationName?: string;
  hierarchyEnabled: boolean;
  userRole: HierarchyRole;
  scope: HierarchyScope;
  // Asignaciones directas
  regionId: string | null;
  zoneId: string | null;
  teamId: string | null;
  // Nombres para mostrar en UI
  regionName?: string;
  zoneName?: string;
  teamName?: string;
  // IDs de equipos a los que tiene acceso (calculado)
  accessibleTeamIds: string[];
  // Flag: si accessibleTeamIds está vacío pero tiene acceso total
  hasUnlimitedAccess?: boolean;
}

/**
 * Ámbito de un recurso para verificación de acceso
 */
export interface ResourceScope {
  organizationId: string;
  regionId?: string | null;
  zoneId?: string | null;
  teamId?: string | null;
}

// ===========================================
// ESTADÍSTICAS
// ===========================================

/**
 * Estadísticas de la estructura jerárquica
 */
export interface HierarchyStats {
  regions_count: number;
  zones_count: number;
  teams_count: number;
  users_assigned: number;
  users_unassigned: number;
  hierarchy_enabled: boolean;
}

/**
 * Estadísticas detalladas de rendimiento (Analytics)
 */
export interface HierarchyAnalytics {
  // Estadísticas básicas
  users_count: number;
  active_learners: number;
  inactive_users?: number;
  
  // Métricas de aprendizaje
  total_hours: number;
  avg_hours_per_member?: number;
  avg_completion: number;
  courses_completed?: number;
  courses_in_progress?: number;
  courses_not_started?: number;
  lessons_completed?: number;
  avg_session_duration?: number;
  
  // Métricas de asignaciones
  courses_assigned?: number;
  assignment_completion_rate?: number;
  assignments_overdue?: number;
  assignments_due_soon?: number;
  
  // Métricas de engagement
  participation_rate?: number;
  avg_active_days?: number;
  avg_streak?: number;
  longest_streak?: number;
  sessions_completed?: number;
  sessions_missed?: number;
  last_activity?: string;
  
  // Top Performer
  top_performer: {
    id: string;
    name: string;
    value: number;
    label: string;
    avatar?: string;
    courses_completed?: number;
    completion_rate?: number;
  } | null;
  
  // Para Zona y Región: métricas agregadas
  total_teams?: number;
  active_teams?: number;
  inactive_teams?: number;
  avg_hours_per_team?: number;
  
  // Para Región: métricas adicionales
  total_zones?: number;
  active_zones?: number;
  inactive_zones?: number;
  avg_hours_per_zone?: number;
  
  // Rankings (para Zona y Región)
  team_ranking?: Array<{
    id: string;
    name: string;
    hours: number;
    completion_rate: number;
    participation_rate: number;
  }>;
  
  zone_ranking?: Array<{
    id: string;
    name: string;
    hours: number;
    completion_rate: number;
    participation_rate: number;
  }>;
}

/**
 * Curso asignado o estudiado dentro de una entidad de jerarquía
 */
export interface HierarchyCourse {
  id: string;
  title: string;
  thumbnail_url: string | null;
  category: string;
  enrolled_count: number;
  avg_progress: number;
  status: string;
}


// ===========================================
// CONFIGURACIÓN
// ===========================================

/**
 * Configuración de jerarquía de una organización
 */
export interface HierarchyConfig {
  hierarchy_enabled: boolean;
  // IDs de la estructura default (si existe)
  default_region_id?: string;
  default_zone_id?: string;
  default_team_id?: string;
  // Opciones
  auto_assign_new_users?: boolean;
  require_team_assignment?: boolean;
  // Labels personalizados para la UI
  labels?: {
    region?: string; // Ej: "Sucursal", "País", "División"
    zone?: string;   // Ej: "Área", "Distrito", "Departamento"
    team?: string;   // Ej: "Grupo", "Squad", "Unidad"
  };
}

// ===========================================
// REQUESTS - CREAR/ACTUALIZAR
// ===========================================

/**
 * Request para crear una región
 */
export interface CreateRegionRequest {
  name: string;
  description?: string;
  code?: string;
  // Ubicación
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  // Contacto
  phone?: string;
  email?: string;
  // Gerente
  manager_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Request para actualizar una región
 */
export interface UpdateRegionRequest {
  name?: string;
  description?: string;
  code?: string;
  is_active?: boolean;
  // Ubicación
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // Contacto
  phone?: string | null;
  email?: string | null;
  // Gerente
  manager_id?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Request para crear una zona
 */
export interface CreateZoneRequest {
  region_id: string;
  name: string;
  description?: string;
  code?: string;
  // Ubicación
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  // Contacto
  phone?: string;
  email?: string;
  // Gerente
  manager_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Request para actualizar una zona
 */
export interface UpdateZoneRequest {
  name?: string;
  description?: string;
  code?: string;
  is_active?: boolean;
  // Ubicación
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // Contacto
  phone?: string | null;
  email?: string | null;
  // Gerente
  manager_id?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Request para crear un equipo
 */
export interface CreateTeamRequest {
  zone_id: string;
  name: string;
  description?: string;
  code?: string;
  max_members?: number;
  // Ubicación
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  // Contacto
  phone?: string;
  email?: string;
  // Líder
  leader_id?: string;
  // Objetivos
  target_goal?: string;
  monthly_target?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Request para actualizar un equipo
 */
export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  code?: string;
  max_members?: number | null;
  is_active?: boolean;
  // Ubicación
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // Contacto
  phone?: string | null;
  email?: string | null;
  // Líder
  leader_id?: string | null;
  // Objetivos
  target_goal?: string | null;
  monthly_target?: number | null;
  metadata?: Record<string, unknown>;
}

/**
 * Request para asignar un usuario a un equipo
 */
export interface AssignUserToTeamRequest {
  user_id: string;
  team_id: string;
  role?: 'team_leader' | 'member';
  update_scope?: boolean; // Si true, también actualiza hierarchy_scope
}

/**
 * Request para asignar un usuario como gerente de zona
 */
export interface AssignZoneManagerRequest {
  user_id: string;
  zone_id: string;
}

/**
 * Request para asignar un usuario como gerente regional
 */
export interface AssignRegionalManagerRequest {
  user_id: string;
  region_id: string;
}

// ===========================================
// RESPONSES
// ===========================================

/**
 * Response genérico para operaciones de jerarquía
 */
export interface HierarchyResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Response de listado con paginación
 */
export interface HierarchyListResponse<T> {
  success: boolean;
  items: T[];
  total: number;
  page?: number;
  limit?: number;
  error?: string;
}

/**
 * Response del seed de estructura default
 */
export interface SeedHierarchyResponse {
  success: boolean;
  regionId?: string;
  zoneId?: string;
  teamId?: string;
  usersUpdated?: number;
  error?: string;
}

// ===========================================
// FILTROS Y OPCIONES
// ===========================================

/**
 * Opciones para listar regiones
 */
export interface ListRegionsOptions {
  includeInactive?: boolean;
  withCounts?: boolean;
  withManager?: boolean;
}

/**
 * Opciones para listar zonas
 */
export interface ListZonesOptions {
  regionId?: string;
  includeInactive?: boolean;
  withCounts?: boolean;
  withManager?: boolean;
}

/**
 * Opciones para listar equipos
 */
export interface ListTeamsOptions {
  zoneId?: string;
  regionId?: string;
  includeInactive?: boolean;
  withCounts?: boolean;
  withLeader?: boolean;
}

/**
 * Opciones para listar usuarios sin asignar
 */
export interface ListUnassignedUsersOptions {
  excludeOwners?: boolean;
  status?: 'active' | 'all';
}

// ===========================================
// USUARIO CON JERARQUÍA
// ===========================================

/**
 * Información de usuario con datos de jerarquía
 */
export interface UserWithHierarchy {
  id: string;
  user_id: string;
  organization_id: string;
  role: HierarchyRole;
  status: 'active' | 'invited' | 'suspended' | 'removed';
  job_title?: string | null;
  // Campos de jerarquía
  team_id: string | null;
  zone_id: string | null;
  region_id: string | null;
  hierarchy_scope: HierarchyScope | null;
  // Datos resueltos (de vista v_user_hierarchy)
  team_name?: string;
  zone_name?: string;
  region_name?: string;
  effective_zone_id?: string;
  effective_region_id?: string;
  // Datos del usuario
  user?: {
    id: string;
    username: string;
    email: string;
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    profile_picture_url?: string | null;
  };
}

// ===========================================
// TIPOS DE EVENTOS/ACCIONES
// ===========================================

/**
 * Tipos de acciones sobre la jerarquía (para logs/auditoría)
 */
export type HierarchyAction =
  | 'hierarchy_enabled'
  | 'hierarchy_disabled'
  | 'region_created'
  | 'region_updated'
  | 'region_deleted'
  | 'zone_created'
  | 'zone_updated'
  | 'zone_deleted'
  | 'team_created'
  | 'team_updated'
  | 'team_deleted'
  | 'user_assigned_to_team'
  | 'user_removed_from_team'
  | 'user_role_changed'
  | 'manager_assigned'
  | 'leader_assigned'
  | 'default_structure_created';

// ===========================================
// HELPERS DE TIPO
// ===========================================

/**
 * Verifica si un rol tiene acceso a nivel de organización
 */
export function hasOrganizationAccess(role: HierarchyRole): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Verifica si un rol es de tipo manager (regional o zona)
 */
export function isManagerRole(role: HierarchyRole): boolean {
  return role === 'regional_manager' || role === 'zone_manager';
}

/**
 * Verifica si un rol puede asignar usuarios a equipos
 */
export function canAssignUsers(role: HierarchyRole, scope: HierarchyScope): boolean {
  if (role === 'owner') return true;
  if (role === 'admin' && scope === 'organization') return true;
  if (role === 'regional_manager') return true;
  if (role === 'zone_manager') return true;
  if (role === 'team_leader') return true;
  return false;
}

/**
 * Obtiene el scope por defecto para un rol
 */
export function getDefaultScope(role: HierarchyRole): HierarchyScope {
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

/**
 * Nombres amigables para los roles
 */
export const ROLE_LABELS: Record<HierarchyRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  regional_manager: 'Gerente Regional',
  zone_manager: 'Gerente de Zona',
  team_leader: 'Líder de Equipo',
  member: 'Miembro'
};

/**
 * Nombres amigables para los scopes
 */
export const SCOPE_LABELS: Record<HierarchyScope, string> = {
  organization: 'Toda la organización',
  region: 'Región asignada',
  zone: 'Zona asignada',
  team: 'Equipo asignado'
};

/**
 * Formatea una dirección completa
 */
export function formatFullAddress(location: LocationInfo): string {
  const parts = [
    location.address,
    location.city,
    location.state,
    location.postal_code,
    location.country
  ].filter(Boolean);
  return parts.join(', ') || 'Sin dirección';
}

/**
 * Obtiene el nombre completo del gerente/líder
 */
export function getManagerDisplayName(manager: ManagerInfo | null | undefined): string {
  if (!manager) return 'Sin asignar';
  if (manager.display_name) return manager.display_name;
  if (manager.first_name || manager.last_name) {
    return [manager.first_name, manager.last_name].filter(Boolean).join(' ');
  }
  return manager.email;
}

// ===========================================
// CHATS JERÁRQUICOS
// ===========================================

/**
 * Tipo de chat jerárquico
 */
export type HierarchyChatType = 'horizontal' | 'vertical';

/**
 * Tipo de mensaje en el chat
 */
export type ChatMessageType = 'text' | 'system' | 'file';

/**
 * Chat jerárquico (horizontal o vertical)
 */
export interface HierarchyChat {
  id: string;
  organization_id: string;
  chat_type: HierarchyChatType;
  entity_type: 'region' | 'zone' | 'team';
  entity_id: string;
  level_role?: string | null;
  name?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_message_at?: string | null;
  // Campos calculados
  participants_count?: number;
  unread_count?: number;
}

/**
 * Mensaje en un chat jerárquico
 */
export interface HierarchyChatMessage {
  id: string;
  chat_id: string;
  organization_id: string;
  sender_id: string;
  content: string;
  message_type: ChatMessageType;
  metadata?: Record<string, unknown>;
  is_edited: boolean;
  is_deleted: boolean;
  edited_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  // Datos del remitente (desde join)
  sender?: {
    id: string;
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    profile_picture_url?: string | null;
  };
}

/**
 * Participante en un chat jerárquico
 */
export interface HierarchyChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  organization_id: string;
  is_active: boolean;
  joined_at: string;
  left_at?: string | null;
  last_read_at?: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
  // Datos del usuario (desde join)
  user?: {
    id: string;
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    profile_picture_url?: string | null;
    role?: HierarchyRole;
  };
}

/**
 * Request para crear un chat jerárquico
 */
export interface CreateHierarchyChatRequest {
  entity_type: 'region' | 'zone' | 'team';
  entity_id: string;
  chat_type: HierarchyChatType;
  name?: string;
  description?: string;
}

/**
 * Request para enviar un mensaje
 */
export interface SendChatMessageRequest {
  chat_id: string;
  content: string;
  message_type?: ChatMessageType;
  metadata?: Record<string, unknown>;
}

/**
 * Request para actualizar un mensaje
 */
export interface UpdateChatMessageRequest {
  message_id: string;
  content: string;
}

/**
 * Request para marcar mensajes como leídos
 */
export interface MarkMessagesReadRequest {
  chat_id: string;
  last_read_at?: string; // Si no se proporciona, usa la fecha actual
}

/**
 * Response de lista de chats
 */
export interface HierarchyChatsResponse {
  success: boolean;
  chats: HierarchyChat[];
  error?: string;
}

/**
 * Response de un chat con mensajes
 */
export interface HierarchyChatWithMessagesResponse {
  success: boolean;
  chat: HierarchyChat;
  messages: HierarchyChatMessage[];
  participants: HierarchyChatParticipant[];
  has_more?: boolean;
  error?: string;
}

/**
 * Response de un mensaje
 */
export interface ChatMessageResponse {
  success: boolean;
  message?: HierarchyChatMessage;
  error?: string;
}
