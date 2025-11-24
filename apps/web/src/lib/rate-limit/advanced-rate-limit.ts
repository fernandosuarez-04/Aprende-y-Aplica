/**
 * 🚦 Advanced Rate Limiting
 *
 * Sistema de rate limiting diferenciado por tipo de endpoint
 * Previene ataques de fuerza bruta y abuso de API
 *
 * @see https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks
 */

/**
 * Tipos de endpoints para rate limiting diferenciado
 */
export enum RateLimitTier {
  AUTH = 'auth',           // Login, register, password reset: MUY RESTRICTIVO
  ADMIN = 'admin',         // Endpoints de administración: RESTRICTIVO
  API_MUTATION = 'api_mutation', // POST, PUT, DELETE, PATCH: MODERADO
  API_READ = 'api_read',   // GET requests: PERMISIVO
  PUBLIC = 'public',       // Endpoints públicos: MUY PERMISIVO
}

/**
 * Configuración de rate limit por tier
 */
export const RATE_LIMIT_CONFIG = {
  [RateLimitTier.AUTH]: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.',
    blockDurationMs: 60 * 60 * 1000, // 1 hora de bloqueo después de exceder
  },
  [RateLimitTier.ADMIN]: {
    maxRequests: 50,
    windowMs: 15 * 60 * 1000, // 15 minutos
    message: 'Demasiadas peticiones administrativas. Intenta de nuevo más tarde.',
    blockDurationMs: 30 * 60 * 1000, // 30 minutos
  },
  [RateLimitTier.API_MUTATION]: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Demasiadas peticiones. Intenta de nuevo en un momento.',
    blockDurationMs: 5 * 60 * 1000, // 5 minutos
  },
  [RateLimitTier.API_READ]: {
    maxRequests: 300,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Demasiadas peticiones. Por favor espera un momento.',
    blockDurationMs: 2 * 60 * 1000, // 2 minutos
  },
  [RateLimitTier.PUBLIC]: {
    maxRequests: 1000,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Demasiadas peticiones. Por favor espera un momento.',
    blockDurationMs: 1 * 60 * 1000, // 1 minuto
  },
};

/**
 * Estructura de datos para tracking de requests
 */
interface RequestRecord {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

/**
 * Cache simple con Map para almacenar records de rate limiting
 */
const rateLimitCache = new Map<string, RequestRecord>();

/**
 * Limpia entradas expiradas del cache (ejecutar periódicamente)
 */
function cleanExpiredEntries(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitCache.forEach((record, key) => {
    // Eliminar si expiró el reset time y no está bloqueado
    if (record.resetTime < now && (!record.blockedUntil || record.blockedUntil < now)) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => rateLimitCache.delete(key));
}

// Limpiar cache cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(cleanExpiredEntries, 5 * 60 * 1000);
}

/**
 * Obtiene la IP del cliente desde el request
 *
 * @param request - Request object
 * @returns IP del cliente
 */
export function getClientIP(request: Request): string {
  // Prioridad a X-Forwarded-For (detrás de proxy/CDN)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Tomar la primera IP de la lista
    return forwardedFor.split(',')[0].trim();
  }

  // X-Real-IP
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // CF-Connecting-IP (Cloudflare)
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP.trim();
  }

  // Fallback (en desarrollo)
  return '127.0.0.1';
}

/**
 * Genera una key única para el rate limit cache
 *
 * @param identifier - IP o user ID
 * @param tier - Tier de rate limiting
 * @returns Cache key
 */
function getRateLimitKey(identifier: string, tier: RateLimitTier): string {
  return `ratelimit:${tier}:${identifier}`;
}

/**
 * Verifica si un request excede el rate limit
 *
 * @param identifier - IP o user ID
 * @param tier - Tier de rate limiting
 * @returns Resultado de la verificación
 */
export function checkRateLimit(
  identifier: string,
  tier: RateLimitTier
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  blockedUntil?: number;
} {
  const config = RATE_LIMIT_CONFIG[tier];
  const key = getRateLimitKey(identifier, tier);
  const now = Date.now();

  let record = rateLimitCache.get(key);

  // Si está bloqueado, denegar
  if (record?.blockedUntil && record.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
      blockedUntil: record.blockedUntil,
    };
  }

  // Si no existe record o expiró la ventana, crear nuevo
  if (!record || record.resetTime < now) {
    record = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitCache.set(key, record);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: record.resetTime,
    };
  }

  // Incrementar contador
  record.count += 1;

  // Si excede el límite, bloquear
  if (record.count > config.maxRequests) {
    record.blockedUntil = now + config.blockDurationMs;
    rateLimitCache.set(key, record);

    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter: Math.ceil(config.blockDurationMs / 1000),
      blockedUntil: record.blockedUntil,
    };
  }

  // Actualizar record
  rateLimitCache.set(key, record);

  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Middleware de rate limiting para Next.js API routes
 *
 * @param request - Request object
 * @param tier - Tier de rate limiting
 * @param identifier - Identificador personalizado (opcional, default: IP)
 * @returns Response si está bloqueado, null si está permitido
 */
export function rateLimitMiddleware(
  request: Request,
  tier: RateLimitTier,
  identifier?: string
): Response | null {
  const id = identifier || getClientIP(request);
  const result = checkRateLimit(id, tier);

  if (!result.allowed) {
    const config = RATE_LIMIT_CONFIG[tier];

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: config.message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.retryAfter,
          resetTime: new Date(result.resetTime).toISOString(),
        },
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfter || 60),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000)),
        },
      }
    );
  }

  // Request permitido, retornar null
  return null;
}

/**
 * Headers de rate limit para incluir en responses exitosos
 *
 * @param identifier - IP o user ID
 * @param tier - Tier de rate limiting
 * @returns Headers object
 */
export function getRateLimitHeaders(
  identifier: string,
  tier: RateLimitTier
): Record<string, string> {
  const result = checkRateLimit(identifier, tier);
  const config = RATE_LIMIT_CONFIG[tier];

  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000)),
  };
}

/**
 * Resetea el rate limit de un identifier (útil después de login exitoso)
 *
 * @param identifier - IP o user ID
 * @param tier - Tier de rate limiting
 */
export function resetRateLimit(identifier: string, tier: RateLimitTier): void {
  const key = getRateLimitKey(identifier, tier);
  rateLimitCache.delete(key);
}

/**
 * Bloquea permanentemente un identifier (útil para IPs maliciosas)
 *
 * @param identifier - IP o user ID
 * @param tier - Tier de rate limiting
 * @param durationMs - Duración del bloqueo (default: 24 horas)
 */
export function blockIdentifier(
  identifier: string,
  tier: RateLimitTier,
  durationMs: number = 24 * 60 * 60 * 1000
): void {
  const key = getRateLimitKey(identifier, tier);
  const now = Date.now();

  rateLimitCache.set(key, {
    count: 999999,
    resetTime: now + durationMs,
    blockedUntil: now + durationMs,
  });
}

/**
 * Obtiene estadísticas de rate limiting
 *
 * @returns Estadísticas del cache
 */
export function getRateLimitStats(): {
  size: number;
  blockedIdentifiers: number;
} {
  let blockedCount = 0;
  const now = Date.now();

  // Contar identifiers bloqueados
  rateLimitCache.forEach((record) => {
    if (record.blockedUntil && record.blockedUntil > now) {
      blockedCount++;
    }
  });

  return {
    size: rateLimitCache.size,
    blockedIdentifiers: blockedCount,
  };
}

/**
 * Limpia el cache de rate limiting (útil para testing)
 */
export function clearRateLimitCache(): void {
  rateLimitCache.clear();
}

/**
 * Helper para determinar el tier basado en la ruta
 *
 * @param pathname - Ruta del request
 * @param method - Método HTTP
 * @returns Tier de rate limiting
 */
export function getTierFromPath(pathname: string, method: string): RateLimitTier {
  // Auth endpoints
  if (
    pathname.includes('/api/auth/') ||
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/reset-password')
  ) {
    return RateLimitTier.AUTH;
  }

  // Admin endpoints
  if (pathname.includes('/api/admin/')) {
    return RateLimitTier.ADMIN;
  }

  // API mutations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
    return RateLimitTier.API_MUTATION;
  }

  // API reads
  if (pathname.startsWith('/api/')) {
    return RateLimitTier.API_READ;
  }

  // Public
  return RateLimitTier.PUBLIC;
}

/**
 * Ejemplo de uso en API route:
 *
 * ```typescript
 * import { rateLimitMiddleware, RateLimitTier } from '@/lib/rate-limit/advanced-rate-limit';
 *
 * export async function POST(request: Request) {
 *   // Verificar rate limit
 *   const rateLimitResponse = rateLimitMiddleware(request, RateLimitTier.AUTH);
 *   if (rateLimitResponse) {
 *     return rateLimitResponse; // Bloqueado
 *   }
 *
 *   // Continuar con la lógica...
 *   try {
 *     // ...
 *   } catch (error) {
 *     // ...
 *   }
 * }
 * ```
 */
