import { z } from 'zod';

/**
 * Schema para crear noticia (validación básica de campos críticos)
 */
export const CreateNewsSchema = z.object({
  title: z.string()
    .min(10, 'El título debe tener al menos 10 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres')
    .trim(),
  
  content: z.string()
    .min(10, 'El contenido debe tener al menos 10 caracteres')
    .max(10000, 'El contenido no puede exceder 10000 caracteres')
    .trim(),
  
  author_id: z.string()
    .uuid('ID de autor inválido')
    .optional(), // Opcional porque puede ser auto-asignado
  
  category: z.enum(['announcement', 'update', 'event', 'general'], {
    errorMap: () => ({ message: 'Categoría inválida' })
  })
    .optional()
    .nullable(),
  
  community_id: z.string()
    .uuid('ID de comunidad inválido')
    .optional()
    .nullable(),
  
  image_url: z.string()
    .url('URL de imagen inválida')
    .max(500, 'La URL no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  
  is_pinned: z.boolean()
    .optional()
    .nullable(),
  
  tags: z.array(z.string())
    .max(10, 'No se pueden agregar más de 10 tags')
    .optional()
    .nullable(),
}).passthrough(); // Permite campos adicionales del endpoint

/**
 * Schema para actualizar noticia
 */
export const UpdateNewsSchema = CreateNewsSchema.partial();

/**
 * Schema para crear prompt
 */
export const CreatePromptSchema = z.object({
  title: z.string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres')
    .trim(),
  
  content: z.string()
    .min(20, 'El contenido debe tener al menos 20 caracteres')
    .max(5000, 'El contenido no puede exceder 5000 caracteres')
    .trim(),
  
  author_id: z.string()
    .uuid('ID de autor inválido')
    .optional(), // Opcional porque puede ser auto-asignado
  
  category: z.enum([
    'marketing',
    'ventas',
    'productividad',
    'creatividad',
    'negocios',
    'educacion',
    'otros'
  ], {
    errorMap: () => ({ message: 'Categoría inválida' })
  }),
  
  ai_model: z.enum(['gpt-4', 'gpt-3.5', 'claude', 'gemini', 'other'], {
    errorMap: () => ({ message: 'Modelo de IA inválido' })
  })
    .optional()
    .nullable(),
  
  tags: z.array(z.string())
    .max(10, 'No se pueden agregar más de 10 tags')
    .optional()
    .nullable(),
  
  is_public: z.boolean()
    .optional()
    .nullable(),
  
  variables: z.array(z.object({
    name: z.string().max(50),
    description: z.string().max(200).optional(),
    example: z.string().max(200).optional(),
  }))
    .max(20, 'No se pueden agregar más de 20 variables')
    .optional()
    .nullable(),
}).passthrough(); // Permite campos adicionales del endpoint

/**
 * Schema para actualizar prompt
 */
export const UpdatePromptSchema = CreatePromptSchema.partial();

/**
 * Schema para crear reel
 */
export const CreateReelSchema = z.object({
  title: z.string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres')
    .trim(),
  
  description: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .trim()
    .optional()
    .nullable(),
  
  video_url: z.string()
    .url('URL de video inválida')
    .max(500, 'La URL no puede exceder 500 caracteres'),
  
  thumbnail_url: z.string()
    .url('URL de thumbnail inválida')
    .max(500, 'La URL no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  
  created_by: z.string()
    .uuid('ID de creador inválido')
    .optional(),
  
  category: z.enum([
    'tutorial',
    'tips',
    'caso-de-exito',
    'motivacional',
    'educativo',
    'entretenimiento',
    'otros'
  ], {
    errorMap: () => ({ message: 'Categoría inválida' })
  })
    .optional()
    .nullable(),
  
  duration_seconds: z.number()
    .int('La duración debe ser un número entero')
    .min(1, 'La duración mínima es 1 segundo')
    .max(180, 'La duración máxima es 180 segundos (3 minutos)'),
  
  language: z.string()
    .max(10, 'El idioma no puede exceder 10 caracteres')
    .optional()
    .nullable(),
  
  is_featured: z.boolean()
    .optional()
    .nullable(),
  
  is_active: z.boolean()
    .optional()
    .nullable(),
  
  published_at: z.string()
    .optional()
    .nullable(),
}).passthrough(); // Permite campos adicionales del endpoint

/**
 * Schema para actualizar reel
 */
export const UpdateReelSchema = CreateReelSchema.partial();

/**
 * Tipos TypeScript inferidos
 */
export type CreateNewsInput = z.infer<typeof CreateNewsSchema>;
export type UpdateNewsInput = z.infer<typeof UpdateNewsSchema>;
export type CreatePromptInput = z.infer<typeof CreatePromptSchema>;
export type UpdatePromptInput = z.infer<typeof UpdatePromptSchema>;
export type CreateReelInput = z.infer<typeof CreateReelSchema>;
export type UpdateReelInput = z.infer<typeof UpdateReelSchema>;
