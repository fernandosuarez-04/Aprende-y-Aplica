# 📋 Prompt para Replantear el Modelo de Datos con Aislamiento por Organización

## 🎯 Contexto de la Plataforma

**Aprende y Aplica** es una plataforma de aprendizaje empresarial (LMS B2B) que permite a las organizaciones gestionar la capacitación de sus empleados con las siguientes características principales:

- **Usuarios Multiorganización**: Un usuario puede pertenecer a múltiples organizaciones (2, 5 o más)
- **Cursos y Módulos**: Sistema de cursos con módulos, lecciones, actividades, materiales y quizzes
- **Progreso de Aprendizaje**: Tracking de progreso, calificaciones, certificados, sesiones de estudio
- **Equipos de Trabajo (Work Teams)**: Grupos dentro de organizaciones para colaboración
- **Asistente LIA**: Chatbot de IA con conversaciones y feedback por usuario
- **Planes de Estudio**: Sistemas de planificación de sesiones de estudio personalizados
- **Panel Business**: Dashboard para administradores de organización con analytics

---

## 🚨 Problema Actual

El modelo de datos actual presenta **falta de aislamiento de información entre organizaciones**:

1. **Mismo curso compartido**: Si las Organizaciones 1 y 2 tienen el "Curso A", actualmente NO existe separación del progreso, calificaciones ni métricas entre ambas organizaciones.

2. **Sin contexto persistente**: No hay forma clara de mantener el "contexto de organización" cuando un usuario pertenece a múltiples organizaciones.

3. **URLs genéricas**: Todas las organizaciones comparten la misma URL base, diferenciando solo mediante consultas SQL.

4. **Relaciones incompletas**: Muchas tablas de progreso y tracking no incluyen `organization_id`, lo que impide filtrar por organización.

---

## ✅ Objetivo del Rediseño

Garantizar **aislamiento total de información por organización** mediante:

1. **Slug único por organización** para diferenciación desde la URL y lógica de negocio
2. **`organization_id` obligatorio** en todas las tablas que contienen datos específicos del contexto organizacional
3. **Consultas seguras** que siempre incluyan el filtro de organización

---

## 📊 Análisis del Esquema Actual

### Tablas que YA tienen `organization_id` (correctas):

| Tabla                                   | Tiene `organization_id`    |
| --------------------------------------- | -------------------------- |
| `organizations`                         | ✅ (es la tabla principal) |
| `organization_users`                    | ✅                         |
| `organization_course_assignments`       | ✅                         |
| `organization_course_purchases`         | ✅                         |
| `organization_analytics`                | ✅                         |
| `organization_notification_preferences` | ✅                         |
| `certificate_templates`                 | ✅                         |
| `dashboard_layouts`                     | ✅                         |
| `notification_settings`                 | ✅                         |
| `notification_stats`                    | ✅ (opcional)              |
| `scorm_packages`                        | ✅                         |
| `study_plans`                           | ✅                         |
| `user_notifications`                    | ✅                         |
| `work_teams`                            | ✅                         |

### ⚠️ Tablas que NECESITAN agregar `organization_id`:

| Tabla                       | Razón                                           |
| --------------------------- | ----------------------------------------------- |
| `user_course_enrollments`   | El enrollment debe ser por organización         |
| `user_lesson_progress`      | El progreso debe ser por organización           |
| `user_course_certificates`  | Certificados por organización                   |
| `user_quiz_submissions`     | Resultados de quizzes por organización          |
| `user_lesson_notes`         | Notas por organización                          |
| `lesson_tracking`           | Tracking por organización                       |
| `daily_progress`            | Progreso diario por organización                |
| `user_streaks`              | Rachas por organización                         |
| `user_activity_log`         | Logs de actividad por organización              |
| `lia_conversations`         | Conversaciones LIA por organización             |
| `lia_messages`              | Mensajes LIA indirectamente (via conversation)  |
| `lia_activity_completions`  | Completaciones de actividades                   |
| `lia_user_feedback`         | Feedback del usuario                            |
| `study_sessions`            | Sesiones de estudio por organización            |
| `course_questions`          | Preguntas por organización                      |
| `course_question_responses` | Respuestas por organización                     |
| `course_reviews`            | Reviews podrían ser específicas de organización |
| `lesson_feedback`           | Feedback de lecciones por organización          |

---

## 📐 Cambios Propuestos al Esquema

### 1. Verificar slug en `organizations`

```sql
-- La tabla organizations ya tiene slug
-- Agregar constraint NOT NULL si no existe
ALTER TABLE public.organizations
  ALTER COLUMN slug SET NOT NULL;

-- Agregar índice único si no existe
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
```

### 2. Modificar `user_course_enrollments`

```sql
-- Agregar organization_id
ALTER TABLE public.user_course_enrollments
  ADD COLUMN organization_id uuid;

-- Agregar FK
ALTER TABLE public.user_course_enrollments
  ADD CONSTRAINT user_course_enrollments_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

-- Índice para consultas
CREATE INDEX idx_enrollments_org ON public.user_course_enrollments(organization_id, user_id, course_id);

-- Constraint único: un usuario solo puede inscribirse una vez al mismo curso POR organización
ALTER TABLE public.user_course_enrollments
  ADD CONSTRAINT unique_enrollment_per_org
  UNIQUE (user_id, course_id, organization_id);
```

### 3. Modificar `user_lesson_progress`

```sql
ALTER TABLE public.user_lesson_progress
  ADD COLUMN organization_id uuid;

ALTER TABLE public.user_lesson_progress
  ADD CONSTRAINT user_lesson_progress_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

CREATE INDEX idx_lesson_progress_org ON public.user_lesson_progress(organization_id, user_id);
```

### 4. Modificar `user_course_certificates`

```sql
ALTER TABLE public.user_course_certificates
  ADD COLUMN organization_id uuid;

ALTER TABLE public.user_course_certificates
  ADD CONSTRAINT user_course_certificates_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
```

### 5. Modificar `user_quiz_submissions`

```sql
ALTER TABLE public.user_quiz_submissions
  ADD COLUMN organization_id uuid;

ALTER TABLE public.user_quiz_submissions
  ADD CONSTRAINT user_quiz_submissions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
```

### 6. Modificar `study_sessions`

```sql
-- Ya tiene relación vía study_plans, pero agregar directamente
ALTER TABLE public.study_sessions
  ADD COLUMN organization_id uuid;

ALTER TABLE public.study_sessions
  ADD CONSTRAINT study_sessions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
```

### 7. Modificar `lesson_tracking`

```sql
ALTER TABLE public.lesson_tracking
  ADD COLUMN organization_id uuid;

ALTER TABLE public.lesson_tracking
  ADD CONSTRAINT lesson_tracking_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
```

### 8. Modificar `daily_progress`

```sql
ALTER TABLE public.daily_progress
  ADD COLUMN organization_id uuid;

ALTER TABLE public.daily_progress
  ADD CONSTRAINT daily_progress_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

-- Único por día-usuario-organización
ALTER TABLE public.daily_progress
  ADD CONSTRAINT unique_daily_progress_per_org
  UNIQUE (user_id, progress_date, organization_id);
```

### 9. Modificar `user_streaks`

```sql
-- Cambiar PK ya que ahora un usuario puede tener múltiples streaks
ALTER TABLE public.user_streaks DROP CONSTRAINT user_streaks_pkey;

ALTER TABLE public.user_streaks
  ADD COLUMN organization_id uuid,
  ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.user_streaks
  ADD CONSTRAINT user_streaks_pkey PRIMARY KEY (id);

ALTER TABLE public.user_streaks
  ADD CONSTRAINT user_streaks_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE public.user_streaks
  ADD CONSTRAINT unique_streak_per_org UNIQUE (user_id, organization_id);
```

### 10. Modificar `lia_conversations`

```sql
ALTER TABLE public.lia_conversations
  ADD COLUMN organization_id uuid;

ALTER TABLE public.lia_conversations
  ADD CONSTRAINT lia_conversations_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
```

### 11. Modificar `course_questions` y `course_question_responses`

```sql
ALTER TABLE public.course_questions
  ADD COLUMN organization_id uuid;

ALTER TABLE public.course_questions
  ADD CONSTRAINT course_questions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE public.course_question_responses
  ADD COLUMN organization_id uuid;

ALTER TABLE public.course_question_responses
  ADD CONSTRAINT course_question_responses_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
```

### 12. Modificar `user_lesson_notes`

```sql
ALTER TABLE public.user_lesson_notes
  ADD COLUMN organization_id uuid;

ALTER TABLE public.user_lesson_notes
  ADD CONSTRAINT user_lesson_notes_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
```

### 13. Modificar `user_activity_log`

```sql
ALTER TABLE public.user_activity_log
  ADD COLUMN organization_id uuid;

ALTER TABLE public.user_activity_log
  ADD CONSTRAINT user_activity_log_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
```

### 14. Modificar `lia_activity_completions`

```sql
ALTER TABLE public.lia_activity_completions
  ADD COLUMN organization_id uuid;

ALTER TABLE public.lia_activity_completions
  ADD CONSTRAINT lia_activity_completions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
```

### 15. Modificar `lesson_feedback`

```sql
ALTER TABLE public.lesson_feedback
  ADD COLUMN organization_id uuid;

ALTER TABLE public.lesson_feedback
  ADD CONSTRAINT lesson_feedback_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
```

---

## 🔄 Migración de Datos Existentes

Para migrar datos existentes, se puede inferir la organización en algunos casos:

```sql
-- Ejemplo: Migrar enrollments existentes basándose en organization_course_assignments
UPDATE public.user_course_enrollments uce
SET organization_id = (
  SELECT oca.organization_id
  FROM public.organization_course_assignments oca
  WHERE oca.user_id = uce.user_id
    AND oca.course_id = uce.course_id
  LIMIT 1
)
WHERE uce.organization_id IS NULL;

-- Para usuarios B2C (sin organización), usar NULL o una organización "default"
```

### Script de Migración Completo

```sql
-- 1. Migrar user_lesson_progress
UPDATE public.user_lesson_progress ulp
SET organization_id = (
  SELECT uce.organization_id
  FROM public.user_course_enrollments uce
  WHERE uce.enrollment_id = ulp.enrollment_id
)
WHERE ulp.organization_id IS NULL;

-- 2. Migrar user_quiz_submissions
UPDATE public.user_quiz_submissions uqs
SET organization_id = (
  SELECT uce.organization_id
  FROM public.user_course_enrollments uce
  WHERE uce.enrollment_id = uqs.enrollment_id
)
WHERE uqs.organization_id IS NULL;

-- 3. Migrar user_course_certificates
UPDATE public.user_course_certificates ucc
SET organization_id = (
  SELECT uce.organization_id
  FROM public.user_course_enrollments uce
  WHERE uce.enrollment_id = ucc.enrollment_id
)
WHERE ucc.organization_id IS NULL;

-- 4. Migrar study_sessions desde study_plans
UPDATE public.study_sessions ss
SET organization_id = (
  SELECT sp.organization_id
  FROM public.study_plans sp
  WHERE sp.id = ss.plan_id
)
WHERE ss.organization_id IS NULL AND ss.plan_id IS NOT NULL;

-- 5. Migrar lia_conversations
UPDATE public.lia_conversations lc
SET organization_id = (
  SELECT ou.organization_id
  FROM public.organization_users ou
  WHERE ou.user_id = lc.user_id
  LIMIT 1
)
WHERE lc.organization_id IS NULL;
```

---

## 🛡️ Cambios en el Código (Backend)

### 1. Middleware de Contexto de Organización

```typescript
// middleware/organizationContext.ts
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface OrganizationContext {
  organizationId: string | null;
  organizationSlug: string | null;
}

export async function getOrganizationContext(
  request: NextRequest
): Promise<OrganizationContext> {
  // Obtener slug de la URL: /{org-slug}/dashboard
  const pathname = request.nextUrl.pathname;
  const orgSlugMatch = pathname.match(
    /^\/([^\/]+)\/(business-panel|business-user|courses)/
  );
  const orgSlug = orgSlugMatch?.[1];

  if (orgSlug && !["api", "auth", "public", "_next"].includes(orgSlug)) {
    const supabase = await createClient();
    const { data: org } = await supabase
      .from("organizations")
      .select("id, slug")
      .eq("slug", orgSlug)
      .single();

    if (org) {
      return {
        organizationId: org.id,
        organizationSlug: org.slug,
      };
    }
  }

  return {
    organizationId: null,
    organizationSlug: null,
  };
}
```

### 2. Hook de Organización para Frontend

```typescript
// hooks/useOrganization.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

interface OrganizationState {
  currentOrganization: Organization | null;
  userOrganizations: Organization[];
  setCurrentOrganization: (org: Organization | null) => void;
  setUserOrganizations: (orgs: Organization[]) => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      currentOrganization: null,
      userOrganizations: [],
      setCurrentOrganization: (org) => set({ currentOrganization: org }),
      setUserOrganizations: (orgs) => set({ userOrganizations: orgs }),
    }),
    {
      name: "organization-storage",
    }
  )
);

// Hook para obtener el organization_id actual
export function useCurrentOrganizationId(): string | null {
  const { currentOrganization } = useOrganizationStore();
  return currentOrganization?.id ?? null;
}
```

### 3. Servicios con Contexto Obligatorio

```typescript
// services/enrollment.service.ts
import { createClient } from "@/lib/supabase/server";

export async function getUserEnrollments(
  userId: string,
  organizationId: string | null
) {
  const supabase = await createClient();

  let query = supabase
    .from("user_course_enrollments")
    .select(
      `
      *,
      course:courses(*)
    `
    )
    .eq("user_id", userId);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  } else {
    query = query.is("organization_id", null); // B2C users
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getLessonProgress(
  userId: string,
  lessonId: string,
  organizationId: string | null
) {
  const supabase = await createClient();

  let query = supabase
    .from("user_lesson_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  } else {
    query = query.is("organization_id", null);
  }

  const { data, error } = await query.single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  enrollmentId: string,
  organizationId: string | null,
  progressData: Partial<LessonProgress>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_lesson_progress")
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        enrollment_id: enrollmentId,
        organization_id: organizationId,
        ...progressData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,lesson_id,enrollment_id",
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 4. API Routes con Validación

```typescript
// app/api/courses/[courseId]/progress/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getOrganizationContext } from "@/middleware/organizationContext";
import { getCurrentUser } from "@/lib/auth";
import {
  getLessonProgress,
  updateLessonProgress,
} from "@/services/enrollment.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener contexto de organización
    const { organizationId } = await getOrganizationContext(request);

    const progress = await getCourseProgress(
      user.id,
      params.courseId,
      organizationId // SIEMPRE pasar el organization_id
    );

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error getting progress:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await getOrganizationContext(request);
    const body = await request.json();

    // Verificar que el usuario pertenece a la organización
    if (organizationId) {
      const isMember = await verifyOrganizationMembership(
        user.id,
        organizationId
      );
      if (!isMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const result = await updateLessonProgress(
      user.id,
      body.lessonId,
      body.enrollmentId,
      organizationId,
      body.progressData
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

---

## 🎨 Cambios en el Frontend

### 1. Estructura de URLs Propuesta

```
/{org-slug}/dashboard              → Panel de organización
/{org-slug}/courses                → Cursos de la organización
/{org-slug}/courses/{course-slug}  → Curso específico (progreso de esa org)
/{org-slug}/analytics              → Analytics de la organización
/{org-slug}/teams                  → Equipos de trabajo
/{org-slug}/settings               → Configuración de organización
```

### 2. Selector de Organización

```tsx
// components/OrganizationSwitcher.tsx
"use client";

import { useRouter } from "next/navigation";
import { useOrganizationStore } from "@/hooks/useOrganization";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export function OrganizationSwitcher() {
  const router = useRouter();
  const { currentOrganization, userOrganizations, setCurrentOrganization } =
    useOrganizationStore();

  if (userOrganizations.length <= 1) {
    return null; // No mostrar si solo hay una organización
  }

  const handleOrganizationChange = (orgId: string) => {
    const org = userOrganizations.find((o) => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
      // Redirigir al dashboard de la nueva organización
      router.push(`/${org.slug}/dashboard`);
    }
  };

  return (
    <Select
      value={currentOrganization?.id}
      onValueChange={handleOrganizationChange}
    >
      <SelectTrigger className="w-[200px]">
        <Building2 className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Seleccionar organización" />
      </SelectTrigger>
      <SelectContent>
        {userOrganizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            <div className="flex items-center gap-2">
              {org.logoUrl && (
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="h-5 w-5 rounded"
                />
              )}
              <span>{org.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### 3. Provider de Organización

```tsx
// providers/OrganizationProvider.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useOrganizationStore } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { setCurrentOrganization, setUserOrganizations, userOrganizations } =
    useOrganizationStore();

  // Cargar organizaciones del usuario
  useEffect(() => {
    if (user) {
      loadUserOrganizations(user.id).then((orgs) => {
        setUserOrganizations(orgs);
      });
    }
  }, [user]);

  // Sincronizar organización actual con la URL
  useEffect(() => {
    const slugMatch = pathname.match(/^\/([^\/]+)\//);
    const urlSlug = slugMatch?.[1];

    if (urlSlug && userOrganizations.length > 0) {
      const matchingOrg = userOrganizations.find((o) => o.slug === urlSlug);
      if (matchingOrg) {
        setCurrentOrganization(matchingOrg);
      }
    }
  }, [pathname, userOrganizations]);

  return <>{children}</>;
}

async function loadUserOrganizations(userId: string) {
  const response = await fetch(`/api/users/${userId}/organizations`);
  const data = await response.json();
  return data.organizations;
}
```

---

## 🔒 Row Level Security (RLS) - Supabase

### Políticas RLS para aislamiento por organización:

```sql
-- Habilitar RLS en tablas críticas
ALTER TABLE public.user_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Política para user_course_enrollments
CREATE POLICY "Users can view own enrollments in their organizations"
ON public.user_course_enrollments
FOR SELECT
USING (
  user_id = auth.uid()
  AND (
    organization_id IS NULL -- B2C
    OR organization_id IN (
      SELECT organization_id
      FROM public.organization_users
      WHERE user_id = auth.uid()
    )
  )
);

-- Política para user_lesson_progress
CREATE POLICY "Users can view own progress in their organizations"
ON public.user_lesson_progress
FOR SELECT
USING (
  user_id = auth.uid()
  AND (
    organization_id IS NULL
    OR organization_id IN (
      SELECT organization_id
      FROM public.organization_users
      WHERE user_id = auth.uid()
    )
  )
);

-- Política para admins de organización
CREATE POLICY "Org admins can view all enrollments in their org"
ON public.user_course_enrollments
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.organization_users
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);
```

---

## 📝 Lista de Verificación (Checklist)

### Base de Datos:

- [ ] Verificar `slug NOT NULL UNIQUE` en `organizations`
- [ ] Agregar `organization_id` a `user_course_enrollments`
- [ ] Agregar `organization_id` a `user_lesson_progress`
- [ ] Agregar `organization_id` a `user_course_certificates`
- [ ] Agregar `organization_id` a `user_quiz_submissions`
- [ ] Agregar `organization_id` a `lesson_tracking`
- [ ] Agregar `organization_id` a `daily_progress`
- [ ] Modificar `user_streaks` para soportar múltiples organizaciones
- [ ] Agregar `organization_id` a `lia_conversations`
- [ ] Agregar `organization_id` a `lia_activity_completions`
- [ ] Agregar `organization_id` a `study_sessions`
- [ ] Agregar `organization_id` a `course_questions`
- [ ] Agregar `organization_id` a `course_question_responses`
- [ ] Agregar `organization_id` a `user_lesson_notes`
- [ ] Agregar `organization_id` a `user_activity_log`
- [ ] Agregar `organization_id` a `lesson_feedback`
- [ ] Crear índices compuestos para consultas frecuentes
- [ ] Ejecutar scripts de migración de datos existentes
- [ ] Configurar políticas RLS en Supabase

### Backend:

- [ ] Crear middleware de contexto de organización
- [ ] Actualizar todos los servicios para incluir `organization_id`
- [ ] Actualizar todas las API routes con validación de organización
- [ ] Agregar verificación de membresía a organización
- [ ] Actualizar queries de LIA para filtrar por organización

### Frontend:

- [ ] Implementar routing dinámico `/{org-slug}/...`
- [ ] Crear componente `OrganizationSwitcher`
- [ ] Crear `OrganizationProvider`
- [ ] Actualizar hooks para pasar `organizationId` en todas las llamadas
- [ ] Actualizar estados globales con contexto de organización
- [ ] Actualizar navegación del navbar con slug de organización

---

## 💡 Consideraciones Adicionales

### 1. Usuarios B2C

Mantener `organization_id = NULL` para usuarios que no pertenecen a ninguna organización. Las consultas deben manejar ambos casos:

```typescript
if (organizationId) {
  query.eq("organization_id", organizationId);
} else {
  query.is("organization_id", null);
}
```

### 2. Cursos Globales vs. Organizacionales

- Los **cursos** son "globales" (compartidos entre organizaciones)
- El **progreso, calificaciones y métricas** son específicos por organización
- Esto permite que una organización compre acceso a un curso existente

### 3. Certificados

Un mismo curso puede generar certificados diferentes por organización:

- Branding diferente (logo, colores)
- Template de certificado específico por organización
- El certificado incluye el nombre de la organización

### 4. Analytics Cruzados

- Si un admin de organización también es usuario individual, sus métricas deben estar separadas
- Dashboard de admin muestra solo métricas de su organización
- Dashboard personal muestra progreso personal (B2C o por organización seleccionada)

### 5. Performance

Agregar índices apropiados en las nuevas columnas `organization_id`:

```sql
CREATE INDEX idx_enrollments_org_user ON user_course_enrollments(organization_id, user_id);
CREATE INDEX idx_progress_org_user ON user_lesson_progress(organization_id, user_id);
CREATE INDEX idx_sessions_org_user ON study_sessions(organization_id, user_id);
```

### 6. Migración Gradual

Considerar una migración en fases:

1. **Fase 1**: Agregar columnas `organization_id` como nullable
2. **Fase 2**: Migrar datos existentes
3. **Fase 3**: Actualizar backend para usar `organization_id`
4. **Fase 4**: Actualizar frontend con nuevo routing
5. **Fase 5**: Hacer columnas NOT NULL donde sea necesario

---

## 🚀 Próximos Pasos Recomendados

1. **Crear script de migración SQL** con todos los ALTER TABLE
2. **Crear backup** de la base de datos antes de ejecutar
3. **Ejecutar migración en ambiente de desarrollo** primero
4. **Actualizar servicios del backend** uno por uno
5. **Implementar nuevo routing** en frontend
6. **Testing exhaustivo** con usuarios en múltiples organizaciones
7. **Deploy gradual** a producción

---

_Documento generado para el equipo de desarrollo de Aprende y Aplica_
_Fecha: 2026-01-06_
