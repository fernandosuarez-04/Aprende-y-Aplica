# 📊 PLAN COMPLETO: SISTEMA DE ANALYTICS PARA LIA

## 🎯 Objetivo

Implementar un sistema completo de logging y analytics para todas las interacciones usuario-LIA que permita:
- **Minería de datos** para identificar patrones de uso
- **Análisis de calidad** de respuestas de LIA
- **Optimización continua** del sistema basado en datos reales
- **Métricas de negocio** (engagement, completitud, satisfacción)

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### 1. Capa de Base de Datos (Supabase PostgreSQL)

#### **Tablas Principales:**

1. **`lia_conversations`** - Sesiones de conversación
   - Metadatos de cada sesión (usuario, contexto, curso/lección/actividad)
   - Duración, total de mensajes, estado de completitud
   - Device type, browser, IP para análisis de uso

2. **`lia_messages`** - Mensajes individuales
   - Contenido de cada mensaje (usuario/LIA/sistema)
   - Metadatos de OpenAI (modelo, tokens, costo, tiempo de respuesta)
   - Flags de calidad (pregunta, desvío, redirección)
   - Análisis de sentimiento (para procesar posteriormente)

3. **`lia_activity_completions`** - Progreso de actividades interactivas
   - Estado (started, in_progress, completed, abandoned)
   - Pasos completados vs totales
   - Tiempo para completar
   - Número de redirecciones necesarias
   - Output generado (CSV, resultados estructurados)

4. **`lia_user_feedback`** - Feedback explícito del usuario
   - Rating 1-5 estrellas por mensaje
   - Tipo de feedback (helpful, not_helpful, incorrect, confusing)
   - Comentarios opcionales

5. **`lia_common_questions`** - Preguntas frecuentes
   - Detección automática de preguntas repetidas
   - Embeddings para similarity search
   - Mejor respuesta basada en feedback

#### **Vistas Analíticas:**

1. **`lia_conversation_analytics`** - Dashboard de conversaciones
   - Join de conversaciones con cursos/lecciones/actividades
   - Métricas calculadas (mensajes por usuario, rating promedio)
   - Costos y tokens totales

2. **`lia_activity_performance`** - Performance de actividades
   - Tasa de completitud por actividad
   - Tiempo promedio de completitud
   - Promedio de redirecciones necesarias

### 2. Capa de Aplicación (TypeScript)

#### **Clase Principal: `LiaLogger`**

```typescript
const logger = new LiaLogger(userId);

// 1. Iniciar conversación
const conversationId = await logger.startConversation({
  contextType: 'course',
  courseContext: { courseId, lessonId, activityId }
});

// 2. Loggear mensajes
await logger.logMessage('user', 'Mi pregunta...', false);
await logger.logMessage('assistant', 'Respuesta de LIA...', false, {
  modelUsed: 'gpt-4o-mini',
  tokensUsed: 150,
  costUsd: 0.0003,
  responseTimeMs: 1200
});

// 3. Actividades interactivas
const completionId = await logger.startActivity(activityId, 5); // 5 pasos
await logger.updateActivityProgress(completionId, { 
  currentStep: 2, 
  completedSteps: 1 
});
await logger.completeActivity(completionId, { csv: '...' });

// 4. Cerrar conversación
await logger.endConversation(true); // true = completada
```

#### **Funciones Helper:**
- `getUserConversationStats(userId)` - Estadísticas de usuario
- `getActivityPerformance(activityId)` - Performance de actividad
- `getCommonQuestionsForLesson(lessonId)` - Preguntas frecuentes
- `getLiaGlobalMetrics(startDate, endDate)` - Métricas globales

---

## 📝 PLAN DE IMPLEMENTACIÓN

### **FASE 1: Base de Datos (Semana 1)**

#### ✅ Paso 1.1: Ejecutar Schema SQL
```bash
# Archivo: database-fixes/lia-analytics-schema.sql
# Ejecutar en Supabase SQL Editor
```

**Valida:**
- ✓ Todas las tablas creadas sin errores
- ✓ Vistas funcionan correctamente
- ✓ Triggers activos
- ✓ Funciones RPC creadas
- ✓ RLS policies aplicadas

#### ✅ Paso 1.2: Verificar Permisos
```sql
-- Verificar que authenticated tiene permisos
SELECT * FROM information_schema.table_privileges 
WHERE grantee = 'authenticated';
```

### **FASE 2: Integración en API (Semana 2)**

#### ✅ Paso 2.1: Integrar en `/api/ai-chat/route.ts`

**Modificaciones necesarias:**

```typescript
import { LiaLogger } from '../../../lib/analytics/lia-logger';

export async function POST(request: NextRequest) {
  // ... código existente de autenticación ...
  
  // ============ NUEVO: INICIAR LOGGING ============
  const logger = new LiaLogger(user.id);
  
  try {
    // 1. Iniciar conversación (si es primera interacción)
    let conversationId = body.conversationId; // Pasar desde frontend
    
    if (!conversationId) {
      conversationId = await logger.startConversation({
        contextType: body.context || 'general',
        courseContext: body.courseContext,
        deviceType: request.headers.get('sec-ch-ua-mobile') ? 'mobile' : 'desktop',
        browser: request.headers.get('user-agent'),
      });
    } else {
      logger.setConversationId(conversationId);
    }
    
    // 2. Loggear mensaje del usuario
    await logger.logMessage(
      body.isSystemMessage ? 'system' : 'user',
      body.message,
      body.isSystemMessage || false
    );
    
    // 3. Llamar OpenAI
    const startTime = Date.now();
    const { response, model, tokensUsed, cost } = await callOpenAI(...);
    const responseTime = Date.now() - startTime;
    
    // 4. Loggear respuesta de LIA
    await logger.logMessage('assistant', response, false, {
      modelUsed: model,
      tokensUsed: tokensUsed,
      costUsd: cost,
      responseTimeMs: responseTime
    });
    
    // 5. Retornar response + conversationId
    return NextResponse.json({
      response,
      conversationId, // ← Importante: devolver al frontend
      tokens: tokensUsed,
      cost
    });
    
  } catch (error) {
    // En caso de error, cerrar conversación como no completada
    if (logger.getCurrentConversationId()) {
      await logger.endConversation(false);
    }
    throw error;
  }
}
```

#### ✅ Paso 2.2: Actualizar Types

```typescript
// apps/web/src/core/types/lia.types.ts
export interface CourseLessonContext {
  courseId?: string;
  courseTitle?: string;
  moduleId?: string;
  moduleTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  activityId?: string; // ← AÑADIR
  // ... resto de campos
}
```

### **FASE 3: Integración en Frontend (Semana 2)**

#### ✅ Paso 3.1: Actualizar `useLiaChat.ts`

**Modificaciones:**

```typescript
export function useLiaChat(initialMessage?: string): UseLiaChatReturn {
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const sendMessage = useCallback(async (
    message: string,
    courseContext?: CourseLessonContext,
    isSystemMessage: boolean = false
  ) => {
    // ... código existente ...
    
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message.trim(),
        context: courseContext ? 'course' : 'general',
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        userName: user?.username || user?.first_name,
        courseContext: courseContext,
        isSystemMessage: isSystemMessage,
        conversationId: conversationId // ← Pasar conversation_id existente
      }),
    });
    
    const data = await response.json();
    
    // Guardar conversationId para siguientes mensajes
    if (data.conversationId && !conversationId) {
      setConversationId(data.conversationId);
    }
    
    // ... resto del código ...
  }, [conversationId, isLoading, messages, user]);
  
  const clearHistory = useCallback(() => {
    // Cerrar conversación al limpiar historial
    if (conversationId) {
      fetch('/api/lia/end-conversation', {
        method: 'POST',
        body: JSON.stringify({ conversationId, completed: false })
      });
    }
    
    setMessages([/* inicial */]);
    setConversationId(null);
  }, [conversationId]);
  
  return { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearHistory,
    conversationId // ← Exportar para uso en actividades
  };
}
```

#### ✅ Paso 3.2: Integrar en Actividades (`/courses/[slug]/learn/page.tsx`)

**Tracking de actividades:**

```typescript
// Estado para tracking de actividad
const [activityCompletionId, setActivityCompletionId] = useState<string | null>(null);

const handleStartActivityInteraction = async (activity: LessonActivity) => {
  // ... código existente del prompt ...
  
  await sendLiaMessage(systemPrompt, lessonContext, true);
  
  // ============ NUEVO: INICIAR TRACKING DE ACTIVIDAD ============
  if (conversationId) {
    try {
      const response = await fetch('/api/lia/start-activity', {
        method: 'POST',
        body: JSON.stringify({
          conversationId,
          activityId: activity.activity_id,
          totalSteps: 5 // Para Framework de 3 Columnas
        })
      });
      
      const { completionId } = await response.json();
      setActivityCompletionId(completionId);
    } catch (error) {
      console.error('Error starting activity tracking:', error);
    }
  }
};

// Al detectar progreso en la actividad (mediante análisis de mensajes):
const handleProgressDetected = async (step: number) => {
  if (!activityCompletionId) return;
  
  await fetch('/api/lia/update-activity', {
    method: 'POST',
    body: JSON.stringify({
      completionId: activityCompletionId,
      currentStep: step,
      completedSteps: step - 1
    })
  });
};

// Al completar actividad (detectar CSV en respuesta):
const handleActivityCompleted = async (generatedOutput: any) => {
  if (!activityCompletionId) return;
  
  await fetch('/api/lia/complete-activity', {
    method: 'POST',
    body: JSON.stringify({
      completionId: activityCompletionId,
      generatedOutput
    })
  });
};
```

### **FASE 4: Endpoints Adicionales (Semana 3)**

Crear endpoints específicos para operaciones de actividades:

#### ✅ `/api/lia/end-conversation`
```typescript
// apps/web/src/app/api/lia/end-conversation/route.ts
export async function POST(request: NextRequest) {
  const { conversationId, completed } = await request.json();
  const logger = new LiaLogger(user.id);
  logger.setConversationId(conversationId);
  await logger.endConversation(completed);
  return NextResponse.json({ success: true });
}
```

#### ✅ `/api/lia/start-activity`
```typescript
// apps/web/src/app/api/lia/start-activity/route.ts
export async function POST(request: NextRequest) {
  const { conversationId, activityId, totalSteps } = await request.json();
  const logger = new LiaLogger(user.id);
  logger.setConversationId(conversationId);
  const completionId = await logger.startActivity(activityId, totalSteps);
  return NextResponse.json({ completionId });
}
```

#### ✅ `/api/lia/update-activity`
```typescript
// apps/web/src/app/api/lia/update-activity/route.ts
export async function POST(request: NextRequest) {
  const { completionId, ...progress } = await request.json();
  const logger = new LiaLogger(user.id);
  await logger.updateActivityProgress(completionId, progress);
  return NextResponse.json({ success: true });
}
```

#### ✅ `/api/lia/complete-activity`
```typescript
// apps/web/src/app/api/lia/complete-activity/route.ts
export async function POST(request: NextRequest) {
  const { completionId, generatedOutput } = await request.json();
  const logger = new LiaLogger(user.id);
  await logger.completeActivity(completionId, generatedOutput);
  return NextResponse.json({ success: true });
}
```

#### ✅ `/api/lia/feedback`
```typescript
// apps/web/src/app/api/lia/feedback/route.ts
export async function POST(request: NextRequest) {
  const { messageId, feedbackType, rating, comment } = await request.json();
  const logger = new LiaLogger(user.id);
  await logger.logFeedback(messageId, feedbackType, rating, comment);
  return NextResponse.json({ success: true });
}
```

### **FASE 5: Dashboard de Analytics (Semana 4)**

Crear página de administración para visualizar métricas:

#### ✅ `/admin/lia-analytics/page.tsx`

**Componentes:**

1. **Métricas Globales:**
   - Total conversaciones (últimos 30 días)
   - Total mensajes
   - Actividades completadas
   - Costo total de OpenAI
   - Tiempo promedio de respuesta

2. **Gráficas:**
   - Conversaciones por día (línea)
   - Distribución de contextos (pie)
   - Actividades más populares (barras)
   - Tasa de completitud por actividad (barras)

3. **Tablas:**
   - Top 10 preguntas más frecuentes
   - Lecciones con más interacciones
   - Usuarios más activos con LIA

4. **Filtros:**
   - Rango de fechas
   - Por curso/lección
   - Por contexto (course, general, etc.)

**Ejemplo de código:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getLiaGlobalMetrics } from '../../../lib/analytics/lia-logger';

export default function LiaAnalyticsPage() {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    async function loadMetrics() {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Últimos 30 días
      const endDate = new Date();
      
      const data = await getLiaGlobalMetrics(startDate, endDate);
      setMetrics(data);
    }
    
    loadMetrics();
  }, []);
  
  if (!metrics) return <div>Cargando...</div>;
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics de LIA</h1>
      
      <div className="grid grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Conversaciones" 
          value={metrics.totalConversations}
          icon="💬"
        />
        <MetricCard 
          title="Mensajes" 
          value={metrics.totalMessages}
          icon="📝"
        />
        <MetricCard 
          title="Actividades Completadas" 
          value={metrics.completedActivities}
          icon="✅"
        />
        <MetricCard 
          title="Costo Total" 
          value={`$${metrics.totalCostUsd.toFixed(2)}`}
          icon="💰"
        />
      </div>
      
      {/* Más componentes de visualización... */}
    </div>
  );
}
```

---

## 📈 QUERIES ÚTILES PARA MINERÍA DE DATOS

### **1. Tasa de completitud por actividad**
```sql
SELECT 
  activity_title,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*) * 100, 
    2
  ) as completion_rate_pct
FROM lia_activity_completions ac
JOIN lesson_activities la ON ac.activity_id = la.activity_id
GROUP BY activity_title
ORDER BY completion_rate_pct DESC;
```

### **2. Preguntas más frecuentes por lección**
```sql
SELECT 
  l.lesson_title,
  COUNT(DISTINCT m.message_id) as total_questions,
  AVG(LENGTH(m.content)) as avg_question_length
FROM lia_messages m
JOIN lia_conversations c ON m.conversation_id = c.conversation_id
JOIN course_lessons l ON c.lesson_id = l.lesson_id
WHERE m.role = 'user' 
  AND m.contains_question = TRUE
GROUP BY l.lesson_id, l.lesson_title
ORDER BY total_questions DESC
LIMIT 10;
```

### **3. Usuarios con mayor engagement**
```sql
SELECT 
  u.username,
  u.email,
  COUNT(DISTINCT c.conversation_id) as total_conversations,
  SUM(c.total_messages) as total_messages,
  AVG(c.duration_seconds) as avg_duration_seconds
FROM users u
JOIN lia_conversations c ON u.user_id = c.user_id
GROUP BY u.user_id, u.username, u.email
ORDER BY total_conversations DESC
LIMIT 20;
```

### **4. Costo de OpenAI por curso**
```sql
SELECT 
  co.course_title,
  COUNT(DISTINCT c.conversation_id) as conversations,
  SUM(m.tokens_used) as total_tokens,
  SUM(m.cost_usd) as total_cost_usd,
  AVG(m.cost_usd) as avg_cost_per_message
FROM courses co
JOIN lia_conversations c ON co.course_id = c.course_id
JOIN lia_messages m ON c.conversation_id = m.conversation_id
WHERE m.role = 'assistant'
GROUP BY co.course_id, co.course_title
ORDER BY total_cost_usd DESC;
```

### **5. Análisis de desvíos y redirecciones**
```sql
SELECT 
  la.activity_title,
  AVG(ac.lia_had_to_redirect) as avg_redirects,
  COUNT(*) FILTER (WHERE ac.lia_had_to_redirect > 3) as high_redirect_count,
  ROUND(
    COUNT(*) FILTER (WHERE ac.lia_had_to_redirect > 3)::NUMERIC / COUNT(*) * 100,
    2
  ) as high_redirect_pct
FROM lia_activity_completions ac
JOIN lesson_activities la ON ac.activity_id = la.activity_id
GROUP BY la.activity_id, la.activity_title
ORDER BY avg_redirects DESC;
```

### **6. Tiempo promedio para completar actividades**
```sql
SELECT 
  la.activity_title,
  COUNT(*) as completions,
  AVG(time_to_complete_seconds) as avg_seconds,
  ROUND(AVG(time_to_complete_seconds) / 60, 2) as avg_minutes,
  MIN(time_to_complete_seconds) as fastest_seconds,
  MAX(time_to_complete_seconds) as slowest_seconds
FROM lia_activity_completions ac
JOIN lesson_activities la ON ac.activity_id = la.activity_id
WHERE status = 'completed'
GROUP BY la.activity_id, la.activity_title
ORDER BY avg_minutes DESC;
```

---

## 🎯 MÉTRICAS CLAVE A MONITOREAR

### **Métricas de Uso:**
- ✅ Conversaciones diarias/semanales/mensuales
- ✅ Mensajes por conversación (promedio)
- ✅ Usuarios activos con LIA
- ✅ Contextos más utilizados (course vs general)

### **Métricas de Calidad:**
- ✅ Tasa de completitud de actividades
- ✅ Tiempo promedio de completitud
- ✅ Número de redirecciones necesarias
- ✅ Ratio de feedback positivo vs negativo

### **Métricas de Negocio:**
- ✅ Costo de OpenAI por usuario/curso
- ✅ ROI de LIA (engagement vs costo)
- ✅ Impacto en completitud de lecciones
- ✅ Satisfacción del usuario (ratings)

### **Métricas Técnicas:**
- ✅ Tiempo de respuesta de OpenAI
- ✅ Tokens consumidos por mensaje
- ✅ Errores/fallos en API
- ✅ Latencia promedio

---

## 🔄 MANTENIMIENTO Y OPTIMIZACIÓN

### **Tareas Mensuales:**
1. Revisar preguntas frecuentes y actualizar prompts
2. Analizar actividades con baja completitud
3. Optimizar actividades con alto número de redirecciones
4. Revisar feedback negativo y ajustar respuestas

### **Tareas Trimestrales:**
1. Análisis de costo-beneficio de LIA
2. Identificar lecciones que necesitan más soporte de LIA
3. Evaluar necesidad de nuevos tipos de actividades interactivas
4. Entrenar modelos de sentimiento para análisis automático

### **Backups:**
```sql
-- Exportar datos cada mes
COPY (SELECT * FROM lia_conversations WHERE started_at >= '2025-01-01') 
TO '/tmp/lia_conversations_jan_2025.csv' WITH CSV HEADER;

COPY (SELECT * FROM lia_messages WHERE created_at >= '2025-01-01') 
TO '/tmp/lia_messages_jan_2025.csv' WITH CSV HEADER;
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Base de Datos:
- [ ] Ejecutar `lia-analytics-schema.sql` en Supabase
- [ ] Verificar todas las tablas creadas
- [ ] Verificar vistas funcionan correctamente
- [ ] Verificar funciones RPC disponibles
- [ ] Verificar RLS policies activas

### Backend:
- [ ] Integrar `LiaLogger` en `/api/ai-chat/route.ts`
- [ ] Crear endpoint `/api/lia/end-conversation`
- [ ] Crear endpoint `/api/lia/start-activity`
- [ ] Crear endpoint `/api/lia/update-activity`
- [ ] Crear endpoint `/api/lia/complete-activity`
- [ ] Crear endpoint `/api/lia/feedback`

### Frontend:
- [ ] Actualizar `useLiaChat.ts` con conversationId
- [ ] Integrar tracking en `/courses/[slug]/learn/page.tsx`
- [ ] Añadir botones de feedback en mensajes de LIA
- [ ] Implementar detección automática de progreso

### Analytics Dashboard:
- [ ] Crear página `/admin/lia-analytics`
- [ ] Implementar métricas globales
- [ ] Implementar gráficas de uso
- [ ] Implementar tablas de datos
- [ ] Implementar filtros de fecha/contexto

### Testing:
- [ ] Probar flujo completo de conversación
- [ ] Probar tracking de actividades
- [ ] Probar sistema de feedback
- [ ] Validar cálculo de métricas
- [ ] Verificar permisos RLS

---

## 📚 RECURSOS ADICIONALES

- **Schema SQL:** `database-fixes/lia-analytics-schema.sql`
- **Logger Class:** `apps/web/src/lib/analytics/lia-logger.ts`
- **Documentación de Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **OpenAI Token Pricing:** https://openai.com/pricing

---

**Última actualización:** 5 de noviembre de 2025
**Autor:** Sistema de Analytics LIA
**Versión:** 1.0.0
