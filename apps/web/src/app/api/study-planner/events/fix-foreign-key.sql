-- Script para corregir la foreign key de user_calendar_events
-- Ejecuta este script si la tabla ya existe pero tiene la foreign key incorrecta

-- 1. Eliminar la foreign key incorrecta si existe
ALTER TABLE public.user_calendar_events 
DROP CONSTRAINT IF EXISTS user_calendar_events_user_id_fkey;

-- 2. Agregar la foreign key correcta apuntando a public.users
ALTER TABLE public.user_calendar_events 
ADD CONSTRAINT user_calendar_events_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- 3. Verificar que la foreign key se creó correctamente
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
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
    AND tc.table_name = 'user_calendar_events'
    AND kcu.column_name = 'user_id';

