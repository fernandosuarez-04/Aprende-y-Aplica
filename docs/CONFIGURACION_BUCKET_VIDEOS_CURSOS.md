# Configuración del Bucket de Videos de Cursos

## Resumen

Este documento explica cómo configurar el bucket `course-videos` en Supabase Storage para permitir la subida de videos de hasta 1GB con políticas RLS públicas (sin autenticación).

## Requisitos

- Acceso al Dashboard de Supabase
- Permisos de administrador en el proyecto
- SQL Editor habilitado en Supabase

## Pasos de Configuración

### 1. Crear el Bucket en Supabase Dashboard

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Storage** en el menú lateral
3. Haz clic en **"New bucket"** o **"Create bucket"**
4. Configura el bucket con los siguientes valores:
   - **Name**: `course-videos`
   - **Public bucket**: ✅ **Activar** (marcar como público)
   - **File size limit**: Opcional (el límite se controla en el código)
   - **Allowed MIME types**: Opcional (se valida en el código)

5. Haz clic en **"Create bucket"**

### 2. Ejecutar el Script SQL de Políticas RLS

1. Ve a **SQL Editor** en el Dashboard de Supabase
2. Abre el archivo `apps/web/scripts/create-course-videos-bucket-policies.sql`
3. Copia y pega el contenido del script en el SQL Editor
4. Ejecuta el script haciendo clic en **"Run"**

### 3. Verificar la Configuración

Ejecuta esta consulta en el SQL Editor para verificar que las políticas se crearon correctamente:

```sql
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%videos de cursos%';
```

Deberías ver 4 políticas:
- `Permitir lectura pública de videos de cursos` (SELECT)
- `Permitir inserción pública de videos de cursos` (INSERT)
- `Permitir actualización pública de videos de cursos` (UPDATE)
- `Permitir eliminación pública de videos de cursos` (DELETE)

### 4. Verificar que el Bucket es Público

1. Ve a **Storage** > **course-videos**
2. Haz clic en **"Settings"**
3. Verifica que **"Public bucket"** esté activado

## Configuración del Código

El código ya está configurado para:

- ✅ Límite de 1GB (1,073,741,824 bytes)
- ✅ Validación de tipos de archivo (MP4, WebM, OGG)
- ✅ Subida al bucket `course-videos`
- ✅ Rutas públicas para los videos

### Archivos Modificados

1. **`apps/web/src/app/api/admin/upload/course-videos/route.ts`**
   - Límite actualizado a 1GB
   - Validación de tamaño y tipo

2. **`apps/web/src/features/admin/components/VideoProviderSelector.tsx`**
   - Validación frontend a 1GB
   - Mensajes de error actualizados

## Uso

Una vez configurado el bucket y las políticas:

1. Los usuarios pueden subir videos de hasta **1GB** desde el panel de gestión de taller
2. Los videos se suben al bucket `course-videos`
3. Los videos son accesibles públicamente sin autenticación
4. Las URLs públicas se generan automáticamente

## Ejemplo de Uso

Cuando un instructor crea una lección:

1. Selecciona **"Subir Video"** en el selector de proveedor
2. Selecciona un archivo de video (MP4, WebM u OGG)
3. El sistema valida que el archivo no exceda 1GB
4. El video se sube al bucket `course-videos`
5. Se genera una URL pública que se guarda en la base de datos

## Troubleshooting

### Error: "Bucket not found"

- Verifica que el bucket `course-videos` existe en Storage
- Asegúrate de que el nombre sea exactamente `course-videos`

### Error: "Permission denied"

- Verifica que las políticas RLS se crearon correctamente
- Asegúrate de que el bucket está marcado como público
- Ejecuta nuevamente el script SQL si es necesario

### Error: "File too large"

- Verifica que el límite en el código es 1GB (1024 * 1024 * 1024 bytes)
- Asegúrate de que el archivo no exceda 1GB

### Los videos no se pueden ver

- Verifica que el bucket está configurado como público
- Verifica que las políticas de lectura (SELECT) están activas
- Revisa los logs del navegador para errores de CORS

## Seguridad

⚠️ **Importante**: Las políticas RLS configuradas son **públicas** (sin autenticación). Esto significa:

- ✅ Cualquiera puede leer los videos
- ✅ Cualquiera puede subir videos (si tiene acceso a la API)
- ⚠️ Considera agregar validación adicional en el backend si es necesario
- ⚠️ Considera usar políticas más restrictivas si los videos contienen contenido sensible

Si necesitas restringir el acceso, puedes modificar las políticas para requerir autenticación:

```sql
-- Ejemplo: Requerir autenticación para INSERT
CREATE POLICY "Permitir inserción autenticada de videos de cursos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-videos');
```

## Referencias

- [Documentación de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Políticas RLS de Storage](https://supabase.com/docs/guides/storage/security/access-control)
- Script SQL: `apps/web/scripts/create-course-videos-bucket-policies.sql`

