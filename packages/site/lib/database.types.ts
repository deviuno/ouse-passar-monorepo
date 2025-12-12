export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      artigos: {
        Row: {
          id: string
          titulo: string
          slug: string
          descricao: string
          conteudo: string
          categoria: string | null
          tags: string[] | null
          palavras_chave: string[] | null
          status_publicacao: string
          autor_nome: string | null
          autor_avatar: string | null
          imagem_capa: string | null
          tempo_leitura: number | null
          data_publicacao: string | null
          data_criacao: string
          data_atualizacao: string
        }
        Insert: {
          id?: string
          titulo: string
          slug: string
          descricao: string
          conteudo: string
          categoria?: string | null
          tags?: string[] | null
          palavras_chave?: string[] | null
          status_publicacao?: string
          autor_nome?: string | null
          autor_avatar?: string | null
          imagem_capa?: string | null
          tempo_leitura?: number | null
          data_publicacao?: string | null
          data_criacao?: string
          data_atualizacao?: string
        }
        Update: {
          id?: string
          titulo?: string
          slug?: string
          descricao?: string
          conteudo?: string
          categoria?: string | null
          tags?: string[] | null
          palavras_chave?: string[] | null
          status_publicacao?: string
          autor_nome?: string | null
          autor_avatar?: string | null
          imagem_capa?: string | null
          tempo_leitura?: number | null
          data_publicacao?: string | null
          data_criacao?: string
          data_atualizacao?: string
        }
        Relationships: []
      }
      writers_profiles: {
        Row: {
          id: string
          name: string
          role: string | null
          bio: string | null
          avatar_url: string | null
          instagram_url: string | null
          linkedin_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role?: string | null
          bio?: string | null
          avatar_url?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string | null
          bio?: string | null
          avatar_url?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          blog_name: string | null
          blog_description: string | null
          blog_url: string | null
          posts_per_page: number | null
          meta_title: string | null
          meta_description: string | null
          meta_keywords: string | null
          facebook_url: string | null
          instagram_url: string | null
          linkedin_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          blog_name?: string | null
          blog_description?: string | null
          blog_url?: string | null
          posts_per_page?: number | null
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          blog_name?: string | null
          blog_description?: string | null
          blog_url?: string | null
          posts_per_page?: number | null
          meta_title?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          facebook_url?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          description: string | null
          icon: string | null
          image_url: string | null
          price: number | null
          is_active: boolean
          course_type: 'simulado' | 'preparatorio'
          question_filters: Json
          questions_count: number
          block_size: number
          edital_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          description?: string | null
          icon?: string | null
          image_url?: string | null
          price?: number | null
          is_active?: boolean
          course_type?: 'simulado' | 'preparatorio'
          question_filters?: Json
          questions_count?: number
          block_size?: number
          edital_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          subtitle?: string | null
          description?: string | null
          icon?: string | null
          image_url?: string | null
          price?: number | null
          is_active?: boolean
          course_type?: 'simulado' | 'preparatorio'
          question_filters?: Json
          questions_count?: number
          block_size?: number
          edital_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_edital_id_fkey"
            columns: ["edital_id"]
            referencedRelation: "editais"
            referencedColumns: ["id"]
          }
        ]
      }
      autores_artigos: {
        Row: {
          autor_id: string
          nome: string
          profissao: string
          especialidades: string
          missao: string
          tom_de_voz: string
          objetivo_final: string
          horario: string | null
          imagem_perfil: string | null
          Assunto: string | null
          ativo: boolean
          data_criacao: string
        }
        Insert: {
          autor_id?: string
          nome: string
          profissao: string
          especialidades: string
          missao: string
          tom_de_voz: string
          objetivo_final: string
          horario?: string | null
          imagem_perfil?: string | null
          Assunto?: string | null
          ativo?: boolean
          data_criacao?: string
        }
        Update: {
          autor_id?: string
          nome?: string
          profissao?: string
          especialidades?: string
          missao?: string
          tom_de_voz?: string
          objetivo_final?: string
          horario?: string | null
          imagem_perfil?: string | null
          Assunto?: string | null
          ativo?: boolean
          data_criacao?: string
        }
        Relationships: []
      }
      planejamentos_prf: {
        Row: {
          id: string
          nome_aluno: string
          email: string | null
          concurso: string
          mensagem_incentivo: string
          created_at: string
        }
        Insert: {
          id?: string
          nome_aluno: string
          email?: string | null
          concurso: string
          mensagem_incentivo: string
          created_at?: string
        }
        Update: {
          id?: string
          nome_aluno?: string
          email?: string | null
          concurso?: string
          mensagem_incentivo?: string
          created_at?: string
        }
        Relationships: []
      }
      editais: {
        Row: {
          id: string
          course_id: string | null
          file_url: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          status: 'pending' | 'processing' | 'analyzed' | 'completed' | 'error'
          ai_analysis: Json | null
          suggested_filters: Json | null
          matched_questions_count: number | null
          concurso_nome: string | null
          orgao: string | null
          banca: string | null
          ano: number | null
          cargos: string[] | null
          processing_log: string | null
          error_message: string | null
          uploaded_at: string
          processed_at: string | null
          approved_at: string | null
          approved_by: string | null
          n8n_execution_id: string | null
          webhook_response: Json | null
        }
        Insert: {
          id?: string
          course_id?: string | null
          file_url: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          status?: 'pending' | 'processing' | 'analyzed' | 'completed' | 'error'
          ai_analysis?: Json | null
          suggested_filters?: Json | null
          matched_questions_count?: number | null
          concurso_nome?: string | null
          orgao?: string | null
          banca?: string | null
          ano?: number | null
          cargos?: string[] | null
          processing_log?: string | null
          error_message?: string | null
          uploaded_at?: string
          processed_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          n8n_execution_id?: string | null
          webhook_response?: Json | null
        }
        Update: {
          id?: string
          course_id?: string | null
          file_url?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          status?: 'pending' | 'processing' | 'analyzed' | 'completed' | 'error'
          ai_analysis?: Json | null
          suggested_filters?: Json | null
          matched_questions_count?: number | null
          concurso_nome?: string | null
          orgao?: string | null
          banca?: string | null
          ano?: number | null
          cargos?: string[] | null
          processing_log?: string | null
          error_message?: string | null
          uploaded_at?: string
          processed_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          n8n_execution_id?: string | null
          webhook_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "editais_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_users: {
        Row: {
          id: string
          email: string
          password_hash: string
          name: string
          role: 'admin' | 'vendedor' | 'cliente'
          is_active: boolean
          avatar_url: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          last_login: string | null
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          name: string
          role?: 'admin' | 'vendedor' | 'cliente'
          is_active?: boolean
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          name?: string
          role?: 'admin' | 'vendedor' | 'cliente'
          is_active?: boolean
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          last_login?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          id: string
          nome: string
          sexo: 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_dizer' | null
          email: string | null
          telefone: string | null
          concurso_almejado: string
          nivel_escolaridade: 'fundamental_incompleto' | 'fundamental_completo' | 'medio_incompleto' | 'medio_completo' | 'superior_incompleto' | 'superior_completo' | 'pos_graduacao' | 'mestrado' | 'doutorado' | null
          trabalha: boolean
          e_concursado: boolean
          possui_curso_concurso: boolean
          qual_curso: string | null
          minutos_domingo: number
          minutos_segunda: number
          minutos_terca: number
          minutos_quarta: number
          minutos_quinta: number
          minutos_sexta: number
          minutos_sabado: number
          principal_dificuldade: 'tempo' | 'nao_saber_por_onde_comecar' | 'organizacao' | 'falta_de_material' | 'outros' | null
          principais_dificuldades: ('tempo' | 'nao_saber_por_onde_comecar' | 'organizacao' | 'falta_de_material' | 'outros')[]
          dificuldade_outros: string | null
          vendedor_id: string | null
          planejamento_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          sexo?: 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_dizer' | null
          email?: string | null
          telefone?: string | null
          concurso_almejado: string
          nivel_escolaridade?: 'fundamental_incompleto' | 'fundamental_completo' | 'medio_incompleto' | 'medio_completo' | 'superior_incompleto' | 'superior_completo' | 'pos_graduacao' | 'mestrado' | 'doutorado' | null
          trabalha?: boolean
          e_concursado?: boolean
          possui_curso_concurso?: boolean
          qual_curso?: string | null
          minutos_domingo?: number
          minutos_segunda?: number
          minutos_terca?: number
          minutos_quarta?: number
          minutos_quinta?: number
          minutos_sexta?: number
          minutos_sabado?: number
          principal_dificuldade?: 'tempo' | 'nao_saber_por_onde_comecar' | 'organizacao' | 'falta_de_material' | 'outros' | null
          principais_dificuldades?: ('tempo' | 'nao_saber_por_onde_comecar' | 'organizacao' | 'falta_de_material' | 'outros')[]
          dificuldade_outros?: string | null
          vendedor_id?: string | null
          planejamento_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          sexo?: 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_dizer' | null
          email?: string | null
          telefone?: string | null
          concurso_almejado?: string
          nivel_escolaridade?: 'fundamental_incompleto' | 'fundamental_completo' | 'medio_incompleto' | 'medio_completo' | 'superior_incompleto' | 'superior_completo' | 'pos_graduacao' | 'mestrado' | 'doutorado' | null
          trabalha?: boolean
          e_concursado?: boolean
          possui_curso_concurso?: boolean
          qual_curso?: string | null
          minutos_domingo?: number
          minutos_segunda?: number
          minutos_terca?: number
          minutos_quarta?: number
          minutos_quinta?: number
          minutos_sexta?: number
          minutos_sabado?: number
          principal_dificuldade?: 'tempo' | 'nao_saber_por_onde_comecar' | 'organizacao' | 'falta_de_material' | 'outros' | null
          principais_dificuldades?: ('tempo' | 'nao_saber_por_onde_comecar' | 'organizacao' | 'falta_de_material' | 'outros')[]
          dificuldade_outros?: string | null
          vendedor_id?: string | null
          planejamento_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_vendedor_id_fkey"
            columns: ["vendedor_id"]
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_planejamento_id_fkey"
            columns: ["planejamento_id"]
            referencedRelation: "planejamentos_prf"
            referencedColumns: ["id"]
          }
        ]
      }
      preparatorios: {
        Row: {
          id: string
          nome: string
          slug: string
          descricao: string | null
          icone: string
          cor: string
          is_active: boolean
          ordem: number
          imagem_capa: string | null
          preco: number | null
          preco_desconto: number | null
          checkout_url: string | null
          descricao_curta: string | null
          descricao_vendas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
          descricao?: string | null
          icone?: string
          cor?: string
          is_active?: boolean
          ordem?: number
          imagem_capa?: string | null
          preco?: number | null
          preco_desconto?: number | null
          checkout_url?: string | null
          descricao_curta?: string | null
          descricao_vendas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
          descricao?: string | null
          icone?: string
          cor?: string
          is_active?: boolean
          ordem?: number
          imagem_capa?: string | null
          preco?: number | null
          preco_desconto?: number | null
          checkout_url?: string | null
          descricao_curta?: string | null
          descricao_vendas?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      rodadas: {
        Row: {
          id: string
          preparatorio_id: string
          numero: number
          titulo: string
          nota: string | null
          ordem: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          preparatorio_id: string
          numero: number
          titulo: string
          nota?: string | null
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          preparatorio_id?: string
          numero?: number
          titulo?: string
          nota?: string | null
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rodadas_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          }
        ]
      }
      missoes: {
        Row: {
          id: string
          rodada_id: string
          numero: string
          tipo: 'padrao' | 'revisao' | 'acao'
          materia: string | null
          assunto: string | null
          instrucoes: string | null
          tema: string | null
          acao: string | null
          extra: string[] | null
          obs: string | null
          ordem: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rodada_id: string
          numero: string
          tipo?: 'padrao' | 'revisao' | 'acao'
          materia?: string | null
          assunto?: string | null
          instrucoes?: string | null
          tema?: string | null
          acao?: string | null
          extra?: string[] | null
          obs?: string | null
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rodada_id?: string
          numero?: string
          tipo?: 'padrao' | 'revisao' | 'acao'
          materia?: string | null
          assunto?: string | null
          instrucoes?: string | null
          tema?: string | null
          acao?: string | null
          extra?: string[] | null
          obs?: string | null
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missoes_rodada_id_fkey"
            columns: ["rodada_id"]
            referencedRelation: "rodadas"
            referencedColumns: ["id"]
          }
        ]
      }
      mensagens_incentivo: {
        Row: {
          id: string
          preparatorio_id: string
          mensagem: string
          ordem: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          preparatorio_id: string
          mensagem: string
          ordem?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          preparatorio_id?: string
          mensagem?: string
          ordem?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_incentivo_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          }
        ]
      }
      planejamentos: {
        Row: {
          id: string
          preparatorio_id: string
          nome_aluno: string
          email: string | null
          mensagem_incentivo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          preparatorio_id: string
          nome_aluno: string
          email?: string | null
          mensagem_incentivo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          preparatorio_id?: string
          nome_aluno?: string
          email?: string | null
          mensagem_incentivo?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planejamentos_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      course_type: 'simulado' | 'preparatorio'
      edital_status: 'pending' | 'processing' | 'analyzed' | 'completed' | 'error'
      user_role: 'admin' | 'vendedor' | 'cliente'
      lead_difficulty: 'tempo' | 'nao_saber_por_onde_comecar' | 'organizacao' | 'falta_de_material' | 'outros'
      lead_gender: 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_dizer'
      education_level: 'fundamental_incompleto' | 'fundamental_completo' | 'medio_incompleto' | 'medio_completo' | 'superior_incompleto' | 'superior_completo' | 'pos_graduacao' | 'mestrado' | 'doutorado'
      missao_tipo: 'padrao' | 'revisao' | 'acao'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Tipos auxiliares para admin_users
export type UserRole = Database['public']['Enums']['user_role']
export type LeadDifficulty = Database['public']['Enums']['lead_difficulty']
export type LeadGender = Database['public']['Enums']['lead_gender']
export type EducationLevel = Database['public']['Enums']['education_level']

export interface AdminUser {
  id: string
  email: string
  password_hash: string
  name: string
  role: UserRole
  is_active: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  last_login: string | null
}

export interface Lead {
  id: string
  nome: string
  sexo: LeadGender | null
  email: string | null
  telefone: string | null
  concurso_almejado: string
  nivel_escolaridade: EducationLevel | null
  trabalha: boolean
  e_concursado: boolean
  possui_curso_concurso: boolean
  qual_curso: string | null
  minutos_domingo: number
  minutos_segunda: number
  minutos_terca: number
  minutos_quarta: number
  minutos_quinta: number
  minutos_sexta: number
  minutos_sabado: number
  principal_dificuldade: LeadDifficulty | null
  principais_dificuldades: LeadDifficulty[]
  dificuldade_outros: string | null
  vendedor_id: string | null
  planejamento_id: string | null
  status: string
  created_at: string
  updated_at: string
}

// Tipos auxiliares para o sistema de preparatorios
export type MissaoTipo = Database['public']['Enums']['missao_tipo']

export interface Preparatorio {
  id: string
  nome: string
  slug: string
  descricao: string | null
  icone: string
  cor: string
  is_active: boolean
  ordem: number
  imagem_capa: string | null
  preco: number | null
  preco_desconto: number | null
  checkout_url: string | null
  descricao_curta: string | null
  descricao_vendas: string | null
  created_at: string
  updated_at: string
}

export interface Rodada {
  id: string
  preparatorio_id: string
  numero: number
  titulo: string
  nota: string | null
  ordem: number
  created_at: string
  updated_at: string
}

export interface Missao {
  id: string
  rodada_id: string
  numero: string
  tipo: MissaoTipo
  materia: string | null
  assunto: string | null
  instrucoes: string | null
  tema: string | null
  acao: string | null
  extra: string[] | null
  obs: string | null
  ordem: number
  created_at: string
  updated_at: string
}

export interface MensagemIncentivo {
  id: string
  preparatorio_id: string
  mensagem: string
  ordem: number
  is_active: boolean
  created_at: string
}

export interface Planejamento {
  id: string
  preparatorio_id: string
  nome_aluno: string
  email: string | null
  mensagem_incentivo: string | null
  created_at: string
}

// Tipos compostos para uso no frontend
export interface RodadaComMissoes extends Rodada {
  missoes: Missao[]
}

export interface PreparatorioCompleto extends Preparatorio {
  rodadas: RodadaComMissoes[]
  mensagens_incentivo: MensagemIncentivo[]
}
