# Optimización de Carga de Comunidades
**Fecha:** 28 de Octubre de 2025  
**Estado:** 🔍 **ANÁLISIS COMPLETADO** - Pendiente implementación

## 🔴 Problemas Identificados

### 1. **Problema Crítico: N+1 Query Problem en Reacciones**
**Impacto:** ⚠️ **ALTO** - Causa lentitud severa

**Ubicación:** `apps/web/src/app/communities/[slug]/page.tsx` líneas 1377-1414

#### ❌ Código Actual (Ineficiente)
```typescript
const loadUserReactions = async (posts: Post[]) => {
  try {
    // ❌ PROBLEMA: Se hace 1 llamada HTTP por CADA post
    const reactionPromises = posts.map(async (post) => {
      try {
        // ❌ Si hay 50 posts = 50 llamadas HTTP
        const response = await fetch(
          `/api/communities/${slug}/posts/${post.id}/reactions?include_stats=true`
        );
        // ...
      }
    });
    await Promise.all(reactionPromises);
  }
};
```

#### 📊 Impacto Actual
- **50 posts** = **50 llamadas HTTP adicionales** a la API
- Cada llamada hace:
  - 1 query a `community_reactions` con JOIN a `users`
  - 2 llamadas RPC (`get_post_reaction_stats`, `get_top_reactions`)
- **Total: ~150 queries SQL** para cargar una comunidad con 50 posts

#### ⏱️ Tiempo Estimado
- Red rápida (50ms/request): **2.5 segundos** solo en reacciones
- Red lenta (200ms/request): **10 segundos** solo en reacciones
- **Más el tiempo de fetch de comunidad y posts**

---

### 2. **Problema: Consultas SQL No Optimizadas**

#### API de Posts hace JOIN innecesario
**Ubicación:** `apps/web/src/app/api/communities/[slug]/posts/route.ts` líneas 90-105

```sql
-- ❌ Se trae TODA la información del usuario para CADA post
SELECT 
  *,
  user:user_id (
    id,
    email,
    username,
    first_name,
    last_name,
    profile_picture_url
  )
FROM community_posts
```

**Problemas:**
- ✅ El JOIN está bien, pero trae `email` innecesariamente
- ❌ No hay índice en `community_id` + `created_at` 
- ❌ Consulta de reacciones separada podría hacerse en 1 query

#### API de Reacciones hace Múltiples RPCs
**Ubicación:** `apps/web/src/app/api/communities/[slug]/posts/[postId]/reactions/route.ts`

```typescript
// ❌ Se ejecutan 2 RPCs adicionales por cada post
const { data: statsData } = await supabase
  .rpc('get_post_reaction_stats', { post_id: postId });

const { data: topData } = await supabase
  .rpc('get_top_reactions', { 
    post_id: postId,
    limit_count: 3 
  });
```

---

### 3. **Problema: Llamadas Secuenciales en useEffect**

**Ubicación:** `apps/web/src/app/communities/[slug]/page.tsx` líneas 1326-1331

```typescript
useEffect(() => {
  if (slug) {
    // ❌ Estas dos llamadas podrían ser paralelas
    fetchCommunityDetail();  // Espera a terminar...
    fetchPosts();            // ...antes de empezar esta
  }
}, [slug]);
```

**Impacto:** Tiempo total = T(comunidad) + T(posts) en lugar de MAX(T1, T2)

---

### 4. **Problema: API de Comunidad hace Verificaciones Redundantes**

**Ubicación:** `apps/web/src/app/api/communities/[slug]/route.ts`

```typescript
// 1️⃣ Query para obtener comunidad
const { data: community } = await supabase
  .from('communities')
  .select('*')
  .eq('slug', slug)
  .eq('is_active', true)
  .single();

// 2️⃣ Query para TODAS las membresías del usuario (innecesario)
const { data: allMemberships } = await supabase
  .from('community_members')
  .select('community_id, role')
  .eq('user_id', user.id)
  .eq('is_active', true);

// 3️⃣ Query para membresía en ESTA comunidad
const { data: membership } = await supabase
  .from('community_members')
  .select('role, is_active')
  .eq('community_id', community.id)
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single();

// 4️⃣ Query para solicitudes pendientes
const { data: pendingRequest } = await supabase
  .from('community_access_requests')
  .select('id, status')
  .eq('community_id', community.id)
  .eq('requester_id', user.id)
  .eq('status', 'pending')
  .single();
```

**Impacto:** 4 queries cuando podría hacerse en 1-2

---

## ✅ Plan de Optimización

### **Fase 1: Quick Wins (Impacto Inmediato)** 🚀

#### 1.1 Eliminar N+1 Problem de Reacciones
**Prioridad:** 🔥 **CRÍTICA**  
**Tiempo estimado:** 2-3 horas  
**Mejora esperada:** **-60% tiempo de carga**

**Cambios:**

**A) Crear endpoint batch para reacciones**
```typescript
// apps/web/src/app/api/communities/[slug]/posts/reactions/batch/route.ts
export async function POST(request: NextRequest, { params }: any) {
  const { postIds } = await request.json();
  
  // ✅ 1 sola query para TODOS los posts
  const { data: reactions } = await supabase
    .from('community_reactions')
    .select(`
      id,
      post_id,
      reaction_type,
      user_id,
      created_at
    `)
    .in('post_id', postIds);
  
  // Agrupar por post_id
  const reactionsByPost = reactions.reduce((acc, r) => {
    if (!acc[r.post_id]) acc[r.post_id] = [];
    acc[r.post_id].push(r);
    return acc;
  }, {});
  
  return NextResponse.json({ reactions: reactionsByPost });
}
```

**B) Modificar frontend para usar batch**
```typescript
// apps/web/src/app/communities/[slug]/page.tsx
const loadUserReactions = async (posts: Post[]) => {
  try {
    const postIds = posts.map(p => p.id);
    
    // ✅ 1 sola llamada HTTP en lugar de 50
    const response = await fetch(
      `/api/communities/${slug}/posts/reactions/batch`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds })
      }
    );
    
    const { reactions } = await response.json();
    // Procesar reacciones agrupadas...
  }
};
```

**Resultado:**
- ✅ De **50 llamadas HTTP** a **1 llamada**
- ✅ De **~150 queries SQL** a **1 query**
- ✅ Tiempo de carga: **-60% aproximadamente**

---

#### 1.2 Paralelizar Carga Inicial
**Prioridad:** 🔥 **ALTA**  
**Tiempo estimado:** 15 minutos  
**Mejora esperada:** **-30% tiempo de carga**

```typescript
useEffect(() => {
  if (slug) {
    // ✅ Ejecutar en paralelo
    Promise.all([
      fetchCommunityDetail(),
      fetchPosts()
    ]);
  }
}, [slug]);
```

---

#### 1.3 Combinar Queries en API de Posts
**Prioridad:** 🔥 **ALTA**  
**Tiempo estimado:** 1 hora  
**Mejora esperada:** **-20% queries**

```typescript
// ✅ Incluir reacciones del usuario en la query inicial de posts
const { data: posts, error: postsError } = await supabase
  .from('community_posts')
  .select(`
    *,
    user:user_id (
      id,
      username,
      first_name,
      last_name,
      profile_picture_url
    ),
    user_reaction:community_reactions!left (
      reaction_type
    )
  `)
  .eq('community_id', community.id)
  .eq('community_reactions.user_id', user?.id)
  .order('created_at', { ascending: false })
  .limit(50);
```

---

### **Fase 2: Optimizaciones de Base de Datos** 💾

#### 2.1 Crear Índices Faltantes
**Prioridad:** 🟡 **MEDIA**  
**Tiempo estimado:** 30 minutos  
**Mejora esperada:** **-25% tiempo de queries**

```sql
-- Índice compuesto para community_posts
CREATE INDEX IF NOT EXISTS idx_community_posts_community_created 
ON community_posts(community_id, created_at DESC);

-- Índice para reacciones por post
CREATE INDEX IF NOT EXISTS idx_reactions_post_user 
ON community_reactions(post_id, user_id);

-- Índice para membresías
CREATE INDEX IF NOT EXISTS idx_members_user_active 
ON community_members(user_id, is_active) 
WHERE is_active = true;
```

---

#### 2.2 Crear Vista Materializada para Stats de Posts
**Prioridad:** 🟡 **MEDIA**  
**Tiempo estimado:** 2 horas  
**Mejora esperada:** **-40% en queries de estadísticas**

```sql
-- Vista materializada con estadísticas precalculadas
CREATE MATERIALIZED VIEW community_posts_stats AS
SELECT 
  p.id as post_id,
  p.community_id,
  COUNT(DISTINCT r.id) as total_reactions,
  COUNT(DISTINCT c.id) as total_comments,
  jsonb_object_agg(
    r.reaction_type, 
    COUNT(r.id)
  ) FILTER (WHERE r.reaction_type IS NOT NULL) as reactions_by_type
FROM community_posts p
LEFT JOIN community_reactions r ON p.id = r.post_id
LEFT JOIN community_comments c ON p.id = c.post_id
GROUP BY p.id, p.community_id;

-- Índice en la vista
CREATE INDEX idx_posts_stats_community 
ON community_posts_stats(community_id);

-- Refrescar automáticamente cada 5 minutos
CREATE OR REPLACE FUNCTION refresh_posts_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY community_posts_stats;
END;
$$ LANGUAGE plpgsql;

-- Trigger para refrescar después de reacciones/comentarios
-- (O usar un cron job)
```

---

### **Fase 3: Optimizaciones Frontend** ⚛️

#### 3.1 Implementar Lazy Loading de Posts
**Prioridad:** 🟢 **BAJA**  
**Tiempo estimado:** 3 horas  
**Mejora esperada:** **Carga inicial -70%**

```typescript
// Cargar solo 10 posts inicialmente
const [page, setPage] = useState(0);
const POSTS_PER_PAGE = 10;

const fetchPosts = async (pageNumber = 0) => {
  const response = await fetch(
    `/api/communities/${slug}/posts?limit=${POSTS_PER_PAGE}&offset=${pageNumber * POSTS_PER_PAGE}`
  );
  // ...
};

// Infinite scroll o botón "Ver más"
```

---

#### 3.2 Implementar React Query para Caching
**Prioridad:** 🟢 **BAJA**  
**Tiempo estimado:** 4 horas  
**Mejora esperada:** Navegación instantánea en visitas repetidas

```bash
npm install @tanstack/react-query
```

```typescript
import { useQuery } from '@tanstack/react-query';

const { data: posts, isLoading } = useQuery({
  queryKey: ['community-posts', slug],
  queryFn: () => fetchPosts(),
  staleTime: 30000, // Cache 30 segundos
  cacheTime: 300000 // Mantener 5 minutos
});
```

---

#### 3.3 Optimizar Re-renders con useMemo
**Prioridad:** 🟢 **BAJA**  
**Tiempo estimado:** 1 hora  
**Mejora esperada:** Mejor performance en interacciones

```typescript
const enrichedPosts = useMemo(() => {
  return posts.map(post => ({
    ...post,
    userReaction: userReactions[post.id],
    reactionStats: postReactionStats[post.id]
  }));
}, [posts, userReactions, postReactionStats]);
```

---

## 📊 Resumen de Mejoras Esperadas

| Optimización | Tiempo | Mejora | Prioridad |
|-------------|--------|--------|-----------|
| 1.1 Batch de Reacciones | 2-3h | -60% | 🔥 CRÍTICA |
| 1.2 Paralelizar Carga | 15min | -30% | 🔥 ALTA |
| 1.3 Combinar Queries | 1h | -20% | 🔥 ALTA |
| 2.1 Índices DB | 30min | -25% | 🟡 MEDIA |
| 2.2 Vista Materializada | 2h | -40% stats | 🟡 MEDIA |
| 3.1 Lazy Loading | 3h | -70% inicial | 🟢 BAJA |
| 3.2 React Query | 4h | Cache | 🟢 BAJA |
| 3.3 useMemo | 1h | UI smooth | 🟢 BAJA |

### Mejora Total Esperada (Fase 1)
**Tiempo actual:** ~5-10 segundos  
**Tiempo optimizado:** ~1-2 segundos  
**Reducción:** **70-80%** 🚀

---

## 🎯 Roadmap de Implementación

### Semana 1: Quick Wins
- [ ] **Día 1-2:** Implementar batch endpoint de reacciones (1.1)
- [ ] **Día 2:** Paralelizar carga inicial (1.2)
- [ ] **Día 3:** Combinar queries en API de posts (1.3)
- [ ] **Día 4:** Testing y ajustes
- [ ] **Día 5:** Deploy a producción

**Resultado:** Reducción del 70% en tiempo de carga ✅

### Semana 2: Optimizaciones DB
- [ ] **Día 1:** Crear índices (2.1)
- [ ] **Día 2-3:** Implementar vista materializada (2.2)
- [ ] **Día 4:** Testing y monitoreo
- [ ] **Día 5:** Optimización de queries restantes

**Resultado:** Queries 50% más rápidas ✅

### Semana 3: Frontend Avanzado (Opcional)
- [ ] **Día 1-2:** Implementar lazy loading (3.1)
- [ ] **Día 3-4:** Integrar React Query (3.2)
- [ ] **Día 5:** Optimizar re-renders (3.3)

**Resultado:** Experiencia de usuario premium ✅

---

## 🧪 Métricas a Monitorear

### Antes de Optimizar
```javascript
// Agregar en página de comunidad
console.time('Community Load');
console.time('Fetch Posts');
console.time('Fetch Reactions');

// Al terminar cada operación
console.timeEnd('...');
```

### KPIs
- ⏱️ **Time to Interactive (TTI):** < 2 segundos
- 📊 **Total HTTP Requests:** < 5 (actualmente ~55)
- 💾 **Total DB Queries:** < 10 (actualmente ~150+)
- 🚀 **Lighthouse Performance Score:** > 90

---

## 📁 Archivos a Modificar

### Fase 1 (Quick Wins)
```
apps/web/src/app/
├── api/communities/[slug]/
│   ├── posts/
│   │   ├── route.ts                    ← Modificar (1.3)
│   │   └── reactions/
│   │       └── batch/
│   │           └── route.ts            ← CREAR (1.1)
│   └── route.ts                        ← Optimizar queries
└── communities/[slug]/
    └── page.tsx                        ← Modificar (1.1, 1.2)
```

### Fase 2 (Database)
```
database-fixes/
└── optimize-community-queries.sql      ← CREAR (2.1, 2.2)
```

### Fase 3 (Frontend)
```
apps/web/src/
├── features/communities/
│   ├── hooks/
│   │   ├── useCommunityPosts.ts       ← CREAR (3.2)
│   │   └── useInfiniteScroll.ts       ← CREAR (3.1)
│   └── components/
│       └── PostList.tsx               ← Optimizar (3.3)
└── lib/
    └── react-query.ts                 ← CREAR (3.2)
```

---

## ⚠️ Consideraciones Importantes

### Compatibilidad hacia atrás
- ✅ Mantener endpoint individual de reacciones para compatibilidad
- ✅ Migrar gradualmente a batch endpoint
- ✅ Documentar cambios en API

### Testing
- 🧪 Probar con 0, 10, 50 y 100 posts
- 🧪 Verificar con usuarios con/sin autenticación
- 🧪 Testear en red lenta (3G throttling)

### Rollback Plan
- 📦 Mantener código anterior comentado
- 📦 Feature flags para activar/desactivar optimizaciones
- 📦 Monitoreo de errores con Sentry

---

## 📚 Referencias

- [N+1 Query Problem](https://stackoverflow.com/questions/97197/what-is-the-n1-selects-problem)
- [PostgreSQL Indexing Best Practices](https://www.postgresql.org/docs/current/indexes.html)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Next.js Performance Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)

---

**Última actualización:** 28 de Octubre de 2025  
**Autor:** GitHub Copilot  
**Estado:** Pendiente de implementación
