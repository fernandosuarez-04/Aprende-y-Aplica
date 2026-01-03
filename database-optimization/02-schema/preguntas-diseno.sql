-- ============================================================================
-- PREGUNTAS PARA ROLES DE DISEÑO/INDUSTRIAS CREATIVAS
-- ============================================================================
-- Roles incluidos:
--   - Rol ID 10: Diseño/Industrias Creativas (area_id: 11)
-- ============================================================================

-- ADOPCIÓN - Rol 10
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('DI-A1', 'Cuestionario', 'Adopción', '11', '10', '¿Con qué frecuencia usa Gen-AI para generar ideas creativas o conceptos de diseño?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Productividad"]'::jsonb),

('DI-A2', 'Cuestionario', 'Adopción', '11', '10', '¿Con qué frecuencia emplea Gen-AI para crear imágenes, gráficos o elementos visuales?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('DI-A3', 'Cuestionario', 'Adopción', '11', '10', '¿Con qué frecuencia utiliza Gen-AI para generar variaciones o iteraciones de diseños?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('DI-A4', 'Cuestionario', 'Adopción', '11', '10', '¿Con qué frecuencia aplica Gen-AI para optimizar procesos de diseño o workflows creativos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('DI-A5', 'Cuestionario', 'Adopción', '11', '10', '¿Con qué frecuencia planifica proyectos creativos usando ideas generadas por Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb),

('DI-A6', 'Cuestionario', 'Adopción', '11', '10', '¿Con qué frecuencia busca aprender nuevas técnicas de Gen-AI para mejorar su trabajo creativo?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Inversión"]'::jsonb);

-- CONOCIMIENTO - Rol 10
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('DI-C1', 'Cuestionario', 'Conocimiento', '11', '10', 'Al usar Gen-AI para generar imágenes creativas, práctica más ética', 'Multiple Choice (una respuesta)', '["A) Usar directamente sin revisar", "B) Revisar derechos de uso, verificar términos de servicio y mantener originalidad en trabajos finales", "C) Sin revisar", "D) Copiar completo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar derechos de uso, verificar términos de servicio y mantener originalidad en trabajos finales', '["Conocimiento"]'::jsonb),

('DI-C2', 'Cuestionario', 'Conocimiento', '11', '10', 'Para proteger información de clientes al usar Gen-AI en diseño, práctica esencial', 'Multiple Choice (una respuesta)', '["A) Compartir libremente", "B) No compartir información confidencial, usar datos de ejemplo y mantener confidencialidad de proyectos", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) No compartir información confidencial, usar datos de ejemplo y mantener confidencialidad de proyectos', '["Conocimiento"]'::jsonb),

('DI-C3', 'Cuestionario', 'Conocimiento', '11', '10', 'Al generar diseños con Gen-AI, cómo asegurar calidad', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Revisar coherencia, adaptar a brief del cliente y mantener estándares de marca", "C) Sin revisar", "D) Solo copiar"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar coherencia, adaptar a brief del cliente y mantener estándares de marca', '["Productividad", "Conocimiento"]'::jsonb),

('DI-C4', 'Cuestionario', 'Conocimiento', '11', '10', 'Para mejorar el uso de Gen-AI en diseño, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Solo leer", "B) Practicar con casos reales, experimentar con diferentes prompts y desarrollar estilo personal", "C) Un solo tutorial", "D) Sin práctica"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Practicar con casos reales, experimentar con diferentes prompts y desarrollar estilo personal', '["Aplicación", "Conocimiento"]'::jsonb),

('DI-C5', 'Cuestionario', 'Conocimiento', '11', '10', 'Al crear variaciones de diseño con Gen-AI, consideración importante', 'Multiple Choice (una respuesta)', '["A) Usar todas", "B) Seleccionar las mejores, adaptar según necesidades del proyecto y mantener coherencia visual", "C) Sin seleccionar", "D) Solo la primera"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Seleccionar las mejores, adaptar según necesidades del proyecto y mantener coherencia visual', '["Aplicación", "Conocimiento"]'::jsonb),

('DI-C6', 'Cuestionario', 'Conocimiento', '11', '10', 'Para optimizar tiempo con Gen-AI en diseño, mejor práctica', 'Multiple Choice (una respuesta)', '["A) Automatizar todo", "B) Usar para generación de ideas y variaciones, mantener supervisión creativa y enfocarse en refinamiento", "C) Sin planificación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Usar para generación de ideas y variaciones, mantener supervisión creativa y enfocarse en refinamiento', '["Productividad", "Conocimiento"]'::jsonb);




















