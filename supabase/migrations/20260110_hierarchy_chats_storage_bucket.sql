-- =====================================================
-- MIGRACIÓN: Bucket de Storage para Chats Jerárquicos
-- Fecha: 2026-01-10
-- Descripción: Crea bucket para archivos adjuntos en chats jerárquicos
-- =====================================================

-- =====================================================
-- 1. CREAR BUCKET
-- =====================================================

-- BUCKET: hierarchy-chats
-- Almacena archivos adjuntos de chats jerárquicos (imágenes, documentos, videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hierarchy-chats',
  'hierarchy-chats',
  true,
  10485760, -- 10MB max para archivos normales
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ]
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. POLÍTICAS RLS - LECTURA PÚBLICA
-- =====================================================

-- Eliminar política si existe (para permitir re-ejecutar el script)
DROP POLICY IF EXISTS "hierarchy_chats_public_read" ON storage.objects;

-- Cualquiera puede ver los archivos (bucket público)
CREATE POLICY "hierarchy_chats_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'hierarchy-chats');

-- =====================================================
-- 3. POLÍTICAS RLS - ESCRITURA (Solo desde backend con service role)
-- =====================================================

-- Nota: Las operaciones de escritura se realizan desde el backend
-- usando service_role_key, por lo que no necesitamos políticas RLS
-- para escritura en este caso.

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE storage.buckets IS
  'Buckets de Supabase Storage para la aplicación';



