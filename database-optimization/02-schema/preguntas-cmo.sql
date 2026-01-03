-- ============================================================================
-- PREGUNTAS PARA CMO / DIRECTOR(A) DE MARKETING
-- ============================================================================
-- Rol incluido:
--   - Rol ID 2: CMO / Director(a) de Marketing (area_id: 3, nivel_id: 2)
-- ============================================================================

-- ============================================================================
-- ROL 2: CMO / DIRECTOR(A) DE MARKETING
-- ============================================================================

-- ADOPCIÓN - Rol 2
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension", "exclusivo_nivel_id") VALUES
('CMO-A1', 'Cuestionario', 'Adopción', '3', '2', '¿Con qué frecuencia usa Gen-AI para desarrollar estrategias de marketing y posicionamiento de marca?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb, 2),

('CMO-A2', 'Cuestionario', 'Adopción', '3', '2', '¿Con qué frecuencia emplea Gen-AI para analizar datos de mercado, competencia y tendencias para decisiones estratégicas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Productividad"]'::jsonb, 2),

('CMO-A3', 'Cuestionario', 'Adopción', '3', '2', '¿Con qué frecuencia utiliza Gen-AI para generar contenido de marketing, campañas o mensajes estratégicos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Productividad"]'::jsonb, 2),

('CMO-A4', 'Cuestionario', 'Adopción', '3', '2', '¿Con qué frecuencia mide el ROI y efectividad de campañas de marketing usando insights de Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Estrategia"]'::jsonb, 2),

('CMO-A5', 'Cuestionario', 'Adopción', '3', '2', '¿Con qué frecuencia invierte en capacitación y herramientas de Gen-AI para su equipo de marketing?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Aplicación"]'::jsonb, 2),

('CMO-A6', 'Cuestionario', 'Adopción', '3', '2', '¿Con qué frecuencia usa Gen-AI para personalizar estrategias de marketing según segmentos de audiencia?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Estrategia"]'::jsonb, 2);

-- CONOCIMIENTO - Rol 2
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension", "exclusivo_nivel_id") VALUES
('CMO-C1', 'Cuestionario', 'Conocimiento', '3', '2', '¿Cuál es la mejor práctica al usar Gen-AI para estrategias de marketing?', 'Multiple Choice (una respuesta)', '["A) Generar contenido sin revisión", "B) Combinar insights de Gen-AI con datos reales, validar con audiencia objetivo y mantener coherencia de marca", "C) Usar solo para traducción", "D) Ignorar el contexto de marca"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Combinar insights de Gen-AI con datos reales, validar con audiencia objetivo y mantener coherencia de marca', '["Conocimiento", "Estrategia"]'::jsonb, 2),

('CMO-C2', 'Cuestionario', 'Conocimiento', '3', '2', '¿Qué debe considerar un CMO al medir el ROI de Gen-AI en marketing?', 'Multiple Choice (una respuesta)', '["A) Solo el costo de herramientas", "B) Mejora en engagement, conversión, tiempo ahorrado en creación de contenido y calidad de insights", "C) Solo número de posts generados", "D) Ignorar métricas"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Mejora en engagement, conversión, tiempo ahorrado en creación de contenido y calidad de insights', '["Conocimiento", "Productividad"]'::jsonb, 2),

('CMO-C3', 'Cuestionario', 'Conocimiento', '3', '2', '¿Cómo debe un CMO usar Gen-AI para análisis de mercado y competencia?', 'Multiple Choice (una respuesta)', '["A) Confiar ciegamente en los resultados", "B) Validar con múltiples fuentes, contextualizar para su industria y complementar con investigación tradicional", "C) Usar solo una herramienta", "D) No validar información"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar con múltiples fuentes, contextualizar para su industria y complementar con investigación tradicional', '["Conocimiento", "Aplicación"]'::jsonb, 2),

('CMO-C4', 'Cuestionario', 'Conocimiento', '3', '2', '¿Qué es esencial al usar Gen-AI para personalización de marketing?', 'Multiple Choice (una respuesta)', '["A) Personalizar sin datos del cliente", "B) Respetar privacidad, usar datos agregados, mantener transparencia y cumplir regulaciones", "C) Usar todos los datos disponibles", "D) Ignorar privacidad"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Respetar privacidad, usar datos agregados, mantener transparencia y cumplir regulaciones', '["Conocimiento", "Estrategia"]'::jsonb, 2),

('CMO-C5', 'Cuestionario', 'Conocimiento', '3', '2', '¿Cómo debe un CMO priorizar inversiones en Gen-AI para marketing?', 'Multiple Choice (una respuesta)', '["A) Invertir en todas las herramientas", "B) Evaluar impacto en objetivos de marca, ROI potencial, integración con stack actual y necesidades del equipo", "C) Invertir solo en lo más barato", "D) No invertir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Evaluar impacto en objetivos de marca, ROI potencial, integración con stack actual y necesidades del equipo', '["Conocimiento", "Inversión"]'::jsonb, 2),

('CMO-C6', 'Cuestionario', 'Conocimiento', '3', '2', '¿Qué métricas son más relevantes para un CMO al evaluar el éxito de Gen-AI en marketing?', 'Multiple Choice (una respuesta)', '["A) Solo número de contenidos generados", "B) Calidad de contenido, engagement mejorado, eficiencia del equipo, ROI de campañas y satisfacción del cliente", "C) Solo tiempo de uso", "D) No medir nada"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Calidad de contenido, engagement mejorado, eficiencia del equipo, ROI de campañas y satisfacción del cliente', '["Conocimiento", "Productividad"]'::jsonb, 2);




















