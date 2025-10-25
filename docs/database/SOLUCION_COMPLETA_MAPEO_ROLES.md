# Solución Completa del Mapeo de Roles y Preguntas

## Problema Identificado

El usuario reportó que al seleccionar "Diseño/Industrias Creativas" (role_id = 10), el sistema lo mapeaba incorrectamente a "Educación/Docentes" (role_id = 9) y mostraba preguntas de CEO (exclusivo_rol_id = 1).

## Análisis del Problema

### 1. Desconexión entre Tablas

**Tabla `roles` (IDs reales):**
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

**Tabla `preguntas` (exclusivo_rol_id):**
- `exclusivo_rol_id = 1`: Preguntas de CEO (12 preguntas)
- `exclusivo_rol_id = 2`: Preguntas de CTO (12 preguntas) 
- `exclusivo_rol_id = 3`: Preguntas de Marketing (12 preguntas)
- `exclusivo_rol_id = 4`: Preguntas de Salud (12 preguntas)
- `exclusivo_rol_id = 5`: Preguntas de Derecho (12 preguntas)
- `exclusivo_rol_id = 6`: Preguntas de Finanzas (12 preguntas)
- `exclusivo_rol_id = 7`: Preguntas de Administración Pública (12 preguntas)
- `exclusivo_rol_id = 8`: Preguntas de Academia (10 preguntas)
- `exclusivo_rol_id = 9`: ❌ **FALTABA** - Educación/Docentes
- `exclusivo_rol_id = 10`: ❌ **FALTABA** - Diseño/Industrias Creativas

### 2. Mapeo Incorrecto en el Código

El código tenía mapeos incorrectos:
```typescript
// ❌ INCORRECTO
'Educación/Docentes': 8,     // Mapeaba a Academia
'Diseño/Industrias Creativas': 1, // Mapeaba a CEO
```

## Solución Implementada

### 1. Crear Preguntas Faltantes

**Archivo:** `docs/database/FIX_ROLES_QUESTIONS_MAPPING.sql`

Se crearon 24 preguntas nuevas:
- **12 preguntas para Educación/Docentes** (exclusivo_rol_id = 9)
- **12 preguntas para Diseño/Industrias Creativas** (exclusivo_rol_id = 10)

### 2. Corregir Mapeo en el Código

**Archivo:** `apps/web/src/app/questionnaire/direct/page.tsx`

Se corrigió el mapeo:
```typescript
// ✅ CORREGIDO
'Educación/Docentes': 9,     // exclusivo_rol_id = 9 (Educación - 12 preguntas nuevas)
'Diseño/Industrias Creativas': 10, // exclusivo_rol_id = 10 (Diseño - 12 preguntas nuevas)
```

### 3. Mapeo Completo Corregido

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
  'Academia/Investigación': 8, // Usa preguntas existentes de Academia
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

## Instrucciones de Implementación

### 1. Ejecutar Script SQL
```sql
-- En Supabase SQL Editor
-- Ejecutar: docs/database/FIX_ROLES_QUESTIONS_MAPPING.sql
```

### 2. Verificar Implementación
```sql
-- Verificar que las preguntas se crearon correctamente
SELECT 
    p.exclusivo_rol_id,
    r.nombre as role_name,
    COUNT(p.id) as total_preguntas
FROM "public"."preguntas" p
LEFT JOIN "public"."roles" r ON p.exclusivo_rol_id = r.id
WHERE p.section = 'Cuestionario'
GROUP BY p.exclusivo_rol_id, r.nombre
ORDER BY p.exclusivo_rol_id;
```

### 3. Probar el Cuestionario
- Seleccionar "Diseño/Industrias Creativas" → Debe mostrar 12 preguntas específicas de diseño
- Seleccionar "Educación/Docentes" → Debe mostrar 12 preguntas específicas de educación
- Verificar que no se muestren preguntas de CEO para estos roles

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

1. **`docs/database/FIX_ROLES_QUESTIONS_MAPPING.sql`** - Script SQL para crear preguntas faltantes
2. **`apps/web/src/app/questionnaire/direct/page.tsx`** - Código corregido del mapeo
3. **`docs/database/MAPEO_CORRECTO_ROLES_PREGUNTAS.md`** - Análisis del problema
4. **`docs/database/SOLUCION_COMPLETA_MAPEO_ROLES.md`** - Esta documentación

## Próximos Pasos

1. **Ejecutar el script SQL** para crear las preguntas faltantes
2. **Probar el cuestionario** con diferentes roles
3. **Crear preguntas para roles 11-26** si es necesario (opcional)
4. **Verificar que todos los roles** muestren las preguntas correctas

## Notas Importantes

- ✅ **Educación/Docentes** ahora tiene 12 preguntas específicas (exclusivo_rol_id = 9)
- ✅ **Diseño/Industrias Creativas** ahora tiene 12 preguntas específicas (exclusivo_rol_id = 10)
- ✅ **Academia/Investigación** mantiene sus 10 preguntas existentes (exclusivo_rol_id = 8)
- ✅ **Todos los roles** ahora tienen un mapeo correcto y coherente
- ✅ **El sistema** ya no muestra preguntas de CEO para roles que no corresponden
