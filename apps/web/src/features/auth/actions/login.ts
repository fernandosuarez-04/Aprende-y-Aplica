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
    // Escapar el valor para evitar problemas con caracteres especiales
    const searchValue = parsed.emailOrUsername.trim();
    
    // Buscar usuario por username o email (case-insensitive match exacto)
    // Intentar primero por username
    let { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, email_verified, cargo_rol, type_rol')
      .ilike('username', searchValue)
      .maybeSingle();
    
    // Si no se encuentra por username, buscar por email
    if (!user && !error) {
      const emailResult = await supabase
        .from('users')
        .select('id, username, email, password_hash, email_verified, cargo_rol, type_rol')
        .ilike('email', searchValue)
        .maybeSingle();
      
      user = emailResult.data;
      if (emailResult.error && !error) {
        error = emailResult.error;
      }
    }

    console.log('🔍 User query result:', {
      user: user ? { id: user.id, username: user.username, email: user.email } : null,
      error: error ? { code: error.code, message: error.message } : null
    })

    if (error || !user) {
      console.log('❌ User not found or error:', error)
      return { error: 'Credenciales inválidas' }
    }

    // 4. Verificar contraseña con bcrypt (como en tu sistema anterior)
    if (!user.password_hash) {
      console.error('❌ User has no password_hash');
      return { error: 'Error en la configuración de la cuenta. Por favor, contacta al soporte.' }
    }

    const passwordValid = await bcrypt.compare(parsed.password, user.password_hash)
    
    if (!passwordValid) {
      console.log('❌ Invalid password');
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

    // 6. Crear sesión personalizada (sin Supabase Auth)
    console.log('🔐 Iniciando creación de sesión...');
    try {
      await SessionService.createSession(user.id, parsed.rememberMe)
      console.log('✅ Sesión creada exitosamente');
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
    
    console.log('❌ Unexpected error:', error)
    return { error: 'Error inesperado al iniciar sesión. Por favor, intenta nuevamente o contacta al soporte.' }
  }
}
