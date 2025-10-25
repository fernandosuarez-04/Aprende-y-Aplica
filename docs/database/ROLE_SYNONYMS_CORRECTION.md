# Corrección de la Tabla ROLE_SYNONYMS

## Problema Identificado

La tabla `role_synonyms` tenía mapeos incorrectos que no coincidían con los IDs reales de la tabla `roles`. Esto causaba que el sistema no pudiera encontrar los sinónimos correctos para los roles.

## Errores Encontrados

### Mapeos Incorrectos en role_synonyms_rows.csv:

```csv
# ❌ INCORRECTO
7,2,IT                    # IT mapeado a role_id = 2 (CMO/Director de Marketing)
8,2,Sistemas             # Sistemas mapeado a role_id = 2 (CMO/Director de Marketing)
9,3,Marketing            # Marketing mapeado a role_id = 3 (CTO/Director de Tecnología)
```

### IDs Reales de la Tabla roles:

```csv
# ✅ CORRECTO (basado en roles_rows.csv)
1,ceo,CEO
2,cmo,CMO / Director(a) de Marketing
3,cto,CTO / Director(a) de Tecnología
4,gerente-marketing,Gerente de Marketing
5,gerente-ti,Gerente de TI
6,lider-ventas,Líder/Gerente de Ventas
7,analista-ti,Analista/Especialista TI
8,academia-investigacion,Academia/Investigación
9,educacion-docentes,Educación/Docentes
10,diseno-industrias-creativas,Diseño/Industrias Creativas
11,direccion-ventas,Dirección de Ventas
12,direccion-operaciones,Dirección de Operaciones
13,direccion-finanzas,Dirección de Finanzas (CFO)
14,direccion-rrhh,Dirección de RRHH
15,direccion-contabilidad,Dirección/Jefatura de Contabilidad
16,direccion-compras,Dirección de Compras / Supply
17,miembros-ventas,Miembros de Ventas
18,miembros-marketing,Miembros de Marketing
19,miembros-operaciones,Miembros de Operaciones
20,miembros-finanzas,Miembros de Finanzas
21,miembros-rrhh,Miembros de RRHH
22,miembros-contabilidad,Miembros de Contabilidad
23,miembros-compras,Miembros de Compras
24,gerencia-media,Gerencia Media
25,freelancer,Freelancer
26,consultor,Consultor
```

## Correcciones Implementadas

### 1. Archivo Corregido: `role_synonyms_rows_CORREGIDO.csv`

Se creó un archivo CSV con los mapeos correctos:

```csv
# ✅ CORREGIDO
7,3,CTO                   # CTO mapeado a role_id = 3 (CTO/Director de Tecnología)
8,3,CIO                   # CIO mapeado a role_id = 3 (CTO/Director de Tecnología)
9,3,IT                    # IT mapeado a role_id = 3 (CTO/Director de Tecnología)
10,3,Sistemas             # Sistemas mapeado a role_id = 3 (CTO/Director de Tecnología)
11,2,Marketing            # Marketing mapeado a role_id = 2 (CMO/Director de Marketing)
```

### 2. Script SQL: `FIX_ROLE_SYNONYMS.sql`

Se creó un script SQL completo que:
- Limpia la tabla existente (opcional)
- Inserta todos los sinónimos corregidos
- Incluye verificación de los datos

## Mapeos Correctos por Rol

### CEO (role_id = 1)
- CEO, Chief Executive Officer, Directora General, Director General, Gerente General, C.E.O.

### CMO/Director de Marketing (role_id = 2)
- CMO, Marketing, Comunicación, Publicidad, Director de Marketing, Director Comercial

### CTO/Director de Tecnología (role_id = 3)
- CTO, CIO, IT, Sistemas, Director de Tecnología, Director Tecnológico

### Gerente de Marketing (role_id = 4)
- Gerente de Marketing, Marketing Manager

### Gerente de TI (role_id = 5)
- Gerente de TI, IT Manager, Director de Sistemas

### Líder/Gerente de Ventas (role_id = 6)
- Líder de Ventas, Gerente de Ventas, Director de Ventas, CSO, Director Comercial

### Analista/Especialista TI (role_id = 7)
- Analista TI, Especialista TI, Desarrollador, Programador

### Academia/Investigación (role_id = 8)
- Academia, Investigación, Investigador, Académico

### Educación/Docentes (role_id = 9)
- Educación, Docentes, Profesor, Maestro

### Diseño/Industrias Creativas (role_id = 10)
- Diseño, Industrias Creativas, Creativo, Diseñador

### Roles de Dirección (role_id = 11-16)
- Dirección de Ventas, Dirección de Operaciones, Dirección de Finanzas, etc.

### Roles de Miembros (role_id = 17-23)
- Miembros de Ventas, Miembros de Marketing, Miembros de Operaciones, etc.

### Roles Especializados (role_id = 24-26)
- Gerencia Media, Freelancer, Consultor

## Instrucciones de Implementación

1. **Ejecutar el script SQL:**
   ```sql
   -- En Supabase SQL Editor
   -- Ejecutar: docs/database/FIX_ROLE_SYNONYMS.sql
   ```

2. **Verificar la corrección:**
   ```sql
   -- Verificar que los sinónimos se mapean correctamente
   SELECT 
       rs.id,
       rs.role_id,
       r.nombre as role_name,
       rs.alias
   FROM "public"."role_synonyms" rs
   JOIN "public"."roles" r ON rs.role_id = r.id
   ORDER BY rs.role_id, rs.alias;
   ```

3. **Probar el cuestionario:**
   - Probar con diferentes roles (CTO, Marketing, Operaciones, etc.)
   - Verificar que se muestran las preguntas correctas
   - Confirmar que no hay más errores de mapeo

## Resultado Esperado

Después de aplicar estas correcciones:

- ✅ Los sinónimos se mapean correctamente a los roles
- ✅ El cuestionario muestra las preguntas apropiadas para cada rol
- ✅ No hay más errores de "Mapeo encontrado: undefined"
- ✅ Cada rol muestra 12 preguntas específicas en lugar de 24 preguntas de CEO

## Archivos Modificados

1. `GENAI/role_synonyms_rows_CORREGIDO.csv` - Archivo CSV corregido
2. `docs/database/FIX_ROLE_SYNONYMS.sql` - Script SQL de corrección
3. `docs/database/ROLE_SYNONYMS_CORRECTION.md` - Esta documentación
