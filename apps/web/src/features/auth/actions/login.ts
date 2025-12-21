'use server'

import { createClient } from '../../../lib/supabase/server'
import { AuthService } from '../services/auth.service'
import { SessionService } from '../services/session.service'
import { RefreshTokenService } from '../../../lib/auth/refreshToken.service'
import { SECURE_COOKIE_OPTIONS, getCustomCookieOptions } from '../../../lib/auth/cookie-config'
import { z } from 'zod'
// redirect no se usa directamente - devolvemos redirectTo para que el cliente maneje la navegación
import bcrypt from 'bcryptjs'
import { cookies, headers } from 'next/headers'
import { logger } from '../../../lib/logger'

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'El correo o usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().default(false),
})

export async function loginAction(formData: FormData) {
  try {
    console.log('🔐 [loginAction] Iniciando login...')

    // 1. Validar datos
    const parsed = loginSchema.parse({
      emailOrUsername: formData.get('emailOrUsername'),
      password: formData.get('password'),
      rememberMe: formData.get('rememberMe') === 'true',
    })

    console.log('📧 [loginAction] Buscando usuario:', parsed.emailOrUsername)

    // 2. Crear cliente Supabase
    const supabase = await createClient()

    // 3. Obtener contexto de organización si viene de login personalizado
    const organizationId = formData.get('organizationId')?.toString()
    const organizationSlug = formData.get('organizationSlug')?.toString()

    // 3. Buscar usuario y validar contraseña (como en tu sistema anterior)
    // Buscar usuario por username o email (case-insensitive match exacto)

    // Intentar buscar por username primero
    console.log('🔍 [loginAction] Buscando usuario con:', {
      input: parsed.emailOrUsername,
      isEmail: parsed.emailOrUsername.includes('@')
    });

    let { data: userByUsername, error: usernameError } = await supabase
      .from('users')
      .select('id, username, email, password_hash, email_verified, cargo_rol, type_rol, is_banned, ban_reason')
      .select('id, username, email, password_hash, email_verified, cargo_rol, type_rol, is_banned, ban_reason')
      .ilike('username', parsed.emailOrUsername)
      .maybeSingle()

    console.log('🔍 [loginAction] Resultado búsqueda por username:', {
      found: !!userByUsername,
      username: userByUsername?.username,
      error: usernameError?.message
    });

    // Si no se encuentra por username, buscar por email
    let { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('id, username, email, password_hash, email_verified, cargo_rol, type_rol, is_banned, ban_reason')
      .ilike('email', parsed.emailOrUsername)
      .maybeSingle()

    console.log('🔍 [loginAction] Resultado búsqueda por email:', {
      found: !!userByEmail,
      email: userByEmail?.email,
      error: emailError?.message
    });

    // Determinar qué usuario usar (prioridad: username > email)
    const user = userByUsername || userByEmail
    const error = userByUsername ? usernameError : emailError

    console.log('🔍 [loginAction] Resultado búsqueda:', {
      userByUsername: userByUsername ? 'encontrado' : 'no encontrado',
      userByEmail: userByEmail ? 'encontrado' : 'no encontrado',
      usernameError: usernameError?.message || null,
      emailError: emailError?.message || null,
    })

    if (error || !user) {
      console.log('❌ [loginAction] Usuario NO encontrado:', {
        usernameError: usernameError?.message,
        emailError: emailError?.message,
        inputProvided: parsed.emailOrUsername
      });      console.log('❌ [loginAction] Usuario NO encontrado en la base de datos')
      return { error: 'Credenciales inválidas' }
    }

    // Intentar obtener organization_id de forma separada (la columna puede no existir)
    let userOrganizationId: string | null = null
    const { data: orgData, error: orgError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!orgError && orgData) {
      userOrganizationId = orgData.organization_id || null
    } else if (orgError) {
      // La columna organization_id puede no existir - continuar sin ella
      console.log('ℹ️ [loginAction] Columna organization_id no disponible:', orgError.message)
    }

    // Reasignar user con organization_id incluido
    const user_final = { ...user, organization_id: userOrganizationId } as typeof user & { organization_id: string | null }

    console.log('👤 [loginAction] Usuario encontrado:', {
      id: user.id,
      username: user.username,
      email: user.email,
      cargo_rol: user.cargo_rol
    });

    // ⭐ MODERACIÓN: Verificar si el usuario está baneado
    if ((user as any).is_banned) {
      return {
        error: `❌ Tu cuenta ha sido suspendida por violaciones de las reglas de la comunidad. ${(user as any).ban_reason || ''}`,
        banned: true
      }
    }

    // 4. Verificar contraseña con bcrypt (como en tu sistema anterior)
    if (!user.password_hash) {
      console.log('❌ [loginAction] Usuario sin password_hash configurado')
      return { error: 'Error en la configuración de la cuenta. Por favor, contacta al soporte.' }
    }

    console.log('🔑 [loginAction] Verificando contraseña...', {
      hasPasswordHash: !!user.password_hash,
      hashLength: user.password_hash.length,
    })

    const passwordValid = await bcrypt.compare(parsed.password, user.password_hash)
    console.log('🔑 [loginAction] Contraseña válida:', passwordValid)

    if (!passwordValid) {
      console.log('❌ [loginAction] Contraseña incorrecta')

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
      // Ampliamos planes y estados para evitar falsos negativos en organizaciones válidas
      const allowedPlans = ['team', 'business', 'enterprise', 'pro', 'premium', 'basic']
      const activeStatuses = ['active', 'trial', 'trialing']

      const planOk = !organization.subscription_plan || allowedPlans.includes(organization.subscription_plan)
      const statusOk = !organization.subscription_status || activeStatuses.includes(organization.subscription_status)
      const isActiveOk = organization.is_active === undefined || organization.is_active === null || organization.is_active === true

      if (!planOk || !statusOk || !isActiveOk) {
        return { error: 'Esta organización no tiene acceso a login personalizado' }
      }

      // Verificar pertenencia a organización (users.organization_id y organization_users)
      const belongsViaDirect = user_final.organization_id === organizationId

      // Verificar organization_users
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id, joined_at')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single()

      const belongsToOrganization = !!orgUser

      if (!belongsToOrganization) {
        // Usuario NO pertenece a esta organización - buscar su organización correcta
        let correctSlug: string | null = null

        // Buscar en organization_users (más reciente por joined_at)
        const { data: userOrgs } = await supabase
          .from('organization_users')
          .select('organization_id, joined_at, organizations!inner(slug)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('joined_at', { ascending: false })
          .limit(1)

        if (userOrgs && userOrgs.length > 0) {
          correctSlug = userOrgs[0].organizations?.slug || null
        } else if (user_final.organization_id) {
          // Prioridad 2: Si no hay en organization_users, usar users.organization_id
          const { data: userOrg } = await supabase
            .from('organizations')
            .select('slug')
            .eq('id', user_final.organization_id)
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

      console.log('📋 [loginAction] Contexto obtenido:', {
        hasHeaders: !!headersList,
        userAgent: userAgent.substring(0, 50),
        ip
      });

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

      // Crear notificación de login (con timeout para no bloquear demasiado)
      try {
        logger.info('🔔 Iniciando creación de notificación de login', { userId: user.id })
        const { AutoNotificationsService } = await import('../../notifications/services/auto-notifications.service')

        // Usar Promise.race con timeout para no bloquear el login más de 2 segundos
        await Promise.race([
          AutoNotificationsService.notifyLoginSuccess(user.id, ip, userAgent, {
            rememberMe: parsed.rememberMe,
            timestamp: new Date().toISOString()
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 2000)
          )
        ]).catch((error) => {
          // Si es timeout, continuar sin bloquear
          if (error instanceof Error && error.message === 'Timeout') {
            logger.warn('⏱️ Timeout en notificación de login, continuando', { userId: user.id })
          } else {
            logger.error('❌ Error en notificación de login:', {
              userId: user.id,
              error: error instanceof Error ? error.message : String(error)
            })
          }
        })
        logger.info('✅ Notificación de login procesada', { userId: user.id })
      } catch (notificationError) {
        // Log del error pero no bloquear el login
        logger.error('❌ Error en notificación de login:', {
          userId: user.id,
          error: notificationError instanceof Error ? notificationError.message : String(notificationError)
        })
      }

    } catch (sessionError) {
      // Log del error para debugging
      console.error('❌ [loginAction] Error crítico creando sesión:', {
        error: sessionError,
        message: (sessionError as any)?.message,
        stack: (sessionError as any)?.stack
      })
      return { error: 'Error al crear la sesión. Por favor, intenta nuevamente.' }
    }

    // 7. Limpiar sesiones expiradas (mantenimiento)
    try {
      await AuthService.clearExpiredSessions()
    } catch (clearError) {
      // No fallar el login si falla la limpieza
    }

    // 7. Redirigir según el rol del usuario (ya autenticado exitosamente)
    const normalizedRole = user_final.cargo_rol?.trim();
    console.log('🎯 [loginAction] Determinando redirección según rol:', {
      cargo_rol: user_final.cargo_rol,
      normalizedRole,
      organization_id: user_final.organization_id
    });

    // En lugar de usar redirect(), devolver la URL para que el cliente maneje la navegación
    // Esto evita problemas de "redirect count exceeded" en Next.js
    let redirectTo = '/dashboard'; // Default

    if (normalizedRole === 'Administrador') {
      redirectTo = '/admin/dashboard';
    } else if (normalizedRole === 'Business' || normalizedRole === 'Business User') {
      // Para roles de empresa, verificar que pertenezca a una organización
      const { data: userOrg, error: orgError } = await supabase
        .from('organization_users')
        .select('organization_id, status, organizations!inner(id, name, slug, is_active)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (orgError || !userOrg) {
        console.log('⚠️ [loginAction] Usuario Business sin organización activa:', {
          userId: user.id,
          cargo_rol: normalizedRole,
          error: orgError?.message
        })
        redirectTo = '/dashboard'; // Sin organización, ir al dashboard normal
      } else {
        console.log('✅ [loginAction] Usuario Business con organización:', {
          userId: user.id,
          cargo_rol: normalizedRole,
          organizationId: userOrg.organization_id,
          organizationName: userOrg.organizations?.name
        })

        // Redirigir según el rol específico
        if (normalizedRole === 'Business') {
          redirectTo = '/business-panel/dashboard';
        } else {
          redirectTo = '/business-user/dashboard';
        }
      }
    }

    console.log('🚀 [loginAction] Redirigiendo a:', redirectTo);

    // Devolver success con la URL de redirección
    return { success: true, redirectTo }
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
