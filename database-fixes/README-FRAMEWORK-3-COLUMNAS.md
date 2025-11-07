# Actualización: Actividad "Framework de 3 Columnas" con LIA

## 📋 Descripción

Esta actualización convierte la actividad "Framework de 3 Columnas: Identificando Oportunidades de IA" de la lección 3.1 en una **actividad interactiva con LIA**.

## 🎯 Objetivo

Permitir que los usuarios completen el Framework de 3 Columnas de manera conversacional con LIA, quien:
- Guía paso a paso en la identificación de tareas repetitivas
- Ayuda a definir datos de entrada y decisiones
- Evalúa las tareas según criterios de éxito
- **Genera un CSV descargable** con todos los resultados

## 🔄 Cambios Realizados

### 1. Tipo de Actividad
- **Antes:** `exercise` (ejercicio estático)
- **Después:** `ai_chat` (actividad interactiva con LIA)

### 2. Contenido de la Actividad
Se creó un guión conversacional estructurado que incluye:

#### Paso 1: Identificar Tareas Repetitivas (5-10 tareas)
LIA solicita que el usuario liste tareas repetitivas de su trabajo diario.

#### Paso 2: Definir Datos (Inputs)
Para cada tarea, LIA pregunta qué información necesita el usuario para completarla.

#### Paso 3: Definir Decisión (Inferencia)
LIA ayuda a identificar la decisión clara y específica que se toma con esos datos.

#### Paso 4: Evaluación con 3 Criterios
LIA evalúa cada tarea según:
- ✅ Alto Volumen
- ✅ Basada en Datos
- ✅ Decisión Clara

#### Paso 5: Selección del Caso de Uso #1
LIA presenta el ranking y ayuda a seleccionar el mejor caso de uso.

#### Paso 6: Generación del CSV
LIA genera un CSV formateado con todos los resultados:
```csv
Tarea Repetitiva,Datos (Inputs),Decisión (Inferencia),Volumen,Basada en Datos,Decisión Clara,Puntuación Total,Es Caso de Uso #1
```

## 🚀 Cómo Aplicar la Actualización

### Opción 1: Usando Supabase Dashboard (Recomendado)

1. Abre el Dashboard de Supabase
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `update-framework-3-columnas-activity.sql`
4. Ejecuta la consulta
5. Verifica en la tabla `activities` que el cambio se aplicó correctamente

### Opción 2: Usando CLI de Supabase

```bash
# Ejecutar el script SQL
supabase db execute -f database-fixes/update-framework-3-columnas-activity.sql

# Verificar el cambio
supabase db execute --query "SELECT activity_id, activity_title, activity_type FROM activities WHERE activity_title ILIKE '%Framework%'"
```

### Opción 3: Usando psql

```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f database-fixes/update-framework-3-columnas-activity.sql
```

## ✅ Verificación

Después de aplicar el script, verifica que:

1. **El tipo de actividad cambió:**
   ```sql
   SELECT activity_title, activity_type 
   FROM activities 
   WHERE activity_title ILIKE '%Framework%';
   ```
   Debe mostrar `activity_type = 'ai_chat'`

2. **El contenido se actualizó:**
   ```sql
   SELECT activity_title, LEFT(activity_content, 100) 
   FROM activities 
   WHERE activity_title ILIKE '%Framework%';
   ```
   Debe comenzar con "Lia (IA): ¡Hola! 👋..."

3. **El botón "Interactuar con LIA" aparece:**
   - Ve a la lección 3.1 en la interfaz
   - Ve a la pestaña "Actividades"
   - Debes ver el botón morado "Interactuar con LIA"

## 🎓 Experiencia del Usuario

### Antes (Ejercicio Estático)
- Usuario lee instrucciones largas
- Abre bloc de notas externo
- Completa manualmente las 3 columnas
- No hay seguimiento ni validación

### Después (Actividad Interactiva con LIA)
- Usuario hace clic en "Interactuar con LIA"
- LIA guía paso a paso en el chat
- LIA valida y ofrece feedback
- LIA genera CSV automáticamente
- Experiencia gamificada y motivadora

## 📊 Estructura del CSV Generado

El CSV que LIA genera incluye las siguientes columnas:

1. **Tarea Repetitiva**: La tarea identificada
2. **Datos (Inputs)**: Los datos necesarios para la tarea
3. **Decisión (Inferencia)**: La decisión que se toma
4. **Volumen**: Si ocurre frecuentemente (SÍ/NO)
5. **Basada en Datos**: Si la decisión depende de datos (SÍ/NO)
6. **Decisión Clara**: Si la decisión es específica (SÍ/NO)
7. **Puntuación Total**: Suma de criterios cumplidos (X/3)
8. **Es Caso de Uso #1**: Si es la mejor oportunidad (SÍ/NO)

## 🐛 Troubleshooting

### Problema: El botón no aparece
**Solución:** Verifica que `activity_type = 'ai_chat'` en la base de datos

### Problema: LIA no sigue el guión
**Solución:** Asegúrate de que el `activity_content` se copió correctamente con todos los separadores `---`

### Problema: No se genera el CSV
**Solución:** El CSV se genera en el chat como texto formateado. El usuario puede copiarlo y pegarlo en Excel/Google Sheets o guardarlo manualmente.

## 🔮 Mejoras Futuras

- [ ] Botón de descarga directa del CSV
- [ ] Visualización gráfica del ranking de tareas
- [ ] Integración con Google Sheets
- [ ] Exportar a formato Excel (.xlsx)
- [ ] Guardar el CSV en el perfil del usuario

## 📝 Notas Importantes

1. **Separadores `---`**: Son críticos para que LIA entienda el flujo conversacional
2. **Formato del CSV**: LIA lo genera como texto en el chat - el usuario debe copiarlo
3. **Longitud del guión**: ~3000 caracteres - dentro del límite de mensajes del sistema
4. **Retrocompatibilidad**: Las actividades existentes NO se ven afectadas

## 🤝 Soporte

Si tienes problemas con la actualización:
1. Verifica los logs de Supabase
2. Revisa la consola del navegador
3. Contacta al equipo de desarrollo

---

**Versión:** 1.0  
**Fecha:** 4 de noviembre de 2025  
**Autor:** Sistema de IA educativa
