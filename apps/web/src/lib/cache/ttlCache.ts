type CacheEntry<T> = { value: T; expiresAt: number }

const globalCache = (globalThis as any).__ayap_ttl_cache__ || new Map<string, CacheEntry<any>>()
;(globalThis as any).__ayap_ttl_cache__ = globalCache

export function cacheGet<T>(key: string): T | undefined {
  const entry = globalCache.get(key) as CacheEntry<T> | undefined
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    globalCache.delete(key)
    return undefined
  }
  return entry.value
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  globalCache.set(key, { value, expiresAt: Date.now() + ttlMs })
}


