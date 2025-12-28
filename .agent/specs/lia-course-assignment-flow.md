# Especificación Técnica: Flujo de Asignación de Cursos con LIA

**Versión:** 1.0  
**Fecha:** 2025-12-27  
**Estado:** Especificación Final

---

## 1. Resumen Ejecutivo

Esta especificación define el nuevo flujo de asignación de cursos en la página de **Talleres** del Business Panel, integrando un modal guiado por **LIA** (Learning Intelligence Assistant) que sugiere fechas límite personalizadas basadas en tres enfoques de estudio: **Rápido**, **Equilibrado** y **Largo**.

### 1.1 Objetivos

- Permitir a los administradores programar una **fecha de inicio** para los cursos asignados
- Proporcionar sugerencias inteligentes de **fecha límite** basadas en el enfoque de estudio elegido
- Calcular dinámicamente las sugerencias usando datos reales del curso (duración, lecciones, actividades)
- Mejorar la experiencia del usuario con un flujo guiado e intuitivo

---

## 2. Flujo UX Completo

### 2.1 Punto de Entrada

**Ubicación:** Página de Talleres → Modal de Asignación de Curso (`BusinessAssignCourseModal.tsx`)

**Trigger:** Cuando el administrador hace clic en el campo **"Fecha límite"** o en el botón **"Sugerir con LIA"**.

### 2.2 Estados del Flujo

#### Estado 1: Modal de Asignación Original

- **Vista actual:** Selección de usuarios/equipos, fecha límite manual, mensaje opcional
- **Cambio:** Al hacer clic en "Fecha límite" o "Sugerir con LIA", se abre el **Modal LIA**

#### Estado 2: Modal LIA - Selección de Enfoque

- **Título:** "¿Con qué enfoque quieres hacer el curso?"
- **Subtítulo:** Nombre del curso y duración total estimada
- **Opciones visuales:**
  - 🚀 **Rápido** - Para completar el curso rápidamente
  - ⚖️ **Equilibrado** - Ritmo moderado y sostenible
  - 🌱 **Largo** - Aprendizaje profundo y pausado

#### Estado 3: Modal LIA - Sugerencias de Fecha

- **Título:** "Sugerencias de fecha límite"
- **Contenido:**
  - Tarjeta por cada enfoque con:
    - Nombre del enfoque
    - Fecha límite sugerida (calculada)
    - Duración estimada (ej: "2 semanas", "4 semanas")
    - Descripción breve del ritmo
  - Botón "Seleccionar" en cada tarjeta
  - Opción "Definir fecha personalizada" al final

#### Estado 4: Confirmación y Fecha de Inicio

- **Título:** "Confirmar asignación"
- **Contenido:**
  - Fecha límite seleccionada
  - Campo para **fecha de inicio** (opcional, default: hoy)
  - Resumen: "El curso debe completarse en X días/semanas"
  - Botones: "Confirmar" y "Volver"

#### Estado 5: Asignación Exitosa

- **Acción:** Cerrar modal LIA, actualizar modal principal con fecha límite y fecha de inicio
- **Feedback:** Toast de confirmación

### 2.3 Copy del Modal LIA

#### Pantalla 1: Selección de Enfoque

```
Título: "¿Con qué enfoque quieres hacer el curso?"
Subtítulo: "[Nombre del Curso] • Duración estimada: [X] horas"

Opciones:
┌─────────────────────────────────────────┐
│ 🚀 Rápido                               │
│ Completa el curso en el menor tiempo    │
│ Ideal para: Urgencias o actualizaciones │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⚖️ Equilibrado                          │
│ Ritmo moderado y sostenible             │
│ Ideal para: Aprendizaje profesional     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🌱 Largo                                │
│ Aprendizaje profundo y reflexivo        │
│ Ideal para: Desarrollo de habilidades   │
└─────────────────────────────────────────┘

[Cancelar]
```

#### Pantalla 2: Sugerencias de Fecha

```
Título: "Sugerencias de fecha límite"
Subtítulo: "Basadas en [X] lecciones y [Y] horas de contenido"

┌─────────────────────────────────────────┐
│ 🚀 Rápido                               │
│ Fecha límite: [DD/MM/YYYY]              │
│ Duración: ~2 semanas                    │
│ Ritmo: 5-7 horas/semana                 │
│                        [Seleccionar] ✓  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⚖️ Equilibrado                          │
│ Fecha límite: [DD/MM/YYYY]              │
│ Duración: ~4 semanas                    │
│ Ritmo: 2-3 horas/semana                 │
│                        [Seleccionar] ✓  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🌱 Largo                                │
│ Fecha límite: [DD/MM/YYYY]              │
│ Duración: ~8 semanas                    │
│ Ritmo: 1-2 horas/semana                 │
│                        [Seleccionar] ✓  │
└─────────────────────────────────────────┘

[Definir fecha personalizada]
[Volver]
```

#### Pantalla 3: Confirmación

```
Título: "Confirmar asignación"

Fecha límite seleccionada: [DD/MM/YYYY]
Enfoque: [Rápido/Equilibrado/Largo]

Fecha de inicio (opcional):
[Selector de fecha] (default: hoy)

Resumen:
El curso debe completarse en [X] días
Ritmo sugerido: [Y] horas/semana

[Volver]  [Confirmar Asignación]
```

---

## 3. Lógica de Cálculo de Fechas Sugeridas

### 3.1 Entradas Necesarias

Para calcular las sugerencias de fecha límite, el sistema necesita:

1. **Duración total del curso** (`duration_total_minutes` de la tabla `courses`)
2. **Número de lecciones** (count de `course_lessons` por `course_id`)
3. **Número de actividades** (count de `lesson_activities` por lecciones del curso)
4. **Tiempo estimado de materiales** (sum de `estimated_time_minutes` de `lesson_materials`)
5. **Fecha de inicio** (proporcionada por el admin o default: hoy)

### 3.2 Fórmula de Cálculo

#### Variables Base

```javascript
// Obtener duración total en horas
const totalHours = duration_total_minutes / 60

// Factores de complejidad
const lessonCount = /* número de lecciones */
const activityCount = /* número de actividades */
const materialCount = /* número de materiales */

// Tiempo adicional estimado (overhead)
const overheadFactor = 1.2 // 20% adicional para revisión y práctica
const adjustedHours = totalHours * overheadFactor
```

#### Heurística por Enfoque

**Enfoque Rápido:**

- **Horas por semana:** 5-7 horas
- **Fórmula:** `días = Math.ceil((adjustedHours / 6) * 7)`
- **Mínimo:** 7 días
- **Máximo:** 21 días

**Enfoque Equilibrado:**

- **Horas por semana:** 2-3 horas
- **Fórmula:** `días = Math.ceil((adjustedHours / 2.5) * 7)`
- **Mínimo:** 14 días
- **Máximo:** 60 días

**Enfoque Largo:**

- **Horas por semana:** 1-2 horas
- **Fórmula:** `días = Math.ceil((adjustedHours / 1.5) * 7)`
- **Mínimo:** 30 días
- **Máximo:** 120 días

#### Ajustes Dinámicos

```javascript
// Ajuste por complejidad del curso
if (activityCount > lessonCount * 2) {
  // Curso muy interactivo, añadir 15% más de tiempo
  días = Math.ceil(días * 1.15);
}

if (materialCount > lessonCount * 3) {
  // Muchos materiales adicionales, añadir 10% más
  días = Math.ceil(días * 1.1);
}

// Ajuste por duración extrema
if (totalHours < 2) {
  // Curso muy corto, mínimo 3 días para Rápido
  días = Math.max(días, 3);
} else if (totalHours > 50) {
  // Curso muy largo, aplicar factor de escala
  días = Math.ceil(días * 1.25);
}
```

### 3.3 Pseudocódigo de Implementación

```typescript
interface CourseMetadata {
  duration_total_minutes: number
  lesson_count: number
  activity_count: number
  material_count: number
}

interface ApproachSuggestion {
  approach: 'fast' | 'balanced' | 'long'
  deadline_date: string // ISO 8601
  duration_days: number
  duration_weeks: number
  hours_per_week: number
  description: string
}

function calculateDeadlineSuggestions(
  courseId: string,
  startDate: Date = new Date()
): Promise<ApproachSuggestion[]> {

  // 1. Obtener metadata del curso
  const metadata = await fetchCourseMetadata(courseId)

  // 2. Calcular duración base
  const totalHours = metadata.duration_total_minutes / 60
  const adjustedHours = totalHours * 1.2 // overhead

  // 3. Calcular sugerencias por enfoque
  const suggestions: ApproachSuggestion[] = []

  // RÁPIDO
  let fastDays = Math.ceil((adjustedHours / 6) * 7)
  fastDays = applyComplexityAdjustments(fastDays, metadata, 'fast')
  fastDays = Math.max(7, Math.min(21, fastDays))

  suggestions.push({
    approach: 'fast',
    deadline_date: addDays(startDate, fastDays).toISOString(),
    duration_days: fastDays,
    duration_weeks: Math.ceil(fastDays / 7),
    hours_per_week: 6,
    description: 'Completa el curso rápidamente con dedicación intensiva'
  })

  // EQUILIBRADO
  let balancedDays = Math.ceil((adjustedHours / 2.5) * 7)
  balancedDays = applyComplexityAdjustments(balancedDays, metadata, 'balanced')
  balancedDays = Math.max(14, Math.min(60, balancedDays))

  suggestions.push({
    approach: 'balanced',
    deadline_date: addDays(startDate, balancedDays).toISOString(),
    duration_days: balancedDays,
    duration_weeks: Math.ceil(balancedDays / 7),
    hours_per_week: 2.5,
    description: 'Ritmo moderado y sostenible para profesionales'
  })

  // LARGO
  let longDays = Math.ceil((adjustedHours / 1.5) * 7)
  longDays = applyComplexityAdjustments(longDays, metadata, 'long')
  longDays = Math.max(30, Math.min(120, longDays))

  suggestions.push({
    approach: 'long',
    deadline_date: addDays(startDate, longDays).toISOString(),
    duration_days: longDays,
    duration_weeks: Math.ceil(longDays / 7),
    hours_per_week: 1.5,
    description: 'Aprendizaje profundo con tiempo para reflexión'
  })

  return suggestions
}

function applyComplexityAdjustments(
  days: number,
  metadata: CourseMetadata,
  approach: string
): number {
  let adjusted = days

  // Ajuste por actividades
  if (metadata.activity_count > metadata.lesson_count * 2) {
    adjusted = Math.ceil(adjusted * 1.15)
  }

  // Ajuste por materiales
  if (metadata.material_count > metadata.lesson_count * 3) {
    adjusted = Math.ceil(adjusted * 1.10)
  }

  // Ajuste por duración extrema
  const totalHours = metadata.duration_total_minutes / 60
  if (totalHours < 2) {
    adjusted = Math.max(adjusted, approach === 'fast' ? 3 : 7)
  } else if (totalHours > 50) {
    adjusted = Math.ceil(adjusted * 1.25)
  }

  return adjusted
}

async function fetchCourseMetadata(courseId: string): Promise<CourseMetadata> {
  // Query a la BD para obtener:
  // - duration_total_minutes de courses
  // - COUNT de course_lessons
  // - COUNT de lesson_activities
  // - COUNT de lesson_materials

  const { data } = await supabase
    .from('courses')
    .select(`
      duration_total_minutes,
      course_modules (
        course_lessons (
          lesson_id,
          lesson_activities (activity_id),
          lesson_materials (material_id)
        )
      )
    `)
    .eq('id', courseId)
    .single()

  // Procesar y retornar metadata
  return {
    duration_total_minutes: data.duration_total_minutes,
    lesson_count: /* calcular */,
    activity_count: /* calcular */,
    material_count: /* calcular */
  }
}
```

---

## 4. Cambios Técnicos Necesarios

### 4.1 Base de Datos (`bd.sql`)

#### Modificación: Tabla `organization_course_assignments`

**Cambio:** Añadir columna `start_date` para almacenar la fecha de inicio programada.

```sql
-- Añadir columna start_date
ALTER TABLE public.organization_course_assignments
ADD COLUMN start_date timestamp without time zone;

-- Añadir índice para optimizar consultas
CREATE INDEX idx_org_course_assignments_start_date
ON public.organization_course_assignments(start_date);

-- Añadir constraint: start_date debe ser <= due_date
ALTER TABLE public.organization_course_assignments
ADD CONSTRAINT check_start_before_due
CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date);
```

**Justificación:**

- Permite programar cuándo debe iniciar el curso
- Facilita reportes de cursos próximos a iniciar
- Mejora la planificación de carga de trabajo

#### Modificación: Tabla `organization_course_assignments` (opcional)

**Cambio:** Añadir columna `approach` para registrar el enfoque elegido.

```sql
-- Añadir columna approach (opcional, para analytics)
ALTER TABLE public.organization_course_assignments
ADD COLUMN approach character varying
CHECK (approach IS NULL OR approach IN ('fast', 'balanced', 'long', 'custom'));

-- Default NULL para asignaciones sin enfoque definido
```

**Justificación:**

- Permite análisis de qué enfoques son más populares
- Facilita reportes de cumplimiento por enfoque
- Ayuda a LIA a mejorar sugerencias futuras

### 4.2 Backend/API

#### Nueva API: `/api/business/courses/[courseId]/deadline-suggestions`

**Método:** `GET`  
**Autenticación:** Requerida (admin/owner)  
**Query Params:**

- `start_date` (opcional): Fecha de inicio en formato ISO 8601 (default: hoy)

**Respuesta:**

```json
{
  "success": true,
  "course_id": "uuid",
  "course_title": "Introducción a IA",
  "metadata": {
    "duration_hours": 12.5,
    "lesson_count": 15,
    "activity_count": 30,
    "material_count": 45
  },
  "suggestions": [
    {
      "approach": "fast",
      "deadline_date": "2025-01-10T00:00:00Z",
      "duration_days": 14,
      "duration_weeks": 2,
      "hours_per_week": 6,
      "description": "Completa el curso rápidamente con dedicación intensiva"
    },
    {
      "approach": "balanced",
      "deadline_date": "2025-01-31T00:00:00Z",
      "duration_days": 35,
      "duration_weeks": 5,
      "hours_per_week": 2.5,
      "description": "Ritmo moderado y sostenible para profesionales"
    },
    {
      "approach": "long",
      "deadline_date": "2025-03-07T00:00:00Z",
      "duration_days": 70,
      "duration_weeks": 10,
      "hours_per_week": 1.5,
      "description": "Aprendizaje profundo con tiempo para reflexión"
    }
  ]
}
```

**Implementación:**

```typescript
// apps/web/src/app/api/business/courses/[courseId]/deadline-suggestions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateDeadlineSuggestions } from "@/lib/course-deadline-calculator";

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const supabase = createClient();

    // Verificar autenticación y permisos
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que el usuario es admin/owner de una organización
    const { data: orgUser } = await supabase
      .from("organization_users")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "owner"])
      .single();

    if (!orgUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Obtener start_date de query params
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("start_date");
    const startDate = startDateParam ? new Date(startDateParam) : new Date();

    // Calcular sugerencias
    const suggestions = await calculateDeadlineSuggestions(
      params.courseId,
      startDate
    );

    return NextResponse.json({
      success: true,
      ...suggestions,
    });
  } catch (error) {
    console.error("Error calculating deadline suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### Modificación: `/api/business/courses/[courseId]/assign`

**Cambio:** Aceptar `start_date` y `approach` en el body.

```typescript
// Antes
interface AssignCourseBody {
  user_ids: string[];
  due_date?: string;
  message?: string;
}

// Después
interface AssignCourseBody {
  user_ids: string[];
  due_date?: string;
  start_date?: string; // NUEVO
  approach?: "fast" | "balanced" | "long" | "custom"; // NUEVO
  message?: string;
}
```

**Validación:**

```typescript
// Validar que start_date <= due_date
if (start_date && due_date) {
  const start = new Date(start_date);
  const due = new Date(due_date);

  if (start > due) {
    return NextResponse.json(
      { error: "La fecha de inicio no puede ser posterior a la fecha límite" },
      { status: 400 }
    );
  }
}
```

### 4.3 Frontend/UI

#### Nuevo Componente: `LiaDeadlineSuggestionModal.tsx`

**Ubicación:** `apps/web/src/features/business-panel/components/`

**Props:**

```typescript
interface LiaDeadlineSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  onSelectDeadline: (
    deadline: string,
    startDate: string,
    approach: string
  ) => void;
}
```

**Estructura:**

```tsx
export function LiaDeadlineSuggestionModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  onSelectDeadline,
}: LiaDeadlineSuggestionModalProps) {
  const [step, setStep] = useState<"approach" | "suggestions" | "confirm">(
    "approach"
  );
  const [selectedApproach, setSelectedApproach] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ApproachSuggestion[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch suggestions cuando se selecciona un enfoque
  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/business/courses/${courseId}/deadline-suggestions?start_date=${startDate.toISOString()}`
      );
      const data = await response.json();
      setSuggestions(data.suggestions);
      setStep("suggestions");
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 max-w-2xl mx-auto mt-20"
          >
            {step === "approach" && <ApproachSelectionStep />}
            {step === "suggestions" && <SuggestionsStep />}
            {step === "confirm" && <ConfirmationStep />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

#### Modificación: `BusinessAssignCourseModal.tsx`

**Cambios:**

1. Añadir estado para `startDate` y `approach`
2. Añadir botón "Sugerir con LIA" junto al campo de fecha límite
3. Integrar `LiaDeadlineSuggestionModal`
4. Actualizar llamada API para incluir `start_date` y `approach`

```tsx
// Nuevos estados
const [startDate, setStartDate] = useState<string>("");
const [approach, setApproach] = useState<string | null>(null);
const [showLiaModal, setShowLiaModal] = useState(false);

// Handler para recibir selección de LIA
const handleLiaSelection = (
  deadline: string,
  start: string,
  selectedApproach: string
) => {
  setDueDate(deadline);
  setStartDate(start);
  setApproach(selectedApproach);
  setShowLiaModal(false);
};

// Actualizar handleAssign
const handleAssign = async () => {
  // ... validaciones existentes ...

  const response = await fetch(`/api/business/courses/${courseId}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_ids: Array.from(selectedUserIds),
      due_date: dueDate || null,
      start_date: startDate || null, // NUEVO
      approach: approach || null, // NUEVO
      message: customMessage.trim() || null,
    }),
  });

  // ... resto del código ...
};
```

#### Nueva Utilidad: `course-deadline-calculator.ts`

**Ubicación:** `apps/web/src/lib/`

```typescript
// Implementar las funciones de cálculo descritas en la sección 3.3
export { calculateDeadlineSuggestions, fetchCourseMetadata };
```

---

## 5. Edge Cases y Validaciones

### 5.1 Zona Horaria

**Problema:** Diferentes zonas horarias entre admin y usuarios.

**Solución:**

- Almacenar todas las fechas en UTC en la BD
- Convertir a zona horaria local del usuario en el frontend
- Mostrar zona horaria en la UI de confirmación

```typescript
// Ejemplo de conversión
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const localDeadline = new Date(deadline).toLocaleString("es-ES", {
  timeZone: userTimezone,
  dateStyle: "full",
});
```

### 5.2 Cursos Muy Cortos (< 2 horas)

**Problema:** Cursos de microlearning pueden dar sugerencias irreales.

**Solución:**

- Establecer mínimos absolutos:
  - Rápido: 3 días
  - Equilibrado: 7 días
  - Largo: 14 días
- Mostrar advertencia: "Este es un curso corto. Las sugerencias son conservadoras."

### 5.3 Cursos Muy Largos (> 50 horas)

**Problema:** Cursos extensos pueden requerir meses.

**Solución:**

- Aplicar factor de escala (1.25x)
- Mostrar duración en semanas/meses en lugar de días
- Sugerir división en hitos intermedios (futuro)

### 5.4 Usuarios Sin Fecha de Inicio

**Problema:** Admin no define fecha de inicio.

**Solución:**

- Default: fecha actual (hoy)
- Permitir edición posterior desde el panel de asignaciones
- Notificar al usuario cuando se acerque la fecha de inicio

### 5.5 Cambio de Enfoque

**Problema:** Admin quiere cambiar el enfoque después de asignar.

**Solución:**

- Permitir reasignación con nueva fecha límite
- Registrar cambio en `audit_logs`
- Notificar al usuario del cambio

### 5.6 Permisos

**Problema:** Usuarios sin permisos intentan acceder a la API.

**Solución:**

- Verificar rol en `organization_users` (admin/owner)
- Retornar 403 Forbidden si no tiene permisos
- Logging de intentos no autorizados

### 5.7 Conflictos de Fechas

**Problema:** `start_date` > `due_date`

**Solución:**

- Validación en frontend antes de enviar
- Validación en backend con constraint de BD
- Mensaje de error claro: "La fecha de inicio debe ser anterior a la fecha límite"

### 5.8 Cursos Sin Metadata Completa

**Problema:** Curso sin lecciones o duración definida.

**Solución:**

- Usar valores por defecto conservadores:
  - Duración: 10 horas
  - Lecciones: 10
  - Actividades: 20
- Mostrar advertencia: "Sugerencias basadas en estimaciones. El curso no tiene metadata completa."

---

## 6. Criterios de Aceptación

### 6.1 Funcionalidad Core

- [ ] Al hacer clic en "Sugerir con LIA", se abre el modal LIA
- [ ] El modal muestra las 3 opciones de enfoque con iconos y descripciones
- [ ] Al seleccionar un enfoque, se muestran las sugerencias de fecha calculadas
- [ ] Las sugerencias se calculan dinámicamente basadas en metadata real del curso
- [ ] El usuario puede seleccionar una sugerencia o definir fecha personalizada
- [ ] Al confirmar, se cierra el modal LIA y se actualiza el modal principal
- [ ] La asignación incluye `start_date` y `approach` en la BD

### 6.2 Validaciones

- [ ] No se puede asignar con `start_date` > `due_date`
- [ ] Las fechas se almacenan en UTC
- [ ] Los cursos sin metadata usan valores por defecto
- [ ] Solo admins/owners pueden acceder a la API de sugerencias

### 6.3 UX

- [ ] El modal LIA tiene animaciones suaves (framer-motion)
- [ ] Los colores respetan el tema de la organización (`OrganizationStylesContext`)
- [ ] El modal es responsive (mobile, tablet, desktop)
- [ ] Hay feedback visual durante la carga (skeleton/spinner)
- [ ] Los mensajes de error son claros y accionables

### 6.4 Performance

- [ ] La API de sugerencias responde en < 500ms
- [ ] El cálculo de metadata usa índices de BD
- [ ] No hay re-renders innecesarios en el modal

### 6.5 Accesibilidad

- [ ] El modal es navegable con teclado (Tab, Enter, Esc)
- [ ] Los botones tienen labels descriptivos
- [ ] Los colores tienen suficiente contraste (WCAG AA)

---

## 7. Supuestos y Defaults

### 7.1 Supuestos

1. **Duración del curso:** Todos los cursos tienen `duration_total_minutes` > 0
2. **Ritmo de estudio:** Los usuarios pueden dedicar las horas sugeridas por semana
3. **Zona horaria:** La mayoría de usuarios están en la misma zona horaria que la organización
4. **Metadata:** Los cursos tienen al menos 1 lección y 1 actividad

### 7.2 Defaults Seguros

| Campo                    | Default   | Justificación                            |
| ------------------------ | --------- | ---------------------------------------- |
| `start_date`             | Hoy (UTC) | Inicio inmediato es el caso más común    |
| `approach`               | `null`    | Opcional, solo si se usa LIA             |
| `duration_total_minutes` | 600 (10h) | Promedio conservador si falta metadata   |
| `lesson_count`           | 10        | Estimación razonable para cursos típicos |
| `activity_count`         | 20        | 2 actividades por lección                |
| `overhead_factor`        | 1.2       | 20% adicional para revisión y práctica   |

---

## 8. Checklist de Pruebas

### 8.1 Pruebas Unitarias

- [ ] `calculateDeadlineSuggestions()` retorna 3 sugerencias
- [ ] `applyComplexityAdjustments()` ajusta correctamente por actividades
- [ ] `fetchCourseMetadata()` maneja cursos sin lecciones
- [ ] Validación de `start_date <= due_date` funciona

### 8.2 Pruebas de Integración

- [ ] API `/deadline-suggestions` retorna formato correcto
- [ ] API `/assign` acepta `start_date` y `approach`
- [ ] La BD almacena correctamente `start_date` y `approach`
- [ ] El constraint `check_start_before_due` rechaza fechas inválidas

### 8.3 Pruebas E2E

- [ ] Flujo completo: abrir modal → seleccionar enfoque → confirmar → asignar
- [ ] Cambiar de enfoque en el modal LIA
- [ ] Definir fecha personalizada
- [ ] Asignar a múltiples usuarios con fecha sugerida
- [ ] Asignar a equipos con fecha sugerida

### 8.4 Pruebas de Edge Cases

- [ ] Curso con 0 lecciones
- [ ] Curso con duración < 1 hora
- [ ] Curso con duración > 100 horas
- [ ] `start_date` en el pasado
- [ ] `start_date` > `due_date`
- [ ] Usuario sin permisos intenta acceder a API
- [ ] Zona horaria diferente (UTC-6, UTC+2)

### 8.5 Pruebas de Regresión

- [ ] El flujo de asignación manual (sin LIA) sigue funcionando
- [ ] Las asignaciones existentes no se ven afectadas
- [ ] Los reportes de cursos asignados funcionan correctamente

---

## 9. Plan de Implementación

### Fase 1: Backend y BD (Estimado: 2-3 días)

1. Migración de BD: añadir `start_date` y `approach`
2. Implementar `course-deadline-calculator.ts`
3. Crear API `/deadline-suggestions`
4. Modificar API `/assign` para aceptar nuevos campos
5. Escribir tests unitarios

### Fase 2: Frontend - Modal LIA (Estimado: 3-4 días)

1. Crear `LiaDeadlineSuggestionModal.tsx`
2. Implementar paso 1: Selección de enfoque
3. Implementar paso 2: Sugerencias de fecha
4. Implementar paso 3: Confirmación
5. Integrar con `OrganizationStylesContext`
6. Añadir animaciones y transiciones

### Fase 3: Integración (Estimado: 1-2 días)

1. Modificar `BusinessAssignCourseModal.tsx`
2. Conectar modal LIA con modal principal
3. Actualizar llamadas API
4. Pruebas de integración

### Fase 4: Testing y Refinamiento (Estimado: 2 días)

1. Pruebas E2E
2. Pruebas de edge cases
3. Ajustes de UX basados en feedback
4. Optimización de performance

### Fase 5: Documentación y Deploy (Estimado: 1 día)

1. Documentar API endpoints
2. Actualizar README
3. Deploy a staging
4. Deploy a producción

**Total Estimado:** 9-12 días

---

## 10. Métricas de Éxito

### 10.1 Métricas de Adopción

- % de asignaciones que usan LIA vs. manual
- Enfoque más popular (Rápido/Equilibrado/Largo)
- Tiempo promedio para completar asignación con LIA

### 10.2 Métricas de Efectividad

- % de cursos completados antes de la fecha límite sugerida
- Diferencia entre fecha sugerida y fecha real de completado
- Tasa de cambio de enfoque después de asignar

### 10.3 Métricas Técnicas

- Tiempo de respuesta de API `/deadline-suggestions`
- Tasa de error en cálculos de sugerencias
- Uso de CPU/memoria durante cálculos

---

## 11. Futuras Mejoras (Fuera de Alcance)

1. **Sugerencias personalizadas por usuario:** Basadas en historial de completado
2. **Ajuste dinámico de fechas:** LIA sugiere extender deadline si el usuario va atrasado
3. **Integración con calendario:** Bloquear tiempo de estudio automáticamente
4. **Hitos intermedios:** Dividir cursos largos en checkpoints
5. **Notificaciones proactivas:** Recordatorios basados en el enfoque elegido
6. **Dashboard de cumplimiento:** Visualizar progreso vs. enfoque elegido

---

## 12. Anexos

### 12.1 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────┐
│ Admin abre modal de asignación                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Click en "Sugerir con LIA"                              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Modal LIA: Seleccionar enfoque                          │
│ [Rápido] [Equilibrado] [Largo]                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Fetch /api/deadline-suggestions                         │
│ Calcular sugerencias basadas en metadata               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Modal LIA: Mostrar sugerencias                          │
│ [Rápido: 14 días] [Equilibrado: 35 días] [Largo: 70]   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Admin selecciona una sugerencia                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Modal LIA: Confirmar y definir fecha de inicio          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Cerrar modal LIA, actualizar modal principal            │
│ due_date, start_date, approach actualizados             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Admin confirma asignación                               │
│ POST /api/assign con start_date y approach              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Curso asignado con éxito                                │
│ Notificación al usuario                                 │
└─────────────────────────────────────────────────────────┘
```

### 12.2 Ejemplo de Respuesta API

```json
{
  "success": true,
  "course_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "course_title": "Introducción a la Inteligencia Artificial",
  "metadata": {
    "duration_hours": 12.5,
    "duration_minutes": 750,
    "lesson_count": 15,
    "activity_count": 30,
    "material_count": 45
  },
  "suggestions": [
    {
      "approach": "fast",
      "deadline_date": "2025-01-10T23:59:59Z",
      "duration_days": 14,
      "duration_weeks": 2,
      "hours_per_week": 6,
      "description": "Completa el curso rápidamente con dedicación intensiva",
      "estimated_completion_rate": "85%"
    },
    {
      "approach": "balanced",
      "deadline_date": "2025-01-31T23:59:59Z",
      "duration_days": 35,
      "duration_weeks": 5,
      "hours_per_week": 2.5,
      "description": "Ritmo moderado y sostenible para profesionales",
      "estimated_completion_rate": "92%"
    },
    {
      "approach": "long",
      "deadline_date": "2025-03-07T23:59:59Z",
      "duration_days": 70,
      "duration_weeks": 10,
      "hours_per_week": 1.5,
      "description": "Aprendizaje profundo con tiempo para reflexión",
      "estimated_completion_rate": "95%"
    }
  ],
  "calculated_at": "2025-12-27T19:19:33Z"
}
```

---

## 13. Glosario

- **Enfoque:** Ritmo de estudio elegido por el administrador (Rápido/Equilibrado/Largo)
- **Fecha de inicio:** Día en que el usuario debe comenzar el curso
- **Fecha límite:** Día máximo para completar el curso
- **Overhead:** Tiempo adicional estimado para revisión y práctica (20%)
- **Metadata del curso:** Información sobre duración, lecciones, actividades y materiales
- **LIA:** Learning Intelligence Assistant, asistente de IA para sugerencias

---

**Fin de la Especificación**

Esta especificación está lista para ser implementada. Todos los supuestos están declarados explícitamente y los defaults son seguros. El alcance está claramente definido y las futuras mejoras están documentadas pero fuera del alcance actual.
