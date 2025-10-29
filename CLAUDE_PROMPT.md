# Prompt para Análisis y Optimización del Sistema de Comunidades

## 🎯 Objetivo Principal
Realizar un análisis profundo del funcionamiento del sistema de comunidades para identificar y resolver problemas de rendimiento, específicamente:

1. **Carga lenta de comentarios** al abrir posts
2. **Reacciones que no cargan** o tardan demasiado en aparecer
3. **Optimización general** del rendimiento del sistema de comunidades

## 📋 Contexto del Proyecto

### Arquitectura del Sistema
- **Frontend**: Next.js 14 con TypeScript y Tailwind CSS
- **Backend**: Node.js/Express con APIs REST
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estructura**: Monorepo con separación frontend/backend

### Tablas Principales de Comunidades
```sql
-- Tabla principal de comunidades
communities (id, name, description, slug, image_url, member_count, is_active, visibility, access_type)

-- Posts de la comunidad
community_posts (id, community_id, user_id, title, content, attachment_url, attachment_type, likes_count, comments_count, reaction_count)

-- Comentarios de posts
community_comments (id, post_id, community_id, user_id, content, parent_comment_id, is_deleted, created_at)

-- Reacciones de posts
community_reactions (id, user_id, post_id, comment_id, reaction_type, created_at)

-- Miembros de comunidades
community_members (id, community_id, user_id, role, joined_at, is_active)
```

## 🔍 Problemas Identificados

### 1. Problemas de Rendimiento en Comentarios
- **Carga lenta**: Los comentarios tardan en cargar al abrir posts
- **Múltiples consultas**: Se realizan consultas separadas para comentarios y datos de usuarios
- **Falta de paginación eficiente**: No hay paginación optimizada
- **Consultas N+1**: Se hacen consultas individuales para cada comentario

### 2. Problemas de Rendimiento en Reacciones
- **Carga tardía**: Las reacciones no aparecen inmediatamente
- **Consultas ineficientes**: Se cargan todas las reacciones sin optimización
- **Falta de cache**: No hay sistema de caché para reacciones
- **Actualizaciones lentas**: Las reacciones se actualizan de forma síncrona

### 3. Problemas de Arquitectura
- **Consultas secuenciales**: Muchas operaciones se ejecutan de forma secuencial
- **Falta de índices**: Posible falta de índices optimizados en la BD
- **Carga excesiva**: Se cargan datos innecesarios en cada request
- **Falta de lazy loading**: No hay carga diferida de contenido pesado

## 📊 Análisis Requerido

### 1. Análisis de Consultas SQL
- **Identificar consultas lentas** en el sistema de comunidades
- **Analizar índices** necesarios para optimizar consultas
- **Revisar joins** y relaciones entre tablas
- **Proponer consultas optimizadas** con menos round-trips

### 2. Análisis de Arquitectura Frontend
- **Revisar hooks y componentes** de comunidades
- **Identificar re-renders innecesarios**
- **Analizar gestión de estado** para comentarios y reacciones
- **Proponer optimizaciones de React** (memo, useMemo, useCallback)

### 3. Análisis de APIs
- **Revisar endpoints** de comunidades, posts, comentarios y reacciones
- **Identificar cuellos de botella** en las APIs
- **Proponer optimizaciones** de endpoints
- **Analizar paginación** y lazy loading

### 4. Análisis de Base de Datos
- **Revisar estructura** de tablas de comunidades
- **Identificar índices faltantes**
- **Proponer optimizaciones** de esquema
- **Analizar relaciones** y foreign keys

## 🛠️ Soluciones Propuestas

### 1. Optimizaciones de Base de Datos
- **Crear índices compuestos** para consultas frecuentes
- **Implementar materialized views** para estadísticas
- **Optimizar consultas** con joins eficientes
- **Implementar paginación** con cursor-based pagination

### 2. Optimizaciones de Frontend
- **Implementar lazy loading** para comentarios
- **Usar React.memo** para componentes pesados
- **Implementar virtual scrolling** para listas largas
- **Optimizar re-renders** con useMemo y useCallback

### 3. Optimizaciones de APIs
- **Implementar cache** con Redis o similar
- **Usar GraphQL** para consultas eficientes
- **Implementar WebSockets** para actualizaciones en tiempo real
- **Optimizar respuestas** con datos mínimos necesarios

### 4. Optimizaciones de Arquitectura
- **Implementar CDN** para assets estáticos
- **Usar service workers** para cache offline
- **Implementar preloading** de datos críticos
- **Optimizar bundle size** con code splitting

## 📝 Entregables Esperados

### 1. Análisis Detallado
- **Reporte de rendimiento** con métricas específicas
- **Identificación de cuellos de botella** con evidencia
- **Análisis de consultas SQL** con tiempos de ejecución
- **Recomendaciones prioritizadas** por impacto

### 2. Plan de Implementación
- **Roadmap de optimizaciones** con prioridades
- **Código optimizado** para las mejoras más críticas
- **Scripts de migración** para cambios de BD
- **Tests de rendimiento** para validar mejoras

### 3. Documentación Técnica
- **Guía de optimización** para desarrolladores
- **Mejores prácticas** para el sistema de comunidades
- **Monitoreo y métricas** para mantener rendimiento
- **Procedimientos de mantenimiento** de optimizaciones

## 🎯 Criterios de Éxito

### Métricas de Rendimiento
- **Tiempo de carga de comentarios**: < 500ms
- **Tiempo de carga de reacciones**: < 200ms
- **Tiempo de respuesta de APIs**: < 300ms
- **Tiempo de renderizado**: < 100ms

### Mejoras de UX
- **Carga progresiva** de contenido
- **Feedback visual** durante cargas
- **Estados de error** manejados apropiadamente
- **Responsive design** optimizado

## 🔧 Herramientas y Tecnologías

### Análisis de Rendimiento
- **Supabase Analytics** para consultas SQL
- **Next.js Analytics** para métricas de frontend
- **Chrome DevTools** para profiling
- **Lighthouse** para auditorías de rendimiento

### Optimizaciones Propuestas
- **Redis** para cache de reacciones
- **PostgreSQL** con índices optimizados
- **Next.js** con optimizaciones de React
- **Supabase** con consultas optimizadas

## 📋 Archivos Clave para Revisar

### Frontend
- `apps/web/src/features/communities/components/CommentsSection/`
- `apps/web/src/features/communities/hooks/useReactions.ts`
- `apps/web/src/app/communities/[slug]/page.tsx`
- `apps/web/src/app/api/communities/[slug]/posts/[postId]/comments/route.ts`
- `apps/web/src/app/api/communities/[slug]/posts/[postId]/reactions/route.ts`

### Base de Datos
- `NewBDStructure.sql` - Estructura optimizada de la BD
- `COMMUNITY_OPTIMIZATION.sql` - **NUEVO**: Optimizaciones específicas para comunidades
- Tablas: `communities`, `community_posts`, `community_comments`, `community_reactions`

### Configuración
- `apps/web/next.config.ts` - Configuración de Next.js
- `apps/web/tailwind.config.js` - Configuración de estilos
- `package.json` - Dependencias del proyecto

## 🚀 Optimizaciones Específicas Implementadas

### 1. Índices Optimizados para Comunidades
```sql
-- Índices compuestos para consultas rápidas
CREATE INDEX idx_community_posts_community_created ON community_posts (community_id, created_at DESC);
CREATE INDEX idx_community_comments_post_created ON community_comments (post_id, created_at ASC);
CREATE INDEX idx_community_reactions_post_type ON community_reactions (post_id, reaction_type);
```

### 2. Vistas Materializadas para Estadísticas
```sql
-- Estadísticas en tiempo real sin consultas pesadas
CREATE MATERIALIZED VIEW mv_community_stats AS ...
CREATE MATERIALIZED VIEW mv_post_stats AS ...
```

### 3. Funciones de Consulta Optimizadas
```sql
-- Funciones específicas para consultas rápidas
get_posts_with_stats() -- Posts con estadísticas optimizadas
get_comments_with_user_data() -- Comentarios con datos de usuario
get_reactions_summary() -- Resumen de reacciones optimizado
```

### 4. Triggers Automáticos para Contadores
```sql
-- Actualización automática de contadores
CREATE TRIGGER trigger_update_post_counters_comments ON community_comments;
CREATE TRIGGER trigger_update_post_counters_reactions ON community_reactions;
```

### 5. Procedimientos de Mantenimiento
```sql
-- Limpieza automática y refresco de vistas
refresh_community_materialized_views()
cleanup_old_community_data()
```

## 🚀 Expectativas del Análisis

1. **Identificar problemas específicos** con evidencia de código
2. **Proponer soluciones concretas** con código de ejemplo
3. **Priorizar optimizaciones** por impacto y esfuerzo
4. **Proporcionar métricas** para medir mejoras
5. **Incluir consideraciones** de escalabilidad futura

---

**Nota**: Este análisis debe ser exhaustivo y proporcionar soluciones prácticas que puedan implementarse de forma incremental para mejorar el rendimiento del sistema de comunidades sin afectar la funcionalidad existente.
