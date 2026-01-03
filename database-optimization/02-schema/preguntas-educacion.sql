-- ============================================================================
-- PREGUNTAS PARA ROLES DE EDUCACIÓN
-- ============================================================================
-- Roles incluidos:
--   - Rol ID 8: Academia/Investigación (area_id: 10)
--   - Rol ID 9: Educación/Docentes (area_id: 10)
-- ============================================================================

-- ============================================================================
-- ROL 8: ACADEMIA/INVESTIGACIÓN
-- ============================================================================

-- ADOPCIÓN - Rol 8
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('AI-A1', 'Cuestionario', 'Adopción', '10', '8', '¿Con qué frecuencia usa Gen-AI para generar resúmenes de artículos o papers académicos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Productividad"]'::jsonb),

('AI-A2', 'Cuestionario', 'Adopción', '10', '8', '¿Con qué frecuencia emplea Gen-AI para analizar datos de investigación o generar insights?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('AI-A3', 'Cuestionario', 'Adopción', '10', '8', '¿Con qué frecuencia utiliza Gen-AI para escribir o revisar papers y documentos académicos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('AI-A4', 'Cuestionario', 'Adopción', '10', '8', '¿Con qué frecuencia aplica Gen-AI para generar ideas de investigación o hipótesis?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('AI-A5', 'Cuestionario', 'Adopción', '10', '8', '¿Con qué frecuencia planifica proyectos de investigación usando insights de Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb),

('AI-A6', 'Cuestionario', 'Adopción', '10', '8', '¿Con qué frecuencia invierte tiempo en aprender nuevas aplicaciones de Gen-AI para investigación?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Aplicación"]'::jsonb);

-- CONOCIMIENTO - Rol 8
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('AI-C1', 'Cuestionario', 'Conocimiento', '10', '8', 'Al usar Gen-AI para papers académicos, práctica más ética', 'Multiple Choice (una respuesta)', '["A) Publicar directamente", "B) Usar como apoyo, citar adecuadamente, revisar contenido y mantener integridad académica", "C) Sin revisar", "D) Copiar completo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Usar como apoyo, citar adecuadamente, revisar contenido y mantener integridad académica', '["Conocimiento"]'::jsonb),

('AI-C2', 'Cuestionario', 'Conocimiento', '10', '8', 'Para proteger datos de investigación al usar Gen-AI, práctica esencial', 'Multiple Choice (una respuesta)', '["A) Compartir libremente", "B) No compartir datos sensibles, usar información anonimizada y cumplir protocolos éticos", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) No compartir datos sensibles, usar información anonimizada y cumplir protocolos éticos', '["Estrategia", "Conocimiento"]'::jsonb),

('AI-C3', 'Cuestionario', 'Conocimiento', '10', '8', 'Al analizar datos de investigación con Gen-AI, qué verificar', 'Multiple Choice (una respuesta)', '["A) Confiar completamente", "B) Validar con métodos estadísticos, revisar metodología y confirmar con análisis tradicionales", "C) Sin validar", "D) Solo números"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar con métodos estadísticos, revisar metodología y confirmar con análisis tradicionales', '["Conocimiento"]'::jsonb),

('AI-C4', 'Cuestionario', 'Conocimiento', '10', '8', 'Para mejorar el uso de Gen-AI en investigación, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Solo leer", "B) Practicar con casos reales, aprender mejores prácticas y mantener rigor científico", "C) Un solo tutorial", "D) Sin práctica"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Practicar con casos reales, aprender mejores prácticas y mantener rigor científico', '["Aplicación", "Conocimiento"]'::jsonb),

('AI-C5', 'Cuestionario', 'Conocimiento', '10', '8', 'Al generar hipótesis con Gen-AI, consideración importante', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Validar con literatura existente, revisar viabilidad y diseñar experimentos apropiados", "C) Sin validar", "D) Solo copiar"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar con literatura existente, revisar viabilidad y diseñar experimentos apropiados', '["Estrategia", "Conocimiento"]'::jsonb),

('AI-C6', 'Cuestionario', 'Conocimiento', '10', '8', 'Para optimizar tiempo con Gen-AI en investigación, mejor práctica', 'Multiple Choice (una respuesta)', '["A) Automatizar todo", "B) Usar para tareas repetitivas, mantener supervisión en análisis críticos y validar resultados", "C) Sin planificación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Usar para tareas repetitivas, mantener supervisión en análisis críticos y validar resultados', '["Productividad", "Conocimiento"]'::jsonb);

-- ============================================================================
-- ROL 9: EDUCACIÓN/DOCENTES
-- ============================================================================

-- ADOPCIÓN - Rol 9
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('ED-A1', 'Cuestionario', 'Adopción', '10', '9', '¿Con qué frecuencia usa Gen-AI para crear materiales didácticos o contenido educativo?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Productividad"]'::jsonb),

('ED-A2', 'Cuestionario', 'Adopción', '10', '9', '¿Con qué frecuencia emplea Gen-AI para generar ejercicios, actividades o evaluaciones?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('ED-A3', 'Cuestionario', 'Adopción', '10', '9', '¿Con qué frecuencia utiliza Gen-AI para personalizar contenido según necesidades de estudiantes?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('ED-A4', 'Cuestionario', 'Adopción', '10', '9', '¿Con qué frecuencia aplica Gen-AI para optimizar tareas administrativas docentes?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('ED-A5', 'Cuestionario', 'Adopción', '10', '9', '¿Con qué frecuencia planifica estrategias de enseñanza usando ideas generadas por Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb),

('ED-A6', 'Cuestionario', 'Adopción', '10', '9', '¿Con qué frecuencia invierte tiempo en aprender nuevas formas de usar Gen-AI para mejorar su enseñanza?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Aplicación"]'::jsonb);

-- CONOCIMIENTO - Rol 9
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('ED-C1', 'Cuestionario', 'Conocimiento', '10', '9', 'Al usar Gen-AI para materiales educativos, práctica más efectiva', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Revisar contenido, adaptar a nivel de estudiantes y verificar precisión antes de usar", "C) Sin revisar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar contenido, adaptar a nivel de estudiantes y verificar precisión antes de usar', '["Aplicación", "Conocimiento"]'::jsonb),

('ED-C2', 'Cuestionario', 'Conocimiento', '10', '9', 'Para proteger datos de estudiantes al usar Gen-AI, práctica esencial', 'Multiple Choice (una respuesta)', '["A) Compartir libremente", "B) No compartir información personal, usar datos de ejemplo y cumplir regulaciones de privacidad", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) No compartir información personal, usar datos de ejemplo y cumplir regulaciones de privacidad', '["Conocimiento"]'::jsonb),

('ED-C3', 'Cuestionario', 'Conocimiento', '10', '9', 'Al generar evaluaciones con Gen-AI, cómo asegurar calidad', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Revisar preguntas, validar nivel de dificultad y alinear con objetivos de aprendizaje", "C) Sin revisar", "D) Solo copiar"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar preguntas, validar nivel de dificultad y alinear con objetivos de aprendizaje', '["Productividad", "Conocimiento"]'::jsonb),

('ED-C4', 'Cuestionario', 'Conocimiento', '10', '9', 'Para mejorar el uso de Gen-AI en educación, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Solo leer", "B) Practicar con casos reales, adaptar a contexto educativo y mantener enfoque pedagógico", "C) Un solo tutorial", "D) Sin práctica"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Practicar con casos reales, adaptar a contexto educativo y mantener enfoque pedagógico', '["Aplicación", "Conocimiento"]'::jsonb),

('ED-C5', 'Cuestionario', 'Conocimiento', '10', '9', 'Al personalizar contenido con Gen-AI, consideración importante', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Adaptar a necesidades específicas de estudiantes, revisar relevancia y mantener accesibilidad", "C) Sin adaptar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Adaptar a necesidades específicas de estudiantes, revisar relevancia y mantener accesibilidad', '["Aplicación", "Conocimiento"]'::jsonb),

('ED-C6', 'Cuestionario', 'Conocimiento', '10', '9', 'Para optimizar tiempo con Gen-AI en enseñanza, mejor práctica', 'Multiple Choice (una respuesta)', '["A) Automatizar todo", "B) Usar para tareas repetitivas, mantener supervisión en contenido educativo y enfocarse en interacción con estudiantes", "C) Sin planificación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Usar para tareas repetitivas, mantener supervisión en contenido educativo y enfocarse en interacción con estudiantes', '["Productividad", "Conocimiento"]'::jsonb);




















