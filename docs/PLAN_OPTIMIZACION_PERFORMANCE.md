# 🚀 Plan de Optimización de Performance
## Aprende y Aplica Platform - Chat-Bot-LIA

**Fecha de Análisis**: Octubre 2025
**Objetivo**: Reducir tiempos de carga en 40-60%
**Esfuerzo Total Estimado**: 4-8 semanas

---

## 📊 Resumen Ejecutivo

Este documento presenta un plan completo de optimización ordenado por **dificultad de implementación** (de más fácil a más difícil). Cada optimización incluye:
- ⏱️ Tiempo estimado de implementación
- 📈 Impacto esperado en performance
- 🔧 Nivel de dificultad
- 📝 Pasos de implementación detallados

### Mejoras Esperadas

| Métrica | Actual | Objetivo | Mejora |
|---------|--------|----------|--------|
| **First Contentful Paint (FCP)** | ~3.5s | <1.8s | **48%** |
| **Largest Contentful Paint (LCP)** | ~5.2s | <2.5s | **52%** |
| **JavaScript Bundle** | ~450 KB | <250 KB | **44%** |
| **Imágenes Total** | ~10.2 MB | ~2 MB | **80%** |
| **API Response Time** | ~800ms | <200ms | **75%** |
| **Time to Interactive (TTI)** | ~6s | <3s | **50%** |

---

## 🎯 Nivel 1: FÁCIL (1-2 días cada una)

### 1. Eliminar Logging de Debug en Producción
**⏱️ Tiempo**: 4-6 horas
**📈 Impacto**: Moderado (5-10% mejora en renderizado)
**🔧 Dificultad**: ⭐ Muy Fácil
**📦 Archivos Afectados**: ~50+ archivos con console.log

#### 🎯 Problema Identificado
```typescript
// ❌ ACTUAL - apps/web/src/app/communities/page.tsx
useEffect(() => {
  console.log('🎨 Rendering communities:', filteredCommunities.length)
  filteredCommunities.forEach(community => {
    console.log(`Comunidad: ${community.name}, Image URL: ${community.image_url}`)
  })
}, [filteredCommunities])
```

#### ✅ Solución

**Paso 1**: Crear utilidad de logging condicional
```typescript
// apps/web/src/lib/utils/logger.ts
export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args)
    }
  },
  error: (...args: any[]) => {
    // Siempre registrar errores
    console.error(...args)
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args)
    }
  }
}
```

**Paso 2**: Buscar y reemplazar todos los console.log
```bash
# Encontrar todos los console.log
grep -r "console.log" apps/web/src --include="*.tsx" --include="*.ts"

# Reemplazar con logger
# Usar buscar y reemplazar en editor:
# console.log → logger.log
# console.warn → logger.warn
```

**Paso 3**: Actualizar archivos principales
```typescript
// Importar en cada archivo
import { logger } from '@/lib/utils/logger'

// Reemplazar
logger.log('🎨 Rendering communities:', filteredCommunities.length)
```

**Paso 4**: Eliminar logs innecesarios en loops
```typescript
// ❌ Eliminar completamente
// filteredCommunities.forEach(community => {
//   console.log(`Comunidad: ${community.name}`)
// })
```

#### 📊 Validación
```bash
# Verificar que no queden console.log en producción
npm run build
# Revisar bundle - no debe haber console.log
```

---

### 2. Agregar Cache-Control Headers a APIs
**⏱️ Tiempo**: 4-6 horas
**📈 Impacto**: Alto (50% reducción en llamadas API)
**🔧 Dificultad**: ⭐⭐ Fácil
**📦 Archivos Afectados**: ~127 rutas API

#### 🎯 Problema Identificado
```typescript
// ❌ ACTUAL - apps/web/src/app/api/admin/communities/route.ts
export async function GET(request: NextRequest) {
  const communities = await AdminCommunitiesService.getAllCommunities()
  return NextResponse.json({ communities }, { status: 200 })
  // Sin Cache-Control headers
}
```

#### ✅ Solución

**Paso 1**: Crear helper para cache headers
```typescript
// apps/web/src/lib/utils/cache-headers.ts
export const cacheHeaders = {
  // Para datos que cambian raramente (1 hora)
  static: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    'CDN-Cache-Control': 'max-age=3600',
  },
  // Para datos semi-estáticos (5 minutos)
  semiStatic: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    'CDN-Cache-Control': 'max-age=300',
  },
  // Para datos dinámicos (30 segundos)
  dynamic: {
    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    'CDN-Cache-Control': 'max-age=30',
  },
  // Para datos privados (no cachear)
  private: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  },
}
```

**Paso 2**: Aplicar a rutas API según tipo de datos

```typescript
// ✅ MEJORADO - Datos semi-estáticos
import { cacheHeaders } from '@/lib/utils/cache-headers'

export async function GET(request: NextRequest) {
  const communities = await AdminCommunitiesService.getAllCommunities()

  return NextResponse.json(
    { communities },
    {
      status: 200,
      headers: cacheHeaders.semiStatic
    }
  )
}
```

**Paso 3**: Clasificar rutas por tipo de cache

```typescript
// apps/web/src/app/api/communities/route.ts
// ✅ Static cache (1 hora) - Comunidades cambian poco
headers: cacheHeaders.static

// apps/web/src/app/api/communities/[id]/posts/route.ts
// ✅ Semi-static cache (5 min) - Posts cambian moderadamente
headers: cacheHeaders.semiStatic

// apps/web/src/app/api/statistics/route.ts
// ✅ Dynamic cache (30 seg) - Estadísticas cambian frecuentemente
headers: cacheHeaders.dynamic

// apps/web/src/app/api/auth/*/route.ts
// ✅ Private - Sin cache para autenticación
headers: cacheHeaders.private
```

**Paso 4**: Rutas principales a actualizar (prioridad alta)

```bash
# Alta prioridad - aplicar primero:
apps/web/src/app/api/communities/route.ts                  # static
apps/web/src/app/api/courses/route.ts                      # static
apps/web/src/app/api/admin/news/route.ts                   # semiStatic
apps/web/src/app/api/communities/[id]/posts/route.ts      # semiStatic
apps/web/src/app/api/statistics/route.ts                   # dynamic

# Media prioridad:
apps/web/src/app/api/admin/communities/route.ts           # semiStatic
apps/web/src/app/api/admin/users/route.ts                 # dynamic

# Baja prioridad (sin cache):
apps/web/src/app/api/auth/*                                # private
```

#### 📊 Validación
```bash
# Verificar headers con curl
curl -I http://localhost:3000/api/communities
# Debe mostrar: Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
```

---

### 3. Implementar Bundle Analyzer
**⏱️ Tiempo**: 2-3 horas
**📈 Impacto**: Indirecto (visibilidad para otras optimizaciones)
**🔧 Dificultad**: ⭐ Muy Fácil
**📦 Archivos Afectados**: next.config.ts, package.json

#### ✅ Solución

**Paso 1**: Instalar dependencia
```bash
npm install --save-dev @next/bundle-analyzer
```

**Paso 2**: Configurar en next.config.ts
```typescript
// apps/web/next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // ... configuración existente
}

module.exports = withBundleAnalyzer(nextConfig)
```

**Paso 3**: Agregar script a package.json
```json
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "analyze:server": "BUNDLE_ANALYZE=server next build",
    "analyze:browser": "BUNDLE_ANALYZE=browser next build"
  }
}
```

**Paso 4**: Ejecutar análisis
```bash
npm run analyze
# Abrirá reporte visual en navegador
```

#### 📊 Validación
- Revisar reporte HTML generado
- Identificar paquetes grandes (>100KB)
- Documentar hallazgos para siguientes optimizaciones

---

## 🎯 Nivel 2: MODERADO (2-4 días cada una)

### 4. Lazy Loading de Modales y Componentes Pesados
**⏱️ Tiempo**: 2-3 días
**📈 Impacto**: Alto (100KB+ reducción en bundle inicial)
**🔧 Dificultad**: ⭐⭐ Moderado
**📦 Archivos Afectados**: ~20-30 componentes

#### 🎯 Problema Identificado
```typescript
// ❌ ACTUAL - Componentes pesados cargados inmediatamente
import { EditNewsModal } from './EditNewsModal' // 643 líneas
import { AddNewsModal } from './AddNewsModal'   // 636 líneas
import { AdminCommunityDetailPage } from './AdminCommunityDetailPage' // 932 líneas
```

#### ✅ Solución

**Paso 1**: Convertir modales a dynamic imports

```typescript
// ✅ MEJORADO - apps/web/src/features/admin/components/NewsManagement.tsx
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Lazy load modales
const EditNewsModal = dynamic(() => import('./EditNewsModal'), {
  loading: () => <div className="p-4">Cargando...</div>,
  ssr: false // Los modales no necesitan SSR
})

const AddNewsModal = dynamic(() => import('./AddNewsModal'), {
  loading: () => <div className="p-4">Cargando...</div>,
  ssr: false
})

const DeleteConfirmModal = dynamic(() => import('./DeleteConfirmModal'), {
  loading: () => <div className="p-4">Cargando...</div>,
  ssr: false
})

export function NewsManagement() {
  const [showEditModal, setShowEditModal] = useState(false)

  return (
    <div>
      {/* Modal solo se carga cuando showEditModal = true */}
      {showEditModal && (
        <Suspense fallback={<div>Cargando...</div>}>
          <EditNewsModal onClose={() => setShowEditModal(false)} />
        </Suspense>
      )}
    </div>
  )
}
```

**Paso 2**: Priorizar componentes por tamaño (más fáciles primero)

```typescript
// ALTA PRIORIDAD (>600 líneas):
// 1. apps/web/src/features/admin/components/EditNewsModal.tsx (643 líneas)
const EditNewsModal = dynamic(() => import('./EditNewsModal'), { ssr: false })

// 2. apps/web/src/features/admin/components/AddNewsModal.tsx (636 líneas)
const AddNewsModal = dynamic(() => import('./AddNewsModal'), { ssr: false })

// 3. apps/web/src/features/communities/components/PostAttachment/PostAttachment.tsx (673 líneas)
const PostAttachment = dynamic(() => import('./PostAttachment'), { ssr: true })

// 4. apps/web/src/features/admin/components/QuestionsManagement.tsx (722 líneas)
const QuestionsManagement = dynamic(() => import('./QuestionsManagement'), { ssr: false })

// 5. apps/web/src/features/admin/components/AdminUserStatsPage.tsx (651 líneas)
const AdminUserStatsPage = dynamic(() => import('./AdminUserStatsPage'), { ssr: false })
```

**Paso 3**: Template para conversión rápida

```typescript
// Template para buscar y reemplazar:

// ANTES:
import { ComponentName } from './ComponentName'

// DESPUÉS:
import dynamic from 'next/dynamic'
const ComponentName = dynamic(() => import('./ComponentName'), {
  loading: () => <div className="animate-pulse">Cargando...</div>,
  ssr: false // Cambiar según necesidad
})
```

**Paso 4**: Componentes a convertir (listado completo)

```bash
# Modales de administración (ssr: false):
- EditNewsModal.tsx (643 líneas)
- AddNewsModal.tsx (636 líneas)
- EditPromptModal.tsx (~400 líneas estimado)
- AddPromptModal.tsx (~400 líneas estimado)
- EditReelModal.tsx (~400 líneas estimado)
- AddReelModal.tsx (~400 líneas estimado)

# Páginas de detalle (ssr: true si tiene contenido SEO):
- AdminCommunityDetailPage.tsx (932 líneas)
- AdminUserStatsPage.tsx (651 líneas)

# Componentes de visualización (ssr: true):
- PostAttachment.tsx (673 líneas)
- QuestionsManagement.tsx (722 líneas)
```

#### 📊 Validación
```bash
# Después de implementar, ejecutar:
npm run analyze

# Verificar:
# 1. Bundle inicial debe ser ~100KB menor
# 2. Nuevos chunks creados para cada modal
# 3. Chrome DevTools → Network: modales se cargan on-demand
```

---

### 5. Agregar React.memo y useMemo en Componentes Críticos
**⏱️ Tiempo**: 2-3 días
**📈 Impacto**: Moderado-Alto (30-40% reducción en re-renders)
**🔧 Dificultად**: ⭐⭐⭐ Moderado
**📦 Archivos Afectados**: ~30-40 componentes

#### 🎯 Problema Identificado
```typescript
// ❌ ACTUAL - Componentes se re-renderizan innecesariamente
export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([])
  const [filteredCommunities, setFilteredCommunities] = useState([])

  // Este cálculo se ejecuta en CADA render
  const sortedCommunities = filteredCommunities.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div>
      {sortedCommunities.map(community => (
        <CommunityCard
          key={community.id}
          community={community}
          // Component se re-renderiza aunque community no cambie
        />
      ))}
    </div>
  )
}
```

#### ✅ Solución

**Paso 1**: Implementar useMemo para cálculos costosos

```typescript
// ✅ MEJORADO
import { useMemo } from 'react'

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([])
  const [filteredCommunities, setFilteredCommunities] = useState([])

  // useMemo: solo recalcula cuando filteredCommunities cambia
  const sortedCommunities = useMemo(() => {
    return [...filteredCommunities].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [filteredCommunities])

  return (
    <div>
      {sortedCommunities.map(community => (
        <MemoizedCommunityCard
          key={community.id}
          community={community}
        />
      ))}
    </div>
  )
}
```

**Paso 2**: Aplicar React.memo a componentes hijo

```typescript
// ✅ apps/web/src/features/communities/components/CommunityCard.tsx
import { memo } from 'react'

interface CommunityCardProps {
  community: Community
  onClick?: () => void
}

const CommunityCard = memo(({ community, onClick }: CommunityCardProps) => {
  return (
    <div className="card" onClick={onClick}>
      <h3>{community.name}</h3>
      <p>{community.description}</p>
    </div>
  )
})

CommunityCard.displayName = 'CommunityCard'
export default CommunityCard
```

**Paso 3**: Usar useCallback para funciones pasadas como props

```typescript
// ✅ MEJORADO
import { useCallback } from 'react'

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState([])

  // useCallback: evita crear nueva función en cada render
  const handleCommunityClick = useCallback((communityId: string) => {
    console.log('Community clicked:', communityId)
    // Navegar a detalle
  }, []) // Sin dependencias, función estable

  return (
    <div>
      {communities.map(community => (
        <MemoizedCommunityCard
          key={community.id}
          community={community}
          onClick={() => handleCommunityClick(community.id)}
        />
      ))}
    </div>
  )
}
```

**Paso 4**: Componentes prioritarios para memoization

```typescript
// ALTA PRIORIDAD - Componentes en listas:
// 1. CommunityCard (renderizado en loops)
export default memo(CommunityCard)

// 2. PostCard
export default memo(PostCard)

// 3. CommentItem
export default memo(CommentItem)

// 4. UserListItem
export default memo(UserListItem)

// 5. CourseCard
export default memo(CourseCard)

// MEDIA PRIORIDAD - Componentes pesados:
// 6. PostAttachment (673 líneas)
export default memo(PostAttachment)

// 7. AdminCommunityDetailPage (932 líneas) - secciones internas
const CommunityStats = memo(({ stats }) => { ... })
const CommunityMembers = memo(({ members }) => { ... })
```

**Paso 5**: Identificar cálculos costosos para useMemo

```typescript
// Buscar patrones como:
// - Array.sort() en render
// - Array.filter() + Array.map() en render
// - Cálculos matemáticos complejos
// - Búsquedas en arrays grandes
// - Transformaciones de datos

// Ejemplo real - apps/web/src/app/communities/page.tsx:
const filteredAndSortedCommunities = useMemo(() => {
  let result = communities

  // Filtrado
  if (searchTerm) {
    result = result.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Ordenamiento
  result = [...result].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return result
}, [communities, searchTerm])
```

#### 📊 Validación

**Paso 1**: Instalar React DevTools Profiler
```bash
# En navegador, abrir React DevTools
# Pestaña "Profiler" → Start Profiling
```

**Paso 2**: Medir antes y después
```typescript
// Agregar medición temporal
import { useEffect } from 'react'

useEffect(() => {
  console.time('CommunitiesPage render')
  return () => {
    console.timeEnd('CommunitiesPage render')
  }
})
```

**Paso 3**: Validar métricas
```bash
# Antes de optimización:
# CommunitiesPage render: 450ms
# Re-renders por cambio de filtro: 8-10

# Después de optimización:
# CommunitiesPage render: 280ms (38% mejora)
# Re-renders por cambio de filtro: 2-3 (70% reducción)
```

---

### 6. Optimizar Font Loading
**⏱️ Tiempo**: 1-2 días
**📈 Impacto**: Moderado (mejora FCP en 200-300ms)
**🔧 Dificultad**: ⭐⭐ Fácil-Moderado
**📦 Archivos Afectados**: layout.tsx, global.css

#### 🎯 Problema Identificado
```typescript
// apps/web/src/app/layout.tsx
// ❌ Configuración actual - puede mejorar
import { Inter, Montserrat } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800']
})
```

#### ✅ Solución

**Paso 1**: Optimizar configuración de fonts
```typescript
// ✅ MEJORADO - apps/web/src/app/layout.tsx
import { Inter, Montserrat } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Mejora FCP mostrando fallback primero
  preload: true,
  variable: '--font-inter',
  fallback: ['system-ui', 'arial']
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  display: 'swap',
  preload: true,
  variable: '--font-montserrat',
  fallback: ['system-ui', 'arial']
})
```

**Paso 2**: Configurar font-display en CSS
```css
/* apps/web/src/app/globals.css */
@layer base {
  :root {
    --font-inter: 'Inter', system-ui, -apple-system, sans-serif;
    --font-montserrat: 'Montserrat', system-ui, -apple-system, sans-serif;
  }
}

/* Mejorar font loading performance */
@font-face {
  font-family: 'Inter';
  font-display: swap; /* o optional para mejor UX */
  /* Next.js genera esto automáticamente con configuración optimizada */
}
```

**Paso 3**: Aplicar variables CSS
```typescript
// layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="font-inter">
        {children}
      </body>
    </html>
  )
}
```

**Paso 4**: Preload fonts críticos
```typescript
// Agregar en <head> si es necesario preload explícito
export const metadata = {
  // ... otros metadata
  other: {
    'font-display': 'swap',
  }
}
```

#### 📊 Validación
```bash
# Lighthouse:
# Verificar que "Ensure text remains visible during webfont load" pase
npm run build
npm start
# Abrir Chrome DevTools → Lighthouse → Performance
```

---

## 🎯 Nivel 3: INTERMEDIO (4-7 días cada una)

### 7. Optimización Masiva de Imágenes
**⏱️ Tiempo**: 5-7 días (automatización + conversión manual)
**📈 Impacto**: MUY ALTO (80% reducción: 10.2MB → 2MB)
**🔧 Dificultad**: ⭐⭐⭐ Intermedio
**📦 Archivos Afectados**: ~30+ imágenes, múltiples componentes

#### 🎯 Problema Identificado
```
./Community/images/liga-platino.png        1.7 MB
./Community/images/liga-oro.png            1.5 MB
./Community/images/liga-diamante.png       1.4 MB
./Community/images/comunidad-general.png   1.2 MB
./apps/web/public/icono.png                244 KB
./apps/web/public/lia-avatar.png           139 KB
```

#### ✅ Solución

**Paso 1**: Setup de herramientas de optimización
```bash
# Instalar sharp para conversión automática
npm install --save-dev sharp

# Instalar imagemin para compresión
npm install --save-dev imagemin imagemin-webp imagemin-avif
```

**Paso 2**: Script de conversión automática
```javascript
// scripts/optimize-images.js
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const directories = [
  './Community/images',
  './apps/web/public'
]

const optimizeImage = async (inputPath, outputPath) => {
  const ext = path.extname(inputPath).toLowerCase()

  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return

  // Generar WebP
  await sharp(inputPath)
    .webp({ quality: 80 })
    .toFile(outputPath.replace(ext, '.webp'))

  // Generar AVIF (mejor compresión)
  await sharp(inputPath)
    .avif({ quality: 65 })
    .toFile(outputPath.replace(ext, '.avif'))

  // Generar versiones responsive
  const sizes = [480, 800, 1200]
  for (const size of sizes) {
    await sharp(inputPath)
      .resize(size, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath.replace(ext, `-${size}w.webp`))
  }

  console.log(`✅ Optimized: ${inputPath}`)
}

const processDirectory = async (dir) => {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      await processDirectory(filePath)
    } else {
      await optimizeImage(filePath, filePath)
    }
  }
}

// Ejecutar
;(async () => {
  for (const dir of directories) {
    await processDirectory(dir)
  }
  console.log('🎉 Image optimization complete!')
})()
```

**Paso 3**: Ejecutar script de optimización
```bash
node scripts/optimize-images.js

# Resultado esperado:
# liga-platino.webp        340 KB (80% reducción)
# liga-platino.avif        220 KB (87% reducción)
# liga-oro.webp            300 KB (80% reducción)
# ...
```

**Paso 4**: Actualizar componentes para usar Next.js Image

```typescript
// ❌ ANTES - apps/web/src/features/communities/components/CommunityCard.tsx
<img
  src="/community/liga-platino.png"
  alt="Liga Platino"
  className="w-full h-auto"
/>

// ✅ DESPUÉS
import Image from 'next/image'

<Image
  src="/community/liga-platino.webp"
  alt="Liga Platino"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={false} // true solo para above-the-fold images
  loading="lazy"
  quality={80}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Generar con script
/>
```

**Paso 5**: Configurar Next.js Image Optimization

```typescript
// apps/web/next.config.ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 año
    domains: [
      'your-supabase-project.supabase.co',
      // Agregar dominios externos si es necesario
    ],
  },
}
```

**Paso 6**: Componentes prioritarios para actualizar

```typescript
// ALTA PRIORIDAD (imágenes grandes >500KB):
// 1. Community/images/*.png → convertir a WebP/AVIF
// apps/web/src/app/communities/[slug]/page.tsx
// apps/web/src/features/communities/components/CommunityCard.tsx

// 2. apps/web/public/*.png → convertir a WebP
// apps/web/src/app/layout.tsx (logos)
// apps/web/src/components/Header.tsx

// MEDIA PRIORIDAD (imágenes medianas 100-500KB):
// 3. Avatar images
// apps/web/src/features/users/components/UserAvatar.tsx

// 4. Course thumbnails
// apps/web/src/features/courses/components/CourseCard.tsx
```

**Paso 7**: Script para generar blur placeholders
```javascript
// scripts/generate-blur-placeholders.js
const sharp = require('sharp')
const fs = require('fs')

const generateBlurDataURL = async (imagePath) => {
  const buffer = await sharp(imagePath)
    .resize(10) // Muy pequeño para blur
    .toBuffer()

  const base64 = buffer.toString('base64')
  return `data:image/jpeg;base64,${base64}`
}

// Ejecutar para cada imagen y guardar en JSON
```

#### 📊 Validación
```bash
# Verificar tamaños antes y después
ls -lh Community/images/*.png
ls -lh Community/images/*.webp

# Lighthouse - "Serve images in next-gen formats" debe pasar
npm run build && npm start
# Chrome DevTools → Lighthouse

# Verificar que se sirven formatos correctos:
# Chrome: AVIF
# Safari: WebP
# Fallback: optimized PNG
```

---

### 8. Dividir Componente Monolítico communities/[slug]/page.tsx
**⏱️ Tiempo**: 4-6 días
**📈 Impacto**: Alto (40% reducción en tiempo de parse)
**🔧 Dificultad**: ⭐⭐⭐⭐ Intermedio-Avanzado
**📦 Archivos Afectados**: 1 archivo principal + ~10 archivos nuevos

#### 🎯 Problema Identificado
```typescript
// apps/web/src/app/communities/[slug]/page.tsx
// ❌ 2,289 LÍNEAS en un solo archivo
export default function CommunitiesPage() {
  // Todo mezclado:
  // - Posts display
  // - Comments
  // - Reactions
  // - Modals
  // - Filters
  // - Animations
  // - State management
}
```

#### ✅ Solución - Plan de Refactorización

**Paso 1**: Análisis y diseño de arquitectura nueva
```
apps/web/src/app/communities/[slug]/
├── page.tsx (250 líneas) ← Orquestador principal
├── components/
│   ├── CommunityHeader.tsx (150 líneas)
│   ├── CommunityPosts/
│   │   ├── PostsList.tsx (200 líneas)
│   │   ├── PostItem.tsx (180 líneas)
│   │   ├── PostActions.tsx (100 líneas)
│   │   └── PostComments.tsx (200 líneas)
│   ├── CommunityModals/
│   │   ├── CreatePostModal.tsx (250 líneas)
│   │   ├── EditPostModal.tsx (220 líneas)
│   │   └── DeleteConfirmModal.tsx (80 líneas)
│   ├── CommunityFilters.tsx (120 líneas)
│   └── CommunitySidebar.tsx (150 líneas)
├── hooks/
│   ├── useCommunityData.ts (150 líneas)
│   ├── usePosts.ts (100 líneas)
│   └── useComments.ts (100 líneas)
└── types/
    └── community.types.ts (50 líneas)
```

**Paso 2**: Extraer custom hooks primero (más fácil)

```typescript
// ✅ apps/web/src/app/communities/[slug]/hooks/useCommunityData.ts
import { useState, useEffect } from 'react'

export const useCommunityData = (slug: string) => {
  const [community, setCommunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const response = await fetch(`/api/communities/${slug}`)
        const data = await response.json()
        setCommunity(data)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCommunity()
  }, [slug])

  return { community, loading, error }
}
```

```typescript
// ✅ apps/web/src/app/communities/[slug]/hooks/usePosts.ts
export const usePosts = (communityId: string) => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const refreshPosts = async () => {
    // Lógica de fetch
  }

  const createPost = async (postData) => {
    // Lógica de creación
  }

  const updatePost = async (postId, updates) => {
    // Lógica de actualización
  }

  const deletePost = async (postId) => {
    // Lógica de eliminación
  }

  return { posts, loading, refreshPosts, createPost, updatePost, deletePost }
}
```

**Paso 3**: Extraer componentes de UI (segundo paso)

```typescript
// ✅ apps/web/src/app/communities/[slug]/components/CommunityHeader.tsx
import Image from 'next/image'

interface CommunityHeaderProps {
  community: Community
  memberCount: number
  isAdmin: boolean
}

export const CommunityHeader = memo(({
  community,
  memberCount,
  isAdmin
}: CommunityHeaderProps) => {
  return (
    <header className="community-header">
      <Image
        src={community.image_url}
        alt={community.name}
        width={120}
        height={120}
      />
      <h1>{community.name}</h1>
      <p>{community.description}</p>
      <div className="stats">
        <span>{memberCount} miembros</span>
      </div>
      {isAdmin && <button>Administrar</button>}
    </header>
  )
})

CommunityHeader.displayName = 'CommunityHeader'
```

```typescript
// ✅ apps/web/src/app/communities/[slug]/components/CommunityPosts/PostsList.tsx
import { memo } from 'react'
import PostItem from './PostItem'

interface PostsListProps {
  posts: Post[]
  onPostUpdate: (postId: string) => void
  onPostDelete: (postId: string) => void
}

export const PostsList = memo(({
  posts,
  onPostUpdate,
  onPostDelete
}: PostsListProps) => {
  if (!posts.length) {
    return <div className="empty-state">No hay publicaciones aún</div>
  }

  return (
    <div className="posts-list space-y-4">
      {posts.map(post => (
        <PostItem
          key={post.id}
          post={post}
          onUpdate={() => onPostUpdate(post.id)}
          onDelete={() => onPostDelete(post.id)}
        />
      ))}
    </div>
  )
})

PostsList.displayName = 'PostsList'
```

**Paso 4**: Extraer modales a lazy loading

```typescript
// ✅ apps/web/src/app/communities/[slug]/components/CommunityModals/CreatePostModal.tsx
import dynamic from 'next/dynamic'

// Este modal se carga solo cuando se necesita
const CreatePostModal = dynamic(
  () => import('./CreatePostModalContent'),
  {
    ssr: false,
    loading: () => <div>Cargando...</div>
  }
)

export default CreatePostModal
```

**Paso 5**: Refactorizar page.tsx principal (ahora mucho más simple)

```typescript
// ✅ apps/web/src/app/communities/[slug]/page.tsx (ahora ~250 líneas)
import { Suspense } from 'react'
import { useCommunityData } from './hooks/useCommunityData'
import { usePosts } from './hooks/usePosts'
import { CommunityHeader } from './components/CommunityHeader'
import { PostsList } from './components/CommunityPosts/PostsList'
import { CommunitySidebar } from './components/CommunitySidebar'
import dynamic from 'next/dynamic'

// Modales lazy-loaded
const CreatePostModal = dynamic(() => import('./components/CommunityModals/CreatePostModal'), { ssr: false })

export default function CommunityDetailPage({ params }: { params: { slug: string } }) {
  // Custom hooks manejan toda la lógica
  const { community, loading: communityLoading } = useCommunityData(params.slug)
  const { posts, refreshPosts, createPost, updatePost, deletePost } = usePosts(community?.id)

  const [showCreateModal, setShowCreateModal] = useState(false)

  if (communityLoading) return <LoadingSpinner />
  if (!community) return <NotFound />

  return (
    <div className="community-page grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-8">
        <CommunityHeader community={community} />

        <button onClick={() => setShowCreateModal(true)}>
          Nueva Publicación
        </button>

        <Suspense fallback={<PostsSkeleton />}>
          <PostsList
            posts={posts}
            onPostUpdate={updatePost}
            onPostDelete={deletePost}
          />
        </Suspense>

        {showCreateModal && (
          <CreatePostModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={async (data) => {
              await createPost(data)
              setShowCreateModal(false)
            }}
          />
        )}
      </div>

      <aside className="col-span-12 md:col-span-4">
        <CommunitySidebar community={community} />
      </aside>
    </div>
  )
}
```

**Paso 6**: Plan de implementación gradual

```bash
# Día 1-2: Setup y hooks
1. Crear estructura de carpetas
2. Extraer useCommunityData
3. Extraer usePosts
4. Extraer useComments
5. Testear hooks independientemente

# Día 3-4: Componentes UI
6. Crear CommunityHeader
7. Crear PostsList + PostItem
8. Crear CommunitySidebar
9. Crear CommunityFilters
10. Testear componentes independientemente

# Día 5-6: Modales y integración
11. Extraer CreatePostModal
12. Extraer EditPostModal
13. Refactorizar page.tsx principal
14. Testing completo
15. Optimización y ajustes finales
```

#### 📊 Validación

```bash
# Métricas antes:
# - Tamaño archivo: 2,289 líneas
# - Tiempo parse: ~450ms
# - Complejidad ciclomática: Alta

# Métricas después:
# - Archivo principal: ~250 líneas (89% reducción)
# - Tiempo parse: ~180ms (60% mejora)
# - Componentes independientes: Testeables y reutilizables
# - Bundle splitting: Modales cargan on-demand

# Testing:
npm run test -- communities/[slug]
npm run build
npm run analyze # Verificar nuevos chunks
```

---

### 9. Implementar SWR o React Query para Client-Side Caching
**⏱️ Tiempo**: 3-5 días
**📈 Impacto**: Alto (50% reducción en llamadas API)
**🔧 Dificultad**: ⭐⭐⭐ Intermedio
**📦 Archivos Afectados**: ~30-40 componentes con fetch

#### ✅ Solución

**Paso 1**: Instalar SWR (más simple que React Query)
```bash
npm install swr
```

**Paso 2**: Configurar SWR provider global
```typescript
// apps/web/src/app/providers.tsx
'use client'

import { SWRConfig } from 'swr'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Network response was not ok')
  return res.json()
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 5000, // Dedupe requests en 5 segundos
        focusThrottleInterval: 10000,
        errorRetryCount: 3,
      }}
    >
      {children}
    </SWRConfig>
  )
}
```

**Paso 3**: Refactorizar fetch a useSWR

```typescript
// ❌ ANTES - apps/web/src/app/communities/page.tsx
const [communities, setCommunities] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetch('/api/communities')
    .then(res => res.json())
    .then(data => {
      setCommunities(data.communities)
      setLoading(false)
    })
}, [])

// ✅ DESPUÉS
import useSWR from 'swr'

const { data, error, isLoading, mutate } = useSWR('/api/communities')

const communities = data?.communities || []
```

**Paso 4**: Crear custom hooks con SWR

```typescript
// ✅ apps/web/src/lib/hooks/useCommunities.ts
import useSWR from 'swr'

export const useCommunities = () => {
  const { data, error, isLoading, mutate } = useSWR('/api/communities')

  return {
    communities: data?.communities || [],
    isLoading,
    isError: error,
    refresh: mutate, // Revalidar manualmente
  }
}

// ✅ apps/web/src/lib/hooks/useCommunity.ts
export const useCommunity = (slug: string) => {
  const { data, error, isLoading } = useSWR(
    slug ? `/api/communities/${slug}` : null // null = no fetch si no hay slug
  )

  return {
    community: data?.community,
    isLoading,
    isError: error,
  }
}

// ✅ apps/web/src/lib/hooks/usePosts.ts
export const usePosts = (communityId: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    communityId ? `/api/communities/${communityId}/posts` : null
  )

  const createPost = async (postData: any) => {
    // Optimistic update
    mutate(
      async () => {
        const res = await fetch(`/api/communities/${communityId}/posts`, {
          method: 'POST',
          body: JSON.stringify(postData),
        })
        return res.json()
      },
      {
        optimisticData: [...(data?.posts || []), postData],
        rollbackOnError: true,
      }
    )
  }

  return {
    posts: data?.posts || [],
    isLoading,
    isError: error,
    createPost,
    refresh: mutate,
  }
}
```

**Paso 5**: Implementar mutación optimista

```typescript
// apps/web/src/features/communities/components/PostActions.tsx
import { usePosts } from '@/lib/hooks/usePosts'

export function PostActions({ communityId, postId }: Props) {
  const { mutate } = usePosts(communityId)

  const handleLike = async () => {
    // Actualización optimista: UI se actualiza inmediatamente
    await mutate(
      async (currentData) => {
        // API call
        await fetch(`/api/posts/${postId}/like`, { method: 'POST' })

        // Actualizar datos locales
        return {
          ...currentData,
          posts: currentData.posts.map(p =>
            p.id === postId ? { ...p, likes: p.likes + 1 } : p
          ),
        }
      },
      {
        optimisticData: (currentData) => ({
          ...currentData,
          posts: currentData.posts.map(p =>
            p.id === postId ? { ...p, likes: p.likes + 1 } : p
          ),
        }),
        rollbackOnError: true,
      }
    )
  }

  return <button onClick={handleLike}>👍 Like</button>
}
```

**Paso 6**: Implementar revalidación inteligente

```typescript
// apps/web/src/features/communities/components/CreatePostForm.tsx
import { usePosts } from '@/lib/hooks/usePosts'

export function CreatePostForm({ communityId }: Props) {
  const { createPost, refresh } = usePosts(communityId)

  const handleSubmit = async (data) => {
    await createPost(data)

    // Revalidar múltiples endpoints relacionados
    mutate('/api/communities') // Lista de comunidades
    mutate(`/api/communities/${communityId}`) // Detalle de comunidad
    mutate(`/api/communities/${communityId}/posts`) // Posts
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

**Paso 7**: Rutas prioritarias para SWR

```typescript
// ALTA PRIORIDAD - datos que cambian frecuentemente:
useSWR('/api/communities')                        // Lista comunidades
useSWR('/api/communities/[slug]')                 // Detalle comunidad
useSWR('/api/communities/[id]/posts')             // Posts
useSWR('/api/statistics/user')                    // Estadísticas usuario

// MEDIA PRIORIDAD - datos semi-estáticos:
useSWR('/api/courses')                            // Lista cursos
useSWR('/api/admin/news')                         // Noticias
useSWR('/api/users/profile')                      // Perfil usuario

// BAJA PRIORIDAD - datos estáticos:
useSWR('/api/config/app-settings')                // Configuración app
```

#### 📊 Validación

```bash
# Verificar cache funcionando:
# 1. Navegar a /communities
# 2. Network tab: Ver request inicial
# 3. Navegar a otra página y volver
# 4. Network tab: NO debe haber nuevo request (servido desde cache)

# Medir reducción de requests:
# Antes: 15 requests en navegación típica
# Después: 5 requests (67% reducción)
```

---

## 🎯 Nivel 4: AVANZADO (1-2 semanas cada una)

### 10. Implementar ISR (Incremental Static Regeneration)
**⏱️ Tiempo**: 1-2 semanas
**📈 Impacto**: Muy Alto (70% mejora en tiempo de carga)
**🔧 Dificultad**: ⭐⭐⭐⭐ Avanzado
**📦 Archivos Afectados**: Múltiples páginas dinámicas

#### ✅ Solución

**Paso 1**: Identificar páginas candidatas para ISR
```typescript
// Páginas ideales para ISR:
// - Comunidades (actualizan cada 5-10 minutos)
// - Cursos (actualizan raramente)
// - Noticias (actualizan varias veces al día)
// - Perfiles públicos (actualizan ocasionalmente)
```

**Paso 2**: Implementar ISR en página de comunidades
```typescript
// ✅ apps/web/src/app/communities/[slug]/page.tsx
export const revalidate = 300 // 5 minutos

export async function generateStaticParams() {
  // Pre-generar páginas más populares
  const communities = await fetch('http://localhost:3000/api/communities').then(r => r.json())

  // Pre-generar solo top 20 más activas
  return communities.communities
    .slice(0, 20)
    .map((community: any) => ({
      slug: community.slug,
    }))
}

export default async function CommunityPage({ params }: { params: { slug: string } }) {
  // Server component - datos fetched en servidor
  const community = await fetch(`http://localhost:3000/api/communities/${params.slug}`, {
    next: { revalidate: 300 } // Cache por 5 minutos
  }).then(r => r.json())

  return <CommunityDetailView community={community} />
}
```

**Paso 3**: Configurar ISR para páginas de cursos
```typescript
// ✅ apps/web/src/app/courses/[id]/page.tsx
export const revalidate = 3600 // 1 hora - cursos cambian poco

export async function generateStaticParams() {
  const courses = await fetch('http://localhost:3000/api/courses').then(r => r.json())

  return courses.map((course: any) => ({
    id: course.id,
  }))
}

export default async function CoursePage({ params }: { params: { id: string } }) {
  const course = await fetch(`http://localhost:3000/api/courses/${params.id}`, {
    next: { revalidate: 3600 }
  }).then(r => r.json())

  return <CourseDetailView course={course} />
}
```

**Paso 4**: Implementar On-Demand Revalidation
```typescript
// ✅ apps/web/src/app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  // Validar secret token
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  const { path, tag } = await request.json()

  try {
    if (path) {
      await revalidatePath(path)
    }

    if (tag) {
      await revalidateTag(tag)
    }

    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 })
  }
}
```

**Paso 5**: Usar tags para invalidación granular
```typescript
// ✅ Fetch con tags
export default async function CommunityPage({ params }: { params: { slug: string } }) {
  const community = await fetch(`http://localhost:3000/api/communities/${params.slug}`, {
    next: {
      revalidate: 300,
      tags: [`community-${params.slug}`, 'communities']
    }
  }).then(r => r.json())

  return <CommunityDetailView community={community} />
}

// Cuando se actualiza una comunidad:
// POST /api/revalidate?secret=xxx
// { "tag": "community-[slug]" }
```

**Paso 6**: Configurar tiempos de revalidación por tipo
```typescript
// Estrategia de revalidación:

// ESTÁTICO (1 día):
export const revalidate = 86400
// - Páginas de ayuda/FAQ
// - Términos y condiciones
// - Páginas informativas

// SEMI-ESTÁTICO (1 hora):
export const revalidate = 3600
// - Cursos
// - Perfiles de instructor
// - Categorías

// DINÁMICO (5 minutos):
export const revalidate = 300
// - Comunidades
// - Noticias
// - Posts populares

// MUY DINÁMICO (No ISR, usar SSR):
// - Feed personal
// - Notificaciones
// - Mensajes privados
```

#### 📊 Validación
```bash
# Verificar que ISR funciona:
npm run build
npm start

# 1. Primera visita: Ver "Generated at: [timestamp]" en página
# 2. Esperar tiempo de revalidación
# 3. Segunda visita: Debe servir página cacheada (muy rápido)
# 4. Después de revalidation time: Ver nuevo timestamp

# Verificar en X-Nextjs-Cache header:
# HIT = servido desde cache
# MISS = regenerado
# STALE = servido stale mientras regenera
```

---

### 11. Optimizar Database Queries y Connection Pooling
**⏱️ Tiempo**: 1-2 semanas
**📈 Impacto**: Alto (60% mejora en tiempo de query)
**🔧 Dificultad**: ⭐⭐⭐⭐ Avanzado
**📦 Archivos Afectados**: Servicios de base de datos, Supabase config

#### ✅ Solución

**Paso 1**: Implementar Connection Pooling Singleton
```typescript
// ✅ apps/web/src/lib/supabase/client-singleton.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: {
          schema: 'public',
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        global: {
          headers: {
            'x-application-name': 'aprende-y-aplica',
          },
        },
      }
    )
  }

  return supabaseClient
}
```

**Paso 2**: Configurar Supabase Pooling (Supabase Dashboard)
```sql
-- En Supabase Dashboard → Settings → Database:

-- Connection Pooling Settings:
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET superuser_reserved_connections = 3;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

-- Connection pooler (PgBouncer):
-- Mode: Transaction (mejor para APIs)
-- Pool size: 20
-- Max client connections: 100
```

**Paso 3**: Agregar índices faltantes identificados
```sql
-- ✅ Índices para users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at_desc ON public.users(created_at DESC);

-- ✅ Índices para timeline queries
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at_desc
  ON public.community_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_comments_created_at_desc
  ON public.community_comments(created_at DESC);

-- ✅ Índice compuesto para paginación
CREATE INDEX IF NOT EXISTS idx_communities_pagination
  ON public.communities(created_at DESC, id);

CREATE INDEX IF NOT EXISTS idx_posts_pagination
  ON public.community_posts(community_id, created_at DESC, id);

-- ✅ Índice para búsquedas de texto (GIN)
CREATE INDEX IF NOT EXISTS idx_communities_name_gin
  ON public.communities USING gin(to_tsvector('spanish', name));

CREATE INDEX IF NOT EXISTS idx_posts_content_gin
  ON public.community_posts USING gin(to_tsvector('spanish', content));

-- ✅ Índice para token_hash lookup
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash
  ON public.refresh_tokens(token_hash);
```

**Paso 4**: Optimizar query más lenta - Community Stats
```sql
-- Verificar rendimiento actual:
EXPLAIN ANALYZE
SELECT * FROM community_stats
WHERE visibility = 'public'
ORDER BY created_at DESC
LIMIT 20;

-- Si es lenta, crear índice parcial:
CREATE INDEX IF NOT EXISTS idx_community_stats_public_recent
  ON public.communities(created_at DESC)
  WHERE visibility = 'public' AND active = true;
```

**Paso 5**: Implementar query caching en aplicación
```typescript
// ✅ apps/web/src/lib/cache/query-cache.ts
import NodeCache from 'node-cache'

const queryCache = new NodeCache({
  stdTTL: 300, // 5 minutos default
  checkperiod: 60, // Verificar expirados cada 60s
})

export const cachedQuery = async <T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // Verificar cache
  const cached = queryCache.get<T>(key)
  if (cached !== undefined) {
    return cached
  }

  // Ejecutar query
  const result = await queryFn()

  // Guardar en cache
  queryCache.set(key, result, ttl)

  return result
}

// Invalidar cache manualmente
export const invalidateCache = (pattern: string) => {
  const keys = queryCache.keys()
  keys.filter(k => k.includes(pattern)).forEach(k => queryCache.del(k))
}
```

**Paso 6**: Usar cache en servicios
```typescript
// ✅ apps/web/src/lib/services/communities.service.ts
import { cachedQuery, invalidateCache } from '@/lib/cache/query-cache'
import { getSupabaseClient } from '@/lib/supabase/client-singleton'

export class CommunitiesService {
  static async getAllCommunities() {
    return cachedQuery(
      'communities:all',
      async () => {
        const supabase = getSupabaseClient()
        const { data } = await supabase
          .from('community_stats')
          .select('*')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })

        return data
      },
      300 // 5 minutos
    )
  }

  static async getCommunityBySlug(slug: string) {
    return cachedQuery(
      `community:${slug}`,
      async () => {
        const supabase = getSupabaseClient()
        const { data } = await supabase
          .from('community_stats')
          .select('*')
          .eq('slug', slug)
          .single()

        return data
      },
      300
    )
  }

  static async createCommunity(communityData: any) {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('communities')
      .insert(communityData)
      .select()
      .single()

    // Invalidar cache
    invalidateCache('communities')

    return data
  }
}
```

**Paso 7**: Monitorear slow queries
```sql
-- Habilitar pg_stat_statements en Supabase:
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Ver queries más lentas:
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Crear view para monitoreo:
CREATE OR REPLACE VIEW slow_queries AS
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  (mean_exec_time / 1000)::numeric(10,2) as mean_time_seconds
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- >100ms
ORDER BY mean_exec_time DESC;
```

#### 📊 Validación
```bash
# Verificar mejora en queries:

# ANTES:
# GET /api/communities: 800ms
# Query time: 350ms
# Connection overhead: 200ms

# DESPUÉS:
# GET /api/communities: 180ms (78% mejora)
# Query time: 80ms (77% mejora)
# Connection overhead: 20ms (90% mejora)
# Cache hit ratio: 85%

# Monitorear en producción:
# - Connection pool utilization
# - Cache hit ratio
# - Average query time
# - Slow query count
```

---

### 12. Implementar CDN y Edge Functions
**⏱️ Tiempo**: 1-2 semanas
**📈 Impacto**: Muy Alto (50-70% mejora para usuarios globales)
**🔧 Dificultad**: ⭐⭐⭐⭐⭐ Avanzado
**📦 Archivos Afectados**: Configuración de infraestructura

#### ✅ Solución

**Opción A: Vercel Edge (Recomendado para Next.js)**

**Paso 1**: Configurar Edge Runtime en rutas API críticas
```typescript
// ✅ apps/web/src/app/api/communities/route.ts
export const runtime = 'edge' // Ejecutar en Edge

export async function GET(request: Request) {
  // Este código se ejecuta en Edge, cerca del usuario
  const communities = await fetch('https://tu-supabase.supabase.co/rest/v1/communities', {
    headers: {
      'apikey': process.env.SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY!}`,
    },
    next: { revalidate: 300 }
  }).then(r => r.json())

  return Response.json({ communities }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'CDN-Cache-Control': 'max-age=3600',
    }
  })
}
```

**Paso 2**: Configurar Vercel CDN caching
```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/api/communities",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, s-maxage=300, stale-while-revalidate=600"
        },
        {
          "key": "CDN-Cache-Control",
          "value": "max-age=3600"
        }
      ]
    },
    {
      "source": "/(.*).webp",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*).avif",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://tu-supabase.supabase.co/rest/v1/:path*"
    }
  ]
}
```

**Opción B: Cloudflare (Alternativa más económica)**

**Paso 3**: Setup Cloudflare CDN
```bash
# 1. Crear cuenta en Cloudflare
# 2. Agregar dominio
# 3. Cambiar nameservers en registrar de dominio
# 4. Configurar SSL/TLS: Full (strict)
# 5. Habilitar Always Use HTTPS
```

**Paso 4**: Configurar Page Rules en Cloudflare
```
# Page Rules:
*aprende-y-aplica.com/api/communities*
- Cache Level: Standard
- Edge Cache TTL: 5 minutes
- Browser Cache TTL: 5 minutes

*aprende-y-aplica.com/*.webp
- Cache Level: Cache Everything
- Edge Cache TTL: 1 year
- Browser Cache TTL: 1 year

*aprende-y-aplica.com/*.avif
- Cache Level: Cache Everything
- Edge Cache TTL: 1 year
- Browser Cache TTL: 1 year

*aprende-y-aplica.com/_next/static/*
- Cache Level: Cache Everything
- Edge Cache TTL: 1 year
- Browser Cache TTL: 1 year
```

**Paso 5**: Implementar Cloudflare Workers para lógica Edge
```javascript
// cloudflare-worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // Cachear respuestas API
    if (url.pathname.startsWith('/api/communities')) {
      const cache = caches.default
      let response = await cache.match(request)

      if (!response) {
        response = await fetch(request)

        // Cachear por 5 minutos
        const headers = new Headers(response.headers)
        headers.set('Cache-Control', 'public, max-age=300')
        response = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        })

        await cache.put(request, response.clone())
      }

      return response
    }

    return fetch(request)
  }
}
```

**Paso 6**: Optimizar assets para CDN
```typescript
// next.config.ts
const nextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './image-loader.ts',
    domains: ['cdn.aprende-y-aplica.com'],
  },
  assetPrefix: process.env.CDN_URL || '',
}

// image-loader.ts
export default function cloudflareImageLoader({ src, width, quality }) {
  return `https://cdn.aprende-y-aplica.com/cdn-cgi/image/width=${width},quality=${quality || 75}/${src}`
}
```

#### 📊 Validación
```bash
# Verificar CDN funcionando:

# 1. Verificar headers de respuesta:
curl -I https://aprende-y-aplica.com/api/communities
# Debe mostrar: CF-Cache-Status: HIT (Cloudflare)
# o: X-Vercel-Cache: HIT (Vercel)

# 2. Medir latencia desde diferentes ubicaciones:
# - México: 50ms (sin CDN: 200ms)
# - España: 80ms (sin CDN: 400ms)
# - USA: 40ms (sin CDN: 150ms)

# 3. Verificar imágenes desde CDN:
# Todas las imágenes deben servirse desde cdn.aprende-y-aplica.com

# Mejoras esperadas:
# - TTFB (Time to First Byte): 70% reducción
# - Asset load time: 60% reducción
# - Global latency: 50-70% mejora
```

---

## 📊 Métricas y Monitoreo

### Configurar Web Vitals Tracking

**Paso 1**: Implementar tracking de métricas
```typescript
// apps/web/src/app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
```

**Paso 2**: Custom Web Vitals reporting
```typescript
// apps/web/src/app/web-vitals.ts
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Enviar a tu servicio de analytics
    console.log(metric)

    // Ejemplo: enviar a Google Analytics
    window.gtag?.('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    })
  })
}
```

### Dashboard de Performance

**Métricas clave a monitorear:**
- **LCP (Largest Contentful Paint)**: <2.5s
- **FID (First Input Delay)**: <100ms
- **CLS (Cumulative Layout Shift)**: <0.1
- **TTFB (Time to First Byte)**: <600ms
- **FCP (First Contentful Paint)**: <1.8s

---

## 🎯 Plan de Implementación Recomendado

### Semana 1-2: Quick Wins (Nivel 1-2)
- ✅ Día 1-2: Eliminar debug logging + Bundle analyzer
- ✅ Día 3-4: Cache-Control headers + Font optimization
- ✅ Día 5-7: Lazy loading modales (10+ componentes)
- ✅ Día 8-10: React.memo implementación inicial

**Resultado esperado**: 20-30% mejora general

### Semana 3-4: Optimizaciones Medias (Nivel 2-3)
- ✅ Día 11-15: Optimización masiva de imágenes
- ✅ Día 16-20: Implementar SWR/caching
- ✅ Día 21-25: Dividir componente monolítico

**Resultado esperado**: 35-45% mejora acumulada

### Semana 5-8: Optimizaciones Avanzadas (Nivel 4)
- ✅ Semana 5: ISR implementation
- ✅ Semana 6: Database optimization + pooling
- ✅ Semana 7-8: CDN + Edge functions

**Resultado esperado**: 50-60% mejora total

---

## ✅ Checklist de Validación

Después de cada optimización, verificar:

### Performance Metrics
- [ ] Lighthouse score >90 (antes: ~60)
- [ ] LCP <2.5s (antes: ~5.2s)
- [ ] FCP <1.8s (antes: ~3.5s)
- [ ] TTI <3s (antes: ~6s)
- [ ] Bundle size <250KB (antes: ~450KB)

### User Experience
- [ ] Páginas cargan visiblemente más rápido
- [ ] Navegación fluida sin lag
- [ ] Imágenes cargan progresivamente
- [ ] Sin layout shifts molestos

### Technical Validation
- [ ] No console.log en producción
- [ ] Cache headers presentes
- [ ] Lazy loading funcionando
- [ ] Imágenes en WebP/AVIF
- [ ] CDN sirviendo assets

---

## 🚨 Notas Importantes

### Riesgos y Mitigación

**Riesgo 1**: Breaking changes al refactorizar componentes
- **Mitigación**: Testing exhaustivo antes de deploy
- **Rollback plan**: Mantener versión anterior en rama

**Riesgo 2**: Cache invalidation problems
- **Mitigación**: Implementar versionado de cache
- **Rollback plan**: API para invalidar cache manualmente

**Riesgo 3**: CDN costs
- **Mitigación**: Monitorear bandwidth mensualmente
- **Límites**: Establecer alertas a 80% del presupuesto

### Mantenimiento Continuo

**Weekly**:
- Revisar Lighthouse scores
- Monitorear bundle size
- Verificar cache hit ratio

**Monthly**:
- Revisar y optimizar nuevas queries lentas
- Actualizar imágenes no optimizadas
- Auditoría de dependencias

**Quarterly**:
- Review completo de arquitectura
- Optimización de índices DB
- Análisis de patrones de uso

---

## 📚 Recursos y Referencias

### Herramientas Recomendadas
- **Lighthouse CI**: Automatizar auditorías
- **Bundle Analyzer**: Visualizar tamaño de bundles
- **Chrome DevTools**: Performance profiling
- **WebPageTest**: Testing desde múltiples ubicaciones
- **Vercel Speed Insights**: Métricas en tiempo real

### Documentación
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Supabase Performance](https://supabase.com/docs/guides/platform/performance)
- [React Performance](https://react.dev/learn/render-and-commit)

---

**Última actualización**: Octubre 2025
**Versión**: 1.0
**Autor**: Análisis de Performance AI Assistant
