-- Migración: Agregar español ('es') a los idiomas permitidos en content_translations
-- Fecha: 2025-12-06
-- Descripción: Actualiza el constraint CHECK para permitir guardar traducciones a español

-- Paso 1: Eliminar el constraint existente
ALTER TABLE public.content_translations 
DROP CONSTRAINT IF EXISTS content_translations_language_code_check;

-- Paso 2: Crear el nuevo constraint que incluye español
ALTER TABLE public.content_translations
ADD CONSTRAINT content_translations_language_code_check 
CHECK (language_code = ANY (ARRAY['es'::text, 'en'::text, 'pt'::text, 'fr'::text, 'de'::text, 'it'::text, 'zh'::text, 'ja'::text, 'ko'::text]));

-- Verificar que el constraint se aplicó correctamente
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.content_translations'::regclass
  AND conname = 'content_translations_language_code_check';


