# Study Planner - Creación de Planes de Estudio

## Flujo de Creación

### 1. Inicio
- **Página**: `apps/web/src/app/study-planner/create/page.tsx`
- **Componente**: `StudyPlannerLIA`
- **Contexto**: `StudyPlannerContext` (8 fases de configuración)

### 2. Fases del Proceso
1. `WELCOME` - Bienvenida
2. `CONTEXT_ANALYSIS` - Carga contexto del usuario
3. `COURSE_SELECTION` - Selección de cursos
4. `CALENDAR_INTEGRATION` - Integración con calendario (opcional)
5. `TIME_CONFIGURATION` - Configuración de tiempos de sesión
6. `BREAK_CONFIGURATION` - Configuración de descansos
7. `SCHEDULE_CONFIGURATION` - Horarios preferidos
8. `SUMMARY` - Resumen y generación del plan
9. `COMPLETE` - Plan guardado

### 3. Generación del Plan

**Endpoint**: `POST /api/study-planner/generate-plan`

**Proceso**:
1. Obtiene contexto del usuario (`UserContextService.getFullUserContext()`)
2. Para cada curso seleccionado:
   - Obtiene info del curso → `CourseAnalysisService.getCourseInfo(courseId)`
   - Obtiene lecciones → `CourseAnalysisService.getCourseLessons(courseId)`
   - Filtra lecciones pendientes → `CourseAnalysisService.getPendingLessons(userId, courseId)`
   - Calcula duración → `CourseAnalysisService.calculateLessonDuration(lessonId)`

3. Genera sesiones → `generateSessions()`

### 4. Obtención de Nombres de Lecciones

**Fuente de datos**: Tabla `course_lessons` en Supabase

**Campo**: `lesson_title`

**Flujo**:
```
CourseAnalysisService.getCourseLessons(courseId)
  ↓
  getCourseModules(courseId)
    ↓
    SELECT course_modules with course_lessons
      ↓
      course_lessons.lesson_title
```

**Resultado en sesión**:
- `lessonTitle`: Título real de la lección desde DB
- `description`: Títulos separados por comas de todas las lecciones en la sesión
- `title`: Título descriptivo generado (ej: "Introducción a React: 2 lección(es)")

### 5. Cálculo de Duración

**Tabla principal**: `lesson_time_estimates` (precalculado)

Si no existe, calcula dinámicamente:
- Video: `course_lessons.duration_seconds` → minutos
- Actividades: `lesson_activities.estimated_time_minutes`
- Materiales: `lesson_materials.estimated_time_minutes`
  - Quiz: 10 min (default)
  - Ejercicio: 15 min (default)
  - Lectura: 10 min (default)
- Interacciones: 3 min (fijo)

**Total**: videoMinutes + activitiesMinutes + materialsMinutes + 3

### 6. Generación de Sesiones

**Algoritmo** (`generateSessions()`):
1. Crea cola con todas las lecciones pendientes
2. Itera por días preferidos (ej: Lunes-Viernes)
3. Para cada bloque de tiempo preferido:
   - Agrupa lecciones hasta llenar `maxSessionMinutes`
   - Respeta `minSessionMinutes`
   - Agrega `breakDurationMinutes`
4. Asigna horario específico (fecha + hora)
5. Crea sesión con:
   - `lessonTitle`: Nombre real de la primera lección
   - `description`: Lista de todos los nombres de lecciones
   - `durationMinutes`: Suma de duraciones
   - `startTime` / `endTime`: Horario asignado

### 7. Guardado

**Endpoint**: `POST /api/study-planner/save-plan`

Guarda:
- `StudyPlanConfig`: Configuración del plan
- `StudySession[]`: Sesiones generadas con nombres reales de lecciones
