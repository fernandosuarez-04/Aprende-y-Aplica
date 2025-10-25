# Solución Rápida: CTO Mostrando Preguntas de CEO

## 🔍 Problema Identificado

El usuario selecciona **CTO** pero el sistema muestra preguntas de **CEO** (como la pregunta A4 sobre gobernanza).

## 🎯 Causa Raíz

El problema es que **las preguntas de CTO no están en la base de datos** o no se están filtrando correctamente.

## ⚡ Solución Inmediata

### 1. Verificar la Base de Datos

Ejecuta este script en Supabase para verificar si existen preguntas de CTO:

```sql
-- Verificar si existen preguntas para CTO (exclusivo_rol_id = 2)
SELECT 
    id,
    codigo,
    section,
    bloque,
    exclusivo_rol_id,
    texto
FROM "public"."preguntas" 
WHERE "exclusivo_rol_id" = 2 
    AND "section" = 'Cuestionario'
ORDER BY "bloque", "codigo";
```

**Resultado esperado**: Debería mostrar 12 preguntas (6 de Adopción + 6 de Conocimiento).

### 2. Si NO hay preguntas de CTO

Ejecuta el archivo `docs/database/VERIFICAR_PREGUNTAS_CTO.sql` que contiene:

- Verificación de preguntas existentes
- Inserción automática de preguntas de CTO si no existen
- Verificación final

### 3. Si SÍ hay preguntas de CTO

El problema está en el código. Verifica en la consola del navegador:

1. **Abre las herramientas de desarrollador** (F12)
2. **Ve a la pestaña Console**
3. **Recarga la página del cuestionario**
4. **Busca estos logs**:

```
=== MAPEO DEBUG ===
Type_rol recibido: CTO/CIO
Mapeo encontrado: 2
==================

=== PERFIL USUARIO ===
Type_rol exacto: "CTO/CIO"
=====================

Preguntas específicas para el perfil: { count: 12 }
```

### 4. Verificar el Mapeo

El mapeo debería ser:
- **CTO/CIO** → `exclusivo_rol_id = 2`
- **CEO** → `exclusivo_rol_id = 1`

## 🔧 Solución Definitiva

### Opción A: Ejecutar el SQL Completo

```bash
# En Supabase, ejecuta:
\i docs/database/FIX_ALL_PROFILES_AND_QUESTIONS.sql
```

### Opción B: Solo Insertar Preguntas de CTO

```sql
-- Insertar solo las preguntas de CTO
INSERT INTO "public"."preguntas" ("id", "codigo", "section", "bloque", "area_id", "exclusivo_rol_id", "texto", "tipo", "opciones", "locale", "peso", "escala", "scoring", "created_at", "respuesta_correcta") VALUES 
-- CTO - Adopción (A1-A6)
('2001', 'A1', 'Cuestionario', 'Adopción', '9', '2', '¿Con qué frecuencia utiliza asistentes de código para generar/explicar funciones?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00.000000+00', null),
('2002', 'A2', 'Cuestionario', 'Adopción', '9', '2', '¿Con qué frecuencia usa Gen-AI para documentación técnica, refactoring y/o generación de pruebas (unitarias/integración)?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00.000000+00', null),
('2003', 'A3', 'Cuestionario', 'Adopción', '9', '2', '¿Con qué frecuencia emplea Gen-AI en code reviews/PRs (resúmenes, linting guiado, explicación de cambios, commit messages)?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00.000000+00', null),
('2004', 'A4', 'Cuestionario', 'Adopción', '9', '2', '¿Con qué frecuencia integra capacidades LLM en productos o herramientas internas (RAG, embeddings, chatops, agentes, búsqueda semántica)?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00.000000+00', null),
('2005', 'A5', 'Cuestionario', 'Adopción', '9', '2', '¿Con qué frecuencia aplica guardrails y controles de seguridad/privacidad (redacción de secretos, PII, rate-limits, content filters, aislamiento de entornos)?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00.000000+00', null),
('2006', 'A6', 'Cuestionario', 'Adopción', '9', '2', '¿Con qué frecuencia mide valor y calidad de Gen-AI (A/B interno, aceptación, defectos/MTTR, productividad de PRs)?', 'Multiple Choice (escala Likert A–E)', '["A) Nunca", "B) Rara vez (≤ 1/mes)", "C) Ocasional (2–3/mes)", "D) Frecuente (semanal)", "E) Muy frecuente (diaria)"]', 'MX/LATAM', '8.333333', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}', '2025-01-15 10:00:00.000000+00', null),

-- CTO - Conocimiento (C1-C6)
('2007', 'C1', 'Cuestionario', 'Conocimiento', '9', '2', '¿Qué es la ventana de contexto en un LLM?', 'Multiple Choice (una respuesta)', '["A) Núcleos de CPU", "B) Memoria a largo plazo del usuario", "C) Cantidad de tokens que el modelo puede procesar por turno", "D) Caché de disco"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00.000000+00', 'C) Cantidad de tokens que el modelo puede procesar por turno'),
('2008', 'C2', 'Cuestionario', 'Conocimiento', '9', '2', '¿Qué controla principalmente la temperatura en un LLM?', 'Multiple Choice (una respuesta)', '["A) Latencia", "B) Aleatoriedad/diversidad de las salidas", "C) Límite de tokens", "D) Uso de GPU"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00.000000+00', 'B) Aleatoriedad/diversidad de las salidas'),
('2009', 'C3', 'Cuestionario', 'Conocimiento', '9', '2', 'Buena práctica para reducir "alucinaciones" en código sugerido por Gen-AI', 'Multiple Choice (una respuesta)', '["A) Aceptar todo y mergear", "B) Revisión humana + pruebas automatizadas + linters y static analysis", "C) Aumentar la temperatura", "D) Cambiar de IDE"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00.000000+00', 'B) Revisión humana + pruebas automatizadas + linters y static analysis'),
('2010', 'C4', 'Cuestionario', 'Conocimiento', '9', '2', 'En integración LLM+RAG con fuentes externas, práctica más segura', 'Multiple Choice (una respuesta)', '["A) Ejecutar comandos del modelo sin validación", "B) Tratar al modelo como no confiable, sanitizar entradas/salidas, bloquear funciones peligrosas y validar orígenes", "C) Dar acceso root al conector", "D) Desactivar logging"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00.000000+00', 'B) Tratar al modelo como no confiable, sanitizar entradas/salidas, bloquear funciones peligrosas y validar orígenes'),
('2011', 'C5', 'Cuestionario', 'Conocimiento', '9', '2', 'Métrica que mide mejor el impacto del asistente de código', 'Multiple Choice (una respuesta)', '["A) Nº de prompts", "B) A/B: aceptación útil, defectos, retrabajo, lead time y MTTR vs. baseline", "C) Colores del editor", "D) Nº de ramas"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00.000000+00', 'B) A/B: aceptación útil, defectos, retrabajo, lead time y MTTR vs. baseline'),
('2012', 'C6', 'Cuestionario', 'Conocimiento', '9', '2', 'Uso de repos internos con Gen-AI en LATAM – práctica adecuada', 'Multiple Choice (una respuesta)', '["A) Subir PII/secrets a servicios públicos", "B) Minimizar/anonimizar datos, escanear secretos y usar entornos privados o on-prem cuando aplique", "C) Compartir código de clientes sin permiso", "D) Deshabilitar controles de acceso"]', 'MX/LATAM', '8.333333', null, '{"Correcta": 100, "Incorrecta": 0}', '2025-01-15 10:00:00.000000+00', 'B) Minimizar/anonimizar datos, escanear secretos y usar entornos privados o on-prem cuando aplique');
```

## ✅ Verificación Final

Después de ejecutar la solución, verifica que:

1. **El usuario tenga `type_rol = 'CTO/CIO'`** en la tabla `users`
2. **Existan 12 preguntas** con `exclusivo_rol_id = 2` en la tabla `preguntas`
3. **El cuestionario muestre preguntas de CTO** como:
   - A1: "¿Con qué frecuencia utiliza asistentes de código para generar/explicar funciones?"
   - C1: "¿Qué es la ventana de contexto en un LLM?"

## 🎯 Resultado Esperado

Para un usuario **CTO**, el cuestionario debería mostrar:

- **6 preguntas de Adopción** (A1-A6) sobre uso de herramientas técnicas
- **6 preguntas de Conocimiento** (C1-C6) sobre conceptos técnicos
- **Total: 12 preguntas específicas de CTO**

¡No más preguntas de CEO para usuarios CTO! 🎉
