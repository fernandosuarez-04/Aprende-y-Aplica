import { z } from 'zod';

/**
 * Schema para crear aplicación IA
 */
export const CreateAppSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  
  slug: z.string()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .max(100, 'El slug no puede exceder 100 caracteres')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones')
    .optional(),
  
  description: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .trim()
    .optional()
    .nullable(),
  
  long_description: z.string()
    .max(5000, 'La descripción larga no puede exceder 5000 caracteres')
    .optional()
    .nullable(),
  
  category_id: z.string()
    .uuid('ID de categoría inválido')
    .optional()
    .nullable(),
  
  website_url: z.string()
    .url('URL de sitio web inválida')
    .max(500, 'La URL no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  
  logo_url: z.string()
    .url('URL de logo inválida')
    .max(500, 'La URL no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  
  pricing_type: z.enum(['free', 'freemium', 'paid', 'subscription'], {
    errorMap: () => ({ message: 'Tipo de precio inválido. Debe ser: free, freemium, paid o subscription' })
  })
    .optional()
    .nullable(),
  
  pricing_details: z.string()
    .max(1000, 'Los detalles de precio no pueden exceder 1000 caracteres')
    .optional()
    .nullable(),
  
  features: z.array(z.string().max(200))
    .max(50, 'No se pueden agregar más de 50 características')
    .optional()
    .nullable(),
  
  use_cases: z.array(z.string().max(200))
    .max(30, 'No se pueden agregar más de 30 casos de uso')
    .optional()
    .nullable(),
  
  tags: z.array(z.string().max(50))
    .max(20, 'No se pueden agregar más de 20 tags')
    .optional()
    .nullable(),
  
  is_featured: z.boolean()
    .default(false),
  
  is_active: z.boolean()
    .default(true),
  
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: 'Nivel de dificultad inválido' })
  })
    .optional()
    .nullable(),
  
  rating: z.number()
    .min(0, 'La calificación mínima es 0')
    .max(5, 'La calificación máxima es 5')
    .optional()
    .nullable(),
  
  api_available: z.boolean()
    .default(false),
  
  integrations: z.array(z.string().max(100))
    .max(30, 'No se pueden agregar más de 30 integraciones')
    .optional()
    .nullable(),
});

/**
 * Schema para actualizar aplicación IA
 */
export const UpdateAppSchema = CreateAppSchema.partial();

/**
 * Tipos TypeScript inferidos
 */
export type CreateAppInput = z.infer<typeof CreateAppSchema>;
export type UpdateAppInput = z.infer<typeof UpdateAppSchema>;
