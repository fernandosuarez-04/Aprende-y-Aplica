# NotesModal - Componente de Notas

Este directorio contiene dos versiones del componente de notas:

## 📁 Archivos

- **`NotesModal.tsx`** - Versión con exportación nativa (sin dependencias externas)
- **`NotesModalWithLibraries.tsx`** - Versión con librerías jsPDF y html2canvas
- **`index.ts`** - Exporta la versión por defecto

## 🚀 Uso

### Versión Nativa (Recomendada)
```tsx
import { NotesModal } from '@/core/components/NotesModal';

// Usar directamente - no requiere instalación adicional
<NotesModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSave={handleSave}
  initialNote={editingNote}
  isEditing={!!editingNote}
/>
```

### Versión con Librerías
```tsx
import { NotesModalWithLibraries } from '@/core/components/NotesModal/NotesModalWithLibraries';

// Requiere instalar las librerías primero
<NotesModalWithLibraries
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSave={handleSave}
  initialNote={editingNote}
  isEditing={!!editingNote}
/>
```

## 📦 Instalación de Librerías

Para usar la versión con librerías, ejecuta:

```bash
# Desde el directorio apps/web
node install-pdf-libraries.js
```

O manualmente:

```bash
npm install jspdf@latest html2canvas@latest
npm install --save-dev @types/jspdf
```

## ✨ Características

### Ambas versiones incluyen:
- ✅ Editor de texto enriquecido (negrita, cursiva, subrayado)
- ✅ Encabezados H1, H2, H3
- ✅ Listas ordenadas y no ordenadas
- ✅ Alineación de texto
- ✅ Enlaces
- ✅ Deshacer/Rehacer
- ✅ Etiquetas
- ✅ Atajos de teclado (Ctrl+S, Ctrl+Z, Ctrl+Y, etc.)

### Versión Nativa:
- ✅ **Sin dependencias externas**
- ✅ **Compatible con todos los navegadores**
- ✅ **Más rápida** (no carga librerías pesadas)
- ✅ **Exportación a PDF** usando `window.print()`
- ✅ **Funciona offline**

### Versión con Librerías:
- ✅ **PDF de alta calidad** con jsPDF
- ✅ **Renderizado preciso** con html2canvas
- ✅ **Control total del formato**
- ✅ **Múltiples páginas automáticas**
- ✅ **Descarga directa del archivo**

## 🔧 Configuración

### Next.js Config
El archivo `next.config.ts` ya está configurado para soportar las librerías:

```typescript
webpack: (config, { isServer }) => {
  // ... otras configuraciones
  
  // Configuración para librerías que solo funcionan en el cliente
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
  }
  
  return config;
}
```

## 🐛 Solución de Problemas

### Error "Cannot find module 'jspdf'"
1. Verifica que las librerías estén instaladas:
   ```bash
   npm list jspdf html2canvas
   ```

2. Si no están instaladas, ejecuta:
   ```bash
   node install-pdf-libraries.js
   ```

3. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### Error de importación dinámica
- Asegúrate de que el componente esté marcado con `'use client'`
- Verifica que estés usando la versión correcta del componente

### Problemas con la exportación nativa
- Verifica que los pop-ups estén habilitados en el navegador
- Algunos navegadores pueden bloquear la ventana de impresión

## 📝 Notas de Desarrollo

- La versión nativa es la **recomendada** para la mayoría de casos de uso
- La versión con librerías es mejor si necesitas control total sobre el formato del PDF
- Ambas versiones mantienen la misma API, por lo que es fácil cambiar entre ellas
- El componente está optimizado para Next.js 14+ con App Router

## 🔄 Migración

Para cambiar de la versión nativa a la versión con librerías:

1. Instala las librerías:
   ```bash
   node install-pdf-libraries.js
   ```

2. Cambia la importación:
   ```tsx
   // Antes
   import { NotesModal } from '@/core/components/NotesModal';
   
   // Después
   import { NotesModalWithLibraries as NotesModal } from '@/core/components/NotesModal/NotesModalWithLibraries';
   ```

3. Actualiza el archivo `index.ts` si quieres cambiar la versión por defecto.
