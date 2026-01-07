-- ============================================================================
-- SCRIPT DE OPTIMIZACIÓN DE ÍNDICES PARA ESCALA MASIVA (1000+ usuarios)
-- ============================================================================
-- Ejecutar en Supabase SQL Editor
-- Este script crea índices optimizados para soportar alta concurrencia
-- IMPORTANTE: Ejecutar durante horarios de bajo tráfico
-- VALIDADO CONTRA: Nueva carpeta/BD.sql
-- ============================================================================

-- ============================================================================
-- 1. AUTENTICACIÓN Y USUARIOS (CRÍTICO - LOGIN LENTO)
-- ============================================================================

-- Índices para búsqueda de usuarios por email/username (LOGIN)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Índice para filtrar por cargo_rol (redirección después de login)
CREATE INDEX IF NOT EXISTS idx_users_cargo_rol ON users(cargo_rol);

-- Índice para usuarios baneados (moderación)
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned) WHERE is_banned = true;

-- Sesiones de usuario (validación de tokens)
-- NOTA: user_session usa jwt_id, NO session_token
CREATE INDEX IF NOT EXISTS idx_user_session_user_id ON user_session(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_jwt_id ON user_session(jwt_id);
CREATE INDEX IF NOT EXISTS idx_user_session_active ON user_session(user_id, revoked, expires_at)
  WHERE revoked = false;

-- Refresh tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active ON refresh_tokens(user_id, is_revoked, expires_at)
  WHERE is_revoked = false;

-- ============================================================================
-- 2. CURSOS Y ENROLLMENTS (DASHBOARD DE USUARIO)
-- ============================================================================

-- Índices para cursos
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_approval_status ON courses(approval_status);

-- Enrollments (muy frecuente - dashboard de usuario)
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_user_id ON user_course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_course_id ON user_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_user_course ON user_course_enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_status ON user_course_enrollments(enrollment_status);

-- Módulos de cursos
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_order ON course_modules(course_id, module_order_index);
CREATE INDEX IF NOT EXISTS idx_course_modules_published ON course_modules(course_id, is_published)
  WHERE is_published = true;

-- Lecciones
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON course_lessons(module_id, lesson_order_index);
CREATE INDEX IF NOT EXISTS idx_course_lessons_published ON course_lessons(module_id, is_published)
  WHERE is_published = true;

-- ============================================================================
-- 3. PROGRESO DE LECCIONES (TRACKING DE USUARIO)
-- ============================================================================

-- Progreso por lección (muy frecuente)
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_lesson ON user_lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_enrollment ON user_lesson_progress(enrollment_id);

-- Lesson tracking (seguimiento detallado)
CREATE INDEX IF NOT EXISTS idx_lesson_tracking_user_id ON lesson_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_tracking_lesson_id ON lesson_tracking(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_tracking_user_lesson ON lesson_tracking(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_tracking_session ON lesson_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_lesson_tracking_status ON lesson_tracking(status);

-- Actividades de lección
CREATE INDEX IF NOT EXISTS idx_lesson_activities_lesson_id ON lesson_activities(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson_id ON lesson_materials(lesson_id);

-- ============================================================================
-- 4. STUDY PLANNER (SESIONES DE ESTUDIO)
-- ============================================================================

-- Planes de estudio
-- NOTA: study_plans NO tiene columna is_active, solo tiene user_id como FK principal
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON study_plans(user_id);

-- Sesiones de estudio (frecuente - calendario)
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_plan_id ON study_sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_start ON study_sessions(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON study_sessions(status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date_range ON study_sessions(user_id, start_time, end_time);

-- Progreso diario
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date ON daily_progress(user_id, progress_date DESC);

-- ============================================================================
-- 5. ORGANIZACIONES Y BUSINESS (B2B)
-- ============================================================================

-- Miembros de organización
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_org_id ON organization_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_users_status ON organization_users(status);
CREATE INDEX IF NOT EXISTS idx_organization_users_active ON organization_users(user_id, status)
  WHERE status = 'active';

-- Asignaciones de cursos a usuarios de empresa
CREATE INDEX IF NOT EXISTS idx_org_course_assignments_user_id ON organization_course_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_org_course_assignments_course_id ON organization_course_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_org_course_assignments_user_course ON organization_course_assignments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_org_course_assignments_status ON organization_course_assignments(status);

-- Equipos de trabajo
CREATE INDEX IF NOT EXISTS idx_work_team_members_user_id ON work_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_work_team_members_team_id ON work_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_work_team_members_active ON work_team_members(user_id, status)
  WHERE status = 'active';

-- Asignaciones de cursos a equipos
CREATE INDEX IF NOT EXISTS idx_work_team_course_assignments_team_id ON work_team_course_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_work_team_course_assignments_course_id ON work_team_course_assignments(course_id);

-- Certificados de usuarios
CREATE INDEX IF NOT EXISTS idx_user_course_certificates_user_id ON user_course_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_certificates_course_id ON user_course_certificates(course_id);

-- ============================================================================
-- 6. NOTIFICACIONES (POLLING FRECUENTE)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_status ON user_notifications(status);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_status ON user_notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id, status, created_at DESC)
  WHERE status = 'unread';
CREATE INDEX IF NOT EXISTS idx_user_notifications_created ON user_notifications(user_id, created_at DESC);

-- ============================================================================
-- 7. LIA (CHATBOT AI) - CONVERSACIONES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_lia_conversations_user_id ON lia_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_lia_conversations_context ON lia_conversations(context_type);
CREATE INDEX IF NOT EXISTS idx_lia_conversations_user_context ON lia_conversations(user_id, context_type);
CREATE INDEX IF NOT EXISTS idx_lia_conversations_created ON lia_conversations(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lia_messages_conversation_id ON lia_messages(conversation_id);

-- ============================================================================
-- 8. TRADUCCIONES DE CONTENIDO (i18n)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_content_translations_entity ON content_translations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_content_translations_lang ON content_translations(entity_type, entity_id, language_code);

-- ============================================================================
-- 9. AUDIT Y MODERACIÓN
-- ============================================================================

-- Logs de auditoría
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Moderación AI
CREATE INDEX IF NOT EXISTS idx_ai_moderation_logs_user_id ON ai_moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_moderation_logs_status ON ai_moderation_logs(status);

-- Advertencias de usuarios
CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id ON user_warnings(user_id);

-- ============================================================================
-- 10. CALENDARIO Y SINCRONIZACIÓN
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_id ON calendar_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_history_user_id ON calendar_sync_history(user_id);

-- ============================================================================
-- 11. PREGUNTAS Y RESPUESTAS DE CURSOS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_course_questions_course_id ON course_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_questions_user_id ON course_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_questions_created ON course_questions(course_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_question_responses_question_id ON course_question_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_course_question_responses_user_id ON course_question_responses(user_id);

-- ============================================================================
-- 12. REVIEWS Y FEEDBACK
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_user_id ON course_reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_feedback_lesson_id ON lesson_feedback(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_feedback_user_id ON lesson_feedback(user_id);

-- ============================================================================
-- 13. AI APPS (Directorio de aplicaciones IA)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ai_apps_active ON ai_apps(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_apps_category ON ai_apps(category_id);
CREATE INDEX IF NOT EXISTS idx_ai_apps_featured ON ai_apps(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_ai_apps_slug ON ai_apps(slug);

-- ============================================================================
-- ANÁLISIS Y VERIFICACIÓN
-- ============================================================================

-- Ejecutar ANALYZE para actualizar estadísticas del planificador
ANALYZE;

-- ============================================================================
-- VERIFICAR ÍNDICES CREADOS
-- ============================================================================
-- Ejecutar este query después para verificar:

SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid::regclass)) as index_size
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Los índices con WHERE clause son "partial indexes" - más eficientes
-- 2. Los índices compuestos (a, b) soportan queries por (a) y (a, b) pero NO solo (b)
-- 3. Monitorear el tamaño de índices vs beneficio con pg_stat_user_indexes
-- 4. Para escala extrema (10k+ usuarios), considerar particionamiento de tablas
-- 5. Tablas NO encontradas en BD.sql (omitidas): news, reels, communities,
--    community_members, community_posts, community_reactions
-- ============================================================================
