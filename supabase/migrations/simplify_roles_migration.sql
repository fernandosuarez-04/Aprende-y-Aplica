-- ============================================================================
-- MIGRACIÓN: Simplificar Modelo de Roles
-- ============================================================================
-- Problema: cargo_rol tiene 'Business' y 'Business User' lo cual causa confusión
--           cuando un usuario pertenece a múltiples organizaciones con diferentes roles.
--
-- Solución:
--   1. Eliminar 'Business User' de cargo_rol (usar organization_users.role para diferenciar)
--   2. Mover type_rol de users a organization_users.job_title
--   3. Cada usuario puede tener un cargo diferente por organización
-- ============================================================================

-- ============================================================================
-- PASO 1: Agregar columna job_title a organization_users
-- ============================================================================
-- Esta columna reemplaza users.type_rol, permitiendo cargos diferentes por organización

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'organization_users'
        AND column_name = 'job_title'
    ) THEN
        ALTER TABLE public.organization_users
        ADD COLUMN job_title TEXT;

        RAISE NOTICE '✅ Columna job_title agregada a organization_users';
    ELSE
        RAISE NOTICE '⏭️ Columna job_title ya existe en organization_users';
    END IF;
END $$;

-- ============================================================================
-- PASO 2: Migrar type_rol de users a organization_users.job_title
-- ============================================================================
-- Copia el valor de type_rol a job_title para todos los usuarios que pertenecen a organizaciones

UPDATE public.organization_users ou
SET job_title = u.type_rol
FROM public.users u
WHERE ou.user_id = u.id
  AND u.type_rol IS NOT NULL
  AND u.type_rol != ''
  AND ou.job_title IS NULL;

-- Mostrar cuántos registros fueron migrados
DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count
    FROM public.organization_users
    WHERE job_title IS NOT NULL AND job_title != '';

    RAISE NOTICE '✅ % registros migrados con job_title', migrated_count;
END $$;

-- ============================================================================
-- PASO 3: Actualizar cargo_rol de 'Business User' a 'Business'
-- ============================================================================
-- Ya no necesitamos diferenciar Business vs Business User en cargo_rol
-- La diferenciación se hace en organization_users.role (owner/admin/member)

UPDATE public.users
SET cargo_rol = 'Business'
WHERE cargo_rol = 'Business User';

-- Mostrar cuántos usuarios fueron actualizados
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM public.users
    WHERE cargo_rol = 'Business';

    RAISE NOTICE '✅ % usuarios ahora tienen cargo_rol = Business', updated_count;
END $$;

-- ============================================================================
-- PASO 4: Actualizar constraint de cargo_rol
-- ============================================================================
-- Eliminar 'Business User' de los valores permitidos

-- Primero eliminar el constraint existente si existe
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_cargo_rol_check;

-- Crear nuevo constraint sin 'Business User'
ALTER TABLE public.users
ADD CONSTRAINT users_cargo_rol_check
CHECK (cargo_rol IS NULL OR cargo_rol = ANY (ARRAY['Usuario', 'Instructor', 'Administrador', 'Business']));

RAISE NOTICE '✅ Constraint de cargo_rol actualizado (eliminado Business User)';

-- ============================================================================
-- PASO 5: Agregar índice para mejorar rendimiento de búsqueda por job_title
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_organization_users_job_title
ON public.organization_users(job_title)
WHERE job_title IS NOT NULL;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
DO $$
DECLARE
    business_user_count INTEGER;
    job_title_count INTEGER;
BEGIN
    -- Verificar que no queden usuarios con 'Business User'
    SELECT COUNT(*) INTO business_user_count
    FROM public.users
    WHERE cargo_rol = 'Business User';

    IF business_user_count > 0 THEN
        RAISE EXCEPTION '❌ ERROR: Aún hay % usuarios con cargo_rol = Business User', business_user_count;
    END IF;

    -- Contar job_titles migrados
    SELECT COUNT(*) INTO job_title_count
    FROM public.organization_users
    WHERE job_title IS NOT NULL AND job_title != '';

    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '============================================';
    RAISE NOTICE '- Usuarios con Business User: 0';
    RAISE NOTICE '- Job titles migrados: %', job_title_count;
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANTE: Después de verificar que todo funciona,';
    RAISE NOTICE 'ejecutar la migración de eliminación de type_rol.';
    RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- PASO 6: Eliminar columna type_rol de users
-- ============================================================================
-- La información ya fue migrada a organization_users.job_title

ALTER TABLE public.users DROP COLUMN IF EXISTS type_rol;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'type_rol'
    ) THEN
        RAISE NOTICE '✅ Columna type_rol eliminada de users';
    ELSE
        RAISE NOTICE '⚠️ La columna type_rol aún existe en users';
    END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN FINAL POST-ELIMINACIÓN
-- ============================================================================
DO $$
DECLARE
    type_rol_exists BOOLEAN;
    job_title_count INTEGER;
BEGIN
    -- Verificar que type_rol fue eliminada
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'type_rol'
    ) INTO type_rol_exists;

    -- Contar job_titles
    SELECT COUNT(*) INTO job_title_count
    FROM public.organization_users
    WHERE job_title IS NOT NULL AND job_title != '';

    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ MIGRACIÓN COMPLETA';
    RAISE NOTICE '============================================';
    RAISE NOTICE '- type_rol eliminada: %', CASE WHEN NOT type_rol_exists THEN 'SÍ' ELSE 'NO' END;
    RAISE NOTICE '- Job titles en organization_users: %', job_title_count;
    RAISE NOTICE '============================================';
END $$;
