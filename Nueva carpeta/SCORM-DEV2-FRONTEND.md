# SCORM - Desarrollador 2: Frontend & UI

## Responsabilidades
- SCORM API Adapter (JavaScript bridge)
- Componentes de UI (Player, Uploader, Progress)
- Integración con sistema de cursos existente
- Hooks y servicios frontend
- Seguridad del cliente (CSP, iframe)

---

## Fase 1: Tipos y Configuración (Días 1-2)

### 1.1 Instalar Dependencias

```bash
npm install react-dropzone --workspace=apps/web
```

### 1.2 Crear Tipos Compartidos

**Archivo:** `apps/web/src/lib/scorm/types.ts`

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

export interface SCORMAdapterConfig {
  packageId: string;
  version: SCORMVersion;
  onError?: (error: string) => void;
  onComplete?: (status: string, score?: number) => void;
}

export interface SCORMPlayerProps {
  packageId: string;
  version: SCORMVersion;
  storagePath: string;
  entryPoint: string;
  onComplete?: (status: string, score?: number) => void;
  onError?: (error: string) => void;
  className?: string;
}

export interface SCORMUploaderProps {
  courseId: string;
  organizationId: string;
  onSuccess?: (packageData: ScormPackage) => void;
  onError?: (error: string) => void;
}
```

---

## Fase 2: SCORM API Adapter (Días 3-6)

### 2.1 Crear el Adapter

**Archivo:** `apps/web/src/lib/scorm/adapter.ts`

```typescript
import { SCORMVersion, SCORMAdapterConfig } from './types';

export class SCORMAPIAdapter {
  private attemptId: string | null = null;
  private cache: Map<string, string> = new Map();
  private lastError: string = '0';
  private initialized: boolean = false;
  private terminated: boolean = false;
  private config: SCORMAdapterConfig;
  private initPromise: Promise<void> | null = null;

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

    this.initPromise = this.initializeAsync();
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
        Object.entries(data.cmiData).forEach(([key, value]) => {
          this.cache.set(key, value as string);
        });
      } else {
        this.config.onError?.('Failed to initialize: ' + data.error);
      }
    } catch (error) {
      this.config.onError?.('Failed to initialize');
    }
  }

  LMSGetValue(key: string): string {
    if (!this.initialized) {
      this.lastError = '301';
      return '';
    }

    const value = this.cache.get(key);
    if (value === undefined) {
      if (key.endsWith('._count')) {
        return '0';
      }
      if (key.endsWith('._children')) {
        return this.getChildrenForKey(key);
      }
      this.lastError = '201';
      return '';
    }

    this.lastError = '0';
    return value;
  }

  private getChildrenForKey(key: string): string {
    const childrenMap: Record<string, string> = {
      'cmi.core._children': 'student_id,student_name,lesson_location,credit,lesson_status,entry,score,total_time,lesson_mode,exit,session_time',
      'cmi.score._children': 'raw,min,max',
      'cmi.core.score._children': 'raw,min,max',
      'cmi.interactions._children': 'id,objectives,time,type,correct_responses,weighting,student_response,result,latency',
    };
    return childrenMap[key] || '';
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

    const readOnly = [
      'cmi.core._children', 'cmi.core.student_id', 'cmi.core.student_name',
      'cmi.core.total_time', 'cmi.core.entry', 'cmi.core.lesson_mode',
      'cmi._version', 'cmi.interactions._children', 'cmi.interactions._count'
    ];

    if (readOnly.includes(key)) {
      this.lastError = '403';
      return 'false';
    }

    this.cache.set(key, value);
    this.setValueAsync(key, value);

    // Detectar completado
    if (key === 'cmi.core.lesson_status' || key === 'cmi.completion_status') {
      if (value === 'completed' || value === 'passed' || value === 'failed') {
        const scoreKey = this.config.version === 'SCORM_2004'
          ? 'cmi.score.raw'
          : 'cmi.core.score.raw';
        const score = parseFloat(this.cache.get(scoreKey) || '');
        this.config.onComplete?.(value, isNaN(score) ? undefined : score);
      }
    }

    this.lastError = '0';
    return 'true';
  }

  private async setValueAsync(key: string, value: string) {
    if (!this.attemptId) {
      await this.initPromise;
    }
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
      // Silent fail - datos en cache local
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
    if (!this.attemptId) {
      await this.initPromise;
    }
    if (!this.attemptId) return;

    try {
      await fetch('/api/scorm/runtime/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: this.attemptId })
      });
    } catch (error) {
      // Silent fail
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
      // Silent fail
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

  // Métodos de utilidad
  isInitialized(): boolean {
    return this.initialized;
  }

  isTerminated(): boolean {
    return this.terminated;
  }

  getAttemptId(): string | null {
    return this.attemptId;
  }
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

// Función para que el SCO encuentre el API
export function findAPI(win: Window): any {
  let findAttempts = 0;
  const findAttemptLimit = 500;

  while (
    win.API == null &&
    win.API_1484_11 == null &&
    win.parent != null &&
    win.parent != win
  ) {
    findAttempts++;
    if (findAttempts > findAttemptLimit) {
      return null;
    }
    win = win.parent;
  }

  return win.API_1484_11 || win.API;
}
```

---

## Fase 3: Componentes de UI (Días 7-12)

### 3.1 SCORM Player Component

**Archivo:** `apps/web/src/features/scorm/components/SCORMPlayer.tsx`

```tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { initializeSCORMAPI, cleanupSCORMAPI } from '@/lib/scorm/adapter';
import { createClient } from '@/lib/supabase/client';
import { SCORMPlayerProps } from '@/lib/scorm/types';

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
  const adapterRef = useRef<ReturnType<typeof initializeSCORMAPI> | null>(null);

  // Obtener URL firmada del contenido
  useEffect(() => {
    async function getContentUrl() {
      try {
        const supabase = createClient();

        const { data, error: urlError } = await supabase.storage
          .from('scorm-packages')
          .createSignedUrl(`${storagePath}/${entryPoint}`, 3600);

        if (urlError || !data) {
          setError('Failed to load content');
          onError?.('Failed to load content');
          return;
        }

        setContentUrl(data.signedUrl);
      } catch (err) {
        setError('Failed to load content');
        onError?.('Failed to load content');
      }
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
      },
      onComplete: (status, score) => {
        onComplete?.(status, score);
      }
    });

    adapterRef.current = adapter;

    return () => {
      if (adapterRef.current && !adapterRef.current.isTerminated()) {
        adapterRef.current.LMSFinish('');
      }
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
          <svg
            className="w-12 h-12 mx-auto text-red-400 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-red-600 font-medium">Error loading content</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
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

### 3.2 SCORM Uploader Component

**Archivo:** `apps/web/src/features/scorm/components/SCORMUploader.tsx`

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { SCORMUploaderProps } from '@/lib/scorm/types';

export function SCORMUploader({
  courseId,
  organizationId,
  onSuccess,
  onError
}: SCORMUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

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
    setFileName(file.name);
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

      // Reset después de éxito
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setFileName(null);
      }, 2000);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      onError?.(message);
      setUploading(false);
      setProgress(0);
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
          transition-all duration-200
          ${isDragActive
            ? 'border-primary-500 bg-primary-50 scale-[1.02]'
            : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto relative">
              <svg className="w-16 h-16 text-primary-100" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
              <svg
                className="w-16 h-16 text-primary-600 absolute top-0 left-0 transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${progress}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-primary-600">
                {progress}%
              </span>
            </div>
            <div>
              <p className="text-neutral-700 font-medium">Uploading...</p>
              {fileName && (
                <p className="text-neutral-500 text-sm mt-1 truncate max-w-xs mx-auto">
                  {fileName}
                </p>
              )}
            </div>
            <div className="w-full max-w-xs mx-auto bg-neutral-200 rounded-full h-1.5">
              <div
                className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : progress === 100 ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto text-green-500">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-green-600 font-medium">Upload complete!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto text-neutral-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
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
            <p className="text-neutral-400 text-xs">
              Supports SCORM 1.2 and SCORM 2004
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <svg
            className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-red-600 text-sm font-medium">Upload failed</p>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3.3 SCORM Progress Component

**Archivo:** `apps/web/src/features/scorm/components/SCORMProgress.tsx`

```tsx
'use client';

import { ScormAttempt } from '@/lib/scorm/types';

interface SCORMProgressProps {
  attempt: ScormAttempt;
  className?: string;
}

export function SCORMProgress({ attempt, className = '' }: SCORMProgressProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'passed':
        return 'Aprobado';
      case 'failed':
        return 'Reprobado';
      case 'incomplete':
        return 'En progreso';
      case 'not attempted':
        return 'No iniciado';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const scorePercentage = attempt.score_raw != null && attempt.score_max != null
    ? Math.round((attempt.score_raw / attempt.score_max) * 100)
    : null;

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-neutral-500">
          Intento #{attempt.attempt_number}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attempt.lesson_status)}`}>
          {getStatusLabel(attempt.lesson_status)}
        </span>
      </div>

      {scorePercentage !== null && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-neutral-600">Puntuación</span>
            <span className="text-sm font-medium text-neutral-900">
              {attempt.score_raw} / {attempt.score_max} ({scorePercentage}%)
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                scorePercentage >= 70 ? 'bg-green-500' :
                scorePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-neutral-500">Iniciado</span>
          <p className="text-neutral-900">{formatDate(attempt.started_at)}</p>
        </div>
        <div>
          <span className="text-neutral-500">Último acceso</span>
          <p className="text-neutral-900">{formatDate(attempt.last_accessed_at)}</p>
        </div>
        {attempt.completed_at && (
          <div className="col-span-2">
            <span className="text-neutral-500">Completado</span>
            <p className="text-neutral-900">{formatDate(attempt.completed_at)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 3.4 Barrel Export

**Archivo:** `apps/web/src/features/scorm/index.ts`

```typescript
// Components
export { SCORMPlayer } from './components/SCORMPlayer';
export { SCORMUploader } from './components/SCORMUploader';
export { SCORMProgress } from './components/SCORMProgress';

// Types
export type {
  ScormPackage,
  ScormAttempt,
  SCORMVersion,
  SCORMPlayerProps,
  SCORMUploaderProps,
  SCORMAdapterConfig
} from '@/lib/scorm/types';
```

---

## Fase 4: Hooks y Servicios (Días 13-14)

### 4.1 Hook useScormPackage

**Archivo:** `apps/web/src/features/scorm/hooks/useScormPackage.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { ScormPackage } from '@/lib/scorm/types';

interface UseScormPackageOptions {
  packageId?: string;
  courseId?: string;
  organizationId?: string;
}

interface UseScormPackageReturn {
  package_: ScormPackage | null;
  packages: ScormPackage[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useScormPackage(options: UseScormPackageOptions = {}): UseScormPackageReturn {
  const { packageId, courseId, organizationId } = options;
  const [package_, setPackage] = useState<ScormPackage | null>(null);
  const [packages, setPackages] = useState<ScormPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackage = async () => {
    if (!packageId) return;

    try {
      const response = await fetch(`/api/scorm/packages/${packageId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch package');
      }

      setPackage(data.package);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch package');
    }
  };

  const fetchPackages = async () => {
    try {
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId);
      if (organizationId) params.append('organizationId', organizationId);

      const response = await fetch(`/api/scorm/packages?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch packages');
      }

      setPackages(data.packages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch packages');
    }
  };

  const refetch = async () => {
    setIsLoading(true);
    setError(null);

    if (packageId) {
      await fetchPackage();
    } else {
      await fetchPackages();
    }

    setIsLoading(false);
  };

  useEffect(() => {
    refetch();
  }, [packageId, courseId, organizationId]);

  return {
    package_,
    packages,
    isLoading,
    error,
    refetch
  };
}
```

### 4.2 Hook useScormAttempts

**Archivo:** `apps/web/src/features/scorm/hooks/useScormAttempts.ts`

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ScormAttempt } from '@/lib/scorm/types';

interface UseScormAttemptsOptions {
  packageId: string;
  userId?: string;
}

interface UseScormAttemptsReturn {
  attempts: ScormAttempt[];
  latestAttempt: ScormAttempt | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useScormAttempts({ packageId, userId }: UseScormAttemptsOptions): UseScormAttemptsReturn {
  const [attempts, setAttempts] = useState<ScormAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = useCallback(async () => {
    try {
      const supabase = createClient();

      let query = supabase
        .from('scorm_attempts')
        .select('*')
        .eq('package_id', packageId)
        .order('attempt_number', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setAttempts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attempts');
    } finally {
      setIsLoading(false);
    }
  }, [packageId, userId]);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    await fetchAttempts();
  };

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  return {
    attempts,
    latestAttempt: attempts[0] || null,
    isLoading,
    error,
    refetch
  };
}
```

### 4.3 Export de Hooks

Agregar al barrel export `apps/web/src/features/scorm/index.ts`:

```typescript
// Hooks
export { useScormPackage } from './hooks/useScormPackage';
export { useScormAttempts } from './hooks/useScormAttempts';
```

---

## Fase 5: Integración con Cursos (Días 15-16)

### 5.1 Página de Visualización de Curso SCORM

**Archivo:** `apps/web/src/app/(dashboard)/courses/[courseId]/scorm/[packageId]/page.tsx`

```tsx
'use client';

import { useParams } from 'next/navigation';
import { SCORMPlayer, SCORMProgress, useScormPackage, useScormAttempts } from '@/features/scorm';
import { useState } from 'react';

export default function ScormCoursePage() {
  const params = useParams();
  const packageId = params.packageId as string;

  const { package_, isLoading: packageLoading, error: packageError } = useScormPackage({ packageId });
  const { attempts, latestAttempt, refetch: refetchAttempts } = useScormAttempts({ packageId });

  const [showHistory, setShowHistory] = useState(false);

  const handleComplete = (status: string, score?: number) => {
    refetchAttempts();
  };

  const handleError = (error: string) => {
    // Manejar error
  };

  if (packageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (packageError || !package_) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading course</p>
          <p className="text-neutral-500 text-sm mt-1">{packageError || 'Package not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">{package_.title}</h1>
        {package_.description && (
          <p className="text-neutral-600 mt-1">{package_.description}</p>
        )}
        <div className="flex items-center gap-4 mt-3">
          <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-sm">
            {package_.version === 'SCORM_2004' ? 'SCORM 2004' : 'SCORM 1.2'}
          </span>
          {latestAttempt && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {showHistory ? 'Hide history' : `View history (${attempts.length} attempts)`}
            </button>
          )}
        </div>
      </div>

      {/* Historial de intentos */}
      {showHistory && attempts.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">Attempt History</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {attempts.map((attempt) => (
              <SCORMProgress key={attempt.id} attempt={attempt} />
            ))}
          </div>
        </div>
      )}

      {/* Player */}
      <SCORMPlayer
        packageId={package_.id}
        version={package_.version}
        storagePath={package_.storage_path}
        entryPoint={package_.entry_point}
        onComplete={handleComplete}
        onError={handleError}
        className="aspect-video max-h-[700px]"
      />
    </div>
  );
}
```

### 5.2 Sección de Upload en Admin de Curso

**Archivo:** `apps/web/src/features/courses/components/CourseScormSection.tsx`

```tsx
'use client';

import { useState } from 'react';
import { SCORMUploader, useScormPackage, ScormPackage } from '@/features/scorm';
import Link from 'next/link';

interface CourseScormSectionProps {
  courseId: string;
  organizationId: string;
}

export function CourseScormSection({ courseId, organizationId }: CourseScormSectionProps) {
  const { packages, isLoading, refetch } = useScormPackage({ courseId, organizationId });
  const [showUploader, setShowUploader] = useState(false);

  const handleUploadSuccess = (packageData: ScormPackage) => {
    refetch();
    setShowUploader(false);
  };

  const handleDelete = async (packageId: string) => {
    if (!confirm('Are you sure you want to delete this SCORM package?')) return;

    try {
      const response = await fetch(`/api/scorm/packages/${packageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        refetch();
      }
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">SCORM Packages</h2>
          <p className="text-sm text-neutral-500">
            Upload SCORM 1.2 or 2004 packages for this course
          </p>
        </div>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {showUploader ? 'Cancel' : 'Upload Package'}
        </button>
      </div>

      {showUploader && (
        <div className="mb-6">
          <SCORMUploader
            courseId={courseId}
            organizationId={organizationId}
            onSuccess={handleUploadSuccess}
          />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          No SCORM packages uploaded yet
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-neutral-900 truncate">{pkg.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-neutral-500">
                    {pkg.version === 'SCORM_2004' ? 'SCORM 2004' : 'SCORM 1.2'}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {(pkg.file_size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  <span className="text-xs text-neutral-500">
                    {new Date(pkg.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Link
                  href={`/courses/${courseId}/scorm/${pkg.id}`}
                  className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                >
                  Preview
                </Link>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Checklist Dev 2

```
□ Fase 1: Tipos y Configuración
  □ Instalar react-dropzone
  □ Crear types.ts

□ Fase 2: SCORM API Adapter
  □ Crear adapter.ts
  □ Implementar SCORM 1.2 API
  □ Implementar SCORM 2004 API (alias)
  □ Funciones de inyección en window

□ Fase 3: Componentes UI
  □ SCORMPlayer.tsx
  □ SCORMUploader.tsx
  □ SCORMProgress.tsx
  □ Barrel export (index.ts)

□ Fase 4: Hooks y Servicios
  □ useScormPackage.ts
  □ useScormAttempts.ts

□ Fase 5: Integración
  □ Página de visualización SCORM
  □ Sección de upload en admin de curso
```

---

## Puntos de Integración con Dev 1

### APIs que consume el Frontend

| Endpoint | Método | Usado por |
|----------|--------|-----------|
| `/api/scorm/upload` | POST | SCORMUploader |
| `/api/scorm/packages` | GET | useScormPackage |
| `/api/scorm/packages/[id]` | GET | useScormPackage |
| `/api/scorm/packages/[id]` | DELETE | CourseScormSection |
| `/api/scorm/runtime/initialize` | POST | SCORMAPIAdapter |
| `/api/scorm/runtime/setValue` | POST | SCORMAPIAdapter |
| `/api/scorm/runtime/commit` | POST | SCORMAPIAdapter |
| `/api/scorm/runtime/terminate` | POST | SCORMAPIAdapter |

### Tipos Compartidos

Asegurarse de que `apps/web/src/lib/scorm/types.ts` esté sincronizado con Dev 1.

### Notas de Integración

1. **Orden de desarrollo:**
   - Dev 2 puede empezar con el adapter y componentes usando mocks
   - Una vez Dev 1 tenga las APIs listas, conectar

2. **Pruebas de integración:**
   - Usar paquetes SCORM de prueba (Articulate sample, etc.)
   - Probar flujo completo: upload → play → track

3. **Merge strategy:**
   - Trabajar en ramas separadas (`feature/scorm-backend`, `feature/scorm-frontend`)
   - Crear PRs pequeños y frecuentes
   - Punto de merge principal: cuando ambos estén listos para integración

---

*Documento para Desarrollador 2 - Frontend & UI*
