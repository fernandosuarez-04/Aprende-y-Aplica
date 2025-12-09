# Flujo de LIA en Study Planner - Documentación Técnica

## Problema Identificado

**LIA está inventando nombres de lecciones que no existen en la base de datos** cuando genera el resumen del plan de estudios en el planificador de estudios (`study-planner/create`).

---

## Arquitectura del Flujo Actual

### 1. Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                      Flujo General                           │
└─────────────────────────────────────────────────────────────┘

apps/web/src/app/study-planner/create/page.tsx
    │
    └─► StudyPlannerLIA (componente)
            │
            └─► useStudyPlannerLIA (hook)
                    │
                    ├─► loadUserContext() → /api/study-planner/user-context
                    │
                    ├─► sendMessage() → /api/ai-chat
                    │
                    ├─► generatePlan() → /api/study-planner/generate-plan
                    │
                    └─► savePlan() → /api/study-planner/save-plan
```

---

### 2. Carga Inicial de Contexto

**Endpoint:** `GET /api/study-planner/user-context`

**Archivo:** `apps/web/src/app/api/study-planner/user-context/route.ts`

**Flujo:**
1. Obtiene el usuario actual via `SessionService.getCurrentUser()`
2. Llama a `UserContextService.getFullUserContext(userId)`
3. Enriquece con información de progreso de cada curso
4. Retorna:

```typescript
{
  success: true,
  data: {
    userType: 'b2b' | 'b2c',
    user: UserBasicInfo,
    professionalProfile: UserProfessionalProfile,
    organization?: OrganizationInfo,
    workTeams?: WorkTeam[],
    courses: CourseAssignment[], // ⚠️ Sin detalle de módulos y lecciones
    studyPreferences?: StudyPreferences,
    calendarIntegration?: CalendarIntegration
  }
}
```

**⚠️ PROBLEMA #1:** La información de `courses` NO incluye los módulos y lecciones detallados.

---

### 3. Comunicación con LIA

**Endpoint:** `POST /api/ai-chat`

**Archivo:** `apps/web/src/app/api/ai-chat/route.ts`

**Flujo del contexto 'study-planner':**

1. El hook `useStudyPlannerLIA.sendMessage()` envía:
   ```typescript
   {
     message: "mensaje del usuario",
     context: 'study-planner',
     conversationHistory: [...últimos 10 mensajes],
     pageContext: {
       isStudyPlanner: true,
       currentPhase: StudyPlannerPhase,
       phaseName: "WELCOME" | "CONTEXT_ANALYSIS" | ...,
       phaseData: {
         userContext: {...}, // Del endpoint user-context
         selectedCourseIds: string[],
         calendarConnected: boolean,
         // ... más datos de configuración
       },
       userType: 'b2b' | 'b2c'
     },
     language: 'es'
   }
   ```

2. El endpoint `/api/ai-chat` construye un prompt para OpenAI que incluye:
   - Instrucciones generales de LIA
   - Contexto específico de 'study-planner' (línea 1164-1320 en route.ts)
   - Información del usuario del `pageContext`

**⚠️ PROBLEMA #2:** El `pageContext.phaseData.userContext` NO contiene información detallada de módulos y lecciones.

---

### 4. Generación del Plan

**Endpoint:** `POST /api/study-planner/generate-plan`

**Archivo:** `apps/web/src/app/api/study-planner/generate-plan/route.ts`

**Flujo:**

1. Recibe la configuración del plan:
   ```typescript
   {
     name: string,
     courseIds: string[],
     goalHoursPerWeek: number,
     startDate: string,
     endDate: string,
     preferredDays: number[],
     preferredTimeBlocks: TimeBlock[],
     minSessionMinutes: number,
     maxSessionMinutes: number,
     breakDurationMinutes: number,
     preferredSessionType: 'short' | 'medium' | 'long'
   }
   ```

2. **AQUÍ SÍ obtiene información detallada de lecciones** (líneas 78-105):
   ```typescript
   for (const courseId of body.courseIds) {
     const courseInfo = await CourseAnalysisService.getCourseInfo(courseId);
     const lessons = await CourseAnalysisService.getCourseLessons(courseId);
     const pendingLessons = await CourseAnalysisService.getPendingLessons(user.id, courseId);

     const lessonDurations: LessonDuration[] = [];
     for (const lesson of pendingLessons) {
       const duration = await CourseAnalysisService.calculateLessonDuration(lesson.lessonId);
       if (duration) {
         lessonDurations.push(duration); // ✅ Incluye lessonTitle
       }
     }

     allLessons.push({
       courseId,
       courseTitle: courseInfo.title,
       lessons: lessonDurations
     });
   }
   ```

3. Genera sesiones usando `generateSessions()` (líneas 175-319)
4. **⚠️ PROBLEMA #3:** La función `generateSessions()` SÍ tiene acceso a los nombres de las lecciones, pero esta información NO se envía a LIA durante la conversación.

---

### 5. El Problema Raíz

**LIA está inventando nombres de lecciones porque:**

1. **Durante la conversación con LIA** (endpoint `/api/ai-chat`):
   - El contexto enviado NO incluye la lista detallada de módulos y lecciones
   - LIA solo sabe cuántos cursos tiene el usuario y sus títulos
   - **NO sabe los nombres reales de las lecciones**

2. **Cuando LIA debe presentar el resumen final:**
   - El prompt le dice: "Usa los NOMBRES EXACTOS de las lecciones que te proporciono" (línea 1261)
   - Pero **NO se le están proporcionando esos nombres** en el contexto
   - Entonces LIA inventa nombres genéricos como "Lección 1", "Lección 2", etc.

3. **La información SÍ existe en el backend:**
   - El servicio `CourseAnalysisService` puede obtener módulos y lecciones
   - El endpoint `/generate-plan` SÍ accede a esta información
   - Pero esta información **NO se pasa al contexto de LIA** en `/api/ai-chat`

---

## Servicios Involucrados

### CourseAnalysisService

**Archivo:** `apps/web/src/features/study-planner/services/course-analysis.service.ts`

**Métodos Relevantes:**

| Método | Descripción | Retorna |
|--------|-------------|---------|
| `getCourseInfo(courseId)` | Información básica del curso | `CourseInfo` (título, descripción, duración, etc.) |
| `getCourseModules(courseId)` | Módulos con sus lecciones | `CourseModule[]` (incluye `moduleTitle`, `lessons[]`) |
| `getCourseLessons(courseId)` | Todas las lecciones sin agrupar | `LessonInfo[]` (incluye `lessonTitle`, `lessonId`, `moduleId`) |
| `calculateLessonDuration(lessonId)` | Duración detallada de una lección | `LessonDuration` (incluye `lessonTitle`, `totalMinutes`) |
| `getPendingLessons(userId, courseId)` | Lecciones pendientes del usuario | `LessonInfo[]` |

### UserContextService

**Archivo:** `apps/web/src/features/study-planner/services/user-context.service.ts`

**Métodos Relevantes:**

| Método | Descripción |
|--------|-------------|
| `getUserType(userId)` | Determina si es B2B o B2C |
| `getFullUserContext(userId)` | Contexto completo del usuario (perfil, organización, cursos) |
| `getUserCourses(userId, userType)` | Obtiene los cursos asignados/comprados del usuario |

### LiaContextService

**Archivo:** `apps/web/src/features/study-planner/services/lia-context.service.ts`

**Métodos Relevantes:**

| Método | Descripción | ¿Se usa actualmente? |
|--------|-------------|----------------------|
| `buildStudyPlannerContext(userId)` | Construye contexto completo para LIA | ❌ **NO** |
| `formatContextForPrompt(context)` | Formatea el contexto como string para el prompt | ❌ **NO** |
| `generatePhaseInstructions(context, phase)` | Genera instrucciones específicas por fase | ❌ **NO** |

**⚠️ PROBLEMA #4:** El servicio `LiaContextService` existe y tiene métodos para construir el contexto completo (incluyendo cursos con análisis), pero **NO se está usando en el flujo actual**.

---

## Qué información debería recibir LIA

Para que LIA pueda usar los nombres reales de las lecciones, necesita recibir en el contexto:

```typescript
{
  courses: [
    {
      courseId: "xxx",
      courseTitle: "Nombre del Curso",
      modules: [
        {
          moduleId: "xxx",
          moduleTitle: "Módulo 1: Introducción",
          lessons: [
            {
              lessonId: "xxx",
              lessonTitle: "Lección 1: Bienvenida al curso",
              durationMinutes: 15,
              isCompleted: false
            },
            {
              lessonId: "yyy",
              lessonTitle: "Lección 2: Conceptos básicos",
              durationMinutes: 20,
              isCompleted: false
            }
          ]
        },
        {
          moduleId: "yyy",
          moduleTitle: "Módulo 2: Fundamentos",
          lessons: [...]
        }
      ],
      totalLessons: 25,
      completedLessons: 5,
      pendingLessons: 20
    }
  ]
}
```

---

## Ubicación de Archivos Clave

```
apps/web/src/
├── app/
│   ├── study-planner/
│   │   └── create/
│   │       └── page.tsx                    # Página principal
│   └── api/
│       ├── ai-chat/
│       │   └── route.ts                    # ⚠️ AQUÍ está el problema principal
│       └── study-planner/
│           ├── user-context/
│           │   └── route.ts                # ⚠️ Debe enriquecer con módulos/lecciones
│           └── generate-plan/
│               └── route.ts                # ✅ Ya obtiene las lecciones correctamente
│
├── features/
│   └── study-planner/
│       ├── components/
│       │   └── StudyPlannerLIA.tsx         # Componente principal
│       ├── hooks/
│       │   └── useStudyPlannerLIA.ts       # Hook de estado y lógica
│       └── services/
│           ├── user-context.service.ts     # Contexto del usuario
│           ├── course-analysis.service.ts  # ✅ Tiene todos los métodos necesarios
│           └── lia-context.service.ts      # ❌ Existe pero NO se usa
```

---

## Plan de Corrección

### Opción 1: Enriquecer el contexto en user-context (Recomendado)

**Ventajas:**
- La información se carga una vez al inicio
- Todos los datos están disponibles durante toda la conversación
- Menos llamadas al backend durante la conversación

**Cambios necesarios:**

1. **Modificar `/api/study-planner/user-context`:**
   - Usar `CourseAnalysisService.getCourseModules()` para cada curso
   - Incluir la estructura completa de módulos y lecciones en la respuesta
   - Incluir información de lecciones pendientes vs completadas

2. **Modificar `useStudyPlannerLIA.ts`:**
   - Actualizar el tipo `PhaseData` para incluir la estructura de módulos/lecciones
   - Pasar esta información en el `pageContext` al llamar `/api/ai-chat`

3. **Modificar `/api/ai-chat`:**
   - Agregar lógica para construir un string con la estructura de cursos, módulos y lecciones
   - Incluir este string en el prompt del contexto 'study-planner'
   - Asegurarse de que LIA reciba los nombres exactos de las lecciones

**Complejidad:** Media
**Impacto:** Alto (soluciona el problema de raíz)

### Opción 2: Integrar LiaContextService

**Ventajas:**
- Usa el servicio ya existente diseñado para este propósito
- Separación de responsabilidades más clara
- Contexto formateado específicamente para LIA

**Cambios necesarios:**

1. **En `/api/ai-chat`:**
   - Importar y usar `LiaContextService.buildStudyPlannerContext(userId)`
   - Usar `LiaContextService.formatContextForPrompt()` para generar el string del contexto
   - Agregar este contexto al prompt de 'study-planner'

2. **Verificar `LiaContextService`:**
   - Asegurarse de que incluya módulos y lecciones detallados
   - Si no los incluye, agregar esa funcionalidad

**Complejidad:** Baja (el servicio ya existe)
**Impacto:** Alto (usa arquitectura existente)

### Opción 3: Pasar información al confirmar horarios

**Ventajas:**
- Cambios mínimos
- Solo se envía información cuando es necesaria

**Desventajas:**
- LIA no conoce las lecciones durante la conversación, solo al final
- Puede generar confusión si el usuario pregunta por lecciones específicas antes

**No recomendado** porque LIA debería conocer esta información desde el principio.

---

## Recomendación Final

**Implementar Opción 2: Integrar LiaContextService**

**Razones:**
1. El servicio ya existe y fue diseñado para este propósito
2. Separa la lógica de construcción del contexto del endpoint de chat
3. Es más mantenible a largo plazo
4. Menor complejidad de implementación

**Pasos concretos:**

1. ✅ Verificar que `LiaContextService.buildStudyPlannerContext()` incluye módulos y lecciones
2. ✅ Si no los incluye, agregar llamadas a `CourseAnalysisService.getCourseModules()`
3. ✅ En `/api/ai-chat`, importar `LiaContextService`
4. ✅ Al detectar contexto 'study-planner', llamar a `buildStudyPlannerContext(userId)`
5. ✅ Usar `formatContextForPrompt()` para generar el string
6. ✅ Agregar este string al prompt del sistema antes de llamar a OpenAI
7. ✅ Actualizar las instrucciones del prompt de 'study-planner' para que LIA use esta información

---

## Notas Adicionales

### Estructura de la BD relevante

**Tablas principales:**
- `courses` - Información de cursos
- `course_modules` - Módulos de cada curso
- `course_lessons` - Lecciones de cada módulo
- `user_course_enrollments` - Progreso del usuario en cursos
- `user_lesson_progress` - Progreso del usuario en lecciones

**Relaciones:**
```
courses (1) ──► (N) course_modules (1) ──► (N) course_lessons
    │
    └─► (N) user_course_enrollments (usuario_id, course_id)
                │
                └─► user_lesson_progress (usuario_id, lesson_id)
```

### Tipos TypeScript relevantes

**En `apps/web/src/features/study-planner/types/user-context.types.ts`:**

```typescript
export interface CourseModule {
  moduleId: string;
  moduleTitle: string;
  moduleDescription: string | null;
  moduleOrderIndex: number;
  moduleDurationMinutes: number;
  isRequired: boolean;
  isPublished: boolean;
  lessons: LessonInfo[];
}

export interface LessonInfo {
  lessonId: string;
  lessonTitle: string;
  lessonDescription: string | null;
  lessonOrderIndex: number;
  durationSeconds: number | null;
  moduleId: string;
  isPublished: boolean;
}

export interface LessonDuration {
  lessonId: string;
  lessonTitle: string; // ✅ Este es el nombre que necesitamos
  videoMinutes: number;
  activitiesMinutes: number;
  materialsMinutes: number;
  interactionsMinutes: number;
  totalMinutes: number;
  isEstimated: boolean;
}
```

---

## Ejemplo de Flujo Corregido

### Antes (actual):

1. Usuario: "Confirmo los horarios"
2. LIA recibe en contexto: `{ courses: [{ courseId: "xxx", courseTitle: "IA para Negocios" }] }`
3. LIA inventa: "Lección 1: Introducción general", "Lección 2: Conceptos básicos"

### Después (corregido):

1. Usuario: "Confirmo los horarios"
2. LIA recibe en contexto:
   ```typescript
   {
     courses: [{
       courseId: "xxx",
       courseTitle: "IA para Negocios",
       modules: [{
         moduleTitle: "Módulo 1: Fundamentos",
         lessons: [
           { lessonTitle: "Lección 1.1: ¿Qué es la IA?", durationMinutes: 15 },
           { lessonTitle: "Lección 1.2: Historia de la IA", durationMinutes: 20 }
         ]
       }]
     }]
   }
   ```
3. LIA usa nombres reales: "Lección 1.1: ¿Qué es la IA?", "Lección 1.2: Historia de la IA"

---

## Conclusión

El problema es que **LIA no tiene acceso a los nombres reales de las lecciones** durante la conversación en el planificador de estudios. La solución es **enriquecer el contexto que se le pasa a LIA** usando el servicio `LiaContextService` que ya existe o modificando el endpoint `user-context` para incluir módulos y lecciones.

**Prioridad:** Alta - Afecta la experiencia del usuario y la credibilidad de LIA.

**Archivos a modificar:**
1. `apps/web/src/app/api/ai-chat/route.ts` (principal)
2. `apps/web/src/features/study-planner/services/lia-context.service.ts` (verificar/mejorar)
3. Opcionalmente: `apps/web/src/app/api/study-planner/user-context/route.ts`
