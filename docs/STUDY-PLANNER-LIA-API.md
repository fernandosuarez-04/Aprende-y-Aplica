# API del Planificador de Estudios con LIA

Este documento describe los endpoints de API disponibles para el planificador de estudios con LIA.

## Índice

1. [Contexto de Usuario](#contexto-de-usuario)
2. [Calendario](#calendario)
3. [Análisis y Cálculos](#análisis-y-cálculos)
4. [Planes de Estudio](#planes-de-estudio)

---

## Contexto de Usuario

### GET /api/study-planner/user-context

Obtiene el contexto completo del usuario para el planificador.

**Autenticación:** Requerida

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "displayName": "string"
    },
    "userType": "b2b" | "b2c",
    "professionalProfile": {
      "rol": { "id": 1, "nombre": "string" },
      "area": { "id": 1, "nombre": "string" },
      "nivel": { "id": 1, "nombre": "string" },
      "tamanoEmpresa": { "id": 1, "nombre": "string", "minEmpleados": 1, "maxEmpleados": 100 },
      "sector": { "id": 1, "nombre": "string" }
    },
    "organization": {
      "id": "uuid",
      "name": "string"
    },
    "workTeams": [
      { "teamId": "uuid", "name": "string", "role": "member" | "leader" | "co-leader" }
    ],
    "courses": [
      {
        "courseId": "uuid",
        "course": { "id": "uuid", "title": "string", "level": "beginner" | "intermediate" | "advanced" },
        "userType": "b2b" | "b2c",
        "dueDate": "ISO8601",
        "completionPercentage": 50
      }
    ],
    "calendarIntegration": {
      "isConnected": true,
      "provider": "google" | "microsoft"
    }
  }
}
```

---

## Calendario

### POST /api/study-planner/calendar/connect

Inicia la conexión de calendario OAuth.

**Body:**
```json
{
  "provider": "google" | "microsoft"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://..."
  }
}
```

### GET /api/study-planner/calendar/availability

Obtiene eventos y disponibilidad del calendario.

**Query params:**
- `startDate`: Fecha de inicio (ISO8601)
- `endDate`: Fecha de fin (ISO8601)
- `preferredDays`: Array JSON de días (0-6)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "provider": "google",
    "events": [
      {
        "id": "string",
        "title": "string",
        "startTime": "ISO8601",
        "endTime": "ISO8601",
        "status": "confirmed" | "tentative"
      }
    ],
    "availability": [
      {
        "date": "YYYY-MM-DD",
        "freeSlots": [{ "startHour": 9, "startMinute": 0, "endHour": 12, "endMinute": 0 }],
        "totalFreeMinutes": 180
      }
    ],
    "summary": {
      "totalDays": 14,
      "totalFreeMinutes": 2520,
      "averageFreeMinutesPerDay": 180
    }
  }
}
```

### POST /api/study-planner/calendar/analyze

Analiza el calendario usando LIA para generar recomendaciones.

**Body:**
```json
{
  "startDate": "ISO8601",
  "endDate": "ISO8601",
  "preferredDays": [1, 2, 3, 4, 5],
  "minSessionMinutes": 20,
  "maxSessionMinutes": 45
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "events": [...],
    "liaAnalysis": {
      "estimatedWeeklyMinutes": 300,
      "suggestedMinSessionMinutes": 25,
      "suggestedMaxSessionMinutes": 45,
      "suggestedBreakMinutes": 10,
      "suggestedDays": [1, 2, 3, 4, 5],
      "suggestedTimeBlocks": [...],
      "reasoning": "string",
      "factorsConsidered": {...}
    },
    "recommendedSlots": [
      {
        "date": "YYYY-MM-DD",
        "slot": { "startHour": 7, "endHour": 8, ... },
        "suitability": "excellent" | "good" | "fair",
        "reason": "string"
      }
    ]
  }
}
```

### POST /api/study-planner/calendar/disconnect

Desconecta el calendario.

**Body:**
```json
{
  "provider": "google" | "microsoft"  // Opcional
}
```

---

## Análisis y Cálculos

### POST /api/study-planner/calculate-availability

Calcula disponibilidad usando LIA basándose en el perfil profesional.

**Body:**
```json
{
  "calendarEvents": [...],
  "preferredDays": [1, 2, 3, 4, 5],
  "preferredTimeOfDay": "morning" | "afternoon" | "evening" | "night"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "estimatedWeeklyMinutes": 300,
    "suggestedMinSessionMinutes": 25,
    "suggestedMaxSessionMinutes": 45,
    "suggestedBreakMinutes": 10,
    "suggestedDays": [1, 2, 3, 4, 5],
    "suggestedTimeBlocks": [...],
    "reasoning": "string",
    "factorsConsidered": {
      "role": "string",
      "area": "string",
      "companySize": "string",
      "level": "string",
      "calendarAnalysis": "string"
    },
    "analyzedAt": "ISO8601"
  }
}
```

### POST /api/study-planner/validate-session-times

Valida configuración de tiempos de sesión.

**Body:**
```json
{
  "courseIds": ["uuid"],
  "minSessionMinutes": 25,
  "maxSessionMinutes": 45,
  "breakDurationMinutes": 10,
  "preferredDays": [1, 2, 3, 4, 5],
  "preferredTimeBlocks": [...],
  "calendarEvents": [...],
  "goalHoursPerWeek": 5
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": ["string"],
    "suggestions": ["string"],
    "minimumLessonTime": 15,
    "totalEstimatedMinutes": 1800,
    "estimatedWeeksToComplete": 6,
    "meetsDeadlines": true,
    "deadlineIssues": []
  }
}
```

### POST /api/study-planner/suggest-learning-route

Sugiere rutas de aprendizaje personalizadas (solo B2C).

**Body:**
```json
{
  "includeUnpurchasedCourses": false,
  "focusArea": "string",
  "targetSkills": ["string"],
  "maxCourses": 10
}
```

---

## Planes de Estudio

### POST /api/study-planner/generate-plan

Genera un plan de estudio con sesiones.

**Body:**
```json
{
  "name": "Mi Plan",
  "description": "string",
  "courseIds": ["uuid"],
  "learningRouteId": "uuid",
  "goalHoursPerWeek": 5,
  "startDate": "ISO8601",
  "endDate": "ISO8601",
  "timezone": "America/Mexico_City",
  "preferredDays": [1, 2, 3, 4, 5],
  "preferredTimeBlocks": [...],
  "minSessionMinutes": 25,
  "maxSessionMinutes": 45,
  "breakDurationMinutes": 10,
  "preferredSessionType": "short" | "medium" | "long"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "config": {...},
    "sessions": [
      {
        "id": "temp-0",
        "title": "string",
        "startTime": "ISO8601",
        "endTime": "ISO8601",
        "durationMinutes": 45,
        "courseId": "uuid",
        "lessonId": "uuid",
        "status": "planned",
        "isAiGenerated": true
      }
    ],
    "summary": {
      "totalSessions": 24,
      "totalMinutes": 1080,
      "estimatedWeeks": 4,
      "coursesIncluded": 3
    }
  }
}
```

### POST /api/study-planner/save-plan

Guarda un plan de estudio generado.

**Body:**
```json
{
  "config": {...},
  "sessions": [...]
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "planId": "uuid",
    "sessionsCreated": 24
  }
}
```

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Datos de entrada inválidos |
| 401 | No autenticado |
| 403 | No autorizado |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

---

## Notas de Implementación

### Usuarios B2B vs B2C

- **B2B**: Cursos asignados con plazos fijos. Validar siempre contra `due_date`.
- **B2C**: Flexibilidad total. Puede seleccionar cursos y establecer o no metas fijas.

### Validaciones Críticas

1. **Tiempo mínimo de sesión** >= duración de lección más corta
2. **Conflictos de calendario**: Las sesiones no deben solaparse con eventos
3. **Plazos B2B**: Los tiempos configurados deben permitir completar antes de `due_date`

### Cálculos de LIA

Todos los cálculos de disponibilidad y tiempos deben ser realizados por IA generativa, considerando:
- Rol profesional (C-Level tiene menos tiempo)
- Tamaño de empresa (empresas grandes = menos tiempo)
- Área profesional
- Eventos del calendario

