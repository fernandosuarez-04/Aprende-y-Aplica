# Corrección del Mapeo de Preguntas para Ventas

## Problema Identificado

El sistema anterior mapeaba incorrectamente varios roles:
1. **"Dirección de Ventas"** → Preguntas de Marketing (incorrecto)
2. **"CTO/CIO"** → Preguntas de CEO (incorrecto)
3. **"Dirección de Marketing"** → Preguntas de CTO (incorrecto)

Esto causaba que usuarios recibieran preguntas inapropiadas para su área de especialización.

### Causa Raíz

En `GENAI/perfil-cuestionario.js` (líneas 437-440):
```javascript
// Ventas y Compras se mapean a Marketing por similitud
'Dirección de Ventas': 'Marketing y Comunicación',
'Miembros de Ventas': 'Marketing y Comunicación',
```

## Solución Implementada

### 1. Creación de Preguntas Específicas para Ventas

**Archivo**: `docs/database/ventas_questions.sql`

Se crearon 12 preguntas específicas para Ventas (`exclusivo_rol_id = 6`):

#### Preguntas de Adopción (A1-A6):
- **A1**: Calificación y scoring de leads
- **A2**: Generación de propuestas comerciales
- **A3**: Análisis de pipeline de ventas
- **A4**: Comunicación con clientes
- **A5**: Análisis de competencia
- **A6**: Métricas y reportes de ventas

#### Preguntas de Conocimiento (C1-C6):
- **C1**: Integración de Gen-AI en CRM
- **C2**: Métricas de impacto en ventas
- **C3**: Personalización de propuestas
- **C4**: Gestión de información confidencial
- **C5**: Análisis predictivo de ventas
- **C6**: Automatización de procesos

### 2. Corrección del Mapeo de Roles

**Archivo**: `apps/web/src/app/statistics/page.tsx`

Actualizada la función `mapCargoToRolId()` para mapear correctamente:
```typescript
// Antes (INCORRECTO):
'Dirección de Ventas' → rol_id = 3 (Marketing)

// Después (CORRECTO):
'Dirección de Ventas' → rol_id = 6 (Líder/Gerente de Ventas)
```

### 3. Corrección del Cuestionario

**Archivo**: `apps/web/src/app/questionnaire/direct/page.tsx`

Actualizada la función `mapTypeRolToExclusivoRolId()`:
```typescript
// Antes (INCORRECTO):
'Dirección de Ventas': 3, // Marketing

// Después (CORRECTO):
'Dirección de Ventas': 6, // Líder/Gerente de Ventas
```

## Mapeo Correcto de Roles

Basado en `GENAI/roles_rows.csv` y `GENAI/preguntas_rows.csv`:

| rol_id | Nombre | area_id | exclusivo_rol_id | Descripción |
|--------|--------|---------|------------------|-------------|
| 1 | CEO | 2 | 1 | Alta dirección |
| 2 | CMO / Director(a) de Marketing | 4 | 3 | Marketing |
| 3 | CTO / Director(a) de Tecnología | 3 | 2 | Tecnología |
| 4 | Gerente de Marketing | 4 | 3 | Marketing |
| 5 | Gerente de TI | 3 | 2 | Tecnología |
| **6** | **Líder/Gerente de Ventas** | **2** | **6** | **Ventas** |
| 7 | Analista/Especialista TI | 3 | 2 | Tecnología |
| 8 | Academia/Investigación | 9 | 8 | Investigación |
| 9 | Educación/Docentes | 10 | 9 | Educación |
| 10 | Diseño/Industrias Creativas | 11 | 10 | Diseño |

## Instrucciones de Implementación

### 1. Ejecutar el SQL de Preguntas

```sql
-- Ejecutar en Supabase
\i docs/database/ventas_questions.sql
```

### 2. Verificar el Mapeo

Para un usuario con `cargo_titulo = "Director de Ventas"`:

1. **En `user_perfil`**: `rol_id = 6`
2. **En `users`**: `type_rol = "Dirección de Ventas"`
3. **En el cuestionario**: `exclusivo_rol_id = 6`
4. **Preguntas mostradas**: 12 preguntas específicas de ventas

### 3. Validación

El cuestionario debería mostrar:
- **6 preguntas de Adopción** (A1-A6) enfocadas en ventas
- **6 preguntas de Conocimiento** (C1-C6) enfocadas en ventas
- **Total: 12 preguntas** organizadas en 2 secciones

## Resultado Esperado

### Para Ventas:
✅ **Antes**: "Dirección de Ventas" → Preguntas de Marketing (incorrecto)
✅ **Después**: "Dirección de Ventas" → Preguntas específicas de Ventas (correcto)

### Para CTO/CIO:
✅ **Antes**: "CTO/CIO" → Preguntas de CEO (incorrecto)
✅ **Después**: "CTO/CIO" → Preguntas específicas de Tecnología (correcto)

### Para Marketing:
✅ **Antes**: "Dirección de Marketing" → Preguntas de CTO (incorrecto)
✅ **Después**: "Dirección de Marketing" → Preguntas específicas de Marketing (correcto)

## Archivos Modificados

1. `docs/database/ventas_questions.sql` - Nuevas preguntas para ventas
2. `apps/web/src/app/statistics/page.tsx` - Mapeo de roles corregido
3. `apps/web/src/app/questionnaire/direct/page.tsx` - Lógica del cuestionario corregida
4. `docs/QUESTIONNAIRE_VENTAS_FIX.md` - Esta documentación

## Próximos Pasos

1. **Ejecutar el SQL** en la base de datos
2. **Probar el cuestionario** con un usuario de ventas
3. **Verificar** que se muestren 12 preguntas específicas de ventas
4. **Considerar crear preguntas** para otros roles que puedan estar mal mapeados
