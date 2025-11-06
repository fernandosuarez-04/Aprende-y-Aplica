# 🔧 Solución: Error Foreign Key Constraint en ai_prompts

## 📋 Resumen del Problema

El error ocurre porque las foreign keys de varias tablas están configuradas para referenciar `auth.users(id)` en lugar de `public.users(id)`.

### Error original:
```
code: '23503'
message: 'insert or update on table "ai_prompts" violates foreign key constraint "ai_prompts_author_id_fkey"'
details: 'Key (author_id)=(8365d552-f342-4cd7-ae6b-dff8063a1377) is not present in table "users".'
```

### Causa raíz:
```sql
-- ❌ INCORRECTO (configuración actual)
CONSTRAINT ai_prompts_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id)

-- ✅ CORRECTO (después del fix)
CONSTRAINT ai_prompts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)
```

## 🎯 Tablas Afectadas

| Tabla | Columna | FK Constraint | Estado |
|-------|---------|---------------|---------|
| `ai_prompts` | `author_id` | `ai_prompts_author_id_fkey` | ❌ Apunta a `auth.users` |
| `app_favorites` | `user_id` | `app_favorites_user_id_fkey` | ❌ Apunta a `auth.users` |
| `app_ratings` | `user_id` | `app_ratings_user_id_fkey` | ❌ Apunta a `auth.users` |
| `prompt_favorites` | `user_id` | `prompt_favorites_user_id_fkey` | ❌ Apunta a `auth.users` |
| `prompt_ratings` | `user_id` | `prompt_ratings_user_id_fkey` | ❌ Apunta a `auth.users` |

## 🚀 Cómo Ejecutar la Solución

### Paso 1: Acceder a Supabase SQL Editor
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Click en **"SQL Editor"** en el menú lateral
3. Click en **"New query"**

### Paso 2: Ejecutar el Script
1. Abre el archivo `apps/web/scripts/fix-foreign-keys.sql`
2. Copia todo el contenido del script
3. Pégalo en el SQL Editor de Supabase
4. Click en **"Run"** o presiona `Ctrl/Cmd + Enter`

### Paso 3: Verificar la Ejecución
El script mostrará mensajes como:
```
✓ Constraint ai_prompts_author_id_fkey eliminada
✓ Nueva constraint ai_prompts_author_id_fkey creada → public.users(id)
...
════════════════════════════════════════════════════════
Verificación completada: 5 constraints corregidas
════════════════════════════════════════════════════════
```

### Paso 4: Probar la Creación de Prompts
Después de ejecutar el script, intenta crear un prompt nuevamente. Debería funcionar sin errores.

## 🔍 Verificación Manual (Opcional)

Si quieres verificar que las foreign keys están correctamente configuradas, ejecuta:

```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.constraint_name IN (
        'ai_prompts_author_id_fkey',
        'app_favorites_user_id_fkey',
        'app_ratings_user_id_fkey',
        'prompt_favorites_user_id_fkey',
        'prompt_ratings_user_id_fkey'
    )
ORDER BY tc.table_name, kcu.column_name;
```

**Resultado esperado:** Todas las foreign keys deben apuntar a `public.users` (no `auth.users`).

## ⚠️ Consideraciones Importantes

### Diferencia entre `auth.users` y `public.users`

En Supabase hay dos tablas de usuarios:

1. **`auth.users`** (Schema: `auth`)
   - Tabla interna de Supabase Auth
   - Contiene credenciales y datos de autenticación
   - No accesible directamente desde el cliente
   - Gestionada automáticamente por Supabase

2. **`public.users`** (Schema: `public`)
   - Tabla de perfiles de usuario personalizados
   - Contiene información adicional del usuario (nombre, bio, etc.)
   - Accesible desde el cliente con RLS
   - Gestionada por tu aplicación

### Política de Eliminación

El script configura diferentes políticas de eliminación:

- **`ON DELETE CASCADE`**: Para favoritos y ratings
  - Si se elimina un usuario, se eliminan automáticamente sus favoritos y ratings

- **`ON DELETE SET NULL`**: Para prompts
  - Si se elimina un usuario, el `author_id` se pone `NULL`
  - Los prompts se mantienen pero sin autor asociado

Puedes cambiar estas políticas según tus necesidades.

## 🔄 Rollback (Revertir Cambios)

Si necesitas revertir los cambios, puedes ejecutar este script:

```sql
BEGIN;

-- Revertir ai_prompts
ALTER TABLE public.ai_prompts DROP CONSTRAINT IF EXISTS ai_prompts_author_id_fkey;
ALTER TABLE public.ai_prompts ADD CONSTRAINT ai_prompts_author_id_fkey
FOREIGN KEY (author_id) REFERENCES auth.users(id);

-- Revertir app_favorites
ALTER TABLE public.app_favorites DROP CONSTRAINT IF EXISTS app_favorites_user_id_fkey;
ALTER TABLE public.app_favorites ADD CONSTRAINT app_favorites_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Revertir app_ratings
ALTER TABLE public.app_ratings DROP CONSTRAINT IF EXISTS app_ratings_user_id_fkey;
ALTER TABLE public.app_ratings ADD CONSTRAINT app_ratings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Revertir prompt_favorites
ALTER TABLE public.prompt_favorites DROP CONSTRAINT IF EXISTS prompt_favorites_user_id_fkey;
ALTER TABLE public.prompt_favorites ADD CONSTRAINT prompt_favorites_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Revertir prompt_ratings
ALTER TABLE public.prompt_ratings DROP CONSTRAINT IF EXISTS prompt_ratings_user_id_fkey;
ALTER TABLE public.prompt_ratings ADD CONSTRAINT prompt_ratings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);

COMMIT;
```

## 🧪 Prueba Después del Fix

Para probar que todo funciona correctamente:

1. **Accede al panel de administración**: `/admin/prompts`
2. **Crea un nuevo prompt** con los siguientes datos:
   ```
   Título: Test Prompt
   Descripción: Prompt de prueba
   Contenido: Este es un prompt de prueba para verificar el fix
   Categoría: Selecciona una categoría existente
   Dificultad: beginner
   Tags: test, prueba
   ```
3. **Click en "Crear Prompt"**
4. **Verifica que se crea correctamente** sin errores

Si todo funciona, ¡el problema está solucionado! 🎉

## 📞 Soporte

Si encuentras algún problema al ejecutar el script:

1. Verifica que tienes permisos de administrador en Supabase
2. Asegúrate de que no hay datos huérfanos (registros con `author_id` que no existen en `public.users`)
3. Revisa los logs del SQL Editor para ver errores específicos

Si el problema persiste, verifica que la tabla `public.users` está correctamente sincronizada con `auth.users` mediante un trigger de Supabase.
