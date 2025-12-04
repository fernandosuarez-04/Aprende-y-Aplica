# 📋 ESTADO DE IMPLEMENTACIÓN: Planificador de Estudio con IA

**Estado actual:** Fase 5 COMPLETADA ✅
**Última actualización:** 2025-01-18
**Proyecto:** Aprende y Aplica - Study Planner

---

## 📊 RESUMEN EJECUTIVO

### Progreso General
- ✅ **FASE 0**: Sistema de Estimación de Tiempos - 100% COMPLETADA
- ✅ **FASE 1**: Disponibilidad y Complejidad - 100% COMPLETADA
- ✅ **FASE 2**: Modo Manual - 100% COMPLETADA
- ✅ **FASE 3**: Generación con IA - 100% COMPLETADA
- ✅ **FASE 4**: Streaks y Dashboard - 100% COMPLETADA
- ✅ **FASE 5**: Integración de Calendarios - 100% COMPLETADA
- ⏸️ **FASE 6**: Página de Sesión - 0% PENDIENTE
- ⏸️ **FASE 7**: Testing y Optimización - 0% PENDIENTE

### Métricas de Código
- **SQL**: ~1,870 líneas (migraciones + funciones + triggers + vistas)
- **TypeScript Backend**: ~3,650 líneas (servicios + algoritmos + tipos)
- **TypeScript Frontend**: ~12,170 líneas (componentes + wizard + páginas + tipos + helpers)
- **API Endpoints**: ~2,010 líneas
- **Documentación**: ~1,900 líneas

**Total: ~21,600 líneas de código productivo**

---

## ✅ FASES COMPLETADAS

### FASE 0: Sistema de Estimación de Tiempos

**Archivos Creados:**
- `scripts/supabase/001-study-planner-phase-0-lesson-times.sql` (370 líneas)
- `apps/web/src/lib/supabase/study-planner-types.ts` (810 líneas)
- `docs/INSTRUCTOR-GUIDE-TIME-ESTIMATES.md` (500 líneas)

**UI Modificada:**
- `apps/web/src/features/admin/components/ActivityModal.tsx`
- `apps/web/src/features/admin/components/MaterialModal.tsx`

**Features:** ✅ Tiempo estimado en actividades/materiales ✅ Cálculo automático por lección ✅ Triggers y vistas

### FASE 1: Disponibilidad y Complejidad

**Archivos Creados:**
- `scripts/supabase/002-study-planner-phase-1-preferences-plans-sessions.sql` (550 líneas)
- `apps/api/src/features/study-planner/availability-calculator.service.ts` (530 líneas)
- `apps/api/src/features/study-planner/complexity-calculator.service.ts` (280 líneas)
- `apps/web/src/features/study-planner/components/SessionTypeSelector.tsx` (180 líneas)
- `apps/web/src/features/study-planner/components/AvailabilityDisplay.tsx` (150 líneas)
- `apps/web/src/features/study-planner/components/ComplexityBadge.tsx` (120 líneas)

**Features:** ✅ Matriz 5×4 disponibilidad ✅ Cálculo complejidad cursos ✅ Componentes UI reutilizables

### FASE 2: Modo Manual

**Archivos Creados:**
- `apps/web/src/features/study-planner/types/manual-wizard.types.ts` (280 líneas)
- `apps/web/src/features/study-planner/components/CourseSelector.tsx` (235 líneas)
- `apps/web/src/features/study-planner/components/ScheduleConfiguration.tsx` (250 líneas)
- `apps/web/src/features/study-planner/components/PlanPreview.tsx` (247 líneas)
- `apps/web/src/features/study-planner/components/ValidationMessages.tsx` (180 líneas)
- `apps/web/src/features/study-planner/components/ManualPlanWizard.tsx` (520 líneas)
- `apps/web/src/features/study-planner/components/ModeSelectionModal.tsx` (280 líneas)
- `apps/web/src/app/study-planner/create/page.tsx` (200 líneas)
- `apps/api/src/features/study-planner/manual-plan.service.ts` (380 líneas)
- `apps/api/src/features/study-planner/manual-wizard.types.ts` (140 líneas)
- `apps/api/src/features/study-planner/study-planner-types.ts` (100 líneas)
- `apps/web/src/app/api/study-planner/manual/preview/route.ts`
- `apps/web/src/app/api/study-planner/manual/create/route.ts`

**Features:** ✅ Wizard 4 pasos ✅ Validación tiempo real ✅ Preview antes de crear ✅ Distribución inteligente

---

## ✅ FASE 3: Generación con IA (100% COMPLETADA)

### ✅ Backend Completado

**Archivos Creados:**
1. `apps/web/src/features/study-planner/types/ai-wizard.types.ts` (420 líneas)
   - AIWizardStep (5 pasos)
   - LearningGoal, LearningPace, PriorityFocus
   - AIAvailabilityConfig
   - PreferencesConfiguration
   - AIPlanPreview con metadata
   - AIOptimizationInsight
   - Helper functions y constantes

2. `apps/api/src/features/study-planner/ai-wizard.types.ts` (200 líneas)
   - Tipos compartidos backend
   - Request/Response interfaces

3. `apps/api/src/features/study-planner/ai-distribution.algorithm.ts` (350 líneas)
   - **Clase AIDistributionAlgorithm**
   - distributeSessionsWithAI() - Algoritmo principal
   - orderLessons() - 4 estrategias:
     - Sequential
     - Interleaved
     - Difficulty-based
     - AI-optimized
   - addSpacedRepetitionReviews() - Repetición espaciada (1, 3, 7, 14, 30 días)
   - optimizeDistribution() - Load balancing

4. `apps/api/src/features/study-planner/ai-plan.service.ts` (480 líneas)
   - **Clase AIPlanService**
   - generatePreview() - Preview con IA
   - createAIPlan() - Creación de plan
   - generateAIMetadata() - Metadata y scores
   - calculateRetentionScore() - Score 0-100
   - calculateCompletionScore() - Score 0-100
   - generateInsights() - Tips y recomendaciones

5. `apps/web/src/app/api/study-planner/ai/preview/route.ts`
   - Endpoint POST /api/study-planner/ai/preview

6. `apps/web/src/app/api/study-planner/ai/create/route.ts`
   - Endpoint POST /api/study-planner/ai/create

**Algoritmo IA - Técnicas Implementadas:**
✅ Spaced Repetition (curva de Ebbinghaus)
✅ Interleaving (alterna entre cursos)
✅ Load Balancing (máx 2 sesiones/día)
✅ Difficulty Progression
✅ Complexity Adaptation
✅ Pomodoro Integration
✅ Optimization Scores (retention, completion, balance)

### ✅ Frontend Completado

**Componentes Creados:**

1. ✅ **GoalsConfiguration.tsx** (300 líneas)
   - Paso 1 del wizard IA
   - Grid de cards para primary_goal (6 opciones con iconos y descripciones)
   - Date picker para target_completion_date (opcional)
   - Radio buttons para learning_pace (relaxed/moderate/intensive)
   - Radio buttons para priority_focus (completion/retention/balanced)
   - Slider opcional para daily_study_goal_minutes
   - Dark mode support

2. ✅ **AIAvailabilityConfig.tsx** (330 líneas)
   - Paso 2 del wizard IA
   - Display de availability auto-calculada (desde Fase 1)
   - Toggle para habilitar manual_override
   - Manual override con day selector y time slots
   - Daily minutes slider con indicador visual
   - Soporte para 1-3 time slots por día

3. ✅ **PreferencesConfig.tsx** (350 líneas)
   - Paso 3 del wizard IA
   - Selector de session_type_preference (reutiliza SessionTypeSelector)
   - Selector de review_strategy con explicaciones científicas (spaced_repetition, massed_practice, mixed)
   - Selector de content_ordering con ejemplos visuales (sequential, interleaved, difficulty_based, ai_optimized)
   - Pomodoro settings con work/break duration configurable
   - Reminders config con enable toggle y minutes_before
   - Session rescheduling toggle

4. ✅ **AICourseSelector.tsx** (290 líneas)
   - Paso 4 del wizard IA
   - Search functionality integrada
   - Course selection con checkboxes
   - Priority selector por curso (high/medium/low) con badges de colores
   - Progress indicators por curso
   - Complexity badges integrados
   - Summary stats (X cursos seleccionados)

5. ✅ **AIPlanPreview.tsx** (320 líneas)
   - Paso 5 del wizard IA
   - Sección AI Metadata con:
     - Algorithm version badge
     - Techniques applied (chips con iconos)
     - Scores visualization con circular progress (retention, completion, balance)
     - Reasoning text explanation
   - Sección Optimization Insights:
     - InsightCard component con categorías (info/tip/warning)
     - Iconos y mensajes personalizados
   - Reutiliza PlanPreview para detalles de sesiones
   - Custom action buttons (Regenerar/Ajustar/Crear)

6. ✅ **AIWizard.tsx** (420 líneas)
   - Orquestador principal wizard IA
   - 5 pasos de configuración (goals, availability, preferences, courses, preview)
   - Progress indicator visual con números de paso
   - Navegación entre pasos con validación
   - Estado global: AIWizardState con todas las configuraciones
   - Llamadas a /api/study-planner/ai/preview y /create
   - Loading states con indicadores visuales
   - Error handling completo
   - Auto-generación de preview al entrar al paso 5

7. ✅ **Integración en create/page.tsx**
   - Conditional render basado en selectedMode
   - Si mode === 'ai_generated': render <AIWizard />
   - Si mode === 'manual': render <ManualPlanWizard />
   - Compartidos availableCourses entre ambos wizards
   - Handlers de onComplete y onCancel

8. ✅ **Exports actualizados en index.ts**
   - Todos los 6 componentes exportados correctamente
   - Organizados en sección "Phase 3 Components (AI Wizard)"

**Tiempo Invertido Frontend:**
- GoalsConfiguration: 2 horas
- AIAvailabilityConfig: 2.5 horas
- PreferencesConfig: 3 horas
- AICourseSelector: 2 horas
- AIPlanPreview: 3.5 horas
- AIWizard: 4 horas
- Integración: 1 hora
- **Total:** ~18 horas

---

## ✅ FASE 4: Streaks y Dashboard (100% COMPLETADA)

### ✅ Backend Completado

**Archivos Creados:**

1. `scripts/supabase/003-study-planner-phase-4-streaks.sql` (530 líneas)
   - Modificación de tabla study_sessions (completed_at, actual_duration_minutes, notes, self_evaluation)
   - Tabla user_streaks (current_streak, longest_streak, stats totales/semanales/mensuales)
   - Tabla daily_progress (progreso diario para heatmap)
   - Función update_user_streak() con trigger automático
   - Función get_dashboard_stats() que retorna JSON completo
   - Vista study_plan_progress
   - Índices optimizados para queries de dashboard

2. `apps/web/src/features/study-planner/types/streak.types.ts` (350 líneas)
   - Tipos completos: UserStreak, DailyProgress, SessionCompletion
   - DashboardStats con todas las estadísticas
   - Helper functions: formatStudyTime, calculateHeatmapLevel, getStreakMotivationMessage
   - Funciones de conversión y cálculo de datos

3. `apps/api/src/features/study-planner/streak.service.ts` (350 líneas)
   - Clase StreakService con todos los métodos
   - completeSession() - Completa sesión y actualiza streak
   - markSessionAsMissed() - Marca sesión como perdida
   - rescheduleSession() - Reprograma sesiones
   - getDashboardStats() - Stats completas del dashboard
   - getUserStreak() - Obtiene racha del usuario
   - getDailyProgress() - Progreso diario últimos N días

**Features Backend:**
✅ Sistema de streaks automático con triggers
✅ Tracking de sesiones completadas/perdidas/reprogramadas
✅ Cálculo de stats semanales y mensuales
✅ Progreso diario para heatmap
✅ Función SQL optimizada que retorna todo en un query

### ✅ API Endpoints Completados

**Archivos Creados:**

1. `apps/web/src/app/api/study-planner/dashboard/stats/route.ts` (60 líneas)
   - GET /api/study-planner/dashboard/stats
   - Retorna todas las estadísticas del dashboard
   - Normaliza datos vacíos

2. `apps/web/src/app/api/study-planner/streak/route.ts` (55 líneas)
   - GET /api/study-planner/streak
   - Obtiene el streak del usuario

3. `apps/web/src/app/api/study-planner/sessions/[id]/complete/route.ts` (100 líneas)
   - POST /api/study-planner/sessions/[id]/complete
   - Completa sesión con duración, notas y evaluación
   - Actualiza streak automáticamente

4. `apps/web/src/app/api/study-planner/sessions/[id]/reschedule/route.ts` (90 líneas)
   - POST /api/study-planner/sessions/[id]/reschedule
   - Reprograma sesión a nueva fecha/hora

**Features API:**
✅ Autenticación con SessionService
✅ Validaciones de datos completas
✅ Error handling robusto
✅ Response types tipados

### ✅ Frontend Components Completados

**Archivos Creados:**

1. ✅ **StreakDisplay.tsx** (180 líneas)
   - Muestra racha actual y más larga
   - Indicador de riesgo (si no hay sesión ayer)
   - Mensaje de motivación dinámico
   - Progreso hacia próximos hitos (3, 7, 14, 30, 60, 100 días)
   - Badges de logros alcanzados
   - Animaciones y dark mode

2. ✅ **DailyProgressCard.tsx** (160 líneas)
   - Progreso de sesiones del día (completadas/pendientes)
   - Barra de progreso con colores según %
   - Tiempo de estudio vs meta (opcional)
   - Mini stats cards (completadas, pendientes, estudiado)
   - Mensajes motivacionales contextuales

3. ✅ **WeeklyProgressBar.tsx** (200 líneas)
   - Gráfico de barras de la semana (Dom-Sáb)
   - Altura proporcional a minutos estudiados
   - Tooltips con detalle al hover
   - Indicador de día actual
   - Stats semanales: sesiones, tiempo total, promedio diario
   - Mensaje de felicitación si 5+ días activos

4. ✅ **NextSessionCard.tsx** (180 líneas)
   - Card de sesión próxima con toda la info
   - Indicador "Pronto" si falta <30 mins
   - Badges por tipo de sesión (aprendizaje/repaso/práctica)
   - Botones: Iniciar sesión / Reprogramar
   - Componente NextSessionsList para múltiples sesiones
   - Empty state cuando no hay sesiones

5. ✅ **CalendarView.tsx** (280 líneas)
   - Heatmap de 12 meses de actividad
   - Grid de semanas por mes
   - 5 niveles de intensidad (0-4) por color
   - Tooltips interactivos al hover
   - Click en día para ver detalle
   - Leyenda de colores
   - Stats totales: días activos, tiempo total, sesiones
   - Dark mode completo

6. ✅ **Dashboard Page** (320 líneas)
   - `apps/web/src/app/study-planner/dashboard/page.tsx`
   - Layout responsivo 3 columnas (lg), 1 en mobile
   - Integración de todos los componentes
   - Loading y error states
   - Carga de datos desde API
   - Handlers para iniciar/reprogramar sesiones
   - Quick actions: crear plan, ver planes, explorar cursos
   - Stats del mes card
   - Heatmap full-width
   - Lista expandida si hay >3 sesiones próximas

**Features Frontend:**
✅ 5 componentes de dashboard completamente funcionales
✅ Página principal de dashboard integrada
✅ Estados de loading/error manejados
✅ Dark mode en todos los componentes
✅ Responsive design completo
✅ Animaciones y transitions suaves
✅ Tooltips interactivos
✅ Exports actualizados en index.ts

**Tiempo Invertido Fase 4:**
- SQL migrations y triggers: 1.5 horas
- Backend services + API endpoints: 3.5 horas
- Frontend components: 7 horas
- Dashboard page + integration: 2 horas
- **Total:** ~14 horas

---

---

## ✅ FASE 5: Integración de Calendarios (100% COMPLETADA)

### ✅ Backend Completado

**Archivos Creados:**

1. `scripts/supabase/004-study-planner-phase-5-calendar-subscription-tokens.sql` (220 líneas)
   - Tabla calendar_subscription_tokens (UUID tokens para ICS)
   - Función get_or_create_subscription_token(p_user_id)
   - Función regenerate_subscription_token(p_user_id)
   - Función update_token_usage(p_token)
   - Vista user_calendar_subscriptions
   - Índices optimizados

2. `apps/web/src/features/study-planner/services/calendarSyncService.ts` (585 líneas)
   - Clase CalendarSyncService completa
   - getUserTimezone() - Obtiene timezone desde preferencias → browser → UTC fallback
   - createEvent() - Crea eventos en calendarios externos
   - updateEvent() - Actualiza eventos existentes
   - deleteEvent() - Elimina eventos de calendarios
   - syncAllSessions() - Sincroniza todas las sesiones
   - ensureValidToken() - Refresh automático de tokens
   - createGoogleEvent() - Google Calendar API integration
   - updateGoogleEvent() - Actualiza eventos en Google
   - deleteGoogleEvent() - Elimina eventos de Google
   - createMicrosoftEvent() - Microsoft Graph API integration
   - updateMicrosoftEvent() - Actualiza eventos en Microsoft
   - deleteMicrosoftEvent() - Elimina eventos de Microsoft
   - refreshToken() - Refresh de access tokens OAuth

**Features Backend:**
✅ OAuth 2.0 completo (Google Calendar + Microsoft Calendar)
✅ Token refresh automático con verificación de expiración
✅ Sincronización unidireccional (App → Calendarios)
✅ ICS subscription endpoint con tokens UUID
✅ Timezone dinámico desde preferencias del usuario
✅ Error handling robusto con logging detallado

**Nota Importante:** No se implementó sync bidireccional (webhooks) porque **no es compatible con Netlify** (plataforma de deployment). La sincronización es **unidireccional (App → Calendarios)** usando REST API únicamente.

### ✅ API Endpoints Completados

**Archivos Creados:**

1. `apps/web/src/app/api/study-planner/calendar-integrations/oauth/google/route.ts` (90 líneas)
   - GET: Inicia flujo OAuth con Google Calendar
   - Genera authorization_url y state para seguridad

2. `apps/web/src/app/api/study-planner/calendar-integrations/oauth/google/callback/route.ts` (130 líneas)
   - GET: Callback de Google OAuth
   - Intercambia authorization code por access_token y refresh_token
   - Guarda integración en calendar_integrations table

3. `apps/web/src/app/api/study-planner/calendar-integrations/oauth/microsoft/route.ts` (90 líneas)
   - GET: Inicia flujo OAuth con Microsoft Calendar

4. `apps/web/src/app/api/study-planner/calendar-integrations/oauth/microsoft/callback/route.ts` (130 líneas)
   - GET: Callback de Microsoft OAuth
   - Integración con Microsoft Graph API

5. `apps/web/src/app/api/study-planner/calendar-integrations/route.ts` (60 líneas)
   - GET: Lista todas las integraciones del usuario
   - Incluye estado de conexión y fecha de última sincronización

6. `apps/web/src/app/api/study-planner/calendar-integrations/disconnect/route.ts` (50 líneas)
   - POST: Desconecta calendario externo
   - Elimina integración de la base de datos

7. `apps/web/src/app/api/study-planner/calendar-integrations/verify/route.ts` (80 líneas)
   - GET: Verifica estado de tokens
   - Intenta refresh si están expirados

8. `apps/web/src/app/api/study-planner/calendar-integrations/export-ics/route.ts` (100 líneas)
   - GET: Exporta todas las sesiones en formato ICS
   - Descarga directa del archivo .ics

9. `apps/web/src/app/api/study-planner/calendar-integrations/subscribe/ics/[token]/route.ts` (180 líneas)
   - GET: Endpoint público de suscripción ICS
   - Autenticación mediante token UUID (sin cookies)
   - Genera calendario dinámico con todas las sesiones futuras
   - VCALENDAR 2.0 format con VEVENT y VALARM
   - Headers para no-cache (actualizaciones automáticas)

10. `apps/web/src/app/api/study-planner/calendar-integrations/subscription-token/route.ts` (90 líneas)
    - GET: Obtiene o crea token de suscripción para el usuario
    - POST: Regenera token (invalida URL anterior)

**Features API:**
✅ OAuth flow completo (authorization + callback)
✅ Autenticación con SessionService
✅ Validaciones de datos completas
✅ Error handling robusto
✅ Token-based authentication para ICS subscription (sin cookies)
✅ Response types tipados

### ✅ Frontend Components Completados

**Archivos Creados:**

1. ✅ **CalendarSyncSettings.tsx** (400 líneas)
   - Modal completo para gestión de calendarios
   - OAuth flow para Google Calendar
   - OAuth flow para Microsoft Calendar
   - Desconexión de calendarios
   - Exportación ICS (descarga directa)
   - Suscripción ICS (copia URL al portapapeles)
   - Generación automática de subscription tokens
   - Loading states y manejo de errores
   - Dark mode support
   - Responsive design

**Features Frontend:**
✅ Integración completa con OAuth providers
✅ Estados de conexión visuales
✅ Botones de acción contextuales (Conectar/Desconectar)
✅ Copy-to-clipboard para URL de suscripción
✅ Mensajes de ayuda para Apple Calendar
✅ Error handling con mensajes user-friendly
✅ Dark mode en todos los componentes
✅ Responsive design completo

### ✅ Integración en Dashboard

**Archivo Modificado:**
- `apps/web/src/app/study-planner/dashboard/page.tsx`
  - Botón "📅 Sincronizar calendarios" en Quick Actions
  - State management para modal
  - CalendarSyncSettings modal integrado

**Features Dashboard:**
✅ Acceso rápido a sincronización de calendarios
✅ Modal integrado en dashboard principal
✅ Flujo completo sin salir del dashboard

### ✅ Documentación de Variables de Entorno

**Archivo Modificado:**
- `.env.example`
  - Sección completa "INTEGRACIÓN DE CALENDARIOS"
  - Instrucciones detalladas para obtener Google OAuth credentials
  - Instrucciones para Microsoft Azure credentials
  - URLs de callbacks correctas
  - Scopes requeridos documentados

**Tiempo Invertido Fase 5:**
- SQL migrations y funciones: 1.5 horas
- Backend services (CalendarSyncService): 3 horas
- OAuth setup + API endpoints: 4 horas
- ICS subscription endpoint: 2 horas
- Frontend components (CalendarSyncSettings): 3 horas
- Timezone corrections: 1 hora
- Dashboard integration + testing: 1.5 horas
- Documentación: 1 hora
- **Total:** ~17 horas

---

## ⏸️ FASES PENDIENTES (RESUMEN)

### FASE 6: Página de Sesión (~15-18 horas)
- Timer Pomodoro funcional
- Tracking de sesión
- Notas y autoevaluación
- Completar sesión

### FASE 7: Testing y Optimización (~10-12 horas)
- Tests unitarios e integración
- Tests E2E
- Performance optimization
- Documentación final

**Total Restante:** ~75-88 horas

---

## 🚀 PUNTO DE RETOMA EXACTO

**FASE 4 COMPLETADA ✅**

**Si continúas con FASE 5 (Integración de Calendarios):**

### Próximo Paso: OAuth y Calendar Sync

**1. Instalar dependencias:**
```bash
npm install google-auth-library @microsoft/microsoft-graph-client ical.js --workspace=apps/api
```

**2. Configurar OAuth providers:**
- Google Calendar API (OAuth 2.0)
- Microsoft Graph API (Azure AD)
- Apple Calendar (CalDAV)

**3. Crear servicios de integración:**
- `apps/api/src/features/study-planner/calendar-sync.service.ts`
- `apps/api/src/features/study-planner/calendar-providers/`
  - `google-calendar.provider.ts`
  - `microsoft-calendar.provider.ts`
  - `apple-calendar.provider.ts`

### Archivos a Crear (Fase 5):
1. OAuth setup y config
2. Calendar sync service (bidireccional)
3. ICS export/import
4. Conflict resolution logic
5. UI components para OAuth flow
6. Settings page para calendar integrations

### Estimación Fase 5:
- OAuth setup: 3 horas
- Calendar providers: 6 horas
- Sync service: 5 horas
- ICS export/import: 3 horas
- UI components: 4 horas
- **Total:** ~21 horas

---

## 📂 ESTRUCTURA COMPLETA DE ARCHIVOS

### Backend (apps/api/src/features/study-planner/)
```
study-planner/
├── availability-calculator.service.ts (530 líneas) ✅
├── complexity-calculator.service.ts (280 líneas) ✅
├── manual-plan.service.ts (380 líneas) ✅
├── manual-wizard.types.ts (140 líneas) ✅
├── study-planner-types.ts (100 líneas) ✅
├── ai-distribution.algorithm.ts (350 líneas) ✅
├── ai-plan.service.ts (480 líneas) ✅
├── ai-wizard.types.ts (200 líneas) ✅
└── streak.service.ts (350 líneas) ✅
```

### Frontend Components (apps/web/src/features/study-planner/)
```
study-planner/
├── components/
│   ├── SessionTypeSelector.tsx (180 líneas) ✅
│   ├── AvailabilityDisplay.tsx (150 líneas) ✅
│   ├── ComplexityBadge.tsx (120 líneas) ✅
│   ├── CourseSelector.tsx (235 líneas) ✅
│   ├── ScheduleConfiguration.tsx (250 líneas) ✅
│   ├── PlanPreview.tsx (247 líneas) ✅
│   ├── ValidationMessages.tsx (180 líneas) ✅
│   ├── ManualPlanWizard.tsx (520 líneas) ✅
│   ├── ModeSelectionModal.tsx (280 líneas) ✅
│   ├── GoalsConfiguration.tsx (300 líneas) ✅
│   ├── AIAvailabilityConfig.tsx (330 líneas) ✅
│   ├── PreferencesConfig.tsx (350 líneas) ✅
│   ├── AICourseSelector.tsx (290 líneas) ✅
│   ├── AIPlanPreview.tsx (320 líneas) ✅
│   ├── AIWizard.tsx (420 líneas) ✅
│   ├── StreakDisplay.tsx (180 líneas) ✅
│   ├── DailyProgressCard.tsx (160 líneas) ✅
│   ├── WeeklyProgressBar.tsx (200 líneas) ✅
│   ├── NextSessionCard.tsx (180 líneas) ✅
│   ├── CalendarView.tsx (280 líneas) ✅
│   ├── CalendarSyncSettings.tsx (400 líneas) ✅
│   └── index.ts ✅
├── services/
│   └── calendarSyncService.ts (585 líneas) ✅
└── types/
    ├── manual-wizard.types.ts (280 líneas) ✅
    ├── ai-wizard.types.ts (420 líneas) ✅
    └── streak.types.ts (350 líneas) ✅
```

### API Endpoints (apps/web/src/app/api/study-planner/)
```
api/study-planner/
├── manual/
│   ├── preview/route.ts ✅
│   └── create/route.ts ✅
├── ai/
│   ├── preview/route.ts ✅
│   └── create/route.ts ✅
├── dashboard/
│   └── stats/route.ts (60 líneas) ✅
├── streak/
│   └── route.ts (55 líneas) ✅
├── sessions/[id]/
│   ├── complete/route.ts (100 líneas) ✅
│   └── reschedule/route.ts (90 líneas) ✅
└── calendar-integrations/
    ├── route.ts (60 líneas) ✅
    ├── disconnect/route.ts (50 líneas) ✅
    ├── verify/route.ts (80 líneas) ✅
    ├── export-ics/route.ts (100 líneas) ✅
    ├── subscription-token/route.ts (90 líneas) ✅
    ├── subscribe/ics/[token]/route.ts (180 líneas) ✅
    └── oauth/
        ├── google/
        │   ├── route.ts (90 líneas) ✅
        │   └── callback/route.ts (130 líneas) ✅
        └── microsoft/
            ├── route.ts (90 líneas) ✅
            └── callback/route.ts (130 líneas) ✅
```

### Pages
```
study-planner/
├── create/
│   └── page.tsx (220 líneas) ✅
└── dashboard/
    └── page.tsx (320 líneas) ✅
```

### SQL Scripts
```
supabase/
├── 001-study-planner-phase-0-lesson-times.sql (370 líneas) ✅
├── 002-study-planner-phase-1-preferences-plans-sessions.sql (550 líneas) ✅
├── 003-study-planner-phase-4-streaks.sql (530 líneas) ✅
└── 004-study-planner-phase-5-calendar-subscription-tokens.sql (220 líneas) ✅
```

---

## 📈 PROGRESO Y ESTIMACIONES

### Tiempo Invertido
- FASE 0: 6 horas ✅
- FASE 1: 6 horas ✅
- FASE 2: 8 horas ✅
- FASE 3 (backend): 8 horas ✅
- FASE 3 (frontend): 18 horas ✅
- FASE 4: 14 horas ✅
- FASE 5: 17 horas ✅
- **Total:** ~77 horas

### Tiempo Restante
- FASE 6: ~15-18 horas ⏸️
- FASE 7: ~10-12 horas ⏸️
- **Total:** ~25-30 horas

### Progreso General
**77 de ~102-107 horas = 72-75% completado**

---

## ✅ CHECKLIST RÁPIDO

### ✅ Completado
- [x] Sistema de estimación de tiempos
- [x] Matriz de disponibilidad 5×4
- [x] Cálculo de complejidad de cursos
- [x] Wizard manual completo (4 pasos)
- [x] API manual (preview + create)
- [x] Algoritmo de IA (spaced repetition, interleaving, load balancing)
- [x] Servicio backend de IA
- [x] API de IA (preview + create)
- [x] Tipos TypeScript completos (manual + IA)
- [x] GoalsConfiguration component
- [x] AIAvailabilityConfig component
- [x] PreferencesConfig component
- [x] AICourseSelector component
- [x] AIPlanPreview component
- [x] AIWizard orchestrator
- [x] Integración en create/page.tsx
- [x] Exports actualizados en index.ts

### ✅ Fase 5 - Integración de Calendarios (100% Completada)
- [x] OAuth setup (Google/Microsoft) ✅
- [x] Calendar providers implementation (Google/Microsoft) ✅
- [x] Calendar sync service (unidireccional: app → calendarios) ✅
- [x] ICS export functionality ✅
- [x] ICS subscription endpoint ✅
- [x] ICS subscription tokens (UUID-based, sin cookies) ✅
- [x] Timezone dinámico desde preferencias del usuario ✅
- [x] UI components para OAuth flow ✅
- [x] CalendarSyncSettings modal completo ✅
- [x] Sincronización en create/update/complete/reschedule ✅
- [x] Token refresh automático ✅
- [x] Dashboard integration (botón Quick Actions) ✅
- [x] Documentación de variables de entorno ✅
- [x] SQL migrations y funciones ✅

**Nota:** No se implementó sync bidireccional (webhooks) porque no es compatible con Netlify (plataforma serverless). La sincronización unidireccional (App → Calendarios) usando REST API es suficiente para el caso de uso.

### ⏸️ Pendiente Futuro (Fases 6-7)
- [ ] Página de sesión con Pomodoro
- [ ] Timer funcional
- [ ] Tracking de sesión en tiempo real
- [ ] Notas y autoevaluación
- [ ] Tests completos (unitarios, integración, E2E)
- [ ] Optimización de performance
- [ ] Documentación final

---

## 🔗 RECURSOS

### Documentación Interna
- `docs/PRD-PLANIFICADOR-ESTUDIO-IA.md` - PRD original
- `docs/STUDY-PLANNER-PROGRESS.md` - Progreso detallado
- `docs/INSTRUCTOR-GUIDE-TIME-ESTIMATES.md` - Guía instructores
- `CLAUDE.md` - Instrucciones del proyecto

### Stack Técnico
- Frontend: Next.js 15.5.4, React 19, TypeScript 5.9
- Backend: Next.js API Routes
- Database: PostgreSQL (Supabase)
- UI: TailwindCSS 3.4, Radix UI
- Auth: Supabase Auth

---

**ÚLTIMA ACTUALIZACIÓN:** 2025-01-18
**FASE ACTUAL:** FASE 5 COMPLETADA ✅ - Integración de Calendarios (100%)
**PRÓXIMO PASO:** Iniciar FASE 6 - Página de Sesión con Timer Pomodoro

**Notas de Fase 5:**
- ✅ Sincronización unidireccional (App → Calendarios) completamente funcional
- ✅ OAuth 2.0 con Google Calendar y Microsoft Calendar
- ✅ ICS subscription con tokens UUID
- ✅ Timezone dinámico desde preferencias del usuario
- ⚠️ No se implementó sync bidireccional (webhooks) por incompatibilidad con Netlify (serverless)

Este documento es el punto de referencia único para retomar el desarrollo. Actualizar al completar tareas.
