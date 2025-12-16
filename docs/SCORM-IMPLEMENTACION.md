# Guía de Implementación SCORM

## Índice
1. [Resumen](#resumen)
2. [Arquitectura](#arquitectura)
3. [Base de Datos](#base-de-datos)
4. [Backend API](#backend-api)
5. [Frontend](#frontend)
6. [Seguridad](#seguridad)
7. [Fases de Desarrollo](#fases-de-desarrollo)

---

## Resumen

Implementación de soporte SCORM 1.2 y 2004 para permitir que clientes B2B suban cursos creados en herramientas externas (Articulate, Captivate, iSpring, etc.).

### Flujo General

```
Cliente sube ZIP → Validación → Extracción → Storage → Usuario accede → Runtime API → Tracking
```

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVEGADOR                                │
│  ┌─────────────────┐              ┌─────────────────────────┐   │
│  │  SCORMPlayer    │   window.API │   SCORM API Adapter     │   │
│  │  (iframe)       │◄────────────►│   (JavaScript Bridge)   │   │
│  └─────────────────┘              └───────────┬─────────────┘   │
└───────────────────────────────────────────────│─────────────────┘
                                                │ REST API
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API ROUTES                          │
│  /api/scorm/upload    - Subida de paquetes                      │
│  /api/scorm/runtime/* - Runtime API (init, get, set, commit)    │
│  /api/scorm/packages  - CRUD paquetes                           │
└───────────────────────────────────────────────┬─────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │   PostgreSQL    │    │     Storage     │                     │
│  │  - packages     │    │  scorm-packages │                     │
│  │  - attempts     │    │  (bucket)       │                     │
│  │  - interactions │    │                 │                     │
│  └─────────────────┘    └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Base de Datos

### Tablas SQL (ejecutar en Supabase)

```sql
-- 1. Paquetes SCORM
CREATE TABLE scorm_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  course_id UUID REFERENCES courses(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT 'SCORM_1.2', -- SCORM_1.2 | SCORM_2004
  manifest_data JSONB NOT NULL,
  entry_point TEXT NOT NULL, -- ruta al index.html
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  status VARCHAR(20) DEFAULT 'active', -- active | inactive | processing
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Intentos/Sesiones de usuario
CREATE TABLE scorm_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  package_id UUID REFERENCES scorm_packages(id) NOT NULL,
  attempt_number INT DEFAULT 1,

  -- CMI Core Data
  lesson_status VARCHAR(20) DEFAULT 'not attempted',
  lesson_location TEXT,
  credit VARCHAR(10) DEFAULT 'credit',
  entry VARCHAR(10) DEFAULT 'ab-initio',
  exit_type VARCHAR(20),

  -- Score
  score_raw DECIMAL(5,2),
  score_min DECIMAL(5,2) DEFAULT 0,
  score_max DECIMAL(5,2) DEFAULT 100,
  score_scaled DECIMAL(3,2), -- SCORM 2004

  -- Time
  total_time INTERVAL DEFAULT '0',
  session_time INTERVAL DEFAULT '0',

  -- Suspend Data (bookmark y estado)
  suspend_data TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  UNIQUE(user_id, package_id, attempt_number)
);

-- 3. Interacciones (respuestas a quizzes)
CREATE TABLE scorm_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES scorm_attempts(id) ON DELETE CASCADE,
  interaction_id VARCHAR(255) NOT NULL,
  interaction_type VARCHAR(20), -- true-false, choice, fill-in, matching, etc.
  description TEXT,
  learner_response TEXT,
  correct_response TEXT,
  result VARCHAR(20), -- correct, incorrect, unanticipated, neutral
  weighting DECIMAL(5,2) DEFAULT 1,
  latency INTERVAL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Objetivos de aprendizaje (SCORM 2004)
CREATE TABLE scorm_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES scorm_attempts(id) ON DELETE CASCADE,
  objective_id VARCHAR(255) NOT NULL,
  score_raw DECIMAL(5,2),
  score_min DECIMAL(5,2),
  score_max DECIMAL(5,2),
  score_scaled DECIMAL(3,2),
  success_status VARCHAR(20),
  completion_status VARCHAR(20),
  description TEXT
);

-- Índices
CREATE INDEX idx_scorm_packages_org ON scorm_packages(organization_id);
CREATE INDEX idx_scorm_attempts_user ON scorm_attempts(user_id);
CREATE INDEX idx_scorm_attempts_package ON scorm_attempts(package_id);
CREATE INDEX idx_scorm_interactions_attempt ON scorm_interactions(attempt_id);

-- RLS Policies
ALTER TABLE scorm_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorm_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorm_interactions ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo ven sus propios attempts
CREATE POLICY "Users view own attempts" ON scorm_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own attempts" ON scorm_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own attempts" ON scorm_attempts
  FOR UPDATE USING (auth.uid() = user_id);
```

### Crear Storage Bucket

```sql
-- En Supabase Dashboard > Storage > New Bucket
-- Nombre: scorm-packages
-- Public: false (archivos servidos via signed URLs)
```

---

## Backend API

### Estructura de Archivos

```
apps/web/src/
├── app/api/scorm/
│   ├── upload/route.ts        # POST - Subir paquete
│   ├── packages/
│   │   ├── route.ts           # GET lista, POST crear
│   │   └── [id]/route.ts      # GET, DELETE paquete
│   └── runtime/
│       ├── initialize/route.ts
│       ├── getValue/route.ts
│       ├── setValue/route.ts
│       ├── commit/route.ts
│       └── terminate/route.ts
└── lib/scorm/
    ├── parser.ts              # Parsear imsmanifest.xml
    ├── validator.ts           # Validar paquete SCORM
    ├── storage.ts             # Manejo de archivos
    └── cmi-data.ts            # Modelo de datos CMI
```

### 1. Upload y Validación de Paquetes

```typescript
// apps/web/src/app/api/scorm/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { parseScormManifest, validateScormPackage } from '@/lib/scorm/parser';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const courseId = formData.get('courseId') as string;
  const organizationId = formData.get('organizationId') as string;

  if (!file || !file.name.endsWith('.zip')) {
    return NextResponse.json({ error: 'Invalid file. Must be a ZIP' }, { status: 400 });
  }

  // Límite 100MB
  if (file.size > 100 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Max 100MB' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 1. Buscar y validar imsmanifest.xml
    const manifestFile = zip.file('imsmanifest.xml');
    if (!manifestFile) {
      return NextResponse.json({ error: 'Invalid SCORM: missing imsmanifest.xml' }, { status: 400 });
    }

    const manifestXml = await manifestFile.async('string');
    const manifest = await parseScormManifest(manifestXml);

    // 2. Validar estructura
    const validation = await validateScormPackage(zip, manifest);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 3. Subir a Supabase Storage
    const packageId = crypto.randomUUID();
    const storagePath = `${organizationId}/${packageId}`;

    // Extraer y subir cada archivo
    const uploadPromises = Object.keys(zip.files).map(async (filename) => {
      const zipEntry = zip.files[filename];
      if (zipEntry.dir) return;

      const content = await zipEntry.async('arraybuffer');
      const filePath = `${storagePath}/${filename}`;

      await supabase.storage
        .from('scorm-packages')
        .upload(filePath, content, {
          contentType: getContentType(filename),
          upsert: true
        });
    });

    await Promise.all(uploadPromises);

    // 4. Guardar metadata en DB
    const { data: package_, error } = await supabase
      .from('scorm_packages')
      .insert({
        id: packageId,
        organization_id: organizationId,
        course_id: courseId,
        title: manifest.title,
        description: manifest.description,
        version: manifest.version,
        manifest_data: manifest,
        entry_point: manifest.entryPoint,
        storage_path: storagePath,
        file_size: file.size,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, package: package_ });

  } catch (error) {
    console.error('SCORM upload error:', error);
    return NextResponse.json({ error: 'Failed to process package' }, { status: 500 });
  }
}

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: 'text/html',
    htm: 'text/html',
    js: 'application/javascript',
    css: 'text/css',
    json: 'application/json',
    xml: 'application/xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    pdf: 'application/pdf',
  };
  return types[ext || ''] || 'application/octet-stream';
}
```

### 2. Parser del Manifest

```typescript
// apps/web/src/lib/scorm/parser.ts
import { parseStringPromise } from 'xml2js';
import JSZip from 'jszip';

export interface ScormManifest {
  version: 'SCORM_1.2' | 'SCORM_2004';
  title: string;
  description?: string;
  entryPoint: string;
  organizations: ScormOrganization[];
  resources: ScormResource[];
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
  children?: ScormItem[];
}

interface ScormResource {
  identifier: string;
  type: string;
  href?: string;
  files: string[];
}

export async function parseScormManifest(xml: string): Promise<ScormManifest> {
  const result = await parseStringPromise(xml, { explicitArray: false });
  const manifest = result.manifest;

  // Detectar versión
  const schemaVersion = manifest.metadata?.schemaversion ||
                        manifest['$']?.version || '1.2';
  const version = schemaVersion.includes('2004') ? 'SCORM_2004' : 'SCORM_1.2';

  // Parsear organizaciones
  const orgs = manifest.organizations?.organization;
  const orgArray = Array.isArray(orgs) ? orgs : orgs ? [orgs] : [];

  const organizations: ScormOrganization[] = orgArray.map((org: any) => ({
    identifier: org['$']?.identifier || '',
    title: org.title || '',
    items: parseItems(org.item)
  }));

  // Parsear recursos
  const res = manifest.resources?.resource;
  const resArray = Array.isArray(res) ? res : res ? [res] : [];

  const resources: ScormResource[] = resArray.map((r: any) => ({
    identifier: r['$']?.identifier || '',
    type: r['$']?.type || '',
    href: r['$']?.href,
    files: parseFiles(r.file)
  }));

  // Encontrar entry point (primer recurso con href)
  const entryPoint = resources.find(r => r.href)?.href || 'index.html';

  // Título del curso
  const title = organizations[0]?.title ||
                manifest.metadata?.lom?.general?.title?.string ||
                'Untitled Course';

  return {
    version,
    title,
    description: manifest.metadata?.lom?.general?.description?.string,
    entryPoint,
    organizations,
    resources
  };
}

function parseItems(items: any): ScormItem[] {
  if (!items) return [];
  const arr = Array.isArray(items) ? items : [items];
  return arr.map((item: any) => ({
    identifier: item['$']?.identifier || '',
    title: item.title || '',
    resourceId: item['$']?.identifierref,
    children: parseItems(item.item)
  }));
}

function parseFiles(files: any): string[] {
  if (!files) return [];
  const arr = Array.isArray(files) ? files : [files];
  return arr.map((f: any) => f['$']?.href || '').filter(Boolean);
}

export async function validateScormPackage(
  zip: JSZip,
  manifest: ScormManifest
): Promise<{ valid: boolean; error?: string }> {

  // Verificar que el entry point existe
  if (!zip.file(manifest.entryPoint)) {
    return { valid: false, error: `Entry point not found: ${manifest.entryPoint}` };
  }

  // Verificar recursos críticos
  for (const resource of manifest.resources) {
    if (resource.href && !zip.file(resource.href)) {
      return { valid: false, error: `Resource not found: ${resource.href}` };
    }
  }

  return { valid: true };
}
```

### 3. Runtime API - Initialize

```typescript
// apps/web/src/app/api/scorm/runtime/initialize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { packageId } = await req.json();

  // Obtener paquete
  const { data: package_ } = await supabase
    .from('scorm_packages')
    .select('*')
    .eq('id', packageId)
    .single();

  if (!package_) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  // Buscar attempt existente o crear nuevo
  let { data: attempt } = await supabase
    .from('scorm_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('package_id', packageId)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .single();

  // Si no hay attempt o el último está completo, crear nuevo
  if (!attempt || attempt.lesson_status === 'completed' || attempt.lesson_status === 'passed') {
    const newAttemptNumber = (attempt?.attempt_number || 0) + 1;

    const { data: newAttempt, error } = await supabase
      .from('scorm_attempts')
      .insert({
        user_id: user.id,
        package_id: packageId,
        attempt_number: newAttemptNumber,
        entry: 'ab-initio'
      })
      .select()
      .single();

    if (error) throw error;
    attempt = newAttempt;
  } else {
    // Resuming - actualizar entry
    await supabase
      .from('scorm_attempts')
      .update({
        entry: attempt.suspend_data ? 'resume' : 'ab-initio',
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', attempt.id);
  }

  // Construir datos CMI iniciales
  const cmiData = buildCMIData(attempt, user, package_);

  return NextResponse.json({
    success: true,
    attemptId: attempt.id,
    cmiData
  });
}

function buildCMIData(attempt: any, user: any, package_: any) {
  const isScorm2004 = package_.version === 'SCORM_2004';

  if (isScorm2004) {
    return {
      'cmi.completion_status': attempt.lesson_status === 'completed' ? 'completed' : 'incomplete',
      'cmi.success_status': attempt.lesson_status === 'passed' ? 'passed' : 'unknown',
      'cmi.location': attempt.lesson_location || '',
      'cmi.suspend_data': attempt.suspend_data || '',
      'cmi.score.raw': attempt.score_raw?.toString() || '',
      'cmi.score.min': attempt.score_min?.toString() || '0',
      'cmi.score.max': attempt.score_max?.toString() || '100',
      'cmi.score.scaled': attempt.score_scaled?.toString() || '',
      'cmi.total_time': formatTime2004(attempt.total_time),
      'cmi.learner_id': user.id,
      'cmi.learner_name': user.user_metadata?.full_name || user.email,
      'cmi.entry': attempt.entry || 'ab-initio',
      'cmi.credit': attempt.credit || 'credit',
      'cmi.mode': 'normal'
    };
  }

  // SCORM 1.2
  return {
    'cmi.core.lesson_status': attempt.lesson_status || 'not attempted',
    'cmi.core.lesson_location': attempt.lesson_location || '',
    'cmi.suspend_data': attempt.suspend_data || '',
    'cmi.core.score.raw': attempt.score_raw?.toString() || '',
    'cmi.core.score.min': attempt.score_min?.toString() || '0',
    'cmi.core.score.max': attempt.score_max?.toString() || '100',
    'cmi.core.total_time': formatTime12(attempt.total_time),
    'cmi.core.student_id': user.id,
    'cmi.core.student_name': user.user_metadata?.full_name || user.email,
    'cmi.core.entry': attempt.entry || 'ab-initio',
    'cmi.core.credit': attempt.credit || 'credit',
    'cmi.core.lesson_mode': 'normal'
  };
}

function formatTime12(interval: string | null): string {
  if (!interval) return '0000:00:00.00';
  // Convertir PostgreSQL interval a SCORM 1.2 format (HHHH:MM:SS.ss)
  // Simplificado - en producción parsear el interval correctamente
  return '0000:00:00.00';
}

function formatTime2004(interval: string | null): string {
  if (!interval) return 'PT0S';
  // Convertir a ISO 8601 duration (PT#H#M#S)
  return 'PT0S';
}
```

### 4. Runtime API - SetValue y Commit

```typescript
// apps/web/src/app/api/scorm/runtime/setValue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Cache temporal en memoria (en producción usar Redis)
const sessionCache = new Map<string, Map<string, string>>();

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '401' }, { status: 401 });
  }

  const { attemptId, key, value } = await req.json();

  // Validar que el attempt pertenece al usuario
  const { data: attempt } = await supabase
    .from('scorm_attempts')
    .select('id')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single();

  if (!attempt) {
    return NextResponse.json({ error: '404' }, { status: 404 });
  }

  // Guardar en cache de sesión
  if (!sessionCache.has(attemptId)) {
    sessionCache.set(attemptId, new Map());
  }
  sessionCache.get(attemptId)!.set(key, value);

  return NextResponse.json({ success: true });
}
```

```typescript
// apps/web/src/app/api/scorm/runtime/commit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const sessionCache = new Map<string, Map<string, string>>();

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '401' }, { status: 401 });
  }

  const { attemptId } = await req.json();

  const cache = sessionCache.get(attemptId);
  if (!cache) {
    return NextResponse.json({ success: true }); // Nada que guardar
  }

  // Mapear CMI keys a columnas de DB
  const updateData: Record<string, any> = {
    last_accessed_at: new Date().toISOString()
  };

  // SCORM 1.2 mappings
  const mappings: Record<string, string> = {
    'cmi.core.lesson_status': 'lesson_status',
    'cmi.core.lesson_location': 'lesson_location',
    'cmi.core.score.raw': 'score_raw',
    'cmi.core.score.min': 'score_min',
    'cmi.core.score.max': 'score_max',
    'cmi.core.session_time': 'session_time',
    'cmi.core.exit': 'exit_type',
    'cmi.suspend_data': 'suspend_data',
    // SCORM 2004
    'cmi.completion_status': 'lesson_status',
    'cmi.success_status': 'lesson_status',
    'cmi.location': 'lesson_location',
    'cmi.score.raw': 'score_raw',
    'cmi.score.scaled': 'score_scaled',
    'cmi.session_time': 'session_time',
    'cmi.exit': 'exit_type',
  };

  for (const [cmiKey, dbColumn] of Object.entries(mappings)) {
    if (cache.has(cmiKey)) {
      const value = cache.get(cmiKey)!;

      // Conversiones especiales
      if (dbColumn === 'score_raw' || dbColumn === 'score_min' ||
          dbColumn === 'score_max' || dbColumn === 'score_scaled') {
        updateData[dbColumn] = parseFloat(value) || null;
      } else if (dbColumn === 'session_time') {
        updateData[dbColumn] = parseSessionTime(value);
      } else {
        updateData[dbColumn] = value;
      }
    }
  }

  // Marcar como completado si aplica
  if (updateData.lesson_status === 'completed' || updateData.lesson_status === 'passed') {
    updateData.completed_at = new Date().toISOString();
  }

  // Guardar en DB
  const { error } = await supabase
    .from('scorm_attempts')
    .update(updateData)
    .eq('id', attemptId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Commit error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  // Procesar interacciones si las hay
  await saveInteractions(supabase, attemptId, cache);

  return NextResponse.json({ success: true });
}

function parseSessionTime(time: string): string {
  // SCORM 1.2: HHHH:MM:SS.ss → PostgreSQL interval
  // SCORM 2004: PT#H#M#S → PostgreSQL interval
  if (time.startsWith('PT')) {
    // ISO 8601 duration
    const match = time.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
    if (match) {
      const hours = match[1] || '0';
      const minutes = match[2] || '0';
      const seconds = match[3] || '0';
      return `${hours}:${minutes}:${seconds}`;
    }
  } else {
    // SCORM 1.2 format
    return time.replace(/^(\d+):/, '$1 hours ');
  }
  return '0';
}

async function saveInteractions(supabase: any, attemptId: string, cache: Map<string, string>) {
  // Buscar keys de interacciones: cmi.interactions.0.id, etc.
  const interactionKeys = Array.from(cache.keys()).filter(k => k.startsWith('cmi.interactions.'));

  if (interactionKeys.length === 0) return;

  // Agrupar por índice de interacción
  const interactions = new Map<string, Record<string, string>>();

  for (const key of interactionKeys) {
    const match = key.match(/cmi\.interactions\.(\d+)\.(.+)/);
    if (match) {
      const [, index, field] = match;
      if (!interactions.has(index)) {
        interactions.set(index, {});
      }
      interactions.get(index)![field] = cache.get(key)!;
    }
  }

  // Insertar cada interacción
  for (const [, data] of interactions) {
    if (data.id) {
      await supabase.from('scorm_interactions').upsert({
        attempt_id: attemptId,
        interaction_id: data.id,
        interaction_type: data.type,
        learner_response: data.learner_response || data.student_response,
        correct_response: data.correct_responses?.[0] || null,
        result: data.result,
        weighting: data.weighting ? parseFloat(data.weighting) : 1,
        latency: data.latency
      }, {
        onConflict: 'attempt_id,interaction_id'
      });
    }
  }
}
```

---

## Frontend

### Estructura de Archivos

```
apps/web/src/
├── features/scorm/
│   ├── components/
│   │   ├── SCORMPlayer.tsx       # Player principal
│   │   ├── SCORMUploader.tsx     # Componente de subida
│   │   └── SCORMProgress.tsx     # Indicador de progreso
│   ├── hooks/
│   │   └── useScormPackage.ts    # Hook para cargar paquetes
│   └── index.ts
└── lib/scorm/
    ├── adapter.ts                # SCORM API Adapter
    └── types.ts                  # Tipos TypeScript
```

### 1. SCORM API Adapter

```typescript
// apps/web/src/lib/scorm/adapter.ts

type SCORMVersion = 'SCORM_1.2' | 'SCORM_2004';

interface SCORMAdapterConfig {
  packageId: string;
  version: SCORMVersion;
  onError?: (error: string) => void;
}

export class SCORMAPIAdapter {
  private attemptId: string | null = null;
  private cache: Map<string, string> = new Map();
  private lastError: string = '0';
  private initialized: boolean = false;
  private terminated: boolean = false;
  private config: SCORMAdapterConfig;

  constructor(config: SCORMAdapterConfig) {
    this.config = config;
  }

  // =====================
  // SCORM 1.2 API
  // =====================

  LMSInitialize(param: string): string {
    if (this.initialized) {
      this.lastError = '101';
      return 'false';
    }

    // Llamada async envuelta en Promise para mantener API síncrona
    this.initializeAsync();
    this.initialized = true;
    return 'true';
  }

  private async initializeAsync() {
    try {
      const res = await fetch('/api/scorm/runtime/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: this.config.packageId })
      });

      const data = await res.json();
      if (data.success) {
        this.attemptId = data.attemptId;
        // Cargar datos CMI en cache
        Object.entries(data.cmiData).forEach(([key, value]) => {
          this.cache.set(key, value as string);
        });
      }
    } catch (error) {
      this.config.onError?.('Failed to initialize');
    }
  }

  LMSGetValue(key: string): string {
    if (!this.initialized) {
      this.lastError = '301'; // Not initialized
      return '';
    }

    const value = this.cache.get(key);
    if (value === undefined) {
      // Claves dinámicas como cmi.interactions._count
      if (key.endsWith('._count')) {
        return '0';
      }
      this.lastError = '201'; // Invalid argument
      return '';
    }

    this.lastError = '0';
    return value;
  }

  LMSSetValue(key: string, value: string): string {
    if (!this.initialized) {
      this.lastError = '301';
      return 'false';
    }

    if (this.terminated) {
      this.lastError = '101';
      return 'false';
    }

    // Keys de solo lectura
    const readOnly = [
      'cmi.core._children', 'cmi.core.student_id', 'cmi.core.student_name',
      'cmi.core.total_time', 'cmi.core.entry', 'cmi.core.lesson_mode',
      'cmi._version', 'cmi.interactions._children'
    ];

    if (readOnly.includes(key)) {
      this.lastError = '403'; // Read only
      return 'false';
    }

    this.cache.set(key, value);

    // Enviar al servidor (async, no bloqueante)
    this.setValueAsync(key, value);

    this.lastError = '0';
    return 'true';
  }

  private async setValueAsync(key: string, value: string) {
    if (!this.attemptId) return;

    try {
      await fetch('/api/scorm/runtime/setValue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: this.attemptId,
          key,
          value
        })
      });
    } catch (error) {
      console.error('SetValue error:', error);
    }
  }

  LMSCommit(param: string): string {
    if (!this.initialized || this.terminated) {
      this.lastError = '301';
      return 'false';
    }

    this.commitAsync();
    this.lastError = '0';
    return 'true';
  }

  private async commitAsync() {
    if (!this.attemptId) return;

    try {
      await fetch('/api/scorm/runtime/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: this.attemptId })
      });
    } catch (error) {
      console.error('Commit error:', error);
    }
  }

  LMSFinish(param: string): string {
    if (!this.initialized) {
      this.lastError = '301';
      return 'false';
    }

    if (this.terminated) {
      this.lastError = '101';
      return 'false';
    }

    this.terminateAsync();
    this.terminated = true;
    this.lastError = '0';
    return 'true';
  }

  private async terminateAsync() {
    await this.commitAsync();

    try {
      await fetch('/api/scorm/runtime/terminate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: this.attemptId })
      });
    } catch (error) {
      console.error('Terminate error:', error);
    }
  }

  LMSGetLastError(): string {
    return this.lastError;
  }

  LMSGetErrorString(errorCode: string): string {
    const errors: Record<string, string> = {
      '0': 'No error',
      '101': 'General exception',
      '201': 'Invalid argument error',
      '202': 'Element cannot have children',
      '203': 'Element not an array - cannot have count',
      '301': 'Not initialized',
      '401': 'Not implemented error',
      '402': 'Invalid set value, element is a keyword',
      '403': 'Element is read only',
      '404': 'Element is write only',
      '405': 'Incorrect data type'
    };
    return errors[errorCode] || 'Unknown error';
  }

  LMSGetDiagnostic(errorCode: string): string {
    return this.LMSGetErrorString(errorCode);
  }

  // =====================
  // SCORM 2004 API (alias)
  // =====================

  Initialize = (param: string) => this.LMSInitialize(param);
  GetValue = (key: string) => this.LMSGetValue(key);
  SetValue = (key: string, value: string) => this.LMSSetValue(key, value);
  Commit = (param: string) => this.LMSCommit(param);
  Terminate = (param: string) => this.LMSFinish(param);
  GetLastError = () => this.LMSGetLastError();
  GetErrorString = (code: string) => this.LMSGetErrorString(code);
  GetDiagnostic = (code: string) => this.LMSGetDiagnostic(code);
}

// Inyectar en window
export function initializeSCORMAPI(config: SCORMAdapterConfig): SCORMAPIAdapter {
  const adapter = new SCORMAPIAdapter(config);

  if (config.version === 'SCORM_2004') {
    (window as any).API_1484_11 = adapter;
  } else {
    (window as any).API = adapter;
  }

  return adapter;
}

export function cleanupSCORMAPI() {
  delete (window as any).API;
  delete (window as any).API_1484_11;
}
```

### 2. SCORM Player Component

```tsx
// apps/web/src/features/scorm/components/SCORMPlayer.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { initializeSCORMAPI, cleanupSCORMAPI } from '@/lib/scorm/adapter';
import { createClient } from '@/lib/supabase/client';

interface SCORMPlayerProps {
  packageId: string;
  version: 'SCORM_1.2' | 'SCORM_2004';
  storagePath: string;
  entryPoint: string;
  onComplete?: (status: string, score?: number) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function SCORMPlayer({
  packageId,
  version,
  storagePath,
  entryPoint,
  onComplete,
  onError,
  className = ''
}: SCORMPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentUrl, setContentUrl] = useState<string | null>(null);

  // Obtener URL firmada del contenido
  useEffect(() => {
    async function getContentUrl() {
      const supabase = createClient();

      // Crear URL firmada para el entry point
      const { data, error: urlError } = await supabase.storage
        .from('scorm-packages')
        .createSignedUrl(`${storagePath}/${entryPoint}`, 3600); // 1 hora

      if (urlError || !data) {
        setError('Failed to load content');
        onError?.('Failed to load content');
        return;
      }

      setContentUrl(data.signedUrl);
    }

    getContentUrl();
  }, [storagePath, entryPoint, onError]);

  // Inicializar SCORM API
  useEffect(() => {
    if (!contentUrl) return;

    const adapter = initializeSCORMAPI({
      packageId,
      version,
      onError: (err) => {
        setError(err);
        onError?.(err);
      }
    });

    // Escuchar cuando el SCO termine
    const checkCompletion = setInterval(() => {
      const status = adapter.LMSGetValue(
        version === 'SCORM_2004'
          ? 'cmi.completion_status'
          : 'cmi.core.lesson_status'
      );

      if (status === 'completed' || status === 'passed' || status === 'failed') {
        const score = parseFloat(
          adapter.LMSGetValue(
            version === 'SCORM_2004' ? 'cmi.score.raw' : 'cmi.core.score.raw'
          )
        );
        onComplete?.(status, isNaN(score) ? undefined : score);
        clearInterval(checkCompletion);
      }
    }, 5000);

    return () => {
      clearInterval(checkCompletion);
      // Terminar sesión SCORM
      adapter.LMSFinish('');
      cleanupSCORMAPI();
    };
  }, [contentUrl, packageId, version, onComplete, onError]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setError('Failed to load SCORM content');
    setIsLoading(false);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading content</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-neutral-100 rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-600 text-sm">Loading course...</p>
          </div>
        </div>
      )}

      {contentUrl && (
        <iframe
          ref={iframeRef}
          src={contentUrl}
          className="w-full h-full min-h-[600px] border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          allow="autoplay; fullscreen"
          title="SCORM Content"
        />
      )}
    </div>
  );
}
```

### 3. SCORM Uploader Component

```tsx
// apps/web/src/features/scorm/components/SCORMUploader.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface SCORMUploaderProps {
  courseId: string;
  organizationId: string;
  onSuccess?: (packageData: any) => void;
  onError?: (error: string) => void;
}

export function SCORMUploader({
  courseId,
  organizationId,
  onSuccess,
  onError
}: SCORMUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('File must be a ZIP package');
      onError?.('File must be a ZIP package');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File size exceeds 100MB limit');
      onError?.('File size exceeds 100MB limit');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);
    formData.append('organizationId', organizationId);

    try {
      setProgress(30);

      const response = await fetch('/api/scorm/upload', {
        method: 'POST',
        body: formData
      });

      setProgress(80);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress(100);
      onSuccess?.(data.package);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      onError?.(message);
    } finally {
      setUploading(false);
    }
  }, [courseId, organizationId, onSuccess, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 hover:border-primary-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-600">Uploading and processing...</p>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto text-neutral-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-neutral-700 font-medium">
              {isDragActive ? 'Drop SCORM package here' : 'Drag & drop SCORM package'}
            </p>
            <p className="text-neutral-500 text-sm">
              or click to select file (ZIP, max 100MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
```

### 4. Dependencias NPM

```bash
# Instalar dependencias necesarias
npm install jszip xml2js react-dropzone --workspace=apps/web
npm install @types/xml2js --workspace=apps/web --save-dev
```

---

## Seguridad

### 1. Validación de Paquetes

```typescript
// apps/web/src/lib/scorm/validator.ts

import JSZip from 'jszip';

const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.php', '.asp', '.jsp'];
const MAX_FILES = 5000;
const MAX_SINGLE_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function validatePackageSecurity(zip: JSZip): Promise<{
  valid: boolean;
  error?: string;
}> {
  const files = Object.keys(zip.files);

  // 1. Límite de archivos
  if (files.length > MAX_FILES) {
    return { valid: false, error: `Too many files (max ${MAX_FILES})` };
  }

  for (const filename of files) {
    const entry = zip.files[filename];
    if (entry.dir) continue;

    // 2. Path traversal
    if (filename.includes('..') || filename.startsWith('/')) {
      return { valid: false, error: `Invalid path: ${filename}` };
    }

    // 3. Extensiones peligrosas
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `Forbidden file type: ${ext}` };
    }

    // 4. Tamaño individual
    const content = await entry.async('arraybuffer');
    if (content.byteLength > MAX_SINGLE_FILE_SIZE) {
      return { valid: false, error: `File too large: ${filename}` };
    }

    // 5. Escanear HTML/JS por patrones sospechosos
    if (filename.endsWith('.html') || filename.endsWith('.js')) {
      const text = await entry.async('string');
      const suspicious = scanForSuspiciousContent(text);
      if (suspicious) {
        return { valid: false, error: `Suspicious content in ${filename}: ${suspicious}` };
      }
    }
  }

  return { valid: true };
}

function scanForSuspiciousContent(content: string): string | null {
  const patterns = [
    { regex: /eval\s*\(/gi, name: 'eval()' },
    { regex: /document\.cookie/gi, name: 'cookie access' },
    { regex: /localStorage|sessionStorage/gi, name: 'storage access' },
    { regex: /fetch\s*\([^)]*(?!api\/scorm)/gi, name: 'external fetch' },
    { regex: /new\s+WebSocket/gi, name: 'WebSocket' },
    { regex: /<script[^>]*src\s*=\s*["']https?:\/\/(?!cdn)/gi, name: 'external script' },
  ];

  for (const { regex, name } of patterns) {
    if (regex.test(content)) {
      return name;
    }
  }

  return null;
}
```

### 2. Content Security Policy para iframe

```typescript
// apps/web/src/app/api/scorm/content/[...path]/route.ts
// Proxy para servir contenido SCORM con headers seguros

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const filePath = params.path.join('/');

  // Verificar acceso al paquete
  const packageId = params.path[1]; // org/packageId/file.html
  const { data: hasAccess } = await supabase
    .from('scorm_attempts')
    .select('id')
    .eq('user_id', user.id)
    .eq('package_id', packageId)
    .limit(1)
    .single();

  if (!hasAccess) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Obtener archivo
  const { data, error } = await supabase.storage
    .from('scorm-packages')
    .download(filePath);

  if (error || !data) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const contentType = getContentType(filePath);

  return new NextResponse(data, {
    headers: {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // SCORM requiere eval
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "media-src 'self' blob:",
        "connect-src 'self'",
        "frame-ancestors 'self'",
      ].join('; '),
    },
  });
}
```

### 3. Rate Limiting

```typescript
// apps/web/src/app/api/scorm/runtime/middleware.ts

import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 100; // 100 requests por minuto

export function rateLimit(req: NextRequest): NextResponse | null {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return null;
  }

  if (record.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  record.count++;
  return null;
}
```

### 4. Sanitización de Datos

```typescript
// apps/web/src/lib/scorm/sanitize.ts

const MAX_SUSPEND_DATA = 64000; // 64KB (SCORM 2004 limit)
const MAX_LOCATION = 1000;

export function sanitizeCMIValue(key: string, value: string): string {
  // Truncar según límites SCORM
  if (key === 'cmi.suspend_data' || key === 'cmi.core.suspend_data') {
    return value.slice(0, MAX_SUSPEND_DATA);
  }

  if (key.includes('lesson_location') || key === 'cmi.location') {
    return value.slice(0, MAX_LOCATION);
  }

  // Sanitizar strings generales
  return value
    .replace(/[<>]/g, '') // Prevenir XSS básico
    .slice(0, 4096); // Límite general
}

export function validateCMIKey(key: string): boolean {
  // Solo permitir keys CMI válidas
  const validPatterns = [
    /^cmi\.core\./,
    /^cmi\.suspend_data$/,
    /^cmi\.interactions\.\d+\./,
    /^cmi\.objectives\.\d+\./,
    /^cmi\.student_data\./,
    /^cmi\.completion_status$/,
    /^cmi\.success_status$/,
    /^cmi\.score\./,
    /^cmi\.location$/,
    /^cmi\.session_time$/,
    /^cmi\.exit$/,
  ];

  return validPatterns.some(pattern => pattern.test(key));
}
```

---

## Fases de Desarrollo

### Fase 1: MVP (2 semanas)

| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Crear tablas en Supabase | Alta | Baja |
| Crear bucket Storage | Alta | Baja |
| API upload con validación básica | Alta | Media |
| Parser de imsmanifest.xml | Alta | Media |
| Runtime API (init, get, set, commit, terminate) | Alta | Media |
| SCORM API Adapter (SCORM 1.2) | Alta | Media |
| SCORMPlayer component | Alta | Media |
| SCORMUploader component | Media | Baja |

**Entregable:** Soporte básico SCORM 1.2, subida y reproducción de paquetes.

### Fase 2: Producción (2 semanas)

| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Soporte SCORM 2004 | Alta | Media |
| Validación de seguridad completa | Alta | Media |
| Rate limiting | Alta | Baja |
| Proxy de contenido con CSP | Alta | Media |
| Manejo de interacciones (quizzes) | Media | Media |
| Página de gestión de paquetes | Media | Media |
| Integración con sistema de cursos existente | Media | Media |

**Entregable:** Sistema robusto y seguro para producción.

### Fase 3: Mejoras (2 semanas)

| Tarea | Prioridad | Complejidad |
|-------|-----------|-------------|
| Dashboard de reportes por usuario | Media | Media |
| Dashboard de reportes por paquete | Media | Media |
| Exportación de datos a CSV | Baja | Baja |
| Soporte para múltiples SCOs por paquete | Baja | Alta |
| Caché con Redis para sesiones | Baja | Media |
| Tests automatizados | Media | Media |

**Entregable:** Analytics y optimizaciones.

---

## Checklist de Implementación

```
□ Base de Datos
  □ Crear tabla scorm_packages
  □ Crear tabla scorm_attempts
  □ Crear tabla scorm_interactions
  □ Crear tabla scorm_objectives
  □ Configurar RLS policies
  □ Crear bucket scorm-packages

□ Backend
  □ POST /api/scorm/upload
  □ GET /api/scorm/packages
  □ DELETE /api/scorm/packages/[id]
  □ POST /api/scorm/runtime/initialize
  □ POST /api/scorm/runtime/setValue
  □ POST /api/scorm/runtime/commit
  □ POST /api/scorm/runtime/terminate
  □ Validador de paquetes
  □ Parser de manifest

□ Frontend
  □ SCORMAPIAdapter class
  □ SCORMPlayer component
  □ SCORMUploader component
  □ Página de gestión de paquetes
  □ Integración con cursos existentes

□ Seguridad
  □ Validación de archivos peligrosos
  □ Escaneo de contenido sospechoso
  □ CSP para iframes
  □ Rate limiting
  □ Sanitización de datos CMI

□ Testing
  □ Probar con paquete Articulate
  □ Probar con paquete Captivate
  □ Probar con paquete iSpring
  □ Verificar tracking de progreso
  □ Verificar persistencia de suspend_data
```

---

## Recursos Adicionales

- [SCORM 1.2 Runtime Reference](https://scorm.com/scorm-explained/technical-scorm/run-time/run-time-reference/)
- [SCORM 2004 4th Edition Documentation](https://adlnet.gov/projects/scorm-2004-4th-edition/)
- [ADL SCORM Test Suite](https://adlnet.gov/projects/scorm-test-suite/)
- [Rustici SCORM Cloud](https://rusticisoftware.com/products/scorm-cloud/) (para testing)

---

*Documento creado: Diciembre 2024*
