# 🛠️ Guía de Implementación: Sistema de Contexto Dinámico para LIA

**Proyecto:** Aprende y Aplica  
**Fecha:** Enero 2025  
**Autor:** Auto (Claude - Arquitecto de Software)  
**Versión:** 1.0  
**Estado:** Guía Técnica de Implementación

---

## 📋 Tabla de Contenidos

1. [Estructura de Archivos](#1-estructura-de-archivos)
2. [Tipos TypeScript](#2-tipos-typescript)
3. [Servicios Base](#3-servicios-base)
4. [Providers de Contexto](#4-providers-de-contexto)
5. [Archivos de Configuración YAML](#5-archivos-de-configuración-yaml)
6. [Integración con Endpoint Actual](#6-integración-con-endpoint-actual)
7. [Testing](#7-testing)
8. [Migración de Código Existente](#8-migración-de-código-existente)

---

## 1. Estructura de Archivos

### 1.1 Estructura Completa

```
apps/web/src/lib/lia-context/
├── config/
│   ├── system-prompt.base.yaml
│   ├── ui-glossary.yaml
│   ├── routes.yaml
│   ├── capabilities.yaml
│   └── restrictions.yaml
│
├── providers/
│   ├── base/
│   │   ├── BaseContextProvider.ts
│   │   └── types.ts
│   ├── user/
│   │   └── UserContextProvider.ts
│   ├── course/
│   │   └── CourseContextProvider.ts
│   ├── study-planner/
│   │   └── StudyPlannerContextProvider.ts
│   ├── bug-report/
│   │   └── BugReportContextProvider.ts
│   └── platform/
│       └── PlatformContextProvider.ts
│
├── services/
│   ├── ContextBuilderService.ts
│   ├── ContextCacheService.ts
│   ├── ContextPrioritizerService.ts
│   ├── DatabaseSchemaService.ts
│   └── ConfigLoaderService.ts
│
├── cache/
│   └── ContextCache.ts
│
├── utils/
│   ├── token-estimator.ts
│   └── context-formatter.ts
│
└── types/
    └── index.ts
```

### 1.2 Comandos para Crear Estructura

```bash
# Crear estructura de directorios
mkdir -p apps/web/src/lib/lia-context/{config,providers/{base,user,course,study-planner,bug-report,platform},services,cache,utils,types}
```

---

## 2. Tipos TypeScript

### 2.1 Tipos Base

**`apps/web/src/lib/lia-context/types/index.ts`:**

```typescript
/**
 * Fragmento de contexto individual
 */
export interface ContextFragment {
  type: string;
  content: string;
  priority: number;
  tokens: number;
  conditions?: ContextCondition[];
}

/**
 * Condiciones para incluir un fragmento
 */
export interface ContextCondition {
  contextType?: string[];
  pageType?: string[];
  userRole?: string[];
  hasFeature?: string[];
}

/**
 * Contexto completo construido
 */
export interface BuiltContext {
  basePrompt: string;
  fragments: ContextFragment[];
  totalTokens: number;
  metadata: ContextMetadata;
}

/**
 * Metadata del contexto
 */
export interface ContextMetadata {
  buildTime: number;
  cacheHits: number;
  cacheMisses: number;
  providersUsed: string[];
}

/**
 * Request de contexto
 */
export interface ContextRequest {
  userId?: string;
  contextType: 'general' | 'study-planner' | 'course' | 'bug-report';
  currentPage?: string;
  pageType?: string;
  messages?: Array<{ role: string; content: string }>;
  personalization?: any;
}

/**
 * Configuración de caché
 */
export interface CacheConfig {
  staticTTL: number; // Infinito (0)
  userTTL: number; // 5 minutos
  pageTTL: number; // 1 hora
  maxSize: number;
}
```

### 2.2 Tipos de Providers

**`apps/web/src/lib/lia-context/providers/base/types.ts`:**

```typescript
import type { ContextFragment, ContextRequest } from '../../types';

/**
 * Interface que deben implementar todos los providers
 */
export interface LiaContextProvider {
  /**
   * Nombre único del provider
   */
  name: string;
  
  /**
   * Prioridad (mayor número = mayor prioridad)
   */
  priority: number;
  
  /**
   * Obtiene el contexto para el request dado
   */
  getContext(request: ContextRequest): Promise<ContextFragment | null>;
  
  /**
   * Determina si este provider debe incluirse para el contexto dado
   */
  shouldInclude(request: ContextRequest): boolean;
  
  /**
   * Invalida el caché de este provider (opcional)
   */
  invalidateCache?(userId?: string): Promise<void>;
}
```

---

## 3. Servicios Base

### 3.1 ConfigLoaderService

**`apps/web/src/lib/lia-context/services/ConfigLoaderService.ts`:**

```typescript
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { ContextCacheService } from './ContextCacheService';

interface ConfigCache {
  [key: string]: any;
}

export class ConfigLoaderService {
  private static cache: ConfigCache = {};
  private static configPath = path.join(process.cwd(), 'apps/web/src/lib/lia-context/config');
  
  /**
   * Carga el prompt base desde YAML
   */
  static async loadBasePrompt(): Promise<string> {
    const cacheKey = 'base-prompt';
    
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }
    
    const filePath = path.join(this.configPath, 'system-prompt.base.yaml');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const config = yaml.load(fileContent) as any;
    
    // Construir prompt desde configuración
    const prompt = this.buildPromptFromConfig(config);
    
    this.cache[cacheKey] = prompt;
    return prompt;
  }
  
  /**
   * Carga el glosario de UI
   */
  static async loadUIGlossary(): Promise<any> {
    const cacheKey = 'ui-glossary';
    
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }
    
    const filePath = path.join(this.configPath, 'ui-glossary.yaml');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const glossary = yaml.load(fileContent) as any;
    
    this.cache[cacheKey] = glossary;
    return glossary;
  }
  
  /**
   * Carga configuración de rutas
   */
  static async loadRoutes(): Promise<any> {
    const cacheKey = 'routes';
    
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }
    
    const filePath = path.join(this.configPath, 'routes.yaml');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const routes = yaml.load(fileContent) as any;
    
    this.cache[cacheKey] = routes;
    return routes;
  }
  
  /**
   * Construye prompt desde configuración YAML
   */
  private static buildPromptFromConfig(config: any): string {
    let prompt = '';
    
    // Identidad
    prompt += `Eres ${config.identity.name} (${config.identity.full_name}), la asistente de IA de la plataforma ${config.identity.platform}.\n\n`;
    
    // Personalidad
    prompt += `## Tu Personalidad\n`;
    config.personality.forEach((trait: string) => {
      prompt += `- ${trait}\n`;
    });
    
    // Idiomas
    prompt += `\n## Idiomas\n`;
    prompt += `Eres capaz de comunicarte en: ${config.languages.join(', ')}\n`;
    
    // Capacidades
    prompt += `\n## Tus Capacidades\n`;
    config.capabilities.forEach((cap: string, index: number) => {
      prompt += `${index + 1}. ${cap}\n`;
    });
    
    // Restricciones
    prompt += `\n## Restricciones\n`;
    prompt += `- Alcance: ${config.restrictions.scope}\n`;
    if (config.restrictions.no_general_knowledge) {
      prompt += `- NO respondas preguntas generales fuera del alcance de la plataforma\n`;
    }
    
    // Formato
    prompt += `\n## Formato de Texto\n`;
    if (config.formatting.no_emojis) {
      prompt += `- PROHIBIDO usar emojis\n`;
    }
    if (config.formatting.use_markdown_links) {
      prompt += `- Usa formato de enlaces markdown: [texto](ruta)\n`;
    }
    
    return prompt;
  }
  
  /**
   * Invalida el caché (útil después de cambios)
   */
  static invalidateCache() {
    this.cache = {};
  }
}
```

### 3.2 ContextCacheService

**`apps/web/src/lib/lia-context/services/ContextCacheService.ts`:**

```typescript
import { LRUCache } from 'lru-cache';

export class ContextCacheService {
  // L1: Caché estático (sin expiración)
  private static staticCache = new Map<string, any>();
  
  // L2: Caché de usuario (5 min TTL)
  private static userCache = new LRUCache<string, any>({
    max: 1000,
    ttl: 5 * 60 * 1000, // 5 minutos
  });
  
  // L3: Caché de página (1 hora TTL)
  private static pageCache = new LRUCache<string, any>({
    max: 100,
    ttl: 60 * 60 * 1000, // 1 hora
  });
  
  /**
   * Obtiene o carga valor del caché estático
   */
  static async getStatic<T>(
    key: string,
    loader: () => Promise<T>
  ): Promise<T> {
    if (this.staticCache.has(key)) {
      return this.staticCache.get(key) as T;
    }
    
    const value = await loader();
    this.staticCache.set(key, value);
    return value;
  }
  
  /**
   * Obtiene o carga contexto de usuario
   */
  static async getUserContext<T>(
    userId: string,
    loader: () => Promise<T>
  ): Promise<T> {
    const cached = this.userCache.get(userId);
    if (cached) {
      return cached as T;
    }
    
    const value = await loader();
    this.userCache.set(userId, value);
    return value;
  }
  
  /**
   * Obtiene o carga contexto de página
   */
  static async getPageContext<T>(
    pageKey: string,
    loader: () => Promise<T>
  ): Promise<T> {
    const cached = this.pageCache.get(pageKey);
    if (cached) {
      return cached as T;
    }
    
    const value = await loader();
    this.pageCache.set(pageKey, value);
    return value;
  }
  
  /**
   * Invalida caché de usuario
   */
  static invalidateUser(userId: string) {
    this.userCache.delete(userId);
  }
  
  /**
   * Invalida caché de página
   */
  static invalidatePage(pageKey: string) {
    this.pageCache.delete(pageKey);
  }
  
  /**
   * Limpia todo el caché
   */
  static clearAll() {
    this.staticCache.clear();
    this.userCache.clear();
    this.pageCache.clear();
  }
  
  /**
   * Obtiene estadísticas del caché
   */
  static getStats() {
    return {
      static: {
        size: this.staticCache.size,
      },
      user: {
        size: this.userCache.size,
      },
      page: {
        size: this.pageCache.size,
      },
    };
  }
}
```

### 3.3 ContextBuilderService

**`apps/web/src/lib/lia-context/services/ContextBuilderService.ts`:**

```typescript
import type { ContextRequest, BuiltContext, ContextFragment } from '../types';
import type { LiaContextProvider } from '../providers/base/types';
import { ContextPrioritizerService } from './ContextPrioritizerService';
import { ConfigLoaderService } from './ConfigLoaderService';

export class ContextBuilderService {
  private static providers: LiaContextProvider[] = [];
  
  /**
   * Registra un provider de contexto
   */
  static registerProvider(provider: LiaContextProvider) {
    this.providers.push(provider);
    // Ordenar por prioridad (mayor primero)
    this.providers.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Construye el contexto completo para LIA
   */
  static async buildContext(request: ContextRequest): Promise<BuiltContext> {
    const startTime = Date.now();
    let cacheHits = 0;
    let cacheMisses = 0;
    
    // 1. Cargar prompt base
    const basePrompt = await ConfigLoaderService.loadBasePrompt();
    
    // 2. Obtener fragmentos de todos los providers relevantes
    const relevantProviders = this.providers.filter(p => 
      p.shouldInclude(request)
    );
    
    const fragmentPromises = relevantProviders.map(async (provider) => {
      try {
        const fragment = await provider.getContext(request);
        if (fragment) {
          cacheMisses++; // Por ahora, asumimos miss
          return fragment;
        }
        return null;
      } catch (error) {
        console.error(`Error en provider ${provider.name}:`, error);
        return null;
      }
    });
    
    const fragments = (await Promise.all(fragmentPromises))
      .filter((f): f is ContextFragment => f !== null);
    
    // 3. Priorizar y filtrar fragmentos
    const prioritizedFragments = ContextPrioritizerService.prioritize(
      fragments,
      request
    );
    
    // 4. Calcular tokens totales
    const totalTokens = prioritizedFragments.reduce(
      (sum, f) => sum + f.tokens,
      0
    );
    
    // 5. Construir prompt final
    const buildTime = Date.now() - startTime;
    
    return {
      basePrompt,
      fragments: prioritizedFragments,
      totalTokens,
      metadata: {
        buildTime,
        cacheHits,
        cacheMisses,
        providersUsed: relevantProviders.map(p => p.name),
      },
    };
  }
  
  /**
   * Formatea el contexto como string para el prompt
   */
  static formatContextForPrompt(context: BuiltContext): string {
    let prompt = context.basePrompt;
    
    // Agregar fragmentos en orden de prioridad
    for (const fragment of context.fragments) {
      prompt += `\n\n## ${fragment.type.toUpperCase()}\n`;
      prompt += fragment.content;
    }
    
    return prompt;
  }
  
  /**
   * Obtiene lista de providers registrados
   */
  static getRegisteredProviders(): string[] {
    return this.providers.map(p => p.name);
  }
}
```

---

## 4. Providers de Contexto

### 4.1 BaseContextProvider

**`apps/web/src/lib/lia-context/providers/base/BaseContextProvider.ts`:**

```typescript
import type { LiaContextProvider } from './types';
import type { ContextRequest, ContextFragment } from '../../types';

export abstract class BaseContextProvider implements LiaContextProvider {
  abstract name: string;
  abstract priority: number;
  
  abstract getContext(request: ContextRequest): Promise<ContextFragment | null>;
  
  abstract shouldInclude(request: ContextRequest): boolean;
  
  /**
   * Helper para estimar tokens (aproximado: 1 token ≈ 4 caracteres)
   */
  protected estimateTokens(content: string): number {
    return Math.ceil(content.length / 4);
  }
  
  /**
   * Helper para formatear contexto como string
   */
  protected formatContext(data: any): string {
    // Implementación básica, puede ser sobrescrita
    return JSON.stringify(data, null, 2);
  }
}
```

### 4.2 UserContextProvider

**`apps/web/src/lib/lia-context/providers/user/UserContextProvider.ts`:**

```typescript
import { BaseContextProvider } from '../base/BaseContextProvider';
import type { ContextRequest, ContextFragment } from '../../types';
import { ContextCacheService } from '../../services/ContextCacheService';
import { createClient } from '@/lib/supabase/server';

export class UserContextProvider extends BaseContextProvider {
  name = 'user';
  priority = 10;
  
  async getContext(request: ContextRequest): Promise<ContextFragment | null> {
    if (!request.userId) {
      return null;
    }
    
    const userData = await ContextCacheService.getUserContext(
      `user-${request.userId}`,
      () => this.fetchUserData(request.userId!)
    );
    
    return {
      type: 'user',
      content: this.formatUserContext(userData),
      priority: this.priority,
      tokens: this.estimateTokens(this.formatUserContext(userData)),
    };
  }
  
  shouldInclude(request: ContextRequest): boolean {
    return true; // Siempre incluir contexto de usuario si hay userId
  }
  
  async invalidateCache(userId?: string): Promise<void> {
    if (userId) {
      ContextCacheService.invalidateUser(`user-${userId}`);
    }
  }
  
  private async fetchUserData(userId: string) {
    const supabase = await createClient();
    
    // Query optimizada con joins
    const { data: userData } = await supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        display_name,
        cargo_rol,
        type_rol,
        organizations:organization_users!inner(
          organizations!inner(
            name,
            slug
          )
        )
      `)
      .eq('id', userId)
      .eq('organization_users.status', 'active')
      .single();
    
    return userData;
  }
  
  private formatUserContext(userData: any): string {
    let context = '';
    
    if (userData) {
      context += `Usuario: ${userData.display_name || userData.first_name || 'Usuario'}\n`;
      
      if (userData.type_rol) {
        context += `Cargo: ${userData.type_rol}\n`;
      } else if (userData.cargo_rol) {
        context += `Rol: ${userData.cargo_rol}\n`;
      }
      
      if (userData.organizations && userData.organizations.length > 0) {
        const org = userData.organizations[0].organizations;
        context += `Organización: ${org.name}\n`;
        context += `Slug de organización: ${org.slug}\n`;
      }
    }
    
    return context;
  }
}
```

### 4.3 BugReportContextProvider

**`apps/web/src/lib/lia-context/providers/bug-report/BugReportContextProvider.ts`:**

```typescript
import { BaseContextProvider } from '../base/BaseContextProvider';
import type { ContextRequest, ContextFragment } from '../../types';
import { createClient } from '@/lib/supabase/server';

export class BugReportContextProvider extends BaseContextProvider {
  name = 'bug-report';
  priority = 15; // Alta prioridad cuando se detecta intención de bug
  
  async getContext(request: ContextRequest): Promise<ContextFragment | null> {
    // Solo incluir si hay indicios de reporte de bug
    if (!this.isBugReportRequest(request)) {
      return null;
    }
    
    const bugContext = await this.buildBugContext(request);
    
    return {
      type: 'bug-report',
      content: this.formatBugContext(bugContext),
      priority: this.priority,
      tokens: this.estimateTokens(this.formatBugContext(bugContext)),
    };
  }
  
  shouldInclude(request: ContextRequest): boolean {
    return this.isBugReportRequest(request);
  }
  
  private isBugReportRequest(request: ContextRequest): boolean {
    if (request.contextType === 'bug-report') {
      return true;
    }
    
    // Detectar intención en mensajes
    if (request.messages && request.messages.length > 0) {
      const lastMessage = request.messages[request.messages.length - 1];
      const bugKeywords = /error|bug|falla|problema|no funciona|no carga|rompi|broken|crash/i;
      return bugKeywords.test(lastMessage.content.toLowerCase());
    }
    
    return false;
  }
  
  private async buildBugContext(request: ContextRequest) {
    const context: any = {
      currentPage: request.currentPage,
      pageType: request.pageType,
    };
    
    // Obtener bugs similares
    if (request.userId && request.currentPage) {
      const similarBugs = await this.getSimilarBugs(
        request.currentPage,
        request.userId
      );
      context.similarBugs = similarBugs;
    }
    
    // Obtener errores recientes del usuario (si están disponibles)
    // Esto requeriría un sistema de logging de errores
    
    return context;
  }
  
  private async getSimilarBugs(pageUrl: string, userId: string) {
    const supabase = await createClient();
    
    // Buscar bugs similares en la misma página
    const { data: bugs } = await supabase
      .from('reportes_problemas')
      .select('titulo, descripcion, categoria, estado')
      .eq('pagina_url', pageUrl)
      .neq('user_id', userId) // Excluir bugs del mismo usuario
      .eq('estado', 'resuelto') // Solo bugs resueltos
      .order('created_at', { ascending: false })
      .limit(5);
    
    return bugs || [];
  }
  
  private formatBugContext(context: any): string {
    let formatted = '';
    
    formatted += `Página actual: ${context.currentPage || 'N/A'}\n`;
    formatted += `Tipo de página: ${context.pageType || 'N/A'}\n`;
    
    if (context.similarBugs && context.similarBugs.length > 0) {
      formatted += `\nBugs similares reportados anteriormente:\n`;
      context.similarBugs.forEach((bug: any, index: number) => {
        formatted += `${index + 1}. ${bug.titulo} (${bug.categoria}) - Estado: ${bug.estado}\n`;
      });
    }
    
    return formatted;
  }
}
```

---

## 5. Archivos de Configuración YAML

### 5.1 system-prompt.base.yaml

```yaml
identity:
  name: "LIA"
  full_name: "Learning Intelligence Assistant"
  platform: "SOFIA"
  platform_full_name: "Sistema Operativo de Formación de Inteligencia Aplicada"

personality:
  - "Profesional"
  - "Amigable"
  - "Proactiva"
  - "Motivadora"

languages:
  - "Español"
  - "Inglés"
  - "Portugués"

capabilities:
  - "Gestión de Cursos: Ayudar a organizar y dar seguimiento al aprendizaje"
  - "Orientación Educativa: Guiar sobre talleres, certificaciones y rutas de aprendizaje"
  - "Productividad: Sugerir técnicas de estudio y optimización del tiempo"
  - "Asistencia General: Responder preguntas sobre la plataforma SOFIA"
  - "Analíticas: Proporcionar datos y métricas del progreso"

restrictions:
  scope: "ÚNICAMENTE responder sobre contenido y funcionalidades de la plataforma SOFIA"
  no_general_knowledge: true
  personalization_scope: "Solo estilo y tono, no alcance"

formatting:
  capitalization: "normal"
  no_emojis: true
  no_hashtags: true
  use_markdown_links: true
  link_format: "[texto](ruta)"
```

### 5.2 ui-glossary.yaml (Ejemplo)

```yaml
pages:
  business_panel:
    base_route: "/{orgSlug}/business-panel"
    description: "Panel de administración empresarial"
    sections:
      - name: "Dashboard"
        route: "/dashboard"
        description: "Estadísticas generales y métricas clave"
        features:
          - "Tarjetas con métricas"
          - "Gráficos de progreso"
          - "Actividad reciente"
      
      - name: "Equipos"
        route: "/teams"
        description: "Gestión de equipos de trabajo"
        features:
          - "Crear/editar equipos"
          - "Asignar líderes"
          - "Gestionar miembros"

modals:
  business_assign_course:
    name: "Asignar Curso"
    description: "Modal para asignar cursos a usuarios o equipos"
    fields:
      - name: "destino"
        type: "tabs"
        options: ["usuarios", "equipos"]
        required: true
      
      - name: "fecha_inicio"
        type: "date"
        required: true
        description: "Fecha de inicio del curso"
      
      - name: "fecha_limite"
        type: "date"
        required: true
        description: "Fecha límite para completar el curso"
    
    actions:
      - name: "Sugerir con LIA"
        description: "Abre modal de sugerencias de fecha límite"
```

---

## 6. Integración con Endpoint Actual

### 6.1 Modificación del Endpoint

**`apps/web/src/app/api/lia/chat/route.ts` (modificaciones):**

```typescript
// ... imports existentes ...
import { ContextBuilderService } from '@/lib/lia-context/services/ContextBuilderService';
import { UserContextProvider } from '@/lib/lia-context/providers/user/UserContextProvider';
import { CourseContextProvider } from '@/lib/lia-context/providers/course/CourseContextProvider';
import { BugReportContextProvider } from '@/lib/lia-context/providers/bug-report/BugReportContextProvider';
import { PlatformContextProvider } from '@/lib/lia-context/providers/platform/PlatformContextProvider';

// Registrar providers (hacer una sola vez al iniciar)
if (!ContextBuilderService.getRegisteredProviders().length) {
  ContextBuilderService.registerProvider(new UserContextProvider());
  ContextBuilderService.registerProvider(new CourseContextProvider());
  ContextBuilderService.registerProvider(new BugReportContextProvider());
  ContextBuilderService.registerProvider(new PlatformContextProvider());
}

// ... código existente ...

export async function POST(request: NextRequest) {
  // ... validaciones existentes ...
  
  // Construir contexto usando el nuevo sistema
  const contextRequest = {
    userId: requestContext?.userId,
    contextType: 'general', // o determinar dinámicamente
    currentPage: requestContext?.currentPage,
    pageType: requestContext?.pageType,
    messages: messages,
    personalization: personalizationSettings,
  };
  
  const builtContext = await ContextBuilderService.buildContext(contextRequest);
  const systemPrompt = ContextBuilderService.formatContextForPrompt(builtContext);
  
  // Agregar personalización si existe
  if (personalizationSettings) {
    const { LiaPersonalizationService } = await import('@/core/services/lia-personalization.service');
    const personalizationPrompt = LiaPersonalizationService.buildPersonalizationPrompt(personalizationSettings);
    systemPrompt += personalizationPrompt;
  }
  
  // ... resto del código existente ...
}
```

---

## 7. Testing

### 7.1 Tests Unitarios

**`apps/web/src/lib/lia-context/__tests__/ContextBuilderService.test.ts`:**

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { ContextBuilderService } from '../services/ContextBuilderService';
import { UserContextProvider } from '../providers/user/UserContextProvider';

describe('ContextBuilderService', () => {
  beforeEach(() => {
    // Limpiar providers antes de cada test
    // (necesitarías método para limpiar)
  });
  
  it('debe construir contexto básico', async () => {
    ContextBuilderService.registerProvider(new UserContextProvider());
    
    const request = {
      userId: 'test-user-id',
      contextType: 'general' as const,
    };
    
    const context = await ContextBuilderService.buildContext(request);
    
    expect(context.basePrompt).toBeDefined();
    expect(context.fragments.length).toBeGreaterThan(0);
    expect(context.totalTokens).toBeGreaterThan(0);
  });
  
  it('debe incluir solo providers relevantes', async () => {
    // Test de filtrado de providers
  });
});
```

---

## 8. Migración de Código Existente

### 8.1 Checklist de Migración

- [ ] Crear estructura de archivos
- [ ] Migrar `LIA_SYSTEM_PROMPT` a `system-prompt.base.yaml`
- [ ] Migrar `GLOBAL_UI_CONTEXT` a `ui-glossary.yaml`
- [ ] Crear `ConfigLoaderService`
- [ ] Crear `ContextCacheService`
- [ ] Crear `ContextBuilderService`
- [ ] Crear providers base
- [ ] Migrar `fetchPlatformContext()` a providers
- [ ] Actualizar endpoint para usar nuevo sistema
- [ ] Testing completo
- [ ] Documentación

### 8.2 Estrategia de Migración Gradual

1. **Fase 1:** Implementar sistema nuevo en paralelo
2. **Fase 2:** Migrar contexto estático primero
3. **Fase 3:** Migrar contexto dinámico
4. **Fase 4:** Eliminar código antiguo
5. **Fase 5:** Optimización y ajustes

---

**Documento creado por:** Auto (Claude)  
**Última actualización:** Enero 2025  
**Versión:** 1.0  
**Estado:** Guía Técnica de Implementación

