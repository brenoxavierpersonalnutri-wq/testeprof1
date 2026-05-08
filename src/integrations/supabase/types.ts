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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_agent_settings: {
        Row: {
          active: boolean
          context_enabled: boolean
          created_at: string
          id: string
          model: string
          prompt: string
          temperature: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          context_enabled?: boolean
          created_at?: string
          id?: string
          model?: string
          prompt?: string
          temperature?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          context_enabled?: boolean
          created_at?: string
          id?: string
          model?: string
          prompt?: string
          temperature?: number
          updated_at?: string
        }
        Relationships: []
      }
      alunas: {
        Row: {
          avaliacao_enviada: boolean | null
          created_at: string
          data_avaliacao: string | null
          data_cobranca_sinal: string | null
          data_compra: string
          data_fotos_anamnese: string | null
          data_vencimento: string
          deu_sinal: boolean | null
          duracao_plano: string
          forma_pagamento: string
          fotos_anamnese: boolean | null
          id: string
          liberou_fotos: boolean | null
          liberou_treino_dieta: boolean | null
          nome_completo: string
          origem_lead: string | null
          pago: boolean
          programa: string
          renovacao_recusada: boolean | null
          residuo_pago: boolean | null
          status: string
          telefone: string | null
          updated_at: string
          user_id: string
          valor_sinal: number | null
        }
        Insert: {
          avaliacao_enviada?: boolean | null
          created_at?: string
          data_avaliacao?: string | null
          data_cobranca_sinal?: string | null
          data_compra: string
          data_fotos_anamnese?: string | null
          data_vencimento: string
          deu_sinal?: boolean | null
          duracao_plano: string
          forma_pagamento: string
          fotos_anamnese?: boolean | null
          id?: string
          liberou_fotos?: boolean | null
          liberou_treino_dieta?: boolean | null
          nome_completo: string
          origem_lead?: string | null
          pago?: boolean
          programa: string
          renovacao_recusada?: boolean | null
          residuo_pago?: boolean | null
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id: string
          valor_sinal?: number | null
        }
        Update: {
          avaliacao_enviada?: boolean | null
          created_at?: string
          data_avaliacao?: string | null
          data_cobranca_sinal?: string | null
          data_compra?: string
          data_fotos_anamnese?: string | null
          data_vencimento?: string
          deu_sinal?: boolean | null
          duracao_plano?: string
          forma_pagamento?: string
          fotos_anamnese?: boolean | null
          id?: string
          liberou_fotos?: boolean | null
          liberou_treino_dieta?: boolean | null
          nome_completo?: string
          origem_lead?: string | null
          pago?: boolean
          programa?: string
          renovacao_recusada?: boolean | null
          residuo_pago?: boolean | null
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
          valor_sinal?: number | null
        }
        Relationships: []
      }
      collaborator_tasks: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string
          id: string
          metadata: Json | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date: string
          id?: string
          metadata?: Json | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string
          id?: string
          metadata?: Json | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          attended: boolean | null
          attended_at: string | null
          calendly_event_uri: string | null
          calendly_status: string | null
          call_confirmed: boolean | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          closer_observation: string | null
          converted: boolean | null
          converted_at: string | null
          created_at: string
          date: string
          deletion_reason: string | null
          disqualified: boolean | null
          end_time: string | null
          event_type_name: string | null
          gave_signal: boolean | null
          id: string
          instagram: string | null
          is_future_reschedule: boolean | null
          is_incomplete_flow: boolean | null
          lead_quality: string
          lead_score: number | null
          negotiating: boolean | null
          observation: string | null
          payment_method: string | null
          received_reminder_messages: boolean | null
          refunded: boolean
          refunded_at: string | null
          signal_follow_up_date: string | null
          signal_residue_paid: boolean | null
          signal_value: number | null
          start_time: string | null
          status: string
          ticket_value: number | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          via: string | null
        }
        Insert: {
          attended?: boolean | null
          attended_at?: string | null
          calendly_event_uri?: string | null
          calendly_status?: string | null
          call_confirmed?: boolean | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          closer_observation?: string | null
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string
          date: string
          deletion_reason?: string | null
          disqualified?: boolean | null
          end_time?: string | null
          event_type_name?: string | null
          gave_signal?: boolean | null
          id?: string
          instagram?: string | null
          is_future_reschedule?: boolean | null
          is_incomplete_flow?: boolean | null
          lead_quality?: string
          lead_score?: number | null
          negotiating?: boolean | null
          observation?: string | null
          payment_method?: string | null
          received_reminder_messages?: boolean | null
          refunded?: boolean
          refunded_at?: string | null
          signal_follow_up_date?: string | null
          signal_residue_paid?: boolean | null
          signal_value?: number | null
          start_time?: string | null
          status?: string
          ticket_value?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          via?: string | null
        }
        Update: {
          attended?: boolean | null
          attended_at?: string | null
          calendly_event_uri?: string | null
          calendly_status?: string | null
          call_confirmed?: boolean | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          closer_observation?: string | null
          converted?: boolean | null
          converted_at?: string | null
          created_at?: string
          date?: string
          deletion_reason?: string | null
          disqualified?: boolean | null
          end_time?: string | null
          event_type_name?: string | null
          gave_signal?: boolean | null
          id?: string
          instagram?: string | null
          is_future_reschedule?: boolean | null
          is_incomplete_flow?: boolean | null
          lead_quality?: string
          lead_score?: number | null
          negotiating?: boolean | null
          observation?: string | null
          payment_method?: string | null
          received_reminder_messages?: boolean | null
          refunded?: boolean
          refunded_at?: string | null
          signal_follow_up_date?: string | null
          signal_residue_paid?: boolean | null
          signal_value?: number | null
          start_time?: string | null
          status?: string
          ticket_value?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          via?: string | null
        }
        Relationships: []
      }
      custom_programs: {
        Row: {
          created_at: string
          duracao: string
          id: string
          label: string
          price: number
          programa: string
          value: string
        }
        Insert: {
          created_at?: string
          duracao?: string
          id?: string
          label: string
          price?: number
          programa?: string
          value: string
        }
        Update: {
          created_at?: string
          duracao?: string
          id?: string
          label?: string
          price?: number
          programa?: string
          value?: string
        }
        Relationships: []
      }
      expense_items: {
        Row: {
          category: string
          created_at: string
          date: string | null
          id: string
          month: string
          name: string
          recurring: boolean
          value: number
        }
        Insert: {
          category: string
          created_at?: string
          date?: string | null
          id?: string
          month: string
          name?: string
          recurring?: boolean
          value?: number
        }
        Update: {
          category?: string
          created_at?: string
          date?: string | null
          id?: string
          month?: string
          name?: string
          recurring?: boolean
          value?: number
        }
        Relationships: []
      }
      gateway_api_keys: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          nome: string
          revoked_at: string | null
          ultimo_uso: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          nome: string
          revoked_at?: string | null
          ultimo_uso?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          nome?: string
          revoked_at?: string | null
          ultimo_uso?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gateway_config: {
        Row: {
          api_key_externa: string | null
          created_at: string
          dados_bancarios: Json | null
          email_notificacoes: string | null
          logo_url: string | null
          nome_empresa: string | null
          taxa_boleto: number
          taxa_cartao_parcelado: number
          taxa_cartao_vista: number
          taxa_fixa: number
          taxa_pix: number
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          api_key_externa?: string | null
          created_at?: string
          dados_bancarios?: Json | null
          email_notificacoes?: string | null
          logo_url?: string | null
          nome_empresa?: string | null
          taxa_boleto?: number
          taxa_cartao_parcelado?: number
          taxa_cartao_vista?: number
          taxa_fixa?: number
          taxa_pix?: number
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          api_key_externa?: string | null
          created_at?: string
          dados_bancarios?: Json | null
          email_notificacoes?: string | null
          logo_url?: string | null
          nome_empresa?: string | null
          taxa_boleto?: number
          taxa_cartao_parcelado?: number
          taxa_cartao_vista?: number
          taxa_fixa?: number
          taxa_pix?: number
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      gateway_links: {
        Row: {
          ativo: boolean
          cor_tema: string
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
          metodos_aceitos: Json
          nome_produto: string
          parcelamento_max: number
          slug: string
          total_arrecadado: number
          updated_at: string
          user_id: string
          valor: number
          vendas_count: number
        }
        Insert: {
          ativo?: boolean
          cor_tema?: string
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          metodos_aceitos?: Json
          nome_produto: string
          parcelamento_max?: number
          slug: string
          total_arrecadado?: number
          updated_at?: string
          user_id: string
          valor: number
          vendas_count?: number
        }
        Update: {
          ativo?: boolean
          cor_tema?: string
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          metodos_aceitos?: Json
          nome_produto?: string
          parcelamento_max?: number
          slug?: string
          total_arrecadado?: number
          updated_at?: string
          user_id?: string
          valor?: number
          vendas_count?: number
        }
        Relationships: []
      }
      gateway_saques: {
        Row: {
          created_at: string
          dados_bancarios: Json | null
          id: string
          observacao: string | null
          processado_em: string | null
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          dados_bancarios?: Json | null
          id?: string
          observacao?: string | null
          processado_em?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          dados_bancarios?: Json | null
          id?: string
          observacao?: string | null
          processado_em?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      gateway_transacoes: {
        Row: {
          cliente_cpf_cnpj: string | null
          cliente_email: string
          cliente_nome: string
          cliente_telefone: string | null
          codigo_barras: string | null
          created_at: string
          descricao: string | null
          gateway_id: string | null
          id: string
          link_id: string | null
          link_pagamento: string | null
          metodo: string
          pago_em: string | null
          parcelas: number
          qr_code: string | null
          status: string
          taxa_fixa: number
          taxa_percentual: number
          updated_at: string
          user_id: string
          valor_bruto: number
          valor_liquido: number
          vencimento: string | null
        }
        Insert: {
          cliente_cpf_cnpj?: string | null
          cliente_email: string
          cliente_nome: string
          cliente_telefone?: string | null
          codigo_barras?: string | null
          created_at?: string
          descricao?: string | null
          gateway_id?: string | null
          id?: string
          link_id?: string | null
          link_pagamento?: string | null
          metodo: string
          pago_em?: string | null
          parcelas?: number
          qr_code?: string | null
          status?: string
          taxa_fixa?: number
          taxa_percentual?: number
          updated_at?: string
          user_id: string
          valor_bruto: number
          valor_liquido: number
          vencimento?: string | null
        }
        Update: {
          cliente_cpf_cnpj?: string | null
          cliente_email?: string
          cliente_nome?: string
          cliente_telefone?: string | null
          codigo_barras?: string | null
          created_at?: string
          descricao?: string | null
          gateway_id?: string | null
          id?: string
          link_id?: string | null
          link_pagamento?: string | null
          metodo?: string
          pago_em?: string | null
          parcelas?: number
          qr_code?: string | null
          status?: string
          taxa_fixa?: number
          taxa_percentual?: number
          updated_at?: string
          user_id?: string
          valor_bruto?: number
          valor_liquido?: number
          vencimento?: string | null
        }
        Relationships: []
      }
      lead_form_responses: {
        Row: {
          consultation_id: string | null
          created_at: string
          email: string | null
          id: string
          nivel: string
          nome: string | null
          p1_objetivo: string | null
          p2_situacao: string | null
          p3_profissao: string | null
          p4_altura: number | null
          p4_idade: number | null
          p4_peso: number | null
          p5_estrategias: string | null
          p6_caneta: string | null
          p7_acompanhamento: string | null
          p8_investimento: string | null
          p9_prioridade: string | null
          score: number
          telefone: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nivel?: string
          nome?: string | null
          p1_objetivo?: string | null
          p2_situacao?: string | null
          p3_profissao?: string | null
          p4_altura?: number | null
          p4_idade?: number | null
          p4_peso?: number | null
          p5_estrategias?: string | null
          p6_caneta?: string | null
          p7_acompanhamento?: string | null
          p8_investimento?: string | null
          p9_prioridade?: string | null
          score?: number
          telefone?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          consultation_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nivel?: string
          nome?: string | null
          p1_objetivo?: string | null
          p2_situacao?: string | null
          p3_profissao?: string | null
          p4_altura?: number | null
          p4_idade?: number | null
          p4_peso?: number | null
          p5_estrategias?: string | null
          p6_caneta?: string | null
          p7_acompanhamento?: string | null
          p8_investimento?: string | null
          p9_prioridade?: string | null
          score?: number
          telefone?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      leads_tracking: {
        Row: {
          click_id: string
          created_at: string
          email: string | null
          id: string
          page_url: string
          phone: string | null
          profile_id: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          click_id: string
          created_at?: string
          email?: string | null
          id?: string
          page_url?: string
          phone?: string | null
          profile_id: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          click_id?: string
          created_at?: string
          email?: string | null
          id?: string
          page_url?: string
          phone?: string | null
          profile_id?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      monthly_data: {
        Row: {
          campanha_meta: number
          colaboradores: number
          comissao: number
          created_at: string
          faturamento: number
          ferramentas: number
          id: string
          imposto_percent: number
          month: string
          trafego: number
          updated_at: string
          whatsapp_cost: number
          whatsapp_messages_received: number
          whatsapp_messages_sent: number
        }
        Insert: {
          campanha_meta?: number
          colaboradores?: number
          comissao?: number
          created_at?: string
          faturamento?: number
          ferramentas?: number
          id?: string
          imposto_percent?: number
          month: string
          trafego?: number
          updated_at?: string
          whatsapp_cost?: number
          whatsapp_messages_received?: number
          whatsapp_messages_sent?: number
        }
        Update: {
          campanha_meta?: number
          colaboradores?: number
          comissao?: number
          created_at?: string
          faturamento?: number
          ferramentas?: number
          id?: string
          imposto_percent?: number
          month?: string
          trafego?: number
          updated_at?: string
          whatsapp_cost?: number
          whatsapp_messages_received?: number
          whatsapp_messages_sent?: number
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          fbclid: string | null
          id: string
          profile_id: string
          referrer: string | null
          session_id: string
          url: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          fbclid?: string | null
          id?: string
          profile_id: string
          referrer?: string | null
          session_id: string
          url: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          fbclid?: string | null
          id?: string
          profile_id?: string
          referrer?: string | null
          session_id?: string
          url?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved: boolean
          availability_overrides: Json | null
          availability_weekly: Json | null
          available_slots_json: Json | null
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_closer: boolean
          max_daily_bookings: number | null
          slot_gap_minutes: number | null
          tracking_token: string | null
          updated_at: string
        }
        Insert: {
          approved?: boolean
          availability_overrides?: Json | null
          availability_weekly?: Json | null
          available_slots_json?: Json | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          is_closer?: boolean
          max_daily_bookings?: number | null
          slot_gap_minutes?: number | null
          tracking_token?: string | null
          updated_at?: string
        }
        Update: {
          approved?: boolean
          availability_overrides?: Json | null
          availability_weekly?: Json | null
          available_slots_json?: Json | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_closer?: boolean
          max_daily_bookings?: number | null
          slot_gap_minutes?: number | null
          tracking_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rotator_clicks: {
        Row: {
          click_id: string
          created_at: string
          destination_id: string
          id: string
          ip_address: string | null
          referer: string | null
          rotator_id: string
          user_agent: string | null
        }
        Insert: {
          click_id: string
          created_at?: string
          destination_id: string
          id?: string
          ip_address?: string | null
          referer?: string | null
          rotator_id: string
          user_agent?: string | null
        }
        Update: {
          click_id?: string
          created_at?: string
          destination_id?: string
          id?: string
          ip_address?: string | null
          referer?: string | null
          rotator_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rotator_clicks_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "rotator_destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotator_clicks_rotator_id_fkey"
            columns: ["rotator_id"]
            isOneToOne: false
            referencedRelation: "rotator_links"
            referencedColumns: ["id"]
          },
        ]
      }
      rotator_destinations: {
        Row: {
          created_at: string
          id: string
          label: string
          rotator_id: string
          url: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string
          rotator_id: string
          url: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          rotator_id?: string
          url?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "rotator_destinations_rotator_id_fkey"
            columns: ["rotator_id"]
            isOneToOne: false
            referencedRelation: "rotator_links"
            referencedColumns: ["id"]
          },
        ]
      }
      rotator_events: {
        Row: {
          click_id: string
          created_at: string
          event_type: string
          id: string
          value: number | null
        }
        Insert: {
          click_id: string
          created_at?: string
          event_type: string
          id?: string
          value?: number | null
        }
        Update: {
          click_id?: string
          created_at?: string
          event_type?: string
          id?: string
          value?: number | null
        }
        Relationships: []
      }
      rotator_links: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      sales_events: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_phone: string | null
          id: string
          lead_id: string | null
          profile_id: string
          source: string
          value: number
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          lead_id?: string | null
          profile_id: string
          source?: string
          value?: number
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          lead_id?: string | null
          profile_id?: string
          source?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          page_url: string
          profile_id: string
          session_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          page_url: string
          profile_id: string
          session_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          page_url?: string
          profile_id?: string
          session_id?: string
          value?: number | null
        }
        Relationships: []
      }
      user_modules: {
        Row: {
          created_at: string
          id: string
          module: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webinar_analytics: {
        Row: {
          clicked_cta: boolean
          created_at: string
          entered_at: string
          id: string
          session_id: string
          updated_at: string
          url_version: string
          user_agent: string | null
          video_watched_seconds: number
        }
        Insert: {
          clicked_cta?: boolean
          created_at?: string
          entered_at?: string
          id?: string
          session_id: string
          updated_at?: string
          url_version: string
          user_agent?: string | null
          video_watched_seconds?: number
        }
        Update: {
          clicked_cta?: boolean
          created_at?: string
          entered_at?: string
          id?: string
          session_id?: string
          updated_at?: string
          url_version?: string
          user_agent?: string | null
          video_watched_seconds?: number
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string
          source: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone: string
          source?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          source?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          body: string
          contact_phone: string
          created_at: string
          direction: string
          id: string
          media_url: string | null
          message_id: string | null
          sender_type: string
          status: string | null
        }
        Insert: {
          body?: string
          contact_phone: string
          created_at?: string
          direction?: string
          id?: string
          media_url?: string | null
          message_id?: string | null
          sender_type?: string
          status?: string | null
        }
        Update: {
          body?: string
          contact_phone?: string
          created_at?: string
          direction?: string
          id?: string
          media_url?: string | null
          message_id?: string | null
          sender_type?: string
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_public_consultation:
        | {
            Args: {
              p_client_name: string
              p_client_phone: string
              p_date: string
              p_funnel?: string
              p_time: string
              p_utm_campaign?: string
              p_utm_content?: string
              p_utm_medium?: string
              p_utm_source?: string
              p_utm_term?: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_client_name: string
              p_client_phone: string
              p_date: string
              p_funnel?: string
              p_lead_score?: number
              p_time: string
              p_utm_campaign?: string
              p_utm_content?: string
              p_utm_medium?: string
              p_utm_source?: string
              p_utm_term?: string
            }
            Returns: boolean
          }
      delete_user: { Args: { target_user_id: string }; Returns: undefined }
      get_public_booking_info: {
        Args: { p_date: string }
        Returns: {
          availability_overrides: Json
          availability_weekly: Json
          booked_slots: string[]
          max_daily_bookings: number
          slot_gap_minutes: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      link_latest_form_response_to_consultation: {
        Args: { p_consultation_id: string; p_telefone: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
