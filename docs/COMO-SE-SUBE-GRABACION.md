# 🎬 Cómo se Sube la Grabación - Guía Rápida

## 📍 Flujo Completo

```
┌──────────────────────────────────────────────────────┐
│ 1. USUARIO ABRE EL MODAL DE REPORTE                 │
│    Click en botón "Reportar Problema" 🐛             │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 2. rrweb COMIENZA A GRABAR AUTOMÁTICAMENTE          │
│    - Graba clicks, scrolls, inputs                   │
│    - Almacena en memoria del navegador               │
│    - Límite: 60 segundos o 500 eventos              │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 3. USUARIO LLENA EL FORMULARIO                      │
│    - Título, descripción, categoría                  │
│    - (Opcional) Sube screenshot                      │
│    - Mientras tanto, rrweb sigue grabando            │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 4. USUARIO HACE CLICK EN "ENVIAR REPORTE"          │
│    - rrweb DETIENE la grabación                      │
│    - Convierte eventos a JSON                        │
│    - Convierte JSON a base64 (para enviar)          │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 5. SE ENVÍA TODO JUNTO EN 1 REQUEST                 │
│    POST /api/reportes                                │
│    {                                                 │
│      titulo: "...",                                  │
│      descripcion: "...",                             │
│      screenshot_data: "data:image/jpeg;base64,...", │
│      session_recording: "eyJldmVudHM6Li4u...",  ←── │
│      recording_size: "456 KB",                  ←── │
│      recording_duration: 45000                  ←── │
│    }                                                 │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ 6. API GUARDA TODO EN LA BASE DE DATOS              │
│    reportes_problemas                                │
│    - screenshot_url (Supabase Storage)               │
│    - session_recording (Texto en BD)                 │
│    - recording_size (Texto: "456 KB")               │
│    - recording_duration (Número: 45000)             │
└──────────────────────────────────────────────────────┘
```

## 🔑 Puntos Clave

### ¿Dónde se almacena la grabación?

**Durante la grabación:**
- 📦 En memoria RAM del navegador (array de eventos)
- ⚡ No se sube nada hasta hacer click en "Enviar"

**Después de enviar:**
- 💾 En la base de datos como **TEXT** (no en Storage)
- 📊 Formato: JSON comprimido a base64
- 📏 Tamaño típico: 200-500 KB (60 segundos de navegación)

### ¿Por qué NO usar Supabase Storage para la grabación?

1. **Es texto, no archivo:** La grabación es JSON, no una imagen
2. **Más rápido:** Guardar en la tabla es más simple
3. **Menos peticiones:** 1 solo INSERT en lugar de 2 (upload + insert)
4. **Tamaño pequeño:** 200-500 KB es manejable como TEXT en PostgreSQL

### Screenshot vs Grabación

| Concepto | Screenshot | Grabación rrweb |
|----------|-----------|-----------------|
| **Formato** | Imagen JPG/PNG | JSON (eventos) |
| **Almacén** | Supabase Storage | Columna TEXT en BD |
| **Tamaño** | 50-200 KB | 200-500 KB |
| **Conversión** | base64 → Buffer → Upload | JSON → base64 → String |

## 🛠️ Implementación en 3 Pasos

### Paso 1: Agregar el Hook al Componente

```tsx
// En ReporteProblema.tsx, línea ~47

import { useSessionRecorder } from '@/lib/rrweb/use-session-recorder';

export function ReporteProblema({ isOpen, onClose, ... }: Props) {
  // ... estados existentes ...

  // 👇 NUEVO: Hook de grabación
  const {
    isRecording,
    recordingSize,
    startRecording,
    stopRecording,
    exportSessionBase64,
  } = useSessionRecorder({ autoStart: false });

  // 👇 NUEVO: Iniciar grabación al abrir modal
  useEffect(() => {
    if (isOpen && !isRecording) {
      console.log('🎬 Iniciando grabación automática...');
      startRecording();
    }
    return () => {
      if (isRecording) {
        console.log('🛑 Deteniendo grabación al cerrar modal');
        stopRecording();
      }
    };
  }, [isOpen]);
```

### Paso 2: Agregar al Envío del Formulario

```tsx
// En handleSubmit, línea ~129

const handleSubmit = async () => {
  // ... código existente ...

  // 👇 NUEVO: Detener grabación y obtener datos
  const session = stopRecording();
  const sessionData = exportSessionBase64();
  const recordingDuration = session 
    ? session.endTime - session.startTime 
    : 0;

  const reportData = {
    titulo: titulo.trim(),
    descripcion: descripcion.trim(),
    // ... otros campos existentes ...
    screenshot_data: screenshot,
    // 👇 NUEVO: Agregar grabación
    session_recording: sessionData,
    recording_size: recordingSize,
    recording_duration: recordingDuration,
    from_lia: fromLia
  };

  const response = await fetch('/api/reportes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData),
  });
};
```

### Paso 3: Agregar Indicador Visual (Opcional)

```tsx
// En el JSX del modal, después del título

{isRecording && (
  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
    <span className="text-sm text-red-700">
      🎬 Grabando sesión ({recordingSize})
    </span>
  </div>
)}
```

## 📊 Ejemplo de Datos Enviados

### Request a /api/reportes

```json
{
  "titulo": "Error al guardar perfil",
  "descripcion": "Cuando intento guardar...",
  "categoria": "bug",
  "prioridad": "alta",
  "screenshot_data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "session_recording": "eyJldmVudHMiOlt7InR5cGUiOjQsImRhdGEiOnsiaHJlZiI6Imh...",
  "recording_size": "456 KB",
  "recording_duration": 45000
}
```

### Guardado en Base de Datos

```sql
INSERT INTO reportes_problemas (
  user_id,
  titulo,
  descripcion,
  screenshot_url,           -- URL de Storage
  session_recording,        -- JSON en base64
  recording_size,           -- "456 KB"
  recording_duration        -- 45000
) VALUES (...);
```

## 🎯 Resumen

1. **No necesitas subir nada manualmente**
2. **Todo es automático** cuando el usuario envía el reporte
3. **La grabación se guarda como texto** en la base de datos
4. **El screenshot sí se sube** a Supabase Storage (ya funciona)
5. **La API ya está lista** para recibir los 3 campos nuevos

## ✅ Estado Actual

- ✅ Dependencias instaladas (`npm install rrweb...`)
- ✅ API actualizada (recibe y guarda grabación)
- ⏳ Falta: Agregar hook en ReporteProblema.tsx
- ⏳ Falta: Ejecutar SQL para agregar columnas en BD

## 🚀 Próximo Paso

¿Quieres que integre el hook directamente en tu `ReporteProblema.tsx` existente? Solo necesito agregar ~20 líneas de código y ya funcionaría completo. 🎬
