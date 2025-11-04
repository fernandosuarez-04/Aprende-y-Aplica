# Migración: Agregar Foreign Key de course_id

## Descripción
Esta migración agrega la foreign key faltante entre `organization_course_assignments.course_id` y `courses.id`.

## Problema
La tabla `organization_course_assignments` no tenía una foreign key de `course_id` hacia la tabla `courses`, lo que causaba:
- Imposibilidad de hacer JOINs eficientes entre las tablas
- Falta de integridad referencial (posibilidad de asignar cursos que no existen)
- Problemas al consultar datos relacionados con Supabase

## Solución
Se crea la foreign key constraint `organization_course_assignments_course_id_fkey` que:
- Relaciona `organization_course_assignments.course_id` con `courses.id`
- Usa `ON DELETE CASCADE` para eliminar asignaciones si se elimina un curso
- Usa `ON UPDATE CASCADE` para actualizar referencias si cambia el ID del curso
- Incluye un índice para mejorar el rendimiento de las consultas

## Archivos
- `Nueva carpeta/migrations/add_course_id_fkey_to_organization_course_assignments.sql`

## Cómo Ejecutar

### Opción 1: Ejecutar directamente en Supabase
1. Ve a tu proyecto en Supabase
2. Abre el SQL Editor
3. Copia y pega el contenido de `add_course_id_fkey_to_organization_course_assignments.sql`
4. Ejecuta el script

### Opción 2: Ejecutar desde la línea de comandos
```bash
psql -h your-db-host -U your-user -d your-database -f "Nueva carpeta/migrations/add_course_id_fkey_to_organization_course_assignments.sql"
```

## Notas Importantes
- **Verificación**: El script verifica si la foreign key ya existe antes de crearla, por lo que es seguro ejecutarlo múltiples veces
- **Datos Existentes**: Si tienes datos en `organization_course_assignments` con `course_id` que no existen en `courses`, la migración fallará. En ese caso, primero debes limpiar esos datos:
  ```sql
  DELETE FROM organization_course_assignments 
  WHERE course_id NOT IN (SELECT id FROM courses);
  ```
- **Rendimiento**: Se crea un índice automáticamente para mejorar las consultas que filtran por `course_id`

## Verificación
Después de ejecutar la migración, puedes verificar que la foreign key fue creada:
```sql
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'organization_course_assignments'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'course_id';
```

