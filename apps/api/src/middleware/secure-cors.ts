/**
 * 🔒 Secure CORS Configuration
 *
 * Validación estricta de CORS en producción
 * Previene configuraciones inseguras
 *
 * @see https://owasp.org/www-community/attacks/csrf
 */

import cors from 'cors';
import { config } from '../config/env';

/**
 * Valida que ALLOWED_ORIGINS esté configurado correctamente en producción
 */
function validateCORSConfig(): void {
  if (config.NODE_ENV === 'production') {
    if (!config.ALLOWED_ORIGINS) {
      throw new Error(
        '❌ SECURITY ERROR: ALLOWED_ORIGINS no está configurado en producción.\n' +
        'Esto es un riesgo de seguridad crítico.\n' +
        'Por favor configura la variable de entorno ALLOWED_ORIGINS con los dominios permitidos.\n' +
        'Ejemplo: ALLOWED_ORIGINS=https://aprendeyaplica.ai,https://www.aprendeyaplica.ai'
      );
    }

    const origins = config.ALLOWED_ORIGINS.split(',').map(o => o.trim());

    // Verificar que no haya orígenes inseguros en producción
    const insecureOrigins = origins.filter(origin => {
      return (
        origin === '*' || // Wildcard
        origin.includes('localhost') || // Localhost
        origin.includes('127.0.0.1') || // Loopback
        origin.startsWith('http://') // HTTP en producción
      );
    });

    if (insecureOrigins.length > 0) {
      throw new Error(
        `❌ SECURITY ERROR: Orígenes inseguros detectados en producción:\n` +
        `${insecureOrigins.join('\n')}\n\n` +
        `Solo se permiten orígenes HTTPS en producción.\n` +
        `Ejemplo válido: ALLOWED_ORIGINS=https://aprendeyaplica.ai`
      );
    }

    // Verificar que haya al menos un origen configurado
    if (origins.length === 0 || origins.every(o => !o)) {
      throw new Error(
        '❌ SECURITY ERROR: No hay orígenes válidos configurados en ALLOWED_ORIGINS.\n' +
        'Por favor configura al menos un origen HTTPS válido.'
      );
    }

    // console.log('✅ CORS configurado correctamente para producción');
    // console.log(`   Orígenes permitidos: ${origins.length}`);
    origins.forEach(origin => {
      // console.log(`   - ${origin}`);
    });
  }
}

/**
 * Obtiene la lista de orígenes permitidos
 */
function getAllowedOrigins(): string[] {
  if (config.ALLOWED_ORIGINS) {
    return config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  }

  // Fallback solo en desarrollo
  if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') {
    return ['http://localhost:3000'];
  }

  // En producción, lanzar error si no está configurado
  throw new Error('ALLOWED_ORIGINS no está configurado');
}

/**
 * Configuración de CORS segura
 */
export const secureCorsMiddleware = cors({
  // Origin dinámico con validación
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = getAllowedOrigins();

    // Permitir requests sin origin (ej: Postman, curl en desarrollo)
    if (!origin && config.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // En producción, denegar requests sin origin
    if (!origin && config.NODE_ENV === 'production') {
      return callback(new Error('Origin header is required'), false);
    }

    // Verificar si el origin está en la lista permitida
    if (origin && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log de intento de acceso no autorizado
    // console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);

    return callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
  },

  // Permitir credenciales (cookies, authorization headers)
  credentials: true,

  // Métodos HTTP permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Headers permitidos
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token', // Para protección CSRF
  ],

  // Headers expuestos al cliente
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-CSRF-Token',
  ],

  // Tiempo de caché para preflight requests (24 horas)
  maxAge: 86400,

  // Enviar status 204 para OPTIONS requests exitosos
  optionsSuccessStatus: 204,
});

/**
 * Middleware de validación de CORS
 * Llamar esto al iniciar el servidor
 */
export function validateCORSConfiguration(): void {
  validateCORSConfig();
}

/**
 * Información de configuración CORS para debugging
 */
export function getCORSInfo(): {
  environment: string;
  allowedOrigins: string[];
  credentialsAllowed: boolean;
  methods: string[];
} {
  return {
    environment: config.NODE_ENV,
    allowedOrigins: getAllowedOrigins(),
    credentialsAllowed: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  };
}
