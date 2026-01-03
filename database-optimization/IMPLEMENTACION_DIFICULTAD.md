# Implementación del Sistema de Dificultad en Cuestionarios

## 📋 Resumen de Cambios

Se ha implementado un sistema de asignación de dificultad para personalizar los cuestionarios según el perfil del usuario. El sistema asigna uno de 5 niveles de dificultad (1=muy básico, 5=muy avanzado) basado en:
- **Cargo/Rol**: Roles estratégicos tienen más peso
- **Nivel organizacional**: Niveles altos tienen más peso  
- **Uso de IA**: Mayor uso de IA aumenta la dificultad

## 🔧 Cambios Realizados

### 1. Base de Datos

**Archivo**: `database-optimization/02-schema/add_dificultad_fields.sql`

- ✅ Agregado campo `dificultad` (integer, 1-5) a la tabla `preguntas`
- ✅ Agregado campo `dificultad_id` (integer, 1-5) a la tabla `user_perfil`
- ✅ Agregado campo `uso_ia_respuesta` (text) a la tabla `user_perfil`
- ✅ Creados índices para optimizar consultas

**Ejecutar el script SQL antes de usar el sistema:**
```sql
-- Ejecutar en Supabase SQL Editor
\i database-optimization/02-schema/add_dificultad_fields.sql
```

### 2. Formulario de Perfil Inicial

**Archivo**: `apps/web/src/app/statistics/page.tsx`

#### Cambios realizados:
- ✅ **Cargo/Título**: Cambiado de textbox a combobox con roles de la BD
- ✅ **Nueva pregunta**: "¿Qué tanto utilizas la Inteligencia Artificial en tu ámbito laboral?"
  - Opciones: Nunca, Rara vez, A veces, Frecuentemente, Siempre
- ✅ **Lógica de cálculo**: Función `calcularDificultad()` que asigna nivel 1-5

#### Lógica de Cálculo de Dificultad:

```typescript
dificultad = 1 + factorNivel + factorRol + factorIA
```

**Factores:**
- **Factor Nivel**: (nivel_id - 1) * 0.5
  - Nivel 1 = +0, Nivel 2 = +0.5, Nivel 3 = +1, Nivel 4 = +1.5
- **Factor Rol**:
  - Roles estratégicos (CEO, CTO, CFO, Dirección) = +1.5
  - Gerencia Media = +1
  - Miembros/Operativos = +0.5
- **Factor IA**:
  - Siempre = +2
  - Frecuentemente = +1.5
  - A veces = +1
  - Rara vez = +0.5
  - Nunca = 0

### 3. API de Perfil

**Archivo**: `apps/web/src/app/api/statistics/profile/route.ts`

- ✅ Actualizado para aceptar y guardar `dificultad_id` y `uso_ia_respuesta`
- ✅ Validación de campos requeridos actualizada

### 4. API de Preguntas

**Archivos**: 
- `apps/web/src/app/api/questionnaire/questions/route.ts`
- `apps/web/src/app/api/questionnaire/questions-client/route.ts`

#### Cambios realizados:
- ✅ Filtrado por `dificultad_id` del usuario
- ✅ Límite de **12 preguntas** por cuestionario
- ✅ Validación de que el usuario tenga `dificultad_id` asignado

**Query de ejemplo:**
```sql
SELECT * FROM preguntas
WHERE dificultad = [dificultad_id_usuario]
  AND (area_id = [area_id] OR area_id IS NULL)
  AND (exclusivo_rol_id = [rol_id] OR exclusivo_rol_id IS NULL)
ORDER BY section, bloque, id
LIMIT 12;
```

## 📊 Flujo del Sistema

1. **Usuario completa perfil inicial**:
   - Selecciona cargo (combobox con roles de BD)
   - Selecciona nivel organizacional
   - Selecciona área funcional
   - Responde pregunta sobre uso de IA

2. **Sistema calcula dificultad**:
   - Basado en cargo + nivel + uso de IA
   - Asigna nivel 1-5

3. **Sistema guarda perfil**:
   - Guarda `dificultad_id` en `user_perfil`
   - Guarda `uso_ia_respuesta` en `user_perfil`

4. **Usuario accede a cuestionario**:
   - Sistema obtiene `dificultad_id` del perfil
   - Filtra preguntas por dificultad + área + rol
   - Limita a 12 preguntas

## 🎯 Próximos Pasos

### Para completar la implementación:

1. **Ejecutar script SQL**:
   ```bash
   # En Supabase SQL Editor
   \i database-optimization/02-schema/add_dificultad_fields.sql
   ```

2. **Actualizar preguntas existentes**:
   - Asignar campo `dificultad` (1-5) a todas las preguntas en la tabla `preguntas`
   - Las preguntas deben tener valores de dificultad según su complejidad

3. **Verificar datos de prueba**:
   - Crear usuario de prueba
   - Completar perfil inicial
   - Verificar que se asigne correctamente el `dificultad_id`
   - Verificar que el cuestionario muestre 12 preguntas filtradas

## 📝 Notas Importantes

- **Compatibilidad**: Los usuarios existentes sin `dificultad_id` recibirán un error y deberán completar el perfil nuevamente
- **Preguntas sin dificultad**: Las preguntas con `dificultad IS NULL` no aparecerán en los cuestionarios
- **Límite de preguntas**: El sistema siempre mostrará máximo 12 preguntas por cuestionario

## 🔍 Validación

Para validar que todo funciona:

1. Crear un nuevo usuario
2. Completar el formulario de perfil inicial
3. Verificar en BD que `user_perfil.dificultad_id` tenga un valor 1-5
4. Acceder al cuestionario
5. Verificar que se muestren exactamente 12 preguntas
6. Verificar que las preguntas tengan el `dificultad` correspondiente

## 📚 Referencias

- Estructura de BD: `database-optimization/02-schema/NewBDStructure.sql`
- Script de migración: `database-optimization/02-schema/add_dificultad_fields.sql`
- Formulario: `apps/web/src/app/statistics/page.tsx`
- API de perfil: `apps/web/src/app/api/statistics/profile/route.ts`
- API de preguntas: `apps/web/src/app/api/questionnaire/questions/route.ts`


















