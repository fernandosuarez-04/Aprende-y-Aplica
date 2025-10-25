'use server'

import { createClient } from '../../../lib/supabase/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import crypto from 'crypto'

const registerSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(20, 'El usuario no puede tener más de 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El usuario solo puede contener letras, números y guiones bajos'),
  email: z.string().email('Email inválido'),
  confirmEmail: z.string().email('Email de confirmación inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string().min(1, 'Confirma la contraseña'),
  countryCode: z.string().min(1, 'Selecciona un país'),
  phoneNumber: z.string().min(1, 'El teléfono es requerido'),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
}).refine(data => data.email === data.confirmEmail, {
  message: 'Los emails no coinciden',
  path: ['confirmEmail'],
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

export async function registerAction(formData: FormData) {
  try {
    // Convertir FormData a objeto, manejando correctamente los tipos
    const rawData = Object.fromEntries(formData)
    
    // Convertir aceptTerms de string a boolean
    const formDataParsed = {
      ...rawData,
      acceptTerms: rawData.acceptTerms === 'true' || rawData.acceptTerms === 'on'
    }
    
    const parsed = registerSchema.parse(formDataParsed)

    const supabase = await createClient()

    // Verificar usuario/email no exista en nuestra tabla (como antes)
    const { data: existing } = await supabase
      .from('users')
      .select('id, username, email')
      .or(`username.eq.${parsed.username},email.eq.${parsed.email}`)

    if (existing && existing.length > 0) {
      const conflict = existing.find(u => u.username === parsed.username)
        ? 'usuario'
        : 'email'
      return { error: `El ${conflict} ya existe` }
    }

    // Hash password (como en tu sistema anterior)
    const passwordHash = await bcrypt.hash(parsed.password, 12)

    // GENERAR ID único para el usuario (como en tu sistema anterior)
    const userId = crypto.randomUUID()

    // Crear usuario directamente en la tabla users (sin Supabase Auth)
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        id: userId, // ID generado por nosotros
        username: parsed.username,
        email: parsed.email,
        password_hash: passwordHash,
        first_name: parsed.firstName,
        last_name: parsed.lastName,
        display_name: `${parsed.firstName} ${parsed.lastName}`.trim(), // Generar display_name
        country_code: parsed.countryCode,
        phone: parsed.phoneNumber, // Campo phone para el número de teléfono (varchar en DB)
        cargo_rol: 'Usuario', // Rol por defecto para nuevos usuarios
        type_rol: 'Usuario', // Tipo de rol por defecto para nuevos usuarios
        email_verified: false, // Se verificará después con email manual
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      // Limpiar cuenta de auth en caso de error
      // Nota: Esto requeriría service role key, por ahora solo logueamos
      return { error: 'Error al crear perfil de usuario' }
    }

    return { 
      success: true, 
      message: 'Cuenta creada exitosamente.',
      userId: user.id 
    }
  } catch (error) {
    console.error('Register error:', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'Error inesperado' }
  }
}
