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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          data: string
          descricao: string | null
          id: string
          lead_id: string | null
          opportunity_id: string | null
          tipo: string
          user_id: string | null
        }
        Insert: {
          data?: string
          descricao?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          tipo: string
          user_id?: string | null
        }
        Update: {
          data?: string
          descricao?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          acao: string
          antes: Json | null
          created_at: string
          depois: Json | null
          id: number
          registro_id: string | null
          tabela: string
          user_id: string | null
        }
        Insert: {
          acao: string
          antes?: Json | null
          created_at?: string
          depois?: Json | null
          id?: number
          registro_id?: string | null
          tabela: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          antes?: Json | null
          created_at?: string
          depois?: Json | null
          id?: number
          registro_id?: string | null
          tabela?: string
          user_id?: string | null
        }
        Relationships: []
      }
      closers: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          meta_fechamentos: number
          meta_receita: number
          meta_reunioes: number
          nome: string
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          meta_fechamentos?: number
          meta_receita?: number
          meta_reunioes?: number
          nome: string
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          meta_fechamentos?: number
          meta_receita?: number
          meta_reunioes?: number
          nome?: string
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "closers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          nome: string
          porte: string | null
          setor: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
          porte?: string | null
          setor?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
          porte?: string | null
          setor?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          cargo: string | null
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          cargo?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          cargo?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_entries: {
        Row: {
          agendamentos: number
          aprendizados: string | null
          closer_id: string | null
          conexoes: number
          created_at: string
          created_by: string | null
          data: string
          fechamentos: number
          gargalos: string | null
          id: string
          leads_parados: number | null
          negociacoes: number
          no_show: number
          observacoes: string | null
          propostas: number
          receita: number
          reunioes_realizadas: number
          sdr_id: string | null
          sla_medio_horas: number | null
          sprint_id: string | null
          tentativas: number
          updated_at: string
        }
        Insert: {
          agendamentos?: number
          aprendizados?: string | null
          closer_id?: string | null
          conexoes?: number
          created_at?: string
          created_by?: string | null
          data: string
          fechamentos?: number
          gargalos?: string | null
          id?: string
          leads_parados?: number | null
          negociacoes?: number
          no_show?: number
          observacoes?: string | null
          propostas?: number
          receita?: number
          reunioes_realizadas?: number
          sdr_id?: string | null
          sla_medio_horas?: number | null
          sprint_id?: string | null
          tentativas?: number
          updated_at?: string
        }
        Update: {
          agendamentos?: number
          aprendizados?: string | null
          closer_id?: string | null
          conexoes?: number
          created_at?: string
          created_by?: string | null
          data?: string
          fechamentos?: number
          gargalos?: string | null
          id?: string
          leads_parados?: number | null
          negociacoes?: number
          no_show?: number
          observacoes?: string | null
          propostas?: number
          receita?: number
          reunioes_realizadas?: number
          sdr_id?: string | null
          sla_medio_horas?: number | null
          sprint_id?: string | null
          tentativas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_entries_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "closers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_entries_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "v_closer_scoreboard"
            referencedColumns: ["closer_id"]
          },
          {
            foreignKeyName: "daily_entries_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "sdrs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_entries_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "v_sdr_scoreboard"
            referencedColumns: ["sdr_id"]
          },
          {
            foreignKeyName: "daily_entries_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_cards: {
        Row: {
          anexos: Json
          area: string | null
          checklist: Json
          coluna: Database["public"]["Enums"]["kanban_col"]
          comentarios: Json
          created_at: string
          created_by: string | null
          descricao: string | null
          due_date: string | null
          id: string
          ordem: number
          prioridade: Database["public"]["Enums"]["prioridade"]
          responsavel_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          anexos?: Json
          area?: string | null
          checklist?: Json
          coluna?: Database["public"]["Enums"]["kanban_col"]
          comentarios?: Json
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          due_date?: string | null
          id?: string
          ordem?: number
          prioridade?: Database["public"]["Enums"]["prioridade"]
          responsavel_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          anexos?: Json
          area?: string | null
          checklist?: Json
          coluna?: Database["public"]["Enums"]["kanban_col"]
          comentarios?: Json
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          due_date?: string | null
          id?: string
          ordem?: number
          prioridade?: Database["public"]["Enums"]["prioridade"]
          responsavel_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          criticidade: Database["public"]["Enums"]["prioridade"] | null
          id: string
          origin_id: string | null
          sdr_id: string | null
          status: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          criticidade?: Database["public"]["Enums"]["prioridade"] | null
          id?: string
          origin_id?: string | null
          sdr_id?: string | null
          status?: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          criticidade?: Database["public"]["Enums"]["prioridade"] | null
          id?: string
          origin_id?: string | null
          sdr_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "origins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "sdrs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "v_sdr_scoreboard"
            referencedColumns: ["sdr_id"]
          },
        ]
      }
      meetings: {
        Row: {
          closer_id: string | null
          contato: string | null
          created_at: string
          created_by: string | null
          data: string
          empresa: string
          fechou: boolean | null
          id: string
          negociacao_aberta: boolean | null
          observacoes: string | null
          origin_id: string | null
          product_id: string | null
          proposta_enviada: boolean | null
          realizada: boolean | null
          receita_gerada: number | null
          sdr_id: string | null
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          closer_id?: string | null
          contato?: string | null
          created_at?: string
          created_by?: string | null
          data: string
          empresa: string
          fechou?: boolean | null
          id?: string
          negociacao_aberta?: boolean | null
          observacoes?: string | null
          origin_id?: string | null
          product_id?: string | null
          proposta_enviada?: boolean | null
          realizada?: boolean | null
          receita_gerada?: number | null
          sdr_id?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          closer_id?: string | null
          contato?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          empresa?: string
          fechou?: boolean | null
          id?: string
          negociacao_aberta?: boolean | null
          observacoes?: string | null
          origin_id?: string | null
          product_id?: string | null
          proposta_enviada?: boolean | null
          realizada?: boolean | null
          receita_gerada?: number | null
          sdr_id?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "closers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "v_closer_scoreboard"
            referencedColumns: ["closer_id"]
          },
          {
            foreignKeyName: "meetings_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "origins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "sdrs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "v_sdr_scoreboard"
            referencedColumns: ["sdr_id"]
          },
        ]
      }
      monthly_targets: {
        Row: {
          ano: number
          contratos_necessarios: number
          dias_uteis: number
          id: string
          mes: number
          meta_receita: number
          ticket_alvo: number
        }
        Insert: {
          ano: number
          contratos_necessarios?: number
          dias_uteis?: number
          id?: string
          mes: number
          meta_receita?: number
          ticket_alvo?: number
        }
        Update: {
          ano?: number
          contratos_necessarios?: number
          dias_uteis?: number
          id?: string
          mes?: number
          meta_receita?: number
          ticket_alvo?: number
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          amount: number
          closer_id: string | null
          company_id: string | null
          created_at: string
          criticidade: Database["public"]["Enums"]["prioridade"] | null
          days_in_stage: number
          empresa: string
          expected_close: string | null
          id: string
          lead_id: string | null
          next_step: string | null
          probability: number
          product_id: string | null
          stage: Database["public"]["Enums"]["opp_stage"]
          updated_at: string
        }
        Insert: {
          amount?: number
          closer_id?: string | null
          company_id?: string | null
          created_at?: string
          criticidade?: Database["public"]["Enums"]["prioridade"] | null
          days_in_stage?: number
          empresa: string
          expected_close?: string | null
          id?: string
          lead_id?: string | null
          next_step?: string | null
          probability?: number
          product_id?: string | null
          stage?: Database["public"]["Enums"]["opp_stage"]
          updated_at?: string
        }
        Update: {
          amount?: number
          closer_id?: string | null
          company_id?: string | null
          created_at?: string
          criticidade?: Database["public"]["Enums"]["prioridade"] | null
          days_in_stage?: number
          empresa?: string
          expected_close?: string | null
          id?: string
          lead_id?: string | null
          next_step?: string | null
          probability?: number
          product_id?: string | null
          stage?: Database["public"]["Enums"]["opp_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "closers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "v_closer_scoreboard"
            referencedColumns: ["closer_id"]
          },
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      origins: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          ticket_base: number | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ticket_base?: number | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ticket_base?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      sdrs: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          meta_conexoes: number
          meta_ligacoes: number
          meta_reunioes: number
          nome: string
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          meta_conexoes?: number
          meta_ligacoes?: number
          meta_reunioes?: number
          nome: string
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          meta_conexoes?: number
          meta_ligacoes?: number
          meta_reunioes?: number
          nome?: string
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sdrs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          meta_receita: number | null
          nome: string
          ordem: number | null
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          id?: string
          meta_receita?: number | null
          nome: string
          ordem?: number | null
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          meta_receita?: number | null
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      thresholds: {
        Row: {
          id: number
          leads_parados_max: number
          plan_b_min_pct: number
          show_rate_min: number
          sla_max_horas: number
          taxa_agendamento_min: number
          taxa_conexao_critico: number
          taxa_conexao_min: number
          ticket_alvo: number
          win_rate_min: number
        }
        Insert: {
          id?: number
          leads_parados_max?: number
          plan_b_min_pct?: number
          show_rate_min?: number
          sla_max_horas?: number
          taxa_agendamento_min?: number
          taxa_conexao_critico?: number
          taxa_conexao_min?: number
          ticket_alvo?: number
          win_rate_min?: number
        }
        Update: {
          id?: number
          leads_parados_max?: number
          plan_b_min_pct?: number
          show_rate_min?: number
          sla_max_horas?: number
          taxa_agendamento_min?: number
          taxa_conexao_critico?: number
          taxa_conexao_min?: number
          ticket_alvo?: number
          win_rate_min?: number
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
    }
    Views: {
      v_closer_scoreboard: {
        Row: {
          ativo: boolean | null
          closer_id: string | null
          fechamentos: number | null
          meta_fechamentos: number | null
          meta_receita: number | null
          meta_reunioes: number | null
          negociacoes: number | null
          no_show: number | null
          nome: string | null
          propostas: number | null
          receita: number | null
          reunioes: number | null
          show_rate: number | null
          ticket_medio: number | null
          win_rate: number | null
        }
        Relationships: []
      }
      v_forecast_month: {
        Row: {
          ano: number | null
          contratos_necessarios: number | null
          contratos_restantes: number | null
          dias_uteis: number | null
          fechamentos_realizados: number | null
          gap: number | null
          mes: number | null
          meta_receita: number | null
          pipeline_ponderado: number | null
          receita_realizada: number | null
          ticket_alvo: number | null
        }
        Relationships: []
      }
      v_funnel_month: {
        Row: {
          agendamentos: number | null
          conexoes: number | null
          fechamentos: number | null
          mes: string | null
          negociacoes: number | null
          propostas: number | null
          receita: number | null
          reunioes: number | null
          show_rate: number | null
          taxa_agendamento: number | null
          taxa_conexao: number | null
          tentativas: number | null
          ticket_medio: number | null
          win_rate: number | null
        }
        Relationships: []
      }
      v_monthly_rollup: {
        Row: {
          agendamentos: number | null
          ano: number | null
          conexoes: number | null
          fechamentos: number | null
          mes: number | null
          receita: number | null
          reunioes: number | null
          tentativas: number | null
          ticket_medio: number | null
        }
        Relationships: []
      }
      v_sdr_scoreboard: {
        Row: {
          agendamentos: number | null
          ativo: boolean | null
          conexoes: number | null
          leads_parados: number | null
          meta_conexoes: number | null
          meta_ligacoes: number | null
          meta_reunioes: number | null
          nome: string | null
          reunioes: number | null
          sdr_id: string | null
          sla_medio: number | null
          taxa_agendamento: number | null
          taxa_conexao: number | null
          tentativas: number | null
        }
        Relationships: []
      }
      v_weekly_rollup: {
        Row: {
          agendamentos: number | null
          conexoes: number | null
          fechamentos: number | null
          negociacoes: number | null
          receita: number | null
          reunioes: number | null
          semana: string | null
          show_rate: number | null
          taxa_agendamento: number | null
          taxa_conexao: number | null
          tentativas: number | null
          win_rate: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "head" | "gestor" | "sdr" | "closer" | "viewer"
      kanban_col:
        | "inbox"
        | "prioridade"
        | "andamento"
        | "aguardando"
        | "bloqueado"
        | "revisar"
        | "validado"
        | "concluido"
      opp_stage:
        | "Prospec"
        | "Qualificado"
        | "Reuniao"
        | "Proposta"
        | "Negociacao"
        | "Fechado-Ganho"
        | "Fechado-Perdido"
      prioridade: "baixa" | "media" | "alta" | "critica"
      semaforo: "excelente" | "saudavel" | "atencao" | "critico"
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
      app_role: ["admin", "head", "gestor", "sdr", "closer", "viewer"],
      kanban_col: [
        "inbox",
        "prioridade",
        "andamento",
        "aguardando",
        "bloqueado",
        "revisar",
        "validado",
        "concluido",
      ],
      opp_stage: [
        "Prospec",
        "Qualificado",
        "Reuniao",
        "Proposta",
        "Negociacao",
        "Fechado-Ganho",
        "Fechado-Perdido",
      ],
      prioridade: ["baixa", "media", "alta", "critica"],
      semaforo: ["excelente", "saudavel", "atencao", "critico"],
    },
  },
} as const
