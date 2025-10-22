# Scripts para el Directorio de IA en Supabase

Este directorio contiene los scripts SQL necesarios para crear y poblar las tablas del Directorio de IA en Supabase.

## 📋 Archivos Incluidos

1. **`create-ai-directory-tables-supabase.sql`** - Script principal para crear las tablas
2. **`seed-ai-directory-data-supabase.sql`** - Script para poblar con datos de ejemplo
3. **`README-SUPABASE.md`** - Este archivo con instrucciones

## 🚀 Instrucciones de Instalación

### Paso 1: Acceder a Supabase

1. Ve a [supabase.com](https://supabase.com) y accede a tu proyecto
2. Navega a **SQL Editor** en el panel lateral
3. Haz clic en **"New query"**

### Paso 2: Ejecutar el Script de Creación de Tablas

1. Copia todo el contenido de `create-ai-directory-tables-supabase.sql`
2. Pégalo en el editor SQL de Supabase
3. Haz clic en **"Run"** para ejecutar el script
4. Verifica que no haya errores en la consola

### Paso 3: Ejecutar el Script de Datos de Ejemplo

1. Copia todo el contenido de `seed-ai-directory-data-supabase.sql`
2. Pégalo en el editor SQL de Supabase
3. Haz clic en **"Run"** para ejecutar el script
4. Verifica que los datos se insertaron correctamente

### Paso 4: Verificar la Instalación

1. Ve a **Table Editor** en Supabase
2. Deberías ver las siguientes tablas:
   - `ai_categories`
   - `ai_prompts`
   - `ai_apps`
   - `ai_prompt_ratings`
   - `ai_app_ratings`
   - `ai_prompt_favorites`
   - `ai_app_favorites`

## 📊 Estructura de las Tablas

### ai_categories
- Categorías para organizar prompts y apps
- Incluye 10 categorías predefinidas

### ai_prompts
- Almacena prompts de IA con metadatos
- Incluye sistema de ratings y favoritos

### ai_apps
- Almacena información de aplicaciones de IA
- Incluye detalles de precios, características y ratings

### Tablas de Relaciones
- `ai_prompt_ratings` - Ratings de prompts
- `ai_app_ratings` - Ratings de apps
- `ai_prompt_favorites` - Favoritos de prompts
- `ai_app_favorites` - Favoritos de apps

## 🔒 Seguridad (RLS)

El script incluye Row Level Security (RLS) configurado:

- **Lectura pública**: Categorías, prompts y apps activos
- **Escritura autenticada**: Solo usuarios autenticados pueden crear/editar
- **Favoritos y ratings**: Solo el propietario puede gestionar sus propios datos

## 🎯 Datos de Ejemplo Incluidos

### Prompts de Ejemplo
1. **Generador de Contenido para Redes Sociales** - Marketing y contenido
2. **Asistente de Programación en Python** - Desarrollo y programación
3. **Generador de Ideas de Negocio** - Emprendimiento

### Apps de Ejemplo
1. **ChatGPT** - Asistente conversacional
2. **Midjourney** - Generación de arte con IA
3. **GitHub Copilot** - Asistente de programación

## 🔧 Configuración Adicional

### Variables de Entorno

Asegúrate de que tu archivo `.env.local` tenga:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### Permisos de API

En Supabase, ve a **Settings > API** y verifica que:
- La URL esté correcta
- El anon key esté configurado
- RLS esté habilitado

## 🐛 Solución de Problemas

### Error: "column user_id does not exist"
- **Solución**: Usa el script `create-ai-directory-tables-supabase.sql` en lugar del original
- Este script no usa foreign keys a `auth.users` para evitar conflictos

### Error: "uuid_generate_v4() does not exist"
- **Solución**: El script incluye `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- Si persiste, ejecuta manualmente: `CREATE EXTENSION "uuid-ossp";`

### Error: "permission denied"
- **Solución**: Asegúrate de estar ejecutando como superuser o con permisos adecuados
- En Supabase, esto generalmente no es un problema

## 📝 Notas Importantes

1. **Backup**: Siempre haz backup de tu base de datos antes de ejecutar scripts
2. **Testing**: Prueba primero en un entorno de desarrollo
3. **RLS**: Las políticas de RLS están configuradas para máxima seguridad
4. **Performance**: Los índices están optimizados para búsquedas rápidas

## 🆘 Soporte

Si encuentras problemas:

1. Verifica que estés usando la versión correcta de Supabase
2. Revisa los logs de error en la consola de Supabase
3. Asegúrate de que las extensiones estén habilitadas
4. Verifica los permisos de tu usuario

## 🔄 Actualizaciones

Para actualizar el esquema:

1. Haz backup de los datos existentes
2. Ejecuta los nuevos scripts
3. Verifica que todo funcione correctamente
4. Restaura los datos si es necesario

---

**¡Listo!** Tu Directorio de IA debería estar funcionando correctamente en Supabase.
