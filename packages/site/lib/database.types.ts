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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          coins_reward: number | null
          created_at: string | null
          description: string
          display_order: number | null
          icon: string
          id: string
          is_active: boolean | null
          is_hidden: boolean | null
          name: string
          requirement_type: string
          requirement_value: number
          unlock_message: string | null
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          category?: string
          coins_reward?: number | null
          created_at?: string | null
          description: string
          display_order?: number | null
          icon: string
          id: string
          is_active?: boolean | null
          is_hidden?: boolean | null
          name: string
          requirement_type: string
          requirement_value: number
          unlock_message?: string | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          category?: string
          coins_reward?: number | null
          created_at?: string | null
          description?: string
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          is_hidden?: boolean | null
          name?: string
          requirement_type?: string
          requirement_value?: number
          unlock_message?: string | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          blog_description: string | null
          blog_name: string | null
          blog_url: string | null
          created_at: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          password_hash: string
          posts_per_page: number | null
          updated_at: string | null
        }
        Insert: {
          blog_description?: string | null
          blog_name?: string | null
          blog_url?: string | null
          created_at?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          password_hash?: string
          posts_per_page?: number | null
          updated_at?: string | null
        }
        Update: {
          blog_description?: string | null
          blog_name?: string | null
          blog_url?: string | null
          created_at?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          password_hash?: string
          posts_per_page?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          email: string
          genero: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          password_hash: string
          role: Database["public"]["Enums"]["user_role"]
          show_answers: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          genero?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          password_hash: string
          role?: Database["public"]["Enums"]["user_role"]
          show_answers?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          genero?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          password_hash?: string
          role?: Database["public"]["Enums"]["user_role"]
          show_answers?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          approved_at: string | null
          commission_amount: number
          commission_rate: number
          created_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          referred_id: string
          sale_amount: number
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          affiliate_id: string
          approved_at?: string | null
          commission_amount: number
          commission_rate: number
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          referred_id: string
          sale_amount: number
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          affiliate_id?: string
          approved_at?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          referred_id?: string
          sale_amount?: number
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: []
      }
      agendamentos: {
        Row: {
          created_at: string | null
          data_hora: string
          duracao_minutos: number | null
          id: string
          lead_id: string
          notas: string | null
          preparatorio_id: string
          status: string | null
          updated_at: string | null
          vendedor_id: string
        }
        Insert: {
          created_at?: string | null
          data_hora: string
          duracao_minutos?: number | null
          id?: string
          lead_id: string
          notas?: string | null
          preparatorio_id: string
          status?: string | null
          updated_at?: string | null
          vendedor_id: string
        }
        Update: {
          created_at?: string | null
          data_hora?: string
          duracao_minutos?: number | null
          id?: string
          lead_id?: string
          notas?: string | null
          preparatorio_id?: string
          status?: string | null
          updated_at?: string | null
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            isOneToOne: false
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      artigos: {
        Row: {
          autor_avatar: string | null
          autor_id: string | null
          autor_nome: string | null
          categoria: string | null
          categoria_id: string | null
          conteudo: string
          data_atualizacao: string | null
          data_criacao: string | null
          data_publicacao: string | null
          descricao: string
          id: string
          imagem_capa: string | null
          palavras_chave: string[] | null
          slug: string
          status_publicacao: string | null
          tags: string[] | null
          tempo_leitura: number | null
          titulo: string
        }
        Insert: {
          autor_avatar?: string | null
          autor_id?: string | null
          autor_nome?: string | null
          categoria?: string | null
          categoria_id?: string | null
          conteudo: string
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_publicacao?: string | null
          descricao: string
          id?: string
          imagem_capa?: string | null
          palavras_chave?: string[] | null
          slug: string
          status_publicacao?: string | null
          tags?: string[] | null
          tempo_leitura?: number | null
          titulo: string
        }
        Update: {
          autor_avatar?: string | null
          autor_id?: string | null
          autor_nome?: string | null
          categoria?: string | null
          categoria_id?: string | null
          conteudo?: string
          data_atualizacao?: string | null
          data_criacao?: string | null
          data_publicacao?: string | null
          descricao?: string
          id?: string
          imagem_capa?: string | null
          palavras_chave?: string[] | null
          slug?: string
          status_publicacao?: string | null
          tags?: string[] | null
          tempo_leitura?: number | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "artigos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "autores_artigos"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "artigos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      assuntos: {
        Row: {
          created_at: string | null
          id: string
          materia_id: string
          nivel_dificuldade: string | null
          nome: string
          ordem: number | null
          sub_topicos: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          materia_id: string
          nivel_dificuldade?: string | null
          nome: string
          ordem?: number | null
          sub_topicos?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          materia_id?: string
          nivel_dificuldade?: string | null
          nome?: string
          ordem?: number | null
          sub_topicos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assuntos_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "preparatorio_materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assuntos_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "vw_materias_com_topicos_disponiveis"
            referencedColumns: ["materia_id"]
          },
        ]
      }
      atividade_tipos: {
        Row: {
          cor: string
          created_at: string | null
          descricao: string | null
          icone: string | null
          id: string
          is_default: boolean | null
          nome: string
          ordem: number | null
        }
        Insert: {
          cor: string
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          is_default?: boolean | null
          nome: string
          ordem?: number | null
        }
        Update: {
          cor?: string
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          is_default?: boolean | null
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      atividade_tipos_usuario: {
        Row: {
          cor: string
          created_at: string | null
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          ordem: number | null
          planejamento_id: string
        }
        Insert: {
          cor: string
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          ordem?: number | null
          planejamento_id: string
        }
        Update: {
          cor?: string
          created_at?: string | null
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          planejamento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividade_tipos_usuario_planejamento_id_fkey"
            columns: ["planejamento_id"]
            isOneToOne: false
            referencedRelation: "planejamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_cache: {
        Row: {
          access_count: number | null
          assunto: string
          audio_data: string
          content_type: string
          created_at: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          last_accessed_at: string | null
          script_text: string | null
        }
        Insert: {
          access_count?: number | null
          assunto: string
          audio_data: string
          content_type: string
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          last_accessed_at?: string | null
          script_text?: string | null
        }
        Update: {
          access_count?: number | null
          assunto?: string
          audio_data?: string
          content_type?: string
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          last_accessed_at?: string | null
          script_text?: string | null
        }
        Relationships: []
      }
      autores_artigos: {
        Row: {
          Assunto: string | null
          ativo: boolean
          autor_id: string
          blog_referencia: string | null
          data_criacao: string | null
          especialidades: string
          horario: string | null
          imagem_perfil: string | null
          intervalo_tempo: number | null
          missao: string
          modo_escrita: string | null
          nome: string
          objetivo_final: string
          profissao: string
          quantidade_artigos: number | null
          termo_busca: string | null
          tom_de_voz: string
          unidade_intervalo: string | null
        }
        Insert: {
          Assunto?: string | null
          ativo?: boolean
          autor_id: string
          blog_referencia?: string | null
          data_criacao?: string | null
          especialidades: string
          horario?: string | null
          imagem_perfil?: string | null
          intervalo_tempo?: number | null
          missao: string
          modo_escrita?: string | null
          nome: string
          objetivo_final: string
          profissao: string
          quantidade_artigos?: number | null
          termo_busca?: string | null
          tom_de_voz: string
          unidade_intervalo?: string | null
        }
        Update: {
          Assunto?: string | null
          ativo?: boolean
          autor_id?: string
          blog_referencia?: string | null
          data_criacao?: string | null
          especialidades?: string
          horario?: string | null
          imagem_perfil?: string | null
          intervalo_tempo?: number | null
          missao?: string
          modo_escrita?: string | null
          nome?: string
          objetivo_final?: string
          profissao?: string
          quantidade_artigos?: number | null
          termo_busca?: string | null
          tom_de_voz?: string
          unidade_intervalo?: string | null
        }
        Relationships: []
      }
      battery_history: {
        Row: {
          action_type: string
          battery_after: number
          battery_before: number
          context: Json | null
          cost: number
          created_at: string | null
          id: string
          preparatorio_id: string
          user_id: string
        }
        Insert: {
          action_type: string
          battery_after: number
          battery_before: number
          context?: Json | null
          cost?: number
          created_at?: string | null
          id?: string
          preparatorio_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          battery_after?: number
          battery_before?: number
          context?: Json | null
          cost?: number
          created_at?: string | null
          id?: string
          preparatorio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battery_history_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            isOneToOne: false
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      cadernos: {
        Row: {
          created_at: string | null
          description: string | null
          filters: Json
          id: string
          is_favorite: boolean | null
          questions_count: number | null
          settings: Json | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          filters?: Json
          id?: string
          is_favorite?: boolean | null
          questions_count?: number | null
          settings?: Json | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          filters?: Json
          id?: string
          is_favorite?: boolean | null
          questions_count?: number | null
          settings?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comment_votes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
          vote_type: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "question_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudos: {
        Row: {
          assunto_id: string
          audio_url: string | null
          created_at: string | null
          id: string
          nivel: string
          texto_content: string | null
          updated_at: string | null
          visual_url: string | null
        }
        Insert: {
          assunto_id: string
          audio_url?: string | null
          created_at?: string | null
          id?: string
          nivel: string
          texto_content?: string | null
          updated_at?: string | null
          visual_url?: string | null
        }
        Update: {
          assunto_id?: string
          audio_url?: string | null
          created_at?: string | null
          id?: string
          nivel?: string
          texto_content?: string | null
          updated_at?: string | null
          visual_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conteudos_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assuntos"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          block_size: number | null
          content_types: string[] | null
          course_type: string | null
          created_at: string | null
          description: string | null
          edital_id: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          price: number | null
          question_filters: Json | null
          questions_count: number | null
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          block_size?: number | null
          content_types?: string[] | null
          course_type?: string | null
          created_at?: string | null
          description?: string | null
          edital_id?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price?: number | null
          question_filters?: Json | null
          questions_count?: number | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          block_size?: number | null
          content_types?: string[] | null
          course_type?: string | null
          created_at?: string | null
          description?: string | null
          edital_id?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price?: number | null
          question_filters?: Json | null
          questions_count?: number | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_edital_id_fkey"
            columns: ["edital_id"]
            isOneToOne: false
            referencedRelation: "editais"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenges: {
        Row: {
          challenge_type: string
          coins_reward: number
          created_at: string | null
          description: string
          id: string
          is_active: boolean
          name: string
          study_mode_filter: string | null
          subject_filter: string | null
          target_value: number
          updated_at: string | null
          weight: number | null
          xp_reward: number
        }
        Insert: {
          challenge_type: string
          coins_reward?: number
          created_at?: string | null
          description: string
          id?: string
          is_active?: boolean
          name: string
          study_mode_filter?: string | null
          subject_filter?: string | null
          target_value: number
          updated_at?: string | null
          weight?: number | null
          xp_reward?: number
        }
        Update: {
          challenge_type?: string
          coins_reward?: number
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          study_mode_filter?: string | null
          subject_filter?: string | null
          target_value?: number
          updated_at?: string | null
          weight?: number | null
          xp_reward?: number
        }
        Relationships: []
      }
      ead_badges: {
        Row: {
          badge_type: string | null
          color: string | null
          created_at: string | null
          criteria: Json | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          is_secret: boolean | null
          name: string
          points_value: number | null
          slug: string
        }
        Insert: {
          badge_type?: string | null
          color?: string | null
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_secret?: boolean | null
          name: string
          points_value?: number | null
          slug: string
        }
        Update: {
          badge_type?: string | null
          color?: string | null
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_secret?: boolean | null
          name?: string
          points_value?: number | null
          slug?: string
        }
        Relationships: []
      }
      ead_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ead_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ead_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ead_courses: {
        Row: {
          access_days: number | null
          access_type: string | null
          average_rating: number | null
          badge_id: string | null
          category_id: string | null
          checkout_url: string | null
          completion_rate: number | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          difficulty_level: string | null
          enrolled_count: number | null
          estimated_duration_hours: number | null
          hotmart_product_id: string | null
          id: string
          instructor_id: string | null
          is_free: boolean | null
          kiwify_product_id: string | null
          original_price: number | null
          points_on_complete: number | null
          preview_video_url: string | null
          price: number | null
          published_at: string | null
          requirements: string[] | null
          reviews_count: number | null
          short_description: string | null
          slug: string
          status: string | null
          subtitle: string | null
          tags: string[] | null
          target_audience: string[] | null
          thumbnail_url: string | null
          title: string
          total_lessons: number | null
          updated_at: string | null
          what_you_learn: string[] | null
        }
        Insert: {
          access_days?: number | null
          access_type?: string | null
          average_rating?: number | null
          badge_id?: string | null
          category_id?: string | null
          checkout_url?: string | null
          completion_rate?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          enrolled_count?: number | null
          estimated_duration_hours?: number | null
          hotmart_product_id?: string | null
          id?: string
          instructor_id?: string | null
          is_free?: boolean | null
          kiwify_product_id?: string | null
          original_price?: number | null
          points_on_complete?: number | null
          preview_video_url?: string | null
          price?: number | null
          published_at?: string | null
          requirements?: string[] | null
          reviews_count?: number | null
          short_description?: string | null
          slug: string
          status?: string | null
          subtitle?: string | null
          tags?: string[] | null
          target_audience?: string[] | null
          thumbnail_url?: string | null
          title: string
          total_lessons?: number | null
          updated_at?: string | null
          what_you_learn?: string[] | null
        }
        Update: {
          access_days?: number | null
          access_type?: string | null
          average_rating?: number | null
          badge_id?: string | null
          category_id?: string | null
          checkout_url?: string | null
          completion_rate?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string | null
          enrolled_count?: number | null
          estimated_duration_hours?: number | null
          hotmart_product_id?: string | null
          id?: string
          instructor_id?: string | null
          is_free?: boolean | null
          kiwify_product_id?: string | null
          original_price?: number | null
          points_on_complete?: number | null
          preview_video_url?: string | null
          price?: number | null
          published_at?: string | null
          requirements?: string[] | null
          reviews_count?: number | null
          short_description?: string | null
          slug?: string
          status?: string | null
          subtitle?: string | null
          tags?: string[] | null
          target_audience?: string[] | null
          thumbnail_url?: string | null
          title?: string
          total_lessons?: number | null
          updated_at?: string | null
          what_you_learn?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ead_courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ead_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ead_enrollments: {
        Row: {
          completed_at: string | null
          completed_lessons_count: number | null
          course_id: string
          created_at: string | null
          enrolled_at: string | null
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          last_lesson_id: string | null
          progress_percentage: number | null
          status: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_lessons_count?: number | null
          course_id: string
          created_at?: string | null
          enrolled_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          last_lesson_id?: string | null
          progress_percentage?: number | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_lessons_count?: number | null
          course_id?: string
          created_at?: string | null
          enrolled_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          last_lesson_id?: string | null
          progress_percentage?: number | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ead_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "ead_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ead_enrollments_last_lesson_id_fkey"
            columns: ["last_lesson_id"]
            isOneToOne: false
            referencedRelation: "ead_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      ead_lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          enrollment_id: string
          id: string
          is_completed: boolean | null
          last_position_seconds: number | null
          lesson_id: string
          progress_percentage: number | null
          updated_at: string | null
          user_id: string
          watch_time_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          enrollment_id: string
          id?: string
          is_completed?: boolean | null
          last_position_seconds?: number | null
          lesson_id: string
          progress_percentage?: number | null
          updated_at?: string | null
          user_id: string
          watch_time_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          enrollment_id?: string
          id?: string
          is_completed?: boolean | null
          last_position_seconds?: number | null
          lesson_id?: string
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ead_lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "ead_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ead_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "ead_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      ead_lessons: {
        Row: {
          content_type: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_free: boolean | null
          module_id: string
          points_on_complete: number | null
          requires_completion: boolean | null
          slug: string
          sort_order: number | null
          text_content: string | null
          title: string
          updated_at: string | null
          video_duration_seconds: number | null
          video_url: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          module_id: string
          points_on_complete?: number | null
          requires_completion?: boolean | null
          slug: string
          sort_order?: number | null
          text_content?: string | null
          title: string
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_url?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          module_id?: string
          points_on_complete?: number | null
          requires_completion?: boolean | null
          slug?: string
          sort_order?: number | null
          text_content?: string | null
          title?: string
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ead_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "ead_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      ead_levels: {
        Row: {
          benefits: string[] | null
          color: string | null
          created_at: string | null
          icon_url: string | null
          id: string
          level_number: number
          min_points: number
          name: string
        }
        Insert: {
          benefits?: string[] | null
          color?: string | null
          created_at?: string | null
          icon_url?: string | null
          id?: string
          level_number: number
          min_points: number
          name: string
        }
        Update: {
          benefits?: string[] | null
          color?: string | null
          created_at?: string | null
          icon_url?: string | null
          id?: string
          level_number?: number
          min_points?: number
          name?: string
        }
        Relationships: []
      }
      ead_modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_free: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ead_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "ead_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      ead_user_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ead_user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "ead_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      ead_user_points: {
        Row: {
          created_at: string | null
          current_level: number | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_level?: number | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      editais: {
        Row: {
          ai_analysis: Json | null
          ano: number | null
          approved_at: string | null
          approved_by: string | null
          banca: string | null
          cargos: string[] | null
          concurso_nome: string | null
          course_id: string | null
          error_message: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          matched_questions_count: number | null
          n8n_execution_id: string | null
          orgao: string | null
          processed_at: string | null
          processing_log: string | null
          status: string | null
          suggested_filters: Json | null
          uploaded_at: string | null
          webhook_response: Json | null
        }
        Insert: {
          ai_analysis?: Json | null
          ano?: number | null
          approved_at?: string | null
          approved_by?: string | null
          banca?: string | null
          cargos?: string[] | null
          concurso_nome?: string | null
          course_id?: string | null
          error_message?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          matched_questions_count?: number | null
          n8n_execution_id?: string | null
          orgao?: string | null
          processed_at?: string | null
          processing_log?: string | null
          status?: string | null
          suggested_filters?: Json | null
          uploaded_at?: string | null
          webhook_response?: Json | null
        }
        Update: {
          ai_analysis?: Json | null
          ano?: number | null
          approved_at?: string | null
          approved_by?: string | null
          banca?: string | null
          cargos?: string[] | null
          concurso_nome?: string | null
          course_id?: string | null
          error_message?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          matched_questions_count?: number | null
          n8n_execution_id?: string | null
          orgao?: string | null
          processed_at?: string | null
          processing_log?: string | null
          status?: string | null
          suggested_filters?: Json | null
          uploaded_at?: string | null
          webhook_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "editais_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      edital_verticalizado_items: {
        Row: {
          created_at: string | null
          id: string
          ordem: number
          parent_id: string | null
          preparatorio_id: string | null
          tipo: Database["public"]["Enums"]["edital_item_type"]
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ordem: number
          parent_id?: string | null
          preparatorio_id?: string | null
          tipo: Database["public"]["Enums"]["edital_item_type"]
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ordem?: number
          parent_id?: string | null
          preparatorio_id?: string | null
          tipo?: Database["public"]["Enums"]["edital_item_type"]
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edital_verticalizado_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "edital_verticalizado_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edital_verticalizado_items_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            isOneToOne: false
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      edital_verticalizado_progress: {
        Row: {
          acao: boolean | null
          id: string
          item_id: string | null
          missao: boolean | null
          planejamento_id: string | null
          revisao: boolean | null
          updated_at: string | null
        }
        Insert: {
          acao?: boolean | null
          id?: string
          item_id?: string | null
          missao?: boolean | null
          planejamento_id?: string | null
          revisao?: boolean | null
          updated_at?: string | null
        }
        Update: {
          acao?: boolean | null
          id?: string
          item_id?: string | null
          missao?: boolean | null
          planejamento_id?: string | null
          revisao?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edital_verticalizado_progress_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "edital_verticalizado_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edital_verticalizado_progress_planejamento_id_fkey"
            columns: ["planejamento_id"]
            isOneToOne: false
            referencedRelation: "planejamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_settings: {
        Row: {
          coins_per_correct_answer: number
          coins_per_correct_hard_mode: number
          coins_per_pvp_loss: number
          coins_per_pvp_win: number
          created_at: string | null
          daily_goal_coins_bonus: number
          daily_goal_questions: number
          daily_goal_xp_bonus: number
          id: string
          is_gamification_enabled: boolean
          league_demotion_bottom: number
          league_promotion_top: number
          league_reset_day: string
          level_formula: string
          show_level_up_modal: boolean
          show_xp_animations: boolean
          srs_interval_easy: number
          srs_interval_hard: number
          srs_interval_medium: number
          srs_progression_steps: Json
          streak_30_day_xp_bonus: number
          streak_7_day_xp_bonus: number
          streak_freeze_cost: number
          updated_at: string | null
          xp_per_correct_answer: number
          xp_per_correct_hard_mode: number
          xp_per_flashcard_remembered: number
          xp_per_flashcard_review: number
          xp_per_level: number
          xp_per_pvp_loss: number
          xp_per_pvp_win: number
        }
        Insert: {
          coins_per_correct_answer?: number
          coins_per_correct_hard_mode?: number
          coins_per_pvp_loss?: number
          coins_per_pvp_win?: number
          created_at?: string | null
          daily_goal_coins_bonus?: number
          daily_goal_questions?: number
          daily_goal_xp_bonus?: number
          id?: string
          is_gamification_enabled?: boolean
          league_demotion_bottom?: number
          league_promotion_top?: number
          league_reset_day?: string
          level_formula?: string
          show_level_up_modal?: boolean
          show_xp_animations?: boolean
          srs_interval_easy?: number
          srs_interval_hard?: number
          srs_interval_medium?: number
          srs_progression_steps?: Json
          streak_30_day_xp_bonus?: number
          streak_7_day_xp_bonus?: number
          streak_freeze_cost?: number
          updated_at?: string | null
          xp_per_correct_answer?: number
          xp_per_correct_hard_mode?: number
          xp_per_flashcard_remembered?: number
          xp_per_flashcard_review?: number
          xp_per_level?: number
          xp_per_pvp_loss?: number
          xp_per_pvp_win?: number
        }
        Update: {
          coins_per_correct_answer?: number
          coins_per_correct_hard_mode?: number
          coins_per_pvp_loss?: number
          coins_per_pvp_win?: number
          created_at?: string | null
          daily_goal_coins_bonus?: number
          daily_goal_questions?: number
          daily_goal_xp_bonus?: number
          id?: string
          is_gamification_enabled?: boolean
          league_demotion_bottom?: number
          league_promotion_top?: number
          league_reset_day?: string
          level_formula?: string
          show_level_up_modal?: boolean
          show_xp_animations?: boolean
          srs_interval_easy?: number
          srs_interval_hard?: number
          srs_interval_medium?: number
          srs_progression_steps?: Json
          streak_30_day_xp_bonus?: number
          streak_7_day_xp_bonus?: number
          streak_freeze_cost?: number
          updated_at?: string | null
          xp_per_correct_answer?: number
          xp_per_correct_hard_mode?: number
          xp_per_flashcard_remembered?: number
          xp_per_flashcard_review?: number
          xp_per_level?: number
          xp_per_pvp_loss?: number
          xp_per_pvp_win?: number
        }
        Relationships: []
      }
      generation_history: {
        Row: {
          cost: number | null
          created_at: string | null
          id: string
          model_used: string | null
          prompt: string | null
          response: string | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          id?: string
          model_used?: string | null
          prompt?: string | null
          response?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          id?: string
          model_used?: string | null
          prompt?: string | null
          response?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      generation_settings: {
        Row: {
          created_at: string | null
          id: string
          max_tokens: number | null
          model: string | null
          temperature: number | null
          top_p: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          temperature?: number | null
          top_p?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          temperature?: number | null
          top_p?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guru_transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          customer_doc: string | null
          customer_email: string | null
          customer_name: string | null
          event_timestamp: string | null
          event_type: string
          guru_product_id: string | null
          guru_subscription_id: string | null
          guru_transaction_id: string
          id: string
          payment_method: string | null
          preparatorio_id: string | null
          processed: boolean | null
          processed_at: string | null
          processing_error: string | null
          raw_payload: Json
          status: string | null
          user_id: string | null
          user_product_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          customer_doc?: string | null
          customer_email?: string | null
          customer_name?: string | null
          event_timestamp?: string | null
          event_type: string
          guru_product_id?: string | null
          guru_subscription_id?: string | null
          guru_transaction_id: string
          id?: string
          payment_method?: string | null
          preparatorio_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          processing_error?: string | null
          raw_payload: Json
          status?: string | null
          user_id?: string | null
          user_product_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          customer_doc?: string | null
          customer_email?: string | null
          customer_name?: string | null
          event_timestamp?: string | null
          event_type?: string
          guru_product_id?: string | null
          guru_subscription_id?: string | null
          guru_transaction_id?: string
          id?: string
          payment_method?: string | null
          preparatorio_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          processing_error?: string | null
          raw_payload?: Json
          status?: string | null
          user_id?: string | null
          user_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guru_transactions_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            isOneToOne: false
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guru_transactions_user_product_id_fkey"
            columns: ["user_product_id"]
            isOneToOne: false
            referencedRelation: "user_products"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          agendamento_id: string | null
          avatar_url: string | null
          concurso_almejado: string
          created_at: string | null
          dificuldade_outros: string | null
          e_concursado: boolean | null
          email: string | null
          hora_acordar: string | null
          hora_dormir: string | null
          id: string
          minutos_domingo: number | null
          minutos_quarta: number | null
          minutos_quinta: number | null
          minutos_sabado: number | null
          minutos_segunda: number | null
          minutos_sexta: number | null
          minutos_terca: number | null
          nivel_escolaridade:
            | Database["public"]["Enums"]["education_level"]
            | null
          nome: string
          planejamento_id: string | null
          possui_curso_concurso: boolean | null
          principais_dificuldades:
            | Database["public"]["Enums"]["lead_difficulty"][]
            | null
          principal_dificuldade:
            | Database["public"]["Enums"]["lead_difficulty"]
            | null
          qual_curso: string | null
          senha_temporaria: string | null
          sexo: Database["public"]["Enums"]["lead_gender"] | null
          status: string | null
          telefone: string | null
          trabalha: boolean | null
          updated_at: string | null
          user_id: string | null
          vendedor_id: string | null
        }
        Insert: {
          agendamento_id?: string | null
          avatar_url?: string | null
          concurso_almejado: string
          created_at?: string | null
          dificuldade_outros?: string | null
          e_concursado?: boolean | null
          email?: string | null
          hora_acordar?: string | null
          hora_dormir?: string | null
          id?: string
          minutos_domingo?: number | null
          minutos_quarta?: number | null
          minutos_quinta?: number | null
          minutos_sabado?: number | null
          minutos_segunda?: number | null
          minutos_sexta?: number | null
          minutos_terca?: number | null
          nivel_escolaridade?:
            | Database["public"]["Enums"]["education_level"]
            | null
          nome: string
          planejamento_id?: string | null
          possui_curso_concurso?: boolean | null
          principais_dificuldades?:
            | Database["public"]["Enums"]["lead_difficulty"][]
            | null
          principal_dificuldade?:
            | Database["public"]["Enums"]["lead_difficulty"]
            | null
          qual_curso?: string | null
          senha_temporaria?: string | null
          sexo?: Database["public"]["Enums"]["lead_gender"] | null
          status?: string | null
          telefone?: string | null
          trabalha?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          vendedor_id?: string | null
        }
        Update: {
          agendamento_id?: string | null
          avatar_url?: string | null
          concurso_almejado?: string
          created_at?: string | null
          dificuldade_outros?: string | null
          e_concursado?: boolean | null
          email?: string | null
          hora_acordar?: string | null
          hora_dormir?: string | null
          id?: string
          minutos_domingo?: number | null
          minutos_quarta?: number | null
          minutos_quinta?: number | null
          minutos_sabado?: number | null
          minutos_segunda?: number | null
          minutos_sexta?: number | null
          minutos_terca?: number | null
          nivel_escolaridade?:
            | Database["public"]["Enums"]["education_level"]
            | null
          nome?: string
          planejamento_id?: string | null
          possui_curso_concurso?: boolean | null
          principais_dificuldades?:
            | Database["public"]["Enums"]["lead_difficulty"][]
            | null
          principal_dificuldade?:
            | Database["public"]["Enums"]["lead_difficulty"]
            | null
          qual_curso?: string | null
          senha_temporaria?: string | null
          sexo?: Database["public"]["Enums"]["lead_gender"] | null
          status?: string | null
          telefone?: string | null
          trabalha?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      league_tiers: {
        Row: {
          bg_color: string | null
          color: string
          created_at: string | null
          display_order: number
          icon: string
          id: string
          is_active: boolean
          min_xp_to_enter: number | null
          name: string
          promotion_bonus_coins: number | null
          promotion_bonus_xp: number | null
          updated_at: string | null
        }
        Insert: {
          bg_color?: string | null
          color: string
          created_at?: string | null
          display_order: number
          icon: string
          id: string
          is_active?: boolean
          min_xp_to_enter?: number | null
          name: string
          promotion_bonus_coins?: number | null
          promotion_bonus_xp?: number | null
          updated_at?: string | null
        }
        Update: {
          bg_color?: string | null
          color?: string
          created_at?: string | null
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          min_xp_to_enter?: number | null
          name?: string
          promotion_bonus_coins?: number | null
          promotion_bonus_xp?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      legal_texts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          last_updated: string | null
          title: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id: string
          last_updated?: string | null
          title: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          title?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_texts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: number
          is_active: boolean
          level_number: number
          min_xp: number
          rewards_coins: number | null
          rewards_xp: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean
          level_number: number
          min_xp: number
          rewards_coins?: number | null
          rewards_xp?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean
          level_number?: number
          min_xp?: number
          rewards_coins?: number | null
          rewards_xp?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      massificacao_stats: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          missao_massificacao_id: string
          missao_original_id: string
          passou: boolean | null
          score_massificacao: number | null
          score_original: number
          tentativa: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          missao_massificacao_id: string
          missao_original_id: string
          passou?: boolean | null
          score_massificacao?: number | null
          score_original: number
          tentativa: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          missao_massificacao_id?: string
          missao_original_id?: string
          passou?: boolean | null
          score_massificacao?: number | null
          score_original?: number
          tentativa?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "massificacao_stats_missao_massificacao_id_fkey"
            columns: ["missao_massificacao_id"]
            isOneToOne: false
            referencedRelation: "trail_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "massificacao_stats_missao_original_id_fkey"
            columns: ["missao_original_id"]
            isOneToOne: false
            referencedRelation: "trail_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_incentivo: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          mensagem: string
          ordem: number | null
          preparatorio_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mensagem: string
          ordem?: number | null
          preparatorio_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mensagem?: string
          ordem?: number | null
          preparatorio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_incentivo_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            isOneToOne: false
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      missao_conteudos: {
        Row: {
          audio_url: string | null
          created_at: string | null
          error_message: string | null
          generated_by_user_id: string | null
          id: string
          missao_id: string
          modelo_audio: string | null
          modelo_texto: string | null
          questoes_analisadas: Json | null
          reta_final_audio_url: string | null
          reta_final_content: string | null
          reta_final_status: string | null
          status: string | null
          texto_content: string
          topicos_analisados: Json | null
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          error_message?: string | null
          generated_by_user_id?: string | null
          id?: string
          missao_id: string
          modelo_audio?: string | null
          modelo_texto?: string | null
          questoes_analisadas?: Json | null
          reta_final_audio_url?: string | null
          reta_final_content?: string | null
          reta_final_status?: string | null
          status?: string | null
          texto_content: string
          topicos_analisados?: Json | null
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          error_message?: string | null
          generated_by_user_id?: string | null
          id?: string
          missao_id?: string
          modelo_audio?: string | null
          modelo_texto?: string | null
          questoes_analisadas?: Json | null
          reta_final_audio_url?: string | null
          reta_final_content?: string | null
          reta_final_status?: string | null
          status?: string | null
          texto_content?: string
          topicos_analisados?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missao_conteudos_missao_id_fkey"
            columns: ["missao_id"]
            isOneToOne: true
            referencedRelation: "missoes"
            referencedColumns: ["id"]
          },
        ]
      }
      missao_edital_items: {
        Row: {
          created_at: string | null
          edital_item_id: string
          id: string
          missao_id: string
        }
        Insert: {
          created_at?: string | null
          edital_item_id: string
          id?: string
          missao_id: string
        }
        Update: {
          created_at?: string | null
          edital_item_id?: string
          id?: string
          missao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "missao_edital_items_edital_item_id_fkey"
            columns: ["edital_item_id"]
            isOneToOne: false
            referencedRelation: "edital_verticalizado_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missao_edital_items_missao_id_fkey"
            columns: ["missao_id"]
            isOneToOne: false
            referencedRelation: "missoes"
            referencedColumns: ["id"]
          },
        ]
      }
      missao_questao_filtros: {
        Row: {
          created_at: string | null
          filtros: Json
          id: string
          missao_id: string
          questoes_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          filtros?: Json
          id?: string
          missao_id: string
          questoes_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          filtros?: Json
          id?: string
          missao_id?: string
          questoes_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missao_questao_filtros_missao_id_fkey"
            columns: ["missao_id"]
            isOneToOne: true
            referencedRelation: "missoes"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_answers: {
        Row: {
          attempt_number: number | null
          created_at: string | null
          id: string
          is_correct: boolean | null
          mission_id: string
          question_id: string
          selected_answer: string | null
          time_spent: number | null
          user_id: string
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          mission_id: string
          question_id: string
          selected_answer?: string | null
          time_spent?: number | null
          user_id: string
        }
        Update: {
          attempt_number?: number | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          mission_id?: string
          question_id?: string
          selected_answer?: string | null
          time_spent?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_answers_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "trail_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missoes: {
        Row: {
          acao: string | null
          assunto: string | null
          assuntos_ids: string[] | null
          created_at: string | null
          extra: string[] | null
          id: string
          instrucoes: string | null
          materia: string | null
          materia_id: string | null
          materias_ids: string[] | null
          numero: string
          obs: string | null
          ordem: number | null
          plataformas: string[] | null
          revisao_criterios: string[] | null
          revisao_parte: number | null
          rodada_id: string
          tema: string | null
          tipo: Database["public"]["Enums"]["missao_tipo"]
          topicos_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          acao?: string | null
          assunto?: string | null
          assuntos_ids?: string[] | null
          created_at?: string | null
          extra?: string[] | null
          id?: string
          instrucoes?: string | null
          materia?: string | null
          materia_id?: string | null
          materias_ids?: string[] | null
          numero: string
          obs?: string | null
          ordem?: number | null
          plataformas?: string[] | null
          revisao_criterios?: string[] | null
          revisao_parte?: number | null
          rodada_id: string
          tema?: string | null
          tipo?: Database["public"]["Enums"]["missao_tipo"]
          topicos_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          acao?: string | null
          assunto?: string | null
          assuntos_ids?: string[] | null
          created_at?: string | null
          extra?: string[] | null
          id?: string
          instrucoes?: string | null
          materia?: string | null
          materia_id?: string | null
          materias_ids?: string[] | null
          numero?: string
          obs?: string | null
          ordem?: number | null
          plataformas?: string[] | null
          revisao_criterios?: string[] | null
          revisao_parte?: number | null
          rodada_id?: string
          tema?: string | null
          tipo?: Database["public"]["Enums"]["missao_tipo"]
          topicos_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missoes_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "edital_verticalizado_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missoes_rodada_id_fkey"
            columns: ["rodada_id"]
            isOneToOne: false
            referencedRelation: "rodadas"
            referencedColumns: ["id"]
          },
        ]
      }
      missoes_executadas: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          missao_numero: number
          planejamento_id: string
          rodada_numero: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          missao_numero: number
          planejamento_id: string
          rodada_numero: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          missao_numero?: number
          planejamento_id?: string
          rodada_numero?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "missoes_executadas_planejamento_id_fkey"
            columns: ["planejamento_id"]
            isOneToOne: false
            referencedRelation: "planejamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missoes_executadas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_triggers: {
        Row: {
          id: string
          trigger_type: string
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          trigger_type: string
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          trigger_type?: string
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          description: string
          icon: string | null
          id: string
          link: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          icon?: string | null
          id?: string
          link?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string | null
          id?: string
          link?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      planejador_semanal: {
        Row: {
          atividade_tipo_id: string | null
          atividade_usuario_id: string | null
          created_at: string | null
          dia_semana: number
          hora_inicio: string
          id: string
          planejamento_id: string
        }
        Insert: {
          atividade_tipo_id?: string | null
          atividade_usuario_id?: string | null
          created_at?: string | null
          dia_semana: number
          hora_inicio: string
          id?: string
          planejamento_id: string
        }
        Update: {
          atividade_tipo_id?: string | null
          atividade_usuario_id?: string | null
          created_at?: string | null
          dia_semana?: number
          hora_inicio?: string
          id?: string
          planejamento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planejador_semanal_atividade_tipo_id_fkey"
            columns: ["atividade_tipo_id"]
            isOneToOne: false
            referencedRelation: "atividade_tipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejador_semanal_atividade_usuario_id_fkey"
            columns: ["atividade_usuario_id"]
            isOneToOne: false
            referencedRelation: "atividade_tipos_usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejador_semanal_planejamento_id_fkey"
            columns: ["planejamento_id"]
            isOneToOne: false
            referencedRelation: "planejamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_conquistas: {
        Row: {
          created_at: string | null
          descricao: string
          icone: string | null
          id: string
          is_active: boolean | null
          is_hidden: boolean | null
          mensagem_desbloqueio: string | null
          moedas_recompensa: number | null
          nome: string
          ordem: number | null
          requisito_tipo: string
          requisito_valor: number
          updated_at: string | null
          xp_recompensa: number | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          icone?: string | null
          id: string
          is_active?: boolean | null
          is_hidden?: boolean | null
          mensagem_desbloqueio?: string | null
          moedas_recompensa?: number | null
          nome: string
          ordem?: number | null
          requisito_tipo: string
          requisito_valor?: number
          updated_at?: string | null
          xp_recompensa?: number | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          icone?: string | null
          id?: string
          is_active?: boolean | null
          is_hidden?: boolean | null
          mensagem_desbloqueio?: string | null
          moedas_recompensa?: number | null
          nome?: string
          ordem?: number | null
          requisito_tipo?: string
          requisito_valor?: number
          updated_at?: string | null
          xp_recompensa?: number | null
        }
        Relationships: []
      }
      planejamento_conquistas_usuario: {
        Row: {
          conquista_id: string
          desbloqueada_em: string | null
          id: string
          planejamento_id: string
        }
        Insert: {
          conquista_id: string
          desbloqueada_em?: string | null
          id?: string
          planejamento_id: string
        }
        Update: {
          conquista_id?: string
          desbloqueada_em?: string | null
          id?: string
          planejamento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_conquistas_usuario_conquista_id_fkey"
            columns: ["conquista_id"]
            isOneToOne: false
            referencedRelation: "planejamento_conquistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamento_conquistas_usuario_planejamento_id_fkey"
            columns: ["planejamento_id"]
            isOneToOne: false
            referencedRelation: "planejamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamentos: {
        Row: {
          created_at: string | null
          email: string | null
          hora_acordar: string | null
          hora_dormir: string | null
          id: string
          lead_id: string | null
          mensagem_incentivo: string | null
          nome_aluno: string
          preparatorio_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          hora_acordar?: string | null
          hora_dormir?: string | null
          id?: string
          lead_id?: string | null
          mensagem_incentivo?: string | null
          nome_aluno: string
          preparatorio_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          hora_acordar?: string | null
          hora_dormir?: string | null
          id?: string
          lead_id?: string | null
          mensagem_incentivo?: string | null
          nome_aluno?: string
          preparatorio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planejamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamentos_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            isOneToOne: false
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamentos_prf: {
        Row: {
          concurso: string | null
          created_at: string | null
          email: string | null
          id: string
          mensagem_incentivo: string | null
          nome_aluno: string
          updated_at: string | null
        }
        Insert: {
          concurso?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          mensagem_incentivo?: string | null
          nome_aluno: string
          updated_at?: string | null
        }
        Update: {
          concurso?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          mensagem_incentivo?: string | null
          nome_aluno?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      planner_diario: {
        Row: {
          created_at: string | null
          data: string
          energia: number | null
          exercicio_fisico: boolean | null
          fez_revisao: boolean | null
          gratidao: string | null
          horas_estudadas: number | null
          horas_planejadas: number | null
          horas_sono: number | null
          humor: number | null
          id: string
          litros_agua: number | null
          materia_principal: string | null
          meta_minima_amanha: number | null
          missao_prioritaria_amanha: string | null
          missoes_concluidas: number | null
          motivacao_dia: string | null
          oracao_devocional: boolean | null
          percentual_acertos: number | null
          planejamento_id: string
          questoes_feitas: number | null
          registrou_erro: boolean | null
          revisao_rapida: boolean | null
          sem_celular_antes: boolean | null
          semaforo: string | null
          semaforo_motivo: string | null
          updated_at: string | null
          usou_tecnica_estudo: boolean | null
        }
        Insert: {
          created_at?: string | null
          data: string
          energia?: number | null
          exercicio_fisico?: boolean | null
          fez_revisao?: boolean | null
          gratidao?: string | null
          horas_estudadas?: number | null
          horas_planejadas?: number | null
          horas_sono?: number | null
          humor?: number | null
          id?: string
          litros_agua?: number | null
          materia_principal?: string | null
          meta_minima_amanha?: number | null
          missao_prioritaria_amanha?: string | null
          missoes_concluidas?: number | null
          motivacao_dia?: string | null
          oracao_devocional?: boolean | null
          percentual_acertos?: number | null
          planejamento_id: string
          questoes_feitas?: number | null
          registrou_erro?: boolean | null
          revisao_rapida?: boolean | null
          sem_celular_antes?: boolean | null
          semaforo?: string | null
          semaforo_motivo?: string | null
          updated_at?: string | null
          usou_tecnica_estudo?: boolean | null
        }
        Update: {
          created_at?: string | null
          data?: string
          energia?: number | null
          exercicio_fisico?: boolean | null
          fez_revisao?: boolean | null
          gratidao?: string | null
          horas_estudadas?: number | null
          horas_planejadas?: number | null
          horas_sono?: number | null
          humor?: number | null
          id?: string
          litros_agua?: number | null
          materia_principal?: string | null
          meta_minima_amanha?: number | null
          missao_prioritaria_amanha?: string | null
          missoes_concluidas?: number | null
          motivacao_dia?: string | null
          oracao_devocional?: boolean | null
          percentual_acertos?: number | null
          planejamento_id?: string
          questoes_feitas?: number | null
          registrou_erro?: boolean | null
          revisao_rapida?: boolean | null
          sem_celular_antes?: boolean | null
          semaforo?: string | null
          semaforo_motivo?: string | null
          updated_at?: string | null
          usou_tecnica_estudo?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "planner_diario_planejamento_id_fkey"
            columns: ["planejamento_id"]
            isOneToOne: false
            referencedRelation: "planejamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured: boolean | null
          featured_image: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured?: boolean | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured?: boolean | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      posts_views: {
        Row: {
          id: string
          ip_address: string | null
          post_id: string | null
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          post_id?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          post_id?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          accuracy_percentage: number | null
          completed_at: string | null
          correct_answers: number
          created_at: string | null
          filters: Json | null
          id: string
          study_mode: string
          time_spent_seconds: number | null
          total_questions: number
          user_id: string
          wrong_answers: number
          xp_earned: number
        }
        Insert: {
          accuracy_percentage?: number | null
          completed_at?: string | null
          correct_answers?: number
          created_at?: string | null
          filters?: Json | null
          id?: string
          study_mode: string
          time_spent_seconds?: number | null
          total_questions: number
          user_id: string
          wrong_answers?: number
          xp_earned?: number
        }
        Update: {
          accuracy_percentage?: number | null
          completed_at?: string | null
          correct_answers?: number
          created_at?: string | null
          filters?: Json | null
          id?: string
          study_mode?: string
          time_spent_seconds?: number | null
          total_questions?: number
          user_id?: string
          wrong_answers?: number
          xp_earned?: number
        }
        Relationships: []
      }
      preparatorio_materias: {
        Row: {
          created_at: string | null
          id: string
          materia: string
          ordem: number | null
          peso: number | null
          preparatorio_id: string
          total_assuntos: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          materia: string
          ordem?: number | null
          peso?: number | null
          preparatorio_id: string
          total_assuntos?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          materia?: string
          ordem?: number | null
          peso?: number | null
          preparatorio_id?: string
          total_assuntos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "preparatorio_materias_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            isOneToOne: false
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      preparatorios: {
        Row: {
          ano_previsto: number | null
          areas_conhecimento: string[] | null
          banca: string | null
          carga_horaria: string | null
          cargo: string | null
          checkout_ouse_questoes: string | null
          checkout_planejador: string | null
          checkout_plataforma_completa: string | null
          checkout_reta_final: string | null
          checkout_simulados: string | null
          checkout_url: string | null
          content_types: string[] | null
          cor: string | null
          created_at: string | null
          data_prevista: string | null
          data_prova: string | null
          descricao: string | null
          descricao_curta: string | null
          descricao_vendas: string | null
          dias_reta_final: number | null
          edital_url: string | null
          escolaridade: string | null
          guru_product_id_8_questoes: string | null
          guru_product_id_planejador: string | null
          guru_product_id_plataforma_completa: string | null
          guru_product_id_reta_final: string | null
          guru_product_id_simulados: string | null
          icone: string | null
          id: string
          imagem_capa: string | null
          inscricoes_fim: string | null
          inscricoes_inicio: string | null
          is_active: boolean | null
          logo_url: string | null
          modalidade: string | null
          montagem_status: string | null
          n8n_error_message: string | null
          n8n_processed_at: string | null
          n8n_status: string | null
          nivel: string | null
          nome: string
          ordem: number | null
          orgao: string | null
          preco: number | null
          preco_8_questoes: number | null
          preco_8_questoes_desconto: number | null
          preco_desconto: number | null
          preco_planejador: number | null
          preco_planejador_desconto: number | null
          preco_plataforma_completa: number | null
          preco_plataforma_completa_desconto: number | null
          preco_reta_final: number | null
          preco_reta_final_desconto: number | null
          preco_simulados: number | null
          preco_simulados_desconto: number | null
          question_filters: Json | null
          raio_x: Json | null
          regiao: string | null
          requisitos: string | null
          reta_final_disponivel: boolean | null
          salario: number | null
          slug: string
          taxa_inscricao: number | null
          updated_at: string | null
          vagas: number | null
        }
        Insert: {
          ano_previsto?: number | null
          areas_conhecimento?: string[] | null
          banca?: string | null
          carga_horaria?: string | null
          cargo?: string | null
          checkout_ouse_questoes?: string | null
          checkout_planejador?: string | null
          checkout_plataforma_completa?: string | null
          checkout_reta_final?: string | null
          checkout_simulados?: string | null
          checkout_url?: string | null
          content_types?: string[] | null
          cor?: string | null
          created_at?: string | null
          data_prevista?: string | null
          data_prova?: string | null
          descricao?: string | null
          descricao_curta?: string | null
          descricao_vendas?: string | null
          dias_reta_final?: number | null
          edital_url?: string | null
          escolaridade?: string | null
          guru_product_id_8_questoes?: string | null
          guru_product_id_planejador?: string | null
          guru_product_id_plataforma_completa?: string | null
          guru_product_id_reta_final?: string | null
          guru_product_id_simulados?: string | null
          icone?: string | null
          id?: string
          imagem_capa?: string | null
          inscricoes_fim?: string | null
          inscricoes_inicio?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          modalidade?: string | null
          montagem_status?: string | null
          n8n_error_message?: string | null
          n8n_processed_at?: string | null
          n8n_status?: string | null
          nivel?: string | null
          nome: string
          ordem?: number | null
          orgao?: string | null
          preco?: number | null
          preco_8_questoes?: number | null
          preco_8_questoes_desconto?: number | null
          preco_desconto?: number | null
          preco_planejador?: number | null
          preco_planejador_desconto?: number | null
          preco_plataforma_completa?: number | null
          preco_plataforma_completa_desconto?: number | null
          preco_reta_final?: number | null
          preco_reta_final_desconto?: number | null
          preco_simulados?: number | null
          preco_simulados_desconto?: number | null
          question_filters?: Json | null
          raio_x?: Json | null
          regiao?: string | null
          requisitos?: string | null
          reta_final_disponivel?: boolean | null
          salario?: number | null
          slug: string
          taxa_inscricao?: number | null
          updated_at?: string | null
          vagas?: number | null
        }
        Update: {
          ano_previsto?: number | null
          areas_conhecimento?: string[] | null
          banca?: string | null
          carga_horaria?: string | null
          cargo?: string | null
          checkout_ouse_questoes?: string | null
          checkout_planejador?: string | null
          checkout_plataforma_completa?: string | null
          checkout_reta_final?: string | null
          checkout_simulados?: string | null
          checkout_url?: string | null
          content_types?: string[] | null
          cor?: string | null
          created_at?: string | null
          data_prevista?: string | null
          data_prova?: string | null
          descricao?: string | null
          descricao_curta?: string | null
          descricao_vendas?: string | null
          dias_reta_final?: number | null
          edital_url?: string | null
          escolaridade?: string | null
          guru_product_id_8_questoes?: string | null
          guru_product_id_planejador?: string | null
          guru_product_id_plataforma_completa?: string | null
          guru_product_id_reta_final?: string | null
          guru_product_id_simulados?: string | null
          icone?: string | null
          id?: string
          imagem_capa?: string | null
          inscricoes_fim?: string | null
          inscricoes_inicio?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          modalidade?: string | null
          montagem_status?: string | null
          n8n_error_message?: string | null
          n8n_processed_at?: string | null
          n8n_status?: string | null
          nivel?: string | null
          nome?: string
          ordem?: number | null
          orgao?: string | null
          preco?: number | null
          preco_8_questoes?: number | null
          preco_8_questoes_desconto?: number | null
          preco_desconto?: number | null
          preco_planejador?: number | null
          preco_planejador_desconto?: number | null
          preco_plataforma_completa?: number | null
          preco_plataforma_completa_desconto?: number | null
          preco_reta_final?: number | null
          preco_reta_final_desconto?: number | null
          preco_simulados?: number | null
          preco_simulados_desconto?: number | null
          question_filters?: Json | null
          raio_x?: Json | null
          regiao?: string | null
          requisitos?: string | null
          reta_final_disponivel?: boolean | null
          salario?: number | null
          slug?: string
          taxa_inscricao?: number | null
          updated_at?: string | null
          vagas?: number | null
        }
        Relationships: []
      }
      question_comments: {
        Row: {
          content: string
          created_at: string | null
          dislikes_count: number | null
          id: string
          is_deleted: boolean | null
          likes_count: number | null
          parent_id: string | null
          question_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          dislikes_count?: number | null
          id?: string
          is_deleted?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          question_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          dislikes_count?: number | null
          id?: string
          is_deleted?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          question_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "question_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      question_difficulty_ratings: {
        Row: {
          created_at: string | null
          difficulty: string
          id: string
          question_id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty: string
          id?: string
          question_id: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string
          id?: string
          question_id?: number
          user_id?: string | null
        }
        Relationships: []
      }
      question_reports: {
        Row: {
          admin_id: string | null
          admin_resposta: string | null
          created_at: string | null
          descricao: string | null
          id: string
          motivo: string
          question_ano: number | null
          question_assunto: string | null
          question_banca: string | null
          question_id: number
          question_materia: string | null
          resolved_at: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          admin_resposta?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          motivo: string
          question_ano?: number | null
          question_assunto?: string | null
          question_banca?: string | null
          question_id: number
          question_materia?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          admin_resposta?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          motivo?: string
          question_ano?: number | null
          question_assunto?: string | null
          question_banca?: string | null
          question_id?: number
          question_materia?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      question_user_answers: {
        Row: {
          created_at: string | null
          id: string
          is_correct: boolean
          question_id: number
          selected_alternative: string
          time_spent_seconds: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_correct: boolean
          question_id: number
          selected_alternative: string
          time_spent_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_correct?: boolean
          question_id?: number
          selected_alternative?: string
          time_spent_seconds?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      questoes_concurso: {
        Row: {
          alternativas: Json
          ano: number | null
          assunto: string | null
          banca: string | null
          cargo_area_especialidade_edicao: string | null
          comentario: string | null
          concurso: string | null
          created_at: string | null
          enunciado: string
          explicacao_pegadinha: string | null
          gabarito: string
          id: number
          imagens_comentario: string[] | null
          imagens_enunciado: string | null
          is_pegadinha: boolean | null
          materia: string
          orgao: string | null
          prova: string | null
          questao_revisada: string | null
          updated_at: string | null
        }
        Insert: {
          alternativas: Json
          ano?: number | null
          assunto?: string | null
          banca?: string | null
          cargo_area_especialidade_edicao?: string | null
          comentario?: string | null
          concurso?: string | null
          created_at?: string | null
          enunciado: string
          explicacao_pegadinha?: string | null
          gabarito: string
          id?: number
          imagens_comentario?: string[] | null
          imagens_enunciado?: string | null
          is_pegadinha?: boolean | null
          materia: string
          orgao?: string | null
          prova?: string | null
          questao_revisada?: string | null
          updated_at?: string | null
        }
        Update: {
          alternativas?: Json
          ano?: number | null
          assunto?: string | null
          banca?: string | null
          cargo_area_especialidade_edicao?: string | null
          comentario?: string | null
          concurso?: string | null
          created_at?: string | null
          enunciado?: string
          explicacao_pegadinha?: string | null
          gabarito?: string
          id?: number
          imagens_comentario?: string[] | null
          imagens_enunciado?: string | null
          is_pegadinha?: boolean | null
          materia?: string
          orgao?: string | null
          prova?: string | null
          questao_revisada?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      referral_redemptions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          points_spent: number
          reward_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points_spent: number
          reward_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points_spent?: number
          reward_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "referral_reward_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_reward_catalog: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          points_required: number
          reward_value: Json
          sort_order: number | null
          type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_required: number
          reward_value: Json
          sort_order?: number | null
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_required?: number
          reward_value?: Json
          sort_order?: number | null
          type?: string
        }
        Relationships: []
      }
      referral_tracking: {
        Row: {
          converted_at: string | null
          converted_user_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          landing_page: string | null
          referrer_username: string
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          converted_at?: string | null
          converted_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          landing_page?: string | null
          referrer_username: string
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          converted_at?: string | null
          converted_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          landing_page?: string | null
          referrer_username?: string
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          points_earned: number | null
          referred_at: string | null
          referred_id: string
          referrer_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          points_earned?: number | null
          referred_at?: string | null
          referred_id: string
          referrer_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          points_earned?: number | null
          referred_at?: string | null
          referred_id?: string
          referrer_id?: string
          status?: string | null
        }
        Relationships: []
      }
      revision_pool: {
        Row: {
          added_at: string | null
          id: string
          materia_id: string
          trail_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          materia_id: string
          trail_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          materia_id?: string
          trail_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_pool_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "preparatorio_materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_pool_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "vw_materias_com_topicos_disponiveis"
            referencedColumns: ["materia_id"]
          },
          {
            foreignKeyName: "revision_pool_trail_id_fkey"
            columns: ["trail_id"]
            isOneToOne: false
            referencedRelation: "user_trails"
            referencedColumns: ["id"]
          },
        ]
      }
      rodadas: {
        Row: {
          created_at: string | null
          id: string
          nota: string | null
          numero: number
          ordem: number | null
          preparatorio_id: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nota?: string | null
          numero: number
          ordem?: number | null
          preparatorio_id: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nota?: string | null
          numero?: number
          ordem?: number | null
          preparatorio_id?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rodadas_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            isOneToOne: false
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      round_robin_state: {
        Row: {
          id: string
          preparatorio_id: string | null
          ultimo_vendedor_id: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          preparatorio_id?: string | null
          ultimo_vendedor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          preparatorio_id?: string | null
          ultimo_vendedor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "round_robin_state_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            isOneToOne: true
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_robin_state_ultimo_vendedor_id_fkey"
            columns: ["ultimo_vendedor_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      simulado_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          current_index: number | null
          id: string
          question_ids: Json
          simulado_id: string
          started_at: string | null
          status: string | null
          time_remaining_seconds: number | null
          user_id: string
          variation_index: number
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_index?: number | null
          id?: string
          question_ids: Json
          simulado_id: string
          started_at?: string | null
          status?: string | null
          time_remaining_seconds?: number | null
          user_id: string
          variation_index?: number
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_index?: number | null
          id?: string
          question_ids?: Json
          simulado_id?: string
          started_at?: string | null
          status?: string | null
          time_remaining_seconds?: number | null
          user_id?: string
          variation_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulado_attempts_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
        ]
      }
      simulado_results: {
        Row: {
          answers: Json | null
          completed_at: string | null
          id: string
          ranking_position: number | null
          score: number | null
          simulado_id: string
          tempo_gasto: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          ranking_position?: number | null
          score?: number | null
          simulado_id: string
          tempo_gasto?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          ranking_position?: number | null
          score?: number | null
          simulado_id?: string
          tempo_gasto?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulado_results_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
        ]
      }
      simulado_variations: {
        Row: {
          generated_at: string | null
          id: string
          question_ids: number[]
          simulado_id: string
          variation_index: number
        }
        Insert: {
          generated_at?: string | null
          id?: string
          question_ids: number[]
          simulado_id: string
          variation_index: number
        }
        Update: {
          generated_at?: string | null
          id?: string
          question_ids?: number[]
          simulado_id?: string
          variation_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulado_variations_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
        ]
      }
      simulados: {
        Row: {
          created_at: string | null
          duracao_minutos: number | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          nome: string
          preco: number | null
          preparatorio_id: string | null
          quantidade_simulados: number | null
          total_questoes: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duracao_minutos?: number | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          nome: string
          preco?: number | null
          preparatorio_id?: string | null
          quantidade_simulados?: number | null
          total_questoes?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duracao_minutos?: number | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          nome?: string
          preco?: number | null
          preparatorio_id?: string | null
          quantidade_simulados?: number | null
          total_questoes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulados_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            isOneToOne: false
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      store_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      store_items: {
        Row: {
          available_from: string | null
          available_until: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          external_url: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          item_type: string
          max_purchases: number | null
          metadata: Json | null
          name: string
          preparatorio_id: string | null
          price_coins: number
          price_real: number | null
          product_type: string | null
          required_achievement_id: string | null
          required_level: number | null
          stock: number | null
          tags: string[] | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          external_url?: string | null
          icon?: string | null
          id: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          item_type: string
          max_purchases?: number | null
          metadata?: Json | null
          name: string
          preparatorio_id?: string | null
          price_coins?: number
          price_real?: number | null
          product_type?: string | null
          required_achievement_id?: string | null
          required_level?: number | null
          stock?: number | null
          tags?: string[] | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          external_url?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          item_type?: string
          max_purchases?: number | null
          metadata?: Json | null
          name?: string
          preparatorio_id?: string | null
          price_coins?: number
          price_real?: number | null
          product_type?: string | null
          required_achievement_id?: string | null
          required_level?: number | null
          stock?: number | null
          tags?: string[] | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_items_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            isOneToOne: false
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      store_purchases: {
        Row: {
          completed_at: string | null
          created_at: string | null
          currency: string | null
          id: string
          item_id: string
          metadata: Json | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          price_paid: number | null
          quantity: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          item_id: string
          metadata?: Json | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          price_paid?: number | null
          quantity?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          item_id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          price_paid?: number | null
          quantity?: number | null
          user_id?: string
        }
        Relationships: []
      }
      streak_rewards: {
        Row: {
          badge_id: string | null
          coins_reward: number
          created_at: string | null
          days_required: number
          icon: string | null
          id: number
          is_active: boolean
          notification_message: string | null
          special_reward_id: string | null
          special_reward_type: string | null
          xp_reward: number
        }
        Insert: {
          badge_id?: string | null
          coins_reward?: number
          created_at?: string | null
          days_required: number
          icon?: string | null
          id?: number
          is_active?: boolean
          notification_message?: string | null
          special_reward_id?: string | null
          special_reward_type?: string | null
          xp_reward?: number
        }
        Update: {
          badge_id?: string | null
          coins_reward?: number
          created_at?: string | null
          days_required?: number
          icon?: string | null
          id?: number
          is_active?: boolean
          notification_message?: string | null
          special_reward_id?: string | null
          special_reward_type?: string | null
          xp_reward?: number
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          coins_earned: number | null
          correct_answers: number | null
          course_id: string | null
          finished_at: string | null
          id: string
          started_at: string | null
          study_mode: string
          time_limit: number | null
          total_questions: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          coins_earned?: number | null
          correct_answers?: number | null
          course_id?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          study_mode: string
          time_limit?: number | null
          total_questions?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          coins_earned?: number | null
          correct_answers?: number | null
          course_id?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          study_mode?: string
          time_limit?: number | null
          total_questions?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          anexos: Json | null
          created_at: string | null
          id: string
          mensagem: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          anexos?: Json | null
          created_at?: string | null
          id?: string
          mensagem: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          anexos?: Json | null
          created_at?: string | null
          id?: string
          mensagem?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          admin_id: string | null
          admin_resposta: string | null
          anexos: Json | null
          created_at: string | null
          id: string
          mensagem: string
          motivo: string
          motivo_outro: string | null
          prioridade: string
          resolved_at: string | null
          status: string
          updated_at: string | null
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          admin_id?: string | null
          admin_resposta?: string | null
          anexos?: Json | null
          created_at?: string | null
          id?: string
          mensagem: string
          motivo: string
          motivo_outro?: string | null
          prioridade?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string | null
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          admin_id?: string | null
          admin_resposta?: string | null
          anexos?: Json | null
          created_at?: string | null
          id?: string
          mensagem?: string
          motivo?: string
          motivo_outro?: string | null
          prioridade?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      trail_missions: {
        Row: {
          assunto_id: string | null
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          id: string
          massificacao_de: string | null
          materia_id: string
          ordem: number
          questoes_ids: string[] | null
          round_id: string
          score: number | null
          status: string | null
          tentativa_massificacao: number | null
          tipo: string | null
        }
        Insert: {
          assunto_id?: string | null
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          massificacao_de?: string | null
          materia_id: string
          ordem: number
          questoes_ids?: string[] | null
          round_id: string
          score?: number | null
          status?: string | null
          tentativa_massificacao?: number | null
          tipo?: string | null
        }
        Update: {
          assunto_id?: string | null
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          massificacao_de?: string | null
          materia_id?: string
          ordem?: number
          questoes_ids?: string[] | null
          round_id?: string
          score?: number | null
          status?: string | null
          tentativa_massificacao?: number | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trail_missions_assunto_id_fkey"
            columns: ["assunto_id"]
            isOneToOne: false
            referencedRelation: "assuntos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trail_missions_massificacao_de_fkey"
            columns: ["massificacao_de"]
            isOneToOne: false
            referencedRelation: "trail_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trail_missions_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "preparatorio_materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trail_missions_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "vw_materias_com_topicos_disponiveis"
            referencedColumns: ["materia_id"]
          },
          {
            foreignKeyName: "trail_missions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "trail_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      trail_rounds: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          round_number: number
          status: string | null
          tipo: string | null
          trail_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          round_number: number
          status?: string | null
          tipo?: string | null
          trail_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          round_number?: number
          status?: string | null
          tipo?: string | null
          trail_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trail_rounds_trail_id_fkey"
            columns: ["trail_id"]
            isOneToOne: false
            referencedRelation: "user_trails"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_answers: {
        Row: {
          answered_at: string | null
          correct_letter: string
          id: string
          is_correct: boolean
          question_id: number
          selected_letter: string
          session_id: string | null
          study_mode: string | null
          time_taken: number | null
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          correct_letter: string
          id?: string
          is_correct: boolean
          question_id: number
          selected_letter: string
          session_id?: string | null
          study_mode?: string | null
          time_taken?: number | null
          user_id: string
        }
        Update: {
          answered_at?: string | null
          correct_letter?: string
          id?: string
          is_correct?: boolean
          question_id?: number
          selected_letter?: string
          session_id?: string | null
          study_mode?: string | null
          time_taken?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_boosts: {
        Row: {
          boost_type: string
          boost_value: number | null
          created_at: string | null
          expires_at: string
          id: string
          source: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          boost_type: string
          boost_value?: number | null
          created_at?: string | null
          expires_at: string
          id?: string
          source?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          boost_type?: string
          boost_value?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          source?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_courses: {
        Row: {
          course_id: string
          id: string
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          id?: string
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          id?: string
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_flashcards: {
        Row: {
          assunto: string | null
          back: string
          created_at: string | null
          front: string
          id: string
          mastery_level: string | null
          materia: string | null
          next_review_date: string | null
          question_id: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assunto?: string | null
          back: string
          created_at?: string | null
          front: string
          id?: string
          mastery_level?: string | null
          materia?: string | null
          next_review_date?: string | null
          question_id?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assunto?: string | null
          back?: string
          created_at?: string | null
          front?: string
          id?: string
          mastery_level?: string | null
          materia?: string | null
          next_review_date?: string | null
          question_id?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          id: string
          is_equipped: boolean | null
          item_id: string
          item_type: string
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_equipped?: boolean | null
          item_id: string
          item_type: string
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_equipped?: boolean | null
          item_id?: string
          item_type?: string
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_missao_progress: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          id: string
          last_attempt_at: string | null
          massificacao_attempts: number | null
          missao_id: string
          questoes_ids: string[] | null
          score: number | null
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          massificacao_attempts?: number | null
          missao_id: string
          questoes_ids?: string[] | null
          score?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          massificacao_attempts?: number | null
          missao_id?: string
          questoes_ids?: string[] | null
          score?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missao_progress_missao_id_fkey"
            columns: ["missao_id"]
            isOneToOne: false
            referencedRelation: "missoes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          completed_at: string | null
          concurso_alvo: string | null
          created_at: string | null
          id: string
          materias_dominadas: string[] | null
          meta_diaria: number | null
          nivel_conhecimento: string | null
          objetivo: string | null
          onboarding_step: string | null
          schedule: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          concurso_alvo?: string | null
          created_at?: string | null
          id?: string
          materias_dominadas?: string[] | null
          meta_diaria?: number | null
          nivel_conhecimento?: string | null
          objetivo?: string | null
          onboarding_step?: string | null
          schedule?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          concurso_alvo?: string | null
          created_at?: string | null
          id?: string
          materias_dominadas?: string[] | null
          meta_diaria?: number | null
          nivel_conhecimento?: string | null
          objetivo?: string | null
          onboarding_step?: string | null
          schedule?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_products: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          guru_product_id: string | null
          guru_subscription_id: string | null
          guru_transaction_id: string | null
          id: string
          metadata: Json | null
          preparatorio_id: string
          product_type: Database["public"]["Enums"]["product_type"]
          revoked_at: string | null
          status: Database["public"]["Enums"]["product_access_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          guru_product_id?: string | null
          guru_subscription_id?: string | null
          guru_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          preparatorio_id: string
          product_type: Database["public"]["Enums"]["product_type"]
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["product_access_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          guru_product_id?: string | null
          guru_subscription_id?: string | null
          guru_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          preparatorio_id?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["product_access_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_products_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            isOneToOne: false
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_id: string | null
          avatar_url: string | null
          coins: number | null
          correct_answers: number | null
          created_at: string | null
          email: string | null
          id: string
          last_practice_date: string | null
          league_tier: string | null
          level: number | null
          main_preparatorio_id: string | null
          name: string | null
          phone: string | null
          referral_points: number | null
          role: string | null
          show_answers: boolean | null
          streak: number | null
          total_answered: number | null
          total_commissions: number | null
          total_referrals: number | null
          updated_at: string | null
          username: string | null
          xp: number | null
        }
        Insert: {
          avatar_id?: string | null
          avatar_url?: string | null
          coins?: number | null
          correct_answers?: number | null
          created_at?: string | null
          email?: string | null
          id: string
          last_practice_date?: string | null
          league_tier?: string | null
          level?: number | null
          main_preparatorio_id?: string | null
          name?: string | null
          phone?: string | null
          referral_points?: number | null
          role?: string | null
          show_answers?: boolean | null
          streak?: number | null
          total_answered?: number | null
          total_commissions?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          username?: string | null
          xp?: number | null
        }
        Update: {
          avatar_id?: string | null
          avatar_url?: string | null
          coins?: number | null
          correct_answers?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_practice_date?: string | null
          league_tier?: string | null
          level?: number | null
          main_preparatorio_id?: string | null
          name?: string | null
          phone?: string | null
          referral_points?: number | null
          role?: string | null
          show_answers?: boolean | null
          streak?: number | null
          total_answered?: number | null
          total_commissions?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          username?: string | null
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_main_preparatorio_id_fkey"
            columns: ["main_preparatorio_id"]
            isOneToOne: false
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reviews: {
        Row: {
          created_at: string | null
          ease_factor: number | null
          id: string
          interval_days: number | null
          last_difficulty: string | null
          next_review_date: string
          question_id: number
          repetitions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          last_difficulty?: string | null
          next_review_date: string
          question_id: number
          repetitions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          last_difficulty?: string | null
          next_review_date?: string
          question_id?: number
          repetitions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_trails: {
        Row: {
          battery_current: number | null
          battery_last_recharge: string | null
          bonus_battery: number | null
          created_at: string | null
          current_mode: string | null
          current_round: number | null
          data_prova: string | null
          has_normal_access: boolean | null
          has_reta_final_access: boolean | null
          has_unlimited_battery: boolean | null
          id: string
          is_reta_final: boolean | null
          nivel_usuario: string | null
          preparatorio_id: string
          questoes_por_missao: number | null
          reta_final_started_at: string | null
          slot_a_materia_id: string | null
          slot_b_materia_id: string | null
          unlimited_battery_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          battery_current?: number | null
          battery_last_recharge?: string | null
          bonus_battery?: number | null
          created_at?: string | null
          current_mode?: string | null
          current_round?: number | null
          data_prova?: string | null
          has_normal_access?: boolean | null
          has_reta_final_access?: boolean | null
          has_unlimited_battery?: boolean | null
          id?: string
          is_reta_final?: boolean | null
          nivel_usuario?: string | null
          preparatorio_id: string
          questoes_por_missao?: number | null
          reta_final_started_at?: string | null
          slot_a_materia_id?: string | null
          slot_b_materia_id?: string | null
          unlimited_battery_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          battery_current?: number | null
          battery_last_recharge?: string | null
          bonus_battery?: number | null
          created_at?: string | null
          current_mode?: string | null
          current_round?: number | null
          data_prova?: string | null
          has_normal_access?: boolean | null
          has_reta_final_access?: boolean | null
          has_unlimited_battery?: boolean | null
          id?: string
          is_reta_final?: boolean | null
          nivel_usuario?: string | null
          preparatorio_id?: string
          questoes_por_missao?: number | null
          reta_final_started_at?: string | null
          slot_a_materia_id?: string | null
          slot_b_materia_id?: string | null
          unlimited_battery_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_trails_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            isOneToOne: false
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_trails_slot_a_materia_id_fkey"
            columns: ["slot_a_materia_id"]
            isOneToOne: false
            referencedRelation: "preparatorio_materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_trails_slot_a_materia_id_fkey"
            columns: ["slot_a_materia_id"]
            isOneToOne: false
            referencedRelation: "vw_materias_com_topicos_disponiveis"
            referencedColumns: ["materia_id"]
          },
          {
            foreignKeyName: "user_trails_slot_b_materia_id_fkey"
            columns: ["slot_b_materia_id"]
            isOneToOne: false
            referencedRelation: "preparatorio_materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_trails_slot_b_materia_id_fkey"
            columns: ["slot_b_materia_id"]
            isOneToOne: false
            referencedRelation: "vw_materias_com_topicos_disponiveis"
            referencedColumns: ["materia_id"]
          },
        ]
      }
      vendedor_schedules: {
        Row: {
          created_at: string | null
          dia_semana: number
          id: string
          is_active: boolean | null
          manha_fim: string | null
          manha_inicio: string | null
          tarde_fim: string | null
          tarde_inicio: string | null
          updated_at: string | null
          vendedor_id: string
        }
        Insert: {
          created_at?: string | null
          dia_semana: number
          id?: string
          is_active?: boolean | null
          manha_fim?: string | null
          manha_inicio?: string | null
          tarde_fim?: string | null
          tarde_inicio?: string | null
          updated_at?: string | null
          vendedor_id: string
        }
        Update: {
          created_at?: string | null
          dia_semana?: number
          id?: string
          is_active?: boolean | null
          manha_fim?: string | null
          manha_inicio?: string | null
          tarde_fim?: string | null
          tarde_inicio?: string | null
          updated_at?: string | null
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendedor_schedules_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_xp: {
        Row: {
          correct_answers: number | null
          created_at: string | null
          id: string
          questions_answered: number | null
          updated_at: string | null
          user_id: string
          week_start: string
          xp_earned: number | null
        }
        Insert: {
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          questions_answered?: number | null
          updated_at?: string | null
          user_id: string
          week_start: string
          xp_earned?: number | null
        }
        Update: {
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          questions_answered?: number | null
          updated_at?: string | null
          user_id?: string
          week_start?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      writer_virtual_articles: {
        Row: {
          content: string | null
          generated_at: string | null
          id: string
          keywords: string[] | null
          status: string | null
          title: string | null
          topic: string | null
          updated_at: string | null
          writer_id: string | null
        }
        Insert: {
          content?: string | null
          generated_at?: string | null
          id?: string
          keywords?: string[] | null
          status?: string | null
          title?: string | null
          topic?: string | null
          updated_at?: string | null
          writer_id?: string | null
        }
        Update: {
          content?: string | null
          generated_at?: string | null
          id?: string
          keywords?: string[] | null
          status?: string | null
          title?: string | null
          topic?: string | null
          updated_at?: string | null
          writer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "writer_virtual_articles_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "writer_virtual_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      writer_virtual_history: {
        Row: {
          action: string | null
          article_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          writer_id: string | null
        }
        Insert: {
          action?: string | null
          article_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          writer_id?: string | null
        }
        Update: {
          action?: string | null
          article_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          writer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "writer_virtual_history_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "writer_virtual_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "writer_virtual_history_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "writer_virtual_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      writer_virtual_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          prompt_base: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          prompt_base?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          prompt_base?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      writers_history: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          id: string
          writer_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          writer_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          writer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "writers_history_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "writers_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      writers_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          linkedin_url: string | null
          name: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          name: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          linkedin_url?: string | null
          name?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      writers_prompts: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          name: string
          prompt: string
          updated_at: string | null
          writer_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          prompt: string
          updated_at?: string | null
          writer_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          prompt?: string
          updated_at?: string | null
          writer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "writers_prompts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "writers_prompts_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: false
            referencedRelation: "writers_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      writers_settings: {
        Row: {
          created_at: string | null
          frequency_penalty: number | null
          id: string
          max_tokens: number | null
          presence_penalty: number | null
          temperature: number | null
          updated_at: string | null
          writer_id: string | null
        }
        Insert: {
          created_at?: string | null
          frequency_penalty?: number | null
          id?: string
          max_tokens?: number | null
          presence_penalty?: number | null
          temperature?: number | null
          updated_at?: string | null
          writer_id?: string | null
        }
        Update: {
          created_at?: string | null
          frequency_penalty?: number | null
          id?: string
          max_tokens?: number | null
          presence_penalty?: number | null
          temperature?: number | null
          updated_at?: string | null
          writer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "writers_settings_writer_id_fkey"
            columns: ["writer_id"]
            isOneToOne: true
            referencedRelation: "writers_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_actions: {
        Row: {
          coins_reward: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          multiplier_enabled: boolean | null
          multiplier_value: number | null
          name: string
          requires_correct_answer: boolean | null
          study_mode: string | null
          updated_at: string | null
          xp_reward: number
        }
        Insert: {
          coins_reward?: number
          created_at?: string | null
          description?: string | null
          id: string
          is_active?: boolean
          multiplier_enabled?: boolean | null
          multiplier_value?: number | null
          name: string
          requires_correct_answer?: boolean | null
          study_mode?: string | null
          updated_at?: string | null
          xp_reward?: number
        }
        Update: {
          coins_reward?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          multiplier_enabled?: boolean | null
          multiplier_value?: number | null
          name?: string
          requires_correct_answer?: boolean | null
          study_mode?: string | null
          updated_at?: string | null
          xp_reward?: number
        }
        Relationships: []
      }
    }
    Views: {
      vw_materias_com_topicos_disponiveis: {
        Row: {
          materia_id: string | null
          materia_nome: string | null
          ordem: number | null
          preparatorio_id: string | null
          topicos_disponiveis: number | null
          total_topicos: number | null
        }
        Relationships: [
          {
            foreignKeyName: "preparatorio_materias_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            isOneToOne: false
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_bonus_battery: {
        Args: { p_amount: number; p_preparatorio_id: string; p_user_id: string }
        Returns: undefined
      }
      check_can_add_preparatorio: { Args: { p_user_id: string }; Returns: Json }
      check_unlimited_battery_expired: {
        Args: { p_expires_at: string; p_has_unlimited: boolean }
        Returns: boolean
      }
      check_user_product_access: {
        Args: {
          p_preparatorio_id: string
          p_product_type: Database["public"]["Enums"]["product_type"]
          p_user_id: string
        }
        Returns: boolean
      }
      check_valid_content_types: { Args: { types: string[] }; Returns: boolean }
      confirm_referral: { Args: { p_referred_id: string }; Returns: boolean }
      consume_battery: {
        Args: {
          p_action_type: string
          p_context?: Json
          p_preparatorio_id: string
          p_user_id: string
        }
        Returns: Json
      }
      create_affiliate_commission: {
        Args: {
          p_referred_id: string
          p_sale_amount: number
          p_transaction_id?: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_description: string
          p_icon?: string
          p_link?: string
          p_title: string
          p_trigger_type?: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_referral: {
        Args: { p_referred_id: string; p_referrer_username: string }
        Returns: string
      }
      find_preparatorio_by_guru_product: {
        Args: { p_guru_product_id: string }
        Returns: {
          preparatorio_id: string
          product_type: Database["public"]["Enums"]["product_type"]
        }[]
      }
      generate_username: {
        Args: { p_name: string; p_user_id: string }
        Returns: string
      }
      get_battery_settings: { Args: never; Returns: Json }
      get_league_ranking: {
        Args: { p_league_tier: string; p_limit?: number }
        Returns: {
          avatar_url: string
          league_tier: string
          name: string
          rank: number
          user_id: string
          xp_earned: number
        }[]
      }
      get_missoes_count_por_materia: {
        Args: { p_rodada_id: string }
        Returns: {
          count: number
          materia_id: string
        }[]
      }
      get_topicos_usados: {
        Args: { p_preparatorio_id: string }
        Returns: string[]
      }
      get_user_battery_status: {
        Args: { p_preparatorio_id: string; p_user_id: string }
        Returns: Json
      }
      get_user_notifications: {
        Args: { p_include_read?: boolean; p_limit?: number; p_user_id: string }
        Returns: {
          created_at: string
          description: string
          icon: string
          id: string
          link: string
          read: boolean
          time_ago: string
          title: string
          type: string
        }[]
      }
      get_week_start: { Args: { d?: string }; Returns: string }
      grant_product_access: {
        Args: {
          p_expires_at?: string
          p_guru_product_id?: string
          p_guru_subscription_id?: string
          p_guru_transaction_id?: string
          p_preparatorio_id: string
          p_product_type: Database["public"]["Enums"]["product_type"]
          p_user_id: string
        }
        Returns: string
      }
      grant_unlimited_battery:
        | {
            Args: {
              p_duration_days?: number
              p_preparatorio_id: string
              p_user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_expires_at?: string
              p_preparatorio_id: string
              p_user_id: string
            }
            Returns: Json
          }
      increment_user_stats: {
        Args: {
          p_coins?: number
          p_correct_answers?: number
          p_total_answered?: number
          p_user_id: string
          p_xp?: number
        }
        Returns: undefined
      }
      increment_weekly_xp: {
        Args: {
          p_correct?: number
          p_questions?: number
          p_user_id: string
          p_week_start: string
          p_xp: number
        }
        Returns: undefined
      }
      is_ead_admin: { Args: never; Returns: boolean }
      is_notebook_owner: {
        Args: { notebook_id_param: string }
        Returns: boolean
      }
      is_notebook_owner_for_document: {
        Args: { doc_metadata: Json }
        Returns: boolean
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      recharge_all_batteries: { Args: never; Returns: number }
      revoke_product_access: {
        Args: {
          p_preparatorio_id: string
          p_product_type: Database["public"]["Enums"]["product_type"]
          p_reason?: Database["public"]["Enums"]["product_access_status"]
          p_user_id: string
        }
        Returns: boolean
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      edital_item_type: "bloco" | "materia" | "topico"
      education_level:
        | "fundamental_incompleto"
        | "fundamental_completo"
        | "medio_incompleto"
        | "medio_completo"
        | "superior_incompleto"
        | "superior_completo"
        | "pos_graduacao"
        | "mestrado"
        | "doutorado"
      lead_difficulty:
        | "tempo"
        | "nao_saber_por_onde_comecar"
        | "organizacao"
        | "falta_de_material"
        | "outros"
      lead_gender: "masculino" | "feminino" | "outro" | "prefiro_nao_dizer"
      missao_tipo:
        | "padrao"
        | "revisao"
        | "acao"
        | "estudo"
        | "tecnicas"
        | "simulado"
      product_access_status:
        | "active"
        | "canceled"
        | "refunded"
        | "chargeback"
        | "expired"
        | "pending"
      product_type:
        | "planejador"
        | "8_questoes"
        | "simulados"
        | "reta_final"
        | "plataforma_completa"
      user_role: "admin" | "vendedor" | "cliente"
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
      edital_item_type: ["bloco", "materia", "topico"],
      education_level: [
        "fundamental_incompleto",
        "fundamental_completo",
        "medio_incompleto",
        "medio_completo",
        "superior_incompleto",
        "superior_completo",
        "pos_graduacao",
        "mestrado",
        "doutorado",
      ],
      lead_difficulty: [
        "tempo",
        "nao_saber_por_onde_comecar",
        "organizacao",
        "falta_de_material",
        "outros",
      ],
      lead_gender: ["masculino", "feminino", "outro", "prefiro_nao_dizer"],
      missao_tipo: [
        "padrao",
        "revisao",
        "acao",
        "estudo",
        "tecnicas",
        "simulado",
      ],
      product_access_status: [
        "active",
        "canceled",
        "refunded",
        "chargeback",
        "expired",
        "pending",
      ],
      product_type: [
        "planejador",
        "8_questoes",
        "simulados",
        "reta_final",
        "plataforma_completa",
      ],
      user_role: ["admin", "vendedor", "cliente"],
    },
  },
} as const



// Custom type exports for backward compatibility
export type AdminUser = Database['public']['Tables']['admin_users']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];

