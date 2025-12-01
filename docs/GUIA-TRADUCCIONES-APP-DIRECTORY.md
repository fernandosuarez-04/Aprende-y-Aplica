# Guía de Traducciones - Directorio de Apps IA

## 📋 Resumen

Esta guía explica cómo agregar y gestionar traducciones en inglés y portugués para las aplicaciones del directorio de IA.

## 🚀 Pasos de Implementación

### 1. Ejecutar la Migración en Supabase

1. Ve a tu dashboard de Supabase
2. Navega a **SQL Editor**
3. Copia y pega el contenido de `supabase/migrations/create_app_directory_translations.sql`
4. Ejecuta la query
5. Verifica que la tabla `app_directory_translations` se creó correctamente

```sql
-- Verificar que la tabla existe
SELECT * FROM information_schema.tables
WHERE table_name = 'app_directory_translations';
```

### 2. Obtener IDs de tus Aplicaciones

Antes de insertar traducciones, necesitas los `app_id` de tus aplicaciones:

```sql
-- Obtener todas las apps activas
SELECT
  app_id,
  name,
  description
FROM public.ai_apps
WHERE is_active = true
ORDER BY created_at DESC;
```

Copia los `app_id` que quieras traducir.

### 3. Insertar Traducciones de Ejemplo

#### Opción A: Usando SQL directo en Supabase

1. Abre `supabase/migrations/insert_sample_translations.sql`
2. Reemplaza `'REEMPLAZAR-CON-APP-ID-REAL'` con un `app_id` real
3. Ejecuta el script en el SQL Editor de Supabase

#### Opción B: Insertar traducción manualmente

```sql
-- Traducción al inglés
INSERT INTO public.app_directory_translations (
  app_id,
  language,
  name,
  description,
  long_description,
  features,
  use_cases,
  advantages,
  disadvantages
) VALUES (
  'tu-app-id-aqui'::UUID,
  'en',
  'Your App Name in English',
  'Short description in English',
  'Long detailed description in English...',
  ARRAY['Feature 1', 'Feature 2', 'Feature 3'],
  ARRAY['Use case 1', 'Use case 2'],
  ARRAY['Advantage 1', 'Advantage 2'],
  ARRAY['Disadvantage 1']
);

-- Traducción al portugués
INSERT INTO public.app_directory_translations (
  app_id,
  language,
  name,
  description,
  long_description,
  features,
  use_cases,
  advantages,
  disadvantages
) VALUES (
  'tu-app-id-aqui'::UUID,
  'pt',
  'Nome do App em Português',
  'Descrição curta em português',
  'Descrição longa e detalhada em português...',
  ARRAY['Recurso 1', 'Recurso 2', 'Recurso 3'],
  ARRAY['Caso de uso 1', 'Caso de uso 2'],
  ARRAY['Vantagem 1', 'Vantagem 2'],
  ARRAY['Desvantagem 1']
);
```

### 4. Verificar que las Traducciones Funcionan

1. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Abre el directorio de apps:**
   ```
   http://localhost:3000/apps-directory
   ```

3. **Cambia el idioma:**
   - Click en el botón "Português" en la esquina superior derecha
   - El contenido debería cambiar al portugués

4. **Verifica en la consola del navegador:**
   - Abre DevTools (F12)
   - Ve a la pestaña Console
   - Deberías ver: `Traducción encontrada: {name: '...', description: '...'}`

## 🔍 Debugging

### Problema: No se muestran las traducciones

1. **Verifica que la tabla existe:**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_name = 'app_directory_translations';
   ```

2. **Verifica que hay datos:**
   ```sql
   SELECT COUNT(*) FROM public.app_directory_translations;
   ```

3. **Verifica traducciones específicas:**
   ```sql
   SELECT * FROM public.app_directory_translations
   WHERE language = 'pt';
   ```

4. **Verifica que el app_id coincide:**
   ```sql
   SELECT
     a.app_id,
     a.name as nombre_original,
     t.name as nombre_traducido,
     t.language
   FROM public.ai_apps a
   LEFT JOIN public.app_directory_translations t
     ON t.app_id = a.app_id
   WHERE a.is_active = true;
   ```

### Problema: Error en la API

1. **Revisa la consola del servidor:**
   ```bash
   npm run dev
   ```
   Busca errores relacionados con Supabase

2. **Revisa la consola del navegador:**
   - Abre DevTools (F12)
   - Pestaña Network
   - Busca la request a `/api/ai-directory/apps`
   - Revisa la respuesta

3. **Verifica los permisos RLS:**
   ```sql
   -- Las traducciones deben ser públicamente visibles
   SELECT * FROM pg_policies
   WHERE tablename = 'app_directory_translations';
   ```

## 📝 Actualizar Traducciones

Para actualizar una traducción existente:

```sql
UPDATE public.app_directory_translations
SET
  name = 'New Name',
  description = 'New description',
  updated_at = NOW()
WHERE app_id = 'tu-app-id'::UUID
  AND language = 'en';
```

## 🗑️ Eliminar Traducciones

Para eliminar traducciones de una app:

```sql
-- Eliminar todas las traducciones de una app
DELETE FROM public.app_directory_translations
WHERE app_id = 'tu-app-id'::UUID;

-- Eliminar solo traducciones en inglés
DELETE FROM public.app_directory_translations
WHERE app_id = 'tu-app-id'::UUID
  AND language = 'en';
```

## 🎯 Estructura de Datos

### Campos que se traducen:

- ✅ `name` - Nombre de la aplicación
- ✅ `description` - Descripción corta
- ✅ `long_description` - Descripción detallada
- ✅ `features` - Array de características
- ✅ `use_cases` - Array de casos de uso
- ✅ `advantages` - Array de ventajas
- ✅ `disadvantages` - Array de desventajas

### Campos que NO se traducen:

- ❌ `website_url` - URL del sitio web
- ❌ `logo_url` - URL del logo
- ❌ `pricing_model` - Modelo de precios
- ❌ `tags` - Etiquetas (se mantienen en inglés como estándar)
- ❌ `supported_languages` - Idiomas soportados
- ❌ `integrations` - Integraciones

## 🌐 Idiomas Soportados

| Código | Idioma | Descripción |
|--------|--------|-------------|
| `es` | Español | Idioma por defecto (no necesita traducción) |
| `en` | Inglés | Requiere entrada en tabla de traducciones |
| `pt` | Portugués | Requiere entrada en tabla de traducciones |

## 📊 Consultas Útiles

### Ver todas las traducciones de una app

```sql
SELECT
  a.name as app_original,
  t.language,
  t.name as app_traducido,
  t.description
FROM public.ai_apps a
LEFT JOIN public.app_directory_translations t ON t.app_id = a.app_id
WHERE a.app_id = 'tu-app-id'::UUID;
```

### Apps sin traducciones

```sql
SELECT
  a.app_id,
  a.name,
  COUNT(t.translation_id) as num_traducciones
FROM public.ai_apps a
LEFT JOIN public.app_directory_translations t ON t.app_id = a.app_id
WHERE a.is_active = true
GROUP BY a.app_id, a.name
HAVING COUNT(t.translation_id) < 2; -- Menos de 2 traducciones (en + pt)
```

### Estadísticas de traducciones

```sql
SELECT
  language,
  COUNT(*) as total_traducciones
FROM public.app_directory_translations
GROUP BY language;
```

## 🔐 Seguridad

- ✅ RLS (Row Level Security) habilitado
- ✅ Lectura pública permitida
- ✅ Solo administradores pueden modificar
- ✅ Restricción de idiomas (solo 'en' y 'pt' permitidos)
- ✅ Constraint UNIQUE por app + idioma

## 🎨 Ejemplo Visual del Flujo

```
Usuario cambia idioma a "Português"
              ↓
Frontend actualiza estado: lang = 'pt'
              ↓
API recibe request con ?lang=pt
              ↓
Supabase busca en app_directory_translations
  WHERE app_id = xxx AND language = 'pt'
              ↓
Si existe traducción → Sobrescribe campos
Si NO existe → Muestra español (fallback)
              ↓
Frontend renderiza contenido traducido
```

## ✅ Checklist de Implementación

- [ ] Migración ejecutada en Supabase
- [ ] Tabla `app_directory_translations` creada
- [ ] Índices creados correctamente
- [ ] RLS habilitado y políticas configuradas
- [ ] Al menos una traducción de ejemplo insertada
- [ ] API routes corregidas (sin `public.` prefix)
- [ ] Frontend probado con cambio de idioma
- [ ] Verificado fallback a español
- [ ] Console logs revisados (sin errores)
- [ ] Traducciones reales agregadas para apps en producción

## 🚨 Problemas Comunes y Soluciones

### 1. "relation app_directory_translations does not exist"
**Solución:** Ejecuta la migración `create_app_directory_translations.sql`

### 2. "permission denied for table app_directory_translations"
**Solución:** Verifica las políticas RLS con:
```sql
ALTER TABLE public.app_directory_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Traducciones públicas" ON public.app_directory_translations FOR SELECT USING (true);
```

### 3. Traducciones no aparecen en el frontend
**Solución:**
- Verifica que `lang` se esté pasando correctamente en la URL
- Revisa console logs del navegador
- Confirma que el `app_id` en traducciones coincide con el de `ai_apps`

### 4. Arrays vacíos en lugar de traducciones
**Solución:** Asegúrate de usar `ARRAY[...]` en lugar de `'{...}'` en SQL

## 📞 Soporte

Si tienes problemas:
1. Revisa los console logs del navegador y servidor
2. Ejecuta las queries de verificación de esta guía
3. Verifica que Supabase esté accesible
4. Revisa las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, etc.)
