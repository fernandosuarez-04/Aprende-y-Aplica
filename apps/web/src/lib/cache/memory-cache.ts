/**
 * ⚡ SISTEMA DE CACHÉ EN MEMORIA CON LÍMITES ESTRICTOS
 *
 * IMPORTANTE: Para entornos serverless (Vercel), mantener límite de memoria bajo
 * Vercel tiene límite de 50MB por función
 *
 * Estrategia:
 * - LRU (Least Recently Used) eviction
 * - TTL (Time To Live) configurable
 * - Límite estricto de tamaño (máx 10MB)
 * - Métricas de uso para monitoreo
 */

interface CacheEntry<T> {
  value: T
  timestamp: number
  size: number // Tamaño aproximado en bytes
  accessCount: number
  lastAccessed: number
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  currentSize: number
  maxSize: number
  entryCount: number
  hitRate: string
}

class MemoryCache<T = any> {
  private cache: Map<string, CacheEntry<T>>
  private stats: CacheStats
  private readonly maxSizeBytes: number
  private readonly defaultTTL: number
  private currentSizeBytes: number

  constructor(maxSizeMB: number = 10, defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map()
    this.maxSizeBytes = maxSizeMB * 1024 * 1024 // Convertir MB a bytes
    this.defaultTTL = defaultTTL
    this.currentSizeBytes = 0

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      currentSize: 0,
      maxSize: this.maxSizeBytes,
      entryCount: 0,
      hitRate: '0.00%'
    }
  }

  /**
   * Obtener valor del caché
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Verificar si expiró
    const now = Date.now()
    if (now - entry.timestamp > this.defaultTTL) {
      this.delete(key)
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    // Actualizar estadísticas de acceso
    entry.accessCount++
    entry.lastAccessed = now
    this.stats.hits++
    this.updateHitRate()

    return entry.value
  }

  /**
   * Guardar valor en caché
   */
  set(key: string, value: T, customTTL?: number): boolean {
    // Calcular tamaño aproximado del valor
    const size = this.estimateSize(value)

    // Si el valor es demasiado grande, no cachear
    if (size > this.maxSizeBytes * 0.5) {
      // console.warn(`Valor demasiado grande para cachear: ${size} bytes`)
      return false
    }

    // Si existe, eliminar primero
    if (this.cache.has(key)) {
      this.delete(key)
    }

    // Eviction loop: liberar espacio si es necesario
    while (this.currentSizeBytes + size > this.maxSizeBytes && this.cache.size > 0) {
      this.evictLRU()
    }

    // Guardar en caché
    const now = Date.now()
    this.cache.set(key, {
      value,
      timestamp: now,
      size,
      accessCount: 0,
      lastAccessed: now
    })

    this.currentSizeBytes += size
    this.stats.entryCount = this.cache.size
    this.stats.currentSize = this.currentSizeBytes

    return true
  }

  /**
   * Eliminar entrada del caché
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    this.cache.delete(key)
    this.currentSizeBytes -= entry.size
    this.stats.entryCount = this.cache.size
    this.stats.currentSize = this.currentSizeBytes

    return true
  }

  /**
   * Limpiar todo el caché
   */
  clear(): void {
    this.cache.clear()
    this.currentSizeBytes = 0
    this.stats.entryCount = 0
    this.stats.currentSize = 0
  }

  /**
   * Eviction LRU - Eliminar entrada menos recientemente usada
   */
  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
      this.stats.evictions++
    }
  }

  /**
   * Estimar tamaño de un objeto en bytes
   * Aproximación simple pero efectiva
   */
  private estimateSize(obj: any): number {
    const str = JSON.stringify(obj)
    // Cada carácter en UTF-16 (JavaScript) usa 2 bytes
    return str.length * 2
  }

  /**
   * Actualizar hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0
      ? `${((this.stats.hits / total) * 100).toFixed(2)}%`
      : '0.00%'
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      currentSize: this.currentSizeBytes,
      entryCount: this.cache.size
    }
  }

  /**
   * Limpiar entradas expiradas
   */
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.delete(key)
        cleaned++
      }
    }

    return cleaned
  }
}

// ========================================
// INSTANCIAS DE CACHÉ PREDEFINIDAS
// ========================================

/**
 * Caché para validaciones de curso
 * Pequeño y rápido (1MB, 5 min TTL)
 */
export const courseValidationCache = new MemoryCache<{ courseId: string; slug: string }>(
  1, // 1MB
  5 * 60 * 1000 // 5 minutos
)

/**
 * Caché para datos de usuario
 * Muy pequeño y corto TTL (500KB, 1 min)
 */
export const userDataCache = new MemoryCache<any>(
  0.5, // 500KB
  1 * 60 * 1000 // 1 minuto
)

/**
 * Caché para datos de curso (modules, lessons)
 * Más grande, TTL medio (5MB, 10 min)
 */
export const courseDataCache = new MemoryCache<any>(
  5, // 5MB
  10 * 60 * 1000 // 10 minutos
)

/**
 * Caché para queries frecuentes
 * Balanceado (3MB, 5 min)
 */
export const queryCache = new MemoryCache<any>(
  3, // 3MB
  5 * 60 * 1000 // 5 minutos
)

// ========================================
// UTILIDADES
// ========================================

/**
 * Limpiar todos los cachés automáticamente cada 10 minutos
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    courseValidationCache.cleanup()
    userDataCache.cleanup()
    courseDataCache.cleanup()
    queryCache.cleanup()

    if (process.env.NODE_ENV === 'development') {
      // console.log('🧹 Caché cleanup ejecutado')
    }
  }, 10 * 60 * 1000) // Cada 10 minutos
}

/**
 * Obtener estadísticas agregadas de todos los cachés
 */
export function getAllCacheStats() {
  return {
    courseValidation: courseValidationCache.getStats(),
    userData: userDataCache.getStats(),
    courseData: courseDataCache.getStats(),
    query: queryCache.getStats(),
    total: {
      currentSize:
        courseValidationCache.getStats().currentSize +
        userDataCache.getStats().currentSize +
        courseDataCache.getStats().currentSize +
        queryCache.getStats().currentSize,
      maxSize: 10 * 1024 * 1024, // 10MB total
      entries:
        courseValidationCache.getStats().entryCount +
        userDataCache.getStats().entryCount +
        courseDataCache.getStats().entryCount +
        queryCache.getStats().entryCount
    }
  }
}

/**
 * Exportar clase para crear instancias custom
 */
export { MemoryCache }
