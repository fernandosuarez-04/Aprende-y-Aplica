# Análisis de Implementación SCORM en Aprende y Aplica

## Índice

1. [¿Qué es SCORM?](#qué-es-scorm)
2. [Versiones de SCORM](#versiones-de-scorm)
3. [Arquitectura de SCORM](#arquitectura-de-scorm)
4. [Implementación en Nuestro Sistema](#implementación-en-nuestro-sistema)
5. [Ventajas](#ventajas)
6. [Desventajas](#desventajas)
7. [Alternativas a SCORM](#alternativas-a-scorm)
8. [Recomendación Final](#recomendación-final)
9. [Plan de Implementación (si se decide usar)](#plan-de-implementación-si-se-decide-usar)

---

## ¿Qué es SCORM?

**SCORM** (Sharable Content Object Reference Model) es un conjunto de estándares técnicos para productos de e-learning. Define:

- **Cómo se empaqueta el contenido** (archivos ZIP con manifest XML)
- **Cómo se comunica el contenido con el LMS** (API JavaScript)
- **Qué datos se rastrean** (progreso, puntuaciones, tiempo, estados)

### Componentes Principales

```
SCORM Package
├── imsmanifest.xml          # Manifiesto con metadatos y estructura
├── content/
│   ├── index.html           # Punto de entrada del SCO
│   ├── scripts/
│   │   └── scorm-api.js     # Comunicación con LMS
│   ├── styles/
│   └── assets/
└── metadata/                 # Metadatos opcionales
```

---

## Versiones de SCORM

| Versión | Año | Características | Uso Actual |
|---------|-----|-----------------|------------|
| SCORM 1.1 | 2001 | Básico, deprecated | No usar |
| SCORM 1.2 | 2001 | Ampliamente soportado | Común en legacy |
| SCORM 2004 (1st-4th Ed.) | 2004-2009 | Secuenciación, navegación | Estándar actual |

### SCORM 1.2 vs 2004

```
SCORM 1.2:
- API: window.API
- Funciones: LMSInitialize, LMSGetValue, LMSSetValue, LMSCommit, LMSFinish
- Sin secuenciación avanzada
- Más fácil de implementar

SCORM 2004:
- API: window.API_1484_11
- Funciones: Initialize, GetValue, SetValue, Commit, Terminate
- Secuenciación y navegación avanzada
- Más complejo pero más potente
```

---

## Arquitectura de SCORM

### Flujo de Comunicación

```
┌─────────────────────────────────────────────────────────────┐
│                         NAVEGADOR                           │
│  ┌───────────────────┐    API JS    ┌───────────────────┐  │
│  │   Contenido SCO   │◄────────────►│   LMS (Adapter)   │  │
│  │   (HTML/JS/CSS)   │              │                   │  │
│  └───────────────────┘              └─────────┬─────────┘  │
│                                               │             │
└───────────────────────────────────────────────│─────────────┘
                                                │
                                    HTTP/REST   │
                                                ▼
                                    ┌───────────────────┐
                                    │   Backend (API)   │
                                    │   Express/Node    │
                                    └─────────┬─────────┘
                                              │
                                              ▼
                                    ┌───────────────────┐
                                    │    Supabase       │
                                    │   (PostgreSQL)    │
                                    └───────────────────┘
```

### Datos que Rastrea SCORM

```typescript
interface SCORMData {
  // Estado de la lección
  cmi.core.lesson_status: 'passed' | 'completed' | 'failed' | 'incomplete' | 'browsed' | 'not attempted';

  // Puntuación
  cmi.core.score.raw: number;      // 0-100
  cmi.core.score.min: number;
  cmi.core.score.max: number;

  // Tiempo
  cmi.core.session_time: string;   // "HH:MM:SS.ss"
  cmi.core.total_time: string;

  // Ubicación
  cmi.core.lesson_location: string; // Bookmark

  // Datos libres
  cmi.suspend_data: string;        // Hasta 4096 chars

  // Interacciones (quizzes)
  cmi.interactions.n.id: string;
  cmi.interactions.n.type: 'true-false' | 'choice' | 'fill-in' | 'matching' | 'performance' | 'sequencing' | 'likert' | 'numeric';
  cmi.interactions.n.learner_response: string;
  cmi.interactions.n.result: 'correct' | 'incorrect' | 'unanticipated' | 'neutral';
}
```

---

## Implementación en Nuestro Sistema

### Opción A: Implementación Nativa

#### 1. Estructura de Base de Datos (Supabase)

```sql
-- Tabla para paquetes SCORM
CREATE TABLE scorm_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID REFERENCES cursos(id),
  titulo VARCHAR(255) NOT NULL,
  version VARCHAR(20) DEFAULT 'SCORM_1.2',
  manifest_data JSONB,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para intentos/sesiones de usuario
CREATE TABLE scorm_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES usuarios(id),
  package_id UUID REFERENCES scorm_packages(id),
  attempt_number INT DEFAULT 1,
  lesson_status VARCHAR(50) DEFAULT 'not attempted',
  lesson_location TEXT,
  score_raw DECIMAL(5,2),
  score_min DECIMAL(5,2) DEFAULT 0,
  score_max DECIMAL(5,2) DEFAULT 100,
  total_time INTERVAL DEFAULT '0',
  session_time INTERVAL DEFAULT '0',
  suspend_data TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, package_id, attempt_number)
);

-- Tabla para interacciones (quizzes, ejercicios)
CREATE TABLE scorm_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES scorm_attempts(id),
  interaction_id VARCHAR(255),
  interaction_type VARCHAR(50),
  learner_response TEXT,
  correct_response TEXT,
  result VARCHAR(50),
  weighting DECIMAL(5,2),
  latency INTERVAL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_scorm_attempts_user ON scorm_attempts(user_id);
CREATE INDEX idx_scorm_attempts_package ON scorm_attempts(package_id);
CREATE INDEX idx_scorm_interactions_attempt ON scorm_interactions(attempt_id);
```

#### 2. API Endpoints (Express)

```typescript
// apps/api/src/features/scorm/scorm.routes.ts

import { Router } from 'express';
import { SCORMController } from './scorm.controller';
import { authMiddleware } from '@/core/middlewares/auth';

const router = Router();
const controller = new SCORMController();

// Gestión de paquetes
router.post('/packages/upload', authMiddleware, controller.uploadPackage);
router.get('/packages/:packageId', authMiddleware, controller.getPackage);
router.delete('/packages/:packageId', authMiddleware, controller.deletePackage);

// Runtime API (comunicación SCO ↔ LMS)
router.post('/runtime/initialize', authMiddleware, controller.initialize);
router.post('/runtime/getValue', authMiddleware, controller.getValue);
router.post('/runtime/setValue', authMiddleware, controller.setValue);
router.post('/runtime/commit', authMiddleware, controller.commit);
router.post('/runtime/terminate', authMiddleware, controller.terminate);

// Reportes
router.get('/reports/user/:userId', authMiddleware, controller.getUserReport);
router.get('/reports/package/:packageId', authMiddleware, controller.getPackageReport);

export default router;
```

#### 3. SCORM API Adapter (Frontend)

```typescript
// apps/web/src/lib/scorm/scorm-adapter.ts

interface SCORMAdapter {
  LMSInitialize(): string;
  LMSGetValue(key: string): string;
  LMSSetValue(key: string, value: string): string;
  LMSCommit(): string;
  LMSFinish(): string;
  LMSGetLastError(): string;
  LMSGetErrorString(errorCode: string): string;
  LMSGetDiagnostic(errorCode: string): string;
}

class SCORMAPIAdapter implements SCORMAdapter {
  private attemptId: string | null = null;
  private cache: Map<string, string> = new Map();
  private lastError: string = '0';

  constructor(private packageId: string, private userId: string) {}

  async LMSInitialize(): Promise<string> {
    try {
      const response = await fetch('/api/v1/scorm/runtime/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: this.packageId,
          userId: this.userId
        })
      });

      const data = await response.json();
      this.attemptId = data.attemptId;
      this.cache = new Map(Object.entries(data.cmiData));
      this.lastError = '0';
      return 'true';
    } catch (error) {
      this.lastError = '101'; // General exception
      return 'false';
    }
  }

  LMSGetValue(key: string): string {
    const value = this.cache.get(key);
    if (value === undefined) {
      this.lastError = '201'; // Invalid argument
      return '';
    }
    this.lastError = '0';
    return value;
  }

  LMSSetValue(key: string, value: string): string {
    // Validar claves de solo lectura
    const readOnlyKeys = ['cmi.core._children', 'cmi.core.student_id', 'cmi.core.student_name'];
    if (readOnlyKeys.includes(key)) {
      this.lastError = '403'; // Read only
      return 'false';
    }

    this.cache.set(key, value);
    this.lastError = '0';
    return 'true';
  }

  async LMSCommit(): Promise<string> {
    try {
      await fetch('/api/v1/scorm/runtime/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: this.attemptId,
          cmiData: Object.fromEntries(this.cache)
        })
      });
      this.lastError = '0';
      return 'true';
    } catch (error) {
      this.lastError = '101';
      return 'false';
    }
  }

  async LMSFinish(): Promise<string> {
    await this.LMSCommit();

    try {
      await fetch('/api/v1/scorm/runtime/terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: this.attemptId })
      });
      this.lastError = '0';
      return 'true';
    } catch (error) {
      this.lastError = '101';
      return 'false';
    }
  }

  LMSGetLastError(): string {
    return this.lastError;
  }

  LMSGetErrorString(errorCode: string): string {
    const errors: Record<string, string> = {
      '0': 'No error',
      '101': 'General exception',
      '201': 'Invalid argument',
      '202': 'Element cannot have children',
      '203': 'Element not an array',
      '301': 'Not initialized',
      '401': 'Not implemented',
      '402': 'Invalid set value',
      '403': 'Read only element',
      '404': 'Write only element',
    };
    return errors[errorCode] || 'Unknown error';
  }

  LMSGetDiagnostic(errorCode: string): string {
    return this.LMSGetErrorString(errorCode);
  }
}

// Inyectar API en window para que el SCO lo encuentre
export function initializeSCORMAPI(packageId: string, userId: string) {
  const adapter = new SCORMAPIAdapter(packageId, userId);
  (window as any).API = adapter; // SCORM 1.2
  return adapter;
}
```

#### 4. Componente Player SCORM (React)

```tsx
// apps/web/src/features/courses/components/SCORMPlayer.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { initializeSCORMAPI } from '@/lib/scorm/scorm-adapter';

interface SCORMPlayerProps {
  packageId: string;
  userId: string;
  entryPoint: string; // URL del index.html del SCO
  onComplete?: (data: SCORMCompletionData) => void;
}

export function SCORMPlayer({ packageId, userId, entryPoint, onComplete }: SCORMPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inicializar API SCORM antes de cargar el contenido
    const api = initializeSCORMAPI(packageId, userId);

    // Escuchar mensajes del iframe (opcional, para comunicación adicional)
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SCORM_COMPLETE') {
        onComplete?.(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      // Cleanup: llamar LMSFinish si no se llamó
      api.LMSFinish();
      window.removeEventListener('message', handleMessage);
    };
  }, [packageId, userId, onComplete]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-neutral-100 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={entryPoint}
        className="w-full h-full border-0"
        onLoad={() => setIsLoading(false)}
        onError={() => setError('Error al cargar el contenido SCORM')}
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="Contenido SCORM"
      />
    </div>
  );
}
```

### Opción B: Usar Librería Existente

Existen librerías que simplifican la implementación:

```bash
npm install scorm-again --workspace=apps/web
# o
npm install pipwerks-scorm-api-wrapper --workspace=apps/web
```

---

## Ventajas

### 1. Interoperabilidad
- Contenido creado en herramientas como Articulate, Captivate, iSpring funciona sin modificaciones
- Fácil migración de/hacia otros LMS
- Estándar reconocido internacionalmente

### 2. Tracking Estandarizado
- Modelo de datos consistente para progreso, puntuaciones, tiempo
- Comparabilidad de métricas entre diferentes cursos
- Reportes unificados

### 3. Reutilización de Contenido
- Comprar/vender cursos en marketplaces (eLearning Brothers, etc.)
- Clientes empresariales pueden traer su propio contenido
- Reducir costos de desarrollo de contenido

### 4. Certificaciones y Compliance
- Requerido para certificaciones en algunas industrias
- Auditoría de formación (healthcare, finanzas, aviación)
- Evidencia de completitud para reguladores

### 5. Herramientas de Autoría Maduras
- Articulate Storyline/Rise
- Adobe Captivate
- iSpring Suite
- Camtasia
- Lectora

---

## Desventajas

### 1. Complejidad Técnica
```
- Parsear manifests XML (imsmanifest.xml)
- Implementar runtime API completo
- Manejar múltiples versiones (1.2 vs 2004)
- Edge cases y comportamientos inconsistentes entre authoring tools
```

### 2. Limitaciones Técnicas
```
- Comunicación síncrona (bloqueante)
- Sin soporte offline real
- Datos limitados (suspend_data = 4096 chars en 1.2)
- No diseñado para mobile-first
- Dependencia de iframes (problemas de seguridad/CSP)
```

### 3. UX Anticuada
```
- Contenido típicamente estático
- Navegación rígida (especialmente SCORM 2004)
- No se integra visualmente con UI moderna
- Experiencia "encapsulada" vs nativa
```

### 4. Mantenimiento
```
- Debugging difícil (contenido en iframe)
- Actualizaciones requieren re-empaquetar
- Sin hot reload ni desarrollo moderno
- Paquetes grandes (todo el contenido empaquetado)
```

### 5. Costos Ocultos
```
- Hosting de archivos estáticos (storage)
- Herramientas de autoría (licencias $$$)
- Tiempo de desarrollo del runtime
- Testing cross-browser del contenido
```

### 6. Seguridad
```
- Contenido ejecuta JavaScript arbitrario
- Difícil sanitizar paquetes subidos
- Potencial XSS si no se aísla correctamente
- Necesidad de CSP relajado para iframes
```

---

## Alternativas a SCORM

### 1. xAPI (Tin Can API) - Sucesor Moderno

| Aspecto | SCORM | xAPI |
|---------|-------|------|
| Comunicación | Síncrona, JS API | Asíncrona, REST API |
| Datos | Modelo fijo (cmi.*) | Flexible (statements) |
| Offline | No | Sí |
| Mobile | Limitado | Nativo |
| Tracking | Solo en LMS | Cualquier experiencia |

```typescript
// Ejemplo statement xAPI
{
  "actor": {
    "mbox": "mailto:usuario@example.com",
    "name": "Juan Pérez"
  },
  "verb": {
    "id": "http://adlnet.gov/expapi/verbs/completed",
    "display": { "en-US": "completed" }
  },
  "object": {
    "id": "https://aprendeyaplica.com/cursos/curso-1/leccion-5",
    "definition": {
      "name": { "es": "Lección 5: Fundamentos" },
      "type": "http://adlnet.gov/expapi/activities/lesson"
    }
  },
  "result": {
    "score": { "scaled": 0.85 },
    "completion": true,
    "success": true
  }
}
```

### 2. cmi5 - SCORM + xAPI

- Combina empaquetado de SCORM con tracking de xAPI
- Más moderno pero menos adoptado
- Mejor opción si se necesita compatibilidad futura

### 3. LTI (Learning Tools Interoperability)

- Para integrar herramientas externas (no empaquetar contenido)
- Single Sign-On entre plataformas
- Útil para: labs virtuales, simuladores, herramientas de terceros

### 4. Contenido Nativo (Recomendado para nosotros)

```typescript
// Ya tenemos tracking propio en el sistema
interface LessonProgress {
  userId: string;
  courseId: string;
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number; // 0-100
  score?: number;
  timeSpent: number; // segundos
  lastAccessed: Date;
  completedAt?: Date;
}
```

---

## Recomendación Final

### ¿Conviene implementar SCORM en Aprende y Aplica?

**Respuesta corta: NO, a menos que haya un requerimiento de negocio específico.**

### Razones para NO implementar:

1. **Ya tenemos tracking nativo**
   - El sistema ya rastrea progreso de lecciones
   - Study Planner maneja sesiones y tiempos
   - LIA proporciona analytics de interacción

2. **Nuestro contenido es nativo**
   - Cursos creados en React/Next.js
   - Integración con LIA chatbot
   - Experiencia de usuario cohesiva

3. **Costo-beneficio desfavorable**
   - 2-4 semanas de desarrollo para runtime completo
   - Mantenimiento continuo
   - Sin beneficio claro si no hay contenido SCORM externo

4. **Alternativas mejores disponibles**
   - xAPI si se necesita tracking avanzado
   - LTI si se necesita integrar herramientas externas
   - APIs propias para interoperabilidad

### Cuándo SÍ valdría la pena:

1. **Clientes B2B que tienen contenido SCORM existente**
   ```
   Ejemplo: Una empresa quiere usar su contenido de compliance
   existente (creado en Articulate) en nuestra plataforma.
   ```

2. **Venta de cursos a otras plataformas**
   ```
   Si queremos exportar nuestros cursos para que otros LMS
   los importen, necesitaríamos empaquetarlos en SCORM.
   ```

3. **Certificaciones de industria**
   ```
   Algunas industrias (healthcare, finanzas) requieren
   tracking SCORM para auditorías de compliance.
   ```

4. **Marketplace de contenido**
   ```
   Si queremos que instructores externos suban contenido
   sin acceso a nuestro código.
   ```

### Alternativa Recomendada: xAPI Lite

Si se necesita interoperabilidad futura, implementar un tracking básico compatible con xAPI:

```typescript
// lib/learning-analytics/track.ts

export async function trackLearningActivity(
  userId: string,
  verb: 'started' | 'progressed' | 'completed' | 'scored' | 'answered',
  object: { type: 'course' | 'lesson' | 'quiz'; id: string; name: string },
  result?: { score?: number; success?: boolean; completion?: boolean }
) {
  await supabase.from('learning_activities').insert({
    user_id: userId,
    verb,
    object_type: object.type,
    object_id: object.id,
    object_name: object.name,
    result_score: result?.score,
    result_success: result?.success,
    result_completion: result?.completion,
    timestamp: new Date().toISOString()
  });
}
```

Esto permite:
- Tracking granular sin complejidad de SCORM
- Migración futura a xAPI si se necesita
- Reportes avanzados para clientes B2B
- Sin overhead de iframes y paquetes

---

## Plan de Implementación (si se decide usar)

Si hay un requerimiento de negocio que justifique SCORM:

### Fase 1: MVP (2 semanas)
- [ ] Tablas en Supabase para paquetes y attempts
- [ ] Upload y parsing de paquetes SCORM 1.2
- [ ] Runtime API básico (Initialize, GetValue, SetValue, Commit, Finish)
- [ ] Componente Player con iframe
- [ ] Almacenamiento de paquetes en Supabase Storage

### Fase 2: Producción (2 semanas)
- [ ] Soporte SCORM 2004
- [ ] Reportes de progreso por usuario/curso
- [ ] Validación de paquetes al subir
- [ ] Manejo de errores robusto
- [ ] Tests automatizados

### Fase 3: Avanzado (2 semanas)
- [ ] Secuenciación SCORM 2004
- [ ] Importación masiva de paquetes
- [ ] Exportación de cursos a SCORM
- [ ] Integración con Study Planner
- [ ] Analytics dashboard

### Librerías Útiles

```bash
# Parsing de manifests
npm install xml2js jszip --workspace=apps/api

# Runtime API (frontend)
npm install scorm-again --workspace=apps/web

# Validación de paquetes
npm install scorm-manifest-validator --workspace=apps/api
```

---

## Conclusión

SCORM es una tecnología madura pero con limitaciones significativas para plataformas modernas. Para Aprende y Aplica, **no se recomienda implementar SCORM** a menos que:

1. Exista un cliente B2B con contenido SCORM existente
2. Se requiera vender cursos en marketplaces externos
3. Haya requisitos de compliance que lo exijan

La inversión de desarrollo (4-6 semanas) no se justifica sin estos casos de uso específicos. Es preferible invertir en mejorar el tracking nativo y considerar xAPI para futura interoperabilidad.

---

*Documento creado: Diciembre 2024*
*Última actualización: Diciembre 2024*
