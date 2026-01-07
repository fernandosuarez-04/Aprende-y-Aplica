# Prompt de Auditoría de Seguridad y Aislamiento de Datos (Multi-Tenant)

**Contexto del Problema:**
Hemos detectado y corregido una vulnerabilidad crítica de seguridad en nuestra aplicación B2B (Multi-tenant).
El problema consistía en que cuando un usuario cambiaba de organización (o pertenecía a múltiples), los endpoints de la API no filtraban correctamente los datos por la `organization_id` actual. Esto resultaba en:

1. Usuarios viendo "Equipos" de su organización anterior.
2. Usuarios viendo "Cursos asignados" de su organización anterior.
3. Middleware fallando o redirigiendo incorrectamente al usar `.single()` en consultas que devolvían múltiples membresías.

**Solución Aplicada (Ejemplo):**
En `/api/business-user/dashboard` y `/api/business-user/my-team`, hemos actualizado las consultas para:

1. Extraer el `organizationId` validado desde nuestro middleware de autenticación (`requireBusinessUser`).
2. Agregar filtros explícitos `.eq('organization_id', organizationId)` o `.eq('work_teams.organization_id', organizationId)` en todas las consultas a la base de datos (Supabase).
3. En el Middleware, cambiamos `.single()` por `.order('joined_at', { ascending: false }).limit(1)` para priorizar la organización más reciente.

**Tu Tarea:**
Necesito que actúes como un Auditor de Seguridad Senior y revises el resto de la base de código (`apps/web/src/app/api/**`) buscando vulnerabilidades similares de aislamiento de datos.

**Instrucciones Específicas:**

1. **Revisar Endpoints B2B (`/api/business-user/*` y `/api/business-panel/*`):**
   - Analiza cada archivo `route.ts`.
   - Verifica si se está extrayendo `organizationId` del auth.
   - Verifica si TODAS las consultas a tablas sensibles (usuarios, cursos, equipos, métricas) están filtradas por esa `organizationId`.
   - Busca específicamente consultas a `work_team_members`, `organization_users`, `organization_course_assignments` que carezcan de filtros de contexto.

2. **Revisar Consultas de "Equipos" y "Usuarios":**
   - Asegúrate de que cualquier endpoint que liste usuarios (`/users`) o equipos (`/teams`) dentro del panel de administración filtre estrictamente por la organización del administrador autenticado.

3. **Reporte:**
   - Lista los archivos sospechosos.
   - Indica qué consulta específica falta filtrar.
   - Sugiere el código corregido usando el `organizationId` del contexto.

**Patrón de Código Seguro Esperado:**

```typescript
const auth = await requireBusinessUser(); // o requireBusiness()
// ... validación ...
const { organizationId } = auth;

// Consulta SEGURA:
supabase.from("some_table").select("*").eq("organization_id", organizationId); // <--- ESTO ES LO QUE BUSCAMOS QUE ESTÉ PRESENTE
```

Por favor, comienza analizando los directorios:

- `apps/web/src/app/api/business-panel`
- `apps/web/src/app/api/business-user` (además de dashboard y my-team que ya están corregidos)
- `apps/web/src/features/business-panel` (si hay server actions o hooks con lógica de data fetching)
