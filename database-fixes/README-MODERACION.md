# 🚀 GUÍA RÁPIDA: Sistema de Moderación de Comunidades

## ¿Qué hace este sistema?

✅ Filtra automáticamente contenido ofensivo en posts y comentarios
✅ Sistema de 3 advertencias antes de banear
✅ Baneo automático al 4to intento
✅ Invalida sesiones de usuarios baneados
✅ Historial completo de infracciones

---

## 📋 PASOS DE EJECUCIÓN

### PASO 1: Ejecutar el SQL Principal

**Archivo:** `database-fixes/moderacion-comunidades.sql`

**Dónde ejecutarlo:**
1. Ve a tu proyecto en Supabase Dashboard
2. Abre el **SQL Editor**
3. Copia y pega TODO el contenido del archivo
4. Presiona **Run** o `Ctrl+Enter`

**¿Qué hace?**
- ✅ Agrega campo `is_banned` a la tabla `users`
- ✅ Crea tabla `user_warnings` (advertencias)
- ✅ Crea tabla `forbidden_words` (palabras prohibidas)
- ✅ Inserta 26 palabras prohibidas iniciales
- ✅ Crea 5 funciones útiles
- ✅ Configura triggers automáticos
- ✅ Configura seguridad (RLS)

**Confirmación:**
Deberías ver mensajes como:
```
✓ Tabla user_warnings creada correctamente
✓ Tabla forbidden_words creada correctamente
✓ Campo is_banned agregado a users
✓ 26 palabras prohibidas insertadas

============================================
INSTALACIÓN COMPLETADA EXITOSAMENTE
============================================
```

---

### PASO 2: (OPCIONAL) Agregar Más Palabras Prohibidas

**Archivo:** `database-fixes/palabras-prohibidas-adicionales.sql`

Este archivo agrega ~100 palabras prohibidas adicionales en español e inglés.

**Ejecutar de la misma forma en SQL Editor de Supabase**

---

### PASO 3: Implementar en el Código

Sigue el documento: `docs/PLAN_IMPLEMENTACION_MODERACION.md`

Los cambios principales son en:
1. `apps/web/src/app/api/communities/[slug]/posts/route.ts`
2. `apps/web/src/app/api/communities/[slug]/posts/[postId]/comments/route.ts`
3. Middleware de autenticación

---

## 🧪 CÓMO PROBAR QUE FUNCIONA

### Prueba 1: Verificar palabras prohibidas en la base de datos

```sql
SELECT COUNT(*) FROM forbidden_words;
-- Debería retornar 26 (o más si ejecutaste el adicional)

SELECT * FROM forbidden_words LIMIT 10;
-- Debería mostrar palabras como 'idiota', 'estúpido', etc.
```

### Prueba 2: Probar la función de detección

```sql
SELECT * FROM contains_forbidden_content('Este mensaje tiene un idiota contenido');
-- Debería retornar: contains_forbidden = true, found_words = ['idiota']

SELECT * FROM contains_forbidden_content('Este es un mensaje limpio');
-- Debería retornar: contains_forbidden = false, found_words = []
```

### Prueba 3: Verificar campos en usuarios

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('is_banned', 'banned_at', 'ban_reason');
-- Debería mostrar las 3 columnas
```

---

## 📊 FUNCIONES DISPONIBLES

Después de ejecutar el SQL, tendrás estas funciones:

### 1. `contains_forbidden_content(texto)`
Verifica si un texto tiene palabras prohibidas
```sql
SELECT * FROM contains_forbidden_content('texto a verificar');
```

### 2. `get_user_warnings_count(user_id)`
Cuenta cuántas advertencias tiene un usuario
```sql
SELECT get_user_warnings_count('uuid-del-usuario');
```

### 3. `register_user_warning(user_id, reason, content_type, content_id, blocked_content)`
Registra una advertencia y banea si es necesario
```sql
SELECT * FROM register_user_warning(
  'uuid-del-usuario',
  'contenido_ofensivo',
  'post',
  null,
  'contenido bloqueado'
);
```

### 4. `is_user_banned(user_id)`
Verifica si un usuario está baneado
```sql
SELECT is_user_banned('uuid-del-usuario');
```

### 5. `get_user_warning_history(user_id)`
Obtiene el historial de advertencias
```sql
SELECT * FROM get_user_warning_history('uuid-del-usuario');
```

---

## 📈 CONSULTAS ÚTILES PARA ADMINISTRADORES

### Ver estadísticas de moderación
```sql
SELECT * FROM moderation_stats;
```

### Ver advertencias recientes
```sql
SELECT 
  u.username,
  uw.reason,
  uw.content_type,
  uw.created_at
FROM user_warnings uw
JOIN users u ON uw.user_id = u.id
ORDER BY uw.created_at DESC
LIMIT 20;
```

### Ver usuarios baneados
```sql
SELECT 
  username,
  email,
  banned_at,
  ban_reason
FROM users
WHERE is_banned = true;
```

### Agregar nueva palabra prohibida
```sql
INSERT INTO forbidden_words (word, severity, category) 
VALUES ('nueva_palabra', 'high', 'insult');
```

### Desactivar una palabra prohibida (sin borrarla)
```sql
UPDATE forbidden_words 
SET is_active = false 
WHERE word = 'palabra';
```

---

## ⚠️ IMPORTANTE

1. **Backup**: Antes de ejecutar, haz un backup de tu base de datos
2. **Testing**: Prueba primero en un ambiente de desarrollo
3. **Permisos**: Asegúrate de tener permisos de administrador en Supabase
4. **Service Role Key**: Necesitarás la service role key para algunas operaciones

---

## 🎯 FLUJO DE MODERACIÓN

```
Usuario intenta publicar contenido ofensivo
              ↓
Sistema detecta palabras prohibidas
              ↓
Sistema registra advertencia #1
              ↓
Usuario ve: "⚠️ Advertencia 1 de 3"
              ↓
[Usuario intenta 2 veces más...]
              ↓
Sistema registra advertencia #4
              ↓
🚫 USUARIO BANEADO AUTOMÁTICAMENTE
              ↓
Sesiones invalidadas
              ↓
No puede volver a entrar
```

---

## 📞 SOPORTE

Si algo no funciona:

1. Revisa los mensajes de error en la consola SQL
2. Verifica que todas las tablas se crearon: `\dt` en psql
3. Verifica que las funciones existen: `\df` en psql
4. Consulta el documento completo: `docs/PLAN_IMPLEMENTACION_MODERACION.md`

---

## ✅ CHECKLIST RÁPIDO

- [ ] Backup de la base de datos hecho
- [ ] Script `moderacion-comunidades.sql` ejecutado sin errores
- [ ] Verificado que hay 26+ palabras prohibidas
- [ ] Verificado que campo `is_banned` existe en users
- [ ] Probado función `contains_forbidden_content()`
- [ ] Leer documento de implementación completo
- [ ] Implementar validaciones en APIs (posts y comments)
- [ ] Implementar bloqueo en autenticación

---

¡Listo! Ahora ejecuta el SQL y tendrás la base de datos preparada para el sistema de moderación. 🎉
