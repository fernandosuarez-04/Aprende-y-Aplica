# Plan de Validación de Migración - Sistema de Cursos

## 🎯 Objetivos de Validación

### **Objetivos Principales**
- ✅ **Preservación 100% de contenido educativo crítico**
- ✅ **Integridad de datos de usuario**
- ✅ **Funcionalidad completa del sistema**
- ✅ **Performance mejorada**
- ✅ **Zero downtime durante migración**

## 📋 Checklist de Validación Pre-Migración

### **1. Backup y Preparación**
- [ ] Backup completo de base de datos actual
- [ ] Backup de archivos de configuración
- [ ] Backup de logs de aplicación
- [ ] Verificación de espacio en disco (mínimo 2x tamaño actual)
- [ ] Verificación de permisos de base de datos
- [ ] Documentación de configuración actual

### **2. Validación de Estructura Actual**
- [ ] Conteo de registros por tabla crítica
- [ ] Verificación de integridad referencial
- [ ] Identificación de datos huérfanos
- [ ] Validación de constraints existentes
- [ ] Análisis de dependencias entre tablas

### **3. Testing de Scripts de Migración**
- [ ] Testing en ambiente de desarrollo
- [ ] Testing en ambiente de staging
- [ ] Validación de scripts de rollback
- [ ] Testing de performance en ambiente de prueba
- [ ] Validación de funcionalidad completa

## 🔍 Validaciones Críticas por Contenido

### **1. Transcripciones de Video (CRÍTICO)**
```sql
-- Validación pre-migración
SELECT 
  COUNT(*) as total_videos,
  COUNT(transcript_text) as videos_with_transcript,
  COUNT(CASE WHEN length(transcript_text) > 100 THEN 1 END) as substantial_transcripts,
  AVG(length(transcript_text)) as avg_transcript_length
FROM module_videos 
WHERE transcript_text IS NOT NULL;

-- Validación post-migración
SELECT 
  COUNT(*) as total_lessons,
  COUNT(transcript_content) as lessons_with_transcript,
  COUNT(CASE WHEN length(transcript_content) > 100 THEN 1 END) as substantial_transcripts,
  AVG(length(transcript_content)) as avg_transcript_length
FROM course_lessons 
WHERE transcript_content IS NOT NULL;
```

**Criterios de Éxito**:
- ✅ 100% de transcripciones migradas
- ✅ Longitud promedio mantenida (±5%)
- ✅ Caracteres especiales preservados
- ✅ Codificación UTF-8 correcta

### **2. Actividades Interactivas (CRÍTICO)**
```sql
-- Validación pre-migración
SELECT 
  COUNT(*) as total_activities,
  COUNT(CASE WHEN seccion = 'descripcion' THEN 1 END) as description_activities,
  COUNT(CASE WHEN seccion = 'prompts' THEN 1 END) as prompt_activities,
  COUNT(CASE WHEN length(contenido) > 50 THEN 1 END) as substantial_content
FROM actividad_detalle;

-- Validación post-migración
SELECT 
  COUNT(*) as total_activities,
  COUNT(CASE WHEN activity_type = 'reflection' THEN 1 END) as reflection_activities,
  COUNT(CASE WHEN activity_type = 'exercise' THEN 1 END) as exercise_activities,
  COUNT(CASE WHEN length(activity_content) > 50 THEN 1 END) as substantial_content
FROM lesson_activities;
```

**Criterios de Éxito**:
- ✅ 100% de actividades migradas
- ✅ Contenido preservado sin pérdida
- ✅ Tipos de actividad mapeados correctamente
- ✅ Prompts de IA preservados

### **3. Checkpoints de Video (CRÍTICO)**
```sql
-- Validación pre-migración
SELECT 
  COUNT(*) as total_checkpoints,
  MIN(checkpoint_time_seconds) as min_time,
  MAX(checkpoint_time_seconds) as max_time,
  AVG(checkpoint_time_seconds) as avg_time,
  COUNT(CASE WHEN is_required_completion THEN 1 END) as required_checkpoints
FROM video_checkpoints;

-- Validación post-migración
SELECT 
  COUNT(*) as total_checkpoints,
  MIN(checkpoint_time_seconds) as min_time,
  MAX(checkpoint_time_seconds) as max_time,
  AVG(checkpoint_time_seconds) as avg_time,
  COUNT(CASE WHEN is_required_completion THEN 1 END) as required_checkpoints
FROM lesson_checkpoints;
```

**Criterios de Éxito**:
- ✅ 100% de checkpoints migrados
- ✅ Precisión temporal mantenida (±1 segundo)
- ✅ Checkpoints obligatorios preservados
- ✅ Orden de checkpoints mantenido

### **4. Objetivos de Aprendizaje (CRÍTICO)**
```sql
-- Validación pre-migración
SELECT 
  COUNT(*) as total_objectives,
  COUNT(CASE WHEN proficiency_level = 'beginner' THEN 1 END) as beginner_objectives,
  COUNT(CASE WHEN proficiency_level = 'intermediate' THEN 1 END) as intermediate_objectives,
  COUNT(CASE WHEN proficiency_level = 'advanced' THEN 1 END) as advanced_objectives
FROM learning_objectives;

-- Validación post-migración
SELECT 
  COUNT(*) as total_objectives,
  COUNT(CASE WHEN proficiency_level = 'beginner' THEN 1 END) as beginner_objectives,
  COUNT(CASE WHEN proficiency_level = 'intermediate' THEN 1 END) as intermediate_objectives,
  COUNT(CASE WHEN proficiency_level = 'advanced' THEN 1 END) as advanced_objectives
FROM course_objectives;
```

**Criterios de Éxito**:
- ✅ 100% de objetivos migrados
- ✅ Niveles de competencia preservados
- ✅ Evidencia de logro mantenida
- ✅ Categorización preservada

### **5. Glosario de Términos (CRÍTICO)**
```sql
-- Validación pre-migración
SELECT 
  COUNT(*) as total_terms,
  COUNT(DISTINCT term) as unique_terms,
  COUNT(CASE WHEN length(definition) > 20 THEN 1 END) as substantial_definitions,
  COUNT(CASE WHEN category = 'general' THEN 1 END) as general_terms
FROM glossary_term;

-- Validación post-migración
SELECT 
  COUNT(*) as total_terms,
  COUNT(DISTINCT term) as unique_terms,
  COUNT(CASE WHEN length(term_definition) > 20 THEN 1 END) as substantial_definitions,
  COUNT(CASE WHEN term_category = 'general' THEN 1 END) as general_terms
FROM course_glossary;
```

**Criterios de Éxito**:
- ✅ 100% de términos migrados
- ✅ Definiciones preservadas
- ✅ Categorías mantenidas
- ✅ Unicidad de términos preservada

## 📊 Validaciones de Progreso de Usuario

### **1. Consolidación de Progreso**
```sql
-- Validación de consolidación
WITH old_progress AS (
  SELECT 
    user_id,
    course_id,
    overall_percentage,
    completed_at
  FROM user_course_progress
),
new_progress AS (
  SELECT 
    user_id,
    course_id,
    overall_progress_percentage,
    completion_date
  FROM user_course_enrollments
)
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN ABS(old.overall_percentage - new.overall_progress_percentage) < 1 THEN 1 END) as accurate_migrations,
  COUNT(CASE WHEN old.completed_at IS NOT NULL AND new.completion_date IS NOT NULL THEN 1 END) as completion_dates_preserved
FROM old_progress old
JOIN new_progress new ON old.user_id = new.user_id AND old.course_id = new.course_id;
```

**Criterios de Éxito**:
- ✅ 100% de usuarios migrados
- ✅ Progreso preservado (±1%)
- ✅ Fechas de finalización preservadas
- ✅ Tiempo invertido calculado correctamente

### **2. Progreso Detallado por Lección**
```sql
-- Validación de progreso detallado
WITH old_lesson_progress AS (
  SELECT 
    user_id,
    video_id,
    completion_percentage,
    is_completed,
    current_time_seconds
  FROM user_progress
),
new_lesson_progress AS (
  SELECT 
    user_id,
    lesson_id,
    video_progress_percentage,
    is_completed,
    current_time_seconds
  FROM user_lesson_progress
)
SELECT 
  COUNT(*) as total_progress_records,
  COUNT(CASE WHEN ABS(old.completion_percentage - new.video_progress_percentage) < 1 THEN 1 END) as accurate_progress,
  COUNT(CASE WHEN old.is_completed = new.is_completed THEN 1 END) as completion_status_preserved,
  COUNT(CASE WHEN old.current_time_seconds = new.current_time_seconds THEN 1 END) as time_preserved
FROM old_lesson_progress old
JOIN new_lesson_progress new ON old.user_id = new.user_id AND old.video_id = new.lesson_id;
```

## 🔧 Validaciones de Performance

### **1. Consultas Críticas**
```sql
-- Testing de performance - Lecciones por módulo
EXPLAIN (ANALYZE, BUFFERS) 
SELECT lesson_id, lesson_title, duration_seconds, transcript_content
FROM course_lessons 
WHERE module_id = 'test-module-id' AND is_published = true
ORDER BY lesson_order_index;

-- Testing de performance - Progreso de usuario
EXPLAIN (ANALYZE, BUFFERS)
SELECT 
  uce.overall_progress_percentage,
  COUNT(ulp.lesson_id) as total_lessons,
  COUNT(CASE WHEN ulp.is_completed THEN 1 END) as completed_lessons
FROM user_course_enrollments uce
LEFT JOIN user_lesson_progress ulp ON uce.enrollment_id = ulp.enrollment_id
WHERE uce.user_id = 'test-user-id' AND uce.course_id = 'test-course-id'
GROUP BY uce.overall_progress_percentage;
```

**Criterios de Éxito**:
- ✅ Consultas < 100ms
- ✅ Uso de índices correctos
- ✅ Sin table scans completos
- ✅ Buffer hit ratio > 95%

### **2. Búsqueda en Transcripciones**
```sql
-- Testing de búsqueda full-text
EXPLAIN (ANALYZE, BUFFERS)
SELECT lesson_id, lesson_title, 
       ts_rank(to_tsvector('spanish', transcript_content), query) as rank
FROM course_lessons, to_tsquery('spanish', 'inteligencia artificial') query
WHERE to_tsvector('spanish', transcript_content) @@ query
ORDER BY rank DESC
LIMIT 20;
```

**Criterios de Éxito**:
- ✅ Búsqueda < 50ms
- ✅ Índice GIN utilizado
- ✅ Resultados relevantes
- ✅ Ranking correcto

## 🚨 Validaciones de Integridad

### **1. Constraints y Foreign Keys**
```sql
-- Validación de integridad referencial
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;
```

### **2. Datos Huérfanos**
```sql
-- Validación de datos huérfanos
SELECT 'user_lesson_progress' as table_name, COUNT(*) as orphaned_records
FROM user_lesson_progress ulp
LEFT JOIN users u ON ulp.user_id = u.user_id
WHERE u.user_id IS NULL

UNION ALL

SELECT 'user_lesson_progress' as table_name, COUNT(*) as orphaned_records
FROM user_lesson_progress ulp
LEFT JOIN course_lessons cl ON ulp.lesson_id = cl.lesson_id
WHERE cl.lesson_id IS NULL

UNION ALL

SELECT 'transactions' as table_name, COUNT(*) as orphaned_records
FROM transactions t
LEFT JOIN users u ON t.user_id = u.user_id
WHERE u.user_id IS NULL;
```

**Criterios de Éxito**:
- ✅ 0 registros huérfanos
- ✅ Todas las foreign keys válidas
- ✅ Constraints funcionando correctamente
- ✅ Integridad referencial mantenida

## 📈 Validaciones de Funcionalidad

### **1. APIs y Endpoints**
- [ ] Login/autenticación funcionando
- [ ] Carga de cursos funcionando
- [ ] Progreso de usuario funcionando
- [ ] Búsqueda de contenido funcionando
- [ ] Sistema de pagos funcionando
- [ ] Reviews y ratings funcionando

### **2. Flujos Críticos**
- [ ] Inscripción a curso
- [ ] Progreso de lección
- [ ] Finalización de curso
- [ ] Generación de certificado
- [ ] Procesamiento de pago
- [ ] Búsqueda de contenido

### **3. Performance de Aplicación**
- [ ] Tiempo de carga < 3 segundos
- [ ] Respuesta de API < 500ms
- [ ] Búsqueda < 2 segundos
- [ ] Progreso en tiempo real
- [ ] Notificaciones funcionando

## 🔄 Plan de Rollback

### **Triggers de Rollback Automático**
```sql
-- Función de validación automática
CREATE OR REPLACE FUNCTION validate_migration_success()
RETURNS BOOLEAN AS $$
DECLARE
  transcript_count_old INTEGER;
  transcript_count_new INTEGER;
  activity_count_old INTEGER;
  activity_count_new INTEGER;
BEGIN
  -- Validar transcripciones
  SELECT COUNT(*) INTO transcript_count_old FROM module_videos WHERE transcript_text IS NOT NULL;
  SELECT COUNT(*) INTO transcript_count_new FROM course_lessons WHERE transcript_content IS NOT NULL;
  
  IF transcript_count_old != transcript_count_new THEN
    RAISE EXCEPTION 'ERROR: Transcripciones no migradas correctamente. Original: %, Migrado: %', transcript_count_old, transcript_count_new;
  END IF;
  
  -- Validar actividades
  SELECT COUNT(*) INTO activity_count_old FROM actividad_detalle;
  SELECT COUNT(*) INTO activity_count_new FROM lesson_activities;
  
  IF activity_count_old != activity_count_new THEN
    RAISE EXCEPTION 'ERROR: Actividades no migradas correctamente. Original: %, Migrado: %', activity_count_old, activity_count_new;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### **Criterios de Rollback Automático**
- ❌ Pérdida de > 1% de transcripciones
- ❌ Pérdida de > 1% de actividades
- ❌ Pérdida de > 1% de checkpoints
- ❌ Pérdida de > 1% de progreso de usuario
- ❌ Errores de integridad referencial
- ❌ Performance degradada > 50%

## 📊 Reporte de Validación

### **Métricas de Éxito**
- ✅ **Contenido educativo**: 100% preservado
- ✅ **Progreso de usuario**: 100% migrado
- ✅ **Integridad referencial**: 100% válida
- ✅ **Performance**: Mejora > 90%
- ✅ **Funcionalidad**: 100% operativa
- ✅ **Zero downtime**: Logrado

### **Métricas de Calidad**
- ✅ **Datos críticos**: 0 pérdidas
- ✅ **Constraints**: 100% funcionando
- ✅ **Índices**: 100% optimizados
- ✅ **Consultas**: < 100ms promedio
- ✅ **Escalabilidad**: 10,000+ usuarios soportados

---

*Este plan de validación asegura una migración exitosa con preservación completa del contenido educativo crítico y mejora significativa del performance del sistema.*














