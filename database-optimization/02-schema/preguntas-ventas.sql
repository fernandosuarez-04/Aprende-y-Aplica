-- ============================================================================
-- PREGUNTAS PARA ROLES DE VENTAS
-- ============================================================================
-- Roles incluidos:
--   - Rol ID 6: Líder/Gerente de Ventas (area_id: 2)
--   - Rol ID 11: Dirección de Ventas (area_id: 2)
--   - Rol ID 17: Miembros de Ventas (area_id: 2)
-- ============================================================================

-- ============================================================================
-- ROL 6: LÍDER/GERENTE DE VENTAS
-- ============================================================================

-- ADOPCIÓN - Rol 6
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('LV-A1', 'Cuestionario', 'Adopción', '2', '6', '¿Con qué frecuencia usa Gen-AI para generar propuestas comerciales o presentaciones personalizadas para clientes?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Productividad"]'::jsonb),

('LV-A2', 'Cuestionario', 'Adopción', '2', '6', '¿Con qué frecuencia emplea Gen-AI para analizar datos de clientes y generar insights para su equipo de ventas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('LV-A3', 'Cuestionario', 'Adopción', '2', '6', '¿Con qué frecuencia utiliza Gen-AI para crear scripts de ventas o respuestas a objeciones comunes?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('LV-A4', 'Cuestionario', 'Adopción', '2', '6', '¿Con qué frecuencia aplica Gen-AI para optimizar procesos de seguimiento y gestión de pipeline de ventas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('LV-A5', 'Cuestionario', 'Adopción', '2', '6', '¿Con qué frecuencia planifica estrategias de ventas usando insights generados por Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb),

('LV-A6', 'Cuestionario', 'Adopción', '2', '6', '¿Con qué frecuencia invierte tiempo en capacitar a su equipo sobre el uso de Gen-AI para ventas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Estrategia"]'::jsonb);

-- CONOCIMIENTO - Rol 6
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('LV-C1', 'Cuestionario', 'Conocimiento', '2', '6', 'Al usar Gen-AI para propuestas comerciales, práctica más efectiva', 'Multiple Choice (una respuesta)', '["A) Copiar propuestas genéricas", "B) Personalizar según perfil del cliente, revisar contenido y mantener tono profesional", "C) Sin personalizar", "D) Solo cambiar nombres"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Personalizar según perfil del cliente, revisar contenido y mantener tono profesional', '["Aplicación", "Conocimiento"]'::jsonb),

('LV-C2', 'Cuestionario', 'Conocimiento', '2', '6', 'Para proteger información de clientes al usar Gen-AI, qué hacer', 'Multiple Choice (una respuesta)', '["A) Compartir datos completos", "B) Usar datos anonimizados, no compartir información confidencial y revisar políticas de privacidad", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Usar datos anonimizados, no compartir información confidencial y revisar políticas de privacidad', '["Conocimiento"]'::jsonb),

('LV-C3', 'Cuestionario', 'Conocimiento', '2', '6', 'Al medir el impacto de Gen-AI en ventas, métrica más relevante', 'Multiple Choice (una respuesta)', '["A) Número de propuestas", "B) Tasa de cierre, tiempo de respuesta y satisfacción del cliente vs. línea base", "C) Colores usados", "D) Número de emails"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Tasa de cierre, tiempo de respuesta y satisfacción del cliente vs. línea base', '["Productividad", "Conocimiento"]'::jsonb),

('LV-C4', 'Cuestionario', 'Conocimiento', '2', '6', 'Para capacitar a un equipo de ventas en Gen-AI, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Un solo taller", "B) Sesiones prácticas continuas con casos reales y seguimiento de resultados", "C) Solo documentación", "D) Sin capacitación"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Sesiones prácticas continuas con casos reales y seguimiento de resultados', '["Inversión", "Conocimiento"]'::jsonb),

('LV-C5', 'Cuestionario', 'Conocimiento', '2', '6', 'Al planificar el uso de Gen-AI en ventas, consideración clave', 'Multiple Choice (una respuesta)', '["A) Implementar todo de inmediato", "B) Empezar con casos de uso específicos, medir resultados y escalar gradualmente", "C) Sin planificación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Empezar con casos de uso específicos, medir resultados y escalar gradualmente', '["Estrategia", "Conocimiento"]'::jsonb),

('LV-C6', 'Cuestionario', 'Conocimiento', '2', '6', 'Al generar contenido de ventas con Gen-AI, qué verificar', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Revisar precisión, alinear con valores de marca y personalizar para el cliente", "C) Sin revisar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar precisión, alinear con valores de marca y personalizar para el cliente', '["Aplicación", "Conocimiento"]'::jsonb);

-- ============================================================================
-- ROL 11: DIRECCIÓN DE VENTAS
-- ============================================================================

-- ADOPCIÓN - Rol 11
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('DV-A1', 'Cuestionario', 'Adopción', '2', '11', '¿Con qué frecuencia usa Gen-AI para analizar tendencias de mercado y oportunidades de ventas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb),

('DV-A2', 'Cuestionario', 'Adopción', '2', '11', '¿Con qué frecuencia implementa herramientas de Gen-AI para mejorar la productividad de su equipo de ventas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Estrategia"]'::jsonb),

('DV-A3', 'Cuestionario', 'Adopción', '2', '11', '¿Con qué frecuencia utiliza Gen-AI para generar reportes ejecutivos y análisis de performance de ventas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('DV-A4', 'Cuestionario', 'Adopción', '2', '11', '¿Con qué frecuencia aplica Gen-AI para optimizar procesos de onboarding y capacitación de nuevos vendedores?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Productividad"]'::jsonb),

('DV-A5', 'Cuestionario', 'Adopción', '2', '11', '¿Con qué frecuencia planifica inversiones en tecnología de Gen-AI para su área de ventas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Estrategia"]'::jsonb),

('DV-A6', 'Cuestionario', 'Adopción', '2', '11', '¿Con qué frecuencia usa Gen-AI para crear estrategias de ventas personalizadas por segmento de cliente?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb);

-- CONOCIMIENTO - Rol 11
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('DV-C1', 'Cuestionario', 'Conocimiento', '2', '11', 'Para evaluar ROI de Gen-AI en ventas, métrica más importante', 'Multiple Choice (una respuesta)', '["A) Número de herramientas", "B) Incremento en tasa de cierre, reducción de tiempo de ciclo y satisfacción del cliente", "C) Colores usados", "D) Número de usuarios"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Incremento en tasa de cierre, reducción de tiempo de ciclo y satisfacción del cliente', '["Productividad", "Conocimiento"]'::jsonb),

('DV-C2', 'Cuestionario', 'Conocimiento', '2', '11', 'Al implementar Gen-AI en ventas, consideración de seguridad clave', 'Multiple Choice (una respuesta)', '["A) Sin restricciones", "B) Proteger datos de clientes, usar entornos seguros y cumplir regulaciones de privacidad", "C) Compartir todo", "D) Sin validación"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Proteger datos de clientes, usar entornos seguros y cumplir regulaciones de privacidad', '["Estrategia", "Conocimiento"]'::jsonb),

('DV-C3', 'Cuestionario', 'Conocimiento', '2', '11', 'Para capacitar a un equipo de ventas en Gen-AI, enfoque más efectivo', 'Multiple Choice (una respuesta)', '["A) Un solo taller", "B) Programa continuo con práctica en casos reales y seguimiento de adopción", "C) Solo documentación", "D) Sin capacitación"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Programa continuo con práctica en casos reales y seguimiento de adopción', '["Inversión", "Conocimiento"]'::jsonb),

('DV-C4', 'Cuestionario', 'Conocimiento', '2', '11', 'Al planificar la adopción de Gen-AI en ventas, qué priorizar', 'Multiple Choice (una respuesta)', '["A) Implementar todo de inmediato", "B) Identificar casos de uso de alto valor, empezar con pilotos y medir resultados", "C) Sin planificación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Identificar casos de uso de alto valor, empezar con pilotos y medir resultados', '["Estrategia", "Conocimiento"]'::jsonb),

('DV-C5', 'Cuestionario', 'Conocimiento', '2', '11', 'Para generar contenido de ventas con Gen-AI, práctica recomendada', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Personalizar según cliente, revisar precisión y mantener coherencia de marca", "C) Sin revisar", "D) Solo copiar"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Personalizar según cliente, revisar precisión y mantener coherencia de marca', '["Aplicación", "Conocimiento"]'::jsonb),

('DV-C6', 'Cuestionario', 'Conocimiento', '2', '11', 'Al analizar datos de ventas con Gen-AI, qué verificar', 'Multiple Choice (una respuesta)', '["A) Confiar ciegamente", "B) Validar insights con datos reales, revisar contexto y confirmar con el equipo", "C) Sin validación", "D) Solo números"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar insights con datos reales, revisar contexto y confirmar con el equipo', '["Conocimiento"]'::jsonb);

-- ============================================================================
-- ROL 17: MIEMBROS DE VENTAS
-- ============================================================================

-- ADOPCIÓN - Rol 17
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('MV-A1', 'Cuestionario', 'Adopción', '2', '17', '¿Con qué frecuencia usa Gen-AI para generar emails o mensajes personalizados para prospectos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Productividad"]'::jsonb),

('MV-A2', 'Cuestionario', 'Adopción', '2', '17', '¿Con qué frecuencia emplea Gen-AI para preparar presentaciones o propuestas comerciales?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('MV-A3', 'Cuestionario', 'Adopción', '2', '17', '¿Con qué frecuencia utiliza Gen-AI para investigar información sobre clientes o prospectos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('MV-A4', 'Cuestionario', 'Adopción', '2', '17', '¿Con qué frecuencia aplica Gen-AI para responder objeciones comunes de clientes?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('MV-A5', 'Cuestionario', 'Adopción', '2', '17', '¿Con qué frecuencia usa Gen-AI para optimizar su tiempo en tareas administrativas de ventas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('MV-A6', 'Cuestionario', 'Adopción', '2', '17', '¿Con qué frecuencia busca aprender nuevas formas de usar Gen-AI para mejorar sus ventas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Inversión"]'::jsonb);

-- CONOCIMIENTO - Rol 17
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('MV-C1', 'Cuestionario', 'Conocimiento', '2', '17', 'Al usar Gen-AI para emails de ventas, práctica más efectiva', 'Multiple Choice (una respuesta)', '["A) Enviar sin revisar", "B) Personalizar según cliente, revisar tono y verificar información antes de enviar", "C) Sin personalizar", "D) Solo cambiar nombres"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Personalizar según cliente, revisar tono y verificar información antes de enviar', '["Aplicación", "Conocimiento"]'::jsonb),

('MV-C2', 'Cuestionario', 'Conocimiento', '2', '17', 'Para proteger información de clientes al usar Gen-AI, qué hacer', 'Multiple Choice (una respuesta)', '["A) Compartir datos completos", "B) No compartir información confidencial, usar datos de ejemplo y revisar políticas", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) No compartir información confidencial, usar datos de ejemplo y revisar políticas', '["Conocimiento"]'::jsonb),

('MV-C3', 'Cuestionario', 'Conocimiento', '2', '17', 'Al generar propuestas con Gen-AI, cómo asegurar calidad', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Revisar contenido, personalizar para el cliente y verificar precios/productos", "C) Sin revisar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar contenido, personalizar para el cliente y verificar precios/productos', '["Productividad", "Conocimiento"]'::jsonb),

('MV-C4', 'Cuestionario', 'Conocimiento', '2', '17', 'Para mejorar el uso de Gen-AI en ventas, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Solo leer", "B) Practicar con casos reales, experimentar y aprender de resultados", "C) Un solo tutorial", "D) Sin práctica"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Practicar con casos reales, experimentar y aprender de resultados', '["Aplicación", "Conocimiento"]'::jsonb),

('MV-C5', 'Cuestionario', 'Conocimiento', '2', '17', 'Al usar Gen-AI para investigación de clientes, qué verificar', 'Multiple Choice (una respuesta)', '["A) Confiar completamente", "B) Validar información con fuentes oficiales y actualizar datos en CRM", "C) Sin validar", "D) Solo copiar"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar información con fuentes oficiales y actualizar datos en CRM', '["Conocimiento"]'::jsonb),

('MV-C6', 'Cuestionario', 'Conocimiento', '2', '17', 'Para optimizar tiempo con Gen-AI en ventas, mejor práctica', 'Multiple Choice (una respuesta)', '["A) Automatizar todo", "B) Identificar tareas repetitivas, usar Gen-AI para ellas y enfocarse en relaciones con clientes", "C) Sin planificación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Identificar tareas repetitivas, usar Gen-AI para ellas y enfocarse en relaciones con clientes', '["Productividad", "Conocimiento"]'::jsonb);




















