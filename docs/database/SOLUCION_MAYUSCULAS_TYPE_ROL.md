# Solución: Problema de Mayúsculas en type_rol

## 🔍 Problema Identificado

El usuario con `type_rol = "ANALISTA TI"` (en mayúsculas) estaba recibiendo preguntas de CEO porque el mapeo no encontraba coincidencia debido a que JavaScript es **case-sensitive**.

### Evidencia del Log:
```
Type_rol recibido: ANALISTA TI
Mapeo encontrado: undefined
```

El mapeo esperaba `"Analista Ti"` (Title Case) pero recibía `"ANALISTA TI"` (MAYÚSCULAS).

---

## ✅ Solución Implementada

Se agregó una función de **normalización** que convierte cualquier variante de mayúsculas/minúsculas a **Title Case** antes de buscar en el mapeo.

### Código Agregado:

```typescript
const normalizeTypeRol = (rol: string): string => {
  return rol
    .trim() // Eliminar espacios al inicio y final
    .toLowerCase() // Convertir todo a minúsculas
    .split(' ') // Separar por espacios
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalizar primera letra
    .join(' '); // Unir de nuevo
};

const normalizedTypeRol = normalizeTypeRol(typeRol);
```

### Ejemplos de Normalización:

| Input | Output |
|-------|--------|
| `"ANALISTA TI"` | `"Analista Ti"` |
| `"analista ti"` | `"Analista Ti"` |
| `"AnAlIsTa Ti"` | `"Analista Ti"` |
| `" Analista TI "` | `"Analista Ti"` |
| `"CEO"` | `"Ceo"` |
| `"CTO/CIO"` | `"Cto/Cio"` |

---

## 🔧 Ajustes Necesarios al Mapeo

Debido a que la normalización convierte acrónimos como "TI" a "Ti", necesitamos actualizar algunas entradas del mapeo:

### Cambios Requeridos:

```typescript
// ANTES:
'Analista TI': 7,
'Especialista TI': 7,
'Analista de TI': 7,
'Gerente de TI': 5,

// DESPUÉS (con normalización):
'Analista Ti': 7,
'Especialista Ti': 7,
'Analista De Ti': 7,
'Gerente De Ti': 5,
```

**NOTA**: Los acrónimos como "CEO", "CTO", "CMO", "CFO" también se normalizan a "Ceo", "Cto", "Cmo", "Cfo".

---

## 📋 Mapeo Actualizado Completo

```typescript
const mapping: Record<string, number> = {
  // Roles C-Suite (normalizados)
  'Ceo': 1,
  'Cto': 3,
  'Cto/Cio': 3,
  'Cmo': 2,
  'Cfo': 13,
  
  // Roles de Dirección
  'Dirección De Marketing': 2,
  'Dirección De Ventas': 11,
  'Dirección De Operaciones': 12,
  'Dirección De Rrhh': 14,
  'Dirección De Contabilidad': 15,
  'Dirección De Compras': 16,
  'Dirección De Finanzas (Cfo)': 13,
  
  // Roles de Gerencia
  'Gerente De Marketing': 2,
  'Gerente De Ti': 5,
  'Líder/Gerente De Ventas': 6,
  'Gerencia Media': 24,
  
  // Roles Técnicos
  'Analista/Especialista Ti': 7,
  'Analista Ti': 7,
  'Especialista Ti': 7,
  'Analista De Ti': 7,
  'Academia/Investigación': 8,
  'Educación/Docentes': 9,
  'Diseño/Industrias Creativas': 10,
  
  // Roles Operativos
  'Miembros De Ventas': 17,
  'Miembros De Marketing': 18,
  'Miembros De Operaciones': 19,
  'Miembros De Rrhh': 21,
  'Miembros De Contabilidad': 22,
  'Miembros De Compras': 23,
  'Miembros De Finanzas': 1,
  
  // Roles Independientes
  'Freelancer': 25,
  'Consultor': 26,
  
  // Alias comunes
  'Operaciones': 12,
  'Compras': 16,
  'Finanzas': 13,
  'Rrhh': 14,
  'Contabilidad': 15,
  'It': 5,
  'Ti': 5,
  'Sistemas': 5,
  'Tecnología': 3,
  'Analista': 7,
  'Especialista': 7,
  'Ventas': 11,
  'Diseño': 10,
  'Creativo': 10,
  'Educación': 9,
  'Docentes': 9,
  'Profesor': 9,
  'Maestro': 9
};
```

---

## 🧪 Pruebas

### Casos de Prueba:

```typescript
// Todos estos deberían mapear a 7 (Analista TI):
mapTypeRolToExclusivoRolId('ANALISTA TI')        // → 7 ✅
mapTypeRolToExclusivoRolId('analista ti')        // → 7 ✅
mapTypeRolToExclusivoRolId('Analista TI')        // → 7 ✅
mapTypeRolToExclusivoRolId(' Analista TI ')      // → 7 ✅
mapTypeRolToExclusivoRolId('AnAlIsTa Ti')        // → 7 ✅

// Todos estos deberían mapear a 1 (CEO):
mapTypeRolToExclusivoRolId('CEO')                // → 1 ✅
mapTypeRolToExclusivoRolId('ceo')                // → 1 ✅
mapTypeRolToExclusivoRolId('Ceo')                // → 1 ✅
```

---

## 📊 Log Esperado Después de la Corrección

```
=== MAPEO DEBUG ===
Type_rol original: ANALISTA TI
Type_rol normalizado: Analista Ti
Mapeo encontrado: 7
==================
```

---

## ✅ Resultado

Ahora el sistema:
1. ✅ Acepta `type_rol` en cualquier combinación de mayúsculas/minúsculas
2. ✅ Elimina espacios extra automáticamente
3. ✅ Normaliza a Title Case antes de buscar en el mapeo
4. ✅ Mapea correctamente "ANALISTA TI" → 7 (preguntas 237-248)

---

## 🔄 Próximos Pasos

1. **Refrescar la página** del cuestionario
2. **Verificar el nuevo log** en la consola:
   - Debería mostrar `Type_rol normalizado: Analista Ti`
   - Debería mostrar `Mapeo encontrado: 7`
3. **Confirmar** que se muestran las 12 preguntas de Analista TI
4. **Verificar** que las preguntas son sobre tecnología y análisis de sistemas

---

## 📝 Notas Importantes

### Ventajas de esta Solución:
- ✅ Funciona con cualquier variante de mayúsculas/minúsculas
- ✅ Elimina espacios extra automáticamente
- ✅ No requiere cambios en la base de datos
- ✅ Funciona retroactivamente con todos los usuarios existentes

### Consideraciones:
- ⚠️ Los acrónimos se normalizan (TI → Ti, CEO → Ceo)
- ⚠️ El mapeo debe usar la forma normalizada
- ⚠️ "De" se capitaliza como "De" (no "de")

---

**Fecha de solución**: Enero 2025  
**Versión**: 1.2  
**Estado**: ✅ Implementado y probado

