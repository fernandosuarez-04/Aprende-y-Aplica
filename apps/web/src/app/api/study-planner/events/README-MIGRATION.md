# Migración: Tabla user_calendar_events

## ⚠️ IMPORTANTE: Ejecutar esta migración antes de usar eventos personalizados

La tabla `user_calendar_events` es necesaria para almacenar eventos de calendario personalizados creados por el usuario.

## 📋 Cómo ejecutar la migración

### Opción 1: Supabase Dashboard (Recomendado)

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** → **New Query**
4. Copia el contenido completo del archivo `migration.sql`
5. Pega el SQL en el editor
6. Haz clic en **RUN** (o presiona `Ctrl+Enter`)
7. Verifica que no haya errores

### Opción 2: Supabase CLI

```bash
# Si tienes Supabase CLI instalado
supabase db push
```

### Verificar que la migración se ejecutó correctamente

Ejecuta este SQL en Supabase SQL Editor:

```sql
-- Verificar que la tabla existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_calendar_events';

-- Verificar las columnas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_calendar_events';

-- Verificar las políticas RLS
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_calendar_events';
```

## ✅ Después de ejecutar la migración

Una vez ejecutada la migración, podrás:
- ✅ Crear eventos personalizados
- ✅ Editar eventos (incluyendo cambiar el color)
- ✅ Eliminar eventos
- ✅ Sincronizar eventos con Google Calendar

## 🔧 Solución de problemas

### Error: "insert or update on table 'user_calendar_events' violates foreign key constraint"

**Causa**: La foreign key está apuntando a `auth.users` en lugar de `public.users`.

**Solución**: Ejecuta el script `fix-foreign-key.sql` en Supabase SQL Editor para corregir la foreign key.

### Error: "Could not find the table 'public.user_calendar_events' in the schema cache"

**Causa 1**: La migración no se ha ejecutado.

**Solución**: Ejecuta la migración siguiendo los pasos de arriba.

**Causa 2**: PostgREST (API REST de Supabase) aún no ha actualizado su caché de esquema.

**Solución**: 
1. Ejecuta el script `force-refresh-cache.sql` en Supabase SQL Editor
2. Espera 1-2 minutos
3. Recarga la página de la aplicación
4. Si persiste, reinicia tu proyecto de Supabase: **Settings** → **Restart Project**

### Error: "permission denied for table user_calendar_events"

**Causa**: Las políticas RLS no se crearon correctamente.

**Solución**: Ejecuta nuevamente la sección de RLS del archivo `migration.sql`.

### El color no se guarda al editar eventos

**Causa**: El color se está enviando pero no se está guardando en la base de datos.

**Solución**: 
1. Verifica que la tabla tiene la columna `color` ejecutando:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_calendar_events' 
AND column_name = 'color';
```

2. Si la columna no existe, ejecuta:
```sql
ALTER TABLE public.user_calendar_events 
ADD COLUMN IF NOT EXISTS color TEXT;
```

