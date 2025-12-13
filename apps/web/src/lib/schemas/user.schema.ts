import { z } from 'zod';

/**
 * Schema para crear usuario
 */
export const CreateUserSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .trim()
    .toLowerCase(),
  
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  
  username: z.string()
    .min(3, 'El username debe tener al menos 3 caracteres')
    .max(30, 'El username no puede exceder 30 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El username solo puede contener letras, números, guiones y guiones bajos')
    .trim(),
  
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  
  role: z.enum(['Usuario', 'Instructor', 'Administrador'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser: Usuario, Instructor o Administrador' })
  })
    .default('Usuario'),
  
  bio: z.string()
    .max(500, 'La biografía no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  
  avatar_url: z.string()
    .url('URL de avatar inválida')
    .max(500, 'La URL del avatar no puede exceder 500 caracteres')
    .optional()
    .nullable(),
});

/**
 * Schema para actualizar usuario
 */
export const UpdateUserSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .trim()
    .toLowerCase()
    .optional(),
  
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim()
    .optional(),
  
  username: z.string()
    .min(3, 'El username debe tener al menos 3 caracteres')
    .max(30, 'El username no puede exceder 30 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El username solo puede contener letras, números, guiones y guiones bajos')
    .trim()
    .optional(),
  
  role: z.enum(['Usuario', 'Instructor', 'Administrador'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser: Usuario, Instructor o Administrador' })
  })
    .optional(),
  
  bio: z.string()
    .max(500, 'La biografía no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  
  avatar_url: z.string()
    .url('URL de avatar inválida')
    .max(500, 'La URL del avatar no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  
  is_active: z.boolean()
    .optional(),
});

/**
 * Schema para cambiar contraseña
 */
export const ChangePasswordSchema = z.object({
  current_password: z.string()
    .min(1, 'La contraseña actual es requerida'),
  
  new_password: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(100, 'La nueva contraseña no puede exceder 100 caracteres')
    .regex(/[A-Z]/, 'La nueva contraseña debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'La nueva contraseña debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'La nueva contraseña debe contener al menos un número'),
  
  confirm_password: z.string()
    .min(1, 'Debe confirmar la nueva contraseña'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});

/**
 * Tipos TypeScript inferidos
 */
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
