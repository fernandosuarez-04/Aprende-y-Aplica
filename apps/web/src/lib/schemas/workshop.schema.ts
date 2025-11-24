import { z } from 'zod';

/**
 * Schema para crear taller
 */
export const CreateWorkshopSchema = z.object({
  title: z.string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres')
    .trim(),
  
  description: z.string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres')
    .trim(),
  
  instructor_id: z.string()
    .uuid('ID de instructor inválido'),
  
  community_id: z.string()
    .uuid('ID de comunidad inválido')
    .optional()
    .nullable(),
  
  date: z.string()
    .datetime('Fecha inválida, debe ser ISO 8601')
    .or(z.date()),
  
  duration_minutes: z.number()
    .int('La duración debe ser un número entero')
    .min(15, 'La duración mínima es 15 minutos')
    .max(480, 'La duración máxima es 480 minutos (8 horas)'),
  
  max_participants: z.number()
    .int('El máximo de participantes debe ser un número entero')
    .min(1, 'Debe permitir al menos 1 participante')
    .max(1000, 'El máximo de participantes no puede exceder 1000')
    .optional()
    .nullable(),
  
  is_online: z.boolean()
    .default(true),
  
  meeting_url: z.string()
    .url('URL de reunión inválida')
    .max(500, 'La URL no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  
  location: z.string()
    .max(200, 'La ubicación no puede exceder 200 caracteres')
    .optional()
    .nullable(),
  
  tags: z.array(z.string())
    .max(10, 'No se pueden agregar más de 10 tags')
    .optional(),
  
  resources: z.array(z.object({
    title: z.string().max(100),
    url: z.string().url(),
    type: z.enum(['document', 'video', 'link', 'other']).optional(),
  }))
    .max(20, 'No se pueden agregar más de 20 recursos')
    .optional(),
});

/**
 * Schema para actualizar taller (basado en la tabla courses)
 */
export const UpdateWorkshopSchema = z.object({
  title: z.string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres')
    .trim()
    .optional(),
  
  description: z.string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres')
    .trim()
    .optional()
    .nullable(),
  
  category: z.string()
    .optional(),
  
  level: z.enum(['beginner', 'intermediate', 'advanced'])
    .optional(),
  
  duration_total_minutes: z.number()
    .int('La duración debe ser un número entero')
    .min(0, 'La duración no puede ser negativa')
    .optional(),
  
  instructor_id: z.string()
    .uuid('ID de instructor inválido')
    .optional()
    .nullable(),
  
  is_active: z.boolean()
    .optional(),
  
  thumbnail_url: z.string()
    .url('URL de imagen inválida')
    .max(500, 'La URL no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  
  slug: z.string()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .max(100, 'El slug no puede exceder 100 caracteres')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones')
    .optional(),
  
  price: z.number()
    .min(0, 'El precio no puede ser negativo')
    .optional()
    .nullable(),
  
  learning_objectives: z.any()
    .optional()
    .nullable(),
  
  // Campos de aprobación
  approval_status: z.enum(['pending', 'approved', 'rejected'])
    .optional(),
  
  rejection_reason: z.string()
    .max(1000, 'La razón de rechazo no puede exceder 1000 caracteres')
    .optional()
    .nullable(),
}).partial();

/**
 * Schema para registrar asistencia
 */
export const RecordAttendanceSchema = z.object({
  user_id: z.string()
    .uuid('ID de usuario inválido'),
  
  attended: z.boolean(),
  
  notes: z.string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .nullable(),
});

/**
 * Tipos TypeScript inferidos
 */
export type CreateWorkshopInput = z.infer<typeof CreateWorkshopSchema>;
export type UpdateWorkshopInput = z.infer<typeof UpdateWorkshopSchema>;
export type RecordAttendanceInput = z.infer<typeof RecordAttendanceSchema>;
