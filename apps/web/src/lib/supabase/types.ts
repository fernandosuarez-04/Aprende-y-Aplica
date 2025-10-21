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
