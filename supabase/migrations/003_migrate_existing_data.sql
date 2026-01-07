-- Migration: Populate organization_id for existing records
-- Strategy: Auto-assign to user's primary (first joined) organization
-- Records for users without organization membership remain NULL (B2C)

-- ============================================================================
-- HELPER: Get primary organization for a user
-- Returns the first organization the user joined (by joined_at date)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_primary_org(p_user_id uuid)
RETURNS uuid AS $$
  SELECT organization_id
  FROM public.organization_users
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY COALESCE(joined_at, created_at) ASC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- MIGRATION: user_course_enrollments
-- ============================================================================

-- First, try to match via organization_course_assignments
UPDATE public.user_course_enrollments e
SET organization_id = (
  SELECT oca.organization_id
  FROM public.organization_course_assignments oca
  WHERE oca.user_id = e.user_id
    AND oca.course_id = e.course_id
    AND oca.status != 'cancelled'
  ORDER BY oca.assigned_at DESC
  LIMIT 1
)
WHERE e.organization_id IS NULL;

-- For remaining records, use user's primary organization
UPDATE public.user_course_enrollments e
SET organization_id = get_user_primary_org(e.user_id)
WHERE e.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = e.user_id AND ou.status = 'active'
  );

-- Log migration stats
DO $$
DECLARE
  total_count INTEGER;
  migrated_count INTEGER;
  b2c_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.user_course_enrollments;
  SELECT COUNT(*) INTO migrated_count FROM public.user_course_enrollments WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO b2c_count FROM public.user_course_enrollments WHERE organization_id IS NULL;

  RAISE NOTICE 'user_course_enrollments: Total=%, Migrated=%, B2C=%', total_count, migrated_count, b2c_count;
END $$;

-- ============================================================================
-- MIGRATION: user_lesson_progress
-- Inherit organization from enrollment
-- ============================================================================

UPDATE public.user_lesson_progress p
SET organization_id = (
  SELECT e.organization_id
  FROM public.user_course_enrollments e
  WHERE e.enrollment_id = p.enrollment_id
)
WHERE p.organization_id IS NULL
  AND p.enrollment_id IS NOT NULL;

-- For records without enrollment_id, use user's primary org
UPDATE public.user_lesson_progress p
SET organization_id = get_user_primary_org(p.user_id)
WHERE p.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = p.user_id AND ou.status = 'active'
  );

-- ============================================================================
-- MIGRATION: user_quiz_submissions
-- Inherit organization from enrollment
-- ============================================================================

UPDATE public.user_quiz_submissions s
SET organization_id = (
  SELECT e.organization_id
  FROM public.user_course_enrollments e
  WHERE e.enrollment_id = s.enrollment_id
)
WHERE s.organization_id IS NULL
  AND s.enrollment_id IS NOT NULL;

-- Fallback to user's primary org
UPDATE public.user_quiz_submissions s
SET organization_id = get_user_primary_org(s.user_id)
WHERE s.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = s.user_id AND ou.status = 'active'
  );

-- ============================================================================
-- MIGRATION: user_course_certificates
-- Inherit organization from enrollment
-- ============================================================================

UPDATE public.user_course_certificates c
SET organization_id = (
  SELECT e.organization_id
  FROM public.user_course_enrollments e
  WHERE e.enrollment_id = c.enrollment_id
)
WHERE c.organization_id IS NULL
  AND c.enrollment_id IS NOT NULL;

-- Fallback to user's primary org
UPDATE public.user_course_certificates c
SET organization_id = get_user_primary_org(c.user_id)
WHERE c.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = c.user_id AND ou.status = 'active'
  );

-- ============================================================================
-- MIGRATION: user_lesson_notes
-- ============================================================================

UPDATE public.user_lesson_notes n
SET organization_id = get_user_primary_org(n.user_id)
WHERE n.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = n.user_id AND ou.status = 'active'
  );

-- ============================================================================
-- MIGRATION: lesson_tracking
-- Inherit from study_plans if available, else from session, else user's primary
-- ============================================================================

-- From study_plans
UPDATE public.lesson_tracking lt
SET organization_id = (
  SELECT sp.organization_id
  FROM public.study_plans sp
  WHERE sp.id = lt.plan_id
)
WHERE lt.organization_id IS NULL
  AND lt.plan_id IS NOT NULL;

-- From study_sessions
UPDATE public.lesson_tracking lt
SET organization_id = (
  SELECT ss.organization_id
  FROM public.study_sessions ss
  WHERE ss.id = lt.session_id
)
WHERE lt.organization_id IS NULL
  AND lt.session_id IS NOT NULL;

-- Fallback to user's primary org
UPDATE public.lesson_tracking lt
SET organization_id = get_user_primary_org(lt.user_id)
WHERE lt.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = lt.user_id AND ou.status = 'active'
  );

-- ============================================================================
-- MIGRATION: daily_progress
-- ============================================================================

UPDATE public.daily_progress dp
SET organization_id = get_user_primary_org(dp.user_id)
WHERE dp.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = dp.user_id AND ou.status = 'active'
  );

-- ============================================================================
-- MIGRATION: user_streaks
-- ============================================================================

UPDATE public.user_streaks us
SET organization_id = get_user_primary_org(us.user_id)
WHERE us.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = us.user_id AND ou.status = 'active'
  );

-- ============================================================================
-- MIGRATION: user_activity_log
-- ============================================================================

UPDATE public.user_activity_log al
SET organization_id = get_user_primary_org(al.user_id)
WHERE al.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = al.user_id AND ou.status = 'active'
  );

-- ============================================================================
-- MIGRATION: lia_conversations
-- ============================================================================

UPDATE public.lia_conversations lc
SET organization_id = get_user_primary_org(lc.user_id)
WHERE lc.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = lc.user_id AND ou.status = 'active'
  );

-- ============================================================================
-- MIGRATION: lia_activity_completions
-- Inherit from conversation
-- ============================================================================

UPDATE public.lia_activity_completions lac
SET organization_id = (
  SELECT lc.organization_id
  FROM public.lia_conversations lc
  WHERE lc.conversation_id = lac.conversation_id
)
WHERE lac.organization_id IS NULL
  AND lac.conversation_id IS NOT NULL;

-- Fallback
UPDATE public.lia_activity_completions lac
SET organization_id = get_user_primary_org(lac.user_id)
WHERE lac.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = lac.user_id AND ou.status = 'active'
  );

-- ============================================================================
-- MIGRATION: study_sessions
-- Inherit from study_plans if available
-- ============================================================================

UPDATE public.study_sessions ss
SET organization_id = (
  SELECT sp.organization_id
  FROM public.study_plans sp
  WHERE sp.id = ss.plan_id
)
WHERE ss.organization_id IS NULL
  AND ss.plan_id IS NOT NULL;

-- Fallback to user's primary org
UPDATE public.study_sessions ss
SET organization_id = get_user_primary_org(ss.user_id)
WHERE ss.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = ss.user_id AND ou.status = 'active'
  );

-- ============================================================================
-- MIGRATION: course_questions
-- ============================================================================

UPDATE public.course_questions cq
SET organization_id = get_user_primary_org(cq.user_id)
WHERE cq.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = cq.user_id AND ou.status = 'active'
  );

-- ============================================================================
-- MIGRATION: course_question_responses
-- Inherit from question if same org, else use user's primary
-- ============================================================================

UPDATE public.course_question_responses r
SET organization_id = (
  SELECT q.organization_id
  FROM public.course_questions q
  WHERE q.id = r.question_id
)
WHERE r.organization_id IS NULL
  AND r.question_id IS NOT NULL;

-- Fallback
UPDATE public.course_question_responses r
SET organization_id = get_user_primary_org(r.user_id)
WHERE r.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = r.user_id AND ou.status = 'active'
  );

-- ============================================================================
-- MIGRATION: lesson_feedback
-- ============================================================================

UPDATE public.lesson_feedback lf
SET organization_id = get_user_primary_org(lf.user_id)
WHERE lf.organization_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_users ou
    WHERE ou.user_id = lf.user_id AND ou.status = 'active'
  );

-- ============================================================================
-- SUMMARY: Log migration statistics
-- ============================================================================

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT 'user_course_enrollments' AS table_name,
           COUNT(*) FILTER (WHERE organization_id IS NOT NULL) AS migrated,
           COUNT(*) FILTER (WHERE organization_id IS NULL) AS b2c
    FROM public.user_course_enrollments
    UNION ALL
    SELECT 'user_lesson_progress',
           COUNT(*) FILTER (WHERE organization_id IS NOT NULL),
           COUNT(*) FILTER (WHERE organization_id IS NULL)
    FROM public.user_lesson_progress
    UNION ALL
    SELECT 'user_quiz_submissions',
           COUNT(*) FILTER (WHERE organization_id IS NOT NULL),
           COUNT(*) FILTER (WHERE organization_id IS NULL)
    FROM public.user_quiz_submissions
    UNION ALL
    SELECT 'user_course_certificates',
           COUNT(*) FILTER (WHERE organization_id IS NOT NULL),
           COUNT(*) FILTER (WHERE organization_id IS NULL)
    FROM public.user_course_certificates
    UNION ALL
    SELECT 'study_sessions',
           COUNT(*) FILTER (WHERE organization_id IS NOT NULL),
           COUNT(*) FILTER (WHERE organization_id IS NULL)
    FROM public.study_sessions
    UNION ALL
    SELECT 'lia_conversations',
           COUNT(*) FILTER (WHERE organization_id IS NOT NULL),
           COUNT(*) FILTER (WHERE organization_id IS NULL)
    FROM public.lia_conversations
  LOOP
    RAISE NOTICE '% - Migrated: %, B2C (NULL): %', rec.table_name, rec.migrated, rec.b2c;
  END LOOP;
END $$;

-- ============================================================================
-- CLEANUP: Drop helper function (optional, can keep for future use)
-- ============================================================================

-- Uncomment to remove the helper function after migration
-- DROP FUNCTION IF EXISTS get_user_primary_org(uuid);

-- ============================================================================
-- END OF MIGRATION 003
-- ============================================================================
-- Next: Run 004_add_rls_policies.sql to add Row Level Security
