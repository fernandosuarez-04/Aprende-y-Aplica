# Guía de la Página de Estadísticas y Personalización

## 📊 Descripción General

La página de estadísticas (`/statistics`) es una funcionalidad avanzada que permite a los usuarios personalizar su experiencia de aprendizaje y visualizar su progreso de manera detallada. Esta página integra datos de múltiples tablas de la base de datos para ofrecer una experiencia personalizada y basada en datos.

## 🏗️ Arquitectura de la Página

### Estructura de Componentes

```
/statistics
├── StatisticsPage (Componente principal)
├── ProfilePersonalizationSection
├── LearningStatisticsSection
├── AIAdoptionSection
├── ProfileInfoCard
└── StatCard
```

### APIs Implementadas

```
/api/statistics/
├── reference-data/     # Datos de referencia (niveles, roles, áreas, etc.)
├── profile/           # Perfil profesional del usuario
└── learning-stats/    # Estadísticas de aprendizaje
```

## 🗄️ Integración con Base de Datos

### Tablas de Referencia Utilizadas

#### 1. **niveles**
- **Propósito**: Define niveles de competencia (Principiante, Intermedio, Avanzado, Experto)
- **Campos**: `id`, `nombre`, `slug`
- **Uso**: Clasificación del nivel actual del usuario

#### 2. **roles**
- **Propósito**: Define roles profesionales (CEO, CTO, Desarrollador UX/UI, etc.)
- **Campos**: `id`, `nombre`, `slug`, `area_id`
- **Uso**: Personalización basada en el rol profesional

#### 3. **areas**
- **Propósito**: Define áreas funcionales (Tecnología, Marketing, Finanzas, etc.)
- **Campos**: `id`, `nombre`, `slug`
- **Uso**: Segmentación por área de expertise

#### 4. **relaciones**
- **Propósito**: Define tipos de relación laboral (Empleado, Freelancer, Consultor, etc.)
- **Campos**: `id`, `nombre`, `slug`
- **Uso**: Personalización según el tipo de relación laboral

#### 5. **tamanos_empresa**
- **Propósito**: Define tamaños de empresa por número de empleados
- **Campos**: `id`, `nombre`, `min_empleados`, `max_empleados`
- **Uso**: Contextualización según el tamaño de la organización

#### 6. **sectores**
- **Propósito**: Define sectores industriales (Tecnología, Salud, Educación, etc.)
- **Campos**: `id`, `nombre`, `slug`
- **Uso**: Personalización por sector industrial

### Tablas de Datos del Usuario

#### 1. **user_perfil**
- **Propósito**: Almacena el perfil profesional detallado del usuario
- **Campos**: `user_id`, `cargo_titulo`, `rol_id`, `nivel_id`, `area_id`, `relacion_id`, `tamano_id`, `sector_id`, `pais`
- **Uso**: Base para toda la personalización

#### 2. **respuestas**
- **Propósito**: Almacena las respuestas del usuario a preguntas/actividades
- **Campos**: `user_id`, `pregunta_id`, `valor`, `respondido_en`
- **Uso**: Cálculo de estadísticas de aprendizaje

#### 3. **preguntas**
- **Propósito**: Define las preguntas y actividades del sistema
- **Campos**: `id`, `codigo`, `section`, `bloque`, `area_id`, `tipo`, `peso`, `scoring`
- **Uso**: Contexto para las respuestas y cálculo de métricas

#### 4. **adopcion_genai**
- **Propósito**: Métricas de adopción de IA generativa
- **Campos**: `pais`, `indice_aipi`, `fuente`, `fecha_fuente`
- **Uso**: Estadísticas de adopción de IA

## 🎨 Características de Diseño

### Animaciones y Transiciones

#### 1. **Framer Motion Integration**
- **Transiciones de página**: Fade in/out con desplazamiento
- **Hover effects**: Escalado y elevación de tarjetas
- **Loading states**: Spinners animados y transiciones suaves
- **Form interactions**: Animaciones de validación y envío

#### 2. **Efectos Visuales**
- **Gradientes**: Fondos con gradientes dinámicos
- **Backdrop blur**: Efectos de desenfoque para profundidad
- **Glassmorphism**: Tarjetas con efecto de cristal
- **Color coding**: Sistema de colores por categorías

### Responsive Design

#### 1. **Breakpoints**
- **Mobile**: < 768px - Layout de una columna
- **Tablet**: 768px - 1024px - Layout de dos columnas
- **Desktop**: > 1024px - Layout completo de tres columnas

#### 2. **Adaptaciones**
- **Navegación**: Tabs colapsables en móvil
- **Formularios**: Campos apilados verticalmente
- **Tarjetas**: Tamaños adaptativos según pantalla

## 📈 Funcionalidades Implementadas

### 1. **Personalización de Perfil Profesional**

#### Formulario de Perfil
- **Cargo/Título**: Campo de texto libre
- **Nivel Organizacional**: Dropdown con niveles predefinidos
- **Área Funcional**: Dropdown con áreas de expertise
- **Tipo de Relación**: Dropdown con tipos de relación laboral
- **Sector**: Campo opcional para sector industrial
- **Tamaño de Empresa**: Dropdown con rangos de empleados

#### Validaciones
- **Campos requeridos**: Cargo, Nivel, Área, Tipo de Relación
- **Validación en tiempo real**: Feedback visual inmediato
- **Persistencia**: Guardado automático en base de datos

### 2. **Dashboard de Estadísticas de Aprendizaje**

#### Métricas Principales
- **Preguntas Respondidas**: Total de actividades completadas
- **Precisión**: Porcentaje de respuestas correctas
- **Tiempo Promedio**: Tiempo promedio por actividad
- **Secciones Completadas**: Número de módulos terminados

#### Visualizaciones
- **Tarjetas de métricas**: Con iconos y colores temáticos
- **Barras de progreso**: Animadas con gradientes
- **Gráficos de tendencias**: Para mostrar evolución temporal

### 3. **Métricas de Adopción de IA**

#### Índice AIPI (AI Proficiency Index)
- **Cálculo**: Basado en actividad y precisión del usuario
- **Rango**: 0-100 puntos
- **Factores**: Número de preguntas, precisión, tiempo de respuesta

#### Niveles de Competencia
- **Principiante**: 0-25 puntos
- **Intermedio**: 26-50 puntos
- **Avanzado**: 51-75 puntos
- **Experto**: 76-100 puntos

## 🔧 Configuración y Uso

### Para Desarrolladores

#### 1. **Instalación de Dependencias**
```bash
npm install framer-motion lucide-react
```

#### 2. **Configuración de Base de Datos**
- Crear las tablas de referencia según el esquema proporcionado
- Configurar las relaciones entre tablas
- Insertar datos iniciales para las tablas de referencia

#### 3. **Variables de Entorno**
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### Para Administradores

#### 1. **Gestión de Datos de Referencia**
- **Niveles**: Definir niveles de competencia apropiados
- **Roles**: Mantener actualizada la lista de roles profesionales
- **Áreas**: Asegurar cobertura de todas las áreas funcionales
- **Sectores**: Mantener lista actualizada de sectores industriales

#### 2. **Monitoreo de Métricas**
- **Estadísticas de uso**: Revisar métricas de adopción
- **Feedback de usuarios**: Recopilar comentarios sobre personalización
- **Optimización**: Ajustar algoritmos de recomendación

## 🚀 Próximas Mejoras

### Funcionalidades Planificadas

#### 1. **Recomendaciones Inteligentes**
- **Algoritmos de ML**: Para sugerir contenido personalizado
- **Análisis de comportamiento**: Para optimizar la experiencia
- **Predicción de necesidades**: Para anticipar requerimientos del usuario

#### 2. **Comparativas y Benchmarking**
- **Comparación con pares**: Estadísticas comparativas por rol/área
- **Rankings**: Posición del usuario en su categoría
- **Insights**: Análisis de fortalezas y áreas de mejora

#### 3. **Integración con IA**
- **Chatbot personalizado**: Basado en el perfil del usuario
- **Generación de contenido**: Contenido adaptado al nivel y rol
- **Análisis predictivo**: Predicción de éxito en diferentes áreas

### Mejoras Técnicas

#### 1. **Performance**
- **Lazy loading**: Carga diferida de componentes pesados
- **Caching**: Cache inteligente de datos de referencia
- **Optimización de consultas**: Mejora de performance de base de datos

#### 2. **Accesibilidad**
- **ARIA labels**: Mejora de accesibilidad para lectores de pantalla
- **Keyboard navigation**: Navegación completa por teclado
- **High contrast**: Modo de alto contraste para usuarios con discapacidades visuales

## 📝 Notas de Implementación

### Consideraciones de Seguridad
- **Validación de datos**: Sanitización de inputs del usuario
- **Autorización**: Verificación de permisos para acceso a datos
- **Rate limiting**: Protección contra abuso de APIs

### Consideraciones de Performance
- **Optimización de imágenes**: Uso de formatos modernos y compresión
- **Bundle splitting**: División del código para carga eficiente
- **CDN**: Uso de CDN para assets estáticos

### Consideraciones de UX
- **Loading states**: Estados de carga claros y atractivos
- **Error handling**: Manejo elegante de errores
- **Feedback visual**: Confirmaciones claras de acciones del usuario

---

*Esta guía se actualiza regularmente según las mejoras y nuevas funcionalidades implementadas.*
