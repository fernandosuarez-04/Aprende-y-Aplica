# 📋 Análisis de Redundancias en la Base de Datos - SOFIA

**Fecha de análisis:** 2025-12-18

---

## 🔴 Redundancias Críticas Identificadas

### 1. **Relación Users ↔ Organizations (REDUNDANCIA PRINCIPAL)**

#### Problema:
Existe una **relación circular/duplicada** entre usuarios y organizaciones:

1. **`users.organization_id`** → FK hacia `organizations(id)`
2. **`organization_users`** → Tabla pivote que relaciona `user_id` con `organization_id`

#### Por qué es redundante:
- La tabla `organization_users` ya maneja completamente la relación muchos-a-muchos entre usuarios y organizaciones.
- Además, `organization_users` tiene información adicional importante:
  - `role` (owner, admin, member)
  - `status` (active, invited, suspended, removed)
  - `invited_by`, `invited_at`, `joined_at`
  
- Tener `organization_id` directamente en `users` implica:
  - ❌ Un usuario solo puede pertenecer a UNA organización
  - ❌ No se puede rastrear el rol del usuario
  - ❌ No se puede rastrear cuándo se unió
  - ❌ Duplicación de datos e inconsistencia potencial

#### Solución recomendada:
✅ **Eliminar `users.organization_id`** y usar exclusivamente `organization_users`.

```sql
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_organization_id_fkey;
ALTER TABLE public.users DROP COLUMN IF EXISTS organization_id;
```

---

### 2. **Columnas de Perfil en `users` que ya no se usan**

#### Columnas a eliminar:

| Columna | Razón para eliminar |
|---------|---------------------|
| `curriculum_url` | Sistema de CV no implementado |
| `linkedin_url` | Red social no necesaria |
| `github_url` | Red social no necesaria |
| `website_url` | Portafolio no implementado |
| `points` | Sistema de gamificación eliminado |
| `profile_visibility` | Ya no hay perfiles públicos |
| `show_activity` | No hay feed de actividad |
| `show_email` | No hay perfiles públicos |
| `role_zoom` | Integración Zoom no existe |

---

### 3. **Duplicación de contadores en `community_posts`**

#### Problema (si la tabla se mantiene):
```sql
likes_count integer DEFAULT 0,      -- ❌ DUPLICADO
comments_count integer DEFAULT 0,    -- ❌ DUPLICADO
comment_count integer NOT NULL DEFAULT 0,   -- ✅ MANTENER
reaction_count integer NOT NULL DEFAULT 0,  -- ✅ MANTENER
```

Hay dos pares de contadores que hacen lo mismo:
- `likes_count` vs `reaction_count` (reacciones)
- `comments_count` vs `comment_count` (comentarios)

#### Solución:
Mantener solo `comment_count` y `reaction_count`, eliminar los otros.

---

### 4. **Tablas que ya no se usan (Confirmadas para eliminar)**

El usuario ya eliminó estas tablas del archivo BD.sql:

| Tabla | Razón |
|-------|-------|
| `ai_prompts`, `prompt_favorites`, `prompt_ratings` | Feature de prompts eliminada |
| `app_directory_translations`, `app_favorites`, `app_ratings` | Directorio de apps eliminado |
| `communities`, `community_*` | Sistema de comunidades eliminado |
| `reels`, `reel_*` | Sistema de reels eliminado |
| `skills`, `skill_badges`, `skill_categories`, `course_skills`, `user_skills` | Sistema de skills eliminado |
| `learning_routes`, `learning_route_courses` | Rutas de aprendizaje eliminadas |
| `coupons`, `course_purchases` | Sistema de compras individuales eliminado |
| `news` | Sistema de noticias eliminado |
| `user_favorites` | Favoritos de cursos eliminados |
| `user_groups`, `user_group_members` | Grupos de usuarios eliminados |

---

## 🟡 Otras Observaciones

### 5. **Tabla `lia_messages_tokens_tmp`**
Esta parece ser una tabla temporal que quedó en el esquema. Considerar eliminarla si no se usa:
```sql
DROP TABLE IF EXISTS public.lia_messages_tokens_tmp;
```

### 6. **Columnas `type_rol` y `cargo_rol` en `users`**
- `cargo_rol` → Define el rol principal (Usuario, Instructor, Administrador, Business, Business User)
- `type_rol` → No tiene CHECK constraint, propósito no claro

**Revisar si `type_rol` realmente se usa o es redundante con `cargo_rol`.**

### 7. **Tablas duplicadas por idioma**
Existen tablas separadas por idioma:
- `course_lessons` (español)
- `course_lessons_en` (inglés)
- `course_lessons_pt` (portugués)

Esto funciona pero es menos eficiente que tener una tabla `content_translations` universal (que ya existe). Considerar migrar a usar solo `content_translations` en el futuro.

---

## 📊 Resumen del Impacto

| Categoría | Antes | Después | Ahorro |
|-----------|-------|---------|--------|
| Columnas en `users` | 43 | 34 | ~20% menos |
| Tablas totales | ~95 | ~70 | ~25% menos |
| FKs redundantes | 3 | 0 | 100% |

---

## 🚀 Pasos de Implementación

1. **BACKUP** - Hacer backup completo de la base de datos
2. **DEV FIRST** - Probar el script en ambiente de desarrollo
3. **UPDATE CODE** - Actualizar el código que usaba las columnas eliminadas
4. **EXECUTE** - Ejecutar `cleanup_redundancias.sql` en producción
5. **VERIFY** - Verificar que la aplicación funciona correctamente
6. **VACUUM** - Ejecutar `VACUUM ANALYZE` para optimizar

---

## ⚠️ Archivos del Backend que Podrían Necesitar Cambios

Después de eliminar `users.organization_id`, revisar estos archivos:

- Servicios de autenticación que buscan `organization_id`
- Middleware que verifica organización del usuario
- APIs de usuarios que devuelven `organization_id`
- Queries que hacen `JOIN` directo de `users` a `organizations`

**Cambiar de:**
```sql
SELECT * FROM users WHERE organization_id = 'xxx'
```

**A:**
```sql
SELECT u.* FROM users u
JOIN organization_users ou ON u.id = ou.user_id
WHERE ou.organization_id = 'xxx' AND ou.status = 'active'
```

---

## ✅ Checklist Final

- [ ] Backup realizado
- [ ] Script probado en desarrollo
- [ ] Código actualizado para usar `organization_users`
- [ ] Script ejecutado en producción
- [ ] Aplicación verificada
- [ ] Documentación actualizada
