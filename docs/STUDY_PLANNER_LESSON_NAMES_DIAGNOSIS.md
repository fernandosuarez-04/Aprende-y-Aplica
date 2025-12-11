# Study Planner - Diagnóstico y Corrección de Nombres de Lecciones

## Estado Actual

### Problema
Al crear un plan de estudios, **NO se muestran los nombres reales de las lecciones** en las sesiones generadas.

### Impacto
- Los usuarios no saben qué lecciones específicas van a estudiar en cada sesión
- El plan de estudios pierde valor educativo y claridad
- Las sesiones muestran solo información genérica en lugar de nombres de lecciones

---

## Análisis Técnico

### Arquitectura Actual - Dos Sistemas Diferentes

Existen **DOS sistemas paralelos** para generar planes de estudio:

#### 1. Sistema Viejo (`/api/study-planner/generate-plan`)
**Archivo**: `apps/web/src/app/api/study-planner/generate-plan/route.ts`

**Flujo**:
```typescript
CourseAnalysisService.getCourseLessons(courseId)
  ↓
CourseAnalysisService.getPendingLessons(userId, courseId)
  ↓
CourseAnalysisService.calculateLessonDuration(lessonId)
    ↓ Retorna LessonDuration con lessonTitle
generateSessions() → Crea StudySession[]
    ↓ Usa lesson.lessonTitle (línea 267, 285)
```

**Estado**: ✅ **FUNCIONA CORRECTAMENTE** - Los nombres se obtienen de `course_lessons.lesson_title`

#### 2. Sistema Nuevo (StudyPlannerLIA - Conversacional)
**Archivo**: `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx`

**Flujo**:
```typescript
fetch('/api/workshops/${courseId}/metadata') (línea 3529)
  ↓
Extrae lesson.lessonTitle (línea 3547)
  ↓
allLessonsByCourse.set(courseId, publishedLessons) (línea 3589)
  ↓
allPendingLessons.push({ lesson_title: lesson.lesson_title }) (línea 3671)
  ↓
savedLessonDistribution con lesson_title (línea 3982)
```

**Estado**: ✅ **OBTIENE correctamente los nombres** desde `/api/workshops/${courseId}/metadata`

---

## Causa Raíz del Problema

### Discrepancia entre Sistemas

1. **El sistema LIA obtiene correctamente los nombres** de las lecciones desde el endpoint `/api/workshops/${courseId}/metadata`

2. **PERO** cuando el usuario confirma el plan, el sistema puede estar:
   - Usando el endpoint viejo `/api/study-planner/generate-plan` que podría tener un problema
   - O no está preservando los nombres de las lecciones al guardar

3. **Inconsistencia en tipos**:
   - `StudyPlannerLIA.tsx` usa: `lesson_title` (snake_case)
   - `user-context.types.ts` define: `lessonTitle` (camelCase)
   - `generate-plan/route.ts` usa: `lessonTitle` (camelCase)

### Posibles Puntos de Falla

#### A. Endpoint `/api/workshops/${courseId}/metadata`
- **¿Qué retorna?**: Necesita retornar módulos con lecciones incluyendo `lessonTitle`
- **Estado**: Por confirmar si funciona correctamente

#### B. Guardado del Plan
- El plan generado por LIA con `lesson_title` **NO se está guardando** o **NO se está convirtiendo** correctamente al formato final

#### C. Tipos Inconsistentes
```typescript
// StudyPlannerLIA.tsx (línea 3671)
lesson_title: lesson.lesson_title.trim()  // snake_case

// user-context.types.ts (línea 214)
lessonTitle: string;  // camelCase

// generate-plan/route.ts (línea 285)
description: sessionLessons.map(s => s.lesson.lessonTitle).join(', ')  // camelCase
```

---

## Verificación de Endpoints

### 1. `/api/workshops/${courseId}/metadata`
**Debe retornar**:
```json
{
  "success": true,
  "metadata": {
    "modules": [
      {
        "moduleId": "...",
        "moduleTitle": "...",
        "moduleOrderIndex": 0,
        "lessons": [
          {
            "lessonId": "...",
            "lessonTitle": "Nombre Real de la Lección",  // ← CRÍTICO
            "lessonOrderIndex": 0,
            "durationSeconds": 300
          }
        ]
      }
    ]
  }
}
```

**Ubicación del endpoint**: Por verificar en `apps/web/src/app/api/workshops/[id]/metadata/`

### 2. Tabla `course_lessons` en Supabase
**Columna**: `lesson_title`

**Query usado por CourseAnalysisService** (línea 182-185):
```sql
SELECT lesson_id, lesson_title, duration_seconds
FROM course_lessons
WHERE lesson_id = ?
```

✅ **Este funciona correctamente**

---

## Plan de Corrección

### Fase 1: Diagnóstico Detallado ⚡ ALTA PRIORIDAD

#### 1.1 Verificar Endpoint de Metadata
**Archivo**: Buscar `apps/web/src/app/api/workshops/[id]/metadata/route.ts`

**Verificar**:
- ✅ Que exista el archivo
- ✅ Que retorne `lessonTitle` en cada lección
- ✅ Que el query a Supabase incluya `lesson_title`

#### 1.2 Verificar Componente StudyPlannerLIA
**Archivo**: `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx`

**Buscar**:
- Función que guarda el plan final (buscar `fetch` con método `POST` a `/api/study-planner/save-plan` o similar)
- Verificar si convierte `lesson_title` → `lessonTitle`
- Ver qué datos se envían al guardar

#### 1.3 Verificar Tabla `course_lessons`
**SQL Query**:
```sql
SELECT lesson_id, lesson_title
FROM course_lessons
WHERE course_id = 'COURSE_ID_DE_PRUEBA'
LIMIT 5;
```

**Verificar**: Que las lecciones tengan `lesson_title` NO nulo

---

### Fase 2: Implementación de Correcciones

#### Opción A: Unificar a Sistema Nuevo (RECOMENDADO)

**Migrar completamente al sistema LIA** y deprecar el endpoint viejo.

**Pasos**:

1. **Normalizar tipos** - Cambiar todo a `camelCase`

   **Archivo**: `StudyPlannerLIA.tsx` (línea 3671)
   ```typescript
   // ANTES
   lesson_title: lesson.lesson_title.trim()

   // DESPUÉS
   lessonTitle: lesson.lessonTitle.trim()
   ```

2. **Actualizar endpoint `/api/workshops/[id]/metadata`**

   Asegurar que retorne `lessonTitle` (camelCase):
   ```typescript
   {
     lessonId: row.lesson_id,
     lessonTitle: row.lesson_title,  // ← Mapear correctamente
     lessonOrderIndex: row.lesson_order_index,
     durationSeconds: row.duration_seconds
   }
   ```

3. **Actualizar tipos** en `user-context.types.ts`

   Confirmar que `StudySession` tenga:
   ```typescript
   export interface StudySession {
     id: string;
     title: string;
     description?: string;  // Nombres de lecciones separados por comas
     courseId: string;
     lessonId?: string;     // ← ID de la lección
     lessonTitle?: string;  // ← AGREGAR si no existe
     // ... resto de campos
   }
   ```

4. **Modificar guardado del plan**

   **Buscar en StudyPlannerLIA**: Función que guarda el plan

   Asegurar que incluya:
   ```typescript
   sessions: savedLessonDistribution.map(dist => ({
     ...session,
     lessonTitle: dist.lessons.map(l => l.lessonTitle).join(', '),  // ← Usar lessonTitle
     description: dist.lessons.map(l => l.lessonTitle).join(', ')
   }))
   ```

#### Opción B: Corregir Sistema Viejo (ALTERNATIVA)

Si se sigue usando `/api/study-planner/generate-plan`:

1. **Verificar CourseAnalysisService.calculateLessonDuration()**

   **Archivo**: `course-analysis.service.ts` (línea 169-278)

   Confirmar que retorna:
   ```typescript
   return {
     lessonId,
     lessonTitle: lesson.lesson_title,  // ← Verificar que esté correcto
     // ...
   }
   ```

2. **Verificar generateSessions()**

   **Archivo**: `generate-plan/route.ts` (línea 285)

   Confirmar que usa:
   ```typescript
   description: sessionLessons.map(s => s.lesson.lessonTitle).join(', ')
   ```

---

### Fase 3: Testing

#### 3.1 Test Manual
1. Crear un plan de estudios desde cero
2. Seleccionar un curso conocido
3. Verificar en el resumen que aparezcan nombres de lecciones, NO solo "Lección 1, Lección 2"
4. Guardar el plan
5. Ver el plan guardado y confirmar que los nombres persisten

#### 3.2 Test de Datos
```sql
-- Verificar que las lecciones tengan nombres
SELECT
  c.title as curso,
  l.lesson_title,
  l.lesson_order_index
FROM course_lessons l
JOIN courses c ON c.id = l.course_id
WHERE c.id = 'COURSE_ID_DE_PRUEBA'
ORDER BY l.lesson_order_index
LIMIT 10;
```

#### 3.3 Test de API
```bash
# Test endpoint metadata
curl http://localhost:3000/api/workshops/COURSE_ID/metadata

# Verificar que retorne lessonTitle en cada lección
```

---

## Checklist de Corrección

### 🔍 Diagnóstico
- [ ] Verificar que `/api/workshops/[id]/metadata` retorne `lessonTitle`
- [ ] Verificar que `course_lessons.lesson_title` tenga datos
- [ ] Identificar dónde se guarda el plan final en StudyPlannerLIA
- [ ] Confirmar qué sistema se usa actualmente (viejo vs nuevo)

### 🔧 Correcciones
- [ ] Unificar nomenclatura: `lesson_title` → `lessonTitle`
- [ ] Actualizar tipos en `user-context.types.ts` si falta `lessonTitle` en `StudySession`
- [ ] Corregir mapeo en endpoint `/api/workshops/[id]/metadata`
- [ ] Verificar guardado del plan preserve `lessonTitle`
- [ ] Actualizar `StudyPlannerLIA.tsx` para usar `lessonTitle` (camelCase)

### ✅ Validación
- [ ] Test manual: Crear plan y ver nombres de lecciones
- [ ] Test de datos: Verificar BD tiene nombres
- [ ] Test de API: Endpoints retornan nombres
- [ ] Code review: Eliminar inconsistencias

---

## Documentación de Referencia

### Archivos Clave

1. **Endpoint viejo**: `apps/web/src/app/api/study-planner/generate-plan/route.ts`
2. **Servicio de análisis**: `apps/web/src/features/study-planner/services/course-analysis.service.ts`
3. **Componente LIA**: `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx`
4. **Tipos**: `apps/web/src/features/study-planner/types/user-context.types.ts`
5. **Endpoint metadata**: `apps/web/src/app/api/workshops/[id]/metadata/` (por ubicar)

### Tablas de Base de Datos

- `course_lessons.lesson_title` - Nombres de lecciones
- `lesson_time_estimates.lesson_id` - Duraciones precalculadas
- `user_lesson_progress` - Progreso del usuario

---

## Próximos Pasos Inmediatos

1. ⚡ **Buscar el archivo** `/api/workshops/[id]/metadata/route.ts`
2. ⚡ **Verificar** que retorne `lessonTitle` correctamente
3. ⚡ **Buscar función** de guardado en `StudyPlannerLIA.tsx` (buscar `save-plan` o `POST`)
4. ⚡ **Decidir**: ¿Corregir sistema viejo O migrar al nuevo?
5. ⚡ **Implementar** correcciones según opción elegida

---

## Conclusión

**El problema NO es que los nombres no existan** - están en la base de datos.

**El problema ES**:
1. Inconsistencia entre `lesson_title` (snake_case) y `lessonTitle` (camelCase)
2. Posible pérdida de datos al guardar el plan
3. Dos sistemas paralelos que pueden estar en conflicto

**Solución preferida**: Unificar todo al sistema nuevo (StudyPlannerLIA) con nomenclatura consistente en camelCase.
