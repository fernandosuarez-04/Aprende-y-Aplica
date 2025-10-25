-- Preguntas específicas para Ventas (exclusivo_rol_id = 6)
-- Basadas en el patrón de las preguntas existentes pero enfocadas en ventas

-- Preguntas de Adopción para Ventas (A1-A6)
INSERT INTO "public"."preguntas" ("id", "codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta") VALUES 
-- A1: CRM y gestión de leads
('101', 'A1', 'Cuestionario', 'Adopción', '2', '6', '¿Con qué frecuencia utiliza Gen-AI para calificación y scoring de leads (análisis de comportamiento, intención de compra, priorización)?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00.000000+00', null),

-- A2: Generación de propuestas
('102', 'A2', 'Cuestionario', 'Adopción', '2', '6', '¿Con qué frecuencia emplea Gen-AI para generar propuestas comerciales, cotizaciones y presentaciones personalizadas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00.000000+00', null),

-- A3: Análisis de pipeline
('103', 'A3', 'Cuestionario', 'Adopción', '2', '6', '¿Con qué frecuencia usa Gen-AI para análisis de pipeline de ventas (predicción de cierre, identificación de riesgos, optimización de procesos)?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00.000000+00', null),

-- A4: Comunicación con clientes
('104', 'A4', 'Cuestionario', 'Adopción', '2', '6', '¿Con qué frecuencia utiliza Gen-AI para redacción de emails comerciales, seguimiento de clientes y gestión de objeciones?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00.000000+00', null),

-- A5: Análisis de competencia
('105', 'A5', 'Cuestionario', 'Adopción', '2', '6', '¿Con qué frecuencia emplea Gen-AI para análisis de competencia, investigación de mercado y posicionamiento de productos?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00.000000+00', null),

-- A6: Métricas y reportes
('106', 'A6', 'Cuestionario', 'Adopción', '2', '6', '¿Con qué frecuencia integra Gen-AI en reportes de ventas, análisis de performance del equipo y métricas comerciales?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00.000000+00', null);

-- Preguntas de Conocimiento para Ventas (C1-C6)
INSERT INTO "public"."preguntas" ("id", "codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta") VALUES 
-- C1: CRM y automatización
('107', 'C1', 'Cuestionario', 'Conocimiento', '2', '6', '¿Cuál es la mejor práctica para integrar Gen-AI en un CRM existente?', 'Multiple Choice (una respuesta)', '["A) Reemplazar completamente el CRM", "B) Integración gradual con APIs, automatización de tareas repetitivas y análisis de datos", "C) Usar solo para emails", "D) No integrar nunca"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00.000000+00', 'B) Integración gradual con APIs, automatización de tareas repetitivas y análisis de datos'),

-- C2: Métricas de ventas
('108', 'C2', 'Cuestionario', 'Conocimiento', '2', '6', '¿Qué métrica es más importante para medir el impacto de Gen-AI en ventas?', 'Multiple Choice (una respuesta)', '["A) Número de prompts enviados", "B) Tiempo de respuesta a leads, tasa de conversión y valor promedio de venta", "C) Likes en LinkedIn", "D) Cantidad de reuniones"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00.000000+00', 'B) Tiempo de respuesta a leads, tasa de conversión y valor promedio de venta'),

-- C3: Personalización
('109', 'C3', 'Cuestionario', 'Conocimiento', '2', '6', 'Para personalizar propuestas comerciales con Gen-AI, ¿qué es más importante?', 'Multiple Choice (una respuesta)', '["A) Usar prompts genéricos", "B) Datos específicos del cliente, historial de compras y necesidades identificadas", "C) Copiar de la competencia", "D) No personalizar"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00.000000+00', 'B) Datos específicos del cliente, historial de compras y necesidades identificadas'),

-- C4: Gestión de objeciones
('110', 'C4', 'Cuestionario', 'Conocimiento', '2', '6', '¿Cómo debe manejarse la información confidencial del cliente al usar Gen-AI?', 'Multiple Choice (una respuesta)', '["A) Subir todo a servicios públicos", "B) Minimizar datos sensibles, usar entornos seguros y cumplir con políticas de privacidad", "C) Compartir con la competencia", "D) No usar nunca"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00.000000+00', 'B) Minimizar datos sensibles, usar entornos seguros y cumplir con políticas de privacidad'),

-- C5: Análisis predictivo
('111', 'C5', 'Cuestionario', 'Conocimiento', '2', '6', 'Para análisis predictivo de ventas con Gen-AI, ¿qué enfoque es más efectivo?', 'Multiple Choice (una respuesta)', '["A) Confiar ciegamente en las predicciones", "B) Combinar datos históricos, tendencias del mercado y validación humana", "C) Usar solo datos de un mes", "D) No hacer análisis predictivo"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00.000000+00', 'B) Combinar datos históricos, tendencias del mercado y validación humana'),

-- C6: Automatización de procesos
('112', 'C6', 'Cuestionario', 'Conocimiento', '2', '6', '¿Cuál es la mejor práctica para automatizar procesos de ventas con Gen-AI?', 'Multiple Choice (una respuesta)', '["A) Automatizar todo sin supervisión", "B) Automatizar tareas repetitivas, mantener supervisión humana en decisiones críticas y medir resultados", "C) No automatizar nada", "D) Solo automatizar emails"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00.000000+00', 'B) Automatizar tareas repetitivas, mantener supervisión humana en decisiones críticas y medir resultados');
