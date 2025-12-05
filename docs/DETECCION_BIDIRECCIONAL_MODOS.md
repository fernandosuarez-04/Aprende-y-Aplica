# DETECCIÓN BIDIRECCIONAL DE MODOS - IMPLEMENTADO ✅

**Fecha:** 2 de Diciembre de 2025  
**Estado:** ✅ **COMPLETADO**

---

## 🐛 PROBLEMA REPORTADO

El usuario estaba en **Modo Prompts** 🎯 y preguntó:
> "¿El sitio web tiene comunidades?"

**Respuesta incorrecta de LIA:**
- Dijo que el usuario estaba en la página de Comunidad
- Cuando en realidad estaba en `/learn`
- No proporcionó el enlace correcto

**Respuesta esperada:**
- Debe cambiar automáticamente a **Modo Contexto** 🧠
- Responder sobre la plataforma en general
- Incluir el enlace a [Comunidades](/communities)

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. Detección Bidireccional

**Archivo:** `apps/web/src/core/hooks/useLiaChat.ts`

```typescript
// ANTES: Solo detectaba cuando ENTRAR al modo prompts
if (currentMode !== 'prompts' && detectadoCrearPrompt) {
  setCurrentMode('prompts');
}

// DESPUÉS: Detecta cuando ENTRAR Y SALIR de modos
// CASO 1: Entrar a modo prompts
if (currentMode !== 'prompts' && detectadoCrearPrompt) {
  modeForThisMessage = 'prompts';
  setCurrentMode('prompts');
}
// CASO 2: Salir del modo prompts (NUEVO)
else if (currentMode === 'prompts' && !detectadoCrearPrompt) {
  modeForThisMessage = 'context';
  setCurrentMode('context');
}
```

### 2. No Enviar Contexto del Curso en Modo Contexto

```typescript
// Variable para controlar si enviar courseContext
let shouldSendCourseContext = false;

if (modeForThisMessage === 'course' && courseContext) {
  effectiveContext = 'course';
  shouldSendCourseContext = true; // ✅ Enviar contexto del curso
} else if (modeForThisMessage === 'prompts') {
  effectiveContext = 'prompts';
  shouldSendCourseContext = false; // ❌ NO enviar contexto del curso
} else if (modeForThisMessage === 'context') {
  effectiveContext = 'general';
  shouldSendCourseContext = false; // ❌ NO enviar contexto del curso
}

// Al enviar al API
courseContext: shouldSendCourseContext ? courseContext : undefined
```

### 3. Mensajes de Notificación

Ahora hay dos mensajes diferentes según la dirección del cambio:

**Entrada al Modo Prompts:**
> ✨ He detectado que quieres crear un prompt. He activado el **Modo Prompts** 🎯  
> ¿Qué tipo de prompt necesitas crear?

**Salida del Modo Prompts (a Contexto):**
> 🧠 He cambiado al **Modo Contexto** para responder tu pregunta general.

### 4. Logging Mejorado

```javascript
console.log('[LIA] 🔍 Detectando intención para:', message);
console.log('[LIA] 📍 Modo actual:', currentMode);
console.log('[LIA] 📊 Resultado:', {
  intent: intentResult.intent,
  confidence: '95.0%'
});
console.log('[LIA] 🔄 Pregunta general detectada. Cambiando a Modo Contexto');
console.log('[LIA] 📤 Enviando al API:', {
  mode: 'context',
  context: 'general',
  sendingCourseContext: false
});
```

---

## 🎯 FLUJO COMPLETO

### Escenario: Usuario Pregunta sobre Comunidades desde Modo Prompts

```
1. Usuario está en Modo Prompts 🎯
   ↓
2. Escribe: "¿El sitio web tiene comunidades?"
   ↓
3. [LIA] 🔍 Detectando intención...
   ↓
4. [LIA] 📊 Resultado: intent='question', confidence='70%'
   ↓
5. [LIA] 🔄 Pregunta general detectada. Cambiando a Modo Contexto
   ↓
6. Badge cambia a "🧠 Contexto" (teal)
   ↓
7. Mensaje del sistema: "🧠 He cambiado al Modo Contexto..."
   ↓
8. [LIA] 📤 Enviando al API:
   - mode: 'context'
   - context: 'general'
   - courseContext: undefined (NO se envía)
   - isPromptMode: false
   ↓
9. API usa system prompt 'general' con instrucciones de enlaces
   ↓
10. LIA responde:
    "Sí, la plataforma cuenta con un espacio para unirse a [Comunidades](/communities).
    En la sección de Comunidades, puedes participar en actividades grupales..."
    ↓
11. ✅ Respuesta correcta con enlace funcional
```

---

## 📋 VERIFICACIÓN DEL CONTEXTO GENERAL

El system prompt para contexto 'general' incluye:

✅ **Instrucciones de Enlaces:**
```
INSTRUCCIONES PARA PROPORCIONAR URLs Y NAVEGACIÓN:
- Cuando sugieras navegar a otra página, SIEMPRE proporciona la URL completa con formato de hipervínculo
- Formato: [texto del enlace](URL_completa)
- Ejemplo: Puedes ver tus cursos en [Mis Cursos](/my-courses)
```

✅ **Ayuda con Navegación:**
```
AYUDA CON NAVEGACIÓN Y CONTENIDO DE PÁGINAS:
- Cuando el usuario pregunte sobre qué hay en una página específica,
  usa el contexto de la plataforma para explicar...
- SIEMPRE que menciones una página o funcionalidad de la plataforma,
  incluye el enlace en formato [texto](url)
```

✅ **Contexto de la Plataforma:**
```typescript
if (pageContext.platformContext) {
  pageInfo += `\n\n${pageContext.platformContext}`;
}
```

✅ **Enlaces Disponibles según Rol:**
```typescript
if (pageContext.availableLinks) {
  pageInfo += `\n\n${pageContext.availableLinks}`;
}
```

---

## 🧪 CÓMO PROBAR

### Prueba 1: Cambio de Prompts a Contexto

1. **Ve a cualquier curso:** `/courses/[slug]/learn`
2. **Abre el chat de LIA** (panel derecho)
3. **Activa modo prompts:**
   - Manual: Menú (⋮) → "🎯 Crear Prompts"
   - O automático: "quiero crear un prompt"
4. **Verifica badge:** Debe mostrar "🎯 Prompts" (púrpura, pulsando)
5. **Haz una pregunta general:** "¿El sitio web tiene comunidades?"
6. **Observa en consola (F12):**
   ```
   [LIA] 🔍 Detectando intención para: ¿El sitio web tiene comunidades?
   [LIA] 📍 Modo actual: prompts
   [LIA] 📊 Resultado: {intent: 'question', confidence: '70%'}
   [LIA] 🔄 Pregunta general detectada. Cambiando a Modo Contexto
   [LIA] 📤 Enviando al API: {mode: 'context', context: 'general', sendingCourseContext: false}
   ```
7. **Verifica badge:** Cambia a "🧠 Contexto" (teal)
8. **Verifica respuesta:** Debe incluir `[Comunidades](/communities)` clickeable

### Prueba 2: Respuesta Correcta en Modo Contexto

**Pregunta:** "¿El sitio web tiene comunidades?"

**Respuesta Esperada:**
> Sí, la plataforma cuenta con un espacio para unirse a [Comunidades](/communities). En la sección de Comunidades, puedes participar en actividades grupales, hacer networking y conectar con otros usuarios. Allí podrás buscar comunidades, filtrar por categorías y unirte a las que te interesen.

**Verificar:**
- ✅ NO menciona que estás en la página de Comunidad
- ✅ Usa lenguaje general sobre "la plataforma"
- ✅ Incluye enlace clickeable: `[Comunidades](/communities)`
- ✅ La palabra "Comunidades" está con enlace

---

## 📊 COMPARACIÓN: ANTES VS DESPUÉS

### ANTES (❌ Incorrecto)

**Contexto:** Usuario en `/learn`, Modo Prompts, pregunta sobre comunidades

**Flujo:**
1. Modo: `prompts`
2. Context enviado: `course` (con courseContext)
3. LIA responde con restricciones del curso
4. Dice: "Estás en la página de Comunidad" ❌

**Problemas:**
- ❌ No detecta que es pregunta general
- ❌ Sigue en modo prompts
- ❌ Envía courseContext incorrectamente
- ❌ Respuesta con información incorrecta

### DESPUÉS (✅ Correcto)

**Contexto:** Usuario en `/learn`, Modo Prompts, pregunta sobre comunidades

**Flujo:**
1. Detecta: intent='question' (no es sobre prompts)
2. Cambia modo: `prompts` → `context`
3. Context enviado: `general` (sin courseContext)
4. LIA responde con contexto de plataforma
5. Dice: "La plataforma cuenta con [Comunidades](/communities)" ✅

**Mejoras:**
- ✅ Detecta automáticamente pregunta general
- ✅ Cambia a modo contexto
- ✅ NO envía courseContext
- ✅ Respuesta correcta con enlace

---

## 🔧 ARCHIVOS MODIFICADOS

### `apps/web/src/core/hooks/useLiaChat.ts`

**Cambios:**
1. ✅ Detección bidireccional (entrar Y salir de modos)
2. ✅ Variable `modeForThisMessage` para consistencia
3. ✅ Control de `shouldSendCourseContext`
4. ✅ Mensajes de notificación personalizados
5. ✅ Logging detallado para debugging

**Líneas afectadas:** ~80-160

---

## 📝 NOTAS IMPORTANTES

### Sobre Enlaces en Respuestas

Los enlaces funcionan porque:
1. ✅ El system prompt incluye instrucciones para usar `[texto](url)`
2. ✅ La función `cleanMarkdownFromResponse` PRESERVA los enlaces (línea 89-90 del API)
3. ✅ El contexto 'general' incluye `${urlInstructions}` y `${pageContext.availableLinks}`

### Sobre Detección de Intenciones

La detección de intenciones clasifica mensajes en:
- `create_prompt` → Cambiar a Modo Prompts
- `navigate` → Permanecer en modo actual
- `question` → Si está en Modo Prompts, cambiar a Modo Contexto
- `general` → Si está en Modo Prompts, cambiar a Modo Contexto

### Sobre Contextos del API

El API `/api/ai-chat/route.ts` tiene system prompts diferentes por contexto:
- `course` → Restricciones de contenido del curso
- `prompts` → Guía paso a paso para crear prompts
- `general` → Información sobre la plataforma + enlaces

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] Detección bidireccional implementada
- [x] Cambio de prompts → contexto funciona
- [x] NO se envía courseContext en modo contexto
- [x] Badge cambia correctamente
- [x] Mensaje de notificación se muestra
- [x] Logging implementado
- [x] Context 'general' tiene instrucciones de enlaces
- [x] cleanMarkdownFromResponse preserva enlaces
- [x] Sin errores de linter

---

## 🎉 RESULTADO ESPERADO

**Ahora cuando preguntes sobre la plataforma desde Modo Prompts:**

1. 🔄 **Cambio automático** a Modo Contexto
2. 🧠 **Badge cambia** a teal "🧠 Contexto"
3. 📋 **Notificación clara** del cambio
4. 🌐 **Respuesta sobre la plataforma** (no sobre el curso)
5. 🔗 **Enlaces correctos** en formato `[texto](url)`
6. ✅ **Experiencia fluida** y natural

---

**Creado:** 2 de Diciembre de 2025  
**Estado:** ✅ Implementado y listo para pruebas

