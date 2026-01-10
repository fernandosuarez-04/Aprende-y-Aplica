-- Migration: Remove emoji_level and connector_search_enabled from lia_personalization_settings
-- Created: 2025-01-09
-- Description: Removes emoji_level and connector_search_enabled columns as they are no longer needed

-- Remove emoji_level column
ALTER TABLE public.lia_personalization_settings
DROP COLUMN IF EXISTS emoji_level;

-- Remove connector_search_enabled column
ALTER TABLE public.lia_personalization_settings
DROP COLUMN IF EXISTS connector_search_enabled;

-- Remove the CHECK constraint for emoji_level if it exists
ALTER TABLE public.lia_personalization_settings
DROP CONSTRAINT IF EXISTS lia_personalization_settings_emoji_level_check;

-- Add comments for documentation
COMMENT ON TABLE public.lia_personalization_settings IS 'Stores user personalization settings for LIA assistant (emoji and connector search features removed)';

