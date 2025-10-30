import { z } from 'zod';

/**
 * Schema para crear una comunidad
 */
export const CreateCommunitySchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  
  description: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .trim()
    .optional(),
  
  is_public: z.boolean()
    .default(true),
  
  course_id: z.string()
    .uuid('ID de curso inválido')
    .optional()
    .nullable(),
  
  slug: z.string()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .max(100, 'El slug no puede exceder 100 caracteres')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones')
    .optional(),
  
  tags: z.array(z.string())
    .max(10, 'No se pueden agregar más de 10 tags')
    .optional(),
  
  max_members: z.number()
    .int('El número máximo de miembros debe ser un entero')
    .positive('El número máximo de miembros debe ser positivo')
    .max(10000, 'El número máximo de miembros no puede exceder 10000')
    .optional()
    .nullable(),
});

/**
 * Schema para actualizar una comunidad
 */
export const UpdateCommunitySchema = CreateCommunitySchema.partial();

/**
 * Schema para cambiar rol de miembro
 */
export const UpdateMemberRoleSchema = z.object({
  role: z.enum(['Usuario', 'Moderador', 'Administrador'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser: Usuario, Moderador o Administrador' })
  })
});

/**
 * Schema para invitar usuario
 */
export const InviteUserSchema = z.object({
  user_id: z.string()
    .uuid('ID de usuario inválido'),
  
  role: z.enum(['Usuario', 'Moderador'], {
    errorMap: () => ({ message: 'Rol inválido para invitación. Debe ser: Usuario o Moderador' })
  })
    .default('Usuario'),
});

/**
 * Tipo TypeScript inferido
 */
export type CreateCommunityInput = z.infer<typeof CreateCommunitySchema>;
export type UpdateCommunityInput = z.infer<typeof UpdateCommunitySchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;
export type InviteUserInput = z.infer<typeof InviteUserSchema>;
