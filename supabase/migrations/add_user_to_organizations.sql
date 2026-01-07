-- Script: Add user to multiple organizations for testing
-- User ID: 0d510ab0-05fc-4506-bb94-985928ac4bb6
-- Organizations: 550e8400-e29b-41d4-a716-446655440000, 25d8bb1e-05d5-427c-bf17-b201d9fa5fe0

-- ============================================================================
-- INSERT USER INTO ORGANIZATION_USERS TABLE
-- ============================================================================

-- Add user to first organization (as admin)
INSERT INTO public.organization_users (
  user_id,
  organization_id,
  role,
  status,
  joined_at,
  created_at,
  updated_at
)
VALUES (
  '0d510ab0-05fc-4506-bb94-985928ac4bb6',
  '550e8400-e29b-41d4-a716-446655440000',
  'admin',
  'active',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (user_id, organization_id)
DO UPDATE SET
  status = 'active',
  updated_at = NOW();

-- Add user to second organization (as member)
INSERT INTO public.organization_users (
  user_id,
  organization_id,
  role,
  status,
  joined_at,
  created_at,
  updated_at
)
VALUES (
  '0d510ab0-05fc-4506-bb94-985928ac4bb6',
  '25d8bb1e-05d5-427c-bf17-b201d9fa5fe0',
  'member',
  'active',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (user_id, organization_id)
DO UPDATE SET
  status = 'active',
  updated_at = NOW();

-- ============================================================================
-- VERIFY THE INSERTIONS
-- ============================================================================

SELECT
  ou.user_id,
  ou.organization_id,
  ou.role,
  ou.status,
  ou.joined_at,
  o.name AS organization_name,
  o.slug AS organization_slug
FROM public.organization_users ou
JOIN public.organizations o ON o.id = ou.organization_id
WHERE ou.user_id = '0d510ab0-05fc-4506-bb94-985928ac4bb6';
