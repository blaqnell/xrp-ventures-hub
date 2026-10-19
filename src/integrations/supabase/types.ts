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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          created_at: string
          decimals: number
          id: string
          name: string
          provider_id: string
          symbol: string
        }
        Insert: {
          created_at?: string
          decimals?: number
          id?: string
          name: string
          provider_id: string
          symbol: string
        }
        Update: {
          created_at?: string
          decimals?: number
          id?: string
          name?: string
          provider_id?: string
          symbol?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          last_read_at: string
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string
          role: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_preferences: {
        Row: {
          opted_in: boolean
          pseudonym: string | null
          show_value: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          opted_in?: boolean
          pseudonym?: string | null
          show_value?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          opted_in?: boolean
          pseudonym?: string | null
          show_value?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      market_price_snapshots: {
        Row: {
          asset_id: string
          change_24h_pct: number | null
          fetched_at: string
          high_24h: number | null
          id: string
          low_24h: number | null
          market_cap: number | null
          price_usd: number
          provider_updated_at: string | null
          source: string
          volume_24h: number | null
        }
        Insert: {
          asset_id: string
          change_24h_pct?: number | null
          fetched_at?: string
          high_24h?: number | null
          id?: string
          low_24h?: number | null
          market_cap?: number | null
          price_usd: number
          provider_updated_at?: string | null
          source: string
          volume_24h?: number | null
        }
        Update: {
          asset_id?: string
          change_24h_pct?: number | null
          fetched_at?: string
          high_24h?: number | null
          id?: string
          low_24h?: number | null
          market_cap?: number | null
          price_usd?: number
          provider_updated_at?: string | null
          source?: string
          volume_24h?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_price_snapshots_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_path: string | null
          body: string
          conversation_id: string
          created_at: string
          id: string
          is_staff: boolean
          sender_id: string
        }
        Insert: {
          attachment_path?: string | null
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          is_staff?: boolean
          sender_id: string
        }
        Update: {
          attachment_path?: string | null
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      portfolio_positions: {
        Row: {
          acquired_on: string | null
          asset_id: string
          cost_basis_usd: number | null
          created_at: string
          id: string
          note: string | null
          quantity: number
          source: Database["public"]["Enums"]["position_source"]
          updated_at: string
          user_id: string
        }
        Insert: {
          acquired_on?: string | null
          asset_id: string
          cost_basis_usd?: number | null
          created_at?: string
          id?: string
          note?: string | null
          quantity: number
          source?: Database["public"]["Enums"]["position_source"]
          updated_at?: string
          user_id: string
        }
        Update: {
          acquired_on?: string | null
          asset_id?: string
          cost_basis_usd?: number | null
          created_at?: string
          id?: string
          note?: string | null
          quantity?: number
          source?: Database["public"]["Enums"]["position_source"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_positions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_snapshots: {
        Row: {
          id: string
          price_source: string
          price_usd: number
          taken_at: string
          total_quantity: number
          user_id: string
          value_usd: number
        }
        Insert: {
          id?: string
          price_source: string
          price_usd: number
          taken_at?: string
          total_quantity: number
          user_id: string
          value_usd: number
        }
        Update: {
          id?: string
          price_source?: string
          price_usd?: number
          taken_at?: string
          total_quantity?: number
          user_id?: string
          value_usd?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          status: Database["public"]["Enums"]["account_status"]
          suspended_reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          status?: Database["public"]["Enums"]["account_status"]
          suspended_reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          status?: Database["public"]["Enums"]["account_status"]
          suspended_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          details: Json
          event_type: string
          id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string
          id: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracked_transactions: {
        Row: {
          action: string
          asset_id: string
          cost_basis_usd: number | null
          id: string
          occurred_at: string
          position_id: string | null
          previous_quantity: number | null
          quantity: number
          source: Database["public"]["Enums"]["position_source"]
          user_id: string
        }
        Insert: {
          action: string
          asset_id: string
          cost_basis_usd?: number | null
          id?: string
          occurred_at?: string
          position_id?: string | null
          previous_quantity?: number | null
          quantity: number
          source: Database["public"]["Enums"]["position_source"]
          user_id: string
        }
        Update: {
          action?: string
          asset_id?: string
          cost_basis_usd?: number | null
          id?: string
          occurred_at?: string
          position_id?: string | null
          previous_quantity?: number | null
          quantity?: number
          source?: Database["public"]["Enums"]["position_source"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracked_transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          demo_mode: boolean
          email_notifications: boolean
          inapp_notifications: boolean
          security_alerts: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          demo_mode?: boolean
          email_notifications?: boolean
          inapp_notifications?: boolean
          security_alerts?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          demo_mode?: boolean
          email_notifications?: boolean
          inapp_notifications?: boolean
          security_alerts?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_assign_ticket: {
        Args: { _agent: string; _ticket: string }
        Returns: undefined
      }
      admin_list_staff: {
        Args: never
        Returns: {
          display_name: string
          id: string
          roles: Database["public"]["Enums"]["app_role"][]
        }[]
      }
      admin_list_tickets: {
        Args: { _status?: Database["public"]["Enums"]["ticket_status"] }
        Returns: {
          assigned_to: string
          category: Database["public"]["Enums"]["ticket_category"]
          conversation_id: string
          created_at: string
          customer_name: string
          id: string
          last_message_at: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }[]
      }
      admin_list_users: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
          last_sign_in_at: string
          roles: Database["public"]["Enums"]["app_role"][]
          status: Database["public"]["Enums"]["account_status"]
          total: number
        }[]
      }
      admin_metrics: { Args: never; Returns: Json }
      admin_mfa_ok: { Args: never; Returns: boolean }
      admin_set_role: {
        Args: {
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
      admin_set_ticket_status: {
        Args: {
          _status: Database["public"]["Enums"]["ticket_status"]
          _ticket: string
        }
        Returns: undefined
      }
      admin_set_user_status: {
        Args: {
          _reason: string
          _status: Database["public"]["Enums"]["account_status"]
          _target: string
        }
        Returns: undefined
      }
      admin_update_setting: {
        Args: { _key: string; _value: Json }
        Returns: undefined
      }
      can_view_conversation: {
        Args: { _conv: string; _user: string }
        Returns: boolean
      }
      create_support_ticket: {
        Args: {
          _body: string
          _category: Database["public"]["Enums"]["ticket_category"]
          _subject: string
        }
        Returns: string
      }
      get_leaderboard: {
        Args: never
        Returns: {
          member_since: string
          pseudonym: string
          rank: number
          shows_value: boolean
          tracked_xrp: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_user: { Args: { _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_participant: {
        Args: { _conv: string; _user: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      log_security_event: {
        Args: { _event: string; _user_agent?: string }
        Returns: undefined
      }
      require_admin_level: {
        Args: { _roles: Database["public"]["Enums"]["app_role"][] }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "suspended"
      app_role: "super_admin" | "ops_admin" | "support_agent" | "user"
      position_source: "user_reported" | "demo"
      ticket_category:
        | "account"
        | "portfolio"
        | "market_data"
        | "security"
        | "other"
      ticket_status: "open" | "pending" | "resolved" | "closed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_status: ["active", "suspended"],
      app_role: ["super_admin", "ops_admin", "support_agent", "user"],
      position_source: ["user_reported", "demo"],
      ticket_category: [
        "account",
        "portfolio",
        "market_data",
        "security",
        "other",
      ],
      ticket_status: ["open", "pending", "resolved", "closed"],
    },
  },
} as const
