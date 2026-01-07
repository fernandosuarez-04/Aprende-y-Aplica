-- Migration: Add indexes for organization_id columns
-- These indexes optimize queries that filter by organization
-- Note: CONCURRENTLY removed because Supabase runs migrations in transaction blocks

-- ============================================================================
-- PERFORMANCE INDEXES FOR ORGANIZATION FILTERING
-- ============================================================================

-- 1. user_course_enrollments
-- Primary index for enrollment lookups by org + user + course
CREATE INDEX IF NOT EXISTS idx_enrollments_org_user_course
  ON public.user_course_enrollments(organization_id, user_id, course_id);

-- Index for listing all enrollments in an organization
CREATE INDEX IF NOT EXISTS idx_enrollments_org
  ON public.user_course_enrollments(organization_id)
  WHERE organization_id IS NOT NULL;

-- Unique constraint: one enrollment per user+course+org
-- This prevents duplicate enrollments within the same organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_unique_per_org
  ON public.user_course_enrollments(user_id, course_id, organization_id);

-- 2. user_lesson_progress
-- Index for progress lookups by org + user
CREATE INDEX IF NOT EXISTS idx_progress_org_user
  ON public.user_lesson_progress(organization_id, user_id);

-- Index for lesson progress within org
CREATE INDEX IF NOT EXISTS idx_progress_org_lesson
  ON public.user_lesson_progress(organization_id, lesson_id);

-- 3. user_quiz_submissions
-- Index for quiz lookups by org + user
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_org_user
  ON public.user_quiz_submissions(organization_id, user_id);

-- Index for quiz submissions by enrollment
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_org_enrollment
  ON public.user_quiz_submissions(organization_id, enrollment_id);

-- 4. user_course_certificates
-- Index for certificate lookups by org + user
CREATE INDEX IF NOT EXISTS idx_certificates_org_user
  ON public.user_course_certificates(organization_id, user_id);

-- Index for certificate lookups by org + course
CREATE INDEX IF NOT EXISTS idx_certificates_org_course
  ON public.user_course_certificates(organization_id, course_id);

-- 5. user_lesson_notes
-- Index for notes lookups by org + user
CREATE INDEX IF NOT EXISTS idx_notes_org_user
  ON public.user_lesson_notes(organization_id, user_id);

-- Index for notes by lesson within org
CREATE INDEX IF NOT EXISTS idx_notes_org_lesson
  ON public.user_lesson_notes(organization_id, lesson_id);

-- 6. lesson_tracking
-- Index for tracking lookups by org + user
CREATE INDEX IF NOT EXISTS idx_lesson_tracking_org_user
  ON public.lesson_tracking(organization_id, user_id);

-- Index for tracking by session
CREATE INDEX IF NOT EXISTS idx_lesson_tracking_org_session
  ON public.lesson_tracking(organization_id, session_id)
  WHERE session_id IS NOT NULL;

-- 7. daily_progress
-- Index for daily progress by org + user + date
CREATE INDEX IF NOT EXISTS idx_daily_progress_org_user_date
  ON public.daily_progress(organization_id, user_id, progress_date);

-- Unique constraint for daily progress per user+date+org
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_progress_unique_per_org
  ON public.daily_progress(user_id, progress_date, organization_id);

-- 8. user_streaks
-- Index for streak lookups by org + user (already has unique constraint)
CREATE INDEX IF NOT EXISTS idx_streaks_org
  ON public.user_streaks(organization_id)
  WHERE organization_id IS NOT NULL;

-- 9. user_activity_log
-- Index for activity logs by org + user
CREATE INDEX IF NOT EXISTS idx_activity_log_org_user
  ON public.user_activity_log(organization_id, user_id);

-- Index for activity logs by org + timestamp (for analytics)
CREATE INDEX IF NOT EXISTS idx_activity_log_org_timestamp
  ON public.user_activity_log(organization_id, action_timestamp DESC);

-- 10. lia_conversations
-- Index for conversation lookups by org + user
CREATE INDEX IF NOT EXISTS idx_lia_conversations_org_user
  ON public.lia_conversations(organization_id, user_id);

-- Index for recent conversations in org
CREATE INDEX IF NOT EXISTS idx_lia_conversations_org_started
  ON public.lia_conversations(organization_id, started_at DESC);

-- 11. lia_activity_completions
-- Index for completions by org + user
CREATE INDEX IF NOT EXISTS idx_lia_completions_org_user
  ON public.lia_activity_completions(organization_id, user_id);

-- 12. study_sessions
-- Index for sessions by org + user
CREATE INDEX IF NOT EXISTS idx_study_sessions_org_user
  ON public.study_sessions(organization_id, user_id);

-- Index for sessions by org + status (for finding planned sessions)
CREATE INDEX IF NOT EXISTS idx_study_sessions_org_status
  ON public.study_sessions(organization_id, status)
  WHERE status IN ('planned', 'in_progress');

-- Index for sessions by org + start time (for scheduling)
CREATE INDEX IF NOT EXISTS idx_study_sessions_org_start
  ON public.study_sessions(organization_id, start_time);

-- 13. course_questions
-- Index for questions by org + course
CREATE INDEX IF NOT EXISTS idx_questions_org_course
  ON public.course_questions(organization_id, course_id);

-- Index for questions by org + user
CREATE INDEX IF NOT EXISTS idx_questions_org_user
  ON public.course_questions(organization_id, user_id);

-- 14. course_question_responses
-- Index for responses by org + question
CREATE INDEX IF NOT EXISTS idx_responses_org_question
  ON public.course_question_responses(organization_id, question_id);

-- Index for responses by org + user
CREATE INDEX IF NOT EXISTS idx_responses_org_user
  ON public.course_question_responses(organization_id, user_id);

-- 15. lesson_feedback
-- Index for feedback by org + lesson
CREATE INDEX IF NOT EXISTS idx_feedback_org_lesson
  ON public.lesson_feedback(organization_id, lesson_id);

-- Index for feedback by org + user
CREATE INDEX IF NOT EXISTS idx_feedback_org_user
  ON public.lesson_feedback(organization_id, user_id);

-- ============================================================================
-- PARTIAL INDEXES FOR B2C USERS (organization_id IS NULL)
-- These optimize queries for users without organization context
-- ============================================================================

-- B2C enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_b2c
  ON public.user_course_enrollments(user_id, course_id)
  WHERE organization_id IS NULL;

-- B2C progress
CREATE INDEX IF NOT EXISTS idx_progress_b2c
  ON public.user_lesson_progress(user_id, lesson_id)
  WHERE organization_id IS NULL;

-- B2C study sessions
CREATE INDEX IF NOT EXISTS idx_sessions_b2c
  ON public.study_sessions(user_id, start_time)
  WHERE organization_id IS NULL;

-- ============================================================================
-- ANALYZE TABLES TO UPDATE STATISTICS
-- ============================================================================

ANALYZE public.user_course_enrollments;
ANALYZE public.user_lesson_progress;
ANALYZE public.user_quiz_submissions;
ANALYZE public.user_course_certificates;
ANALYZE public.user_lesson_notes;
ANALYZE public.lesson_tracking;
ANALYZE public.daily_progress;
ANALYZE public.user_streaks;
ANALYZE public.user_activity_log;
ANALYZE public.lia_conversations;
ANALYZE public.lia_activity_completions;
ANALYZE public.study_sessions;
ANALYZE public.course_questions;
ANALYZE public.course_question_responses;
ANALYZE public.lesson_feedback;

-- ============================================================================
-- END OF MIGRATION 002
-- ============================================================================
-- Next: Run 003_migrate_existing_data.sql to populate organization_id values
