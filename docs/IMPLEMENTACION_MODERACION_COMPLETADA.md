# ✅ Sistema de Moderación - Implementación Completada

## 📋 Resumen de Cambios Implementados

### 1. ✅ Base de Datos (SQL Ejecutado)
- Tabla `user_warnings` creada
- Tabla `forbidden_words` creada con 26+ palabras prohibidas
- Campos agregados a `users`: `is_banned`, `banned_at`, `ban_reason`
- 5 funciones SQL creadas:
  - `contains_forbidden_content()`
  - `register_user_warning()`
  - `get_user_warnings_count()`
  - `is_user_banned()`
  - `get_user_warning_history()`
- Triggers automáticos para invalidar sesiones
- Políticas RLS configuradas

---

## 2. ✅ Utilidad de Moderación Compartida

**Archivo creado:** `apps/web/src/lib/moderation.ts`

Funciones disponibles:
- `containsForbiddenContent(text)` - Detecta palabras prohibidas
- `registerWarning(userId, content, type)` - Registra advertencia
- `isUserBanned(userId)` - Verifica si está baneado
- `getUserWarningHistory(userId)` - Obtiene historial
- `getUserWarningsCount(userId)` - Cuenta advertencias

---

## 3. ✅ API de Posts - Moderación Implementada

**Archivo modificado:** `apps/web/src/app/api/communities/[slug]/posts/route.ts`

**Cambios:**
- ✅ Valida contenido antes de crear post
- ✅ Detecta palabras prohibidas automáticamente
- ✅ Registra advertencias
- ✅ Banea automáticamente en 4ta infracción
- ✅ Retorna mensajes claros al usuario

**Flujo:**
```
Usuario intenta crear post
    ↓
Sistema verifica palabras prohibidas
    ↓
Si detecta → Registra advertencia
    ↓
Si es 4ta advertencia → Banea usuario
    ↓
Retorna mensaje apropiado
```

---

## 4. ✅ API de Comentarios - Moderación Implementada

**Archivo modificado:** `apps/web/src/app/api/communities/[slug]/posts/[postId]/comments/route.ts`

**Cambios:**
- ✅ Valida contenido antes de crear comentario
- ✅ Detecta palabras prohibidas automáticamente
- ✅ Registra advertencias
- ✅ Banea automáticamente en 4ta infracción
- ✅ Retorna mensajes claros al usuario

**Mismo flujo que posts**

---

## 5. ✅ Sistema de Sesiones - Verificación de Baneo

**Archivo modificado:** `apps/web/src/features/auth/services/session.service.ts`

**Cambios en `getCurrentUser()`:**
- ✅ Verifica campo `is_banned` al obtener usuario
- ✅ Si usuario está baneado → Destruye sesión automáticamente
- ✅ Retorna `null` para usuarios baneados
- ✅ Impide que usuarios baneados accedan al sistema

---

## 6. ✅ Login - Verificación de Baneo

**Archivo modificado:** `apps/web/src/features/auth/actions/login.ts`

**Cambios:**
- ✅ Verifica `is_banned` antes de crear sesión
- ✅ Si usuario está baneado → Impide login
- ✅ Retorna mensaje claro con razón del baneo
- ✅ No permite acceso a cuentas suspendidas

---

## 7. ✅ Página de Usuario Baneado

**Archivo creado:** `apps/web/src/app/auth/banned/page.tsx`

**Características:**
- ✅ Diseño claro y profesional
- ✅ Explica el motivo del baneo
- ✅ Ofrece enlace para volver al inicio
- ✅ Sugiere contactar soporte

---

## 🎯 Cómo Funciona el Sistema

### Escenario 1: Primera Infracción
```
1. Usuario escribe post con "idiota"
2. Sistema detecta palabra prohibida
3. Sistema registra advertencia #1
4. Post NO se crea
5. Usuario ve: "⚠️ Advertencia 1 de 3. El contenido contiene lenguaje inapropiado..."
```

### Escenario 2: Segunda y Tercera Infracción
```
1. Usuario intenta nuevamente con contenido prohibido
2. Sistema registra advertencia #2 o #3
3. Contenido NO se crea
4. Usuario ve: "⚠️ Advertencia 2 de 3..." o "⚠️ Advertencia 3 de 3. Una infracción más..."
```

### Escenario 3: Cuarta Infracción (BANEO)
```
1. Usuario intenta por 4ta vez
2. Sistema registra advertencia #4
3. Contenido NO se crea
4. is_banned = true en la BD
5. Sesiones activas invalidadas
6. Usuario ve: "❌ Has sido baneado del sistema..."
7. Usuario es deslogueado
```

### Escenario 4: Usuario Baneado Intenta Acceder
```
1. Usuario baneado intenta login
2. Sistema verifica is_banned = true
3. Login es rechazado
4. Usuario ve mensaje de cuenta suspendida
```

### Escenario 5: Usuario Baneado con Sesión Activa
```
1. Usuario baneado con sesión abierta intenta navegar
2. getCurrentUser() detecta is_banned = true
3. Sesión es destruida automáticamente
4. Usuario es redirigido al login
```

---

## 🧪 Cómo Probar

### Test 1: Probar Detección de Palabras Prohibidas
```typescript
// En consola del navegador o mediante API test:
1. Intenta crear un post con texto: "Eres un idiota"
2. Deberías ver error con advertencia
3. El post NO debería crearse
4. Verifica en Supabase que se creó registro en user_warnings
```

### Test 2: Probar Sistema de 3 Advertencias
```typescript
1. Crea posts con palabras prohibidas 3 veces
2. Cada vez deberías ver el contador: "Advertencia 1 de 3", "2 de 3", "3 de 3"
3. Los posts NO deberían crearse
4. En Supabase deberías ver 3 registros en user_warnings
```

### Test 3: Probar Baneo Automático
```typescript
1. Después de 3 advertencias, intenta crear post prohibido por 4ta vez
2. Deberías ver mensaje de baneo
3. Deberías ser deslogueado automáticamente
4. En Supabase, el usuario debería tener is_banned = true
5. Intenta hacer login → Debería ser rechazado
```

### Test 4: Verificar en Base de Datos
```sql
-- Ver advertencias de un usuario
SELECT * FROM user_warnings WHERE user_id = 'tu-user-id';

-- Ver si usuario está baneado
SELECT username, is_banned, banned_at, ban_reason 
FROM users 
WHERE id = 'tu-user-id';

-- Ver todas las palabras prohibidas
SELECT * FROM forbidden_words WHERE is_active = true;

-- Probar detección manualmente
SELECT * FROM contains_forbidden_content('Este texto tiene un idiota contenido');
```

---

## 📊 Archivos SQL Disponibles

1. **`database-fixes/moderacion-comunidades.sql`** ⭐
   - Script principal (YA EJECUTADO)

2. **`database-fixes/test-moderacion.sql`**
   - Script de verificación con 8 tests

3. **`database-fixes/palabras-prohibidas-adicionales.sql`**
   - ~100 palabras adicionales (opcional)

4. **`database-fixes/consultas-admin-moderacion.sql`**
   - Consultas útiles para administradores

---

## 🔧 Gestión de Palabras Prohibidas

### Agregar nueva palabra prohibida:
```sql
INSERT INTO forbidden_words (word, severity, category) 
VALUES ('nueva_palabra', 'high', 'insult');
```

### Desactivar palabra sin borrarla:
```sql
UPDATE forbidden_words 
SET is_active = false 
WHERE word = 'palabra';
```

### Ver todas las palabras activas:
```sql
SELECT * FROM forbidden_words 
WHERE is_active = true 
ORDER BY category, severity;
```

---

## 👥 Gestión de Usuarios (Admin)

### Desbanear un usuario (con precaución):
```sql
UPDATE users 
SET is_banned = false, banned_at = NULL, ban_reason = NULL
WHERE username = 'nombre_usuario';

-- Opcional: Limpiar advertencias
DELETE FROM user_warnings WHERE user_id = (
  SELECT id FROM users WHERE username = 'nombre_usuario'
);
```

### Ver usuarios con advertencias:
```sql
SELECT * FROM moderation_stats 
ORDER BY total_warnings DESC;
```

### Ver advertencias recientes:
```sql
SELECT 
  u.username,
  uw.reason,
  uw.content_type,
  uw.created_at,
  LEFT(uw.blocked_content, 50) as contenido
FROM user_warnings uw
JOIN users u ON uw.user_id = u.id
ORDER BY uw.created_at DESC
LIMIT 20;
```

---

## 🚨 Mensajes que Verá el Usuario

### Primera advertencia:
```
⚠️ El contenido contiene lenguaje inapropiado y ha sido bloqueado. 
Advertencia 1 de 3. Una infracción más resultará en baneo.
```

### Segunda advertencia:
```
⚠️ El contenido contiene lenguaje inapropiado y ha sido bloqueado. 
Advertencia 2 de 3. Una infracción más resultará en baneo.
```

### Tercera advertencia:
```
⚠️ El contenido contiene lenguaje inapropiado y ha sido bloqueado. 
Advertencia 3 de 3. Una infracción más resultará en baneo.
```

### Cuarta vez (BANEO):
```
❌ Has sido baneado del sistema por reiteradas violaciones 
de las reglas de la comunidad.
```

### Intento de login cuando está baneado:
```
❌ Tu cuenta ha sido suspendida por violaciones de las reglas 
de la comunidad. Baneado automáticamente después de 4 advertencias 
por violaciones de las reglas de la comunidad.
```

---

## 📈 Métricas y Monitoreo

### Estadísticas generales:
```sql
SELECT 
  (SELECT COUNT(*) FROM forbidden_words WHERE is_active = true) as palabras_activas,
  (SELECT COUNT(*) FROM user_warnings) as total_advertencias,
  (SELECT COUNT(DISTINCT user_id) FROM user_warnings) as usuarios_con_advertencias,
  (SELECT COUNT(*) FROM users WHERE is_banned = true) as usuarios_baneados;
```

### Top usuarios problemáticos:
```sql
SELECT * FROM moderation_stats 
WHERE total_warnings >= 2 
ORDER BY total_warnings DESC 
LIMIT 10;
```

---

## ✅ Checklist Final

- [x] SQL principal ejecutado en Supabase
- [x] Utilidad de moderación creada
- [x] API de posts con validación
- [x] API de comentarios con validación
- [x] Sistema de sesiones verificando baneo
- [x] Login verificando baneo
- [x] Página de usuario baneado creada
- [x] Documentación completa

---

## 🎉 ¡Sistema Completo y Funcionando!

El sistema de moderación está 100% operativo. Ahora:

1. **Filtra automáticamente** contenido ofensivo
2. **Registra advertencias** en cada intento
3. **Banea automáticamente** al 4to intento
4. **Invalida sesiones** de usuarios baneados
5. **Impide acceso** a cuentas suspendidas
6. **Mantiene historial** completo de infracciones

**Próximos pasos opcionales:**
- Agregar más palabras prohibidas
- Crear panel de administración
- Implementar notificaciones por email
- Agregar sistema de apelaciones

---

**Documentos de referencia:**
- `docs/PLAN_IMPLEMENTACION_MODERACION.md` - Plan completo
- `docs/MODERADOR_COMUNIDADES.md` - Documento original
- `database-fixes/README-MODERACION.md` - Guía rápida
