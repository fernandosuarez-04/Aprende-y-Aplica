-- =====================================================
-- SCRIPT DE RESTAURACIÓN DE ELEMENTOS FALTANTES
-- =====================================================
-- Este script restaura los elementos que faltan en la nueva
-- base de datos (Database.sql) comparado con la antigua (BD.sql)
--
-- Ejecutar en orden:
-- 1. Secuencias
-- 2. Funciones
-- 3. Tablas
-- 4. Foreign Keys
-- =====================================================

-- =====================================================
-- PARTE 1: CREAR SECUENCIA FALTANTE
-- =====================================================

-- Secuencia para certificate_ledger.block_id
-- (puede que ya exista, usar IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'certificate_ledger_block_id_seq') THEN
        CREATE SEQUENCE public.certificate_ledger_block_id_seq
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
        RAISE NOTICE 'Secuencia certificate_ledger_block_id_seq creada.';
    ELSE
        RAISE NOTICE 'Secuencia certificate_ledger_block_id_seq ya existe.';
    END IF;
END $$;

-- =====================================================
-- PARTE 2: CREAR FUNCIÓN FALTANTE
-- =====================================================

-- Función para generar hash inmutable de certificados
CREATE OR REPLACE FUNCTION public.certificate_hash_immutable(
    p_user_id uuid,
    p_course_id uuid,
    p_enrollment_id uuid,
    p_certificate_id uuid,
    p_issued_at timestamp with time zone,
    p_certificate_url text
) RETURNS character(64)
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    hash_input text;
    result_hash character(64);
BEGIN
    -- Concatenar todos los campos para crear el hash
    hash_input := COALESCE(p_user_id::text, '') ||
                  COALESCE(p_course_id::text, '') ||
                  COALESCE(p_enrollment_id::text, '') ||
                  COALESCE(p_certificate_id::text, '') ||
                  COALESCE(p_issued_at::text, '') ||
                  COALESCE(p_certificate_url, '');

    -- Generar SHA-256 hash
    result_hash := encode(digest(hash_input, 'sha256'), 'hex');

    RETURN result_hash;
END;
$$;

COMMENT ON FUNCTION public.certificate_hash_immutable IS 'Genera un hash SHA-256 único e inmutable para certificados de cursos';

-- =====================================================
-- PARTE 3: CREAR TABLA FALTANTE
-- =====================================================

-- Tabla: user_course_certificates
-- Esta tabla almacena los certificados generados para usuarios que completan cursos
CREATE TABLE IF NOT EXISTS public.user_course_certificates (
    certificate_id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    course_id uuid NOT NULL,
    enrollment_id uuid NOT NULL,
    certificate_url text NOT NULL,
    issued_at timestamp with time zone NOT NULL DEFAULT now(),
    expires_at timestamp with time zone,
    certificate_hash character(64),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    template_id uuid,

    -- Constraints
    CONSTRAINT user_course_certificates_pkey PRIMARY KEY (certificate_id),
    CONSTRAINT user_course_certificates_certificate_url_check CHECK (length(btrim(certificate_url)) > 0),
    CONSTRAINT user_course_certificates_certificate_hash_key UNIQUE (certificate_hash)
);

-- Comentario de la tabla
COMMENT ON TABLE public.user_course_certificates IS 'Certificados de cursos emitidos a usuarios';

-- =====================================================
-- PARTE 4: CREAR FOREIGN KEYS FALTANTES
-- =====================================================

-- 4.1 FK de user_course_certificates -> users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_course_certificates_user_id_fkey'
        AND table_name = 'user_course_certificates'
    ) THEN
        ALTER TABLE public.user_course_certificates
        ADD CONSTRAINT user_course_certificates_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(id);
        RAISE NOTICE 'FK user_course_certificates_user_id_fkey creada.';
    ELSE
        RAISE NOTICE 'FK user_course_certificates_user_id_fkey ya existe.';
    END IF;
END $$;

-- 4.2 FK de user_course_certificates -> courses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_course_certificates_course_id_fkey'
        AND table_name = 'user_course_certificates'
    ) THEN
        ALTER TABLE public.user_course_certificates
        ADD CONSTRAINT user_course_certificates_course_id_fkey
        FOREIGN KEY (course_id) REFERENCES public.courses(id);
        RAISE NOTICE 'FK user_course_certificates_course_id_fkey creada.';
    ELSE
        RAISE NOTICE 'FK user_course_certificates_course_id_fkey ya existe.';
    END IF;
END $$;

-- 4.3 FK de user_course_certificates -> user_course_enrollments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_course_certificates_enrollment_id_fkey'
        AND table_name = 'user_course_certificates'
    ) THEN
        ALTER TABLE public.user_course_certificates
        ADD CONSTRAINT user_course_certificates_enrollment_id_fkey
        FOREIGN KEY (enrollment_id) REFERENCES public.user_course_enrollments(enrollment_id);
        RAISE NOTICE 'FK user_course_certificates_enrollment_id_fkey creada.';
    ELSE
        RAISE NOTICE 'FK user_course_certificates_enrollment_id_fkey ya existe.';
    END IF;
END $$;

-- 4.4 FK de user_course_certificates -> certificate_templates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_course_certificates_template_id_fkey'
        AND table_name = 'user_course_certificates'
    ) THEN
        ALTER TABLE public.user_course_certificates
        ADD CONSTRAINT user_course_certificates_template_id_fkey
        FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id);
        RAISE NOTICE 'FK user_course_certificates_template_id_fkey creada.';
    ELSE
        RAISE NOTICE 'FK user_course_certificates_template_id_fkey ya existe.';
    END IF;
END $$;

-- 4.5 FK de certificate_ledger -> user_course_certificates
-- NOTA: Solo crear esta FK si no hay datos huérfanos en certificate_ledger
DO $$
DECLARE
    v_orphan_count integer;
    r RECORD;
BEGIN
    -- Primero verificar si hay cert_ids en certificate_ledger que no existen en user_course_certificates
    SELECT COUNT(*) INTO v_orphan_count
    FROM public.certificate_ledger cl
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_course_certificates ucc
        WHERE ucc.certificate_id = cl.cert_id
    );

    IF v_orphan_count > 0 THEN
        RAISE WARNING '⚠️ Hay % registros en certificate_ledger con cert_id huérfanos.', v_orphan_count;
        RAISE WARNING 'Los cert_ids huérfanos son:';

        -- Mostrar los IDs huérfanos
        FOR r IN (
            SELECT DISTINCT cl.cert_id
            FROM public.certificate_ledger cl
            WHERE NOT EXISTS (
                SELECT 1 FROM public.user_course_certificates ucc
                WHERE ucc.certificate_id = cl.cert_id
            )
            LIMIT 10
        ) LOOP
            RAISE WARNING '  - %', r.cert_id;
        END LOOP;

        RAISE WARNING '';
        RAISE WARNING 'OPCIONES:';
        RAISE WARNING '1. Restaurar los datos de user_course_certificates desde un backup';
        RAISE WARNING '2. Eliminar los registros huérfanos: DELETE FROM certificate_ledger WHERE cert_id NOT IN (SELECT certificate_id FROM user_course_certificates);';
        RAISE WARNING '3. NO crear la FK (la tabla funcionará pero sin integridad referencial)';
        RAISE WARNING '';
        RAISE WARNING 'FK certificate_ledger_cert_id_fkey NO creada debido a datos huérfanos.';
    ELSE
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'certificate_ledger_cert_id_fkey'
            AND table_name = 'certificate_ledger'
        ) THEN
            ALTER TABLE public.certificate_ledger
            ADD CONSTRAINT certificate_ledger_cert_id_fkey
            FOREIGN KEY (cert_id) REFERENCES public.user_course_certificates(certificate_id);
            RAISE NOTICE '✓ FK certificate_ledger_cert_id_fkey creada.';
        ELSE
            RAISE NOTICE '✓ FK certificate_ledger_cert_id_fkey ya existe.';
        END IF;
    END IF;
END $$;

-- 4.6 FK de user_quiz_submissions -> user_course_enrollments (FALTABA en nuevo)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_quiz_submissions_enrollment_id_fkey'
        AND table_name = 'user_quiz_submissions'
    ) THEN
        ALTER TABLE public.user_quiz_submissions
        ADD CONSTRAINT user_quiz_submissions_enrollment_id_fkey
        FOREIGN KEY (enrollment_id) REFERENCES public.user_course_enrollments(enrollment_id);
        RAISE NOTICE 'FK user_quiz_submissions_enrollment_id_fkey creada.';
    ELSE
        RAISE NOTICE 'FK user_quiz_submissions_enrollment_id_fkey ya existe.';
    END IF;
END $$;

-- =====================================================
-- PARTE 5: CREAR ÍNDICES RECOMENDADOS
-- =====================================================

-- Índices para user_course_certificates (mejoran rendimiento de consultas)
CREATE INDEX IF NOT EXISTS idx_user_course_certificates_user_id
ON public.user_course_certificates(user_id);

CREATE INDEX IF NOT EXISTS idx_user_course_certificates_course_id
ON public.user_course_certificates(course_id);

CREATE INDEX IF NOT EXISTS idx_user_course_certificates_enrollment_id
ON public.user_course_certificates(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_user_course_certificates_issued_at
ON public.user_course_certificates(issued_at);

-- =====================================================
-- PARTE 6: VERIFICACIÓN
-- =====================================================

-- Verificar que todo se creó correctamente
DO $$
DECLARE
    v_table_exists boolean;
    v_fk_count integer;
BEGIN
    -- Verificar tabla
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'user_course_certificates'
    ) INTO v_table_exists;

    IF v_table_exists THEN
        RAISE NOTICE '✓ Tabla user_course_certificates existe.';
    ELSE
        RAISE WARNING '✗ Tabla user_course_certificates NO existe.';
    END IF;

    -- Contar FKs de la tabla
    SELECT COUNT(*) INTO v_fk_count
    FROM information_schema.table_constraints
    WHERE table_name = 'user_course_certificates'
    AND constraint_type = 'FOREIGN KEY';

    RAISE NOTICE '✓ user_course_certificates tiene % foreign keys.', v_fk_count;

    -- Verificar FK en certificate_ledger
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'certificate_ledger_cert_id_fkey'
    ) THEN
        RAISE NOTICE '✓ FK certificate_ledger_cert_id_fkey existe.';
    ELSE
        RAISE WARNING '✗ FK certificate_ledger_cert_id_fkey NO existe.';
    END IF;

    -- Verificar FK en user_quiz_submissions
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_quiz_submissions_enrollment_id_fkey'
    ) THEN
        RAISE NOTICE '✓ FK user_quiz_submissions_enrollment_id_fkey existe.';
    ELSE
        RAISE WARNING '✗ FK user_quiz_submissions_enrollment_id_fkey NO existe.';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESTAURACIÓN COMPLETADA';
    RAISE NOTICE '========================================';
END $$;
