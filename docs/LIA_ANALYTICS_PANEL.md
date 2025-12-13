# Panel de Analytics de LIA - Plan de Implementación

## 📋 Resumen Ejecutivo

Este documento describe el plan de implementación para el **Panel de Analytics de LIA**, una herramienta de administración que permitirá visualizar en detalle los costos, tokens y métricas operativas del agente de inteligencia artificial LIA.

---

## 🎯 Objetivos

### Objetivo Principal
Crear un panel de administración completo que permita:
- **Monitorear costos** en tiempo real y por períodos
- **Analizar uso de tokens** por modelo, contexto y usuario
- **Visualizar métricas de rendimiento** del agente
- **Identificar patrones de uso** para optimización

### Objetivos Específicos
1. Visualizar costo total acumulado (diario, semanal, mensual, histórico)
2. Desglosar costos por modelo de IA (gpt-4o-mini, gpt-4o)
3. Analizar tokens de entrada vs salida
4. Medir tiempos de respuesta promedio
5. Identificar usuarios más activos con LIA
6. Ver distribución de contextos (course, general, prompts, etc.)
7. Analizar tasa de completación de actividades
8. Mostrar preguntas frecuentes por lección

---

## 🏗️ Arquitectura

### Estructura de Archivos

```
apps/web/src/
├── app/
│   ├── admin/
│   │   └── lia-analytics/
│   │       └── page.tsx                    # Página principal del panel
│   └── api/
│       └── admin/
│           └── lia-analytics/
│               ├── route.ts                # API principal de métricas
│               ├── conversations/
│               │   └── route.ts            # API de conversaciones
│               ├── costs/
│               │   └── route.ts            # API de costos detallados
│               ├── usage-by-context/
│               │   └── route.ts            # API de uso por contexto
│               └── top-users/
│                   └── route.ts            # API de usuarios top
└── features/
    └── admin/
        └── components/
            ├── LiaAnalyticsPage.tsx        # Componente página principal
            ├── LiaAnalyticsWidgets/
            │   ├── index.ts
            │   ├── CostOverviewWidget.tsx   # Widget de costos generales
            │   ├── TokenUsageWidget.tsx     # Widget de uso de tokens
            │   ├── ResponseTimeWidget.tsx   # Widget de tiempos de respuesta
            │   ├── ContextDistributionWidget.tsx # Widget de distribución
            │   ├── TopUsersWidget.tsx       # Widget de usuarios top
            │   ├── ConversationsTableWidget.tsx # Tabla de conversaciones
            │   ├── ActivityPerformanceWidget.tsx # Widget de actividades
            │   └── CostProjectionWidget.tsx # Widget de proyección de costos
            └── index.ts                     # Exportaciones actualizadas
```

---

## 📊 Métricas a Mostrar

### 1. Panel de Costos (CostOverviewWidget)

| Métrica | Descripción | Fuente |
|---------|-------------|--------|
| **Costo Total Hoy** | Gasto del día actual | `lia_messages.cost_usd` |
| **Costo Semanal** | Gasto de los últimos 7 días | `lia_messages.cost_usd` |
| **Costo Mensual** | Gasto del mes actual | `lia_messages.cost_usd` |
| **Costo Histórico** | Gasto total acumulado | `lia_messages.cost_usd` |
| **Proyección Mensual** | Estimación basada en uso actual | Calculado |

### 2. Uso de Tokens (TokenUsageWidget)

| Métrica | Descripción | Fuente |
|---------|-------------|--------|
| **Tokens de Entrada** | Total de tokens en prompts | `lia_messages.tokens_used` (estimado) |
| **Tokens de Salida** | Total de tokens en respuestas | `lia_messages.tokens_used` (estimado) |
| **Tokens Promedio/Mensaje** | Media de tokens por mensaje | Calculado |
| **Tokens por Modelo** | Desglose gpt-4o-mini vs gpt-4o | `lia_messages.model_used` |

### 3. Tiempos de Respuesta (ResponseTimeWidget)

| Métrica | Descripción | Fuente |
|---------|-------------|--------|
| **Tiempo Promedio** | Latencia media de respuestas | `lia_messages.response_time_ms` |
| **Tiempo Mínimo** | Respuesta más rápida | `lia_messages.response_time_ms` |
| **Tiempo Máximo** | Respuesta más lenta | `lia_messages.response_time_ms` |
| **Percentil 95** | 95% de respuestas bajo este tiempo | Calculado |

### 4. Distribución de Contextos (ContextDistributionWidget)

| Métrica | Descripción | Fuente |
|---------|-------------|--------|
| **Por Tipo** | course, general, workshop, prompts | `lia_conversations.context_type` |
| **Conversaciones/Contexto** | Cantidad por tipo | Agregado |
| **Costo/Contexto** | Gasto por tipo de contexto | Calculado |

### 5. Usuarios Top (TopUsersWidget)

| Métrica | Descripción | Fuente |
|---------|-------------|--------|
| **Top 10 por Mensajes** | Usuarios con más interacciones | `lia_messages` |
| **Top 10 por Costo** | Usuarios que más gastan | `lia_messages.cost_usd` |
| **Top 10 por Tokens** | Usuarios con más tokens | `lia_messages.tokens_used` |

### 6. Tabla de Conversaciones (ConversationsTableWidget)

| Columna | Descripción |
|---------|-------------|
| **ID** | Identificador de conversación |
| **Usuario** | Nombre/email del usuario |
| **Contexto** | Tipo de contexto |
| **Mensajes** | Total de mensajes |
| **Tokens** | Tokens consumidos |
| **Costo** | Costo en USD |
| **Duración** | Tiempo de la conversación |
| **Estado** | Completada/En progreso |

### 7. Performance de Actividades (ActivityPerformanceWidget)

| Métrica | Descripción | Fuente |
|---------|-------------|--------|
| **Tasa de Completación** | % de actividades terminadas | `lia_activity_completions` |
| **Tasa de Abandono** | % de actividades abandonadas | `lia_activity_completions` |
| **Tiempo Promedio** | Duración media para completar | `time_to_complete_seconds` |
| **Redirecciones** | Promedio de redirecciones de LIA | `lia_had_to_redirect` |

### 8. Proyección de Costos (CostProjectionWidget)

| Métrica | Descripción |
|---------|-------------|
| **Proyección Diaria** | Estimación de gasto diario |
| **Proyección Semanal** | Estimación de gasto semanal |
| **Proyección Mensual** | Estimación de gasto mensual |
| **Alertas de Presupuesto** | Indicadores de límites |

---

## 🎨 Diseño de UI

### Layout Principal

```
┌─────────────────────────────────────────────────────────────────────┐
│  LIA Analytics Dashboard                           [Filtros] [Export]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │  Costo Hoy   │ │ Costo Mes    │ │   Tokens     │ │  Respuesta   ││
│  │   $0.42      │ │   $12.58     │ │   125,340    │ │   1.2s avg   ││
│  │  ▲ 12%       │ │  ▼ 5%        │ │  ▲ 8%        │ │  ▼ 15%       ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│
│                                                                      │
│  ┌────────────────────────────────┐ ┌───────────────────────────────┐│
│  │   📈 Costos por Período        │ │  🥧 Distribución de Contextos ││
│  │   [Gráfico de línea/barras]    │ │  [Gráfico circular]           ││
│  │                                │ │                               ││
│  │                                │ │                               ││
│  └────────────────────────────────┘ └───────────────────────────────┘│
│                                                                      │
│  ┌────────────────────────────────┐ ┌───────────────────────────────┐│
│  │   👥 Top Usuarios              │ │  ⚡ Performance Actividades   ││
│  │   [Lista con métricas]         │ │  [Métricas de completación]   ││
│  │                                │ │                               ││
│  └────────────────────────────────┘ └───────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │   📋 Tabla de Conversaciones Recientes                          ││
│  │   [Tabla paginada con filtros]                                  ││
│  │                                                                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Paleta de Colores

```css
/* Variables para el panel */
--lia-primary: #6366f1;      /* Indigo - Color principal */
--lia-success: #10b981;      /* Verde - Métricas positivas */
--lia-warning: #f59e0b;      /* Amarillo - Alertas */
--lia-danger: #ef4444;       /* Rojo - Costos altos */
--lia-info: #3b82f6;         /* Azul - Información */

/* Contextos */
--context-course: #8b5cf6;   /* Violeta */
--context-general: #6366f1;  /* Indigo */
--context-workshop: #14b8a6; /* Teal */
--context-prompts: #f97316;  /* Naranja */
--context-community: #ec4899;/* Rosa */
```

---

## 🔌 APIs a Implementar

### 1. GET `/api/admin/lia-analytics`
Endpoint principal que retorna todas las métricas resumidas.

**Parámetros:**
- `startDate`: Fecha inicial (ISO string)
- `endDate`: Fecha final (ISO string)
- `period`: 'day' | 'week' | 'month' | 'year'

**Respuesta:**
```typescript
interface LiaAnalyticsResponse {
  success: boolean;
  data: {
    summary: {
      totalConversations: number;
      totalMessages: number;
      totalTokens: number;
      totalCostUsd: number;
      avgResponseTimeMs: number;
      completedActivities: number;
    };
    costsByPeriod: Array<{
      date: string;
      cost: number;
      tokens: number;
      messages: number;
    }>;
    contextDistribution: Array<{
      contextType: string;
      count: number;
      cost: number;
      percentage: number;
    }>;
    modelUsage: Array<{
      model: string;
      tokens: number;
      cost: number;
      percentage: number;
    }>;
  };
}
```

### 2. GET `/api/admin/lia-analytics/conversations`
Obtiene lista paginada de conversaciones con detalles.

**Parámetros:**
- `page`: Número de página
- `limit`: Registros por página
- `contextType`: Filtro por contexto
- `userId`: Filtro por usuario
- `startDate`, `endDate`: Rango de fechas

### 3. GET `/api/admin/lia-analytics/top-users`
Obtiene los usuarios con mayor uso de LIA.

**Parámetros:**
- `limit`: Cantidad de usuarios (default: 10)
- `sortBy`: 'messages' | 'cost' | 'tokens'
- `period`: Período de tiempo

### 4. GET `/api/admin/lia-analytics/costs`
Obtiene desglose detallado de costos.

**Parámetros:**
- `groupBy`: 'day' | 'week' | 'month'
- `startDate`, `endDate`: Rango de fechas

---

## 🛠️ Tecnologías

### Frontend
- **React** + **TypeScript**
- **Tailwind CSS** para estilos
- **Recharts** para gráficos
- **SWR** para fetching de datos
- **date-fns** para manejo de fechas

### Backend
- **Next.js API Routes**
- **Supabase** para queries
- **TypeScript** para tipado

---

## 📅 Plan de Implementación

### Fase 1: APIs Base (Día 1)
1. ✅ Crear documento de planificación
2. Crear API `/api/admin/lia-analytics`
3. Crear API `/api/admin/lia-analytics/conversations`
4. Crear API `/api/admin/lia-analytics/top-users`
5. Crear API `/api/admin/lia-analytics/costs`

### Fase 2: Componentes de UI (Día 1-2)
1. Crear `LiaAnalyticsPage.tsx`
2. Crear widgets de métricas (4 tarjetas principales)
3. Crear `CostOverviewWidget` con gráfico
4. Crear `ContextDistributionWidget` con pie chart
5. Crear `TopUsersWidget` con lista
6. Crear `ConversationsTableWidget` con paginación

### Fase 3: Integración (Día 2)
1. Agregar ruta al sidebar de admin
2. Crear página en `/admin/lia-analytics`
3. Conectar APIs con componentes
4. Agregar filtros y exportación

### Fase 4: Polish y Testing (Día 2-3)
1. Responsive design
2. Dark mode
3. Loading states
4. Error handling
5. Testing manual

---

## 📊 Consultas SQL de Referencia

### Costo Total por Período
```sql
SELECT 
  DATE_TRUNC('day', created_at) as date,
  SUM(cost_usd) as total_cost,
  SUM(tokens_used) as total_tokens,
  COUNT(*) as message_count
FROM lia_messages
WHERE created_at BETWEEN :startDate AND :endDate
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date;
```

### Distribución por Contexto
```sql
SELECT 
  c.context_type,
  COUNT(DISTINCT c.conversation_id) as conversations,
  SUM(m.cost_usd) as total_cost,
  SUM(m.tokens_used) as total_tokens
FROM lia_conversations c
JOIN lia_messages m ON c.conversation_id = m.conversation_id
WHERE c.started_at BETWEEN :startDate AND :endDate
GROUP BY c.context_type;
```

### Top Usuarios por Costo
```sql
SELECT 
  c.user_id,
  u.nombre || ' ' || u.apellido as name,
  u.email,
  COUNT(DISTINCT c.conversation_id) as conversations,
  SUM(m.cost_usd) as total_cost,
  SUM(m.tokens_used) as total_tokens
FROM lia_conversations c
JOIN lia_messages m ON c.conversation_id = m.conversation_id
JOIN usuarios u ON c.user_id = u.id
WHERE c.started_at BETWEEN :startDate AND :endDate
GROUP BY c.user_id, u.nombre, u.apellido, u.email
ORDER BY total_cost DESC
LIMIT :limit;
```

---

## ⚠️ Consideraciones de Seguridad

1. **Acceso Restringido**: Solo administradores pueden acceder
2. **Datos Sensibles**: No mostrar contenido de mensajes
3. **Rate Limiting**: Limitar consultas a la API
4. **Logs de Auditoría**: Registrar accesos al panel

---

## 🚀 Mejoras Futuras

1. **Alertas Automáticas**: Notificaciones cuando costos excedan límites
2. **Exportación a CSV/PDF**: Descargar reportes
3. **Comparación de Períodos**: Comparar métricas entre fechas
4. **Dashboard en Tiempo Real**: WebSockets para updates live
5. **Predicción de Costos**: ML para proyectar gastos

---

**Documento creado**: Diciembre 2025  
**Versión**: 1.0  
**Autor**: Sistema de Desarrollo  

