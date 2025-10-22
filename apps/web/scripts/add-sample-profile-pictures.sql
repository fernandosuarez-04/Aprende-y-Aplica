-- Agregar fotos de perfil de ejemplo a usuarios existentes
-- Usando avatares de Gravatar como ejemplo

UPDATE public.users 
SET profile_picture_url = 'https://www.gravatar.com/avatar/' || md5(email) || '?d=identicon&s=200'
WHERE profile_picture_url IS NULL;

-- Verificar que se actualizaron los usuarios
SELECT id, email, first_name, last_name, profile_picture_url 
FROM public.users 
WHERE profile_picture_url IS NOT NULL
LIMIT 5;
