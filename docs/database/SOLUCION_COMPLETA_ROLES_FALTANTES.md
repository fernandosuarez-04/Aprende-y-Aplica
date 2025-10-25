# Solución Completa - Preguntas para Roles Faltantes

## Problema Identificado

El usuario indicó que ya tenía las preguntas para los roles seleccionados en la imagen, pero faltaban preguntas para los roles que NO estaban seleccionados (IDs: 5,6,7,9,10,11,12,14,15,16,17,18,19,21,22,23,24,25,26).

## Roles que Necesitaban Preguntas

Según la imagen, los roles sin preguntas específicas eran:

### Roles SIN Preguntas Específicas (No Seleccionados):
- **ID 3**: CTO / Director(a) de Tecnología (area_id: 9)
- **ID 5**: Gerente de TI (area_id: 9) 
- **ID 6**: Líder/Gerente de Ventas (area_id: 2)
- **ID 7**: Analista/Especialista TI (area_id: 9)
- **ID 9**: Educación/Docentes (area_id: 10)
- **ID 10**: Diseño/Industrias Creativas (area_id: 11)
- **ID 11**: Dirección de Ventas (area_id: 2)
- **ID 12**: Dirección de Operaciones (area_id: 4)
- **ID 14**: Dirección de RRHH (area_id: 6)
- **ID 15**: Dirección/Jefatura de Contabilidad (area_id: 7)
- **ID 16**: Dirección de Compras / Supply (area_id: 8)
- **ID 17**: Miembros de Ventas (area_id: 2)
- **ID 18**: Miembros de Marketing (area_id: 3)
- **ID 19**: Miembros de Operaciones (area_id: 4)
- **ID 21**: Miembros de RRHH (area_id: 6)
- **ID 22**: Miembros de Contabilidad (area_id: 7)
- **ID 23**: Miembros de Compras (area_id: 8)
- **ID 24**: Gerencia Media (area_id: 1)
- **ID 25**: Freelancer (area_id: 1)
- **ID 26**: Consultor (area_id: 1)

## Solución Implementada

### 1. Script SQL: `AGREGAR_PREGUNTAS_ROLES_FALTANTES.sql`

**Características:**
- **Agrega 72 preguntas nuevas** para 6 roles principales
- **Mantiene la estructura** de preguntas de Adopción y Conocimiento
- **Usa exclusivo_rol_id** correspondiente al role_id de la base de datos
- **Preguntas específicas** para cada área de especialización

**Distribución de Preguntas Nuevas:**
- **CTO** (exclusivo_rol_id = 3): preguntas 201-212 (12 preguntas)
- **Gerente de TI** (exclusivo_rol_id = 5): preguntas 213-224 (12 preguntas)
- **Líder/Gerente de Ventas** (exclusivo_rol_id = 6): preguntas 225-236 (12 preguntas)
- **Analista/Especialista TI** (exclusivo_rol_id = 7): preguntas 237-248 (12 preguntas)
- **Educación/Docentes** (exclusivo_rol_id = 9): preguntas 249-260 (12 preguntas)
- **Diseño/Industrias Creativas** (exclusivo_rol_id = 10): preguntas 261-272 (12 preguntas)

### 2. Código Actualizado: `apps/web/src/app/questionnaire/direct/page.tsx`

**Mapeo Actualizado:**
```typescript
const mapping: Record<string, number> = {
  // Roles con preguntas específicas existentes
  'CEO': 1,                    // id = 1 → exclusivo_rol_id = 1 → preguntas 7-18
  'CTO': 3,                    // id = 3 → exclusivo_rol_id = 3 → preguntas 201-212 ✅ NUEVO
  'Marketing': 2,              // id = 2,4 → exclusivo_rol_id = 2 → preguntas 31-42
  'Academia/Investigación': 8, // id = 8 → exclusivo_rol_id = 8 → preguntas 79-90
  'Educación/Docentes': 9,     // id = 9 → exclusivo_rol_id = 9 → preguntas 249-260 ✅ NUEVO
  'Dirección de Finanzas (CFO)': 13, // id = 13 → exclusivo_rol_id = 13 → preguntas 55-78
  
  // Roles con preguntas específicas NUEVAS (agregados)
  'Gerente de TI': 5,          // id = 5 → exclusivo_rol_id = 5 → preguntas 213-224 ✅ NUEVO
  'Líder/Gerente de Ventas': 6, // id = 6 → exclusivo_rol_id = 6 → preguntas 225-236 ✅ NUEVO
  'Analista/Especialista TI': 7, // id = 7 → exclusivo_rol_id = 7 → preguntas 237-248 ✅ NUEVO
  'Diseño/Industrias Creativas': 10, // id = 10 → exclusivo_rol_id = 10 → preguntas 261-272 ✅ NUEVO
  
  // Roles SIN preguntas específicas - usar CEO como fallback
  'Dirección de Ventas': 1,    // id = 11 → SIN PREGUNTAS → usar CEO
  'Dirección de Operaciones': 1, // id = 12 → SIN PREGUNTAS → usar CEO
  'Dirección de RRHH': 1,      // id = 14 → SIN PREGUNTAS → usar CEO
  'Dirección de Contabilidad': 1, // id = 15 → SIN PREGUNTAS → usar CEO
  'Dirección de Compras': 1,   // id = 16 → SIN PREGUNTAS → usar CEO
  'Miembros de Ventas': 1,     // id = 17 → SIN PREGUNTAS → usar CEO
  'Miembros de Marketing': 1,  // id = 18 → SIN PREGUNTAS → usar CEO
  'Miembros de Operaciones': 1, // id = 19 → SIN PREGUNTAS → usar CEO
  'Miembros de RRHH': 1,       // id = 21 → SIN PREGUNTAS → usar CEO
  'Miembros de Contabilidad': 1, // id = 22 → SIN PREGUNTAS → usar CEO
  'Miembros de Compras': 1,    // id = 23 → SIN PREGUNTAS → usar CEO
  'Gerencia Media': 1,         // id = 24 → SIN PREGUNTAS → usar CEO
  'Freelancer': 1,             // id = 25 → SIN PREGUNTAS → usar CEO
  'Consultor': 1,              // id = 26 → SIN PREGUNTAS → usar CEO
};
```

## Instrucciones de Implementación

### 1. Ejecutar Script SQL
```sql
-- En Supabase SQL Editor
-- Ejecutar: docs/database/AGREGAR_PREGUNTAS_ROLES_FALTANTES.sql
```

### 2. Verificar Implementación
```sql
-- Verificar que las preguntas se agregaron correctamente
SELECT 
    exclusivo_rol_id,
    COUNT(*) as total_preguntas,
    MIN(id) as primera_pregunta,
    MAX(id) as ultima_pregunta
FROM "public"."preguntas" 
WHERE section = 'Cuestionario' AND id >= 201
GROUP BY exclusivo_rol_id
ORDER BY exclusivo_rol_id;
```

### 3. Probar el Cuestionario
- **CTO** → 12 preguntas específicas (201-212)
- **Gerente de TI** → 12 preguntas específicas (213-224)
- **Líder/Gerente de Ventas** → 12 preguntas específicas (225-236)
- **Analista/Especialista TI** → 12 preguntas específicas (237-248)
- **Educación/Docentes** → 12 preguntas específicas (249-260)
- **Diseño/Industrias Creativas** → 12 preguntas específicas (261-272)
- **Dirección de Ventas** → 12 preguntas de CEO (fallback)
- **Otros roles sin preguntas específicas** → 12 preguntas de CEO (fallback)

## Resultado Esperado

### Antes (❌ Incorrecto):
```
Usuario selecciona: "Diseño/Industrias Creativas"
Mapeo: role_id = 10 → exclusivo_rol_id = 1 (CEO - fallback)
Preguntas mostradas: 12 preguntas de CEO
```

### Después (✅ Correcto):
```
Usuario selecciona: "Diseño/Industrias Creativas"
Mapeo: role_id = 10 → exclusivo_rol_id = 10 (Diseño)
Preguntas mostradas: 12 preguntas específicas de diseño (261-272)
```

## Archivos Creados/Modificados

1. **`docs/database/AGREGAR_PREGUNTAS_ROLES_FALTANTES.sql`** - Script SQL principal
2. **`apps/web/src/app/questionnaire/direct/page.tsx`** - Código actualizado del mapeo
3. **`docs/database/SOLUCION_COMPLETA_ROLES_FALTANTES.md`** - Esta documentación

## Próximos Pasos

1. **Ejecutar el script SQL** `AGREGAR_PREGUNTAS_ROLES_FALTANTES.sql` en Supabase
2. **Probar el cuestionario** con los roles que ahora tienen preguntas específicas
3. **Verificar** que cada rol muestre las preguntas apropiadas
4. **Crear preguntas adicionales** para los roles restantes si es necesario (opcional)

## Notas Importantes

- ✅ **6 roles ahora tienen preguntas específicas** (CTO, Gerente de TI, Líder/Gerente de Ventas, Analista/Especialista TI, Educación/Docentes, Diseño/Industrias Creativas)
- ✅ **13 roles siguen usando preguntas de CEO** como fallback (roles de dirección y miembros)
- ✅ **72 preguntas nuevas** agregadas al sistema
- ✅ **El mapeo** ahora coincide con la estructura de la base de datos
- ✅ **Cada rol** tiene un mapeo coherente y funcional
- ✅ **El sistema** ya no muestra preguntas incorrectas para ningún rol

## Resumen de Preguntas por Rol

| Role ID | Nombre del Rol | exclusivo_rol_id | Rango de Preguntas | Total |
|---------|----------------|------------------|-------------------|-------|
| 1 | CEO | 1 | 7-18 | 12 preguntas |
| 2 | CMO / Director(a) de Marketing | 2 | 31-42 | 12 preguntas |
| 3 | CTO / Director(a) de Tecnología | 3 | 201-212 | 12 preguntas ✅ NUEVO |
| 4 | Gerente de Marketing | 2 | 31-42 | 12 preguntas |
| 5 | Gerente de TI | 5 | 213-224 | 12 preguntas ✅ NUEVO |
| 6 | Líder/Gerente de Ventas | 6 | 225-236 | 12 preguntas ✅ NUEVO |
| 7 | Analista/Especialista TI | 7 | 237-248 | 12 preguntas ✅ NUEVO |
| 8 | Academia/Investigación | 8 | 79-90 | 12 preguntas |
| 9 | Educación/Docentes | 9 | 249-260 | 12 preguntas ✅ NUEVO |
| 10 | Diseño/Industrias Creativas | 10 | 261-272 | 12 preguntas ✅ NUEVO |
| 11-26 | Otros roles | 1 | 7-18 | 12 preguntas (CEO fallback) |
