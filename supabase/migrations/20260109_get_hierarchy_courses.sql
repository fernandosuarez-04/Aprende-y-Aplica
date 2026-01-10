-- Función para obtener cursos y progreso por entidad de jerarquía
-- Basado en el esquema de Database.sql

CREATE OR REPLACE FUNCTION get_hierarchy_courses(
    p_entity_type text,
    p_entity_id uuid
)
RETURNS TABLE (
    id uuid,
    title text,
    thumbnail_url text,
    category text,
    enrolled_count bigint,
    avg_progress numeric,
    status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH target_users AS (
        SELECT user_id
        FROM organization_users
        WHERE
            CASE
                WHEN p_entity_type = 'region' THEN region_id = p_entity_id
                WHEN p_entity_type = 'zone' THEN zone_id = p_entity_id
                WHEN p_entity_type = 'team' THEN team_id = p_entity_id
            END
    ),
    course_stats AS (
        SELECT
            e.course_id,
            COUNT(DISTINCT e.user_id) as enrolled_count,
            COALESCE(AVG(e.overall_progress_percentage), 0) as avg_progress
        FROM user_course_enrollments e
        JOIN target_users u ON e.user_id = u.user_id
        WHERE e.enrollment_status IN ('active', 'completed', 'in_progress')
        GROUP BY e.course_id
    )
    SELECT
        c.id,
        c.title::text,
        c.thumbnail_url::text,
        c.category::text,
        cs.enrolled_count,
        ROUND(cs.avg_progress, 2) as avg_progress,
        CASE 
            WHEN cs.avg_progress >= 100 THEN 'Completado'
            WHEN cs.avg_progress > 0 THEN 'En curso'
            ELSE 'No iniciado'
        END::text as status
    FROM courses c
    JOIN course_stats cs ON c.id = cs.course_id;
END;
$$;
