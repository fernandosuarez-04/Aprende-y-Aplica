---
description: Flujo completo del planificador de estudios desde creación hasta ejecución
---

# Flujo Completo del Planificador de Estudios

## Resumen Ejecutivo

El planificador de estudios de "Aprende y Aplica" permite a los usuarios crear planes personalizados para completar cursos, sincronizar con calendarios externos (Google/Microsoft), y tener a LIA como asistente proactivo que detecta sesiones no realizadas y ofrece reprogramarlas.

---

## 1. CREACIÓN DEL PLAN DE ESTUDIOS

### Ruta: `/study-planner/create`

### Paso 1.1: Selección de Curso

- El usuario selecciona un curso de los disponibles
- Se obtiene información del curso: lecciones, duración estimada, etc.
- **Archivo clave:** `apps/web/src/app/study-planner/create/page.tsx`

### Paso 1.2: Configuración de Preferencias

El usuario define:

- **Días preferidos** para estudiar (Lun, Mar, Mié, etc.)
- **Horarios** de inicio y fin
- **Duración** de sesiones (15-60 min típicamente)
- **Enfoque** (fast, balanced, long, custom)
- **Fecha de inicio**

### Paso 1.3: Generación del Plan (LIA)

- LIA analiza el curso y las preferencias
- Calcula cuántas sesiones se necesitan
- Distribuye las lecciones en los días/horarios preferidos
- **API:** `POST /api/study-planner/create`

### Paso 1.4: Almacenamiento en BD

```sql
-- Tabla study_plans
INSERT INTO study_plans (
  user_id, course_id, name, start_date, end_date,
  timezone, status, approach
)

-- Tabla study_preferences
INSERT INTO study_preferences (
  plan_id, user_id, preferred_days, preferred_start_time,
  preferred_end_time, session_duration_minutes
)

-- Tabla study_sessions (una por cada bloque de estudio)
INSERT INTO study_sessions (
  plan_id, user_id, lesson_id, course_id, title,
  start_time, end_time, duration_minutes, status
)
```

### Paso 1.5: Sincronización con Calendario Externo (Opcional)

- Si el usuario conectó Google/Microsoft Calendar
- Se crean eventos en un calendario secundario "Aprende y Aplica"
- Se guarda `external_event_id` en cada sesión
- **Servicio:** `CalendarIntegrationService`

---

## 2. DASHBOARD DEL PLANIFICADOR

### Ruta: `/study-planner/dashboard`

### Componentes Principales:

1. **Calendario Visual** - Muestra todas las sesiones del plan
2. **Panel de LIA** - Chat con el asistente de estudios
3. **Indicadores de Progreso** - Sesiones completadas vs pendientes

### Funcionalidades del Dashboard:

#### 2.1 Visualización de Sesiones

```typescript
// Obtener sesiones del plan
GET /api/study-planner/sessions?startDate=...&endDate=...

// Respuesta
{
  sessions: [
    { id, title, start_time, end_time, status, lesson_id, ... }
  ]
}
```

#### 2.2 Análisis Proactivo de LIA

Cuando se carga el dashboard:

1. Hook `useStudyPlannerDashboardLIA` se activa
2. Envía trigger `proactive_init` a la API
3. LIA analiza:
   - **Sesiones overdue** (planificadas que ya pasaron sin completar)
   - **Conflictos** con eventos del calendario
   - **Progreso semanal** vs objetivos
   - **Días sobrecargados**

#### 2.3 Acciones de LIA en el Dashboard

LIA puede ejecutar:

- `move_session` - Mover una sesión a otro horario
- `delete_session` - Eliminar una sesión
- `create_session` - Crear nueva sesión
- `rebalance_plan` - Redistribuir sesiones atrasadas
- `recover_missed_session` - Reprogramar sesión perdida
- `reduce_session_load` - Reducir carga de un día

---

## 3. EJECUCIÓN DE UNA SESIÓN DE ESTUDIO

### Ruta: `/courses/[slug]/learn`

### Paso 3.1: Entrada al Curso

Cuando el usuario hace clic en una sesión del calendario o accede directamente:

1. Se carga la página del curso con la lección correspondiente
2. Se verifica si hay una sesión activa para ese curso

### Paso 3.2: Tracking de la Lección

#### Inicio del Tracking

```typescript
// Archivo: apps/web/src/hooks/useLessonTracking.ts

// Se activa cuando:
// 1. El usuario reproduce el video
// 2. Manual (clic en "iniciar")

POST /api/study-planner/lesson-tracking/start
{
  lessonId: "uuid",
  sessionId: "uuid",  // Si hay sesión programada
  planId: "uuid",
  startTrigger: "video_play" | "page_load" | "manual"
}
```

#### Registro de Eventos

```typescript
// Durante la lección se registran eventos:

POST /api/study-planner/lesson-tracking/event
{
  trackingId: "uuid",
  eventType: "video_ended" | "lia_message" | "activity"
}

// Eventos relevantes:
// - video_ended: El video terminó de reproducirse
// - lia_message: El usuario interactúa con LIA
// - activity: Cualquier otra actividad (scroll, clic, etc.)
```

### Paso 3.3: Interacción con LIA (Lección)

- LIA está disponible durante la lección
- Puede responder preguntas sobre el contenido
- Se registran mensajes como `lia_message` events

### Paso 3.4: Completar la Lección

#### Triggers de Finalización:

1. **Quiz Submitted** - El usuario completó el quiz
2. **LIA Inactivity (5 min)** - 5 min sin mensajes a LIA después de que terminó el video
3. **Activity Inactivity (5 min)** - 5 min sin actividad general
4. **Context Changed** - El usuario navegó a otra lección
5. **Manual** - El usuario marcó como completada

```typescript
POST /api/study-planner/lesson-tracking/complete
{
  trackingId: "uuid",
  endTrigger: "quiz_submitted" | "lia_inactivity_5m" | "activity_inactivity_5m" | "context_changed" | "manual"
}
```

### Paso 3.5: Actualización de Progreso

```sql
-- Tabla user_lesson_progress
UPDATE user_lesson_progress
SET
  status = 'completed',
  completed_at = NOW(),
  actual_time_spent = [tiempo calculado]
WHERE user_id = ? AND lesson_id = ?

-- Si hay study_session asociada
UPDATE study_sessions
SET
  status = 'completed',
  completed_at = NOW(),
  completion_method = 'quiz' | 'lia_inactivity' | etc.
WHERE id = ?
```

---

## 4. DETECCIÓN DE INACTIVIDAD (Cron Job)

### Archivo: `netlify/functions/process-inactive-lessons.ts`

### Ejecución: Cada 5 minutos

### Lógica:

```typescript
// 1. Buscar lesson_trackings con next_analysis_at <= NOW()
// 2. Para cada tracking:
//    a. Verificar última actividad
//    b. Si han pasado 5 min desde video_ended + última interacción LIA -> cerrar
//    c. Si han pasado 5 min desde última actividad general -> cerrar
// 3. Actualizar status a 'completed' con end_trigger apropiado
```

---

## 5. SESIONES NO REALIZADAS (Flujo de Recuperación)

### Detección en el Dashboard (LIA Proactivo)

Cuando el usuario abre el dashboard:

```typescript
// API: /api/study-planner/dashboard/chat (trigger: proactive_init)

// Consulta sesiones overdue:
SELECT * FROM study_sessions
WHERE plan_id = ?
  AND status = 'planned'
  AND end_time < NOW()
ORDER BY start_time
```

### Mensaje de LIA:

```
Tienes **3 sesiones pendientes** que requieren tu atención:
- Las dos de ayer (domingo 28)
- La de hoy por la mañana (08:00 a.m.)

¿Qué prefieres hacer?
- ¿Las **reprogramamos** para hoy por la tarde?
- ¿Prefieres que **rebalancee** el plan?
```

### Opciones de Recuperación:

#### Opción A: Reprogramar

```typescript
// Action: recover_missed_session
{
  type: "recover_missed_session",
  data: {
    sessionId: "uuid",
    newStartTime: "2025-12-30T18:00:00-06:00",
    newEndTime: "2025-12-30T18:30:00-06:00"
  }
}
```

#### Opción B: Rebalancear

```typescript
// Action: rebalance_plan
{
  type: "rebalance_plan",
  data: {} // El sistema calcula automáticamente
}

// El sistema:
// 1. Obtiene todas las sesiones overdue
// 2. Calcula nuevos slots en los próximos 14 días
// 3. Mueve cada sesión a un nuevo horario
// 4. Sincroniza con calendario externo
```

#### Opción C: Marcar como Completada

```typescript
// Action: update_session
{
  type: "update_session",
  data: {
    sessionId: "uuid",
    status: "completed"
  }
}
```

#### Opción D: Eliminar

```typescript
// Action: delete_session
{
  type: "delete_session",
  data: {
    sessionId: "uuid"
  }
}
```

---

## 6. DIAGRAMA DE FLUJO VISUAL

```
+------------------------------------------------------------------+
|                    CREACIÓN DEL PLAN                             |
|  Usuario -> Selecciona Curso -> Configura Preferencias -> LIA   |
|  genera plan -> Se guardan sesiones -> Sync calendario          |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    DASHBOARD                                      |
|  - Vista calendario con sesiones                                 |
|  - LIA analiza proactivamente:                                   |
|    * Sesiones overdue                                            |
|    * Conflictos                                                  |
|    * Progreso                                                    |
|  - Usuario puede mover/eliminar/crear sesiones                   |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                 EJECUCIÓN DE SESIÓN                              |
|  Usuario -> Entra al curso -> Tracking inicia -> Video + LIA -> |
|  Tracking eventos -> Completar (quiz/inactividad/manual)        |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|              ACTUALIZACIÓN DE PROGRESO                           |
|  - user_lesson_progress se actualiza                             |
|  - study_sessions.status -> 'completed'                          |
|  - Próxima vez en dashboard -> LIA felicita                      |
+------------------------------------------------------------------+
                              |
              +---------------+---------------+
              v                               v
+-------------------------+     +-------------------------+
|   SESIÓN COMPLETADA     |     |   SESIÓN NO REALIZADA   |
|   OK Todo bien          |     |   LIA detecta            |
|   - Siguiente sesión    |     |   - Ofrece reprogramar  |
|     programada          |     |   - O rebalancear plan  |
+-------------------------+     +-------------------------+
```

---

## 7. TABLAS DE BASE DE DATOS INVOLUCRADAS

| Tabla                   | Propósito                                 |
| ----------------------- | ----------------------------------------- |
| `study_plans`           | Plan de estudio (metadata)                |
| `study_preferences`     | Preferencias del usuario (días, horarios) |
| `study_sessions`        | Sesiones individuales programadas         |
| `user_lesson_progress`  | Progreso por lección                      |
| `lesson_tracking`       | Tracking en tiempo real de lección activa |
| `lesson_time_estimates` | Estimaciones de tiempo por lección        |
| `calendar_integrations` | Conexión con Google/Microsoft Calendar    |
| `lia_conversations`     | Historial de chat con LIA                 |

---

## 8. ARCHIVOS CLAVE DEL SISTEMA

### Frontend:

- `apps/web/src/app/study-planner/create/page.tsx` - Creación del plan
- `apps/web/src/app/study-planner/dashboard/page.tsx` - Dashboard
- `apps/web/src/app/courses/[slug]/learn/page.tsx` - Página de curso
- `apps/web/src/features/study-planner/hooks/useStudyPlannerDashboardLIA.ts` - Hook de LIA

### APIs:

- `/api/study-planner/create` - Crear plan
- `/api/study-planner/dashboard/plan` - Obtener plan activo
- `/api/study-planner/dashboard/chat` - Chat con LIA
- `/api/study-planner/sessions` - CRUD de sesiones
- `/api/study-planner/lesson-tracking/*` - Tracking de lecciones

### Servicios:

- `CalendarIntegrationService` - Sincronización con calendarios externos
- `LessonTrackingService` - Lógica de tracking de lecciones

### Cron Jobs:

- `netlify/functions/process-inactive-lessons.ts` - Detector de inactividad

---

## 9. ESTADOS DE UNA SESIÓN

| Estado        | Descripción                            |
| ------------- | -------------------------------------- |
| `planned`     | Sesión programada, aún no iniciada     |
| `in_progress` | Usuario está activamente en la lección |
| `completed`   | Sesión completada correctamente        |
| `missed`      | La sesión pasó sin ser completada      |
| `rescheduled` | Fue reprogramada a otra fecha          |

---

## 10. RESUMEN DEL FLUJO COMPLETO

1. **Usuario crea plan** -> LIA genera sesiones -> Sync calendario
2. **Usuario abre dashboard** -> LIA analiza proactivamente -> Detecta problemas
3. **Usuario entra a lección** -> Tracking inicia -> Se registran eventos
4. **Usuario completa** -> Progreso se actualiza -> Status = completed
5. **Si no completa** -> LIA detecta en siguiente visita -> Ofrece soluciones
6. **Cron job** -> Cierra sesiones inactivas automáticamente

Este flujo asegura que:

- El usuario siempre tenga un plan actualizado
- LIA sea proactiva en detectar y resolver problemas
- El progreso se registre automáticamente
- Las sesiones no realizadas se identifiquen y ofrezcan soluciones
