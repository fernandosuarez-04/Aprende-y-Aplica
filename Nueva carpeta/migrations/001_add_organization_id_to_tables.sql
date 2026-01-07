-- Migration: Add organization_id to tables for organization-level data isolation
-- Run this migration in order, as some tables depend on others
-- WARNING: Create a full database backup before running this migration

-- ============================================================================
-- PHASE 1: Add organization_id columns (all nullable initially)
-- ============================================================================

-- 1. user_course_enrollments
-- Primary table for tracking user enrollment in courses per organization
ALTER TABLE public.user_course_enrollments
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.user_course_enrollments
  ADD CONSTRAINT user_course_enrollments_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.user_course_enrollments.organization_id IS
  'Organization context for this enrollment. NULL for B2C users.';

-- 2. user_lesson_progress
-- Tracks lesson-by-lesson progress within a course
ALTER TABLE public.user_lesson_progress
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.user_lesson_progress
  ADD CONSTRAINT user_lesson_progress_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.user_lesson_progress.organization_id IS
  'Organization context for this progress. NULL for B2C users.';

-- 3. user_quiz_submissions
-- Tracks quiz attempts and scores
ALTER TABLE public.user_quiz_submissions
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.user_quiz_submissions
  ADD CONSTRAINT user_quiz_submissions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.user_quiz_submissions.organization_id IS
  'Organization context for this submission. NULL for B2C users.';

-- 4. user_course_certificates
-- Stores issued certificates
ALTER TABLE public.user_course_certificates
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.user_course_certificates
  ADD CONSTRAINT user_course_certificates_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.user_course_certificates.organization_id IS
  'Organization context for this certificate. NULL for B2C users.';

-- 5. user_lesson_notes
-- User notes on lessons
ALTER TABLE public.user_lesson_notes
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.user_lesson_notes
  ADD CONSTRAINT user_lesson_notes_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.user_lesson_notes.organization_id IS
  'Organization context for these notes. NULL for B2C users.';

-- 6. lesson_tracking
-- Detailed tracking of lesson engagement
ALTER TABLE public.lesson_tracking
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.lesson_tracking
  ADD CONSTRAINT lesson_tracking_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.lesson_tracking.organization_id IS
  'Organization context for this tracking record. NULL for B2C users.';

-- 7. daily_progress
-- Daily study progress aggregation
ALTER TABLE public.daily_progress
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.daily_progress
  ADD CONSTRAINT daily_progress_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.daily_progress.organization_id IS
  'Organization context for daily progress. NULL for B2C users.';

-- 8. user_streaks (SPECIAL CASE - requires PK change)
-- First, add the new columns
ALTER TABLE public.user_streaks
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Drop the old primary key constraint
ALTER TABLE public.user_streaks
  DROP CONSTRAINT IF EXISTS user_streaks_pkey;

-- Set the new primary key
ALTER TABLE public.user_streaks
  ADD CONSTRAINT user_streaks_pkey PRIMARY KEY (id);

-- Add foreign key for organization
ALTER TABLE public.user_streaks
  ADD CONSTRAINT user_streaks_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

-- Add unique constraint for user+org combination
ALTER TABLE public.user_streaks
  ADD CONSTRAINT user_streaks_user_org_unique
  UNIQUE (user_id, organization_id);

COMMENT ON COLUMN public.user_streaks.organization_id IS
  'Organization context for streak tracking. NULL for B2C users.';

-- 9. user_activity_log
-- Activity logging for analytics
ALTER TABLE public.user_activity_log
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.user_activity_log
  ADD CONSTRAINT user_activity_log_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.user_activity_log.organization_id IS
  'Organization context for this activity. NULL for B2C users.';

-- 10. lia_conversations
-- LIA chatbot conversations
ALTER TABLE public.lia_conversations
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.lia_conversations
  ADD CONSTRAINT lia_conversations_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.lia_conversations.organization_id IS
  'Organization context for this conversation. NULL for B2C users.';

-- 11. lia_activity_completions
-- LIA activity completion tracking
ALTER TABLE public.lia_activity_completions
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.lia_activity_completions
  ADD CONSTRAINT lia_activity_completions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.lia_activity_completions.organization_id IS
  'Organization context for this completion. NULL for B2C users.';

-- 12. study_sessions
-- Study session scheduling and tracking
ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.study_sessions
  ADD CONSTRAINT study_sessions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.study_sessions.organization_id IS
  'Organization context for this session. NULL for B2C users.';

-- 13. course_questions
-- Questions asked in courses
ALTER TABLE public.course_questions
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.course_questions
  ADD CONSTRAINT course_questions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.course_questions.organization_id IS
  'Organization context for this question. NULL for B2C users.';

-- 14. course_question_responses
-- Responses to course questions
ALTER TABLE public.course_question_responses
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.course_question_responses
  ADD CONSTRAINT course_question_responses_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.course_question_responses.organization_id IS
  'Organization context for this response. NULL for B2C users.';

-- 15. lesson_feedback
-- Feedback on lessons (likes/dislikes)
ALTER TABLE public.lesson_feedback
  ADD COLUMN IF NOT EXISTS organization_id uuid;

ALTER TABLE public.lesson_feedback
  ADD CONSTRAINT lesson_feedback_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.lesson_feedback.organization_id IS
  'Organization context for this feedback. NULL for B2C users.';

-- ============================================================================
-- PHASE 2: Verify organizations table has slug NOT NULL UNIQUE
-- ============================================================================

-- Ensure slug is NOT NULL (may already be set)
DO $$
BEGIN
  -- Check if slug column allows NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'organizations'
    AND column_name = 'slug'
    AND is_nullable = 'YES'
  ) THEN
    -- Update any NULL slugs first (generate from name)
    UPDATE public.organizations
    SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
    WHERE slug IS NULL;

    -- Now set NOT NULL
    ALTER TABLE public.organizations
    ALTER COLUMN slug SET NOT NULL;
  END IF;
END $$;

-- Ensure unique index exists on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug
  ON public.organizations(slug);

-- ============================================================================
-- END OF MIGRATION 001
-- ============================================================================
-- Next: Run 002_add_indexes.sql to add performance indexes
-- Then: Run 003_migrate_existing_data.sql to populate organization_id values
