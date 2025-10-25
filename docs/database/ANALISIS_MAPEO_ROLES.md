# Análisis del Mapeo de Roles y Preguntas

## Problema Identificado

El sistema actual tiene 94 preguntas del cuestionario, pero cada rol debería mostrar solo 12 preguntas específicas (6 de Adopción + 6 de Conocimiento).

## Mapeo Actual en la Base de Datos

### Roles (roles_rows.csv)
| id | nombre | area_id |
|----|--------|---------|
| 1 | CEO | - |
| 2 | CMO / Director(a) de Marketing | 3 |
| 3 | CTO / Director(a) de Tecnología | 9 |
| 4 | Gerente de Marketing | 3 |
| 5 | Gerente de TI | 9 |
| 6 | Líder/Gerente de Ventas | 2 |
| 7 | Analista/Especialista TI | 9 |
| 8 | Academia/Investigación | 9 |
| 9 | Educación/Docentes | 10 |
| 10 | Diseño/Industrias Creativas | 11 |

### Preguntas por exclusivo_rol_id (preguntas_rows.csv)

#### exclusivo_rol_id = 1 (CEO)
- **area_id = 2** (Ventas)
- **12 preguntas**: A1-A6 (Adopción) + C1-C6 (Conocimiento)
- **Ejemplos**:
  - A1: "¿Con qué frecuencia impulsa iniciativas de Gen-AI con presupuesto y OKRs explícitos?"
  - C1: "¿Cuál es un KPI estratégico adecuado para Gen-AI a nivel CEO?"

#### exclusivo_rol_id = 2 (CTO/Tecnología)
- **area_id = 3** (Tecnología)
- **12 preguntas**: A1-A6 (Adopción) + C1-C6 (Conocimiento)
- **Ejemplos**:
  - A1: "¿Con qué frecuencia utiliza asistentes de código para generar/explicar funciones?"
  - C1: "¿Qué es la ventana de contexto en un LLM?"

#### exclusivo_rol_id = 3 (Marketing)
- **area_id = 4** (Marketing)
- **12 preguntas**: A1-A6 (Adopción) + C1-C6 (Conocimiento)
- **Ejemplos**:
  - A1: "¿Con qué frecuencia usa Gen-AI para ideación y copy (posts, emails, ads, guiones)?"
  - C1: "Práctica que mejora la coherencia del tono de marca"

#### exclusivo_rol_id = 6 (Ventas) - FALTANTE
- **No existen preguntas** en el CSV actual
- **Necesario crear**: 12 preguntas específicas para ventas

## Problema Principal

1. **Mapeo Incorrecto**: El código está mapeando roles incorrectamente
2. **Preguntas Faltantes**: No hay preguntas para Ventas (exclusivo_rol_id = 6)
3. **Filtrado Incorrecto**: El sistema no está filtrando correctamente por exclusivo_rol_id

## Solución Requerida

### 1. Corregir Mapeo en el Código
```typescript
const mapTypeRolToExclusivoRolId = (typeRol: string): number => {
  const mapping: Record<string, number> = {
    'CEO': 1,                    // exclusivo_rol_id = 1
    'CTO/CIO': 2,               // exclusivo_rol_id = 2
    'Dirección de Marketing': 3, // exclusivo_rol_id = 3
    'Dirección de Ventas': 6,    // exclusivo_rol_id = 6
    // ... otros roles
  };
  return mapping[typeRol] || 1;
};
```

### 2. Crear Preguntas para Ventas
- Crear 12 preguntas específicas para Ventas (exclusivo_rol_id = 6)
- 6 de Adopción (A1-A6)
- 6 de Conocimiento (C1-C6)

### 3. Verificar Filtrado
- Asegurar que la consulta filtre por `exclusivo_rol_id` correcto
- Verificar que cada rol muestre exactamente 12 preguntas

## Resultado Esperado

Para cada rol:
- **CEO**: 12 preguntas de estrategia y gobernanza
- **CTO/CIO**: 12 preguntas de tecnología y desarrollo
- **Marketing**: 12 preguntas de marketing y creatividad
- **Ventas**: 12 preguntas de ventas y CRM
- **Otros roles**: 12 preguntas específicas para cada área
