# Instrucciones para Configurar Políticas RLS del Bucket "Skills"

## 📋 Requisitos Previos

1. **Bucket "Skills" debe existir en Supabase Storage**
   - Ve a: Supabase Dashboard > Storage
   - Verifica que existe el bucket llamado "Skills"
   - Si no existe, créalo con acceso público para lectura

2. **Configurar el bucket como público**
   - Ve a: Supabase Dashboard > Storage > Buckets > Skills
   - Marca la opción "Public bucket" para permitir lectura pública
   - Esto permite que las imágenes sean accesibles públicamente

3. **IMPORTANTE: Este proyecto NO usa Supabase Auth**
   - Usa autenticación personalizada basada en JWT y cookies
   - Las operaciones de escritura se manejan desde el backend usando Service Role Key
   - Solo necesitamos política de lectura pública

## 🚀 Pasos para Configurar las Políticas

### Opción 1: Usando Supabase Dashboard (Recomendado)

1. **Abre Supabase Dashboard**
   - Ve a tu proyecto en [supabase.com](https://supabase.com)

2. **Navega a Storage**
   - En el menú lateral, ve a **Storage** > **Policies**

3. **Selecciona el bucket "Skills"**
   - Haz clic en el bucket "Skills"
   - Ve a la pestaña "Policies"

4. **Crea las políticas manualmente:**
   
   **Política ÚNICA: Lectura Pública**
   - Click en "New Policy"
   - Nombre: `Public read access for Skills bucket`
   - Allowed operation: `SELECT`
   - Policy definition:
   ```sql
   bucket_id = 'Skills'
   ```

   **NOTA IMPORTANTE:**
   - NO necesitas crear políticas para INSERT, UPDATE o DELETE
   - Estas operaciones se manejan desde el backend usando Service Role Key
   - El backend verifica que el usuario sea Administrador antes de permitir uploads
   - Si intentas crear políticas para INSERT/UPDATE/DELETE, obtendrás el error:
     "must be owner of table objects"

### Opción 2: Usando SQL Editor

1. **Abre SQL Editor en Supabase Dashboard**
   - Ve a **SQL Editor** en el menú lateral

2. **Copia y pega SOLO la política de SELECT**
   - Abre el archivo: `Nueva carpeta/RLS_POLICIES_SKILLS_STORAGE.sql`
   - Copia SOLO la política de SELECT (líneas 25-28)
   - O usa el archivo simplificado: `RLS_POLICIES_SKILLS_STORAGE_SIMPLIFIED.sql`

3. **Ejecuta el script**
   - Pega el contenido en el SQL Editor
   - Haz clic en "Run" o presiona `Ctrl+Enter`

4. **Verifica que la política se creó**
   - Ejecuta esta consulta para verificar:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'objects' 
     AND schemaname = 'storage'
     AND policyname LIKE '%Skills%';
   ```
   - Deberías ver solo 1 política (la de SELECT)

## ✅ Verificación

Para verificar que todo funciona correctamente:

1. **Configurar el bucket como público:**
   - Ve a Supabase Dashboard > Storage > Buckets > Skills
   - Marca "Public bucket" si no está marcado
   - Esto permite lectura pública sin necesidad de autenticación

2. **Como Administrador:**
   - Intenta subir un badge desde el panel de administración
   - Debe funcionar sin errores (usa Service Role Key)

3. **Como Usuario Regular:**
   - Intenta acceder a una URL de badge
   - Debe poder ver la imagen (lectura pública)
   - No debe poder subir/editar/eliminar (el backend lo bloquea)

4. **Verificar en la consola del navegador:**
   - No debe haber errores de permisos
   - Las imágenes deben cargarse correctamente

## 🔧 Solución de Problemas

### Error: "new row violates row-level security policy"
- **Causa**: Las políticas RLS no están configuradas correctamente
- **Solución**: Verifica que ejecutaste todas las políticas y que el usuario tiene `cargo_rol = 'Administrador'`

### Error: "permission denied for table storage.objects"
- **Causa**: RLS no está habilitado o las políticas no existen
- **Solución**: Ejecuta `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;` y luego crea las políticas

### Las imágenes no se cargan
- **Causa**: El bucket no es público o la política de SELECT no está configurada
- **Solución**: 
  1. Verifica que el bucket "Skills" tiene acceso público habilitado
  2. Verifica que la política de SELECT existe y está activa

### No puedo subir imágenes como administrador
- **Causa**: La política de INSERT no está configurada o el usuario no es administrador
- **Solución**: 
  1. Verifica en la tabla `users` que tu usuario tiene `cargo_rol = 'Administrador'`
  2. Verifica que la política de INSERT existe y está activa

## 📝 Notas Importantes

- Las políticas RLS se aplican a nivel de fila en la tabla `storage.objects`
- El bucket "Skills" debe existir antes de crear las políticas
- Los cambios en las políticas pueden tardar unos segundos en aplicarse
- Si necesitas eliminar una política, puedes hacerlo desde el Dashboard o con:
  ```sql
  DROP POLICY "nombre_de_la_politica" ON storage.objects;
  ```

