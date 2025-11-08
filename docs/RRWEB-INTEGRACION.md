# 🎬 Integración rrweb - Sistema de Reportes

## 📋 ¿Qué es esto?

Sistema de grabación y reproducción de sesiones de usuario usando **rrweb** (record and replay the web). Permite grabar las acciones del usuario antes de un bug para facilitar su reproducción y debugging.

## 🎯 Casos de Uso

### 1. **Grabación Continua en Background**
Graba los últimos 60 segundos de actividad del usuario. Cuando reporta un problema, se envía automáticamente esa grabación.

### 2. **Grabación Manual al Reportar**
Usuario inicia grabación, reproduce el bug, y envía la grabación con el reporte.

### 3. **Grabación Automática de Errores**
Detecta errores de JavaScript y graba automáticamente los 10 segundos antes y después.

## 📦 Instalación

```bash
# Instalar dependencias
npm install rrweb rrweb-player @rrweb/types

# O con pnpm (recomendado para este proyecto)
pnpm add rrweb rrweb-player @rrweb/types
```

## 🏗️ Archivos Creados

```
apps/web/src/
├── lib/rrweb/
│   ├── session-recorder.ts          # Clase principal para grabar sesiones
│   └── use-session-recorder.ts      # Hook de React para usar en componentes
└── core/components/
    └── SessionPlayer/
        └── SessionPlayer.tsx         # Componente para reproducir grabaciones
```

## 🚀 Uso Básico

### Opción 1: Grabación Automática Global

Agrega esto en tu `RootLayout` o `_app.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { useSessionRecorder } from '@/lib/rrweb/use-session-recorder';

export function SessionRecorderProvider({ children }: { children: React.ReactNode }) {
  const { startRecording } = useSessionRecorder({
    autoStart: true,           // Inicia automáticamente
    maxDuration: 60000,        // 60 segundos
    enableOnProduction: true,  // Habilitar en producción
  });

  return <>{children}</>;
}
```

### Opción 2: Grabación Manual en Reporte

Integra en el componente `ReporteProblema.tsx`:

```tsx
import { useSessionRecorder } from '@/lib/rrweb/use-session-recorder';

export function ReporteProblema({ isOpen, onClose }: Props) {
  const {
    isRecording,
    startRecording,
    stopRecording,
    exportSessionBase64,
    recordingSize,
  } = useSessionRecorder();

  const handleSubmit = async () => {
    // Detener grabación y obtener datos
    const session = stopRecording();
    const sessionData = exportSessionBase64();

    const reportData = {
      // ... otros campos
      session_recording: sessionData,  // Agregar grabación
      recording_size: recordingSize,
    };

    await fetch('/api/reportes', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  };

  return (
    <div>
      {/* UI del formulario */}
      
      {/* Botón para iniciar/detener grabación */}
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? '🛑 Detener Grabación' : '🎬 Iniciar Grabación'}
      </button>
      
      {isRecording && (
        <div className="text-sm text-gray-600">
          🔴 Grabando... ({recordingSize})
        </div>
      )}
    </div>
  );
}
```

### Opción 3: Reproducir Grabación

En el panel de administrador para ver reportes:

```tsx
import { SessionPlayer } from '@/core/components/SessionPlayer/SessionPlayer';

export function ReporteDetail({ reporte }: Props) {
  const session = JSON.parse(atob(reporte.session_recording));

  return (
    <div>
      <h2>Reproducción del Bug</h2>
      <SessionPlayer
        session={session}
        width="100%"
        height="600px"
        autoPlay={false}
        showController={true}
        skipInactive={true}
      />
    </div>
  );
}
```

## 🗄️ Cambios en la Base de Datos

Agrega una columna para almacenar las grabaciones:

```sql
-- Agregar columna para session recording
ALTER TABLE public.reportes_problemas
ADD COLUMN session_recording TEXT,
ADD COLUMN recording_size VARCHAR(50);

-- Comentario
COMMENT ON COLUMN public.reportes_problemas.session_recording 
IS 'Grabación de sesión en formato base64 (rrweb)';
```

## 🎨 UI Mejorada para Reportes

### En el Modal de Reporte

```tsx
{/* Toggle para incluir grabación */}
<div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
  <div>
    <p className="font-medium text-blue-900">
      📹 Incluir grabación de sesión
    </p>
    <p className="text-sm text-blue-700">
      Ayuda a los desarrolladores a entender mejor el problema
    </p>
  </div>
  <button
    onClick={() => setIncludeRecording(!includeRecording)}
    className={`w-12 h-6 rounded-full transition-colors ${
      includeRecording ? 'bg-blue-600' : 'bg-gray-300'
    }`}
  >
    <div
      className={`w-5 h-5 bg-white rounded-full transition-transform ${
        includeRecording ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
</div>

{/* Mostrar estado de grabación */}
{includeRecording && isRecording && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200"
  >
    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
    <span className="text-sm text-red-700">
      Grabando sesión ({recordingSize})
    </span>
  </motion.div>
)}
```

## ⚙️ Configuración Avanzada

### Limitar Tamaño de Grabación

```typescript
// En session-recorder.ts, ajusta estos parámetros:
private maxEvents = 500;        // Máximo de eventos
private maxDuration = 60000;    // 60 segundos
```

### Optimizar para Producción

```typescript
// Configuración optimizada
sampling: {
  mousemove: true,
  scroll: 150,              // Reducir frecuencia de scroll
  input: 'last',            // Solo último valor
},
recordCanvas: false,        // No grabar canvas (pesado)
collectFonts: false,        // No recolectar fuentes
```

### Limitar Tamaño de Upload

```typescript
// Antes de enviar, verifica tamaño
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

if (session && getSessionSize(session) > MAX_SIZE) {
  console.warn('Grabación muy grande, no se enviará');
  sessionData = null;
}
```

## 📊 Métricas y Limitaciones

### Tamaños Típicos
- **30 segundos navegación simple:** ~50-100 KB
- **60 segundos navegación activa:** ~200-500 KB
- **60 segundos con inputs/scrolls:** ~500 KB - 1 MB
- **Canvas/video pesados:** 2-5 MB

### Límites Recomendados
- **Duración máxima:** 60 segundos
- **Tamaño máximo:** 2 MB
- **Eventos máximos:** 500-1000

## 🎭 Estados de UI

### Mientras Graba
```tsx
<div className="flex items-center gap-2">
  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
  <span>Grabando... (234 KB)</span>
</div>
```

### Grabación Lista
```tsx
<div className="flex items-center gap-2 text-green-600">
  <CheckCircle className="w-4 h-4" />
  <span>Grabación lista (456 KB)</span>
</div>
```

## 🚨 Consideraciones de Privacidad

### ⚠️ Datos Sensibles

rrweb **NO filtra automáticamente** datos sensibles. Debes:

1. **Bloquear inputs sensibles:**
```tsx
<input
  type="password"
  data-rr-is-ignored  // rrweb ignorará este campo
/>
```

2. **Bloquear secciones completas:**
```tsx
<div data-rr-is-ignored>
  {/* Todo aquí será ignorado */}
  <CreditCardForm />
</div>
```

3. **Configurar en session-recorder.ts:**
```typescript
record({
  // ... otras opciones
  blockClass: 'rr-block',           // Bloquear por clase CSS
  ignoreClass: 'rr-ignore',         // Ignorar por clase CSS
  maskTextClass: 'rr-mask',         // Enmascarar texto
  maskAllInputs: true,              // Enmascarar TODOS los inputs
  maskInputOptions: {
    color: true,
    date: true,
    email: true,
    password: true,
    search: true,
    tel: true,
    text: false,                    // No enmascarar texto simple
  },
});
```

### 📋 Buenas Prácticas

1. ✅ **Informar al usuario** que se grabará su sesión
2. ✅ **Dar opción de deshabilitar** la grabación
3. ✅ **No grabar** información de pago o passwords
4. ✅ **Limitar retención** de grabaciones (7-30 días)
5. ✅ **Encriptar** grabaciones en tránsito y reposo

## 🔧 Troubleshooting

### Error: "Cannot find module 'rrweb'"
```bash
pnpm add rrweb rrweb-player @rrweb/types
```

### Grabación muy grande
- Reduce `maxDuration` a 30 segundos
- Aumenta `sampling.scroll` a 300ms
- Deshabilita `recordCanvas`

### Player no se muestra
- Verifica que importaste el CSS: `import 'rrweb-player/dist/style.css'`
- Asegúrate que `session.events` no esté vacío

## 📚 Recursos

- [rrweb Docs](https://github.com/rrweb-io/rrweb)
- [rrweb Player](https://github.com/rrweb-io/rrweb/tree/master/packages/rrweb-player)
- [rrweb Guide](https://github.com/rrweb-io/rrweb/blob/master/guide.md)

## 🎯 Próximos Pasos

1. **Instalar dependencias:** `pnpm add rrweb rrweb-player @rrweb/types`
2. **Actualizar BD:** Ejecutar SQL para agregar columnas
3. **Integrar en ReporteProblema:** Agregar UI de grabación
4. **Actualizar API:** Modificar `/api/reportes` para guardar grabación
5. **Crear vista admin:** Panel para ver reportes con reproducción
6. **Configurar privacidad:** Enmascarar datos sensibles
