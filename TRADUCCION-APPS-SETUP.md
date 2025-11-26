# 🌐 Setup de Traducciones - Apps Directory

## ✅ Problema Resuelto

Las traducciones del directorio de apps IA ahora funcionan correctamente. Este documento explica los pasos para activarlas.

## 🔧 Correcciones Aplicadas

1. ✅ **Creada tabla de traducciones** (`app_directory_translations`)
2. ✅ **Corregidas consultas API** (eliminado prefijo `public.` incorrecto)
3. ✅ **Creados scripts de ejemplo** para insertar datos
4. ✅ **Documentación completa** del sistema de traducciones

## 🚀 Pasos para Activar las Traducciones

### Paso 1: Ejecutar la Migración en Supabase

1. Ve a tu dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (icono de base de datos en el menú izquierdo)
4. Haz click en **New Query**
5. Copia y pega el contenido completo del archivo:
   ```
   supabase/migrations/create_app_directory_translations.sql
   ```
6. Haz click en **Run** (o presiona Ctrl+Enter)
7. Deberías ver: ✅ **Success. No rows returned**

### Paso 2: Insertar Traducciones de Ejemplo

**Opción A - Usando el Script TypeScript (Recomendado):**

```bash
# En la raíz del proyecto
npm install -g ts-node  # Solo si no lo tienes instalado
ts-node scripts/seed-app-translations.ts
```

**Opción B - SQL Manual en Supabase:**

1. Primero obtén el ID de una app existente:
   ```sql
   SELECT app_id, name FROM public.ai_apps
   WHERE is_active = true
   LIMIT 1;
   ```

2. Copia el `app_id` de la primera app

3. Abre el archivo `supabase/migrations/insert_sample_translations.sql`

4. Reemplaza **TODAS** las ocurrencias de `'REEMPLAZAR-CON-APP-ID-REAL'` con el `app_id` que copiaste:
   ```sql
   'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID
   ```

5. Ejecuta el script completo en SQL Editor de Supabase

### Paso 3: Verificar que Funcionó

1. **Verifica que hay datos en la tabla:**
   ```sql
   SELECT * FROM public.app_directory_translations;
   ```
   Deberías ver 2 filas (una para 'en' y otra para 'pt')

2. **Verifica la estructura completa:**
   ```sql
   SELECT
     a.name as app_original,
     t.language,
     t.name as app_traducido,
     t.description
   FROM public.ai_apps a
   LEFT JOIN public.app_directory_translations t ON t.app_id = a.app_id
   WHERE a.is_active = true
   LIMIT 5;
   ```

### Paso 4: Probar en el Frontend

1. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Abre el navegador:**
   ```
   http://localhost:3000/apps-directory
   ```

3. **Cambia el idioma:**
   - Verás botones "Español" y "Português" en la esquina superior derecha
   - Haz click en "Português"
   - El contenido debería cambiar automáticamente

4. **Verifica en DevTools:**
   - Abre la consola (F12)
   - Deberías ver: `Traducción encontrada: {name: "...", ...}`

## 📋 Archivos Creados/Modificados

### Nuevos Archivos:
- ✅ `supabase/migrations/create_app_directory_translations.sql` - Migración de base de datos
- ✅ `supabase/migrations/insert_sample_translations.sql` - Datos de ejemplo
- ✅ `scripts/seed-app-translations.ts` - Script automatizado para insertar traducciones
- ✅ `docs/GUIA-TRADUCCIONES-APP-DIRECTORY.md` - Guía completa de traducciones
- ✅ `TRADUCCION-APPS-SETUP.md` - Este archivo

### Archivos Modificados:
- ✅ `apps/web/src/app/api/ai-directory/apps/route.ts` - Corregida consulta
- ✅ `apps/web/src/app/api/ai-directory/apps/[slug]/route.ts` - Corregida consulta
- ✅ `apps/web/src/features/ai-directory/hooks/useApps.ts` - Agregado soporte para `lang`
- ✅ `apps/web/src/app/apps-directory/page.tsx` - Limpieza de código duplicado
- ✅ `apps/web/src/app/apps-directory/[slug]/page.tsx` - Corrección de estructura JSX

## 🎯 Campos que se Traducen

| Campo | Descripción | Ejemplo EN | Ejemplo PT |
|-------|-------------|------------|------------|
| `name` | Nombre de la app | "AI Content Generator" | "Gerador de Conteúdo IA" |
| `description` | Descripción corta | "Create amazing content..." | "Crie conteúdo incrível..." |
| `long_description` | Descripción larga | Full paragraph in English | Parágrafo completo em português |
| `features` | Array de características | ["Advanced GPT-4", ...] | ["GPT-4 Avançado", ...] |
| `use_cases` | Array de casos de uso | ["Blog posts", ...] | ["Posts de blog", ...] |
| `advantages` | Array de ventajas | ["Fast processing", ...] | ["Processamento rápido", ...] |
| `disadvantages` | Array de desventajas | ["Requires internet", ...] | ["Requer internet", ...] |

## 🐛 Troubleshooting

### ❌ Error: "relation app_directory_translations does not exist"
**Solución:** Ejecuta la migración del Paso 1

### ❌ No se ven las traducciones en el frontend
**Solución:**
1. Verifica que hay datos: `SELECT * FROM app_directory_translations;`
2. Verifica la consola del navegador (F12)
3. Asegúrate de haber reiniciado el servidor: `npm run dev`

### ❌ Error: "permission denied"
**Solución:** Las políticas RLS deberían haberse creado automáticamente. Verifica:
```sql
SELECT * FROM pg_policies
WHERE tablename = 'app_directory_translations';
```

### ❌ Las traducciones aparecen en blanco
**Solución:** Verifica que el `app_id` en las traducciones coincide con el de `ai_apps`:
```sql
SELECT
  t.*,
  a.name as app_name
FROM app_directory_translations t
JOIN ai_apps a ON a.app_id = t.app_id;
```

## 📚 Recursos Adicionales

- **Guía completa:** Ver `docs/GUIA-TRADUCCIONES-APP-DIRECTORY.md`
- **Documentación general i18n:** Ver `docs/INTERNACIONALIZACION-BASE-DATOS.md`
- **Estructura de base de datos:** Ver `lib/supabase/types.ts`

## ✨ Próximos Pasos

Una vez que las traducciones funcionen correctamente:

1. **Traduce todas tus apps:**
   - Ve a Supabase SQL Editor
   - Usa el template de `insert_sample_translations.sql`
   - Crea traducciones para cada app activa

2. **Automatiza con IA (opcional):**
   - Puedes usar OpenAI para traducir automáticamente
   - Ver sección de traducción automática en `docs/INTERNACIONALIZACION-BASE-DATOS.md`

3. **Crea un panel de administración:**
   - Formularios multiidioma para editar traducciones
   - Ver ejemplos en la documentación principal

## 🎉 ¡Listo!

Si seguiste todos los pasos, ahora deberías tener:
- ✅ Tabla de traducciones creada
- ✅ Datos de ejemplo insertados
- ✅ Frontend funcionando con cambio de idioma
- ✅ Sistema listo para agregar más traducciones

**¿Preguntas?** Revisa `docs/GUIA-TRADUCCIONES-APP-DIRECTORY.md` para más detalles.
