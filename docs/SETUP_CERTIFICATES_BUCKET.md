# Configuración del Bucket de Certificados en Supabase Storage

Este documento explica cómo configurar correctamente el bucket `certificates` en Supabase Storage para el sistema de certificados de Aprende y Aplica.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Creación del Bucket](#creación-del-bucket)
- [Configuración de Políticas RLS](#configuración-de-políticas-rls)
- [Verificación de la Configuración](#verificación-de-la-configuración)
- [Solución de Problemas](#solución-de-problemas)
- [Mantenimiento](#mantenimiento)

## Requisitos Previos

Antes de comenzar, asegúrate de tener:

1. Acceso al panel de administración de Supabase
2. Variables de entorno configuradas:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key de Supabase (con permisos completos)

## Creación del Bucket

### Paso 1: Acceder a Storage en Supabase

1. Inicia sesión en [supabase.com](https://supabase.com)
2. Selecciona tu proyecto
3. En el menú lateral, navega a **Storage**

### Paso 2: Crear el Bucket

1. Haz clic en **"New bucket"**
2. Configura el bucket con los siguientes valores:
   - **Name**: `certificates`
   - **Public**: ✅ Marcado (importante para que los certificados sean accesibles públicamente)
   - **File size limit**: 10 MB (opcional, ajusta según necesites)
   - **Allowed MIME types**: `application/pdf` (opcional, recomendado)

3. Haz clic en **"Create bucket"**

## Configuración de Políticas RLS

Las políticas RLS (Row Level Security) controlan quién puede leer, escribir o eliminar archivos del bucket.

### Políticas Recomendadas

#### 1. Política de Lectura Pública (Read)

Permite que cualquier persona pueda leer (descargar) los certificados:

```sql
-- Nombre: Certificates are publicly readable
-- Operación: SELECT
CREATE POLICY "Certificates are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');
```

#### 2. Política de Escritura con Service Role (Insert)

Permite que solo el servicio (usando service_role_key) pueda subir certificados:

```sql
-- Nombre: Certificates can be uploaded by service
-- Operación: INSERT
CREATE POLICY "Certificates can be uploaded by service"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificates');
```

**Nota**: Esta política funciona porque el servicio usa `SUPABASE_SERVICE_ROLE_KEY`, que tiene permisos de administrador y puede escribir independientemente de las políticas RLS. Sin embargo, es recomendable tenerla para mayor claridad.

#### 3. Política de Actualización con Service Role (Update)

Permite que solo el servicio pueda actualizar certificados existentes:

```sql
-- Nombre: Certificates can be updated by service
-- Operación: UPDATE
CREATE POLICY "Certificates can be updated by service"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certificates');
```

#### 4. Política de Eliminación con Service Role (Delete)

Permite que solo el servicio pueda eliminar certificados:

```sql
-- Nombre: Certificates can be deleted by service
-- Operación: DELETE
CREATE POLICY "Certificates can be deleted by service"
ON storage.objects FOR DELETE
USING (bucket_id = 'certificates');
```

### Aplicar las Políticas

#### Opción 1: Usando el SQL Editor

1. En Supabase, ve a **SQL Editor**
2. Pega todas las políticas y ejecútalas:

```sql
-- Ejecutar todas las políticas de una vez
CREATE POLICY "Certificates are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');

CREATE POLICY "Certificates can be uploaded by service"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificates');

CREATE POLICY "Certificates can be updated by service"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certificates');

CREATE POLICY "Certificates can be deleted by service"
ON storage.objects FOR DELETE
USING (bucket_id = 'certificates');
```

#### Opción 2: Usando la interfaz de Storage Policies

1. Ve a **Storage** > **Policies** en Supabase
2. Selecciona el bucket `certificates`
3. Haz clic en **"New policy"**
4. Para cada política:
   - Selecciona el tipo de operación (SELECT, INSERT, UPDATE, DELETE)
   - Da un nombre a la política
   - Pega el código SQL correspondiente
   - Haz clic en **"Review"** y luego en **"Save policy"**

## Verificación de la Configuración

### 1. Verificar que el Bucket Existe

Ejecuta este SQL en el SQL Editor:

```sql
SELECT * FROM storage.buckets WHERE name = 'certificates';
```

Deberías ver una fila con:
- `name = 'certificates'`
- `public = true`

### 2. Verificar las Políticas

Ejecuta este SQL para ver todas las políticas del bucket:

```sql
SELECT *
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%ertificate%';
```

Deberías ver 4 políticas (SELECT, INSERT, UPDATE, DELETE).

### 3. Probar la Subida de Certificados

Intenta generar un certificado desde la aplicación:

1. Completa un curso al 100%
2. Accede a la página de completion: `/courses/[slug]/completion`
3. El certificado debería generarse automáticamente
4. Verifica en los logs del servidor:
   ```
   ✅ Curso obtenido: { id: '...', title: '...', ... }
   ✅ Estudiante obtenido: { ... }
   ✅ Instructor obtenido: { ... }
   📋 Datos del certificado obtenidos: { ... }
   ✅ Validación de datos del certificado exitosa
   ...
   PDF generado exitosamente. Tamaño: XXXX bytes
   Bucket "certificates" encontrado. Id: ...
   PDF subido exitosamente. Path: certificates/...
   ✅ Certificado generado exitosamente
   ```

## Solución de Problemas

### Error: "Bucket not found"

**Problema**: El bucket no existe o el nombre es incorrecto.

**Solución**:
1. Verifica que el bucket se llame exactamente `certificates` (todo en minúsculas)
2. Verifica que el bucket esté creado en el proyecto correcto de Supabase
3. Verifica que la variable `NEXT_PUBLIC_SUPABASE_URL` apunte al proyecto correcto
4. Ejecuta el SQL de verificación:
   ```sql
   SELECT * FROM storage.buckets WHERE name = 'certificates';
   ```

### Error: "Permission denied" o "Forbidden"

**Problema**: Las políticas RLS no permiten la subida o las credenciales son incorrectas.

**Solución**:
1. Verifica que las políticas estén creadas correctamente (ver sección de Verificación)
2. Verifica que `SUPABASE_SERVICE_ROLE_KEY` esté configurada correctamente en `.env`
3. **IMPORTANTE**: Asegúrate de que estés usando `SUPABASE_SERVICE_ROLE_KEY` y NO `NEXT_PUBLIC_SUPABASE_ANON_KEY` para subir certificados
4. En los logs, busca mensajes como:
   ```
   Error de permisos detectado. Verificando políticas RLS del bucket...
   ```
5. Verifica que el bucket sea público:
   ```sql
   SELECT public FROM storage.buckets WHERE name = 'certificates';
   -- Debería retornar public = true
   ```

### Certificados con URL Placeholder

**Problema**: Los certificados se crean con URLs tipo `https://placeholder-certificate-xxx.pdf`

**Causa**: La subida al bucket falló, pero el registro en la base de datos se quedó con la URL temporal.

**Solución**:

1. **Verificar que el bucket existe y está configurado correctamente** (ver secciones anteriores)

2. **Ejecutar el script de limpieza** para eliminar certificados con placeholder:

   ```bash
   # Ver certificados con placeholder (sin eliminar - DRY RUN)
   GET /api/admin/certificates/cleanup-placeholders?dryRun=true

   # Eliminar certificados con placeholder
   GET /api/admin/certificates/cleanup-placeholders?dryRun=false
   ```

3. **Regenerar los certificados**: Una vez eliminados los registros con placeholder, los certificados se regenerarán automáticamente la próxima vez que los usuarios accedan a la página de completion.

### Los PDFs se generan vacíos o muy pequeños

**Problema**: El PDF se genera pero está corrupto o vacío.

**Solución**:
1. Verifica los logs del servidor, busca:
   ```
   ⚠️ Advertencia: El PDF generado es muy pequeño (XXX bytes). Puede estar corrupto.
   ```
2. Verifica que `pdfkit` esté instalado correctamente:
   ```bash
   npm list pdfkit
   ```
3. Verifica que los datos del certificado no sean placeholders:
   ```
   ❌ ERROR: Datos del certificado contienen placeholders o están vacíos
   ```
4. Si los datos son placeholders, verifica:
   - Que el curso tenga un `title` configurado
   - Que el curso tenga un `instructor_id` asignado
   - Que el usuario tenga un nombre (`display_name`, `first_name`+`last_name`, o `username`)

### El nombre del curso o instructor no aparece en el certificado

**Problema**: El certificado se genera con "Curso" o "Instructor" como placeholder.

**Causa**: Los datos no están configurados en la base de datos o la query no los está obteniendo correctamente.

**Solución**:

1. **Verificar los datos en la base de datos**:
   ```sql
   -- Verificar datos del curso
   SELECT id, title, instructor_id
   FROM courses
   WHERE slug = 'tu-curso-slug';

   -- Verificar datos del instructor
   SELECT id, display_name, first_name, last_name, username
   FROM users
   WHERE id = 'instructor-id-del-curso';
   ```

2. **Verificar los logs del servidor** cuando se genera el certificado:
   ```
   🔍 Obteniendo información del curso: ...
   ✅ Curso obtenido: { id: '...', title: 'TU_CURSO', instructor_id: '...' }
   🔍 Obteniendo información del instructor: ...
   ✅ Instructor obtenido: { ... }
   ```

3. **Si los datos existen pero no se obtienen**, puede ser un problema de permisos RLS en las tablas `courses` o `users`. Verifica las políticas RLS de estas tablas.

## Mantenimiento

### Limpiar Certificados con Placeholder

Si tienes certificados con URLs placeholder en la base de datos, puedes limpiarlos usando el endpoint de administración:

```bash
# 1. Ver cuántos certificados con placeholder existen (DRY RUN - no elimina)
GET /api/admin/certificates/cleanup-placeholders?dryRun=true

# 2. Eliminar certificados con placeholder
GET /api/admin/certificates/cleanup-placeholders?dryRun=false
```

**Respuesta esperada (dry run)**:
```json
{
  "success": true,
  "dryRun": true,
  "message": "Se encontraron 5 certificados con URL placeholder (no eliminados)",
  "found": 5,
  "deleted": 0,
  "certificates": [
    {
      "certificate_id": "...",
      "certificate_url": "https://placeholder-certificate-...",
      "enrollment_id": "...",
      "user_id": "...",
      "course_id": "..."
    }
  ]
}
```

### Regenerar un Certificado Específico

Si un certificado tiene datos incorrectos o está corrupto, puedes regenerarlo:

```bash
# Usando certificateId
POST /api/admin/certificates/regenerate
{
  "certificateId": "xxx-xxx-xxx-xxx"
}

# O usando enrollmentId
POST /api/admin/certificates/regenerate
{
  "enrollmentId": "xxx-xxx-xxx-xxx"
}
```

El certificado se eliminará (incluyendo el archivo del storage) y se regenerará automáticamente la próxima vez que el usuario acceda a la página de completion.

### Monitorear el Uso del Bucket

1. Ve a **Storage** en Supabase
2. Selecciona el bucket `certificates`
3. Revisa:
   - **Size**: Tamaño total usado
   - **Files**: Número de archivos
   - **Bandwidth**: Ancho de banda usado (tráfico de descarga)

### Organización de Archivos

Los certificados se guardan con la siguiente estructura:

```
certificates/
  └── {userId}/
      └── {courseId}-{timestamp}.pdf
```

Ejemplo:
```
certificates/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── abc-def-ghi-1699123456789.pdf
```

Esta estructura permite:
- **Agrupar certificados por usuario** (fácil de encontrar todos los certificados de un usuario)
- **Evitar colisiones de nombres** (cada certificado tiene un timestamp único)
- **Facilitar el backup** (puedes hacer backup por usuario)

## Variables de Entorno

Asegúrate de tener configuradas estas variables en tu archivo `.env`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key  # ¡IMPORTANTE! No compartas esta clave

# Site URL (para los enlaces de verificación de certificados)
NEXT_PUBLIC_SITE_URL=https://aprendeyaplica.ai
```

**⚠️ IMPORTANTE**:
- `SUPABASE_SERVICE_ROLE_KEY` debe ser la service role key, NO la anon key
- Esta key NO debe ser expuesta al cliente (por eso no tiene el prefijo `NEXT_PUBLIC_`)
- Esta key tiene permisos de administrador y puede bypassear RLS

## Recursos Adicionales

- [Documentación de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Políticas RLS en Storage](https://supabase.com/docs/guides/storage/security/access-control)
- [API de Supabase Storage](https://supabase.com/docs/reference/javascript/storage-from-upload)

## Contacto y Soporte

Si tienes problemas con la configuración del bucket de certificados:

1. **Revisa los logs del servidor** en tiempo real mientras generas un certificado
2. **Verifica que todas las políticas** estén configuradas correctamente
3. **Usa los endpoints de diagnóstico**:
   - `GET /api/admin/certificates/cleanup-placeholders?dryRun=true` - Ver certificados con placeholder
   - `GET /api/admin/certificates/regenerate?enrollmentId=xxx` - Ver info de un certificado
4. **Revisa esta documentación** para soluciones a problemas comunes

---

**Última actualización**: 2024-11-04
