# 📋 Archivos del Backend que Requieren Actualización

**Fecha:** 2025-12-18  
**Acción:** Eliminar columnas redundantes de la tabla `users`

---

## 🔴 CRÍTICO: Archivos que usan `users.organization_id`

Estos archivos DEBEN actualizarse antes de ejecutar el script de limpieza:

| Archivo | Línea | Cambio requerido |
|---------|-------|------------------|
| `apps/web/src/lib/auth/requireBusiness.ts` | 155 | Eliminar lógica de fallback a `users.organization_id` |
| `apps/web/src/features/auth/actions/login.ts` | 137, 168, 360 | Usar solo `organization_users` |
| `apps/web/src/app/api/auth/me/route.ts` | 74 | Eliminar referencia a `users.organization_id` |

### Cambio recomendado:

**Antes:**
```typescript
// Prioridad 1: organization_users
// Prioridad 2: users.organization_id
const orgId = organizationUsers?.organization_id || user.organization_id;
```

**Después:**
```typescript
// Solo usar organization_users
const orgId = organizationUsers?.organization_id;
if (!orgId) {
  throw new Error('Usuario no pertenece a ninguna organización');
}
```

---

## 🟠 IMPORTANTE: Archivos que usan `linkedin_url`, `github_url`, `website_url`

### Archivos de Perfil:

| Archivo | Acción |
|---------|--------|
| `apps/web/src/features/profile/services/profile.service.ts` | Eliminar campos de interfaces y mapeos |
| `apps/web/src/features/profile/services/profile-server.service.ts` | Eliminar campos de interfaces y mapeos |
| `apps/web/src/features/profile/hooks/useProfile.ts` | Eliminar campos de interfaces |
| `apps/web/src/features/auth/hooks/useUserProfile.ts` | Actualizar `USER_PROFILE_FIELDS` |

### Archivos de Admin:

| Archivo | Acción |
|---------|--------|
| `apps/web/src/features/admin/services/adminUsers.service.ts` | Eliminar campos del tipo y operaciones |
| `apps/web/src/features/admin/components/AddUserModal.tsx` | Eliminar inputs de LinkedIn/GitHub/Website |
| `apps/web/src/features/admin/components/EditUserModal.tsx` | Eliminar inputs de LinkedIn/GitHub/Website |

### Páginas que muestran redes sociales:

| Archivo | Acción |
|---------|--------|
| `apps/web/src/app/profile/page.tsx` | Eliminar sección de redes sociales |
| `apps/web/src/app/courses/[slug]/page.tsx` | Eliminar links del instructor |
| `apps/web/src/app/business-panel/courses/[id]/page.tsx` | Eliminar links del instructor |

### APIs:

| Archivo | Acción |
|---------|--------|
| `apps/web/src/app/api/business/courses/[id]/route.ts` | Eliminar campos del select |
| `apps/web/src/app/api/communities/[slug]/members/route.ts` | Eliminar campos del select y respuesta |

---

## 🟡 MODERADO: Archivos que usan `points`

### Archivos de Perfil:

| Archivo | Línea | Acción |
|---------|-------|--------|
| `apps/web/src/features/profile/hooks/useProfile.ts` | 136 | Eliminar campo points |
| `apps/web/src/features/profile/services/profile.service.ts` | 84, 136 | Eliminar campo points |
| `apps/web/src/features/profile/services/profile-server.service.ts` | 84, 171 | Eliminar campo points |

### Archivos de Admin:

| Archivo | Línea | Acción |
|---------|-------|--------|
| `apps/web/src/features/admin/services/adminUsers.service.ts` | 203, 305 | Eliminar campo points |
| `apps/web/src/features/admin/components/AddUserModal.tsx` | 610 | Eliminar input de puntos |
| `apps/web/src/features/admin/components/EditUserModal.tsx` | 216, 564 | Eliminar input de puntos |
| `apps/web/src/features/business-panel/components/BusinessUserStatsModal.tsx` | 365 | Eliminar display de puntos |

### Páginas:

| Archivo | Línea | Acción |
|---------|-------|--------|
| `apps/web/src/app/profile/page.tsx` | 819 | Eliminar stat de puntos |

### APIs de Comunidades (⚠️ también se eliminan las comunidades):

| Archivo | Línea | Acción |
|---------|-------|--------|
| `apps/web/src/app/api/communities/[slug]/members/route.ts` | 277, 305-306 | Eliminar lógica de puntos |
| `apps/web/src/app/api/communities/[slug]/leagues/route.ts` | 126, 151 | Eliminar lógica de puntos |

---

## 🟣 MENOR: Archivos que usan `profile_visibility`, `show_activity`, `show_email`

| Archivo | Líneas | Acción |
|---------|--------|--------|
| `apps/web/src/app/api/account-settings/route.ts` | 18, 43-45, 88, 94 | Eliminar campos de privacidad |
| `apps/web/src/app/api/communities/[slug]/members/route.ts` | 75, 99, 297 | Eliminar lógica de visibilidad |

---

## 📁 Tipos de Supabase (Generados automáticamente)

Este archivo se regenera automáticamente al sincronizar con Supabase:

| Archivo | Acción |
|---------|--------|
| `apps/web/src/lib/supabase/types.ts` | Se regenerará con `supabase gen types` después del cambio en BD |

---

## 📝 Resumen de Cambios por Prioridad

### 1️⃣ Antes de ejecutar el SQL (CRÍTICO)
- [ ] `login.ts` - Eliminar fallback a `users.organization_id`
- [ ] `requireBusiness.ts` - Usar solo `organization_users`
- [ ] `route.ts` (auth/me) - Eliminar referencia

### 2️⃣ Después del SQL (Puede causar errores)
- [ ] Servicios de perfil - Eliminar campos de redes sociales
- [ ] Modales de admin - Eliminar inputs
- [ ] Páginas de cursos - Eliminar links de instructor

### 3️⃣ Limpieza general (Opcional pero recomendado)
- [ ] Eliminar lógica de puntos
- [ ] Eliminar configuración de visibilidad
- [ ] Regenerar tipos de Supabase

---

## 🔧 Comando para regenerar tipos después del cambio

```bash
cd apps/web
npx supabase gen types typescript --project-id odbxqmhbnkfledqcqujl > src/lib/supabase/types.ts
```

---

## ⚠️ Notas Importantes

1. **Backup**: Hacer backup de la base de datos antes de ejecutar el SQL
2. **Orden**: Actualizar código ANTES de ejecutar el SQL para evitar errores
3. **Testing**: Probar login y flujo de business users después de los cambios
4. **Comunidades**: Si las comunidades se eliminan, todo el código relacionado puede eliminarse también
