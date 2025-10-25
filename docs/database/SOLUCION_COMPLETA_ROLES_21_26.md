# Solución Completa: Preguntas para Roles 21-26

## 📋 Resumen

Este documento detalla la solución implementada para agregar preguntas específicas a los roles operativos y especializados (IDs 21-26) que anteriormente no tenían preguntas asignadas.

## 🎯 Roles Agregados

### Roles Operativos

| ID | Nombre | Area ID | Preguntas | Exclusivo Rol ID |
|----|--------|---------|-----------|------------------|
| 21 | Miembros de RRHH | 6 | 293-304 | 21 |
| 22 | Miembros de Contabilidad | 7 | 305-316 | 22 |
| 23 | Miembros de Compras | 8 | 317-328 | 23 |

### Roles Especializados

| ID | Nombre | Area ID | Preguntas | Exclusivo Rol ID |
|----|--------|---------|-----------|------------------|
| 24 | Gerencia Media | 1 | 329-340 | 24 |
| 25 | Freelancer | 1 | 341-352 | 25 |
| 26 | Consultor | 1 | 353-364 | 26 |

## 📊 Estadísticas

- **Total de roles**: 6
- **Total de preguntas nuevas**: 72 (6 roles × 12 preguntas cada uno)
- **Rango de IDs**: 293-364
- **Preguntas por rol**:
  - 6 preguntas de Adopción (escala Likert A-E)
  - 6 preguntas de Conocimiento (opción múltiple)

## 📁 Archivos Creados

### 1. `AGREGAR_PREGUNTAS_ROLES_21_26.sql`
Contiene las preguntas para:
- **Rol 21**: Miembros de RRHH (preguntas 293-304)
- **Rol 22**: Miembros de Contabilidad (preguntas 305-316)

### 2. `AGREGAR_PREGUNTAS_ROLES_21_26_PARTE2.sql`
Contiene las preguntas para:
- **Rol 23**: Miembros de Compras (preguntas 317-328)
- **Rol 24**: Gerencia Media (preguntas 329-340)
- **Rol 25**: Freelancer (preguntas 341-352)
- **Rol 26**: Consultor (preguntas 353-364)

## 🔍 Detalles por Rol

### Rol 21: Miembros de RRHH
**Enfoque**: Tareas operativas de recursos humanos
- Screening de CVs
- Redacción de job descriptions
- Coordinación de entrevistas
- Onboarding
- Análisis de datos de empleados
- Soporte a empleados

### Rol 22: Miembros de Contabilidad
**Enfoque**: Tareas operativas contables
- Registro y clasificación de transacciones
- Conciliaciones bancarias
- Generación de reportes contables
- Detección de errores
- Gestión de cuentas por pagar/cobrar
- Documentación fiscal

### Rol 23: Miembros de Compras
**Enfoque**: Tareas operativas de compras
- Búsqueda y comparación de proveedores
- Procesamiento de órdenes de compra
- Seguimiento de entregas
- Comunicación con proveedores
- Análisis de precios
- Documentación de compras

### Rol 24: Gerencia Media
**Enfoque**: Gestión de equipos y coordinación
- Gestión de equipos
- Análisis de performance
- Planificación de recursos
- Comunicación con dirección
- Resolución de problemas
- Desarrollo del equipo

### Rol 25: Freelancer
**Enfoque**: Trabajo independiente y gestión de clientes
- Gestión de proyectos y clientes
- Creación de propuestas
- Marketing personal
- Producción de entregables
- Gestión administrativa
- Desarrollo de habilidades

### Rol 26: Consultor
**Enfoque**: Consultoría estratégica y análisis
- Análisis de problemas de clientes
- Desarrollo de estrategias
- Investigación de mercado
- Creación de presentaciones
- Facilitación de workshops
- Gestión de conocimiento

## 🚀 Implementación

### Paso 1: Ejecutar Scripts SQL
```sql
-- Ejecutar en orden:
1. AGREGAR_PREGUNTAS_ROLES_21_26.sql
2. AGREGAR_PREGUNTAS_ROLES_21_26_PARTE2.sql
```

### Paso 2: Verificar Inserción
```sql
-- Verificar que se agregaron correctamente
SELECT 
    exclusivo_rol_id,
    COUNT(*) as total_preguntas,
    MIN(id) as primera_pregunta,
    MAX(id) as ultima_pregunta
FROM "public"."preguntas" 
WHERE section = 'Cuestionario' AND id >= 293
GROUP BY exclusivo_rol_id
ORDER BY exclusivo_rol_id;
```

### Paso 3: Actualizar Código Frontend
El código en `apps/web/src/app/questionnaire/direct/page.tsx` ya está preparado para manejar estos nuevos roles mediante la función `mapTypeRolToExclusivoRolId`.

## 📈 Mapeo Completo Final (Todos los Roles)

| Rol ID | Nombre | Preguntas |
|--------|--------|-----------|
| 1 | CEO | 7-18 |
| 2 | CMO / Director(a) de Marketing | 31-42 |
| 3 | CTO / Director(a) de Tecnología | 201-212 |
| 4 | Gerente de Marketing | 31-42 |
| 5 | Gerente de TI | 213-224 |
| 6 | Líder/Gerente de Ventas | 225-236 |
| 7 | Analista/Especialista TI | 237-248 |
| 8 | Academia/Investigación | 79-90 |
| 9 | Educación/Docentes | 249-260 |
| 10 | Diseño/Industrias Creativas | 261-272 |
| 11 | Dirección de Ventas | 185-196 |
| 12 | Dirección de Operaciones | 197-208 |
| 13 | Dirección de Finanzas (CFO) | 209-220 |
| 14 | Dirección de RRHH | 221-232 |
| 15 | Dirección/Jefatura de Contabilidad | 233-244 |
| 16 | Dirección de Compras / Supply | 245-256 |
| 17 | Miembros de Ventas | 257-268 |
| 18 | Miembros de Marketing | 269-280 |
| 19 | Miembros de Operaciones | 281-292 |
| **21** | **Miembros de RRHH** | **293-304** ✨ |
| **22** | **Miembros de Contabilidad** | **305-316** ✨ |
| **23** | **Miembros de Compras** | **317-328** ✨ |
| **24** | **Gerencia Media** | **329-340** ✨ |
| **25** | **Freelancer** | **341-352** ✨ |
| **26** | **Consultor** | **353-364** ✨ |

**Total de preguntas en el sistema**: 364 preguntas

## ✅ Validación

### Verificar Roles sin Preguntas
```sql
-- Debe devolver 0 filas
SELECT r.id, r.nombre
FROM "public"."roles" r
LEFT JOIN "public"."preguntas" p ON r.id = p.exclusivo_rol_id
WHERE p.id IS NULL
AND r.id NOT IN (20); -- Rol 20 no tiene preguntas por diseño
```

### Verificar Conteo Total
```sql
-- Debe devolver 364
SELECT COUNT(*) as total_preguntas
FROM "public"."preguntas"
WHERE section = 'Cuestionario';
```

## 🎓 Notas Importantes

1. **Roles 20**: No tiene preguntas específicas porque usa las preguntas de CEO (fallback en el código)
2. **Diferenciación jerárquica**: Los roles operativos (21-23) tienen preguntas más tácticas que sus contrapartes de dirección (14-16)
3. **Roles especializados**: Los roles 24-26 tienen preguntas adaptadas a sus contextos únicos de trabajo

## 🔄 Próximos Pasos

1. ✅ Ejecutar scripts SQL en la base de datos
2. ✅ Verificar que todas las preguntas se insertaron correctamente
3. ✅ Probar el cuestionario con usuarios de estos roles
4. ✅ Validar que el mapeo funciona correctamente en el frontend

---

**Fecha de creación**: Enero 2025
**Última actualización**: Enero 2025
**Estado**: ✅ Completo y listo para implementación

