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

    // 3. Buscar usuario y validar contraseña (como en tu sistema anterior)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, email_verified, cargo_rol')
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

    // 7. Redirigir
    console.log('🔄 Redirigiendo a /dashboard...');
    redirect('/dashboard')
  } catch (error) {
    // Manejar redirect de Next.js (no es un error real)
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as any).digest
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
        // Es una redirección, no un error
        throw error // Re-lanzar para que Next.js maneje la redirección
      }
    }
    
    console.error('❌ Login error:', error)
    
    if (error instanceof z.ZodError) {
      console.log('❌ Validation error:', error.errors)
      return { error: error.errors[0].message }
    }
    
    console.log('❌ Unexpected error:', error)
    return { error: 'Error inesperado' }
  }
}
