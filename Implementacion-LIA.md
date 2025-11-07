# Implementación de LIA (Learning Intelligence Assistant)

## 🆕 NUEVA FUNCIONALIDAD: Detección Automática de Contexto (Nov 2025)

**LIA ahora detecta automáticamente el área del sitio web donde se encuentra el usuario para ofrecer información contextual relevante.**

Ver documentación completa: [`docs/LIA-CONTEXTO-AUTOMATICO.md`](./docs/LIA-CONTEXTO-AUTOMATICO.md)  
Resumen ejecutivo: [`docs/RESUMEN-EJECUTIVO-CONTEXTO-LIA.md`](./docs/RESUMEN-EJECUTIVO-CONTEXTO-LIA.md)

---

## Índice
1. [Arquitectura General](#arquitectura-general)
2. [Componentes Principales](#componentes-principales)
3. [🆕 Sistema de Detección de Contexto](#sistema-de-detección-de-contexto)
4. [Obtención del Contexto de la Lección](#obtención-del-contexto-de-la-lección)
5. [Flujo de Procesamiento de Mensajes](#flujo-de-procesamiento-de-mensajes)
6. [Prompts del Sistema](#prompts-del-sistema)
7. [Restricciones de Seguridad](#restricciones-de-seguridad)
8. [Restricciones Éticas](#restricciones-éticas)
9. [API y Endpoints](#api-y-endpoints)
10. [Validación y Sanitización](#validación-y-sanitización)
11. [Configuración](#configuración)

---

## Arquitectura General

LIA es un asistente de inteligencia artificial especializado en educación que funciona como tutor personalizado. La implementación actual utiliza múltiples componentes distribuidos entre cliente y servidor.

### Arquitectura Cliente-Servidor

```
Cliente (Frontend)
├── chat-online.html          # Página principal del chat
├── components/lia-chat.js    # Componente principal de LIA
├── chat-online.js            # Clase principal ChatOnline
├── chat-online-v2.js         # Versión mejorada
└── utils/helpers.js          # Utilidades (sanitización, validación)

Servidor (Backend)
├── server.js                 # Endpoint /api/openai
└── Variables de entorno      # OPENAI_API_KEY, CHATBOT_MODEL, etc.
```

---

## Componentes Principales

### 1. LiaChat (`src/Chat-Online/components/lia-chat.js`)

Clase principal que encapsula toda la lógica de comunicación con LIA.

**Características principales:**
- Gestión del historial de conversación (almacenado en localStorage)
- Preparación de contexto educativo
- Comunicación con la API del servidor
- Generación de sugerencias de seguimiento
- Manejo de acciones sugeridas (ver video, hacer ejercicio, etc.)

**Métodos clave:**
```javascript
- sendMessage(message, context)          // Enviar mensaje a LIA
- prepareContext(additionalContext)      // Preparar contexto del curso
- getSystemPrompt()                      // Generar prompt del sistema
- callLiaAPI(message, context)          // Llamar a la API
- processLiaResponse()                 // Procesar respuesta de LIA
```

### 2. ChatOnline (`src/Chat-Online/chat-online.js`)

Clase que maneja la integración del chat en la página de curso online.

**Funcionalidades:**
- Obtención del contexto del curso actual
- Construcción de prompts dinámicos con contexto personalizado
- Integración con el historial de conversación
- Gestión del estado del chat

### 3. Endpoint del Servidor (`server.js` - `/api/openai`)

Endpoint REST que procesa las solicitudes y se comunica con OpenAI.

---

## Obtención del Contexto de la Lección

LIA obtiene el contexto de la lección actual a través de múltiples fuentes:

### 1. Contexto Hardcodeado (Implementación Actual)

En `components/lia-chat.js`, existe un contexto hardcodeado para el "Taller de fundamentos de IA":

```javascript
this.currentContext = {
    taller: 'Taller de fundamentos de Inteligencia Artificial con tutor personalizado',
    tipo: 'Taller interactivo',
    tutor: 'LIA - Tutor Personalizado de IA',
    modalidad: '100% online con tutor personalizado IA',
    module: 1,
    moduleTitle: 'Fundamentos de Inteligencia Artificial',
    moduleDescription: 'Conceptos básicos de IA, Machine Learning y aplicaciones prácticas',
    documentoApoyo: 'Doc de apoyo - Fundamentos de IA.pdf',
    videoTimestamp: 0,
    userProgress: 25,
    totalModules: 4,
    objetivos: [...],
    contextoEducativo: 'Taller práctico con tutor personalizado...',
    nivelDificultad: 'Principiante'
};
```

---

## 🆕 Sistema de Detección de Contexto

### Detección Automática por URL (Implementado Nov 2025)

LIA ahora detecta automáticamente el área del sitio donde está el usuario mediante análisis de URL.

**Ubicación**: `apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx`

```typescript
// Detección automática de contexto basado en URL
function detectContextFromURL(pathname: string): string {
  if (pathname.includes('/communities')) return 'communities';
  if (pathname.includes('/courses')) return 'courses';
  if (pathname.includes('/workshops')) return 'workshops';
  if (pathname.includes('/news')) return 'news';
  if (pathname.includes('/dashboard')) return 'dashboard';
  if (pathname.includes('/prompt-directory')) return 'prompts';
  if (pathname.includes('/business-panel')) return 'business';
  if (pathname.includes('/profile')) return 'profile';
  return 'general';
}

// Obtener descripción contextual de la página
function getPageContextInfo(pathname: string): string {
  const contextMap: Record<string, string> = {
    '/communities': 'página de comunidades - donde los usuarios pueden unirse y participar en grupos',
    '/courses': 'página de cursos - catálogo de cursos disponibles',
    // ... más contextos
  };
  // Busca coincidencias y retorna descripción relevante
}
```

**Integración en el componente:**
```typescript
export function AIChatAgent({ context = 'general', ... }) {
  const pathname = usePathname();
  const detectedContext = detectContextFromURL(pathname);
  const activeContext = context === 'general' ? detectedContext : context;
  const pageContextInfo = getPageContextInfo(pathname);
  
  // Se envía al API junto con el mensaje
  const response = await fetch('/api/ai-chat', {
    body: JSON.stringify({
      message: userMessage.content,
      context: activeContext,
      pageContext: {
        pathname,
        description: pageContextInfo,
        detectedArea: detectedContext
      },
      // ... más datos
    })
  });
}
```

**Beneficios:**
- ✅ Respuestas automáticamente relevantes según la página
- ✅ No requiere configuración manual por página
- ✅ Experiencia de usuario más fluida e inteligente
- ✅ Compatible con todas las rutas existentes

### 2. Contexto Dinámico desde el DOM

En `chat-online.html`, la función `obtenerContextoCurso()` extrae información del DOM:

```javascript
function obtenerContextoCurso() {
    // Obtener información del módulo actual
    const currentModule = document.querySelector('.module-item.current .module-info h4')?.textContent || '¿Qué es la IA?';
    
    // Obtener tiempo del video si está disponible
    const videoTime = document.getElementById('currentTime')?.textContent || '00:00';
    
    // Obtener contenido de la transcripción visible
    const transcript = document.querySelector('.transcript-content p')?.textContent?.substring(0, 200) || 'Conceptos fundamentales...';
    
    return `Módulo actual: ${currentModule}. Tiempo del video: ${videoTime}. ${transcript ? 'Transcripción: ' + transcript + '...' : ''}`;
}
```

### 3. Contexto del Video Actual

En `chat-online-v2.js`, se obtiene contexto enriquecido del video:

```javascript
generateLiaContext() {
    const context = {
        courseInfo: this.fullCourseInfo,
        currentModule: this.currentModule?.title,
        currentVideo: this.currentVideo?.video_title,
        videoTime: this.getCurrentVideoTime(),
        transcript: this.currentVideo?.transcript_text || 'Sin transcripción disponible',
        summary: this.currentVideo?.summary || 'Sin resumen disponible',
        keyConceptsCount: this.currentVideo?.key_concepts?.length || 0,
        hasActivities: !!(this.currentVideo?.descripcion_actividad || this.currentVideo?.prompts_actividad)
    };
    return context;
}
```

### 4. Historial de Conversación

El historial se almacena en `localStorage` bajo la clave `liaConversationHistory`:

```javascript
loadConversationHistory() {
    const stored = localStorage.getItem('liaConversationHistory');
    if (stored) {
        this.conversationHistory = JSON.parse(stored);
    }
}
```

Se mantienen los últimos 50 mensajes para contexto conversacional.

---

## Flujo de Procesamiento de Mensajes

### Flujo Completo:

1. **Usuario escribe mensaje** → `chat-online.html` o componente LiaChat
2. **Validación inicial** → Verificar que el mensaje no esté vacío
3. **Obtener contexto**:
   - Información del usuario actual
   - Contexto del curso/módulo/video actual
   - Transcripción del video (si está disponible)
   - Historial de conversación (últimos 5 mensajes)
4. **Construir prompt** → Combinar prompt del sistema + contexto + mensaje del usuario
5. **Sanitización** → Aplicar sanitización básica al mensaje
6. **Enviar a API** → POST a `/api/openai` con:
   - `prompt`: Mensaje del usuario
   - `context`: Contexto completo del curso
   - Headers de autenticación
7. **Servidor procesa**:
   - Valida autenticación
   - Construye `systemMessage` con contexto
   - Llama a OpenAI API
8. **Procesar respuesta**:
   - Extraer contenido de la respuesta
   - Generar sugerencias de seguimiento
   - Generar acciones sugeridas
9. **Actualizar UI**:
   - Mostrar respuesta en el chat
   - Guardar en historial
   - Mostrar sugerencias/acciones

### Ejemplo de Flujo en Código:

```javascript
// En chat-online.html
async function enviarMensajeALia(mensaje) {
    // 1. Validar
    if (!mensaje.trim()) return;
    
    // 2. Obtener usuario
    const currentUser = obtenerUsuarioActual();
    
    // 3. Obtener contexto
    const context = obtenerContextoCurso();
    const conversationHistory = getFormattedConversationHistory();
    
    // 4. Construir prompt
    let prompt = `${conversationHistory}MENSAJE ACTUAL:
Usuario: ${mensaje}

CONTEXTO DEL CURSO:
El usuario está en el curso "Aprende y Aplica IA" - Chat Online.
${context}`;
    
    // 5. Enviar a API
    const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-user-id': currentUser.id
        },
        body: JSON.stringify({ prompt, context })
    });
    
    // 6. Procesar respuesta
    const data = await response.json();
    mostrarRespuesta(data.response);
}
```

---

## Prompts del Sistema

### 1. Prompt Principal del Sistema (`prompts/system.es.md`)

LIA está configurado con un prompt específico que enfatiza:

- **RESTRICCIÓN CRÍTICA**: Responder ÚNICAMENTE basándose en la TRANSCRIPCIÓN DEL VIDEO ACTUAL
- **No inventar información** que no esté explícitamente en la transcripción
- **Indicar claramente** cuando la información no está en el video actual
- **Personalidad**: Amigable pero profesional, educativo, práctico, adaptativo

**Ejemplo del prompt base:**
```
Eres **LIA** (Learning Intelligence Assistant), un asistente de inteligencia artificial especializado en el curso **"Experto en IA para Profesionales"**.

RESTRICCIONES CRÍTICAS DE CONTEXTO:
- PRIORIDAD #1: Responde ÚNICAMENTE basándote en la TRANSCRIPCIÓN DEL VIDEO ACTUAL proporcionada en el contexto
- Si la pregunta NO puede responderse con la transcripción del video, indica claramente que esa información no está en el video actual
- NUNCA inventes información que no esté explícitamente en la transcripción
```

### 2. Prompt del Servidor (`server.js`)

El endpoint construye un systemMessage básico:

```javascript
const systemMessage = `Eres LIA (Learning Intelligence Assistant), un asistente de inteligencia artificial especializado en educación y capacitación en IA. 

Tu objetivo es ayudar a los usuarios a comprender y aplicar conceptos de inteligencia artificial de manera efectiva.

Personalidad:
- Amigable pero profesional
- Educativo y motivador
- Práctico con ejemplos concretos
- Adaptativo al nivel del usuario

Formato de respuestas:
- Usa emojis estratégicamente
- Estructura con viñetas y numeración
- Usa **negritas** para enfatizar
- Mantén un tono positivo y motivador

Contexto del usuario: ${context || 'No disponible'}`;
```

### 3. Prompt del Componente LiaChat

El componente `lia-chat.js` genera un prompt más detallado para el taller de IA:

```javascript
getSystemPrompt() {
    return `Eres LIA, un tutor personalizado especializado en enseñar fundamentos de Inteligencia Artificial.
    
    CONTEXTO ACTUAL DEL TALLER:
    - Taller: ${this.currentContext.taller}
    - Módulo actual: ${this.currentContext.module} - ${this.currentContext.moduleTitle}
    - Nivel: ${this.currentContext.nivelDificultad}
    - Progreso del estudiante: ${this.currentContext.userProgress}% del taller completo
    
    METODOLOGÍA DE ENSEÑANZA:
    1. Explica conceptos de forma CLARA y GRADUAL para principiantes
    2. Usa ANALOGÍAS y EJEMPLOS de la vida cotidiana
    3. Proporciona EJERCICIOS prácticos y actividades de refuerzo
    4. Adapta el ritmo según las preguntas del estudiante
    ...
    `;
}
```

### 4. Prompt para Conocimiento del Curso (`prompts/course-knowledge-prompt.md`)

Prompt especializado que indica a LIA cómo usar el contenido del curso:

- **ÚNICA fuente autorizada**: `course-data.js`
- NO inventar información que no esté en el contenido del curso
- Verificar cada respuesta contra el contenido real antes de responder

---

## Restricciones de Seguridad

### 1. Validación de Entrada

**Ubicación**: `src/utils/helpers.js`

```javascript
function validateUserInput(input) {
    if (!input || typeof input !== 'string') {
        return { isValid: false, error: 'Entrada inválida' };
    }
    
    const trimmed = input.trim();
    if (trimmed.length === 0) {
        return { isValid: false, error: 'El mensaje no puede estar vacío' };
    }
    
    if (trimmed.length > 500) {
        return { isValid: false, error: 'El mensaje es demasiado largo (máximo 500 caracteres)' };
    }
    
    return { isValid: true, value: trimmed };
}
```

### 2. Sanitización de Texto

**Ubicación**: `src/utils/helpers.js` y `src/scripts/main.js`

```javascript
// Sanitización básica de HTML
function sanitizeText(text) {
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Sanitización de texto del bot (remueve markdown)
function sanitizeBotText(text) {
    return String(text || '').replace(/\*\*/g, '');
}
```

### 3. Autenticación

**Ubicación**: `server.js` - Endpoint `/api/openai`

```javascript
// Verificar autenticación
const authHeader = req.headers.authorization;
const userId = req.headers['x-user-id'];

if (!authHeader || !userId) {
    return res.status(401).json({ error: 'Autenticación requerida' });
}
```

### 4. Validación de Variables de Entorno

```javascript
// Verificar que tenemos la API key de OpenAI
if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Configuración de OpenAI faltante' });
}
```

### 5. Limitaciones de Prompt Injection

**Mitigaciones implementadas:**

1. **Contexto fijo del sistema**: El `systemMessage` siempre tiene la misma estructura base, evitando que el usuario modifique las instrucciones del sistema.

2. **Separación de roles**: El mensaje del usuario siempre va en el rol `user`, mientras que las instrucciones del sistema van en el rol `system`.

3. **Validación de longitud**: Limite de 500 caracteres por mensaje.

4. **Sanitización básica**: Escapado de caracteres HTML peligrosos.

**Limitaciones actuales:**
- ❌ **No hay detección específica de prompt injection**
- ❌ **No hay validación de patrones sospechosos** (como "ignore previous instructions", "act as", etc.)
- ❌ **No hay rate limiting** implementado
- ⚠️ **La sanitización es básica** y solo previene XSS, no prompt injection

**Recomendaciones para mejorar:**
1. Implementar detección de patrones de prompt injection:
   ```javascript
   const suspiciousPatterns = [
       /ignore\s+(previous|all|above)\s+instructions?/i,
       /act\s+as/i,
       /you\s+are\s+now/i,
       /system\s*:/i,
       /\[INST\]|\[/SYS\]/i
   ];
   
   function detectPromptInjection(text) {
       return suspiciousPatterns.some(pattern => pattern.test(text));
   }
   ```

2. Implementar rate limiting por usuario
3. Añadir logging de intentos sospechosos
4. Usar validación más estricta del contexto antes de enviarlo a OpenAI

---

## Restricciones Éticas

### 1. Principios Éticos Fundamentales

**Ubicación**: `prompts/safety.es.md`

#### Transparencia:
- **Honestidad sobre capacidades**: Ser claro sobre lo que puede y no puede hacer
- **Revelación de limitaciones**: Comunicar cuando no hay información completa
- **Fuentes de información**: Mencionar las fuentes cuando sea apropiado

#### Responsabilidad:
- **Precisión de información**: Esforzarse por proporcionar información correcta
- **Verificación de hechos**: Confirmar información cuando sea posible
- **Corrección de errores**: Reconocer y corregir errores

#### Beneficencia:
- **Bienestar del usuario**: Priorizar el beneficio y seguridad del usuario
- **Aprendizaje efectivo**: Enfocarse en facilitar el aprendizaje
- **Prevención de daño**: Evitar proporcionar información perjudicial

#### Justicia:
- **Acceso equitativo**: Proporcionar respuestas de calidad para todos
- **Sin discriminación**: No discriminar basándose en características personales
- **Trato justo**: Mantener consistencia en la calidad de respuestas

### 2. Directrices de Seguridad

#### Protección de Información:
- **Privacidad del usuario**: No compartir información personal sin consentimiento
- **Confidencialidad**: Mantener la confidencialidad de las conversaciones
- **Datos sensibles**: Cuidado especial con información sensible

#### Prevención de Daño:
- **Contenido inapropiado**: No generar contenido dañino, ofensivo o inapropiado
- **Información peligrosa**: Evitar instrucciones para actividades peligrosas
- **Consejos médicos**: No dar consejos médicos, legales o financieros específicos

### 3. Limitaciones y Alcance

**Lo que NO puede hacer:**
- ❌ Diagnosticar condiciones médicas
- ❌ Proporcionar asesoría legal específica
- ❌ Hacer predicciones sobre mercados financieros
- ❌ Acceder a información privada de otros
- ❌ Realizar acciones físicas en el mundo real

**Lo que SÍ puede hacer:**
- ✅ Proporcionar información educativa general
- ✅ Sugerir recursos y fuentes de información
- ✅ Facilitar el proceso de aprendizaje
- ✅ Ofrecer orientación general en áreas de expertise

### 4. Restricciones Específicas del Curso

**Ubicación**: `prompts/system.es.md`

- ✅ **Responder ÚNICAMENTE** basándose en la transcripción del video actual
- ✅ **Indicar claramente** cuando la información no está en el video
- ✅ **NUNCA inventar** información que no esté en la transcripción
- ✅ **Sugerir revisar** otros videos o materiales cuando sea apropiado

---

## API y Endpoints

### Endpoint Principal: `/api/openai`

**Método**: POST  
**Ubicación**: `server.js` (líneas 4349-4483)

#### Request:
```javascript
{
    "prompt": "Mensaje del usuario",
    "context": "Contexto del curso actual"
}
```

#### Headers requeridos:
```
Content-Type: application/json
Authorization: Bearer <token>
x-user-id: <user_id>
```

#### Response:
```javascript
{
    "response": "Respuesta de LIA",
    "usage": {
        "prompt_tokens": 123,
        "completion_tokens": 456,
        "total_tokens": 579
    },
    "cost": "0.000123",
    "responseTime": 1234
}
```

#### Configuración de OpenAI:

```javascript
{
    model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
    messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
    ],
    max_tokens: parseInt(process.env.CHATBOT_MAX_TOKENS || '1000', 10),
    temperature: parseFloat(process.env.CHATBOT_TEMPERATURE || '0.5', 10),
    top_p: 0.9
}
```

#### Variables de Entorno:

```env
OPENAI_API_KEY=<tu-api-key>
CHATBOT_MODEL=gpt-4o-mini
CHATBOT_MAX_TOKENS=1000
CHATBOT_TEMPERATURE=0.5
```

---

## Validación y Sanitización

### Flujo de Validación

1. **Validación del mensaje** (Cliente):
   ```javascript
   // Verificar que no esté vacío
   if (!message.trim()) return;
   
   // Validar longitud
   const validation = validateUserInput(message);
   if (!validation.isValid) {
       // Mostrar error al usuario
       return;
   }
   ```

2. **Sanitización básica** (Cliente):
   ```javascript
   // Aplicar sanitización para prevenir XSS
   const sanitized = sanitizeText(message);
   ```

3. **Validación en servidor** (Backend):
   ```javascript
   // Verificar que el prompt existe
   if (!prompt) {
       return res.status(400).json({ error: 'Prompt requerido' });
   }
   
   // Verificar autenticación
   if (!authHeader || !userId) {
       return res.status(401).json({ error: 'Autenticación requerida' });
   }
   ```

### Funciones de Validación Disponibles

**Archivo**: `src/utils/helpers.js`

```javascript
// Validar entrada de usuario
validateUserInput(input)
// Retorna: { isValid: boolean, error?: string, value?: string }

// Sanitizar texto
sanitizeText(text)
// Retorna: string sanitizado

// Validar email
isValidEmail(email)
// Retorna: boolean
```

---

## Configuración

### Configuración del Cliente

**Archivo**: `src/Chat-Online/components/lia-chat.js`

```javascript
const LIA_CONFIG = {
    name: 'Lia',
    typingSpeed: 50,
    responseDelay: 1000,
    audioEnabled: false,
    openai: {
        model: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.5
    }
};
```

### Estado del Chat

```javascript
let liaChatState = {
    isTyping: false,
    conversationHistory: [],
    currentTopic: null,
    userName: '',
    currentState: 'start',
    typingToken: 0
};
```

### Almacenamiento

- **Historial**: `localStorage.getItem('liaConversationHistory')`
- **Mensajes en cola (offline)**: `localStorage.getItem('liaQueuedMessages')`
- **Preferencias de usuario**: Almacenadas en la base de datos

---

## Funcionalidades Adicionales

### 1. Sugerencias de Seguimiento

LIA genera automáticamente sugerencias basadas en el contexto de la conversación:

```javascript
generateFollowUpSuggestions(content, message) {
    // Analiza el contenido de la respuesta para generar sugerencias relevantes
    // Retorna hasta 3 sugerencias contextuales
}
```

### 2. Acciones Sugeridas

LIA puede sugerir acciones específicas:

- **Ver momento específico del video**: Si la respuesta menciona un timestamp
- **Hacer ejercicio**: Si se menciona práctica o ejercicio
- **Tomar nota**: Si hay información importante
- **Ver recursos**: Si se menciona documentación
- **Hacer quiz**: Si se menciona evaluación

### 3. Manejo Offline

Si no hay conexión, los mensajes se guardan en cola:

```javascript
processQueuedMessages() {
    const queued = localStorage.getItem('liaQueuedMessages');
    if (queued) {
        const messages = JSON.parse(queued);
        messages.forEach(async (message) => {
            await this.sendMessage(message.content, message.context);
        });
        localStorage.removeItem('liaQueuedMessages');
    }
}
```

---

## Problemas Conocidos y Mejoras Pendientes

### Problemas Actuales:

1. **Detección de Prompt Injection**: No hay validación específica para detectar intentos de prompt injection
2. **Contexto Hardcodeado**: Parte del contexto está hardcodeado en lugar de ser dinámico
3. **Sanitización Básica**: La sanitización actual solo previene XSS básico
4. **Sin Rate Limiting**: No hay límite de solicitudes por usuario
5. **Logging Limitado**: No se registran intentos sospechosos

### Mejoras Recomendadas:

1. **Implementar detección de prompt injection** con patrones regex
2. **Añadir rate limiting** por usuario/IP
3. **Mejorar sanitización** con bibliotecas especializadas (DOMPurify)
4. **Implementar logging** de intentos sospechosos
5. **Hacer el contexto completamente dinámico** desde la base de datos
6. **Añadir validación de contenido** antes de enviar a OpenAI
7. **Implementar sistema de moderación** de contenido

---

## Archivos Relevantes

### Frontend:
- `src/Chat-Online/chat-online.html` - Página principal del chat
- `src/Chat-Online/components/lia-chat.js` - Componente principal de LIA
- `src/Chat-Online/chat-online.js` - Clase ChatOnline
- `src/Chat-Online/chat-online-v2.js` - Versión mejorada
- `src/utils/helpers.js` - Utilidades (validación, sanitización)

### Backend:
- `server.js` - Endpoint `/api/openai` (líneas 4349-4483)

### Prompts:
- `prompts/system.es.md` - Prompt principal del sistema
- `prompts/safety.es.md` - Restricciones éticas y de seguridad
- `prompts/course-knowledge-prompt.md` - Prompt para conocimiento del curso

---

## Conclusión

LIA está implementado como un sistema de chat educativo que utiliza OpenAI para generar respuestas contextualizadas basadas en:

1. **Contexto del curso/módulo/video actual**
2. **Transcripción del video** (si está disponible)
3. **Historial de conversación** del usuario
4. **Restricciones éticas** definidas en los prompts

La implementación actual funciona pero tiene áreas de mejora, especialmente en:
- **Detección y prevención de prompt injection**
- **Sanitización más robusta**
- **Rate limiting y seguridad adicional**
- **Contexto completamente dinámico**

Para la refactorización a React/TypeScript/API Rest, se recomienda mantener estos principios fundamentales pero modernizando la arquitectura y mejorando las medidas de seguridad.

---

## Información Adicional para Migración

### Dependencias NPM Necesarias

**Archivo**: `package.json`

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.56.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "node-fetch": "^2.7.0",
    "pg": "^8.11.3",
    "socket.io": "^4.8.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1"
  }
}
```

**Comandos de instalación:**
```bash
npm install
# o para desarrollo
npm run setup
```

---

### Estructura de Datos Completa

#### 1. Contexto del Curso

```typescript
interface CourseContext {
    // Contexto hardcodeado (implementación actual)
    taller: string;
    tipo: string;
    tutor: string;
    modalidad: string;
    module: number;
    moduleTitle: string;
    moduleDescription: string;
    documentoApoyo: string;
    
    // Contexto del video
    videoTimestamp: number;
    videoTitle: string;
    
    // Contexto del usuario
    userProgress: number;
    totalModules: number;
    objetivos: string[];
    contextoEducativo: string;
    nivelDificultad: 'Principiante' | 'Intermedio' | 'Avanzado';
    enfoque: string;
    
    // Historial
    conversationHistory: ConversationMessage[];
    
    // Prompt del sistema
    systemPrompt: string;
}

// Contexto enriquecido (versión v2)
interface EnrichedContext {
    courseInfo: {
        title: string;
        description: string;
        instructor: string;
        level: string;
        duration: string;
        learningPath: string;
    };
    currentModule: {
        title: string;
        description: string;
    };
    currentVideo: {
        video_title: string;
        description: string;
        transcript_text: string;
        summary: string;
        key_concepts: string[];
        descripcion_actividad?: string;
        prompts_actividad?: string;
        duration_minutes: number;
    };
    videoTime: number;
    hasActivities: boolean;
    totalModules: number;
}
```

#### 2. Mensaje de Conversación

```typescript
interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date | number;
    context?: string;  // Contexto del módulo/video
    module?: number;
    taller?: string;
    documento?: string;
}

// Estructura del historial (localStorage)
interface ConversationHistoryEntry {
    userMessage: string;      // Truncado a 300 caracteres
    liaResponse: string;       // Truncado a 500 caracteres
    timestamp: number;         // Date.now()
    videoContext: string;      // Título del video actual
}
```

#### 3. Estado del Chat

```typescript
interface LiaChatState {
    isTyping: boolean;
    conversationHistory: ConversationMessage[];
    currentTopic: string | null;
    userName: string;
    currentState: 'start' | 'active' | 'ended';
    typingToken: number;
    connectionStatus?: 'connected' | 'disconnected' | 'reconnecting';
}
```

#### 4. Respuesta de la API

```typescript
interface LiaAPIResponse {
    response: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    cost?: string;
    responseTime?: number;
}

// Respuesta procesada del componente
interface ProcessedLiaResponse {
    success: boolean;
    content: string;
    suggestions?: string[];
    actions?: SuggestedAction[];
    metadata?: {
        timestamp: Date;
        context: string;
        confidence: number;
    };
    error?: string;
}

interface SuggestedAction {
    id: string;
    label: string;
    icon: string;
    data: Record<string, any>;
}
```

#### 5. Contexto Personalizado

```typescript
interface PersonalizedContext {
    usuario: {
        nombre: string;
        preferencias: string[];
        nivelCompresion: string;
        temasInteres: string[];
    };
    conversacion: {
        intencionActual: string;
        temaActual: string;
        mensajesRecientes: Array<{
            role: 'user' | 'assistant';
            content: string;
            timestamp: Date | number;
        }>;
    };
    adaptacion: {
        evitarRepeticion: {
            detectado: boolean;
            sugerencia: string;
        };
        personalizarTono: {
            estilo: string;
            sugerencia: string;
        };
        sugerirSiguientePaso: {
            accion: string;
        };
    };
}
```

---

### Autenticación y Tokens

#### 1. Obtención del Token

**Ubicación**: `chat-online.html` - función `obtenerTokenAuth()`

```javascript
function obtenerTokenAuth() {
    // 1. Intentar obtener token real del localStorage
    const token = localStorage.getItem('authToken');
    
    if (token) {
        return token;
    }
    
    // 2. Fallback: Obtener de userToken
    const userToken = localStorage.getItem('userToken');
    if (userToken) {
        return userToken;
    }
    
    // 3. Desarrollo: Crear token JWT mock
    const currentUser = obtenerUsuarioActual();
    const userId = currentUser?.id || 'chat-online-user';
    const username = currentUser?.username || 'dev-user';
    
    // Crear payload del JWT
    const payload = btoa(JSON.stringify({
        sub: userId,
        username: username,
        iat: Math.floor(Date.now() / 1000)
    }));
    
    // Crear header del JWT
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    
    // Token de desarrollo con formato JWT válido
    return `${header}.${payload}.fake-signature-for-dev-testing-only`;
}
```

#### 2. Validación del Token en Servidor

**Ubicación**: `server.js` - Endpoint `/api/openai`

```javascript
// El servidor valida:
const authHeader = req.headers.authorization;
const userId = req.headers['x-user-id'];

if (!authHeader || !userId) {
    return res.status(401).json({ error: 'Autenticación requerida' });
}

// Para desarrollo, acepta tokens con "fake-signature"
// Para producción, debe validar JWT real
```

#### 3. Headers de Autenticación

```javascript
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'x-user-id': currentUser?.id || 'unknown-user'
};
```

---

### Ejemplos Completos de Request/Response

#### 1. Request a la API

```javascript
POST /api/openai
Headers:
    Content-Type: application/json
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    x-user-id: user-123

Body:
{
    "prompt": "¿Qué es el Machine Learning?",
    "context": "Módulo actual: Fundamentos de IA. Tiempo del video: 15:30. Transcripción: Machine Learning es..."
}
```

#### 2. Response Exitoso

```javascript
Status: 200 OK
Body:
{
    "response": "🎥 **Basándome en el video \"Fundamentos de IA\":**\n\nMachine Learning es...",
    "usage": {
        "prompt_tokens": 245,
        "completion_tokens": 156,
        "total_tokens": 401
    },
    "cost": "0.000245",
    "responseTime": 1234
}
```

#### 3. Response de Error

```javascript
Status: 401 Unauthorized
Body:
{
    "error": "Autenticación requerida"
}

Status: 400 Bad Request
Body:
{
    "error": "Prompt requerido"
}

Status: 500 Internal Server Error
Body:
{
    "error": "Error procesando la solicitud",
    "details": "OPENAI_API_KEY no está configurada en el servidor"
}
```

---

### Configuración Completa de Variables de Entorno

**Archivo**: `.env`

```env
# OpenAI Configuration (OBLIGATORIO)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Chatbot Configuration (Opcional, con defaults)
CHATBOT_MODEL=gpt-4o-mini
CHATBOT_MAX_TOKENS=1000
CHATBOT_TEMPERATURE=0.5

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Security Configuration
NODE_ENV=production
SESSION_SECRET=your-session-secret-here
API_SECRET_KEY=your-api-secret-key-here
USER_JWT_SECRET=your_jwt_secret_here

# Server Configuration
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Frontend URL (para emails/redirects)
FRONTEND_URL=https://yourdomain.com
```

---

### Estructura de Historial de Conversación

#### 1. Almacenamiento en localStorage

**Clave**: `liaConversationHistory`

**Estructura**:
```javascript
window.liaConversationHistory = [
    {
        userMessage: "¿Qué es Machine Learning?",  // Truncado a 300 chars
        liaResponse: "Machine Learning es...",     // Truncado a 500 chars
        timestamp: 1704067200000,
        videoContext: "Fundamentos de IA"
    },
    // ... máximo 3 elementos
]
```

#### 2. Historial en el Componente LiaChat

**Clave**: `liaConversationHistory` (mismo nombre, diferente estructura)

**Estructura**:
```javascript
this.conversationHistory = [
    {
        role: 'user',
        content: '¿Qué es Machine Learning?',
        timestamp: new Date(),
        context: 'Fundamentos de Inteligencia Artificial',
        module: 1,
        taller: 'Taller de fundamentos de IA',
        documento: 'Doc de apoyo - Fundamentos de IA.pdf'
    },
    {
        role: 'assistant',
        content: 'Machine Learning es...',
        timestamp: new Date(),
        context: 'Fundamentos de Inteligencia Artificial',
        module: 1,
        taller: 'Taller de fundamentos de IA',
        documento: 'Doc de apoyo - Fundamentos de IA.pdf'
    }
    // ... máximo 50 mensajes
]
```

#### 3. Memoria Conversacional

**Clave**: `conversationMemory`

**Estructura**:
```javascript
conversationMemory = {
    // Contexto inmediato (1-2 mensajes)
    lastBotAction: null,
    lastUserIntent: null,
    awaitingConfirmation: null,
    
    // Historial completo
    fullHistory: [
        {
            role: 'user' | 'bot',
            message: string,
            timestamp: string,
            questionType?: string,
            metadata?: object
        }
    ],
    
    // Memoria de largo plazo
    userPreferences: {},
    mentionedTopics: Set<string>,
    previousQuestions: string[],
    
    // Estado de la conversación
    conversationStarted: string,  // ISO date
    lastActivity: string,          // ISO date
    sessionId: string
}
```

---

### URLs de API según Entorno

```javascript
function getApiUrl(endpoint) {
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    const currentPort = window.location.port;
    
    // Localhost con puerto 3000 (desarrollo Express)
    if (isLocalhost && (currentPort === '3000' || window.location.href.includes(':3000'))) {
        return `/api${endpoint}`;
    }
    
    // Localhost con puerto 8888 (Netlify Dev)
    if (isLocalhost && currentPort === '8888') {
        return `/.netlify/functions${endpoint}`;
    }
    
    // Producción (Netlify)
    return `/.netlify/functions${endpoint}`;
}

// Uso:
const apiUrl = getApiUrl('/openai');  // → /.netlify/functions/openai o /api/openai
```

---

### Manejo de Errores Completos

#### 1. Errores de Red

```javascript
try {
    const response = await fetch(apiUrl, options);
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
} catch (error) {
    if (error.name === 'AbortError') {
        // Timeout
        return {
            success: false,
            content: 'La solicitud tardó demasiado. Por favor, inténtalo de nuevo.',
            error: 'timeout'
        };
    }
    
    if (error.message.includes('401')) {
        // No autorizado
        return {
            success: false,
            content: 'Error de autenticación. Por favor, inicia sesión nuevamente.',
            error: 'unauthorized'
        };
    }
    
    // Error genérico
    return {
        success: false,
        content: 'Error de conexión. Por favor, verifica tu conexión a internet.',
        error: error.message
    };
}
```

#### 2. Errores de OpenAI API

```javascript
// En el servidor (server.js)
if (!openaiResponse.ok) {
    const errorText = await openaiResponse.text();
    console.error('[OPENAI API] ❌ Error:', errorText);
    
    // Errores comunes:
    // - 401: API key inválida
    // - 429: Rate limit excedido
    // - 500: Error interno de OpenAI
    // - 503: Servicio no disponible
    
    return res.status(500).json({
        error: 'Error en la API de OpenAI',
        details: `Status ${openaiResponse.status}: ${errorText.substring(0, 200)}`
    });
}
```

---

### Consideraciones para Migración a React/TypeScript

#### 1. Tipos TypeScript

```typescript
// types/lia.types.ts
export interface LiaChatProps {
    apiEndpoint: string;
    onMessage?: (message: string) => void;
    onError?: (error: Error) => void;
}

export interface UseLiaChatReturn {
    sendMessage: (message: string, context?: CourseContext) => Promise<LiaAPIResponse>;
    isLoading: boolean;
    error: Error | null;
    conversationHistory: ConversationMessage[];
    clearHistory: () => void;
}
```

#### 2. Hook de React

```typescript
// hooks/useLiaChat.ts
export function useLiaChat(apiEndpoint: string): UseLiaChatReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
    
    const sendMessage = async (message: string, context?: CourseContext) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'x-user-id': getCurrentUserId()
                },
                body: JSON.stringify({
                    prompt: message,
                    context: context || getCourseContext()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Actualizar historial
            setConversationHistory(prev => [
                ...prev,
                { role: 'user', content: message, timestamp: new Date() },
                { role: 'assistant', content: data.response, timestamp: new Date() }
            ]);
            
            return data;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };
    
    const clearHistory = () => {
        setConversationHistory([]);
        localStorage.removeItem('liaConversationHistory');
    };
    
    return {
        sendMessage,
        isLoading,
        error,
        conversationHistory,
        clearHistory
    };
}
```

#### 3. Componente React

```typescript
// components/LiaChat.tsx
import { useLiaChat } from '../hooks/useLiaChat';

export function LiaChat({ apiEndpoint }: LiaChatProps) {
    const { sendMessage, isLoading, error, conversationHistory } = useLiaChat(apiEndpoint);
    const [message, setMessage] = useState('');
    
    const handleSend = async () => {
        if (!message.trim()) return;
        
        try {
            await sendMessage(message);
            setMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };
    
    return (
        <div className="lia-chat">
            {/* Render conversation history */}
            {/* Input and send button */}
        </div>
    );
}
```

---

### Checklist para Migración

#### Frontend:
- [ ] Instalar dependencias (`npm install`)
- [ ] Configurar variables de entorno (`.env`)
- [ ] Implementar tipos TypeScript (interfaces)
- [ ] Crear hook `useLiaChat`
- [ ] Crear componente `LiaChat`
- [ ] Implementar gestión de estado (Context/Redux)
- [ ] Migrar funciones de validación
- [ ] Migrar funciones de sanitización
- [ ] Implementar manejo de errores
- [ ] Migrar almacenamiento en localStorage

#### Backend:
- [ ] Configurar endpoint `/api/openai` o equivalente
- [ ] Configurar autenticación JWT
- [ ] Configurar variables de entorno
- [ ] Implementar rate limiting
- [ ] Implementar logging
- [ ] Configurar manejo de errores
- [ ] Implementar validación de entrada
- [ ] Configurar CORS

#### Seguridad:
- [ ] Implementar detección de prompt injection
- [ ] Implementar sanitización robusta
- [ ] Implementar rate limiting por usuario
- [ ] Configurar validación de tokens
- [ ] Implementar logging de intentos sospechosos

---

**Última actualización**: Diciembre 2024  
**Versión del documento**: 2.0  
**Información adicional agregada**: Dependencias, estructura de datos, autenticación, ejemplos completos

