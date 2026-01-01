-- ============================================================================
-- VISTAS PARA ANALÍTICAS DE LIA
-- Fecha: 2025-01-01
-- Descripción: Vistas materializadas (o normales) para reportes de admin
-- ============================================================================

-- 1. Vista de Analíticas por Conversación
-- Agrega métricas calculadas como duración, costo total, total de tokens, etc.
DROP VIEW IF EXISTS public.lia_course_analytics CASCADE;
DROP VIEW IF EXISTS public.lia_activity_performance CASCADE;
DROP VIEW IF EXISTS public.lia_conversation_analytics CASCADE;

CREATE OR REPLACE VIEW public.lia_conversation_analytics AS
SELECT 
    lc.conversation_id,
    lc.user_id,
    u.email as user_email,
    COALESCE(u.display_name, u.first_name || ' ' || u.last_name, u.username) as user_name,
    u.profile_picture_url as user_avatar,
    lc.context_type,
    lc.course_id,
    c.title as course_title,
    lc.module_id,
    cm.module_title as module_title,
    lc.lesson_id,
    cl.lesson_title as lesson_title,
    lc.started_at,
    lc.ended_at,
    lc.duration_seconds,
    lc.total_messages,
    lc.total_user_messages,
    lc.total_lia_messages,
    lc.user_abandoned,
    lc.conversation_completed,
    -- Métricas agregadas de mensajes
    COALESCE(SUM(lm.tokens_used), 0) as total_tokens,
    COALESCE(SUM(lm.cost_usd), 0) as total_cost_usd,
    AVG(lm.response_time_ms) as avg_response_time_ms,
    -- Conteo de modelos usados (el más frecuente)
    mode() WITHIN GROUP (ORDER BY lm.model_used) as primary_model
FROM 
    public.lia_conversations lc
LEFT JOIN 
    public.users u ON lc.user_id = u.id
LEFT JOIN 
    public.courses c ON lc.course_id = c.id
LEFT JOIN 
    public.course_modules cm ON lc.module_id = cm.module_id
LEFT JOIN 
    public.course_lessons cl ON lc.lesson_id = cl.lesson_id
LEFT JOIN 
    public.lia_messages lm ON lc.conversation_id = lm.conversation_id
GROUP BY 
    lc.conversation_id, lc.user_id, u.email, u.display_name, u.first_name, u.last_name, u.username, u.profile_picture_url, lc.context_type, 
    lc.course_id, c.title, lc.module_id, cm.module_title, lc.lesson_id, cl.lesson_title, 
    lc.started_at, lc.ended_at;

-- 2. Vista de Analíticas por Curso (Engagement)
-- Agrupa interacciones por curso, módulo y lección para ver dónde interactúan más los usuarios
CREATE OR REPLACE VIEW public.lia_course_analytics AS
SELECT 
    lc.course_id,
    c.title as course_title,
    lc.module_id,
    cm.module_title as module_title,
    lc.lesson_id,
    cl.lesson_title as lesson_title,
    COUNT(DISTINCT lc.conversation_id) as total_conversations,
    COUNT(DISTINCT lc.user_id) as unique_users,
    SUM(lc.total_messages) as total_messages,
    AVG(lc.duration_seconds) as avg_duration_seconds,
    SUM(agg.total_tokens) as total_tokens_consumed,
    SUM(agg.total_cost_usd) as total_cost_usd
FROM 
    public.lia_conversations lc
JOIN 
    public.lia_conversation_analytics agg ON lc.conversation_id = agg.conversation_id
LEFT JOIN 
    public.courses c ON lc.course_id = c.id
LEFT JOIN 
    public.course_modules cm ON lc.module_id = cm.module_id
LEFT JOIN 
    public.course_lessons cl ON lc.lesson_id = cl.lesson_id
WHERE 
    lc.context_type = 'course' AND lc.course_id IS NOT NULL
GROUP BY 
    lc.course_id, c.title, lc.module_id, cm.module_title, lc.lesson_id, cl.lesson_title;

-- 3. Vista de Rendimiento de Actividades
-- Analiza cómo les va a los usuarios en las actividades guiadas por LIA
CREATE OR REPLACE VIEW public.lia_activity_performance AS
SELECT 
    lac.activity_id,
    la.activity_title as activity_title,
    la.activity_type as activity_type,
    lc.course_id,
    c.title as course_title,
    COUNT(DISTINCT lac.completion_id) as total_attempts,
    COUNT(DISTINCT lac.user_id) as unique_users,
    SUM(CASE WHEN lac.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
    ROUND(SUM(CASE WHEN lac.status = 'completed' THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100, 2) as completion_rate_percentage,
    AVG(lac.time_to_complete_seconds) as avg_time_seconds,
    AVG(lac.attempts_to_complete) as avg_attempts,
    SUM(CASE WHEN lac.user_needed_help THEN 1 ELSE 0 END) as help_needed_count
FROM 
    public.lia_activity_completions lac
LEFT JOIN 
    public.lesson_activities la ON lac.activity_id = la.activity_id
LEFT JOIN 
    public.lia_conversations lc ON lac.conversation_id = lc.conversation_id
LEFT JOIN 
    public.courses c ON lc.course_id = c.id
GROUP BY 
    lac.activity_id, la.activity_title, la.activity_type, lc.course_id, c.title;

-- Permisos (Ajustar según roles de Supabase)
ALTER VIEW public.lia_conversation_analytics OWNER TO postgres;
ALTER VIEW public.lia_course_analytics OWNER TO postgres;
ALTER VIEW public.lia_activity_performance OWNER TO postgres;

GRANT SELECT ON public.lia_conversation_analytics TO authenticated;
GRANT SELECT ON public.lia_conversation_analytics TO service_role;

GRANT SELECT ON public.lia_course_analytics TO authenticated;
GRANT SELECT ON public.lia_course_analytics TO service_role;

GRANT SELECT ON public.lia_activity_performance TO authenticated;
GRANT SELECT ON public.lia_activity_performance TO service_role;
