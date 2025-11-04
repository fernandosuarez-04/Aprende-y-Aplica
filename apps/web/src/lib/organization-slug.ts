/**
 * Utilidades para generar y validar slugs de organizaciones
 */

/**
 * Genera un slug único desde el nombre de una organización
 * @param name Nombre de la organización
 * @returns Slug normalizado (ej: "Mi Empresa" -> "mi-empresa")
 */
export function generateOrganizationSlug(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error('El nombre debe ser una cadena válida');
  }

  // Normalizar: minúsculas, trim
  let slug = name.trim().toLowerCase();

  // Reemplazar caracteres especiales y espacios con guiones
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  slug = slug.replace(/\s+/g, '-');

  // Remover guiones múltiples
  slug = slug.replace(/-+/g, '-');

  // Remover guiones al inicio y fin
  slug = slug.replace(/^-+|-+$/g, '');

  // Limitar longitud a 50 caracteres
  if (slug.length > 50) {
    slug = slug.substring(0, 50);
    // Asegurar que no termine en guion
    slug = slug.replace(/-+$/, '');
  }

  // Si el slug está vacío, usar 'org' como base
  if (!slug || slug.length === 0) {
    slug = 'org';
  }

  return slug;
}

/**
 * Valida que un slug tenga formato correcto
 * @param slug Slug a validar
 * @returns true si es válido, false si no
 */
export function isValidOrganizationSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Debe tener entre 1 y 50 caracteres
  if (slug.length < 1 || slug.length > 50) {
    return false;
  }

  // Solo letras minúsculas, números y guiones
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug)) {
    return false;
  }

  // No puede empezar o terminar con guion
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return false;
  }

  // No puede tener guiones múltiples consecutivos
  if (slug.includes('--')) {
    return false;
  }

  return true;
}

/**
 * Genera un slug único agregando un número si es necesario
 * @param baseSlug Slug base
 * @param existingSlugs Array de slugs existentes
 * @param maxAttempts Número máximo de intentos
 * @returns Slug único
 */
export function generateUniqueOrganizationSlug(
  baseSlug: string,
  existingSlugs: string[],
  maxAttempts: number = 100
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  for (let i = 1; i <= maxAttempts; i++) {
    const candidateSlug = `${baseSlug}-${i}`;
    if (!existingSlugs.includes(candidateSlug)) {
      return candidateSlug;
    }
  }

  // Si no se encontró uno único, usar timestamp
  return `${baseSlug}-${Date.now()}`;
}

