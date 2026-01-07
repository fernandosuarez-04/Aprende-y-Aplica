-- =====================================================
-- ÍNDICES DE OPTIMIZACIÓN PARA APRENDE Y APLICA
-- =====================================================
-- Este script crea índices para mejorar el rendimiento de las consultas
-- más frecuentes en los paneles business-user y business-panel.
--
-- IMPORTANTE: Ejecutar este script en Supabase SQL Editor
-- Los índices mejoran las consultas SELECT pero tienen un pequeño
-- costo en INSERT/UPDATE/DELETE.
--
-- NOTA: Ejecutar cada bloque por separado si hay errores
-- =====================================================

-- =====================================================
-- ÍNDICES PARA organization_course_assignments
-- =====================================================
-- Usado en: /api/business-user/dashboard, /api/business/analytics, /api/business/dashboard/stats
CREATE INDEX IF NOT EXISTS idx_org_course_assignments_user_status 
ON organization_course_assignments (user_id, status);

CREATE INDEX IF NOT EXISTS idx_org_course_assignments_org_id 
ON organization_course_assignments (organization_id);

CREATE INDEX IF NOT EXISTS idx_org_course_assignments_org_status 
ON organization_course_assignments (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_org_course_assignments_completed_at 
ON organization_course_assignments (completed_at DESC NULLS LAST) 
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_course_assignments_assigned_at 
ON organization_course_assignments (assigned_at DESC);

-- =====================================================
-- ÍNDICES PARA work_team_members
-- =====================================================
-- Usado en: /api/business-user/dashboard, /api/business/teams
CREATE INDEX IF NOT EXISTS idx_work_team_members_user_status 
ON work_team_members (user_id, status);

CREATE INDEX IF NOT EXISTS idx_work_team_members_team_id 
ON work_team_members (team_id);

-- =====================================================
-- ÍNDICES PARA work_teams
-- =====================================================
-- Usado en: /api/business/teams
CREATE INDEX IF NOT EXISTS idx_work_teams_org_status 
ON work_teams (organization_id, status);

-- =====================================================
-- ÍNDICES PARA work_team_course_assignments
-- =====================================================
-- Usado en: /api/business-user/dashboard
CREATE INDEX IF NOT EXISTS idx_work_team_course_assignments_team_status 
ON work_team_course_assignments (team_id, status);

-- =====================================================
-- ÍNDICES PARA user_course_enrollments
-- =====================================================
-- Usado en: /api/business-user/dashboard, /api/business/analytics
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_user_course 
ON user_course_enrollments (user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_enrolled_at 
ON user_course_enrollments (enrolled_at DESC);

-- =====================================================
-- ÍNDICES PARA user_lesson_progress
-- =====================================================
-- Usado en: /api/business/analytics
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id 
ON user_lesson_progress (user_id);

-- =====================================================
-- ÍNDICES PARA user_course_certificates
-- =====================================================
-- Usado en: /api/business-user/dashboard, /api/business/analytics
CREATE INDEX IF NOT EXISTS idx_user_course_certificates_user_id 
ON user_course_certificates (user_id);

CREATE INDEX IF NOT EXISTS idx_user_course_certificates_issued_at 
ON user_course_certificates (issued_at DESC);

-- =====================================================
-- ÍNDICES PARA courses
-- =====================================================
-- Usado en múltiples endpoints con JOINs
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id 
ON courses (instructor_id);

CREATE INDEX IF NOT EXISTS idx_courses_is_active 
ON courses (is_active);

CREATE INDEX IF NOT EXISTS idx_courses_created_at 
ON courses (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_courses_approval_status 
ON courses (approval_status);

-- =====================================================
-- ÍNDICES PARA course_modules
-- =====================================================
-- Usado para calcular duración de cursos
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id 
ON course_modules (course_id);

-- =====================================================
-- ÍNDICES PARA users (panel admin)
-- =====================================================
-- Usado en: /api/admin/users, estadísticas
CREATE INDEX IF NOT EXISTS idx_users_cargo_rol 
ON users (cargo_rol);

CREATE INDEX IF NOT EXISTS idx_users_email_verified 
ON users (email_verified);

CREATE INDEX IF NOT EXISTS idx_users_created_at 
ON users (created_at DESC);

-- =====================================================
-- ANÁLISIS DE TABLAS OPTIMIZADAS
-- =====================================================
-- Ejecutar después de crear los índices para actualizar las estadísticas
ANALYZE organization_course_assignments;
ANALYZE work_team_members;
ANALYZE work_teams;
ANALYZE user_course_enrollments;
ANALYZE user_lesson_progress;
ANALYZE user_course_certificates;
ANALYZE courses;
ANALYZE course_modules;
ANALYZE users;

-- =====================================================
-- VERIFICAR ÍNDICES CREADOS
-- =====================================================
-- Ejecutar esta consulta para ver todos los índices:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
