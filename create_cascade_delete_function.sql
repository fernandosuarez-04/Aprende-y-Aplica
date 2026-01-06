-- Función para eliminar usuario en cascada y todas sus referencias
-- Ejecuta este script en el Editor SQL de Supabase
-- IMPORTANTE: Esta función usa SECURITY DEFINER para bypass RLS
-- y DESHABILITA temporalmente triggers para poder eliminar certificados

DROP FUNCTION IF EXISTS delete_user_cascade(UUID);

CREATE OR REPLACE FUNCTION delete_user_cascade(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
  result JSONB := '{}';
  enrollment_ids UUID[];
BEGIN
  -- ============================================
  -- DESHABILITAR TRIGGERS temporalmente en tablas problemáticas
  -- ============================================
  -- Esto es necesario porque certificate_ledger es append-only
  -- y hay triggers que intentan escribir ahí al eliminar
  
  -- Deshabilitar triggers en user_course_certificates
  BEGIN
    ALTER TABLE user_course_certificates DISABLE TRIGGER ALL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo deshabilitar triggers en user_course_certificates: %', SQLERRM;
  END;
  
  -- Deshabilitar triggers en user_course_enrollments
  BEGIN
    ALTER TABLE user_course_enrollments DISABLE TRIGGER ALL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo deshabilitar triggers en user_course_enrollments: %', SQLERRM;
  END;

  -- ============================================
  -- PASO 1: Obtener enrollment_ids del usuario
  -- ============================================
  SELECT ARRAY_AGG(enrollment_id) INTO enrollment_ids
  FROM user_course_enrollments
  WHERE user_id = target_user_id;
  
  result := result || jsonb_build_object('enrollment_ids_found', COALESCE(array_length(enrollment_ids, 1), 0));

  -- ============================================
  -- PASO 2: LIA y conversaciones
  -- ============================================
  DELETE FROM lia_user_feedback WHERE user_id = target_user_id;
  DELETE FROM lia_activity_completions WHERE user_id = target_user_id;
  DELETE FROM lia_conversations WHERE user_id = target_user_id;

  -- ============================================
  -- PASO 3: Certificados (con triggers deshabilitados)
  -- ============================================
  DELETE FROM user_course_certificates WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  result := result || jsonb_build_object('certificates_deleted', deleted_count);

  -- ============================================
  -- PASO 4: Quiz submissions (dependen de enrollments)
  -- ============================================
  DELETE FROM user_quiz_submissions WHERE user_id = target_user_id;
  -- También eliminar por enrollment_id si existe
  IF enrollment_ids IS NOT NULL AND array_length(enrollment_ids, 1) > 0 THEN
    DELETE FROM user_quiz_submissions WHERE enrollment_id = ANY(enrollment_ids);
  END IF;

  -- ============================================
  -- PASO 5: Progreso de lecciones
  -- ============================================
  DELETE FROM lesson_tracking WHERE user_id = target_user_id;
  DELETE FROM user_lesson_progress WHERE user_id = target_user_id;
  -- También por enrollment_id
  IF enrollment_ids IS NOT NULL AND array_length(enrollment_ids, 1) > 0 THEN
    DELETE FROM user_lesson_progress WHERE enrollment_id = ANY(enrollment_ids);
  END IF;
  DELETE FROM daily_progress WHERE user_id = target_user_id;
  DELETE FROM user_lesson_notes WHERE user_id = target_user_id;

  -- ============================================
  -- PASO 6: Enrollments (con triggers deshabilitados)
  -- ============================================
  DELETE FROM user_course_enrollments WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  result := result || jsonb_build_object('enrollments_deleted', deleted_count);

  -- ============================================
  -- PASO 7: Sesiones de estudio y planes
  -- ============================================
  DELETE FROM study_sessions WHERE user_id = target_user_id;
  DELETE FROM calendar_sync_history WHERE user_id = target_user_id;
  DELETE FROM study_plans WHERE user_id = target_user_id;
  DELETE FROM study_preferences WHERE user_id = target_user_id;
  DELETE FROM user_streaks WHERE user_id = target_user_id;

  -- ============================================
  -- PASO 8: Asignaciones y cursos
  -- ============================================
  DELETE FROM organization_course_assignments WHERE user_id = target_user_id;
  DELETE FROM organization_course_assignments WHERE assigned_by = target_user_id;
  DELETE FROM organization_course_purchases WHERE purchased_by = target_user_id;

  -- ============================================
  -- PASO 9: Q&A de cursos
  -- ============================================
  DELETE FROM course_question_reactions WHERE user_id = target_user_id;
  DELETE FROM course_question_responses WHERE user_id = target_user_id;
  DELETE FROM course_questions WHERE user_id = target_user_id;
  DELETE FROM course_reviews WHERE user_id = target_user_id;
  DELETE FROM lesson_feedback WHERE user_id = target_user_id;

  -- ============================================
  -- PASO 10: Notificaciones
  -- ============================================
  DELETE FROM notification_email_queue WHERE user_id = target_user_id;
  DELETE FROM notification_push_subscriptions WHERE user_id = target_user_id;
  DELETE FROM notification_stats WHERE user_id = target_user_id;
  DELETE FROM user_notification_preferences WHERE user_id = target_user_id;
  DELETE FROM user_notifications WHERE user_id = target_user_id;

  -- ============================================
  -- PASO 11: Calendario
  -- ============================================
  DELETE FROM user_calendar_events WHERE user_id = target_user_id;
  DELETE FROM calendar_subscription_tokens WHERE user_id = target_user_id;
  DELETE FROM calendar_integrations WHERE user_id = target_user_id;

  -- ============================================
  -- PASO 12: SCORM
  -- ============================================
  DELETE FROM scorm_interactions WHERE attempt_id IN (
    SELECT id FROM scorm_attempts WHERE user_id = target_user_id
  );
  DELETE FROM scorm_objectives WHERE attempt_id IN (
    SELECT id FROM scorm_attempts WHERE user_id = target_user_id
  );
  DELETE FROM scorm_attempts WHERE user_id = target_user_id;

  -- ============================================
  -- PASO 13: Transacciones y pagos
  -- ============================================
  DELETE FROM transactions WHERE user_id = target_user_id;
  DELETE FROM subscriptions WHERE user_id = target_user_id;
  DELETE FROM payment_methods WHERE user_id = target_user_id;

  -- ============================================
  -- PASO 14: Auth y sesiones
  -- ============================================
  DELETE FROM oauth_accounts WHERE user_id = target_user_id;
  DELETE FROM password_reset_tokens WHERE user_id = target_user_id;
  DELETE FROM refresh_tokens WHERE user_id = target_user_id;
  DELETE FROM user_session WHERE user_id = target_user_id;

  -- ============================================
  -- PASO 15: Work teams
  -- ============================================
  DELETE FROM work_team_feedback WHERE from_user_id = target_user_id;
  DELETE FROM work_team_feedback WHERE to_user_id = target_user_id;
  DELETE FROM work_team_messages WHERE sender_id = target_user_id;
  DELETE FROM work_team_objectives WHERE created_by = target_user_id;
  DELETE FROM work_team_course_assignments WHERE assigned_by = target_user_id;
  DELETE FROM work_team_members WHERE user_id = target_user_id;
  UPDATE work_teams SET team_leader_id = NULL WHERE team_leader_id = target_user_id;
  UPDATE work_teams SET created_by = NULL WHERE created_by = target_user_id;

  -- ============================================
  -- PASO 16: Perfil y respuestas
  -- ============================================
  DELETE FROM respuestas WHERE user_perfil_id IN (
    SELECT id FROM user_perfil WHERE user_id = target_user_id
  );
  DELETE FROM user_perfil WHERE user_id = target_user_id;

  -- ============================================
  -- PASO 17: Reportes y admin
  -- ============================================
  DELETE FROM reportes_problemas WHERE user_id = target_user_id;
  UPDATE reportes_problemas SET admin_asignado = NULL WHERE admin_asignado = target_user_id;
  DELETE FROM admin_dashboard_layouts WHERE user_id = target_user_id;
  DELETE FROM admin_dashboard_preferences WHERE user_id = target_user_id;

  -- ============================================
  -- PASO 18: Activity logs y tours
  -- ============================================
  DELETE FROM user_activity_log WHERE user_id = target_user_id;
  DELETE FROM user_tour_progress WHERE user_id = target_user_id;

  -- ============================================
  -- PASO 19: Warnings y moderación
  -- ============================================
  DELETE FROM user_warnings WHERE user_id = target_user_id;
  DELETE FROM ai_moderation_logs WHERE user_id = target_user_id;

  -- ============================================
  -- PASO 20: Audit logs
  -- ============================================
  DELETE FROM audit_logs WHERE user_id = target_user_id;
  DELETE FROM audit_logs WHERE admin_user_id = target_user_id;

  -- ============================================
  -- PASO 21: Organization users
  -- ============================================
  UPDATE organization_users SET invited_by = NULL WHERE invited_by = target_user_id;
  DELETE FROM organization_users WHERE user_id = target_user_id;

  -- ============================================
  -- PASO 22: Instructor references
  -- ============================================
  UPDATE courses SET instructor_id = NULL WHERE instructor_id = target_user_id;
  UPDATE courses SET approved_by = NULL WHERE approved_by = target_user_id;
  UPDATE course_lessons SET instructor_id = NULL WHERE instructor_id = target_user_id;
  UPDATE news SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE content_translations SET created_by = NULL WHERE created_by = target_user_id;
  UPDATE scorm_packages SET created_by = NULL WHERE created_by = target_user_id;

  -- ============================================
  -- RE-HABILITAR TRIGGERS
  -- ============================================
  BEGIN
    ALTER TABLE user_course_certificates ENABLE TRIGGER ALL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo habilitar triggers en user_course_certificates: %', SQLERRM;
  END;
  
  BEGIN
    ALTER TABLE user_course_enrollments ENABLE TRIGGER ALL;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo habilitar triggers en user_course_enrollments: %', SQLERRM;
  END;

  -- ============================================
  -- PASO FINAL: Eliminar el usuario
  -- ============================================
  DELETE FROM users WHERE id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  result := result || jsonb_build_object('user_deleted', deleted_count > 0);

  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Re-habilitar triggers en caso de error
    BEGIN
      ALTER TABLE user_course_certificates ENABLE TRIGGER ALL;
      ALTER TABLE user_course_enrollments ENABLE TRIGGER ALL;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Ignorar errores al rehabilitar triggers
    END;
    
    RAISE EXCEPTION 'Error eliminando usuario %: % - %', target_user_id, SQLERRM, SQLSTATE;
END;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION delete_user_cascade(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_cascade(UUID) TO service_role;

-- Comentario de uso:
-- SELECT delete_user_cascade('bee6af85-60b2-4f62-ab8a-e195a89d0fd4');
