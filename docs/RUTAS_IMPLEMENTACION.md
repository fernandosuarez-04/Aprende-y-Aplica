# 🗺️ Guía Rápida de Rutas - Funcionalidades Implementadas

## 🚀 Acceso Directo a Funcionalidades

### 📍 Panel de Negocios Base
**URL Base:** `/business-panel`

---

## 1. 💬 Mensajería en Asignación de Cursos

**Ruta:** 
```
/business-panel/courses/[id] → Botón "Asignar Curso" → Modal
```

**Archivos:**
- Componente: `apps/web/src/features/business-panel/components/BusinessAssignCourseModal.tsx`
- API: `apps/web/src/app/api/business/courses/[id]/assign/route.ts`

---

## 2. 👥 Grupos de Usuarios

**Rutas API:**
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

**Archivos:**
- Servicio: `apps/web/src/features/business-panel/services/userGroups.service.ts`
- APIs: `apps/web/src/app/api/business/user-groups/`

---

## 3. 🎨 Branding Corporativo

**Ruta:**
```
/business-panel/settings → Tab "Branding"
```

**Archivos:**
- Componente: `apps/web/src/features/business-panel/components/BusinessSettings.tsx` (tab BrandingTab)
- API: `apps/web/src/app/api/business/settings/branding/route.ts`

**APIs:**
```
GET /api/business/settings/branding
PUT /api/business/settings/branding
```

---

## 4. 📊 Tablas Comparativas de Planes

**Ruta:**
```
/business-panel/settings → Tab "Suscripción" → Botón "Cambiar de Plan"
```

**Archivos:**
- Componente: `apps/web/src/features/business-panel/components/BusinessSubscriptionPlans.tsx`

---

## 5. 🧠 Skills Insights

**Ruta:**
```
/business-panel/analytics → Tab "Skills Insights"
```

**Archivos:**
- Componente: `apps/web/src/features/business-panel/components/BusinessAnalytics.tsx` (tab SkillsTab)
- API: `apps/web/src/app/api/business/analytics/skills/route.ts`

**API:**
```
GET /api/business/analytics/skills?user_id=[opcional]
```

---

## 6. 📈 Análisis de Cursos Individuales

**Ruta:**
```
/business-panel/courses/[id] → Tab "Analytics"
```

**Archivos:**
- Componente: `apps/web/src/features/business-panel/components/CourseAnalyticsTab.tsx`
- API: `apps/web/src/app/api/business/courses/[id]/analytics/route.ts`

**API:**
```
GET /api/business/courses/[id]/analytics
```

---

## 7. 🎛️ Dashboard Personalizable

**Componente Disponible:**
- `apps/web/src/features/business-panel/components/CustomDashboard.tsx`

**APIs:**
```
GET    /api/business/dashboard/layout
POST   /api/business/dashboard/layout
DELETE /api/business/dashboard/layout
```

**Nota:** Componente listo, pendiente integración en página principal

---

## 8. 🔔 Notificaciones Automáticas

**Ruta:**
```
/business-panel/settings → Tab "Notificaciones"
```

**Archivos:**
- Componente: `apps/web/src/features/business-panel/components/BusinessNotificationsSettings.tsx`
- API: `apps/web/src/app/api/business/notifications/settings/route.ts`

**APIs:**
```
GET /api/business/notifications/settings
PUT /api/business/notifications/settings
```

---

## 9. 🏆 Certificados Personalizados

**Ruta:**
```
/business-panel/settings → Tab "Certificados"
```

**Archivos:**
- Componente: `apps/web/src/features/business-panel/components/BusinessCertificateCustomizer.tsx`
- API: `apps/web/src/app/api/business/certificates/templates/route.ts`

**APIs:**
```
GET    /api/business/certificates/templates
POST   /api/business/certificates/templates
PUT    /api/business/certificates/templates?id=[id]
DELETE /api/business/certificates/templates?id=[id]
```

---

## 📁 Estructura de Carpetas

```
apps/web/src/
├── features/business-panel/
│   ├── components/
│   │   ├── BusinessAssignCourseModal.tsx (modificado)
│   │   ├── BusinessSettings.tsx (modificado)
│   │   ├── BusinessSubscriptionPlans.tsx (modificado)
│   │   ├── BusinessAnalytics.tsx (modificado)
│   │   ├── CourseAnalyticsTab.tsx (nuevo)
│   │   ├── CustomDashboard.tsx (nuevo)
│   │   ├── BusinessNotificationsSettings.tsx (nuevo)
│   │   └── BusinessCertificateCustomizer.tsx (nuevo)
│   └── services/
│       └── userGroups.service.ts (nuevo)
├── app/api/business/
│   ├── courses/[id]/
│   │   ├── assign/route.ts (modificado)
│   │   └── analytics/route.ts (nuevo)
│   ├── user-groups/
│   │   ├── route.ts (nuevo)
│   │   ├── [id]/route.ts (nuevo)
│   │   └── [id]/members/
│   │       ├── route.ts (nuevo)
│   │       └── [memberId]/route.ts (nuevo)
│   ├── settings/
│   │   └── branding/route.ts (nuevo)
│   ├── analytics/
│   │   └── skills/route.ts (nuevo)
│   ├── dashboard/
│   │   └── layout/route.ts (nuevo)
│   ├── notifications/
│   │   └── settings/route.ts (nuevo)
│   └── certificates/
│       └── templates/route.ts (nuevo)
└── app/business-panel/
    ├── courses/[id]/page.tsx (modificado)
    ├── analytics/page.tsx (existente)
    └── settings/page.tsx (existente)

Nueva carpeta/migrations/
├── add_message_to_course_assignments.sql
├── add_user_groups_tables.sql
├── add_branding_to_organizations.sql
├── add_dashboard_layouts_table.sql
├── add_notification_settings_table.sql
└── add_certificate_templates_table.sql
```

---

## 🔗 Mapa de Navegación Completo

```
/business-panel
│
├── /dashboard (página principal)
│   └── [CustomDashboard - pendiente integración]
│
├── /courses
│   ├── [listado de cursos]
│   └── /[id]
│       ├── Tab: Información
│       ├── Tab: Contenido
│       ├── Tab: Reseñas
│       ├── Tab: Instructor
│       └── Tab: Analytics ⭐ NUEVO
│           └── Métricas detalladas del curso
│
├── /analytics
│   ├── Tab: Vista General
│   ├── Tab: Por Usuario
│   ├── Tab: Tendencias
│   ├── Tab: Por Rol
│   └── Tab: Skills Insights ⭐ NUEVO
│       └── Análisis de habilidades y gaps
│
├── /users
│   └── [gestión de usuarios]
│       └── [UserGroups - pendiente integración]
│
└── /settings
    ├── Tab: Datos de la Empresa
    ├── Tab: Suscripción
    │   └── Botón: "Cambiar de Plan" → BusinessSubscriptionPlans
    ├── Tab: Branding ⭐ NUEVO
    │   └── Personalización de colores, fuentes, logos
    ├── Tab: Notificaciones ⭐ NUEVO
    │   └── Configuración de eventos y canales
    ├── Tab: Certificados ⭐ NUEVO
    │   └── Editor de templates de certificados
    └── Tab: Configuración Avanzada
```

---

## 🗄️ Base de Datos

### Tablas Nuevas:
1. `user_groups`
2. `user_group_members`
3. `dashboard_layouts`
4. `notification_settings`
5. `certificate_templates`

### Tablas Modificadas:
1. `organizations` (+ campos branding)
2. `organization_course_assignments` (+ campo message)
3. `user_course_certificates` (+ campo template_id)

**Ubicación de Migraciones:** `Nueva carpeta/migrations/`

---

## ⚠️ Notas Importantes

1. **Migraciones SQL**: Ejecutar todos los archivos `.sql` en Supabase antes de usar
2. **Componentes Pendientes de Integración**:
   - `CustomDashboard` → Integrar en `/business-panel/dashboard`
   - `BusinessUserGroups` → Integrar en `/business-panel/users`

3. **Validaciones de Plan**: Implementadas en:
   - Dashboard personalizable (Business/Enterprise)
   - Certificados personalizados (Business/Enterprise)
   - Notificaciones Push/SMS (según plan)

---

**Versión:** 1.0  
**Fecha:** Diciembre 2024  
**Estado:** 9/12 funcionalidades implementadas (75%)

