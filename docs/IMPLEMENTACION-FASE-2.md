# 📊 Implementación Fase 2: Detección Proactiva de Dificultades

## 🎯 Objetivo

Implementar un sistema que detecte automáticamente cuando un usuario está teniendo dificultades durante un taller y ofrezca ayuda proactiva de LIA **sin que el usuario la pida**.

---

## 📦 Archivos Creados/Modificados

### ✅ Archivos Nuevos (5)

1. **`apps/web/src/lib/rrweb/difficulty-pattern-detector.ts`** (415 líneas)
   - Clase `DifficultyPatternDetector`
   - Detecta 6 patrones de dificultad
   - Calcula difficulty score (0-1)
   - Genera mensajes contextuales

2. **`apps/web/src/hooks/useDifficultyDetection.ts`** (186 líneas)
   - Hook de React para monitoreo continuo
   - Análisis cada 30 segundos
   - Cooldown de 5 minutos entre intervenciones
   - Callbacks para eventos

3. **`apps/web/src/components/ProactiveLIAAssistant/`**
   - **`ProactiveLIAAssistant.tsx`** (256 líneas)
   - Componente de UI para intervenciones
   - Animaciones con Framer Motion
   - Muestra patrones detectados
   - Botones Aceptar/Dismissar
   
   - **`index.ts`** (2 líneas)
   - Barrel export

4. **`apps/web/src/app/api/lia/proactive-help/route.ts`** (397 líneas)
   - Endpoint POST `/api/lia/proactive-help`
   - Integración con SessionAnalyzer
   - Construcción de prompts contextuales
   - Respuestas de OpenAI GPT-4 Turbo
   - Fallback a respuestas simuladas

5. **`apps/web/src/components/WorkshopLearningProvider/`**
   - **`WorkshopLearningProvider.tsx`** (183 líneas)
   - Provider/Wrapper para páginas de talleres
   - Integra detección + UI proactiva
   - Maneja flujo completo de ayuda
   - Debug info en desarrollo
   
   - **`index.ts`** (2 líneas)
   - Barrel export

---

## 🔄 Cómo Funciona

### Flujo Completo

```
1. Usuario navega en taller
   └─> GlobalRecorderProvider graba eventos
       └─> Buffer circular de 5000 eventos

2. WorkshopLearningProvider activo
   └─> useDifficultyDetection inicia monitoreo
       └─> Análisis cada 30 segundos

3. Análisis de patrones (DifficultyPatternDetector)
   ├─ ⏱️ Inactividad > 2 min?
   ├─ 🔄 Volver atrás > 3 veces?
   ├─ ❌ Intentos fallidos > 3?
   ├─ 📜 Scroll excesivo > 4 cambios dirección?
   ├─ ⌨️ Borrado frecuente > 10 veces?
   └─ 🖱️ Clicks erróneos > 5 veces?

4. Cálculo de Difficulty Score
   └─> Score >= 0.6 → Disparar intervención

5. ProactiveLIAAssistant aparece
   ├─ Animación suave desde bottom-right
   ├─ Mensaje contextual de LIA
   ├─ Botones: "Sí, ayúdame" | "Ahora no"
   └─ Indicador visual de severidad

6a. Usuario acepta ayuda
    └─> POST /api/lia/proactive-help
        ├─ Analiza sesión con SessionAnalyzer
        ├─ Construye prompt contextual
        ├─ Llama OpenAI GPT-4
        └─> Retorna: respuesta + sugerencias + recursos

6b. Usuario dismissea
    └─> Cooldown de 5 minutos
        └─> No volver a intervenir hasta que pase tiempo

7. LIA responde con ayuda específica
   └─> Usuario puede continuar taller
```

---

## 🛠️ Detalles Técnicos

### 1. DifficultyPatternDetector

**Patrones Detectados:**

| Patrón | Threshold | Severidad | Descripción |
|--------|-----------|-----------|-------------|
| `inactivity` | 120000ms (2 min) | medium/high | Usuario sin actividad prolongada |
| `repetitive_cycles` | 3 veces | medium | Usuario vuelve atrás repetidamente |
| `failed_attempts` | 3 intentos | high | Múltiples submits sin éxito |
| `excessive_scroll` | 4 cambios dirección | medium | Scroll arriba-abajo buscando info |
| `frequent_deletion` | 10 borrados | medium | Escribe y borra contenido muchas veces |
| `erroneous_clicks` | 5 clicks | low | Clicks en misma posición sin respuesta |

**Cálculo de Score:**

```typescript
overallScore = Σ(severityWeight) / maxPossibleWeight

severityWeights = {
  low: 0.3,
  medium: 0.6,
  high: 1.0
}

// Ejemplo:
patterns = [
  { type: 'failed_attempts', severity: 'high' },      // 1.0
  { type: 'excessive_scroll', severity: 'medium' }    // 0.6
]

overallScore = (1.0 + 0.6) / 2.0 = 0.8 (80%)
shouldIntervene = 0.8 >= 0.6 ✅
```

### 2. useDifficultyDetection Hook

**Opciones:**

```typescript
interface UseDifficultyDetectionOptions {
  workshopId?: string;           // Para contexto
  activityId?: string;           // Para contexto
  enabled?: boolean;             // Default: true
  checkInterval?: number;        // Default: 30000ms (30s)
  thresholds?: Partial<DetectionThresholds>; // Personalizar
  onDifficultyDetected?: (analysis) => void;
  onHelpAccepted?: (analysis) => void;
  onHelpDismissed?: (analysis) => void;
}
```

**Retorna:**

```typescript
interface UseDifficultyDetectionReturn {
  analysis: DifficultyAnalysis | null;
  shouldShowHelp: boolean;
  acceptHelp: () => void;
  dismissHelp: () => void;
  reset: () => void;
  isActive: boolean;
}
```

**Cooldown:**
- Mínimo 5 minutos entre intervenciones
- Evita spam de notificaciones
- Reseteable con `reset()`

### 3. ProactiveLIAAssistant Component

**Props:**

```typescript
interface ProactiveLIAAssistantProps {
  analysis: DifficultyAnalysis | null;
  show: boolean;
  onAccept: () => void;
  onDismiss: () => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
}
```

**Características UI:**

- ✨ Animación con Framer Motion (spring)
- 🎨 Header con gradiente purple-to-pink
- 🔔 Icono animado (Sparkles)
- 📊 Muestra patrones detectados
- 📈 Progress bar de difficulty score
- 🎯 Indicador pulsante (dot)
- 💬 Mensajes contextuales empáticos

### 4. API Endpoint: /api/lia/proactive-help

**Request:**

```typescript
POST /api/lia/proactive-help
Content-Type: application/json

{
  "analysis": {
    "overallScore": 0.75,
    "patterns": [
      {
        "type": "failed_attempts",
        "severity": "high",
        "description": "3 intentos fallidos detectados",
        "timestamp": 1699123456789
      }
    ],
    "shouldIntervene": true,
    "interventionMessage": "He notado varios intentos...",
    "detectedAt": 1699123456789
  },
  "sessionEvents": [...], // Últimos 200 eventos
  "workshopId": "workshop-123",
  "activityId": "activity-456"
}
```

**Response:**

```typescript
{
  "success": true,
  "response": "¡Hey! Veo que has intentado varias veces...",
  "suggestions": [
    "Compara tu respuesta con el ejemplo dado",
    "Verifica que incluyes: rol, contexto y objetivo"
  ],
  "resources": [
    {
      "title": "Guía: Cómo estructurar un buen prompt",
      "description": "Aprende las mejores prácticas...",
      "url": "/recursos/guia-prompts"
    }
  ],
  "nextSteps": [
    "Revisa el material de la lección",
    "Intenta el ejercicio con un enfoque diferente"
  ]
}
```

**Prompt Contextual:**

```
# Contexto de la situación

He detectado que el usuario está experimentando dificultades...

## Patrones de dificultad detectados:
- 3 intentos fallidos detectados (severidad: high)
- Scroll excesivo detectado (severidad: medium)

## Score de dificultad: 75%

## Análisis de sesión:
- Tiempo total: 245s
- Clicks totales: 47
- Scrolls: 23
- Inputs escritos: 8
- Intentos detectados: 3
- Nivel de dificultad: 0.68

# Tu tarea

Como LIA, ofrece ayuda proactiva al usuario...
```

**OpenAI GPT-4 Config:**

```typescript
{
  model: 'gpt-4-turbo-preview',
  temperature: 0.7,
  max_tokens: 800
}
```

### 5. WorkshopLearningProvider

**Uso:**

```tsx
// En cualquier página de taller
export default function WorkshopPage({ params }) {
  return (
    <WorkshopLearningProvider
      workshopId={params.id}
      activityId={params.activityId}
      enabled={true}
      checkInterval={30000}
      assistantPosition="bottom-right"
      onDifficultyDetected={(analysis) => {
        console.log('Dificultad detectada:', analysis);
      }}
    >
      <TuContenidoDeTaller />
    </WorkshopLearningProvider>
  );
}
```

**Características:**

- ✅ Integra todo el flujo automáticamente
- ✅ Maneja estado de carga
- ✅ Llama a API de ayuda proactiva
- ✅ Debug info en desarrollo
- ✅ No intrusivo (children renderiza normalmente)

---

## 🎨 UI/UX

### Estados del Componente

**1. Oculto (default)**
```
🔍 Detector activo en background
No visible para el usuario
```

**2. Apareciendo (difficulty detected)**
```
┌─────────────────────────────────┐
│ ✨ LIA está aquí para ayudar    │ x
│ Asistencia inteligente          │
├─────────────────────────────────┤
│ 💡 He notado varios intentos.   │
│    ¿Te gustaría que analice qué │
│    podría estar faltando?       │
│                                 │
│ Detalles detectados:            │
│ • 3 intentos fallidos           │
│ • Scroll excesivo               │
│                                 │
│ [Sí, ayúdame] [Ahora no]       │
│                                 │
│ Nivel: ████████░░ 80%          │
└─────────────────────────────────┘
```

**3. Aceptado**
```
→ Animación de salida
→ POST /api/lia/proactive-help
→ LIA responde (puede abrir chat automáticamente)
```

**4. Dismisseado**
```
→ Animación de salida
→ Cooldown de 5 minutos
→ Análisis continúa en background
```

### Variantes de Mensaje Según Patrón

| Patrón | Mensaje de LIA |
|--------|----------------|
| `inactivity` | "¡Hola! Noto que llevas un rato sin actividad. ¿Te gustaría que te dé algunas pistas?" |
| `repetitive_cycles` | "Veo que has vuelto atrás varias veces. ¿Te gustaría que revisemos juntos esta sección?" |
| `failed_attempts` | "He notado varios intentos. ¿Quieres que analice qué podría estar faltando en tu respuesta?" |
| `excessive_scroll` | "Parece que estás buscando información específica. ¿Puedo ayudarte a encontrar lo que necesitas?" |
| `frequent_deletion` | "Veo que estás ajustando tu respuesta varias veces. ¿Te gustaría revisar un ejemplo similar?" |
| `erroneous_clicks` | "Noto algunos clicks que no parecen estar funcionando. ¿Necesitas ayuda con la interfaz?" |

---

## 🧪 Guía de Testing

### Setup

1. **Asegúrate de tener rrweb grabando:**
   ```tsx
   // GlobalRecorderProvider debe estar activo en layout
   import { GlobalRecorderProvider } from '@/lib/rrweb/global-recorder-provider';
   ```

2. **Configura OPENAI_API_KEY (opcional):**
   ```bash
   # .env.local
   OPENAI_API_KEY=sk-...
   ```

3. **Envuelve página de taller:**
   ```tsx
   <WorkshopLearningProvider workshopId="test-123">
     <YourWorkshopContent />
   </WorkshopLearningProvider>
   ```

### Escenarios de Prueba

#### Escenario 1: Inactividad

```
1. Abre taller
2. NO hagas nada por 2+ minutos
3. Espera análisis (30s después de 2 min = 2:30 total)
4. ✅ Debe aparecer: "Noto que llevas un rato sin actividad..."
```

**Logs esperados:**
```
🔍 Detector de dificultad inicializado
📊 Análisis de dificultad: { score: 0.60, patterns: 1, shouldIntervene: true }
🚨 Dificultad detectada! Ofreciendo ayuda proactiva
🚨 Dificultad detectada por WorkshopLearningProvider
```

#### Escenario 2: Intentos Fallidos

```
1. Abre taller con formulario
2. Haz click en botón "Enviar" 3+ veces
3. Espera análisis (30s)
4. ✅ Debe aparecer: "He notado varios intentos..."
```

#### Escenario 3: Scroll Excesivo

```
1. Abre taller
2. Scroll down → up → down → up (4+ cambios de dirección)
3. Espera análisis (30s)
4. ✅ Debe aparecer: "Parece que estás buscando información..."
```

#### Escenario 4: Borrado Frecuente

```
1. Abre taller con input de texto
2. Escribe algo, selecciona todo, borra (repite 10+ veces)
3. Espera análisis (30s)
4. ✅ Debe aparecer: "Veo que estás ajustando tu respuesta..."
```

#### Escenario 5: Aceptar Ayuda

```
1. Dispara cualquier patrón
2. Aparece ProactiveLIAAssistant
3. Click "Sí, ayúdame"
4. ✅ Debe:
   - POST /api/lia/proactive-help
   - Console log: "📞 Solicitando ayuda proactiva a LIA..."
   - Console log: "✅ Respuesta de LIA recibida"
   - Console log: "💬 Respuesta de LIA: [texto]"
```

#### Escenario 6: Dismissear Ayuda

```
1. Dispara cualquier patrón
2. Aparece ProactiveLIAAssistant
3. Click "Ahora no" o X
4. ✅ Debe:
   - Componente desaparece
   - Console log: "❌ Usuario rechazó ayuda proactiva"
   - No volver a aparecer por 5 minutos
```

### Testing con Mock Data

Si no tienes OPENAI_API_KEY:

```typescript
// El endpoint automáticamente usa respuestas simuladas
console.log('⚠️ OPENAI_API_KEY no configurado, usando respuestas simuladas');

// Respuesta mock según patrón:
{
  success: true,
  response: "¡Hey! Veo que has intentado varias veces...",
  suggestions: [
    "Compara tu respuesta con el ejemplo dado",
    "Verifica que incluyes: rol, contexto y objetivo"
  ],
  resources: [
    {
      title: "Guía: Cómo estructurar un buen prompt",
      description: "Aprende las mejores prácticas..."
    }
  ]
}
```

---

## 🪲 Debugging

### Logs a Monitorear

**Frontend (Browser Console):**

```javascript
// Inicialización
🔍 Detector de dificultad inicializado { workshopId, checkInterval, ... }

// Análisis periódico
📊 Análisis de dificultad: { score: 0.45, patterns: 1, shouldIntervene: false }

// Dificultad detectada
🚨 Dificultad detectada! Ofreciendo ayuda proactiva
🚨 Dificultad detectada por WorkshopLearningProvider: { workshopId, score, patterns }

// Usuario acepta
✅ Usuario aceptó ayuda proactiva
📞 Solicitando ayuda proactiva a LIA...
✅ Respuesta de LIA recibida: { responseLength, suggestionsCount, ... }
💬 Respuesta de LIA: [texto completo]
💡 Sugerencias: [array de sugerencias]

// Usuario dismissea
❌ Usuario rechazó ayuda proactiva

// Cooldown
⏳ Dificultad detectada pero esperando cooldown de intervención
```

**Backend (Server Console):**

```javascript
// Request recibido
🤖 Procesando ayuda proactiva de LIA: { patterns: 2, score: 0.75, workshopId }

// Con OpenAI
✅ Respuesta proactiva generada: { responseLength: 450, suggestionsCount: 3 }

// Sin OpenAI
⚠️ OPENAI_API_KEY no configurado, usando respuestas simuladas
✅ Respuesta proactiva generada (mock): { ... }

// Errores
❌ Error en /api/lia/proactive-help: [error message]
```

### Componente de Debug (Development)

En desarrollo, `WorkshopLearningProvider` muestra overlay:

```
┌─────────────────────┐
│ 🔍 Detector Activo  │
│ Workshop: test-123  │
│ Activity: act-456   │
│ Check interval: 30s │
│                     │
│ 📊 Análisis:        │
│ Score: 75%          │
│ Patterns: 2         │
└─────────────────────┘
```

### Troubleshooting

**Problema:** Nunca aparece el asistente

✅ **Solución:**
1. Verifica que `enabled={true}` en WorkshopLearningProvider
2. Verifica que rrweb está grabando (check console logs)
3. Espera al menos `checkInterval` + tiempo para detectar patrón
4. Verifica que el patrón alcanza threshold (ej: >2 min inactividad)

**Problema:** Aparece muy seguido

✅ **Solución:**
1. Verifica cooldown de 5 minutos está activo
2. Ajusta `thresholds` para ser más estricto:
   ```tsx
   thresholds={{
     inactivityThreshold: 300000, // 5 min en vez de 2
     failedAttemptsThreshold: 5,  // 5 en vez de 3
   }}
   ```

**Problema:** Error al llamar API

✅ **Solución:**
1. Verifica que endpoint existe: `/api/lia/proactive-help`
2. Verifica JSON en request (ver Network tab)
3. Si no tienes OpenAI key, debería usar mocks
4. Check server console para errores

**Problema:** Respuestas genéricas

✅ **Solución:**
1. Configura OPENAI_API_KEY para GPT-4 real
2. Verifica que se envían `sessionEvents` con datos
3. Ajusta prompt en `buildProactivePrompt()` para más especificidad

---

## ⚙️ Configuración Avanzada

### Personalizar Thresholds

```tsx
<WorkshopLearningProvider
  workshopId="test"
  enabled={true}
  checkInterval={45000} // Analizar cada 45s en vez de 30s
  // Personalizar umbrales (opcional)
  thresholds={{
    inactivityThreshold: 180000,      // 3 min
    scrollRepeatThreshold: 6,         // 6 cambios
    failedAttemptsThreshold: 5,       // 5 intentos
    deleteKeysThreshold: 15,          // 15 borrados
    erroneousClicksThreshold: 8,      // 8 clicks
    analysisWindow: 240000            // 4 min de ventana
  }}
/>
```

### Desactivar para Usuarios Avanzados

```tsx
// Ejemplo: No intervenir si usuario tiene alta tasa de completación
const shouldEnableDetection = user.completionRate < 0.8;

<WorkshopLearningProvider
  workshopId={workshopId}
  enabled={shouldEnableDetection}
>
  ...
</WorkshopLearningProvider>
```

### Integración con Analytics

```tsx
<WorkshopLearningProvider
  workshopId={workshopId}
  onDifficultyDetected={(analysis) => {
    // Enviar a analytics
    analytics.track('Difficulty Detected', {
      workshopId,
      score: analysis.overallScore,
      patterns: analysis.patterns.map(p => p.type),
      timestamp: analysis.detectedAt
    });
  }}
  onHelpAccepted={(analysis) => {
    analytics.track('Proactive Help Accepted', {
      workshopId,
      patterns: analysis.patterns.map(p => p.type)
    });
  }}
  onHelpDismissed={(analysis) => {
    analytics.track('Proactive Help Dismissed', {
      workshopId,
      patterns: analysis.patterns.map(p => p.type)
    });
  }}
>
  ...
</WorkshopLearningProvider>
```

---

## 📊 Métricas de Éxito

### KPIs a Medir

| Métrica | Objetivo | Cómo Medirla |
|---------|----------|--------------|
| **Tasa de Intervención** | 15-25% de sesiones | `interventions / total_sessions` |
| **Tasa de Aceptación** | >60% aceptan ayuda | `help_accepted / interventions` |
| **Efectividad** | +40% completan después de ayuda | `completions_after_help / total_helped` |
| **Abandono Reducido** | -30% abandono | Comparar abandono con/sin sistema |
| **Tiempo a Completación** | -15% tiempo promedio | Comparar tiempos con/sin ayuda |

### Dashboard de Métricas (Futuro)

```
📊 Sistema de Detección Proactiva - Últimos 30 días

┌──────────────────────────────────────────┐
│ 🔍 Intervenciones Totales: 1,250         │
│ ✅ Ayudas Aceptadas: 820 (65.6%)         │
│ ❌ Dismisseadas: 430 (34.4%)             │
│ 📈 Completación Post-Ayuda: 78%          │
└──────────────────────────────────────────┘

Patrones Más Detectados:
1. ❌ Intentos Fallidos: 45%
2. 📜 Scroll Excesivo: 28%
3. ⏱️ Inactividad: 18%
4. ⌨️ Borrado Frecuente: 6%
5. 🔄 Ciclos Repetitivos: 3%

Talleres con Mayor Intervención:
1. "Crear Prompts para Marketing" - 35%
2. "Framework para Análisis de IA" - 28%
3. "Herramientas de IA Aplicadas" - 22%
```

---

## 🚀 Próximos Pasos

### Mejoras Inmediatas

1. **Integración con Chat LIA:**
   ```tsx
   // Cuando usuario acepta ayuda, abrir chat automáticamente
   const handleAcceptHelp = async () => {
     const response = await fetchProactiveHelp();
     
     // Abrir chat con respuesta pre-cargada
     openLIAChat({
       preloadedMessage: response.response,
       suggestions: response.suggestions
     });
   };
   ```

2. **Persistencia de Estado:**
   ```typescript
   // Guardar intervenciones en base de datos
   interface LIAIntervention {
     id: string;
     session_id: string;
     workshop_id: string;
     patterns: string[];
     score: number;
     accepted: boolean;
     timestamp: Date;
   }
   ```

3. **A/B Testing:**
   ```tsx
   // Experimento: con vs sin detección proactiva
   const variant = useExperiment('proactive-lia-detection');
   
   <WorkshopLearningProvider
     enabled={variant === 'treatment'}
     ...
   />
   ```

### Fase 3: Personalización (siguiente)

- Perfiles de aprendizaje
- Adaptación de thresholds por usuario
- Historial de intervenciones
- Recomendaciones personalizadas

---

## ✅ Checklist de Implementación

- [x] ✅ `DifficultyPatternDetector` creado y funcional
- [x] ✅ `useDifficultyDetection` hook implementado
- [x] ✅ `ProactiveLIAAssistant` componente con UI completa
- [x] ✅ Endpoint `/api/lia/proactive-help` funcionando
- [x] ✅ `WorkshopLearningProvider` integrado
- [x] ✅ Documentación completa
- [ ] ⏳ Testing con usuarios reales
- [ ] ⏳ Configurar OPENAI_API_KEY en producción
- [ ] ⏳ Integrar en páginas de talleres existentes
- [ ] ⏳ Métricas y analytics implementados
- [ ] ⏳ Dashboard de métricas para instructores

---

## 🎓 Conclusión

**Fase 2 está completa** con un sistema robusto de detección proactiva que:

✅ Detecta 6 patrones de dificultad en tiempo real  
✅ Calcula scores algorítmicos de dificultad  
✅ Ofrece ayuda contextual automática  
✅ UI/UX no intrusiva y empática  
✅ Integración completa con OpenAI GPT-4  
✅ Fallback a respuestas simuladas  
✅ Sistema de cooldown para evitar spam  
✅ Debug tools para desarrollo  
✅ Altamente configurable  

**Impacto esperado:**
- 📉 -30% abandono en talleres
- 📈 +40% completación después de ayuda
- ⏱️ -15% tiempo promedio
- 😊 +25% satisfacción de usuarios

**Próximo paso:** Testing con usuarios reales y medición de KPIs.
