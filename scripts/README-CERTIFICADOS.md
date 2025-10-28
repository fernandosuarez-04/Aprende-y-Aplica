# Sistema de Certificados con Blockchain Ledger

## 📋 Descripción

Sistema completo de certificados con **blockchain ledger** para trazabilidad inmutable y verificable de todos los certificados emitidos. Basado en el esquema `BD.sql`.

## 🏗️ Arquitectura Blockchain

### Componentes del Sistema

#### 1. **Tabla de Certificados** (`user_course_certificates`)
Almacena los certificados con su hash único blockchain generado automáticamente.

#### 2. **Ledger Blockchain** (`certificate_ledger`)
Registro **append-only** (solo lectura) tipo blockchain de todas las operaciones:
- **ISSUE** - Emisión de certificado
- **REVOKE** - Revocación de certificado
- **EXPIRE** - Expiración de certificado

#### 3. **Funciones de Blockchain**
- `certificate_hash_immutable()` - Genera hash SHA-256 único (IMMUTABLE, optimizado)
- `ledger_block_hash_immutable()` - Genera hash de bloques del ledger (IMMUTABLE)
- `validate_certificate()` - Valida un certificado por su hash + integridad de la cadena
- `revoke_certificate()` - Revoca certificados agregando bloque al ledger
- `expire_certificate()` - Expira certificados agregando bloque al ledger
- `add_issue_block()` - Trigger automático para crear bloque ISSUE
- `ledger_before_insert()` - Trigger que calcula prev_hash y block_hash
- `forbid_ledger_changes()` - Trigger que impide UPDATE/DELETE (append-only)

## 🔗 Características del Sistema Blockchain

### 1. **Hash Único e Inmutable**

Cada certificado tiene un hash SHA-256 de 64 caracteres generado automáticamente:
```sql
certificate_hash char(64) GENERATED ALWAYS AS (
  certificate_hash_immutable(
    user_id, course_id, enrollment_id, certificate_id, issued_at, certificate_url
  )
) STORED UNIQUE
```

**Función optimizada** (LANGUAGE sql IMMUTABLE):
```sql
certificate_hash_immutable() -- Retorna char(64)
```

**String combinado:**
```
user_id | course_id | enrollment_id | certificate_id | issued_at | certificate_url
```

### 2. **Ledger Blockchain Real (Append-Only)**

Cada operación crea un bloque con:
- `block_id` - ID secuencial del bloque (bigserial)
- `cert_id` - ID del certificado
- `op` - Operación (ISSUE, REVOKE, EXPIRE)
- `payload` - Datos JSON de la operación
- `prev_hash` - Hash del bloque anterior (cadena blockchain)
- `block_hash` - Hash SHA-256 calculado automáticamente
- `created_at` - Timestamp

**Características clave:**
- ✅ **Append-Only**: Triggers impiden UPDATE/DELETE (inmutable)
- ✅ **Cadena de bloques real**: Cada bloque enlaza con el anterior
- ✅ **Hash automático**: Trigger calcula prev_hash y block_hash
- ✅ **Trazabilidad completa**: Historial inalterable
- ✅ **SHA-256**: Función IMMUTABLE optimizada
- ✅ **Imposible falsificar**: Cualquier cambio rompe la cadena

### 3. **Trigger Automático**

Al crear un certificado:
1. Se genera el hash con `certificate_hash_immutable()`
2. Se inserta en `user_course_certificates`
3. **Automáticamente** se crea un bloque ISSUE en el ledger
4. El bloque incluye el prev_hash del último bloque

### 4. **Validación de Certificados**

```sql
SELECT * FROM validate_certificate('abc123...hash...xyz789');
```

**Retorna:**
- `certificate_id` - ID del certificado
- `user_id` - ID del usuario
- `course_title` - Título del curso
- `username` - Nombre de usuario
- `issued_at` - Fecha de emisión
- `expires_at` - Fecha de expiración
- `is_valid` - Si es válido
- `is_expired` - Si está expirado
- `blockchain_hash` - Hash blockchain único

## 🔍 Cómo Funciona

### Flujo de Creación de Certificado

#### 1. Insertar Certificado
```sql
INSERT INTO user_course_certificates (
  certificate_url,
  user_id,
  course_id,
  enrollment_id
) VALUES (
  'https://...',
  'user-uuid',
  'course-uuid',
  'enrollment-uuid'
);
```

#### 2. Sistema Automático
- ✅ Se genera `certificate_id` (UUID)
- ✅ Se genera `certificate_hash` automáticamente
- ✅ Se inserta el certificado
- ✅ **Trigger crea bloque ISSUE en el ledger**
- ✅ El bloque incluye el hash del bloque anterior

#### 3. Estructura del Ledger
```
Bloque 1: ISSUE  [hash: abc123...] prev_hash: 0
Bloque 2: REVOKE [hash: def456...] prev_hash: abc123...
Bloque 3: ISSUE  [hash: ghi789...] prev_hash: def456...
```

### Ejemplo de Hash Blockchain

```
Certificado: a1b2c3d4e5f6...
Ledger Bloque 1: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
Ledger Bloque 2: b2c3d4e5f678901234567890abcdef12345678901234567890abcdef1234567890
```

## 🚀 Instalación

### Orden de Ejecución en Supabase SQL Editor

```bash
# 1. Sistema de certificados blockchain (INCLUYE TODO)
create-blockchain-certificates-system.sql
```

Este script crea:
- ✅ Secuencia `certificate_ledger_block_id_seq`
- ✅ Función `certificate_hash_immutable()`
- ✅ Función `generate_blockchain_hash()`
- ✅ Función `validate_certificate()`
- ✅ Función `get_certificate_blockchain_history()`
- ✅ Función `revoke_certificate()`
- ✅ Tabla `certificate_ledger`
- ✅ Trigger automático
- ✅ Índices optimizados

## 📊 Ejemplos de Uso

### 1. Crear un Certificado (con blockchain automático)
```sql
INSERT INTO user_course_certificates (
  certificate_url,
  user_id,
  course_id,
  enrollment_id
) VALUES (
  'https://storage.supabase.co/bucket/certificados/usuario123_curso456.pdf',
  'usuario-uuid-123',
  'curso-uuid-456',
  'enrollment-uuid-789'
);
-- ✅ El hash se genera automáticamente
-- ✅ Se crea bloque ISSUE en el ledger automáticamente
```

### 2. Validar un Certificado
```sql
-- Validar usando el hash blockchain
SELECT * FROM validate_certificate('abc123...hash...xyz789');

-- Resultado:
-- certificate_id | user_id | course_title | username | issued_at | 
-- is_valid | is_expired | blockchain_hash
```

### 3. Ver Historial Blockchain de un Certificado
```sql
SELECT * FROM get_certificate_blockchain_history('cert-uuid-123');

-- Resultado:
-- block_id | operation | block_hash | prev_hash | payload | created_at
--    1     |  ISSUE    | abc123...  |     0     | {...}   | 2024-01-15
--    2     |  REVOKE   | def456...  | abc123... | {...}   | 2024-01-20
```

### 4. Revocar un Certificado
```sql
SELECT revoke_certificate(
  'cert-uuid-123',
  'Fraude detectado'
);

-- ✅ Crea bloque REVOKE en el ledger
-- ✅ Mantiene trazabilidad completa
-- ✅ No elimina el certificado, solo lo marca
```

### 5. Obtener Certificados de un Usuario
```sql
SELECT 
  cert.certificate_hash,
  c.title as course_title,
  cert.issued_at,
  cert.expires_at,
  cert.certificate_url
FROM user_course_certificates cert
JOIN courses c ON cert.course_id = c.id
WHERE cert.user_id = 'usuario-uuid-123'
ORDER BY cert.issued_at DESC;
```

### 6. Verificar Integridad del Ledger
```sql
-- Verificar la cadena blockchain
SELECT 
  block_id,
  op,
  block_hash,
  prev_hash,
  CASE 
    WHEN prev_hash = '0' THEN 'Bloque Génesis'
    WHEN block_hash != (
      SELECT encode(sha256(
        cert_id::text || '|' || op || '|' || payload::text || '|' || prev_hash || '|' || created_at::text
      )::bytea, 'hex')
      FROM certificate_ledger l2 
      WHERE l2.block_id = l.block_id
    ) THEN 'HASH INVÁLIDO ❌'
    ELSE 'Válido ✅'
  END as estado
FROM certificate_ledger l
ORDER BY block_id;
```

### 7. Buscar Certificado por Hash
```sql
SELECT 
  cert.certificate_id,
  cert.certificate_hash,
  u.username,
  c.title,
  cert.issued_at,
  cert.certificate_url
FROM user_course_certificates cert
JOIN users u ON cert.user_id = u.id
JOIN courses c ON cert.course_id = c.id
WHERE cert.certificate_hash = 'abc123...hash...xyz789';
```

## 🔒 Seguridad y Características

### Seguridad Blockchain
1. **SHA-256**: Hash criptográficamente seguro
2. **Cadena de Bloques**: Cada bloque referencia el anterior
3. **Inmutable**: No se puede modificar sin romper la cadena
4. **Verificable**: Cualquiera puede verificar la integridad
5. **Trazable**: Historial completo de operaciones

### Constraints
- `certificate_hash` UNIQUE - Previene duplicados
- Foreign Keys con CASCADE - Integridad referencial
- CHECK constraints - Validación de datos
- Índices optimizados - Performance en consultas

### Automatización
- ✅ Hash se genera automáticamente
- ✅ Ledger se actualiza automáticamente
- ✅ Validación automática
- ✅ Triggers para consistencia

## 📝 Notas Importantes

1. **Prerequisitos**: Las tablas `users`, `courses` y `user_course_enrollments` deben existir
2. **Orden**: Ejecutar `create-blockchain-certificates-system.sql` después de las tablas base
3. **Performance**: Índices optimizados para búsquedas por hash
4. **Immutabilidad**: El ledger no se debe modificar manualmente
5. **Verificación**: Usar funciones incluidas para validar certificados

## 🎯 Ventajas del Sistema Blockchain Ledger

1. **Autenticidad Absoluta**: Cada certificado tiene hash único imposible de falsificar
2. **Trazabilidad Completa**: Historial inmutable de todas las operaciones
3. **Verificación Pública**: Cualquiera puede validar un certificado con el hash
4. **Inmutable**: Una vez creado, no se puede modificar sin detectarlo
5. **Cadena de Bloques Real**: Sistema de ledger con prev_hash → block_hash
6. **Auditable**: Todas las operaciones quedan registradas permanentemente
7. **Seguro**: SHA-256 es criptográficamente seguro
8. **Sin Red Externa**: Blockchain autónomo en PostgreSQL

## 🔗 Componentes Incluidos

### Tablas
- `user_course_certificates` - Certificados con hash blockchain
- `certificate_ledger` - Ledger blockchain de operaciones

### Secuencias
- `certificate_ledger_block_id_seq` - Secuencia para IDs de bloques

### Funciones
- `certificate_hash_immutable()` - Genera hash único del certificado
- `generate_blockchain_hash()` - Genera hash del bloque del ledger
- `validate_certificate()` - Valida certificado por hash
- `get_certificate_blockchain_history()` - Obtiene historial del ledger
- `revoke_certificate()` - Revoca certificado con trazabilidad
- `add_certificate_to_ledger()` - Trigger automático para el ledger

### Triggers
- `trigger_add_to_ledger` - Inserta automáticamente en el ledger al crear certificado

## 🎓 Uso Práctico

### Para Estudiantes:
```
1. Completar curso → Se genera certificado automáticamente
2. Recibir hash blockchain único (ej: abc123...)
3. Compartir hash para verificación
4. Cualquiera puede validar: SELECT * FROM validate_certificate('abc123...');
```

### Para Emisores:
```
1. Generar PDF del certificado
2. Subir a storage
3. INSERT en user_course_certificates
4. Sistema automáticamente:
   - Genera hash único
   - Crea bloque ISSUE en ledger
   - Enlaza con bloque anterior
```

### Para Verificadores:
```
1. Usuario proporciona hash
2. Ejecutar: SELECT * FROM validate_certificate('hash');
3. Verificar integridad: SELECT * FROM get_certificate_blockchain_history(...)
4. Confirmar autenticidad
```

---

**Versión:** 2.0
**Última actualización:** Diciembre 2024
**Sistema:** Blockchain Ledger Completo

