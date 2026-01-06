# Prompt de Implementación: Sistema de Invitaciones por Correo (Empresarial)

**Rol:** Ingeniero Senior de Software Fullstack (Next.js, TypeScript, Supabase).

**Objetivo Principal:** Implementar un sistema de invitaciones seguro donde **solo los correos invitados** puedan registrarse en la plataforma, ya sea mediante credenciales (manual) o SSO.

**Estado Actual:**

- Existe un Login personalizado por empresa (`OrganizationLoginForm`).
- **NO EXISTE (o requiere reimplementación completa)** el Registro personalizado por empresa.
- Stack: Next.js 14, Supabase (Auth/DB), Nodemailer.

---

### Requerimientos de Implementación

#### 1. Base de Datos (Supabase)

Generar migración SQL para la tabla `user_invitations`:

```sql
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user', -- Ej: 'admin', 'user', 'manager'
  organization_id UUID REFERENCES organizations(id), -- Vinculado a la empresa
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
-- Indices: token, email, organization_id
```

#### 2. Backend: Lógica de Invitaciones (Server Actions)

Archivo: `src/features/admin/actions/invitations.ts`

- **`inviteUserAction(email, role, organizationId)`**:
  - Valida permisos de admin.
  - Verifica que el email no exista en `users`.
  - Genera token y guarda en `user_invitations`.
  - Envía correo (`emailService`).

- **`validateInvitationAction(token)`**:
  - Retorna: `{ isValid: boolean, email: string, role: string, organizationId: string }`.

- **`consumeInvitationAction(token, userId)`**:
  - Marca invitación como 'accepted'.
  - Asegura que el usuario tenga el `role` y `organization_id` correctos en su perfil.

#### 3. Frontend: Página de Registro Personalizado (Nueva/Reescritura)

**Ubicación:** `src/app/auth/[slug]/register/page.tsx` + `OrganizationRegisterForm.tsx`.

- **Diseño Visual:**
  - Debe ser **exactamente igual al Login de la empresa** (`OrganizationLoginForm` / `OrganizationAuthLayout`).
  - Mantener mismos estilos, layout, colores de marca y tipografía.
  - Campos adicionales: Nombre, Apellidos, Contraseña, Confirmar Contraseña.
  - **Campo "Rol"**: Generalmente oculto/implícito por la invitación, pero si se requiere mostrar, debe ser read-only.

- **Lógica de Validación Crítica (El Correo es la Llave):**
  - **Entrada por Link (`?token=xyz`):**
    - Validar token al cargar.
    - Si es válido: **Pre-llenar el campo Email y bloquearlo (read-only)**.
    - Permitir completar password/nombre.
  - **Registro Manual / SSO:**
    - Si el usuario intenta registrarse (manual o click en Google/Microsoft) **sin un token en la URL**:
      - El sistema debe buscar si existe una invitación activa para ese email.
      - **Si NO existe invitación:** Bloquear el registro y mostrar error: _"Tu correo no ha sido invitado a esta organización. Contacta al administrador."_
      - **Si existe:** Permitir proceder y consumir la invitación automáticamente al crear el usuario.

#### 4. Servicio de Email

- Actualizar `emailService` para enviar invitaciones con estilo profesional.
- Link de acción: `[APP_URL]/auth/[slug]/register?token=[TOKEN]`.

#### Resumen de Flujo

1.  Admin envía invitación a `usuario@empresa.com`.
2.  Usuario recibe correo y da click.
3.  Llega a la landing de registro de la empresa (Diseño idéntico al login).
4.  Ve su correo ya puesto (bloqueado).
5.  Llena password/nombre -> Click "Registrar".
6.  Backend verifica token, crea usuario, asigna rol y marca invitación como usada.
