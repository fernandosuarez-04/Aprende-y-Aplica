import { z } from 'zod';

export const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(1, 'El correo o usuario es requerido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().default(false),
});
