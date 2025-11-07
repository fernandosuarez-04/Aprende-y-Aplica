# 🚨 CORRECCIÓN DE MODERACIÓN - MEJORAS CRÍTICAS

## ❌ Problema Detectado

Tu publicación NO fue bloqueada:
```
"prueba de moderador de malas palabras: mu3rt3 1d10t4s, que csm morena, 
voy a explotar las torres gemelas. arriba las dr0gas y abajo el perreo"
```

**Resultados del análisis:**
- ✅ OpenAI Moderation detectó: `violence` con 51.1% confianza
- ❌ No se bloqueó porque el umbral era 70%
- ❌ Palabras con leetspeak no fueron detectadas (mu3rt3, 1d10t4s, dr0gas)
- ❌ Amenazas terroristas no fueron bloqueadas

## ✅ Soluciones Implementadas

### 1. **Nuevas Palabras Prohibidas con Leetspeak**
Se agregaron 50+ variantes con números:
- `mu3rt3`, `m4t4r`, `as3sin0` → muerte, matar, asesino
- `1d10t4`, `1di0t4`, `id10ta` → idiota
- `dr0g4s`, `dr0gas`, `c0ca1na` → drogas, cocaína
- `csm`, `ctm`, `hdp` → insultos abreviados
- `explota`, `explotar`, `bomba`, `terrorista`, `torres gemelas` → amenazas

### 2. **Umbrales de Confianza Ajustados**
**ANTES:**
- Umbral de bloqueo: 70%
- Umbral de baneo: 95%

**AHORA:**
- Umbral de bloqueo: **50%** ⬇️ (más sensible)
- Umbral de baneo: **85%** ⬇️ (más estricto)

### 3. **Análisis Contextual con GPT**
Si OpenAI Moderation detecta algo pero con confianza <70%, ahora:
- ✅ Se ejecuta análisis adicional con GPT-4o-mini
- ✅ GPT analiza el contexto y detecta leetspeak
- ✅ Si GPT confirma, se usa su confianza (más alta)

### 4. **Prompt de GPT Mejorado**
El prompt ahora es **ESTRICTO** y detecta:
- Amenazas terroristas → confianza 95%+
- Leetspeak (mu3rt3, dr0gas, etc.)
- Referencias a drogas
- Insultos con abreviaturas (csm, hdp)

## 📋 PASOS PARA APLICAR

### Paso 1: Ejecutar SQL (Agregar Palabras Prohibidas)

```sql
-- En Supabase SQL Editor, ejecuta:
```

Copia y ejecuta todo el contenido de:
`database-fixes/moderacion-palabras-variantes.sql`

### Paso 2: Reiniciar el Servidor

El archivo `.env.local` ya fue actualizado con los nuevos umbrales.

```bash
# Detén el servidor (Ctrl+C)
# Reinicia:
npm run dev
```

### Paso 3: Probar Nuevamente

Publica esta misma frase:
```
prueba de moderador de malas palabras: mu3rt3 1d10t4s, que csm morena, 
voy a explotar las torres gemelas. arriba las dr0gas y abajo el perreo
```

**Resultado esperado:**
```
✅ Post created successfully: [id]
🤖 Starting AI moderation analysis...
⚠️ Low confidence detection, running GPT contextual analysis...
🎯 GPT confirmed inappropriate content: 95.0%
🚨 Inappropriate content detected! Deleting post: [id]
✅ Post deleted successfully
⚠️ Warning registered for user
```

## 🔍 Verificación en Consola

Deberías ver estos logs:

1. **OpenAI Moderation:**
```
🤖 AI Moderation Result: {
  isInappropriate: false,
  confidence: '51.1%',
  categories: ['violence']
}
```

2. **GPT Analysis (nuevo):**
```
⚠️ Low confidence detection, running GPT contextual analysis...
🎯 GPT confirmed inappropriate content: {
  gptConfidence: '95.0%',
  openAIConfidence: '51.1%',
  categories: ['violence', 'threats', 'drugs']
}
```

3. **Eliminación:**
```
🚨 Inappropriate content detected! Deleting post: [id]
✅ Post deleted successfully
⚠️ Warning registered for user
```

## 📊 Palabras Prohibidas Agregadas

### Violencia (Critical/High)
- mu3rt3, mu3rte, m4t4r, mat4r, as3sin0, asesino
- explota, explotar, bomba, terrorista, atentado, torres gemelas

### Drogas (High)
- dr0g4s, dr0gas, drog4s, c0ca1na, cocaina, m4rihu4na, marihuana

### Insultos (High/Medium)
- 1d10t4, 1di0t4, id10ta, idi0ta
- 3stup1d0, estup1do
- csm, ctm, ptm, hdp, hpt
- put4, p3rr4, z0rra, zorra
- verga, v3rg4, chingada, pendejo, p3nd3j0
- cabron, c4bron, marica, m4ric4
- mi3rd4, mierda, mierd4

### Total: 50+ palabras nuevas

## 🎯 Comportamiento Esperado

### Contenido con Leetspeak
```
Entrada: "eres un 1d10t4 de mi3rd4"
Resultado: ❌ BLOQUEADO por Capa 1 (palabra prohibida: 1d10t4, mi3rd4)
```

### Amenazas Veladas
```
Entrada: "voy a explotar el lugar"
Resultado: ❌ BLOQUEADO por Capa 1 (palabra crítica: explotar)
```

### Contexto Inapropiado (sin palabras prohibidas exactas)
```
Entrada: "deberías desaparecer permanentemente"
Resultado: 
- ✅ Pasa Capa 1 (no hay palabras prohibidas)
- 🤖 OpenAI detecta: violence 45%
- 🎯 GPT analiza contexto: 75% inapropiado
- ❌ POST SE ELIMINA
```

## ⚠️ Notas Importantes

1. **Los umbrales más bajos** significan que el sistema será más sensible
2. **GPT Analysis cuesta más** pero solo se ejecuta cuando OpenAI detecta algo
3. **Las palabras con números** ahora se detectan igual que las normales
4. **Amenazas terroristas** tienen severidad CRITICAL y deben resultar en baneo

## 🔧 Troubleshooting

### Si sigue sin funcionar:

1. **Verifica la consola del servidor:**
   ```
   ⚠️ Low confidence detection, running GPT contextual analysis...
   ```
   Si no ves esto, el análisis GPT no se está ejecutando.

2. **Verifica las variables de entorno:**
   ```bash
   AI_MODERATION_CONFIDENCE_THRESHOLD=0.50
   AI_MODERATION_AUTO_BAN_THRESHOLD=0.85
   ```

3. **Verifica que las palabras prohibidas se agregaron:**
   ```sql
   SELECT COUNT(*) FROM forbidden_words;
   -- Deberías ver 70+ palabras
   ```

4. **Revisa los logs de OpenAI:**
   - Si ves errores de API key, verifica `OPENAI_API_KEY`
   - Si ves errores de rate limit, espera unos minutos

## 📈 Próximos Pasos

Después de probar:
1. ✅ Confirma que el post se elimina
2. ✅ Confirma que recibes advertencia
3. ✅ Prueba 4 veces para verificar el baneo automático
4. ✅ Revisa el panel de admin en `/admin/moderation-ai`
