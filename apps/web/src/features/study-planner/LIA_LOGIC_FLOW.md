# Documentación de Lógica y Flujo: LIA Study Planner

Este documento detalla el funcionamiento interno, la lógica de distribución de horarios y las reglas de comunicación con la IA (LIA) implementadas para el Planificador de Estudios. Sirve como referencia para entender cómo LIA decide y presenta los horarios.

> **Última Actualización:** 10/02/2026
> **Estado:** Implementado (Greedy Algorithm V2) - Interpretación A de modos de sesión
> **Cambio reciente:** Invertida la lógica de modos para controlar VELOCIDAD DE COMPLETACIÓN

---

## 1. Semántica de Modos de Sesión (INTERPRETACIÓN A)

### Definición de Modos

Los modos de sesión ahora controlan la **velocidad de completación del curso**, NO la duración de las sesiones de manera aislada:

| Modo Interno | Nombre en UI | Velocidad | Duración Sesión | Días para completar |
|-------------|--------------|-----------|-----------------|---------------------|
| `corto` | **Terminar rápido** | RÁPIDO | 60-90 min | MENOS días |
| `balance` | **Equilibrado** | NORMAL | 45-60 min | MODERADO |
| `largo` | **Sin prisa** | LENTO | 20-35 min | MÁS días |

### Lógica Implementada

**Modo `corto` (Terminar rápido):**
- Sesiones largas de 60-90 minutos
- Sin límite de grupos de lecciones por slot (`maxGroupsPerSlot = 999`)
- Llenar cada slot al máximo para avanzar más por día
- Descansos de 15 minutos

**Modo `balance` (Equilibrado):**
- Sesiones medianas de 45-60 minutos
- Máximo 3 grupos de lecciones por slot
- Distribución balanceada
- Descansos de 10 minutos

**Modo `largo` (Sin prisa):**
- Sesiones cortas de 20-35 minutos
- Máximo 2 grupos de lecciones por slot
- Saltar slots para distribuir a lo largo del período (`skipSlots > 0`)
- Descansos de 5 minutos

---

## 2. Algoritmo de Distribución (Frontend)

Ubicación: `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx`

La lógica principal de asignación de lecciones a huecos de calendario (slots) sigue un enfoque **"Greedy" (Voraz) con Capacidad Estricta**.

### Entradas (Inputs)
- **`slotsUntilTarget`**: Lista de días/bloques de tiempo disponibles en el calendario del usuario.
- **`validPendingLessons`**: Lista ordenada de lecciones que el usuario debe completar.
- **`studyApproach`**: `'corto'`, `'balance'`, o `'largo'` - determina la estrategia de distribución.

### Proceso (Paso a Paso)

1. **Determinar Parámetros según Modo:**
   ```typescript
   // Modo corto (Terminar rápido):
   maxSessionMinutes = 90; maxGroupsPerSlot = 999; skipSlots = 0;

   // Modo balance (Equilibrado):
   maxSessionMinutes = 60; maxGroupsPerSlot = 3; skipSlots = 0;

   // Modo largo (Sin prisa):
   maxSessionMinutes = 35; maxGroupsPerSlot = 2; skipSlots = calculado;
   ```

2. **Asignación Voraz (Greedy):**
   - El sistema itera por cada **Slot** de tiempo disponible.
   - Respeta el límite `maxGroupsPerSlot` según el modo seleccionado.
   - Para modo `largo`, salta slots para distribuir mejor en el tiempo.
   - **Regla de Encaje:** Una lección cabe si `Tiempo Usado en Slot + Duración <= Capacidad del Slot`.

3. **Fallback de Capacidad:**
   - Si `capacityRatio < 1.3`, se ignoran las restricciones del modo y se fuerza el uso de todos los slots.

### Salida (Output)
- Un objeto `lessonDistribution` que contiene la lista de lecciones por día.

---

## 3. Comunicación con la IA (LIA)

Una vez calculada la distribución exacta en el Frontend, esta información se pasa a la IA para que la "presente" al usuario.

### Formato del Mensaje (`calendarMessage`)
El Frontend construye un "mensaje oculto" de sistema que inyecta en el contexto de la conversación:

```text
📅 Lunes 25/12
  • ⏰ HORARIO EXACTO: 09:00 - 09:15 (15 min) - [Curso A] Lección 1
  • ⏰ HORARIO EXACTO: 09:15 - 09:30 (15 min) - [Curso A] Lección 2
```

**Clave Crítica:** El uso del prefijo `⏰ HORARIO EXACTO` es el disparador (trigger) para que la IA respete los tiempos.

---

## 4. Reglas del Sistema (Backend / Prompt)

Ubicación: `apps/web/src/app/api/study-planner-chat/route.ts`

> **NOTA:** La API del Study Planner está **aislada** del endpoint general `/api/ai-chat`.

El System Prompt ha sido endurecido para obedecer ciegamente la distribución generada por el algoritmo Greedy.

### Reglas de Oro ("The Golden Rules")
1. **Copiar Pegar Literal:** Si el prompt de sistema ve `HORARIO EXACTO: HH:mm - HH:mm`, **DEBE** responder con esos mismos tiempos.
2. **Prohibido Redondear:** La IA tiene explícitamente prohibido redondear a intervalos de 15/30 minutos si el horario exacto es diferente.
3. **Manejo de Errores:** Si no hay suficientes slots, el algoritmo (Frontend) emite una advertencia (`console.warn`) y la IA debería sugerir "extender la fecha objetivo" o "liberar más tiempo".

---

## 5. Estados Relacionados

### Estados Principales
```typescript
// El modo de sesión seleccionado - controla VELOCIDAD de completación
const [studyApproach, setStudyApproach] = useState<'corto' | 'balance' | 'largo' | null>(null);

// corto = Terminar rápido (sesiones 60-90 min) → menos días
// balance = Equilibrado (sesiones 45-60 min) → moderado
// largo = Sin prisa (sesiones 20-35 min) → más días

// Si ya se preguntó por el enfoque
const [hasAskedApproach, setHasAskedApproach] = useState(false);

// Si el modal de enfoque está visible
const [showApproachModal, setShowApproachModal] = useState(false);
```

### Parámetros por Modo
```typescript
// calculateEstimatedAvailability
switch (studyApproach) {
  case 'corto':  // Terminar rápido
    recommendedSessionLength = 75; recommendedBreak = 15;
    break;
  case 'largo':  // Sin prisa
    recommendedSessionLength = 25; recommendedBreak = 5;
    break;
  case 'balance':
  default:
    recommendedSessionLength = 45; recommendedBreak = 10;
    break;
}
```

---

## 6. Capas de Diferenciación por Modo

| Capa | Ubicación | Diferenciación |
|------|-----------|----------------|
| **Capa 1** | Greedy Algorithm | `maxGroupsPerSlot`, `skipSlots` |
| **Capa 2** | `savePlanToDatabase` | Rangos de sesión guardados |
| **Capa 3** | API Determinística | `studyMode`, `maxSessionMinutes` |
| **Capa 4** | `calculateEstimatedAvailability` | `recommendedSessionLength`, `recommendedBreak` |

---

## 7. Recuperación y Mantenimiento

### Si el Chat se Borra / Pérdida de Contexto
Si necesitas restaurar o modificar esta lógica, sigue estos puntos:

1. **Ubicación de la Lógica de Modos:**
   - `calculateEstimatedAvailability` (línea ~2538): Define parámetros base por modo
   - Greedy Algorithm (línea ~5830): Define `maxGroupsPerSlot` y `skipSlots`
   - API Request (línea ~7501): Define `maxSessionMinutes` y `preferredSessionType`

2. **Problemas Comunes:**
   - **Modos invertidos:** Verificar que `corto` tenga sesiones largas (60-90 min) y `largo` tenga sesiones cortas (20-35 min)
   - **Misma velocidad para todos los modos:** Revisar las condiciones de `capacityRatio < 1.3` que fuerza el mismo comportamiento

3. **Para Cambiar la Semántica:**
   - Actualizar `calculateEstimatedAvailability`
   - Actualizar la lógica de `maxGroupsPerSlot` en el Greedy Algorithm
   - Actualizar `maxSessionMinutes` en la API
   - Actualizar textos de UI en el modal y botones inline

### Flujo de Datos
Frontend (Greedy Algo) -> `lessonDistribution` -> `calendarMessage` (String con 'HORARIO EXACTO') -> Backend (Prompt) -> LIA Response.
