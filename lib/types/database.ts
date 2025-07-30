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
      api_global_limits: {
        Row: {
          api_name: string
          daily_limit: number
          is_active: boolean
          monthly_limit: number
          updated_at: string
        }
        Insert: {
          api_name: string
          daily_limit?: number
          is_active?: boolean
          monthly_limit?: number
          updated_at?: string
        }
        Update: {
          api_name?: string
          daily_limit?: number
          is_active?: boolean
          monthly_limit?: number
          updated_at?: string
        }
        Relationships: []
      }
      api_global_usage: {
        Row: {
          api_name: string
          blocked_until: string | null
          daily_count: number
          daily_date: string
          is_blocked: boolean
          monthly_count: number
          monthly_date: string
          updated_at: string
        }
        Insert: {
          api_name: string
          blocked_until?: string | null
          daily_count?: number
          daily_date?: string
          is_blocked?: boolean
          monthly_count?: number
          monthly_date?: string
          updated_at?: string
        }
        Update: {
          api_name?: string
          blocked_until?: string | null
          daily_count?: number
          daily_date?: string
          is_blocked?: boolean
          monthly_count?: number
          monthly_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      geocoding_logs: {
        Row: {
          address: string
          api_response_time: number | null
          created_at: string
          error_message: string | null
          id: string
          lat: number | null
          lng: number | null
          street_view_available: boolean | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          address: string
          api_response_time?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          street_view_available?: boolean | null
          success: boolean
          user_id?: string | null
        }
        Update: {
          address?: string
          api_response_time?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          street_view_available?: boolean | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geocoding_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_count: number | null
          errors: Json | null
          id: string
          processed_count: number | null
          project_description: string | null
          project_id: string
          project_name: string
          session_id: string
          started_at: string | null
          status: string
          success_count: number | null
          total_count: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_count?: number | null
          errors?: Json | null
          id?: string
          processed_count?: number | null
          project_description?: string | null
          project_id: string
          project_name: string
          session_id: string
          started_at?: string | null
          status?: string
          success_count?: number | null
          total_count?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_count?: number | null
          errors?: Json | null
          id?: string
          processed_count?: number | null
          project_description?: string | null
          project_id?: string
          project_name?: string
          session_id?: string
          started_at?: string | null
          status?: string
          success_count?: number | null
          total_count?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      import_staging: {
        Row: {
          created_at: string | null
          id: string
          lat: number | null
          lng: number | null
          owner_address: string
          owner_name: string
          property_address: string
          session_id: string
          source_file_name: string | null
          street_view_available: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          owner_address: string
          owner_name: string
          property_address: string
          session_id: string
          source_file_name?: string | null
          street_view_available?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          owner_address?: string
          owner_name?: string
          property_address?: string
          session_id?: string
          source_file_name?: string | null
          street_view_available?: boolean | null
        }
        Relationships: []
      }
      owner_companies: {
        Row: {
          company_name: string
          company_number: string | null
          id: string
          is_verified: boolean | null
          owner_id: string
          rank: number
          researched_at: string
          researched_by: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          company_number?: string | null
          id?: string
          is_verified?: boolean | null
          owner_id: string
          rank: number
          researched_at?: string
          researched_by?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          company_number?: string | null
          id?: string
          is_verified?: boolean | null
          owner_id?: string
          rank?: number
          researched_at?: string
          researched_by?: string | null
          source_url?: string | null
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
          {
            foreignKeyName: "owner_companies_researched_by_fkey"
            columns: ["researched_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          address: string
          created_at: string
          id: string
          investigation_status: Database["public"]["Enums"]["investigation_status"]
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
          investigation_status?: Database["public"]["Enums"]["investigation_status"]
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
          investigation_status?: Database["public"]["Enums"]["investigation_status"]
          lat?: number | null
          lng?: number | null
          name?: string
          street_view_available?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      pdf_processing_logs: {
        Row: {
          created_at: string
          error_count: number
          file_count: number
          id: string
          processing_time: number | null
          success_count: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_count?: number
          file_count: number
          id?: string
          processing_time?: number | null
          success_count?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_count?: number
          file_count?: number
          id?: string
          processing_time?: number | null
          success_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_processing_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          display_name: string | null
          email: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          added_at: string
          added_by: string | null
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          id?: string
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_properties: {
        Row: {
          added_at: string
          added_by: string | null
          id: string
          import_source_file: string | null
          project_id: string
          property_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          id?: string
          import_source_file?: string | null
          project_id: string
          property_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          id?: string
          import_source_file?: string | null
          project_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_properties_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          recorded_by: string | null
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
          recorded_by?: string | null
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
          recorded_by?: string | null
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
          {
            foreignKeyName: "property_ownerships_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          project_id: string | null
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
          project_id?: string | null
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
          project_id?: string | null
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
          {
            foreignKeyName: "search_api_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        Relationships: [
          {
            foreignKeyName: "search_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_global_api_limit: {
        Args: { p_api_name: string; p_increment?: number }
        Returns: Json
      }
      cleanup_old_staging_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_project_and_import_properties: {
        Args: {
          p_project_name: string
          p_project_description: string
          p_session_id: string
          p_user_id?: string
        }
        Returns: Json
      }
      deactivate_user_account: {
        Args: { user_id: string; reason?: string }
        Returns: undefined
      }
      delete_old_search_api_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_active_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_global_api_usage_stats: {
        Args: { p_api_name?: string }
        Returns: {
          api_name: string
          daily_used: number
          daily_limit: number
          monthly_used: number
          monthly_limit: number
          is_blocked: boolean
          blocked_until: string
        }[]
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
          company_1_source_url: string
          company_2_name: string
          company_2_number: string
          company_2_source_url: string
          company_3_name: string
          company_3_number: string
          company_3_source_url: string
          ownership_start: string
          import_date: string
          researched_date: string
        }[]
      }
      get_project_owners_view: {
        Args: { p_project_id: string }
        Returns: {
          project_property_id: string
          property_id: string
          property_address: string
          added_at: string
          import_source_file: string
          ownership_id: string
          ownership_start: string
          owner_id: string
          owner_name: string
          owner_address: string
          owner_lat: number
          owner_lng: number
          owner_street_view_available: boolean
          owner_investigation_status: Database["public"]["Enums"]["investigation_status"]
          owner_created_at: string
          owner_updated_at: string
          company_id: string
          company_name: string
          company_number: string
          company_rank: number
          owner_companies_count: number
        }[]
      }
      get_project_properties_view: {
        Args: { p_project_id: string }
        Returns: {
          project_property_id: string
          property_id: string
          property_address: string
          added_at: string
          import_source_file: string
          owner_count: number
          primary_owner_id: string
          primary_owner_name: string
          primary_owner_address: string
          primary_owner_lat: number
          primary_owner_lng: number
          primary_owner_street_view_available: boolean
          primary_owner_investigation_status: Database["public"]["Enums"]["investigation_status"]
          primary_company_id: string
          primary_company_name: string
          primary_company_position: string
          primary_owner_companies_count: number
        }[]
      }
      get_project_stats: {
        Args: { p_project_id: string }
        Returns: {
          total_properties: number
          total_owners: number
          completed_owners: number
          owner_progress: number
        }[]
      }
      get_projects_with_full_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          created_by: string
          created_at: string
          updated_at: string
          total_properties: number
          total_owners: number
          completed_owners: number
          owner_progress: number
        }[]
      }
      get_projects_with_owner_progress: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          created_by: string
          created_at: string
          updated_at: string
          total_owners: number
          completed_owners: number
          progress: number
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
      investigation_status: "pending" | "completed" | "unknown"
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
      investigation_status: ["pending", "completed", "unknown"],
    },
  },
} as const
