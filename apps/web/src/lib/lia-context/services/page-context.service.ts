/**
 * PageContextService
 * 
 * Servicio para obtener y construir contexto de páginas para SofLIA.
 * Proporciona información técnica sobre la página actual incluyendo
 * componentes, APIs, flujos de usuario y problemas comunes.
 * 
 * Incluye caché para mejorar rendimiento.
 */

import { PAGE_METADATA } from '../config/page-metadata';
import type { PageMetadata } from '../types';
import { ContextCacheService } from './context-cache.service';

export class PageContextService {
  /**
   * Obtiene metadata de la página actual basado en la ruta
   * @param currentPage - Ruta actual del usuario (ej: /acme/business-panel/courses)
   * @returns Metadata de la página o null si no hay match
   */
  static getPageMetadata(currentPage: string): PageMetadata | null {
    if (!currentPage) return null;

    // Normalizar la ruta (quitar trailing slash, etc.)
    const normalizedPage = this.normalizePath(currentPage);

    // 1. Buscar coincidencia exacta (raro, pero posible para rutas estáticas)
    if (PAGE_METADATA[normalizedPage]) {
      return PAGE_METADATA[normalizedPage];
    }

    // 2. Buscar por patrón (para rutas dinámicas como /[orgSlug]/business-panel/*)
    for (const [, metadata] of Object.entries(PAGE_METADATA)) {
      const pattern = this.routeToRegex(metadata.routePattern);
      if (pattern.test(normalizedPage)) {
        return metadata;
      }
    }

    return null;
  }

  /**
   * Construye contexto de página formateado para incluir en el prompt de SofLIA
   * @param currentPage - Ruta actual del usuario
   * @returns String formateado con el contexto de la página
   */
  static buildPageContext(currentPage: string): string {
    // Verificar caché primero
    const cacheKey = `context:${currentPage}`;
    const cached = ContextCacheService.getPageContext(cacheKey);
    if (cached) {
      return cached;
    }

    const metadata = this.getPageMetadata(currentPage);

    if (!metadata) {
      return `**Página actual:** ${currentPage}\n_No hay metadata técnica disponible para esta página._`;
    }

    const sections: string[] = [];

    // Header
    sections.push(`## CONTEXTO TÉCNICO DE LA PÁGINA ACTUAL\n`);
    sections.push(`**Ruta:** ${currentPage}`);
    sections.push(`**Tipo de página:** ${metadata.pageType}\n`);

    // Componentes
    if (metadata.components.length > 0) {
      sections.push(`### Componentes principales:`);
      metadata.components.forEach(comp => {
        sections.push(`- **${comp.name}**: ${comp.description}`);
        if (comp.commonErrors && comp.commonErrors.length > 0) {
          sections.push(`  - Errores comunes: ${comp.commonErrors.slice(0, 2).join('; ')}`);
        }
      });
      sections.push('');
    }

    // APIs (solo las más relevantes)
    if (metadata.apis.length > 0) {
      sections.push(`### APIs utilizadas:`);
      metadata.apis.slice(0, 3).forEach(api => {
        sections.push(`- **${api.method} ${api.endpoint}**: ${api.description}`);
      });
      sections.push('');
    }

    // Flujos de usuario (solo nombres)
    if (metadata.userFlows.length > 0) {
      sections.push(`### Flujos de usuario disponibles:`);
      metadata.userFlows.forEach(flow => {
        sections.push(`- ${flow.name}`);
      });
      sections.push('');
    }

    // Problemas comunes (solo si hay)
    if (metadata.commonIssues.length > 0) {
      sections.push(`### Problemas conocidos en esta página:`);
      metadata.commonIssues.slice(0, 2).forEach(issue => {
        sections.push(`- **${issue.description}**`);
        sections.push(`  - Posibles causas: ${issue.possibleCauses.slice(0, 2).join(', ')}`);
      });
    }

    const result = sections.join('\n');
    
    // Guardar en caché
    ContextCacheService.setPageContext(cacheKey, result);
    
    return result;
  }

  /**
   * Construye contexto detallado para reportes de bug
   * Incluye más información técnica que el contexto normal
   * @param currentPage - Ruta actual del usuario
   * @returns String formateado con contexto detallado para bugs
   */
  static buildBugReportContext(currentPage: string): string {
    const metadata = this.getPageMetadata(currentPage);

    if (!metadata) {
      return `**Página del bug:** ${currentPage}\n_No hay metadata técnica disponible._`;
    }

    const sections: string[] = [];

    // Header
    sections.push(`## INFORMACIÓN TÉCNICA PARA REPORTE DE BUG\n`);
    sections.push(`**Página afectada:** ${currentPage}`);
    sections.push(`**Tipo de página:** ${metadata.pageType}`);
    sections.push(`**Patrón de ruta:** ${metadata.routePattern}\n`);

    // Componentes con errores comunes
    if (metadata.components.length > 0) {
      sections.push(`### Componentes en esta página:`);
      metadata.components.forEach(comp => {
        sections.push(`- **${comp.name}**`);
        sections.push(`  - Archivo: \`${comp.path}\``);
        sections.push(`  - Descripción: ${comp.description}`);
        if (comp.props && comp.props.length > 0) {
          sections.push(`  - Props: ${comp.props.join(', ')}`);
        }
        if (comp.commonErrors && comp.commonErrors.length > 0) {
          sections.push(`  - Errores comunes:`);
          comp.commonErrors.forEach(err => {
            sections.push(`    - ${err}`);
          });
        }
      });
      sections.push('');
    }

    // APIs completas
    if (metadata.apis.length > 0) {
      sections.push(`### APIs utilizadas:`);
      metadata.apis.forEach(api => {
        sections.push(`- **${api.method} ${api.endpoint}**`);
        sections.push(`  - ${api.description}`);
        if (api.commonErrors && api.commonErrors.length > 0) {
          sections.push(`  - Errores comunes:`);
          api.commonErrors.forEach(err => {
            sections.push(`    - ${err}`);
          });
        }
      });
      sections.push('');
    }

    // Flujos de usuario con breakpoints
    if (metadata.userFlows.length > 0) {
      sections.push(`### Flujos de usuario y puntos de fallo:`);
      metadata.userFlows.forEach(flow => {
        sections.push(`- **${flow.name}**`);
        if (flow.commonBreakpoints && flow.commonBreakpoints.length > 0) {
          sections.push(`  - Puntos de fallo comunes: ${flow.commonBreakpoints.join('; ')}`);
        }
      });
      sections.push('');
    }

    // Problemas comunes con soluciones
    if (metadata.commonIssues.length > 0) {
      sections.push(`### Problemas conocidos y soluciones:`);
      metadata.commonIssues.forEach(issue => {
        sections.push(`- **${issue.description}**`);
        sections.push(`  - Causas: ${issue.possibleCauses.join(', ')}`);
        sections.push(`  - Soluciones: ${issue.solutions.join(', ')}`);
      });
    }

    return sections.join('\n');
  }

  /**
   * Obtiene información de un componente específico por nombre
   * @param currentPage - Ruta actual
   * @param componentName - Nombre del componente a buscar
   * @returns Información del componente o null
   */
  static getComponentInfo(currentPage: string, componentName: string) {
    const metadata = this.getPageMetadata(currentPage);
    if (!metadata) return null;

    return metadata.components.find(
      comp => comp.name.toLowerCase() === componentName.toLowerCase()
    ) || null;
  }

  /**
   * Obtiene problemas comunes para una página
   * @param currentPage - Ruta actual
   * @returns Array de problemas comunes
   */
  static getCommonIssues(currentPage: string) {
    const metadata = this.getPageMetadata(currentPage);
    return metadata?.commonIssues || [];
  }

  /**
   * Obtiene flujos de usuario para una página
   * @param currentPage - Ruta actual
   * @returns Array de flujos de usuario
   */
  static getUserFlows(currentPage: string) {
    const metadata = this.getPageMetadata(currentPage);
    return metadata?.userFlows || [];
  }

  /**
   * Normaliza una ruta para comparación
   */
  private static normalizePath(path: string): string {
    // Quitar trailing slash
    let normalized = path.replace(/\/$/, '');
    // Quitar query strings
    normalized = normalized.split('?')[0];
    // Quitar hash
    normalized = normalized.split('#')[0];
    return normalized;
  }

  /**
   * Convierte un patrón de ruta a regex
   * Ejemplo: /{orgSlug}/business-panel/courses -> /[^/]+/business-panel/courses
   */
  private static routeToRegex(pattern: string): RegExp {
    // Escapar caracteres especiales de regex
    let regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Reemplazar {variable} con patrón que matchea cualquier segmento
    regexPattern = regexPattern.replace(/\\{[^}]+\\}/g, '[^/]+');
    
    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * Estima el número de tokens del contexto generado
   * (Aproximación: ~4 caracteres por token)
   */
  static estimateTokens(context: string): number {
    return Math.ceil(context.length / 4);
  }
}

