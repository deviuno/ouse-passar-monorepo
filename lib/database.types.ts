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
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
