-- =====================================================
-- SCRIPTS DE ROLLBACK - SEGURIDAD EN MIGRACIÓN
-- =====================================================
-- Este archivo contiene scripts de rollback para revertir
-- la migración en caso de problemas o para volver a la
-- estructura anterior si es necesario.

-- =====================================================
-- 1. ROLLBACK DE TABLAS NUEVAS (EN ORDEN INVERSO)
-- =====================================================

-- Eliminar triggers primero
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
DROP TRIGGER IF EXISTS update_course_modules_updated_at ON course_modules;
DROP TRIGGER IF EXISTS update_course_lessons_updated_at ON course_lessons;
DROP TRIGGER IF EXISTS update_user_lesson_progress_updated_at ON user_lesson_progress;
DROP TRIGGER IF EXISTS update_user_course_enrollments_updated_at ON user_course_enrollments;

-- Eliminar funciones
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Eliminar índices
DROP INDEX IF EXISTS idx_courses_slug;
DROP INDEX IF EXISTS idx_courses_instructor_active;
DROP INDEX IF EXISTS idx_courses_difficulty_published;
DROP INDEX IF EXISTS idx_courses_rating_student_count;
DROP INDEX IF EXISTS idx_course_lessons_module_order;
DROP INDEX IF EXISTS idx_course_lessons_title_search;
DROP INDEX IF EXISTS idx_course_lessons_transcript_search;
DROP INDEX IF EXISTS idx_user_lesson_progress_user_lesson;
DROP INDEX IF EXISTS idx_user_lesson_progress_enrollment;
DROP INDEX IF EXISTS idx_user_course_enrollments_user_status;
DROP INDEX IF EXISTS idx_transactions_user_status;
DROP INDEX IF EXISTS idx_transactions_course_type;
DROP INDEX IF EXISTS idx_transactions_processor_id;
DROP INDEX IF EXISTS idx_course_reviews_course_rating;
DROP INDEX IF EXISTS idx_course_reviews_user_created;
DROP INDEX IF EXISTS idx_user_activity_log_user_action;
DROP INDEX IF EXISTS idx_user_activity_log_lesson_action;

-- Eliminar tablas nuevas (en orden de dependencias)
DROP TABLE IF EXISTS user_activity_log CASCADE;
DROP TABLE IF EXISTS user_wishlist CASCADE;
DROP TABLE IF EXISTS course_reviews CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS user_course_certificates CASCADE;
DROP TABLE IF EXISTS user_lesson_notes CASCADE;
DROP TABLE IF EXISTS user_lesson_progress CASCADE;
DROP TABLE IF EXISTS user_course_enrollments CASCADE;
DROP TABLE IF EXISTS course_glossary CASCADE;
DROP TABLE IF EXISTS course_objectives CASCADE;
DROP TABLE IF EXISTS lesson_checkpoints CASCADE;
DROP TABLE IF EXISTS lesson_activities CASCADE;
DROP TABLE IF EXISTS lesson_materials CASCADE;
DROP TABLE IF EXISTS course_lessons CASCADE;
DROP TABLE IF EXISTS course_modules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

-- =====================================================
-- 2. RESTAURACIÓN DE TABLAS ORIGINALES (SI ES NECESARIO)
-- =====================================================

-- NOTA: Las tablas originales deben estar respaldadas antes de la migración
-- Este script asume que las tablas originales fueron renombradas con sufijo _old

-- Restaurar tablas originales si existen
-- (Descomentar solo si es necesario restaurar desde backup)

/*
-- Restaurar courses
CREATE TABLE public.courses AS SELECT * FROM public.courses_old;

-- Restaurar course_modules  
CREATE TABLE public.course_modules AS SELECT * FROM public.course_modules_old;

-- Restaurar module_videos
CREATE TABLE public.module_videos AS SELECT * FROM public.module_videos_old;

-- Restaurar module_materials
CREATE TABLE public.module_materials AS SELECT * FROM public.module_materials_old;

-- Restaurar actividad_detalle
CREATE TABLE public.actividad_detalle AS SELECT * FROM public.actividad_detalle_old;

-- Restaurar video_checkpoints
CREATE TABLE public.video_checkpoints AS SELECT * FROM public.video_checkpoints_old;

-- Restaurar learning_objectives
CREATE TABLE public.learning_objectives AS SELECT * FROM public.learning_objectives_old;

-- Restaurar glossary_term
CREATE TABLE public.glossary_term AS SELECT * FROM public.glossary_term_old;

-- Restaurar user_course_progress
CREATE TABLE public.user_course_progress AS SELECT * FROM public.user_course_progress_old;

-- Restaurar user_progress
CREATE TABLE public.user_progress AS SELECT * FROM public.user_progress_old;

-- Restaurar user_course_notes
CREATE TABLE public.user_course_notes AS SELECT * FROM public.user_course_notes_old;

-- Restaurar user_activity_log
CREATE TABLE public.user_activity_log AS SELECT * FROM public.user_activity_log_old;
*/

-- =====================================================
-- 3. VERIFICACIÓN DE ROLLBACK
-- =====================================================

-- Verificar que las tablas nuevas fueron eliminadas
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN (
      'courses', 'course_modules', 'course_lessons', 'lesson_materials',
      'lesson_activities', 'lesson_checkpoints', 'course_objectives',
      'course_glossary', 'user_course_enrollments', 'user_lesson_progress',
      'user_lesson_notes', 'user_course_certificates', 'payment_methods',
      'transactions', 'subscriptions', 'coupons', 'course_reviews',
      'user_wishlist', 'user_activity_log'
    );
  
  IF table_count > 0 THEN
    RAISE EXCEPTION 'ERROR: Aún existen % tablas nuevas después del rollback', table_count;
  END IF;
  
  RAISE NOTICE 'SUCCESS: Rollback completado. Todas las tablas nuevas fueron eliminadas.';
END $$;

-- =====================================================
-- 4. LIMPIEZA DE DATOS TEMPORALES
-- =====================================================

-- Eliminar tablas de backup si existen
DROP TABLE IF EXISTS courses_old CASCADE;
DROP TABLE IF EXISTS course_modules_old CASCADE;
DROP TABLE IF EXISTS module_videos_old CASCADE;
DROP TABLE IF EXISTS module_materials_old CASCADE;
DROP TABLE IF EXISTS actividad_detalle_old CASCADE;
DROP TABLE IF EXISTS video_checkpoints_old CASCADE;
DROP TABLE IF EXISTS learning_objectives_old CASCADE;
DROP TABLE IF EXISTS glossary_term_old CASCADE;
DROP TABLE IF EXISTS user_course_progress_old CASCADE;
DROP TABLE IF EXISTS user_progress_old CASCADE;
DROP TABLE IF EXISTS user_course_notes_old CASCADE;
DROP TABLE IF EXISTS user_activity_log_old CASCADE;

-- =====================================================
-- 5. RESTAURACIÓN DE CONFIGURACIÓN ORIGINAL
-- =====================================================

-- Restaurar configuración de autovacuum si fue modificada
-- (Esto debe hacerse manualmente según la configuración original)

-- Restaurar permisos originales si fueron modificados
-- (Esto debe hacerse manualmente según los permisos originales)

-- =====================================================
-- 6. COMENTARIOS DE ROLLBACK
-- =====================================================

COMMENT ON SCHEMA public IS 'Esquema restaurado a estado anterior a la migración';

-- =====================================================
-- 7. INSTRUCCIONES POST-ROLLBACK
-- =====================================================

/*
INSTRUCCIONES POST-ROLLBACK:

1. Verificar que todas las tablas originales están funcionando correctamente
2. Verificar que los datos originales están intactos
3. Verificar que las aplicaciones pueden conectarse sin problemas
4. Revisar logs de aplicación para errores
5. Ejecutar tests de funcionalidad básica
6. Notificar a usuarios sobre el rollback si es necesario

COMANDOS DE VERIFICACIÓN:

-- Verificar tablas existentes
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar datos críticos
SELECT COUNT(*) FROM module_videos WHERE transcript_text IS NOT NULL;
SELECT COUNT(*) FROM actividad_detalle;
SELECT COUNT(*) FROM video_checkpoints;
SELECT COUNT(*) FROM learning_objectives;
SELECT COUNT(*) FROM glossary_term;

-- Verificar progreso de usuario
SELECT COUNT(*) FROM user_course_progress;
SELECT COUNT(*) FROM user_progress;
SELECT COUNT(*) FROM user_course_notes;
*/

-- =====================================================
-- FIN DE SCRIPTS DE ROLLBACK
-- =====================================================
