-- ============================================================================
-- PREGUNTAS PARA ROLES DE COMPRAS/SUPPLY CHAIN
-- ============================================================================
-- Roles incluidos:
--   - Rol ID 16: Dirección de Compras / Supply (area_id: 8)
--   - Rol ID 23: Miembros de Compras (area_id: 8)
-- ============================================================================

-- ============================================================================
-- ROL 16: DIRECCIÓN DE COMPRAS / SUPPLY
-- ============================================================================

-- ADOPCIÓN - Rol 16
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('DCp-A1', 'Cuestionario', 'Adopción', '8', '16', '¿Con qué frecuencia usa Gen-AI para analizar proveedores y evaluar opciones de compra?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Estrategia"]'::jsonb),

('DCp-A2', 'Cuestionario', 'Adopción', '8', '16', '¿Con qué frecuencia emplea Gen-AI para optimizar procesos de negociación y contratación?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('DCp-A3', 'Cuestionario', 'Adopción', '8', '16', '¿Con qué frecuencia utiliza Gen-AI para gestionar inventarios y predecir demanda?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('DCp-A4', 'Cuestionario', 'Adopción', '8', '16', '¿Con qué frecuencia aplica Gen-AI para generar reportes de compras y análisis de costos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('DCp-A5', 'Cuestionario', 'Adopción', '8', '16', '¿Con qué frecuencia planifica estrategias de compra usando insights de Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb),

('DCp-A6', 'Cuestionario', 'Adopción', '8', '16', '¿Con qué frecuencia invierte en herramientas de Gen-AI para mejorar procesos de compras?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Estrategia"]'::jsonb);

-- CONOCIMIENTO - Rol 16
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('DCp-C1', 'Cuestionario', 'Conocimiento', '8', '16', 'Al usar Gen-AI para evaluar proveedores, práctica más efectiva', 'Multiple Choice (una respuesta)', '["A) Confiar completamente", "B) Validar información con fuentes oficiales, revisar referencias y mantener criterios objetivos", "C) Sin validar", "D) Solo números"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar información con fuentes oficiales, revisar referencias y mantener criterios objetivos', '["Estrategia", "Conocimiento"]'::jsonb),

('DCp-C2', 'Cuestionario', 'Conocimiento', '8', '16', 'Para proteger información comercial al usar Gen-AI, práctica esencial', 'Multiple Choice (una respuesta)', '["A) Compartir libremente", "B) No compartir términos comerciales sensibles, usar datos de ejemplo y mantener confidencialidad", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) No compartir términos comerciales sensibles, usar datos de ejemplo y mantener confidencialidad', '["Conocimiento"]'::jsonb),

('DCp-C3', 'Cuestionario', 'Conocimiento', '8', '16', 'Al medir el impacto de Gen-AI en compras, métrica más relevante', 'Multiple Choice (una respuesta)', '["A) Número de herramientas", "B) Reducción de costos, tiempo de proceso y mejora en calidad vs. inversión", "C) Colores usados", "D) Número de usuarios"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Reducción de costos, tiempo de proceso y mejora en calidad vs. inversión', '["Productividad", "Conocimiento"]'::jsonb),

('DCp-C4', 'Cuestionario', 'Conocimiento', '8', '16', 'Para capacitar a un equipo de compras en Gen-AI, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Un solo taller", "B) Programa continuo con casos prácticos y énfasis en negociación efectiva", "C) Solo documentación", "D) Sin capacitación"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Programa continuo con casos prácticos y énfasis en negociación efectiva', '["Inversión", "Conocimiento"]'::jsonb),

('DCp-C5', 'Cuestionario', 'Conocimiento', '8', '16', 'Al planificar la adopción de Gen-AI en compras, qué priorizar', 'Multiple Choice (una respuesta)', '["A) Implementar todo de inmediato", "B) Empezar con procesos de bajo riesgo, validar ahorros y escalar gradualmente", "C) Sin planificación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Empezar con procesos de bajo riesgo, validar ahorros y escalar gradualmente', '["Estrategia", "Conocimiento"]'::jsonb),

('DCp-C6', 'Cuestionario', 'Conocimiento', '8', '16', 'Para generar contratos o documentos de compra con Gen-AI, práctica recomendada', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Revisar términos, validar con legal y personalizar según necesidades específicas", "C) Sin revisar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar términos, validar con legal y personalizar según necesidades específicas', '["Aplicación", "Conocimiento"]'::jsonb);

-- ============================================================================
-- ROL 23: MIEMBROS DE COMPRAS
-- ============================================================================

-- ADOPCIÓN - Rol 23
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('MCp-A1', 'Cuestionario', 'Adopción', '8', '23', '¿Con qué frecuencia usa Gen-AI para buscar y comparar proveedores o productos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Productividad"]'::jsonb),

('MCp-A2', 'Cuestionario', 'Adopción', '8', '23', '¿Con qué frecuencia emplea Gen-AI para generar cotizaciones o solicitudes de compra?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('MCp-A3', 'Cuestionario', 'Adopción', '8', '23', '¿Con qué frecuencia utiliza Gen-AI para analizar precios y condiciones de proveedores?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('MCp-A4', 'Cuestionario', 'Adopción', '8', '23', '¿Con qué frecuencia aplica Gen-AI para gestionar órdenes de compra y seguimiento?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('MCp-A5', 'Cuestionario', 'Adopción', '8', '23', '¿Con qué frecuencia usa Gen-AI para optimizar procesos administrativos de compras?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('MCp-A6', 'Cuestionario', 'Adopción', '8', '23', '¿Con qué frecuencia busca aprender nuevas formas de usar Gen-AI para mejorar sus procesos de compra?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Inversión"]'::jsonb);

-- CONOCIMIENTO - Rol 23
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('MCp-C1', 'Cuestionario', 'Conocimiento', '8', '23', 'Al usar Gen-AI para comparar proveedores, práctica más efectiva', 'Multiple Choice (una respuesta)', '["A) Confiar completamente", "B) Validar información, revisar referencias y considerar múltiples factores", "C) Sin validar", "D) Solo precios"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar información, revisar referencias y considerar múltiples factores', '["Aplicación", "Conocimiento"]'::jsonb),

('MCp-C2', 'Cuestionario', 'Conocimiento', '8', '23', 'Para proteger información comercial al usar Gen-AI, qué hacer', 'Multiple Choice (una respuesta)', '["A) Compartir libremente", "B) No compartir términos sensibles, usar datos de ejemplo y mantener confidencialidad", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) No compartir términos sensibles, usar datos de ejemplo y mantener confidencialidad', '["Conocimiento"]'::jsonb),

('MCp-C3', 'Cuestionario', 'Conocimiento', '8', '23', 'Al generar cotizaciones con Gen-AI, cómo asegurar calidad', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Revisar precios, validar especificaciones y verificar con proveedores", "C) Sin revisar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar precios, validar especificaciones y verificar con proveedores', '["Productividad", "Conocimiento"]'::jsonb),

('MCp-C4', 'Cuestionario', 'Conocimiento', '8', '23', 'Para mejorar el uso de Gen-AI en compras, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Solo leer", "B) Practicar con casos reales, aprender técnicas de negociación y validar resultados", "C) Un solo tutorial", "D) Sin práctica"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Practicar con casos reales, aprender técnicas de negociación y validar resultados', '["Aplicación", "Conocimiento"]'::jsonb),

('MCp-C5', 'Cuestionario', 'Conocimiento', '8', '23', 'Al analizar precios con Gen-AI, qué verificar', 'Multiple Choice (una respuesta)', '["A) Confiar completamente", "B) Validar con cotizaciones reales, revisar condiciones y comparar con mercado", "C) Sin validar", "D) Solo números"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar con cotizaciones reales, revisar condiciones y comparar con mercado', '["Conocimiento"]'::jsonb),

('MCp-C6', 'Cuestionario', 'Conocimiento', '8', '23', 'Para optimizar procesos de compra con Gen-AI, mejor práctica', 'Multiple Choice (una respuesta)', '["A) Automatizar todo", "B) Identificar tareas repetitivas, validar resultados y mantener supervisión en negociaciones importantes", "C) Sin validación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Identificar tareas repetitivas, validar resultados y mantener supervisión en negociaciones importantes', '["Productividad", "Conocimiento"]'::jsonb);




















