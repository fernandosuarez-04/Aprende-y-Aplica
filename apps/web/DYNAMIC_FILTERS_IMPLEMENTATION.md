# Implementación de Filtros Dinámicos

## ✅ **Problema Resuelto**

**Antes**: Los filtros de categorías estaban hardcodeados en el componente del dashboard
**Después**: Los filtros se generan dinámicamente basándose en las categorías reales de los cursos en la base de datos

## 🛠️ **Componentes Implementados**

### 1. **Servicio de Categorías**
- `CourseService.getCategories()` - Obtiene categorías únicas de la base de datos
- Filtra solo cursos activos
- Ordena las categorías alfabéticamente

### 2. **API Route**
- `GET /api/categories` - Endpoint para obtener categorías dinámicas

### 3. **Hook de Categorías**
- `useCategories()` - Manejo de estado de categorías
- Estados de loading, error y datos
- Fallback a categorías por defecto si hay error

### 4. **Dashboard Actualizado**
- Filtros generados dinámicamente
- Estados de loading con skeleton
- Estados de error con mensaje informativo
- Mantiene "Todos" y "Favoritos" como filtros especiales

## 📁 **Archivos Creados/Modificados**

### Nuevos Archivos
- ✅ `apps/web/src/features/courses/hooks/useCategories.ts` - Hook de categorías
- ✅ `apps/web/src/app/api/categories/route.ts` - API endpoint
- ✅ `apps/web/DYNAMIC_FILTERS_IMPLEMENTATION.md` - Documentación

### Archivos Modificados
- ✅ `apps/web/src/features/courses/services/course.service.ts` - Método getCategories()
- ✅ `apps/web/src/app/dashboard/page.tsx` - Filtros dinámicos
- ✅ `apps/web/scripts/seed-courses.sql` - Más categorías de prueba

## 🎯 **Funcionalidades**

### **Filtros Dinámicos**
- ✅ **"Todos"** - Siempre presente, muestra todos los cursos
- ✅ **"Favoritos"** - Siempre presente, muestra cursos favoritos
- ✅ **Categorías dinámicas** - Se generan automáticamente desde la BD
- ✅ **Orden alfabético** - Las categorías se ordenan automáticamente

### **Estados Visuales**
- ✅ **Loading** - Skeleton con 5 placeholders animados
- ✅ **Error** - Banner amarillo con mensaje informativo
- ✅ **Fallback** - Categorías por defecto si falla la API
- ✅ **Activo** - Fondo azul para el filtro seleccionado

## 🚀 **Cómo Probar**

### 1. **Agregar Datos de Prueba**
Ejecuta el script SQL actualizado en Supabase:

```sql
-- Copia y pega el contenido de apps/web/scripts/seed-courses.sql
-- Ahora incluye cursos de diferentes categorías:
-- IA, Datos, Desarrollo, Diseño, Marketing, Negocios, IT & Software
```

### 2. **Verificar Filtros Dinámicos**
1. Ve a `http://localhost:3000/dashboard`
2. Deberías ver los filtros:
   - "Todos" (siempre presente)
   - "Favoritos" (siempre presente)
   - Categorías dinámicas: "Datos", "Desarrollo", "Diseño", "IA", "IT & Software", "Marketing", "Negocios"

### 3. **Probar Funcionalidad**
1. Haz clic en cada filtro
2. Verifica que solo se muestren cursos de esa categoría
3. Prueba el filtro "Favoritos" (debe estar vacío inicialmente)
4. Agrega algunos favoritos y prueba el filtro

## 🔧 **Configuración**

### Variables de Entorno
Las mismas que ya tienes configuradas:
```env
NEXT_PUBLIC_SUPABASE_URL=https://miwbzotcuaywpdbidpwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### Base de Datos
- La tabla `courses` debe existir
- Los cursos deben tener el campo `category` con valores
- Los cursos deben estar marcados como `is_active = true`

## 📊 **Estructura de Datos**

### API Response
```typescript
// GET /api/categories
// Response: string[] (array de categorías únicas)

// Ejemplo:
["Datos", "Desarrollo", "Diseño", "IA", "IT & Software", "Marketing", "Negocios"]
```

### Hook Response
```typescript
interface UseCategoriesReturn {
  categories: Category[]  // Array de categorías con id, name, active
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface Category {
  id: string      // "ia", "datos", etc.
  name: string    // "IA", "Datos", etc.
  active: boolean // false (se maneja en el componente padre)
}
```

## 🎨 **Estados Visuales**

### Loading State
```jsx
// Skeleton con 5 placeholders animados
{[...Array(5)].map((_, index) => (
  <div className="px-4 py-2 rounded-full bg-carbon-700 animate-pulse">
    <div className="w-16 h-4 bg-carbon-600 rounded"></div>
  </div>
))}
```

### Error State
```jsx
// Banner amarillo con mensaje informativo
<div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
  <h3>Error al cargar categorías</h3>
  <p>Usando categorías por defecto</p>
</div>
```

### Categories State
```jsx
// Filtros dinámicos con estado activo
{categories.map((category) => (
  <button className={activeFilter === category.id ? 'bg-primary' : 'bg-carbon-700'}>
    {category.name}
  </button>
))}
```

## 🐛 **Troubleshooting**

### No aparecen categorías
- Verifica que la tabla `courses` existe
- Verifica que hay cursos con `is_active = true`
- Verifica que los cursos tienen el campo `category` con valores

### Error al cargar categorías
- Revisa la consola del navegador
- Verifica que la API `/api/categories` responde correctamente
- El hook tiene fallback a categorías por defecto

### Filtros no funcionan
- Verifica que el hook `useCourses` esté funcionando
- Revisa que `setFilter` se esté llamando correctamente
- Verifica que `activeFilter` se esté actualizando

## 🎯 **Próximos Pasos**

1. **Contador de cursos** - Mostrar número de cursos por categoría
2. **Filtros múltiples** - Permitir seleccionar varias categorías
3. **Búsqueda** - Agregar barra de búsqueda
4. **Ordenamiento** - Filtros por popularidad, fecha, etc.
5. **Caché** - Implementar caché para categorías

## ✨ **Beneficios**

- ✅ **Mantenimiento cero** - No hay que actualizar código cuando se agregan categorías
- ✅ **Escalabilidad** - Funciona con cualquier número de categorías
- ✅ **Consistencia** - Los filtros siempre reflejan los datos reales
- ✅ **UX mejorada** - Estados de loading y error informativos
- ✅ **Fallback robusto** - Funciona incluso si falla la API
