# 🛡️ Sistema de Guardrails para Actividades con LIA

## 📋 Problema Identificado

En la interacción del usuario con LIA durante la actividad "Framework de 3 Columnas", LIA se desvió del guión estructurado:

❌ **Comportamiento incorrecto:**
- Usuario dice "no" → LIA responde genéricamente
- Usuario pide sugerencias → LIA da explicaciones largas no relacionadas con el paso actual
- Usuario da respuestas cortas ("sí", "no") → LIA acepta y no avanza estructuradamente
- LIA explica conceptos generales en lugar de completar el framework paso a paso

## ✅ Solución Implementada: Sistema de Guardrails

### 1. **Guardrails en el Prompt del Sistema** (`handleStartActivityInteraction`)

Se agregaron **restricciones críticas** al prompt del sistema que envía la aplicación:

```typescript
## ⚠️ RESTRICCIONES CRÍTICAS (GUARDRAILS)

### 🚫 DESVÍOS NO PERMITIDOS:
1. NO te desvíes del guión
2. NO ofrezcas ayuda genérica
3. NO expliques conceptos no relacionados
4. NO cambies de tema

### ✅ MANEJO DE DESVÍOS:
- Se desvía → Redirige amablemente
- Pide sugerencias → Da 1-2 ejemplos del paso actual y pide SU respuesta
- Dice "no sé" → Ofrece ejemplos pero insiste en su propia respuesta
- Respuestas cortas → Pide más detalles específicos
```

### 2. **Guión Mejorado en la Base de Datos**

El contenido de la actividad ahora es más:
- **Estructurado**: Pasos numerados (PASO 1 de 5, PASO 2 de 5...)
- **Específico**: Preguntas concretas que esperan respuestas concretas
- **Directo**: Menos texto explicativo, más acción
- **Secuencial**: Un paso a la vez, no múltiples opciones

## 🎯 Estrategias de Guardrails Implementadas

### A. **Contador de Progreso**
```
PASO 1 de 5: Identificar Tareas
PASO 2 de 5: Identificar Datos
PASO 3 de 5: Definir Decisiones
PASO 4 de 5: Evaluación
PASO 5 de 5: Selección y CSV
```

**Beneficio:** El usuario sabe exactamente dónde está y cuánto falta.

### B. **Instrucciones de Seguimiento**
```typescript
### 📊 SEGUIMIENTO DEL PROGRESO:
- Cuenta internamente cuántas interacciones llevan en el MISMO paso
- Si más de 3 respuestas sin avanzar → Redirige firmemente
- Después de cada respuesta útil → Avanza inmediatamente
```

**Beneficio:** LIA detecta cuándo el usuario está atascado y redirige activamente.

### C. **Validación de Respuestas**
```typescript
- Valida la respuesta (¿es útil para el objetivo del paso?)
- Si es útil → AVANZA al siguiente mensaje del guión
- Si no es útil → Pide clarificación pero NO avances
```

**Beneficio:** Solo se avanza cuando el usuario da información útil.

### D. **Recordatorio Constante**
```typescript
## ⚡ RECORDATORIO CONSTANTE
Antes de cada respuesta:
1. ¿Estoy siguiendo el guión paso a paso?
2. ¿El usuario dio la información necesaria?
3. ¿Debo avanzar o pedir más detalles?
4. ¿Me estoy desviando del objetivo?
```

**Beneficio:** LIA "se revisa a sí misma" antes de cada respuesta.

### E. **Límites en el Formato**
```typescript
2. **Formato de Mensajes**:
   - Sé concisa: 3-4 oraciones máximo por mensaje
   - Máximo 1-2 emojis por mensaje
   - Usa un tono cálido pero DIRECTO
```

**Beneficio:** Evita respuestas largas y divagaciones.

## 📊 Comparación: Antes vs Después

### ANTES (Sin Guardrails)

**Usuario:** "no"  
**LIA:** "Está bien, Gaelchido. Si necesitas tomar un descanso o si hay algo específico en lo que te gustaría hablar, ¡dímelo! Estoy aquí para ayudarte cuando estés listo. 😊"

❌ Problema: LIA acepta el "no" y espera pasivamente.

**Usuario:** "cual me sugieres tu?"  
**LIA:** [Explicación larga sobre atención al cliente con 3 columnas completas]

❌ Problema: LIA hace el trabajo del usuario en lugar de guiarlo.

### DESPUÉS (Con Guardrails)

**Usuario:** "no"  
**LIA:** "Entiendo. Para completar esta actividad necesito que me des tu lista de tareas repetitivas. ¿Necesitas ejemplos? Puedo darte 2-3 ejemplos específicos de tu industria."

✅ Solución: LIA redirige al objetivo, ofrece ayuda específica.

**Usuario:** "cual me sugieres tu?"  
**LIA:** "Puedo sugerirte 2-3 ejemplos para inspirarte: 'Revisar facturas', 'Clasificar correos', 'Actualizar inventario'. Pero necesito que TÚ identifiques las tareas de TU trabajo. ¿Cuáles son tus tareas repetitivas?"

✅ Solución: LIA da ejemplos pero insiste en que el usuario dé SUS propias respuestas.

## 🔧 Cómo Funcionan los Guardrails Técnicamente

### 1. **En el Cliente (Frontend)**
```typescript
// apps/web/src/app/courses/[slug]/learn/page.tsx
const systemPrompt = `
  [GUIÓN DE LA ACTIVIDAD]
  
  ## ⚠️ RESTRICCIONES CRÍTICAS
  [GUARDRAILS DEFINIDOS]
  
  ## RECORDATORIO CONSTANTE
  [CHECKLIST ANTES DE CADA RESPUESTA]
`;

await sendLiaMessage(systemPrompt, lessonContext, true); // isSystemMessage = true
```

**Flujo:**
1. Usuario hace clic en "Interactuar con LIA"
2. Se envía el `systemPrompt` completo (incluyendo guardrails)
3. Este mensaje NO es visible en el chat (isSystemMessage = true)
4. LIA recibe las instrucciones completas antes de empezar

### 2. **En el Servidor (API)**
```typescript
// apps/web/src/app/api/ai-chat/route.ts
const messages = [
  {
    role: 'system',
    content: `${systemPrompt}\n\nEres Lia...`
  },
  ...conversationHistory,
  {
    role: isSystemMessage ? 'system' : 'user',
    content: message
  }
];
```

**Flujo:**
1. El prompt del sistema se envía como rol `system` a OpenAI
2. OpenAI lo trata como instrucciones fundamentales
3. Todas las respuestas de LIA deben seguir estas instrucciones
4. El modelo GPT prioriza las instrucciones del sistema

### 3. **En la Base de Datos**
```sql
-- lesson_activities table
activity_type = 'ai_chat'
activity_content = '[GUIÓN ESTRUCTURADO CON PASOS NUMERADOS]'
```

**Estructura del guión:**
```
Lia (IA): [Mensaje]

Usuario: [Placeholder]

---  <-- Separador de turno

Lia (IA): [Siguiente mensaje]

Usuario: [Placeholder]

---
```

## 📈 Mejoras en la Experiencia del Usuario

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Claridad** | "¿Tienes alguna tarea en mente?" | "PASO 1 de 5: Dame tu lista de 5-10 tareas repetitivas" |
| **Dirección** | Acepta cualquier respuesta | Valida y redirige si no es útil |
| **Progreso** | No se menciona | "Llevamos 2 de 5 pasos, ¡vamos bien!" |
| **Longitud** | Respuestas largas (8-10 líneas) | Respuestas concisas (3-4 líneas) |
| **Enfoque** | Se desvía fácilmente | Mantiene el foco en el objetivo |
| **Finalización** | Puede no llegar al CSV | Siempre termina con el CSV |

## 🧪 Casos de Prueba

### Caso 1: Usuario dice "no sé"
**Respuesta esperada:**
> "Te doy 3 ejemplos de tu industria: [ejemplo 1], [ejemplo 2], [ejemplo 3]. Ahora dime TUS tareas repetitivas."

### Caso 2: Usuario da respuesta muy corta
**Respuesta esperada:**
> "Necesito más detalles. ¿Qué datos ESPECÍFICOS revisas para [tarea]? Ejemplo: Monto, Fecha, Cliente..."

### Caso 3: Usuario intenta cambiar de tema
**Respuesta esperada:**
> "Entiendo tu interés, pero primero completemos el Paso [X]. [Repite pregunta actual]"

### Caso 4: Usuario da más de 3 respuestas sin avanzar
**Respuesta esperada:**
> "Para continuar, necesito que me des [información específica]. Sin esto no podemos avanzar al siguiente paso."

## 🚀 Próximas Mejoras Sugeridas

1. **Contador visual en el UI**: Mostrar "Paso 2 de 5" en la interfaz
2. **Botones de acción rápida**: "Necesito ejemplos", "Siguiente paso"
3. **Validación en tiempo real**: Validar formato antes de enviar
4. **Resumen intermedio**: Mostrar resumen cada 2-3 pasos
5. **Recuperación de sesión**: Guardar progreso si el usuario cierra

## 📝 Instrucciones de Actualización

### Para actualizar el guión en la base de datos:

```sql
-- Ejecutar en Supabase SQL Editor
\i database-fixes/update-framework-activity-v2-guardrails.sql
```

### Para modificar los guardrails en el código:

```typescript
// Editar: apps/web/src/app/courses/[slug]/learn/page.tsx
// Buscar: handleStartActivityInteraction
// Modificar: La sección ## ⚠️ RESTRICCIONES CRÍTICAS
```

## 🎓 Lecciones Aprendidas

1. **Los LLMs necesitan restricciones explícitas**: Sin guardrails, GPT prioriza ser útil y amigable sobre seguir estructuras
2. **Los recordatorios constantes funcionan**: Decirle al modelo "pregúntate esto antes de cada respuesta" mejora la adherencia
3. **La estructura visual ayuda**: Separadores "---" y "PASO X de Y" guían tanto al modelo como al usuario
4. **Menos es más**: Mensajes concisos (3-4 líneas) mantienen el foco mejor que explicaciones largas
5. **Validación > Aceptación**: Es mejor validar y pedir más info que aceptar respuestas vagas

---

**Versión:** 2.0  
**Fecha:** 5 de noviembre de 2025  
**Autor:** Sistema de IA educativa con guardrails
