DO $$
DECLARE
    r RECORD;
    v_total_seconds INTEGER;
    v_total_minutes INTEGER;
BEGIN
    -- Recorrer todas las lecciones
    FOR r IN SELECT lesson_id, duration_seconds FROM public.course_lessons LOOP
        
        -- 1. Calcular tiempo de materiales (estimado 10 mins c/u)
        SELECT COALESCE(SUM(10 * 60), 0) INTO v_total_seconds
        FROM public.lesson_materials
        WHERE lesson_id = r.lesson_id;

        -- 2. Sumar tiempo de actividades (estimado 15 mins c/u)
        v_total_seconds := v_total_seconds + (
            SELECT COALESCE(SUM(15 * 60), 0)
            FROM public.lesson_activities
            WHERE lesson_id = r.lesson_id
        );

        -- 3. Sumar duración del video original
        v_total_seconds := v_total_seconds + COALESCE(r.duration_seconds, 0);

        -- 4. Convertir a minutos (redondeando hacia arriba)
        v_total_minutes := CEIL(v_total_seconds / 60.0);

        -- 5. Actualizar la lección
        UPDATE public.course_lessons
        SET total_duration_minutes = v_total_minutes
        WHERE lesson_id = r.lesson_id;
        
    END LOOP;
    
    RAISE NOTICE 'Actualización de duraciones completada exitosamente.';
END $$;
