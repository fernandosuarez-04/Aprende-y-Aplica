'use server'

import { createClient } from '../../../lib/supabase/server'
import { AuthService } from '../services/auth.service'
import { SessionService } from '../services/session.service'
import { RefreshTokenService } from '../../../lib/auth/refreshToken.service'
import { SECURE_COOKIE_OPTIONS, getCustomCookieOptions } from '../../../lib/auth/cookie-config'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { cookies, headers } from 'next/headers'

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'El correo o usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().default(false),
})

export async function loginAction(formData: FormData) {
  try {
    // 1. Validar datos
    const parsed = loginSchema.parse({
      emailOrUsername: formData.get('emailOrUsername'),
      password: formData.get('password'),
      rememberMe: formData.get('rememberMe') === 'true',
    })

    // 2. Crear cliente Supabase
    const supabase = await createClient()

    // 3. Obtener contexto de organización si viene de login personalizado
    const organizationId = formData.get('organizationId')?.toString()
    const organizationSlug = formData.get('organizationSlug')?.toString()

    // 3. Buscar usuario y validar contraseña (como en tu sistema anterior)
    // Buscar usuario por username o email (case-insensitive match exacto)
    let { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, email_verified, cargo_rol, type_rol, is_banned, ban_reason')
      .or(`username.ilike.${parsed.emailOrUsername},email.ilike.${parsed.emailOrUsername}`)
      .single()

    if (error || !user) {
      return { error: 'Credenciales inválidas' }
    }

    // ⭐ MODERACIÓN: Verificar si el usuario está baneado
    if ((user as any).is_banned) {
      return { 
        error: `❌ Tu cuenta ha sido suspendida por violaciones de las reglas de la comunidad. ${(user as any).ban_reason || ''}`,
        banned: true
      }
    }

    // 4. Verificar contraseña con bcrypt (como en tu sistema anterior)
    if (!user.password_hash) {
      return { error: 'Error en la configuración de la cuenta. Por favor, contacta al soporte.' }
    }

    const passwordValid = await bcrypt.compare(parsed.password, user.password_hash)

    if (!passwordValid) {
      
      // Crear notificación de intento de inicio de sesión fallido
      try {
        const { AutoNotificationsService } = await import('../../notifications/services/auto-notifications.service')
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   headersList.get('x-real-ip') ||
                   'unknown'
        const userAgent = headersList.get('user-agent') || 'unknown'
        
        await AutoNotificationsService.notifyLoginFailed(user.id, ip, userAgent, {
          timestamp: new Date().toISOString()
        })
      } catch (notificationError) {
        // No lanzar error para no afectar el flujo principal
        // Error silenciado para no exponer información
      }

      return { error: 'Credenciales inválidas' }
    }

    // 4.5. Validar contexto de organización si viene de login personalizado
    if (organizationId && organizationSlug) {
      // Verificar que la organización existe y tiene suscripción válida
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('id, slug, subscription_plan, subscription_status, is_active')
        .eq('id', organizationId)
        .eq('slug', organizationSlug)
        .single()

      if (orgError || !organization) {
        return { error: 'Organización no encontrada' }
      }

      // Validar que puede usar login personalizado
      const allowedPlans = ['team', 'business', 'enterprise']
      const activeStatuses = ['active', 'trial']
      
      if (!allowedPlans.includes(organization.subscription_plan) || 
          !activeStatuses.includes(organization.subscription_status) ||
          !organization.is_active) {
        return { error: 'Esta organización no tiene acceso a login personalizado' }
      }

      // Verificar pertenencia a organización (users.organization_id y organization_users)
      const belongsViaDirect = user.organization_id === organizationId

      // Verificar organization_users
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id, joined_at')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single()

      const belongsViaTable = !!orgUser
      const belongsToOrganization = belongsViaDirect || belongsViaTable

      if (!belongsToOrganization) {
        // Usuario NO pertenece a esta organización - buscar su organización correcta
        let correctSlug: string | null = null

        // Prioridad 1: Buscar en organization_users (más reciente por joined_at)
        const { data: userOrgs } = await supabase
          .from('organization_users')
          .select('organization_id, joined_at, organizations!inner(slug)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('joined_at', { ascending: false })
          .limit(1)

        if (userOrgs && userOrgs.length > 0) {
          correctSlug = userOrgs[0].organizations?.slug || null
        } else if (user.organization_id) {
          // Prioridad 2: Si no hay en organization_users, usar users.organization_id
          const { data: userOrg } = await supabase
            .from('organizations')
            .select('slug')
            .eq('id', user.organization_id)
            .single()

          if (userOrg) {
            correctSlug = userOrg.slug
          }
        }

        // Retornar error con información de redirección
        if (correctSlug) {
          return {
            error: 'Este usuario no pertenece a esta organización',
            redirectTo: `/auth/${correctSlug}`,
            redirectMessage: `Serás redirigido a tu organización en 5 segundos...`
          }
        } else {
          return {
            error: 'Este usuario no pertenece a esta organización',
            redirectTo: '/auth',
            redirectMessage: 'Serás redirigido al login principal en 5 segundos...'
          }
        }
      }
    }

    // 5. Verificar email (RF-012) - TEMPORAL: Comentado
    // if (!user.email_verified) {
    //   return { 
    //     error: 'Debes verificar tu email antes de iniciar sesión',
    //     requiresVerification: true,
    //     userId: user.id 
    //   }
    // }

    // 6. Crear sesión personalizada (sin Supabase Auth)
    try {
      // ✅ Obtener cookieStore DENTRO del try para mantener el contexto AsyncLocalStorage
      const cookieStore = await cookies()
      const headersList = await headers()
      const userAgent = headersList.get('user-agent') || 'unknown'
      const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                 headersList.get('x-real-ip') ||
                 'unknown'

      // Crear Request mock para RefreshTokenService
      const requestHeaders = new Headers()
      requestHeaders.set('user-agent', userAgent)
      requestHeaders.set('x-real-ip', ip)
      const mockRequest = new Request('http://localhost', {
        headers: requestHeaders
      })

      // 6.1. Crear sesión con refresh tokens (genera tokens y los guarda en DB)
      const sessionInfo = await RefreshTokenService.createSession(
        user.id,
        parsed.rememberMe,
        mockRequest
      )

      // 6.2. Crear sesión legacy ANTES de establecer cookies
      const legacySession = await SessionService.createLegacySession(
        user.id,
        parsed.rememberMe
      )

      // 6.3. Establecer TODAS las cookies usando la misma instancia de cookieStore
      // IMPORTANTE: Reutilizar cookieStore obtenido anteriormente para mantener el contexto
      // NOTA: cookieStore.set() NO es async en Next.js 15 - no requiere await

      // Establecer cookie access_token
      cookieStore.set('access_token', sessionInfo.accessToken, {
        ...SECURE_COOKIE_OPTIONS,
        expires: sessionInfo.accessExpiresAt,
      });

      // Establecer cookie refresh_token
      cookieStore.set('refresh_token', sessionInfo.refreshToken, {
        ...SECURE_COOKIE_OPTIONS,
        expires: sessionInfo.refreshExpiresAt,
      });

      // Establecer cookie legacy
      const maxAge = parsed.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      cookieStore.set('aprende-y-aplica-session', legacySession.sessionToken, {
        ...getCustomCookieOptions(maxAge),
        expires: legacySession.expiresAt,
      });

      // OPTIMIZACIÓN: Crear notificación en background (no await)
      // No bloqueamos el login esperando la notificación
      (async () => {
        try {
          const { AutoNotificationsService } = await import('../../notifications/services/auto-notifications.service')
          await AutoNotificationsService.notifyLoginSuccess(user.id, ip, userAgent, {
            rememberMe: parsed.rememberMe,
            timestamp: new Date().toISOString()
          })
        } catch (notificationError) {
          // Error silenciado para no exponer información
        }
      })().catch(() => {}) // Fire and forget
    } catch (sessionError) {
      // Log del error para debugging
      console.error('Error creando sesión:', sessionError)
      return { error: 'Error al crear la sesión. Por favor, intenta nuevamente.' }
    }

    // 7. Limpiar sesiones expiradas (mantenimiento)
    try {
      await AuthService.clearExpiredSessions()
    } catch (clearError) {
      // No fallar el login si falla la limpieza
    }

    // 7. Si NO es login personalizado (login general), verificar si usuario tiene organización
    // Si tiene organización, redirigir a su login personalizado antes de redirigir según rol
    if (!organizationId && !organizationSlug) {
      // OPTIMIZACIÓN: Paralelizar búsqueda de organización en ambas tablas
      let userOrgSlug: string | null = null

      const orgQueries = [
        // Query 1: Buscar en organization_users (más reciente por joined_at)
        supabase
          .from('organization_users')
          .select('organization_id, joined_at, organizations!inner(slug)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('joined_at', { ascending: false })
          .limit(1)
      ];

      // Query 2: Si usuario tiene organization_id, buscar en organizations
      if (user.organization_id) {
        orgQueries.push(
          supabase
            .from('organizations')
            .select('slug')
            .eq('id', user.organization_id)
            .single()
        );
      }

      // Ejecutar queries en paralelo
      const orgResults = await Promise.all(orgQueries);
      const userOrgsResult = orgResults[0];
      const userOrgResult = orgResults.length > 1 ? orgResults[1] : null;

      // Prioridad 1: organization_users
      if (userOrgsResult.data && userOrgsResult.data.length > 0) {
        userOrgSlug = userOrgsResult.data[0].organizations?.slug || null;
      } else if (userOrgResult && userOrgResult.data) {
        // Prioridad 2: users.organization_id
        userOrgSlug = userOrgResult.data.slug;
      }

      // Si usuario tiene organización, redirigir a su login personalizado
      if (userOrgSlug) {
        redirect(`/auth/${userOrgSlug}`)
      }
    }

    // 8. Redirigir según el rol del usuario
    const normalizedRole = user.cargo_rol?.trim();

    if (normalizedRole === 'Administrador') {
      redirect('/admin/dashboard')
    } else if (normalizedRole === 'Instructor') {
      redirect('/instructor/dashboard')
    } else if (normalizedRole === 'Business') {
      redirect('/business-panel/dashboard')
    } else if (normalizedRole === 'Business User') {
      redirect('/business-user/dashboard')
    } else {
      redirect('/dashboard')
    }
  } catch (error) {
    // Manejar redirect de Next.js (no es un error real)
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as any).digest
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        // Es una redirección, no un error - re-lanzar para que Next.js la maneje
        throw error
      }
    }

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { error: firstError?.message || 'Error de validación' }
    }

    // Proporcionar mensajes de error más específicos
    if (error instanceof Error) {
      // Mensajes de error más específicos según el tipo
      if (error.message.includes('password_hash') || error.message.includes('password')) {
        return { error: 'Error al verificar las credenciales. Por favor, intenta nuevamente.' }
      }
      
      if (error.message.includes('session') || error.message.includes('cookie')) {
        return { error: 'Error al crear la sesión. Por favor, verifica las cookies de tu navegador.' }
      }
    }

    // Proporcionar mensaje de error más descriptivo
    const errorMessage = (error as any)?.message || 'Error inesperado al iniciar sesión';
    return { error: errorMessage }
  }
}
