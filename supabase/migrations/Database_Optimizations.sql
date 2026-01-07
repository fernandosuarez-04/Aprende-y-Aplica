-- ÍNDICES PARA OPTIMIZAR BÚSQUEDAS
-- Estos índices acelerarán significativamente las consultas que filtran por module_id y lesson_id,
-- que son muy frecuentes durante la actualización de lecciones y cálculo de duraciones.

CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson_id ON public.lesson_materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_activities_lesson_id ON public.lesson_activities(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON public.course_modules(course_id);

-- FUNCIONES Y TRIGGERS PARA CÁLCULO AUTOMÁTICO DE DURACIÓN
-- Al mover esta lógica a la base de datos, eliminamos múltiples viajes de red y lecturas pesadas
-- desde el backend, haciendo que la actualización de lecciones sea instantánea.

-- 1. Función para calcular la duración de un módulo
CREATE OR REPLACE FUNCTION public.calculate_module_duration(p_module_id uuid)
RETURNS void AS $$
DECLARE
    v_total_video_seconds integer;
    v_total_materials_minutes integer;
    v_total_activities_minutes integer;
    v_total_minutes integer;
    v_course_id uuid;
BEGIN
    -- Sumar duración de videos (segundos)
    SELECT COALESCE(SUM(duration_seconds), 0)
    INTO v_total_video_seconds
    FROM public.course_lessons
    WHERE module_id = p_module_id;

    -- Sumar duración estimada de materiales (minutos)
    SELECT COALESCE(SUM(m.estimated_time_minutes), 0)
    INTO v_total_materials_minutes
    FROM public.lesson_materials m
    JOIN public.course_lessons l ON m.lesson_id = l.lesson_id
    WHERE l.module_id = p_module_id;

    -- Sumar duración estimada de actividades (minutos)
    SELECT COALESCE(SUM(a.estimated_time_minutes), 0)
    INTO v_total_activities_minutes
    FROM public.lesson_activities a
    JOIN public.course_lessons l ON a.lesson_id = l.lesson_id
    WHERE l.module_id = p_module_id;

    -- Calcular total minutos (Video segundos / 60 + otros)
    v_total_minutes := ROUND(v_total_video_seconds / 60.0) + v_total_materials_minutes + v_total_activities_minutes;

    -- Actualizar Módulo
    UPDATE public.course_modules
    SET module_duration_minutes = v_total_minutes,
        updated_at = now()
    WHERE module_id = p_module_id
    RETURNING course_id INTO v_course_id;

    -- Actualizar Curso (Cascada)
    IF v_course_id IS NOT NULL THEN
        PERFORM public.calculate_course_duration(v_course_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para calcular la duración del curso
CREATE OR REPLACE FUNCTION public.calculate_course_duration(p_course_id uuid)
RETURNS void AS $$
DECLARE
    v_total_minutes integer;
BEGIN
    SELECT COALESCE(SUM(module_duration_minutes), 0)
    INTO v_total_minutes
    FROM public.course_modules
    WHERE course_id = p_course_id;

    UPDATE public.courses
    SET duration_total_minutes = v_total_minutes,
        updated_at = now()
    WHERE id = p_course_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger genérico para actualizar módulo cuando cambia la lección
CREATE OR REPLACE FUNCTION public.trigger_update_module_duration()
RETURNS TRIGGER AS $$
DECLARE
    v_module_id uuid;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_module_id := OLD.module_id;
    ELSE
        v_module_id := NEW.module_id;
    END IF;

    IF v_module_id IS NOT NULL THEN
        PERFORM public.calculate_module_duration(v_module_id);
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger genérico para actualizar módulo cuando cambian materiales/actividades
CREATE OR REPLACE FUNCTION public.trigger_update_module_duration_from_child()
RETURNS TRIGGER AS $$
DECLARE
    v_module_id uuid;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        SELECT module_id INTO v_module_id FROM public.course_lessons WHERE lesson_id = OLD.lesson_id;
    ELSE
        SELECT module_id INTO v_module_id FROM public.course_lessons WHERE lesson_id = NEW.lesson_id;
    END IF;

    IF v_module_id IS NOT NULL THEN
        PERFORM public.calculate_module_duration(v_module_id);
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- APLICAR TRIGGERS

-- Trigger en course_lessons (duración video o cambio de módulo)
DROP TRIGGER IF EXISTS trg_update_duration_lessons ON public.course_lessons;
CREATE TRIGGER trg_update_duration_lessons
AFTER INSERT OR UPDATE OF duration_seconds, module_id OR DELETE ON public.course_lessons
FOR EACH ROW EXECUTE FUNCTION public.trigger_update_module_duration();

-- Trigger en lesson_materials
DROP TRIGGER IF EXISTS trg_update_duration_materials ON public.lesson_materials;
CREATE TRIGGER trg_update_duration_materials
AFTER INSERT OR UPDATE OF estimated_time_minutes OR DELETE ON public.lesson_materials
FOR EACH ROW EXECUTE FUNCTION public.trigger_update_module_duration_from_child();

-- Trigger en lesson_activities
DROP TRIGGER IF EXISTS trg_update_duration_activities ON public.lesson_activities;
CREATE TRIGGER trg_update_duration_activities
AFTER INSERT OR UPDATE OF estimated_time_minutes OR DELETE ON public.lesson_activities
FOR EACH ROW EXECUTE FUNCTION public.trigger_update_module_duration_from_child();
