-- Función para eliminar usuario en cascada y todas sus referencias
-- Ejecuta este script en el Editor SQL de Supabase

CREATE OR REPLACE FUNCTION delete_user_cascade(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Eliminar referencias en tablas de comunidad / social
  DELETE FROM community_comments WHERE user_id = target_user_id;
  DELETE FROM community_reactions WHERE user_id = target_user_id;
  DELETE FROM community_posts WHERE user_id = target_user_id;
  DELETE FROM community_members WHERE user_id = target_user_id;
  DELETE FROM community_access_requests WHERE requester_id = target_user_id;
  DELETE FROM community_access_requests WHERE reviewed_by = target_user_id;

  -- 2. Eliminar referencias en cursos y aprendizaje
  DELETE FROM user_course_enrollments WHERE user_id = target_user_id;
  DELETE FROM user_lesson_progress WHERE user_id = target_user_id;
  DELETE FROM notes WHERE user_id = target_user_id; -- Notas personales
  
  -- 3. Eliminar sesiones, configuración y sistema
  DELETE FROM user_session WHERE user_id = target_user_id;
  DELETE FROM app_favorites WHERE user_id = target_user_id;
  DELETE FROM organization_users WHERE user_id = target_user_id;
  DELETE FROM password_reset_tokens WHERE user_id = target_user_id;
  
  -- 4. Eliminar logs de auditoría del usuario (para permitir eliminación)
  DELETE FROM audit_logs WHERE user_id = target_user_id;
  
  -- 5. Manejar referencias como Instructor/Creador (Set NULL para conservar contenido)
  -- Si prefieres eliminar el contenido, cambia UPDATE por DELETE
  UPDATE courses SET instructor_id = NULL WHERE instructor_id = target_user_id;
  UPDATE news SET created_by = NULL WHERE created_by = target_user_id;
  
  -- Eliminar lecciones donde es instructor (opcional, si no se hizo update a null)
  -- DELETE FROM course_lessons WHERE instructor_id = target_user_id;

  -- 6. Eliminar usuario de la tabla pública
  DELETE FROM users WHERE id = target_user_id;
  
  -- 7. Eliminar de auth.users (Sistema de autenticación de Supabase)
  -- Esto disparará la eliminación en 'users' si hay Foreign Key on Cascade, 
  -- pero hacerlo manual arriba asegura que no haya errores de restricción.
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
