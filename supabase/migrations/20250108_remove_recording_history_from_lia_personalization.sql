-- Migration: Remove recording_history_enabled from lia_personalization_settings
-- Created: 2025-01-08
-- Description: Removes the recording_history_enabled column as it's not needed for SOFIA's educational use case

-- Remove the column from the table (if it exists)
-- This migration is safe to run even if the column doesn't exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lia_personalization_settings' 
    AND column_name = 'recording_history_enabled'
  ) THEN
    ALTER TABLE public.lia_personalization_settings 
    DROP COLUMN recording_history_enabled;
    
    RAISE NOTICE 'Column recording_history_enabled removed successfully';
  ELSE
    RAISE NOTICE 'Column recording_history_enabled does not exist, skipping removal';
  END IF;
END $$;

