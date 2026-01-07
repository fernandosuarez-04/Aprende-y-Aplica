-- ============================================================
-- SCRIPT DE LIMPIEZA DE REDUNDANCIAS - BASE DE DATOS SOFIA
-- Fecha: 2025-12-18
-- ============================================================
-- IMPORTANTE: Este script debe ejecutarse con precaución.
-- Se recomienda hacer un backup completo antes de ejecutar.
-- ============================================================

-- ============================================================
-- PARTE 1: ELIMINAR COLUMNAS REDUNDANTES DE LA TABLA USERS
-- ============================================================

-- 1.1 Eliminar columnas de CV, portafolio y redes sociales que ya no se usan
ALTER TABLE public.users 
    DROP COLUMN IF EXISTS curriculum_url,
    DROP COLUMN IF EXISTS linkedin_url,
    DROP COLUMN IF EXISTS github_url,
    DROP COLUMN IF EXISTS website_url;

-- 1.2 Eliminar columna de puntos (ya no se usa el sistema de gamificación)
ALTER TABLE public.users 
    DROP COLUMN IF EXISTS points;

-- 1.3 Eliminar columnas de visibilidad de perfil y actividad
ALTER TABLE public.users 
    DROP COLUMN IF EXISTS profile_visibility,
    DROP COLUMN IF EXISTS show_activity,
    DROP COLUMN IF EXISTS show_email;

-- 1.4 Eliminar columna role_zoom (no se usa)
ALTER TABLE public.users 
    DROP COLUMN IF EXISTS role_zoom;

-- 1.5 IMPORTANTE: Eliminar organization_id de users 
-- (es redundante porque ya existe organization_users que maneja esta relación)
-- Primero eliminamos la constraint de foreign key
ALTER TABLE public.users 
    DROP CONSTRAINT IF EXISTS users_organization_id_fkey;

ALTER TABLE public.users 
    DROP COLUMN IF EXISTS organization_id;

-- ============================================================
-- PARTE 2: ELIMINAR TABLAS COMPLETAMENTE REDUNDANTES
-- ============================================================

-- 2.1 Tablas de AI Prompts y relacionadas (ya eliminadas por el usuario, pero por si acaso)
DROP TABLE IF EXISTS public.prompt_ratings CASCADE;
DROP TABLE IF EXISTS public.prompt_favorites CASCADE;
DROP TABLE IF EXISTS public.ai_prompts CASCADE;

-- 2.2 Tablas de App Directory (relacionadas con AI apps)
DROP TABLE IF EXISTS public.app_ratings CASCADE;
DROP TABLE IF EXISTS public.app_favorites CASCADE;
DROP TABLE IF EXISTS public.app_directory_translations CASCADE;

-- 2.3 Tablas de Comunidades y Posts (ya eliminadas por el usuario)
DROP TABLE IF EXISTS public.community_reactions CASCADE;
DROP TABLE IF EXISTS public.community_post_reports CASCADE;
DROP TABLE IF EXISTS public.community_comments CASCADE;
DROP TABLE IF EXISTS public.community_posts CASCADE;
DROP TABLE IF EXISTS public.community_videos CASCADE;
DROP TABLE IF EXISTS public.community_members CASCADE;
DROP TABLE IF EXISTS public.community_access_requests CASCADE;
DROP TABLE IF EXISTS public.community_creation_requests CASCADE;
DROP TABLE IF EXISTS public.communities CASCADE;

-- 2.4 Tablas de Reels (ya eliminadas por el usuario)
DROP TABLE IF EXISTS public.reel_comment_replies CASCADE;
DROP TABLE IF EXISTS public.reel_comments CASCADE;
DROP TABLE IF EXISTS public.reel_views CASCADE;
DROP TABLE IF EXISTS public.reel_shares CASCADE;
DROP TABLE IF EXISTS public.reel_likes CASCADE;
DROP TABLE IF EXISTS public.reel_hashtag_relations CASCADE;
DROP TABLE IF EXISTS public.reel_hashtags CASCADE;
DROP TABLE IF EXISTS public.reels CASCADE;

-- 2.5 Tablas de Skills (ya eliminadas por el usuario)
DROP TABLE IF EXISTS public.user_skills CASCADE;
DROP TABLE IF EXISTS public.skill_badges CASCADE;
DROP TABLE IF EXISTS public.course_skills CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.skill_categories CASCADE;

-- 2.6 Tablas de Learning Routes (ya eliminadas por el usuario)
DROP TABLE IF EXISTS public.learning_route_courses CASCADE;
DROP TABLE IF EXISTS public.learning_routes CASCADE;

-- 2.7 Tabla de Cupones y compras individuales
DROP TABLE IF EXISTS public.course_purchases CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;

-- 2.8 Tabla de News (ya eliminada por el usuario)
DROP TABLE IF EXISTS public.news CASCADE;

-- 2.9 Tablas de User Groups y User Favorites (ya eliminadas por el usuario)
DROP TABLE IF EXISTS public.user_group_members CASCADE;
DROP TABLE IF EXISTS public.user_groups CASCADE;
DROP TABLE IF EXISTS public.user_favorites CASCADE;

-- ============================================================
-- PARTE 3: LIMPIAR REFERENCIAS HUÉRFANAS
-- ============================================================

-- 3.1 Eliminar FK de study_plans hacia learning_routes (si existe)
ALTER TABLE public.study_plans 
    DROP CONSTRAINT IF EXISTS study_plans_learning_route_id_fkey;

ALTER TABLE public.study_plans 
    DROP COLUMN IF EXISTS learning_route_id;

-- 3.2 Eliminar FK de organization_course_purchases hacia coupons (si se mantiene la tabla)
-- (solo si la tabla organization_course_purchases sigue existiendo)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'organization_course_purchases'
    ) THEN
        ALTER TABLE public.organization_course_purchases 
            DROP CONSTRAINT IF EXISTS organization_course_purchases_coupon_id_fkey;
        
        ALTER TABLE public.organization_course_purchases 
            DROP COLUMN IF EXISTS coupon_id;
    END IF;
END $$;

-- ============================================================
-- PARTE 4: LIMPIAR COLUMNAS REDUNDANTES EN OTRAS TABLAS
-- ============================================================

-- 4.1 En community_posts hay duplicación de contadores
-- Mantener solo: comment_count, reaction_count, views_count
-- Eliminar: likes_count, comments_count (están duplicados)
-- NOTA: Esta tabla ya se eliminó, pero si se mantiene:
-- ALTER TABLE public.community_posts 
--     DROP COLUMN IF EXISTS likes_count,
--     DROP COLUMN IF EXISTS comments_count;

-- ============================================================
-- PARTE 5: CREAR ÍNDICES OPTIMIZADOS (OPCIONAL)
-- ============================================================

-- 5.1 Índice para búsquedas frecuentes de usuarios por organización
-- (Ahora solo usando organization_users)
CREATE INDEX IF NOT EXISTS idx_organization_users_org_user 
    ON public.organization_users(organization_id, user_id);

CREATE INDEX IF NOT EXISTS idx_organization_users_user_id 
    ON public.organization_users(user_id);

-- 5.2 Índice para búsquedas de usuarios activos
CREATE INDEX IF NOT EXISTS idx_users_email_active 
    ON public.users(email) 
    WHERE is_banned = false;

-- ============================================================
-- PARTE 6: ACTUALIZAR VISTAS O FUNCIONES QUE DEPENDÍAN DE COLUMNAS ELIMINADAS
-- ============================================================

-- Nota: Si hay funciones o vistas que dependían de las columnas eliminadas,
-- necesitarán ser actualizadas manualmente en el código de la aplicación.

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
