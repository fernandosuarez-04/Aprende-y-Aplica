# Sistema de Jerarquía Organizacional

## Descripción General

Este documento describe el sistema de permisos jerárquicos **Región > Zona > Equipo** implementado para organizaciones B2B en la plataforma Aprende y Aplica.

El sistema es **opcional y retrocompatible** - las organizaciones que no activen la jerarquía continúan funcionando normalmente.

---

## Arquitectura

### Estructura de Niveles

```
Organización (organization)
└── Región (organization_regions)
    └── Zona (organization_zones)
        └── Equipo (organization_teams)
            └── Usuarios (organization_users)
```

### Roles Jerárquicos

| Rol                | Scope        | Descripción                         |
| ------------------ | ------------ | ----------------------------------- |
| `owner`            | organization | Propietario, acceso total           |
| `admin`            | organization | Administrador, acceso total         |
| `regional_manager` | region       | Gerente Regional, ve solo su región |
| `zone_manager`     | zone         | Gerente de Zona, ve solo su zona    |
| `team_leader`      | team         | Líder de Equipo, ve solo su equipo  |
| `member`           | team         | Miembro básico, ve solo su equipo   |

---

## Base de Datos

### Tablas Principales

#### `organization_regions`

```sql
CREATE TABLE organization_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  code VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  -- Ubicación
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'México',
  postal_code VARCHAR(20),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  -- Contacto
  phone VARCHAR(30),
  email VARCHAR(255),
  -- Gerente
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `organization_zones`

```sql
CREATE TABLE organization_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  region_id UUID REFERENCES organization_regions(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  code VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  -- Ubicación
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'México',
  postal_code VARCHAR(20),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  -- Contacto
  phone VARCHAR(30),
  email VARCHAR(255),
  -- Gerente
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `organization_teams`

```sql
CREATE TABLE organization_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES organization_zones(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  code VARCHAR(50),
  max_members INTEGER,
  is_active BOOLEAN DEFAULT true,
  -- Ubicación
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'México',
  postal_code VARCHAR(20),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  -- Contacto
  phone VARCHAR(30),
  email VARCHAR(255),
  -- Líder
  leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Metas
  target_goal TEXT,
  monthly_target NUMERIC(12, 2),
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Modificaciones a Tablas Existentes

#### `organizations`

```sql
ALTER TABLE organizations
ADD COLUMN hierarchy_enabled BOOLEAN DEFAULT false,
ADD COLUMN hierarchy_config JSONB DEFAULT '{}';
```

#### `organization_users`

```sql
ALTER TABLE organization_users
ADD COLUMN region_id UUID REFERENCES organization_regions(id) ON DELETE SET NULL,
ADD COLUMN zone_id UUID REFERENCES organization_zones(id) ON DELETE SET NULL,
ADD COLUMN team_id UUID REFERENCES organization_teams(id) ON DELETE SET NULL,
ADD COLUMN hierarchy_scope VARCHAR(20) DEFAULT 'organization';
```

### Migraciones SQL

Las migraciones se encuentran en:

1. **`supabase/migrations/20260109_hierarchy_system.sql`** - Estructura base
2. **`supabase/migrations/20260109_hierarchy_system_v2.sql`** - Campos adicionales (ubicación, contacto, gerentes)

---

## API Endpoints

### Configuración

| Método | Ruta                              | Descripción                  |
| ------ | --------------------------------- | ---------------------------- |
| GET    | `/api/business/hierarchy/config`  | Obtener configuración        |
| PUT    | `/api/business/hierarchy/config`  | Actualizar configuración     |
| POST   | `/api/business/hierarchy/enable`  | Activar jerarquía            |
| POST   | `/api/business/hierarchy/disable` | Desactivar jerarquía         |
| POST   | `/api/business/hierarchy/seed`    | Crear estructura por defecto |
| GET    | `/api/business/hierarchy/stats`   | Obtener estadísticas         |

### Regiones

| Método | Ruta                                         | Descripción       |
| ------ | -------------------------------------------- | ----------------- |
| GET    | `/api/business/hierarchy/regions`            | Listar regiones   |
| POST   | `/api/business/hierarchy/regions`            | Crear región      |
| GET    | `/api/business/hierarchy/regions/[regionId]` | Obtener región    |
| PUT    | `/api/business/hierarchy/regions/[regionId]` | Actualizar región |
| DELETE | `/api/business/hierarchy/regions/[regionId]` | Eliminar región   |

**Parámetros GET (lista):**

- `includeInactive=true` - Incluir inactivas
- `withCounts=true` - Incluir conteos
- `withManager=true` - Incluir datos del gerente

### Zonas

| Método | Ruta                                     | Descripción     |
| ------ | ---------------------------------------- | --------------- |
| GET    | `/api/business/hierarchy/zones`          | Listar zonas    |
| POST   | `/api/business/hierarchy/zones`          | Crear zona      |
| GET    | `/api/business/hierarchy/zones/[zoneId]` | Obtener zona    |
| PUT    | `/api/business/hierarchy/zones/[zoneId]` | Actualizar zona |
| DELETE | `/api/business/hierarchy/zones/[zoneId]` | Eliminar zona   |

**Parámetros GET (lista):**

- `regionId=uuid` - Filtrar por región
- `includeInactive=true` - Incluir inactivas
- `withCounts=true` - Incluir conteos
- `withManager=true` - Incluir datos del gerente

### Equipos

| Método | Ruta                                     | Descripción       |
| ------ | ---------------------------------------- | ----------------- |
| GET    | `/api/business/hierarchy/teams`          | Listar equipos    |
| POST   | `/api/business/hierarchy/teams`          | Crear equipo      |
| GET    | `/api/business/hierarchy/teams/[teamId]` | Obtener equipo    |
| PUT    | `/api/business/hierarchy/teams/[teamId]` | Actualizar equipo |
| DELETE | `/api/business/hierarchy/teams/[teamId]` | Eliminar equipo   |

**Parámetros GET (lista):**

- `zoneId=uuid` - Filtrar por zona
- `includeInactive=true` - Incluir inactivos
- `withCounts=true` - Incluir conteos
- `withLeader=true` - Incluir datos del líder

### Usuarios

| Método | Ruta                                              | Descripción              |
| ------ | ------------------------------------------------- | ------------------------ |
| GET    | `/api/business/hierarchy/users/unassigned`        | Usuarios sin equipo      |
| POST   | `/api/business/hierarchy/users/assign`            | Asignar usuario a equipo |
| POST   | `/api/business/hierarchy/users/[userId]/unassign` | Desasignar usuario       |

---

## Archivos del Frontend

### Tipos TypeScript

**Ubicación:** `apps/web/src/features/business-panel/types/hierarchy.types.ts`

```typescript
// Interfaces principales
interface Region {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  code?: string;
  is_active: boolean;
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
  manager?: ManagerInfo;
  // Conteos
  zones_count?: number;
  teams_count?: number;
  users_count?: number;
  // ...
}

interface Zone {
  /* similar */
}
interface Team {
  /* similar + leader_id, target_goal, monthly_target */
}

// Helpers
interface LocationInfo {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
}

interface ContactInfo {
  phone?: string;
  email?: string;
}

interface ManagerInfo {
  id: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  profile_picture_url?: string;
}
```

### Service

**Ubicación:** `apps/web/src/features/business-panel/services/hierarchy.service.ts`

```typescript
class HierarchyService {
  // Configuración
  static async getConfig(): Promise<HierarchyConfig>;
  static async updateConfig(
    config: Partial<HierarchyConfig>
  ): Promise<ApiResponse<HierarchyConfig>>;
  static async enableHierarchy(): Promise<ApiResponse>;
  static async disableHierarchy(): Promise<ApiResponse>;
  static async seedDefaultStructure(): Promise<ApiResponse>;
  static async getStats(): Promise<HierarchyStats>;

  // CRUD Regiones
  static async getRegions(options?): Promise<Region[]>;
  static async getRegion(id: string): Promise<Region>;
  static async createRegion(
    data: CreateRegionRequest
  ): Promise<ApiResponse<Region>>;
  static async updateRegion(
    id: string,
    data: UpdateRegionRequest
  ): Promise<ApiResponse<Region>>;
  static async deleteRegion(id: string): Promise<ApiResponse>;

  // CRUD Zonas (similar)
  // CRUD Equipos (similar)
  // Usuarios (assign/unassign)
}
```

### Hook

**Ubicación:** `apps/web/src/features/business-panel/hooks/useHierarchy.ts`

```typescript
function useHierarchy() {
  return {
    // Estado
    config,
    stats,
    regions,
    zones,
    teams,
    unassignedUsers,
    isLoading,
    error,

    // Computed
    isHierarchyEnabled,
    hasStructure,
    hasUnassignedUsers,
    canEnableHierarchy,

    // Acciones
    loadConfig,
    updateConfig,
    enableHierarchy,
    disableHierarchy,
    loadRegions,
    createRegion,
    updateRegion,
    deleteRegion,
    loadZones,
    createZone,
    updateZone,
    deleteZone,
    loadTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    loadAll,
    loadFullHierarchy,
    clearError,
  };
}
```

### Componentes UI

**Ubicación:** `apps/web/src/features/business-panel/components/hierarchy/`

| Componente              | Descripción                                       |
| ----------------------- | ------------------------------------------------- |
| `HierarchySettings.tsx` | Panel de configuración (activar/desactivar, seed) |
| `HierarchyTree.tsx`     | Vista de árbol interactiva                        |
| `HierarchyForms.tsx`    | Formularios CRUD (RegionForm, ZoneForm, TeamForm) |
| `index.ts`              | Barrel exports                                    |

**Formularios disponibles:**

- `RegionForm` - Crear/editar región con secciones colapsables
- `ZoneForm` - Crear/editar zona
- `TeamForm` - Crear/editar equipo
- `DeleteConfirmModal` - Confirmación de eliminación
- `DetailsPanel` - Panel lateral de detalles

### Páginas

**Ubicación:** `apps/web/src/app/[orgSlug]/business-panel/hierarchy/`

| Ruta                           | Archivo                      | Descripción                                               |
| ------------------------------ | ---------------------------- | --------------------------------------------------------- |
| `/hierarchy`                   | `page.tsx`                   | Página principal con tabs (Configuración, Vista de Árbol) |
| `/hierarchy/region/[regionId]` | `region/[regionId]/page.tsx` | Detalle de Región con lista de zonas                      |
| `/hierarchy/zone/[zoneId]`     | `zone/[zoneId]/page.tsx`     | Detalle de Zona con lista de equipos                      |
| `/hierarchy/team/[teamId]`     | `team/[teamId]/page.tsx`     | Detalle de Equipo con lista de miembros                   |

**Características de las páginas de detalle:**

- Breadcrumb navegable (Jerarquía > Región > Zona > Equipo)
- Header con banner, icono, nombre, código y estado
- Tarjetas de estadísticas (conteos, progreso)
- Información de ubicación y contacto
- Gerente/Líder asignado con foto
- Lista de elementos hijos (zonas, equipos, miembros)
- Acciones de editar y eliminar

---

## Lógica de Control de Acceso

### Flujo de Verificación

```
1. Request del usuario
       ↓
2. requireBusiness() - Valida JWT y obtiene organizationId, organizationRole
       ↓
3. Verificar hierarchy_enabled en la organización
   └── Si false → Sin restricciones adicionales
       ↓
4. Verificar rol y scope del usuario
   ├── owner/admin → Acceso total
   ├── regional_manager → Solo su región
   ├── zone_manager → Solo su zona
   └── team_leader/member → Solo su equipo
       ↓
5. Aplicar filtros en queries SQL
```

### Middleware de Autorización (Pendiente)

**Ubicación propuesta:** `apps/api/src/middlewares/hierarchicalAuth.ts`

```typescript
// Funciones a implementar
function loadHierarchyContext(userId: string): HierarchyContext;
function checkHierarchicalAccess(
  user: HierarchyContext,
  resource: Resource
): boolean;
function buildHierarchyFilter(user: HierarchyContext): SqlFilter;
```

**Ubicación frontend:** `apps/web/src/lib/auth/hierarchicalAccess.ts`

---

## Tareas Pendientes

### Alta Prioridad

1. **Implementar API de Zonas completa**
   - `apps/web/src/app/api/business/hierarchy/zones/route.ts`
   - `apps/web/src/app/api/business/hierarchy/zones/[zoneId]/route.ts`

2. **Implementar API de Equipos completa**
   - `apps/web/src/app/api/business/hierarchy/teams/route.ts`
   - `apps/web/src/app/api/business/hierarchy/teams/[teamId]/route.ts`

3. **Implementar API de Usuarios**
   - `apps/web/src/app/api/business/hierarchy/users/unassigned/route.ts`
   - `apps/web/src/app/api/business/hierarchy/users/assign/route.ts`
   - `apps/web/src/app/api/business/hierarchy/users/[userId]/unassign/route.ts`

### Media Prioridad

4. **Middleware de autorización jerárquica**
   - Implementar `hierarchicalAccess.ts` en frontend
   - Aplicar filtros en queries existentes

5. **Selector de Gerentes/Líderes en formularios**
   - Agregar dropdown para seleccionar usuarios como manager/leader
   - Endpoint para listar usuarios elegibles

6. **Vistas de Gerentes**
   - Dashboard para Regional Manager
   - Dashboard para Zone Manager
   - Dashboard para Team Leader

### Baja Prioridad

7. **Mapa de ubicaciones**
   - Visualizar regiones/zonas/equipos en mapa
   - Usar latitude/longitude

8. **Reportes por jerarquía**
   - Métricas de progreso por región/zona/equipo
   - Exportación de datos

9. **Internacionalización**
   - Agregar traducciones en `es/en/pt`

---

## Archivos de Referencia

| Archivo                                                                  | Propósito                     |
| ------------------------------------------------------------------------ | ----------------------------- |
| `supabase/migrations/Database.sql`                                       | Schema completo de referencia |
| `apps/web/src/lib/auth/requireBusiness.ts`                               | Autenticación base            |
| `apps/web/src/core/stores/organizationStore.ts`                          | Estado de organización        |
| `apps/web/src/features/business-panel/services/businessUsers.service.ts` | Patrón de servicio            |

---

## Testing Manual

1. Crear organización nueva → `hierarchy_enabled = false`
2. Ir a Business Panel → Jerarquía → Vista de Árbol
3. Crear Región (botón azul)
4. Crear Zona (botón verde, seleccionar región)
5. Crear Equipo (botón ámbar, seleccionar zona)
6. Verificar que los detalles muestran ubicación, contacto, gerente/líder
7. Activar jerarquía desde Configuración
8. Verificar que usuarios solo ven datos de su ámbito
9. Desactivar jerarquía → acceso global restaurado

---

## Notas Técnicas

1. **Sin RLS de Supabase**: El sistema usa JWT custom, todo el filtrado es en código
2. **Retrocompatibilidad**: `hierarchy_enabled = false` por defecto
3. **Cascada en eliminación**: Eliminar región elimina zonas y equipos
4. **Foreign keys**: SET NULL para manager_id/leader_id al eliminar usuario
5. **Índices**: Creados en todos los campos FK para performance

---

## Historial de Cambios

| Fecha      | Versión | Cambios                                            |
| ---------- | ------- | -------------------------------------------------- |
| 2026-01-09 | v1.0    | Estructura base (tablas, APIs de región)           |
| 2026-01-09 | v2.0    | Campos adicionales (ubicación, contacto, gerentes) |
