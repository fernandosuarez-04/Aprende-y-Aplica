# Prompt de Optimización de Rendimiento - Aprende y Aplica

## Contexto del Proyecto

**Aprende y Aplica** es una plataforma educativa full-stack construida con:
- **Frontend**: Next.js 15.5.4, React 19.1.0, TypeScript 5.9.3
- **Backend**: Express 4.18.2, Node.js 18+
- **Base de Datos**: Supabase (PostgreSQL)
- **Arquitectura**: Monorepo con Screaming Architecture

## Problema Identificado

### Síntomas de Rendimiento
1. **Carga de cursos extremadamente lenta**: Hasta 25 segundos para cargar la página `/courses/[slug]/learn`
2. **Múltiples requests pendientes**: Según el análisis del archivo `.har`, hay requests que quedan en estado `(pending)`:
   - `stats` - Pending
   - `notes` - Pending  
   - `questions` - Pending
3. **Tiempo total de carga**: 25.16 segundos según DevTools Network
4. **DOMContentLoaded**: 5.59s
5. **Load**: 6.45s
6. **Finish**: 25.16s (indica que hay requests que tardan mucho en completarse)

### Análisis del Código Actual

#### Problemas Identificados:

1. **Falta de Connection Pooling Real**
   - Existe `apps/web/src/lib/supabase/pool.ts` pero **NO se está usando** en los endpoints
   - Cada endpoint crea su propio cliente con `createClient()` o `createServerClient()`
   - **696 llamadas** a `createClient/createServerClient` en **238 archivos**
   - Cada creación de cliente tiene overhead de ~50-100ms

2. **Múltiples Consultas Redundantes**
   - Cada endpoint valida el curso por slug individualmente:
     - `/api/courses/[slug]/lessons/[lessonId]/transcript` → Valida curso
     - `/api/courses/[slug]/lessons/[lessonId]/summary` → Valida curso (duplicado)
     - `/api/courses/[slug]/lessons/[lessonId]/activities` → Valida curso (duplicado)
     - `/api/courses/[slug]/lessons/[lessonId]/materials` → Valida curso (duplicado)
     - `/api/courses/[slug]/questions` → Valida curso (duplicado)
     - `/api/courses/[slug]/notes/stats` → Valida curso (duplicado)

3. **Consultas Secuenciales en lugar de Paralelas**
   - En `apps/web/src/app/courses/[slug]/learn/page.tsx`:
     - Se hacen múltiples `fetch()` separados que podrían combinarse
     - Prefetch en paralelo pero sin optimización de caché HTTP

4. **Falta de Caché Estratégico**
   - Headers de caché no optimizados para datos estáticos
   - No hay invalidación de caché inteligente
   - Datos que no cambian frecuentemente se recargan en cada request

5. **Consultas SQL No Optimizadas**
   - Múltiples queries pequeñas en lugar de una query grande con JOINs
   - Falta de índices en columnas frecuentemente consultadas
   - No se están usando `select()` específicos en todos los casos

6. **Waterfall de Requests**
   - La página espera a que termine una request antes de iniciar la siguiente
   - No hay prefetching inteligente de datos relacionados

## Objetivos de Optimización

### Metas de Rendimiento
- **Tiempo de carga inicial**: Reducir de 25s a < 3s
- **Time to Interactive (TTI)**: < 2s
- **First Contentful Paint (FCP)**: < 1s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Requests HTTP**: Reducir de 29 a < 10 por página
- **Tamaño de transferencia**: Optimizar payloads

### Métricas Técnicas
- **Connection Pool Hit Rate**: > 80%
- **Query Time**: < 100ms por query compleja
- **Cache Hit Rate**: > 60% para datos estáticos
- **Concurrent Requests**: Maximizar paralelización

## Tareas de Optimización

### 1. Implementar Connection Pooling Real

#### Tarea 1.1: Modificar `lib/supabase/server.ts`
- **Problema**: Actualmente cada llamada a `createClient()` crea un nuevo cliente
- **Solución**: Implementar singleton pattern que reutilice clientes basados en contexto
- **Requisitos**:
  - Crear un pool de clientes por contexto (usuario autenticado vs anónimo)
  - Reutilizar clientes dentro del mismo request lifecycle
  - Implementar LRU cache para clientes
  - Mantener máximo 10 conexiones activas
  - Logging de hit/miss rate en desarrollo

#### Tarea 1.2: Actualizar todos los endpoints para usar el pool
- **Archivos afectados**: ~238 archivos que usan `createClient()`
- **Estrategia**: 
  - Crear wrapper function `getSupabaseClient()` que use el pool
  - Reemplazar gradualmente `createClient()` por `getSupabaseClient()`
  - Priorizar endpoints críticos primero:
    - `/api/courses/[slug]/modules`
    - `/api/courses/[slug]/lessons/[lessonId]/*`
    - `/api/courses/[slug]/questions`

#### Tarea 1.3: Optimizar `lib/supabase/pool.ts`
- **Mejoras necesarias**:
  - Agregar soporte para clientes con cookies (server-side)
  - Implementar TTL para conexiones inactivas
  - Agregar métricas de rendimiento
  - Manejar errores de conexión y reconexión automática

### 2. Consolidar Endpoints de Curso

#### Tarea 2.1: Crear endpoint unificado `/api/courses/[slug]/learn-data`
- **Problema**: La página hace 6+ requests separados:
  - `/api/courses/[slug]` - Datos del curso
  - `/api/courses/[slug]/modules` - Módulos y lecciones
  - `/api/courses/[slug]/lessons/[lessonId]/transcript` - Transcripción
  - `/api/courses/[slug]/lessons/[lessonId]/summary` - Resumen
  - `/api/courses/[slug]/lessons/[lessonId]/activities` - Actividades
  - `/api/courses/[slug]/lessons/[lessonId]/materials` - Materiales
  - `/api/courses/[slug]/questions` - Preguntas
  - `/api/courses/[slug]/notes/stats` - Estadísticas de notas

- **Solución**: Crear un endpoint que devuelva todos los datos necesarios en una sola request:
```typescript
GET /api/courses/[slug]/learn-data?lessonId=[lessonId]
Response: {
  course: {...},
  modules: [...],
  currentLesson: {
    transcript: "...",
    summary: "...",
    activities: [...],
    materials: [...]
  },
  questions: [...],
  notesStats: {...}
}
```

- **Beneficios**:
  - Reducir de 8 requests a 1 request
  - Validar curso una sola vez
  - Ejecutar queries en paralelo en el servidor
  - Reducir overhead de HTTP

#### Tarea 2.2: Implementar endpoint incremental para cambio de lección
- **Endpoint**: `/api/courses/[slug]/lessons/[lessonId]/data`
- **Propósito**: Cuando el usuario cambia de lección, solo cargar datos de esa lección
- **Payload**: Solo transcript, summary, activities, materials de la lección actual

### 3. Optimizar Consultas SQL

#### Tarea 3.1: Consolidar validaciones de curso
- **Problema**: Cada endpoint valida el curso por slug
- **Solución**: 
  - Crear middleware `validateCourse()` que cachee el resultado
  - Usar el `courseId` del cache en lugar de consultar de nuevo
  - Implementar caché en memoria con TTL de 5 minutos

#### Tarea 3.2: Optimizar query de módulos y lecciones
- **Archivo**: `apps/web/src/app/api/courses/[slug]/modules/route.ts`
- **Mejoras**:
  - Usar un solo JOIN para obtener módulos + lecciones + progreso
  - Reducir número de queries de 3-4 a 1-2
  - Agregar índices en:
    - `courses.slug`
    - `course_modules.course_id`
    - `course_lessons.module_id`
    - `user_lesson_progress.enrollment_id, lesson_id`

#### Tarea 3.3: Optimizar query de preguntas
- **Archivo**: `apps/web/src/app/api/courses/[slug]/questions/route.ts`
- **Mejoras**:
  - Usar agregaciones SQL en lugar de procesar en JavaScript
  - Usar `COUNT()` y `GROUP BY` para conteos
  - Reducir datos transferidos usando `select()` específico

#### Tarea 3.4: Crear índices en base de datos
```sql
-- Índices críticos para rendimiento
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_enrollment_lesson ON user_lesson_progress(enrollment_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_questions_course_id ON course_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_questions_created_at ON course_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_user_course ON user_course_enrollments(user_id, course_id);
```

### 4. Implementar Caché Estratégico

#### Tarea 4.1: Caché HTTP para datos estáticos
- **Archivos estáticos**:
  - Transcripciones: Cache 1 hora (raramente cambian)
  - Resúmenes: Cache 1 hora
  - Materiales: Cache 30 minutos
  - Datos de curso: Cache 5 minutos (con revalidación)

- **Implementar en**:
  - `apps/web/src/lib/utils/cache-headers.ts` (ya existe, mejorar)
  - Agregar headers `Cache-Control` apropiados
  - Implementar `ETag` para validación condicional

#### Tarea 4.2: Caché en memoria para validaciones
- **Implementar caché LRU** para:
  - Validación de curso por slug → courseId
  - Datos de usuario actual
  - Permisos de acceso

- **Librería sugerida**: `lru-cache` o implementación propia
- **TTL**: 5 minutos para datos de curso, 1 minuto para datos de usuario

#### Tarea 4.3: SWR/React Query optimizado
- **Archivo**: `apps/web/src/features/courses/hooks/useCourses.ts`
- **Mejoras**:
  - Aumentar `dedupingInterval` a 30 segundos
  - Implementar `staleTime` para datos que no cambian frecuentemente
  - Usar `keepPreviousData` para transiciones suaves

### 5. Optimizar Frontend

#### Tarea 5.1: Lazy Loading de Componentes
- **Implementar**:
  - Lazy load de tabs no activos (transcript, summary, activities)
  - Code splitting por ruta
  - Dynamic imports para componentes pesados

#### Tarea 5.2: Prefetching Inteligente
- **Mejorar prefetch** en `apps/web/src/app/courses/[slug]/learn/page.tsx`:
  - Prefetch datos de lección siguiente cuando el usuario está cerca del final
  - Prefetch módulos completos cuando se carga el curso
  - Usar `<link rel="prefetch">` para recursos críticos

#### Tarea 5.3: Optimistic Updates
- **Implementar**:
  - Actualizar UI inmediatamente al marcar lección como completada
  - Sincronizar con servidor en background
  - Rollback si falla la actualización

#### Tarea 5.4: Reducir Re-renders
- **Optimizar**:
  - Usar `React.memo()` para componentes pesados
  - Implementar `useMemo()` para cálculos costosos
  - Evitar re-renders innecesarios con `useCallback()`

### 6. Optimizar Base de Datos

#### Tarea 6.1: Analizar y Optimizar Queries Lentas
- **Herramientas**:
  - Usar `EXPLAIN ANALYZE` en Supabase SQL Editor
  - Identificar queries que toman > 100ms
  - Optimizar usando índices y JOINs eficientes

#### Tarea 6.2: Implementar Materialized Views
- **Para datos agregados**:
  - Estadísticas de curso (student_count, review_count)
  - Progreso agregado por usuario
  - Conteos de preguntas/respuestas

#### Tarea 6.3: Connection Pooling a Nivel de Supabase
- **Configurar**:
  - Usar Supabase Connection Pooler (PgBouncer)
  - Configurar pool size apropiado
  - Usar connection string con `?pgbouncer=true`

### 7. Monitoreo y Métricas

#### Tarea 7.1: Implementar Logging de Rendimiento
- **Agregar**:
  - Tiempo de ejecución de queries
  - Hit/miss rate del connection pool
  - Tiempo de respuesta de endpoints
  - Cache hit rate

#### Tarea 7.2: Crear Dashboard de Métricas
- **Métricas a mostrar**:
  - Tiempo promedio de carga de páginas
  - Número de requests por página
  - Tamaño de transferencia
  - Connection pool statistics

## Priorización de Tareas

### Fase 1: Quick Wins (Impacto Alto, Esfuerzo Bajo)
1. ✅ Implementar connection pooling real
2. ✅ Crear endpoint unificado `/api/courses/[slug]/learn-data`
3. ✅ Agregar índices críticos en base de datos
4. ✅ Implementar caché HTTP para datos estáticos

**Tiempo estimado**: 2-3 días
**Reducción esperada**: 15-20 segundos → 5-8 segundos

### Fase 2: Optimizaciones Medias (Impacto Alto, Esfuerzo Medio)
1. ✅ Consolidar validaciones de curso
2. ✅ Optimizar queries SQL con JOINs
3. ✅ Implementar caché en memoria
4. ✅ Optimizar frontend con lazy loading

**Tiempo estimado**: 3-4 días
**Reducción esperada**: 5-8 segundos → 2-3 segundos

### Fase 3: Optimizaciones Avanzadas (Impacto Medio, Esfuerzo Alto)
1. ✅ Materialized views
2. ✅ Prefetching inteligente avanzado
3. ✅ Optimizaciones de base de datos profundas
4. ✅ Monitoreo y métricas completas

**Tiempo estimado**: 2-3 días
**Reducción esperada**: 2-3 segundos → < 2 segundos

## Criterios de Éxito

### Métricas Objetivo
- ✅ Tiempo de carga inicial: **< 3 segundos** (actualmente 25s)
- ✅ Time to Interactive: **< 2 segundos**
- ✅ Requests HTTP: **< 10 por página** (actualmente 29)
- ✅ Connection Pool Hit Rate: **> 80%**
- ✅ Cache Hit Rate: **> 60%**
- ✅ Query Time promedio: **< 100ms**

### Validación
1. Ejecutar Lighthouse audit antes y después
2. Comparar métricas de Network tab en DevTools
3. Medir tiempos de respuesta en producción
4. Monitorear connection pool statistics

## Archivos Clave a Modificar

### Backend/API
- `apps/web/src/lib/supabase/server.ts` - Connection pooling
- `apps/web/src/lib/supabase/pool.ts` - Mejorar pool existente
- `apps/web/src/app/api/courses/[slug]/modules/route.ts` - Optimizar queries
- `apps/web/src/app/api/courses/[slug]/questions/route.ts` - Optimizar queries
- `apps/web/src/app/api/courses/[slug]/lessons/[lessonId]/*/route.ts` - Consolidar
- `apps/web/src/app/api/courses/[slug]/learn-data/route.ts` - **NUEVO** endpoint unificado

### Frontend
- `apps/web/src/app/courses/[slug]/learn/page.tsx` - Usar endpoint unificado
- `apps/web/src/features/courses/hooks/useCourses.ts` - Optimizar SWR
- `apps/web/src/lib/utils/cache-headers.ts` - Mejorar caché HTTP

### Base de Datos
- Crear migración SQL con índices (archivo nuevo)
- `Nueva carpeta/BD.sql` - Referencia del schema

## Notas Importantes

1. **No romper funcionalidad existente**: Mantener compatibilidad con endpoints actuales durante la transición
2. **Testing exhaustivo**: Probar cada optimización en desarrollo antes de producción
3. **Monitoreo continuo**: Implementar alertas para detectar regresiones de rendimiento
4. **Documentación**: Documentar cambios en connection pooling y nuevos endpoints
5. **Rollback plan**: Tener plan de rollback para cada cambio crítico

## Referencias

- **Archivo HAR**: `aprendeyaplica.ai.har` - Análisis de requests
- **Schema BD**: `Nueva carpeta/BD.sql` - Estructura de base de datos
- **Documentación**: `CLAUDE.md` - Arquitectura del proyecto
- **Connection Pool**: `apps/web/src/lib/supabase/pool.ts` - Pool existente (no usado)

---

**Fecha de creación**: Diciembre 2024
**Prioridad**: CRÍTICA
**Impacto esperado**: Reducción del 90% en tiempo de carga (25s → 2-3s)

