-- Migration: Create lia_personalization_settings table
-- Created: 2025-01-08
-- Description: Creates table for LIA personalization settings similar to ChatGPT customization

-- Create the personalization settings table
CREATE TABLE IF NOT EXISTS public.lia_personalization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Estilo y Tono
  base_style text DEFAULT 'professional' 
    CHECK (base_style IN ('professional', 'casual', 'technical', 'friendly', 'formal')),
  
  -- Características
  is_friendly boolean DEFAULT true,
  is_enthusiastic boolean DEFAULT true,
  emoji_level text DEFAULT 'normal' 
    CHECK (emoji_level IN ('none', 'less', 'normal', 'more')),
  
  -- Instrucciones Personalizadas
  custom_instructions text,
  
  -- Información del Usuario
  nickname text,
  
  -- Funciones Avanzadas
  voice_enabled boolean DEFAULT true,
  dictation_enabled boolean DEFAULT false,
  connector_search_enabled boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_lia_personalization_settings_user_id 
ON public.lia_personalization_settings(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lia_personalization_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_lia_personalization_settings_updated_at
  BEFORE UPDATE ON public.lia_personalization_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_lia_personalization_settings_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.lia_personalization_settings IS 'Stores user personalization settings for LIA assistant';
COMMENT ON COLUMN public.lia_personalization_settings.base_style IS 'Base communication style: professional, casual, technical, friendly, or formal';
COMMENT ON COLUMN public.lia_personalization_settings.is_friendly IS 'Enable friendly tone in responses';
COMMENT ON COLUMN public.lia_personalization_settings.is_enthusiastic IS 'Enable enthusiastic tone in responses';
COMMENT ON COLUMN public.lia_personalization_settings.emoji_level IS 'Emoji usage level: none, less, normal, or more';
COMMENT ON COLUMN public.lia_personalization_settings.custom_instructions IS 'Custom instructions for LIA behavior and preferences';
COMMENT ON COLUMN public.lia_personalization_settings.nickname IS 'User preferred nickname (optional)';
COMMENT ON COLUMN public.lia_personalization_settings.voice_enabled IS 'Enable voice responses';
COMMENT ON COLUMN public.lia_personalization_settings.dictation_enabled IS 'Enable dictation mode for input';
COMMENT ON COLUMN public.lia_personalization_settings.connector_search_enabled IS 'Enable search in connected services';

-- Enable Row Level Security
ALTER TABLE public.lia_personalization_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only view and modify their own settings
CREATE POLICY "Users can view their own personalization settings"
  ON public.lia_personalization_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personalization settings"
  ON public.lia_personalization_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personalization settings"
  ON public.lia_personalization_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personalization settings"
  ON public.lia_personalization_settings
  FOR DELETE
  USING (auth.uid() = user_id);

