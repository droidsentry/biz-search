export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      owner_companies: {
        Row: {
          company_name: string
          company_number: string | null
          id: string
          is_verified: boolean | null
          owner_id: string
          position: string | null
          rank: number
          researched_at: string
          researched_by: string
          source_url: string
          updated_at: string
        }
        Insert: {
          company_name: string
          company_number?: string | null
          id?: string
          is_verified?: boolean | null
          owner_id: string
          position?: string | null
          rank: number
          researched_at?: string
          researched_by: string
          source_url: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          company_number?: string | null
          id?: string
          is_verified?: boolean | null
          owner_id?: string
          position?: string | null
          rank?: number
          researched_at?: string
          researched_by?: string
          source_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          address: string
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          street_view_available: boolean | null
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          street_view_available?: boolean | null
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          street_view_available?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          added_at: string
          added_by: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          id?: string
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_properties: {
        Row: {
          added_at: string
          added_by: string
          id: string
          import_source_file: string | null
          project_id: string
          property_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          id?: string
          import_source_file?: string | null
          project_id: string
          property_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          id?: string
          import_source_file?: string | null
          project_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_properties_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      property_ownerships: {
        Row: {
          created_at: string
          id: string
          is_current: boolean | null
          owner_id: string
          ownership_end: string | null
          ownership_start: string
          property_id: string
          recorded_by: string
          source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_current?: boolean | null
          owner_id: string
          ownership_end?: string | null
          ownership_start?: string
          property_id: string
          recorded_by: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_current?: boolean | null
          owner_id?: string
          ownership_end?: string | null
          ownership_start?: string
          property_id?: string
          recorded_by?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_ownerships_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_ownerships_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      search_api_logs: {
        Row: {
          api_response_time: number | null
          created_at: string
          error_message: string | null
          google_custom_search_params: Json
          id: string
          ip_address: unknown | null
          pattern_id: string | null
          project_id: string
          result_count: number | null
          status_code: number
          user_agent: string | null
          user_id: string
        }
        Insert: {
          api_response_time?: number | null
          created_at?: string
          error_message?: string | null
          google_custom_search_params: Json
          id?: string
          ip_address?: unknown | null
          pattern_id?: string | null
          project_id: string
          result_count?: number | null
          status_code: number
          user_agent?: string | null
          user_id?: string
        }
        Update: {
          api_response_time?: number | null
          created_at?: string
          error_message?: string | null
          google_custom_search_params?: Json
          id?: string
          ip_address?: unknown | null
          pattern_id?: string | null
          project_id?: string
          result_count?: number | null
          status_code?: number
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_api_logs_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "search_patterns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_api_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      search_patterns: {
        Row: {
          created_at: string
          description: string | null
          google_custom_search_params: Json
          id: string
          last_used_at: string | null
          name: string
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          google_custom_search_params: Json
          id?: string
          last_used_at?: string | null
          name: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          google_custom_search_params?: Json
          id?: string
          last_used_at?: string | null
          name?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cached_uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      delete_old_search_api_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_project_api_usage: {
        Args: { p_project_id: string; p_period?: unknown }
        Returns: {
          date: string
          total_requests: number
          successful_requests: number
          avg_response_time: number
        }[]
      }
      get_project_export_data: {
        Args: { p_project_id: string }
        Returns: {
          property_address: string
          owner_name: string
          owner_address: string
          owner_lat: number
          owner_lng: number
          company_1_name: string
          company_1_number: string
          company_1_position: string
          company_2_name: string
          company_2_number: string
          company_2_position: string
          company_3_name: string
          company_3_number: string
          company_3_position: string
          ownership_start: string
          import_date: string
          researched_date: string
        }[]
      }
      get_user_patterns_with_stats: {
        Args: { p_user_id: string }
        Returns: {
          pattern_id: string
          pattern_name: string
          total_usage_count: number
          last_30_days_count: number
          last_used_at: string
        }[]
      }
      increment_search_pattern_usage: {
        Args: { pattern_id: string }
        Returns: undefined
      }
      is_system_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_accessible_projects: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      user_editable_projects: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
