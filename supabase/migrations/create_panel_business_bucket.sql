-- =====================================================
-- Crear bucket "Panel-Business" para almacenar imágenes
-- de equipos, logos y otros recursos del panel de negocio
-- =====================================================

-- Verificar si el bucket ya existe antes de crearlo
DO $$
BEGIN
  -- Intentar crear el bucket si no existe
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'Panel-Business'
  ) THEN
    -- Crear el bucket como público para que las imágenes sean accesibles
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'Panel-Business',
      'Panel-Business',
      true, -- Bucket público para acceso directo a las imágenes
      10485760, -- 10MB límite de tamaño de archivo
      ARRAY[
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/webp'
      ]
    );
    
    RAISE NOTICE 'Bucket "Panel-Business" creado exitosamente';
  ELSE
    RAISE NOTICE 'Bucket "Panel-Business" ya existe';
  END IF;
END $$;

-- Crear política RLS para permitir lectura pública
-- (Las escrituras se manejan desde el backend con Service Role Key)
DO $$
BEGIN
  -- Eliminar política existente si existe
  DROP POLICY IF EXISTS "Public read access for Panel-Business bucket" ON storage.objects;
  
  -- Crear política de lectura pública
  CREATE POLICY "Public read access for Panel-Business bucket"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'Panel-Business');
  
  RAISE NOTICE 'Política RLS de lectura pública creada para Panel-Business';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al crear política RLS: %', SQLERRM;
END $$;

-- Verificar que el bucket fue creado correctamente
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'Panel-Business';

