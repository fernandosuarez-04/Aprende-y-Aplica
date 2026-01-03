# 📋 Plan de Generación de Preguntas por Rol

## 🎯 Objetivo
Generar 12 preguntas por rol (6 de Conocimiento + 6 de Adopción) para todos los roles que aún no tienen preguntas completas.

## 📊 Análisis de Roles Existentes

### Roles con Preguntas Existentes (del archivo preguntas_rows.sql):
- **Rol ID 1** (CEO): ✅ Tiene 12 preguntas (6 Adopción + 6 Conocimiento)
- **Rol ID 2** (CMO): ✅ Tiene 12 preguntas (6 Adopción + 6 Conocimiento)  
- **Rol ID 3** (CTO): ✅ Tiene 12 preguntas (6 Adopción + 6 Conocimiento)
- **Rol ID 4** (Gerente de Marketing): ✅ Tiene 12 preguntas (6 Adopción + 6 Conocimiento)
- **Rol ID 13** (Dirección de Finanzas - CFO): ✅ Tiene 12 preguntas (6 Adopción + 6 Conocimiento)
- **Rol ID 20** (Miembros de Finanzas): ✅ Tiene 12 preguntas (6 Adopción + 6 Conocimiento)
- **Rol ID 27** (Dirección de Gobierno): ✅ Tiene 12 preguntas (6 Adopción + 6 Conocimiento)
- **Rol ID 28** (Miembros de Gobierno): ✅ Tiene 12 preguntas (6 Adopción + 6 Conocimiento)

### Roles que NECESITAN preguntas (28 roles totales - 8 con preguntas = 20 roles):
- **Rol ID 5**: Gerente de TI
- **Rol ID 6**: Líder/Gerente de Ventas
- **Rol ID 7**: Analista/Especialista TI
- **Rol ID 8**: Academia/Investigación
- **Rol ID 9**: Educación/Docentes
- **Rol ID 10**: Diseño/Industrias Creativas
- **Rol ID 11**: Dirección de Ventas
- **Rol ID 12**: Dirección de Operaciones
- **Rol ID 14**: Dirección de RRHH
- **Rol ID 15**: Dirección/Jefatura de Contabilidad
- **Rol ID 16**: Dirección de Compras / Supply
- **Rol ID 17**: Miembros de Ventas
- **Rol ID 18**: Miembros de Marketing
- **Rol ID 19**: Miembros de Operaciones
- **Rol ID 21**: Miembros de RRHH
- **Rol ID 22**: Miembros de Contabilidad
- **Rol ID 23**: Miembros de Compras
- **Rol ID 24**: Gerencia Media
- **Rol ID 25**: Freelancer
- **Rol ID 26**: Consultor

## 🎨 Estructura de Dimensiones

Cada pregunta debe mapear a 1 o más dimensiones usando el campo `dimension` como JSONB array:

### Dimensiones disponibles:
- **Conocimiento**: Conceptos básicos, fundamentos de IA
- **Aplicación**: Uso práctico de herramientas, frecuencia de uso
- **Productividad**: Optimización, eficiencia, ahorro de tiempo
- **Estrategia**: Planificación, gobernanza, visión a largo plazo
- **Inversión**: Presupuesto, capacitación, recursos

### Distribución sugerida por tipo de pregunta:

#### Preguntas de Conocimiento (6 por rol):
1. **Conocimiento** puro (1-2 preguntas): `["Conocimiento"]`
2. **Estrategia** (1 pregunta): `["Estrategia"]` o `["Estrategia", "Conocimiento"]`
3. **Inversión** (1 pregunta): `["Inversión"]` o `["Inversión", "Estrategia"]`
4. **Aplicación** (1 pregunta): `["Aplicación", "Conocimiento"]`
5. **Productividad** (1 pregunta): `["Productividad", "Conocimiento"]`

#### Preguntas de Adopción (6 por rol):
1. **Aplicación** (2 preguntas): `["Aplicación"]` o `["Aplicación", "Productividad"]`
2. **Productividad** (2 preguntas): `["Productividad"]` o `["Productividad", "Aplicación"]`
3. **Estrategia** (1 pregunta): `["Estrategia"]` o `["Estrategia", "Aplicación"]`
4. **Inversión** (1 pregunta): `["Inversión"]` o `["Inversión", "Estrategia"]`

## 📝 Formato de Preguntas

### Preguntas de Conocimiento:
- **Tipo**: `'Multiple Choice (una respuesta)'`
- **Opciones**: Array con 4 opciones (A, B, C, D)
- **respuesta_correcta**: La opción correcta (formato: "B) Texto...")
- **scoring**: `'{"Correcta": 100, "Incorrecta": 0}'`
- **escala**: `null`
- **Dificultad**: Baja-media (conceptos básicos que se aprenden en la plataforma)

### Preguntas de Adopción:
- **Tipo**: `'Multiple Choice (escala Likert A–E)'`
- **Opciones**: Array con 5 opciones (A-E) de frecuencia
- **respuesta_correcta**: `null`
- **scoring**: `'{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}'`
- **escala**: `'{"A": 0, "B": 25, "C": 50, "D": 75, "E": 100}'`
- **Dificultad**: Baja (frecuencia de uso, no requiere conocimiento previo)

## 🔢 Códigos de Preguntas

Formato: `{ROL_SLUG}{TIPO}{NUMERO}`
- **TIPO**: `A` para Adopción, `C` para Conocimiento
- **NUMERO**: 1-6

Ejemplo para Gerente de TI (rol_id 5, slug: 'gerente-ti'):
- `GT-A1`, `GT-A2`, ..., `GT-A6` (Adopción)
- `GT-C1`, `GT-C2`, ..., `GT-C6` (Conocimiento)

## 📦 Organización de Archivos SQL

Se generarán archivos SQL separados por área o grupo de roles relacionados para facilitar la gestión:

1. **preguntas-ventas.sql**: Roles de ventas (6, 11, 17)
2. **preguntas-operaciones.sql**: Roles de operaciones (12, 19)
3. **preguntas-rrhh.sql**: Roles de RRHH (14, 21)
4. **preguntas-contabilidad.sql**: Roles de contabilidad (15, 22)
5. **preguntas-compras.sql**: Roles de compras (16, 23)
6. **preguntas-ti.sql**: Roles de TI (5, 7)
7. **preguntas-generales.sql**: Roles generales (24, 25, 26)
8. **preguntas-educacion.sql**: Roles de educación (8, 9)
9. **preguntas-diseno.sql**: Roles de diseño (10)
10. **preguntas-marketing-miembros.sql**: Miembros de marketing (18)

## ✅ Validaciones

- Cada rol debe tener exactamente 12 preguntas (6 Adopción + 6 Conocimiento)
- Todas las preguntas deben tener `dimension` asignado como JSONB array
- Las preguntas de Conocimiento deben tener `respuesta_correcta`
- Las preguntas de Adopción deben tener `escala` con valores A-E
- El `peso` debe ser `8.333333` (100/12 preguntas)
- El `locale` debe ser `'MX/LATAM'`
- El `section` debe ser `'Cuestionario'`
- El `bloque` debe ser `'Adopción'` o `'Conocimiento'`




















