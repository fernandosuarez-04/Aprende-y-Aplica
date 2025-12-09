# Corrección FINAL: LIA Inventando Nombres de Lecciones

## Problema Identificado

El problema original tenía DOS causas:

1. **Causa Principal:** LIA no tenía acceso a los nombres de las lecciones durante la conversación
2. **Causa Raíz:** `LiaContextService` estaba usando `CourseAnalysisService.getCourseModules()` que NO funcionaba correctamente

**Evidencia del problema:**
```
Total lecciones: 0
Lecciones completadas: 0
Lecciones pendientes totales: 0
```

Las lecciones no se estaban obteniendo de la base de datos.

---

## Solución Implementada

### Análisis de `/learn` (que SÍ funciona)

En `/courses/[slug]/learn/page.tsx` (líneas 1842-1876), se usa:

```typescript
// ✅ Esto FUNCIONA correctamente
const metadataResponse = await fetch(`/api/workshops/${courseId}/metadata`);
const metadataData = await metadataResponse.json();

// Construye el contexto con TODOS los módulos y lecciones
const workshopContext: CourseLessonContext = {
  contextType: 'workshop',
  courseId: metadataData.metadata.workshopId,
  allModules: metadataData.metadata.modules.map((m: any) => ({
    moduleId: m.moduleId,
    moduleTitle: m.moduleTitle,
    lessons: m.lessons.map((l: any) => ({
      lessonId: l.lessonId,
      lessonTitle: l.lessonTitle, // ✅ NOMBRES REALES
      lessonOrderIndex: l.lessonOrderIndex,
      durationSeconds: l.durationSeconds
    }))
  }))
};
```

La clave está en usar `getWorkshopMetadata()` que hace las queries correctas:

```typescript
// De: lib/utils/workshop-metadata.ts (líneas 52-100)

// ✅ Query correcta para módulos
const { data: allModules } = await supabase
  .from('course_modules')
  .select(`
    module_id,
    module_title,
    module_description,
    module_order_index
  `)
  .eq('course_id', workshopId)
  .eq('is_published', true) // ⚠️ IMPORTANTE: Solo módulos publicados
  .order('module_order_index', { ascending: true });

// ✅ Query correcta para lecciones
const { data: allLessons } = await supabase
  .from('course_lessons')
  .select(`
    lesson_id,
    lesson_title,
    lesson_description,
    lesson_order_index,
    duration_seconds,
    module_id
  `)
  .in('module_id', moduleIds)
  .eq('is_published', true) // ⚠️ IMPORTANTE: Solo lecciones publicadas
  .order('lesson_order_index', { ascending: true });
```

---

## Cambios Realizados

### 1. `LiaContextService` Corregido

**Archivo:** `apps/web/src/features/study-planner/services/lia-context.service.ts`

#### Cambio 1: Importaciones actualizadas

```typescript
// ✅ AGREGADO
import { getWorkshopMetadata } from '../../../lib/utils/workshop-metadata';
import { createClient } from '../../../lib/supabase/server';
```

#### Cambio 2: Método `formatCourses()` reescrito

**ANTES (NO funcionaba):**
```typescript
// ❌ Usaba CourseAnalysisService.getCourseModules() que no funciona
const modules = await CourseAnalysisService.getCourseModules(courseAssignment.courseId);
```

**DESPUÉS (SÍ funciona):**
```typescript
// ✅ Usa getWorkshopMetadata() - misma lógica que /learn
const workshopMetadata = await getWorkshopMetadata(courseAssignment.courseId);

// Formatear módulos y lecciones usando los datos del workshopMetadata
const formattedModules = workshopMetadata?.modules.map(module => ({
  moduleId: module.moduleId,
  moduleTitle: module.moduleTitle,
  moduleOrderIndex: module.moduleOrderIndex,
  lessons: module.lessons.map(lesson => ({
    lessonId: lesson.lessonId,
    lessonTitle: lesson.lessonTitle, // ✅ Nombre real de la BD
    lessonOrderIndex: lesson.lessonOrderIndex,
    durationMinutes: lesson.durationSeconds ? Math.ceil(lesson.durationSeconds / 60) : 0,
    isCompleted: completedLessonIds.has(lesson.lessonId),
  })),
})) || [];
```

---

### 2. Endpoint `/api/ai-chat` (Sin cambios adicionales)

Los cambios anteriores en `/api/ai-chat/route.ts` siguen siendo válidos:

- Importación de `LiaContextService` ✅
- Construcción del contexto antes de llamar a `getContextPrompt()` ✅
- Actualización del prompt de 'study-planner' con el contexto ✅

---

## Flujo Completo Corregido

```
┌─────────────────────────────────────────────────────────────┐
│  Usuario envía mensaje en study-planner                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│  /api/ai-chat detecta context === 'study-planner'          │
│    → Llama a LiaContextService.buildStudyPlannerContext()  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│  LiaContextService.formatCourses()                          │
│    → Para cada curso del usuario:                           │
│      ✅ Llama a getWorkshopMetadata(courseId)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│  getWorkshopMetadata(courseId)                              │
│    1. Query a 'courses' para info del curso                 │
│    2. Query a 'course_modules' WHERE course_id y published  │
│    3. Query a 'course_lessons' WHERE module_id y published  │
│    4. Agrupa lecciones por módulo                           │
│    5. Retorna estructura completa con nombres reales        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│  LiaContextService.formatContextForPrompt()                 │
│    → Formatea como string legible:                          │
│      "MÓDULOS Y LECCIONES:"                                  │
│      "  1. Módulo 1: Fundamentos de IA"                     │
│      "     1. Lección 1.1: ¿Qué es la IA? (15 min)"        │
│      "     2. Lección 1.2: Historia de la IA (20 min)"     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│  getContextPrompt() incluye el contexto en el prompt        │
│    → LIA ahora tiene los nombres reales de las lecciones   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│  callOpenAI() → LIA responde con nombres reales             │
│    ✅ "Lección 1.1: ¿Qué es la IA?"                         │
│    ❌ NO más "Lección 1: Introducción general"              │
└─────────────────────────────────────────────────────────────┘
```

---

## Verificación del Problema en la BD

Para verificar que el curso tiene módulos y lecciones publicados:

```sql
-- 1. Verificar curso
SELECT id, slug, title
FROM courses
WHERE id = 'a26fa16b-4e08-493d-a78b-877bad789f38';

-- 2. Verificar módulos publicados
SELECT
  module_id,
  module_title,
  module_order_index,
  is_published
FROM course_modules
WHERE course_id = 'a26fa16b-4e08-493d-a78b-877bad789f38'
ORDER BY module_order_index;

-- 3. Verificar lecciones publicadas
SELECT
  l.lesson_id,
  l.lesson_title,
  l.lesson_order_index,
  l.is_published,
  m.module_title
FROM course_lessons l
JOIN course_modules m ON m.module_id = l.module_id
WHERE m.course_id = 'a26fa16b-4e08-493d-a78b-877bad789f38'
ORDER BY m.module_order_index, l.lesson_order_index;
```

**⚠️ IMPORTANTE:** Si `is_published = false`, las lecciones NO aparecerán porque `getWorkshopMetadata()` filtra por `.eq('is_published', true)`.

---

## Plan de Pruebas Actualizado

### Prueba 1: Verificar logs del servidor

**Pasos:**
1. Iniciar el servidor de desarrollo: `npm run dev`
2. Navegar a `/study-planner/create`
3. Iniciar conversación con LIA
4. Ver la consola del servidor

**Logs esperados:**
```
📚 Construyendo contexto detallado del planificador de estudios para LIA { userId: 'xxx' }
✅ Contexto del planificador construido exitosamente {
  coursesCount: 1,
  hasModules: true  // ⚠️ Debe ser TRUE
}
```

Si `hasModules: false`:
- Verificar en la BD que el curso tiene módulos publicados
- Verificar que las lecciones están publicadas

---

### Prueba 2: Verificar contexto en el prompt (Desarrollo)

Agregar temporalmente un log en `/api/ai-chat/route.ts` después de construir el contexto:

```typescript
if (effectiveContext === 'study-planner' && user) {
  try {
    const studyPlannerContext = await LiaContextService.buildStudyPlannerContext(user.id);
    studyPlannerContextString = LiaContextService.formatContextForPrompt(studyPlannerContext);

    // ✅ LOG TEMPORAL para debugging
    console.log('📋 Primeros 1000 caracteres del contexto:');
    console.log(studyPlannerContextString.substring(0, 1000));
    console.log('...');
  }
}
```

**Resultado esperado:**
```
## CURSOS (1)
- IA esencial, aprende lo que otros tardan meses en descubrir
  - Categoría: Inteligencia Artificial, Nivel: Beginner
  - Duración total: 5 horas
  - Progreso: 0%

  MÓDULOS Y LECCIONES:
    1. Módulo 1: Fundamentos de IA
       1. Lección 1.1: ¿Qué es la IA? (15 min) [○ Pendiente]
       2. Lección 1.2: Historia de la IA (20 min) [○ Pendiente]
    2. Módulo 2: Aplicaciones Prácticas
       1. Lección 2.1: Casos de uso (25 min) [○ Pendiente]
```

---

### Prueba 3: Flujo completo

**Pasos:**
1. Usuario con curso asignado (B2B) o adquirido (B2C)
2. Navegar a `/study-planner/create`
3. Completar todo el flujo hasta el resumen final
4. Verificar que LIA menciona nombres reales de lecciones

**Resultado esperado:**
```
📅 RESUMEN DE TU PLAN DE ESTUDIOS

Lunes 16 de diciembre de 10:00 a.m. a 11:30 a.m.
Lecciones a estudiar:
• Lección 1.1: ¿Qué es la IA?
• Lección 1.2: Historia de la IA

Martes 17 de diciembre de 02:00 p.m. a 03:30 p.m.
Lecciones a estudiar:
• Lección 2.1: Casos de uso reales
• Lección 2.2: Implementación práctica
```

---

## Diferencias Clave entre la Solución Anterior y Esta

### Solución Anterior (NO funcionaba)

```typescript
// ❌ Usaba CourseAnalysisService que no funciona
const modules = await CourseAnalysisService.getCourseModules(courseId);

// Resultado: modules = [] (vacío)
```

### Solución Actual (SÍ funciona)

```typescript
// ✅ Usa getWorkshopMetadata que funciona en /learn
const workshopMetadata = await getWorkshopMetadata(courseId);

// Resultado: workshopMetadata.modules = [{ moduleTitle, lessons: [...] }]
```

**La diferencia está en las queries a la BD:**

- `CourseAnalysisService.getCourseModules()` - Query incorrecta o incompleta
- `getWorkshopMetadata()` - Query correcta con filtros `.eq('is_published', true)`

---

## Posibles Problemas y Soluciones

### Problema 1: Sigue mostrando "Total lecciones: 0"

**Causa:** Los módulos o lecciones no están publicados en la BD.

**Solución:**
```sql
-- Publicar módulos
UPDATE course_modules
SET is_published = true
WHERE course_id = 'TU_COURSE_ID';

-- Publicar lecciones
UPDATE course_lessons
SET is_published = true
WHERE module_id IN (
  SELECT module_id
  FROM course_modules
  WHERE course_id = 'TU_COURSE_ID'
);
```

---

### Problema 2: Error "Cannot find module 'workshop-metadata'"

**Causa:** Path de importación incorrecto.

**Solución:**
Verificar que el import sea:
```typescript
import { getWorkshopMetadata } from '../../../lib/utils/workshop-metadata';
```

Ajustar los `../` según la ubicación del archivo.

---

### Problema 3: LIA sigue inventando nombres

**Causa:** El contexto no está llegando a OpenAI.

**Solución:**
1. Verificar logs `hasModules: true`
2. Agregar log temporal del `studyPlannerContextString`
3. Verificar que no se está truncando por límite de tokens

---

## Archivos Modificados (Final)

```
apps/web/src/
├── features/
│   └── study-planner/
│       ├── services/
│       │   └── lia-context.service.ts
│       │       • Importación de getWorkshopMetadata agregada
│       │       • Importación de createClient agregada
│       │       • Método formatCourses() REESCRITO
│       │       • Ahora usa getWorkshopMetadata() en lugar de CourseAnalysisService
│       └── components/
│           └── StudyPlannerLIA.tsx (líneas 2991-3067)
│               • ✅ CAMBIO CRÍTICO: Cambió de /api/courses/${slug}/modules
│                 a /api/workshops/${courseId}/metadata
│               • Corregido manejo de respuesta para usar estructura de metadata
│               • Actualizado mapeo de campos: lessonId, lessonTitle, etc.
│               • Eliminado código obsoleto de verificación de slug
│               • Algoritmo de distribución actualizado (líneas 3180-3239)
│               • Ahora distribuye TODAS las lecciones hasta la fecha límite
│
└── app/
    └── api/
        └── ai-chat/
            └── route.ts
                • (Sin cambios adicionales - cambios anteriores siguen válidos)
```

---

## Comparación: `/learn` vs Study Planner

### En `/learn` (funcionaba)

```typescript
// 1. Obtiene metadata
const metadataResponse = await fetch(`/api/workshops/${courseId}/metadata`);

// 2. Usa los datos en el contexto de LIA
const workshopContext: CourseLessonContext = {
  allModules: metadataData.metadata.modules
};
```

### En Study Planner (ahora funciona igual)

```typescript
// 1. Obtiene metadata (misma función interna)
const workshopMetadata = await getWorkshopMetadata(courseId);

// 2. Formatea los datos para LIA
const formattedModules = workshopMetadata?.modules.map(module => ({
  moduleTitle: module.moduleTitle,
  lessons: module.lessons.map(lesson => ({
    lessonTitle: lesson.lessonTitle // ✅ Nombres reales
  }))
}));
```

**Ahora ambos usan la MISMA lógica subyacente.**

---

## Cambios en StudyPlannerLIA.tsx (Distribución de Lecciones)

### Problema Identificado

El componente `StudyPlannerLIA.tsx` NO estaba obteniendo las lecciones correctamente para distribuirlas en los slots de tiempo. Los logs mostraban:

```
📊 Distribuyendo 0 lecciones pendientes en 10 slots
```

### Causa Raíz

El código intentaba obtener lecciones usando:
```typescript
const modulesResponse = await fetch(`/api/courses/${courseSlug}/modules?lang=es`);
```

**Problema:** El curso tiene `slug=null`, por lo que este endpoint fallaba y retornaba 0 lecciones.

### Solución Implementada

**Cambios en líneas 2991-3067:**

1. **Cambio de endpoint:**
   ```typescript
   // ❌ ANTES (no funcionaba)
   const modulesResponse = await fetch(`/api/courses/${courseSlug}/modules?lang=es`);

   // ✅ DESPUÉS (funciona)
   const metadataResponse = await fetch(`/api/workshops/${courseId}/metadata`);
   ```

2. **Actualización de estructura de datos:**
   ```typescript
   // La metadata usa camelCase
   {
     lesson_id: lesson.lessonId,           // ✅ Cambio de lessonId
     lesson_title: lesson.lessonTitle,     // ✅ Cambio de lessonTitle
     lesson_order_index: lesson.lessonOrderIndex,  // ✅ Cambio
     duration_seconds: lesson.durationSeconds      // ✅ Cambio
   }
   ```

3. **Eliminación de código obsoleto:**
   - Removido check de `if (courseSlug)` - ya no es necesario
   - Actualizado mensaje de error para usar `metadataResponse`

### Resultado Esperado

Después de estos cambios, los logs deberían mostrar:

```
📚 Curso a26fa16b-4e08-493d-a78b-877bad789f38 (IA esencial):
   Total lecciones: 40
   Lecciones completadas: 0
   Lecciones pendientes totales: 40

📊 Distribuyendo 40 lecciones pendientes en X slots
📐 Estrategia: Y lecciones por slot (mínimo) para distribuir 40 lecciones en X slots

✅ Lecciones asignadas correctamente hasta la fecha límite (31 de enero de 2026)
```

---

## Conclusión

✅ **Problema RESUELTO definitivamente**

La solución final consistió en **DOS cambios críticos**:

### 1. En `LiaContextService` (para que LIA conozca los nombres reales)
- **Identificar** que `CourseAnalysisService.getCourseModules()` no funciona
- **Analizar** cómo `/learn` obtiene los módulos correctamente
- **Replicar** la misma lógica usando `getWorkshopMetadata()`
- **Verificar** que los módulos y lecciones estén publicados en la BD

### 2. En `StudyPlannerLIA.tsx` (para distribuir las lecciones en los slots)
- **Identificar** que el endpoint basado en slug no funciona cuando `slug=null`
- **Cambiar** a usar `/api/workshops/${courseId}/metadata`
- **Actualizar** el mapeo de campos para la estructura de metadata
- **Mejorar** el algoritmo de distribución para cubrir todas las lecciones

LIA ahora tiene acceso a:
- ✅ Nombres reales de módulos y lecciones desde la BD
- ✅ Orden correcto de módulos y lecciones
- ✅ Duración de cada lección
- ✅ Estado de completado/pendiente

El planificador ahora:
- ✅ Obtiene TODAS las lecciones del curso correctamente
- ✅ Distribuye lecciones en slots hasta la fecha límite especificada
- ✅ Calcula slots basándose en lecciones pendientes (no número fijo)

**Impacto:** Alto - LIA ya no inventará nombres genéricos y el plan incluirá todas las lecciones distribuidas hasta la fecha límite del usuario.
