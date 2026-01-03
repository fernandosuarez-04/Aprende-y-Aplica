-- ============================================================================
-- PREGUNTAS PARA MIEMBROS DE MARKETING
-- ============================================================================
-- Roles incluidos:
--   - Rol ID 18: Miembros de Marketing (area_id: 3)
-- ============================================================================

-- ADOPCIÓN - Rol 18
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('MM-A1', 'Cuestionario', 'Adopción', '3', '18', '¿Con qué frecuencia usa Gen-AI para generar contenido de redes sociales (posts, captions, hashtags)?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Productividad"]'::jsonb),

('MM-A2', 'Cuestionario', 'Adopción', '3', '18', '¿Con qué frecuencia emplea Gen-AI para crear emails de marketing o newsletters?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('MM-A3', 'Cuestionario', 'Adopción', '3', '18', '¿Con qué frecuencia utiliza Gen-AI para analizar datos de campañas o métricas de marketing?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('MM-A4', 'Cuestionario', 'Adopción', '3', '18', '¿Con qué frecuencia aplica Gen-AI para generar ideas creativas o conceptos de campañas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('MM-A5', 'Cuestionario', 'Adopción', '3', '18', '¿Con qué frecuencia usa Gen-AI para optimizar tareas administrativas de marketing?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('MM-A6', 'Cuestionario', 'Adopción', '3', '18', '¿Con qué frecuencia busca aprender nuevas formas de usar Gen-AI para mejorar su trabajo en marketing?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Inversión"]'::jsonb);

-- CONOCIMIENTO - Rol 18
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('MM-C1', 'Cuestionario', 'Conocimiento', '3', '18', 'Al usar Gen-AI para contenido de marketing, práctica más efectiva', 'Multiple Choice (una respuesta)', '["A) Publicar directamente", "B) Revisar tono de marca, personalizar según audiencia y verificar información antes de publicar", "C) Sin revisar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar tono de marca, personalizar según audiencia y verificar información antes de publicar', '["Aplicación", "Conocimiento"]'::jsonb),

('MM-C2', 'Cuestionario', 'Conocimiento', '3', '18', 'Para proteger datos de clientes al usar Gen-AI en marketing, qué hacer', 'Multiple Choice (una respuesta)', '["A) Compartir libremente", "B) No compartir información confidencial, usar datos anonimizados y cumplir regulaciones", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) No compartir información confidencial, usar datos anonimizados y cumplir regulaciones', '["Conocimiento"]'::jsonb),

('MM-C3', 'Cuestionario', 'Conocimiento', '3', '18', 'Al generar contenido creativo con Gen-AI, cómo asegurar calidad', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Revisar coherencia, alinear con valores de marca y personalizar para la audiencia", "C) Sin revisar", "D) Solo copiar"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar coherencia, alinear con valores de marca y personalizar para la audiencia', '["Productividad", "Conocimiento"]'::jsonb),

('MM-C4', 'Cuestionario', 'Conocimiento', '3', '18', 'Para mejorar el uso de Gen-AI en marketing, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Solo leer", "B) Practicar con casos reales, experimentar con diferentes prompts y aprender de resultados", "C) Un solo tutorial", "D) Sin práctica"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Practicar con casos reales, experimentar con diferentes prompts y aprender de resultados', '["Aplicación", "Conocimiento"]'::jsonb),

('MM-C5', 'Cuestionario', 'Conocimiento', '3', '18', 'Al analizar métricas con Gen-AI, qué verificar', 'Multiple Choice (una respuesta)', '["A) Confiar completamente", "B) Validar con datos reales, revisar contexto y confirmar con herramientas de analytics", "C) Sin validar", "D) Solo números"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar con datos reales, revisar contexto y confirmar con herramientas de analytics', '["Conocimiento"]'::jsonb),

('MM-C6', 'Cuestionario', 'Conocimiento', '3', '18', 'Para optimizar tiempo con Gen-AI en marketing, mejor práctica', 'Multiple Choice (una respuesta)', '["A) Automatizar todo", "B) Identificar tareas repetitivas, usar Gen-AI para ellas y enfocarse en estrategia creativa", "C) Sin planificación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Identificar tareas repetitivas, usar Gen-AI para ellas y enfocarse en estrategia creativa', '["Productividad", "Conocimiento"]'::jsonb);




















