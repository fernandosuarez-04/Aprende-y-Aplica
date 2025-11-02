# 📋 Guía de Migraciones SQL - Beneficios de Planes

Esta guía explica cómo ejecutar todas las migraciones SQL necesarias para las funcionalidades implementadas.

---

## 🚀 Forma Rápida: Ejecutar Todo

### Opción 1: Script Maestro (Recomendado)

Ejecuta **un solo archivo** que contiene todas las migraciones:

**Archivo:** `Nueva carpeta/migrations/00_run_all_migrations.sql`

**Pasos:**
1. Abre Supabase Dashboard → SQL Editor
2. Copia el contenido completo de `00_run_all_migrations.sql`
3. Pega en el editor SQL
4. Ejecuta el script
5. Verifica que todas las migraciones se completaron sin errores

**✅ Ventajas:**
- Una sola ejecución
- Orden correcto garantizado
- Transacciones seguras (rollback si falla)
- Mensajes informativos de progreso

---

## 📦 Forma Individual: Ejecutar por Separado

Si prefieres ejecutar las migraciones una por una, sigue este orden:

### 1. Mensajería en Asignación de Cursos

**Archivo:** `Nueva carpeta/migrations/add_message_to_course_assignments.sql`

**Qué hace:**
- Agrega columna `message` (text) a `organization_course_assignments`
- Permite mensajes personalizados al asignar cursos

**Ejecutar:**
```sql
-- Ver archivo completo en: Nueva carpeta/migrations/add_message_to_course_assignments.sql
```

---

### 2. Grupos de Usuarios Personalizados

**Archivo:** `Nueva carpeta/migrations/add_user_groups_tables.sql`

**Qué hace:**
- Crea tabla `user_groups` (grupos/departamentos)
- Crea tabla `user_group_members` (miembros de grupos)
- Crea índices para mejorar performance

**Ejecutar:**
```sql
-- Ver archivo completo en: Nueva carpeta/migrations/add_user_groups_tables.sql
```

---

### 3. Branding Corporativo

**Archivo:** `Nueva carpeta/migrations/add_branding_to_organizations.sql`

**Qué hace:**
- Agrega campos de branding a `organizations`:
  - `brand_color_primary` (color principal)
  - `brand_color_secondary` (color secundario)
  - `brand_color_accent` (color de acento)
  - `brand_font_family` (familia de fuentes)
  - `brand_logo_url` (URL del logo)
  - `brand_favicon_url` (URL del favicon)
- Copia `logo_url` existente a `brand_logo_url` si existe

**Ejecutar:**
```sql
-- Ver archivo completo en: Nueva carpeta/migrations/add_branding_to_organizations.sql
```

---

### 4. Dashboard Personalizable

**Archivo:** `Nueva carpeta/migrations/add_dashboard_layouts_table.sql`

**Qué hace:**
- Crea tabla `dashboard_layouts`
- Permite guardar layouts personalizados por organización
- Incluye configuración JSON para posiciones de widgets

**Ejecutar:**
```sql
-- Ver archivo completo en: Nueva carpeta/migrations/add_dashboard_layouts_table.sql
```

---

### 5. Notificaciones Automáticas

**Archivo:** `Nueva carpeta/migrations/add_notification_settings_table.sql`

**Qué hace:**
- Crea tabla `notification_settings`
- Permite configurar notificaciones por evento
- Soporte para múltiples canales (email, push, SMS)

**Ejecutar:**
```sql
-- Ver archivo completo en: Nueva carpeta/migrations/add_notification_settings_table.sql
```

---

### 6. Certificados Personalizados

**Archivo:** `Nueva carpeta/migrations/add_certificate_templates_table.sql`

**Qué hace:**
- Crea tabla `certificate_templates`
- Agrega campo `template_id` a `user_course_certificates`
- Permite templates personalizados con branding

**Ejecutar:**
```sql
-- Ver archivo completo en: Nueva carpeta/migrations/add_certificate_templates_table.sql
```

---

## 🔍 Verificación Post-Migración

### Verificar que las tablas existen:

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_groups',
    'user_group_members',
    'dashboard_layouts',
    'notification_settings',
    'certificate_templates'
)
ORDER BY table_name;
```

### Verificar columnas agregadas:

```sql
-- Verificar columnas de organizations
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'organizations'
AND column_name LIKE 'brand%'
ORDER BY column_name;

-- Verificar columna message
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'organization_course_assignments'
AND column_name = 'message';

-- Verificar columna template_id
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_course_certificates'
AND column_name = 'template_id';
```

### Verificar índices creados:

```sql
-- Ver índices de user_groups
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('user_groups', 'user_group_members', 'dashboard_layouts', 'notification_settings', 'certificate_templates')
ORDER BY tablename, indexname;
```

---

## 📊 Estructura de Tablas Creadas

### user_groups
```sql
id              uuid (PK)
organization_id uuid (FK → organizations)
name            varchar (UNIQUE por organización)
description     text
created_at      timestamp
updated_at      timestamp
```

### user_group_members
```sql
id           uuid (PK)
group_id     uuid (FK → user_groups)
user_id      uuid (FK → users)
assigned_at  timestamp
UNIQUE (group_id, user_id)
```

### dashboard_layouts
```sql
id              uuid (PK)
organization_id uuid (FK → organizations)
name            varchar
layout_config   jsonb
is_default      boolean
created_at      timestamp
updated_at      timestamp
```

### notification_settings
```sql
id              uuid (PK)
organization_id uuid (FK → organizations)
event_type      varchar
enabled         boolean
channels        jsonb (array de strings)
template        text
created_at      timestamp
updated_at      timestamp
UNIQUE (organization_id, event_type)
```

### certificate_templates
```sql
id              uuid (PK)
organization_id uuid (FK → organizations)
name            varchar
description     text
design_config   jsonb
is_default      boolean
is_active       boolean
created_at      timestamp
updated_at      timestamp
```

---

## 🔄 Columnas Agregadas a Tablas Existentes

### organizations
```sql
brand_color_primary    varchar DEFAULT '#3b82f6'
brand_color_secondary  varchar DEFAULT '#10b981'
brand_color_accent     varchar DEFAULT '#8b5cf6'
brand_font_family      varchar DEFAULT 'Inter'
brand_logo_url         text
brand_favicon_url      text
```

### organization_course_assignments
```sql
message  text (nullable)
```

### user_course_certificates
```sql
template_id  uuid (FK → certificate_templates, nullable)
```

---

## ⚠️ Notas Importantes

1. **Orden de Ejecución**: Si ejecutas individualmente, respeta el orden:
   1. Mensajería
   2. Grupos
   3. Branding
   4. Dashboard
   5. Notificaciones
   6. Certificados

2. **Idempotencia**: Todos los scripts usan `IF NOT EXISTS` y `ADD COLUMN IF NOT EXISTS`, por lo que son seguros ejecutar múltiples veces.

3. **Transacciones**: El script maestro usa `BEGIN/COMMIT` para asegurar que todas las migraciones se apliquen o ninguna.

4. **Rollback**: Si algo falla, el script maestro hace rollback automático. Si ejecutas individualmente y falla una, deberás hacer rollback manual.

5. **Backup**: Siempre haz backup de tu base de datos antes de ejecutar migraciones en producción.

---

## ✅ Checklist de Verificación

Después de ejecutar las migraciones, verifica:

- [ ] Tabla `user_groups` existe
- [ ] Tabla `user_group_members` existe
- [ ] Tabla `dashboard_layouts` existe
- [ ] Tabla `notification_settings` existe
- [ ] Tabla `certificate_templates` existe
- [ ] Columna `message` existe en `organization_course_assignments`
- [ ] Campos `brand_*` existen en `organizations`
- [ ] Columna `template_id` existe en `user_course_certificates`
- [ ] Índices creados correctamente
- [ ] Foreign keys funcionando

---

## 🐛 Solución de Problemas

### Error: "relation already exists"
**Solución:** El script detecta tablas existentes y las omite. Es normal.

### Error: "column already exists"
**Solución:** El script detecta columnas existentes y las omite. Es normal.

### Error: "foreign key constraint fails"
**Solución:** Verifica que las tablas referenciadas (`organizations`, `users`) existan primero.

### Error: "permission denied"
**Solución:** Asegúrate de tener permisos de administrador en Supabase o ejecuta como superusuario.

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los mensajes NOTICE en el script maestro
2. Verifica que todas las tablas base existan
3. Consulta los logs de Supabase
4. Ejecuta las queries de verificación arriba

---

**Última actualización:** Diciembre 2024  
**Versión:** 1.0

