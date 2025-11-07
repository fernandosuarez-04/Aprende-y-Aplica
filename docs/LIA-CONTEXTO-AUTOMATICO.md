# LIA - Sistema de Detección Automática de Contexto

## 📋 Resumen

Se ha implementado un sistema inteligente que permite a **LIA (Learning Intelligence Assistant)** identificar automáticamente el área del sitio web donde se encuentra el usuario para ofrecer **información contextual relevante** y personalizada.

## ✨ Características Principales

### 1. Detección Automática de Contexto por URL

LIA ahora detecta automáticamente la sección del sitio web donde se encuentra el usuario basándose en la URL actual:

- **Comunidades** (`/communities`) - Información sobre comunidades, networking y participación
- **Cursos** (`/courses`) - Ayuda con cursos, inscripciones y contenido educativo
- **Talleres** (`/workshops`) - Información sobre talleres y eventos de formación
- **Noticias** (`/news`) - Actualizaciones y tendencias recientes
- **Dashboard** (`/dashboard`) - Navegación del panel personal y progreso
- **Directorio de Prompts** (`/prompt-directory`) - Creación y uso de prompts de IA
- **Panel de Negocios** (`/business-panel`) - Herramientas empresariales y análisis
- **Perfil** (`/profile`) - Configuración de cuenta y preferencias
- **General** - Asistencia general de la plataforma

### 2. Información Contextual Enriquecida

Para cada área detectada, LIA recibe:
- **Pathname**: La ruta exacta de la URL
- **Área detectada**: El contexto específico (communities, courses, etc.)
- **Descripción de la página**: Una explicación de lo que el usuario puede hacer en esa sección

### 3. Respuestas Priorizadas y Relevantes

LIA ajusta sus respuestas según el contexto:
- Prioriza información relevante al área actual
- Ofrece guías específicas para cada sección
- Proporciona ayuda contextual sin que el usuario tenga que explicar dónde está

## 🛠️ Implementación Técnica

### Archivos Modificados

#### 1. `AIChatAgent.tsx`
```typescript
// Función de detección de contexto basada en URL
function detectContextFromURL(pathname: string): string {
  if (pathname.includes('/communities')) return 'communities';
  if (pathname.includes('/courses')) return 'courses';
  // ... más contextos
  return 'general';
}

// Función para obtener descripción detallada de la página
function getPageContextInfo(pathname: string): string {
  // Mapea URLs a descripciones amigables
  // Ejemplo: '/communities' -> 'página de comunidades - donde los usuarios pueden unirse y participar en grupos'
}
```

**Características agregadas:**
- Hook `usePathname()` de Next.js para obtener la URL actual
- Detección automática del contexto en cada renderizado
- Envío de información contextual enriquecida al API

#### 2. `route.ts` (API de Chat)
```typescript
interface PageContext {
  pathname: string;
  description: string;
  detectedArea: string;
}

// Prompts contextualizados mejorados
const getContextPrompt = (
  context: string, 
  userName?: string,
  courseContext?: CourseLessonContext,
  pageContext?: PageContext
) => {
  // ... incluye información de la página actual en el prompt del sistema
}
```

**Mejoras en la API:**
- Nuevo parámetro `pageContext` en las solicitudes
- Prompts del sistema enriquecidos con información contextual
- Instrucciones específicas para priorizar información relevante

## 📊 Flujo de Funcionamiento

```
Usuario navega → /communities
         ↓
AIChatAgent detecta la URL
         ↓
Identifica contexto: "communities"
         ↓
Genera descripción: "página de comunidades..."
         ↓
Usuario abre LIA y pregunta algo
         ↓
Se envía al API:
  - message: "¿Cómo puedo unirme?"
  - context: "communities"
  - pageContext: { pathname, description, detectedArea }
         ↓
API procesa con prompt contextualizado
         ↓
LIA responde con información específica sobre comunidades
```

## 💡 Ejemplos de Uso

### Ejemplo 1: Usuario en Comunidades
```
Usuario en: /communities
Usuario pregunta: "¿Cómo funciona esto?"

LIA responde: "¡Hola! 😊 Veo que estás en la sección de Comunidades. 
Aquí puedes:
- Explorar comunidades disponibles
- Unirte a grupos de tu interés
- Participar en discusiones
- Conectar con otros miembros
..."
```

### Ejemplo 2: Usuario en Cursos
```
Usuario en: /courses/aprender-ia/learn
Usuario pregunta: "¿Qué puedo hacer aquí?"

LIA responde: "¡Hola! 📚 Estás en la página de aprendizaje del curso.
Aquí puedes:
- Ver el contenido de las lecciones
- Completar actividades
- Hacer seguimiento de tu progreso
- Acceder a recursos adicionales
..."
```

### Ejemplo 3: Usuario en Dashboard
```
Usuario en: /dashboard
Usuario pregunta: "¿Dónde veo mis cursos?"

LIA responde: "¡Hola! 👋 Estás en tu panel principal. Para ver tus cursos:
1. Busca la sección 'Mis Cursos' en esta página
2. O haz clic en 'Cursos' en el menú principal
3. También puedes usar el botón 'Continuar Aprendiendo' si tienes cursos en progreso
..."
```

## 🎯 Beneficios

### Para los Usuarios
- ✅ **Ayuda más relevante** sin necesidad de explicar dónde están
- ✅ **Respuestas contextualizadas** específicas a su situación actual
- ✅ **Experiencia más natural** y conversacional
- ✅ **Menos fricción** al buscar ayuda

### Para el Negocio
- ✅ **Mejor experiencia de usuario** = mayor satisfacción
- ✅ **Reducción de confusión** al navegar la plataforma
- ✅ **Mayor engagement** con el asistente de IA
- ✅ **Datos contextuales** para análisis de uso

## 🔍 Logging y Debugging

El sistema incluye logs detallados para debugging:

```typescript
console.log('🌐 Contexto detectado automáticamente:', {
  pathname,           // "/communities"
  detectedContext,    // "communities"
  activeContext,      // "communities" (o el contexto manual si se especificó)
  pageContextInfo     // "página de comunidades - donde los usuarios..."
});
```

## 🚀 Próximas Mejoras (Recomendadas)

1. **Contexto de Subrutas**: Detectar subrutas específicas (ej: `/courses/[slug]/learn`)
2. **Historial de Navegación**: Recordar las últimas páginas visitadas
3. **Contexto de Acciones**: Detectar si el usuario acaba de hacer algo específico
4. **Personalización Avanzada**: Ajustar respuestas según el rol del usuario
5. **Análisis de Patrones**: Aprender de las preguntas más comunes por contexto

## 📝 Notas Técnicas

- ✅ Compatible con SSR y CSR de Next.js
- ✅ No requiere cambios en páginas existentes
- ✅ Funciona con el sistema de routing de Next.js App Router
- ✅ Se integra con el sistema de analytics existente (LiaLogger)
- ✅ Mantiene retrocompatibilidad con contextos manuales

## 🧪 Testing

Para probar la funcionalidad:

1. Navega a diferentes secciones del sitio (`/communities`, `/courses`, etc.)
2. Abre el chatbot de LIA
3. Haz preguntas generales como "¿Qué puedo hacer aquí?" o "¿Cómo funciona esto?"
4. Observa cómo LIA ajusta sus respuestas según la página actual
5. Revisa los logs de consola para ver el contexto detectado

## 📞 Soporte

Si tienes preguntas o sugerencias sobre esta funcionalidad, contacta al equipo de desarrollo.

---

**Fecha de Implementación**: 6 de noviembre de 2025  
**Versión**: 1.0  
**Autor**: Sistema de IA de Ecos de Liderazgo
