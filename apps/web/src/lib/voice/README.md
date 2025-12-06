# Voice Agents - Guía de Uso

Sistema unificado de agentes de voz que soporta **ElevenLabs** y **Gemini Live API**.

## 🚀 Inicio Rápido

### 1. Configuración

Las variables de entorno ya están configuradas en `.env.local`:

```bash
# ElevenLabs
NEXT_PUBLIC_ELEVENLABS_API_KEY=sk_...
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=...
NEXT_PUBLIC_ELEVENLABS_MODEL_ID=eleven_multilingual_v2

# Gemini Live API
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyC-9yMwvHWISM877plibd1db53sMop3DeE
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.0-flash-live-001
NEXT_PUBLIC_GEMINI_VOICE=Aoede

# Modo: elevenlabs | gemini | hybrid
NEXT_PUBLIC_VOICE_AGENT_MODE=hybrid
```

### 2. Uso Básico

```typescript
import { useVoiceAgent } from '@/lib/voice';

function MiComponente() {
  const voice = useVoiceAgent({
    mode: 'hybrid',
    context: 'announcement', // 'announcement' | 'conversational'
    language: 'es-ES',
  });

  // Conectar (solo necesario para Gemini)
  useEffect(() => {
    if (voice.selectedAgent === 'gemini') {
      voice.connect();
    }
    return () => voice.disconnect();
  }, []);

  // Hablar texto
  const handleSpeak = async () => {
    await voice.speak('Hola, ¿cómo estás?');
  };

  // Para conversaciones (solo Gemini)
  const handleListen = async () => {
    await voice.startListening();
  };

  return (
    <div>
      <button onClick={handleSpeak}>Hablar</button>
      {voice.selectedAgent === 'gemini' && (
        <button onClick={handleListen}>Escuchar</button>
      )}
      <p>Agente: {voice.selectedAgent}</p>
      <p>Hablando: {voice.isSpeaking ? 'Sí' : 'No'}</p>
    </div>
  );
}
```

## 📋 API del Hook

### `useVoiceAgent(options)`

#### Opciones

```typescript
interface UseVoiceAgentOptions {
  mode: 'elevenlabs' | 'gemini' | 'hybrid';
  context?: 'conversational' | 'announcement';
  language?: string;
  systemInstruction?: string;
  onError?: (error: Error) => void;
}
```

#### Valores de Retorno

```typescript
{
  // Estado
  selectedAgent: 'elevenlabs' | 'gemini',
  isConnected: boolean,
  isSpeaking: boolean,
  isListening: boolean,
  isProcessing: boolean,
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error',

  // Acciones
  connect: () => Promise<void>,
  disconnect: () => void,
  speak: (text: string) => Promise<void>,
  stopAllAudio: () => void,
  startListening: () => Promise<void>,  // Solo Gemini
  stopListening: () => void,             // Solo Gemini
  setIsProcessing: (value: boolean) => void,
}
```

## 🎭 Modos de Operación

### Mode: `elevenlabs`

Usa **solo ElevenLabs** para Text-to-Speech.

**Ventajas:**
- Mejor calidad de voz
- Voces premium
- Más control sobre características vocales

**Desventajas:**
- Solo TTS (no conversacional)
- Mayor latencia en flujos completos

**Casos de uso:**
- Anuncios
- Tours guiados
- Notificaciones de voz

### Mode: `gemini`

Usa **solo Gemini Live API** para conversaciones bidireccionales.

**Ventajas:**
- Menor latencia (3x más rápido)
- Conversacional nativo
- Voice Activity Detection
- Interrupciones naturales
- Multimodal

**Desventajas:**
- Calidad de voz ligeramente inferior (~7%)
- Sin clonación de voz
- Más complejo

**Casos de uso:**
- Tutorías interactivas
- Conversaciones largas
- Sesiones de práctica

### Mode: `hybrid` (Recomendado)

Selecciona automáticamente según el contexto:

| Context | Agente | Razón |
|---------|--------|-------|
| `announcement` | ElevenLabs | Mejor calidad para mensajes cortos |
| `conversational` | Gemini | Mejor latencia para conversaciones |

## 🔧 Ejemplos de Integración

### Ejemplo 1: Tour Guiado (ElevenLabs)

```typescript
import { useVoiceAgent } from '@/lib/voice';

function TourGuiado() {
  const voice = useVoiceAgent({
    mode: 'hybrid',
    context: 'announcement', // Usará ElevenLabs automáticamente
    language: 'es-ES',
  });

  const steps = [
    { text: 'Bienvenido al tour' },
    { text: 'Este es el dashboard' },
    { text: 'Aquí puedes ver tus cursos' },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < steps.length) {
      voice.speak(steps[currentStep].text);
    }
  }, [currentStep]);

  return (
    <div>
      <button onClick={() => setCurrentStep((s) => s + 1)}>
        Siguiente
      </button>
      <button onClick={voice.stopAllAudio}>
        Detener
      </button>
    </div>
  );
}
```

### Ejemplo 2: Chat Conversacional (Gemini)

```typescript
import { useVoiceAgent } from '@/lib/voice';

function ChatConversacional() {
  const voice = useVoiceAgent({
    mode: 'hybrid',
    context: 'conversational', // Usará Gemini automáticamente
    language: 'es-ES',
    systemInstruction: 'Eres un tutor amigable de matemáticas.',
  });

  useEffect(() => {
    voice.connect();
    return () => voice.disconnect();
  }, []);

  const handleToggleListen = async () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      await voice.startListening();
    }
  };

  return (
    <div>
      <button onClick={handleToggleListen} disabled={!voice.isConnected}>
        {voice.isListening ? 'Detener' : 'Hablar'}
      </button>
      <div>
        <p>Estado: {voice.connectionState}</p>
        <p>Escuchando: {voice.isListening ? 'Sí' : 'No'}</p>
        <p>Hablando: {voice.isSpeaking ? 'Sí' : 'No'}</p>
      </div>
    </div>
  );
}
```

### Ejemplo 3: Modo Híbrido Avanzado

```typescript
function ComponenteHibrido() {
  // Para anuncios cortos
  const voiceAnnouncement = useVoiceAgent({
    mode: 'hybrid',
    context: 'announcement',
  });

  // Para conversación larga
  const voiceConversation = useVoiceAgent({
    mode: 'hybrid',
    context: 'conversational',
    systemInstruction: 'Eres un asistente de aprendizaje.',
  });

  useEffect(() => {
    // Solo Gemini necesita conexión
    voiceConversation.connect();
    return () => voiceConversation.disconnect();
  }, []);

  return (
    <div>
      {/* Anuncio con ElevenLabs (mejor calidad) */}
      <button onClick={() => voiceAnnouncement.speak('¡Bienvenido!')}>
        Reproducir Anuncio
      </button>

      {/* Conversación con Gemini (mejor latencia) */}
      <button onClick={() => voiceConversation.startListening()}>
        Iniciar Conversación
      </button>
    </div>
  );
}
```

## 🔄 Migración desde Implementación Anterior

### Antes (ElevenLabs directo)

```typescript
const speakText = async (text: string) => {
  const apiKey = 'sk_...';
  const voiceId = '15Y62ZlO8it2f5wduybx';

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    }
  );

  const audioBlob = await response.blob();
  const audio = new Audio(URL.createObjectURL(audioBlob));
  await audio.play();
};
```

### Ahora (Unificado)

```typescript
import { useVoiceAgent } from '@/lib/voice';

const voice = useVoiceAgent({
  mode: 'hybrid',
  context: 'announcement',
});

await voice.speak('Hola mundo');
```

## 🎨 Personalización Avanzada

### Cambiar Voz de Gemini

```typescript
// En .env.local
NEXT_PUBLIC_GEMINI_VOICE=Charon  // Aoede, Charon, Fenrir, Kore, Puck
```

### System Instructions

```typescript
const voice = useVoiceAgent({
  mode: 'gemini',
  context: 'conversational',
  systemInstruction: `
    Eres un tutor experto en matemáticas.
    Explica conceptos de forma clara y amigable.
    Usa ejemplos prácticos.
    Adapta tu tono según el nivel del estudiante.
  `,
});
```

### Manejo de Errores

```typescript
const voice = useVoiceAgent({
  mode: 'hybrid',
  context: 'conversational',
  onError: (error) => {
    console.error('Error en voice agent:', error);
    // Mostrar notificación al usuario
    toast.error('Error en el asistente de voz');
  },
});
```

## 📊 Comparación de Agentes

| Característica | ElevenLabs | Gemini Live |
|----------------|------------|-------------|
| Calidad de voz | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Latencia | ~800ms | ~350ms |
| Conversacional | ❌ | ✅ |
| VAD | ❌ | ✅ |
| Interrupciones | ❌ | ✅ |
| Multimodal | ❌ | ✅ |
| Costo (est.) | $330/mes | $707/mes |

## 🐛 Troubleshooting

### Error: "WebSocket no está conectado"

Asegúrate de llamar a `connect()` antes de usar Gemini:

```typescript
useEffect(() => {
  if (voice.selectedAgent === 'gemini') {
    voice.connect();
  }
}, [voice.selectedAgent]);
```

### Error: "API Key de Gemini no proporcionada"

Verifica que la variable de entorno esté configurada:

```bash
# .env.local
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyC-9yMwvHWISM877plibd1db53sMop3DeE
```

### Audio no se reproduce

1. Verifica permisos del micrófono (para Gemini)
2. Verifica que el usuario haya interactuado con la página (requisito de navegadores)
3. Revisa la consola para errores

### Latencia alta

1. Si usas ElevenLabs para conversaciones, cambia a Gemini:
   ```typescript
   context: 'conversational' // Usará Gemini automáticamente
   ```

2. Si usas Gemini y la latencia sigue alta, verifica tu conexión a internet

## 📚 Referencias

- [Gemini Live API Docs](https://ai.google.dev/gemini-api/docs/live)
- [ElevenLabs API Docs](https://elevenlabs.io/docs/api-reference)
- [Documento de Migración](/docs/MIGRACION_ELEVENLABS_A_GEMINI_LIVE_API.md)

## 🤝 Contribuir

Para reportar bugs o sugerir mejoras, contacta al equipo de desarrollo.
