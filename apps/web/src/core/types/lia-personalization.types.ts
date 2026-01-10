/**
 * Types for LIA Personalization System
 */

export type BaseStyle = 'professional' | 'casual' | 'technical' | 'friendly' | 'formal';

export interface LiaPersonalizationSettings {
  id: string;
  user_id: string;
  base_style: BaseStyle;
  is_friendly: boolean;
  is_enthusiastic: boolean;
  custom_instructions: string | null;
  nickname: string | null;
  voice_enabled: boolean;
  dictation_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface LiaPersonalizationSettingsInput {
  base_style?: BaseStyle;
  is_friendly?: boolean;
  is_enthusiastic?: boolean;
  custom_instructions?: string | null;
  nickname?: string | null;
  voice_enabled?: boolean;
  dictation_enabled?: boolean;
}

export interface LiaPersonalizationResponse {
  settings: LiaPersonalizationSettings | null;
  success: boolean;
  message?: string;
}

