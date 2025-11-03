# Políticas Públicas para el Bucket "courses" en Supabase

Este documento contiene las instrucciones para crear las políticas públicas necesarias para el bucket `courses` en Supabase Storage.

## 📋 Requisitos

- Acceso al panel de administración de Supabase
- El bucket `courses` debe estar creado y marcado como **Public**

## 🔐 Políticas a Crear

Como no estás utilizando autenticación de Supabase, necesitas crear políticas públicas que permitan:
1. **SELECT (Lectura)**: Permitir que cualquier usuario lea los archivos
2. **INSERT (Escritura)**: Permitir que cualquier usuario suba archivos
3. **UPDATE (Actualización)**: Permitir que cualquier usuario actualice archivos
4. **DELETE (Eliminación)**: Permitir que cualquier usuario elimine archivos

## 🚀 Pasos para Crear las Políticas

### Paso 1: Acceder a Storage Policies

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Storage** en el menú lateral
3. Haz clic en el bucket **`courses`**
4. Ve a la pestaña **Policies**

### Paso 2: Crear Política para SELECT (Lectura Pública)

1. Haz clic en **"New policy"**
2. Configura la política con estos valores:

**Policy Name:**
```
Public read access for courses
```

**Allowed Operation:**
```
SELECT
```

**Policy Definition (SQL):**
```sql
true
```

**Target Roles:**
```
public
```

**Check Expression:**
```
true
```

3. Haz clic en **"Review"** y luego en **"Save policy"**

### Paso 3: Crear Política para INSERT (Escritura Pública)

1. Haz clic en **"New policy"**
2. Configura la política con estos valores:

**Policy Name:**
```
Public insert access for courses
```

**Allowed Operation:**
```
INSERT
```

**Policy Definition (SQL):**
```sql
true
```

**Target Roles:**
```
public
```

**Check Expression:**
```
true
```

3. Haz clic en **"Review"** y luego en **"Save policy"**

### Paso 4: Crear Política para UPDATE (Actualización Pública)

1. Haz clic en **"New policy"**
2. Configura la política con estos valores:

**Policy Name:**
```
Public update access for courses
```

**Allowed Operation:**
```
UPDATE
```

**Policy Definition (SQL):**
```sql
true
```

**Target Roles:**
```
public
```

**Check Expression:**
```
true
```

3. Haz clic en **"Review"** y luego en **"Save policy"**

### Paso 5: Crear Política para DELETE (Eliminación Pública)

1. Haz clic en **"New policy"**
2. Configura la política con estos valores:

**Policy Name:**
```
Public delete access for courses
```

**Allowed Operation:**
```
DELETE
```

**Policy Definition (SQL):**
```sql
true
```

**Target Roles:**
```
public
```

**Check Expression:**
```
true
```

3. Haz clic en **"Review"** y luego en **"Save policy"**

## 🔍 Verificación

Después de crear las políticas, deberías ver 4 políticas en la lista:

1. ✅ Public read access for courses (SELECT)
2. ✅ Public insert access for courses (INSERT)
3. ✅ Public update access for courses (UPDATE)
4. ✅ Public delete access for courses (DELETE)

## ⚠️ Nota de Seguridad

**IMPORTANTE**: Estas políticas permiten acceso completo y público al bucket `courses`. Cualquier persona con la URL puede leer, subir, modificar o eliminar archivos.

Si en el futuro implementas autenticación, deberás:
1. Eliminar estas políticas públicas
2. Crear políticas más restrictivas basadas en roles de usuario
3. Usar RLS (Row Level Security) para controlar el acceso

## 📝 Alternativa: Crear Políticas Usando SQL

Si prefieres crear las políticas directamente usando SQL, puedes ejecutar estos comandos en el **SQL Editor** de Supabase:

```sql
-- Política de lectura pública
CREATE POLICY "Public read access for courses"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'courses');

-- Política de escritura pública
CREATE POLICY "Public insert access for courses"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'courses');

-- Política de actualización pública
CREATE POLICY "Public update access for courses"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'courses')
WITH CHECK (bucket_id = 'courses');

-- Política de eliminación pública
CREATE POLICY "Public delete access for courses"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'courses');
```

## ✅ Verificación Final

Para verificar que las políticas funcionan correctamente:

1. Intenta subir un video desde el formulario de creación de taller
2. Verifica que el archivo aparece en el bucket `courses`
3. Verifica que puedes acceder a la URL pública del archivo

Si encuentras algún error, revisa:
- Que el bucket esté marcado como **Public**
- Que las 4 políticas estén creadas correctamente
- Que las políticas estén habilitadas (no deshabilitadas)

---

**Última actualización**: Diciembre 2024

