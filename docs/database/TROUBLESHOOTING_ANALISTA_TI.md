# Troubleshooting: Analista TI Recibiendo Preguntas de CEO

## 🔍 Problema Reportado

Usuario con rol "Analista TI" está recibiendo preguntas de CEO en lugar de las preguntas específicas del rol 7 (Analista/Especialista TI).

---

## 📊 Información del Rol

### Datos Correctos del Rol:
- **ID en tabla `roles`**: 7
- **Nombre**: Analista/Especialista TI
- **Area ID**: 9 (Tecnología)
- **Exclusivo Rol ID**: 7
- **Preguntas asignadas**: 237-248 (12 preguntas)

---

## ✅ Solución Implementada

### Alias Agregados al Código:

Se agregaron múltiples variantes del nombre del rol para asegurar que el mapeo funcione:

```typescript
'Analista/Especialista TI': 7,  // Nombre completo
'Analista TI': 7,               // Variante sin "Especialista"
'Especialista TI': 7,           // Variante sin "Analista"
'Analista de TI': 7,            // Variante con "de"
'Analista': 7,                  // Alias corto
'Especialista': 7,              // Alias corto
```

---

## 🔍 Pasos para Diagnosticar el Problema

### 1. Verificar el `type_rol` en la Base de Datos

Ejecuta esta query en Supabase:

```sql
-- Verificar el type_rol exacto del usuario
SELECT 
    id,
    email,
    type_rol,
    LENGTH(type_rol) as longitud,
    ASCII(SUBSTRING(type_rol, 1, 1)) as primer_caracter
FROM users 
WHERE email = 'TU_EMAIL_AQUI';
```

**Posibles problemas:**
- ✅ Espacios al inicio o final: `" Analista TI "`
- ✅ Mayúsculas/minúsculas incorrectas: `"analista ti"` o `"ANALISTA TI"`
- ✅ Caracteres especiales: `"Analista\nTI"`
- ✅ Nombre diferente: `"Analista IT"` o `"Analista Sistemas"`

### 2. Verificar las Preguntas en la Base de Datos

```sql
-- Verificar que existen preguntas para el rol 7
SELECT 
    COUNT(*) as total_preguntas,
    MIN(id) as primera,
    MAX(id) as ultima
FROM preguntas 
WHERE exclusivo_rol_id = 7 AND section = 'Cuestionario';
-- Esperado: 12 preguntas (237-248)

-- Ver las preguntas específicas
SELECT id, codigo, bloque, texto 
FROM preguntas 
WHERE exclusivo_rol_id = 7 AND section = 'Cuestionario'
ORDER BY id;
```

### 3. Verificar el Mapeo en el Frontend

Abre la consola del navegador (F12) y busca estos logs:

```
=== MAPEO DEBUG ===
Type_rol recibido: [EL VALOR EXACTO]
Mapeo encontrado: [DEBERÍA SER 7]
==================
```

Si `Mapeo encontrado` es `1` (CEO) o `undefined`, significa que el `type_rol` no coincide con ninguna entrada del mapeo.

### 4. Verificar la Query de Preguntas

En la consola del navegador, busca:

```
Usuario autenticado: [USER_ID]
Perfil de usuario encontrado: { type_rol: "...", exclusivo_rol_id: ... }
Preguntas específicas encontradas: [CANTIDAD]
```

---

## 🛠️ Soluciones Según el Problema

### Problema 1: `type_rol` tiene espacios extra

**Solución temporal** (actualizar en la base de datos):
```sql
UPDATE users 
SET type_rol = TRIM(type_rol)
WHERE id = 'USER_ID_AQUI';
```

### Problema 2: `type_rol` tiene mayúsculas/minúsculas incorrectas

**Solución temporal** (actualizar en la base de datos):
```sql
UPDATE users 
SET type_rol = 'Analista TI'
WHERE id = 'USER_ID_AQUI';
```

### Problema 3: `type_rol` es diferente al esperado

**Opción A** - Actualizar el usuario:
```sql
UPDATE users 
SET type_rol = 'Analista TI'
WHERE id = 'USER_ID_AQUI';
```

**Opción B** - Agregar el alias al código:

Si el `type_rol` es algo como "Analista IT" o "Analista Sistemas", agrégalo al mapeo:

```typescript
'Analista IT': 7,
'Analista Sistemas': 7,
'Analista de Sistemas': 7,
```

### Problema 4: No hay preguntas en la base de datos

Si la query del paso 2 retorna 0 preguntas, ejecuta:

```bash
psql -h db.miwbzotcuaywpdbidpwo.supabase.co \
     -U postgres \
     -d postgres \
     -f AGREGAR_PREGUNTAS_ROLES_FALTANTES.sql
```

---

## 🧪 Prueba Rápida

### Desde la Consola del Navegador:

```javascript
// Abrir la consola (F12) en la página del cuestionario
// Ejecutar este código:

const testMapping = (typeRol) => {
  const mapping = {
    'Analista/Especialista TI': 7,
    'Analista TI': 7,
    'Especialista TI': 7,
    'Analista de TI': 7,
    'Analista': 7,
    'Especialista': 7,
  };
  
  const result = mapping[typeRol] || 1; // 1 es CEO (fallback)
  console.log(`Type_rol: "${typeRol}" → Exclusivo_rol_id: ${result}`);
  return result;
};

// Probar con diferentes variantes
testMapping('Analista TI');           // Debería dar 7
testMapping('Analista/Especialista TI'); // Debería dar 7
testMapping(' Analista TI ');         // Debería dar 1 (problema de espacios)
testMapping('analista ti');           // Debería dar 1 (problema de mayúsculas)
```

---

## 📋 Checklist de Verificación

- [ ] Verificar `type_rol` exacto en la base de datos
- [ ] Confirmar que no hay espacios extra
- [ ] Verificar mayúsculas/minúsculas
- [ ] Confirmar que existen 12 preguntas para rol 7 (237-248)
- [ ] Revisar logs de la consola del navegador
- [ ] Probar con el código de prueba en la consola
- [ ] Actualizar `type_rol` si es necesario
- [ ] Refrescar la página después de cualquier cambio

---

## 🎯 Resultado Esperado

Después de aplicar las correcciones:

1. **En la base de datos**:
   ```sql
   SELECT type_rol FROM users WHERE id = 'USER_ID';
   -- Debería retornar: "Analista TI" (sin espacios extra)
   ```

2. **En la consola del navegador**:
   ```
   === MAPEO DEBUG ===
   Type_rol recibido: Analista TI
   Mapeo encontrado: 7
   ==================
   ```

3. **En el cuestionario**:
   - Debería mostrar 12 preguntas específicas de Analista TI
   - Las preguntas deberían ser sobre tecnología, análisis de sistemas, etc.
   - NO deberían ser preguntas estratégicas de CEO

---

## 📞 Si el Problema Persiste

### Información a Proporcionar:

1. **Resultado de la query del paso 1**:
   ```
   type_rol: [VALOR EXACTO]
   longitud: [NÚMERO]
   ```

2. **Resultado de la query del paso 2**:
   ```
   total_preguntas: [NÚMERO]
   ```

3. **Logs de la consola del navegador**:
   - Captura de pantalla del log "MAPEO DEBUG"
   - Cualquier error en rojo

4. **Captura de pantalla**:
   - De las preguntas que está viendo el usuario
   - Del perfil del usuario mostrando el `type_rol`

---

## 🔄 Cambios Realizados en el Código

### Archivo: `apps/web/src/app/questionnaire/direct/page.tsx`

**Líneas 96-99** (Mapeo principal):
```typescript
'Analista/Especialista TI': 7,
'Analista TI': 7,
'Especialista TI': 7,
'Analista de TI': 7,
```

**Líneas 125-126** (Alias comunes):
```typescript
'Analista': 7,
'Especialista': 7,
```

Estos cambios aseguran que múltiples variantes del nombre del rol sean reconocidas correctamente.

---

**Fecha de creación**: Enero 2025  
**Versión**: 1.0  
**Estado**: ✅ Solución implementada

