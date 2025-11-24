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
  }
}
