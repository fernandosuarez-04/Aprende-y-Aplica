// Cache temporal en memoria para sesiones SCORM
// En producción se debería usar Redis para persistencia entre instancias

interface CacheEntry {
  data: Map<string, string>;
  lastAccess: number;
}

const sessionCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

// Limpiar cache periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of sessionCache.entries()) {
    if (now - entry.lastAccess > CACHE_TTL) {
      sessionCache.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cada 5 minutos

export function getSessionCache(attemptId: string): Map<string, string> {
  let entry = sessionCache.get(attemptId);
  if (!entry) {
    entry = { data: new Map(), lastAccess: Date.now() };
    sessionCache.set(attemptId, entry);
  } else {
    entry.lastAccess = Date.now();
  }
  return entry.data;
}

export function setSessionValue(attemptId: string, key: string, value: string): void {
  const cache = getSessionCache(attemptId);
  cache.set(key, value);
}

export function getSessionValue(attemptId: string, key: string): string | undefined {
  const cache = getSessionCache(attemptId);
  return cache.get(key);
}

export function clearSessionCache(attemptId: string): void {
  sessionCache.delete(attemptId);
}

export function hasSessionCache(attemptId: string): boolean {
  return sessionCache.has(attemptId);
}
