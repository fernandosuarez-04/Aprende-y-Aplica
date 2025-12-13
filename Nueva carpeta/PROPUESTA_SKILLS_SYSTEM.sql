-- =====================================================
-- PROPUESTA: Sistema de Skills para Cursos y Usuarios
-- =====================================================
-- Este archivo contiene la propuesta de tablas para implementar
-- un sistema de skills que se aprenden en los cursos y se muestran
-- en el perfil del usuario cuando completa un curso.

-- =====================================================
-- 1. TABLA: skills
-- =====================================================
-- Define todas las skills disponibles en la plataforma
-- Cada skill tiene un nombre, descripción, icono/logo, y categoría
CREATE TABLE public.skills (
  skill_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  description text,
  category character varying NOT NULL DEFAULT 'general'::character varying CHECK (
    category::text = ANY (
      ARRAY[
        'general'::character varying::text,
        'programming'::character varying::text,
        'design'::character varying::text,
        'marketing'::character varying::text,
        'business'::character varying::text,
        'data'::character varying::text,
        'ai'::character varying::text,
        'cloud'::character varying::text,
        'security'::character varying::text,
        'devops'::character varying::text,
        'leadership'::character varying::text,
        'communication'::character varying::text,
        'other'::character varying::text
      ]
    )
  ),
  icon_url text,
  icon_type character varying DEFAULT 'image'::character varying CHECK (
    icon_type::text = ANY (
      ARRAY['image'::character varying::text, 'svg'::character varying::text, 'emoji'::character varying::text, 'font_icon'::character varying::text]
    )
  ),
  icon_name character varying, -- Para iconos de fuentes (ej: 'react', 'python', 'javascript')
  color character varying DEFAULT '#3b82f6'::character varying, -- Color hexadecimal para el badge
  level character varying DEFAULT 'beginner'::character varying CHECK (
    level::text = ANY (
      ARRAY['beginner'::character varying::text, 'intermediate'::character varying::text, 'advanced'::character varying::text, 'expert'::character varying::text]
    )
  ),
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT skills_pkey PRIMARY KEY (skill_id)
);

-- Índices para búsqueda rápida
CREATE INDEX idx_skills_category ON public.skills(category);
CREATE INDEX idx_skills_is_active ON public.skills(is_active);
CREATE INDEX idx_skills_slug ON public.skills(slug);

-- =====================================================
-- 2. TABLA: course_skills
-- =====================================================
-- Relación muchos a muchos entre cursos y skills
-- Define qué skills se aprenden en cada curso
CREATE TABLE public.course_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  is_primary boolean DEFAULT false, -- Skill principal del curso
  is_required boolean DEFAULT true, -- Si es requerida para completar el curso
  proficiency_level character varying DEFAULT 'beginner'::character varying CHECK (
    proficiency_level::text = ANY (
      ARRAY['beginner'::character varying::text, 'intermediate'::character varying::text, 'advanced'::character varying::text]
    )
  ),
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT course_skills_pkey PRIMARY KEY (id),
  CONSTRAINT course_skills_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
  CONSTRAINT course_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON DELETE CASCADE,
  CONSTRAINT course_skills_unique UNIQUE (course_id, skill_id)
);

-- Índices para consultas eficientes
CREATE INDEX idx_course_skills_course_id ON public.course_skills(course_id);
CREATE INDEX idx_course_skills_skill_id ON public.course_skills(skill_id);
CREATE INDEX idx_course_skills_is_primary ON public.course_skills(is_primary);

-- =====================================================
-- 3. TABLA: user_skills
-- =====================================================
-- Skills que el usuario ha obtenido al completar cursos
-- Se crea automáticamente cuando el usuario completa un curso
CREATE TABLE public.user_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  course_id uuid, -- Curso que le otorgó esta skill
  enrollment_id uuid, -- Enroll específico que completó
  proficiency_level character varying DEFAULT 'beginner'::character varying CHECK (
    proficiency_level::text = ANY (
      ARRAY['beginner'::character varying::text, 'intermediate'::character varying::text, 'advanced'::character varying::text, 'expert'::character varying::text]
    )
  ),
  obtained_at timestamp with time zone NOT NULL DEFAULT now(), -- Fecha en que obtuvo la skill
  verified boolean DEFAULT true, -- Si fue verificada al completar el curso
  verified_by uuid, -- Usuario o sistema que verificó
  is_displayed boolean DEFAULT true, -- Si se muestra en el perfil
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_skills_pkey PRIMARY KEY (id),
  CONSTRAINT user_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT user_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON DELETE CASCADE,
  CONSTRAINT user_skills_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL,
  CONSTRAINT user_skills_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.user_course_enrollments(enrollment_id) ON DELETE SET NULL,
  CONSTRAINT user_skills_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT user_skills_unique UNIQUE (user_id, skill_id, course_id) -- Un usuario puede tener la misma skill de múltiples cursos, pero solo una entrada por curso
);

-- Índices para consultas rápidas
CREATE INDEX idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON public.user_skills(skill_id);
CREATE INDEX idx_user_skills_course_id ON public.user_skills(course_id);
CREATE INDEX idx_user_skills_is_displayed ON public.user_skills(is_displayed);
CREATE INDEX idx_user_skills_obtained_at ON public.user_skills(obtained_at);

-- =====================================================
-- 4. TABLA: skill_categories (OPCIONAL)
-- =====================================================
-- Categorías de skills para mejor organización
-- Si prefieres tener categorías más estructuradas
CREATE TABLE public.skill_categories (
  category_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  description text,
  icon_url text,
  color character varying DEFAULT '#3b82f6'::character varying,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT skill_categories_pkey PRIMARY KEY (category_id)
);

-- =====================================================
-- 5. FUNCIÓN: Asignar skills al completar curso
-- =====================================================
-- Función que se ejecuta automáticamente cuando un usuario
-- completa un curso, asignando las skills asociadas
CREATE OR REPLACE FUNCTION public.assign_skills_on_course_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo ejecutar cuando el enrollment cambia a 'completed'
  IF NEW.enrollment_status = 'completed' AND 
     (OLD.enrollment_status IS NULL OR OLD.enrollment_status != 'completed') AND
     NEW.completed_at IS NOT NULL THEN
    
    -- Insertar skills del curso en user_skills
    INSERT INTO public.user_skills (
      user_id,
      skill_id,
      course_id,
      enrollment_id,
      proficiency_level,
      verified,
      verified_by,
      obtained_at
    )
    SELECT 
      NEW.user_id,
      cs.skill_id,
      NEW.course_id,
      NEW.enrollment_id,
      cs.proficiency_level,
      true, -- Verificado automáticamente al completar
      NULL, -- Sistema
      NEW.completed_at
    FROM public.course_skills cs
    WHERE cs.course_id = NEW.course_id
      AND cs.is_required = true
      AND NOT EXISTS (
        -- Evitar duplicados si el usuario ya tiene la skill de otro curso
        SELECT 1 
        FROM public.user_skills us
        WHERE us.user_id = NEW.user_id
          AND us.skill_id = cs.skill_id
          AND us.course_id = NEW.course_id
      );
    
    -- Si el usuario ya tiene la skill de otro curso, actualizar el nivel de proficiencia
    -- si el nuevo curso tiene un nivel más alto
    UPDATE public.user_skills us
    SET 
      proficiency_level = GREATEST(
        us.proficiency_level::text,
        cs.proficiency_level::text
      )::character varying,
      updated_at = now()
    FROM public.course_skills cs
    WHERE us.user_id = NEW.user_id
      AND us.skill_id = cs.skill_id
      AND cs.course_id = NEW.course_id
      AND cs.proficiency_level::text > us.proficiency_level::text
      AND us.course_id != NEW.course_id; -- Solo si es de otro curso
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la función automáticamente
CREATE TRIGGER trigger_assign_skills_on_completion
  AFTER UPDATE ON public.user_course_enrollments
  FOR EACH ROW
  WHEN (NEW.enrollment_status = 'completed' AND 
        (OLD.enrollment_status IS NULL OR OLD.enrollment_status != 'completed'))
  EXECUTE FUNCTION public.assign_skills_on_course_completion();

-- =====================================================
-- 6. FUNCIÓN: Obtener skills de un usuario
-- =====================================================
-- Función helper para obtener todas las skills de un usuario
-- con información detallada
CREATE OR REPLACE FUNCTION public.get_user_skills(p_user_id uuid)
RETURNS TABLE (
  skill_id uuid,
  skill_name character varying,
  skill_slug character varying,
  skill_description text,
  skill_category character varying,
  icon_url text,
  icon_type character varying,
  icon_name character varying,
  color character varying,
  proficiency_level character varying,
  obtained_at timestamp with time zone,
  course_count bigint,
  courses jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.skill_id,
    s.name,
    s.slug,
    s.description,
    s.category,
    s.icon_url,
    s.icon_type,
    s.icon_name,
    s.color,
    MAX(us.proficiency_level::text)::character varying as proficiency_level,
    MIN(us.obtained_at) as obtained_at,
    COUNT(DISTINCT us.course_id) as course_count,
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'course_id', c.id,
        'course_title', c.title,
        'completed_at', us.obtained_at
      )
    ) as courses
  FROM public.user_skills us
  INNER JOIN public.skills s ON us.skill_id = s.skill_id
  LEFT JOIN public.courses c ON us.course_id = c.id
  WHERE us.user_id = p_user_id
    AND us.is_displayed = true
    AND s.is_active = true
  GROUP BY 
    s.skill_id, s.name, s.slug, s.description, s.category,
    s.icon_url, s.icon_type, s.icon_name, s.color
  ORDER BY obtained_at DESC, s.name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. VISTA: Vista de skills por curso
-- =====================================================
-- Vista para consultar fácilmente las skills de cada curso
CREATE OR REPLACE VIEW public.course_skills_view AS
SELECT 
  c.id as course_id,
  c.title as course_title,
  c.slug as course_slug,
  s.skill_id,
  s.name as skill_name,
  s.slug as skill_slug,
  s.description as skill_description,
  s.category as skill_category,
  s.icon_url,
  s.icon_type,
  s.icon_name,
  s.color,
  cs.is_primary,
  cs.is_required,
  cs.proficiency_level,
  cs.display_order
FROM public.courses c
INNER JOIN public.course_skills cs ON c.id = cs.course_id
INNER JOIN public.skills s ON cs.skill_id = s.skill_id
WHERE c.is_active = true
  AND s.is_active = true
ORDER BY c.title, cs.display_order, cs.is_primary DESC, s.name;

-- =====================================================
-- 8. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.skills IS 'Catálogo de skills disponibles en la plataforma. Cada skill puede tener un icono/logo para mostrar en el perfil del usuario.';
COMMENT ON TABLE public.course_skills IS 'Relación entre cursos y skills. Define qué skills se aprenden en cada curso.';
COMMENT ON TABLE public.user_skills IS 'Skills obtenidas por los usuarios al completar cursos. Se crean automáticamente mediante trigger.';
COMMENT ON TABLE public.skill_categories IS 'Categorías de skills para mejor organización (opcional).';

COMMENT ON COLUMN public.skills.icon_type IS 'Tipo de icono: image (URL), svg (URL SVG), emoji (emoji unicode), font_icon (nombre de icono de fuente)';
COMMENT ON COLUMN public.skills.icon_name IS 'Nombre del icono si icon_type es font_icon (ej: react, python, javascript)';
COMMENT ON COLUMN public.course_skills.is_primary IS 'Indica si es una skill principal del curso (se muestra destacada)';
COMMENT ON COLUMN public.user_skills.verified IS 'Si la skill fue verificada al completar el curso (true) o asignada manualmente (false)';
COMMENT ON COLUMN public.user_skills.is_displayed IS 'Si la skill se muestra en el perfil público del usuario';

-- =====================================================
-- 9. DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================
-- Algunas skills de ejemplo para empezar

/*
INSERT INTO public.skills (name, slug, description, category, icon_name, color, level) VALUES
('React', 'react', 'Biblioteca de JavaScript para construir interfaces de usuario', 'programming', 'react', '#61DAFB', 'intermediate'),
('Python', 'python', 'Lenguaje de programación de alto nivel', 'programming', 'python', '#3776AB', 'beginner'),
('JavaScript', 'javascript', 'Lenguaje de programación para desarrollo web', 'programming', 'javascript', '#F7DF1E', 'beginner'),
('Node.js', 'nodejs', 'Entorno de ejecución de JavaScript en el servidor', 'programming', 'nodejs', '#339933', 'intermediate'),
('TypeScript', 'typescript', 'Superset tipado de JavaScript', 'programming', 'typescript', '#3178C6', 'intermediate'),
('Diseño UX/UI', 'ux-ui-design', 'Diseño de experiencia y interfaz de usuario', 'design', 'figma', '#F24E1E', 'beginner'),
('Marketing Digital', 'digital-marketing', 'Estrategias de marketing en línea', 'marketing', 'megaphone', '#FF6B6B', 'beginner'),
('Inteligencia Artificial', 'artificial-intelligence', 'Fundamentos de IA y machine learning', 'ai', 'brain', '#9333EA', 'advanced'),
('Cloud Computing', 'cloud-computing', 'Servicios y arquitectura en la nube', 'cloud', 'cloud', '#FF9900', 'intermediate'),
('Liderazgo', 'leadership', 'Habilidades de liderazgo y gestión de equipos', 'leadership', 'users', '#10B981', 'intermediate');
*/

-- =====================================================
-- FIN DE LA PROPUESTA
-- =====================================================


