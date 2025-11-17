# 🔍 Debugging LIA en Netlify - Problema de Respuesta Genérica

## 📊 Problema Identificado

LIA responde siempre con el mismo mensaje genérico en Netlify:
```
Hola! 😊 Estoy aquí para ayudarte. ¿En qué te puedo asistir?
```

Mientras que en localhost funciona perfectamente con respuestas contextuales.

## 🎯 Causa Probable

El problema más probable es que **OpenAI API Key NO está configurada en Netlify** o está mal configurada, causando que la aplicación use el fallback genérico.

## ✅ Solución - Pasos a Seguir

### 1. Verificar Variables de Entorno en Netlify

1. Ve a tu dashboard de Netlify
2. Selecciona tu sitio (Aprende-y-Aplica)
3. Ve a **Site settings** → **Environment variables**
4. Verifica que exista la variable `OPENAI_API_KEY`

### 2. Configurar OPENAI_API_KEY

Si no existe o está mal configurada:

1. En Netlify, ve a **Site settings** → **Environment variables**
2. Click en **Add a variable**
3. Agrega las siguientes variables:

```
Variable name: OPENAI_API_KEY
Value: [Tu API Key de OpenAI que comienza con sk-...]
Scopes: All scopes (Production, Deploy previews, Branch deploys)
```

**IMPORTANTE**: La API Key debe ser la misma que usas en localhost y que funciona correctamente.

### 3. Variables Adicionales Recomendadas

Asegúrate de tener también estas variables configuradas en Netlify:

```
CHATBOT_MODEL=gpt-4o-mini
CHATBOT_TEMPERATURE=0.6
CHATBOT_MAX_TOKENS=500
NODE_ENV=production
```

### 4. Hacer Redeploy

Después de agregar/actualizar las variables de entorno:

1. Ve a **Deploys** en Netlify
2. Click en **Trigger deploy** → **Deploy site**
3. Espera a que termine el deploy
4. Prueba LIA nuevamente

## 🔍 Verificar si el Problema Está Resuelto

### Logs en la Consola del Navegador

Ahora LIA tiene logs mejorados. Cuando uses LIA en Netlify, abre la consola del navegador (F12) y busca estos logs:

**Si OpenAI funciona correctamente:**
```
🔥 Llamando a OpenAI
✅ OpenAI respondió exitosamente
```

**Si OpenAI falla (sin API key):**
```
⚠️ No hay OPENAI_API_KEY configurada, usando fallback
```

**Si OpenAI falla (con error):**
```
❌ Error con OpenAI, usando fallback:
OpenAI error details: { errorMessage: "...", hasApiKey: true/false, ... }
```

### Logs en Netlify Functions

También puedes ver los logs en tiempo real:

1. En Netlify, ve a **Functions**
2. Click en tu función de API
3. Ve a **Function logs** 
4. Envía un mensaje a LIA
5. Busca los logs que comienzan con 🔥, ✅ o ❌

## 🛠️ Troubleshooting Adicional

### Si la API Key está configurada pero sigue fallando:

1. **Verifica la validez de la API Key:**
   - Ve a [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Verifica que la key no haya expirado
   - Verifica que tengas créditos disponibles

2. **Verifica los límites de rate:**
   - OpenAI tiene límites de requests por minuto
   - Si tienes cuenta gratuita, los límites son más bajos

3. **Revisa los logs de error completos:**
   - Los logs mostrarán el mensaje de error específico
   - Común: "You exceeded your current quota" (sin créditos)
   - Común: "Invalid API key" (key incorrecta)

### Si nada funciona:

1. **Regenera la API Key en OpenAI:**
   - Ve a [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Crea una nueva API key
   - Actualiza `OPENAI_API_KEY` en Netlify con la nueva key
   - Haz redeploy

2. **Verifica el modelo:**
   - Asegúrate de que tu cuenta de OpenAI tiene acceso a `gpt-4o-mini`
   - Si no, cambia `CHATBOT_MODEL` a `gpt-3.5-turbo`

## 📝 Cambios Realizados en el Código

### 1. Error de Compilación Arreglado (Línea 1085)

**Antes:**
```typescript
const baseUrl = allowed[0] || process.env.PUBLIC_APP_URL || request.nextUrl.origin;
```

**Después:**
```typescript
const baseUrl = allowed[0] || process.env.PUBLIC_APP_URL || 'https://www.ecosdeliderazgo.com';
```

**Razón:** `request` no existe en el scope de `callOpenAI`, causaba error de compilación.

### 2. Logs Mejorados para Debugging

Se agregaron logs extensivos en el código para diagnosticar problemas:

```typescript
// Cuando OpenAI funciona:
logger.info('🔥 Llamando a OpenAI', { message: message.substring(0, 50), hasKey: !!openaiApiKey });
logger.info('✅ OpenAI respondió exitosamente', { responseLength: response.length, responseTime });

// Cuando OpenAI falla:
logger.error('❌ Error con OpenAI, usando fallback:', error);
logger.error('OpenAI error details:', { 
  errorMessage: error instanceof Error ? error.message : String(error),
  hasApiKey: !!openaiApiKey,
  apiKeyPrefix: openaiApiKey ? openaiApiKey.substring(0, 10) + '...' : 'none'
});

// Cuando no hay API key:
logger.warn('⚠️ No hay OPENAI_API_KEY configurada, usando fallback');
```

## 🎯 Próximos Pasos

1. ✅ Configura `OPENAI_API_KEY` en Netlify
2. ✅ Haz redeploy
3. ✅ Verifica los logs en la consola
4. ✅ Prueba LIA con diferentes preguntas
5. 📧 Si el problema persiste, comparte los logs de error específicos

## 📞 Información de Contacto

Si necesitas ayuda adicional, proporciona:
- Screenshots de las variables de entorno en Netlify (oculta la API key completa)
- Logs de la consola del navegador cuando usas LIA
- Logs de Netlify Functions
- Mensaje de error específico si aparece

---

**Estado actual:** ✅ Código arreglado y logs agregados. Esperando configuración de variables de entorno en Netlify.
