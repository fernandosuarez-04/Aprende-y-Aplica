# 🔧 Diagnóstico y Plan de Reconexión del Sistema LIA Analytics

## 📋 Resumen del Problema

El sistema de **tracking de conversaciones con LIA** dejó de guardar datos en la base de datos desde hace varios días. Este sistema es responsable de registrar:

- ✅ Tokens usados por cada conversación
- ✅ Costo de las respuestas (USD)
- ✅ Modelo de IA utilizado
- ✅ Tiempo de respuesta
- ✅ Mensajes de usuarios y asistente
- ✅ Métricas de actividades completadas

---

## 🔍 Investigación Realizada

### 1. Tablas de Base de Datos Identificadas

El sistema de analytics de LIA utiliza las siguientes tablas en Supabase:

| Tabla | Propósito |
|-------|-----------|
| `lia_conversations` | Almacena cada conversación con metadatos (user_id, context_type, fechas, contadores) |
| `lia_messages` | Mensajes individuales con tokens, costo, modelo y tiempo de respuesta |
| `lia_activity_completions` | Tracking de actividades interactivas completadas |
| `lia_user_feedback` | Feedback de usuarios sobre respuestas |
| `lia_conversation_analytics` | Vista materializada para análisis rápido |

### 2. Archivos Clave del Sistema

| Archivo | Función |
|---------|---------|
| [lia-logger.ts](apps/web/src/lib/analytics/lia-logger.ts) | Clase `LiaLogger` - Registra todas las interacciones |
| [route.ts](apps/web/src/app/api/ai-chat/route.ts) | Endpoint principal `/api/ai-chat` - Integra el logging |
| [useLiaChat.ts](apps/web/src/core/hooks/useLiaChat.ts) | Hook de frontend para chat |
| [AIChatAgent.tsx](apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx) | Componente de chat global |
| [StudyPlannerLIA.tsx](apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx) | LIA del Study Planner |

### 3. Instancias de LIA en la Plataforma

Se identificaron **3 instancias principales** de LIA que deben registrar analytics:

#### A) LIA Global (AIChatAgent)
- **Ubicación**: Disponible en toda la plataforma como chat flotante
- **Componente**: `apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx`
- **Contextos**: general, communities, workshops, news, dashboard, prompts, business
- **Usa**: `/api/ai-chat` con `LiaLogger` integrado ✅

#### B) LIA de Cursos (/learn)
- **Ubicación**: Página de visualización de lecciones `/courses/[slug]/learn`
- **Componente**: `apps/web/src/app/courses/[slug]/learn/page.tsx`
- **Hook**: `useLiaChat`
- **Usa**: `/api/ai-chat` con `conversationId` persistido ✅

#### C) LIA del Study Planner (/study-planner/create)
- **Ubicación**: Planificador de estudios `/study-planner/create`
- **Componente**: `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx`
- **Usa**: `/api/ai-chat` directamente ⚠️ **SIN pasar conversationId**

---

## 🐛 Causa Raíz del Problema

### Problema Principal: Campo `message_sequence` Requerido

Al analizar los tipos de Supabase en [types.ts](apps/web/src/lib/supabase/types.ts#L4177), se encontró que la tabla `lia_messages` **requiere** el campo `message_sequence`:

```typescript
// En types.ts línea 4177
Insert: {
  message_sequence: number  // ⚠️ REQUERIDO - No tiene valor por defecto
  // ... otros campos
}
```

Sin embargo, en [lia-logger.ts](apps/web/src/lib/analytics/lia-logger.ts#L140-L155), el método `logMessage()` **NO incluye** este campo:

```typescript
// En lia-logger.ts - CÓDIGO ACTUAL (DEFECTUOSO)
const { data, error } = await supabase
  .from('lia_messages' as any)
  .insert({
    conversation_id: this.conversationId,
    role: role,
    content: content,
    is_system_message: isSystemMessage,
    model_used: metadata?.modelUsed || null,
    tokens_used: metadata?.tokensUsed || null,
    cost_usd: metadata?.costUsd || null,
    response_time_ms: metadata?.responseTimeMs || null,
    created_at: new Date().toISOString()
    // ❌ FALTA: message_sequence
  })
```

**Resultado**: El INSERT falla silenciosamente porque el error es capturado y lanzado, pero el flujo asíncrono no bloquea la respuesta al usuario.

### Problemas Secundarios Identificados

1. **Errores Silenciosos**: Los errores de INSERT están comentados (`// console.error`)
2. **Study Planner sin conversationId**: El componente `StudyPlannerLIA.tsx` llama a `/api/ai-chat` sin pasar `conversationId`, por lo que no puede continuar conversaciones existentes
3. **`@ts-nocheck`**: El archivo `lia-logger.ts` tiene TypeScript deshabilitado, ocultando errores de tipo

---

## 📊 Flujo Actual del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USUARIO                                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend (AIChatAgent / useLiaChat / StudyPlannerLIA)              │
│  - Envía mensaje + context + conversationId (opcional)               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    POST /api/ai-chat                                 │
│                                                                      │
│  1. Obtener usuario autenticado                                      │
│  2. Iniciar analytics asíncrono (initializeAnalyticsAsync)          │
│     └─► LiaLogger.startConversation() o setConversationId()         │
│  3. Llamar OpenAI                                                    │
│  4. Registrar mensajes asíncrono (analyticsPromise.then())          │
│     └─► LiaLogger.logMessage() ❌ FALLA AQUÍ                        │
│  5. Devolver respuesta al usuario                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✅ Plan de Solución

### Fase 1: Corregir LiaLogger (CRÍTICO)

**Archivo**: `apps/web/src/lib/analytics/lia-logger.ts`

#### 1.1 Agregar tracking de message_sequence

```typescript
export class LiaLogger {
  private userId: string;
  private conversationId: string | null = null;
  private messageSequence: number = 0; // ✅ NUEVO: Contador de secuencia

  constructor(userId: string) {
    this.userId = userId;
  }

  // ... startConversation sin cambios ...

  async logMessage(
    role: MessageRole,
    content: string,
    isSystemMessage: boolean = false,
    metadata?: MessageMetadata
  ): Promise<string> {
    if (!this.conversationId) {
      throw new Error('No active conversation. Call startConversation first.');
    }

    const supabase = await createClient();
    
    // ✅ NUEVO: Incrementar secuencia
    this.messageSequence++;

    const { data, error } = await supabase
      .from('lia_messages')
      .insert({
        conversation_id: this.conversationId,
        role: role,
        content: content,
        is_system_message: isSystemMessage,
        model_used: metadata?.modelUsed || null,
        tokens_used: metadata?.tokensUsed || null,
        cost_usd: metadata?.costUsd || null,
        response_time_ms: metadata?.responseTimeMs || null,
        message_sequence: this.messageSequence, // ✅ NUEVO
        created_at: new Date().toISOString()
      })
      .select('message_id')
      .single();

    if (error) {
      console.error('[LiaLogger] Error logging message:', error); // ✅ Descomentar log
      throw error;
    }

    // ... resto del método ...
  }

  // ✅ NUEVO: Método para recuperar secuencia al continuar conversación
  async recoverMessageSequence(): Promise<void> {
    if (!this.conversationId) return;
    
    const supabase = await createClient();
    const { data } = await supabase
      .from('lia_messages')
      .select('message_sequence')
      .eq('conversation_id', this.conversationId)
      .order('message_sequence', { ascending: false })
      .limit(1)
      .single();
    
    this.messageSequence = data?.message_sequence || 0;
  }

  setConversationId(conversationId: string): void {
    this.conversationId = conversationId;
    this.messageSequence = 0; // Reset, se debe llamar recoverMessageSequence después
  }
}
```

#### 1.2 Habilitar logs de errores

Descomentar todos los `console.error` en `lia-logger.ts` para facilitar debugging.

#### 1.3 Remover @ts-nocheck

Eliminar `// @ts-nocheck` y corregir errores de tipos para mayor seguridad.

---

### Fase 2: Actualizar ai-chat/route.ts

**Archivo**: `apps/web/src/app/api/ai-chat/route.ts`

#### 2.1 Recuperar secuencia al continuar conversación

En la función `initializeAnalyticsAsync`, agregar recuperación de secuencia:

```typescript
const initializeAnalyticsAsync = async () => {
  // ... código existente ...
  
  if (conversationId) {
    // Continuando conversación existente
    liaLogger.setConversationId(conversationId);
    await liaLogger.recoverMessageSequence(); // ✅ NUEVO
    return { liaLogger, conversationId };
  }
  
  // ... resto del código ...
};
```

#### 2.2 Mejorar manejo de errores

```typescript
analyticsPromise.then(async ({ liaLogger, conversationId: analyticsConversationId }) => {
  if (!liaLogger || !analyticsConversationId || isSystemMessage) {
    return;
  }

  try {
    await liaLogger.logMessage('user', message, false);
    await liaLogger.logMessage('assistant', response, false, responseMetadata);
  } catch (error) {
    // ✅ NUEVO: Log detallado del error
    logger.error('❌ Error registrando analytics:', {
      error: error instanceof Error ? error.message : error,
      conversationId: analyticsConversationId,
      userId: user?.id
    });
  }
}).catch((error) => {
  logger.error('❌ Error en promesa de analytics:', error);
});
```

---

### Fase 3: Conectar Study Planner con Analytics

**Archivo**: `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx`

El componente actualmente NO pasa `conversationId` al endpoint. Se debe agregar:

#### 3.1 Agregar estado para conversationId

```typescript
// Agregar al inicio del componente
const [conversationId, setConversationId] = useState<string | null>(null);
```

#### 3.2 Pasar conversationId en las llamadas a la API

Buscar todas las llamadas a `/api/ai-chat` (líneas ~1012 y ~5235) y agregar:

```typescript
const response = await fetch('/api/ai-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: question,
    context: 'study-planner',
    conversationHistory: conversationHistory || [],
    conversationId: conversationId, // ✅ NUEVO
    // ... resto de parámetros
  }),
});

// Después de recibir respuesta, guardar conversationId
const data = await response.json();
if (data.conversationId && !conversationId) {
  setConversationId(data.conversationId);
}
```

---

### Fase 4: Validación y Testing

#### 4.1 Endpoint de prueba existente

Usar el endpoint `/api/test-lia-db` para validar que el sistema funciona:

```bash
curl -X GET https://tu-dominio.com/api/test-lia-db
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "✅ LIA Analytics funciona correctamente"
}
```

#### 4.2 Verificar datos en Supabase

```sql
-- Verificar conversaciones recientes
SELECT * FROM lia_conversations 
ORDER BY started_at DESC 
LIMIT 10;

-- Verificar mensajes con tokens
SELECT 
  m.message_id,
  m.role,
  m.tokens_used,
  m.cost_usd,
  m.message_sequence,
  m.created_at
FROM lia_messages m
ORDER BY m.created_at DESC 
LIMIT 20;

-- Verificar si hay errores (mensajes sin message_sequence)
SELECT COUNT(*) 
FROM lia_messages 
WHERE message_sequence IS NULL;
```

---

## 📁 Archivos a Modificar

| Archivo | Cambios Requeridos | Prioridad |
|---------|-------------------|-----------|
| `apps/web/src/lib/analytics/lia-logger.ts` | Agregar `message_sequence`, quitar `@ts-nocheck`, habilitar logs | 🔴 CRÍTICO |
| `apps/web/src/app/api/ai-chat/route.ts` | Recuperar secuencia en conversaciones existentes | 🔴 CRÍTICO |
| `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx` | Pasar `conversationId` | 🟡 ALTO |
| `apps/web/src/core/hooks/useLiaChat.ts` | Ya implementado correctamente | ✅ OK |
| `apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx` | Ya implementado correctamente | ✅ OK |

---

## 🔄 Migración de Base de Datos (Si es necesario)

Si el campo `message_sequence` fue agregado recientemente y la tabla tiene datos antiguos sin este valor, ejecutar:

```sql
-- Opción 1: Hacer message_sequence opcional con default
ALTER TABLE lia_messages 
ALTER COLUMN message_sequence SET DEFAULT 0;

-- Opción 2: Actualizar registros existentes
UPDATE lia_messages 
SET message_sequence = 0 
WHERE message_sequence IS NULL;

-- Opción 3: Agregar generación automática con trigger
CREATE OR REPLACE FUNCTION set_message_sequence()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.message_sequence IS NULL THEN
    SELECT COALESCE(MAX(message_sequence), 0) + 1 
    INTO NEW.message_sequence
    FROM lia_messages 
    WHERE conversation_id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_message_sequence
BEFORE INSERT ON lia_messages
FOR EACH ROW
EXECUTE FUNCTION set_message_sequence();
```

---

## 📅 Timeline Sugerido

| Día | Tarea | Estado |
|-----|-------|--------|
| Día 1 | Corregir `lia-logger.ts` (Fase 1) | ✅ COMPLETADO |
| Día 1 | Actualizar `ai-chat/route.ts` (Fase 2) | ✅ COMPLETADO |
| Día 1 | Conectar Study Planner (Fase 3) | ✅ COMPLETADO |
| Día 2 | Testing con `/api/test-lia-db` | ⏳ Pendiente |
| Día 2 | Monitoreo de datos en producción | ⏳ Pendiente |

---

## ✅ Cambios Realizados (11 Dic 2025)

### Fase 1: lia-logger.ts
- ✅ Removido `@ts-nocheck` para habilitar verificación de tipos
- ✅ Agregado campo `messageSequence` como propiedad de la clase
- ✅ Agregado `message_sequence` en el INSERT de `logMessage()`
- ✅ Creado método `recoverMessageSequence()` para conversaciones existentes
- ✅ Creado método `getCurrentMessageSequence()` para obtener secuencia actual
- ✅ Habilitados logs de errores (descomentados `console.error`)

### Fase 2: ai-chat/route.ts
- ✅ Agregada llamada a `liaLogger.recoverMessageSequence()` al continuar conversación
- ✅ Mejorado logging en el bloque de analytics con información detallada
- ✅ Agregados logs de éxito con tokens y costo

### Fase 3: StudyPlannerLIA.tsx
- ✅ Agregado estado `liaConversationId` para tracking
- ✅ Primera llamada a `/api/ai-chat` ahora pasa `conversationId`
- ✅ Segunda llamada a `/api/ai-chat` (sendMessage) ahora pasa `conversationId`
- ✅ Ambas llamadas guardan el `conversationId` de la respuesta

---

## ✅ Tracking Centralizado de OpenAI (Actualización)

### Objetivo
Registrar el uso de tokens y costos de **TODAS** las llamadas a la API de OpenAI en la plataforma, no solo las conversaciones con LIA.

### Nuevo Módulo: usage-monitor.ts

Se crearon funciones centralizadas en `apps/web/src/lib/openai/usage-monitor.ts`:

```typescript
// Interface para metadatos de llamadas OpenAI
export interface OpenAICallMetadata {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  promptCostUsd: number;
  completionCostUsd: number;
  totalCostUsd: number;
  model: string;
  endpoint: string;
  userId?: string;
  responseTimeMs?: number;
}

// Función para rastrear llamadas
export async function trackOpenAICall(metadata: OpenAICallMetadata): Promise<void>

// Helper para calcular metadatos
export function calculateOpenAIMetadata(
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number },
  model: string,
  endpoint: string,
  userId?: string,
  responseTimeMs?: number
): OpenAICallMetadata
```

### Endpoints Actualizados

| Endpoint | Estado | Archivo |
|----------|--------|---------|
| `/api/ai-chat` | ✅ Ya tenía tracking | [route.ts](apps/web/src/app/api/ai-chat/route.ts) |
| `/api/ai-intent` | ✅ Tracking agregado | [route.ts](apps/web/src/app/api/ai-intent/route.ts) |
| `/api/lia/context-help` | ✅ Tracking agregado | [route.ts](apps/web/src/app/api/lia/context-help/route.ts) |
| `/api/lia/proactive-help` | ✅ Tracking agregado | [route.ts](apps/web/src/app/api/lia/proactive-help/route.ts) |
| `/api/lia/onboarding-chat` | ✅ Delega a `/api/ai-chat` | [route.ts](apps/web/src/app/api/lia/onboarding-chat/route.ts) |
| `AutoTranslationService` | ✅ Tracking agregado | [autoTranslation.service.ts](apps/web/src/core/services/autoTranslation.service.ts) |
| `LanguageDetectionService` | ✅ Tracking agregado | [languageDetection.service.ts](apps/web/src/core/services/languageDetection.service.ts) |

### Desglose de Tokens y Costos

El sistema ahora registra por separado:
- **Prompt Tokens**: Tokens enviados a OpenAI (system prompt + historial + mensaje del usuario)
- **Completion Tokens**: Tokens generados por OpenAI (respuesta del asistente)
- **Prompt Cost USD**: Costo de los tokens de entrada
- **Completion Cost USD**: Costo de los tokens de salida
- **Total Cost USD**: Suma de ambos costos

### Ejemplo de Uso

```typescript
import { trackOpenAICall, calculateOpenAIMetadata } from '@/lib/openai/usage-monitor';

// Después de una llamada a OpenAI
const startTime = Date.now();
const response = await fetch('https://api.openai.com/v1/chat/completions', {...});
const data = await response.json();
const responseTime = Date.now() - startTime;

// Registrar el uso
if (data.usage) {
  await trackOpenAICall(calculateOpenAIMetadata(
    data.usage,
    'gpt-4-turbo-preview',
    'mi-endpoint',
    userId,
    responseTime
  ));
}
```

---

## ⚠️ Notas Importantes

1. **No bloquea la experiencia del usuario**: El sistema de analytics es asíncrono, por lo que los usuarios no notan el fallo
2. **Datos perdidos**: Las conversaciones de los últimos días NO se registraron y no pueden recuperarse
3. **Monitoring futuro**: Considerar agregar alertas cuando `lia_messages` no tenga inserts nuevos en 24h

---

## 📚 Referencias

- [AGENTES_LIA.md](docs/AGENTES_LIA.md) - Documentación completa del sistema LIA
- [LIA_ANALYTICS_PANEL.md](docs/LIA_ANALYTICS_PANEL.md) - Plan del panel de analytics
- [PLAN_LIA_PROMPTS.md](docs/PLAN_LIA_PROMPTS.md) - Esquema de base de datos original
