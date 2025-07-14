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
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          service: string
        }
        Insert: {
          api_key: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          service: string
        }
        Update: {
          api_key?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          service?: string
        }
        Relationships: []
      }
      callouts: {
        Row: {
          created_at: string
          default_cpu: number
          default_disk: number
          default_ram: number
          description: string | null
          docker_image: string | null
          egg_id: number
          environment: Json | null
          id: string
          is_active: boolean
          label: string
          node_id: string | null
          startup_command: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_cpu?: number
          default_disk?: number
          default_ram?: number
          description?: string | null
          docker_image?: string | null
          egg_id?: number
          environment?: Json | null
          id?: string
          is_active?: boolean
          label: string
          node_id?: string | null
          startup_command?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_cpu?: number
          default_disk?: number
          default_ram?: number
          description?: string | null
          docker_image?: string | null
          egg_id?: number
          environment?: Json | null
          id?: string
          is_active?: boolean
          label?: string
          node_id?: string | null
          startup_command?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      node_reservations: {
        Row: {
          id: string
          node_id: string
          order_id: string
          reserved_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          node_id: string
          order_id: string
          reserved_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string
          node_id?: string
          order_id?: string
          reserved_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "node_reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      nodes: {
        Row: {
          created_at: string | null
          id: number
          location_id: number | null
          name: string | null
          reserved_by: string | null
        }
        Insert: {
          created_at?: string | null
          id: number
          location_id?: number | null
          name?: string | null
          reserved_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          location_id?: number | null
          name?: string | null
          reserved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nodes_reserved_by_fkey"
            columns: ["reserved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      orders: {
        Row: {
          cpu: number | null
          created_at: string | null
          disk: number | null
          expires_at: string | null
          id: number
          package: string | null
          paid: boolean | null
          ram: number | null
          user_id: string | null
        }
        Insert: {
          cpu?: number | null
          created_at?: string | null
          disk?: number | null
          expires_at?: string | null
          id?: number
          package?: string | null
          paid?: boolean | null
          ram?: number | null
          user_id?: string | null
        }
        Update: {
          cpu?: number | null
          created_at?: string | null
          disk?: number | null
          expires_at?: string | null
          id?: number
          package?: string | null
          paid?: boolean | null
          ram?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_id: string
          created_at: string
          email: string
          first_name: string | null
          last_login: string | null
          last_name: string | null
          pelican_user_id: number | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          auth_id: string
          created_at?: string
          email: string
          first_name?: string | null
          last_login?: string | null
          last_name?: string | null
          pelican_user_id?: number | null
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          auth_id?: string
          created_at?: string
          email?: string
          first_name?: string | null
          last_login?: string | null
          last_name?: string | null
          pelican_user_id?: number | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      servers: {
        Row: {
          cpu_pct: number | null
          cpu_usage: string | null
          created_at: string
          disk_mb: number | null
          egg_id: number | null
          id: string
          location: string
          memory_usage: string | null
          name: string
          node_id: string | null
          node_id_int: number | null
          pelican_server_id: number | null
          ram_mb: number | null
          status: string
          updated_at: string
          uptime: string | null
          user_id: string
        }
        Insert: {
          cpu_pct?: number | null
          cpu_usage?: string | null
          created_at?: string
          disk_mb?: number | null
          egg_id?: number | null
          id?: string
          location: string
          memory_usage?: string | null
          name: string
          node_id?: string | null
          node_id_int?: number | null
          pelican_server_id?: number | null
          ram_mb?: number | null
          status?: string
          updated_at?: string
          uptime?: string | null
          user_id: string
        }
        Update: {
          cpu_pct?: number | null
          cpu_usage?: string | null
          created_at?: string
          disk_mb?: number | null
          egg_id?: number | null
          id?: string
          location?: string
          memory_usage?: string | null
          name?: string
          node_id?: string | null
          node_id_int?: number | null
          pelican_server_id?: number | null
          ram_mb?: number | null
          status?: string
          updated_at?: string
          uptime?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servers_node_id_int_fkey"
            columns: ["node_id_int"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      system_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_type: string
          recorded_at: string
          value: number
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_type: string
          recorded_at?: string
          value: number
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_type?: string
          recorded_at?: string
          value?: number
        }
        Relationships: []
      }
      tickets: {
        Row: {
          assigned_to: string | null
          body: string
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          body: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          body?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["auth_id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["auth_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_user: {
        Args: { user_id: string }
        Returns: boolean
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
