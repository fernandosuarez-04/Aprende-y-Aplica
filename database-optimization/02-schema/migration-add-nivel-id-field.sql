-- ============================================================================
-- MIGRACIÓN: Agregar soporte para filtrado por nivel_id
-- ============================================================================
-- Descripción: Agrega el campo exclusivo_nivel_id a la tabla preguntas
--              para permitir filtrar preguntas según el nivel jerárquico
--              del usuario (CEO, Dirección, Gerencia, Miembro, etc.)
-- ============================================================================
-- Fecha: Diciembre 2024
-- ============================================================================

-- ============================================================================
-- PASO 1: Agregar columna exclusivo_nivel_id
-- ============================================================================

ALTER TABLE public.preguntas
ADD COLUMN IF NOT EXISTS exclusivo_nivel_id integer;

-- ============================================================================
-- PASO 2: Agregar foreign key constraint
-- ============================================================================

ALTER TABLE public.preguntas
ADD CONSTRAINT preguntas_exclusivo_nivel_id_fkey 
FOREIGN KEY (exclusivo_nivel_id) 
REFERENCES public.niveles(id);

-- ============================================================================
-- PASO 3: Agregar índice para mejorar performance de consultas
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_preguntas_exclusivo_nivel_id 
ON public.preguntas(exclusivo_nivel_id);

-- ============================================================================
-- PASO 4: Comentario en la columna
-- ============================================================================

COMMENT ON COLUMN public.preguntas.exclusivo_nivel_id IS 
'ID del nivel jerárquico específico para esta pregunta. NULL = pregunta general para todos los niveles. Valores: 1=Dirección General, 2=Dirección de Área, 3=Gerencia, 4=Miembro/Colaborador, 5=Ejecutivo, 6=CEO';

-- ============================================================================
-- PASO 5: Mapeo de roles a niveles (para referencia)
-- ============================================================================
-- Este mapeo se usa para actualizar las preguntas existentes y nuevas
-- 
-- Niveles disponibles:
--   1 = Dirección General
--   2 = Dirección de Área
--   3 = Gerencia
--   4 = Miembro/Colaborador
--   5 = Ejecutivo
--   6 = CEO
--
-- Mapeo Rol → Nivel:
--   Rol 1 (CEO) → Nivel 6 (CEO)
--   Rol 2 (CMO) → Nivel 2 (Dirección de Área)
--   Rol 3 (CTO) → Nivel 2 (Dirección de Área)
--   Rol 4 (Gerente Marketing) → Nivel 3 (Gerencia)
--   Rol 5 (Gerente TI) → Nivel 3 (Gerencia)
--   Rol 6 (Líder/Gerente Ventas) → Nivel 3 (Gerencia)
--   Rol 7 (Analista TI) → Nivel 4 (Miembro/Colaborador)
--   Rol 8 (Academia) → Nivel 4 (Miembro/Colaborador) o NULL
--   Rol 9 (Educación) → Nivel 4 (Miembro/Colaborador) o NULL
--   Rol 10 (Diseño) → Nivel 4 (Miembro/Colaborador) o NULL
--   Rol 11 (Dirección Ventas) → Nivel 2 (Dirección de Área)
--   Rol 12 (Dirección Operaciones) → Nivel 2 (Dirección de Área)
--   Rol 13 (Dirección Finanzas) → Nivel 2 (Dirección de Área)
--   Rol 14 (Dirección RRHH) → Nivel 2 (Dirección de Área)
--   Rol 15 (Dirección Contabilidad) → Nivel 2 (Dirección de Área)
--   Rol 16 (Dirección Compras) → Nivel 2 (Dirección de Área)
--   Rol 17 (Miembros Ventas) → Nivel 4 (Miembro/Colaborador)
--   Rol 18 (Miembros Marketing) → Nivel 4 (Miembro/Colaborador)
--   Rol 19 (Miembros Operaciones) → Nivel 4 (Miembro/Colaborador)
--   Rol 20 (Miembros Finanzas) → Nivel 4 (Miembro/Colaborador)
--   Rol 21 (Miembros RRHH) → Nivel 4 (Miembro/Colaborador)
--   Rol 22 (Miembros Contabilidad) → Nivel 4 (Miembro/Colaborador)
--   Rol 23 (Miembros Compras) → Nivel 4 (Miembro/Colaborador)
--   Rol 24 (Gerencia Media) → Nivel 3 (Gerencia)
--   Rol 25 (Freelancer) → NULL (sin nivel específico)
--   Rol 26 (Consultor) → NULL (sin nivel específico)
--   Rol 27 (Dirección Gobierno) → Nivel 2 (Dirección de Área)
--   Rol 28 (Miembros Gobierno) → Nivel 4 (Miembro/Colaborador)
-- ============================================================================

-- ============================================================================
-- PASO 6: Actualizar preguntas existentes basado en exclusivo_rol_id
-- ============================================================================
-- NOTA: Este script actualiza preguntas existentes basándose en su
--       exclusivo_rol_id. Las preguntas nuevas deben incluir exclusivo_nivel_id
--       directamente en el INSERT.

UPDATE public.preguntas
SET exclusivo_nivel_id = CASE
  -- CEO
  WHEN exclusivo_rol_id = 1 THEN 6  -- CEO → Nivel 6
  
  -- Dirección de Área
  WHEN exclusivo_rol_id IN (2, 3, 11, 12, 13, 14, 15, 16, 27) THEN 2  -- CMO, CTO, Direcciones → Nivel 2
  
  -- Gerencia
  WHEN exclusivo_rol_id IN (4, 5, 6, 24) THEN 3  -- Gerentes → Nivel 3
  
  -- Miembros/Colaboradores
  WHEN exclusivo_rol_id IN (7, 8, 9, 10, 17, 18, 19, 20, 21, 22, 23, 28) THEN 4  -- Miembros → Nivel 4
  
  -- Sin nivel específico (Freelancer, Consultor)
  WHEN exclusivo_rol_id IN (25, 26) THEN NULL
  
  -- Si no hay exclusivo_rol_id, dejar NULL (pregunta general)
  ELSE NULL
END
WHERE exclusivo_rol_id IS NOT NULL;

-- ============================================================================
-- PASO 7: Verificación
-- ============================================================================

-- Verificar distribución de niveles
SELECT 
  exclusivo_nivel_id,
  COUNT(*) as total_preguntas,
  COUNT(DISTINCT exclusivo_rol_id) as roles_unicos
FROM public.preguntas
GROUP BY exclusivo_nivel_id
ORDER BY exclusivo_nivel_id NULLS LAST;

-- Verificar preguntas sin nivel asignado (deberían ser pocas o ninguna si tienen exclusivo_rol_id)
SELECT 
  exclusivo_rol_id,
  COUNT(*) as preguntas_sin_nivel
FROM public.preguntas
WHERE exclusivo_nivel_id IS NULL 
  AND exclusivo_rol_id IS NOT NULL
GROUP BY exclusivo_rol_id
ORDER BY exclusivo_rol_id;

-- ============================================================================
-- ROLLBACK (en caso de necesitar revertir)
-- ============================================================================
-- Para revertir esta migración, ejecutar:
--
-- DROP INDEX IF EXISTS public.idx_preguntas_exclusivo_nivel_id;
-- ALTER TABLE public.preguntas DROP CONSTRAINT IF EXISTS preguntas_exclusivo_nivel_id_fkey;
-- ALTER TABLE public.preguntas DROP COLUMN IF EXISTS exclusivo_nivel_id;
-- ============================================================================




















