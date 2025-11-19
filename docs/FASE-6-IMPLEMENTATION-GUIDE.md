# 📋 GUÍA DE IMPLEMENTACIÓN - FASE 6: Página de Sesión con Timer Pomodoro

**Fecha:** 2025-01-18
**Estado:** En progreso - Base completada
**Progreso:** 30% completado

---

## ✅ COMPLETADO HASTA AHORA

### 1. Tipos TypeScript (100% ✅)
**Archivo:** `apps/web/src/features/study-planner/types/session-page.types.ts` (230 líneas)

**Incluye:**
- `TimerState`, `SessionType`, `SessionStatus`
- `SessionData` - Datos completos de la sesión
- `PomodoroConfig` - Configuración del timer
- `TimerStateData` - Para persistencia
- `SessionCompletionData` - Payload para completar
- Helper functions: `formatTime`, `formatDuration`, `calculateProgress`, etc.
- Constantes para localStorage

### 2. API Endpoint GET (100% ✅)
**Archivo:** `apps/web/src/app/api/study-planner/sessions/[id]/route.ts` (135 líneas)

**Funcionalidad:**
- GET /api/study-planner/sessions/[id]
- Autenticación con SessionService
- Query con JOINs (lecciones, módulos, cursos)
- Verificación de permisos
- Error handling completo

### 3. Hook usePomodoroTimer (100% ✅)
**Archivo:** `apps/web/src/features/study-planner/hooks/usePomodoroTimer.ts` (280 líneas)

**Features:**
- Estado del timer (not-started, running, paused, break, completed)
- Countdown en segundos
- Transiciones automáticas focus ↔ break
- Persistencia en sessionStorage
- Tracking de pomodoros completados
- Funciones: start, pause, resume, reset, skipBreak
- Cálculo de progreso

---

## 🔄 PENDIENTE DE IMPLEMENTAR

### 4. Componente PomodoroTimer (ALTA PRIORIDAD)
**Archivo:** `apps/web/src/features/study-planner/components/PomodoroTimer.tsx`
**Estimado:** 250-300 líneas | 3 horas

**Estructura:**
```typescript
'use client'

import { usePomodoroTimer } from '../hooks/usePomodoroTimer'
import type { PomodoroConfig } from '../types/session-page.types'

interface PomodoroTimerProps {
  config: PomodoroConfig
  sessionId: string
  onPomodoroComplete?: (count: number) => void
  onSessionComplete?: () => void
  className?: string
}

export function PomodoroTimer({ config, sessionId, onPomodoroComplete, onSessionComplete, className }: PomodoroTimerProps) {
  const {
    timerState,
    timeRemaining,
    pomodorosCompleted,
    isBreak,
    isLongBreak,
    start,
    pause,
    resume,
    skipBreak,
    formatTime,
    progress,
  } = usePomodoroTimer({ config, sessionId, onPomodoroComplete, onSessionComplete })

  return (
    <div className={cn('rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-8', className)}>
      {/* Estado del timer */}
      <div className="text-center mb-6">
        {isBreak ? (
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {isLongBreak ? '☕ Descanso Largo' : '☕ Descanso Corto'}
          </div>
        ) : (
          <div className="text-sm font-medium text-green-600 dark:text-green-400">
            🎯 Sesión de Estudio
          </div>
        )}
      </div>

      {/* Display circular del tiempo */}
      <div className="relative w-64 h-64 mx-auto mb-8">
        {/* SVG Circle Progress */}
        <svg className="transform -rotate-90 w-64 h-64">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-neutral-200 dark:text-neutral-700"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
            className={isBreak ? 'text-blue-500' : 'text-green-500'}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        {/* Tiempo restante en el centro */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl font-bold text-neutral-900 dark:text-white">
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      {/* Contador de pomodoros */}
      <div className="text-center mb-6">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Pomodoros completados: <span className="font-bold">{pomodorosCompleted}</span>
        </div>
      </div>

      {/* Botones de control */}
      <div className="flex gap-3 justify-center">
        {timerState === 'not-started' && (
          <button
            onClick={start}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            ▶️ Iniciar
          </button>
        )}

        {timerState === 'running' && (
          <button
            onClick={pause}
            className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
          >
            ⏸️ Pausar
          </button>
        )}

        {timerState === 'paused' && (
          <button
            onClick={resume}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            ▶️ Reanudar
          </button>
        )}

        {isBreak && timerState !== 'running' && (
          <button
            onClick={skipBreak}
            className="px-6 py-3 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            ⏭️ Saltar Descanso
          </button>
        )}
      </div>
    </div>
  )
}
```

---

### 5. Componentes Auxiliares (MEDIA PRIORIDAD)

#### SessionHeader.tsx
**Estimado:** 100 líneas | 1 hora

```typescript
interface SessionHeaderProps {
  session: SessionData
  className?: string
}

// Muestra: título, curso, lección, badge de tipo, fecha/hora
```

#### SessionProgress.tsx
**Estimado:** 80 líneas | 1 hora

```typescript
interface SessionProgressProps {
  elapsedMinutes: number
  totalMinutes: number
  className?: string
}

// Barra de progreso horizontal con % completado
```

#### SessionNotes.tsx
**Estimado:** 120 líneas | 1.5 horas

```typescript
interface SessionNotesProps {
  notes: string
  onNotesChange: (notes: string) => void
  className?: string
}

// Textarea con auto-save cada 30s en localStorage
```

#### SessionEvaluation.tsx
**Estimado:** 100 líneas | 1.5 horas

```typescript
interface SessionEvaluationProps {
  evaluation: number | undefined
  onEvaluationChange: (rating: number) => void
  className?: string
}

// Rating 1-5 estrellas con hover effects
```

---

### 6. Modal de Completado (MEDIA PRIORIDAD)
**Archivo:** `apps/web/src/features/study-planner/components/SessionCompletionModal.tsx`
**Estimado:** 200 líneas | 2 horas

```typescript
interface SessionCompletionModalProps {
  isOpen: boolean
  sessionData: SessionData
  actualDurationMinutes: number
  currentNotes: string
  currentEvaluation: number | undefined
  onComplete: (data: SessionCompletionData) => Promise<void>
  onCancel: () => void
}

// Modal con resumen, notas finales, evaluación, botón guardar
```

---

### 7. Página Principal de Sesión (ALTA PRIORIDAD)
**Archivo:** `apps/web/src/app/study-planner/session/[sessionId]/page.tsx`
**Estimado:** 300-350 líneas | 4 horas

**Estructura:**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DEFAULT_POMODORO_CONFIG } from '@/features/study-planner/types/session-page.types'
import { PomodoroTimer } from '@/features/study-planner/components/PomodoroTimer'
// ... otros imports

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [evaluation, setEvaluation] = useState<number>()
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  // Cargar datos de sesión
  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(`/api/study-planner/sessions/${sessionId}`)
        if (!response.ok) throw new Error('Error al cargar sesión')
        const data = await response.json()
        setSessionData(data.session)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadSession()
  }, [sessionId])

  // Handler para completar sesión
  async function handleCompleteSession(data: SessionCompletionData) {
    try {
      const response = await fetch(`/api/study-planner/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Error al completar sesión')

      router.push('/study-planner/dashboard')
    } catch (error) {
      console.error(error)
    }
  }

  if (isLoading) return <LoadingState />
  if (error || !sessionData) return <ErrorState error={error} />

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Layout responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer en el centro (col-span-2 en lg) */}
        <div className="lg:col-span-2">
          <PomodoroTimer
            config={DEFAULT_POMODORO_CONFIG}
            sessionId={sessionId}
            onPomodoroComplete={(count) => console.log('Pomodoro', count)}
          />
        </div>

        {/* Sidebar con notas y evaluación */}
        <div className="space-y-6">
          {/* Info de sesión */}
          <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg">
            <h2>{sessionData.lesson_title}</h2>
            <p>{sessionData.course_title}</p>
          </div>

          {/* Botón completar */}
          <button
            onClick={() => setShowCompletionModal(true)}
            className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            ✅ Completar Sesión
          </button>
        </div>
      </div>

      {/* Modal de completado */}
      {showCompletionModal && (
        <SessionCompletionModal
          isOpen={showCompletionModal}
          sessionData={sessionData}
          actualDurationMinutes={Math.floor(timer.totalElapsedSeconds / 60)}
          currentNotes={notes}
          currentEvaluation={evaluation}
          onComplete={handleCompleteSession}
          onCancel={() => setShowCompletionModal(false)}
        />
      )}
    </div>
  )
}
```

---

### 8. Instalación de react-hot-toast
**Comando:**
```bash
npm install react-hot-toast --workspace=apps/web
```

**Integración en layout:**
```typescript
// apps/web/src/app/study-planner/layout.tsx
import { Toaster } from 'react-hot-toast'

export default function StudyPlannerLayout({ children }) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  )
}
```

---

### 9. Actualizar Barrel Exports
**Archivo:** `apps/web/src/features/study-planner/components/index.ts`

Agregar:
```typescript
// Phase 6 Components (Session Page)
export { PomodoroTimer } from './PomodoroTimer'
export { SessionHeader } from './SessionHeader'
export { SessionProgress } from './SessionProgress'
export { SessionNotes } from './SessionNotes'
export { SessionEvaluation } from './SessionEvaluation'
export { SessionCompletionModal } from './SessionCompletionModal'
```

---

## 📊 RESUMEN DE PROGRESO

| Componente | Estado | Líneas | Tiempo |
|------------|--------|--------|--------|
| Tipos TypeScript | ✅ Completado | 230 | 0.5h |
| API Endpoint GET | ✅ Completado | 135 | 1h |
| Hook usePomodoroTimer | ✅ Completado | 280 | 2h |
| PomodoroTimer | ⏸️ Pendiente | ~280 | 3h |
| SessionHeader | ⏸️ Pendiente | ~100 | 1h |
| SessionProgress | ⏸️ Pendiente | ~80 | 1h |
| SessionNotes | ⏸️ Pendiente | ~120 | 1.5h |
| SessionEvaluation | ⏸️ Pendiente | ~100 | 1.5h |
| SessionCompletionModal | ⏸️ Pendiente | ~200 | 2h |
| Session Page | ⏸️ Pendiente | ~320 | 4h |
| react-hot-toast | ⏸️ Pendiente | - | 0.5h |
| Barrel exports | ⏸️ Pendiente | - | 0.1h |
| **TOTAL** | **30%** | **~2,045** | **~18h** |

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

### Opción A: Implementación MVP (Recomendado)
1. Crear PomodoroTimer básico (sin animaciones fancy)
2. Crear Session Page simplificada
3. Instalar react-hot-toast
4. **Resultado:** Timer funcional que puedes probar
5. **Tiempo:** ~4-5 horas

### Opción B: Implementación Completa
1. Todos los componentes con animaciones
2. Todos los features completos
3. Testing exhaustivo
4. **Resultado:** Fase 6 100% completa
5. **Tiempo:** ~15-16 horas

---

## 🔧 COMANDOS ÚTILES

```bash
# Instalar dependencias
npm install react-hot-toast --workspace=apps/web

# Type check
npm run type-check

# Build
npm run build

# Dev server
npm run dev:web
```

---

**Última actualización:** 2025-01-18
**Creado por:** Claude Code
**Siguiente acción:** Decidir entre MVP o implementación completa
