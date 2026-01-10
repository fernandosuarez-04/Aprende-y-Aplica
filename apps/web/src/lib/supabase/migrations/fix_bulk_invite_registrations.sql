-- Migration: Fix bulk_invite_registrations table
-- Description: Change user_id FK from auth.users to public.users
-- Note: This project does NOT use Supabase Auth, so no RLS policies needed
-- Date: 2026-01-09

-- Step 1: Drop the existing foreign key constraint on bulk_invite_registrations (if references auth.users)
ALTER TABLE IF EXISTS public.bulk_invite_registrations
  DROP CONSTRAINT IF EXISTS bulk_invite_registrations_user_id_fkey;

-- Step 2: Add the correct foreign key constraint referencing public.users
ALTER TABLE public.bulk_invite_registrations
  ADD CONSTRAINT bulk_invite_registrations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 3: Fix created_by FK on bulk_invite_links (if it references auth.users)
ALTER TABLE IF EXISTS public.bulk_invite_links
  DROP CONSTRAINT IF EXISTS bulk_invite_links_created_by_fkey;

ALTER TABLE public.bulk_invite_links
  ADD CONSTRAINT bulk_invite_links_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Step 4: Disable RLS on these tables (since project doesn't use Supabase Auth)
ALTER TABLE public.bulk_invite_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_invite_registrations DISABLE ROW LEVEL SECURITY;

-- Step 5: Drop any existing RLS policies that might cause issues
DROP POLICY IF EXISTS "Organization admins can view bulk invite links" ON public.bulk_invite_links;
DROP POLICY IF EXISTS "Organization admins can create bulk invite links" ON public.bulk_invite_links;
DROP POLICY IF EXISTS "Organization admins can update bulk invite links" ON public.bulk_invite_links;
DROP POLICY IF EXISTS "Organization admins can delete bulk invite links" ON public.bulk_invite_links;
DROP POLICY IF EXISTS "Anyone can read active links by token" ON public.bulk_invite_links;
DROP POLICY IF EXISTS "Allow read by token" ON public.bulk_invite_links;
DROP POLICY IF EXISTS "Allow increment current_uses" ON public.bulk_invite_links;

DROP POLICY IF EXISTS "Organization admins can view bulk invite registrations" ON public.bulk_invite_registrations;
DROP POLICY IF EXISTS "Allow registration insert" ON public.bulk_invite_registrations;

COMMENT ON TABLE public.bulk_invite_links IS 'Stores bulk invitation links for organizations - No RLS (custom auth)';
COMMENT ON TABLE public.bulk_invite_registrations IS 'Tracks users registered via bulk invite links - No RLS (custom auth)';
