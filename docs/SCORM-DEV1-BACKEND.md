# SCORM - Desarrollador 1: Backend & Base de Datos

## Responsabilidades
- Base de datos (Supabase)
- Storage bucket
- APIs de backend
- Parser y validación de paquetes
- Seguridad del servidor

---

## Fase 1: Infraestructura (Días 1-3)

### 1.1 Crear Tablas en Supabase

Ejecutar en Supabase SQL Editor:

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
  entry_point TEXT NOT NULL,
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
  lesson_status VARCHAR(20) DEFAULT 'not attempted',
  lesson_location TEXT,
  credit VARCHAR(10) DEFAULT 'credit',
  entry VARCHAR(10) DEFAULT 'ab-initio',
  exit_type VARCHAR(20),
  score_raw DECIMAL(5,2),
  score_min DECIMAL(5,2) DEFAULT 0,
  score_max DECIMAL(5,2) DEFAULT 100,
  score_scaled DECIMAL(3,2),
  total_time INTERVAL DEFAULT '0',
  session_time INTERVAL DEFAULT '0',
  suspend_data TEXT,
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
  interaction_type VARCHAR(20),
  description TEXT,
  learner_response TEXT,
  correct_response TEXT,
  result VARCHAR(20),
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
```

### 1.2 Configurar RLS Policies

```sql
ALTER TABLE scorm_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorm_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorm_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorm_objectives ENABLE ROW LEVEL SECURITY;

-- Policies para attempts
CREATE POLICY "Users view own attempts" ON scorm_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own attempts" ON scorm_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own attempts" ON scorm_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies para interactions
CREATE POLICY "Users view own interactions" ON scorm_interactions
  FOR SELECT USING (
    attempt_id IN (SELECT id FROM scorm_attempts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users insert own interactions" ON scorm_interactions
  FOR INSERT WITH CHECK (
    attempt_id IN (SELECT id FROM scorm_attempts WHERE user_id = auth.uid())
  );
```

### 1.3 Crear Storage Bucket

En Supabase Dashboard > Storage > New Bucket:
- **Nombre:** `scorm-packages`
- **Public:** false
- **File size limit:** 100MB

---

## Fase 2: Parser y Validación (Días 4-6)

### 2.1 Instalar Dependencias

```bash
npm install jszip xml2js --workspace=apps/web
npm install @types/xml2js --workspace=apps/web --save-dev
```

### 2.2 Crear Parser del Manifest

**Archivo:** `apps/web/src/lib/scorm/parser.ts`

```typescript
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

  // Encontrar entry point
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
  // Verificar entry point
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

### 2.3 Crear Validador de Seguridad

**Archivo:** `apps/web/src/lib/scorm/validator.ts`

```typescript
import JSZip from 'jszip';

const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.php', '.asp', '.jsp'];
const MAX_FILES = 5000;
const MAX_SINGLE_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function validatePackageSecurity(zip: JSZip): Promise<{
  valid: boolean;
  error?: string;
}> {
  const files = Object.keys(zip.files);

  // Límite de archivos
  if (files.length > MAX_FILES) {
    return { valid: false, error: `Too many files (max ${MAX_FILES})` };
  }

  for (const filename of files) {
    const entry = zip.files[filename];
    if (entry.dir) continue;

    // Path traversal
    if (filename.includes('..') || filename.startsWith('/')) {
      return { valid: false, error: `Invalid path: ${filename}` };
    }

    // Extensiones peligrosas
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `Forbidden file type: ${ext}` };
    }

    // Tamaño individual
    const content = await entry.async('arraybuffer');
    if (content.byteLength > MAX_SINGLE_FILE_SIZE) {
      return { valid: false, error: `File too large: ${filename}` };
    }

    // Escanear HTML/JS por patrones sospechosos
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
    { regex: /new\s+WebSocket/gi, name: 'WebSocket' },
  ];

  for (const { regex, name } of patterns) {
    if (regex.test(content)) {
      return name;
    }
  }

  return null;
}
```

---

## Fase 3: APIs de Backend (Días 7-12)

### 3.1 API Upload

**Archivo:** `apps/web/src/app/api/scorm/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { parseScormManifest, validateScormPackage } from '@/lib/scorm/parser';
import { validatePackageSecurity } from '@/lib/scorm/validator';
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

  if (file.size > 100 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large. Max 100MB' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Validar seguridad
    const securityCheck = await validatePackageSecurity(zip);
    if (!securityCheck.valid) {
      return NextResponse.json({ error: securityCheck.error }, { status: 400 });
    }

    // Buscar y validar imsmanifest.xml
    const manifestFile = zip.file('imsmanifest.xml');
    if (!manifestFile) {
      return NextResponse.json({ error: 'Invalid SCORM: missing imsmanifest.xml' }, { status: 400 });
    }

    const manifestXml = await manifestFile.async('string');
    const manifest = await parseScormManifest(manifestXml);

    // Validar estructura
    const validation = await validateScormPackage(zip, manifest);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Subir a Supabase Storage
    const packageId = crypto.randomUUID();
    const storagePath = `${organizationId}/${packageId}`;

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

    // Guardar metadata en DB
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

### 3.2 API Runtime - Initialize

**Archivo:** `apps/web/src/app/api/scorm/runtime/initialize/route.ts`

```typescript
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
    await supabase
      .from('scorm_attempts')
      .update({
        entry: attempt.suspend_data ? 'resume' : 'ab-initio',
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', attempt.id);
  }

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
  return '0000:00:00.00';
}

function formatTime2004(interval: string | null): string {
  if (!interval) return 'PT0S';
  return 'PT0S';
}
```

### 3.3 API Runtime - SetValue

**Archivo:** `apps/web/src/app/api/scorm/runtime/setValue/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Cache temporal (en producción usar Redis)
const sessionCache = new Map<string, Map<string, string>>();

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '401' }, { status: 401 });
  }

  const { attemptId, key, value } = await req.json();

  const { data: attempt } = await supabase
    .from('scorm_attempts')
    .select('id')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single();

  if (!attempt) {
    return NextResponse.json({ error: '404' }, { status: 404 });
  }

  if (!sessionCache.has(attemptId)) {
    sessionCache.set(attemptId, new Map());
  }
  sessionCache.get(attemptId)!.set(key, value);

  return NextResponse.json({ success: true });
}

// Exportar cache para commit
export { sessionCache };
```

### 3.4 API Runtime - Commit

**Archivo:** `apps/web/src/app/api/scorm/runtime/commit/route.ts`

```typescript
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
    return NextResponse.json({ success: true });
  }

  const updateData: Record<string, any> = {
    last_accessed_at: new Date().toISOString()
  };

  const mappings: Record<string, string> = {
    'cmi.core.lesson_status': 'lesson_status',
    'cmi.core.lesson_location': 'lesson_location',
    'cmi.core.score.raw': 'score_raw',
    'cmi.core.score.min': 'score_min',
    'cmi.core.score.max': 'score_max',
    'cmi.core.session_time': 'session_time',
    'cmi.core.exit': 'exit_type',
    'cmi.suspend_data': 'suspend_data',
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

  if (updateData.lesson_status === 'completed' || updateData.lesson_status === 'passed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('scorm_attempts')
    .update(updateData)
    .eq('id', attemptId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  await saveInteractions(supabase, attemptId, cache);

  return NextResponse.json({ success: true });
}

function parseSessionTime(time: string): string {
  if (time.startsWith('PT')) {
    const match = time.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
    if (match) {
      const hours = match[1] || '0';
      const minutes = match[2] || '0';
      const seconds = match[3] || '0';
      return `${hours}:${minutes}:${seconds}`;
    }
  }
  return time.replace(/^(\d+):/, '$1 hours ');
}

async function saveInteractions(supabase: any, attemptId: string, cache: Map<string, string>) {
  const interactionKeys = Array.from(cache.keys()).filter(k => k.startsWith('cmi.interactions.'));

  if (interactionKeys.length === 0) return;

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

### 3.5 API Runtime - Terminate

**Archivo:** `apps/web/src/app/api/scorm/runtime/terminate/route.ts`

```typescript
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

  // Limpiar cache de sesión
  sessionCache.delete(attemptId);

  // Actualizar última vez accedido
  await supabase
    .from('scorm_attempts')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', attemptId)
    .eq('user_id', user.id);

  return NextResponse.json({ success: true });
}
```

### 3.6 API Packages CRUD

**Archivo:** `apps/web/src/app/api/scorm/packages/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get('organizationId');
  const courseId = searchParams.get('courseId');

  let query = supabase
    .from('scorm_packages')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  if (courseId) {
    query = query.eq('course_id', courseId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }

  return NextResponse.json({ packages: data });
}
```

**Archivo:** `apps/web/src/app/api/scorm/packages/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('scorm_packages')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  return NextResponse.json({ package: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Soft delete
  const { error } = await supabase
    .from('scorm_packages')
    .update({ status: 'inactive' })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

---

## Fase 4: Seguridad Backend (Días 13-14)

### 4.1 Rate Limiting

**Archivo:** `apps/web/src/lib/scorm/rate-limit.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

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

### 4.2 Sanitización de Datos CMI

**Archivo:** `apps/web/src/lib/scorm/sanitize.ts`

```typescript
const MAX_SUSPEND_DATA = 64000;
const MAX_LOCATION = 1000;

export function sanitizeCMIValue(key: string, value: string): string {
  if (key === 'cmi.suspend_data' || key === 'cmi.core.suspend_data') {
    return value.slice(0, MAX_SUSPEND_DATA);
  }

  if (key.includes('lesson_location') || key === 'cmi.location') {
    return value.slice(0, MAX_LOCATION);
  }

  return value
    .replace(/[<>]/g, '')
    .slice(0, 4096);
}

export function validateCMIKey(key: string): boolean {
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

## Checklist Dev 1

```
□ Fase 1: Infraestructura
  □ Crear tabla scorm_packages
  □ Crear tabla scorm_attempts
  □ Crear tabla scorm_interactions
  □ Crear tabla scorm_objectives
  □ Configurar RLS policies
  □ Crear bucket scorm-packages

□ Fase 2: Parser y Validación
  □ Instalar jszip, xml2js
  □ Crear parser.ts
  □ Crear validator.ts

□ Fase 3: APIs
  □ POST /api/scorm/upload
  □ GET /api/scorm/packages
  □ GET /api/scorm/packages/[id]
  □ DELETE /api/scorm/packages/[id]
  □ POST /api/scorm/runtime/initialize
  □ POST /api/scorm/runtime/setValue
  □ POST /api/scorm/runtime/commit
  □ POST /api/scorm/runtime/terminate

□ Fase 4: Seguridad
  □ Rate limiting
  □ Sanitización CMI
  □ Validación de keys CMI
```

---

## Puntos de Integración con Dev 2

### Contratos de API (acordar antes de empezar)

**POST /api/scorm/upload**
- Request: `FormData { file: File, courseId: string, organizationId: string }`
- Response: `{ success: true, package: ScormPackage }`

**POST /api/scorm/runtime/initialize**
- Request: `{ packageId: string }`
- Response: `{ success: true, attemptId: string, cmiData: Record<string, string> }`

**POST /api/scorm/runtime/setValue**
- Request: `{ attemptId: string, key: string, value: string }`
- Response: `{ success: true }`

**POST /api/scorm/runtime/commit**
- Request: `{ attemptId: string }`
- Response: `{ success: true }`

**POST /api/scorm/runtime/terminate**
- Request: `{ attemptId: string }`
- Response: `{ success: true }`

### Tipos Compartidos

Crear `apps/web/src/lib/scorm/types.ts` con los tipos que ambos devs usarán:

```typescript
export type SCORMVersion = 'SCORM_1.2' | 'SCORM_2004';

export interface ScormPackage {
  id: string;
  organization_id: string;
  course_id: string;
  title: string;
  description?: string;
  version: SCORMVersion;
  manifest_data: any;
  entry_point: string;
  storage_path: string;
  file_size: number;
  status: 'active' | 'inactive' | 'processing';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ScormAttempt {
  id: string;
  user_id: string;
  package_id: string;
  attempt_number: number;
  lesson_status: string;
  lesson_location?: string;
  score_raw?: number;
  score_min?: number;
  score_max?: number;
  score_scaled?: number;
  suspend_data?: string;
  total_time?: string;
  session_time?: string;
  started_at: string;
  last_accessed_at: string;
  completed_at?: string;
}
```

---

*Documento para Desarrollador 1 - Backend & Base de Datos*
