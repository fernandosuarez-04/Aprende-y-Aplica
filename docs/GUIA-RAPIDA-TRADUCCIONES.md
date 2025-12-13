# Guía Rápida: Sistema de Traducción con Base de Datos

## 🚀 Implementación Completada

El sistema de traducción ya está implementado y listo para usar. Solo necesitas 2 pasos:

---

## 📋 Paso 1: Ejecutar Migración en Supabase

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido de: `supabase/migrations/20251120_add_content_translations.sql`
3. Haz clic en **RUN** (o presiona `Ctrl+Enter`)

Esto crea:
- ✅ Tabla `content_translations` con JSONB
- ✅ Funciones auxiliares
- ✅ Índices optimizados
- ✅ Row Level Security (RLS)

---

## 📝 Paso 2: Agregar Traducciones de tus Cursos

### 2.1 Obtener IDs de Cursos

En Supabase SQL Editor, ejecuta:

```sql
SELECT id, title FROM courses ORDER BY created_at DESC LIMIT 10;
```

Copia los UUIDs de los cursos que quieres traducir.

### 2.2 Insertar Traducciones

Usa este template (reemplaza los UUIDs):

```sql
-- Traducción al INGLÉS
INSERT INTO public.content_translations (entity_type, entity_id, language_code, translations)
VALUES (
  'course',
  'TU-UUID-AQUI'::UUID,
  'en',
  '{"title": "Essential AI", "description": "Learn what others take months to discover"}'::JSONB
)
ON CONFLICT (entity_type, entity_id, language_code) 
DO UPDATE SET translations = EXCLUDED.translations;

-- Traducción al PORTUGUÉS
INSERT INTO public.content_translations (entity_type, entity_id, language_code, translations)
VALUES (
  'course',
  'TU-UUID-AQUI'::UUID,
  'pt',
  '{"title": "IA Essencial", "description": "Aprenda o que outros levam meses para descobrir"}'::JSONB
)
ON CONFLICT (entity_type, entity_id, language_code) 
DO UPDATE SET translations = EXCLUDED.translations;
```

---

## ✅ ¡Listo! Ya Funciona

Una vez ejecutados los pasos anteriores:

1. **Ve al dashboard**: `http://localhost:3000/dashboard`
2. **Cambia el idioma**: Usa el selector de idioma en la esquina superior
3. **Los cursos se traducen automáticamente** 🎉

---

## 🔍 Cómo Funciona

### En el Dashboard (ya implementado)

```typescript
// apps/web/src/app/dashboard/page.tsx - Línea 179
const translatedCourses = useTranslatedContent(
  'course',
  filteredCourses,
  ['title', 'description']
);
```

### Bajo el Capó

1. Usuario cambia idioma a "Inglés"
2. `useTranslatedContent` detecta el cambio
3. Hace query a `content_translations` tabla:
   ```sql
   SELECT translations 
   FROM content_translations 
   WHERE entity_type = 'course' 
   AND entity_id IN (...)
   AND language_code = 'en'
   ```
4. Aplica traducciones a los cursos
5. React re-renderiza con contenido traducido

---

## 🎯 Ejemplo Completo

### Supongamos que tienes este curso:

```
ID: 123e4567-e89b-12d3-a456-426614174000
Título: "IA Esencial, aprende lo que otros tardan meses en descubrir"
```

### Ejecuta en Supabase:

```sql
-- Inglés
INSERT INTO public.content_translations (entity_type, entity_id, language_code, translations)
VALUES (
  'course',
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  'en',
  '{"title": "Essential AI", "description": "Learn what others take months to discover"}'::JSONB
)
ON CONFLICT (entity_type, entity_id, language_code) 
DO UPDATE SET translations = EXCLUDED.translations;

-- Portugués
INSERT INTO public.content_translations (entity_type, entity_id, language_code, translations)
VALUES (
  'course',
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  'pt',
  '{"title": "IA Essencial", "description": "Aprenda o que outros levam meses para descobrir"}'::JSONB
)
ON CONFLICT (entity_type, entity_id, language_code) 
DO UPDATE SET translations = EXCLUDED.translations;
```

### Resultado:

- **Español (por defecto)**: "IA Esencial, aprende lo que otros tardan meses en descubrir"
- **Inglés**: "Essential AI - Learn what others take months to discover"
- **Portugués**: "IA Essencial - Aprenda o que outros levam meses para descobrir"

---

## 🛠️ Verificar Traducciones

```sql
-- Ver todas las traducciones
SELECT 
  ct.entity_type,
  ct.language_code,
  ct.translations,
  c.title as original_title
FROM content_translations ct
LEFT JOIN courses c ON c.id = ct.entity_id
ORDER BY ct.created_at DESC;
```

---

## 🔄 Actualizar una Traducción

```sql
-- Simplemente ejecuta el INSERT nuevamente con ON CONFLICT
INSERT INTO public.content_translations (entity_type, entity_id, language_code, translations)
VALUES (
  'course',
  'TU-UUID'::UUID,
  'en',
  '{"title": "Nuevo título", "description": "Nueva descripción"}'::JSONB
)
ON CONFLICT (entity_type, entity_id, language_code) 
DO UPDATE SET 
  translations = EXCLUDED.translations,
  updated_at = NOW();
```

---

## 🎨 Traducir Otros Elementos

### Módulos

```sql
INSERT INTO public.content_translations (entity_type, entity_id, language_code, translations)
VALUES (
  'module',
  'UUID-DEL-MODULO'::UUID,
  'en',
  '{"module_title": "Getting Started", "module_description": "First steps with AI"}'::JSONB
)
ON CONFLICT (entity_type, entity_id, language_code) DO UPDATE SET translations = EXCLUDED.translations;
```

### Lecciones

```sql
INSERT INTO public.content_translations (entity_type, entity_id, language_code, translations)
VALUES (
  'lesson',
  'UUID-DE-LECCION'::UUID,
  'en',
  '{"lesson_title": "What is AI?", "lesson_description": "Introduction to Artificial Intelligence"}'::JSONB
)
ON CONFLICT (entity_type, entity_id, language_code) DO UPDATE SET translations = EXCLUDED.translations;
```

---

## 💡 Ventajas de Este Sistema

✅ **No modifica tablas existentes** - Solo agrega una tabla nueva
✅ **JSONB flexible** - Puedes traducir cualquier campo
✅ **Performance óptimo** - Query batch para múltiples cursos
✅ **Caché automático** - Las traducciones se cachean en memoria
✅ **Fácil de mantener** - Inserts simples con SQL
✅ **Escalable** - Soporta infinitos idiomas
✅ **RLS incluido** - Solo admins pueden editar

---

## 🐛 Troubleshooting

### Las traducciones no aparecen

1. Verifica que la migración se ejecutó correctamente:
   ```sql
   SELECT * FROM content_translations LIMIT 1;
   ```

2. Verifica que tienes traducciones para ese curso:
   ```sql
   SELECT * FROM content_translations 
   WHERE entity_id = 'TU-UUID'::UUID;
   ```

3. Limpia el caché del navegador (Ctrl+Shift+R)

### Error al insertar

- Verifica que el UUID existe en la tabla `courses`
- Verifica que el JSON está bien formado
- Usa `::JSONB` al final del string JSON

---

## 📚 Archivos Modificados

- ✅ `supabase/migrations/20251120_add_content_translations.sql` - Migración
- ✅ `apps/web/src/core/services/contentTranslation.service.ts` - Servicio
- ✅ `apps/web/src/core/hoc/withContentTranslation.tsx` - Hook
- ✅ `apps/web/src/app/dashboard/page.tsx` - Dashboard implementado

---

## 🎉 ¡Ya Está Todo Listo!

Solo ejecuta la migración y agrega las traducciones de tus cursos. El sistema hace el resto automáticamente.

¿Preguntas? Revisa los comentarios en el código SQL o TypeScript.
