# Sistema de Reportes de Posts en Comunidades

## Problema Identificado

Cuando los usuarios intentan reportar un post en una comunidad, reciben un **error 404** porque la tabla `community_post_reports` no existe en la base de datos Supabase.

## Solución

Ejecutar el script SQL que crea la tabla y configura las políticas de seguridad (RLS).

## Pasos para Solucionar

### Opción 1: Script Completo (Recomendado)

1. Abre tu proyecto en **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Copia y pega el contenido del archivo: `setup-complete-community-reports.sql`
4. Ejecuta el script (botón "Run" o `Ctrl + Enter`)
5. Verifica que se ejecutó correctamente (sin errores en la consola)

### Opción 2: Scripts Individuales

Si prefieres ejecutar los scripts por separado:

1. Primero ejecuta: `create-community-post-reports-table.sql`
2. Luego ejecuta: `setup-community-post-reports-rls.sql`

## Verificación

Después de ejecutar el script, verifica que la tabla se creó correctamente:

```sql
-- Verificar que la tabla existe
SELECT * FROM information_schema.tables
WHERE table_name = 'community_post_reports';

-- Verificar las columnas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'community_post_reports'
ORDER BY ordinal_position;

-- Verificar las políticas RLS
SELECT * FROM pg_policies
WHERE tablename = 'community_post_reports';
```

## Estructura de la Tabla

La tabla `community_post_reports` tiene las siguientes columnas:

- `id` - UUID, clave primaria
- `post_id` - UUID, referencia al post reportado
- `community_id` - UUID, referencia a la comunidad
- `reported_by_user_id` - UUID, usuario que hizo el reporte
- `reason_category` - Categoría del reporte (spam, inappropriate, harassment, etc.)
- `reason_details` - Detalles adicionales opcionales
- `status` - Estado del reporte (pending, reviewed, resolved, ignored)
- `reviewed_by_user_id` - Usuario que revisó el reporte (opcional)
- `reviewed_at` - Fecha de revisión (opcional)
- `resolution_action` - Acción tomada (delete_post, hide_post, etc.)
- `resolution_notes` - Notas sobre la resolución (opcional)
- `created_at` - Fecha de creación
- `updated_at` - Fecha de última actualización

## Políticas de Seguridad (RLS)

Las políticas RLS configuradas son:

1. **Crear reportes**: Usuarios autenticados pueden crear reportes
2. **Ver reportes**: Usuarios autenticados pueden ver reportes
3. **Actualizar reportes**: Usuarios autenticados pueden actualizar reportes

La validación de permisos específicos (quién puede ver/modificar qué reportes) se hace en la capa de aplicación, en las rutas API.

## Funcionalidad Después de Configurar

Una vez ejecutado el script, los usuarios podrán:

- ✅ Reportar posts de otros usuarios
- ✅ Seleccionar categoría de reporte (spam, contenido inapropiado, acoso, etc.)
- ✅ Agregar detalles adicionales
- ✅ Los moderadores/administradores podrán ver y gestionar reportes

## Rutas API Relacionadas

- `POST /api/communities/[slug]/posts/[postId]/report` - Crear reporte
- `GET /api/communities/[slug]/moderation/reports` - Ver reportes (moderadores)
- `PATCH /api/communities/[slug]/reports/[reportId]/resolve` - Resolver reporte
- `GET /api/admin/communities/slug/[slug]/reports` - Ver reportes (administradores)

## Archivos Relacionados

### Frontend
- `apps/web/src/features/communities/components/ReportPostModal/ReportPostModal.tsx`
- `apps/web/src/features/communities/services/postReports.service.ts`
- `apps/web/src/features/communities/components/PostMenu/PostMenu.tsx`

### API Routes
- `apps/web/src/app/api/communities/[slug]/posts/[postId]/report/route.ts`
- `apps/web/src/app/api/communities/[slug]/moderation/reports/route.ts`
- `apps/web/src/app/api/communities/[slug]/reports/[reportId]/resolve/route.ts`

### Scripts SQL
- `scripts/supabase/setup-complete-community-reports.sql` (Completo)
- `scripts/supabase/create-community-post-reports-table.sql` (Solo tabla)
- `scripts/supabase/setup-community-post-reports-rls.sql` (Solo RLS)

## Soporte

Si encuentras algún problema al ejecutar el script, verifica:

1. Que tienes permisos de administrador en Supabase
2. Que las tablas referenciadas existen (`community_posts`, `communities`, `auth.users`)
3. Que no hay políticas RLS con el mismo nombre ya creadas
4. Revisa los logs de error en el SQL Editor para más detalles
