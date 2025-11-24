/**
 * Utilidades para sanitización y generación de slugs seguros
 * Previene: XSS, Path Traversal, URLs rotas, caracteres especiales
 */

/**
 * Sanitiza una cadena para convertirla en un slug válido y seguro
 * 
 * Características:
 * - Convierte a lowercase
 * - Remueve acentos y caracteres especiales
 * - Solo permite: letras, números, guiones
 * - Previene path traversal (../, ..\)
 * - Previene XSS (<script>, etc)
 * 
 * @param input - Texto a convertir en slug
 * @returns Slug sanitizado y seguro
 * 
 * @example
 * sanitizeSlug("Comunidad de Aprendizaje") // "comunidad-de-aprendizaje"
 * sanitizeSlug("Programación en C++") // "programacion-en-c"
 * sanitizeSlug("../../../etc/passwd") // "etc-passwd"
 * sanitizeSlug("<script>alert(1)</script>") // "script-alert-1-script"
 * sanitizeSlug("Comunidad ñoño 😀") // "comunidad-nono"
 */
export function sanitizeSlug(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .toLowerCase()
    .trim()
    // Normalizar caracteres Unicode (descomponer caracteres con tildes)
    .normalize('NFD')
    // Remover marcas diacríticas (acentos, tildes)
    .replace(/[\u0300-\u036f]/g, '')
    // Reemplazar espacios por guiones
    .replace(/\s+/g, '-')
    // Remover caracteres no permitidos (solo letras, números, guiones)
    .replace(/[^a-z0-9-]/g, '-')
    // Reemplazar múltiples guiones consecutivos por uno solo
    .replace(/-+/g, '-')
    // Remover guiones al inicio y al final
    .replace(/^-+|-+$/g, '')
    // Limitar longitud a 100 caracteres
    .substring(0, 100);
}

/**
 * Valida si un slug es válido según las reglas de seguridad
 * 
 * @param slug - Slug a validar
 * @returns true si el slug es válido, false si no
 * 
 * @example
 * isValidSlug("comunidad-aprendizaje") // true
 * isValidSlug("../etc/passwd") // false
 * isValidSlug("<script>") // false
 * isValidSlug("slug con espacios") // false
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Reglas de validación:
  // - Solo lowercase, números y guiones
  // - No puede empezar o terminar con guión
  // - Longitud entre 3 y 100 caracteres
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  
  return (
    slugRegex.test(slug) &&
    slug.length >= 3 &&
    slug.length <= 100
  );
}

/**
 * Genera un slug único agregando un número al final si es necesario
 * 
 * @param baseName - Nombre base para generar el slug
 * @param existingSlugs - Array de slugs existentes para evitar duplicados
 * @returns Slug único
 * 
 * @example
 * generateUniqueSlug("comunidad", ["comunidad"]) // "comunidad-1"
 * generateUniqueSlug("curso", ["curso", "curso-1"]) // "curso-2"
 */
export function generateUniqueSlug(
  baseName: string,
  existingSlugs: string[] = []
): string {
  // Sanitizar el nombre base
  let slug = sanitizeSlug(baseName);

  // Si el slug está vacío después de sanitizar, usar un valor por defecto
  if (!slug) {
    slug = `item-${Date.now()}`;
  }

  // Si no existe, retornar directamente
  if (!existingSlugs.includes(slug)) {
    return slug;
  }

  // Generar slug único agregando número
  let counter = 1;
  let uniqueSlug = `${slug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${slug}-${counter}`;
    
    // Prevenir loops infinitos
    if (counter > 1000) {
      // Agregar timestamp para garantizar unicidad
      return `${slug}-${Date.now()}`;
    }
  }

  return uniqueSlug;
}

/**
 * Genera un slug desde un nombre, verificando contra la base de datos
 * Versión async para uso con Supabase
 * 
 * @param baseName - Nombre base
 * @param checkExists - Función async que verifica si un slug existe
 * @returns Slug único garantizado
 * 
 * @example
 * const slug = await generateUniqueSlugAsync(
 *   "Mi Comunidad",
 *   async (slug) => {
 *     const { data } = await supabase
 *       .from('communities')
 *       .select('slug')
 *       .eq('slug', slug)
 *       .single();
 *     return !!data;
 *   }
 * );
 */
export async function generateUniqueSlugAsync(
  baseName: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = sanitizeSlug(baseName);

  if (!slug) {
    slug = `item-${Date.now()}`;
  }

  // Verificar si existe
  const exists = await checkExists(slug);
  if (!exists) {
    return slug;
  }

  // Generar slug único con contador
  let counter = 1;
  let uniqueSlug = `${slug}-${counter}`;

  while (await checkExists(uniqueSlug)) {
    counter++;
    uniqueSlug = `${slug}-${counter}`;

    if (counter > 1000) {
      return `${slug}-${Date.now()}`;
    }
  }

  return uniqueSlug;
}

/**
 * Extrae un slug limpio de una URL completa
 * 
 * @param url - URL completa o parcial
 * @returns Slug extraído y sanitizado
 * 
 * @example
 * extractSlugFromUrl("/communities/mi-comunidad") // "mi-comunidad"
 * extractSlugFromUrl("https://example.com/curso/javascript-101") // "javascript-101"
 */
export function extractSlugFromUrl(url: string): string {
  if (!url) return '';

  // Remover protocolo y dominio si existen
  const path = url.replace(/^https?:\/\/[^/]+/, '');
  
  // Obtener la última parte del path
  const segments = path.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || '';

  // Sanitizar por seguridad
  return sanitizeSlug(lastSegment);
}
