import dotenv from 'dotenv';
import path from 'path';

// Cargar .env desde la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_VERSION: process.env.API_VERSION || 'v1',

  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',

  // JWT
  JWT_SECRET: process.env.USER_JWT_SECRET || process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || process.env.API_SECRET_KEY || 'dev-refresh-secret',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',

  // Database (Supabase)
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://dev-project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-service-key',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',

  // External APIs
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  CHATBOT_MODEL: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
  CHATBOT_MAX_TOKENS: parseInt(process.env.CHATBOT_MAX_TOKENS || '700', 10),
  CHATBOT_TEMPERATURE: parseFloat(process.env.CHATBOT_TEMPERATURE || '0.6'),
  ASSEMBLYAI_API_KEY: process.env.ASSEMBLYAI_API_KEY || '',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  ZOOM_API_KEY: process.env.ZOOM_API_KEY || '',
  ZOOM_API_SECRET: process.env.ZOOM_API_SECRET || '',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // SMTP
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Audio
  AUDIO_ENABLED: process.env.AUDIO_ENABLED === 'true',
  AUDIO_VOLUME: parseFloat(process.env.AUDIO_VOLUME || '0.7'),

  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret',

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
  ],

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
} as const;

// Validación de variables críticas en producción
if (config.NODE_ENV === 'production') {
  const requiredVars = [
    'USER_JWT_SECRET',
    'API_SECRET_KEY', 
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno requeridas faltantes:', missingVars);
    process.exit(1);
  }
} else {
  // En desarrollo, mostrar qué variables están configuradas
  console.log('🔧 Variables de entorno cargadas:');
  console.log('- NODE_ENV:', config.NODE_ENV);
  console.log('- PORT:', config.PORT);
  console.log('- SUPABASE_URL:', config.SUPABASE_URL ? '✅ Configurado' : '❌ No configurado');
  console.log('- JWT_SECRET:', config.JWT_SECRET ? '✅ Configurado' : '❌ No configurado');
}
