  Análisis Exhaustivo: Sistema LMS Nativo vs Estándar SCORM

  1. Estructura del Contenido de los Cursos

  Sistema Nativo Actual

  El sistema utiliza una arquitectura jerárquica bien definida:

  courses
    └── course_modules (module_id, module_order_index)
          └── course_lessons (lesson_id, lesson_order_index)
                ├── lesson_activities (activity_type: quiz, exercise, etc.)
                ├── lesson_materials (material_type: video, document, quiz)
                └── lesson_checkpoints (para tracking de progreso de video)

  Archivos clave:
  - apps/web/src/lib/supabase/types.ts:3165 - Tabla courses
  - apps/web/src/lib/supabase/types.ts:2391 - Tabla course_modules
  - apps/web/src/lib/supabase/types.ts:2130 - Tabla course_lessons

  Campos de cursos nativos:
  | Campo                  | Tipo   | Equivalente SCORM      |
  |------------------------|--------|------------------------|
  | title                  | string | <title> en manifest    |
  | description            | string | <description> LOM      |
  | category               | string | <classification>       |
  | level                  | string | <difficulty>           |
  | learning_objectives    | JSON   | <objectives>           |
  | instructor_id          | string | <contribute> lifecycle |
  | duration_total_minutes | number | <typicalLearningTime>  |

  Comparativa con SCORM

  | Aspecto              | Sistema Nativo         | SCORM 1.2/2004                  | Estado        |
  |----------------------|------------------------|---------------------------------|---------------|
  | Modularidad          | ✅ Módulos → Lecciones | ✅ Organizations → Items → SCOs | ✅ Compatible |
  | Secuenciamiento      | ❌ Lineal obligatorio  | ✅ Flexible con reglas          | ⚠️ Parcial    |
  | Prerrequisitos       | ✅ Lección anterior    | ✅ Sequencing rules             | ⚠️ Limitado   |
  | Recursos compartidos | ❌ Por lección         | ✅ Assets reutilizables         | ❌ Faltante   |

  ---
  2. Metadatos y Descripción del Contenido

  Sistema Nativo

  // De types.ts:3165-3188
  courses: {
    title: string
    description: string | null
    category: string
    level: string
    learning_objectives: Json | null
    instructor_id: string | null
    thumbnail_url: string | null
    duration_total_minutes: number | null
    created_at: string | null
    updated_at: string | null
  }

  Estándar SCORM (IEEE LOM)

  SCORM requiere metadatos conformes al estándar IEEE LOM (Learning Object Metadata) con las siguientes categorías:

  | Categoría LOM  | Campos Requeridos                                     | Sistema Nativo               | Estado      |
  |----------------|-------------------------------------------------------|------------------------------|-------------|
  | General        | identifier, title, description, language, keyword     | ✅ title, description        | ⚠️ Parcial  |
  | Lifecycle      | version, status, contribute (author, date)            | ✅ instructor_id, created_at | ⚠️ Parcial  |
  | Meta-Metadata  | identifier, contribute, metadata scheme               | ❌                           | ❌ Faltante |
  | Technical      | format, size, location, requirements                  | ❌                           | ❌ Faltante |
  | Educational    | interactivity, resource type, learner age, difficulty | ✅ level                     | ⚠️ Parcial  |
  | Rights         | cost, copyright, description                          | ✅ price (indirecto)         | ⚠️ Parcial  |
  | Relation       | kind, resource                                        | ❌                           | ❌ Faltante |
  | Annotation     | entity, date, description                             | ❌                           | ❌ Faltante |
  | Classification | purpose, taxon path, keyword                          | ✅ category                  | ⚠️ Parcial  |

  Elementos Faltantes Críticos

  <!-- Ejemplo de imsmanifest.xml completo que el sistema NO genera -->
  <metadata>
    <lom:lom>
      <lom:general>
        <lom:identifier>course-uuid-here</lom:identifier>
        <lom:title><lom:string language="es">Título</lom:string></lom:title>
        <lom:language>es</lom:language>
        <lom:keyword><lom:string language="es">keyword1</lom:string></lom:keyword>
      </lom:general>
      <lom:technical>
        <lom:format>text/html</lom:format>
        <lom:size>1024000</lom:size>
        <lom:requirement>
          <lom:orComposite>
            <lom:type><lom:value>browser</lom:value></lom:type>
            <lom:name><lom:value>any</lom:value></lom:name>
          </lom:orComposite>
        </lom:requirement>
      </lom:technical>
      <lom:educational>
        <lom:interactivityType><lom:value>mixed</lom:value></lom:interactivityType>
        <lom:typicalLearningTime><lom:duration>PT2H30M</lom:duration></lom:typicalLearningTime>
      </lom:educational>
    </lom:lom>
  </metadata>

  ---
  3. Interactividad y Evaluaciones

  Sistema Nativo

  Estructura de Quizzes (types.ts):
  user_quiz_submissions: {
    user_id: string
    lesson_id: string
    enrollment_id: string
    material_id: string | null      // Quiz desde materiales
    activity_id: string | null      // Quiz desde actividades
    user_answers: Json
    score: number
    total_points: number
    percentage_score: number
    is_passed: boolean              // ≥80% para aprobar
    completed_at: string
  }

  API de evaluación: apps/web/src/app/api/courses/[slug]/lessons/[lessonId]/quiz/submit/route.ts

  Comparativa con SCORM

  | Elemento                  | Sistema Nativo              | SCORM 1.2                            | SCORM 2004           |
  |---------------------------|-----------------------------|--------------------------------------|----------------------|
  | Tipos de preguntas        | multiple_choice, true_false | ✅                                   | ✅                   |
  | Puntuación raw            | ✅ score                    | cmi.core.score.raw                   | cmi.score.raw        |
  | Puntuación min/max        | ❌                          | cmi.core.score.min/max               | cmi.score.min/max    |
  | Puntuación escalada       | ✅ percentage_score         | ❌                                   | cmi.score.scaled     |
  | Estado de aprobación      | ✅ is_passed                | Inferido                             | cmi.success_status   |
  | Interacciones detalladas  | ❌                          | cmi.interactions.n.*                 | cmi.interactions.n.* |
  | Respuesta correcta        | En quizData                 | cmi.interactions.n.correct_responses | ✅                   |
  | Latencia por pregunta     | ❌                          | cmi.interactions.n.latency           | ✅                   |
  | Objetivos por interacción | ❌                          | cmi.interactions.n.objectives        | ✅                   |

  Elementos CMI de Interacciones NO Implementados

  // El adapter (adapter.ts:242-245) solo menciona _children pero NO persiste:
  'cmi.interactions._children': 'id,objectives,time,type,correct_responses,weighting,student_response,result,latency'

  // Campos que deberían persistirse en BD:
  cmi.interactions.n.id                    // ❌ No persistido
  cmi.interactions.n.type                  // ❌ No persistido
  cmi.interactions.n.objectives.n.id       // ❌ No persistido
  cmi.interactions.n.timestamp             // ❌ No persistido
  cmi.interactions.n.correct_responses.n.pattern  // ❌ No persistido
  cmi.interactions.n.weighting             // ❌ No persistido
  cmi.interactions.n.learner_response      // ❌ No persistido
  cmi.interactions.n.result                // ❌ No persistido
  cmi.interactions.n.latency               // ❌ No persistido
  cmi.interactions.n.description           // ❌ No persistido

  ---
  4. Seguimiento y Reportes de Progreso

  Sistema Nativo

  Tablas de tracking:

  // user_course_enrollments
  enrollment_id: string
  user_id: string
  course_id: string
  enrollment_status: 'active' | 'completed'
  overall_progress_percentage: number
  enrolled_at: string
  started_at: string
  completed_at: string | null
  last_accessed_at: string

  // user_lesson_progress
  progress_id: string
  lesson_id: string
  enrollment_id: string
  is_completed: boolean
  lesson_status: 'not_started' | 'in_progress' | 'completed'
  video_progress_percentage: number
  quiz_progress_percentage: number
  quiz_passed: boolean
  started_at: string
  completed_at: string | null

  Implementación SCORM Actual

  Tablas SCORM (definidas en código pero NO en types.ts):

  // scorm_packages
  id: string
  organization_id: string
  course_id: string
  title: string
  version: 'SCORM_1.2' | 'SCORM_2004'
  manifest_data: any
  entry_point: string
  storage_path: string
  status: 'active' | 'inactive' | 'processing'

  // scorm_attempts
  id: string
  user_id: string
  package_id: string
  attempt_number: number
  lesson_status: string
  lesson_location: string
  score_raw: number
  score_min: number
  score_max: number
  score_scaled: number
  suspend_data: string
  total_time: string
  entry: 'ab-initio' | 'resume'

  Comparativa de Elementos CMI

  | Elemento CMI             | Sistema Actual   | Persistido | SCORM Completo            |
  |--------------------------|------------------|------------|---------------------------|
  | cmi.completion_status    | ✅               | ✅         | ✅                        |
  | cmi.success_status       | ✅               | ✅         | ✅                        |
  | cmi.score.raw            | ✅               | ✅         | ✅                        |
  | cmi.score.scaled         | ✅               | ✅         | ✅                        |
  | cmi.location             | ✅               | ✅         | ✅                        |
  | cmi.suspend_data         | ✅               | ✅         | ✅                        |
  | cmi.total_time           | ✅               | ✅         | ✅                        |
  | cmi.session_time         | ⚠️ En memoria    | ❌         | ✅                        |
  | cmi.progress_measure     | ❌               | ❌         | ✅                        |
  | cmi.completion_threshold | ❌               | ❌         | ✅                        |
  | cmi.scaled_passing_score | ❌               | ❌         | ✅                        |
  | cmi.max_time_allowed     | ❌               | ❌         | ✅                        |
  | cmi.time_limit_action    | ❌               | ❌         | ✅                        |
  | cmi.exit                 | ❌               | ❌         | ✅                        |
  | cmi.credit               | ⚠️ Default       | ❌         | ✅                        |
  | cmi.mode                 | ⚠️ 'normal' fijo | ❌         | ✅ (normal/browse/review) |

  ---
  5. Compatibilidad Técnica y Formatos

  Capacidades Actuales

  | Funcionalidad                 | Estado | Archivo                                   |
  |-------------------------------|--------|-------------------------------------------|
  | Importar SCORM 1.2            | ✅     | lib/scorm/parser.ts                       |
  | Importar SCORM 2004           | ✅     | lib/scorm/parser.ts                       |
  | Parsear imsmanifest.xml       | ✅     | lib/scorm/parser.ts:55                    |
  | API RTE SCORM 1.2             | ✅     | lib/scorm/adapter.ts:41-238               |
  | API RTE SCORM 2004            | ✅     | lib/scorm/adapter.ts:510-517              |
  | SCO Player (iframe)           | ✅     | features/scorm/components/SCORMPlayer.tsx |
  | Validación de paquetes        | ✅     | lib/scorm/validator.ts                    |
  | Exportar curso nativo a SCORM | ❌     | No existe                                 |
  | Generar imsmanifest.xml       | ❌     | No existe                                 |
  | Conversión bidireccional      | ❌     | No existe                                 |

  API RTE Implementada vs Estándar

  SCORM 1.2 API:
  // Implementado en adapter.ts:39-505
  LMSInitialize(param)      // ✅
  LMSGetValue(key)          // ✅
  LMSSetValue(key, value)   // ✅
  LMSCommit(param)          // ✅
  LMSFinish(param)          // ✅
  LMSGetLastError()         // ✅
  LMSGetErrorString(code)   // ✅
  LMSGetDiagnostic(code)    // ✅

  SCORM 2004 API (alias):
  // Implementado en adapter.ts:510-517
  Initialize = LMSInitialize   // ✅
  GetValue = LMSGetValue       // ✅
  SetValue = LMSSetValue       // ✅
  Commit = LMSCommit           // ✅
  Terminate = LMSFinish        // ✅
  GetLastError                 // ✅
  GetErrorString               // ✅
  GetDiagnostic                // ✅

  Elementos NO Implementados

  // SCORM 2004 Navigation API (adl.nav.*)
  adl.nav.request                    // ❌ Navegación entre SCOs
  adl.nav.request_valid.continue     // ❌
  adl.nav.request_valid.previous     // ❌
  adl.nav.request_valid.choice       // ❌

  // Sequencing (imsss:*)
  <imsss:sequencing>                 // ❌ Reglas de secuencia
  <imsss:controlMode>                // ❌ Control de flujo
  <imsss:sequencingRules>            // ❌ Condiciones
  <imsss:rollupRules>                // ❌ Agregación de resultados
  <imsss:objectives>                 // ⚠️ Parcial (solo lectura)

  ---
  6. Accesibilidad y Estándares de Diseño

  Estado Actual

  El sistema tiene implementación limitada de accesibilidad:

  // SCORMPlayer.tsx:78-105 - Intento de mejorar contraste
  style.innerHTML = `
    body { color: #1a1a1a !important; background-color: #ffffff !important; }
    ...
  `;

  // iframe sandbox attributes (línea 170)
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"

  SCORM y Accesibilidad

  | Requisito WCAG/508                      | Estado | Notas                         |
  |-----------------------------------------|--------|-------------------------------|
  | Alt text para imágenes                  | ❌     | Depende del contenido SCORM   |
  | Navegación por teclado                  | ⚠️     | Parcial en la UI              |
  | Contraste de color                      | ⚠️     | Intento de fix en SCORMPlayer |
  | Transcripciones de video                | ❌     | No implementado               |
  | cmi.learner_preference.audio_captioning | ❌     | No implementado               |
  | cmi.learner_preference.language         | ❌     | No implementado               |
  | cmi.learner_preference.audio_level      | ❌     | No implementado               |
  | cmi.learner_preference.delivery_speed   | ❌     | No implementado               |

  ---
  7. Integración con Otros Sistemas

  Capacidades Actuales

  ┌─────────────────────────────────────────────────────────────┐
  │                    Sistema Actual                            │
  ├─────────────────────────────────────────────────────────────┤
  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
  │  │  Cursos      │    │   SCORM      │    │  Supabase    │  │
  │  │  Nativos     │────│   Importado  │────│   Storage    │  │
  │  │              │    │   (1.2/2004) │    │              │  │
  │  └──────────────┘    └──────────────┘    └──────────────┘  │
  │         │                   │                    │          │
  │         └───────────────────┼────────────────────┘          │
  │                             ▼                               │
  │                    ┌──────────────┐                         │
  │                    │  PostgreSQL  │                         │
  │                    │  (Supabase)  │                         │
  │                    └──────────────┘                         │
  └─────────────────────────────────────────────────────────────┘

  Integraciones SCORM Faltantes

  | Integración                            | Estado | Descripción                         |
  |----------------------------------------|--------|-------------------------------------|
  | LTI (Learning Tools Interoperability)  | ❌     | Estándar complementario a SCORM     |
  | xAPI/Tin Can                           | ❌     | Sucesor moderno de SCORM            |
  | CMI-5                                  | ❌     | Combinación de xAPI + SCORM         |
  | AICC                                   | ❌     | Protocolo HTTP legacy               |
  | Exportación SCORM                      | ❌     | Convertir cursos nativos a paquetes |
  | QTI (Question & Test Interoperability) | ❌     | Estándar para evaluaciones          |
  | IMS Common Cartridge                   | ❌     | Empaquetado de contenido educativo  |

  ---
  8. Resumen: Elementos Faltantes para Compatibilidad SCORM Completa

  Prioridad Alta (Críticos)

  | Elemento                 | Descripción                           | Impacto                                          |
  |--------------------------|---------------------------------------|--------------------------------------------------|
  | Tablas de interacciones  | Persistir scorm_interactions en BD    | Sin esto no hay tracking detallado de respuestas |
  | Tablas de objetivos      | Persistir scorm_objectives con scores | Objetivos de aprendizaje no rastreados           |
  | cmi.progress_measure     | Porcentaje de progreso 0.0-1.0        | Reportes incompletos                             |
  | Exportación SCORM        | Generar imsmanifest.xml + paquete ZIP | No hay portabilidad de cursos nativos            |
  | Navigation API (adl.nav) | Control de navegación entre SCOs      | SCOs multi-página no funcionan bien              |

  Prioridad Media

  | Elemento                  | Descripción                            | Impacto                          |
  |---------------------------|----------------------------------------|----------------------------------|
  | cmi.learner_preference    | Preferencias de accesibilidad          | Accesibilidad limitada           |
  | Sequencing Rules          | Reglas de secuenciamiento SCORM 2004   | Navegación rígida                |
  | Rollup Rules              | Agregación de resultados por objetivos | Tracking de objetivos incompleto |
  | cmi.comments_from_learner | Comentarios del estudiante             | Funcionalidad perdida            |
  | Metadatos LOM completos   | Technical, Educational, Rights         | Interoperabilidad reducida       |

  Prioridad Baja

  | Elemento          | Descripción                        | Impacto                             |
  |-------------------|------------------------------------|-------------------------------------|
  | cmi.mode          | browse/review mode                 | Solo modo normal disponible         |
  | time_limit_action | Acciones cuando se agota el tiempo | No hay límites de tiempo            |
  | AICC support      | Protocolo legacy                   | Contenido antiguo incompatible      |
  | QTI import        | Importar evaluaciones estándar     | Quizzes deben recrearse manualmente |

  ---
  9. Recomendaciones de Implementación

  Fase 1: Completar Modelo de Datos SCORM

  -- 1. Agregar tabla scorm_interactions
  CREATE TABLE scorm_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES scorm_attempts(id) ON DELETE CASCADE,
    interaction_id VARCHAR(255) NOT NULL,
    interaction_type VARCHAR(50), -- true-false, choice, fill-in, etc.
    timestamp TIMESTAMPTZ,
    weighting DECIMAL(10,7),
    learner_response TEXT,
    result VARCHAR(50), -- correct, incorrect, neutral, unanticipated
    latency INTERVAL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 2. Agregar tabla scorm_interaction_objectives
  CREATE TABLE scorm_interaction_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID REFERENCES scorm_interactions(id) ON DELETE CASCADE,
    objective_id VARCHAR(255) NOT NULL
  );

  -- 3. Agregar tabla scorm_interaction_correct_responses
  CREATE TABLE scorm_interaction_correct_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID REFERENCES scorm_interactions(id) ON DELETE CASCADE,
    pattern TEXT NOT NULL,
    response_index INTEGER DEFAULT 0
  );

  -- 4. Agregar tabla scorm_objectives (si no existe)
  CREATE TABLE scorm_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES scorm_attempts(id) ON DELETE CASCADE,
    objective_id VARCHAR(255) NOT NULL,
    score_raw DECIMAL(10,7),
    score_min DECIMAL(10,7),
    score_max DECIMAL(10,7),
    score_scaled DECIMAL(10,7),
    success_status VARCHAR(50), -- passed, failed, unknown
    completion_status VARCHAR(50), -- completed, incomplete, not attempted, unknown
    progress_measure DECIMAL(10,7),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(attempt_id, objective_id)
  );

  -- 5. Agregar campos faltantes a scorm_attempts
  ALTER TABLE scorm_attempts ADD COLUMN IF NOT EXISTS
    progress_measure DECIMAL(10,7),
    completion_threshold DECIMAL(10,7),
    scaled_passing_score DECIMAL(10,7),
    max_time_allowed INTERVAL,
    time_limit_action VARCHAR(50),
    exit_type VARCHAR(50), -- time-out, suspend, logout, normal, empty
    mode VARCHAR(50) DEFAULT 'normal', -- normal, browse, review
    credit VARCHAR(50) DEFAULT 'credit'; -- credit, no-credit

  Fase 2: Actualizar API Runtime

  // En apps/web/src/app/api/scorm/runtime/setValue/route.ts

  // Agregar persistencia de interacciones
  if (key.startsWith('cmi.interactions.')) {
    await persistInteraction(attemptId, key, value);
  }

  // Agregar persistencia de objetivos
  if (key.startsWith('cmi.objectives.')) {
    await persistObjective(attemptId, key, value);
  }

  // Agregar campos nuevos
  if (key === 'cmi.progress_measure') {
    await updateAttemptProgressMeasure(attemptId, parseFloat(value));
  }

  Fase 3: Implementar Exportación SCORM

  // Nuevo archivo: apps/web/src/lib/scorm/exporter.ts

  export async function exportCourseAsScorm(
    courseId: string,
    version: 'SCORM_1.2' | 'SCORM_2004'
  ): Promise<Blob> {
    // 1. Obtener estructura del curso
    const course = await getCourseWithModulesAndLessons(courseId);

    // 2. Generar imsmanifest.xml
    const manifest = generateManifest(course, version);

    // 3. Convertir contenido a HTML/SCOs
    const scos = await convertLessonsToSCOs(course.lessons);

    // 4. Generar archivos de recursos
    const resources = await packageResources(course);

    // 5. Crear ZIP
    return createScormPackage(manifest, scos, resources);
  }

  function generateManifest(course: Course, version: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
  <manifest identifier="${course.id}" version="1.0"
    xmlns="${version === 'SCORM_2004'
      ? 'http://www.imsglobal.org/xsd/imscp_v1p1'
      : 'http://www.imsproject.org/xsd/imscp_rootv1p1p2'}">
    <metadata>
      ${generateLOMMetadata(course)}
    </metadata>
    <organizations default="org_${course.id}">
      <organization identifier="org_${course.id}">
        <title>${course.title}</title>
        ${course.modules.map(generateModuleItem).join('\n')}
      </organization>
    </organizations>
    <resources>
      ${course.lessons.map(generateResourceElement).join('\n')}
    </resources>
  </manifest>`;
  }

  Fase 4: Implementar Navigation API (SCORM 2004)

  // Agregar a apps/web/src/lib/scorm/adapter.ts

  // Navigation Request API
  GetNavRequest(): string {
    return this.navRequest || '';
  }

  SetNavRequest(request: string): string {
    const validRequests = [
      'continue', 'previous', 'choice', 'exit', 'exitAll',
      'abandon', 'abandonAll', 'suspendAll', '_none_'
    ];

    if (!validRequests.includes(request) && !request.startsWith('{target=')) {
      this.lastError = '351'; // Invalid navigation request
      return 'false';
    }

    this.navRequest = request;
    this.config.onNavRequest?.(request);
    return 'true';
  }

  // Exponer en window.API_1484_11
  adl = {
    nav: {
      request: '',
      request_valid: {
        continue: 'unknown',
        previous: 'unknown',
        choice: {}
      }
    }
  };

  Fase 5: Regenerar Tipos de Supabase

  # Después de aplicar las migraciones SQL
  npx supabase gen types typescript --project-id <your-project-id> > apps/web/src/lib/supabase/types.ts

  ---
  10. Conclusión

  Estado Actual de Compatibilidad SCORM

  | Componente               | SCORM 1.2 | SCORM 2004 |
  |--------------------------|-----------|------------|
  | Importación de paquetes  | ✅ 90%    | ✅ 85%     |
  | API RTE básica           | ✅ 95%    | ✅ 90%     |
  | Tracking básico          | ✅ 85%    | ✅ 80%     |
  | Interacciones detalladas | ❌ 30%    | ❌ 25%     |
  | Objetivos de aprendizaje | ⚠️ 50%    | ⚠️ 45%     |
  | Sequencing/Navigation    | ❌ 10%    | ❌ 5%      |
  | Exportación              | ❌ 0%     | ❌ 0%      |
  | Metadatos LOM            | ⚠️ 40%    | ⚠️ 40%     |

  Compatibilidad Global Estimada

  - SCORM 1.2: ~65% compatible
  - SCORM 2004 3rd/4th Edition: ~55% compatible

  Esfuerzo Estimado para Compatibilidad Completa

  | Fase | Descripción              | Complejidad |
  |------|--------------------------|-------------|
  | 1    | Modelo de datos completo | Media       |
  | 2    | API Runtime actualizada  | Media       |
  | 3    | Exportación SCORM        | Alta        |
  | 4    | Navigation API           | Alta        |
  | 5    | Sequencing Rules         | Muy Alta    |
  | 6    | Accesibilidad WCAG       | Media       |

  El sistema tiene una base sólida para contenido SCORM importado, pero requiere trabajo significativo para alcanzar compatibilidad completa bidireccional
  con el estándar.

● He completado el análisis exhaustivo. El informe detalla:

  Hallazgos principales:

  1. El sistema tiene buena base para importar SCORM (~65% SCORM 1.2, ~55% SCORM 2004)
  2. Elementos críticos faltantes:
    - Tablas scorm_interactions y scorm_objectives no están en la BD (solo interfaces TypeScript)
    - No hay capacidad de exportar cursos nativos a SCORM
    - API de navegación (adl.nav.*) no implementada
    - Sequencing rules de SCORM 2004 no soportados
  3. Metadatos: El sistema tiene campos básicos (title, description, category, level) pero faltan muchos elementos IEEE LOM requeridos
  4. Tracking: Buen sistema de progreso nativo, pero las interacciones SCORM detalladas (respuestas individuales, latencia, weighting) no se persisten
  5. Recomendaciones priorizadas:
    - Fase 1: Agregar tablas SQL para scorm_interactions, scorm_objectives, y campos faltantes en scorm_attempts
    - Fase 2: Actualizar API Runtime para persistir interacciones/objetivos
    - Fase 3: Implementar exportación SCORM (generar imsmanifest.xml + ZIP)
    - Fase 4: Navigation API para SCORM 2004
    - Fase 5: Sequencing Rules (complejidad muy alta)