# Análisis de Estadísticas para Estructuras Jerárquicas

## 📋 Resumen Ejecutivo

Este documento analiza las estadísticas apropiadas para medir el progreso dentro de las estructuras jerárquicas (Región > Zona > Equipo) en la plataforma Aprende y Aplica. El objetivo es definir métricas relevantes, útiles y técnicamente viables para cada nivel jerárquico.

**Estado actual**: Las estadísticas actuales generan error 500 y son muy básicas (solo conteos). Necesitamos un sistema robusto que proporcione insights valiosos para la toma de decisiones.

---

## 🔍 Situación Actual

### Problemas Identificados

1. **Error 500 en endpoint de analytics**
   - Endpoint: `/api/business/hierarchy/analytics`
   - Función SQL: `get_hierarchy_analytics()` puede tener problemas de rendimiento o lógica
   - Las estadísticas actuales son muy limitadas

2. **Estadísticas básicas actuales** (`/api/business/hierarchy/stats`)
   - Solo conteos: regiones, zonas, equipos, usuarios asignados/no asignados
   - No incluyen métricas de aprendizaje
   - No muestran progreso ni rendimiento

3. **Falta de métricas contextuales**
   - No hay comparación entre entidades del mismo nivel
   - No se identifica el mejor rendimiento por nivel
   - No hay métricas de participación y engagement

---

## 📊 Datos Disponibles en la Base de Datos

### Tablas Principales para Estadísticas

#### 1. **Estructura Jerárquica**
- `organization_regions` - Regiones
- `organization_zones` - Zonas (pertenecen a regiones)
- `organization_teams` - Equipos (pertenecen a zonas)
- `organization_users` - Usuarios (pertenecen a equipos/zonas/regiones)

#### 2. **Aprendizaje y Progreso**
- `lesson_tracking` - Tracking de lecciones (status, tiempo, completado)
  - Campos clave: `status`, `t_lesson_minutes`, `completed_at`, `user_id`, `lesson_id`, `organization_id`
- `user_lesson_progress` - Progreso detallado por lección
  - Campos clave: `lesson_status`, `time_spent_minutes`, `is_completed`, `video_progress_percentage`, `quiz_progress_percentage`, `organization_id`
- `user_course_enrollments` - Inscripciones a cursos
  - Campos clave: `enrollment_status`, `overall_progress_percentage`, `completed_at`, `started_at`, `last_accessed_at`, `organization_id`
- `study_sessions` - Sesiones de estudio planificadas y completadas
  - Campos clave: `status`, `duration_minutes`, `actual_duration_minutes`, `completed_at`, `start_time`, `end_time`, `organization_id`
- `daily_progress` - Progreso diario de usuarios
  - Campos clave: `progress_date`, `sessions_completed`, `sessions_missed`, `study_minutes`, `had_activity`, `streak_count`, `organization_id`
- `user_streaks` - Rachas de estudio de usuarios
  - Campos clave: `current_streak`, `longest_streak`, `total_study_minutes`, `weekly_study_minutes`, `monthly_study_minutes`, `organization_id`
- `user_activity_log` - Log de actividades de usuarios
  - Campos clave: `action_type`, `action_timestamp`, `course_id`, `lesson_id`, `organization_id`

#### 3. **Asignaciones de Cursos**
- `hierarchy_course_assignments` - Asignaciones a entidades jerárquicas
  - Campos clave: `status`, `total_users`, `assigned_users_count`, `completed_users_count`, `due_date`
- `organization_course_assignments` - Asignaciones individuales a usuarios
  - Campos clave: `status`, `completion_percentage`, `due_date`, `completed_at`
- `region_course_assignments`, `zone_course_assignments`, `team_course_assignments` - Vínculos jerárquicos

#### 4. **Metadatos de Usuarios**
- `users` - Información básica (display_name, profile_picture_url, email, last_login_at)
- `user_perfil` - Perfil extendido (cargo_titulo, rol_id, nivel_id, area_id, sector_id, pais)

#### 5. **Analytics y Métricas Agregadas**
- `organization_analytics` - Analytics diarios de la organización
  - Campos clave: `date`, `total_users`, `active_users`, `courses_assigned`, `courses_completed`, `average_completion_rate`, `total_learning_hours`
  - Nota: Esta tabla puede ser útil para comparar con métricas jerárquicas actuales

---

## 🎯 Propuesta de Estadísticas por Nivel

---

## 📊 VISIÓN GENERAL DE ESTADÍSTICAS POR NIVEL

Esta sección organiza todas las estadísticas propuestas en una vista consolidada para implementación en las páginas de detalle de cada nivel jerárquico.

---

### Nivel 1: EQUIPO (Team)

El equipo es el nivel más granular. Aquí necesitamos métricas detalladas de cada miembro.

#### Estadísticas Básicas
- ✅ **Total de miembros** - Usuarios activos en el equipo
- ✅ **Miembros activos** - Usuarios con al menos 1 lección iniciada
- ✅ **Miembros inactivos** - Usuarios sin actividad reciente (últimos 30 días)

#### Métricas de Aprendizaje
- ✅ **Horas totales aprendidas** - Suma de `t_lesson_minutes` de lecciones completadas (de `lesson_tracking` con `status = 'completed'`)
- ✅ **Horas promedio por miembro** - Horas totales / miembros activos
- ✅ **Tasa de participación** - (Miembros activos / Total miembros) × 100
- ✅ **Progreso promedio de cursos** - Promedio de `overall_progress_percentage` de enrollments activos (de `user_course_enrollments`)
- ✅ **Cursos completados** - Total de cursos con `enrollment_status = 'completed'` (de `user_course_enrollments`)
- ✅ **Cursos en progreso** - Total de cursos con progreso > 0% y < 100% (de `user_course_enrollments`)
- ✅ **Cursos no iniciados** - Total de cursos asignados sin progreso
- ✅ **Lecciones completadas** - Total de lecciones con `is_completed = true` (de `user_lesson_progress`)
- ✅ **Tiempo promedio por sesión** - Promedio de `actual_duration_minutes` de sesiones completadas (de `study_sessions`)

#### Métricas de Asignaciones
- ✅ **Cursos asignados al equipo** - Total de `hierarchy_course_assignments` vinculados al equipo
- ✅ **Tasa de completitud de asignaciones** - (Cursos completados / Cursos asignados) × 100
- ✅ **Asignaciones vencidas** - Cursos con `due_date` pasado y no completados
- ✅ **Asignaciones próximas a vencer** - Cursos con `due_date` en los próximos 7 días

#### Top Performers
- ⭐ **Mejor empleado del equipo** - Usuario con más horas aprendidas
  - Incluir: nombre, avatar, horas totales, cursos completados
- ⭐ **Empleado más activo** - Usuario con más lecciones completadas recientemente
- ⭐ **Empleado más rápido** - Usuario que completa cursos más rápido (promedio)

#### Métricas de Engagement
- ✅ **Días activos promedio** - Promedio de días únicos con actividad en último mes (usando `daily_progress.had_activity`)
- ✅ **Racha de estudio promedio** - Promedio de `current_streak` de miembros (de `user_streaks`)
- ✅ **Racha más larga del equipo** - Mayor `longest_streak` entre miembros
- ✅ **Sesiones completadas** - Total de sesiones completadas (de `study_sessions` con `status = 'completed'`)
- ✅ **Sesiones perdidas** - Total de sesiones perdidas (de `daily_progress.sessions_missed`)
- ✅ **Última actividad** - Fecha de última actividad del equipo (de `user_activity_log.action_timestamp`)

---

### 📋 RESUMEN: Estadísticas para Vista General del EQUIPO

**Sección: Métricas Principales (Cards Superiores)**
1. **Tasa de Finalización** - `avg_completion` % (Promedio)
2. **Horas de Aprendizaje** - `total_hours` h (Total Acumulado)
3. **Usuarios Activos** - `active_learners` de `total_members`
4. **Tasa de Participación** - `(active_learners / total_members) × 100` %
5. **Cursos Completados** - `courses_completed` cursos
6. **Tasa de Completitud de Asignaciones** - `(courses_completed / courses_assigned) × 100` %

**Sección: Top Performer**
- ⭐ **Mejor Empleado del Equipo**
  - Nombre, avatar
  - Horas totales aprendidas
  - Cursos completados
  - Tasa de completitud personal

**Sección: Métricas Detalladas (Grid Expandible)**
- **Aprendizaje:**
  - Horas promedio por miembro
  - Lecciones completadas
  - Progreso promedio de cursos
  - Cursos en progreso
  - Cursos no iniciados
  
- **Asignaciones:**
  - Cursos asignados al equipo
  - Asignaciones vencidas
  - Asignaciones próximas a vencer (7 días)
  
- **Engagement:**
  - Días activos promedio
  - Racha de estudio promedio
  - Racha más larga del equipo
  - Sesiones completadas
  - Sesiones perdidas
  - Última actividad

**Sección: Gráfico de Actividad**
- Gráfico de actividad semanal (últimos 7 días)
- Datos en tiempo real

---

### Nivel 2: ZONA (Zone)

La zona agrupa varios equipos. Aquí necesitamos métricas agregadas y comparativas.

#### Estadísticas Básicas
- ✅ **Total de equipos** - Equipos activos en la zona
- ✅ **Total de miembros** - Suma de miembros de todos los equipos
- ✅ **Equipos activos** - Equipos con al menos 1 miembro activo
- ✅ **Equipos inactivos** - Equipos sin actividad reciente

#### Métricas de Aprendizaje (Agregadas)
- ✅ **Horas totales aprendidas** - Suma de horas de todos los equipos
- ✅ **Horas promedio por equipo** - Horas totales / número de equipos
- ✅ **Horas promedio por miembro** - Horas totales / total de miembros
- ✅ **Tasa de participación general** - (Miembros activos totales / Total miembros) × 100
- ✅ **Progreso promedio de cursos** - Promedio ponderado del progreso de todos los equipos
- ✅ **Cursos completados totales** - Suma de cursos completados en todos los equipos
- ✅ **Tasa de completitud** - (Cursos completados / Cursos asignados) × 100

#### Métricas de Asignaciones
- ✅ **Cursos asignados a la zona** - Total de asignaciones jerárquicas a la zona
- ✅ **Tasa de completitud de asignaciones** - Porcentaje de asignaciones completadas
- ✅ **Asignaciones vencidas** - Total de asignaciones vencidas en la zona
- ✅ **Distribución de asignaciones** - Cursos asignados por equipo

#### Top Performers
- ⭐ **Mejor equipo de la zona** - Equipo con más horas aprendidas
  - Incluir: nombre del equipo, horas totales, miembros activos, tasa de completitud
- ⭐ **Equipo más eficiente** - Equipo con mejor tasa de completitud
- ⭐ **Equipo más activo** - Equipo con mayor tasa de participación

#### Comparativas
- 📊 **Ranking de equipos** - Lista ordenada por rendimiento (horas, completitud, participación)
- 📊 **Distribución de rendimiento** - Gráfico de distribución de horas por equipo
- 📊 **Equipos destacados** - Top 3 equipos por diferentes métricas

---

### 📋 RESUMEN: Estadísticas para Vista General de la ZONA

**Sección: Métricas Principales (Cards Superiores)**
1. **Tasa de Finalización** - `avg_completion` % (Promedio General)
2. **Horas de Aprendizaje** - `total_hours` h (Total Acumulado)
3. **Usuarios Activos** - `active_members` de `total_members`
4. **Equipos Activos** - `active_teams` de `total_teams`
5. **Tasa de Participación** - `(active_members / total_members) × 100` %
6. **Tasa de Completitud** - `(courses_completed / courses_assigned) × 100` %

**Sección: Top Performer**
- ⭐ **Mejor Equipo de la Zona**
  - Nombre del equipo
  - Horas totales aprendidas
  - Miembros activos
  - Tasa de completitud

**Sección: Métricas Detalladas (Grid Expandible)**
- **Aprendizaje:**
  - Horas promedio por equipo
  - Horas promedio por miembro
  - Progreso promedio de cursos
  - Cursos completados totales
  
- **Asignaciones:**
  - Cursos asignados a la zona
  - Tasa de completitud de asignaciones
  - Asignaciones vencidas
  - Distribución de asignaciones por equipo
  
- **Comparativas:**
  - Ranking de equipos (Top 5)
  - Equipos destacados (Top 3 por diferentes métricas)

**Sección: Gráfico de Actividad**
- Gráfico de actividad semanal (últimos 7 días)
- Comparativa entre equipos

---

### Nivel 3: REGIÓN (Region)

La región agrupa varias zonas. Aquí necesitamos métricas de alto nivel y tendencias.

#### Estadísticas Básicas
- ✅ **Total de zonas** - Zonas activas en la región
- ✅ **Total de equipos** - Suma de equipos de todas las zonas
- ✅ **Total de miembros** - Suma de miembros de toda la región
- ✅ **Zonas activas** - Zonas con al menos 1 equipo activo
- ✅ **Zonas inactivas** - Zonas sin actividad reciente

#### Métricas de Aprendizaje (Agregadas)
- ✅ **Horas totales aprendidas** - Suma de horas de todas las zonas
- ✅ **Horas promedio por zona** - Horas totales / número de zonas
- ✅ **Horas promedio por equipo** - Horas totales / total de equipos
- ✅ **Horas promedio por miembro** - Horas totales / total de miembros
- ✅ **Tasa de participación general** - (Miembros activos totales / Total miembros) × 100
- ✅ **Progreso promedio de cursos** - Promedio ponderado del progreso de todas las zonas
- ✅ **Cursos completados totales** - Suma de cursos completados en toda la región
- ✅ **Tasa de completitud general** - (Cursos completados / Cursos asignados) × 100

#### Métricas de Asignaciones
- ✅ **Cursos asignados a la región** - Total de asignaciones jerárquicas a la región
- ✅ **Tasa de completitud de asignaciones** - Porcentaje de asignaciones completadas
- ✅ **Asignaciones vencidas** - Total de asignaciones vencidas en la región
- ✅ **Distribución de asignaciones** - Cursos asignados por zona

#### Top Performers
- ⭐ **Mejor zona de la región** - Zona con más horas aprendidas
  - Incluir: nombre de la zona, horas totales, equipos activos, tasa de completitud
- ⭐ **Zona más eficiente** - Zona con mejor tasa de completitud
- ⭐ **Zona más activa** - Zona con mayor tasa de participación

#### Comparativas y Tendencias
- 📊 **Ranking de zonas** - Lista ordenada por rendimiento
- 📊 **Distribución de rendimiento** - Gráfico de distribución de horas por zona
- 📊 **Zonas destacadas** - Top 3 zonas por diferentes métricas
- 📈 **Tendencia de horas** - Evolución de horas aprendidas (últimos 3 meses)
- 📈 **Tendencia de participación** - Evolución de tasa de participación

---

### 📋 RESUMEN: Estadísticas para Vista General de la REGIÓN

**Sección: Métricas Principales (Cards Superiores)**
1. **Tasa de Finalización** - `avg_completion` % (Promedio General)
2. **Horas de Aprendizaje** - `total_hours` h (Total Acumulado)
3. **Usuarios Activos** - `active_members` de `total_members`
4. **Zonas Activas** - `active_zones` de `total_zones`
5. **Equipos Activos** - `active_teams` de `total_teams`
6. **Tasa de Participación** - `(active_members / total_members) × 100` %
7. **Tasa de Completitud General** - `(courses_completed / courses_assigned) × 100` %

**Sección: Top Performer**
- ⭐ **Mejor Zona de la Región**
  - Nombre de la zona
  - Horas totales aprendidas
  - Equipos activos
  - Tasa de completitud

**Sección: Métricas Detalladas (Grid Expandible)**
- **Aprendizaje:**
  - Horas promedio por zona
  - Horas promedio por equipo
  - Horas promedio por miembro
  - Progreso promedio de cursos
  - Cursos completados totales
  
- **Asignaciones:**
  - Cursos asignados a la región
  - Tasa de completitud de asignaciones
  - Asignaciones vencidas
  - Distribución de asignaciones por zona
  
- **Comparativas:**
  - Ranking de zonas (Top 5)
  - Zonas destacadas (Top 3 por diferentes métricas)

**Sección: Tendencias**
- 📈 **Gráfico de Tendencia de Horas** - Evolución últimos 3 meses
- 📈 **Gráfico de Tendencia de Participación** - Evolución últimos 3 meses
- 📊 **Gráfico de Actividad Semanal** - Comparativa entre zonas

---

## 🎨 Visualización Propuesta

### Para Equipos
```
┌─────────────────────────────────────────────────────────┐
│  📊 Métricas Principales                                │
├─────────────────────────────────────────────────────────┤
│  [Tasa Finalización] [Horas Aprendizaje] [Usuarios]   │
│     67% (Promedio)    245.5h (Total)    10 de 12       │
│                                                         │
│  [Participación] [Cursos Completados] [Completitud]   │
│     83%              8 cursos           67%             │
├─────────────────────────────────────────────────────────┤
│  ⭐ Mejor Empleado del Equipo                           │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 👤 Juan Pérez                                    │  │
│  │ ⏱️  45.2 horas | 📚 5 cursos | ✅ 89% completitud │  │
│  └─────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  📈 Métricas Detalladas                                │
│  • Horas promedio: 24.6h/miembro                      │
│  • Lecciones completadas: 156                         │
│  • Cursos en progreso: 4                              │
│  • Asignaciones vencidas: 2                            │
│  • Días activos promedio: 18 días                      │
│  • Racha promedio: 5 días                              │
│  • Última actividad: Hace 2 horas                      │
├─────────────────────────────────────────────────────────┤
│  📊 Gráfico de Actividad Semanal                      │
│  [Gráfico de barras - últimos 7 días]                  │
└─────────────────────────────────────────────────────────┘
```

### Para Zonas
```
┌─────────────────────────────────────────────────────────┐
│  📊 Métricas Principales                                │
├─────────────────────────────────────────────────────────┤
│  [Tasa Finalización] [Horas Aprendizaje] [Usuarios]   │
│     72% (Promedio)    1,234.5h (Total)   38 de 48      │
│                                                         │
│  [Equipos Activos] [Participación] [Completitud]      │
│     4 de 5           79%              72%             │
├─────────────────────────────────────────────────────────┤
│  🏆 Mejor Equipo de la Zona                            │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🏢 Equipo Alpha                                  │  │
│  │ ⏱️  312.3 horas | 👥 10 activos | ✅ 85%         │  │
│  └─────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  📈 Métricas Detalladas                                │
│  • Horas promedio por equipo: 246.9h                   │
│  • Horas promedio por miembro: 25.7h                   │
│  • Cursos completados: 42                              │
│  • Asignaciones vencidas: 3                            │
├─────────────────────────────────────────────────────────┤
│  📊 Ranking de Equipos (Top 5)                         │
│  1. Equipo Alpha - 312.3h (85% completitud)          │
│  2. Equipo Beta - 289.1h (78% completitud)           │
│  3. Equipo Gamma - 245.5h (67% completitud)          │
│  4. Equipo Delta - 198.2h (72% completitud)          │
│  5. Equipo Epsilon - 189.4h (65% completitud)         │
├─────────────────────────────────────────────────────────┤
│  📊 Gráfico de Actividad Semanal                      │
│  [Gráfico comparativo entre equipos]                  │
└─────────────────────────────────────────────────────────┘
```

### Para Regiones
```
┌─────────────────────────────────────────────────────────┐
│  📊 Métricas Principales                                │
├─────────────────────────────────────────────────────────┤
│  [Tasa Finalización] [Horas Aprendizaje] [Usuarios]   │
│     68% (Promedio)    5,678.9h (Total)   95 de 120      │
│                                                         │
│  [Zonas Activas] [Equipos Activos] [Participación]    │
│     3 de 3           12 de 15         79%             │
│                                                         │
│  [Completitud General]                                 │
│     68%                                               │
├─────────────────────────────────────────────────────────┤
│  🏆 Mejor Zona de la Región                            │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🌍 Zona Norte                                      │  │
│  │ ⏱️  2,345.6 horas | 🏢 5 equipos | ✅ 75%         │  │
│  └─────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  📈 Métricas Detalladas                                │
│  • Horas promedio por zona: 1,892.9h                  │
│  • Horas promedio por equipo: 378.6h                  │
│  • Horas promedio por miembro: 47.3h                  │
│  • Cursos completados: 156                             │
│  • Asignaciones vencidas: 8                            │
├─────────────────────────────────────────────────────────┤
│  📊 Ranking de Zonas (Top 5)                           │
│  1. Zona Norte - 2,345.6h (75% completitud)          │
│  2. Zona Sur - 1,987.2h (68% completitud)             │
│  3. Zona Centro - 1,346.1h (62% completitud)         │
├─────────────────────────────────────────────────────────┤
│  📈 Tendencias (últimos 3 meses)                      │
│  [Gráfico de línea - Horas aprendidas]                │
│  ↗️  +15% horas aprendidas                              │
│  [Gráfico de línea - Tasa de participación]           │
│  ↗️  +8% participación                                 │
├─────────────────────────────────────────────────────────┤
│  📊 Gráfico de Actividad Semanal                      │
│  [Gráfico comparativo entre zonas]                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Consideraciones Técnicas

### Rendimiento

1. **Caché de estadísticas**
   - Calcular estadísticas en background (cron job)
   - Almacenar en tabla `hierarchy_analytics_cache` con TTL
   - Actualizar cada hora o cuando haya cambios significativos
   - Considerar usar `organization_analytics` como referencia para métricas agregadas

2. **Índices necesarios**
   ```sql
   -- Índices para consultas de estadísticas jerárquicas
   CREATE INDEX idx_org_users_team_status 
     ON organization_users(team_id, status) 
     WHERE status = 'active';
   
   CREATE INDEX idx_org_users_zone_status 
     ON organization_users(zone_id, status) 
     WHERE status = 'active';
   
   CREATE INDEX idx_org_users_region_status 
     ON organization_users(region_id, status) 
     WHERE status = 'active';
   
   CREATE INDEX idx_lesson_tracking_user_status_org 
     ON lesson_tracking(user_id, status, organization_id) 
     WHERE status = 'completed';
   
   CREATE INDEX idx_lesson_tracking_org_completed 
     ON lesson_tracking(organization_id, status, completed_at) 
     WHERE status = 'completed';
   
   CREATE INDEX idx_enrollments_user_status_org 
     ON user_course_enrollments(user_id, enrollment_status, organization_id);
   
   CREATE INDEX idx_daily_progress_user_date_org 
     ON daily_progress(user_id, progress_date, organization_id);
   
   CREATE INDEX idx_study_sessions_user_status_org 
     ON study_sessions(user_id, status, organization_id) 
     WHERE status = 'completed';
   
   CREATE INDEX idx_user_activity_log_user_timestamp_org 
     ON user_activity_log(user_id, action_timestamp, organization_id);
   ```

3. **Consultas optimizadas**
   - Usar CTEs (Common Table Expressions) para cálculos complejos
   - Agregar datos en SQL en lugar de procesar en aplicación
   - Limitar rangos de fechas para consultas históricas

### Estructura de Datos

```typescript
interface TeamStatistics {
  // Básicas
  total_members: number;
  active_members: number;
  inactive_members: number;
  
  // Aprendizaje
  total_hours: number;
  avg_hours_per_member: number;
  participation_rate: number;
  avg_course_progress: number;
  courses_completed: number;
  courses_in_progress: number;
  courses_not_started: number;
  
  // Asignaciones
  courses_assigned: number;
  assignment_completion_rate: number;
  assignments_overdue: number;
  assignments_due_soon: number;
  
  // Top Performers
  top_performer: {
    id: string;
    name: string;
    avatar?: string;
    hours: number;
    courses_completed: number;
  };
  
  // Engagement
  avg_active_days: number;
  avg_streak: number;
  last_activity: string;
}

interface ZoneStatistics {
  // Básicas
  total_teams: number;
  total_members: number;
  active_teams: number;
  inactive_teams: number;
  
  // Aprendizaje (agregado)
  total_hours: number;
  avg_hours_per_team: number;
  avg_hours_per_member: number;
  participation_rate: number;
  avg_course_progress: number;
  courses_completed: number;
  completion_rate: number;
  
  // Asignaciones
  courses_assigned: number;
  assignment_completion_rate: number;
  assignments_overdue: number;
  
  // Top Performers
  top_team: {
    id: string;
    name: string;
    hours: number;
    active_members: number;
    completion_rate: number;
  };
  
  // Comparativas
  team_ranking: Array<{
    id: string;
    name: string;
    hours: number;
    completion_rate: number;
    participation_rate: number;
  }>;
}

interface RegionStatistics {
  // Básicas
  total_zones: number;
  total_teams: number;
  total_members: number;
  active_zones: number;
  inactive_zones: number;
  
  // Aprendizaje (agregado)
  total_hours: number;
  avg_hours_per_zone: number;
  avg_hours_per_team: number;
  avg_hours_per_member: number;
  participation_rate: number;
  avg_course_progress: number;
  courses_completed: number;
  completion_rate: number;
  
  // Asignaciones
  courses_assigned: number;
  assignment_completion_rate: number;
  assignments_overdue: number;
  
  // Top Performers
  top_zone: {
    id: string;
    name: string;
    hours: number;
    active_teams: number;
    completion_rate: number;
  };
  
  // Comparativas
  zone_ranking: Array<{
    id: string;
    name: string;
    hours: number;
    completion_rate: number;
    participation_rate: number;
  }>;
  
  // Tendencias
  trends: {
    hours_last_3_months: Array<{ month: string; hours: number }>;
    participation_last_3_months: Array<{ month: string; rate: number }>;
  };
}
```

---

## 📝 Próximos Pasos

### Fase 1: Análisis y Diseño ✅
- [x] Documentar situación actual
- [x] Identificar datos disponibles
- [x] Definir estadísticas por nivel
- [x] Diseñar estructura de datos

### Fase 2: Implementación Backend
- [ ] Crear/actualizar función SQL `get_hierarchy_analytics`
- [ ] Optimizar consultas con índices
- [ ] Implementar caché de estadísticas
- [ ] Crear endpoint `/api/business/hierarchy/[entityType]/[entityId]/stats`

### Fase 3: Implementación Frontend
- [ ] Crear componentes de visualización de estadísticas
- [ ] Integrar en páginas de detalle (región, zona, equipo)
- [ ] Agregar gráficos y visualizaciones
- [ ] Implementar comparativas y rankings

### Fase 4: Testing y Optimización
- [ ] Probar con datos reales
- [ ] Optimizar rendimiento
- [ ] Validar cálculos
- [ ] Documentar uso

---

## 🎯 Métricas Clave (KPIs)

### Para Equipos
1. **Tasa de Participación** - % de miembros activos
2. **Horas por Miembro** - Eficiencia de aprendizaje
3. **Tasa de Completitud** - % de cursos completados
4. **Cumplimiento de Asignaciones** - % de asignaciones completadas a tiempo

### Para Zonas
1. **Rendimiento Agregado** - Horas totales aprendidas
2. **Distribución de Rendimiento** - Variabilidad entre equipos
3. **Equipo Top** - Identificar mejores prácticas
4. **Tasa de Completitud General** - Eficiencia de la zona

### Para Regiones
1. **Rendimiento Regional** - Horas totales aprendidas
2. **Tendencias** - Evolución en el tiempo
3. **Zona Top** - Identificar mejores prácticas
4. **Participación General** - Engagement de la región

---

## 📚 Referencias

- Documentación del sistema jerárquico: `docs/HIERARCHY_SYSTEM.md`
- Endpoint actual de estadísticas: `apps/web/src/app/api/business/hierarchy/stats/route.ts`
- Endpoint de analytics: `apps/web/src/app/api/business/hierarchy/analytics/route.ts`
- Función SQL actual: `supabase/migrations/20260109_hierarchy_analytics.sql`

---

**Última actualización**: 2026-01-11  
**Versión**: 1.0  
**Estado**: Análisis completo - Listo para implementación

