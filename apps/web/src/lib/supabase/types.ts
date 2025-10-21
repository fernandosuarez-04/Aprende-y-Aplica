export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          password_hash: string
          first_name: string | null
          last_name: string | null
          display_name: string | null
          email_verified: boolean
          phone_number: string | null
          phone: string | null
          country_code: string | null
          cargo_rol: string
          profile_picture_url: string | null
          curriculum_url: string | null
          bio: string | null
          location: string | null
          linkedin_url: string | null
          github_url: string | null
          website_url: string | null
          points: number | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          password_hash: string
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          email_verified?: boolean
          phone_number?: string | null
          phone?: string | null
          country_code?: string | null
          cargo_rol?: string
          profile_picture_url?: string | null
          curriculum_url?: string | null
          bio?: string | null
          location?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          website_url?: string | null
          points?: number | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          password_hash?: string
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          email_verified?: boolean
          phone_number?: string | null
          phone?: string | null
          country_code?: string | null
          cargo_rol?: string
          profile_picture_url?: string | null
          curriculum_url?: string | null
          bio?: string | null
          location?: string | null
          linkedin_url?: string | null
          github_url?: string | null
          website_url?: string | null
          points?: number | null
          last_login_at?: string | null
          updated_at?: string
        }
      }
      user_session: {
        Row: {
          id: string
          user_id: string
          jwt_id: string
          issued_at: string
          expires_at: string
          ip: string
          user_agent: string
          revoked: boolean
        }
        Insert: {
          id?: string
          user_id: string
          jwt_id: string
          issued_at: string
          expires_at: string
          ip: string
          user_agent: string
          revoked?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          jwt_id?: string
          issued_at?: string
          expires_at?: string
          ip?: string
          user_agent?: string
          revoked?: boolean
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          level: string
          instructor_id: string
          duration_total_minutes: number
          thumbnail_url: string
          slug: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          level: string
          instructor_id: string
          duration_total_minutes: number
          thumbnail_url: string
          slug: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          level?: string
          instructor_id?: string
          duration_total_minutes?: number
          thumbnail_url?: string
          slug?: string
          is_active?: boolean
          updated_at?: string
        }
      }
      user_favorites: {
        Row: {
          id: string
          user_id: string
          course_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
