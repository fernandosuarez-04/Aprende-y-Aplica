# 🔧 Troubleshooting - Gemini Live API Detección de Voz

## Problema: No detecta mi voz cuando hablo con el agente

### 🔍 Diagnóstico

El problema más común es que **los componentes actuales** (`ContextualVoiceGuide` y `OnboardingAgent`) **solo tienen TTS (Text-to-Speech)**, no tienen STT (Speech-to-Text) integrado con Gemini.

Estos componentes usan:
- **TTS**: ElevenLabs o Gemini (síntesis de voz)
- **STT**: Web Speech API del navegador (reconocimiento de voz separado)

Para que Gemini Live funcione correctamente con conversación bidireccional, necesitas usar el **nuevo sistema unificado**.

---

## ✅ Soluciones

### Solución 1: Usar Página de Prueba (Rápido)

He creado una página de prueba completa que demuestra la funcionalidad de Gemini Live:

1. **Inicia el servidor**:
   ```bash
   npm run dev
   ```

2. **Accede a la página de prueba**:
   ```
   http://localhost:3000/test-gemini
   ```

3. **Prueba la funcionalidad**:
   - Espera a que se conecte (estado "connected")
   - Haz clic en "Activar Micrófono"
   - Permite el acceso al micrófono cuando el navegador lo solicite
   - Habla claramente
   - Gemini responderá automáticamente

### Solución 2: Integrar en Componentes Existentes

Para que `ContextualVoiceGuide` o `OnboardingAgent` funcionen con Gemini Live, necesitas reemplazar la implementación actual con el nuevo hook `useVoiceAgent`.

#### Ejemplo de Integración en ContextualVoiceGuide:

```typescript
// En ContextualVoiceGuide.tsx

import { useVoiceAgent } from '@/lib/voice';

export function ContextualVoiceGuide({ ... }) {
  // ✅ NUEVO - Reemplaza toda la lógica de voz
  const voice = useVoiceAgent({
    mode: 'gemini',  // Forzar Gemini para conversación
    context: 'conversational',
    language: speechLanguageMap[language] || 'es-ES',
    systemInstruction: 'Eres una guía de voz contextual amigable.',
  });

  // Conectar al montar
  useEffect(() => {
    voice.connect();
    return () => voice.disconnect();
  }, []);

  // Reemplazar función speakText
  const speakText = async (text: string) => {
    await voice.speak(text);
  };

  // Reemplazar función toggleListening
  const toggleListening = async () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      await voice.startListening();
    }
  };

  // Usar voice.isSpeaking en lugar de estado local
  // Usar voice.isListening en lugar de estado local
}
```

---

## 🐛 Problemas Comunes y Soluciones

### 1. Error: "WebSocket failed to connect"

**Causa**: API key de Gemini inválida o conexión de red

**Solución**:
```bash
# Verifica que la API key esté correcta en .env.local
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyC-9yMwvHWISM877plibd1db53sMop3DeE

# Reinicia el servidor
npm run dev
```

### 2. Error: "Permission denied" al acceder al micrófono

**Causa**: El navegador bloqueó el acceso al micrófono

**Solución**:
1. Haz clic en el ícono de candado en la barra de direcciones
2. Permite el acceso al micrófono
3. Recarga la página
4. Intenta nuevamente

**Alternativamente en Chrome**:
- Ve a `chrome://settings/content/microphone`
- Asegúrate de que `localhost:3000` esté permitido

### 3. Error: "AudioContext was not allowed to start"

**Causa**: Necesitas interacción del usuario antes de reproducir audio

**Solución**:
- El usuario debe hacer clic en un botón antes de que se reproduzca audio
- Esto es una limitación del navegador por seguridad
- La página de prueba maneja esto automáticamente

### 4. El micrófono se activa pero no envía nada

**Causa**: Conversión de audio PCM fallando

**Solución**:
1. Abre la consola del navegador (F12)
2. Busca errores de conversión de audio
3. Verifica que el navegador soporte `MediaRecorder`

```javascript
// Verificar soporte
if (!window.MediaRecorder) {
  console.error('MediaRecorder no soportado');
}
```

### 5. Gemini no responde después de hablar

**Causas posibles**:
- Audio muy bajo (habla más fuerte)
- Ruido de fondo (usa audífonos)
- Idioma incorrecto configurado

**Solución**:
```typescript
// Verifica el idioma en useVoiceAgent
const voice = useVoiceAgent({
  mode: 'gemini',
  context: 'conversational',
  language: 'es-ES',  // ← Asegúrate de que coincida con tu idioma
});
```

### 6. Modo híbrido usa ElevenLabs (que está deshabilitado)

**Causa**: Modo híbrido + contexto 'announcement' → intenta usar ElevenLabs

**Solución**:
```bash
# Opción 1: Cambiar a modo Gemini puro
NEXT_PUBLIC_VOICE_AGENT_MODE=gemini

# Opción 2: Cambiar contexto a conversational
const voice = useVoiceAgent({
  mode: 'hybrid',
  context: 'conversational',  // ← Usará Gemini
});
```

---

## 🎯 Verificación de Configuración

### Checklist de Configuración Correcta

- [ ] `.env.local` tiene `NEXT_PUBLIC_GEMINI_API_KEY`
- [ ] `.env.local` tiene `NEXT_PUBLIC_VOICE_AGENT_MODE=gemini`
- [ ] ElevenLabs variables están comentadas (si no quieres usarlas)
- [ ] Servidor reiniciado después de cambiar `.env.local`
- [ ] Navegador tiene permisos de micrófono
- [ ] No hay errores en la consola del navegador

### Verificar en la Página de Prueba

1. Ve a `http://localhost:3000/test-gemini`
2. Verifica que el estado de conexión sea "connected" (verde)
3. Haz clic en "Activar Micrófono"
4. El estado de micrófono debe cambiar a "Activo" (verde)
5. Habla y verifica en los logs que aparezcan mensajes como:
   - "🎤 Escuchando..."
   - "🔊 Gemini está hablando..."

---

## 🔬 Modo Debug Avanzado

### Habilitar Logs Detallados

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Habilitar logs detallados de Gemini
localStorage.setItem('DEBUG_GEMINI', 'true');
```

Luego recarga la página. Verás logs detallados de:
- Conexión WebSocket
- Mensajes enviados/recibidos
- Conversión de audio
- Errores detallados

### Inspeccionar Estado del Cliente

En la consola del navegador:

```javascript
// Ver estado actual del voice agent
// (solo funciona en componentes que usan useVoiceAgent)
```

---

## 📊 Comparación de Implementaciones

| Característica | Componentes Actuales | Nueva Implementación (useVoiceAgent) |
|----------------|---------------------|-------------------------------------|
| TTS (hablar) | ✅ ElevenLabs | ✅ Gemini Live (bidireccional) |
| STT (escuchar) | ⚠️ Web Speech API separado | ✅ Gemini Live (integrado) |
| Conversación | ❌ No nativo | ✅ Nativo con VAD |
| Interrupciones | ❌ No soportado | ✅ Sí, con Voice Activity Detection |
| Latencia | ~800-1500ms | ~350-500ms |

---

## 🚀 Próximos Pasos

1. **Prueba la página de prueba**: `http://localhost:3000/test-gemini`
2. **Verifica que funcione correctamente**
3. **Si funciona**, integra `useVoiceAgent` en tus componentes
4. **Si no funciona**, revisa los logs y el checklist de configuración

---

## 📞 Soporte Adicional

Si el problema persiste:

1. Revisa los logs en la consola del navegador (F12)
2. Verifica la pestaña "Network" para errores de WebSocket
3. Asegúrate de que tu conexión a internet es estable
4. Prueba en modo incógnito para descartar extensiones del navegador
5. Prueba en otro navegador (Chrome/Edge recomendados)

---

**Última actualización**: 2025-12-06
**Versión**: 1.0
