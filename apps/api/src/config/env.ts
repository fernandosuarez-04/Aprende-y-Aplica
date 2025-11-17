/**
 * ✅ CORRECCIÓN 7: Validación Robusta de Variables de Entorno con Zod
 * 
 * Implementa validación completa de todas las variables de entorno:
 * - Detecta variables faltantes o mal configuradas
 * - Previene valores por defecto inseguros en producción
 * - Valida tipos y formatos (URLs, emails, números)
 * - Logging seguro sin exponer secretos
 */

import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ✅ Schema completo de validación con Zod
const envSchema = z.object({
  // Server
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_VERSION: z.string().default('v1'),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),

  // JWT - Validación estricta en producción
  USER_JWT_SECRET: z.string().min(32, {
    message: 'USER_JWT_SECRET debe tener al menos 32 caracteres para ser seguro'
  }).optional(),
  JWT_SECRET: z.string().min(32, {
    message: 'JWT_SECRET debe tener al menos 32 caracteres para ser seguro'
  }).optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  REFRESH_TOKEN_SECRET: z.string().min(32, {
    message: 'REFRESH_TOKEN_SECRET debe tener al menos 32 caracteres'
  }).optional(),
  API_SECRET_KEY: z.string().min(32, {
    message: 'API_SECRET_KEY debe tener al menos 32 caracteres'
  }).optional(),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

  // Database (Supabase) - URLs deben ser válidas
  SUPABASE_URL: z.string().url({
    message: 'SUPABASE_URL debe ser una URL válida'
  }).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, {
    message: 'SUPABASE_SERVICE_ROLE_KEY requerida (mínimo 20 caracteres)'
  }).optional(),
  SUPABASE_ANON_KEY: z.string().optional(),

  // External APIs
  OPENAI_API_KEY: z.string().min(20, {
    message: 'OPENAI_API_KEY debe tener al menos 20 caracteres'
  }).optional(),
  CHATBOT_MODEL: z.string().default('gpt-5-nano'),
  CHATBOT_MAX_TOKENS: z.coerce.number().int().positive().max(4000).default(700),
  CHATBOT_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.6),
  ASSEMBLYAI_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  ZOOM_API_KEY: z.string().optional(),
  ZOOM_API_SECRET: z.string().optional(),

  // Database
  DATABASE_URL: z.string().optional(),

  // SMTP - Validación de email para SMTP_USER
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().email({
    message: 'SMTP_USER debe ser un email válido'
  }).optional().or(z.literal('')),
  SMTP_PASS: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Audio
  AUDIO_ENABLED: z.coerce.boolean().default(false),
  AUDIO_VOLUME: z.coerce.number().min(0).max(1).default(0.7),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  SESSION_SECRET: z.string().min(32, {
    message: 'SESSION_SECRET debe tener al menos 32 caracteres'
  }).optional(),

  // File Upload
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(10485760), // 10MB
  ALLOWED_FILE_TYPES: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000), // 15 min
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(1000),

  // Google OAuth (opcional)
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
});

// ✅ Función de validación con detección de valores inseguros
function validateEnv() {
  try {
    // Parsear con Zod
    const parsed = envSchema.parse(process.env);

    // ✅ Resolver JWT_SECRET con fallback
    const jwtSecret = parsed.USER_JWT_SECRET || parsed.JWT_SECRET || 'dev-secret-key-change-in-production';
    const refreshSecret = parsed.REFRESH_TOKEN_SECRET || parsed.API_SECRET_KEY || 'dev-refresh-secret';
    const sessionSecret = parsed.SESSION_SECRET || 'your-session-secret';
    const supabaseUrl = parsed.SUPABASE_URL || 'https://dev-project.supabase.co';
    const supabaseKey = parsed.SUPABASE_SERVICE_ROLE_KEY || 'dev-service-key';

    // ✅ Validaciones críticas en producción
    if (parsed.NODE_ENV === 'production') {
      // Lista de valores por defecto inseguros
      const weakDefaults = [
        'dev-secret-key',
        'dev-refresh-secret',
        'your-session-secret',
        'dev-service-key',
        'change-in-production',
        'dev-project.supabase.co'
      ];

      // Verificar JWT_SECRET
      if (weakDefaults.some(weak => jwtSecret.toLowerCase().includes(weak))) {
        throw new Error(
          '❌ JWT_SECRET usa un valor por defecto inseguro en producción. ' +
          'Configura USER_JWT_SECRET con un valor aleatorio de al menos 32 caracteres.'
        );
      }

      // Verificar REFRESH_TOKEN_SECRET
      if (weakDefaults.some(weak => refreshSecret.toLowerCase().includes(weak))) {
        throw new Error(
          '❌ REFRESH_TOKEN_SECRET usa un valor por defecto inseguro en producción. ' +
          'Configura REFRESH_TOKEN_SECRET o API_SECRET_KEY con un valor seguro.'
        );
      }

      // Verificar SESSION_SECRET
      if (weakDefaults.some(weak => sessionSecret.toLowerCase().includes(weak))) {
        throw new Error(
          '❌ SESSION_SECRET usa un valor por defecto inseguro en producción. ' +
          'Configura SESSION_SECRET con un valor aleatorio de al menos 32 caracteres.'
        );
      }

      // Verificar Supabase
      if (weakDefaults.some(weak => supabaseUrl.toLowerCase().includes(weak)) || 
          weakDefaults.some(weak => supabaseKey.toLowerCase().includes(weak))) {
        throw new Error(
          '❌ Supabase usa valores por defecto en producción. ' +
          'Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY correctamente.'
        );
      }

      // Verificar que las credenciales críticas existen
      if (!parsed.USER_JWT_SECRET && !parsed.JWT_SECRET) {
        throw new Error('❌ USER_JWT_SECRET o JWT_SECRET es requerido en producción');
      }

      if (!parsed.SUPABASE_URL) {
        throw new Error('❌ SUPABASE_URL es requerida en producción');
      }

      if (!parsed.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY es requerida en producción');
      }

      // console.log('✅ Validación de entorno en PRODUCCIÓN exitosa');
    } else {
      // ✅ En desarrollo, mostrar configuración (sin exponer valores)
      // console.log('🔧 Variables de entorno cargadas (desarrollo):');
      // console.log('  - NODE_ENV:', parsed.NODE_ENV);
      // console.log('  - PORT:', parsed.PORT);
      // console.log('  - SUPABASE_URL:', parsed.SUPABASE_URL ? '✅' : '❌');
      // console.log('  - JWT_SECRET:', jwtSecret ? '✅' : '❌');
      // console.log('  - REFRESH_SECRET:', refreshSecret ? '✅' : '❌');
      // console.log('  - SESSION_SECRET:', sessionSecret ? '✅' : '❌');
      // console.log('  - OPENAI_API_KEY:', parsed.OPENAI_API_KEY ? '✅' : '❌');
      // console.log('  - SMTP configurado:', parsed.SMTP_HOST && parsed.SMTP_USER ? '✅' : '❌');
      // console.log('  - OAuth configurado:', parsed.GOOGLE_OAUTH_CLIENT_ID ? '✅' : '❌');
    }

    // ✅ Retornar config con valores procesados
    return {
      ...parsed,
      JWT_SECRET: jwtSecret,
      REFRESH_TOKEN_SECRET: refreshSecret,
      SESSION_SECRET: sessionSecret,
      SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: supabaseKey,
      SUPABASE_ANON_KEY: parsed.SUPABASE_ANON_KEY || '',
      ALLOWED_FILE_TYPES: parsed.ALLOWED_FILE_TYPES?.split(',') || [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/plain',
      ],
    } as const;

  } catch (error) {
    if (error instanceof z.ZodError) {
      // console.error('\n❌ Error de validación de variables de entorno:\n');
      error.errors.forEach(err => {
        // console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      // console.error('\n💡 Revisa tu archivo .env y corrige los errores.');
      // console.error('💡 Consulta .env.example para ver las variables requeridas.\n');
    } else {
      // console.error('❌ Error validando entorno:', error);
    }
    process.exit(1);
  }
}

// ✅ Exportar config validado
export const config = validateEnv();
