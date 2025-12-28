-- Migration: Add start_date and approach to organization_course_assignments
-- Created: 2025-12-27
-- Description: Adds support for scheduling course start dates and tracking the chosen learning approach

-- Add start_date column
ALTER TABLE public.organization_course_assignments
ADD COLUMN IF NOT EXISTS start_date timestamp without time zone;

-- Add approach column (optional, for analytics)
ALTER TABLE public.organization_course_assignments
ADD COLUMN IF NOT EXISTS approach character varying 
CHECK (approach IS NULL OR approach IN ('fast', 'balanced', 'long', 'custom'));

-- Add index for optimizing queries by start_date
CREATE INDEX IF NOT EXISTS idx_org_course_assignments_start_date 
ON public.organization_course_assignments(start_date);

-- Add constraint: start_date must be <= due_date
ALTER TABLE public.organization_course_assignments
ADD CONSTRAINT check_start_before_due 
CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date);

-- Add comment for documentation
COMMENT ON COLUMN public.organization_course_assignments.start_date IS 'Scheduled date when the user should start the course';
COMMENT ON COLUMN public.organization_course_assignments.approach IS 'Learning approach chosen: fast, balanced, long, or custom';
