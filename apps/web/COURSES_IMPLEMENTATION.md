# Implementación de Cursos Dinámicos

## ✅ Lo que se implementó

### 1. **Tipos TypeScript actualizados**
- Agregada la tabla `courses` a los tipos de Supabase
- Tipos para `CourseWithInstructor` con datos adicionales para la UI

### 2. **Servicio de Cursos**
- `CourseService.getActiveCourses()` - Obtiene todos los cursos activos
- `CourseService.getCourseById()` - Obtiene un curso específico
- `CourseService.getCoursesByCategory()` - Filtra por categoría

### 3. **Hook personalizado**
- `useCourses()` - Hook para obtener cursos con estado de loading y error
- `useCoursesByCategory()` - Hook para filtrar por categoría

### 4. **API Route**
- `/api/courses` - Endpoint para obtener cursos
- Soporte para filtrado por categoría con query parameter

### 5. **Componente Dashboard actualizado**
- Integración con datos dinámicos de la base de datos
- Estados de loading, error y empty state
- Fallback a datos mock si no hay conexión
- Filtrado por categorías funcional

## 🚀 Cómo probar

### 1. **Agregar datos de prueba**
Ejecuta el script SQL en Supabase:

```sql
-- Copia y pega el contenido de apps/web/scripts/seed-courses.sql
-- en el SQL Editor de Supabase
```

### 2. **Verificar la API**
```bash
# Probar el endpoint de cursos
curl http://localhost:3000/api/courses

# Probar filtrado por categoría
curl http://localhost:3000/api/courses?category=IA
```

### 3. **Probar en el navegador**
1. Ve a `http://localhost:3000/dashboard`
2. Deberías ver los cursos cargándose desde la base de datos
3. Prueba los filtros de categoría
4. Verifica los estados de loading y error

## 📊 Estructura de la base de datos

La tabla `courses` debe tener esta estructura:

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR NOT NULL,
  level VARCHAR NOT NULL,
  instructor_id UUID NOT NULL,
  duration_total_minutes INTEGER NOT NULL,
  thumbnail_url TEXT,
  slug VARCHAR UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 Configuración necesaria

### Variables de entorno
Asegúrate de tener en `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://miwbzotcuaywpdbidpwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### Permisos de Supabase
La tabla `courses` debe tener permisos RLS (Row Level Security) configurados para permitir lectura pública:

```sql
-- Habilitar RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública
CREATE POLICY "Allow public read access" ON courses
  FOR SELECT USING (is_active = true);
```

## 🎯 Próximos pasos

1. **Agregar información de instructores** - Crear tabla `instructors` y hacer JOIN
2. **Implementar sistema de ratings** - Tabla `course_ratings`
3. **Sistema de precios** - Tabla `course_pricing`
4. **Favoritos de usuario** - Tabla `user_favorites`
5. **Progreso de cursos** - Tabla `course_progress`

## 🐛 Troubleshooting

### Error: "Variables de entorno faltantes"
- Verifica que el archivo `.env.local` existe en `apps/web/`
- Reinicia el servidor de desarrollo

### Error: "No hay cursos disponibles"
- Verifica que la tabla `courses` existe en Supabase
- Ejecuta el script de datos de prueba
- Verifica los permisos RLS

### Error de conexión a Supabase
- Verifica las credenciales en `.env.local`
- Verifica que el proyecto de Supabase esté activo
- Revisa la consola del navegador para errores específicos
