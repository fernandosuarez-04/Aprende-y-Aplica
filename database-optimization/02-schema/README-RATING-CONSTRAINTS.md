# Scripts para Restricciones UNIQUE en Ratings

Este conjunto de scripts agrega restricciones de unicidad a las tablas de ratings para evitar que un usuario califique el mismo item (curso, prompt o herramienta de IA) múltiples veces.

## 📋 Archivos Incluidos

1. **`check-duplicate-ratings.sql`** - Verifica si existen ratings duplicados
2. **`cleanup-duplicate-ratings.sql`** - Limpia ratings duplicados (opcional)
3. **`add-unique-rating-constraints.sql`** - Agrega las restricciones UNIQUE
4. **`rollback-unique-rating-constraints.sql`** - Revierte los cambios si es necesario

## 🚀 Proceso de Ejecución

### Paso 1: Verificar Duplicados

Antes de agregar las restricciones, verifica si existen ratings duplicados:

```sql
-- Ejecutar en Supabase SQL Editor o tu cliente SQL
\i database-optimization/02-schema/check-duplicate-ratings.sql
```

**Resultado esperado:**
- Si no hay duplicados: No se devuelven filas
- Si hay duplicados: Se muestran los registros duplicados con sus IDs

### Paso 2: Limpiar Duplicados (Solo si es necesario)

Si el paso 1 encontró duplicados, ejecuta este script para limpiarlos:

```sql
-- ⚠️ ADVERTENCIA: Este script ELIMINA datos
-- Hacer backup antes de ejecutar
\i database-optimization/02-schema/cleanup-duplicate-ratings.sql
```

**Importante:**
- El script mantiene el rating más reciente (basado en `updated_at` o `created_at`)
- Elimina los ratings más antiguos
- Está envuelto en una transacción, así que puedes hacer `ROLLBACK` si algo sale mal
- **Revisa los resultados antes de hacer COMMIT**

### Paso 3: Agregar Restricciones UNIQUE

Una vez que no haya duplicados, agrega las restricciones:

```sql
\i database-optimization/02-schema/add-unique-rating-constraints.sql
```

**Restricciones agregadas:**
- `app_ratings_user_app_unique` - Un usuario solo puede calificar una herramienta de IA una vez
- `prompt_ratings_user_prompt_unique` - Un usuario solo puede calificar un prompt una vez
- `course_reviews_user_course_unique` - Un usuario solo puede calificar un curso una vez

## 🔄 Rollback (Si es necesario)

Si necesitas revertir los cambios y eliminar las restricciones:

```sql
\i database-optimization/02-schema/rollback-unique-rating-constraints.sql
```

## 📊 Tablas Afectadas

### 1. `app_ratings` (Herramientas de IA)
- **Restricción:** `UNIQUE(app_id, user_id)`
- **Efecto:** Un usuario solo puede tener un rating por herramienta de IA

### 2. `prompt_ratings` (Prompts)
- **Restricción:** `UNIQUE(prompt_id, user_id)`
- **Efecto:** Un usuario solo puede tener un rating por prompt

### 3. `course_reviews` (Cursos/Talleres)
- **Restricción:** `UNIQUE(course_id, user_id)`
- **Efecto:** Un usuario solo puede tener un review por curso

## ⚙️ Comportamiento Después de las Restricciones

### Antes:
- Un usuario podía crear múltiples ratings para el mismo item
- No había validación a nivel de base de datos

### Después:
- Un usuario solo puede crear un rating por item
- Si intenta crear otro, la base de datos lanzará un error de violación de restricción única
- La aplicación debe manejar esto con un **UPDATE** en lugar de un **INSERT** si el usuario ya calificó

## 💡 Recomendaciones para la Aplicación

Después de agregar estas restricciones, actualiza tu código de aplicación para:

1. **Verificar si existe un rating antes de crear uno nuevo:**
   ```typescript
   // Pseudocódigo
   const existingRating = await getRating(userId, itemId);
   if (existingRating) {
     // Actualizar rating existente
     await updateRating(existingRating.id, newRating);
   } else {
     // Crear nuevo rating
     await createRating(userId, itemId, newRating);
   }
   ```

2. **Usar UPSERT (INSERT ... ON CONFLICT) si tu base de datos lo soporta:**
   ```sql
   INSERT INTO app_ratings (app_id, user_id, rating, review)
   VALUES ($1, $2, $3, $4)
   ON CONFLICT (app_id, user_id)
   DO UPDATE SET 
     rating = EXCLUDED.rating,
     review = EXCLUDED.review,
     updated_at = NOW();
   ```

## ✅ Verificación

Para verificar que las restricciones se agregaron correctamente:

```sql
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname IN (
    'app_ratings_user_app_unique',
    'prompt_ratings_user_prompt_unique',
    'course_reviews_user_course_unique'
)
ORDER BY conname;
```

Deberías ver 3 filas con las restricciones definidas.

## 📝 Notas Importantes

1. **Idempotencia:** Todos los scripts son idempotentes, pueden ejecutarse múltiples veces sin errores
2. **Backup:** Siempre haz un backup antes de ejecutar scripts que modifican datos
3. **Transacciones:** El script de limpieza usa transacciones para seguridad
4. **Performance:** Las restricciones UNIQUE crean índices automáticamente, mejorando el rendimiento de búsquedas

## 🐛 Solución de Problemas

### Error: "duplicate key value violates unique constraint"
- **Causa:** Intentaste insertar un rating cuando ya existe uno para ese usuario e item
- **Solución:** Usa UPDATE en lugar de INSERT, o implementa UPSERT

### Error al ejecutar add-unique-rating-constraints.sql
- **Causa:** Probablemente hay datos duplicados en la base de datos
- **Solución:** Ejecuta primero `check-duplicate-ratings.sql` y luego `cleanup-duplicate-ratings.sql`

---

**Fecha de creación:** Diciembre 2024  
**Versión:** 1.0




































