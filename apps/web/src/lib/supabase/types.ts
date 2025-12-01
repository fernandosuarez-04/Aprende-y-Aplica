export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_dashboard_layouts: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          layout_config: Json
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          layout_config?: Json
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          layout_config?: Json
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_dashboard_layouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_dashboard_layouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_dashboard_layouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_dashboard_layouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      admin_dashboard_preferences: {
        Row: {
          activity_period: string | null
          created_at: string | null
          growth_chart_metrics: Json | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_period?: string | null
          created_at?: string | null
          growth_chart_metrics?: Json | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_period?: string | null
          created_at?: string | null
          growth_chart_metrics?: Json | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_dashboard_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_dashboard_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_dashboard_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_dashboard_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      adopcion_genai: {
        Row: {
          fecha_fuente: string | null
          fuente: string | null
          id: number
          indice_aipi: number | null
          pais: string | null
        }
        Insert: {
          fecha_fuente?: string | null
          fuente?: string | null
          id?: number
          indice_aipi?: number | null
          pais?: string | null
        }
        Update: {
          fecha_fuente?: string | null
          fuente?: string | null
          id?: number
          indice_aipi?: number | null
          pais?: string | null
        }
        Relationships: []
      }
      ai_apps: {
        Row: {
          advantages: string[] | null
          alternatives: string[] | null
          api_available: boolean | null
          app_id: string
          browser_extension: boolean | null
          category_id: string | null
          created_at: string | null
          description: string
          desktop_app: boolean | null
          disadvantages: string[] | null
          features: string[] | null
          integrations: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          like_count: number | null
          logo_url: string | null
          long_description: string | null
          mobile_app: boolean | null
          name: string
          pricing_details: Json | null
          pricing_model: string
          rating: number | null
          rating_count: number | null
          slug: string
          supported_languages: string[] | null
          tags: string[] | null
          updated_at: string | null
          use_cases: string[] | null
          view_count: number | null
          website_url: string | null
        }
        Insert: {
          advantages?: string[] | null
          alternatives?: string[] | null
          api_available?: boolean | null
          app_id?: string
          browser_extension?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description: string
          desktop_app?: boolean | null
          disadvantages?: string[] | null
          features?: string[] | null
          integrations?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          like_count?: number | null
          logo_url?: string | null
          long_description?: string | null
          mobile_app?: boolean | null
          name: string
          pricing_details?: Json | null
          pricing_model: string
          rating?: number | null
          rating_count?: number | null
          slug: string
          supported_languages?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
          use_cases?: string[] | null
          view_count?: number | null
          website_url?: string | null
        }
        Update: {
          advantages?: string[] | null
          alternatives?: string[] | null
          api_available?: boolean | null
          app_id?: string
          browser_extension?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string
          desktop_app?: boolean | null
          disadvantages?: string[] | null
          features?: string[] | null
          integrations?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          like_count?: number | null
          logo_url?: string | null
          long_description?: string | null
          mobile_app?: boolean | null
          name?: string
          pricing_details?: Json | null
          pricing_model?: string
          rating?: number | null
          rating_count?: number | null
          slug?: string
          supported_languages?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
          use_cases?: string[] | null
          view_count?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_apps_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ai_categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      ai_categories: {
        Row: {
          category_id: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_moderation_config: {
        Row: {
          config_key: string
          config_value: string
          description: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_moderation_logs: {
        Row: {
          api_response: Json | null
          categories: Json | null
          confidence_score: number | null
          content_id: string | null
          content_text: string
          content_type: string
          created_at: string
          is_flagged: boolean
          log_id: string
          model_used: string | null
          processing_time_ms: number | null
          reasoning: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          api_response?: Json | null
          categories?: Json | null
          confidence_score?: number | null
          content_id?: string | null
          content_text: string
          content_type: string
          created_at?: string
          is_flagged?: boolean
          log_id?: string
          model_used?: string | null
          processing_time_ms?: number | null
          reasoning?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          api_response?: Json | null
          categories?: Json | null
          confidence_score?: number | null
          content_id?: string | null
          content_text?: string
          content_type?: string
          created_at?: string
          is_flagged?: boolean
          log_id?: string
          model_used?: string | null
          processing_time_ms?: number | null
          reasoning?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          created_at: string | null
          description: string
          difficulty_level: string | null
          download_count: number | null
          estimated_time_minutes: number | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          like_count: number | null
          prompt_id: string
          rating: number | null
          rating_count: number | null
          slug: string
          tags: string[] | null
          tips: string[] | null
          title: string
          updated_at: string | null
          use_cases: string[] | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content: string
          created_at?: string | null
          description: string
          difficulty_level?: string | null
          download_count?: number | null
          estimated_time_minutes?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          like_count?: number | null
          prompt_id?: string
          rating?: number | null
          rating_count?: number | null
          slug: string
          tags?: string[] | null
          tips?: string[] | null
          title: string
          updated_at?: string | null
          use_cases?: string[] | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          description?: string
          difficulty_level?: string | null
          download_count?: number | null
          estimated_time_minutes?: number | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          like_count?: number | null
          prompt_id?: string
          rating?: number | null
          rating_count?: number | null
          slug?: string
          tags?: string[] | null
          tips?: string[] | null
          title?: string
          updated_at?: string | null
          use_cases?: string[] | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_prompts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_prompts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_prompts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_prompts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ai_categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      app_directory_translations: {
        Row: {
          advantages: string[] | null
          app_id: string
          created_at: string | null
          description: string
          disadvantages: string[] | null
          features: string[] | null
          id: number
          language: string
          long_description: string | null
          name: string
          updated_at: string | null
          use_cases: string[] | null
        }
        Insert: {
          advantages?: string[] | null
          app_id: string
          created_at?: string | null
          description: string
          disadvantages?: string[] | null
          features?: string[] | null
          id?: number
          language: string
          long_description?: string | null
          name: string
          updated_at?: string | null
          use_cases?: string[] | null
        }
        Update: {
          advantages?: string[] | null
          app_id?: string
          created_at?: string | null
          description?: string
          disadvantages?: string[] | null
          features?: string[] | null
          id?: number
          language?: string
          long_description?: string | null
          name?: string
          updated_at?: string | null
          use_cases?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "app_directory_translations_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "ai_apps"
            referencedColumns: ["app_id"]
          },
        ]
      }
      app_favorites: {
        Row: {
          app_id: string | null
          created_at: string | null
          favorite_id: string
          user_id: string | null
        }
        Insert: {
          app_id?: string | null
          created_at?: string | null
          favorite_id?: string
          user_id?: string | null
        }
        Update: {
          app_id?: string | null
          created_at?: string | null
          favorite_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_favorites_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "ai_apps"
            referencedColumns: ["app_id"]
          },
          {
            foreignKeyName: "app_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "app_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "app_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      app_ratings: {
        Row: {
          app_id: string | null
          created_at: string | null
          rating: number
          rating_id: string
          review: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          app_id?: string | null
          created_at?: string | null
          rating: number
          rating_id?: string
          review?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          app_id?: string | null
          created_at?: string | null
          rating?: number
          rating_id?: string
          review?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_ratings_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "ai_apps"
            referencedColumns: ["app_id"]
          },
          {
            foreignKeyName: "app_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "app_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "app_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      areas: {
        Row: {
          id: number
          nombre: string
          slug: string
        }
        Insert: {
          id?: number
          nombre: string
          slug: string
        }
        Update: {
          id?: number
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      calendar_integrations: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          provider: string
          refresh_token: string | null
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      calendar_subscription_tokens: {
        Row: {
          created_at: string | null
          id: string
          last_used_at: string | null
          token: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          token?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          token?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      certificate_ledger: {
        Row: {
          block_hash: string
          block_id: number
          cert_id: string
          created_at: string
          op: string
          payload: Json
          prev_hash: string | null
        }
        Insert: {
          block_hash: string
          block_id?: number
          cert_id: string
          created_at?: string
          op: string
          payload?: Json
          prev_hash?: string | null
        }
        Update: {
          block_hash?: string
          block_id?: number
          cert_id?: string
          created_at?: string
          op?: string
          payload?: Json
          prev_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_ledger_cert_id_fkey"
            columns: ["cert_id"]
            isOneToOne: false
            referencedRelation: "user_course_certificates"
            referencedColumns: ["certificate_id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          created_at: string | null
          description: string | null
          design_config: Json
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          design_config?: Json
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          design_config?: Json
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "certificate_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      communities: {
        Row: {
          access_type: string
          course_id: string | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          member_count: number | null
          name: string
          slug: string
          updated_at: string | null
          visibility: string
        }
        Insert: {
          access_type: string
          course_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          member_count?: number | null
          name: string
          slug: string
          updated_at?: string | null
          visibility?: string
        }
        Update: {
          access_type?: string
          course_id?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          member_count?: number | null
          name?: string
          slug?: string
          updated_at?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "communities_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "communities_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "communities_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "communities_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "communities_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_access_requests: {
        Row: {
          community_id: string
          created_at: string
          id: string
          note: string | null
          requester_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          note?: string | null
          requester_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          note?: string | null
          requester_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_access_requests_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_access_requests_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_access_requests_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "mv_community_stats"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_access_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_access_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_access_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_access_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_access_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_access_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_access_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_access_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_comments: {
        Row: {
          community_id: string
          content: string
          created_at: string
          id: string
          is_deleted: boolean
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "mv_community_stats"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "mv_post_stats"
            referencedColumns: ["post_id"]
          },
        ]
      }
      community_creation_requests: {
        Row: {
          access_type: string
          course_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          rejection_reason: string | null
          requester_id: string
          requester_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          access_type?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          rejection_reason?: string | null
          requester_id: string
          requester_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          access_type?: string
          course_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rejection_reason?: string | null
          requester_id?: string
          requester_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_creation_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "community_creation_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "community_creation_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_creation_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "community_creation_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_creation_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_creation_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_creation_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_creation_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_creation_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_creation_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_creation_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          is_active: boolean | null
          joined_at: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "mv_community_stats"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_community_members_community_id"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_community_members_community_id"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_community_members_community_id"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "mv_community_stats"
            referencedColumns: ["community_id"]
          },
        ]
      }
      community_post_reports: {
        Row: {
          community_id: string
          created_at: string | null
          id: string
          post_id: string
          reason_category: string
          reason_details: string | null
          reported_by_user_id: string
          resolution_action: string | null
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          community_id: string
          created_at?: string | null
          id?: string
          post_id: string
          reason_category: string
          reason_details?: string | null
          reported_by_user_id: string
          resolution_action?: string | null
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          community_id?: string
          created_at?: string | null
          id?: string
          post_id?: string
          reason_category?: string
          reason_details?: string | null
          reported_by_user_id?: string
          resolution_action?: string | null
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_post_reports_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_reports_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_reports_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "mv_community_stats"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "mv_post_stats"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "community_post_reports_reported_by_user_id_fkey"
            columns: ["reported_by_user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_post_reports_reported_by_user_id_fkey"
            columns: ["reported_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_reports_reported_by_user_id_fkey"
            columns: ["reported_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_post_reports_reported_by_user_id_fkey"
            columns: ["reported_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_post_reports_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_post_reports_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_reports_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_post_reports_reviewed_by_user_id_fkey"
            columns: ["reviewed_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_posts: {
        Row: {
          attachment_data: Json | null
          attachment_type: string | null
          attachment_url: string | null
          comment_count: number
          comments_count: number | null
          community_id: string
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          is_hidden: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          poll_data: Json | null
          poll_options: Json | null
          poll_question: string | null
          post_type: string | null
          reaction_count: number
          title: string | null
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          attachment_data?: Json | null
          attachment_type?: string | null
          attachment_url?: string | null
          comment_count?: number
          comments_count?: number | null
          community_id: string
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          poll_data?: Json | null
          poll_options?: Json | null
          poll_question?: string | null
          post_type?: string | null
          reaction_count?: number
          title?: string | null
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          attachment_data?: Json | null
          attachment_type?: string | null
          attachment_url?: string | null
          comment_count?: number
          comments_count?: number | null
          community_id?: string
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          poll_data?: Json | null
          poll_options?: Json | null
          poll_question?: string | null
          post_type?: string | null
          reaction_count?: number
          title?: string | null
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "mv_community_stats"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          post_id: string | null
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction_type?: string
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "mv_post_stats"
            referencedColumns: ["post_id"]
          },
          {
            foreignKeyName: "community_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_videos: {
        Row: {
          community_id: string
          created_at: string
          description: string | null
          duration: number | null
          id: string
          is_active: boolean
          metadata: Json | null
          order_index: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_provider: string
          video_type: string
          video_url: string
        }
        Insert: {
          community_id: string
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          order_index?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_provider?: string
          video_type?: string
          video_url: string
        }
        Update: {
          community_id?: string
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          order_index?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_provider?: string
          video_type?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_videos_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_videos_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_videos_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "mv_community_stats"
            referencedColumns: ["community_id"]
          },
        ]
      }
      content_translations: {
        Row: {
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          language_code: string
          translations: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          language_code: string
          translations?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          language_code?: string
          translations?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_translations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_translations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_translations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_translations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      coupons: {
        Row: {
          coupon_code: string
          coupon_description: string | null
          coupon_id: string
          course_id: string | null
          created_at: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          is_active: boolean | null
          max_uses: number | null
          minimum_amount_cents: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          coupon_code: string
          coupon_description?: string | null
          coupon_id?: string
          course_id?: string | null
          created_at?: string | null
          current_uses?: number | null
          discount_type: string
          discount_value: number
          is_active?: boolean | null
          max_uses?: number | null
          minimum_amount_cents?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          coupon_code?: string
          coupon_description?: string | null
          coupon_id?: string
          course_id?: string | null
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          is_active?: boolean | null
          max_uses?: number | null
          minimum_amount_cents?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "coupons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "coupons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          created_at: string | null
          duration_seconds: number
          instructor_id: string
          is_published: boolean | null
          lesson_description: string | null
          lesson_id: string
          lesson_order_index: number
          lesson_title: string
          module_id: string
          summary_content: string | null
          transcript_content: string | null
          updated_at: string | null
          video_provider: string
          video_provider_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds: number
          instructor_id: string
          is_published?: boolean | null
          lesson_description?: string | null
          lesson_id?: string
          lesson_order_index?: number
          lesson_title: string
          module_id: string
          summary_content?: string | null
          transcript_content?: string | null
          updated_at?: string | null
          video_provider: string
          video_provider_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number
          instructor_id?: string
          is_published?: boolean | null
          lesson_description?: string | null
          lesson_id?: string
          lesson_order_index?: number
          lesson_title?: string
          module_id?: string
          summary_content?: string | null
          transcript_content?: string | null
          updated_at?: string | null
          video_provider?: string
          video_provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["module_id"]
          },
        ]
      }
      course_lessons_en: {
        Row: {
          created_at: string | null
          duration_seconds: number
          instructor_id: string
          is_published: boolean | null
          lesson_description: string | null
          lesson_id: string
          lesson_order_index: number
          lesson_title: string
          module_id: string
          summary_content: string | null
          transcript_content: string | null
          updated_at: string | null
          video_provider: string
          video_provider_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds: number
          instructor_id: string
          is_published?: boolean | null
          lesson_description?: string | null
          lesson_id?: string
          lesson_order_index?: number
          lesson_title: string
          module_id: string
          summary_content?: string | null
          transcript_content?: string | null
          updated_at?: string | null
          video_provider: string
          video_provider_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number
          instructor_id?: string
          is_published?: boolean | null
          lesson_description?: string | null
          lesson_id?: string
          lesson_order_index?: number
          lesson_title?: string
          module_id?: string
          summary_content?: string | null
          transcript_content?: string | null
          updated_at?: string | null
          video_provider?: string
          video_provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_en_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_en_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_en_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_en_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_en_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["module_id"]
          },
        ]
      }
      course_lessons_pt: {
        Row: {
          created_at: string | null
          duration_seconds: number
          instructor_id: string
          is_published: boolean | null
          lesson_description: string | null
          lesson_id: string
          lesson_order_index: number
          lesson_title: string
          module_id: string
          summary_content: string | null
          transcript_content: string | null
          updated_at: string | null
          video_provider: string
          video_provider_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds: number
          instructor_id: string
          is_published?: boolean | null
          lesson_description?: string | null
          lesson_id?: string
          lesson_order_index?: number
          lesson_title: string
          module_id: string
          summary_content?: string | null
          transcript_content?: string | null
          updated_at?: string | null
          video_provider: string
          video_provider_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number
          instructor_id?: string
          is_published?: boolean | null
          lesson_description?: string | null
          lesson_id?: string
          lesson_order_index?: number
          lesson_title?: string
          module_id?: string
          summary_content?: string | null
          transcript_content?: string | null
          updated_at?: string | null
          video_provider?: string
          video_provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_pt_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_pt_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_pt_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_pt_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_lessons_pt_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["module_id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string | null
          is_published: boolean | null
          is_required: boolean | null
          module_description: string | null
          module_duration_minutes: number | null
          module_id: string
          module_order_index: number
          module_title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          is_published?: boolean | null
          is_required?: boolean | null
          module_description?: string | null
          module_duration_minutes?: number | null
          module_id?: string
          module_order_index?: number
          module_title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          is_published?: boolean | null
          is_required?: boolean | null
          module_description?: string | null
          module_duration_minutes?: number | null
          module_id?: string
          module_order_index?: number
          module_title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
        ]
      }
      course_purchases: {
        Row: {
          access_granted_at: string | null
          access_status: Database["public"]["Enums"]["access_status"]
          accessed_at: string | null
          coupon_id: string | null
          course_id: string
          created_at: string
          created_by: string | null
          currency: string
          discount_cents: number | null
          discount_type: Database["public"]["Enums"]["discount_type"] | null
          discount_value: number | null
          discounted_price_cents: number
          enrollment_id: string | null
          expires_at: string | null
          final_price_cents: number
          internal_notes: string | null
          metadata: Json
          original_price_cents: number
          payment_method_id: string | null
          purchase_id: string
          purchase_method: Database["public"]["Enums"]["purchase_method"] | null
          purchase_notes: string | null
          purchased_at: string
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_granted_at?: string | null
          access_status?: Database["public"]["Enums"]["access_status"]
          accessed_at?: string | null
          coupon_id?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_cents?: number | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          discounted_price_cents: number
          enrollment_id?: string | null
          expires_at?: string | null
          final_price_cents: number
          internal_notes?: string | null
          metadata?: Json
          original_price_cents: number
          payment_method_id?: string | null
          purchase_id?: string
          purchase_method?:
            | Database["public"]["Enums"]["purchase_method"]
            | null
          purchase_notes?: string | null
          purchased_at?: string
          transaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_granted_at?: string | null
          access_status?: Database["public"]["Enums"]["access_status"]
          accessed_at?: string | null
          coupon_id?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_cents?: number | null
          discount_type?: Database["public"]["Enums"]["discount_type"] | null
          discount_value?: number | null
          discounted_price_cents?: number
          enrollment_id?: string | null
          expires_at?: string | null
          final_price_cents?: number
          internal_notes?: string | null
          metadata?: Json
          original_price_cents?: number
          payment_method_id?: string | null
          purchase_id?: string
          purchase_method?:
            | Database["public"]["Enums"]["purchase_method"]
            | null
          purchase_notes?: string | null
          purchased_at?: string
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_purchases_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["coupon_id"]
          },
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_purchases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_purchases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_purchases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_purchases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_purchases_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "course_purchases_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["payment_method_id"]
          },
          {
            foreignKeyName: "course_purchases_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "course_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_question_reactions: {
        Row: {
          created_at: string | null
          id: string
          question_id: string | null
          reaction_type: string
          response_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id?: string | null
          reaction_type?: string
          response_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: string | null
          reaction_type?: string
          response_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_question_reactions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "course_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_reactions_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "course_question_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_question_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_question_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_question_responses: {
        Row: {
          attachment_data: Json | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          course_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_approved_answer: boolean | null
          is_deleted: boolean | null
          is_edited: boolean | null
          is_instructor_answer: boolean | null
          parent_response_id: string | null
          question_id: string
          reaction_count: number | null
          reply_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_data?: Json | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          course_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_approved_answer?: boolean | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_instructor_answer?: boolean | null
          parent_response_id?: string | null
          question_id: string
          reaction_count?: number | null
          reply_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_data?: Json | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          course_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_approved_answer?: boolean | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_instructor_answer?: boolean | null
          parent_response_id?: string | null
          question_id?: string
          reaction_count?: number | null
          reply_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_question_responses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "course_question_responses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_question_responses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_responses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_question_responses_parent_response_id_fkey"
            columns: ["parent_response_id"]
            isOneToOne: false
            referencedRelation: "course_question_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "course_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_question_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_question_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_question_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_questions: {
        Row: {
          attachment_data: Json | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          course_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_edited: boolean | null
          is_hidden: boolean | null
          is_pinned: boolean | null
          is_resolved: boolean | null
          reaction_count: number | null
          response_count: number | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          attachment_data?: Json | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          course_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          reaction_count?: number | null
          response_count?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          attachment_data?: Json | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          course_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          reaction_count?: number | null
          response_count?: number | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "course_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          course_id: string
          created_at: string | null
          is_public: boolean | null
          is_verified: boolean | null
          rating: number
          review_content: string
          review_id: string
          review_title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          is_public?: boolean | null
          is_verified?: boolean | null
          rating: number
          review_content: string
          review_id?: string
          review_title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          is_public?: boolean | null
          is_verified?: boolean | null
          rating?: number
          review_content?: string
          review_id?: string
          review_title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_skills: {
        Row: {
          course_id: string
          created_at: string
          display_order: number | null
          id: string
          is_primary: boolean | null
          is_required: boolean | null
          proficiency_level: string | null
          skill_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          is_required?: boolean | null
          proficiency_level?: string | null
          skill_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          is_required?: boolean | null
          proficiency_level?: string | null
          skill_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "course_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "course_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      courses: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          average_rating: number | null
          category: string
          created_at: string | null
          description: string | null
          duration_total_minutes: number | null
          id: string
          instructor_id: string | null
          is_active: boolean | null
          learning_objectives: Json | null
          level: string
          price: number | null
          rejection_reason: string | null
          review_count: number | null
          slug: string
          student_count: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          duration_total_minutes?: number | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          learning_objectives?: Json | null
          level?: string
          price?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          slug: string
          student_count?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          duration_total_minutes?: number | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          learning_objectives?: Json | null
          level?: string
          price?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          slug?: string
          student_count?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "courses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "courses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_courses_instructor"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_courses_instructor"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_courses_instructor"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_courses_instructor"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daily_progress: {
        Row: {
          created_at: string | null
          had_activity: boolean | null
          id: string
          progress_date: string
          sessions_completed: number | null
          sessions_missed: number | null
          streak_count: number | null
          study_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          had_activity?: boolean | null
          id?: string
          progress_date: string
          sessions_completed?: number | null
          sessions_missed?: number | null
          streak_count?: number | null
          study_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          had_activity?: boolean | null
          id?: string
          progress_date?: string
          sessions_completed?: number | null
          sessions_missed?: number | null
          streak_count?: number | null
          study_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "daily_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "daily_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          layout_config: Json
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          layout_config?: Json
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          layout_config?: Json
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_layouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_layouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "dashboard_layouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      forbidden_words: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          severity: string
          updated_at: string
          word: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          severity?: string
          updated_at?: string
          word: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          severity?: string
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
      lesson_activities: {
        Row: {
          activity_content: string
          activity_description: string | null
          activity_id: string
          activity_order_index: number
          activity_title: string
          activity_type: string
          ai_prompts: string | null
          created_at: string | null
          estimated_time_minutes: number | null
          is_required: boolean | null
          lesson_id: string
        }
        Insert: {
          activity_content: string
          activity_description?: string | null
          activity_id?: string
          activity_order_index?: number
          activity_title: string
          activity_type: string
          ai_prompts?: string | null
          created_at?: string | null
          estimated_time_minutes?: number | null
          is_required?: boolean | null
          lesson_id: string
        }
        Update: {
          activity_content?: string
          activity_description?: string | null
          activity_id?: string
          activity_order_index?: number
          activity_title?: string
          activity_type?: string
          ai_prompts?: string | null
          created_at?: string | null
          estimated_time_minutes?: number | null
          is_required?: boolean | null
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      lesson_checkpoints: {
        Row: {
          checkpoint_description: string | null
          checkpoint_id: string
          checkpoint_label: string | null
          checkpoint_order_index: number | null
          checkpoint_time_seconds: number
          created_at: string | null
          is_required_completion: boolean | null
          lesson_id: string
        }
        Insert: {
          checkpoint_description?: string | null
          checkpoint_id?: string
          checkpoint_label?: string | null
          checkpoint_order_index?: number | null
          checkpoint_time_seconds: number
          created_at?: string | null
          is_required_completion?: boolean | null
          lesson_id: string
        }
        Update: {
          checkpoint_description?: string | null
          checkpoint_id?: string
          checkpoint_label?: string | null
          checkpoint_order_index?: number | null
          checkpoint_time_seconds?: number
          created_at?: string | null
          is_required_completion?: boolean | null
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_checkpoints_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_checkpoints_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_checkpoints_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      lesson_feedback: {
        Row: {
          created_at: string | null
          feedback_type: string
          id: string
          lesson_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_type: string
          id?: string
          lesson_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_type?: string
          id?: string
          lesson_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_feedback_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_feedback_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_feedback_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lesson_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lesson_materials: {
        Row: {
          content_data: Json | null
          created_at: string | null
          estimated_time_minutes: number | null
          external_url: string | null
          file_url: string | null
          is_downloadable: boolean | null
          lesson_id: string
          material_description: string | null
          material_id: string
          material_order_index: number | null
          material_title: string
          material_type: string
        }
        Insert: {
          content_data?: Json | null
          created_at?: string | null
          estimated_time_minutes?: number | null
          external_url?: string | null
          file_url?: string | null
          is_downloadable?: boolean | null
          lesson_id: string
          material_description?: string | null
          material_id?: string
          material_order_index?: number | null
          material_title: string
          material_type: string
        }
        Update: {
          content_data?: Json | null
          created_at?: string | null
          estimated_time_minutes?: number | null
          external_url?: string | null
          file_url?: string | null
          is_downloadable?: boolean | null
          lesson_id?: string
          material_description?: string | null
          material_id?: string
          material_order_index?: number | null
          material_title?: string
          material_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      lesson_time_estimates: {
        Row: {
          activities_time_minutes: number | null
          calculated_at: string | null
          exercise_time_minutes: number | null
          id: string
          interactions_time_minutes: number | null
          lesson_id: string
          link_time_minutes: number | null
          quiz_time_minutes: number | null
          reading_time_minutes: number | null
          total_time_minutes: number | null
          updated_at: string | null
          video_duration_seconds: number | null
          video_minutes: number | null
        }
        Insert: {
          activities_time_minutes?: number | null
          calculated_at?: string | null
          exercise_time_minutes?: number | null
          id?: string
          interactions_time_minutes?: number | null
          lesson_id: string
          link_time_minutes?: number | null
          quiz_time_minutes?: number | null
          reading_time_minutes?: number | null
          total_time_minutes?: number | null
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_minutes?: number | null
        }
        Update: {
          activities_time_minutes?: number | null
          calculated_at?: string | null
          exercise_time_minutes?: number | null
          id?: string
          interactions_time_minutes?: number | null
          lesson_id?: string
          link_time_minutes?: number | null
          quiz_time_minutes?: number | null
          reading_time_minutes?: number | null
          total_time_minutes?: number | null
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_time_estimates_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_time_estimates_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lesson_time_estimates_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      lia_activity_completions: {
        Row: {
          activity_id: string
          attempts_to_complete: number | null
          completed_at: string | null
          completed_steps: number | null
          completion_id: string
          conversation_id: string
          created_at: string | null
          current_step: number | null
          generated_output: Json | null
          lia_had_to_redirect: number | null
          started_at: string | null
          status: string
          time_to_complete_seconds: number | null
          total_steps: number | null
          updated_at: string | null
          user_id: string
          user_needed_help: boolean | null
        }
        Insert: {
          activity_id: string
          attempts_to_complete?: number | null
          completed_at?: string | null
          completed_steps?: number | null
          completion_id?: string
          conversation_id: string
          created_at?: string | null
          current_step?: number | null
          generated_output?: Json | null
          lia_had_to_redirect?: number | null
          started_at?: string | null
          status: string
          time_to_complete_seconds?: number | null
          total_steps?: number | null
          updated_at?: string | null
          user_id: string
          user_needed_help?: boolean | null
        }
        Update: {
          activity_id?: string
          attempts_to_complete?: number | null
          completed_at?: string | null
          completed_steps?: number | null
          completion_id?: string
          conversation_id?: string
          created_at?: string | null
          current_step?: number | null
          generated_output?: Json | null
          lia_had_to_redirect?: number | null
          started_at?: string | null
          status?: string
          time_to_complete_seconds?: number | null
          total_steps?: number | null
          updated_at?: string | null
          user_id?: string
          user_needed_help?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "lia_activity_completions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lesson_activities"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "lia_activity_completions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lia_activity_performance"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "lia_activity_completions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lia_conversation_analytics"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "lia_activity_completions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lia_conversations"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "lia_activity_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_activity_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_activity_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_activity_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lia_common_questions: {
        Row: {
          activity_id: string | null
          best_response: string | null
          best_response_rating: number | null
          context_type: string | null
          created_at: string | null
          first_asked_at: string | null
          last_asked_at: string | null
          lesson_id: string | null
          question_id: string
          question_text: string
          times_asked: number | null
          updated_at: string | null
        }
        Insert: {
          activity_id?: string | null
          best_response?: string | null
          best_response_rating?: number | null
          context_type?: string | null
          created_at?: string | null
          first_asked_at?: string | null
          last_asked_at?: string | null
          lesson_id?: string | null
          question_id?: string
          question_text: string
          times_asked?: number | null
          updated_at?: string | null
        }
        Update: {
          activity_id?: string | null
          best_response?: string | null
          best_response_rating?: number | null
          context_type?: string | null
          created_at?: string | null
          first_asked_at?: string | null
          last_asked_at?: string | null
          lesson_id?: string | null
          question_id?: string
          question_text?: string
          times_asked?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lia_common_questions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lesson_activities"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "lia_common_questions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lia_activity_performance"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "lia_common_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_common_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_common_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      lia_conversations: {
        Row: {
          activity_id: string | null
          browser: string | null
          context_type: string
          conversation_completed: boolean | null
          conversation_id: string
          conversation_title: string | null
          course_id: string | null
          created_at: string | null
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          ip_address: unknown
          lesson_id: string | null
          module_id: string | null
          started_at: string
          total_lia_messages: number | null
          total_messages: number | null
          total_user_messages: number | null
          updated_at: string | null
          user_abandoned: boolean | null
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          browser?: string | null
          context_type: string
          conversation_completed?: boolean | null
          conversation_id?: string
          conversation_title?: string | null
          course_id?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          ip_address?: unknown
          lesson_id?: string | null
          module_id?: string | null
          started_at?: string
          total_lia_messages?: number | null
          total_messages?: number | null
          total_user_messages?: number | null
          updated_at?: string | null
          user_abandoned?: boolean | null
          user_id: string
        }
        Update: {
          activity_id?: string | null
          browser?: string | null
          context_type?: string
          conversation_completed?: boolean | null
          conversation_id?: string
          conversation_title?: string | null
          course_id?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          ip_address?: unknown
          lesson_id?: string | null
          module_id?: string | null
          started_at?: string
          total_lia_messages?: number | null
          total_messages?: number | null
          total_user_messages?: number | null
          updated_at?: string | null
          user_abandoned?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lia_conversations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lesson_activities"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "lia_conversations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lia_activity_performance"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "lia_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "lia_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "lia_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "lia_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_conversations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "lia_conversations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lia_messages: {
        Row: {
          contains_question: boolean | null
          content: string
          conversation_id: string
          cost_usd: number | null
          created_at: string | null
          is_off_topic: boolean | null
          is_system_message: boolean | null
          lia_provided_example: boolean | null
          lia_redirected: boolean | null
          message_id: string
          message_sequence: number
          model_used: string | null
          response_time_ms: number | null
          role: string
          sentiment_score: number | null
          tokens_used: number | null
          user_sentiment: string | null
        }
        Insert: {
          contains_question?: boolean | null
          content: string
          conversation_id: string
          cost_usd?: number | null
          created_at?: string | null
          is_off_topic?: boolean | null
          is_system_message?: boolean | null
          lia_provided_example?: boolean | null
          lia_redirected?: boolean | null
          message_id?: string
          message_sequence: number
          model_used?: string | null
          response_time_ms?: number | null
          role: string
          sentiment_score?: number | null
          tokens_used?: number | null
          user_sentiment?: string | null
        }
        Update: {
          contains_question?: boolean | null
          content?: string
          conversation_id?: string
          cost_usd?: number | null
          created_at?: string | null
          is_off_topic?: boolean | null
          is_system_message?: boolean | null
          lia_provided_example?: boolean | null
          lia_redirected?: boolean | null
          message_id?: string
          message_sequence?: number
          model_used?: string | null
          response_time_ms?: number | null
          role?: string
          sentiment_score?: number | null
          tokens_used?: number | null
          user_sentiment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lia_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lia_conversation_analytics"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "lia_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lia_conversations"
            referencedColumns: ["conversation_id"]
          },
        ]
      }
      lia_user_feedback: {
        Row: {
          comment: string | null
          conversation_id: string
          created_at: string | null
          feedback_id: string
          feedback_type: string
          message_id: string
          rating: number | null
          response_off_topic: boolean | null
          response_too_long: boolean | null
          response_too_short: boolean | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          conversation_id: string
          created_at?: string | null
          feedback_id?: string
          feedback_type: string
          message_id: string
          rating?: number | null
          response_off_topic?: boolean | null
          response_too_long?: boolean | null
          response_too_short?: boolean | null
          user_id: string
        }
        Update: {
          comment?: string | null
          conversation_id?: string
          created_at?: string | null
          feedback_id?: string
          feedback_type?: string
          message_id?: string
          rating?: number | null
          response_off_topic?: boolean | null
          response_too_long?: boolean | null
          response_too_short?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lia_user_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lia_conversation_analytics"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "lia_user_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lia_conversations"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "lia_user_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "lia_messages"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "lia_user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      news: {
        Row: {
          created_at: string | null
          created_by: string | null
          cta: Json | null
          hero_image_url: string | null
          id: string
          intro: string | null
          language: string | null
          links: Json | null
          metrics: Json | null
          published_at: string | null
          sections: Json | null
          slug: string
          status: string | null
          subtitle: string | null
          title: string
          tldr: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          cta?: Json | null
          hero_image_url?: string | null
          id?: string
          intro?: string | null
          language?: string | null
          links?: Json | null
          metrics?: Json | null
          published_at?: string | null
          sections?: Json | null
          slug: string
          status?: string | null
          subtitle?: string | null
          title: string
          tldr?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          cta?: Json | null
          hero_image_url?: string | null
          id?: string
          intro?: string | null
          language?: string | null
          links?: Json | null
          metrics?: Json | null
          published_at?: string | null
          sections?: Json | null
          slug?: string
          status?: string | null
          subtitle?: string | null
          title?: string
          tldr?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      niveles: {
        Row: {
          id: number
          nombre: string
          slug: string
        }
        Insert: {
          id?: number
          nombre: string
          slug: string
        }
        Update: {
          id?: number
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      notification_email_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          email_type: string
          error_message: string | null
          notification_id: string | null
          priority: string | null
          queue_id: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          notification_id?: string | null
          priority?: string | null
          queue_id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          notification_id?: string | null
          priority?: string | null
          queue_id?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_email_queue_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["notification_id"]
          },
          {
            foreignKeyName: "notification_email_queue_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "user_unread_notifications"
            referencedColumns: ["notification_id"]
          },
          {
            foreignKeyName: "notification_email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          keys: Json
          last_used_at: string | null
          status: string | null
          subscription_id: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          keys: Json
          last_used_at?: string | null
          status?: string | null
          subscription_id?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          keys?: Json
          last_used_at?: string | null
          status?: string | null
          subscription_id?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          channels: Json | null
          created_at: string | null
          enabled: boolean | null
          event_type: string
          id: string
          organization_id: string
          template: string | null
          updated_at: string | null
        }
        Insert: {
          channels?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          event_type: string
          id?: string
          organization_id: string
          template?: string | null
          updated_at?: string | null
        }
        Update: {
          channels?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          event_type?: string
          id?: string
          organization_id?: string
          template?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notification_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      notification_stats: {
        Row: {
          action_taken_count: number | null
          avg_read_time_seconds: number | null
          created_at: string | null
          notification_type: string | null
          organization_id: string | null
          read_count: number | null
          sent_count: number | null
          stat_date: string
          stat_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_taken_count?: number | null
          avg_read_time_seconds?: number | null
          created_at?: string | null
          notification_type?: string | null
          organization_id?: string | null
          read_count?: number | null
          sent_count?: number | null
          stat_date?: string
          stat_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken_count?: number | null
          avg_read_time_seconds?: number | null
          created_at?: string | null
          notification_type?: string | null
          organization_id?: string | null
          read_count?: number | null
          sent_count?: number | null
          stat_date?: string
          stat_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notification_stats_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notification_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      oauth_accounts: {
        Row: {
          access_token: string | null
          created_at: string | null
          id: string
          provider: string
          provider_account_id: string
          refresh_token: string | null
          scope: string | null
          token_expires_at: string | null
          token_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          provider: string
          provider_account_id: string
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          id?: string
          provider?: string
          provider_account_id?: string
          refresh_token?: string | null
          scope?: string | null
          token_expires_at?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_oauth_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_oauth_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_oauth_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_oauth_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "oauth_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "oauth_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "oauth_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organization_analytics: {
        Row: {
          active_users: number | null
          average_completion_rate: number | null
          courses_assigned: number | null
          courses_completed: number | null
          created_at: string | null
          date: string
          id: string
          organization_id: string
          total_learning_hours: number | null
          total_users: number | null
          updated_at: string | null
        }
        Insert: {
          active_users?: number | null
          average_completion_rate?: number | null
          courses_assigned?: number | null
          courses_completed?: number | null
          created_at?: string | null
          date: string
          id?: string
          organization_id: string
          total_learning_hours?: number | null
          total_users?: number | null
          updated_at?: string | null
        }
        Update: {
          active_users?: number | null
          average_completion_rate?: number | null
          courses_assigned?: number | null
          courses_completed?: number | null
          created_at?: string | null
          date?: string
          id?: string
          organization_id?: string
          total_learning_hours?: number | null
          total_users?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organization_course_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          completed_at: string | null
          completion_percentage: number | null
          course_id: string
          created_at: string | null
          due_date: string | null
          id: string
          message: string | null
          organization_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          course_id: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          message?: string | null
          organization_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          completed_at?: string | null
          completion_percentage?: number | null
          course_id?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          message?: string | null
          organization_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "organization_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organization_course_purchases: {
        Row: {
          access_granted_at: string | null
          access_status: string
          billing_month: string
          billing_month_number: number
          billing_year: number
          coupon_id: string | null
          course_id: string
          created_at: string
          currency: string
          discount_cents: number | null
          discount_type: string | null
          discount_value: number | null
          discounted_price_cents: number
          expires_at: string | null
          final_price_cents: number
          internal_notes: string | null
          metadata: Json
          organization_id: string
          original_price_cents: number
          payment_method_id: string | null
          purchase_id: string
          purchase_method: string | null
          purchase_notes: string | null
          purchased_at: string
          purchased_by: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          access_granted_at?: string | null
          access_status?: string
          billing_month: string
          billing_month_number: number
          billing_year: number
          coupon_id?: string | null
          course_id: string
          created_at?: string
          currency?: string
          discount_cents?: number | null
          discount_type?: string | null
          discount_value?: number | null
          discounted_price_cents: number
          expires_at?: string | null
          final_price_cents: number
          internal_notes?: string | null
          metadata?: Json
          organization_id: string
          original_price_cents: number
          payment_method_id?: string | null
          purchase_id?: string
          purchase_method?: string | null
          purchase_notes?: string | null
          purchased_at?: string
          purchased_by: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          access_granted_at?: string | null
          access_status?: string
          billing_month?: string
          billing_month_number?: number
          billing_year?: number
          coupon_id?: string | null
          course_id?: string
          created_at?: string
          currency?: string
          discount_cents?: number | null
          discount_type?: string | null
          discount_value?: number | null
          discounted_price_cents?: number
          expires_at?: string | null
          final_price_cents?: number
          internal_notes?: string | null
          metadata?: Json
          organization_id?: string
          original_price_cents?: number
          payment_method_id?: string | null
          purchase_id?: string
          purchase_method?: string | null
          purchase_notes?: string | null
          purchased_at?: string
          purchased_by?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_course_purchases_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["coupon_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "organization_course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["payment_method_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_course_purchases_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_course_purchases_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
      organization_notification_preferences: {
        Row: {
          channels: Json | null
          created_at: string | null
          enabled: boolean | null
          event_type: string
          organization_id: string
          preference_id: string
          template: string | null
          updated_at: string | null
        }
        Insert: {
          channels?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          event_type: string
          organization_id: string
          preference_id?: string
          template?: string | null
          updated_at?: string | null
        }
        Update: {
          channels?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          event_type?: string
          organization_id?: string
          preference_id?: string
          template?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_cycle: string | null
          brand_banner_url: string | null
          brand_color_accent: string | null
          brand_color_primary: string | null
          brand_color_secondary: string | null
          brand_favicon_url: string | null
          brand_font_family: string | null
          brand_logo_url: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          login_styles: Json | null
          logo_url: string | null
          max_users: number | null
          name: string
          panel_styles: Json | null
          selected_theme: string | null
          slug: string | null
          subscription_end_date: string | null
          subscription_plan: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          updated_at: string | null
          user_dashboard_styles: Json | null
          website_url: string | null
        }
        Insert: {
          billing_cycle?: string | null
          brand_banner_url?: string | null
          brand_color_accent?: string | null
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          brand_favicon_url?: string | null
          brand_font_family?: string | null
          brand_logo_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          login_styles?: Json | null
          logo_url?: string | null
          max_users?: number | null
          name: string
          panel_styles?: Json | null
          selected_theme?: string | null
          slug?: string | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_dashboard_styles?: Json | null
          website_url?: string | null
        }
        Update: {
          billing_cycle?: string | null
          brand_banner_url?: string | null
          brand_color_accent?: string | null
          brand_color_primary?: string | null
          brand_color_secondary?: string | null
          brand_favicon_url?: string | null
          brand_font_family?: string | null
          brand_logo_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          login_styles?: Json | null
          logo_url?: string | null
          max_users?: number | null
          name?: string
          panel_styles?: Json | null
          selected_theme?: string | null
          slug?: string | null
          subscription_end_date?: string | null
          subscription_plan?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_dashboard_styles?: Json | null
          website_url?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string | null
          encrypted_data: Json
          is_active: boolean | null
          is_default: boolean | null
          payment_method_id: string
          payment_method_name: string
          payment_method_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_data: Json
          is_active?: boolean | null
          is_default?: boolean | null
          payment_method_id?: string
          payment_method_name: string
          payment_method_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_data?: Json
          is_active?: boolean | null
          is_default?: boolean | null
          payment_method_id?: string
          payment_method_name?: string
          payment_method_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      preguntas: {
        Row: {
          area_id: number | null
          bloque: string | null
          codigo: string | null
          created_at: string
          dificultad: number | null
          dimension: Json | null
          escala: Json | null
          exclusivo_nivel_id: number | null
          exclusivo_rol_id: number | null
          id: number
          locale: string | null
          opciones: Json | null
          peso: number | null
          respuesta_correcta: string | null
          scoring: Json | null
          section: string | null
          texto: string
          tipo: string
        }
        Insert: {
          area_id?: number | null
          bloque?: string | null
          codigo?: string | null
          created_at?: string
          dificultad?: number | null
          dimension?: Json | null
          escala?: Json | null
          exclusivo_nivel_id?: number | null
          exclusivo_rol_id?: number | null
          id?: number
          locale?: string | null
          opciones?: Json | null
          peso?: number | null
          respuesta_correcta?: string | null
          scoring?: Json | null
          section?: string | null
          texto: string
          tipo: string
        }
        Update: {
          area_id?: number | null
          bloque?: string | null
          codigo?: string | null
          created_at?: string
          dificultad?: number | null
          dimension?: Json | null
          escala?: Json | null
          exclusivo_nivel_id?: number | null
          exclusivo_rol_id?: number | null
          id?: number
          locale?: string | null
          opciones?: Json | null
          peso?: number | null
          respuesta_correcta?: string | null
          scoring?: Json | null
          section?: string | null
          texto?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "preguntas_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preguntas_exclusivo_nivel_id_fkey"
            columns: ["exclusivo_nivel_id"]
            isOneToOne: false
            referencedRelation: "niveles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preguntas_exclusivo_rol_id_fkey"
            columns: ["exclusivo_rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_favorites: {
        Row: {
          created_at: string | null
          favorite_id: string
          prompt_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          favorite_id?: string
          prompt_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          favorite_id?: string
          prompt_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_favorites_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "ai_prompts"
            referencedColumns: ["prompt_id"]
          },
          {
            foreignKeyName: "prompt_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "prompt_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "prompt_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      prompt_ratings: {
        Row: {
          created_at: string | null
          prompt_id: string | null
          rating: number
          rating_id: string
          review: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          prompt_id?: string | null
          rating: number
          rating_id?: string
          review?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          prompt_id?: string | null
          rating?: number
          rating_id?: string
          review?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_ratings_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "ai_prompts"
            referencedColumns: ["prompt_id"]
          },
          {
            foreignKeyName: "prompt_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "prompt_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "prompt_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reel_comment_replies: {
        Row: {
          comment_id: string
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment_id: string
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_comment_replies_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "reel_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comment_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reel_comment_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comment_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reel_comment_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reel_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          parent_id: string | null
          reel_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          parent_id?: string | null
          reel_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          parent_id?: string | null
          reel_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reel_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "reel_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comments_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reel_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reel_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reel_hashtag_relations: {
        Row: {
          created_at: string | null
          hashtag_id: string | null
          id: string
          reel_id: string | null
        }
        Insert: {
          created_at?: string | null
          hashtag_id?: string | null
          id?: string
          reel_id?: string | null
        }
        Update: {
          created_at?: string | null
          hashtag_id?: string | null
          id?: string
          reel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reel_hashtag_relations_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "reel_hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_hashtag_relations_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_hashtags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      reel_likes: {
        Row: {
          created_at: string | null
          id: string
          reel_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reel_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reel_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reel_likes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reel_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reel_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reel_shares: {
        Row: {
          created_at: string | null
          id: string
          platform: string | null
          reel_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform?: string | null
          reel_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string | null
          reel_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reel_shares_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reel_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reel_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reel_views: {
        Row: {
          id: string
          ip_address: unknown
          reel_id: string | null
          user_agent: string | null
          user_id: string | null
          viewed_at: string | null
          watch_duration_seconds: number | null
        }
        Insert: {
          id?: string
          ip_address?: unknown
          reel_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
          watch_duration_seconds?: number | null
        }
        Update: {
          id?: string
          ip_address?: unknown
          reel_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
          watch_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reel_views_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reel_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reel_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reels: {
        Row: {
          category: string | null
          comment_count: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          language: string | null
          like_count: number | null
          published_at: string | null
          share_count: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          comment_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          language?: string | null
          like_count?: number | null
          published_at?: string | null
          share_count?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          comment_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          language?: string | null
          like_count?: number | null
          published_at?: string | null
          share_count?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          expires_at: string
          id: string
          ip_address: string | null
          is_revoked: boolean | null
          last_used_at: string | null
          revoked_at: string | null
          revoked_reason: string | null
          token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          is_revoked?: boolean | null
          last_used_at?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_revoked?: boolean | null
          last_used_at?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      relaciones: {
        Row: {
          id: number
          nombre: string
          slug: string
        }
        Insert: {
          id?: number
          nombre: string
          slug: string
        }
        Update: {
          id?: number
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      reportes_problemas: {
        Row: {
          admin_asignado: string | null
          categoria: string
          comportamiento_esperado: string | null
          created_at: string | null
          descripcion: string
          estado: string | null
          id: string
          metadata: Json | null
          navegador: string | null
          notas_admin: string | null
          pagina_url: string
          pasos_reproducir: string | null
          pathname: string | null
          prioridad: string | null
          recording_duration: number | null
          recording_size: string | null
          resuelto_at: string | null
          screen_resolution: string | null
          screenshot_url: string | null
          session_recording: string | null
          titulo: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          admin_asignado?: string | null
          categoria: string
          comportamiento_esperado?: string | null
          created_at?: string | null
          descripcion: string
          estado?: string | null
          id?: string
          metadata?: Json | null
          navegador?: string | null
          notas_admin?: string | null
          pagina_url: string
          pasos_reproducir?: string | null
          pathname?: string | null
          prioridad?: string | null
          recording_duration?: number | null
          recording_size?: string | null
          resuelto_at?: string | null
          screen_resolution?: string | null
          screenshot_url?: string | null
          session_recording?: string | null
          titulo: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          admin_asignado?: string | null
          categoria?: string
          comportamiento_esperado?: string | null
          created_at?: string | null
          descripcion?: string
          estado?: string | null
          id?: string
          metadata?: Json | null
          navegador?: string | null
          notas_admin?: string | null
          pagina_url?: string
          pasos_reproducir?: string | null
          pathname?: string | null
          prioridad?: string | null
          recording_duration?: number | null
          recording_size?: string | null
          resuelto_at?: string | null
          screen_resolution?: string | null
          screenshot_url?: string | null
          session_recording?: string | null
          titulo?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      respuestas: {
        Row: {
          id: number
          pregunta_id: number
          respondido_en: string
          user_perfil_id: string
          valor: Json | null
        }
        Insert: {
          id?: number
          pregunta_id: number
          respondido_en?: string
          user_perfil_id: string
          valor?: Json | null
        }
        Update: {
          id?: number
          pregunta_id?: number
          respondido_en?: string
          user_perfil_id?: string
          valor?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_respuestas_user_perfil_id"
            columns: ["user_perfil_id"]
            isOneToOne: false
            referencedRelation: "user_perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_pregunta_id_fkey"
            columns: ["pregunta_id"]
            isOneToOne: false
            referencedRelation: "preguntas"
            referencedColumns: ["id"]
          },
        ]
      }
      role_synonyms: {
        Row: {
          alias: string
          id: number
          role_id: number | null
        }
        Insert: {
          alias: string
          id?: number
          role_id?: number | null
        }
        Update: {
          alias?: string
          id?: number
          role_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "role_synonyms_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          area_id: number | null
          id: number
          nombre: string
          slug: string
        }
        Insert: {
          area_id?: number | null
          id?: number
          nombre: string
          slug: string
        }
        Update: {
          area_id?: number | null
          id?: number
          nombre?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      sectores: {
        Row: {
          id: number
          nombre: string
          slug: string
        }
        Insert: {
          id?: number
          nombre: string
          slug: string
        }
        Update: {
          id?: number
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      skill_badges: {
        Row: {
          badge_url: string
          created_at: string
          id: string
          level: string
          skill_id: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          badge_url: string
          created_at?: string
          id?: string
          level: string
          skill_id: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          badge_url?: string
          created_at?: string
          id?: string
          level?: string
          skill_id?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_badges_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "skill_badges_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      skill_categories: {
        Row: {
          category_id: string
          color: string | null
          created_at: string
          description: string | null
          display_order: number | null
          icon_url: string | null
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string
          color: string | null
          created_at: string
          description: string | null
          display_order: number | null
          icon_name: string | null
          icon_type: string | null
          icon_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          level: string | null
          name: string
          skill_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          icon_type?: string | null
          icon_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          level?: string | null
          name: string
          skill_id?: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          icon_type?: string | null
          icon_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          level?: string | null
          name?: string
          skill_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_plans: {
        Row: {
          ai_generation_metadata: Json | null
          created_at: string
          description: string | null
          end_date: string | null
          generation_mode: string | null
          goal_hours_per_week: number
          id: string
          name: string
          preferred_days: number[]
          preferred_session_type: string | null
          preferred_time_blocks: Json | null
          start_date: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_generation_metadata?: Json | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          generation_mode?: string | null
          goal_hours_per_week?: number
          id?: string
          name: string
          preferred_days?: number[]
          preferred_session_type?: string | null
          preferred_time_blocks?: Json | null
          start_date?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_generation_metadata?: Json | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          generation_mode?: string | null
          goal_hours_per_week?: number
          id?: string
          name?: string
          preferred_days?: number[]
          preferred_session_type?: string | null
          preferred_time_blocks?: Json | null
          start_date?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      study_preferences: {
        Row: {
          created_at: string
          daily_target_minutes: number
          id: string
          preferred_days: number[]
          preferred_session_type: string | null
          preferred_time_of_day: string
          timezone: string
          updated_at: string
          user_id: string
          weekly_target_minutes: number
        }
        Insert: {
          created_at?: string
          daily_target_minutes?: number
          id?: string
          preferred_days?: number[]
          preferred_session_type?: string | null
          preferred_time_of_day?: string
          timezone?: string
          updated_at?: string
          user_id: string
          weekly_target_minutes?: number
        }
        Update: {
          created_at?: string
          daily_target_minutes?: number
          id?: string
          preferred_days?: number[]
          preferred_session_type?: string | null
          preferred_time_of_day?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          weekly_target_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          actual_duration_minutes: number | null
          calendar_provider: string | null
          completed_at: string | null
          course_complexity: Json | null
          course_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          end_time: string
          external_event_id: string | null
          focus_area: string | null
          id: string
          is_ai_generated: boolean | null
          lesson_id: string | null
          lesson_min_time_minutes: number | null
          metrics: Json | null
          notes: string | null
          plan_id: string | null
          recurrence: Json | null
          rescheduled_from: string | null
          self_evaluation: number | null
          session_type: string | null
          start_time: string
          status: string
          streak_day: number | null
          title: string
          updated_at: string
          user_id: string
          was_rescheduled: boolean | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          calendar_provider?: string | null
          completed_at?: string | null
          course_complexity?: Json | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          end_time: string
          external_event_id?: string | null
          focus_area?: string | null
          id?: string
          is_ai_generated?: boolean | null
          lesson_id?: string | null
          lesson_min_time_minutes?: number | null
          metrics?: Json | null
          notes?: string | null
          plan_id?: string | null
          recurrence?: Json | null
          rescheduled_from?: string | null
          self_evaluation?: number | null
          session_type?: string | null
          start_time: string
          status?: string
          streak_day?: number | null
          title: string
          updated_at?: string
          user_id: string
          was_rescheduled?: boolean | null
        }
        Update: {
          actual_duration_minutes?: number | null
          calendar_provider?: string | null
          completed_at?: string | null
          course_complexity?: Json | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string
          external_event_id?: string | null
          focus_area?: string | null
          id?: string
          is_ai_generated?: boolean | null
          lesson_id?: string | null
          lesson_min_time_minutes?: number | null
          metrics?: Json | null
          notes?: string | null
          plan_id?: string | null
          recurrence?: Json | null
          rescheduled_from?: string | null
          self_evaluation?: number | null
          session_type?: string | null
          start_time?: string
          status?: string
          streak_day?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          was_rescheduled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "study_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "study_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "study_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plan_progress"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "study_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "v_ai_generated_plans"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          course_id: string | null
          created_at: string | null
          end_date: string | null
          next_billing_date: string | null
          plan_id: string | null
          price_cents: number
          start_date: string | null
          subscription_id: string
          subscription_status: string | null
          subscription_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          end_date?: string | null
          next_billing_date?: string | null
          plan_id?: string | null
          price_cents: number
          start_date?: string | null
          subscription_id?: string
          subscription_status?: string | null
          subscription_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          end_date?: string | null
          next_billing_date?: string | null
          plan_id?: string | null
          price_cents?: number
          start_date?: string | null
          subscription_id?: string
          subscription_status?: string | null
          subscription_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "subscriptions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "subscriptions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tamanos_empresa: {
        Row: {
          id: number
          max_empleados: number | null
          min_empleados: number | null
          nombre: string
          slug: string
        }
        Insert: {
          id?: number
          max_empleados?: number | null
          min_empleados?: number | null
          nombre: string
          slug: string
        }
        Update: {
          id?: number
          max_empleados?: number | null
          min_empleados?: number | null
          nombre?: string
          slug?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_cents: number
          course_id: string | null
          created_at: string | null
          currency: string
          payment_method_id: string
          processed_at: string | null
          processor_response: Json | null
          processor_transaction_id: string | null
          transaction_id: string
          transaction_status: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          course_id?: string | null
          created_at?: string | null
          currency?: string
          payment_method_id: string
          processed_at?: string | null
          processor_response?: Json | null
          processor_transaction_id?: string | null
          transaction_id?: string
          transaction_status?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          course_id?: string | null
          created_at?: string | null
          currency?: string
          payment_method_id?: string
          processed_at?: string | null
          processor_response?: Json | null
          processor_transaction_id?: string | null
          transaction_id?: string
          transaction_status?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "transactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "transactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["payment_method_id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          action_description: string | null
          action_timestamp: string | null
          action_type: string
          course_id: string | null
          ip_address: unknown
          lesson_id: string | null
          log_id: string
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_description?: string | null
          action_timestamp?: string | null
          action_type: string
          course_id?: string | null
          ip_address?: unknown
          lesson_id?: string | null
          log_id?: string
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_description?: string | null
          action_timestamp?: string | null
          action_type?: string
          course_id?: string | null
          ip_address?: unknown
          lesson_id?: string | null
          log_id?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_log_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "user_activity_log_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_activity_log_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_log_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_activity_log_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_activity_log_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_activity_log_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_course_certificates: {
        Row: {
          certificate_hash: string | null
          certificate_id: string
          certificate_url: string
          course_id: string
          created_at: string
          enrollment_id: string
          expires_at: string | null
          issued_at: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          certificate_hash?: string | null
          certificate_id?: string
          certificate_url: string
          course_id: string
          created_at?: string
          enrollment_id: string
          expires_at?: string | null
          issued_at?: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          certificate_hash?: string | null
          certificate_id?: string
          certificate_url?: string
          course_id?: string
          created_at?: string
          enrollment_id?: string
          expires_at?: string | null
          issued_at?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "user_course_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_course_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_course_certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "user_course_certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_course_certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_course_certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string | null
          enrolled_at: string | null
          enrollment_id: string
          enrollment_status: string | null
          last_accessed_at: string | null
          overall_progress_percentage: number | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          enrolled_at?: string | null
          enrollment_id?: string
          enrollment_status?: string | null
          last_accessed_at?: string | null
          overall_progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          enrolled_at?: string | null
          enrollment_id?: string
          enrollment_status?: string | null
          last_accessed_at?: string | null
          overall_progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "user_course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          course_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "user_favorites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_favorites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_group_members: {
        Row: {
          assigned_at: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "user_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      user_lesson_notes: {
        Row: {
          created_at: string | null
          is_auto_generated: boolean | null
          lesson_id: string
          note_content: string
          note_id: string
          note_tags: Json | null
          note_title: string
          source_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          is_auto_generated?: boolean | null
          lesson_id: string
          note_content: string
          note_id?: string
          note_tags?: Json | null
          note_title: string
          source_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          is_auto_generated?: boolean | null
          lesson_id?: string
          note_content?: string
          note_id?: string
          note_tags?: Json | null
          note_title?: string
          source_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_lesson_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_lesson_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_lesson_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_lesson_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_time_seconds: number | null
          enrollment_id: string
          is_completed: boolean | null
          last_accessed_at: string | null
          lesson_id: string
          lesson_status: string | null
          progress_id: string
          quiz_completed: boolean | null
          quiz_passed: boolean | null
          quiz_progress_percentage: number | null
          started_at: string | null
          time_spent_minutes: number | null
          updated_at: string | null
          user_id: string
          video_progress_percentage: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_time_seconds?: number | null
          enrollment_id: string
          is_completed?: boolean | null
          last_accessed_at?: string | null
          lesson_id: string
          lesson_status?: string | null
          progress_id?: string
          quiz_completed?: boolean | null
          quiz_passed?: boolean | null
          quiz_progress_percentage?: number | null
          started_at?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
          user_id: string
          video_progress_percentage?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_time_seconds?: number | null
          enrollment_id?: string
          is_completed?: boolean | null
          last_accessed_at?: string | null
          lesson_id?: string
          lesson_status?: string | null
          progress_id?: string
          quiz_completed?: boolean | null
          quiz_passed?: boolean | null
          quiz_progress_percentage?: number | null
          started_at?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          video_progress_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          created_at: string | null
          do_not_disturb_days: Json | null
          do_not_disturb_end: string | null
          do_not_disturb_start: string | null
          email_enabled: boolean | null
          email_frequency: string | null
          in_app_enabled: boolean | null
          notification_type: string
          preference_id: string
          push_enabled: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          do_not_disturb_days?: Json | null
          do_not_disturb_end?: string | null
          do_not_disturb_start?: string | null
          email_enabled?: boolean | null
          email_frequency?: string | null
          in_app_enabled?: boolean | null
          notification_type: string
          preference_id?: string
          push_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          do_not_disturb_days?: Json | null
          do_not_disturb_end?: string | null
          do_not_disturb_start?: string | null
          email_enabled?: boolean | null
          email_frequency?: string | null
          in_app_enabled?: boolean | null
          notification_type?: string
          preference_id?: string
          push_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          channels_pending: Json | null
          channels_sent: Json | null
          created_at: string | null
          expires_at: string | null
          group_id: string | null
          message: string
          metadata: Json | null
          notification_id: string
          notification_type: string
          organization_id: string | null
          priority: string | null
          read_at: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channels_pending?: Json | null
          channels_sent?: Json | null
          created_at?: string | null
          expires_at?: string | null
          group_id?: string | null
          message: string
          metadata?: Json | null
          notification_id?: string
          notification_type: string
          organization_id?: string | null
          priority?: string | null
          read_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channels_pending?: Json | null
          channels_sent?: Json | null
          created_at?: string | null
          expires_at?: string | null
          group_id?: string | null
          message?: string
          metadata?: Json | null
          notification_id?: string
          notification_type?: string
          organization_id?: string | null
          priority?: string | null
          read_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_perfil: {
        Row: {
          actualizado_en: string
          area_id: number | null
          cargo_titulo: string | null
          creado_en: string
          dificultad_id: number | null
          id: string
          nivel_id: number | null
          pais: string | null
          relacion_id: number | null
          rol_id: number | null
          sector_id: number | null
          tamano_id: number | null
          user_id: string
          uso_ia_respuesta: string | null
        }
        Insert: {
          actualizado_en?: string
          area_id?: number | null
          cargo_titulo?: string | null
          creado_en?: string
          dificultad_id?: number | null
          id?: string
          nivel_id?: number | null
          pais?: string | null
          relacion_id?: number | null
          rol_id?: number | null
          sector_id?: number | null
          tamano_id?: number | null
          user_id: string
          uso_ia_respuesta?: string | null
        }
        Update: {
          actualizado_en?: string
          area_id?: number | null
          cargo_titulo?: string | null
          creado_en?: string
          dificultad_id?: number | null
          id?: string
          nivel_id?: number | null
          pais?: string | null
          relacion_id?: number | null
          rol_id?: number | null
          sector_id?: number | null
          tamano_id?: number | null
          user_id?: string
          uso_ia_respuesta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_perfil_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_perfil_nivel_id_fkey"
            columns: ["nivel_id"]
            isOneToOne: false
            referencedRelation: "niveles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_perfil_relacion_id_fkey"
            columns: ["relacion_id"]
            isOneToOne: false
            referencedRelation: "relaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_perfil_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_perfil_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_perfil_tamano_id_fkey"
            columns: ["tamano_id"]
            isOneToOne: false
            referencedRelation: "tamanos_empresa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_perfil_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_perfil_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_perfil_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_perfil_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_quiz_submissions: {
        Row: {
          activity_id: string | null
          completed_at: string | null
          created_at: string | null
          enrollment_id: string
          is_passed: boolean | null
          lesson_id: string
          material_id: string | null
          percentage_score: number | null
          score: number | null
          submission_id: string
          total_points: number | null
          updated_at: string | null
          user_answers: Json
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          enrollment_id: string
          is_passed?: boolean | null
          lesson_id: string
          material_id?: string | null
          percentage_score?: number | null
          score?: number | null
          submission_id?: string
          total_points?: number | null
          updated_at?: string | null
          user_answers?: Json
          user_id: string
        }
        Update: {
          activity_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          enrollment_id?: string
          is_passed?: boolean | null
          lesson_id?: string
          material_id?: string | null
          percentage_score?: number | null
          score?: number | null
          submission_id?: string
          total_points?: number | null
          updated_at?: string | null
          user_answers?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_submissions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lesson_activities"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lia_activity_performance"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v_lessons_by_session_type_compatibility"
            referencedColumns: ["lesson_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "lesson_materials"
            referencedColumns: ["material_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_quiz_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_session: {
        Row: {
          expires_at: string
          id: string
          ip: unknown
          issued_at: string
          jwt_id: string | null
          revoked: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          expires_at: string
          id?: string
          ip?: unknown
          issued_at?: string
          jwt_id?: string | null
          revoked?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string
          id?: string
          ip?: unknown
          issued_at?: string
          jwt_id?: string | null
          revoked?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_session_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_session_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_session_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_session_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_skills: {
        Row: {
          course_id: string | null
          created_at: string
          display_order: number | null
          enrollment_id: string | null
          id: string
          is_displayed: boolean | null
          obtained_at: string
          proficiency_level: string | null
          skill_id: string
          updated_at: string
          user_id: string
          verified: boolean | null
          verified_by: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          display_order?: number | null
          enrollment_id?: string | null
          id?: string
          is_displayed?: boolean | null
          obtained_at?: string
          proficiency_level?: string | null
          skill_id: string
          updated_at?: string
          user_id: string
          verified?: boolean | null
          verified_by?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          display_order?: number | null
          enrollment_id?: string | null
          id?: string
          is_displayed?: boolean | null
          obtained_at?: string
          proficiency_level?: string | null
          skill_id?: string
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "user_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_skills_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          last_session_date: string | null
          longest_streak: number | null
          month_start_date: string | null
          monthly_sessions_completed: number | null
          monthly_study_minutes: number | null
          total_sessions_completed: number | null
          total_sessions_missed: number | null
          total_sessions_rescheduled: number | null
          total_study_minutes: number | null
          updated_at: string | null
          user_id: string
          week_start_date: string | null
          weekly_sessions_completed: number | null
          weekly_study_minutes: number | null
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          last_session_date?: string | null
          longest_streak?: number | null
          month_start_date?: string | null
          monthly_sessions_completed?: number | null
          monthly_study_minutes?: number | null
          total_sessions_completed?: number | null
          total_sessions_missed?: number | null
          total_sessions_rescheduled?: number | null
          total_study_minutes?: number | null
          updated_at?: string | null
          user_id: string
          week_start_date?: string | null
          weekly_sessions_completed?: number | null
          weekly_study_minutes?: number | null
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          last_session_date?: string | null
          longest_streak?: number | null
          month_start_date?: string | null
          monthly_sessions_completed?: number | null
          monthly_study_minutes?: number | null
          total_sessions_completed?: number | null
          total_sessions_missed?: number | null
          total_sessions_rescheduled?: number | null
          total_study_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          week_start_date?: string | null
          weekly_sessions_completed?: number | null
          weekly_study_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_warnings: {
        Row: {
          blocked_content: string | null
          content_id: string | null
          content_type: string
          created_at: string
          reason: string
          user_id: string
          warning_id: string
        }
        Insert: {
          blocked_content?: string | null
          content_id?: string | null
          content_type: string
          created_at?: string
          reason: string
          user_id: string
          warning_id?: string
        }
        Update: {
          blocked_content?: string | null
          content_id?: string | null
          content_type?: string
          created_at?: string
          reason?: string
          user_id?: string
          warning_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          ban_reason: string | null
          banned_at: string | null
          bio: string | null
          cargo_rol: string | null
          country_code: string | null
          created_at: string
          curriculum_url: string | null
          display_name: string | null
          email: string | null
          email_verified: boolean
          email_verified_at: string | null
          first_name: string | null
          github_url: string | null
          id: string
          is_banned: boolean
          last_login_at: string | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          notification_community_updates: boolean | null
          notification_course_updates: boolean | null
          notification_email: boolean | null
          notification_marketing: boolean | null
          notification_push: boolean | null
          oauth_provider: string | null
          oauth_provider_id: string | null
          organization_id: string | null
          password_hash: string | null
          phone: string | null
          points: number | null
          profile_picture_url: string | null
          profile_visibility: string | null
          role_zoom: string | null
          show_activity: boolean | null
          show_email: boolean | null
          signature_name: string | null
          signature_url: string | null
          type_rol: string | null
          updated_at: string
          username: string
          website_url: string | null
        }
        Insert: {
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          cargo_rol?: string | null
          country_code?: string | null
          created_at?: string
          curriculum_url?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean
          email_verified_at?: string | null
          first_name?: string | null
          github_url?: string | null
          id?: string
          is_banned?: boolean
          last_login_at?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          notification_community_updates?: boolean | null
          notification_course_updates?: boolean | null
          notification_email?: boolean | null
          notification_marketing?: boolean | null
          notification_push?: boolean | null
          oauth_provider?: string | null
          oauth_provider_id?: string | null
          organization_id?: string | null
          password_hash?: string | null
          phone?: string | null
          points?: number | null
          profile_picture_url?: string | null
          profile_visibility?: string | null
          role_zoom?: string | null
          show_activity?: boolean | null
          show_email?: boolean | null
          signature_name?: string | null
          signature_url?: string | null
          type_rol?: string | null
          updated_at?: string
          username: string
          website_url?: string | null
        }
        Update: {
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          cargo_rol?: string | null
          country_code?: string | null
          created_at?: string
          curriculum_url?: string | null
          display_name?: string | null
          email?: string | null
          email_verified?: boolean
          email_verified_at?: string | null
          first_name?: string | null
          github_url?: string | null
          id?: string
          is_banned?: boolean
          last_login_at?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          notification_community_updates?: boolean | null
          notification_course_updates?: boolean | null
          notification_email?: boolean | null
          notification_marketing?: boolean | null
          notification_push?: boolean | null
          oauth_provider?: string | null
          oauth_provider_id?: string | null
          organization_id?: string | null
          password_hash?: string | null
          phone?: string | null
          points?: number | null
          profile_picture_url?: string | null
          profile_visibility?: string | null
          role_zoom?: string | null
          show_activity?: boolean | null
          show_email?: boolean | null
          signature_name?: string | null
          signature_url?: string | null
          type_rol?: string | null
          updated_at?: string
          username?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      work_team_course_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          course_id: string
          created_at: string
          due_date: string | null
          id: string
          message: string | null
          status: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          course_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          message?: string | null
          status?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          course_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          message?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_team_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_course_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "work_team_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_course_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "work_teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      work_team_feedback: {
        Row: {
          content: string
          course_id: string | null
          created_at: string
          feedback_id: string
          feedback_type: string
          from_user_id: string
          is_anonymous: boolean | null
          rating: number | null
          team_id: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string
          feedback_id?: string
          feedback_type: string
          from_user_id: string
          is_anonymous?: boolean | null
          rating?: number | null
          team_id: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string
          feedback_id?: string
          feedback_type?: string
          from_user_id?: string
          is_anonymous?: boolean | null
          rating?: number | null
          team_id?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_team_feedback_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "work_team_feedback_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_feedback_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_feedback_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_feedback_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_feedback_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_feedback_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_feedback_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_feedback_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "work_teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "work_team_feedback_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_feedback_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_feedback_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_feedback_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      work_team_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          role: string | null
          status: string | null
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          role?: string | null
          status?: string | null
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          role?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "work_teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "work_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      work_team_messages: {
        Row: {
          content: string
          course_id: string | null
          created_at: string
          is_pinned: boolean | null
          message_id: string
          message_type: string | null
          reply_to_message_id: string | null
          sender_id: string
          team_id: string
          updated_at: string
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string
          is_pinned?: boolean | null
          message_id?: string
          message_type?: string | null
          reply_to_message_id?: string | null
          sender_id: string
          team_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string
          is_pinned?: boolean | null
          message_id?: string
          message_type?: string | null
          reply_to_message_id?: string | null
          sender_id?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_team_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "work_team_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_messages_reply_to_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "work_team_messages"
            referencedColumns: ["message_id"]
          },
          {
            foreignKeyName: "work_team_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "work_teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      work_team_objectives: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string
          current_value: number | null
          deadline: string | null
          description: string | null
          metric_type: string
          objective_id: string
          status: string | null
          target_value: number
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by: string
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          metric_type: string
          objective_id?: string
          status?: string | null
          target_value: number
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          metric_type?: string
          objective_id?: string
          status?: string | null
          target_value?: number
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_team_objectives_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "work_team_objectives_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_objectives_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_objectives_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_objectives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_objectives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_objectives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_objectives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_team_objectives_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "work_teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      work_team_statistics: {
        Row: {
          active_members: number | null
          average_completion_percentage: number | null
          average_score: number | null
          calculated_at: string
          course_id: string | null
          metadata: Json | null
          stat_date: string
          stat_id: string
          team_id: string
          total_feedback_given: number | null
          total_interactions: number | null
          total_members: number | null
          total_messages: number | null
        }
        Insert: {
          active_members?: number | null
          average_completion_percentage?: number | null
          average_score?: number | null
          calculated_at?: string
          course_id?: string | null
          metadata?: Json | null
          stat_date: string
          stat_id?: string
          team_id: string
          total_feedback_given?: number | null
          total_interactions?: number | null
          total_members?: number | null
          total_messages?: number | null
        }
        Update: {
          active_members?: number | null
          average_completion_percentage?: number | null
          average_score?: number | null
          calculated_at?: string
          course_id?: string | null
          metadata?: Json | null
          stat_date?: string
          stat_id?: string
          team_id?: string
          total_feedback_given?: number | null
          total_interactions?: number | null
          total_members?: number | null
          total_messages?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "work_team_statistics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "work_team_statistics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_statistics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_team_statistics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_team_statistics_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "work_teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      work_teams: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string
          description: string | null
          image_url: string | null
          metadata: Json | null
          name: string
          organization_id: string
          status: string | null
          team_id: string
          team_leader_id: string | null
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          image_url?: string | null
          metadata?: Json | null
          name: string
          organization_id: string
          status?: string | null
          team_id?: string
          team_leader_id?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          image_url?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          status?: string | null
          team_id?: string
          team_leader_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_teams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "work_teams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_teams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_teams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "work_teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_stats"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "work_teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "work_teams_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_teams_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_teams_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "work_teams_team_leader_id_fkey"
            columns: ["team_leader_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      ai_moderation_pending_review: {
        Row: {
          categories: Json | null
          confidence_score: number | null
          content_id: string | null
          content_preview: string | null
          content_type: string | null
          created_at: string | null
          email: string | null
          is_flagged: boolean | null
          log_id: string | null
          reasoning: string | null
          user_id: string | null
          user_warning_count: number | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_moderation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_stats: {
        Row: {
          access_type: string | null
          active_comments_count: number | null
          active_members_count: number | null
          active_videos_count: number | null
          admin_count: number | null
          approved_requests_count: number | null
          comments_count: number | null
          course_id: string | null
          course_id_full: string | null
          course_slug: string | null
          course_thumbnail: string | null
          course_title: string | null
          created_at: string | null
          creator_avatar: string | null
          creator_display_name: string | null
          creator_email: string | null
          creator_first_name: string | null
          creator_id: string | null
          creator_last_name: string | null
          creator_username: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          last_comment_at: string | null
          last_member_joined_at: string | null
          last_post_at: string | null
          member_count: number | null
          members_count: number | null
          moderator_count: number | null
          name: string | null
          pending_requests_count: number | null
          pinned_posts_count: number | null
          posts_count: number | null
          reaction_like_count: number | null
          reaction_love_count: number | null
          rejected_requests_count: number | null
          slug: string | null
          total_posts_likes: number | null
          total_posts_views: number | null
          total_reactions_count: number | null
          updated_at: string | null
          videos_count: number | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "communities_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "communities_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      course_skills_view: {
        Row: {
          color: string | null
          course_id: string | null
          course_slug: string | null
          course_title: string | null
          display_order: number | null
          icon_name: string | null
          icon_type: string | null
          icon_url: string | null
          is_primary: boolean | null
          is_required: boolean | null
          proficiency_level: string | null
          skill_category: string | null
          skill_description: string | null
          skill_id: string | null
          skill_name: string | null
          skill_slug: string | null
        }
        Relationships: []
      }
      lia_activity_performance: {
        Row: {
          abandoned_count: number | null
          activity_id: string | null
          activity_title: string | null
          activity_type: string | null
          avg_attempts_to_complete: number | null
          avg_completion_time_seconds: number | null
          avg_redirects_per_user: number | null
          avg_user_rating: number | null
          completed_count: number | null
          completion_rate_pct: number | null
          course_title: string | null
          lesson_title: string | null
          total_attempts: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      lia_conversation_analytics: {
        Row: {
          activity_title: string | null
          avg_rating: number | null
          avg_response_time_ms: number | null
          context_type: string | null
          conversation_completed: boolean | null
          conversation_id: string | null
          course_title: string | null
          duration_seconds: number | null
          email: string | null
          ended_at: string | null
          feedback_count: number | null
          lesson_title: string | null
          lia_messages_per_user_message: number | null
          started_at: string | null
          total_cost_usd: number | null
          total_messages: number | null
          total_tokens: number | null
          user_abandoned: boolean | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "lia_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      moderation_stats: {
        Row: {
          ban_reason: string | null
          banned_at: string | null
          email: string | null
          is_banned: boolean | null
          last_warning_date: string | null
          total_warnings: number | null
          user_id: string | null
          username: string | null
          warning_reasons: string[] | null
        }
        Relationships: []
      }
      mv_community_stats: {
        Row: {
          comment_count: number | null
          community_id: string | null
          last_comment_at: string | null
          last_post_at: string | null
          member_count: number | null
          name: string | null
          post_count: number | null
          reaction_count: number | null
          slug: string | null
        }
        Relationships: []
      }
      mv_post_stats: {
        Row: {
          angry_count: number | null
          comment_count: number | null
          community_id: string | null
          last_comment_at: string | null
          laugh_count: number | null
          like_count: number | null
          love_count: number | null
          post_id: string | null
          reaction_count: number | null
          sad_count: number | null
          user_id: string | null
          wow_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "mv_community_stats"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      my_courses: {
        Row: {
          access_granted_at: string | null
          access_status: Database["public"]["Enums"]["access_status"] | null
          course_id: string | null
          course_title: string | null
          currency: string | null
          enrollment_id: string | null
          expires_at: string | null
          final_price_cents: number | null
          purchase_id: string | null
          purchased_at: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "community_stats"
            referencedColumns: ["course_id_full"]
          },
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_skills_view"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_purchases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "v_incomplete_lesson_times"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_purchases_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_course_enrollments"
            referencedColumns: ["enrollment_id"]
          },
          {
            foreignKeyName: "course_purchases_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "course_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "course_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reportes_con_usuario: {
        Row: {
          admin_asignado: string | null
          admin_nombre: string | null
          categoria: string | null
          comportamiento_esperado: string | null
          created_at: string | null
          descripcion: string | null
          display_name: string | null
          email: string | null
          estado: string | null
          id: string | null
          metadata: Json | null
          navegador: string | null
          notas_admin: string | null
          pagina_url: string | null
          pasos_reproducir: string | null
          pathname: string | null
          prioridad: string | null
          resuelto_at: string | null
          screen_resolution: string | null
          screenshot_url: string | null
          titulo: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
          user_role: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_admin_asignado_fkey"
            columns: ["admin_asignado"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reportes_problemas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      study_plan_progress: {
        Row: {
          avg_self_evaluation: number | null
          completion_percentage: number | null
          first_session_date: string | null
          last_completed_date: string | null
          last_session_date: string | null
          plan_created_at: string | null
          plan_id: string | null
          plan_name: string | null
          sessions_completed: number | null
          sessions_missed: number | null
          sessions_pending: number | null
          sessions_rescheduled: number | null
          total_planned_minutes: number | null
          total_sessions: number | null
          total_studied_minutes: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_calendar_subscriptions: {
        Row: {
          active_sessions_count: number | null
          created_at: string | null
          has_calendar_integrations: boolean | null
          last_used_at: string | null
          token: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          active_sessions_count?: never
          created_at?: string | null
          has_calendar_integrations?: never
          last_used_at?: string | null
          token?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          active_sessions_count?: never
          created_at?: string | null
          has_calendar_integrations?: never
          last_used_at?: string | null
          token?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "calendar_subscription_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_unread_notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          message: string | null
          notification_id: string | null
          notification_type: string | null
          priority: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          message?: string | null
          notification_id?: string | null
          notification_type?: string | null
          priority?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          message?: string | null
          notification_id?: string | null
          notification_type?: string | null
          priority?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_unread_notifications_count: {
        Row: {
          critical_count: number | null
          high_count: number | null
          unread_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_ai_generated_plans: {
        Row: {
          ai_generation_metadata: Json | null
          completed_sessions: number | null
          completion_percentage: number | null
          created_at: string | null
          plan_id: string | null
          plan_name: string | null
          preferred_session_type: string | null
          total_sessions: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "moderation_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_organization_users_detailed"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_security_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_incomplete_lesson_times: {
        Row: {
          activities_missing_time: number | null
          course_id: string | null
          course_title: string | null
          current_total_time: number | null
          lesson_id: string | null
          lesson_order_index: number | null
          lesson_title: string | null
          materials_missing_time: number | null
          total_incomplete_items: number | null
        }
        Relationships: []
      }
      v_lessons_by_session_type_compatibility: {
        Row: {
          compatible_session_types: string[] | null
          course_title: string | null
          lesson_id: string | null
          lesson_title: string | null
          total_time_minutes: number | null
        }
        Relationships: []
      }
      v_organization_stats: {
        Row: {
          avg_completion_rate: number | null
          completed_assignments: number | null
          current_users: number | null
          max_users: number | null
          organization_id: string | null
          organization_name: string | null
          subscription_alert: string | null
          subscription_end_date: string | null
          subscription_plan: string | null
          subscription_status: string | null
          total_assignments: number | null
        }
        Relationships: []
      }
      v_organization_users_detailed: {
        Row: {
          display_name: string | null
          email: string | null
          joined_at: string | null
          org_role: string | null
          org_status: string | null
          organization_id: string | null
          organization_name: string | null
          user_created_at: string | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      v_session_type_distribution: {
        Row: {
          avg_duration_minutes: number | null
          completion_rate: number | null
          session_count: number | null
          session_type: string | null
          unique_users: number | null
        }
        Relationships: []
      }
      v_user_security_summary: {
        Row: {
          active_tokens_count: number | null
          email: string | null
          email_verified: boolean | null
          first_login_date: string | null
          last_login_date: string | null
          last_token_usage: string | null
          unique_devices_count: number | null
          unique_ips_count: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_community_creation_request: {
        Args: { request_id: string; reviewer_id: string }
        Returns: string
      }
      calculate_course_complexity: {
        Args: { p_category: string; p_level: string }
        Returns: number
      }
      calculate_lesson_total_time: {
        Args: { p_lesson_id: string }
        Returns: number
      }
      calculate_reel_comment_count: {
        Args: { reel_uuid: string }
        Returns: number
      }
      can_assign_courses: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: boolean
      }
      can_organization_purchase_course: {
        Args: { p_max_courses_per_month?: number; p_organization_id: string }
        Returns: boolean
      }
      certificate_hash_immutable: {
        Args: {
          p_certificate_id: string
          p_certificate_url: string
          p_course_id: string
          p_enrollment_id: string
          p_issued_at: string
          p_user_id: string
        }
        Returns: string
      }
      clean_expired_refresh_tokens: { Args: never; Returns: undefined }
      cleanup_expired_refresh_tokens: { Args: never; Returns: undefined }
      cleanup_old_community_data: { Args: never; Returns: undefined }
      close_conversation: {
        Args: { p_completed?: boolean; p_conversation_id: string }
        Returns: undefined
      }
      contains_forbidden_content: { Args: { p_text: string }; Returns: Json }
      count_active_users: {
        Args: { p_organization_id: string }
        Returns: number
      }
      decrement_comment_count: { Args: { post_id: string }; Returns: undefined }
      detect_suspicious_token_activity: {
        Args: never
        Returns: {
          active_tokens_count: number
          different_devices_count: number
          different_ips_count: number
          user_id: string
        }[]
      }
      expire_certificate: { Args: { p_cert_id: string }; Returns: undefined }
      extract_team_id_from_path: { Args: { p_path: string }; Returns: string }
      get_ai_moderation_stats: { Args: { p_days?: number }; Returns: Json }
      get_comments_with_user_data: {
        Args: { p_limit?: number; p_offset?: number; p_post_id: string }
        Returns: {
          comment_id: string
          content: string
          created_at: string
          parent_comment_id: string
          post_id: string
          reply_count: number
          updated_at: string
          user_display_name: string
          user_id: string
          user_profile_picture_url: string
          user_username: string
        }[]
      }
      get_dashboard_stats: { Args: { p_user_id: string }; Returns: Json }
      get_entity_translations: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_language_code: string
        }
        Returns: Json
      }
      get_or_create_subscription_token: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_organization_monthly_course_count: {
        Args: { p_month?: number; p_organization_id: string; p_year?: number }
        Returns: number
      }
      get_posts_with_stats: {
        Args: { p_community_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          attachment_data: Json
          attachment_type: string
          attachment_url: string
          comments_count: number
          community_id: string
          content: string
          created_at: string
          is_edited: boolean
          is_pinned: boolean
          post_id: string
          reaction_count: number
          reaction_stats: Json
          title: string
          updated_at: string
          user_display_name: string
          user_id: string
          user_profile_picture_url: string
          user_username: string
        }[]
      }
      get_reactions_summary: {
        Args: { p_post_id: string }
        Returns: {
          count: number
          reaction_type: string
          users: Json
        }[]
      }
      get_reels_with_stats: {
        Args: {
          p_category?: string
          p_language?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          category: string
          comment_count: number
          created_at: string
          created_by: string
          creator_first_name: string
          creator_last_name: string
          creator_profile_picture_url: string
          creator_username: string
          description: string
          duration_seconds: number
          hashtags: string[]
          id: string
          is_featured: boolean
          language: string
          like_count: number
          published_at: string
          share_count: number
          thumbnail_url: string
          title: string
          video_url: string
          view_count: number
        }[]
      }
      get_reportes_stats: {
        Args: never
        Returns: {
          en_progreso: number
          en_revision: number
          pendientes: number
          por_categoria: Json
          resueltos: number
          tiempo_promedio_resolucion: unknown
          total_reportes: number
        }[]
      }
      get_session_type_duration_range: {
        Args: { p_session_type: string }
        Returns: {
          max_duration_minutes: number
          min_duration_minutes: number
          session_type: string
        }[]
      }
      get_translation: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_fallback_value: string
          p_field_name: string
          p_language_code: string
        }
        Returns: string
      }
      get_user_skill_level: {
        Args: { p_skill_id: string; p_user_id: string }
        Returns: {
          course_count: number
          level: string
          next_level_courses_needed: number
        }[]
      }
      get_user_skills: {
        Args: { p_user_id: string }
        Returns: {
          color: string
          course_count: number
          courses: Json
          icon_name: string
          icon_type: string
          icon_url: string
          obtained_at: string
          proficiency_level: string
          skill_category: string
          skill_description: string
          skill_id: string
          skill_name: string
          skill_slug: string
        }[]
      }
      get_user_warning_history: {
        Args: { p_user_id: string }
        Returns: {
          content_type: string
          created_at: string
          reason: string
          warning_id: string
          warning_number: number
        }[]
      }
      get_user_warnings_count: { Args: { p_user_id: string }; Returns: number }
      is_active_team_member: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_leader_or_coleader: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_user_banned: { Args: { p_user_id: string }; Returns: boolean }
      ledger_block_hash_immutable: {
        Args: {
          p_cert_id: string
          p_created_at: string
          p_op: string
          p_payload: Json
          p_prev_hash: string
        }
        Returns: string
      }
      log_lia_message: {
        Args: {
          p_content: string
          p_conversation_id: string
          p_cost_usd?: number
          p_is_system_message?: boolean
          p_model_used?: string
          p_response_time_ms?: number
          p_role: string
          p_tokens_used?: number
        }
        Returns: string
      }
      refresh_community_materialized_views: { Args: never; Returns: undefined }
      regenerate_subscription_token: {
        Args: { p_user_id: string }
        Returns: string
      }
      register_ai_moderation_analysis: {
        Args: {
          p_api_response: Json
          p_categories: Json
          p_confidence_score: number
          p_content_id: string
          p_content_text: string
          p_content_type: string
          p_is_flagged: boolean
          p_model_used: string
          p_processing_time_ms: number
          p_reasoning: string
          p_user_id: string
        }
        Returns: string
      }
      register_user_warning: {
        Args: {
          p_blocked_content?: string
          p_content_id?: string
          p_content_type: string
          p_reason: string
          p_user_id: string
        }
        Returns: Json
      }
      reject_community_creation_request: {
        Args: {
          rejection_reason: string
          request_id: string
          reviewer_id: string
        }
        Returns: undefined
      }
      revoke_all_user_tokens: {
        Args: { p_reason?: string; p_user_id: string }
        Returns: number
      }
      revoke_certificate: {
        Args: { p_cert_id: string; p_reason: string }
        Returns: undefined
      }
      update_all_reel_comment_counts: { Args: never; Returns: undefined }
      update_lesson_time_estimate: {
        Args: { p_lesson_id: string }
        Returns: undefined
      }
      update_reel_comment_count: {
        Args: { reel_uuid: string }
        Returns: undefined
      }
      update_token_usage: { Args: { p_token: string }; Returns: undefined }
      validate_certificate: {
        Args: { p_hash: string }
        Returns: {
          certificate_id: string
          chain_ok: boolean
          course_title: string
          is_expired: boolean
          is_valid: boolean
          issued_at: string
          last_block_at: string
          last_op: string
          user_id: string
        }[]
      }
      validate_lesson_fits_session_type: {
        Args: { p_lesson_id: string; p_session_type: string }
        Returns: boolean
      }
    }
    Enums: {
      access_status: "active" | "suspended" | "expired" | "cancelled"
      discount_type: "percentage" | "fixed_amount"
      purchase_method: "direct" | "subscription" | "gift" | "promo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_status: ["active", "suspended", "expired", "cancelled"],
      discount_type: ["percentage", "fixed_amount"],
      purchase_method: ["direct", "subscription", "gift", "promo"],
    },
  },
} as const
