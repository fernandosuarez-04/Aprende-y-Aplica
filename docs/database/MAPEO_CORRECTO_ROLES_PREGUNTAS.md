# Mapeo Correcto entre Roles y Preguntas

## Problema Identificado

Hay una **desconexión total** entre los IDs de la tabla `roles` y los `exclusivo_rol_id` en la tabla `preguntas`.

## Mapeo Actual (INCORRECTO)

### Tabla `roles` (IDs reales) = (ID DE PREGUNTA EN LA TABLA PREGUNTAS)
- `id = 1`: CEO = 7 - 18
- `id = 2`: CMO / Director(a) de Marketing 31 - 42  
- `id = 3`: CTO / Director(a) de Tecnología 19 - 30
- `id = 4`: Gerente de Marketing 31 - 42 
- `id = 5`: Gerente de TI
- `id = 6`: Líder/Gerente de Ventas
- `id = 7`: Analista/Especialista TI
- `id = 8`: Academia/Investigación 79 - 90
- `id = 9`: Educación/Docentes 91 - 100
- `id = 10`: Diseño/Industrias Creativas
- `id = 11`: Direccion Ventas
- `id = 12`: Direccion de Operaciones 
- `id = 13`: Direccion Finanzas 67 - 78 
- `id = 14`: Direccion RRHH
- `id = 15`: Direccion Contabilidad
- `id = 16`: Direccion de Compras
- `id = 17`: Miembros Ventas
- `id = 18`: Miembros Marketing
- `id = 19`: Miembros de Operaciones
- `id = 20`: Miembros de Finanzas
- `id = 21`: Miembros de RRHH 
- `id = 22`: Miembros de Contabilidad 
- `id = 23`: Miembros de Compras
- `id = 24`: Gerencia Media
- `id = 25`: Freelancer
- `id = 26`: Consultor
- `id = 27`: Direccion Legal 55 - 66 ( No existen)
- `id = 28`: Miembros Legal 55 - 66 ( No existen)
- `id = 26`: Direccion Salud 43 - 54( No existen)
- `id = 26`: Miembros Salud 43 - 54 (No existen)

### Tabla `preguntas` (exclusivo_rol_id):
- `exclusivo_rol_id = 1`: Preguntas de CEO (12 preguntas)
- `exclusivo_rol_id = 2`: Preguntas de CTO (12 preguntas) 
- `exclusivo_rol_id = 3`: Preguntas de Marketing (12 preguntas)
- `exclusivo_rol_id = 4`: Preguntas de Salud (12 preguntas)
- `exclusivo_rol_id = 5`: Preguntas de Derecho (12 preguntas)
- `exclusivo_rol_id = 6`: Preguntas de Finanzas (12 preguntas)
- `exclusivo_rol_id = 7`: Preguntas de Administración Pública (12 preguntas)
- `exclusivo_rol_id = 8`: Preguntas de Academia (10 preguntas)

## Mapeo Correcto Propuesto

### Opción 1: Actualizar exclusivo_rol_id en preguntas
```sql
-- Actualizar preguntas para que coincidan con los IDs de roles
UPDATE "public"."preguntas" SET "exclusivo_rol_id" = 1 WHERE "exclusivo_rol_id" = 1; -- CEO (ya correcto)
UPDATE "public"."preguntas" SET "exclusivo_rol_id" = 3 WHERE "exclusivo_rol_id" = 2; -- CTO
UPDATE "public"."preguntas" SET "exclusivo_rol_id" = 2 WHERE "exclusivo_rol_id" = 3; -- Marketing
-- etc...
```

### Opción 2: Crear preguntas faltantes para roles 9-26
```sql
-- Crear preguntas para roles que no tienen (9-26)
-- Educación/Docentes (role_id = 9)
-- Diseño/Industrias Creativas (role_id = 10)
-- Dirección de Ventas (role_id = 11)
-- etc...
```

## Solución Recomendada

**Opción 2**: Crear las preguntas faltantes para todos los roles (9-26) porque:

1. ✅ Mantiene la integridad de los datos existentes
2. ✅ Permite que todos los roles tengan preguntas específicas
3. ✅ Es más escalable para futuros roles
4. ✅ No rompe las preguntas existentes

## Roles que Necesitan Preguntas

### Roles con preguntas existentes:
- ✅ CEO (role_id = 1) → exclusivo_rol_id = 1
- ✅ CTO (role_id = 3) → exclusivo_rol_id = 2  
- ✅ Marketing (role_id = 2) → exclusivo_rol_id = 3

### Roles que NECESITAN preguntas:
- ❌ Gerente de Marketing (role_id = 4)
- ❌ Gerente de TI (role_id = 5)
- ❌ Líder/Gerente de Ventas (role_id = 6)
- ❌ Analista/Especialista TI (role_id = 7)
- ❌ Academia/Investigación (role_id = 8)
- ❌ Educación/Docentes (role_id = 9)
- ❌ Diseño/Industrias Creativas (role_id = 10)
- ❌ Dirección de Ventas (role_id = 11)
- ❌ Dirección de Operaciones (role_id = 12)
- ❌ Dirección de Finanzas (role_id = 13)
- ❌ Dirección de RRHH (role_id = 14)
- ❌ Dirección de Contabilidad (role_id = 15)
- ❌ Dirección de Compras (role_id = 16)
- ❌ Miembros de Ventas (role_id = 17)
- ❌ Miembros de Marketing (role_id = 18)
- ❌ Miembros de Operaciones (role_id = 19)
- ❌ Miembros de Finanzas (role_id = 20)
- ❌ Miembros de RRHH (role_id = 21)
- ❌ Miembros de Contabilidad (role_id = 22)
- ❌ Miembros de Compras (role_id = 23)
- ❌ Gerencia Media (role_id = 24)
- ❌ Freelancer (role_id = 25)
- ❌ Consultor (role_id = 26)

## Próximos Pasos

1. **Crear preguntas para roles 9-26** (18 roles × 12 preguntas = 216 preguntas nuevas)
2. **Actualizar el mapeo en el código** para usar los IDs correctos
3. **Probar cada rol** para verificar que muestre las preguntas correctas
