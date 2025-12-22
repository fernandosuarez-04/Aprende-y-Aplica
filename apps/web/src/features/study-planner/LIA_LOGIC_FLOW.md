# Documentación de Lógica y Flujo: LIA Study Planner

Este documento detalla el funcionamiento interno, la lógica de distribución de horarios y las reglas de comunicación con la IA (LIA) implementadas para el Planificador de Estudios. Sirve como referencia para entender cómo LIA decide y presenta los horarios.

> **Última Actualización:** 21/12/2025
> **Estado:** Implementado (Greedy Algorithm V2)

---

## 1. Algoritmo de Distribución (Frontend)

Ubicación: `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx`

La lógica principal de asignación de lecciones a huecos de calendario (slots) sigue un enfoque **"Greedy" (Voraz) con Capacidad Estricta**.

### Entradas (Inputs)
- **`slotsUntilTarget`**: Lista de días/bloques de tiempo disponibles en el calendario del usuario.
- **`validPendingLessons`**: Lista ordenada de lecciones que el usuario debe completar.
- **`approachMultiplier`**: Factor de multiplicación basado en el "Enfoque de Estudio" seleccionado:
  - `rapido`: x1.0
  - `normal`: x1.4 (Default)
  - `largo`: x1.8

### Proceso (Paso a Paso)
1. **Cálculo de Duración Real:**
   Para cada lección, se calcula su duración efectiva **antes** de asignarla:
   `Duración Final = Math.ceil(Duración Base * approachMultiplier)`
   *Ejemplo: Lección de 15 min en 'Normal' (x1.4) = 21 minutos exactos.*

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

## 2. Comunicación con la IA (LIA)

Una vez calculada la distribución exacta en el Frontend, esta información se pasa a la IA para que la "presente" al usuario.

### Formato del Mensaje (`calendarMessage`)
El Frontend construye un "mensaje oculto" de sistema que inyecta en el contexto de la conversación:

```text
📅 Lunes 25/12
  • ⏰ HORARIO EXACTO: 09:00 - 09:21 (21 min) - [Curso A] Lección 1
  • ⏰ HORARIO EXACTO: 09:21 - 09:42 (21 min) - [Curso A] Lección 2
```

**Clave Crítica:** El uso del prefijo `⏰ HORARIO EXACTO` es el disparador (trigger) para que la IA respete los tiempos.

---

## 3. Reglas del Sistema (Backend / Prompt)

Ubicación: `apps/web/src/app/api/ai-chat/route.ts`

El System Prompt ha sido endurecido para obedecer ciegamente la distribución generada por el algoritmo Greedy.

### Reglas de Oro ("The Golden Rules")
1. **Copiar Pegar Literal:** Si el prompt de sistema ve `HORARIO EXACTO: HH:mm - HH:mm`, **DEBE** responder con esos mismos tiempos.
2. **Prohibido Redondear:** La IA tiene explícitamente prohibido redondear a intervalos de 15/30 minutos si el horario exacto es diferente.
3. **Manejo de Errores:** Si no hay suficientes slots, el algoritmo (Frontend) emite una advertencia (`console.warn`) y la IA debería sugerir "extender la fecha objetivo" o "liberar más tiempo".

---

## 4. Recuperación y Mantenimiento

### Si el Chat se Borra / Pérdida de Contexto
Si necesitas restaurar o modificar esta lógica, sigue estos puntos:

1. **Restaurar Lógica Antigua:**
   - En `StudyPlannerLIA.tsx`, busca `/* LEGACY LOGIC START - TO BE REMOVED`.
   - La lógica antigua (basada en promedios) está comentada dentro de ese bloque. Descoméntala y elimina el bloque Greedy superior para revertir.

2. **Problemas Comunes:**
   - **"0 min" en los horarios:** Verifica que la propiedad `durationMinutes` se esté pasando correctamente en el mapeo de `setSavedLessonDistribution` (cerca de la línea 5600).
   - **Tiempos aproximados:** Verifica que `approachMultiplier` no esté hardcodeado a 1.0.

### Flujo de Datos
Frontend (Greedy Algo) -> `lessonDistribution` -> `calendarMessage` (String con 'HORARIO EXACTO') -> Backend (Prompt) -> LIA Response.
