Plan de Implementación: Planificador de Estudio con IA (Lia)
Resumen Ejecutivo
Implementaremos un sistema completo de planificación de estudio personalizado con IA que incluye:
Dual Mode: Manual y AI-generado (Lia)
Personalización Granular: Basada en rol profesional, tamaño de empresa, complejidad de cursos
Mejores Prácticas Científicas: Repetición espaciada, técnica Pomodoro, práctica distribuida
Sistema de Incentivos: Streaks, gamificación, calendario integrado
Fases de Implementación
FASE 0: Sistema de Estimación de Tiempos (Prerequisito) ⏱️ 1-2 semanas
Crítico: Bloquea todo lo demás Backend:
Modificar tabla lesson_activities:
Agregar campo estimated_time_minutes INTEGER NOT NULL CHECK (estimated_time_minutes >= 1)
Modificar tabla lesson_materials:
Agregar campo estimated_time_minutes INTEGER NOT NULL CHECK (estimated_time_minutes >= 1)
Crear tabla lesson_time_estimates:
Campos calculados para video, actividades, materiales, interacciones
Campo total_time_minutes generado automáticamente
Triggers para actualización automática
Crear función calculate_lesson_total_time(lesson_id) en Supabase
Script de migración para contenido existente:
Identificar lecciones sin tiempos estimados
Notificar a instructores
Dashboard de contenido incompleto
Frontend: 6. Actualizar Instructor Lesson Editor:
Agregar campos de tiempo en formularios de actividades/materiales
Validación en tiempo real (mínimo 1 minuto)
Preview de tiempo total de lección
Bloqueo de publicación si faltan tiempos
UI para mostrar ítems incompletos
API: 7. Endpoint GET /api/instructor/lessons/:id/time-completeness 8. Endpoint PATCH /api/instructor/activities/:id/estimated-time 9. Endpoint PATCH /api/instructor/materials/:id/estimated-time
FASE 1: Sistema de Disponibilidad y Complejidad 📊 2 semanas
Backend:
Crear servicios en apps/api/src/features/study-planner/:
availability-calculator.service.ts: Matriz rol × tamaño empresa
complexity-calculator.service.ts: Cálculo nivel × categoría
session-type.service.ts: Tipos de sesión (Short/Medium/Long)
Modificar tabla study_preferences:
Agregar preferred_session_type TEXT DEFAULT 'medium' CHECK (preferred_session_type IN ('short', 'medium', 'long'))
Modificar tabla study_plans:
Agregar generation_mode TEXT DEFAULT 'manual' CHECK (generation_mode IN ('manual', 'ai_generated'))
Agregar ai_generation_metadata JSONB DEFAULT '{}'
Agregar preferred_session_type TEXT DEFAULT 'medium'
Modificar tabla study_sessions:
Agregar lesson_id UUID REFERENCES course_lessons(lesson_id)
Agregar is_ai_generated BOOLEAN DEFAULT false
Agregar lesson_min_time_minutes INTEGER
Agregar session_type TEXT DEFAULT 'medium'
Agregar course_complexity JSONB DEFAULT '{}'
Frontend: 5. Crear componentes en apps/web/src/features/study-planner/components/:
SessionTypeSelector.tsx: Selector Short/Medium/Long
RoleAvailabilityDisplay.tsx: Muestra disponibilidad detectada
ComplexityIndicator.tsx: Indicador visual de complejidad
FASE 2: Modo Manual ✏️ 1-2 semanas
Frontend:
Crear páginas:
apps/web/src/app/study-planner/create/page.tsx
Modal de selección de modo (Manual vs AI)
Crear componentes del wizard manual:
ManualPlanWizard.tsx: Wizard principal
CourseSelector.tsx: Selección de cursos comprados
TimeConfigurationForm.tsx: Días, horas, duración
ValidationMessages.tsx: Validaciones en tiempo real
PlanPreview.tsx: Vista previa del plan
Implementar validación en tiempo real:
Duración sesión ≥ tiempo mínimo de lección
Mostrar warnings si no cumple
Backend: 4. API endpoints:
POST /api/study-planner/manual/create
POST /api/study-planner/manual/validate
GET /api/study-planner/available-courses
Crear manual-planner.service.ts:
createManualPlan(userId, config)
validateSessionTimes(lessons, sessionDuration)
generateManualSessions(plan, schedule)
FASE 3: Generación con IA (Lia) 🤖 3 semanas
Backend:
Crear servicios AI en apps/api/src/features/study-planner/:
ai-generator.service.ts: Lógica principal de generación
session-distributor.service.ts: Algoritmo de distribución
spaced-repetition.service.ts: Programación de revisiones
learning-optimizer.service.ts: Aplicación de mejores prácticas
Implementar algoritmo de generación:
Obtener perfil completo (rol, empresa, área, nivel, sector)
Calcular disponibilidad granular
Obtener cursos con complejidad
Ajustar duraciones por sesión type + complejidad
Distribuir lecciones con mejores prácticas:
Práctica distribuida (no cramming)
Interleaving (alternar cursos)
Pomodoro (20-50 min con breaks)
Repetición espaciada (1, 3, 7, 14, 30 días)
Generar sesiones en study_sessions
Crear función Supabase:
get_user_profile_complete(user_id): Profile completo con JOINs
get_purchased_courses_with_complexity(user_id): Cursos + complejidad
get_pending_lessons(user_id, course_id): Lecciones pendientes
API: 4. Endpoints:
POST /api/study-planner/ai/generate-plan
GET /api/study-planner/ai/preview
POST /api/study-planner/ai/regenerate
Frontend: 5. Crear flujo AI:
AIPlanGenerator.tsx: Componente principal
ProfileDisplay.tsx: Muestra perfil detectado
ComplexityAdjustmentPreview.tsx: Preview de ajustes
GenerationProgress.tsx: Loading con mensajes progresivos
GeneratedPlanReview.tsx: Revisión del plan con opciones (Accept/Adjust/Regenerate)
Estados de carga con mensajes:
"Analizando tus cursos..."
"Calculando complejidad..."
"Ajustando duraciones..."
"Aplicando técnicas de aprendizaje..."
"Optimizando horario..."
FASE 4: Dashboard y Sistema de Streaks 🔥 1 semana
Backend:
Crear streak.service.ts:
calculateCurrentStreak(userId)
updateStreak(userId, sessionCompleted)
checkStreakBreak(userId)
getLongestStreak(userId)
Endpoints:
GET /api/study-planner/streak
POST /api/study-planner/sessions/:id/complete
GET /api/study-planner/dashboard/stats
Frontend: 3. Crear páginas:
apps/web/src/app/study-planner/dashboard/page.tsx
Crear componentes:
StreakDisplay.tsx: 🔥 Contador de racha
DailyProgressCard.tsx: X/Y sesiones completadas
WeeklyProgressBar.tsx: Barra de progreso semanal
NextSessionCard.tsx: Próxima sesión destacada
CalendarView.tsx: Vista de calendario color-coded
StreakNotifications.tsx: Notificaciones de racha en riesgo
FASE 5: Integración de Calendario 📅 1-2 semanas
Backend:
Crear calendar-integration.service.ts:
OAuth2 para Google Calendar
OAuth2 para Microsoft Calendar
CalDAV para Apple Calendar
Crear calendar-sync.service.ts:
Sincronización bidireccional
Manejo de webhooks
Detección de conflictos
Crear ics-export.service.ts:
Exportación a formato ICS
Frontend: 4. Componentes:
CalendarIntegrationSettings.tsx: Configuración de calendarios
CalendarSyncStatus.tsx: Estado de sincronización
ICSExportButton.tsx: Botón de exportación
API: 5. Endpoints:
POST /api/calendar/connect/:provider (google/microsoft/apple)
POST /api/calendar/sync
GET /api/calendar/export/ics
POST /api/calendar/webhook (para sincronización bidireccional)
FASE 6: Página de Sesión 🎯 1 semana
Frontend:
Crear página:
apps/web/src/app/study-planner/session/[id]/page.tsx
Componentes:
SessionHeader.tsx: Info de sesión
LessonContent.tsx: Contenido de la lección
PomodoroTimer.tsx: Timer con técnica Pomodoro
SessionProgress.tsx: Barra de progreso
CompleteSessionButton.tsx: Botón para completar
SpacedRepetitionIndicator.tsx: Indicador si es revisión
FASE 7: Testing, Optimización y Lanzamiento 🚀 1-2 semanas
Testing:
Unit tests para todos los servicios críticos
Integration tests para flujos completos
E2E tests:
Flujo manual completo
Flujo AI completo
Completar sesión → actualizar streak
Sincronización de calendario
Optimización: 4. Indexar campos en BD:
lesson_time_estimates.lesson_id
study_sessions.user_id, plan_id, start_time
user_perfil.user_id, rol_id, tamano_id
Implementar caché:
Perfiles de rol (cambian raramente)
Tiempos de lecciones
Disponibilidades calculadas
Rate limiting en endpoint AI (prevenir abuso)
Considerar job queue para generación AI (Bull/BullMQ)
Monitoreo: 8. Implementar métricas:
Tiempo de generación AI (alertar si > 5s)
Tasa de errores de validación
Tasa de error de generación AI
Fallos de sincronización de calendario
Performance de queries BD
Documentación: 9. Documentar API endpoints 10. Guía de usuario 11. Documentación técnica para desarrolladores Lanzamiento: 12. Beta testing con usuarios selectos 13. Recopilación de feedback 14. Ajustes finales 15. Lanzamiento en producción
Métricas de Éxito
+40% tasa de completación de cursos
+60% consistencia de estudio (streaks)
-50% tiempo de configuración de plan
+30% satisfacción de usuario
Tasa de adopción AI vs Manual
Tasa de aceptación de plan AI
Adherencia al plan generado
Consideraciones Técnicas Críticas
Migración de Datos: Contenido existente sin tiempos estimados
Notificar instructores
Dashboard de contenido incompleto
NO usar valores por defecto
Performance:
Generación AI es computacionalmente costosa
Cachear cálculos de disponibilidad
Job queue para generaciones masivas
Seguridad:
Validar acceso solo a datos propios
Encriptar tokens OAuth
Rate limiting en endpoints críticos
Escalabilidad:
Connection pooling en BD
Cachear perfiles de rol
Optimizar queries con índices
Tiempo Total Estimado: 10-12 semanas