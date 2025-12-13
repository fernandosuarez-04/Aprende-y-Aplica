# Documentación de los Agentes de Lia

## Resumen Ejecutivo

Este documento describe el funcionamiento técnico de **Lia (Learning Intelligence Assistant)**, el asistente de inteligencia artificial integrado en la plataforma "Aprende y Aplica". Lia opera en dos modalidades principales:

1. **Agente Global (AIChatAgent)**: Disponible en toda la plataforma
2. **Agente de Aprendizaje (/learn)**: Especializado en el contexto de cursos y lecciones

El sistema registra todas las interacciones en una base de datos estructurada que permite análisis de uso, cálculo de costos, y métricas de rendimiento.

---

## 1. Arquitectura General

### 1.1 Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐   ┌──────────────────────┐       │
│  │  AIChatAgent.tsx     │   │ /learn/page.tsx      │       │
│  │  (Agente Global)     │   │ (Agente de Curso)    │       │
│  │                      │   │                      │       │
│  │  - Detecta contexto  │   │ - Contexto de curso  │       │
│  │  - Multi-modo        │   │ - Transcripciones    │       │
│  │  - Navegación        │   │ - Actividades        │       │
│  └──────────┬───────────┘   └──────────┬───────────┘       │
│             │                           │                    │
│             └───────────┬───────────────┘                    │
│                         │                                    │
│                  ┌──────▼──────┐                            │
│                  │ useLiaChat  │                            │
│                  │   (Hook)    │                            │
│                  └──────┬──────┘                            │
└─────────────────────────┼──────────────────────────────────┘
                          │
                          │ HTTP POST
                          │
┌─────────────────────────▼──────────────────────────────────┐
│                    API ROUTES                               │
├─────────────────────────────────────────────────────────────┤
│  /api/ai-chat            (Chat principal)                   │
│  /api/lia/start-activity (Iniciar actividad)               │
│  /api/lia/end-conversation (Cerrar conversación)           │
└─────────────────────────┬──────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────┐
│                   SERVICIOS                                 │
├─────────────────────────────────────────────────────────────┤
│  LiaLogger                   (Analytics)                    │
│  IntentDetectionService      (Detección de intenciones)    │
│  calculateCost               (Cálculo de costos)           │
│  OpenAI API                  (GPT-4o-mini)                 │
└─────────────────────────┬──────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────┐
│                BASE DE DATOS (Supabase)                     │
├─────────────────────────────────────────────────────────────┤
│  lia_conversations           (Conversaciones)               │
│  lia_messages               (Mensajes y tokens)            │
│  lia_activity_completions   (Actividades interactivas)    │
│  lia_user_feedback          (Feedback de usuarios)        │
│  lia_conversation_analytics (Vistas agregadas)            │
│  lia_common_questions       (Preguntas frecuentes)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Agente Global (AIChatAgent)

### 2.1 Ubicación y Propósito

**Archivo**: `apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx`

El **AIChatAgent** es el componente de chat flotante que aparece en toda la plataforma. Se adapta automáticamente al contexto de la página actual.

### 2.2 Detección Automática de Contexto

El agente detecta automáticamente el contexto basándose en la URL:

```typescript
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
```

### 2.3 Modos de Operación

El agente opera en múltiples modos que se activan automáticamente mediante detección de intenciones:

| Modo | Descripción | Activación |
|------|-------------|------------|
| **course** | Asistencia con contenido de cursos | Automático en `/courses/[slug]/learn` |
| **prompts** | Creación guiada de prompts de IA | Detección de intención "create_prompt" |
| **context** | Navegación y ayuda general | Por defecto |
| **nanobana** | Generación de JSON visual | Detección de palabras clave de diseño |
| **workshops** | Contexto de talleres | Automático en `/workshops` |
| **communities** | Ayuda con comunidades | Automático en `/communities` |
| **news** | Contexto de noticias | Automático en `/news` |

### 2.4 Extracción de Contexto de Página

El agente extrae información real del DOM para proporcionar respuestas contextuales:

```typescript
function extractPageContent(): {
  title: string;           // document.title
  metaDescription: string; // meta[name="description"]
  headings: string[];      // h1, h2 elements
  mainText: string;        // Texto visible (max 800 chars)
}
```

Esta información se envía al API junto con el mensaje del usuario para proporcionar respuestas más precisas.

### 2.5 Sistema de Intenciones

El **IntentDetectionService** analiza los mensajes del usuario para detectar intenciones y cambiar automáticamente de modo:

- **Intención "create_prompt"**: Activa el modo prompts
- **Intención "navigate"**: Proporciona enlaces de navegación
- **Intención "nanobana"**: Activa el modo de generación visual
- **Preguntas sobre cursos**: Cambia a modo course

---

## 3. Agente de Aprendizaje (/learn)

### 3.1 Ubicación y Propósito

**Archivo**: `apps/web/src/app/courses/[slug]/learn/page.tsx`

El agente de aprendizaje está integrado en la página de visualización de lecciones. Tiene acceso completo al contexto del curso, módulo y lección actual.

### 3.2 Contexto de Curso

Cuando el usuario interactúa con Lia en una lección, se envía un objeto **CourseLessonContext**:

```typescript
interface CourseLessonContext {
  // Tipo de contexto
  contextType?: 'course' | 'workshop';

  // Información del curso/taller
  courseId?: string;
  courseSlug?: string;
  courseTitle?: string;
  courseDescription?: string;

  // Módulo y lección actual
  moduleTitle?: string;
  lessonTitle?: string;
  lessonDescription?: string;

  // Contenido de la lección actual
  transcriptContent?: string;      // Transcripción completa del video
  summaryContent?: string;         // Resumen de la lección
  videoTime?: number;              // Tiempo actual del video
  durationSeconds?: number;        // Duración total

  // Metadatos completos (módulos y lecciones disponibles)
  allModules?: ModuleInfo[];

  // Información del usuario
  userRole?: string;               // Rol profesional del usuario

  // Detección de dificultades (opcional)
  difficultyDetected?: {
    patterns: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    overallScore: number;
    shouldIntervene: boolean;
  };
}
```

### 3.3 Características Especiales

1. **Acceso a transcripciones**: Lia puede responder preguntas sobre el contenido exacto del video
2. **Navegación entre lecciones**: Conoce la estructura completa del curso
3. **Actividades interactivas**: Puede guiar al usuario en ejercicios prácticos
4. **Detección de dificultades**: Puede ofrecer ayuda proactiva cuando detecta problemas

### 3.4 Restricciones de Contenido

En modo curso, Lia está estrictamente limitada a:
- Contenido de la lección actual
- Conceptos educativos relacionados
- Prompts de actividades interactivas

❌ **NO responde sobre**: cultura general, entretenimiento, personajes de ficción, o temas no relacionados con la lección.

---

## 4. Base de Datos y Almacenamiento

### 4.1 Estructura de Tablas

#### 📊 **lia_conversations**
Almacena cada conversación del usuario con Lia.

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

**Campos clave**:
- `conversation_id`: Identificador único de la conversación
- `user_id`: Usuario que inició la conversación
- `context_type`: Contexto (general, course, workshop, prompts, etc.)
- `course_id`, `module_id`, `lesson_id`: Referencias al contenido educativo
- `total_messages`: Contador total de mensajes (usuario + asistente)
- `total_lia_messages`: Contador de respuestas de Lia únicamente
- `is_completed`: Si la conversación terminó normalmente

**Límites de almacenamiento**:
- Máximo **5 conversaciones por usuario por contexto**
- Las conversaciones más antiguas se eliminan automáticamente

#### 💬 **lia_messages**
Almacena cada mensaje individual con métricas de uso.

```sql
CREATE TABLE lia_messages (
  message_id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES lia_conversations NOT NULL,
  role TEXT NOT NULL,                 -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  is_system_message BOOLEAN DEFAULT false,
  model_used TEXT,                    -- 'gpt-4o-mini', 'gpt-4o'
  tokens_used INTEGER,                -- Tokens consumidos (prompt + completion)
  cost_usd NUMERIC(10,6),            -- Costo en USD
  response_time_ms INTEGER,           -- Tiempo de respuesta en milisegundos
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Campos clave para analytics**:
- `tokens_used`: Total de tokens (prompt + completion)
- `cost_usd`: Costo calculado del mensaje basado en el modelo
- `response_time_ms`: Tiempo de respuesta de la API de OpenAI
- `model_used`: Modelo de IA utilizado (ej: gpt-4o-mini)

#### 🎯 **lia_activity_completions**
Rastrea actividades interactivas completadas por los usuarios.

```sql
CREATE TABLE lia_activity_completions (
  completion_id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES lia_conversations,
  user_id UUID REFERENCES usuarios NOT NULL,
  activity_id UUID,
  status TEXT,                        -- 'started', 'in_progress', 'completed', 'abandoned'
  total_steps INTEGER,
  completed_steps INTEGER DEFAULT 0,
  current_step INTEGER DEFAULT 1,
  time_to_complete_seconds INTEGER,
  lia_had_to_redirect INTEGER DEFAULT 0,
  generated_output JSONB,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Estados de actividad**:
- `started`: Actividad iniciada
- `in_progress`: En proceso
- `completed`: Completada exitosamente
- `abandoned`: Usuario abandonó la actividad

#### 👍 **lia_user_feedback**
Almacena el feedback de los usuarios sobre las respuestas de Lia.

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

### 4.2 Vistas Materializadas y Analytics

#### 📈 **lia_conversation_analytics**
Vista materializada para análisis rápido de conversaciones.

```sql
CREATE MATERIALIZED VIEW lia_conversation_analytics AS
SELECT
  c.conversation_id,
  c.user_id,
  c.context_type,
  c.started_at,
  c.ended_at,
  c.total_messages,
  c.total_lia_messages,
  SUM(m.tokens_used) as total_tokens,
  SUM(m.cost_usd) as total_cost,
  AVG(m.response_time_ms) as avg_response_time_ms,
  COUNT(f.feedback_id) as feedback_count,
  AVG(f.rating) as avg_rating
FROM lia_conversations c
LEFT JOIN lia_messages m ON c.conversation_id = m.conversation_id
LEFT JOIN lia_user_feedback f ON c.conversation_id = f.conversation_id
GROUP BY c.conversation_id;
```

#### 📊 **lia_activity_performance**
Vista para análisis de rendimiento de actividades.

```sql
CREATE MATERIALIZED VIEW lia_activity_performance AS
SELECT
  activity_id,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'abandoned') as abandoned_count,
  AVG(time_to_complete_seconds) as avg_completion_time,
  AVG(lia_had_to_redirect) as avg_redirections,
  (COUNT(*) FILTER (WHERE status = 'completed')::float / COUNT(*)::float * 100) as completion_rate
FROM lia_activity_completions
GROUP BY activity_id;
```

#### ❓ **lia_common_questions**
Vista para identificar preguntas frecuentes por lección.

```sql
CREATE MATERIALIZED VIEW lia_common_questions AS
SELECT
  c.lesson_id,
  m.content as question,
  COUNT(*) as times_asked,
  AVG(f.rating) as avg_rating,
  COUNT(f.feedback_id) FILTER (WHERE f.feedback_type = 'helpful') as helpful_count
FROM lia_messages m
JOIN lia_conversations c ON m.conversation_id = c.conversation_id
LEFT JOIN lia_user_feedback f ON m.message_id = f.message_id
WHERE m.role = 'user'
  AND c.lesson_id IS NOT NULL
GROUP BY c.lesson_id, m.content
HAVING COUNT(*) >= 3
ORDER BY times_asked DESC;
```

---

## 5. Sistema de Logging y Analytics

### 5.1 Clase LiaLogger

**Ubicación**: `apps/web/src/lib/analytics/lia-logger.ts`

La clase **LiaLogger** es responsable de registrar todas las interacciones con Lia.

#### Métodos Principales

##### `startConversation(metadata: ConversationMetadata): Promise<string>`

Inicia una nueva conversación y retorna el `conversation_id`.

```typescript
const liaLogger = new LiaLogger(userId);
const conversationId = await liaLogger.startConversation({
  contextType: 'course',
  courseContext: courseData,
  deviceType: 'mobile',
  browser: 'Chrome/120.0',
  ipAddress: '192.168.1.1'
});
```

**Importante**: Limita automáticamente a 5 conversaciones por usuario por contexto.

##### `logMessage(role, content, isSystemMessage, metadata): Promise<string>`

Registra un mensaje individual en la conversación.

```typescript
await liaLogger.logMessage(
  'assistant',
  'Esta es la respuesta de Lia',
  false,
  {
    modelUsed: 'gpt-4o-mini',
    tokensUsed: 450,
    costUsd: 0.00045,
    responseTimeMs: 1200
  }
);
```

##### `endConversation(completed: boolean): Promise<void>`

Cierra la conversación actual.

```typescript
await liaLogger.endConversation(true);
```

##### `startActivity(activityId, totalSteps): Promise<string>`

Inicia el tracking de una actividad interactiva.

```typescript
const completionId = await liaLogger.startActivity('activity-uuid', 5);
```

##### `updateActivityProgress(completionId, progress): Promise<void>`

Actualiza el progreso de una actividad.

```typescript
await liaLogger.updateActivityProgress(completionId, {
  completedSteps: 3,
  currentStep: 4,
  status: 'in_progress'
});
```

##### `completeActivity(completionId, output): Promise<void>`

Marca una actividad como completada.

```typescript
await liaLogger.completeActivity(completionId, {
  result: 'Prompt generado exitosamente',
  data: { /* ... */ }
});
```

##### `logFeedback(messageId, feedbackType, rating, comment): Promise<void>`

Registra feedback del usuario sobre una respuesta.

```typescript
await liaLogger.logFeedback(
  messageId,
  'helpful',
  5,
  'Excelente explicación'
);
```

### 5.2 Funciones de Análisis

#### `getUserConversationStats(userId: string)`

Obtiene estadísticas de conversaciones de un usuario.

```typescript
const stats = await getUserConversationStats(userId);
// Retorna: conversaciones, tokens totales, costos, ratings promedio
```

#### `getActivityPerformance(activityId: string)`

Obtiene métricas de rendimiento de una actividad específica.

```typescript
const performance = await getActivityPerformance(activityId);
// Retorna: intentos totales, tasa de completación, tiempo promedio
```

#### `getCommonQuestionsForLesson(lessonId: string, limit: number)`

Obtiene las preguntas más frecuentes de una lección.

```typescript
const questions = await getCommonQuestionsForLesson(lessonId, 10);
// Retorna: pregunta, veces preguntada, rating promedio
```

#### `getLiaGlobalMetrics(startDate: Date, endDate: Date)`

Calcula métricas agregadas globales para el dashboard de admin.

```typescript
const metrics = await getLiaGlobalMetrics(
  new Date('2025-01-01'),
  new Date('2025-12-31')
);
// Retorna: totalConversations, totalMessages, completedActivities, totalCostUsd
```

---

## 6. Cálculo de Costos y Tokens

### 6.1 Sistema de Costos

**Ubicación**: `apps/web/src/lib/openai/usage-monitor.ts`

#### Modelos y Tarifas (Enero 2025)

```typescript
const MODEL_COSTS = {
  'gpt-4o-mini': {
    input: 0.00015 / 1000,   // $0.15 por 1M tokens
    output: 0.0006 / 1000    // $0.60 por 1M tokens
  },
  'gpt-4o': {
    input: 0.0025 / 1000,    // $2.50 por 1M tokens
    output: 0.010 / 1000     // $10.00 por 1M tokens
  }
};
```

#### Función de Cálculo

```typescript
function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: string = 'gpt-4o-mini'
): number {
  const costs = MODEL_COSTS[model] || MODEL_COSTS['gpt-4o-mini'];
  const inputCost = promptTokens * costs.input;
  const outputCost = completionTokens * costs.output;
  return inputCost + outputCost;
}
```

#### Ejemplo de Cálculo

```typescript
// Mensaje con:
// - 400 tokens de prompt
// - 200 tokens de respuesta
// - Modelo: gpt-4o-mini

const cost = calculateCost(400, 200, 'gpt-4o-mini');
// Input:  400 * 0.00000015 = $0.00006
// Output: 200 * 0.0000006  = $0.00012
// Total:                    = $0.00018
```

### 6.2 Registro de Uso

```typescript
logOpenAIUsage({
  userId: 'user-uuid',
  timestamp: new Date(),
  model: 'gpt-4o-mini',
  promptTokens: 400,
  completionTokens: 200,
  totalTokens: 600,
  estimatedCost: 0.00018
});
```

### 6.3 Optimizaciones de Costos

El sistema implementa varias optimizaciones para reducir costos:

1. **Límite de historial**: Máximo 20 mensajes en el contexto
2. **Límite de mensaje**: 2000 caracteres para usuarios, 10000 para sistema
3. **Truncado de contexto**: Transcripciones limitadas a 2000 caracteres
4. **Modelo eficiente**: `gpt-4o-mini` por defecto (10x más barato que gpt-4o)
5. **Rate limiting**: 10 requests por minuto por usuario
6. **Cache de respuestas**: Para preguntas frecuentes (futuro)

---

## 7. Flujo de Datos Completo

### 7.1 Flujo de una Conversación Típica

```
1. Usuario abre chat
   ├─> AIChatAgent detecta contexto de URL
   ├─> Extrae información de la página (DOM)
   └─> Inicializa useLiaChat hook

2. Usuario escribe mensaje
   ├─> IntentDetectionService analiza intención
   ├─> Hook determina modo (course, prompts, etc.)
   └─> Envía mensaje a /api/ai-chat

3. API procesa solicitud
   ├─> Rate limiting (10 req/min)
   ├─> Autentica usuario (SessionService)
   ├─> Valida entrada (longitud, formato)
   └─> Inicia analytics en background (LiaLogger)

4. LiaLogger registra conversación
   ├─> Verifica límite de 5 conversaciones
   ├─> Elimina conversaciones antiguas si es necesario
   ├─> Crea nueva conversación en lia_conversations
   └─> Retorna conversation_id

5. API llama a OpenAI
   ├─> Construye system prompt contextual
   ├─> Envía historial + nuevo mensaje
   ├─> Recibe respuesta con tokens
   └─> Calcula costo (calculateCost)

6. API procesa respuesta
   ├─> Filtra prompt del sistema (filterSystemPromptFromResponse)
   ├─> Limpia Markdown (cleanMarkdownFromResponse)
   ├─> Normaliza enlaces (URL absolutas)
   └─> Registra mensaje en lia_messages

7. LiaLogger registra métricas
   ├─> Guarda mensaje del usuario
   ├─> Guarda respuesta de Lia con metadata:
   │   ├─> model_used: 'gpt-4o-mini'
   │   ├─> tokens_used: 600
   │   ├─> cost_usd: 0.00018
   │   └─> response_time_ms: 1200
   └─> Actualiza contadores en lia_conversations

8. Frontend recibe respuesta
   ├─> Actualiza estado de mensajes
   ├─> Guarda conversation_id para continuidad
   └─> Renderiza respuesta al usuario

9. Usuario cierra chat (opcional)
   ├─> Frontend llama a /api/lia/end-conversation
   ├─> LiaLogger marca conversación como completada
   └─> Actualiza ended_at timestamp
```

### 7.2 Flujo de una Actividad Interactiva

```
1. Usuario inicia actividad
   ├─> Frontend llama a /api/lia/start-activity
   └─> LiaLogger crea registro en lia_activity_completions

2. Usuario progresa en la actividad
   ├─> Frontend actualiza progreso periódicamente
   ├─> LiaLogger.updateActivityProgress()
   └─> Actualiza completed_steps, current_step

3. Lia redirige al usuario (si es necesario)
   ├─> Sistema detecta off-topic
   ├─> LiaLogger.incrementRedirections()
   └─> Incrementa contador lia_had_to_redirect

4. Usuario completa actividad
   ├─> Frontend marca como completada
   ├─> LiaLogger.completeActivity()
   ├─> Calcula time_to_complete_seconds
   ├─> Guarda generated_output (JSON)
   └─> Actualiza status = 'completed'

5. Analytics se actualizan
   ├─> Vista lia_activity_performance se refresca
   └─> Métricas disponibles para dashboard de admin
```

---

## 8. Configuración del Modelo de IA

### 8.1 Variables de Entorno

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Model Configuration
CHATBOT_MODEL=gpt-4o-mini
CHATBOT_MAX_TOKENS=700
CHATBOT_TEMPERATURE=0.6
```

### 8.2 Configuración por Contexto

El sistema ajusta automáticamente la configuración del modelo según el contexto:

| Contexto | Temperature | Max Tokens | Razón |
|----------|-------------|------------|-------|
| **course** | 0.5 | 1000 | Respuestas precisas basadas en transcripciones |
| **prompts** | 0.7 | 1000 | Creatividad en generación de prompts |
| **onboarding** | 0.7 | 150 | Respuestas cortas para conversación por voz |
| **general** | 0.6 | 500 | Balance entre precisión y naturalidad |
| **nanobana** | 0.8 | 1500 | Creatividad para diseño visual |

### 8.3 Instrucciones del Sistema

Cada contexto tiene instrucciones específicas en el system prompt:

- **Restricciones de contenido**: Qué puede/no puede responder
- **Formato de respuesta**: Sin Markdown (excepto enlaces)
- **Personalización**: Uso del nombre y rol del usuario
- **Navegación**: Proporcionar enlaces funcionales
- **Idioma**: Español, inglés o portugués

---

## 9. Métricas y KPIs Disponibles

### 9.1 Métricas por Conversación

- Total de mensajes
- Total de mensajes de Lia
- Tokens consumidos totales
- Costo total en USD
- Tiempo promedio de respuesta
- Rating promedio de usuarios
- Cantidad de feedback recibido

### 9.2 Métricas por Actividad

- Total de intentos
- Tasa de completación
- Tasa de abandono
- Tiempo promedio de completación
- Promedio de redirecciones por Lia
- Distribución por status (started, in_progress, completed, abandoned)

### 9.3 Métricas Globales

- Total de conversaciones (por período)
- Total de mensajes (por período)
- Total de actividades completadas
- Costo total en USD
- Distribución de contextos más usados
- Usuarios activos con Lia
- Preguntas más frecuentes por lección

### 9.4 Análisis de Calidad

- Rating promedio por contexto
- Tipos de feedback (helpful, not_helpful, incorrect, confusing)
- Mensajes con feedback positivo vs negativo
- Patrones de preguntas sin respuesta satisfactoria

---

## 10. Seguridad y Privacidad

### 10.1 Protección de Datos

- **Autenticación requerida**: Lia solo funciona con usuarios autenticados (analytics)
- **IP Addresses**: Almacenadas para seguridad y analytics, no para tracking
- **Contenido sensible**: No se almacenan contraseñas ni información financiera
- **Datos de conversación**: Asociados al user_id para personalización

### 10.2 Rate Limiting

```typescript
// 10 requests por minuto por usuario
checkRateLimit(request, {
  maxRequests: 10,
  windowMs: 60 * 1000,
  message: 'Demasiadas solicitudes al chatbot'
}, 'openai');
```

### 10.3 Validaciones de Entrada

- **Longitud máxima de mensaje**: 2000 caracteres (usuarios), 10000 (sistema)
- **Historial limitado**: Últimos 20 mensajes
- **Sanitización**: Contenido filtrado para evitar prompt injection
- **Detección de jailbreak**: Patrones específicos rechazados

---

## 11. Casos de Uso Reales

### 11.1 Caso 1: Usuario estudiando una lección

```
Usuario: "Explícame la parte sobre API REST del video"

Sistema:
1. Detecta contexto: course
2. Envía transcriptContent de la lección
3. Lia responde basándose SOLO en la transcripción
4. Registra:
   - tokens_used: 850
   - cost_usd: 0.00034
   - response_time_ms: 1500
```

### 11.2 Caso 2: Usuario quiere crear un prompt

```
Usuario: "Ayúdame a crear un prompt para analizar datos"

Sistema:
1. IntentDetectionService detecta intent: 'create_prompt'
2. Cambia a modo: 'prompts'
3. Activa proceso conversacional guiado
4. Inicia actividad interactiva en lia_activity_completions
5. Guía paso a paso hasta generar el prompt final
6. Marca actividad como completed
```

### 11.3 Caso 3: Usuario navegando en dashboard

```
Usuario: "Llévame a las noticias"

Sistema:
1. Detecta contexto: general
2. IntentDetectionService detecta intent: 'navigate'
3. Lia responde: "Aquí tienes: [Noticias](/news)"
4. Usuario hace clic en el enlace y navega
```

### 11.4 Caso 4: Usuario pide ayuda con un tema fuera del alcance

```
Usuario: "Mi perro está enfermo, ¿qué hago?"

Sistema:
1. Detecta pregunta fuera del alcance educativo
2. Restricciones de contenido activadas
3. Lia responde: "Lo siento, pero solo puedo ayudarte con
   temas relacionados con: cursos, talleres, IA aplicada,
   herramientas tecnológicas educativas y navegación de
   la plataforma. ¿Hay algo sobre estos temas en lo que
   pueda ayudarte?"
4. NO registra como conversación válida
```

---

## 12. Roadmap y Mejoras Futuras

### 12.1 Optimizaciones de Costos

- [ ] Cache de respuestas para preguntas frecuentes
- [ ] Detección de respuestas similares (embeddings)
- [ ] Modelo más pequeño para navegación simple
- [ ] Compresión inteligente del historial de conversación

### 12.2 Mejoras de Analytics

- [ ] Dashboard de analytics en tiempo real
- [ ] Alertas automáticas de costos elevados
- [ ] Análisis de sentimiento de feedback
- [ ] Predicción de dificultades del estudiante

### 12.3 Nuevas Funcionalidades

- [ ] Voice-to-text para interacción por voz
- [ ] Búsqueda semántica en todo el contenido
- [ ] Recomendaciones personalizadas de cursos
- [ ] Generación automática de resúmenes
- [ ] Quiz interactivos generados por IA

### 12.4 Experiencia de Usuario

- [ ] Modo oscuro para el chat
- [ ] Historial de conversaciones guardado
- [ ] Compartir conversaciones con instructores
- [ ] Exportar conversaciones a PDF
- [ ] Sugerencias automáticas de preguntas

---

## 13. Preguntas Frecuentes (FAQ)

### ¿Cuántas conversaciones puede tener un usuario?

Máximo **5 conversaciones activas por contexto**. Las más antiguas se eliminan automáticamente.

### ¿Qué pasa con las conversaciones antiguas?

Se eliminan automáticamente cuando se alcanza el límite. Solo se mantienen las 5 más recientes por contexto.

### ¿Se puede recuperar el historial de conversaciones?

No actualmente. El sistema está diseñado para conversaciones efímeras. Una futura versión permitirá guardar conversaciones importantes.

### ¿Cuánto cuesta cada mensaje?

Depende del modelo y los tokens:
- **gpt-4o-mini**: ~$0.0002 por mensaje (promedio)
- **gpt-4o**: ~$0.002 por mensaje (10x más caro)

### ¿Lia tiene acceso a toda la plataforma?

Sí, Lia tiene conocimiento contextual de todas las páginas y puede proporcionar navegación guiada con enlaces funcionales.

### ¿Lia puede ayudar con tareas fuera de la plataforma?

No. Lia está estrictamente limitada a:
- Contenido educativo de la plataforma
- Inteligencia artificial aplicada
- Herramientas tecnológicas educativas
- Navegación y uso de la plataforma

### ¿Qué modelo de IA usa Lia?

Por defecto, **gpt-4o-mini** de OpenAI. Configurable mediante variables de entorno.

### ¿Se puede cambiar el idioma de Lia?

Sí, Lia soporta 3 idiomas:
- Español (es) - por defecto
- Inglés (en)
- Portugués (pt)

### ¿Cómo se calcula el costo de uso?

```
costo_total = (prompt_tokens * tarifa_input) + (completion_tokens * tarifa_output)
```

Basado en las tarifas oficiales de OpenAI para cada modelo.

---

## 14. Conclusión

Los agentes de Lia constituyen un sistema completo de asistencia inteligente integrado en toda la plataforma "Aprende y Aplica". El sistema registra de manera exhaustiva todas las interacciones, permitiendo:

✅ **Análisis de uso y comportamiento**
✅ **Cálculo preciso de costos operativos**
✅ **Optimización continua del rendimiento**
✅ **Mejora de la experiencia educativa**
✅ **Identificación de patrones de aprendizaje**

Con una arquitectura escalable y un sistema de logging robusto, Lia está preparada para evolucionar y adaptarse a las necesidades futuras de la plataforma.

---

**Documento creado**: Diciembre 2025
**Versión**: 1.0
**Última actualización**: 04/12/2025
