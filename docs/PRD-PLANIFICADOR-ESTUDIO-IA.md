# PRD: Planificador de Estudio Personalizado con IA

## 1. Visión General

### 1.1 Propósito
Personalizar la experiencia de aprendizaje del usuario en el Planificador de Estudio mediante dos modalidades: configuración manual y generación automática con IA (Lia), considerando el rol profesional, cursos adquiridos, progreso y validaciones de tiempo.

### 1.2 Alcance
- **Modalidad Manual**: Usuario configura su plan considerando tiempos mínimos por lección
- **Modalidad IA**: Lia genera plan automático basado en múltiples factores
- **Sistema de validaciones**: Tiempo mínimo = duración completa de lección
- **Sistema de incentivos**: Rachas y seguimiento
- **Integración automática**: Calendarios externos

### 1.3 Usuarios Objetivo
- Todos los usuarios registrados con cursos/talleres adquiridos
- Usuarios con perfil completo (incluyendo `user_perfil.rol_id`)

### 1.4 Objetivos de Negocio
- **+40%** en tasa de completitud de cursos
- **+60%** en consistencia de estudio (rachas)
- **-50%** en tiempo de configuración de planes
- **+30%** en satisfacción del usuario

---

## 2. Análisis de Base de Datos

### 2.1 Tablas Principales

#### `users`
- `id` (uuid): Identificador único
- `cargo_rol` (text): Rol del sistema (Usuario, Instructor, Administrador, Business, Business User)
- `type_rol` (text): Cargo profesional del usuario (obtenido del cuestionario)
- `email`, `username`, etc.

#### `user_perfil`
- `id` (uuid): Identificador único
- `user_id` (uuid): Referencia a `users.id`
- `rol_id` (integer): **Referencia a `roles.id` - ROL PROFESIONAL PRINCIPAL**
- `area_id` (integer): Referencia a `areas.id`
- `cargo_titulo` (text): Título del cargo
- `nivel_id`, `sector_id`, `tamano_id`, etc.

#### `roles`
- `id` (integer): Identificador único
- `slug` (text): Identificador URL-friendly (ej: "ceo", "gerente-marketing")
- `nombre` (text): Nombre del rol (ej: "CEO", "Gerente de Marketing")
- `area_id` (integer): Referencia a `areas.id` para categorización

#### `areas`
- `id` (integer): Identificador único
- `slug` (text): Identificador URL-friendly
- `nombre` (text): Nombre del área

#### `courses`
- `id` (uuid): Identificador único
- `title`, `description`
- `category` (varchar): Categoría del curso (ej: 'ia', 'marketing', 'tecnologia')
- `level` (varchar): Nivel de dificultad - **'beginner' | 'intermediate' | 'advanced'**
- `duration_total_minutes` (integer): Duración total del curso
- `learning_objectives` (jsonb): Objetivos de aprendizaje

#### `course_lessons`
- `lesson_id` (uuid): Identificador único
- `duration_seconds` (integer): **Duración del video en segundos**
- `lesson_title`, `lesson_description`
- `module_id`: Referencia a módulo
- `transcript_content`, `summary_content`

#### `lesson_activities`
- `activity_id` (uuid): Identificador único
- `lesson_id` (uuid): Referencia a `course_lessons.lesson_id`
- `activity_type`: 'reflection' | 'exercise' | 'quiz' | 'discussion' | 'ai_chat'
- `activity_content` (text): Contenido de la actividad
- `is_required` (boolean): Si es obligatoria
- `ai_prompts` (text): Prompts para Lia

#### `lesson_materials`
- `material_id` (uuid): Identificador único
- `lesson_id` (uuid): Referencia a `course_lessons.lesson_id`
- `material_type`: 'pdf' | 'link' | 'document' | 'quiz' | 'exercise' | 'reading'
- `content_data` (jsonb): Contenido del material
- `file_url`, `external_url`

#### `study_plans`
- `id` (uuid): Identificador único
- `user_id` (uuid): Referencia a `users.id`
- `name`, `description`
- `goal_hours_per_week` (numeric)
- `preferred_days` (array): Días de la semana preferidos
- `preferred_time_blocks` (jsonb): Bloques de tiempo personalizados

#### `study_sessions`
- `id` (uuid): Identificador único
- `plan_id` (uuid): Referencia a `study_plans.id`
- `user_id` (uuid): Referencia a `users.id`
- `title`, `description`
- `course_id` (text): Referencia a curso
- `start_time`, `end_time` (timestamp)
- `duration_minutes` (integer): Calculado automáticamente
- `status`: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'skipped'
- `recurrence` (jsonb): Reglas de recurrencia
- `metrics` (jsonb): Métricas de la sesión

#### `study_preferences`
- `id` (uuid): Identificador único
- `user_id` (uuid): Referencia a `users.id` (UNIQUE)
- `preferred_time_of_day`: 'morning' | 'afternoon' | 'evening' | 'night'
- `preferred_days` (array): Días preferidos
- `daily_target_minutes`, `weekly_target_minutes`
- `preferred_session_type`: 'short' | 'medium' | 'long' - **Tipo de sesión preferido**

### 2.2 Relaciones Clave

```
users (1) ──< (N) user_perfil
user_perfil (N) ──> (1) roles
user_perfil (N) ──> (1) areas
roles (N) ──> (1) areas

users (1) ──< (N) course_purchases
course_purchases (N) ──> (1) courses
courses (1) ──< (N) course_modules
course_modules (1) ──< (N) course_lessons
course_lessons (1) ──< (N) lesson_activities
course_lessons (1) ──< (N) lesson_materials

users (1) ──< (N) study_plans
study_plans (1) ──< (N) study_sessions
users (1) ──> (1) study_preferences
```

### 2.3 Obtención del Perfil Profesional Completo

**Prioridad de fuentes para el rol:**
1. `users.type_rol` (cargo profesional del usuario - PRINCIPAL)
2. `user_perfil.rol_id` → `roles.nombre` (si existe perfil completo)
3. `user_perfil.cargo_titulo` (fallback si no hay rol_id)

**Datos adicionales del perfil:**
- `user_perfil.area_id` → `areas.nombre`: Área profesional
- `user_perfil.tamano_id` → `tamanos_empresa`: Tamaño de empresa (min_empleados, max_empleados)
- `user_perfil.nivel_id` → `niveles.nombre`: Nivel jerárquico
- `user_perfil.sector_id` → `sectores.nombre`: Sector de la industria
- `user_perfil.relacion_id` → `relaciones.nombre`: Tipo de relación laboral

**Consulta SQL completa:**
```sql
SELECT 
  u.id as user_id,
  -- Rol profesional (prioridad: type_rol > rol_id > cargo_titulo)
  COALESCE(u.type_rol, r.nombre, up.cargo_titulo, 'Usuario') as rol_profesional,
  r.slug as rol_slug,
  r.id as rol_id,
  -- Área
  a.nombre as area_nombre,
  a.id as area_id,
  -- Tamaño de empresa
  te.nombre as tamano_empresa_nombre,
  te.min_empleados,
  te.max_empleados,
  te.id as tamano_id,
  -- Nivel
  n.nombre as nivel_nombre,
  n.id as nivel_id,
  -- Sector
  s.nombre as sector_nombre,
  s.id as sector_id,
  -- Relación
  rel.nombre as relacion_nombre,
  rel.id as relacion_id
FROM users u
LEFT JOIN user_perfil up ON u.id = up.user_id
LEFT JOIN roles r ON up.rol_id = r.id
LEFT JOIN areas a ON COALESCE(up.area_id, r.area_id) = a.id
LEFT JOIN tamanos_empresa te ON up.tamano_id = te.id
LEFT JOIN niveles n ON up.nivel_id = n.id
LEFT JOIN sectores s ON up.sector_id = s.id
LEFT JOIN relaciones rel ON up.relacion_id = rel.id
WHERE u.id = $1;
```

**Importancia del tamaño de empresa:**
- **Empresa pequeña (1-50 empleados)**: Mayor flexibilidad, más tiempo disponible
- **Empresa mediana (51-250 empleados)**: Tiempo moderado, horarios más estructurados
- **Empresa grande (251-1000 empleados)**: Tiempo limitado, horarios muy estructurados
- **Empresa muy grande (1000+ empleados)**: Tiempo muy limitado, necesita sesiones cortas y eficientes

---

## 3. Mejores Prácticas de Estudio Basadas en Investigación

### 3.1 Fundamentos Científicos

El planificador incorpora técnicas de estudio respaldadas por investigación científica para maximizar la retención y eficiencia del aprendizaje.

### 3.2 Técnicas Principales

#### 3.2.1 Repetición Espaciada (Spaced Repetition)

**Base Científica**: Curva de olvido de Ebbinghaus - La información se olvida exponencialmente, pero los repasos estratégicos fortalecen la memoria a largo plazo.

**Implementación**:
- Programar repasos automáticos de lecciones completadas
- Intervalos crecientes: 1 día, 3 días, 7 días, 14 días, 30 días
- Ajustar intervalos según rendimiento del usuario
- Priorizar repasos de contenido con menor retención

**Algoritmo de Intervalos**:
```
Primer repaso: 1 día después de completar
Segundo repaso: 3 días después (si retención > 70%)
Tercer repaso: 7 días después (si retención > 70%)
Cuarto repaso: 14 días después (si retención > 70%)
Repasos subsecuentes: 30 días, 60 días, 90 días
```

**Beneficios**:
- Mejora la retención en un 40% comparado con estudio masivo
- Reduce tiempo total de estudio
- Fortalece memoria a largo plazo

#### 3.2.2 Active Recall (Recuperación Activa)

**Base Científica**: Efecto de testing - Recuperar información de la memoria fortalece más las conexiones neuronales que simplemente releer.

**Implementación**:
- Generar preguntas automáticas basadas en el contenido
- Incluir sesiones de auto-evaluación después de cada lección
- Promover explicación del contenido con propias palabras
- Integrar con actividades de Lia para práctica activa

**Estrategias**:
- Preguntas de comprensión al final de cada lección
- Ejercicios de "explica con tus propias palabras"
- Quizzes de repaso antes de avanzar
- Flashcards inteligentes generadas automáticamente

**Beneficios**:
- Mejora retención en un 50% vs. relectura pasiva
- Identifica vacíos de conocimiento
- Fortalece comprensión profunda

#### 3.2.3 Técnica Pomodoro

**Base Científica**: La atención sostenida disminuye después de 25-50 minutos. Los descansos restauran la capacidad cognitiva.

**Implementación**:
- Sesiones de estudio: 25-50 minutos (según rol y preferencia)
- Descansos cortos: 5 minutos entre sesiones
- Descansos largos: 15-30 minutos después de 4 sesiones
- Timer integrado en la interfaz de estudio

**Configuración por Rol y Tamaño de Empresa**:
- **Ejecutivos grandes empresas**: 25-30 min sesiones, 5 min descansos
- **Ejecutivos pequeñas empresas**: 30-45 min sesiones, 5-10 min descansos
- **Gerentes**: 30-45 min sesiones, 5-10 min descansos
- **Miembros de equipo**: 45-50 min sesiones, 5-10 min descansos
- **Especializados (Academia, etc.)**: 50-60 min sesiones, 10-15 min descansos

**Beneficios**:
- Mantiene alta concentración
- Previene fatiga mental
- Aumenta productividad en un 25%

#### 3.2.4 Práctica Distribuida (Distributed Practice)

**Base Científica**: Espaciar el estudio en múltiples sesiones es más efectivo que concentrarlo (cramming).

**Implementación**:
- Distribuir lecciones a lo largo de días/semanas
- Evitar agrupar múltiples lecciones del mismo curso en un día
- Alternar entre diferentes cursos/temas
- Programar sesiones regulares (no masivas)

**Reglas de Distribución**:
- Máximo 2-3 lecciones por día (según rol y tamaño de empresa)
- Mínimo 1 día entre lecciones del mismo curso
- Alternar cursos diferentes en días consecutivos
- Respetar días de descanso

**Beneficios**:
- Mejora retención a largo plazo en un 35%
- Reduce fatiga cognitiva
- Facilita consolidación de memoria

#### 3.2.5 Estudio Intercalado (Interleaving)

**Base Científica**: Alternar entre diferentes temas mejora la discriminación conceptual y flexibilidad cognitiva.

**Implementación**:
- Alternar entre diferentes cursos en la misma semana
- Mezclar tipos de contenido (video, lectura, práctica)
- Variar dificultad dentro de una sesión
- Combinar teoría y práctica

**Estrategias**:
- No estudiar solo un curso por semana completa
- Alternar entre cursos cada 1-2 días
- Mezclar lecciones teóricas con prácticas
- Combinar lectura con ejercicios

**Beneficios**:
- Mejora transferencia de conocimiento
- Aumenta flexibilidad cognitiva
- Mejora discriminación entre conceptos similares

#### 3.2.6 Elaboración y Autoexplicación

**Base Científica**: Conectar nueva información con conocimiento previo y explicarla fortalece la comprensión.

**Implementación**:
- Promover toma de notas activa
- Sugerir conexiones con conocimiento previo
- Actividades de "explica con tus propias palabras"
- Integración con Lia para discusión y elaboración

**Beneficios**:
- Mejora comprensión profunda
- Facilita transferencia de conocimiento
- Identifica vacíos de comprensión

### 3.3 Tipos de Sesiones y Duración Óptima

El sistema ofrece **3 tipos de sesiones** que el usuario puede seleccionar según sus preferencias y disponibilidad:

#### 3.3.1 Sesión Corta (Quick Session)
- **Duración**: 20-35 minutos
- **Descanso**: 5 minutos
- **Aplicación**: 
  - Ejecutivos con tiempo muy limitado
  - Sesiones de repaso rápido
  - Contenido introductorio o de nivel básico
  - Micro-aprendizaje
- **Ventajas**: 
  - Fácil de encajar en agendas apretadas
  - Mantiene alta concentración
  - Ideal para hábitos diarios

#### 3.3.2 Sesión Media (Standard Session)
- **Duración**: 45-60 minutos
- **Descanso**: 10 minutos
- **Aplicación**:
  - Mayoría de roles profesionales
  - Lecciones completas estándar
  - Contenido de nivel intermedio
  - Balance entre profundidad y tiempo
- **Ventajas**:
  - Permite completar una lección completa
  - Tiempo suficiente para actividades y quizzes
  - Óptimo para retención

#### 3.3.3 Sesión Larga (Deep Session)
- **Duración**: 75-120 minutos
- **Descanso**: 15-20 minutos (con descansos intermedios cada 45 min)
- **Aplicación**:
  - Roles especializados (Academia, Investigación)
  - Contenido avanzado o técnico complejo
  - Cursos que requieren inmersión profunda
  - Usuarios con mayor disponibilidad
- **Ventajas**:
  - Permite profundizar en temas complejos
  - Ideal para proyectos prácticos
  - Mayor inmersión y comprensión

**Reglas Generales**:
- Máximo 2 horas continuas de estudio
- Descanso obligatorio de 15-30 min después de 2 horas
- Respetar límites de atención según rol y tamaño de empresa
- Ajustar según preferencias personales y complejidad del curso

### 3.4 Ajuste de Duración según Complejidad del Curso

La complejidad del curso (nivel + categoría) influye en la duración recomendada de sesiones:

#### 3.4.1 Factores de Complejidad

**Nivel de Dificultad** (`courses.level`):
- **Beginner**: Contenido introductorio, menos tiempo de procesamiento
  - Multiplicador de tiempo: 0.9x (10% menos tiempo)
- **Intermediate**: Contenido moderado, requiere más reflexión
  - Multiplicador de tiempo: 1.0x (tiempo base)
- **Advanced**: Contenido complejo, requiere más tiempo de asimilación
  - Multiplicador de tiempo: 1.2x (20% más tiempo)

**Categoría del Curso** (`courses.category`):
- **Categorías Técnicas** (tecnologia, programacion, data-science): 
  - Requieren práctica y experimentación
  - Multiplicador adicional: +15% tiempo
- **Categorías Conceptuales** (marketing, negocios, liderazgo):
  - Requieren reflexión y aplicación
  - Multiplicador adicional: +10% tiempo
- **Categorías Prácticas** (diseño, creatividad, habilidades):
  - Requieren práctica activa
  - Multiplicador adicional: +12% tiempo
- **Categorías Teóricas** (academia, investigación):
  - Requieren lectura profunda y análisis
  - Multiplicador adicional: +20% tiempo

#### 3.4.2 Fórmula de Ajuste

```
Duración Ajustada = Duración Base × Multiplicador Nivel × (1 + Multiplicador Categoría)
```

**Ejemplo**:
- Curso: "Machine Learning Avanzado" (level: 'advanced', category: 'tecnologia')
- Duración base según tipo de sesión: 60 minutos (Sesión Media)
- Ajuste: 60 × 1.2 × 1.15 = 82.8 minutos → **83 minutos**

**Ejemplo 2**:
- Curso: "Introducción al Marketing" (level: 'beginner', category: 'marketing')
- Duración base según tipo de sesión: 45 minutos (Sesión Media)
- Ajuste: 45 × 0.9 × 1.10 = 44.55 minutos → **45 minutos** (sin cambio significativo)

#### 3.4.3 Matriz de Complejidad

| Nivel | Categoría Técnica | Categoría Conceptual | Categoría Práctica | Categoría Teórica |
|-------|------------------|---------------------|-------------------|------------------|
| Beginner | +3.5% | +0% | +1.8% | +8% |
| Intermediate | +15% | +10% | +12% | +20% |
| Advanced | +38% | +32% | +34.4% | +44% |

**Nota**: Los porcentajes se calculan sobre la duración base del tipo de sesión seleccionado.

### 3.4 Horarios Óptimos según Cronotipo

**Alondras Matutinas** (25% de la población):
- Horario óptimo: 6:00-10:00 AM
- Segundo pico: 2:00-4:00 PM
- Evitar: 8:00-10:00 PM

**Búhos Nocturnos** (25% de la población):
- Horario óptimo: 8:00-11:00 PM
- Segundo pico: 2:00-4:00 PM
- Evitar: 6:00-9:00 AM

**Colibríes** (50% de la población):
- Horario óptimo: 9:00-11:00 AM y 3:00-5:00 PM
- Flexibilidad en horarios
- Evitar: Extremos del día

**Implementación**:
- Detectar cronotipo del usuario (cuestionario o análisis de actividad)
- Sugerir horarios óptimos según cronotipo
- Ajustar plan generado por IA según cronotipo
- Respetar ritmos biológicos naturales

### 3.5 Integración de Técnicas en el Planificador

El planificador aplica estas técnicas de la siguiente manera:

1. **Al Generar Planes**:
   - Distribuir lecciones espaciadamente (Práctica Distribuida)
   - Alternar entre cursos (Estudio Intercalado)
   - Respetar duraciones óptimas (Pomodoro)
   - Programar repasos automáticos (Repetición Espaciada)

2. **Durante las Sesiones**:
   - Timer Pomodoro integrado
   - Recordatorios de descansos
   - Preguntas de Active Recall
   - Actividades de autoexplicación

3. **Después de Completar**:
   - Programar repasos espaciados
   - Generar flashcards automáticas
   - Proporcionar retroalimentación

4. **Seguimiento Continuo**:
   - Ajustar intervalos de repaso según rendimiento
   - Adaptar dificultad según progreso
   - Personalizar según estilo de aprendizaje
   - Optimizar horarios según cronotipo

---

## 4. Sistema de Roles Profesionales y Perfiles Granulares

### 4.1 Categorización de Roles

Basado en la tabla `roles` y su relación con `areas`, los roles se categorizan en:

#### A. Roles Ejecutivos C-Level
- **CEO** (Chief Executive Officer)
- **CMO** (Chief Marketing Officer / Director(a) de Marketing)
- **CTO** (Chief Technology Officer / Director(a) de Tecnología)
- **CFO** (Chief Financial Officer / Dirección de Finanzas)

#### B. Roles de Dirección
- Dirección de Ventas
- Dirección de Operaciones
- Dirección de RRHH
- Dirección de Contabilidad
- Dirección de Compras / Supply
- Dirección de Gobierno / Políticas Públicas

#### C. Roles de Gerencia Media
- Gerente de Marketing
- Gerente de TI
- Líder/Gerente de Ventas
- Gerencia Media (genérico)

#### D. Roles de Miembros de Equipo
- Miembros de Ventas
- Miembros de Marketing
- Miembros de Operaciones
- Miembros de Finanzas
- Miembros de RRHH
- Miembros de Contabilidad
- Miembros de Compras
- Miembros de Gobierno / Sector público

#### E. Roles Especializados
- Analista/Especialista TI
- Academia/Investigación
- Educación/Docentes
- Diseño/Industrias Creativas
- Freelancer
- Consultor

### 4.2 Factores de Personalización

El sistema considera múltiples factores para personalizar la disponibilidad:

1. **Rol Profesional** (`users.type_rol` o `user_perfil.rol_id`)
2. **Tamaño de Empresa** (`user_perfil.tamano_id` → `tamanos_empresa`)
3. **Área** (`user_perfil.area_id` → `areas`)
4. **Nivel Jerárquico** (`user_perfil.nivel_id` → `niveles`)
5. **Sector** (`user_perfil.sector_id` → `sectores`)
6. **Tipo de Relación** (`user_perfil.relacion_id` → `relaciones`)
7. **Tipo de Sesión Preferido** (Corta, Media, Larga) - Configuración del usuario
8. **Complejidad del Curso** (`courses.level` + `courses.category`) - Ajusta duración de sesiones

### 4.3 Matriz de Disponibilidad por Rol y Tamaño de Empresa

#### 4.3.1 Roles Ejecutivos C-Level

**CEO (Chief Executive Officer)**

**Empresa Pequeña (1-50 empleados)**:
- **Disponibilidad diaria**: 45-75 minutos
- **Días por semana**: 4-5 días
- **Duración de sesión**: 45-60 minutos
- **Horarios preferidos**: Mañana (7:00-9:00) o Tarde (18:00-20:00)
- **Características**: Mayor flexibilidad, puede dedicar más tiempo

**Empresa Mediana (51-250 empleados)**:
- **Disponibilidad diaria**: 30-60 minutos
- **Días por semana**: 3-4 días
- **Duración de sesión**: 30-45 minutos
- **Horarios preferidos**: Mañana temprano (6:00-8:00) o Noche (20:00-22:00)
- **Características**: Tiempos limitados, sesiones cortas y eficientes

**Empresa Grande (251-1000 empleados)**:
- **Disponibilidad diaria**: 20-45 minutos
- **Días por semana**: 3-4 días
- **Duración de sesión**: 25-30 minutos (Pomodoro corto)
- **Horarios preferidos**: Muy temprano (5:30-7:00) o Muy tarde (21:00-23:00)
- **Características**: Tiempos muy limitados, necesita máxima eficiencia

**Empresa Muy Grande (1000+ empleados)**:
- **Disponibilidad diaria**: 15-30 minutos
- **Días por semana**: 2-3 días
- **Duración de sesión**: 20-25 minutos (Pomodoro)
- **Horarios preferidos**: Muy temprano (5:00-6:30) o Fines de semana
- **Características**: Tiempos extremadamente limitados, sesiones ultra-cortas

**CMO / Director(a) de Marketing**

**Empresa Pequeña (1-50 empleados)**:
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 60-75 minutos
- **Horarios preferidos**: Mañana (8:00-10:00) o Tarde (14:00-16:00)
- **Características**: Flexibilidad, puede dedicar tiempo consistente

**Empresa Mediana (51-250 empleados)**:
- **Disponibilidad diaria**: 45-75 minutos
- **Días por semana**: 4-5 días
- **Duración de sesión**: 45-60 minutos
- **Horarios preferidos**: Mañana (8:00-10:00) o Tarde (14:00-16:00)
- **Características**: Flexibilidad moderada, sesiones medias

**Empresa Grande (251-1000 empleados)**:
- **Disponibilidad diaria**: 30-60 minutos
- **Días por semana**: 3-4 días
- **Duración de sesión**: 30-45 minutos
- **Horarios preferidos**: Mañana temprano (7:00-9:00) o Tarde (15:00-17:00)
- **Características**: Tiempos limitados, sesiones eficientes

**Empresa Muy Grande (1000+ empleados)**:
- **Disponibilidad diaria**: 25-45 minutos
- **Días por semana**: 3 días
- **Duración de sesión**: 25-30 minutos (Pomodoro)
- **Horarios preferidos**: Muy temprano (6:30-8:00) o Noche (19:00-21:00)
- **Características**: Tiempos muy limitados, máxima eficiencia

**CTO / Director(a) de Tecnología**

**Empresa Pequeña (1-50 empleados)**:
- **Disponibilidad diaria**: 75-105 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (15:00-17:00)
- **Características**: Prefiere bloques de tiempo más largos, mayor flexibilidad

**Empresa Mediana (51-250 empleados)**:
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 4-5 días
- **Duración de sesión**: 60-75 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (15:00-17:00)
- **Características**: Prefiere bloques de tiempo más largos

**Empresa Grande (251-1000 empleados)**:
- **Disponibilidad diaria**: 45-75 minutos
- **Días por semana**: 4 días
- **Duración de sesión**: 45-60 minutos
- **Horarios preferidos**: Mañana temprano (8:00-10:00) o Tarde (16:00-18:00)
- **Características**: Tiempos limitados, sesiones eficientes

**Empresa Muy Grande (1000+ empleados)**:
- **Disponibilidad diaria**: 30-60 minutos
- **Días por semana**: 3 días
- **Duración de sesión**: 30-45 minutos
- **Horarios preferidos**: Muy temprano (7:00-9:00) o Noche (19:00-21:00)
- **Características**: Tiempos muy limitados, máxima eficiencia

**CFO / Dirección de Finanzas**

**Empresa Pequeña (1-50 empleados)**:
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 60-75 minutos
- **Horarios preferidos**: Mañana (8:00-10:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares, sesiones consistentes

**Empresa Mediana (51-250 empleados)**:
- **Disponibilidad diaria**: 45-75 minutos
- **Días por semana**: 4-5 días
- **Duración de sesión**: 45-60 minutos
- **Horarios preferidos**: Mañana (8:00-10:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares, sesiones consistentes

**Empresa Grande (251-1000 empleados)**:
- **Disponibilidad diaria**: 30-60 minutos
- **Días por semana**: 3-4 días
- **Duración de sesión**: 30-45 minutos
- **Horarios preferidos**: Mañana temprano (7:00-9:00) o Tarde (15:00-17:00)
- **Características**: Tiempos limitados, sesiones eficientes

**Empresa Muy Grande (1000+ empleados)**:
- **Disponibilidad diaria**: 25-45 minutos
- **Días por semana**: 3 días
- **Duración de sesión**: 25-30 minutos (Pomodoro)
- **Horarios preferidos**: Muy temprano (6:30-8:00) o Noche (19:00-21:00)
- **Características**: Tiempos muy limitados, máxima eficiencia

#### 3.2.2 Roles de Dirección

**Dirección de RRHH**
- **Disponibilidad diaria**: 45-75 minutos
- **Días por semana**: 5-6 días
- **Duración de sesión**: 45-75 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares, sesiones consistentes

**Dirección de Ventas**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 4-5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (8:00-10:00) o Tarde (15:00-17:00)
- **Características**: Flexibilidad, sesiones medias-largas

**Dirección de Operaciones**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares, sesiones consistentes

**Dirección de Contabilidad / Jefatura de Contabilidad**
- **Disponibilidad diaria**: 45-75 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 45-75 minutos
- **Horarios preferidos**: Mañana (8:00-10:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares, sesiones consistentes

**Dirección de Compras / Supply**
- **Disponibilidad diaria**: 45-75 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 45-75 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares

**Dirección de Gobierno / Políticas Públicas**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 4-5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (15:00-17:00)
- **Características**: Flexibilidad, sesiones medias-largas

#### 3.2.3 Roles de Gerencia Media

**Gerente de Marketing**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 4-5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (8:00-10:00) o Tarde (14:00-16:00)
- **Características**: Flexibilidad en horarios, sesiones medias

**Gerente de TI**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (15:00-17:00)
- **Características**: Prefiere bloques de tiempo más largos

**Líder/Gerente de Ventas**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 4-5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (8:00-10:00) o Tarde (15:00-17:00)
- **Características**: Flexibilidad, sesiones medias-largas

**Gerencia Media (genérico)**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares, sesiones consistentes

#### 3.2.4 Roles de Miembros de Equipo

**Miembros de Marketing**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares, sesiones consistentes

**Miembros de Ventas**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (8:00-10:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares

**Miembros de Operaciones**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares, sesiones consistentes

**Miembros de Finanzas**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares

**Miembros de RRHH**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares, sesiones consistentes

**Miembros de Contabilidad**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares

**Miembros de Compras**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares

**Miembros de Gobierno / Sector público**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 5 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Mañana (9:00-11:00) o Tarde (14:00-16:00)
- **Características**: Horarios regulares

#### 3.2.5 Roles Especializados

**Analista/Especialista TI**
- **Disponibilidad diaria**: 60-120 minutos
- **Días por semana**: 5-6 días
- **Duración de sesión**: 60-120 minutos
- **Horarios preferidos**: Mañana (9:00-11:00), Tarde (14:00-16:00) o Noche (19:00-21:00)
- **Características**: Flexibilidad, puede estudiar en horarios variados

**Academia/Investigación**
- **Disponibilidad diaria**: 90-120 minutos
- **Días por semana**: 5-6 días
- **Duración de sesión**: 90-120 minutos
- **Horarios preferidos**: Mañana (9:00-12:00) o Tarde (14:00-17:00)
- **Características**: Prefiere sesiones largas y concentradas

**Educación/Docentes**
- **Disponibilidad diaria**: 60-90 minutos
- **Días por semana**: 5-6 días
- **Duración de sesión**: 60-90 minutos
- **Horarios preferidos**: Tarde (15:00-17:00) o Noche (19:00-21:00)
- **Características**: Horarios después de clases, sesiones consistentes

**Diseño/Industrias Creativas**
- **Disponibilidad diaria**: 60-120 minutos
- **Días por semana**: 5-6 días
- **Duración de sesión**: 60-120 minutos
- **Horarios preferidos**: Mañana (10:00-12:00) o Tarde (15:00-17:00)
- **Características**: Flexibilidad, sesiones creativas

**Freelancer**
- **Disponibilidad diaria**: 60-120 minutos
- **Días por semana**: 5-7 días (flexible)
- **Duración de sesión**: 60-120 minutos
- **Horarios preferidos**: Variable según proyecto
- **Características**: Máxima flexibilidad, puede adaptarse

**Consultor**
- **Disponibilidad diaria**: 45-90 minutos
- **Días por semana**: 4-5 días
- **Duración de sesión**: 45-90 minutos
- **Horarios preferidos**: Mañana (8:00-10:00) o Tarde (14:00-16:00)
- **Características**: Flexibilidad según clientes, sesiones variables

### 4.4 Función de Cálculo de Disponibilidad Granular

```typescript
interface CompanySize {
  id: number;
  nombre: string;
  min_empleados: number | null;
  max_empleados: number | null;
}

interface UserProfile {
  rol_profesional: string;
  area_nombre?: string;
  tamano_empresa?: CompanySize;
  nivel_nombre?: string;
  sector_nombre?: string;
  relacion_nombre?: string;
}

type SessionType = 'short' | 'medium' | 'long';

interface SessionTypeConfig {
  duration: { min: number; max: number };
  breakMinutes: number;
  description: string;
  idealFor: string[];
}

interface RoleAvailabilityProfile {
  dailyMinutes: { min: number; max: number };
  daysPerWeek: { min: number; max: number };
  sessionLength: { min: number; max: number };
  preferredTimes: ('morning' | 'afternoon' | 'evening' | 'night')[];
  characteristics: string;
  maxLessonsPerDay: number;
  pomodoroLength?: number; // Para técnica Pomodoro
  recommendedSessionType?: SessionType; // Tipo de sesión recomendado según rol
}

interface CourseComplexity {
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  complexityMultiplier: number; // Multiplicador de tiempo según complejidad
}

// Configuración de tipos de sesiones
const SESSION_TYPES: Record<SessionType, SessionTypeConfig> = {
  short: {
    duration: { min: 20, max: 35 },
    breakMinutes: 5,
    description: 'Sesión rápida para contenido introductorio o repasos',
    idealFor: ['Ejecutivos con tiempo limitado', 'Micro-aprendizaje', 'Repasos rápidos']
  },
  medium: {
    duration: { min: 45, max: 60 },
    breakMinutes: 10,
    description: 'Sesión estándar para completar lecciones completas',
    idealFor: ['Mayoría de roles', 'Contenido intermedio', 'Balance óptimo']
  },
  long: {
    duration: { min: 75, max: 120 },
    breakMinutes: 15,
    description: 'Sesión profunda para contenido complejo o inmersión',
    idealFor: ['Roles especializados', 'Contenido avanzado', 'Proyectos prácticos']
  }
};

// Multiplicadores de complejidad por nivel
const LEVEL_MULTIPLIERS: Record<string, number> = {
  'beginner': 0.9,
  'intermediate': 1.0,
  'advanced': 1.2
};

// Multiplicadores adicionales por categoría
const CATEGORY_MULTIPLIERS: Record<string, number> = {
  'tecnologia': 0.15,
  'programacion': 0.15,
  'data-science': 0.15,
  'marketing': 0.10,
  'negocios': 0.10,
  'liderazgo': 0.10,
  'diseño': 0.12,
  'creatividad': 0.12,
  'habilidades': 0.12,
  'academia': 0.20,
  'investigacion': 0.20,
  'ia': 0.15, // Default para categoría IA
  'default': 0.10
};

// Función para calcular complejidad del curso
function calculateCourseComplexity(
  level: string,
  category: string
): CourseComplexity {
  const levelMultiplier = LEVEL_MULTIPLIERS[level.toLowerCase()] || 1.0;
  const categoryMultiplier = CATEGORY_MULTIPLIERS[category.toLowerCase()] || CATEGORY_MULTIPLIERS['default'];
  const complexityMultiplier = levelMultiplier * (1 + categoryMultiplier);
  
  return {
    level: level.toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
    category: category.toLowerCase(),
    complexityMultiplier
  };
}

// Función para ajustar duración según complejidad y tipo de sesión
function adjustSessionDuration(
  baseDuration: number,
  sessionType: SessionType,
  courseComplexity: CourseComplexity
): number {
  const sessionConfig = SESSION_TYPES[sessionType];
  const adjustedDuration = baseDuration * courseComplexity.complexityMultiplier;
  
  // Asegurar que esté dentro de los límites del tipo de sesión
  return Math.max(
    sessionConfig.duration.min,
    Math.min(adjustedDuration, sessionConfig.duration.max)
  );
}

// Matriz de disponibilidad base por rol
const BASE_ROLE_PROFILES: Record<string, {
  small: RoleAvailabilityProfile;      // 1-50 empleados
  medium: RoleAvailabilityProfile;     // 51-250 empleados
  large: RoleAvailabilityProfile;      // 251-1000 empleados
  xlarge: RoleAvailabilityProfile;     // 1000+ empleados
}> = {
  // Ejecutivos C-Level
  'CEO': {
    small: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['morning', 'evening'],
      characteristics: 'Mayor flexibilidad, puede dedicar más tiempo',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    medium: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 3, max: 4 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'night'],
      characteristics: 'Tiempos limitados, sesiones cortas y eficientes',
      maxLessonsPerDay: 2,
      pomodoroLength: 30
    },
    large: {
      dailyMinutes: { min: 20, max: 45 },
      daysPerWeek: { min: 3, max: 4 },
      sessionLength: { min: 25, max: 30 },
      preferredTimes: ['morning', 'night'],
      characteristics: 'Tiempos muy limitados, necesita máxima eficiencia',
      maxLessonsPerDay: 1,
      pomodoroLength: 25
    },
    xlarge: {
      dailyMinutes: { min: 15, max: 30 },
      daysPerWeek: { min: 2, max: 3 },
      sessionLength: { min: 20, max: 25 },
      preferredTimes: ['morning', 'night'],
      characteristics: 'Tiempos extremadamente limitados, sesiones ultra-cortas',
      maxLessonsPerDay: 1,
      pomodoroLength: 20
    }
  },
  'CMO / Director(a) de Marketing': {
    small: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 75 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Flexibilidad, puede dedicar tiempo consistente',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Flexibilidad moderada, sesiones medias',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    large: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 3, max: 4 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Tiempos limitados, sesiones eficientes',
      maxLessonsPerDay: 2,
      pomodoroLength: 30
    },
    xlarge: {
      dailyMinutes: { min: 25, max: 45 },
      daysPerWeek: { min: 3, max: 3 },
      sessionLength: { min: 25, max: 30 },
      preferredTimes: ['morning', 'night'],
      characteristics: 'Tiempos muy limitados, máxima eficiencia',
      maxLessonsPerDay: 1,
      pomodoroLength: 25
    }
  },
  'CTO / Director(a) de Tecnología': {
    small: {
      dailyMinutes: { min: 75, max: 105 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Prefiere bloques de tiempo más largos, mayor flexibilidad',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 60, max: 75 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Prefiere bloques de tiempo más largos',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 4, max: 4 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Tiempos limitados, sesiones eficientes',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 3, max: 3 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'night'],
      characteristics: 'Tiempos muy limitados, máxima eficiencia',
      maxLessonsPerDay: 1,
      pomodoroLength: 30
    }
  },
  'Dirección de Finanzas (CFO)': {
    small: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 75 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    large: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 3, max: 4 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Tiempos limitados, sesiones eficientes',
      maxLessonsPerDay: 2,
      pomodoroLength: 30
    },
    xlarge: {
      dailyMinutes: { min: 25, max: 45 },
      daysPerWeek: { min: 3, max: 3 },
      sessionLength: { min: 25, max: 30 },
      preferredTimes: ['morning', 'night'],
      characteristics: 'Tiempos muy limitados, máxima eficiencia',
      maxLessonsPerDay: 1,
      pomodoroLength: 25
    }
  },
  
  // Dirección
  'Dirección de RRHH': {
    small: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 6 },
      sessionLength: { min: 60, max: 75 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 5, max: 6 },
      sessionLength: { min: 45, max: 75 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    large: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Tiempos limitados, sesiones eficientes',
      maxLessonsPerDay: 2,
      pomodoroLength: 30
    },
    xlarge: {
      dailyMinutes: { min: 25, max: 45 },
      daysPerWeek: { min: 3, max: 4 },
      sessionLength: { min: 25, max: 30 },
      preferredTimes: ['morning', 'night'],
      characteristics: 'Tiempos muy limitados, máxima eficiencia',
      maxLessonsPerDay: 1,
      pomodoroLength: 25
    }
  },
  'Dirección de Ventas': {
    small: {
      dailyMinutes: { min: 75, max: 105 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Flexibilidad, sesiones medias-largas',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Flexibilidad, sesiones medias-largas',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 3, max: 4 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Tiempos limitados, sesiones eficientes',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 3, max: 3 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'night'],
      characteristics: 'Tiempos muy limitados, máxima eficiencia',
      maxLessonsPerDay: 1,
      pomodoroLength: 30
    }
  },
  'Dirección de Operaciones': {
    small: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Tiempos limitados, sesiones eficientes',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 3, max: 4 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'night'],
      characteristics: 'Tiempos muy limitados, máxima eficiencia',
      maxLessonsPerDay: 1,
      pomodoroLength: 30
    }
  },
  
  // Gerencia Media
  'Gerente de Marketing': {
    small: {
      dailyMinutes: { min: 75, max: 105 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Flexibilidad en horarios, sesiones medias',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Flexibilidad en horarios, sesiones medias',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 4, max: 4 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Tiempos limitados, sesiones eficientes',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 3, max: 3 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'night'],
      characteristics: 'Tiempos muy limitados, máxima eficiencia',
      maxLessonsPerDay: 1,
      pomodoroLength: 30
    }
  },
  'Gerente de TI': {
    small: {
      dailyMinutes: { min: 75, max: 105 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Prefiere bloques de tiempo más largos',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Prefiere bloques de tiempo más largos',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Tiempos limitados, sesiones eficientes',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 3, max: 4 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'night'],
      characteristics: 'Tiempos muy limitados, máxima eficiencia',
      maxLessonsPerDay: 1,
      pomodoroLength: 30
    }
  },
  'Líder/Gerente de Ventas': {
    small: {
      dailyMinutes: { min: 75, max: 105 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Flexibilidad, sesiones medias-largas',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Flexibilidad, sesiones medias-largas',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 4, max: 4 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Tiempos limitados, sesiones eficientes',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 3, max: 3 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'night'],
      characteristics: 'Tiempos muy limitados, máxima eficiencia',
      maxLessonsPerDay: 1,
      pomodoroLength: 30
    }
  },
  
  // Miembros de Equipo (generalmente menos variación por tamaño, pero sí hay diferencia)
  'Miembros de Marketing': {
    small: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 30
    }
  },
  'Miembros de Ventas': {
    small: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares',
      maxLessonsPerDay: 2,
      pomodoroLength: 30
    }
  },
  'Miembros de Operaciones': {
    small: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 30
    }
  },
  'Miembros de Finanzas': {
    small: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares',
      maxLessonsPerDay: 2,
      pomodoroLength: 30
    }
  },
  'Miembros de RRHH': {
    small: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Horarios regulares, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 30
    }
  },
  
  // Especializados (menos variación por tamaño, más por tipo de trabajo)
  'Analista/Especialista TI': {
    small: {
      dailyMinutes: { min: 75, max: 120 },
      daysPerWeek: { min: 5, max: 6 },
      sessionLength: { min: 60, max: 120 },
      preferredTimes: ['morning', 'afternoon', 'evening'],
      characteristics: 'Flexibilidad, puede estudiar en horarios variados',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 120 },
      daysPerWeek: { min: 5, max: 6 },
      sessionLength: { min: 60, max: 120 },
      preferredTimes: ['morning', 'afternoon', 'evening'],
      characteristics: 'Flexibilidad, puede estudiar en horarios variados',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 45, max: 90 },
      preferredTimes: ['morning', 'afternoon', 'evening'],
      characteristics: 'Flexibilidad moderada',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 75 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 30, max: 60 },
      preferredTimes: ['morning', 'afternoon', 'evening'],
      characteristics: 'Tiempos limitados, flexibilidad moderada',
      maxLessonsPerDay: 2,
      pomodoroLength: 30
    }
  },
  'Academia/Investigación': {
    small: {
      dailyMinutes: { min: 90, max: 120 },
      daysPerWeek: { min: 5, max: 6 },
      sessionLength: { min: 90, max: 120 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Prefiere sesiones largas y concentradas',
      maxLessonsPerDay: 2,
      pomodoroLength: 90
    },
    medium: {
      dailyMinutes: { min: 90, max: 120 },
      daysPerWeek: { min: 5, max: 6 },
      sessionLength: { min: 90, max: 120 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Prefiere sesiones largas y concentradas',
      maxLessonsPerDay: 2,
      pomodoroLength: 90
    },
    large: {
      dailyMinutes: { min: 75, max: 105 },
      daysPerWeek: { min: 5, max: 6 },
      sessionLength: { min: 75, max: 105 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Prefiere sesiones largas y concentradas',
      maxLessonsPerDay: 2,
      pomodoroLength: 75
    },
    xlarge: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Sesiones largas pero ajustadas a disponibilidad',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    }
  },
  'Educación/Docentes': {
    small: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 6 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['afternoon', 'evening'],
      characteristics: 'Horarios después de clases, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 90 },
      daysPerWeek: { min: 5, max: 6 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['afternoon', 'evening'],
      characteristics: 'Horarios después de clases, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 75 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 45, max: 60 },
      preferredTimes: ['afternoon', 'evening'],
      characteristics: 'Horarios después de clases, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 60 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 30, max: 45 },
      preferredTimes: ['afternoon', 'evening'],
      characteristics: 'Horarios después de clases, sesiones consistentes',
      maxLessonsPerDay: 2,
      pomodoroLength: 30
    }
  },
  'Diseño/Industrias Creativas': {
    small: {
      dailyMinutes: { min: 75, max: 120 },
      daysPerWeek: { min: 5, max: 6 },
      sessionLength: { min: 60, max: 120 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Flexibilidad, sesiones creativas',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 120 },
      daysPerWeek: { min: 5, max: 6 },
      sessionLength: { min: 60, max: 120 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Flexibilidad, sesiones creativas',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 90 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 45, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Flexibilidad moderada, sesiones creativas',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 75 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 30, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Tiempos limitados, flexibilidad moderada',
      maxLessonsPerDay: 2,
      pomodoroLength: 30
    }
  },
  'Freelancer': {
    small: {
      dailyMinutes: { min: 90, max: 150 },
      daysPerWeek: { min: 5, max: 7 },
      sessionLength: { min: 60, max: 120 },
      preferredTimes: ['morning', 'afternoon', 'evening'],
      characteristics: 'Máxima flexibilidad, puede adaptarse',
      maxLessonsPerDay: 3,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 75, max: 120 },
      daysPerWeek: { min: 5, max: 7 },
      sessionLength: { min: 60, max: 120 },
      preferredTimes: ['morning', 'afternoon', 'evening'],
      characteristics: 'Máxima flexibilidad, puede adaptarse',
      maxLessonsPerDay: 3,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 60, max: 105 },
      daysPerWeek: { min: 5, max: 6 },
      sessionLength: { min: 60, max: 90 },
      preferredTimes: ['morning', 'afternoon', 'evening'],
      characteristics: 'Flexibilidad, puede adaptarse',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    xlarge: {
      dailyMinutes: { min: 45, max: 90 },
      daysPerWeek: { min: 4, max: 6 },
      sessionLength: { min: 45, max: 75 },
      preferredTimes: ['morning', 'afternoon', 'evening'],
      characteristics: 'Flexibilidad moderada',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    }
  },
  'Consultor': {
    small: {
      dailyMinutes: { min: 60, max: 105 },
      daysPerWeek: { min: 5, max: 5 },
      sessionLength: { min: 45, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Flexibilidad según clientes, sesiones variables',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    medium: {
      dailyMinutes: { min: 45, max: 90 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 45, max: 90 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Flexibilidad según clientes, sesiones variables',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    large: {
      dailyMinutes: { min: 30, max: 75 },
      daysPerWeek: { min: 4, max: 4 },
      sessionLength: { min: 30, max: 60 },
      preferredTimes: ['morning', 'afternoon'],
      characteristics: 'Tiempos limitados según clientes',
      maxLessonsPerDay: 2,
      pomodoroLength: 30
    },
    xlarge: {
      dailyMinutes: { min: 25, max: 60 },
      daysPerWeek: { min: 3, max: 4 },
      sessionLength: { min: 25, max: 45 },
      preferredTimes: ['morning', 'night'],
      characteristics: 'Tiempos muy limitados según clientes',
      maxLessonsPerDay: 1,
      pomodoroLength: 25
    }
  },
  
  // Default para roles no mapeados
  'default': {
    small: {
      dailyMinutes: { min: 60, max: 120 },
      daysPerWeek: { min: 5, max: 7 },
      sessionLength: { min: 60, max: 120 },
      preferredTimes: ['morning', 'afternoon', 'evening'],
      characteristics: 'Perfil estándar',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    medium: {
      dailyMinutes: { min: 60, max: 120 },
      daysPerWeek: { min: 5, max: 7 },
      sessionLength: { min: 60, max: 120 },
      preferredTimes: ['morning', 'afternoon', 'evening'],
      characteristics: 'Perfil estándar',
      maxLessonsPerDay: 2,
      pomodoroLength: 60
    },
    large: {
      dailyMinutes: { min: 45, max: 90 },
      daysPerWeek: { min: 5, max: 6 },
      sessionLength: { min: 45, max: 75 },
      preferredTimes: ['morning', 'afternoon', 'evening'],
      characteristics: 'Perfil estándar',
      maxLessonsPerDay: 2,
      pomodoroLength: 45
    },
    xlarge: {
      dailyMinutes: { min: 30, max: 75 },
      daysPerWeek: { min: 4, max: 5 },
      sessionLength: { min: 30, max: 60 },
      preferredTimes: ['morning', 'afternoon', 'evening'],
      characteristics: 'Perfil estándar',
      maxLessonsPerDay: 2,
      pomodoroLength: 30
    }
  }
};

function getCompanySizeCategory(tamanoEmpresa?: CompanySize): 'small' | 'medium' | 'large' | 'xlarge' {
  if (!tamanoEmpresa || !tamanoEmpresa.max_empleados) {
    return 'medium'; // Default
  }
  
  const maxEmpleados = tamanoEmpresa.max_empleados;
  
  if (maxEmpleados <= 50) return 'small';
  if (maxEmpleados <= 250) return 'medium';
  if (maxEmpleados <= 1000) return 'large';
  return 'xlarge';
}

function getRoleProfile(userProfile: UserProfile): RoleAvailabilityProfile {
  const roleName = userProfile.rol_profesional;
  const companySize = getCompanySizeCategory(userProfile.tamano_empresa);
  
  // Buscar coincidencia exacta
  if (BASE_ROLE_PROFILES[roleName]) {
    return BASE_ROLE_PROFILES[roleName][companySize];
  }
  
  // Buscar coincidencia parcial (por palabras clave)
  const normalizedRole = roleName.toLowerCase();
  for (const [key, profiles] of Object.entries(BASE_ROLE_PROFILES)) {
    if (key.toLowerCase().includes(normalizedRole) || normalizedRole.includes(key.toLowerCase())) {
      return profiles[companySize];
    }
  }
  
  // Retornar perfil por defecto según tamaño de empresa
  return BASE_ROLE_PROFILES['default'][companySize];
}

// Función para ajustar perfil según factores adicionales
function adjustProfileForFactors(
  baseProfile: RoleAvailabilityProfile,
  userProfile: UserProfile
): RoleAvailabilityProfile {
  let adjusted = { ...baseProfile };
  
  // Ajuste según área
  if (userProfile.area_nombre) {
    // Áreas más operativas pueden tener menos flexibilidad
    const operationalAreas = ['Operaciones', 'Producción', 'Manufactura'];
    if (operationalAreas.some(area => userProfile.area_nombre?.includes(area))) {
      adjusted.dailyMinutes.max = Math.max(adjusted.dailyMinutes.min, adjusted.dailyMinutes.max - 15);
      adjusted.daysPerWeek.max = Math.max(adjusted.daysPerWeek.min, adjusted.daysPerWeek.max - 1);
    }
  }
  
  // Ajuste según nivel jerárquico
  if (userProfile.nivel_nombre) {
    const nivel = userProfile.nivel_nombre.toLowerCase();
    if (nivel.includes('senior') || nivel.includes('director')) {
      // Niveles altos tienen menos tiempo
      adjusted.dailyMinutes.max = Math.max(adjusted.dailyMinutes.min, adjusted.dailyMinutes.max - 10);
    } else if (nivel.includes('junior') || nivel.includes('asociado')) {
      // Niveles junior pueden tener más tiempo
      adjusted.dailyMinutes.max = adjusted.dailyMinutes.max + 15;
    }
  }
  
  // Ajuste según tipo de relación (freelancer, consultor tienen más flexibilidad)
  if (userProfile.relacion_nombre) {
    const relacion = userProfile.relacion_nombre.toLowerCase();
    if (relacion.includes('freelance') || relacion.includes('consultor') || relacion.includes('independiente')) {
      adjusted.dailyMinutes.max = adjusted.dailyMinutes.max + 20;
      adjusted.daysPerWeek.max = Math.min(7, adjusted.daysPerWeek.max + 1);
      adjusted.preferredTimes = ['morning', 'afternoon', 'evening']; // Más flexibilidad
    }
  }
  
  return adjusted;
}

// Función principal para obtener perfil completo
function getUserAvailabilityProfile(userProfile: UserProfile): RoleAvailabilityProfile {
  const baseProfile = getRoleProfile(userProfile);
  return adjustProfileForFactors(baseProfile, userProfile);
}
```

---

## 4. Cálculo de Tiempos de Lección

### 4.1 Componentes del Tiempo Total

El tiempo total de una lección incluye:

1. **Video** (`course_lessons.duration_seconds`) - **Proporcionado por el instructor**
2. **Actividades con Lia** (`lesson_activities.estimated_time_minutes`) - **Proporcionado por el instructor**
3. **Lecturas** (`lesson_materials.estimated_time_minutes` donde `material_type = 'reading'`) - **Proporcionado por el instructor**
4. **Interacciones** (tiempo de navegación y comprensión) - **Fijo: 3 minutos**
5. **Quizzes** (`lesson_activities.estimated_time_minutes` donde `activity_type = 'quiz'` o `lesson_materials.estimated_time_minutes` donde `material_type = 'quiz'`) - **Proporcionado por el instructor**
6. **Ejercicios y Prácticas** (`lesson_materials.estimated_time_minutes` donde `material_type = 'exercise'`) - **Proporcionado por el instructor**
7. **Enlaces Externos** (`lesson_materials.estimated_time_minutes` donde `material_type = 'link'`) - **Proporcionado por el instructor**

**IMPORTANTE**: Los tiempos de actividades, materiales, lecturas, quizzes, ejercicios y enlaces externos **deben ser proporcionados por el instructor** al crear o editar el contenido. El sistema NO calcula estos tiempos automáticamente.

### 4.2 Fórmula de Cálculo

```
Tiempo Total Lección (minutos) = 
  (duration_seconds / 60) +                                    // Video (del instructor)
  SUM(lesson_activities.estimated_time_minutes) +              // Actividades (del instructor)
  SUM(lesson_materials.estimated_time_minutes) +               // Materiales (del instructor)
  tiempo_interacciones                                         // Interacciones (fijo: 3 min)
```

### 4.3 Fuentes de Tiempo por Tipo de Contenido

#### Video
- **Fuente**: `course_lessons.duration_seconds`
- **Proporcionado por**: Instructor al subir/editar el video
- **Cálculo**: `duration_seconds / 60` (convertir a minutos)
- **Ejemplo**: 1800 segundos = 30 minutos

#### Actividades con Lia
- **Fuente**: `lesson_activities.estimated_time_minutes`
- **Proporcionado por**: Instructor al crear/editar la actividad
- **Tipos de actividades**:
  - `ai_chat`: Tiempo estimado para completar la conversación con Lia
  - `reflection`: Tiempo estimado para la reflexión
  - `exercise`: Tiempo estimado para el ejercicio
  - `discussion`: Tiempo estimado para la discusión
  - `quiz`: Tiempo estimado para completar el quiz
- **Validación**: El instructor debe proporcionar un tiempo estimado en minutos (≥ 1)

#### Lecturas
- **Fuente**: `lesson_materials.estimated_time_minutes` donde `material_type = 'reading'`
- **Proporcionado por**: Instructor al crear/editar el material
- **Tipos**:
  - Texto en `content_data`: Tiempo estimado de lectura
  - PDF en `file_url`: Tiempo estimado de lectura del PDF
  - Link externo en `external_url`: Tiempo estimado de lectura del contenido externo
- **Validación**: El instructor debe proporcionar un tiempo estimado en minutos (≥ 1)

#### Quizzes
- **Fuente**: 
  - `lesson_activities.estimated_time_minutes` donde `activity_type = 'quiz'`
  - `lesson_materials.estimated_time_minutes` donde `material_type = 'quiz'`
- **Proporcionado por**: Instructor al crear/editar el quiz
- **Validación**: El instructor debe proporcionar un tiempo estimado en minutos (≥ 1)

#### Ejercicios y Prácticas
- **Fuente**: `lesson_materials.estimated_time_minutes` donde `material_type = 'exercise'`
- **Proporcionado por**: Instructor al crear/editar el ejercicio
- **Validación**: El instructor debe proporcionar un tiempo estimado en minutos (≥ 1)

#### Enlaces Externos
- **Fuente**: `lesson_materials.estimated_time_minutes` donde `material_type = 'link'`
- **Proporcionado por**: Instructor al crear/editar el enlace
- **Validación**: El instructor debe proporcionar un tiempo estimado en minutos (≥ 1)

#### Interacciones
- **Tiempo fijo**: 3 minutos por lección
- **Incluye**: Navegación, comprensión de contexto, transiciones
- **No requiere configuración del instructor**

### 4.4 Consulta SQL para Cálculo

```sql
WITH lesson_components AS (
  SELECT 
    l.lesson_id,
    l.duration_seconds,
    
    -- Tiempo de video (proporcionado por instructor)
    (l.duration_seconds / 60.0) as video_minutes,
    
    -- Tiempo de actividades (proporcionado por instructor)
    COALESCE(SUM(la.estimated_time_minutes), 0) as activities_minutes,
    
    -- Tiempo de materiales (proporcionado por instructor)
    -- Incluye: lecturas, quizzes, ejercicios, enlaces externos
    COALESCE(SUM(lm.estimated_time_minutes), 0) as materials_minutes,
    
    -- Tiempo de interacciones (fijo)
    3 as interactions_minutes
    
  FROM course_lessons l
  LEFT JOIN lesson_activities la ON l.lesson_id = la.lesson_id
  LEFT JOIN lesson_materials lm ON l.lesson_id = lm.lesson_id
  WHERE l.lesson_id = $1
  GROUP BY l.lesson_id, l.duration_seconds
)
SELECT 
  lesson_id,
  video_minutes,
  activities_minutes,
  materials_minutes,
  interactions_minutes,
  (video_minutes + activities_minutes + materials_minutes + interactions_minutes) as total_minutes,
  CEIL(video_minutes + activities_minutes + materials_minutes + interactions_minutes) as total_minutes_rounded
FROM lesson_components;
```

### 4.5 Tabla de Fuentes de Tiempo

| Tipo de Contenido | Fuente | Proporcionado por |
|-------------------|--------|-------------------|
| Video | `course_lessons.duration_seconds` | Instructor (al subir video) |
| Actividades (todos los tipos) | `lesson_activities.estimated_time_minutes` | Instructor (al crear actividad) |
| Lecturas | `lesson_materials.estimated_time_minutes` (tipo 'reading') | Instructor (al crear material) |
| Quizzes (actividades) | `lesson_activities.estimated_time_minutes` (tipo 'quiz') | Instructor (al crear quiz) |
| Quizzes (materiales) | `lesson_materials.estimated_time_minutes` (tipo 'quiz') | Instructor (al crear material) |
| Ejercicios | `lesson_materials.estimated_time_minutes` (tipo 'exercise') | Instructor (al crear material) |
| Enlaces Externos | `lesson_materials.estimated_time_minutes` (tipo 'link') | Instructor (al crear material) |
| Interacciones | Fijo: 3 minutos | Sistema (no requiere configuración) |

### 4.6 Validaciones y Requisitos

**Para el Instructor**:
- **Obligatorio**: Proporcionar `estimated_time_minutes` para todas las actividades y materiales
- **Mínimo**: 1 minuto para cualquier actividad o material
- **Recomendación**: Basar el tiempo estimado en pruebas reales o experiencia previa

**Para el Sistema**:
- Si `estimated_time_minutes` es NULL o 0, el sistema debe:
  - Mostrar advertencia al instructor
  - No permitir publicar la lección hasta que todos los tiempos estén configurados
  - Usar 0 en el cálculo (pero mostrar advertencia)

**Nota**: Los datos históricos de `lia_activity_completions.time_to_complete_seconds` pueden ser útiles como referencia para el instructor, pero **NO se usan automáticamente** en el cálculo. El instructor debe revisar estos datos y ajustar manualmente el tiempo estimado si es necesario.

---

## 5. Requisitos Funcionales

### 5.1 Modalidad Manual

#### RF-1.1: Configuración de Plan Manual
**Descripción**: El usuario puede configurar un plan de estudios manualmente estableciendo:
- Días de la semana para estudiar
- Horarios preferidos
- Duración de sesiones
- Cursos/talleres a incluir

**Validaciones**:
- El tiempo mínimo de sesión debe ser ≥ duración total de una lección
- No se pueden configurar tiempos menores a la duración mínima de lección
- Mostrar advertencia clara si el tiempo es insuficiente

**Prioridad**: Alta

#### RF-1.2: Cálculo de Tiempo Total por Lección
**Descripción**: El sistema debe calcular el tiempo total de una lección incluyendo todos los componentes:
- Video (duración proporcionada por instructor)
- Actividades (tiempo estimado proporcionado por instructor)
- Materiales (tiempo estimado proporcionado por instructor: lecturas, quizzes, ejercicios, enlaces)
- Interacciones (fijo: 3 minutos)

**Requisitos**:
- El instructor DEBE proporcionar `estimated_time_minutes` para todas las actividades y materiales
- El sistema debe validar que todos los tiempos estén configurados antes de permitir publicar la lección
- Si algún tiempo está faltante, mostrar advertencia clara al instructor

**Prioridad**: Crítica

#### RF-1.3: Validación de Tiempos Mínimos
**Descripción**: El sistema debe validar que:
- El tiempo configurado por el usuario ≥ tiempo mínimo de lección
- Mostrar mensaje de error claro si no cumple
- Sugerir tiempo mínimo recomendado

**Prioridad**: Crítica

### 5.2 Modalidad con IA (Lia)

#### RF-2.1: Generación Automática de Plan
**Descripción**: Lia genera un plan de estudios automático considerando:

**Factores de Entrada**:
1. **Rol Profesional** (`users.type_rol` o `user_perfil.rol_id` → `roles.nombre`)
2. **Perfil Completo del Usuario**:
   - Tamaño de empresa (`user_perfil.tamano_id`)
   - Área (`user_perfil.area_id`)
   - Nivel jerárquico (`user_perfil.nivel_id`)
   - Sector (`user_perfil.sector_id`)
   - Tipo de relación (`user_perfil.relacion_id`)
3. **Tipo de Sesión Preferido** (Corta, Media, Larga) - Configuración del usuario
4. **Cursos/Talleres Adquiridos** (`course_purchases` con `access_status = 'active'`)
   - Incluye `courses.level` y `courses.category` para calcular complejidad
5. **Progreso Actual** (`user_course_enrollments.overall_progress_percentage`)
6. **Preferencias del Usuario** (`study_preferences`)

**Algoritmo de Generación**:
```
1. Obtener perfil completo del usuario (rol, tamaño empresa, área, nivel, etc.)
2. Obtener tipo de sesión preferido del usuario (Corta, Media, Larga)
3. Calcular disponibilidad granular usando matriz de roles y tamaño de empresa
4. Ajustar disponibilidad según factores adicionales (área, nivel, relación)
5. Obtener cursos activos del usuario (incluyendo level y category)
6. Para cada curso, calcular complejidad (level × category)
7. Calcular tiempo total necesario por curso (lecciones pendientes)
8. Ajustar duración de sesiones según:
   - Tipo de sesión preferido del usuario
   - Complejidad del curso (nivel + categoría)
   - Tiempo mínimo por lección
9. Aplicar mejores prácticas de estudio:
   - Distribuir lecciones espaciadamente (Práctica Distribuida)
   - Alternar entre cursos diferentes (Estudio Intercalado)
   - Respetar duraciones óptimas según Pomodoro
   - Programar repasos automáticos (Repetición Espaciada)
10. Distribuir lecciones en sesiones respetando:
    - Duración ajustada según tipo de sesión y complejidad
    - Disponibilidad según tamaño de empresa
    - Preferencias de días/horarios
    - Balance entre cursos
    - Progreso actual (priorizar cursos con más progreso)
    - Máximo de lecciones por día según perfil
11. Programar sesiones de repaso espaciado para lecciones completadas
12. Generar sesiones en study_sessions
13. Sincronizar automáticamente con calendario si está configurado
```

**Prioridad**: Alta

#### RF-2.2: Optimización de Distribución con Mejores Prácticas
**Descripción**: Lia debe optimizar la distribución considerando:
- No sobrecargar días (máximo según rol y tamaño de empresa: 1-3 lecciones por día)
- Priorizar cursos con mayor progreso
- Balancear dificultad (no poner todas las lecciones difíciles juntas)
- Respetar tiempos mínimos de lección
- **Aplicar Práctica Distribuida**: Espaciar lecciones del mismo curso (mínimo 1 día entre lecciones)
- **Aplicar Estudio Intercalado**: Alternar entre diferentes cursos en días consecutivos
- **Respetar Técnica Pomodoro**: Sesiones de 20-50 minutos según rol y tamaño, con descansos programados
- **Considerar Cronotipo**: Ajustar horarios según ritmos biológicos del usuario (si está disponible)

**Prioridad**: Media

#### RF-2.3: Actualización Dinámica
**Descripción**: El plan generado por IA debe:
- Actualizarse automáticamente cuando el usuario completa lecciones
- Reajustar sesiones futuras si hay cambios en progreso
- Notificar al usuario de cambios significativos

**Prioridad**: Media

### 5.3 Sistema de Validaciones

#### RF-3.1: Validación de Tiempo Mínimo
**Descripción**: 
- El sistema debe calcular el tiempo mínimo por lección antes de permitir configuración
- Validar en tiempo real mientras el usuario configura
- Mostrar advertencias claras

**Reglas**:
- Tiempo mínimo = MAX(duración de todas las lecciones del curso)
- Si usuario quiere hacer múltiples lecciones, tiempo = suma de tiempos mínimos

**Prioridad**: Crítica

#### RF-3.2: Validación de Tiempos de Actividades y Materiales
**Descripción**: El sistema debe:
- Validar que el instructor haya proporcionado `estimated_time_minutes` para todas las actividades y materiales
- Mostrar advertencias si algún tiempo está faltante
- No permitir publicar la lección hasta que todos los tiempos estén configurados
- Usar los tiempos proporcionados por el instructor en el cálculo total

**Prioridad**: Alta

### 5.4 Sistema de Incentivos y Rachas

#### RF-4.1: Sistema de Rachas
**Descripción**: Implementar sistema de rachas para incentivar consistencia:
- Racha actual: Días consecutivos completando sesiones planificadas
- Racha más larga: Récord histórico
- Visualización prominente en dashboard

**Reglas**:
- Racha se mantiene si completa al menos 1 sesión del día
- Racha se rompe si no completa ninguna sesión del día
- Notificaciones cuando está cerca de romper racha

**Prioridad**: Alta

#### RF-4.2: Seguimiento de Plan
**Descripción**: 
- Mostrar progreso diario del plan
- Indicadores visuales de cumplimiento
- Alertas cuando se desvía del plan

**Prioridad**: Media

### 5.5 Integración con Calendarios

#### RF-5.1: Sincronización Automática
**Descripción**: 
- Cuando Lia genera un plan, automáticamente crear eventos en calendario externo
- Sincronización bidireccional (cambios en calendario se reflejan en plan)
- Soporte para Google Calendar, Microsoft Calendar, Apple Calendar

**Prioridad**: Alta

#### RF-5.2: Exportación ICS
**Descripción**: 
- Permitir exportar plan completo como archivo .ics
- Incluir detalles de lecciones en descripción del evento
- Actualización automática si hay cambios

**Prioridad**: Media

---

## 6. Modelo de Datos

### 6.1 Nueva Tabla: `lesson_time_estimates`

Esta tabla almacena el tiempo total calculado de cada lección, actualizado automáticamente mediante triggers cuando cambian los tiempos proporcionados por el instructor.

```sql
CREATE TABLE public.lesson_time_estimates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL,
  video_duration_seconds integer NOT NULL, -- Del instructor
  video_minutes numeric NOT NULL GENERATED ALWAYS AS ((video_duration_seconds / 60.0)) STORED,
  activities_time_minutes numeric DEFAULT 0, -- Suma de estimated_time_minutes de todas las actividades (del instructor)
  reading_time_minutes numeric DEFAULT 0, -- Suma de estimated_time_minutes de materiales tipo 'reading' (del instructor)
  interactions_time_minutes numeric DEFAULT 3, -- Fijo: 3 minutos
  quiz_time_minutes numeric DEFAULT 0, -- Suma de estimated_time_minutes de quizzes en actividades y materiales (del instructor)
  total_time_minutes numeric GENERATED ALWAYS AS (
    video_minutes + 
    activities_time_minutes + 
    reading_time_minutes + 
    interactions_time_minutes + 
    quiz_time_minutes
  ) STORED,
  calculated_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lesson_time_estimates_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_time_estimates_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(lesson_id),
  CONSTRAINT lesson_time_estimates_lesson_id_unique UNIQUE (lesson_id)
);

CREATE INDEX idx_lesson_time_estimates_lesson_id ON public.lesson_time_estimates(lesson_id);

-- Comentarios para claridad
COMMENT ON TABLE public.lesson_time_estimates IS 'Tabla que almacena el tiempo total calculado de cada lección. Los tiempos se actualizan automáticamente mediante triggers cuando el instructor modifica los tiempos estimados de actividades y materiales.';
COMMENT ON COLUMN public.lesson_time_estimates.activities_time_minutes IS 'Suma de estimated_time_minutes de todas las actividades de la lección (proporcionados por el instructor)';
COMMENT ON COLUMN public.lesson_time_estimates.reading_time_minutes IS 'Suma de estimated_time_minutes de materiales tipo reading (proporcionados por el instructor)';
COMMENT ON COLUMN public.lesson_time_estimates.quiz_time_minutes IS 'Suma de estimated_time_minutes de quizzes en actividades y materiales (proporcionados por el instructor)';
```

### 6.2 Modificaciones a Tablas Existentes

#### `lesson_activities`
```sql
-- Agregar campo para tiempo estimado proporcionado por el instructor
ALTER TABLE public.lesson_activities
ADD COLUMN estimated_time_minutes integer CHECK (estimated_time_minutes >= 1);

-- Comentario para claridad
COMMENT ON COLUMN public.lesson_activities.estimated_time_minutes IS 'Tiempo estimado en minutos para completar la actividad. Debe ser proporcionado por el instructor. Mínimo: 1 minuto.';
```

#### `lesson_materials`
```sql
-- Agregar campo para tiempo estimado proporcionado por el instructor
ALTER TABLE public.lesson_materials
ADD COLUMN estimated_time_minutes integer CHECK (estimated_time_minutes >= 1);

-- Comentario para claridad
COMMENT ON COLUMN public.lesson_materials.estimated_time_minutes IS 'Tiempo estimado en minutos para completar/revisar el material. Debe ser proporcionado por el instructor. Mínimo: 1 minuto. Aplica a todos los tipos: reading, quiz, exercise, link, pdf, document.';
```

#### `study_preferences`
```sql
ALTER TABLE public.study_preferences
ADD COLUMN preferred_session_type text DEFAULT 'medium'
CHECK (preferred_session_type IN ('short', 'medium', 'long'));
```

#### `study_plans`
```sql
ALTER TABLE public.study_plans 
ADD COLUMN generation_mode text DEFAULT 'manual' 
CHECK (generation_mode IN ('manual', 'ai_generated'));

ALTER TABLE public.study_plans
ADD COLUMN ai_generation_metadata jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.study_plans
ADD COLUMN preferred_session_type text DEFAULT 'medium'
CHECK (preferred_session_type IN ('short', 'medium', 'long'));
```

#### `study_sessions`
```sql
ALTER TABLE public.study_sessions
ADD COLUMN lesson_id uuid REFERENCES public.course_lessons(lesson_id);

ALTER TABLE public.study_sessions
ADD COLUMN is_ai_generated boolean DEFAULT false;

ALTER TABLE public.study_sessions
ADD COLUMN streak_day integer; -- Día de la racha

ALTER TABLE public.study_sessions
ADD COLUMN lesson_min_time_minutes integer; -- Tiempo mínimo de la lección asignada

ALTER TABLE public.study_sessions
ADD COLUMN session_type text DEFAULT 'medium'
CHECK (session_type IN ('short', 'medium', 'long')); -- Tipo de sesión aplicado

ALTER TABLE public.study_sessions
ADD COLUMN course_complexity jsonb DEFAULT '{}'::jsonb; -- { level, category, complexityMultiplier }
```

### 6.3 Función para Calcular Tiempo de Lección

```sql
CREATE OR REPLACE FUNCTION calculate_lesson_total_time(p_lesson_id uuid)
RETURNS numeric AS $$
DECLARE
  v_video_minutes numeric;
  v_activities_minutes numeric := 0;
  v_materials_minutes numeric := 0;
  v_interactions_minutes numeric := 3; -- Fijo
  v_total_minutes numeric;
BEGIN
  -- Obtener duración del video (proporcionado por instructor)
  SELECT (duration_seconds / 60.0) INTO v_video_minutes
  FROM course_lessons
  WHERE lesson_id = p_lesson_id;
  
  -- Sumar tiempos de actividades (proporcionados por instructor)
  -- Si estimated_time_minutes es NULL, se trata como 0 (pero debería validarse antes)
  SELECT COALESCE(SUM(estimated_time_minutes), 0) INTO v_activities_minutes
  FROM lesson_activities
  WHERE lesson_id = p_lesson_id
    AND estimated_time_minutes IS NOT NULL;
  
  -- Sumar tiempos de materiales (proporcionados por instructor)
  -- Incluye: lecturas, quizzes, ejercicios, enlaces externos, PDFs, documentos
  -- Si estimated_time_minutes es NULL, se trata como 0 (pero debería validarse antes)
  SELECT COALESCE(SUM(estimated_time_minutes), 0) INTO v_materials_minutes
  FROM lesson_materials
  WHERE lesson_id = p_lesson_id
    AND estimated_time_minutes IS NOT NULL;
  
  -- Calcular total
  v_total_minutes := v_video_minutes + v_activities_minutes + v_materials_minutes + v_interactions_minutes;
  
  RETURN CEIL(v_total_minutes);
END;
$$ LANGUAGE plpgsql;
```

### 6.4 Trigger para Actualizar Estimaciones

```sql
CREATE OR REPLACE FUNCTION update_lesson_time_estimate()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lesson_time_estimates (
    lesson_id,
    video_duration_seconds,
    activities_time_minutes,
    reading_time_minutes,
    quiz_time_minutes,
    updated_at
  )
  SELECT 
    COALESCE(NEW.lesson_id, OLD.lesson_id),
    COALESCE(NEW.duration_seconds, (SELECT duration_seconds FROM course_lessons WHERE lesson_id = COALESCE(NEW.lesson_id, OLD.lesson_id))),
    -- Sumar tiempos de actividades (proporcionados por instructor)
    COALESCE((
      SELECT SUM(estimated_time_minutes)
      FROM lesson_activities
      WHERE lesson_id = COALESCE(NEW.lesson_id, OLD.lesson_id)
        AND estimated_time_minutes IS NOT NULL
    ), 0),
    -- Sumar tiempos de materiales tipo 'reading' (proporcionados por instructor)
    COALESCE((
      SELECT SUM(estimated_time_minutes)
      FROM lesson_materials
      WHERE lesson_id = COALESCE(NEW.lesson_id, OLD.lesson_id)
        AND material_type = 'reading'
        AND estimated_time_minutes IS NOT NULL
    ), 0),
    -- Sumar tiempos de quizzes (proporcionados por instructor)
    COALESCE((
      SELECT SUM(estimated_time_minutes)
      FROM lesson_activities
      WHERE lesson_id = COALESCE(NEW.lesson_id, OLD.lesson_id)
        AND activity_type = 'quiz'
        AND estimated_time_minutes IS NOT NULL
    ), 0) + COALESCE((
      SELECT SUM(estimated_time_minutes)
      FROM lesson_materials
      WHERE lesson_id = COALESCE(NEW.lesson_id, OLD.lesson_id)
        AND material_type = 'quiz'
        AND estimated_time_minutes IS NOT NULL
    ), 0),
    now()
  ON CONFLICT (lesson_id) 
  DO UPDATE SET
    video_duration_seconds = EXCLUDED.video_duration_seconds,
    activities_time_minutes = EXCLUDED.activities_time_minutes,
    reading_time_minutes = EXCLUDED.reading_time_minutes,
    quiz_time_minutes = EXCLUDED.quiz_time_minutes,
    updated_at = now();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger en course_lessons (cuando cambia duration_seconds)
CREATE TRIGGER trigger_update_lesson_time_estimate
AFTER INSERT OR UPDATE OF duration_seconds ON course_lessons
FOR EACH ROW
EXECUTE FUNCTION update_lesson_time_estimate();

-- Trigger en lesson_activities (cuando cambia estimated_time_minutes o se agrega/elimina actividad)
CREATE TRIGGER trigger_update_lesson_time_on_activity_change
AFTER INSERT OR UPDATE OF estimated_time_minutes OR DELETE ON lesson_activities
FOR EACH ROW
EXECUTE FUNCTION update_lesson_time_estimate();

-- Trigger en lesson_materials (cuando cambia estimated_time_minutes o se agrega/elimina material)
CREATE TRIGGER trigger_update_lesson_time_on_material_change
AFTER INSERT OR UPDATE OF estimated_time_minutes OR DELETE ON lesson_materials
FOR EACH ROW
EXECUTE FUNCTION update_lesson_time_estimate();
```

**Nota**: Los triggers actualizan automáticamente la tabla `lesson_time_estimates` cuando:
- Se modifica `duration_seconds` en `course_lessons`
- Se agrega, modifica o elimina una actividad y su `estimated_time_minutes`
- Se agrega, modifica o elimina un material y su `estimated_time_minutes`

---

## 7. Motor de IA (Lia)

### 7.1 Algoritmo de Generación de Planes

```typescript
interface GeneratePlanInput {
  userId: string;
  preferences?: {
    intensity?: 'low' | 'medium' | 'high';
    focusCourses?: string[];
    startDate?: Date;
    endDate?: Date;
  };
}

interface GeneratedPlan {
  planId: string;
  sessionsGenerated: number;
  totalHours: number;
  estimatedCompletionDate: Date;
  sessions: GeneratedSession[];
}

interface GeneratedSession {
  lessonId: string;
  courseId: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  lessonMinTime: number;
  sessionType: SessionType;
  courseComplexity: CourseComplexity;
}

async function generatePlanWithAI(
  userId: string, 
  preferences: GeneratePlanInput['preferences'] = {}
): Promise<GeneratedPlan> {
  // 1. Obtener datos del usuario y perfil completo
  const user = await getUser(userId);
  const userProfile = await getUserProfileComplete(userId); // Incluye rol, tamaño empresa, área, nivel, etc.
  
  // 2. Calcular disponibilidad granular
  const availability = getUserAvailabilityProfile(userProfile);
  
  // 3. Obtener cursos adquiridos
  const courses = await getPurchasedCourses(userId);
  if (courses.length === 0) {
    throw new Error('Usuario no tiene cursos adquiridos');
  }
  
  // 4. Obtener progreso actual
  const progress = await getCourseProgress(userId, courses.map(c => c.course_id));
  
  // 5. Calcular tiempos mínimos por lección
  const lessonTimes = await calculateAllLessonTimes(courses);
  
  // 6. Obtener tipo de sesión preferido del usuario
  const userPreferences = await getStudyPreferences(userId);
  const preferredSessionType: SessionType = userPreferences?.preferred_session_type || 'medium';
  const finalAvailability = mergePreferences(availability, userPreferences);
  
  // 7. Calcular complejidad de cada curso
  const courseComplexities = new Map<string, CourseComplexity>();
  for (const course of courses) {
    const complexity = calculateCourseComplexity(course.level, course.category);
    courseComplexities.set(course.course_id, complexity);
  }
  
  // 8. Aplicar mejores prácticas de estudio
  const studyPractices = {
    spacedRepetition: true,
    distributedPractice: true,
    interleaving: true,
    pomodoro: true,
    activeRecall: true
  };
  
  // 9. Generar distribución
  const sessions = distributeLessons({
    courses,
    progress,
    lessonTimes,
    availability: finalAvailability,
    preferences,
    studyPractices,
    userProfile,
    preferredSessionType,
    courseComplexities,
    startDate: preferences?.startDate || new Date(),
    endDate: preferences?.endDate || calculateEndDate(courses, lessonTimes, finalAvailability)
  });
  
  // 10. Programar repasos espaciados para lecciones ya completadas
  const reviewSessions = await scheduleSpacedRepetition(userId, courses, progress);
  
  // 11. Combinar sesiones nuevas con repasos
  const allSessions = [...sessions, ...reviewSessions].sort((a, b) => 
    a.startTime.getTime() - b.startTime.getTime()
  );
  
  // 12. Crear plan
  const plan = await createStudyPlan({
    user_id: userId,
    name: `Plan Generado por IA - ${new Date().toLocaleDateString()}`,
    description: `Plan optimizado para ${userProfile.rol_profesional} en empresa ${userProfile.tamano_empresa?.nombre || 'mediana'}`,
    generation_mode: 'ai_generated',
    preferred_session_type: preferredSessionType,
    goal_hours_per_week: calculateWeeklyHours(finalAvailability),
    preferred_days: mapPreferredDays(finalAvailability.daysPerWeek),
    preferred_time_blocks: mapTimeBlocks(finalAvailability),
    ai_generation_metadata: {
      role: userProfile.rol_profesional,
      companySize: userProfile.tamano_empresa,
      area: userProfile.area_nombre,
      level: userProfile.nivel_nombre,
      sector: userProfile.sector_nombre,
      preferredSessionType: preferredSessionType,
      coursesIncluded: courses.map(c => c.course_id),
      courseComplexities: Object.fromEntries(courseComplexities),
      totalLessons: allSessions.length,
      studyPractices: studyPractices,
      generatedAt: new Date().toISOString()
    }
  });
  
  // 13. Crear sesiones
  const createdSessions = await createSessions(plan.id, allSessions);
  
  // 14. Sincronizar con calendario si está configurado
  const calendarIntegration = await getCalendarIntegration(userId);
  if (calendarIntegration) {
    await syncSessionsToCalendar(userId, createdSessions, calendarIntegration);
  }
  
  return {
    planId: plan.id,
    sessionsGenerated: createdSessions.length,
    totalHours: sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60,
    estimatedCompletionDate: sessions[sessions.length - 1].endTime,
    sessions: createdSessions
  };
}
```

### 7.2 Función de Distribución de Lecciones

```typescript
function distributeLessons(params: {
  courses: Course[];
  progress: Map<string, number>;
  lessonTimes: Map<string, number>;
  availability: RoleAvailabilityProfile;
  preferences: GeneratePlanInput['preferences'];
  studyPractices: {
    spacedRepetition: boolean;
    distributedPractice: boolean;
    interleaving: boolean;
    pomodoro: boolean;
    activeRecall: boolean;
  };
  userProfile: UserProfile;
  preferredSessionType: SessionType;
  courseComplexities: Map<string, CourseComplexity>;
  startDate: Date;
  endDate: Date;
}): GeneratedSession[] {
  const { courses, progress, lessonTimes, availability, preferences, startDate, endDate } = params;
  
  // 1. Obtener todas las lecciones pendientes
  const pendingLessons: Array<{
    lessonId: string;
    courseId: string;
    courseTitle: string;
    lessonTitle: string;
    minTime: number;
    progress: number;
    order: number;
  }> = [];
  
  for (const course of courses) {
    const courseProgress = progress.get(course.course_id) || 0;
    const lessons = await getCourseLessons(course.course_id);
    
    for (const lesson of lessons) {
      const lessonProgress = await getLessonProgress(course.course_id, lesson.lesson_id);
      if (lessonProgress < 100) {
        pendingLessons.push({
          lessonId: lesson.lesson_id,
          courseId: course.course_id,
          courseTitle: course.title,
          lessonTitle: lesson.title,
          minTime: lessonTimes.get(lesson.lesson_id) || 30,
          progress: courseProgress,
          order: lesson.order_index
        });
      }
    }
  }
  
  // 2. Ordenar lecciones: priorizar cursos con más progreso, luego por orden
  pendingLessons.sort((a, b) => {
    if (a.progress !== b.progress) {
      return b.progress - a.progress; // Mayor progreso primero
    }
    return a.order - b.order; // Luego por orden
  });
  
  // 3. Distribuir en sesiones
  const sessions: GeneratedSession[] = [];
  let currentDate = new Date(startDate);
  let lessonsPerDay = 0;
  const maxLessonsPerDay = availability.maxLessonsPerDay || (availability.daysPerWeek.max <= 4 ? 2 : 3);
  const lastLessonByCourse = new Map<string, Date>(); // Para práctica distribuida
  
  for (const lesson of pendingLessons) {
    // Aplicar Práctica Distribuida: verificar que haya pasado al menos 1 día desde la última lección del mismo curso
    if (params.studyPractices.distributedPractice) {
      const lastLessonDate = lastLessonByCourse.get(lesson.courseId);
      if (lastLessonDate) {
        const daysSinceLastLesson = Math.floor(
          (currentDate.getTime() - lastLessonDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastLesson < 1) {
          currentDate = addDays(lastLessonDate, 1);
          lessonsPerDay = 0;
        }
      }
    }
    
    // Encontrar próximo día disponible
    while (!isDayAvailable(currentDate, availability)) {
      currentDate = addDays(currentDate, 1);
      lessonsPerDay = 0;
      
      if (currentDate > endDate) {
        break; // No más días disponibles
      }
    }
    
    if (currentDate > endDate) {
      break;
    }
    
    // Si ya hay muchas lecciones este día, pasar al siguiente
    if (lessonsPerDay >= maxLessonsPerDay) {
      currentDate = addDays(currentDate, 1);
      lessonsPerDay = 0;
      continue;
    }
    
    // Aplicar Estudio Intercalado: evitar tener múltiples lecciones del mismo curso en días consecutivos
    if (params.studyPractices.interleaving && lessonsPerDay > 0) {
      const yesterdaySessions = sessions.filter(s => 
        s.startTime.toDateString() === addDays(currentDate, -1).toDateString()
      );
      const hasSameCourseYesterday = yesterdaySessions.some(s => s.courseId === lesson.courseId);
      if (hasSameCourseYesterday && lessonsPerDay >= 1) {
        // Si ayer hubo una lección del mismo curso y ya hay una hoy, pasar al siguiente día
        currentDate = addDays(currentDate, 1);
        lessonsPerDay = 0;
        continue;
      }
    }
    
    // Determinar hora de inicio según preferencias
    const startTime = getPreferredStartTime(currentDate, availability);
    
    // Obtener complejidad del curso
    const courseComplexity = params.courseComplexities.get(lesson.courseId) || {
      level: 'intermediate',
      category: 'default',
      complexityMultiplier: 1.0
    };
    
    // Obtener duración base según tipo de sesión preferido
    const sessionConfig = SESSION_TYPES[params.preferredSessionType];
    const baseDuration = (sessionConfig.duration.min + sessionConfig.duration.max) / 2;
    
    // Ajustar duración según complejidad del curso
    let duration = adjustSessionDuration(baseDuration, params.preferredSessionType, courseComplexity);
    
    // Asegurar que cumpla con el tiempo mínimo de la lección
    duration = Math.max(duration, lesson.minTime);
    
    // Aplicar Técnica Pomodoro: ajustar según disponibilidad si es necesario
    if (availability.pomodoroLength && params.studyPractices.pomodoro) {
      // Si la duración es muy diferente del pomodoro, ajustar
      const pomodoroCount = Math.ceil(duration / availability.pomodoroLength);
      duration = Math.min(
        pomodoroCount * availability.pomodoroLength,
        sessionConfig.duration.max
      );
    }
    
    // Respetar límites de disponibilidad del perfil
    duration = Math.min(duration, availability.sessionLength.max);
    duration = Math.max(duration, availability.sessionLength.min);
    
    const endTime = addMinutes(startTime, duration);
    
    sessions.push({
      lessonId: lesson.lessonId,
      courseId: lesson.courseId,
      startTime,
      endTime,
      durationMinutes: duration,
      lessonMinTime: lesson.minTime,
      sessionType: params.preferredSessionType,
      courseComplexity: courseComplexity
    });
    
    // Actualizar última lección del curso para práctica distribuida
    lastLessonByCourse.set(lesson.courseId, currentDate);
    lessonsPerDay++;
  }
  
  return sessions;
}

// Función para programar repasos espaciados
async function scheduleSpacedRepetition(
  userId: string,
  courses: Course[],
  progress: Map<string, number>
): Promise<GeneratedSession[]> {
  const reviewSessions: GeneratedSession[] = [];
  const intervals = [1, 3, 7, 14, 30]; // Días para repasos
  
  // Obtener lecciones completadas que necesitan repaso
  for (const course of courses) {
    const courseProgress = progress.get(course.course_id) || 0;
    if (courseProgress > 0 && courseProgress < 100) {
      // Obtener lecciones completadas
      const completedLessons = await getCompletedLessons(userId, course.course_id);
      
      for (const lesson of completedLessons) {
        // Programar repasos según intervalos
        for (let i = 0; i < intervals.length; i++) {
          const reviewDate = addDays(new Date(lesson.completedAt), intervals[i]);
          if (reviewDate <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) { // Máximo 90 días
            reviewSessions.push({
              lessonId: lesson.lesson_id,
              courseId: course.course_id,
              startTime: reviewDate,
              endTime: addMinutes(reviewDate, 15), // Repasos más cortos
              durationMinutes: 15,
              lessonMinTime: 15,
              isReview: true,
              reviewInterval: intervals[i]
            });
          }
        }
      }
    }
  }
  
  return reviewSessions;
}
```

function isDayAvailable(date: Date, availability: RoleAvailabilityProfile): boolean {
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, etc.
  const normalizedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convertir a 1-7 (Lunes-Domingo)
  
  // Verificar si el día está en los días preferidos
  // availability.daysPerWeek indica cuántos días por semana, no días específicos
  // Por defecto, usar lunes-viernes si no hay preferencias específicas
  return normalizedDay >= 1 && normalizedDay <= 5;
}

function getPreferredStartTime(date: Date, availability: RoleAvailabilityProfile): Date {
  const time = availability.preferredTimes[0] || 'morning';
  const startHour = {
    'morning': 9,
    'afternoon': 14,
    'evening': 19,
    'night': 20
  }[time] || 9;
  
  const startTime = new Date(date);
  startTime.setHours(startHour, 0, 0, 0);
  return startTime;
}
```

### 7.3 Endpoint API

```
POST /api/study-planner/ai/generate-plan

Request:
{
  "preferences": {
    "intensity": "medium",
    "focusCourses": ["course_id_1", "course_id_2"],
    "startDate": "2024-01-15T00:00:00Z",
    "endDate": "2024-02-15T00:00:00Z"
  }
}

Response:
{
  "success": true,
  "data": {
    "planId": "uuid",
    "sessionsGenerated": 15,
    "totalHours": 12.5,
    "estimatedCompletionDate": "2024-02-15T00:00:00Z",
    "sessions": [...]
  }
}
```

---

## 8. Interfaz de Usuario

### 8.1 Flujo: Selección de Modalidad

```
┌─────────────────────────────────────────┐
│  ¿Cómo quieres crear tu plan?          │
│                                         │
│  [ ] Configuración Manual              │
│      Crea tu plan personalizado        │
│                                         │
│  [ ] Generación con IA (Lia)           │
│      Lia crea un plan optimizado       │
│      para ti                            │
│                                         │
│  [Continuar]                            │
└─────────────────────────────────────────┘
```

### 8.2 Flujo: Modalidad Manual

**Paso 1: Selección de Cursos**
- Lista de cursos adquiridos con checkboxes
- Mostrar progreso actual por curso
- Indicador de tiempo estimado total

**Paso 2: Configuración de Tiempos**
- Selector de días de la semana (checkboxes)
- Selector de horarios (mañana, tarde, noche)
- **Selector de Tipo de Sesión**:
  - [ ] Sesión Corta (20-35 min) - Para contenido rápido
  - [ ] Sesión Media (45-60 min) - Recomendado
  - [ ] Sesión Larga (75-120 min) - Para contenido profundo
- Input de duración de sesión (en minutos) - Se ajusta automáticamente según tipo seleccionado
- **Validación en tiempo real**: 
  - Mostrar tiempo mínimo requerido
  - Si tiempo < mínimo: mensaje de error en rojo
  - Sugerencia automática de tiempo mínimo
  - Mostrar cómo la complejidad del curso afecta la duración

**Paso 3: Revisión**
- Resumen del plan
- Calendario preview
- Lista de sesiones generadas
- Botón "Crear Plan"

### 8.3 Flujo: Modalidad IA

**Paso 1: Información Mostrada**
- Rol detectado: "CEO" (o el que corresponda)
- Cursos que se incluirán (con indicador de complejidad: nivel + categoría)
- Disponibilidad estimada según rol
- **Selector de Tipo de Sesión Preferido**:
  - [ ] Sesión Corta (20-35 min)
  - [ ] Sesión Media (45-60 min) - Recomendado para tu rol
  - [ ] Sesión Larga (75-120 min)
- **Vista previa de ajustes**:
  - "Cursos avanzados requerirán sesiones más largas"
  - "Tu tipo de sesión se ajustará según la complejidad de cada curso"
- Botón "Generar Plan con Lia"

**Paso 2: Generación**
- Loading state con mensajes:
  - "Lia está analizando tus cursos..."
  - "Calculando complejidad de cada curso..."
  - "Ajustando duraciones según tipo de sesión y complejidad..."
  - "Optimizando horarios según tu rol..."
  - "Generando sesiones personalizadas..."
- Barra de progreso

**Paso 3: Plan Generado**
- Vista de calendario con sesiones
- Resumen: "X sesiones programadas", "Y horas semanales"
- Opciones: 
  - "Aceptar Plan"
  - "Ajustar Manualmente"
  - "Regenerar con Diferentes Parámetros"

### 8.4 Dashboard de Seguimiento

**Métricas Principales**:
- Racha actual: "🔥 7 días"
- Sesiones completadas hoy: "2/3"
- Progreso semanal: Barra de progreso
- Próxima sesión: Card con detalles

**Calendario**:
- Sesiones planificadas (azul)
- Sesiones completadas (verde)
- Sesiones pendientes (amarillo)
- Sesiones perdidas (rojo)

---

## 9. Testing y Métricas

### 9.1 Plan de Testing

#### Tests Unitarios
- Cálculo de tiempo mínimo de lección
- Validación de tiempos de sesión
- Generación de distribución por rol
- Cálculo de rachas

#### Tests de Integración
- Flujo completo de creación de plan manual
- Flujo completo de generación con IA
- Sincronización con calendarios
- Actualización de rachas

#### Tests de Usuario
- Usabilidad de selección de modalidad
- Claridad de mensajes de validación
- Satisfacción con planes generados por IA

### 9.2 Métricas de Éxito

- Tasa de adopción de modalidad IA vs Manual
- Tasa de completitud de planes generados por IA
- Tasa de completitud de planes manuales
- Promedio de racha por modalidad
- Tiempo promedio de configuración manual
- Satisfacción del usuario con planes generados

### 9.3 Analytics

- Usuarios usando cada modalidad
- Tasa de éxito por rol
- Tiempos promedio de estudio por rol
- Cursos más incluidos en planes

---

## 10. Roadmap de Implementación

### Fase 1: Fundación (Semanas 1-2)
- [ ] Agregar campo `estimated_time_minutes` a `lesson_activities`
- [ ] Agregar campo `estimated_time_minutes` a `lesson_materials`
- [ ] Crear tabla `lesson_time_estimates`
- [ ] Implementar función `calculate_lesson_total_time()` (usando tiempos del instructor)
- [ ] Crear triggers para actualización automática
- [ ] Implementar validaciones de tiempo mínimo
- [ ] **Actualizar UI del instructor**: Agregar campo de tiempo estimado en formularios de actividades y materiales
- [ ] **Migración de datos**: Script para notificar a instructores sobre actividades/materiales sin tiempo estimado
- [ ] Mejorar UI de configuración manual

### Fase 2: IA Básica (Semanas 3-5)
- [ ] Desarrollar motor de generación con Lia
- [ ] Implementar perfiles por rol (ROLE_PROFILES)
- [ ] Integrar con datos de usuario (rol, cursos, progreso)
- [ ] UI para generación con IA
- [ ] Endpoint `/api/study-planner/ai/generate-plan`

### Fase 3: Incentivos (Semanas 6-7)
- [ ] Sistema de rachas
- [ ] Dashboard de seguimiento
- [ ] Notificaciones de rachas
- [ ] Visualización de métricas

### Fase 4: Integración (Semana 8)
- [ ] Sincronización automática con calendarios
- [ ] Exportación ICS mejorada
- [ ] Testing completo
- [ ] Documentación de usuario

### Fase 5: Optimización (Futuro)
- [ ] Aprendizaje de preferencias del usuario
- [ ] Ajuste automático de planes
- [ ] Logros y gamificación avanzada
- [ ] Análisis predictivo de completitud

### 10.1 Migración de Datos Existentes

**Problema**: Si ya existen actividades y materiales en la base de datos, estos no tendrán `estimated_time_minutes` configurado.

**Solución**:
1. **Script de migración**: Identificar todas las actividades y materiales sin `estimated_time_minutes`
2. **Notificación a instructores**: Enviar notificación/email a instructores con lista de contenido pendiente de configuración
3. **Validación en UI**: No permitir publicar lecciones hasta que todos los tiempos estén configurados
4. **Valores por defecto**: NO usar valores por defecto automáticos. El instructor DEBE proporcionar los tiempos manualmente

**Query para identificar contenido pendiente**:
```sql
-- Actividades sin tiempo estimado
SELECT 
  la.activity_id,
  la.activity_title,
  la.activity_type,
  l.lesson_title,
  c.title as course_title
FROM lesson_activities la
JOIN course_lessons l ON la.lesson_id = l.lesson_id
JOIN course_modules cm ON l.module_id = cm.module_id
JOIN courses c ON cm.course_id = c.id
WHERE la.estimated_time_minutes IS NULL;

-- Materiales sin tiempo estimado
SELECT 
  lm.material_id,
  lm.material_title,
  lm.material_type,
  l.lesson_title,
  c.title as course_title
FROM lesson_materials lm
JOIN course_lessons l ON lm.lesson_id = l.lesson_id
JOIN course_modules cm ON l.module_id = cm.module_id
JOIN courses c ON cm.course_id = c.id
WHERE lm.estimated_time_minutes IS NULL;
```

### 10.2 Interfaz del Instructor

**Requisitos de UI**:
1. **Formulario de Actividad**: Agregar campo "Tiempo Estimado (minutos)" con:
   - Input numérico (mínimo: 1)
   - Validación en tiempo real
   - Mensaje de ayuda: "Tiempo estimado para completar esta actividad"
   - Indicador visual si falta el tiempo

2. **Formulario de Material**: Agregar campo "Tiempo Estimado (minutos)" con:
   - Input numérico (mínimo: 1)
   - Validación en tiempo real
   - Mensaje de ayuda según tipo:
     - Lectura: "Tiempo estimado de lectura"
     - Quiz: "Tiempo estimado para completar el quiz"
     - Ejercicio: "Tiempo estimado para completar el ejercicio"
     - Enlace: "Tiempo estimado para revisar el contenido"
   - Indicador visual si falta el tiempo

3. **Validación al Publicar**:
   - Verificar que todas las actividades y materiales tengan `estimated_time_minutes`
   - Mostrar lista de elementos faltantes
   - Bloquear publicación hasta completar

4. **Vista Previa de Tiempo Total**:
   - Mostrar tiempo total calculado de la lección
   - Desglose: Video + Actividades + Materiales + Interacciones
   - Actualización en tiempo real al modificar tiempos

---

## 11. Consideraciones Técnicas

### 11.1 Performance

- Cachear cálculos de tiempo de lecciones (usar `lesson_time_estimates`)
- Usar índices en consultas frecuentes
- Optimizar generación de planes (usar workers si es necesario)
- Rate limiting en endpoint de generación con IA

### 11.2 Escalabilidad

- La generación de planes puede ser costosa computacionalmente
- Considerar cola de trabajos para generaciones masivas
- Cachear perfiles de roles

### 11.3 Monitoreo

- Trackear tiempo de generación de planes
- Monitorear errores en validaciones
- Alertas si tasa de error en generación > 5%

### 11.4 Seguridad

- Validar que usuario solo accede a sus propios datos
- Encriptar tokens de calendarios
- Validar permisos antes de generar planes

---

## 12. Anexos

### Anexo A: Ejemplo de Plan Generado

```json
{
  "planId": "uuid",
  "generationMode": "ai_generated",
  "userRole": "CEO",
  "companySize": "Grande (251-1000 empleados)",
  "preferredSessionType": "medium",
  "sessions": [
    {
      "id": "session_1",
      "date": "2024-01-15",
      "time": "07:00",
      "durationMinutes": 60,
      "sessionType": "medium",
      "course": "Machine Learning Avanzado",
      "courseLevel": "advanced",
      "courseCategory": "tecnologia",
      "courseComplexity": {
        "level": "advanced",
        "category": "tecnologia",
        "complexityMultiplier": 1.38
      },
      "lesson": "Lección 3: Redes Neuronales",
      "lessonMinTime": 50,
      "adjustmentReason": "Curso avanzado técnico requiere más tiempo"
    },
    {
      "id": "session_2",
      "date": "2024-01-16",
      "time": "07:00",
      "durationMinutes": 45,
      "sessionType": "medium",
      "course": "Introducción al Marketing",
      "courseLevel": "beginner",
      "courseCategory": "marketing",
      "courseComplexity": {
        "level": "beginner",
        "category": "marketing",
        "complexityMultiplier": 0.99
      },
      "lesson": "Lección 1: Fundamentos",
      "lessonMinTime": 40,
      "adjustmentReason": "Curso básico, duración estándar"
    }
  ],
  "totalSessions": 12,
  "estimatedCompletion": "2024-02-28"
}
```

### Anexo B: Ejemplo de Cálculo de Duración con Complejidad

**Escenario**: Usuario CEO de empresa grande, prefiere Sesión Media

**Curso 1**: "Machine Learning Avanzado"
- Nivel: `advanced` (multiplicador: 1.2x)
- Categoría: `tecnologia` (+15%)
- Complejidad total: 1.2 × 1.15 = 1.38x
- Duración base (Sesión Media): 52.5 min (promedio de 45-60)
- Duración ajustada: 52.5 × 1.38 = **72.4 minutos** → Ajustado a límite máximo de 60 min
- **Resultado**: 60 minutos (límite máximo de Sesión Media)

**Curso 2**: "Introducción al Marketing"
- Nivel: `beginner` (multiplicador: 0.9x)
- Categoría: `marketing` (+10%)
- Complejidad total: 0.9 × 1.10 = 0.99x
- Duración base (Sesión Media): 52.5 min
- Duración ajustada: 52.5 × 0.99 = **52 minutos**
- **Resultado**: 52 minutos (dentro del rango de Sesión Media)

**Curso 3**: "Diseño UX Avanzado" (Sesión Larga seleccionada)
- Nivel: `advanced` (multiplicador: 1.2x)
- Categoría: `diseño` (+12%)
- Complejidad total: 1.2 × 1.12 = 1.344x
- Duración base (Sesión Larga): 97.5 min (promedio de 75-120)
- Duración ajustada: 97.5 × 1.344 = **131 minutos** → Ajustado a límite máximo de 120 min
- **Resultado**: 120 minutos (límite máximo de Sesión Larga)

### Anexo C: Mensajes de Validación

- **Tiempo insuficiente**: "El tiempo configurado (X min) es menor al tiempo mínimo requerido para esta lección (Y min). Por favor, ajusta la duración."
- **Plan generado**: "¡Lia ha creado un plan optimizado para ti! 12 sesiones distribuidas en 4 semanas, adaptadas a tu rol de CEO en empresa grande. Las duraciones se han ajustado según la complejidad de cada curso."
- **Racha rota**: "Tu racha de 7 días se ha interrumpido. ¡No te rindas! Continúa con tu plan de estudios."
- **Tipo de sesión recomendado**: "Basado en tu rol y disponibilidad, te recomendamos Sesión Media (45-60 min). Puedes cambiarlo en cualquier momento."
- **Ajuste por complejidad**: "Este curso es avanzado y técnico, por lo que la sesión se ha extendido a 60 minutos para permitir una comprensión adecuada."

---

**Versión**: 1.0  
**Última actualización**: Diciembre 2024  
**Autor**: Equipo de Desarrollo Aprende y Aplica

