# Configuración de Fotos de Perfil para Comunidades

## Descripción

Este conjunto de scripts configura el sistema de fotos de perfil para las comunidades, permitiendo que los usuarios vean sus nombres y fotos en lugar de solo emails.

## Scripts Incluidos

### 1. `check-users-table-structure.sql`
Verifica la estructura actual de la tabla `users` para ver qué campos están disponibles.

### 2. `add-profile-picture-field.sql`
Agrega el campo `profile_picture_url` a la tabla `users` si no existe.

### 3. `add-sample-profile-pictures.sql`
Agrega fotos de perfil de ejemplo usando Gravatar basado en el email del usuario.

## Instrucciones de Ejecución

### Paso 1: Verificar la estructura de la tabla
```sql
-- Ejecutar en Supabase SQL Editor
\i apps/web/scripts/check-users-table-structure.sql
```

### Paso 2: Agregar el campo profile_picture_url
```sql
-- Ejecutar en Supabase SQL Editor
\i apps/web/scripts/add-profile-picture-field.sql
```

### Paso 3: Agregar fotos de perfil de ejemplo
```sql
-- Ejecutar en Supabase SQL Editor
\i apps/web/scripts/add-sample-profile-pictures.sql
```

## Resultado Esperado

Después de ejecutar estos scripts:

1. **En los posts**: Los usuarios verán sus nombres completos (ej: "Fernando Suarez") en lugar de emails
2. **Avatares**: Se mostrarán fotos de perfil generadas por Gravatar o iniciales como fallback
3. **Panel de creación**: El usuario actual verá su foto/nombre en el panel para escribir posts

## Fallbacks Implementados

El sistema tiene múltiples niveles de fallback:

1. **Foto de perfil**: Si `profile_picture_url` existe, se muestra la imagen
2. **Iniciales del nombre**: Si hay `first_name` y `last_name`, se muestran las iniciales
3. **Inicial del username**: Si solo hay `username`, se muestra la primera letra
4. **Icono genérico**: Si no hay información, se muestra el icono de usuarios

## Notas Técnicas

- Las fotos de Gravatar se generan automáticamente basadas en el hash MD5 del email
- El parámetro `d=identicon` genera avatares únicos y coloridos
- El parámetro `s=200` establece el tamaño de la imagen a 200px
- El sistema es compatible con futuras implementaciones de subida de fotos personalizadas
