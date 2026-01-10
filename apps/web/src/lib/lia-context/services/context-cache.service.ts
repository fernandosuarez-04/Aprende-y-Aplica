/**
 * ContextCacheService
 * 
 * Servicio de caché para el contexto de LIA.
 * Implementa caché en memoria con TTL configurable para diferentes tipos de datos.
 * 
 * Niveles de caché:
 * - Estático: Metadata de páginas (infinito mientras el server corra)
 * - Usuario: Contexto específico del usuario (5 minutos)
 * - Página: Contexto de página actual (1 hora)
 */

import type { CacheEntry, CacheOptions } from '../types';

// TTL por defecto en milisegundos
const DEFAULT_TTL = {
  static: Infinity,        // La metadata de páginas no cambia
  user: 5 * 60 * 1000,     // 5 minutos para datos de usuario
  page: 60 * 60 * 1000,    // 1 hora para contexto de página
  bugReport: 2 * 60 * 1000, // 2 minutos para contexto de bugs
};

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  size: number;
}

export class ContextCacheService {
  private static cache: Map<string, CacheEntry<unknown>> = new Map();
  private static stats: CacheStats = {
    hits: 0,
    misses: 0,
    entries: 0,
    size: 0,
  };
  private static maxEntries = 1000;

  /**
   * Obtiene un valor del cache
   * @param key - Clave del cache
   * @returns Valor cacheado o undefined si no existe o expiró
   */
  static get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Verificar si expiró
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.entries = this.cache.size;
      this.stats.misses++;
      return undefined;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Guarda un valor en el cache
   * @param key - Clave del cache
   * @param data - Datos a guardar
   * @param ttl - Tiempo de vida en ms (default: 5 minutos)
   */
  static set<T>(key: string, data: T, ttl: number = DEFAULT_TTL.user): void {
    // Evitar cache overflow
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      createdAt: Date.now(),
      ttl,
    };

    this.cache.set(key, entry);
    this.stats.entries = this.cache.size;
    this.updateSizeEstimate();
  }

  /**
   * Elimina un valor del cache
   */
  static delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.stats.entries = this.cache.size;
    return result;
  }

  /**
   * Invalida todas las entradas que coincidan con un patrón
   * @param pattern - Prefijo de clave a invalidar
   */
  static invalidateByPattern(pattern: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.entries = this.cache.size;
    return count;
  }

  /**
   * Invalida cache de un usuario específico
   */
  static invalidateUser(userId: string): number {
    return this.invalidateByPattern(`user:${userId}`);
  }

  /**
   * Invalida cache de una página específica
   */
  static invalidatePage(page: string): number {
    return this.invalidateByPattern(`page:${page}`);
  }

  /**
   * Limpia todo el cache
   */
  static clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      entries: 0,
      size: 0,
    };
  }

  /**
   * Obtiene estadísticas del cache
   */
  static getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? Math.round((this.stats.hits / total) * 100) : 0,
    };
  }

  // =========================================================================
  // MÉTODOS DE CONVENIENCIA PARA TIPOS ESPECÍFICOS
  // =========================================================================

  /**
   * Cache de contexto de página (TTL: 1 hora)
   */
  static getPageContext(page: string): string | undefined {
    return this.get<string>(`page:${page}`);
  }

  static setPageContext(page: string, context: string): void {
    this.set(`page:${page}`, context, DEFAULT_TTL.page);
  }

  /**
   * Cache de contexto de bug report (TTL: 2 minutos)
   */
  static getBugContext(page: string, userId?: string): string | undefined {
    const key = userId ? `bug:${userId}:${page}` : `bug:${page}`;
    return this.get<string>(key);
  }

  static setBugContext(page: string, context: string, userId?: string): void {
    const key = userId ? `bug:${userId}:${page}` : `bug:${page}`;
    this.set(key, context, DEFAULT_TTL.bugReport);
  }

  /**
   * Cache de datos de usuario (TTL: 5 minutos)
   */
  static getUserData<T>(userId: string, dataType: string): T | undefined {
    return this.get<T>(`user:${userId}:${dataType}`);
  }

  static setUserData<T>(userId: string, dataType: string, data: T): void {
    this.set(`user:${userId}:${dataType}`, data, DEFAULT_TTL.user);
  }

  /**
   * Cache de metadata estática (TTL: infinito)
   */
  static getStaticData<T>(key: string): T | undefined {
    return this.get<T>(`static:${key}`);
  }

  static setStaticData<T>(key: string, data: T): void {
    this.set(`static:${key}`, data, DEFAULT_TTL.static);
  }

  // =========================================================================
  // MÉTODOS PRIVADOS
  // =========================================================================

  /**
   * Verifica si una entrada ha expirado
   */
  private static isExpired(entry: CacheEntry<unknown>): boolean {
    if (entry.ttl === Infinity) return false;
    return Date.now() > entry.createdAt + entry.ttl;
  }

  /**
   * Elimina las entradas más antiguas cuando el cache está lleno
   */
  private static evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // No eliminar entradas estáticas
      if (entry.ttl === Infinity) continue;
      
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Actualiza estimación del tamaño del cache
   */
  private static updateSizeEstimate(): void {
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length;
      size += typeof entry.data === 'string' 
        ? entry.data.length 
        : JSON.stringify(entry.data).length;
    }
    this.stats.size = size;
  }

  /**
   * Limpia entradas expiradas (para llamar periódicamente)
   */
  static cleanup(): number {
    let cleaned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    this.stats.entries = this.cache.size;
    return cleaned;
  }
}

// Limpiar entradas expiradas cada 5 minutos (solo en servidor)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    ContextCacheService.cleanup();
  }, 5 * 60 * 1000);
}

export default ContextCacheService;

