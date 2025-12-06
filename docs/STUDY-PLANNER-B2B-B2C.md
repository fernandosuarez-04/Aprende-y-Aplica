# Diferencias entre Usuarios B2B y B2C en el Planificador de Estudios

Este documento detalla las diferencias funcionales entre usuarios empresariales (B2B) y usuarios independientes (B2C) en el sistema del planificador de estudios.

## Identificación del Tipo de Usuario

### Consulta SQL

```sql
SELECT 
  id,
  CASE 
    WHEN organization_id IS NOT NULL THEN 'b2b'
    ELSE 'b2c'
  END as user_type
FROM users
WHERE id = $user_id;
```

### Código TypeScript

```typescript
const userType = user.organization_id ? 'b2b' : 'b2c';
```

---

## Comparativa de Funcionalidades

| Funcionalidad | B2B | B2C |
|---------------|-----|-----|
| Selección de cursos | ❌ No permitida | ✅ Libre |
| Cursos asignados | ✅ Por administrador | ❌ No aplica |
| Plazos fijos | ✅ Obligatorios | ❌ Opcionales |
| Rutas de aprendizaje | ❌ No sugeridas | ✅ Sugeridas |
| Metas de tiempo | ⚠️ Deben cumplir plazos | ✅ Flexibles |
| Modificación del plan | ⚠️ Limitada | ✅ Total |
| Cursos adicionales | ❌ No permitidos | ✅ Pueden agregarse |

---

## Flujo B2B (Empresarial)

### Características

1. **Cursos asignados**: El administrador de la organización asigna cursos a los usuarios
2. **Plazos obligatorios**: Cada curso puede tener una fecha límite (`due_date`)
3. **Equipos de trabajo**: Los usuarios pueden pertenecer a equipos con cursos compartidos
4. **Restricciones**: Las modificaciones del plan deben respetar los plazos

### Tablas Relacionadas

```sql
-- Asignaciones de cursos por organización
SELECT * FROM organization_course_assignments
WHERE user_id = $user_id;

-- Asignaciones de cursos por equipo
SELECT wtca.*
FROM work_team_course_assignments wtca
JOIN work_team_members wtm ON wtca.team_id = wtm.team_id
WHERE wtm.user_id = $user_id;
```

### Validaciones Específicas B2B

```typescript
// Validar que tiempos permitan cumplir plazos
function validateB2BDeadlines(
  courses: B2BCourseAssignment[],
  weeklyStudyMinutes: number
): boolean {
  for (const course of courses) {
    if (course.dueDate) {
      const remainingMinutes = calculateRemainingTime(course);
      const weeksNeeded = remainingMinutes / weeklyStudyMinutes;
      const estimatedCompletion = addWeeks(new Date(), weeksNeeded);
      
      if (estimatedCompletion > new Date(course.dueDate)) {
        return false; // No cumple plazo
      }
    }
  }
  return true;
}
```

### Mensajes de LIA para B2B

```typescript
const b2bMessages = {
  courseSelection: `
    Veo que tu organización te ha asignado los siguientes cursos:
    ${courses.map(c => `- ${c.title} (plazo: ${formatDate(c.dueDate)})`).join('\n')}
    
    Te sugiero priorizar los cursos con plazos más cercanos.
    ¿Comenzamos con "${urgentCourse.title}"?
  `,
  
  timeWarning: `
    ⚠️ Con la configuración actual, el curso "${course.title}" no se 
    completaría antes del plazo (${formatDate(course.dueDate)}).
    
    Te sugiero:
    - Aumentar las horas de estudio a ${suggestedHours} horas/semana
    - O comenzar con este curso primero
    
    ¿Qué prefieres hacer?
  `,
};
```

---

## Flujo B2C (Individual)

### Características

1. **Selección libre**: El usuario elige qué cursos incluir de los que ha adquirido
2. **Sin plazos fijos**: Puede establecer metas de tiempo o no
3. **Rutas de aprendizaje**: LIA puede sugerir rutas personalizadas
4. **Flexibilidad total**: Puede modificar cualquier aspecto del plan

### Tablas Relacionadas

```sql
-- Cursos adquiridos
SELECT * FROM course_purchases
WHERE user_id = $user_id AND access_status = 'active';

-- Rutas de aprendizaje personalizadas
SELECT * FROM learning_routes
WHERE user_id = $user_id AND is_active = true;
```

### Opciones Adicionales B2C

```typescript
// Sugerir cursos no adquiridos
async function suggestAdditionalCourses(
  userId: string,
  currentCourses: string[]
): Promise<CourseInfo[]> {
  return CourseAnalysisService.getAvailableCoursesForSuggestion(
    userId,
    undefined, // Todas las categorías
    undefined, // Todos los niveles
    5 // Máximo 5 sugerencias
  );
}

// Generar rutas de aprendizaje
async function suggestLearningRoutes(
  userId: string,
  courses: CourseInfo[]
): Promise<LearningRouteSuggestion[]> {
  // 1. Ruta progresiva (por dificultad)
  // 2. Ruta por categoría
  // 3. Ruta rápida (cursos cortos primero)
  // 4. Ruta expandida (con sugerencias)
}
```

### Mensajes de LIA para B2C

```typescript
const b2cMessages = {
  courseSelection: `
    Tienes ${courses.length} cursos disponibles para incluir en tu plan.
    
    ¿Te gustaría:
    1. Incluir todos tus cursos
    2. Seleccionar cursos específicos
    3. Que te sugiera una ruta de aprendizaje personalizada
    
    También puedo sugerirte cursos adicionales que complementen tu aprendizaje.
    ¿Qué prefieres?
  `,
  
  timeGoals: `
    Como usuario independiente, tienes total flexibilidad con tus metas.
    
    ¿Te gustaría:
    1. Establecer una fecha de finalización específica
    2. Establecer horas semanales de estudio
    3. Sin metas fijas, estudiar a tu ritmo
    
    ¿Cuál te conviene más?
  `,
};
```

---

## Configuración de Tiempos

### B2B: Validación contra Plazos

```typescript
interface B2BTimeValidation {
  minSessionMinutes: number;
  maxSessionMinutes: number;
  weeklyMinutesRequired: number;
  canMeetDeadlines: boolean;
  deadlineRisks: Array<{
    course: string;
    dueDate: Date;
    estimatedCompletion: Date;
    daysOverdue: number;
  }>;
}

function validateB2BTimes(
  courses: B2BCourseAssignment[],
  config: TimeConfig
): B2BTimeValidation {
  // Calcular si los tiempos permiten cumplir todos los plazos
  // Identificar cursos en riesgo
  // Sugerir ajustes si es necesario
}
```

### B2C: Flexibilidad Total

```typescript
interface B2CTimeOptions {
  hasFixedGoal: boolean;
  goalType: 'completion_date' | 'weekly_hours' | 'none';
  completionDate?: Date;
  weeklyHours?: number;
}

function configureB2CTimes(options: B2CTimeOptions): TimeConfig {
  if (options.goalType === 'completion_date') {
    // Calcular horas semanales necesarias
    return calculateRequiredWeeklyHours(options.completionDate);
  } else if (options.goalType === 'weekly_hours') {
    // Usar horas especificadas
    return { weeklyHours: options.weeklyHours };
  } else {
    // Sin metas fijas - valores sugeridos flexibles
    return getFlexibleDefaults();
  }
}
```

---

## Componentes UI Específicos

### Para B2B

```tsx
// Mostrar plazos en resumen
<DeadlineWarning 
  courses={coursesWithDeadlines}
  meetsDeadlines={validation.meetsDeadlines}
/>

// Mostrar información de organización
<OrganizationInfo organization={userContext.organization} />

// Mostrar equipos de trabajo
<WorkTeamsList teams={userContext.workTeams} />
```

### Para B2C

```tsx
// Selector de cursos
<CourseSelector 
  courses={availableCourses}
  selected={selectedCourses}
  onSelectionChange={setSelectedCourses}
/>

// Sugerencias de rutas
<LearningRouteSuggestions 
  routes={suggestedRoutes}
  onSelect={handleRouteSelect}
/>

// Configuración de metas
<GoalConfiguration 
  goalType={goalType}
  onGoalTypeChange={setGoalType}
  completionDate={completionDate}
  weeklyHours={weeklyHours}
/>
```

---

## Reglas de Negocio

### Reglas B2B

| Regla | Descripción |
|-------|-------------|
| `B2B_COURSES_ASSIGNED` | Solo se pueden usar cursos asignados por la organización |
| `B2B_DEADLINE_REQUIRED` | Los tiempos deben permitir completar antes del plazo |
| `B2B_ADMIN_PRIORITY` | La configuración del admin tiene prioridad |
| `B2B_TEAM_COURSES` | Incluir cursos asignados a equipos del usuario |

### Reglas B2C

| Regla | Descripción |
|-------|-------------|
| `B2C_FREE_SELECTION` | El usuario puede seleccionar cualquier curso adquirido |
| `B2C_FLEXIBLE_GOALS` | Puede establecer metas fijas o no |
| `B2C_ROUTE_SUGGESTIONS` | LIA puede sugerir rutas personalizadas |
| `B2C_ADDITIONAL_COURSES` | Puede ver sugerencias de cursos no adquiridos |

---

## Integración con LIA

### Contexto para B2B

```typescript
const b2bContext = {
  userType: 'b2b',
  organization: {
    name: org.name,
    industry: org.industry,
  },
  workTeams: teams.map(t => ({
    name: t.name,
    role: t.role,
  })),
  courses: assignedCourses.map(c => ({
    ...c,
    dueDate: c.dueDate,
    assignedBy: c.assignedByName,
  })),
  upcomingDeadlines: urgentDeadlines,
};
```

### Contexto para B2C

```typescript
const b2cContext = {
  userType: 'b2c',
  courses: purchasedCourses,
  learningRoutes: existingRoutes,
  suggestedRoutes: await generateRouteSuggestions(),
  availableCourses: await getCourseSuggestions(),
  hasGoal: !!existingPreferences.goalType,
  goalType: existingPreferences.goalType,
};
```

---

## Ejemplos de Casos de Uso

### Caso B2B: Empleado con Plazos

```
Usuario: Gerente de Marketing en empresa de 500 empleados
Cursos asignados: 
  - Marketing Digital (plazo: 2 semanas)
  - Liderazgo (plazo: 1 mes)

LIA sugiere:
  - Priorizar Marketing Digital
  - Sesiones de 30 min, 4 días/semana
  - Advertencia si tiempos no permiten cumplir plazos
```

### Caso B2C: Usuario Independiente

```
Usuario: Profesional freelance
Cursos adquiridos: 8 cursos varios

LIA ofrece:
  - Seleccionar cursos a incluir
  - Sugerir ruta "IA para Freelancers"
  - Opción de meta fija o flexible
  - Sugerir cursos adicionales relevantes
```

---

## Métricas y Analytics

### Métricas B2B

- Tasa de cumplimiento de plazos
- Tiempo promedio de completar cursos asignados
- Comparación con otros usuarios de la organización
- Progreso de equipos de trabajo

### Métricas B2C

- Cursos completados vs iniciados
- Adherencia al plan de estudio
- Rutas de aprendizaje completadas
- Tiempo promedio de estudio semanal

