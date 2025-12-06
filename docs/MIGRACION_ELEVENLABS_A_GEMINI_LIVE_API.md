# Investigación: Migración de ElevenLabs a Gemini Live API

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Implementación Actual (ElevenLabs)](#implementación-actual-elevenlabs)
3. [Gemini Live API](#gemini-live-api)
4. [Comparación Técnica](#comparación-técnica)
5. [Plan de Migración](#plan-de-migración)
6. [Análisis de Costos](#análisis-de-costos)
7. [Ventajas y Desventajas](#ventajas-y-desventajas)
8. [Recomendaciones](#recomendaciones)
9. [Referencias](#referencias)

---

## 🎯 Resumen Ejecutivo

Este documento analiza la viabilidad de migrar el agente de voz actual que usa **ElevenLabs** a **Gemini Live API** en las páginas `/learn` y `/dashboard` de la plataforma Aprende y Aplica.

### Hallazgos Clave

- **ElevenLabs** ofrece calidad de voz superior y mayor control sobre características vocales
- **Gemini Live API** proporciona una solución integrada con conversación bidireccional nativa, menor latencia y mejor integración con el ecosistema Google
- La migración requiere un cambio arquitectónico significativo de REST API a WebSockets
- Gemini Live API ofrece ventajas en costos para aplicaciones conversacionales de alto volumen

---

## 📱 Implementación Actual (ElevenLabs)

### Ubicación en el Código

La implementación actual de ElevenLabs se encuentra en:

1. **ContextualVoiceGuide**: `apps/web/src/core/components/ContextualVoiceGuide/ContextualVoiceGuide.tsx` (líneas 229-354)
2. **OnboardingAgent**: `apps/web/src/core/components/OnboardingAgent/OnboardingAgent.tsx` (líneas 260-385)

### Arquitectura Actual

```typescript
// Configuración actual
const apiKey = '';
const voiceId = '15Y62ZlO8it2f5wduybx';
const modelId = 'eleven_turbo_v2_5';

// Endpoint REST
const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
```

### Flujo de Trabajo Actual

1. **Texto a Voz (TTS)**:
   - Request POST con texto
   - Recibe audio blob (MP3)
   - Reproduce audio con `HTMLAudioElement`

2. **Reconocimiento de Voz (STT)**:
   - Web Speech API del navegador (`SpeechRecognition`)
   - Envía transcripción a `/api/ai-chat`
   - Recibe respuesta de LIA
   - Reproduce respuesta con ElevenLabs TTS

### Características de la Implementación

- **Modelo**: `eleven_turbo_v2_5` (optimizado para baja latencia)
- **Configuración de voz**:
  - Stability: 0.4
  - Similarity boost: 0.65
  - Style: 0.3
  - Speaker boost: desactivado
- **Optimización de latencia**: 4 (máximo)
- **Formato de salida**: `mp3_22050_32` (menor bitrate)
- **Fallback**: Web Speech API si ElevenLabs falla

### Problemas Identificados

- ⚠️ **API Key hardcodeada** en el código (riesgo de seguridad)
- ⚠️ **Arquitectura no conversacional**: Flujo separado STT → LLM → TTS
- ⚠️ **Latencia acumulativa**: 3 servicios independientes (Web Speech → OpenAI → ElevenLabs)
- ⚠️ **Sin interrupciones naturales**: No puede detectar cuando el usuario interrumpe

---

## 🚀 Gemini Live API

### Descripción General

Gemini Live API es la solución de Google para interacciones de voz y video en tiempo real con baja latencia. Lanzada en 2024 y mejorada significativamente en 2025, permite conversaciones bidireccionales naturales con capacidades multimodales.

### Características Principales

#### 1. **Conversación Bidireccional Nativa**
- Streaming de audio/video/texto en tiempo real
- Protocolo WebSocket para comunicación de baja latencia
- Context window conversacional (historial de turnos)

#### 2. **Voice Activity Detection (VAD)**
- Detección automática de interrupciones del usuario
- Manejo natural de turnos de conversación
- El modelo puede ser interrumpido en tiempo real

#### 3. **Audio Nativo**
- Síntesis de voz natural y realista
- 30+ voces distintas
- Soporte para 24+ idiomas
- Expresividad emocional adaptativa (Affective Dialog)

#### 4. **Capacidades Avanzadas**
- **Tool Use**: Function calling y Google Search integrados
- **Multimodal**: Audio + Video + Texto simultáneos
- **Thinking**: Razonamiento explícito (modelo gemini-2.5-flash)

#### 5. **Integración con Ecosistema Google**
- Google AI Studio
- Vertex AI
- Firebase
- LiveKit

### Arquitectura Técnica

#### Endpoint WebSocket

```
wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent
```

#### Flujo de Mensajes

```typescript
// Setup de configuración
{
  "setup": {
    "model": "models/gemini-2.0-flash-live-001",
    "generation_config": {
      "response_modalities": ["AUDIO"],
      "speech_config": {
        "voice_config": { "prebuilt_voice_config": { "voice_name": "Aoede" } }
      }
    }
  }
}

// Envío de audio
{
  "client_content": {
    "turns": [
      {
        "role": "user",
        "parts": [{ "inline_data": { "mime_type": "audio/pcm", "data": "..." } }]
      }
    ],
    "turn_complete": true
  }
}

// Recepción de respuesta
{
  "server_content": {
    "model_turn": {
      "parts": [{ "inline_data": { "mime_type": "audio/pcm", "data": "..." } }]
    },
    "turn_complete": true
  }
}
```

### Modelos Disponibles (2025)

| Modelo | Características | Latencia |
|--------|----------------|----------|
| `gemini-2.0-flash-live-001` | Audio nativo, multimodal, thinking | < 350ms (LLM) |
| `gemini-2.5-flash-native-audio-preview-09-2025` | Audio nativo, thinking avanzado | < 350ms |

---

## ⚖️ Comparación Técnica

### Calidad de Voz

| Aspecto | ElevenLabs | Gemini Live API |
|---------|------------|----------------|
| Naturalidad | ⭐⭐⭐⭐⭐ (97%) | ⭐⭐⭐⭐ (90%) |
| Pronunciación | ⭐⭐⭐⭐⭐ (82% accuracy) | ⭐⭐⭐⭐ (77% accuracy) |
| Expresividad emocional | ⭐⭐⭐⭐⭐ (Muy alta) | ⭐⭐⭐⭐ (Alta) |
| Voces disponibles | 120+ voces premium | 30+ voces nativas |
| Clonación de voz | ✅ Sí (Voice cloning) | ❌ No (Voces predefinidas) |
| Control granular | ✅ Tone, rate, emphasis | ⚠️ Limitado |

**Ganador en calidad de voz**: **ElevenLabs**

### Latencia

| Métrica | ElevenLabs (Actual) | Gemini Live API |
|---------|-------------------|----------------|
| TTS solo | ~75ms (Flash v2.5) | N/A (integrado) |
| LLM + TTS | ~800ms - 1.5s | ~350ms - 500ms |
| Primera respuesta | ~1-2s | ~350-500ms |
| Arquitectura | 3 servicios separados | 1 servicio integrado |

**Ganador en latencia**: **Gemini Live API** (3x más rápido)

### Características Conversacionales

| Característica | ElevenLabs | Gemini Live API |
|---------------|------------|----------------|
| Interrupciones | ❌ No nativo | ✅ Voice Activity Detection |
| Bidireccional | ❌ (separado STT/TTS) | ✅ Nativo |
| Context window | ❌ (manual) | ✅ Automático |
| Tool calling | ❌ (manual) | ✅ Integrado |
| Multimodal | ❌ Solo audio | ✅ Audio + Video + Texto |

**Ganador en características**: **Gemini Live API**

### Facilidad de Implementación

| Aspecto | ElevenLabs | Gemini Live API |
|---------|------------|----------------|
| Protocolo | REST (simple) | WebSocket (complejo) |
| Integración actual | ✅ Ya integrado | ❌ Requiere refactorización |
| Documentación | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐⭐⭐ Muy buena |
| Starter kits | ⭐⭐⭐ Limitados | ⭐⭐⭐⭐⭐ Múltiples (React, Python) |
| Compatibilidad LIA | ⚠️ Requiere integración manual | ✅ Gemini nativo |

**Ganador en facilidad**: **ElevenLabs** (actual), pero **Gemini** a largo plazo

---

## 🛠️ Plan de Migración

### Fase 1: Preparación y Prototipo (1-2 semanas)

#### 1.1 Configuración de Gemini Live API

```bash
# Instalar dependencias
npm install @google/generative-ai

# Variables de entorno
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.0-flash-live-001
```

#### 1.2 Crear Servicio de WebSocket

```typescript
// apps/web/src/lib/gemini-live/client.ts

import { GenerativeAI } from '@google/generative-ai';

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext;

  constructor(private apiKey: string) {
    this.audioContext = new AudioContext();
  }

  async connect(config: GeminiLiveConfig): Promise<void> {
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.sendSetup(config);
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(JSON.parse(event.data));
    };
  }

  private sendSetup(config: GeminiLiveConfig): void {
    this.ws?.send(JSON.stringify({
      setup: {
        model: config.model,
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: config.voice || "Aoede"
              }
            }
          }
        }
      }
    }));
  }

  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    const base64Audio = this.arrayBufferToBase64(audioData);

    this.ws?.send(JSON.stringify({
      client_content: {
        turns: [{
          role: "user",
          parts: [{
            inline_data: {
              mime_type: "audio/pcm",
              data: base64Audio
            }
          }]
        }],
        turn_complete: true
      }
    }));
  }

  private handleMessage(message: any): void {
    if (message.server_content?.model_turn?.parts) {
      const audioParts = message.server_content.model_turn.parts
        .filter((part: any) => part.inline_data?.mime_type === "audio/pcm");

      audioParts.forEach((part: any) => {
        const audioData = this.base64ToArrayBuffer(part.inline_data.data);
        this.playAudio(audioData);
      });
    }
  }

  private async playAudio(audioData: ArrayBuffer): Promise<void> {
    const audioBuffer = await this.audioContext.decodeAudioData(audioData);
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.start();
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export interface GeminiLiveConfig {
  model: string;
  voice?: string;
  language?: string;
}
```

#### 1.3 Hook para Gemini Live

```typescript
// apps/web/src/lib/gemini-live/useGeminiLive.ts

import { useState, useRef, useCallback } from 'react';
import { GeminiLiveClient } from './client';

export function useGeminiLive() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const connect = useCallback(async (apiKey: string) => {
    if (clientRef.current) return;

    clientRef.current = new GeminiLiveClient(apiKey);

    await clientRef.current.connect({
      model: 'gemini-2.0-flash-live-001',
      voice: 'Aoede',
    });

    setIsConnected(true);
  }, []);

  const startListening = useCallback(async () => {
    if (!clientRef.current || isListening) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0 && clientRef.current) {
          const arrayBuffer = await event.data.arrayBuffer();
          await clientRef.current.sendAudio(arrayBuffer);
        }
      };

      mediaRecorderRef.current.start(100); // Chunks de 100ms
      setIsListening(true);
    } catch (error) {
      console.error('Error starting listening:', error);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      setIsListening(false);
    }
  }, [isListening]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
      setIsConnected(false);
    }
  }, []);

  return {
    isConnected,
    isSpeaking,
    isListening,
    connect,
    startListening,
    stopListening,
    disconnect,
  };
}
```

### Fase 2: Integración en Componentes (1-2 semanas)

#### 2.1 Modificar ContextualVoiceGuide

```typescript
// Reemplazar la función speakText con Gemini Live
const { connect, startListening, stopListening, isConnected } = useGeminiLive();

useEffect(() => {
  if (isVisible) {
    connect(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
  }

  return () => {
    disconnect();
  };
}, [isVisible]);

// Reemplazar toggleListening para usar Gemini Live
const toggleListening = async () => {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
};
```

#### 2.2 Modificar OnboardingAgent

Similar a ContextualVoiceGuide, reemplazar la lógica de ElevenLabs + Web Speech API con Gemini Live.

### Fase 3: Testing y Optimización (1 semana)

#### 3.1 Tests de Calidad

- Comparación A/B de calidad de voz
- Pruebas de latencia en diferentes condiciones de red
- Tests de interrupciones y VAD
- Pruebas multiidioma (español, inglés, portugués)

#### 3.2 Optimización

- Ajustar configuración de speech_config
- Optimizar tamaño de chunks de audio
- Implementar reconnection logic para WebSocket
- Agregar fallback a ElevenLabs si Gemini falla

### Fase 4: Despliegue Gradual (1-2 semanas)

#### 4.1 Feature Flag

```typescript
// Feature flag para controlar la migración
const useGeminiLive = process.env.NEXT_PUBLIC_USE_GEMINI_LIVE === 'true';

const VoiceAgent = useGeminiLive
  ? GeminiVoiceAgent
  : ElevenLabsVoiceAgent;
```

#### 4.2 Rollout

1. **Semana 1**: 10% de usuarios (beta testers)
2. **Semana 2**: 25% de usuarios
3. **Semana 3**: 50% de usuarios
4. **Semana 4**: 100% de usuarios

### Fase 5: Monitoreo y Ajustes (Continuo)

- Monitorear métricas de rendimiento
- Recolectar feedback de usuarios
- Ajustar configuración según necesidad
- Mantener ElevenLabs como fallback durante 1 mes

---

## 💰 Análisis de Costos

### ElevenLabs (Implementación Actual)

#### Modelo de Precios

- **Basado en créditos**: 1 crédito = 1 carácter (modelos V1)
- **Modelos optimizados**: 0.5-1 crédito por carácter (Flash/Turbo)
- **Costo promedio**: ~$0.20 por 1,000 caracteres

#### Planes

| Plan | Precio/mes | Caracteres incluidos | Costo por caracter extra |
|------|------------|---------------------|--------------------------|
| Free | $0 | 10,000 | N/A |
| Starter | $5 | 30,000 | $0.30/1K |
| Creator | $22 | 100,000 | $0.24/1K |
| Pro | $99 | 500,000 | $0.18/1K |
| Scale | $330 | 2,000,000 | $0.11/1K |
| Business | $1,320 | 11,000,000 | $0.10/1K |

#### Estimación para Aprende y Aplica

Asumiendo:
- 1,000 usuarios activos/mes
- 10 interacciones/usuario/mes
- 200 caracteres/interacción (promedio)

**Total**: 1,000 × 10 × 200 = 2,000,000 caracteres/mes

**Costo mensual estimado**:
- Plan Scale: $330/mes (2M caracteres incluidos)
- Costo adicional: $0 (dentro del límite)

**Total: ~$330/mes**

### Gemini Live API

#### Modelo de Precios (2025)

##### Modelo: gemini-2.0-flash-live-001

| Tipo | Entrada | Salida |
|------|---------|--------|
| Texto | $0.35/1M tokens | $1.50/1M tokens |
| Audio/Video/Imagen | $2.10/1M tokens | $8.50/1M tokens |

##### Cargos de Sesión

- **Setup**: $0.005 por sesión
- **Duración**: $0.025 por minuto de conversación activa

#### Estimación para Aprende y Aplica

Asumiendo:
- 1,000 usuarios activos/mes
- 10 sesiones/usuario/mes = 10,000 sesiones/mes
- 2 minutos/sesión (promedio) = 20,000 minutos/mes
- 500 tokens audio entrada/minuto = 10M tokens entrada
- 800 tokens audio salida/minuto = 16M tokens salida

**Cálculo**:
- Setup: 10,000 sesiones × $0.005 = **$50**
- Duración: 20,000 minutos × $0.025 = **$500**
- Audio entrada: 10M × $2.10/1M = **$21**
- Audio salida: 16M × $8.50/1M = **$136**

**Total: ~$707/mes**

### Comparación de Costos

| Concepto | ElevenLabs | Gemini Live API |
|----------|------------|----------------|
| Costo mensual (estimado) | $330 | $707 |
| Diferencia | - | +$377/mes (+114%) |

**Nota**: Gemini Live API es más caro para el volumen estimado, pero ofrece:
- Conversación bidireccional nativa (no requiere Web Speech API adicional)
- LLM integrado (puede reemplazar OpenAI en algunos casos)
- Capacidades multimodales incluidas

### Optimización de Costos para Gemini

1. **Reducir duración de sesiones**: Implementar timeouts agresivos
2. **Usar texto cuando sea posible**: Para respuestas simples, usar texto en vez de audio
3. **Batch requests**: Agrupar interacciones cortas
4. **Fallback a ElevenLabs**: Para TTS simple sin conversación

**Con optimizaciones, costo estimado: ~$400-500/mes**

---

## ✅ Ventajas y Desventajas

### Gemini Live API

#### ✅ Ventajas

1. **Latencia Reducida**
   - 3x más rápido que arquitectura actual
   - Conversación integrada (LLM + TTS + STT en un servicio)

2. **Características Conversacionales**
   - Voice Activity Detection nativo
   - Interrupciones naturales
   - Context window automático

3. **Integración con LIA**
   - Gemini es el mismo modelo que podría usar LIA
   - Sincronización de contexto más fácil
   - Function calling integrado

4. **Capacidades Futuras**
   - Multimodal (audio + video + screen sharing)
   - Thinking capabilities (razonamiento explícito)
   - Grounding con Google Search (gratis en preview)

5. **Escalabilidad**
   - Infraestructura de Google Cloud
   - SLA empresarial disponible

#### ❌ Desventajas

1. **Calidad de Voz**
   - Ligeramente inferior a ElevenLabs (~7% menos en naturalidad)
   - Menor control sobre características vocales
   - No permite clonación de voz

2. **Complejidad de Implementación**
   - Requiere WebSocket (más complejo que REST)
   - Manejo de audio PCM en vez de MP3
   - Curva de aprendizaje mayor

3. **Costos**
   - ~114% más caro para el volumen estimado
   - Modelo de precios más complejo (sesión + tokens)

4. **Madurez**
   - API más nueva (lanzada 2024, mejorada 2025)
   - Menos ejemplos de la comunidad comparado con ElevenLabs
   - Posibles cambios en pricing durante preview

### ElevenLabs (Mantener)

#### ✅ Ventajas

1. **Calidad de Voz Superior**
   - Líderes en el mercado de TTS
   - 120+ voces premium
   - Clonación de voz disponible

2. **Simplicidad**
   - REST API simple
   - Ya integrado y funcionando
   - Documentación excelente

3. **Costo Predecible**
   - Modelo de precios simple
   - Más económico para volumen medio

4. **Madurez**
   - Producto estable y probado
   - Gran comunidad
   - Soporte empresarial

#### ❌ Desventajas

1. **Latencia Mayor**
   - Arquitectura de 3 servicios separados
   - Acumulación de latencias

2. **No Conversacional**
   - Requiere integración manual STT + LLM + TTS
   - Sin VAD nativo
   - Sin interrupciones naturales

3. **Escalabilidad Limitada**
   - Solo TTS (no conversación completa)
   - Requiere otros servicios para STT y LLM

---

## 🎯 Recomendaciones

### Recomendación Principal: **Enfoque Híbrido**

No migrar completamente a Gemini Live API, sino usar ambas tecnologías según el caso de uso:

### Escenario 1: Conversaciones Largas → **Gemini Live API**

**Casos de uso**:
- Tutorías interactivas en `/learn`
- Sesiones de práctica conversacional
- Q&A extendidas con LIA

**Ventajas**:
- Menor latencia acumulativa
- Interrupciones naturales
- Better conversational flow

### Escenario 2: Anuncios y Guías Cortas → **ElevenLabs**

**Casos de uso**:
- Tours de onboarding
- Notificaciones de voz
- Instrucciones paso a paso

**Ventajas**:
- Mejor calidad de voz
- Más económico para mensajes cortos
- Menor complejidad de implementación

### Implementación Recomendada

```typescript
// apps/web/src/lib/voice/VoiceAgentFactory.ts

export class VoiceAgentFactory {
  static create(mode: 'conversational' | 'announcement') {
    if (mode === 'conversational') {
      return new GeminiLiveVoiceAgent();
    }
    return new ElevenLabsVoiceAgent();
  }
}

// Uso en ContextualVoiceGuide (tours cortos)
const voiceAgent = VoiceAgentFactory.create('announcement');

// Uso en /learn (conversaciones largas)
const voiceAgent = VoiceAgentFactory.create('conversational');
```

### Roadmap Sugerido

#### Q1 2025 (Ahora)
- [ ] Crear prototipo de Gemini Live API
- [ ] Implementar en `/learn` para sesiones de práctica (beta)
- [ ] Mantener ElevenLabs en `/dashboard` y tours

#### Q2 2025
- [ ] Expandir Gemini Live a más casos conversacionales
- [ ] Optimizar costos con configuración híbrida
- [ ] Recolectar métricas de calidad y satisfacción

#### Q3 2025
- [ ] Evaluar resultados y ajustar estrategia
- [ ] Considerar migración completa si resultados son positivos
- [ ] Mantener ElevenLabs como fallback premium

#### Q4 2025
- [ ] Implementar características avanzadas de Gemini (multimodal, thinking)
- [ ] Explorar grounding con Google Search
- [ ] Optimizar costos a largo plazo

### Consideraciones de Seguridad

#### Prioridad Alta

1. **Mover API keys a variables de entorno**
   ```bash
   # .env.local
   ELEVENLABS_API_KEY=sk_xxx
   GEMINI_API_KEY=xxx
   ```

2. **Crear endpoint de proxy**
   ```typescript
   // apps/web/src/app/api/voice/route.ts
   // Para evitar exponer API keys en cliente
   ```

3. **Implementar rate limiting**
   - Limitar sesiones por usuario
   - Prevenir abuso de API

### Métricas de Éxito

Definir KPIs para evaluar la migración:

1. **Calidad de Experiencia**
   - Net Promoter Score (NPS) de voz
   - Tasa de finalización de conversaciones
   - Feedback de usuarios (encuestas)

2. **Performance**
   - Latencia promedio (objetivo: < 500ms)
   - Tasa de errores (objetivo: < 1%)
   - Uptime (objetivo: > 99.5%)

3. **Costos**
   - Costo por sesión
   - Costo por usuario activo
   - ROI vs. beneficios de features

---

## 📚 Referencias

### Gemini Live API

- [Gemini Live API Overview (Google Cloud)](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api)
- [Build voice-driven applications with Live API (Google Cloud Blog)](https://cloud.google.com/blog/products/ai-machine-learning/build-voice-driven-applications-with-live-api)
- [Get started with Live API (Google AI for Developers)](https://ai.google.dev/gemini-api/docs/live)
- [Live API capabilities guide (Google AI for Developers)](https://ai.google.dev/gemini-api/docs/live-guide)
- [Gemini Live API plugin (LiveKit docs)](https://docs.livekit.io/agents/models/realtime/plugins/gemini/)
- [Bidirectional streaming using the Gemini Live API (Firebase)](https://firebase.google.com/docs/ai-logic/live-api)
- [How to Build a Voice Agent with the New Gemini Live API (Sider AI)](https://sider.ai/blog/ai-tools/how-to-build-a-voice-agent-with-the-new-gemini-live-api-end-to-end)
- [Gemini 2.0: Level Up Your Apps with Real-Time Multimodal Interactions (Google Developers Blog)](https://developers.googleblog.com/en/gemini-2-0-level-up-your-apps-with-real-time-multimodal-interactions/)
- [Live API reference (Vertex AI)](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/multimodal-live)
- [GitHub: live-api-web-console (React starter app)](https://github.com/google-gemini/live-api-web-console)
- [GitHub: generative-ai multimodal-live-api examples](https://github.com/GoogleCloudPlatform/generative-ai/tree/main/gemini/multimodal-live-api)

### Comparaciones y Análisis

- [Introducing Gemini 2.0 Flash Live API Client and ElevenLabs (Voximplant)](https://voximplant.com/blog/gemini-live-api-and-elevenlabs-streaming-tts)
- [Gemini 2.5 TTS vs. ElevenLabs (Podonos)](https://www.podonos.com/blog/gemini-vs-elevenlabs)
- [Comparing ElevenLabs Conversational AI and OpenAI Realtime API (ElevenLabs)](https://elevenlabs.io/blog/comparing-elevenlabs-conversational-ai-v-openai-realtime-api)
- [ElevenLabs vs OpenAI TTS (Vapi AI Blog)](https://vapi.ai/blog/elevenlabs-vs-openai)
- [How do you optimize latency for Conversational AI? (ElevenLabs)](https://elevenlabs.io/blog/how-do-you-optimize-latency-for-conversational-ai)

### Pricing

- [Gemini Developer API pricing (Google AI for Developers)](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini AI Pricing: What You'll Really Pay In 2025 (CloudZero)](https://www.cloudzero.com/blog/gemini-pricing/)
- [Gemini Live API Guide 2025: Architecture, Pricing, Tutorial (BinaryverseAI)](https://binaryverseai.com/gemini-live-api-guide/)
- [ElevenLabs API Pricing](https://elevenlabs.io/pricing/api)
- [ElevenLabs Pricing for Creators & Businesses](https://elevenlabs.io/pricing)
- [ElevenLabs pricing: A complete breakdown for 2025 (eesel AI)](https://www.eesel.ai/blog/elevenlabs-pricing)

### Integraciones

- [ElevenLabs Partners with Google Cloud (ElevenLabs)](https://elevenlabs.io/blog/elevenlabs-and-google-cloud)
- [Gemini 2.5 Flash comes to ElevenLabs Conversational AI (ElevenLabs)](https://elevenlabs.io/blog/gemini-25-flash)
- [Gemini Multimodal Live (Pipecat)](https://docs.pipecat.ai/server/services/s2s/gemini-live)
- [Google Gemini Live Voice (Mastra Docs)](https://mastra.ai/reference/voice/google-gemini-live)

---

## 📝 Conclusión

La migración de ElevenLabs a Gemini Live API representa una oportunidad estratégica para mejorar la experiencia conversacional de Aprende y Aplica, especialmente en escenarios de interacción prolongada. Sin embargo, la calidad de voz superior de ElevenLabs sigue siendo valiosa para anuncios y guías cortas.

**Recomendación final**: Implementar un **enfoque híbrido** que aproveche las fortalezas de ambas tecnologías según el contexto de uso, con Gemini Live API para conversaciones largas y ElevenLabs para mensajes cortos de alta calidad.

Este enfoque maximiza la calidad de experiencia del usuario mientras controla costos y reduce la complejidad de migración completa.

---

**Documento creado**: Diciembre 2025
**Versión**: 1.0
**Autor**: Claude Code
**Última actualización**: 2025-12-06
