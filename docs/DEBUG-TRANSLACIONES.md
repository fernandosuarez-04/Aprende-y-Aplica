# 🔍 Guía de Depuración: Sistema de Traducción Automática

## Problema Reportado
Las traducciones no se están guardando en la base de datos y no aparecen logs en la consola/terminal.

## Pasos para Diagnosticar

### 1. Verificar Variables de Entorno

Asegúrate de que `OPENAI_API_KEY` esté configurada en tu archivo `.env`:

```bash
# .env (en la raíz del proyecto)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # Opcional, por defecto usa gpt-4o-mini
```

**Importante:** En Next.js, las variables de entorno deben tener el prefijo `NEXT_PUBLIC_` para estar disponibles en el cliente, pero `OPENAI_API_KEY` debe estar **sin** el prefijo porque solo se usa en el servidor.

### 2. Verificar Logs en la Terminal del Servidor

Los `console.log` del servidor se muestran en la **terminal donde ejecutas `npm run dev`**, NO en la consola del navegador.

Para ver los logs:
1. Abre la terminal donde ejecutas el servidor Next.js
2. Busca mensajes que empiecen con:
   - `[AdminWorkshopsService]`
   - `[CourseTranslation]`
   - `[AutoTranslationService]`
   - `[ContentTranslationService]`

### 3. Probar el Endpoint de Prueba

He creado un endpoint de prueba para diagnosticar el problema:

```bash
# Reemplaza COURSE_ID con el ID de un curso existente
curl http://localhost:3000/api/test-translation?courseId=COURSE_ID
```

O abre en el navegador:
```
http://localhost:3000/api/test-translation?courseId=TU_COURSE_ID
```

Este endpoint:
- Verifica que el curso existe
- Verifica que las variables de entorno estén configuradas
- Intenta traducir el curso
- Muestra las traducciones guardadas en la BD
- Devuelve información detallada de debug

### 4. Verificar en Supabase

Ejecuta esta query en Supabase SQL Editor para verificar si hay traducciones:

```sql
SELECT 
  entity_type,
  entity_id,
  language_code,
  translations,
  created_at,
  created_by
FROM content_translations
WHERE entity_type = 'course'
ORDER BY created_at DESC
LIMIT 10;
```

### 5. Verificar que el Servicio se Ejecute

Cuando creas un nuevo taller, deberías ver en la terminal del servidor:

```
[AdminWorkshopsService] ========== INICIANDO TRADUCCIÓN AUTOMÁTICA ==========
[CourseTranslation] ========== translateCourseOnCreate INICIADO ==========
[AutoTranslationService] Verificando configuración: ...
```

Si no ves estos logs, el servicio no se está ejecutando.

### 6. Problemas Comunes

#### Problema: No se ven logs en la terminal
**Solución:** Asegúrate de estar mirando la terminal correcta (donde ejecutas `npm run dev`)

#### Problema: "OPENAI_API_KEY no está configurada"
**Solución:** 
1. Verifica que el archivo `.env` esté en la raíz del proyecto
2. Reinicia el servidor después de agregar la variable
3. Verifica que no tenga espacios extra: `OPENAI_API_KEY=sk-...` (sin espacios)

#### Problema: "Error al guardar traducción en la base de datos"
**Solución:**
1. Verifica que la tabla `content_translations` exista en Supabase
2. Verifica los permisos RLS (Row Level Security) de la tabla
3. Revisa los logs de error para ver el mensaje específico

#### Problema: Las traducciones se crean pero no se guardan
**Solución:**
1. Verifica que el cliente de Supabase se esté pasando correctamente
2. Revisa los logs de `ContentTranslationService.saveTranslation`
3. Verifica que no haya errores de constraint (clave única duplicada)

### 7. Logs de Depuración Agregados

He agregado logs detallados en:
- `courseTranslation.service.ts` - Muestra cada paso del proceso
- `contentTranslation.service.ts` - Muestra los datos que se intentan guardar
- `autoTranslation.service.ts` - Muestra las llamadas a OpenAI

### 8. Verificar Estructura de la Tabla

Asegúrate de que la tabla `content_translations` tenga esta estructura:

```sql
CREATE TABLE IF NOT EXISTS content_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('course', 'module', 'lesson', 'activity', 'material')),
  entity_id uuid NOT NULL,
  language_code text NOT NULL CHECK (language_code IN ('en', 'pt', 'fr', 'de', 'it', 'zh', 'ja', 'ko')),
  translations jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  UNIQUE(entity_type, entity_id, language_code)
);
```

## Siguiente Paso

Si después de seguir estos pasos el problema persiste:

1. Ejecuta el endpoint de prueba: `/api/test-translation?courseId=XXX`
2. Copia todos los logs de la terminal
3. Comparte el resultado del endpoint de prueba
4. Verifica en Supabase si hay registros en `content_translations`

