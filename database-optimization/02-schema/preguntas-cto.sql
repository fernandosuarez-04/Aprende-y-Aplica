-- ============================================================================
-- PREGUNTAS PARA CTO / DIRECTOR(A) DE TECNOLOGÍA
-- ============================================================================
-- Rol incluido:
--   - Rol ID 3: CTO / Director(a) de Tecnología (area_id: 9, nivel_id: 2)
-- ============================================================================

-- ============================================================================
-- ROL 3: CTO / DIRECTOR(A) DE TECNOLOGÍA
-- ============================================================================

-- ADOPCIÓN - Rol 3
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension", "exclusivo_nivel_id") VALUES
('CTO-A1', 'Cuestionario', 'Adopción', '9', '3', '¿Con qué frecuencia define la arquitectura y estrategia tecnológica para implementar Gen-AI en su organización?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb, 2),

('CTO-A2', 'Cuestionario', 'Adopción', '9', '3', '¿Con qué frecuencia establece políticas de seguridad, gobernanza y cumplimiento para el uso de Gen-AI en su organización?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb, 2),

('CTO-A3', 'Cuestionario', 'Adopción', '9', '3', '¿Con qué frecuencia evalúa y selecciona plataformas, APIs o modelos de Gen-AI para integrar en la infraestructura tecnológica?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Estrategia"]'::jsonb, 2),

('CTO-A4', 'Cuestionario', 'Adopción', '9', '3', '¿Con qué frecuencia mide el impacto de Gen-AI en la eficiencia, productividad y calidad del desarrollo tecnológico?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Estrategia"]'::jsonb, 2),

('CTO-A5', 'Cuestionario', 'Adopción', '9', '3', '¿Con qué frecuencia planifica el presupuesto y recursos necesarios para infraestructura y herramientas de Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Estrategia"]'::jsonb, 2),

('CTO-A6', 'Cuestionario', 'Adopción', '9', '3', '¿Con qué frecuencia capacita y desarrolla a su equipo técnico en el uso avanzado de Gen-AI para desarrollo e innovación?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Aplicación"]'::jsonb, 2);

-- CONOCIMIENTO - Rol 3
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension", "exclusivo_nivel_id") VALUES
('CTO-C1', 'Cuestionario', 'Conocimiento', '9', '3', '¿Cuál es el factor más crítico al diseñar la arquitectura para Gen-AI en una organización?', 'Multiple Choice (una respuesta)', '["A) Implementar sin planificación", "B) Escalabilidad, seguridad, integración con sistemas existentes, gobernanza de datos y monitoreo continuo", "C) Usar solo servicios públicos", "D) Ignorar la seguridad"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Escalabilidad, seguridad, integración con sistemas existentes, gobernanza de datos y monitoreo continuo', '["Conocimiento", "Estrategia"]'::jsonb, 2),

('CTO-C2', 'Cuestionario', 'Conocimiento', '9', '3', '¿Qué debe considerar un CTO al evaluar el ROI de Gen-AI en desarrollo tecnológico?', 'Multiple Choice (una respuesta)', '["A) Solo el costo de APIs", "B) Velocidad de desarrollo, calidad de código, reducción de bugs, productividad del equipo y tiempo ahorrado", "C) Solo número de líneas generadas", "D) Ignorar el ROI"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Velocidad de desarrollo, calidad de código, reducción de bugs, productividad del equipo y tiempo ahorrado', '["Conocimiento", "Productividad"]'::jsonb, 2),

('CTO-C3', 'Cuestionario', 'Conocimiento', '9', '3', '¿Cuál es la mejor práctica para gobernanza de Gen-AI en una organización tecnológica?', 'Multiple Choice (una respuesta)', '["A) Permitir uso libre sin controles", "B) Políticas claras, auditorías de seguridad, control de acceso, revisión de outputs y cumplimiento normativo", "C) Usar solo herramientas internas", "D) No implementar gobernanza"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Políticas claras, auditorías de seguridad, control de acceso, revisión de outputs y cumplimiento normativo', '["Conocimiento", "Estrategia"]'::jsonb, 2),

('CTO-C4', 'Cuestionario', 'Conocimiento', '9', '3', '¿Qué aspectos son esenciales al integrar Gen-AI en sistemas legacy o existentes?', 'Multiple Choice (una respuesta)', '["A) Reemplazar todo el sistema", "B) Análisis de compatibilidad, APIs intermedias, pruebas exhaustivas, rollback plan y monitoreo", "C) Integrar sin pruebas", "D) Ignorar sistemas existentes"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Análisis de compatibilidad, APIs intermedias, pruebas exhaustivas, rollback plan y monitoreo', '["Conocimiento", "Aplicación"]'::jsonb, 2),

('CTO-C5', 'Cuestionario', 'Conocimiento', '9', '3', '¿Cómo debe un CTO priorizar inversiones en infraestructura de Gen-AI?', 'Multiple Choice (una respuesta)', '["A) Invertir en todas las plataformas", "B) Evaluar necesidades estratégicas, costos totales, escalabilidad, seguridad y alineación con roadmap tecnológico", "C) Invertir solo en lo más barato", "D) No invertir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Evaluar necesidades estratégicas, costos totales, escalabilidad, seguridad y alineación con roadmap tecnológico', '["Conocimiento", "Inversión"]'::jsonb, 2),

('CTO-C6', 'Cuestionario', 'Conocimiento', '9', '3', '¿Qué métricas son más relevantes para un CTO al medir el éxito de Gen-AI en desarrollo?', 'Multiple Choice (una respuesta)', '["A) Solo número de herramientas usadas", "B) Velocidad de entrega, calidad de código, satisfacción del equipo, reducción de errores y eficiencia de procesos", "C) Solo tiempo de uso", "D) No medir nada"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Velocidad de entrega, calidad de código, satisfacción del equipo, reducción de errores y eficiencia de procesos', '["Conocimiento", "Productividad"]'::jsonb, 2);




















