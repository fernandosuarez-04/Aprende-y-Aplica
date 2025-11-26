# 🔍 DEBUG: Traducciones no se muestran

## Pasos de Debugging

### 1️⃣ Verifica que tienes datos en la tabla

Ejecuta esto en **Supabase SQL Editor**:

```sql
-- Verificar que la tabla existe
SELECT COUNT(*) as total_traducciones
FROM app_directory_translations;

-- Ver todas las traducciones
SELECT
  t.language,
  t.name,
  t.description,
  a.name as nombre_original
FROM app_directory_translations t
JOIN ai_apps a ON a.app_id = t.app_id
ORDER BY t.language;
```

**Resultado esperado:** Deberías ver filas con traducciones en `en` y `pt`

---

### 2️⃣ Verifica que los app_id coinciden

```sql
-- Verificar que los app_id de traducciones coinciden con apps activas
SELECT
  a.app_id,
  a.name as app_nombre,
  a.is_active,
  COUNT(t.translation_id) as num_traducciones,
  STRING_AGG(t.language, ', ') as idiomas_disponibles
FROM ai_apps a
LEFT JOIN app_directory_translations t ON t.app_id = a.app_id
WHERE a.is_active = true
GROUP BY a.app_id, a.name, a.is_active
ORDER BY a.name;
```

**Resultado esperado:** Apps activas deberían tener 2 traducciones (en, pt)

---

### 3️⃣ Reinicia el servidor de desarrollo

```bash
# Detén el servidor (Ctrl+C)
# Reinicia con:
npm run dev
```

---

### 4️⃣ Abre el navegador con DevTools

1. **Abre:** `http://localhost:3000/apps-directory`
2. **Abre DevTools:** Presiona `F12`
3. **Ve a la pestaña Console**
4. **Limpia la consola:** Click en el icono 🚫

---

### 5️⃣ Cambia el idioma y observa los logs

1. **Click en el botón "Português"**
2. **Observa los logs en la consola del navegador:**

```
Deberías ver:
🚀 [useApps] Fetching apps con idioma: pt | URL: /api/ai-directory/apps?lang=pt
```

3. **Observa los logs en la terminal del servidor:**

```
Deberías ver:
🌐 [API] Idioma recibido: pt
📦 [API] Apps encontradas: X
🔍 [API] Buscando traducciones para: X apps
✨ [API] Traducciones encontradas: Y
📝 [API] Aplicando traducciones...
  ✅ Traduciendo "Nombre Original" → "Nome Traduzido"
✅ [API] Traducciones aplicadas correctamente
```

---

### 6️⃣ Verifica los datos recibidos

En la **consola del navegador**, deberías ver:

```
📦 [useApps] Apps recibidas: X
📝 [useApps] Primera app: { name: "Nome em Português", description: "..." }
```

---

## ❌ Problemas Comunes

### Problema 1: No aparecen logs en la terminal
**Causa:** El servidor no se reinició
**Solución:**
```bash
# Detén con Ctrl+C y reinicia
npm run dev
```

### Problema 2: Los logs muestran `lang: undefined`
**Causa:** El parámetro lang no se está pasando desde el componente
**Solución:** Verifica que en `page.tsx` el estado `lang` se esté pasando al hook:
```typescript
const { apps } = useApps({
  search: searchQuery,
  featured: showFeatured,
  sortBy,
  sortOrder,
  lang  // ← Debe estar aquí
});
```

### Problema 3: Logs muestran "Traducciones encontradas: 0"
**Causa:** Los app_id no coinciden
**Solución:** Ejecuta esta query para verificar:
```sql
SELECT
  a.app_id as app_id_tabla_apps,
  t.app_id as app_id_tabla_traducciones,
  a.app_id = t.app_id as coinciden
FROM ai_apps a
LEFT JOIN app_directory_translations t ON t.app_id = a.app_id
WHERE a.is_active = true;
```

### Problema 4: Logs muestran "Error buscando traducciones: ..."
**Causa:** Error en la consulta a Supabase
**Solución:**
1. Verifica las variables de entorno:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
2. Verifica que las políticas RLS permiten lectura pública:
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'app_directory_translations';
   ```

### Problema 5: Los logs muestran traducciones encontradas pero no se aplican
**Causa:** Problema en el mapeo o los campos están null
**Solución:** Verifica los datos con:
```sql
SELECT
  app_id,
  language,
  name IS NOT NULL as tiene_nombre,
  description IS NOT NULL as tiene_descripcion,
  long_description IS NOT NULL as tiene_descripcion_larga
FROM app_directory_translations
WHERE language = 'pt';
```

---

## ✅ Checklist de Verificación

Marca cada item cuando lo verifiques:

- [ ] La tabla `app_directory_translations` existe
- [ ] Hay traducciones en la tabla (COUNT > 0)
- [ ] Los app_id coinciden entre `ai_apps` y `app_directory_translations`
- [ ] El servidor está corriendo (`npm run dev`)
- [ ] DevTools está abierto en la pestaña Console
- [ ] Al cambiar idioma, aparecen logs en la consola del navegador
- [ ] Al cambiar idioma, aparecen logs en la terminal del servidor
- [ ] Los logs muestran "Traducciones encontradas: X" donde X > 0
- [ ] Los logs muestran "Traduciendo [nombre]"
- [ ] El navegador muestra los nombres traducidos

---

## 🆘 Si nada funciona

Ejecuta este query completo y envíame el resultado:

```sql
-- Query de diagnóstico completo
WITH apps_activas AS (
  SELECT app_id, name, is_active
  FROM ai_apps
  WHERE is_active = true
  LIMIT 5
),
traducciones AS (
  SELECT
    t.*
  FROM app_directory_translations t
  WHERE t.app_id IN (SELECT app_id FROM apps_activas)
)
SELECT
  a.app_id,
  a.name as nombre_original,
  a.is_active,
  (SELECT COUNT(*) FROM traducciones WHERE app_id = a.app_id) as num_traducciones,
  (SELECT name FROM traducciones WHERE app_id = a.app_id AND language = 'en') as nombre_ingles,
  (SELECT name FROM traducciones WHERE app_id = a.app_id AND language = 'pt') as nombre_portugues
FROM apps_activas a
ORDER BY a.name;
```

También envíame:
1. Screenshot de los logs en la consola del navegador
2. Screenshot de los logs en la terminal del servidor
3. El resultado del query de diagnóstico arriba
