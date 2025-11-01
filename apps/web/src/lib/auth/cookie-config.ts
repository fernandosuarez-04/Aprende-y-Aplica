/**
 * ✅ Configuración segura de cookies
 * Implementa atributos de seguridad para prevenir XSS, CSRF y session hijacking
 */

export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,          // ✅ Previene acceso desde JavaScript (XSS)
  secure: process.env.NODE_ENV === 'production', // ✅ Solo HTTPS en producción
  sameSite: 'lax' as const, // ✅ Protección CSRF
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
};

/**
 * Obtiene las opciones de configuración para cookies de sesión
 * @returns Objeto con las opciones de cookie seguras
 */
export function getSessionCookieOptions() {
  return SECURE_COOKIE_OPTIONS;
}

/**
 * Obtiene opciones personalizadas para cookies
 * @param maxAge - Duración en segundos (por defecto 7 días)
 * @returns Objeto con las opciones de cookie
 */
export function getCustomCookieOptions(maxAge?: number) {
  return {
    ...SECURE_COOKIE_OPTIONS,
    maxAge: maxAge || SECURE_COOKIE_OPTIONS.maxAge,
  };
}
