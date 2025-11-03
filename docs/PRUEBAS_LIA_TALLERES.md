# 🧪 Guía de Pruebas para LIA en Talleres

## 📋 Índice
1. [Pruebas Funcionales](#pruebas-funcionales)
2. [Pruebas de Integración con Contexto](#pruebas-de-integración-con-contexto)
3. [Pruebas de Rendimiento y Límites](#pruebas-de-rendimiento-y-límites)
4. [Pruebas de Manejo de Errores](#pruebas-de-manejo-de-errores)
5. [Pruebas de UI/UX](#pruebas-de-uiux)
6. [Pruebas de Seguridad](#pruebas-de-seguridad)
7. [Checklist de Validación](#checklist-de-validación)

---

## 🎯 Pruebas Funcionales

### 1. Inicio y Mensaje Inicial

**Objetivo**: Verificar que LIA se inicializa correctamente al abrir un taller.

**Pasos a seguir**:
1. Navegar a un curso/taller: `/courses/[slug]/learn`
2. Abrir el panel derecho donde está LIA
3. Verificar que el panel se muestra correctamente

**Resultado esperado**:
- ✅ LIA muestra el mensaje inicial: "¡Hola! Soy LIA, tu tutora personalizada..."
- ✅ El chat está visible y accesible
- ✅ El input de mensaje está habilitado
- ✅ El botón de envío está visible

**Cómo verificar**:
```typescript
// Revisar que el mensaje inicial existe
{liaMessages.length > 0 && liaMessages[0].role === 'assistant'}
```

---

### 2. Envío de Mensaje Básico

**Objetivo**: Verificar que se pueden enviar mensajes a LIA y recibir respuestas.

**Pasos a seguir**:
1. Escribir un mensaje simple en el input: "Hola LIA"
2. Presionar Enter o hacer clic en el botón de envío
3. Observar el comportamiento

**Resultado esperado**:
- ✅ El mensaje aparece inmediatamente en el chat (role: 'user')
- ✅ El input se limpia después de enviar
- ✅ Se muestra un indicador de carga mientras procesa
- ✅ LIA responde con un mensaje apropiado (role: 'assistant')
- ✅ La respuesta tiene un timestamp válido

**Ejemplos de mensajes a probar**:
- "Hola"
- "¿Cómo estás?"
- "Necesito ayuda"

---

### 3. Historial de Conversación

**Objetivo**: Verificar que se mantiene el historial de la conversación.

**Pasos a seguir**:
1. Enviar múltiples mensajes en secuencia:
   - Mensaje 1: "¿Qué es este curso?"
   - Mensaje 2: "¿Cuál es el objetivo?"
   - Mensaje 3: "¿Cómo puedo empezar?"
2. Verificar que todos los mensajes se mantienen en orden

**Resultado esperado**:
- ✅ Todos los mensajes (usuario y LIA) aparecen en orden cronológico
- ✅ Los mensajes no se pierden al enviar nuevos
- ✅ El historial se mantiene durante la sesión
- ✅ Cada mensaje tiene un ID único

---

### 4. Limpiar Historial

**Objetivo**: Verificar que se puede limpiar el historial del chat.

**Pasos a seguir**:
1. Tener varios mensajes en el chat
2. Buscar y ejecutar la función de limpiar historial (si está disponible en UI)
   - O usar `clearLiaHistory()` desde consola del navegador
3. Verificar el estado del chat

**Resultado esperado**:
- ✅ El historial se limpia completamente
- ✅ Solo queda el mensaje inicial de LIA
- ✅ Se puede empezar una nueva conversación
- ✅ No hay errores en consola

---

## 🔗 Pruebas de Integración con Contexto

### 5. Contexto del Curso

**Objetivo**: Verificar que LIA recibe y usa el contexto del curso actual.

**Pasos a seguir**:
1. Estar en una lección específica de un curso
2. Enviar mensaje: "¿Sobre qué trata este curso?"
3. Verificar la respuesta

**Resultado esperado**:
- ✅ LIA menciona el nombre del curso
- ✅ La respuesta es relevante al curso actual
- ✅ LIA puede hacer referencia a información del curso

**Código relevante**:
```223:232:apps/web/src/app/courses/[slug]/learn/page.tsx
return {
  courseTitle: course.title || course.course_title,
  courseDescription: course.description || course.course_description,
  moduleTitle: currentModule?.module_title,
  lessonTitle: currentLesson.lesson_title,
  lessonDescription: currentLesson.lesson_description,
  durationSeconds: currentLesson.duration_seconds
  // transcriptContent y summaryContent se cargan bajo demanda desde sus respectivos endpoints
};
```

---

### 6. Contexto de la Lección Actual

**Objetivo**: Verificar que LIA conoce la lección actual.

**Pasos a seguir**:
1. Estar en una lección específica (ej: "Lección 3: Introducción a IA")
2. Enviar mensaje: "¿Qué vamos a aprender en esta lección?"
3. Cambiar a otra lección
4. Enviar el mismo mensaje

**Resultado esperado**:
- ✅ LIA menciona el título de la lección actual
- ✅ La respuesta cambia cuando cambias de lección
- ✅ LIA puede referirse al contenido específico de la lección

---

### 7. Transcripción del Video (si está disponible)

**Objetivo**: Verificar que LIA usa la transcripción del video actual.

**Pasos a seguir**:
1. Estar en una lección que tenga transcripción disponible
2. Ver la transcripción en la pestaña "Transcripción"
3. Enviar a LIA una pregunta sobre contenido específico de la transcripción
   - Ejemplo: Si la transcripción menciona "machine learning", preguntar: "¿Qué es machine learning según el video?"
4. Verificar la respuesta

**Resultado esperado**:
- ✅ LIA responde basándose en la transcripción
- ✅ La respuesta es coherente con el contenido del video
- ✅ Si la transcripción no está disponible, LIA lo indica claramente

**Nota**: Actualmente, `transcriptContent` se carga bajo demanda y puede no estar siempre disponible en el contexto.

---

### 8. Resumen de la Lección (si está disponible)

**Objetivo**: Verificar que LIA usa el resumen de la lección.

**Pasos a seguir**:
1. Estar en una lección que tenga resumen
2. Ver el resumen en la pestaña "Resumen"
3. Preguntar a LIA: "¿Cuáles son los puntos clave de esta lección?"
4. Comparar la respuesta con el resumen visible

**Resultado esperado**:
- ✅ LIA menciona puntos clave del resumen
- ✅ La respuesta es coherente con el resumen visible
- ✅ LIA prioriza la transcripción sobre el resumen si ambos están disponibles

---

### 9. Cambio de Lección y Actualización de Contexto

**Objetivo**: Verificar que el contexto se actualiza al cambiar de lección.

**Pasos a seguir**:
1. Estar en la Lección 1
2. Preguntar: "¿En qué lección estoy?"
3. Navegar a la Lección 2
4. Preguntar nuevamente: "¿En qué lección estoy?"

**Resultado esperado**:
- ✅ La primera respuesta indica "Lección 1"
- ✅ La segunda respuesta indica "Lección 2"
- ✅ El contexto se actualiza automáticamente sin necesidad de recargar

---

## ⚡ Pruebas de Rendimiento y Límites

### 10. Tiempo de Respuesta

**Objetivo**: Verificar que las respuestas de LIA llegan en tiempo razonable.

**Pasos a seguir**:
1. Abrir la consola del navegador (F12 → Network)
2. Enviar un mensaje a LIA
3. Medir el tiempo desde el envío hasta la respuesta

**Resultado esperado**:
- ✅ La respuesta llega en menos de 10 segundos (tiempo normal para OpenAI API)
- ✅ Se muestra un indicador de carga durante la espera
- ✅ No hay timeouts

**Criterios de aceptación**:
- Respuesta rápida (< 5s): ✅ Excelente
- Respuesta normal (5-10s): ✅ Aceptable
- Respuesta lenta (> 10s): ⚠️ Revisar conexión/API
- Timeout o error: ❌ Revisar configuración

---

### 11. Límite de Longitud de Mensaje

**Objetivo**: Verificar que se respeta el límite de caracteres en mensajes.

**Pasos a seguir**:
1. Intentar escribir un mensaje muy largo (> 2000 caracteres)
2. Enviar el mensaje
3. Verificar el comportamiento

**Resultado esperado**:
- ✅ Si el mensaje excede 2000 caracteres, debe mostrarse un error
- ✅ El error debe ser claro: "El mensaje es muy largo. Máximo 2000 caracteres."
- ✅ Mensajes menores a 2000 caracteres se procesan normalmente

**Código relevante**:
```144:151:apps/web/src/app/api/ai-chat/route.ts
// ✅ Límite de longitud del mensaje (2000 caracteres)
const MAX_MESSAGE_LENGTH = 2000;
if (message.length > MAX_MESSAGE_LENGTH) {
  return NextResponse.json(
    { error: `El mensaje es muy largo. Máximo ${MAX_MESSAGE_LENGTH} caracteres.` },
    { status: 400 }
  );
}
```

**Pruebas específicas**:
- Mensaje de 1999 caracteres: ✅ Debe funcionar
- Mensaje de 2000 caracteres: ✅ Debe funcionar
- Mensaje de 2001 caracteres: ❌ Debe rechazarse

---

### 12. Rate Limiting

**Objetivo**: Verificar que el rate limiting funciona correctamente.

**Pasos a seguir**:
1. Enviar 10 mensajes rápidamente (uno tras otro)
2. Intentar enviar un mensaje número 11 inmediatamente después
3. Verificar el comportamiento

**Resultado esperado**:
- ✅ Los primeros 10 mensajes se procesan correctamente
- ✅ El mensaje 11 debe ser rechazado o mostrar un error de rate limit
- ✅ El error debe ser: "Demasiadas solicitudes al chatbot. Por favor, espera un momento."
- ✅ Después de 1 minuto, debe permitir enviar nuevos mensajes

**Código relevante**:
```96:100:apps/web/src/app/api/ai-chat/route.ts
const rateLimitResult = checkRateLimit(request, {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minuto
  message: 'Demasiadas solicitudes al chatbot. Por favor, espera un momento.'
}, 'openai');
```

**Nota**: Esta prueba puede requerir automatización o herramientas como Postman para enviar múltiples requests rápidamente.

---

### 13. Historial de Conversación (Límite)

**Objetivo**: Verificar que el historial se limita correctamente.

**Pasos a seguir**:
1. Enviar más de 20 mensajes en una conversación
2. Verificar que el historial se mantiene pero está limitado
3. Enviar un mensaje adicional y verificar que LIA mantiene contexto

**Resultado esperado**:
- ✅ Solo se envían los últimos 20 mensajes a la API
- ✅ El historial visual puede mostrar más, pero solo los últimos 20 se usan para contexto
- ✅ LIA mantiene coherencia en la conversación

**Código relevante**:
```153:158:apps/web/src/app/api/ai-chat/route.ts
// ✅ Límite de historial de conversación (últimos 20 mensajes)
const MAX_HISTORY_LENGTH = 20;
let limitedHistory = conversationHistory;
if (Array.isArray(conversationHistory) && conversationHistory.length > MAX_HISTORY_LENGTH) {
  limitedHistory = conversationHistory.slice(-MAX_HISTORY_LENGTH);
}
```

---

## 🚨 Pruebas de Manejo de Errores

### 14. Error de Conexión (Sin Internet)

**Objetivo**: Verificar el manejo cuando no hay conexión a internet.

**Pasos a seguir**:
1. Abrir DevTools → Network
2. Seleccionar "Offline" en el simulador de red
3. Intentar enviar un mensaje a LIA
4. Restaurar la conexión
5. Verificar el comportamiento

**Resultado esperado**:
- ✅ Se muestra un mensaje de error claro
- ✅ El error indica: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo."
- ✅ Al restaurar conexión, se puede enviar mensajes nuevamente
- ✅ No hay errores en consola que rompan la aplicación

**Código relevante**:
```78:92:apps/web/src/core/hooks/useLiaChat.ts
} catch (err) {
  const errorMessage = err instanceof Error ? err : new Error('Error desconocido');
  setError(errorMessage);
  
  const errorResponse: LiaMessage = {
    id: (Date.now() + 1).toString(),
    role: 'assistant',
    content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.',
    timestamp: new Date()
  };
  
  setMessages(prev => [...prev, errorResponse]);
} finally {
  setIsLoading(false);
}
```

---

### 15. Error de API (OpenAI no disponible)

**Objetivo**: Verificar el comportamiento cuando OpenAI API falla.

**Pasos a seguir**:
1. Simular un error de API (modificar temporalmente la API key o endpoint)
2. Enviar un mensaje
3. Verificar el manejo del error

**Resultado esperado**:
- ✅ Se muestra un mensaje de error amigable
- ✅ Se usa el fallback de respuestas predeterminadas (si está implementado)
- ✅ La aplicación no se rompe
- ✅ El usuario puede seguir intentando

**Código relevante**:
```185:195:apps/web/src/app/api/ai-chat/route.ts
if (openaiApiKey) {
  try {
    response = await callOpenAI(message, contextPrompt, conversationHistory, hasCourseContext, userId);
  } catch (error) {
    logger.error('Error con OpenAI, usando fallback:', error);
    response = generateAIResponse(message, context, limitedHistory, contextPrompt);
  }
} else {
  // Usar respuestas predeterminadas si no hay API key
  response = generateAIResponse(message, context, limitedHistory, contextPrompt);
}
```

---

### 16. Mensaje Vacío

**Objetivo**: Verificar que no se pueden enviar mensajes vacíos.

**Pasos a seguir**:
1. Intentar enviar un mensaje vacío (solo espacios)
2. Intentar enviar un mensaje sin contenido
3. Verificar el comportamiento

**Resultado esperado**:
- ✅ El botón de envío está deshabilitado cuando el input está vacío
- ✅ No se puede enviar mensajes que solo contengan espacios
- ✅ El input se valida antes de enviar

**Código relevante**:
```32:32:apps/web/src/core/hooks/useLiaChat.ts
if (!message.trim() || isLoading) return;
```

---

### 17. Error de Validación del Servidor

**Objetivo**: Verificar el manejo de errores de validación del servidor.

**Pasos a seguir**:
1. Enviar un mensaje con formato incorrecto (usando herramientas de desarrollo)
2. Enviar un mensaje demasiado largo
3. Verificar las respuestas de error

**Resultado esperado**:
- ✅ Los errores se muestran claramente al usuario
- ✅ Los códigos de estado HTTP son apropiados (400 para errores de validación)
- ✅ Los mensajes de error son informativos

---

## 🎨 Pruebas de UI/UX

### 18. Interfaz Visual del Chat

**Objetivo**: Verificar que la interfaz del chat se muestra correctamente.

**Pasos a seguir**:
1. Abrir un curso y ver el panel de LIA
2. Verificar todos los elementos visuales
3. Probar en diferentes tamaños de pantalla

**Resultado esperado**:
- ✅ El panel de LIA es visible y accesible
- ✅ Los mensajes del usuario aparecen alineados a la derecha (o diseño establecido)
- ✅ Los mensajes de LIA aparecen alineados a la izquierda (o diseño establecido)
- ✅ Hay separación visual clara entre mensajes
- ✅ Los timestamps se muestran correctamente
- ✅ El diseño es responsive en móvil, tablet y desktop

---

### 19. Indicador de Carga

**Objetivo**: Verificar que se muestra correctamente el estado de carga.

**Pasos a seguir**:
1. Enviar un mensaje a LIA
2. Observar el indicador de carga durante la espera
3. Verificar que desaparece cuando llega la respuesta

**Resultado esperado**:
- ✅ Se muestra un indicador de carga mientras se procesa el mensaje
- ✅ El indicador es visible y claro
- ✅ El input está deshabilitado durante la carga
- ✅ El botón de envío muestra estado de carga o está deshabilitado
- ✅ El indicador desaparece cuando llega la respuesta

**Código relevante**:
```1318:1330:apps/web/src/app/courses/[slug]/learn/page.tsx
{isLiaLoading && (
  <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>LIA está pensando...</span>
  </div>
)}
```

---

### 20. Input y Envío de Mensajes

**Objetivo**: Verificar la funcionalidad del input y botones.

**Pasos a seguir**:
1. Escribir en el input
2. Enviar con Enter
3. Enviar con el botón
4. Verificar estados del botón

**Resultado esperado**:
- ✅ El input permite escribir normalmente
- ✅ Al presionar Enter se envía el mensaje (si no está en estado de carga)
- ✅ El botón de envío funciona correctamente
- ✅ El botón está deshabilitado cuando el input está vacío o durante la carga
- ✅ El placeholder es claro: "Escribe tu pregunta a LIA..."

**Código relevante**:
```1336:1355:apps/web/src/app/courses/[slug]/learn/page.tsx
<input
  type="text"
  placeholder="Escribe tu pregunta a LIA..."
  value={liaMessage}
  onChange={(e) => setLiaMessage(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !isLiaLoading) {
      e.preventDefault();
      handleSendLiaMessage();
    }
  }}
  disabled={isLiaLoading}
  className="..."
/>
<button
  onClick={handleSendLiaMessage}
  disabled={!liaMessage.trim() || isLiaLoading}
  className="..."
>
  {isLiaLoading ? (
    <Loader2 className="w-4 h-4 animate-spin" />
  ) : (
    <Send className="w-4 h-4" />
  )}
</button>
```

---

### 21. Scroll Automático

**Objetivo**: Verificar que el chat hace scroll automático a nuevos mensajes.

**Pasos a seguir**:
1. Tener varios mensajes en el chat
2. Hacer scroll hacia arriba para ver mensajes anteriores
3. Enviar un nuevo mensaje
4. Verificar el comportamiento del scroll

**Resultado esperado**:
- ✅ Al enviar un nuevo mensaje, el chat hace scroll automático hacia abajo
- ✅ Los nuevos mensajes son visibles sin necesidad de hacer scroll manual
- ✅ El scroll es suave y no molesto

---

### 22. Responsive Design

**Objetivo**: Verificar que LIA funciona bien en diferentes dispositivos.

**Pasos a seguir**:
1. Probar en desktop (1920x1080)
2. Probar en tablet (768x1024)
3. Probar en móvil (375x667)
4. Cambiar el tamaño de la ventana del navegador

**Resultado esperado**:
- ✅ El panel de LIA se adapta correctamente a diferentes tamaños
- ✅ Los mensajes son legibles en todos los tamaños
- ✅ El input y botones son accesibles
- ✅ No hay elementos que se superpongan o corten

---

## 🔒 Pruebas de Seguridad

### 23. Autenticación (si está requerida)

**Objetivo**: Verificar que la autenticación funciona correctamente.

**Pasos a seguir**:
1. Cerrar sesión
2. Intentar enviar un mensaje a LIA
3. Verificar el comportamiento

**Resultado esperado**:
- ✅ Si la autenticación es requerida, debe mostrar un error claro
- ✅ Si la autenticación es opcional, debe funcionar sin sesión
- ✅ Los mensajes de usuarios autenticados se guardan en el historial de BD

**Código relevante**:
```108:120:apps/web/src/app/api/ai-chat/route.ts
// Verificar autenticación (hacer opcional para pruebas)
const { data: { user }, error: authError } = await supabase.auth.getUser();

// Por ahora permitimos el acceso sin autenticación para pruebas
// Descomentar las siguientes líneas si quieres requerir autenticación:
/*
if (authError || !user) {
  return NextResponse.json(
    { error: 'No autorizado' },
    { status: 401 }
  );
}
*/
```

**Nota**: Actualmente la autenticación es opcional para pruebas.

---

### 24. Sanitización de Inputs

**Objetivo**: Verificar que los mensajes del usuario se sanitizan correctamente.

**Pasos a seguir**:
1. Intentar enviar mensajes con caracteres especiales: `<script>alert('XSS')</script>`
2. Intentar enviar mensajes con SQL injection: `' OR '1'='1`
3. Verificar que no se ejecuta código malicioso

**Resultado esperado**:
- ✅ Los scripts no se ejecutan en el navegador
- ✅ Los caracteres especiales se muestran correctamente o se escapan
- ✅ No hay vulnerabilidades de XSS
- ✅ Los mensajes se guardan de forma segura en la BD

---

### 25. Validación de Datos

**Objetivo**: Verificar que los datos enviados se validan correctamente.

**Pasos a seguir**:
1. Enviar mensajes con diferentes tipos de datos (null, undefined, objetos, arrays)
2. Verificar que solo se aceptan strings válidos

**Resultado esperado**:
- ✅ Solo se aceptan strings
- ✅ Se rechazan valores null, undefined, objetos, arrays
- ✅ Los errores de validación se muestran claramente

**Código relevante**:
```136:142:apps/web/src/app/api/ai-chat/route.ts
// ✅ Validaciones básicas
if (!message || typeof message !== 'string') {
  return NextResponse.json(
    { error: 'El mensaje es requerido' },
    { status: 400 }
  );
}
```

---

## ✅ Checklist de Validación

Usa este checklist para realizar una prueba completa:

### Funcionalidad Básica
- [ ] LIA se inicializa correctamente con mensaje de bienvenida
- [ ] Se pueden enviar mensajes al chat
- [ ] Se reciben respuestas de LIA
- [ ] El historial se mantiene durante la sesión
- [ ] Se puede limpiar el historial

### Integración con Contexto
- [ ] LIA conoce el curso actual
- [ ] LIA conoce la lección actual
- [ ] LIA actualiza el contexto al cambiar de lección
- [ ] LIA usa la transcripción cuando está disponible
- [ ] LIA usa el resumen cuando está disponible

### Rendimiento
- [ ] Las respuestas llegan en tiempo razonable (< 10s)
- [ ] El límite de 2000 caracteres funciona
- [ ] El rate limiting funciona (10 req/min)
- [ ] El historial se limita a 20 mensajes

### Manejo de Errores
- [ ] Errores de conexión se manejan correctamente
- [ ] Errores de API se manejan con fallback
- [ ] No se pueden enviar mensajes vacíos
- [ ] Los errores de validación se muestran claramente

### UI/UX
- [ ] La interfaz es clara y funcional
- [ ] El indicador de carga funciona
- [ ] El input y botones funcionan correctamente
- [ ] El scroll automático funciona
- [ ] Es responsive en diferentes dispositivos

### Seguridad
- [ ] La autenticación funciona (si es requerida)
- [ ] Los inputs se sanitizan correctamente
- [ ] Los datos se validan correctamente
- [ ] No hay vulnerabilidades de XSS

---

## 📝 Notas Adicionales

### Herramientas Útiles para Pruebas

1. **DevTools del Navegador**:
   - F12 → Console: Ver errores de JavaScript
   - F12 → Network: Ver requests HTTP y tiempos de respuesta
   - F12 → Application → Local Storage: Ver datos guardados

2. **Postman o Thunder Client**:
   - Para probar la API directamente: `POST /api/ai-chat`
   - Para probar rate limiting enviando múltiples requests

3. **Extensión de Navegador - React DevTools**:
   - Para inspeccionar el estado de React
   - Ver props y estado de componentes

### Comandos Útiles en Consola del Navegador

```javascript
// Limpiar historial de LIA (si está disponible en window)
// O usar la función directamente desde el componente

// Ver el estado actual de los mensajes
// (requiere acceso al componente o debugger)
```

### Variables de Entorno a Verificar

- `OPENAI_API_KEY`: Debe estar configurada para usar OpenAI
- `CHATBOT_MODEL`: Modelo a usar (default: 'gpt-4o-mini')
- `CHATBOT_TEMPERATURE`: Temperatura del modelo
- `CHATBOT_MAX_TOKENS`: Máximo de tokens por respuesta

---

## 🐛 Problemas Comunes y Soluciones

### Problema: LIA no responde
**Solución**: Verificar que `OPENAI_API_KEY` esté configurada y sea válida

### Problema: Respuestas lentas
**Solución**: Verificar conexión a internet y estado de OpenAI API

### Problema: Contexto no se actualiza
**Solución**: Verificar que `getLessonContext()` se llama correctamente al cambiar de lección

### Problema: Rate limit demasiado estricto
**Solución**: Ajustar `maxRequests` y `windowMs` en `checkRateLimit()`

### Problema: Historial no se guarda
**Solución**: Verificar que la tabla `ai_chat_history` existe en Supabase y el usuario está autenticado

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0


