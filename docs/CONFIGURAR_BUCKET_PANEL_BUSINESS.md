# Configuración del Bucket "Panel-Business"

## 📋 Descripción

El bucket `Panel-Business` se utiliza para almacenar imágenes relacionadas con el panel de negocio, incluyendo:
- Imágenes de equipos (Teams)
- Logos de empresas (Logo-Empresa)
- Certificados personalizados
- Otros recursos visuales del panel

## 🚀 Pasos para Configurar

### Opción 1: Usando SQL Script (Recomendado)

1. **Abre Supabase Dashboard**
   - Ve a tu proyecto en [supabase.com](https://supabase.com)

2. **Navega a SQL Editor**
   - En el menú lateral, ve a **SQL Editor**

3. **Ejecuta el script de migración**
   - Abre el archivo `supabase/migrations/create_panel_business_bucket.sql`
   - Copia y pega el contenido en el SQL Editor
   - Haz clic en **Run** para ejecutar el script

4. **Verifica la creación**
   - Ve a **Storage** > **Buckets**
   - Deberías ver el bucket "Panel-Business" listado
   - Verifica que esté marcado como "Public"

### Opción 2: Usando Supabase Dashboard (Manual)

1. **Abre Supabase Dashboard**
   - Ve a tu proyecto en [supabase.com](https://supabase.com)

2. **Navega a Storage**
   - En el menú lateral, ve a **Storage** > **Buckets**

3. **Crea el bucket**
   - Haz clic en **New bucket**
   - Nombre: `Panel-Business`
   - Marca la opción **Public bucket** (importante para que las imágenes sean accesibles)
   - File size limit: `10MB` (10485760 bytes)
   - Allowed MIME types: 
     - `image/png`
     - `image/jpeg`
     - `image/jpg`
     - `image/gif`
     - `image/webp`
   - Haz clic en **Create bucket**

4. **Configurar políticas RLS (Opcional)**
   - Ve a **Storage** > **Policies**
   - Selecciona el bucket "Panel-Business"
   - Crea una política de lectura pública:
     - Nombre: `Public read access for Panel-Business bucket`
     - Allowed operation: `SELECT`
     - Policy definition:
     ```sql
     bucket_id = 'Panel-Business'
     ```

## ✅ Verificación

Después de crear el bucket, verifica que:

1. **El bucket existe y es público**
   - Ve a **Storage** > **Buckets**
   - El bucket "Panel-Business" debe aparecer en la lista
   - Debe estar marcado como "Public"

2. **Las imágenes existentes funcionan**
   - Intenta acceder a una URL de imagen existente
   - Ejemplo: `https://[tu-proyecto].supabase.co/storage/v1/object/public/Panel-Business/Teams/[nombre-archivo].png`
   - Deberías poder ver la imagen sin errores

3. **Los nuevos uploads funcionan**
   - Intenta subir una nueva imagen de equipo desde el panel
   - Verifica que la imagen se guarde correctamente
   - Verifica que la URL generada sea accesible

## 🔧 Estructura de Carpetas

El bucket "Panel-Business" utiliza la siguiente estructura de carpetas:

```
Panel-Business/
├── Teams/              # Imágenes de equipos
│   └── [timestamp]-[id].png
├── Logo-Empresa/       # Logos de empresas
│   └── [timestamp]-[id].png
└── Certificates/       # Certificados personalizados
    └── [timestamp]-[id].png
```

## ⚠️ Notas Importantes

1. **Bucket Público**: El bucket debe ser público para que las imágenes sean accesibles directamente desde las URLs. Las operaciones de escritura (upload) se manejan desde el backend usando Service Role Key.

2. **Límite de Tamaño**: El límite de tamaño de archivo es de 10MB. Si necesitas subir archivos más grandes, ajusta el `file_size_limit` en la configuración del bucket.

3. **Tipos de Archivo**: Solo se permiten imágenes (PNG, JPEG, JPG, GIF, WEBP). Si necesitas otros tipos de archivo, actualiza la lista de `allowed_mime_types`.

4. **Seguridad**: Aunque el bucket es público para lectura, las operaciones de escritura están protegidas y solo se pueden realizar desde el backend con autenticación adecuada.

## 🐛 Solución de Problemas

### Error: "Bucket not found"
- **Causa**: El bucket no existe o no está configurado correctamente
- **Solución**: Ejecuta el script SQL de migración o crea el bucket manualmente siguiendo los pasos anteriores

### Error: "Access denied" al intentar ver una imagen
- **Causa**: El bucket no está configurado como público
- **Solución**: Ve a Storage > Buckets > Panel-Business y marca la opción "Public bucket"

### Error al subir imágenes
- **Causa**: Puede ser un problema de permisos o de tamaño de archivo
- **Solución**: 
  - Verifica que el archivo no exceda 10MB
  - Verifica que el tipo de archivo sea permitido
  - Revisa los logs del servidor para más detalles

## 📚 Referencias

- [Documentación de Supabase Storage](https://supabase.com/docs/guides/storage)
- [Políticas RLS de Storage](https://supabase.com/docs/guides/storage/security/access-policies)

