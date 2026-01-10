/**
 * BugReportContextProvider
 * 
 * Provider especializado para proporcionar contexto completo cuando
 * se detecta un reporte de bug. Combina múltiples fuentes de información:
 * 
 * - Contexto técnico de la página (componentes, APIs)
 * - Errores de consola recientes
 * - Bugs similares reportados
 * - Estado de la aplicación
 * - Información del navegador
 */

import { BaseContextProvider } from '../base/BaseContextProvider';
import { PageContextService } from '../../services/page-context.service';
import { ErrorContextService, SimilarBug } from '../../services/error-context.service';
import type { ContextFragment, ContextBuildOptions, EnrichedMetadata, ConsoleError } from '../../types';

export class BugReportContextProvider extends BaseContextProvider {
  readonly name = 'bug-report';
  readonly priority = 100; // Alta prioridad para bugs

  async getContext(options: ContextBuildOptions): Promise<ContextFragment | null> {
    const { contextType, userId, currentPage, enrichedMetadata } = options;

    // Solo incluir si es un reporte de bug
    if (!this.shouldInclude(contextType)) {
      return null;
    }

    const fragments: string[] = [];

    // 1. Contexto técnico de la página (con info detallada para bugs)
    if (currentPage) {
      const pageContext = PageContextService.buildBugReportContext(currentPage);
      if (pageContext && !pageContext.includes('No hay metadata')) {
        fragments.push(pageContext);
      }
    }

    // 2. Componentes activos detectados
    if (enrichedMetadata?.activeComponents && enrichedMetadata.activeComponents.length > 0) {
      fragments.push(this.buildActiveComponentsContext(enrichedMetadata.activeComponents));
    }

    // 3. Errores recientes
    const errorContext = await ErrorContextService.buildErrorContext(
      userId,
      currentPage,
      enrichedMetadata?.errors
    );
    if (errorContext) {
      fragments.push(errorContext);
    }

    // 4. Estado de la aplicación
    if (enrichedMetadata?.apiCalls || enrichedMetadata?.activeModals || enrichedMetadata?.formStates) {
      const stateContext = this.buildAppStateContext(enrichedMetadata);
      if (stateContext) {
        fragments.push(stateContext);
      }
    }

    // 5. Información del navegador
    if (enrichedMetadata?.platform) {
      fragments.push(this.buildBrowserContext(enrichedMetadata.platform));
    }

    // 6. Bugs similares (búsqueda adicional si hay errores específicos)
    if (currentPage && enrichedMetadata?.errors && enrichedMetadata.errors.length > 0) {
      const keywords = this.extractKeywordsFromErrors(enrichedMetadata.errors);
      if (keywords.length > 0) {
        const similarByError = await ErrorContextService.searchBugsByKeywords(keywords, 3);
        if (similarByError.length > 0) {
          fragments.push(this.buildSimilarBugsContext(similarByError, 'por error similar'));
        }
      }
    }

    if (fragments.length === 0) {
      return null;
    }

    const content = `# CONTEXTO PARA REPORTE DE BUG\n\n${fragments.join('\n\n---\n\n')}`;

    return {
      type: 'bug-report',
      content,
      priority: this.priority,
      tokens: this.estimateTokens(content)
    };
  }

  shouldInclude(contextType: string): boolean {
    return contextType === 'bug-report' || this.isBugRelated(contextType);
  }

  /**
   * Detecta si el contexto está relacionado con bugs
   */
  private isBugRelated(contextType: string): boolean {
    const bugKeywords = ['bug', 'error', 'problema', 'falla', 'issue', 'reporte'];
    return bugKeywords.some(keyword => 
      contextType.toLowerCase().includes(keyword)
    );
  }

  /**
   * Construye contexto de componentes activos
   */
  private buildActiveComponentsContext(activeComponents: import('../../types').ActiveComponent[]): string {
    let context = `## COMPONENTES ACTIVOS DETECTADOS\n\n`;
    context += `Los siguientes componentes están actualmente renderizados en la página:\n\n`;
    
    activeComponents.forEach(comp => {
      context += `- \`${comp.name}\` (${comp.selector})\n`;
    });
    
    context += `\n_Estos componentes pueden estar involucrados en el problema reportado._`;
    
    return context;
  }

  /**
   * Construye contexto del estado de la aplicación
   */
  private buildAppStateContext(metadata: EnrichedMetadata): string {
    const sections: string[] = [];
    
    sections.push(`## ESTADO ACTUAL DE LA APLICACIÓN`);
    
    // Información de la sesión
    if (metadata.sessionDuration) {
      const minutes = Math.floor(metadata.sessionDuration / 60000);
      sections.push(`\n**Duración de sesión:** ${minutes} minutos`);
    }
    
    // Resumen de errores
    if (metadata.errorSummary) {
      sections.push(`\n### Resumen de errores:`);
      sections.push(metadata.errorSummary);
    }
    
    // Marcadores de contexto
    if (metadata.contextMarkers && metadata.contextMarkers.length > 0) {
      sections.push(`\n### Marcadores de contexto:`);
      metadata.contextMarkers.forEach(marker => {
        sections.push(`- ${marker}`);
      });
    }
    
    return sections.join('\n');
  }

  /**
   * Construye contexto del navegador
   */
  private buildBrowserContext(platform: EnrichedMetadata['platform']): string {
    if (!platform) return '';
    
    let context = `## INFORMACIÓN DEL ENTORNO\n\n`;
    
    if (platform.browser) {
      context += `- **Navegador:** ${platform.browser}`;
      if (platform.version) {
        context += ` v${platform.version}`;
      }
      context += `\n`;
    }
    if (platform.os) {
      context += `- **Sistema Operativo:** ${platform.os}\n`;
    }
    
    return context;
  }

  /**
   * Construye contexto de bugs similares
   */
  private buildSimilarBugsContext(bugs: SimilarBug[], reason: string = ''): string {
    let context = `## BUGS SIMILARES ENCONTRADOS${reason ? ` (${reason})` : ''}\n\n`;
    context += `Se encontraron ${bugs.length} bugs que podrían estar relacionados:\n\n`;
    
    bugs.forEach((bug, index) => {
      const estado = bug.estado || 'pendiente';
      const prioridad = bug.prioridad ? ` [${bug.prioridad}]` : '';
      
      context += `### ${index + 1}. ${bug.titulo}${prioridad}\n`;
      context += `- **Estado:** ${estado}\n`;
      context += `- **Categoría:** ${bug.categoria}\n`;
      context += `- **Página:** ${bug.pathname || bug.pagina_url}\n`;
      
      // Descripción resumida
      if (bug.descripcion) {
        const desc = bug.descripcion.substring(0, 200) + 
          (bug.descripcion.length > 200 ? '...' : '');
        context += `- **Descripción:** ${desc}\n`;
      }
      
      // Pasos para reproducir si existen
      if (bug.pasos_reproducir) {
        context += `- **Pasos:** ${bug.pasos_reproducir.substring(0, 150)}...\n`;
      }
      
      // Notas del admin si existen y el bug está resuelto
      if (bug.estado === 'resuelto' && bug.notas_admin) {
        context += `- **Solución aplicada:** ${bug.notas_admin}\n`;
      }
      
      context += `\n`;
    });
    
    return context;
  }

  /**
   * Extrae palabras clave relevantes de los errores
   */
  private extractKeywordsFromErrors(errors: ConsoleError[]): string[] {
    const keywords: Set<string> = new Set();
    
    errors.forEach(error => {
      // Extraer palabras clave del mensaje de error
      const words = error.message.split(/\s+/);
      
      words.forEach(word => {
        // Filtrar palabras comunes y quedarnos con las significativas
        const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        
        if (cleanWord.length > 4 && !this.isCommonWord(cleanWord)) {
          keywords.add(cleanWord);
        }
      });
      
      // Extraer nombres de componentes o funciones del stack
      if (error.stack) {
        const componentMatch = error.stack.match(/at (\w+)/g);
        if (componentMatch) {
          componentMatch.slice(0, 3).forEach(match => {
            const name = match.replace('at ', '');
            if (name.length > 3 && name[0] === name[0].toUpperCase()) {
              keywords.add(name.toLowerCase());
            }
          });
        }
      }
    });
    
    return Array.from(keywords).slice(0, 5);
  }

  /**
   * Verifica si una palabra es común y debe ignorarse
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'error', 'undefined', 'null', 'cannot', 'failed', 'unable',
      'read', 'write', 'property', 'function', 'object', 'array',
      'type', 'value', 'expected', 'received', 'invalid', 'missing',
      'this', 'that', 'with', 'from', 'have', 'been', 'does', 'does not'
    ];
    
    return commonWords.includes(word);
  }
}
