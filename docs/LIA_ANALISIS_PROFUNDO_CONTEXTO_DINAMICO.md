# 🔬 Análisis Profundo: Estrategias de Contexto Dinámico para LIA

**Proyecto:** Aprende y Aplica  
**Fecha:** Enero 2026  
**Autor:** Auto (Claude - Arquitecto de Software)  
**Versión:** 1.0  
**Estado:** Análisis y Estrategias de Implementación

---

## 📋 Tabla de Contenidos

1. [Análisis del Estado Actual](#1-análisis-del-estado-actual)
2. [Gaps Críticos Identificados](#2-gaps-críticos-identificados)
3. [Estrategias de Contexto Dinámico](#3-estrategias-de-contexto-dinámico)
4. [Contexto Especializado para Reporte de Bugs](#4-contexto-especializado-para-reporte-de-bugs)
5. [Arquitectura de Implementación](#5-arquitectura-de-implementación)
6. [Plan de Acción Priorizado](#6-plan-de-acción-priorizado)

---

## 1. Análisis del Estado Actual

### 1.1 Contexto Actual de LIA

#### Contexto Estático (Hardcodeado)
- **Ubicación:** `apps/web/src/app/api/lia/chat/route.ts`
- **Tamaño:** ~600 líneas de prompt hardcodeado
- **Componentes:**
  1. `LIA_SYSTEM_PROMPT` (~100 líneas): Identidad, capacidades, restricciones
  2. `GLOBAL_UI_CONTEXT` (~300 líneas): Glosario de UI, modales, páginas
  3. `DATABASE_SCHEMA_CONTEXT` (~150 líneas): Esquema de BD

#### Contexto Dinámico (BD Queries)
- **Función:** `fetchPlatformContext(userId)`
- **Datos obtenidos:**
  - Estadísticas generales (cursos, usuarios, organizaciones)
  - Información del usuario (nombre, rol, organización)
  - Cursos asignados al usuario
  - Progreso en lecciones
  - Contexto de página actual (si se envía desde frontend)

#### Sistema de Reporte de Bugs
- **Funcionamiento actual:**
  1. LIA detecta intención de reporte
  2. Genera bloque `[[BUG_REPORT:{...}]]`
  3. Backend parsea y guarda en `reportes_problemas`
  4. Incluye metadata del cliente (viewport, platform, errors)
  5. Opcionalmente incluye grabación de sesión (rrweb)

### 1.2 Limitaciones Actuales

#### Para Contexto General
- ❌ **No conoce estructura de componentes React**
- ❌ **No conoce rutas exactas dinámicamente**
- ❌ **No tiene información sobre flujos de usuario**
- ❌ **No conoce APIs disponibles**
- ❌ **No tiene contexto de errores recientes**
- ❌ **No conoce bugs similares reportados**

#### Para Reporte de Bugs Específicamente
- ❌ **No puede identificar qué componente falló**
- ❌ **No conoce el estado de la aplicación en el momento del error**
- ❌ **No tiene información sobre errores previos del usuario**
- ❌ **No puede sugerir soluciones basadas en bugs conocidos**
- ❌ **No conoce la estructura técnica de la página actual**

---

## 2. Gaps Críticos Identificados

### 2.1 Gap 1: Contexto de Componentes y Rutas

**Problema:**
LIA no conoce qué componentes están en cada página ni cómo se relacionan.

**Impacto:**
- No puede identificar automáticamente qué componente falló
- No puede dar instrucciones precisas sobre navegación
- Reportes de bugs son genéricos

**Ejemplo:**
Usuario reporta: "El botón no funciona"
LIA no sabe: ¿Qué botón? ¿En qué componente? ¿Qué ruta?

### 2.2 Gap 2: Contexto de Estado de Aplicación

**Problema:**
LIA no conoce el estado de la aplicación en tiempo real.

**Impacto:**
- No puede entender el contexto del error
- No puede reproducir el flujo que llevó al error
- Reportes carecen de información técnica relevante

**Ejemplo:**
Usuario reporta: "No puedo asignar un curso"
LIA no sabe: ¿Qué datos tenía el usuario? ¿Qué validaciones fallaron?

### 2.3 Gap 3: Contexto Histórico de Bugs

**Problema:**
LIA no conoce bugs similares reportados anteriormente.

**Impacto:**
- Duplicación de reportes
- No puede sugerir soluciones conocidas
- No puede identificar patrones de errores

**Ejemplo:**
Usuario reporta: "El modal no se cierra"
LIA no sabe: ¿Este bug ya fue reportado? ¿Hay una solución conocida?

### 2.4 Gap 4: Contexto Técnico de la Página

**Problema:**
LIA no tiene información técnica sobre la página actual.

**Impacto:**
- No puede identificar errores técnicos específicos
- No puede relacionar errores con componentes específicos
- Reportes no incluyen información técnica útil

**Ejemplo:**
Usuario reporta: "La página está en blanco"
LIA no sabe: ¿Qué componente debería renderizarse? ¿Qué API falló?

### 2.5 Gap 5: Contexto de Flujos de Usuario

**Problema:**
LIA no conoce los flujos de usuario completos.

**Impacto:**
- No puede entender el contexto del error en el flujo
- No puede sugerir alternativas
- No puede identificar dónde se rompió el flujo

**Ejemplo:**
Usuario reporta: "No puedo completar el proceso"
LIA no sabe: ¿En qué paso del flujo está? ¿Qué debería hacer después?

---

## 3. Estrategias de Contexto Dinámico

### 3.1 Estrategia 1: Sistema de Metadata de Páginas

**Objetivo:** Proporcionar información técnica sobre cada página automáticamente.

**Implementación:**

#### 3.1.1 Archivo de Metadata de Páginas

Crear un sistema que mapee rutas a información técnica:

```typescript
// apps/web/src/lib/lia-context/page-metadata.ts

export interface PageMetadata {
  route: string;
  routePattern: string; // Para rutas dinámicas como /[orgSlug]/business-panel/*
  pageType: string;
  components: ComponentInfo[];
  apis: ApiInfo[];
  userFlows: UserFlow[];
  commonIssues: CommonIssue[];
}

export interface ComponentInfo {
  name: string;
  path: string;
  description: string;
  props?: string[];
  commonErrors?: string[];
}

export interface ApiInfo {
  endpoint: string;
  method: string;
  description: string;
  commonErrors?: string[];
}

export interface UserFlow {
  name: string;
  steps: string[];
  commonBreakpoints?: string[];
}

export interface CommonIssue {
  description: string;
  possibleCauses: string[];
  solutions: string[];
}

// Ejemplo de metadata
export const PAGE_METADATA: Record<string, PageMetadata> = {
  '/[orgSlug]/business-panel/courses': {
    route: '/[orgSlug]/business-panel/courses',
    routePattern: '/{orgSlug}/business-panel/courses',
    pageType: 'business_panel_courses',
    components: [
      {
        name: 'BusinessCoursesPage',
        path: 'apps/web/src/app/[orgSlug]/business-panel/courses/page.tsx',
        description: 'Página principal del catálogo de cursos',
        props: [],
        commonErrors: [
          'Cursos no cargan: Verificar API /api/[orgSlug]/business/courses',
          'Modal no abre: Verificar BusinessAssignCourseModal'
        ]
      },
      {
        name: 'BusinessAssignCourseModal',
        path: 'apps/web/src/features/business-panel/components/BusinessAssignCourseModal.tsx',
        description: 'Modal para asignar cursos a usuarios o equipos',
        props: ['courseId', 'onClose', 'onSuccess'],
        commonErrors: [
          'Validación de fechas falla: Verificar fecha_inicio < fecha_limite',
          'Error al asignar: Verificar permisos del usuario'
        ]
      }
    ],
    apis: [
      {
        endpoint: '/api/[orgSlug]/business/courses',
        method: 'GET',
        description: 'Obtiene lista de cursos disponibles',
        commonErrors: [
          '403: Usuario sin permisos de business-panel',
          '500: Error en query de BD'
        ]
      }
    ],
    userFlows: [
      {
        name: 'Asignar curso a usuario',
        steps: [
          '1. Click en botón "Asignar" de un curso',
          '2. Seleccionar usuarios en el modal',
          '3. Configurar fechas',
          '4. Confirmar asignación'
        ],
        commonBreakpoints: [
          'Paso 2: Usuarios no cargan',
          'Paso 3: Validación de fechas falla'
        ]
      }
    ],
    commonIssues: [
      {
        description: 'Modal no se cierra después de asignar',
        possibleCauses: [
          'Error en callback onSuccess',
          'Estado del modal no se actualiza'
        ],
        solutions: [
          'Verificar que onSuccess se ejecuta correctamente',
          'Verificar estado del modal en el componente padre'
        ]
      }
    ]
  }
};
```

#### 3.1.2 Servicio de Contexto de Página

```typescript
// apps/web/src/lib/lia-context/services/page-context.service.ts

import { PAGE_METADATA } from '../page-metadata';

export class PageContextService {
  /**
   * Obtiene metadata de la página actual basado en la ruta
   */
  static getPageMetadata(currentPage: string): PageMetadata | null {
    // Buscar coincidencia exacta
    if (PAGE_METADATA[currentPage]) {
      return PAGE_METADATA[currentPage];
    }
    
    // Buscar por patrón (para rutas dinámicas)
    for (const [route, metadata] of Object.entries(PAGE_METADATA)) {
      const pattern = this.routeToRegex(metadata.routePattern);
      if (pattern.test(currentPage)) {
        return metadata;
      }
    }
    
    return null;
  }
  
  /**
   * Construye contexto de página para LIA
   */
  static buildPageContext(currentPage: string): string {
    const metadata = this.getPageMetadata(currentPage);
    
    if (!metadata) {
      return `Página actual: ${currentPage}\n(No hay metadata disponible para esta página)`;
    }
    
    let context = `## CONTEXTO TÉCNICO DE LA PÁGINA ACTUAL\n\n`;
    context += `**Ruta:** ${currentPage}\n`;
    context += `**Tipo:** ${metadata.pageType}\n\n`;
    
    // Componentes
    if (metadata.components.length > 0) {
      context += `### Componentes en esta página:\n`;
      metadata.components.forEach(comp => {
        context += `- **${comp.name}**: ${comp.description}\n`;
        if (comp.commonErrors && comp.commonErrors.length > 0) {
          context += `  - Errores comunes: ${comp.commonErrors.join(', ')}\n`;
        }
      });
      context += `\n`;
    }
    
    // APIs
    if (metadata.apis.length > 0) {
      context += `### APIs utilizadas:\n`;
      metadata.apis.forEach(api => {
        context += `- **${api.method} ${api.endpoint}**: ${api.description}\n`;
        if (api.commonErrors && api.commonErrors.length > 0) {
          context += `  - Errores comunes: ${api.commonErrors.join(', ')}\n`;
        }
      });
      context += `\n`;
    }
    
    // Flujos de usuario
    if (metadata.userFlows.length > 0) {
      context += `### Flujos de usuario:\n`;
      metadata.userFlows.forEach(flow => {
        context += `- **${flow.name}**:\n`;
        flow.steps.forEach(step => {
          context += `  ${step}\n`;
        });
        if (flow.commonBreakpoints && flow.commonBreakpoints.length > 0) {
          context += `  - Puntos de fallo comunes: ${flow.commonBreakpoints.join(', ')}\n`;
        }
      });
      context += `\n`;
    }
    
    // Problemas comunes
    if (metadata.commonIssues.length > 0) {
      context += `### Problemas comunes en esta página:\n`;
      metadata.commonIssues.forEach(issue => {
        context += `- **${issue.description}**\n`;
        context += `  - Posibles causas: ${issue.possibleCauses.join(', ')}\n`;
        context += `  - Soluciones: ${issue.solutions.join(', ')}\n`;
      });
    }
    
    return context;
  }
  
  private static routeToRegex(pattern: string): RegExp {
    // Convertir {orgSlug} a regex
    const regexPattern = pattern
      .replace(/\{[^}]+\}/g, '[^/]+')
      .replace(/\//g, '\\/');
    return new RegExp(`^${regexPattern}$`);
  }
}
```

### 3.2 Estrategia 2: Sistema de Contexto de Componentes Activos

**Objetivo:** Identificar qué componentes están activos en la página actual.

**Implementación:**

#### 3.2.1 Hook para Detectar Componentes Activos

```typescript
// apps/web/src/core/hooks/useActiveComponents.ts

import { useEffect, useState } from 'react';

export interface ActiveComponent {
  name: string;
  selector: string;
  props?: Record<string, any>;
  state?: Record<string, any>;
}

export function useActiveComponents(): ActiveComponent[] {
  const [activeComponents, setActiveComponents] = useState<ActiveComponent[]>([]);
  
  useEffect(() => {
    // Detectar componentes activos en el DOM
    const detectComponents = () => {
      const components: ActiveComponent[] = [];
      
      // Buscar componentes por data attributes
      document.querySelectorAll('[data-component]').forEach(el => {
        const componentName = el.getAttribute('data-component');
        const componentProps = el.getAttribute('data-props');
        
        if (componentName) {
          components.push({
            name: componentName,
            selector: el.className || el.id || '',
            props: componentProps ? JSON.parse(componentProps) : undefined
          });
        }
      });
      
      // Detectar modales abiertos
      const openModals = document.querySelectorAll('[role="dialog"][aria-hidden="false"]');
      openModals.forEach(modal => {
        const modalName = modal.getAttribute('data-modal-name') || 'UnknownModal';
        components.push({
          name: modalName,
          selector: modal.className,
          state: { isOpen: true }
        });
      });
      
      setActiveComponents(components);
    };
    
    // Detectar inicialmente
    detectComponents();
    
    // Observar cambios en el DOM
    const observer = new MutationObserver(detectComponents);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-component', 'aria-hidden', 'data-modal-name']
    });
    
    return () => observer.disconnect();
  }, []);
  
  return activeComponents;
}
```

#### 3.2.2 Integración en Componentes

```typescript
// Ejemplo: BusinessAssignCourseModal.tsx
export function BusinessAssignCourseModal({ courseId, onClose, onSuccess }: Props) {
  // ... código del componente
  
  return (
    <Dialog
      data-component="BusinessAssignCourseModal"
      data-props={JSON.stringify({ courseId })}
      data-modal-name="BusinessAssignCourseModal"
      // ... resto de props
    >
      {/* contenido */}
    </Dialog>
  );
}
```

### 3.3 Estrategia 3: Sistema de Contexto de Errores Recientes

**Objetivo:** Proporcionar información sobre errores recientes del usuario y de la aplicación.

**Implementación:**

#### 3.3.1 Servicio de Errores Recientes

```typescript
// apps/web/src/lib/lia-context/services/error-context.service.ts

import { createClient } from '@/lib/supabase/server';

export interface RecentError {
  id: string;
  timestamp: Date;
  type: 'console' | 'network' | 'component' | 'api';
  message: string;
  stack?: string;
  url?: string;
  component?: string;
  userId?: string;
}

export class ErrorContextService {
  /**
   * Obtiene errores recientes del usuario (últimos 5 minutos)
   */
  static async getRecentErrors(userId?: string): Promise<RecentError[]> {
    if (!userId) return [];
    
    const supabase = await createClient();
    
    // Buscar errores en la tabla de reportes_problemas
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentReports } = await supabase
      .from('reportes_problemas')
      .select('id, created_at, descripcion, categoria, pagina_url, metadata')
      .eq('user_id', userId)
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!recentReports) return [];
    
    return recentReports.map(report => ({
      id: report.id,
      timestamp: new Date(report.created_at),
      type: 'api', // O inferir del metadata
      message: report.descripcion,
      url: report.pagina_url,
      userId
    }));
  }
  
  /**
   * Obtiene errores similares reportados por otros usuarios
   */
  static async getSimilarErrors(
    description: string,
    pageUrl?: string
  ): Promise<RecentError[]> {
    const supabase = await createClient();
    
    // Buscar reportes similares (últimos 30 días)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    let query = supabase
      .from('reportes_problemas')
      .select('id, created_at, descripcion, categoria, pagina_url, estado')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (pageUrl) {
      query = query.eq('pagina_url', pageUrl);
    }
    
    const { data: similarReports } = await query;
    
    if (!similarReports) return [];
    
    // Filtrar por similitud de descripción (simple)
    const keywords = description.toLowerCase().split(/\s+/);
    const similar = similarReports.filter(report => {
      const reportText = report.descripcion.toLowerCase();
      return keywords.some(keyword => reportText.includes(keyword));
    });
    
    return similar.map(report => ({
      id: report.id,
      timestamp: new Date(report.created_at),
      type: 'api',
      message: report.descripcion,
      url: report.pagina_url,
    }));
  }
  
  /**
   * Construye contexto de errores para LIA
   */
  static async buildErrorContext(
    userId?: string,
    currentPage?: string
  ): Promise<string> {
    const recentErrors = await this.getRecentErrors(userId);
    const similarErrors = currentPage 
      ? await this.getSimilarErrors('', currentPage)
      : [];
    
    if (recentErrors.length === 0 && similarErrors.length === 0) {
      return '';
    }
    
    let context = `## CONTEXTO DE ERRORES\n\n`;
    
    if (recentErrors.length > 0) {
      context += `### Errores recientes del usuario (últimos 5 minutos):\n`;
      recentErrors.forEach(error => {
        context += `- **${error.type}** (${error.timestamp.toLocaleTimeString()}): ${error.message}\n`;
        if (error.url) {
          context += `  - Página: ${error.url}\n`;
        }
      });
      context += `\n`;
    }
    
    if (similarErrors.length > 0) {
      context += `### Errores similares reportados por otros usuarios:\n`;
      similarErrors.forEach(error => {
        context += `- ${error.message}\n`;
        context += `  - Reportado: ${error.timestamp.toLocaleDateString()}\n`;
        if (error.url) {
          context += `  - Página: ${error.url}\n`;
        }
      });
      context += `\n`;
    }
    
    return context;
  }
}
```

### 3.4 Estrategia 4: Sistema de Contexto de Estado de Aplicación

**Objetivo:** Capturar y proporcionar el estado relevante de la aplicación.

**Implementación:**

#### 3.4.1 Servicio de Estado de Aplicación

```typescript
// apps/web/src/lib/lia-context/services/app-state.service.ts

export interface AppState {
  currentUser?: {
    id: string;
    role: string;
    organizationId?: string;
  };
  currentPage: string;
  activeModals: string[];
  formStates: Record<string, any>;
  apiCalls: Array<{
    endpoint: string;
    method: string;
    status?: number;
    timestamp: Date;
  }>;
}

export class AppStateService {
  private static state: AppState = {
    currentPage: '',
    activeModals: [],
    formStates: {},
    apiCalls: []
  };
  
  /**
   * Actualiza el estado de la aplicación
   */
  static updateState(updates: Partial<AppState>) {
    this.state = { ...this.state, ...updates };
  }
  
  /**
   * Registra una llamada a API
   */
  static logApiCall(endpoint: string, method: string, status?: number) {
    this.state.apiCalls.push({
      endpoint,
      method,
      status,
      timestamp: new Date()
    });
    
    // Mantener solo las últimas 10
    if (this.state.apiCalls.length > 10) {
      this.state.apiCalls = this.state.apiCalls.slice(-10);
    }
  }
  
  /**
   * Construye contexto de estado para LIA
   */
  static buildStateContext(): string {
    let context = `## ESTADO ACTUAL DE LA APLICACIÓN\n\n`;
    
    context += `**Página actual:** ${this.state.currentPage}\n`;
    
    if (this.state.currentUser) {
      context += `**Usuario:** ${this.state.currentUser.id} (${this.state.currentUser.role})\n`;
      if (this.state.currentUser.organizationId) {
        context += `**Organización:** ${this.state.currentUser.organizationId}\n`;
      }
    }
    
    if (this.state.activeModals.length > 0) {
      context += `**Modales abiertos:** ${this.state.activeModals.join(', ')}\n`;
    }
    
    if (this.state.apiCalls.length > 0) {
      context += `\n### Llamadas a API recientes:\n`;
      this.state.apiCalls.slice(-5).forEach(call => {
        context += `- **${call.method}** ${call.endpoint}`;
        if (call.status) {
          context += ` → ${call.status}`;
        }
        context += ` (${call.timestamp.toLocaleTimeString()})\n`;
      });
    }
    
    return context;
  }
}
```

---

## 4. Contexto Especializado para Reporte de Bugs

### 4.1 BugReportContextProvider

**Objetivo:** Proporcionar contexto completo y relevante cuando se detecta un reporte de bug.

**Implementación:**

```typescript
// apps/web/src/lib/lia-context/providers/bug-report/BugReportContextProvider.ts

import { BaseContextProvider } from '../base/BaseContextProvider';
import { PageContextService } from '../../services/page-context.service';
import { ErrorContextService } from '../../services/error-context.service';
import { AppStateService } from '../../services/app-state.service';
import type { ContextFragment } from '../base/types';

export class BugReportContextProvider extends BaseContextProvider {
  name = 'bug-report';
  priority = 100; // Alta prioridad para bugs
  
  async getContext(
    contextType: string,
    userId?: string,
    currentPage?: string,
    enrichedMetadata?: any
  ): Promise<ContextFragment | null> {
    // Solo incluir si hay indicios de reporte de bug
    if (contextType !== 'bug-report' && !this.isBugReport(contextType)) {
      return null;
    }
    
    const fragments: string[] = [];
    
    // 1. Contexto técnico de la página
    if (currentPage) {
      const pageContext = PageContextService.buildPageContext(currentPage);
      if (pageContext) {
        fragments.push(pageContext);
      }
    }
    
    // 2. Componentes activos
    if (enrichedMetadata?.activeComponents) {
      fragments.push(this.buildActiveComponentsContext(enrichedMetadata.activeComponents));
    }
    
    // 3. Errores recientes
    const errorContext = await ErrorContextService.buildErrorContext(userId, currentPage);
    if (errorContext) {
      fragments.push(errorContext);
    }
    
    // 4. Estado de la aplicación
    const stateContext = AppStateService.buildStateContext();
    if (stateContext) {
      fragments.push(stateContext);
    }
    
    // 5. Errores de consola
    if (enrichedMetadata?.errors) {
      fragments.push(this.buildConsoleErrorsContext(enrichedMetadata.errors));
    }
    
    // 6. Información del navegador
    if (enrichedMetadata?.platform) {
      fragments.push(this.buildBrowserContext(enrichedMetadata.platform));
    }
    
    // 7. Bugs similares
    if (currentPage) {
      const similarBugs = await this.getSimilarBugs(currentPage);
      if (similarBugs.length > 0) {
        fragments.push(this.buildSimilarBugsContext(similarBugs));
      }
    }
    
    if (fragments.length === 0) {
      return null;
    }
    
    return {
      type: 'bug-report',
      content: fragments.join('\n\n'),
      priority: 100,
      tokens: this.estimateTokens(fragments.join('\n\n'))
    };
  }
  
  shouldInclude(contextType: string): boolean {
    return this.isBugReport(contextType);
  }
  
  private isBugReport(contextType: string): boolean {
    return contextType === 'bug-report' || 
           contextType.includes('bug') || 
           contextType.includes('error');
  }
  
  private buildActiveComponentsContext(components: any[]): string {
    let context = `## COMPONENTES ACTIVOS EN LA PÁGINA\n\n`;
    components.forEach(comp => {
      context += `- **${comp.name}**`;
      if (comp.props) {
        context += ` (props: ${JSON.stringify(comp.props)})`;
      }
      context += `\n`;
    });
    return context;
  }
  
  private buildConsoleErrorsContext(errors: any[]): string {
    let context = `## ERRORES DE CONSOLA\n\n`;
    errors.slice(-5).forEach(error => {
      context += `- **${error.type}**: ${error.message}\n`;
      if (error.stack) {
        context += `  - Stack: ${error.stack.substring(0, 200)}...\n`;
      }
    });
    return context;
  }
  
  private buildBrowserContext(platform: any): string {
    let context = `## INFORMACIÓN DEL NAVEGADOR\n\n`;
    context += `- **Navegador:** ${platform.browser || 'Unknown'}\n`;
    context += `- **Versión:** ${platform.version || 'Unknown'}\n`;
    context += `- **OS:** ${platform.os || 'Unknown'}\n`;
    if (platform.viewport) {
      context += `- **Viewport:** ${platform.viewport.width}x${platform.viewport.height}\n`;
    }
    return context;
  }
  
  private async getSimilarBugs(pageUrl: string): Promise<any[]> {
    const supabase = await createClient();
    
    const { data: similarBugs } = await supabase
      .from('reportes_problemas')
      .select('titulo, descripcion, categoria, estado, created_at')
      .eq('pagina_url', pageUrl)
      .eq('estado', 'resuelto')
      .order('created_at', { ascending: false })
      .limit(3);
    
    return similarBugs || [];
  }
  
  private buildSimilarBugsContext(bugs: any[]): string {
    let context = `## BUGS SIMILARES RESUELTOS EN ESTA PÁGINA\n\n`;
    bugs.forEach(bug => {
      context += `- **${bug.titulo}**\n`;
      context += `  - Descripción: ${bug.descripcion}\n`;
      context += `  - Estado: ${bug.estado}\n`;
      context += `  - Reportado: ${new Date(bug.created_at).toLocaleDateString()}\n`;
    });
    context += `\n💡 Esta información puede ayudarte a identificar si el problema ya fue resuelto o tiene una solución conocida.\n`;
    return context;
  }
}
```

### 4.2 Integración en el Endpoint de LIA

```typescript
// apps/web/src/app/api/lia/chat/route.ts

// ... código existente ...

// En la función POST, antes de construir el prompt:

// Detectar si es reporte de bug
const isBugReport = body.isBugReport || 
  /error|bug|falla|problema|no funciona/i.test(lastMessage.content);

if (isBugReport) {
  // Obtener contexto especializado de bugs
  const bugContextProvider = new BugReportContextProvider();
  const bugContext = await bugContextProvider.getContext(
    'bug-report',
    requestContext?.userId,
    fullContext.currentPage,
    body.enrichedMetadata
  );
  
  if (bugContext) {
    systemPrompt += '\n\n' + bugContext.content;
  }
}
```

---

## 5. Arquitectura de Implementación

### 5.1 Estructura de Carpetas Propuesta

```
apps/web/src/lib/lia-context/
├── config/
│   ├── page-metadata.ts          # Metadata de páginas
│   ├── component-registry.ts     # Registro de componentes
│   └── api-registry.ts           # Registro de APIs
│
├── providers/
│   ├── base/
│   │   ├── BaseContextProvider.ts
│   │   └── types.ts
│   ├── bug-report/
│   │   └── BugReportContextProvider.ts
│   ├── page/
│   │   └── PageContextProvider.ts
│   └── error/
│       └── ErrorContextProvider.ts
│
├── services/
│   ├── PageContextService.ts
│   ├── ErrorContextService.ts
│   ├── AppStateService.ts
│   ├── ComponentDetectionService.ts
│   └── ContextBuilderService.ts
│
└── types/
    └── index.ts
```

### 5.2 Flujo de Construcción de Contexto

```
Usuario envía mensaje
    ↓
Detectar tipo de contexto (bug-report, general, etc.)
    ↓
ContextBuilderService.orchestrate()
    ↓
Para cada provider relevante:
  - Verificar shouldInclude()
  - Llamar getContext()
  - Agregar a fragments
    ↓
Priorizar y combinar fragments
    ↓
Construir prompt final
    ↓
Enviar a LIA
```

---

## 6. Plan de Acción Priorizado

### Fase 1: Fundación (Semana 1-2)

**Objetivos:**
- Crear estructura base
- Implementar PageContextService
- Crear metadata para 5 páginas críticas

**Tareas:**
1. ✅ Crear estructura de carpetas
2. ✅ Implementar `PageContextService`
3. ✅ Crear `page-metadata.ts` con metadata de:
   - `/[orgSlug]/business-panel/courses`
   - `/[orgSlug]/business-panel/users`
   - `/[orgSlug]/business-user/dashboard`
   - `/courses/[slug]/learn`
   - `/study-planner/dashboard`
4. ✅ Integrar en endpoint de LIA
5. ✅ Testing básico

**Criterios de Éxito:**
- LIA puede identificar componentes en páginas críticas
- Contexto de página se incluye automáticamente

### Fase 2: Contexto de Errores (Semana 3-4)

**Objetivos:**
- Implementar ErrorContextService
- Integrar detección de errores recientes
- Agregar búsqueda de bugs similares

**Tareas:**
1. ✅ Implementar `ErrorContextService`
2. ✅ Integrar detección de errores de consola
3. ✅ Implementar búsqueda de bugs similares
4. ✅ Agregar contexto de errores al prompt
5. ✅ Testing

**Criterios de Éxito:**
- LIA conoce errores recientes del usuario
- LIA puede sugerir soluciones basadas en bugs similares

### Fase 3: BugReportContextProvider (Semana 5-6)

**Objetivos:**
- Implementar BugReportContextProvider completo
- Integrar todos los servicios de contexto
- Mejorar calidad de reportes de bugs

**Tareas:**
1. ✅ Implementar `BugReportContextProvider`
2. ✅ Integrar detección de componentes activos
3. ✅ Agregar contexto de estado de aplicación
4. ✅ Integrar en endpoint de LIA
5. ✅ Testing completo

**Criterios de Éxito:**
- Reportes de bugs incluyen información técnica completa
- LIA puede identificar componentes y rutas automáticamente
- Mejora medible en calidad de reportes

### Fase 4: Expansión y Optimización (Semana 7-8)

**Objetivos:**
- Expandir metadata a todas las páginas
- Optimizar rendimiento
- Agregar métricas

**Tareas:**
1. ✅ Agregar metadata para todas las páginas restantes
2. ✅ Implementar caché para contexto
3. ✅ Optimizar queries a BD
4. ✅ Agregar métricas de uso
5. ✅ Documentación completa

**Criterios de Éxito:**
- Metadata completa para todas las páginas
- Tiempo de construcción < 200ms
- Hit rate de caché > 80%

---

## 7. Métricas de Éxito

### 7.1 Métricas de Calidad de Reportes

| Métrica | Objetivo | Cómo Medir |
|---------|----------|------------|
| **Información técnica en reportes** | > 80% de reportes incluyen componente/ruta | Análisis de campos en `reportes_problemas` |
| **Identificación automática de componente** | > 60% de reportes identifican componente | Análisis de metadata en reportes |
| **Sugerencias de soluciones** | > 40% de reportes incluyen solución sugerida | Análisis de respuestas de LIA |
| **Reducción de duplicados** | < 10% de reportes duplicados | Comparación de descripciones similares |

### 7.2 Métricas de Rendimiento

| Métrica | Objetivo | Cómo Medir |
|---------|----------|------------|
| **Tiempo de construcción de contexto** | < 200ms (p95) | Logging en ContextBuilderService |
| **Hit rate de caché** | > 80% | Contador en ContextCacheService |
| **Tokens promedio por request** | < 5000 | Suma de tokens de cada fragmento |

---

## 8. Próximos Pasos Inmediatos

1. **Esta semana:**
   - Revisar y aprobar este análisis
   - Priorizar fases según necesidades
   - Asignar recursos

2. **Próximas 2 semanas:**
   - Comenzar Fase 1 (Fundación)
   - Crear metadata para páginas críticas
   - Integrar PageContextService

3. **Próximo mes:**
   - Completar Fase 2 y 3
   - Implementar BugReportContextProvider
   - Testing completo

---

**Documento creado por:** Auto (Claude)  
**Última actualización:** Enero 2025  
**Versión:** 1.0  
**Estado:** Listo para Implementación






