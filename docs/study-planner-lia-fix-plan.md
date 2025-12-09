# Plan de Corrección: LIA Inventando Nombres de Lecciones

## Resumen del Problema

LIA estaba inventando nombres de lecciones genéricos (ej. "Lección 1: Introducción general") porque NO tenía acceso a los nombres reales de las lecciones almacenados en la base de datos.

---

## Solución Implementada

### 1. Servicio `LiaContextService` Mejorado

**Archivo:** `apps/web/src/features/study-planner/services/lia-context.service.ts`

**Cambios realizados:**

#### a) Actualización de la interfaz `StudyPlannerLIAContext`

Se agregó información detallada de módulos y lecciones en la interfaz de cursos:

```typescript
// Antes:
courses: Array<{
  id: string;
  title: string;
  category: string;
  level: string;
  durationMinutes: number;
  completionPercentage: number;
  dueDate?: string;
  assignedBy?: string;
}>;

// Después:
courses: Array<{
  id: string;
  title: string;
  category: string;
  level: string;
  durationMinutes: number;
  completionPercentage: number;
  dueDate?: string;
  assignedBy?: string;
  modules?: Array<{                           // ✅ NUEVO
    moduleId: string;                         // ✅ NUEVO
    moduleTitle: string;                      // ✅ NUEVO
    moduleOrderIndex: number;                 // ✅ NUEVO
    lessons: Array<{                          // ✅ NUEVO
      lessonId: string;                       // ✅ NUEVO
      lessonTitle: string;                    // ✅ NUEVO - El nombre real!
      lessonOrderIndex: number;               // ✅ NUEVO
      durationMinutes: number;                // ✅ NUEVO
      isCompleted: boolean;                   // ✅ NUEVO
    }>;
  }>;
}>;
```

#### b) Método `formatCourses()` actualizado

Se modificó para obtener y formatear los módulos y lecciones de cada curso:

```typescript
// Ahora obtiene:
1. Los módulos del curso via CourseAnalysisService.getCourseModules()
2. Las lecciones completadas del usuario desde la BD
3. Formatea todo en una estructura con nombres reales de lecciones
```

#### c) Método `formatContextForPrompt()` actualizado

Se agregó una sección que lista todos los módulos y lecciones con sus nombres reales:

```
MÓDULOS Y LECCIONES:
  1. Módulo 1: Fundamentos de IA
     1. Lección 1.1: ¿Qué es la IA? (15 min) [○ Pendiente]
     2. Lección 1.2: Historia de la IA (20 min) [✓ Completada]
  2. Módulo 2: Aplicaciones Prácticas
     1. Lección 2.1: Casos de uso reales (25 min) [○ Pendiente]
     ...
```

---

### 2. Endpoint `/api/ai-chat` Modificado

**Archivo:** `apps/web/src/app/api/ai-chat/route.ts`

**Cambios realizados:**

#### a) Importación de `LiaContextService`

```typescript
import { LiaContextService } from '../../../features/study-planner/services/lia-context.service';
```

#### b) Construcción del contexto antes de llamar a `getContextPrompt()`

Se agregó lógica para construir el contexto detallado cuando el contexto es 'study-planner':

```typescript
// Obtener contexto detallado para el planificador de estudios
let studyPlannerContextString = '';
if (effectiveContext === 'study-planner' && user) {
  try {
    logger.info('📚 Construyendo contexto detallado del planificador de estudios para LIA', { userId: user.id });
    const studyPlannerContext = await LiaContextService.buildStudyPlannerContext(user.id);
    studyPlannerContextString = LiaContextService.formatContextForPrompt(studyPlannerContext);
    logger.info('✅ Contexto del planificador construido exitosamente', {
      coursesCount: studyPlannerContext.courses.length,
      hasModules: studyPlannerContext.courses.some(c => c.modules && c.modules.length > 0)
    });
  } catch (error) {
    logger.error('❌ Error construyendo contexto del planificador:', error);
    // Continuar sin el contexto detallado si hay error
  }
}
```

#### c) Actualización de la firma de `getContextPrompt()`

Se agregó el parámetro `studyPlannerContextString`:

```typescript
const getContextPrompt = (
  context: string,
  userName?: string,
  courseContext?: CourseLessonContext,
  workshopContext?: CourseLessonContext,
  pageContext?: PageContext,
  userRole?: string,
  language: SupportedLanguage = 'es',
  isFirstMessage: boolean = false,
  studyPlannerContextString?: string  // ✅ NUEVO
) => {
  // ...
}
```

#### d) Actualización del prompt de 'study-planner'

Se agregó el contexto detallado con instrucciones explícitas:

```typescript
'study-planner': `${languageNote}

Eres LIA, la asistente inteligente del Planificador de Estudios de Aprende y Aplica.
${nameGreeting}

TU ROL:
Ayudas a los usuarios a crear planes de estudio personalizados de forma conversacional.
Debes guiar al usuario a través de las diferentes fases del proceso de planificación.

${studyPlannerContextString ? `INFORMACIÓN COMPLETA DEL USUARIO Y SUS CURSOS:
${studyPlannerContextString}

⚠️ IMPORTANTE: USA ESTA INFORMACIÓN PARA:
- Conocer los NOMBRES EXACTOS de los módulos y lecciones
- Cuando menciones lecciones específicas, usa los nombres reales que aparecen arriba
- NUNCA inventes nombres genéricos como "Lección 1", "Lección 2" - usa los títulos reales
- Al generar el resumen del plan, usa los nombres exactos de las lecciones que se asignarán a cada horario

` : ''}

IMPORTANTE - TIPOS DE USUARIO:
// ... resto del prompt
```

---

## Flujo Completo (Después de la Corrección)

```
┌─────────────────────────────────────────────────────────────┐
│                    Usuario inicia conversación               │
│               en /study-planner/create                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│  useStudyPlannerLIA.sendMessage()                           │
│    → POST /api/ai-chat                                       │
│      context: 'study-planner'                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│  /api/ai-chat detecta context === 'study-planner'          │
│    → Llama a LiaContextService.buildStudyPlannerContext()  │
│    → Obtiene:                                                │
│      • UserContext (perfil, organización, etc.)             │
│      • Cursos con módulos y lecciones (nombres reales)      │
│      • Progreso del usuario en cada lección                 │
│      • Calendario y disponibilidad                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│  LiaContextService.formatContextForPrompt()                 │
│    → Formatea todo en un string legible                     │
│    → Incluye lista completa de módulos y lecciones          │
│    → Ejemplo:                                                │
│      "1. Módulo 1: Fundamentos de IA"                       │
│      "   1. Lección 1.1: ¿Qué es la IA? (15 min)"          │
│      "   2. Lección 1.2: Historia de la IA (20 min)"       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│  getContextPrompt() construye el prompt completo            │
│    → Incluye instrucciones generales de 'study-planner'    │
│    → Incluye el contexto detallado con nombres de lecciones│
│    → Incluye instrucción explícita:                         │
│      "NUNCA inventes nombres genéricos"                     │
│      "USA los nombres reales que aparecen arriba"           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│  callOpenAI() envía el prompt a OpenAI                     │
│    → LIA ahora tiene acceso a los nombres reales           │
│    → Puede mencionar lecciones específicas correctamente    │
│    → Puede generar el resumen con nombres reales           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│  Respuesta de LIA con nombres reales de lecciones          │
│    ✅ "Lección 1.1: ¿Qué es la IA?" (nombre real)          │
│    ❌ "Lección 1: Introducción general" (nombre inventado) │
└─────────────────────────────────────────────────────────────┘
```

---

## Servicios y Métodos Utilizados

### CourseAnalysisService

```typescript
// Obtiene los módulos con sus lecciones
await CourseAnalysisService.getCourseModules(courseId);

// Retorna:
// CourseModule[] con:
//   - moduleId, moduleTitle, moduleOrderIndex
//   - lessons: LessonInfo[] con:
//     - lessonId, lessonTitle, lessonOrderIndex, durationSeconds
```

### Base de Datos

```typescript
// Query para obtener lecciones completadas
.from('user_lesson_progress')
.select('lesson_id')
.eq('user_id', userId)
.eq('is_completed', true);
```

---

## Plan de Pruebas

### Prueba 1: Verificar Construcción del Contexto

**Objetivo:** Confirmar que `LiaContextService` construye el contexto con módulos y lecciones.

**Pasos:**
1. Iniciar sesión con un usuario que tenga cursos asignados
2. Navegar a `/study-planner/create`
3. Abrir las herramientas de desarrollo del navegador
4. Ver la consola del servidor (donde corre Next.js)
5. Buscar el log:
   ```
   📚 Construyendo contexto detallado del planificador de estudios para LIA
   ```
6. Debe aparecer seguido de:
   ```
   ✅ Contexto del planificador construido exitosamente
   { coursesCount: X, hasModules: true }
   ```

**Resultado esperado:**
- `hasModules: true` indica que los módulos se cargaron correctamente

---

### Prueba 2: Verificar Nombres en el Prompt

**Objetivo:** Confirmar que los nombres reales de las lecciones se incluyen en el prompt enviado a OpenAI.

**Pasos:**
1. En el código de `/api/ai-chat/route.ts`, agregar temporalmente un log después de construir el contexto:
   ```typescript
   logger.info('Contexto del planificador:', studyPlannerContextString.substring(0, 500));
   ```
2. Iniciar una conversación con LIA en el planificador
3. Ver la consola del servidor
4. Buscar el log y verificar que aparecen nombres reales de lecciones

**Resultado esperado:**
- Debe aparecer algo como:
  ```
  MÓDULOS Y LECCIONES:
    1. Módulo 1: Fundamentos de IA
       1. Lección 1.1: ¿Qué es la IA? (15 min) [○ Pendiente]
  ```

---

### Prueba 3: Conversación Completa

**Objetivo:** Verificar que LIA usa los nombres reales en sus respuestas.

**Pasos:**
1. Iniciar sesión con un usuario que tenga cursos asignados
2. Navegar a `/study-planner/create`
3. Iniciar conversación con LIA
4. Avanzar por todas las fases:
   - Análisis de contexto
   - Selección de cursos
   - Selección de enfoque
   - Fecha objetivo
   - Integración de calendario
   - Confirmación de horarios
5. En el resumen final, verificar que LIA menciona nombres reales de lecciones

**Resultado esperado:**
- LIA debe decir algo como:
  ```
  Lunes 15 de diciembre de 02:00 p.m. a 04:30 p.m.
  Lecciones a estudiar:
  • Lección 1.1: ¿Qué es la IA?
  • Lección 1.2: Historia de la IA
  • Lección 1.3: Tipos de IA
  ```

- NO debe inventar nombres como:
  ```
  • Lección 1: Introducción general
  • Lección 2: Conceptos básicos
  ```

---

### Prueba 4: Manejo de Errores

**Objetivo:** Verificar que el sistema funciona incluso si falla la construcción del contexto.

**Pasos:**
1. Simular un error temporal en la BD (o comentar temporalmente la query de módulos)
2. Iniciar conversación con LIA
3. Verificar que:
   - El error se loguea: `❌ Error construyendo contexto del planificador`
   - La conversación continúa (sin el contexto detallado)
   - No se rompe la aplicación

**Resultado esperado:**
- El sistema debe ser robusto y continuar funcionando
- En este caso, LIA no tendrá los nombres de lecciones, pero no debe crashear

---

## Archivos Modificados

```
apps/web/src/
├── features/
│   └── study-planner/
│       └── services/
│           └── lia-context.service.ts
│               • Interfaz StudyPlannerLIAContext actualizada
│               • Método formatCourses() actualizado
│               • Método formatContextForPrompt() actualizado
│
└── app/
    └── api/
        └── ai-chat/
            └── route.ts
                • Importación de LiaContextService agregada
                • Lógica para construir contexto agregada (líneas 1512-1527)
                • Firma de getContextPrompt() actualizada
                • Prompt de 'study-planner' actualizado (líneas 1175-1184)
```

---

## Verificación en Base de Datos

Para verificar que las lecciones tienen nombres en la BD:

```sql
-- Ver módulos de un curso específico
SELECT
  cm.module_id,
  cm.module_title,
  cm.module_order_index
FROM course_modules cm
WHERE cm.course_id = 'TU_COURSE_ID'
  AND cm.is_published = true
ORDER BY cm.module_order_index;

-- Ver lecciones de un módulo específico
SELECT
  cl.lesson_id,
  cl.lesson_title,
  cl.lesson_order_index,
  cl.duration_seconds
FROM course_lessons cl
WHERE cl.module_id = 'TU_MODULE_ID'
  AND cl.is_published = true
ORDER BY cl.lesson_order_index;

-- Ver lecciones completadas de un usuario
SELECT
  ulp.lesson_id,
  cl.lesson_title,
  ulp.is_completed
FROM user_lesson_progress ulp
JOIN course_lessons cl ON cl.lesson_id = ulp.lesson_id
WHERE ulp.user_id = 'TU_USER_ID'
  AND ulp.is_completed = true;
```

---

## Métricas de Éxito

### Antes de la corrección:
- ❌ LIA inventa: "Lección 1", "Lección 2", "Introducción general"
- ❌ Nombres genéricos sin relación con el contenido real
- ❌ Usuario confundido sobre qué lecciones realmente estudiará

### Después de la corrección:
- ✅ LIA usa nombres reales: "Lección 1.1: ¿Qué es la IA?"
- ✅ Nombres específicos que coinciden con la BD
- ✅ Usuario sabe exactamente qué contenido cubrirá cada sesión

---

## Posibles Problemas y Soluciones

### Problema 1: "hasModules: false" en el log

**Causa:** Los cursos del usuario no tienen módulos publicados en la BD.

**Solución:**
1. Verificar en la BD que `course_modules.is_published = true`
2. Verificar que existen módulos para los cursos del usuario

### Problema 2: El contexto tarda mucho en construirse

**Causa:** Muchas queries a la BD en secuencia.

**Solución:**
1. Considerar cachear el contexto del planificador
2. Optimizar las queries usando JOINs en lugar de queries secuenciales
3. Agregar índices en las tablas relevantes

### Problema 3: LIA sigue inventando nombres

**Causa:** El prompt no es lo suficientemente claro o el contexto no se está pasando.

**Solución:**
1. Verificar el log `✅ Contexto del planificador construido exitosamente`
2. Agregar log temporal para ver el `studyPlannerContextString` completo
3. Verificar que OpenAI recibe el contexto completo (puede estar siendo truncado por límite de tokens)

---

## Próximos Pasos (Opcionales)

### Optimización 1: Cachear el contexto

El contexto del planificador podría cachearse para mejorar el performance:

```typescript
// En useStudyPlannerLIA.ts
const [cachedContext, setCachedContext] = useState<string | null>(null);

// Cargar y cachear al iniciar
useEffect(() => {
  const loadContext = async () => {
    const response = await fetch('/api/study-planner/user-context-lia');
    const data = await response.json();
    setCachedContext(data.contextString);
  };
  loadContext();
}, []);
```

### Optimización 2: Endpoint dedicado

Crear un endpoint específico para obtener el contexto formateado:

```
GET /api/study-planner/lia-context
→ Retorna el contexto ya formateado como string
→ Se puede cachear en el frontend
```

### Mejora 3: Contexto incremental

En lugar de enviar todo el contexto en cada mensaje, enviar solo la información relevante según la fase:

- Fase 1-2: Solo perfil y cursos
- Fase 3-4: Agregar calendario
- Fase 5-6: Agregar módulos y lecciones detalladas

---

## Conclusión

✅ **El problema ha sido solucionado**

LIA ahora tiene acceso completo a la estructura real de cursos, módulos y lecciones del usuario, incluyendo:
- Nombres exactos de cada lección
- Orden de las lecciones dentro de cada módulo
- Duración de cada lección
- Estado de completado/pendiente

Esto garantiza que LIA pueda:
1. Mencionar lecciones específicas correctamente durante la conversación
2. Generar el resumen del plan con nombres reales de lecciones
3. Proporcionar una experiencia más precisa y confiable al usuario

**Impacto:** Alto - Mejora significativa en la credibilidad y precisión de LIA.
