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
          gateway_transaction_id: string | null
          id: string
          nome: string
          origem: string
          paid_at: string | null
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
          gateway_transaction_id?: string | null
          id?: string
          nome: string
          origem: string
          paid_at?: string | null
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
          gateway_transaction_id?: string | null
          id?: string
          nome?: string
          origem?: string
          paid_at?: string | null
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
      cidades_ibge: {
        Row: {
          codigo_ibge: string
          created_at: string | null
          estado: string
          id: string
          latitude: number
          longitude: number
          nome_cidade: string
          nome_estado: string
        }
        Insert: {
          codigo_ibge: string
          created_at?: string | null
          estado: string
          id?: string
          latitude: number
          longitude: number
          nome_cidade: string
          nome_estado: string
        }
        Update: {
          codigo_ibge?: string
          created_at?: string | null
          estado?: string
          id?: string
          latitude?: number
          longitude?: number
          nome_cidade?: string
          nome_estado?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          lead_id: string
          name: string | null
          phone: string | null
          session_id: string | null
          updated_at: string
          visitor_id: string | null
          whatsapp: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_id: string
          name?: string | null
          phone?: string | null
          session_id?: string | null
          updated_at?: string
          visitor_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_id?: string
          name?: string | null
          phone?: string | null
          session_id?: string | null
          updated_at?: string
          visitor_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          amount: number
          buyer_score: number | null
          campaign_id: string | null
          campaign_name: string | null
          created_at: string
          currency: string
          customer_cpf: string | null
          customer_email: string | null
          customer_name: string | null
          customer_whatsapp: string | null
          fbclid: string | null
          first_visit_at: string | null
          gateway_transaction_id: string | null
          gclid: string | null
          id: string
          landing_page: string | null
          last_gateway_update_at: string | null
          lead_id: string | null
          order_id: string
          paid_at: string | null
          payment_method: string | null
          payment_status: string
          placement: string | null
          raw_gateway_response: Json | null
          referrer: string | null
          reservation_code: string | null
          session_id: string | null
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
          amount?: number
          buyer_score?: number | null
          campaign_id?: string | null
          campaign_name?: string | null
          created_at?: string
          currency?: string
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_whatsapp?: string | null
          fbclid?: string | null
          first_visit_at?: string | null
          gateway_transaction_id?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          last_gateway_update_at?: string | null
          lead_id?: string | null
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          placement?: string | null
          raw_gateway_response?: Json | null
          referrer?: string | null
          reservation_code?: string | null
          session_id?: string | null
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
          amount?: number
          buyer_score?: number | null
          campaign_id?: string | null
          campaign_name?: string | null
          created_at?: string
          currency?: string
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_whatsapp?: string | null
          fbclid?: string | null
          first_visit_at?: string | null
          gateway_transaction_id?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          last_gateway_update_at?: string | null
          lead_id?: string | null
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          placement?: string | null
          raw_gateway_response?: Json | null
          referrer?: string | null
          reservation_code?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      orders_attribution: {
        Row: {
          ad_id: string | null
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          buyer_score: number | null
          campaign_id: string | null
          campaign_name: string | null
          confirmed_at: string | null
          created_at: string
          fbclid: string | null
          first_touch_source: string | null
          first_visit_at: string | null
          gateway_transaction_id: string | null
          gclid: string | null
          id: string
          landing_page: string | null
          last_touch_source: string | null
          lead_id: string | null
          order_id: string | null
          payment_confirmed: boolean | null
          placement: string | null
          purchase_date: string | null
          purchase_value: number | null
          referrer: string | null
          reservation_code: string | null
          session_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          buyer_score?: number | null
          campaign_id?: string | null
          campaign_name?: string | null
          confirmed_at?: string | null
          created_at?: string
          fbclid?: string | null
          first_touch_source?: string | null
          first_visit_at?: string | null
          gateway_transaction_id?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          last_touch_source?: string | null
          lead_id?: string | null
          order_id?: string | null
          payment_confirmed?: boolean | null
          placement?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          referrer?: string | null
          reservation_code?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          buyer_score?: number | null
          campaign_id?: string | null
          campaign_name?: string | null
          confirmed_at?: string | null
          created_at?: string
          fbclid?: string | null
          first_touch_source?: string | null
          first_visit_at?: string | null
          gateway_transaction_id?: string | null
          gclid?: string | null
          id?: string
          landing_page?: string | null
          last_touch_source?: string | null
          lead_id?: string | null
          order_id?: string | null
          payment_confirmed?: boolean | null
          placement?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          referrer?: string | null
          reservation_code?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          event_id: string
          gateway_transaction_id: string | null
          id: string
          is_duplicate: boolean | null
          normalized_status: string | null
          order_id: string | null
          payload_json: Json | null
          processed_at: string | null
          raw_status: string | null
          received_at: string
        }
        Insert: {
          event_id: string
          gateway_transaction_id?: string | null
          id?: string
          is_duplicate?: boolean | null
          normalized_status?: string | null
          order_id?: string | null
          payload_json?: Json | null
          processed_at?: string | null
          raw_status?: string | null
          received_at?: string
        }
        Update: {
          event_id?: string
          gateway_transaction_id?: string | null
          id?: string
          is_duplicate?: boolean | null
          normalized_status?: string | null
          order_id?: string | null
          payload_json?: Json | null
          processed_at?: string | null
          raw_status?: string | null
          received_at?: string
        }
        Relationships: []
      }
      programacoes: {
        Row: {
          created_at: string | null
          destino_id: string | null
          empresa: string
          hora_fim: string
          hora_inicio: string
          id: string
          intervalo_minutos: number
          origem_id: string | null
        }
        Insert: {
          created_at?: string | null
          destino_id?: string | null
          empresa: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          intervalo_minutos?: number
          origem_id?: string | null
        }
        Update: {
          created_at?: string | null
          destino_id?: string | null
          empresa?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          intervalo_minutos?: number
          origem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programacoes_destino_id_fkey"
            columns: ["destino_id"]
            isOneToOne: false
            referencedRelation: "cidades_ibge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacoes_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "cidades_ibge"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          arrival_time: string | null
          base_amount: number
          company: string | null
          created_at: string
          departure_date: string
          departure_time: string | null
          destination: string
          id: string
          lead_id: string | null
          origin: string
          passenger_count: number
          reservation_code: string
          reservation_status: string
          return_date: string | null
          seat_type: string | null
          seats: string | null
          session_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          arrival_time?: string | null
          base_amount?: number
          company?: string | null
          created_at?: string
          departure_date: string
          departure_time?: string | null
          destination: string
          id?: string
          lead_id?: string | null
          origin: string
          passenger_count?: number
          reservation_code: string
          reservation_status?: string
          return_date?: string | null
          seat_type?: string | null
          seats?: string | null
          session_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          arrival_time?: string | null
          base_amount?: number
          company?: string | null
          created_at?: string
          departure_date?: string
          departure_time?: string | null
          destination?: string
          id?: string
          lead_id?: string | null
          origin?: string
          passenger_count?: number
          reservation_code?: string
          reservation_status?: string
          return_date?: string | null
          seat_type?: string | null
          seats?: string | null
          session_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      rotas_cache: {
        Row: {
          created_at: string | null
          destino_id: string | null
          distancia_km: number
          id: string
          origem_id: string | null
        }
        Insert: {
          created_at?: string | null
          destino_id?: string | null
          distancia_km: number
          id?: string
          origem_id?: string | null
        }
        Update: {
          created_at?: string | null
          destino_id?: string | null
          distancia_km?: number
          id?: string
          origem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rotas_cache_destino_id_fkey"
            columns: ["destino_id"]
            isOneToOne: false
            referencedRelation: "cidades_ibge"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotas_cache_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "cidades_ibge"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          airline_locator: string | null
          created_at: string
          departure_date: string | null
          departure_time: string | null
          destination: string | null
          id: string
          issued_at: string | null
          order_id: string | null
          origin: string | null
          passenger_cpf: string | null
          passenger_name: string | null
          pdf_url: string | null
          reservation_code: string | null
          seat: string | null
          status: string
          ticket_id: string
        }
        Insert: {
          airline_locator?: string | null
          created_at?: string
          departure_date?: string | null
          departure_time?: string | null
          destination?: string | null
          id?: string
          issued_at?: string | null
          order_id?: string | null
          origin?: string | null
          passenger_cpf?: string | null
          passenger_name?: string | null
          pdf_url?: string | null
          reservation_code?: string | null
          seat?: string | null
          status?: string
          ticket_id: string
        }
        Update: {
          airline_locator?: string | null
          created_at?: string
          departure_date?: string | null
          departure_time?: string | null
          destination?: string | null
          id?: string
          issued_at?: string | null
          order_id?: string | null
          origin?: string | null
          passenger_cpf?: string | null
          passenger_name?: string | null
          pdf_url?: string | null
          reservation_code?: string | null
          seat?: string | null
          status?: string
          ticket_id?: string
        }
        Relationships: []
      }
      tipos_onibus: {
        Row: {
          created_at: string | null
          fator_preco: number
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          fator_preco?: number
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          fator_preco?: number
          id?: string
          nome?: string
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
          buyer_score: number | null
          buyer_stage: string | null
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
          screen_resolution: string | null
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
          buyer_score?: number | null
          buyer_stage?: string | null
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
          screen_resolution?: string | null
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
          buyer_score?: number | null
          buyer_stage?: string | null
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
          screen_resolution?: string | null
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
