# Guía para Instructores: Estimación de Tiempos

## 🎯 Introducción

Como parte del nuevo **Planificador de Estudio con IA**, necesitamos tu ayuda para proporcionar estimaciones de tiempo precisas para todas las actividades y materiales de tus cursos.

### ¿Por qué es importante?

El Planificador de Estudio IA ayudará a los estudiantes a:
- ✅ Crear horarios de estudio realistas basados en su disponibilidad
- ✅ Distribuir el aprendizaje de manera óptima a lo largo del tiempo
- ✅ Evitar sesiones demasiado cortas o largas
- ✅ Mejorar las tasas de completación de cursos (+40% esperado)

Para que esto funcione, **necesitamos saber cuánto tiempo toma completar cada actividad y material**.

---

## 📝 Qué ha Cambiado

### Nuevos Campos Requeridos

Al crear o editar **actividades** y **materiales**, ahora verás un nuevo campo:

**⏱️ Tiempo Estimado (minutos) \***

Este campo es **obligatorio** y debe contener:
- **Mínimo**: 1 minuto
- **Máximo**: 480 minutos (8 horas)
- **Solo números enteros**: No decimales

### Dónde Aparece

#### En Actividades:
Cuando creas una actividad (Reflexión, Ejercicio, Quiz, Discusión, Chat con IA), verás:

```
┌─────────────────────────────────────────────┐
│ Tipo de Actividad *                         │
│ [Reflexión ▼]                               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Tiempo Estimado (minutos) *                 │
│ [___10___]                                  │
│                                             │
│ Tiempo que tomará completar esta actividad.│
│ Mínimo 1 minuto, máximo 480 minutos.       │
│                                             │
│ ⏱️ Requerido para el Planificador de       │
│    Estudio IA                               │
└─────────────────────────────────────────────┘
```

#### En Materiales:
Cuando creas un material (PDF, Lectura, Quiz, Ejercicio, Enlace), verás:

```
┌─────────────────────────────────────────────┐
│ Tipo de Material *                          │
│ [PDF ▼]                                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Tiempo Estimado (minutos) *                 │
│ [___15___]                                  │
│                                             │
│ Tiempo estimado para leer este material.   │
│ Mínimo 1 minuto, máximo 480 minutos.       │
│                                             │
│ ⏱️ Requerido para el Planificador de       │
│    Estudio IA                               │
└─────────────────────────────────────────────┘
```

---

## 🎓 Cómo Estimar Tiempos

### Guías por Tipo de Contenido

#### 📖 Lecturas y PDFs
**Fórmula aproximada**: 200-250 palabras por minuto

| Extensión | Palabras | Tiempo Estimado |
|-----------|----------|-----------------|
| Corta     | 500      | 2-3 min         |
| Media     | 1000     | 4-5 min         |
| Larga     | 2000     | 8-10 min        |
| Muy Larga | 5000     | 20-25 min       |

**Tip**: Si el PDF incluye diagramas complejos o fórmulas, agrega 20-30% más de tiempo.

#### ✍️ Ejercicios y Prácticas
Considera:
- Tiempo de lectura de instrucciones (1-2 min)
- Tiempo de ejecución (variable)
- Tiempo de reflexión/revisión (1-2 min)

| Complejidad | Tiempo Estimado |
|-------------|-----------------|
| Simple      | 5-10 min        |
| Moderado    | 15-20 min       |
| Complejo    | 30-45 min       |
| Proyecto    | 60-120 min      |

#### 📝 Quizzes
**Fórmula**: 1-2 minutos por pregunta + tiempo de lectura

| Tipo de Quiz       | Tiempo por Pregunta | Ejemplo (10 preguntas) |
|--------------------|---------------------|------------------------|
| Verdadero/Falso    | 0.5-1 min           | 5-10 min               |
| Opción Múltiple    | 1-1.5 min           | 10-15 min              |
| Respuesta Corta    | 2-3 min             | 20-30 min              |
| Ensayo/Desarrollo  | 5-10 min            | 50-100 min             |

#### 💬 Reflexiones y Discusiones
Considera:
- Tiempo de lectura del prompt (1 min)
- Tiempo de pensamiento (2-3 min)
- Tiempo de escritura (variable)

| Profundidad | Tiempo Estimado |
|-------------|-----------------|
| Breve       | 3-5 min         |
| Normal      | 8-12 min        |
| Profunda    | 15-25 min       |

#### 🔗 Enlaces Externos
**Importante**: Estima el tiempo que tomará **consumir el contenido del enlace**, no solo hacer clic.

| Tipo de Enlace      | Tiempo Estimado |
|---------------------|-----------------|
| Artículo Corto      | 3-5 min         |
| Artículo Largo      | 10-15 min       |
| Video Corto         | Duración del video |
| Tutorial Interactivo| 20-40 min       |
| Documentación       | 15-30 min       |

#### 🤖 Chat con IA (Actividades)
Basado en el número de prompts y profundidad:

| Interacción | Tiempo Estimado |
|-------------|-----------------|
| 1-2 prompts | 5-8 min         |
| 3-5 prompts | 10-15 min       |
| Exploración | 20-30 min       |

---

## ⚠️ Consejos Importantes

### DO ✅

1. **Sé Realista**: Estima para un estudiante promedio, no un experto ni un principiante absoluto.

2. **Incluye Todo el Proceso**:
   - Lectura de instrucciones
   - Ejecución de la tarea
   - Reflexión o revisión
   - NO incluyas tiempo de pausas (el sistema ya lo considera con Pomodoro)

3. **Prueba Si Es Posible**: Cronométrate completando la actividad tú mismo y agrega 30-50% más.

4. **Considera el Nivel del Curso**:
   - Principiante: +20-30% de tiempo
   - Intermedio: Tiempo base
   - Avanzado: Puede ser -10% o igual (depende de complejidad conceptual)

5. **Redondea Apropiadamente**:
   - 0-15 min: Redondea a múltiplos de 1 (ej: 7, 8, 9 min)
   - 15-60 min: Redondea a múltiplos de 5 (ej: 15, 20, 25 min)
   - 60+ min: Redondea a múltiplos de 10 o 15 (ej: 60, 75, 90 min)

### DON'T ❌

1. **No Subestimes**: Mejor sobrestimar ligeramente que dejar a los estudiantes sin tiempo.

2. **No Uses Tiempos Genéricos**: Evita poner siempre "10 minutos" sin pensarlo.

3. **No Olvides la Complejidad**: Una lectura de 1000 palabras sobre teoría cuántica NO toma lo mismo que 1000 palabras sobre conceptos básicos.

4. **No Incluyas Tiempo de Video**: El sistema ya calcula automáticamente el tiempo de video de las lecciones.

5. **No Uses Valores Extremos Sin Justificación**:
   - < 1 minuto: ¿Realmente vale la pena como actividad separada?
   - > 120 minutos: ¿Deberías dividirlo en varias actividades?

---

## 📊 Ejemplos Prácticos

### Ejemplo 1: Reflexión sobre Liderazgo

**Tipo**: Actividad - Reflexión
**Prompt**: "Reflexiona sobre una situación reciente donde ejerciste liderazgo. ¿Qué hiciste bien? ¿Qué mejorarías?"

**Estimación**:
- Lectura del prompt: 0.5 min
- Recordar la situación: 1-2 min
- Escribir respuesta (150-200 palabras): 5-7 min
- Revisar: 1 min

**Total**: 8-10 min → **Ingreso: 10 minutos**

---

### Ejemplo 2: PDF - Guía de Python Básico

**Tipo**: Material - PDF
**Contenido**: 15 páginas, ~3000 palabras, incluye 5 ejemplos de código

**Estimación**:
- Lectura (3000 palabras ÷ 200 palabras/min): 15 min
- Revisar ejemplos de código (+30%): +4.5 min
- Total: 19.5 min

**Total**: 19.5 min → **Ingreso: 20 minutos**

---

### Ejemplo 3: Quiz de JavaScript

**Tipo**: Material - Quiz
**Contenido**: 15 preguntas de opción múltiple

**Estimación**:
- Lectura de instrucciones: 1 min
- 15 preguntas × 1.5 min c/u: 22.5 min
- Revisión de respuestas: 1.5 min
- Total: 25 min

**Total**: 25 min → **Ingreso: 25 minutos**

---

### Ejemplo 4: Ejercicio Práctico de CSS

**Tipo**: Material - Ejercicio
**Contenido**: "Replica este diseño usando Flexbox"

**Estimación**:
- Lectura de instrucciones: 2 min
- Analizar el diseño: 3 min
- Escribir CSS: 20 min
- Probar y ajustar: 10 min
- Total: 35 min

**Total**: 35 min → **Ingreso: 35 minutos**

---

## 🔍 Verificar Contenido Incompleto

### Para Instructores

Si ya tienes cursos creados, algunos pueden tener actividades/materiales **sin** tiempos estimados.

**¿Cómo saberlo?**

1. Consulta con el administrador del sistema
2. Ellos pueden ejecutar queries especiales para identificar tu contenido incompleto
3. Recibirás una lista de actividades/materiales que necesitan tiempos

**Queries Disponibles** (para administradores):
- Ver todas las actividades sin tiempo
- Ver todos los materiales sin tiempo
- Ver resumen por curso
- Ver progreso de completitud

---

## 📈 Impacto del Tiempo Total de Lección

### Cálculo Automático

El sistema calcula automáticamente el **tiempo total** de cada lección:

```
Tiempo Total = Video + Actividades + Materiales + Interacciones (3 min fijos)
```

**Ejemplo de Lección Completa**:

| Componente                    | Tiempo |
|-------------------------------|--------|
| Video                         | 12 min |
| Actividad 1: Reflexión        | 10 min |
| Material 1: Lectura PDF       | 15 min |
| Material 2: Quiz              | 8 min  |
| Interacciones (automático)    | 3 min  |
| **TOTAL**                     | **48 min** |

### Validación de Sesiones

Cuando un estudiante crea un plan de estudio, el sistema valida:

❌ **Sesión de 30 minutos** para una lección de 48 min → **ERROR**
✅ **Sesión de 60 minutos** para una lección de 48 min → **OK** (con 12 min de margen)

Esto evita que los estudiantes se sientan frustrados por sesiones demasiado cortas.

---

## 🆘 Preguntas Frecuentes

### ¿Qué pasa si me equivoco en la estimación?

No te preocupes! Puedes editar las actividades/materiales en cualquier momento y actualizar el tiempo. El sistema recalculará automáticamente.

### ¿Qué pasa con mi contenido antiguo?

Por ahora, el contenido sin tiempos estimados **no bloqueará** tus cursos publicados. Sin embargo, se te notificará para que los completes lo antes posible.

### ¿Puedo usar el mismo tiempo para actividades similares?

Sí, pero asegúrate de que realmente sean similares en complejidad y extensión.

### ¿Qué pasa si mi actividad varía mucho según el estudiante?

Usa un **promedio razonable**. Por ejemplo, si algunos estudiantes tardan 10 min y otros 30 min, usa 20 min.

### ¿Los 3 minutos de "interacciones" qué son?

El sistema agrega automáticamente 3 minutos por lección para:
- Tiempo de carga
- Navegación entre secciones
- Pausas mentales breves
- Interacción con la plataforma

**No debes incluir esto** en tus estimaciones.

---

## ✅ Checklist para Nuevas Actividades/Materiales

Antes de guardar una actividad o material, verifica:

- [ ] He proporcionado un tiempo estimado
- [ ] El tiempo está entre 1 y 480 minutos
- [ ] He considerado el nivel del curso
- [ ] He incluido tiempo de lectura de instrucciones
- [ ] He incluido tiempo de ejecución realista
- [ ] El tiempo es apropiado para un estudiante promedio
- [ ] He redondeado apropiadamente
- [ ] Si es un enlace externo, estimé el tiempo del contenido del enlace

---

## 📞 Soporte

Si tienes dudas sobre cómo estimar tiempos para un tipo específico de contenido, contacta al equipo de soporte o administración.

**Recuerda**: Tu precisión en estas estimaciones ayudará directamente a que más estudiantes completen tus cursos con éxito! 🎓✨

---

## Recursos Adicionales

- **PRD Completo**: Ver `docs/PRD-PLANIFICADOR-ESTUDIO-IA.md`
- **Progreso de Implementación**: Ver `docs/STUDY-PLANNER-PROGRESS.md`
- **Documentación Técnica**: Ver código en `apps/web/src/lib/supabase/study-planner-types.ts`

---

**Última actualización**: 2025-01-18
**Versión**: 1.0
