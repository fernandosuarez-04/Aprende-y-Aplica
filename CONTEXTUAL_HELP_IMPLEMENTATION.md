# 🎯 Sistema de Ayuda Contextual Hiperpersonalizada

## 📋 Resumen

Sistema avanzado de detección de dificultad que combina:
- ✅ **Análisis de patrones de navegación** (rrweb) - sistema existente mejorado
- ✅ **Análisis contextual de errores** - NUEVO sistema hiperpersonalizado
- ✅ **Detección específica por pregunta** - sabe exactamente dónde se atora el usuario
- ✅ **Ayuda personalizada** - basada en el tipo exacto de error

## 🚀 Componentes Implementados

### 1. **ContextualDifficultyDetector** (`lib/rrweb/contextual-difficulty-detector.ts`)

Detector inteligente que rastrea:
- ❌ **Errores repetidos** en la misma pregunta
- ⏭️ **Preguntas saltadas** (blank, incomplete, abandoned)
- 🔄 **Patrones de abandono** (intenta varias veces y salta)
- 🎯 **Contexto específico** (qué opción eligió vs. la correcta)
- 📊 **Análisis por tema/tópico**

**Características:**
```typescript
- Rastrea hasta N intentos por pregunta
- Detecta si elige siempre la misma respuesta incorrecta
- Identifica preguntas que intimidan (skip inmediato)
- Analiza tiempo por pregunta
- Genera sugerencias de ayuda específicas
```

### 2. **useContextualHelp** (`hooks/useContextualHelp.ts`)

Hook de React que facilita la integración:
```typescript
const {
  startQuestion,      // Llamar al mostrar pregunta
  recordAnswer,       // Llamar al responder
  recordSkip,         // Llamar al saltar pregunta
  shouldShowHelp,     // Boolean para mostrar diálogo
  helpData,           // Datos de ayuda personalizada
  acceptHelp,         // Callback al aceptar ayuda
  dismissHelp,        // Callback al rechazar ayuda
  reset,              // Reset al cambiar actividad
} = useContextualHelp({
  activityId: 'activity-123',
  onHelpNeeded: (analysis) => {
    // Lógica personalizada
  }
});
```

### 3. **ContextualHelpDialog** (`features/courses/components/ContextualHelpDialog.tsx`)

Componente de UI elegante que muestra:
- 💡 Mensaje personalizado según tipo de error
- 📊 Estadísticas de progreso del usuario
- 🎯 Acciones recomendadas (pistas, ejemplos, revisar conceptos)
- ⚡ Prioridad de intervención (immediate, soon, monitor)
- 🎨 Diseño adaptativo con dark mode

## 📖 Guía de Implementación

### Paso 1: Importar el Hook

```typescript
import { useContextualHelp } from '@/hooks/useContextualHelp';
import { ContextualHelpDialog } from '@/features/courses/components/ContextualHelpDialog';
```

### Paso 2: Inicializar en tu Componente

```typescript
'use client';

export default function LearnPage() {
  // ... tus estados existentes ...

  // Nuevo: Sistema de ayuda contextual
  const contextualHelp = useContextualHelp({
    activityId: currentActivity?.activity_id || '',
    workshopId: courseId,
    enabled: true, // Activar cuando esté en actividad
    onHelpNeeded: (analysis) => {
      console.log('🆘 Ayuda detectada:', analysis);
      // Opcional: enviar analytics, notificar instructor, etc.
    },
    onHelpAccepted: (analysis) => {
      console.log('✅ Usuario aceptó ayuda');
      // Opcional: abrir LIA con contexto específico
      setIsLiaExpanded(true);
      // Enviar mensaje contextual a LIA
      if (analysis.errorPatterns.length > 0) {
        const pattern = analysis.errorPatterns[0];
        const liaMessage = `Necesito ayuda con: ${pattern.questionText}. ${pattern.context.suggestedHelp}`;
        // Tu lógica para enviar mensaje a LIA
      }
    }
  });

  // ... resto del componente ...
}
```

### Paso 3: Integrar en el Flujo de Preguntas

#### A. Al mostrar una pregunta nueva:
```typescript
useEffect(() => {
  if (currentQuestion?.id) {
    contextualHelp.startQuestion(currentQuestion.id);
  }
}, [currentQuestion?.id]);
```

#### B. Al seleccionar/verificar una respuesta:
```typescript
const handleAnswerSelect = (questionId: string, answer: string | number) => {
  // Tu lógica existente...
  setSelectedAnswers(prev => ({
    ...prev,
    [questionId]: answer
  }));

  // Verificar si es correcto (asume que tienes esta info)
  const question = questions.find(q => q.id === questionId);
  const isCorrect = question?.correctAnswer === answer;

  // NUEVO: Registrar intento
  contextualHelp.recordAnswer({
    questionId,
    questionText: question?.text || '',
    questionType: question?.type || 'multiple_choice',
    selectedAnswer: answer,
    correctAnswer: question?.correctAnswer || '',
    isCorrect,
    topic: question?.topic, // Opcional: categoría/tema
    difficulty: question?.difficulty // Opcional: easy/medium/hard
  });
};
```

#### C. Al saltar una pregunta:
```typescript
const handleSkipQuestion = (questionId: string) => {
  const question = questions.find(q => q.id === questionId);
  const hadAttempts = selectedAnswers[questionId] !== undefined;

  // NUEVO: Registrar skip
  contextualHelp.recordSkip({
    questionId,
    questionText: question?.text || '',
    questionType: question?.type || 'multiple_choice',
    skipReason: hadAttempts ? 'abandoned' : 'blank',
    topic: question?.topic
  });

  // Ir a siguiente pregunta
  goToNextQuestion();
};
```

#### D. Al cambiar de actividad:
```typescript
useEffect(() => {
  // Reset al cambiar actividad
  contextualHelp.reset();
}, [currentActivity?.activity_id]);
```

### Paso 4: Agregar el Diálogo de Ayuda

```typescript
return (
  <div>
    {/* Tu UI existente */}

    {/* NUEVO: Diálogo de ayuda contextual */}
    <ContextualHelpDialog
      isOpen={contextualHelp.shouldShowHelp}
      onClose={contextualHelp.dismissHelp}
      onAccept={contextualHelp.acceptHelp}
      helpData={contextualHelp.helpData}
      onActionClick={(actionType) => {
        console.log('Acción clickeada:', actionType);
        // Implementar acciones según tipo:
        switch (actionType) {
          case 'show_hint':
            // Mostrar pista de la pregunta
            break;
          case 'review_concept':
            // Abrir material de referencia
            break;
          case 'show_example':
            // Mostrar ejemplo similar
            break;
          // ... etc
        }
      }}
    />
  </div>
);
```

## 🎨 Personalización

### Configurar Umbrales de Detección

```typescript
const contextualHelp = useContextualHelp({
  activityId: currentActivity?.activity_id || '',
  detectionConfig: {
    maxAttemptsBeforeIntervention: 3,    // Default: 3
    skipThreshold: 2,                     // Default: 2
    repeatedMistakeThreshold: 2,          // Default: 2
    timeThresholdMs: 5000,                // Default: 5000 (5s)
    enableConceptualAnalysis: true,       // Default: true
    enablePatternDetection: true,         // Default: true
    minimumQuestionsForAnalysis: 3        // Default: 3
  }
});
```

### Desactivar Patrones de Navegación

Si solo quieres detección contextual (sin rrweb):
```typescript
const contextualHelp = useContextualHelp({
  activityId: currentActivity?.activity_id || '',
  enableNavigationPatterns: false // Solo análisis contextual
});
```

## 📊 Tipos de Ayuda Detectados

| Tipo | Descripción | Severidad | Acción Sugerida |
|------|-------------|-----------|-----------------|
| **repeated_mistake** | Eligió la misma respuesta incorrecta N veces | High/Critical | Revisar concepto base |
| **skip_after_attempts** | Intentó varias veces y abandonó | Critical | Explicación paso a paso |
| **immediate_skip** | Saltó sin intentar (tiempo < 5s) | Medium | Simplificar o dar contexto |
| **conceptual_error** | Patrón de error en tema específico | High | Material de referencia |

## 🔍 Debugging y Monitoreo

### Consola del navegador
```typescript
// Ver análisis en tiempo real
contextualHelp.currentAnalysis

// Estadísticas
contextualHelp.currentAnalysis?.stats

// Patrones detectados
contextualHelp.currentAnalysis?.errorPatterns
```

### Modo desarrollo
El componente `ContextualHelpDialog` muestra debug info en desarrollo:
- JSON completo del análisis
- Score de dificultad
- Patrones detectados
- Acciones sugeridas

## 🚀 Próximos Pasos (Opcionales)

### 1. **Integración con LIA (Chatbot)**
```typescript
onHelpAccepted: (analysis) => {
  // Generar prompt contextual para LIA
  const pattern = analysis.errorPatterns[0];
  const liaPrompt = `
    El usuario está teniendo dificultad con:
    - Pregunta: ${pattern.questionText}
    - Intentos: ${pattern.context.totalAttempts}
    - Tipo de error: ${pattern.errorType}
    - Sugerencia: ${pattern.context.suggestedHelp}

    Por favor, explica este concepto de manera clara y amigable.
  `;

  sendMessageToLIA(liaPrompt);
  setIsLiaExpanded(true);
}
```

### 2. **Analytics y Reportes**
```typescript
onHelpNeeded: (analysis) => {
  // Enviar a analytics
  trackEvent('help_intervention_shown', {
    activityId: currentActivity?.activity_id,
    score: analysis.overallScore,
    priority: analysis.interventionPriority,
    patterns: analysis.errorPatterns.map(p => p.errorType),
    userId: user?.id
  });

  // Notificar instructor si es crítico
  if (analysis.interventionPriority === 'immediate') {
    notifyInstructor({
      studentId: user?.id,
      activityId: currentActivity?.activity_id,
      issue: analysis.interventionMessage
    });
  }
}
```

### 3. **Personalizar Mensajes**
Modifica `generateInterventionMessage()` en `contextual-difficulty-detector.ts` para adaptar los mensajes a tu tono y audiencia.

### 4. **Acciones Personalizadas**
Implementa handlers específicos para cada tipo de acción:
```typescript
<ContextualHelpDialog
  onActionClick={(actionType, data) => {
    switch (actionType) {
      case 'show_hint':
        showHintForQuestion(data.questionId);
        break;
      case 'review_concept':
        openConceptMaterial(data.concept);
        break;
      case 'show_example':
        showSimilarExample(data.questionId);
        break;
      case 'simplify_question':
        showSimplifiedVersion(data.questionId);
        break;
      case 'contact_instructor':
        openInstructorChat();
        break;
    }
  }}
/>
```

## 🎯 Ejemplo Completo Mínimo

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useContextualHelp } from '@/hooks/useContextualHelp';
import { ContextualHelpDialog } from '@/features/courses/components/ContextualHelpDialog';

export default function QuizActivity() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});

  const questions = [
    {
      id: 'q1',
      text: '¿Qué es un algoritmo?',
      type: 'multiple_choice',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      topic: 'Fundamentos'
    },
    // ... más preguntas
  ];

  const currentQuestion = questions[currentQuestionIndex];

  // Sistema de ayuda contextual
  const contextualHelp = useContextualHelp({
    activityId: 'quiz-123',
    onHelpAccepted: () => {
      alert('¡Ayuda en camino!');
    }
  });

  // Iniciar pregunta al cambiar
  useEffect(() => {
    if (currentQuestion) {
      contextualHelp.startQuestion(currentQuestion.id);
    }
  }, [currentQuestion?.id]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));

    const isCorrect = answer === currentQuestion.correctAnswer;

    contextualHelp.recordAnswer({
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      questionType: 'multiple_choice',
      selectedAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      topic: currentQuestion.topic
    });

    if (isCorrect) {
      setTimeout(() => goNext(), 1000);
    }
  };

  const handleSkip = () => {
    contextualHelp.recordSkip({
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      questionType: 'multiple_choice',
      skipReason: selectedAnswers[currentQuestion.id] ? 'abandoned' : 'blank',
      topic: currentQuestion.topic
    });
    goNext();
  };

  const goNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">{currentQuestion.text}</h2>

      <div className="space-y-2">
        {currentQuestion.options.map(option => (
          <button
            key={option}
            onClick={() => handleAnswerSelect(option)}
            className="w-full p-4 border rounded-lg hover:bg-gray-100"
          >
            {option}
          </button>
        ))}
      </div>

      <button onClick={handleSkip} className="mt-4 text-gray-500">
        Saltar pregunta →
      </button>

      {/* Diálogo de ayuda */}
      <ContextualHelpDialog
        isOpen={contextualHelp.shouldShowHelp}
        onClose={contextualHelp.dismissHelp}
        onAccept={contextualHelp.acceptHelp}
        helpData={contextualHelp.helpData}
      />
    </div>
  );
}
```

## 🎉 Beneficios

1. ✅ **Detección temprana** - Interviene antes de que el usuario se frustre
2. ✅ **Ayuda específica** - Sabe exactamente en qué pregunta y tipo de error
3. ✅ **No intrusivo** - Cooldown de 3 minutos entre intervenciones
4. ✅ **Adaptativo** - Aprende patrones y ajusta umbrales
5. ✅ **Actionable** - Ofrece acciones concretas, no solo mensajes genéricos
6. ✅ **Estadísticas** - Muestra progreso para motivar al usuario
7. ✅ **Integración LIA** - Se puede combinar con el chatbot existente

## 📚 Recursos Adicionales

- **Detector de patrones de navegación**: `lib/rrweb/difficulty-pattern-detector.ts`
- **Hook de detección navegación**: `hooks/useDifficultyDetection.ts`
- **Tipos TypeScript**: Todos los tipos están completamente documentados

## 🐛 Troubleshooting

**Problema**: No detecta ayuda cuando debería
- Verifica que `enabled: true`
- Verifica que estás llamando `recordAnswer()` y `recordSkip()`
- Revisa la consola para logs de `[CONTEXTUAL]`
- Ajusta umbrales en `detectionConfig`

**Problema**: Interviene demasiado frecuente
- Aumenta `analysisInterval` (default: 15s)
- Aumenta `maxAttemptsBeforeIntervention` (default: 3)
- Aumenta cooldown en el hook (default: 3 min)

**Problema**: No muestra estadísticas
- Verifica `helpData.contextualAnalysis` en consola
- Asegúrate que `minimumQuestionsForAnalysis` se cumple (default: 3)

---

**¿Preguntas?** Consulta los comentarios inline en el código o abre un issue.
