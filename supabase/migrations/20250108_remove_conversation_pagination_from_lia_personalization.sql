-- Migration: Remove conversation_pagination_enabled from lia_personalization_settings
-- Created: 2025-01-08
-- Description: Removes the conversation_pagination_enabled column as pagination is now always enabled

-- Remove the column from the table (if it exists)
-- This migration is safe to run even if the column doesn't exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lia_personalization_settings' 
    AND column_name = 'conversation_pagination_enabled'
  ) THEN
    ALTER TABLE public.lia_personalization_settings 
    DROP COLUMN conversation_pagination_enabled;
    
    RAISE NOTICE 'Column conversation_pagination_enabled removed successfully';
  ELSE
    RAISE NOTICE 'Column conversation_pagination_enabled does not exist, skipping removal';
  END IF;
END $$;

-- Remove the comment for the column if it exists
COMMENT ON COLUMN public.lia_personalization_settings.conversation_pagination_enabled IS NULL;



