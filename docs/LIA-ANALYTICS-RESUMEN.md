# 📊 Sistema de Analytics para LIA - Resumen Ejecutivo

## 🎯 Objetivo del Sistema

Implementar un sistema integral de logging y analytics que capture todas las interacciones entre usuarios y LIA (Learning Intelligence Assistant) para:

1. **Minería de Datos**: Identificar patrones de uso, preguntas frecuentes y comportamientos
2. **Optimización Continua**: Mejorar prompts, actividades y respuestas basándose en datos reales
3. **Métricas de Negocio**: Medir engagement, satisfacción, completitud y ROI
4. **Control de Costos**: Monitorear uso de OpenAI y optimizar consumo de tokens

---

## 📁 Archivos Creados

### 1. Base de Datos
- **`database-fixes/lia-analytics-schema.sql`** (550+ líneas)
  - 5 tablas principales de logging
  - 2 vistas analíticas
  - 3 funciones helper
  - Triggers automáticos
  - Row Level Security (RLS)

### 2. Backend / API
- **`apps/web/src/lib/analytics/lia-logger.ts`** (450+ líneas)
  - Clase `LiaLogger` para logging estructurado
  - Funciones helper para análisis
  - TypeScript types completos

- **`apps/web/src/app/api/lia/end-conversation/route.ts`**
- **`apps/web/src/app/api/lia/start-activity/route.ts`**
- **`apps/web/src/app/api/lia/update-activity/route.ts`**
- **`apps/web/src/app/api/lia/complete-activity/route.ts`**
- **`apps/web/src/app/api/lia/feedback/route.ts`**

### 3. Documentación
- **`docs/LIA-ANALYTICS-PLAN.md`** (500+ líneas)
  - Plan de implementación completo
  - Guía paso a paso (4 fases)
  - Ejemplos de código
  - Checklist de implementación

- **`database-fixes/lia-analytics-queries.sql`** (400+ líneas)
  - 50+ queries útiles para análisis
  - Métricas de uso, calidad, costos
  - Queries de mantenimiento

---

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### 1. `lia_conversations`
Sesiones de conversación con metadatos:
```
- conversation_id (UUID)
- user_id (UUID) → users
- context_type (course, general, workshop, etc.)
- course_id, module_id, lesson_id, activity_id
- started_at, ended_at, duration_seconds
- total_messages, total_user_messages, total_lia_messages
- conversation_completed, user_abandoned
- device_type, browser, ip_address
```

#### 2. `lia_messages`
Cada mensaje individual:
```
- message_id (UUID)
- conversation_id (UUID) → lia_conversations
- role (user, assistant, system)
- content (TEXT)
- is_system_message (BOOLEAN)
- message_sequence (INTEGER)
- model_used, tokens_used, cost_usd, response_time_ms
- user_sentiment, sentiment_score
- contains_question, is_off_topic, lia_redirected
```

#### 3. `lia_activity_completions`
Progreso de actividades interactivas:
```
- completion_id (UUID)
- conversation_id (UUID)
- user_id (UUID)
- activity_id (UUID) → lesson_activities
- status (started, in_progress, completed, abandoned)
- total_steps, completed_steps, current_step
- generated_output (JSONB) - CSV, resultados, etc.
- attempts_to_complete, time_to_complete_seconds
- user_needed_help, lia_had_to_redirect
```

#### 4. `lia_user_feedback`
Feedback explícito del usuario:
```
- feedback_id (UUID)
- message_id (UUID) → lia_messages
- conversation_id (UUID)
- user_id (UUID)
- feedback_type (helpful, not_helpful, incorrect, confusing)
- rating (1-5 estrellas)
- comment (TEXT)
```

#### 5. `lia_common_questions`
Preguntas frecuentes detectadas automáticamente:
```
- question_id (UUID)
- question_text (TEXT)
- question_vector (VECTOR) - para similarity search
- context_type, lesson_id, activity_id
- times_asked, first_asked_at, last_asked_at
- best_response, best_response_rating
```

### Vistas Analíticas

#### `lia_conversation_analytics`
Dashboard completo de conversaciones con joins de cursos/lecciones/actividades y métricas calculadas.

#### `lia_activity_performance`
Performance de actividades interactivas: tasa de completitud, tiempo promedio, redirecciones.

---

## 💻 Uso del Sistema

### Ejemplo Básico: Loggear Conversación

```typescript
import { LiaLogger } from '@/lib/analytics/lia-logger';

// 1. Crear logger
const logger = new LiaLogger(userId);

// 2. Iniciar conversación
const conversationId = await logger.startConversation({
  contextType: 'course',
  courseContext: {
    courseId: 'uuid-curso',
    lessonId: 'uuid-leccion',
    activityId: 'uuid-actividad'
  },
  deviceType: 'desktop',
  browser: 'Chrome'
});

// 3. Loggear mensaje del usuario
await logger.logMessage('user', 'Mi pregunta sobre IA...');

// 4. Loggear respuesta de LIA con metadatos
await logger.logMessage('assistant', 'Aquí está la respuesta...', false, {
  modelUsed: 'gpt-4o-mini',
  tokensUsed: 150,
  costUsd: 0.0003,
  responseTimeMs: 1200
});

// 5. Cerrar conversación
await logger.endConversation(true); // true = completada
```

### Ejemplo: Tracking de Actividad Interactiva

```typescript
// 1. Iniciar actividad
const completionId = await logger.startActivity(activityId, 5); // 5 pasos

// 2. Actualizar progreso
await logger.updateActivityProgress(completionId, {
  currentStep: 2,
  completedSteps: 1
});

// 3. Incrementar redirecciones (cuando LIA tiene que redirigir)
await logger.incrementRedirections(completionId);

// 4. Completar actividad con output
await logger.completeActivity(completionId, {
  csv: 'Tarea,Datos,Decisión...',
  selectedOption: 'Tarea 1'
});
```

### Ejemplo: Registrar Feedback

```typescript
await logger.logFeedback(
  messageId,
  'helpful', // 'helpful', 'not_helpful', 'incorrect', 'confusing'
  5, // rating 1-5
  'Muy clara la explicación' // comentario opcional
);
```

---

## 📊 Métricas Clave Disponibles

### Métricas de Uso
- ✅ Conversaciones diarias/semanales/mensuales
- ✅ Mensajes por conversación (promedio)
- ✅ Usuarios activos con LIA
- ✅ Distribución de contextos (course, general, workshop)
- ✅ Horarios y días de mayor uso

### Métricas de Calidad
- ✅ Tasa de completitud de actividades
- ✅ Tiempo promedio de completitud
- ✅ Número de redirecciones necesarias
- ✅ Rating promedio de LIA por lección
- ✅ Tipos de feedback más comunes

### Métricas de Negocio
- ✅ Costo de OpenAI por usuario/curso
- ✅ ROI de LIA (engagement vs costo)
- ✅ Actividades completadas por dólar
- ✅ Impacto en completitud de lecciones
- ✅ Satisfacción del usuario (ratings)

### Métricas Técnicas
- ✅ Tiempo de respuesta de OpenAI
- ✅ Tokens consumidos por mensaje
- ✅ Costo promedio por interacción
- ✅ Anomalías y errores

---

## 🚀 Plan de Implementación (4 Fases)

### **FASE 1: Base de Datos** (Semana 1)
```sql
-- Ejecutar en Supabase SQL Editor
-- Archivo: database-fixes/lia-analytics-schema.sql
```
✅ Crear tablas, vistas, funciones, triggers y RLS policies

### **FASE 2: Integración en API** (Semana 2)
Modificar `/api/ai-chat/route.ts`:
- Iniciar conversación en primera interacción
- Loggear cada mensaje usuario/LIA
- Capturar metadatos de OpenAI (tokens, costo, tiempo)
- Retornar `conversationId` al frontend

### **FASE 3: Integración en Frontend** (Semana 2)
Modificar `useLiaChat.ts` y `/courses/[slug]/learn/page.tsx`:
- Mantener `conversationId` en estado
- Tracking de actividades interactivas
- Detectar progreso automáticamente
- Botones de feedback en mensajes

### **FASE 4: Dashboard de Analytics** (Semana 4)
Crear página `/admin/lia-analytics`:
- Métricas globales
- Gráficas de uso
- Tablas de performance
- Filtros de fecha/contexto

---

## 📈 Queries Útiles

### Top 10 Lecciones con Más Interacciones
```sql
SELECT 
  l.lesson_title,
  COUNT(DISTINCT c.conversation_id) as conversaciones,
  COUNT(DISTINCT c.user_id) as usuarios
FROM course_lessons l
JOIN lia_conversations c ON l.lesson_id = c.lesson_id
GROUP BY l.lesson_title
ORDER BY conversaciones DESC
LIMIT 10;
```

### Actividades con Mayor Tasa de Abandono
```sql
SELECT 
  activity_title,
  COUNT(*) FILTER (WHERE status = 'abandoned') as abandonos,
  COUNT(*) as total,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'abandoned')::NUMERIC / COUNT(*) * 100,
    2
  ) as tasa_abandono_pct
FROM lia_activity_completions ac
JOIN lesson_activities la ON ac.activity_id = la.activity_id
GROUP BY activity_title
ORDER BY tasa_abandono_pct DESC;
```

### Costo de OpenAI por Curso
```sql
SELECT 
  course_title,
  COUNT(DISTINCT c.conversation_id) as conversaciones,
  ROUND(SUM(m.cost_usd), 4) as costo_total_usd,
  ROUND(AVG(m.cost_usd), 6) as costo_promedio_mensaje
FROM courses co
JOIN lia_conversations c ON co.course_id = c.course_id
JOIN lia_messages m ON c.conversation_id = m.conversation_id
WHERE m.role = 'assistant'
GROUP BY course_title
ORDER BY costo_total_usd DESC;
```

*Ver `database-fixes/lia-analytics-queries.sql` para 50+ queries adicionales.*

---

## 🔒 Seguridad (Row Level Security)

Todas las tablas tienen RLS habilitado:

✅ **Usuarios solo pueden ver sus propias conversaciones**
```sql
CREATE POLICY "Users can view own conversations"
  ON lia_conversations FOR SELECT
  USING (auth.uid() = user_id);
```

✅ **Usuarios solo pueden insertar sus propios mensajes**
```sql
CREATE POLICY "Users can insert messages to own conversations"
  ON lia_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT conversation_id FROM lia_conversations WHERE user_id = auth.uid()
    )
  );
```

✅ **Admins tienen acceso completo** (configurable en Supabase Dashboard)

---

## 💰 Estimación de Costos

### OpenAI API (gpt-4o-mini)
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens
- Promedio: ~150 tokens por mensaje
- Costo estimado: **$0.0003 por mensaje**

### Supabase Storage
- Gratis hasta 500 MB
- $0.021 / GB después
- Estimado: **Negligible** (texto plano)

### Ejemplo Mensual (1000 conversaciones, 10 mensajes promedio)
- Mensajes totales: 10,000
- Costo OpenAI: 10,000 × $0.0003 = **$3.00/mes**
- Almacenamiento: **~$0/mes** (bajo 500 MB)
- **Total: ~$3/mes**

---

## ✅ Checklist de Implementación

### Base de Datos
- [ ] Ejecutar `lia-analytics-schema.sql`
- [ ] Verificar tablas creadas
- [ ] Verificar vistas funcionan
- [ ] Verificar funciones RPC
- [ ] Verificar RLS policies

### Backend
- [ ] Integrar `LiaLogger` en `/api/ai-chat`
- [ ] Crear 5 endpoints `/api/lia/*`
- [ ] Actualizar types (`CourseLessonContext`)

### Frontend
- [ ] Actualizar `useLiaChat.ts`
- [ ] Integrar tracking en actividades
- [ ] Añadir botones de feedback
- [ ] Detectar progreso automático

### Analytics Dashboard
- [ ] Crear página `/admin/lia-analytics`
- [ ] Implementar métricas globales
- [ ] Implementar gráficas
- [ ] Implementar filtros

### Testing
- [ ] Probar flujo completo
- [ ] Validar métricas calculadas
- [ ] Verificar permisos RLS
- [ ] Testing de carga

---

## 📞 Próximos Pasos

1. **Ejecutar SQL schema** en Supabase
2. **Integrar logger** en `/api/ai-chat/route.ts`
3. **Actualizar frontend** para pasar `conversationId`
4. **Probar flujo completo** con actividad Framework
5. **Crear dashboard** de analytics en admin

---

## 🎯 Beneficios Esperados

✅ **Visibilidad Completa**: Saber exactamente cómo los usuarios interactúan con LIA
✅ **Optimización Data-Driven**: Mejorar prompts y actividades basándose en datos reales
✅ **Control de Costos**: Monitorear y optimizar uso de OpenAI
✅ **Mejora Continua**: Identificar problemas y oportunidades automáticamente
✅ **ROI Medible**: Cuantificar el valor de LIA para el negocio

---

**Documentación Completa:** Ver `docs/LIA-ANALYTICS-PLAN.md`
**Queries SQL:** Ver `database-fixes/lia-analytics-queries.sql`
**Código Logger:** Ver `apps/web/src/lib/analytics/lia-logger.ts`
