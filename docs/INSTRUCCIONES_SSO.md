# Instrucciones para Habilitar SSO (Google y Microsoft)

Para que los nuevos switches de configuración de SSO funcionen, necesitas agregar dos columnas a tu base de datos Supabase.

Ejecuta el siguiente script en el **Editor SQL** de tu dashboard de Supabase:

```sql
-- Agregar columnas para habilitar/deshabilitar SSO
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS google_login_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS microsoft_login_enabled BOOLEAN DEFAULT FALSE;

-- Actualizar registros existentes para tener valores por defecto
UPDATE public.organizations 
SET google_login_enabled = FALSE 
WHERE google_login_enabled IS NULL;

UPDATE public.organizations 
SET microsoft_login_enabled = FALSE 
WHERE microsoft_login_enabled IS NULL;
```

Una vez ejecutado este script:
1. Recarga la página de configuración en tu navegador.
2. Intenta activar los switches nuevamente.
