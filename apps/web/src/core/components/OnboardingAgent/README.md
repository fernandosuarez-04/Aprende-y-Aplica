# 🤖 Onboarding Agent - Asistente Estilo JARVIS

## 📋 Descripción

El **OnboardingAgent** es un componente de bienvenida inmersivo que aparece la primera vez que un usuario accede a la plataforma. Inspirado en JARVIS de Iron Man, presenta una esfera animada en 3D con síntesis de voz que guía al usuario a través de las principales características de la plataforma.

## ✨ Características Principales

### 🎨 Visuales Impresionantes
- **Esfera 3D animada** con múltiples anillos orbitales
- **Partículas flotantes** alrededor de la esfera
- **Gradientes dinámicos** con colores azul, púrpura y cyan
- **Animaciones sincronizadas** con la síntesis de voz
- **Efectos de pulso** cuando el asistente está hablando
- **Avatar de LIA** en el centro de la esfera

### 🔊 Síntesis de Voz
- **Narración profesional** usando ElevenLabs API
- **Voz en español** de alta calidad
- **Control de audio** con botón de mute/unmute
- **Indicador visual** cuando está hablando
- **Respeto a políticas de autoplay** del navegador

### 💬 Conversación por Voz (NUEVO)
- **Reconocimiento de voz** usando Web Speech API
- **Chat inteligente** con LIA antes de entrar a la plataforma
- **Respuestas contextuales** sobre el onboarding y la plataforma
- **Historial de conversación** visible en tiempo real
- **Respuestas por voz** usando ElevenLabs
- **Interfaz intuitiva** con botón de micrófono animado

### 📱 Experiencia Interactiva
- **6 pasos de onboarding** con información clave
- **Paso 5: Conversación interactiva** donde puedes hacer preguntas
- **Navegación fluida** entre pasos
- **Acciones directas** para explorar la plataforma
- **Barra de progreso** visual
- **Botón de skip** para usuarios avanzados

### 💾 Persistencia
- **Detección automática** de primera visita
- **LocalStorage** para recordar si el usuario ya vio el onboarding
- **Solo se muestra una vez** por usuario/dispositivo
- **Botón de reset** en modo desarrollo para testing

## 🚀 Uso

### Integración Automática

El componente ya está integrado en el layout principal y se activará automáticamente cuando:

1. Es la primera vez que un usuario accede a la plataforma
2. El usuario está en la página `/dashboard`
3. No existe la clave `has-seen-onboarding` en localStorage

```tsx
// Ya integrado en apps/web/src/app/layout.tsx
import { OnboardingAgent } from '../core/components/OnboardingAgent';

<OnboardingAgent />
```

### Testing en Desarrollo

Durante el desarrollo, puedes resetear el onboarding de dos formas:

#### 1. Botón de Reset Visual
Un botón naranja aparece en la esquina inferior izquierda (solo en modo desarrollo):

```tsx
import { DevResetOnboardingButton } from '../core/components/OnboardingAgent';

<DevResetOnboardingButton />
```

#### 2. Consola del Navegador
```javascript
// En la consola del navegador
localStorage.removeItem('has-seen-onboarding');
location.reload();
```

#### 3. Función Programática
```typescript
import { resetOnboarding } from '@/core/components/OnboardingAgent';

// Resetear el onboarding
resetOnboarding();
```

## 📝 Pasos del Onboarding

### Paso 1: Bienvenida
Presentación del asistente inteligente y bienvenida a la plataforma.

### Paso 2: Conoce a LIA
Introducción al asistente AI LIA y sus capacidades contextuales.
- **Acción**: Ver Dashboard

### Paso 3: Explora el Contenido
Presentación de cursos, talleres, comunidades y noticias.
- **Acción**: Ver Cursos

### Paso 4: Directorio de Prompts
Introducción a la herramienta de creación de prompts profesionales.
- **Acción**: Ver Prompts

### Paso 5: 💬 Hablemos un Momento (NUEVO)
**Conversación interactiva por voz** donde el usuario puede hacer preguntas antes de entrar a la plataforma.

#### Cómo funciona:
1. **Haz clic en el micrófono** grande en el centro
2. **Habla tu pregunta** (ej: "¿Qué tipo de cursos tienen?", "¿Cómo funciona la IA?", "¿Puedes ayudarme con mis tareas?")
3. **Espera la respuesta** - LIA procesará tu pregunta y responderá por voz
4. **Continúa la conversación** - Puedes hacer más preguntas
5. **Cuando estés listo**, haz clic en "Continuar sin preguntar" para avanzar

#### Ejemplos de preguntas:
- "¿Qué voy a aprender aquí?"
- "¿Cómo funciona el machine learning?"
- "¿Puedes ayudarme con programación?"
- "¿Qué es la inteligencia artificial?"
- "¿Hay proyectos prácticos?"

### Paso 6: ¡Estás Listo!
Mensaje final y recordatorio de que LIA estará disponible siempre.
- **Acción**: Comenzar (va al Dashboard)

## 🎤 Conversación por Voz

### Requisitos del Navegador
- **Chrome**: ✅ Soportado completamente
- **Edge**: ✅ Soportado completamente  
- **Safari**: ✅ Soportado (con permisos de micrófono)
- **Firefox**: ⚠️ Soporte limitado

### Permisos Necesarios
El navegador solicitará permiso para usar el micrófono la primera vez. Es necesario aceptar para usar la función de voz.

### Estados del Micrófono
- **🎤 Azul/Púrpura**: Listo para escuchar - Haz clic para hablar
- **🔴 Rojo pulsante**: Escuchando - Habla ahora
- **⏳ Girando**: Procesando tu pregunta con LIA
- **🔇 Gris**: Deshabilitado (procesando)

## 🎯 Customización

### Modificar los Pasos

Edita el array `ONBOARDING_STEPS` en `OnboardingAgent.tsx`:

```typescript
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Tu título',
    description: 'Descripción detallada para el usuario',
    speech: 'Texto que será narrado por síntesis de voz',
    action: {
      label: 'Texto del botón',
      path: '/ruta-destino'
    }
  },
  // ... más pasos
];
```

### Cambiar el Idioma de Voz

Modifica la propiedad `lang` en la función `speakText`:

```typescript
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'es-ES'; // Cambia según necesites
utterance.rate = 0.9;     // Velocidad de habla
utterance.pitch = 1;      // Tono de voz
utterance.volume = 1;     // Volumen
```

### Modificar Animaciones

Las animaciones están controladas por Framer Motion:

```tsx
<motion.div
  animate={{ 
    rotate: 360,
    scale: [1, 1.1, 1],
  }}
  transition={{ 
    duration: 20,
    repeat: Infinity,
    ease: 'linear'
  }}
/>
```

### Cambiar Colores

Los colores usan Tailwind CSS:

```tsx
// Anillos orbitales
className="border-blue-400/30"
className="border-purple-400/30"
className="border-cyan-400/30"

// Esfera central
className="bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500"

// Panel de contenido
className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95"
```

## 🔧 Integración con LIA

El componente está diseñado para trabajar en conjunto con LIA:

1. **Menciona a LIA** en el paso 2 del onboarding
2. **Usa el mismo sistema** de contexto de página
3. **Importa utilidades** de LIA para detectar contexto:

```typescript
import { getPlatformContext } from '../../../lib/lia/page-metadata';
```

## 🛠️ Ajustar sensibilidad de la ayuda proactiva

Si notas que la ayuda de LIA aparece muy rápido (por ejemplo al hacer scroll repetido o al cambiar secciones), puedes ajustar los umbrales que controla el detector de patrones.

Archivo: `apps/web/src/lib/rrweb/difficulty-pattern-detector.ts`

Parámetros relevantes:
- `scrollRepeatThreshold`: número de repeticiones/direcciones de scroll necesarias para considerar el patrón de "scroll excesivo". Por defecto se elevó a `8`.
- `repetitiveCyclesThreshold`: número de cambios de sección/back alternados necesarios para considerar un "ciclo repetitivo". Por defecto se estableció en `8`.

Modifica estos valores si quieres que la ayuda tarde más o menos en dispararse. Después de cambiar, reconstruye la aplicación y prueba en el taller.

```ts
// Ejemplo de valores en difficulty-pattern-detector.ts
scrollRepeatThreshold: 8,
repetitiveCyclesThreshold: 8,
```

Recomendación: aumenta en pasos pequeños (ej. 2 unidades) y prueba con usuarios para encontrar el equilibrio entre proactividad y ruido.

## 🎨 Estilos y Animaciones

### Anillos Orbitales
- **3 anillos** con rotación en direcciones opuestas
- **Velocidades diferentes** (20s, 15s, 10s)
- **Efectos de escala** pulsante

### Esfera Central
- **Gradiente tricolor** (azul → púrpura → cyan)
- **Brillo dinámico** que aumenta al hablar
- **Efecto de pulso** sincronizado con voz

### Partículas
- **12 partículas** flotantes
- **Movimiento radial** desde el centro
- **Aparición/desaparición** suave

### Overlay
- **Fondo oscuro** con blur
- **Z-index alto** (9998-9999) para estar sobre todo
- **Clickeable** para cerrar

## 📦 Archivos del Componente

```
OnboardingAgent/
├── OnboardingAgent.tsx    # Componente principal
├── utils.tsx              # Utilidades y botón de reset
├── index.ts               # Exports públicos
└── README.md             # Esta documentación
```

## 🌐 Compatibilidad

### Web Speech API
- ✅ Chrome/Edge
- ✅ Safari
- ⚠️ Firefox (limitada)
- ❌ IE (no soportado)

### Fallback sin Voz
Si el navegador no soporta síntesis de voz, el componente funcionará igual pero sin narración de audio.

## 🐛 Troubleshooting

### El onboarding no aparece
1. Verifica que estés en `/dashboard`
2. Limpia localStorage: `localStorage.removeItem('has-seen-onboarding')`
3. Recarga la página

### La voz no funciona
1. Verifica que tu navegador soporte Web Speech API
2. Revisa el volumen del sistema
3. Intenta usar Chrome/Edge

### El botón de reset no aparece
1. Verifica que estés en modo desarrollo
2. Comprueba `process.env.NODE_ENV === 'development'`

## 🚀 Próximas Mejoras

- [ ] Soporte para múltiples idiomas
- [ ] Personalización por rol de usuario
- [ ] Tracking de completitud de onboarding
- [ ] Tutoriales contextuales avanzados
- [ ] Integración con sistema de logros

## 📄 Licencia

Este componente es parte de la plataforma Aprende y Aplica.

---

**¿Preguntas o sugerencias?** Contacta al equipo de desarrollo.
