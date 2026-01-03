-- ============================================================================
-- PREGUNTAS PARA ROLES DE TECNOLOGÍA/TI
-- ============================================================================
-- Roles incluidos:
--   - Rol ID 5: Gerente de TI (area_id: 9)
--   - Rol ID 7: Analista/Especialista TI (area_id: 9)
-- ============================================================================

-- ============================================================================
-- ROL 5: GERENTE DE TI
-- ============================================================================

-- ADOPCIÓN - Rol 5
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('GT-A1', 'Cuestionario', 'Adopción', '9', '5', '¿Con qué frecuencia evalúa y selecciona herramientas de Gen-AI para su equipo (comparación de features, costos, seguridad)?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Estrategia"]'::jsonb),

('GT-A2', 'Cuestionario', 'Adopción', '9', '5', '¿Con qué frecuencia implementa políticas y guardrails de seguridad para el uso de Gen-AI en su organización?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Estrategia", "Aplicación"]'::jsonb),

('GT-A3', 'Cuestionario', 'Adopción', '9', '5', '¿Con qué frecuencia capacita a su equipo en el uso seguro y efectivo de herramientas de Gen-AI?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Aplicación"]'::jsonb),

('GT-A4', 'Cuestionario', 'Adopción', '9', '5', '¿Con qué frecuencia usa Gen-AI para optimizar procesos de infraestructura y automatización (scripts, documentación técnica, monitoreo)?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('GT-A5', 'Cuestionario', 'Adopción', '9', '5', '¿Con qué frecuencia mide el impacto de Gen-AI en la productividad de su equipo (tiempo ahorrado, calidad, satisfacción)?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Estrategia"]'::jsonb),

('GT-A6', 'Cuestionario', 'Adopción', '9', '5', '¿Con qué frecuencia planifica el presupuesto y recursos necesarios para implementar soluciones de Gen-AI en su área?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Inversión", "Estrategia"]'::jsonb);

-- CONOCIMIENTO - Rol 5
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('GT-C1', 'Cuestionario', 'Conocimiento', '9', '5', '¿Qué es fundamental al implementar Gen-AI en infraestructura crítica?', 'Multiple Choice (una respuesta)', '["A) Implementar sin pruebas", "B) Entornos de prueba aislados, validación de seguridad, rollback plan y monitoreo continuo", "C) Usar solo servicios públicos", "D) Desactivar logs"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Entornos de prueba aislados, validación de seguridad, rollback plan y monitoreo continuo', '["Conocimiento", "Estrategia"]'::jsonb),

('GT-C2', 'Cuestionario', 'Conocimiento', '9', '5', 'Para proteger datos sensibles con Gen-AI, práctica recomendada', 'Multiple Choice (una respuesta)', '["A) Subir todo a servicios públicos", "B) Entornos privados/on-prem, encriptación, controles de acceso y auditoría", "C) Compartir credenciales", "D) Sin autenticación"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Entornos privados/on-prem, encriptación, controles de acceso y auditoría', '["Conocimiento"]'::jsonb),

('GT-C3', 'Cuestionario', 'Conocimiento', '9', '5', 'Al evaluar ROI de Gen-AI en TI, métrica más relevante', 'Multiple Choice (una respuesta)', '["A) Número de herramientas", "B) Tiempo ahorrado, reducción de errores, satisfacción del equipo y costos evitados vs. inversión", "C) Colores del dashboard", "D) Número de usuarios"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Tiempo ahorrado, reducción de errores, satisfacción del equipo y costos evitados vs. inversión', '["Productividad", "Conocimiento"]'::jsonb),

('GT-C4', 'Cuestionario', 'Conocimiento', '9', '5', 'En la contratación de servicios de Gen-AI, cláusula crítica', 'Multiple Choice (una respuesta)', '["A) Diseño del logo", "B) Ubicación de datos, SLAs de disponibilidad, soporte y límites de uso", "C) Color de la interfaz", "D) Precio único"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Ubicación de datos, SLAs de disponibilidad, soporte y límites de uso', '["Estrategia", "Conocimiento"]'::jsonb),

('GT-C5', 'Cuestionario', 'Conocimiento', '9', '5', 'Para capacitar a un equipo en Gen-AI, enfoque más efectivo', 'Multiple Choice (una respuesta)', '["A) Un solo taller", "B) Programa continuo con casos prácticos, mejores prácticas de seguridad y seguimiento", "C) Solo documentación", "D) Aprendizaje autodidacta"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Programa continuo con casos prácticos, mejores prácticas de seguridad y seguimiento', '["Inversión", "Conocimiento"]'::jsonb),

('GT-C6', 'Cuestionario', 'Conocimiento', '9', '5', 'Al integrar Gen-AI en sistemas existentes, consideración principal', 'Multiple Choice (una respuesta)', '["A) Reemplazar todo de inmediato", "B) Integración gradual, APIs seguras, validación de outputs y compatibilidad con sistemas legacy", "C) Sin pruebas", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Integración gradual, APIs seguras, validación de outputs y compatibilidad con sistemas legacy', '["Aplicación", "Conocimiento"]'::jsonb);

-- ============================================================================
-- ROL 7: ANALISTA/ESPECIALISTA TI
-- ============================================================================

-- ADOPCIÓN - Rol 7
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('AT-A1', 'Cuestionario', 'Adopción', '9', '7', '¿Con qué frecuencia usa asistentes de código Gen-AI para escribir o revisar código?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Productividad"]'::jsonb),

('AT-A2', 'Cuestionario', 'Adopción', '9', '7', '¿Con qué frecuencia utiliza Gen-AI para generar documentación técnica o comentarios en código?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('AT-A3', 'Cuestionario', 'Adopción', '9', '7', '¿Con qué frecuencia emplea Gen-AI para debugging o análisis de errores en sistemas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación"]'::jsonb),

('AT-A4', 'Cuestionario', 'Adopción', '9', '7', '¿Con qué frecuencia usa Gen-AI para crear scripts de automatización o tareas repetitivas?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad"]'::jsonb),

('AT-A5', 'Cuestionario', 'Adopción', '9', '7', '¿Con qué frecuencia aplica Gen-AI para optimizar consultas de base de datos o mejorar performance?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Productividad", "Aplicación"]'::jsonb),

('AT-A6', 'Cuestionario', 'Adopción', '9', '7', '¿Con qué frecuencia busca y evalúa nuevas herramientas de Gen-AI para mejorar su trabajo diario?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', now(), null, '["Aplicación", "Estrategia"]'::jsonb);

-- CONOCIMIENTO - Rol 7
INSERT INTO "public"."preguntas" ("codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta", "dimension") VALUES
('AT-C1', 'Cuestionario', 'Conocimiento', '9', '7', 'Al usar asistentes de código Gen-AI, práctica más segura', 'Multiple Choice (una respuesta)', '["A) Aceptar todo el código generado", "B) Revisar, probar y validar el código antes de usar, especialmente en producción", "C) Copiar sin revisar", "D) Desactivar validaciones"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar, probar y validar el código antes de usar, especialmente en producción', '["Conocimiento"]'::jsonb),

('AT-C2', 'Cuestionario', 'Conocimiento', '9', '7', 'Para proteger información sensible al usar Gen-AI, qué hacer', 'Multiple Choice (una respuesta)', '["A) Subir código completo con credenciales", "B) No compartir secretos, APIs keys o datos personales; usar datos de ejemplo", "C) Compartir todo", "D) Sin restricciones"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) No compartir secretos, APIs keys o datos personales; usar datos de ejemplo', '["Conocimiento", "Aplicación"]'::jsonb),

('AT-C3', 'Cuestionario', 'Conocimiento', '9', '7', 'Al generar código con Gen-AI, cómo asegurar calidad', 'Multiple Choice (una respuesta)', '["A) Usar directamente", "B) Revisar lógica, ejecutar pruebas, verificar seguridad y seguir estándares del proyecto", "C) Sin pruebas", "D) Solo compilar"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar lógica, ejecutar pruebas, verificar seguridad y seguir estándares del proyecto', '["Productividad", "Conocimiento"]'::jsonb),

('AT-C4', 'Cuestionario', 'Conocimiento', '9', '7', 'Para documentación técnica con Gen-AI, mejor práctica', 'Multiple Choice (una respuesta)', '["A) Copiar tal cual", "B) Revisar precisión, actualizar según contexto del proyecto y mantener consistencia", "C) Sin revisar", "D) Solo traducir"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Revisar precisión, actualizar según contexto del proyecto y mantener consistencia', '["Aplicación", "Conocimiento"]'::jsonb),

('AT-C5', 'Cuestionario', 'Conocimiento', '9', '7', 'Al automatizar tareas con Gen-AI, consideración importante', 'Multiple Choice (una respuesta)', '["A) Automatizar todo", "B) Validar que la automatización es segura, probar en entorno controlado y tener plan de rollback", "C) Sin validación", "D) Solo en producción"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Validar que la automatización es segura, probar en entorno controlado y tener plan de rollback', '["Estrategia", "Conocimiento"]'::jsonb),

('AT-C6', 'Cuestionario', 'Conocimiento', '9', '7', 'Para aprender a usar Gen-AI efectivamente, enfoque recomendado', 'Multiple Choice (una respuesta)', '["A) Solo leer documentación", "B) Práctica continua, experimentar con casos reales y aprender de la comunidad", "C) Un solo tutorial", "D) Sin práctica"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', now(), 'B) Práctica continua, experimentar con casos reales y aprender de la comunidad', '["Inversión", "Conocimiento"]'::jsonb);




















