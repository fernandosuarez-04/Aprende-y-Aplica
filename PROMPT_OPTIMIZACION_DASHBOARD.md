# Prompt para Optimización Global de Tiempos de Carga - Aprende y Aplica

## 🚨 PROBLEMA CRÍTICO

La aplicación presenta tiempos de carga **extremadamente lentos** en múltiples páginas que afectan gravemente la experiencia del usuario:

- **Tiempo de carga del panel del dashboard:** ~22 segundos
- **Tiempo total de carga de la página:** 1.3 minutos (78 segundos)
- **Contexto:** Esto ocurre en el dashboard cuando un usuario inicia sesión o un administrador cambia de rol, pero también afecta a otras páginas como cursos, comunidades, noticias, etc.

Este problema es **inaceptable para producción** y requiere una optimización urgente y **global** de toda la aplicación para reducir los tiempos de carga **al mínimo posible**.

---

## 📊 EVIDENCIA DEL PROBLEMA

### 1. Análisis de Chrome DevTools (Pestaña Network)

Del archivo HAR (`aprendeyaplica.ai.har`) y las imágenes proporcionadas, se identifican las siguientes solicitudes problemáticas:

#### Solicitudes Excesivamente Lentas:
- **`/api/auth/me`**: Se llama **mínimo 9 veces** durante la carga inicial
  - Tiempos individuales: 11.21s, 15.71s, 20.21s, 23.64s, 26.15s, 30.58s, 35.16s, 39.56s
  - **Problema:** Cada componente que usa `useAuth()` hace su propia llamada sin cacheo compartido
  
- **`/api/my-courses`**: ~8.87 segundos
- **`/api/my-courses?stats_only=true`**: ~5.59 segundos
  - **Problema:** Estas dos llamadas podrían combinarse en una sola

- **`/api/notifications?status=unread&limit=10&orderBy=priority`**: Múltiples llamadas con errores 503
- **`/api/notifications/unread-count`**: Múltiples llamadas con errores 503
  - **Problema:** Polling excesivo y manejo de errores deficiente

#### Resumen de Red:
- **54 solicitudes totales**
- **104 kB transferidos**
- **5.5 MB recursos**
- **Finish: 1.3 min** ⚠️
- **DOMContentLoaded: 5.89s**
- **Load: 6.23s**

### 2. Análisis de Console Logs

Los logs de la consola revelan patrones críticos de ineficiencia:

#### A. Llamadas Repetidas a `/api/auth/me`
```
🔄 useAuth: Obteniendo sesión inicial... (aparece múltiples veces)
📡 Respuesta de /api/auth/me: 200 true (al menos 7 veces)
📋 Datos recibidos: Object
✅ Usuario encontrado: Object
```

**Problema:** Cada componente que usa `useAuth()` está haciendo su propia llamada HTTP independiente. No hay un estado global compartido o sistema de cacheo.

#### B. Re-renderizados Excesivos de Componentes
```
🔍 UserDropdown renderizado, user: Object (aparece 20+ veces)
🔍 UserProfile: Object
🎭 Rol del usuario: Administrador
✅ Es administrador: true
🔍 HiddenAdminButton: Verificando acceso... (múltiples veces)
🎨 AIChatAgent renderizando - isOpen: false isMinimized: false (15+ veces)
```

**Problema:** 
- Los `console.log` están en el cuerpo de los componentes (ej: `UserDropdown.tsx` líneas 47-50), ejecutándose en cada render
- No hay memoización (`React.memo`, `useMemo`, `useCallback`)
- Los componentes se re-renderizan innecesariamente cuando cambian props no relacionadas

#### C. Verificaciones de Rol Redundantes
```
🎭 Rol del usuario: undefined
✅ Es administrador: false
🎭 Rol del usuario: Administrador
✅ Es administrador: true
🔄 useUserRole: Verificando rol del usuario... (múltiples veces)
```

**Problema:** La verificación de rol se ejecuta repetidamente, incluso después de que el usuario ya ha sido identificado como administrador.

#### D. Procesamiento Repetitivo de Datos
```
Curso: IA esencial, aprende lo que otros tardan meses en descubrir... (aparece 10+ veces)
Status: Disponible/Adquirido
```

**Problema:** Los datos de cursos se están procesando o re-evaluando innecesariamente en cada render.

#### E. Errores 404
```
Failed to load resource: the server responded with a status of 404 () 
/api/courses/ia-esencial/reviews
```

**Problema:** Se está intentando cargar un recurso que no existe, lo que puede estar bloqueando o ralentizando otras solicitudes.

---

## 🔍 CAUSAS RAÍZ IDENTIFICADAS

### 1. **Falta de Estado Global de Autenticación**
- `useAuth()` usa estado local (`useState`) en cada instancia
- No hay un contexto de React o store global (Zustand/Redux) para compartir el estado del usuario
- Cada componente hace su propia llamada HTTP a `/api/auth/me`

**Ubicación del problema:**
- `apps/web/src/features/auth/hooks/useAuth.ts` - Hook sin estado compartido, cada instancia hace su propia llamada HTTP
- **15 archivos diferentes** usan `useAuth()`, lo que significa que potencialmente se hacen 15 llamadas HTTP independientes durante la carga inicial
  - `apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx`
  - `apps/web/src/app/dashboard/page.tsx`
  - `apps/web/src/core/components/UserDropdown/UserDropdown.tsx`
  - `apps/web/src/core/hooks/useUserRole.ts` (que a su vez se usa en múltiples componentes)
  - Y 11 archivos más...

### 2. **Re-renderizados Excesivos**
- Componentes sin memoización (`UserDropdown`, `UserProfile`, `HiddenAdminButton`, `AIChatAgent`)
- Console.logs en el cuerpo de componentes (ejecutándose en cada render)
- Props inestables (funciones sin `useCallback`, objetos sin `useMemo`)

**Ubicaciones problemáticas:**
- `apps/web/src/core/components/UserDropdown/UserDropdown.tsx` (líneas 47-50) - Console.logs en el cuerpo del componente
- `apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx` (línea 99) - Console.log en useEffect que se ejecuta en cada cambio
- `apps/web/src/core/components/HiddenAdminButton/HiddenAdminButton.tsx` (líneas 13-23) - Console.logs en el cuerpo del componente
- `apps/web/src/core/hooks/useUserRole.ts` (líneas 24-45) - Console.logs en useEffect que se ejecuta frecuentemente
- Componentes que usan `useAuth()` sin memoización

### 3. **Consultas Redundantes a la API**
- Múltiples llamadas a `/api/auth/me` sin deduplicación
- Consultas de notificaciones con polling excesivo
- `/api/my-courses` y `/api/my-courses?stats_only=true` podrían combinarse

**Ubicaciones problemáticas:**
- `apps/web/src/app/dashboard/page.tsx` (líneas 88-91) - Dos llamadas separadas que podrían combinarse
- `apps/web/src/features/notifications/context/NotificationContext.tsx` - Polling excesivo (30s)
- **15 archivos diferentes** que usan `useAuth()`, cada uno haciendo su propia llamada HTTP
- `apps/web/src/core/hooks/useUserRole.ts` - Depende de `useAuth()` y se ejecuta en cada cambio

### 4. **Falta de Cacheo y Deduplicación**
- No se usa SWR o React Query para cacheo automático
- Aunque existe `SWRProvider`, no se está utilizando en los hooks de autenticación
- No hay deduplicación de solicitudes concurrentes

**Ubicaciones problemáticas:**
- `apps/web/src/core/providers/SWRProvider.tsx` (existe pero no se usa en auth)
- `apps/web/src/features/auth/hooks/useAuth.ts` (no usa SWR)

### 5. **Consultas de Base de Datos Ineficientes**
- `useUserProfile` hace una consulta completa a Supabase (`select('*')`) cada vez que cambia `user?.id`
- No hay cacheo de perfil de usuario
- Consultas podrían optimizarse con selección de campos específicos

**Ubicaciones problemáticas:**
- `apps/web/src/features/auth/hooks/useUserProfile.ts` (línea 38: `select('*')`)

### 6. **Error 404 en Reviews**
- Se intenta cargar `/api/courses/ia-esencial/reviews` que no existe
- Esto puede estar bloqueando otras solicitudes o causando reintentos

---

## 🎯 OBJETIVOS DE OPTIMIZACIÓN GLOBAL

### Objetivos de Rendimiento (Target):
- **Tiempo de carga del dashboard:** < 2 segundos
- **Tiempo de carga de páginas estáticas:** < 1 segundo
- **Tiempo de carga de páginas dinámicas:** < 2.5 segundos
- **Tiempo total de carga (Finish):** < 3 segundos
- **Reducción de solicitudes HTTP:** Al menos 60% menos llamadas
- **Reducción de re-renderizados:** Al menos 80% menos renders innecesarios
- **Reducción del tamaño del bundle JavaScript:** Al menos 40% menos
- **Optimización de imágenes:** Reducción de 70% en peso de imágenes

### Métricas de Éxito (Core Web Vitals):
- **First Contentful Paint (FCP):** < 1.0s (objetivo: < 1.8s)
- **Largest Contentful Paint (LCP):** < 2.0s (objetivo: < 2.5s)
- **Time to Interactive (TTI):** < 2.5s (objetivo: < 3.8s)
- **Total Blocking Time (TBT):** < 100ms (objetivo: < 200ms)
- **Cumulative Layout Shift (CLS):** < 0.1 (objetivo: < 0.1)
- **First Input Delay (FID):** < 50ms (objetivo: < 100ms)

### Optimización Global:
- **Todas las páginas** deben cumplir con estos objetivos
- **Carga inicial** optimizada para primera visita
- **Navegación entre páginas** fluida y rápida (< 500ms)
- **Carga progresiva** de contenido no crítico
- **Cacheo agresivo** de recursos estáticos

---

## 📋 TAREAS ESPECÍFICAS DE OPTIMIZACIÓN

### 1. Implementar Estado Global de Autenticación

**Problema Actual:**
- Cada instancia de `useAuth()` hace su propia llamada HTTP
- No hay estado compartido entre componentes

**Solución Propuesta:**
1. Crear un contexto de React `AuthContext` que proporcione el estado de autenticación globalmente
2. O migrar a un store global (Zustand) para gestión de estado
3. Implementar cacheo en memoria con tiempo de vida (TTL)
4. Usar SWR o React Query para cacheo automático y deduplicación

**Archivos a Modificar:**
- `apps/web/src/features/auth/hooks/useAuth.ts` - Refactorizar para usar contexto/store global
- Crear `apps/web/src/features/auth/context/AuthContext.tsx`
- O crear `apps/web/src/features/auth/stores/authStore.ts` (Zustand)

**Código de Ejemplo (Zustand):**
```typescript
// apps/web/src/features/auth/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  loading: boolean;
  lastFetch: number | null;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      lastFetch: null,
      
      fetchUser: async () => {
        const { lastFetch } = get();
        const now = Date.now();
        
        // Si tenemos datos recientes, no hacer fetch
        if (lastFetch && (now - lastFetch) < CACHE_TTL && get().user) {
          return;
        }
        
        set({ loading: true });
        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            set({ 
              user: data.success ? data.user : null,
              lastFetch: now,
              loading: false 
            });
          } else {
            set({ user: null, loading: false });
          }
        } catch (error) {
          set({ user: null, loading: false });
        }
      },
      
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Solo persistir usuario, no loading
    }
  )
);
```

**Usar SWR para Cacheo Automático:**
```typescript
// apps/web/src/features/auth/hooks/useAuth.ts
import useSWR from 'swr';

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error('Not authenticated');
  const data = await response.json();
  return data.success ? data.user : null;
};

export function useAuth() {
  const { data: user, error, isLoading, mutate } = useSWR(
    '/api/auth/me',
    fetcher,
    {
      revalidateOnFocus: false, // No revalidar al cambiar de pestaña
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Deduplicar solicitudes dentro de 5 segundos
      refreshInterval: 0, // No polling automático
    }
  );

  return {
    user: user ?? null,
    loading: isLoading,
    isAuthenticated: !!user && !error,
    refreshUser: () => mutate(),
  };
}
```

### 2. Optimizar Re-renderizados con Memoización

**Problema Actual:**
- Componentes se re-renderizan en cada cambio de estado
- Console.logs en el cuerpo de componentes
- Props inestables (funciones, objetos)

**Solución Propuesta:**
1. Envolver componentes con `React.memo`
2. Usar `useMemo` para valores calculados
3. Usar `useCallback` para funciones pasadas como props
4. Mover console.logs a `useEffect` o eliminarlos en producción
5. Memoizar selectores de store (si usas Zustand)

**Archivos a Modificar:**
- `apps/web/src/core/components/UserDropdown/UserDropdown.tsx` - Memoizar y mover console.logs
- `apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx` - Memoizar y optimizar logs
- `apps/web/src/core/components/HiddenAdminButton/HiddenAdminButton.tsx` - Memoizar y mover console.logs
- `apps/web/src/core/hooks/useUserRole.ts` - Memoizar cálculos y mover console.logs a desarrollo

**Código de Ejemplo:**
```typescript
// apps/web/src/core/components/UserDropdown/UserDropdown.tsx
export const UserDropdown = React.memo(function UserDropdown({ className = '' }: UserDropdownProps) {
  const { user, logout } = useAuth();
  const { userProfile } = useUserProfile();
  
  // Mover logs a useEffect solo en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 UserDropdown renderizado, user:', user);
    }
  }, [user]);
  
  // Memoizar valores calculados
  const isAdmin = useMemo(
    () => user?.cargo_rol?.toLowerCase() === 'administrador',
    [user?.cargo_rol]
  );
  
  // Memoizar funciones
  const handleLogout = useCallback(async () => {
    await logout();
    setIsOpen(false);
  }, [logout]);
  
  // ... resto del componente
});
```

### 3. Deduplicar y Combinar Solicitudes HTTP

**Problema Actual:**
- Múltiples llamadas a `/api/auth/me`
- `/api/my-courses` y `/api/my-courses?stats_only=true` se llaman por separado
- No hay deduplicación de solicitudes concurrentes

**Solución Propuesta:**
1. Usar SWR o React Query para deduplicación automática
2. Combinar endpoints cuando sea posible
3. Implementar un sistema de deduplicación manual si no se usa SWR

**Archivos a Modificar:**
- `apps/web/src/app/dashboard/page.tsx` (líneas 88-91)
- `apps/web/src/features/auth/hooks/useAuth.ts`
- Crear `apps/web/src/lib/utils/request-deduplicator.ts` (si no usas SWR)

**Código de Ejemplo (Combinar Endpoints):**
```typescript
// Modificar el endpoint /api/my-courses para aceptar query params
// GET /api/my-courses?include_stats=true

// En dashboard/page.tsx
React.useEffect(() => {
  const fetchData = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingStats(true);
      // Una sola llamada que devuelve cursos + stats
      const response = await fetch('/api/my-courses?include_stats=true');
      const data = await response.json();
      
      setStats({
        completed: data.stats?.completed_courses || 0,
        inProgress: data.stats?.in_progress_courses || 0,
        favorites: favorites.length,
      });
      
      const sortedCourses = (data.courses || [])
        .sort((a, b) => {
          const dateA = new Date(a.last_accessed_at || a.purchased_at || 0);
          const dateB = new Date(b.last_accessed_at || b.purchased_at || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);
      
      setRecentActivity(sortedCourses);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  fetchData();
}, [user?.id, favorites.length]);
```

### 4. Optimizar Consultas de Base de Datos

**Problema Actual:**
- `useUserProfile` hace `select('*')` cada vez
- No hay cacheo de perfil
- Consultas se ejecutan incluso cuando los datos no han cambiado

**Solución Propuesta:**
1. Seleccionar solo campos necesarios en lugar de `*`
2. Implementar cacheo con SWR
3. Usar `useMemo` para evitar re-fetches innecesarios

**Archivos a Modificar:**
- `apps/web/src/features/auth/hooks/useUserProfile.ts`

**Código de Ejemplo:**
```typescript
// apps/web/src/features/auth/hooks/useUserProfile.ts
import useSWR from 'swr';

const fetcher = async (url: string) => {
  const supabase = createClient();
  const userId = url.split('/').pop();
  
  // Seleccionar solo campos necesarios
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, display_name, username, email, profile_picture_url, bio, linkedin_url, github_url, website_url, location, cargo_rol, type_rol')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

export function useUserProfile() {
  const { user } = useAuth();
  
  const { data: userProfile, error, isLoading, mutate } = useSWR(
    user?.id ? `/api/user-profile/${user.id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // 10 segundos
    }
  );
  
  return {
    userProfile: userProfile ?? null,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: () => mutate(),
  };
}
```

### 5. Optimizar Polling de Notificaciones

**Problema Actual:**
- Polling excesivo de notificaciones
- Errores 503 no manejados adecuadamente
- Múltiples llamadas simultáneas

**Solución Propuesta:**
1. Reducir frecuencia de polling (de 30s a 60s o más)
2. Implementar backoff exponencial en caso de errores
3. Usar SWR con `refreshInterval` en lugar de polling manual
4. Pausar polling cuando la pestaña no está activa

**Archivos a Modificar:**
- `apps/web/src/features/notifications/context/NotificationContext.tsx`
- `apps/web/src/app/layout.tsx` (línea 134: `pollingInterval={30000}`)

**Código de Ejemplo:**
```typescript
// En NotificationContext.tsx
const { data, error } = useSWR(
  '/api/notifications?status=unread&limit=10',
  fetcher,
  {
    refreshInterval: 60000, // 60 segundos en lugar de 30
    revalidateOnFocus: true, // Solo revalidar cuando la pestaña está activa
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // Backoff exponencial
      if (retryCount >= 3) return;
      if (error.status === 503) {
        // Esperar más tiempo en caso de error 503
        setTimeout(() => revalidate({ retryCount }), 5000 * (retryCount + 1));
      }
    },
  }
);
```

### 6. Corregir Error 404 en Reviews

**Problema Actual:**
- Se intenta cargar `/api/courses/ia-esencial/reviews` que no existe

**Solución Propuesta:**
1. Verificar si el endpoint existe
2. Si no existe, crearlo o remover la llamada
3. Implementar manejo de errores adecuado

**Archivos a Revisar:**
- Buscar dónde se hace la llamada a `/api/courses/[slug]/reviews`
- Verificar si el endpoint existe en `apps/web/src/app/api/courses/[slug]/reviews/route.ts`

### 7. Implementar Lazy Loading y Code Splitting

**Problema Actual:**
- `AIChatAgent` se carga incluso cuando no se usa
- Aunque hay lazy loading en `dashboard/page.tsx`, `AIChatAgent` se carga en `layout.tsx`

**Solución Propuesta:**
1. Mover `AIChatAgent` a lazy loading en `layout.tsx`
2. Cargar solo cuando sea necesario (ej: después de que el usuario esté autenticado)

**Archivos a Modificar:**
- `apps/web/src/app/layout.tsx` (línea 142)

**Código de Ejemplo:**
```typescript
// apps/web/src/app/layout.tsx
const AIChatAgent = lazy(() => 
  import('../core/components/AIChatAgent/AIChatAgent').then(m => ({ 
    default: m.AIChatAgent 
  }))
);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SWRProvider>
          <ThemeProvider>
            <NotificationProvider pollingInterval={60000}>
              <PrefetchManager />
              <ConditionalNavbar>
                {children}
              </ConditionalNavbar>
              <Suspense fallback={null}>
                <AIChatAgent
                  assistantName="Lia"
                  initialMessage="¡Hola! 👋 Soy Lia, tu asistente de IA."
                />
              </Suspense>
            </NotificationProvider>
          </ThemeProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
```

### 8. Optimizar Prefetching

**Problema Actual:**
- Prefetching puede estar causando solicitudes adicionales innecesarias

**Solución Propuesta:**
1. Reducir la cantidad de prefetches
2. Prefetch solo en hover, no automáticamente
3. Usar `prefetch={false}` en Next.js Link cuando no sea necesario

**Archivos a Revisar:**
- `apps/web/src/core/components/PrefetchManager/PrefetchManager.tsx`

---

## 🛠️ IMPLEMENTACIÓN RECOMENDADA (PRIORIDAD GLOBAL)

### Fase 1: Correcciones Críticas - Dashboard (Inmediato - Día 1)
1. ✅ **Implementar estado global de autenticación con SWR** (Mayor impacto)
2. ✅ **Memoizar componentes críticos** (`UserDropdown`, `AIChatAgent`, `HiddenAdminButton`)
3. ✅ **Eliminar/mover console.logs** del cuerpo de componentes
4. ✅ **Corregir error 404** en reviews

### Fase 2: Optimizaciones de API y Datos (Día 2)
5. ✅ **Combinar endpoints** (`/api/my-courses` + stats)
6. ✅ **Optimizar consultas de BD** (select específico en lugar de `*`)
7. ✅ **Reducir polling** de notificaciones (30s → 60s)
8. ✅ **Implementar cacheo en APIs** con headers apropiados
9. ✅ **Optimizar todas las consultas Supabase** (seleccionar solo campos necesarios)

### Fase 3: Optimizaciones de Next.js y Build (Día 3)
10. ✅ **Configurar code splitting** y dynamic imports
11. ✅ **Optimizar next.config.js** (SWC, compresión, imágenes)
12. ✅ **Implementar SSG/ISR** donde sea posible
13. ✅ **Analizar y optimizar bundle size** (bundle analyzer)
14. ✅ **Optimizar imports** (tree-shaking, imports específicos)

### Fase 4: Optimizaciones de Assets (Día 4)
15. ✅ **Optimizar todas las imágenes** (Next.js Image, WebP, lazy loading)
16. ✅ **Optimizar fuentes** (font-display: swap, preload)
17. ✅ **Optimizar CSS** (purge, critical CSS)
18. ✅ **Implementar CDN** para assets estáticos (si es posible)

### Fase 5: Optimizaciones de Navegación y UX (Día 5)
19. ✅ **Implementar loading states** para todas las rutas
20. ✅ **Optimizar prefetching** (solo en hover, inteligente)
21. ✅ **Mejorar transiciones** entre páginas
22. ✅ **Implementar skeleton screens** en lugar de spinners

### Fase 6: Optimizaciones Avanzadas (Día 6-7)
23. ✅ **Implementar service worker** para cacheo offline
24. ✅ **Configurar monitoreo de Web Vitals** (Lighthouse CI)
25. ✅ **Implementar virtual scrolling** para listas largas
26. ✅ **Optimizar re-renderizados** en toda la aplicación (React.memo, useMemo, useCallback)
27. ✅ **Implementar error boundaries** para mejor UX
28. ✅ **Configurar rate limiting** en APIs críticas

---

## 📝 NOTAS ADICIONALES

### Consideraciones de Seguridad
- Al implementar cacheo, asegurarse de que los datos sensibles no se cacheen en localStorage sin encriptación
- El estado de autenticación debe invalidarse cuando el usuario cierra sesión
- Las cookies de sesión deben tener configuraciones de seguridad adecuadas
- No cachear respuestas que contengan información sensible del usuario
- Implementar CORS apropiado en APIs

### Consideraciones de UX
- Mostrar estados de carga apropiados mientras se cargan los datos
- Implementar skeleton screens en lugar de spinners cuando sea posible
- Asegurar que el contenido crítico se cargue primero (above the fold)
- Implementar error boundaries para mostrar errores de forma amigable
- Mostrar mensajes de error claros y acciones de recuperación

### Testing y Validación
- **Probar en diferentes condiciones de red:**
  - Red rápida (4G/WiFi)
  - Red lenta (3G)
  - Red muy lenta (2G)
  - Sin conexión (offline)
  
- **Probar en diferentes dispositivos:**
  - Desktop (Chrome, Firefox, Safari, Edge)
  - Mobile (iOS Safari, Chrome Mobile)
  - Tablet
  
- **Métricas a validar:**
  - Lighthouse Score: > 90 en todas las categorías
  - Core Web Vitals: Todos en verde
  - Bundle size: Reducción de 40%+
  - Time to First Byte (TTFB): < 600ms
  - First Contentful Paint (FCP): < 1.8s
  - Largest Contentful Paint (LCP): < 2.5s
  
- **Verificar que no haya regresiones:**
  - Funcionalidad existente funciona correctamente
  - No hay errores en consola
  - No hay warnings de React
  - Tests existentes pasan

### Estrategia de Rollout
1. **Fase de desarrollo:** Implementar cambios en branch separado
2. **Fase de testing:** Probar exhaustivamente en staging
3. **Fase de monitoreo:** Deploy gradual con monitoreo de métricas
4. **Fase de optimización continua:** Iterar basándose en métricas reales

### Herramientas Recomendadas
- **Análisis de Performance:**
  - Lighthouse (Chrome DevTools)
  - WebPageTest
  - Chrome User Experience Report
  - Vercel Analytics (si usas Vercel)
  
- **Monitoreo:**
  - Sentry (errores)
  - LogRocket (sesiones de usuario)
  - Google Analytics (métricas de uso)
  
- **Optimización:**
  - Bundle Analyzer
  - Source Map Explorer
  - Chrome DevTools Performance Tab

---

## 🔗 ARCHIVOS CLAVE A REVISAR

### Hooks de Autenticación
- `apps/web/src/features/auth/hooks/useAuth.ts`
- `apps/web/src/features/auth/hooks/useUserProfile.ts`
- `apps/web/src/core/hooks/useUserRole.ts` - **CRÍTICO:** Se ejecuta en cada cambio y tiene logs excesivos

### Componentes
- `apps/web/src/core/components/UserDropdown/UserDropdown.tsx` - **CRÍTICO:** Re-renderiza excesivamente con logs en el cuerpo
- `apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx` - **CRÍTICO:** Se renderiza 15+ veces según logs
- `apps/web/src/core/components/HiddenAdminButton/HiddenAdminButton.tsx` - **CRÍTICO:** Re-renderiza con logs en el cuerpo

### Páginas
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/layout.tsx`

### Servicios/APIs
- `apps/web/src/app/api/auth/me/route.ts`
- `apps/web/src/app/api/my-courses/route.ts`
- `apps/web/src/features/notifications/context/NotificationContext.tsx`

### Stores/Providers
- `apps/web/src/core/providers/SWRProvider.tsx`
- `apps/web/src/core/stores/authStore.ts` (si existe)

---

## ✅ CHECKLIST DE VALIDACIÓN GLOBAL

### Dashboard y Autenticación
- [ ] El dashboard carga en menos de 2 segundos
- [ ] Solo se hace 1 llamada a `/api/auth/me` durante la carga inicial
- [ ] Los componentes no se re-renderizan innecesariamente (verificar con React DevTools Profiler)
- [ ] No hay errores 404 en la consola
- [ ] Las notificaciones se cargan sin errores 503
- [ ] El estado de autenticación se comparte globalmente

### Performance Global
- [ ] **Todas las páginas** cargan en menos de 2.5 segundos
- [ ] Páginas estáticas cargan en menos de 1 segundo
- [ ] El tiempo total de carga (Finish) es menor a 3 segundos
- [ ] First Contentful Paint (FCP) < 1.0s
- [ ] Largest Contentful Paint (LCP) < 2.0s
- [ ] Time to Interactive (TTI) < 2.5s
- [ ] Total Blocking Time (TBT) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1

### Optimizaciones Técnicas
- [ ] Bundle size reducido en al menos 40%
- [ ] Todas las imágenes usan Next.js Image component
- [ ] Imágenes optimizadas (WebP/AVIF, lazy loading)
- [ ] Fuentes optimizadas (font-display: swap, preload)
- [ ] CSS purgado (solo clases usadas)
- [ ] APIs tienen cacheo apropiado
- [ ] Consultas de BD optimizadas (select específico)
- [ ] Code splitting implementado correctamente
- [ ] Dynamic imports para componentes pesados

### Métricas de Lighthouse
- [ ] Performance Score: > 90
- [ ] Accessibility Score: > 90
- [ ] Best Practices Score: > 90
- [ ] SEO Score: > 90
- [ ] Todos los Core Web Vitals en verde

### Funcionalidad
- [ ] No hay regresiones en funcionalidad existente
- [ ] Todos los tests pasan
- [ ] No hay errores en consola (producción)
- [ ] No hay warnings de React
- [ ] Navegación entre páginas es fluida (< 500ms)
- [ ] Loading states implementados correctamente
- [ ] Error boundaries funcionan correctamente

### Optimizaciones Adicionales
- [ ] Service worker implementado (opcional)
- [ ] Cacheo offline funcionando (opcional)
- [ ] Web Vitals monitoreados
- [ ] Bundle analyzer configurado
- [ ] Lighthouse CI configurado
- [ ] Logs de desarrollo deshabilitados en producción

### Testing
- [ ] Probado en Chrome, Firefox, Safari, Edge
- [ ] Probado en iOS y Android
- [ ] Probado en diferentes velocidades de red
- [ ] Probado con datos limitados (throttling)
- [ ] Probado en diferentes tamaños de pantalla

---

## 📊 RESUMEN EJECUTIVO

### Problema
La aplicación tiene tiempos de carga extremadamente lentos (22s en dashboard, 78s total) debido a:
- Llamadas HTTP redundantes (9+ llamadas a `/api/auth/me`)
- Re-renderizados excesivos (20+ renders de componentes)
- Falta de optimizaciones globales (imágenes, bundle, cacheo)

### Solución
Implementar optimizaciones globales en 6 fases durante 7 días:
1. **Fase 1:** Correcciones críticas de dashboard (Día 1)
2. **Fase 2:** Optimizaciones de API y datos (Día 2)
3. **Fase 3:** Optimizaciones de Next.js y build (Día 3)
4. **Fase 4:** Optimizaciones de assets (Día 4)
5. **Fase 5:** Optimizaciones de navegación (Día 5)
6. **Fase 6:** Optimizaciones avanzadas (Día 6-7)

### Resultados Esperados
- **Reducción de 85-90%** en tiempos de carga
- **Dashboard:** < 2 segundos (actualmente 22s)
- **Páginas estáticas:** < 1 segundo
- **Páginas dinámicas:** < 2.5 segundos
- **Bundle size:** Reducción de 40%+
- **Lighthouse Score:** > 90 en todas las categorías
- **Core Web Vitals:** Todos en verde

### ROI Esperado
- **Mejor experiencia de usuario:** Reducción de bounce rate
- **Mejor SEO:** Mejor ranking en Google
- **Mejor conversión:** Páginas más rápidas = más conversiones
- **Menor costo de servidor:** Menos solicitudes = menor carga

---

**Fecha de Creación:** 2024-12-07
**Última Actualización:** 2024-12-07
**Prioridad:** 🔴 CRÍTICA
**Tiempo Estimado de Implementación:** 7 días (con enfoque full-time)
**Impacto Esperado:** Reducción de 85-90% en tiempos de carga global
**Alcance:** Toda la aplicación (no solo dashboard)

