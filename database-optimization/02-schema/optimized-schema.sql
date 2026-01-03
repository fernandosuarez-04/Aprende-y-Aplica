-- =====================================================
-- ESQUEMA OPTIMIZADO - SISTEMA DE CURSOS
-- =====================================================
-- Este archivo contiene el esquema completo optimizado para el sistema de cursos
-- con eliminación de redundancias, sistema de pagos integrado y preservación
-- de todo el contenido educativo existente.

-- =====================================================
-- 1. TABLAS CORE DEL SISTEMA
-- =====================================================

-- =====================================================
-- TABLA: courses
-- DESCRIPCIÓN: Información principal de los cursos disponibles
-- RELACIONES: 
--   - Creado por: users (instructor)
--   - Contiene: course_modules
--   - Referenciado por: user_course_enrollments
-- USO: Catálogo de cursos, información de precios, ratings
-- =====================================================
CREATE TABLE public.courses (
  -- Identificador único del curso
  course_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Título del curso (máximo 255 caracteres)
  -- USO: Display en UI, búsquedas, SEO
  course_title varchar(255) NOT NULL,
  
  -- Descripción corta del curso (máximo 500 caracteres)
  -- USO: Preview en catálogo, meta description
  course_summary varchar(500),
  
  -- Descripción completa del curso
  -- USO: Página de detalles, contenido enriquecido
  course_description text,
  
  -- Slug único para URLs amigables
  -- USO: URLs, routing, SEO
  -- FORMATO: curso-de-inteligencia-artificial
  course_slug varchar(255) UNIQUE NOT NULL,
  
  -- Precio del curso en centavos (para evitar problemas de decimales)
  -- USO: Cálculos de pago, display de precios
  -- EJEMPLO: 29900 = $299.00
  course_price_cents integer DEFAULT 0 CHECK (course_price_cents >= 0),
  
  -- Nivel de dificultad del curso
  -- USO: Filtros, recomendaciones, UI
  -- VALORES: beginner, intermediate, advanced
  course_difficulty_level varchar(20) DEFAULT 'beginner' 
    CHECK (course_difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Duración total estimada en minutos
  -- USO: Estimaciones de tiempo, progress bars
  course_duration_minutes integer DEFAULT 0 CHECK (course_duration_minutes >= 0),
  
  -- Rating promedio del curso (0.0 - 5.0)
  -- USO: Display de estrellas, ordenamiento
  course_average_rating decimal(2,1) DEFAULT 0.0 
    CHECK (course_average_rating >= 0.0 AND course_average_rating <= 5.0),
  
  -- Número total de estudiantes inscritos
  -- USO: Social proof, analytics
  course_student_count integer DEFAULT 0 CHECK (course_student_count >= 0),
  
  -- Número total de reviews
  -- USO: Cálculo de rating, social proof
  course_review_count integer DEFAULT 0 CHECK (course_review_count >= 0),
  
  -- URL de la imagen thumbnail del curso
  -- USO: Display en catálogo, cards
  course_thumbnail_url text,
  
  -- Indica si el curso está activo y visible
  -- USO: Control de visibilidad, soft delete
  is_active boolean DEFAULT true,
  
  -- Indica si el curso está publicado
  -- USO: Workflow de publicación, control de acceso
  is_published boolean DEFAULT false,
  
  -- Timestamp de creación del curso
  created_at timestamptz DEFAULT now(),
  
  -- Timestamp de última actualización
  updated_at timestamptz DEFAULT now(),
  
  -- Timestamp de publicación
  published_at timestamptz,
  
  -- Foreign key al instructor creador
  instructor_id uuid NOT NULL REFERENCES users(user_id)
);

-- Comentarios en la tabla
COMMENT ON TABLE courses IS 'Información principal de los cursos disponibles en la plataforma';
COMMENT ON COLUMN courses.course_id IS 'Identificador único del curso';
COMMENT ON COLUMN courses.course_title IS 'Título del curso para display y búsquedas';
COMMENT ON COLUMN courses.course_price_cents IS 'Precio en centavos para evitar problemas de decimales';
COMMENT ON COLUMN courses.course_difficulty_level IS 'Nivel de dificultad: beginner, intermediate, advanced';
COMMENT ON COLUMN courses.course_average_rating IS 'Rating promedio calculado automáticamente';
COMMENT ON COLUMN courses.is_published IS 'Control de visibilidad del curso para estudiantes';

-- =====================================================
-- TABLA: course_modules
-- DESCRIPCIÓN: Módulos que componen cada curso
-- RELACIONES:
--   - Pertenece a: courses
--   - Contiene: course_lessons
-- USO: Organización jerárquica del contenido
-- =====================================================
CREATE TABLE public.course_modules (
  -- Identificador único del módulo
  module_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Título del módulo
  -- USO: Display en UI, navegación
  module_title varchar(255) NOT NULL,
  
  -- Descripción del módulo
  -- USO: Preview del contenido, contexto
  module_description text,
  
  -- Orden del módulo dentro del curso
  -- USO: Secuencia de aprendizaje, navegación
  module_order_index integer NOT NULL DEFAULT 1 CHECK (module_order_index > 0),
  
  -- Duración estimada del módulo en minutos
  -- USO: Estimaciones de tiempo, progress bars
  module_duration_minutes integer DEFAULT 0 CHECK (module_duration_minutes >= 0),
  
  -- Indica si el módulo es obligatorio
  -- USO: Control de progreso, certificación
  is_required boolean DEFAULT true,
  
  -- Indica si el módulo está publicado
  -- USO: Control de visibilidad, workflow
  is_published boolean DEFAULT false,
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Timestamp de actualización
  updated_at timestamptz DEFAULT now(),
  
  -- Foreign key al curso padre
  course_id uuid NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA: course_lessons
-- DESCRIPCIÓN: Lecciones individuales de cada módulo (reemplaza module_videos)
-- RELACIONES:
--   - Pertenece a: course_modules
--   - Contiene: lesson_materials, lesson_activities, lesson_checkpoints
-- USO: Contenido educativo principal, transcripciones, actividades
-- =====================================================
CREATE TABLE public.course_lessons (
  -- Identificador único de la lección
  lesson_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Título descriptivo de la lección (máximo 255 caracteres)
  -- USO: Display en UI, búsquedas, SEO
  lesson_title varchar(255) NOT NULL,
  
  -- ID del video en la plataforma externa (YouTube, Vimeo, etc.)
  -- USO: Embedding de video, analytics de plataforma
  -- FORMATO: YouTube ID (11 caracteres), Vimeo ID (numérico)
  video_provider_id varchar(50) NOT NULL,
  
  -- Plataforma del video
  -- USO: Lógica de embedding, analytics
  -- VALORES: youtube, vimeo, direct, custom
  video_provider varchar(20) NOT NULL DEFAULT 'youtube' 
    CHECK (video_provider IN ('youtube', 'vimeo', 'direct', 'custom')),
  
  -- Duración del video en segundos (debe ser mayor a 0)
  -- USO: Progress bars, estimaciones de tiempo, analytics
  -- VALIDACIÓN: Debe ser > 0, típicamente entre 30-3600 segundos
  duration_seconds integer NOT NULL CHECK (duration_seconds > 0),
  
  -- Transcripción completa del video para búsqueda y accesibilidad
  -- USO: Full-text search, subtítulos, accesibilidad
  -- FORMATO: Texto plano, puede contener timestamps
  -- TAMAÑO: Típicamente 1-50KB por lección
  transcript_content text,
  
  -- Descripción detallada del contenido de la lección
  -- USO: Contexto educativo, preview del contenido
  lesson_description text,
  
  -- Orden de la lección dentro del módulo (1 = primera lección)
  -- USO: Secuencia de aprendizaje, navegación
  lesson_order_index integer NOT NULL DEFAULT 1 CHECK (lesson_order_index > 0),
  
  -- Indica si la lección está publicada y visible para estudiantes
  -- USO: Control de visibilidad, workflow de publicación
  -- VALORES: true = visible, false = borrador
  is_published boolean DEFAULT false,
  
  -- Timestamp de creación del registro
  created_at timestamptz DEFAULT now(),
  
  -- Timestamp de última actualización del registro
  updated_at timestamptz DEFAULT now(),
  
  -- Foreign key al módulo padre
  module_id uuid NOT NULL REFERENCES course_modules(module_id) ON DELETE CASCADE,
  
  -- Foreign key al instructor creador
  instructor_id uuid NOT NULL REFERENCES users(user_id)
);

-- =====================================================
-- TABLA: lesson_materials
-- DESCRIPCIÓN: Materiales adjuntos a las lecciones (reemplaza module_materials)
-- RELACIONES:
--   - Pertenece a: course_lessons
-- USO: PDFs, links, documentos, quizzes, ejercicios
-- =====================================================
CREATE TABLE public.lesson_materials (
  -- Identificador único del material
  material_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Título del material
  -- USO: Display en UI, organización
  material_title varchar(255) NOT NULL,
  
  -- Descripción del material
  -- USO: Contexto, instrucciones de uso
  material_description text,
  
  -- Tipo de material
  -- USO: Lógica de display, permisos de descarga
  -- VALORES: pdf, link, document, quiz, exercise, reading
  material_type varchar(20) NOT NULL 
    CHECK (material_type IN ('pdf', 'link', 'document', 'quiz', 'exercise', 'reading')),
  
  -- URL del archivo (para materiales descargables)
  -- USO: Enlaces de descarga, streaming
  file_url text,
  
  -- URL externa (para links)
  -- USO: Redirección a recursos externos
  external_url text,
  
  -- Contenido estructurado en JSON
  -- USO: Quizzes, ejercicios interactivos, datos estructurados
  content_data jsonb DEFAULT '{}',
  
  -- Orden del material dentro de la lección
  -- USO: Secuencia de presentación
  material_order_index integer DEFAULT 1 CHECK (material_order_index > 0),
  
  -- Indica si el material es descargable
  -- USO: Control de permisos, analytics
  is_downloadable boolean DEFAULT false,
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Foreign key a la lección
  lesson_id uuid NOT NULL REFERENCES course_lessons(lesson_id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA: lesson_activities
-- DESCRIPCIÓN: Actividades interactivas de las lecciones (reemplaza actividad_detalle)
-- RELACIONES:
--   - Pertenece a: course_lessons
-- USO: Actividades guiadas, ejercicios interactivos, prompts de IA
-- =====================================================
CREATE TABLE public.lesson_activities (
  -- Identificador único de la actividad
  activity_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Título de la actividad
  -- USO: Display en UI, organización
  activity_title varchar(255) NOT NULL,
  
  -- Descripción de la actividad
  -- USO: Contexto, instrucciones
  activity_description text,
  
  -- Tipo de actividad
  -- USO: Lógica de procesamiento, UI
  -- VALORES: reflection, exercise, quiz, discussion, ai_chat
  activity_type varchar(20) NOT NULL 
    CHECK (activity_type IN ('reflection', 'exercise', 'quiz', 'discussion', 'ai_chat')),
  
  -- Contenido de la actividad
  -- USO: Instrucciones, prompts, contenido interactivo
  activity_content text NOT NULL,
  
  -- Prompts específicos para IA
  -- USO: Guías de conversación, prompts estructurados
  ai_prompts text,
  
  -- Orden de la actividad dentro de la lección
  -- USO: Secuencia de actividades
  activity_order_index integer DEFAULT 1 CHECK (activity_order_index > 0),
  
  -- Indica si la actividad es obligatoria
  -- USO: Control de progreso, certificación
  is_required boolean DEFAULT true,
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Foreign key a la lección
  lesson_id uuid NOT NULL REFERENCES course_lessons(lesson_id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA: lesson_checkpoints
-- DESCRIPCIÓN: Checkpoints de video para seguimiento de progreso (reemplaza video_checkpoints)
-- RELACIONES:
--   - Pertenece a: course_lessons
-- USO: Puntos de control temporal, validación de progreso
-- =====================================================
CREATE TABLE public.lesson_checkpoints (
  -- Identificador único del checkpoint
  checkpoint_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tiempo del checkpoint en segundos
  -- USO: Sincronización temporal, validación de progreso
  -- VALIDACIÓN: Debe ser >= 0 y <= duración del video
  checkpoint_time_seconds integer NOT NULL CHECK (checkpoint_time_seconds >= 0),
  
  -- Etiqueta del checkpoint
  -- USO: Display en UI, identificación
  checkpoint_label varchar(100),
  
  -- Descripción del checkpoint
  -- USO: Contexto, instrucciones
  checkpoint_description text,
  
  -- Indica si el checkpoint es obligatorio para completar la lección
  -- USO: Control de progreso, certificación
  is_required_completion boolean DEFAULT false,
  
  -- Orden del checkpoint dentro de la lección
  -- USO: Secuencia de checkpoints
  checkpoint_order_index integer DEFAULT 1 CHECK (checkpoint_order_index > 0),
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Foreign key a la lección
  lesson_id uuid NOT NULL REFERENCES course_lessons(lesson_id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA: course_objectives
-- DESCRIPCIÓN: Objetivos de aprendizaje del curso (reemplaza learning_objectives)
-- RELACIONES:
--   - Pertenece a: courses
-- USO: Definición de competencias, evaluación de progreso
-- =====================================================
CREATE TABLE public.course_objectives (
  -- Identificador único del objetivo
  objective_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Texto del objetivo de aprendizaje
  -- USO: Display en UI, evaluación, certificación
  objective_text text NOT NULL,
  
  -- Categoría del objetivo
  -- USO: Organización, filtros, reportes
  objective_category varchar(50) DEFAULT 'general',
  
  -- Nivel de competencia requerido
  -- USO: Evaluación, progresión, certificación
  -- VALORES: beginner, intermediate, advanced
  proficiency_level varchar(20) DEFAULT 'beginner' 
    CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Evidencia de logro del objetivo
  -- USO: Validación, certificación, reportes
  evidence_data jsonb DEFAULT '{}',
  
  -- Orden del objetivo dentro del curso
  -- USO: Secuencia de objetivos
  objective_order_index integer DEFAULT 1 CHECK (objective_order_index > 0),
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Foreign key al curso
  course_id uuid NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA: course_glossary
-- DESCRIPCIÓN: Glosario de términos del curso (reemplaza glossary_term)
-- RELACIONES:
--   - Pertenece a: courses
-- USO: Definiciones, contexto educativo, búsqueda
-- =====================================================
CREATE TABLE public.course_glossary (
  -- Identificador único del término
  term_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Término del glosario
  -- USO: Búsqueda, display, indexación
  term varchar(100) NOT NULL,
  
  -- Definición del término
  -- USO: Contexto educativo, explicaciones
  term_definition text NOT NULL,
  
  -- Categoría del término
  -- USO: Organización, filtros
  term_category varchar(50) DEFAULT 'general',
  
  -- Orden del término dentro del curso
  -- USO: Secuencia alfabética, organización
  term_order_index integer DEFAULT 1 CHECK (term_order_index > 0),
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Foreign key al curso
  course_id uuid NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  
  -- Constraint único por curso
  UNIQUE(course_id, term)
);

-- =====================================================
-- 2. SISTEMA DE USUARIOS Y PROGRESO (UNIFICADO)
-- =====================================================

-- =====================================================
-- TABLA: user_course_enrollments
-- DESCRIPCIÓN: Inscripciones de usuarios a cursos
-- RELACIONES:
--   - Usuario: users
--   - Curso: courses
-- USO: Control de acceso, progreso, pagos
-- =====================================================
CREATE TABLE public.user_course_enrollments (
  -- Identificador único de la inscripción
  enrollment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Estado de la inscripción
  -- USO: Control de acceso, workflow
  -- VALORES: active, completed, suspended, cancelled
  enrollment_status varchar(20) DEFAULT 'active' 
    CHECK (enrollment_status IN ('active', 'completed', 'suspended', 'cancelled')),
  
  -- Fecha de inicio de la inscripción
  -- USO: Cálculo de duración, analytics
  enrollment_date timestamptz DEFAULT now(),
  
  -- Fecha de finalización
  -- USO: Cálculo de duración, certificación
  completion_date timestamptz,
  
  -- Progreso general del curso (0-100)
  -- USO: Progress bars, analytics
  overall_progress_percentage decimal(5,2) DEFAULT 0.00 
    CHECK (overall_progress_percentage >= 0.00 AND overall_progress_percentage <= 100.00),
  
  -- Tiempo total invertido en minutos
  -- USO: Analytics, reportes
  total_time_minutes integer DEFAULT 0 CHECK (total_time_minutes >= 0),
  
  -- Timestamp de última actividad
  -- USO: Analytics, engagement
  last_activity_at timestamptz DEFAULT now(),
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Timestamp de actualización
  updated_at timestamptz DEFAULT now(),
  
  -- Foreign keys
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  
  -- Constraint único por usuario-curso
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- TABLA: user_lesson_progress
-- DESCRIPCIÓN: Progreso detallado por lección (UNIFICADO - reemplaza múltiples tablas)
-- RELACIONES:
--   - Usuario: users
--   - Lección: course_lessons
--   - Inscripción: user_course_enrollments
-- USO: Tracking detallado, analytics, certificación
-- =====================================================
CREATE TABLE public.user_lesson_progress (
  -- Identificador único del progreso
  progress_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Estado de la lección
  -- USO: Control de progreso, navegación
  -- VALORES: not_started, in_progress, completed, locked
  lesson_status varchar(20) DEFAULT 'not_started' 
    CHECK (lesson_status IN ('not_started', 'in_progress', 'completed', 'locked')),
  
  -- Progreso del video (0-100)
  -- USO: Progress bars, analytics
  video_progress_percentage decimal(5,2) DEFAULT 0.00 
    CHECK (video_progress_percentage >= 0.00 AND video_progress_percentage <= 100.00),
  
  -- Tiempo actual del video en segundos
  -- USO: Continuidad de reproducción, analytics
  current_time_seconds integer DEFAULT 0 CHECK (current_time_seconds >= 0),
  
  -- Indica si la lección está completada
  -- USO: Control de progreso, desbloqueo de siguiente lección
  is_completed boolean DEFAULT false,
  
  -- Fecha de inicio de la lección
  -- USO: Analytics, engagement
  started_at timestamptz,
  
  -- Fecha de finalización
  -- USO: Analytics, certificación
  completed_at timestamptz,
  
  -- Tiempo total invertido en la lección (minutos)
  -- USO: Analytics, reportes
  time_spent_minutes integer DEFAULT 0 CHECK (time_spent_minutes >= 0),
  
  -- Progreso del quiz (0-100)
  -- USO: Progress bars, validación de actividades obligatorias
  quiz_progress_percentage decimal(5,2) DEFAULT 0.00 
    CHECK (quiz_progress_percentage >= 0.00 AND quiz_progress_percentage <= 100.00),
  
  -- Indica si el quiz fue completado
  -- USO: Control de progreso, validación de actividades obligatorias
  quiz_completed boolean DEFAULT false,
  
  -- Indica si el quiz fue aprobado (≥80%)
  -- USO: Control de progreso, validación de actividades obligatorias
  quiz_passed boolean DEFAULT false,
  
  -- Timestamp de última actividad
  -- USO: Analytics, engagement
  last_accessed_at timestamptz DEFAULT now(),
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Timestamp de actualización
  updated_at timestamptz DEFAULT now(),
  
  -- Foreign keys
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES course_lessons(lesson_id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES user_course_enrollments(enrollment_id) ON DELETE CASCADE,
  
  -- Constraint único por usuario-lección
  UNIQUE(user_id, lesson_id)
);

-- =====================================================
-- TABLA: user_lesson_notes
-- DESCRIPCIÓN: Notas del usuario por lección (reemplaza user_course_notes)
-- RELACIONES:
--   - Usuario: users
--   - Lección: course_lessons
-- USO: Notas personales, resúmenes, recordatorios
-- =====================================================
CREATE TABLE public.user_lesson_notes (
  -- Identificador único de la nota
  note_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Título de la nota
  -- USO: Organización, búsqueda
  note_title varchar(255) NOT NULL,
  
  -- Contenido de la nota
  -- USO: Notas personales, resúmenes
  note_content text NOT NULL,
  
  -- Tags de la nota
  -- USO: Organización, filtros, búsqueda
  note_tags jsonb DEFAULT '[]',
  
  -- Tipo de fuente de la nota
  -- USO: Categorización, analytics
  -- VALORES: manual, ai_generated, imported
  source_type varchar(20) DEFAULT 'manual' 
    CHECK (source_type IN ('manual', 'ai_generated', 'imported')),
  
  -- Indica si la nota es auto-generada
  -- USO: Categorización, UI
  is_auto_generated boolean DEFAULT false,
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Timestamp de actualización
  updated_at timestamptz DEFAULT now(),
  
  -- Foreign keys
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES course_lessons(lesson_id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA: user_quiz_submissions
-- DESCRIPCIÓN: Respuestas y resultados de quizzes completados por usuarios
-- RELACIONES:
--   - Usuario: users
--   - Lección: course_lessons
--   - Material: lesson_materials (opcional, si el quiz viene de materiales)
--   - Actividad: lesson_activities (opcional, si el quiz viene de actividades)
-- USO: Tracking de respuestas, validación de actividades obligatorias, analytics
-- =====================================================
CREATE TABLE public.user_quiz_submissions (
  -- Identificador único de la submission
  submission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Respuestas del usuario en formato JSON
  -- USO: Almacenar todas las respuestas del quiz
  -- FORMATO: { "question_id": "answer_value", ... }
  user_answers jsonb NOT NULL DEFAULT '{}',
  
  -- Puntuación obtenida (número de respuestas correctas)
  -- USO: Cálculo de porcentaje, analytics
  score integer DEFAULT 0 CHECK (score >= 0),
  
  -- Puntos totales posibles del quiz
  -- USO: Cálculo de porcentaje
  total_points integer DEFAULT 0 CHECK (total_points >= 0),
  
  -- Porcentaje de aciertos (0-100)
  -- USO: Validación de aprobación, analytics
  percentage_score decimal(5,2) DEFAULT 0.00 
    CHECK (percentage_score >= 0.00 AND percentage_score <= 100.00),
  
  -- Indica si el quiz fue aprobado (≥80%)
  -- USO: Validación de actividades obligatorias
  is_passed boolean DEFAULT false,
  
  -- Timestamp de completado
  -- USO: Analytics, tracking de progreso
  completed_at timestamptz DEFAULT now(),
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Timestamp de actualización
  updated_at timestamptz DEFAULT now(),
  
  -- Foreign keys
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES course_lessons(lesson_id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES user_course_enrollments(enrollment_id) ON DELETE CASCADE,
  
  -- Foreign keys opcionales para materiales o actividades
  material_id uuid REFERENCES lesson_materials(material_id) ON DELETE CASCADE,
  activity_id uuid REFERENCES lesson_activities(activity_id) ON DELETE CASCADE,
  
  -- Constraint: debe tener al menos material_id o activity_id
  CHECK (material_id IS NOT NULL OR activity_id IS NOT NULL),
  
  -- Constraint único por usuario-lección-material/actividad
  -- Permite múltiples intentos si es necesario (se puede cambiar a UNIQUE si solo se permite un intento)
  UNIQUE(user_id, lesson_id, COALESCE(material_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(activity_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- Índices para mejorar performance
CREATE INDEX idx_user_quiz_submissions_user_lesson ON user_quiz_submissions(user_id, lesson_id);
CREATE INDEX idx_user_quiz_submissions_material ON user_quiz_submissions(material_id) WHERE material_id IS NOT NULL;
CREATE INDEX idx_user_quiz_submissions_activity ON user_quiz_submissions(activity_id) WHERE activity_id IS NOT NULL;
CREATE INDEX idx_user_quiz_submissions_enrollment ON user_quiz_submissions(enrollment_id);

-- =====================================================
-- TABLA: user_course_certificates
-- DESCRIPCIÓN: Certificados obtenidos por los usuarios
-- RELACIONES:
--   - Usuario: users
--   - Curso: courses
-- USO: Certificación, validación de competencias
-- =====================================================
CREATE TABLE public.user_course_certificates (
  -- Identificador único del certificado
  certificate_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- URL del certificado
  -- USO: Descarga, validación, display
  certificate_url text NOT NULL,
  
  -- Hash del certificado para validación
  -- USO: Verificación de autenticidad
  certificate_hash varchar(64) NOT NULL,
  
  -- Fecha de emisión del certificado
  -- USO: Validez, analytics
  issued_at timestamptz DEFAULT now(),
  
  -- Fecha de expiración (opcional)
  -- USO: Validez temporal
  expires_at timestamptz,
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Foreign keys
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL REFERENCES user_course_enrollments(enrollment_id) ON DELETE CASCADE,
  
  -- Constraint único por usuario-curso
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- 3. SISTEMA DE PAGOS (NUEVO)
-- =====================================================

-- =====================================================
-- TABLA: payment_methods
-- DESCRIPCIÓN: Métodos de pago del usuario
-- RELACIONES:
--   - Usuario: users
-- USO: Gestión de métodos de pago, facturación
-- =====================================================
CREATE TABLE public.payment_methods (
  -- Identificador único del método de pago
  payment_method_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de método de pago
  -- USO: Lógica de procesamiento, UI
  -- VALORES: credit_card, debit_card, paypal, bank_transfer, crypto
  payment_type varchar(20) NOT NULL 
    CHECK (payment_type IN ('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'crypto')),
  
  -- Nombre del método de pago
  -- USO: Display en UI, identificación
  method_name varchar(100) NOT NULL,
  
  -- Información encriptada del método de pago
  -- USO: Datos sensibles encriptados
  encrypted_data text NOT NULL,
  
  -- Indica si el método está activo
  -- USO: Control de uso, seguridad
  is_active boolean DEFAULT true,
  
  -- Indica si es el método por defecto
  -- USO: Auto-selección en pagos
  is_default boolean DEFAULT false,
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Timestamp de última actualización
  updated_at timestamptz DEFAULT now(),
  
  -- Foreign key al usuario
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA: transactions
-- DESCRIPCIÓN: Transacciones de pago
-- RELACIONES:
--   - Usuario: users
--   - Curso: courses (opcional)
-- USO: Historial de pagos, facturación, analytics
-- =====================================================
CREATE TABLE public.transactions (
  -- Identificador único de la transacción
  transaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Monto de la transacción en centavos
  -- USO: Cálculos precisos, facturación
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  
  -- Moneda de la transacción
  -- USO: Internacionalización, reportes
  currency varchar(3) DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'MXN', 'ARS')),
  
  -- Estado de la transacción
  -- USO: Control de flujo, UI
  -- VALORES: pending, completed, failed, refunded, cancelled
  transaction_status varchar(20) DEFAULT 'pending' 
    CHECK (transaction_status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  
  -- Tipo de transacción
  -- USO: Categorización, reportes
  -- VALORES: course_purchase, subscription, refund, credit
  transaction_type varchar(20) NOT NULL 
    CHECK (transaction_type IN ('course_purchase', 'subscription', 'refund', 'credit')),
  
  -- ID de la transacción en el procesador de pagos
  -- USO: Reconciliación, soporte
  processor_transaction_id varchar(100),
  
  -- Datos de respuesta del procesador
  -- USO: Debugging, soporte, analytics
  processor_response jsonb DEFAULT '{}',
  
  -- Fecha de procesamiento
  -- USO: Analytics, reportes
  processed_at timestamptz,
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Foreign keys
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(course_id) ON DELETE SET NULL,
  payment_method_id uuid REFERENCES payment_methods(payment_method_id) ON DELETE SET NULL
);

-- =====================================================
-- TABLA: subscriptions
-- DESCRIPCIÓN: Suscripciones activas
-- RELACIONES:
--   - Usuario: users
--   - Curso: courses (opcional)
-- USO: Gestión de suscripciones, facturación recurrente
-- =====================================================
CREATE TABLE public.subscriptions (
  -- Identificador único de la suscripción
  subscription_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de suscripción
  -- USO: Lógica de facturación, UI
  -- VALORES: monthly, yearly, lifetime, course_access
  subscription_type varchar(20) NOT NULL 
    CHECK (subscription_type IN ('monthly', 'yearly', 'lifetime', 'course_access')),
  
  -- Estado de la suscripción
  -- USO: Control de acceso, facturación
  -- VALORES: active, paused, cancelled, expired
  subscription_status varchar(20) DEFAULT 'active' 
    CHECK (subscription_status IN ('active', 'paused', 'cancelled', 'expired')),
  
  -- Precio de la suscripción en centavos
  -- USO: Facturación, cálculos
  price_cents integer NOT NULL CHECK (price_cents > 0),
  
  -- Fecha de inicio de la suscripción
  -- USO: Cálculo de períodos, facturación
  start_date timestamptz DEFAULT now(),
  
  -- Fecha de finalización
  -- USO: Control de acceso, renovación
  end_date timestamptz,
  
  -- Fecha de próxima facturación
  -- USO: Facturación automática
  next_billing_date timestamptz,
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Timestamp de actualización
  updated_at timestamptz DEFAULT now(),
  
  -- Foreign keys
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(course_id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA: coupons
-- DESCRIPCIÓN: Cupones de descuento
-- RELACIONES:
--   - Curso: courses (opcional)
-- USO: Descuentos, promociones, marketing
-- =====================================================
CREATE TABLE public.coupons (
  -- Identificador único del cupón
  coupon_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Código del cupón
  -- USO: Aplicación de descuentos, validación
  coupon_code varchar(50) UNIQUE NOT NULL,
  
  -- Descripción del cupón
  -- USO: Display en UI, contexto
  coupon_description text,
  
  -- Tipo de descuento
  -- USO: Cálculo de descuentos
  -- VALORES: percentage, fixed_amount
  discount_type varchar(20) NOT NULL 
    CHECK (discount_type IN ('percentage', 'fixed_amount')),
  
  -- Valor del descuento
  -- USO: Cálculo de descuentos
  discount_value decimal(10,2) NOT NULL CHECK (discount_value > 0),
  
  -- Monto mínimo de compra para aplicar el cupón
  -- USO: Validación de elegibilidad
  minimum_amount_cents integer DEFAULT 0 CHECK (minimum_amount_cents >= 0),
  
  -- Número máximo de usos
  -- USO: Control de disponibilidad
  max_uses integer,
  
  -- Número de usos actuales
  -- USO: Control de disponibilidad
  current_uses integer DEFAULT 0 CHECK (current_uses >= 0),
  
  -- Fecha de inicio de validez
  -- USO: Control temporal
  valid_from timestamptz DEFAULT now(),
  
  -- Fecha de finalización de validez
  -- USO: Control temporal
  valid_until timestamptz,
  
  -- Indica si el cupón está activo
  -- USO: Control de disponibilidad
  is_active boolean DEFAULT true,
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Foreign key al curso (opcional)
  course_id uuid REFERENCES courses(course_id) ON DELETE CASCADE
);

-- =====================================================
-- 4. SISTEMA DE REVIEWS Y SOCIAL
-- =====================================================

-- =====================================================
-- TABLA: course_reviews
-- DESCRIPCIÓN: Reviews de cursos
-- RELACIONES:
--   - Usuario: users
--   - Curso: courses
-- USO: Feedback, social proof, mejoras
-- =====================================================
CREATE TABLE public.course_reviews (
  -- Identificador único del review
  review_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Rating del curso (1-5)
  -- USO: Cálculo de rating promedio, display
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- Título del review
  -- USO: Display en UI, resumen
  review_title varchar(255),
  
  -- Contenido del review
  -- USO: Feedback detallado, contexto
  review_content text,
  
  -- Indica si el review es verificado
  -- USO: Credibilidad, filtros
  is_verified boolean DEFAULT false,
  
  -- Indica si el review es útil
  -- USO: Ranking, relevancia
  is_helpful boolean DEFAULT false,
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Timestamp de actualización
  updated_at timestamptz DEFAULT now(),
  
  -- Foreign keys
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  
  -- Constraint único por usuario-curso
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- TABLA: user_wishlist
-- DESCRIPCIÓN: Lista de deseos de usuarios
-- RELACIONES:
--   - Usuario: users
--   - Curso: courses
-- USO: Recomendaciones, marketing, analytics
-- =====================================================
CREATE TABLE public.user_wishlist (
  -- Identificador único del item en wishlist
  wishlist_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Timestamp de creación
  created_at timestamptz DEFAULT now(),
  
  -- Foreign keys
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
  
  -- Constraint único por usuario-curso
  UNIQUE(user_id, course_id)
);

-- =====================================================
-- 5. SISTEMA DE ANALYTICS Y SEGUIMIENTO
-- =====================================================

-- =====================================================
-- TABLA: user_activity_log
-- DESCRIPCIÓN: Log detallado de actividad del usuario (optimizado)
-- RELACIONES:
--   - Usuario: users
--   - Lección: course_lessons (opcional)
-- USO: Analytics, debugging, optimización
-- =====================================================
CREATE TABLE public.user_activity_log (
  -- Identificador único del log
  log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de acción
  -- USO: Categorización, analytics
  -- VALORES: video_play, video_pause, video_seek, lesson_complete, course_start, course_complete
  action_type varchar(20) NOT NULL 
    CHECK (action_type IN ('video_play', 'video_pause', 'video_seek', 'lesson_complete', 'course_start', 'course_complete')),
  
  -- Tiempo del video en segundos
  -- USO: Analytics de engagement, puntos de abandono
  video_time_seconds integer CHECK (video_time_seconds >= 0),
  
  -- Tiempo anterior del video
  -- USO: Cálculo de saltos, analytics
  previous_time_seconds integer CHECK (previous_time_seconds >= 0),
  
  -- Datos adicionales de la acción
  -- USO: Contexto, debugging, analytics
  action_data jsonb DEFAULT '{}',
  
  -- User agent del navegador
  -- USO: Analytics, debugging
  user_agent text,
  
  -- Dirección IP
  -- USO: Analytics, seguridad
  ip_address inet,
  
  -- Timestamp de la acción
  action_timestamp timestamptz DEFAULT now(),
  
  -- Foreign keys
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES course_lessons(lesson_id) ON DELETE SET NULL
);

-- =====================================================
-- 6. ÍNDICES ESTRATÉGICOS
-- =====================================================

-- Índices para consultas de cursos
CREATE INDEX idx_courses_slug ON courses(course_slug);
CREATE INDEX idx_courses_instructor_active ON courses(instructor_id, is_active);
CREATE INDEX idx_courses_difficulty_published ON courses(course_difficulty_level, is_published);
CREATE INDEX idx_courses_rating_student_count ON courses(course_average_rating DESC, course_student_count DESC);

-- Índices para consultas de lecciones
CREATE INDEX idx_course_lessons_module_order ON course_lessons(module_id, lesson_order_index, is_published);
CREATE INDEX idx_course_lessons_title_search ON course_lessons USING gin(to_tsvector('spanish', lesson_title));
CREATE INDEX idx_course_lessons_transcript_search ON course_lessons USING gin(to_tsvector('spanish', transcript_content));

-- Índices para progreso de usuario
CREATE INDEX idx_user_lesson_progress_user_lesson ON user_lesson_progress(user_id, lesson_id);
CREATE INDEX idx_user_lesson_progress_enrollment ON user_lesson_progress(enrollment_id, lesson_status);
CREATE INDEX idx_user_course_enrollments_user_status ON user_course_enrollments(user_id, enrollment_status);

-- Índices para transacciones
CREATE INDEX idx_transactions_user_status ON transactions(user_id, transaction_status);
CREATE INDEX idx_transactions_course_type ON transactions(course_id, transaction_type);
CREATE INDEX idx_transactions_processor_id ON transactions(processor_transaction_id);

-- Índices para reviews
CREATE INDEX idx_course_reviews_course_rating ON course_reviews(course_id, rating);
CREATE INDEX idx_course_reviews_user_created ON course_reviews(user_id, created_at DESC);

-- Índices para actividad
CREATE INDEX idx_user_activity_log_user_action ON user_activity_log(user_id, action_type, action_timestamp);
CREATE INDEX idx_user_activity_log_lesson_action ON user_activity_log(lesson_id, action_type, action_timestamp);

-- =====================================================
-- 7. CONSTRAINTS Y VALIDACIONES
-- =====================================================

-- Constraints para cursos
ALTER TABLE courses ADD CONSTRAINT chk_course_price_positive 
  CHECK (course_price_cents >= 0);

ALTER TABLE courses ADD CONSTRAINT chk_course_difficulty_valid 
  CHECK (course_difficulty_level IN ('beginner', 'intermediate', 'advanced'));

ALTER TABLE courses ADD CONSTRAINT chk_course_rating_range 
  CHECK (course_average_rating >= 0.0 AND course_average_rating <= 5.0);

-- Constraints para lecciones
ALTER TABLE course_lessons ADD CONSTRAINT chk_lesson_duration_positive 
  CHECK (duration_seconds > 0);

ALTER TABLE course_lessons ADD CONSTRAINT chk_lesson_order_positive 
  CHECK (lesson_order_index > 0);

ALTER TABLE course_lessons ADD CONSTRAINT chk_lesson_title_not_empty 
  CHECK (length(trim(lesson_title)) > 0);

ALTER TABLE course_lessons ADD CONSTRAINT chk_video_provider_valid 
  CHECK (video_provider IN ('youtube', 'vimeo', 'direct', 'custom'));

-- Constraints para progreso
ALTER TABLE user_lesson_progress ADD CONSTRAINT chk_progress_percentage_range 
  CHECK (video_progress_percentage >= 0.00 AND video_progress_percentage <= 100.00);

ALTER TABLE user_course_enrollments ADD CONSTRAINT chk_enrollment_progress_range 
  CHECK (overall_progress_percentage >= 0.00 AND overall_progress_percentage <= 100.00);

-- Constraints para transacciones
ALTER TABLE transactions ADD CONSTRAINT chk_transaction_amount_positive 
  CHECK (amount_cents > 0);

ALTER TABLE transactions ADD CONSTRAINT chk_transaction_status_valid 
  CHECK (transaction_status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled'));

-- =====================================================
-- 8. TRIGGERS DE AUDITORÍA
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_modules_updated_at BEFORE UPDATE ON course_modules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON course_lessons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_lesson_progress_updated_at BEFORE UPDATE ON user_lesson_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_course_enrollments_updated_at BEFORE UPDATE ON user_course_enrollments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. COMENTARIOS FINALES
-- =====================================================

COMMENT ON TABLE courses IS 'Información principal de los cursos disponibles en la plataforma';
COMMENT ON TABLE course_modules IS 'Módulos que componen cada curso';
COMMENT ON TABLE course_lessons IS 'Lecciones individuales de cada módulo con transcripciones y actividades';
COMMENT ON TABLE user_course_enrollments IS 'Inscripciones de usuarios a cursos';
COMMENT ON TABLE user_lesson_progress IS 'Progreso detallado por lección (unificado)';
COMMENT ON TABLE transactions IS 'Transacciones de pago del sistema';
COMMENT ON TABLE course_reviews IS 'Reviews y ratings de cursos';

-- =====================================================
-- FIN DEL ESQUEMA OPTIMIZADO
-- =====================================================
