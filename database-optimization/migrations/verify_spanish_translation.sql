-- ============================================
-- VERIFICACIÓN DE TRADUCCIÓN A ESPAÑOL
-- ============================================
-- Ejecuta esto en Supabase SQL Editor
-- IMPORTANTE: Asegúrate de estar usando el SQL Editor (no Table Editor)
-- El SQL Editor usa SERVICE_ROLE_KEY y puede ver todos los datos

-- ============================================
-- 1. VER TODAS LAS TRADUCCIONES DE LA LECCIÓN
-- ============================================
SELECT 
  id,
  entity_type,
  entity_id,
  language_code,
  created_at,
  updated_at,
  jsonb_object_keys(translations) as translation_keys
FROM public.content_translations
WHERE entity_type = 'lesson'
  AND entity_id = 'f30ac395-a54c-4353-91ff-fecab7120f82'
ORDER BY language_code;

-- ============================================
-- 2. VER LA TRADUCCIÓN A ESPAÑOL COMPLETA
-- ============================================
SELECT 
  id,
  entity_type,
  entity_id,
  language_code,
  translations->>'lesson_title' as lesson_title_es,
  LEFT(translations->>'lesson_description', 100) as lesson_description_preview_es,
  LENGTH(translations->>'transcript_content') as transcript_length,
  LENGTH(translations->>'summary_content') as summary_length,
  created_at,
  updated_at
FROM public.content_translations
WHERE entity_type = 'lesson'
  AND entity_id = 'f30ac395-a54c-4353-91ff-fecab7120f82'
  AND language_code = 'es';

-- ============================================
-- 3. VER EL CONTENIDO COMPLETO (JSON)
-- ============================================
SELECT 
  id,
  entity_type,
  entity_id,
  language_code,
  translations,
  created_at,
  updated_at
FROM public.content_translations
WHERE entity_type = 'lesson'
  AND entity_id = 'f30ac395-a54c-4353-91ff-fecab7120f82'
  AND language_code = 'es';

-- ============================================
-- 4. CONTAR TRADUCCIONES POR IDIOMA
-- ============================================
SELECT 
  language_code,
  COUNT(*) as total_translations
FROM public.content_translations
WHERE entity_type = 'lesson'
GROUP BY language_code
ORDER BY language_code;

-- ============================================
-- 5. VER LAS ÚLTIMAS 10 TRADUCCIONES GUARDADAS
-- ============================================
SELECT 
  id,
  entity_type,
  entity_id,
  language_code,
  created_at,
  updated_at,
  jsonb_object_keys(translations) as translation_keys
FROM public.content_translations
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 6. VERIFICAR SI HAY RLS ACTIVO
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'content_translations';

-- ============================================
-- 7. VERIFICAR EL CONSTRAINT CHECK
-- ============================================
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.content_translations'::regclass
  AND conname = 'content_translations_language_code_check';

