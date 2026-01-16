-- Migration: Add granular video tracking fields to lesson_tracking
-- Description: Adds columns to track playback position, max reach, total duration and playback rate.

-- Add video_checkpoint_seconds column (defaults to 0)
ALTER TABLE public.lesson_tracking 
ADD COLUMN IF NOT EXISTS video_checkpoint_seconds integer DEFAULT 0;

-- Add video_max_seconds column (defaults to 0, verifies progress completeness)
ALTER TABLE public.lesson_tracking 
ADD COLUMN IF NOT EXISTS video_max_seconds integer DEFAULT 0;

-- Add video_total_duration_seconds column (snapshot of total duration when watched)
ALTER TABLE public.lesson_tracking 
ADD COLUMN IF NOT EXISTS video_total_duration_seconds integer DEFAULT 0;

-- Add video_playback_rate column (defaults to 1.0, tracking user preference)
ALTER TABLE public.lesson_tracking 
ADD COLUMN IF NOT EXISTS video_playback_rate numeric DEFAULT 1.0;

-- Comment on columns for documentation
COMMENT ON COLUMN public.lesson_tracking.video_checkpoint_seconds IS 'Last recorded playback position in seconds';
COMMENT ON COLUMN public.lesson_tracking.video_max_seconds IS 'Furthest point reached in the video in seconds';
COMMENT ON COLUMN public.lesson_tracking.video_total_duration_seconds IS 'Total duration of the video at the time of tracking';
COMMENT ON COLUMN public.lesson_tracking.video_playback_rate IS 'Last used playback speed by the user';
