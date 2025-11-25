import { SkillLevel, SKILL_LEVEL_INFO } from '../constants/skillLevels'

export class SkillLevelService {
  /**
   * Calcula el nivel de skill basado en la cantidad de cursos completados
   */
  static calculateSkillLevel(courseCount: number): SkillLevel | null {
    if (courseCount >= 5) return 'diamond'
    if (courseCount >= 4) return 'gold'
    if (courseCount >= 3) return 'silver'
    if (courseCount >= 2) return 'bronze'
    if (courseCount >= 1) return 'green'
    return null
  }

  /**
   * Obtiene información del nivel
   */
  static getLevelInfo(level: SkillLevel) {
    return SKILL_LEVEL_INFO[level]
  }

  /**
   * Genera el nombre del archivo del badge según el patrón
   * Patrón: {skill-slug}-{level}.png
   */
  static getBadgeFileName(skillSlug: string, level: SkillLevel): string {
    return `${skillSlug}-${level}.png`
  }

  /**
   * Genera la URL del badge desde Supabase Storage
   * Nota: La URL real se obtiene desde la tabla skill_badges o desde Storage
   */
  static getBadgeUrl(skillSlug: string, level: SkillLevel, baseUrl?: string): string {
    if (baseUrl) {
      return `${baseUrl}/${this.getBadgeFileName(skillSlug, level)}`
    }
    // Si no hay baseUrl, retornar patrón esperado
    return this.getBadgeFileName(skillSlug, level)
  }
}

