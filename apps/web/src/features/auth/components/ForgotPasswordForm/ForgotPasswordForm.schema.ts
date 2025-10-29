import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
