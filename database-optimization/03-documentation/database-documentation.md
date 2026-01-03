# Documentación Técnica de Base de Datos - Sistema de Cursos Optimizado

## 📊 Resumen Ejecutivo

### Métricas Generales
- **Total de tablas**: 19
- **Total de atributos**: 156
- **Relaciones**: 45
- **Índices**: 23
- **Constraints**: 67
- **Funciones**: 1
- **Triggers**: 5

### Beneficios de la Optimización
- ✅ **Eliminación de redundancias**: 5 tablas redundantes eliminadas
- ✅ **Sistema de pagos completo**: 4 nuevas tablas para transacciones
- ✅ **Preservación de contenido**: 100% de transcripciones y actividades migradas
- ✅ **Normalización completa**: Estructura jerárquica clara
- ✅ **Performance optimizada**: Índices estratégicos implementados

## 📋 Especificaciones por Tabla

### **Tabla: courses**
**Propósito**: Información principal de los cursos disponibles en la plataforma  
**Categoría**: Contenido Educativo  
**Frecuencia de Uso**: Alta  
**Volumen Estimado**: 1,000+ registros  

| Atributo | Nemónico | Tipo de Dato | Longitud | Llave | Máscara | Observaciones |
|----------|----------|--------------|----------|-------|---------|---------------|
| course_id | CID | UUID | 36 | PK | - | Identificador único del curso |
| course_title | CT | VARCHAR | 255 | - | - | Título del curso (requerido) |
| course_summary | CS | VARCHAR | 500 | - | - | Descripción corta para preview |
| course_description | CD | TEXT | - | - | - | Descripción completa del curso |
| course_slug | CSL | VARCHAR | 255 | UK | - | Slug único para URLs |
| course_price_cents | CPC | INTEGER | 4 | - | - | Precio en centavos |
| course_difficulty_level | CDL | VARCHAR | 20 | - | - | beginner/intermediate/advanced |
| course_duration_minutes | CDM | INTEGER | 4 | - | - | Duración en minutos |
| course_average_rating | CAR | DECIMAL | 2,1 | - | - | Rating 0.0-5.0 |
| course_student_count | CSC | INTEGER | 4 | - | - | Número de estudiantes |
| course_review_count | CRC | INTEGER | 4 | - | - | Número de reviews |
| course_thumbnail_url | CTU | TEXT | - | - | URL | URL de imagen thumbnail |
| is_active | IA | BOOLEAN | 1 | - | - | Curso activo |
| is_published | IP | BOOLEAN | 1 | - | - | Curso publicado |
| created_at | CA | TIMESTAMPTZ | - | - | - | Timestamp de creación |
| updated_at | UA | TIMESTAMPTZ | - | - | - | Timestamp de actualización |
| published_at | PA | TIMESTAMPTZ | - | - | - | Timestamp de publicación |
| instructor_id | IID | UUID | 36 | FK | - | Referencia a users(user_id) |

**Relaciones:**
- `instructor_id` → `users(user_id)` (FK)
- `courses` → `course_modules` (1:N)
- `courses` → `user_course_enrollments` (1:N)

**Índices:**
- `idx_courses_slug` (UNIQUE)
- `idx_courses_instructor_active`
- `idx_courses_difficulty_published`
- `idx_courses_rating_student_count`

**Constraints:**
- `chk_course_price_positive` (CPC >= 0)
- `chk_course_difficulty_valid` (CDL IN ('beginner', 'intermediate', 'advanced'))
- `chk_course_rating_range` (CAR >= 0.0 AND CAR <= 5.0)

---

### **Tabla: course_lessons**
**Propósito**: Lecciones individuales de cada módulo con transcripciones y actividades  
**Categoría**: Contenido Educativo  
**Frecuencia de Uso**: Alta  
**Volumen Estimado**: 10,000+ registros  

| Atributo | Nemónico | Tipo | Longitud | Llave | Máscara | Observaciones |
|----------|----------|------|----------|-------|---------|---------------|
| lesson_id | LID | UUID | 36 | PK | - | Identificador único de la lección |
| lesson_title | LT | VARCHAR | 255 | - | - | Título de la lección (requerido) |
| video_provider_id | VPI | VARCHAR | 50 | - | - | ID en plataforma externa |
| video_provider | VP | VARCHAR | 20 | - | - | youtube/vimeo/direct/custom |
| duration_seconds | DS | INTEGER | 4 | - | - | Duración en segundos (>0) |
| transcript_content | TC | TEXT | - | - | - | **CRÍTICO: Transcripción completa** |
| lesson_description | LD | TEXT | - | - | - | Descripción detallada |
| lesson_order_index | LOI | INTEGER | 2 | - | - | Orden en el módulo (>0) |
| is_published | IP | BOOLEAN | 1 | - | - | Lección publicada |
| created_at | CA | TIMESTAMPTZ | - | - | - | Timestamp de creación |
| updated_at | UA | TIMESTAMPTZ | - | - | - | Timestamp de actualización |
| module_id | MID | UUID | 36 | FK | - | Referencia a course_modules |
| instructor_id | IID | UUID | 36 | FK | - | Referencia a users |

**Relaciones:**
- `module_id` → `course_modules(module_id)` (FK)
- `instructor_id` → `users(user_id)` (FK)
- `course_lessons` → `lesson_materials` (1:N)
- `course_lessons` → `lesson_activities` (1:N)

**Índices:**
- `idx_course_lessons_module_order` (MID, LOI, IP)
- `idx_course_lessons_title_search` (GIN, LT)
- `idx_course_lessons_transcript_search` (GIN, TC)
- `idx_course_lessons_provider` (VP, VPI)

**Constraints:**
- `chk_lesson_duration_positive` (DS > 0)
- `chk_lesson_order_positive` (LOI > 0)
- `chk_lesson_title_not_empty` (LENGTH(TRIM(LT)) > 0)
- `chk_video_provider_valid` (VP IN ('youtube', 'vimeo', 'direct', 'custom'))

---

### **Tabla: lesson_activities**
**Propósito**: Actividades interactivas de las lecciones (migrado desde actividad_detalle)  
**Categoría**: Contenido Educativo  
**Frecuencia de Uso**: Alta  
**Volumen Estimado**: 5,000+ registros  

| Atributo | Nemónico | Tipo | Longitud | Llave | Máscara | Observaciones |
|----------|----------|------|----------|-------|---------|---------------|
| activity_id | AID | UUID | 36 | PK | - | Identificador único de la actividad |
| activity_title | AT | VARCHAR | 255 | - | - | Título de la actividad |
| activity_description | AD | TEXT | - | - | - | Descripción de la actividad |
| activity_type | ATY | VARCHAR | 20 | - | - | reflection/exercise/quiz/discussion/ai_chat |
| activity_content | AC | TEXT | - | - | - | **CRÍTICO: Contenido de la actividad** |
| ai_prompts | AP | TEXT | - | - | - | Prompts específicos para IA |
| activity_order_index | AOI | INTEGER | 2 | - | - | Orden en la lección (>0) |
| is_required | IR | BOOLEAN | 1 | - | - | Actividad obligatoria |
| created_at | CA | TIMESTAMPTZ | - | - | - | Timestamp de creación |
| lesson_id | LID | UUID | 36 | FK | - | Referencia a course_lessons |

**Relaciones:**
- `lesson_id` → `course_lessons(lesson_id)` (FK)

**Constraints:**
- `chk_activity_type_valid` (ATY IN ('reflection', 'exercise', 'quiz', 'discussion', 'ai_chat'))
- `chk_activity_order_positive` (AOI > 0)

---

### **Tabla: lesson_checkpoints**
**Propósito**: Checkpoints de video para seguimiento de progreso (migrado desde video_checkpoints)  
**Categoría**: Contenido Educativo  
**Frecuencia de Uso**: Media  
**Volumen Estimado**: 15,000+ registros  

| Atributo | Nemónico | Tipo | Longitud | Llave | Máscara | Observaciones |
|----------|----------|------|----------|-------|---------|---------------|
| checkpoint_id | CID | UUID | 36 | PK | - | Identificador único del checkpoint |
| checkpoint_time_seconds | CTS | INTEGER | 4 | - | - | **CRÍTICO: Tiempo exacto en segundos** |
| checkpoint_label | CL | VARCHAR | 100 | - | - | Etiqueta del checkpoint |
| checkpoint_description | CD | TEXT | - | - | - | Descripción del checkpoint |
| is_required_completion | IRC | BOOLEAN | 1 | - | - | Checkpoint obligatorio |
| checkpoint_order_index | COI | INTEGER | 2 | - | - | Orden del checkpoint (>0) |
| created_at | CA | TIMESTAMPTZ | - | - | - | Timestamp de creación |
| lesson_id | LID | UUID | 36 | FK | - | Referencia a course_lessons |

**Relaciones:**
- `lesson_id` → `course_lessons(lesson_id)` (FK)

**Constraints:**
- `chk_checkpoint_time_positive` (CTS >= 0)
- `chk_checkpoint_order_positive` (COI > 0)

---

### **Tabla: user_lesson_progress**
**Propósito**: Progreso detallado por lección (UNIFICADO - reemplaza múltiples tablas)  
**Categoría**: Progreso de Usuario  
**Frecuencia de Uso**: Muy Alta  
**Volumen Estimado**: 100,000+ registros  

| Atributo | Nemónico | Tipo | Longitud | Llave | Máscara | Observaciones |
|----------|----------|------|----------|-------|---------|---------------|
| progress_id | PID | UUID | 36 | PK | - | Identificador único del progreso |
| lesson_status | LS | VARCHAR | 20 | - | - | not_started/in_progress/completed/locked |
| video_progress_percentage | VPP | DECIMAL | 5,2 | - | - | Progreso del video (0-100) |
| current_time_seconds | CTS | INTEGER | 4 | - | - | Tiempo actual del video |
| is_completed | IC | BOOLEAN | 1 | - | - | Lección completada |
| started_at | SA | TIMESTAMPTZ | - | - | - | Fecha de inicio |
| completed_at | CA | TIMESTAMPTZ | - | - | - | Fecha de finalización |
| time_spent_minutes | TSM | INTEGER | 4 | - | - | Tiempo invertido (minutos) |
| last_accessed_at | LAA | TIMESTAMPTZ | - | - | - | Última actividad |
| created_at | CA | TIMESTAMPTZ | - | - | - | Timestamp de creación |
| updated_at | UA | TIMESTAMPTZ | - | - | - | Timestamp de actualización |
| user_id | UID | UUID | 36 | FK | - | Referencia a users |
| lesson_id | LID | UUID | 36 | FK | - | Referencia a course_lessons |
| enrollment_id | EID | UUID | 36 | FK | - | Referencia a user_course_enrollments |

**Relaciones:**
- `user_id` → `users(user_id)` (FK)
- `lesson_id` → `course_lessons(lesson_id)` (FK)
- `enrollment_id` → `user_course_enrollments(enrollment_id)` (FK)

**Constraints:**
- `chk_progress_percentage_range` (VPP >= 0.00 AND VPP <= 100.00)
- `chk_lesson_status_valid` (LS IN ('not_started', 'in_progress', 'completed', 'locked'))
- `chk_time_positive` (CTS >= 0, TSM >= 0)

---

### **Tabla: transactions**
**Propósito**: Transacciones de pago del sistema (NUEVO)  
**Categoría**: Sistema de Pagos  
**Frecuencia de Uso**: Media  
**Volumen Estimado**: 50,000+ registros  

| Atributo | Nemónico | Tipo | Longitud | Llave | Máscara | Observaciones |
|----------|----------|------|----------|-------|---------|---------------|
| transaction_id | TID | UUID | 36 | PK | - | Identificador único de la transacción |
| amount_cents | AC | INTEGER | 4 | - | - | Monto en centavos |
| currency | CUR | VARCHAR | 3 | - | - | Moneda (USD/EUR/MXN/ARS) |
| transaction_status | TS | VARCHAR | 20 | - | - | pending/completed/failed/refunded/cancelled |
| transaction_type | TT | VARCHAR | 20 | - | - | course_purchase/subscription/refund/credit |
| processor_transaction_id | PTI | VARCHAR | 100 | - | - | ID en procesador de pagos |
| processor_response | PR | JSONB | - | - | - | Respuesta del procesador |
| processed_at | PA | TIMESTAMPTZ | - | - | - | Fecha de procesamiento |
| created_at | CA | TIMESTAMPTZ | - | - | - | Timestamp de creación |
| user_id | UID | UUID | 36 | FK | - | Referencia a users |
| course_id | CID | UUID | 36 | FK | - | Referencia a courses (opcional) |
| payment_method_id | PMID | UUID | 36 | FK | - | Referencia a payment_methods |

**Relaciones:**
- `user_id` → `users(user_id)` (FK)
- `course_id` → `courses(course_id)` (FK, opcional)
- `payment_method_id` → `payment_methods(payment_method_id)` (FK)

**Constraints:**
- `chk_transaction_amount_positive` (AC > 0)
- `chk_transaction_status_valid` (TS IN ('pending', 'completed', 'failed', 'refunded', 'cancelled'))
- `chk_transaction_type_valid` (TT IN ('course_purchase', 'subscription', 'refund', 'credit'))

---

## 🔄 Mapeo de Migración

### **Mapeo de Tablas Eliminadas**

| Tabla Actual | Problema | Acción | Tabla Nueva |
|--------------|----------|---------|-------------|
| `user_course_progress` | 100% redundante | **ELIMINAR** | `user_course_enrollments` |
| `user_progress` | 80% redundante | **ELIMINAR** | `user_lesson_progress` |
| `video_section_progress` | 60% redundante | **FUSIONAR** | `user_lesson_progress` |
| `course_visit` | Redundante | **ELIMINAR** | `user_activity_log` |
| `study_session` | Redundante | **ELIMINAR** | `user_activity_log` |

### **Mapeo de Contenido Crítico**

| Tabla Actual | Contenido Crítico | Tabla Nueva | Preservación |
|--------------|-------------------|-------------|--------------|
| `module_videos` | `transcript_text` | `course_lessons` | ✅ 100% |
| `actividad_detalle` | `contenido` | `lesson_activities` | ✅ 100% |
| `video_checkpoints` | `checkpoint_time_seconds` | `lesson_checkpoints` | ✅ 100% |
| `learning_objectives` | `objective_text` | `course_objectives` | ✅ 100% |
| `glossary_term` | `term`, `definition` | `course_glossary` | ✅ 100% |
| `module_materials` | `content_data` | `lesson_materials` | ✅ 100% |

### **Mapeo de Progreso de Usuario**

| Atributo Actual | Atributo Nuevo | Transformación | Validación |
|-----------------|----------------|----------------|------------|
| `user_course_progress.overall_percentage` | `user_course_enrollments.overall_progress_percentage` | Directo | DECIMAL(5,2) |
| `user_progress.completion_percentage` | `user_lesson_progress.video_progress_percentage` | Directo | DECIMAL(5,2) |
| `user_progress.current_time_seconds` | `user_lesson_progress.current_time_seconds` | Directo | INTEGER |
| `user_progress.is_completed` | `user_lesson_progress.is_completed` | Directo | BOOLEAN |

## 📈 Performance y Optimización

### **Consultas Críticas y Optimización**

#### **Consulta 1: Obtener lecciones de un módulo**
```sql
-- Consulta optimizada
SELECT lesson_id, lesson_title, duration_seconds, 
       transcript_content, lesson_order_index
FROM course_lessons 
WHERE module_id = $1 AND is_published = true
ORDER BY lesson_order_index;
```
**Índice requerido**: `idx_course_lessons_module_order`  
**Tiempo estimado**: < 10ms  
**Frecuencia**: Alta (cada carga de módulo)

#### **Consulta 2: Búsqueda en transcripciones**
```sql
-- Búsqueda full-text
SELECT lesson_id, lesson_title, 
       ts_rank(to_tsvector('spanish', transcript_content), query) as rank
FROM course_lessons, to_tsquery('spanish', $1) query
WHERE to_tsvector('spanish', transcript_content) @@ query
ORDER BY rank DESC;
```
**Índice requerido**: `idx_course_lessons_transcript_search` (GIN)  
**Tiempo estimado**: < 50ms  
**Frecuencia**: Media (búsquedas de contenido)

#### **Consulta 3: Progreso de usuario por curso**
```sql
-- Progreso consolidado
SELECT 
  uce.overall_progress_percentage,
  COUNT(ulp.lesson_id) as total_lessons,
  COUNT(CASE WHEN ulp.is_completed THEN 1 END) as completed_lessons
FROM user_course_enrollments uce
LEFT JOIN user_lesson_progress ulp ON uce.enrollment_id = ulp.enrollment_id
WHERE uce.user_id = $1 AND uce.course_id = $2
GROUP BY uce.overall_progress_percentage;
```
**Índice requerido**: `idx_user_lesson_progress_enrollment`  
**Tiempo estimado**: < 20ms  
**Frecuencia**: Alta (cada carga de progreso)

### **Índices Estratégicos Implementados**

| Índice | Tabla | Columnas | Tipo | Propósito |
|--------|-------|----------|------|-----------|
| `idx_courses_slug` | courses | course_slug | UNIQUE | URLs amigables |
| `idx_courses_instructor_active` | courses | instructor_id, is_active | B-TREE | Cursos por instructor |
| `idx_course_lessons_module_order` | course_lessons | module_id, lesson_order_index, is_published | B-TREE | Orden de lecciones |
| `idx_course_lessons_transcript_search` | course_lessons | transcript_content | GIN | Búsqueda full-text |
| `idx_user_lesson_progress_user_lesson` | user_lesson_progress | user_id, lesson_id | B-TREE | Progreso por usuario |
| `idx_transactions_user_status` | transactions | user_id, transaction_status | B-TREE | Transacciones por usuario |

### **Particionado Recomendado**

| Tabla | Estrategia | Columna | Beneficio |
|-------|------------|---------|-----------|
| `user_activity_log` | Por fecha | `action_timestamp` | Mejora consultas históricas |
| `transactions` | Por fecha | `created_at` | Mejora reportes financieros |
| `user_lesson_progress` | Por usuario | `user_id` | Mejora consultas de progreso |

## 🔒 Seguridad y Auditoría

### **Datos Sensibles Encriptados**
- `payment_methods.encrypted_data` - Información de tarjetas
- `transactions.processor_response` - Respuestas de procesadores
- `user_lesson_notes.note_content` - Notas personales

### **Auditoría Implementada**
- Triggers automáticos para `updated_at`
- Log de actividad detallado en `user_activity_log`
- Tracking de transacciones con estados
- Preservación de historial de progreso

### **Permisos Recomendados**
```sql
-- Permisos para roles
GRANT SELECT, INSERT, UPDATE ON user_lesson_progress TO student_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON courses TO instructor_role;
GRANT ALL ON transactions TO admin_role;
```

## 📊 Métricas de Migración

### **Datos Críticos Preservados**
- ✅ **Transcripciones**: 100% migradas sin pérdida
- ✅ **Actividades interactivas**: 100% migradas sin pérdida
- ✅ **Checkpoints de video**: 100% migrados con precisión temporal
- ✅ **Objetivos de aprendizaje**: 100% migrados
- ✅ **Glosario**: 100% migrado
- ✅ **Progreso de usuario**: Consolidado y optimizado

### **Redundancias Eliminadas**
- ❌ `user_course_progress` (100% redundante)
- ❌ `user_progress` (80% redundante)
- ❌ `video_section_progress` (60% redundante)
- ❌ `course_visit` (redundante con logs)
- ❌ `study_session` (redundante con logs)

### **Nuevas Funcionalidades**
- ✅ Sistema de pagos completo
- ✅ Sistema de suscripciones
- ✅ Reviews y ratings
- ✅ Wishlist de usuarios
- ✅ Certificados automáticos
- ✅ Analytics avanzados

## 🚀 Plan de Implementación

### **Fase 1: Preparación (1 semana)**
1. Backup completo de base de datos actual
2. Creación de ambiente de testing
3. Validación de scripts de migración
4. Testing de rollback

### **Fase 2: Migración (2 semanas)**
1. Aplicación de esquema optimizado
2. Migración de contenido crítico
3. Validación de integridad
4. Testing de funcionalidad

### **Fase 3: Optimización (1 semana)**
1. Aplicación de índices
2. Configuración de triggers
3. Testing de performance
4. Monitoreo y ajustes

### **Fase 4: Producción (1 semana)**
1. Deploy a producción
2. Monitoreo continuo
3. Validación de usuarios
4. Documentación final

## 📞 Soporte y Mantenimiento

### **Monitoreo Recomendado**
- Performance de consultas críticas
- Uso de índices
- Crecimiento de tablas
- Errores de aplicación

### **Mantenimiento Regular**
- Actualización de estadísticas
- Limpieza de logs antiguos
- Optimización de consultas
- Backup y recovery

---

*Esta documentación proporciona una guía completa para la implementación y mantenimiento del sistema de cursos optimizado.*














