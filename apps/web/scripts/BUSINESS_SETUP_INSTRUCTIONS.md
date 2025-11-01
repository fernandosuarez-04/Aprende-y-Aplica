# Instrucciones de Configuración del Panel Business

## Pasos para Configurar un Usuario como Business Admin

### Paso 1: Ejecutar Script de Creación de Tablas

**Archivo**: `apps/web/scripts/create-business-tables.sql`

Ejecuta este script EN PRIMER LUGAR en el **Supabase SQL Editor**.

Este script crea:
- ✅ Tabla `organizations` - Para almacenar organizaciones
- ✅ Tabla `organization_users` - Relación usuarios-organizaciones
- ✅ Tabla `organization_course_assignments` - Asignaciones de cursos
- ✅ Tabla `organization_analytics` - Analytics agregadas
- ✅ Modifica tabla `users` - Agrega `organization_id`
- ✅ Constraints de roles actualizados (incluyendo 'Business' y 'Business User')
- ✅ Vistas útiles
- ✅ Funciones auxiliares

**⚠️ IMPORTANTE**: Este script DEBE ejecutarse antes que cualquier otro.

### Paso 2: Configurar el Usuario como Business

Tienes tres opciones:

#### Opción A: Script Simple (MÁS FÁCIL - RECOMENDADO)

**Archivo**: `apps/web/scripts/setup-business-user-simple.sql`

Este script simplificado:
1. Verifica que las tablas existen
2. Busca o crea una organización automáticamente
3. Asigna el rol 'Business' al usuario
4. Vincula el usuario con la organización como 'owner'
5. Muestra el resultado final

**Uso**:
```sql
-- Copia y ejecuta el script completo en Supabase SQL Editor
-- Funciona automáticamente sin necesidad de modificar IDs
```

#### Opción B: Script Completo

**Archivo**: `apps/web/scripts/setup-business-user.sql`

Este script:
1. Verifica que el usuario existe
2. Crea una organización si no existe
3. Asigna el rol 'Business' al usuario
4. Vincula el usuario con la organización como 'owner'
5. Muestra resultado de la configuración

**Uso**:
```sql
-- Copia el script completo en Supabase SQL Editor
-- Modifica el ID del usuario en la línea 2 si es necesario
-- Ejecuta el script
```

#### Opción B: Script Rápido (solo para testing)

**Archivo**: `apps/web/scripts/setup-user-business-example.sql`

Este script solo cambia el rol a 'Business' SIN crear organización.

**⚠️ ATENCIÓN**: Este script NO crea organización, por lo que el usuario tendrá errores al intentar usar el panel Business.

**Uso**:
```sql
-- Ejecuta en Supabase SQL Editor
-- Solo cambia cargo_rol = 'Business'
```

### Paso 3: Configurar Constraint de Roles (si es necesario)

**Archivo**: `apps/web/scripts/update-users-cargo-rol-constraint.sql`

Si tienes errores de constraint al cambiar roles, ejecuta este script:

```sql
-- Ejecuta en Supabase SQL Editor
-- Actualiza el constraint para permitir roles Business
```

Este script:
- Elimina constraint antiguo
- Crea nuevo constraint con todos los roles
- Actualiza tu usuario a Business
- Verifica el resultado

## Estructura de Datos Esperada

Después de ejecutar los scripts correctamente, deberías tener:

### Usuario Business
```sql
SELECT id, username, email, cargo_rol, organization_id
FROM users
WHERE cargo_rol = 'Business';
```

Debería mostrar:
- `cargo_rol` = 'Business'
- `organization_id` = UUID de una organización

### Organización
```sql
SELECT id, name, subscription_plan, subscription_status
FROM organizations;
```

Debería mostrar al menos una organización.

### Usuarios de la Organización
```sql
SELECT ou.role, ou.status, u.username, u.email
FROM organization_users ou
JOIN users u ON ou.user_id = u.id;
```

Debería mostrar usuarios vinculados con su rol y estado.

## Funcionalidades del Panel Business

Una vez configurado correctamente, podrás:

### Para Administradores de Organización (rol 'Business'):
- ✅ Ver dashboard con métricas clave
- ✅ Gestión completa de usuarios:
  - Agregar usuarios
  - Editar usuarios
  - Eliminar usuarios
  - Suspender/Activar usuarios
  - Reenviar invitaciones
- ✅ Asignar cursos a usuarios
- ✅ Ver progreso de aprendizaje
- ✅ Generar reportes y analytics
- ✅ Gestionar configuración de la organización

### Para Empleados (rol 'Business User'):
- ✅ Ver dashboard personalizado
- ✅ Acceder solo a cursos asignados
- ✅ Ver su propio progreso
- ✅ Gestionar su perfil

## Troubleshooting

### Error: "No tienes una organización asignada"

**Causa**: El usuario Business no tiene `organization_id` en la tabla `users`.

**Solución**: Ejecuta `setup-business-user.sql` completo que crea la organización y asigna el usuario.

### Error: "new row for relation 'users' violates check constraint 'users_cargo_rol_check'"

**Causa**: El constraint de `cargo_rol` no incluye 'Business' ni 'Business User'.

**Solución**: Ejecuta `update-users-cargo-rol-constraint.sql`.

### Error: "relation 'organizations' does not exist"

**Causa**: No se ha ejecutado `create-business-tables.sql`.

**Solución**: Ejecuta `create-business-tables.sql` PRIMERO.

### El panel Business no carga usuarios

**Causa**: Puede ser que:
1. El usuario no tiene `organization_id`
2. No hay usuarios en `organization_users`
3. Hay error en la API

**Solución**: 
1. Verifica que el usuario tenga `organization_id`
2. Agrega usuarios mediante la UI o manualmente en la BD
3. Revisa los logs de la consola

## Verificación Rápida

Ejecuta esta query para verificar que todo está configurado correctamente:

```sql
SELECT 
  u.id,
  u.username,
  u.email,
  u.cargo_rol,
  u.organization_id,
  o.name as organization_name,
  o.subscription_plan,
  ou.role as org_role,
  ou.status as org_status
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
LEFT JOIN organization_users ou ON u.id = ou.user_id AND o.id = ou.organization_id
WHERE u.id = 'TU_USER_ID_AQUI'::UUID;
```

Deberías ver:
- ✅ `cargo_rol` = 'Business'
- ✅ `organization_id` no es NULL
- ✅ `organization_name` tiene un valor
- ✅ `org_role` = 'owner'
- ✅ `org_status` = 'active'

## Próximos Pasos

Una vez configurado:
1. Inicia sesión con el usuario Business
2. Serás redirigido automáticamente a `/business-panel/dashboard`
3. Agrega usuarios a tu organización desde el panel de usuarios
4. Asigna cursos a tus empleados
5. Monitorea el progreso de aprendizaje

## Notas Adicionales

- El campo `organization_id` se agregó con `ADD COLUMN IF NOT EXISTS`, por lo que es seguro ejecutar el script varias veces
- Los usuarios Business solo pueden ver y gestionar usuarios de SU propia organización
- Los usuarios Business User solo ven sus propios cursos asignados
- Todos los cambios de usuarios quedan registrados para auditoría

