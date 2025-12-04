# PLAN LIA PROMPTS - SISTEMA CONVERSACIONAL DE CREACIÓN Y GESTIÓN DE PROMPTS

**Proyecto:** Aprende y Aplica
**Fecha de creación:** 2025-12-02
**Autor:** Claude (Arquitecto de Software Senior)
**Versión:** 1.0

---

## ÍNDICE

1. [Resumen Técnico del Estado Actual](#1-resumen-técnico-del-estado-actual)
2. [Etapa 1: Activación Automática y Navegación Guiada](#2-etapa-1-activación-automática-y-navegación-guiada)
3. [Etapa 2: Sistema Conversacional Adaptado al Perfil](#3-etapa-2-sistema-conversacional-adaptado-al-perfil)
4. [Etapa 3: Integración de Prompt Packs de OpenAI](#4-etapa-3-integración-de-prompt-packs-de-openai)
5. [Roadmap y Prioridades](#5-roadmap-y-prioridades)
6. [Mapa de Archivos y Componentes](#6-mapa-de-archivos-y-componentes)
7. [Consideraciones Finales](#7-consideraciones-finales)

---

## 1. RESUMEN TÉCNICO DEL ESTADO ACTUAL

### 1.1 Framework y Stack Tecnológico

**Frontend:**
- **Framework:** Next.js 15.5.4 (App Router)
- **Lenguaje:** TypeScript 5.9.3
- **UI:** React 19.1.0, TailwindCSS 3.4.18
- **Componentes:** Radix UI, Headless UI, Framer Motion
- **Estado:** Zustand 5.0.2, SWR para data fetching
- **i18n:** next-i18next (español, inglés, portugués)

**Backend:**
- **Framework:** Express 4.18.2 (actualmente con endpoints placeholder)
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth + JWT dual (refresh tokens + legacy session)

**IA e Integración:**
- **LLM:** OpenAI GPT-4o-mini (default), GPT-4o (alta calidad)
- **Voz (TTS):** ElevenLabs API (voz: `15Y62ZlO8it2f5wduybx`, modelo: `eleven_turbo_v2_5`)
- **Voz (STT):** Web Speech API (reconocimiento de voz del navegador)
- **Analytics:** Session Recording con rrweb
- **Moderación:** OpenAI Moderation API

**Arquitectura:**
- **Patrón:** Screaming Architecture (organizado por features)
- **Monorepo:** Workspace con `apps/web`, `apps/api`, `packages/shared`

---

### 1.2 Dónde Vive el Chat de LIA

#### A) Chat Global (LIA en Todas Partes)

**Componente Principal:**
```
apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx
```

**Características actuales:**
- Botón flotante en esquina inferior derecha
- Arrastrable y posicionable
- Visible en TODAS las páginas excepto:
  - `/` (landing page)
  - `/auth/*` (autenticación)
  - `/courses/[slug]/learn` (tiene chat propio integrado)
- Dos modos:
  - **Modo normal:** Conversación general con LIA
  - **Modo prompt:** Creación de prompts con IA
- Persistencia: localStorage (últimos 7 mensajes)
- Extracción automática de contexto del DOM
- Detección automática de contexto según URL

**API Endpoint:**
```
POST /api/ai-chat
```
- Ubicación: `apps/web/src/app/api/ai-chat/route.ts`
- 1,433 líneas de código
- Lógica completa de conversación con OpenAI
- System prompt adaptativo según contexto
- Límite de historial: 20 mensajes

#### B) Chat del Taller (Integrado en Cursos)

**Ubicación:**
```
apps/web/src/app/courses/[slug]/learn/page.tsx
```
- **URL:** `/courses/[slug]/learn`
- **Tamaño:** 8,679 líneas de código
- **Tipo:** Client Component

**Hook Principal:**
```
apps/web/src/core/hooks/useLiaChat.ts
```

**Características:**
- Integrado en panel lateral derecho de la vista de aprendizaje
- Contexto rico: curso, módulo, lección, actividad, transcripción de video
- Actividades interactivas con tipo `'ai_chat'`
- Detección proactiva de dificultades (via rrweb)
- Persistencia en Supabase: tablas `lia_conversations` y `lia_messages`

**Contexto enviado:**
```typescript
{
  context: 'course',
  courseContext: {
    courseTitle, moduleTitle, lessonTitle,
    activityTitle, activityDescription,
    videoTranscript, lessonSummary
  },
  conversationHistory: Message[],
  userInfo: { display_name, type_rol, cargo_rol }
}
```

#### C) Ayuda Proactiva

**Componentes:**
```
apps/web/src/components/ProactiveLIAAssistant/ProactiveLIAAssistant.tsx
apps/web/src/hooks/useDifficultyDetection.ts
```

**Funcionalidad:**
- Detecta patrones de dificultad con rrweb (session recording)
- Muestra modal flotante: "LIA está aquí para ayudar"
- Si el usuario acepta, abre el chat con contexto de la dificultad

---

### 1.3 Dónde Está el Prompt Directory

#### Estructura Completa Existente

**Rutas:**
- `/prompt-directory` - Exploración y búsqueda
- `/prompt-directory/[slug]` - Detalle del prompt
- `/prompt-directory/create` - Creación con IA (Prompt Maker)

**Feature Module:**
```
apps/web/src/features/ai-directory/
├── components/
│   ├── PromptCard.tsx
│   ├── PromptRatingInline.tsx
│   ├── SearchBar.tsx
│   └── ...
├── hooks/
│   ├── usePrompts.ts
│   ├── usePromptFavorites.ts
│   └── ...
├── services/
│   ├── prompt-favorites.service.ts
│   └── prompt-rating.service.ts
├── context/
│   └── PromptFavoritesContext.tsx
└── config/
    └── prompt-directory-tour.ts
```

**API Endpoints:**
```
GET  /api/ai-directory/prompts              # Lista con filtros y búsqueda
GET  /api/ai-directory/prompts/[slug]       # Detalle individual
POST /api/ai-directory/prompts/[slug]/view  # Incrementar contador
GET  /api/ai-directory/prompts/[slug]/rating # Obtener rating del usuario
POST /api/ai-directory/prompts/[slug]/rating # Crear/actualizar rating
POST /api/ai-directory/generate-prompt      # Generación con IA
GET  /api/ai-directory/categories           # Lista de categorías
```

**Funcionalidades Actuales:**
✅ Búsqueda en tiempo real
✅ Filtros por categoría, dificultad, destacados, favoritos
✅ Sistema de calificación (1-5 estrellas + review)
✅ Sistema de favoritos (vinculado a usuario)
✅ Generación con IA usando GPT-4o
✅ Protección contra prompt injection
✅ Descarga como .txt
✅ Copiar al portapapeles
✅ Tour de voz contextual
✅ Paginación

**Limitaciones Actuales:**
❌ NO hay detección automática de intención de crear prompts
❌ NO está integrado con el chat del taller de forma automática
❌ NO se adapta automáticamente al perfil profesional del usuario
❌ NO hay generación conversacional guiada por pasos
❌ NO hay guardado automático en la biblioteca desde el chat

---

### 1.4 Modelo de Datos en Supabase

#### Tablas Existentes (Prompts)

**`ai_prompts`** - Tabla principal de prompts
```sql
CREATE TABLE ai_prompts (
  prompt_id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT NOT NULL,              -- Contenido del prompt
  category_id UUID REFERENCES ai_categories,
  author_id UUID REFERENCES usuarios,
  tags TEXT[],                        -- Array de tags
  difficulty_level TEXT,              -- 'beginner', 'intermediate', 'advanced'
  estimated_time_minutes INTEGER,
  use_cases TEXT[],
  tips TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2),                -- Promedio de calificaciones
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**`prompt_favorites`** - Favoritos de usuarios
```sql
CREATE TABLE prompt_favorites (
  favorite_id UUID PRIMARY KEY,
  user_id UUID REFERENCES usuarios NOT NULL,
  prompt_id UUID REFERENCES ai_prompts NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);
```

**`prompt_ratings`** - Calificaciones de usuarios
```sql
CREATE TABLE prompt_ratings (
  rating_id UUID PRIMARY KEY,
  user_id UUID REFERENCES usuarios NOT NULL,
  prompt_id UUID REFERENCES ai_prompts NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);
```

**`ai_categories`** - Categorías de prompts
```sql
CREATE TABLE ai_categories (
  category_id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tablas Existentes (LIA y Conversaciones)

**`lia_conversations`** - Conversaciones con LIA
```sql
CREATE TABLE lia_conversations (
  conversation_id UUID PRIMARY KEY,
  user_id UUID REFERENCES usuarios NOT NULL,
  context_type TEXT,                  -- 'general', 'course', 'workshop', 'prompts'
  course_id UUID REFERENCES courses,
  module_id UUID REFERENCES modulos,
  lesson_id UUID REFERENCES lecciones,
  activity_id UUID REFERENCES actividades,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  total_messages INTEGER DEFAULT 0,
  total_lia_messages INTEGER DEFAULT 0,
  device_type TEXT,
  browser TEXT,
  ip_address TEXT,
  is_completed BOOLEAN DEFAULT false
);
```

**`lia_messages`** - Mensajes individuales
```sql
CREATE TABLE lia_messages (
  message_id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES lia_conversations NOT NULL,
  role TEXT NOT NULL,                 -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  is_system_message BOOLEAN DEFAULT false,
  model_used TEXT,                    -- 'gpt-4o-mini', 'gpt-4o'
  tokens_used INTEGER,
  cost_usd NUMERIC(10,6),
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`lia_user_feedback`** - Feedback de usuarios
```sql
CREATE TABLE lia_user_feedback (
  feedback_id UUID PRIMARY KEY,
  message_id UUID REFERENCES lia_messages,
  conversation_id UUID REFERENCES lia_conversations,
  user_id UUID REFERENCES usuarios NOT NULL,
  feedback_type TEXT,                 -- 'helpful', 'not_helpful', 'incorrect', 'confusing'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tablas Existentes (Usuarios y Perfiles)

**`users`** - Usuarios del sistema
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  cargo_rol TEXT,                     -- ROL DE SISTEMA: 'Usuario', 'Administrador', etc.
  type_rol TEXT,                      -- PERFIL PROFESIONAL: 'Ingeniero', 'Marketing Manager', etc.
  organization_id UUID REFERENCES organizations,
  profile_picture_url TEXT,
  -- ... más campos
);
```

**`user_perfil`** - Perfil profesional detallado
```sql
CREATE TABLE user_perfil (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users NOT NULL,
  cargo_titulo TEXT,                  -- Cargo/título profesional
  pais TEXT,
  area_id INTEGER REFERENCES areas,   -- Área funcional (Marketing, Ingeniería, etc.)
  rol_id INTEGER REFERENCES roles,    -- Rol específico dentro del área
  nivel_id INTEGER REFERENCES niveles, -- Nivel jerárquico
  sector_id INTEGER REFERENCES sectores,
  uso_ia_respuesta TEXT,              -- Experiencia con IA
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 1.5 Cómo Se Maneja el Contexto/Estado del Usuario

#### A) Autenticación

**Sistema Dual:**
1. **Sistema nuevo:** Refresh tokens + access tokens
   - Tabla: `refresh_tokens`
   - Cookies: `access_token`, `refresh_token`
2. **Sistema legacy:** Sesiones JWT tradicionales
   - Tabla: `user_session`
   - Cookie: `aprende-y-aplica-session`

**Servicio Principal:**
```typescript
// apps/web/src/features/auth/services/session.service.ts
SessionService.getCurrentUser()
```

#### B) Acceso al Usuario en Componentes Cliente

**Hook Principal (RECOMENDADO):**
```typescript
// apps/web/src/features/auth/hooks/useAuth.ts
import { useAuth } from '@/features/auth/hooks/useAuth'

const { user, loading, isAuthenticated, logout, refreshUser } = useAuth()

// user contiene:
// - id, email, username, first_name, last_name, display_name
// - cargo_rol (rol de sistema: 'Usuario', 'Administrador', etc.)
// - type_rol (perfil profesional: 'Ingeniero', 'Marketing Manager', etc.)
// - organization_id
// - profile_picture_url
```

**Tecnología:** SWR para caché y deduplicación automática

#### C) Contexto de LIA

**Contexto Adaptativo Según URL:**
```typescript
// apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx

function detectContextFromURL(pathname: string): string {
  if (pathname.includes('/communities')) return 'communities';
  if (pathname.includes('/courses')) return 'courses';
  if (pathname.includes('/workshops')) return 'workshops';
  if (pathname.includes('/news')) return 'news';
  if (pathname.includes('/prompt-directory')) return 'prompts';
  if (pathname.includes('/business-panel')) return 'business';
  if (pathname.includes('/profile')) return 'profile';
  return 'general';
}
```

**Extracción de Contenido del DOM:**
- Título de la página (document.title)
- Meta description
- Encabezados principales (h1, h2)
- Texto visible del contenido principal (hasta 800 caracteres)

**System Prompt Contextual:**
Cada contexto tiene un system prompt específico que incluye:
- Restricciones de contenido
- Información del usuario (nombre, rol profesional)
- Contexto de la página actual
- Contexto de la plataforma completa (páginas disponibles)
- Instrucciones de idioma (es, en, pt)
- Instrucciones anti-Markdown

---

### 1.6 Estado de las Funcionalidades Solicitadas

| Funcionalidad | Estado Actual | Ubicación |
|--------------|---------------|-----------|
| **Chat de LIA global** | ✅ Completo | `AIChatAgent.tsx` |
| **Chat del taller** | ✅ Completo | `/courses/[slug]/learn` |
| **Prompt Directory** | ✅ Completo | `/prompt-directory` |
| **Generación de prompts con IA** | ✅ Completo (manual) | `/prompt-directory/create` |
| **Detección de intención de crear prompts** | ❌ No existe | - |
| **Activación automática del modo prompt** | ❌ No existe | - |
| **Generación conversacional guiada** | ❌ No existe | - |
| **Adaptación al perfil del usuario** | ⚠️ Parcial | Solo en system prompt |
| **Guardado automático en biblioteca** | ❌ No existe | - |
| **Navegación guiada desde el chat** | ✅ Completo | Markdown links en LIA |
| **Agente de voz** | ⚠️ Parcial | Solo en onboarding |
| **Prompt Packs de OpenAI** | ❌ No existe | - |

---

## 2. ETAPA 1: ACTIVACIÓN AUTOMÁTICA Y NAVEGACIÓN GUIADA

### 2.1 Objetivos Funcionales

#### Objetivo 1: Detección Automática de Intención de Crear Prompts

**¿Qué queremos lograr?**
Cuando un usuario en el chat del taller (o en el chat global) muestre intención de crear un prompt, el sistema debe:
1. Detectar la intención mediante análisis de texto (NLU básico)
2. Entrar automáticamente en "modo creación de prompts"
3. Iniciar un flujo conversacional guiado
4. Conectar con el Prompt Directory existente

**Patrones de intención a detectar:**
- "quiero crear un prompt para..."
- "necesito un prompt que..."
- "ayúdame a crear un prompt sobre..."
- "cómo hago un prompt para..."
- "genera un prompt de..."
- "crear/generar/hacer un prompt"
- Menciones de "ChatGPT", "Claude", "instrucciones", "system prompt"

#### Objetivo 2: Navegación Guiada desde el Chat

**¿Qué queremos lograr?**
LIA debe poder guiar al usuario a otras secciones del sitio directamente desde el chat:
- Sugerir navegación a secciones relevantes
- Actualizar el contexto de la sesión al navegar
- Mantener el historial de conversación
- Links clickeables en los mensajes

**Ejemplo de flujo:**
```
Usuario: "¿Cómo puedo ver todos los prompts disponibles?"
LIA: "Puedes explorar nuestra [Biblioteca de Prompts](/prompt-directory)
donde encontrarás prompts organizados por categoría. También puedes
crear tus propios prompts con mi ayuda. ¿Te gustaría que te lleve allí?"
```

#### Objetivo 3: Integración Inicial del Agente de Voz

**¿Qué queremos lograr?**
Agregar un botón en el chat de LIA que permita:
- Activar un "recorrido guiado por voz" bajo demanda
- Usuario decide cuándo activar el agente de voz
- Lectura en voz alta de los mensajes de LIA
- Reconocimiento de voz para respuestas del usuario

**Ubicación del botón:**
- En la barra superior del chat (junto al botón de minimizar/cerrar)
- Icono de micrófono/altavoz
- Estados: inactivo, escuchando, hablando

---

### 2.2 Cambios Técnicos Necesarios

#### 2.2.1 Frontend

##### A) Sistema de Detección de Intenciones

**Nuevo servicio:**
```typescript
// apps/web/src/core/services/intent-detection.service.ts

export type Intent =
  | 'create_prompt'
  | 'navigate'
  | 'question'
  | 'feedback'
  | 'general';

export interface IntentResult {
  intent: Intent;
  confidence: number;
  entities?: {
    promptTopic?: string;
    targetPage?: string;
    category?: string;
  };
}

export class IntentDetectionService {
  /**
   * Detecta la intención del mensaje del usuario
   * Usa un enfoque híbrido:
   * 1. Reglas basadas en patrones (regex)
   * 2. Análisis con OpenAI (para casos ambiguos)
   */
  static async detectIntent(message: string): Promise<IntentResult>;

  /**
   * Detección rápida con regex (sin API calls)
   */
  static detectIntentLocal(message: string): IntentResult;

  /**
   * Detección avanzada con OpenAI
   */
  static async detectIntentWithAI(message: string): Promise<IntentResult>;
}
```

**Patrones de detección (regex):**
```typescript
const INTENT_PATTERNS = {
  create_prompt: [
    /\b(crear|generar|hacer|ayuda.*crear|ayúdame.*crear)\b.*\bprompt\b/i,
    /\bprompt\b.*(para|sobre|de)\b/i,
    /\bcómo\b.*(crear|hacer|generar)\b.*\bprompt\b/i,
    /\bnecesito\b.*\bprompt\b/i,
    /\bquiero\b.*\bprompt\b/i,
  ],
  navigate: [
    /\b(ir|llevar|mostrar|ver|navegar)\b.*(a|hacia|al)\b/i,
    /\bdónde\b.*(está|encuentro|veo)\b/i,
    /\bcómo\b.*(accedo|llego)\b/i,
  ],
};
```

**Integración en AIChatAgent:**
```typescript
// apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx

// Agregar en el handler de envío de mensaje
const handleSendMessage = async () => {
  const userMessage = inputMessage.trim();

  // Detectar intención ANTES de enviar a la API
  const intentResult = await IntentDetectionService.detectIntent(userMessage);

  if (intentResult.intent === 'create_prompt' && intentResult.confidence > 0.7) {
    // Activar modo prompt automáticamente
    setIsPromptMode(true);

    // Notificar al usuario
    const systemMessage: Message = {
      id: generateId(),
      text: "He detectado que quieres crear un prompt. Voy a activar el modo de creación de prompts para ayudarte mejor. 🎯",
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString(),
      isSystemMessage: true,
    };

    setNormalMessages(prev => [...prev, systemMessage]);
  }

  // Continuar con el flujo normal...
};
```

##### B) Modo Prompt Mejorado

**Archivo a modificar:**
```
apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx
```

**Cambios:**
1. **Indicador visual mejorado** cuando está en modo prompt
2. **Panel lateral** con progreso del prompt que se está creando
3. **Botón "Guardar en biblioteca"** visible durante la creación
4. **Preview en tiempo real** del prompt formateado

**Nueva estructura de UI:**
```tsx
{isPromptMode && (
  <div className="prompt-mode-indicator">
    <Badge variant="gradient">Modo Creación de Prompts</Badge>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsPromptMode(false)}
    >
      Salir del modo prompt
    </Button>
  </div>
)}

{isPromptMode && currentPromptDraft && (
  <PromptPreviewPanel
    draft={currentPromptDraft}
    onSave={handleSaveToLibrary}
  />
)}
```

**Nuevo componente:**
```typescript
// apps/web/src/core/components/AIChatAgent/PromptPreviewPanel.tsx

interface PromptPreviewPanelProps {
  draft: PromptDraft;
  onSave: (prompt: PromptDraft) => Promise<void>;
}

export function PromptPreviewPanel({ draft, onSave }: PromptPreviewPanelProps) {
  // Vista previa del prompt en construcción
  // Botón para guardar en biblioteca
  // Indicador de completitud (título, descripción, contenido, tags)
}
```

##### C) Sistema de Navegación Guiada

**Mejora en el renderizado de Markdown:**
```typescript
// apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx

// Ya existe renderTextWithLinks(), mejorar para:
const renderTextWithLinks = (text: string) => {
  // 1. Detectar links internos: [texto](/ruta)
  // 2. Detectar links externos: [texto](https://...)
  // 3. Agregar tracking de clicks
  // 4. Actualizar contexto de LIA al navegar

  const handleInternalLinkClick = (href: string) => {
    // Guardar el contexto actual
    saveConversationContext();

    // Navegar
    router.push(href);

    // Actualizar el contexto de LIA
    setCurrentContext(detectContextFromURL(href));

    // Notificar al usuario
    addSystemMessage(`He actualizado mi contexto a: ${getContextLabel(href)}`);
  };
};
```

**Metadatos de páginas ya disponibles:**
```typescript
// apps/web/src/lib/lia/page-metadata.ts
// Ya existe y está completo, NO requiere cambios
```

##### D) Agente de Voz

**Nuevo componente:**
```typescript
// apps/web/src/core/components/AIChatAgent/VoiceAgent.tsx

interface VoiceAgentProps {
  isActive: boolean;
  onToggle: () => void;
  currentMessage?: string;
}

export function VoiceAgent({ isActive, onToggle, currentMessage }: VoiceAgentProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Text-to-Speech (ElevenLabs)
  const speakMessage = async (text: string) => {
    // Usar ElevenLabs API (igual que OnboardingAgent)
    // Fallback a Web Speech API si falla
  };

  // Speech-to-Text (Web Speech API)
  const startListening = () => {
    // Usar Web Speech API (igual que OnboardingAgent)
  };

  return (
    <div className="voice-agent">
      <Button
        variant={isActive ? 'primary' : 'ghost'}
        size="sm"
        onClick={onToggle}
        className="voice-toggle"
      >
        {isActive ? <MicOnIcon /> : <MicOffIcon />}
      </Button>

      {isActive && (
        <div className="voice-controls">
          <Button onClick={() => speakMessage(currentMessage)}>
            <SpeakerIcon /> Leer en voz alta
          </Button>
          <Button
            onClick={startListening}
            disabled={isListening || isSpeaking}
          >
            <MicIcon /> {isListening ? 'Escuchando...' : 'Hablar'}
          </Button>
        </div>
      )}
    </div>
  );
}
```

**Integración en AIChatAgent:**
```typescript
// apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx

const [voiceAgentActive, setVoiceAgentActive] = useState(false);

// En la barra superior del chat
<div className="chat-header">
  <h3>LIA - Tu Asistente IA</h3>
  <div className="chat-actions">
    <VoiceAgent
      isActive={voiceAgentActive}
      onToggle={() => setVoiceAgentActive(!voiceAgentActive)}
      currentMessage={messages[messages.length - 1]?.text}
    />
    <Button onClick={handleMinimize}>
      <MinimizeIcon />
    </Button>
    <Button onClick={handleClose}>
      <CloseIcon />
    </Button>
  </div>
</div>
```

#### 2.2.2 Backend / API

##### A) Endpoint de Detección de Intenciones (Opcional)

**Para casos ambiguos que requieren análisis con IA:**

```typescript
// apps/web/src/app/api/ai-intent/route.ts

export async function POST(request: Request) {
  const { message } = await request.json();

  // Usar OpenAI para detectar intención
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un clasificador de intenciones. Analiza el mensaje del usuario y devuelve SOLO un JSON con este formato:
{
  "intent": "create_prompt" | "navigate" | "question" | "feedback" | "general",
  "confidence": 0.0 a 1.0,
  "entities": {
    "promptTopic": "tema del prompt si aplica",
    "targetPage": "página destino si aplica",
    "category": "categoría si aplica"
  }
}`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
    }),
  });

  const data = await response.json();
  const intentResult = JSON.parse(data.choices[0].message.content);

  return Response.json(intentResult);
}
```

##### B) Modificación del Endpoint `/api/ai-chat`

**Archivo:**
```
apps/web/src/app/api/ai-chat/route.ts
```

**Cambios:**
1. Agregar parámetro `isPromptMode: boolean` en el request
2. Modificar el system prompt cuando `isPromptMode === true`
3. Usar configuración de LIA del Prompt Maker

```typescript
// En el system prompt
if (isPromptMode) {
  systemPrompt = `${systemPrompt}

**MODO ESPECIAL: CREACIÓN DE PROMPTS**

Estás en modo de creación de prompts. Tu objetivo es:
1. Hacer preguntas para entender lo que el usuario necesita
2. Guiar al usuario paso a paso
3. Generar un prompt profesional y estructurado
4. Usar el formato del Prompt Maker existente

Haz preguntas de seguimiento sobre:
- ¿Para qué plataforma es el prompt? (ChatGPT, Claude, etc.)
- ¿Cuál es el objetivo principal?
- ¿Qué tono debe usar? (formal, casual, técnico, etc.)
- ¿Qué limitaciones o restricciones debe tener?
- ¿Necesita ejemplos o casos de uso específicos?

Cuando tengas suficiente información, genera el prompt completo.`;
}
```

##### C) Endpoint de Guardado Automático

**Nuevo endpoint:**
```typescript
// apps/web/src/app/api/ai-directory/prompts/save-from-chat/route.ts

export async function POST(request: Request) {
  const user = await SessionService.getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    title,
    description,
    content,
    tags,
    difficulty_level,
    use_cases,
    tips,
    category_id,
  } = await request.json();

  // Generar slug único
  const slug = generateSlug(title);

  // Guardar en la BD
  const { data, error } = await supabase
    .from('ai_prompts')
    .insert({
      prompt_id: crypto.randomUUID(),
      title,
      slug,
      description,
      content,
      tags,
      difficulty_level,
      use_cases,
      tips,
      category_id,
      author_id: user.id,
      is_active: true,
      is_featured: false,
      is_verified: false,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    prompt: data,
    redirectUrl: `/prompt-directory/${slug}`,
  });
}
```

#### 2.2.3 Modelo de Datos

**NO se requieren nuevas tablas.**

**Modificaciones menores:**

##### A) Agregar campo `source` a `ai_prompts`

```sql
ALTER TABLE ai_prompts
ADD COLUMN source TEXT DEFAULT 'manual';

-- Valores: 'manual', 'ai_chat', 'workshop_chat', 'imported'
```

##### B) Agregar campo `conversation_id` a `ai_prompts` (opcional)

```sql
ALTER TABLE ai_prompts
ADD COLUMN conversation_id UUID REFERENCES lia_conversations;

-- Para vincular el prompt a la conversación que lo generó
```

##### C) Índices para mejorar rendimiento

```sql
CREATE INDEX idx_ai_prompts_author ON ai_prompts(author_id);
CREATE INDEX idx_ai_prompts_source ON ai_prompts(source);
CREATE INDEX idx_lia_conversations_context ON lia_conversations(context_type);
```

---

### 2.3 Dependencias Externas

#### A) OpenAI API

**Ya disponible:**
- ✅ GPT-4o-mini (default)
- ✅ GPT-4o (alta calidad)

**Uso adicional:**
- Detección de intenciones (opcional)
- Generación de prompts en modo conversacional

**Configuración actual:**
```
OPENAI_API_KEY=sk-...
CHATBOT_MODEL=gpt-4o-mini
CHATBOT_MAX_TOKENS=700
CHATBOT_TEMPERATURE=0.6
```

**Configuración recomendada para modo prompt:**
```
PROMPT_MODE_MODEL=gpt-4o  # Mayor calidad para generación de prompts
PROMPT_MODE_MAX_TOKENS=1500  # Más tokens para prompts completos
PROMPT_MODE_TEMPERATURE=0.7  # Más creatividad
```

#### B) ElevenLabs API (Voz)

**Ya disponible:**
- ✅ API Key: `sk_dd0d1757269405cd26d5e22fb14c54d2f49c4019fd8e86d0`
- ✅ Voice ID: `15Y62ZlO8it2f5wduybx`
- ✅ Model: `eleven_turbo_v2_5`

**Uso adicional:**
- Lectura de mensajes de LIA en el agente de voz
- Recorridos guiados por voz

**Fallback:**
- Web Speech API (sin costo, menos calidad)

#### C) Web Speech API

**Ya disponible:**
- ✅ Reconocimiento de voz (STT)
- ✅ Síntesis de voz (TTS fallback)

**Limitaciones:**
- Solo funciona en navegadores compatibles
- Requiere HTTPS en producción
- Idioma detectado automáticamente

---

### 2.4 Consideraciones de UX y DX

#### UX (Experiencia de Usuario)

##### A) Transición Suave al Modo Prompt

**Problema:** El usuario puede confundirse si el modo cambia abruptamente.

**Solución:**
1. Mostrar un mensaje del sistema explicando el cambio
2. Indicador visual claro (badge "Modo Creación de Prompts")
3. Opción para salir del modo en cualquier momento
4. Preview del prompt en construcción

##### B) Feedback Visual durante la Generación

**Problema:** La generación de prompts puede tomar varios segundos.

**Solución:**
1. Indicador de "LIA está escribiendo..."
2. Animación de typing (puntos suspensivos)
3. Skeleton loader para el preview del prompt

##### C) Confirmación antes de Guardar

**Problema:** El usuario puede querer editar el prompt antes de guardarlo.

**Solución:**
1. Mostrar preview completo con botón "Editar"
2. Permitir modificaciones en línea
3. Confirmación: "¿Guardar en tu biblioteca?"
4. Mostrar mensaje de éxito con link al prompt guardado

##### D) Navegación sin Perder Contexto

**Problema:** Si el usuario navega, puede perder la conversación actual.

**Solución:**
1. Persistir la conversación en localStorage
2. Opción "Continuar donde lo dejé" al volver
3. Notificación: "He actualizado mi contexto a [nueva sección]"

##### E) Agente de Voz No Intrusivo

**Problema:** El agente de voz puede interrumpir la experiencia.

**Solución:**
1. Botón claramente visible pero pequeño
2. El usuario decide cuándo activarlo
3. Indicadores claros de estado (escuchando, hablando)
4. Opción de silenciar en cualquier momento

#### DX (Experiencia de Desarrollador)

##### A) Código Modular y Reutilizable

**Principios:**
1. Separar la lógica de detección de intenciones en un servicio
2. Componentes pequeños y reutilizables (VoiceAgent, PromptPreviewPanel)
3. Hooks personalizados para lógica compleja

##### B) Testing

**Estrategias:**
1. Unit tests para detección de intenciones (patrones regex)
2. Integration tests para el flujo completo de creación de prompts
3. E2E tests para navegación guiada

##### C) Logging y Monitoreo

**Implementar:**
1. Log de intenciones detectadas (para mejorar el sistema)
2. Tracking de conversiones (intención → prompt guardado)
3. Métricas de uso del agente de voz

---

### 2.5 Riesgos y Decisiones Arquitectónicas

#### Riesgos

##### A) Falsos Positivos en Detección de Intenciones

**Riesgo:** El sistema detecta intención de crear prompts cuando no la hay.

**Probabilidad:** Media
**Impacto:** Bajo (usuario puede salir del modo)

**Mitigación:**
1. Umbral de confianza alto (> 0.7)
2. Opción para desactivar detección automática en configuración
3. Logging para mejorar el sistema

##### B) Costo de API (OpenAI)

**Riesgo:** Uso excesivo de la API para detección de intenciones.

**Probabilidad:** Baja
**Impacto:** Medio

**Mitigación:**
1. Usar detección local con regex primero (sin API calls)
2. Solo usar OpenAI para casos ambiguos
3. Rate limiting por usuario
4. Caché de intenciones para mensajes similares

##### C) Complejidad del Agente de Voz

**Riesgo:** Bugs en la integración de voz, problemas de permisos del navegador.

**Probabilidad:** Media
**Impacto:** Bajo (es opcional)

**Mitigación:**
1. Funcionalidad opcional (no bloquea otras features)
2. Fallback a Web Speech API si ElevenLabs falla
3. Manejo robusto de errores de permisos

##### D) Sincronización de Contexto al Navegar

**Riesgo:** El contexto de LIA no se actualiza correctamente al navegar.

**Probabilidad:** Baja
**Impacto:** Medio

**Mitigación:**
1. Usar Next.js router events
2. Persistencia en localStorage como backup
3. Sistema de recuperación automática

#### Decisiones Arquitectónicas

##### Decisión 1: Detección Híbrida (Local + IA)

**Opción A:** Solo regex local (sin API calls)
- ✅ Rápido y sin costo
- ❌ Menos preciso

**Opción B:** Solo OpenAI (para todos los mensajes)
- ✅ Muy preciso
- ❌ Costoso y lento

**Opción C:** Híbrido (regex + OpenAI para casos ambiguos) ✅ **ELEGIDA**
- ✅ Balance entre precisión y costo
- ✅ Rápido en la mayoría de casos
- ⚠️ Más complejo de implementar

##### Decisión 2: Ubicación del Agente de Voz

**Opción A:** En la barra superior del chat ✅ **ELEGIDA**
- ✅ Siempre visible
- ✅ No interrumpe la conversación
- ❌ Puede verse abarrotado

**Opción B:** En un panel lateral
- ✅ Más espacio para controles
- ❌ Menos visible
- ❌ Requiere más espacio en pantalla

**Opción C:** Modal flotante
- ✅ No afecta el layout
- ❌ Puede ser intrusivo
- ❌ Usuario tiene que abrirlo manualmente

##### Decisión 3: Persistencia del Modo Prompt

**Opción A:** El modo persiste entre sesiones ✅ **ELEGIDA**
- ✅ Usuario no tiene que reactivar
- ❌ Puede confundir si no recuerda que estaba en ese modo

**Opción B:** El modo se reinicia en cada sesión
- ✅ Comportamiento predecible
- ❌ Usuario tiene que reactivar manualmente

**Mitigación Opción A:**
- Mostrar indicador visual muy claro
- Opción para salir del modo siempre visible

---

### 2.6 Estimación de Esfuerzo (Etapa 1)

| Tarea | Complejidad | Esfuerzo | Prioridad |
|-------|-------------|----------|-----------|
| **A. Detección de Intenciones** | | | |
| - Servicio con regex | Baja | 4h | Alta |
| - Integración con OpenAI (opcional) | Media | 6h | Media |
| - Integración en AIChatAgent | Baja | 3h | Alta |
| - Testing | Media | 4h | Alta |
| **B. Modo Prompt Mejorado** | | | |
| - Indicadores visuales | Baja | 2h | Alta |
| - PromptPreviewPanel | Media | 6h | Alta |
| - Botón guardar en biblioteca | Baja | 2h | Alta |
| **C. Navegación Guiada** | | | |
| - Mejorar renderizado de links | Baja | 2h | Media |
| - Tracking de navegación | Baja | 3h | Media |
| - Actualización de contexto | Media | 4h | Media |
| **D. Guardado Automático** | | | |
| - Endpoint API | Baja | 3h | Alta |
| - Integración frontend | Baja | 2h | Alta |
| - Validación y errores | Baja | 2h | Alta |
| **E. Agente de Voz** | | | |
| - Componente VoiceAgent | Media | 8h | Baja |
| - Integración ElevenLabs | Media | 4h | Baja |
| - Integración Web Speech API | Baja | 3h | Baja |
| - UI y controles | Media | 4h | Baja |
| **F. Testing y Refinamiento** | | | |
| - Unit tests | Media | 6h | Alta |
| - Integration tests | Alta | 8h | Media |
| - Ajustes de UX | Media | 6h | Alta |
| **G. Documentación** | | | |
| - Docs técnicas | Baja | 3h | Media |
| - Guías de usuario | Baja | 2h | Media |

**Total Estimado (sin agente de voz):** ~60-70 horas
**Total Estimado (con agente de voz):** ~80-90 horas

**Recomendación:** Implementar el agente de voz en una sub-etapa posterior (1.B) después de validar las otras funcionalidades.

---


## 3. ETAPA 2: SISTEMA CONVERSACIONAL ADAPTADO AL PERFIL

### 3.1 Objetivos Funcionales

Esta etapa se enfoca en crear un sistema robusto de generaci�n de prompts que se adapte inteligentemente al perfil profesional del usuario, usando un flujo conversacional guiado que mantiene el contexto y construye el prompt paso a paso.

[Continuaci�n en el mensaje siguiente...]

