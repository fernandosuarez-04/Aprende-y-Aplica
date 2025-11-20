# Sistema de Traducción de Contenido Dinámico

## 🎯 Descripción

Sistema de traducción automática para contenido de base de datos **sin modificar el esquema**. Usa archivos JSON similares a i18next para traducir cursos, módulos y lecciones.

## ✅ Ventajas

- ✅ **No modifica la base de datos** - Todo en archivos JSON
- ✅ **Mismo sistema que i18next** - Consistente con UI
- ✅ **Cambio automático** - Traduce al cambiar idioma
- ✅ **Fácil de mantener** - Archivos JSON editables
- ✅ **Rendimiento** - Sin queries extra a BD

## 📁 Estructura de Archivos

```
apps/web/public/locales/
├── es/
│   ├── common.json
│   ├── dashboard.json
│   └── content.json     ← Contenido de BD en español
├── en/
│   ├── common.json
│   ├── dashboard.json
│   └── content.json     ← Contenido de BD en inglés
└── pt/
    ├── common.json
    ├── dashboard.json
    └── content.json     ← Contenido de BD en portugués
```

## 📝 Formato de Archivos de Traducción

### Estructura JSON

```json
{
  "courses": {
    "uuid-del-curso-1": {
      "title": "Introduction to Artificial Intelligence",
      "description": "Learn the fundamentals of AI and machine learning"
    },
    "uuid-del-curso-2": {
      "title": "Advanced Python Programming",
      "description": "Master Python with advanced techniques"
    }
  },
  "modules": {
    "uuid-del-modulo-1": {
      "module_title": "Getting Started with AI",
      "module_description": "Introduction to AI concepts"
    }
  },
  "lessons": {
    "uuid-de-leccion-1": {
      "lesson_title": "What is Machine Learning?",
      "lesson_description": "Understanding ML basics",
      "transcript_content": "Welcome to this lesson about..."
    }
  }
}
```

## 🚀 Uso en Componentes

### Opción 1: Hook Simple (Recomendado)

```typescript
import { useTranslatedContent } from '@/core/hoc/withContentTranslation'

function CoursesPage() {
  const [courses, setCourses] = useState([])
  
  // Traduce automáticamente según el idioma actual
  const translatedCourses = useTranslatedContent(
    'courses',
    courses,
    ['title', 'description']
  )

  return (
    <div>
      {translatedCourses.map(course => (
        <CourseCard 
          key={course.id}
          title={course.title}  // Ya está traducido
          description={course.description}  // Ya está traducido
        />
      ))}
    </div>
  )
}
```

### Opción 2: Hook de Traducción Manual

```typescript
import { useContentTranslation } from '@/core/hooks/useContentTranslation'

function CourseDetail({ courseId }) {
  const [course, setCourse] = useState(null)
  const { translateEntity } = useContentTranslation()

  useEffect(() => {
    // Obtener curso de la BD
    const data = await getCourse(courseId)
    
    // Traducir automáticamente
    const translated = translateEntity('courses', data, ['title', 'description'])
    setCourse(translated)
  }, [courseId])

  return <h1>{course?.title}</h1>
}
```

### Opción 3: HOC (para componentes existentes)

```typescript
import { withContentTranslation } from '@/core/hoc/withContentTranslation'

// Componente original
function CoursesList({ data }) {
  return data.map(course => <div>{course.title}</div>)
}

// Componente con traducción automática
const TranslatedCoursesList = withContentTranslation(
  CoursesList,
  'courses',
  ['title', 'description']
)

// Uso
<TranslatedCoursesList data={courses} />
```

## 🔄 Traducción Automática al Cambiar Idioma

El sistema detecta automáticamente cuando el usuario cambia de idioma:

```typescript
// El usuario cambia el idioma en el dropdown
const { setLanguage } = useLanguage()
setLanguage('en')  // ← Automáticamente se retraducen los componentes
```

## 📊 Cómo Agregar Traducciones

### Método 1: Manual (JSON)

1. Obtén el ID del curso/módulo/lección desde Supabase
2. Edita `/public/locales/{lang}/content.json`
3. Agrega la traducción:

```json
{
  "courses": {
    "550e8400-e29b-41d4-a716-446655440000": {
      "title": "Artificial Intelligence Fundamentals",
      "description": "Learn AI from scratch"
    }
  }
}
```

### Método 2: Script de Generación (Futuro)

```bash
# Generar traducciones automáticas con IA
npm run translate:content -- --entity course --id UUID --lang en
```

### Método 3: Panel de Admin (Futuro)

Interfaz visual para editar traducciones directamente desde el admin panel.

## 🛠️ API de Servicios

### ContentTranslationService

```typescript
import { ContentTranslationService } from '@/core/services/contentTranslation.service'

// Cargar traducciones
await ContentTranslationService.loadTranslations('en')

// Traducir un objeto
const translatedCourse = ContentTranslationService.translateObject(
  'en',
  'courses',
  course,
  ['title', 'description']
)

// Traducir un array
const translatedCourses = ContentTranslationService.translateArray(
  'en',
  'courses',
  courses,
  ['title', 'description']
)

// Verificar si existe traducción
const hasTranslation = ContentTranslationService.hasTranslation(
  'en',
  'courses',
  courseId,
  'title'
)

// Actualizar traducción (solo en memoria)
await ContentTranslationService.updateTranslation(
  'en',
  'courses',
  courseId,
  'title',
  'New Title'
)
```

## 📦 Ejemplo Completo

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/core/providers/I18nProvider'
import { useTranslatedContent } from '@/core/hoc/withContentTranslation'
import { CourseService } from '@/features/courses/services/course.service'

export default function CoursesPage() {
  const { language } = useLanguage()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  // Obtener cursos de la BD
  useEffect(() => {
    async function loadCourses() {
      setLoading(true)
      const data = await CourseService.getActiveCourses()
      setCourses(data)
      setLoading(false)
    }
    loadCourses()
  }, [])

  // Traducir automáticamente
  const translatedCourses = useTranslatedContent(
    'courses',
    courses,
    ['title', 'description']
  )

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Cursos en {language}</h1>
      {translatedCourses.map(course => (
        <div key={course.id}>
          <h2>{course.title}</h2>
          <p>{course.description}</p>
        </div>
      ))}
    </div>
  )
}
```

## 🎨 Componente de Formulario para Traducciones

```typescript
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TranslationFormProps {
  entityId: string
  entityType: 'courses' | 'modules' | 'lessons'
  defaultValues: {
    es: { title: string; description: string }
    en: { title: string; description: string }
    pt: { title: string; description: string }
  }
  onSave: (translations: any) => void
}

export function TranslationForm({ entityId, entityType, defaultValues, onSave }: TranslationFormProps) {
  const [translations, setTranslations] = useState(defaultValues)

  return (
    <Tabs defaultValue="es">
      <TabsList>
        <TabsTrigger value="es">🇪🇸 Español</TabsTrigger>
        <TabsTrigger value="en">🇬🇧 Inglés</TabsTrigger>
        <TabsTrigger value="pt">🇵🇹 Portugués</TabsTrigger>
      </TabsList>

      {(['es', 'en', 'pt'] as const).map(lang => (
        <TabsContent key={lang} value={lang}>
          <div className="space-y-4">
            <div>
              <label>Título</label>
              <input
                value={translations[lang].title}
                onChange={(e) => setTranslations({
                  ...translations,
                  [lang]: { ...translations[lang], title: e.target.value }
                })}
              />
            </div>
            <div>
              <label>Descripción</label>
              <textarea
                value={translations[lang].description}
                onChange={(e) => setTranslations({
                  ...translations,
                  [lang]: { ...translations[lang], description: e.target.value }
                })}
              />
            </div>
          </div>
        </TabsContent>
      ))}

      <button onClick={() => onSave(translations)}>
        Guardar Traducciones
      </button>
    </Tabs>
  )
}
```

## 🔧 Migración de Código Existente

### Antes (sin traducción)

```typescript
function CourseCard({ course }) {
  return (
    <div>
      <h2>{course.title}</h2>
      <p>{course.description}</p>
    </div>
  )
}
```

### Después (con traducción automática)

```typescript
import { useTranslatedObject } from '@/core/hoc/withContentTranslation'

function CourseCard({ course }) {
  const translatedCourse = useTranslatedObject(
    'courses',
    course,
    ['title', 'description']
  )
  
  return (
    <div>
      <h2>{translatedCourse.title}</h2>
      <p>{translatedCourse.description}</p>
    </div>
  )
}
```

## ⚙️ Configuración

El sistema se configura automáticamente en `apps/web/src/core/i18n/i18n.ts`:

```typescript
import contentEs from '../../../public/locales/es/content.json';
import contentEn from '../../../public/locales/en/content.json';
import contentPt from '../../../public/locales/pt/content.json';

const resources: Resource = {
  es: {
    common: commonEs,
    dashboard: dashboardEs,
    content: contentEs,  // ← Nuevo namespace
  },
  // ...
};
```

## 🎯 Casos de Uso

### 1. Lista de Cursos

```typescript
const translatedCourses = useTranslatedContent('courses', courses, ['title', 'description'])
```

### 2. Detalle de Curso

```typescript
const translatedCourse = useTranslatedObject('courses', course, ['title', 'description'])
```

### 3. Módulos de un Curso

```typescript
const translatedModules = useTranslatedContent('modules', modules, ['module_title', 'module_description'])
```

### 4. Lecciones de un Módulo

```typescript
const translatedLessons = useTranslatedContent('lessons', lessons, ['lesson_title', 'lesson_description', 'transcript_content'])
```

## 📈 Rendimiento

- ✅ **Sin queries extra**: No hace peticiones adicionales a la BD
- ✅ **Carga lazy**: Solo carga traducciones cuando se necesitan
- ✅ **Cache en memoria**: Las traducciones se cachean
- ✅ **Fallback a español**: Si no hay traducción, muestra el original

## 🐛 Troubleshooting

### Las traducciones no aparecen

1. Verifica que el archivo `content.json` existe en `/public/locales/{lang}/`
2. Verifica que el ID del curso/módulo/lección es correcto
3. Revisa la consola para errores de carga

### El idioma no cambia automáticamente

1. Verifica que usas `useTranslatedContent` o `useTranslatedObject`
2. Asegúrate de que el componente se re-renderiza al cambiar idioma

### Formato JSON incorrecto

```json
// ❌ Incorrecto
{
  "courses": [
    { "id": "123", "title": "..." }
  ]
}

// ✅ Correcto
{
  "courses": {
    "123": {
      "title": "..."
    }
  }
}
```

## 🚀 Próximos Pasos

1. **Script de generación**: Crear script que genere traducciones con IA
2. **Panel de admin**: Interfaz visual para editar traducciones
3. **Sincronización**: Sistema para sincronizar con archivo JSON
4. **Validación**: Detectar traducciones faltantes
5. **Backup**: Sistema de respaldo de traducciones

## 📚 Recursos

- [react-i18next](https://react.i18next.com/)
- [i18next](https://www.i18next.com/)
- Archivo: `/apps/web/src/core/hooks/useContentTranslation.ts`
- Archivo: `/apps/web/src/core/services/contentTranslation.service.ts`
- Archivo: `/apps/web/src/core/hoc/withContentTranslation.tsx`

---

**Última actualización:** Noviembre 2025  
**Versión:** 1.0  
**Mantenedor:** Equipo de Desarrollo
