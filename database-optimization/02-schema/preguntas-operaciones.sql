-- ============================================================================
-- PREGUNTAS PARA ROLES DE OPERACIONES
-- ============================================================================
-- Roles incluidos:
--   - Rol ID 12: Dirección de Operaciones (area_id: 4)
--   - Rol ID 19: Miembros de Operaciones (area_id: 4)
-- ============================================================================

-- ============================================================================
-- ROL 12: DIRECCIÓN DE OPERACIONES
-- ============================================================================

-- ADOPCIÓN - Rol 12
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('DO-A1', 'Cuestionario', 'Adopción', '4', '12', '¿Con qué frecuencia usa Gen-AI para optimizar procesos operativos y flujos de trabajo en su organización?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Estrategia"]'::jsonb),

('DO-A2', 'Cuestionario', 'Adopción', '4', '12', '¿Con qué frecuencia emplea Gen-AI para automatizar tareas repetitivas y mejorar la eficiencia operativa?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('DO-A3', 'Cuestionario', 'Adopción', '4', '12', '¿Con qué frecuencia utiliza Gen-AI para generar reportes operativos y análisis de performance?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('DO-A4', 'Cuestionario', 'Adopción', '4', '12', '¿Con qué frecuencia aplica Gen-AI para mejorar la gestión de inventarios y cadena de suministro?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Productividad"]'::jsonb),

('DO-A5', 'Cuestionario', 'Adopción', '4', '12', '¿Con qué frecuencia planifica estrategias de mejora operativa usando insights de Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb),

('DO-A6', 'Cuestionario', 'Adopción', '4', '12', '¿Con qué frecuencia invierte en capacitación de su equipo sobre el uso de Gen-AI para operaciones?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Estrategia"]'::jsonb);

-- CONOCIMIENTO - Rol 12
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('DO-C1', 'Cuestionario', 'Conocimiento', '4', '12', 'Para optimizar procesos con Gen-AI, enfoque más efectivo', 'Multiple Choice (una respuesta)', '["A) Automatizar todo de inmediato", "B) Identificar procesos críticos, empezar con pilotos y medir mejoras antes de escalar", "C) Sin planificación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Identificar procesos críticos, empezar con pilotos y medir mejoras antes de escalar', '["Estrategia", "Conocimiento"]'::jsonb),

('DO-C2', 'Cuestionario', 'Conocimiento', '4', '12', 'Al medir el impacto de Gen-AI en operaciones, métrica más relevante', 'Multiple Choice (una respuesta)', '["A) Número de herramientas", "B) Reducción de tiempo, errores y costos vs. inversión realizada", "C) Colores usados", "D) Número de usuarios"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Reducción de tiempo, errores y costos vs. inversión realizada', '["Productividad", "Conocimiento"]'::jsonb),

('DO-C3', 'Cuestionario', 'Conocimiento', '4', '12', 'Para automatizar tareas operativas con Gen-AI, consideración clave', 'Multiple Choice (una respuesta)', '["A) Automatizar sin validar", "B) Probar en entorno controlado, validar resultados y tener plan de contingencia", "C) Sin pruebas", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Probar en entorno controlado, validar resultados y tener plan de contingencia', '["Aplicación", "Conocimiento"]'::jsonb),

('DO-C4', 'Cuestionario', 'Conocimiento', '4', '12', 'Al generar reportes operativos con Gen-AI, práctica recomendada', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Verificar datos, validar cálculos y revisar contexto antes de compartir", "C) Sin revisar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Verificar datos, validar cálculos y revisar contexto antes de compartir', '["Conocimiento"]'::jsonb),

('DO-C5', 'Cuestionario', 'Conocimiento', '4', '12', 'Para capacitar a un equipo operativo en Gen-AI, enfoque más efectivo', 'Multiple Choice (una respuesta)', '["A) Un solo taller", "B) Programa práctico continuo con casos reales y seguimiento de adopción", "C) Solo documentación", "D) Sin capacitación"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Programa práctico continuo con casos reales y seguimiento de adopción', '["Inversión", "Conocimiento"]'::jsonb),

('DO-C6', 'Cuestionario', 'Conocimiento', '4', '12', 'Al planificar la adopción de Gen-AI en operaciones, qué priorizar', 'Multiple Choice (una respuesta)', '["A) Implementar todo de inmediato", "B) Casos de uso de alto impacto, validar ROI y escalar gradualmente", "C) Sin planificación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Casos de uso de alto impacto, validar ROI y escalar gradualmente', '["Estrategia", "Conocimiento"]'::jsonb);

-- ============================================================================
-- ROL 19: MIEMBROS DE OPERACIONES
-- ============================================================================

-- ADOPCIÓN - Rol 19
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('MO-A1', 'Cuestionario', 'Adopción', '4', '19', '¿Con qué frecuencia usa Gen-AI para generar documentación de procesos o procedimientos operativos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('MO-A2', 'Cuestionario', 'Adopción', '4', '19', '¿Con qué frecuencia emplea Gen-AI para optimizar tareas repetitivas en su trabajo diario?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('MO-A3', 'Cuestionario', 'Adopción', '4', '19', '¿Con qué frecuencia utiliza Gen-AI para analizar datos operativos y generar insights?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('MO-A4', 'Cuestionario', 'Adopción', '4', '19', '¿Con qué frecuencia aplica Gen-AI para crear checklists o guías de trabajo?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('MO-A5', 'Cuestionario', 'Adopción', '4', '19', '¿Con qué frecuencia usa Gen-AI para mejorar la comunicación y reportes en su equipo?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('MO-A6', 'Cuestionario', 'Adopción', '4', '19', '¿Con qué frecuencia busca aprender nuevas formas de usar Gen-AI para mejorar sus procesos operativos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Inversión"]'::jsonb);

-- CONOCIMIENTO - Rol 19
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('MO-C1', 'Cuestionario', 'Conocimiento', '4', '19', 'Al usar Gen-AI para documentación operativa, práctica más efectiva', 'Multiple Choice (una respuesta)', '["A) Copiar directamente", "B) Revisar precisión, adaptar al contexto de su organización y mantener actualizado", "C) Sin revisar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar precisión, adaptar al contexto de su organización y mantener actualizado', '["Aplicación", "Conocimiento"]'::jsonb),

('MO-C2', 'Cuestionario', 'Conocimiento', '4', '19', 'Para optimizar tareas con Gen-AI, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Automatizar todo", "B) Identificar tareas repetitivas, validar resultados y mantener supervisión humana en procesos críticos", "C) Sin validación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Identificar tareas repetitivas, validar resultados y mantener supervisión humana en procesos críticos', '["Productividad", "Conocimiento"]'::jsonb),

('MO-C3', 'Cuestionario', 'Conocimiento', '4', '19', 'Al analizar datos operativos con Gen-AI, qué verificar', 'Multiple Choice (una respuesta)', '["A) Confiar completamente", "B) Validar con datos reales, revisar contexto y confirmar con el equipo", "C) Sin validar", "D) Solo números"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar con datos reales, revisar contexto y confirmar con el equipo', '["Conocimiento"]'::jsonb),

('MO-C4', 'Cuestionario', 'Conocimiento', '4', '19', 'Para mejorar el uso de Gen-AI en operaciones, mejor práctica', 'Multiple Choice (una respuesta)', '["A) Solo leer", "B) Practicar con casos reales, experimentar y compartir aprendizajes con el equipo", "C) Un solo tutorial", "D) Sin práctica"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Practicar con casos reales, experimentar y compartir aprendizajes con el equipo', '["Aplicación", "Conocimiento"]'::jsonb),

('MO-C5', 'Cuestionario', 'Conocimiento', '4', '19', 'Al generar reportes con Gen-AI, cómo asegurar calidad', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Verificar datos, revisar cálculos y asegurar que refleja la realidad operativa", "C) Sin revisar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Verificar datos, revisar cálculos y asegurar que refleja la realidad operativa', '["Conocimiento"]'::jsonb),

('MO-C6', 'Cuestionario', 'Conocimiento', '4', '19', 'Para proteger información operativa al usar Gen-AI, qué hacer', 'Multiple Choice (una respuesta)', '["A) Compartir todo", "B) No compartir datos confidenciales, usar información de ejemplo y revisar políticas", "C) Sin restricciones", "D) Compartir libremente"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) No compartir datos confidenciales, usar información de ejemplo y revisar políticas', '["Conocimiento"]'::jsonb);




















