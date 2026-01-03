# Asignación de Dificultad a Preguntas Existentes

## ⚠️ Importante

Para que el sistema funcione correctamente y muestre solo 12 preguntas (6 de Adopción + 6 de Conocimiento) según la dificultad del usuario, **todas las preguntas en la tabla `preguntas` deben tener el campo `dificultad` asignado** con un valor entre 1 y 5.

## 📋 Pasos para Asignar Dificultad

### 1. Verificar Preguntas sin Dificultad

```sql
-- Ver cuántas preguntas no tienen dificultad asignada
SELECT COUNT(*) 
FROM preguntas 
WHERE dificultad IS NULL;
```

### 2. Asignar Dificultad según el Bloque y Rol

La dificultad debe asignarse según la complejidad de la pregunta:

- **Dificultad 1**: Preguntas muy básicas (uso básico, conceptos simples)
- **Dificultad 2**: Preguntas básicas-intermedias
- **Dificultad 3**: Preguntas intermedias
- **Dificultad 4**: Preguntas avanzadas
- **Dificultad 5**: Preguntas muy avanzadas (estrategia, gobierno, escalamiento)

### 3. Script de Ejemplo para Asignar Dificultad

```sql
-- Ejemplo: Asignar dificultad basada en el bloque y rol
-- Ajustar según la lógica de negocio

-- Preguntas de Adopción básicas (dificultad 1-2)
UPDATE preguntas
SET dificultad = CASE
  WHEN bloque ILIKE '%Adopción%' AND exclusivo_rol_id IN (17, 18, 19, 20, 21, 22, 23, 28) THEN 1  -- Miembros
  WHEN bloque ILIKE '%Adopción%' AND exclusivo_rol_id IN (4, 5, 6, 24) THEN 2  -- Gerencia
  WHEN bloque ILIKE '%Adopción%' AND exclusivo_rol_id IN (2, 3, 11, 12, 13, 14, 15, 16, 27) THEN 3  -- Dirección
  WHEN bloque ILIKE '%Adopción%' AND exclusivo_rol_id = 1 THEN 4  -- CEO
  ELSE dificultad
END
WHERE bloque ILIKE '%Adopción%' AND (dificultad IS NULL OR dificultad = 0);

-- Preguntas de Conocimiento (dificultad 1-2 para básicas, 3-4 para avanzadas)
UPDATE preguntas
SET dificultad = CASE
  WHEN bloque ILIKE '%Conocimiento%' AND exclusivo_rol_id IN (17, 18, 19, 20, 21, 22, 23, 28) THEN 1  -- Miembros
  WHEN bloque ILIKE '%Conocimiento%' AND exclusivo_rol_id IN (4, 5, 6, 24) THEN 2  -- Gerencia
  WHEN bloque ILIKE '%Conocimiento%' AND exclusivo_rol_id IN (2, 3, 11, 12, 13, 14, 15, 16, 27) THEN 3  -- Dirección
  WHEN bloque ILIKE '%Conocimiento%' AND exclusivo_rol_id = 1 THEN 4  -- CEO
  ELSE dificultad
END
WHERE bloque ILIKE '%Conocimiento%' AND (dificultad IS NULL OR dificultad = 0);
```

### 4. Verificar Asignación

```sql
-- Verificar que todas las preguntas tengan dificultad
SELECT 
  dificultad,
  bloque,
  COUNT(*) as total
FROM preguntas
GROUP BY dificultad, bloque
ORDER BY dificultad, bloque;

-- Verificar preguntas sin dificultad
SELECT id, codigo, bloque, exclusivo_rol_id, area_id
FROM preguntas
WHERE dificultad IS NULL
LIMIT 20;
```

## 🎯 Distribución Recomendada

Para cada combinación de (rol, área, dificultad), debería haber:
- **Mínimo 6 preguntas de Adopción**
- **Mínimo 6 preguntas de Conocimiento**

Esto asegura que siempre haya suficientes preguntas para mostrar el cuestionario completo.

## 📝 Notas

- Si una pregunta no tiene `dificultad` asignada, **NO aparecerá** en los cuestionarios
- El sistema prioriza preguntas específicas del rol sobre preguntas generales
- Si no hay suficientes preguntas para una dificultad específica, el sistema mostrará un warning en los logs


















