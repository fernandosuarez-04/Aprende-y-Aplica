# Instrucciones para Configurar Políticas RLS del Bucket "Skills"

## 📋 Requisitos Previos

1. **Bucket "Skills" debe existir en Supabase Storage**
   - Ve a: Supabase Dashboard > Storage
   - Verifica que existe el bucket llamado "Skills"
   - Si no existe, créalo con acceso público para lectura

2. **RLS debe estar habilitado en storage.objects**
   - Esto se hace automáticamente al ejecutar las políticas

3. **Los usuarios administradores deben tener `cargo_rol = 'Administrador'`**
   - Verifica en la tabla `users` que los administradores tengan este campo correcto

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
   
   **Política 1: Lectura Pública**
   - Click en "New Policy"
   - Nombre: `Public read access for Skills bucket`
   - Allowed operation: `SELECT`
   - Policy definition:
   ```sql
   bucket_id = 'Skills'
   ```

   **Política 2: Inserción Solo Admin**
   - Click en "New Policy"
   - Nombre: `Admin insert access for Skills bucket`
   - Allowed operation: `INSERT`
   - Policy definition:
   ```sql
   bucket_id = 'Skills' AND
   auth.uid() IN (
     SELECT id FROM public.users 
     WHERE cargo_rol = 'Administrador' AND id = auth.uid()
   )
   ```

   **Política 3: Actualización Solo Admin**
   - Click en "New Policy"
   - Nombre: `Admin update access for Skills bucket`
   - Allowed operation: `UPDATE`
   - Policy definition (USING):
   ```sql
   bucket_id = 'Skills' AND
   auth.uid() IN (
     SELECT id FROM public.users 
     WHERE cargo_rol = 'Administrador' AND id = auth.uid()
   )
   ```
   - Policy definition (WITH CHECK):
   ```sql
   bucket_id = 'Skills' AND
   auth.uid() IN (
     SELECT id FROM public.users 
     WHERE cargo_rol = 'Administrador' AND id = auth.uid()
   )
   ```

   **Política 4: Eliminación Solo Admin**
   - Click en "New Policy"
   - Nombre: `Admin delete access for Skills bucket`
   - Allowed operation: `DELETE`
   - Policy definition:
   ```sql
   bucket_id = 'Skills' AND
   auth.uid() IN (
     SELECT id FROM public.users 
     WHERE cargo_rol = 'Administrador' AND id = auth.uid()
   )
   ```

### Opción 2: Usando SQL Editor

1. **Abre SQL Editor en Supabase Dashboard**
   - Ve a **SQL Editor** en el menú lateral

2. **Copia y pega el contenido del archivo**
   - Abre el archivo: `Nueva carpeta/RLS_POLICIES_SKILLS_STORAGE.sql`
   - Copia todo el contenido

3. **Ejecuta el script**
   - Pega el contenido en el SQL Editor
   - Haz clic en "Run" o presiona `Ctrl+Enter`

4. **Verifica que las políticas se crearon**
   - Ejecuta esta consulta para verificar:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'objects' 
     AND schemaname = 'storage'
     AND policyname LIKE '%Skills%';
   ```

## ✅ Verificación

Para verificar que todo funciona correctamente:

1. **Como Administrador:**
   - Intenta subir un badge desde el panel de administración
   - Debe funcionar sin errores

2. **Como Usuario Regular:**
   - Intenta acceder a una URL de badge
   - Debe poder ver la imagen (lectura pública)
   - No debe poder subir/editar/eliminar (debe dar error 403)

3. **Verificar en la consola del navegador:**
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

