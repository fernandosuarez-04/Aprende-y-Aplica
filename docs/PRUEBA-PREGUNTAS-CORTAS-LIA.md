# Guía de Prueba: Preguntas Cortas y Formato sin Markdown

## Objetivo
Verificar que LIA responda correctamente a preguntas cortas/vagas usando el contexto de la página y que NO use formato markdown en sus respuestas.

## Cambios Implementados

### 1. Extracción de Contenido del DOM ✅
- LIA ahora extrae automáticamente:
  - `document.title`
  - Meta description
  - Encabezados principales (h1, h2)
  - Texto visible de la página (hasta 800 caracteres)

### 2. Prompt Mejorado para Preguntas Cortas ✅
- Instrucciones específicas para interpretar preguntas vagas
- Ejemplos de cómo responder a "Aquí qué", "De qué trata esto", etc.
- Uso del contexto real de la página para dar respuestas directas

### 3. Restricciones Reforzadas de Formato ✅
- Prohibición absoluta de todos los símbolos markdown
- Instrucciones repetidas en múltiples lugares del prompt
- Ejemplos claros de formato correcto e incorrecto

---

## Casos de Prueba

### ✅ Prueba 1: Pregunta Corta en Página de Comunidades
**Página:** `/communities`

**Pregunta del usuario:** "Aquí qué"

**Respuesta esperada:**
- ✅ Menciona el título de la página
- ✅ Explica qué son las comunidades
- ✅ Lista las acciones principales que puede hacer
- ✅ Usa texto plano (sin ** __ # ` etc.)
- ✅ Puede usar emojis y guiones simples (-)

**Ejemplo de respuesta correcta:**
```
¡Hola! 😊 Estás en la página de Comunidades de Aprende y Aplica. 

Aquí puedes:
- Unirte a grupos de interés sobre IA y tecnología
- Participar en discusiones con otros miembros
- Compartir experiencias y aprender de la comunidad
- Hacer networking con profesionales del sector

Los temas principales que encontrarás son: Inteligencia Artificial, Automatización, Mejores Prácticas. ¿Hay alguna comunidad específica que te interese?
```

---

### ✅ Prueba 2: Pregunta Corta en Página de Curso
**Página:** `/courses/[slug]/learn`

**Pregunta del usuario:** "De qué trata esto"

**Respuesta esperada:**
- ✅ Menciona el nombre del curso
- ✅ Menciona el módulo actual
- ✅ Explica el tema de la lección
- ✅ Sin markdown (nada de ** o __ o # o `)
- ✅ Referencias al contenido de la transcripción si está disponible

---

### ✅ Prueba 3: Pregunta Corta en Página de Noticias
**Página:** `/news`

**Pregunta del usuario:** "Aqui que"

**Respuesta esperada:**
- ✅ Identifica que está en noticias
- ✅ Explica qué tipo de contenido hay
- ✅ Menciona los encabezados principales si están disponibles
- ✅ Formato de texto plano

---

### ✅ Prueba 4: Verificación de Formato sin Markdown
**Página:** Cualquiera

**Pregunta del usuario:** "Explícame los beneficios de la IA"

**Respuesta esperada:**
- ❌ NO debe contener: **texto**, __texto__, *texto*, _texto_
- ❌ NO debe contener: # Título, ## Subtítulo
- ❌ NO debe contener: `código`, ```código```
- ❌ NO debe contener: [enlace](url)
- ❌ NO debe contener: > cita
- ❌ NO debe contener: --- o ***
- ✅ SÍ puede usar: MAYÚSCULAS para enfatizar
- ✅ SÍ puede usar: guiones simples (-) para listas
- ✅ SÍ puede usar: números (1, 2, 3) para listas numeradas
- ✅ SÍ puede usar: emojis 😊

---

### ✅ Prueba 5: Pregunta Ambigua con Contexto de Página
**Página:** `/dashboard`

**Pregunta del usuario:** "Qué hay aquí"

**Respuesta esperada:**
- ✅ Usa el título de la página extraído del DOM
- ✅ Usa los encabezados principales extraídos
- ✅ Explica las secciones visibles del dashboard
- ✅ Respuesta natural y conversacional
- ✅ Sin símbolos markdown

---

## Verificación en Consola

Cuando abras el chat, verás logs como:

```javascript
📄 Contenido de página extraído: {
  title: "Comunidades - Aprende y Aplica",
  metaDescriptionLength: 150,
  headingsCount: 3,
  mainTextLength: 450,
  headings: ["Comunidades Activas", "Únete a una Comunidad", "Beneficios"]
}

🔄 Enviando mensaje a la API... {
  message: "Aquí qué",
  context: "communities",
  pageContent: { ... },
  ...
}
```

---

## Checklist de Verificación

### Formato de Respuestas
- [ ] No hay asteriscos dobles (**)
- [ ] No hay guiones bajos dobles (__)
- [ ] No hay asteriscos simples (*) excepto en listas
- [ ] No hay almohadillas (#) para títulos
- [ ] No hay backticks (`)
- [ ] Usa guiones simples (-) para listas
- [ ] Usa MAYÚSCULAS para énfasis
- [ ] Usa emojis apropiadamente

### Respuestas Contextuales
- [ ] Interpreta "Aquí qué" correctamente
- [ ] Menciona el título de la página
- [ ] Menciona los encabezados principales
- [ ] Explica qué puede hacer el usuario
- [ ] Respuesta directa y natural (no pide aclaración)

### Contenido del DOM
- [ ] El log muestra título extraído
- [ ] El log muestra encabezados extraídos
- [ ] El log muestra texto principal extraído
- [ ] La respuesta usa ese contenido real

---

## Problemas Comunes y Soluciones

### Problema: Sigue usando asteriscos en respuestas
**Solución:** Verificar que el antiMarkdownInstructions se está aplicando en la función callOpenAI.

### Problema: No entiende "Aquí qué"
**Solución:** Verificar que el pageContext con contenido del DOM se está enviando correctamente.

### Problema: Respuestas genéricas sin usar contexto
**Solución:** Verificar los logs de consola para confirmar que extractPageContent() está funcionando y retornando datos.

### Problema: No extrae contenido de páginas dinámicas
**Solución:** El delay de 500ms debería ser suficiente. Si no, aumentar a 1000ms en el useEffect de extracción.

---

## Comandos para Probar

1. Iniciar el servidor de desarrollo:
```powershell
npm run dev
```

2. Navegar a diferentes páginas y probar preguntas cortas
3. Abrir la consola del navegador (F12) para ver los logs
4. Verificar que las respuestas NO tengan markdown

---

## Resultado Esperado Final

✅ LIA debe comportarse como un guía que ve la misma pantalla que el usuario
✅ Responde preguntas vagas usando el contenido real visible
✅ Nunca usa símbolos markdown en las respuestas
✅ Es natural, conversacional y útil
✅ Usa emojis para hacer respuestas más amigables
