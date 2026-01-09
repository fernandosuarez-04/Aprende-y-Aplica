/**
 * Types for LIA Personalization System
 */

export type BaseStyle = 'professional' | 'casual' | 'technical' | 'friendly' | 'formal';
export type EmojiLevel = 'none' | 'less' | 'normal' | 'more';

export interface LiaPersonalizationSettings {
  id: string;
  user_id: string;
  base_style: BaseStyle;
  is_friendly: boolean;
  is_enthusiastic: boolean;
  emoji_level: EmojiLevel;
  custom_instructions: string | null;
  nickname: string | null;
  recording_history_enabled: boolean;
  voice_enabled: boolean;
  dictation_enabled: boolean;
  conversation_pagination_enabled: boolean;
  connector_search_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface LiaPersonalizationSettingsInput {
  base_style?: BaseStyle;
  is_friendly?: boolean;
  is_enthusiastic?: boolean;
  emoji_level?: EmojiLevel;
  custom_instructions?: string | null;
  nickname?: string | null;
  recording_history_enabled?: boolean;
  voice_enabled?: boolean;
  dictation_enabled?: boolean;
  conversation_pagination_enabled?: boolean;
  connector_search_enabled?: boolean;
}

export interface LiaPersonalizationResponse {
  settings: LiaPersonalizationSettings | null;
  success: boolean;
  message?: string;
}

