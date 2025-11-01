# Guía de Configuración del Panel Business

## 🎯 Setup Inicial

### 1. Ejecutar Script de Creación de Tablas

Primero, necesitas crear las tablas en Supabase:

```bash
# En Supabase SQL Editor, ejecuta:
```

**Archivo**: `apps/web/scripts/create-business-tables.sql`

Este script crea:
- ✅ Tabla `organizations` - Organizaciones/empresas
- ✅ Tabla `organization_users` - Relación usuarios-organizaciones
- ✅ Tabla `organization_course_assignments` - Asignación de cursos
- ✅ Tabla `organization_analytics` - Analytics agregadas
- ✅ Modifica tabla `users` - Agrega campo `organization_id`
- ✅ Vistas útiles para consultas
- ✅ Funciones auxiliares

### 2. Configurar Usuario como Business

Para convertir un usuario existente en usuario Business:

**Archivo**: `apps/web/scripts/setup-business-user.sql`

**Para el usuario específico**:
```sql
-- Cambiar el ID del usuario en el script según necesites
-- Ejemplo para el usuario: 8365d552-f342-4cd7-ae6b-dff8063a1377

-- El script automáticamente:
-- 1. Verifica que el usuario existe
-- 2. Crea una organización si no existe
-- 3. Asigna rol "Business" al usuario
-- 4. Vincula usuario con la organización como "owner"
-- 5. Muestra resultado de la configuración
```

### 3. Crear Usuarios Business Users

Para agregar empleados a una organización:

```sql
-- 1. Crear usuario regular
INSERT INTO users (
  id,
  username,
  email,
  password_hash,
  first_name,
  last_name,
  display_name,
  cargo_rol,
  type_rol,
  organization_id
) VALUES (
  gen_random_uuid(),
  'empleado1',
  'empleado1@empresa.com',
  -- Hash de contraseña (generar con bcrypt)
  'Juan',
  'Pérez',
  'Juan Pérez',
  'Business User',
  'Business User',
  'ID_DE_TU_ORGANIZACION'::UUID
);

-- 2. Agregar a organization_users
INSERT INTO organization_users (
  organization_id,
  user_id,
  role,
  status
) VALUES (
  'ID_DE_TU_ORGANIZACION'::UUID,
  'ID_DEL_USUARIO_CREADO'::UUID,
  'member',
  'active'
);
```

## 🔐 Roles del Sistema

El sistema ahora soporta los siguientes roles:

| Rol | Descripción | Redirección al Login |
|-----|-------------|---------------------|
| `Usuario` | Usuario regular | `/dashboard` |
| `Instructor` | Profesores | `/instructor/dashboard` |
| `Administrador` | Admin sistema | `/admin/dashboard` |
| `Business` | Admin organización | `/business-panel/dashboard` |
| `Business User` | Empleado organización | `/business-user/dashboard` |

## 📊 Estructura de Datos

### Organización

```sql
SELECT * FROM organizations;
```

Cada organización tiene:
- Plan de suscripción (team, business, enterprise)
- Estado (active, expired, cancelled, trial)
- Límite de usuarios
- Fechas de inicio/fin

### Usuarios de Organización

```sql
SELECT * FROM organization_users;
```

Relación usuario-organización con:
- Rol en la org (owner, admin, member)
- Estado (active, invited, suspended, removed)
- Fecha de invitación y unión

### Asignaciones de Cursos

```sql
SELECT * FROM organization_course_assignments;
```

Cada asignación rastrea:
- Usuario asignado
- Curso asignado
- Progreso (%)
- Fecha de vencimiento
- Estado

## 🧪 Testing

Para probar el panel:

1. **Ejecutar script de tablas** en Supabase SQL Editor
2. **Configurar usuario Business** con el script de setup
3. **Iniciar sesión** con ese usuario
4. Deberías ser redirigido automáticamente a `/business-panel/dashboard`

## 🔍 Queries Útiles

### Ver todas las organizaciones

```sql
SELECT * FROM v_organization_stats;
```

### Ver usuarios de una organización

```sql
SELECT * FROM v_organization_users_detailed 
WHERE organization_id = 'ID_DE_ORGANIZACION'::UUID;
```

### Ver asignaciones de cursos

```sql
SELECT 
  u.display_name,
  c.title,
  oca.status,
  oca.completion_percentage,
  oca.assigned_at
FROM organization_course_assignments oca
JOIN users u ON oca.user_id = u.id
-- JOIN courses c ON oca.course_id = c.id  -- Ajustar según tu esquema de courses
WHERE oca.organization_id = 'ID_DE_ORGANIZACION'::UUID;
```

## ⚠️ Notas Importantes

1. **Ejecutar primero** `create-business-tables.sql` antes de cualquier otro script
2. **El usuario debe existir** antes de configurarlo como Business
3. **organization_id** se asigna automáticamente
4. Los roles son **case-insensitive** y normalizados en el código
5. Un usuario puede pertenecer a **una sola organización**

## 🚀 Próximos Pasos

Después de configurar las tablas:
1. Ejecutar script de setup para tu usuario
2. Iniciar sesión y verificar redirección
3. Explorar el panel Business
4. Agregar usuarios Business Users
5. Asignar cursos a usuarios

