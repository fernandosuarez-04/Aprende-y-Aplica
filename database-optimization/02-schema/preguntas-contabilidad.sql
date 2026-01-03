-- ============================================================================
-- PREGUNTAS PARA ROLES DE CONTABILIDAD
-- ============================================================================
-- Roles incluidos:
--   - Rol ID 15: Dirección/Jefatura de Contabilidad (area_id: 7)
--   - Rol ID 22: Miembros de Contabilidad (area_id: 7)
-- ============================================================================

-- ============================================================================
-- ROL 15: DIRECCIÓN/JEFATURA DE CONTABILIDAD
-- ============================================================================

-- ADOPCIÓN - Rol 15
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('DC-A1', 'Cuestionario', 'Adopción', '7', '15', '¿Con qué frecuencia usa Gen-AI para generar reportes contables y estados financieros?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('DC-A2', 'Cuestionario', 'Adopción', '7', '15', '¿Con qué frecuencia emplea Gen-AI para automatizar procesos de conciliación y cierre contable?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('DC-A3', 'Cuestionario', 'Adopción', '7', '15', '¿Con qué frecuencia utiliza Gen-AI para analizar variaciones presupuestarias y explicar desviaciones?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('DC-A4', 'Cuestionario', 'Adopción', '7', '15', '¿Con qué frecuencia aplica Gen-AI para optimizar procesos de facturación y gestión de cuentas por cobrar/pagar?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('DC-A5', 'Cuestionario', 'Adopción', '7', '15', '¿Con qué frecuencia planifica mejoras en procesos contables usando insights de Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb),

('DC-A6', 'Cuestionario', 'Adopción', '7', '15', '¿Con qué frecuencia invierte en capacitación de su equipo sobre el uso seguro de Gen-AI en contabilidad?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Estrategia"]'::jsonb);

-- CONOCIMIENTO - Rol 15
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('DC-C1', 'Cuestionario', 'Conocimiento', '7', '15', 'Al usar Gen-AI para reportes contables, práctica más segura', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Validar todos los cálculos, revisar con sistemas origen y mantener auditoría", "C) Sin validar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar todos los cálculos, revisar con sistemas origen y mantener auditoría', '["Conocimiento"]'::jsonb),

('DC-C2', 'Cuestionario', 'Conocimiento', '7', '15', 'Para proteger información financiera al usar Gen-AI, práctica esencial', 'Multiple Choice (una respuesta)', '["A) Compartir libremente", "B) Usar entornos seguros, no compartir datos sensibles y cumplir regulaciones", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Usar entornos seguros, no compartir datos sensibles y cumplir regulaciones', '["Estrategia", "Conocimiento"]'::jsonb),

('DC-C3', 'Cuestionario', 'Conocimiento', '7', '15', 'Al medir el impacto de Gen-AI en contabilidad, métrica más relevante', 'Multiple Choice (una respuesta)', '["A) Número de herramientas", "B) Reducción de tiempo de cierre, errores y costos vs. inversión", "C) Colores usados", "D) Número de usuarios"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Reducción de tiempo de cierre, errores y costos vs. inversión', '["Productividad", "Conocimiento"]'::jsonb),

('DC-C4', 'Cuestionario', 'Conocimiento', '7', '15', 'Para automatizar procesos contables con Gen-AI, consideración crítica', 'Multiple Choice (una respuesta)', '["A) Automatizar sin validar", "B) Probar en entorno controlado, validar exactitud numérica y mantener controles", "C) Sin pruebas", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Probar en entorno controlado, validar exactitud numérica y mantener controles', '["Aplicación", "Conocimiento"]'::jsonb),

('DC-C5', 'Cuestionario', 'Conocimiento', '7', '15', 'Para capacitar a un equipo contable en Gen-AI, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Un solo taller", "B) Programa continuo con énfasis en seguridad, exactitud y mejores prácticas", "C) Solo documentación", "D) Sin capacitación"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Programa continuo con énfasis en seguridad, exactitud y mejores prácticas', '["Inversión", "Conocimiento"]'::jsonb),

('DC-C6', 'Cuestionario', 'Conocimiento', '7', '15', 'Al planificar la adopción de Gen-AI en contabilidad, qué priorizar', 'Multiple Choice (una respuesta)', '["A) Implementar todo de inmediato", "B) Empezar con procesos de bajo riesgo, validar exactitud y escalar gradualmente", "C) Sin planificación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Empezar con procesos de bajo riesgo, validar exactitud y escalar gradualmente', '["Estrategia", "Conocimiento"]'::jsonb);

-- ============================================================================
-- ROL 22: MIEMBROS DE CONTABILIDAD
-- ============================================================================

-- ADOPCIÓN - Rol 22
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('MC-A1', 'Cuestionario', 'Adopción', '7', '22', '¿Con qué frecuencia usa Gen-AI para generar asientos contables o pólizas tipo?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('MC-A2', 'Cuestionario', 'Adopción', '7', '22', '¿Con qué frecuencia emplea Gen-AI para conciliar cuentas o verificar saldos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('MC-A3', 'Cuestionario', 'Adopción', '7', '22', '¿Con qué frecuencia utiliza Gen-AI para analizar movimientos contables o identificar inconsistencias?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('MC-A4', 'Cuestionario', 'Adopción', '7', '22', '¿Con qué frecuencia aplica Gen-AI para generar reportes o estados financieros auxiliares?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('MC-A5', 'Cuestionario', 'Adopción', '7', '22', '¿Con qué frecuencia usa Gen-AI para optimizar tareas administrativas contables?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('MC-A6', 'Cuestionario', 'Adopción', '7', '22', '¿Con qué frecuencia busca aprender nuevas formas de usar Gen-AI para mejorar su trabajo contable?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Inversión"]'::jsonb);

-- CONOCIMIENTO - Rol 22
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('MC-C1', 'Cuestionario', 'Conocimiento', '7', '22', 'Al usar Gen-AI para asientos contables, práctica más segura', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Revisar cuentas, validar montos y verificar con documentación de soporte", "C) Sin validar", "D) Solo copiar"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar cuentas, validar montos y verificar con documentación de soporte', '["Conocimiento"]'::jsonb),

('MC-C2', 'Cuestionario', 'Conocimiento', '7', '22', 'Para proteger información financiera al usar Gen-AI, qué hacer', 'Multiple Choice (una respuesta)', '["A) Compartir libremente", "B) No compartir datos sensibles, usar información de ejemplo y cumplir políticas", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) No compartir datos sensibles, usar información de ejemplo y cumplir políticas', '["Conocimiento"]'::jsonb),

('MC-C3', 'Cuestionario', 'Conocimiento', '7', '22', 'Al generar reportes con Gen-AI, cómo asegurar exactitud', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Validar cálculos, verificar con sistemas origen y revisar coherencia", "C) Sin validar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar cálculos, verificar con sistemas origen y revisar coherencia', '["Productividad", "Conocimiento"]'::jsonb),

('MC-C4', 'Cuestionario', 'Conocimiento', '7', '22', 'Para mejorar el uso de Gen-AI en contabilidad, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Solo leer", "B) Practicar con casos reales, validar siempre resultados y mantener controles", "C) Un solo tutorial", "D) Sin práctica"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Practicar con casos reales, validar siempre resultados y mantener controles', '["Aplicación", "Conocimiento"]'::jsonb),

('MC-C5', 'Cuestionario', 'Conocimiento', '7', '22', 'Al conciliar cuentas con Gen-AI, qué verificar', 'Multiple Choice (una respuesta)', '["A) Confiar completamente", "B) Validar saldos con sistemas origen, revisar movimientos y documentar diferencias", "C) Sin validar", "D) Solo números"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar saldos con sistemas origen, revisar movimientos y documentar diferencias', '["Conocimiento"]'::jsonb),

('MC-C6', 'Cuestionario', 'Conocimiento', '7', '22', 'Para optimizar tareas contables con Gen-AI, mejor práctica', 'Multiple Choice (una respuesta)', '["A) Automatizar todo", "B) Identificar tareas repetitivas, validar exactitud y mantener supervisión en procesos críticos", "C) Sin validación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Identificar tareas repetitivas, validar exactitud y mantener supervisión en procesos críticos', '["Productividad", "Conocimiento"]'::jsonb);




















