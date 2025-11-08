# 🎬 Cómo Ver las Grabaciones - Guía Completa

## 🤔 ¿Qué se Guarda?

Cuando un usuario reporta un problema, se guarda una **cadena de texto** que contiene:

```
session_recording: "eyJldmVudHMiOlt7InR5cGUiOjQsImRhdGEi..."
```

Esto es **JSON comprimido en base64** que contiene todos los eventos de rrweb.

## 🔄 De Texto a Video

### Paso 1: Decodificar Base64 → JSON

```typescript
// La cadena guardada en la BD
const sessionData = reporte.session_recording;

// Decodificar de base64 a JSON
const jsonString = atob(sessionData);

// Parsear JSON a objeto
const session = JSON.parse(jsonString);
```

### Paso 2: Objeto → Reproductor

```typescript
import { SessionPlayer } from '@/core/components/SessionPlayer/SessionPlayer';

<SessionPlayer
  session={session}  // El objeto parseado
  width="100%"
  height="600px"
  autoPlay={true}
  showController={true}
/>
```

## 🎯 Ejemplo Completo

### En tu Panel de Admin:

```tsx
'use client';

import { SessionPlayer } from '@/core/components/SessionPlayer/SessionPlayer';
import { useState, useEffect } from 'react';

export default function ReporteDetail({ params }: { params: { id: string } }) {
  const [reporte, setReporte] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 1. Obtener reporte de la API
    fetch(`/api/reportes/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setReporte(data);
        
        // 2. Si tiene grabación, decodificarla
        if (data.session_recording) {
          try {
            const jsonString = atob(data.session_recording);
            const parsedSession = JSON.parse(jsonString);
            setSession(parsedSession);
          } catch (error) {
            console.error('Error al decodificar sesión:', error);
          }
        }
      });
  }, [params.id]);

  if (!reporte) return <div>Cargando...</div>;

  return (
    <div className="p-6">
      <h1>{reporte.titulo}</h1>
      <p>{reporte.descripcion}</p>

      {/* Screenshot (si existe) */}
      {reporte.screenshot_url && (
        <div className="mb-6">
          <h2>📸 Captura de Pantalla</h2>
          <img src={reporte.screenshot_url} alt="Screenshot" />
        </div>
      )}

      {/* Reproducción de Sesión (si existe) */}
      {session && (
        <div>
          <h2>🎬 Reproducción de Sesión</h2>
          <SessionPlayer
            session={session}
            width="100%"
            height="600px"
            autoPlay={false}
            showController={true}
            skipInactive={true}
          />
        </div>
      )}
    </div>
  );
}
```

## 🎮 Controles del Reproductor

El SessionPlayer incluye controles como un video:

- ▶️ **Play/Pause**
- ⏩ **Velocidad** (0.5x, 1x, 2x, 4x)
- ⏱️ **Timeline** para saltar a cualquier momento
- 🔇 **Skip Inactive** (salta momentos sin actividad)

## 🔍 Qué Verás en el Reproductor

Cuando reproduces una sesión, verás:

1. **Reconstrucción del DOM** - La página como se veía
2. **Movimientos del mouse** - Dónde movió el cursor
3. **Clicks** - Dónde hizo click
4. **Scrolling** - Cómo navegó por la página
5. **Inputs** - Qué escribió en formularios (enmascarado si configuraste privacidad)
6. **Navegación** - Cambios de página/URL

## 📊 Ejemplo de Datos Guardados

### En la Base de Datos:

```sql
SELECT 
    id,
    titulo,
    session_recording,    -- Texto largo en base64
    recording_size,       -- "456 KB"
    recording_duration    -- 45000 (ms)
FROM reportes_problemas
WHERE session_recording IS NOT NULL;
```

### Resultado:

```
id: "123e4567-e89b..."
titulo: "Error al guardar perfil"
session_recording: "eyJldmVudHMiOlt7InR5cGU..." (muy largo)
recording_size: "456 KB"
recording_duration: 45000
```

## 🚀 Cómo Implementarlo

### Opción 1: Ruta del Admin Simple

Crea: `apps/web/src/app/admin/reportes/[id]/page.tsx`

```tsx
import { SessionPlayer } from '@/core/components/SessionPlayer/SessionPlayer';

export default async function ReportePage({ params }: { params: { id: string } }) {
  // Fetch del reporte
  const reporte = await fetchReporte(params.id);
  
  // Parsear sesión
  const session = reporte.session_recording 
    ? JSON.parse(atob(reporte.session_recording))
    : null;

  return (
    <div>
      <h1>{reporte.titulo}</h1>
      
      {session && (
        <SessionPlayer session={session} />
      )}
    </div>
  );
}
```

### Opción 2: Botón en Tabla de Reportes

```tsx
<table>
  <tbody>
    {reportes.map(reporte => (
      <tr key={reporte.id}>
        <td>{reporte.titulo}</td>
        <td>{reporte.categoria}</td>
        <td>
          {reporte.session_recording && (
            <button onClick={() => verGrabacion(reporte)}>
              🎬 Ver Video
            </button>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

## ⚡ Optimización

### Si el JSON es muy grande:

1. **Comprimir con gzip:**
```typescript
import pako from 'pako';

// Al guardar
const compressed = pako.deflate(JSON.stringify(session));
const base64 = btoa(String.fromCharCode(...compressed));

// Al leer
const compressed = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
const json = pako.inflate(compressed, { to: 'string' });
const session = JSON.parse(json);
```

2. **Almacenar en Storage en lugar de BD:**
```typescript
// Subir a Supabase Storage
const { data } = await supabase.storage
  .from('session-recordings')
  .upload(`${reporteId}.json`, JSON.stringify(session));

// Guardar solo la URL en la BD
session_recording_url: data.path
```

## 🎯 Resumen

| Paso | Acción | Resultado |
|------|--------|-----------|
| 1. Usuario reporta | rrweb graba eventos | Array de eventos |
| 2. Se envía | JSON → base64 | String largo |
| 3. Se guarda | En columna TEXT | `session_recording` |
| 4. Admin ve | base64 → JSON | Objeto session |
| 5. Reproductor | Objeto → rrweb player | "Video" interactivo |

**No es un video MP4**, es una **reconstrucción del DOM** que se reproduce como video. ¡Mucho más ligero y detallado! 🎬
