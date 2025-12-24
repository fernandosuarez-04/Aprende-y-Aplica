# Documentación de Lógica y Flujo: LIA Study Planner

Este documento detalla el funcionamiento interno, la lógica de distribución de horarios y las reglas de comunicación con la IA (LIA) implementadas para el Planificador de Estudios. Sirve como referencia para entender cómo LIA decide y presenta los horarios.

> **Última Actualización:** 22/12/2025
> **Estado:** Implementado (Greedy Algorithm V2) - Multiplicadores de sesión desactivados (siempre 1.0)
> **Cambio reciente:** Corregido flujo de presentación (todas las semanas) y cálculo real de lecciones por semana

---

## 1. Cambios Recientes - Multiplicadores de Sesión Desactivados

### ⚠️ IMPORTANTE: Multiplicadores Desactivados
A partir de esta versión, los multiplicadores de sesión están **desactivados**:
- El modal de selección de tipo de sesiones **SÍ SE MUESTRA** (para configuración futura)
- La selección del usuario (rápida/normal/larga) **SE GUARDA** en el estado `studyApproach`
- El multiplicador **SIEMPRE ES 1.0** independientemente de la selección
- Las lecciones usan su **duración base** directamente

### Razón del Cambio
La lógica anterior de multiplicadores (x1.0, x1.4, x1.8) no consideraba adecuadamente otros factores importantes para el cálculo de sesiones de estudio. El modal se mantiene activo para permitir configuración futura.

### Flujo Actual
1. Usuario abre el planificador
2. LIA saluda mencionando cursos asignados y fechas límite
3. LIA pregunta qué tipo de sesiones prefiere → **Modal se muestra**
4. Usuario selecciona tipo de sesiones → **Se guarda pero NO afecta duración**
5. LIA pregunta si desea conectar calendario
6. Usuario conecta el calendario (Google/Microsoft)
7. LIA pregunta por la fecha objetivo
8. Usuario selecciona fecha
9. LIA analiza el calendario y genera el plan
10. Usuario puede modificar o guardar el plan

---

## 2. Algoritmo de Distribución (Frontend)

Ubicación: `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx`

La lógica principal de asignación de lecciones a huecos de calendario (slots) sigue un enfoque **"Greedy" (Voraz) con Capacidad Estricta**.

### Entradas (Inputs)
- **`slotsUntilTarget`**: Lista de días/bloques de tiempo disponibles en el calendario del usuario.
- **`validPendingLessons`**: Lista ordenada de lecciones que el usuario debe completar.
- **`approachMultiplier`**: **Siempre 1.0** (desactivado temporalmente).

### Proceso (Paso a Paso)
1. **Cálculo de Duración Real:**
   Para cada lección, se usa su duración base directamente:
   `Duración Final = Duración Base de la Lección`
   *Ejemplo: Lección de 15 min = 15 minutos exactos.*

2. **Asignación Voraz (Greedy):**
   - El sistema itera por cada **Slot** de tiempo disponible (ej: Lunes 09:00-10:00).
   - Intenta "llenar" el slot con tantas lecciones como quepan.
   - **Regla de Encaje:** Una lección cabe si `Tiempo Usado en Slot + Duración Final <= Capacidad Total del Slot`.
     - *Excepción:* Si el slot está vacío (0 min usados), aceptamos la primera lección aunque exceda ligeramente la capacidad (para evitar bloqueo infinito por lecciones largas).
   - Si la lección cabe, se asigna y se suma su tiempo. Si no, se salta al siguiente slot.

3. **Integridad de Datos:**
   - Se evitan duplicados usando un `Set<string>` de IDs asignados.
   - Las variables de estado (`lessonDistribution`, `assignedLessonIds`) se reutilizan para evitar conflictos de memoria.

### Salida (Output)
- Un objeto `lessonDistribution` que contiene la lista de lecciones por día, incluyendo explícitamente la propiedad `durationMinutes` calculada.

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

> **NOTA (2025-12-23):** La API del Study Planner ahora está **aislada** del endpoint general `/api/ai-chat`. 
> Esto permite:
> - Usar Gemini 2.0 Flash directamente sin filtros intermedios
> - Observar la salida raw del modelo para debugging
> - Evitar interferencias del filtrado de prompt-leak
> - Mayor control sobre el comportamiento de LIA en el planificador

El System Prompt ha sido endurecido para obedecer ciegamente la distribución generada por el algoritmo Greedy.

### Reglas de Oro ("The Golden Rules")
1. **Copiar Pegar Literal:** Si el prompt de sistema ve `HORARIO EXACTO: HH:mm - HH:mm`, **DEBE** responder con esos mismos tiempos.
2. **Prohibido Redondear:** La IA tiene explícitamente prohibido redondear a intervalos de 15/30 minutos si el horario exacto es diferente.
3. **Manejo de Errores:** Si no hay suficientes slots, el algoritmo (Frontend) emite una advertencia (`console.warn`) y la IA debería sugerir "extender la fecha objetivo" o "liberar más tiempo".

---

## 5. Estados Relacionados

### Estados Principales
```typescript
// El tipo de sesión seleccionado - SE GUARDA pero NO afecta cálculos
const [studyApproach, setStudyApproach] = useState<'rapido' | 'normal' | 'largo' | null>(null);

// Si ya se preguntó por el enfoque
const [hasAskedApproach, setHasAskedApproach] = useState(false);

// Si el modal de enfoque está visible
const [showApproachModal, setShowApproachModal] = useState(false);
```

### Multiplicador (Desactivado)
```typescript
// En la lógica de distribución
const approachMultiplier = 1.0; // ✅ FIJO: Siempre 1.0 independiente de studyApproach
```

---

## 6. Recuperación y Mantenimiento

### Si el Chat se Borra / Pérdida de Contexto
Si necesitas restaurar o modificar esta lógica, sigue estos puntos:

1. **Ubicación del Multiplicador:**
   - Buscar `approachMultiplier = 1.0` en `StudyPlannerLIA.tsx`
   - Este valor está fijo y no depende de `studyApproach`

2. **Problemas Comunes:**
   - **"0 min" en los horarios:** Verifica que la propiedad `durationMinutes` se esté pasando correctamente en el mapeo de `setSavedLessonDistribution`.
   - **Multiplicadores activos accidentalmente:** Busca `approachMultiplier` y asegúrate de que sea `1.0`.

3. **Para Reactivar Multiplicadores:**
   - Cambiar `const approachMultiplier = 1.0;` por:
   ```typescript
   const approachMultiplier = effectiveApproach === 'rapido' ? 1.0 : effectiveApproach === 'normal' ? 1.4 : 1.8;
   ```

### Flujo de Datos
Frontend (Greedy Algo) -> `lessonDistribution` -> `calendarMessage` (String con 'HORARIO EXACTO') -> Backend (Prompt) -> LIA Response.
