# Guía de Integración - Voice Agents

Esta guía explica cómo integrar el nuevo sistema unificado de voice agents en los componentes existentes.

## 📋 Tabla de Contenidos

1. [Resumen de Cambios](#resumen-de-cambios)
2. [Integración en ContextualVoiceGuide](#integración-en-contextualvoiceguide)
3. [Integración en OnboardingAgent](#integración-en-onboardingagent)
4. [Testing](#testing)
5. [Rollback](#rollback)

---

## 🔄 Resumen de Cambios

### Antes

- ElevenLabs para TTS (hardcoded API key)
- Web Speech API del navegador para STT
- Flujo separado: STT → LIA → TTS

### Ahora

- Sistema unificado con `useVoiceAgent`
- Soporte para ElevenLabs **y** Gemini Live API
- Modo híbrido configurable
- API keys en variables de entorno

---

## 🎯 Integración en ContextualVoiceGuide

### Archivo
`apps/web/src/core/components/ContextualVoiceGuide/ContextualVoiceGuide.tsx`

### Paso 1: Importar el nuevo hook

Reemplaza las importaciones relacionadas con voz:

```typescript
// ❌ ANTES - Eliminar
// import { useRef, useState } from 'react';
// const audioRef = useRef<HTMLAudioElement | null>(null);
// const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

// ✅ AHORA - Agregar
import { useVoiceAgent } from '@/lib/voice';
```

### Paso 2: Reemplazar estado y refs

Encuentra estas líneas (alrededor de línea 74-89):

```typescript
// ❌ ANTES - Eliminar estas líneas
const [isSpeaking, setIsSpeaking] = useState(false);
const audioRef = useRef<HTMLAudioElement | null>(null);
const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
const ttsAbortRef = useRef<AbortController | null>(null);

// ✅ AHORA - Reemplazar con
const voice = useVoiceAgent({
  mode: 'hybrid',
  context: 'announcement', // Tours son anuncios cortos → usará ElevenLabs
  language: speechLanguageMap[language] || 'es-ES',
  onError: (error) => {
    console.error('Error en voice agent:', error);
  },
});
```

### Paso 3: Reemplazar función `speakText`

Encuentra la función `speakText` (líneas 229-354) y reemplázala completamente:

```typescript
// ❌ ANTES - Eliminar toda la función speakText (líneas 229-354)

// ✅ AHORA - Reemplazar con esta versión simplificada
const speakText = async (text: string) => {
  if (!isAudioEnabled || typeof window === 'undefined') return;

  try {
    await voice.speak(text);
  } catch (error) {
    console.error('Error al hablar:', error);
  }
};
```

### Paso 4: Reemplazar función `stopAllAudio`

Encuentra la función `stopAllAudio` (líneas 104-127) y reemplázala:

```typescript
// ❌ ANTES - Eliminar función stopAllAudio completa

// ✅ AHORA - Reemplazar con
const stopAllAudio = () => {
  voice.stopAllAudio();
};
```

### Paso 5: Actualizar referencias a `isSpeaking`

Busca todas las referencias a `setIsSpeaking` y `isSpeaking` y actualízalas:

```typescript
// ❌ ANTES
setIsSpeaking(true);
setIsSpeaking(false);
if (isSpeaking) { ... }

// ✅ AHORA
// Ya no necesitas setIsSpeaking, el hook lo maneja
if (voice.isSpeaking) { ... }
```

### Paso 6: Conectar/Desconectar (si se usa Gemini)

Agrega al inicio del componente, después de declarar `voice`:

```typescript
// Conectar/desconectar según el agente seleccionado
useEffect(() => {
  if (voice.selectedAgent === 'gemini') {
    voice.connect();
  }

  return () => {
    voice.disconnect();
  };
}, [voice.selectedAgent]);
```

### Paso 7: Actualizar animaciones de voz

Encuentra las animaciones que dependen de `isSpeaking` y actualízalas:

```typescript
// Busca líneas como:
animate={{
  scale: isSpeaking ? [1, 1.08, 1] : 1,
  // ...
}}

// Reemplaza `isSpeaking` con `voice.isSpeaking`
animate={{
  scale: voice.isSpeaking ? [1, 1.08, 1] : 1,
  // ...
}}
```

---

## 🎭 Integración en OnboardingAgent

### Archivo
`apps/web/src/core/components/OnboardingAgent/OnboardingAgent.tsx`

### Paso 1: Importar el nuevo hook

```typescript
// ✅ Agregar al inicio
import { useVoiceAgent } from '@/lib/voice';
```

### Paso 2: Reemplazar estado

Encuentra (líneas 131-143):

```typescript
// ❌ ANTES - Eliminar
const [isSpeaking, setIsSpeaking] = useState(false);
const audioRef = useRef<HTMLAudioElement | null>(null);
const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
const ttsAbortRef = useRef<AbortController | null>(null);

// ✅ AHORA - Reemplazar
const voice = useVoiceAgent({
  mode: 'hybrid',
  context: 'announcement', // Onboarding es un anuncio → ElevenLabs
  language: speechLanguageMap[language] || 'es-ES',
});
```

### Paso 3: Actualizar todas las funciones de voz

Igual que en ContextualVoiceGuide, reemplaza:

1. `speakText` → `voice.speak(text)`
2. `stopAllAudio` → `voice.stopAllAudio()`
3. `setIsSpeaking` → Automático en `voice.isSpeaking`

---

## 🧪 Testing

### Test 1: Verificar Modo Híbrido

1. Configura `.env.local`:
   ```bash
   NEXT_PUBLIC_VOICE_AGENT_MODE=hybrid
   ```

2. Abre `/dashboard` (debería usar ElevenLabs para tours)
3. Abre un curso en `/learn` (debería usar Gemini si cambias `context: 'conversational'`)

3. Revisa la consola:
   ```
   Agente seleccionado: elevenlabs  // Para tours
   Agente seleccionado: gemini      // Para conversaciones
   ```

### Test 2: Forzar ElevenLabs

1. Configura `.env.local`:
   ```bash
   NEXT_PUBLIC_VOICE_AGENT_MODE=elevenlabs
   ```

2. Reinicia el servidor: `npm run dev`
3. Todo debería usar ElevenLabs

### Test 3: Forzar Gemini

1. Configura `.env.local`:
   ```bash
   NEXT_PUBLIC_VOICE_AGENT_MODE=gemini
   ```

2. Reinicia el servidor
3. Todo debería usar Gemini (verifica en consola: "WebSocket conectado")

### Test 4: Calidad de Voz

Compara la calidad entre ambos:

```typescript
// En un componente de prueba
const testVoice = async () => {
  const text = "Hola, esta es una prueba de calidad de voz.";

  // Test ElevenLabs
  const voiceEL = useVoiceAgent({ mode: 'elevenlabs' });
  await voiceEL.speak(text);

  // Esperar 3 segundos
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test Gemini
  const voiceGemini = useVoiceAgent({ mode: 'gemini' });
  await voiceGemini.connect();
  await voiceGemini.speak(text);
};
```

### Test 5: Conversación con Gemini

```typescript
// Solo funciona con mode: 'gemini'
const voice = useVoiceAgent({
  mode: 'gemini',
  context: 'conversational',
  systemInstruction: 'Eres un tutor amigable.',
});

useEffect(() => {
  voice.connect();
}, []);

// Botón para hablar
<button onClick={() => voice.startListening()}>
  {voice.isListening ? 'Detener' : 'Hablar'}
</button>
```

---

## 🔙 Rollback

Si necesitas volver a la implementación anterior de ElevenLabs:

### Opción 1: Configurar Modo (Rápido)

```bash
# .env.local
NEXT_PUBLIC_VOICE_AGENT_MODE=elevenlabs
```

Esto fuerza el uso de ElevenLabs sin cambiar código.

### Opción 2: Restaurar Código Original (Manual)

Si necesitas eliminar completamente la integración:

1. **Git Checkout** (si aún no has commiteado):
   ```bash
   git checkout apps/web/src/core/components/ContextualVoiceGuide/ContextualVoiceGuide.tsx
   git checkout apps/web/src/core/components/OnboardingAgent/OnboardingAgent.tsx
   ```

2. **Eliminar nuevos archivos**:
   ```bash
   rm -rf apps/web/src/lib/gemini-live
   rm -rf apps/web/src/lib/voice
   ```

3. **Limpiar .env.local**:
   ```bash
   # Eliminar estas líneas
   NEXT_PUBLIC_GEMINI_API_KEY=...
   NEXT_PUBLIC_GEMINI_MODEL=...
   NEXT_PUBLIC_GEMINI_VOICE=...
   NEXT_PUBLIC_VOICE_AGENT_MODE=...
   ```

---

## 📊 Checklist de Migración

### ContextualVoiceGuide
- [ ] Importar `useVoiceAgent`
- [ ] Reemplazar estado de voz
- [ ] Simplificar `speakText`
- [ ] Simplificar `stopAllAudio`
- [ ] Actualizar referencias a `isSpeaking`
- [ ] Agregar conexión/desconexión
- [ ] Actualizar animaciones
- [ ] Probar en navegador

### OnboardingAgent
- [ ] Importar `useVoiceAgent`
- [ ] Reemplazar estado de voz
- [ ] Simplificar `speakText`
- [ ] Simplificar `stopAllAudio`
- [ ] Actualizar referencias a `isSpeaking`
- [ ] Agregar conexión/desconexión
- [ ] Actualizar animaciones
- [ ] Probar en navegador

### General
- [ ] Configurar `.env.local`
- [ ] Probar modo `hybrid`
- [ ] Probar modo `elevenlabs`
- [ ] Probar modo `gemini`
- [ ] Comparar calidad de voz
- [ ] Medir latencia
- [ ] Verificar errores en consola
- [ ] Documentar hallazgos

---

## 💡 Tips Adicionales

### 1. Logs de Depuración

Agrega logs temporales para verificar el agente seleccionado:

```typescript
const voice = useVoiceAgent({
  mode: 'hybrid',
  context: 'announcement',
});

useEffect(() => {
  console.log('🎙️ Agente seleccionado:', voice.selectedAgent);
  console.log('🔌 Conectado:', voice.isConnected);
}, [voice.selectedAgent, voice.isConnected]);
```

### 2. Feature Flag para A/B Testing

Si quieres hacer A/B testing, crea un flag:

```typescript
const USE_NEW_VOICE_SYSTEM = process.env.NEXT_PUBLIC_USE_NEW_VOICE === 'true';

const voice = USE_NEW_VOICE_SYSTEM
  ? useVoiceAgent({ mode: 'hybrid', context: 'announcement' })
  : null;

const speakText = USE_NEW_VOICE_SYSTEM
  ? (text: string) => voice?.speak(text)
  : speakTextOld; // Función antigua
```

### 3. Monitoreo de Performance

```typescript
const voice = useVoiceAgent({
  mode: 'hybrid',
  context: 'announcement',
  onError: (error) => {
    // Enviar a sistema de monitoreo (Sentry, etc.)
    console.error('[Voice Agent Error]', error);
  },
});

// Medir latencia
const measureLatency = async (text: string) => {
  const start = performance.now();
  await voice.speak(text);
  const end = performance.now();
  console.log(`⏱️ Latencia: ${end - start}ms`);
};
```

---

## 📞 Soporte

Para preguntas o problemas:

1. Revisa [README.md](/apps/web/src/lib/voice/README.md)
2. Revisa [Documento de Migración](/docs/MIGRACION_ELEVENLABS_A_GEMINI_LIVE_API.md)
3. Contacta al equipo de desarrollo

---

**Última actualización**: 2025-12-06
**Versión**: 1.0
