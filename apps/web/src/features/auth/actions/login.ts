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

    // console.log('🔍 Login attempt:', {
    //   emailOrUsername: parsed.emailOrUsername,
    //   passwordLength: parsed.password.length,
    //   rememberMe: parsed.rememberMe
    // })

    // 2. Crear cliente Supabase
    const supabase = await createClient()

    // 3. Obtener contexto de organización si viene de login personalizado
    const organizationId = formData.get('organizationId')?.toString()
    const organizationSlug = formData.get('organizationSlug')?.toString()

    // 3. Buscar usuario y validar contraseña (como en tu sistema anterior)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, email_verified, cargo_rol, type_rol, organization_id')
      .or(`username.ilike.${parsed.emailOrUsername},email.ilike.${parsed.emailOrUsername}`)
      .single()

    // console.log('🔍 User query result:', {
    //   user: user ? { id: user.id, username: user.username, email: user.email } : null,
    //   error: error ? { code: error.code, message: error.message } : null
    // })

    if (error || !user) {
      // console.log('❌ User not found or error:', error)
      return { error: 'Credenciales inválidas' }
    }

    // 4. Verificar contraseña con bcrypt (como en tu sistema anterior)
    const passwordValid = await bcrypt.compare(parsed.password, user.password_hash)
    
    if (!passwordValid) {
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

    // 5. Crear sesión personalizada (sin Supabase Auth)
    console.log('🔐 Iniciando creación de sesión...');
    await SessionService.createSession(user.id, parsed.rememberMe)
    console.log('✅ Sesión creada exitosamente');

    // 6. Limpiar sesiones expiradas (mantenimiento)
    await AuthService.clearExpiredSessions()

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
        throw error
      }
    }
    
    console.error('❌ Login error:', error)
    
    if (error instanceof z.ZodError) {
      console.log('❌ Validation error:', error.errors)
      return { error: error.errors[0].message }
    }
    
    console.log('❌ Unexpected error:', error)
    return { error: 'Error inesperado al iniciar sesión' }
  }
}
