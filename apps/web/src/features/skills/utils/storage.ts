import { SkillLevel } from '../constants/skillLevels'
import { SkillLevelService } from '../services/skillLevel.service'

/**
 * Obtiene la URL del badge desde Supabase Storage
 * Primero intenta obtener desde la tabla skill_badges
 * Si no existe, genera URL basada en el patrón esperado
 */
export async function getSkillBadgeUrl(
  skillSlug: string,
  level: SkillLevel,
  badgeUrlFromDb?: string | null
): Promise<string | null> {
  // Si hay URL desde la BD, usarla
  if (badgeUrlFromDb) {
    return badgeUrlFromDb
  }

  // Si no, intentar construir URL desde Supabase Storage
  // Esto requiere que el bucket "Skills" sea público o que tengamos acceso
  const fileName = SkillLevelService.getBadgeFileName(skillSlug, level)
  
  // Retornar null si no hay badge disponible (el componente mostrará fallback)
  return null
}

/**
 * Genera la URL pública de Supabase Storage para un badge
 */
export function generateSupabaseStorageUrl(
  bucketName: string,
  filePath: string,
  supabaseUrl: string
): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`
}

