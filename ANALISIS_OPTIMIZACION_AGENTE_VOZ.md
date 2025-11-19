# 📊 Análisis y Optimización del Agente de Voz con ElevenLabs

## 🎯 Resumen Ejecutivo

El agente de voz (LIA Voice) utiliza una arquitectura de múltiples capas que, aunque robusta y completa, introduce latencias significativas en la interacción usuario-asistente. Este documento analiza el flujo actual y propone optimizaciones concretas para **reducir el tiempo de respuesta en un 40-60%**.

**Tiempo de respuesta actual estimado**: 3.5-6 segundos
**Tiempo de respuesta objetivo**: 1.5-2.5 segundos

---

## 🔍 Análisis del Flujo Actual

### Arquitectura Actual

```
Usuario (Habla)
    ↓ [Web Speech API - 500-1000ms]
Transcripción de Texto
    ↓ [HTTP Request - 50-100ms]
/api/lia/onboarding-chat (Middleware)
    ↓ [HTTP Request interno - 50-100ms]
/api/ai-chat (Motor Principal)
    ↓ [OpenAI API - 1000-2500ms]
Respuesta GPT-4o-mini
    ↓ [Analytics + DB writes - 200-400ms]
Respuesta al Frontend
    ↓ [ElevenLabs API - 800-1500ms]
Audio MP3 (Blob)
    ↓ [Descarga + Buffer - 100-300ms]
Reproducción de Audio
```

### Desglose de Latencia Total (Promedio)

| Componente | Tiempo Estimado | % del Total | Optimizable |
|-----------|----------------|-------------|-------------|
| **Reconocimiento de voz** | 500-1000ms | 15% | ⚠️ Limitado |
| **Request a /onboarding-chat** | 50-100ms | 2% | ✅ Eliminable |
| **Request interno a /ai-chat** | 50-100ms | 2% | ✅ Eliminable |
| **Procesamiento OpenAI** | 1000-2500ms | 45% | ✅ Optimizable |
| **Analytics asíncronos** | 200-400ms | 8% | ✅ Ya optimizado |
| **Generación de audio (ElevenLabs)** | 800-1500ms | 25% | ✅ Muy optimizable |
| **Descarga y reproducción** | 100-300ms | 3% | ✅ Optimizable |
| **TOTAL** | **3.5-6 segundos** | 100% | |

---

## 🚀 Propuestas de Optimización

### 1. 🎯 **Eliminación de Middleware Redundante** [PRIORIDAD ALTA]

**Problema**: El endpoint `/api/lia/onboarding-chat` solo actúa como proxy, agregando latencia innecesaria.

**Solución**: Eliminar el middleware y llamar directamente a `/api/ai-chat` desde el frontend.

**Impacto**:
- ⏱️ Reducción de latencia: **100-200ms**
- 🎯 Simplicidad arquitectónica
- 📊 Menos puntos de fallo

**Implementación**:

```typescript
// ANTES (OnboardingAgent.tsx - línea 481)
const response = await fetch('/api/lia/onboarding-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question, context, userName, pageContext }),
});

// DESPUÉS
const response = await fetch('/api/ai-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: question,
    context: 'onboarding',
    conversationHistory: conversationHistory || [],
    userName: userName,
    pageContext: pageContext,
    language: 'es'
  }),
});
```

**Trabajo requerido**: 5 minutos ⏰

---

### 2. ⚡ **Streaming de Audio con ElevenLabs** [PRIORIDAD ALTA]

**Problema**: La generación completa del audio antes de reproducirlo añade latencia significativa (800-1500ms).

**Solución**: Usar el endpoint de streaming de ElevenLabs para reproducir audio mientras se genera.

**Impacto**:
- ⏱️ Reducción de latencia percibida: **600-1000ms**
- 🎧 Inicio de reproducción casi inmediato
- 💾 Menor uso de memoria

**Implementación**:

```typescript
// apps/web/src/core/components/OnboardingAgent/OnboardingAgent.tsx
// Línea 141 - Función speakText

const speakText = async (text: string) => {
  if (!isAudioEnabled || typeof window === 'undefined') return;

  stopAllAudio();

  try {
    setIsSpeaking(true);

    const apiKey = 'sk_dd0d1757269405cd26d5e22fb14c54d2f49c4019fd8e86d0';
    const voiceId = '15Y62ZlO8it2f5wduybx';
    const modelId = 'eleven_multilingual_v2';

    if (!apiKey || !voiceId) {
      // Fallback a Web Speech API (código existente)
      return;
    }

    const controller = new AbortController();
    ttsAbortRef.current = controller;

    // ✅ OPTIMIZACIÓN: Usar streaming endpoint
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, // ← endpoint streaming
      {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: modelId || 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true
          },
          // ✅ Configuración optimizada para latencia
          optimize_streaming_latency: 4, // 0-4, siendo 4 la más rápida
          output_format: 'mp3_22050_32' // Menor calidad = menor latencia
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // ✅ OPTIMIZACIÓN: Streaming con MediaSource
    if (response.body) {
      const mediaSource = new MediaSource();
      const audioUrl = URL.createObjectURL(mediaSource);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      mediaSource.addEventListener('sourceopen', async () => {
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
        const reader = response.body!.getReader();

        // Función para leer chunks y alimentar el buffer
        const pump = async () => {
          try {
            const { done, value } = await reader.read();

            if (done) {
              if (mediaSource.readyState === 'open') {
                mediaSource.endOfStream();
              }
              return;
            }

            // Esperar a que el buffer esté listo antes de agregar más datos
            if (sourceBuffer.updating) {
              await new Promise(resolve => {
                sourceBuffer.addEventListener('updateend', resolve, { once: true });
              });
            }

            sourceBuffer.appendBuffer(value);

            // Iniciar reproducción cuando tengamos suficiente buffer
            if (audio.paused && sourceBuffer.buffered.length > 0) {
              try {
                await audio.play();
              } catch (playError) {
                console.warn('⚠️ Autoplay bloqueado:', playError);
              }
            }

            pump();
          } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
              console.log('Streaming abortado');
            } else {
              console.error('Error en streaming:', error);
            }
          }
        };

        pump();
      });

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) audioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current === audio) audioRef.current = null;
      };

      // Clear abort controller after setup
      if (ttsAbortRef.current === controller) ttsAbortRef.current = null;
    }
  } catch (error: any) {
    if (error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
      console.log('TTS abortado:', error.message || error);
    } else {
      console.error('Error en síntesis de voz con ElevenLabs:', error);
    }
    setIsSpeaking(false);
  }
};
```

**Trabajo requerido**: 30 minutos ⏰

**Nota**: MediaSource puede tener soporte limitado en algunos navegadores. Incluir fallback al método actual.

---

### 3. 🧠 **Optimización del Modelo OpenAI** [PRIORIDAD MEDIA]

**Problema**: GPT-4o-mini, aunque rápido, puede optimizarse aún más con configuración específica para conversación por voz.

**Solución**: Ajustar parámetros del modelo para respuestas más concisas y rápidas.

**Impacto**:
- ⏱️ Reducción de latencia: **200-500ms**
- 💰 Reducción de costos (menos tokens)
- 🎯 Respuestas más naturales para voz

**Implementación**:

```typescript
// apps/web/src/app/api/ai-chat/route.ts
// Línea 1067 - Configuración del modelo

body: JSON.stringify({
  model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
  messages: messages,
  // ✅ OPTIMIZACIÓN: Configuración para conversación por voz
  temperature: context === 'onboarding' ? 0.7 : parseFloat(process.env.CHATBOT_TEMPERATURE || '0.6'),
  max_tokens: context === 'onboarding'
    ? 150  // ← Respuestas más cortas para voz (era 500-1000)
    : parseInt(process.env.CHATBOT_MAX_TOKENS || '500'),
  stream: false,
  // ✅ Nuevos parámetros de optimización
  presence_penalty: 0.6, // Reducir repeticiones
  frequency_penalty: 0.3, // Variar vocabulario
  top_p: 0.9, // Más determinístico
}),
```

**Modificar el prompt del sistema para onboarding**:

```typescript
// apps/web/src/app/api/ai-chat/route.ts
// En getContextPrompt, agregar instrucción específica para onboarding

if (context === 'onboarding') {
  return `...

  IMPORTANTE - FORMATO PARA VOZ:
  - Respuestas MÁXIMO 2-3 oraciones (50-80 palabras)
  - Lenguaje conversacional y natural
  - Sin listas largas ni explicaciones extensas
  - Directo al punto, como si estuvieras hablando
  - Usa un tono entusiasta y amigable

  ...`;
}
```

**Trabajo requerido**: 15 minutos ⏰

---

### 4. 🎤 **Prefetch de Respuestas Predictivas** [PRIORIDAD BAJA - AVANZADA]

**Problema**: Cada pregunta requiere esperar el procesamiento completo.

**Solución**: Cachear respuestas a preguntas frecuentes del onboarding.

**Impacto**:
- ⏱️ Reducción de latencia para preguntas comunes: **2000-3500ms** (casi instantáneo)
- 💰 Reducción de costos significativa
- 🎯 Experiencia ultra-rápida para casos comunes

**Implementación**:

```typescript
// apps/web/src/core/components/OnboardingAgent/cache.ts (nuevo archivo)

interface CachedResponse {
  text: string;
  audioUrl: string; // Audio pregenerado
  timestamp: number;
}

const RESPONSE_CACHE = new Map<string, CachedResponse>();

// Preguntas frecuentes del onboarding
const COMMON_QUESTIONS = [
  "¿Qué tipo de cursos tienen?",
  "¿Cómo funciona la plataforma?",
  "¿Puedes ayudarme con tareas?",
  "¿Qué es la inteligencia artificial?",
  "¿Hay proyectos prácticos?",
  "¿Cuánto cuesta?",
  "¿Puedo probar antes de pagar?",
];

// Función para normalizar preguntas
function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .trim()
    .replace(/[¿?¡!.,;]/g, '')
    .replace(/\s+/g, ' ');
}

// Función para calcular similitud (simple)
function calculateSimilarity(q1: string, q2: string): number {
  const words1 = normalizeQuestion(q1).split(' ');
  const words2 = normalizeQuestion(q2).split(' ');

  const commonWords = words1.filter(w => words2.includes(w)).length;
  const totalWords = Math.max(words1.length, words2.length);

  return commonWords / totalWords;
}

// Función para buscar en caché
export function getCachedResponse(question: string): CachedResponse | null {
  const normalized = normalizeQuestion(question);

  // Búsqueda exacta
  if (RESPONSE_CACHE.has(normalized)) {
    return RESPONSE_CACHE.get(normalized)!;
  }

  // Búsqueda por similitud (>80%)
  for (const [cachedQ, response] of RESPONSE_CACHE.entries()) {
    const similarity = calculateSimilarity(question, cachedQ);
    if (similarity > 0.8) {
      console.log(`✅ Cache hit con similitud ${(similarity * 100).toFixed(0)}%`);
      return response;
    }
  }

  return null;
}

// Función para agregar a caché
export function cacheResponse(question: string, text: string, audioUrl: string) {
  const normalized = normalizeQuestion(question);
  RESPONSE_CACHE.set(normalized, {
    text,
    audioUrl,
    timestamp: Date.now()
  });
}

// Función para precargar respuestas comunes
export async function preloadCommonResponses() {
  console.log('🔄 Precargando respuestas comunes del onboarding...');

  for (const question of COMMON_QUESTIONS) {
    try {
      // Generar respuesta con IA
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          context: 'onboarding',
          language: 'es'
        }),
      });

      const data = await response.json();
      const text = data.response;

      // Generar audio con ElevenLabs
      const audioBlob = await generateAudio(text);
      const audioUrl = URL.createObjectURL(audioBlob);

      // Cachear
      cacheResponse(question, text, audioUrl);

      console.log(`✅ Respuesta cacheada: "${question}"`);
    } catch (error) {
      console.error(`❌ Error cacheando respuesta para: "${question}"`, error);
    }
  }

  console.log(`✅ ${RESPONSE_CACHE.size} respuestas cacheadas`);
}

async function generateAudio(text: string): Promise<Blob> {
  const apiKey = 'sk_dd0d1757269405cd26d5e22fb14c54d2f49c4019fd8e86d0';
  const voiceId = '15Y62ZlO8it2f5wduybx';

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      }),
    }
  );

  return await response.blob();
}
```

**Uso en OnboardingAgent.tsx**:

```typescript
import { getCachedResponse, cacheResponse, preloadCommonResponses } from './cache';

// Al montar el componente
useEffect(() => {
  // Precargar respuestas comunes en background
  preloadCommonResponses().catch(console.error);
}, []);

// En handleVoiceQuestion
const handleVoiceQuestion = async (question: string) => {
  if (!question.trim()) return;

  // Intentar obtener de caché
  const cached = getCachedResponse(question);

  if (cached) {
    console.log('⚡ Usando respuesta cacheada');

    // Usar respuesta y audio precacheados
    setConversationHistory(prev => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: cached.text }
    ]);

    // Reproducir audio precargado
    const audio = new Audio(cached.audioUrl);
    audioRef.current = audio;
    audio.play();

    return;
  }

  // Si no hay caché, proceder normalmente
  try {
    const response = await fetch('/api/ai-chat', { /* ... */ });
    const data = await response.json();

    // Cachear para futuras consultas
    const audioBlob = await generateAudioBlob(data.response);
    const audioUrl = URL.createObjectURL(audioBlob);
    cacheResponse(question, data.response, audioUrl);

    // Reproducir respuesta
    await speakText(data.response);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Trabajo requerido**: 2 horas ⏰

---

### 5. 🎨 **Feedback Visual Inmediato** [PRIORIDAD MEDIA]

**Problema**: El usuario no tiene retroalimentación inmediata de que su pregunta está siendo procesada.

**Solución**: Mostrar indicadores visuales y sonoros instantáneos.

**Impacto**:
- 🎯 Mejor UX percibida
- 😊 Menor frustración del usuario
- ⏱️ Sensación de respuesta más rápida

**Implementación**:

```typescript
// apps/web/src/core/components/OnboardingAgent/OnboardingAgent.tsx

const handleVoiceQuestion = async (question: string) => {
  if (!question.trim()) return;

  processingRef.current = true;
  setIsProcessing(true);

  // ✅ FEEDBACK INMEDIATO: Sonido de confirmación
  playConfirmationSound(); // Nuevo: beep suave

  // ✅ FEEDBACK INMEDIATO: Mostrar mensaje "Entendido..." mientras procesa
  setConversationHistory(prev => [
    ...prev,
    { role: 'user', content: question },
    { role: 'assistant', content: '💭 Pensando...' } // Placeholder temporal
  ]);

  try {
    const response = await fetch('/api/ai-chat', { /* ... */ });
    const data = await response.json();

    // ✅ Reemplazar placeholder con respuesta real
    setConversationHistory(prev => {
      const newHistory = [...prev];
      newHistory[newHistory.length - 1] = {
        role: 'assistant',
        content: data.response
      };
      return newHistory;
    });

    await speakText(data.response);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    processingRef.current = false;
    setIsProcessing(false);
  }
};

// Función para sonido de confirmación
function playConfirmationSound() {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800; // Tono agudo
  gainNode.gain.value = 0.1; // Volumen bajo

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1); // 100ms
}
```

**Trabajo requerido**: 30 minutos ⏰

---

### 6. 🔧 **Configuración Optimizada de ElevenLabs** [PRIORIDAD MEDIA]

**Problema**: Los parámetros actuales de ElevenLabs priorizan calidad sobre velocidad.

**Solución**: Ajustar configuración para balance calidad/velocidad óptimo.

**Impacto**:
- ⏱️ Reducción de latencia: **200-400ms**
- 🎧 Calidad de audio suficiente para conversación
- 💰 Posible reducción de costos

**Implementación**:

```typescript
// apps/web/src/core/components/OnboardingAgent/OnboardingAgent.tsx
// Línea 201 - Configuración de ElevenLabs

body: JSON.stringify({
  text: text,
  model_id: 'eleven_turbo_v2', // ✅ Modelo turbo (más rápido que multilingual_v2)
  voice_settings: {
    stability: 0.4,            // ⬇️ Reducido de 0.5 para más velocidad
    similarity_boost: 0.65,    // ⬇️ Reducido de 0.75
    style: 0.3,                // ⬇️ Reducido de 0.5
    use_speaker_boost: false   // ✅ Desactivado para mayor velocidad
  },
  // ✅ NUEVOS parámetros de optimización
  optimize_streaming_latency: 4, // Máxima optimización (0-4)
  output_format: 'mp3_22050_32' // Menor bitrate = menor latencia
})
```

**Modelos de ElevenLabs por velocidad**:

| Modelo | Calidad | Velocidad | Recomendación |
|--------|---------|-----------|---------------|
| `eleven_multilingual_v2` | ⭐⭐⭐⭐⭐ | ⏱️⏱️ | Actual (lento) |
| `eleven_turbo_v2` | ⭐⭐⭐⭐ | ⏱️⏱️⏱️⏱️ | **Recomendado** |
| `eleven_turbo_v2_5` | ⭐⭐⭐⭐⭐ | ⏱️⏱️⏱️⏱️ | Mejor opción |

**Trabajo requerido**: 5 minutos ⏰

---

### 7. 🔄 **Paralelización de Operaciones** [PRIORIDAD ALTA]

**Problema**: Algunas operaciones se ejecutan secuencialmente cuando podrían ser paralelas.

**Solución**: Ejecutar analytics y otras operaciones no críticas en paralelo.

**Impacto**:
- ⏱️ Reducción de latencia percibida: **100-200ms**
- 🎯 Mejor utilización de recursos

**Implementación**:

```typescript
// apps/web/src/app/api/ai-chat/route.ts
// Ya está implementado parcialmente (línea 819-820)

// ✅ Analytics ya se ejecuta en background (bien hecho!)
const analyticsPromise = initializeAnalyticsAsync();

// PERO podríamos optimizar más:
const handleVoiceQuestion = async (question: string) => {
  try {
    // ✅ Iniciar múltiples operaciones en paralelo
    const [aiResponse, /* otros procesos futuros */] = await Promise.all([
      // Llamada principal a IA
      fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          context: 'onboarding',
          conversationHistory: conversationHistory,
          userName: userName,
          pageContext: pageContext,
          language: 'es'
        }),
      }),
      // ✅ Otras operaciones que no bloquean la respuesta
      // Por ejemplo: logging, prefetch de siguiente paso, etc.
    ]);

    const data = await aiResponse.json();

    // ✅ Iniciar audio mientras se actualiza UI
    const audioPromise = speakText(data.response);

    // Actualizar historial (no esperar a que termine el audio)
    setConversationHistory(prev => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: data.response }
    ]);

    // Esperar audio solo si es necesario
    await audioPromise;

  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Trabajo requerido**: 15 minutos ⏰

---

## 📊 Resumen de Mejoras

### Impacto Estimado por Optimización

| Optimización | Prioridad | Esfuerzo | Reducción de Latencia | Complejidad |
|-------------|-----------|----------|----------------------|-------------|
| 1. Eliminar middleware | 🔴 ALTA | 5 min | 100-200ms | ⭐ Fácil |
| 2. Streaming ElevenLabs | 🔴 ALTA | 30 min | 600-1000ms | ⭐⭐ Media |
| 3. Optimizar GPT-4o-mini | 🟡 MEDIA | 15 min | 200-500ms | ⭐ Fácil |
| 4. Cache de respuestas | 🟢 BAJA | 2 horas | 2000-3500ms* | ⭐⭐⭐ Alta |
| 5. Feedback visual | 🟡 MEDIA | 30 min | 0ms (UX) | ⭐ Fácil |
| 6. Config ElevenLabs | 🟡 MEDIA | 5 min | 200-400ms | ⭐ Fácil |
| 7. Paralelización | 🔴 ALTA | 15 min | 100-200ms | ⭐⭐ Media |

\* Para preguntas comunes (60-70% de casos)

### Plan de Implementación Recomendado

#### **Fase 1: Ganancias Rápidas (1 hora)** 🚀

1. ✅ Eliminar middleware `/api/lia/onboarding-chat` (5 min)
2. ✅ Optimizar configuración ElevenLabs (5 min)
3. ✅ Ajustar parámetros GPT-4o-mini (15 min)
4. ✅ Implementar paralelización (15 min)
5. ✅ Agregar feedback visual inmediato (30 min)

**Reducción esperada**: 600-1300ms (15-25%)

---

#### **Fase 2: Optimización Profunda (30-60 min)** ⚡

6. ✅ Implementar streaming de ElevenLabs (30-60 min)

**Reducción esperada adicional**: 600-1000ms (25-40%)

**Total acumulado**: 1200-2300ms (40-60%)

---

#### **Fase 3: Optimización Avanzada (2-3 horas)** 🎯

7. ✅ Sistema de caché de respuestas predictivo (2-3 horas)

**Reducción para casos comunes**: 2000-3500ms adicionales

---

## 🎯 Resultado Final Esperado

### Antes
```
Tiempo promedio: 3.5-6 segundos
Experiencia: "Lento y frustrante"
```

### Después (Fase 1 + 2)
```
Tiempo promedio: 1.5-2.5 segundos
Experiencia: "Rápido y natural"
Reducción: 40-60%
```

### Después (Fase 1 + 2 + 3)
```
Tiempo promedio: 0.5-1 segundo (preguntas comunes)
Tiempo promedio: 1.5-2.5 segundos (preguntas nuevas)
Experiencia: "Casi instantáneo"
Reducción: 60-85% (casos comunes)
```

---

## 🔍 Monitoreo y Métricas

### Métricas a Implementar

```typescript
// apps/web/src/core/components/OnboardingAgent/analytics.ts

interface VoiceMetrics {
  transcriptionTime: number;     // Web Speech API
  apiCallTime: number;            // Fetch a /api/ai-chat
  openaiProcessingTime: number;   // GPT-4o-mini
  ttsGenerationTime: number;      // ElevenLabs
  audioPlaybackTime: number;      // Reproducción
  totalTime: number;              // End-to-end
  cacheHit: boolean;              // ¿Usó caché?
}

function trackVoiceInteraction(metrics: VoiceMetrics) {
  console.log('📊 Métricas de interacción por voz:', metrics);

  // Enviar a analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'voice_interaction', {
      transcription_time: metrics.transcriptionTime,
      total_time: metrics.totalTime,
      cache_hit: metrics.cacheHit,
    });
  }

  // Log para debugging
  localStorage.setItem('last_voice_metrics', JSON.stringify(metrics));
}
```

### Dashboard de Monitoreo

Crear una vista en el admin panel que muestre:

- ⏱️ Tiempo promedio de respuesta
- 📊 Distribución de latencias por componente
- 🎯 Tasa de aciertos de caché
- 💰 Costos de OpenAI y ElevenLabs
- 🔥 Preguntas más frecuentes

---

## ✅ Checklist de Implementación

### Fase 1: Ganancias Rápidas
- [ ] Eliminar `/api/lia/onboarding-chat` y usar `/api/ai-chat` directamente
- [ ] Cambiar `eleven_multilingual_v2` → `eleven_turbo_v2_5`
- [ ] Ajustar `optimize_streaming_latency: 4`
- [ ] Ajustar `output_format: 'mp3_22050_32'`
- [ ] Reducir `max_tokens` a 150 para contexto onboarding
- [ ] Implementar sonido de confirmación
- [ ] Mostrar placeholder "Pensando..." instantáneamente
- [ ] Paralelizar operaciones no críticas

### Fase 2: Streaming
- [ ] Implementar streaming de ElevenLabs con MediaSource
- [ ] Agregar fallback para navegadores sin soporte MediaSource
- [ ] Optimizar buffer de audio para inicio rápido
- [ ] Testing en múltiples navegadores

### Fase 3: Caché
- [ ] Crear sistema de caché de respuestas
- [ ] Implementar algoritmo de similitud de preguntas
- [ ] Precargar respuestas comunes al cargar componente
- [ ] Implementar invalidación de caché (TTL: 7 días)
- [ ] UI para administrar caché en admin panel

### Monitoreo
- [ ] Implementar tracking de métricas
- [ ] Crear dashboard de analytics
- [ ] Configurar alertas para latencias >3s
- [ ] A/B testing para validar mejoras

---

## 🚨 Consideraciones de Seguridad

### API Keys Hardcodeadas

**CRÍTICO**: La API key de ElevenLabs está hardcodeada en el frontend (línea 152):

```typescript
const apiKey = 'sk_dd0d1757269405cd26d5e22fb14c54d2f49c4019fd8e86d0';
```

**Riesgo**:
- ❌ La API key es visible en el código del cliente
- ❌ Cualquiera puede usarla para consumir tu crédito
- ❌ Posible abuso y costos inesperados

**Solución Urgente**:

```typescript
// 1. Mover API key al backend
// apps/web/src/app/api/tts/route.ts (NUEVO ARCHIVO)

export async function POST(request: NextRequest) {
  const { text } = await request.json();

  const apiKey = process.env.ELEVENLABS_API_KEY; // ✅ Seguro
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey!,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { /* ... */ }
      }),
    }
  );

  // Retornar stream directamente al cliente
  return new NextResponse(response.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
    },
  });
}

// 2. Usar desde frontend
// apps/web/src/core/components/OnboardingAgent/OnboardingAgent.tsx

const speakText = async (text: string) => {
  const response = await fetch('/api/tts', { // ✅ Proxy seguro
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const audioBlob = await response.blob();
  // ... resto del código
};
```

**Prioridad**: 🔴 **URGENTE**

---

## 💡 Optimizaciones Futuras

### Largo Plazo

1. **WebRTC para Audio Bidireccional**
   - Streaming bidireccional en tiempo real
   - Latencia ultra-baja (<500ms)
   - Complejidad: ⭐⭐⭐⭐⭐

2. **Edge Computing con Cloudflare Workers**
   - Ejecutar IA en el edge más cercano al usuario
   - Reducción de latencia de red
   - Complejidad: ⭐⭐⭐⭐

3. **Modelos de IA On-Device**
   - Web LLM (LLaMA.cpp en WASM)
   - TTS on-device con SpeechSynthesis mejorado
   - Sin latencia de red
   - Complejidad: ⭐⭐⭐⭐⭐

4. **Predictive Pre-loading**
   - ML para predecir siguientes preguntas
   - Precargar respuestas antes de que se pregunten
   - Complejidad: ⭐⭐⭐⭐

---

## 📚 Referencias Técnicas

### Documentación ElevenLabs
- [Streaming API](https://elevenlabs.io/docs/api-reference/streaming)
- [Latency Optimization](https://elevenlabs.io/docs/api-reference/latency-optimization)
- [Voice Settings](https://elevenlabs.io/docs/api-reference/text-to-speech)

### Documentación OpenAI
- [GPT-4o-mini](https://platform.openai.com/docs/models/gpt-4o-mini)
- [Chat Completions API](https://platform.openai.com/docs/guides/chat-completions)

### Web APIs
- [MediaSource API](https://developer.mozilla.org/en-US/docs/Web/API/MediaSource)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)

---

## 🎓 Conclusiones

El agente de voz actual tiene una arquitectura sólida pero con oportunidades significativas de optimización. Las mejoras propuestas pueden **reducir la latencia en 40-60%** con implementaciones relativamente sencillas, mejorando dramáticamente la experiencia del usuario.

**Recomendación**: Comenzar con **Fase 1 + Fase 2** (1.5-2 horas de trabajo) para obtener el máximo impacto con mínimo esfuerzo. La **Fase 3** (caché) puede implementarse posteriormente como optimización adicional.

---

**Documento creado**: Noviembre 2025
**Última actualización**: Noviembre 2025
**Autor**: Análisis técnico para optimización del agente de voz LIA
