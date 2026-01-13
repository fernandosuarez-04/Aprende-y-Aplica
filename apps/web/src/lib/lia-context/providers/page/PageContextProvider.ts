/**
 * PageContextProvider
 * 
 * Provider de contexto que proporciona información técnica sobre
 * la página actual donde se encuentra el usuario.
 */

import { BaseContextProvider } from '../base/BaseContextProvider';
import { PageContextService } from '../../services/page-context.service';
import type { ContextFragment, ContextBuildOptions } from '../../types';

export class PageContextProvider extends BaseContextProvider {
  readonly name = 'page';
  readonly priority = 50; // Prioridad media

  async getContext(options: ContextBuildOptions): Promise<ContextFragment | null> {
    const { currentPage, isBugReport } = options;

    if (!currentPage) {
      return null;
    }

    // Usar contexto detallado si es reporte de bug
    const content = isBugReport
      ? PageContextService.buildBugReportContext(currentPage)
      : PageContextService.buildPageContext(currentPage);

    if (!content || content.includes('No hay metadata')) {
      return null;
    }

    return {
      type: 'page',
      content,
      priority: this.priority,
      tokens: this.estimateTokens(content)
    };
  }

  shouldInclude(contextType: string): boolean {
    // Incluir para cualquier tipo de contexto que involucre la página
    return [
      'general',
      'bug-report',
      'help',
      'navigation',
      'page'
    ].includes(contextType);
  }
}






