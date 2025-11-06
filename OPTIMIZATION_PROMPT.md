# 🚀 PROMPT DE OPTIMIZACIÓN DE CONSULTAS A BASE DE DATOS

## 📋 CONTEXTO DEL PROYECTO

**Proyecto**: Aprende y Aplica - Plataforma educativa full-stack
- **Frontend**: Next.js 15.5.4 con App Router
- **Backend**: Express 4.18.2
- **Base de Datos**: Supabase (PostgreSQL)
- **Arquitectura**: Monorepo con Screaming Architecture

**Archivo de contexto**: Revisa `CLAUDE.md` para entender completamente la estructura del proyecto, patrones de código, y arquitectura.

## 🎯 PROBLEMA CRÍTICO

### Síntomas Actuales:
- ⏱️ **Tiempos de carga excesivos**: 20-30 segundos en páginas críticas
- 🐌 **Panel de cursos**: Carga extremadamente lenta
- 🐌 **Dashboard**: Tiempos de respuesta inaceptables
- 🐌 **Inicio de sesión**: Demora significativa
- 📊 **Problema identificado**: NO es la base de datos, sino **demasiadas consultas** (N+1 queries, consultas secuenciales, falta de batching)

### Áreas Críticas Identificadas:
1. **Panel de Cursos** (`apps/web/src/features/courses/`)
   - Múltiples consultas secuenciales para obtener cursos e instructores
   - Consultas individuales por cada curso para favoritos
   - Falta de agregación de datos relacionados

2. **Dashboard** (`apps/web/src/app/dashboard/page.tsx`)
   - Múltiples llamadas fetch secuenciales
   - Consultas separadas para estadísticas, cursos, categorías
   - Falta de paralelización efectiva

3. **Servicios Admin** (`apps/web/src/features/admin/services/`)
   - `adminCourses.service.ts`: Consulta individual por cada curso para obtener instructor (N+1)
   - `adminStats.service.ts`: Múltiples consultas secuenciales sin optimización
   - Falta de batching y agregación

4. **Servicios de Cursos** (`apps/web/src/features/courses/services/`)
   - `course.service.ts`: Consultas separadas para favoritos e instructores
   - Falta de JOINs optimizados
   - Consultas repetitivas sin caché

## 🎯 OBJETIVOS DE OPTIMIZACIÓN

### Meta Principal:
**Reducir tiempos de respuesta de 20-30 segundos a menos de 2-3 segundos** mediante:
1. ✅ Eliminación de consultas N+1
2. ✅ Implementación de Connection Pooling
3. ✅ Batching de consultas relacionadas
4. ✅ Uso de JOINs optimizados
5. ✅ Paralelización de consultas independientes
6. ✅ Implementación de vistas materializadas donde sea apropiado
7. ✅ Caché estratégico para datos frecuentemente accedidos

### Criterios de Éxito:
- ⚡ **Tiempo de respuesta < 2-3 segundos** en páginas críticas
- 📉 **Reducción de consultas > 80%** en endpoints principales
- ✅ **Sin romper funcionalidad existente** - Solo optimizar, no cambiar comportamiento
- 🔒 **Mantener seguridad** - No comprometer RLS policies o validaciones
- 📊 **Mejorar métricas** - Reducir carga en base de datos y mejorar UX

## 🔧 ESTRATEGIAS DE OPTIMIZACIÓN REQUERIDAS

### 1. Connection Pooling
**Implementar connection pooling para Supabase**:
- Configurar pool de conexiones reutilizables
- Evitar crear nuevos clientes en cada request
- Usar singleton pattern para cliente de Supabase
- Configurar límites apropiados (min: 2, max: 10 conexiones)

**Archivos a modificar**:
- `apps/web/src/lib/supabase/server.ts` - Implementar pool de conexiones
- `apps/web/src/lib/supabase/client.ts` - Optimizar cliente del navegador
- Crear `apps/web/src/lib/supabase/pool.ts` - Gestor de pool

### 2. Eliminación de N+1 Queries

**Problema identificado en `adminCourses.service.ts`**:
```typescript
// ❌ ACTUAL (N+1 queries)
const courses = await supabase.from('courses').select('*')
for (course of courses) {
  // 1 query por cada curso para obtener instructor
  const { data: instructor } = await supabase
    .from('users')
    .select('*')
    .eq('id', course.instructor_id)
    .single()
}
// = 1 + N queries (si hay 100 cursos = 101 queries)

// ✅ OPTIMIZADO (1 query con JOIN)
const { data } = await supabase
  .from('courses')
  .select(`
    *,
    instructor:users!instructor_id (
      id,
      first_name,
      last_name,
      display_name
    )
  `)
// = 1 query total
```

**Archivos a optimizar**:
- `apps/web/src/features/admin/services/adminCourses.service.ts`
- `apps/web/src/features/courses/services/course.service.ts`
- `apps/web/src/features/admin/services/adminStats.service.ts`
- Cualquier servicio que haga consultas en loops

### 3. Batching de Consultas

**Agrupar consultas relacionadas**:
```typescript
// ❌ ACTUAL (consultas secuenciales)
const courses = await getCourses()
const favorites = await getFavorites(userId)
const instructors = await getInstructors(courseIds)
const stats = await getStats()

// ✅ OPTIMIZADO (consultas paralelas)
const [courses, favorites, instructors, stats] = await Promise.all([
  getCourses(),
  getFavorites(userId),
  getInstructors(courseIds),
  getStats()
])
```

**Archivos a optimizar**:
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/features/courses/services/course.service.ts`
- Todos los endpoints de API que hagan múltiples consultas

### 4. Vistas Materializadas y Agregaciones

**Crear vistas para datos frecuentemente consultados**:
- Similar a `community_stats` (ver `database-fixes/OPTIMIZATION_COMPLETE.md`)
- Crear vistas para estadísticas de cursos, usuarios, etc.
- Usar índices apropiados

**Ejemplo**:
```sql
CREATE MATERIALIZED VIEW course_stats AS
SELECT 
  c.id,
  c.title,
  c.instructor_id,
  u.display_name as instructor_name,
  COUNT(DISTINCT uf.user_id) as favorite_count,
  COUNT(DISTINCT pc.user_id) as purchase_count,
  AVG(cr.rating) as average_rating
FROM courses c
LEFT JOIN users u ON c.instructor_id = u.id
LEFT JOIN user_favorites uf ON c.id = uf.course_id
LEFT JOIN purchased_courses pc ON c.id = pc.course_id
LEFT JOIN course_reviews cr ON c.id = cr.course_id
GROUP BY c.id, c.title, c.instructor_id, u.display_name;
```

### 5. Optimización de SELECTs

**Solo seleccionar campos necesarios**:
```typescript
// ❌ ACTUAL
.select('*')

// ✅ OPTIMIZADO
.select('id, title, description, instructor_id, thumbnail_url')
```

### 6. Índices Estratégicos

**Asegurar índices en campos frecuentemente consultados**:
- Foreign keys (instructor_id, course_id, user_id)
- Campos de filtrado (is_active, status, category)
- Campos de ordenamiento (created_at, updated_at)

## 📝 PLAN DE ACCIÓN DETALLADO

### Fase 1: Análisis y Auditoría
1. ✅ Identificar todos los servicios que hacen consultas a la BD
2. ✅ Contar consultas por endpoint/página
3. ✅ Identificar patrones N+1
4. ✅ Mapear dependencias entre consultas

### Fase 2: Connection Pooling
1. ✅ Implementar pool de conexiones en `lib/supabase/pool.ts`
2. ✅ Modificar `lib/supabase/server.ts` para usar pool
3. ✅ Configurar límites apropiados
4. ✅ Agregar logging de uso del pool

### Fase 3: Optimización de Servicios Críticos
1. ✅ **adminCourses.service.ts**: Eliminar N+1 queries con JOINs
2. ✅ **course.service.ts**: Batch consultas de favoritos e instructores
3. ✅ **adminStats.service.ts**: Paralelizar consultas independientes
4. ✅ **dashboard/page.tsx**: Consolidar llamadas fetch

### Fase 4: Vistas y Agregaciones
1. ✅ Crear vistas materializadas para estadísticas
2. ✅ Implementar índices faltantes
3. ✅ Optimizar consultas complejas con agregaciones

### Fase 5: Testing y Validación
1. ✅ Verificar que no se rompió funcionalidad
2. ✅ Medir mejoras de performance
3. ✅ Validar en entorno local y deployado

## 🚨 REGLAS CRÍTICAS

### ⚠️ NO DEBES:
- ❌ Cambiar la lógica de negocio
- ❌ Modificar la estructura de datos devueltos (solo optimizar cómo se obtienen)
- ❌ Eliminar validaciones o seguridad
- ❌ Romper RLS policies de Supabase
- ❌ Cambiar la API pública de los servicios

### ✅ DEBES:
- ✅ Mantener la misma interfaz de los servicios
- ✅ Preservar todos los datos devueltos
- ✅ Mantener manejo de errores
- ✅ Agregar logging para monitoreo
- ✅ Documentar cambios importantes

## 📊 MÉTRICAS DE ÉXITO

### Antes de Optimización:
- Panel de cursos: ~20-30 segundos
- Dashboard: ~15-25 segundos
- Inicio de sesión: ~10-15 segundos
- Consultas por página: 50-200+ queries

### Después de Optimización (Meta):
- Panel de cursos: < 2-3 segundos
- Dashboard: < 2-3 segundos
- Inicio de sesión: < 1-2 segundos
- Consultas por página: < 5-10 queries

## 🔍 ARCHIVOS PRIORITARIOS PARA REVISAR

### Servicios Críticos:
1. `apps/web/src/features/courses/services/course.service.ts`
2. `apps/web/src/features/admin/services/adminCourses.service.ts`
3. `apps/web/src/features/admin/services/adminStats.service.ts`
4. `apps/web/src/features/courses/services/purchased-courses.service.ts`
5. `apps/web/src/features/admin/services/adminUsers.service.ts`

### Páginas Críticas:
1. `apps/web/src/app/dashboard/page.tsx`
2. `apps/web/src/app/courses/[slug]/page.tsx`
3. `apps/web/src/app/admin/courses/page.tsx`

### Endpoints API:
1. `apps/web/src/app/api/courses/route.ts`
2. `apps/web/src/app/api/my-courses/route.ts`
3. `apps/web/src/app/api/admin/stats/route.ts`

## 💡 EJEMPLOS DE OPTIMIZACIONES EXITOSAS

Revisa `database-fixes/OPTIMIZATION_COMPLETE.md` para ver cómo se optimizó el problema de comunidades:
- **Antes**: 501 queries → 25 segundos
- **Después**: 1 query → 0.1 segundos
- **Mejora**: 250x más rápido

Aplica el mismo patrón a cursos, dashboard, y otras áreas críticas.

## 🎯 RESULTADO ESPERADO

Al finalizar, el proyecto debe tener:
1. ✅ Connection pooling implementado y funcionando
2. ✅ Todas las consultas N+1 eliminadas
3. ✅ Consultas paralelizadas donde sea posible
4. ✅ Vistas materializadas para datos agregados
5. ✅ Tiempos de respuesta < 3 segundos en todas las páginas críticas
6. ✅ Código documentado y mantenible
7. ✅ Sin regresiones en funcionalidad

---

**IMPORTANTE**: Trabaja de forma sistemática, archivo por archivo, asegurándote de que cada optimización no rompe funcionalidad existente. Prueba cada cambio antes de continuar.

