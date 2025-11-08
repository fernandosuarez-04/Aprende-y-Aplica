/**
 * Utilidad para obtener la URL base de la aplicación de forma dinámica
 * Detecta automáticamente el entorno y puerto para evitar URLs hardcodeadas
 */

/**
 * Obtiene la URL base de la aplicación según el entorno
 * @returns URL base completa (ej: http://localhost:3000 o https://produccion.com)
 */
export function getBaseUrl(): string {
  // En el servidor (Node.js)
  if (typeof window === 'undefined') {
    // 1. Vercel u otros servicios en producción
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // 2. Variable personalizada para producción
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    
    // 3. Desarrollo local - detectar puerto automáticamente
    const port = process.env.PORT || '3000';
    return `http://localhost:${port}`;
  }
  
  // En el cliente (navegador)
  // Priorizar NEXT_PUBLIC_APP_URL si está disponible (para producción)
  // Esto asegura que los QRs generados apunten a la URL de producción
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Fallback: usar window.location para obtener el origen actual
  return window.location.origin;
}

/**
 * Obtiene la URL completa para un path específico
 * @param path - Ruta relativa (debe comenzar con /)
 * @returns URL completa
 * @example getFullUrl('/api/auth/callback') => 'http://localhost:3000/api/auth/callback'
 */
export function getFullUrl(path: string): string {
  const baseUrl = getBaseUrl();
  // Asegurar que el path comience con /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
