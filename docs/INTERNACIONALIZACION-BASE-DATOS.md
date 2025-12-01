# Internacionalización de Contenidos de Base de Datos

## 📋 Resumen Ejecutivo

Este documento describe cómo implementar un sistema completo de internacionalización (i18n) que soporte múltiples idiomas para contenidos almacenados en la base de datos de Supabase.

### Estado Actual

La plataforma tiene implementado:
- ✅ **i18n para UI**: Sistema funcional usando `react-i18next` + `next-i18next`
- ✅ **Idiomas soportados**: Español (por defecto), Inglés y Portugués
- ✅ **Archivos de traducción**: Ubicados en `apps/web/public/locales/{es,en,pt}/`
- ⚠️ **Limitación**: El contenido de la base de datos (cursos, lecciones, módulos, etc.) NO se traduce automáticamente

### Problema Identificado

Los textos que provienen de la base de datos (títulos de cursos, descripciones, contenidos de lecciones, etc.) se muestran en un solo idioma, independientemente del idioma seleccionado por el usuario en la interfaz.

---

## 🎯 Solución Propuesta

### Opción 1: Columnas Multiidioma (Recomendado para MVP)

**Descripción**: Agregar columnas específicas para cada idioma directamente en las tablas existentes.

#### Ventajas
- ✅ Simple de implementar
- ✅ Consultas SQL directas sin JOINs complejos
- ✅ Mejor rendimiento
- ✅ Fácil de migrar desde datos existentes
- ✅ Compatible con el sistema actual

#### Desventajas
- ❌ Difícil de escalar a muchos idiomas
- ❌ Esquema más grande
- ❌ Duplicación de estructura por idioma

#### Implementación

**Paso 1: Modificar el Esquema de Base de Datos**

```sql
-- Migration para agregar soporte multiidioma a la tabla courses
-- Archivo: supabase/migrations/add_multilanguage_courses.sql

-- Agregar columnas para inglés y portugués
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS title_en VARCHAR,
ADD COLUMN IF NOT EXISTS title_pt VARCHAR,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_pt TEXT;

-- Copiar datos existentes (asumir que están en español)
UPDATE public.courses 
SET 
  title_en = title,
  title_pt = title,
  description_en = description,
  description_pt = description
WHERE title_en IS NULL;

-- Agregar comentarios para claridad
COMMENT ON COLUMN public.courses.title IS 'Título del curso en español (idioma por defecto)';
COMMENT ON COLUMN public.courses.title_en IS 'Título del curso en inglés';
COMMENT ON COLUMN public.courses.title_pt IS 'Título del curso en portugués';
COMMENT ON COLUMN public.courses.description IS 'Descripción del curso en español (idioma por defecto)';
COMMENT ON COLUMN public.courses.description_en IS 'Descripción del curso en inglés';
COMMENT ON COLUMN public.courses.description_pt IS 'Descripción del curso en portugués';
```

**Paso 2: Modificar Otras Tablas Relevantes**

```sql
-- Migration para course_modules
-- Archivo: supabase/migrations/add_multilanguage_modules.sql

ALTER TABLE public.course_modules 
ADD COLUMN IF NOT EXISTS module_title_en VARCHAR,
ADD COLUMN IF NOT EXISTS module_title_pt VARCHAR,
ADD COLUMN IF NOT EXISTS module_description_en TEXT,
ADD COLUMN IF NOT EXISTS module_description_pt TEXT;

-- Copiar datos existentes
UPDATE public.course_modules 
SET 
  module_title_en = module_title,
  module_title_pt = module_title,
  module_description_en = module_description,
  module_description_pt = module_description
WHERE module_title_en IS NULL;
```

```sql
-- Migration para course_lessons
-- Archivo: supabase/migrations/add_multilanguage_lessons.sql

ALTER TABLE public.course_lessons 
ADD COLUMN IF NOT EXISTS lesson_title_en VARCHAR,
ADD COLUMN IF NOT EXISTS lesson_title_pt VARCHAR,
ADD COLUMN IF NOT EXISTS lesson_description_en TEXT,
ADD COLUMN IF NOT EXISTS lesson_description_pt TEXT,
ADD COLUMN IF NOT EXISTS transcript_content_en TEXT,
ADD COLUMN IF NOT EXISTS transcript_content_pt TEXT;

-- Copiar datos existentes
UPDATE public.course_lessons 
SET 
  lesson_title_en = lesson_title,
  lesson_title_pt = lesson_title,
  lesson_description_en = lesson_description,
  lesson_description_pt = lesson_description,
  transcript_content_en = transcript_content,
  transcript_content_pt = transcript_content
WHERE lesson_title_en IS NULL;
```

**Paso 3: Crear Función Auxiliar en Base de Datos**

```sql
-- Función para obtener el campo correcto según el idioma
-- Archivo: supabase/migrations/create_i18n_functions.sql

CREATE OR REPLACE FUNCTION get_localized_field(
  default_value TEXT,
  en_value TEXT,
  pt_value TEXT,
  lang_code TEXT DEFAULT 'es'
)
RETURNS TEXT AS $$
BEGIN
  CASE lang_code
    WHEN 'en' THEN
      RETURN COALESCE(en_value, default_value);
    WHEN 'pt' THEN
      RETURN COALESCE(pt_value, default_value);
    ELSE
      RETURN default_value;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Ejemplo de uso:
-- SELECT 
--   get_localized_field(title, title_en, title_pt, 'en') as title
-- FROM courses;
```

**Paso 4: Actualizar TypeScript Types**

```typescript
// Archivo: apps/web/src/lib/supabase/types.ts

export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          title: string  // Español (por defecto)
          title_en: string | null
          title_pt: string | null
          description: string
          description_en: string | null
          description_pt: string | null
          // ... resto de campos
        }
        Insert: {
          id?: string
          title: string
          title_en?: string | null
          title_pt?: string | null
          description: string
          description_en?: string | null
          description_pt?: string | null
          // ... resto de campos
        }
        Update: {
          title?: string
          title_en?: string | null
          title_pt?: string | null
          description?: string
          description_en?: string | null
          description_pt?: string | null
          // ... resto de campos
        }
      }
      // Similar para course_modules y course_lessons
    }
  }
}
```

**Paso 5: Crear Servicio de Traducción**

```typescript
// Archivo: apps/web/src/lib/i18n/database-i18n.service.ts

import { SupportedLanguage } from '@/core/i18n/i18n'

export class DatabaseI18nService {
  /**
   * Obtiene el valor de un campo según el idioma actual
   * @param baseValue Valor en español (idioma por defecto)
   * @param translations Objeto con traducciones { en?: string, pt?: string }
   * @param language Código del idioma actual
   */
  static getLocalizedValue<T = string>(
    baseValue: T,
    translations: { en?: T | null; pt?: T | null },
    language: SupportedLanguage
  ): T {
    switch (language) {
      case 'en':
        return translations.en ?? baseValue
      case 'pt':
        return translations.pt ?? baseValue
      case 'es':
      default:
        return baseValue
    }
  }

  /**
   * Obtiene múltiples campos localizados de un objeto
   */
  static getLocalizedObject<T extends Record<string, any>>(
    obj: T,
    fieldMappings: Array<{ base: keyof T; en: keyof T; pt: keyof T }>,
    language: SupportedLanguage
  ): T {
    const result = { ...obj }

    fieldMappings.forEach(({ base, en, pt }) => {
      result[base] = this.getLocalizedValue(
        obj[base],
        { en: obj[en], pt: obj[pt] },
        language
      ) as T[keyof T]
    })

    return result
  }

  /**
   * Prepara datos de curso con campos localizados
   */
  static getLocalizedCourse(course: any, language: SupportedLanguage) {
    return {
      ...course,
      title: this.getLocalizedValue(
        course.title,
        { en: course.title_en, pt: course.title_pt },
        language
      ),
      description: this.getLocalizedValue(
        course.description,
        { en: course.description_en, pt: course.description_pt },
        language
      )
    }
  }

  /**
   * Prepara datos de módulo con campos localizados
   */
  static getLocalizedModule(module: any, language: SupportedLanguage) {
    return {
      ...module,
      module_title: this.getLocalizedValue(
        module.module_title,
        { en: module.module_title_en, pt: module.module_title_pt },
        language
      ),
      module_description: this.getLocalizedValue(
        module.module_description,
        { en: module.module_description_en, pt: module.module_description_pt },
        language
      )
    }
  }

  /**
   * Prepara datos de lección con campos localizados
   */
  static getLocalizedLesson(lesson: any, language: SupportedLanguage) {
    return {
      ...lesson,
      lesson_title: this.getLocalizedValue(
        lesson.lesson_title,
        { en: lesson.lesson_title_en, pt: lesson.lesson_title_pt },
        language
      ),
      lesson_description: this.getLocalizedValue(
        lesson.lesson_description,
        { en: lesson.lesson_description_en, pt: lesson.lesson_description_pt },
        language
      ),
      transcript_content: this.getLocalizedValue(
        lesson.transcript_content,
        { en: lesson.transcript_content_en, pt: lesson.transcript_content_pt },
        language
      )
    }
  }
}
```

**Paso 6: Actualizar Servicios Existentes**

```typescript
// Archivo: apps/web/src/features/courses/services/course.service.ts

import { createClient } from '@/lib/supabase/server'
import { DatabaseI18nService } from '@/lib/i18n/database-i18n.service'
import { SupportedLanguage } from '@/core/i18n/i18n'

export class CourseService {
  /**
   * Obtiene todos los cursos activos con traducción
   */
  static async getActiveCourses(
    userId?: string,
    language: SupportedLanguage = 'es'
  ): Promise<CourseWithInstructor[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          title_en,
          title_pt,
          description,
          description_en,
          description_pt,
          category,
          level,
          instructor_id,
          duration_total_minutes,
          thumbnail_url,
          slug,
          is_active,
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching courses:', error)
        throw new Error(`Error al obtener cursos: ${error.message}`)
      }

      // Aplicar localización a cada curso
      const localizedCourses = (data || []).map(course => 
        DatabaseI18nService.getLocalizedCourse(course, language)
      )

      // Resto de la lógica (instructores, favoritos, etc.)
      // ...

      return localizedCourses
    } catch (error) {
      console.error('Error in CourseService.getActiveCourses:', error)
      throw error
    }
  }
}
```

**Paso 7: Usar en Componentes React**

```typescript
// Archivo: apps/web/src/app/courses/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/core/providers/I18nProvider'
import { CourseService } from '@/features/courses/services/course.service'

export default function CoursesPage() {
  const { language } = useLanguage()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true)
        // El servicio ya aplica la localización según el idioma
        const data = await CourseService.getActiveCourses(undefined, language)
        setCourses(data)
      } catch (error) {
        console.error('Error loading courses:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [language]) // Recargar cuando cambia el idioma

  return (
    <div>
      {courses.map(course => (
        <div key={course.id}>
          <h2>{course.title}</h2> {/* Ya está traducido */}
          <p>{course.description}</p> {/* Ya está traducido */}
        </div>
      ))}
    </div>
  )
}
```

**Paso 8: Panel de Administración - Formularios Multiidioma**

```typescript
// Archivo: apps/web/src/features/admin/components/CourseForm.tsx

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CourseFormData {
  // Español (por defecto)
  title: string
  description: string
  
  // Inglés
  title_en: string
  description_en: string
  
  // Portugués
  title_pt: string
  description_pt: string
  
  // Otros campos...
}

export function CourseForm() {
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    title_en: '',
    description_en: '',
    title_pt: '',
    description_pt: '',
  })

  return (
    <form>
      <Tabs defaultValue="es">
        <TabsList>
          <TabsTrigger value="es">🇪🇸 Español</TabsTrigger>
          <TabsTrigger value="en">🇬🇧 Inglés</TabsTrigger>
          <TabsTrigger value="pt">🇵🇹 Portugués</TabsTrigger>
        </TabsList>

        <TabsContent value="es">
          <div className="space-y-4">
            <div>
              <label>Título</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título del curso en español"
              />
            </div>
            <div>
              <label>Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del curso en español"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="en">
          <div className="space-y-4">
            <div>
              <label>Title</label>
              <input
                type="text"
                value={formData.title_en}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                placeholder="Course title in English"
              />
            </div>
            <div>
              <label>Description</label>
              <textarea
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                placeholder="Course description in English"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pt">
          <div className="space-y-4">
            <div>
              <label>Título</label>
              <input
                type="text"
                value={formData.title_pt}
                onChange={(e) => setFormData({ ...formData, title_pt: e.target.value })}
                placeholder="Título do curso em português"
              />
            </div>
            <div>
              <label>Descrição</label>
              <textarea
                value={formData.description_pt}
                onChange={(e) => setFormData({ ...formData, description_pt: e.target.value })}
                placeholder="Descrição do curso em português"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <button type="submit">Guardar Curso</button>
    </form>
  )
}
```

---

### Opción 2: Tabla de Traducciones Separada (Escalable)

**Descripción**: Crear una tabla separada para almacenar todas las traducciones.

#### Ventajas
- ✅ Fácil de agregar nuevos idiomas
- ✅ Esquema principal no cambia
- ✅ Centralizado y mantenible
- ✅ Permite traducir solo lo necesario

#### Desventajas
- ❌ Consultas más complejas (requiere JOINs)
- ❌ Potencial impacto en rendimiento
- ❌ Más complejo de implementar inicialmente

#### Implementación

**Paso 1: Crear Tabla de Traducciones**

```sql
-- Archivo: supabase/migrations/create_translations_table.sql

-- Enum para tipos de contenido traducible
CREATE TYPE translatable_type AS ENUM (
  'course',
  'module',
  'lesson',
  'activity',
  'material'
);

-- Tabla de traducciones
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia al contenido original
  entity_type translatable_type NOT NULL,
  entity_id UUID NOT NULL,
  field_name VARCHAR(100) NOT NULL, -- 'title', 'description', etc.
  
  -- Idioma y contenido traducido
  language_code VARCHAR(5) NOT NULL, -- 'en', 'pt', 'fr', etc.
  translated_value TEXT NOT NULL,
  
  -- Metadatos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  
  -- Índices para búsqueda rápida
  UNIQUE(entity_type, entity_id, field_name, language_code)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_translations_entity ON public.translations(entity_type, entity_id);
CREATE INDEX idx_translations_language ON public.translations(language_code);
CREATE INDEX idx_translations_lookup ON public.translations(entity_type, entity_id, field_name, language_code);

-- Comentarios
COMMENT ON TABLE public.translations IS 'Almacena traducciones para cualquier contenido de la plataforma';
COMMENT ON COLUMN public.translations.entity_type IS 'Tipo de entidad (course, module, lesson, etc.)';
COMMENT ON COLUMN public.translations.entity_id IS 'ID de la entidad a traducir';
COMMENT ON COLUMN public.translations.field_name IS 'Nombre del campo traducido (title, description, etc.)';
COMMENT ON COLUMN public.translations.language_code IS 'Código ISO del idioma (en, pt, fr, etc.)';
```

**Paso 2: Función para Obtener Traducciones**

```sql
-- Función para obtener traducción con fallback
CREATE OR REPLACE FUNCTION get_translation(
  p_entity_type translatable_type,
  p_entity_id UUID,
  p_field_name VARCHAR,
  p_language_code VARCHAR,
  p_fallback_value TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_translation TEXT;
BEGIN
  -- Buscar traducción
  SELECT translated_value INTO v_translation
  FROM public.translations
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND field_name = p_field_name
    AND language_code = p_language_code
  LIMIT 1;
  
  -- Retornar traducción o fallback
  RETURN COALESCE(v_translation, p_fallback_value);
END;
$$ LANGUAGE plpgsql STABLE;

-- Vista para facilitar consultas de cursos con traducciones
CREATE OR REPLACE VIEW courses_with_translations AS
SELECT 
  c.*,
  t_title_en.translated_value AS title_en,
  t_title_pt.translated_value AS title_pt,
  t_desc_en.translated_value AS description_en,
  t_desc_pt.translated_value AS description_pt
FROM public.courses c
LEFT JOIN public.translations t_title_en 
  ON t_title_en.entity_type = 'course' 
  AND t_title_en.entity_id = c.id 
  AND t_title_en.field_name = 'title' 
  AND t_title_en.language_code = 'en'
LEFT JOIN public.translations t_title_pt 
  ON t_title_pt.entity_type = 'course' 
  AND t_title_pt.entity_id = c.id 
  AND t_title_pt.field_name = 'title' 
  AND t_title_pt.language_code = 'pt'
LEFT JOIN public.translations t_desc_en 
  ON t_desc_en.entity_type = 'course' 
  AND t_desc_en.entity_id = c.id 
  AND t_desc_en.field_name = 'description' 
  AND t_desc_en.language_code = 'en'
LEFT JOIN public.translations t_desc_pt 
  ON t_desc_pt.entity_type = 'course' 
  AND t_desc_pt.entity_id = c.id 
  AND t_desc_pt.field_name = 'description' 
  AND t_desc_pt.language_code = 'pt';
```

**Paso 3: Servicio TypeScript para Traducciones**

```typescript
// Archivo: apps/web/src/lib/i18n/translation.service.ts

import { createClient } from '@/lib/supabase/server'
import { SupportedLanguage } from '@/core/i18n/i18n'

export type TranslatableEntity = 'course' | 'module' | 'lesson' | 'activity' | 'material'

export interface Translation {
  id: string
  entity_type: TranslatableEntity
  entity_id: string
  field_name: string
  language_code: string
  translated_value: string
  created_at: string
  updated_at: string
}

export class TranslationService {
  /**
   * Obtiene una traducción específica
   */
  static async getTranslation(
    entityType: TranslatableEntity,
    entityId: string,
    fieldName: string,
    languageCode: SupportedLanguage
  ): Promise<string | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('translations')
      .select('translated_value')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('field_name', fieldName)
      .eq('language_code', languageCode)
      .single()

    if (error || !data) {
      return null
    }

    return data.translated_value
  }

  /**
   * Obtiene todas las traducciones de una entidad
   */
  static async getEntityTranslations(
    entityType: TranslatableEntity,
    entityId: string,
    languageCode: SupportedLanguage
  ): Promise<Record<string, string>> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('translations')
      .select('field_name, translated_value')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('language_code', languageCode)

    if (error || !data) {
      return {}
    }

    // Convertir array a objeto { field_name: translated_value }
    return data.reduce((acc, item) => {
      acc[item.field_name] = item.translated_value
      return acc
    }, {} as Record<string, string>)
  }

  /**
   * Crea o actualiza una traducción
   */
  static async upsertTranslation(
    entityType: TranslatableEntity,
    entityId: string,
    fieldName: string,
    languageCode: SupportedLanguage,
    translatedValue: string,
    userId?: string
  ): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('translations')
      .upsert({
        entity_type: entityType,
        entity_id: entityId,
        field_name: fieldName,
        language_code: languageCode,
        translated_value: translatedValue,
        created_by: userId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'entity_type,entity_id,field_name,language_code'
      })

    if (error) {
      console.error('Error upserting translation:', error)
      throw error
    }
  }

  /**
   * Aplica traducciones a un objeto
   */
  static async applyTranslations<T extends Record<string, any>>(
    entityType: TranslatableEntity,
    entity: T,
    fieldsToTranslate: string[],
    languageCode: SupportedLanguage
  ): Promise<T> {
    // Si es español, retornar el objeto original
    if (languageCode === 'es') {
      return entity
    }

    // Obtener traducciones
    const translations = await this.getEntityTranslations(
      entityType,
      entity.id,
      languageCode
    )

    // Aplicar traducciones
    const result = { ...entity }
    fieldsToTranslate.forEach(field => {
      if (translations[field]) {
        result[field] = translations[field]
      }
    })

    return result
  }

  /**
   * Aplica traducciones a un array de objetos
   */
  static async applyTranslationsToArray<T extends Record<string, any>>(
    entityType: TranslatableEntity,
    entities: T[],
    fieldsToTranslate: string[],
    languageCode: SupportedLanguage
  ): Promise<T[]> {
    // Si es español, retornar el array original
    if (languageCode === 'es' || entities.length === 0) {
      return entities
    }

    // Obtener todas las traducciones en una sola consulta
    const supabase = await createClient()
    const entityIds = entities.map(e => e.id)

    const { data, error } = await supabase
      .from('translations')
      .select('entity_id, field_name, translated_value')
      .eq('entity_type', entityType)
      .in('entity_id', entityIds)
      .eq('language_code', languageCode)
      .in('field_name', fieldsToTranslate)

    if (error || !data) {
      return entities
    }

    // Organizar traducciones por entity_id
    const translationMap = new Map<string, Record<string, string>>()
    data.forEach(item => {
      if (!translationMap.has(item.entity_id)) {
        translationMap.set(item.entity_id, {})
      }
      translationMap.get(item.entity_id)![item.field_name] = item.translated_value
    })

    // Aplicar traducciones
    return entities.map(entity => {
      const translations = translationMap.get(entity.id)
      if (!translations) {
        return entity
      }

      const result = { ...entity }
      fieldsToTranslate.forEach(field => {
        if (translations[field]) {
          result[field] = translations[field]
        }
      })
      return result
    })
  }
}
```

**Paso 4: Usar en Servicios**

```typescript
// Archivo: apps/web/src/features/courses/services/course.service.ts

import { TranslationService } from '@/lib/i18n/translation.service'

export class CourseService {
  static async getActiveCourses(
    userId?: string,
    language: SupportedLanguage = 'es'
  ): Promise<CourseWithInstructor[]> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Error al obtener cursos: ${error.message}`)
    }

    // Aplicar traducciones
    const translatedCourses = await TranslationService.applyTranslationsToArray(
      'course',
      data || [],
      ['title', 'description'],
      language
    )

    return translatedCourses
  }
}
```

---

## 🔄 Opción 3: Traducción Automática con IA (Complemento)

Para facilitar la creación de traducciones, se puede implementar un sistema de traducción automática usando OpenAI.

```typescript
// Archivo: apps/web/src/lib/i18n/auto-translate.service.ts

import OpenAI from 'openai'

export class AutoTranslateService {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  /**
   * Traduce un texto usando OpenAI
   */
  static async translate(
    text: string,
    targetLanguage: 'en' | 'pt',
    context?: string
  ): Promise<string> {
    const languageNames = {
      en: 'inglés',
      pt: 'portugués brasileño'
    }

    const prompt = `Traduce el siguiente texto de español a ${languageNames[targetLanguage]}.
${context ? `Contexto: ${context}` : ''}

Texto original:
${text}

Traducción:`

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un traductor profesional especializado en contenido educativo y tecnológico. Mantén el tono profesional y preciso.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })

      return completion.choices[0].message.content?.trim() || text
    } catch (error) {
      console.error('Error translating with OpenAI:', error)
      return text // Fallback al texto original
    }
  }

  /**
   * Traduce múltiples campos de un objeto
   */
  static async translateObject(
    obj: Record<string, string>,
    fields: string[],
    targetLanguage: 'en' | 'pt',
    context?: string
  ): Promise<Record<string, string>> {
    const translations: Record<string, string> = {}

    for (const field of fields) {
      if (obj[field]) {
        translations[field] = await this.translate(
          obj[field],
          targetLanguage,
          context
        )
      }
    }

    return translations
  }

  /**
   * Genera traducciones automáticas para un curso
   */
  static async autoTranslateCourse(courseId: string): Promise<void> {
    const supabase = await createClient()

    // Obtener curso
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (error || !course) {
      throw new Error('Curso no encontrado')
    }

    // Traducir a inglés
    const enTranslations = await this.translateObject(
      { title: course.title, description: course.description },
      ['title', 'description'],
      'en',
      'Curso educativo sobre tecnología'
    )

    // Traducir a portugués
    const ptTranslations = await this.translateObject(
      { title: course.title, description: course.description },
      ['title', 'description'],
      'pt',
      'Curso educativo sobre tecnología'
    )

    // Guardar traducciones
    await Promise.all([
      TranslationService.upsertTranslation(
        'course',
        courseId,
        'title',
        'en',
        enTranslations.title
      ),
      TranslationService.upsertTranslation(
        'course',
        courseId,
        'description',
        'en',
        enTranslations.description
      ),
      TranslationService.upsertTranslation(
        'course',
        courseId,
        'title',
        'pt',
        ptTranslations.title
      ),
      TranslationService.upsertTranslation(
        'course',
        courseId,
        'description',
        'pt',
        ptTranslations.description
      )
    ])
  }
}
```

---

## 📊 Comparación de Opciones

| Criterio | Opción 1: Columnas | Opción 2: Tabla Separada |
|----------|-------------------|--------------------------|
| **Complejidad** | Baja | Media-Alta |
| **Rendimiento** | Excelente | Bueno (con índices) |
| **Escalabilidad** | Limitada (3-5 idiomas) | Excelente (∞ idiomas) |
| **Mantenimiento** | Simple | Complejo |
| **Migración** | Directa | Requiere refactoring |
| **Tiempo implementación** | 2-3 días | 5-7 días |
| **Recomendado para** | MVP, pocos idiomas | Producción, muchos idiomas |

---

## 🎯 Recomendación Final

### Para Implementación Inmediata (MVP)

**Usar Opción 1: Columnas Multiidioma**

**Razones:**
1. ✅ Implementación rápida (2-3 días)
2. ✅ Compatible con código existente
3. ✅ Mejor rendimiento
4. ✅ Suficiente para 3 idiomas actuales (es, en, pt)
5. ✅ Migración simple desde datos existentes

**Plan de acción:**
1. Ejecutar migraciones SQL (Paso 1-2)
2. Crear servicio de localización (Paso 5)
3. Actualizar servicios existentes (Paso 6)
4. Actualizar componentes React (Paso 7)
5. Implementar formularios multiidioma (Paso 8)

### Para el Futuro (Escalabilidad)

Cuando se necesiten más de 5 idiomas o funcionalidades avanzadas:
- Migrar a **Opción 2: Tabla de Traducciones**
- Implementar **Opción 3: Traducción Automática con IA**
- Considerar servicios externos como Crowdin o Lokalise

---

## 📝 Tablas a Traducir (Prioridad)

### Alta Prioridad
- ✅ `courses` - Cursos (título, descripción)
- ✅ `course_modules` - Módulos (título, descripción)
- ✅ `course_lessons` - Lecciones (título, descripción, transcripción)

### Media Prioridad
- ⚠️ `lesson_activities` - Actividades (título, descripción, contenido)
- ⚠️ `lesson_materials` - Materiales (título, descripción)
- ⚠️ `ai_prompts` - Prompts IA (título, descripción, contenido)
- ⚠️ `ai_apps` - Apps IA (nombre, descripción)

### Baja Prioridad
- ℹ️ `communities` - Comunidades (nombre, descripción)
- ℹ️ `news` - Noticias (título, contenido)

---

## 🚀 Plan de Implementación Detallado

### Fase 1: Preparación (1 día)
- [ ] Backup completo de base de datos
- [ ] Crear branch de desarrollo: `feature/database-i18n`
- [ ] Documentar estructura actual

### Fase 2: Migraciones (1 día)
- [ ] Ejecutar migración para `courses`
- [ ] Ejecutar migración para `course_modules`
- [ ] Ejecutar migración para `course_lessons`
- [ ] Verificar integridad de datos

### Fase 3: Servicios Backend (1 día)
- [ ] Crear `DatabaseI18nService`
- [ ] Actualizar `CourseService`
- [ ] Actualizar `AdminCoursesService`
- [ ] Actualizar `InstructorWorkshopsService`
- [ ] Crear tests unitarios

### Fase 4: Frontend (1 día)
- [ ] Actualizar componentes de cursos
- [ ] Implementar formularios multiidioma en admin
- [ ] Implementar formularios multiidioma en instructor
- [ ] Probar cambio de idioma en tiempo real

### Fase 5: Testing (1 día)
- [ ] Pruebas de integración
- [ ] Pruebas de cambio de idioma
- [ ] Verificar fallbacks a español
- [ ] Testing en diferentes navegadores

### Fase 6: Despliegue (0.5 días)
- [ ] Ejecutar migraciones en producción
- [ ] Desplegar código nuevo
- [ ] Monitorear errores
- [ ] Documentar para el equipo

---

## 🔧 Configuración Adicional Requerida

### Variables de Entorno

```bash
# .env.local
OPENAI_API_KEY=sk-...  # Para traducción automática (opcional)
```

### Dependencias

No se requieren nuevas dependencias. El sistema actual ya tiene:
- ✅ `i18next`
- ✅ `react-i18next`
- ✅ `next-i18next`

---

## 📚 Recursos y Referencias

### Documentación
- [i18next Documentation](https://www.i18next.com/)
- [Supabase Internationalization](https://supabase.com/docs/guides/database/internationalization)
- [PostgreSQL Text Search](https://www.postgresql.org/docs/current/textsearch.html)

### Herramientas Útiles
- [Crowdin](https://crowdin.com/) - Plataforma de traducción colaborativa
- [Lokalise](https://lokalise.com/) - Gestión de traducciones
- [DeepL API](https://www.deepl.com/docs-api) - Traducción automática de calidad

---

## ⚠️ Consideraciones Importantes

### Rendimiento
- Las consultas con JOINs múltiples pueden ser lentas
- Usar índices apropiados
- Considerar caching de traducciones frecuentes
- Lazy loading de traducciones cuando sea posible

### SEO
- Implementar URLs multiidioma: `/es/curso/...`, `/en/course/...`
- Configurar meta tags con `hreflang`
- Sitemap separado por idioma

### Contenido Mixto
- ¿Qué pasa si una traducción no existe?
- Siempre usar español como fallback
- Indicar visualmente cuando se muestra traducción automática

### Mantenimiento
- Establecer proceso para actualizar traducciones
- Quién es responsable de traducir contenido nuevo
- Validación de calidad de traducciones

---

## 🎓 Ejemplo Completo de Uso

```typescript
// 1. Usuario cambia idioma en la UI
const { setLanguage } = useLanguage()
setLanguage('en')

// 2. El servicio automáticamente obtiene datos traducidos
const courses = await CourseService.getActiveCourses(userId, 'en')

// 3. Los componentes muestran el contenido traducido
<CourseCard 
  title={course.title}  // "Introduction to AI" (traducido)
  description={course.description}  // Descripción en inglés
/>

// 4. En el panel de admin, se pueden editar traducciones
<CourseForm 
  onSave={async (data) => {
    // Guardar en todos los idiomas
    await updateCourse({
      id: courseId,
      title: data.title,
      title_en: data.title_en,
      title_pt: data.title_pt,
      // ...
    })
  }}
/>
```

---

## ✅ Checklist de Validación

Antes de considerar la implementación completa:

- [ ] Las migraciones se ejecutaron sin errores
- [ ] Los datos existentes tienen copias en `*_en` y `*_pt`
- [ ] El servicio `DatabaseI18nService` funciona correctamente
- [ ] Los formularios de admin tienen tabs para cada idioma
- [ ] El cambio de idioma actualiza el contenido en tiempo real
- [ ] Los fallbacks funcionan cuando no hay traducción
- [ ] No hay errores en consola
- [ ] El rendimiento es aceptable (< 500ms por consulta)
- [ ] Los tests pasan exitosamente

---

## 🤝 Contribuyendo

Si necesitas agregar soporte para un nuevo idioma:

1. Agregar columnas `title_XX` y `description_XX` (Opción 1)
2. O agregar el código de idioma a la tabla `translations` (Opción 2)
3. Crear archivos de traducción UI: `locales/XX/common.json`
4. Actualizar `SupportedLanguage` type en `i18n.ts`
5. Actualizar `DatabaseI18nService.getLocalizedValue()`

---

## 📞 Soporte

Para preguntas o problemas:
- Revisar este documento
- Consultar logs de Supabase
- Verificar configuración de i18next
- Contactar al equipo de desarrollo

---

**Última actualización:** Noviembre 2025  
**Versión:** 1.0  
**Autor:** Equipo de Desarrollo Aprende y Aplica
