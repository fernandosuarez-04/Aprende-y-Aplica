# 📍 Guía de Implementación - Beneficios de Planes

Este documento lista todas las rutas, archivos y ubicaciones donde se implementaron las funcionalidades de los planes Team, Business y Enterprise.

---

## 🎯 Resumen de Implementación

**Total de Funcionalidades Implementadas:** 9 de 12 (75%)

### ✅ Completadas:
1. Mensajería en asignación de cursos
2. Grupos de usuarios personalizados
3. Branding corporativo completo
4. Actualización de tablas comparativas
5. Skills Insights y gaps de conocimiento
6. Análisis de cursos individuales
7. Dashboard personalizable
8. Notificaciones automáticas
9. Certificados personalizados

### ⏳ Pendientes:
1. Integración con Zoom/Google Meet
2. SSO empresarial
3. API de datos

---

## 📂 Estructura de Implementación

### 1️⃣ Mensajería en Asignación de Cursos

#### Frontend:
- **Componente:** `apps/web/src/features/business-panel/components/BusinessAssignCourseModal.tsx`
  - Campo de mensaje personalizado agregado
  - Textarea con límite de 500 caracteres
  - Previsualización del mensaje

#### Backend:
- **API:** `apps/web/src/app/api/business/courses/[id]/assign/route.ts`
  - Endpoint actualizado para recibir y guardar `message`
  - Validación de mensaje opcional

#### Base de Datos:
- **Migración:** `Nueva carpeta/migrations/add_message_to_course_assignments.sql`
- **Tabla modificada:** `organization_course_assignments`
  - Nueva columna: `message` (text, nullable)

#### Acceso:
- **Ruta:** Panel de Negocios → Cursos → Asignar Curso → Modal de Asignación
- **URL relativa:** `/business-panel/courses/[id]` → Botón "Asignar Curso"

---

### 2️⃣ Grupos de Usuarios Personalizados

#### Frontend:
- **Servicio:** `apps/web/src/features/business-panel/services/userGroups.service.ts`
  - Clase `UserGroupsService` con métodos para CRUD de grupos
  - Interfaces TypeScript: `UserGroup`, `UserGroupMember`, etc.

#### Backend:
- **API Principal:** `apps/web/src/app/api/business/user-groups/route.ts`
  - GET: Listar todos los grupos de la organización
  - POST: Crear nuevo grupo

- **API por ID:** `apps/web/src/app/api/business/user-groups/[id]/route.ts`
  - GET: Obtener grupo por ID
  - PUT: Actualizar grupo
  - DELETE: Eliminar grupo

- **API de Miembros:** `apps/web/src/app/api/business/user-groups/[id]/members/route.ts`
  - GET: Listar miembros del grupo
  - POST: Agregar miembros al grupo

- **API Eliminar Miembro:** `apps/web/src/app/api/business/user-groups/[id]/members/[memberId]/route.ts`
  - DELETE: Remover miembro del grupo

#### Base de Datos:
- **Migración:** `Nueva carpeta/migrations/add_user_groups_tables.sql`
- **Tablas creadas:**
  - `user_groups` (id, organization_id, name, description, created_at, updated_at)
  - `user_group_members` (id, group_id, user_id, assigned_at)

#### Acceso:
- **Ruta:** APIs REST disponibles (componente UI pendiente de integración)
- **URL base:** `/api/business/user-groups`

---

### 3️⃣ Branding Corporativo Completo

#### Frontend:
- **Componente:** `apps/web/src/features/business-panel/components/BusinessSettings.tsx`
  - Nueva tab "Branding" agregada
  - Componente `BrandingTab` con editor completo

#### Backend:
- **API:** `apps/web/src/app/api/business/settings/branding/route.ts`
  - GET: Obtener configuración de branding
  - PUT: Actualizar configuración de branding

#### Base de Datos:
- **Migración:** `Nueva carpeta/migrations/add_branding_to_organizations.sql`
- **Tabla modificada:** `organizations`
  - Nuevas columnas:
    - `brand_color_primary` (varchar, default: '#3b82f6')
    - `brand_color_secondary` (varchar, default: '#10b981')
    - `brand_color_accent` (varchar, default: '#8b5cf6')
    - `brand_font_family` (varchar, default: 'Inter')
    - `brand_logo_url` (text, nullable)
    - `brand_favicon_url` (text, nullable)

#### Acceso:
- **Ruta:** Panel de Negocios → Configuración → Tab "Branding"
- **URL relativa:** `/business-panel/settings` → Tab "Branding"

---

### 4️⃣ Actualización de Tablas Comparativas

#### Frontend:
- **Componente:** `apps/web/src/features/business-panel/components/BusinessSubscriptionPlans.tsx`
  - Sección "Integraciones" reemplazada por "Notificaciones y Automatización"
  - Beneficios adicionales agregados a todos los planes
  - Precios actualizados para Team y Business

#### Cambios Principales:
- **Sección eliminada:** "Integraciones"
- **Sección nueva:** "Notificaciones y Automatización"
- **Beneficios agregados:**
  - Team: "50 certificados/mes", "Plantillas de reportes"
  - Business: "AI Coach para equipos", "White-label parcial", "Recordatorios automáticos", "Benchmarking"
  - Enterprise: Múltiples beneficios adicionales

#### Acceso:
- **Ruta:** Panel de Negocios → Configuración → Suscripción → "Cambiar de Plan"
- **URL relativa:** `/business-panel/settings` → Tab "Suscripción" → Botón "Cambiar de Plan"

---

### 5️⃣ Skills Insights y Gaps de Conocimiento

#### Frontend:
- **Componente:** `apps/web/src/features/business-panel/components/BusinessAnalytics.tsx`
  - Nueva tab "Skills Insights" agregada
  - Componente `SkillsTab` con análisis completo

#### Backend:
- **API:** `apps/web/src/app/api/business/analytics/skills/route.ts`
  - GET: Análisis de habilidades y gaps
  - Query params opcionales: `user_id` (para análisis individual)

#### Funcionalidades:
- Análisis de habilidades aprendidas vs requeridas por rol
- Identificación de gaps de conocimiento
- Recomendaciones de cursos para cerrar gaps
- Gráficas de top skills faltantes y aprendidas
- Tabla de gaps por usuario con cobertura

#### Acceso:
- **Ruta:** Panel de Negocios → Analytics → Tab "Skills Insights"
- **URL relativa:** `/business-panel/analytics` → Tab "Skills Insights"

---

### 6️⃣ Análisis de Cursos Individuales

#### Frontend:
- **Componente:** `apps/web/src/features/business-panel/components/CourseAnalyticsTab.tsx`
  - Componente completo para análisis de cursos
- **Página:** `apps/web/src/app/business-panel/courses/[id]/page.tsx`
  - Nueva tab "Analytics" agregada al detalle del curso

#### Backend:
- **API:** `apps/web/src/app/api/business/courses/[id]/analytics/route.ts`
  - GET: Métricas detalladas del curso

#### Métricas Incluidas:
- **Stats:** Total asignados, completados, en progreso, no iniciados, progreso promedio, tiempo promedio, tasa de completación
- **Engagement:** Total sesiones, duración promedio, tasa de retención, aprendices activos
- **Performance:** Rating promedio, total reseñas, tiempo promedio de completación
- **Visualizaciones:** Distribución de progreso (gráfica de pastel), puntos de abandono (gráfica de barras)

#### Acceso:
- **Ruta:** Panel de Negocios → Cursos → [Seleccionar Curso] → Tab "Analytics"
- **URL relativa:** `/business-panel/courses/[id]` → Tab "Analytics"

---

### 7️⃣ Dashboard Personalizable

#### Frontend:
- **Componente:** `apps/web/src/features/business-panel/components/CustomDashboard.tsx`
  - Sistema de drag & drop (requiere react-grid-layout si está disponible)
  - Widgets predefinidos: stats, users, courses, activity
  - Modo edición/vista previa
  - Agregar/eliminar widgets

#### Backend:
- **API:** `apps/web/src/app/api/business/dashboard/layout/route.ts`
  - GET: Obtener layout personalizado
  - POST: Guardar layout personalizado
  - DELETE: Eliminar layout (restaurar por defecto)

#### Base de Datos:
- **Migración:** `Nueva carpeta/migrations/add_dashboard_layouts_table.sql`
- **Tabla creada:** `dashboard_layouts`
  - Campos: id, organization_id, name, layout_config (jsonb), is_default, created_at, updated_at

#### Acceso:
- **Ruta:** Componente disponible (pendiente integración en página principal)
- **URL base API:** `/api/business/dashboard/layout`

---

### 8️⃣ Notificaciones Automáticas

#### Frontend:
- **Componente:** `apps/web/src/features/business-panel/components/BusinessNotificationsSettings.tsx`
  - Configuración completa de notificaciones por evento
- **Integración:** `apps/web/src/features/business-panel/components/BusinessSettings.tsx`
  - Nueva tab "Notificaciones" agregada

#### Backend:
- **API:** `apps/web/src/app/api/business/notifications/settings/route.ts`
  - GET: Obtener configuración de notificaciones
  - PUT: Actualizar configuración de notificaciones

#### Eventos Configurables:
1. Curso asignado (`course_assigned`)
2. Curso completado (`course_completed`)
3. Usuario agregado (`user_added`)
4. Hito de progreso (`progress_milestone`)
5. Certificado generado (`certificate_generated`)
6. Fecha límite próxima (`deadline_approaching`)

#### Canales por Plan:
- **Team:** Email únicamente
- **Business:** Email + Push notifications
- **Enterprise:** Email + Push + SMS

#### Base de Datos:
- **Migración:** `Nueva carpeta/migrations/add_notification_settings_table.sql`
- **Tabla creada:** `notification_settings`
  - Campos: id, organization_id, event_type, enabled, channels (jsonb), template, created_at, updated_at

#### Acceso:
- **Ruta:** Panel de Negocios → Configuración → Tab "Notificaciones"
- **URL relativa:** `/business-panel/settings` → Tab "Notificaciones"

---

### 9️⃣ Certificados Personalizados

#### Frontend:
- **Componente:** `apps/web/src/features/business-panel/components/BusinessCertificateCustomizer.tsx`
  - Editor visual de templates de certificados
  - Vista previa en tiempo real
  - Configuración de colores, fuentes, elementos visibles
- **Integración:** `apps/web/src/features/business-panel/components/BusinessSettings.tsx`
  - Nueva tab "Certificados" agregada

#### Backend:
- **API:** `apps/web/src/app/api/business/certificates/templates/route.ts`
  - GET: Listar templates de certificados
  - POST: Crear nuevo template
  - PUT: Actualizar template (query param: `id`)
  - DELETE: Eliminar template (query param: `id`)

#### Funcionalidades:
- Crear/editar/eliminar templates
- Personalizar colores (principal, secundario, texto, fondo)
- Seleccionar fuentes (título y cuerpo)
- Configurar elementos visibles (logo, firma, fecha, código)
- URLs de logo y firma
- Vista previa interactiva
- Marcar template como por defecto

#### Base de Datos:
- **Migración:** `Nueva carpeta/migrations/add_certificate_templates_table.sql`
- **Tabla creada:** `certificate_templates`
  - Campos: id, organization_id, name, description, design_config (jsonb), is_default, is_active, created_at, updated_at
- **Tabla modificada:** `user_course_certificates`
  - Nueva columna: `template_id` (uuid, FK a certificate_templates)

#### Acceso:
- **Ruta:** Panel de Negocios → Configuración → Tab "Certificados"
- **URL relativa:** `/business-panel/settings` → Tab "Certificados"

---

## 🗂️ Estructura de Archivos

### Migraciones SQL
Todas las migraciones están en: `Nueva carpeta/migrations/`

1. `add_message_to_course_assignments.sql`
2. `add_user_groups_tables.sql`
3. `add_branding_to_organizations.sql`
4. `add_dashboard_layouts_table.sql`
5. `add_notification_settings_table.sql`
6. `add_certificate_templates_table.sql`

### Componentes Frontend
Ubicación: `apps/web/src/features/business-panel/components/`

1. `BusinessAssignCourseModal.tsx` (modificado)
2. `BusinessSettings.tsx` (modificado)
3. `BusinessSubscriptionPlans.tsx` (modificado)
4. `BusinessAnalytics.tsx` (modificado)
5. `CourseAnalyticsTab.tsx` (nuevo)
6. `CustomDashboard.tsx` (nuevo)
7. `BusinessNotificationsSettings.tsx` (nuevo)
8. `BusinessCertificateCustomizer.tsx` (nuevo)

### Servicios Frontend
Ubicación: `apps/web/src/features/business-panel/services/`

1. `userGroups.service.ts` (nuevo)

### APIs Backend
Ubicación: `apps/web/src/app/api/business/`

1. `courses/[id]/assign/route.ts` (modificado)
2. `courses/[id]/analytics/route.ts` (nuevo)
3. `user-groups/route.ts` (nuevo)
4. `user-groups/[id]/route.ts` (nuevo)
5. `user-groups/[id]/members/route.ts` (nuevo)
6. `user-groups/[id]/members/[memberId]/route.ts` (nuevo)
7. `settings/branding/route.ts` (nuevo)
8. `analytics/skills/route.ts` (nuevo)
9. `dashboard/layout/route.ts` (nuevo)
10. `notifications/settings/route.ts` (nuevo)
11. `certificates/templates/route.ts` (nuevo)

### Páginas Frontend
Ubicación: `apps/web/src/app/business-panel/`

1. `courses/[id]/page.tsx` (modificado - agregada tab Analytics)
2. `analytics/page.tsx` (existe - usa BusinessAnalytics)
3. `settings/page.tsx` (existe - usa BusinessSettings)

---

## 🔗 Rutas de Acceso Completa

### Panel de Negocios
**Base URL:** `/business-panel`

#### Configuración
- **URL:** `/business-panel/settings`
- **Tabs disponibles:**
  - `/business-panel/settings` → Tab "Datos de la Empresa"
  - `/business-panel/settings` → Tab "Suscripción"
  - `/business-panel/settings` → Tab "Branding"
  - `/business-panel/settings` → Tab "Notificaciones"
  - `/business-panel/settings` → Tab "Certificados"
  - `/business-panel/settings` → Tab "Configuración Avanzada"

#### Analytics
- **URL:** `/business-panel/analytics`
- **Tabs disponibles:**
  - `/business-panel/analytics` → Tab "Vista General"
  - `/business-panel/analytics` → Tab "Por Usuario"
  - `/business-panel/analytics` → Tab "Tendencias"
  - `/business-panel/analytics` → Tab "Por Rol"
  - `/business-panel/analytics` → Tab "Skills Insights"

#### Cursos
- **Listado:** `/business-panel/courses`
- **Detalle:** `/business-panel/courses/[id]`
  - Tabs: Información, Contenido, Reseñas, Instructor, **Analytics**

#### Planes de Suscripción
- **URL:** `/business-panel/settings` → Tab "Suscripción" → Botón "Cambiar de Plan"
- O directamente: `/business-panel/subscription/plans` (si existe ruta específica)

---

## 📡 APIs REST Disponibles

### Grupos de Usuarios
```
GET    /api/business/user-groups
POST   /api/business/user-groups
GET    /api/business/user-groups/[id]
PUT    /api/business/user-groups/[id]
DELETE /api/business/user-groups/[id]
GET    /api/business/user-groups/[id]/members
POST   /api/business/user-groups/[id]/members
DELETE /api/business/user-groups/[id]/members/[memberId]
```

### Branding
```
GET /api/business/settings/branding
PUT /api/business/settings/branding
```

### Analytics
```
GET /api/business/analytics/skills?user_id=[opcional]
GET /api/business/courses/[id]/analytics
```

### Dashboard
```
GET    /api/business/dashboard/layout
POST   /api/business/dashboard/layout
DELETE /api/business/dashboard/layout
```

### Notificaciones
```
GET /api/business/notifications/settings
PUT /api/business/notifications/settings
```

### Certificados
```
GET    /api/business/certificates/templates
POST   /api/business/certificates/templates
PUT    /api/business/certificates/templates?id=[id]
DELETE /api/business/certificates/templates?id=[id]
```

### Cursos (Modificado)
```
POST /api/business/courses/[id]/assign
  Body: { user_ids: [], due_date: string, message: string }
```

---

## 🗄️ Base de Datos - Tablas Modificadas/Creadas

### Tablas Creadas:
1. `user_groups` - Grupos de usuarios personalizados
2. `user_group_members` - Miembros de grupos
3. `dashboard_layouts` - Layouts personalizados de dashboards
4. `notification_settings` - Configuración de notificaciones
5. `certificate_templates` - Templates de certificados

### Tablas Modificadas:
1. `organizations` - Agregados campos de branding
2. `organization_course_assignments` - Agregado campo `message`
3. `user_course_certificates` - Agregado campo `template_id`

---

## 📋 Checklist de Implementación

### ✅ Alta Prioridad (4/4)
- [x] Mensajería en asignación de cursos
- [x] Grupos de usuarios personalizados
- [x] Branding corporativo completo
- [x] Actualización de tablas comparativas

### ✅ Media Prioridad (4/4)
- [x] Skills Insights y gaps
- [x] Análisis de cursos individuales
- [x] Dashboard personalizable
- [x] Notificaciones automáticas

### ✅ Baja Prioridad (1/4)
- [x] Certificados personalizados
- [ ] Integración con Zoom/Google Meet
- [ ] SSO empresarial
- [ ] API de datos

---

## 🚀 Próximos Pasos

### Para Completar la Implementación:

1. **Integración con Zoom/Google Meet**
   - Crear componente `BusinessLiveSessions.tsx`
   - API `/api/business/live-sessions`
   - Tabla `live_sessions`

2. **SSO Empresarial**
   - Servicio `sso.service.ts`
   - API `/api/auth/sso`
   - Configuración SAML/OAuth empresarial

3. **API de Datos**
   - API `/api/business/api-key`
   - Componente `BusinessAPIKeys.tsx`
   - Documentación de API

---

## 📝 Notas Importantes

1. **Todos los componentes están listos para usar**, solo falta:
   - Integración del componente `CustomDashboard` en la página principal del dashboard
   - Integración del componente `BusinessUserGroups` en la sección de usuarios

2. **Las migraciones SQL deben ejecutarse** en Supabase antes de usar las funcionalidades:
   - Ejecutar todos los archivos `.sql` en `Nueva carpeta/migrations/`

3. **Validaciones de plan** están implementadas en:
   - Dashboard personalizable (Business/Enterprise)
   - Certificados personalizados (Business/Enterprise)
   - Notificaciones Push/SMS (según plan)

4. **El sistema de notificaciones** está configurado pero requiere implementar el servicio de envío real (email/push/SMS)

---

**Última actualización:** Diciembre 2024
**Estado:** 9 de 12 funcionalidades implementadas (75%)

