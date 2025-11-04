'use server'

import { createClient } from '../../../lib/supabase/server'
import { AuthService } from '../services/auth.service'
import { SessionService } from '../services/session.service'
import { z } from 'zod'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'

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

    console.log('🔍 Login attempt:', {
      emailOrUsername: parsed.emailOrUsername,
      passwordLength: parsed.password.length,
      rememberMe: parsed.rememberMe
    })

    // 2. Crear cliente Supabase
    const supabase = await createClient()

    // 3. Obtener contexto de organización si viene de login personalizado
    const organizationId = formData.get('organizationId')?.toString()
    const organizationSlug = formData.get('organizationSlug')?.toString()

    // 3. Buscar usuario y validar contraseña (como en tu sistema anterior)
    // Escapar el valor para evitar problemas con caracteres especiales
    const searchValue = parsed.emailOrUsername.trim();
    
    // Buscar usuario por username o email (case-insensitive match exacto)
    // Intentar primero por username
    let { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, email_verified, cargo_rol, type_rol, is_banned, ban_reason')
      .or(`username.ilike.${parsed.emailOrUsername},email.ilike.${parsed.emailOrUsername}`)
      .single()

    console.log('🔍 User query result:', {
      user: user ? { id: user.id, username: user.username, email: user.email } : null,
      error: error ? { code: error.code, message: error.message } : null
    })

    if (error || !user) {
      console.log('❌ User not found or error:', error)
      return { error: 'Credenciales inválidas' }
    }

    // ⭐ MODERACIÓN: Verificar si el usuario está baneado
    if ((user as any).is_banned) {
      console.log('🚫 Usuario baneado intenta iniciar sesión');
      return { 
        error: `❌ Tu cuenta ha sido suspendida por violaciones de las reglas de la comunidad. ${(user as any).ban_reason || ''}`,
        banned: true
      }
    }

    // 4. Verificar contraseña con bcrypt (como en tu sistema anterior)
    if (!user.password_hash) {
      console.error('❌ User has no password_hash');
      return { error: 'Error en la configuración de la cuenta. Por favor, contacta al soporte.' }
    }

    const passwordValid = await bcrypt.compare(parsed.password, user.password_hash)
    
    if (!passwordValid) {
      console.log('❌ Invalid password');
      
      // Crear notificación de intento de inicio de sesión fallido
      try {
        const { AutoNotificationsService } = await import('@/features/notifications/services/auto-notifications.service')
        const headersList = await import('next/headers').then(m => m.headers())
        const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   headersList.get('x-real-ip') || 
                   'unknown'
        const userAgent = headersList.get('user-agent') || 'unknown'
        
        await AutoNotificationsService.notifyLoginFailed(user.id, ip, userAgent, {
          timestamp: new Date().toISOString()
        })
      } catch (notificationError) {
        // No lanzar error para no afectar el flujo principal
        console.error('Error creando notificación de inicio de sesión fallido:', notificationError)
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
    console.log('🔐 Iniciando creación de sesión...');
    try {
      await SessionService.createSession(user.id, parsed.rememberMe)
      console.log('✅ Sesión creada exitosamente');
      
      // Crear notificación de inicio de sesión exitoso
      try {
        const { AutoNotificationsService } = await import('@/features/notifications/services/auto-notifications.service')
        const headersList = await import('next/headers').then(m => m.headers())
        const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   headersList.get('x-real-ip') || 
                   'unknown'
        const userAgent = headersList.get('user-agent') || 'unknown'
        
        await AutoNotificationsService.notifyLoginSuccess(user.id, ip, userAgent, {
          rememberMe: parsed.rememberMe,
          timestamp: new Date().toISOString()
        })
      } catch (notificationError) {
        // No lanzar error para no afectar el flujo principal
        console.error('Error creando notificación de inicio de sesión:', notificationError)
      }
    } catch (sessionError) {
      console.error('❌ Error creando sesión:', sessionError);
      return { error: 'Error al crear la sesión. Por favor, intenta nuevamente.' }
    }

    // 7. Limpiar sesiones expiradas (mantenimiento)
    try {
      await AuthService.clearExpiredSessions()
    } catch (clearError) {
      // No fallar el login si falla la limpieza
      console.warn('⚠️ Error limpiando sesiones expiradas:', clearError);
    }

    // 7. Si NO es login personalizado (login general), verificar si usuario tiene organización
    // Si tiene organización, redirigir a su login personalizado antes de redirigir según rol
    if (!organizationId && !organizationSlug) {
      // Buscar organización del usuario
      let userOrgSlug: string | null = null

      // Prioridad 1: Buscar en organization_users (más reciente por joined_at)
      const { data: userOrgs } = await supabase
        .from('organization_users')
        .select('organization_id, joined_at, organizations!inner(slug)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(1)

      if (userOrgs && userOrgs.length > 0) {
        userOrgSlug = userOrgs[0].organizations?.slug || null
      } else if (user.organization_id) {
        // Prioridad 2: Si no hay en organization_users, usar users.organization_id
        const { data: userOrg } = await supabase
          .from('organizations')
          .select('slug')
          .eq('id', user.organization_id)
          .single()

        if (userOrg) {
          userOrgSlug = userOrg.slug
        }
      }

      // Si usuario tiene organización, redirigir a su login personalizado
      if (userOrgSlug) {
        console.log(`🎯 Usuario con organización, redirigiendo a /auth/${userOrgSlug}`);
        redirect(`/auth/${userOrgSlug}`)
      }
    }

    // 8. Redirigir según el rol del usuario
    console.log('🔄 Redirigiendo según rol:', user.cargo_rol);
    
    const normalizedRole = user.cargo_rol?.trim();
    
    if (normalizedRole === 'Administrador') {
      console.log('🎯 Redirigiendo a /admin/dashboard');
      redirect('/admin/dashboard')
    } else if (normalizedRole === 'Instructor') {
      console.log('🎯 Redirigiendo a /instructor/dashboard');
      redirect('/instructor/dashboard')
    } else if (normalizedRole === 'Business') {
      console.log('🎯 Redirigiendo a /business-panel/dashboard');
      redirect('/business-panel/dashboard')
    } else if (normalizedRole === 'Business User') {
      console.log('🎯 Redirigiendo a /business-user/dashboard');
      redirect('/business-user/dashboard')
    } else {
      console.log('🎯 Redirigiendo a /dashboard');
      redirect('/dashboard')
    }
  } catch (error) {
    // Manejar redirect de Next.js (no es un error real)
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as any).digest
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        // Es una redirección, no un error - re-lanzar para que Next.js la maneje
        console.log('✅ Redirección exitosa detectada');
        throw error
      }
    }
    
    console.error('❌ Login error completo:', error)
    console.error('❌ Error name:', (error as any)?.name)
    console.error('❌ Error message:', (error as any)?.message)
    console.error('❌ Error stack:', (error as any)?.stack)
    
    if (error instanceof z.ZodError) {
      console.log('❌ Validation error:', error.errors)
      const firstError = error.errors[0];
      return { error: firstError?.message || 'Error de validación' }
    }
    
    // Proporcionar mensajes de error más específicos
    if (error instanceof Error) {
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
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
    console.log('❌ Unexpected error:', errorMessage)
    return { error: errorMessage }
  }
}
