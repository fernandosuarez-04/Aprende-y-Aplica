-- ============================================================================
-- PREGUNTAS PARA ROLES DE RECURSOS HUMANOS
-- ============================================================================
-- Roles incluidos:
--   - Rol ID 14: Dirección de RRHH (area_id: 6)
--   - Rol ID 21: Miembros de RRHH (area_id: 6)
-- ============================================================================

-- ============================================================================
-- ROL 14: DIRECCIÓN DE RRHH
-- ============================================================================

-- ADOPCIÓN - Rol 14
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('DR-A1', 'Cuestionario', 'Adopción', '6', '14', '¿Con qué frecuencia usa Gen-AI para optimizar procesos de reclutamiento y selección de personal?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('DR-A2', 'Cuestionario', 'Adopción', '6', '14', '¿Con qué frecuencia emplea Gen-AI para generar descripciones de puestos y perfiles de candidatos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Productividad"]'::jsonb),

('DR-A3', 'Cuestionario', 'Adopción', '6', '14', '¿Con qué frecuencia utiliza Gen-AI para crear programas de capacitación y desarrollo de personal?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Aplicación"]'::jsonb),

('DR-A4', 'Cuestionario', 'Adopción', '6', '14', '¿Con qué frecuencia aplica Gen-AI para analizar datos de engagement y satisfacción de empleados?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('DR-A5', 'Cuestionario', 'Adopción', '6', '14', '¿Con qué frecuencia planifica estrategias de talento usando insights generados por Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb),

('DR-A6', 'Cuestionario', 'Adopción', '6', '14', '¿Con qué frecuencia invierte en herramientas de Gen-AI para mejorar procesos de RRHH?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Estrategia"]'::jsonb);

-- CONOCIMIENTO - Rol 14
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('DR-C1', 'Cuestionario', 'Conocimiento', '6', '14', 'Al usar Gen-AI en reclutamiento, consideración ética clave', 'Multiple Choice (una respuesta)', '["A) Sin restricciones", "B) Evitar sesgos, asegurar diversidad y mantener supervisión humana en decisiones finales", "C) Automatizar todo", "D) Sin validación"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Evitar sesgos, asegurar diversidad y mantener supervisión humana en decisiones finales', '["Estrategia", "Conocimiento"]'::jsonb),

('DR-C2', 'Cuestionario', 'Conocimiento', '6', '14', 'Para proteger datos personales de empleados al usar Gen-AI, práctica esencial', 'Multiple Choice (una respuesta)', '["A) Compartir libremente", "B) Cumplir regulaciones de privacidad, minimizar datos y usar entornos seguros", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Cumplir regulaciones de privacidad, minimizar datos y usar entornos seguros', '["Conocimiento"]'::jsonb),

('DR-C3', 'Cuestionario', 'Conocimiento', '6', '14', 'Al medir el impacto de Gen-AI en RRHH, métrica más relevante', 'Multiple Choice (una respuesta)', '["A) Número de herramientas", "B) Mejora en tiempo de contratación, calidad de candidatos y satisfacción del equipo", "C) Colores usados", "D) Número de usuarios"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Mejora en tiempo de contratación, calidad de candidatos y satisfacción del equipo', '["Productividad", "Conocimiento"]'::jsonb),

('DR-C4', 'Cuestionario', 'Conocimiento', '6', '14', 'Para capacitar a un equipo de RRHH en Gen-AI, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Un solo taller", "B) Programa continuo con casos prácticos y énfasis en uso responsable", "C) Solo documentación", "D) Sin capacitación"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Programa continuo con casos prácticos y énfasis en uso responsable', '["Inversión", "Conocimiento"]'::jsonb),

('DR-C5', 'Cuestionario', 'Conocimiento', '6', '14', 'Al planificar la adopción de Gen-AI en RRHH, qué priorizar', 'Multiple Choice (una respuesta)', '["A) Implementar todo de inmediato", "B) Empezar con procesos de bajo riesgo, validar resultados y escalar gradualmente", "C) Sin planificación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Empezar con procesos de bajo riesgo, validar resultados y escalar gradualmente', '["Estrategia", "Conocimiento"]'::jsonb),

('DR-C6', 'Cuestionario', 'Conocimiento', '6', '14', 'Para generar descripciones de puestos con Gen-AI, práctica recomendada', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Revisar y personalizar según necesidades reales del puesto y cultura organizacional", "C) Sin revisar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar y personalizar según necesidades reales del puesto y cultura organizacional', '["Aplicación", "Conocimiento"]'::jsonb);

-- ============================================================================
-- ROL 21: MIEMBROS DE RRHH
-- ============================================================================

-- ADOPCIÓN - Rol 21
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('MR-A1', 'Cuestionario', 'Adopción', '6', '21', '¿Con qué frecuencia usa Gen-AI para redactar emails o comunicaciones internas para empleados?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Productividad"]'::jsonb),

('MR-A2', 'Cuestionario', 'Adopción', '6', '21', '¿Con qué frecuencia emplea Gen-AI para crear materiales de onboarding o capacitación?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('MR-A3', 'Cuestionario', 'Adopción', '6', '21', '¿Con qué frecuencia utiliza Gen-AI para analizar CVs o perfiles de candidatos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('MR-A4', 'Cuestionario', 'Adopción', '6', '21', '¿Con qué frecuencia aplica Gen-AI para generar reportes de RRHH o análisis de datos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('MR-A5', 'Cuestionario', 'Adopción', '6', '21', '¿Con qué frecuencia usa Gen-AI para optimizar procesos administrativos de RRHH?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('MR-A6', 'Cuestionario', 'Adopción', '6', '21', '¿Con qué frecuencia busca aprender nuevas formas de usar Gen-AI para mejorar su trabajo en RRHH?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Inversión"]'::jsonb);

-- CONOCIMIENTO - Rol 21
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('MR-C1', 'Cuestionario', 'Conocimiento', '6', '21', 'Al usar Gen-AI para analizar candidatos, práctica más ética', 'Multiple Choice (una respuesta)', '["A) Confiar completamente", "B) Usar como apoyo, mantener supervisión humana y evitar sesgos en decisiones", "C) Automatizar todo", "D) Sin validación"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Usar como apoyo, mantener supervisión humana y evitar sesgos en decisiones', '["Conocimiento"]'::jsonb),

('MR-C2', 'Cuestionario', 'Conocimiento', '6', '21', 'Para proteger datos personales al usar Gen-AI en RRHH, qué hacer', 'Multiple Choice (una respuesta)', '["A) Compartir libremente", "B) No compartir información confidencial, cumplir regulaciones y usar datos anonimizados", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) No compartir información confidencial, cumplir regulaciones y usar datos anonimizados', '["Conocimiento"]'::jsonb),

('MR-C3', 'Cuestionario', 'Conocimiento', '6', '21', 'Al generar comunicaciones con Gen-AI, cómo asegurar calidad', 'Multiple Choice (una respuesta)', '["A) Enviar directamente", "B) Revisar tono, verificar información y personalizar según audiencia", "C) Sin revisar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar tono, verificar información y personalizar según audiencia', '["Aplicación", "Conocimiento"]'::jsonb),

('MR-C4', 'Cuestionario', 'Conocimiento', '6', '21', 'Para mejorar el uso de Gen-AI en RRHH, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Solo leer", "B) Practicar con casos reales, aprender mejores prácticas y mantener ética profesional", "C) Un solo tutorial", "D) Sin práctica"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Practicar con casos reales, aprender mejores prácticas y mantener ética profesional', '["Aplicación", "Conocimiento"]'::jsonb),

('MR-C5', 'Cuestionario', 'Conocimiento', '6', '21', 'Al crear materiales de capacitación con Gen-AI, qué verificar', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Revisar contenido, adaptar a necesidades del equipo y validar precisión", "C) Sin revisar", "D) Solo copiar"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar contenido, adaptar a necesidades del equipo y validar precisión', '["Productividad", "Conocimiento"]'::jsonb),

('MR-C6', 'Cuestionario', 'Conocimiento', '6', '21', 'Para optimizar procesos administrativos con Gen-AI, mejor práctica', 'Multiple Choice (una respuesta)', '["A) Automatizar todo", "B) Identificar tareas repetitivas, validar resultados y mantener control en procesos sensibles", "C) Sin validación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Identificar tareas repetitivas, validar resultados y mantener control en procesos sensibles', '["Productividad", "Conocimiento"]'::jsonb);




















