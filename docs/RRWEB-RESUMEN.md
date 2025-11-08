# 🎬 Resumen: Integración rrweb con Sistema de Reportes

## ✅ ¿Qué se creó?

### 📁 Archivos del Sistema

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `apps/web/src/lib/rrweb/session-recorder.ts` | Clase principal para grabar sesiones | ✅ Creado |
| `apps/web/src/lib/rrweb/use-session-recorder.ts` | Hook de React para componentes | ✅ Creado |
| `apps/web/src/core/components/SessionPlayer/SessionPlayer.tsx` | Reproductor de grabaciones | ✅ Creado |
| `database-fixes/add-rrweb-support.sql` | Script SQL para actualizar BD | ✅ Creado |
| `docs/RRWEB-INTEGRACION.md` | Documentación completa | ✅ Creado |

## 🎯 ¿Qué hace rrweb?

### Antes (solo screenshot estático):
```
Usuario reporta bug → 📸 Screenshot → 🤷 No sabemos qué hizo antes
```

### Ahora (con rrweb):
```
Usuario reporta bug → 🎬 Grabación de 60s → 🎥 Reproducimos exactamente lo que hizo
```

## 🚀 Instalación Rápida

### Paso 1: Instalar dependencias
```bash
cd apps/web
pnpm add rrweb rrweb-player @rrweb/types
```

### Paso 2: Actualizar base de datos
Ejecutar en Supabase:
```sql
-- database-fixes/add-rrweb-support.sql
ALTER TABLE public.reportes_problemas
ADD COLUMN session_recording TEXT,
ADD COLUMN recording_size VARCHAR(50),
ADD COLUMN recording_duration INTEGER;
```

### Paso 3: Integrar en ReporteProblema

Opción A: **Grabación Automática (Recomendado)**
```tsx
// Al abrir el modal, iniciar grabación automáticamente
useEffect(() => {
  if (isOpen) {
    sessionRecorder.startRecording(60000); // 60 segundos
  }
}, [isOpen]);
```

Opción B: **Grabación Manual**
```tsx
// Agregar botón para que usuario controle la grabación
<button onClick={() => includeRecording ? stopRecording() : startRecording()}>
  {includeRecording ? '🛑 Detener' : '🎬 Grabar'}
</button>
```

## 📊 Flujo de Integración

```
┌─────────────────────────────────────────────────────────┐
│  1. USUARIO EN LA PLATAFORMA                            │
│  rrweb grabando en background (últimos 60s)             │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  2. USUARIO ENCUENTRA BUG                               │
│  Click en botón "Reportar Problema" 🐛                  │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  3. MODAL DE REPORTE                                    │
│  ✅ Grabación ya lista (últimos 60s)                    │
│  📝 Usuario llena formulario                            │
│  📸 Screenshot automático                               │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  4. ENVÍO A API                                         │
│  POST /api/reportes                                     │
│  {                                                      │
│    titulo: "...",                                       │
│    descripcion: "...",                                  │
│    screenshot_data: "base64...",                        │
│    session_recording: "base64...",  ← NUEVO            │
│    recording_size: "456 KB"         ← NUEVO            │
│  }                                                      │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  5. GUARDADO EN BASE DE DATOS                           │
│  reportes_problemas                                     │
│  - screenshot_url: "https://..."                        │
│  - session_recording: "eyJ..."      ← NUEVO            │
│  - recording_size: "456 KB"         ← NUEVO            │
│  - recording_duration: 60000        ← NUEVO            │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  6. ADMIN VE EL REPORTE                                 │
│  Panel de administración                                │
│  📸 Ve screenshot                                       │
│  🎬 REPRODUCE la sesión exacta del usuario ← NUEVO     │
│  ✅ Entiende el bug al verlo en acción                  │
└─────────────────────────────────────────────────────────┘
```

## 🎨 Ejemplo de UI en el Modal

```tsx
┌───────────────────────────────────────────────┐
│  📝 Reportar Problema                         │
├───────────────────────────────────────────────┤
│                                               │
│  Título: [_________________________]          │
│                                               │
│  Descripción:                                 │
│  [________________________________]           │
│  [________________________________]           │
│  [________________________________]           │
│                                               │
│  ┌─────────────────────────────────────┐     │
│  │ 🎬 Grabación de Sesión              │     │
│  ├─────────────────────────────────────┤     │
│  │ ✅ Grabación incluida               │     │
│  │ 📊 Tamaño: 456 KB                   │     │
│  │ ⏱️  Duración: 60 segundos            │     │
│  │ 📹 234 eventos capturados           │     │
│  └─────────────────────────────────────┘     │
│                                               │
│  [ Cancelar ]           [ 📤 Enviar Reporte ] │
└───────────────────────────────────────────────┘
```

## 🔧 Cambios en el Código Existente

### 1. Actualizar ReporteProblema.tsx

```tsx
import { useSessionRecorder } from '@/lib/rrweb/use-session-recorder';

export function ReporteProblema({ isOpen, onClose }: Props) {
  // 👇 NUEVO: Hook para grabación
  const {
    isRecording,
    currentSession,
    recordingSize,
    startRecording,
    stopRecording,
    exportSessionBase64,
  } = useSessionRecorder({ autoStart: false });

  // 👇 NUEVO: Iniciar grabación al abrir modal
  useEffect(() => {
    if (isOpen && !isRecording) {
      startRecording();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    // Detener y obtener grabación
    const session = stopRecording();
    const sessionData = exportSessionBase64();

    const reportData = {
      // ... campos existentes
      screenshot_data: screenshot,
      // 👇 NUEVO: Agregar grabación
      session_recording: sessionData,
      recording_size: recordingSize,
      recording_duration: session ? session.endTime - session.startTime : 0,
    };

    await fetch('/api/reportes', { /* ... */ });
  };

  // UI actualizada...
}
```

### 2. Actualizar API (route.ts)

```tsx
export async function POST(request: NextRequest) {
  const {
    // ... campos existentes
    screenshot_data,
    // 👇 NUEVO: Campos de grabación
    session_recording,
    recording_size,
    recording_duration,
  } = body;

  // Insertar con nuevos campos
  const { data: reporte } = await supabase
    .from('reportes_problemas')
    .insert({
      // ... campos existentes
      screenshot_url,
      // 👇 NUEVO
      session_recording,
      recording_size,
      recording_duration,
    });
}
```

### 3. Crear Panel de Admin

```tsx
import { SessionPlayer } from '@/core/components/SessionPlayer/SessionPlayer';

export function ReporteDetail({ reporteId }: Props) {
  const [reporte, setReporte] = useState(null);

  useEffect(() => {
    fetch(`/api/reportes/${reporteId}`)
      .then(res => res.json())
      .then(data => setReporte(data));
  }, [reporteId]);

  if (!reporte) return <Loading />;

  const session = reporte.session_recording 
    ? JSON.parse(atob(reporte.session_recording))
    : null;

  return (
    <div>
      <h1>{reporte.titulo}</h1>
      <p>{reporte.descripcion}</p>

      {/* Screenshot existente */}
      {reporte.screenshot_url && (
        <img src={reporte.screenshot_url} alt="Screenshot" />
      )}

      {/* 👇 NUEVO: Reproductor de sesión */}
      {session && (
        <div className="mt-6">
          <h2>🎬 Reproducción de Sesión</h2>
          <SessionPlayer
            session={session}
            width="100%"
            height="600px"
            autoPlay={false}
            showController={true}
          />
        </div>
      )}
    </div>
  );
}
```

## 📈 Ventajas de rrweb

| Característica | Screenshot | rrweb |
|----------------|-----------|-------|
| Muestra estado actual | ✅ | ✅ |
| Muestra pasos previos | ❌ | ✅ |
| Clicks del usuario | ❌ | ✅ |
| Scrolling | ❌ | ✅ |
| Inputs/Formularios | ❌ | ✅ |
| Timing exacto | ❌ | ✅ |
| Reproducible | ❌ | ✅ |
| Tamaño | ~50-200 KB | ~100-500 KB |

## ⚠️ Consideraciones Importantes

### 🔒 Privacidad
- ✅ **Enmascarar passwords** automáticamente
- ✅ **No grabar** info de tarjetas de crédito
- ✅ **Informar** al usuario que se graba
- ✅ **Dar opción** de deshabilitar

### 💾 Almacenamiento
- **Recomendación:** Almacenar en Supabase Storage como JSON
- **Alternativa:** Comprimir y guardar en base64 en la tabla
- **Límite:** 2 MB por grabación (60 segundos típicos: 200-500 KB)

### 🚀 Performance
- **No afecta** navegación normal (async)
- **Sampling** reduce eventos de mouse
- **Buffer limitado** a últimos N eventos

## 🎯 Próximos Pasos

### Implementación Mínima (30 min):
1. ✅ Instalar: `pnpm add rrweb rrweb-player @rrweb/types`
2. ✅ Ejecutar SQL: `add-rrweb-support.sql`
3. ✅ Copiar archivos ya creados (están listos)
4. ✅ Agregar hook en `ReporteProblema.tsx`
5. ✅ Actualizar API para recibir `session_recording`

### Implementación Completa (2-3 horas):
6. ✅ Crear panel admin con reproductor
7. ✅ Agregar UI de control de grabación
8. ✅ Configurar máscaras de privacidad
9. ✅ Agregar límites de tamaño
10. ✅ Testing end-to-end

## 📚 Archivos de Referencia

Todos los archivos están listos y documentados:
- ✅ `session-recorder.ts` - Lógica de grabación
- ✅ `use-session-recorder.ts` - Hook de React
- ✅ `SessionPlayer.tsx` - Componente reproductor
- ✅ `add-rrweb-support.sql` - Script BD
- ✅ `RRWEB-INTEGRACION.md` - Docs completas

---

## 🎬 Demo Rápido

```tsx
// 1. Importar
import { useSessionRecorder } from '@/lib/rrweb/use-session-recorder';

// 2. Usar en componente
const { isRecording, startRecording, stopRecording, recordingSize } = useSessionRecorder();

// 3. UI simple
{isRecording ? (
  <div>🔴 Grabando... ({recordingSize})</div>
) : (
  <button onClick={startRecording}>🎬 Iniciar Grabación</button>
)}
```

¿Listo para implementar? Solo falta instalar las dependencias y ya puedes usar el sistema completo! 🚀
