-- ============================================================================
-- PREGUNTAS PARA ROLES GENERALES
-- ============================================================================
-- Roles incluidos:
--   - Rol ID 24: Gerencia Media (area_id: 1)
--   - Rol ID 25: Freelancer (area_id: 1)
--   - Rol ID 26: Consultor (area_id: 1)
-- ============================================================================

-- ============================================================================
-- ROL 24: GERENCIA MEDIA
-- ============================================================================

-- ADOPCIÓN - Rol 24
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('GM-A1', 'Cuestionario', 'Adopción', '1', '24', '¿Con qué frecuencia usa Gen-AI para generar reportes o análisis para su equipo?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('GM-A2', 'Cuestionario', 'Adopción', '1', '24', '¿Con qué frecuencia emplea Gen-AI para optimizar procesos de su área o departamento?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('GM-A3', 'Cuestionario', 'Adopción', '1', '24', '¿Con qué frecuencia utiliza Gen-AI para comunicaciones internas o presentaciones?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('GM-A4', 'Cuestionario', 'Adopción', '1', '24', '¿Con qué frecuencia aplica Gen-AI para tomar decisiones operativas basadas en datos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb),

('GM-A5', 'Cuestionario', 'Adopción', '1', '24', '¿Con qué frecuencia planifica mejoras en su área usando insights de Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia"]'::jsonb),

('GM-A6', 'Cuestionario', 'Adopción', '1', '24', '¿Con qué frecuencia invierte tiempo en capacitar a su equipo sobre el uso de Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Estrategia"]'::jsonb);

-- CONOCIMIENTO - Rol 24
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('GM-C1', 'Cuestionario', 'Conocimiento', '1', '24', 'Al usar Gen-AI para reportes gerenciales, práctica más efectiva', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Revisar datos, validar con fuentes y personalizar según audiencia", "C) Sin revisar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar datos, validar con fuentes y personalizar según audiencia', '["Aplicación", "Conocimiento"]'::jsonb),

('GM-C2', 'Cuestionario', 'Conocimiento', '1', '24', 'Para proteger información organizacional al usar Gen-AI, práctica esencial', 'Multiple Choice (una respuesta)', '["A) Compartir libremente", "B) No compartir datos confidenciales, usar información de ejemplo y cumplir políticas", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) No compartir datos confidenciales, usar información de ejemplo y cumplir políticas', '["Estrategia", "Conocimiento"]'::jsonb),

('GM-C3', 'Cuestionario', 'Conocimiento', '1', '24', 'Al medir el impacto de Gen-AI en su área, métrica más relevante', 'Multiple Choice (una respuesta)', '["A) Número de herramientas", "B) Mejora en eficiencia, calidad y satisfacción del equipo vs. inversión", "C) Colores usados", "D) Número de usuarios"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Mejora en eficiencia, calidad y satisfacción del equipo vs. inversión', '["Productividad", "Conocimiento"]'::jsonb),

('GM-C4', 'Cuestionario', 'Conocimiento', '1', '24', 'Para capacitar a un equipo en Gen-AI, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Un solo taller", "B) Programa continuo con casos prácticos y seguimiento de adopción", "C) Solo documentación", "D) Sin capacitación"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Programa continuo con casos prácticos y seguimiento de adopción', '["Inversión", "Conocimiento"]'::jsonb),

('GM-C5', 'Cuestionario', 'Conocimiento', '1', '24', 'Al planificar la adopción de Gen-AI en su área, qué priorizar', 'Multiple Choice (una respuesta)', '["A) Implementar todo de inmediato", "B) Identificar casos de uso de valor, empezar con pilotos y escalar gradualmente", "C) Sin planificación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Identificar casos de uso de valor, empezar con pilotos y escalar gradualmente', '["Estrategia", "Conocimiento"]'::jsonb),

('GM-C6', 'Cuestionario', 'Conocimiento', '1', '24', 'Para optimizar procesos con Gen-AI, mejor práctica', 'Multiple Choice (una respuesta)', '["A) Automatizar todo", "B) Identificar procesos críticos, validar mejoras y mantener supervisión en decisiones importantes", "C) Sin validación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Identificar procesos críticos, validar mejoras y mantener supervisión en decisiones importantes', '["Productividad", "Conocimiento"]'::jsonb);

-- ============================================================================
-- ROL 25: FREELANCER
-- ============================================================================

-- ADOPCIÓN - Rol 25
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('FL-A1', 'Cuestionario', 'Adopción', '1', '25', '¿Con qué frecuencia usa Gen-AI para generar propuestas o cotizaciones para clientes?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Productividad"]'::jsonb),

('FL-A2', 'Cuestionario', 'Adopción', '1', '25', '¿Con qué frecuencia emplea Gen-AI para crear contenido o entregables para proyectos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('FL-A3', 'Cuestionario', 'Adopción', '1', '25', '¿Con qué frecuencia utiliza Gen-AI para optimizar tareas administrativas o de gestión de proyectos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('FL-A4', 'Cuestionario', 'Adopción', '1', '25', '¿Con qué frecuencia aplica Gen-AI para comunicarse con clientes o generar emails profesionales?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('FL-A5', 'Cuestionario', 'Adopción', '1', '25', '¿Con qué frecuencia planifica estrategias de negocio usando insights de Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb),

('FL-A6', 'Cuestionario', 'Adopción', '1', '25', '¿Con qué frecuencia invierte tiempo en aprender nuevas herramientas de Gen-AI para mejorar sus servicios?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Aplicación"]'::jsonb);

-- CONOCIMIENTO - Rol 25
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('FL-C1', 'Cuestionario', 'Conocimiento', '1', '25', 'Al usar Gen-AI para propuestas de clientes, práctica más efectiva', 'Multiple Choice (una respuesta)', '["A) Enviar directamente", "B) Personalizar según cliente, revisar contenido y verificar información antes de enviar", "C) Sin revisar", "D) Solo cambiar nombres"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Personalizar según cliente, revisar contenido y verificar información antes de enviar', '["Aplicación", "Conocimiento"]'::jsonb),

('FL-C2', 'Cuestionario', 'Conocimiento', '1', '25', 'Para proteger información de clientes al usar Gen-AI, práctica esencial', 'Multiple Choice (una respuesta)', '["A) Compartir libremente", "B) No compartir información confidencial, usar datos de ejemplo y mantener confidencialidad", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) No compartir información confidencial, usar datos de ejemplo y mantener confidencialidad', '["Conocimiento"]'::jsonb),

('FL-C3', 'Cuestionario', 'Conocimiento', '1', '25', 'Al generar entregables con Gen-AI, cómo asegurar calidad', 'Multiple Choice (una respuesta)', '["A) Entregar directamente", "B) Revisar contenido, adaptar a necesidades del cliente y mantener estándares profesionales", "C) Sin revisar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar contenido, adaptar a necesidades del cliente y mantener estándares profesionales', '["Productividad", "Conocimiento"]'::jsonb),

('FL-C4', 'Cuestionario', 'Conocimiento', '1', '25', 'Para mejorar el uso de Gen-AI como freelancer, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Solo leer", "B) Practicar con proyectos reales, experimentar y desarrollar flujo de trabajo eficiente", "C) Un solo tutorial", "D) Sin práctica"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Practicar con proyectos reales, experimentar y desarrollar flujo de trabajo eficiente', '["Aplicación", "Conocimiento"]'::jsonb),

('FL-C5', 'Cuestionario', 'Conocimiento', '1', '25', 'Al optimizar procesos con Gen-AI, consideración importante', 'Multiple Choice (una respuesta)', '["A) Automatizar todo", "B) Identificar tareas repetitivas, validar calidad y enfocarse en valor agregado para clientes", "C) Sin validación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Identificar tareas repetitivas, validar calidad y enfocarse en valor agregado para clientes', '["Productividad", "Conocimiento"]'::jsonb),

('FL-C6', 'Cuestionario', 'Conocimiento', '1', '25', 'Para planificar inversión en Gen-AI como freelancer, mejor práctica', 'Multiple Choice (una respuesta)', '["A) Comprar todo", "B) Evaluar ROI por herramienta, empezar con opciones gratuitas y escalar según resultados", "C) Sin planificación", "D) Solo premium"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Evaluar ROI por herramienta, empezar con opciones gratuitas y escalar según resultados', '["Inversión", "Conocimiento"]'::jsonb);

-- ============================================================================
-- ROL 26: CONSULTOR
-- ============================================================================

-- ADOPCIÓN - Rol 26
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('CO-A1', 'Cuestionario', 'Adopción', '1', '26', '¿Con qué frecuencia usa Gen-AI para generar análisis o diagnósticos para clientes?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Productividad"]'::jsonb),

('CO-A2', 'Cuestionario', 'Adopción', '1', '26', '¿Con qué frecuencia emplea Gen-AI para crear presentaciones o reportes consultivos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('CO-A3', 'Cuestionario', 'Adopción', '1', '26', '¿Con qué frecuencia utiliza Gen-AI para generar recomendaciones estratégicas o planes de acción?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb),

('CO-A4', 'Cuestionario', 'Adopción', '1', '26', '¿Con qué frecuencia aplica Gen-AI para optimizar procesos de consultoría o metodologías?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('CO-A5', 'Cuestionario', 'Adopción', '1', '26', '¿Con qué frecuencia planifica estrategias de consultoría usando insights de Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia"]'::jsonb),

('CO-A6', 'Cuestionario', 'Adopción', '1', '26', '¿Con qué frecuencia invierte en aprender nuevas aplicaciones de Gen-AI para mejorar sus servicios de consultoría?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Estrategia"]'::jsonb);

-- CONOCIMIENTO - Rol 26
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('CO-C1', 'Cuestionario', 'Conocimiento', '1', '26', 'Al usar Gen-AI para análisis consultivos, práctica más efectiva', 'Multiple Choice (una respuesta)', '["A) Entregar directamente", "B) Validar con datos reales, revisar metodología y personalizar según contexto del cliente", "C) Sin validar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar con datos reales, revisar metodología y personalizar según contexto del cliente', '["Estrategia", "Conocimiento"]'::jsonb),

('CO-C2', 'Cuestionario', 'Conocimiento', '1', '26', 'Para proteger información de clientes al usar Gen-AI, práctica esencial', 'Multiple Choice (una respuesta)', '["A) Compartir libremente", "B) No compartir información confidencial, usar datos anonimizados y mantener acuerdos de confidencialidad", "C) Sin restricciones", "D) Compartir todo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) No compartir información confidencial, usar datos anonimizados y mantener acuerdos de confidencialidad', '["Estrategia", "Conocimiento"]'::jsonb),

('CO-C3', 'Cuestionario', 'Conocimiento', '1', '26', 'Al generar recomendaciones estratégicas con Gen-AI, cómo asegurar calidad', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Revisar viabilidad, adaptar a contexto del cliente y validar con experiencia profesional", "C) Sin revisar", "D) Solo copiar"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar viabilidad, adaptar a contexto del cliente y validar con experiencia profesional', '["Estrategia", "Conocimiento"]'::jsonb),

('CO-C4', 'Cuestionario', 'Conocimiento', '1', '26', 'Para mejorar el uso de Gen-AI en consultoría, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Solo leer", "B) Practicar con casos reales, desarrollar metodologías propias y mantener rigor analítico", "C) Un solo tutorial", "D) Sin práctica"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Practicar con casos reales, desarrollar metodologías propias y mantener rigor analítico', '["Aplicación", "Conocimiento"]'::jsonb),

('CO-C5', 'Cuestionario', 'Conocimiento', '1', '26', 'Al crear presentaciones consultivas con Gen-AI, consideración importante', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Personalizar según audiencia, revisar datos y mantener coherencia con mensaje estratégico", "C) Sin personalizar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Personalizar según audiencia, revisar datos y mantener coherencia con mensaje estratégico', '["Aplicación", "Conocimiento"]'::jsonb),

('CO-C6', 'Cuestionario', 'Conocimiento', '1', '26', 'Para optimizar procesos de consultoría con Gen-AI, mejor práctica', 'Multiple Choice (una respuesta)', '["A) Automatizar todo", "B) Usar para análisis y generación de ideas, mantener supervisión profesional y enfocarse en valor estratégico", "C) Sin planificación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Usar para análisis y generación de ideas, mantener supervisión profesional y enfocarse en valor estratégico', '["Productividad", "Conocimiento"]'::jsonb);




















