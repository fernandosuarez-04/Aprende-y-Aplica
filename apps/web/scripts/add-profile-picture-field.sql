-- Agregar campo profile_picture_url a la tabla users si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'profile_picture_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN profile_picture_url TEXT;
        
        RAISE NOTICE 'Campo profile_picture_url agregado a la tabla users';
    ELSE
        RAISE NOTICE 'El campo profile_picture_url ya existe en la tabla users';
    END IF;
END $$;
