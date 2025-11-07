# 🚀 Guía Rápida de Prueba - LIA

## Iniciar el servidor

```powershell
npm run dev
```

Espera a que muestre: `✓ Ready in Xms` o similar

---

## Casos de Prueba Rápidos

### ✅ Test 1: Pregunta Corta (2 minutos)

1. **Ve a:** http://localhost:3000/communities
2. **Abre LIA:** Click en el robot flotante abajo a la derecha
3. **Pregunta:** "Aquí qué"
4. **Verifica:**
   - ✅ Responde con información de la página de comunidades
   - ✅ Menciona el título o tema principal
   - ❌ NO usa asteriscos (**) ni símbolos markdown

---

### ✅ Test 2: Otra Página (2 minutos)

1. **Ve a:** http://localhost:3000/courses (o cualquier curso)
2. **Pregunta:** "De qué trata esto"
3. **Verifica:**
   - ✅ Responde con información específica del curso/página
   - ❌ NO dice "no entiendo" o pide más detalles

---

### ✅ Test 3: Verificar Markdown (1 minuto)

1. **En cualquier página**
2. **Pregunta:** "Explícame qué es la inteligencia artificial"
3. **Verifica en la respuesta:**
   - ❌ NO debe tener: **texto en negritas**
   - ❌ NO debe tener: *texto en cursivas*
   - ❌ NO debe tener: # Títulos
   - ❌ NO debe tener: `código entre backticks`
   - ✅ SÍ puede tener: MAYÚSCULAS para enfatizar
   - ✅ SÍ puede tener: guiones simples (-) para listas
   - ✅ SÍ puede tener: emojis 😊

---

### ✅ Test 4: Consola del Navegador (30 segundos)

1. **Abre:** Herramientas de desarrollador (F12)
2. **Ve a:** Consola
3. **Abre LIA** (click en el robot)
4. **Busca este log:**
   ```
   📄 Contenido de página extraído: {
     title: "...",
     headingsCount: X,
     mainTextLength: Y
   }
   ```
5. **Verifica:**
   - ✅ El log aparece
   - ✅ `title` tiene el título real de la página
   - ✅ `headingsCount` es mayor a 0
   - ✅ `mainTextLength` es mayor a 0

---

## 🐛 Si algo falla

### Problema: No aparece el robot flotante
- **Solución:** Refresca la página (F5)

### Problema: El chat no responde
- **Solución:** Verifica que `OPENAI_API_KEY` esté configurada en `.env`

### Problema: Sigue usando asteriscos en respuestas
- **Solución:** Es un comportamiento del modelo. El prompt ya lo prohíbe múltiples veces. Puedes:
  1. Hacer más énfasis en el prompt (ya está al máximo recomendado)
  2. Agregar post-procesamiento en el servidor para remover asteriscos automáticamente

### Problema: No extrae contenido de la página
- **Solución:** Verifica el log en consola. Si no aparece, aumenta el delay en `AIChatAgent.tsx`:
  ```typescript
  }, 1000); // Cambiar de 500 a 1000
  ```

---

## ✅ Checklist Final

Marca cuando completes cada test:

- [ ] Test 1: Pregunta "Aquí qué" funciona
- [ ] Test 2: Responde con contexto de la página
- [ ] Test 3: No usa markdown en respuestas
- [ ] Test 4: Log de consola muestra contenido extraído

Si todos están marcados: **¡Listo para usar!** ✅

---

## 💡 Ejemplos de Preguntas para Probar

Prueba estas preguntas en diferentes páginas:

- "Aquí qué"
- "De qué trata esto"
- "Qué hay aquí"
- "Ayúdame"
- "Explícame esto"
- "Para qué sirve"

Todas deberían obtener respuestas contextuales usando el contenido de la página actual.
