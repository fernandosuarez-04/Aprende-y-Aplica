/**
 * ErrorContextService
 * 
 * Servicio para obtener y construir contexto de errores para SofLIA.
 * Proporciona información sobre:
 * - Errores recientes del usuario
 * - Bugs similares reportados en la misma página
 * - Patrones de errores conocidos
 */

import { createClient } from '@/lib/supabase/server';
import type { ConsoleError } from '../types';

/**
 * Tipo de error que puede provenir del cliente
 * Compatible con ConsoleError del sistema de tipos
 */
export interface UserError {
  message: string;
  stack?: string;
  url?: string;
  timestamp?: Date;
  type?: string;
}

export interface SimilarBug {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  estado: string | null;
  pagina_url: string;
  pathname: string | null;
  prioridad: string | null;
  pasos_reproducir: string | null;
  comportamiento_esperado: string | null;
  created_at: string | null;
  notas_admin: string | null;
}

export class ErrorContextService {
  /**
   * Obtiene bugs similares basados en la página actual
   * @param currentPage - Ruta actual del usuario
   * @param limit - Número máximo de bugs a retornar
   * @returns Array de bugs similares
   */
  static async getSimilarBugs(currentPage: string, limit: number = 5): Promise<SimilarBug[]> {
    try {
      const supabase = await createClient();
      
      // Extraer el pathname sin parámetros dinámicos
      const normalizedPath = this.normalizePath(currentPage);
      
      // Buscar bugs en la misma página o páginas similares
      const { data, error } = await supabase
        .from('reportes_problemas')
        .select(`
          id,
          titulo,
          descripcion,
          categoria,
          estado,
          pagina_url,
          pathname,
          prioridad,
          pasos_reproducir,
          comportamiento_esperado,
          created_at,
          notas_admin
        `)
        .or(`pathname.ilike.%${normalizedPath}%,pagina_url.ilike.%${normalizedPath}%`)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('[ErrorContextService] Error fetching similar bugs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('[ErrorContextService] Exception fetching similar bugs:', error);
      return [];
    }
  }

  /**
   * Obtiene bugs recientes del usuario actual
   * @param userId - ID del usuario
   * @param limit - Número máximo de bugs a retornar
   * @returns Array de bugs del usuario
   */
  static async getUserRecentBugs(userId: string, limit: number = 3): Promise<SimilarBug[]> {
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('reportes_problemas')
        .select(`
          id,
          titulo,
          descripcion,
          categoria,
          estado,
          pagina_url,
          pathname,
          prioridad,
          pasos_reproducir,
          comportamiento_esperado,
          created_at,
          notas_admin
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('[ErrorContextService] Error fetching user bugs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('[ErrorContextService] Exception fetching user bugs:', error);
      return [];
    }
  }

  /**
   * Obtiene bugs no resueltos en la misma página
   * @param currentPage - Ruta actual del usuario
   * @returns Array de bugs abiertos
   */
  static async getOpenBugsForPage(currentPage: string): Promise<SimilarBug[]> {
    try {
      const supabase = await createClient();
      
      const normalizedPath = this.normalizePath(currentPage);
      
      const { data, error } = await supabase
        .from('reportes_problemas')
        .select(`
          id,
          titulo,
          descripcion,
          categoria,
          estado,
          pagina_url,
          pathname,
          prioridad,
          pasos_reproducir,
          comportamiento_esperado,
          created_at,
          notas_admin
        `)
        .or(`pathname.ilike.%${normalizedPath}%,pagina_url.ilike.%${normalizedPath}%`)
        .neq('estado', 'resuelto')
        .neq('estado', 'cerrado')
        .order('prioridad', { ascending: true })
        .limit(5);
      
      if (error) {
        console.error('[ErrorContextService] Error fetching open bugs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('[ErrorContextService] Exception fetching open bugs:', error);
      return [];
    }
  }

  /**
   * Construye contexto de errores para incluir en el prompt de SofLIA
   * @param userId - ID del usuario (opcional)
   * @param currentPage - Ruta actual del usuario (opcional)
   * @param recentErrors - Errores de consola recientes (opcional)
   * @returns String formateado con el contexto de errores
   */
  static async buildErrorContext(
    userId?: string,
    currentPage?: string,
    recentErrors?: ConsoleError[] | UserError[]
  ): Promise<string> {
    const sections: string[] = [];

    // 1. Errores de consola recientes (si los hay)
    if (recentErrors && recentErrors.length > 0) {
      sections.push(`### Errores de consola recientes:`);
      recentErrors.slice(0, 5).forEach((error, index) => {
        sections.push(`${index + 1}. **${error.type || 'Error'}:** ${error.message}`);
        if ('url' in error && error.url) {
          sections.push(`   - Página: ${error.url}`);
        }
        if (error.stack) {
          // Mostrar solo las primeras 3 líneas del stack
          const stackLines = error.stack.split('\n').slice(0, 3).join('\n');
          sections.push(`   - Stack: ${stackLines}`);
        }
      });
      sections.push('');
    }

    // 2. Bugs similares en la página actual
    if (currentPage) {
      const similarBugs = await this.getSimilarBugs(currentPage, 3);
      if (similarBugs.length > 0) {
        sections.push(`### Bugs reportados en esta página:`);
        similarBugs.forEach((bug, index) => {
          const estado = bug.estado || 'pendiente';
          sections.push(`${index + 1}. **${bug.titulo}** [${estado}]`);
          sections.push(`   - Categoría: ${bug.categoria}`);
          if (bug.prioridad) {
            sections.push(`   - Prioridad: ${bug.prioridad}`);
          }
          // Descripción resumida
          const descResumida = bug.descripcion.substring(0, 150) + 
            (bug.descripcion.length > 150 ? '...' : '');
          sections.push(`   - ${descResumida}`);
        });
        sections.push('');
      }

      // 3. Bugs abiertos sin resolver
      const openBugs = await this.getOpenBugsForPage(currentPage);
      if (openBugs.length > 0) {
        sections.push(`### Bugs abiertos en esta página (sin resolver):`);
        openBugs.slice(0, 3).forEach((bug, index) => {
          sections.push(`${index + 1}. **${bug.titulo}** - ${bug.categoria}`);
          if (bug.notas_admin) {
            sections.push(`   - Nota del admin: ${bug.notas_admin.substring(0, 100)}`);
          }
        });
        sections.push('');
      }
    }

    // 4. Bugs recientes del usuario
    if (userId) {
      const userBugs = await this.getUserRecentBugs(userId, 2);
      if (userBugs.length > 0) {
        sections.push(`### Reportes recientes de este usuario:`);
        userBugs.forEach((bug, index) => {
          const estado = bug.estado || 'pendiente';
          sections.push(`${index + 1}. **${bug.titulo}** [${estado}] - ${bug.categoria}`);
        });
        sections.push('');
      }
    }

    if (sections.length === 0) {
      return '';
    }

    return `## CONTEXTO DE ERRORES Y BUGS\n\n${sections.join('\n')}`;
  }

  /**
   * Normaliza una ruta para búsqueda
   * Extrae la parte estable de la URL sin IDs dinámicos
   */
  private static normalizePath(path: string): string {
    // Quitar query strings y hash
    let normalized = path.split('?')[0].split('#')[0];
    
    // Reemplazar segmentos que parecen IDs dinámicos
    // UUIDs
    normalized = normalized.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '{id}'
    );
    
    // Números largos (IDs numéricos)
    normalized = normalized.replace(/\/\d{5,}\//g, '/{id}/');
    
    // Slugs de organizaciones típicos (todo minúsculas con guiones)
    // Mantenemos los slugs ya que pueden ser importantes para el contexto
    
    return normalized;
  }

  /**
   * Busca bugs por palabras clave en título y descripción
   * @param keywords - Palabras clave a buscar
   * @param limit - Número máximo de resultados
   * @returns Array de bugs que coinciden
   */
  static async searchBugsByKeywords(keywords: string[], limit: number = 5): Promise<SimilarBug[]> {
    try {
      const supabase = await createClient();
      
      // Construir consulta de búsqueda
      const searchTerms = keywords.map(k => `%${k}%`);
      
      // Buscar en título y descripción
      let query = supabase
        .from('reportes_problemas')
        .select(`
          id,
          titulo,
          descripcion,
          categoria,
          estado,
          pagina_url,
          pathname,
          prioridad,
          pasos_reproducir,
          comportamiento_esperado,
          created_at,
          notas_admin
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      // Agregar filtros de búsqueda
      if (searchTerms.length > 0) {
        const orConditions = searchTerms
          .map(term => `titulo.ilike.${term},descripcion.ilike.${term}`)
          .join(',');
        query = query.or(orConditions);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[ErrorContextService] Error searching bugs:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('[ErrorContextService] Exception searching bugs:', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas de bugs para una página
   * @param currentPage - Ruta de la página
   * @returns Estadísticas de bugs
   */
  static async getBugStatsForPage(currentPage: string): Promise<{
    total: number;
    open: number;
    resolved: number;
    byCategory: Record<string, number>;
  }> {
    try {
      const supabase = await createClient();
      const normalizedPath = this.normalizePath(currentPage);
      
      const { data, error } = await supabase
        .from('reportes_problemas')
        .select('estado, categoria')
        .or(`pathname.ilike.%${normalizedPath}%,pagina_url.ilike.%${normalizedPath}%`);
      
      if (error || !data) {
        return { total: 0, open: 0, resolved: 0, byCategory: {} };
      }
      
      const stats = {
        total: data.length,
        open: data.filter(b => b.estado !== 'resuelto' && b.estado !== 'cerrado').length,
        resolved: data.filter(b => b.estado === 'resuelto' || b.estado === 'cerrado').length,
        byCategory: {} as Record<string, number>
      };
      
      data.forEach(bug => {
        stats.byCategory[bug.categoria] = (stats.byCategory[bug.categoria] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('[ErrorContextService] Exception getting bug stats:', error);
      return { total: 0, open: 0, resolved: 0, byCategory: {} };
    }
  }
}

