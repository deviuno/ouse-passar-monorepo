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
      system_settings: {
        Row: {
          id: string
          category: string
          key: string
          value: Json
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: string
          key: string
          value: Json
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: string
          key?: string
          value?: Json
          description?: string | null
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
          content_types: string[] | null
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
          content_types?: string[] | null
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
          content_types?: string[] | null
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
          hora_acordar: string | null
          hora_dormir: string | null
          principal_dificuldade: 'tempo' | 'nao_saber_por_onde_comecar' | 'organizacao' | 'falta_de_material' | 'outros' | null
          principais_dificuldades: ('tempo' | 'nao_saber_por_onde_comecar' | 'organizacao' | 'falta_de_material' | 'outros')[]
          dificuldade_outros: string | null
          vendedor_id: string | null
          planejamento_id: string | null
          agendamento_id: string | null
          user_id: string | null
          senha_temporaria: string | null
          avatar_url: string | null
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
          hora_acordar?: string | null
          hora_dormir?: string | null
          principal_dificuldade?: 'tempo' | 'nao_saber_por_onde_comecar' | 'organizacao' | 'falta_de_material' | 'outros' | null
          principais_dificuldades?: ('tempo' | 'nao_saber_por_onde_comecar' | 'organizacao' | 'falta_de_material' | 'outros')[]
          dificuldade_outros?: string | null
          vendedor_id?: string | null
          planejamento_id?: string | null
          agendamento_id?: string | null
          user_id?: string | null
          senha_temporaria?: string | null
          avatar_url?: string | null
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
          hora_acordar?: string | null
          hora_dormir?: string | null
          principal_dificuldade?: 'tempo' | 'nao_saber_por_onde_comecar' | 'organizacao' | 'falta_de_material' | 'outros' | null
          principais_dificuldades?: ('tempo' | 'nao_saber_por_onde_comecar' | 'organizacao' | 'falta_de_material' | 'outros')[]
          dificuldade_outros?: string | null
          vendedor_id?: string | null
          planejamento_id?: string | null
          agendamento_id?: string | null
          user_id?: string | null
          senha_temporaria?: string | null
          avatar_url?: string | null
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
          },
          {
            foreignKeyName: "leads_agendamento_id_fkey"
            columns: ["agendamento_id"]
            referencedRelation: "agendamentos"
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
          logo_url: string | null
          preco: number | null
          preco_desconto: number | null
          checkout_url: string | null
          descricao_curta: string | null
          descricao_vendas: string | null
          content_types: string[] | null
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
          logo_url?: string | null
          preco?: number | null
          preco_desconto?: number | null
          checkout_url?: string | null
          descricao_curta?: string | null
          descricao_vendas?: string | null
          content_types?: string[] | null
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
          logo_url?: string | null
          preco?: number | null
          preco_desconto?: number | null
          checkout_url?: string | null
          descricao_curta?: string | null
          descricao_vendas?: string | null
          content_types?: string[] | null
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
          lead_id: string | null
          nome_aluno: string
          email: string | null
          mensagem_incentivo: string | null
          hora_acordar: string | null
          hora_dormir: string | null
          created_at: string
        }
        Insert: {
          id?: string
          preparatorio_id: string
          lead_id?: string | null
          nome_aluno: string
          email?: string | null
          mensagem_incentivo?: string | null
          hora_acordar?: string | null
          hora_dormir?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          preparatorio_id?: string
          lead_id?: string | null
          nome_aluno?: string
          email?: string | null
          mensagem_incentivo?: string | null
          hora_acordar?: string | null
          hora_dormir?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planejamentos_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamentos_lead_id_fkey"
            columns: ["lead_id"]
            referencedRelation: "leads"
            referencedColumns: ["id"]
          }
        ]
      }
      atividade_tipos: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          cor: string
          icone: string | null
          is_default: boolean
          ordem: number
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          cor: string
          icone?: string | null
          is_default?: boolean
          ordem?: number
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          cor?: string
          icone?: string | null
          is_default?: boolean
          ordem?: number
          created_at?: string
        }
        Relationships: []
      }
      atividade_tipos_usuario: {
        Row: {
          id: string
          planejamento_id: string
          nome: string
          descricao: string | null
          cor: string
          icone: string | null
          ordem: number
          created_at: string
        }
        Insert: {
          id?: string
          planejamento_id: string
          nome: string
          descricao?: string | null
          cor: string
          icone?: string | null
          ordem?: number
          created_at?: string
        }
        Update: {
          id?: string
          planejamento_id?: string
          nome?: string
          descricao?: string | null
          cor?: string
          icone?: string | null
          ordem?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividade_tipos_usuario_planejamento_id_fkey"
            columns: ["planejamento_id"]
            referencedRelation: "planejamentos"
            referencedColumns: ["id"]
          }
        ]
      }
      planejador_semanal: {
        Row: {
          id: string
          planejamento_id: string
          dia_semana: number
          hora_inicio: string
          atividade_tipo_id: string | null
          atividade_usuario_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          planejamento_id: string
          dia_semana: number
          hora_inicio: string
          atividade_tipo_id?: string | null
          atividade_usuario_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          planejamento_id?: string
          dia_semana?: number
          hora_inicio?: string
          atividade_tipo_id?: string | null
          atividade_usuario_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planejador_semanal_planejamento_id_fkey"
            columns: ["planejamento_id"]
            referencedRelation: "planejamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejador_semanal_atividade_tipo_id_fkey"
            columns: ["atividade_tipo_id"]
            referencedRelation: "atividade_tipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejador_semanal_atividade_usuario_id_fkey"
            columns: ["atividade_usuario_id"]
            referencedRelation: "atividade_tipos_usuario"
            referencedColumns: ["id"]
          }
        ]
      }
      edital_verticalizado_items: {
        Row: {
          id: string
          preparatorio_id: string | null
          tipo: 'bloco' | 'materia' | 'topico'
          titulo: string
          ordem: number
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          preparatorio_id?: string | null
          tipo: 'bloco' | 'materia' | 'topico'
          titulo: string
          ordem: number
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          preparatorio_id?: string | null
          tipo?: 'bloco' | 'materia' | 'topico'
          titulo?: string
          ordem?: number
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "edital_verticalizado_items_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edital_verticalizado_items_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "edital_verticalizado_items"
            referencedColumns: ["id"]
          }
        ]
      }
      edital_verticalizado_progress: {
        Row: {
          id: string
          planejamento_id: string | null
          item_id: string | null
          missao: boolean
          acao: boolean
          revisao: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          planejamento_id?: string | null
          item_id?: string | null
          missao?: boolean
          acao?: boolean
          revisao?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          planejamento_id?: string | null
          item_id?: string | null
          missao?: boolean
          acao?: boolean
          revisao?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "edital_verticalizado_progress_planejamento_id_fkey"
            columns: ["planejamento_id"]
            referencedRelation: "planejamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edital_verticalizado_progress_item_id_fkey"
            columns: ["item_id"]
            referencedRelation: "edital_verticalizado_items"
            referencedColumns: ["id"]
          }
        ]
      }
      missoes_executadas: {
        Row: {
          id: string
          user_id: string
          planejamento_id: string
          rodada_numero: number
          missao_numero: number
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          planejamento_id: string
          rodada_numero: number
          missao_numero: number
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          planejamento_id?: string
          rodada_numero?: number
          missao_numero?: number
          completed_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missoes_executadas_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missoes_executadas_planejamento_id_fkey"
            columns: ["planejamento_id"]
            referencedRelation: "planejamentos"
            referencedColumns: ["id"]
          }
        ]
      }
      vendedor_schedules: {
        Row: {
          id: string
          vendedor_id: string
          dia_semana: number
          is_active: boolean
          manha_inicio: string | null
          manha_fim: string | null
          tarde_inicio: string | null
          tarde_fim: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendedor_id: string
          dia_semana: number
          is_active?: boolean
          manha_inicio?: string | null
          manha_fim?: string | null
          tarde_inicio?: string | null
          tarde_fim?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendedor_id?: string
          dia_semana?: number
          is_active?: boolean
          manha_inicio?: string | null
          manha_fim?: string | null
          tarde_inicio?: string | null
          tarde_fim?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendedor_schedules_vendedor_id_fkey"
            columns: ["vendedor_id"]
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      agendamentos: {
        Row: {
          id: string
          lead_id: string
          vendedor_id: string
          preparatorio_id: string
          data_hora: string
          duracao_minutos: number
          status: 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'nao_compareceu'
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          vendedor_id: string
          preparatorio_id: string
          data_hora: string
          duracao_minutos?: number
          status?: 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'nao_compareceu'
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          vendedor_id?: string
          preparatorio_id?: string
          data_hora?: string
          duracao_minutos?: number
          status?: 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'nao_compareceu'
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_lead_id_fkey"
            columns: ["lead_id"]
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          }
        ]
      }
      round_robin_state: {
        Row: {
          id: string
          preparatorio_id: string | null
          ultimo_vendedor_id: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          preparatorio_id?: string | null
          ultimo_vendedor_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          preparatorio_id?: string | null
          ultimo_vendedor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_robin_state_preparatorio_id_fkey"
            columns: ["preparatorio_id"]
            referencedRelation: "preparatorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_robin_state_ultimo_vendedor_id_fkey"
            columns: ["ultimo_vendedor_id"]
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      planner_diario: {
        Row: {
          id: string
          planejamento_id: string
          data: string
          humor: number | null
          energia: number | null
          horas_planejadas: number
          horas_estudadas: number
          missoes_concluidas: number
          questoes_feitas: number
          percentual_acertos: number | null
          materia_principal: string | null
          fez_revisao: boolean
          usou_tecnica_estudo: boolean
          exercicio_fisico: boolean
          litros_agua: number | null
          horas_sono: number | null
          sem_celular_antes: boolean
          revisao_rapida: boolean
          registrou_erro: boolean
          oracao_devocional: boolean
          gratidao: string | null
          motivacao_dia: string | null
          semaforo: 'verde' | 'amarelo' | 'vermelho' | null
          semaforo_motivo: string | null
          meta_minima_amanha: number | null
          missao_prioritaria_amanha: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          planejamento_id: string
          data: string
          humor?: number | null
          energia?: number | null
          horas_planejadas?: number
          horas_estudadas?: number
          missoes_concluidas?: number
          questoes_feitas?: number
          percentual_acertos?: number | null
          materia_principal?: string | null
          fez_revisao?: boolean
          usou_tecnica_estudo?: boolean
          exercicio_fisico?: boolean
          litros_agua?: number | null
          horas_sono?: number | null
          sem_celular_antes?: boolean
          revisao_rapida?: boolean
          registrou_erro?: boolean
          oracao_devocional?: boolean
          gratidao?: string | null
          motivacao_dia?: string | null
          semaforo?: 'verde' | 'amarelo' | 'vermelho' | null
          semaforo_motivo?: string | null
          meta_minima_amanha?: number | null
          missao_prioritaria_amanha?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          planejamento_id?: string
          data?: string
          humor?: number | null
          energia?: number | null
          horas_planejadas?: number
          horas_estudadas?: number
          missoes_concluidas?: number
          questoes_feitas?: number
          percentual_acertos?: number | null
          materia_principal?: string | null
          fez_revisao?: boolean
          usou_tecnica_estudo?: boolean
          exercicio_fisico?: boolean
          litros_agua?: number | null
          horas_sono?: number | null
          sem_celular_antes?: boolean
          revisao_rapida?: boolean
          registrou_erro?: boolean
          oracao_devocional?: boolean
          gratidao?: string | null
          motivacao_dia?: string | null
          semaforo?: 'verde' | 'amarelo' | 'vermelho' | null
          semaforo_motivo?: string | null
          meta_minima_amanha?: number | null
          missao_prioritaria_amanha?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planner_diario_planejamento_id_fkey"
            columns: ["planejamento_id"]
            referencedRelation: "planejamentos"
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
      agendamento_status: 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'nao_compareceu'
      edital_item_type: 'bloco' | 'materia' | 'topico'
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

export type UserGender = 'masculino' | 'feminino'

export interface AdminUser {
  id: string
  email: string
  password_hash: string
  name: string
  role: UserRole
  is_active: boolean
  avatar_url: string | null
  genero?: UserGender | null
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
  hora_acordar: string | null
  hora_dormir: string | null
  principal_dificuldade: LeadDifficulty | null
  principais_dificuldades: LeadDifficulty[]
  dificuldade_outros: string | null
  vendedor_id: string | null
  planejamento_id: string | null
  agendamento_id: string | null
  user_id?: string | null
  senha_temporaria?: string | null
  avatar_url?: string | null
  status: string
  created_at: string
  updated_at: string
}

// Tipos auxiliares para o sistema de preparatorios
export type MissaoTipo = Database['public']['Enums']['missao_tipo']

// Tipos de conteúdo disponíveis para preparatórios
// - 'plano': Aparece no app de planejamento
// - 'questoes': Aparece no app Ouse Questões
// - 'preparatorio': Aparecerá em portal futuro
export type PreparatorioContentType = 'plano' | 'questoes' | 'preparatorio'

// Status de processamento N8N
export type N8NStatus = 'none' | 'pending' | 'processing' | 'completed' | 'error'

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
  logo_url: string | null // Logo quadrada do órgão (ex: PRF, PF)
  preco: number | null
  preco_desconto: number | null
  checkout_url: string | null
  descricao_curta: string | null
  descricao_vendas: string | null
  content_types: PreparatorioContentType[] // Onde o preparatório aparece
  // Campos técnicos do concurso
  banca: string | null
  orgao: string | null
  cargo: string | null
  nivel: 'fundamental' | 'medio' | 'superior' | null
  escolaridade: string | null
  modalidade: 'presencial' | 'remoto' | 'hibrido' | null
  regiao: string | null
  // Detalhes do concurso
  salario: number | null
  carga_horaria: string | null
  vagas: number | null
  taxa_inscricao: number | null
  inscricoes_inicio: string | null
  inscricoes_fim: string | null
  data_prevista: string | null
  ano_previsto: number | null
  edital_url: string | null
  raio_x: Record<string, unknown> | null
  // Campos N8N
  requisitos?: string | null
  area_conhecimento_basico?: string | null
  area_conhecimento_especifico?: string | null
  n8n_status?: N8NStatus
  n8n_error_message?: string | null
  n8n_processed_at?: string | null
  // Status de montagem
  montagem_status?: 'pendente' | 'em_andamento' | 'concluida'
  // Timestamps
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
  lead_id?: string | null
  nome_aluno: string
  email: string | null
  mensagem_incentivo: string | null
  hora_acordar: string | null
  hora_dormir: string | null
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

// Tipos para o sistema de agendamento
export type AgendamentoStatus = Database['public']['Enums']['agendamento_status']

export interface VendedorSchedule {
  id: string
  vendedor_id: string
  dia_semana: number // 0=Domingo, 1=Segunda... 6=Sábado
  is_active: boolean
  manha_inicio: string | null
  manha_fim: string | null
  tarde_inicio: string | null
  tarde_fim: string | null
  created_at: string
  updated_at: string
}

export interface Agendamento {
  id: string
  lead_id: string
  vendedor_id: string
  preparatorio_id: string
  data_hora: string
  duracao_minutos: number
  status: AgendamentoStatus
  notas: string | null
  created_at: string
  updated_at: string
}

export interface AgendamentoWithDetails extends Agendamento {
  lead?: Lead
  vendedor?: AdminUser
  preparatorio?: Preparatorio
}

export interface RoundRobinState {
  id: string
  preparatorio_id: string | null
  ultimo_vendedor_id: string | null
  updated_at: string
}

export interface TimeSlot {
  data: string // YYYY-MM-DD
  hora_inicio: string // HH:mm
  hora_fim: string // HH:mm
  vendedor_id: string
  vendedor_nome: string
  vendedor_avatar?: string | null
  vendedor_genero?: UserGender | null
}

export interface LeadWithAgendamento extends Lead {
  agendamento?: Agendamento
  vendedor?: AdminUser
}

export interface MissaoExecutada {
  id: string
  user_id: string
  planejamento_id: string
  rodada_numero: number
  missao_numero: number
  completed_at: string
  created_at: string
}

// Tipos para o Planejador Semanal
export interface AtividadeTipo {
  id: string
  nome: string
  descricao: string | null
  cor: string
  icone: string | null
  is_default: boolean
  ordem: number
  created_at: string
}

export interface AtividadeUsuario {
  id: string
  planejamento_id: string
  nome: string
  descricao: string | null
  cor: string
  icone: string | null
  ordem: number
  created_at: string
}

export interface PlanejadorSlot {
  id: string
  planejamento_id: string
  dia_semana: number // 0=Domingo, 1=Segunda, ..., 6=Sábado
  hora_inicio: string // "HH:MM"
  atividade_tipo_id: string | null
  atividade_usuario_id: string | null
  created_at: string
}

export interface PlanejadorSlotComAtividade extends PlanejadorSlot {
  atividade?: AtividadeTipo | AtividadeUsuario
}

export type AtividadeUnificada = AtividadeTipo | AtividadeUsuario

// Tipos para o Planner de Performance
export type SemaforoCor = 'verde' | 'amarelo' | 'vermelho'
export type SemaforoMotivo = 'cansaco' | 'falta_tempo' | 'procrastinacao' | 'materia_dificil' | 'ansiedade' | 'trabalho'

export interface PlannerDiario {
  id: string
  planejamento_id: string
  data: string // YYYY-MM-DD

  // Cabeçalho
  humor: number | null // 1-5
  energia: number | null // 1-5

  // Execução de estudo
  horas_planejadas: number
  horas_estudadas: number
  missoes_concluidas: number
  questoes_feitas: number
  percentual_acertos: number | null
  materia_principal: string | null
  fez_revisao: boolean
  usou_tecnica_estudo: boolean

  // Checklist Corpo
  exercicio_fisico: boolean
  litros_agua: number | null
  horas_sono: number | null

  // Checklist Mente
  sem_celular_antes: boolean
  revisao_rapida: boolean
  registrou_erro: boolean

  // Checklist Espírito
  oracao_devocional: boolean
  gratidao: string | null
  motivacao_dia: string | null

  // Semáforo
  semaforo: SemaforoCor | null
  semaforo_motivo: string | null

  // Plano amanhã
  meta_minima_amanha: number | null // 30, 60, 90
  missao_prioritaria_amanha: string | null

  created_at: string
  updated_at: string
}

export interface PlannerSemanal {
  diasVerdes: number
  horasEstudadas: number
  missoesTotal: number
  questoesTotal: number
  mediaAcertos: number | null
}

// =====================================================
// Tipos para o Sistema de Conteúdo N8N
// =====================================================

// Nível de dificuldade do conteúdo
export type NivelDificuldade = 'iniciante' | 'intermediario' | 'avancado'

// Status de geração de conteúdo
export type ConteudoStatus = 'pending' | 'generating' | 'completed' | 'error'

// Campos extras do Preparatório para dados do edital (N8N)
// Nota: orgao, banca, nivel, cargo, data_prevista já existem em Preparatorio
export interface PreparatorioN8NFields {
  requisitos: string | null
  area_conhecimento_basico: string | null
  area_conhecimento_especifico: string | null
  n8n_status: N8NStatus
  n8n_error_message: string | null
  n8n_processed_at: string | null
}

// Preparatório com campos N8N (extensão do tipo existente)
export interface PreparatorioComN8N extends Preparatorio, Partial<PreparatorioN8NFields> {}

// Matéria do preparatório
export interface PreparatorioMateria {
  id: string
  preparatorio_id: string
  nome: string
  descricao: string | null
  ordem: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Assunto/tópico de uma matéria
export interface Assunto {
  id: string
  materia_id: string
  nome: string
  descricao: string | null
  sub_assuntos: string[] | null
  ordem: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Conteúdo gerado (texto, áudio, imagem, mapa mental)
export interface Conteudo {
  id: string
  assunto_id: string
  nivel_dificuldade: NivelDificuldade

  // Conteúdo textual
  texto: string | null
  texto_resumo: string | null

  // Áudio (podcast)
  audio_url: string | null
  audio_duracao: number | null // Duração em segundos

  // Imagem de capa
  imagem_capa_url: string | null

  // Mapa mental
  mapa_mental_url: string | null
  mapa_mental_data: Json | null

  // Metadados de geração
  status: ConteudoStatus
  error_message: string | null
  generation_started_at: string | null
  generation_completed_at: string | null

  // Timestamps
  created_at: string
  updated_at: string
}

// Matéria com seus assuntos
export interface MateriaComAssuntos extends PreparatorioMateria {
  assuntos: Assunto[]
}

// Preparatório com matérias e assuntos (estrutura completa N8N)
export interface PreparatorioComMaterias extends PreparatorioComN8N {
  materias: MateriaComAssuntos[]
}

// =====================================================
// Tipos para Payloads e Respostas N8N
// =====================================================

// Payload interno para criar preparatório (interface simplificada)
export interface CreatePreparatorioN8NPayload {
  nome: string
  orgao: string
  banca: string
  nivel: 'fundamental' | 'medio' | 'superior'
  cargo: string
  requisitos?: string
  areas_conhecimento?: string[]
  data_prevista?: string
}

// Payload formatado para envio ao webhook N8N (formato esperado pelo N8N)
export interface N8NPreparatorioWebhookPayload {
  preparatorio_id: string
  nome: string
  orgao: string
  banca: string
  nivel: string
  cargo: string
  requisitos: string
  areas_conhecimento: string[]
  data_prevista: string
  submittedAt: string
  formMode: 'production' | 'test'
}

// Payload para gerar conteúdo via N8N (Etapa 2)
export interface GenerateContentN8NPayload {
  nivel_dificuldade: NivelDificuldade
  materia: string
  assunto_principal: string
  sub_assuntos: string[]
  assunto_id: string
}

// Resposta do webhook de geração de conteúdo
export interface ContentGenerationResponse {
  success: boolean
  message: string
  id: string
  nivel_dificuldade: NivelDificuldade
}

// Resposta genérica do N8N
export interface N8NWebhookResponse {
  success: boolean
  message?: string
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

// =====================================================
// Tipos para Conquistas do Sistema de Planejamento
// =====================================================

export type PlanejamentoConquistaRequisitoTipo =
  | 'missoes_completadas'
  | 'rodadas_completadas'
  | 'dias_consecutivos'
  | 'porcentagem_edital'
  | 'missoes_por_dia'
  | 'tempo_estudo'
  | 'primeiro_acesso'
  | 'semana_perfeita'
  | 'mes_perfeito'
  | 'custom'

export interface PlanejamentoConquista {
  id: string
  nome: string
  descricao: string
  icone: string
  requisito_tipo: PlanejamentoConquistaRequisitoTipo
  requisito_valor: number
  xp_recompensa: number
  moedas_recompensa: number
  is_active: boolean
  is_hidden: boolean
  ordem: number
  mensagem_desbloqueio: string | null
  created_at: string
  updated_at: string
}

export interface PlanejamentoConquistaUsuario {
  id: string
  planejamento_id: string
  conquista_id: string
  desbloqueada_em: string
}

export interface CreatePlanejamentoConquistaInput {
  id: string
  nome: string
  descricao: string
  icone?: string
  requisito_tipo: PlanejamentoConquistaRequisitoTipo
  requisito_valor: number
  xp_recompensa?: number
  moedas_recompensa?: number
  is_active?: boolean
  is_hidden?: boolean
  ordem?: number
  mensagem_desbloqueio?: string | null
}

export interface UpdatePlanejamentoConquistaInput {
  nome?: string
  descricao?: string
  icone?: string
  requisito_tipo?: PlanejamentoConquistaRequisitoTipo
  requisito_valor?: number
  xp_recompensa?: number
  moedas_recompensa?: number
  is_active?: boolean
  is_hidden?: boolean
  ordem?: number
  mensagem_desbloqueio?: string | null
}
