-- Migration: Organization Isolation Security Strategy
-- ============================================================================
-- IMPORTANT: This application uses CUSTOM AUTHENTICATION (not Supabase Auth)
-- Therefore, RLS policies using auth.uid() will NOT work.
--
-- SECURITY STRATEGY: Application-level filtering
-- All organization isolation is enforced at the API layer using:
-- 1. requireBusiness() middleware - validates user session and org membership
-- 2. withOrganizationFilter() - adds organization_id filter to all queries
-- 3. getOrganizationContext() - extracts org context from request
-- ============================================================================

-- ============================================================================
-- OPTION A: NO RLS (Current Implementation)
-- ============================================================================
-- RLS is NOT enabled on these tables.
-- Security is enforced at the application level via:
-- - requireBusiness() in apps/web/src/lib/auth/requireBusiness.ts
-- - withOrganizationFilter() in apps/web/src/lib/utils/organization-query.ts
-- - Service role key is only used server-side (never exposed to client)

-- This is a valid security model when:
-- ✅ All database access goes through your API routes
-- ✅ Service role key is never exposed to the client
-- ✅ All API routes use requireBusiness() or similar auth middleware
-- ✅ All queries include organization_id filters

-- ============================================================================
-- OPTION B: RLS WITH SERVICE ROLE BYPASS (Alternative)
-- ============================================================================
-- If you want defense-in-depth, you can enable RLS and create policies
-- that allow service_role to bypass (which is the default behavior).
-- This adds protection against accidental queries without org filters.

-- Uncomment below if you want to enable RLS as an additional safety layer:

/*
-- Enable RLS on all organization-isolated tables
ALTER TABLE public.user_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lia_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lia_activity_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies that allow service_role full access
-- (service_role bypasses RLS by default, but explicit policies are clearer)

CREATE POLICY "service_role_full_access" ON public.user_course_enrollments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON public.user_lesson_progress
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON public.user_quiz_submissions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON public.user_course_certificates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON public.user_lesson_notes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON public.lesson_tracking
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON public.daily_progress
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON public.user_streaks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON public.user_activity_log
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON public.lia_conversations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON public.lia_activity_completions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON public.study_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON public.course_questions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON public.course_question_responses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_full_access" ON public.lesson_feedback
  FOR ALL USING (true) WITH CHECK (true);
*/

-- ============================================================================
-- SECURITY CHECKLIST
-- ============================================================================
-- Ensure the following are in place:
--
-- [x] All API routes use requireBusiness() or requireBusinessUser()
-- [x] All queries to org-isolated tables use withOrganizationFilter()
-- [x] Service role key (SUPABASE_SERVICE_ROLE_KEY) is only in server env
-- [x] Client only has access to anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
-- [x] No direct database access from client-side code
-- [x] organization_id is validated against user's memberships before use

-- ============================================================================
-- HELPER FUNCTIONS (Optional - for future use)
-- ============================================================================
-- These functions can be used if you later implement RLS with custom claims

-- Function to check org membership (can be called from application code)
CREATE OR REPLACE FUNCTION public.check_user_org_membership(
  p_user_id uuid,
  p_organization_id uuid
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_users
    WHERE user_id = p_user_id
      AND organization_id = p_organization_id
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user is org admin
CREATE OR REPLACE FUNCTION public.check_user_is_org_admin(
  p_user_id uuid,
  p_organization_id uuid
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_users
    WHERE user_id = p_user_id
      AND organization_id = p_organization_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get user's primary organization
CREATE OR REPLACE FUNCTION public.get_user_primary_organization(p_user_id uuid)
RETURNS uuid AS $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM public.organization_users
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY joined_at ASC
  LIMIT 1;

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- END OF MIGRATION 004
-- ============================================================================
-- Security is enforced at the application layer
-- RLS is NOT enabled (custom auth doesn't use Supabase auth.uid())
-- Helper functions are available for membership checks
