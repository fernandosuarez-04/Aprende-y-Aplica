-- =====================================================
-- SCRIPTS DE MIGRACIÓN - PRESERVACIÓN DE CONTENIDO EDUCATIVO
-- =====================================================
-- Este archivo contiene todos los scripts necesarios para migrar
-- el contenido educativo crítico desde la estructura actual
-- a la nueva estructura optimizada SIN PÉRDIDA DE DATOS.

-- =====================================================
-- 1. MIGRACIÓN DE CURSOS
-- =====================================================

-- Migrar datos de cursos existentes
INSERT INTO courses (
  course_id, course_title, course_description, course_slug,
  course_price_cents, course_difficulty_level, course_duration_minutes,
  course_average_rating, course_student_count, course_review_count,
  course_thumbnail_url, is_active, is_published, created_at, updated_at,
  instructor_id
)
SELECT 
  id as course_id,
  title as course_title,
  description as course_description,
  slug as course_slug,
  COALESCE(price * 100, 0) as course_price_cents, -- Convertir a centavos
  level as course_difficulty_level,
  duration_total_minutes as course_duration_minutes,
  COALESCE(average_rating, 0.0) as course_average_rating,
  COALESCE(student_count, 0) as course_student_count,
  COALESCE(review_count, 0) as course_review_count,
  thumbnail_url as course_thumbnail_url,
  is_active,
  false as is_published, -- Los cursos existentes no están publicados por defecto
  created_at,
  updated_at,
  instructor_id
FROM public.courses_old
WHERE id IS NOT NULL;

-- =====================================================
-- 2. MIGRACIÓN DE MÓDULOS
-- =====================================================

-- Migrar módulos existentes
INSERT INTO course_modules (
  module_id, module_title, module_description, module_order_index,
  module_duration_minutes, is_required, is_published, created_at, updated_at,
  course_id
)
SELECT 
  id as module_id,
  title as module_title,
  description as module_description,
  order_index as module_order_index,
  COALESCE(duration_minutes, 0) as module_duration_minutes,
  COALESCE(is_required, true) as is_required,
  true as is_published, -- Los módulos existentes están publicados
  created_at,
  updated_at,
  course_id
FROM public.course_modules_old
WHERE id IS NOT NULL;

-- =====================================================
-- 3. MIGRACIÓN DE LECCIONES (CRÍTICO - PRESERVAR TRANSCRIPCIONES)
-- =====================================================

-- Migrar lecciones desde module_videos preservando transcripciones
INSERT INTO course_lessons (
  lesson_id, lesson_title, video_provider_id, video_provider,
  duration_seconds, transcript_content, lesson_description,
  lesson_order_index, is_published, created_at, updated_at,
  module_id, instructor_id
)
SELECT 
  mv.id as lesson_id,
  mv.video_title as lesson_title,
  mv.youtube_video_id as video_provider_id,
  'youtube' as video_provider,
  mv.duration_seconds,
  mv.transcript_text as transcript_content, -- ⚠️ CRÍTICO: Preservar transcripciones
  mv.description as lesson_description,
  COALESCE(mv.video_order, 1) as lesson_order_index,
  true as is_published,
  mv.created_at,
  mv.updated_at,
  mv.module_id,
  cm.instructor_id -- Obtener instructor del módulo
FROM public.module_videos mv
JOIN public.course_modules_old cm ON mv.module_id = cm.id
WHERE mv.id IS NOT NULL;

-- =====================================================
-- 4. MIGRACIÓN DE MATERIALES EDUCATIVOS
-- =====================================================

-- Migrar materiales desde module_materials
INSERT INTO lesson_materials (
  material_id, material_title, material_description, material_type,
  file_url, external_url, content_data, material_order_index,
  is_downloadable, created_at, lesson_id
)
SELECT 
  mm.id as material_id,
  mm.title as material_title,
  mm.description as material_description,
  mm.material_type,
  mm.file_url,
  mm.external_url,
  COALESCE(mm.content_data, '{}') as content_data,
  COALESCE(mm.order_index, 1) as material_order_index,
  COALESCE(mm.is_downloadable, false) as is_downloadable,
  mm.created_at,
  mm.module_id as lesson_id -- Mapear a lesson_id
FROM public.module_materials mm
WHERE mm.id IS NOT NULL;

-- =====================================================
-- 5. MIGRACIÓN DE ACTIVIDADES INTERACTIVAS (CRÍTICO)
-- =====================================================

-- Migrar actividades desde actividad_detalle preservando contenido
INSERT INTO lesson_activities (
  activity_id, activity_title, activity_description, activity_type,
  activity_content, ai_prompts, activity_order_index, is_required,
  created_at, lesson_id
)
SELECT 
  ad.id as activity_id,
  CASE 
    WHEN ad.seccion = 'descripcion' THEN 'Actividad de Descripción'
    WHEN ad.seccion = 'prompts' THEN 'Actividad de Prompts'
    ELSE 'Actividad Interactiva'
  END as activity_title,
  'Actividad migrada desde sistema anterior' as activity_description,
  CASE 
    WHEN ad.tipo::text LIKE '%chat%' THEN 'ai_chat'
    WHEN ad.tipo::text LIKE '%ejercicio%' THEN 'exercise'
    WHEN ad.tipo::text LIKE '%reflexion%' THEN 'reflection'
    ELSE 'exercise'
  END as activity_type,
  ad.contenido as activity_content, -- ⚠️ CRÍTICO: Preservar contenido
  CASE 
    WHEN ad.seccion = 'prompts' THEN ad.contenido
    ELSE NULL
  END as ai_prompts,
  ad.orden as activity_order_index,
  true as is_required,
  ad.created_at,
  ad.actividad_id as lesson_id -- Mapear actividad_id a lesson_id
FROM public.actividad_detalle ad
WHERE ad.id IS NOT NULL;

-- =====================================================
-- 6. MIGRACIÓN DE CHECKPOINTS DE VIDEO (CRÍTICO)
-- =====================================================

-- Migrar checkpoints desde video_checkpoints preservando precisión temporal
INSERT INTO lesson_checkpoints (
  checkpoint_id, checkpoint_time_seconds, checkpoint_label,
  checkpoint_description, is_required_completion, checkpoint_order_index,
  created_at, lesson_id
)
SELECT 
  vc.id as checkpoint_id,
  vc.checkpoint_time_seconds, -- ⚠️ CRÍTICO: Preservar tiempo exacto
  vc.checkpoint_label,
  vc.description as checkpoint_description,
  COALESCE(vc.is_required_completion, false) as is_required_completion,
  ROW_NUMBER() OVER (PARTITION BY vc.video_id ORDER BY vc.checkpoint_time_seconds) as checkpoint_order_index,
  vc.created_at,
  vc.video_id as lesson_id -- Mapear video_id a lesson_id
FROM public.video_checkpoints vc
WHERE vc.id IS NOT NULL;

-- =====================================================
-- 7. MIGRACIÓN DE OBJETIVOS DE APRENDIZAJE (CRÍTICO)
-- =====================================================

-- Migrar objetivos desde learning_objectives
INSERT INTO course_objectives (
  objective_id, objective_text, objective_category, proficiency_level,
  evidence_data, objective_order_index, created_at, course_id
)
SELECT 
  lo.id as objective_id,
  lo.objective_text, -- ⚠️ CRÍTICO: Preservar objetivos
  COALESCE(lo.category, 'general') as objective_category,
  COALESCE(lo.proficiency_level, 'beginner') as proficiency_level,
  COALESCE(lo.evidence_data, '{}') as evidence_data,
  ROW_NUMBER() OVER (PARTITION BY lo.module_progress_id ORDER BY lo.created_at) as objective_order_index,
  lo.created_at,
  -- Obtener course_id desde module_progress -> course_progress -> course_id
  cp.course_id
FROM public.learning_objectives lo
JOIN public.module_progress mp ON lo.module_progress_id = mp.id
JOIN public.course_progress cp ON mp.course_progress_id = cp.id
WHERE lo.id IS NOT NULL;

-- =====================================================
-- 8. MIGRACIÓN DE GLOSARIO (CRÍTICO)
-- =====================================================

-- Migrar glosario desde glossary_term
INSERT INTO course_glossary (
  term_id, term, term_definition, term_category, term_order_index,
  created_at, course_id
)
SELECT 
  gt.id as term_id,
  gt.term::text as term, -- ⚠️ CRÍTICO: Preservar términos
  gt.definition as term_definition,
  COALESCE(gt.category, 'general') as term_category,
  ROW_NUMBER() OVER (ORDER BY gt.term) as term_order_index,
  gt.created_at,
  -- Asignar a un curso por defecto o crear lógica de asignación
  (SELECT course_id FROM courses LIMIT 1) as course_id
FROM public.glossary_term gt
WHERE gt.id IS NOT NULL;

-- =====================================================
-- 9. MIGRACIÓN DE PROGRESO DE USUARIO (CONSOLIDAR)
-- =====================================================

-- Migrar inscripciones desde user_course_progress
INSERT INTO user_course_enrollments (
  enrollment_id, enrollment_status, enrollment_date, completion_date,
  overall_progress_percentage, total_time_minutes, last_activity_at,
  created_at, updated_at, user_id, course_id
)
SELECT 
  ucp.id as enrollment_id,
  CASE 
    WHEN ucp.overall_percentage = 100 THEN 'completed'
    WHEN ucp.overall_percentage > 0 THEN 'active'
    ELSE 'active'
  END as enrollment_status,
  ucp.started_at as enrollment_date,
  ucp.completed_at as completion_date,
  ucp.overall_percentage as overall_progress_percentage,
  -- Calcular tiempo total desde user_activity_log si existe
  COALESCE(
    (SELECT SUM(EXTRACT(EPOCH FROM (updated_at - created_at))/60) 
     FROM user_activity_log 
     WHERE user_id = ucp.user_id), 0
  ) as total_time_minutes,
  ucp.last_activity_at,
  ucp.started_at as created_at,
  ucp.last_activity_at as updated_at,
  ucp.user_id,
  ucp.course_id
FROM public.user_course_progress ucp
WHERE ucp.id IS NOT NULL;

-- Migrar progreso detallado desde user_progress (consolidar en user_lesson_progress)
INSERT INTO user_lesson_progress (
  progress_id, lesson_status, video_progress_percentage, current_time_seconds,
  is_completed, started_at, completed_at, time_spent_minutes, last_accessed_at,
  created_at, updated_at, user_id, lesson_id, enrollment_id
)
SELECT 
  up.id as progress_id,
  CASE 
    WHEN up.completion_percentage = 100 THEN 'completed'
    WHEN up.completion_percentage > 0 THEN 'in_progress'
    ELSE 'not_started'
  END as lesson_status,
  up.completion_percentage as video_progress_percentage,
  up.current_time_seconds,
  up.is_completed,
  up.first_watched_at as started_at,
  up.completed_at,
  -- Calcular tiempo invertido
  COALESCE(
    EXTRACT(EPOCH FROM (up.last_watched_at - up.first_watched_at))/60, 0
  ) as time_spent_minutes,
  up.last_watched_at as last_accessed_at,
  up.first_watched_at as created_at,
  up.last_watched_at as updated_at,
  up.user_id,
  up.video_id as lesson_id,
  -- Obtener enrollment_id
  uce.enrollment_id
FROM public.user_progress up
JOIN public.user_course_enrollments uce ON up.user_id = uce.user_id AND up.course_id = uce.course_id
WHERE up.id IS NOT NULL;

-- =====================================================
-- 10. MIGRACIÓN DE NOTAS DE USUARIO
-- =====================================================

-- Migrar notas desde user_course_notes
INSERT INTO user_lesson_notes (
  note_id, note_title, note_content, note_tags, source_type,
  is_auto_generated, created_at, updated_at, user_id, lesson_id
)
SELECT 
  ucn.id as note_id,
  ucn.title as note_title,
  ucn.content as note_content,
  COALESCE(ucn.tags, '[]') as note_tags,
  ucn.source_type,
  ucn.is_auto_generated,
  ucn.created_at,
  ucn.updated_at,
  ucn.user_id,
  -- Mapear module_id a lesson_id (aproximación)
  (SELECT lesson_id FROM course_lessons WHERE module_id = ucn.module_id LIMIT 1) as lesson_id
FROM public.user_course_notes ucn
WHERE ucn.id IS NOT NULL;

-- =====================================================
-- 11. MIGRACIÓN DE ACTIVIDAD DE USUARIO
-- =====================================================

-- Migrar logs de actividad preservando datos históricos
INSERT INTO user_activity_log (
  log_id, action_type, video_time_seconds, previous_time_seconds,
  action_data, user_agent, ip_address, action_timestamp, user_id, lesson_id
)
SELECT 
  ual.id as log_id,
  ual.action_type,
  ual.video_time_seconds,
  ual.previous_time_seconds,
  '{}' as action_data, -- Datos adicionales vacíos por defecto
  ual.user_agent,
  ual.ip_address,
  ual.timestamp as action_timestamp,
  ual.user_id,
  ual.video_id as lesson_id
FROM public.user_activity_log ual
WHERE ual.id IS NOT NULL;

-- =====================================================
-- 12. VALIDACIÓN DE MIGRACIÓN
-- =====================================================

-- Verificar que todas las transcripciones se migraron
DO $$
DECLARE
  original_count INTEGER;
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO original_count FROM public.module_videos WHERE transcript_text IS NOT NULL;
  SELECT COUNT(*) INTO migrated_count FROM course_lessons WHERE transcript_content IS NOT NULL;
  
  IF original_count != migrated_count THEN
    RAISE EXCEPTION 'ERROR: No se migraron todas las transcripciones. Original: %, Migrado: %', original_count, migrated_count;
  END IF;
  
  RAISE NOTICE 'SUCCESS: Se migraron % transcripciones correctamente', migrated_count;
END $$;

-- Verificar que todas las actividades se migraron
DO $$
DECLARE
  original_count INTEGER;
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO original_count FROM public.actividad_detalle;
  SELECT COUNT(*) INTO migrated_count FROM lesson_activities;
  
  IF original_count != migrated_count THEN
    RAISE EXCEPTION 'ERROR: No se migraron todas las actividades. Original: %, Migrado: %', original_count, migrated_count;
  END IF;
  
  RAISE NOTICE 'SUCCESS: Se migraron % actividades correctamente', migrated_count;
END $$;

-- Verificar que todos los checkpoints se migraron
DO $$
DECLARE
  original_count INTEGER;
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO original_count FROM public.video_checkpoints;
  SELECT COUNT(*) INTO migrated_count FROM lesson_checkpoints;
  
  IF original_count != migrated_count THEN
    RAISE EXCEPTION 'ERROR: No se migraron todos los checkpoints. Original: %, Migrado: %', original_count, migrated_count;
  END IF;
  
  RAISE NOTICE 'SUCCESS: Se migraron % checkpoints correctamente', migrated_count;
END $$;

-- =====================================================
-- 13. ACTUALIZACIÓN DE CONTADORES
-- =====================================================

-- Actualizar contadores de cursos
UPDATE courses SET 
  course_student_count = (
    SELECT COUNT(*) FROM user_course_enrollments 
    WHERE course_id = courses.course_id AND enrollment_status = 'active'
  ),
  course_review_count = (
    SELECT COUNT(*) FROM course_reviews 
    WHERE course_id = courses.course_id
  );

-- Actualizar duración de cursos basada en lecciones
UPDATE courses SET 
  course_duration_minutes = (
    SELECT COALESCE(SUM(duration_seconds)/60, 0) 
    FROM course_lessons cl
    JOIN course_modules cm ON cl.module_id = cm.module_id
    WHERE cm.course_id = courses.course_id
  );

-- =====================================================
-- 14. COMENTARIOS FINALES
-- =====================================================

COMMENT ON TABLE course_lessons IS 'Lecciones migradas desde module_videos con transcripciones preservadas';
COMMENT ON TABLE lesson_activities IS 'Actividades migradas desde actividad_detalle con contenido preservado';
COMMENT ON TABLE lesson_checkpoints IS 'Checkpoints migrados desde video_checkpoints con precisión temporal preservada';
COMMENT ON TABLE course_objectives IS 'Objetivos migrados desde learning_objectives con competencias preservadas';
COMMENT ON TABLE course_glossary IS 'Glosario migrado desde glossary_term con términos preservados';

-- =====================================================
-- FIN DE SCRIPTS DE MIGRACIÓN
-- =====================================================
