# Plan de Implementación - Recuperación de Contraseña

## 📋 Resumen Ejecutivo

Plan detallado para implementar el sistema completo de recuperación de contraseña en el sistema actual (Next.js + Server Actions), basado en las mejores prácticas del sistema anterior y adaptado a la nueva arquitectura.

**Estado Actual**:
- ✅ Variables SMTP configuradas en `.env`
- ✅ Server Actions base implementadas en `reset-password.ts`
- 🟡 Falta: Componentes UI, páginas, servicio de email, tabla de tokens

**Objetivo**: Sistema completo de recuperación de contraseña con seguridad empresarial y UX optimizada.

---

## 🎯 Arquitectura Propuesta

### Stack Tecnológico
```yaml
Backend:
  - Next.js Server Actions (apps/web/src/features/auth/actions/)
  - PostgreSQL (Supabase)
  - bcrypt (hashing)
  - Nodemailer (envío emails)
  - crypto (generación tokens)

Frontend:
  - React Components (shadcn/ui)
  - React Hook Form + Zod
  - TailwindCSS

Seguridad:
  - Rate Limiting (3 intentos / 15 min para solicitud)
  - Rate Limiting (5 intentos / 15 min para reset)
  - Tokens de un solo uso
  - Expiración 1 hora
  - Mensajes seguros (no revelan existencia usuario)
```

### Flujo Completo
```
1. Usuario click "¿Olvidaste tu contraseña?"
   ↓
2. Página /auth/forgot-password
   - Formulario con email
   - Validación Zod
   ↓
3. Server Action: requestPasswordResetAction()
   - Rate limiting check
   - Verificar usuario existe
   - Generar token seguro (crypto.randomBytes(32))
   - Guardar en password_reset_tokens
   - Enviar email con enlace
   ↓
4. Email con enlace: /auth/reset-password?token=abc123...
   ↓
5. Página /auth/reset-password
   - Validar token en carga
   - Formulario nueva contraseña
   - Validación fortaleza en tiempo real
   ↓
6. Server Action: resetPasswordAction()
   - Rate limiting check
   - Validar token (existe, no expirado, no usado)
   - Hash nueva contraseña (bcrypt, 12 rounds)
   - Actualizar password_hash en users
   - Eliminar token usado
   - Invalidar sesiones activas
   ↓
7. Redirect a /auth con mensaje éxito
```

---

## 📁 Estructura de Archivos a Crear/Modificar

```
apps/web/
├── src/
│   ├── features/auth/
│   │   ├── actions/
│   │   │   └── reset-password.ts                    # 🟡 MODIFICAR (mejorar existente)
│   │   │
│   │   ├── components/
│   │   │   ├── ForgotPasswordForm/
│   │   │   │   ├── ForgotPasswordForm.tsx           # ✨ CREAR
│   │   │   │   ├── ForgotPasswordForm.schema.ts     # ✨ CREAR
│   │   │   │   └── index.ts                         # ✨ CREAR
│   │   │   │
│   │   │   └── ResetPasswordForm/
│   │   │       ├── ResetPasswordForm.tsx            # ✨ CREAR
│   │   │       ├── ResetPasswordForm.schema.ts      # ✨ CREAR
│   │   │       └── index.ts                         # ✨ CREAR
│   │   │
│   │   └── services/
│   │       └── email.service.ts                     # ✨ CREAR
│   │
│   └── app/
│       └── auth/
│           ├── forgot-password/
│           │   └── page.tsx                         # ✨ CREAR
│           │
│           └── reset-password/
│               └── page.tsx                         # ✨ CREAR
│
└── .env.local                                       # 🟡 VERIFICAR variables SMTP
```

---

## 🗄️ Base de Datos

### Tabla: password_reset_tokens

```sql
-- Crear tabla para tokens de recuperación
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP,

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Índices para optimizar consultas
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Limpiar tokens expirados (ejecutar periódicamente con cron job)
DELETE FROM password_reset_tokens
WHERE expires_at < NOW() OR used_at IS NOT NULL;
```

---

## 🔧 Implementación Paso a Paso

### FASE 1: Base de Datos ✨
**Prioridad: CRÍTICA** | **Tiempo Estimado: 30 minutos**

#### 1.1. Crear Migración SQL
```bash
# Ubicación: apps/web/supabase/migrations/
# Nombre: 20250125_password_reset_tokens.sql
```

#### 1.2. Ejecutar Migración
```bash
# Aplicar migración a Supabase
supabase db push
```

#### 1.3. Verificar Tabla Creada
- Ir a Supabase Dashboard → Table Editor
- Verificar que tabla `password_reset_tokens` existe
- Verificar que foreign key a `users` funciona

---

### FASE 2: Servicio de Email ✨
**Prioridad: CRÍTICA** | **Tiempo Estimado: 1-2 horas**

#### 2.1. Instalar Dependencias
```bash
cd apps/web
npm install nodemailer
npm install -D @types/nodemailer
```

#### 2.2. Crear Email Service
**Archivo**: `apps/web/src/features/auth/services/email.service.ts`

**Funcionalidades**:
- Configuración SMTP con Nodemailer
- Método `sendPasswordResetEmail(to, token, username)`
- Templates HTML y texto plano
- Manejo de errores robusto
- Logging para debugging

**Características del Email**:
- Design profesional con branding
- Botón CTA destacado
- Enlace alternativo en texto plano
- Advertencias de seguridad
- Información de expiración (1 hora)

#### 2.3. Configurar Variables de Entorno
```env
# apps/web/.env.local
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Nota Gmail**: Usar App Password, no contraseña de cuenta
1. Ir a Google Account → Security → 2-Step Verification
2. Generar App Password
3. Usar ese password en SMTP_PASS

---

### FASE 3: Server Actions (Mejorar Existentes) 🟡
**Prioridad: ALTA** | **Tiempo Estimado: 2-3 horas**

#### 3.1. Actualizar `reset-password.ts`

**Mejoras a Implementar**:

1. **Rate Limiting Robusto**
   - Implementar Map con timestamps
   - Diferentes límites para request (3) y reset (5)
   - Ventana de 15 minutos
   - Limpiar intentos expirados

2. **requestPasswordResetAction()**
   - Validación Zod del email
   - Verificar usuario existe en DB
   - Generar token con `crypto.randomBytes(32)`
   - Guardar en `password_reset_tokens` con expiración 1 hora
   - Enviar email usando `emailService`
   - Mensaje genérico (no revelar si usuario existe)

3. **resetPasswordAction()**
   - Validar token existe y no expirado
   - Verificar token no usado (`used_at IS NULL`)
   - Validar nueva contraseña (min 8 chars, mayúscula, minúscula, número)
   - Hash con bcrypt (12 rounds)
   - Actualizar `password_hash` en users
   - Marcar token como usado (`used_at = NOW()`)
   - Invalidar sesiones activas en `user_session`

4. **validateResetTokenAction()**
   - Nueva action para validar token al cargar página
   - Retorna `{ valid: boolean, error?: string }`
   - Usado por ResetPasswordForm en useEffect

---

### FASE 4: Componentes UI ✨
**Prioridad: ALTA** | **Tiempo Estimado: 3-4 horas**

#### 4.1. ForgotPasswordForm Component

**Ubicación**: `apps/web/src/features/auth/components/ForgotPasswordForm/`

**Archivos**:
- `ForgotPasswordForm.tsx` - Componente principal
- `ForgotPasswordForm.schema.ts` - Validación Zod
- `index.ts` - Exports

**Características**:
- Input email con validación
- Botón submit con loading state
- Mensajes de éxito/error con Alert
- Link para volver al login
- Design responsivo con shadcn/ui
- Icono Mail destacado

**Validación**:
```typescript
z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
})
```

#### 4.2. ResetPasswordForm Component

**Ubicación**: `apps/web/src/features/auth/components/ResetPasswordForm/`

**Archivos**:
- `ResetPasswordForm.tsx` - Componente principal
- `ResetPasswordForm.schema.ts` - Validación Zod
- `index.ts` - Exports

**Características**:
- Validación token al montar con `useEffect`
- Estados: Loading, Token Inválido, Formulario, Éxito
- Input nueva contraseña con toggle visibilidad
- Input confirmar contraseña
- Indicador fortaleza contraseña en tiempo real
- Requisitos visuales (✓/○ según se cumplan)
- Validación "contraseñas no coinciden"
- Redirect automático a login después de éxito
- Mensajes de error claros

**Validación**:
```typescript
z.object({
  newPassword: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
  confirmPassword: z.string(),
})
.refine(data => data.newPassword === data.confirmPassword)
```

**Indicador de Fortaleza**:
- 4 barras horizontales
- Colores: rojo (débil) → amarillo (media) → verde (fuerte)
- Labels: Débil, Media, Buena, Fuerte

---

### FASE 5: Páginas Next.js ✨
**Prioridad: ALTA** | **Tiempo Estimado: 1 hora**

#### 5.1. Página Forgot Password

**Archivo**: `apps/web/src/app/auth/forgot-password/page.tsx`

```typescript
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <ForgotPasswordForm />
    </div>
  );
}
```

**Metadata**:
- Title: "Recuperar Contraseña | Aprende y Aplica"
- Description: "Recupera el acceso a tu cuenta"

#### 5.2. Página Reset Password

**Archivo**: `apps/web/src/app/auth/reset-password/page.tsx`

```typescript
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <Suspense fallback={<LoadingFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
```

**Nota**: Usar `Suspense` porque usa `useSearchParams()` para obtener token de URL.

---

### FASE 6: Integración con Login Form 🟡
**Prioridad: MEDIA** | **Tiempo Estimado: 15 minutos**

#### 6.1. Agregar Link en LoginForm

**Archivo**: `apps/web/src/features/auth/components/LoginForm/LoginForm.tsx`

Agregar después del campo de contraseña:

```typescript
<div className="flex items-center justify-between">
  <Label htmlFor="password">Contraseña</Label>
  <a
    href="/auth/forgot-password"
    className="text-sm text-blue-600 hover:underline"
  >
    ¿Olvidaste tu contraseña?
  </a>
</div>
```

---

## 🧪 Testing y Validación

### Checklist de Testing Completo

#### ✅ **Backend Testing**
- [ ] **Base de Datos**
  - [ ] Tabla `password_reset_tokens` creada
  - [ ] Foreign key a `users` funciona
  - [ ] Índices creados correctamente

- [ ] **Generación de Tokens**
  - [ ] Token es aleatorio (64 caracteres hex)
  - [ ] Expiración es exactamente 1 hora
  - [ ] Token se guarda correctamente en DB

- [ ] **Rate Limiting**
  - [ ] Bloquea después de 3 solicitudes de reset
  - [ ] Bloquea después de 5 intentos de reset
  - [ ] Ventana de 15 minutos funciona
  - [ ] Limpia intentos expirados

- [ ] **Email Service**
  - [ ] Email se envía correctamente
  - [ ] Template HTML se renderiza bien
  - [ ] Template texto plano funciona
  - [ ] Enlace es clickeable

- [ ] **Server Actions**
  - [ ] requestPasswordResetAction retorna mensaje genérico
  - [ ] resetPasswordAction valida token correctamente
  - [ ] validateResetTokenAction funciona
  - [ ] Token usado no puede reutilizarse
  - [ ] Sesiones se invalidan correctamente

#### ✅ **Frontend Testing**
- [ ] **Forgot Password Page**
  - [ ] Página `/auth/forgot-password` se renderiza
  - [ ] Input email valida formato
  - [ ] Mensaje de éxito se muestra
  - [ ] Mensaje de error se muestra
  - [ ] Link "Volver al login" funciona

- [ ] **Reset Password Page**
  - [ ] Página `/auth/reset-password` se renderiza
  - [ ] Token se extrae de URL correctamente
  - [ ] Validación de token al montar funciona
  - [ ] Token inválido muestra error
  - [ ] Token expirado muestra error
  - [ ] Formulario se muestra con token válido

- [ ] **Password Strength Indicator**
  - [ ] Barras se colorean correctamente
  - [ ] Labels actualizan (Débil, Media, Buena, Fuerte)
  - [ ] Requisitos muestran ✓ cuando se cumplen
  - [ ] Todos los requisitos se validan

- [ ] **Form Validation**
  - [ ] Error "contraseñas no coinciden" funciona
  - [ ] Validación mínimo 8 caracteres
  - [ ] Validación mayúscula/minúscula/número
  - [ ] Submit solo activo con contraseña válida

- [ ] **UX Flow**
  - [ ] Loading states se muestran correctamente
  - [ ] Redirect a login después de éxito
  - [ ] Mensajes claros en cada estado

#### ✅ **Security Testing**
- [ ] **Token Security**
  - [ ] Tokens son verdaderamente aleatorios
  - [ ] Tokens no pueden adivinarse
  - [ ] Token de un solo uso no reutilizable
  - [ ] Tokens expirados se rechazan

- [ ] **Rate Limiting**
  - [ ] No bypass posible cambiando IP
  - [ ] Ventana de tiempo se respeta
  - [ ] Límites diferentes para request/reset

- [ ] **Information Disclosure**
  - [ ] No se revela si email existe
  - [ ] Mensajes de error genéricos
  - [ ] No se filtra información sensible

- [ ] **Password Security**
  - [ ] Bcrypt con 12 rounds
  - [ ] Contraseña anterior no reutilizable
  - [ ] Validación fortaleza en backend también

- [ ] **Session Management**
  - [ ] Sesiones antiguas se invalidan
  - [ ] Usuario debe re-loguearse
  - [ ] Cookies se limpian correctamente

---

## 📊 Métricas de Éxito

### KPIs Técnicos
```yaml
Performance:
  - Token generation time: < 100ms
  - Email delivery time: < 5s
  - Page load time: < 2s
  - Form validation response: < 100ms

Reliability:
  - Email delivery success rate: > 99%
  - Token validation accuracy: 100%
  - Rate limiting effectiveness: 100%

Security:
  - Failed token validation attempts: < 5% of total
  - Blocked rate limit attempts: monitored
  - Expired token cleanup: daily
```

### KPIs de Usuario
```yaml
Usability:
  - Password reset completion rate: > 80%
  - Time to complete reset: < 5 minutes
  - Email open rate: > 60%
  - Link click rate: > 80%

Satisfaction:
  - User error rate: < 10%
  - Support tickets related to password reset: < 5/week
```

---

## 🚀 Deployment

### Pre-Deployment Checklist

#### ✅ **Environment Variables**
```env
# Verificar en .env.local (development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Configurar en Vercel/producción
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=production-email@gmail.com
SMTP_PASS=production-app-password
NEXT_PUBLIC_APP_URL=https://aprendeyaplica.ai
```

#### ✅ **Database**
- [ ] Migración ejecutada en Supabase producción
- [ ] Tabla `password_reset_tokens` existe
- [ ] Índices creados
- [ ] Foreign keys funcionando
- [ ] Permisos RLS configurados (si aplica)

#### ✅ **Code Quality**
- [ ] TypeScript compila sin errores
- [ ] ESLint sin warnings críticos
- [ ] Todos los tests pasando
- [ ] No console.error en production

#### ✅ **Security**
- [ ] Rate limiting testeado
- [ ] Tokens generación segura
- [ ] Email templates revisados
- [ ] No información sensible en logs

#### ✅ **Monitoring**
- [ ] Error tracking configurado (Sentry)
- [ ] Email delivery monitoring
- [ ] Rate limit alerts
- [ ] Token usage metrics

### Deployment Steps
```bash
# 1. Verificar todo está committed
git status

# 2. Ejecutar migración DB en producción
supabase db push --remote

# 3. Build y test local
cd apps/web
npm run build
npm run start # Verificar funciona

# 4. Deploy a Vercel/producción
git push origin main
# O: vercel --prod

# 5. Smoke tests en producción
# - Solicitar recuperación con email real
# - Verificar email llega
# - Completar flujo de reset
# - Verificar login con nueva contraseña
```

---

## 🛠️ Troubleshooting

### Problemas Comunes y Soluciones

#### 1. Email no se envía

**Síntomas**:
- Error "Email service not configured"
- Email nunca llega
- Timeout en envío

**Causas Posibles**:
- Variables SMTP incorrectas
- App Password no generada
- Puerto bloqueado por firewall
- Gmail bloqueando acceso

**Soluciones**:
```yaml
Gmail:
  1. Verificar 2FA está activado
  2. Generar App Password específica
  3. Usar puerto 587 con TLS
  4. Verificar "Less secure apps" si usa password normal

Outlook/Hotmail:
  1. Usar puerto 587
  2. Configurar TLS
  3. Verificar cuenta no bloqueada

Debugging:
  1. Verificar logs: console.log en emailService
  2. Test manual con nodemailer
  3. Verificar SMTP_USER es email completo
  4. Verificar SMTP_PASS es app password correcto
```

#### 2. Token siempre inválido

**Síntomas**:
- "Token inválido" siempre
- Validación falla incluso con token correcto

**Causas Posibles**:
- Tabla no existe
- Token no se guardó en DB
- Foreign key roto
- Query incorrect

**Soluciones**:
```bash
# Verificar tabla existe
# En Supabase SQL Editor:
SELECT * FROM password_reset_tokens LIMIT 1;

# Verificar foreign key
SELECT * FROM password_reset_tokens WHERE user_id = 'algún-uuid';

# Verificar token se guarda
# Agregar console.log después de insert
console.log('Token guardado:', resetToken);
```

#### 3. Rate limiting muy agresivo

**Síntomas**:
- "Demasiados intentos" inmediatamente
- No permite intentos válidos

**Causas Posibles**:
- IP detection incorrecto
- Map no se limpia
- Ventana muy corta

**Soluciones**:
```typescript
// En development, aumentar límites
const MAX_REQUEST_ATTEMPTS = 10; // En lugar de 3

// Agregar limpieza periódica
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestAttempts.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW) {
      requestAttempts.delete(ip);
    }
  }
}, 60000); // Cada minuto
```

#### 4. Sesiones no se invalidan

**Síntomas**:
- Usuario sigue logueado después de reset
- Token válido pero sesión persiste

**Causas Posibles**:
- UPDATE no ejecuta
- user_id incorrecto
- Middleware no chequea revoked

**Soluciones**:
```typescript
// Agregar logging
console.log('Invalidando sesiones para user_id:', tokenData.user_id);

const { data, error } = await supabase
  .from('user_session')
  .update({ revoked: true })
  .eq('user_id', tokenData.user_id);

console.log('Sesiones invalidadas:', data, error);

// Verificar en middleware
const session = await supabase
  .from('user_session')
  .select('revoked')
  .eq('jwt_id', sessionToken)
  .single();

if (session.data?.revoked) {
  // Redirect a login
}
```

#### 5. Token expira muy rápido

**Síntomas**:
- Token expirado incluso recién generado
- Usuario no tiene tiempo de completar reset

**Causas Posibles**:
- Expiración calculada incorrectamente
- Timezone issues
- Comparación timestamp incorrecta

**Soluciones**:
```typescript
// Verificar cálculo de expiración
const expiresAt = new Date(Date.now() + 3600000); // 1 hora en ms
console.log('Token expira en:', expiresAt);

// Verificar comparación
const now = new Date();
const expiresAt = new Date(tokenData.expires_at);
console.log('Ahora:', now);
console.log('Expira:', expiresAt);
console.log('Diferencia:', expiresAt - now); // Debe ser positivo
```

---

## 📚 Referencias y Recursos

### Documentación Sistema Anterior
- **Archivo**: `docs/SISTEMA_ANTERIOR.md`
- **Líneas 586-1906**: Sistema completo de recuperación de contraseña
- **Puntos Clave**:
  - Rate limiting implementado
  - Servicio de email con templates profesionales
  - Validación fortaleza contraseña en tiempo real
  - Sistema de tokens seguro

### Documentación Sistema Actual
- **Archivo**: `docs/AUTH_SYSTEM.md`
- **Líneas 439-556**: Flujo de recuperación de contraseña
- **Puntos Clave**:
  - Server Actions estructura
  - Sistema de sesiones
  - Base de datos schema

### Mejores Prácticas Seguridad
- [OWASP Password Reset Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)

### Documentación Técnica
- [Nodemailer Documentation](https://nodemailer.com/)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

---

## 🎯 Cronograma de Implementación

### Semana 1: Backend y Base de Datos
```yaml
Día 1-2:
  - [ ] Crear tabla password_reset_tokens
  - [ ] Ejecutar migración
  - [ ] Testing de tabla y foreign keys

Día 3-4:
  - [ ] Implementar email service
  - [ ] Configurar SMTP
  - [ ] Testing envío de emails
  - [ ] Diseñar templates HTML/texto

Día 5:
  - [ ] Actualizar reset-password.ts
  - [ ] Implementar rate limiting
  - [ ] Testing server actions
```

### Semana 2: Frontend y UI
```yaml
Día 1-2:
  - [ ] Crear ForgotPasswordForm
  - [ ] Schemas de validación
  - [ ] Testing componente

Día 3-4:
  - [ ] Crear ResetPasswordForm
  - [ ] Indicador fortaleza contraseña
  - [ ] Testing componente

Día 5:
  - [ ] Crear páginas Next.js
  - [ ] Integrar con LoginForm
  - [ ] Testing end-to-end
```

### Semana 3: Testing y Deployment
```yaml
Día 1-2:
  - [ ] Testing completo de flujo
  - [ ] Security testing
  - [ ] Performance testing

Día 3-4:
  - [ ] Configurar producción
  - [ ] Deployment
  - [ ] Smoke tests en producción

Día 5:
  - [ ] Monitoring y ajustes
  - [ ] Documentación final
  - [ ] Handoff a equipo
```

---

## ✅ Checklist Final de Entrega

### Funcionalidad
- [ ] Usuario puede solicitar recuperación desde login
- [ ] Email llega en < 5 segundos
- [ ] Enlace en email funciona
- [ ] Página reset valida token correctamente
- [ ] Indicador fortaleza funciona
- [ ] Contraseña se actualiza exitosamente
- [ ] Usuario puede hacer login con nueva contraseña
- [ ] Sesiones antiguas se invalidan

### Seguridad
- [ ] Rate limiting funciona
- [ ] Tokens son aleatorios y seguros
- [ ] Tokens expiran en 1 hora
- [ ] Tokens de un solo uso
- [ ] No se revela existencia de usuario
- [ ] Contraseña se hashea con bcrypt 12 rounds
- [ ] No hay SQL injection posible
- [ ] No hay XSS posible

### UX/UI
- [ ] Design responsivo (mobile/tablet/desktop)
- [ ] Loading states claros
- [ ] Mensajes de error útiles
- [ ] Validación en tiempo real
- [ ] Accesibilidad (keyboard navigation, screen readers)
- [ ] Colores y branding consistentes

### Código
- [ ] TypeScript sin errores
- [ ] ESLint sin warnings
- [ ] Código comentado apropiadamente
- [ ] Funciones con JSDoc
- [ ] Nombres descriptivos
- [ ] Separación de concerns

### Documentación
- [ ] README actualizado
- [ ] Variables de entorno documentadas
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] API documentation (server actions)

### Testing
- [ ] Tests unitarios componentes
- [ ] Tests integración server actions
- [ ] Tests end-to-end flujo completo
- [ ] Tests seguridad
- [ ] Tests performance

### Monitoring
- [ ] Error tracking configurado
- [ ] Email delivery monitoring
- [ ] Rate limit alerts
- [ ] Performance metrics
- [ ] User analytics

---

## 🔮 Mejoras Futuras

### Fase 2: Seguridad Avanzada
```yaml
Features:
  - [ ] 2FA para recuperación de contraseña
  - [ ] Notificación email cuando contraseña cambia
  - [ ] Historial de cambios de contraseña
  - [ ] Detectar patrones sospechosos (múltiples intentos)
  - [ ] Blacklist de contraseñas comunes
  - [ ] Verificación adicional por SMS

Timeline: 2-3 semanas
Priority: High
```

### Fase 3: UX Mejorada
```yaml
Features:
  - [ ] Magic link login (sin contraseña)
  - [ ] Biometric authentication (Face ID, Touch ID)
  - [ ] Social login recovery (Google, Facebook)
  - [ ] Progress indicator en flujo completo
  - [ ] Sugerencias de contraseña segura
  - [ ] Dark mode support

Timeline: 3-4 semanas
Priority: Medium
```

### Fase 4: Analytics y Monitoring
```yaml
Features:
  - [ ] Dashboard de métricas recuperación
  - [ ] Alertas para intentos sospechosos
  - [ ] Analytics de tiempo de recuperación
  - [ ] A/B testing de emails
  - [ ] Heatmaps de interacción
  - [ ] Funnel analysis

Timeline: 2 semanas
Priority: Low
```

### Fase 5: Internacionalización
```yaml
Features:
  - [ ] Emails en múltiples idiomas
  - [ ] UI traducida (i18n)
  - [ ] Formatos de fecha localizados
  - [ ] Soporte RTL (árabe, hebreo)

Timeline: 1-2 semanas
Priority: Low
```

---

## 💡 Lecciones del Sistema Anterior

### ✅ Qué Mantener
1. **Rate Limiting**: Muy efectivo, mantener límites (3 request, 5 reset)
2. **Email Templates**: Design profesional funcionó bien
3. **Token Security**: crypto.randomBytes(32) es suficientemente seguro
4. **Validación Fortaleza**: Indicador visual en tiempo real es excelente UX
5. **Mensajes Genéricos**: No revelar existencia usuario es crítico

### 🔄 Qué Mejorar
1. **Arquitectura**: Migrar de Netlify Functions a Next.js Server Actions
2. **UI Framework**: Usar shadcn/ui en lugar de CSS custom
3. **Validación**: Usar Zod en frontend y backend para consistencia
4. **Type Safety**: Agregar tipos TypeScript completos
5. **Testing**: Implementar tests automatizados desde inicio

### ❌ Qué Evitar
1. **Supabase Auth Directo**: Sistema anterior intentaba usar y fallaba, mejor custom
2. **Logging Excesivo**: Reducir logs en producción
3. **Hardcoded Values**: Usar variables de entorno para todo
4. **Magic Numbers**: Definir constantes para tiempos y límites

---

## 📞 Soporte y Contacto

### Para Problemas Técnicos
- **Developer**: Claude Code
- **Documentation**: Este archivo
- **Issues**: GitHub Issues (si aplicable)

### Para Testing
- **Email de Prueba**: Usar email personal para testing
- **Supabase**: Dashboard para verificar DB
- **Logs**: Console logs y Vercel logs

---

## ✅ Conclusión

Este plan proporciona una hoja de ruta completa y detallada para implementar un sistema robusto de recuperación de contraseña que cumple con:

✅ **Seguridad Empresarial**
- Rate limiting
- Tokens seguros de un solo uso
- Hashing bcrypt con 12 rounds
- No revelación de información sensible

✅ **UX Optimizada**
- Validación en tiempo real
- Indicadores visuales claros
- Mensajes de error útiles
- Flujo intuitivo

✅ **Arquitectura Moderna**
- Next.js Server Actions
- React Components modulares
- TypeScript para type safety
- shadcn/ui para UI consistente

✅ **Escalabilidad**
- Base de datos eficiente con índices
- Servicios modulares y reutilizables
- Caching donde apropiado
- Performance optimizado

✅ **Mantenibilidad**
- Código limpio y bien documentado
- Separación de concerns
- Convenciones consistentes
- Testing comprehensivo

**Tiempo Total Estimado**: 2-3 semanas
**Complejidad**: Media-Alta
**Riesgo**: Bajo (siguiendo este plan)
**ROI**: Alto (funcionalidad crítica para usuarios)

---

**Última actualización**: 25 de enero de 2025
**Versión**: 1.0
**Autor**: Claude Code
**Proyecto**: Aprende y Aplica - Sistema de Autenticación
