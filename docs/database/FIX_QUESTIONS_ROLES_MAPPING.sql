-- CORRECCIÓN COMPLETA DEL MAPEO ENTRE PREGUNTAS Y ROLES
-- Este script corrige el mapeo para que las preguntas existentes coincidan con los roles correctos

-- ==============================================
-- 1. ANÁLISIS DEL PROBLEMA ACTUAL
-- ==============================================
-- 
-- PREGUNTAS EXISTENTES (exclusivo_rol_id):
-- 1: CEO (12 preguntas) - OK
-- 2: CTO (12 preguntas) - OK  
-- 3: Marketing (12 preguntas) - OK
-- 4: Salud (12 preguntas) - NO HAY ROL DE SALUD EN roles
-- 5: Derecho (12 preguntas) - NO HAY ROL DE DERECHO EN roles
-- 6: Finanzas (12 preguntas) - NO HAY ROL DE FINANZAS EN roles
-- 7: Admin Pública (12 preguntas) - NO HAY ROL DE ADMIN PÚBLICA EN roles
-- 8: Academia (10 preguntas) - OK
--
-- ROLES EXISTENTES (id):
-- 1: CEO - OK
-- 2: CMO / Director(a) de Marketing - DEBE USAR exclusivo_rol_id = 3 (Marketing)
-- 3: CTO / Director(a) de Tecnología - DEBE USAR exclusivo_rol_id = 2 (CTO)
-- 4: Gerente de Marketing - DEBE USAR exclusivo_rol_id = 3 (Marketing)
-- 5: Gerente de TI - DEBE USAR exclusivo_rol_id = 2 (CTO)
-- 6: Líder/Gerente de Ventas - DEBE USAR exclusivo_rol_id = 1 (CEO)
-- 7: Analista/Especialista TI - DEBE USAR exclusivo_rol_id = 2 (CTO)
-- 8: Academia/Investigación - DEBE USAR exclusivo_rol_id = 8 (Academia)
-- 9: Educación/Docentes - NO HAY PREGUNTAS ESPECÍFICAS
-- 10: Diseño/Industrias Creativas - NO HAY PREGUNTAS ESPECÍFICAS
-- 11-26: Otros roles - NO HAY PREGUNTAS ESPECÍFICAS

-- ==============================================
-- 2. MAPEO CORRECTO PROPUESTO
-- ==============================================
--
-- exclusivo_rol_id = 1 (CEO): Roles estratégicos/gerenciales
-- - CEO (id = 1)
-- - Líder/Gerente de Ventas (id = 6)
-- - Dirección de Ventas (id = 11)
-- - Miembros de Ventas (id = 17)
-- - Dirección de Finanzas (id = 13)
-- - Miembros de Finanzas (id = 20)
-- - Dirección de RRHH (id = 14)
-- - Miembros de RRHH (id = 21)
-- - Dirección de Contabilidad (id = 15)
-- - Miembros de Contabilidad (id = 22)
-- - Gerencia Media (id = 24)
-- - Freelancer (id = 25)
-- - Consultor (id = 26)
--
-- exclusivo_rol_id = 2 (CTO): Roles técnicos/operativos
-- - CTO / Director(a) de Tecnología (id = 3)
-- - Gerente de TI (id = 5)
-- - Analista/Especialista TI (id = 7)
-- - Dirección de Operaciones (id = 12)
-- - Miembros de Operaciones (id = 19)
-- - Dirección de Compras (id = 16)
-- - Miembros de Compras (id = 23)
--
-- exclusivo_rol_id = 3 (Marketing): Roles de marketing
-- - CMO / Director(a) de Marketing (id = 2)
-- - Gerente de Marketing (id = 4)
-- - Miembros de Marketing (id = 18)
--
-- exclusivo_rol_id = 8 (Academia): Roles académicos
-- - Academia/Investigación (id = 8)
--
-- exclusivo_rol_id = 4,5,6,7: REASIGNAR A ROLES EXISTENTES
-- - Salud (4) → CEO (1) - Roles estratégicos
-- - Derecho (5) → CEO (1) - Roles estratégicos  
-- - Finanzas (6) → CEO (1) - Roles estratégicos
-- - Admin Pública (7) → CEO (1) - Roles estratégicos

-- ==============================================
-- 3. REASIGNAR PREGUNTAS DE ROLES INEXISTENTES
-- ==============================================

-- Reasignar preguntas de Salud (exclusivo_rol_id = 4) a CEO (exclusivo_rol_id = 1)
UPDATE "public"."preguntas" 
SET exclusivo_rol_id = 1 
WHERE exclusivo_rol_id = 4 AND section = 'Cuestionario';

-- Reasignar preguntas de Derecho (exclusivo_rol_id = 5) a CEO (exclusivo_rol_id = 1)
UPDATE "public"."preguntas" 
SET exclusivo_rol_id = 1 
WHERE exclusivo_rol_id = 5 AND section = 'Cuestionario';

-- Reasignar preguntas de Finanzas (exclusivo_rol_id = 6) a CEO (exclusivo_rol_id = 1)
UPDATE "public"."preguntas" 
SET exclusivo_rol_id = 1 
WHERE exclusivo_rol_id = 6 AND section = 'Cuestionario';

-- Reasignar preguntas de Admin Pública (exclusivo_rol_id = 7) a CEO (exclusivo_rol_id = 1)
UPDATE "public"."preguntas" 
SET exclusivo_rol_id = 1 
WHERE exclusivo_rol_id = 7 AND section = 'Cuestionario';

-- ==============================================
-- 4. CREAR PREGUNTAS PARA ROLES FALTANTES
-- ==============================================

-- Crear preguntas para Educación/Docentes (role_id = 9) → exclusivo_rol_id = 9
INSERT INTO "public"."preguntas" ("id", "codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta") VALUES 
('101', 'A1', 'Cuestionario', 'Adopción', '10', '9', '¿Con qué frecuencia usa Gen-AI para crear materiales educativos (presentaciones, ejercicios, evaluaciones) adaptados a diferentes niveles?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00+00', null),
('102', 'A2', 'Cuestionario', 'Adopción', '10', '9', '¿Con qué frecuencia emplea Gen-AI para personalizar el aprendizaje según las necesidades individuales de los estudiantes?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00+00', null),
('103', 'A3', 'Cuestionario', 'Adopción', '10', '9', '¿Con qué frecuencia usa Gen-AI para generar feedback automático y evaluaciones formativas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00+00', null),
('104', 'A4', 'Cuestionario', 'Adopción', '10', '9', '¿Con qué frecuencia integra Gen-AI en la creación de contenido multimedia educativo (videos, infografías, simulaciones)?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00+00', null),
('105', 'A5', 'Cuestionario', 'Adopción', '10', '9', '¿Con qué frecuencia usa Gen-AI para analizar el progreso de los estudiantes y identificar áreas de mejora?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00+00', null),
('106', 'A6', 'Cuestionario', 'Adopción', '10', '9', '¿Con qué frecuencia aplica Gen-AI para facilitar el aprendizaje colaborativo y la interacción entre estudiantes?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00+00', null),
('107', 'C1', 'Cuestionario', 'Conocimiento', '10', '9', '¿Cuál es la mejor práctica para usar Gen-AI en educación?', 'Multiple Choice (una respuesta)', '["A) Reemplazar completamente al docente", "B) Complementar la enseñanza con supervisión humana y ética", "C) Usar solo para tareas administrativas", "D) Evitar su uso en educación"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00+00', 'B) Complementar la enseñanza con supervisión humana y ética'),
('108', 'C2', 'Cuestionario', 'Conocimiento', '10', '9', '¿Qué aspecto es más importante al evaluar el impacto de Gen-AI en educación?', 'Multiple Choice (una respuesta)', '["A) Número de herramientas utilizadas", "B) Mejora en el aprendizaje y engagement de los estudiantes", "C) Reducción de costos", "D) Facilidad de implementación"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00+00', 'B) Mejora en el aprendizaje y engagement de los estudiantes'),
('109', 'C3', 'Cuestionario', 'Conocimiento', '10', '9', '¿Cómo se debe manejar la privacidad de datos estudiantiles con Gen-AI?', 'Multiple Choice (una respuesta)', '["A) Subir todos los datos a servicios públicos", "B) Minimizar datos, usar entornos seguros y cumplir con regulaciones de privacidad", "C) No preocuparse por la privacidad", "D) Usar solo datos anónimos"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00+00', 'B) Minimizar datos, usar entornos seguros y cumplir con regulaciones de privacidad'),
('110', 'C4', 'Cuestionario', 'Conocimiento', '10', '9', '¿Qué es esencial para el uso ético de Gen-AI en educación?', 'Multiple Choice (una respuesta)', '["A) Automatizar todas las decisiones", "B) Transparencia, supervisión humana y desarrollo de pensamiento crítico", "C) Ocultar el uso de IA", "D) Usar solo para calificaciones"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00+00', 'B) Transparencia, supervisión humana y desarrollo de pensamiento crítico'),
('111', 'C5', 'Cuestionario', 'Conocimiento', '10', '9', '¿Cómo se debe integrar Gen-AI en el currículo educativo?', 'Multiple Choice (una respuesta)', '["A) Como reemplazo de materias tradicionales", "B) Como herramienta complementaria que desarrolla competencias digitales", "C) Solo en materias de tecnología", "D) De forma opcional"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00+00', 'B) Como herramienta complementaria que desarrolla competencias digitales'),
('112', 'C6', 'Cuestionario', 'Conocimiento', '10', '9', '¿Qué métrica es más relevante para medir el éxito de Gen-AI en educación?', 'Multiple Choice (una respuesta)', '["A) Número de estudiantes que usan la herramienta", "B) Mejora en resultados de aprendizaje y satisfacción estudiantil", "C) Tiempo ahorrado por el docente", "D) Costo de implementación"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00+00', 'B) Mejora en resultados de aprendizaje y satisfacción estudiantil');

-- Crear preguntas para Diseño/Industrias Creativas (role_id = 10) → exclusivo_rol_id = 10
INSERT INTO "public"."preguntas" ("id", "codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta") VALUES 
('113', 'A1', 'Cuestionario', 'Adopción', '11', '10', '¿Con qué frecuencia usa Gen-AI para generar conceptos creativos y explorar nuevas ideas de diseño?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00+00', null),
('114', 'A2', 'Cuestionario', 'Adopción', '11', '10', '¿Con qué frecuencia emplea Gen-AI para crear variaciones de diseños y explorar diferentes estilos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00+00', null),
('115', 'A3', 'Cuestionario', 'Adopción', '11', '10', '¿Con qué frecuencia usa Gen-AI para optimizar workflows creativos y acelerar procesos de producción?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00+00', null),
('116', 'A4', 'Cuestionario', 'Adopción', '11', '10', '¿Con qué frecuencia integra Gen-AI en la creación de contenido multimedia (imágenes, videos, animaciones)?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00+00', null),
('117', 'A5', 'Cuestionario', 'Adopción', '11', '10', '¿Con qué frecuencia usa Gen-AI para personalizar experiencias creativas según audiencias específicas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00+00', null),
('118', 'A6', 'Cuestionario', 'Adopción', '11', '10', '¿Con qué frecuencia aplica Gen-AI para analizar tendencias creativas y predecir preferencias del mercado?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00+00', null),
('119', 'C1', 'Cuestionario', 'Conocimiento', '11', '10', '¿Cuál es la mejor práctica para usar Gen-AI en diseño creativo?', 'Multiple Choice (una respuesta)', '["A) Reemplazar completamente la creatividad humana", "B) Usar como herramienta de inspiración y aceleración con supervisión creativa", "C) Solo para tareas repetitivas", "D) Evitar su uso en procesos creativos"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00+00', 'B) Usar como herramienta de inspiración y aceleración con supervisión creativa'),
('120', 'C2', 'Cuestionario', 'Conocimiento', '11', '10', '¿Qué aspecto es más importante al evaluar la calidad de diseños generados por IA?', 'Multiple Choice (una respuesta)', '["A) Velocidad de generación", "B) Originalidad, relevancia y alineación con objetivos creativos", "C) Número de variaciones", "D) Facilidad de uso"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00+00', 'B) Originalidad, relevancia y alineación con objetivos creativos'),
('121', 'C3', 'Cuestionario', 'Conocimiento', '11', '10', '¿Cómo se debe manejar la propiedad intelectual en diseños generados por IA?', 'Multiple Choice (una respuesta)', '["A) Asumir que todo es de dominio público", "B) Revisar términos de uso, derechos de autor y documentar el proceso creativo", "C) No preocuparse por la propiedad intelectual", "D) Usar solo contenido libre"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00+00', 'B) Revisar términos de uso, derechos de autor y documentar el proceso creativo'),
('122', 'C4', 'Cuestionario', 'Conocimiento', '11', '10', '¿Qué es esencial para el uso ético de Gen-AI en industrias creativas?', 'Multiple Choice (una respuesta)', '["A) Automatizar todas las decisiones creativas", "B) Transparencia, respeto por derechos de autor y valoración del trabajo humano", "C) Ocultar el uso de IA", "D) Usar solo para proyectos internos"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00+00', 'B) Transparencia, respeto por derechos de autor y valoración del trabajo humano'),
('123', 'C5', 'Cuestionario', 'Conocimiento', '11', '10', '¿Cómo se debe integrar Gen-AI en procesos de diseño colaborativo?', 'Multiple Choice (una respuesta)', '["A) Como reemplazo del equipo creativo", "B) Como facilitador de brainstorming y herramienta de prototipado rápido", "C) Solo para presentaciones", "D) De forma independiente"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00+00', 'B) Como facilitador de brainstorming y herramienta de prototipado rápido'),
('124', 'C6', 'Cuestionario', 'Conocimiento', '11', '10', '¿Qué métrica es más relevante para medir el impacto de Gen-AI en creatividad?', 'Multiple Choice (una respuesta)', '["A) Número de diseños generados", "B) Calidad creativa, satisfacción del cliente y eficiencia del proceso", "C) Tiempo ahorrado", "D) Costo de herramientas"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00+00', 'B) Calidad creativa, satisfacción del cliente y eficiencia del proceso');

-- ==============================================
-- 5. VERIFICACIÓN FINAL
-- ==============================================

-- Verificar el mapeo final
SELECT 
    exclusivo_rol_id,
    COUNT(*) as total_preguntas,
    STRING_AGG(DISTINCT codigo, ', ' ORDER BY codigo) as codigos
FROM "public"."preguntas" 
WHERE section = 'Cuestionario'
GROUP BY exclusivo_rol_id
ORDER BY exclusivo_rol_id;

-- Verificar que cada rol tenga preguntas
SELECT 
    r.id as role_id,
    r.nombre as role_name,
    CASE 
        WHEN r.id = 1 THEN 'CEO (exclusivo_rol_id = 1)'
        WHEN r.id = 2 THEN 'Marketing (exclusivo_rol_id = 3)'
        WHEN r.id = 3 THEN 'CTO (exclusivo_rol_id = 2)'
        WHEN r.id = 4 THEN 'Marketing (exclusivo_rol_id = 3)'
        WHEN r.id = 5 THEN 'CTO (exclusivo_rol_id = 2)'
        WHEN r.id = 6 THEN 'CEO (exclusivo_rol_id = 1)'
        WHEN r.id = 7 THEN 'CTO (exclusivo_rol_id = 2)'
        WHEN r.id = 8 THEN 'Academia (exclusivo_rol_id = 8)'
        WHEN r.id = 9 THEN 'Educación (exclusivo_rol_id = 9)'
        WHEN r.id = 10 THEN 'Diseño (exclusivo_rol_id = 10)'
        ELSE 'CEO (exclusivo_rol_id = 1)'
    END as mapeo_preguntas
FROM "public"."roles" r
ORDER BY r.id;
