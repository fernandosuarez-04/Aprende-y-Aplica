/**
 * Cache Headers Utility
 * 
 * Proporciona headers HTTP de cache optimizados para diferentes tipos de contenido.
 * Usa estrategia stale-while-revalidate para mejor UX.
 * 
 * @see https://web.dev/stale-while-revalidate/
 */

/**
 * Para datos que cambian raramente (comunidades, categorías)
 * - Cache: 1 hora
 * - Stale-while-revalidate: 24 horas
 * - Usuarios ven contenido cacheado mientras se revalida en background
 */
export const staticCache = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  'CDN-Cache-Control': 'max-age=3600',
} as const;

/**
 * Para datos semi-estáticos (noticias, stats de comunidades)
 * - Cache: 5 minutos
 * - Stale-while-revalidate: 10 minutos
 * - Balance entre frescura y performance
 */
export const semiStaticCache = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  'CDN-Cache-Control': 'max-age=300',
} as const;

/**
 * Para datos dinámicos (posts, comentarios)
 * - Cache: 30 segundos
 * - Stale-while-revalidate: 60 segundos
 * - Contenido frecuentemente actualizado
 */
export const dynamicCache = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
  'CDN-Cache-Control': 'max-age=30',
} as const;

/**
 * Para datos altamente dinámicos (likes en tiempo real, presencia)
 * - Cache: 10 segundos
 * - Stale-while-revalidate: 20 segundos
 * - Contenido que cambia constantemente
 */
export const realtimeCache = {
  'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20',
  'CDN-Cache-Control': 'max-age=10',
} as const;

/**
 * Para datos privados del usuario (perfil, settings, admin)
 * - No cache
 * - Siempre fetch fresh data
 * - Datos sensibles o específicos del usuario
 */
export const privateCache = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
} as const;

/**
 * Para contenido inmutable (assets con hash, imágenes procesadas)
 * - Cache: 1 año
 * - Immutable: no revalidar hasta expiración
 * - Solo para contenido con versioning en URL
 */
export const immutableCache = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'CDN-Cache-Control': 'max-age=31536000',
} as const;

/**
 * Helper type para los cache headers disponibles
 */
export type CacheStrategy = 
  | typeof staticCache
  | typeof semiStaticCache
  | typeof dynamicCache
  | typeof realtimeCache
  | typeof privateCache
  | typeof immutableCache;

/**
 * Helper para seleccionar estrategia de cache basado en tipo de contenido
 */
export function getCacheStrategy(contentType: 'static' | 'semi-static' | 'dynamic' | 'realtime' | 'private' | 'immutable'): CacheStrategy {
  switch (contentType) {
    case 'static':
      return staticCache;
    case 'semi-static':
      return semiStaticCache;
    case 'dynamic':
      return dynamicCache;
    case 'realtime':
      return realtimeCache;
    case 'private':
      return privateCache;
    case 'immutable':
      return immutableCache;
    default:
      return privateCache; // Default seguro
  }
}

/**
 * Helper para agregar cache headers a NextResponse
 * 
 * @example
 * ```ts
 * import { NextResponse } from 'next/server'
 * import { withCache, semiStaticCache } from '@/core/utils/cache-headers'
 * 
 * export async function GET() {
 *   const data = await fetchData()
 *   return withCache(
 *     NextResponse.json({ data }),
 *     semiStaticCache
 *   )
 * }
 * ```
 */
export function withCache<T extends Response>(response: T, cacheHeaders: CacheStrategy): T {
  // Agregar cada header al response
  Object.entries(cacheHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Helper para crear objeto de headers para fetch/API calls
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/data', {
 *   headers: createCacheHeaders(semiStaticCache)
 * })
 * ```
 */
export function createCacheHeaders(cacheStrategy: CacheStrategy): Record<string, string> {
  return { ...cacheStrategy };
}

/**
 * Guía de uso:
 * 
 * STATIC (1 hora):
 * - Lista de comunidades públicas
 * - Categorías del sistema
 * - Configuración de la app
 * - Páginas informativas
 * 
 * SEMI-STATIC (5 minutos):
 * - Noticias y anuncios
 * - Stats de comunidades
 * - Rankings y leaderboards
 * - Contenido editorial
 * 
 * DYNAMIC (30 segundos):
 * - Feed de posts
 * - Comentarios
 * - Lista de miembros
 * - Actividad reciente
 * 
 * REALTIME (10 segundos):
 * - Contadores de likes/views
 * - Usuarios en línea
 * - Notificaciones badge
 * 
 * PRIVATE (no cache):
 * - Perfil del usuario
 * - Configuración personal
 * - Rutas admin
 * - Datos sensibles
 * 
 * IMMUTABLE (1 año):
 * - Assets con hash (build artifacts)
 * - Imágenes optimizadas con CDN
 * - Archivos de librerías
 */
