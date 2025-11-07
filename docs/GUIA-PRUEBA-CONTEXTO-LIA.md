# 🧪 Guía de Prueba - Detección Automática de Contexto en LIA

## 🎯 Objetivo de la Prueba

Verificar que el chatbot LIA detecta correctamente el área del sitio donde está el usuario y ofrece respuestas contextuales relevantes.

## 📋 Pre-requisitos

- Tener el proyecto corriendo localmente o en entorno de desarrollo
- Acceso a la consola del navegador (F12)
- Cuenta de usuario activa (opcional, pero recomendado)

## 🔍 Pasos para Probar

### 1. Prueba Básica de Detección

#### Paso 1.1: Navegar a Comunidades
```
1. Abrir: http://localhost:3000/communities
2. Abrir consola del navegador (F12)
3. Buscar el log: "🌐 Contexto detectado automáticamente"
4. Verificar:
   ✓ detectedContext: "communities"
   ✓ pathname: "/communities"
   ✓ pageContextInfo: "página de comunidades..."
```

#### Paso 1.2: Navegar a Cursos
```
1. Abrir: http://localhost:3000/courses
2. Verificar en consola:
   ✓ detectedContext: "courses"
   ✓ pathname: "/courses"
```

#### Paso 1.3: Navegar a Noticias
```
1. Abrir: http://localhost:3000/news
2. Verificar en consola:
   ✓ detectedContext: "news"
   ✓ pathname: "/news"
```

### 2. Prueba de Respuestas Contextuales

#### Prueba 2.1: En Comunidades
```
1. Ir a: /communities
2. Abrir el chatbot LIA (botón flotante en esquina inferior derecha)
3. Escribir: "¿Qué puedo hacer aquí?"
4. Esperar respuesta
5. Verificar que la respuesta menciona:
   ✓ Comunidades
   ✓ Unirse a grupos
   ✓ Participar en discusiones
   ✓ Conectar con miembros
```

#### Prueba 2.2: En Cursos
```
1. Ir a: /courses
2. Abrir el chatbot LIA
3. Escribir: "¿Cómo funciona esto?"
4. Verificar que la respuesta menciona:
   ✓ Cursos disponibles
   ✓ Inscripciones
   ✓ Aprendizaje
   ✓ Progreso
```

#### Prueba 2.3: En Noticias
```
1. Ir a: /news
2. Abrir el chatbot LIA
3. Escribir: "¿Qué hay de nuevo?"
4. Verificar que la respuesta menciona:
   ✓ Últimas noticias
   ✓ Actualizaciones
   ✓ Tendencias
   ✓ Eventos
```

#### Prueba 2.4: En Dashboard
```
1. Ir a: /dashboard (requiere login)
2. Abrir el chatbot LIA
3. Escribir: "Ayúdame con mi panel"
4. Verificar que la respuesta menciona:
   ✓ Panel de usuario
   ✓ Progreso personal
   ✓ Actividades recientes
   ✓ Navegación del dashboard
```

### 3. Prueba de Contextos Específicos

#### Prueba 3.1: Directorio de Prompts
```
1. Ir a: /prompt-directory
2. Abrir LIA
3. Preguntar: "¿Cómo crear un prompt?"
4. Verificar respuesta específica sobre prompts de IA
```

#### Prueba 3.2: Perfil de Usuario
```
1. Ir a: /profile
2. Abrir LIA
3. Preguntar: "¿Cómo cambio mi perfil?"
4. Verificar respuesta sobre configuración de perfil
```

### 4. Prueba de Navegación Múltiple

```
1. Abrir /communities → Preguntar algo → Ver respuesta
2. Navegar a /courses (sin cerrar LIA)
3. Preguntar lo mismo
4. Verificar que la respuesta cambia según el nuevo contexto
5. Revisar consola: debe mostrar nuevo contexto detectado
```

## 📊 Checklist de Validación

### Detección Automática
- [ ] Detecta correctamente `/communities`
- [ ] Detecta correctamente `/courses`
- [ ] Detecta correctamente `/workshops`
- [ ] Detecta correctamente `/news`
- [ ] Detecta correctamente `/dashboard`
- [ ] Detecta correctamente `/prompt-directory`
- [ ] Detecta correctamente `/profile`
- [ ] Página sin contexto específico → "general"

### Respuestas Contextuales
- [ ] Respuestas mencionan el área actual
- [ ] Contenido es relevante a la sección
- [ ] No hay información genérica cuando hay contexto específico
- [ ] Tono y estilo apropiados para cada área

### Logs y Debugging
- [ ] Log "🌐 Contexto detectado" aparece
- [ ] Pathname es correcto
- [ ] detectedContext coincide con la URL
- [ ] activeContext se usa correctamente
- [ ] pageContextInfo tiene descripción correcta

### Integración
- [ ] Chatbot se abre correctamente
- [ ] Mensajes se envían sin errores
- [ ] Respuestas llegan correctamente
- [ ] Historial de conversación funciona
- [ ] No hay errores en consola

## 🐛 Problemas Comunes y Soluciones

### Problema 1: No aparece el log de contexto
**Solución**: Verificar que la consola esté abierta y que los logs no estén filtrados

### Problema 2: Contexto siempre es "general"
**Solución**: 
- Verificar la URL actual
- Revisar que `usePathname()` esté funcionando
- Verificar que la ruta coincida con los patrones en `detectContextFromURL()`

### Problema 3: Respuestas no son contextuales
**Solución**:
- Verificar en Network tab que `pageContext` se envía al API
- Revisar logs del servidor para ver si recibe el contexto
- Verificar que `getContextPrompt()` usa el `pageContext`

### Problema 4: Error al enviar mensaje
**Solución**:
- Verificar conexión a internet
- Revisar que el API `/api/ai-chat` esté funcionando
- Verificar variables de entorno (OPENAI_API_KEY)

## 📸 Ejemplos de Respuestas Esperadas

### En /communities
```
Usuario: "¿Qué puedo hacer aquí?"
LIA: "¡Hola! 😊 Veo que estás en la sección de Comunidades. 
Aquí puedes:
- Explorar comunidades disponibles según tus intereses
- Unirte a grupos de discusión
- Participar en conversaciones con otros miembros
- Compartir conocimientos y experiencias
..."
```

### En /courses
```
Usuario: "¿Cómo funciona esto?"
LIA: "¡Hola! 📚 Estás en la página de cursos. Aquí puedes:
- Ver el catálogo completo de cursos disponibles
- Inscribirte en los cursos que te interesen
- Ver información detallada de cada curso
- Revisar el temario y objetivos de aprendizaje
..."
```

### En /dashboard
```
Usuario: "Ayúdame con mi panel"
LIA: "¡Hola! 👋 Estás en tu panel principal. Te puedo ayudar con:
- Navegar entre tus cursos activos
- Ver tu progreso de aprendizaje
- Acceder a tus comunidades
- Revisar tus actividades recientes
..."
```

## ✅ Criterios de Aceptación

La funcionalidad está correctamente implementada si:

1. ✅ El chatbot detecta automáticamente la URL actual
2. ✅ El contexto cambia al navegar entre páginas
3. ✅ Las respuestas son específicas a cada sección
4. ✅ No hay errores en consola
5. ✅ La experiencia es fluida y natural
6. ✅ Los logs muestran información correcta

## 📞 Reportar Problemas

Si encuentras algún problema durante las pruebas:

1. Captura de pantalla de la consola
2. URL donde ocurrió el problema
3. Mensaje enviado y respuesta recibida
4. Logs de error completos
5. Pasos para reproducir

---

**Tiempo estimado de prueba**: 15-20 minutos  
**Nivel de complejidad**: Bajo - Medio  
**Requiere conocimientos técnicos**: Mínimos
