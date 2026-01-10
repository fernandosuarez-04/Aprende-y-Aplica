# 🔬 Investigación: Sistema de Contexto Dinámico para LIA

**Proyecto:** Aprende y Aplica  
**Fecha:** Enero 2025  
**Autor:** Auto (Claude - Arquitecto de Software)  
**Versión:** 1.0  
**Estado:** Investigación y Propuesta

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Estado Actual del Sistema](#2-estado-actual-del-sistema)
3. [Problemas Identificados](#3-problemas-identificados)
4. [Requisitos y Necesidades](#4-requisitos-y-necesidades)
5. [Análisis de Soluciones Posibles](#5-análisis-de-soluciones-posibles)
6. [Arquitectura Recomendada](#6-arquitectura-recomendada)
7. [Plan de Implementación](#7-plan-de-implementación)
8. [Consideraciones de Rendimiento](#8-consideraciones-de-rendimiento)
9. [Métricas de Éxito](#9-métricas-de-éxito)
10. [Próximos Pasos](#10-próximos-pasos)

---

## 1. Resumen Ejecutivo

### 1.1 Objetivo

Diseñar e implementar un sistema de contexto dinámico, eficiente y escalable para LIA (Learning Intelligence Assistant) que:

- Proporcione contexto profundo de la plataforma sin hardcode
- Permita reportar bugs con información técnica detallada
- Sea mantenible y fácil de actualizar
- Optimice rendimiento y costos de tokens

### 1.2 Problema Principal

Actualmente, LIA tiene:
- **~600 líneas de prompt hardcodeado** en el código
- **Contexto estático mezclado con lógica** de negocio
- **Queries repetitivas** sin caché eficiente

### 1.3 Solución Propuesta

Sistema híbrido que combina:
- **Archivos YAML** para contexto estático (versionado con Git)
- **Sistema modular de providers** para contexto dinámico
- **Caché multi-nivel** para optimización
- **Priorización inteligente** de contexto relevante

### 1.4 Impacto Esperado

- ✅ Reducción de tiempo de mantenimiento: **80%**
- ✅ Mejora en calidad de reportes de bugs: **60%**
- ✅ Reducción de tokens por request: **30%**
- ✅ Tiempo de construcción de contexto: **< 200ms**

---

## 2. Estado Actual del Sistema

### 2.1 Arquitectura Actual

**Componentes principales:**
- **Endpoint principal:** `apps/web/src/app/api/lia/chat/route.ts`
- **Prompt del sistema:** Hardcodeado (~600 líneas en el código)
- **Contexto dinámico:** Obtenido en cada request via `fetchPlatformContext()`
- **Personalización:** Sistema básico con `LiaPersonalizationService`
- **Esquema de BD:** Hardcodeado en `apps/web/src/lib/lia-context/database-schema.ts`

### 2.2 Flujo Actual de Contexto

```
Usuario envía mensaje
    ↓
Frontend envía request con context básico (userId, currentPage)
    ↓
Backend ejecuta fetchPlatformContext(userId)
    ↓
Construye prompt completo:
  - LIA_SYSTEM_PROMPT (hardcodeado, ~100 líneas)
  - GLOBAL_UI_CONTEXT (hardcodeado, ~300 líneas)
  - DATABASE_SCHEMA_CONTEXT (hardcodeado, ~150 líneas)
  - Contexto dinámico del usuario (BD queries)
  - Personalización del usuario
    ↓
Envía a Gemini API
    ↓
Procesa respuesta
```

### 2.3 Datos de Contexto Actuales

#### Contexto Estático (Hardcodeado)

**Ubicación:** `apps/web/src/app/api/lia/chat/route.ts`

1. **LIA_SYSTEM_PROMPT** (~100 líneas):
   - Identidad de LIA
   - Capacidades
   - Restricciones de alcance
   - Reglas de comportamiento
   - Formato de texto

2. **GLOBAL_UI_CONTEXT** (~300 líneas):
   - Glosario completo de la plataforma
   - Panel de Negocios (Business Panel)
   - Panel de Usuario Empresarial
   - Vista de Curso
   - Reproductor de Lecciones
   - Perfil
   - Planificador de Estudio
   - Elementos comunes de UI

3. **DATABASE_SCHEMA_CONTEXT** (~150 líneas):
   - Tablas principales
   - Relaciones entre entidades
   - Campos disponibles

#### Contexto Dinámico (BD Queries)

**Función:** `fetchPlatformContext(userId)`

1. **Estadísticas generales:**
   - Total de cursos activos
   - Total de usuarios
   - Total de organizaciones

2. **Información del usuario:**
   - Nombre, rol, cargo
   - Organización y slug
   - Cursos asignados
   - Progreso en lecciones
   - Lecciones recientes

3. **Contexto de página:**
   - Página actual
   - Tipo de página
   - Contexto de lección (si aplica)
   - Contexto de actividad (si aplica)

### 2.4 Sistema de Reporte de Bugs Actual

**Funcionamiento:**
1. LIA detecta intención de reporte en el mensaje del usuario
2. Genera un bloque `[[BUG_REPORT:{...}]]` en su respuesta
3. Backend parsea y guarda en `reportes_problemas`
4. Incluye metadata del cliente (viewport, platform, errors, etc.)
5. Opcionalmente incluye grabación de sesión (rrweb)

**Limitaciones identificadas:**
- ❌ LIA no tiene contexto suficiente sobre la estructura de la plataforma
- ❌ No conoce rutas exactas, componentes, o flujos de usuario
- ❌ No puede identificar automáticamente qué componente falló
- ❌ Depende del usuario para describir el problema
- ❌ No conoce bugs similares reportados antes

---

## 3. Problemas Identificados

### 3.1 Problemas de Mantenibilidad

#### 3.1.1 Prompt Hardcodeado Masivo

**Problema:**
- ~600 líneas de prompt en código TypeScript
- Difícil de actualizar sin deploy
- No versionado independientemente
- Mezcla de lógica y contenido

**Impacto:**
- Cambios requieren modificar código fuente
- Riesgo de introducir bugs al editar prompts
- No se puede hacer A/B testing fácilmente
- Difícil de revisar cambios en prompts

#### 3.1.2 Contexto de UI Hardcodeado

**Problema:**
- Glosario de modales y páginas en código
- Cambios en UI requieren actualizar código
- No hay sincronización automática con cambios reales

**Impacto:**
- Desincronización entre UI real y contexto de LIA
- LIA puede dar información incorrecta sobre la plataforma
- Mantenimiento manual constante

#### 3.1.3 Esquema de BD Hardcodeado

**Problema:**
- Puede desincronizarse con la BD real
- No refleja cambios en migraciones automáticamente

**Impacto:**
- LIA puede referenciar tablas/campos que no existen
- Información incorrecta sobre estructura de datos

### 3.2 Problemas de Rendimiento

#### 3.2.1 Queries Repetitivas

**Problema:**
- `fetchPlatformContext()` ejecuta múltiples queries en cada request
- No hay caché
- Algunos datos no cambian frecuentemente pero se consultan siempre

**Impacto:**
- Latencia alta en cada request
- Carga innecesaria en la base de datos
- Costos de operación elevados

#### 3.2.2 Prompt Muy Largo

**Problema:**
- ~3000+ tokens solo en contexto estático
- Aumenta costo y latencia
- Puede exceder límites de contexto del modelo

**Impacto:**
- Costos de API elevados
- Latencia de respuesta mayor
- Posible truncamiento de contexto

#### 3.2.3 Falta de Priorización

**Problema:**
- Todo el contexto se envía siempre
- No hay selección inteligente de contexto relevante

**Impacto:**
- Tokens desperdiciados en contexto irrelevante
- Costos innecesarios
- Posible confusión del modelo con demasiada información

### 3.3 Problemas de Escalabilidad

#### 3.3.1 No Hay Sistema de Versionado

**Problema:**
- Cambios en prompts afectan todas las conversaciones
- No se puede A/B testear diferentes versiones
- No hay rollback fácil

**Impacto:**
- Riesgo al hacer cambios
- No se puede experimentar con mejoras
- Difícil revertir cambios problemáticos

#### 3.3.2 Contexto No Personalizado por Contexto

**Problema:**
- Mismo contexto para chat global, study planner, course, etc.
- Algunos contextos son irrelevantes en ciertos escenarios

**Impacto:**
- Tokens desperdiciados
- Respuestas menos precisas
- Costos innecesarios

#### 3.3.3 Falta de Contexto Técnico

**Problema:**
- LIA no conoce estructura de componentes React
- No conoce rutas exactas de la aplicación
- No puede identificar errores técnicos específicos

**Impacto:**
- Reportes de bugs menos útiles
- No puede ayudar con problemas técnicos específicos

### 3.4 Problemas para Reporte de Bugs

#### 3.4.1 Contexto Insuficiente

**Problema:**
- LIA no sabe qué componente está en la página actual
- No conoce el flujo de usuario exacto
- No puede identificar automáticamente el tipo de error

**Impacto:**
- Reportes de bugs genéricos
- Información insuficiente para debugging
- Tiempo perdido investigando problemas

#### 3.4.2 Metadata Limitada

**Problema:**
- Solo recibe metadata del cliente si se envía explícitamente
- No hay contexto del estado de la aplicación
- No hay información sobre errores previos

**Impacto:**
- Reportes incompletos
- Falta de contexto para reproducir bugs

#### 3.4.3 Falta de Contexto Histórico

**Problema:**
- No conoce bugs similares reportados antes
- No puede sugerir soluciones basadas en bugs conocidos

**Impacto:**
- Duplicación de reportes
- No puede ayudar con problemas conocidos

---

## 4. Requisitos y Necesidades

### 4.1 Requisitos Funcionales

#### 4.1.1 Contexto Dinámico

- ✅ Debe construirse en tiempo de ejecución
- ✅ Debe adaptarse al contexto de la conversación
- ✅ Debe incluir información relevante del usuario
- ✅ Debe actualizarse automáticamente cuando cambian los datos

#### 4.1.2 Contexto de Plataforma

- ✅ Estructura de rutas y páginas
- ✅ Componentes disponibles
- ✅ Flujos de usuario
- ✅ Funcionalidades por rol
- ✅ Modales y sus campos
- ✅ Validaciones y reglas

#### 4.1.3 Contexto Técnico

- ✅ Esquema de base de datos actualizado
- ✅ APIs disponibles
- ✅ Estructura de datos
- ✅ Validaciones y reglas de negocio
- ✅ Componentes React y sus props

#### 4.1.4 Contexto para Bugs

- ✅ Componente actual en la página
- ✅ Estado de la aplicación
- ✅ Errores recientes
- ✅ Flujo de usuario que llevó al error
- ✅ Bugs similares reportados
- ✅ Stack trace y errores de consola
- ✅ Información del navegador y dispositivo

### 4.2 Requisitos No Funcionales

#### 4.2.1 Rendimiento

- ✅ Construcción de contexto < 200ms (p95)
- ✅ Caché inteligente con TTL apropiado
- ✅ Minimizar queries a BD
- ✅ Batch queries cuando sea posible

#### 4.2.2 Escalabilidad

- ✅ Sistema debe manejar crecimiento de contexto
- ✅ Versionado de prompts
- ✅ A/B testing de prompts
- ✅ Soporte para múltiples versiones simultáneas

#### 4.2.3 Mantenibilidad

- ✅ Separación de concerns
- ✅ Fácil de actualizar sin deploy
- ✅ Documentación clara
- ✅ Testing automatizado

#### 4.2.4 Eficiencia

- ✅ Solo incluir contexto relevante
- ✅ Priorización de información
- ✅ Compresión cuando sea posible
- ✅ Límites de tokens por tipo de contexto

---

## 5. Análisis de Soluciones Posibles

### 5.1 Opción 1: Sistema de Contexto Basado en Base de Datos

#### Descripción

Almacenar todo el contexto en tablas de BD y construir dinámicamente.

#### Estructura Propuesta

```sql
-- Contexto de plataforma
CREATE TABLE lia_platform_context (
  context_id UUID PRIMARY KEY,
  context_type TEXT, -- 'route', 'component', 'feature', 'ui_element'
  name TEXT,
  description TEXT,
  metadata JSONB,
  version INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Fragmentos de prompt
CREATE TABLE lia_prompt_fragments (
  fragment_id UUID PRIMARY KEY,
  fragment_type TEXT, -- 'system_base', 'capabilities', 'restrictions', 'ui_guide'
  content TEXT,
  priority INTEGER, -- Para ordenar
  conditions JSONB, -- Cuándo incluir este fragmento
  version INTEGER,
  is_active BOOLEAN
);

-- Contexto de usuario (caché)
CREATE TABLE lia_user_context_cache (
  user_id UUID PRIMARY KEY,
  context_data JSONB,
  expires_at TIMESTAMP,
  last_updated TIMESTAMP
);
```

#### Ventajas

- ✅ Totalmente dinámico
- ✅ Fácil de actualizar sin deploy
- ✅ Versionado nativo
- ✅ Permite A/B testing
- ✅ Puede ser actualizado por no-desarrolladores

#### Desventajas

- ❌ Requiere migración de datos existentes
- ❌ Más complejo de implementar
- ❌ Puede ser más lento si no se cachea bien
- ❌ Requiere UI para gestión de contexto

#### Complejidad

**Alta** - Requiere diseño de esquema, migración de datos, y posiblemente UI de administración

#### Tiempo Estimado

**2-3 semanas** de desarrollo

---

### 5.2 Opción 2: Sistema Híbrido con Archivos de Configuración

#### Descripción

Combinar archivos JSON/YAML para contexto estático + BD para dinámico.

#### Estructura Propuesta

```
apps/web/src/lib/lia-context/
  ├── config/
  │   ├── system-prompt.base.yaml
  │   ├── ui-glossary.yaml
  │   ├── routes.yaml
  │   └── capabilities.yaml
  ├── services/
  │   ├── context-builder.service.ts
  │   ├── context-cache.service.ts
  │   └── context-prioritizer.service.ts
  └── types/
      └── context.types.ts
```

#### Ventajas

- ✅ Separación clara de concerns
- ✅ Fácil de versionar con Git
- ✅ Mejor para contexto que cambia poco
- ✅ Más rápido que BD pura
- ✅ Permite code review de cambios en prompts

#### Desventajas

- ❌ Requiere deploy para cambios
- ❌ Menos flexible que BD pura
- ❌ Puede generar conflictos en Git
- ❌ No permite A/B testing fácil

#### Complejidad

**Media** - Requiere estructura de archivos y sistema de carga

#### Tiempo Estimado

**1-2 semanas** de desarrollo

---

### 5.3 Opción 3: Sistema de Contexto Inteligente con Embeddings

#### Descripción

Usar embeddings para buscar contexto relevante dinámicamente.

#### Flujo

1. Almacenar contexto en vector DB (Supabase pgvector)
2. Generar embedding de la pregunta del usuario
3. Buscar contexto más relevante (similarity search)
4. Incluir solo contexto relevante en el prompt

#### Estructura Propuesta

```sql
-- Tabla de contexto con embeddings
CREATE TABLE lia_context_embeddings (
  context_id UUID PRIMARY KEY,
  context_type TEXT,
  content TEXT,
  embedding vector(1536), -- OpenAI embeddings
  metadata JSONB,
  created_at TIMESTAMP
);

-- Índice para búsqueda rápida
CREATE INDEX ON lia_context_embeddings 
USING ivfflat (embedding vector_cosine_ops);
```

#### Ventajas

- ✅ Solo incluye contexto relevante
- ✅ Escalable a mucho contexto
- ✅ Reduce tokens significativamente
- ✅ Más inteligente y adaptativo

#### Desventajas

- ❌ Requiere infraestructura adicional (pgvector)
- ❌ Más complejo de implementar
- ❌ Costo de generar embeddings
- ❌ Puede omitir contexto importante
- ❌ Requiere fine-tuning de similarity threshold

#### Complejidad

**Muy Alta** - Requiere configuración de pgvector, generación de embeddings, y fine-tuning

#### Tiempo Estimado

**3-4 semanas** de desarrollo

---

### 5.4 Opción 4: Sistema de Contexto Modular con Plugins

#### Descripción

Sistema modular donde cada feature proporciona su propio contexto.

#### Estructura Propuesta

```typescript
// Interface para context providers
interface LiaContextProvider {
  name: string;
  priority: number;
  getContext(contextType: string, userId?: string): Promise<ContextFragment>;
  shouldInclude(contextType: string): boolean;
}

// Ejemplo: Study Planner Context Provider
class StudyPlannerContextProvider implements LiaContextProvider {
  async getContext(contextType: string, userId?: string) {
    if (contextType === 'study-planner') {
      return await this.buildStudyPlannerContext(userId);
    }
    return null;
  }
}

// Context Builder que orquesta todos los providers
class LiaContextBuilder {
  private providers: LiaContextProvider[] = [];
  
  registerProvider(provider: LiaContextProvider) {
    this.providers.push(provider);
  }
  
  async buildContext(contextType: string, userId?: string) {
    const fragments = await Promise.all(
      this.providers
        .filter(p => p.shouldInclude(contextType))
        .map(p => p.getContext(contextType, userId))
    );
    return this.combineFragments(fragments);
  }
}
```

#### Ventajas

- ✅ Muy modular y extensible
- ✅ Cada feature maneja su contexto
- ✅ Fácil de testear
- ✅ Separación de concerns perfecta
- ✅ Permite desarrollo paralelo

#### Desventajas

- ❌ Requiere refactor significativo
- ❌ Puede ser más lento si hay muchos providers
- ❌ Necesita coordinación entre features
- ❌ Puede generar duplicación de código

#### Complejidad

**Media-Alta** - Requiere diseño de interfaces y refactor de código existente

#### Tiempo Estimado

**2-3 semanas** de desarrollo

---

### 5.5 Opción 5: Sistema de Contexto con GraphQL/REST API Interna

#### Descripción

Crear una API interna que LIA puede consultar para obtener contexto.

#### Flujo

1. LIA recibe pregunta del usuario
2. Analiza qué contexto necesita
3. Hace queries a API interna para obtener contexto específico
4. Construye respuesta con contexto relevante

#### Ventajas

- ✅ Muy flexible
- ✅ LIA puede hacer queries específicas
- ✅ Separación clara de responsabilidades
- ✅ Puede ser usado por otros servicios

#### Desventajas

- ❌ Requiere múltiples round-trips
- ❌ Más latencia
- ❌ Más complejo de implementar
- ❌ Puede ser costoso (más llamadas a LLM)
- ❌ Requiere que LIA tenga capacidad de "tool calling"

#### Complejidad

**Alta** - Requiere diseño de API, tool calling en LIA, y manejo de múltiples requests

#### Tiempo Estimado

**3-4 semanas** de desarrollo

---

### 5.6 Comparación de Opciones

| Criterio | Opción 1 (BD) | Opción 2 (Híbrido) | Opción 3 (Embeddings) | Opción 4 (Plugins) | Opción 5 (API) |
|----------|---------------|-------------------|----------------------|-------------------|----------------|
| **Flexibilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Mantenibilidad** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Rendimiento** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Complejidad** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Tiempo Dev** | 2-3 sem | 1-2 sem | 3-4 sem | 2-3 sem | 3-4 sem |
| **Escalabilidad** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 6. Arquitectura Recomendada

### 6.1 Solución Híbrida: Opción 2 + Opción 4

**Recomendación:** Combinar sistema híbrido con arquitectura modular.

#### Razones de la Elección

1. **Balance óptimo:** Flexibilidad + Mantenibilidad
2. **Implementación gradual:** Se puede migrar por partes
3. **Rendimiento:** Caché + archivos estáticos = rápido
4. **Escalabilidad:** Fácil agregar nuevos context providers
5. **Versionado:** Git permite trackear cambios en prompts
6. **Testing:** Fácil de testear cada provider independientemente

### 6.2 Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────┐
│                    LIA Context System                    │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Static     │   │  Dynamic     │   │   Cache      │
│   Context    │   │  Context     │   │   Layer      │
│              │   │              │   │              │
│ - YAML files │   │ - BD queries │   │ - Redis/     │
│ - Base prompt│   │ - User data  │   │   Memory     │
│ - UI glossary│   │ - Platform   │   │ - TTL based │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Context Builder  │
                  │   & Prioritizer  │
                  └──────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  Context         │
                  │  Providers       │
                  │                  │
                  │ - UserProvider   │
                  │ - CourseProvider │
                  │ - StudyPlanner    │
                  │ - BugReport      │
                  │ - Platform       │
                  └──────────────────┘
```

### 6.3 Estructura de Archivos Propuesta

```
apps/web/src/lib/lia-context/
├── config/
│   ├── system-prompt.base.yaml      # Prompt base de LIA
│   ├── ui-glossary.yaml              # Glosario de UI (modales, páginas)
│   ├── routes.yaml                   # Rutas de la aplicación
│   ├── capabilities.yaml             # Capacidades de LIA
│   ├── restrictions.yaml             # Restricciones y reglas
│   └── database-schema.yaml         # Esquema de BD (opcional, puede generarse)
│
├── providers/
│   ├── base/
│   │   ├── BaseContextProvider.ts    # Clase base abstracta
│   │   └── types.ts                  # Tipos comunes
│   ├── user/
│   │   └── UserContextProvider.ts    # Contexto de usuario
│   ├── course/
│   │   └── CourseContextProvider.ts  # Contexto de cursos
│   ├── study-planner/
│   │   └── StudyPlannerContextProvider.ts
│   ├── bug-report/
│   │   └── BugReportContextProvider.ts # Contexto para bugs
│   └── platform/
│       └── PlatformContextProvider.ts # Contexto general plataforma
│
├── services/
│   ├── ContextBuilderService.ts     # Orquesta la construcción
│   ├── ContextCacheService.ts        # Maneja caché
│   ├── ContextPrioritizerService.ts  # Prioriza contexto relevante
│   ├── DatabaseSchemaService.ts      # Genera esquema de BD dinámicamente
│   └── ConfigLoaderService.ts        # Carga archivos YAML
│
├── cache/
│   └── ContextCache.ts               # Implementación de caché
│
└── types/
    └── index.ts                       # Tipos TypeScript
```

### 6.4 Flujo de Construcción de Contexto

```typescript
// Pseudocódigo del flujo
async function buildLIAContext(request: ChatRequest) {
  // 1. Determinar tipo de contexto necesario
  const contextType = determineContextType(request);
  
  // 2. Cargar prompt base (desde YAML, cacheado)
  const basePrompt = await ConfigLoaderService.loadBasePrompt();
  
  // 3. Obtener contexto estático relevante
  const staticContext = await ConfigLoaderService.getStaticContext(contextType);
  
  // 4. Obtener contexto dinámico (con caché)
  const dynamicContext = await ContextBuilderService.getDynamicContext(
    request.userId,
    contextType,
    request.currentPage
  );
  
  // 5. Priorizar y filtrar contexto
  const prioritizedContext = ContextPrioritizerService.prioritize(
    staticContext,
    dynamicContext,
    request.messages
  );
  
  // 6. Construir prompt final
  return ContextBuilderService.buildFinalPrompt(
    basePrompt,
    prioritizedContext,
    request.personalization
  );
}
```

### 6.5 Ejemplo de Archivo YAML

**system-prompt.base.yaml:**
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
  - "Gestión de Cursos"
  - "Orientación Educativa"
  - "Productividad"
  - "Asistencia General"
  - "Analíticas"
  
restrictions:
  scope: "Solo contenido y funcionalidades de SOFIA"
  no_general_knowledge: true
  personalization_scope: "Solo estilo y tono, no alcance"
  
formatting:
  capitalization: "normal"
  no_emojis: true
  no_hashtags: true
  use_markdown_links: true
```

**ui-glossary.yaml:**
```yaml
pages:
  business_panel:
    base_route: "/{orgSlug}/business-panel"
    sections:
      - name: "Dashboard"
        route: "/dashboard"
        description: "Estadísticas generales y métricas clave"
      - name: "Equipos"
        route: "/teams"
        description: "Gestión de equipos de trabajo"
        
modals:
  business_assign_course:
    name: "Asignar Curso"
    fields:
      - name: "destino"
        type: "tabs"
        options: ["usuarios", "equipos"]
      - name: "fecha_inicio"
        type: "date"
        required: true
      - name: "fecha_limite"
        type: "date"
        required: true
```

---

## 7. Plan de Implementación

### Fase 1: Fundación (Semana 1-2)

**Objetivos:**
- Crear estructura base del sistema
- Migrar contexto estático a YAML
- Implementar sistema de caché básico

**Tareas:**
1. ✅ Crear estructura de carpetas `apps/web/src/lib/lia-context/`
2. ✅ Instalar dependencias necesarias (yaml parser, cache library)
3. ✅ Migrar `LIA_SYSTEM_PROMPT` a `system-prompt.base.yaml`
4. ✅ Migrar `GLOBAL_UI_CONTEXT` a `ui-glossary.yaml`
5. ✅ Crear `ConfigLoaderService` para cargar YAML
6. ✅ Crear `ContextBuilderService` básico
7. ✅ Implementar caché en memoria (Map con TTL)
8. ✅ Crear tipos TypeScript
9. ✅ Testing básico

**Entregables:**
- Sistema básico funcionando
- Contexto estático migrado a YAML
- Caché implementado
- Tests unitarios básicos

**Criterios de Éxito:**
- Sistema carga YAML correctamente
- Caché funciona con TTL
- No hay regresiones en funcionalidad actual

---

### Fase 2: Providers Modulares (Semana 3-4)

**Objetivos:**
- Implementar sistema de providers
- Migrar contexto dinámico a providers
- Mejorar caché con TTL y invalidación

**Tareas:**
1. ✅ Crear `BaseContextProvider` abstracto
2. ✅ Implementar `UserContextProvider`
3. ✅ Implementar `CourseContextProvider`
4. ✅ Implementar `PlatformContextProvider`
5. ✅ Migrar `fetchPlatformContext()` a providers
6. ✅ Mejorar caché con invalidación inteligente
7. ✅ Implementar registro de providers
8. ✅ Testing de providers individuales
9. ✅ Integración con endpoint actual

**Entregables:**
- Sistema modular funcionando
- Contexto dinámico migrado a providers
- Caché mejorado con invalidación
- Tests de integración

**Criterios de Éxito:**
- Todos los providers funcionan correctamente
- Caché reduce queries a BD en >80%
- No hay regresiones en funcionalidad

---

### Fase 3: Contexto para Bugs (Semana 5-6)

**Objetivos:**
- Implementar `BugReportContextProvider`
- Agregar contexto técnico detallado
- Mejorar detección y reporte de bugs

**Tareas:**
1. ✅ Crear `BugReportContextProvider`
2. ✅ Agregar contexto de componente actual
3. ✅ Agregar contexto de errores recientes
4. ✅ Agregar contexto de bugs similares (query a BD)
5. ✅ Mejorar metadata de reportes
6. ✅ Integrar con sistema de grabación (rrweb)
7. ✅ Agregar contexto de stack traces
8. ✅ Agregar contexto de rutas y navegación
9. ✅ Testing de reporte de bugs mejorado

**Entregables:**
- Contexto completo para bugs
- Reportes mejorados con más información
- Integración con rrweb
- Tests de reporte de bugs

**Criterios de Éxito:**
- Reportes de bugs incluyen información técnica relevante
- LIA puede identificar componentes y rutas
- Mejora en calidad de reportes medible

---

### Fase 4: Optimización y Priorización (Semana 7-8)

**Objetivos:**
- Implementar priorización inteligente
- Optimizar rendimiento
- Agregar métricas

**Tareas:**
1. ✅ Crear `ContextPrioritizerService`
2. ✅ Implementar lógica de priorización basada en:
   - Tipo de contexto
   - Historial de conversación
   - Página actual
   - Intención detectada
3. ✅ Agregar métricas de uso:
   - Tiempo de construcción
   - Tokens usados
   - Hit rate de caché
   - Contexto más usado
4. ✅ Optimizar queries a BD:
   - Batch queries
   - Select específico
   - Índices
5. ✅ Implementar compresión de contexto:
   - Resumir datos largos
   - Eliminar redundancia
   - Límites por tipo
6. ✅ Testing de rendimiento
7. ✅ Documentación completa
8. ✅ Guía de uso para desarrolladores

**Entregables:**
- Sistema optimizado
- Métricas implementadas
- Documentación completa
- Guía de desarrollo

**Criterios de Éxito:**
- Tiempo de construcción < 200ms (p95)
- Reducción de tokens en >30%
- Hit rate de caché >80%
- Documentación completa y clara

---

## 8. Consideraciones de Rendimiento

### 8.1 Estrategias de Caché

#### Niveles de Caché

**L1 - Caché en Memoria (Estático):**
- **Contenido:** Contexto estático (YAML files)
- **TTL:** Infinito (invalidar en deploy)
- **Tamaño estimado:** ~100KB
- **Implementación:** Map en memoria del servidor

**L2 - Caché de Usuario:**
- **Contenido:** Contexto dinámico del usuario
- **TTL:** 5 minutos
- **Tamaño estimado:** ~50KB por usuario
- **Implementación:** LRU Cache con TTL

**L3 - Caché de Contexto de Página:**
- **Contenido:** Contexto específico de página
- **TTL:** 1 hora
- **Tamaño estimado:** ~20KB por página
- **Implementación:** LRU Cache con TTL

#### Implementación de Caché

```typescript
import { LRUCache } from 'lru-cache';

class ContextCacheService {
  // L1: Caché estático (sin expiración)
  private staticCache = new Map<string, any>();
  
  // L2: Caché de usuario (5 min TTL)
  private userCache = new LRUCache<string, any>({
    max: 1000, // Máximo 1000 usuarios
    ttl: 5 * 60 * 1000, // 5 minutos
  });
  
  // L3: Caché de página (1 hora TTL)
  private pageCache = new LRUCache<string, any>({
    max: 100, // Máximo 100 páginas
    ttl: 60 * 60 * 1000, // 1 hora
  });
  
  async getStatic(key: string, loader: () => Promise<any>) {
    if (this.staticCache.has(key)) {
      return this.staticCache.get(key);
    }
    const value = await loader();
    this.staticCache.set(key, value);
    return value;
  }
  
  async getUserContext(userId: string, loader: () => Promise<any>) {
    const cached = this.userCache.get(userId);
    if (cached) return cached;
    
    const value = await loader();
    this.userCache.set(userId, value);
    return value;
  }
  
  invalidateUser(userId: string) {
    this.userCache.delete(userId);
  }
}
```

### 8.2 Optimización de Queries

#### Estrategias

1. **Batch Queries:** Agrupar queries relacionadas
2. **Select Específico:** Solo campos necesarios
3. **Índices:** Asegurar índices en campos consultados
4. **Connection Pooling:** Reutilizar conexiones

#### Ejemplo de Optimización

```typescript
// ❌ Antes: Múltiples queries
const user = await supabase.from('users').select('*').eq('id', userId).single();
const courses = await supabase.from('user_course_enrollments').select('*').eq('user_id', userId);
const progress = await supabase.from('user_lesson_progress').select('*').eq('user_id', userId);

// ✅ Después: Una query con joins
const { data } = await supabase
  .from('users')
  .select(`
    *,
    enrollments:user_course_enrollments(
      *,
      course:courses(*)
    ),
    progress:user_lesson_progress(
      *,
      lesson:course_lessons(*)
    )
  `)
  .eq('id', userId)
  .single();
```

### 8.3 Compresión de Contexto

#### Estrategias

1. **Eliminar Redundancia:** No repetir información
2. **Resumir cuando sea posible:** Usar resúmenes para datos largos
3. **Priorizar:** Solo incluir contexto relevante
4. **Límites:** Máximo de tokens por tipo de contexto

#### Ejemplo de Compresión

```typescript
function compressContext(context: Context): CompressedContext {
  return {
    ...context,
    // Resumir lecciones si hay muchas
    lessons: context.lessons.length > 10 
      ? summarizeLessons(context.lessons)
      : context.lessons,
    // Limitar historial
    recentActivity: context.recentActivity.slice(0, 5),
    // Resumir cursos si hay muchos
    courses: context.courses.length > 20
      ? context.courses.slice(0, 20) + `... y ${context.courses.length - 20} más`
      : context.courses
  };
}

function summarizeLessons(lessons: Lesson[]): string {
  const total = lessons.length;
  const completed = lessons.filter(l => l.isCompleted).length;
  return `${completed}/${total} lecciones completadas. ${total - completed} pendientes.`;
}
```

### 8.4 Límites de Tokens

#### Estrategia de Límites

```typescript
const TOKEN_LIMITS = {
  basePrompt: 1000,        // Prompt base
  staticContext: 2000,    // Contexto estático
  userContext: 1500,      // Contexto de usuario
  pageContext: 500,       // Contexto de página
  bugContext: 1000,       // Contexto de bugs
  total: 6000,            // Total máximo
};

function enforceLimits(context: Context): Context {
  let totalTokens = estimateTokens(context.basePrompt);
  
  // Priorizar y truncar si es necesario
  if (totalTokens > TOKEN_LIMITS.total) {
    // Reducir contexto menos prioritario
    context = reduceLowPriorityContext(context);
  }
  
  return context;
}
```

---

## 9. Métricas de Éxito

### 9.1 Métricas de Rendimiento

| Métrica | Objetivo | Cómo Medir |
|---------|----------|------------|
| **Tiempo de construcción de contexto** | < 200ms (p95) | Logging de tiempo en `ContextBuilderService` |
| **Hit rate de caché** | > 80% | Contador de hits/misses en caché |
| **Tokens promedio por request** | < 4000 | Sumar tokens de cada fragmento |
| **Latencia total de request** | < 2s (p95) | End-to-end timing en endpoint |

### 9.2 Métricas de Calidad

| Métrica | Objetivo | Cómo Medir |
|---------|----------|------------|
| **Precisión de respuestas** | Mejora del 20% | Feedback de usuarios (thumbs up/down) |
| **Relevancia de contexto** | > 90% usado | Análisis de qué contexto se incluye |
| **Calidad de reportes de bugs** | Mejora del 60% | Análisis de información en reportes |

### 9.3 Métricas de Mantenibilidad

| Métrica | Objetivo | Cómo Medir |
|---------|----------|------------|
| **Tiempo para actualizar contexto** | < 5 minutos | Tiempo desde cambio hasta deploy |
| **Frecuencia de actualizaciones** | Tracking | Git commits en archivos YAML |
| **Errores por falta de contexto** | < 1% de requests | Logging de errores relacionados |

### 9.4 Dashboard de Métricas

**Implementar dashboard con:**
- Tiempo de construcción de contexto (histograma)
- Hit rate de caché (gauge)
- Tokens usados por tipo (gráfico de barras)
- Contexto más usado (tabla)
- Errores relacionados (lista)

---

## 10. Próximos Pasos

### 10.1 Inmediatos (Esta Semana)

1. ✅ **Revisar y aprobar** esta propuesta
2. ✅ **Priorizar fases** según necesidades del negocio
3. ✅ **Asignar recursos** para implementación
4. ✅ **Crear issues** en el sistema de gestión de proyectos

### 10.2 Corto Plazo (Próximas 2 Semanas)

1. ✅ **Comenzar Fase 1** de implementación
2. ✅ **Setup de estructura** de archivos
3. ✅ **Migración inicial** de contexto estático
4. ✅ **Testing básico** del sistema

### 10.3 Mediano Plazo (Próximo Mes)

1. ✅ **Completar Fase 2** (Providers modulares)
2. ✅ **Completar Fase 3** (Contexto para bugs)
3. ✅ **Inicio de Fase 4** (Optimización)

### 10.4 Largo Plazo (Próximos 2-3 Meses)

1. ✅ **Completar Fase 4** (Optimización)
2. ✅ **Implementar métricas** y dashboard
3. ✅ **Documentación completa**
4. ✅ **Training del equipo**

---

## 11. Referencias y Recursos

### 11.1 Documentación Externa

- [OpenAI Best Practices for Context](https://platform.openai.com/docs/guides/prompt-engineering)
- [LangChain Context Management](https://python.langchain.com/docs/modules/memory/)
- [Supabase pgvector](https://supabase.com/docs/guides/ai/vector-columns)
- [Next.js Caching Strategies](https://nextjs.org/docs/app/building-your-application/caching)

### 11.2 Documentación Interna

- `docs/PLAN_LIA_PROMPTS.md` - Plan de prompts de LIA
- `docs/AGENTES_LIA.md` - Documentación de agentes LIA
- `docs/FIX_LIA_ANALYTICS_DESCONECTADO.md` - Analytics de LIA

### 11.3 Archivos de Código Relevantes

- `apps/web/src/app/api/lia/chat/route.ts` - Endpoint principal
- `apps/web/src/lib/lia-context/database-schema.ts` - Esquema de BD
- `apps/web/src/core/services/lia-personalization.service.ts` - Personalización
- `apps/web/src/features/study-planner/services/lia-context.service.ts` - Contexto Study Planner

---

## 12. Anexos

### 12.1 Ejemplo de Migración de Código

**Antes (hardcodeado):**
```typescript
const LIA_SYSTEM_PROMPT = 'Eres LIA (Learning Intelligence Assistant)...';
```

**Después (YAML + Service):**
```typescript
const basePrompt = await ConfigLoaderService.loadBasePrompt();
```

### 12.2 Ejemplo de Provider

```typescript
export class UserContextProvider extends BaseContextProvider {
  name = 'user';
  priority = 10;
  
  async getContext(contextType: string, userId?: string): Promise<ContextFragment | null> {
    if (!userId) return null;
    
    const userData = await this.getUserData(userId);
    
    return {
      type: 'user',
      content: this.formatUserContext(userData),
      priority: 10,
      tokens: this.estimateTokens(userData)
    };
  }
  
  shouldInclude(contextType: string): boolean {
    return true; // Siempre incluir contexto de usuario
  }
}
```

---

**Documento creado por:** Auto (Claude)  
**Última actualización:** Enero 2025  
**Versión:** 1.0  
**Estado:** Propuesta para Revisión

