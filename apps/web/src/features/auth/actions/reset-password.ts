'use server'

import { createClient } from '../../../lib/supabase/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const requestResetSchema = z.object({
  email: z.string().email('Email inválido'),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
})

export async function requestPasswordResetAction(formData: FormData | { email: string }) {
  try {
    let email: string

    if (formData instanceof FormData) {
      const parsed = requestResetSchema.parse({
        email: formData.get('email'),
      })
      email = parsed.email
    } else {
      const parsed = requestResetSchema.parse(formData)
      email = parsed.email
    }

    const supabase = await createClient()
    
    // Verificar que el email existe
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (!user) {
      // Por seguridad, no revelar si el email existe o no
      return { success: true, message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' }
    }
    
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    })
    
    return { success: true, message: 'Revisa tu email para las instrucciones de restablecimiento' }
  } catch (error) {
    console.error('Request password reset error:', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Error inesperado' }
  }
}

export async function resetPasswordAction(formData: FormData | { token: string; newPassword: string }) {
  try {
    let token: string
    let newPassword: string

    if (formData instanceof FormData) {
      const parsed = resetPasswordSchema.parse({
        token: formData.get('token'),
        newPassword: formData.get('newPassword'),
      })
      token = parsed.token
      newPassword = parsed.newPassword
    } else {
      const parsed = resetPasswordSchema.parse(formData)
      token = parsed.token
      newPassword = parsed.newPassword
    }

    const supabase = await createClient()
    
    // Verificar token de recuperación
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    })
    
    if (error) {
      console.error('Reset password token error:', error)
      return { error: 'Token inválido o expirado' }
    }
    
    if (!data.user?.email) {
      return { error: 'No se pudo obtener información del usuario' }
    }
    
    // Hash nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 12)
    
    // Actualizar en users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('email', data.user.email)
    
    if (updateError) {
      console.error('Error updating password:', updateError)
      return { error: 'Error al actualizar la contraseña' }
    }

    // Actualizar también en Supabase Auth
    const { error: authUpdateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (authUpdateError) {
      console.error('Error updating auth password:', authUpdateError)
      // No fallar completamente, ya actualizamos la tabla users
    }
    
    return { success: true, message: 'Contraseña actualizada correctamente' }
  } catch (error) {
    console.error('Reset password error:', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Error inesperado' }
  }
}
