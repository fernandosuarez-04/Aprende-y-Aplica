# Solución: Problema de Descarga de PDFs en Bucket reportes-screenshots

## Problema
No se pueden descargar archivos PDF desde el bucket `reportes-screenshots` en Supabase Storage.

## Causas Posibles

1. **Bucket no marcado como público en la UI**
2. **Políticas RLS no aplicadas correctamente**
3. **Problema con el tipo de contenido (MIME type)**
4. **Caché del navegador o CDN**

## Solución Paso a Paso

### Paso 1: Ejecutar el Script SQL

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido completo de `scripts/supabase/setup-reportes-screenshots-bucket.sql`
4. Ejecuta el script completo
5. Verifica que no haya errores

### Paso 2: Verificar Configuración del Bucket en la UI

1. Ve a **Storage** en el panel de Supabase
2. Selecciona el bucket `reportes-screenshots`
3. Verifica que el bucket esté marcado como **Public** (debe aparecer un badge "Public")
4. Si NO está marcado como público:
   - Haz clic en los tres puntos (⋯) junto al nombre del bucket
   - Selecciona **Edit bucket**
   - Marca la casilla **Public bucket**
   - Guarda los cambios

### Paso 3: Verificar Políticas RLS

1. En la página del bucket, ve a la pestaña **Policies**
2. Debes ver dos políticas:
   - `Allow public insert reportes-screenshots` (INSERT)
   - `Allow public select reportes-screenshots` (SELECT)
3. Si no aparecen, ejecuta nuevamente el script SQL

### Paso 4: Probar Descarga Directa

Intenta acceder directamente a la URL pública del archivo:

```
https://[tu-project-id].supabase.co/storage/v1/object/public/reportes-screenshots/[nombre-del-archivo]
```

Reemplaza:
- `[tu-project-id]` con tu ID de proyecto de Supabase
- `[nombre-del-archivo]` con el nombre exacto del archivo PDF

Si puedes acceder directamente desde el navegador, el problema está en la UI de Supabase, no en las políticas.

### Paso 5: Verificar Tipo de Contenido

Si el problema persiste, puede ser que el archivo se subió con un tipo de contenido incorrecto:

1. En la UI de Supabase Storage, selecciona el archivo PDF
2. Verifica que el tipo MIME sea `application/pdf`
3. Si no lo es, puedes:
   - Eliminar el archivo y subirlo nuevamente
   - O usar la API para actualizar el metadata del archivo

## Solución Alternativa: Usar Service Role Key

Si las políticas públicas no funcionan, puedes usar la service role key para descargas desde tu aplicación:

```typescript
// Ejemplo de descarga usando service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const { data, error } = await supabaseAdmin.storage
  .from('reportes-screenshots')
  .download('nombre-del-archivo.pdf');
```

## Verificación Final

Después de ejecutar el script SQL, ejecuta esta consulta para verificar:

```sql
-- Verificar configuración del bucket
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'reportes-screenshots';

-- Verificar políticas RLS
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%reportes-screenshots%';
```

Debes ver:
- `public = true` en el bucket
- Dos políticas: una para INSERT y otra para SELECT
- Ambas políticas con `roles = '{public}'`

## Notas Importantes

- Las políticas RLS se aplican tanto a la API como a la UI de Supabase
- Si el bucket es público Y tiene políticas RLS correctas, las descargas deberían funcionar
- Si después de todo esto aún no funciona, puede ser un bug de la UI de Supabase. En ese caso, usa la URL pública directa o implementa descargas desde tu aplicación usando la API

