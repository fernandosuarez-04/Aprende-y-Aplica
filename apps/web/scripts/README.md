# Scripts de Base de Datos

Este directorio contiene scripts para configurar y mantener la base de datos del proyecto.

## Archivos Incluidos

### 1. `create-ai-directory-tables.sql`
Script principal para crear todas las tablas necesarias para el directorio de IA:

- **ai_categories**: Categorías de prompts y apps
- **ai_prompts**: Prompts de IA con metadatos completos
- **ai_apps**: Herramientas de IA con información detallada
- **prompt_ratings**: Sistema de calificaciones para prompts
- **app_ratings**: Sistema de calificaciones para apps
- **prompt_favorites**: Favoritos de prompts por usuario
- **app_favorites**: Favoritos de apps por usuario

### 2. `seed-ai-directory-data.sql`
Script para poblar las tablas con datos de ejemplo basados en las imágenes proporcionadas:

- 10 categorías predefinidas
- 10+ apps de IA populares (ChatGPT, Claude, Midjourney, etc.)
- 5+ prompts de ejemplo con diferentes niveles de dificultad
- Datos de ejemplo para ratings y estadísticas

### 3. `create-password-reset-tokens-table.sql` ✨ NUEVO
Script para crear la tabla de tokens de recuperación de contraseña:

- **password_reset_tokens**: Almacena tokens seguros para recuperación de contraseña
  - `id` (UUID, PK)
  - `user_id` (UUID, FK → users.id)
  - `token` (VARCHAR 255, UNIQUE) - Token aleatorio de 64 caracteres
  - `expires_at` (TIMESTAMP) - Expiración de 1 hora
  - `created_at` (TIMESTAMP) - Fecha de creación
  - `used_at` (TIMESTAMP) - Fecha de uso (NULL si no usado)

**Características de Seguridad**:
- Tokens de un solo uso
- Expiración automática en 1 hora
- Índices optimizados para búsqueda rápida
- Foreign key con cascada al eliminar usuario

### 4. `setup-password-reset.js` ✨ NUEVO
Script Node.js helper para ejecutar la migración de password reset:

```bash
node scripts/setup-password-reset.js
```

**Características**:
- Verifica variables de entorno
- Intenta ejecutar SQL automáticamente
- Proporciona instrucciones detalladas si falla
- Valida que la tabla se creó correctamente

## Cómo Ejecutar los Scripts

### Opción 1: Usando psql (PostgreSQL)
```bash
# Conectar a la base de datos
psql -h localhost -U tu_usuario -d tu_base_de_datos

# Ejecutar el script de creación de tablas
\i create-ai-directory-tables.sql

# Ejecutar el script de datos de ejemplo
\i seed-ai-directory-data.sql
```

### Opción 2: Usando un cliente de base de datos
1. Abre tu cliente de base de datos preferido (pgAdmin, DBeaver, etc.)
2. Conecta a tu base de datos PostgreSQL
3. Ejecuta el contenido de `create-ai-directory-tables.sql`
4. Ejecuta el contenido de `seed-ai-directory-data.sql`

### Opción 3: Desde la aplicación (si tienes acceso)
Si tu aplicación tiene acceso directo a la base de datos, puedes ejecutar estos scripts desde el código.

### ✨ Para Password Reset (Nuevo Sistema)

#### Método Recomendado: Script Automatizado
```bash
# Desde la carpeta apps/web
cd apps/web
node scripts/setup-password-reset.js
```

#### Método Manual: Supabase Dashboard
1. Abre [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** → **New Query**
4. Copia el contenido de `scripts/create-password-reset-tokens-table.sql`
5. Ejecuta el SQL
6. Verifica: `SELECT * FROM password_reset_tokens LIMIT 1;`

#### Verificar Instalación
```sql
-- Verificar que la tabla existe
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'password_reset_tokens';

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'password_reset_tokens';

-- Verificar foreign key
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
WHERE tc.table_name = 'password_reset_tokens'
  AND tc.constraint_type = 'FOREIGN KEY';
```

## Estructura de las Tablas

### ai_categories
```sql
- category_id (UUID, PK)
- name (VARCHAR)
- slug (VARCHAR, UNIQUE)
- description (TEXT)
- icon (VARCHAR)
- color (VARCHAR - hex color)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

### ai_prompts
```sql
- prompt_id (UUID, PK)
- title (VARCHAR)
- slug (VARCHAR, UNIQUE)
- description (TEXT)
- content (TEXT) - El prompt completo
- category_id (UUID, FK)
- tags (TEXT[])
- difficulty_level (VARCHAR)
- estimated_time_minutes (INTEGER)
- use_cases (TEXT[])
- tips (TEXT[])
- author_id (UUID, FK)
- is_featured (BOOLEAN)
- is_verified (BOOLEAN)
- view_count, like_count, download_count (INTEGER)
- rating (DECIMAL)
- rating_count (INTEGER)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

### ai_apps
```sql
- app_id (UUID, PK)
- name (VARCHAR)
- slug (VARCHAR, UNIQUE)
- description (TEXT)
- long_description (TEXT)
- category_id (UUID, FK)
- website_url (TEXT)
- logo_url (TEXT)
- pricing_model (VARCHAR)
- pricing_details (JSONB)
- features (TEXT[])
- use_cases (TEXT[])
- advantages (TEXT[])
- disadvantages (TEXT[])
- alternatives (TEXT[])
- tags (TEXT[])
- supported_languages (TEXT[])
- integrations (TEXT[])
- api_available (BOOLEAN)
- mobile_app (BOOLEAN)
- desktop_app (BOOLEAN)
- browser_extension (BOOLEAN)
- is_featured (BOOLEAN)
- is_verified (BOOLEAN)
- view_count, like_count (INTEGER)
- rating (DECIMAL)
- rating_count (INTEGER)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

## Características Incluidas

### Funcionalidades Automáticas
- **Triggers de actualización**: Los timestamps se actualizan automáticamente
- **Cálculo de ratings**: Los ratings se calculan automáticamente cuando se agregan nuevas calificaciones
- **Índices optimizados**: Para búsquedas rápidas por categoría, tags, y otros campos

### Datos de Ejemplo
- **Categorías**: Contenido y Escritura, Arte e Ilustración, Desarrollo y Programación, etc.
- **Apps populares**: ChatGPT, Claude 3.5 Sonnet, Midjourney, DALL-E 3, Runway ML, GitHub Copilot, etc.
- **Prompts variados**: Desde principiante hasta avanzado, con diferentes casos de uso

## Notas Importantes

1. **UUIDs**: Las tablas usan UUIDs como claves primarias para mejor escalabilidad
2. **Arrays**: Se usan arrays de PostgreSQL para tags, features, etc.
3. **JSONB**: Para datos flexibles como pricing_details
4. **Índices GIN**: Para búsquedas eficientes en arrays
5. **Soft deletes**: Usando el campo `is_active` en lugar de eliminar registros

## Próximos Pasos

Después de ejecutar estos scripts:

1. Verifica que las tablas se crearon correctamente
2. Confirma que los datos de ejemplo se insertaron
3. Prueba las consultas de la API
4. Personaliza los datos según tus necesidades

## Troubleshooting

### Error: "uuid_generate_v4() does not exist"
```sql
-- Ejecuta este comando para habilitar la extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "GIN index not supported"
```sql
-- Asegúrate de que PostgreSQL soporte índices GIN (versión 9.1+)
SELECT version();
```

### Error de permisos
Asegúrate de que tu usuario de base de datos tenga permisos para:
- Crear tablas
- Crear índices
- Crear funciones y triggers
- Insertar datos
