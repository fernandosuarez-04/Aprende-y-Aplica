/**
 * PlatformContextProvider
 * 
 * Provee contexto general sobre la plataforma SOFLIA a LIA.
 * Incluye informaciÃ³n de funcionalidades, mÃ³dulos activos y capacidades.
 */

import { BaseContextProvider } from '../base/BaseContextProvider';
import type { ContextFragment, ContextBuildOptions } from '../../types';

/**
 * MÃ³dulos principales de la plataforma
 */
const PLATFORM_MODULES = {
  courses: {
    name: 'Cursos',
    description: 'Sistema de cursos con lecciones en video, actividades interactivas y certificados',
    features: ['Videos', 'Actividades', 'Quizzes', 'Certificados', 'Progreso automÃ¡tico']
  },
  studyPlanner: {
    name: 'Planificador de Estudio',
    description: 'Herramienta de planificaciÃ³n de estudio con IA',
    features: ['GeneraciÃ³n de planes con IA', 'IntegraciÃ³n con calendario', 'Recordatorios']
  },
  communities: {
    name: 'Comunidades',
    description: 'Red social interna para interacciÃ³n entre usuarios',
    features: ['Posts', 'Comentarios', 'Likes', 'Comunidades pÃºblicas y privadas']
  },
  businessPanel: {
    name: 'Panel Empresarial',
    description: 'Herramientas de gestiÃ³n para administradores de empresas',
    features: ['GestiÃ³n de usuarios', 'AsignaciÃ³n de cursos', 'Reportes', 'Analytics', 'JerarquÃ­a de equipos']
  },
  aiDirectory: {
    name: 'Directorio de IA',
    description: 'CatÃ¡logo de herramientas y aplicaciones de IA',
    features: ['Apps de IA', 'Prompts', 'CategorÃ­as', 'Favoritos']
  },
  lia: {
    name: 'LIA - Asistente de IA',
    description: 'Asistente inteligente integrado en toda la plataforma',
    features: ['Chat contextual', 'Ayuda en cursos', 'PlanificaciÃ³n de estudio', 'Reporte de bugs']
  },
  workshops: {
    name: 'Talleres',
    description: 'Eventos en vivo y sesiones interactivas',
    features: ['Eventos programados', 'Registro', 'Recordatorios']
  },
  news: {
    name: 'Noticias',
    description: 'Sistema de artÃ­culos y noticias de la plataforma',
    features: ['ArtÃ­culos', 'CategorÃ­as', 'Lectura estimada']
  },
  certificates: {
    name: 'Certificados',
    description: 'Sistema de certificaciÃ³n por completar cursos',
    features: ['GeneraciÃ³n automÃ¡tica', 'VerificaciÃ³n pÃºblica', 'Descarga en PDF']
  },
  reels: {
    name: 'Reels',
    description: 'Videos cortos educativos',
    features: ['Videos verticales', 'NavegaciÃ³n tipo TikTok', 'Likes']
  }
};

/**
 * Roles de usuario en la plataforma
 */
const USER_ROLES = {
  user: 'Usuario estÃ¡ndar - Acceso a cursos y comunidades',
  business_user: 'Usuario empresarial - Acceso a cursos asignados por su empresa',
  business_admin: 'Admin empresarial - GestiÃ³n de usuarios y cursos de su empresa',
  instructor: 'Instructor - CreaciÃ³n y gestiÃ³n de cursos propios',
  admin: 'Administrador - Acceso completo a la plataforma'
};

export class PlatformContextProvider extends BaseContextProvider {
  readonly name = 'platform';
  readonly priority = 10; // Baja prioridad, contexto general

  async getContext(options: ContextBuildOptions): Promise<ContextFragment | null> {
    const { contextType, currentPage } = options;

    // Construir contexto segÃºn el tipo solicitado
    const content = this.buildPlatformContext(contextType, currentPage);

    return {
      type: 'platform',
      content,
      priority: this.priority,
      tokens: this.estimateTokens(content)
    };
  }

  shouldInclude(contextType: string): boolean {
    // Incluir solo en contextos generales o cuando se pide explÃ­citamente
    return ['general', 'help', 'platform', 'onboarding'].includes(contextType);
  }

  /**
   * Construye el contexto de la plataforma
   */
  private buildPlatformContext(contextType: string, currentPage?: string): string {
    const sections: string[] = [];

    sections.push('## CONTEXTO DE LA PLATAFORMA SOFLIA');
    sections.push('');
    sections.push('SOFLIA es una plataforma de aprendizaje corporativo con IA integrada.');
    sections.push('');

    // MÃ³dulos relevantes segÃºn la pÃ¡gina actual
    const relevantModules = this.getRelevantModules(currentPage);
    
    sections.push('### MÃ³dulos Principales');
    for (const moduleKey of relevantModules) {
      const module = PLATFORM_MODULES[moduleKey as keyof typeof PLATFORM_MODULES];
      if (module) {
        sections.push(`\n**${module.name}**: ${module.description}`);
        sections.push(`- Funciones: ${module.features.slice(0, 3).join(', ')}`);
      }
    }

    // Roles si es contexto de ayuda general
    if (contextType === 'help' || contextType === 'onboarding') {
      sections.push('\n### Roles de Usuario');
      for (const [role, description] of Object.entries(USER_ROLES)) {
        sections.push(`- **${role}**: ${description}`);
      }
    }

    sections.push('\n### Notas para LIA');
    sections.push('- Responder en espaÃ±ol por defecto');
    sections.push('- Ser amigable pero profesional');
    sections.push('- Cuando no sepas algo, sugerir contactar soporte');

    return sections.join('\n');
  }

  /**
   * Determina quÃ© mÃ³dulos son relevantes para la pÃ¡gina actual
   */
  private getRelevantModules(currentPage?: string): string[] {
    if (!currentPage) {
      // Si no hay pÃ¡gina, devolver los mÃ¡s importantes
      return ['courses', 'lia', 'studyPlanner', 'communities'];
    }

    const page = currentPage.toLowerCase();

    // Mapear pÃ¡gina a mÃ³dulos relevantes
    if (page.includes('course') || page.includes('learn')) {
      return ['courses', 'lia', 'certificates'];
    }
    if (page.includes('study-planner')) {
      return ['studyPlanner', 'lia', 'courses'];
    }
    if (page.includes('communit')) {
      return ['communities', 'lia'];
    }
    if (page.includes('business-panel')) {
      return ['businessPanel', 'courses', 'lia'];
    }
    if (page.includes('business-user')) {
      return ['courses', 'lia', 'certificates'];
    }
    if (page.includes('apps-directory') || page.includes('prompt-directory')) {
      return ['aiDirectory', 'lia'];
    }
    if (page.includes('workshop')) {
      return ['workshops', 'lia'];
    }
    if (page.includes('news')) {
      return ['news', 'lia'];
    }
    if (page.includes('reel')) {
      return ['reels', 'lia'];
    }
    if (page.includes('admin')) {
      return ['businessPanel', 'lia', 'courses', 'communities'];
    }
    if (page.includes('instructor')) {
      return ['courses', 'lia', 'workshops'];
    }

    // Default
    return ['courses', 'lia', 'studyPlanner', 'communities'];
  }
}
