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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          arrival: string
          code: string
          company: string
          cpf: string
          created_at: string
          data_viagem: string
          departure: string
          destino: string
          email: string | null
          id: string
          nome: string
          origem: string
          payment_method: string
          price_per_seat: number
          seat_type: string
          seats: string
          status: string
          total: number
          whatsapp: string | null
        }
        Insert: {
          arrival: string
          code: string
          company: string
          cpf: string
          created_at?: string
          data_viagem: string
          departure: string
          destino: string
          email?: string | null
          id?: string
          nome: string
          origem: string
          payment_method?: string
          price_per_seat: number
          seat_type: string
          seats: string
          status?: string
          total: number
          whatsapp?: string | null
        }
        Update: {
          arrival?: string
          code?: string
          company?: string
          cpf?: string
          created_at?: string
          data_viagem?: string
          departure?: string
          destino?: string
          email?: string | null
          id?: string
          nome?: string
          origem?: string
          payment_method?: string
          price_per_seat?: number
          seat_type?: string
          seats?: string
          status?: string
          total?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      orders_attribution: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          created_at: string
          first_touch_source: string | null
          id: string
          last_touch_source: string | null
          lead_id: string | null
          order_id: string | null
          placement: string | null
          purchase_date: string | null
          purchase_value: number | null
          reservation_code: string | null
          session_id: string | null
        }
        Insert: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          created_at?: string
          first_touch_source?: string | null
          id?: string
          last_touch_source?: string | null
          lead_id?: string | null
          order_id?: string | null
          placement?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          reservation_code?: string | null
          session_id?: string | null
        }
        Update: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          created_at?: string
          first_touch_source?: string | null
          id?: string
          last_touch_source?: string | null
          lead_id?: string | null
          order_id?: string | null
          placement?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          reservation_code?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      visitor_events: {
        Row: {
          buyer_score: number | null
          buyer_stage: string | null
          event_id: string
          event_name: string
          event_timestamp: string
          id: string
          lead_id: string | null
          page_url: string | null
          payload_json: Json | null
          reservation_code: string | null
          session_id: string | null
          visitor_id: string | null
        }
        Insert: {
          buyer_score?: number | null
          buyer_stage?: string | null
          event_id: string
          event_name: string
          event_timestamp?: string
          id?: string
          lead_id?: string | null
          page_url?: string | null
          payload_json?: Json | null
          reservation_code?: string | null
          session_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          buyer_score?: number | null
          buyer_stage?: string | null
          event_id?: string
          event_name?: string
          event_timestamp?: string
          id?: string
          lead_id?: string | null
          page_url?: string | null
          payload_json?: Json | null
          reservation_code?: string | null
          session_id?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      visitor_sessions: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          browser: string | null
          campaign_id: string | null
          campaign_name: string | null
          created_at: string
          device_type: string | null
          fbclid: string | null
          first_visit_at: string | null
          gclid: string | null
          id: string
          landing_page: string | null
          language: string | null
          last_interaction_at: string | null
          os: string | null
          placement: string | null
          referrer: string | null
          session_id: string
          timezone: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
        }
        Insert: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          browser?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          created_at?: string
          device_type?: string | null
          fbclid?: string | null
          first_visit_at?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          language?: string | null
          last_interaction_at?: string | null
          os?: string | null
          placement?: string | null
          referrer?: string | null
          session_id: string
          timezone?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Update: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          browser?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          created_at?: string
          device_type?: string | null
          fbclid?: string | null
          first_visit_at?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          language?: string | null
          last_interaction_at?: string | null
          os?: string | null
          placement?: string | null
          referrer?: string | null
          session_id?: string
          timezone?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Relationships: []
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
