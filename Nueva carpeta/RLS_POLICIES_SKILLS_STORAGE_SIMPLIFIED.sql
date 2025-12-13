-- =====================================================
-- Políticas RLS Simplificadas para Storage Bucket "Skills"
-- =====================================================
-- 
-- IMPORTANTE: 
-- 1. Este proyecto NO usa Supabase Auth, usa autenticación personalizada
-- 2. Las operaciones de escritura (INSERT/UPDATE/DELETE) se manejan desde el backend
--    usando Service Role Key para bypass de RLS
-- 3. Solo necesitamos política de lectura pública
-- 4. La seguridad se maneja en el backend verificando que el usuario sea Administrador
-- 
-- Para configurar el bucket:
-- 1. Ve a Supabase Dashboard > Storage > Buckets
-- 2. Selecciona el bucket "Skills"
-- 3. Marca "Public bucket" para permitir lectura pública
-- 4. Ejecuta solo la política de SELECT (lectura pública)
-- =====================================================

-- =====================================================
-- Política 1: Lectura Pública (SELECT)
-- =====================================================
-- Permite que cualquier usuario (autenticado o no) pueda leer
-- los badges de skills desde el bucket "Skills"
-- Esta es la ÚNICA política necesaria
-- =====================================================

CREATE POLICY "Public read access for Skills bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'Skills');

-- =====================================================
-- NOTA IMPORTANTE:
-- =====================================================
-- Las operaciones de INSERT, UPDATE y DELETE NO necesitan políticas RLS
-- porque se manejan desde el backend usando Service Role Key:
-- 
-- 1. El endpoint /api/admin/upload/skill-badge verifica que el usuario sea Administrador
-- 2. Luego usa SUPABASE_SERVICE_ROLE_KEY para subir el archivo (bypass RLS)
-- 3. Esto es más seguro porque la verificación de permisos se hace en el backend
-- 
-- Si intentas crear políticas para INSERT/UPDATE/DELETE, obtendrás el error:
-- "must be owner of table objects" porque storage.objects es una tabla del sistema
-- y solo el superusuario puede crear políticas complejas en ella.
-- =====================================================

-- =====================================================
-- Verificación de Políticas
-- =====================================================
-- Para verificar que la política se creó correctamente:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
-- =====================================================


