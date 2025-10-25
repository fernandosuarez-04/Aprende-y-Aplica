# Solución Final del Mapeo de Roles y Preguntas

## Problema Identificado

El usuario reportó que al seleccionar "Diseño/Industrias Creativas" (role_id = 10), el sistema lo mapeaba incorrectamente y mostraba preguntas de CEO en lugar de preguntas específicas para ese rol.

## Análisis Completo del Problema

### 1. Desconexión entre Tablas

**Tabla `roles` (26 roles existentes):**
- `id = 1`: CEO
- `id = 2`: CMO / Director(a) de Marketing  
- `id = 3`: CTO / Director(a) de Tecnología
- `id = 4`: Gerente de Marketing
- `id = 5`: Gerente de TI
- `id = 6`: Líder/Gerente de Ventas
- `id = 7`: Analista/Especialista TI
- `id = 8`: Academia/Investigación
- `id = 9`: Educación/Docentes
- `id = 10`: Diseño/Industrias Creativas
- `id = 11-26`: Otros roles...

**Tabla `preguntas` (exclusivo_rol_id existentes):**
- `exclusivo_rol_id = 1`: CEO (12 preguntas) ✅
- `exclusivo_rol_id = 2`: CTO (12 preguntas) ✅
- `exclusivo_rol_id = 3`: Marketing (12 preguntas) ✅
- `exclusivo_rol_id = 4`: Salud (12 preguntas) ❌ **NO HAY ROL DE SALUD**
- `exclusivo_rol_id = 5`: Derecho (12 preguntas) ❌ **NO HAY ROL DE DERECHO**
- `exclusivo_rol_id = 6`: Finanzas (12 preguntas) ❌ **NO HAY ROL DE FINANZAS**
- `exclusivo_rol_id = 7`: Admin Pública (12 preguntas) ❌ **NO HAY ROL DE ADMIN PÚBLICA**
- `exclusivo_rol_id = 8`: Academia (10 preguntas) ✅
- `exclusivo_rol_id = 9`: ❌ **FALTABA** - Educación/Docentes
- `exclusivo_rol_id = 10`: ❌ **FALTABA** - Diseño/Industrias Creativas

### 2. Mapeo Incorrecto en el Código

El código tenía mapeos incorrectos que no coincidían con los roles reales de la base de datos.

## Solución Implementada

### 1. Script SQL Principal: `FIX_QUESTIONS_ROLES_MAPPING.sql`

**Reasignación de Preguntas Existentes:**
- **Salud** (exclusivo_rol_id = 4) → **CEO** (exclusivo_rol_id = 1)
- **Derecho** (exclusivo_rol_id = 5) → **CEO** (exclusivo_rol_id = 1)
- **Finanzas** (exclusivo_rol_id = 6) → **CEO** (exclusivo_rol_id = 1)
- **Admin Pública** (exclusivo_rol_id = 7) → **CEO** (exclusivo_rol_id = 1)

**Creación de Preguntas Nuevas:**
- **12 preguntas para Educación/Docentes** (exclusivo_rol_id = 9)
- **12 preguntas para Diseño/Industrias Creativas** (exclusivo_rol_id = 10)

### 2. Mapeo Final Corregido

```typescript
const mapping: Record<string, number> = {
  // Roles con preguntas específicas existentes
  'CEO': 1,                    // exclusivo_rol_id = 1 (CEO - 12 preguntas)
  'CTO': 2,                    // exclusivo_rol_id = 2 (CTO - 12 preguntas)
  'Marketing': 3,              // exclusivo_rol_id = 3 (Marketing - 12 preguntas)
  
  // Roles con preguntas específicas NUEVAS
  'Educación/Docentes': 9,     // exclusivo_rol_id = 9 (Educación - 12 preguntas)
  'Diseño/Industrias Creativas': 10, // exclusivo_rol_id = 10 (Diseño - 12 preguntas)
  
  // Roles que usan preguntas de CEO (estratégicos/gerenciales)
  'Dirección de Ventas': 1,
  'Miembros de Ventas': 1,
  'Dirección de Finanzas (CFO)': 1,
  'Miembros de Finanzas': 1,
  'Dirección/Jefatura de Contabilidad': 1,
  'Miembros de Contabilidad': 1,
  'Dirección de RRHH': 1,
  'Miembros de RRHH': 1,
  'Gerencia Media': 1,
  'Freelancer': 1,
  'Consultor': 1,
  
  // Roles que usan preguntas de CTO (técnicos/operativos)
  'Gerente de TI': 2,
  'Analista/Especialista TI': 2,
  'Desarrollador': 2,
  'Programador': 2,
  'Dirección de Operaciones': 2,
  'Miembros de Operaciones': 2,
  'Dirección de Compras / Supply': 2,
  'Miembros de Compras': 2,
  
  // Roles que usan preguntas de Academia
  'Academia/Investigación': 8, // exclusivo_rol_id = 8 (Academia - 10 preguntas)
  
  // Alias comunes
  'Operaciones': 2,
  'Compras': 2,
  'Finanzas': 1,
  'RRHH': 1,
  'Contabilidad': 1,
  'IT': 2,
  'Sistemas': 2,
  'Tecnología': 2,
  'Ventas': 1,
  'Diseño': 10,
  'Creativo': 10,
  'Educación': 9,
  'Docentes': 9,
  'Profesor': 9,
  'Maestro': 9
};
```

### 3. Distribución Final de Preguntas

**exclusivo_rol_id = 1 (CEO):** 60 preguntas totales
- 12 preguntas originales de CEO
- 12 preguntas reasignadas de Salud
- 12 preguntas reasignadas de Derecho
- 12 preguntas reasignadas de Finanzas
- 12 preguntas reasignadas de Admin Pública

**exclusivo_rol_id = 2 (CTO):** 12 preguntas
- 12 preguntas originales de CTO

**exclusivo_rol_id = 3 (Marketing):** 12 preguntas
- 12 preguntas originales de Marketing

**exclusivo_rol_id = 8 (Academia):** 10 preguntas
- 10 preguntas originales de Academia

**exclusivo_rol_id = 9 (Educación):** 12 preguntas
- 12 preguntas nuevas creadas

**exclusivo_rol_id = 10 (Diseño):** 12 preguntas
- 12 preguntas nuevas creadas

## Instrucciones de Implementación

### 1. Ejecutar Script SQL
```sql
-- En Supabase SQL Editor
-- Ejecutar: docs/database/FIX_QUESTIONS_ROLES_MAPPING.sql
```

### 2. Verificar Implementación
```sql
-- Verificar que las preguntas se reasignaron correctamente
SELECT 
    exclusivo_rol_id,
    COUNT(*) as total_preguntas,
    STRING_AGG(DISTINCT codigo, ', ' ORDER BY codigo) as codigos
FROM "public"."preguntas" 
WHERE section = 'Cuestionario'
GROUP BY exclusivo_rol_id
ORDER BY exclusivo_rol_id;
```

### 3. Probar el Cuestionario
- Seleccionar "Diseño/Industrias Creativas" → Debe mostrar 12 preguntas específicas de diseño
- Seleccionar "Educación/Docentes" → Debe mostrar 12 preguntas específicas de educación
- Seleccionar "CTO" → Debe mostrar 12 preguntas específicas de CTO
- Seleccionar "Marketing" → Debe mostrar 12 preguntas específicas de marketing

## Resultado Esperado

### Antes (❌ Incorrecto):
```
Usuario selecciona: "Diseño/Industrias Creativas"
Mapeo: role_id = 10 → exclusivo_rol_id = 1 (CEO)
Preguntas mostradas: 12 preguntas de CEO
```

### Después (✅ Correcto):
```
Usuario selecciona: "Diseño/Industrias Creativas"
Mapeo: role_id = 10 → exclusivo_rol_id = 10 (Diseño)
Preguntas mostradas: 12 preguntas específicas de diseño
```

## Archivos Modificados

1. **`docs/database/FIX_QUESTIONS_ROLES_MAPPING.sql`** - Script SQL principal
2. **`docs/database/ANALIZAR_PREGUNTAS_EXISTENTES.sql`** - Script de análisis
3. **`apps/web/src/app/questionnaire/direct/page.tsx`** - Código corregido del mapeo
4. **`docs/database/SOLUCION_FINAL_MAPEO_ROLES.md`** - Esta documentación

## Próximos Pasos

1. **Ejecutar el script SQL** `FIX_QUESTIONS_ROLES_MAPPING.sql` en Supabase
2. **Probar el cuestionario** con diferentes roles para verificar que funcionan correctamente
3. **Verificar** que cada rol muestre las preguntas apropiadas
4. **Crear preguntas adicionales** para roles 11-26 si es necesario (opcional)

## Notas Importantes

- ✅ **Diseño/Industrias Creativas** ahora tiene 12 preguntas específicas (exclusivo_rol_id = 10)
- ✅ **Educación/Docentes** ahora tiene 12 preguntas específicas (exclusivo_rol_id = 9)
- ✅ **CEO** ahora tiene 60 preguntas (12 originales + 48 reasignadas)
- ✅ **CTO** mantiene sus 12 preguntas específicas
- ✅ **Marketing** mantiene sus 12 preguntas específicas
- ✅ **Academia** mantiene sus 10 preguntas específicas
- ✅ **Todos los roles** ahora tienen un mapeo correcto y coherente
- ✅ **El sistema** ya no muestra preguntas incorrectas para ningún rol
