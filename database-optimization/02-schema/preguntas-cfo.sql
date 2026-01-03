-- ============================================================================
-- PREGUNTAS PARA DIRECCIÓN DE FINANZAS (CFO)
-- ============================================================================
-- Rol incluido:
--   - Rol ID 13: Dirección de Finanzas (CFO) (area_id: 5, nivel_id: 2)
-- ============================================================================

-- ============================================================================
-- ROL 13: DIRECCIÓN DE FINANZAS (CFO)
-- ============================================================================

-- ADOPCIÓN - Rol 13
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension", "exclusivo_nivel_id") VALUES
('CFO-A1', 'Cuestionario', 'Adopción', '5', '13', '¿Con qué frecuencia usa Gen-AI para análisis financiero estratégico y proyecciones de negocio?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb, 2),

('CFO-A2', 'Cuestionario', 'Adopción', '5', '13', '¿Con qué frecuencia emplea Gen-AI para generar reportes financieros, análisis de presupuesto o presentaciones ejecutivas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb, 2),

('CFO-A3', 'Cuestionario', 'Adopción', '5', '13', '¿Con qué frecuencia utiliza Gen-AI para evaluar y optimizar inversiones en tecnología o proyectos estratégicos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Estrategia"]'::jsonb, 2),

('CFO-A4', 'Cuestionario', 'Adopción', '5', '13', '¿Con qué frecuencia mide el ROI y el impacto financiero de implementaciones de Gen-AI en su organización?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Estrategia"]'::jsonb, 2),

('CFO-A5', 'Cuestionario', 'Adopción', '5', '13', '¿Con qué frecuencia planifica el presupuesto y recursos financieros para proyectos de Gen-AI en su organización?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Estrategia"]'::jsonb, 2),

('CFO-A6', 'Cuestionario', 'Adopción', '5', '13', '¿Con qué frecuencia usa Gen-AI para automatizar procesos financieros, reconciliaciones o análisis de datos contables?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb, 2);

-- CONOCIMIENTO - Rol 13
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension", "exclusivo_nivel_id") VALUES
('CFO-C1', 'Cuestionario', 'Conocimiento', '5', '13', '¿Cuál es el factor más importante al evaluar el ROI de Gen-AI desde una perspectiva financiera?', 'Multiple Choice (una respuesta)', '["A) Solo el costo inicial", "B) Ahorro de tiempo, reducción de errores, mejora en productividad, costos evitados y valor generado a largo plazo", "C) Solo número de herramientas", "D) Ignorar el ROI"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Ahorro de tiempo, reducción de errores, mejora en productividad, costos evitados y valor generado a largo plazo', '["Conocimiento", "Productividad"]'::jsonb, 2),

('CFO-C2', 'Cuestionario', 'Conocimiento', '5', '13', '¿Qué debe considerar un CFO al presupuestar inversiones en Gen-AI?', 'Multiple Choice (una respuesta)', '["A) Solo costos de licencias", "B) Costos totales de propiedad, capacitación, integración, mantenimiento y ROI esperado", "C) Solo precio inicial", "D) No presupuestar"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Costos totales de propiedad, capacitación, integración, mantenimiento y ROI esperado', '["Conocimiento", "Inversión"]'::jsonb, 2),

('CFO-C3', 'Cuestionario', 'Conocimiento', '5', '13', '¿Cuál es la mejor práctica al usar Gen-AI para análisis financiero?', 'Multiple Choice (una respuesta)', '["A) Confiar ciegamente en los resultados", "B) Validar con datos reales, revisar cálculos, contextualizar para el negocio y mantener auditoría", "C) Usar sin revisar", "D) No validar"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar con datos reales, revisar cálculos, contextualizar para el negocio y mantener auditoría', '["Conocimiento", "Aplicación"]'::jsonb, 2),

('CFO-C4', 'Cuestionario', 'Conocimiento', '5', '13', '¿Qué aspectos de seguridad y cumplimiento son críticos al usar Gen-AI en procesos financieros?', 'Multiple Choice (una respuesta)', '["A) No implementar controles", "B) Protección de datos financieros, cumplimiento normativo, auditorías, trazabilidad y controles de acceso", "C) Usar cualquier herramienta", "D) Ignorar seguridad"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Protección de datos financieros, cumplimiento normativo, auditorías, trazabilidad y controles de acceso', '["Conocimiento", "Estrategia"]'::jsonb, 2),

('CFO-C5', 'Cuestionario', 'Conocimiento', '5', '13', '¿Cómo debe un CFO priorizar inversiones en Gen-AI?', 'Multiple Choice (una respuesta)', '["A) Invertir en todas las herramientas", "B) Evaluar impacto financiero, ROI potencial, alineación estratégica, riesgos y recursos disponibles", "C) Invertir solo en lo más barato", "D) No invertir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Evaluar impacto financiero, ROI potencial, alineación estratégica, riesgos y recursos disponibles', '["Conocimiento", "Inversión"]'::jsonb, 2),

('CFO-C6', 'Cuestionario', 'Conocimiento', '5', '13', '¿Qué métricas financieras son más relevantes para un CFO al medir el éxito de Gen-AI?', 'Multiple Choice (una respuesta)', '["A) Solo costos de herramientas", "B) ROI, ahorro de costos, eficiencia mejorada, reducción de errores y productividad del equipo financiero", "C) Solo tiempo de uso", "D) No medir nada"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) ROI, ahorro de costos, eficiencia mejorada, reducción de errores y productividad del equipo financiero', '["Conocimiento", "Productividad"]'::jsonb, 2);




















