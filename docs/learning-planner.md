# Planificador de Estudio - Documentación

## Descripción General

El Planificador de Estudio es una funcionalidad completa que permite a los usuarios organizar sus sesiones de aprendizaje, crear hábitos de estudio personalizados y sincronizar sus sesiones con calendarios externos (Google Calendar, Microsoft Calendar, Apple Calendar).

## Arquitectura

### Estructura de Tablas

El sistema utiliza las siguientes tablas en Supabase:

#### `study_plans`
Almacena los planes de estudio del usuario con sus preferencias de días y horarios.

**Campos principales:**
- `user_id`: ID del usuario
- `name`: Nombre del plan
- `goal_hours_per_week`: Objetivo de horas semanales
- `preferred_days`: Array de días de la semana (1-7, donde 1 = Lunes)
- `preferred_time_blocks`: JSONB con bloques de tiempo personalizados

#### `study_preferences`
Preferencias globales del usuario para el estudio.

**Campos principales:**
- `user_id`: ID del usuario (único)
- `preferred_time_of_day`: 'morning' | 'afternoon' | 'evening' | 'night'
- `preferred_days`: Array de días preferidos
- `daily_target_minutes`: Objetivo diario en minutos
- `weekly_target_minutes`: Objetivo semanal en minutos

#### `study_sessions`
Sesiones individuales de estudio programadas.

**Campos principales:**
- `user_id`: ID del usuario
- `plan_id`: ID del plan asociado (opcional)
- `title`: Título de la sesión
- `start_time`: Fecha y hora de inicio (ISO timestamp)
- `end_time`: Fecha y hora de fin (ISO timestamp)
- `status`: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'skipped'
- `recurrence`: JSONB con reglas de recurrencia
- `metrics`: JSONB con métricas de la sesión
- `calendar_provider`: Proveedor de calendario externo
- `external_event_id`: ID del evento en el calendario externo

#### `calendar_integrations`
Integraciones OAuth con calendarios externos.

**Campos principales:**
- `user_id`: ID del usuario
- `provider`: 'google' | 'microsoft' | 'apple'
- `access_token`: Token de acceso OAuth
- `refresh_token`: Token de refresco OAuth
- `expires_at`: Fecha de expiración del token

## Formato de Datos JSONB

### `recurrence` (study_sessions)
```json
{
  "frequency": "daily" | "weekly" | "monthly",
  "interval": 1,
  "daysOfWeek": [1, 2, 3, 4, 5],
  "endDate": "2024-12-31T00:00:00Z",
  "count": 10
}
```

### `metrics` (study_sessions)
```json
{
  "focus_score": 85,
  "completion_rate": 100,
  "distractions": 2,
  "notes": "Sesión productiva",
  "tags": ["matemáticas", "álgebra"]
}
```

### `preferred_time_blocks` (study_plans)
```json
[
  {
    "start": "09:00",
    "end": "11:00",
    "label": "Mañana"
  },
  {
    "start": "14:00",
    "end": "16:00",
    "label": "Tarde"
  }
]
```

## Servicios

### StudyPlannerService

Servicio principal para gestionar planes, preferencias, sesiones e integraciones.

**Ubicación:** `apps/web/src/features/study-planner/services/studyPlannerService.ts`

**Métodos principales:**
- `getStudyPlans(userId)`: Obtiene todos los planes del usuario
- `createStudyPlan(plan)`: Crea un nuevo plan
- `getStudySessions(userId, filters)`: Obtiene sesiones con filtros opcionales
- `createStudySession(session)`: Crea una nueva sesión
- `getLearningMetrics(userId)`: Calcula métricas de aprendizaje
- `getStudyHabitStats(userId)`: Calcula estadísticas de hábitos

### CalendarSyncService

Servicio para sincronizar sesiones con calendarios externos.

**Ubicación:** `apps/web/src/features/study-planner/services/calendarSyncService.ts`

**Métodos principales:**
- `createEvent(session, integration)`: Crea evento en calendario externo
- `updateEvent(session, integration)`: Actualiza evento existente
- `deleteEvent(session, integration)`: Elimina evento del calendario
- `syncAllSessions(userId)`: Sincroniza todas las sesiones

## API Endpoints

### Plans
- `GET /api/study-planner/plans` - Listar planes
- `POST /api/study-planner/plans` - Crear plan
- `GET /api/study-planner/plans/[id]` - Obtener plan
- `PUT /api/study-planner/plans/[id]` - Actualizar plan
- `DELETE /api/study-planner/plans/[id]` - Eliminar plan

### Preferences
- `GET /api/study-planner/preferences` - Obtener preferencias
- `POST /api/study-planner/preferences` - Crear/actualizar preferencias
- `PUT /api/study-planner/preferences` - Actualizar preferencias

### Sessions
- `GET /api/study-planner/sessions` - Listar sesiones (con filtros opcionales)
- `POST /api/study-planner/sessions` - Crear sesión
- `GET /api/study-planner/sessions/[id]` - Obtener sesión
- `PUT /api/study-planner/sessions/[id]` - Actualizar sesión
- `DELETE /api/study-planner/sessions/[id]` - Eliminar sesión

### Metrics
- `GET /api/study-planner/metrics?type=learning` - Métricas de aprendizaje
- `GET /api/study-planner/metrics?type=habits` - Estadísticas de hábitos

### Calendar Integrations
- `GET /api/study-planner/calendar-integrations` - Listar integraciones
- `POST /api/study-planner/calendar-integrations` - Crear/actualizar integración
- `DELETE /api/study-planner/calendar-integrations/[id]` - Eliminar integración
- `POST /api/study-planner/calendar-integrations/oauth/[provider]` - Iniciar OAuth
- `GET /api/study-planner/calendar-integrations/oauth/[provider]/callback` - Callback OAuth
- `GET /api/study-planner/calendar-integrations/export/ics` - Exportar ICS

## Configuración OAuth

### Google Calendar

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com/)
2. Habilitar Google Calendar API
3. Crear credenciales OAuth 2.0
4. Configurar redirect URI: `https://tu-dominio.com/api/study-planner/calendar-integrations/oauth/google/callback`
5. Agregar variables de entorno:
   ```
   GOOGLE_CLIENT_ID=tu_client_id
   GOOGLE_CLIENT_SECRET=tu_client_secret
   ```

### Microsoft Calendar

1. Registrar aplicación en [Azure Portal](https://portal.azure.com/)
2. Configurar permisos: `Calendars.ReadWrite`, `offline_access`
3. Configurar redirect URI: `https://tu-dominio.com/api/study-planner/calendar-integrations/oauth/microsoft/callback`
4. Agregar variables de entorno:
   ```
   MICROSOFT_CLIENT_ID=tu_client_id
   MICROSOFT_CLIENT_SECRET=tu_client_secret
   ```

### Apple Calendar

Apple Calendar no requiere OAuth. Se usa exportación ICS:
- Los usuarios pueden descargar un archivo `.ics`
- O suscribirse a una URL que genera eventos dinámicamente

## Componentes

### HabitConfigurator
Componente modal para configurar hábitos de estudio.

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `onSave`: (preferences) => Promise<void>
- `initialPreferences?`: Preferencias iniciales

### StudyCalendar
Componente de calendario usando FullCalendar.

**Props:**
- `sessions`: StudySession[]
- `onEventClick?`: (session) => void
- `onDateSelect?`: (start, end) => void
- `onEventDrop?`: (sessionId, newStart, newEnd) => void
- `loading?`: boolean

### LearningMetricsComponent
Componente para mostrar métricas y estadísticas.

**Props:**
- `metrics`: LearningMetrics
- `habitStats?`: StudyHabitStats
- `loading?`: boolean

### CalendarSyncSettings
Componente modal para gestionar sincronización con calendarios externos.

**Props:**
- `isOpen`: boolean
- `onClose`: () => void

## Hooks

### useStudyPlanner
Hook principal para gestionar el estado del planificador.

**Retorna:**
- Data: `plans`, `preferences`, `sessions`, `metrics`, `habitStats`
- Loading states: `plansLoading`, `sessionsLoading`, etc.
- Actions: `createPlan`, `updatePlan`, `createSession`, etc.

## Utilidades

### sessionGenerator
Utilidades para generar sesiones recurrentes.

**Funciones:**
- `generateSessionsFromPreferences(preferences, startDate, weeks)`: Genera sesiones desde preferencias
- `generateSessionsFromPlan(plan, startDate, endDate)`: Genera sesiones desde un plan
- `generateCustomTimeBlocks(startHour, endHour, durationMinutes)`: Genera bloques de tiempo personalizados

## Consideraciones de Seguridad

1. **Autenticación**: Todas las rutas API verifican autenticación usando `SessionService.getCurrentUser()`
2. **Autorización**: Los usuarios solo pueden acceder a sus propios datos (filtrado por `user_id`)
3. **Tokens OAuth**: Los tokens se almacenan encriptados en la base de datos
4. **Refresh Tokens**: Los tokens expirados se refrescan automáticamente

## Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# Microsoft OAuth (opcional)
MICROSOFT_CLIENT_ID=tu_microsoft_client_id
MICROSOFT_CLIENT_SECRET=tu_microsoft_client_secret
```

## Próximos Pasos

1. Implementar sincronización bidireccional completa (pull desde calendarios externos)
2. Agregar notificaciones antes de sesiones programadas
3. Implementar análisis de productividad más avanzado
4. Agregar integración con más proveedores de calendario
5. Implementar exportación de reportes de estudio

