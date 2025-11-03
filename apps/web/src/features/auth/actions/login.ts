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

    // 3. Buscar usuario y validar contraseña (como en tu sistema anterior)
    const { data: user, error } = await supabase
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
    const passwordValid = await bcrypt.compare(parsed.password, user.password_hash)
    
    if (!passwordValid) {
      return { error: 'Credenciales inválidas' }
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

    // 7. Redirigir según el rol del usuario
    console.log('🔄 Redirigiendo según rol:', user.cargo_rol);
    
    if (user.cargo_rol === 'Administrador') {
      console.log('🎯 Redirigiendo a /admin/dashboard');
      redirect('/admin/dashboard')
    } else if (user.cargo_rol === 'Instructor') {
      console.log('🎯 Redirigiendo a /instructor/dashboard');
      redirect('/instructor/dashboard')
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
      return { error: error.errors[0].message }
    }
    
    // Proporcionar mensaje de error más descriptivo
    const errorMessage = (error as any)?.message || 'Error inesperado al iniciar sesión';
    console.log('❌ Unexpected error:', errorMessage)
    return { error: errorMessage }
  }
}
