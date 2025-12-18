# Proceso de Conversión SCORM → Formato Nativo

## Resumen Ejecutivo

Este documento define el proceso técnico para transformar paquetes SCORM (1.2 y 2004) al formato nativo de la plataforma **Aprende y Aplica**, conservando la estructura pedagógica, navegación, evaluaciones y seguimiento del progreso.

### Alcance
- **Entrada**: Paquetes SCORM (.zip) con `imsmanifest.xml`
- **Salida**: Estructura nativa (Course → Module → Lesson) con tracking integrado
- **Versiones soportadas**: SCORM 1.2 y SCORM 2004 (3rd/4th Edition)

### Beneficios de la Conversión
1. Experiencia de usuario consistente con el resto de la plataforma
2. Tracking unificado en el modelo de datos nativo
3. Soporte completo de internacionalización (ES/EN/PT)
4. Mejor rendimiento (sin runtime SCORM)
5. Edición y actualización de contenido simplificada

---

## 1. Hallazgos en el Paquete SCORM

### 1.1 Estructura del imsmanifest.xml

El parser actual (`lib/scorm/parser.ts`) extrae:

```typescript
interface ScormManifest {
  version: 'SCORM_1.2' | 'SCORM_2004';
  title: string;
  description?: string;
  entryPoint: string;
  organizations: ScormOrganization[];
  resources: ScormResource[];
  objectives: ScormObjective[];
}

interface ScormOrganization {
  identifier: string;
  title: string;
  items: ScormItem[];
}

interface ScormItem {
  identifier: string;
  title: string;
  resourceId?: string;
  children?: ScormItem[];  // Estructura jerárquica
  objectives?: ScormObjective[];
}

interface ScormResource {
  identifier: string;
  type: string;
  href?: string;
  files: string[];
}
```

### 1.2 Elementos Clave a Inspeccionar

| Elemento | Ubicación | Propósito |
|----------|-----------|-----------|
| `<schemaversion>` | `manifest/metadata` | Detectar SCORM 1.2 vs 2004 |
| `<organizations>` | `manifest/organizations` | Estructura del curso |
| `<item>` | Dentro de `organization` | Ítems navegables (módulos/lecciones) |
| `<resource>` | `manifest/resources` | Assets y entry points |
| `<imsss:sequencing>` | Dentro de `item` (2004) | Reglas de secuenciación |
| `<adlseq:objectives>` | Dentro de `sequencing` | Objetivos de aprendizaje |

### 1.3 Detección de Versión

```typescript
// De parser.ts
const schemaVersion = manifest.metadata?.schemaversion || '1.2';
const version = schemaVersion.includes('2004') ? 'SCORM_2004' : 'SCORM_1.2';
```

### 1.4 Diferencias Clave entre Versiones

| Aspecto | SCORM 1.2 | SCORM 2004 |
|---------|-----------|------------|
| API Object | `window.API` | `window.API_1484_11` |
| Status | `lesson_status` | `completion_status` + `success_status` |
| Score | `cmi.core.score.raw` | `cmi.score.scaled` (0-1) |
| Secuenciación | Sin soporte | `<imsss:sequencing>` completo |
| Objetivos | Limitados | Globales y locales con mapeo |

---

## 2. Mapeo SCORM → Formato Nativo

### 2.1 Mapeo de Estructuras

| SCORM | Nativo (Supabase) | Notas |
|-------|-------------------|-------|
| `manifest` | `courses` | Un paquete = un curso |
| `organization` | `courses` (metadata) | Título, descripción |
| `item` (nivel 1) | `course_modules` | Módulos del curso |
| `item` (nivel 2+) | `course_lessons` | Lecciones dentro de módulos |
| `resource[@href]` | `course_lessons.video_provider_id` o asset externo | Contenido HTML/multimedia |
| `sequencing/objectives` | `lesson_objectives` (nueva tabla) | Objetivos por lección |

### 2.2 Tabla de Mapeo de Campos

#### Curso (manifest → courses)

| Campo SCORM | Campo Nativo | Transformación |
|-------------|--------------|----------------|
| `manifest.title` | `courses.title` | Directo |
| `manifest.description` | `courses.description` | Directo |
| `manifest.version` | `courses.metadata.scorm_version` | JSON metadata |
| `organization.identifier` | `courses.metadata.scorm_org_id` | Para trazabilidad |
| Calculado | `courses.duration_total_minutes` | Suma de lecciones |
| Calculado | `courses.slug` | Generado desde título |

#### Módulos (item nivel 1 → course_modules)

| Campo SCORM | Campo Nativo | Transformación |
|-------------|--------------|----------------|
| `item.identifier` | `course_modules.metadata.scorm_item_id` | Para trazabilidad |
| `item.title` | `course_modules.module_title` | Directo |
| Índice en array | `course_modules.module_order_index` | Posición 0-indexed |
| Calculado | `course_modules.module_duration_minutes` | Suma de lecciones |
| `true` (default) | `course_modules.is_published` | Activo por defecto |

#### Lecciones (item nivel 2+ → course_lessons)

| Campo SCORM | Campo Nativo | Transformación |
|-------------|--------------|----------------|
| `item.identifier` | `course_lessons.metadata.scorm_item_id` | Para trazabilidad |
| `item.title` | `course_lessons.lesson_title` | Directo |
| `item.resourceId` → `resource.href` | `course_lessons.video_provider_id` | URL del contenido |
| `'scorm_html'` | `course_lessons.video_provider` | Nuevo tipo de provider |
| Índice | `course_lessons.lesson_order_index` | Posición |
| Estimado/Manual | `course_lessons.duration_seconds` | Ver sección 2.3 |
| `true` | `course_lessons.is_published` | Activo por defecto |

### 2.3 Estimación de Duración

Para contenido SCORM la duración no viene explícita. Estrategias:

1. **Análisis de texto**: Extraer texto del HTML y calcular tiempo de lectura (~200 palabras/min)
2. **Detección de multimedia**: Parsear HTML para encontrar `<video>` o `<audio>` y extraer duración
3. **Valor por defecto**: 10 minutos si no se puede determinar
4. **Manual post-importación**: Flag para revisión del instructor

```typescript
async function estimateDuration(htmlContent: string): Promise<number> {
  // Extraer texto plano
  const textContent = htmlContent.replace(/<[^>]*>/g, '');
  const wordCount = textContent.split(/\s+/).length;
  const readingMinutes = Math.ceil(wordCount / 200);

  // Buscar videos/audio
  const videoMatch = htmlContent.match(/<video[^>]*duration="?(\d+)"?/);
  const videoDuration = videoMatch ? parseInt(videoMatch[1]) / 60 : 0;

  return Math.max(readingMinutes + videoDuration, 5) * 60; // En segundos
}
```

---

## 3. Conversión de Contenido y Assets

### 3.1 Clasificación de Assets

| Tipo | Extensiones | Destino | Tratamiento |
|------|-------------|---------|-------------|
| HTML Entry | `.html`, `.htm` | Supabase Storage | Procesar y sanitizar |
| Estilos | `.css` | Supabase Storage | Copiar directo |
| Scripts | `.js` | Supabase Storage | Copiar (sandbox) |
| Imágenes | `.png`, `.jpg`, `.gif`, `.svg` | Supabase Storage | Optimizar |
| Videos | `.mp4`, `.webm` | Supabase Storage | Copiar directo |
| Audio | `.mp3`, `.wav`, `.ogg` | Supabase Storage | Copiar directo |
| Documentos | `.pdf` | Supabase Storage | Copiar directo |
| Fuentes | `.woff`, `.woff2`, `.ttf` | Supabase Storage | Copiar directo |

### 3.2 Estructura de Almacenamiento

```
supabase-storage/
└── converted-courses/
    └── {organization_id}/
        └── {course_id}/
            ├── content/
            │   ├── module-1/
            │   │   ├── lesson-1/
            │   │   │   ├── index.html
            │   │   │   ├── styles.css
            │   │   │   └── scripts.js
            │   │   └── lesson-2/
            │   │       └── ...
            │   └── module-2/
            │       └── ...
            └── assets/
                ├── images/
                ├── videos/
                └── documents/
```

### 3.3 Procesamiento de HTML

```typescript
async function processScormHtml(
  html: string,
  resourcePath: string,
  newBasePath: string
): Promise<string> {
  // 1. Remover llamadas a API SCORM
  html = html.replace(/API\.(LMS)?GetValue\([^)]+\)/g, '""');
  html = html.replace(/API\.(LMS)?SetValue\([^)]+\)/g, 'true');
  html = html.replace(/API\.(LMS)?Initialize\([^)]+\)/g, 'true');
  html = html.replace(/API\.(LMS)?Finish\([^)]+\)/g, 'true');
  html = html.replace(/API\.(LMS)?Commit\([^)]+\)/g, 'true');

  // 2. Actualizar referencias a assets
  html = html.replace(
    /(?:src|href)=["']([^"']+)["']/g,
    (match, path) => {
      if (path.startsWith('http') || path.startsWith('data:')) return match;
      const newPath = resolveAssetPath(path, resourcePath, newBasePath);
      return match.replace(path, newPath);
    }
  );

  // 3. Sanitizar scripts potencialmente peligrosos
  html = sanitizeScripts(html);

  // 4. Agregar wrapper de estilos de la plataforma
  html = wrapWithPlatformStyles(html);

  return html;
}
```

### 3.4 Extracción de Contenido para Evaluaciones

Si el SCORM contiene quizzes embebidos, se deben extraer:

```typescript
interface ExtractedQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching';
  options?: string[];
  correctAnswer: string | string[];
  points?: number;
  feedback?: { correct?: string; incorrect?: string };
}

async function extractQuestionsFromScorm(html: string): Promise<ExtractedQuestion[]> {
  // Detectar patrones comunes de preguntas SCORM
  const questions: ExtractedQuestion[] = [];

  // Patrón 1: Articulate/Storyline
  const articulateQuestions = extractArticulateQuestions(html);

  // Patrón 2: Captivate
  const captivateQuestions = extractCaptivateQuestions(html);

  // Patrón 3: iSpring
  const iSpringQuestions = extractISpringQuestions(html);

  return [...articulateQuestions, ...captivateQuestions, ...iSpringQuestions];
}
```

---

## 4. Navegación y Secuenciación

### 4.1 Modelo de Navegación Nativo

La plataforma usa navegación lineal con posibilidad de:
- Navegación libre entre lecciones completadas
- Bloqueo opcional de lecciones no completadas
- Prerequisitos a nivel de módulo

### 4.2 Mapeo de Secuenciación SCORM 2004

| Regla SCORM 2004 | Equivalente Nativo | Implementación |
|------------------|-------------------|----------------|
| `<imsss:controlMode choice="true">` | Navegación libre | `course.allow_free_navigation = true` |
| `<imsss:controlMode choiceExit="false">` | Completar antes de salir | `lesson.require_completion = true` |
| `<imsss:controlMode flow="true">` | Secuencial automático | Comportamiento por defecto |
| `<imsss:preConditionRule>` | Prerequisitos | `module.prerequisites = [module_ids]` |
| `<imsss:postConditionRule>` | Acciones post-completado | Triggers en base de datos |

### 4.3 Workarounds para Reglas No Soportadas

**Regla: Retry Attempts (SCORM 2004)**
```typescript
// SCORM: attemptLimit = 3
// Nativo: Crear lógica de intentos en la tabla lesson_attempts
interface LessonAttempt {
  id: string;
  lesson_id: string;
  user_id: string;
  attempt_number: number;
  max_attempts: number; // Migrado de SCORM
  score?: number;
  status: 'in_progress' | 'completed' | 'failed';
}
```

**Regla: Satisfaction Rollup**
```typescript
// SCORM: objectiveMeasureWeight para calcular nota final
// Nativo: Calcular en función SQL o trigger
CREATE OR REPLACE FUNCTION calculate_module_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE course_modules
  SET completion_percentage = (
    SELECT AVG(CASE WHEN is_completed THEN 100 ELSE 0 END)
    FROM user_lesson_progress
    WHERE lesson_id IN (
      SELECT lesson_id FROM course_lessons WHERE module_id = NEW.module_id
    )
  )
  WHERE module_id = NEW.module_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4.4 Prerrequisitos

Nueva tabla para soportar prerrequisitos complejos:

```sql
CREATE TABLE lesson_prerequisites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES course_lessons(lesson_id),
  required_lesson_id UUID REFERENCES course_lessons(lesson_id),
  required_status VARCHAR(20) DEFAULT 'completed', -- 'completed', 'passed', 'viewed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Evaluaciones

### 5.1 Detección de Evaluaciones en SCORM

Las evaluaciones SCORM se detectan por:
1. Interacciones (`cmi.interactions.n.*`)
2. Objetivos con score (`cmi.objectives.n.score.*`)
3. Patrones en HTML de herramientas de autoría conocidas

### 5.2 Mapeo de Tipos de Pregunta

| SCORM Interaction Type | Nativo (quiz_questions.type) |
|------------------------|------------------------------|
| `true-false` | `true_false` |
| `choice` | `multiple_choice` |
| `fill-in` | `fill_blank` |
| `long-fill-in` | `short_answer` |
| `matching` | `matching` |
| `performance` | `practical` (manual) |
| `sequencing` | `ordering` |
| `likert` | `likert_scale` |
| `numeric` | `numeric` |

### 5.3 Estructura de Cuestionarios Nativos

```sql
-- Tabla de cuestionarios
CREATE TABLE lesson_quizzes (
  quiz_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES course_lessons(lesson_id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  passing_score DECIMAL(5,2) DEFAULT 70.00,
  max_attempts INT DEFAULT 3,
  time_limit_minutes INT,
  shuffle_questions BOOLEAN DEFAULT false,
  show_correct_answers BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de preguntas
CREATE TABLE quiz_questions (
  question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES lesson_quizzes(quiz_id),
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  options JSONB, -- Para multiple choice
  correct_answer JSONB NOT NULL,
  points DECIMAL(5,2) DEFAULT 1.00,
  feedback_correct TEXT,
  feedback_incorrect TEXT,
  order_index INT,
  -- Metadata de origen SCORM
  scorm_interaction_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Respuestas de usuarios
CREATE TABLE quiz_responses (
  response_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES lesson_quizzes(quiz_id),
  user_id UUID REFERENCES users(id),
  attempt_number INT DEFAULT 1,
  answers JSONB NOT NULL,
  score DECIMAL(5,2),
  passed BOOLEAN,
  time_spent_seconds INT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.4 Estrategia de Migración de Evaluaciones

**Opción A: Extracción Automática** (Recomendada para herramientas conocidas)
- Parsear HTML/JS de Articulate, Captivate, iSpring
- Extraer preguntas y respuestas
- Convertir a formato nativo

**Opción B: Incrustación Controlada** (Para evaluaciones complejas)
- Mantener evaluación SCORM original en iframe
- Capturar resultados via `window.postMessage`
- Sincronizar con tracking nativo

```typescript
// Ejemplo de captura de resultados de evaluación embebida
window.addEventListener('message', (event) => {
  if (event.data.type === 'SCORM_QUIZ_COMPLETE') {
    const { score, passed, responses } = event.data.payload;
    await saveQuizResults(quizId, userId, {
      score,
      passed,
      answers: responses,
      submitted_at: new Date()
    });
  }
});
```

**Opción C: Recreación Manual** (Para contenido custom)
- Flag para revisión humana
- Interfaz de recreación de preguntas
- QA del instructor

---

## 6. Tracking y Analítica

### 6.1 Mapeo de Datos CMI

| CMI Element (SCORM 1.2) | CMI Element (SCORM 2004) | Campo Nativo |
|-------------------------|--------------------------|--------------|
| `cmi.core.lesson_status` | `cmi.completion_status` | `user_lesson_progress.lesson_status` |
| `cmi.core.lesson_location` | `cmi.location` | `user_lesson_progress.last_position` |
| `cmi.core.score.raw` | `cmi.score.raw` | `user_lesson_progress.score` |
| `cmi.core.score.min` | `cmi.score.min` | `user_lesson_progress.score_min` |
| `cmi.core.score.max` | `cmi.score.max` | `user_lesson_progress.score_max` |
| N/A | `cmi.score.scaled` | `user_lesson_progress.score_scaled` |
| `cmi.core.total_time` | `cmi.total_time` | `user_lesson_progress.total_time_seconds` |
| `cmi.core.session_time` | `cmi.session_time` | `user_lesson_progress.session_time_seconds` |
| `cmi.suspend_data` | `cmi.suspend_data` | `user_lesson_progress.suspend_data` |
| N/A | `cmi.success_status` | `user_lesson_progress.success_status` |
| N/A | `cmi.progress_measure` | `user_lesson_progress.progress_measure` |

### 6.2 Tabla de Progreso Extendida

```sql
-- Extensión de user_lesson_progress para datos SCORM migrados
ALTER TABLE user_lesson_progress ADD COLUMN IF NOT EXISTS
  scorm_data JSONB DEFAULT '{}'::jsonb;

-- Estructura de scorm_data:
-- {
--   "suspend_data": "...",
--   "objectives": [...],
--   "interactions": [...],
--   "migrated_from": "scorm_package_id",
--   "original_attempt_id": "..."
-- }
```

### 6.3 Migración de Historial de Intentos

Si existen datos de `scorm_attempts` previos:

```typescript
async function migrateScormAttempts(
  scormPackageId: string,
  newLessonId: string
): Promise<void> {
  const supabase = await createClient();

  // Obtener intentos SCORM existentes
  const { data: scormAttempts } = await supabase
    .from('scorm_attempts')
    .select('*')
    .eq('package_id', scormPackageId);

  if (!scormAttempts?.length) return;

  // Convertir a formato nativo
  for (const attempt of scormAttempts) {
    await supabase.from('user_lesson_progress').upsert({
      lesson_id: newLessonId,
      user_id: attempt.user_id,
      enrollment_id: await getEnrollmentId(attempt.user_id, courseId),
      lesson_status: mapScormStatus(attempt.lesson_status),
      is_completed: ['completed', 'passed'].includes(attempt.lesson_status),
      video_progress_percentage: 100, // SCORM no tiene video progress
      score: attempt.score_raw,
      total_time_seconds: parseScormTime(attempt.total_time),
      scorm_data: {
        suspend_data: attempt.suspend_data,
        migrated_from: scormPackageId,
        original_attempt_id: attempt.id
      },
      updated_at: attempt.last_accessed_at
    }, {
      onConflict: 'enrollment_id,lesson_id'
    });
  }
}

function mapScormStatus(scormStatus: string): string {
  const statusMap: Record<string, string> = {
    'not attempted': 'not_started',
    'incomplete': 'in_progress',
    'completed': 'completed',
    'passed': 'completed',
    'failed': 'failed',
    'browsed': 'viewed'
  };
  return statusMap[scormStatus] || 'not_started';
}
```

### 6.4 Datos que se Preservan vs Pierden

| Dato | Preservado | Notas |
|------|------------|-------|
| Completion status | ✅ 100% | Mapeo directo |
| Score (raw, min, max) | ✅ 100% | Mapeo directo |
| Total time | ✅ 100% | Conversión de formato ISO8601 |
| Suspend data | ✅ 100% | Almacenado en JSONB |
| Session time | ⚠️ Parcial | Solo último valor |
| Interactions | ⚠️ Parcial | Solo si se extraen quizzes |
| Objectives | ⚠️ Parcial | Si se mapean a evaluaciones |
| Navigation history | ❌ Perdido | No hay equivalente |
| Comments from learner | ❌ Perdido | No hay equivalente |

---

## 7. Gaps y Riesgos

### 7.1 Funcionalidades SCORM No Soportadas

| Funcionalidad | Criticidad | Workaround |
|---------------|------------|------------|
| Sequencing complejo (SCORM 2004) | Media | Simplificar a lineal con prerequisitos |
| Rollup de objetivos multi-nivel | Baja | Calcular manualmente |
| Navegación no lineal con restricciones | Media | Configurar en metadata de curso |
| Contenido adaptativo basado en variables | Alta | No hay workaround directo |
| Shared Data Between SCOs | Baja | Almacenar en suspend_data global |
| Time limits por SCO | Media | Implementar en frontend |

### 7.2 Riesgos de Conversión

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Scripts SCORM que fallan post-conversión | Alta | Medio | Sandbox + fallback a SCORM player |
| Pérdida de interactividad | Media | Alto | Preservar original como backup |
| Referencias rotas a assets | Media | Bajo | Validación exhaustiva post-conversión |
| Evaluaciones no extraíbles | Media | Alto | Mantener evaluación embebida |
| Pérdida de historial de progreso | Baja | Alto | Migración completa de attempts |

### 7.3 Matriz de Decisión: Convertir vs Mantener SCORM

| Criterio | Convertir | Mantener SCORM |
|----------|-----------|----------------|
| Contenido mayormente HTML estático | ✅ | |
| Quizzes simples | ✅ | |
| Tracking básico requerido | ✅ | |
| Interactividad JS compleja | | ✅ |
| Simulaciones/animaciones | | ✅ |
| Contenido frecuentemente actualizado | ✅ | |
| Necesidad de internacionalización | ✅ | |

---

## 8. Pipeline de Conversión Propuesto

### 8.1 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PIPELINE DE CONVERSIÓN                          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   UPLOAD     │────▶│   ANÁLISIS   │────▶│  EXTRACCIÓN  │────▶│   MAPEO      │
│   (.zip)     │     │  (manifest)  │     │   (assets)   │     │  (nativo)    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                            │                    │                    │
                            ▼                    ▼                    ▼
                     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
                     │  - Versión   │     │  - HTML      │     │  - Course    │
                     │  - Items     │     │  - CSS/JS    │     │  - Modules   │
                     │  - Resources │     │  - Media     │     │  - Lessons   │
                     │  - Sequencing│     │  - Quizzes   │     │  - Progress  │
                     └──────────────┘     └──────────────┘     └──────────────┘
                                                                      │
                                                                      ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  PUBLICACIÓN │◀────│  VALIDACIÓN  │◀────│ MIGRACIÓN    │◀────│  STORAGE     │
│   (activo)   │     │   (QA)       │     │  (tracking)  │     │  (Supabase)  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### 8.2 Pasos Detallados

#### Paso 1: Upload y Validación Inicial
```typescript
// api/scorm/convert/upload/route.ts
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const organizationId = formData.get('organizationId');
  const mode = formData.get('mode'); // 'analyze' | 'convert'

  // Validaciones básicas
  validateZipFile(file);

  // Extraer y parsear manifest
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const manifest = await parseScormManifest(await zip.file('imsmanifest.xml').async('string'));

  // Análisis de complejidad
  const analysis = await analyzeScormPackage(zip, manifest);

  if (mode === 'analyze') {
    return NextResponse.json({ analysis });
  }

  // Crear job de conversión
  const jobId = await createConversionJob(organizationId, file, manifest, analysis);

  return NextResponse.json({ jobId, analysis });
}
```

#### Paso 2: Análisis de Complejidad
```typescript
interface ScormAnalysis {
  version: 'SCORM_1.2' | 'SCORM_2004';
  complexity: 'simple' | 'medium' | 'complex';
  itemCount: number;
  hasSequencing: boolean;
  hasObjectives: boolean;
  hasInteractions: boolean;
  assetSummary: {
    html: number;
    css: number;
    js: number;
    images: number;
    videos: number;
    other: number;
    totalSizeMB: number;
  };
  detectedAuthoring: 'articulate' | 'captivate' | 'ispring' | 'custom' | 'unknown';
  conversionRecommendation: 'full_convert' | 'hybrid' | 'keep_scorm';
  estimatedDuration: number;
  warnings: string[];
}

async function analyzeScormPackage(zip: JSZip, manifest: ScormManifest): Promise<ScormAnalysis> {
  const files = Object.keys(zip.files);

  // Detectar herramienta de autoría
  const detectedAuthoring = detectAuthoringTool(files, zip);

  // Analizar complejidad de secuenciación
  const hasSequencing = manifest.organizations.some(org =>
    org.items.some(item => hasSequencingRules(item))
  );

  // Contar assets
  const assetSummary = countAssets(files);

  // Determinar recomendación
  const conversionRecommendation = determineRecommendation(
    detectedAuthoring,
    hasSequencing,
    assetSummary
  );

  return {
    version: manifest.version,
    complexity: calculateComplexity(manifest, hasSequencing),
    itemCount: countItems(manifest.organizations),
    hasSequencing,
    hasObjectives: manifest.objectives.length > 0,
    hasInteractions: await detectInteractions(zip),
    assetSummary,
    detectedAuthoring,
    conversionRecommendation,
    estimatedDuration: estimateConversionTime(assetSummary),
    warnings: generateWarnings(manifest, hasSequencing, detectedAuthoring)
  };
}
```

#### Paso 3: Extracción de Assets
```typescript
async function extractAndProcessAssets(
  zip: JSZip,
  manifest: ScormManifest,
  targetPath: string
): Promise<AssetMapping> {
  const supabase = await createClient();
  const assetMapping: AssetMapping = new Map();

  for (const resource of manifest.resources) {
    for (const file of resource.files) {
      const zipEntry = zip.file(file);
      if (!zipEntry) continue;

      const content = await zipEntry.async('arraybuffer');
      const processedContent = await processAsset(file, content, manifest);

      const storagePath = `${targetPath}/${file}`;
      await supabase.storage
        .from('converted-courses')
        .upload(storagePath, processedContent.content, {
          contentType: processedContent.contentType
        });

      assetMapping.set(file, {
        originalPath: file,
        storagePath,
        processed: processedContent.wasProcessed
      });
    }
  }

  return assetMapping;
}
```

#### Paso 4: Creación de Estructura Nativa
```typescript
async function createNativeCourse(
  manifest: ScormManifest,
  assetMapping: AssetMapping,
  organizationId: string,
  instructorId: string
): Promise<string> {
  const supabase = await createClient();

  // 1. Crear curso
  const { data: course } = await supabase
    .from('courses')
    .insert({
      title: manifest.title,
      description: manifest.description,
      slug: generateSlug(manifest.title),
      instructor_id: instructorId,
      category: 'SCORM Importado',
      level: 'intermediate',
      is_active: false, // Inactivo hasta validación
      metadata: {
        scorm_version: manifest.version,
        imported_at: new Date().toISOString(),
        original_manifest: manifest
      }
    })
    .select()
    .single();

  const courseId = course.id;

  // 2. Crear módulos y lecciones
  for (const org of manifest.organizations) {
    for (let i = 0; i < org.items.length; i++) {
      const item = org.items[i];
      await createModuleFromItem(
        supabase,
        courseId,
        instructorId,
        item,
        i,
        assetMapping
      );
    }
  }

  // 3. Calcular duración total
  await updateCourseDuration(supabase, courseId);

  return courseId;
}

async function createModuleFromItem(
  supabase: SupabaseClient,
  courseId: string,
  instructorId: string,
  item: ScormItem,
  orderIndex: number,
  assetMapping: AssetMapping
): Promise<void> {
  // Crear módulo
  const { data: module } = await supabase
    .from('course_modules')
    .insert({
      course_id: courseId,
      module_title: item.title,
      module_order_index: orderIndex,
      is_published: true,
      metadata: { scorm_item_id: item.identifier }
    })
    .select()
    .single();

  // Crear lecciones de los children
  if (item.children?.length) {
    for (let i = 0; i < item.children.length; i++) {
      const child = item.children[i];
      await createLessonFromItem(
        supabase,
        module.module_id,
        instructorId,
        child,
        i,
        assetMapping
      );
    }
  } else if (item.resourceId) {
    // El item mismo es una lección
    await createLessonFromItem(
      supabase,
      module.module_id,
      instructorId,
      item,
      0,
      assetMapping
    );
  }
}

async function createLessonFromItem(
  supabase: SupabaseClient,
  moduleId: string,
  instructorId: string,
  item: ScormItem,
  orderIndex: number,
  assetMapping: AssetMapping
): Promise<void> {
  const resource = findResource(item.resourceId, manifest);
  const contentUrl = resource?.href
    ? assetMapping.get(resource.href)?.storagePath
    : null;

  await supabase
    .from('course_lessons')
    .insert({
      module_id: moduleId,
      instructor_id: instructorId,
      lesson_title: item.title,
      lesson_order_index: orderIndex,
      duration_seconds: 600, // Default 10 min, ajustar post-análisis
      video_provider: 'scorm_html',
      video_provider_id: contentUrl,
      is_published: true,
      metadata: {
        scorm_item_id: item.identifier,
        scorm_resource_id: item.resourceId
      }
    });
}
```

#### Paso 5: Migración de Tracking
```typescript
async function migrateTrackingData(
  scormPackageId: string,
  newCourseId: string,
  lessonMapping: Map<string, string> // scormItemId -> lessonId
): Promise<MigrationResult> {
  const supabase = await createClient();
  const result: MigrationResult = {
    migratedAttempts: 0,
    migratedInteractions: 0,
    errors: []
  };

  // Obtener todos los intentos del paquete SCORM
  const { data: attempts } = await supabase
    .from('scorm_attempts')
    .select(`
      *,
      interactions:scorm_interactions(*),
      objectives:scorm_objectives(*)
    `)
    .eq('package_id', scormPackageId);

  for (const attempt of attempts || []) {
    try {
      // Obtener enrollment del usuario
      const enrollment = await getOrCreateEnrollment(
        supabase,
        attempt.user_id,
        newCourseId
      );

      // Migrar progreso a todas las lecciones del curso
      // (SCORM típicamente tiene un attempt por paquete completo)
      for (const [scormItemId, lessonId] of lessonMapping) {
        await supabase
          .from('user_lesson_progress')
          .upsert({
            enrollment_id: enrollment.enrollment_id,
            lesson_id: lessonId,
            lesson_status: mapScormStatus(attempt.lesson_status),
            is_completed: ['completed', 'passed'].includes(attempt.lesson_status),
            video_progress_percentage: 100,
            scorm_data: {
              original_attempt_id: attempt.id,
              suspend_data: attempt.suspend_data,
              score_raw: attempt.score_raw,
              score_min: attempt.score_min,
              score_max: attempt.score_max,
              total_time: attempt.total_time
            }
          }, {
            onConflict: 'enrollment_id,lesson_id'
          });
      }

      result.migratedAttempts++;

      // Migrar interacciones a quiz_responses si hay quiz
      if (attempt.interactions?.length) {
        await migrateInteractions(supabase, attempt.interactions, lessonMapping);
        result.migratedInteractions += attempt.interactions.length;
      }
    } catch (error) {
      result.errors.push({
        attemptId: attempt.id,
        error: error.message
      });
    }
  }

  return result;
}
```

#### Paso 6: Validación
```typescript
interface ValidationResult {
  isValid: boolean;
  checks: ValidationCheck[];
  warnings: string[];
  errors: string[];
}

interface ValidationCheck {
  name: string;
  passed: boolean;
  details?: string;
}

async function validateConversion(courseId: string): Promise<ValidationResult> {
  const checks: ValidationCheck[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  const supabase = await createClient();

  // 1. Verificar estructura del curso
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  checks.push({
    name: 'course_exists',
    passed: !!course,
    details: course ? `Curso: ${course.title}` : 'Curso no encontrado'
  });

  // 2. Verificar módulos
  const { data: modules } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', courseId);

  checks.push({
    name: 'modules_exist',
    passed: (modules?.length || 0) > 0,
    details: `${modules?.length || 0} módulos encontrados`
  });

  // 3. Verificar lecciones
  const { data: lessons } = await supabase
    .from('course_lessons')
    .select('*, module:course_modules!inner(course_id)')
    .eq('module.course_id', courseId);

  checks.push({
    name: 'lessons_exist',
    passed: (lessons?.length || 0) > 0,
    details: `${lessons?.length || 0} lecciones encontradas`
  });

  // 4. Verificar assets accesibles
  for (const lesson of lessons || []) {
    if (lesson.video_provider_id) {
      const assetAccessible = await checkAssetAccessibility(lesson.video_provider_id);
      if (!assetAccessible) {
        errors.push(`Asset no accesible para lección ${lesson.lesson_id}: ${lesson.video_provider_id}`);
      }
    }
  }

  checks.push({
    name: 'assets_accessible',
    passed: errors.length === 0,
    details: errors.length > 0 ? `${errors.length} assets no accesibles` : 'Todos los assets accesibles'
  });

  // 5. Verificar duración calculada
  if (course && !course.duration_total_minutes) {
    warnings.push('Duración total del curso no calculada');
  }

  return {
    isValid: errors.length === 0 && checks.every(c => c.passed),
    checks,
    warnings,
    errors
  };
}
```

---

## 9. Checklist de Aceptación

### 9.1 Pre-Conversión

- [ ] Paquete SCORM válido con `imsmanifest.xml`
- [ ] Versión SCORM identificada (1.2 o 2004)
- [ ] Análisis de complejidad completado
- [ ] Recomendación de conversión generada
- [ ] Backup del paquete original guardado

### 9.2 Conversión

- [ ] Curso creado en `courses`
- [ ] Módulos creados en `course_modules` con orden correcto
- [ ] Lecciones creadas en `course_lessons` con orden correcto
- [ ] Assets extraídos y almacenados en Supabase Storage
- [ ] Referencias de assets actualizadas en HTML
- [ ] Scripts SCORM removidos/reemplazados

### 9.3 Evaluaciones

- [ ] Quizzes detectados y listados
- [ ] Preguntas extraídas o marcadas para revisión
- [ ] Formato de respuestas mapeado
- [ ] Sistema de puntuación configurado

### 9.4 Tracking

- [ ] Intentos SCORM previos migrados a `user_lesson_progress`
- [ ] `suspend_data` preservado en JSONB
- [ ] Scores migrados correctamente
- [ ] Tiempos convertidos de formato ISO

### 9.5 Validación

- [ ] Curso navegable completamente
- [ ] Sin enlaces rotos
- [ ] Contenido renderiza correctamente
- [ ] Evaluaciones funcionan o alternativa documentada
- [ ] Progreso se guarda correctamente

### 9.6 Post-Conversión

- [ ] Instructor notificado para revisión
- [ ] Curso marcado como activo (si validación OK)
- [ ] Documentación de gaps generada
- [ ] Paquete SCORM original archivado

---

## 10. Recomendaciones para el Formato Nativo

### 10.1 Mejoras Sugeridas a la Plataforma

1. **Nuevo tipo de provider `scorm_html`**
   - Renderizar HTML estático en iframe sandboxed
   - Tracking de scroll/tiempo en página

2. **Tabla `lesson_objectives`**
   ```sql
   CREATE TABLE lesson_objectives (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     lesson_id UUID REFERENCES course_lessons(lesson_id),
     objective_id VARCHAR(255),
     description TEXT,
     min_score DECIMAL(5,2),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. **Campo `prerequisites` en `course_modules`**
   ```sql
   ALTER TABLE course_modules ADD COLUMN
     prerequisites UUID[] DEFAULT '{}';
   ```

4. **Sistema de intentos por lección**
   ```sql
   ALTER TABLE user_lesson_progress ADD COLUMN
     attempt_count INT DEFAULT 1,
     max_attempts INT DEFAULT NULL;
   ```

5. **Metadata extendida en cursos**
   ```sql
   ALTER TABLE courses ADD COLUMN IF NOT EXISTS
     import_source JSONB DEFAULT NULL;
   -- { "type": "scorm", "version": "2004", "package_id": "...", "imported_at": "..." }
   ```

### 10.2 API de Conversión

Nuevos endpoints sugeridos:

```
POST   /api/scorm/convert/analyze     # Analizar paquete sin convertir
POST   /api/scorm/convert/start       # Iniciar conversión
GET    /api/scorm/convert/status/:id  # Estado del job de conversión
POST   /api/scorm/convert/validate/:id # Validar conversión
POST   /api/scorm/convert/publish/:id  # Publicar curso convertido
DELETE /api/scorm/convert/rollback/:id # Revertir conversión
```

### 10.3 Interfaz de Usuario

1. **Wizard de importación SCORM**
   - Paso 1: Upload y análisis
   - Paso 2: Revisión de estructura detectada
   - Paso 3: Configuración de opciones
   - Paso 4: Conversión y progreso
   - Paso 5: Validación y publicación

2. **Panel de revisión de evaluaciones**
   - Lista de preguntas extraídas
   - Editor para ajustar/corregir
   - Preview de quiz nativo

3. **Dashboard de migraciones**
   - Historial de conversiones
   - Estado de cada job
   - Métricas de éxito/fallo

---

## Suposiciones Realizadas

1. **Estructura de items**: Se asume que items de nivel 1 son módulos y nivel 2+ son lecciones. Validar con casos reales.

2. **Duración**: Se estima basándose en contenido. Requiere validación manual del instructor.

3. **Evaluaciones**: Se asume extracción posible para Articulate/Captivate/iSpring. Contenido custom puede requerir revisión manual.

4. **Tracking histórico**: Se migran datos existentes. Nuevos usuarios empiezan desde cero.

5. **Storage**: Se asume bucket `converted-courses` existe en Supabase Storage.

## Preguntas Pendientes

1. ¿Se requiere mantener el paquete SCORM original como fallback?
2. ¿Cuál es el volumen esperado de paquetes SCORM a convertir?
3. ¿Hay requisitos específicos de retención de datos de tracking?
4. ¿Se necesita soporte para reconversión (actualización de paquete)?
5. ¿Hay límites de tamaño de archivo para assets individuales?

---

## Historial de Revisiones

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2024-12-18 | Claude Code | Documento inicial |

---

*Documento generado como parte del proceso de diseño de arquitectura e-learning para Aprende y Aplica.*
