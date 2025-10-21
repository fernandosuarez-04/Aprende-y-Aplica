# Implementación de Filtros y Favoritos

## ✅ Funcionalidades Implementadas

### 🎯 **Filtros por Categoría**
- ✅ Filtro "Todos" - Muestra todos los cursos
- ✅ Filtro "Favoritos" - Muestra solo cursos marcados como favoritos
- ✅ Filtros por categoría específica (IA, Datos, Desarrollo, etc.)
- ✅ Estado visual activo en los botones de filtro
- ✅ Filtrado dinámico sin recargar la página

### ❤️ **Sistema de Favoritos**
- ✅ Botón de corazón en cada tarjeta de curso
- ✅ Toggle de favoritos (agregar/remover)
- ✅ Estado visual del corazón (lleno/vacío)
- ✅ Persistencia en base de datos
- ✅ Filtro de favoritos funcional

## 🛠️ **Componentes Implementados**

### 1. **Tabla de Favoritos**
```sql
-- Tabla user_favorites creada con:
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- course_id (UUID, Foreign Key)
- created_at, updated_at (Timestamps)
- Unique constraint (user_id, course_id)
- RLS (Row Level Security) habilitado
```

### 2. **Servicios**
- `FavoritesService` - Manejo de favoritos en base de datos
- `CourseService` actualizado - Incluye información de favoritos

### 3. **Hooks**
- `useFavorites()` - Manejo de estado de favoritos
- `useCourses()` actualizado - Filtrado y favoritos integrados

### 4. **API Routes**
- `GET /api/favorites?userId=xxx` - Obtener favoritos del usuario
- `POST /api/favorites` - Toggle de favoritos
- `GET /api/courses?userId=xxx` - Cursos con información de favoritos

### 5. **Componente Dashboard**
- Filtros funcionales con estado visual
- Botones de favoritos con toggle
- Estados de loading y error
- Empty states para filtros

## 🚀 **Cómo Probar**

### 1. **Configurar Base de Datos**
Ejecuta estos scripts en Supabase SQL Editor:

```sql
-- 1. Crear tabla de favoritos
-- (Copia y pega el contenido de apps/web/scripts/create-favorites-table.sql)

-- 2. Agregar datos de prueba
-- (Copia y pega el contenido de apps/web/scripts/seed-courses.sql)
```

### 2. **Probar Filtros**
1. Ve a `http://localhost:3000/dashboard`
2. Haz clic en los botones de filtro:
   - "Todos" - Muestra todos los cursos
   - "Favoritos" - Muestra solo favoritos (inicialmente vacío)
   - "IA", "Datos", etc. - Filtra por categoría

### 3. **Probar Favoritos**
1. Haz clic en el corazón de cualquier curso
2. El corazón debe cambiar de vacío a lleno (rojo)
3. Ve al filtro "Favoritos" - debe aparecer el curso
4. Haz clic nuevamente en el corazón para removerlo

### 4. **Verificar Persistencia**
1. Recarga la página
2. Los favoritos deben mantenerse
3. Los filtros deben funcionar correctamente

## 🔧 **Configuración Necesaria**

### Variables de Entorno
Asegúrate de tener en `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://miwbzotcuaywpdbidpwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### Permisos de Supabase
La tabla `user_favorites` debe tener RLS configurado:
```sql
-- Políticas RLS ya incluidas en el script:
- Users can view their own favorites
- Users can insert their own favorites  
- Users can delete their own favorites
```

## 🎨 **Estados Visuales**

### Filtros
- **Activo**: Fondo azul (`bg-primary`)
- **Inactivo**: Fondo gris (`bg-carbon-700`)
- **Hover**: Fondo gris más claro

### Favoritos
- **Favorito**: Corazón rojo lleno (`text-red-500 fill-current`)
- **No favorito**: Corazón gris vacío (`text-text-secondary`)
- **Hover**: Fondo del botón cambia

### Loading/Error States
- **Loading**: Spinner con texto "Cargando cursos..."
- **Error**: Banner rojo con mensaje de error
- **Empty**: Mensaje contextual según el filtro activo

## 🐛 **Troubleshooting**

### Filtros no funcionan
- Verifica que el hook `useCourses` esté devolviendo `filteredCourses`
- Revisa la consola del navegador para errores

### Favoritos no se guardan
- Verifica que la tabla `user_favorites` existe en Supabase
- Revisa los permisos RLS
- Verifica que el usuario esté autenticado

### Error de API
- Verifica que las variables de entorno estén configuradas
- Revisa la consola del servidor para errores
- Verifica que Supabase esté funcionando

## 🎯 **Próximos Pasos**

1. **Agregar animaciones** - Transiciones suaves para favoritos
2. **Contador de favoritos** - Mostrar número en el botón de filtro
3. **Favoritos en sidebar** - Lista rápida de favoritos
4. **Notificaciones** - Toast cuando se agrega/remueve favorito
5. **Sincronización offline** - Cache local de favoritos

## 📊 **Estructura de Datos**

### CourseWithInstructor
```typescript
{
  id: string
  title: string
  description: string
  category: string
  isFavorite: boolean  // ← Nuevo campo
  // ... otros campos
}
```

### Favorites API
```typescript
// GET /api/favorites?userId=xxx
// Response: string[] (array de course IDs)

// POST /api/favorites
// Body: { userId: string, courseId: string }
// Response: { success: boolean, isFavorite: boolean }
```
