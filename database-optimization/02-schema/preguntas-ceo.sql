-- ============================================================================
-- PREGUNTAS PARA CEO
-- ============================================================================
-- Rol incluido:
--   - Rol ID 1: CEO (area_id: 1, nivel_id: 6)
-- ============================================================================

-- ============================================================================
-- ROL 1: CEO
-- ============================================================================

-- ADOPCIÓN - Rol 1
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension", "exclusivo_nivel_id") VALUES
('CEO-A1', 'Cuestionario', 'Adopción', '1', '1', '¿Con qué frecuencia evalúa y aprueba estrategias de implementación de Gen-AI en su organización?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb, 6),

('CEO-A2', 'Cuestionario', 'Adopción', '1', '1', '¿Con qué frecuencia asigna presupuesto y recursos para proyectos de Gen-AI en su organización?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Estrategia"]'::jsonb, 6),

('CEO-A3', 'Cuestionario', 'Adopción', '1', '1', '¿Con qué frecuencia usa Gen-AI para análisis estratégico y toma de decisiones ejecutivas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb, 6),

('CEO-A4', 'Cuestionario', 'Adopción', '1', '1', '¿Con qué frecuencia mide el ROI y el impacto de Gen-AI en la productividad y resultados de su organización?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Estrategia"]'::jsonb, 6),

('CEO-A5', 'Cuestionario', 'Adopción', '1', '1', '¿Con qué frecuencia promueve la capacitación y adopción de Gen-AI entre los líderes y equipos de su organización?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Aplicación"]'::jsonb, 6),

('CEO-A6', 'Cuestionario', 'Adopción', '1', '1', '¿Con qué frecuencia usa Gen-AI para generar comunicaciones ejecutivas, presentaciones o reportes estratégicos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb, 6);

-- CONOCIMIENTO - Rol 1
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension", "exclusivo_nivel_id") VALUES
('CEO-C1', 'Cuestionario', 'Conocimiento', '1', '1', '¿Cuál es el factor más crítico al implementar Gen-AI a nivel organizacional?', 'Multiple Choice (una respuesta)', '["A) Implementar sin planificación estratégica", "B) Tener una estrategia clara, gobernanza, capacitación del equipo y medición de resultados", "C) Usar solo herramientas gratuitas", "D) Delegar completamente a TI"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Tener una estrategia clara, gobernanza, capacitación del equipo y medición de resultados', '["Conocimiento", "Estrategia"]'::jsonb, 6),

('CEO-C2', 'Cuestionario', 'Conocimiento', '1', '1', '¿Qué debe considerar un CEO al evaluar el ROI de Gen-AI en su organización?', 'Multiple Choice (una respuesta)', '["A) Solo el costo de las herramientas", "B) Ahorro de tiempo, mejora en calidad, satisfacción del equipo, reducción de errores y aumento de productividad", "C) Solo métricas de uso", "D) Ignorar el ROI"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Ahorro de tiempo, mejora en calidad, satisfacción del equipo, reducción de errores y aumento de productividad', '["Conocimiento", "Productividad"]'::jsonb, 6),

('CEO-C3', 'Cuestionario', 'Conocimiento', '1', '1', '¿Cuál es la mejor práctica para promover la adopción de Gen-AI en una organización?', 'Multiple Choice (una respuesta)', '["A) Implementar sin capacitación", "B) Liderazgo visible, capacitación estructurada, casos de uso claros y apoyo continuo", "C) Forzar su uso sin explicación", "D) Dejar que cada área lo descubra solo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Liderazgo visible, capacitación estructurada, casos de uso claros y apoyo continuo', '["Conocimiento", "Aplicación"]'::jsonb, 6),

('CEO-C4', 'Cuestionario', 'Conocimiento', '1', '1', '¿Qué aspectos de seguridad y gobernanza son esenciales al implementar Gen-AI a nivel organizacional?', 'Multiple Choice (una respuesta)', '["A) No implementar controles de seguridad", "B) Políticas claras, protección de datos, cumplimiento normativo y auditorías regulares", "C) Usar cualquier herramienta disponible", "D) Ignorar la privacidad de datos"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Políticas claras, protección de datos, cumplimiento normativo y auditorías regulares', '["Conocimiento", "Estrategia"]'::jsonb, 6),

('CEO-C5', 'Cuestionario', 'Conocimiento', '1', '1', '¿Cómo debe un CEO priorizar inversiones en Gen-AI?', 'Multiple Choice (una respuesta)', '["A) Invertir en todas las herramientas disponibles", "B) Evaluar impacto estratégico, ROI potencial, alineación con objetivos y recursos disponibles", "C) No invertir nunca", "D) Invertir solo en lo más barato"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Evaluar impacto estratégico, ROI potencial, alineación con objetivos y recursos disponibles', '["Conocimiento", "Inversión"]'::jsonb, 6),

('CEO-C6', 'Cuestionario', 'Conocimiento', '1', '1', '¿Qué métricas son más relevantes para un CEO al medir el éxito de Gen-AI en su organización?', 'Multiple Choice (una respuesta)', '["A) Solo número de herramientas usadas", "B) Productividad mejorada, calidad de resultados, satisfacción del equipo, ROI y adopción por área", "C) Solo tiempo de uso", "D) No medir nada"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Productividad mejorada, calidad de resultados, satisfacción del equipo, ROI y adopción por área', '["Conocimiento", "Productividad"]'::jsonb, 6);




















